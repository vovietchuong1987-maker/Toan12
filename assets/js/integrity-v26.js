/* =========================================================
   V26 — DATA INTEGRITY, RECOVERY & SYSTEM HEALTH
   - Recycle bin for teacher questions/custom exams (synced via Firestore)
   - Safety checkpoints before destructive local operations
   - IndexedDB recovery bundles before permanent assignment/submission deletion
   - Admin-only integrity scanner + conservative safe repair tools
   ========================================================= */
const V26_SCHEMA_VERSION=26;
const V26_HEALTH_LIMITS={users:1000,classes:1000,joinCodes:700,members:2500,memberships:2500,assignments:1800,answerKeys:1800,indexes:3000};
let v26HealthContext={users:new Map(),classes:new Map(),joinCodes:new Map()};
let v26HealthState={status:'idle',issues:[],scannedDocs:0,score:null,repairable:0,scannedAt:null,truncated:[],lastRepair:null};

function v26Clone(x){return JSON.parse(JSON.stringify(x))}
function v26EnsureRecycleBin(){
  state.recycleBinV26=state.recycleBinV26&&typeof state.recycleBinV26==='object'?state.recycleBinV26:{};
  state.recycleBinV26.questions=Array.isArray(state.recycleBinV26.questions)?state.recycleBinV26.questions:[];
  state.recycleBinV26.customExams=Array.isArray(state.recycleBinV26.customExams)?state.recycleBinV26.customExams:[];
  return state.recycleBinV26;
}
function v26TrashCollection(kind){const b=v26EnsureRecycleBin();return kind==='question'?b.questions:b.customExams}
function v26TrashItemId(kind,sourceId=''){return `${kind==='question'?'Q':'E'}TR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}-${String(sourceId).replace(/[^A-Za-z0-9_-]/g,'').slice(0,24)}`}
async function v26SafetyCheckpoint(reason='dangerous-operation'){
  try{if(typeof v21CreateRecoverySnapshot==='function')return await v21CreateRecoverySnapshot(`v26-${String(reason).replace(/[^a-z0-9_-]/gi,'-')}`,false)}catch(err){console.warn('V26 safety checkpoint',err)}
  return null;
}
function v26TeacherRecycleDocs(){const b=v26EnsureRecycleBin();return [...b.questions,...b.customExams].map(x=>v26Clone(x))}
function v26SetTeacherRecycleDocs(items=[]){
  const b={questions:[],customExams:[]};
  (items||[]).forEach(x=>{if(!x||!x.id)return;(x.kind==='question'?b.questions:b.customExams).push(v26Clone(x))});
  state.recycleBinV26=b;
}
function v26MergeTeacherRecycleDocs(items=[]){
  const b=v26EnsureRecycleBin(),all=new Map([...b.questions,...b.customExams].map(x=>[x.id,x]));
  (items||[]).forEach(x=>x?.id&&all.set(x.id,v26Clone(x)));
  v26SetTeacherRecycleDocs([...all.values()]);
}
async function v26TrashLocalContent(kind,item){
  if(!item)return false;await v26SafetyCheckpoint(`${kind}-trash`);
  const arr=v26TrashCollection(kind),sourceId=String(item.id||'');
  arr.unshift({id:v26TrashItemId(kind,sourceId),kind,sourceId,item:v26Clone(item),trashedAt:new Date().toISOString(),schemaVersion:26});
  if(arr.length>120)arr.length=120;
  save({reason:`v26-${kind}-trash`});return true;
}
function v26UniqueRestoredId(kind,base){
  const active=kind==='question'?(state.questionBank||[]):(state.customExams||[]),ids=new Set(active.map(x=>String(x.id||'')));if(!ids.has(base))return base;
  let n=2,id=`${base}-RESTORED`;while(ids.has(id))id=`${base}-RESTORED-${n++}`;return id;
}
async function v26RestoreLocalTrash(kind,trashId){
  if(!requireTeacher('Khôi phục dữ liệu'))return;const arr=v26TrashCollection(kind),i=arr.findIndex(x=>x.id===trashId);if(i<0)return;
  await v26SafetyCheckpoint(`${kind}-restore`);const entry=arr[i],item=v26Clone(entry.item||{}),oldId=String(item.id||entry.sourceId||'RESTORED');item.id=v26UniqueRestoredId(kind,oldId);
  if(kind==='question'){state.questionBank=state.questionBank||[];state.questionBank.unshift(item)}else{state.customExams=state.customExams||[];state.customExams.unshift(item)}
  arr.splice(i,1);save({reason:`v26-${kind}-restore`});closeModal();if(kind==='question')renderQuestionBank?.(true);else renderSavedCustomExams?.();v26OpenContentTrash();examToast?.(`Đã khôi phục ${item.id}${item.id!==oldId?' với mã mới để tránh trùng':''}.`)
}
async function v26PurgeLocalTrash(kind,trashId){
  if(!requireTeacher('Xóa vĩnh viễn dữ liệu'))return;const arr=v26TrashCollection(kind),i=arr.findIndex(x=>x.id===trashId);if(i<0)return;const e=arr[i];
  if(!confirm(`Xóa vĩnh viễn ${kind==='question'?'câu hỏi':'đề'} “${e.sourceId||e.item?.title||''}” khỏi Thùng rác?`))return;
  await v26SafetyCheckpoint(`${kind}-purge`);arr.splice(i,1);save({reason:`v26-${kind}-purge`});closeModal();v26OpenContentTrash();
}
function v26OpenContentTrash(){
  if(!requireTeacher('Thùng rác nội dung'))return;const b=v26EnsureRecycleBin(),rows=[];
  b.questions.forEach(e=>rows.push(`<div class="trash-class-card"><div><b>❓ ${esc(e.sourceId||e.item?.id||'Câu hỏi')}</b><small>Câu hỏi • ${esc(new Date(e.trashedAt||Date.now()).toLocaleString('vi-VN'))}</small></div><div class="online-actions"><button class="btn btn-blue" onclick="v26RestoreLocalTrash('question','${attrEsc(e.id)}')">Khôi phục</button><button class="btn btn-danger" onclick="v26PurgeLocalTrash('question','${attrEsc(e.id)}')">Xóa vĩnh viễn</button></div></div>`));
  b.customExams.forEach(e=>rows.push(`<div class="trash-class-card"><div><b>▧ ${esc(e.item?.title||e.sourceId||'Đề kiểm tra')}</b><small>Đề đã lưu • ${esc(new Date(e.trashedAt||Date.now()).toLocaleString('vi-VN'))}</small></div><div class="online-actions"><button class="btn btn-blue" onclick="v26RestoreLocalTrash('exam','${attrEsc(e.id)}')">Khôi phục</button><button class="btn btn-danger" onclick="v26PurgeLocalTrash('exam','${attrEsc(e.id)}')">Xóa vĩnh viễn</button></div></div>`));
  const body=`<div class="firebase-banner"><b>🛡 Thùng rác V26:</b> câu hỏi/đề bị xóa được chuyển vào đây và đồng bộ cùng tài khoản giáo viên. Khôi phục không làm mất bản đang có; nếu trùng mã, V26 tự tạo mã mới.</div><div class="trash-list mt">${rows.join('')||'<div class="online-empty">Thùng rác nội dung đang trống.</div>'}</div>`;
  openModal('Thùng rác nội dung',`V26 • ${b.questions.length} câu • ${b.customExams.length} đề`,body,'<button class="btn btn-soft" onclick="closeModal()">Đóng</button>');
}

