/* =========================================================
   Math12 Hub V40 — Approved Self-Study UX
   - every current bank question can be practised from Học theo bài;
   - Approved/Reviewed is the learner publishing gate; Draft stays teacher-only;
   - classroom/assignment UI is removed from the active product flow;
   - recommendations are constrained to knowledge codes present in the bank.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.0-approved-self-study';
const TYPES=new Set(['mcq','tf','tf4','short']);
function bank(){return window.V383PracticeBank?.effectiveBank?.()||window.V3822PracticeBank?.effectiveBank?.({approvedOnly:false})||[]}
function patternOf(q={}){
  if(q.id6Pattern)return String(q.id6Pattern);
  if(q.formId&&String(q.formId).includes('?'))return String(q.formId);
  const id6=String(q.id6||'');return /^2[DH]\d[NHVC]\d+-\d+$/.test(id6)?id6.replace(/^(.{3})[NHVC](.+)$/,'$1?$2'):'';
}
function normal(q,part){return typeof normalizeBankQuestion==='function'?normalizeBankQuestion(q,part):JSON.parse(JSON.stringify(q))}
function shuffled(rows){return typeof examShuffle==='function'?examShuffle(rows,Date.now()):rows.slice().sort(()=>Math.random()-.5)}
function openRows(rows,title,subtitle,attemptType){
  rows=rows.filter(q=>q&&q.id&&TYPES.has(q.type));
  if(!rows.length)return alert('Chưa có câu hỏi phù hợp trong ngân hàng tự học.');
  const pick=shuffled(rows).map(q=>normal(q,title));
  openExamStart({id:`v383-${attemptType}-${Date.now()}`,mode:'practice',attemptType,title,subtitle:`${pick.length} câu • ${subtitle}`,durationMinutes:Math.max(10,Math.ceil(pick.length*1.7)),questions:pick,scoring:'normalized',rules:'Bộ luyện lấy trực tiếp từ toàn bộ ngân hàng hiện tại. Chỉ dùng câu đã Approved/Reviewed; Draft chỉ dành cho giáo viên kiểm duyệt.'});
}
function allLesson(lessonId){
  const rows=bank().filter(q=>q.lessonId===lessonId);
  const l=typeof getLesson==='function'?getLesson(lessonId):null;
  openRows(rows,`Luyện toàn bộ • ${l?.common||lessonId}`,`toàn bộ câu của ${lessonId}`,`all-lesson-${lessonId}`)
}
function allForm(pattern,lessonId,title=''){
  const rows=bank().filter(q=>q.lessonId===lessonId&&patternOf(q)===pattern);
  openRows(rows,`Luyện toàn bộ dạng • ${title||pattern}`,`${pattern} • không giới hạn số câu`,`all-form-${pattern.replace(/[^A-Za-z0-9]/g,'-')}`)
}
function decorateLesson(){
  const host=document.getElementById('lessonDetail');if(!host)return;
  const id=typeof activeLessonId!=='undefined'?activeLessonId:window.activeLessonId;if(!id)return;
  const rows=bank().filter(q=>q.lessonId===id);
  const card=host.querySelector('#v377Practice');
  if(card){
    const p=card.querySelector('.v377-section-head p');if(p)p.innerHTML=`Học sinh được luyện <b>toàn bộ ${rows.length} câu</b> hiện có của bài này. Học sinh chỉ luyện câu đã Approved/Reviewed; Draft được giữ riêng cho giáo viên kiểm duyệt.`;
    const head=card.querySelector('.v377-section-head');if(head&&!head.querySelector('.v383-all-lesson')){
      const b=document.createElement('button');b.type='button';b.className='btn btn-soft v383-all-lesson';b.textContent=`Làm tất cả ${rows.length} câu`;b.disabled=!rows.length;b.onclick=()=>allLesson(id);head.appendChild(b)
    }
    let note=card.querySelector('.v383-bank-policy');if(!note){note=document.createElement('div');note.className='v3751-practice-note v383-bank-policy';note.innerHTML='<b>Nội dung đã duyệt:</b> bộ 8 câu dùng để luyện nhanh; nút “Làm tất cả” mở toàn bộ câu của bài. Tạo bộ mới tiếp tục ưu tiên tránh lặp.';card.appendChild(note)}
  }
  host.querySelectorAll('.v377-form-card').forEach(box=>{
    const pattern=box.querySelector('.v377-form-id')?.textContent?.trim()||'',count=Number(box.querySelector('.v377-form-count b')?.textContent)||0,title=box.querySelector('h4')?.textContent||pattern,actions=box.querySelector('.v377-form-actions');
    if(actions&&count&&!actions.querySelector('.v383-all-form')){
      const b=document.createElement('button');b.type='button';b.className='btn btn-soft v383-all-form';b.textContent=`Tất cả ${count} câu`;b.onclick=()=>allForm(pattern,id,title);actions.appendChild(b)
    }
  });
}
function removeClassroomUI(){
  document.querySelectorAll('[data-page="online"],[data-page="teacher"],[data-mobile-page="online"],[data-mobile-page="teacher"]').forEach(x=>x.remove());
  document.querySelector('[data-nav-group="teacher-class"]')?.remove();
  document.getElementById('page-online')?.remove();
  document.getElementById('page-teacher')?.remove();
  document.querySelectorAll('#page-admin .card').forEach(card=>{if(/Quản trị lớp/i.test(card.querySelector('h3')?.textContent||''))card.remove()});
  const hero=document.querySelector('#page-dashboard .teacher-only.hero');
  if(hero)hero.innerHTML=`<div><div class="badge" style="background:rgba(255,255,255,.16);color:white">V40 • CONTENT HUB</div><h2>Quản trị ngân hàng, tạo đề và nội dung học tập</h2><p>Chế độ lớp học online đã được loại khỏi luồng chính. Giáo viên tập trung làm sạch ngân hàng, tạo đề, kiểm tra nội dung học sinh và dùng trợ lý AI.</p><div class="hero-actions"><button class="btn btn-primary" onclick="goPage('question-bank')">Ngân hàng câu hỏi</button><button class="btn btn-ghost" onclick="goPage('exam-builder')">Tạo đề kiểm tra</button><button class="btn btn-ghost" onclick="goPage('ai-teacher')">Trợ lý AI</button></div></div><div class="hero-progress"><small>Ngân hàng tự học</small><br><strong>${bank().length} câu</strong><div style="margin-top:12px;font-size:13px;line-height:1.6">Học sinh có thể luyện toàn bộ câu theo từng bài ID6.</div></div>`;
  const foot=document.querySelector('.sidebar-foot .tiny');if(foot)foot.textContent='V40 • Production';
}
function wrapNavigation(){
  if(typeof window.goPage==='function'&&!window.goPage.__v383){
    const base=window.goPage;const w=function(page,...rest){
      if(page==='online'||page==='teacher')page=(typeof isTeacherRole==='function'&&isTeacherRole())?'question-bank':'lessons';
      if(page==='reports'&&typeof isTeacherRole==='function'&&isTeacherRole())page='question-bank';
      return base.call(this,page,...rest)
    };w.__v383=true;window.goPage=w
  }
}
function wrapLessonRender(){
  if(typeof window.renderLessonDetail==='function'&&!window.renderLessonDetail.__v383){
    const base=window.renderLessonDetail;const w=function(){const out=base.apply(this,arguments);setTimeout(decorateLesson,0);return out};w.__v383=true;window.renderLessonDetail=w
  }
}
function init(){
  document.documentElement.dataset.selfStudyBuild=BUILD;
  removeClassroomUI();wrapNavigation();wrapLessonRender();setTimeout(()=>{removeClassroomUI();decorateLesson()},30);
}
window.v383SelfStudy={build:BUILD,bank,allLesson,allForm,decorateLesson,removeClassroomUI};
window.v383PracticeAllLesson=allLesson;window.v383PracticeAllForm=allForm;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
