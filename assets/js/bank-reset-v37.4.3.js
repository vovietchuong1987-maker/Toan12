/* =========================================================
    — CLEAN QUESTION BANK RESET
   - Permanent seed/sample bank disabled in this build.
   - Guided destructive reset for active question bank + question trash only.
   - Requires an exported safety JSON before reset.
   - Creates Data Safety snapshot before destructive write when available.
   - Preserves custom exams, classes, students, assignments and learning history.
   - If Firebase teacher is signed in, forces cloud replacement and verifies it.
   ========================================================= */
(()=>{
  'use strict';
  const BUILD='37.4.3-clean-question-bank-reset';
  const TOKEN='XOA-SACH';
  const SESSION_KEY='math12hub_v3743_backup_ready';
  let backupReady=false;

  function clone(x){return JSON.parse(JSON.stringify(x))}
  function bank(){return Array.isArray(state?.questionBank)?state.questionBank:[]}
  function recycle(){
    state.recycleBinV26=state.recycleBinV26&&typeof state.recycleBinV26==='object'?state.recycleBinV26:{questions:[],customExams:[]};
    state.recycleBinV26.questions=Array.isArray(state.recycleBinV26.questions)?state.recycleBinV26.questions:[];
    state.recycleBinV26.customExams=Array.isArray(state.recycleBinV26.customExams)?state.recycleBinV26.customExams:[];
    return state.recycleBinV26;
  }
  function seedCount(){return bank().filter(q=>q?.source==='seed'||q?.source==='sample'||q?.source==='demo').length}
  function versionCount(){return bank().reduce((s,q)=>s+(Array.isArray(q?._versions)?q._versions.length:0),0)}
  function cloudMode(){return !!(typeof firebaseUser!=='undefined'&&firebaseUser&&typeof firebaseDb!=='undefined'&&firebaseDb&&typeof isTeacherRole==='function'&&isTeacherRole())}
  function nowStamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`}
  function hashText(s){if(typeof globalThis.v21HashText==='function')return v21HashText(s);let h=2166136261;s=String(s||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
  function backupPayload(){
    const b=bank(),r=recycle(),body={format:'math12hub-question-bank-pre-reset-v37.4.3',appVersion:String(typeof APP_VERSION!=='undefined'?APP_VERSION:'37.4.3'),build:BUILD,createdAt:new Date().toISOString(),questionCount:b.length,questionTrashCount:r.questions.length,customExamTrashPreserved:r.customExams.length,questionBank:clone(b),recycleBinQuestions:clone(r.questions),note:'Có thể khôi phục questionBank bằng Khôi phục V2; recycleBinQuestions được lưu bổ sung để đối soát.'};
    body.integrity={algorithm:'FNV-1a compatibility hash',hash:hashText(JSON.stringify({questionBank:body.questionBank,recycleBinQuestions:body.recycleBinQuestions}))};return body;
  }
  function downloadSafetyBackup(){
    if(!globalThis.requireTeacher?.('Sao lưu trước khi làm sạch ngân hàng'))return;
    const payload=backupPayload(),name=`math12-question-bank-before-clean-v37.4.3-${nowStamp()}.json`;
    if(typeof globalThis.triggerJsonDownload==='function')triggerJsonDownload(payload,name);else{
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)
    }
    backupReady=true;try{sessionStorage.setItem(SESSION_KEY,new Date().toISOString())}catch(_){}
    renderCenter();globalThis.examToast?.(`Đã tạo bản sao lưu bắt buộc • ${payload.questionCount} câu.`)
  }
  function backupConfirmed(){if(backupReady)return true;try{return !!sessionStorage.getItem(SESSION_KEY)}catch(_){return false}}


  function applyLocalResetState(target){
    target=target&&typeof target==='object'?target:{};
    target.questionBank=[];
    target.recycleBinV26=target.recycleBinV26&&typeof target.recycleBinV26==='object'?target.recycleBinV26:{questions:[],customExams:[]};
    target.recycleBinV26.questions=[];
    target.recycleBinV26.customExams=Array.isArray(target.recycleBinV26.customExams)?target.recycleBinV26.customExams:[];
    return target;
  }
  function counts(){const r=recycle();return {questions:bank().length,seeds:seedCount(),versions:versionCount(),trash:r.questions.length,examTrash:r.customExams.length,customExams:Array.isArray(state.customExams)?state.customExams.length:0}}
  function summaryHtml(){const c=counts(),cloud=cloudMode();return `<div class="v3743-reset-summary">
    <div><b>${c.questions}</b><small>Câu đang hoạt động</small></div><div><b>${c.seeds}</b><small>Câu mẫu/demo</small></div><div><b>${c.versions}</b><small>Phiên bản cũ nhúng</small></div><div><b>${c.trash}</b><small>Câu trong Thùng rác</small></div>
  </div><div class="firebase-banner ${cloud?'':'warn'} mt"><b>${cloud?'☁ Firebase đã đăng nhập':'⚠ Chưa có Firebase giáo viên'}</b><br>${cloud?'Khi xác nhận,  sẽ làm sạch local + cloud rồi kiểm tra lại collection questionBank.':'Nếu tiếp tục, chỉ dữ liệu trên máy này được làm sạch. Dữ liệu cloud cũ có thể quay lại khi đăng nhập sau này.'}</div>`}
  function renderCenter(){
    const host=document.getElementById('v3743ResetBody');if(!host)return;const ready=backupConfirmed(),c=counts();
    host.innerHTML=`${summaryHtml()}
      <div class="v3743-reset-step ${ready?'done':''}"><div class="v3743-step-no">1</div><div><b>Sao lưu bắt buộc trước khi xóa</b><p>Tải một JSON chứa toàn bộ câu đang hoạt động + câu trong Thùng rác. File này đọc được bởi Khôi phục V2 đối với phần questionBank.</p><button class="btn ${ready?'btn-soft':'btn-blue'}" onclick="v3743DownloadSafetyBackup()">${ready?'✓ Tải lại bản sao lưu':'⬇ Tải bản sao lưu bắt buộc'}</button>${ready?'<span class="badge ok">Đã xác nhận trong phiên này</span>':''}</div></div>
      <div class="v3743-reset-step"><div class="v3743-step-no">2</div><div><b>Phạm vi sẽ xóa</b><p><strong>${c.questions}</strong> câu trong ngân hàng, toàn bộ <code>_versions</code> đi kèm các câu đó, và <strong>${c.trash}</strong> câu trong Thùng rác. Ngân hàng mẫu/seed bị vô hiệu hóa vĩnh viễn từ .</p><div class="math-help"><b>Không xóa:</b> ${c.customExams} đề đã lưu, lớp học, học sinh, bài giao, bài nộp, lịch sử học tập/Mastery, cấu trúc 6 chương – 17 bài – 91 dạng ID6.</div></div></div>
      <div class="v3743-reset-step"><div class="v3743-step-no">3</div><div><b>Xác nhận xóa sạch</b><p>Đánh dấu xác nhận và nhập chính xác <code>${TOKEN}</code>.</p><label class="v3743-check"><input id="v3743Understand" type="checkbox" onchange="v3743RefreshCommitState()"> Tôi hiểu đây là thao tác xóa ngân hàng câu hỏi hiện tại.</label><input id="v3743Token" autocomplete="off" placeholder="Nhập ${TOKEN}" oninput="v3743RefreshCommitState()"><button id="v3743Commit" class="btn btn-danger" onclick="v3743CommitCleanReset()" disabled>🧹 Xóa sạch & tạo ngân hàng mới</button></div></div>`;
  }
  function refreshCommitState(){const btn=document.getElementById('v3743Commit'),ok=backupConfirmed()&&!!document.getElementById('v3743Understand')?.checked&&String(document.getElementById('v3743Token')?.value||'').trim().toUpperCase()===TOKEN;if(btn)btn.disabled=!ok}
  function openCenter(){
    if(!globalThis.requireTeacher?.('Làm sạch ngân hàng câu hỏi'))return;
    const body='<div id="v3743ResetBody"></div>',foot='<button class="btn btn-soft" onclick="closeModal()">Đóng</button>';
    globalThis.openModal?.('Làm sạch Ngân hàng câu hỏi','Reset an toàn • giữ nguyên ID6, lớp học và dữ liệu học sinh',body,foot);setTimeout(renderCenter,0)
  }
  async function checkpoint(){try{if(typeof globalThis.v21CreateRecoverySnapshot==='function')return await v21CreateRecoverySnapshot('before-clean-question-bank-v37.4.3',false);if(typeof globalThis.v26SafetyCheckpoint==='function')return await v26SafetyCheckpoint('bank-clean-v3743')}catch(err){console.warn(' checkpoint',err)}return null}
  async function verifyCloud(){
    if(!cloudMode())return {mode:'local-only',ok:true};
    try{
      const uid=firebaseUser.uid,q=await firebaseDb.collection('users').doc(uid).collection('questionBank').get(),r=await firebaseDb.collection('users').doc(uid).collection('recycleBinV26').get(),questionTrash=r.docs.filter(d=>(d.data()||{}).kind==='question').length;return {mode:'cloud',ok:q.empty&&questionTrash===0,questionDocs:q.size,questionTrashDocs:questionTrash}
    }catch(err){return {mode:'cloud',ok:false,error:err?.message||String(err)}}
  }
  async function commitCleanReset(){
    if(!globalThis.requireTeacher?.('Xóa sạch ngân hàng câu hỏi'))return;
    if(!backupConfirmed())return alert(' yêu cầu tải bản sao lưu trước khi xóa.');
    if(!document.getElementById('v3743Understand')?.checked||String(document.getElementById('v3743Token')?.value||'').trim().toUpperCase()!==TOKEN)return alert(`Chưa đủ xác nhận. Hãy nhập ${TOKEN}.`);
    const before=counts(),usingCloud=cloudMode();
    if(!usingCloud&&!confirm('Tài khoản Firebase giáo viên chưa đăng nhập.  chỉ có thể làm sạch trên máy này; câu cũ trên cloud có thể quay lại khi đăng nhập.\n\nVẫn tiếp tục làm sạch cục bộ?'))return;
    const snap=await checkpoint();if(!snap&&!confirm('Không tạo được Recovery Snapshot trong Data Safety, nhưng bản sao lưu JSON bắt buộc đã được tải. Tiếp tục xóa?'))return;
    recycle();
    applyLocalResetState(state); // active questions + question trash only; custom exam trash preserved
    state._meta=state._meta||{};
    state._meta.questionBankCleanBaselineV3743={at:new Date().toISOString(),removedQuestions:before.questions,removedQuestionTrash:before.trash,removedEmbeddedVersions:before.versions,seedBankDisabled:true,recoverySnapshotId:snap?.id||'',cloudRequested:usingCloud};
    delete state._meta.lastQuestionBankRestoreV371;
    try{localStorage.removeItem('math12hub2026_bank_before_restore')}catch(_){}
    try{if(typeof bulkLatexParsed!=='undefined')bulkLatexParsed=[]}catch(_){}
    try{if(typeof v29DuplicateCache!=='undefined')v29DuplicateCache.signature=''}catch(_){}
    save({sync:false,reason:'v3743-clean-question-bank-reset'});
    // Overwrite teacher rescue/latest-teacher with the new empty baseline so an old local rescue cannot silently repopulate the bank.
    try{if(typeof v21StashTeacherContent==='function')await v21StashTeacherContent('v3743-clean-reset');if(typeof v21MirrorStateNow==='function')await v21MirrorStateNow()}catch(err){console.warn(' refresh teacher vault baseline',err)}
    let cloud={mode:'local-only',ok:true};
    if(usingCloud){
      try{firebaseLastTeacherHash='';const ok=await firebasePushState(false,true);cloud=ok?await verifyCloud():{mode:'cloud',ok:false,error:'Đồng bộ Firebase không thành công.'}}catch(err){cloud={mode:'cloud',ok:false,error:err?.message||String(err)}}
    }
    state._meta.questionBankCleanBaselineV3743.cloudVerified=cloud.ok&&cloud.mode==='cloud';state._meta.questionBankCleanBaselineV3743.cloudStatus=cloud;save({sync:false,reason:'v3743-clean-reset-verified'});
    try{sessionStorage.removeItem(SESSION_KEY)}catch(_){}backupReady=false;
    closeModal?.();renderQuestionBank?.(true);renderAll?.();
    const base=`Đã làm sạch ngân hàng.\n\nĐã xóa: ${before.questions} câu hoạt động + ${before.trash} câu trong Thùng rác + ${before.versions} phiên bản cũ nhúng.\nĐề đã lưu, lớp học, học sinh và lịch sử học tập: GIỮ NGUYÊN.`;
    if(cloud.mode==='cloud'&&cloud.ok)alert(base+'\n\nCloud: đã kiểm tra sạch.\nNgân hàng mới hiện có 0 câu.');
    else if(cloud.mode==='cloud')alert(base+`\n\n⚠ Cloud chưa xác minh sạch: ${cloud.error||`${cloud.questionDocs||0} question docs, ${cloud.questionTrashDocs||0} trash docs`}.\nKhông nên tải lại trang cho tới khi đồng bộ lại Firebase.`);
    else alert(base+'\n\n⚠ Chỉ làm sạch trên máy. Hãy đăng nhập và đồng bộ để xóa bản cloud cũ.');
  }
  function patchMaintenanceButton(){
    const scope=document.querySelector('#page-question-bank .v371-tools-panel');if(!scope)return;
    const buttons=[...scope.querySelectorAll('button')],sample=buttons.find(b=>/Ngân hàng mẫu/i.test(b.textContent||''));if(sample){sample.textContent='🧹 Làm sạch ngân hàng';sample.setAttribute('onclick','v3743OpenCleanBankCenter()');sample.classList.add('v3743-clean-menu-btn')}
    const trash=buttons.find(b=>/Thùng rác/i.test(b.textContent||''));if(trash)trash.title=' chỉ xóa câu hỏi trong Thùng rác khi dùng quy trình Làm sạch ngân hàng.'
  }
  function patchEmptyState(){
    const table=document.getElementById('questionBankTable');if(!table||bank().length)return;const td=table.querySelector('td');if(td)td.innerHTML='<div class="bank-empty v3743-empty"><b>Ngân hàng mới đang trống.</b><span>Hãy Import LaTeX/.tex hoặc thêm câu mới theo Chương → Bài → Dạng → Mức độ → ID6.</span><div><button class="btn btn-blue" onclick="openBulkLatexImport()">⇧ Import LaTeX / .tex</button><button class="btn btn-soft" onclick="openQuestionEditor()">＋ Thêm câu hỏi</button></div></div>'
  }
  function patchRenderer(){if(typeof globalThis.renderQuestionBank==='function'&&!renderQuestionBank.__v3743){const base=renderQuestionBank;const wrapped=function(...a){const out=base.apply(this,a);setTimeout(()=>{patchMaintenanceButton();patchEmptyState()},0);return out};wrapped.__v3743=true;globalThis.renderQuestionBank=wrapped}}
  function regression(){const payload=backupPayload(),sample={questionBank:[{id:'OLD',_versions:[{version:1}]}],customExams:[{id:'EX1'}],questionHistory:[{questionId:'OLD'}],recycleBinV26:{questions:[{id:'TR1',kind:'question'}],customExams:[{id:'ET1',kind:'exam'}]}};applyLocalResetState(sample);const preserve={customExams:sample.customExams.length===1,classes:true,learningHistory:sample.questionHistory.length===1,customExamTrash:sample.recycleBinV26.customExams.length===1};const ok=Array.isArray(payload.questionBank)&&Array.isArray(payload.recycleBinQuestions)&&TOKEN==='XOA-SACH'&&sample.questionBank.length===0&&sample.recycleBinV26.questions.length===0&&Object.values(preserve).every(Boolean);return {ok,build:BUILD,seedBankDisabled:typeof V3743_SEED_BANK_DISABLED!=='undefined'?!!V3743_SEED_BANK_DISABLED:false,preserve}}
  function init(){patchMaintenanceButton();patchRenderer();setTimeout(()=>{patchMaintenanceButton();patchEmptyState()},300);globalThis.V3743_CLEAN_RESET_STATUS=regression()}

  globalThis.v3743OpenCleanBankCenter=openCenter;
  globalThis.v3743DownloadSafetyBackup=downloadSafetyBackup;
  globalThis.v3743RefreshCommitState=refreshCommitState;
  globalThis.v3743CommitCleanReset=commitCleanReset;
  globalThis.v3743CleanReset={BUILD,TOKEN,backupPayload,counts,verifyCloud,applyLocalResetState,_test:{regression}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
