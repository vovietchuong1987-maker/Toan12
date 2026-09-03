/* Math12 Hub V40.12 — compact smart accordion navigation
   Inherits role-aware sidebar behavior from V35; adds single-open student groups,
   versioned preferences, active-page auto-open and desktop compact mode.
*/
(function(){
  'use strict';
  const PREF_COMPACT='math12hub:v40.12:sidebar-compact';
  const PREF_GROUP='math12hub:v40.12:student-nav-open';
  const app=()=>document.getElementById('app');
  const nav=()=>document.getElementById('nav');
  const isStudentGroup=g=>!!g?.closest('.student-nav-block')&&String(g.dataset.navGroup||'').startsWith('student-');
  function setGroup(group,open,persist=true){
    if(!group)return;
    if(open&&isStudentGroup(group)){
      document.querySelectorAll('.student-nav-block .nav-group.open').forEach(other=>{
        if(other===group)return;other.classList.remove('open');other.querySelector(':scope > .nav-group-toggle')?.setAttribute('aria-expanded','false');
      });
    }
    group.classList.toggle('open',!!open);
    group.querySelector(':scope > .nav-group-toggle')?.setAttribute('aria-expanded',open?'true':'false');
    if(persist&&isStudentGroup(group)){
      try{localStorage.setItem(PREF_GROUP,open?(group.dataset.navGroup||''):'')}catch(_){}
    }
  }
  function restoreGroups(){
    const student=[...document.querySelectorAll('.student-nav-block .nav-group')];
    let wanted='';try{wanted=localStorage.getItem(PREF_GROUP)||''}catch(_){}
    const target=student.find(g=>g.dataset.navGroup===wanted)||student.find(g=>g.classList.contains('open'))||student[0];
    student.forEach(g=>setGroup(g,g===target,false));
  }
  function activeGroup(page){
    if(!page)return;
    const visible=[...document.querySelectorAll(`#nav button[data-page="${CSS.escape(page)}"]`)].filter(b=>b.offsetParent!==null);
    visible.forEach(b=>{const g=b.closest('.nav-group');if(g)setGroup(g,true,isStudentGroup(g))});
  }
  function roleName(){try{const r=typeof currentSecureRole==='function'?currentSecureRole():'student';return r==='admin'?'Quản trị':r==='teacher'?'Giáo viên':'Học sinh'}catch(_){return 'Học sinh'}}
  function updateFooter(){const tiny=document.querySelector('.sidebar-foot .tiny');if(tiny)tiny.textContent=roleName()}
  function applyCompact(fromUser=false){
    if(innerWidth<=760){app()?.classList.remove('sidebar-compact');return}
    let on=false;try{on=localStorage.getItem(PREF_COMPACT)==='1'}catch(_){}
    app()?.classList.toggle('sidebar-compact',on);
    const b=document.getElementById('sidebarCompactBtn');if(b){b.title=on?'Mở rộng thanh điều hướng':'Thu gọn thanh điều hướng';b.setAttribute('aria-label',b.title)}
    if(fromUser&&document.activeElement instanceof HTMLElement)document.activeElement.blur();
  }
  function toggleCompact(){try{localStorage.setItem(PREF_COMPACT,app()?.classList.contains('sidebar-compact')?'0':'1')}catch(_){}applyCompact(true)}
  function mirrorBadge(n){const b=document.getElementById('teacherNotificationBadge');if(!b)return;b.textContent=n>99?'99+':String(n||0);b.classList.toggle('show',Number(n)>0)}
  function bind(){
    document.documentElement.dataset.compactNav='40.12';
    document.getElementById('sidebarCompactBtn')?.addEventListener('click',toggleCompact);
    nav()?.addEventListener('click',e=>{
      const t=e.target.closest('[data-nav-group-toggle]');if(!t)return;
      e.preventDefault();e.stopPropagation();
      const g=t.closest('.nav-group');setGroup(g,!g.classList.contains('open'));
    });
    restoreGroups();applyCompact();updateFooter();
    addEventListener('resize',()=>applyCompact(),{passive:true});
  }
  const oldGo=window.goPage;
  if(typeof oldGo==='function')window.goPage=function(page,internal=false){const out=oldGo(page,internal);requestAnimationFrame(()=>activeGroup(page));return out};
  const oldRole=window.applyRoleAccess;
  if(typeof oldRole==='function')window.applyRoleAccess=function(role='student',navigate=false){const out=oldRole(role,navigate);requestAnimationFrame(()=>{updateFooter();const p=document.querySelector('.section.active')?.id?.replace(/^page-/,'')||'dashboard';activeGroup(p)});return out};
  const oldBadge=window.firebaseSetNotificationBadge;
  if(typeof oldBadge==='function')window.firebaseSetNotificationBadge=function(n=0){const out=oldBadge(n);mirrorBadge(n);return out};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
