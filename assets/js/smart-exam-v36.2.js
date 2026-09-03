/* =========================================================
   Math12 Hub  — Smart Exam Matrix & Multiple Test Codes
   - Filters the exam-builder pool by Question Quality Engine 
   - Balances knowledge codes/forms while preserving Chapter × Level × Type quotas
   - Reduces repeated questions from recently saved exams when possible
   - Generates deterministic numeric codes 101–108 on top of  variant engine
   - Preserves TF4 as atomic questions and preserves grouped/shared-stimulus blocks
   - Runs locally on the question bank already loaded in the session; no new Firestore reads
   ========================================================= */
(function(){
  'use strict';
  const BUILD='36.2-smart-exam';
  const SCHEMA=362;
  const CODE_BASE=101;
  const DEFAULTS={qc:'safe',review:'all',metadata:false,diversity:'knowledge-form',avoidRecent:true,recentExamCount:3};
  const escHtml=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clone=x=>typeof firebaseSafeClone==='function'?firebaseSafeClone(x):JSON.parse(JSON.stringify(x));
  const int=(v,min=0,max=999)=>Math.max(min,Math.min(max,parseInt(v,10)||0));
  const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\\(?:left|right|mathrm|text|operatorname|displaystyle|dfrac|tfrac)/g,' ').replace(/[^a-z0-9\\+\-*/^=<>.]+/g,' ').replace(/\s+/g,' ').trim();
  const hash=s=>typeof v30Hash==='function'?v30Hash(String(s)):String(s).split('').reduce((h,c)=>((h*33)^c.charCodeAt(0))>>>0,5381);
  let lastPlan=null;
  const localAuditCache=new WeakMap();
  let baseBankPool=null;
  let baseGenerate=null;
  let baseRenderPreview=null;
  let baseRenderSaved=null;
  let baseExamConfig=null;
  let baseApplyVariant=null;
  let baseV30VariantCode=null;

  function controls(){
    return {
      qc:document.getElementById('ebV362QcPolicy')?.value||DEFAULTS.qc,
      review:document.getElementById('ebV362ReviewPolicy')?.value||DEFAULTS.review,
      metadata:!!document.getElementById('ebV362RequireMetadata')?.checked,
      diversity:document.getElementById('ebV362Diversity')?.value||DEFAULTS.diversity,
      avoidRecent:document.getElementById('ebV362AvoidRecent')?.checked!==false,
      recentExamCount:int(document.getElementById('ebV362RecentCount')?.value||DEFAULTS.recentExamCount,1,10)
    };
  }
  function audit(q){
    const fallback={score:100,counts:{critical:0,warning:0},status:'good'};
    try{
      if(!q||typeof q!=='object')return fallback;
      const sig=`${q.id||''}|${q.version||''}|${q.updatedAt||''}|${q.reviewStatus||''}|${q.questionBankSchema||''}|${hash(`${q.question||''}|${(q.options||[]).join('~')}|${q.answer??''}|${(q.statements||[]).map(s=>`${s?.text||''}:${s?.answer}`).join('~')}|${q.explanation||''}`)}`;
      const hit=localAuditCache.get(q);if(hit?.sig===sig)return hit.value;
      const value=window.v361QualityEngine?.auditQuestion?.(q)||fallback;localAuditCache.set(q,{sig,value});return value;
    }catch(_){return fallback}
  }
  function metadataReady(q){return Number(q?.questionBankSchema)===36&&Number(q?.knowledgeMapVersion)===36&&q?.metadataStatusV36==='complete'&&!!String(q?.knowledgeCode||'').trim()&&!!String(q?.formId||'').trim()}
  function isEligible(q,p=controls()){
    if(!q||!q.question||!['NB','TH','VD','VDC'].includes(q.level)||!['mcq','tf','tf4','short'].includes(q.type))return false;
    if(p.metadata&&!metadataReady(q))return false;
    if(p.review==='reviewed'&&q.reviewStatus!=='reviewed')return false;
    const a=audit(q);
    if(p.qc==='clean'&&(a.counts?.critical||a.counts?.warning))return false;
    if(p.qc==='safe'&&(a.counts?.critical||0)>0)return false;
    return true;
  }
  function eligiblePool(){
    const p=controls();
    const src=baseBankPool?baseBankPool():(state?.questionBank||[]);
    return src.filter(q=>isEligible(q,p));
  }
  function recentQuestionIds(p=controls()){
    if(!p.avoidRecent)return new Set();
    const exams=(state?.customExams||[]).slice(0,p.recentExamCount),s=new Set();
    exams.forEach(e=>(e.questions||[]).forEach(q=>q?.id&&s.add(q.id)));return s;
  }
  function fingerprint(q){return normalize(q?.question||'').replace(/\s+/g,' ').slice(0,500)}
  function slotKey(q){const lv=q?.level==='VDC'?'VD':(q?.level||'');return `${Number(q?.chapterId)||0}|${lv}|${q?.type||''}`}
  function seededNoise(seed,key){return (hash(`${seed}|${key}`)%100000)/100000}
  function candidateScore(q,ctx){
    const a=audit(q),k=q.knowledgeCode||'?',f=q.formId||q.form||'?',recent=ctx.recent.has(q.id),kc=ctx.knowledge.get(k)||0,fc=ctx.forms.get(f)||0;
    let score=(Number(a.score)||0)/25;
    if(q.reviewStatus==='reviewed')score+=.8;
    if(ctx.policy.diversity==='knowledge-form'){score+=Math.max(0,5-kc*2.0)+Math.max(0,3-fc*1.3)}
    else if(ctx.policy.diversity==='knowledge'){score+=Math.max(0,6-kc*2.2)}
    if(recent)score-=ctx.policy.avoidRecent?9:0;
    score+=seededNoise(ctx.seed,q.id||fingerprint(q));return score;
  }
  function refineQuestions(original=[],seed=Date.now()){
    const policy=controls(),pool=eligiblePool(),recent=recentQuestionIds(policy),used=new Set(),fps=new Set(),knowledge=new Map(),forms=new Map(),out=[];
    let repeated=0,duplicatesAvoided=0;
    const ctx={policy,recent,used,fps,knowledge,forms,seed};
    for(let i=0;i<original.length;i++){
      const slot=original[i],matches=pool.filter(q=>slotKey(q)===slotKey(slot)&&!used.has(q.id));
      let candidates=matches.filter(q=>!fps.has(fingerprint(q)));
      if(candidates.length<matches.length)duplicatesAvoided+=matches.length-candidates.length;
      if(policy.avoidRecent){const fresh=candidates.filter(q=>!recent.has(q.id));if(fresh.length)candidates=fresh}
      candidates.sort((a,b)=>candidateScore(b,ctx)-candidateScore(a,ctx));
      let pick=candidates[0]||matches[0]||slot;
      if(recent.has(pick.id))repeated++;
      const x=clone(pick);if(slot.section)x.section=slot.section;if(slot.part)x.part=slot.part;
      x.v362={qcScore:audit(pick).score,knowledgeCode:pick.knowledgeCode||'',formId:pick.formId||'',selectedAt:new Date().toISOString()};
      out.push(x);used.add(pick.id);fps.add(fingerprint(pick));
      knowledge.set(pick.knowledgeCode||'?',(knowledge.get(pick.knowledgeCode||'?')||0)+1);forms.set(pick.formId||pick.form||'?',(forms.get(pick.formId||pick.form||'?')||0)+1);
    }
    return {questions:out,stats:{eligible:pool.length,repeated,duplicatesAvoided,knowledgeCount:[...knowledge.keys()].filter(x=>x!=='?').length,formCount:[...forms.keys()].filter(x=>x!=='?').length,avgQc:out.length?Math.round(out.reduce((s,q)=>s+(audit(q).score||0),0)/out.length):0},policy};
  }
  function examCode(index=0){return String(CODE_BASE+int(index,0,7))}
  function groupKey(q,i){return String(q?.groupId||q?.stimulusId||q?.parentId||q?.sharedContextId||`__single_${q?.id||i}`)}
  function shuffleBlocks(rows,seed){
    const blocks=[],map=new Map();rows.forEach((q,i)=>{const k=groupKey(q,i);if(!map.has(k)){const b={key:k,items:[]};map.set(k,b);blocks.push(b)}map.get(k).items.push(q)});
    const shuffled=typeof examShuffle==='function'?examShuffle(blocks,seed):blocks.slice().sort((a,b)=>seededNoise(seed,a.key)-seededNoise(seed,b.key));return shuffled.flatMap(b=>b.items);
  }
  function smartApplyVariant(questions=[],policy={},variantIndex=0,context='exam'){
    const p=typeof v30NormalizePolicy==='function'?v30NormalizePolicy(policy):policy,seed=hash(`${context}|variant:${variantIndex}|v362`);
    let qs=(questions||[]).map((q,i)=>{
      const allowOptions=p.shuffleOptions&&q?.type==='mcq'&&q?.lockOptions!==true&&q?.shuffleOptions!==false;
      return allowOptions&&typeof v30ShuffleQuestionOptions==='function'?v30ShuffleQuestionOptions(q,hash(`${seed}|${q.id||i}|options`)):clone(q)
    });
    if(p.shuffleQuestions){
      const hasSections=p.preserveSections&&qs.some(q=>q.section);
      if(hasSections){const ordered=['I','II','III'],seen=new Set(ordered),groups=[];ordered.forEach(s=>{const g=qs.filter(q=>q.section===s);if(g.length)groups.push(shuffleBlocks(g,hash(`${seed}|section:${s}`)))});const rest=qs.filter(q=>!seen.has(q.section));if(rest.length)groups.push(shuffleBlocks(rest,hash(`${seed}|section:rest`)));qs=groups.flat()}
      else qs=shuffleBlocks(qs,seed);
    }
    return qs.map((q,i)=>({...q,v30DisplayNo:i+1,v362ExamCode:examCode(variantIndex)}));
  }
  function matrixPreflight(){
    const p=controls(),pool=eligiblePool(),cells=typeof readExamBuilderMatrix==='function'?readExamBuilderMatrix():[],short=[];
    cells.forEach(c=>{const n=pool.filter(q=>Number(q.chapterId)===Number(c.chapterId)&&(q.level===c.level||(c.level==='VD'&&q.level==='VDC'))).length;if(n<c.quota)short.push({...c,available:n})});
    const all=(baseBankPool?baseBankPool():(state?.questionBank||[])),clean=all.filter(q=>{const a=audit(q);return !(a.counts?.critical||a.counts?.warning)}).length,safe=all.filter(q=>(audit(q).counts?.critical||0)===0).length,recent=recentQuestionIds(p);
    const metadata=pool.filter(metadataReady).length,knowledge=new Set(pool.map(q=>q.knowledgeCode).filter(Boolean)).size,forms=new Set(pool.map(q=>q.formId).filter(Boolean)).size;
    return {policy:p,totalBank:all.length,eligible:pool.length,safe,clean,metadata,knowledge,forms,recent:recent.size,short,cells};
  }
  function renderPreflight(){
    const r=matrixPreflight(),box=document.getElementById('v362Preflight');if(!box)return;
    const cls=r.short.length?'warn':'ok';box.className=`v362-preflight ${cls}`;
    box.innerHTML=`<div class="v362-preflight-metrics"><span><b>${r.eligible}</b> câu đủ điều kiện</span><span><b>${r.safe}</b> không lỗi QC</span><span><b>${r.knowledge}</b> chuẩn kiến thức</span><span><b>${r.forms}</b> dạng toán</span></div><div class="v362-preflight-note">${r.short.length?`⚠ Có ${r.short.length} ô ma trận thiếu câu sau khi áp dụng bộ lọc .`:`✓ Ma trận hiện không thiếu câu theo bộ lọc .`} ${r.policy.avoidRecent?`Hệ thống ưu tiên tránh ${r.recent} câu đã dùng gần đây.`:'Không hạn chế câu đã dùng gần đây.'}</div>`;
  }
  function blueprint(){
    const r=matrixPreflight(),v=typeof ebValidation==='function'?ebValidation():{total:0,types:{},exact:false},title=document.getElementById('ebTitle')?.value||'Đề kiểm tra';
    return {format:'math12hub-exam-blueprint',version:'36.2',build:BUILD,createdAt:new Date().toISOString(),title,durationMinutes:int(document.getElementById('ebDuration')?.value||45,5,180),matrix:r.cells,exactTypes:!!v.exact,typeQuota:v.exact?{...v.types}:null,policy:r.policy,availability:{eligible:r.eligible,safe:r.safe,clean:r.clean,knowledge:r.knowledge,forms:r.forms,short:r.short},variantPolicy:{count:int(document.getElementById('ebV30VariantCount')?.value||1,1,8),codes:Array.from({length:int(document.getElementById('ebV30VariantCount')?.value||1,1,8)},(_,i)=>examCode(i)),shuffleQuestions:!!document.getElementById('ebV30ShuffleQuestions')?.checked,shuffleOptions:!!document.getElementById('ebV30ShuffleOptions')?.checked,preserveSections:!!document.getElementById('ebV30PreserveSections')?.checked}};
  }
  function openBlueprint(){
    if(typeof requireTeacher==='function'&&!requireTeacher('Xem ma trận thông minh '))return;const b=blueprint(),rows=b.matrix.map(c=>`<tr><td>Chương ${c.chapterId}</td><td>${typeof levelName==='function'?levelName(c.level):c.level}</td><td>${c.quota}</td><td>${eligiblePool().filter(q=>Number(q.chapterId)===Number(c.chapterId)&&(q.level===c.level||(c.level==='VD'&&q.level==='VDC'))).length}</td></tr>`).join('');
    const body=`<div class="v362-modal-hero"><span>SMART BLUEPRINT</span><h3>${escHtml(b.title)}</h3><p>${b.durationMinutes} phút • ${b.matrix.reduce((s,x)=>s+x.quota,0)} câu • mã ${b.variantPolicy.codes.join(', ')}</p></div><div class="grid grid-4 mt"><div class="card"><small>QC đủ điều kiện</small><h2>${b.availability.eligible}</h2></div><div class="card"><small>Chuẩn phủ được</small><h2>${b.availability.knowledge}</h2></div><div class="card"><small>Dạng toán</small><h2>${b.availability.forms}</h2></div><div class="card"><small>Ô thiếu</small><h2>${b.availability.short.length}</h2></div></div><div class="table-wrap mt"><table class="table"><thead><tr><th>Phạm vi</th><th>Mức độ</th><th>Cần</th><th>Đủ điều kiện</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Chưa thiết lập ma trận.</td></tr>'}</tbody></table></div><div class="math-help mt"><b>Quy tắc chọn :</b> giữ đúng Chương × Mức độ × Loại câu; ưu tiên phủ nhiều mã kiến thức/dạng toán; tránh câu vừa dùng nếu ngân hàng đủ; loại câu có lỗi QC theo chính sách đã chọn. Câu Đúng/Sai 4 ý được coi là một đơn vị nguyên vẹn.</div>`;
    if(typeof openModal==='function')openModal('Ma trận thông minh',`${b.availability.eligible} câu đủ điều kiện`,body,`<button class="btn btn-soft" onclick="v362ExportBlueprint()">⬇ Xuất blueprint</button><button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)
  }
  function download(obj,name){if(typeof triggerJsonDownload==='function')return triggerJsonDownload(obj,name);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function exportBlueprint(){download(blueprint(),`math12-blueprint-v36.2-${new Date().toISOString().slice(0,10)}.json`)}
  function exportVariantPack(exam=examBuilderDraft){
    if(!exam)return alert('Chưa có đề để xuất bộ mã.');const p=typeof v30PolicyFromExam==='function'?v30PolicyFromExam(exam):(exam.v30Policy||{}),n=int(p.variantCount||exam.variantCount||1,1,8),variants=[];
    for(let i=0;i<n;i++){const qs=smartApplyVariant(exam.questions||[],p,i,`export:${exam.id||exam.title}`);variants.push({examCode:examCode(i),variantIndex:i,questions:qs})}
    const payload={format:'math12hub-multiple-test-codes',version:'36.2',build:BUILD,createdAt:new Date().toISOString(),sourceExam:{id:exam.id,title:exam.title,durationMinutes:exam.durationMinutes,scoring:exam.scoring||'normalized',questionCount:exam.questions?.length||0},policy:{...p,codes:variants.map(v=>v.examCode)},blueprint:exam.v362?.blueprint||blueprint(),variants,answerKeys:variants.map(v=>({examCode:v.examCode,answers:v.questions.map(q=>q.type==='tf4'?(q.statements||[]).map(s=>!!s.answer):q.answer)}))};
    download(payload,`math12-bo-ma-de-${variants.map(v=>v.examCode).join('-')}.json`)
  }
  function saveBlueprintPreset(){
    const b=blueprint();if(!b.matrix.length)return alert('Ma trận đang trống.');let name=prompt('Tên mẫu ma trận:',b.title||'Ma trận Toán 12');if(!name)return;let arr=[];try{arr=JSON.parse(localStorage.getItem('math12hub-v362-blueprints')||'[]')}catch(_){};arr=[{...b,id:`BP-${Date.now().toString(36)}`,name:name.trim()},...arr].slice(0,10);localStorage.setItem('math12hub-v362-blueprints',JSON.stringify(arr));renderBlueprintPresets();window.v353Toast?.('Đã lưu mẫu ma trận  trên máy.')
  }
  function loadBlueprintPreset(id){let arr=[];try{arr=JSON.parse(localStorage.getItem('math12hub-v362-blueprints')||'[]')}catch(_){};const b=arr.find(x=>x.id===id);if(!b)return;document.getElementById('ebTitle').value=b.title||b.name||'Đề kiểm tra';document.getElementById('ebDuration').value=b.durationMinutes||45;typeof clearExamBuilderMatrix==='function'&&clearExamBuilderMatrix();(b.matrix||[]).forEach(c=>{const e=document.getElementById(`eb-${c.chapterId}-${c.level}`);if(e)e.value=c.quota||0});const p=b.policy||{};if(document.getElementById('ebV362QcPolicy'))document.getElementById('ebV362QcPolicy').value=p.qc||DEFAULTS.qc;if(document.getElementById('ebV362ReviewPolicy'))document.getElementById('ebV362ReviewPolicy').value=p.review||DEFAULTS.review;if(document.getElementById('ebV362RequireMetadata'))document.getElementById('ebV362RequireMetadata').checked=!!p.metadata;if(document.getElementById('ebV362Diversity'))document.getElementById('ebV362Diversity').value=p.diversity||DEFAULTS.diversity;if(document.getElementById('ebV362AvoidRecent'))document.getElementById('ebV362AvoidRecent').checked=p.avoidRecent!==false;if(document.getElementById('ebV362RecentCount'))document.getElementById('ebV362RecentCount').value=p.recentExamCount||DEFAULTS.recentExamCount;const vp=b.variantPolicy||{};if(document.getElementById('ebV30VariantCount'))document.getElementById('ebV30VariantCount').value=vp.count||1;if(document.getElementById('ebV30ShuffleQuestions'))document.getElementById('ebV30ShuffleQuestions').checked=vp.shuffleQuestions!==false;if(document.getElementById('ebV30ShuffleOptions'))document.getElementById('ebV30ShuffleOptions').checked=vp.shuffleOptions!==false;typeof updateExamBuilderSummary==='function'&&updateExamBuilderSummary();renderPreflight();window.v353Toast?.(`Đã nạp mẫu “${b.name}”.`)}
  function deleteBlueprintPreset(id){let arr=[];try{arr=JSON.parse(localStorage.getItem('math12hub-v362-blueprints')||'[]')}catch(_){};arr=arr.filter(x=>x.id!==id);localStorage.setItem('math12hub-v362-blueprints',JSON.stringify(arr));renderBlueprintPresets()}
  function renderBlueprintPresets(){const box=document.getElementById('v362BlueprintPresets');if(!box)return;let arr=[];try{arr=JSON.parse(localStorage.getItem('math12hub-v362-blueprints')||'[]')}catch(_){};box.innerHTML=arr.length?arr.map(b=>`<span class="v362-preset"><button type="button" onclick="v362LoadBlueprintPreset('${escHtml(b.id)}')">${escHtml(b.name)}</button><button class="x" type="button" title="Xóa mẫu" onclick="v362DeleteBlueprintPreset('${escHtml(b.id)}')">×</button></span>`).join(''):'<span class="v362-preset-empty">Chưa có mẫu ma trận đã lưu.</span>'}
  function updateCodeLabels(){
    const select=document.getElementById('ebV30VariantCount');if(select)[...select.options].forEach(o=>{const n=int(o.value,1,8);o.textContent=n===1?'1 mã • 101':`${n} mã • 101–${CODE_BASE+n-1}`});
    document.querySelectorAll('.v30-code-actions button').forEach((b,i)=>b.textContent=`Thi mã ${examCode(i)}`);
    document.querySelectorAll('.saved-exam-actions .btn-blue').forEach(b=>{if(/mã\s*A/i.test(b.textContent))b.textContent='Thi mã 101'});
  }
  function decoratePreview(){
    const box=document.getElementById('examBuilderPreview');if(!box||!examBuilderDraft)return;updateCodeLabels();const p=typeof v30PolicyFromExam==='function'?v30PolicyFromExam(examBuilderDraft):(examBuilderDraft.v30Policy||{}),n=int(p.variantCount||1,1,8),strip=box.querySelector('.v30-policy-strip');if(strip){const lead=strip.querySelector('b');if(lead)lead.textContent=`${n} mã ${examCode(0)}–${examCode(n-1)}`}
    if(!box.querySelector('.v362-smart-strip')){const s=examBuilderDraft.v362?.stats||{};const div=document.createElement('div');div.className='v362-smart-strip';div.innerHTML=`<div><b>Smart Matrix </b><span>QC TB ${s.avgQc||'—'}% • ${s.knowledgeCount||0} chuẩn • ${s.formCount||0} dạng • lặp gần đây ${s.repeated||0}</span></div><button class="btn btn-soft" onclick="v362ExportVariantPack()">⬇ Bộ mã ${examCode(0)}–${examCode(n-1)}</button>`;(strip||box.querySelector('.exam-preview-head'))?.insertAdjacentElement('afterend',div)}
  }
  function decorateSaved(){
    updateCodeLabels();const box=document.getElementById('examBuilderSaved');if(!box)return;const arr=state?.customExams||[];[...box.querySelectorAll('.saved-exam')].forEach((row,i)=>{const e=arr[i];if(!e||row.querySelector('.v362-saved-chip'))return;const p=typeof v30PolicyFromExam==='function'?v30PolicyFromExam(e):(e.v30Policy||{}),n=int(p.variantCount||1,1,8),meta=row.querySelector('.v30-saved-meta');if(meta)meta.insertAdjacentHTML('beforeend',`<span class="v362-saved-chip">mã ${examCode(0)}–${examCode(n-1)}</span>`);const actions=row.querySelector('.saved-exam-actions');if(actions){const btn=document.createElement('button');btn.className='btn btn-soft';btn.textContent='Bộ mã';btn.onclick=()=>exportVariantPack(e);actions.insertBefore(btn,actions.querySelector('.btn-danger'))}})
  }
  function injectCard(){
    const page=document.getElementById('page-exam-builder');if(!page||document.getElementById('v362SmartExamCard'))return;const cards=page.querySelectorAll('.exam-builder-stack > .card');const anchor=[...cards].find(c=>c.querySelector('#examBuilderStatus'));if(!anchor)return;
    const card=document.createElement('div');card.className='card v362-smart-card';card.id='v362SmartExamCard';card.innerHTML=`<div class="section-head" style="margin:0 0 10px"><div><span class="v360-kicker">SMART EXAM MATRIX</span><h3>4. Chọn câu thông minh trước khi sinh đề</h3><p>Lọc theo QC , cân phủ chuẩn/dạng toán và hạn chế lặp câu từ các đề vừa dùng. Chạy hoàn toàn trên dữ liệu đã tải trong phiên.</p></div><span class="pill tag-green"></span></div><div class="v362-policy-grid"><div><label>Chất lượng câu</label><select id="ebV362QcPolicy"><option value="safe" selected>Không có lỗi nghiêm trọng</option><option value="clean">Sạch lỗi + cảnh báo</option><option value="all">Không lọc QC (tương thích cũ)</option></select></div><div><label>Trạng thái duyệt</label><select id="ebV362ReviewPolicy"><option value="all" selected>Cho phép câu hợp lệ</option><option value="reviewed">Chỉ câu đã duyệt</option></select></div><div><label>Cân bằng nội dung</label><select id="ebV362Diversity"><option value="knowledge-form" selected>Chuẩn kiến thức + dạng toán</option><option value="knowledge">Ưu tiên chuẩn kiến thức</option><option value="off">Không cân bằng</option></select></div><div><label>Đề gần đây cần tránh</label><select id="ebV362RecentCount"><option value="1">1 đề gần nhất</option><option value="3" selected>3 đề gần nhất</option><option value="5">5 đề gần nhất</option><option value="10">10 đề gần nhất</option></select></div><label class="v30-check"><input id="ebV362RequireMetadata" type="checkbox"> Bắt buộc metadata  đầy đủ</label><label class="v30-check"><input id="ebV362AvoidRecent" type="checkbox" checked> Hạn chế lặp câu đã dùng gần đây</label></div><div id="v362Preflight" class="v362-preflight mt"></div><div class="v362-blueprint-actions mt"><button class="btn btn-blue" type="button" onclick="v362OpenBlueprint()">▦ Kiểm tra blueprint</button><button class="btn btn-soft" type="button" onclick="v362SaveBlueprintPreset()">☆ Lưu mẫu ma trận</button><button class="btn btn-soft" type="button" onclick="v362ExportBlueprint()">⬇ Xuất blueprint</button></div><div id="v362BlueprintPresets" class="v362-presets mt"></div><div class="math-help mt"><b>Mã đề :</b> các biến thể hiển thị 101, 102, 103…; cùng một bộ câu gốc, chỉ đảo thứ tự câu và phương án MCQ theo seed xác định. Câu TF4 không bị đảo các ý; các câu có cùng <code>groupId/stimulusId/parentId</code> được giữ cạnh nhau.</div>`;
    anchor.insertAdjacentElement('afterend',card);
    page.querySelector('.v30-engine-card h3')&&(page.querySelector('.v30-engine-card h3').textContent='5. Multiple Test Codes');
    page.querySelector('.v30-engine-card .section-head p')&&(page.querySelector('.v30-engine-card .section-head p').textContent='Sinh mã 101–108 từ một đề gốc bằng seed xác định; giữ nhóm câu phụ thuộc, chỉ đảo phương án MCQ khi được phép và không nhân bản dữ liệu câu hỏi.');
    ['ebV362QcPolicy','ebV362ReviewPolicy','ebV362Diversity','ebV362RecentCount','ebV362RequireMetadata','ebV362AvoidRecent'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{typeof updateExamBuilderSummary==='function'&&updateExamBuilderSummary();renderPreflight()}));
    renderBlueprintPresets();renderPreflight();updateCodeLabels();
  }
  function installHooks(){
    baseBankPool=window.ebBankPool;
    if(typeof baseBankPool==='function'){window.ebBankPool=function(){return eligiblePool()}}
    baseApplyVariant=window.v30ApplyVariant;if(typeof baseApplyVariant==='function')window.v30ApplyVariant=smartApplyVariant;
    baseV30VariantCode=window.v30VariantCode;if(typeof baseV30VariantCode==='function')window.v30VariantCode=function(i=0){return examCode(i)};
    baseGenerate=window.generateExamBuilderDraft;if(typeof baseGenerate==='function')window.generateExamBuilderDraft=function(){const before=Date.now();const out=baseGenerate();if(examBuilderDraft){const refined=refineQuestions(examBuilderDraft.questions||[],before);examBuilderDraft.questions=refined.questions;examBuilderDraft.schemaVersion=SCHEMA;examBuilderDraft.v362={build:BUILD,policy:refined.policy,stats:refined.stats,blueprint:blueprint(),codes:Array.from({length:int(examBuilderDraft.v30Policy?.variantCount||1,1,8)},(_,i)=>examCode(i))};lastPlan=examBuilderDraft.v362;renderExamBuilderPreview?.();window.v353Toast?.(`: ${examBuilderDraft.questions.length} câu • QC TB ${refined.stats.avgQc}% • ${refined.stats.knowledgeCount} chuẩn • ${refined.stats.formCount} dạng.`)}renderPreflight();return out};
    baseRenderPreview=window.renderExamBuilderPreview;if(typeof baseRenderPreview==='function')window.renderExamBuilderPreview=function(){const r=baseRenderPreview();decoratePreview();return r};
    baseRenderSaved=window.renderSavedCustomExams;if(typeof baseRenderSaved==='function')window.renderSavedCustomExams=function(){const r=baseRenderSaved();decorateSaved();return r};
    baseExamConfig=window.examBuilderConfig;if(typeof baseExamConfig==='function')window.examBuilderConfig=function(exam,variantIndex=0){const cfg=baseExamConfig(exam,variantIndex),code=examCode(variantIndex);cfg.internalVariantCode=cfg.variantCode;cfg.variantCode=code;cfg.examCode=code;cfg.subtitle=String(cfg.subtitle||'').replace(/Mã\s+[A-H0-9]+(?:\/\d+)?/i,`Mã ${code}`);cfg.rules=`Mã ${code}. `+(cfg.rules||'');return cfg};
    if(typeof window.updateExamBuilderSummary==='function'&&!window.updateExamBuilderSummary.__v362){const base=window.updateExamBuilderSummary;const wrapped=function(){const r=base();renderPreflight();return r};wrapped.__v362=true;window.updateExamBuilderSummary=wrapped}
    if(typeof window.renderExamBuilder==='function'&&!window.renderExamBuilder.__v362){const base=window.renderExamBuilder;const wrapped=function(reset=false){const r=base(reset);setTimeout(()=>{renderPreflight();updateCodeLabels();renderBlueprintPresets()},0);return r};wrapped.__v362=true;window.renderExamBuilder=wrapped}
  }
  function regression(){
    const sample=[
      {id:'G1',type:'mcq',options:['A','B','C','D'],answer:0,question:'Q1',section:'I',groupId:'G'},
      {id:'G2',type:'mcq',options:['A','B','C','D'],answer:1,question:'Q2',section:'I',groupId:'G'},
      {id:'S1',type:'short',answer:'1',question:'Q3',section:'III'}
    ],p={variantCount:4,shuffleQuestions:true,shuffleOptions:true,preserveSections:true},v=smartApplyVariant(sample,p,2,'regression'),idx1=v.findIndex(q=>q.id==='G1'),idx2=v.findIndex(q=>q.id==='G2');return {ok:examCode(0)==='101'&&examCode(3)==='104'&&Math.abs(idx1-idx2)===1&&v.every(q=>q.v362ExamCode==='103'),codes:[examCode(0),examCode(1),examCode(2),examCode(3)],groupAdjacent:Math.abs(idx1-idx2)===1}}
  function init(){
    document.documentElement.dataset.smartExamBuild=BUILD;installHooks();injectCard();setTimeout(()=>{renderPreflight();decoratePreview();decorateSaved();updateCodeLabels()},500);
    window.addEventListener('math12hub:state-saved',()=>{renderPreflight();decorateSaved()});
  }
  window.v362SmartExam={build:BUILD,schema:SCHEMA,controls,audit,isEligible,eligiblePool,refineQuestions,matrixPreflight,blueprint,examCode,applyVariant:smartApplyVariant,regression,exportVariantPack};
  window.v362OpenBlueprint=openBlueprint;window.v362ExportBlueprint=exportBlueprint;window.v362ExportVariantPack=()=>exportVariantPack(examBuilderDraft);window.v362SaveBlueprintPreset=saveBlueprintPreset;window.v362LoadBlueprintPreset=loadBlueprintPreset;window.v362DeleteBlueprintPreset=deleteBlueprintPreset;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
