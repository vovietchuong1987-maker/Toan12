/* =========================================================
    — PERFORMANCE & SCALE
   - Adaptive in-memory cache telemetry (no remote telemetry)
   - One-time migration markers to stop repeated full scans
   - Paginated teacher assignment management (60/page)
   - Paginated class member detail (60/page)
   - Student assignment cap (80/query, newest first)
   - Admin directory cursor pagination (100/page) + count aggregates when supported
   - Runtime diagnostics / cache controls
   ========================================================= */
const V34_SCALE_SCHEMA=34;
const V34_TEACHER_ASSIGNMENT_PAGE=60;
const V34_CLASS_MEMBER_PAGE=60;
const V34_STUDENT_ASSIGNMENT_LIMIT=80;
const V34_ADMIN_PAGE=100;
const V34_SLOW_MS=900;
const V34_PERF_KEY='math12hub-v34-perf-session';
let v34TeacherAssignmentPages=new Map();
let v34ClassMemberPages=new Map();
let v34MigrationReady=new Set();
let v34NormalizeReady=new Set();
let v34StorageEstimate=null;
let v34AdminTotals=null;
let v34AdminCountAt=0;
let v34AdminState={
  users:{page:0,cursors:[null],last:null,hasNext:false},
  classes:{page:0,cursors:[null],last:null,hasNext:false}
};

function v34PerfDefault(){return {startedAt:new Date().toISOString(),queries:0,reads:0,cacheHits:0,cacheMisses:0,slow:0,slowOps:[],byKind:{}}}
function v34LoadPerf(){try{let x=JSON.parse(sessionStorage.getItem(V34_PERF_KEY)||'null');return x&&typeof x==='object'?{...v34PerfDefault(),...x}:v34PerfDefault()}catch(_){return v34PerfDefault()}}
let v34Perf=v34LoadPerf();
function v34SavePerf(){try{sessionStorage.setItem(V34_PERF_KEY,JSON.stringify(v34Perf))}catch(_){};if(document.getElementById('v34MetricQueries'))v34RenderScaleCenter(false)}
function v34Record(kind,{docs=0,ms=0,cache=false,aggregation=false}={}){
  if(cache){v34Perf.cacheHits++}
  if(!cache){v34Perf.queries++;v34Perf.reads+=Math.max(0,Number(docs)||0)}
  let k=v34Perf.byKind[kind]||{queries:0,reads:0,totalMs:0,maxMs:0};if(!cache){k.queries++;k.reads+=Math.max(0,Number(docs)||0);k.totalMs+=Math.max(0,Number(ms)||0);k.maxMs=Math.max(k.maxMs,Number(ms)||0)}v34Perf.byKind[kind]=k;
  if(ms>=V34_SLOW_MS){v34Perf.slow++;v34Perf.slowOps=[{kind,ms:Math.round(ms),at:new Date().toISOString()},...(v34Perf.slowOps||[])].slice(0,20)}
  v34SavePerf();
}
async function v34Timed(kind,fn,docCounter=x=>x?.size??(Array.isArray(x)?x.length:0),aggregation=false){let t=performance.now();try{let r=await fn(),ms=performance.now()-t;v34Record(kind,{docs:aggregation?0:docCounter(r),ms,aggregation});return r}catch(err){let ms=performance.now()-t;v34Record(kind,{docs:0,ms,aggregation});throw err}}
function v34FieldDocId(){return firebase?.firestore?.FieldPath?.documentId?.()}
function v34ClassSnapshotCount(c={}){for(let n=33;n>=22;n--){let s=c[`analyticsV${n}`];if(s&&Number.isFinite(Number(s.memberCount)))return Number(s.memberCount)}return null}
async function v34CountQuery(q,kind='count'){
  try{if(q&&typeof q.count==='function'){let s=await v34Timed(kind,()=>q.count().get(),()=>0,true),d=typeof s.data==='function'?s.data():null,n=Number(d?.count??s?.count);return Number.isFinite(n)?n:null}}catch(err){console.warn(' count fallback',kind,err)}return null
}

/* Adaptive  cache: longer when tab is hidden, still invalidated on writes. */
const v34BaseCacheRead=typeof firebaseV19CacheRead==='function'?firebaseV19CacheRead:null;
if(v34BaseCacheRead)firebaseV19CacheRead=function(map,key,force=false){let x=map.get(key),ttl=document.hidden?180000:60000,hit=!force&&x&&Date.now()-x.at<ttl;if(hit){v34Record('memory-cache',{cache:true});return x.value}v34Perf.cacheMisses++;v34SavePerf();return null};

