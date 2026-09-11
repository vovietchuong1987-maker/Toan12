/* =========================================================
   Math12 Hub v40.14.9 — Room Presence
   Avatar presence controller for Math Room.
   - Moves the shared Avatar between meaningful room anchors.
   - Reuses Avatar Motion 2.0 for root transitions + light walk cadence.
   - Keeps study/window/relax presence independent from saved avatar state.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.14.9-room-presence';
let scene=null,api=null,stage=null,current='study',moving=false,timer=0;
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches||!!window.Math12Platform?.perf?.lowPower?.()}catch(_){return false}};
const LOCATIONS={
  study:{label:'Bàn học',icon:'📖',pose:'study',x:-1.20,y:.38,z:.13,rotationY:0,duration:820},
  window:{label:'Cửa sổ',icon:'🌤',pose:'window',x:-3.05,y:.38,z:.55,rotationY:Math.PI/2,duration:980},
  relax:{label:'Thư giãn',icon:'☕',pose:'relax',x:.90,y:.38,z:-.55,rotationY:0,duration:900}
};
const INTERACTION_LOCATION={notebook:'study',bookshelf:'study',trophy:'study',board:'study',avatar:'study',window:'window',chair:'relax'};
function activeStage(){return document.querySelector('#page-room.active .v390-stage')||stage}
function motion(){return window.AvatarMotion||null}
function root(){return api?.getAvatarRoot?.()||window.AvatarRendererBridge?.get?.('room')?.getRoot?.()||null}
function setButtons(){const s=activeStage();if(!s)return;s.querySelectorAll('[data-room-presence]').forEach(b=>{const on=b.dataset.roomPresence===current;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});const chip=s.querySelector('[data-room-presence-status]');if(chip){const loc=LOCATIONS[current];chip.textContent=moving?'Đang di chuyển…':`${loc?.icon||'☺'} ${loc?.label||'Trong phòng'}`}}
function ensureControls(){const s=activeStage();if(!s)return null;let box=s.querySelector('.v40149-presence-controls');if(box)return box;box=document.createElement('div');box.className='v40149-presence-controls';box.setAttribute('aria-label','Vị trí Avatar trong phòng');box.innerHTML=`<span data-room-presence-status>📖 Bàn học</span>${Object.entries(LOCATIONS).map(([id,x])=>`<button type="button" data-room-presence="${id}" aria-pressed="${id==='study'?'true':'false'}" title="${x.label}">${x.icon}<b>${x.label}</b></button>`).join('')}`;box.querySelectorAll('[data-room-presence]').forEach(b=>b.addEventListener('click',()=>{try{window.Math12RoomInteractions?.close?.(false)}catch(_){}go(b.dataset.roomPresence,{source:'control'})}));s.appendChild(box);setButtons();return box}
function emit(type,detail={}){try{window.Math12Events?.emit?.(type,{...detail,build:BUILD},{source:'room-presence'})}catch(_){}try{window.dispatchEvent(new CustomEvent(`math12hub:${type.replace(/:/g,'-')}`,{detail:{...detail,build:BUILD}}))}catch(_){}}
function snap(name='study'){
  const loc=LOCATIONS[name]||LOCATIONS.study,rm=root();if(!rm)return false;
  current=name;moving=false;clearTimeout(timer);
  const m=motion();if(m?.moveRoot)m.moveRoot(loc,{context:'room',duration:0});else{rm.position.set(loc.x,loc.y,loc.z);rm.rotation.y=loc.rotationY}
  try{api?.setAvatarPose?.(loc.pose)}catch(_){}
  setButtons();return true;
}
function arrive(name,loc,options={}){
  if(current!==name)return;moving=false;
  try{api?.setAvatarPose?.(loc.pose)}catch(_){}
  const gesture=options.gesture||({study:'nod',window:'headTilt',relax:'headTilt'})[name];
  if(gesture)setTimeout(()=>{if(current===name&&!moving)try{api?.playAvatarMotion?.(gesture)}catch(_){}},80);
  setButtons();emit('room:presence-arrived',{location:name,pose:loc.pose,source:options.source||'api'});
}
function go(name='study',options={}){
  name=LOCATIONS[name]?name:'study';const loc=LOCATIONS[name],rm=root();if(!rm)return false;clearTimeout(timer);
  const same=current===name&&!moving,dur=reduced()?0:Math.max(0,Number(options.duration??loc.duration));
  if(same){try{api?.setAvatarPose?.(loc.pose);if(options.gesture)api?.playAvatarMotion?.(options.gesture)}catch(_){}setButtons();return true}
  current=name;moving=dur>0;setButtons();emit('room:presence-moving',{location:name,duration:dur,source:options.source||'api'});
  try{api?.setAvatarPose?.('focus')}catch(_){}
  const m=motion();
  if(m?.moveRoot){
    if(dur>0)m.play?.('walk',dur,{context:'room'});
    m.moveRoot(loc,{context:'room',duration:dur});
  }else{
    rm.position.set(loc.x,loc.y,loc.z);rm.rotation.y=loc.rotationY;
  }
  if(!dur)arrive(name,loc,options);else timer=setTimeout(()=>arrive(name,loc,options),dur+35);
  return true;
}
function goForInteraction(kind,options={}){return go(INTERACTION_LOCATION[kind]||'study',{...options,source:`interaction:${kind}`})}
function rebind(){if(!scene||!root())return false;ensureControls();return snap(current)}
function mount(nextScene,nextApi){scene=nextScene;api=nextApi||window.v390Room||api;stage=activeStage();if(!scene||!stage)return false;ensureControls();snap('study');document.documentElement.dataset.roomPresenceBuild=BUILD;emit('room:presence-ready',{location:current});return true}
function unmount(removeUi=true){clearTimeout(timer);timer=0;moving=false;if(removeUi)activeStage()?.querySelector('.v40149-presence-controls')?.remove();scene=null;api=null;stage=null;current='study'}
window.Math12RoomPresence={build:BUILD,locations:LOCATIONS,mount,unmount,rebind,go,goForInteraction,home:()=>go('study'),snap,get current(){return current},get moving(){return moving},status:()=>({build:BUILD,current,moving,mounted:!!scene,root:!!root()})};
})();
