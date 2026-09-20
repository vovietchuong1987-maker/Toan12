/* Math12 Hub v40.28.0 — Performance & Smart Loading */
(function(){
'use strict';
const BUILD='40.28.0-performance-smart-loading';
const VERSION=402800;
const safeMode=new URLSearchParams(location.search).has('safe');
const started=performance.now();
const metrics={domReady:0,load:0,longTasks:0,longTaskMs:0,resources:0,transferBytes:0,lastPage:'',saveData:!!navigator.connection?.saveData,effectiveType:navigator.connection?.effectiveType||''};
function markImages(){document.querySelectorAll('img:not([loading])').forEach(img=>{if(!img.closest('.avatar-stage,.exam-question-figure'))img.loading='lazy';img.decoding=img.decoding||'async'})}
function observeLongTasks(){try{if(!('PerformanceObserver'in window))return;const po=new PerformanceObserver(list=>{for(const e of list.getEntries()){metrics.longTasks++;metrics.longTaskMs+=Math.round(e.duration)}});po.observe({entryTypes:['longtask']})}catch(_){}}
function collectResources(){try{const rows=performance.getEntriesByType('resource');metrics.resources=rows.length;metrics.transferBytes=rows.reduce((s,x)=>s+(Number(x.transferSize)||0),0)}catch(_){}return metrics}
function installPageHook(){if(typeof window.goPage!=='function'||window.goPage.__m12perf4028)return;const base=window.goPage;const wrap=function(page,internal=false){const t=performance.now(),out=base.call(this,page,internal);metrics.lastPage=String(page||'');requestAnimationFrame(()=>{document.documentElement.dataset.lastPageMs=String(Math.max(0,Math.round(performance.now()-t)));markImages()});return out};wrap.__m12perf4028=true;wrap.__base=base;window.goPage=wrap}
function status(){collectResources();return {build:BUILD,version:VERSION,safeMode,uptimeMs:Math.round(performance.now()-started),...metrics}}
function install(){
  if(safeMode){document.documentElement.dataset.performanceMode='safe';return}
  document.documentElement.dataset.performanceMode=metrics.saveData?'data-saver':((navigator.deviceMemory&&navigator.deviceMemory<=4)?'light':'normal');
  markImages();observeLongTasks();installPageHook();
  new MutationObserver(()=>markImages()).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>{metrics.domReady=Math.round(performance.now())},{once:true});
  window.addEventListener('load',()=>{metrics.load=Math.round(performance.now());collectResources()},{once:true});
}
window.M12Performance={build:BUILD,version:VERSION,status,collectResources};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
