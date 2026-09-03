/* =========================================================
   Math12 Hub V40.9 — Global Auto Hall of Fame / Bảng vinh danh toàn hệ thống
   - No class dependency. No teacher publish workflow.
   - Each student writes one small sanitized public summary to honorPublicV409/{uid}.
   - The board listens in realtime and recomputes recognition automatically.
   - Raw email, class data, answers and learning history are never published here.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.9-global-auto-hall-of-fame';
const SCHEMA=409;
const COLLECTION='honorPublicV409';
const PERIODS={
  week:{label:'Tuần này',icon:'🔥'},
  month:{label:'Tháng này',icon:'📅'},
  all:{label:'Toàn thời gian',icon:'🏆'}
};
const LIMITS={
  week:{academicEvidence:3,academicScore:8,activity:4,accuracyEvidence:20,accuracy:.85,progressEvidence:2,improvement:.75},
  month:{academicEvidence:4,academicScore:8,activity:10,accuracyEvidence:50,accuracy:.85,progressEvidence:3,improvement:.75},
  all:{academicEvidence:5,academicScore:8,activity:20,accuracyEvidence:80,accuracy:.85,progressEvidence:3,improvement:.75}
};
let selectedPeriod='week';
let publicRows=[];
let unsubscribe=null;
let boardStarted=false;
let ownSyncBusy=false;
let ownSyncTimer=null;
let authProbeTimer=null;
let lastSnapshotAt=null;
const h=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const num=(v,f=null)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
function toDate(v){if(!v)return null;if(typeof v.toDate==='function')return v.toDate();if(Number.isFinite(v.seconds))return new Date(v.seconds*1000);const d=new Date(v);return Number.isNaN(d.getTime())?null:d}
function stampText(v){const d=toDate(v);return d?d.toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}):'—'}
function dateOnly(d){return d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}
function safeText(v,max=80){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function dayKey(v){const d=toDate(v);if(!d)return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function weekStart(now=new Date()){const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d}
function monthStart(now=new Date()){const d=new Date(now);d.setHours(0,0,0,0);d.setDate(1);return d}
function periodWindow(type='week',now=new Date()){
  const end=new Date(now);
  if(type==='week'){const start=weekStart(now),prevEnd=new Date(start),prevStart=new Date(start);prevStart.setDate(prevStart.getDate()-7);return {start,end,prevStart,prevEnd,key:`W-${dayKey(start)}`,label:`${dateOnly(start)} – ${dateOnly(end)}`}}
  if(type==='month'){const start=monthStart(now),prevEnd=new Date(start),prevStart=new Date(start);prevStart.setMonth(prevStart.getMonth()-1);return {start,end,prevStart,prevEnd,key:`M-${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}`,label:`Tháng ${now.getMonth()+1}/${now.getFullYear()}`}}
  return {start:null,end,prevStart:null,prevEnd:null,key:'ALL',label:'Từ khi tham gia Math12 Hub'};
}
function inWindow(v,start,end){const d=toDate(v);if(!d)return false;const t=d.getTime();return (!start||t>=start.getTime())&&(!end||t<end.getTime())}
async function shortHash(s=''){
  try{if(crypto?.subtle&&window.TextEncoder){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s)));return [...new Uint8Array(b)].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('')}}catch(_){}
  let x=2166136261;for(const c of String(s)){x^=c.charCodeAt(0);x=Math.imul(x,16777619)}return 'u'+(x>>>0).toString(36);
}
function publicAvatar(raw={}){return {gender:raw.gender==='female'?'female':'male',skin:safeText(raw.skin||'warm',30),face:safeText(raw.face||'smile',30),hair:safeText(raw.hair||raw.starterHair||(raw.gender==='female'?'bob':'short'),50),outfit:safeText(raw.outfit||'school-blue',80)}}
function currentPublicProfile(){
  let a=null,p=null;try{a=window.AvatarEngine?.get?.()||window.avatarV378Stored?.()||null}catch(_){}try{p=window.v379Economy?.profile?.()||null}catch(_){}
  return {avatar:publicAvatar(a||{}),level:Math.max(1,Math.min(999,Math.floor(num(p?.level,a?.level||1)))),rank:safeText(p?.rank||a?.rank||'Học viên Toán học',60)};
}
function allAttempts(){return (Array.isArray(state?.examAttempts)?state.examAttempts:[]).map(x=>({...x,_d:toDate(x.date),_score:num(x.score)})).filter(x=>x._d&&x._score!=null).sort((a,b)=>a._d-b._d)}
function attemptAccuracy(rows=[]){let evidence=0,credit=0,correct=0;for(const a of rows)for(const q of (Array.isArray(a.questionResults)?a.questionResults:[])){const c=num(q.credit,q.correct?1:0);if(c==null)continue;evidence++;credit+=clamp(c,0,1);if(q.correct)correct++}return {accuracy:evidence?credit/evidence:null,evidence,correct}}
function strongCount(){try{return analyticsSkillStats().filter(x=>num(x.total,0)>=2&&(x.state==='strong'||num(x.accuracy,0)>=.8)).length}catch(_){return 0}}
function currentStreak(){try{return Math.max(0,Math.floor(num(learningStreakDays(),0)))}catch(_){return 0}}
function recentSplit(rows=[]){if(rows.length<6)return {current:[],previous:[]};const n=Math.min(5,Math.floor(rows.length/2));return {current:rows.slice(-n),previous:rows.slice(-(n*2),-n)}}
function metricFor(type,rows){
  const w=periodWindow(type);let current=[],previous=[];
  if(type==='all'){current=rows;const sp=recentSplit(rows);previous=sp.previous}
  else{current=rows.filter(x=>inWindow(x._d,w.start,w.end));previous=rows.filter(x=>inWindow(x._d,w.prevStart,w.prevEnd))}
  const currentAvg=avg(current.map(x=>x._score));let previousAvg=avg(previous.map(x=>x._score));
  let improvement=null,progressCurrent=current,progressPrevious=previous;
  if(type==='all'){const sp=recentSplit(rows);progressCurrent=sp.current;progressPrevious=sp.previous;if(sp.current.length&&sp.previous.length){const ca=avg(sp.current.map(x=>x._score)),pa=avg(sp.previous.map(x=>x._score));improvement=ca==null||pa==null?null:ca-pa;previousAvg=pa}}
  else if(currentAvg!=null&&previousAvg!=null)improvement=currentAvg-previousAvg;
  const acc=attemptAccuracy(current);const verified=current.filter(x=>String(x.mode||'').startsWith('assignment')).length;
  return {key:w.key,windowLabel:w.label,score:currentAvg==null?null:+currentAvg.toFixed(3),evidence:current.length,activity:current.length,verified,practice:Math.max(0,current.length-verified),accuracy:acc.accuracy==null?null:+acc.accuracy.toFixed(4),accuracyEvidence:acc.evidence,improvement:improvement==null?null:+improvement.toFixed(3),progressCurrent:progressCurrent.length,progressPrevious:progressPrevious.length};
}
function milestoneFlags(metrics,mastery,streak){
  const out={};for(const type of Object.keys(PERIODS)){const m=metrics[type],l=LIMITS[type];out[type]={learning:m.score!=null&&m.score>=l.academicScore&&m.evidence>=l.academicEvidence,diligent:m.activity>=l.activity,progress:m.improvement!=null&&m.improvement>=l.improvement&&m.progressCurrent>=l.progressEvidence&&m.progressPrevious>=l.progressEvidence,accuracy:m.accuracy!=null&&m.accuracy>=l.accuracy&&m.accuracyEvidence>=l.accuracyEvidence,mastery:mastery>=5,streak:streak>=3};out[type].count=Object.entries(out[type]).filter(([k,v])=>k!=='count'&&v).length}return out;
}
async function buildOwnPayload(){
  if(typeof firebaseUser==='undefined'||!firebaseUser)return null;if(typeof isTeacherRole==='function'&&isTeacherRole())return null;if(typeof isAdminRole==='function'&&isAdminRole())return null;
  const rows=allAttempts(),metrics={week:metricFor('week',rows),month:metricFor('month',rows),all:metricFor('all',rows)},mastery=strongCount(),streak=currentStreak(),profile=currentPublicProfile(),publicKey=await shortHash(firebaseUser.uid),flags=milestoneFlags(metrics,mastery,streak);
  return {schemaVersion:SCHEMA,publicKey,name:safeText(firebaseUser.displayName||firebaseProfile?.displayName||firebaseUser.email?.split('@')[0]||'Học sinh',80),avatar:profile.avatar,level:profile.level,rank:profile.rank,mastery,streak,metrics,milestones:flags,clientUpdatedAt:new Date().toISOString()};
}
function stablePayloadString(p){if(!p)return '';const x=JSON.parse(JSON.stringify(p));delete x.clientUpdatedAt;return JSON.stringify(x)}
async function syncOwnProfile(force=false){
  if(ownSyncBusy||typeof firebaseDb==='undefined'||!firebaseDb||typeof firebaseUser==='undefined'||!firebaseUser||firebaseAccountLocked)return false;if(typeof isTeacherRole==='function'&&isTeacherRole())return false;if(typeof isAdminRole==='function'&&isAdminRole())return false;
  ownSyncBusy=true;try{const payload=await buildOwnPayload();if(!payload)return false;const sig=await shortHash(stablePayloadString(payload)),key=`math12hub-honor-v409-sig-${firebaseUser.uid}`;if(!force&&localStorage.getItem(key)===sig)return true;await firebaseDb.collection(COLLECTION).doc(firebaseUser.uid).set({...payload,updatedAt:firebaseServerTimestamp()},{merge:false});localStorage.setItem(key,sig);return true}catch(err){if(err?.code!=='permission-denied')console.warn('V40.9 honor sync',err);return false}finally{ownSyncBusy=false}}
function scheduleOwnSync(force=false){clearTimeout(ownSyncTimer);ownSyncTimer=setTimeout(()=>syncOwnProfile(force).then(()=>{if(isHonorActive())refreshLiveStatus()}).catch(()=>{}),force?120:550)}
function isHonorActive(){return !!document.getElementById('page-honor')?.classList.contains('active')}
function normalizePublicDoc(d){const x=d.data?d.data():d||{};if(num(x.schemaVersion)!==SCHEMA)return null;return {docId:d.id||'',publicKey:safeText(x.publicKey,40),name:safeText(x.name||'Học sinh',80),avatar:x.avatar||null,level:Math.max(1,Math.floor(num(x.level,1))),rank:safeText(x.rank||'Học viên Toán học',60),mastery:Math.max(0,Math.floor(num(x.mastery,0))),streak:Math.max(0,Math.floor(num(x.streak,0))),metrics:x.metrics||{},milestones:x.milestones||{},updatedAt:x.updatedAt||x.clientUpdatedAt||null}}
function validPeriodRow(r,type){const m=r?.metrics?.[type];if(!m)return false;if(type==='week'||type==='month')return m.key===periodWindow(type).key;return true}
function eligible(r,type,kind){if(!validPeriodRow(r,type))return false;const m=r.metrics[type]||{},l=LIMITS[type];if(kind==='learning')return m.score!=null&&num(m.score)>=l.academicScore&&num(m.evidence,0)>=l.academicEvidence;if(kind==='diligent')return num(m.activity,0)>=l.activity;if(kind==='progress')return m.improvement!=null&&num(m.improvement)>=l.improvement&&num(m.progressCurrent,0)>=l.progressEvidence&&num(m.progressPrevious,0)>=l.progressEvidence;if(kind==='accuracy')return m.accuracy!=null&&num(m.accuracy)>=l.accuracy&&num(m.accuracyEvidence,0)>=l.accuracyEvidence;if(kind==='mastery')return num(r.mastery,0)>=5;if(kind==='streak')return num(r.streak,0)>=3;return false}
function sortLearning(rows,type){return rows.filter(r=>eligible(r,type,'learning')).sort((a,b)=>num(b.metrics[type].score)-num(a.metrics[type].score)||num(b.metrics[type].evidence)-num(a.metrics[type].evidence)||b.mastery-a.mastery||a.name.localeCompare(b.name,'vi'))}
function sortDiligent(rows,type){return rows.filter(r=>eligible(r,type,'diligent')).sort((a,b)=>num(b.metrics[type].activity)-num(a.metrics[type].activity)||b.streak-a.streak||a.name.localeCompare(b.name,'vi'))}
function sortProgress(rows,type){return rows.filter(r=>eligible(r,type,'progress')).sort((a,b)=>num(b.metrics[type].improvement)-num(a.metrics[type].improvement)||num(b.metrics[type].score)-num(a.metrics[type].score))}
function sortAccuracy(rows,type){return rows.filter(r=>eligible(r,type,'accuracy')).sort((a,b)=>num(b.metrics[type].accuracy)-num(a.metrics[type].accuracy)||num(b.metrics[type].accuracyEvidence)-num(a.metrics[type].accuracyEvidence))}
function sortMastery(rows,type){return rows.filter(r=>eligible(r,type,'mastery')).sort((a,b)=>b.mastery-a.mastery||num(b.metrics[type]?.accuracy,0)-num(a.metrics[type]?.accuracy,0))}
function sortStreak(rows,type){return rows.filter(r=>eligible(r,type,'streak')).sort((a,b)=>b.streak-a.streak||num(b.metrics[type]?.activity,0)-num(a.metrics[type]?.activity,0))}
function starWinner(groups=[]){const pts=new Map(),refs=new Map();groups.forEach(g=>g.slice(0,5).forEach((x,i)=>{refs.set(x.publicKey,x);pts.set(x.publicKey,(pts.get(x.publicKey)||0)+(5-i))}));if(!pts.size)return null;const [key,points]=[...pts.entries()].sort((a,b)=>b[1]-a[1])[0];return {...refs.get(key),_starPoints:points}}
function boardData(type){const rows=publicRows.filter(r=>validPeriodRow(r,type)),learning=sortLearning(rows,type),diligent=sortDiligent(rows,type),progress=sortProgress(rows,type),accuracy=sortAccuracy(rows,type),mastery=sortMastery(rows,type),streak=sortStreak(rows,type),star=starWinner([learning,diligent,progress,accuracy,mastery,streak]),m=x=>x?.metrics?.[type]||{};return {rows,learning,diligent,progress,accuracy,mastery,streak,star,awards:[
  learning[0]?{title:'Học tập nổi bật',icon:'🏆',winner:learning[0],detail:`TB ${num(m(learning[0]).score,0).toFixed(2)}/10 • ${num(m(learning[0]).evidence,0)} lượt`}:null,
  diligent[0]?{title:'Chăm chỉ nhất',icon:'🔥',winner:diligent[0],detail:`${num(m(diligent[0]).activity,0)} lượt học trong kỳ`}:null,
  progress[0]?{title:'Tiến bộ nhất',icon:'🚀',winner:progress[0],detail:`Tăng ${num(m(progress[0]).improvement,0).toFixed(2)} điểm`}:null,
  accuracy[0]?{title:'Chính xác nhất',icon:'🎯',winner:accuracy[0],detail:`${Math.round(num(m(accuracy[0]).accuracy,0)*100)}% • ${num(m(accuracy[0]).accuracyEvidence,0)} câu`}:null,
  mastery[0]?{title:'Mastery xuất sắc',icon:'💎',winner:mastery[0],detail:`${mastery[0].mastery} mã kiến thức đã vững`}:null,
  streak[0]?{title:'Chuỗi học bền bỉ',icon:'⚡',winner:streak[0],detail:`${streak[0].streak} ngày học liên tục`}:null,
  star?{title:type==='week'?'Ngôi sao tuần':type==='month'?'Ngôi sao tháng':'Ngôi sao Math12 Hub',icon:'⭐',winner:star,detail:`${star._starPoints} điểm vinh danh tổng hợp`}:null
].filter(Boolean)}}
function avatarHtml(row,cls=''){const a=row?.avatar;try{if(a&&typeof window.avatarV378Svg==='function')return `<div class="v407-avatar ${cls}">${window.avatarV378Svg(a,'mini')}</div>`}catch(_){}const letter=(String(row?.name||'?').trim().split(/\s+/).at(-1)||'?')[0].toUpperCase();return `<div class="v407-avatar v407-initial ${cls}">${h(letter)}</div>`}
function profileLine(row){return `Lv.${row?.level||1} • ${h(row?.rank||'Học viên Toán học')}`}
function currentPublicKey(){if(typeof firebaseUser==='undefined'||!firebaseUser)return '';return localStorage.getItem(`math12hub-honor-v409-key-${firebaseUser.uid}`)||''}
async function cacheOwnPublicKey(){if(typeof firebaseUser==='undefined'||!firebaseUser)return '';const k=await shortHash(firebaseUser.uid);try{localStorage.setItem(`math12hub-honor-v409-key-${firebaseUser.uid}`,k)}catch(_){}return k}
function podiumCard(row,rank,currentKey=''){if(!row)return `<div class="v407-podium-card rank-${rank} empty"><div class="v407-medal">${rank}</div><div class="v407-podium-empty">Chưa có học sinh đạt mốc</div></div>`;const mine=currentKey&&row.publicKey===currentKey,m=row.metrics?.[selectedPeriod]||{};return `<div class="v407-podium-card rank-${rank}${mine?' is-me':''}"><div class="v407-medal">${rank===1?'🥇':rank===2?'🥈':'🥉'}</div>${avatarHtml(row,'podium')}<b>${h(row.name)}${mine?' <em>Em</em>':''}</b><small>${profileLine(row)}</small><strong>${m.score==null?'—':num(m.score,0).toFixed(2)}</strong><span>${num(m.evidence,0)} lượt • ${row.mastery||0} mastery</span></div>`}
function awardCard(a,currentKey=''){const r=a.winner,mine=currentKey&&r?.publicKey===currentKey;return `<div class="v407-award-card${mine?' is-me':''}"><div class="v407-award-icon">${a.icon}</div><div class="v407-award-copy"><small>${h(a.title)}</small><b>${h(r?.name||'Chưa đủ dữ liệu')}${mine?' <em>Em</em>':''}</b><span>${h(a.detail||'')}</span></div>${r?avatarHtml(r,'award'):''}</div>`}
function rankingTable(rows=[],currentKey=''){if(!rows.length)return '<div class="v407-empty"><b>Chưa có học sinh đạt mốc học tập để vào Top 10.</b><span>Bảng sẽ tự xuất hiện khi có học sinh đủ số lượt và điểm trung bình theo quy định.</span></div>';return `<div class="v407-ranking"><div class="v407-rank-head"><span>Hạng</span><span>Học sinh</span><span>Điểm TB</span><span>Minh chứng</span><span>Mastery</span></div>${rows.slice(0,10).map((r,i)=>{const mine=currentKey&&r.publicKey===currentKey,m=r.metrics?.[selectedPeriod]||{};return `<div class="v407-rank-row${mine?' is-me':''}"><div class="v407-rank-no">${i<3?['🥇','🥈','🥉'][i]:i+1}</div><div class="v407-student">${avatarHtml(r,'table')}<div><b>${h(r.name)}${mine?' <em>Em</em>':''}</b><small>${profileLine(r)}</small></div></div><div class="v407-score"><b>${m.score==null?'—':num(m.score,0).toFixed(2)}</b><small>Math12 Hub</small></div><div><b>${num(m.evidence,0)}</b><small>lượt tính hạng</small></div><div><b>${r.mastery||0}</b><small>mã đã vững</small></div></div>`}).join('')}</div>`}
function thresholdText(type){const l=LIMITS[type];return `Top học tập: TB ≥ ${l.academicScore.toFixed(1)} với ≥ ${l.academicEvidence} lượt • Chăm chỉ: ≥ ${l.activity} lượt • Chính xác: ≥ ${Math.round(l.accuracy*100)}% với ≥ ${l.accuracyEvidence} câu • Tiến bộ: +${l.improvement.toFixed(2)} điểm • Mastery: ≥ 5 mã • Chuỗi học: ≥ 3 ngày.`}
function myProgressCard(type,currentKey){if(!currentKey)return '';const me=publicRows.find(r=>r.publicKey===currentKey);if(!me)return '<div class="v409-my-milestone"><b>🎯 Mốc của em</b><span>Hệ thống đang đồng bộ hồ sơ thành tích. Sau khi em hoàn thành một lượt học, bảng sẽ tự cập nhật.</span></div>';const m=me.metrics?.[type]||{},l=LIMITS[type],done=[];if(eligible(me,type,'learning'))done.push('🏆 Học tập');if(eligible(me,type,'diligent'))done.push('🔥 Chăm chỉ');if(eligible(me,type,'progress'))done.push('🚀 Tiến bộ');if(eligible(me,type,'accuracy'))done.push('🎯 Chính xác');if(eligible(me,type,'mastery'))done.push('💎 Mastery');if(eligible(me,type,'streak'))done.push('⚡ Chuỗi học');let next='';if(!done.length){const need=Math.max(0,l.academicEvidence-num(m.evidence,0));next=need?`Cần thêm ${need} lượt và duy trì TB từ ${l.academicScore.toFixed(1)} để mở mốc Học tập.`:`Duy trì TB từ ${l.academicScore.toFixed(1)} để mở mốc Học tập.`}else next=`Đã đạt: ${done.join(' • ')}.`;return `<div class="v409-my-milestone"><b>🎯 Mốc của em</b><span>${h(next)}</span></div>`}
function boardHtml(type,currentKey=''){const b=boardData(type),w=periodWindow(type),top=b.learning.slice(0,10);return `<div class="v407-board-head"><div><span class="v407-kicker">GLOBAL HALL OF FAME • AUTO LIVE</span><h2>🏆 Bảng vinh danh toàn Math12 Hub</h2><p>${h(w.label)} • ${b.rows.length} hồ sơ hoạt động trong mốc này • ${lastSnapshotAt?`Cập nhật ${h(stampText(lastSnapshotAt))}`:'Đang kết nối dữ liệu trực tiếp'}</p></div><div class="v407-positive-badge">⚡ Tự động • không cần giáo viên xuất bản</div></div>${myProgressCard(type,currentKey)}<div class="v407-podium"><div class="v407-podium-slot second">${podiumCard(top[1],2,currentKey)}</div><div class="v407-podium-slot first">${podiumCard(top[0],1,currentKey)}</div><div class="v407-podium-slot third">${podiumCard(top[2],3,currentKey)}</div></div><div class="v407-section-title"><div><small>DANH HIỆU TOÀN HỆ THỐNG</small><h3>Những mốc đáng ghi nhận</h3></div><span class="v409-live-dot">● LIVE</span></div><div class="v407-awards">${b.awards.map(a=>awardCard(a,currentKey)).join('')||'<div class="v407-empty"><b>Chưa có học sinh đạt mốc trong giai đoạn này.</b><span>Hệ thống sẽ tự bổ sung ngay khi dữ liệu đủ điều kiện.</span></div>'}</div><div class="v407-section-title"><div><small>TOP 10 TOÀN HỆ THỐNG</small><h3>Học tập nổi bật</h3></div><span class="v407-method">Chỉ hiện học sinh đã đạt mốc tối thiểu</span></div>${rankingTable(top,currentKey)}<div class="v407-footnote"><b>Mốc tự động V40.9:</b> ${h(thresholdText(type))}<br><b>Quyền riêng tư:</b> bảng công khai chỉ lưu tên hiển thị, Avatar và các chỉ số tổng hợp cần cho vinh danh; không lưu email, đáp án chi tiết hay thông tin lớp.</div>`}
function periodTabs(){return `<div class="v407-tabs">${Object.entries(PERIODS).map(([k,v])=>`<button type="button" class="${k===selectedPeriod?'active':''}" onclick="v409SelectPeriod('${k}')">${v.icon} ${v.label}</button>`).join('')}</div>`}
function pageShell(){return document.getElementById('v407HonorPage')}
function renderShell(){const host=pageShell();if(!host)return false;if(typeof firebaseUser==='undefined'||!firebaseUser){stopRealtime();host.innerHTML=`<div class="v407-hero"><div><span class="v407-kicker">GLOBAL HALL OF FAME</span><h2>🏆 Bảng vinh danh toàn Math12 Hub</h2><p>Đăng nhập để xem bảng vinh danh toàn hệ thống. Không cần tham gia lớp và không cần giáo viên xuất bản.</p><button class="btn btn-blue" onclick="openFirebaseAccount()">Đăng nhập</button></div></div>`;return false}host.innerHTML=`<div class="v407-toolbar v409-global-toolbar">${periodTabs()}<div class="v407-actions"><button class="btn btn-soft" onclick="v409Refresh(true)">↻ Cập nhật ngay</button></div></div><div class="v409-auto-note"><b>⚡ Vinh danh tự động toàn hệ thống.</b><span>Mỗi khi học sinh hoàn thành hoạt động và dữ liệu được đồng bộ, hồ sơ thành tích được tính lại. Bảng đang mở nhận thay đổi theo thời gian thực.</span></div><div id="v407Board"><div class="v407-loading">Đang tải bảng vinh danh toàn hệ thống…</div></div>`;return true}
async function render(){if(!renderShell())return;await cacheOwnPublicKey();scheduleOwnSync(false);startRealtime()}
function renderBoard(){const box=document.getElementById('v407Board');if(!box)return;box.innerHTML=boardHtml(selectedPeriod,currentPublicKey())}
function refreshLiveStatus(){if(isHonorActive())renderBoard()}
function startRealtime(){if(boardStarted&&unsubscribe)return;if(typeof firebaseDb==='undefined'||!firebaseDb)return;stopRealtime();boardStarted=true;const box=document.getElementById('v407Board');if(box)box.innerHTML='<div class="v407-loading">Đang kết nối bảng vinh danh trực tiếp…</div>';try{unsubscribe=firebaseDb.collection(COLLECTION).where('schemaVersion','==',SCHEMA).onSnapshot(s=>{publicRows=s.docs.map(normalizePublicDoc).filter(Boolean);lastSnapshotAt=new Date();renderBoard()},err=>{console.warn('V40.9 honor realtime',err);if(box)box.innerHTML=`<div class="firebase-banner error"><b>Chưa đọc được Bảng vinh danh toàn hệ thống.</b><br>${h(typeof firebaseErrorText==='function'?firebaseErrorText(err):err.message)}<br><small>V40.9 cần cập nhật Firestore Rules kèm trong gói triển khai để cho phép đọc hồ sơ vinh danh công khai đã làm sạch.</small></div>`})}catch(err){if(box)box.innerHTML=`<div class="firebase-banner error">${h(err.message)}</div>`}}
function stopRealtime(){if(typeof unsubscribe==='function')try{unsubscribe()}catch(_){}unsubscribe=null;boardStarted=false}
async function refresh(force=false){if(typeof firebaseUser==='undefined'||!firebaseUser)return render();await syncOwnProfile(!!force);if(!unsubscribe)startRealtime();else renderBoard()}
function selectPeriod(p){if(!PERIODS[p])return;selectedPeriod=p;document.querySelectorAll('.v407-tabs button').forEach(b=>b.classList.toggle('active',b.getAttribute('onclick')?.includes(`'${p}'`)));renderBoard()}
function installPushHook(){const base=window.firebasePushState;if(typeof base!=='function'||base.__v409)return;const wrap=async function(){const ok=await base.apply(this,arguments);if(ok)scheduleOwnSync(false);return ok};wrap.__v409=true;wrap.__base=base;window.firebasePushState=wrap}
function installSaveSideHook(){const base=window.save;if(typeof base!=='function'||base.__v409)return;const wrap=function(){const out=base.apply(this,arguments);if(typeof firebaseUser!=='undefined'&&firebaseUser)scheduleOwnSync(false);return out};wrap.__v409=true;wrap.__base=base;window.save=wrap}
function inject(){
  try{ROLE_ACCESS.student.add('honor');ROLE_ACCESS.teacher.add('honor');ROLE_ACCESS.admin.add('honor')}catch(_){}
  const sNav=document.querySelector('[data-nav-group="student-achievement"] .nav-group-items');if(sNav&&!sNav.querySelector('[data-page="honor"]'))sNav.insertAdjacentHTML('beforeend','<button data-page="honor" title="Bảng vinh danh toàn hệ thống"><span class="ico">🏆</span><span class="nav-label">Bảng vinh danh</span></button>');
  const tNav=document.querySelector('.teacher-nav-block [data-nav-group="teacher-tools"] .nav-group-items');if(tNav&&!tNav.querySelector('[data-page="honor"]'))tNav.insertAdjacentHTML('beforeend','<button data-page="honor" title="Bảng vinh danh toàn hệ thống"><span class="ico">🏆</span><span class="nav-label">Bảng vinh danh</span></button>');
  const main=document.querySelector('main .content')||document.querySelector('main');if(main&&!document.getElementById('page-honor'))main.insertAdjacentHTML('beforeend','<section class="section" id="page-honor"><div id="v407HonorPage"></div></section>');
  const dash=document.getElementById('avatarV378Dashboard');if(dash&&!document.getElementById('v407DashboardHonor'))dash.insertAdjacentHTML('afterend','<div class="student-only v407-dashboard-card" id="v407DashboardHonor"><div><span>🏆</span><div><b>Bảng vinh danh toàn Math12 Hub</b><small>Tự động ghi nhận học tập, chăm chỉ, tiến bộ, chính xác, Mastery và chuỗi học.</small></div></div><button class="btn btn-soft" onclick="goPage(\'honor\')">Xem vinh danh</button></div>');
}
function installNavigationHook(){const base=window.goPage;if(typeof base!=='function'||base.__v409)return;const wrap=function(page,internal=false){const out=base.call(this,page,internal);if(page==='honor'){const title=document.getElementById('pageTitle');if(title)title.textContent='Bảng vinh danh toàn hệ thống';setTimeout(render,0)}else if(unsubscribe)setTimeout(stopRealtime,0);return out};wrap.__v409=true;wrap.__base=base;window.goPage=wrap}
function probeAuth(){clearInterval(authProbeTimer);let tries=0;authProbeTimer=setInterval(()=>{tries++;if(typeof firebaseUser!=='undefined'&&firebaseUser){cacheOwnPublicKey();scheduleOwnSync(false);clearInterval(authProbeTimer)}else if(tries>30)clearInterval(authProbeTimer)},1000)}
function init(){inject();installPushHook();installSaveSideHook();installNavigationHook();probeAuth();document.documentElement.dataset.honorBoardBuild=BUILD;if(isHonorActive())render()}
window.v409HonorBoard={build:BUILD,schema:SCHEMA,collection:COLLECTION,render,refresh,syncOwnProfile,buildOwnPayload,boardData,limits:LIMITS};
window.v409SelectPeriod=selectPeriod;window.v409Refresh=refresh;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
