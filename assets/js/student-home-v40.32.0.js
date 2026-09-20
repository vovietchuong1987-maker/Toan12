/* Math12 Hub v40.32.0 — Student Home Redesign
   A zero-extra-read experience layer for the student dashboard.
   It reuses already-loaded assignment, progress and v28 recommendation data.
*/
(function(){
'use strict';
const BUILD='40.32.0-student-home';
const VERSION=403200;
const safeMode=new URLSearchParams(location.search).has('safe');
let root=null, syncTimer=0, observer=null;

function role(){
  try{return typeof window.currentSecureRole==='function'?String(window.currentSecureRole()||'student'):'student'}catch(_){return 'student'}
}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function attr(v=''){return esc(v)}
function toDate(v){
  try{
    if(!v)return null;
    if(v instanceof Date)return Number.isNaN(v.getTime())?null:v;
    if(typeof v.toDate==='function'){const d=v.toDate();return Number.isNaN(d.getTime())?null:d}
    if(typeof v.seconds==='number'){const d=new Date(v.seconds*1000);return Number.isNaN(d.getTime())?null:d}
    const d=new Date(v);return Number.isNaN(d.getTime())?null:d;
  }catch(_){return null}
}
function name(){
  const p=window.firebaseProfile||{},u=window.firebaseUser||{};
  const full=String(p.displayName||p.name||u.displayName||'').trim();
  return full?full.split(/\s+/).slice(-1)[0]:'em';
}
function greeting(){const h=new Date().getHours();return h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối'}
function todayLabel(){return new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'}).format(new Date())}
function text(id,fallback='—'){const e=document.getElementById(id);return String(e?.textContent||fallback).trim()||fallback}
function allAssignments(){
  try{return Array.isArray(firebaseStudentAssignments)?firebaseStudentAssignments:[]}catch(_){return []}
}
function assignmentInfo(a){
  const now=Date.now(),open=toDate(a?.opensAt),due=toDate(a?.dueAt),done=!!a?.submission;
  const future=!!open&&open.getTime()>now,over=!!due&&due.getTime()<now;
  return {open,due,done,future,over,available:!done&&!future&&!over};
}
function assignmentPriority(a){
  const s=assignmentInfo(a);if(s.done)return 9e15;if(s.over)return 8e15;if(s.future)return s.open?.getTime()||7e15;return s.due?.getTime()||6e15;
}
function pendingAssignments(){return allAssignments().filter(a=>!a?.submission).sort((a,b)=>assignmentPriority(a)-assignmentPriority(b))}
function openAssignments(){return pendingAssignments().filter(a=>assignmentInfo(a).available)}
function dueText(d){
  if(!d)return 'Không đặt hạn';
  const delta=d.getTime()-Date.now(),abs=Math.abs(delta),day=864e5,hour=36e5;
  if(delta<0)return `Quá hạn ${abs<day?Math.max(1,Math.ceil(abs/hour))+' giờ':Math.ceil(abs/day)+' ngày'}`;
  if(delta<=day)return `Còn ${Math.max(1,Math.ceil(delta/hour))} giờ`;
  if(delta<=3*day)return `Còn ${Math.ceil(delta/day)} ngày`;
  return `Hạn ${new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit'}).format(d)}`;
}
function selfAction(){
  return {
    title:text('v28NextActionTitle','Tiếp tục lộ trình học'),
    meta:text('v28NextActionMeta','Học theo tiến độ hiện tại'),
    reason:text('v28NextActionReason','Hệ thống ưu tiên từ tiến độ và các nội dung cần củng cố.')
  };
}
function summary(){
  const pending=pendingAssignments(),available=openAssignments(),overdue=pending.filter(a=>assignmentInfo(a).over),future=pending.filter(a=>assignmentInfo(a).future);
  return {pending,available,overdue,future,graded:allAssignments().filter(a=>a?.submission?.score!=null)};
}
function inject(){
  const dash=document.getElementById('page-dashboard');if(!dash||document.getElementById('m12hStudentHome')){root=document.getElementById('m12hStudentHome');return}
  const firstStudentHero=dash.querySelector(':scope > .student-only.hero');
  root=document.createElement('div');root.id='m12hStudentHome';root.className='m12h-home student-only';
  root.innerHTML=`
    <div class="m12h-head">
      <div><span class="m12h-kicker">HÔM NAY</span><h2 id="m12hGreeting">Chào em 👋</h2><p id="m12hToday"></p></div>
      <button class="m12h-goal" type="button" onclick="v28OpenPlanSettings?.()"><span>Mục tiêu</span><b id="m12hGoal">8.0+</b><small>Điều chỉnh</small></button>
    </div>
    <div class="m12h-focus-grid">
      <article class="m12h-focus-card" id="m12hFocusCard">
        <div class="m12h-focus-label" id="m12hFocusLabel">VIỆC ƯU TIÊN</div>
        <h3 id="m12hFocusTitle">Đang chuẩn bị lộ trình…</h3>
        <p id="m12hFocusMeta">Hệ thống đang tổng hợp tiến độ học.</p>
        <div class="m12h-focus-reason" id="m12hFocusReason"></div>
        <div class="m12h-focus-actions"><button class="btn btn-primary" id="m12hFocusBtn" type="button">Bắt đầu ngay</button><button class="btn m12h-secondary" type="button" onclick="goPage('learning-plan')">Xem lộ trình</button></div>
      </article>
      <article class="m12h-progress-card">
        <div class="m12h-progress-top"><div><span>Tiến độ</span><strong id="m12hProgress">0%</strong></div><div><span>Chuỗi học</span><strong id="m12hStreak">0 ngày</strong></div></div>
        <div class="m12h-progress-track"><i id="m12hProgressBar"></i></div>
        <div class="m12h-stat-row"><span><b id="m12hLessons">0</b><small>Bài xong</small></span><span><b id="m12hAverage">—</b><small>Điểm TB</small></span><span><b id="m12hAccuracy">—</b><small>Chính xác</small></span></div>
        <button type="button" class="m12h-link" onclick="goPage('progress')">Xem tiến độ chi tiết →</button>
      </article>
    </div>
    <section class="m12h-assignments" aria-labelledby="m12hAssignTitle">
      <div class="m12h-section-head"><div><span class="m12h-section-icon">📌</span><div><h3 id="m12hAssignTitle">Bài giáo viên giao</h3><p id="m12hAssignMeta">Đang kiểm tra bài cần làm…</p></div></div><button type="button" class="m12h-link" onclick="M12StudentHome.openAssignments()">Xem tất cả →</button></div>
      <div class="m12h-assignment-list" id="m12hAssignmentList"></div>
    </section>
    <nav class="m12h-quick" aria-label="Lối tắt học tập">
      <button type="button" onclick="goPage('learning-plan')"><span>✦</span><b>Lộ trình</b><small>Việc nên làm tiếp</small></button>
      <button type="button" onclick="M12StudentHome.openAssignments()"><span>▣</span><b>Bài được giao</b><small id="m12hQuickAssign">Từ giáo viên</small></button>
      <button type="button" onclick="v28PracticeMistakes?.(10)"><span>↺</span><b>Câu sai</b><small id="m12hQuickMistakes">Luyện lại lỗi cũ</small></button>
      <button type="button" onclick="M12StudentHome.openArenaOrExam()"><span>⚡</span><b id="m12hQuickChallengeTitle">Thử thách</b><small id="m12hQuickChallengeMeta">Arena / thi thử</small></button>
    </nav>`;
  dash.insertBefore(root,firstStudentHero||dash.firstChild);
  if(firstStudentHero)firstStudentHero.classList.add('m12h-legacy-hero');
  const metrics=dash.querySelector(':scope > .grid.grid-4.student-only');if(metrics)metrics.classList.add('m12h-legacy-metrics');
  const command=dash.querySelector(':scope > .student-only.v28-command-grid');if(command)command.classList.add('m12h-legacy-command');
  document.documentElement.dataset.studentHome='40.32';
}
function renderAssignments(){
  const box=document.getElementById('m12hAssignmentList'),meta=document.getElementById('m12hAssignMeta');if(!box)return;
  const s=summary();
  const quick=document.getElementById('m12hQuickAssign');if(quick)quick.textContent=s.pending.length?`${s.pending.length} bài chưa hoàn thành`:'Không có bài đang chờ';
  if(!window.firebaseUser){
    if(meta)meta.textContent='Đăng nhập để nhận bài từ lớp học online.';
    box.innerHTML='<div class="m12h-empty"><span>☁</span><div><b>Chưa kết nối tài khoản</b><small>Đăng nhập để bài giáo viên giao xuất hiện ngay tại đây.</small></div><button class="btn btn-soft" type="button" onclick="openFirebaseAccount()">Đăng nhập</button></div>';return;
  }
  let loading=false;try{loading=!!firebaseAssignmentLoading}catch(_){}
  let memberships=0;try{memberships=Array.isArray(firebaseMemberships)?firebaseMemberships.length:0}catch(_){}
  if(!s.pending.length){
    if(meta)meta.textContent=s.graded.length?'Em đã xử lý hết các bài hiện có.':'Hiện không có bài nào cần hoàn thành.';
    box.innerHTML=`<div class="m12h-empty good"><span>✓</span><div><b>${loading?'Đang đồng bộ bài được giao…':'Không có bài đang chờ'}</b><small>${memberships?'Em có thể tiếp tục lộ trình tự học hôm nay.':'Tham gia lớp để nhận bài trực tiếp từ giáo viên.'}</small></div><button class="btn btn-soft" type="button" onclick="M12StudentHome.openAssignments()">Mở lớp học</button></div>`;return;
  }
  if(meta)meta.textContent=`${s.pending.length} bài chưa hoàn thành${s.overdue.length?` • ${s.overdue.length} quá hạn`:''}${s.available.length?` • ${s.available.length} có thể làm ngay`:''}`;
  box.innerHTML=s.pending.slice(0,3).map(a=>{
    const st=assignmentInfo(a),d=st.future?st.open:st.due,status=st.over?'over':st.future?'future':'ready';
    const badge=st.over?'Quá hạn':st.future?'Chưa mở':dueText(st.due);
    const action=st.available?`<button class="btn btn-blue" type="button" onclick="firebaseOpenAssignment('${attr(a.classId)}','${attr(a.id)}')">Làm bài</button>`:`<button class="btn btn-soft" type="button" ${st.over||st.future?'disabled':''}>${st.over?'Đã hết hạn':st.future?'Chờ mở':'Xem'}</button>`;
    return `<article class="m12h-assignment ${status}"><div class="m12h-assignment-mark"></div><div class="m12h-assignment-body"><div class="m12h-assignment-title"><b>${esc(a.title||'Bài được giao')}</b><span>${esc(badge)}</span></div><small>${esc(a.className||'Lớp học')} • ${Number(a.questionCount||a.questions?.length||0)} câu • ${Number(a.durationMinutes||45)} phút${d?` • ${st.future?'Mở':'Hạn'} ${esc(new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d))}`:''}</small></div>${action}</article>`
  }).join('');
}
function renderFocus(){
  const s=summary(),a=s.available[0],title=document.getElementById('m12hFocusTitle'),meta=document.getElementById('m12hFocusMeta'),reason=document.getElementById('m12hFocusReason'),label=document.getElementById('m12hFocusLabel'),btn=document.getElementById('m12hFocusBtn');if(!title||!btn)return;
  btn.onclick=null;
  if(a){
    const st=assignmentInfo(a);label.textContent='ƯU TIÊN TỪ GIÁO VIÊN';title.textContent=a.title||'Bài được giao';meta.textContent=`${a.className||'Lớp học'} • ${Number(a.questionCount||a.questions?.length||0)} câu • ${Number(a.durationMinutes||45)} phút`;reason.textContent=st.due?`${dueText(st.due)}. Hoàn thành bài được giao trước khi tiếp tục lộ trình tự học.`:'Bài đang mở và có thể làm ngay.';btn.textContent='Làm bài ngay';btn.onclick=()=>window.firebaseOpenAssignment?.(a.classId,a.id);return;
  }
  const x=selfAction();label.textContent='VIỆC NÊN LÀM TIẾP';title.textContent=x.title;meta.textContent=x.meta;reason.textContent=x.reason;btn.textContent='Tiếp tục học';btn.onclick=()=>window.v28StartNextAction?.();
}
function syncProgress(){
  const p=text('heroPercent','0%'),streak=text('metricStreak','0'),bar=document.getElementById('m12hProgressBar');
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('m12hProgress',p);set('m12hStreak',`${streak.replace(/\D/g,'')||0} ngày`);set('m12hLessons',text('metricLessons','0'));set('m12hAverage',text('metricAvg','—'));set('m12hAccuracy',text('metricAccuracy','—'));set('m12hGoal',text('v28GoalScoreHero','8.0+'));
  const n=Math.max(0,Math.min(100,Number.parseFloat(p)||0));if(bar)bar.style.width=`${n}%`;
  const mistakes=document.getElementById('m12hQuickMistakes');if(mistakes){const n=text('v28MistakeMetric','0');mistakes.textContent=(Number.parseInt(n,10)||0)>0?`${n} câu cần xem lại`:'Chưa có lỗi tồn đọng'}
}
function syncHeader(){
  const g=document.getElementById('m12hGreeting'),d=document.getElementById('m12hToday');if(g)g.textContent=`${greeting()}, ${name()} 👋`;if(d)d.textContent=`${todayLabel()} • Chọn một việc quan trọng và hoàn thành trước.`;
}
function syncLabels(){
  if(role()!=='student')return;
  const active=document.getElementById('page-dashboard')?.classList.contains('active');if(active){const t=document.getElementById('pageTitle');if(t)t.textContent='Hôm nay';document.title='Hôm nay • Math12 Hub'}
  const home=document.querySelector('#nav .nav-home .nav-label');if(home)home.textContent='Hôm nay';
  document.querySelectorAll('#v353MobileNav [data-role="student"] [data-mobile-page="dashboard"] span:last-child').forEach(x=>x.textContent='Hôm nay');
}
function sync(){
  clearTimeout(syncTimer);syncTimer=setTimeout(()=>{inject();if(!root)return;root.hidden=role()!=='student';syncHeader();syncProgress();renderAssignments();renderFocus();syncLabels()},20);
}
function openAssignments(){
  window.goPage?.('online');setTimeout(()=>{document.getElementById('onlineAssignments')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})},180)
}
function openArenaOrExam(){if(document.getElementById('page-arena')&&window.ROLE_ACCESS?.student?.has?.('arena'))window.goPage?.('arena');else window.openFullExam?.()}
function wrap(name,after){
  const base=window[name];if(typeof base!=='function'||base.__m12h4032)return;
  const fn=function(){const r=base.apply(this,arguments);if(r&&typeof r.then==='function')return r.finally(()=>setTimeout(after,0));setTimeout(after,0);return r};
  Object.assign(fn,base);fn.__m12h4032=true;if(base.__m12x4031)fn.__m12x4031=true;fn.__base=base;window[name]=fn;
}
function installHooks(){
  wrap('goPage',syncLabels);wrap('renderAll',sync);wrap('v28RenderStudentUX',sync);wrap('firebaseRefreshStudentAssignments',sync);wrap('applyRoleAccess',sync);
}
function observe(){
  if(observer)return;let q=false;observer=new MutationObserver(muts=>{
    if(q)return;
    if(!muts.some(m=>m.target?.id&&/^(heroPercent|metricLessons|metricAvg|metricAccuracy|metricStreak|v28NextActionTitle|v28NextActionMeta|v28MistakeMetric)$/.test(m.target.id)))return;
    q=true;requestAnimationFrame(()=>{q=false;sync()});
  });observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
function install(){
  if(safeMode)return;inject();installHooks();observe();sync();
  let tries=0;const t=setInterval(()=>{tries++;installHooks();sync();if(tries>=16)clearInterval(t)},300);
  window.addEventListener('math12hub:state-saved',sync);
  window.addEventListener('math12hub:account-hydrated',sync);
  window.addEventListener('focus',sync);
  window.dispatchEvent(new CustomEvent('math12hub:student-home-ready',{detail:{build:BUILD,version:VERSION}}));
}
window.M12StudentHome={build:BUILD,version:VERSION,sync,openAssignments,openArenaOrExam};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
