/* =========================================================
   Math12 Hub V40.7 — Hall of Fame / Bảng vinh danh học sinh
   - Privacy-first: only positive recognition is published; no emails/raw UIDs.
   - Teacher publishes one sanitized snapshot to classes/{classId}.honorBoardV407.
   - Students read the published class document they already have membership access to.
   - Verified assignment scores are preferred; self-study data is used when verified data is unavailable.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.7-hall-of-fame',SCHEMA=407;
const PERIODS={
  week:{label:'Tuần này',icon:'🔥'},
  month:{label:'Tháng này',icon:'📅'},
  all:{label:'Toàn thời gian',icon:'🏆'}
};
let selectedClassId='',selectedPeriod='week',teacherPreview=null,studentDocCache=new Map(),syncPushed=false;
const h=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const attr=s=>h(s).replace(/`/g,'&#96;');
const num=(v,f=null)=>Number.isFinite(Number(v))?Number(v):f;
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function toDate(v){if(!v)return null;if(typeof v.toDate==='function')return v.toDate();if(Number.isFinite(v.seconds))return new Date(v.seconds*1000);const d=new Date(v);return Number.isNaN(d.getTime())?null:d}
function stampText(v){const d=toDate(v);return d?d.toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}):'—'}
function dateOnly(d){return d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}
function periodWindow(type='week',now=new Date()){
  const end=new Date(now),currentStart=new Date(now),prevStart=new Date(now),prevEnd=new Date(now);
  if(type==='week'){
    const day=(currentStart.getDay()+6)%7;currentStart.setHours(0,0,0,0);currentStart.setDate(currentStart.getDate()-day);
    prevEnd.setTime(currentStart.getTime());prevStart.setTime(currentStart.getTime()-7*864e5);
    return {start:currentStart,end,prevStart,prevEnd,label:`${dateOnly(currentStart)} – ${dateOnly(end)}`};
  }
  if(type==='month'){
    currentStart.setHours(0,0,0,0);currentStart.setDate(1);
    prevEnd.setTime(currentStart.getTime());prevStart.setTime(currentStart.getTime());prevStart.setMonth(prevStart.getMonth()-1);
    return {start:currentStart,end,prevStart,prevEnd,label:`Tháng ${now.getMonth()+1}/${now.getFullYear()}`};
  }
  return {start:null,end,prevStart:null,prevEnd:null,label:'Từ khi tham gia Math12 Hub'};
}
function inWindow(v,start,end){const d=toDate(v);if(!d)return false;const t=d.getTime();return (!start||t>=start.getTime())&&(!end||t<end.getTime())}
function publicAvatar(raw={}){
  return {
    gender:raw.gender==='female'?'female':'male',skin:String(raw.skin||'warm').slice(0,30),face:String(raw.face||'smile').slice(0,30),
    hair:String(raw.hair||raw.starterHair||(raw.gender==='female'?'bob':'short')).slice(0,50),outfit:String(raw.outfit||'school-blue').slice(0,80)
  };
}
function currentPublicProfile(){
  let a=null,p=null;try{a=window.AvatarEngine?.get?.()||window.avatarV378Stored?.()||null}catch(_){}try{p=window.v379Economy?.profile?.()||null}catch(_){}
  return {schemaVersion:SCHEMA,avatar:publicAvatar(a||{}),level:Math.max(1,Math.floor(num(p?.level,a?.level||1))),rank:String(p?.rank||a?.rank||'Học viên Toán học').slice(0,60)};
}
function memberProfile(progress={}){const x=progress.honorV407&&typeof progress.honorV407==='object'?progress.honorV407:{};return {avatar:x.avatar?publicAvatar(x.avatar):null,level:Math.max(1,Math.floor(num(x.level,1))),rank:String(x.rank||'Học viên Toán học').slice(0,60)}}
async function shortHash(s=''){
  try{if(crypto?.subtle&&window.TextEncoder){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s)));return [...new Uint8Array(b)].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('')}}catch(_){}
  let x=2166136261;for(const c of String(s)){x^=c.charCodeAt(0);x=Math.imul(x,16777619)}return 'u'+(x>>>0).toString(36);
}
function practiceRows(progress={},w,type){
  const rows=(progress.recentAttempts||[]).map(x=>({...x,_d:toDate(x.date)})).filter(x=>x._d&&num(x.score)!=null).sort((a,b)=>a._d-b._d);
  if(type==='all')return {current:rows,previous:[]};
  return {current:rows.filter(x=>inWindow(x._d,w.start,w.end)),previous:rows.filter(x=>inWindow(x._d,w.prevStart,w.prevEnd))};
}
function verifiedRows(all=[],uid='',w,type){
  const rows=all.filter(x=>x.uid===uid&&num(x.score)!=null).map(x=>({...x,_d:toDate(x.submittedAt||x.gradedAt)})).filter(x=>x._d).sort((a,b)=>a._d-b._d);
  if(type==='all')return {current:rows,previous:[]};
  return {current:rows.filter(x=>inWindow(x._d,w.start,w.end)),previous:rows.filter(x=>inWindow(x._d,w.prevStart,w.prevEnd))};
}
function splitRecent(rows=[]){if(rows.length<4)return {current:[],previous:[]};const n=Math.min(3,Math.floor(rows.length/2));return {current:rows.slice(-n),previous:rows.slice(-(n*2),-n)} }
function academicMetric(v,p,progress,type){
  let current=v.current,previous=v.previous,source='verified';
  if(!current.length){current=p.current;previous=p.previous;source='practice'}
  let currentAvg=avg(current.map(x=>num(x.score)).filter(x=>x!=null)),previousAvg=avg(previous.map(x=>num(x.score)).filter(x=>x!=null));
  if(type==='all'){
    const base=v.current.length>=4?v.current:p.current,sp=splitRecent(base);source=v.current.length>=4?'verified':'practice';
    if(sp.current.length){currentAvg=avg(sp.current.map(x=>num(x.score)).filter(x=>x!=null));previousAvg=avg(sp.previous.map(x=>num(x.score)).filter(x=>x!=null))}
    else if(v.current.length){currentAvg=avg(v.current.map(x=>num(x.score)).filter(x=>x!=null));source='verified'}
    else if(num(progress.averageScore)!=null){currentAvg=num(progress.averageScore);source='practice'}
  }
  const evidence=source==='practice'&&type==='all'?Math.max(current.length,num(progress.attemptCount,0)):current.length;return {score:currentAvg,source,evidence,improvement:currentAvg!=null&&previousAvg!=null?currentAvg-previousAvg:null,previous:previousAvg};
}
function strongCount(progress={}){return (progress.skillSnapshot||[]).filter(x=>num(x.attempts,0)>=2&&(x.state==='strong'||num(x.accuracy,0)>=.8)).length}
function buildRows(members=[],progressDocs=[],submissions=[],type='week'){
  const w=periodWindow(type),pm=new Map(progressDocs.map(x=>[x.id,x.data||x]));
  return members.filter(m=>(m.data||m).status!=='suspended').map(m=>{
    const md=m.data||m,uid=m.id||md.uid,p=pm.get(uid)||{},vr=verifiedRows(submissions,uid,w,type),pr=practiceRows(p,w,type),ac=academicMetric(vr,pr,p,type);
    const periodPractice=type==='all'?num(p.attemptCount,0):pr.current.length,periodVerified=type==='all'?vr.current.length:vr.current.length;
    return {uid,name:String(md.name||p.name||'Học sinh').slice(0,90),profile:memberProfile(p),academicScore:ac.score,academicSource:ac.source,academicEvidence:ac.evidence,improvement:ac.improvement,activity:periodPractice+periodVerified,practiceCount:periodPractice,verifiedCount:periodVerified,accuracy:num(p.accuracy),practiceEvidence:num(p.attemptCount,0),mastery:strongCount(p),doneCount:num(p.doneCount,0),totalLessons:num(p.totalLessons,0)};
  });
}
function sortAcademic(rows){return rows.filter(x=>x.academicScore!=null).sort((a,b)=>(Number(a.academicSource!=='verified')-Number(b.academicSource!=='verified'))||(b.academicScore-a.academicScore)||(b.academicEvidence-a.academicEvidence)||a.name.localeCompare(b.name,'vi'))}
function sortActivity(rows){return rows.filter(x=>x.activity>0).sort((a,b)=>b.activity-a.activity||b.mastery-a.mastery||a.name.localeCompare(b.name,'vi'))}
function sortImprovement(rows){return rows.filter(x=>x.improvement!=null&&x.improvement>.009).sort((a,b)=>b.improvement-a.improvement||b.academicScore-a.academicScore)}
function sortAccuracy(rows){return rows.filter(x=>x.accuracy!=null&&x.practiceEvidence>=5).sort((a,b)=>b.accuracy-a.accuracy||b.practiceEvidence-a.practiceEvidence)}
function sortMastery(rows){return rows.filter(x=>x.mastery>0).sort((a,b)=>b.mastery-a.mastery||b.accuracy-a.accuracy)}
function award(title,icon,row,detail,id){return row?{id,title,icon,winner:row,detail}:null}
function starWinner(groups=[]){const pts=new Map();groups.forEach(g=>g.slice(0,3).forEach((x,i)=>pts.set(x.uid,(pts.get(x.uid)||0)+(3-i))));if(!pts.size)return null;const [uid,score]=[...pts.entries()].sort((a,b)=>b[1]-a[1])[0],row=groups.flat().find(x=>x.uid===uid);return row?{...row,_starPoints:score}:null}
function buildBoard(members,progress,submissions,type){
  const rows=buildRows(members,progress,submissions,type),academic=sortAcademic(rows),activity=sortActivity(rows),improve=sortImprovement(rows),accuracy=sortAccuracy(rows),mastery=sortMastery(rows),star=starWinner([academic,activity,improve,accuracy,mastery]);
  const label=PERIODS[type].label,w=periodWindow(type),awards=[
    award('Học tập nổi bật','🏆',academic[0],academic[0]?`${academic[0].academicScore.toFixed(2)}/10 • ${academic[0].academicSource==='verified'?'điểm đã chấm':'điểm tự luyện'}`:'','learning'),
    award('Chăm chỉ nhất','🔥',activity[0],activity[0]?`${activity[0].activity} hoạt động học tập`:'','diligent'),
    award('Tiến bộ nhất','🚀',improve[0],improve[0]?`Tăng ${improve[0].improvement.toFixed(2)} điểm so với giai đoạn trước`:'','progress'),
    award('Chính xác nhất','🎯',accuracy[0],accuracy[0]?`${Math.round(accuracy[0].accuracy*100)}% tự luyện • ${accuracy[0].practiceEvidence} lượt`:'','accuracy'),
    award('Mastery xuất sắc','💎',mastery[0],mastery[0]?`${mastery[0].mastery} mã kiến thức đã vững`:'','mastery'),
    award(type==='week'?'Ngôi sao tuần':type==='month'?'Ngôi sao tháng':'Ngôi sao Math12 Hub','⭐',star,star?`${star._starPoints} điểm vinh danh từ các hạng mục`:'','star')
  ].filter(Boolean);
  return {schemaVersion:SCHEMA,period:type,periodLabel:label,windowLabel:w.label,totalStudents:rows.length,rankings:academic.slice(0,10),awards,method:'verified-first-v407'};
}
async function sanitizeRow(row){if(!row)return null;return {key:await shortHash(row.uid),name:row.name,profile:row.profile,academicScore:row.academicScore==null?null:+row.academicScore.toFixed(3),academicSource:row.academicSource,academicEvidence:row.academicEvidence,activity:row.activity,practiceCount:row.practiceCount,verifiedCount:row.verifiedCount,accuracy:row.accuracy==null?null:+row.accuracy.toFixed(4),practiceEvidence:row.practiceEvidence,mastery:row.mastery,improvement:row.improvement==null?null:+row.improvement.toFixed(3),doneCount:row.doneCount,totalLessons:row.totalLessons}}
async function sanitizeBoard(board){
  const rowCache=new Map(),convert=async r=>{if(!r)return null;if(!rowCache.has(r.uid))rowCache.set(r.uid,await sanitizeRow(r));return rowCache.get(r.uid)};
  return {...board,rankings:await Promise.all(board.rankings.map(convert)),awards:await Promise.all(board.awards.map(async a=>({...a,winner:await convert(a.winner)})))};
}
async function buildSnapshot(classId){
  if(typeof firebaseDb==='undefined'||!firebaseDb)throw new Error('Firebase chưa sẵn sàng.');const cref=firebaseDb.collection('classes').doc(classId);
  const [cls,m,p,idx]=await Promise.all([cref.get(),cref.collection('members').get(),cref.collection('progress').get(),cref.collection('submissionIndexV19').get()]);
  if(!cls.exists)throw new Error('Lớp không còn tồn tại.');const cd=cls.data()||{};
  const members=m.docs.map(d=>({id:d.id,data:d.data()})),progress=p.docs.map(d=>({id:d.id,data:d.data()})),subs=idx.docs.map(d=>({id:d.id,...d.data()}));
  const boards={};for(const type of Object.keys(PERIODS))boards[type]=await sanitizeBoard(buildBoard(members,progress,subs,type));
  return {schemaVersion:SCHEMA,build:BUILD,classId,className:String(cd.name||'Lớp học').slice(0,100),teacherName:String(cd.teacherName||'').slice(0,100),generatedAtIso:new Date().toISOString(),boards,policy:{positiveOnly:true,rawUid:false,email:false,verifiedPreferred:true}};
}
function sourceLabel(r){return r?.academicSource==='verified'?'Đã chấm':'Tự luyện'}
function avatarHtml(row,cls=''){
  const a=row?.profile?.avatar;try{if(a&&typeof window.avatarV378Svg==='function')return `<div class="v407-avatar ${cls}">${window.avatarV378Svg(a,'mini')}</div>`}catch(_){}
  const letter=(String(row?.name||'?').trim().split(/\s+/).at(-1)||'?')[0].toUpperCase();return `<div class="v407-avatar v407-initial ${cls}">${h(letter)}</div>`;
}
function profileLine(row){return `Lv.${row?.profile?.level||1} • ${h(row?.profile?.rank||'Học viên Toán học')}`}
function podiumCard(row,rank,currentKey=''){
  if(!row)return `<div class="v407-podium-card rank-${rank} empty"><div class="v407-medal">${rank}</div><div class="v407-podium-empty">Chưa đủ dữ liệu</div></div>`;
  const mine=currentKey&&row.key===currentKey;return `<div class="v407-podium-card rank-${rank}${mine?' is-me':''}"><div class="v407-medal">${rank===1?'🥇':rank===2?'🥈':'🥉'}</div>${avatarHtml(row,'podium')}<b>${h(row.name)}${mine?' <em>Em</em>':''}</b><small>${profileLine(row)}</small><strong>${row.academicScore==null?'—':row.academicScore.toFixed(2)}</strong><span>${sourceLabel(row)} • ${row.academicEvidence||0} lượt</span></div>`;
}
function awardCard(a,currentKey=''){
  const r=a.winner,mine=currentKey&&r?.key===currentKey;return `<div class="v407-award-card${mine?' is-me':''}"><div class="v407-award-icon">${a.icon}</div><div class="v407-award-copy"><small>${h(a.title)}</small><b>${h(r?.name||'Chưa đủ dữ liệu')}${mine?' <em>Em</em>':''}</b><span>${h(a.detail||'Sẽ xuất hiện khi có đủ dữ liệu.')}</span></div>${r?avatarHtml(r,'award'):''}</div>`;
}
function rankingTable(rows=[],currentKey=''){
  if(!rows.length)return '<div class="v407-empty"><b>Chưa đủ dữ liệu để xếp hạng học tập.</b><span>Các danh hiệu khác vẫn có thể xuất hiện khi học sinh đồng bộ hoạt động tự luyện.</span></div>';
  return `<div class="v407-ranking"><div class="v407-rank-head"><span>Hạng</span><span>Học sinh</span><span>Điểm</span><span>Minh chứng</span><span>Mastery</span></div>${rows.map((r,i)=>{const mine=currentKey&&r.key===currentKey;return `<div class="v407-rank-row${mine?' is-me':''}"><div class="v407-rank-no">${i<3?['🥇','🥈','🥉'][i]:i+1}</div><div class="v407-student">${avatarHtml(r,'table')}<div><b>${h(r.name)}${mine?' <em>Em</em>':''}</b><small>${profileLine(r)}</small></div></div><div class="v407-score"><b>${r.academicScore==null?'—':r.academicScore.toFixed(2)}</b><small>${sourceLabel(r)}</small></div><div><b>${r.academicEvidence||0}</b><small>lượt tính hạng</small></div><div><b>${r.mastery||0}</b><small>mã đã vững</small></div></div>`}).join('')}</div>`;
}
function boardHtml(snapshot,period='week',currentKey=''){
  const b=snapshot?.boards?.[period];if(!b)return '<div class="v407-empty"><b>Chưa có bảng vinh danh cho mốc này.</b><span>Giáo viên cần cập nhật và xuất bản bảng vinh danh.</span></div>';
  const top=b.rankings||[];return `<div class="v407-board-head"><div><span class="v407-kicker">HALL OF FAME</span><h2>🏆 Bảng vinh danh • ${h(snapshot.className||'Lớp học')}</h2><p>${h(b.windowLabel||'')} • Cập nhật ${h(stampText(snapshot.generatedAtIso))}</p></div><div class="v407-positive-badge">✨ Chỉ vinh danh thành tích tích cực</div></div><div class="v407-podium"><div class="v407-podium-slot second">${podiumCard(top[1],2,currentKey)}</div><div class="v407-podium-slot first">${podiumCard(top[0],1,currentKey)}</div><div class="v407-podium-slot third">${podiumCard(top[2],3,currentKey)}</div></div><div class="v407-section-title"><div><small>DANH HIỆU</small><h3>Những nỗ lực đáng ghi nhận</h3></div></div><div class="v407-awards">${(b.awards||[]).map(a=>awardCard(a,currentKey)).join('')||'<div class="v407-empty">Chưa đủ dữ liệu cho các danh hiệu.</div>'}</div><div class="v407-section-title"><div><small>TOP 10</small><h3>Học tập nổi bật</h3></div><span class="v407-method">Ưu tiên điểm đã chấm • không xếp hạng học sinh yếu</span></div>${rankingTable(top,currentKey)}<div class="v407-footnote"><b>Cách tính công bằng:</b> điểm bài giáo viên đã chấm được ưu tiên. Khi chưa có dữ liệu đã chấm, hệ thống mới dùng điểm tự luyện đã đồng bộ. “Tiến bộ” so sánh với giai đoạn trước; “Chính xác” yêu cầu tối thiểu 5 lượt tự luyện.</div>`;
}
function periodTabs(){return `<div class="v407-tabs">${Object.entries(PERIODS).map(([k,v])=>`<button type="button" class="${k===selectedPeriod?'active':''}" onclick="v407SelectPeriod('${k}')">${v.icon} ${v.label}</button>`).join('')}</div>`}
function classOptions(rows=[],value=''){return rows.map(c=>`<option value="${attr(c.classId||c.id)}" ${(c.classId||c.id)===value?'selected':''}>${h(c.className||c.name||'Lớp học')}</option>`).join('')}
function pageShell(){const host=document.getElementById('v407HonorPage');if(!host)return null;return host}
async function renderStudent(){
  const host=pageShell();if(!host)return;const memberships=(typeof firebaseMemberships!=='undefined'?firebaseMemberships:[]).filter(x=>x.classId&&x.status!=='suspended');
  if(typeof firebaseUser==='undefined'||!firebaseUser){host.innerHTML=`<div class="v407-hero"><div><span class="v407-kicker">HALL OF FAME</span><h2>🏆 Bảng vinh danh Math12 Hub</h2><p>Đăng nhập để xem bảng vinh danh của lớp và biết em đang nổi bật ở hạng mục nào.</p><button class="btn btn-blue" onclick="openFirebaseAccount()">Đăng nhập</button></div></div>`;return}
  if(!memberships.length){host.innerHTML=`<div class="v407-hero"><div><span class="v407-kicker">HALL OF FAME</span><h2>🏆 Tham gia lớp vinh danh</h2><p>Nhập mã lớp do giáo viên cung cấp. Chức năng này chỉ dùng để kết nối bảng vinh danh và không làm thay đổi điểm học tập.</p><div class="v407-join"><input id="fbJoinCode" placeholder="Nhập mã lớp 7 ký tự" maxlength="12"><button class="btn btn-blue" onclick="v407JoinClass()">Tham gia lớp</button></div></div></div>`;return}
  if(!selectedClassId||!memberships.some(x=>x.classId===selectedClassId))selectedClassId=memberships[0].classId;
  host.innerHTML=`<div class="v407-toolbar"><div><label>Lớp của em</label><select onchange="v407SelectClass(this.value)">${classOptions(memberships,selectedClassId)}</select></div>${periodTabs()}<button class="btn btn-soft" onclick="v407RefreshStudent(true)">↻ Làm mới</button></div><div id="v407Board"><div class="v407-loading">Đang tải bảng vinh danh…</div></div>`;
  if(!syncPushed&&typeof firebaseSyncClassProgress==='function'){syncPushed=true;firebaseSyncClassProgress().catch(()=>{})}
  await loadStudentBoard(selectedClassId,false);
}
async function loadStudentBoard(classId,force=false){
  const box=document.getElementById('v407Board');if(!box)return;try{
    let data=!force?studentDocCache.get(classId):null;if(!data){const snap=await firebaseDb.collection('classes').doc(classId).get();if(!snap.exists)throw new Error('Lớp không còn tồn tại.');data=snap.data()||{};studentDocCache.set(classId,data)}
    const honor=data.honorBoardV407;if(!honor){box.innerHTML='<div class="v407-empty"><b>Giáo viên chưa xuất bản bảng vinh danh.</b><span>Khi bảng được cập nhật, em sẽ thấy Top 3, các danh hiệu và thành tích nổi bật tại đây.</span></div>';return}
    const key=await shortHash(firebaseUser.uid);box.innerHTML=boardHtml(honor,selectedPeriod,key);
  }catch(err){box.innerHTML=`<div class="firebase-banner error">${h(typeof firebaseErrorText==='function'?firebaseErrorText(err):err.message)}</div>`}
}
async function renderTeacher(){
  const host=pageShell();if(!host)return;const classes=(typeof firebaseOwnedClasses!=='undefined'?firebaseOwnedClasses:[]).filter(x=>x.id&&x.status!=='trashed');
  if(typeof firebaseUser==='undefined'||!firebaseUser){host.innerHTML=`<div class="v407-hero"><div><span class="v407-kicker">HALL OF FAME</span><h2>🏆 Bảng vinh danh học sinh</h2><p>Đăng nhập bằng tài khoản giáo viên để tạo và xuất bản bảng vinh danh.</p><button class="btn btn-blue" onclick="openFirebaseAccount()">Đăng nhập</button></div></div>`;return}
  if(!classes.length){host.innerHTML=`<div class="v407-hero teacher"><div><span class="v407-kicker">HALL OF FAME • GIÁO VIÊN</span><h2>Tạo lớp vinh danh đầu tiên</h2><p>Mỗi lớp có một mã tham gia. Học sinh dùng mã này để xem bảng vinh danh riêng của lớp.</p><div class="v407-join"><input id="fbClassName" placeholder="Ví dụ: 12A1 – Toán"><button class="btn btn-blue" onclick="v407CreateClass()">Tạo lớp</button></div></div></div>`;return}
  if(!selectedClassId||!classes.some(x=>x.id===selectedClassId))selectedClassId=classes[0].id;
  const selected=classes.find(x=>x.id===selectedClassId)||classes[0];
  host.innerHTML=`<div class="v407-teacher-panel"><div class="v407-board-head"><div><span class="v407-kicker">HALL OF FAME • GIÁO VIÊN</span><h2>Quản lý bảng vinh danh</h2><p>Chỉ xuất bản Top thành tích tích cực. Email và UID thật không được đưa vào bảng công khai của lớp.</p></div><div class="v407-code"><small>Mã tham gia</small><b>${h(selected.joinCode||'—')}</b></div></div><div class="v407-toolbar teacher"><div><label>Chọn lớp</label><select onchange="v407SelectClass(this.value)">${classOptions(classes,selectedClassId)}</select></div>${periodTabs()}<div class="v407-actions"><button class="btn btn-soft" onclick="v407Preview()">👁 Xem trước dữ liệu mới</button><button class="btn btn-blue" onclick="v407Publish()">🏆 Cập nhật & xuất bản</button><button class="btn btn-soft" onclick="v407LoadPublished()">Bản đang công bố</button></div></div><div class="v407-teacher-note"><b>Nguyên tắc V40.7:</b> điểm đã chấm được ưu tiên; tự luyện chỉ bổ sung khi thiếu dữ liệu. Không hiển thị bảng cuối lớp, không công bố email, không dùng Bảng vinh danh để cộng/trừ điểm môn học.</div><div id="v407Board"><div class="v407-empty"><b>Sẵn sàng tạo Bảng vinh danh.</b><span>Bấm “Xem trước dữ liệu mới” để kiểm tra trước khi xuất bản cho học sinh.</span></div></div><div class="v407-danger-zone"><button class="btn btn-soft" onclick="v407Unpublish()">Ẩn bảng vinh danh khỏi học sinh</button></div></div>`;
}
async function render(){if(!pageShell())return;return (typeof window.isTeacherRole==='function'&&isTeacherRole())?renderTeacher():renderStudent()}
async function preview(){
  if(!(typeof window.isTeacherRole==='function'&&isTeacherRole()))return;if(!selectedClassId)return;const box=document.getElementById('v407Board');if(box)box.innerHTML='<div class="v407-loading">Đang tổng hợp dữ liệu lớp…</div>';
  try{teacherPreview=await buildSnapshot(selectedClassId);if(box)box.innerHTML=`<div class="v407-preview-banner"><b>👁 Bản xem trước — chưa xuất bản</b><span>Kiểm tra nội dung bên dưới rồi bấm “Cập nhật & xuất bản”.</span></div>${boardHtml(teacherPreview,selectedPeriod,'')}`}
  catch(err){if(box)box.innerHTML=`<div class="firebase-banner error">${h(typeof firebaseErrorText==='function'?firebaseErrorText(err):err.message)}</div>`}
}
async function publish(){
  if(!(typeof window.requireTeacher==='function'?requireTeacher('Xuất bản bảng vinh danh'):isTeacherRole()))return;if(!selectedClassId)return;
  try{if(!teacherPreview||teacherPreview.classId!==selectedClassId)teacherPreview=await buildSnapshot(selectedClassId);if(!confirm(`Xuất bản Bảng vinh danh mới cho lớp “${teacherPreview.className}”?\n\nHọc sinh trong lớp sẽ thấy Top thành tích và các danh hiệu tích cực.`))return;
    const payload={...teacherPreview,updatedAt:firebaseServerTimestamp()};await firebaseDb.collection('classes').doc(selectedClassId).set({honorBoardV407:payload,updatedAt:firebaseServerTimestamp()},{merge:true});
    try{await firebaseAuditLog?.('honor.publish',{classId:selectedClassId,className:teacherPreview.className,schemaVersion:SCHEMA})}catch(_){}
    studentDocCache.set(selectedClassId,{honorBoardV407:teacherPreview});const box=document.getElementById('v407Board');if(box)box.innerHTML=`<div class="v407-published-banner"><b>✓ Đã xuất bản cho học sinh</b><span>${h(stampText(new Date()))}</span></div>${boardHtml(teacherPreview,selectedPeriod,'')}`;teacherPreview=null;
  }catch(err){alert(typeof firebaseErrorText==='function'?firebaseErrorText(err):err.message)}
}
async function loadPublished(){
  if(!selectedClassId)return;const box=document.getElementById('v407Board');if(box)box.innerHTML='<div class="v407-loading">Đang tải bản đã công bố…</div>';
  try{let data=studentDocCache.get(selectedClassId);if(!data){const snap=await firebaseDb.collection('classes').doc(selectedClassId).get();data=snap.data()||{};studentDocCache.set(selectedClassId,data)}const honor=data.honorBoardV407;if(!honor){if(box)box.innerHTML='<div class="v407-empty"><b>Lớp này chưa có Bảng vinh danh đã xuất bản.</b></div>';return}if(box)box.innerHTML=boardHtml(honor,selectedPeriod,'')}
  catch(err){if(box)box.innerHTML=`<div class="firebase-banner error">${h(typeof firebaseErrorText==='function'?firebaseErrorText(err):err.message)}</div>`}
}
async function unpublish(){
  if(!(typeof window.requireTeacher==='function'?requireTeacher('Ẩn bảng vinh danh'):isTeacherRole()))return;if(!selectedClassId||!confirm('Ẩn Bảng vinh danh hiện tại khỏi học sinh? Dữ liệu học tập gốc không bị xóa.'))return;
  try{await firebaseDb.collection('classes').doc(selectedClassId).update({honorBoardV407:firebase.firestore.FieldValue.delete(),updatedAt:firebaseServerTimestamp()});studentDocCache.delete(selectedClassId);teacherPreview=null;const box=document.getElementById('v407Board');if(box)box.innerHTML='<div class="v407-empty"><b>Đã ẩn Bảng vinh danh.</b><span>Dữ liệu học tập gốc vẫn được giữ nguyên.</span></div>'}catch(err){alert(typeof firebaseErrorText==='function'?firebaseErrorText(err):err.message)}
}
function selectPeriod(p){if(!PERIODS[p])return;selectedPeriod=p;document.querySelectorAll('.v407-tabs button').forEach(b=>b.classList.toggle('active',b.getAttribute('onclick')?.includes(`'${p}'`)));if(teacherPreview){const box=document.getElementById('v407Board');if(box)box.innerHTML=`<div class="v407-preview-banner"><b>👁 Bản xem trước — chưa xuất bản</b><span>Kiểm tra nội dung bên dưới rồi bấm “Cập nhật & xuất bản”.</span></div>${boardHtml(teacherPreview,p,'')}`}else if(typeof window.isTeacherRole==='function'&&isTeacherRole())loadPublished();else loadStudentBoard(selectedClassId,false)}
function selectClass(id){selectedClassId=id||'';teacherPreview=null;render()}
async function refreshStudent(force=true){if(selectedClassId)await loadStudentBoard(selectedClassId,force)}
async function createClass(){try{await firebaseCreateClass();selectedClassId=(firebaseOwnedClasses||[]).at(-1)?.id||firebaseOwnedClasses?.[0]?.id||'';render()}catch(err){alert(typeof firebaseErrorText==='function'?firebaseErrorText(err):err.message)}}
async function joinClass(){try{await firebaseJoinClass();selectedClassId=(firebaseMemberships||[]).at(-1)?.classId||firebaseMemberships?.[0]?.classId||'';studentDocCache.clear();render()}catch(err){alert(typeof firebaseErrorText==='function'?firebaseErrorText(err):err.message)}}
function installProgressHook(){
  const base=window.firebaseProgressSummary;if(typeof base!=='function'||base.__v407)return;const wrap=function(){const out=base.apply(this,arguments);return {...out,honorV407:currentPublicProfile()}};wrap.__v407=true;wrap.__base=base;window.firebaseProgressSummary=wrap;
}
function inject(){
  try{ROLE_ACCESS.student.add('honor');ROLE_ACCESS.teacher.add('honor');ROLE_ACCESS.admin.add('honor')}catch(_){}
  const sNav=document.querySelector('[data-nav-group="student-connect"] .nav-group-items');if(sNav&&!sNav.querySelector('[data-page="honor"]'))sNav.insertAdjacentHTML('beforeend','<button data-page="honor" title="Bảng vinh danh"><span class="ico">🏆</span><span class="nav-label">Bảng vinh danh</span></button>');
  const tNav=document.querySelector('.teacher-nav-block [data-nav-group="teacher-tools"] .nav-group-items');if(tNav&&!tNav.querySelector('[data-page="honor"]'))tNav.insertAdjacentHTML('beforeend','<button data-page="honor" title="Bảng vinh danh học sinh"><span class="ico">🏆</span><span class="nav-label">Bảng vinh danh</span></button>');
  const main=document.querySelector('main .content')||document.querySelector('main');if(main&&!document.getElementById('page-honor'))main.insertAdjacentHTML('beforeend','<section class="section" id="page-honor"><div id="v407HonorPage"></div></section>');
  const dash=document.getElementById('avatarV378Dashboard');if(dash&&!document.getElementById('v407DashboardHonor'))dash.insertAdjacentHTML('afterend','<div class="student-only v407-dashboard-card" id="v407DashboardHonor"><div><span>🏆</span><div><b>Bảng vinh danh lớp</b><small>Điểm cao, chăm chỉ, tiến bộ và Mastery đều có cơ hội được ghi nhận.</small></div></div><button class="btn btn-soft" onclick="goPage(\'honor\')">Xem vinh danh</button></div>');
}
function installNavigationHook(){
  const base=window.goPage;if(typeof base!=='function'||base.__v407)return;const wrap=function(page,internal=false){const out=base.call(this,page,internal);if(page==='honor'){const title=document.getElementById('pageTitle');if(title)title.textContent='Bảng vinh danh';setTimeout(render,0)}return out};wrap.__v407=true;wrap.__base=base;window.goPage=wrap;
}
function installMembershipHook(){
  const base=window.firebaseLoadMemberships;if(typeof base!=='function'||base.__v407)return;const wrap=async function(){const out=await base.apply(this,arguments);if(document.getElementById('page-honor')?.classList.contains('active'))setTimeout(render,0);return out};wrap.__v407=true;wrap.__base=base;window.firebaseLoadMemberships=wrap;
}
function init(){inject();installProgressHook();installNavigationHook();installMembershipHook();document.documentElement.dataset.honorBoardBuild=BUILD;if(document.getElementById('page-honor')?.classList.contains('active'))render()}
window.v407HonorBoard={build:BUILD,schema:SCHEMA,render,preview,publish,loadPublished,unpublish,buildSnapshot,currentPublicProfile};
window.v407SelectPeriod=selectPeriod;window.v407SelectClass=selectClass;window.v407RefreshStudent=refreshStudent;window.v407Preview=preview;window.v407Publish=publish;window.v407LoadPublished=loadPublished;window.v407Unpublish=unpublish;window.v407CreateClass=createClass;window.v407JoinClass=joinClass;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
