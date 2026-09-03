/* =========================================================
   Math12 Hub  — Production Runtime
   One runtime event bus + diagnostics + stable page/avatar/shop contracts.
   Legacy engines remain as compatibility providers while + owns UI.
   ========================================================= */
(function(){
'use strict';
const VERSION='40.7',BUILD='40.7-hall-of-fame';
const bus=new EventTarget();
const issues=[];
const now=()=>new Date().toISOString();
const role=()=>{try{return typeof currentSecureRole==='function'?currentSecureRole():'student'}catch(_){return 'student'}};
function emit(type,detail={}){try{bus.dispatchEvent(new CustomEvent(type,{detail:{...detail,at:Date.now()}}))}catch(_){}}
function on(type,fn,opts){bus.addEventListener(type,e=>fn(e.detail,e),opts);return ()=>bus.removeEventListener(type,fn)}
function stateRef(){try{return typeof state!=='undefined'?state:null}catch(_){return null}}
function bankStats(){try{return window.V393PracticeBank?.stats?.()||{effectiveCount:window.getPracticeQuestionBank?.().length||0}}catch(_){return {effectiveCount:0}}}
function snapshot(){const st=stateRef();return {version:VERSION,build:BUILD,role:role(),online:navigator.onLine,bank:bankStats(),page:document.querySelector('.section.active')?.id?.replace('page-','')||'',issues:issues.slice(-10),stateReady:!!st,at:now()}}
function record(kind,error,meta={}){const item={kind,message:String(error?.message||error||kind),meta,at:now()};issues.push(item);if(issues.length>50)issues.shift();emit('runtime-issue',item);return item}
window.addEventListener('error',e=>record('error',e.error||e.message,{file:e.filename,line:e.lineno}),true);
window.addEventListener('unhandledrejection',e=>record('promise',e.reason||'Unhandled promise rejection'),true);
window.addEventListener('online',()=>emit('network',{online:true}));window.addEventListener('offline',()=>emit('network',{online:false}));
// Stable page lifecycle. Old modules keep working, newer modules can subscribe to one contract.
if(typeof window.goPage==='function'&&!window.goPage.__v393){const old=window.goPage;const wrapped=function(page,internal=false){const out=old.call(this,page,internal);emit('page',{page,role:role()});return out};wrapped.__v393=true;window.goPage=wrapped}
// Normalize avatar/shop change notifications without changing their storage schemas.
['math12hub:avatar-change','math12hub:wardrobe-change','math12hub:shop-change'].forEach(name=>window.addEventListener(name,e=>emit('cosmetic-change',{source:name,detail:e.detail||{}})));
//  Shop is retained only as a compatibility catalog/reward provider;  Mega Shop owns visible shop UI.
function assertShopOwner(){try{if(document.getElementById('page-shop')?.classList.contains('active'))window.v386MegaShop?.render?.()}catch(e){record('shop-owner',e)}}
document.addEventListener('DOMContentLoaded',()=>{document.documentElement.dataset.math12Platform=BUILD;document.documentElement.dataset.releaseChannel='production';setTimeout(assertShopOwner,0)});
on('page',d=>{if(d.page==='admin')setTimeout(renderProductionHealth,0);if(d.page==='question-bank')setTimeout(renderContentReadiness,0);if(d.page==='shop')setTimeout(assertShopOwner,0);if(d.page==='avatar')setTimeout(()=>window.v384Avatar3D?.mount?.(),0);if(d.page==='room')setTimeout(()=>window.v390MathRoom?.render?.(),0)});
const perf={
  startedAt:performance.now(),
  device(){const c=navigator.connection||{};return {memory:Number(navigator.deviceMemory||0),cores:Number(navigator.hardwareConcurrency||0),saveData:!!c.saveData,effectiveType:c.effectiveType||'',reduced:matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false}},
  lowPower(){const d=this.device();return d.saveData||d.reduced||(d.memory>0&&d.memory<=4)||(d.cores>0&&d.cores<=4)||/2g/.test(d.effectiveType)},
  entries(){try{return performance.getEntriesByType('resource').map(r=>({name:r.name.split('/').pop(),duration:Math.round(r.duration),size:r.transferSize||0})).slice(-160)}catch(_){return []}},
  summary(){const e=this.entries();return {bootMs:Math.round(performance.now()-this.startedAt),resourceCount:e.length,transferBytes:e.reduce((a,b)=>a+(b.size||0),0),device:this.device(),lowPower:this.lowPower()}}
};
if(perf.lowPower())document.documentElement.classList.add('math12-low-power');
window.addEventListener('load',()=>setTimeout(()=>emit('performance',perf.summary()),0),{once:true});


function contentReadiness(){try{return window.Math12Content?.readiness?.()||null}catch(e){record('content-readiness',e);return null}}
function renderContentReadiness(){
  if(role()==='student')return;const host=document.querySelector('#page-question-bank .question-bank-head');if(!host)return;
  let box=document.getElementById('v395ContentReadiness');if(!box){box=document.createElement('div');box.id='v395ContentReadiness';box.className='card v395-content-readiness';host.insertAdjacentElement('afterend',box)}
  const r=contentReadiness();if(!r)return;const ch=Object.values(r.chapters||{});
  box.innerHTML=`<div class="v395-content-head"><div><small>NỘI DUNG HỌC TẬP</small><h3>Tình trạng ngân hàng học tập</h3><p>Học sinh chỉ nhận các câu đã được duyệt. Nội dung mới có thể bổ sung theo từng chương.</p></div><div><b>${r.approved}/${r.total}</b><span>câu đã phát hành</span></div></div><div class="v395-content-grid">${ch.map(c=>`<div class="v395-ch ${c.approved?'has':'empty'}"><b>Ch.${c.chapter}</b><strong>${c.approved}</strong><small>MCQ ${c.mcq} • Đ/S ${c.tf4} • Ngắn ${c.short}</small>${c.draft?`<em>${c.draft} Draft</em>`:''}</div>`).join('')}</div><div class="v395-content-foot">Gói nội dung: <b>${r.packs.length}</b>Câu bị chặn khỏi học sinh: <b>${r.excluded}</b></div>`;
}
window.addEventListener('math12hub:content-pack',()=>setTimeout(renderContentReadiness,0));


function ensureNetworkPill(){let el=document.getElementById('v396NetworkPill');if(!el){el=document.createElement('div');el.id='v396NetworkPill';el.className='v396-network-pill';el.setAttribute('role','status');document.body.appendChild(el)}el.classList.toggle('offline',!navigator.onLine);el.textContent=navigator.onLine?'● Online':'● Offline • vẫn dùng nội dung đã lưu';return el}
window.addEventListener('online',ensureNetworkPill);window.addEventListener('offline',ensureNetworkPill);document.addEventListener('DOMContentLoaded',ensureNetworkPill,{once:true});
function qaRun(){const checks=[];const add=(name,ok,detail='')=>checks.push({name,ok:!!ok,detail});
 add('Trang học sinh',!!document.getElementById('page-lessons')&&!!document.getElementById('page-chapters'),'lessons + chapters');
 add('Avatar',!!document.getElementById('page-avatar')&&!!window.v384Avatar3D,'page + 3D engine');
 add('Mega Shop',!!document.getElementById('page-shop')&&!!window.v386MegaShop,'page + shop engine');
 add('Phòng của em',!!document.getElementById('page-room')&&!!window.v390MathRoom,'page + room engine');
 add('Ngân hàng học sinh',Number(window.Math12Content?.readiness?.()?.approved||0)>0,`${window.Math12Content?.readiness?.()?.approved||0} approved`);
 add('Phân quyền student',!!window.ROLE_ACCESS?.student?.has?.('room')&&!!window.ROLE_ACCESS?.student?.has?.('shop')&&!!window.ROLE_ACCESS?.student?.has?.('honor'),'room + shop + honor allowed');
 add('PWA',!!('serviceWorker' in navigator),'service worker supported');
 add('Không thiếu tài nguyên DOM',!document.querySelector('script[src="undefined"],link[href="undefined"]'),'basic resource check');
 const failed=checks.filter(c=>!c.ok);const result={version:VERSION,ok:!failed.length,passed:checks.length-failed.length,total:checks.length,failed,checks,device:perf.device(),online:navigator.onLine,at:now()};emit('qa',result);return result}
function qaBadge(){const r=qaRun();document.documentElement.dataset.studentQa=r.ok?'pass':'warn';return r}
document.addEventListener('DOMContentLoaded',()=>setTimeout(qaBadge,350),{once:true});


function productionAudit(){
 const q=qaRun(),r=contentReadiness()||{},checks=[];const add=(name,ok,level='critical',detail='')=>checks.push({name,ok:!!ok,level,detail});
 add('Kiểm tra luồng học sinh',q.ok,'critical',`${q.passed}/${q.total}`);
 add('Kiểm soát câu đã duyệt',Number(r.excluded||0)>=0&&Number(r.approved||0)>0,'critical',`${r.approved||0} published / ${r.excluded||0} blocked`);
 add('Cửa hàng',!!window.v386MegaShop,'critical','Giao diện cửa hàng chính');
 add('Nhân vật',!!window.v384Avatar3D,'critical','adaptive 3D + fallback');
 add('Quyền vào phòng',!!window.ROLE_ACCESS?.student?.has?.('room'),'critical','student role');
 add('Bảng vinh danh',!!window.v407HonorBoard&&!!window.ROLE_ACCESS?.student?.has?.('honor'),'critical','privacy-first hall of fame');
 add('Chế độ ứng dụng','serviceWorker' in navigator,'warning','PWA capable');
 const appKey=String(window.MATH12_APP_CHECK_SITE_KEY||'').trim();add('Firebase App Check',!!appKey&&typeof firebaseAppCheckStatus!=='undefined'&&firebaseAppCheckStatus==='active','warning',appKey?(typeof firebaseAppCheckStatus==='undefined'?'waiting':firebaseAppCheckStatus):'site key not configured');
 add('Lỗi hệ thống',issues.filter(i=>i.kind==='error'||i.kind==='promise').length===0,'warning',`${issues.length} captured issue(s)`);
 const critical=checks.filter(c=>c.level==='critical'&&!c.ok),warnings=checks.filter(c=>c.level==='warning'&&!c.ok);return {version:VERSION,ready:critical.length===0,critical,warnings,checks,at:now()}
}
function renderProductionHealth(){if(role()!=='admin')return;const host=document.querySelector('#page-admin');if(!host)return;let box=document.getElementById('v400ProductionHealth');if(!box){box=document.createElement('div');box.id='v400ProductionHealth';box.className='card v400-production-health';host.prepend(box)}const a=productionAudit();box.innerHTML=`<div class="v400-health-head"><div><small>TRẠNG THÁI HỆ THỐNG</small><h3>${a.ready?'✓ Hệ thống sẵn sàng':'⚠ Cần kiểm tra trước khi mở rộng'}</h3><p>${a.warnings.length?`${a.warnings.length} cảnh báo cấu hình không chặn vận hành.`:'Không có cảnh báo cấu hình.'}</p></div><span class="${a.ready?'ok':'bad'}">${a.ready?'READY':'CHECK'}</span></div><div class="v400-health-grid">${a.checks.map(c=>`<div class="${c.ok?'pass':c.level==='warning'?'warn':'fail'}"><b>${c.ok?'✓':'!'} ${c.name}</b><small>${c.detail||''}</small></div>`).join('')}</div>${a.warnings.some(w=>w.name==='Firebase App Check')?'<div class="v400-health-note"><b>App Check chưa bật:</b> Hệ thống vẫn chạy, nhưng trước khi mở công khai quy mô lớn nên nhập reCAPTCHA site key và quan sát metrics trước khi bật enforcement.</div>':''}`}

const api={version:VERSION,build:BUILD,bus,on,emit,snapshot,record,role,bankStats,issues,perf,contentReadiness,renderContentReadiness,qa:{run:qaRun,badge:qaBadge},productionAudit,renderProductionHealth};
window.Math12Platform=api;window.Math12AppStore={get state(){return stateRef()},snapshot,role,emit,on};
emit('ready',{version:VERSION,build:BUILD});
})();