/* Instrument old Low Reads loaders when other modules still use them. */
const v34BaseLoadAssignments=typeof firebaseV19LoadAssignments==='function'?firebaseV19LoadAssignments:null;
if(v34BaseLoadAssignments)firebaseV19LoadAssignments=async function(classId,force=false){let x=firebaseV19AssignmentCache?.get(classId),hit=!force&&x&&Date.now()-x.at<(document.hidden?180000:60000),t=performance.now(),r=await v34BaseLoadAssignments(classId,force);if(!hit)v34Record('assignments-full',{docs:r?.length||0,ms:performance.now()-t});return r};
const v34BaseLoadIndex=typeof firebaseV19LoadSubmissionIndex==='function'?firebaseV19LoadSubmissionIndex:null;
if(v34BaseLoadIndex)firebaseV19LoadSubmissionIndex=async function(classId,opt={}){let key=`${classId}|${opt.uid||'*'}|${opt.status||'*'}`,x=firebaseV19IndexCache?.get(key),hit=!opt.force&&x&&Date.now()-x.at<(document.hidden?180000:60000),t=performance.now(),r=await v34BaseLoadIndex(classId,opt);if(!hit)v34Record('submission-index',{docs:r?.length||0,ms:performance.now()-t});return r};

/* Cross-session migration markers: first  visit can scan; later visits skip full scans. */
const v34BaseLegacyMigration=typeof firebaseMigrateLegacyAssignmentsV18==='function'?firebaseMigrateLegacyAssignmentsV18:null;
if(v34BaseLegacyMigration)firebaseMigrateLegacyAssignmentsV18=async function(classId,opt={}){
  if(v34MigrationReady.has(classId))return 0;let owned=(firebaseOwnedClasses||[]).find(x=>x.id===classId);if(owned?.scaleV34?.legacyMigrationReady){v34MigrationReady.add(classId);return 0}
  let t=performance.now(),n=await v34BaseLegacyMigration(classId,opt);v34Record('migration-v18-once',{docs:0,ms:performance.now()-t});v34MigrationReady.add(classId);
  try{let scale={...(owned?.scaleV34||{}),legacyMigrationReady:true,updatedAt:firebaseServerTimestamp()};await firebaseDb.collection('classes').doc(classId).set({scaleV34:scale,schemaVersion:34},{merge:true});if(owned){owned.scaleV34={...(owned.scaleV34||{}),legacyMigrationReady:true}}}catch(err){console.warn(' migration marker',err)}return n
};
const v34BaseNormalize=typeof v27NormalizeAssignments==='function'?v27NormalizeAssignments:null;
if(v34BaseNormalize)v27NormalizeAssignments=async function(classId){
  if(v34NormalizeReady.has(classId))return;let owned=(firebaseOwnedClasses||[]).find(x=>x.id===classId);if(owned?.scaleV34?.teacherOpsNormalized){v34NormalizeReady.add(classId);return}
  let t=performance.now();await v34BaseNormalize(classId);v34Record('normalize-v27-once',{docs:0,ms:performance.now()-t});v34NormalizeReady.add(classId);
  try{let scale={...(owned?.scaleV34||{}),teacherOpsNormalized:true,updatedAt:firebaseServerTimestamp()};await firebaseDb.collection('classes').doc(classId).set({scaleV34:scale,schemaVersion:34},{merge:true});if(owned){owned.scaleV34={...(owned.scaleV34||{}),teacherOpsNormalized:true}}}catch(err){console.warn(' normalize marker',err)}
};

/* ---------- Teacher assignment management: 60 at a time ---------- */
async function v34LoadTeacherAssignmentsPage(classId,{next=false,reset=false}={}){
  if(reset)v34TeacherAssignmentPages.delete(classId);let st=v34TeacherAssignmentPages.get(classId);
  if(st&&!next)return st.rows;
  if(next&&st&&!st.hasMore)return st.rows;
  let q=firebaseAssignmentsRef(classId).orderBy('createdAt','desc').limit(V34_TEACHER_ASSIGNMENT_PAGE);if(next&&st?.last)q=q.startAfter(st.last);
  let snap=await v34Timed('teacher-assignment-page',()=>q.get());let fetched=snap.docs.map(d=>({id:d.id,data:d.data()})),base=next&&st?st.rows:[],seen=new Set(base.map(x=>x.id)),rows=[...base,...fetched.filter(x=>!seen.has(x.id))].filter(x=>x.data?.status!=='trashed');
  st={rows,last:snap.docs.at(-1)||st?.last||null,hasMore:snap.size===V34_TEACHER_ASSIGNMENT_PAGE,fetched:(st?.fetched||0)+snap.size};v34TeacherAssignmentPages.set(classId,st);return rows
}
function v34AssignmentPagerHTML(classId){let st=v34TeacherAssignmentPages.get(classId);if(!st)return '';return `<div class="v34-pager"><span>Đã tải ${st.rows.length} bài gần nhất${st.hasMore?'còn bài cũ':''}</span>${st.hasMore?`<button class="btn btn-soft" onclick="v34LoadMoreTeacherAssignments('${attrEsc(classId)}')">Tải thêm ${V34_TEACHER_ASSIGNMENT_PAGE}</button>`:'<span class="pill tag-green">Đã hết</span>'}</div>`}
async function v34LoadMoreTeacherAssignments(classId){let cls=(firebaseOwnedClasses||[]).find(x=>x.id===classId);await v34LoadTeacherAssignmentsPage(classId,{next:true});await firebaseRenderTeacherAssignments(classId,cls?.name||'Lớp học')}

