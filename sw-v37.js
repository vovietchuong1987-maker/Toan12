/* Math12 Hub V37 AI Teaching Intelligence — version-safe offline shell */
const CACHE='math12hub-v37-shell-10';
const CORE=[
  './','./index.html','./manifest.webmanifest?v=37','./assets/css/app.css?v=37',
  './assets/js/mathjax-config.js?v=37','./assets/vendor/mathjax.js?v=37',
  './assets/js/core.js?v=37','./assets/js/authoring.js?v=37','./assets/js/data-vault.js?v=37','./assets/js/exam.js?v=37','./assets/js/firebase.js?v=37',
  './assets/js/dashboard-v22.js?v=37','./assets/js/admin-v25.js?v=37','./assets/js/integrity-v26.js?v=37','./assets/js/teacher-ops-v27.js?v=37','./assets/js/student-ux-v28.js?v=37',
  './assets/js/question-bank-v29.js?v=37','./assets/js/exam-pro-v30.js?v=37','./assets/js/analytics-pro-v31.js?v=37','./assets/js/scale-v34.js?v=37','./assets/js/hardening-v35.js?v=37','./assets/js/ui-v35.js?v=37','./assets/js/bootstrap.js?v=37','./assets/js/ux-v35.3.js?v=37','./assets/js/smart-nav-v35.4.js?v=37','./assets/js/knowledge-map-v36.js?v=37','./assets/js/quality-engine-v36.1.js?v=37','./assets/js/smart-exam-v36.2.js?v=37','./assets/js/mastery-v36.3.js?v=37','./assets/js/ai-intelligence-v37.js?v=37',
  './assets/icons/icon-192.png?v=37','./assets/icons/icon-512.png?v=37'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('math12hub-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));return;
  }
  event.respondWith(fetch(req).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r}).catch(()=>caches.match(req)));
});
