/* =========================================================
   Math12 Hub V37.4.1 — Official ID6 hierarchy UX
   Visible taxonomy follows ID6 exactly:
   Grade 12 → Domain → Chapter → Level → Lesson → Form.
   Internal lessonId / knowledgeCode remain compatibility metadata only.
   ========================================================= */
(function(){
  'use strict';
  const BUILD='37.4.1-id6-hierarchy';
  const api=()=>window.ID6V374;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const attr=esc;
  const CHAPTER_META={
    '2D1':{chapter:1,domain:'D',domainLabel:'Đại số / Giải tích',title:'Ứng dụng đạo hàm để khảo sát hàm số'},
    '2H2':{chapter:2,domain:'H',domainLabel:'Hình học và đo lường',title:'Tọa độ của véc-tơ trong không gian'},
    '2D3':{chapter:3,domain:'D',domainLabel:'Đại số / Thống kê',title:'Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm'},
    '2D4':{chapter:4,domain:'D',domainLabel:'Đại số / Giải tích',title:'Nguyên hàm, tích phân và ứng dụng'},
    '2H5':{chapter:5,domain:'H',domainLabel:'Hình học và đo lường',title:'Phương trình mặt phẳng, đường thẳng, mặt cầu trong không gian Oxyz'},
    '2D6':{chapter:6,domain:'D',domainLabel:'Xác suất',title:'Một số yếu tố xác suất'}
  };
  const LEVEL_LABEL={NB:'Nhận biết',TH:'Thông hiểu',VD:'Vận dụng',VDC:'Vận dụng cao'};
  const LEVEL_BY_LETTER={N:'NB',H:'TH',V:'VD',C:'VDC'};
  const BANK_STORE='math12hub.v3741.id6BankFilter';
  function readBankStore(){try{return JSON.parse(localStorage.getItem(BANK_STORE)||'{}')||{}}catch(_){return {}}}
  function writeBankStore(){try{localStorage.setItem(BANK_STORE,JSON.stringify(selectedBank()))}catch(_){}}

  function parsePattern(pattern=''){
    const m=String(pattern).match(/^2([DH])(\d)\?(\d+)-(\d+)$/);
    if(!m)return null;
    return {grade:12,domain:m[1],chapter:Number(m[2]),lesson:Number(m[3]),form:Number(m[4]),prefix:`2${m[1]}${m[2]}`,lessonKey:`2${m[1]}${m[2]}?${m[3]}`,pattern:String(pattern)};
  }
  function parseId6(id6=''){
    const m=String(id6).match(/^2([DH])(\d)([NHVC])(\d+)-(\d+)$/);
    if(!m)return null;
    const level=LEVEL_BY_LETTER[m[3]]||'';
    return {grade:12,domain:m[1],chapter:Number(m[2]),level,levelLetter:m[3],lesson:Number(m[4]),form:Number(m[5]),prefix:`2${m[1]}${m[2]}`,lessonKey:`2${m[1]}${m[2]}?${m[4]}`,pattern:`2${m[1]}${m[2]}?${m[4]}-${m[5]}`,id6:String(id6)};
  }
  function allForms(){return api()?.allForms?.()||[]}
  function hierarchy(){
    const forms=allForms();
    return Object.entries(CHAPTER_META).map(([prefix,meta])=>{
      const rows=forms.map(f=>({f,p:parsePattern(f.id6Pattern)})).filter(x=>x.p?.prefix===prefix);
      const lessonNos=[...new Set(rows.map(x=>x.p.lesson))].sort((a,b)=>a-b);
      const lessons=lessonNos.map(no=>{
        const fr=rows.filter(x=>x.p.lesson===no).sort((a,b)=>a.p.form-b.p.form).map(x=>x.f);
        return {number:no,key:`${prefix}?${no}`,title:fr[0]?.officialLessonTitle||`Bài ${no}`,forms:fr};
      });
      return {...meta,prefix,lessons,forms:rows.map(x=>x.f),formCount:rows.length};
    }).sort((a,b)=>a.chapter-b.chapter);
  }
  function chapterByPrefix(prefix){return hierarchy().find(c=>c.prefix===prefix)||null}
  function lessonByKey(key){for(const c of hierarchy()){const l=c.lessons.find(x=>x.key===key);if(l)return {...l,chapter:c}}return null}
  function formByPattern(pattern){return api()?.formByPattern?.(pattern)||null}
  function patternForQuestion(q={}){return api()?.inferPattern?.(q)||q.id6Pattern||''}
  function internalLessonForPattern(pattern){
    const map=api()?.BY_APP_LESSON||{};
    for(const [lessonId,forms] of Object.entries(map))if(forms.some(f=>f.id6Pattern===pattern))return lessonId;
    return '';
  }
  function decode(pattern,level){
    const p=parsePattern(pattern);if(!p)return null;
    const c=CHAPTER_META[p.prefix],f=formByPattern(pattern),id6=api()?.buildId6?.(pattern,level)||'';
    return {...p,id6,level,levelLabel:LEVEL_LABEL[level]||level,chapterTitle:c?.title||'',domainLabel:c?.domainLabel||'',lessonTitle:f?.officialLessonTitle||'',formTitle:f?.title||''};
  }

  function optionChapters(selected=''){
    return '<option value="">Chọn chương</option>'+hierarchy().map(c=>`<option value="${c.prefix}" ${c.prefix===selected?'selected':''}>Chương ${c.chapter} • ${esc(c.title)}</option>`).join('');
  }
  function optionLessons(prefix,selected=''){
    const c=chapterByPrefix(prefix);if(!c)return '<option value="">Chọn chương trước</option>';
    return '<option value="">Tất cả bài trong chương</option>'+c.lessons.map(l=>`<option value="${l.key}" ${l.key===selected?'selected':''}>Bài ${l.number} • ${esc(l.title)}</option>`).join('');
  }
  function optionForms(lessonKey,selected=''){
    const l=lessonByKey(lessonKey);if(!l)return '<option value="">Chọn bài trước</option>';
    return '<option value="">Tất cả dạng trong bài</option>'+l.forms.map(f=>{const p=parsePattern(f.id6Pattern);return `<option value="${f.id6Pattern}" ${f.id6Pattern===selected?'selected':''}>Dạng ${p?.form||''} • ${esc(f.title)}</option>`}).join('');
  }

  function selectedBank(){return {chapter:document.getElementById('bankId6Chapter')?.value||'',lesson:document.getElementById('bankId6Lesson')?.value||'',form:document.getElementById('bankId6Form')?.value||''}}
  function resetLegacyBankTaxonomy(){['bankChapter','bankLesson','bankKnowledge','bankFormV36'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''})}
  function refreshBankHierarchy(from='chapter'){
    const ch=document.getElementById('bankId6Chapter'),ls=document.getElementById('bankId6Lesson'),fm=document.getElementById('bankId6Form');if(!ch||!ls||!fm)return;
    if(from==='chapter'){
      const oldL=ls.value;ls.innerHTML=optionLessons(ch.value,oldL);ls.disabled=!ch.value;if(![...ls.options].some(o=>o.value===oldL))ls.value='';
    }
    if(from==='chapter'||from==='lesson'){
      const oldF=fm.value;fm.innerHTML=optionForms(ls.value,oldF);fm.disabled=!ls.value;if(![...fm.options].some(o=>o.value===oldF))fm.value='';
    }
    const hint=document.getElementById('bankId6PathHint');if(hint){const c=chapterByPrefix(ch.value),l=lessonByKey(ls.value),f=formByPattern(fm.value);hint.innerHTML=c?`<b>Đang lọc:</b> Chương ${c.chapter}${l?` → Bài ${l.number}`:''}${f?` → ${esc(f.id6Pattern)} • ${esc(f.title)}`:''}`:'Chọn một chương để chỉ hiện các bài và dạng thuộc chương đó.'}
    resetLegacyBankTaxonomy();
  }
  function injectBankHierarchy(){
    const toolbar=document.querySelector('#bankFiltersV36Anchor .bank-toolbar');if(!toolbar||document.getElementById('bankId6Chapter'))return;
    ['bankChapter','bankLesson','bankKnowledge','bankFormV36'].forEach(id=>document.getElementById(id)?.classList.add('v3741-legacy-taxonomy-hidden'));
    const search=document.getElementById('bankSearch');
    const wrap=document.createElement('div');wrap.className='v3741-bank-taxonomy';wrap.innerHTML=`<div class="v3741-bank-taxonomy-grid"><select id="bankId6Chapter" aria-label="Chương ID6">${optionChapters()}</select><select id="bankId6Lesson" aria-label="Bài ID6" disabled><option value="">Chọn chương trước</option></select><select id="bankId6Form" aria-label="Dạng toán ID6" disabled><option value="">Chọn bài trước</option></select></div><div id="bankId6PathHint" class="v3741-path-hint">Chọn một chương để chỉ hiện các bài và dạng thuộc chương đó.</div>`;
    if(search)search.insertAdjacentElement('afterend',wrap);else toolbar.prepend(wrap);
    const ch=document.getElementById('bankId6Chapter'),ls=document.getElementById('bankId6Lesson'),fm=document.getElementById('bankId6Form');
    const saved=readBankStore();if(saved.chapter&&chapterByPrefix(saved.chapter)){ch.value=saved.chapter;refreshBankHierarchy('chapter');if(saved.lesson&&lessonByKey(saved.lesson)){ls.value=saved.lesson;refreshBankHierarchy('lesson');if(saved.form&&formByPattern(saved.form)){fm.value=saved.form;refreshBankHierarchy('form')}}}
    ch.addEventListener('change',()=>{refreshBankHierarchy('chapter');writeBankStore();try{v29BankPage=1}catch(_){ }renderQuestionBank?.(false)});
    ls.addEventListener('change',()=>{refreshBankHierarchy('lesson');writeBankStore();try{v29BankPage=1}catch(_){ }renderQuestionBank?.(false)});
    fm.addEventListener('change',()=>{refreshBankHierarchy('form');writeBankStore();try{v29BankPage=1}catch(_){ }renderQuestionBank?.(false)});
    refreshBankHierarchy('chapter');
  }
  function matchOfficialFilter(q){
    const s=selectedBank(),p=parsePattern(patternForQuestion(q));
    if(!s.chapter&&!s.lesson&&!s.form)return true;
    if(!p)return false;
    if(s.chapter&&p.prefix!==s.chapter)return false;
    if(s.lesson&&p.lessonKey!==s.lesson)return false;
    if(s.form&&p.pattern!==s.form)return false;
    return true;
  }
  function installBankFilterWrapper(){
    if(typeof window.v29FilteredQuestions!=='function'||window.v29FilteredQuestions.__id6Hierarchy)return;
    const base=window.v29FilteredQuestions;
    const wrapped=function(){
      const ids=['bankChapter','bankLesson','bankKnowledge','bankFormV36'],saved=ids.map(id=>[id,document.getElementById(id)?.value||'']);
      saved.forEach(([id])=>{const e=document.getElementById(id);if(e)e.value=''});
      let rows;try{rows=base()}finally{saved.forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.value=v})}
      return rows.filter(matchOfficialFilter);
    };
    wrapped.__id6Hierarchy=true;window.v29FilteredQuestions=wrapped;
  }

  function setSelect(el,value){if(!el)return;el.value=[...el.options].some(o=>o.value===value)?value:''}
  function syncHiddenEditor(pattern,keepKnowledge=true){
    if(!pattern)return;
    const lessonId=internalLessonForPattern(pattern),oldKnowledge=document.getElementById('qeKnowledge')?.value||'';
    const lesson=document.getElementById('qeLesson');if(lesson&&lessonId){setSelect(lesson,lessonId);if(typeof updateQuestionEditorKnowledge==='function')updateQuestionEditorKnowledge()}
    const knowledge=document.getElementById('qeKnowledge');if(knowledge&&keepKnowledge&&oldKnowledge&&[...knowledge.options].some(o=>o.value===oldKnowledge))knowledge.value=oldKnowledge;
    const formSel=document.getElementById('qeFormV36Editor');if(formSel){if(![...formSel.options].some(o=>o.value===pattern)){const f=formByPattern(pattern),o=document.createElement('option');o.value=pattern;o.textContent=`${pattern} • ${f?.title||''}`;formSel.appendChild(o)}formSel.value=pattern;formSel.dispatchEvent(new Event('change',{bubbles:true}))}
    const free=document.getElementById('qeForm');if(free)free.value=formByPattern(pattern)?.title||free.value;
    window.v374RefreshEditorId6?.();
  }
  function refreshEditorHierarchy(from='chapter'){
    const ch=document.getElementById('qeId6ChapterOfficial'),ls=document.getElementById('qeId6LessonOfficial'),fm=document.getElementById('qeId6FormOfficial');if(!ch||!ls||!fm)return;
    if(from==='chapter'){
      const old=ls.value;ls.innerHTML=optionLessons(ch.value,old).replace('Tất cả bài trong chương','Chọn bài');ls.disabled=!ch.value;if(![...ls.options].some(o=>o.value===old))ls.value='';
    }
    if(from==='chapter'||from==='lesson'){
      const old=fm.value;fm.innerHTML=optionForms(ls.value,old).replace('Tất cả dạng trong bài','Chọn dạng toán');fm.disabled=!ls.value;if(![...fm.options].some(o=>o.value===old))fm.value='';
    }
    if(fm.value)syncHiddenEditor(fm.value,false);
    renderEditorDecode();
  }
  function renderEditorDecode(){
    const pattern=document.getElementById('qeId6FormOfficial')?.value||'',level=document.getElementById('qeLevel')?.value||'',d=decode(pattern,level),box=document.getElementById('qeId6DecodeV3741');if(!box)return;
    if(!d){box.innerHTML='<span>Chọn Chương → Bài → Dạng; mức độ sẽ hoàn thiện ID6.</span>';return}
    box.innerHTML=`<code>${esc(d.id6||d.pattern)}</code><span><b>Lớp 12</b> → ${esc(d.domainLabel)} → <b>Chương ${d.chapter}</b> → ${esc(d.levelLabel)} → <b>Bài ${d.lesson}</b> → <b>Dạng ${d.form}</b></span>`;
  }
  function injectEditorHierarchy(id=''){
    const grid=document.querySelector('#modalBody .field-grid');if(!grid||document.getElementById('qeId6ChapterOfficial'))return;
    const q=id?(state.questionBank||[]).find(x=>x.id===id):null,pattern=patternForQuestion(q||{}),p=parsePattern(pattern);
    const panel=document.createElement('div');panel.className='field full v3741-editor-taxonomy';panel.innerHTML=`<div class="v3741-editor-taxonomy-head"><div><b>Phân loại ID6 chính thức</b><small>Chọn đúng thứ tự Chương → Bài → Dạng. Mức độ N/H/V/C được lấy từ ô Mức độ bên dưới.</small></div><span class="v3741-id6-chip">ID6</span></div><div class="v3741-editor-taxonomy-grid"><label><span>Chương</span><select id="qeId6ChapterOfficial">${optionChapters(p?.prefix||'')}</select></label><label><span>Bài</span><select id="qeId6LessonOfficial" ${p?'':'disabled'}>${optionLessons(p?.prefix||'',p?.lessonKey||'').replace('Tất cả bài trong chương','Chọn bài')}</select></label><label class="wide"><span>Dạng toán</span><select id="qeId6FormOfficial" ${p?'':'disabled'}>${optionForms(p?.lessonKey||'',pattern).replace('Tất cả dạng trong bài','Chọn dạng toán')}</select></label></div><div id="qeId6DecodeV3741" class="v3741-id6-decode"></div>`;
    grid.insertBefore(panel,grid.firstChild);
    ['qeLesson','qeKnowledge'].forEach(fid=>document.getElementById(fid)?.closest('.field')?.classList.add('v3741-editor-compat-hidden'));
    document.getElementById('qeForm')?.closest('.field')?.classList.add('v3741-editor-compat-hidden');
    document.getElementById('qeId6')?.closest('.field')?.classList.add('v3741-editor-compat-hidden');
    const ch=document.getElementById('qeId6ChapterOfficial'),ls=document.getElementById('qeId6LessonOfficial'),fm=document.getElementById('qeId6FormOfficial');
    ch.addEventListener('change',()=>refreshEditorHierarchy('chapter'));ls.addEventListener('change',()=>refreshEditorHierarchy('lesson'));fm.addEventListener('change',()=>refreshEditorHierarchy('form'));
    document.getElementById('qeLevel')?.addEventListener('change',()=>{if(fm.value)syncHiddenEditor(fm.value,true);renderEditorDecode()});
    if(pattern)syncHiddenEditor(pattern,true);renderEditorDecode();
  }

  function catalogBody(){
    const h=hierarchy();
    return `<div class="v374-catalog-intro"><b>91 dạng toán Toán 12 • cấu trúc ID6</b><p>Chỉ mở một chương tại một thời điểm. Mẫu <code>2D1?2-2</code> trở thành <code>2D1H2-2</code> khi mức độ là Thông hiểu.</p></div><div class="v3741-catalog-chapters">${h.map(c=>`<details class="v3741-catalog-chapter" data-prefix="${c.prefix}"><summary><span><b>Chương ${c.chapter}. ${esc(c.title)}</b><small>${esc(c.domainLabel)} • ${c.lessons.length} bài • ${c.formCount} dạng</small></span><strong>${c.prefix}</strong></summary><div class="v3741-catalog-lessons">${c.lessons.map(l=>`<details class="v3741-catalog-lesson"><summary><b>Bài ${l.number}. ${esc(l.title)}</b><span>${l.forms.length} dạng</span></summary><div class="v374-catalog-list">${l.forms.map(f=>{const p=parsePattern(f.id6Pattern);return `<div><code>${esc(f.id6Pattern)}</code><span><b>Dạng ${p?.form||''}.</b> ${esc(f.title)}</span><small>Bài ${p?.lesson||''} • Chương ${p?.chapter||''}</small></div>`}).join('')}</div></details>`).join('')}</div></details>`).join('')}</div>`;
  }
  function openCatalog(){
    if(typeof requireTeacher==='function'&&!requireTeacher('Danh mục ID6'))return;
    openModal('Danh mục ID6 Toán 12 • V37.4.2','Chương → Bài → Dạng; các chương còn lại tự thu gọn',catalogBody(),'<button class="btn btn-blue" onclick="closeModal()">Đóng</button>');
    setTimeout(()=>{const all=[...document.querySelectorAll('.v3741-catalog-chapter')];all.forEach(d=>d.addEventListener('toggle',()=>{if(d.open)all.forEach(o=>{if(o!==d)o.open=false})}))},0);
  }

  function renderHierarchyBrowser(prefix='2D1'){
    const host=document.getElementById('v3741HierarchyBrowser');if(!host)return;const h=hierarchy(),c=chapterByPrefix(prefix)||h[0];
    host.innerHTML=`<div class="v3741-chapter-tabs">${h.map(x=>`<button type="button" class="${x.prefix===c.prefix?'active':''}" onclick="v3741ShowChapter('${x.prefix}')"><span>Chương ${x.chapter}</span><small>${x.domain}</small></button>`).join('')}</div><div class="v3741-selected-chapter"><div><b>Chương ${c.chapter}. ${esc(c.title)}</b><small>${esc(c.domainLabel)} • ${c.lessons.length} bài • ${c.formCount} dạng</small></div><code>${c.prefix}</code></div><div class="v3741-browser-lessons">${c.lessons.map((l,i)=>`<details ${i===0?'open':''}><summary><span><b>Bài ${l.number}. ${esc(l.title)}</b><small>${l.forms.length} dạng</small></span></summary><div>${l.forms.map(f=>{const p=parsePattern(f.id6Pattern);return `<button type="button" onclick="v3741UseBankForm('${f.id6Pattern}')"><code>${esc(f.id6Pattern)}</code><span><b>Dạng ${p?.form||''}.</b> ${esc(f.title)}</span></button>`}).join('')}</div></details>`).join('')}</div>`;
  }
  function injectHierarchyBrowser(){
    const card=document.getElementById('v374Id6Card');if(!card)return;if(document.getElementById('v3741HierarchyBrowser'))return;
    const head=card.querySelector('.v374-id6-head small');if(head)head.textContent='Cấu trúc hiển thị thống nhất theo ID6: 6 chương • 17 bài chính thức • 91 dạng. 19 bài/57 chuẩn cũ chỉ còn là metadata tương thích Mastery.';
    const box=document.createElement('div');box.id='v3741HierarchyBrowser';box.className='v3741-hierarchy-browser';card.appendChild(box);renderHierarchyBrowser('2D1');
  }
  function useBankForm(pattern){
    const p=parsePattern(pattern);if(!p)return;injectBankHierarchy();const ch=document.getElementById('bankId6Chapter'),ls=document.getElementById('bankId6Lesson'),fm=document.getElementById('bankId6Form');
    ch.value=p.prefix;refreshBankHierarchy('chapter');ls.value=p.lessonKey;refreshBankHierarchy('lesson');fm.value=pattern;refreshBankHierarchy('form');writeBankStore();try{v29BankPage=1}catch(_){ }renderQuestionBank?.(false);document.getElementById('bankFiltersV36Anchor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function addOfficialMetadata(q={}){
    const pattern=patternForQuestion(q),p=parsePattern(pattern);if(!p)return q;const c=CHAPTER_META[p.prefix],f=formByPattern(pattern);
    return {...q,id6Domain:p.domain,id6Chapter:p.chapter,id6Lesson:p.lesson,id6Form:p.form,id6ChapterTitle:c?.title||'',id6LessonTitle:f?.officialLessonTitle||'',id6FormTitle:f?.title||q.form||'',id6HierarchyBuild:BUILD};
  }

  function patchStaticText(){
    const lessonMetric=document.getElementById('v360MetricLessons');if(lessonMetric)lessonMetric.textContent='17';
    const detail=document.querySelector('#v360KnowledgeMapCard summary small');if(detail)detail.textContent='Mastery tương thích: 19 bài nội bộ • 57 chuẩn; phân loại câu hỏi chính thức dùng 6 chương • 17 bài • 91 dạng ID6.';
    const h3=document.querySelector('#bankFiltersV36Anchor .section-head h3');if(h3)h3.textContent='Bộ lọc ID6 theo Chương → Bài → Dạng';
    const p=document.querySelector('#bankFiltersV36Anchor .section-head p');if(p)p.textContent='Chọn chương trước; hệ thống chỉ nạp các bài của chương đó. Chọn bài để hiện đúng các dạng thuộc bài.';
    const kh=document.querySelector('#v360KnowledgeOverview .section-head h3, #v360KnowledgeOverview h3');if(kh)kh.textContent='Bản đồ Mastery nội bộ (tương thích)';
    const kp=document.querySelector('#v360KnowledgeOverview .section-head p, #v360KnowledgeOverview p');if(kp)kp.textContent='19 bài nội bộ / 57 chuẩn được giữ để bảo toàn tiến độ và Mastery; phân loại câu hỏi mới dùng cấu trúc ID6 6 chương / 17 bài / 91 dạng.';
    const cov=document.querySelector('#bankCoverageCodes')?.closest('.card')?.querySelector('.section-head h3');if(cov)cov.textContent='Độ phủ 57 chuẩn Mastery (metadata tương thích)';
  }

  function install(){
    injectBankHierarchy();installBankFilterWrapper();injectHierarchyBrowser();patchStaticText();
    if(typeof window.openQuestionEditor==='function'&&!window.openQuestionEditor.__id6Hierarchy){const base=window.openQuestionEditor;const w=function(id=''){const out=base(id);setTimeout(()=>injectEditorHierarchy(id),20);return out};w.__id6Hierarchy=true;window.openQuestionEditor=w}
    if(typeof window.saveQuestionEditor==='function'&&!window.saveQuestionEditor.__id6Hierarchy){const base=window.saveQuestionEditor;const w=function(editId=''){const fm=document.getElementById('qeId6FormOfficial');if(fm&&!fm.value){alert('V37.4.2: Hãy chọn Chương → Bài → Dạng toán ID6 trước khi lưu câu hỏi.');return}if(fm?.value)syncHiddenEditor(fm.value,true);const internal=(document.getElementById('qeId')?.value||'').trim().replace(/[^A-Za-z0-9._-]/g,'-'),out=base(editId),id=internal||editId;let idx=id?(state.questionBank||[]).findIndex(q=>q.id===id):-1;if(idx<0&&!editId)idx=0;if(idx>=0){state.questionBank[idx]=addOfficialMetadata(state.questionBank[idx]);save?.({reason:'v37.4.1-id6-hierarchy'});renderQuestionBank?.(true)}return out};w.__id6Hierarchy=true;window.saveQuestionEditor=w}
    if(typeof window.renderQuestionBank==='function'&&!window.renderQuestionBank.__id6Hierarchy){const base=window.renderQuestionBank;const w=function(force=false){injectBankHierarchy();const out=base(force);injectHierarchyBrowser();patchStaticText();return out};w.__id6Hierarchy=true;window.renderQuestionBank=w}
    window.v374OpenId6Catalog=openCatalog;
  }

  window.ID6V3741={BUILD,CHAPTER_META,parsePattern,parseId6,hierarchy,chapterByPrefix,lessonByKey,decode,internalLessonForPattern,addOfficialMetadata};
  window.v3741RefreshBankHierarchy=refreshBankHierarchy;window.v3741ShowChapter=renderHierarchyBrowser;window.v3741UseBankForm=useBankForm;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
