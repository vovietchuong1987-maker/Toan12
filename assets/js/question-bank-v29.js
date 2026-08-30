/* Math12 Hub V29 — Question Bank Pro
   Metadata, quality checks, near-duplicate detection, version history, CSV/LaTeX export.
   No new Firestore collection: metadata/version snapshots live inside each teacher-owned question document. */
const V29_QB_SCHEMA=29;
const V29_MAX_VERSIONS=5;
let v29DuplicateCache={signature:'',pairs:[],byId:new Map()};
let v29BankPage=1,v29LastFilterSignature='';

let v34BankInputTimer=null;
function v34ScheduleBankRender(force=false){clearTimeout(v34BankInputTimer);v34BankInputTimer=setTimeout(()=>renderQuestionBank(force),180)}

function v29Clone(x){return JSON.parse(JSON.stringify(x))}
function v29IsoNow(){return new Date().toISOString()}
function v29NormalizeTags(tags){
  const arr=Array.isArray(tags)?tags:String(tags||'').split(/[,;\n]/);
  return [...new Set(arr.map(x=>String(x||'').trim()).filter(Boolean).map(x=>x.slice(0,40)))].slice(0,12);
}
function v29DefaultDifficulty(level='NB'){return level==='VD'?4:level==='TH'?3:2}
function v29DefaultSourceName(q={}){
  if(q.sourceName)return q.sourceName;
  if(q.source==='seed')return 'Ngân hàng mẫu Math12 Hub';
  if(q.source==='latex-import')return 'Import LaTeX';
  return q.source==='custom'?'Tự soạn':'';
}
function v29StripVersions(q={}){const c=v29Clone(q);delete c._versions;return c}
function v29NormalizeVersionItem(v={}){const c=v29StripVersions(v);c._savedAt=v._savedAt||v.updatedAt||'';return c}
function v29TrimVersions(items=[]){let out=(items||[]).map(v29NormalizeVersionItem).slice(-V29_MAX_VERSIONS);while(out.length>1&&JSON.stringify(out).length>240000)out.shift();return out}
function v29NormalizeQuestion(q={}){
  const x={...q};
  x.schemaVersion=V29_QB_SCHEMA;
  x.tags=v29NormalizeTags(x.tags);
  x.reviewStatus=['draft','reviewed'].includes(x.reviewStatus)?x.reviewStatus:(x.source==='seed'?'reviewed':'draft');
  x.difficulty=Math.min(5,Math.max(1,Number(x.difficulty)||v29DefaultDifficulty(x.level)));
  x.sourceName=v29DefaultSourceName(x);
  x.sourceYear=String(x.sourceYear||'').replace(/[^0-9]/g,'').slice(0,4);
  x.version=Math.max(1,Number(x.version)||1);
  x.createdAt=x.createdAt||'';
  x.updatedAt=x.updatedAt||'';
  x._versions=v29TrimVersions(Array.isArray(x._versions)?x._versions:[]);
  return x;
}
function v29QuestionChanged(a,b){return JSON.stringify(a)!==JSON.stringify(b)}
function v29EnsureQuestionBankMetadata(saveChanges=true){
  if(!Array.isArray(state.questionBank))return false;
  let changed=false;
  state.questionBank=state.questionBank.map(q=>{const n=v29NormalizeQuestion(q);if(v29QuestionChanged(q,n))changed=true;return n});
  if(changed&&saveChanges)save({reason:'v29-question-bank-metadata'});
  return changed;
}
function v29QuestionAnswerOk(q={}){
  if(q.type==='mcq')return Array.isArray(q.options)&&q.options.length>=2&&Number.isInteger(Number(q.answer))&&Number(q.answer)>=0&&Number(q.answer)<q.options.length;
  if(q.type==='tf4')return Array.isArray(q.statements)&&q.statements.length===4&&q.statements.every(s=>typeof s?.answer==='boolean'&&String(s?.text||'').trim());
  if(q.type==='tf')return typeof q.answer==='boolean';
  if(q.type==='short')return String(q.answer??'').trim().length>0;
  return false;
}
function v29QuestionQuality(q={}){
  let score=0,issues=[];
  const known=allKnowledgeCodes().some(k=>k.code===q.knowledgeCode);
  if(known)score+=15;else issues.push('Mã kiến thức chưa hợp lệ');
  if(['NB','TH','VD','VDC'].includes(q.level))score+=10;else issues.push('Thiếu mức độ');
  if(['mcq','tf','tf4','short'].includes(q.type))score+=10;else issues.push('Loại câu chưa chuẩn');
  if(String(q.question||'').trim().length>=12)score+=15;else issues.push('Nội dung quá ngắn');
  if(v29QuestionAnswerOk(q))score+=15;else issues.push('Đáp án/cấu trúc chưa hợp lệ');
  if(String(q.explanation||'').trim().length>=8)score+=15;else issues.push('Thiếu lời giải');
  if(q.sourceName||q.source==='seed')score+=5;else issues.push('Thiếu nguồn');
  if(Number(q.difficulty)>=1&&Number(q.difficulty)<=5)score+=5;else issues.push('Thiếu độ khó');
  if(Array.isArray(q.tags)&&q.tags.length)score+=5;else issues.push('Chưa có thẻ');
  if(q.reviewStatus==='reviewed')score+=5;else issues.push('Chưa duyệt');
  return {score,issues,status:score>=90?'good':score>=75?'warn':'bad'};
}
function v29NormalizeText(s=''){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/\\(?:left|right|mathrm|text|operatorname|displaystyle|dfrac|tfrac)/g,' ')
    .replace(/[^a-z0-9\\+\-*/^=<>.]+/g,' ').replace(/\s*([=+\-*/^<>])\s*/g,'$1').replace(/\s+/g,' ').trim();
}
function v29Tokens(s=''){return [...new Set(v29NormalizeText(s).split(' ').filter(x=>x.length>1))]}
function v29Trigrams(s=''){const x=v29NormalizeText(s).replace(/\s+/g,' ');if(x.length<3)return x?[x]:[];let a=[];for(let i=0;i<x.length-2;i++)a.push(x.slice(i,i+3));return a}
function v29Jaccard(a=[],b=[]){const A=new Set(a),B=new Set(b);if(!A.size&&!B.size)return 1;let inter=0;A.forEach(x=>B.has(x)&&inter++);return inter/(A.size+B.size-inter||1)}
function v29Dice(a=[],b=[]){if(!a.length&&!b.length)return 1;const m=new Map();a.forEach(x=>m.set(x,(m.get(x)||0)+1));let inter=0;b.forEach(x=>{let n=m.get(x)||0;if(n){inter++;m.set(x,n-1)}});return 2*inter/(a.length+b.length||1)}
function v29QuestionSignatureText(q={}){
  const extras=q.type==='mcq'?(q.options||[]).join(' '):q.type==='tf4'?(q.statements||[]).map(s=>s.text).join(' '):'';
  return `${q.question||''} ${extras}`;
}
function v29Similarity(a,b){
  const A=v29QuestionSignatureText(a),B=v29QuestionSignatureText(b),na=v29NormalizeText(A),nb=v29NormalizeText(B);
  if(!na||!nb)return 0;if(na===nb)return 1;
  return .45*v29Jaccard(v29Tokens(A),v29Tokens(B))+.55*v29Dice(v29Trigrams(A),v29Trigrams(B));
}
function v29BankSignature(){return (state.questionBank||[]).map(q=>`${q.id}:${q.updatedAt||''}:${q.version||1}:${String(q.question||'').length}`).join('|')}
function v29ScanDuplicates(force=false){
  const sig=v29BankSignature();if(!force&&v29DuplicateCache.signature===sig)return v29DuplicateCache.pairs;
  const bank=state.questionBank||[],pairs=[];
  const groups=new Map();
  bank.forEach(q=>{const key=`${q.type||''}|${q.chapterId||''}`;(groups.get(key)||groups.set(key,[]).get(key)).push(q)});
  groups.forEach(arr=>{
    for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
      const a=arr[i],b=arr[j];
      if(Math.abs(String(a.question||'').length-String(b.question||'').length)>Math.max(80,.65*Math.max(String(a.question||'').length,String(b.question||'').length)))continue;
      const score=v29Similarity(a,b);if(score>=.72)pairs.push({a:a.id,b:b.id,score,exact:score>.995});
    }
  });
  pairs.sort((x,y)=>y.score-x.score||String(x.a).localeCompare(String(y.a)));
  const byId=new Map();pairs.forEach(p=>{byId.set(p.a,(byId.get(p.a)||0)+1);byId.set(p.b,(byId.get(p.b)||0)+1)});
  v29DuplicateCache={signature:sig,pairs,byId};return pairs;
}
function v29DuplicateCountFor(id){return v29DuplicateCache.byId.get(id)||0}
function v29FilteredQuestions(){
  const q=(document.getElementById('bankSearch')?.value||'').trim().toLowerCase(),cid=Number(document.getElementById('bankChapter')?.value)||0,lid=document.getElementById('bankLesson')?.value||'',kid=document.getElementById('bankKnowledge')?.value||'',lev=document.getElementById('bankLevel')?.value||'',typ=document.getElementById('bankType')?.value||'',status=document.getElementById('bankReviewStatus')?.value||'',difficulty=document.getElementById('bankDifficulty')?.value||'',src=document.getElementById('bankSource')?.value||'',tag=(document.getElementById('bankTag')?.value||'').trim().toLowerCase(),dup=document.getElementById('bankDuplicateFilter')?.value||'',sort=document.getElementById('bankSort')?.value||'updated';
  let dupReady=false;if(dup){const sig=v29BankSignature();dupReady=v29DuplicateCache.signature===sig;if(!dupReady){v29ScanDuplicates(true);dupReady=true}}
  let rows=(state.questionBank||[]).filter(x=>(!cid||Number(x.chapterId)===cid)&&(!lid||x.lessonId===lid)&&(!kid||x.knowledgeCode===kid)&&(!lev||x.level===lev)&&(!typ||x.type===typ)&&(!status||x.reviewStatus===status)&&(!difficulty||Number(x.difficulty)===Number(difficulty))&&(!src||x.sourceName===src)&&(!tag||(x.tags||[]).some(t=>String(t).toLowerCase().includes(tag)))&&(!dup||(dup==='yes'?v29DuplicateCountFor(x.id)>0:v29DuplicateCountFor(x.id)===0))&&(!q||[x.id,x.id6||'',x.id6Pattern||'',x.question,x.explanation,x.knowledgeCode,x.form,x.sourceName,x.sourceYear,(x.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)));
  rows.sort((a,b)=>sort==='id'?String(a.id).localeCompare(String(b.id)):sort==='quality'?v29QuestionQuality(a).score-v29QuestionQuality(b).score:sort==='difficulty'?Number(b.difficulty||0)-Number(a.difficulty||0):String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||''))||String(a.id).localeCompare(String(b.id)));
  return rows;
}
function v29ReviewName(s){return s==='reviewed'?'Đã duyệt':'Bản nháp'}
function v29SourceOptions(){const vals=[...new Set((state.questionBank||[]).map(q=>q.sourceName).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'vi'));return '<option value="">Tất cả nguồn</option>'+vals.map(v=>`<option value="${attrEsc(v)}">${esc(v)}</option>`).join('')}
function v29RenderQuestionBank(forceOptions=false){
  if(!requireTeacher('Ngân hàng câu hỏi'))return;if(!document.getElementById('questionBankTable'))return;
  v29EnsureQuestionBankMetadata(true);refreshBankFilterOptions(forceOptions);
  const src=document.getElementById('bankSource');if(src&&(forceOptions||src.options.length<=1)){const val=src.value;src.innerHTML=v29SourceOptions();src.value=[...src.options].some(o=>o.value===val)?val:''}
  const allRows=v29FilteredQuestions(),bank=state.questionBank||[],codes=allKnowledgeCodes(),covered=new Set(bank.map(x=>x.knowledgeCode)),lessonCovered=new Set(bank.map(x=>x.lessonId)),quality=bank.map(v29QuestionQuality),avgQ=quality.length?Math.round(quality.reduce((s,x)=>s+x.score,0)/quality.length):0,reviewed=bank.filter(q=>q.reviewStatus==='reviewed').length,dupScanned=v29DuplicateCache.signature===v29BankSignature(),dups=dupScanned?v29DuplicateCache.pairs.length:null,versioned=bank.filter(q=>Number(q.version)>1).length;
  const filterSig=['bankSearch','bankChapter','bankLesson','bankKnowledge','bankLevel','bankType','bankReviewStatus','bankDifficulty','bankSource','bankTag','bankDuplicateFilter','bankSort','bankPageSize'].map(id=>document.getElementById(id)?.value||'').join('|');if(filterSig!==v29LastFilterSignature){v29BankPage=1;v29LastFilterSignature=filterSig}const pageSize=Math.max(25,Number(document.getElementById('bankPageSize')?.value)||50),pages=Math.max(1,Math.ceil(allRows.length/pageSize));v29BankPage=Math.min(pages,Math.max(1,v29BankPage));const rows=allRows.slice((v29BankPage-1)*pageSize,v29BankPage*pageSize);
  document.getElementById('bankTotal').textContent=bank.length;document.getElementById('bankCoverage').textContent=codes.length?Math.round(covered.size/codes.length*100)+'%':'0%';document.getElementById('bankLessons').textContent=lessonCovered.size+'/'+TOTAL;document.getElementById('bankCustom').textContent=bank.filter(x=>x.source!=='seed').length;document.getElementById('bankResultCount').textContent=`${allRows.length} câu • trang ${v29BankPage}/${pages}`;
  const qEl=document.getElementById('bankV29Quality');if(qEl)qEl.textContent=avgQ+'%';const rEl=document.getElementById('bankV29Reviewed');if(rEl)rEl.textContent=reviewed+'/'+bank.length;const dEl=document.getElementById('bankV29Duplicates');if(dEl){dEl.textContent=dups==null?'—':dups;dEl.title=dups==null?'Bấm “Quét trùng” để phân tích gần trùng; V29 không tự quét nền khi mở trang.':'Kết quả lần quét gần nhất'};const vEl=document.getElementById('bankV29Versioned');if(vEl)vEl.textContent=versioned;
  document.getElementById('questionBankTable').innerHTML=rows.map(x=>{const l=getLesson(x.lessonId),qv=v29QuestionQuality(x),dc=dupScanned?v29DuplicateCountFor(x.id):0,tags=(x.tags||[]).slice(0,3);return `<tr><td><b>${esc(x.id)}</b><br><small style="color:var(--muted)">${esc(x.lessonId)} • v${Number(x.version)||1}</small></td><td class="bank-question"><b>${mathHTML(x.question)}</b>${x.figureLatex?`<div class="bank-tag-figure">${figureModeTag(x.figureMode||'tikz')}</div>`:''}<small>${l?esc(l.common):''}${x.form?' • '+esc(x.form):''}</small>${tags.length?`<div class="v29-tag-row">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}</td><td><span class="pill">${esc(x.knowledgeCode)}</span><small class="v29-meta-line">${esc(x.sourceName||'Chưa ghi nguồn')}${x.sourceYear?' • '+esc(x.sourceYear):''}</small></td><td><span class="level-badge ${levelClass(x.level)}">${levelName(x.level)}</span><small class="v29-meta-line">Độ khó ${Number(x.difficulty)||v29DefaultDifficulty(x.level)}/5</small></td><td><span class="type-badge">${questionTypeName(x.type)}</span><small class="v29-meta-line">${v29ReviewName(x.reviewStatus)}</small></td><td><button class="v29-quality ${qv.status}" onclick="v29OpenQuestionQuality('${attrEsc(x.id)}')" title="${attrEsc(qv.issues.join(' • ')||'Đạt kiểm tra chất lượng')}">${qv.score}%</button>${dc?`<button class="v29-dup-chip" onclick="v29OpenDuplicateCenter('${attrEsc(x.id)}')">≈ ${dc}</button>`:''}</td><td><div class="bank-actions"><button class="btn btn-soft" onclick="previewBankQuestion('${attrEsc(x.id)}')">Xem</button><button class="btn btn-soft" onclick="openQuestionEditor('${attrEsc(x.id)}')">Sửa</button><button class="btn btn-soft" onclick="v29OpenVersionHistory('${attrEsc(x.id)}')">Lịch sử</button><button class="btn btn-danger" onclick="deleteBankQuestion('${attrEsc(x.id)}')">Xóa</button></div></td></tr>`}).join('')||'<tr><td colspan="7"><div class="bank-empty">Không có câu hỏi phù hợp bộ lọc.</div></td></tr>';
  const pager=document.getElementById('bankV29Pager');if(pager)pager.innerHTML=`<span>Hiển thị ${allRows.length?((v29BankPage-1)*pageSize+1):0}–${Math.min(v29BankPage*pageSize,allRows.length)} / ${allRows.length}</span><div><button class="btn btn-soft" onclick="v29BankChangePage(-1)" ${v29BankPage<=1?'disabled':''}>← Trước</button><span class="pill">${v29BankPage}/${pages}</span><button class="btn btn-soft" onclick="v29BankChangePage(1)" ${v29BankPage>=pages?'disabled':''}>Sau →</button></div>`;
  document.getElementById('bankCoverageCodes').innerHTML=codes.map(k=>{const qs=bank.filter(q=>q.knowledgeCode===k.code),tip=qs.length?`${qs.length} câu • chất lượng TB ${Math.round(qs.reduce((s,q)=>s+v29QuestionQuality(q).score,0)/qs.length)}%`:'Chưa có câu';return `<span class="pill ${covered.has(k.code)?'tag-green':'missing'}" title="${attrEsc(k.title+' • '+tip)}">${k.code}<small> ${qs.length||''}</small></span>`}).join('');
  if(document.getElementById('page-question-bank')?.classList.contains('active'))typesetMath(document.getElementById('page-question-bank'));
}
function v29OpenQuestionQuality(id){
  const q=(state.questionBank||[]).find(x=>x.id===id);if(!q)return;const r=v29QuestionQuality(q),issues=r.issues.length?r.issues.map(x=>`<li>${esc(x)}</li>`).join(''):'<li>Không phát hiện thiếu sót theo checklist V29.</li>';
  openModal(`Chất lượng câu ${esc(id)}`,'V29 • Checklist dữ liệu câu hỏi',`<div class="v29-quality-hero ${r.status}"><b>${r.score}%</b><span>${r.score>=90?'Sẵn sàng sử dụng':r.score>=75?'Nên rà soát thêm':'Cần hoàn thiện'}</span></div><div class="card mt"><h3 style="margin-top:0">Checklist</h3><ul class="v29-issue-list">${issues}</ul></div><div class="math-help mt">Điểm chất lượng kiểm tra độ đầy đủ metadata/cấu trúc, không thay thế thẩm định chuyên môn của giáo viên.</div>`,`<button class="btn btn-soft" onclick="closeModal();openQuestionEditor('${attrEsc(id)}')">Sửa câu</button><button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)
}
function v29OpenQualityCenter(){
  if(!requireTeacher('Phân tích chất lượng ngân hàng'))return;v29EnsureQuestionBankMetadata(false);const bank=state.questionBank||[],quality=bank.map(q=>({q,...v29QuestionQuality(q)})),avg=quality.length?Math.round(quality.reduce((s,x)=>s+x.score,0)/quality.length):0,good=quality.filter(x=>x.score>=90).length,warn=quality.filter(x=>x.score>=75&&x.score<90).length,bad=quality.filter(x=>x.score<75).length,codes=allKnowledgeCodes(),missing=codes.filter(k=>!bank.some(q=>q.knowledgeCode===k.code)),types=['mcq','tf','tf4','short'].map(t=>({t,n:bank.filter(q=>q.type===t).length})),levels=['NB','TH','VD','VDC'].map(l=>({l,n:bank.filter(q=>q.level===l).length})),weak=quality.sort((a,b)=>a.score-b.score).slice(0,20);
  openModal('Chất lượng ngân hàng • V29',`${bank.length} câu • ${codes.length-missing.length}/${codes.length} chuẩn có dữ liệu`,`<div class="v29-quality-grid"><div><b>${avg}%</b><small>Điểm chất lượng TB</small></div><div><b>${good}</b><small>Câu ≥ 90%</small></div><div><b>${warn}</b><small>Cần rà soát</small></div><div><b>${bad}</b><small>Cần hoàn thiện</small></div></div><div class="grid grid-2 mt"><div class="card"><h3 style="margin-top:0">Cơ cấu loại câu</h3>${types.map(x=>`<div class="v29-bar-row"><span>${questionTypeName(x.t)}</span><b>${x.n}</b></div>`).join('')}</div><div class="card"><h3 style="margin-top:0">Cơ cấu mức độ</h3>${levels.map(x=>`<div class="v29-bar-row"><span>${levelName(x.l)}</span><b>${x.n}</b></div>`).join('')}</div></div><div class="card mt"><h3 style="margin-top:0">Chuẩn kiến thức chưa có câu (${missing.length})</h3><div class="bank-coverage-list">${missing.length?missing.map(k=>`<span class="pill missing" title="${attrEsc(k.title)}">${k.code}</span>`).join(''):'<span class="pill tag-green">✓ Đã phủ đủ chuẩn</span>'}</div></div><div class="card mt"><h3 style="margin-top:0">20 câu cần ưu tiên rà soát</h3><div class="v29-quality-list">${weak.map(x=>`<button onclick="closeModal();openQuestionEditor('${attrEsc(x.q.id)}')"><span>${esc(x.q.id)}</span><b>${x.score}%</b><small>${esc(x.issues.slice(0,2).join(' • ')||'Đạt')}</small></button>`).join('')}</div></div>`,`<button class="btn btn-soft" onclick="v29MarkSeedsReviewed()">Chuẩn hóa metadata câu cũ</button><button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)
}
function v29OpenDuplicateCenter(focusId=''){
  if(!requireTeacher('Quét câu trùng'))return;const scanned=v29ScanDuplicates(true);v29RenderQuestionBank(false);const pairs=scanned.filter(p=>!focusId||p.a===focusId||p.b===focusId),all=v29DuplicateCache.pairs,exact=all.filter(p=>p.exact).length,near=all.length-exact;
  const rows=pairs.slice(0,100).map(p=>{const a=state.questionBank.find(q=>q.id===p.a),b=state.questionBank.find(q=>q.id===p.b);return `<div class="v29-dup-row"><div><b>${esc(p.a)}</b><small>${esc(String(a?.question||'').slice(0,120))}</small></div><span class="v29-sim">${Math.round(p.score*100)}%</span><div><b>${esc(p.b)}</b><small>${esc(String(b?.question||'').slice(0,120))}</small></div><div class="v29-dup-actions"><button class="btn btn-soft" onclick="previewBankQuestion('${attrEsc(p.a)}')">A</button><button class="btn btn-soft" onclick="previewBankQuestion('${attrEsc(p.b)}')">B</button><button class="btn btn-danger" onclick="v29TrashDuplicate('${attrEsc(p.b)}')">Xóa B</button></div></div>`}).join('');
  openModal('Phát hiện câu trùng / gần trùng • V29',`${all.length} cặp nghi vấn • ${exact} trùng gần như tuyệt đối • ${near} gần trùng`,`<div class="firebase-banner warn"><b>V29 chỉ gợi ý.</b> Công thức/toán học có thể giống nhau nhưng ngữ cảnh khác; giáo viên cần xem hai câu trước khi xóa.</div><div class="v29-dup-list mt">${rows||'<div class="v28-empty-good"><b>✓ Không phát hiện cặp nghi vấn.</b><span>Ngưỡng tương đồng hiện tại: 72% trong cùng chương và cùng loại câu.</span></div>'}</div>${pairs.length>100?`<div class="math-help mt">Đang hiển thị 100/${pairs.length} cặp theo độ tương đồng cao nhất.</div>`:''}`,`<button class="btn btn-soft" onclick="v29ScanDuplicates(true);v29OpenDuplicateCenter('${attrEsc(focusId)}')">↻ Quét lại</button><button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)
}
async function v29TrashDuplicate(id){closeModal();await deleteBankQuestion(id);v29ScanDuplicates(true);v29OpenDuplicateCenter()}
function v29VersionSnapshot(q={}){const s=v29StripVersions(q);s._savedAt=v29IsoNow();return s}
function v29OpenVersionHistory(id){
  const q=(state.questionBank||[]).find(x=>x.id===id);if(!q)return;const versions=Array.isArray(q._versions)?q._versions:[];
  const rows=versions.slice().reverse().map((v,ri)=>{const idx=versions.length-1-ri;return `<div class="v29-version-row"><div><b>Phiên bản ${Number(v.version)||idx+1}</b><small>${v._savedAt||v.updatedAt?new Date(v._savedAt||v.updatedAt).toLocaleString('vi-VN'):'Chưa có thời gian'} • ${esc(v.knowledgeCode||'')} • ${levelName(v.level||'NB')}</small><span>${esc(String(v.question||'').slice(0,160))}</span></div><button class="btn btn-soft" onclick="v29PreviewHistoricalVersion('${attrEsc(id)}',${idx})">Xem</button><button class="btn btn-blue" onclick="v29RestoreVersion('${attrEsc(id)}',${idx})">Khôi phục</button></div>`}).join('');
  openModal(`Lịch sử câu ${esc(id)}`,`Hiện tại v${Number(q.version)||1} • lưu tối đa ${V29_MAX_VERSIONS} phiên bản trước`,`<div class="firebase-banner"><b>Phiên bản hiện tại:</b> ${esc(String(q.question||'').slice(0,180))}</div><div class="v29-version-list mt">${rows||'<div class="online-empty">Câu này chưa có phiên bản cũ. Lịch sử bắt đầu được ghi khi sửa từ V29.</div>'}</div>`,`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)
}
function v29PreviewHistoricalVersion(id,index){const q=(state.questionBank||[]).find(x=>x.id===id),v=q?._versions?.[index];if(!v)return;openModal(`${esc(id)} • bản cũ v${Number(v.version)||index+1}`,v._savedAt?new Date(v._savedAt).toLocaleString('vi-VN'):'Phiên bản lịch sử',buildQuestionPreviewHTML(v,{showAnswer:true,showExplanation:true}),`<button class="btn btn-soft" onclick="v29OpenVersionHistory('${attrEsc(id)}')">← Lịch sử</button><button class="btn btn-blue" onclick="v29RestoreVersion('${attrEsc(id)}',${index})">Khôi phục bản này</button>`)}
function v29RestoreVersion(id,index){
  if(!requireTeacher('Khôi phục phiên bản câu hỏi'))return;const i=(state.questionBank||[]).findIndex(x=>x.id===id),q=state.questionBank[i],old=q?._versions?.[index];if(i<0||!old)return;if(!confirm(`Khôi phục phiên bản cũ của câu ${id}? Bản hiện tại sẽ được lưu vào lịch sử.`))return;
  const history=v29TrimVersions([...(q._versions||[]),v29VersionSnapshot(q)]),restored=v29NormalizeQuestion({...v29StripVersions(old),id:q.id,version:(Number(q.version)||1)+1,createdAt:q.createdAt||old.createdAt||'',updatedAt:v29IsoNow(),_versions:history});state.questionBank[i]=restored;v29DuplicateCache.signature='';save({reason:'v29-question-version-restore'});closeModal();renderQuestionBank(true);examToast?.(`Đã khôi phục câu ${id} thành phiên bản mới v${restored.version}.`)
}
function v29MarkSeedsReviewed(){
  if(!requireTeacher('Chuẩn hóa metadata'))return;let n=0;(state.questionBank||[]).forEach(q=>{const before=JSON.stringify(q),x=v29NormalizeQuestion(q);Object.assign(q,x);if(JSON.stringify(q)!==before)n++});if(n)save({reason:'v29-normalize-question-metadata'});closeModal();renderQuestionBank(true);examToast?.(`Đã chuẩn hóa metadata ${n} câu.`)
}
function v29CsvCell(v){return `"${String(v??'').replaceAll('"','""')}"`}
function exportQuestionBankCSVV29(){
  if(!requireTeacher('Xuất CSV ngân hàng'))return;const rows=v29FilteredQuestions().map(q=>window.ID6V374?.normalizeQuestion?.(q)||q),head=['id','id6','id6Pattern','chapterId','lessonId','knowledgeCode','level','type','difficulty','reviewStatus','sourceName','sourceYear','tags','question','answer','explanation','version'];let csv='\uFEFF'+head.map(v29CsvCell).join(',')+'\n'+rows.map(q=>head.map(k=>{let v=q[k];if(k==='tags')v=(q.tags||[]).join('; ');if(k==='answer'&&q.type==='tf4')v=(q.statements||[]).map(s=>s.answer?'Đ':'S').join('');if(k==='answer'&&q.type==='mcq')v=String.fromCharCode(65+(Number(q.answer)||0));return v29CsvCell(v)}).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`math12-question-bank-v29-${rows.length}-cau.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
function v29QuestionToLatex(q={}){
  q=window.ID6V374?.normalizeQuestion?.(q)||q;
  const meta=[q.id6?`% id6: ${q.id6}`:'',`% id: ${q.id}`,`% lesson: ${q.lessonId}`,`% knowledge: ${q.knowledgeCode}`,`% level: ${q.level}`,q.form?`% form: ${q.form}`:'',q.sourceName?`% source: ${q.sourceName}`:'',q.sourceYear?`% year: ${q.sourceYear}`:'',q.tags?.length?`% tags: ${q.tags.join(', ')}`:''].filter(Boolean).join('\n');
  let stem=q.question||'',body='';if(q.figureLatex&&q.figureLayout==='right')stem=`\\immini{${stem}}{${q.figureLatex}}`;else if(q.figureLatex&&q.figureLayout==='left')stem=`\\imminiL{${stem}}{${q.figureLatex}}`;else if(q.figureLatex)stem+=`\n${q.figureLatex}`;
  if(q.type==='mcq')body=`\\choice\n${(q.options||[]).map((o,i)=>`{${Number(q.answer)===i?'\\True ':''}${o}}`).join('\n')}`;
  else if(q.type==='tf4')body=`\\choiceTF\n${(q.statements||[]).map(s=>`{${s.answer?'\\True ':''}${s.text||''}}`).join('\n')}`;
  else if(q.type==='tf')body=`\\choiceTF\n{${q.answer?'\\True ':''}${q.question||''}}`; // legacy 1-statement TF: preserve source, never fabricate extra statements
  else body=`\\shortans{${q.answer??''}}`;
  const solution=q.explanation?`\n\\loigiai{${q.explanation}}`:'';return `${meta}\n\\begin{ex}\n${stem}\n${body}${solution}\n\\end{ex}`;
}
function exportQuestionBankLatexV29(){
  if(!requireTeacher('Xuất LaTeX ngân hàng'))return;const rows=v29FilteredQuestions();let tex=`% Math12 Hub V29 — export ${rows.length} câu\n% ${new Date().toISOString()}\n\n`+rows.map(v29QuestionToLatex).join('\n\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([tex],{type:'text/plain;charset=utf-8'}));a.download=`math12-question-bank-v29-${rows.length}-cau.tex`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
function v29InjectEditorMetadata(id=''){
  const grid=document.querySelector('#modalBody .field-grid');if(!grid||document.getElementById('qeReviewStatus'))return;const x=id?(state.questionBank||[]).find(q=>q.id===id):null,anchor=document.getElementById('qeQuestion')?.closest('.field');if(!anchor)return;
  const wrap=document.createElement('div');wrap.className='v29-editor-meta full';wrap.innerHTML=`<div class="v29-editor-meta-head"><b>Metadata Question Bank Pro • V29</b><span>${x?`v${Number(x.version)||1}`:'Câu mới'}</span></div><div class="field-grid"><div class="field"><label>Trạng thái duyệt</label><select id="qeReviewStatus"><option value="draft" ${(x?.reviewStatus||'draft')==='draft'?'selected':''}>Bản nháp</option><option value="reviewed" ${x?.reviewStatus==='reviewed'?'selected':''}>Đã duyệt chuyên môn</option></select></div><div class="field"><label>Độ khó 1–5</label><select id="qeDifficulty">${[1,2,3,4,5].map(n=>`<option value="${n}" ${Number(x?.difficulty||v29DefaultDifficulty(x?.level))===n?'selected':''}>${n}/5</option>`).join('')}</select></div><div class="field"><label>Nguồn / tài liệu</label><input id="qeSourceName" value="${attrEsc(x?.sourceName||'')}" placeholder="VD: Đề TN THPT 2026"></div><div class="field"><label>Năm nguồn</label><input id="qeSourceYear" inputmode="numeric" maxlength="4" value="${attrEsc(x?.sourceYear||'')}" placeholder="2026"></div><div class="field full"><label>Thẻ tìm kiếm</label><input id="qeTags" value="${attrEsc((x?.tags||[]).join(', '))}" placeholder="VD: cực trị, bảng biến thiên, thực tế"><div class="math-help">Phân cách thẻ bằng dấu phẩy; tối đa 12 thẻ. Metadata được đồng bộ cùng document câu hỏi.</div></div></div>`;
  anchor.insertAdjacentElement('beforebegin',wrap)
}
function v29ReadEditorMeta(){return {reviewStatus:document.getElementById('qeReviewStatus')?.value||'draft',difficulty:Number(document.getElementById('qeDifficulty')?.value)||3,sourceName:(document.getElementById('qeSourceName')?.value||'').trim(),sourceYear:(document.getElementById('qeSourceYear')?.value||'').replace(/[^0-9]/g,'').slice(0,4),tags:v29NormalizeTags(document.getElementById('qeTags')?.value||'')}}

// Wrap the V28 editor without duplicating the mature LaTeX/figure validation logic.
const v29BaseOpenQuestionEditor=openQuestionEditor;
openQuestionEditor=function(id=''){v29BaseOpenQuestionEditor(id);v29InjectEditorMetadata(id)};
const v29BaseSaveQuestionEditor=saveQuestionEditor;
saveQuestionEditor=function(editId=''){
  const old=editId?v29Clone((state.questionBank||[]).find(q=>q.id===editId)||null):null,meta=v29ReadEditorMeta(),typedId=(document.getElementById('qeId')?.value||'').trim().replace(/[^A-Za-z0-9._-]/g,'-'),beforeRev=Number(state._meta?.revision)||0;
  v29BaseSaveQuestionEditor(editId);if((Number(state._meta?.revision)||0)<=beforeRev)return;
  const targetId=typedId||editId;let idx=targetId?(state.questionBank||[]).findIndex(q=>q.id===targetId):-1;if(idx<0&&!editId)idx=0;if(idx<0)return;
  const current=state.questionBank[idx],history=old?v29TrimVersions([...(old._versions||[]),v29VersionSnapshot(old)]):[];
  state.questionBank[idx]=v29NormalizeQuestion({...current,...meta,source:current.source||'custom',createdAt:old?.createdAt||current.createdAt||v29IsoNow(),updatedAt:v29IsoNow(),version:old?(Number(old.version)||1)+1:(Number(current.version)||1),_versions:history});
  save({reason:old?'v29-question-edit':'v29-question-create'});v29DuplicateCache.signature='';renderQuestionBank(true)
};
const v29BaseCommitBulkLatexImport=commitBulkLatexImport;
commitBulkLatexImport=function(){const beforeRev=Number(state._meta?.revision)||0,beforeMap=new Map((state.questionBank||[]).map(q=>[q.id,v29Clone(q)]));v29BaseCommitBulkLatexImport();if((Number(state._meta?.revision)||0)>beforeRev){v29EnsureQuestionBankMetadata(false);(state.questionBank||[]).forEach(q=>{const old=beforeMap.get(q.id);if(q.source==='latex-import'&&!q.updatedAt)q.updatedAt=v29IsoNow();if(old&&JSON.stringify(v29StripVersions(old))!==JSON.stringify(v29StripVersions(q))){q._versions=v29TrimVersions([...(old._versions||[]),v29VersionSnapshot(old)]);q.version=(Number(old.version)||1)+1;q.createdAt=old.createdAt||q.createdAt||'';q.updatedAt=v29IsoNow()}});save({reason:'v29-latex-import-metadata'});v29DuplicateCache.signature='';renderQuestionBank(true)}};
const v29BaseDeleteBankQuestion=deleteBankQuestion;
deleteBankQuestion=async function(id){await v29BaseDeleteBankQuestion(id);v29DuplicateCache.signature='';renderQuestionBank(true)};
renderQuestionBank=v29RenderQuestionBank;

function v29BankChangePage(delta=0){v29BankPage=Math.max(1,v29BankPage+Number(delta||0));renderQuestionBank()}
function v29BindBankControls(){['bankReviewStatus','bankDifficulty','bankSource','bankSort','bankPageSize'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>renderQuestionBank()));const dup=document.getElementById('bankDuplicateFilter');dup?.addEventListener('change',()=>{if(dup.value)v29ScanDuplicates(true);renderQuestionBank()});document.getElementById('bankTag')?.addEventListener('input',()=>v34ScheduleBankRender(false))}
v29EnsureQuestionBankMetadata(true);v29BindBankControls();