/* Student list: newest 80 per target query, using  DESC indexes. */
firebaseV23LoadStudentAssignments=async function(classId,uid,force=false){
  let key=`${classId}|student|${uid}|v34`,cached=firebaseV19CacheRead(firebaseV19AssignmentCache,key,force);if(cached)return cached;
  let ref=firebaseAssignmentsRef(classId),now=firebase.firestore.Timestamp.now(),queries=[
    ref.where('targetMode','==','all').where('opensAt','<=',now).orderBy('opensAt','desc').limit(V34_STUDENT_ASSIGNMENT_LIMIT),
    ref.where('targetUids','array-contains',uid).where('opensAt','<=',now).orderBy('opensAt','desc').limit(V34_STUDENT_ASSIGNMENT_LIMIT)
  ];
  let t=performance.now(),snaps=await Promise.all(queries.map(q=>q.get()));v34Record('student-assignment-window',{docs:snaps.reduce((n,s)=>n+s.size,0),ms:performance.now()-t});let map=new Map();snaps.flatMap(s=>s.docs).forEach(d=>map.set(d.id,{id:d.id,data:d.data()}));let rows=[...map.values()].sort((a,b)=>(firebaseToDate(b.data?.opensAt||b.data?.createdAt)?.getTime()||0)-(firebaseToDate(a.data?.opensAt||a.data?.createdAt)?.getTime()||0));return firebaseV19CacheWrite(firebaseV19AssignmentCache,key,rows)
};

/* ---------- Class detail: member pagination + progress only for loaded members ---------- */
async function v34LoadProgressForMembers(classId,ids=[]){let map=new Map(),field=v34FieldDocId();if(!field||!ids.length)return map;for(let i=0;i<ids.length;i+=25){let chunk=ids.slice(i,i+25),snap=await v34Timed('class-progress-page',()=>firebaseDb.collection('classes').doc(classId).collection('progress').where(field,'in',chunk).get());snap.docs.forEach(d=>map.set(d.id,d.data()||{}))}return map}
async function v34LoadMemberPage(classId,{next=false,reset=false}={}){
  if(reset)v34ClassMemberPages.delete(classId);let st=v34ClassMemberPages.get(classId);if(st&&!next)return st;if(next&&st&&!st.hasMore)return st;
  let field=v34FieldDocId(),ref=firebaseDb.collection('classes').doc(classId).collection('members'),q=field?ref.orderBy(field).limit(V34_CLASS_MEMBER_PAGE):ref.limit(V34_CLASS_MEMBER_PAGE);if(next&&st?.last)q=q.startAfter(st.last);
  let snap=await v34Timed('class-members-page',()=>q.get()),base=next&&st?st.docs:[],seen=new Set(base.map(d=>d.id)),docs=[...base,...snap.docs.filter(d=>!seen.has(d.id))],total=st?.total;
  if(total==null)total=await v34CountQuery(ref,'class-members-count');
  st={docs,last:snap.docs.at(-1)||st?.last||null,hasMore:snap.size===V34_CLASS_MEMBER_PAGE,total};v34ClassMemberPages.set(classId,st);return st
}
function v34MemberPagerHTML(classId,st){let total=st.total==null?(st.docs.length+(st.hasMore?'+':'')):st.total;return `<div class="v34-pager"><span>Đã tải ${st.docs.length}/${total} học sinh</span>${st.hasMore?`<button class="btn btn-soft" onclick="v34LoadMoreClassMembers('${attrEsc(classId)}')">Tải thêm ${V34_CLASS_MEMBER_PAGE}</button>`:'<span class="pill tag-green">Đã hết</span>'}</div>`}
async function v34RenderClassDetail(classId){
  let box=document.getElementById('onlineClassDetail');if(!box)return;let st=await v34LoadMemberPage(classId),owned=(firebaseOwnedClasses||[]).find(x=>x.id===classId),c=owned||{},ids=st.docs.map(d=>d.id),pm=await v34LoadProgressForMembers(classId,ids),rows=st.docs.map(d=>{let m=d.data()||{},p=pm.get(d.id)||{},s=m.status==='suspended'?'suspended':'active';return `<tr><td><b>${esc(m.name||m.email||d.id)}</b><br><small>${esc(m.email||'')}</small></td><td><span class="v25-account-status ${s==='suspended'?'locked':'active'}">${s==='suspended'?'● Tạm khóa':'● Hoạt động'}</span></td><td>${p.doneCount==null?'—':`${p.doneCount}/${p.totalLessons||TOTAL}`}</td><td class="score">${p.lastScore==null?'—':Number(p.lastScore).toFixed(2)}</td><td>${p.accuracy==null?'—':Math.round(p.accuracy*100)+'%'}</td><td>${(p.weakSkills||[]).slice(0,2).map(x=>`<span class="pill tag-red">${esc(x.code)}</span>`).join(' ')||'—'}</td><td><div class="admin-row-actions"><button class="btn ${s==='suspended'?'btn-blue':'btn-soft'}" onclick="firebaseSetMemberStatus('${attrEsc(classId)}','${attrEsc(d.id)}','${s==='suspended'?'active':'suspended'}')">${s==='suspended'?'Mở lại':'Tạm khóa'}</button><button class="btn btn-danger" onclick="firebaseRemoveStudentFromClass('${attrEsc(classId)}','${attrEsc(d.id)}')">Gỡ khỏi lớp</button></div></td></tr>`}).join(''),total=st.total??v34ClassSnapshotCount(c)??(st.docs.length+(st.hasMore?'+':''));
  box.innerHTML=`<div class="exam-preview-head"><div><h3>${esc(c.name||'Lớp học')}</h3><div class="exam-preview-chips"><span class="join-code">${esc(c.joinCode||'')}</span><span class="pill">${total} học sinh</span><span class="pill tag-green">${V34_CLASS_MEMBER_PAGE}/lần</span>${c.accessStatus==='locked'?'<span class="pill tag-red">Admin đang khóa lớp</span>':''}</div></div></div><div class="firebase-banner mt"><b>⚡  Scale:</b> chỉ tải tiến độ của các học sinh đang hiển thị. Bấm “Tải thêm” nếu cần xem phần còn lại.</div><div class="table-wrap mt"><table class="table online-member-table"><thead><tr><th>Học sinh</th><th>Trạng thái</th><th>Tiến độ</th><th>Điểm gần nhất</th><th>Chính xác</th><th>Mã yếu</th><th>Quản lý</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Chưa có học sinh.</td></tr>'}</tbody></table></div>${v34MemberPagerHTML(classId,st)}`;typesetMath(box)
}
firebaseShowClass=async function(classId){if(!requireTeacher('Quản lý lớp'))return;firebaseSelectedClassId=classId;let box=document.getElementById('onlineClassDetail');if(!box||!firebaseUser)return;box.innerHTML='<div class="online-empty"> đang tải trang học sinh đầu tiên…</div>';try{await firebaseMigrateLegacyAssignmentsV18(classId,{silent:true});await v27NormalizeAssignments?.(classId);await firebaseEnsureLowReadsV19(classId,{silent:true});await v34RenderClassDetail(classId);let c=(firebaseOwnedClasses||[]).find(x=>x.id===classId);await firebaseRenderTeacherAssignments(classId,c?.name||'Lớp học')}catch(err){box.innerHTML=`<div class="firebase-banner error">${esc(firebaseErrorText(err))}</div>`}}
async function v34LoadMoreClassMembers(classId){await v34LoadMemberPage(classId,{next:true});await v34RenderClassDetail(classId)}

