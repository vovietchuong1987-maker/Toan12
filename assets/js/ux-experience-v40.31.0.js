/* Math12 Hub v40.31.0 — UX Experience Upgrade
   Client-only experience layer: mobile quick sheet, page continuity,
   friendly labels, cleaner status messaging, and responsive polish.
*/
(function(){
'use strict';
const BUILD='40.31.0-ux-experience';
const VERSION=403100;
const safeMode=new URLSearchParams(location.search).has('safe');
const SCROLL_KEY='m12ux4031:scroll:';
let sheet=null;
let lastPage='dashboard';
let lastFocus=null;

function role(){
  try{
    if(typeof window.currentSecureRole==='function') return String(window.currentSecureRole()||'student');
    const b=document.getElementById('secureRoleBadge');
    if(b?.classList.contains('admin')) return 'admin';
    if(b?.classList.contains('teacher')) return 'teacher';
  }catch(_){}
  return 'student';
}
function activePage(){return document.querySelector('.section.active')?.id?.replace(/^page-/,'')||'dashboard'}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function pageTitle(page){
  return ({
    dashboard:'Tổng quan', 'learning-plan':'Lộ trình', lessons:'Học theo bài', chapters:'Ôn theo chương', periodic:'Kiểm tra định kỳ', thpt:'Ôn thi THPT',
    progress:'Tiến độ', analytics:'Phân tích năng lực', reports:'Báo cáo học tập', avatar:'Nhân vật', shop:'Cửa hàng & Tủ đồ', collections:'Bộ sưu tập',
    missions:'Nhiệm vụ', journey:'Hành trình', honor:'Bảng vinh danh', notifications:'Thông báo', 'question-bank':'Ngân hàng câu hỏi', 'exam-builder':'Tạo đề kiểm tra',
    'ai-teacher':'Trợ lý AI', online:'Lớp học online', teacher:'Theo dõi lớp', admin:'Quản trị hệ thống', 'lesson-detail':'Chi tiết bài học'
  })[page]||'Math12 Hub';
}
function pageIcon(page){return ({dashboard:'⌂','learning-plan':'✦',lessons:'▤',chapters:'◫',periodic:'◷',thpt:'★',progress:'↗',analytics:'◎',reports:'▣',avatar:'♟',shop:'🛍',collections:'🗂',missions:'🎯',journey:'✦',honor:'🏆',notifications:'🔔','question-bank':'▦','exam-builder':'▧','ai-teacher':'✦',admin:'🛡',teacher:'👥',online:'☁'})[page]||'•'}

function friendlyLabels(){
  const title=document.getElementById('pageTitle');
  const p=activePage();
  if(title && p!=='lesson-detail' && title.textContent.trim()!==pageTitle(p)) title.textContent=pageTitle(p);
  const account=document.getElementById('firebaseAccountBtn');
  if(account) account.title='Tài khoản và đồng bộ';
  const rb=document.getElementById('secureRoleBadge');
  if(rb) rb.title='Vai trò tài khoản';
  document.querySelectorAll('[data-page="shop"] .nav-label').forEach(x=>{if(x.textContent.trim()!=='Cửa hàng & Tủ đồ')x.textContent='Cửa hàng & Tủ đồ'});
  document.querySelectorAll('.hero-actions .btn').forEach(b=>{
    const t=b.textContent.trim();
    if(t==='Avatar 2D') b.textContent='Nhân vật';
    if(t==='Mega Shop') b.textContent='Cửa hàng';
  });
  // v40.29 may show a second offline chip while the legacy network pill is already present.
  if(document.querySelector('.v396-network-pill')) document.getElementById('m12UxOffline')?.remove();
}

function saveScroll(page=activePage()){
  try{sessionStorage.setItem(SCROLL_KEY+page,String(Math.max(0,window.scrollY||document.documentElement.scrollTop||0)))}catch(_){}
}
function restoreScroll(page){
  let y=0,has=false;
  try{const v=sessionStorage.getItem(SCROLL_KEY+page);has=v!==null;y=Math.max(0,Number(v)||0)}catch(_){}
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:has?y:0,behavior:'auto'})));
}
function markPageTransition(page){
  const sec=document.getElementById('page-'+page);if(!sec)return;
  sec.classList.remove('m12x-page-enter');void sec.offsetWidth;sec.classList.add('m12x-page-enter');
  setTimeout(()=>sec.classList.remove('m12x-page-enter'),260);
}

