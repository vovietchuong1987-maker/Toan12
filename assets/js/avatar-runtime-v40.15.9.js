/* =========================================================
   Math12 Hub — Avatar + Room Runtime Bridge v40.14.2
   Central event bus and renderer adapter registry.
   Evolution layer only: keeps every legacy module/API working.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.16.0-avatar-runtime-production',VERSION=401600;
if(window.Math12AvatarRuntime?.version>=VERSION)return;

const channels=new Map();
const rendererAdapters=new Map();
let currentPage='';
let installed=false;

const copy=x=>{try{return JSON.parse(JSON.stringify(x))}catch(_){return x}};
function listeners(type){if(!channels.has(type))channels.set(type,new Set());return channels.get(type)}
function on(type,fn){if(typeof fn!=='function')return ()=>{};listeners(type).add(fn);return ()=>off(type,fn)}
function once(type,fn){let stop=()=>{};stop=on(type,(detail,meta)=>{stop();fn(detail,meta)});return stop}
function off(type,fn){channels.get(type)?.delete(fn)}
function emit(type,detail={},meta={}){
  const info={type,at:Date.now(),build:BUILD,...meta};
  for(const fn of [...(channels.get(type)||[])])try{fn(detail,info)}catch(err){console.warn('[Math12Events]',type,err)}
  return detail;
}

function activePage(){
  const el=document.querySelector('.section.active[id^="page-"]');
  return String(el?.id||'').replace(/^page-/,'');
}
function dispatchDom(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail}))}catch(_){ }}

function wrapNavigation(){
  if(typeof window.goPage!=='function'||window.goPage.__math12RuntimeV40142)return false;
  const base=window.goPage;
  const wrapped=function(page,internal=false){
    const previous=currentPage||activePage();
    const out=base.apply(this,arguments);
    currentPage=String(page||activePage()||'');
    const detail={page:currentPage,previous,internal:!!internal};
    emit('page:changed',detail,{source:'goPage'});
    dispatchDom('math12hub:page-changed',detail);
    return out;
  };
  wrapped.__math12RuntimeV40142=true;
  wrapped.__math12RuntimeBase=base;
  window.goPage=wrapped;
  return true;
}

function wrapHydration(){
  if(typeof window.firebaseHydrateUser!=='function'||window.firebaseHydrateUser.__math12RuntimeV40142)return false;
  const base=window.firebaseHydrateUser;
  const wrapped=async function(){
    const out=await base.apply(this,arguments);
    const detail={uid:window.firebaseUser?.uid||'local',profile:window.firebaseProfile||null};
    emit('account:hydrated',detail,{source:'firebaseHydrateUser'});
    dispatchDom('math12hub:account-hydrated',detail);
    return out;
  };
  wrapped.__math12RuntimeV40142=true;
  wrapped.__math12RuntimeBase=base;
  window.firebaseHydrateUser=wrapped;
  return true;
}

const DOM_BRIDGES={
  'math12hub:avatar-state-changed':'avatar:state-changed',
  'math12hub:avatar-changed':'avatar:legacy-changed',
  'math12hub:avatar3d-ready':'avatar:studio-ready',
  'math12hub:attempt-rewarded':'learning:attempt-rewarded',
  'math12hub:game-reward':'game:reward'
};
function bridgeDomEvents(){
  for(const [domName,type] of Object.entries(DOM_BRIDGES)){
    window.addEventListener(domName,e=>emit(type,e?.detail||{},{source:domName}));
  }
}

function normalizeAdapter(adapter){
  const a=adapter&&typeof adapter==='object'?adapter:{};
  return {
    isMounted:typeof a.isMounted==='function'?a.isMounted:()=>true,
    getScene:typeof a.getScene==='function'?a.getScene:()=>null,
    getRoot:typeof a.getRoot==='function'?a.getRoot:()=>null,
    getParts:typeof a.getParts==='function'?a.getParts:()=>null,
    applyAppearance:typeof a.applyAppearance==='function'?a.applyAppearance:()=>false,
    setExpression:typeof a.setExpression==='function'?a.setExpression:()=>false,
    setPose:typeof a.setPose==='function'?a.setPose:()=>false,
    refresh:typeof a.refresh==='function'?a.refresh:()=>false,
    destroy:typeof a.destroy==='function'?a.destroy:()=>false
  };
}
function registerRenderer(name,adapter,options={}){
  name=String(name||'').trim();if(!name)throw new Error('Renderer context name is required');
  const entry={name,adapter:normalizeAdapter(adapter),autoSync:options.autoSync!==false,registeredAt:Date.now()};
  rendererAdapters.set(name,entry);
  emit('renderer:registered',{name,autoSync:entry.autoSync},{source:'runtime'});
  return ()=>{if(rendererAdapters.get(name)===entry)rendererAdapters.delete(name)};
}
function renderer(name){return rendererAdapters.get(String(name||''))?.adapter||null}
function hasRenderer(name){return rendererAdapters.has(String(name||''))}
function eachRenderer(method,...args){
  const results={};
  for(const [name,entry] of rendererAdapters){
    if(!entry.adapter.isMounted())continue;
    try{results[name]=entry.adapter[method]?.(...args)}catch(err){console.warn('[AvatarRendererBridge]',name,method,err)}
  }
  return results;
}
function syncAppearance(detail={}){
  const config=detail.current||window.AvatarEngine?.get?.()||null;
  if(!config)return;
  for(const [name,entry] of rendererAdapters){
    if(!entry.autoSync||!entry.adapter.isMounted())continue;
    try{entry.adapter.applyAppearance(config,detail)}catch(err){console.warn('[AvatarRendererBridge]',name,'appearance',err)}
  }
}

const Events={build:BUILD,version:VERSION,on,once,off,emit};
const RendererBridge={
  build:BUILD,version:VERSION,register:registerRenderer,get:renderer,has:hasRenderer,
  refresh:(name,...args)=>renderer(name)?.refresh?.(...args),
  applyAppearance:(name,config,detail={})=>renderer(name)?.applyAppearance?.(config,detail),
  setExpression:(name,value,detail={})=>renderer(name)?.setExpression?.(value,detail),
  setPose:(name,value,detail={})=>renderer(name)?.setPose?.(value,detail),
  each:eachRenderer,
  contexts:()=>[...rendererAdapters.keys()]
};

function install(){
  if(installed)return;installed=true;
  window.Math12Events=Events;
  window.AvatarRendererBridge=RendererBridge;
  bridgeDomEvents();
  on('avatar:state-changed',syncAppearance);
  wrapNavigation();wrapHydration();
  // Some deployments define wrappers a little later. Retry briefly without polling forever.
  let tries=0;const timer=setInterval(()=>{tries++;wrapNavigation();wrapHydration();if(tries>=20||((typeof window.goPage==='function')&&(typeof window.firebaseHydrateUser==='function')))clearInterval(timer)},250);
  currentPage=activePage();
  emit('runtime:ready',{page:currentPage},{source:'install'});
  dispatchDom('math12hub:avatar-runtime-ready',{build:BUILD,version:VERSION,page:currentPage});
}

window.Math12AvatarRuntime={
  build:BUILD,version:VERSION,events:Events,renderers:RendererBridge,
  get currentPage(){return currentPage||activePage()},
  snapshot(){return {build:BUILD,version:VERSION,page:currentPage||activePage(),renderers:RendererBridge.contexts(),events:[...channels.keys()]}}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();


/* =========================================================
   Math12 Hub v40.15.10 — Avatar Integration QA + Sync Guard
   Non-destructive health checks across Engine / Renderer / Studio / Room.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.16.0-avatar-integration-qa',VERSION=401600;
let last=null,timer=0;
const safe=(fn,fallback=null)=>{try{return fn()}catch(_){return fallback}};
function itemExists(id){
  if(!id)return true;
  return !!(safe(()=>window.v385Wardrobe?.item?.(id),null)||safe(()=>window.v386MegaShop?.item?.(id),null)||safe(()=>window.v380Shop?.item?.(id),null));
}
function run(options={}){
  const checks=[],warnings=[],errors=[];
  const add=(id,ok,detail='')=>{checks.push({id,ok:!!ok,detail:String(detail||'')});if(!ok)errors.push(id)};
  add('avatar-engine',!!window.AvatarEngine,'AvatarEngine');
  add('avatar-renderer',!!window.Math12AvatarRenderer,'Math12AvatarRenderer');
  add('avatar-motion',!!window.AvatarMotion,'AvatarMotion');
  add('avatar-emotion',!!window.AvatarEmotion,'AvatarEmotion');
  add('avatar-studio',!!window.AvatarStudio,'AvatarStudio');
  add('math-room',!!window.v390Room,'v390Room');
  const cfg=safe(()=>window.AvatarEngine?.get?.(),null);
  add('config-readable',!!cfg,cfg?.schemaVersion||'');
  if(cfg){
    add('config-schema',Number(cfg.schemaVersion)===600,`schema=${cfg.schemaVersion}`);
    const invalid=[];for(const [slot,id] of Object.entries(cfg.equipped||{}))if(id&&!itemExists(id))invalid.push(`${slot}:${id}`);
    if(invalid.length)warnings.push('missing-equipped:'+invalid.join(','));
    checks.push({id:'equipped-resolvable',ok:invalid.length===0,detail:invalid.join(',')});
  }
  const contexts=safe(()=>window.AvatarRendererBridge?.contexts?.(),[])||[];
  checks.push({id:'renderer-contexts',ok:true,detail:contexts.join(',')||'none-mounted'});
  const studioCanvas=document.querySelectorAll('.v384-avatar3d-canvas').length;
  const roomCanvas=document.querySelectorAll('.v390-canvas').length;
  if(studioCanvas>1)warnings.push(`duplicate-studio-canvas:${studioCanvas}`);
  if(roomCanvas>1)warnings.push(`duplicate-room-canvas:${roomCanvas}`);
  checks.push({id:'single-studio-canvas',ok:studioCanvas<=1,detail:String(studioCanvas)});
  checks.push({id:'single-room-canvas',ok:roomCanvas<=1,detail:String(roomCanvas)});
  const roomRoot=safe(()=>window.v390Room?.getAvatarRoot?.(),null),roomRenderer=safe(()=>window.v390Room?.getAvatarRenderer?.(),'');
  if(roomRoot&&roomRenderer==='legacy-room')warnings.push('room-legacy-fallback-active');
  checks.push({id:'room-shared-renderer',ok:!roomRoot||roomRenderer!=='legacy-room',detail:roomRenderer||'room-not-mounted'});
  const grade=errors.length?'error':warnings.length?'warn':'pass';
  last={build:BUILD,version:VERSION,grade,at:Date.now(),checks,warnings,errors,contexts,configRevision:Number(cfg?.revision)||0};
  document.documentElement.dataset.avatarQa=grade;
  if(options.log&&grade!=='pass')console.warn('[Avatar QA]',last);
  try{window.dispatchEvent(new CustomEvent('math12hub:avatar-qa',{detail:last}))}catch(_){ }
  return last;
}
function schedule(delay=180){clearTimeout(timer);timer=setTimeout(()=>run(),delay)}
function install(){
  window.addEventListener('math12hub:avatar-state-changed',()=>schedule(240));
  window.addEventListener('math12hub:avatar-renderer-ready',()=>schedule(180));
  window.addEventListener('math12hub:avatar3d-ready',()=>schedule(180));
  window.addEventListener('math12hub:room-presence-ready',()=>schedule(260));
  if(window.Math12Events){window.Math12Events.on('renderer:registered',()=>schedule(180));window.Math12Events.on('page:changed',()=>schedule(320));window.Math12Events.on('account:hydrated',()=>schedule(420))}
  setTimeout(()=>run(),700);
}
window.Math12AvatarQA={build:BUILD,version:VERSION,run,status:()=>last||run(),schedule};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();


/* Math12 Hub v40.16.0 — Avatar + Math Room Production Release */
(function(){
'use strict';
const BUILD='40.16.0-avatar-math-room-production',VERSION=401600;
const capabilities=Object.freeze([
  'canonical-avatar-state','unified-studio-room-renderer','face2','emotion-engine','motion2.1',
  'personality-microbehavior','animation-polish','material-lighting','math12-signature',
  'wardrobe-shop-sync','math-room-presence','integration-qa','adaptive-performance'
]);
function status(){
  const qa=window.Math12AvatarQA?.status?.()||null;
  return {build:BUILD,version:VERSION,ready:!!window.AvatarEngine&&!!window.Math12AvatarRenderer&&!!window.AvatarMotion&&!!window.v390Room,qa:qa?.grade||'pending',capabilities:[...capabilities],renderers:window.AvatarRendererBridge?.contexts?.()||[]};
}
function install(){
  document.documentElement.dataset.avatarRelease='40.16.0';
  setTimeout(()=>window.Math12AvatarQA?.run?.(),900);
  try{window.dispatchEvent(new CustomEvent('math12hub:avatar-production-ready',{detail:status()}))}catch(_){ }
}
window.Math12AvatarRelease={build:BUILD,version:VERSION,capabilities,status};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
