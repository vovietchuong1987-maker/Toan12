/* =========================================================
   Math12 Hub V38.2.2 — Published Practice Bank Bridge
   - Student/offline practice reads a bundled Approved bank.
   - Teacher private bank stays private and is never copied to students.
   - Teacher/admin practice sees a de-duplicated union; own records override
     bundled records with the same id.
   ========================================================= */
(function(){
'use strict';
const BUILD='38.2.2-published-practice-bank';
function clone(x){return JSON.parse(JSON.stringify(x||[]))}
function publicBank(){return Array.isArray(window.MATH12_PUBLIC_PRACTICE_BANK)?window.MATH12_PUBLIC_PRACTICE_BANK:[]}
function teacherRole(){try{return typeof isTeacherRole==='function'&&isTeacherRole()}catch(_){return false}}
function privateBank(){return (typeof state!=='undefined'&&Array.isArray(state?.questionBank))?state.questionBank:[]}
function effectiveBank(opts={}){
  const approvedOnly=!!opts.approvedOnly;
  let rows;
  if(teacherRole()){
    const map=new Map();
    for(const q of publicBank())if(q?.id)map.set(q.id,q);
    for(const q of privateBank())if(q?.id)map.set(q.id,q); // teacher's own version wins
    rows=[...map.values()];
  }else rows=publicBank();
  if(approvedOnly)rows=rows.filter(q=>String(q?.reviewStatus||'').toLowerCase()==='approved');
  return rows;
}
function stats(){
  const p=publicBank(),e=effectiveBank(),approved=effectiveBank({approvedOnly:true});
  return {build:BUILD,publicCount:p.length,effectiveCount:e.length,approvedCount:approved.length,teacherMode:teacherRole(),meta:window.MATH12_PUBLIC_PRACTICE_META||{}};
}
window.V3822PracticeBank={build:BUILD,publicBank,effectiveBank,stats};
window.getPracticeQuestionBank=(opts={})=>effectiveBank(opts);
document.documentElement.dataset.practiceBankBuild=BUILD;
})();
