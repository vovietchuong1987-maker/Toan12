/* Math12 Hub  — ID6 UI & compatibility layer */
(function(){
  'use strict';
  const api=()=>window.ID6V374;
  const escH=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const attr=s=>escH(s);

  function effectivePattern(){
    const select=document.getElementById('qeFormV36Editor');
    if(select?.value&&api()?.isPattern(select.value))return select.value;
    const id6=document.getElementById('qeId6')?.value||'';
    if(api()?.isId6(id6))return id6.replace(/^(.{3})[NHVC](.+)$/,'$1?$2');
    return '';
  }
  function refreshEditorId6(){
    const box=document.getElementById('qeId6');if(!box)return;
    const p=effectivePattern(),level=document.getElementById('qeLevel')?.value||'';
    const code=api()?.buildId6(p,level)||'';box.value=code;
    const hint=document.getElementById('qeId6Hint');if(hint){const f=api()?.formByPattern(p);hint.innerHTML=code?`<b>${escH(code)}</b>${escH(f?.title||'Dạng toán chính thức')}`:'Chọn dạng toán chính thức và mức độ để tạo ID6.'}
  }
  function injectEditor(id=''){
    const internal=document.getElementById('qeId');if(!internal||document.getElementById('qeId6'))return;
    const q=id?(state.questionBank||[]).find(x=>x.id===id):null;
    const field=internal.closest('.field');if(!field)return;
    field.classList.add('v374-internal-id-field');
    const wrap=document.createElement('div');wrap.className='field v374-id6-field';
    const inferred=api()?.normalizeQuestion(q||{})||{};
    wrap.innerHTML=`<label>ID6 chính thức</label><input id="qeId6" value="${attr(inferred.id6||'')}" readonly placeholder="Ví dụ: 2D1H2-2"><div class="math-help" id="qeId6Hint">ID 6 tham số: lớp • mạch • chương • mức độ • bài • dạng. Mã này phân loại câu hỏi; mã bản ghi nội bộ vẫn duy nhất.</div>`;
    field.parentNode.insertBefore(wrap,field);
    internal.placeholder='Tự sinh duy nhất; không dùng ID6 làm khóa dữ liệu';
    const bind=()=>{
      ['qeLevel','qeFormV36Editor','qeLesson'].forEach(fid=>{const e=document.getElementById(fid);if(e&&!e.dataset.id6v374){e.dataset.id6v374='1';e.addEventListener('change',()=>setTimeout(refreshEditorId6,0))}});
      refreshEditorId6();
    };
    setTimeout(bind,0);
  }

  async function normalizeAll(){
    if(typeof requireTeacher==='function'&&!requireTeacher('Chuẩn hóa ID6 '))return;
    const bank=Array.isArray(state.questionBank)?state.questionBank:[],before=api().analyze(bank);
    if(!before.review){window.v353Toast?.('Tất cả câu hỏi đã có ID6 hợp lệ.');renderId6Summary();return}
    if(!confirm(`Chuẩn hóa ID6 cho ngân hàng câu hỏi?\n\nHiện có ${before.complete}/${before.total} câu đã có ID6 hợp lệ; ${before.review} câu cần ánh xạ.\n\nV37.4 chỉ cập nhật metadata dạng toán/ID6, không sửa nội dung, đáp án hay mã bản ghi nội bộ.`))return;
    if(typeof v21CreateRecoverySnapshot==='function'){try{await v21CreateRecoverySnapshot('v37.4-id6-normalize',false)}catch(_){}}
    let changed=0,review=0;
    state.questionBank=bank.map(q=>{const n=api().normalizeQuestion(q);if(JSON.stringify(n)!==JSON.stringify(q))changed++;if(n.id6Status!=='complete')review++;return n});
    state._meta=state._meta||{};state._meta.id6Schema=1;state._meta.id6Build=api().BUILD;state._meta.id6NormalizedAt=new Date().toISOString();
    if(changed&&typeof save==='function')save({reason:'v37.4-id6-normalize'});
    renderQuestionBank?.(true);renderId6Summary();window.v353Toast?.(`ID6 : cập nhật ${changed} câu${review?`; ${review} câu cần rà soát thủ công`:''}.`);
  }

  function catalog(){
    if(typeof requireTeacher==='function'&&!requireTeacher('Danh mục ID6'))return;
    const groups={};api().allForms().forEach(f=>{const key=f.id6Pattern.slice(0,3);(groups[key]??=[]).push(f)});
    const body=`<div class="v374-catalog-intro"><b>91 dạng toán Toán 12 • ID6 chính thức</b><p>Dấu <code>?</code> trong mẫu được thay bằng N/H/V/C theo mức độ của câu hỏi.</p></div>`+Object.entries(groups).map(([key,arr])=>`<details class="v374-catalog-group"><summary><b>${escH(key)}</b>${arr.length} dạng</summary><div class="v374-catalog-list">${arr.map(f=>`<div><code>${escH(f.id6Pattern)}</code><span>${escH(f.title)}</span><small>${escH(f.officialLessonTitle||'')}</small></div>`).join('')}</div></details>`).join('');
    openModal('Danh mục ID6 Toán 12','Theo tài liệu ID 6 tham số thầy cung cấp',body,'<button class="btn btn-blue" onclick="closeModal()">Đóng</button>');
  }

  function renderId6Summary(){
    const host=document.getElementById('v374Id6Summary');if(!host||!api())return;
    const a=api().analyze(state.questionBank||[]);host.innerHTML=`<div><b>${a.complete}/${a.total}</b><small>Câu có ID6</small></div><div><b>${a.covered}/91</b><small>Dạng đã có câu</small></div><div><b>${a.review}</b><small>Cần rà soát</small></div>`;
  }
  function injectBankUi(){
    if(document.getElementById('v374Id6Card')){renderId6Summary();return}
    const anchor=document.getElementById('v360KnowledgeMapCard');if(!anchor)return;
    const card=document.createElement('div');card.id='v374Id6Card';card.className='v374-id6-card';card.innerHTML=`<div class="v374-id6-head"><div><span class="v374-id6-badge">OFFICIAL ID6</span><b>Dạng toán & ID câu hỏi</b><small>91 dạng chính thức • giữ nguyên 19 bài học nội bộ/57 chuẩn Mastery để không phá dữ liệu tiến độ cũ.</small></div><div class="v374-id6-actions"><button class="btn btn-soft" onclick="v374OpenId6Catalog()">Danh mục 91 dạng</button><button class="btn btn-blue" onclick="v374NormalizeId6()">Chuẩn hóa ID6</button></div></div><div id="v374Id6Summary" class="v374-id6-summary"></div>`;
    anchor.parentNode.insertBefore(card,anchor);renderId6Summary();
  }
  function decorateRows(){
    const tbody=document.getElementById('questionBankTable');if(!tbody||!api())return;
    [...tbody.querySelectorAll('tr')].forEach(tr=>{
      const b=tr.querySelector('td:first-child b');if(!b||tr.querySelector('.v374-id6-row'))return;
      const internal=b.textContent.trim(),q=(state.questionBank||[]).find(x=>x.id===internal);if(!q)return;
      const n=api().normalizeQuestion(q),code=n.id6||'Chưa gán ID6';
      const line=document.createElement('div');line.className='v374-id6-row '+(n.id6?'ok':'review');line.innerHTML=`<span>${escH(code)}</span>${n.id6Pattern?`<small>${escH(n.id6Pattern)}</small>`:''}`;b.parentNode.insertBefore(line,b);b.classList.add('v374-internal-id');
    });
  }
  function patchStaticText(){
    const mf=document.getElementById('v360MetricForms');if(mf)mf.textContent='91';
    const detail=document.querySelector('#v360KnowledgeMapCard summary small');if(detail)detail.textContent='6 chương • 19 bài học nội bộ • 57 chuẩn Mastery • 91 dạng ID6 — nhấn để mở/đóng';
    const cov=document.querySelector('#bankCoverageCodes')?.closest('.card')?.querySelector('.section-head h3');if(cov)cov.textContent='Độ phủ chuẩn kiến thức & dạng ID6';
  }

  // Editor wrappers are installed last, after //.x wrappers.
  if(typeof window.openQuestionEditor==='function'&&!window.openQuestionEditor.__id6v374){const base=window.openQuestionEditor;const w=function(id=''){const out=base(id);setTimeout(()=>injectEditor(id),0);return out};w.__id6v374=true;window.openQuestionEditor=w}
  if(typeof window.saveQuestionEditor==='function'&&!window.saveQuestionEditor.__id6v374){const base=window.saveQuestionEditor;const w=function(editId=''){
    const pattern=effectivePattern(),level=document.getElementById('qeLevel')?.value||'',before=Number(state?._meta?.revision)||0,internal=(document.getElementById('qeId')?.value||'').trim().replace(/[^A-Za-z0-9._-]/g,'-');
    const out=base(editId);if((Number(state?._meta?.revision)||0)<=before)return out;
    const id=internal||editId;let idx=id?(state.questionBank||[]).findIndex(q=>q.id===id):-1;if(idx<0&&!editId)idx=0;
    if(idx>=0){let q=state.questionBank[idx];if(pattern)q={...q,formId:pattern,id6Pattern:pattern,id6:api().buildId6(pattern,level),id6Title:api().formByPattern(pattern)?.title||q.form,id6Status:'complete',id6Schema:1,id6Build:api().BUILD};else q=api().normalizeQuestion(q);state.questionBank[idx]=q;save({reason:'v37.4-id6-question-save'});renderQuestionBank?.(true)}return out
  };w.__id6v374=true;window.saveQuestionEditor=w}
  if(typeof window.renderQuestionBank==='function'&&!window.renderQuestionBank.__id6v374){const base=window.renderQuestionBank;const w=function(force=false){const out=base(force);injectBankUi();patchStaticText();decorateRows();renderId6Summary();return out};w.__id6v374=true;window.renderQuestionBank=w}

  window.v374NormalizeId6=normalizeAll;window.v374OpenId6Catalog=catalog;window.v374RefreshEditorId6=refreshEditorId6;
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{injectBankUi();patchStaticText();renderId6Summary()},0)});
})();
