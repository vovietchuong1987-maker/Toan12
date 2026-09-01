/* =========================================================
   Math12 Hub V38.2.3 — Published Practice Bank Bridge
   - Student/offline practice reads the bundled Approved bank.
   - Teacher private bank stays private and is never copied to students.
   - Teacher/admin practice sees a de-duplicated union; own records override
     bundled records with the same id.
   - V3822PracticeBank alias is preserved for inherited modules.
   ========================================================= */
(function(){
'use strict';
const BUILD='38.2.3-bank-sync';
function publicBank(){return Array.isArray(window.MATH12_PUBLIC_PRACTICE_BANK)?window.MATH12_PUBLIC_PRACTICE_BANK:[]}
function teacherRole(){try{return typeof isTeacherRole==='function'&&isTeacherRole()}catch(_){return false}}
function privateBank(){return (typeof state!=='undefined'&&Array.isArray(state?.questionBank))?state.questionBank:[]}
function effectiveBank(opts={}){
  const approvedOnly=!!opts.approvedOnly;
  let rows;
  if(teacherRole()){
    const map=new Map();
    for(const q of publicBank())if(q?.id)map.set(q.id,q);
    for(const q of privateBank())if(q?.id)map.set(q.id,q);
    rows=[...map.values()];
  }else rows=publicBank();
  if(approvedOnly)rows=rows.filter(q=>String(q?.reviewStatus||'').toLowerCase()==='approved');
  return rows;
}
function stats(){
  const p=publicBank(),e=effectiveBank(),approved=effectiveBank({approvedOnly:true});
  return {build:BUILD,publicCount:p.length,effectiveCount:e.length,approvedCount:approved.length,teacherMode:teacherRole(),meta:window.MATH12_PUBLIC_PRACTICE_META||{}};
}
const api={build:BUILD,publicBank,effectiveBank,stats};
window.V3823PracticeBank=api;
window.V3822PracticeBank=api;
window.getPracticeQuestionBank=(opts={})=>effectiveBank(opts);
document.documentElement.dataset.practiceBankBuild=BUILD;
})();
