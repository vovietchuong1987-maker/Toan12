/* Math12 Hub v40.21.0 — Emotion & Learning Reactions */
(function(){
'use strict';
const BUILD='40.21.0-emotion-learning-reactions',VERSION=402100;
let current='neutral',until=0,timer=0,lastAt=0;
const safe=(fn,fallback=null)=>{try{const v=fn();return v==null?fallback:v}catch(_){return fallback}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
function attemptMetrics(attempt={}){
  const rows=Array.isArray(attempt.questionResults)?attempt.questionResults:[];
  let correct=0,run=0,bestRun=0,wrongRun=0,bestWrong=0;
  for(const r of rows){if(r?.correct){correct++;run++;wrongRun=0;bestRun=Math.max(bestRun,run)}else{wrongRun++;run=0;bestWrong=Math.max(bestWrong,wrongRun)}}
  const total=rows.length||Number(attempt.total)||0;
  const score=Number(attempt.score)||0;
  return {score,total,correct,ratio:total?correct/total:clamp(score/10,0,1),bestRun,bestWrong,endingWrong:wrongRun};
}
function choose(detail={}){
  const a=detail.attempt||{},r=detail.reward||{},m=attemptMetrics(a);
  if(r.levelUp)return {mood:'proud',kind:'level-up',message:`Lên Level ${r.newLevel||''}!`,duration:3000};
  if(m.score>=9.5||m.ratio>=.95)return {mood:'proud',kind:'excellent',message:'Kết quả rất tốt — giữ nhịp này ở các câu khó hơn.',duration:2600};
  if(m.bestRun>=4||m.score>=8)return {mood:'happy',kind:'streak',message:m.bestRun>=4?`Chuỗi ${m.bestRun} câu đúng liên tiếp!`:'Một lượt học rất tốt.',duration:2200};
  if(m.endingWrong>=2||m.bestWrong>=3)return {mood:'focus',kind:'recover',message:'Chậm lại một chút và kiểm tra từng điều kiện.',duration:2300};
  if(m.score>0&&m.score<5.5)return {mood:'thinking',kind:'review',message:'Nên xem lại phần chữa bài và mã kiến thức còn yếu.',duration:2300};
  return {mood:'happy',kind:'complete',message:'Đã hoàn thành một lượt học.',duration:1900};
}
function bubble(message,mood='happy',duration=2200){
  let box=document.getElementById('m12CharacterReactionBubble');
  if(!box){box=document.createElement('div');box.id='m12CharacterReactionBubble';box.className='m12reaction-bubble';document.body.appendChild(box)}
  const icon={happy:'✓',proud:'★',focus:'◎',thinking:'…',neutral:'·'}[mood]||'✓';
  box.className=`m12reaction-bubble mood-${mood} show`;
  box.innerHTML=`<span>${icon}</span><div><b>${mood==='proud'?'Tuyệt vời':mood==='focus'?'Tập trung':mood==='thinking'?'Suy nghĩ':'Tiến bộ tốt'}</b><small>${String(message||'').replace(/[<>]/g,'')}</small></div>`;
  clearTimeout(box.__hideTimer);box.__hideTimer=setTimeout(()=>box.classList.remove('show'),duration);
}
function paint(mood,duration=2200){
  document.documentElement.dataset.characterMood=mood;
  document.querySelectorAll('[data-character-presence],.avatar-topbar,.m12face-asset').forEach(el=>{el.classList.remove('mood-happy','mood-proud','mood-focus','mood-thinking');if(mood!=='neutral')el.classList.add(`mood-${mood}`)});
  clearTimeout(timer);until=Date.now()+duration;current=mood;
  timer=setTimeout(()=>{current='neutral';until=0;document.documentElement.dataset.characterMood='neutral';document.querySelectorAll('.mood-happy,.mood-proud,.mood-focus,.mood-thinking').forEach(el=>el.classList.remove('mood-happy','mood-proud','mood-focus','mood-thinking'))},duration);
}
function trigger(kind='complete',message='',duration=2200){
  const map={levelUp:'proud',excellent:'proud',achievement:'proud',arenaWin:'proud',correct:'happy',streak:'happy',complete:'happy',wrong:'focus',recover:'focus',focus:'focus',review:'thinking',thinking:'thinking'};
  const mood=map[kind]||'happy';
  paint(mood,duration);bubble(message||({proud:'Một cột mốc mới!',happy:'Tiếp tục phát huy!',focus:'Tập trung vào bước tiếp theo.',thinking:'Xem lại lời giải rồi thử lại.'}[mood]),mood,duration);
  try{window.AvatarEmotion?.set?.(mood==='focus'?'focus':mood==='thinking'?'thinking':mood==='proud'?'proud':'happy',{duration,reason:`character-platform:${kind}`,silent:true})}catch(_){}
  const payload={build:BUILD,kind,mood,message,duration,at:Date.now()};
  try{window.dispatchEvent(new CustomEvent('math12hub:character-reaction',{detail:payload}))}catch(_){}
  return payload;
}
function react(detail={}){if(Date.now()-lastAt<350)return null;lastAt=Date.now();const x=choose(detail);return trigger(x.kind,x.message,x.duration)}
function onReward(e){const d=e?.detail||{};if(d.levelUp)trigger('levelUp',`Đã lên Level ${d.newLevel||''}!`,3000);else if(/achievement|mastery|mission/i.test(String(d.source||'')))trigger('achievement','Một thành tích mới vừa được mở khóa.',2500)}
function install(){
  window.addEventListener('math12hub:attempt-rewarded',e=>react(e.detail||{}));
  window.addEventListener('math12hub:game-reward',onReward);
  window.addEventListener('math12hub:page-changed',()=>{if(current!=='neutral'&&Date.now()<until)paint(current,Math.max(300,until-Date.now()))});
  if(window.M12CharacterPlatform){window.M12CharacterPlatform.react=react;window.M12CharacterPlatform.triggerReaction=trigger}
  document.documentElement.dataset.characterReactions='v40.21.0';
}
window.M12CharacterReactions={build:BUILD,version:VERSION,attemptMetrics,choose,react,trigger,status:()=>({build:BUILD,current,until})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
