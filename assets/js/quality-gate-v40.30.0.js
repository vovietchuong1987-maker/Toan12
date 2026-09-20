/* Math12 Hub v40.30.1 — Production Quality Gate */
(function(){
'use strict';
const BUILD='40.30.1-production-quality-gate';
const VERSION=403001;
const STORAGE='math12hub-quality-v40301';
const LAST_GOOD='math12hub-last-good-build';
const safeMode=new URLSearchParams(location.search).has('safe');
const errors=[];
let lastReport=null;
const now=()=>new Date().toISOString();
function pushError(kind,value){errors.push({at:now(),kind,text:String(value?.message||value||'').slice(0,700)});while(errors.length>20)errors.shift();try{localStorage.setItem(STORAGE,JSON.stringify({errors,lastReport}))}catch(_){}}
window.addEventListener('error',e=>pushError('error',e.error||e.message));
window.addEventListener('unhandledrejection',e=>pushError('promise',e.reason));
function check(name,ok,detail='',critical=false){return {name,ok:!!ok,detail:String(detail||''),critical}}
function duplicateIds(){const m=new Map(),dups=[];document.querySelectorAll('[id]').forEach(el=>{const id=el.id;if(m.has(id))dups.push(id);else m.set(id,1)});return [...new Set(dups)]}
function storageCheck(){try{const k='__m12qg';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch(_){return false}}
function api(name){try{return typeof window[name]==='function'}catch(_){return false}}
function runSync(){
  const dups=duplicateIds(),checks=[];
  checks.push(check('Điều hướng',api('goPage'),'goPage()',true));
  checks.push(check('Lưu trạng thái',api('save'),'save()',true));
  checks.push(check('Phân quyền',!!window.ROLE_ACCESS?.student&&!!window.ROLE_ACCESS?.teacher,'ROLE_ACCESS',true));
  checks.push(check('Firebase SDK',typeof window.firebase!=='undefined','SDK compat',false));
  checks.push(check('Security Core',!!window.M12SecurityCore,'v40.26',true));
  checks.push(check('Delta Sync',safeMode||!!window.M12DeltaSync,safeMode?'đang dùng Safe Mode':'v40.27',true));
  checks.push(check('Performance',safeMode||!!window.M12Performance,safeMode?'đang dùng Safe Mode':'v40.28',false));
  checks.push(check('UX Pro',safeMode||!!window.M12UXPro,safeMode?'đang dùng Safe Mode':'v40.29',false));
  checks.push(check('Arena',!!window.M12Arena,'Arena integration',false));
  checks.push(check('ID HTML',dups.length===0,dups.length?`Trùng: ${dups.slice(0,8).join(', ')}`:'Không trùng ID',true));
  checks.push(check('Local storage',storageCheck(),'Đọc/ghi cục bộ',true));
  checks.push(check('Service Worker','serviceWorker'in navigator,'PWA shell',false));
  const criticalFail=checks.some(x=>x.critical&&!x.ok),warn=checks.some(x=>!x.ok);
  const report={build:BUILD,version:VERSION,at:now(),safeMode,ok:!criticalFail,state:criticalFail?'fail':warn?'warn':'pass',checks,errors:[...errors],delta:window.M12DeltaSync?.status?.()||null,performance:window.M12Performance?.status?.()||null,security:window.M12SecurityCore?.status?.()||null};
  lastReport=report;if(report.ok){try{localStorage.setItem(LAST_GOOD,JSON.stringify({build:BUILD,at:report.at}))}catch(_){}}
  try{localStorage.setItem(STORAGE,JSON.stringify({errors,lastReport}))}catch(_){};return report
}
async function verifyAssets(){
  const paths=['index.html','sw.js','manifest.webmanifest','assets/js/math12hub-v40.20.0.bundle.js','assets/js/security-core-v40.26.0.js','assets/js/sync-delta-v40.27.0.js','assets/js/performance-v40.28.0.js','assets/js/ux-pro-v40.29.0.js'];
  const rows=[];for(const path of paths){try{const r=await fetch(path,{cache:'no-store'});rows.push({path,ok:r.ok,status:r.status})}catch(err){rows.push({path,ok:false,status:0,error:String(err?.message||err)})}}return rows
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderAdmin(){
  let admin=false;try{admin=typeof isAdminRole==='function'&&isAdminRole()}catch(_){}if(!admin)return;
  const host=document.getElementById('page-admin');if(!host)return;const r=runSync();let box=document.getElementById('m12QualityGate');if(!box){box=document.createElement('section');box.id='m12QualityGate';box.className='card m12-quality-card';host.prepend(box)}
  box.innerHTML=`<div class="m12-quality-head"><div><small>KIỂM TRA HỆ THỐNG</small><h3>${r.ok?'Hệ thống lõi đang hoạt động':'Có lỗi lõi cần kiểm tra'}</h3><p>${safeMode?'Safe Mode đang bật. Các lớp Delta/Performance/UX mới được bỏ qua để chẩn đoán.':'Kiểm tra nhanh cấu trúc, lưu trữ, module và PWA.'}</p></div><span class="m12-quality-state ${r.state}">${r.state==='pass'?'SẴN SÀNG':r.state==='warn'?'CÓ CẢNH BÁO':'CẦN SỬA'}</span></div><div class="m12-quality-grid">${r.checks.map(x=>`<div class="m12-quality-check ${x.ok?'pass':x.critical?'fail':'warn'}"><b>${x.ok?'✓':'!'} ${esc(x.name)}</b><small>${esc(x.detail)}</small></div>`).join('')}</div><div class="m12-quality-actions"><button class="btn btn-blue" onclick="M12QualityGate.refresh()">Kiểm tra lại</button><button class="btn btn-soft" onclick="M12QualityGate.exportDiagnostics()">Xuất chẩn đoán</button>${safeMode?'<button class="btn btn-soft" onclick="M12QualityGate.exitSafeMode()">Thoát Safe Mode</button>':'<button class="btn btn-soft" onclick="M12QualityGate.enterSafeMode()">Mở Safe Mode</button>'}</div>`;
}
function download(name,data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
async function exportDiagnostics(){const report=runSync(),assets=await verifyAssets();download(`math12hub-v40.30.1-diagnostics-${new Date().toISOString().slice(0,10)}.json`,{...report,assetProbe:assets,lastGood:JSON.parse(localStorage.getItem(LAST_GOOD)||'null')})}
function setSafe(on){const u=new URL(location.href);if(on)u.searchParams.set('safe','1');else u.searchParams.delete('safe');location.href=u.toString()}
function installHook(){if(typeof window.goPage!=='function'||window.goPage.__m12qg40301)return;const base=window.goPage;const wrap=function(page,internal=false){const out=base.call(this,page,internal);if(page==='admin')setTimeout(renderAdmin,0);return out};wrap.__m12qg40301=true;wrap.__base=base;window.goPage=wrap}
function refresh(){renderAdmin();return lastReport}
function install(){installHook();setTimeout(()=>{runSync();if(document.getElementById('page-admin')?.classList.contains('active'))renderAdmin()},500);document.documentElement.dataset.qualityGate='40.30.1'}
window.M12QualityGate={build:BUILD,version:VERSION,run:runSync,verifyAssets,refresh,exportDiagnostics,enterSafeMode:()=>setSafe(true),exitSafeMode:()=>setSafe(false),errors:()=>[...errors],last:()=>lastReport};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
