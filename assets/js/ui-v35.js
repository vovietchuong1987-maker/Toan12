/* Math12 Hub V36.0 — role-aware compact navigation (V35.2 foundation retained) */
(function(){
  const PREF_COMPACT='math12hub:v35.3:sidebar-compact';
  const PREF_GROUPS='math12hub:v35.3:nav-groups';
  const app=()=>document.getElementById('app');
  const nav=()=>document.getElementById('nav');
  function readGroups(){try{return JSON.parse(localStorage.getItem(PREF_GROUPS)||'{}')||{}}catch(_){return {}}}
  function writeGroups(map){try{localStorage.setItem(PREF_GROUPS,JSON.stringify(map))}catch(_){}}
  function setGroup(group,open,persist=true){
    if(!group)return;group.classList.toggle('open',!!open);
    const t=group.querySelector(':scope > .nav-group-toggle');if(t)t.setAttribute('aria-expanded',open?'true':'false');
    if(persist){const m=readGroups(),k=group.dataset.navGroup;if(k){m[k]=!!open;writeGroups(m)}}
  }
  function restoreGroups(){
    const m=readGroups();document.querySelectorAll('#nav .nav-group').forEach(g=>{const k=g.dataset.navGroup;if(k&&Object.prototype.hasOwnProperty.call(m,k))setGroup(g,!!m[k],false)})
  }
  function activeGroup(page){
    if(!page)return;const visibleButtons=[...document.querySelectorAll(`#nav button[data-page="${CSS.escape(page)}"]`)].filter(b=>b.offsetParent!==null);
    visibleButtons.forEach(b=>{const g=b.closest('.nav-group');if(g&&!g.classList.contains('open'))setGroup(g,true,false)})
  }
  function roleName(){try{const r=typeof currentSecureRole==='function'?currentSecureRole():'student';return r==='admin'?'Quản trị':r==='teacher'?'Giáo viên':'Học sinh'}catch(_){return 'Học sinh'}}
  function updateFooter(){const tiny=document.querySelector('.sidebar-foot .tiny');if(tiny)tiny.textContent=`V39.2 • ${roleName()} • Avatar 3D Visual`}
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
    document.getElementById('sidebarCompactBtn')?.addEventListener('click',toggleCompact);
    nav()?.addEventListener('click',e=>{const t=e.target.closest('[data-nav-group-toggle]');if(!t)return;e.preventDefault();e.stopPropagation();const g=t.closest('.nav-group');setGroup(g,!g.classList.contains('open'))});
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
