/* =========================================================
   Math12 Hub V38.3 — Full Bank Self-Study Bridge
   Policy:
   - learner practice can use every current bank question;
   - reviewStatus / QC do not block self-study selection;
   - teacher/admin still see their local/private records merged by id;
   - inherited V3822/V3823 aliases point to this source.
   ========================================================= */
(function(){
'use strict';
const BUILD='38.3.1-student-practice-hotfix';
function bundled(){return Array.isArray(window.MATH12_ALL_PRACTICE_BANK)?window.MATH12_ALL_PRACTICE_BANK:[]}
function teacherRole(){try{return typeof isTeacherRole==='function'&&isTeacherRole()}catch(_){return false}}
function privateBank(){return (typeof state!=='undefined'&&Array.isArray(state?.questionBank))?state.questionBank:[]}
function effectiveBank(){
  if(!teacherRole())return bundled();
  const map=new Map();
  for(const q of bundled())if(q?.id)map.set(q.id,q);
  for(const q of privateBank())if(q?.id)map.set(q.id,q);
  return [...map.values()];
}
function stats(){
  const rows=effectiveBank(),meta=window.MATH12_ALL_PRACTICE_META||{};
  return {build:BUILD,bundledCount:bundled().length,effectiveCount:rows.length,teacherMode:teacherRole(),meta};
}
const api={build:BUILD,publicBank:bundled,effectiveBank,stats,source:'bundled-public-practice + teacher-private-when-authorized'};
window.V383PracticeBank=api;
window.V3823PracticeBank=api;
window.V3822PracticeBank=api;
window.getPracticeQuestionBank=()=>effectiveBank();
document.documentElement.dataset.practiceBankBuild=BUILD;
})();