/* ---------- Teacher dashboard: light first page, full analytics only on demand ---------- */
function v34LatestClassSnapshot(c={}){for(let n=34;n>=22;n--){let x=c[`analyticsV${n}`];if(x&&typeof x==='object')return x}return null}
async function v34LoadStatsForMembers(classId,ids=[]){let map=new Map(),field=v34FieldDocId();if(!field||!ids.length)return map;for(let i=0;i<ids.length;i+=25){let chunk=ids.slice(i,i+25),snap=await v34Timed('student-stats-page',()=>firebaseStudentStatsRef(classId).where(field,'in',chunk).get());snap.docs.forEach(d=>map.set(d.id,d.data()||{}))}return map}
async function v34LoadPendingPreview(classId){let q=firebaseSubmissionIndexRef(classId).where('status','==','submitted').limit(300),snap=await v34Timed('pending-preview',()=>q.get());return {rows:snap.docs.map(d=>({id:d.id,...(d.data()||{})})),capped:snap.size===300}}
async function v34BuildTeacherDashboardPage(classId,{reset=false}={}){
  let owned=(firebaseOwnedClasses||[]).find(x=>x.id===classId)||{},cref=firebaseDb.collection('classes').doc(classId),memberState=await v34LoadMemberPage(classId,{reset}),assignmentRows=await v34LoadTeacherAssignmentsPage(classId,{reset}),ids=memberState.docs.map(d=>d.id),[clsSnap,pm,sm,pending]=await Promise.all([v34Timed('class-doc',()=>cref.get()),v34LoadProgressForMembers(classId,ids),v34LoadStatsForMembers(classId,ids),v34LoadPendingPreview(classId)]),classData=clsSnap.exists?clsSnap.data()||{}:owned,members=memberState.docs.map(d=>({id:d.id,data:d.data()||{}})),progress=ids.filter(id=>pm.has(id)).map(id=>({id,data:pm.get(id)})),studentStats=ids.filter(id=>sm.has(id)).map(id=>({id,data:sm.get(id)}));
  let c=firebaseBuildTeacherDashboardData({classId,classData,members,progress,assignments:assignmentRows,studentStats,pendingSubmissions:pending.rows}),snap=v34LatestClassSnapshot(classData)||v34LatestClassSnapshot(owned),total=memberState.total??v34ClassSnapshotCount(classData)??c.memberCount,memberPartial=memberState.hasMore||(Number.isFinite(Number(total))&&Number(total)>members.length),assignmentState=v34TeacherAssignmentPages.get(classId),assignmentPartial=!!assignmentState?.hasMore;
  c.v34Partial=memberPartial||assignmentPartial;c.v34MemberPartial=memberPartial;c.v34AssignmentPartial=assignmentPartial;c.v34PendingCapped=pending.capped;c.v34LoadedMembers=members.length;c.v34TotalMembers=Number.isFinite(Number(total))?Number(total):members.length;c.v34Snapshot=snap||null;
  if(snap){if(Number.isFinite(Number(snap.memberCount)))c.memberCount=Number(snap.memberCount);else c.memberCount=c.v34TotalMembers;if(Number.isFinite(Number(snap.assignmentCount)))c.assignmentCount=Number(snap.assignmentCount);if(snap.completionRate!=null)c.completionRate=Number(snap.completionRate);if(snap.averageScore!=null)c.averageScore=Number(snap.averageScore);if(Number.isFinite(Number(snap.needsHelp)))c.needsHelp=Number(snap.needsHelp)}else c.memberCount=c.v34TotalMembers;
  return c
}
function v34RenderTeacherPager(c){let box=document.getElementById('v34TeacherStudentPager');if(!box)return;if(c?.v34FullAnalytics){box.innerHTML=`<div class="v34-pager"><span>Đã tải đầy đủ ${c.students?.length||0} học sinh cho phiên phân tích này.</span><span class="pill tag-green">Full analytics</span></div>`;return}let st=v34ClassMemberPages.get(c.classId),total=st?.total??c.v34TotalMembers??c.students?.length??0;box.innerHTML=`<div class="v34-pager"><span>Dashboard đang hiển thị ${c.students?.length||0}/${total} học sinh${c.v34PendingCapped?'hàng chờ chấm chỉ lấy 300 mục đầu':''}</span>${st?.hasMore?`<button class="btn btn-soft" onclick="v34LoadMoreTeacherDashboard('${attrEsc(c.classId)}')">Tải thêm ${V34_CLASS_MEMBER_PAGE}</button>`:'<span class="pill tag-green">Đã tải hết học sinh</span>'}${c.v34Partial?`<button class="btn btn-blue" onclick="v34LoadFullTeacherAnalytics('${attrEsc(c.classId)}')">Tải phân tích đầy đủ</button>`:''}</div>`}
const v34FullTeacherRefresh=typeof firebaseRefreshTeacherDashboard==='function'?firebaseRefreshTeacherDashboard:null;
firebaseRefreshTeacherDashboard=async function(force=false){
  if(!requireTeacher('Dashboard giáo viên'))return;if(firebaseTeacherDashboardLoading||!document.getElementById('page-teacher')?.classList.contains('active'))return;if(!firebaseUser||!firebaseDb){renderTeacher();return}
  let owned=firebaseOwnedClasses||[],classId=firebaseSelectedClassId&&owned.some(c=>c.id===firebaseSelectedClassId)?firebaseSelectedClassId:(owned[0]?.id||'');if(!classId){renderTeacher();return}firebaseSelectedClassId=classId;if(!force&&firebaseTeacherDashboardCache?.classId===classId){renderTeacherDashboardCache(firebaseTeacherDashboardCache);v34RenderTeacherPager(firebaseTeacherDashboardCache);return}
  firebaseTeacherDashboardLoading=true;let notice=document.getElementById('teacherLiveNotice');if(notice){notice.className='firebase-banner warn';notice.textContent=' đang tải trang Dashboard nhẹ…'}
  try{await firebaseMigrateLegacyAssignmentsV18(classId,{silent:true});await firebaseEnsureLowReadsV19(classId,{silent:true});let c=await v34BuildTeacherDashboardPage(classId,{reset:!!force});firebaseTeacherDashboardCache=c;renderTeacherDashboardCache(c);v34RenderTeacherPager(c);if(notice){notice.className='firebase-banner';notice.textContent=`⚡  Scale • ${c.className} • tải ${c.v34LoadedMembers}/${c.v34TotalMembers} học sinh • ${c.v34Partial?'phân tích sâu tải khi cần':'đã đủ dữ liệu'} • ${new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}`};if(typeof v27RenderTeacherToday==='function')await v27RenderTeacherToday(classId,force)}catch(err){console.error(' teacher dashboard',err);if(notice){notice.className='firebase-banner error';notice.textContent=firebaseErrorText(err)}resetTeacherDashboardUI(false)}finally{firebaseTeacherDashboardLoading=false}
};
async function v34LoadMoreTeacherDashboard(classId){if(firebaseTeacherDashboardLoading)return;firebaseTeacherDashboardLoading=true;try{await v34LoadMemberPage(classId,{next:true});let c=await v34BuildTeacherDashboardPage(classId);firebaseTeacherDashboardCache=c;renderTeacherDashboardCache(c);v34RenderTeacherPager(c);let notice=document.getElementById('teacherLiveNotice');if(notice){notice.className='firebase-banner';notice.textContent=`⚡  Scale • đã tải ${c.v34LoadedMembers}/${c.v34TotalMembers} học sinh. Bản đồ năng lực toàn lớp chỉ tải khi thầy/cô yêu cầu.`}}catch(err){alert(firebaseErrorText(err))}finally{firebaseTeacherDashboardLoading=false}}
async function v34LoadFullTeacherAnalytics(classId){if(!v34FullTeacherRefresh)return;let ok=confirm('Tải phân tích đầy đủ của lớp? Thao tác này có thể đọc toàn bộ members/progress/studentStats của lớp và chỉ nên dùng khi cần xem bản đồ năng lực chi tiết.');if(!ok)return;firebaseTeacherDashboardCache=null;let notice=document.getElementById('teacherLiveNotice');if(notice){notice.className='firebase-banner warn';notice.textContent='Đang tải phân tích đầy đủ…'};await v34FullTeacherRefresh(true);let c=firebaseTeacherDashboardCache;if(c){c.v34FullAnalytics=true;c.v34Partial=false;v34RenderTeacherPager(c)} }

