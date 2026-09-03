/* =========================================================
   Math12 Hub  — Pure ID6 Taxonomy UI
   Visible question-bank taxonomy follows only:
   Chương → Bài → Dạng → Mức độ → ID6.
   Legacy lessonId / knowledgeCode remain hidden compatibility metadata.
   ========================================================= */
(function(){
  'use strict';
  const BUILD='37.4.2-pure-id6-taxonomy-ui';
  const api=()=>window.ID6V374;
  const hapi=()=>window.ID6V3741;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const attr=esc;
  const LEVEL_LABEL={NB:'Nhận biết',TH:'Thông hiểu',VD:'Vận dụng',VDC:'Vận dụng cao'};

  function meta(q={}){
    const pattern=api()?.inferPattern?.(q)||q.id6Pattern||'';
    const p=hapi()?.parsePattern?.(pattern)||null;
    const f=api()?.formByPattern?.(pattern)||null;
    const c=p?hapi()?.CHAPTER_META?.[p.prefix]:null;
    const id6=(api()?.isId6?.(q.id6)?q.id6:api()?.buildId6?.(pattern,q.level))||'';
    return {
      id6,pattern,p,f,c,
      chapter:p?.chapter||Number(q.id6Chapter)||0,
      lesson:p?.lesson||Number(q.id6Lesson)||0,
      form:p?.form||Number(q.id6Form)||0,
      lessonTitle:f?.officialLessonTitle||q.id6LessonTitle||'',
      formTitle:f?.title||q.id6FormTitle||q.form||'',
      levelLabel:LEVEL_LABEL[q.level]||q.level||''
    };
  }
  window.v3742QuestionDisplayMeta=meta;

  function controlLabel(el,text){
    if(!el)return null;
    const label=document.createElement('label');label.className='v3742-control';
    const span=document.createElement('span');span.textContent=text;label.appendChild(span);label.appendChild(el);return label;
  }

  function updatePathHint(){
    const hint=document.getElementById('v3742PathHint');if(!hint)return;
    const ch=document.getElementById('bankId6Chapter')?.value||'',lesson=document.getElementById('bankId6Lesson')?.value||'',form=document.getElementById('bankId6Form')?.value||'',level=document.getElementById('bankLevel')?.value||'';
    const c=hapi()?.chapterByPrefix?.(ch),l=hapi()?.lessonByKey?.(lesson),f=api()?.formByPattern?.(form),p=hapi()?.parsePattern?.(form);
    if(!c){hint.innerHTML='Chọn <b>Chương</b> để hệ thống chỉ hiện các bài và dạng thuộc chương đó.';return}
    const code=form&&level?api()?.buildId6?.(form,level):'';
    hint.innerHTML=`<span><b>Chương ${c.chapter}</b>${l?` → <b>Bài ${l.number}</b>`:''}${p?` → <b>Dạng ${p.form}</b>`:''}${level?` → <b>${esc(LEVEL_LABEL[level]||level)}</b>`:''}</span>${code?`<code>${esc(code)}</code>`:''}`;
  }

  function installPureFilters(){
    const card=document.getElementById('bankFiltersV36Anchor');
    const toolbar=card?.querySelector('.bank-toolbar');
    if(!card||!toolbar||document.getElementById('v3742PrimaryFilters'))return;
    const search=document.getElementById('bankSearch'),chapter=document.getElementById('bankId6Chapter'),lesson=document.getElementById('bankId6Lesson'),form=document.getElementById('bankId6Form'),level=document.getElementById('bankLevel');
    if(!chapter||!lesson||!form)return;

    const primary=document.createElement('div');primary.id='v3742PrimaryFilters';primary.className='v3742-primary-filters';
    if(search)primary.appendChild(controlLabel(search,'Tìm kiếm'));
    primary.appendChild(controlLabel(chapter,'Chương'));
    primary.appendChild(controlLabel(lesson,'Bài'));
    primary.appendChild(controlLabel(form,'Dạng toán'));
    if(level)primary.appendChild(controlLabel(level,'Mức độ'));

    const hint=document.createElement('div');hint.id='v3742PathHint';hint.className='v3742-path-hint';
    const secondary=document.createElement('div');secondary.className='v3742-secondary-filters';
    [['bankType','Loại câu'],['bankReviewStatus','Trạng thái'],['bankQualityV361','QC']].forEach(([id,label])=>{const e=document.getElementById(id);if(e)secondary.appendChild(controlLabel(e,label))});

    const advanced=document.createElement('details');advanced.id='v3742AdvancedFilters';advanced.className='v3742-advanced-filters';advanced.innerHTML='<summary><span>⚙ Bộ lọc nâng cao</span><small>Độ khó • nguồn • thẻ • trùng • sắp xếp • số câu/trang</small></summary><div class="v3742-advanced-grid"></div>';
    const ag=advanced.querySelector('.v3742-advanced-grid');
    [['bankDifficulty','Độ khó'],['bankSource','Nguồn'],['bankTag','Thẻ'],['bankDuplicateFilter','Trùng'],['bankSort','Sắp xếp'],['bankPageSize','Hiển thị']].forEach(([id,label])=>{const e=document.getElementById(id);if(e)ag.appendChild(controlLabel(e,label))});

    card.querySelector('.section-head')?.insertAdjacentElement('afterend',primary);
    primary.insertAdjacentElement('afterend',hint);hint.insertAdjacentElement('afterend',secondary);secondary.insertAdjacentElement('afterend',advanced);
    toolbar.classList.add('v3742-legacy-toolbar');
    const oldTax=toolbar.querySelector('.v3741-bank-taxonomy');if(oldTax)oldTax.remove();
    ['bankChapter','bankLesson','bankKnowledge','bankFormV36'].forEach(id=>document.getElementById(id)?.classList.add('v3742-force-hidden'));

    [chapter,lesson,form,level].filter(Boolean).forEach(e=>e.addEventListener('change',()=>setTimeout(updatePathHint,0)));
    updatePathHint();
    const head=card.querySelector('.section-head h3');if(head)head.textContent='Bộ lọc ngân hàng theo ID6';
    const desc=card.querySelector('.section-head p');if(desc)desc.textContent='Trục phân loại chính thức: Chương → Bài → Dạng → Mức độ → ID6. Các mã nội bộ F/K được ẩn khỏi giao diện.';
  }

  function purifyRows(){
    const tbody=document.getElementById('questionBankTable');if(!tbody)return;
    const header=tbody.closest('table')?.querySelector('thead tr');if(header){
      const th=[...header.children];if(th[0])th[0].textContent='ID6';if(th[2])th[2].textContent='Phân loại & nguồn';
    }
    [...tbody.querySelectorAll('tr')].forEach(tr=>{
      const cells=[...tr.cells];if(cells.length<7)return;
      const internal=(cells[0].querySelector('.v374-internal-id')||cells[0].querySelector('b'))?.textContent?.trim()||'';
      const q=(state.questionBank||[]).find(x=>x.id===internal)||null;if(!q)return;
      const m=meta(q),code=m.id6||'Chưa gán ID6';
      cells[0].innerHTML=`<b class="v3742-id6 ${m.id6?'ok':'review'}">${esc(code)}</b><small class="v3742-id6-sub">${m.chapter?`Chương ${m.chapter}`:'—'}${m.lesson?`Bài ${m.lesson}`:''}${m.form?`Dạng ${m.form}`:''}</small>`;
      const qs=cells[1].querySelector('small');if(qs)qs.innerHTML=`${m.lessonTitle?`<b>${esc(m.lessonTitle)}</b>`:''}${m.formTitle?`${m.lessonTitle?'':''}${esc(m.formTitle)}`:''}`;
      const source=[q.sourceName||'Chưa ghi nguồn',q.sourceYear||''].filter(Boolean).join('');
      cells[2].innerHTML=`<span class="pill v3742-pattern-pill">${esc(m.pattern||'Chưa phân loại')}</span><small class="v29-meta-line">${esc(source)}</small>`;
    });
  }

  function renderId6Coverage(){
    const host=document.getElementById('bankCoverageCodes');if(!host||!api()||!hapi())return;
    const bank=state.questionBank||[],h=hapi().hierarchy?.()||[];
    const counts={};bank.forEach(q=>{const p=api().inferPattern?.(q)||q.id6Pattern||'';if(p)counts[p]=(counts[p]||0)+1});
    const selected=document.getElementById('bankId6Chapter')?.value||'';
    host.className='v3742-id6-coverage';
    host.innerHTML=h.map(c=>`<details class="v3742-coverage-chapter" data-prefix="${esc(c.prefix)}" ${selected===c.prefix?'open':''}><summary><span><b>Chương ${c.chapter}. ${esc(c.title)}</b><small>${c.lessons.length} bài • ${c.formCount} dạng</small></span><strong>${c.forms.filter(f=>counts[f.id6Pattern]).length}/${c.formCount}</strong></summary><div class="v3742-coverage-lessons">${c.lessons.map(l=>`<div class="v3742-coverage-lesson"><div><b>Bài ${l.number}. ${esc(l.title)}</b><small>${l.forms.filter(f=>counts[f.id6Pattern]).length}/${l.forms.length} dạng đã có câu</small></div><div class="v3742-coverage-chips">${l.forms.map(f=>{const n=counts[f.id6Pattern]||0,p=hapi().parsePattern(f.id6Pattern);return `<button type="button" class="${n?'has':'missing'}" onclick="v3741UseBankForm('${attr(f.id6Pattern)}')" title="${attr(f.title)}"><code>${esc(f.id6Pattern)}</code><span>Dạng ${p?.form||''}</span><small>${n||0}</small></button>`}).join('')}</div></div>`).join('')}</div></details>`).join('');
    const ds=[...host.querySelectorAll('.v3742-coverage-chapter')];ds.forEach(d=>d.addEventListener('toggle',()=>{if(d.open)ds.forEach(o=>{if(o!==d)o.open=false})}));
    const card=host.closest('.card');const title=card?.querySelector('.section-head h3'),p=card?.querySelector('.section-head p');if(title)title.textContent='Độ phủ 91 dạng toán ID6';if(p)p.textContent='Mỗi chương được thu gọn độc lập; mở một chương để xem bài và dạng. Nhấn mã dạng để lọc ngân hàng.';
    const unique=Object.keys(counts).filter(p=>api().formByPattern?.(p)).length;
    const metric=document.getElementById('bankCoverage');if(metric)metric.textContent=Math.round(unique/Math.max(1,api().allForms().length)*100)+'%';
    const metricLabel=metric?.closest('.metric')?.querySelector('small');if(metricLabel)metricLabel.textContent='Phủ dạng ID6';
    const lessonKeys=new Set(bank.map(q=>{const p=hapi().parsePattern?.(api().inferPattern?.(q)||q.id6Pattern||'');return p?.lessonKey||''}).filter(Boolean));
    const lessonMetric=document.getElementById('bankLessons');if(lessonMetric)lessonMetric.textContent=`${lessonKeys.size}/17`;
    const lessonLabel=lessonMetric?.closest('.metric')?.querySelector('small');if(lessonLabel)lessonLabel.textContent='Bài ID6 có câu hỏi';
  }

  function hideLegacyMastery(){
    const hero=document.getElementById('v360KnowledgeOverview'),map=document.getElementById('v360KnowledgeMapCard');
    if(hero)hero.classList.add('v3742-master-compat-hidden');if(map)map.classList.add('v3742-master-compat-hidden');
    const tools=[...document.querySelectorAll('.v371-tool-group')].find(g=>/Bảo trì/i.test(g.querySelector('b')?.textContent||''));
    if(tools&&!document.getElementById('v3742MasteryCompatBtn')){const b=document.createElement('button');b.id='v3742MasteryCompatBtn';b.textContent='⚙ Mastery nội bộ (kỹ thuật)';b.onclick=()=>window.v3742ToggleLegacyMastery?.();tools.appendChild(b)}
  }
  function toggleLegacyMastery(){
    const hero=document.getElementById('v360KnowledgeOverview'),map=document.getElementById('v360KnowledgeMapCard');
    [hero,map].forEach(e=>e?.classList.toggle('v3742-master-compat-hidden'));
    if(map&&!map.classList.contains('v3742-master-compat-hidden')){map.open=false;map.scrollIntoView({behavior:'smooth',block:'start'})}
  }
  window.v3742ToggleLegacyMastery=toggleLegacyMastery;

  function purifyEditor(){
    const internal=document.getElementById('qeId')?.closest('.field');if(internal)internal.classList.add('v3742-force-hidden');
    ['qeLesson','qeKnowledge','qeForm','qeId6','qeFormV36Editor'].forEach(id=>document.getElementById(id)?.closest('.field')?.classList.add('v3742-force-hidden'));
    const panel=document.querySelector('.v3741-editor-taxonomy');if(panel){
      panel.querySelector('.v3741-editor-taxonomy-head b')?.replaceChildren(document.createTextNode('Phân loại câu hỏi theo ID6'));
      const s=panel.querySelector('.v3741-editor-taxonomy-head small');if(s)s.textContent='Chọn Chương → Bài → Dạng → Mức độ; ID6 được tạo tự động theo 6 tham số.';
    }
  }

  function patchStatic(){
    const card=document.getElementById('v374Id6Card');if(card){
      const small=card.querySelector('.v374-id6-head small');if(small)small.textContent='6 chương • 17 bài • 91 dạng chính thức. Giao diện ngân hàng chỉ dùng ID6; mã F/K cũ được giữ ẩn để tương thích dữ liệu.';
      const badge=card.querySelector('.v374-id6-badge');if(badge)badge.textContent='PURE ID6';
    }
    const bankDesc=document.querySelector('#page-question-bank > .page-head p');if(bankDesc&&/Lớp 12|Năm học/.test(bankDesc.textContent||'')){}
  }

  function afterRender(){installPureFilters();purifyRows();renderId6Coverage();hideLegacyMastery();patchStatic();updatePathHint()}

  function install(){
    if(typeof window.renderQuestionBank==='function'&&!window.renderQuestionBank.__pureId6V3742){const base=window.renderQuestionBank;const w=function(force=false){const out=base(force);afterRender();return out};w.__pureId6V3742=true;window.renderQuestionBank=w}
    if(typeof window.openQuestionEditor==='function'&&!window.openQuestionEditor.__pureId6V3742){const base=window.openQuestionEditor;const w=function(id=''){const out=base(id);setTimeout(purifyEditor,30);return out};w.__pureId6V3742=true;window.openQuestionEditor=w}
    afterRender();
  }

  window.ID6V3742={BUILD,meta,afterRender,updatePathHint};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
