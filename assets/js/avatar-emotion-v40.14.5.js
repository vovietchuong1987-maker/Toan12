/* =========================================================
   Math12 Hub — Avatar Emotion Engine + Expressive Face Polish v40.15.5
   - Context-aware facial expressions for learning feedback.
   - Works across Studio + Math Room through AvatarRendererBridge.
   - Local/session only: emotions do not alter the saved avatar identity.
   - Keeps reactions supportive and restrained for Grade 12 learners.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.15.5-avatar-expressive-face-polish',VERSION=40155;
const STORE_KEY='math12hub-avatar-emotion-v40155';
const baseByParts=new WeakMap();
let current='neutral',currentUntil=0,resetTimer=0,lastReactionAt=0,lastMastered=null,installed=false;

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches||!!window.Math12Platform?.perf?.lowPower?.()}catch(_){return false}};
const now=()=>Date.now();
const copy=x=>{try{return JSON.parse(JSON.stringify(x))}catch(_){return x}};
const safeNum=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;

const EXPRESSIONS={
  neutral:{
    brow:[{rz:0,dy:0},{rz:0,dy:0}],
    mouth:{sx:1,sy:1,dy:0,rz:0},
    lid:{dy:0,rz:[0,0]},iris:{sx:1,sy:1,dy:0},
    cheek:{sx:1,sy:1,dy:0},lower:{dy:0,sy:1,rz:[0,0]}
  },
  focus:{
    brow:[{rz:.055,dy:-.006},{rz:-.055,dy:-.006}],
    mouth:{sx:.97,sy:.55,dy:.002,rz:0},
    lid:{dy:-.004,rz:[.014,-.014]},iris:{sx:.985,sy:.985,dy:-.003},
    cheek:{sx:.96,sy:.90,dy:.002},lower:{dy:.001,sy:.94,rz:[.006,-.006]}
  },
  happy:{
    brow:[{rz:-.020,dy:.004},{rz:.020,dy:.004}],
    mouth:{sx:1.08,sy:1.16,dy:-.004,rz:0},
    lid:{dy:-.008,rz:[-.010,.010]},iris:{sx:1.01,sy:.99,dy:.001},
    cheek:{sx:1.08,sy:1.05,dy:-.003},lower:{dy:.006,sy:1.03,rz:[-.004,.004]}
  },
  confident:{
    brow:[{rz:.028,dy:.004},{rz:-.010,dy:0}],
    mouth:{sx:1.06,sy:.96,dy:-.002,rz:-.014},
    lid:{dy:-.004,rz:[.004,-.004]},iris:{sx:1,sy:1,dy:-.002},
    cheek:{sx:1.04,sy:1.01,dy:-.001},lower:{dy:.003,sy:1,rz:[0,0]}
  },
  thinking:{
    brow:[{rz:-.070,dy:.010},{rz:.040,dy:-.002}],
    mouth:{sx:.94,sy:.62,dy:.005,rz:.018},
    lid:{dy:.001,rz:[-.010,.014]},iris:{sx:.985,sy:1.015,dy:.003},
    cheek:{sx:.98,sy:.94,dy:.001},lower:{dy:-.001,sy:.96,rz:[-.004,.006]}
  },
  disappointed:{
    brow:[{rz:-.080,dy:-.002},{rz:.080,dy:-.002}],
    mouth:{sx:.96,sy:.60,dy:.007,rz:0},
    lid:{dy:.005,rz:[-.012,.012]},iris:{sx:.98,sy:.98,dy:.004},
    cheek:{sx:.96,sy:.91,dy:.003},lower:{dy:.001,sy:.94,rz:[-.006,.006]}
  },
  proud:{
    brow:[{rz:-.025,dy:.006},{rz:.025,dy:.006}],
    mouth:{sx:1.10,sy:1.18,dy:-.005,rz:-.009},
    lid:{dy:-.010,rz:[-.008,.008]},iris:{sx:1.015,sy:.98,dy:-.002},
    cheek:{sx:1.11,sy:1.07,dy:-.004},lower:{dy:.007,sy:1.04,rz:[-.004,.004]}
  }
};

const META={
  neutral:{label:'Bình tĩnh',title:'Sẵn sàng',message:'Giữ nhịp học ổn định.'},
  focus:{label:'Tập trung',title:'Tập trung lại',message:'Ưu tiên từng bước chắc chắn trước khi tăng tốc.'},
  happy:{label:'Vui',title:'Đang có đà tốt',message:'Nhịp làm bài đang tích cực. Tiếp tục giữ cách làm này.'},
  confident:{label:'Tự tin',title:'Nhịp làm bài rất tốt',message:'Độ chính xác tốt và chuỗi câu đúng đang ổn định.'},
  thinking:{label:'Suy nghĩ',title:'Cần thêm một nhịp phân tích',message:'Xem lại dữ kiện, công thức và bước biến đổi quan trọng.'},
  disappointed:{label:'Hơi hụt nhịp',title:'Chậm lại một chút',message:'Sai liên tiếp không cần làm nhanh hơn; nên quay lại bước đầu và kiểm tra từng điều kiện.'},
  proud:{label:'Tự hào',title:'Một cột mốc mới',message:'Kết quả này xứng đáng được ghi nhận. Tiếp tục giữ chất lượng thay vì chỉ tăng tốc.'}
};

function nodeState(n){return n?{px:n.position?.x||0,py:n.position?.y||0,pz:n.position?.z||0,rx:n.rotation?.x||0,ry:n.rotation?.y||0,rz:n.rotation?.z||0,sx:n.scaling?.x||1,sy:n.scaling?.y||1,sz:n.scaling?.z||1}:null}
function capture(parts){
  if(!parts||typeof parts!=='object')return null;
  let b=baseByParts.get(parts);if(b)return b;
  b={
    eyebrows:(parts.eyebrows||[]).map(nodeState),
    mouth:nodeState(parts.mouth),
    eyelids:(parts.eyelids||[]).map(nodeState),
    irises:(parts.irises||[]).map(nodeState),
    cheeks:(parts.cheeks||[]).map(nodeState),
    lowerLids:(parts.lowerLids||[]).map(nodeState)
  };
  baseByParts.set(parts,b);return b;
}
function tweenNode(node,from,to,t){
  if(!node||!from||!to)return;
  if(node.position){node.position.x=from.px+(to.px-from.px)*t;node.position.y=from.py+(to.py-from.py)*t;node.position.z=from.pz+(to.pz-from.pz)*t}
  if(node.rotation){node.rotation.x=from.rx+(to.rx-from.rx)*t;node.rotation.y=from.ry+(to.ry-from.ry)*t;node.rotation.z=from.rz+(to.rz-from.rz)*t}
  if(node.scaling){node.scaling.x=from.sx+(to.sx-from.sx)*t;node.scaling.y=from.sy+(to.sy-from.sy)*t;node.scaling.z=from.sz+(to.sz-from.sz)*t}
}
function easeOutCubic(t){return 1-Math.pow(1-clamp(t),3)}
function targetState(base,mods={}){return {...base,px:base.px+(mods.dx||0),py:base.py+(mods.dy||0),pz:base.pz+(mods.dz||0),rx:base.rx+(mods.rx||0),ry:base.ry+(mods.ry||0),rz:base.rz+(mods.rz||0),sx:base.sx*(mods.sx??1),sy:base.sy*(mods.sy??1),sz:base.sz*(mods.sz??1)}}

function applyToParts(parts,emotion='neutral',{animate=true}={}){
  const b=capture(parts);if(!b)return false;
  const e=EXPRESSIONS[emotion]||EXPRESSIONS.neutral;
  const nodes=[];
  (parts.eyebrows||[]).forEach((n,i)=>{
    const base=b.eyebrows[i],mod=e.brow?.[i]||{};
    if(base)nodes.push([n,nodeState(n),targetState(base,{dy:mod.dy||0,rz:mod.rz||0})]);
  });
  if(parts.mouth&&b.mouth)nodes.push([parts.mouth,nodeState(parts.mouth),targetState(b.mouth,e.mouth)]);
  (parts.eyelids||[]).forEach((n,i)=>{const base=b.eyelids[i];if(base)nodes.push([n,nodeState(n),targetState(base,{dy:e.lid.dy||0,rz:e.lid.rz?.[i]||0})])});
  (parts.irises||[]).forEach((n,i)=>{const base=b.irises[i];if(base)nodes.push([n,nodeState(n),targetState(base,e.iris)]);
  });
  (parts.cheeks||[]).forEach((n,i)=>{const base=b.cheeks[i];if(base)nodes.push([n,nodeState(n),targetState(base,e.cheek||{})])});
  (parts.lowerLids||[]).forEach((n,i)=>{
    const base=b.lowerLids[i];if(base)nodes.push([n,nodeState(n),targetState(base,{dy:e.lower?.dy||0,sy:e.lower?.sy??1,rz:e.lower?.rz?.[i]||0})]);
  });
  const duration=(reduced()||animate===false)?0:260,start=performance.now();
  if(!duration){nodes.forEach(([n,,to])=>tweenNode(n,to,to,1));return true}
  const token=Symbol('emotion');parts.__v40155EmotionToken=token;
  const step=ts=>{if(parts.__v40155EmotionToken!==token)return;const t=easeOutCubic((ts-start)/duration);nodes.forEach(([n,from,to])=>tweenNode(n,from,to,t));if(t<1)requestAnimationFrame(step)};
  requestAnimationFrame(step);return true;
}

function rendererParts(){
  const out=[];const bridge=window.AvatarRendererBridge;
  if(bridge?.contexts&&bridge?.get){for(const name of bridge.contexts()){try{const a=bridge.get(name);if(a?.isMounted?.()){const p=a.getParts?.();if(p)out.push({name,parts:p,adapter:a})}}catch(_){}}}
  const studio=window.v384Avatar3D?.getParts?.();if(studio&&!out.some(x=>x.parts===studio))out.push({name:'studio-direct',parts:studio});
  const room=window.v390Room?.getAvatarParts?.();if(room&&!out.some(x=>x.parts===room))out.push({name:'room-direct',parts:room});
  return out;
}
function applyAll(emotion=current,opts={}){
  let n=0;for(const item of rendererParts()){try{if(item.adapter?.setExpression)item.adapter.setExpression(emotion,opts);else if(applyToParts(item.parts,emotion,opts))n++}catch(err){console.warn('[AvatarEmotion]',item.name,err)}}return n;
}
function dispatch(emotion,detail={}){
  const payload={emotion,meta:META[emotion]||META.neutral,at:now(),build:BUILD,...detail};
  try{window.Math12Events?.emit?.('avatar:emotion-changed',payload,{source:'avatar-emotion'})}catch(_){ }
  try{window.dispatchEvent(new CustomEvent('math12hub:avatar-emotion-changed',{detail:payload}))}catch(_){ }
  return payload;
}
function persistSession(emotion,until){try{sessionStorage.setItem(STORE_KEY,JSON.stringify({emotion,until}))}catch(_){}}
function set(emotion='neutral',{duration=2200,reason='manual',message='',silent=false,animate=true}={}){
  emotion=EXPRESSIONS[emotion]?emotion:'neutral';clearTimeout(resetTimer);current=emotion;currentUntil=duration>0?now()+duration:0;persistSession(current,currentUntil);applyAll(current,{animate});
  const payload=dispatch(current,{reason,message:message||META[current]?.message||'',duration});
  if(!silent&&emotion!=='neutral')showReaction(payload);
  if(duration>0){resetTimer=setTimeout(()=>{current='neutral';currentUntil=0;persistSession('neutral',0);applyAll('neutral',{animate:true});dispatch('neutral',{reason:'auto-reset',duration:0})},duration)}
  return payload;
}

function attemptMetrics(attempt={}){
  const rows=Array.isArray(attempt.questionResults)?attempt.questionResults:[];let longestCorrect=0,longestWrong=0,curC=0,curW=0,correct=0;
  for(const r of rows){const ok=!!r.correct;if(ok){correct++;curC++;curW=0;longestCorrect=Math.max(longestCorrect,curC)}else{curW++;curC=0;longestWrong=Math.max(longestWrong,curW)}}
  const total=rows.length||safeNum(attempt.total,0),score=safeNum(attempt.score,0),ratio=total?correct/total:score/10;
  return {total,correct,ratio,score,longestCorrect,longestWrong,endingCorrect:curC,endingWrong:curW};
}
function masteredCount(){
  try{const s=window.v363MasteryEngine?.masterySummary?.();if(Number.isFinite(Number(s?.counts?.mastered)))return Number(s.counts.mastered)}catch(_){ }
  try{return Object.values(window.state?.mastered||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0)}catch(_){return 0}
}
function chooseReaction(detail={}){
  const attempt=detail.attempt||{},reward=detail.reward||{},m=attemptMetrics(attempt),mastered=masteredCount(),delta=lastMastered==null?0:Math.max(0,mastered-lastMastered);lastMastered=mastered;
  if(reward.levelUp)return {emotion:'proud',duration:3000,motion:'bigCelebrate',reason:'level-up',message:`Đã lên Level ${reward.newLevel||''}. Một cột mốc tiến bộ mới.`.trim(),metrics:m,masteryDelta:delta};
  if(delta>0)return {emotion:'proud',duration:2900,motion:'bigCelebrate',reason:'mastery-unlocked',message:`Đã làm chủ thêm ${delta} mã kiến thức.`,metrics:m,masteryDelta:delta};
  if(m.score>=9.5||m.ratio>=.94)return {emotion:'proud',duration:2700,motion:'bigCelebrate',reason:'excellent-result',message:'Độ chính xác rất cao. Hãy giữ chất lượng này ở các câu khó hơn.',metrics:m,masteryDelta:delta};
  if(m.longestCorrect>=4||m.score>=8.5)return {emotion:'confident',duration:2300,motion:'smallCelebrate',reason:'strong-streak',message:m.longestCorrect>=4?`Có chuỗi ${m.longestCorrect} câu đúng liên tiếp.`:'Kết quả đang ở mức rất tốt.',metrics:m,masteryDelta:delta};
  if((m.endingWrong>=2||m.longestWrong>=3)&&m.score<6.5)return {emotion:'disappointed',duration:1050,next:'focus',nextDuration:1900,motion:'think',reason:'wrong-streak',message:'Có chuỗi câu chưa đúng. Nên chậm lại và kiểm tra từng điều kiện.',metrics:m,masteryDelta:delta};
  if(m.score<5.5)return {emotion:'thinking',duration:2100,motion:'think',reason:'needs-review',message:'Nên xem lại phần chữa bài và quay về đúng mã kiến thức còn yếu.',metrics:m,masteryDelta:delta};
  return {emotion:'happy',duration:2100,motion:'nod',reason:'positive-progress',message:'Đã hoàn thành một lượt học. Tiếp tục củng cố các câu chưa chắc.',metrics:m,masteryDelta:delta};
}
function playMotion(kind){if(!kind||reduced())return;try{window.AvatarMotion?.play?.(kind)}catch(_){}}
function react(detail={}){
  if(now()-lastReactionAt<500)return null;lastReactionAt=now();const r=chooseReaction(detail);playMotion(r.motion);const payload=set(r.emotion,{duration:r.duration,reason:r.reason,message:r.message});
  if(r.next)setTimeout(()=>set(r.next,{duration:r.nextDuration||1600,reason:`${r.reason}:recover`,message:META[r.next]?.message||'',silent:true}),r.duration);
  return {...r,payload};
}

function avatarMini(){
  try{const a=window.avatarV378Stored?.()||window.avatarV378Current?.();return window.avatarV378MiniHtml?.(a)||'<span class="v40145-emotion-fallback">◉</span>'}catch(_){return '<span class="v40145-emotion-fallback">◉</span>'}
}
function showReaction(payload){
  const card=document.querySelector('.exam-result-card');if(!card||document.querySelector('.v40145-emotion-card'))return false;
  const meta=payload.meta||META[payload.emotion]||META.neutral,box=document.createElement('div');box.className=`v40145-emotion-card mood-${payload.emotion}`;
  box.innerHTML=`<div class="v40145-emotion-avatar">${avatarMini()}</div><div class="v40145-emotion-copy"><small>AVATAR • ${String(meta.label||'').toUpperCase()}</small><b>${meta.title||'Phản hồi học tập'}</b><span>${payload.message||meta.message||''}</span></div>`;
  const anchor=card.querySelector('.exam-result-metrics')||card.firstElementChild;anchor?.insertAdjacentElement('afterend',box);return true;
}

function onGameReward(e){const d=e?.detail||{};if(d.levelUp||/achievement|mission|mastery/i.test(String(d.source||''))){playMotion('bigCelebrate');set('proud',{duration:2600,reason:'achievement',message:'Một thành tích mới vừa được mở khóa.'})}}
function attachEvents(){
  const handler=d=>react(d||{});
  if(window.Math12Events){window.Math12Events.on('learning:attempt-rewarded',handler);window.Math12Events.on('game:reward',d=>onGameReward({detail:d}));window.Math12Events.on('page:changed',()=>setTimeout(()=>applyAll(current,{animate:false}),90));window.Math12Events.on('account:hydrated',()=>{lastMastered=masteredCount();setTimeout(()=>applyAll(current,{animate:false}),100)})}
  else{window.addEventListener('math12hub:attempt-rewarded',e=>handler(e.detail));window.addEventListener('math12hub:game-reward',onGameReward)}
  window.addEventListener('math12hub:avatar3d-ready',()=>setTimeout(()=>applyAll(current,{animate:false}),20));
  window.addEventListener('math12hub:avatar-state-changed',()=>setTimeout(()=>applyAll(current,{animate:false}),80));
  window.addEventListener('math12hub:avatar-renderer-ready',()=>setTimeout(()=>applyAll(current,{animate:false}),40));
}
function restoreSession(){try{const x=JSON.parse(sessionStorage.getItem(STORE_KEY)||'null');if(x&&EXPRESSIONS[x.emotion]&&Number(x.until)>now()){current=x.emotion;currentUntil=Number(x.until);const left=currentUntil-now();resetTimer=setTimeout(()=>set('neutral',{duration:0,reason:'session-expired',silent:true}),left)}}catch(_){}}
function install(){if(installed)return;installed=true;restoreSession();lastMastered=masteredCount();attachEvents();setTimeout(()=>applyAll(current,{animate:false}),350);document.documentElement.dataset.avatarEmotionBuild=BUILD;document.documentElement.dataset.avatarFacePolish='expressive-face-v1'}

window.AvatarEmotion={build:BUILD,version:VERSION,managed:true,expressions:Object.keys(EXPRESSIONS),meta:META,set,react,applyToParts,applyAll,attemptMetrics,chooseReaction,status:()=>({build:BUILD,version:VERSION,current,until:currentUntil,renderers:rendererParts().map(x=>x.name),reduced:reduced()})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