/* Do not publish a class snapshot from a partial  page. */
const v34BasePersistClassSummary=typeof v22PersistClassSummary==='function'?v22PersistClassSummary:null;
if(v34BasePersistClassSummary)v22PersistClassSummary=async function(c){if(c?.v34Partial)return;return v34BasePersistClassSummary(c)};
const v34BaseTeacherAnalytics=typeof v22RenderTeacherAnalytics==='function'?v22RenderTeacherAnalytics:null;
if(v34BaseTeacherAnalytics)v22RenderTeacherAnalytics=function(c){if(!c?.v34Partial)return v34BaseTeacherAnalytics(c);v22LastClassData=c;let cc=c,s=c.v34Snapshot||{};if(s.verifiedEvidence!=null&&s.verifiedAccuracy!=null){cc={...c,verifiedCompetencyV31:{schemaVersion:31,totalAttempts:Number(s.verifiedEvidence)||0,totalCredit:(Number(s.verifiedEvidence)||0)*Number(s.verifiedAccuracy),totalCorrect:0,codes:{},lessons:{},chapters:{},levels:{},accuracy:Number(s.verifiedAccuracy)}}}if(typeof v22RenderClassComparison==='function')v22RenderClassComparison(cc);let msg='<div class="teacher-live-empty">⚡  không quét toàn bộ lớp ở lần mở đầu. Bấm “Tải phân tích đầy đủ” khi cần heatmap/xu hướng/gợi ý của toàn lớp.</div>';for(const id of ['v22ClassTrend','v22SkillHeatmap','v22AssignmentSuggestions']){let e=document.getElementById(id);if(e)e.innerHTML=msg}};
const v34BaseCompetencyRender=typeof v31RenderTeacherCompetency==='function'?v31RenderTeacherCompetency:null;
if(v34BaseCompetencyRender)v31RenderTeacherCompetency=function(c){if(!c?.v34Partial)return v34BaseCompetencyRender(c);v31LastClassData=c;let s=c.v34Snapshot||{},set=(id,v)=>{let e=document.getElementById(id);if(e)e.textContent=v};set('v31MetricEvidence',s.verifiedEvidence??'—');set('v31MetricAccuracy',s.verifiedAccuracy==null?'—':Math.round(Number(s.verifiedAccuracy)*100)+'%');set('v31MetricCoverage',s.verifiedCoverage??'—');set('v31MetricWeak','—');let html=`<div class="teacher-live-empty">⚡ Bản đồ Chương → Bài → Mã kiến thức cần tổng hợp toàn bộ studentStats.  để phần này ở chế độ lazy-load để tiết kiệm Reads.<br><br><button class="btn btn-blue" onclick="v34LoadFullTeacherAnalytics('${attrEsc(c.classId)}')">Tải phân tích đầy đủ</button></div>`;for(const id of ['v31LevelSummary','v31CompetencyHierarchy','v31StudentMatrix']){let e=document.getElementById(id);if(e)e.innerHTML=html}let n=document.getElementById('v31VerifiedNote');if(n)n.innerHTML='<b> Scale:</b> các chỉ số tổng quan phía trên lấy từ snapshot lớp gần nhất; dữ liệu chi tiết chỉ đọc khi giáo viên yêu cầu.'};

