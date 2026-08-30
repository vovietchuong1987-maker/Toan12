/* Math12 Hub V37.4.7 — Figure QC + Preview-before-Approved
   Additive layer on V37.4.6. Keeps legacy Approved questions intact, but any new
   approval (or changed figure on an Approved question) must pass QC and be visually verified. */
(function(){
'use strict';
const V='37.4.7', BUILD='37.4.7-figure-qc-preview-approved-gate';
const SUPPORTED=new Set(['none','tikz','tkz','tkztab','graph2d','oxyz']);
let editorSession={editId:'',verifiedHash:'',lastHash:'',lastResult:null,legacyUnchanged:false};
const now=()=>new Date().toISOString();
const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hasFigure=q=>!!String(q?.figureLatex||'').trim() && (q?.figureMode||'none')!=='none';
function sourceHash(q={}){
  if(!hasFigure(q))return 'figure-none';
  const raw=`${q.figureMode||'tikz'}|${String(q.figureLatex||'').replace(/\r\n?/g,'\n').trim()}`;
  if(window.V3745FigureEngine?.keyFor)return window.V3745FigureEngine.keyFor(raw);
  let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return 'fig-'+(h>>>0).toString(16);
}
function svgHasViewBox(svg=''){return /<svg\b[^>]*\bviewBox\s*=\s*["'][^"']+["']/i.test(String(svg||''))}
function qcQuestion(q={},opts={}){
  const checks=[],warnings=[],errors=[],mode=q.figureMode||((q.figureLatex||'').trim()?'tikz':'none'),hash=sourceHash({...q,figureMode:mode});
  const push=(name,ok,detail='',severity='error')=>{checks.push({name,ok,detail,severity});if(!ok)(severity==='warn'?warnings:errors).push(detail||name)};
  if(mode==='none'||!String(q.figureLatex||'').trim()){
    push('Không có hình',true,'Câu không có hình; không cần xác minh trực quan.');
    return {version:V,hash,mode:'none',kind:'none',checks,warnings,errors,pass:true,renderEngine:'none',needsVisualVerification:false};
  }
  push('Chế độ hình',SUPPORTED.has(mode),SUPPORTED.has(mode)?mode:`Chế độ không hỗ trợ: ${mode}`);
  push('Nguồn hình',String(q.figureLatex||'').trim().length>8,String(q.figureLatex||'').trim().length>8?'Có nguồn hình':'Mã/cấu hình hình quá ngắn');
  try{
    if(typeof window.validateQuestionLatexItem==='function'){
      const r=window.validateQuestionLatexItem({...q,figureMode:mode});
      const ferr=(r?.errors||[]).filter(Boolean),fwarn=(r?.warnings||[]).filter(Boolean);
      push('LaTeX validation',!ferr.length,ferr.length?ferr.join(' • '):'Không có lỗi LaTeX');
      if(fwarn.length){warnings.push(...fwarn);checks.push({name:'Cảnh báo LaTeX',ok:true,detail:fwarn.join(' • '),severity:'warn'})}
    }
  }catch(e){warnings.push('Không chạy được bộ kiểm tra LaTeX: '+(e?.message||e))}
  let renderEngine=q.figureRenderEngine||'',kind=window.V3745FigureEngine?.detectKind?.(q.figureLatex||'')||mode;
  if(mode==='tikz'||mode==='tkz'){
    const sanitized=q.figureSvg&&window.V3745FigureEngine?.sanitizeStoredSvg?.(q.figureSvg);
    const storedOk=!!sanitized && (!q.figureSourceHash||q.figureSourceHash===hash||q.figureSourceHash===window.V3745FigureEngine?.keyFor?.(String(q.figureLatex||'').trim()));
    if(storedOk){renderEngine='stored-svg';push('Stored SVG',true,'Có SVG đã biên dịch');push('SVG viewBox',svgHasViewBox(sanitized),'SVG cần viewBox để responsive/crop chính xác',svgHasViewBox(sanitized)?'error':'warn')}
    else {
      let native={ok:false};try{native=window.V3745FigureEngine?.smartNativeSvg?.(q.figureLatex||'')||{ok:false}}catch(_){}
      if(native.ok){renderEngine='native-svg';push('Smart Native SVG',true,`Dựng được ${Math.round(native.width||0)}×${Math.round(native.height||0)} px`)}
      else {renderEngine='tikzjax-fallback';push('TikZ fallback',true,'Sẽ dùng TikZJax fallback', 'warn');warnings.push('Hình cần kiểm tra trực quan kỹ vì đang dùng TikZJax fallback.')}
    }
  } else if(mode==='tkztab'){
    let d=null;try{d=window.parseTkzTabFigure?.(q.figureLatex||'')}catch(_){}
    const rows=d?.rows?.length||0;push('Parse tkz-tab',!!d?.ok,d?.ok?`BBT ${rows} dòng`:'Không đọc được tkz-tab');
    push('Cấu trúc BBT',rows===2||rows===3,rows===2||rows===3?`${rows} dòng được V37.4.5+ hỗ trợ`:`Số dòng chưa hỗ trợ: ${rows}`);
    renderEngine=rows===2?'native-tkztab-2row':'native-tkztab';kind='table';
  } else {
    let html='';try{html=window.questionFigureHTML?.(q,true)||''}catch(_){}
    push('Renderer cấu hình',!!html,html?'Có đầu ra renderer':'Renderer không tạo được đầu ra');renderEngine=mode+'-native';
  }
  const layoutReady=!!window.V3746FigureLayout;push('Responsive layout',layoutReady,layoutReady?'Auto-crop/Responsive V37.4.6 sẵn sàng':'Thiếu Figure Layout V37.4.6','warn');if(!layoutReady)warnings.push('Thiếu lớp responsive V37.4.6.');
  const pass=!errors.length;
  return {version:V,hash,mode,kind,checks,warnings:[...new Set(warnings)],errors:[...new Set(errors)],pass,renderEngine,needsVisualVerification:true};
}
function editorDraft(){try{return window.readQuestionEditorDraft?.()||{}}catch(_){return {}}}
function oldQuestion(id=''){return id?(state?.questionBank||[]).find(q=>q.id===id):null}
function resultList(r){return (r?.checks||[]).map(c=>`<li class="${c.ok?'ok':'bad'}"><b>${c.ok?'✓':'!'}</b><span>${escHtml(c.name)}${c.detail?`<small>${escHtml(c.detail)}</small>`:''}</span></li>`).join('')}
function renderEditorPanel(runVisual=false){
  const panel=document.getElementById('v3747FigureQC');if(!panel)return null;const d=editorDraft(),hash=sourceHash(d),r=qcQuestion(d);editorSession.lastHash=hash;editorSession.lastResult=r;
  if(editorSession.verifiedHash&&editorSession.verifiedHash!==hash)editorSession.verifiedHash='';
  const old=oldQuestion(editorSession.editId),oldHash=old?sourceHash(old):'';editorSession.legacyUnchanged=!!(old?.reviewStatus==='approved'&&oldHash===hash&&!old?.figureQC?.verified);
  const verified=!r.needsVisualVerification||editorSession.verifiedHash===hash||!!(old?.figureQC?.verified&&old.figureQC?.sourceHash===hash);
  let visual='';if(runVisual&&hasFigure(d)){try{visual=window.questionFigureHTML?.(d,true)||''}catch(e){visual=`<div class="v3747-qc-error">${escHtml(e?.message||e)}</div>`}}
  const stateClass=!r.pass?'bad':verified?'verified':editorSession.legacyUnchanged?'legacy':'pending';
  const stateText=!r.pass?'QC chưa đạt':verified?'Đã xác minh hình':'Approved cũ • chưa có dấu QC V37.4.7';
  panel.innerHTML=`<div class="v3747-qc-head"><div><b>Figure QC • V37.4.7</b><small>Preview trước Approved • hash ${escHtml(hash.slice(-10))}</small></div><span class="v3747-qc-state ${stateClass}">${stateText}</span></div><ul class="v3747-qc-list">${resultList(r)}</ul>${r.warnings.length?`<div class="v3747-qc-warn"><b>Cảnh báo:</b> ${r.warnings.map(escHtml).join(' • ')}</div>`:''}<div class="v3747-qc-actions"><button type="button" class="btn btn-soft" onclick="v3747RunEditorFigureQC()">Kiểm tra & xem hình</button>${r.needsVisualVerification?`<button type="button" class="btn btn-blue" ${!r.pass?'disabled':''} onclick="v3747VerifyEditorFigure()">✓ Hình đúng</button>`:''}</div>${runVisual&&hasFigure(d)?`<div class="v3747-qc-visual"><div class="v3747-qc-visual-title">Hình sẽ hiển thị cho học sinh</div>${visual||'<div class="v3747-qc-error">Không tạo được preview hình.</div>'}</div>`:''}<div class="v3747-qc-note">Khi mã hình thay đổi, xác minh cũ tự mất hiệu lực. Câu mới/chuyển sang <b>Approved</b> có hình bắt buộc phải bấm “✓ Hình đúng”.</div>`;
  if(runVisual){try{window.typesetMath?.(panel);setTimeout(()=>window.V3746FigureLayout?.scan?.(panel),60)}catch(_){}}
  return {r,hash,verified};
}
function injectEditor(id=''){
  editorSession={editId:id||'',verifiedHash:'',lastHash:'',lastResult:null,legacyUnchanged:false};
  const x=oldQuestion(id);if(x?.figureQC?.verified&&x.figureQC.sourceHash===sourceHash(x))editorSession.verifiedHash=x.figureQC.sourceHash;
  const select=document.getElementById('qeReviewStatus');if(select){
    if(![...select.options].some(o=>o.value==='approved'))select.insertAdjacentHTML('beforeend','<option value="approved">Approved • sẵn sàng sử dụng</option>');
    if(x?.reviewStatus==='approved')select.value='approved';
  }
  const preview=document.getElementById('qePreview');if(preview&&!document.getElementById('v3747FigureQC'))preview.insertAdjacentHTML('afterend','<div id="v3747FigureQC" class="v3747-qc-panel"></div>');
  ['qeFigureMode','qeFigureLatex'].forEach(k=>document.getElementById(k)?.addEventListener('input',()=>renderEditorPanel(false)));
  select?.addEventListener('change',()=>renderEditorPanel(false));
  renderEditorPanel(false);
}
function verifyEditor(){
  const out=renderEditorPanel(true);if(!out?.r?.pass){alert('Figure QC chưa đạt. Hãy sửa các lỗi màu đỏ trước khi xác minh.');return false}
  if(out.r.needsVisualVerification){const visual=document.querySelector('#v3747FigureQC .v3747-qc-visual .latex-figure, #v3747FigureQC .v3747-qc-visual svg, #v3747FigureQC .v3747-qc-visual iframe, #v3747FigureQC .v3747-qc-visual .tkztab-native');if(!visual){alert('Chưa có hình thực tế để xác minh. Hãy bấm “Kiểm tra & xem hình” và kiểm tra renderer.');return false}}
  editorSession.verifiedHash=out.hash;renderEditorPanel(true);return true;
}
function qcMetaFor(q={},verified=false,legacy=false){const r=qcQuestion(q),h=r.hash;return {version:V,status:r.mode==='none'?'not-required':verified?'verified':legacy?'legacy-approved':r.pass?'needs-visual-review':'failed',verified:!!verified,verifiedAt:verified?now():'',sourceHash:h,mode:r.mode,kind:r.kind,renderEngine:r.renderEngine,pass:r.pass,errors:r.errors,warnings:r.warnings,checkedAt:now()}}
function patchApprovalModel(){
  if(typeof window.v29NormalizeQuestion==='function'){
    const base=window.v29NormalizeQuestion;window.v29NormalizeQuestion=function(q={}){const wanted=q.reviewStatus==='approved';const x=base(q);if(wanted)x.reviewStatus='approved';return x};
  }
  if(typeof window.v29ReviewName==='function'){window.v29ReviewName=s=>s==='approved'?'Approved':s==='reviewed'?'Đã duyệt chuyên môn':'Bản nháp'}
  if(typeof window.v29QuestionQuality==='function'){
    const base=window.v29QuestionQuality;window.v29QuestionQuality=function(q={}){const r=base(q);if(q.reviewStatus==='approved'&&r.issues?.includes('Chưa duyệt')){r.issues=r.issues.filter(x=>x!=='Chưa duyệt');r.score=Math.min(100,r.score+5);r.status=r.score>=90?'good':r.score>=75?'warn':'bad'}return r}
  }
}
function patchEditor(){
  if(typeof window.openQuestionEditor==='function'){
    const baseOpen=window.openQuestionEditor;window.openQuestionEditor=function(id=''){baseOpen(id);injectEditor(id)};
  }
  if(typeof window.saveQuestionEditor==='function'){
    const baseSave=window.saveQuestionEditor;window.saveQuestionEditor=function(editId=''){
      const desired=document.getElementById('qeReviewStatus')?.value||'draft',draft=editorDraft(),hash=sourceHash(draft),old=oldQuestion(editId),oldHash=old?sourceHash(old):'',unchangedApproved=!!(old?.reviewStatus==='approved'&&oldHash===hash),sessionVerified=editorSession.verifiedHash===hash||!!(old?.figureQC?.verified&&old.figureQC.sourceHash===hash);
      const r=qcQuestion(draft);
      if(desired==='approved'&&r.needsVisualVerification&&!unchangedApproved&&!sessionVerified){renderEditorPanel(true);alert('Trước khi chuyển câu có hình sang Approved, hãy kiểm tra preview và bấm “✓ Hình đúng”.');return}
      if(desired==='approved'&&!r.pass){renderEditorPanel(true);alert('Figure QC chưa đạt nên chưa thể Approved câu này.');return}
      const before=Number(state?._meta?.revision)||0,typed=(document.getElementById('qeId')?.value||'').trim().replace(/[^A-Za-z0-9._-]/g,'-');baseSave(editId);if((Number(state?._meta?.revision)||0)<=before)return;
      const id=typed||editId;let idx=id?(state.questionBank||[]).findIndex(q=>q.id===id):-1;if(idx<0&&!editId)idx=0;if(idx<0)return;const q=state.questionBank[idx],newHash=sourceHash(q),sameOld=!!(old&&oldHash===newHash);
      if(sameOld&&old?.figureSvg&&!q.figureSvg){q.figureSvg=old.figureSvg;q.figureSourceHash=old.figureSourceHash||newHash;q.figureRenderEngine=old.figureRenderEngine||q.figureRenderEngine;q.figureRenderVersion=old.figureRenderVersion||q.figureRenderVersion}
      if(!sameOld&&hasFigure(q)){delete q.figureSvg;q.figureSourceHash=newHash;const native=window.V3745FigureEngine?.smartNativeSvg?.(q.figureLatex||'');q.figureRenderEngine=native?.ok?'native-svg':(q.figureMode==='tkztab'?'native-tkztab':'tikzjax-pending');q.figureRenderVersion=V}
      const verified=editorSession.verifiedHash===newHash||!!(old?.figureQC?.verified&&sameOld&&old.figureQC.sourceHash===newHash),legacy=!!(unchangedApproved&&!verified);q.reviewStatus=desired;q.figureStatus=hasFigure(q)?(verified?'verified':legacy?'legacy-approved':'needs-review'):'not-required';q.figureQC=qcMetaFor(q,verified,legacy);q.updatedAt=now();
      window.save?.({reason:'v3747-figure-qc'});window.renderQuestionBank?.(true);
    };
  }
}
function bankStats(){
  const bank=state?.questionBank||[];let figures=0,verified=0,legacy=0,needs=0,failed=0,approved=0,approvedUnverified=0;
  bank.forEach(q=>{if(q.reviewStatus==='approved')approved++;if(!hasFigure(q))return;figures++;const r=qcQuestion(q);if(!r.pass)failed++;const ok=!!(q.figureQC?.verified&&q.figureQC.sourceHash===sourceHash(q));if(ok)verified++;else if(q.reviewStatus==='approved'&&!q.figureQC?.verified){legacy++;approvedUnverified++}else needs++});return {total:bank.length,figures,verified,legacy,needs,failed,approved,approvedUnverified}
}
function audit(){
  if(typeof window.requireTeacher==='function'&&!window.requireTeacher('Figure QC V37.4.7'))return;const s=bankStats(),rows=(state?.questionBank||[]).filter(hasFigure).map(q=>({q,r:qcQuestion(q),verified:!!(q.figureQC?.verified&&q.figureQC.sourceHash===sourceHash(q))}));const bad=rows.filter(x=>!x.r.pass).slice(0,20),pending=rows.filter(x=>x.r.pass&&!x.verified).slice(0,20);
  const table=list=>list.length?`<div class="v3747-audit-list">${list.map(x=>`<button onclick="closeModal();openQuestionEditor('${escHtml(x.q.id)}')"><b>${escHtml(x.q.id)}</b><span>${escHtml(x.q.figureMode||'')} • ${x.r.pass?'chưa xác minh':'QC lỗi'}</span></button>`).join('')}</div>`:'<div class="math-help">Không có câu trong nhóm này.</div>';
  const body=`<div class="v3747-audit-grid"><div><b>${s.total}</b><small>Tổng câu</small></div><div><b>${s.figures}</b><small>Có hình</small></div><div><b>${s.verified}</b><small>Đã xác minh</small></div><div><b>${s.legacy}</b><small>Approved cũ</small></div><div><b>${s.needs}</b><small>Cần xem hình</small></div><div><b>${s.failed}</b><small>QC lỗi</small></div><div><b>${s.approved}</b><small>Approved</small></div><div><b>${s.approvedUnverified}</b><small>Approved chưa QC mới</small></div></div><h4>QC lỗi</h4>${table(bad)}<h4>Cần xác minh trực quan / Approved cũ</h4>${table(pending)}<div class="math-help mt"><b>Nguyên tắc V37.4.7:</b> không hạ trạng thái các câu Approved cũ. Nhưng nếu hình bị thay đổi hoặc câu mới được chuyển sang Approved, hệ thống bắt buộc chạy QC và xác nhận preview.</div>`;
  window.openModal?.('Figure QC • V37.4.7','Preview trước Approved • kiểm tra toàn ngân hàng',body,`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`);
}
function regression(){const sample={figureMode:'tikz',figureLatex:'\\begin{tikzpicture}[scale=.88,>=stealth]\\draw[->](-3.2,0)--(3.2,0) node[below]{$x$};\\draw[->](0,-2.8)--(0,2.8) node[right]{$y$};\\draw[dashed](-1,-2.8)--(-1,2.8);\\draw[dashed](-3,-1)--(3,-1);\\draw[thick,samples=100,domain=-3:-1.12] plot(\\x,{-\\x/(\\x+1)});\\draw[thick,samples=100,domain=-.88:3] plot(\\x,{-\\x/(\\x+1)});\\end{tikzpicture}'};const r=qcQuestion(sample);return {ok:r.pass&&r.needsVisualVerification&&!!r.hash,detail:`${r.renderEngine} • ${r.errors.length} lỗi • ${r.warnings.length} cảnh báo`}}
function patchProductionChecks(){if(typeof window.v35RunRegressionChecks!=='function')return;const base=window.v35RunRegressionChecks;window.v35RunRegressionChecks=function(opts={}){const res=base(opts);try{const rr=regression(),exists=res?.checks?.some(x=>x.name==='Figure QC V37.4.7');if(res?.checks&&!exists){res.checks.push({name:'Figure QC V37.4.7',ok:rr.ok,detail:rr.ok?'Preview-before-Approved gate • source hash invalidation • legacy-safe':'Figure QC regression chưa đạt',level:rr.ok?'pass':'fail'});res.pass=res.checks.filter(x=>x.level==='pass').length;res.warn=res.checks.filter(x=>x.level==='warn').length;res.fail=res.checks.filter(x=>x.level==='fail').length;if(opts.render!==false)window.v35RenderProductionCenter?.()}}catch(_){}return res}}
patchApprovalModel();patchEditor();patchProductionChecks();
window.v3747RunEditorFigureQC=()=>renderEditorPanel(true);
window.v3747VerifyEditorFigure=verifyEditor;
window.v3747OpenFigureQC=audit;
window.V3747FigureQC={version:V,build:BUILD,sourceHash,qcQuestion,bankStats,audit,regression};
})();
