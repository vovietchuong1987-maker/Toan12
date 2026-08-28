/* Math12 Hub V35.3 UX Polish — version-safe offline shell */
const CACHE='math12hub-v35-shell-4';
const CORE=[
  './','./index.html','./manifest.webmanifest?v=35.3','./assets/css/app.css?v=35.3',
  './assets/js/mathjax-config.js?v=35.3','./assets/vendor/mathjax.js?v=35.3',
  './assets/js/core.js?v=35.3','./assets/js/authoring.js?v=35.3','./assets/js/data-vault.js?v=35.3','./assets/js/exam.js?v=35.3','./assets/js/firebase.js?v=35.3',
  './assets/js/dashboard-v22.js?v=35.3','./assets/js/admin-v25.js?v=35.3','./assets/js/integrity-v26.js?v=35.3','./assets/js/teacher-ops-v27.js?v=35.3','./assets/js/student-ux-v28.js?v=35.3',
  './assets/js/question-bank-v29.js?v=35.3','./assets/js/exam-pro-v30.js?v=35.3','./assets/js/analytics-pro-v31.js?v=35.3','./assets/js/scale-v34.js?v=35.3','./assets/js/hardening-v35.js?v=35.3','./assets/js/ui-v35.js?v=35.3','./assets/js/bootstrap.js?v=35.3','./assets/js/ux-v35.3.js?v=35.3',
  './assets/icons/icon-192.png?v=35.3','./assets/icons/icon-512.png'
];
async function freshPut(cache,url){
  const req=new Request(url,{cache:'reload'}),res=await fetch(req);if(res&&res.ok)await cache.put(url,res.clone());return res;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);for(const url of CORE){try{await freshPut(c,url)}catch(_){}}await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('math12hub-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(new Request(req,{cache:'no-cache'})).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));return;
  }
  const isAppAsset=/\/(assets\/|manifest\.webmanifest)/.test(u.pathname);
  if(isAppAsset){
    event.respondWith(fetch(new Request(req,{cache:'no-cache'})).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r}).catch(()=>caches.match(req)));return;
  }
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
});
