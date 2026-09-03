/* Math12 Hub  — lightweight offline shell + runtime cache */
const CACHE_REV='20260903-v40.11-unified-question-bank';
const SHELL=`math12hub-${CACHE_REV}-shell`;
const RUNTIME=`math12hub-${CACHE_REV}-runtime`;
const CORE=[
  './','./index.html','./manifest.webmanifest',
  './assets/css/app-v40.10.bundle.css',
  './assets/js/mathjax-config.js','./assets/vendor/mathjax.js',
  './assets/js/core.js','./assets/js/id6-taxonomy-v37.4.js','./assets/js/lesson-content-v37.7.js',
  './assets/data/question-bank-canonical-v40.11.js','./assets/js/full-bank-v40.11.js','./assets/js/unified-bank-v40.11.js','./assets/js/authoring.js','./assets/js/exam.js','./assets/js/question-id-v40.js','./assets/js/bbt-renderer-v40.6.js','./assets/js/bbt-autodetect-v40.10.js','./assets/js/honor-board-v40.9.js','./assets/js/mobile-exam-v40.8.js','./assets/js/platform-v40.js',
  './assets/js/avatar3d-v38.4.js','./assets/js/avatar-engine-v40.1.js','./assets/js/avatar-motion-v40.2.js','./assets/js/avatar-studio-v40.3.js','./assets/js/avatar-live-v40.4.js','./assets/js/avatar-pro-v40.5.js','./assets/js/math-room-v39.js',
  './assets/img/avatar-premium-concept.webp','./assets/img/room-premium-concept.webp',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('math12hub-')&&![SHELL,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function networkFirst(req,fallback){try{const r=await fetch(req);if(r&&r.ok){const c=await caches.open(RUNTIME);c.put(req,r.clone())}return r}catch(_){return (await caches.match(req))||(fallback?await caches.match(fallback):Response.error())}}
async function stale(req){const cached=await caches.match(req);const fresh=fetch(req).then(async r=>{if(r&&r.ok){const c=await caches.open(RUNTIME);c.put(req,r.clone())}return r}).catch(()=>null);return cached||fresh||Response.error()}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
  if(req.mode==='navigate'){event.respondWith(networkFirst(req,'./index.html'));return}
  if(/question-bank-canonical|lesson-content/.test(u.pathname)){event.respondWith(stale(req));return}
  if(/\.(?:js|css|png|webmanifest)$/.test(u.pathname)){event.respondWith(stale(req));return}
  event.respondWith(networkFirst(req));
});