/* Invalidate  pages on writes. */
const v34BaseInvalidate=typeof firebaseV19InvalidateClass==='function'?firebaseV19InvalidateClass:null;
if(v34BaseInvalidate)firebaseV19InvalidateClass=function(classId){v34TeacherAssignmentPages.delete(classId);v34ClassMemberPages.delete(classId);return v34BaseInvalidate(classId)};
for(const name of ['firebaseSetMemberStatus','firebaseRemoveStudentFromClass']){let base=globalThis[name];if(typeof base==='function')globalThis[name]=async function(classId,...args){v34ClassMemberPages.delete(classId);return base(classId,...args)}}

/* ---------- Admin cursor pagination ---------- */
async function v34AdminAggregateCounts(force=false){if(!force&&v34AdminTotals&&Date.now()-v34AdminCountAt<60000)return v34AdminTotals;let u=firebaseDb.collection('users'),c=firebaseDb.collection('classes');let [users,teachers,students,locked,classesTotal,activeClasses]=await Promise.all([v34CountQuery(u,'count-users'),v34CountQuery(u.where('role','==','teacher'),'count-teachers'),v34CountQuery(u.where('role','==','student'),'count-students'),v34CountQuery(u.where('accountStatus','==','locked'),'count-locked'),v34CountQuery(c,'count-classes'),v34CountQuery(c.where('status','==','active'),'count-active-classes')]);v34AdminTotals={users,teachers,students,locked,classesTotal,activeClasses};v34AdminCountAt=Date.now();return v34AdminTotals}
async function v34AdminFetchPage(kind){let st=v34AdminState[kind],col=firebaseDb.collection(kind==='users'?'users':'classes'),field=v34FieldDocId(),q=field?col.orderBy(field).limit(V34_ADMIN_PAGE):col.limit(V34_ADMIN_PAGE),cursor=st.cursors[st.page];if(cursor)q=q.startAfter(cursor);let snap=await v34Timed(`admin-${kind}-page`,()=>q.get());st.last=snap.docs.at(-1)||null;st.hasNext=snap.size===V34_ADMIN_PAGE;return snap.docs.map(d=>({id:d.id,...d.data()}))}
const v34BaseAdminRenderData=typeof v25AdminRenderData==='function'?v25AdminRenderData:null;
if(v34BaseAdminRenderData)v25AdminRenderData=function(){v34BaseAdminRenderData();v34ApplyAdminTotals();v34RenderAdminPagers();v34RenderScaleCenter(false)};
v25AdminRefresh=async function(force=true){
  if(!v25AdminRequire()||!firebaseDb||v25AdminLoading)return;v25AdminLoading=true;document.getElementById('page-admin')?.classList.add('admin-loading');try{let [users,classes,aSnap,totals]=await Promise.all([v34AdminFetchPage('users'),v34AdminFetchPage('classes'),v34Timed('admin-audit',()=>firebaseDb.collection('adminAudit').orderBy('createdAt','desc').limit(50).get()),v34AdminAggregateCounts(force)]);v25AdminUsers=users;v25AdminClasses=classes;v25AdminAudit=aSnap.docs.map(d=>({id:d.id,...d.data()}));v25AdminLastLoadedAt=Date.now();v34AdminTotals=totals;v25AdminRenderData()}catch(err){console.error(' admin refresh',err);let b=document.getElementById('v25AdminBanner');if(b){b.className='firebase-banner error';b.textContent=firebaseErrorText(err)}}finally{v25AdminLoading=false;document.getElementById('page-admin')?.classList.remove('admin-loading')}};
