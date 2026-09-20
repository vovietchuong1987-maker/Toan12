/* Math12 Hub v40.26.0 — Stability & Security Core */
(function(){
'use strict';
const BUILD='40.26.0-stability-security-core';
const VERSION=402600;
const TRUST_TTL=15*60*1000;
const MAX_DURATION=4*60*60*1000;
const ledger=new Map();
const safeMode=new URLSearchParams(location.search).has('safe');

function exposeRuntime(){
  const defs={
    firebaseUser:()=>typeof firebaseUser!=='undefined'?firebaseUser:null,
    firebaseDb:()=>typeof firebaseDb!=='undefined'?firebaseDb:null,
    firebaseProfile:()=>typeof firebaseProfile!=='undefined'?firebaseProfile:null,
    firebaseAccountLocked:()=>typeof firebaseAccountLocked!=='undefined'?firebaseAccountLocked:false,
    firebaseAppCheckStatus:()=>typeof firebaseAppCheckStatus!=='undefined'?firebaseAppCheckStatus:'unknown'
  };
  for(const [key,get] of Object.entries(defs)){
    try{const d=Object.getOwnPropertyDescriptor(window,key);if(!d||d.configurable)Object.defineProperty(window,key,{configurable:true,enumerable:false,get});}catch(_){}
  }
  if(typeof window.firebaseServerTimestamp!=='function'){
    try{window.firebaseServerTimestamp=()=>typeof firebaseServerTimestamp==='function'?firebaseServerTimestamp():new Date()}catch(_){}
  }
}

function cleanLedger(){const now=Date.now();for(const [id,x] of ledger)if(now-x.at>TRUST_TTL)ledger.delete(id)}
function finite(v){return Number.isFinite(Number(v))}
function normalizeAttempt(a={}){
  const id=String(a.id||'').trim();
  return {id,score:Number(a.score),durationMs:Number(a.durationMs??a.usedMs??0)||0,total:Number(a.total)||0,answered:Number(a.answered)||0,mode:String(a.mode||''),at:Date.now()};
}
function registerTrustedAttempt(detail={}){
  const a=normalizeAttempt(detail.attempt||{});
  if(!a.id||!finite(a.score)||a.score<0||a.score>10||a.durationMs<0||a.durationMs>MAX_DURATION)return false;
  cleanLedger();ledger.set(a.id,a);return true;
}
function verifyArenaAttempt(a={}){
  cleanLedger();const x=normalizeAttempt(a);
  if(!x.id)return {ok:false,reason:'missing-attempt-id'};
  if(!finite(x.score)||x.score<0||x.score>10)return {ok:false,reason:'invalid-score'};
  if(x.durationMs<0||x.durationMs>MAX_DURATION)return {ok:false,reason:'invalid-duration'};
  if(x.total<0||x.answered<0||(x.total&&x.answered>x.total))return {ok:false,reason:'invalid-progress'};
  const trusted=ledger.get(x.id);if(!trusted)return {ok:false,reason:'attempt-not-issued-by-engine'};
  if(Math.abs(trusted.score-x.score)>.001)return {ok:false,reason:'score-mismatch'};
  if(Math.abs(trusted.durationMs-x.durationMs)>1500)return {ok:false,reason:'duration-mismatch'};
  return {ok:true,attemptId:x.id};
}
function consumeArenaAttempt(id){if(id)ledger.delete(String(id))}
function status(){
  cleanLedger();
  return {build:BUILD,version:VERSION,safeMode,trustedAttempts:ledger.size,appCheck:window.firebaseAppCheckStatus||'unknown',firebaseReady:!!(window.firebaseUser&&window.firebaseDb)};
}
function auditReject(reason,attempt){
  try{window.firebaseAuditLog?.('arena.local_reject',{reason:String(reason||''),attemptId:String(attempt?.id||'').slice(0,80)}).catch?.(()=>{})}catch(_){}
}
function install(){
  exposeRuntime();
  window.addEventListener('math12hub:attempt-rewarded',e=>registerTrustedAttempt(e.detail||{}));
  window.addEventListener('math12hub:account-hydrated',()=>setTimeout(exposeRuntime,0));
  window.addEventListener('focus',exposeRuntime);
  document.documentElement.dataset.securityCore='40.26';
}
window.M12SecurityCore={build:BUILD,version:VERSION,registerTrustedAttempt,verifyArenaAttempt,consumeArenaAttempt,auditReject,status,exposeRuntime};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
