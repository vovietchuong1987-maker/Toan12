/* =========================================================
   Math12 Hub V40.11 — Unified Question Bank Runtime
   One logical source contract for teacher dashboard + learner practice.
   - Teacher/admin: current state.questionBank is authoritative.
   - Student/guest: latest public Firestore snapshot when available.
   - Offline/fallback: bundled canonical bank generated from the same teacher backup.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.11-unified-question-bank';
const store=window.__MATH12_CONTENT_PACKS__=window.__MATH12_CONTENT_PACKS__||new Map();
let remote=[],remoteMeta=null,remoteActive=false;
function cloneRows(rows){return Array.isArray(rows)?rows:[]}
function bundled(){return cloneRows(window.MATH12_CANONICAL_QUESTION_BANK||window.MATH12_ALL_PRACTICE_BANK)}
function teacherRole(){try{return typeof isTeacherRole==='function'&&isTeacherRole()}catch(_){return false}}
function approved(q){const s=String(q?.reviewStatus||'approved').toLowerCase();return s==='approved'||s==='reviewed'}
function privateBank(){try{return typeof state!=='undefined'&&Array.isArray(state?.questionBank)?state.questionBank:null}catch(_){return null}}
function registerPack(id,rows=[],meta={}){id=String(id||'').trim();if(!id||!Array.isArray(rows))return false;store.set(id,{id,rows:rows.filter(Boolean),meta:{...meta,registeredAt:new Date().toISOString()}});try{window.dispatchEvent(new CustomEvent('math12hub:content-pack',{detail:{id,count:rows.length,meta}}))}catch(_){}return true}
function mergeRows(base,extras){const m=new Map();for(const q of base||[])if(q?.id)m.set(q.id,q);for(const q of extras||[])if(q?.id)m.set(q.id,q);return [...m.values()]}
function sourceRaw(){
  if(teacherRole()){const p=privateBank();return p===null?bundled():p}
  if(remoteActive)return remote
  return bundled()
}
function allRaw(){let rows=sourceRaw();for(const p of store.values())rows=mergeRows(rows,p.rows||[]);return rows}
function publicApproved(){return allRaw().filter(q=>q&&q.id&&approved(q))}
function effectiveBank(){return teacherRole()?allRaw():publicApproved()}
function chapterOf(q){let c=Number(q?.chapterId)||0;if(c)return c;let m=String(q?.lessonId||q?.knowledgeCode||q?.id6||'').match(/F([1-6])/i);return m?Number(m[1]):0}
function sourceInfo(){const p=privateBank();if(teacherRole())return {kind:p===null?'bundle-seed':'teacher-bank',label:p===null?'Bản chuẩn 40.11':'Ngân hàng giáo viên',remote:false};if(remoteActive)return {kind:'firestore-public',label:'Firestore công khai 40.11',remote:true,...(remoteMeta||{})};return {kind:'bundle',label:'Bản chuẩn 40.11 (offline)',remote:false}}
function readiness(){const raw=allRaw(),pub=raw.filter(q=>q&&q.id&&approved(q)),chapters={};for(let c=1;c<=6;c++)chapters[c]={chapter:c,total:0,approved:0,mcq:0,tf4:0,short:0,draft:0};for(const q of raw){let c=chapterOf(q);if(!chapters[c])continue;const x=chapters[c];x.total++;if(approved(q))x.approved++;else x.draft++;if(q.type==='mcq')x.mcq++;else if(q.type==='tf4'||q.type==='tf')x.tf4++;else if(q.type==='short')x.short++}const si=sourceInfo();return {build:BUILD,total:raw.length,approved:pub.length,excluded:raw.length-pub.length,chapters,packs:[...store.values()].map(p=>({id:p.id,count:p.rows.length,meta:p.meta})),source:si,unified:true}}
function setRemoteBank(rows,meta={}){if(!Array.isArray(rows))return false;const clean=rows.filter(q=>q&&q.id);remote=clean;remoteActive=true;remoteMeta={...meta,loadedAt:new Date().toISOString()};window.MATH12_ALL_PRACTICE_BANK=clean;window.MATH12_PUBLIC_PRACTICE_BANK=publicApproved();try{window.dispatchEvent(new CustomEvent('math12hub:unified-bank-update',{detail:{count:clean.length,source:'firestore',meta:remoteMeta}}))}catch(_){}return true}
function clearRemote(){remote=[];remoteActive=false;remoteMeta=null;window.MATH12_ALL_PRACTICE_BANK=bundled();window.MATH12_PUBLIC_PRACTICE_BANK=publicApproved()}
const api={build:BUILD,registerPack,allRaw,publicBank:publicApproved,effectiveBank,readiness,sourceInfo,setRemoteBank,clearRemote,stats(){const r=readiness();return {...r,bundledCount:bundled().length,approvedPublicCount:r.approved,excludedPublicCount:r.excluded,effectiveCount:effectiveBank().length,teacherMode:teacherRole()}}};
window.Math12Content=api;window.V4011Content=api;window.V395Content=api;window.V393PracticeBank=api;window.V383PracticeBank=api;window.V3823PracticeBank=api;window.V3822PracticeBank=api;window.getPracticeQuestionBank=()=>effectiveBank();document.documentElement.dataset.practiceBankBuild=BUILD;
})();
