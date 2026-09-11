/* =========================================================
   Math12 Hub v40.14.7 — Math Room Data Layer
   One read-only academic model for My Math Room.
   Sources: core learning state + Mastery + Economy + Achievements.
   No scoring changes. No Firebase schema migration.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.14.7-math-room-data-layer';
const SCHEMA=40147;
let cached=null,lastSignature='',timer=0,unsubs=[];
const nowIso=()=>new Date().toISOString();
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
function attemptRows(){return Array.isArray(window.state?.examAttempts)?window.state.examAttempts:(typeof state!=='undefined'&&Array.isArray(state?.examAttempts)?state.examAttempts:[])}
function doneRows(){return Array.isArray(window.state?.done)?window.state.done:(typeof state!=='undefined'&&Array.isArray(state?.done)?state.done:[])}
function currentStreak(){try{if(typeof learningStreakDays==='function')return Math.max(0,Number(learningStreakDays())||0)}catch(_){}return 0}
function masterySummary(){try{return window.v382Journey?.mastery?.()||window.v363MasteryEngine?.masterySummary?.()||{average:null,coverage:0,totalCodes:0,counts:{mastered:0},codes:[]}}catch(_){return {average:null,coverage:0,totalCodes:0,counts:{mastered:0},codes:[]}}}
function economyProfile(){try{return window.v379Economy?.profile?.()||{}}catch(_){return {}}}
function achievementProfile(){try{return window.v388Achievements?.profile?.()||{unlocked:{}}}catch(_){return {unlocked:{}}}}
function achievementDefs(){try{return Array.isArray(window.v388Achievements?.defs)?window.v388Achievements.defs:[]}catch(_){return []}}
function recentAchievement(){
  const p=achievementProfile(),defs=achievementDefs(),unlocked=p.unlocked&&typeof p.unlocked==='object'?p.unlocked:{};
  const rows=Object.entries(unlocked).map(([id,v])=>({id,at:v?.at||'',reward:v?.reward||null,ts:Date.parse(v?.at||'')||0})).sort((a,b)=>b.ts-a.ts);
  if(!rows.length)return null;
  const hit=rows[0],d=defs.find(x=>x.id===hit.id)||{};
  return {id:hit.id,title:d.title||hit.id,icon:d.icon||'🏆',group:d.group||'',at:hit.at,reward:hit.reward};
}
function scoreStats(){
  const rows=attemptRows().map(a=>({...a,_score:num(a?.score),_ts:Date.parse(a?.date||a?.submittedAt||a?.createdAt||'')||0})).filter(a=>a._score!=null).sort((a,b)=>a._ts-b._ts);
  const values=rows.map(x=>x._score),recent=values.slice(-10);
  const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  const last=rows[rows.length-1]||null;
  return {attempts:rows.length,average:avg(values),recentAverage:avg(recent),best:values.length?Math.max(...values):null,last:last?{id:last.id||'',title:last.title||last.type||'Lượt học gần nhất',score:last._score,date:last.date||''}:null};
}
function chapterRows(mastery){
  let chapterDefs=[];
  try{if(typeof chapters!=='undefined'&&Array.isArray(chapters))chapterDefs=chapters}catch(_){}
  const done=new Set(doneRows());
  const codes=Array.isArray(mastery?.codes)?mastery.codes:[];
  return chapterDefs.map(ch=>{
    const lessons=Array.isArray(ch.lessons)?ch.lessons:[],lessonIds=new Set(lessons.map(x=>x.id)),completed=lessons.filter(x=>done.has(x.id)).length;
    const tested=codes.filter(x=>Number(x.chapterId)===Number(ch.id)||lessonIds.has(x.lessonId));
    const weighted=tested.filter(x=>num(x.score)!=null);
    const masteryAverage=weighted.length?weighted.reduce((s,x)=>s+clamp(x.score),0)/weighted.length:null;
    const mastered=weighted.filter(x=>x.state==='mastered').length;
    return {id:Number(ch.id),title:ch.title||`Chương ${ch.id}`,lessons:lessons.length,completed,lessonProgress:lessons.length?completed/lessons.length:0,masteryAverage,mastered,tested:weighted.length};
  });
}
function snapshot(){
  const mastery=masterySummary(),economy=economyProfile(),ach=achievementProfile(),scores=scoreStats(),chaptersData=chapterRows(mastery);
  const unlocked=ach.unlocked&&typeof ach.unlocked==='object'?ach.unlocked:{},achCount=Object.keys(unlocked).length;
  const mastered=Math.max(0,Number(mastery?.counts?.mastered)||0),level=Math.max(1,Number(economy?.level)||1),lessonPass=Object.keys(economy?.rewardLedger?.lessonPass||{}).length;
  const lessonsCompleted=doneRows().length,streak=currentStreak(),longestStreak=Math.max(streak,Number(window.v388Achievements?.longestStreak?.())||0);
  const books=Math.min(18,Math.max(3,lessonPass+Math.floor(mastered/2))),trophies=Math.min(10,achCount),roomLevel=Math.min(5,1+Math.floor((achCount+mastered/2+level/5)/6));
  const recent=recentAchievement();
  return {
    schemaVersion:SCHEMA,build:BUILD,updatedAt:nowIso(),
    identity:{level},
    learning:{lessonsCompleted,lessonPass,attempts:scores.attempts,averageScore:scores.average,recentAverageScore:scores.recentAverage,bestScore:scores.best,lastAttempt:scores.last,streak,longestStreak},
    mastery:{average:mastery?.average==null?null:Number(mastery.average),coverage:Number(mastery?.coverage)||0,totalCodes:Number(mastery?.totalCodes)||0,mastered,counts:{...(mastery?.counts||{})}},
    achievements:{count:achCount,recent},
    chapters:chaptersData,
    visual:{books,trophies,roomLevel,signature:`${books}|${trophies}|${roomLevel}`}
  };
}
function signature(d){return JSON.stringify({l:d.learning,m:d.mastery,a:d.achievements,c:d.chapters.map(x=>[x.id,x.completed,x.tested,x.mastered,x.masteryAverage==null?null:+x.masteryAverage.toFixed(3)]),v:d.visual});}
function emit(next,reason='refresh'){
  const sig=signature(next);cached=next;if(sig===lastSignature)return next;lastSignature=sig;
  const detail={current:next,reason,build:BUILD};
  try{window.dispatchEvent(new CustomEvent('math12hub:room-data-changed',{detail}))}catch(_){}
  try{window.Math12Events?.emit?.('room:data-changed',detail)}catch(_){}
  return next;
}
function refresh(reason='manual'){return emit(snapshot(),reason)}
function get({fresh=false}={}){return fresh||!cached?refresh(fresh?'fresh':'initial'):cached}
function schedule(reason='state'){clearTimeout(timer);timer=setTimeout(()=>refresh(reason),32)}
function subscribe(fn,{immediate=true}={}){
  if(typeof fn!=='function')return ()=>{};
  const h=e=>fn(e.detail?.current||get(),e.detail||{});window.addEventListener('math12hub:room-data-changed',h);
  if(immediate)try{fn(get(),{reason:'subscribe',build:BUILD})}catch(_){}
  return ()=>window.removeEventListener('math12hub:room-data-changed',h);
}
function install(){
  document.documentElement.dataset.roomDataBuild=BUILD;
  ['math12hub:state-saved','math12hub:attempt-rewarded','math12hub:game-reward','math12hub:achievement-unlocked'].forEach(ev=>window.addEventListener(ev,()=>schedule(ev)));
  if(window.Math12Events){
    ['account:hydrated','learning:attempt-rewarded','game:reward'].forEach(ev=>unsubs.push(window.Math12Events.on(ev,()=>schedule(ev))));
  }
  setTimeout(()=>refresh('install'),50);
}
window.Math12RoomData={build:BUILD,schema:SCHEMA,get,refresh,subscribe,snapshot};
window.v40147RoomData=window.Math12RoomData;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
