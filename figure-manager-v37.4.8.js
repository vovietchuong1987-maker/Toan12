/* Math12 Hub V37.4.8 — Bulk Figure Manager & Re-render Center
   Additive layer on V37.4.7. Does not change mathematical source content.
   Bulk operations never auto-verify a figure visually. */
(function(){
'use strict';
const V='37.4.8', BUILD='37.4.8-bulk-figure-manager-rerender-center';
const ui={query:'',status:'all',mode:'all',engine:'all',selected:new Set(),busy:false,lastUndo:null,lastSummary:null};
const now=()=>new Date().toISOString();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=s=>esc(s).replace(/`/g,'&#96;');
const bank=()=>window.state?.questionBank||[];
const hasFigure=q=>!!String(q?.figureLatex||'').trim()&&(q?.figureMode||'none')!=='none';
const fq=()=>window.V3747FigureQC;
const fe=()=>window.V3745FigureEngine;
const clone=x=>{try{return structuredClone(x)}catch(_){return JSON.parse(JSON.stringify(x))}};
function sourceHash(q){return fq()?.sourceHash?.(q)||'figure-none'}
function qc(q){return fq()?.qcQuestion?.(q)||{pass:false,errors:['Thiếu Figure QC V37.4.7'],warnings:[],mode:q?.figureMode||'none',kind:'',renderEngine:q?.figureRenderEngine||''}}
function verified(q){return !!(q?.figureQC?.verified&&q.figureQC.sourceHash===sourceHash(q))}
function renderer(q,r){if(q?.figureSvg&&fe()?.sanitizeStoredSvg?.(q.figureSvg))return 'stored-svg';return String(q?.figureRenderEngine||r?.renderEngine||'unknown')}
function rowInfo(q){
  const r=qc(q),v=verified(q),eng=renderer(q,r);let status='pending';
  if(!r.pass)status='failed';else if(v)status='verified';else if(q.reviewStatus==='approved'&&q.figureQC?.status==='legacy-approved')status='legacy';else if(q.reviewStatus==='approved'&&!q.figureQC?.verified)status='legacy';
  return {q,r,v,eng,status,hash:sourceHash(q)};
}
function cacheKey(q){return `${q.id}|${sourceHash(q)}|${q.figureRenderEngine||''}|${q.figureQC?.checkedAt||''}`}
let rowCache=new Map();
function info(q,force=false){const k=cacheKey(q);if(!force&&rowCache.has(k))return rowCache.get(k);const x=rowInfo(q);rowCache.set(k,x);return x}
function invalidate(){rowCache=new Map()}
function allRows(){return bank().filter(hasFigure).map(q=>info(q))}
function filteredRows(){
  const qq=ui.query.trim().toLowerCase();return allRows().filter(x=>{
    if(ui.status!=='all'&&x.status!==ui.status)return false;
    if(ui.mode!=='all'&&(x.q.figureMode||'none')!==ui.mode)return false;
    if(ui.engine!=='all'){
      if(ui.engine==='stored'&&!/stored/i.test(x.eng))return false;
      if(ui.engine==='native'&&!/(native|smart)/i.test(x.eng))return false;
      if(ui.engine==='fallback'&&!/(tikzjax|fallback|pending)/i.test(x.eng))return false;
    }
    if(qq&&!`${x.q.id} ${x.q.sourceName||''} ${x.q.id6||''} ${x.q.question||''}`.toLowerCase().includes(qq))return false;
    return true;
  });
}
function stats(){const rows=allRows(),out={figures:rows.length,verified:0,legacy:0,pending:0,failed:0,stored:0,native:0,fallback:0};rows.forEach(x=>{out[x.status]=(out[x.status]||0)+1;if(/stored/i.test(x.eng))out.stored++;else if(/tikzjax|fallback|pending/i.test(x.eng))out.fallback++;else out.native++});return out}
function qcMeta(q,r,keepVerified=false){const h=sourceHash(q),isVerified=keepVerified&&r.pass;return {version:V,status:r.mode==='none'?'not-required':isVerified?'verified':r.pass?'needs-visual-review':'failed',verified:isVerified,verifiedAt:isVerified?(q.figureQC?.verifiedAt||now()):'',sourceHash:h,mode:r.mode,kind:r.kind,renderEngine:r.renderEngine,pass:r.pass,errors:r.errors||[],warnings:r.warnings||[],checkedAt:now(),bulkChecked:true}}
function snap(q){return {id:q.id,figureSvg:q.figureSvg,figureSourceHash:q.figureSourceHash,figureRenderEngine:q.figureRenderEngine,figureRenderVersion:q.figureRenderVersion,figureKind:q.figureKind,figureDisplay:clone(q.figureDisplay),figureQC:clone(q.figureQC),figureStatus:q.figureStatus,updatedAt:q.updatedAt}}
function restoreSnap(s){const q=bank().find(x=>x.id===s.id);if(!q)return false;['figureSvg','figureSourceHash','figureRenderEngine','figureRenderVersion','figureKind','figureDisplay','figureQC','figureStatus','updatedAt'].forEach(k=>{if(s[k]===undefined)delete q[k];else q[k]=clone(s[k])});return true}
function selectedRows(){const ids=ui.selected;return bank().filter(q=>ids.has(q.id)&&hasFigure(q))}
function selectAllFiltered(){ui.selected=new Set(filteredRows().map(x=>x.q.id));renderManager()}
function clearSelection(){ui.selected.clear();renderManager()}
function setFilter(name,value){if(name==='query')ui.query=value;else if(name==='status')ui.status=value;else if(name==='mode')ui.mode=value;else if(name==='engine')ui.engine=value;renderManager()}
function toggle(id,on){on?ui.selected.add(id):ui.selected.delete(id);updateSelectionLabel()}
function updateSelectionLabel(){const el=document.getElementById('v3748SelectedCount');if(el)el.textContent=`Đã chọn ${ui.selected.size}`}
function statusLabel(x){return x.status==='verified'?'Đã xác minh':x.status==='failed'?'QC lỗi':x.status==='legacy'?'Approved cũ':'Cần xem hình'}
function rowHtml(x){const q=x.q,checked=ui.selected.has(q.id);return `<tr class="v3748-row ${x.status}"><td><input type="checkbox" ${checked?'checked':''} onchange="v3748ToggleFigure('${attr(q.id)}',this.checked)"></td><td><button class="v3748-id" onclick="closeModal();openQuestionEditor('${attr(q.id)}')"><b>${esc(q.id)}</b><small>${esc(q.id6||'')} • ${esc(q.sourceName||'')}</small></button></td><td><span class="v3748-chip">${esc(q.figureMode||'')}</span><small>${esc(x.r.kind||'')}</small></td><td><span class="v3748-engine">${esc(x.eng)}</span></td><td><span class="v3748-state ${x.status}">${esc(statusLabel(x))}</span>${x.r.warnings?.length?`<small>${x.r.warnings.length} cảnh báo</small>`:''}</td><td><div class="v3748-row-actions"><button onclick="v3748PreviewFigure('${attr(q.id)}')">Xem</button><button onclick="closeModal();openQuestionEditor('${attr(q.id)}')">Sửa</button></div></td></tr>`}
function managerBody(){
  const s=stats(),rows=filteredRows(),shown=rows.slice(0,160),modes=[...new Set(allRows().map(x=>x.q.figureMode||'none'))].sort();
  return `<div class="v3748-manager">
    <div class="v3748-stats"><div><b>${s.figures}</b><small>Có hình</small></div><div><b>${s.verified}</b><small>Đã xác minh</small></div><div><b>${s.legacy}</b><small>Approved cũ</small></div><div><b>${s.pending}</b><small>Cần xem</small></div><div><b>${s.failed}</b><small>QC lỗi</small></div><div><b>${s.stored}</b><small>Stored SVG</small></div><div><b>${s.native}</b><small>Native/Smart</small></div><div><b>${s.fallback}</b><small>Fallback</small></div></div>
    <div class="v3748-filters"><input value="${attr(ui.query)}" oninput="v3748SetFigureFilter('query',this.value)" placeholder="Tìm ID, ID6, nguồn, nội dung..."><select onchange="v3748SetFigureFilter('status',this.value)"><option value="all">Mọi trạng thái</option>${[['verified','Đã xác minh'],['pending','Cần xem'],['legacy','Approved cũ'],['failed','QC lỗi']].map(a=>`<option value="${a[0]}" ${ui.status===a[0]?'selected':''}>${a[1]}</option>`).join('')}</select><select onchange="v3748SetFigureFilter('mode',this.value)"><option value="all">Mọi loại hình</option>${modes.map(m=>`<option value="${attr(m)}" ${ui.mode===m?'selected':''}>${esc(m)}</option>`).join('')}</select><select onchange="v3748SetFigureFilter('engine',this.value)"><option value="all">Mọi engine</option><option value="stored" ${ui.engine==='stored'?'selected':''}>Stored SVG</option><option value="native" ${ui.engine==='native'?'selected':''}>Native / Smart</option><option value="fallback" ${ui.engine==='fallback'?'selected':''}>Fallback / Pending</option></select></div>
    <div class="v3748-toolbar"><span id="v3748SelectedCount">Đã chọn ${ui.selected.size}</span><button onclick="v3748SelectAllFigures()">Chọn tất cả đang lọc (${rows.length})</button><button onclick="v3748ClearFigureSelection()">Bỏ chọn</button><button onclick="v3748ExportFigureQC()">Xuất QC CSV</button></div>
    <div class="v3748-bulk-actions"><button class="btn btn-blue" onclick="v3748BulkFigureAction('qc')">✓ QC lại</button><button class="btn btn-blue" onclick="v3748BulkFigureAction('render')">◈ Tạo Smart SVG</button><button class="btn btn-soft" onclick="v3748BulkFigureAction('layout')">▣ Chuẩn hóa layout</button><button class="btn btn-soft" onclick="v3748BulkFigureAction('review')">👁 Đánh dấu cần xem</button><button class="btn btn-soft" onclick="v3748UndoFigureBatch()" ${ui.lastUndo?'':'disabled'}>↶ Hoàn tác lô gần nhất</button><button class="btn btn-danger" onclick="v3748BulkFigureAction('clear-svg')">Xóa cache SVG</button></div>
    <div class="v3748-progress ${ui.busy?'show':''}"><div class="v3748-progress-bar"><i id="v3748ProgressFill" style="width:0%"></i></div><span id="v3748ProgressText">Đang xử lý...</span></div>
    <div class="v3748-result">${ui.lastSummary?esc(ui.lastSummary):'Các thao tác theo lô chỉ thay metadata/cache hình, không sửa nội dung toán học. V37.4.8 không tự bấm “Hình đúng” thay giáo viên.'}</div>
    <div class="v3748-table-wrap"><table class="v3748-table"><thead><tr><th></th><th>Câu hỏi</th><th>Loại</th><th>Engine</th><th>QC</th><th></th></tr></thead><tbody>${shown.map(rowHtml).join('')||'<tr><td colspan="6"><div class="math-help">Không có hình phù hợp bộ lọc.</div></td></tr>'}</tbody></table></div>${rows.length>shown.length?`<div class="math-help">Đang hiển thị 160/${rows.length} bản ghi. “Chọn tất cả đang lọc” vẫn áp dụng cho toàn bộ ${rows.length} hình.</div>`:''}
  </div>`;
}
function renderManager(){const body=document.getElementById('modalBody');if(!body||!document.querySelector('.v3748-manager'))return;body.innerHTML=managerBody()}
function open(){if(typeof window.requireTeacher==='function'&&!window.requireTeacher('Trung tâm Hình vẽ V37.4.8'))return;invalidate();window.openModal?.('Trung tâm Hình vẽ • V37.4.8','QC hàng loạt • Smart SVG • re-render • rollback an toàn',managerBody(),`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)}
function preview(id){const q=bank().find(x=>x.id===id);if(!q)return;let html='';try{html=window.questionFigureHTML?.(q,false)||''}catch(e){html=`<div class="math-help">${esc(e?.message||e)}</div>`}window.openModal?.(`Hình • ${esc(id)}`,`${esc(q.figureMode||'')} • ${esc(renderer(q,qc(q)))}`,`<div class="v3748-preview">${html||'<div class="math-help">Không tạo được hình preview.</div>'}</div><div class="math-help mt">V37.4.8 chỉ xem/render lại cache; xác minh trực quan vẫn thực hiện trong trình sửa câu hỏi V37.4.7.</div>`,`<button class="btn btn-soft" onclick="closeModal();v3748OpenFigureManager()">← Trung tâm hình</button><button class="btn btn-blue" onclick="closeModal();openQuestionEditor('${attr(id)}')">Mở trình sửa</button>`);setTimeout(()=>{try{window.typesetMath?.(document.getElementById('modalBody'));window.V3746FigureLayout?.scan?.(document.getElementById('modalBody'))}catch(_){}},80)}
function updateProgress(done,total,label=''){const fill=document.getElementById('v3748ProgressFill'),txt=document.getElementById('v3748ProgressText'),p=total?Math.round(done*100/total):100;if(fill)fill.style.width=p+'%';if(txt)txt.textContent=`${label||'Đang xử lý'} • ${done}/${total} (${p}%)`}
function yieldUi(){return new Promise(r=>requestAnimationFrame(()=>r()))}
async function action(type){
  if(ui.busy)return;const rows=selectedRows();if(!rows.length){alert('Hãy chọn ít nhất một câu có hình.');return}
  const labels={qc:'QC lại',render:'Tạo Smart SVG',layout:'Chuẩn hóa layout',review:'Đánh dấu cần xem','clear-svg':'Xóa cache SVG'};
  if(type==='clear-svg'&&!confirm(`Xóa cache SVG của ${rows.length} câu đã chọn? Mã TikZ/LaTeX gốc vẫn được giữ nguyên.`))return;
  if(type==='review'&&!confirm(`Thu hồi dấu xác minh hình của ${rows.length} câu đã chọn để yêu cầu xem lại? Trạng thái Approved của câu không bị hạ.`))return;
  ui.busy=true;ui.lastUndo={type,at:now(),rows:rows.map(snap)};ui.lastSummary='';renderManager();let changed=0,skipped=0,failed=0;
  for(let i=0;i<rows.length;i++){
    const q=rows[i];try{
      if(type==='qc'){
        const r=qc(q),keep=verified(q);q.figureQC=qcMeta(q,r,keep);q.figureStatus=keep?'verified':r.pass?(q.reviewStatus==='approved'?'legacy-approved':'needs-review'):'failed';changed++;
      }else if(type==='render'){
        if(!['tikz','tkz'].includes(q.figureMode||'')){skipped++}
        else {const r=fe()?.smartNativeSvg?.(q.figureLatex||'');if(!r?.ok){failed++}
        else {q.figureSvg=r.svg;q.figureSourceHash=fe()?.keyFor?.(q.figureLatex||'')||'';q.figureRenderEngine='stored-svg';q.figureRenderVersion=V;q.figureKind=r.kind||fe()?.detectKind?.(q.figureLatex||'')||'tikz';q.figureDisplay=q.figureDisplay||{maxWidth:q.figureKind==='graph-oxy'?520:680,maxHeight:q.figureKind==='graph-oxy'?390:480,align:'center',scale:1,crop:'tight'};const rr=qc(q),keep=verified(q);q.figureQC=qcMeta(q,rr,keep);q.figureStatus=keep?'verified':rr.pass?'needs-review':'failed';changed++;}}
      }else if(type==='layout'){
        const kind=q.figureKind||fe()?.detectKind?.(q.figureLatex||'')||(q.figureMode==='tkztab'?'table':'tikz');q.figureKind=kind;q.figureDisplay={maxWidth:Number(q.figureDisplay?.maxWidth)||(kind==='graph-oxy'?520:680),maxHeight:Number(q.figureDisplay?.maxHeight)||(kind==='graph-oxy'?390:480),align:['left','right','center'].includes(q.figureDisplay?.align)?q.figureDisplay.align:'center',scale:Math.max(.55,Math.min(1.8,Number(q.figureDisplay?.scale)||1)),crop:q.figureDisplay?.crop==='none'?'none':'tight'};changed++;
      }else if(type==='review'){
        const r=qc(q);q.figureQC=qcMeta(q,r,false);q.figureStatus=r.pass?'needs-review':'failed';changed++;
      }else if(type==='clear-svg'){
        delete q.figureSvg;delete q.figureSourceHash;if(['tikz','tkz'].includes(q.figureMode||'')){const r=fe()?.smartNativeSvg?.(q.figureLatex||'');q.figureRenderEngine=r?.ok?'smart-native-svg':'tikzjax-pending'}else if(q.figureMode==='tkztab')q.figureRenderEngine='native-tkztab';q.figureRenderVersion=V;changed++;
      }
      q.updatedAt=now();
    }catch(_){failed++}
    if((i+1)%16===0||i===rows.length-1){updateProgress(i+1,rows.length,labels[type]);await yieldUi()}
  }
  if(changed){window.save?.({reason:`v3748-bulk-figure-${type}`});window.renderQuestionBank?.(true)}
  invalidate();ui.busy=false;ui.lastSummary=`${labels[type]}: ${changed} đã cập nhật${skipped?` • ${skipped} bỏ qua`:''}${failed?` • ${failed} chưa xử lý được`:''}. Không thay đổi mã hình gốc.`;renderManager();
}
function undo(){if(ui.busy||!ui.lastUndo)return;const u=ui.lastUndo;if(!confirm(`Hoàn tác lô “${u.type}” gần nhất (${u.rows.length} câu)?`))return;let n=0;u.rows.forEach(s=>{if(restoreSnap(s))n++});if(n){window.save?.({reason:'v3748-undo-bulk-figure'});window.renderQuestionBank?.(true)}ui.lastUndo=null;ui.lastSummary=`Đã hoàn tác ${n} câu của lô gần nhất.`;invalidate();renderManager()}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function exportCsv(){const rows=filteredRows(),head=['id','id6','sourceName','figureMode','engine','qcStatus','verified','qcPass','warnings','errors','reviewStatus'];let text='\uFEFF'+head.join(',')+'\n'+rows.map(x=>[x.q.id,x.q.id6||'',x.q.sourceName||'',x.q.figureMode||'',x.eng,x.status,x.v?'yes':'no',x.r.pass?'yes':'no',(x.r.warnings||[]).join(' | '),(x.r.errors||[]).join(' | '),x.q.reviewStatus||''].map(csvCell).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download=`math12-figure-qc-v37.4.8-${rows.length}-hinh.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function regression(){const sample={id:'V3748-SAMPLE',figureMode:'tikz',figureLatex:'\\begin{tikzpicture}[scale=.88,>=stealth]\\draw[->](-3.2,0)--(3.2,0) node[below]{$x$};\\draw[->](0,-2.8)--(0,2.8) node[right]{$y$};\\draw[dashed](-1,-2.8)--(-1,2.8);\\draw[dashed](-3,-1)--(3,-1);\\draw[thick,samples=100,domain=-3:-1.12] plot(\\x,{-\\x/(\\x+1)});\\draw[thick,samples=100,domain=-.88:3] plot(\\x,{-\\x/(\\x+1)});\\end{tikzpicture}',reviewStatus:'draft'};const native=fe()?.smartNativeSvg?.(sample.figureLatex),r=qc(sample);return {ok:!!native?.ok&&!!r?.pass&&typeof action==='function'&&typeof undo==='function',width:native?.width||0,height:native?.height||0}}
function patchProductionChecks(){if(typeof window.v35RunRegressionChecks!=='function')return;const base=window.v35RunRegressionChecks;window.v35RunRegressionChecks=function(opts={}){const res=base(opts);try{const rr=regression(),exists=res?.checks?.some(x=>x.name==='Bulk Figure Manager V37.4.8');if(res?.checks&&!exists){res.checks.push({name:'Bulk Figure Manager V37.4.8',ok:rr.ok,detail:rr.ok?`Batch QC • Smart SVG • layout normalize • rollback • sample ${rr.width}×${rr.height}`:'Bulk Figure Manager regression chưa đạt',level:rr.ok?'pass':'fail'});res.pass=res.checks.filter(x=>x.level==='pass').length;res.warn=res.checks.filter(x=>x.level==='warn').length;res.fail=res.checks.filter(x=>x.level==='fail').length;if(opts.render!==false)window.v35RenderProductionCenter?.()}}catch(_){}return res}}
patchProductionChecks();
window.v3748OpenFigureManager=open;window.v3748SetFigureFilter=setFilter;window.v3748ToggleFigure=toggle;window.v3748SelectAllFigures=selectAllFiltered;window.v3748ClearFigureSelection=clearSelection;window.v3748BulkFigureAction=action;window.v3748UndoFigureBatch=undo;window.v3748PreviewFigure=preview;window.v3748ExportFigureQC=exportCsv;
window.V3748FigureManager={version:V,build:BUILD,stats,filteredRows,action,undo,regression};
})();
