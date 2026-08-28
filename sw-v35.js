/* Math12 Hub V35 — same-origin offline shell cache */
const CACHE='math12hub-v35-shell-1';
const CORE=[
  './','./index.html','./manifest.webmanifest','./assets/css/app.css',
  './assets/js/mathjax-config.js','./assets/vendor/mathjax.js',
  './assets/js/core.js','./assets/js/authoring.js','./assets/js/data-vault.js','./assets/js/exam.js','./assets/js/firebase.js',
  './assets/js/dashboard-v22.js','./assets/js/admin-v25.js','./assets/js/integrity-v26.js','./assets/js/teacher-ops-v27.js','./assets/js/student-ux-v28.js',
  './assets/js/question-bank-v29.js','./assets/js/exam-pro-v30.js','./assets/js/analytics-pro-v31.js','./assets/js/scale-v34.js','./assets/js/hardening-v35.js','./assets/js/bootstrap.js',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('math12hub-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;let u=new URL(req.url);if(u.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>{let copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));return
  }
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&r.ok){let copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r})))
});
