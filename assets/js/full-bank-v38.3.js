/* =========================================================
   Math12 Hub  — Content Pack + Approved Publishing Bridge
   Any future chapter file can call Math12Content.registerPack(id, rows, meta).
   Student/guest practice only sees Approved/Reviewed questions.
   ========================================================= */
(function(){
'use strict';
const BUILD='39.5-content-pack-approved-bridge';
const store=window.__MATH12_CONTENT_PACKS__=window.__MATH12_CONTENT_PACKS__||new Map();
function base(){return Array.isArray(window.MATH12_ALL_PRACTICE_BANK)?window.MATH12_ALL_PRACTICE_BANK:[]}
function teacherRole(){try{return typeof isTeacherRole==='function'&&isTeacherRole()}catch(_){return false}}
function approved(q){const s=String(q?.reviewStatus||'approved').toLowerCase();return s==='approved'||s==='reviewed'}
function registerPack(id,rows=[],meta={}){id=String(id||'').trim();if(!id||!Array.isArray(rows))return false;store.set(id,{id,rows:rows.filter(Boolean),meta:{...meta,registeredAt:new Date().toISOString()}});try{window.dispatchEvent(new CustomEvent('math12hub:content-pack',{detail:{id,count:rows.length,meta}}))}catch(_){}return true}
function allRaw(){const m=new Map();for(const q of base())if(q?.id)m.set(q.id,q);for(const p of store.values())for(const q of p.rows||[])if(q?.id)m.set(q.id,q);return [...m.values()]}
function publicApproved(){return allRaw().filter(q=>q&&q.id&&approved(q))}
function privateBank(){return (typeof state!=='undefined'&&Array.isArray(state?.questionBank))?state.questionBank:[]}
function effectiveBank(){if(!teacherRole())return publicApproved();const map=new Map(publicApproved().map(q=>[q.id,q]));for(const q of privateBank())if(q?.id)map.set(q.id,q);return [...map.values()]}
function chapterOf(q){let c=Number(q?.chapterId)||0;if(c)return c;let m=String(q?.lessonId||q?.knowledgeCode||q?.id6||'').match(/F([1-6])/i);return m?Number(m[1]):0}
function readiness(){const raw=allRaw(),pub=publicApproved();const chapters={};for(let c=1;c<=6;c++)chapters[c]={chapter:c,total:0,approved:0,mcq:0,tf4:0,short:0,draft:0};for(const q of raw){let c=chapterOf(q);if(!chapters[c])continue;chapters[c].total++;if(approved(q))chapters[c].approved++;else chapters[c].draft++;if(q.type==='mcq')chapters[c].mcq++;else if(q.type==='tf4'||q.type==='tf')chapters[c].tf4++;else if(q.type==='short')chapters[c].short++}return {build:BUILD,total:raw.length,approved:pub.length,excluded:raw.length-pub.length,chapters,packs:[...store.values()].map(p=>({id:p.id,count:p.rows.length,meta:p.meta}))}}
const api={build:BUILD,registerPack,allRaw,publicBank:publicApproved,effectiveBank,readiness,stats(){const r=readiness();return {...r,bundledCount:r.total,approvedPublicCount:r.approved,excludedPublicCount:r.excluded,effectiveCount:effectiveBank().length,teacherMode:teacherRole()}}};
window.Math12Content=api;window.V395Content=api;window.V393PracticeBank=api;window.V383PracticeBank=api;window.V3823PracticeBank=api;window.V3822PracticeBank=api;window.getPracticeQuestionBank=()=>effectiveBank();document.documentElement.dataset.practiceBankBuild=BUILD;
})();
