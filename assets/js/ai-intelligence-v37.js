/* =========================================================
   Math12 Hub  — AI Teaching Intelligence
   - Turns  Knowledge Map + QC + Smart Exam + Mastery snapshots
     into teacher-facing, privacy-preserving instructional intelligence.
   - Local analysis works without an AI key.
   - Gemini receives aggregate/anonymized statistics only.
   - AI output is always a draft; teacher remains the final decision-maker.
   ========================================================= */
(()=>{
  'use strict';
  const BUILD='37-ai-teaching-intelligence';
  const SCHEMA=37;
  const PLAN_KEY='math12hub.ai.v37.teachingPlans';
  const MAX_PLANS=20;
  let currentClass=null,currentAnalysis=null,currentPlan=null,busy=false;

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
  const nowIso=()=>new Date().toISOString();
  const clone=x=>JSON.parse(JSON.stringify(x));
  const pct=v=>v==null?'—':`${Math.round(clamp(v)*100)}%`;
  const safeText=v=>String(v??'').trim();
  const metaRows=()=>typeof allKnowledgeCodes==='function'?allKnowledgeCodes():[];
  const metaByCode=()=>new Map(metaRows().map(x=>[x.code,x]));
  const escHtml=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const attr=v=>typeof attrEsc==='function'?attrEsc(String(v??'')):escHtml(v);

  function loadPlans(){try{const x=JSON.parse(localStorage.getItem(PLAN_KEY)||'[]');return Array.isArray(x)?x.slice(0,MAX_PLANS):[]}catch(_){return []}}
  function savePlans(rows){try{localStorage.setItem(PLAN_KEY,JSON.stringify((rows||[]).slice(0,MAX_PLANS)))}catch(err){console.warn(' plan storage',err)}}

  function masteryRows(c){
    const mm=metaByCode(),agg=new Map();
    for(const st of c?.students||[]){
      const codes=st.progress?.masteryV363?.codes||[];
      for(const k of codes){
        if(!k?.code||!mm.has(k.code))continue;
        const conf=clamp(k.confidence),score=clamp(k.score);
        if(conf<.20)continue;
        let x=agg.get(k.code)||{code:k.code,title:mm.get(k.code)?.title||k.code,lessonId:mm.get(k.code)?.lessonId||'',chapterId:mm.get(k.code)?.chapterId||0,weight:0,sum:0,students:0,confidence:0,needs:0};
        const w=Math.max(.20,conf);x.weight+=w;x.sum+=score*w;x.confidence+=conf;x.students++;if(score<.75)x.needs++;agg.set(k.code,x)
      }
    }
    let rows=[...agg.values()].map(x=>({...x,score:x.weight?x.sum/x.weight:null,confidence:x.students?x.confidence/x.students:0,needRatio:x.students?x.needs/x.students:0}));
    if(!rows.length){
      rows=(c?.weakSkills||[]).map(w=>{const m=mm.get(w.code)||{};return {code:w.code,title:w.title||m.title||w.code,lessonId:m.lessonId||'',chapterId:m.chapterId||0,score:Number.isFinite(Number(w.accuracy))?clamp(w.accuracy):.55,confidence:.35,students:Number(w.count)||1,needs:Number(w.count)||1,needRatio:1,fallback:true}})
    }
    const classN=Math.max(1,Number(c?.memberCount)||c?.students?.length||1);
    return rows.map(x=>({...x,coverage:x.students/classN,priority:(1-(x.score??.6))*.58+clamp(x.needRatio)*.24+clamp(x.coverage)*.18}))
      .sort((a,b)=>b.priority-a.priority||((a.score??1)-(b.score??1))||b.students-a.students)
  }

  function cohortRows(c){
    const defs=[['support','Cần hỗ trợ'],['developing','Đang củng cố'],['strong','Khá / tốt'],['overdue','Đang trễ bài'],['new','Chưa đủ dữ liệu']];
    return defs.map(([mode,label])=>{let rows=[];try{rows=typeof firebaseSmartTargetStudents==='function'?firebaseSmartTargetStudents(c,mode):[]}catch(_){}return {mode,label,count:rows.length,ratio:(c?.memberCount||0)?rows.length/c.memberCount:0}})
  }

  function buildAnalysis(c){
    const priorities=masteryRows(c).slice(0,8),cohorts=cohortRows(c),students=c?.students||[],masteryStudents=students.filter(s=>s.progress?.masteryV363?.coverage).length;
    const pending=(c?.assignments||[]).reduce((n,a)=>n+(Number(a.pendingGrade)||0),0),overdue=(c?.assignments||[]).filter(a=>a.overdue&&Math.max(0,(a.total||0)-(a.submitted||0))>0).length;
    const localActions=[];
    if(priorities[0])localActions.push({kind:'priority',text:`Ưu tiên ${priorities[0].code} • ${priorities[0].title}`,code:priorities[0].code,mode:'support'});
    const support=cohorts.find(x=>x.mode==='support');if(support?.count)localActions.push({kind:'group',text:`Thiết kế hoạt động củng cố cho ${support.count} học sinh cần hỗ trợ`,mode:'support'});
    if(pending)localActions.push({kind:'grading',text:`Xử lý ${pending} lượt nộp đang chờ chấm`});
    if(overdue)localActions.push({kind:'overdue',text:`Rà soát ${overdue} bài đã quá hạn còn thiếu lượt nộp`,mode:'overdue'});
    if(!localActions.length)localActions.push({kind:'maintain',text:'Duy trì nhịp học và tăng dần câu TH/VD cho nhóm đã sẵn sàng',mode:'strong'});
    return {build:BUILD,schemaVersion:SCHEMA,classId:c?.classId||'',className:c?.className||'Lớp học',memberCount:Number(c?.memberCount)||students.length,averageScore:c?.averageScore??null,completionRate:c?.completionRate??null,masteryStudents,masteryCoverage:(Number(c?.memberCount)||students.length)?masteryStudents/(Number(c?.memberCount)||students.length):0,priorities,cohorts,pendingGrade:pending,overdueAssignments:overdue,assignmentCount:Number(c?.assignmentCount)||c?.assignments?.length||0,localActions,generatedAt:nowIso()}
  }

  function anonymousDigest(a){
    return {
      schemaVersion:SCHEMA,
      studentCount:a.memberCount,
      verifiedAverageScore:a.averageScore==null?null:+Number(a.averageScore).toFixed(2),
      assignmentCompletionRate:a.completionRate==null?null:+Number(a.completionRate).toFixed(4),
      masterySnapshotCoverage:+Number(a.masteryCoverage||0).toFixed(4),
      pendingGradeCount:a.pendingGrade,
      overdueAssignmentCount:a.overdueAssignments,
      cohorts:a.cohorts.map(x=>({mode:x.mode,count:x.count,ratio:+Number(x.ratio||0).toFixed(4)})),
      priorityKnowledge:a.priorities.slice(0,6).map(x=>({code:x.code,title:x.title,lessonId:x.lessonId,averageMastery:+Number(x.score??0).toFixed(4),confidence:+Number(x.confidence||0).toFixed(4),studentsWithEvidence:x.students,needRatio:+Number(x.needRatio||0).toFixed(4)}))
    }
  }

  function privacyRegression(){
    const sample={classId:'PRIVATE-CLASS',className:'12A TEST',memberCount:2,averageScore:6.2,completionRate:.7,assignmentCount:1,assignments:[],weakSkills:[],students:[
      {uid:'UID-SECRET-1',name:'Nguyễn Văn Bí Mật',email:'secret1@example.com',progress:{masteryV363:{coverage:1,codes:[{code:'F1-01.K1',score:.35,confidence:.8}]}}},
      {uid:'UID-SECRET-2',name:'Trần Thị Riêng Tư',email:'secret2@example.com',progress:{masteryV363:{coverage:1,codes:[{code:'F1-01.K1',score:.55,confidence:.7}]}}}
    ]};
    const a=buildAnalysis(sample),d=anonymousDigest(a),raw=JSON.stringify(d);return {ok:!/(Bí Mật|Riêng Tư|secret1|secret2|UID-SECRET|12A TEST|PRIVATE-CLASS)/i.test(raw)&&d.studentCount===2&&d.priorityKnowledge?.[0]?.code==='F1-01.K1',priority:d.priorityKnowledge?.[0]?.code||'',bytes:new Blob([raw]).size}
  }

  function renderClassOptions(){
    const sel=document.getElementById('v37ClassSelect');if(!sel)return;
    const rows=(typeof firebaseOwnedClasses!=='undefined'?firebaseOwnedClasses:[])||[];let chosen=sel.value||currentClass?.classId||(typeof firebaseSelectedClassId!=='undefined'?firebaseSelectedClassId:'')||rows[0]?.id||'';
    sel.innerHTML=rows.length?rows.map(c=>`<option value="${attr(c.id)}">${escHtml(c.name||'Lớp học')}</option>`).join(''):'<option value="">Chưa có lớp được tải</option>';if(chosen&&rows.some(c=>c.id===chosen))sel.value=chosen
  }

  function renderPriority(a){
    const box=document.getElementById('v37PriorityList');if(!box)return;const rows=a?.priorities?.slice(0,6)||[];
    box.innerHTML=rows.length?rows.map((x,i)=>`<div class="v37-priority-row"><div class="v37-rank">${i+1}</div><div class="v37-priority-copy"><b>${escHtml(x.code)} • ${escHtml(x.title)}</b><small>Mastery lớp ${pct(x.score)} • ${x.students} HS có bằng chứng • ${Math.round((x.needRatio||0)*100)}% cần củng cố</small></div><div class="v37-priority-score">${pct(x.score)}</div><div class="v37-priority-actions"><button class="btn btn-soft" onclick="v37PrepareQuestions('${attr(x.code)}')">✦ Soạn câu AI</button><button class="btn btn-blue" onclick="v37PrepareAssignment('${attr(x.code)}','support')">Tạo bài</button></div></div>`).join(''):'<div class="online-empty">Chưa đủ dữ liệu Mastery để xếp ưu tiên. Có thể mở Theo dõi lớp để tải snapshot mới.</div>'
  }

  function renderCohorts(a){
    const box=document.getElementById('v37CohortGrid');if(!box)return;box.innerHTML=(a?.cohorts||[]).map(x=>`<button type="button" class="v37-cohort ${x.mode}" onclick="v37PreviewCohort('${attr(x.mode)}')"><b>${x.count}</b><span>${escHtml(x.label)}</span><small>${pct(x.ratio)} lớp</small></button>`).join('')
  }

  function renderLocalBrief(a){
    const box=document.getElementById('v37LocalBrief');if(!box)return;box.innerHTML=(a?.localActions||[]).map((x,i)=>`<div class="v37-local-action"><span>${i+1}</span><b>${escHtml(x.text)}</b></div>`).join('')
  }

  function renderMetrics(a){
    const vals={v37MetricStudents:a?.memberCount??'—',v37MetricAvg:a?.averageScore==null?'—':Number(a.averageScore).toFixed(2),v37MetricMastery:pct(a?.masteryCoverage),v37MetricPriority:a?.priorities?.[0]?.code||'—'};Object.entries(vals).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v});const note=document.getElementById('v37ClassStatus');if(note)note.textContent=a?`${a.className} • cập nhật ${new Date(a.generatedAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}`:'Chưa tải dữ liệu lớp.'
  }

  function renderAnalysis(a=currentAnalysis){renderMetrics(a);renderPriority(a);renderCohorts(a);renderLocalBrief(a);renderTeacherMini(currentClass)}

  async function refreshClass(force=false){
    if(typeof requireTeacher==='function'&&!requireTeacher('AI Teaching Intelligence '))return null;
    const status=document.getElementById('v37ClassStatus');if(status)status.textContent='Đang tải dữ liệu lớp…';
    try{
      if(typeof firebaseOwnedClasses!=='undefined'&&!firebaseOwnedClasses?.length&&typeof firebaseLoadMemberships==='function'&&typeof firebaseUser!=='undefined'&&firebaseUser)await firebaseLoadMemberships();
      renderClassOptions();const sel=document.getElementById('v37ClassSelect'),classId=sel?.value||(typeof firebaseSelectedClassId!=='undefined'?firebaseSelectedClassId:'')||(typeof firebaseOwnedClasses!=='undefined'?firebaseOwnedClasses?.[0]?.id:'');if(!classId)throw new Error('Chưa có lớp online để phân tích. Hãy tạo hoặc tải lớp trước.');
      if(typeof firebaseLoadClassIntelligence!=='function')throw new Error('Module phân tích lớp chưa sẵn sàng.');
      const c=await firebaseLoadClassIntelligence(classId,force);if(!c)throw new Error('Không tải được dữ liệu lớp.');currentClass=c;currentAnalysis=buildAnalysis(c);renderAnalysis(currentAnalysis);return currentAnalysis
    }catch(err){if(status)status.textContent=err?.message||String(err);const box=document.getElementById('v37PriorityList');if(box)box.innerHTML=`<div class="firebase-banner warn">${escHtml(err?.message||err)}</div>`;return null}
  }

  function previewCohort(mode){
    if(!currentClass)return refreshClass(false).then(()=>currentClass&&previewCohort(mode));if(typeof firebasePreviewSmartTarget==='function')return firebasePreviewSmartTarget(currentClass.classId,mode,true)
  }

  function prepareAssignment(code,mode='support'){
    if(!currentClass)return refreshClass(false).then(()=>currentClass&&prepareAssignment(code,mode));
    if(typeof v22PrepareSuggestedAssignment==='function')return v22PrepareSuggestedAssignment(currentClass.classId,code,mode);
    alert('Luồng tạo bài củng cố chưa sẵn sàng.')
  }

  function prepareQuestions(code){
    const m=metaByCode().get(code)||{},source=document.getElementById('v32AiSourceText'),lesson=document.getElementById('v32AiTargetLesson'),type=document.getElementById('v32AiTypePolicy'),count=document.getElementById('v32AiCount');
    if(!source){alert('Trợ lý AI  chưa tải xong. Hãy thử lại sau vài giây.');return}
    source.value=`Hãy tạo một bộ câu hỏi nháp để giáo viên củng cố chuẩn ${code} — ${m.title||'kiến thức đã chọn'} (${m.lessonId||''}).\nYêu cầu: bám Chương trình GDPT 2018; ưu tiên 2 câu NB, 2 câu TH và 1 câu VD nếu phù hợp; nghiệm/số liệu đẹp; không tạo hai đáp án đúng; lời giải rõ; nếu là Đúng/Sai thì 4 ý có liên hệ logic. Chỉ tạo bản nháp để giáo viên duyệt.`;
    if(lesson&&m.lessonId)lesson.value=m.lessonId;if(type)type.value='mixed';if(count)count.value='5';source.focus();source.scrollIntoView({behavior:'smooth',block:'center'});if(typeof examToast==='function')examToast(`Đã chuẩn bị yêu cầu AI cho ${code}. Hãy xem lại rồi bấm “Tạo bản nháp AI”.`)
  }

  function planSchema(){
    return {
      type:'object',
      properties:{
        summary:{type:'string'},
        priorities:{
          type:'array',maxItems:6,
          items:{
            type:'object',
            properties:{
              code:{type:'string'},objective:{type:'string'},reason:{type:'string'},
              recommendedLevel:{type:'string',enum:['NB','TH','VD']},
              minutes:{type:'integer',minimum:5,maximum:90}
            },
            required:['code','objective','reason','recommendedLevel','minutes']
          }
        },
        groups:{
          type:'array',maxItems:5,
          items:{
            type:'object',
            properties:{
              mode:{type:'string',enum:['support','developing','strong','overdue','new','all']},
              goal:{type:'string'},activity:{type:'string'},questionCount:{type:'integer',minimum:0,maximum:30}
            },
            required:['mode','goal','activity','questionCount']
          }
        },
        lessonPlan:{
          type:'array',maxItems:8,
          items:{
            type:'object',
            properties:{
              phase:{type:'string'},minutes:{type:'integer',minimum:1,maximum:90},
              teacherAction:{type:'string'},studentAction:{type:'string'},evidence:{type:'string'}
            },
            required:['phase','minutes','teacherAction','studentAction','evidence']
          }
        },
        homework:{
          type:'object',
          properties:{focus:{type:'string'},questionCount:{type:'integer',minimum:0,maximum:40},differentiation:{type:'string'}},
          required:['focus','questionCount','differentiation']
        },
        teacherChecks:{type:'array',maxItems:8,items:{type:'string'}},
        cautions:{type:'array',maxItems:8,items:{type:'string'}}
      },
      required:['summary','priorities','groups','lessonPlan','homework','teacherChecks','cautions']
    }
  }

  function teachingSystem(){return `Bạn là trợ lý lập kế hoạch dạy học môn Toán 12 Việt Nam theo Chương trình GDPT 2018. Dữ liệu đầu vào chỉ là thống kê tổng hợp đã ẩn danh.\nQuy tắc bắt buộc:\n- Không suy đoán danh tính, hoàn cảnh cá nhân hay thuộc tính nhạy cảm của học sinh.\n- Chỉ dùng các mã kiến thức xuất hiện trong dữ liệu đầu vào; không bịa mã mới.\n- Không tự xuất bản, tự giao bài hoặc tự thay đổi điểm/đáp án. Mọi đề xuất là bản nháp để giáo viên duyệt.\n- Ưu tiên can thiệp có thể thực hiện trong lớp: mục tiêu rõ, thời lượng hợp lý, bằng chứng kiểm tra được.\n- Phân hóa theo nhóm dựa trên mức làm chủ và tình trạng hoàn thành, không gắn nhãn cố định cho học sinh.\n- Viết tiếng Việt ngắn gọn, chuyên môn, có thể áp dụng ngay.`}

  function normalizePlan(p,a){
    const allowed=new Set((a?.priorities||[]).map(x=>x.code));p=clone(p||{});p.priorities=Array.isArray(p.priorities)?p.priorities.filter(x=>allowed.has(x.code)).slice(0,6):[];p.groups=Array.isArray(p.groups)?p.groups.slice(0,5):[];p.lessonPlan=Array.isArray(p.lessonPlan)?p.lessonPlan.slice(0,8):[];p.teacherChecks=Array.isArray(p.teacherChecks)?p.teacherChecks.slice(0,8):[];p.cautions=Array.isArray(p.cautions)?p.cautions.slice(0,8):[];return p
  }

  function planRecord(plan,a,model=''){return {id:`V37-${Date.now().toString(36)}`,createdAt:nowIso(),classId:a.classId,className:a.className,model,build:BUILD,digest:anonymousDigest(a),plan:clone(plan)}}

  async function generatePlan(){
    if(busy)return;if(!currentAnalysis){const a=await refreshClass(false);if(!a)return}
    if(typeof v32GeminiGenerate!=='function'){alert('AI adapter chưa sẵn sàng. Hãy mở lại trang Trợ lý AI hoặc kiểm tra kết nối.');return}
    const btn=document.getElementById('v37GenerateBtn'),status=document.getElementById('v37PlanStatus');busy=true;if(btn)btn.disabled=true;if(status)status.textContent='Đang tạo bản nháp kế hoạch từ dữ liệu tổng hợp ẩn danh…';
    try{
      const digest=anonymousDigest(currentAnalysis),prompt=`Hãy lập một kế hoạch can thiệp/ngắn hạn cho lớp từ dữ liệu tổng hợp sau. Không có dữ liệu định danh học sinh. Chỉ dùng knowledgeCode có trong priorityKnowledge.\n\n${JSON.stringify(digest,null,2)}`;
      const r=await v32GeminiGenerate([{text:prompt}],planSchema(),{timeoutMs:90000,systemInstruction:teachingSystem()});const plan=normalizePlan(r.json,currentAnalysis);currentPlan=planRecord(plan,currentAnalysis,r.model);const rows=loadPlans();rows.unshift(currentPlan);savePlans(rows);renderPlan(currentPlan);if(status)status.textContent=`✓ Bản nháp từ ${r.model} • chỉ dùng thống kê ẩn danh.`;if(typeof examToast==='function')examToast(' đã tạo bản nháp kế hoạch. Giáo viên cần xem và quyết định trước khi áp dụng.')
    }catch(err){if(status)status.textContent=`✗ ${err?.message||err}`;if(typeof v35CaptureIssue==='function')v35CaptureIssue('v37-ai-plan',err)}finally{busy=false;if(btn)btn.disabled=false}
  }

  function renderPlan(rec=currentPlan){
    const box=document.getElementById('v37PlanOutput');if(!box)return;if(!rec?.plan){box.innerHTML='<div class="online-empty">Chưa có kế hoạch AI. Phân tích lớp chạy cục bộ ngay cả khi chưa cấu hình Gemini.</div>';return}const p=rec.plan;
    box.innerHTML=`<div class="v37-plan-head"><div><span>AI DRAFT • ${escHtml(rec.model||'Gemini')}</span><h4>${escHtml(p.summary||'Kế hoạch dạy học')}</h4><small>${new Date(rec.createdAt).toLocaleString('vi-VN')} • giáo viên duyệt trước khi áp dụng</small></div><div class="online-actions"><button class="btn btn-soft" onclick="v37CopyPlan()">Sao chép</button><button class="btn btn-soft" onclick="v37ExportPlan()">JSON</button></div></div>
      <div class="v37-plan-grid"><div><h5>Ưu tiên kiến thức</h5>${(p.priorities||[]).map(x=>`<div class="v37-plan-item"><b>${escHtml(x.code)} • ${escHtml(x.objective)}</b><small>${escHtml(x.reason)} • ${escHtml(x.recommendedLevel)} • ~${Number(x.minutes)||0} phút</small><button class="link-btn" onclick="v37PrepareAssignment('${attr(x.code)}','support')">Chuẩn bị bài củng cố →</button></div>`).join('')||'<div class="online-empty">AI chưa đưa ưu tiên hợp lệ.</div>'}</div>
      <div><h5>Phân hóa nhóm</h5>${(p.groups||[]).map(x=>`<div class="v37-plan-item"><b>${escHtml(x.mode)} • ${escHtml(x.goal)}</b><small>${escHtml(x.activity)}${x.questionCount?`${x.questionCount} câu`:''}</small></div>`).join('')||'<div class="online-empty">Chưa có đề xuất nhóm.</div>'}</div></div>
      <div class="v37-lesson-plan"><h5>Tiến trình gợi ý</h5>${(p.lessonPlan||[]).map((x,i)=>`<div class="v37-phase"><span>${i+1}</span><div><b>${escHtml(x.phase)} • ${Number(x.minutes)||0}'</b><small><strong>GV:</strong> ${escHtml(x.teacherAction)}<br><strong>HS:</strong> ${escHtml(x.studentAction)}<br><strong>Minh chứng:</strong> ${escHtml(x.evidence)}</small></div></div>`).join('')}</div>
      <div class="v37-plan-footer"><div><b>Bài về nhà</b><span>${escHtml(p.homework?.focus||'—')} • ${Number(p.homework?.questionCount)||0} câu</span><small>${escHtml(p.homework?.differentiation||'')}</small></div><div><b>Giáo viên cần kiểm tra</b><span>${escHtml((p.teacherChecks||[]).join('')||'Xem lại toàn bộ kế hoạch trước khi dùng.')}</span></div></div>${p.cautions?.length?`<div class="firebase-banner warn mt"><b>Lưu ý AI:</b> ${escHtml(p.cautions.join(''))}</div>`:''}`
  }

  function exportPlan(){if(!currentPlan)return alert('Chưa có kế hoạch để xuất.');if(typeof triggerJsonDownload==='function')return triggerJsonDownload(currentPlan,`math12hub-v37-teaching-plan-${new Date().toISOString().slice(0,10)}.json`);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(currentPlan,null,2)],{type:'application/json'}));a.download='math12hub-v37-teaching-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function planText(rec=currentPlan){if(!rec?.plan)return '';const p=rec.plan;return [`KẾ HOẠCH DẠY HỌC `,p.summary||'',``,...((p.priorities||[]).map(x=>`- ${x.code}: ${x.objective} (${x.recommendedLevel}, ${x.minutes} phút)`)),``,`TIẾN TRÌNH`,...((p.lessonPlan||[]).map((x,i)=>`${i+1}. ${x.phase} (${x.minutes} phút)\nGV: ${x.teacherAction}\nHS: ${x.studentAction}\nMinh chứng: ${x.evidence}`)),``,`BÀI VỀ NHÀ: ${p.homework?.focus||''} • ${p.homework?.questionCount||0} câu`,`KIỂM TRA: ${(p.teacherChecks||[]).join('')}`].join('\n')}
  async function copyPlan(){if(!currentPlan)return alert('Chưa có kế hoạch để sao chép.');try{await navigator.clipboard.writeText(planText());if(typeof examToast==='function')examToast('Đã sao chép kế hoạch .')}catch(_){alert(planText())}}

  function openHistory(){const rows=loadPlans();openModal('Lịch sử kế hoạch AI',`${rows.length} bản nháp lưu cục bộ trên thiết bị`,rows.length?`<div class="v37-history">${rows.map((r,i)=>`<button type="button" onclick="v37OpenHistoryPlan(${i})"><div><b>${escHtml(r.className||'Lớp học')}</b><small>${new Date(r.createdAt).toLocaleString('vi-VN')} • ${escHtml(r.model||'Gemini')}</small></div><span>${escHtml(r.plan?.priorities?.[0]?.code||'—')}</span></button>`).join('')}</div>`:'<div class="online-empty">Chưa có kế hoạch AI đã lưu.</div>',`<button class="btn btn-danger" onclick="v37ClearHistory()">Xóa lịch sử</button><button class="btn btn-soft" onclick="closeModal()">Đóng</button>`)}
  function openHistoryPlan(i){const r=loadPlans()[Number(i)];if(!r)return;currentPlan=r;closeModal();renderPlan(r);document.getElementById('v37PlanOutput')?.scrollIntoView({behavior:'smooth',block:'start'})}
  function clearHistory(){if(!confirm('Xóa toàn bộ lịch sử kế hoạch AI  trên thiết bị này?'))return;savePlans([]);currentPlan=null;closeModal();renderPlan();if(typeof examToast==='function')examToast('Đã xóa lịch sử kế hoạch AI .')}

  function renderTeacherMini(c){
    const box=document.getElementById('v37TeacherMini');if(!box)return;if(!c){box.innerHTML='<div class="teacher-live-empty">Mở hoặc làm mới Dashboard lớp để  tạo teaching brief.</div>';return}const a=buildAnalysis(c),top=a.priorities.slice(0,3);box.innerHTML=`<div class="v37-mini-head"><div><b>AI Teaching Intelligence </b><small>${a.masteryStudents}/${a.memberCount} HS có Mastery snapshot • ${a.cohorts.find(x=>x.mode==='support')?.count||0} HS cần hỗ trợ</small></div><button class="btn btn-soft" onclick="v37OpenForClass('${attr(c.classId)}')">Mở AI →</button></div><div class="v37-mini-codes">${top.length?top.map(x=>`<button onclick="v37OpenForClass('${attr(c.classId)}','${attr(x.code)}')"><b>${escHtml(x.code)}</b><span>${pct(x.score)}</span><small>${escHtml(x.title)}</small></button>`).join(''):'<span>Chưa đủ dữ liệu ưu tiên.</span>'}</div>`
  }

  function injectTeacherCard(){if(document.getElementById('v37TeacherMini'))return;const anchor=document.querySelector('#page-teacher .v363-teacher-card')||document.querySelector('#page-teacher .v31-competency-card');if(!anchor)return;const card=document.createElement('div');card.className='card mt v37-teacher-mini-card';card.id='v37TeacherMini';card.innerHTML='<div class="teacher-live-empty">Mở Dashboard lớp để  tạo teaching brief.</div>';anchor.insertAdjacentElement('afterend',card)}
  function openForClass(classId='',code=''){if(typeof firebaseSelectedClassId!=='undefined'&&classId)firebaseSelectedClassId=classId;goPage('ai-teacher');setTimeout(async()=>{renderClassOptions();const sel=document.getElementById('v37ClassSelect');if(sel&&classId)sel.value=classId;await refreshClass(false);if(code)document.querySelector(`#v37PriorityList .v37-priority-row b`)?.scrollIntoView({behavior:'smooth',block:'center'})},550)}

  function renderPage(){renderClassOptions();if(currentAnalysis)renderAnalysis(currentAnalysis);renderPlan(currentPlan);const privacy=document.getElementById('v37PrivacyStatus');if(privacy){const rr=privacyRegression();privacy.textContent=rr.ok?'✓ Privacy Guard đạt • payload AI không chứa tên/email/UID':'⚠ Privacy Guard cần kiểm tra'}}

  function installHooks(){
    if(typeof window.goPage==='function'&&!window.goPage.__v37){const base=window.goPage,wrapped=function(page,...rest){const r=base(page,...rest);if(page==='ai-teacher')setTimeout(renderPage,650);return r};wrapped.__v37=true;window.goPage=wrapped}
    if(typeof window.renderTeacherDashboardCache==='function'&&!window.renderTeacherDashboardCache.__v37){const base=window.renderTeacherDashboardCache,wrapped=function(c){const r=base(c);injectTeacherCard();renderTeacherMini(c);return r};wrapped.__v37=true;window.renderTeacherDashboardCache=wrapped}
    if(typeof window.resetTeacherDashboardUI==='function'&&!window.resetTeacherDashboardUI.__v37){const base=window.resetTeacherDashboardUI,wrapped=function(...args){const r=base(...args);injectTeacherCard();renderTeacherMini(null);return r};wrapped.__v37=true;window.resetTeacherDashboardUI=wrapped}
  }

  function init(){document.documentElement.dataset.aiTeachingBuild=BUILD;injectTeacherCard();installHooks();setTimeout(()=>{renderPage();if(typeof firebaseTeacherDashboardCache!=='undefined'&&firebaseTeacherDashboardCache)renderTeacherMini(firebaseTeacherDashboardCache)},350)}

  window.v37TeachingIntelligence={build:BUILD,schema:SCHEMA,buildAnalysis,anonymousDigest,privacyRegression,refreshClass,generatePlan,renderPage};
  window.v37RefreshClassIntelligence=refreshClass;window.v37GenerateTeachingPlan=generatePlan;window.v37PrepareAssignment=prepareAssignment;window.v37PrepareQuestions=prepareQuestions;window.v37PreviewCohort=previewCohort;window.v37ExportPlan=exportPlan;window.v37CopyPlan=copyPlan;window.v37OpenPlanHistory=openHistory;window.v37OpenHistoryPlan=openHistoryPlan;window.v37ClearHistory=clearHistory;window.v37OpenForClass=openForClass;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
