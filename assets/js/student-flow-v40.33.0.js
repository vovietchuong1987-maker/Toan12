/* Math12 Hub v40.33.0 — Student Learning Flow
   Continuous student journey: Today -> attempt -> result -> correction -> reward -> next action.
   This layer does not change grading or Firestore security and does not add background reads.
*/
(function(){
'use strict';
const BUILD='40.33.0-student-learning-flow';
const VERSION=403300;
const safeMode=new URLSearchParams(location.search).has('safe');
const MAX_AGE=12*60*60*1000;
let lastResult=null;
let installed=false;

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(_){return v}}
function uid(){try{return (typeof firebaseUser!=='undefined'&&firebaseUser?.uid)||'local'}catch(_){return 'local'}}
function role(){try{return typeof window.currentSecureRole==='function'?String(window.currentSecureRole()||'student'):'student'}catch(_){return 'student'}}
function storageKey(){return `math12hub:student-flow:v4033:${uid()}`}
function loadSummary(){try{const x=JSON.parse(localStorage.getItem(storageKey())||'null');return x&&Date.now()-Number(x.at||0)<MAX_AGE?x:null}catch(_){return null}}
function saveSummary(x){try{localStorage.setItem(storageKey(),JSON.stringify({...x,at:Date.now()}))}catch(_){}renderResume()}
function clearSummary(){try{localStorage.removeItem(storageKey())}catch(_){}renderResume()}
function currentAttempt(){try{const a=state?.examAttempts;return Array.isArray(a)&&a.length?a[a.length-1]:null}catch(_){return null}}
function reduced(){return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches}
function dueDate(a){try{if(!a?.dueAt)return null;if(typeof a.dueAt.toDate==='function')return a.dueAt.toDate();if(typeof a.dueAt.seconds==='number')return new Date(a.dueAt.seconds*1000);return new Date(a.dueAt)}catch(_){return null}}
function openDate(a){try{if(!a?.opensAt)return null;if(typeof a.opensAt.toDate==='function')return a.opensAt.toDate();if(typeof a.opensAt.seconds==='number')return new Date(a.opensAt.seconds*1000);return new Date(a.opensAt)}catch(_){return null}}
function studentAssignments(){try{return typeof firebaseStudentAssignments!=='undefined'&&Array.isArray(firebaseStudentAssignments)?firebaseStudentAssignments:[]}catch(_){return []}}
function nextOpenAssignment(){
  const now=Date.now();
  return studentAssignments().filter(a=>{
    if(a?.submission)return false;
    const o=openDate(a),d=dueDate(a);
    return (!o||o.getTime()<=now)&&(!d||d.getTime()>=now);
  }).sort((a,b)=>(dueDate(a)?.getTime()||9e15)-(dueDate(b)?.getTime()||9e15))[0]||null;
}
function closeExamQuiet(){try{if(document.getElementById('examApp')?.classList.contains('show'))window.closeExamApp?.()}catch(_){}}
function goToday(){closeExamQuiet();window.goPage?.('dashboard');setTimeout(()=>{window.M12StudentHome?.sync?.();renderResume();window.scrollTo?.({top:0,behavior:reduced()?'auto':'smooth'})},80)}
function nextAction(){
  const a=nextOpenAssignment();
  closeExamQuiet();
  if(a){setTimeout(()=>window.firebaseOpenAssignment?.(a.classId,a.id),80);return}
  window.goPage?.('dashboard');
  setTimeout(()=>{if(typeof window.v28StartNextAction==='function')window.v28StartNextAction();else window.goPage?.('learning-plan')},100);
}
function viewWrong(){
  const el=document.querySelector('.exam-review-item.no');
  if(el){el.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'center'});el.classList.add('m12f-pulse');setTimeout(()=>el.classList.remove('m12f-pulse'),900);return}
  practiceRecentMistakes();
}
function practiceCurrentMistakes(){
  const rows=lastResult?.wrongQuestions||[];
  if(!rows.length){window.v28PracticeMistakes?.(10);return}
  const attemptId=lastResult.attemptId||Date.now().toString(36);
  const qs=rows.map((q,i)=>({...clone(q),part:'Sửa câu sai',_flowOriginalIndex:i}));
  const codes=[...new Set(qs.map(q=>q.knowledgeCode).filter(Boolean))];
  closeExamQuiet();
  const cfg={
    id:`flow-review-${attemptId}`,
    mode:'adaptive',
    title:`Sửa ${qs.length} câu chưa đúng`,
    subtitle:'Làm lại ngay các câu vừa sai để khép kín vòng học.',
    durationMinutes:Math.max(5,Math.min(30,qs.length*2)),
    questions:qs,
    scoring:'normalized',
    attemptType:`flow-review-${attemptId}`,
    adaptiveCodes:codes,
    rules:'Tập trung vào các câu vừa sai. Sau khi hoàn thành, hệ thống sẽ đề xuất việc học tiếp theo.'
  };
  setTimeout(()=>window.openExamStart?.(cfg),60);
}
function practiceRecentMistakes(){
  if(lastResult?.wrongQuestions?.length){practiceCurrentMistakes();return}
  closeExamQuiet();window.v28PracticeMistakes?.(10);
}
function rewardLine(summary){
  if(!summary?.reward)return '';
  const r=summary.reward;return `<span class="m12f-reward">+${Number(r.xp)||0} EXP${Number(r.gold)?` • +${Number(r.gold)} 🪙`:''}${r.levelUp?` • Lv.${Number(r.newLevel)||''}`:''}</span>`;
}
function resultCard(summary){
  const wrong=Number(summary.wrong)||0,score=summary.score;
  const scoreText=score==null?'Đã nộp':`${Number(score).toFixed(summary.scoring==='thpt'?2:1)}/10`;
  const correction=wrong>0?`<button class="exam-btn primary" type="button" onclick="M12StudentFlow.practiceCurrentMistakes()">Sửa ${wrong} câu sai</button>`:`<button class="exam-btn primary" type="button" onclick="M12StudentFlow.nextAction()">Việc tiếp theo →</button>`;
  return `<section class="m12f-result-flow" id="m12fResultFlow" aria-label="Luồng học tiếp theo">
    <div class="m12f-flow-head"><div><span>LUỒNG HỌC</span><h3>Tiếp tục khi kiến thức còn đang mới</h3></div>${rewardLine(summary)}</div>
    <div class="m12f-steps" aria-label="Tiến trình học"><span class="done"><i>1</i><b>Làm bài</b></span><span class="done"><i>2</i><b>Kết quả</b></span><span class="${wrong?'current':'done'}"><i>${wrong?'3':'✓'}</i><b>${wrong?'Củng cố':'Đã chắc'}</b></span><span class="${wrong?'':'current'}"><i>4</i><b>Tiếp tục</b></span></div>
    <div class="m12f-flow-summary"><strong>${esc(scoreText)}</strong><span>${wrong?`${wrong} câu cần làm lại để củng cố ngay.`:'Không còn câu sai trong lượt này.'}</span></div>
    <div class="m12f-flow-actions">${wrong?`<button class="exam-btn" type="button" onclick="M12StudentFlow.viewWrong()">Xem câu sai</button>`:''}${correction}<button class="exam-btn" type="button" onclick="M12StudentFlow.goToday()">Về Hôm nay</button>${wrong?`<button class="exam-btn m12f-next" type="button" onclick="M12StudentFlow.nextAction()">Bỏ qua • việc tiếp theo</button>`:''}</div>
  </section>`;
}
function enhanceResult(result,cfg){
  const card=document.querySelector('.exam-result-card');if(!card||card.querySelector('#m12fResultFlow'))return;
  const details=Array.isArray(result?.details)?result.details:[];
  const wrongRows=details.filter(x=>!x.ok&&x.q).map(x=>clone(x.q));
  const attempt=currentAttempt();
  lastResult={attemptId:attempt?.id||'',wrongQuestions:wrongRows,config:clone(cfg||{}),score:Number(result?.score),wrong:wrongRows.length,scoring:cfg?.scoring||'normalized'};
  const summary={kind:'exam',title:cfg?.title||attempt?.title||'Bài vừa làm',score:Number(result?.score),wrong:wrongRows.length,scoring:cfg?.scoring||'normalized',attemptId:attempt?.id||'',at:Date.now()};
  const actions=card.querySelector('.exam-review-actions');
  if(actions){
    const more=document.createElement('details');more.className='m12f-more';more.innerHTML='<summary>Tùy chọn khác</summary>';
    actions.parentNode.insertBefore(more,actions);more.appendChild(actions);
    more.insertAdjacentHTML('beforebegin',resultCard(summary));
  }else card.insertAdjacentHTML('beforeend',resultCard(summary));
  saveSummary(summary);
}
function markAssignmentSubmitted(cfg){
  const ref=cfg?.assignmentRef;if(!ref)return;
  const a=studentAssignments().find(x=>x.classId===ref.classId&&x.id===ref.assignmentId);
  if(a&&!a.submission)a.submission={status:'submitted',score:null,submittedAt:new Date().toISOString(),attemptId:`local-${Date.now()}`};
  window.M12StudentHome?.sync?.();
}
function enhanceSecure(cfg){
  const card=document.querySelector('.exam-result-card');if(!card||card.querySelector('#m12fResultFlow'))return;
  markAssignmentSubmitted(cfg);
  const next=nextOpenAssignment();
  const box=document.createElement('section');box.id='m12fResultFlow';box.className='m12f-result-flow secure';
  box.innerHTML=`<div class="m12f-flow-head"><div><span>ĐÃ HOÀN THÀNH</span><h3>Bài đã nộp an toàn</h3></div><span class="m12f-wait">Chờ giáo viên chấm</span></div><div class="m12f-steps"><span class="done"><i>✓</i><b>Làm bài</b></span><span class="done"><i>✓</i><b>Nộp bài</b></span><span class="current"><i>3</i><b>Chờ chấm</b></span><span><i>4</i><b>Tiếp tục</b></span></div><p class="m12f-secure-note">Không cần chờ ở màn hình này. ${next?'Em còn bài khác đang mở và có thể làm tiếp ngay.':'Em có thể tiếp tục lộ trình tự học trong khi chờ kết quả.'}</p><div class="m12f-flow-actions"><button class="exam-btn primary" type="button" onclick="M12StudentFlow.nextAction()">${next?'Làm bài tiếp theo →':'Tiếp tục học →'}</button><button class="exam-btn" type="button" onclick="M12StudentFlow.goToday()">Về Hôm nay</button></div>`;
  const actions=card.querySelector('.exam-review-actions');if(actions){actions.classList.add('m12f-replaced-actions');actions.insertAdjacentElement('beforebegin',box)}else card.appendChild(box);
  saveSummary({kind:'assignment',title:cfg?.title||'Bài được giao',score:null,wrong:0,waiting:true,classId:cfg?.assignmentRef?.classId||'',assignmentId:cfg?.assignmentRef?.assignmentId||'',at:Date.now()});
}
function updateReward(e){
  const r=e?.detail?.reward||e?.detail;if(!r)return;
  const s=loadSummary();if(!s||s.kind!=='exam')return;
  s.reward={xp:Number(r.xp)||0,gold:Number(r.gold)||0,levelUp:!!r.levelUp,newLevel:Number(r.newLevel)||0};s.at=Date.now();
  try{localStorage.setItem(storageKey(),JSON.stringify(s))}catch(_){}
  const head=document.querySelector('#m12fResultFlow .m12f-flow-head');if(head){head.querySelector('.m12f-reward')?.remove();head.insertAdjacentHTML('beforeend',rewardLine(s))}
  renderResume();
}
function resumeMarkup(s){
  const wrong=Number(s.wrong)||0;
  const label=s.kind==='assignment'?'BÀI VỪA NỘP':wrong?'CỦNG CỐ NGAY':'NHỊP HỌC ĐANG TỐT';
  const title=s.kind==='assignment'?'Không cần chờ kết quả':wrong?`Còn ${wrong} câu nên sửa ngay`:'Sẵn sàng cho việc tiếp theo';
  const meta=s.kind==='assignment'?`${esc(s.title||'Bài được giao')} • đang chờ giáo viên chấm`:s.score!=null?`${esc(s.title||'Bài vừa làm')} • ${Number(s.score).toFixed(s.scoring==='thpt'?2:1)}/10`:esc(s.title||'Bài vừa làm');
  const primary=s.kind==='assignment'?`<button type="button" class="btn btn-primary" onclick="M12StudentFlow.nextAction()">Tiếp tục học →</button>`:wrong?`<button type="button" class="btn btn-primary" onclick="M12StudentFlow.practiceRecentMistakes()">Sửa ${wrong} câu sai</button>`:`<button type="button" class="btn btn-primary" onclick="M12StudentFlow.nextAction()">Việc tiếp theo →</button>`;
  return `<section class="m12f-resume" id="m12fResume"><div class="m12f-resume-icon">${s.kind==='assignment'?'✓':wrong?'↺':'⚡'}</div><div class="m12f-resume-copy"><span>${label}</span><b>${title}</b><small>${meta}</small>${rewardLine(s)}</div><div class="m12f-resume-actions">${primary}<button type="button" class="m12f-dismiss" onclick="M12StudentFlow.dismiss()" aria-label="Ẩn gợi ý này">×</button></div></section>`;
}
function renderResume(){
  if(safeMode||role()!=='student')return;
  const home=document.getElementById('m12hStudentHome');if(!home)return;
  home.querySelector('#m12fResume')?.remove();
  const s=loadSummary();if(!s)return;
  const grid=home.querySelector('.m12h-focus-grid');
  if(grid)grid.insertAdjacentHTML('afterend',resumeMarkup(s));else home.insertAdjacentHTML('afterbegin',resumeMarkup(s));
}
function enhanceSubmissionModal(){
  if(role()!=='student')return;
  const back=document.getElementById('modalBackdrop');if(!back?.classList.contains('show'))return;
  const footer=document.getElementById('modalFooter'),body=document.getElementById('modalBody');if(!footer||!body||footer.dataset.m12f==='1')return;
  const bad=body.querySelectorAll('.v30-review-row.bad').length;
  const graded=!!body.querySelector('.v30-review-list')||/Điểm/.test(body.textContent||'');
  if(!graded)return;
  footer.dataset.m12f='1';
  footer.innerHTML=`<button class="btn btn-soft" onclick="closeModal()">Đóng</button>${bad?`<button class="btn btn-blue" onclick="closeModal();setTimeout(()=>M12StudentFlow.practiceRecentMistakes(),60)">↺ Luyện câu sai</button>`:`<button class="btn btn-blue" onclick="closeModal();setTimeout(()=>M12StudentFlow.nextAction(),60)">Việc tiếp theo →</button>`}<button class="btn btn-soft" onclick="closeModal();M12StudentFlow.goToday()">Hôm nay</button>`;
}
function wrap(name,make){
  const base=window[name];if(typeof base!=='function'||base.__m12f4033)return false;
  const fn=make(base);fn.__m12f4033=true;fn.__base=base;window[name]=fn;return true;
}
function installWrappers(){
  wrap('renderExamResult',base=>function(result,used,answered,auto){const cfg=clone((typeof examSession!=='undefined'&&examSession?.config)||{});const out=base.apply(this,arguments);setTimeout(()=>enhanceResult(result,cfg),0);return out});
  wrap('renderSecureAssignmentSubmitted',base=>function(used,answered,auto){const cfg=clone((typeof examSession!=='undefined'&&examSession?.config)||{});const out=base.apply(this,arguments);setTimeout(()=>enhanceSecure(cfg),0);return out});
  wrap('firebaseShowMySubmission',base=>async function(){const out=await base.apply(this,arguments);setTimeout(enhanceSubmissionModal,0);return out});
}
function install(){
  if(installed||safeMode)return;installed=true;
  installWrappers();
  let tries=0;const t=setInterval(()=>{tries++;installWrappers();if(tries>18)clearInterval(t)},350);
  window.addEventListener('math12hub:attempt-rewarded',updateReward);
  window.addEventListener('math12hub:page-changed',()=>setTimeout(renderResume,30));
  window.addEventListener('math12hub:student-home-ready',()=>setTimeout(renderResume,30));
  window.addEventListener('math12hub:account-hydrated',()=>setTimeout(renderResume,80));
  window.addEventListener('math12hub:state-saved',()=>setTimeout(renderResume,60));
  setTimeout(renderResume,120);
  try{window.dispatchEvent(new CustomEvent('math12hub:student-flow-ready',{detail:{build:BUILD,version:VERSION}}))}catch(_){}
}
window.M12StudentFlow={build:BUILD,version:VERSION,goToday,nextAction,viewWrong,practiceCurrentMistakes,practiceRecentMistakes,dismiss:clearSummary,render:renderResume};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
