/* =========================================================
   Math12 Hub V36.0 — Knowledge Map & Question Bank Engine
   Foundation layer for V36.x:
   Chapter → Lesson → Knowledge unit → Standard form → Question.
   No new Firestore collection. Existing V29 question documents remain compatible.
   V36 metadata is additive and can be normalized explicitly by the teacher.
   ========================================================= */
(function(){
  'use strict';
  const BUILD='36.0-knowledge-map';
  const CURRICULUM_ID='MATH12-GDPT2018-2026';
  const QUESTION_BANK_SCHEMA=36;
  const MAP_VERSION=36;
  let mapCache=null;
  let renderBusy=false;

  function clone(x){return JSON.parse(JSON.stringify(x))}
  function norm(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
  function escHtml(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function attr(v=''){return escHtml(v)}
  function iso(){return new Date().toISOString()}

  function buildMap(){
    if(mapCache)return mapCache;
    const cs=(typeof chapters!=='undefined'?chapters:[]).map(c=>{
      const lessons=(c.lessons||[]).map(l=>{
        const meta=typeof getLessonMeta==='function'?getLessonMeta(l.id):{knowledge:[],forms:[]};
        const knowledge=(meta.knowledge||[]).map((k,i)=>({
          chapterId:Number(c.id)||0,lessonId:l.id,code:k.code,title:k.title,level:k.level||'TH',summary:k.summary||'',order:i+1
        }));
        const forms=(meta.forms||[]).map((f,i)=>{
          const paired=knowledge[Math.min(i,Math.max(0,knowledge.length-1))]||null;
          return {chapterId:Number(c.id)||0,lessonId:l.id,id:`${l.id}.D${i+1}`,title:f.title||`Dạng ${i+1}`,level:f.level||paired?.level||'TH',tip:f.tip||'',knowledgeCode:paired?.code||'',order:i+1};
        });
        return {chapterId:Number(c.id)||0,id:l.id,title:l.common||l.id,minutes:Number(meta.minutes)||45,goals:meta.goals||[],knowledge,forms};
      });
      return {id:Number(c.id)||0,title:c.title||'',desc:c.desc||'',lessons};
    });
    const lessons=cs.flatMap(c=>c.lessons),knowledge=lessons.flatMap(l=>l.knowledge),forms=lessons.flatMap(l=>l.forms);
    mapCache={build:BUILD,curriculumId:CURRICULUM_ID,mapVersion:MAP_VERSION,grade:12,program:'GDPT 2018',schoolYear:'2026–2027',chapters:cs,lessons,knowledge,forms,counts:{chapters:cs.length,lessons:lessons.length,knowledge:knowledge.length,forms:forms.length}};
    return mapCache;
  }
  function allForms(){return buildMap().forms}
  function getKnowledge(code=''){return buildMap().knowledge.find(k=>k.code===code)||null}
  function getForm(id=''){return buildMap().forms.find(f=>f.id===id)||null}
  function lessonForms(lessonId=''){return buildMap().forms.filter(f=>f.lessonId===lessonId)}
  function formForQuestion(q={}){
    if(q.formId){const f=getForm(q.formId);if(f)return f}
    const forms=lessonForms(q.lessonId);
    if(!forms.length)return null;
    const text=norm(q.form||q.formTitle||'');
    if(text){
      const exact=forms.find(f=>norm(f.title)===text);if(exact)return exact;
      const partial=forms.find(f=>norm(f.title).includes(text)||text.includes(norm(f.title)));if(partial)return partial;
    }
    const byKnowledge=forms.find(f=>f.knowledgeCode===q.knowledgeCode&&(!q.level||f.level===q.level));if(byKnowledge)return byKnowledge;
    return forms.find(f=>f.knowledgeCode===q.knowledgeCode)||forms.find(f=>f.level===q.level)||forms[0];
  }
  function metadataFor(q={},preferredFormId=''){
    const k=getKnowledge(q.knowledgeCode)||null;
    const lesson=k?.lessonId||q.lessonId||'';
    const l=buildMap().lessons.find(x=>x.id===lesson)||null;
    const c=buildMap().chapters.find(x=>x.id===Number(l?.chapterId||q.chapterId))||null;
    const f=(preferredFormId&&getForm(preferredFormId))||formForQuestion({...q,lessonId:lesson});
    const level=['NB','TH','VD'].includes(q.level)?q.level:(k?.level||f?.level||'TH');
    const type=['mcq','tf','tf4','short'].includes(q.type)?q.type:'';
    const complete=!!(c&&l&&k&&f&&level&&type);
    return {
      questionBankSchema:QUESTION_BANK_SCHEMA,
      curriculumId:CURRICULUM_ID,
      knowledgeMapVersion:MAP_VERSION,
      grade:12,
      chapterId:Number(c?.id||q.chapterId)||0,
      lessonId:l?.id||q.lessonId||'',
      knowledgeCode:k?.code||q.knowledgeCode||'',
      knowledgeTitle:k?.title||q.knowledgeTitle||'',
      formId:f?.id||q.formId||'',
      formTitle:f?.title||q.formTitle||q.form||'',
      form:q.form||f?.title||'',
      level,
      blueprintKey:[k?.code||q.knowledgeCode||'',f?.id||q.formId||'',level,type].join('|'),
      taxonomyPath:[c?`C${c.id}`:'',l?.id||'',k?.code||'',f?.id||''].filter(Boolean).join(' > '),
      metadataStatusV36:complete?'complete':'incomplete'
    };
  }
  function normalizedQuestion(q={},preferredFormId=''){return {...q,...metadataFor(q,preferredFormId)}}
  function isComplete(q={}){
    const m=metadataFor(q,q.formId||'');
    return m.metadataStatusV36==='complete'&&Number(q.questionBankSchema)===QUESTION_BANK_SCHEMA&&q.curriculumId===CURRICULUM_ID&&Number(q.knowledgeMapVersion)===MAP_VERSION&&q.formId===m.formId&&q.blueprintKey===m.blueprintKey;
  }
  function analyzeBank(){
    const bank=Array.isArray(state?.questionBank)?state.questionBank:[],map=buildMap(),complete=bank.filter(isComplete).length;
    const coverage={};map.forms.forEach(f=>coverage[f.id]=0);bank.forEach(q=>{const f=formForQuestion(q);if(f)coverage[f.id]=(coverage[f.id]||0)+1});
    const coveredForms=Object.values(coverage).filter(n=>n>0).length;
    return {total:bank.length,complete,needs:bank.length-complete,coverage,coveredForms,map};
  }

  async function normalizeBank(persist=true){
    if(typeof requireTeacher==='function'&&!requireTeacher('Chuẩn hóa Knowledge Map V36'))return {changed:0};
    const bank=Array.isArray(state?.questionBank)?state.questionBank:[];
    const before=analyzeBank();
    if(!before.needs){window.v353Toast?.('Ngân hàng đã đạt metadata V36.0.');renderAll();return {changed:0}}
    if(persist&&!confirm(`Chuẩn hóa ${before.needs}/${before.total} câu sang metadata V36.0?\n\nHệ thống chỉ bổ sung metadata, không thay nội dung câu hỏi/đáp án. Một điểm cứu hộ sẽ được tạo trước khi lưu nếu Data Safety đang sẵn sàng.`))return {changed:0,cancelled:true};
    if(persist&&typeof v21CreateRecoverySnapshot==='function'){try{await v21CreateRecoverySnapshot('v36-knowledge-map-normalize',false)}catch(_){}}
    let changed=0;
    state.questionBank=bank.map(q=>{const n=normalizedQuestion(q);if(JSON.stringify(q)!==JSON.stringify(n))changed++;return n});
    state._meta=state._meta||{};state._meta.questionBankSchema=QUESTION_BANK_SCHEMA;state._meta.knowledgeMapVersion=MAP_VERSION;state._meta.curriculumId=CURRICULUM_ID;state._meta.v36NormalizedAt=iso();
    if(persist&&changed&&typeof save==='function')save({reason:'v36-knowledge-map-normalize'});
    renderAll();
    if(persist)window.v353Toast?.(`V36.0 đã chuẩn hóa ${changed} câu hỏi.`);
    return {changed};
  }

  function coverageClass(n){return n>=3?'good':n>0?'partial':'missing'}
  function renderMap(){
    const root=document.getElementById('v360KnowledgeMap');if(!root||renderBusy)return;
    renderBusy=true;
    try{
      const a=analyzeBank(),m=a.map;
      const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v)};
      set('v360MetricChapters',m.counts.chapters);set('v360MetricLessons',m.counts.lessons);set('v360MetricKnowledge',m.counts.knowledge);set('v360MetricForms',m.counts.forms);
      set('v360MetricMetadata',a.total?`${Math.round(a.complete/a.total*100)}%`:'100%');set('v360MetricFormCoverage',m.counts.forms?`${Math.round(a.coveredForms/m.counts.forms*100)}%`:'0%');
      const migration=document.getElementById('v360MigrationState');if(migration)migration.innerHTML=a.needs?`<span class="v360-status warn">${a.needs} câu cần chuẩn hóa</span><small>${a.complete}/${a.total} câu đã có metadata V36.0</small>`:`<span class="v360-status good">✓ Metadata đã đồng bộ</span><small>${a.complete}/${a.total} câu đạt cấu trúc V36.0</small>`;
      root.innerHTML=m.chapters.map(c=>{
        const qChapter=(state.questionBank||[]).filter(q=>Number(q.chapterId)===Number(c.id)).length;
        const chapterForms=c.lessons.flatMap(l=>l.forms),covered=chapterForms.filter(f=>(a.coverage[f.id]||0)>0).length;
        return `<details class="v360-chapter" ${c.id===1?'open':''}><summary><span><b>Chương ${c.id}. ${escHtml(c.title)}</b><small>${c.lessons.length} bài • ${c.lessons.flatMap(l=>l.knowledge).length} chuẩn • ${qChapter} câu</small></span><span class="v360-cover">${covered}/${chapterForms.length} dạng có dữ liệu</span></summary><div class="v360-lessons">${c.lessons.map(l=>{
          const qLesson=(state.questionBank||[]).filter(q=>q.lessonId===l.id).length;
          return `<div class="v360-lesson"><div class="v360-lesson-head"><div><b>${l.id} • ${escHtml(l.title)}</b><small>${qLesson} câu • ${l.minutes} phút gợi ý</small></div><button type="button" class="btn btn-soft" onclick="v360FilterLesson('${attr(l.id)}')">Lọc ngân hàng</button></div><div class="v360-taxonomy">${l.knowledge.map(k=>{
            const f=l.forms.find(x=>x.knowledgeCode===k.code)||null,n=f?(a.coverage[f.id]||0):0;
            return `<button type="button" class="v360-node ${coverageClass(n)}" onclick="v360ApplyKnowledgeFilter('${attr(k.code)}','${attr(f?.id||'')}')"><span class="v360-node-code">${escHtml(k.code)}</span><span class="v360-node-main"><b>${escHtml(k.title)}</b><small>${f?`${escHtml(f.id)} • ${escHtml(f.title)}`:'Chưa ánh xạ dạng toán'}</small></span><span class="level-badge ${typeof levelClass==='function'?levelClass(k.level):''}">${typeof levelName==='function'?levelName(k.level):k.level}</span><span class="v360-node-count">${n} câu</span></button>`
          }).join('')}</div></div>`
        }).join('')}</div></details>`
      }).join('');
    }finally{renderBusy=false}
  }

  function refreshFormFilter(){
    const el=document.getElementById('bankFormV36');if(!el)return;
    const lessonId=document.getElementById('bankLesson')?.value||'',knowledgeCode=document.getElementById('bankKnowledge')?.value||'',old=el.value;
    let forms=allForms();if(lessonId)forms=forms.filter(f=>f.lessonId===lessonId);if(knowledgeCode)forms=forms.filter(f=>f.knowledgeCode===knowledgeCode);
    el.innerHTML='<option value="">Tất cả dạng toán</option>'+forms.map(f=>`<option value="${attr(f.id)}">${escHtml(f.id)} • ${escHtml(f.title)}</option>`).join('');
    if(forms.some(f=>f.id===old))el.value=old;
  }
  function applyKnowledgeFilter(code='',formId=''){
    const k=getKnowledge(code);if(!k)return;
    const ch=document.getElementById('bankChapter'),ls=document.getElementById('bankLesson'),kn=document.getElementById('bankKnowledge');
    if(ch)ch.value=String(k.chapterId);if(typeof refreshBankFilterOptions==='function')refreshBankFilterOptions(false);
    if(ls)ls.value=k.lessonId;if(typeof refreshBankFilterOptions==='function')refreshBankFilterOptions(false);
    if(kn)kn.value=code;refreshFormFilter();const fm=document.getElementById('bankFormV36');if(fm&&formId)fm.value=formId;
    try{v29BankPage=1}catch(_){};if(typeof renderQuestionBank==='function')renderQuestionBank(false);
    document.getElementById('bankFiltersV36Anchor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function filterLesson(lessonId=''){
    const l=buildMap().lessons.find(x=>x.id===lessonId);if(!l)return;const ch=document.getElementById('bankChapter'),ls=document.getElementById('bankLesson');
    if(ch)ch.value=String(l.chapterId);if(typeof refreshBankFilterOptions==='function')refreshBankFilterOptions(false);if(ls)ls.value=l.id;if(typeof refreshBankFilterOptions==='function')refreshBankFilterOptions(false);refreshFormFilter();try{v29BankPage=1}catch(_){};renderQuestionBank?.(false);document.getElementById('bankFiltersV36Anchor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function scrollMap(){const el=document.getElementById('v360KnowledgeMapCard');if(el&&el.tagName==='DETAILS')el.open=true;el?.scrollIntoView({behavior:'smooth',block:'start'})}

  function exportMap(){
    if(typeof requireTeacher==='function'&&!requireTeacher('Xuất Knowledge Map'))return;
    const a=analyzeBank(),payload={format:'math12hub-v36-knowledge-map',version:APP_VERSION,build:BUILD,createdAt:iso(),curriculum:clone(a.map),coverage:a.coverage,bankSummary:{total:a.total,metadataComplete:a.complete,coveredForms:a.coveredForms}};
    if(typeof triggerJsonDownload==='function')return triggerJsonDownload(payload,`math12-knowledge-map-v36-${new Date().toISOString().slice(0,10)}.json`);
    const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));link.download='math12-knowledge-map-v36.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)
  }

  function injectFormEditor(id=''){
    const input=document.getElementById('qeForm');if(!input||document.getElementById('qeFormV36Editor'))return;
    const q=id?(state.questionBank||[]).find(x=>x.id===id):null,field=input.closest('.field');if(!field)return;
    const select=document.createElement('select');select.id='qeFormV36Editor';select.setAttribute('aria-label','Dạng toán chuẩn V36');field.insertBefore(select,input);
    input.placeholder='Có thể nhập dạng riêng nếu chưa có trong Knowledge Map';input.classList.add('v360-custom-form-input');
    const hint=document.createElement('div');hint.className='math-help v360-editor-path';hint.id='v360EditorPath';field.appendChild(hint);
    const refresh=()=>{
      const lid=document.getElementById('qeLesson')?.value||'',kid=document.getElementById('qeKnowledge')?.value||'';let forms=lessonForms(lid);if(kid)forms=forms.filter(f=>f.knowledgeCode===kid);
      const currentForm=formForQuestion({lessonId:lid,knowledgeCode:kid,level:document.getElementById('qeLevel')?.value,form:input.value,formId:q?.formId||''});
      select.innerHTML='<option value="">Dạng tự nhập / chưa phân loại</option>'+forms.map(f=>`<option value="${attr(f.id)}">${escHtml(f.id)} • ${escHtml(f.title)}</option>`).join('');
      if(currentForm&&forms.some(f=>f.id===currentForm.id)){select.value=currentForm.id;if(!input.value)input.value=currentForm.title}
      renderEditorPath();
    };
    const renderEditorPath=()=>{const k=getKnowledge(document.getElementById('qeKnowledge')?.value||''),f=getForm(select.value);hint.innerHTML=`<b>V36 taxonomy:</b> ${escHtml(k?.code||'Chưa chọn chuẩn')} → ${escHtml(f?.id||'Dạng tự nhập')}${f?` • ${escHtml(f.title)}`:''}`};
    select.addEventListener('change',()=>{const f=getForm(select.value);if(f){input.value=f.title;const lev=document.getElementById('qeLevel');if(lev)lev.value=f.level||lev.value}renderEditorPath();document.getElementById('qeForm')?.dispatchEvent(new Event('input',{bubbles:true}))});
    ['qeLesson','qeKnowledge'].forEach(fid=>document.getElementById(fid)?.addEventListener('change',()=>setTimeout(refresh,0)));document.getElementById('qeLevel')?.addEventListener('change',renderEditorPath);
    refresh();
  }

  function installEditorHooks(){
    if(typeof window.openQuestionEditor==='function'&&!window.openQuestionEditor.__v360){const base=window.openQuestionEditor;const wrapped=function(id=''){const out=base(id);injectFormEditor(id);return out};wrapped.__v360=true;window.openQuestionEditor=wrapped}
    if(typeof window.saveQuestionEditor==='function'&&!window.saveQuestionEditor.__v360){const base=window.saveQuestionEditor;const wrapped=function(editId=''){
      const formId=document.getElementById('qeFormV36Editor')?.value||'',typedId=(document.getElementById('qeId')?.value||'').trim().replace(/[^A-Za-z0-9._-]/g,'-'),before=Number(state?._meta?.revision)||0;
      const f=getForm(formId);if(f&&document.getElementById('qeForm'))document.getElementById('qeForm').value=f.title;
      const out=base(editId);if((Number(state?._meta?.revision)||0)<=before)return out;
      const id=typedId||editId;let idx=id?(state.questionBank||[]).findIndex(q=>q.id===id):-1;if(idx<0&&!editId)idx=0;if(idx>=0){state.questionBank[idx]=normalizedQuestion(state.questionBank[idx],formId);state._meta=state._meta||{};state._meta.questionBankSchema=QUESTION_BANK_SCHEMA;state._meta.knowledgeMapVersion=MAP_VERSION;save({reason:'v36-question-metadata'});renderQuestionBank?.(true)}return out
    };wrapped.__v360=true;window.saveQuestionEditor=wrapped}
  }

  function installMutationHooks(){
    if(typeof window.commitBulkLatexImport==='function'&&!window.commitBulkLatexImport.__v360){const base=window.commitBulkLatexImport;const wrapped=function(){const before=new Map((state.questionBank||[]).map(q=>[q.id,JSON.stringify(q)])),rev=Number(state?._meta?.revision)||0;const out=base();if((Number(state?._meta?.revision)||0)>rev){let changed=0;state.questionBank=(state.questionBank||[]).map(q=>{const prior=before.get(q.id);if(prior===JSON.stringify(q)&&isComplete(q))return q;const n=normalizedQuestion(q);if(JSON.stringify(n)!==JSON.stringify(q))changed++;return n});if(changed)save({reason:'v36-latex-import-metadata'});renderQuestionBank?.(true)}return out};wrapped.__v360=true;window.commitBulkLatexImport=wrapped}
    if(typeof window.v29RestoreVersion==='function'&&!window.v29RestoreVersion.__v360){const base=window.v29RestoreVersion;const wrapped=function(id,index){const rev=Number(state?._meta?.revision)||0;const out=base(id,index);if((Number(state?._meta?.revision)||0)>rev){const i=(state.questionBank||[]).findIndex(q=>q.id===id);if(i>=0){state.questionBank[i]=normalizedQuestion(state.questionBank[i]);save({reason:'v36-version-restore-metadata'});renderQuestionBank?.(true)}}return out};wrapped.__v360=true;window.v29RestoreVersion=wrapped}
    if(typeof window.resetQuestionBank==='function'&&!window.resetQuestionBank.__v360){const base=window.resetQuestionBank;const wrapped=async function(){const rev=Number(state?._meta?.revision)||0;const out=await base();if((Number(state?._meta?.revision)||0)>rev){state.questionBank=(state.questionBank||[]).map(q=>normalizedQuestion(q));state._meta=state._meta||{};state._meta.questionBankSchema=QUESTION_BANK_SCHEMA;state._meta.knowledgeMapVersion=MAP_VERSION;save({reason:'v36-seed-bank-metadata'});renderQuestionBank?.(true)}return out};wrapped.__v360=true;window.resetQuestionBank=wrapped}
  }

  function installBankHooks(){
    if(typeof window.v29FilteredQuestions==='function'&&!window.v29FilteredQuestions.__v360){const base=window.v29FilteredQuestions;const wrapped=function(){let rows=base();const formId=document.getElementById('bankFormV36')?.value||'';if(formId)rows=rows.filter(q=>formForQuestion(q)?.id===formId);return rows};wrapped.__v360=true;window.v29FilteredQuestions=wrapped}
    if(typeof window.renderQuestionBank==='function'&&!window.renderQuestionBank.__v360){const base=window.renderQuestionBank;const wrapped=function(force=false){refreshFormFilter();const out=base(force);refreshFormFilter();decorateRows();renderMap();return out};wrapped.__v360=true;window.renderQuestionBank=wrapped}
    const f=document.getElementById('bankFormV36');if(f&&!f.dataset.v360Bound){f.dataset.v360Bound='1';f.addEventListener('change',()=>{try{v29BankPage=1}catch(_){};renderQuestionBank?.(false)})}
    ['bankChapter','bankLesson','bankKnowledge'].forEach(id=>{const e=document.getElementById(id);if(e&&!e.dataset.v360Bound){e.dataset.v360Bound='1';e.addEventListener('change',()=>setTimeout(()=>{refreshFormFilter();renderMap()},0))}})
  }
  function decorateRows(){
    const tbody=document.getElementById('questionBankTable');if(!tbody)return;[...tbody.querySelectorAll('tr')].forEach(tr=>{const id=tr.querySelector('td:first-child b')?.textContent?.trim();if(!id)return;const q=(state.questionBank||[]).find(x=>x.id===id),cell=tr.children[2];if(!q||!cell||cell.querySelector('.v360-form-line'))return;const f=formForQuestion(q),line=document.createElement('small');line.className='v29-meta-line v360-form-line';line.textContent=f?`${f.id} • ${f.title}`:(q.form||'Chưa phân loại dạng');cell.appendChild(line)})
  }

  function replaceCsvExport(){
    if(typeof window.exportQuestionBankCSVV29!=='function'||window.exportQuestionBankCSVV29.__v360)return;
    const wrapped=function(){if(!requireTeacher('Xuất CSV ngân hàng'))return;const rows=typeof v29FilteredQuestions==='function'?v29FilteredQuestions():(state.questionBank||[]),head=['id','chapterId','lessonId','knowledgeCode','knowledgeTitle','formId','formTitle','level','type','difficulty','reviewStatus','sourceName','sourceYear','tags','blueprintKey','question','answer','explanation','version','questionBankSchema'];let csv='\uFEFF'+head.map(v29CsvCell).join(',')+'\n'+rows.map(raw=>{const q=normalizedQuestion(raw);return head.map(k=>{let v=q[k];if(k==='tags')v=(q.tags||[]).join('; ');if(k==='answer'&&q.type==='tf4')v=(q.statements||[]).map(s=>s.answer?'Đ':'S').join('');if(k==='answer'&&q.type==='mcq')v=String.fromCharCode(65+(Number(q.answer)||0));return v29CsvCell(v)}).join(',')}).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`math12-question-bank-v36-${rows.length}-cau.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};wrapped.__v360=true;window.exportQuestionBankCSVV29=wrapped
  }

  function renderAll(){refreshFormFilter();renderMap();decorateRows()}
  function init(){
    document.documentElement.dataset.knowledgeMapBuild=BUILD;
    buildMap();installEditorHooks();installMutationHooks();installBankHooks();replaceCsvExport();renderAll();
    window.addEventListener('math12hub:state-saved',renderAll);
    setTimeout(renderAll,700);
  }

  window.v360KnowledgeMap={build:BUILD,curriculumId:CURRICULUM_ID,questionBankSchema:QUESTION_BANK_SCHEMA,map:buildMap,forms:allForms,getKnowledge,getForm,formForQuestion,metadataFor,normalizedQuestion,analyze:analyzeBank,render:renderAll,normalizeBank,exportMap};
  window.v360AllForms=allForms;
  window.v360ApplyKnowledgeFilter=applyKnowledgeFilter;
  window.v360FilterLesson=filterLesson;
  window.v360RefreshFormFilter=refreshFormFilter;
  window.v360ScrollKnowledgeMap=scrollMap;
  window.v360NormalizeBank=normalizeBank;
  window.v360ExportKnowledgeMap=exportMap;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