async function v34AdminPage(kind,delta){let st=v34AdminState[kind];if(delta>0){if(!st.hasNext)return;st.cursors[st.page+1]=st.last;st.page++}else if(delta<0&&st.page>0)st.page--;await v25AdminRefresh(false)}
function v34RenderAdminPagers(){for(const kind of ['users','classes']){let st=v34AdminState[kind],id=kind==='users'?'v34UserPager':'v34ClassPager',box=document.getElementById(id),total=kind==='users'?v34AdminTotals?.users:null;if(kind==='classes')total=v34AdminTotals?.classesTotal; if(!box)continue;box.innerHTML=`<button class="btn btn-soft" ${st.page===0?'disabled':''} onclick="v34AdminPage('${kind}',-1)">← Trang trước</button><span>Trang ${st.page+1} • tối đa ${V34_ADMIN_PAGE}/trang${total!=null?`hệ thống ${total}`:''}</span><button class="btn btn-soft" ${!st.hasNext?'disabled':''} onclick="v34AdminPage('${kind}',1)">Trang sau →</button>`}}
function v34ApplyAdminTotals(){let t=v34AdminTotals;if(!t)return;let vals={v25MetricUsers:t.users,v25MetricTeachers:t.teachers,v25MetricStudents:t.students,v25MetricLocked:t.locked,v25MetricClasses:t.activeClasses};Object.entries(vals).forEach(([id,v])=>{let e=document.getElementById(id);if(e&&v!=null)e.textContent=v});let b=document.getElementById('v25AdminBanner');if(b&&isAdminRole?.()){b.className='firebase-banner';b.textContent=` Scale Console • danh bạ phân trang ${V34_ADMIN_PAGE} document/trang; tổng số dùng aggregation khi SDK hỗ trợ. Tìm kiếm/lọc áp dụng trên trang đang mở.`}}

/* Admin class table: prefer newest analytics snapshot. */
const v34BaseAdminRenderClasses=typeof v25AdminRenderClasses==='function'?v25AdminRenderClasses:null;
if(v34BaseAdminRenderClasses)v25AdminRenderClasses=function(){v34BaseAdminRenderClasses();let table=document.getElementById('v25ClassTable');if(!table)return;/* base remains fully compatible; pager clarifies current page */};

