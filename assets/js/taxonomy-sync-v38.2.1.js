/* =========================================================
   Math12 Hub V38.2.1 — Chapter 1 Taxonomy Sync
   Goal: one canonical Chapter-1 structure everywhere:
   Bài 1 Đơn điệu → Bài 2 Cực trị → Bài 3 GTLN/GTNN
   → Bài 4 Tiệm cận → Bài 5 Khảo sát đồ thị.
   Internal F1-xx.Kx codes remain storage keys, but student-facing
   labels prefer official lesson/form names and ID6 patterns.
   ========================================================= */
(function(){
'use strict';
const BUILD='38.2.1-taxonomy-sync', SCHEMA=3821;
const LESSONS={
 'F1-01':{n:1,title:'Sự đồng biến và nghịch biến của hàm số',stem:'2D1?1-*'},
 'F1-02':{n:2,title:'Cực trị của hàm số',stem:'2D1?2-*'},
 'F1-03':{n:3,title:'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số',stem:'2D1?3-*'},
 'F1-04':{n:4,title:'Đường tiệm cận',stem:'2D1?4-*'},
 'F1-05':{n:5,title:'Khảo sát sự biến thiên và vẽ đồ thị hàm số',stem:'2D1?5-*'}
};
const FORM_K={
 '2D1?1-1':'F1-01.K1','2D1?1-2':'F1-01.K2','2D1?1-3':'F1-01.K3','2D1?1-4':'F1-01.K3','2D1?1-5':'F1-01.K3',
 '2D1?2-1':'F1-02.K1','2D1?2-2':'F1-02.K2','2D1?2-3':'F1-02.K3','2D1?2-4':'F1-02.K3','2D1?2-5':'F1-02.K3','2D1?2-6':'F1-02.K3','2D1?2-7':'F1-02.K3',
 '2D1?3-1':'F1-03.K1','2D1?3-2':'F1-03.K2','2D1?3-3':'F1-03.K3','2D1?3-4':'F1-03.K3','2D1?3-5':'F1-03.K3','2D1?3-6':'F1-03.K3',
 '2D1?4-1':'F1-04.K2','2D1?4-2':'F1-04.K3','2D1?4-3':'F1-04.K3','2D1?4-4':'F1-04.K3',
 '2D1?5-1':'F1-05.K1','2D1?5-2':'F1-05.K1','2D1?5-3':'F1-05.K2','2D1?5-4':'F1-05.K2','2D1?5-5':'F1-05.K3','2D1?5-6':'F1-05.K2','2D1?5-7':'F1-05.K2','2D1?5-8':'F1-05.K3'
};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d');
function patternOf(q={}){return window.ID6V374?.inferPattern?.(q)||''}
function lessonFromPattern(p=''){
 const m=String(p).match(/^2D1\?([1-5])-/);return m?`F1-0${m[1]}`:'';
}
function textOf(q={}){return norm(`${q.question||''} ${q.form||''} ${q.formTitle||''} ${q.id6Title||''}`)}
function knowledgeFor(q={},p=patternOf(q),lessonId=lessonFromPattern(p)){
 if(!lessonId)return q.knowledgeCode||'';
 const txt=textOf(q);
 if(lessonId==='F1-04'&&p==='2D1?4-1'){
   if(/tiem can dung|tcđ|tcd/.test(txt)&&!/tiem can ngang|tiem can xien|tcn|tcx/.test(txt))return 'F1-04.K1';
   if(/tiem can ngang|tiem can xien|tcn|tcx/.test(txt))return 'F1-04.K2';
 }
 return FORM_K[p]||`${lessonId}.K1`;
}
function knowledgeMeta(code=''){
 const lid=String(code).split('.K')[0],arr=typeof getLessonMeta==='function'?(getLessonMeta(lid)?.knowledge||[]):[];
 return arr.find(k=>k.code===code)||null;
}
function formMeta(p=''){return window.ID6V374?.formByPattern?.(p)||null}
function buildId6(p='',level=''){return window.ID6V374?.buildId6?.(p,level)||''}
function canonicalizeQuestion(q={}){
 const p=patternOf(q);if(!/^2D1\?[1-5]-/.test(p))return q;
 const lessonId=lessonFromPattern(p),lesson=LESSONS[lessonId],form=formMeta(p),knowledgeCode=knowledgeFor(q,p,lessonId),km=knowledgeMeta(knowledgeCode),level=['NB','TH','VD','VDC'].includes(q.level)?q.level:'TH',id6=buildId6(p,level)||q.id6||'';
 const out={...q,chapterId:1,lessonId,knowledgeCode,knowledgeTitle:km?.title||q.knowledgeTitle||'',formId:p,id6Pattern:p,id6,id6Lesson:lesson.n,id6Title:form?.title||q.id6Title||q.form||'',formTitle:form?.title||q.formTitle||q.form||'',form:form?.title||q.form||'',metadataStatusV36:'complete',questionBankSchema:Number(q.questionBankSchema)||36,knowledgeMapVersion:Number(q.knowledgeMapVersion)||36,curriculumId:q.curriculumId||'MATH12-GDPT2018-2026',grade:12};
 out.blueprintKey=[knowledgeCode,id6||p,level,q.type||''].join('|');
 out.taxonomyPath=`C1 > ${lessonId} > ${knowledgeCode} > ${p}`;
 return out;
}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function syncHistory(bankMap){
 let changed=0;for(const h of state.questionHistory||[]){const q=bankMap.get(h.questionId);if(!q)continue;const before=`${h.lessonId}|${h.knowledgeCode}|${h.code}`;h.chapterId=q.chapterId;h.lessonId=q.lessonId;h.knowledgeCode=q.knowledgeCode;h.code=q.knowledgeCode;h.level=q.level||h.level;const after=`${h.lessonId}|${h.knowledgeCode}|${h.code}`;if(before!==after)changed++}return changed;
}
function syncAttempts(bankMap){
 let changed=0;for(const a of state.examAttempts||[]){for(const r of a.questionResults||[]){const q=bankMap.get(r.questionId);if(!q)continue;const before=`${r.lessonId}|${r.knowledgeCode}`;r.chapterId=q.chapterId;r.lessonId=q.lessonId;r.knowledgeCode=q.knowledgeCode;r.level=q.level||r.level;if(before!==`${r.lessonId}|${r.knowledgeCode}`)changed++}}return changed;
}
function syncState(opts={}){
 if(typeof state==='undefined'||!state)return {changed:0,questions:0,history:0,attempts:0};
 let qChanged=0;state.questionBank=Array.isArray(state.questionBank)?state.questionBank:state.questionBank;
 if(Array.isArray(state.questionBank))state.questionBank=state.questionBank.map(q=>{const n=canonicalizeQuestion(q);if(n!==q&&!same(n,q))qChanged++;return n});
 const bankMap=new Map((state.questionBank||[]).map(q=>[q.id,q])),history=syncHistory(bankMap),attempts=syncAttempts(bankMap),changed=qChanged+history+attempts;
 state._meta=state._meta||{};state._meta.f1TaxonomyVersion=SCHEMA;state._meta.f1TaxonomyBuild=BUILD;state._meta.f1TaxonomySyncedAt=new Date().toISOString();state._meta.f1TaxonomyLastChanged=changed;
 if(changed&&opts.persist!==false&&typeof save==='function')save({reason:'v38.2.1-taxonomy-sync',sync:opts.sync!==false});
 return {changed,questions:qChanged,history,attempts};
}
function labelForCode(code=''){
 const k=knowledgeMeta(code),lid=k?.code?.split('.K')[0]||String(code).split('.K')[0],l=LESSONS[lid]||null;
 if(!l)return {code,title:k?.title||code,lessonId:lid,lessonTitle:typeof getLesson==='function'?(getLesson(lid)?.common||lid):lid,stem:''};
 return {code,title:k?.title||code,lessonId:lid,lessonTitle:l.title,stem:l.stem,lessonNo:l.n};
}
function humanCode(code='',short=false){const x=labelForCode(code);return short?`${x.stem||x.lessonId} • ${x.title}`:`Bài ${x.lessonNo||''} • ${x.lessonTitle}${x.title&&x.title!==x.lessonTitle?` • ${x.title}`:''}`}
function formPath(q={}){const p=patternOf(q),f=formMeta(p),lid=lessonFromPattern(p),l=LESSONS[lid];return {pattern:p,formTitle:f?.title||q.formTitle||q.form||'',lessonId:lid,lessonTitle:l?.title||'',lessonNo:l?.n||0}}
function patchForms(){
 for(const [lid,meta] of Object.entries(LESSONS)){
   const lesson=chapters?.[0]?.lessons?.find(x=>x.id===lid);if(lesson)lesson.common=meta.title;
   const forms=window.ID6V374?.BY_APP_LESSON?.[lid]||[];
   forms.forEach(f=>{f.knowledgeCode=FORM_K[f.id6Pattern]||f.knowledgeCode||`${lid}.K1`});
   if(typeof lessonCurriculum!=='undefined'&&lessonCurriculum[lid])lessonCurriculum[lid].forms=forms.map(f=>({...f,knowledgeCode:f.knowledgeCode}));
 }
}
function installFirebasePostHydrate(){
 // Firebase may already be loaded by the time this poll runs. Wrapping is useful for later sign-in/account switches.
 if(typeof window.firebaseHydrateUser==='function'&&!window.firebaseHydrateUser.__v3821){const base=window.firebaseHydrateUser;const w=async function(u){const r=await base(u);syncState({persist:true,sync:false});try{renderAll?.()}catch(_){}return r};w.__v3821=true;window.firebaseHydrateUser=w;return true}return false;
}
patchForms();
const initial=syncState({persist:true,sync:false});
window.v3821Taxonomy={build:BUILD,schema:SCHEMA,lessons:LESSONS,formKnowledge:FORM_K,patternOf,lessonFromPattern,knowledgeFor,canonicalizeQuestion,syncState,labelForCode,humanCode,formPath,initial};
document.documentElement.dataset.taxonomySyncBuild=BUILD;
let tries=0,timer=setInterval(()=>{tries++;if(installFirebasePostHydrate()||tries>30)clearInterval(timer)},150);
setTimeout(()=>syncState({persist:true,sync:false}),1200);
setTimeout(()=>syncState({persist:true,sync:false}),3500);
})();