async function v26StoreRecoveryBundle(key,payload){
  try{if(typeof v21VaultPut!=='function')return false;await v21VaultPut('kv',{key:`cloud-recovery-${key}`,kind:'cloud-recovery',createdAt:new Date().toISOString(),schemaVersion:26,payload:v26Clone(payload)});return true}catch(err){console.warn('V26 recovery bundle',err);return false}
}
async function v26StoreAssignmentRecoveryBundle(classId,assignmentId){
  if(!firebaseDb)return false;try{
    const ref=firebaseAssignmentsRef(classId).doc(assignmentId),[a,k,s,idx]=await Promise.all([ref.get(),firebaseAnswerKeysRef(classId).doc(assignmentId).get(),ref.collection('submissions').get(),firebaseSubmissionIndexRef(classId).where('assignmentId','==',assignmentId).get()]);
    return await v26StoreRecoveryBundle(`assignment-${classId}-${assignmentId}-${Date.now()}`,{type:'assignment',classId,assignmentId,assignment:a.exists?a.data():null,answerKey:k.exists?k.data():null,submissions:s.docs.map(d=>({id:d.id,data:d.data()})),indexes:idx.docs.map(d=>({id:d.id,data:d.data()}))});
  }catch(err){console.warn('V26 assignment bundle',err);return false}
}
async function v26StoreSubmissionRecoveryBundle(classId,assignmentId,uid){
  if(!firebaseDb)return false;try{const sref=firebaseAssignmentsRef(classId).doc(assignmentId).collection('submissions').doc(uid),iref=firebaseSubmissionIndexRef(classId).doc(firebaseSubmissionIndexId(assignmentId,uid)),[s,i]=await Promise.all([sref.get(),iref.get()]);return await v26StoreRecoveryBundle(`submission-${classId}-${assignmentId}-${uid}-${Date.now()}`,{type:'submission',classId,assignmentId,uid,submission:s.exists?s.data():null,index:i.exists?i.data():null})}catch(err){console.warn('V26 submission bundle',err);return false}
}
async function v26ListCloudRecoveryBundles(){try{if(typeof v21VaultGetAll!=='function')return[];return (await v21VaultGetAll('kv')).filter(x=>x?.kind==='cloud-recovery'||String(x?.key||'').startsWith('cloud-recovery-')).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))}catch(_){return[]}}
async function v26ExportCloudRecovery(key){const x=await v21VaultGet('kv',key);if(!x)return alert('Không tìm thấy gói cứu hộ.');triggerJsonDownload({format:'math12hub-v26-cloud-recovery',version:APP_VERSION,...x},`math12hub-v26-recovery-${Date.now()}.json`)}
async function v26DeleteCloudRecovery(key){if(!confirm('Xóa gói cứu hộ cục bộ này?'))return;await v21VaultDelete('kv',key);closeModal();v21OpenDataSafetyCenter?.()}

