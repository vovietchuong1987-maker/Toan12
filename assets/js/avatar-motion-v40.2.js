/* =========================================================
   Math12 Hub — Avatar Motion 2.0 + Personality Micro-behavior v40.15.6
   - One motion system for Studio + Math Room renderer contexts.
   - Natural layered idle (breathing, blink, gaze, micro head/weight shift).
   - Contextual gestures: nod, headTilt, wave, think, small/big celebrate.
   - Smooth persistent pose transitions: stand, focus, study, relax, window.
   - Respects reduced-motion / low-power and never owns saved avatar state.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.15.6-avatar-personality-microbehavior',VERSION=40156;
const controllers=new Map();
const BEHAVIORS={
  idle:{gazeX:0,gazeY:0,gazeAmpX:.022,gazeAmpY:.010,gazeMin:2700,gazeMax:5400,headFollowX:1.00,headFollowY:.72,headPitch:0,headRoll:0,sway:.95,breath:1,micro:['microLook','microNod','postureReset'],microMin:8500,microMax:15000},
  studio:{gazeX:0,gazeY:.002,gazeAmpX:.018,gazeAmpY:.009,gazeMin:2400,gazeMax:4800,headFollowX:1.05,headFollowY:.70,headPitch:-.004,headRoll:0,sway:.78,breath:1,micro:['microLook','microNod'],microMin:6500,microMax:12000},
  study:{gazeX:0,gazeY:-.010,gazeAmpX:.010,gazeAmpY:.005,gazeMin:3400,gazeMax:6200,headFollowX:.70,headFollowY:.58,headPitch:.014,headRoll:0,sway:.42,breath:.82,micro:['microNod','postureReset','microLook'],microMin:10500,microMax:18000},
  focus:{gazeX:0,gazeY:-.013,gazeAmpX:.006,gazeAmpY:.004,gazeMin:4200,gazeMax:7200,headFollowX:.55,headFollowY:.50,headPitch:.020,headRoll:0,sway:.25,breath:.74,micro:['microNod','postureReset'],microMin:13500,microMax:21000},
  thinking:{gazeX:.010,gazeY:.003,gazeAmpX:.008,gazeAmpY:.005,gazeMin:3300,gazeMax:6000,headFollowX:.85,headFollowY:.60,headPitch:.008,headRoll:-.018,sway:.35,breath:.80,micro:['microThink','microLook'],microMin:9000,microMax:15500},
  success:{gazeX:0,gazeY:.003,gazeAmpX:.005,gazeAmpY:.004,gazeMin:4300,gazeMax:6800,headFollowX:.70,headFollowY:.55,headPitch:-.008,headRoll:0,sway:.55,breath:1.05,micro:['microNod'],microMin:12000,microMax:18000},
  recovery:{gazeX:0,gazeY:-.012,gazeAmpX:.006,gazeAmpY:.004,gazeMin:3900,gazeMax:6900,headFollowX:.55,headFollowY:.50,headPitch:.018,headRoll:0,sway:.24,breath:.78,micro:['postureReset','microNod'],microMin:14000,microMax:22000},
  room:{gazeX:0,gazeY:0,gazeAmpX:.019,gazeAmpY:.010,gazeMin:2700,gazeMax:5200,headFollowX:1.05,headFollowY:.72,headPitch:0,headRoll:0,sway:.72,breath:.95,micro:['microLook','postureReset'],microMin:8500,microMax:15000},
  window:{gazeX:.018,gazeY:.006,gazeAmpX:.007,gazeAmpY:.005,gazeMin:3600,gazeMax:6500,headFollowX:1.15,headFollowY:.72,headPitch:-.004,headRoll:.012,sway:.48,breath:.92,micro:['microLook','postureReset'],microMin:10500,microMax:18000},
  relax:{gazeX:0,gazeY:.004,gazeAmpX:.022,gazeAmpY:.010,gazeMin:2500,gazeMax:5200,headFollowX:1.00,headFollowY:.68,headPitch:-.006,headRoll:.008,sway:.78,breath:1.04,micro:['microLook','postureReset'],microMin:8000,microMax:14500}
};
const ATTENTION={user:{x:0,y:.002},content:{x:0,y:-.014},book:{x:-.006,y:-.017},board:{x:.006,y:.004},left:{x:-.022,y:.002},right:{x:.022,y:.002},up:{x:0,y:.014},down:{x:0,y:-.018},window:{x:.024,y:.008},trophy:{x:.012,y:.006}};
const LEARNING_PAGES=new Set(['lessons','lesson-detail','chapters','periodic','thpt']);
let currentPage='';
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
function capture(c){const p=c.parts||{};return {root:nodeState(c.root),head:nodeState(p.head),leftArm:nodeState(p.leftArm),rightArm:nodeState(p.rightArm),legL:nodeState(p.legL),legR:nodeState(p.legR),kneeL:nodeState(p.kneeL),kneeR:nodeState(p.kneeR),body:nodeState(p.body),chest:nodeState(p.chest),eyes:(p.eyes||[]).map(nodeState),gaze:(p.gaze||[]).map(nodeState)}}
function applySnapshot(c,s){if(!c||!s)return;const p=c.parts||{};setNode(c.root,s.root);setNode(p.head,s.head);setNode(p.leftArm,s.leftArm);setNode(p.rightArm,s.rightArm);setNode(p.legL,s.legL);setNode(p.legR,s.legR);setNode(p.kneeL,s.kneeL);setNode(p.kneeR,s.kneeR);setNode(p.body,s.body);setNode(p.chest,s.chest);(p.eyes||[]).forEach((n,i)=>setNode(n,s.eyes?.[i]));(p.gaze||[]).forEach((n,i)=>setNode(n,s.gaze?.[i]))}
function mixSnapshot(a,b,t){return {root:mix(a.root,b.root,t),head:mix(a.head,b.head,t),leftArm:mix(a.leftArm,b.leftArm,t),rightArm:mix(a.rightArm,b.rightArm,t),legL:mix(a.legL,b.legL,t),legR:mix(a.legR,b.legR,t),kneeL:mix(a.kneeL,b.kneeL,t),kneeR:mix(a.kneeR,b.kneeR,t),body:mix(a.body,b.body,t),chest:mix(a.chest,b.chest,t),eyes:(a.eyes||[]).map((x,i)=>mix(x,b.eyes?.[i],t)),gaze:(a.gaze||[]).map((x,i)=>mix(x,b.gaze?.[i],t))}}
function currentBase(c,ms){
  const tr=c.poseTransition;if(!tr)return c.base;
  const p=clamp((ms-tr.start)/(tr.until-tr.start||1));const t=smooth(p);const base=mixSnapshot(tr.from,tr.to,t);
  if(p>=1){c.base=tr.to;c.poseTransition=null;return c.base}
  return base;
}
function mergeRoot(base,patch={}){
  if(!base)return base;const out={...base};
  for(const k of ['px','py','pz','rx','ry','rz','sx','sy','sz'])if(Number.isFinite(patch[k]))out[k]=Number(patch[k]);
  return out;
}
function currentPresenceRoot(c,baseRoot,ms){
  const tr=c.rootTransition;if(!tr)return baseRoot;
  const p=clamp((ms-tr.start)/(tr.until-tr.start||1)),t=smooth(p),root=mix(tr.from,tr.to,t);
  if(p>=1){
    c.base.root=mergeRoot(c.base.root,tr.to);
    if(c.poseTransition){c.poseTransition.from.root=mergeRoot(c.poseTransition.from.root,tr.to);c.poseTransition.to.root=mergeRoot(c.poseTransition.to.root,tr.to)}
    c.rootTransition=null;return c.base.root;
  }
  return root;
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
function validBehavior(name){return BEHAVIORS[name]?name:'idle'}
function pageBehavior(page=''){
  page=String(page||'');
  if(page==='room')return 'room';
  if(page==='avatar')return 'studio';
  if(LEARNING_PAGES.has(page))return 'study';
  return 'idle';
}
function scheduleMicro(c,ms,profile){c.nextMicro=ms+rand(profile.microMin||9000,profile.microMax||16000)}
function profileFor(c,ms){
  if(c.behaviorUntil&&ms>=c.behaviorUntil){c.behavior=c.baseBehavior||'idle';c.behaviorUntil=0;c.behaviorReason='auto-return';scheduleMicro(c,ms,BEHAVIORS[c.behavior]||BEHAVIORS.idle)}
  return BEHAVIORS[validBehavior(c.behavior)]||BEHAVIORS.idle;
}
function attentionPoint(target){
  if(target&&typeof target==='object')return {x:clamp(Number(target.x)||0,-.04,.04),y:clamp(Number(target.y)||0,-.03,.03)};
  return ATTENTION[String(target||'user')]||ATTENTION.user;
}
function lookAt(target='user',options={}){
  const context=options.context||'all',duration=Math.max(0,Number(options.duration??1100)),pt=attentionPoint(target),ms=now();
  for(const c of targetControllers(context)){c.attention={x:pt.x,y:pt.y,until:duration?ms+duration:0,name:typeof target==='string'?target:'custom'};c.gazeTargetX=pt.x;c.gazeTargetY=pt.y;c.nextGaze=ms+Math.max(450,duration||900)}
  return true;
}
function clearAttention(context='all'){for(const c of targetControllers(context)){c.attention=null;c.nextGaze=0}return true}
function setBehavior(name='idle',options={}){
  name=validBehavior(name);const context=options.context||'all',duration=Math.max(0,Number(options.duration||0)),reason=String(options.reason||'api'),ms=now();let n=0;
  for(const c of targetControllers(context)){
    if(duration<=0){c.baseBehavior=name;c.behavior=name;c.behaviorUntil=0}else{c.behavior=name;c.behaviorUntil=ms+duration}
    c.behaviorReason=reason;c.nextGaze=0;scheduleMicro(c,ms,BEHAVIORS[name]);n++;
  }
  try{window.Math12Events?.emit?.('avatar:behavior-changed',{behavior:name,context,duration,reason,count:n,build:BUILD},{source:'avatar-motion'})}catch(_){}
  return n>0;
}
function restoreBehavior(context='all',reason='restore'){
  const ms=now();for(const c of targetControllers(context)){c.behavior=c.baseBehavior||'idle';c.behaviorUntil=0;c.behaviorReason=reason;c.attention=null;c.nextGaze=0;scheduleMicro(c,ms,BEHAVIORS[c.behavior]||BEHAVIORS.idle)}return true;
}
function markActivity(){const ms=now();for(const c of controllers.values()){c.lastActivity=ms;const p=BEHAVIORS[validBehavior(c.behavior)]||BEHAVIORS.idle;c.nextMicro=Math.max(c.nextMicro||0,ms+Math.min(6500,p.microMin||9000))}}
function maybeMicro(c,ms,profile){
  if(c.reduced||c.action||!profile.micro?.length||ms<(c.nextMicro||0)||ms-(c.lastActivity||0)<3200)return;
  const kind=profile.micro[Math.floor(Math.random()*profile.micro.length)],duration=kind==='microThink'?1250:kind==='microLook'?1050:900;
  c.action={kind,start:ms,until:ms+duration,dir:Math.random()<.5?-1:1,spontaneous:true};
  if(kind==='microLook'){c.gazeTargetX=clamp((profile.gazeX||0)+c.action.dir*.018,-.035,.035);c.gazeTargetY=clamp((profile.gazeY||0)+rand(-.003,.006),-.024,.024);c.nextGaze=ms+duration+500}
  scheduleMicro(c,ms+duration,profile);
}
function actionOffsets(c,ms){
  const a=c.action;if(!a||ms>=a.until){if(a)c.action=null;return {kind:'idle',root:{},head:{},leftArm:{},rightArm:{},legL:{},legR:{},kneeL:{},kneeR:{}}}
  const p=clamp((ms-a.start)/(a.until-a.start||1)),s=Math.sin(Math.PI*p),pulse=Math.sin(Math.PI*p*2),rapid=Math.sin(Math.PI*p*6);
  const z={kind:a.kind,root:{},head:{},leftArm:{},rightArm:{},legL:{},legR:{},kneeL:{},kneeR:{}};
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
    case 'walk':
      z.root.py=Math.abs(rapid)*.012*s;z.root.ry=pulse*.010*s;z.leftArm.rx=rapid*.18*s;z.rightArm.rx=-rapid*.18*s;z.legL.rx=-rapid*.15*s;z.legR.rx=rapid*.15*s;z.head.rx=-Math.abs(rapid)*.010*s;break;
    case 'microLook':
      z.head.ry=(a.dir||1)*s*.040;z.head.rz=-(a.dir||1)*s*.010;break;
    case 'microNod':
      z.head.rx=Math.sin(Math.PI*p*2)*.022*(1-p*.18);z.root.py=s*.002;break;
    case 'microThink':
      z.head.ry=(a.dir||1)*s*.028;z.head.rz=-(a.dir||1)*s*.025;z.head.rx=s*.014;break;
    case 'postureReset':
      z.root.py=s*.005;z.head.rx=-s*.010;z.leftArm.rz=-s*.010;z.rightArm.rz=s*.010;break;
  }
  return z;
}
function addRot(node,b,off={}){if(!node||!b)return;node.rotation.x=b.rx+(off.rx||0);node.rotation.y=b.ry+(off.ry||0);node.rotation.z=b.rz+(off.rz||0)}
function tick(c){
  if(!c?.root||!c.parts)return;const ms=now(),t=ms/1000,base=currentBase(c,ms),slow=c.reduced,p=c.parts,profile=profileFor(c,ms);
  maybeMicro(c,ms,profile);const off=actionOffsets(c,ms);
  let att=c.attention;if(att?.until&&ms>=att.until){c.attention=null;att=null;c.nextGaze=0}
  if(att){c.gazeTargetX=att.x;c.gazeTargetY=att.y}
  else if(ms>=c.nextGaze){c.gazeTargetX=clamp((profile.gazeX||0)+rand(-(profile.gazeAmpX||0),(profile.gazeAmpX||0)),-.035,.035);c.gazeTargetY=clamp((profile.gazeY||0)+rand(-(profile.gazeAmpY||0),(profile.gazeAmpY||0)),-.024,.024);c.nextGaze=ms+rand(profile.gazeMin||2600,profile.gazeMax||5200)}
  c.gazeX+=(c.gazeTargetX-c.gazeX)*(slow?.04:.072);c.gazeY+=(c.gazeTargetY-c.gazeY)*(slow?.04:.072);
  const blink=blinkAmount(ms,c),breath=(slow?0:Math.sin(t*1.68))*(profile.breath??1),sway=(slow?0:Math.sin(t*.46))*(profile.sway??1),weight=(slow?0:Math.sin(t*.31))*(profile.sway??1);
  const rb=currentPresenceRoot(c,base.root,ms);if(rb){c.root.position.x=rb.px+weight*.003;c.root.position.y=rb.py+breath*.014+(off.root.py||0);c.root.position.z=rb.pz;c.root.rotation.x=rb.rx;c.root.rotation.y=rb.ry+sway*.011+(off.root.ry||0);c.root.rotation.z=rb.rz+weight*.003;const sc=off.root.scale||0;c.root.scaling.set(rb.sx*(1+sc),rb.sy*(1+sc),rb.sz*(1+sc))}
  if(p.head&&base.head){const b=base.head;addRot(p.head,b,{rx:(slow?0:Math.sin(t*.37)*.006)+(profile.headPitch||0)-c.gazeY*(profile.headFollowY??.6)+(off.head.rx||0),ry:(slow?0:Math.sin(t*.42)*.018)+c.gazeX*(profile.headFollowX??.8)+(off.head.ry||0),rz:(slow?0:Math.sin(t*.67)*.012)+(profile.headRoll||0)+(off.head.rz||0)})}
  for(const [i,eye] of (p.eyes||[]).entries()){const b=base.eyes?.[i];if(!b)continue;eye.scaling.y=b.sy*(1-.90*blink);eye.scaling.x=b.sx*(1+.015*blink);eye.scaling.z=b.sz}
  for(const [i,gaze] of (p.gaze||[]).entries()){const b=base.gaze?.[i];if(!b)continue;gaze.position.x=b.px+c.gazeX;gaze.position.y=b.py+c.gazeY;gaze.position.z=b.pz}
  if(p.body&&base.body){const b=base.body;p.body.scaling.x=b.sx*(1-breath*.0018);p.body.scaling.y=b.sy*(1+breath*.0055);p.body.scaling.z=b.sz}
  if(p.chest&&base.chest){const b=base.chest;p.chest.scaling.x=b.sx*(1+breath*.003);p.chest.scaling.y=b.sy*(1+breath*.007);p.chest.scaling.z=b.sz}
  if(p.leftArm&&base.leftArm){addRot(p.leftArm,base.leftArm,{rx:off.leftArm.rx||0,ry:off.leftArm.ry||0,rz:(slow?0:Math.sin(t*1.31)*.018*(profile.sway??1))+(off.leftArm.rz||0)})}
  if(p.rightArm&&base.rightArm){addRot(p.rightArm,base.rightArm,{rx:off.rightArm.rx||0,ry:off.rightArm.ry||0,rz:-(slow?0:Math.sin(t*1.31)*.018*(profile.sway??1))+(off.rightArm.rz||0)})}
  if(p.legL&&base.legL)addRot(p.legL,base.legL,{rx:off.legL.rx||0,rz:off.legL.rz||0});
  if(p.legR&&base.legR)addRot(p.legR,base.legR,{rx:off.legR.rx||0,rz:off.legR.rz||0});
  if(p.kneeL&&base.kneeL)addRot(p.kneeL,base.kneeL,{rx:off.kneeL?.rx||0,rz:off.kneeL?.rz||0});
  if(p.kneeR&&base.kneeR)addRot(p.kneeR,base.kneeR,{rx:off.kneeR?.rx||0,rz:off.kneeR?.rz||0});
}
function detach(context='all'){
  const names=context==='all'?[...controllers.keys()]:[String(context)];
  for(const name of names){const c=controllers.get(name);if(!c)continue;try{if(c.scene&&c.observer)c.scene.onBeforeRenderObservable.remove(c.observer)}catch(_){}try{resetToBase(c)}catch(_){}controllers.delete(name)}
}
function attach(context='studio',detail={}){
  context=String(context||'studio');const adapter=window.AvatarRendererBridge?.get?.(context);const scene=detail.scene||adapter?.getScene?.()||(context==='studio'?window.v384Avatar3D?.getScene?.():null);const root=detail.root||adapter?.getRoot?.()||(context==='studio'?window.v384Avatar3D?.getRoot?.():null);const parts=detail.parts||adapter?.getParts?.()||(context==='studio'?window.v384Avatar3D?.getParts?.():null);
  if(!scene||!root||!parts)return false;const old=controllers.get(context);if(old?.scene===scene&&old?.root===root)return true;if(old)detach(context);
  const ms=now(),initial=(context==='room'?(currentPage==='room'?'room':'idle'):pageBehavior(currentPage||window.Math12AvatarRuntime?.currentPage||'')),c={context,scene,root,parts,observer:null,reduced:reduced(),pose:'stand',action:null,poseTransition:null,rootTransition:null,nextBlink:ms+rand(1500,3900),blinkStart:0,doubleBlink:false,nextGaze:ms+rand(1100,2800),gazeX:0,gazeY:0,gazeTargetX:0,gazeTargetY:0,baseBehavior:initial,behavior:initial,behaviorUntil:0,behaviorReason:'attach',attention:null,lastActivity:ms,nextMicro:ms+rand((BEHAVIORS[initial]?.microMin||8500),(BEHAVIORS[initial]?.microMax||15000))};
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
  kind=normalizeAction(kind);const times={equip:850,preview:680,nod:900,headTilt:1200,wave:1450,think:1650,smallCelebrate:1350,bigCelebrate:1850,walk:900};const context=options?.context||'all',ms=now(),until=ms+(duration||times[kind]||1200);
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

function moveRoot(transform={},options={}){
  const context=options.context||'all',duration=Math.max(0,Number(options.duration??820)),targets=targetControllers(context),ms=now();let changed=0;
  for(const c of targets){
    const live=nodeState(c.root);if(!live)continue;
    const to=mergeRoot(live,{px:transform.x,py:transform.y,pz:transform.z,rx:transform.rotationX,ry:transform.rotationY,rz:transform.rotationZ,sx:transform.scaleX,sy:transform.scaleY,sz:transform.scaleZ});
    if(Number.isFinite(transform.scale)){to.sx=to.sy=to.sz=Number(transform.scale)}
    if(c.reduced||duration<=0){c.rootTransition=null;c.base.root=mergeRoot(c.base.root,to);if(c.poseTransition){c.poseTransition.from.root=mergeRoot(c.poseTransition.from.root,to);c.poseTransition.to.root=mergeRoot(c.poseTransition.to.root,to)}setNode(c.root,to)}
    else c.rootTransition={from:live,to,start:ms,until:ms+duration};
    changed++;
  }
  try{window.Math12Events?.emit?.('avatar:root-transition',{context,count:changed,transform:{...transform},duration,build:BUILD},{source:'avatar-motion'})}catch(_){}
  return changed>0;
}
function getRootTransform(context='room'){
  const c=controllers.get(String(context));if(!c?.root)return null;const s=nodeState(c.root);return s?{x:s.px,y:s.py,z:s.pz,rotationX:s.rx,rotationY:s.ry,rotationZ:s.rz,scaleX:s.sx,scaleY:s.sy,scaleZ:s.sz}:null;
}

function onPageChanged(d={}){currentPage=String(d.page||window.Math12AvatarRuntime?.currentPage||'');setBehavior(pageBehavior(currentPage),{reason:`page:${currentPage||'unknown'}`});if(currentPage==='room')setBehavior('room',{context:'room',reason:'room-page'});markActivity()}
function onEmotion(d={}){
  const emotion=String(d.emotion||'neutral'),duration=Math.max(0,Number(d.duration||0)),map={focus:'focus',thinking:'thinking',disappointed:'recovery',happy:'success',confident:'success',proud:'success'};
  if(emotion==='neutral'){restoreBehavior('all','emotion-neutral');return}
  const behavior=map[emotion]||'idle';setBehavior(behavior,{duration:Math.min(3200,duration||1800),reason:`emotion:${emotion}`});
  if(['happy','confident','proud'].includes(emotion))lookAt('user',{duration:Math.min(1800,duration||1200)});else if(emotion==='thinking')lookAt('right',{duration:Math.min(1500,duration||1100)});else lookAt('content',{duration:Math.min(1800,duration||1200)});
}
function onRoomPresence(d={}){const location=String(d.location||'study'),map={study:'study',window:'window',relax:'relax'};setBehavior(map[location]||'room',{context:'room',reason:`room:${location}`});lookAt(location==='window'?'window':location==='study'?'book':'user',{context:'room',duration:location==='study'?1800:1300})}
function onRoomInteraction(d={}){const kind=String(d.kind||''),map={notebook:['focus','book'],bookshelf:['thinking','left'],trophy:['success','trophy'],board:['focus','board'],avatar:['room','user'],window:['window','window'],chair:['relax','user']},x=map[kind]||['room','user'];setBehavior(x[0],{context:'room',duration:kind==='trophy'?1800:1500,reason:`room-interaction:${kind}`});lookAt(x[1],{context:'room',duration:1400})}
function onLearningStart(){setBehavior('study',{reason:'learning-session'});lookAt('content',{duration:1600});markActivity()}
function onQuestionViewed(){setBehavior('focus',{duration:900,reason:'question-view'});lookAt('content',{duration:850});markActivity()}
function onAnswerInput(){setBehavior('focus',{duration:650,reason:'answer-input'});play('microNod',460,{context:'all'});lookAt('content',{duration:700});markActivity()}
function onLearningEnd(){setBehavior(pageBehavior(currentPage),{reason:'learning-end'});lookAt('user',{duration:900});markActivity()}
function onState(e){const d=e?.detail||{},visual=(d.changed||[]).some(x=>['gender','skin','face','faceShape','eyeStyle','browStyle','mouthStyle','irisColor','hair','hairColor','outfit','top','bottom','shoes','head','glasses','back','hand','accessory','pet','aura','background'].includes(x));if(d.source==='preview'||d.source==='preview-clear')play('preview');else if(visual)play('equip');setTimeout(syncContexts,80)}
function install(){
  currentPage=String(window.Math12AvatarRuntime?.currentPage||document.querySelector('.section.active[id^="page-"]')?.id?.replace(/^page-/,'')||'');
  window.addEventListener('math12hub:avatar3d-ready',e=>attach('studio',e.detail||{}));window.addEventListener('math12hub:avatar-state-changed',onState);window.addEventListener('math12hub:avatar-runtime-ready',e=>{currentPage=String(e.detail?.page||currentPage);setTimeout(syncContexts,20)});window.addEventListener('math12hub:avatar-renderer-mounted',e=>setTimeout(()=>attachContext(e.detail?.context||e.detail?.name),0));
  if(window.Math12Events){
    window.Math12Events.on('renderer:registered',d=>setTimeout(()=>attachContext(d?.name),0));
    window.Math12Events.on('page:changed',d=>{onPageChanged(d);setTimeout(syncContexts,80)});
    window.Math12Events.on('avatar:emotion-changed',onEmotion);
    window.Math12Events.on('room:presence-arrived',onRoomPresence);
    window.Math12Events.on('room:interaction-opened',onRoomInteraction);
    window.Math12Events.on('learning:session-started',onLearningStart);
    window.Math12Events.on('learning:question-viewed',onQuestionViewed);
    window.Math12Events.on('learning:answer-input',onAnswerInput);
    window.Math12Events.on('learning:session-ended',onLearningEnd);
  }
  window.addEventListener('resize',()=>{for(const c of controllers.values())c.reduced=reduced()});
  document.addEventListener('pointerdown',markActivity,{passive:true});document.addEventListener('keydown',markActivity,{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden){markActivity();setTimeout(syncContexts,40)}});
  let tries=0;const timer=setInterval(()=>{tries++;syncContexts();if(tries>=20)clearInterval(timer)},250);setTimeout(()=>{syncContexts();setBehavior(pageBehavior(currentPage),{reason:'initial-page'})},60);
  document.documentElement.dataset.avatarPersonalityBuild=BUILD;document.documentElement.dataset.avatarMicroBehavior='context-aware-v1';
}
window.AvatarMotion={build:BUILD,version:VERSION,managed:true,personality:true,behaviors:Object.keys(BEHAVIORS),attach:(detail={})=>attach('studio',detail),attachContext,detach,detachContext:detach,syncContexts,hasContext:name=>controllers.has(String(name)),contexts:()=>[...controllers.keys()],play,setPose,moveRoot,getRootTransform,setBehavior,restoreBehavior,lookAt,clearAttention,markActivity,nod:(o={})=>play('nod',null,o),headTilt:(o={})=>play('headTilt',null,o),wave:(o={})=>play('wave',null,o),think:(o={})=>play('think',null,o),smallCelebrate:(o={})=>play('smallCelebrate',null,o),celebrate:(o={})=>play('bigCelebrate',null,o),bigCelebrate:(o={})=>play('bigCelebrate',null,o),reactEquip:()=>play('equip'),status:()=>({build:BUILD,version:VERSION,reduced:reduced(),page:currentPage,contexts:[...controllers.entries()].map(([name,c])=>({name,pose:c.pose,action:c.action?.kind||'idle',behavior:c.behavior,baseBehavior:c.baseBehavior,attention:c.attention?.name||'',moving:!!c.rootTransition,mounted:!!c.root}))})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
