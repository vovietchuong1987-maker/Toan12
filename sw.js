/* Math12 Hub v40.19.7 GitHub Lite — offline shell */
const CACHE_REV='20260918-v40.19.7-github-lite';
const SHELL=`math12hub-${CACHE_REV}-shell`;
const RUNTIME=`math12hub-${CACHE_REV}-runtime`;
const CORE=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/math12hub-v40.19.7.bundle.css",
  "./assets/js/mathjax-config.js",
  "./assets/vendor/mathjax.js",
  "./assets/js/math12hub-v40.19.7.bundle.js",
  "./assets/js/ai-teacher-v32.js",
  "./assets/js/reports-v33.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/data/avatar-asset-manifest-v40.19.3.json",
  "./assets/img/avatar-2d-pro-preview-female.png",
  "./assets/img/avatar-2d-pro-preview-male.png",
  "./assets/img/avatar-2d-pro-reference.png",
  "./assets/img/avatar-mask-female-accent.png",
  "./assets/img/avatar-mask-female-bottom.png",
  "./assets/img/avatar-mask-female-foreground.png",
  "./assets/img/avatar-mask-female-hair-highlight.png",
  "./assets/img/avatar-mask-female-hair.png",
  "./assets/img/avatar-mask-female-shoes.png",
  "./assets/img/avatar-mask-female-top.png",
  "./assets/img/avatar-mask-male-accent.png",
  "./assets/img/avatar-mask-male-bottom.png",
  "./assets/img/avatar-mask-male-hair-highlight.png",
  "./assets/img/avatar-mask-male-hair.png",
  "./assets/img/avatar-mask-male-shoes.png",
  "./assets/img/avatar-mask-male-top.png",
  "./assets/img/avatar-premium-concept.webp",
  "./assets/img/avatar-signature-female.png",
  "./assets/img/avatar-signature-male.png",
  "./assets/img/room-premium-concept.webp"
];
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('math12hub-')&&![SHELL,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function networkFirst(req,fallback){try{const r=await fetch(req);if(r&&r.ok){const c=await caches.open(RUNTIME);c.put(req,r.clone())}return r}catch(_){return (await caches.match(req))||(fallback?await caches.match(fallback):Response.error())}}
async function stale(req){const cached=await caches.match(req);const fresh=fetch(req).then(async r=>{if(r&&r.ok){const c=await caches.open(RUNTIME);c.put(req,r.clone())}return r}).catch(()=>null);return cached||fresh||Response.error()}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;if(req.mode==='navigate'){event.respondWith(networkFirst(req,'./index.html'));return}if(/\.(?:js|css|png|webp|json|webmanifest)$/.test(u.pathname)){event.respondWith(stale(req));return}event.respondWith(networkFirst(req));});