function v26Issue(level,type,title,detail,data={},repairable=false){return {id:`${type}:${Math.random().toString(36).slice(2,9)}`,level,type,title,detail,data,repairable}}
function v26HealthScore(issues=[]){let p=0;issues.forEach(x=>p+=x.level==='critical'?18:x.level==='warn'?6:2);return Math.max(0,100-Math.min(100,p))}
function v26PathParts(doc){return String(doc?.ref?.path||'').split('/')}
function v26RenderSystemHealth(){
  const score=document.getElementById('v26HealthScore'),issues=document.getElementById('v26HealthIssues'),repair=document.getElementById('v26HealthRepairable'),docs=document.getElementById('v26HealthDocs'),box=document.getElementById('v26HealthIssueList'),status=document.getElementById('v26HealthStatus');if(!score||!box)return;
  score.textContent=v26HealthState.score==null?'—':`${v26HealthState.score}/100`;issues.textContent=v26HealthState.issues.length;repair.textContent=v26HealthState.repairable;docs.textContent=v26HealthState.scannedDocs||0;
  if(status)status.textContent=v26HealthState.status==='scanning'?'Đang quét…':v26HealthState.scannedAt?`Quét ${new Date(v26HealthState.scannedAt).toLocaleString('vi-VN')}`:'Chưa quét';
  const rows=v26HealthState.issues.slice(0,80).map(x=>`<div class="v26-health-issue ${x.level}"><div><b>${x.level==='critical'?'⛔':x.level==='warn'?'⚠':'ℹ'} ${esc(x.title)}</b><p>${esc(x.detail)}</p></div>${x.repairable?'<span class="v26-repair-chip">Có thể sửa an toàn</span>':''}</div>`).join('');
  box.innerHTML=v26HealthState.status==='scanning'?'<div class="online-empty">Đang kiểm tra liên kết dữ liệu Firestore…</div>':rows||'<div class="firebase-banner"><b>✓ Chưa phát hiện lỗi toàn vẹn trong phạm vi đã quét.</b></div>';
  const note=document.getElementById('v26HealthLimitNote');if(note)note.textContent=v26HealthState.truncated.length?`Đã chạm giới hạn đọc: ${v26HealthState.truncated.join(', ')}. Kết quả là mẫu an toàn, chưa phải kiểm kê toàn bộ.`:'V26 chỉ quét khi admin bấm nút để tránh phát sinh Reads nền.';
}
async function v26SystemHealthScan(){
  if(!v25AdminRequire?.()||!firebaseDb)return;v26HealthState={...v26HealthState,status:'scanning',issues:[],scannedDocs:0,score:null,repairable:0,truncated:[]};v26RenderSystemHealth();
  try{
    const L=V26_HEALTH_LIMITS,[uSnap,cSnap,jSnap,memSnap,shipSnap,aSnap,kSnap,iSnap]=await Promise.all([
      firebaseDb.collection('users').limit(L.users).get(),firebaseDb.collection('classes').limit(L.classes).get(),firebaseDb.collection('joinCodes').limit(L.joinCodes).get(),firebaseDb.collectionGroup('members').limit(L.members).get(),firebaseDb.collectionGroup('memberships').limit(L.memberships).get(),firebaseDb.collectionGroup('assignmentsV18').limit(L.assignments).get(),firebaseDb.collectionGroup('answerKeysV18').limit(L.answerKeys).get(),firebaseDb.collectionGroup('submissionIndexV19').limit(L.indexes).get()
    ]);
    const snaps=[['users',uSnap,L.users],['classes',cSnap,L.classes],['joinCodes',jSnap,L.joinCodes],['members',memSnap,L.members],['memberships',shipSnap,L.memberships],['assignments',aSnap,L.assignments],['answerKeys',kSnap,L.answerKeys],['indexes',iSnap,L.indexes]];snaps.forEach(([n,s,l])=>{v26HealthState.scannedDocs+=s.size;if(s.size>=l)v26HealthState.truncated.push(n)});
    const users=new Map(uSnap.docs.map(d=>[d.id,{id:d.id,...d.data()}])),classes=new Map(cSnap.docs.map(d=>[d.id,{id:d.id,...d.data()}])),joinCodes=new Map(jSnap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
    v26HealthContext={users,classes,joinCodes};
    const complete={
      users:uSnap.size<L.users,
      classes:cSnap.size<L.classes,
      joinCodes:jSnap.size<L.joinCodes,
      memberLinks:memSnap.size<L.members&&shipSnap.size<L.memberships,
      assignmentKeys:aSnap.size<L.assignments&&kSnap.size<L.answerKeys,
      assignments:aSnap.size<L.assignments
    };
    const members=new Map(),memberships=new Map(),assignments=new Set(),keys=new Set();
    memSnap.docs.forEach(d=>{let p=v26PathParts(d),classId=p[1],uid=p[3];members.set(`${classId}|${uid}`,{doc:d,classId,uid,data:d.data()||{}})});
    shipSnap.docs.forEach(d=>{let p=v26PathParts(d),uid=p[1],classId=p[3];memberships.set(`${classId}|${uid}`,{doc:d,classId,uid,data:d.data()||{}})});
    aSnap.docs.forEach(d=>{let p=v26PathParts(d),classId=p[1],id=p[3];assignments.add(`${classId}|${id}`)});
    kSnap.docs.forEach(d=>{let p=v26PathParts(d),classId=p[1],id=p[3];keys.add(`${classId}|${id}`)});
    const out=[];
    for(const c of classes.values()){
      const owner=users.get(c.ownerId);if(!owner&&complete.users)out.push(v26Issue('critical','class-owner-missing',`Lớp “${c.name||c.id}” không tìm thấy chủ lớp`,`ownerId ${c.ownerId||'—'} không tồn tại trong users.`,{classId:c.id},false));
      else if(owner&&!['teacher','admin'].includes(owner.role))out.push(v26Issue('warn','class-owner-role',`Chủ lớp “${c.name||c.id}” không còn quyền giáo viên`,`Tài khoản ${owner.email||c.ownerId} hiện có role = ${owner.role||'student'}.`,{classId:c.id,ownerId:c.ownerId},false));
      if(c.status!=='trashed'&&complete.joinCodes){
        const jc=c.joinCode?joinCodes.get(c.joinCode):null;if(!c.joinCode||!jc||jc.classId!==c.id||jc.ownerId!==c.ownerId)out.push(v26Issue('warn','join-code-broken',`Mã tham gia lớp “${c.name||c.id}” không đồng bộ`,`V26 có thể tạo một mã mới và liên kết lại lớp mà không đụng dữ liệu học sinh.`,{classId:c.id},true));
      }
      if((Number(c.schemaVersion)||0)<26)out.push(v26Issue('info','class-schema-old',`Lớp “${c.name||c.id}” đang ở schema cũ`,`schemaVersion hiện là ${Number(c.schemaVersion)||0}; dữ liệu vẫn tương thích và sẽ được nâng khi có thao tác V26.`,{classId:c.id},false));
    }
    if(!complete.users)out.push(v26Issue('info','scan-partial-users','Chưa kiểm kê đầy đủ hồ sơ người dùng',`Đã đọc tới giới hạn ${L.users} users. V26 không kết luận “mất hồ sơ” và không tự dựng liên kết dựa trên user vắng mặt ở mẫu này.`,{},false));
    if(!complete.classes)out.push(v26Issue('info','scan-partial-classes','Chưa kiểm kê đầy đủ lớp học',`Đã đọc tới giới hạn ${L.classes} classes. V26 không kết luận membership trỏ tới lớp không tồn tại nếu class vắng mặt trong mẫu.`,{},false));
    if(!complete.joinCodes)out.push(v26Issue('info','scan-partial-joincodes','Chưa đối chiếu đầy đủ mã tham gia lớp',`Đã đọc tới giới hạn ${L.joinCodes} joinCodes nên V26 bỏ qua kết luận “thiếu mã” để tránh báo sai.`,{},false));
    if(complete.memberLinks){
      for(const [key,m] of members){
        const c=classes.get(m.classId);if(c?.status==='trashed')continue;
        if(!memberships.has(key)){
          const userExists=users.has(m.uid),userKnown=userExists||complete.users;
          if(userExists)out.push(v26Issue('warn','membership-missing',`Thiếu membership của ${m.data.name||m.uid}`,`Lớp ${c?.name||m.classId} có member nhưng users/${m.uid}/memberships/${m.classId} chưa tồn tại.`,{classId:m.classId,uid:m.uid},true));
          else if(userKnown)out.push(v26Issue('critical','member-user-missing',`Member ${m.data.name||m.uid} không còn hồ sơ người dùng`,`classes/${m.classId}/members/${m.uid} tồn tại nhưng users/${m.uid} không tồn tại. V26 không tự dựng liên kết đoán mò.`,{classId:m.classId,uid:m.uid},false));
        }
      }
      for(const [key,s] of memberships){
        const c=classes.get(s.classId),userExists=users.has(s.uid),userKnown=userExists||complete.users;
        if(!c&&complete.classes)out.push(v26Issue('warn','orphan-membership',`Membership mồ côi của ${users.get(s.uid)?.displayName||s.uid}`,`Liên kết trỏ tới lớp ${s.classId} không còn tồn tại. Có thể xóa liên kết này an toàn.`,{classId:s.classId,uid:s.uid},true));
        else if(c?.status==='trashed')out.push(v26Issue('info','trashed-class-membership',`Membership còn sót tới lớp trong Thùng rác`,`Lớp ${c.name||s.classId} đã ở Thùng rác nên membership này có thể xóa để giữ mô hình truy cập V24–V26 nhất quán.`,{classId:s.classId,uid:s.uid},true));
        else if(c&&!members.has(key)){
          if(userExists)out.push(v26Issue('warn','member-missing',`Thiếu member trong lớp của ${users.get(s.uid)?.displayName||s.uid}`,`Membership tồn tại nhưng classes/${s.classId}/members/${s.uid} bị thiếu. V26 có thể dựng lại member từ hồ sơ người dùng.`,{classId:s.classId,uid:s.uid},true));
          else if(userKnown)out.push(v26Issue('critical','membership-user-missing',`Membership ${s.uid} không còn hồ sơ người dùng`,`users/${s.uid}/memberships/${s.classId} tồn tại nhưng users/${s.uid} không tồn tại. V26 chỉ cảnh báo.`,{classId:s.classId,uid:s.uid},false));
        }
      }
    }else out.push(v26Issue('info','scan-partial-members','Chưa đối chiếu đầy đủ member ↔ membership',`Một trong hai truy vấn đã chạm giới hạn (${L.members}/${L.memberships}). V26 bỏ qua sửa liên kết để tránh false positive.`,{},false));

    if(complete.assignmentKeys){
      for(const key of assignments)if(!keys.has(key)){let [classId,id]=key.split('|');out.push(v26Issue('critical','answer-key-missing',`Bài ${id} thiếu khóa đáp án`,`Secure assignment của lớp ${classes.get(classId)?.name||classId} không có answerKeysV18 tương ứng. Không tự sửa vì không thể tái tạo đáp án tin cậy.`,{classId,assignmentId:id},false))}
      for(const key of keys)if(!assignments.has(key)){let [classId,id]=key.split('|');out.push(v26Issue('info','orphan-answer-key',`Khóa đáp án ${id} không còn bài công khai`,`Có answerKeysV18 nhưng assignment tương ứng không tồn tại trong tập assignment đã quét đầy đủ. V26 chỉ cảnh báo, không tự xóa.`,{classId,assignmentId:id},false))}
    }else out.push(v26Issue('info','scan-partial-answerkeys','Chưa đối chiếu đầy đủ assignment ↔ answer key',`Assignment hoặc answer key đã chạm giới hạn (${L.assignments}/${L.answerKeys}). V26 không kết luận thiếu khóa đáp án ở lần quét này.`,{},false));

    if(complete.assignments)iSnap.docs.forEach(d=>{let p=v26PathParts(d),classId=p[1],x=d.data()||{},aid=x.assignmentId||String(d.id).split('__')[0];if(aid&&!assignments.has(`${classId}|${aid}`))out.push(v26Issue('warn','orphan-submission-index',`Chỉ mục nộp bài ${d.id} không tìm thấy bài`,`submissionIndexV19 của lớp ${classes.get(classId)?.name||classId} trỏ tới assignment ${aid} không còn tồn tại trong tập assignment đã quét đầy đủ. V26 không tự xóa chỉ mục điểm.`,{classId,assignmentId:aid,indexId:d.id},false))});
    else out.push(v26Issue('info','scan-partial-indexes','Chưa đối chiếu đầy đủ submission index',`Assignment đã chạm giới hạn ${L.assignments}; V26 bỏ qua kết luận chỉ mục mồ côi để tránh báo sai.`,{},false));
    v26HealthState={status:'done',issues:out,scannedDocs:v26HealthState.scannedDocs,score:v26HealthScore(out),repairable:out.filter(x=>x.repairable).length,scannedAt:new Date().toISOString(),truncated:v26HealthState.truncated,lastRepair:v26HealthState.lastRepair};v26RenderSystemHealth();
  }catch(err){console.error('V26 health scan',err);v26HealthState.status='error';v26HealthState.issues=[v26Issue('critical','scan-error','Không hoàn tất quét hệ thống',firebaseErrorText?.(err)||String(err),{},false)];v26HealthState.score=0;v26RenderSystemHealth()}
}
async function v26RepairSafeIssues(){
  if(!v25AdminRequire?.()||!firebaseDb)return;const list=(v26HealthState.issues||[]).filter(x=>x.repairable).slice(0,200);if(!list.length)return alert('Không có lỗi nào được V26 đánh dấu có thể sửa tự động an toàn.');
  if(!confirm(`V26 sẽ sửa ${list.length} liên kết an toàn (join code/member/membership). Không tự sửa khóa đáp án hoặc điểm. Tiếp tục?`))return;
  let fixed=0,failed=0;const userMap=v26HealthContext.users||new Map(),classMap=v26HealthContext.classes||new Map();
  for(const issue of list){try{
    const {classId,uid}=issue.data||{},c=classMap.get(classId)||{};
    if(issue.type==='join-code-broken'){
      const code=await firebaseGenerateUniqueJoinCode(),b=firebaseDb.batch(),cref=firebaseDb.collection('classes').doc(classId);b.set(cref,{joinCode:code,schemaVersion:26,integrityRepairedAt:firebaseServerTimestamp(),updatedAt:firebaseServerTimestamp()},{merge:true});b.set(firebaseDb.collection('joinCodes').doc(code),{classId,ownerId:c.ownerId,className:c.name||'',status:'active',schemaVersion:26,createdAt:firebaseServerTimestamp(),integrityRepairedAt:firebaseServerTimestamp()},{merge:false});await b.commit();fixed++;
    }else if(issue.type==='membership-missing'){
      const m=await firebaseDb.collection('classes').doc(classId).collection('members').doc(uid).get();if(!m.exists)throw new Error('Member đã thay đổi trong lúc sửa.');const d=m.data()||{};await firebaseDb.collection('users').doc(uid).collection('memberships').doc(classId).set({classId,className:c.name||'',joinCode:c.joinCode||'',status:d.status||'active',schemaVersion:26,joinedAt:d.joinedAt||firebaseServerTimestamp(),integrityRepairedAt:firebaseServerTimestamp()},{merge:true});fixed++;
    }else if(issue.type==='orphan-membership'||issue.type==='trashed-class-membership'){
      await firebaseDb.collection('users').doc(uid).collection('memberships').doc(classId).delete();fixed++;
    }else if(issue.type==='member-missing'){
      const ship=await firebaseDb.collection('users').doc(uid).collection('memberships').doc(classId).get(),u=userMap.get(uid)||{};if(!ship.exists)throw new Error('Membership đã thay đổi trong lúc sửa.');const sd=ship.data()||{};await firebaseDb.collection('classes').doc(classId).collection('members').doc(uid).set({uid,classId,joinCode:sd.joinCode||c.joinCode||'',name:u.displayName||u.email?.split('@')[0]||'Học sinh',email:u.email||'',role:'student',status:sd.status||'active',schemaVersion:26,joinedAt:sd.joinedAt||firebaseServerTimestamp(),integrityRepairedAt:firebaseServerTimestamp()},{merge:true});fixed++;
    }
  }catch(err){failed++;console.warn('V26 repair issue',issue,err)}}
  try{await firebaseDb.collection('adminAudit').add({actorUid:firebaseUser.uid,actorEmail:firebaseUser.email||'',action:'system.integrity.repair',targetType:'system',targetId:'v26',detail:{requested:list.length,fixed,failed},schemaVersion:26,createdAt:firebaseServerTimestamp()})}catch(_){}
  v26HealthState.lastRepair={fixed,failed,at:new Date().toISOString()};alert(`Đã sửa ${fixed} liên kết${failed?`; ${failed} mục không sửa được`:''}. V26 sẽ quét lại để xác nhận.`);await v25AdminRefresh(true);await v26SystemHealthScan();
}

v26EnsureRecycleBin();
