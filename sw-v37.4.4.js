/* Math12 Hub V37.4.4 Derivative Sign Table Hotfix — version-safe offline shell */
const CACHE='math12hub-v37-4-4-shell-1';
const V='37.4.4';
const CORE=[
  './','./index.html',`./manifest.webmanifest?v=${V}`,`./assets/css/app.css?v=${V}`,`./assets/css/id6-v37.4.css?v=${V}`,`./assets/css/id6-hierarchy-v37.4.1.css?v=${V}`,`./assets/css/id6-pure-ui-v37.4.2.css?v=${V}`,`./assets/css/bank-reset-v37.4.3.css?v=${V}`,
  `./assets/js/mathjax-config.js?v=${V}`,`./assets/vendor/mathjax.js?v=${V}`,
  `./assets/js/core.js?v=${V}`,`./assets/js/id6-taxonomy-v37.4.js?v=${V}`,`./assets/js/authoring.js?v=${V}`,`./assets/js/data-vault.js?v=${V}`,`./assets/js/exam.js?v=${V}`,`./assets/js/firebase.js?v=${V}`,
  `./assets/js/dashboard-v22.js?v=${V}`,`./assets/js/admin-v25.js?v=${V}`,`./assets/js/integrity-v26.js?v=${V}`,`./assets/js/teacher-ops-v27.js?v=${V}`,`./assets/js/student-ux-v28.js?v=${V}`,
  `./assets/js/question-bank-v29.js?v=${V}`,`./assets/js/exam-pro-v30.js?v=${V}`,`./assets/js/analytics-pro-v31.js?v=${V}`,`./assets/js/scale-v34.js?v=${V}`,`./assets/js/hardening-v35.js?v=${V}`,`./assets/js/ui-v35.js?v=${V}`,`./assets/js/bootstrap.js?v=${V}`,`./assets/js/ux-v35.3.js?v=${V}`,`./assets/js/smart-nav-v35.4.js?v=${V}`,`./assets/js/knowledge-map-v36.js?v=${V}`,`./assets/js/quality-engine-v36.1.js?v=${V}`,`./assets/js/smart-exam-v36.2.js?v=${V}`,`./assets/js/mastery-v36.3.js?v=${V}`,`./assets/js/ai-intelligence-v37.js?v=${V}`,`./assets/js/bank-backup-v37.1.js?v=${V}`,`./assets/js/tikz-support-v37.2.js?v=${V}`,`./assets/js/graph-engine-v37.3.3.js?v=${V}`,`./assets/js/tools-menu-v37.3.1.js?v=${V}`,`./assets/js/variation-exam-v37.3.6.js?v=${V}`,`./assets/js/id6-ui-v37.4.js?v=${V}`,`./assets/js/id6-hierarchy-v37.4.1.js?v=${V}`,`./assets/js/id6-pure-ui-v37.4.2.js?v=${V}`,`./assets/js/bank-reset-v37.4.3.js?v=${V}`,
  `./assets/icons/icon-192.png?v=${V}`,`./assets/icons/icon-512.png?v=${V}`
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('math12hub-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;if(req.mode==='navigate'){event.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));return}event.respondWith(fetch(req).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r}).catch(()=>caches.match(req)))});