function actionsForRole(r=role()){
  if(r==='admin') return [
    ['dashboard','⌂','Tổng quan'],['admin','🛡','Quản trị'],['question-bank','▦','Ngân hàng'],['exam-builder','▧','Tạo đề'],['notifications','🔔','Thông báo'],['ai-teacher','✦','Trợ lý AI']
  ];
  if(r==='teacher') return [
    ['dashboard','⌂','Tổng quan'],['question-bank','▦','Ngân hàng'],['exam-builder','▧','Tạo đề'],['ai-teacher','✦','Trợ lý AI'],['notifications','🔔','Thông báo'],['lessons','▤','Nội dung học']
  ];
  return [
    ['learning-plan','✦','Lộ trình'],['progress','↗','Tiến độ'],['avatar','♟','Nhân vật'],['missions','🎯','Nhiệm vụ'],['honor','🏆','Vinh danh'],['notifications','🔔','Thông báo']
  ];
}
function injectSheet(){
  if(document.getElementById('m12xQuickSheet')){sheet=document.getElementById('m12xQuickSheet');return}
  const wrap=document.createElement('div');wrap.id='m12xQuickSheet';wrap.className='m12x-sheet-backdrop';wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML=`<section class="m12x-sheet" role="dialog" aria-modal="true" aria-labelledby="m12xSheetTitle">
    <div class="m12x-sheet-handle" aria-hidden="true"></div>
    <div class="m12x-sheet-head"><div><b id="m12xSheetTitle">Truy cập nhanh</b><small>Chọn nơi thầy/cô hoặc học sinh muốn đến</small></div><button type="button" class="m12x-sheet-close" aria-label="Đóng">×</button></div>
    <div class="m12x-sheet-grid" id="m12xSheetGrid"></div>
    <div class="m12x-sheet-tools"><button type="button" data-m12x-search>⌕ <span>Tìm nhanh toàn hệ thống</span></button><button type="button" data-m12x-account>👤 <span>Tài khoản & đồng bộ</span></button></div>
  </section>`;
  document.body.appendChild(wrap);sheet=wrap;
  wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('.m12x-sheet-close'))closeSheet();const p=e.target.closest('[data-m12x-page]')?.dataset.m12xPage;if(p){closeSheet();window.goPage?.(p)}if(e.target.closest('[data-m12x-search]')){closeSheet();setTimeout(()=>window.v354SmartNavigation?.open?.(),80)}if(e.target.closest('[data-m12x-account]')){closeSheet();setTimeout(()=>window.openFirebaseAccount?.(),80)}});
}
function renderSheet(){
  injectSheet();const grid=document.getElementById('m12xSheetGrid');if(!grid)return;
  const now=activePage();grid.innerHTML=actionsForRole().map(([p,i,t])=>`<button type="button" data-m12x-page="${esc(p)}" class="${p===now?'active':''}"><span class="m12x-sheet-icon">${i}</span><span>${esc(t)}</span></button>`).join('');
  const subtitle=sheet.querySelector('.m12x-sheet-head small');if(subtitle)subtitle.textContent=role()==='student'?'Các mục học tập và cá nhân hay dùng':'Các công cụ thường dùng';
}
function openSheet(){
  injectSheet();renderSheet();lastFocus=document.activeElement;sheet.classList.add('show');sheet.setAttribute('aria-hidden','false');document.body.classList.add('m12x-sheet-open');
  requestAnimationFrame(()=>sheet.querySelector('[data-m12x-page],.m12x-sheet-close')?.focus());
}
function closeSheet(){if(!sheet?.classList.contains('show'))return;sheet.classList.remove('show');sheet.setAttribute('aria-hidden','true');document.body.classList.remove('m12x-sheet-open');setTimeout(()=>lastFocus?.focus?.(),0)}

