/* =========================================================
   Math12 Hub V37.9 — EXP + Level + Gold Engine
   - Rewards only after submitted local exam/practice attempts.
   - Per-question daily uniqueness + daily caps reduce farming.
   - Cosmetic economy only: never changes score, answers or difficulty.
   - Local-first; optional merge sync to users/{uid}.gamificationV379.
   ========================================================= */
(function(){
'use strict';
const BUILD='37.9-exp-level-gold',SCHEMA=379,DAILY_XP_CAP=600,DAILY_GOLD_CAP=400;
const XP_BY_LEVEL={NB:2,TH:4,VD:7,VDC:12,C:12},GOLD_BY_LEVEL={NB:1,TH:2,VD:3,VDC:5,C:5};
const uid=()=>firebaseUser?.uid||'local';
const now=()=>new Date().toISOString();
const dayKey=(d=new Date())=>{let x=d instanceof Date?d:new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const rankFor=l=>l>=50?'Bậc thầy Toán học':l>=35?'Cao thủ Toán học':l>=20?'Học giả':l>=10?'Nhà thám hiểm Toán':l>=5?'Học viên':'Tân binh Toán học';
const needFor=l=>100+(Math.max(1,l)-1)*30;
function levelInfo(total){total=Math.max(0,Math.floor(Number(total)||0));let level=1,left=total;while(level<100&&left>=needFor(level)){left-=needFor(level);level++}return {level,exp:left,next:needFor(level),rank:rankFor(level)}}
function blank(owner=uid()){return {schemaVersion:SCHEMA,ownerUid:owner,totalExp:0,gold:100,lifetimeGold:100,level:1,rank:rankFor(1),rewardLedger:{attemptIds:[],questionDaily:{},daily:{},grants:{},lessonPass:{}},updatedAt:''}}
function sanitize(raw,owner=uid()){
  let x=raw&&typeof raw==='object'?JSON.parse(JSON.stringify(raw)):blank(owner),l=x.rewardLedger&&typeof x.rewardLedger==='object'?x.rewardLedger:{};
  x.schemaVersion=SCHEMA;x.ownerUid=owner;x.totalExp=Math.max(0,Math.floor(Number(x.totalExp)||0));x.gold=Math.max(0,Math.floor(Number(x.gold)||0));x.lifetimeGold=Math.max(x.gold,Math.floor(Number(x.lifetimeGold)||0));
  x.rewardLedger={attemptIds:Array.isArray(l.attemptIds)?l.attemptIds.slice(-240):[],questionDaily:l.questionDaily&&typeof l.questionDaily==='object'?l.questionDaily:{},daily:l.daily&&typeof l.daily==='object'?l.daily:{},grants:l.grants&&typeof l.grants==='object'?l.grants:{},lessonPass:l.lessonPass&&typeof l.lessonPass==='object'?l.lessonPass:{}};
  let inf=levelInfo(x.totalExp);x.level=inf.level;x.rank=inf.rank;x.updatedAt=String(x.updatedAt||'');return x
}
function bucket(){state.gamificationV379ByUser=state.gamificationV379ByUser&&typeof state.gamificationV379ByUser==='object'?state.gamificationV379ByUser:{};return state.gamificationV379ByUser}
function localProfile(){return sanitize(bucket()[uid()]||blank(uid()),uid())}
function profile(){return localProfile()}
function setLocal(p){p=sanitize(p,uid());p.updatedAt=now();bucket()[uid()]=p;try{save({sync:false,reason:'game-economy-v37.9'})}catch(_){try{localStorage.setItem(LOCAL_STATE_KEY,JSON.stringify(state))}catch(__){}}return p}
async function syncCloud(p){if(!firebaseUser||!firebaseDb||firebaseAccountLocked)return;try{await firebaseDb.collection('users').doc(firebaseUser.uid).set({gamificationV379:sanitize(p,firebaseUser.uid),updatedAt:firebaseServerTimestamp()},{merge:true});firebaseProfile={...(firebaseProfile||{}),gamificationV379:sanitize(p,firebaseUser.uid)}}catch(err){console.warn('V37.9 economy sync',err)}}
function persist(p,{cloud=true}={}){p=setLocal(p);if(cloud)syncCloud(p);refreshUI();return p}
function adoptCloud(){let c=firebaseProfile?.gamificationV379;if(!c)return;let local=localProfile(),cloud=sanitize(c,uid()),lt=Date.parse(local.updatedAt||0)||0,ct=Date.parse(cloud.updatedAt||0)||0;if(ct>=lt||cloud.totalExp>local.totalExp){bucket()[uid()]=cloud;try{save({sync:false,reason:'game-economy-cloud-v37.9'})}catch(_){}}refreshUI()}
function applyDelta(p,xp,gold){let old=p.level;p.totalExp=Math.max(0,p.totalExp+Math.max(0,Math.floor(xp||0)));p.gold=Math.max(0,p.gold+Math.max(0,Math.floor(gold||0)));p.lifetimeGold=Math.max(0,p.lifetimeGold+Math.max(0,Math.floor(gold||0)));let inf=levelInfo(p.totalExp);p.level=inf.level;p.rank=inf.rank;return {oldLevel:old,newLevel:p.level,levelUp:p.level>old}}
function grant({xp=0,gold=0,key='',source='reward'}={}){let p=profile();if(key&&p.rewardLedger.grants[key])return {ok:false,duplicate:true,xp:0,gold:0,profile:p};let lv=applyDelta(p,xp,gold);if(key)p.rewardLedger.grants[key]={source,xp:Math.floor(xp),gold:Math.floor(gold),at:now()};persist(p);let out={ok:true,xp:Math.floor(xp),gold:Math.floor(gold),profile:p,...lv,source};window.dispatchEvent(new CustomEvent('math12hub:game-reward',{detail:out}));return out}
function spendGold(amount,reason='shop'){amount=Math.max(0,Math.floor(Number(amount)||0));let p=profile();if(p.gold<amount)return {ok:false,need:amount-p.gold,profile:p};p.gold-=amount;p.rewardLedger.grants[`spend:${Date.now()}:${Math.random().toString(36).slice(2,7)}`]={source:reason,xp:0,gold:-amount,at:now()};persist(p);return {ok:true,spent:amount,profile:p}}
function normLevel(x){x=String(x||'NB').toUpperCase();if(x==='N'||x==='NHẬN BIẾT')return'NB';if(x==='H'||x==='THÔNG HIỂU')return'TH';if(x==='V'||x==='VẬN DỤNG')return'VD';if(x==='C'||x==='VDC'||x.includes('CAO'))return'VDC';return ['NB','TH','VD','VDC'].includes(x)?x:'NB'}
function rewardAttempt(attempt,config={}){
  if(!attempt?.id)return null;let p=profile(),L=p.rewardLedger;if(L.attemptIds.includes(attempt.id))return null;L.attemptIds=[...L.attemptIds,attempt.id].slice(-240);
  const day=dayKey(attempt.date||new Date()),qday=L.questionDaily[day]||(L.questionDaily[day]={}),daily=L.daily[day]||(L.daily[day]={xp:0,gold:0,bonusAttempts:0});let xp=0,gold=0,uniqueCorrect=0;
  for(const r of attempt.questionResults||[]){if(!r.correct||!r.questionId)continue;if(qday[r.questionId])continue;qday[r.questionId]=1;uniqueCorrect++;let lev=normLevel(r.level);xp+=XP_BY_LEVEL[lev]||2;gold+=GOLD_BY_LEVEL[lev]||1}
  if((daily.bonusAttempts||0)<3){daily.bonusAttempts=(daily.bonusAttempts||0)+1;xp+=10;gold+=8;let sc=Number(attempt.score);if(sc>=8){xp+=30;gold+=20}if(sc>=9.95){xp+=20;gold+=20}}
  if(attempt.mode==='lesson'&&Number(attempt.score)>=7){let lid=(attempt.type||'').replace(/^lesson-/,'')||config.lessonId||'';if(lid&&!L.lessonPass[lid]){L.lessonPass[lid]=now();xp+=40;gold+=30}}
  xp=Math.max(0,Math.min(xp,DAILY_XP_CAP-(daily.xp||0)));gold=Math.max(0,Math.min(gold,DAILY_GOLD_CAP-(daily.gold||0)));daily.xp=(daily.xp||0)+xp;daily.gold=(daily.gold||0)+gold;
  let lv=applyDelta(p,xp,gold);persist(p);let reward={ok:true,attemptId:attempt.id,xp,gold,uniqueCorrect,score:Number(attempt.score)||0,...lv,profile:p};showReward(reward);window.dispatchEvent(new CustomEvent('math12hub:attempt-rewarded',{detail:{attempt,reward,config}}));return reward
}
function showReward(r){if(!r||(r.xp<=0&&r.gold<=0))return;try{examToast?.(`+${r.xp} EXP • +${r.gold} vàng${r.levelUp?` • Lên Lv.${r.newLevel}!`:''}`)}catch(_){};setTimeout(()=>{let card=document.querySelector('.exam-result-card');if(!card||card.querySelector('.v379-reward-card'))return;let div=document.createElement('div');div.className='v379-reward-card';div.innerHTML=`<div><b>🎁 Phần thưởng học tập</b><small>Chỉ tính câu đúng duy nhất trong ngày; tối đa 3 thưởng đề/ngày.</small></div><strong>+${r.xp} EXP</strong><strong>+${r.gold} 🪙</strong>${r.levelUp?`<em>Lv.${r.newLevel}</em>`:''}`;let metrics=card.querySelector('.exam-result-metrics');metrics?.insertAdjacentElement('afterend',div)},30)}
function economyStrip(){let p=profile(),inf=levelInfo(p.totalExp),pct=Math.round(inf.exp*100/Math.max(1,inf.next));return `<div class="v379-economy-strip"><div><span>LV.${p.level}</span><b>${esc(p.rank)}</b></div><div class="v379-exp"><small>${inf.exp}/${inf.next} EXP</small><i><em style="width:${pct}%"></em></i></div><div class="v379-gold">🪙 <b>${p.gold.toLocaleString('vi-VN')}</b></div></div>`}
function decorateAvatar(){let p=profile(),top=document.getElementById('avatarV378Topbar');if(top){let a=avatarV378Stored?.();top.innerHTML=`${avatarV378MiniHtml(a)}<span><b>${esc(avatarV378DisplayName())}</b><small>Lv.${p.level} • 🪙 ${p.gold.toLocaleString('vi-VN')}</small></span>`}let dash=document.getElementById('avatarV378Dashboard');if(dash&&!dash.querySelector('.v379-economy-strip'))dash.insertAdjacentHTML('beforeend',economyStrip());let page=document.getElementById('avatarV378Page');if(page){let future=page.querySelector('.avatar-future-grid');if(future)future.innerHTML=`<div class="card avatar-future-card v379-live"><span>⚡</span><div><b>EXP & Level</b><small>Lv.${p.level} • ${esc(p.rank)}</small></div><em>${levelInfo(p.totalExp).exp}/${levelInfo(p.totalExp).next}</em></div><div class="card avatar-future-card v379-live"><span>🪙</span><div><b>Vàng</b><small>Chỉ dùng cho vật phẩm thẩm mỹ.</small></div><em>${p.gold.toLocaleString('vi-VN')}</em></div><div class="card avatar-future-card v379-rule"><span>🛡</span><div><b>Chống farm</b><small>Mỗi câu chỉ nhận thưởng đầy đủ 1 lần/ngày; thưởng đề giới hạn 3 lượt/ngày.</small></div><em>Công bằng</em></div>`;page.insertAdjacentHTML('afterbegin',economyStrip())}}
function refreshUI(){decorateAvatar()}
function install(){
  if(typeof window.avatarV378Svg==='function'&&!window.avatarV378Svg.__v379){let base=window.avatarV378Svg;let wrap=function(raw,size='large'){let s=base(raw,size),p=profile();return s.replace(/(<text x="205" y="52"[^>]*>)(?:1|\?)(<\/text>)/,`$1${p.level}$2`)};wrap.__v379=true;window.avatarV378Svg=wrap}
  if(typeof window.avatarV378RefreshUI==='function'&&!window.avatarV378RefreshUI.__v379){let base=window.avatarV378RefreshUI;let wrap=function(){let r=base();decorateAvatar();return r};wrap.__v379=true;window.avatarV378RefreshUI=wrap}
  if(typeof window.avatarV378RenderPage==='function'&&!window.avatarV378RenderPage.__v379){let base=window.avatarV378RenderPage;let wrap=function(){let r=base();decorateAvatar();return r};wrap.__v379=true;window.avatarV378RenderPage=wrap}
  if(typeof window.submitExam==='function'&&!window.submitExam.__v379){let base=window.submitExam;let wrap=async function(auto=false){let before=(state.examAttempts||[]).length,cfg=examSession?.config?JSON.parse(JSON.stringify({id:examSession.config.id,mode:examSession.config.mode,lessonId:examSession.config.lessonId||''})):{},r=await base(auto);let list=state.examAttempts||[];if(list.length>before){let a=list[list.length-1];rewardAttempt(a,cfg)}return r};wrap.__v379=true;window.submitExam=wrap}
  if(typeof window.firebaseHydrateUser==='function'&&!window.firebaseHydrateUser.__v379){let base=window.firebaseHydrateUser;let wrap=async function(user){let r=await base(user);adoptCloud();return r};wrap.__v379=true;window.firebaseHydrateUser=wrap}
  window.addEventListener('math12hub:state-saved',refreshUI);setTimeout(refreshUI,200)
}
window.v379Economy={build:BUILD,schema:SCHEMA,profile,levelInfo,rankFor,grant,spendGold,rewardAttempt,refreshUI,adoptCloud,dayKey};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
