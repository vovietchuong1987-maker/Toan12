/* Math12 Hub v40.29.0 — UX Pro & Accessibility */
(function(){
'use strict';
const BUILD='40.29.0-ux-pro';
const VERSION=402900;
const safeMode=new URLSearchParams(location.search).has('safe');
let previousFocus=null;
const labels=new Map([
  ['GLOBAL HALL OF FAME','VINH DANH TOÀN HỆ THỐNG'],
  ['● LIVE','● Trực tiếp'],
  ['LIVE CUSTOMIZER','TÙY CHỈNH TRỰC TIẾP'],
  ['CHARACTER PRO','NHÂN VẬT'],
  ['CHARACTER CORE','NHÂN VẬT'],
  ['CHARACTER PLATFORM','HỆ NHÂN VẬT'],
  ['SECURE EXAM','BÀI KIỂM TRA BẢO MẬT']
]);
function addSkipLink(){if(document.querySelector('.m12-skip-link'))return;const main=document.querySelector('main');if(!main)return;main.id=main.id||'mainContent';const a=document.createElement('a');a.className='m12-skip-link';a.href='#'+main.id;a.textContent='Bỏ qua menu, đến nội dung chính';document.body.prepend(a)}
function translateLabels(root=document){root.querySelectorAll?.('.v407-kicker,.v409-live-dot,.v407-positive-badge,.v408-kicker,.v400-kicker,.m12suite-kicker,.avatar-kicker,.exam-result-hero div:first-child').forEach(el=>{const t=el.textContent.trim();if(labels.has(t))el.textContent=labels.get(t)})}
function currentPageA11y(page){document.querySelectorAll('[data-page]').forEach(b=>{const active=b.dataset.page===page;b.toggleAttribute('data-current-page',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});const title=document.getElementById('pageTitle')?.textContent?.trim();if(title)document.title=`${title} • Math12 Hub`}
function installNavigationHook(){if(typeof window.goPage!=='function'||window.goPage.__m12ux4029)return;const base=window.goPage;const wrap=function(page,internal=false){const out=base.call(this,page,internal);requestAnimationFrame(()=>{currentPageA11y(page);translateLabels(document)});return out};wrap.__m12ux4029=true;wrap.__base=base;window.goPage=wrap}
function focusables(modal){return [...modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null)}
function installModalA11y(){
  const backdrop=document.getElementById('modalBackdrop'),modal=backdrop?.querySelector('.modal');if(!backdrop||!modal)return;
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','modalTitle');
  if(typeof window.openModal==='function'&&!window.openModal.__m12ux4029){const base=window.openModal;const wrap=function(){previousFocus=document.activeElement;const out=base.apply(this,arguments);setTimeout(()=>{const f=focusables(modal);(f[0]||modal).focus?.()},0);return out};wrap.__m12ux4029=true;window.openModal=wrap}
  if(typeof window.closeModal==='function'&&!window.closeModal.__m12ux4029){const base=window.closeModal;const wrap=function(){const out=base.apply(this,arguments);setTimeout(()=>previousFocus?.focus?.(),0);return out};wrap.__m12ux4029=true;window.closeModal=wrap}
  document.addEventListener('keydown',e=>{if(!backdrop.classList.contains('show'))return;if(e.key==='Escape'){e.preventDefault();window.closeModal?.();return}if(e.key!=='Tab')return;const f=focusables(modal);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}})
}
function connectivity(){let badge=document.getElementById('m12UxOffline');if(navigator.onLine){badge?.remove();return}if(!badge){badge=document.createElement('div');badge.id='m12UxOffline';badge.className='m12-ux-offline';badge.setAttribute('role','status');badge.textContent='Đang dùng chế độ ngoại tuyến';document.body.appendChild(badge)}}
function install(){if(safeMode)return;addSkipLink();installNavigationHook();installModalA11y();translateLabels(document);connectivity();window.addEventListener('online',connectivity);window.addEventListener('offline',connectivity);new MutationObserver(m=>{for(const x of m)for(const n of x.addedNodes)if(n.nodeType===1)translateLabels(n)}).observe(document.body,{childList:true,subtree:true});document.documentElement.dataset.uxPro='40.29'}
window.M12UXPro={build:BUILD,version:VERSION,translateLabels,currentPageA11y};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
