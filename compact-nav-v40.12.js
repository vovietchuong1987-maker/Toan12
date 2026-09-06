/* Math12 Hub V40.12 — navigation integrity layer
   Keeps legacy/dynamic modules in the intended compact student groups and prevents duplicates.
*/
(function(){
  'use strict';
  const BUILD='40.12-compact-smart-navigation';
  const MAP={
    lessons:'student-study',chapters:'student-study',
    periodic:'student-exam',thpt:'student-exam',
    'learning-plan':'student-progress',progress:'student-progress',analytics:'student-progress',reports:'student-progress',
    avatar:'student-world',shop:'student-world',room:'student-world',collections:'student-world',
    missions:'student-achievement',journey:'student-achievement',honor:'student-achievement'
  };
  function normalize(){
    const root=document.querySelector('.student-nav-block');if(!root)return;
    Object.entries(MAP).forEach(([page,group])=>{
      const target=root.querySelector(`[data-nav-group="${group}"] .nav-group-items`);if(!target)return;
      const buttons=[...root.querySelectorAll(`button[data-page="${CSS.escape(page)}"]`)];
      if(!buttons.length)return;
      const keep=buttons.find(b=>b.parentElement===target)||buttons[0];
      if(keep.parentElement!==target)target.appendChild(keep);
      buttons.forEach(b=>{if(b!==keep)b.remove()});
    });
    // Notifications is intentionally a primary item, outside accordions.
    const notices=[...root.querySelectorAll('button[data-page="notifications"]')];
    if(notices.length){const keep=notices.find(b=>b.classList.contains('v4012-notifications'))||notices[0];if(keep.parentElement!==root||keep!==root.lastElementChild)root.appendChild(keep);notices.forEach(b=>{if(b!==keep)b.remove()})}
  }
  function activeGroup(){
    const active=document.querySelector('.student-nav-block button[data-page].active');
    const group=active?.closest('.nav-group');
    if(group&&!group.classList.contains('open'))group.querySelector(':scope > .nav-group-toggle')?.click();
  }
  function init(){
    document.documentElement.dataset.compactNavBuild=BUILD;
    normalize();activeGroup();
    let timer=0;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{normalize();activeGroup()},30)}).observe(document.querySelector('.student-nav-block')||document.body,{childList:true,subtree:true});
    setTimeout(normalize,450);setTimeout(normalize,1200);
  }
  window.Math12CompactNav={build:BUILD,normalize};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