/* ---------- Performance center ---------- */
async function v34UpdateStorageEstimate(){try{if(navigator.storage?.estimate)v34StorageEstimate=await navigator.storage.estimate()}catch(_){}v34RenderScaleCenter(false)}
function v34FmtBytes(n){n=Number(n)||0;if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;if(n<1073741824)return `${(n/1048576).toFixed(1)} MB`;return `${(n/1073741824).toFixed(2)} GB`}
function v34RenderScaleCenter(refreshStorage=false){let q=document.getElementById('v34MetricQueries');if(!q)return;let totalCache=(v34Perf.cacheHits||0)+(v34Perf.cacheMisses||0),hit=totalCache?Math.round(100*(v34Perf.cacheHits||0)/totalCache):null,usage=v34StorageEstimate?.usage,quota=v34StorageEstimate?.quota;document.getElementById('v34MetricReads').textContent=String(Math.round(v34Perf.reads||0));q.textContent=String(v34Perf.queries||0);document.getElementById('v34MetricCache').textContent=hit==null?'—':`${hit}%`;document.getElementById('v34MetricSlow').textContent=String(v34Perf.slow||0);document.getElementById('v34MetricStorage').textContent=usage==null?'—':v34FmtBytes(usage);let advice=[];if(!navigator.onLine)advice.push(['danger','Đang offline',' sẽ ưu tiên cache/local data; các thao tác cloud sẽ chờ kết nối lại.']);if((v34Perf.reads||0)>1500)advice.push(['warn','Reads phiên đang cao',`Ước tính ${Math.round(v34Perf.reads)} document. Tránh bấm Làm mới liên tục ở Dashboard lớn.`]);if((v34Perf.slow||0)>2)advice.push(['warn','Có truy vấn chậm',`${v34Perf.slow} thao tác vượt ${V34_SLOW_MS} ms. Kiểm tra mạng và kích thước lớp.`]);if(totalCache>=6&&hit<40)advice.push(['info','Cache hit còn thấp',`Hiện ${hit}%. Sau lần mở đầu,  sẽ tái sử dụng dữ liệu 60–180 giây nếu chưa có ghi mới.`]);if(usage&&quota&&usage/quota>.8)advice.push(['warn','Bộ nhớ trình duyệt gần đầy',`${v34FmtBytes(usage)}/${v34FmtBytes(quota)}. Nên xuất backup rồi dọn dữ liệu không còn dùng.`]);if(!advice.length)advice.push(['good','Hệ thống đang ổn','Phân trang và cache  đang giữ tải trong giới hạn hợp lý.']);let box=document.getElementById('v34ScaleAdvice');if(box)box.innerHTML=advice.map(a=>`<div class="v34-advice ${a[0]}"><b>${esc(a[1])}</b><span>${esc(a[2])}</span></div>`).join('');let status=document.getElementById('v34ScaleStatus');if(status)status.textContent=`Scale mode: Auto • ${navigator.connection?.effectiveType||'network'}`;if(refreshStorage)v34UpdateStorageEstimate()}
function v34ClearRuntimeCaches(){firebaseV19AssignmentCache?.clear?.();firebaseV19IndexCache?.clear?.();v34TeacherAssignmentPages.clear();v34ClassMemberPages.clear();firebaseTeacherDashboardCache=null;v29DuplicateCache&&(v29DuplicateCache.signature='');examToast?.('Đã xóa cache runtime . Dữ liệu học tập không bị xóa.');v34RenderScaleCenter(true)}
function v34Diagnostics(){return {appVersion:APP_VERSION,scaleSchema:V34_SCALE_SCHEMA,createdAt:new Date().toISOString(),online:navigator.onLine,network:{effectiveType:navigator.connection?.effectiveType||'',downlink:navigator.connection?.downlink||null,rtt:navigator.connection?.rtt||null},device:{language:navigator.language,platform:navigator.platform||'',memory:navigator.deviceMemory||null,cores:navigator.hardwareConcurrency||null},storage:v34StorageEstimate?{usage:v34StorageEstimate.usage||0,quota:v34StorageEstimate.quota||0}:null,performance:v34Perf,limits:{teacherAssignmentPage:V34_TEACHER_ASSIGNMENT_PAGE,classMemberPage:V34_CLASS_MEMBER_PAGE,studentAssignmentPerQuery:V34_STUDENT_ASSIGNMENT_LIMIT,adminPage:V34_ADMIN_PAGE},cache:{assignmentEntries:firebaseV19AssignmentCache?.size||0,indexEntries:firebaseV19IndexCache?.size||0,classPages:v34ClassMemberPages.size,assignmentPages:v34TeacherAssignmentPages.size}}}
function v34ExportDiagnostics(){let payload=v34Diagnostics(),name=`math12hub-v35-scale-diagnostics-${new Date().toISOString().slice(0,10)}.json`;if(typeof triggerJsonDownload==='function')return triggerJsonDownload(payload,name);let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/* Refresh performance UI on connectivity changes. */
window.addEventListener('online',()=>v34RenderScaleCenter(false));window.addEventListener('offline',()=>v34RenderScaleCenter(false));setTimeout(()=>v34UpdateStorageEstimate(),500);