function installMobileMore(){
  const nav=document.getElementById('v353MobileNav');if(!nav||nav.__m12x4031)return;nav.__m12x4031=true;
  nav.addEventListener('click',e=>{const b=e.target.closest('[data-mobile-more]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();openSheet()},true);
}
function installKeyboard(){
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&sheet?.classList.contains('show')){e.preventDefault();closeSheet();return}
    if(e.key==='?'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,textarea,select,[contenteditable="true"]')){e.preventDefault();window.v354SmartNavigation?.open?.()}
  });
}

function installNavigation(){
  if(typeof window.goPage!=='function'||window.goPage.__m12x4031)return;
  const base=window.goPage;
  const wrap=function(page,internal=false){
    const previous=activePage();saveScroll(previous);const out=base.call(this,page,internal);lastPage=String(page||'dashboard');
    requestAnimationFrame(()=>{friendlyLabels();document.body.dataset.m12Role=role();markPageTransition(lastPage);restoreScroll(lastPage);renderSheet();document.title=`${pageTitle(lastPage)} • Math12 Hub`});
    return out;
  };
  wrap.__m12x4031=true;wrap.__base=base;window.goPage=wrap;
}
function installRoleHook(){
  if(typeof window.applyRoleAccess!=='function'||window.applyRoleAccess.__m12x4031)return;
  const base=window.applyRoleAccess;const wrap=function(r='student',navigate=false){const out=base.apply(this,arguments);requestAnimationFrame(()=>{document.body.dataset.m12Role=role();renderSheet();friendlyLabels()});return out};wrap.__m12x4031=true;wrap.__base=base;window.applyRoleAccess=wrap;
}

function installBackTop(){
  if(document.getElementById('m12xBackTop'))return;const b=document.createElement('button');b.id='m12xBackTop';b.className='m12x-back-top';b.type='button';b.setAttribute('aria-label','Lên đầu trang');b.title='Lên đầu trang';b.textContent='↑';document.body.appendChild(b);b.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{b.classList.toggle('show',(window.scrollY||0)>600);ticking=false})},{passive:true});
}
function polishSearch(){
  const b=document.getElementById('v354SearchTrigger');if(!b)return;b.title='Tìm nhanh trang, bài học và câu hỏi';const k=b.querySelector('kbd');if(k)k.textContent='Ctrl K';
}
function upgradeTouchTargets(){
  document.querySelectorAll('button.close,.modal .close').forEach(b=>b.setAttribute('aria-label',b.getAttribute('aria-label')||'Đóng'));
}
function observeDynamic(){
  let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;friendlyLabels();polishSearch();upgradeTouchTargets()})});
  mo.observe(document.body,{childList:true,subtree:true});
}
function install(){
  if(safeMode)return;lastPage=activePage();document.documentElement.dataset.uxExperience='40.31';document.body.dataset.m12Role=role();
  injectSheet();installMobileMore();installKeyboard();installNavigation();installRoleHook();installBackTop();friendlyLabels();polishSearch();upgradeTouchTargets();observeDynamic();
  addEventListener('beforeunload',()=>saveScroll(activePage()),{capture:true});
  // Reinstall wrappers if an older module replaces them shortly after startup.
  let tries=0;const t=setInterval(()=>{tries++;installNavigation();installRoleHook();installMobileMore();polishSearch();if(tries>=12)clearInterval(t)},250);
  window.dispatchEvent(new CustomEvent('math12hub:ux-experience-ready',{detail:{build:BUILD,version:VERSION}}));
}
window.M12UXExperience={build:BUILD,version:VERSION,openQuickSheet:openSheet,closeQuickSheet:closeSheet,saveScroll,restoreScroll};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
