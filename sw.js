const CACHE_REV='20260920-v40.30.1';
const SHELL=`math12hub-${CACHE_REV}-shell`;
const RUNTIME=`math12hub-${CACHE_REV}-runtime`;
const CORE=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/math12hub-v40.20.0.bundle.css",
  "./assets/js/math12hub-v40.20.0.bundle.js",
  "./assets/js/character-platform-v40.20.0.js",
  "./assets/js/character-reactions-v40.21.0.js",
  "./assets/css/character-reactions-v40.21.0.css",
  "./assets/js/student-profile-pro-v40.22.0.js",
  "./assets/css/student-profile-pro-v40.22.0.css",
  "./assets/js/shop-collections-v40.23.0.js",
  "./assets/css/shop-collections-v40.23.0.css",
  "./assets/js/gamification-economy-v40.24.0.js",
  "./assets/css/gamification-economy-v40.24.0.css",
  "./assets/js/security-core-v40.26.0.js",
  "./assets/js/sync-delta-v40.27.0.js",
  "./assets/js/performance-v40.28.0.js",
  "./assets/js/ux-pro-v40.29.0.js",
  "./assets/css/ux-pro-v40.29.0.css",
  "./assets/js/quality-gate-v40.30.0.js",
  "./assets/css/quality-gate-v40.30.0.css",
  "./release-manifest.json",
  "./assets/js/arena-integration-v40.26.0.js",
  "./assets/css/arena-integration-v40.25.0.css",
  "./assets/js/mathjax-config.js",
  "./assets/vendor/mathjax.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/data/avatar-asset-manifest-v40.20.0.json",
];
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('math12hub-')&&![SHELL,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function networkFirst(req,fallback){try{const r=await fetch(req);if(r&&r.ok){const c=await caches.open(RUNTIME);c.put(req,r.clone())}return r}catch(_){return (await caches.match(req))||(fallback?await caches.match(fallback):Response.error())}}
async function stale(req){const cached=await caches.match(req);const fresh=fetch(req).then(async r=>{if(r&&r.ok){const c=await caches.open(RUNTIME);c.put(req,r.clone())}return r}).catch(()=>null);return cached||fresh||Response.error()}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;if(req.mode==='navigate'){event.respondWith(networkFirst(req,'./index.html'));return}if(/\.(?:js|css|png|webp|json|webmanifest)$/.test(u.pathname)){event.respondWith(stale(req));return}event.respondWith(networkFirst(req));});
