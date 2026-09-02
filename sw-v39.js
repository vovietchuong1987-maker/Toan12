/* Math12 Hub V40 — lightweight offline shell + runtime cache */
const V='40.0';
const SHELL=`math12hub-${V}-shell`;
const RUNTIME=`math12hub-${V}-runtime`;
const CORE=[
  './','./index.html','./manifest.webmanifest',
  './assets/css/app.css','./assets/css/id6-v37.4.css',
  './assets/js/mathjax-config.js','./assets/vendor/mathjax.js',
  './assets/js/core.js','./assets/js/id6-taxonomy-v37.4.js','./assets/js/lesson-content-v37.7.js',
  './assets/data/all-practice-bank-v38.3.js','./assets/js/full-bank-v38.3.js',
  './assets/js/authoring.js','./assets/js/exam.js','./assets/js/platform-v40.js',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('math12hub-')&&![SHELL,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function networkFirst(req,fallback){try{const r=await fetch(req);if(r&&r.ok){const c=await caches.open(RUNTIME);c.put(req,r.clone())}return r}catch(_){return (await caches.match(req))||(fallback?await caches.match(fallback):Response.error())}}
async function stale(req){const cached=await caches.match(req);const fresh=fetch(req).then(async r=>{if(r&&r.ok){const c=await caches.open(RUNTIME);c.put(req,r.clone())}return r}).catch(()=>null);return cached||fresh||Response.error()}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
  if(req.mode==='navigate'){event.respondWith(networkFirst(req,'./index.html'));return}
  if(/all-practice-bank|lesson-content/.test(u.pathname)){event.respondWith(stale(req));return}
  if(/\.(?:js|css|png|webmanifest)$/.test(u.pathname)){event.respondWith(stale(req));return}
  event.respondWith(networkFirst(req));
});
