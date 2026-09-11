/* =========================================================
   Math12 Hub — Avatar + Room Runtime Bridge v40.14.2
   Central event bus and renderer adapter registry.
   Evolution layer only: keeps every legacy module/API working.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.14.2-avatar-architecture-bridge',VERSION=40142;
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
