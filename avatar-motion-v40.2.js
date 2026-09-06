/* =========================================================
   Math12 Hub — Avatar Motion Director
   Step 7: natural idle, stochastic blink/gaze and contextual reactions.
   ========================================================= */
(function(){
'use strict';
const BUILD='avatar-step7-living-motion',VERSION=700;
let scene=null,root=null,parts=null,observer=null,motion=null;
let pending={kind:'idle',start:0,until:0};
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches||!!window.Math12Platform?.perf?.lowPower?.()}catch(_){return false}};
function baseNode(node){return node?{px:node.position?.x||0,py:node.position?.y||0,pz:node.position?.z||0,rx:node.rotation?.x||0,ry:node.rotation?.y||0,rz:node.rotation?.z||0,sx:node.scaling?.x||1,sy:node.scaling?.y||1,sz:node.scaling?.z||1}:null}
function resetNode(node,b){if(!node||!b)return;node.position?.set?.(b.px,b.py,b.pz);node.rotation?.set?.(b.rx,b.ry,b.rz);node.scaling?.set?.(b.sx,b.sy,b.sz)}
function detach(){
  try{if(scene&&observer)scene.onBeforeRenderObservable.remove(observer)}catch(_){ }
  if(motion){resetNode(root,motion.base.root);resetNode(parts?.head,motion.base.head);resetNode(parts?.leftArm,motion.base.leftArm);resetNode(parts?.rightArm,motion.base.rightArm);resetNode(parts?.body,motion.base.body);resetNode(parts?.chest,motion.base.chest)}
  scene=null;root=null;parts=null;observer=null;motion=null;
}
function blinkAmount(ms,s){
  if(ms<s.nextBlink)return 0;
  if(!s.blinkStart){s.blinkStart=ms;s.doubleBlink=Math.random()<.19}
  const t=ms-s.blinkStart,one=t<88?ease(t/88):t<168?1-ease((t-88)/80):0;
  const two=s.doubleBlink&&t>=225&&t<375?(t<292?ease((t-225)/67):1-ease((t-292)/83)):0;
  const end=s.doubleBlink?410:205;
  if(t>end){s.nextBlink=ms+rand(2700,5900);s.blinkStart=0;s.doubleBlink=false;return 0}
  return Math.max(one,two);
}
function actionPose(ms,s){
  const active=ms<pending.until,p=pending.until>pending.start?clamp((ms-pending.start)/(pending.until-pending.start)):1;
  if(!active)return {kind:'idle',turn:0,jump:0,scale:0,arm:0,head:0};
  if(pending.kind==='equip'||pending.kind==='preview')return {kind:pending.kind,turn:Math.sin(Math.PI*p)*(pending.kind==='preview'?.12:.24),jump:Math.sin(Math.PI*p)*.025,scale:Math.sin(Math.PI*p)*.025,arm:0,head:-Math.sin(Math.PI*p)*.035};
  if(pending.kind==='wave')return {kind:'wave',turn:-.08,jump:0,scale:0,arm:Math.sin(p*Math.PI*7)*.22,head:.04};
  if(pending.kind==='think')return {kind:'think',turn:.05,jump:0,scale:0,arm:.35,head:-.11};
  const hops=Math.abs(Math.sin(p*Math.PI*3));return {kind:'celebrate',turn:Math.sin(p*Math.PI*4)*.09,jump:hops*.15,scale:hops*.035,arm:1,head:Math.sin(p*Math.PI*4)*.04};
}
function tick(){
  if(!motion||!root||!parts)return;const ms=performance.now(),t=ms/1000,s=motion,slow=s.reduced,pose=actionPose(ms,s);
  if(ms>=s.nextGaze){s.gazeTargetX=rand(-.026,.026);s.gazeTargetY=rand(-.013,.014);s.nextGaze=ms+rand(2200,4800)}
  s.gazeX+=(s.gazeTargetX-s.gazeX)*(slow?.045:.075);s.gazeY+=(s.gazeTargetY-s.gazeY)*(slow?.045:.075);
  const blink=blinkAmount(ms,s),breath=slow?0:Math.sin(t*1.72),sway=slow?0:Math.sin(t*.48);
  const rb=s.base.root;root.position.y=rb.py+breath*.018+pose.jump;root.rotation.y=rb.ry+sway*.014+pose.turn;root.scaling.set(rb.sx*(1+pose.scale),rb.sy*(1+pose.scale),rb.sz*(1+pose.scale));
  if(parts.head&&s.base.head){const b=s.base.head;parts.head.rotation.z=b.rz+(slow?0:Math.sin(t*.69)*.015)+pose.head;parts.head.rotation.y=b.ry+(slow?0:Math.sin(t*.43)*.023)+pose.turn*.16;parts.head.rotation.x=b.rx+(slow?0:Math.sin(t*.36)*.007)}
  for(const [i,eye] of (parts.eyes||[]).entries()){const b=s.base.eyes[i];if(!b)continue;eye.scaling.y=b.sy*(1-.91*blink);eye.scaling.x=b.sx*(1+.018*blink)}
  for(const [i,gaze] of (parts.gaze||[]).entries()){const b=s.base.gaze[i];if(!b)continue;gaze.position.x=b.px+s.gazeX;gaze.position.y=b.py+s.gazeY}
  if(parts.body&&s.base.body){const b=s.base.body;parts.body.scaling.y=b.sy*(1+breath*.006);parts.body.scaling.x=b.sx*(1-breath*.002)}
  if(parts.chest&&s.base.chest){const b=s.base.chest;parts.chest.scaling.y=b.sy*(1+breath*.008);parts.chest.scaling.x=b.sx*(1+breath*.004)}
  if(parts.leftArm&&parts.rightArm&&s.base.leftArm&&s.base.rightArm){
    const l=s.base.leftArm,r=s.base.rightArm,idle=slow?0:Math.sin(t*1.37)*.022;
    parts.leftArm.rotation.z=pose.kind==='celebrate'?-2.02+Math.sin(t*9)*.10:pose.kind==='wave'?-1.72+pose.arm:pose.kind==='think'?-1.02:l.rz+idle;
    parts.rightArm.rotation.z=pose.kind==='celebrate'?2.02-Math.sin(t*9)*.10:r.rz-idle;
  }
}
function attach(detail={}){
  detach();scene=detail.scene||window.v384Avatar3D?.getScene?.();root=detail.root||window.v384Avatar3D?.getRoot?.();parts=detail.parts||window.v384Avatar3D?.getParts?.();
  if(!scene||!root||!parts)return false;const ms=performance.now();
  motion={reduced:reduced(),nextBlink:ms+rand(1600,3900),blinkStart:0,doubleBlink:false,nextGaze:ms+rand(1200,2800),gazeX:0,gazeY:0,gazeTargetX:0,gazeTargetY:0,
    base:{root:baseNode(root),head:baseNode(parts.head),leftArm:baseNode(parts.leftArm),rightArm:baseNode(parts.rightArm),body:baseNode(parts.body),chest:baseNode(parts.chest),eyes:(parts.eyes||[]).map(baseNode),gaze:(parts.gaze||[]).map(baseNode)}};
  observer=scene.onBeforeRenderObservable.add(tick);
  try{window.dispatchEvent(new CustomEvent('math12hub:avatar-motion-ready',{detail:{build:BUILD,reduced:motion.reduced}}))}catch(_){ }
  return true;
}
function sparkle(kind='equip'){
  const shell=document.querySelector('.v384-avatar3d-shell');if(!shell)return;shell.classList.remove('avatar-motion-react');void shell.offsetWidth;shell.classList.add('avatar-motion-react');
  let fx=shell.querySelector('.avatar-motion-sparkles');fx?.remove();fx=document.createElement('div');fx.className='avatar-motion-sparkles';
  for(let i=0;i<10;i++){const dot=document.createElement('i');dot.style.setProperty('--a',`${i*36}deg`);dot.style.setProperty('--d',`${42+i%3*11}px`);dot.style.setProperty('--delay',`${i*22}ms`);fx.appendChild(dot)}
  shell.appendChild(fx);setTimeout(()=>fx.remove(),900);const chip=shell.querySelector('.v392-quality-chip');if(chip)chip.textContent=kind==='preview'?'Đang xem thử':'Đã thay trang bị';
}
function play(kind='celebrate',duration){
  const ms=performance.now(),times={equip:920,preview:700,wave:1550,think:1800,celebrate:1900};pending={kind,start:ms,until:ms+(duration||times[kind]||1400)};
  if(kind==='equip'||kind==='preview')sparkle(kind);return {...pending};
}
function onState(e){const d=e?.detail||{},visual=(d.changed||[]).some(x=>['gender','skin','face','hair','hairColor','outfit','top','bottom','shoes','head','glasses','back','hand','accessory','pet','aura','background'].includes(x));if(d.source==='preview'||d.source==='preview-clear')play('preview');else if(visual)play('equip')}
function install(){window.addEventListener('math12hub:avatar3d-ready',e=>attach(e.detail));window.addEventListener('math12hub:avatar-state-changed',onState);window.addEventListener('math12hub:attempt-rewarded',e=>{if(Number(e.detail?.score||e.detail?.reward?.score||0)>=9.5)play('celebrate')});setTimeout(()=>attach({}),500)}
window.AvatarMotion={build:BUILD,version:VERSION,managed:true,attach,detach,play,celebrate:()=>play('celebrate'),wave:()=>play('wave'),think:()=>play('think'),reactEquip:()=>play('equip'),status:()=>motion?{active:true,reduced:motion.reduced,action:pending.kind}:{active:false}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
