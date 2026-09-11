/* =========================================================
   Math12 Hub — Avatar Motion 2.0 v40.14.6
   - One motion system for Studio + Math Room renderer contexts.
   - Natural layered idle (breathing, blink, gaze, micro head/weight shift).
   - Contextual gestures: nod, headTilt, wave, think, small/big celebrate.
   - Smooth persistent pose transitions: stand, focus, study, relax, window.
   - Respects reduced-motion / low-power and never owns saved avatar state.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.14.6-avatar-motion-2',VERSION=40146;
const controllers=new Map();
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const easeOut=v=>1-Math.pow(1-clamp(v),3);
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches||!!window.Math12Platform?.perf?.lowPower?.()}catch(_){return false}};
const now=()=>performance.now();

function nodeState(node){
  return node?{px:node.position?.x||0,py:node.position?.y||0,pz:node.position?.z||0,rx:node.rotation?.x||0,ry:node.rotation?.y||0,rz:node.rotation?.z||0,sx:node.scaling?.x||1,sy:node.scaling?.y||1,sz:node.scaling?.z||1}:null;
}
function setNode(node,b){if(!node||!b)return;node.position?.set?.(b.px,b.py,b.pz);node.rotation?.set?.(b.rx,b.ry,b.rz);node.scaling?.set?.(b.sx,b.sy,b.sz)}
function mix(a,b,t){if(!a)return b;if(!b)return a;const m=(x,y)=>x+(y-x)*t;return {px:m(a.px,b.px),py:m(a.py,b.py),pz:m(a.pz,b.pz),rx:m(a.rx,b.rx),ry:m(a.ry,b.ry),rz:m(a.rz,b.rz),sx:m(a.sx,b.sx),sy:m(a.sy,b.sy),sz:m(a.sz,b.sz)}}
function capture(c){const p=c.parts||{};return {root:nodeState(c.root),head:nodeState(p.head),leftArm:nodeState(p.leftArm),rightArm:nodeState(p.rightArm),legL:nodeState(p.legL),legR:nodeState(p.legR),body:nodeState(p.body),chest:nodeState(p.chest),eyes:(p.eyes||[]).map(nodeState),gaze:(p.gaze||[]).map(nodeState)}}
function applySnapshot(c,s){if(!c||!s)return;const p=c.parts||{};setNode(c.root,s.root);setNode(p.head,s.head);setNode(p.leftArm,s.leftArm);setNode(p.rightArm,s.rightArm);setNode(p.legL,s.legL);setNode(p.legR,s.legR);setNode(p.body,s.body);setNode(p.chest,s.chest);(p.eyes||[]).forEach((n,i)=>setNode(n,s.eyes?.[i]));(p.gaze||[]).forEach((n,i)=>setNode(n,s.gaze?.[i]))}
function mixSnapshot(a,b,t){return {root:mix(a.root,b.root,t),head:mix(a.head,b.head,t),leftArm:mix(a.leftArm,b.leftArm,t),rightArm:mix(a.rightArm,b.rightArm,t),legL:mix(a.legL,b.legL,t),legR:mix(a.legR,b.legR,t),body:mix(a.body,b.body,t),chest:mix(a.chest,b.chest,t),eyes:(a.eyes||[]).map((x,i)=>mix(x,b.eyes?.[i],t)),gaze:(a.gaze||[]).map((x,i)=>mix(x,b.gaze?.[i],t))}}
function currentBase(c,ms){
  const tr=c.poseTransition;if(!tr)return c.base;
  const p=clamp((ms-tr.start)/(tr.until-tr.start||1));const t=smooth(p);const base=mixSnapshot(tr.from,tr.to,t);
  if(p>=1){c.base=tr.to;c.poseTransition=null;return c.base}
  return base;
}
function resetToBase(c){applySnapshot(c,c.base)}
function blinkAmount(ms,c){
  if(ms<c.nextBlink)return 0;
  if(!c.blinkStart){c.blinkStart=ms;c.doubleBlink=Math.random()<.18}
  const t=ms-c.blinkStart,one=t<86?smooth(t/86):t<164?1-smooth((t-86)/78):0;
  const two=c.doubleBlink&&t>=224&&t<365?(t<289?smooth((t-224)/65):1-smooth((t-289)/76)):0;
  const end=c.doubleBlink?405:202;
  if(t>end){c.nextBlink=ms+rand(2800,6100);c.blinkStart=0;c.doubleBlink=false;return 0}
  return Math.max(one,two);
}
function actionOffsets(c,ms){
  const a=c.action;if(!a||ms>=a.until){if(a)c.action=null;return {kind:'idle',root:{},head:{},leftArm:{},rightArm:{},legL:{},legR:{}}}
  const p=clamp((ms-a.start)/(a.until-a.start||1)),s=Math.sin(Math.PI*p),pulse=Math.sin(Math.PI*p*2),rapid=Math.sin(Math.PI*p*6);
  const z={kind:a.kind,root:{},head:{},leftArm:{},rightArm:{},legL:{},legR:{}};
  switch(a.kind){
    case 'equip':case 'preview':
      z.root.ry=s*(a.kind==='preview'?.10:.20);z.root.py=s*.022;z.root.scale=s*.018;z.head.rz=-s*.028;break;
    case 'nod':
      z.head.rx=Math.sin(Math.PI*p*4)*.070*(1-p*.30);z.root.py=s*.006;break;
    case 'headTilt':
      z.head.rz=s*.105;z.head.rx=s*.025;z.head.ry=-s*.035;break;
    case 'wave':
      z.head.rz=s*.025;z.leftArm.rz=-s*.92+rapid*.10*s;z.leftArm.rx=-s*.18;z.root.ry=-s*.035;break;
    case 'think':
      z.head.rz=-s*.075;z.head.rx=s*.045;z.head.ry=s*.055;z.leftArm.rz=-s*.62;z.leftArm.rx=-s*.22;break;
    case 'smallCelebrate':
      z.root.py=s*.035;z.root.ry=pulse*.025*s;z.leftArm.rz=-s*.54;z.rightArm.rz=s*.54;z.leftArm.rx=-s*.12;z.rightArm.rx=-s*.12;z.head.rx=-s*.025;break;
    case 'bigCelebrate':
      z.root.py=Math.abs(Math.sin(Math.PI*p*3))* .105;z.root.ry=Math.sin(Math.PI*p*4)*.075;z.root.scale=Math.abs(Math.sin(Math.PI*p*3))*.022;z.leftArm.rz=-s*1.15;z.rightArm.rz=s*1.15;z.leftArm.rx=-s*.30;z.rightArm.rx=-s*.30;z.head.rz=Math.sin(Math.PI*p*4)*.028;break;
  }
  return z;
}
function addRot(node,b,off={}){if(!node||!b)return;node.rotation.x=b.rx+(off.rx||0);node.rotation.y=b.ry+(off.ry||0);node.rotation.z=b.rz+(off.rz||0)}
function tick(c){
  if(!c?.root||!c.parts)return;const ms=now(),t=ms/1000,base=currentBase(c,ms),slow=c.reduced,off=actionOffsets(c,ms),p=c.parts;
  if(ms>=c.nextGaze){c.gazeTargetX=rand(-.025,.025);c.gazeTargetY=rand(-.012,.013);c.nextGaze=ms+rand(2300,5000)}
  c.gazeX+=(c.gazeTargetX-c.gazeX)*(slow?.04:.072);c.gazeY+=(c.gazeTargetY-c.gazeY)*(slow?.04:.072);
  const blink=blinkAmount(ms,c),breath=slow?0:Math.sin(t*1.68),sway=slow?0:Math.sin(t*.46),weight=slow?0:Math.sin(t*.31);
  const rb=base.root;if(rb){c.root.position.x=rb.px+weight*.003;c.root.position.y=rb.py+breath*.014+(off.root.py||0);c.root.position.z=rb.pz;c.root.rotation.x=rb.rx;c.root.rotation.y=rb.ry+sway*.011+(off.root.ry||0);c.root.rotation.z=rb.rz+weight*.003;const sc=off.root.scale||0;c.root.scaling.set(rb.sx*(1+sc),rb.sy*(1+sc),rb.sz*(1+sc))}
  if(p.head&&base.head){const b=base.head;addRot(p.head,b,{rx:(slow?0:Math.sin(t*.37)*.006)+(off.head.rx||0),ry:(slow?0:Math.sin(t*.42)*.018)+(off.head.ry||0),rz:(slow?0:Math.sin(t*.67)*.012)+(off.head.rz||0)})}
  for(const [i,eye] of (p.eyes||[]).entries()){const b=base.eyes?.[i];if(!b)continue;eye.scaling.y=b.sy*(1-.90*blink);eye.scaling.x=b.sx*(1+.015*blink);eye.scaling.z=b.sz}
  for(const [i,gaze] of (p.gaze||[]).entries()){const b=base.gaze?.[i];if(!b)continue;gaze.position.x=b.px+c.gazeX;gaze.position.y=b.py+c.gazeY;gaze.position.z=b.pz}
  if(p.body&&base.body){const b=base.body;p.body.scaling.x=b.sx*(1-breath*.0018);p.body.scaling.y=b.sy*(1+breath*.0055);p.body.scaling.z=b.sz}
  if(p.chest&&base.chest){const b=base.chest;p.chest.scaling.x=b.sx*(1+breath*.003);p.chest.scaling.y=b.sy*(1+breath*.007);p.chest.scaling.z=b.sz}
  if(p.leftArm&&base.leftArm){addRot(p.leftArm,base.leftArm,{rx:off.leftArm.rx||0,ry:off.leftArm.ry||0,rz:(slow?0:Math.sin(t*1.31)*.018)+(off.leftArm.rz||0)})}
  if(p.rightArm&&base.rightArm){addRot(p.rightArm,base.rightArm,{rx:off.rightArm.rx||0,ry:off.rightArm.ry||0,rz:-(slow?0:Math.sin(t*1.31)*.018)+(off.rightArm.rz||0)})}
  if(p.legL&&base.legL)addRot(p.legL,base.legL,{rx:off.legL.rx||0,rz:off.legL.rz||0});
  if(p.legR&&base.legR)addRot(p.legR,base.legR,{rx:off.legR.rx||0,rz:off.legR.rz||0});
}
function detach(context='all'){
  const names=context==='all'?[...controllers.keys()]:[String(context)];
  for(const name of names){const c=controllers.get(name);if(!c)continue;try{if(c.scene&&c.observer)c.scene.onBeforeRenderObservable.remove(c.observer)}catch(_){}try{resetToBase(c)}catch(_){}controllers.delete(name)}
}
function attach(context='studio',detail={}){
  context=String(context||'studio');const adapter=window.AvatarRendererBridge?.get?.(context);const scene=detail.scene||adapter?.getScene?.()||(context==='studio'?window.v384Avatar3D?.getScene?.():null);const root=detail.root||adapter?.getRoot?.()||(context==='studio'?window.v384Avatar3D?.getRoot?.():null);const parts=detail.parts||adapter?.getParts?.()||(context==='studio'?window.v384Avatar3D?.getParts?.():null);
  if(!scene||!root||!parts)return false;const old=controllers.get(context);if(old?.scene===scene&&old?.root===root)return true;if(old)detach(context);
  const ms=now(),c={context,scene,root,parts,observer:null,reduced:reduced(),pose:'stand',action:null,poseTransition:null,nextBlink:ms+rand(1500,3900),blinkStart:0,doubleBlink:false,nextGaze:ms+rand(1100,2800),gazeX:0,gazeY:0,gazeTargetX:0,gazeTargetY:0};
  c.base=capture(c);c.observer=scene.onBeforeRenderObservable.add(()=>tick(c));controllers.set(context,c);
  try{window.Math12Events?.emit?.('avatar:motion-context-ready',{context,build:BUILD,reduced:c.reduced},{source:'avatar-motion'})}catch(_){}
  try{window.dispatchEvent(new CustomEvent('math12hub:avatar-motion-ready',{detail:{context,build:BUILD,reduced:c.reduced}}))}catch(_){}
  return true;
}
function attachContext(name){return attach(name,{})}
function syncContexts(){
  const bridge=window.AvatarRendererBridge;for(const name of bridge?.contexts?.()||[]){const a=bridge.get(name);if(a?.isMounted?.())attach(name,{scene:a.getScene?.(),root:a.getRoot?.(),parts:a.getParts?.()});else if(controllers.has(name))detach(name)}
  if(!controllers.has('studio'))attach('studio',{});return controllers.size;
}
function targetControllers(context='all'){if(context&&context!=='all'){const c=controllers.get(String(context));return c?[c]:[]}return [...controllers.values()]}
function sparkle(kind='equip'){
  const shell=document.querySelector('.v384-avatar3d-shell');if(!shell)return;shell.classList.remove('avatar-motion-react');void shell.offsetWidth;shell.classList.add('avatar-motion-react');let fx=shell.querySelector('.avatar-motion-sparkles');fx?.remove();fx=document.createElement('div');fx.className='avatar-motion-sparkles';for(let i=0;i<10;i++){const dot=document.createElement('i');dot.style.setProperty('--a',`${i*36}deg`);dot.style.setProperty('--d',`${42+i%3*11}px`);dot.style.setProperty('--delay',`${i*22}ms`);fx.appendChild(dot)}shell.appendChild(fx);setTimeout(()=>fx.remove(),900);const chip=shell.querySelector('.v392-quality-chip');if(chip)chip.textContent=kind==='preview'?'Đang xem thử':'Đã thay trang bị';
}
function normalizeAction(kind){const k=String(kind||'').trim();if(k==='celebrate')return 'bigCelebrate';if(k==='small-celebrate')return 'smallCelebrate';if(k==='big-celebrate')return 'bigCelebrate';if(k==='head-tilt')return 'headTilt';return k||'nod'}
function play(kind='nod',duration,options={}){
  kind=normalizeAction(kind);const times={equip:850,preview:680,nod:900,headTilt:1200,wave:1450,think:1650,smallCelebrate:1350,bigCelebrate:1850};const context=options?.context||'all',ms=now(),until=ms+(duration||times[kind]||1200);
  for(const c of targetControllers(context)){if(c.reduced&&['bigCelebrate','smallCelebrate','wave'].includes(kind)){c.action={kind:'nod',start:ms,until:ms+650};continue}c.action={kind,start:ms,until}}
  if(kind==='equip'||kind==='preview')sparkle(kind);
  try{window.Math12Events?.emit?.('avatar:motion-play',{kind,context,duration:until-ms,build:BUILD},{source:'avatar-motion'})}catch(_){}
  return {kind,context,start:ms,until,targets:targetControllers(context).map(c=>c.context)};
}
function setPose(pose='stand',options={}){
  const context=options.context||'all',duration=Math.max(0,Number(options.duration??420)),targets=targetControllers(context);let changed=0;
  for(const c of targets){
    const bridge=window.AvatarRendererBridge?.get?.(c.context);resetToBase(c);const from=capture(c);let ok=false;
    try{ok=bridge?.setPose?.(pose,{source:'avatar-motion'})??false}catch(_){}
    if(!ok&&c.context==='studio')try{ok=window.v384Avatar3D?.setPose?.(pose)??false}catch(_){}
    if(!ok)try{ok=window.v384Avatar3D?.applyFactoryPose?.({root:c.root,parts:c.parts,pose:c.pose},pose)??false}catch(_){}
    if(!ok){applySnapshot(c,from);continue}
    const to=capture(c);applySnapshot(c,from);c.pose=String(pose||'stand');c.action=null;
    if(duration>0&&!c.reduced)c.poseTransition={from,to,start:now(),until:now()+duration};else{c.base=to;c.poseTransition=null;applySnapshot(c,to)}changed++;
  }
  try{window.Math12Events?.emit?.('avatar:pose-changed',{pose,context,count:changed,build:BUILD},{source:'avatar-motion'})}catch(_){}
  return changed>0;
}
function onState(e){const d=e?.detail||{},visual=(d.changed||[]).some(x=>['gender','skin','face','faceShape','eyeStyle','browStyle','mouthStyle','irisColor','hair','hairColor','outfit','top','bottom','shoes','head','glasses','back','hand','accessory','pet','aura','background'].includes(x));if(d.source==='preview'||d.source==='preview-clear')play('preview');else if(visual)play('equip');setTimeout(syncContexts,80)}
function install(){
  window.addEventListener('math12hub:avatar3d-ready',e=>attach('studio',e.detail||{}));window.addEventListener('math12hub:avatar-state-changed',onState);window.addEventListener('math12hub:avatar-runtime-ready',()=>setTimeout(syncContexts,20));window.addEventListener('math12hub:avatar-renderer-mounted',e=>setTimeout(()=>attachContext(e.detail?.context||e.detail?.name),0));
  if(window.Math12Events){window.Math12Events.on('renderer:registered',d=>setTimeout(()=>attachContext(d?.name),0));window.Math12Events.on('page:changed',()=>setTimeout(syncContexts,80));}
  window.addEventListener('resize',()=>{for(const c of controllers.values())c.reduced=reduced()});
  let tries=0;const timer=setInterval(()=>{tries++;syncContexts();if(tries>=20)clearInterval(timer)},250);setTimeout(syncContexts,60);
}
window.AvatarMotion={build:BUILD,version:VERSION,managed:true,attach:(detail={})=>attach('studio',detail),attachContext,detach,detachContext:detach,syncContexts,hasContext:name=>controllers.has(String(name)),contexts:()=>[...controllers.keys()],play,setPose,nod:(o={})=>play('nod',null,o),headTilt:(o={})=>play('headTilt',null,o),wave:(o={})=>play('wave',null,o),think:(o={})=>play('think',null,o),smallCelebrate:(o={})=>play('smallCelebrate',null,o),celebrate:(o={})=>play('bigCelebrate',null,o),bigCelebrate:(o={})=>play('bigCelebrate',null,o),reactEquip:()=>play('equip'),status:()=>({build:BUILD,version:VERSION,reduced:reduced(),contexts:[...controllers.entries()].map(([name,c])=>({name,pose:c.pose,action:c.action?.kind||'idle',mounted:!!c.root}))})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
