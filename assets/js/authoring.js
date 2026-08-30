/* ========================= V21 • EXAM BUILDER ========================= */
let examBuilderDraft=null;
const EB_LEVELS=['NB','TH','VD'];
const EB_TYPES=['mcq','tf','tf4','short'];
function ebInt(id){return Math.max(0,parseInt(document.getElementById(id)?.value||'0',10)||0)}
function ebCellId(ch,lv){return `eb-${ch}-${lv}`}
function ebBankPool(){return (state.questionBank||[]).filter(q=>q&&q.chapterId&&EB_LEVELS.includes(q.level)&&EB_TYPES.includes(q.type)&&q.question)}
function ebAvail(ch,lv,type=''){return ebBankPool().filter(q=>Number(q.chapterId)===Number(ch)&&q.level===lv&&(!type||q.type===type)).length}
function ebTypeName(t){return ({mcq:'Nhiều lựa chọn',tf:'Đ/S 1 ý',tf4:'Đ/S 4 ý',short:'Trả lời ngắn'})[t]||t}
function ebClone(q){return JSON.parse(JSON.stringify(q))}
function ebShuffle(a,seed=Date.now()){let x=[...a],s=(Number(seed)||1)>>>0;for(let i=x.length-1;i>0;i--){s=(1664525*s+1013904223)>>>0;let j=s%(i+1);[x[i],x[j]]=[x[j],x[i]]}return x}
function renderExamBuilder(reset=false){if(!requireTeacher('Tạo đề kiểm tra'))return;
  const body=document.getElementById('examBuilderMatrix');if(!body)return;
  const old={};if(!reset)body.querySelectorAll('input[data-cell]').forEach(i=>old[i.dataset.cell]=i.value);
  body.innerHTML=chapters.map(c=>{let counts=EB_LEVELS.map(lv=>ebAvail(c.id,lv));return `<tr><td><b>Chương ${c.id}. ${esc(c.title)}</b><span class="exam-avail">${c.lessons.length} bài • ${counts.reduce((a,b)=>a+b,0)} câu có sẵn</span></td>${EB_LEVELS.map((lv,j)=>{let key=`${c.id}-${lv}`,v=old[key]??0;return `<td><input data-cell="${key}" id="${ebCellId(c.id,lv)}" type="number" min="0" max="${counts[j]}" value="${v}" oninput="updateExamBuilderSummary()"><span class="exam-avail">/ ${counts[j]} có sẵn</span></td>`}).join('')}<td id="ebRow-${c.id}" class="exam-matrix-total">0</td></tr>`}).join('');
  if(reset)examBuilderPreset('quick',true);else updateExamBuilderSummary();renderSavedCustomExams();renderExamBuilderPreview();
}
function readExamBuilderMatrix(){let cells=[];chapters.forEach(c=>EB_LEVELS.forEach(lv=>{let quota=ebInt(ebCellId(c.id,lv));if(quota>0)cells.push({chapterId:c.id,level:lv,quota,key:`${c.id}-${lv}`})}));return cells}
function clearExamBuilderMatrix(){chapters.forEach(c=>EB_LEVELS.forEach(lv=>{let x=document.getElementById(ebCellId(c.id,lv));if(x)x.value=0}));examBuilderDraft=null;renderExamBuilderPreview();updateExamBuilderSummary()}
function ebAllocateLevels(targets){
  const assigned={};chapters.forEach(c=>EB_LEVELS.forEach(lv=>assigned[`${c.id}-${lv}`]=0));
  EB_LEVELS.forEach(lv=>{let left=Math.max(0,targets[lv]||0),guard=0;while(left>0&&guard++<2000){let opts=chapters.map(c=>({c,room:ebAvail(c.id,lv)-assigned[`${c.id}-${lv}`],used:assigned[`${c.id}-${lv}`]})).filter(x=>x.room>0).sort((a,b)=>a.used-b.used||b.room-a.room||a.c.id-b.c.id);if(!opts.length)break;let pick=opts[0];assigned[`${pick.c.id}-${lv}`]++;left--}});
  chapters.forEach(c=>EB_LEVELS.forEach(lv=>{let x=document.getElementById(ebCellId(c.id,lv));if(x)x.value=assigned[`${c.id}-${lv}`]}));
}
function examBuilderPreset(kind,silent=false){
  if(!document.getElementById('examBuilderMatrix'))renderExamBuilder(false);
  const cfg={quick:{title:'Đề luyện nhanh • Toán 12',duration:30,levels:{NB:6,TH:6,VD:3},exact:false},periodic:{title:'Đề kiểm tra 45 phút • Toán 12',duration:45,levels:{NB:8,TH:8,VD:4},exact:false},final:{title:'Đề kiểm tra tổng hợp 90 phút • Toán 12',duration:90,levels:{NB:7,TH:9,VD:6},exact:false},thpt:{title:'Đề mô phỏng cấu trúc THPT • Toán 12',duration:90,levels:{NB:6,TH:9,VD:7},exact:true,types:{mcq:12,tf:0,tf4:4,short:6}}}[kind]||null;if(!cfg)return;
  document.getElementById('ebTitle').value=cfg.title;document.getElementById('ebDuration').value=cfg.duration;ebAllocateLevels(cfg.levels);
  document.getElementById('ebExactTypes').checked=!!cfg.exact;toggleExamBuilderTypes(false);if(cfg.types)EB_TYPES.forEach(t=>{let el=document.getElementById('ebType'+(t==='mcq'?'Mcq':t==='tf'?'Tf':t==='tf4'?'Tf4':'Short'));if(el)el.value=cfg.types[t]||0});else autoExamBuilderTypes(false);
  examBuilderDraft=null;renderExamBuilderPreview();updateExamBuilderSummary();if(!silent)examToast?.(`Đã áp dụng mẫu ${cfg.title}.`)
}
function toggleExamBuilderTypes(update=true){let on=!!document.getElementById('ebExactTypes')?.checked,g=document.getElementById('examBuilderTypes');g?.classList.toggle('disabled',!on);['ebTypeMcq','ebTypeTf','ebTypeTf4','ebTypeShort'].forEach(id=>{let e=document.getElementById(id);if(e)e.disabled=!on});if(update)updateExamBuilderSummary()}
function ebTotalMatrix(){return readExamBuilderMatrix().reduce((s,c)=>s+c.quota,0)}
function autoExamBuilderTypes(update=true){if(!requireTeacher('Tạo đề kiểm tra'))return;
  const total=ebTotalMatrix(),counts={mcq:0,tf:0,tf4:0,short:0};let remain=total;
  // Phân bổ theo tỷ trọng câu hiện có nhưng ưu tiên đa dạng dạng thức.
  const pool=ebBankPool(),avail=Object.fromEntries(EB_TYPES.map(t=>[t,pool.filter(q=>q.type===t).length]));
  if(total){let weights={mcq:.55,tf:.10,tf4:.15,short:.20};EB_TYPES.forEach((t,i)=>{if(i===EB_TYPES.length-1)return;let want=Math.min(avail[t],Math.round(total*weights[t]));counts[t]=want;remain-=want});let order=EB_TYPES.slice().sort((a,b)=>(avail[b]-counts[b])-(avail[a]-counts[a]));for(const t of order){let add=Math.min(remain,Math.max(0,avail[t]-counts[t]));counts[t]+=add;remain-=add;if(remain<=0)break}}
  [['mcq','Mcq'],['tf','Tf'],['tf4','Tf4'],['short','Short']].forEach(([t,s])=>{let e=document.getElementById('ebType'+s);if(e)e.value=counts[t]||0});if(update)updateExamBuilderSummary()
}
function readExamBuilderTypes(){return {mcq:ebInt('ebTypeMcq'),tf:ebInt('ebTypeTf'),tf4:ebInt('ebTypeTf4'),short:ebInt('ebTypeShort')}}
function ebValidation(){
  const cells=readExamBuilderMatrix(),total=cells.reduce((s,c)=>s+c.quota,0),errors=[],warnings=[];if(!total)errors.push('Ma trận chưa có câu hỏi.');
  cells.forEach(c=>{let a=ebAvail(c.chapterId,c.level);if(c.quota>a)errors.push(`Chương ${c.chapterId} • ${levelName(c.level)}: cần ${c.quota} nhưng chỉ có ${a} câu.`)});
  let exact=!!document.getElementById('ebExactTypes')?.checked,types=readExamBuilderTypes();if(exact){let tt=Object.values(types).reduce((a,b)=>a+b,0);if(tt!==total)errors.push(`Tổng cơ cấu loại câu là ${tt}, phải bằng tổng ma trận ${total}.`);EB_TYPES.forEach(t=>{let av=ebBankPool().filter(q=>q.type===t).length;if(types[t]>av)errors.push(`${ebTypeName(t)}: cần ${types[t]} nhưng toàn ngân hàng chỉ có ${av} câu.`)})}
  if(total>40)warnings.push('Đề có hơn 40 câu; nên cân nhắc thời gian làm bài.');
  return {cells,total,exact,types,errors,warnings};
}
function updateExamBuilderSummary(){
  const v=ebValidation(),bank=ebBankPool().length;document.getElementById('ebSummaryTotal')&&(document.getElementById('ebSummaryTotal').textContent=v.total);document.getElementById('ebSummaryBank')&&(document.getElementById('ebSummaryBank').textContent=bank);document.getElementById('ebSummarySaved')&&(document.getElementById('ebSummarySaved').textContent=(state.customExams||[]).length);document.getElementById('ebMatrixTotal')&&(document.getElementById('ebMatrixTotal').textContent=v.total);
  EB_LEVELS.forEach(lv=>{let n=v.cells.filter(c=>c.level===lv).reduce((s,c)=>s+c.quota,0),id=lv==='NB'?'ebNBTotal':lv==='TH'?'ebTHTotal':'ebVDTotal';let e=document.getElementById(id);if(e)e.textContent=n});chapters.forEach(c=>{let n=v.cells.filter(x=>x.chapterId===c.id).reduce((s,x)=>s+x.quota,0),e=document.getElementById(`ebRow-${c.id}`);if(e)e.textContent=n});
  chapters.forEach(c=>EB_LEVELS.forEach(lv=>{let e=document.getElementById(ebCellId(c.id,lv));if(!e)return;let q=Math.max(0,parseInt(e.value||0)||0),a=ebAvail(c.id,lv);e.classList.toggle('over',q>a);e.nextElementSibling?.classList.toggle('exam-cell-short',q>a)}));
  let status=document.getElementById('examBuilderStatus');if(status){status.className='exam-builder-status mt '+(v.errors.length?'error':v.warnings.length?'warn':v.total?'ok':'');status.innerHTML=v.errors.length?`<b>Chưa thể sinh đề:</b> ${v.errors.map(esc).join(' • ')}`:v.total?`<b>Ma trận hợp lệ:</b> ${v.total} câu${v.exact?' • khóa đúng cơ cấu loại câu':''}${v.warnings.length?' • '+v.warnings.map(esc).join(' • '):''}`:'Chọn một mẫu hoặc nhập số câu vào ma trận.'}
}
function ebMaxFlowSelect(cells,typeQuota,seed){
  const activeTypes=EB_TYPES.filter(t=>(typeQuota[t]||0)>0),m=cells.length,k=activeTypes.length,S=0,cellBase=1,typeBase=cellBase+m,T=typeBase+k,N=T+1,g=Array.from({length:N},()=>[]),refs={};
  const add=(u,v,cap,key='')=>{let a={to:v,rev:g[v].length,cap,orig:cap,key},b={to:u,rev:g[u].length,cap:0,orig:0};g[u].push(a);g[v].push(b);return a};
  cells.forEach((c,i)=>add(S,cellBase+i,c.quota));activeTypes.forEach((t,j)=>add(typeBase+j,T,typeQuota[t]||0));
  cells.forEach((c,i)=>activeTypes.forEach((t,j)=>{let cap=ebAvail(c.chapterId,c.level,t),key=`${i}|${t}`;refs[key]=add(cellBase+i,typeBase+j,cap,key)}));
  let flow=0;while(true){let prev=Array(N).fill(null),q=[S];prev[S]={u:-1,e:-1};for(let h=0;h<q.length&&!prev[T];h++){let u=q[h];for(let ei=0;ei<g[u].length;ei++){let e=g[u][ei];if(e.cap>0&&!prev[e.to]){prev[e.to]={u,e:ei};q.push(e.to);if(e.to===T)break}}}if(!prev[T])break;let f=1e9;for(let v=T;v!==S;){let p=prev[v],e=g[p.u][p.e];f=Math.min(f,e.cap);v=p.u}for(let v=T;v!==S;){let p=prev[v],e=g[p.u][p.e];e.cap-=f;g[v][e.rev].cap+=f;v=p.u}flow+=f}
  const total=cells.reduce((s,c)=>s+c.quota,0);if(flow!==total)return {ok:false,flow,total};let out=[];cells.forEach((c,i)=>activeTypes.forEach(t=>{let e=refs[`${i}|${t}`],used=e?e.orig-e.cap:0;if(!used)return;let pool=ebShuffle(ebBankPool().filter(q=>Number(q.chapterId)===Number(c.chapterId)&&q.level===c.level&&q.type===t),seed+i*97+t.length*19);out.push(...pool.slice(0,used).map(ebClone))}));return {ok:true,questions:out};
}
function ebSortTHPT(qs){const rank={mcq:1,tf4:2,short:3,tf:4};return [...qs].sort((a,b)=>(rank[a.type]||9)-(rank[b.type]||9)).map(q=>{let x=ebClone(q);if(x.type==='mcq'){x.section='I';x.part='Phần I • Nhiều lựa chọn'}else if(x.type==='tf4'){x.section='II';x.part='Phần II • Đúng/Sai'}else if(x.type==='short'){x.section='III';x.part='Phần III • Trả lời ngắn'}return x})}
function generateExamBuilderDraft(){if(!requireTeacher('Tạo đề kiểm tra'))return;
  const v=ebValidation();if(v.errors.length){updateExamBuilderSummary();alert(v.errors.join('\n'));return}let qs=[],seed=Date.now();
  if(v.exact){let r=ebMaxFlowSelect(v.cells,v.types,seed);if(!r.ok){alert(`Không thể ghép đồng thời ma trận và cơ cấu loại câu. Ngân hàng chỉ đáp ứng ${r.flow}/${r.total} câu với ràng buộc hiện tại. Hãy giảm một số ô hoặc đổi cơ cấu loại câu.`);return}qs=r.questions}else{v.cells.forEach((c,i)=>{let pool=ebShuffle(ebBankPool().filter(q=>Number(q.chapterId)===Number(c.chapterId)&&q.level===c.level),seed+i*131);qs.push(...pool.slice(0,c.quota).map(ebClone))})}
  let thpt=v.exact&&v.types.mcq===12&&v.types.tf===0&&v.types.tf4===4&&v.types.short===6&&v.total===22;if(thpt)qs=ebSortTHPT(qs);else qs=ebShuffle(qs,seed+777).map(q=>({...q,part:'Đề tự tạo'}));
  examBuilderDraft={id:`draft-${Date.now().toString(36)}`,title:(document.getElementById('ebTitle')?.value||'Đề kiểm tra tự tạo').trim()||'Đề kiểm tra tự tạo',durationMinutes:Math.max(5,ebInt('ebDuration')||45),questions:qs,scoring:thpt?'thpt':'normalized',matrix:v.cells.map(ebClone),typeQuota:v.exact?{...v.types}:null,createdAt:new Date().toISOString(),thpt};renderExamBuilderPreview();examToast?.(`Đã sinh ${qs.length} câu từ ma trận.`)
}
function examBuilderConfig(exam){let q=(exam.questions||[]).map(ebClone);return {id:`custom-${exam.id}`,mode:'custom',title:exam.title,subtitle:`${q.length} câu • ${exam.durationMinutes} phút • sinh từ ma trận`,durationMinutes:exam.durationMinutes,questions:q,scoring:exam.scoring||'normalized',attemptType:`custom-${exam.id}`,rules:exam.scoring==='thpt'?'Cấu trúc 12 câu nhiều lựa chọn, 4 câu Đúng/Sai 4 ý, 6 câu trả lời ngắn. Chấm theo thang THPT.':'Đề được tạo từ ma trận giáo viên thiết lập. Mỗi câu được quy đổi đều trên thang 10; câu Đúng/Sai 4 ý nhận điểm theo tỷ lệ số ý đúng.'}}
function startExamBuilderDraft(){if(!examBuilderDraft){alert('Chưa có đề xem trước.');return}openExamStart(examBuilderConfig(examBuilderDraft))}
function saveExamBuilderDraft(){if(!requireTeacher('Lưu đề kiểm tra'))return;if(!examBuilderDraft){alert('Hãy sinh đề trước khi lưu.');return}let saved=ebClone(examBuilderDraft);saved.id=`EX-${Date.now().toString(36).toUpperCase()}`;state.customExams=state.customExams||[];state.customExams.unshift(saved);if(state.customExams.length>30)state.customExams=state.customExams.slice(0,30);save();renderSavedCustomExams();updateExamBuilderSummary();examToast?.('Đã lưu đề vào trình duyệt.')}
function regenerateExamBuilderDraft(){generateExamBuilderDraft()}
function renderExamBuilderPreview(){let box=document.getElementById('examBuilderPreview');if(!box)return;if(!examBuilderDraft){box.innerHTML='<div class="exam-preview-empty"><b>Chưa có đề xem trước</b><br><span style="font-size:12px">Thiết lập ma trận rồi bấm “Sinh đề từ ma trận”.</span></div>';return}let e=examBuilderDraft,levels=Object.fromEntries(EB_LEVELS.map(l=>[l,e.questions.filter(q=>q.level===l).length])),types=Object.fromEntries(EB_TYPES.map(t=>[t,e.questions.filter(q=>q.type===t).length]));box.innerHTML=`<div class="exam-preview-head"><div><h3>${esc(e.title)}</h3><div class="exam-preview-chips"><span class="pill">${e.questions.length} câu</span><span class="pill">${e.durationMinutes} phút</span><span class="pill">NB ${levels.NB} • TH ${levels.TH} • VD ${levels.VD}</span>${e.thpt?'<span class="pill tag-green">Thang THPT</span>':''}</div></div></div><div class="exam-builder-status ok">Loại câu: ${EB_TYPES.filter(t=>types[t]).map(t=>`${ebTypeName(t)} ${types[t]}`).join(' • ')}</div><div class="exam-builder-actions mt"><button class="btn btn-blue" onclick="startExamBuilderDraft()">▶ Thi thử ngay</button><button class="btn btn-soft" onclick="regenerateExamBuilderDraft()">⟳ Trộn đề khác</button><button class="btn btn-soft" onclick="saveExamBuilderDraft()">☆ Lưu đề</button></div><div class="exam-preview-list mt">${e.questions.map((q,i)=>`<div class="exam-preview-q"><div class="n">${i+1}</div><div><div class="qtext">${mathHTML(q.question||'')}</div><div class="qmeta"><span class="pill">Ch.${q.chapterId||'?'}</span><span class="level-badge ${levelClass(q.level)}">${levelName(q.level)}</span><span class="pill">${esc(q.knowledgeCode||'')}</span></div></div><span class="qtype">${ebTypeName(q.type)}</span></div>`).join('')}</div>`;typesetMath(box)}
function renderSavedCustomExams(){let box=document.getElementById('examBuilderSaved');if(!box)return;let arr=state.customExams||[];box.innerHTML=arr.length?arr.map(e=>`<div class="saved-exam"><div><h4>${esc(e.title)}</h4><p>${e.questions?.length||0} câu • ${e.durationMinutes||45} phút • ${new Date(e.createdAt||Date.now()).toLocaleString('vi-VN')}${e.scoring==='thpt'?' • thang THPT':''}</p></div><div class="saved-exam-actions"><button class="btn btn-blue" onclick="openSavedCustomExam('${e.id}')">Thi</button><button class="btn btn-soft" onclick="previewSavedCustomExam('${e.id}')">Xem</button><button class="btn btn-soft" onclick="exportCustomExam('${e.id}')">JSON</button><button class="btn btn-danger" onclick="deleteSavedCustomExam('${e.id}')">Xóa</button></div></div>`).join(''):'<div class="exam-preview-empty" style="padding:18px">Chưa có đề tự tạo nào được lưu.</div>'}
function openSavedCustomExam(id){let e=(state.customExams||[]).find(x=>x.id===id);if(e)openExamStart(examBuilderConfig(e))}
function previewSavedCustomExam(id){let e=(state.customExams||[]).find(x=>x.id===id);if(!e)return;examBuilderDraft=ebClone(e);renderExamBuilderPreview();document.getElementById('examBuilderPreview')?.scrollIntoView({behavior:'smooth',block:'start'})}
async function deleteSavedCustomExam(id){let e=(state.customExams||[]).find(x=>x.id===id);if(!e||!confirm(`Đưa đề “${e.title}” vào Thùng rác V26?`))return;if(typeof v26TrashLocalContent==='function')await v26TrashLocalContent('exam',e);state.customExams=state.customExams.filter(x=>x.id!==id);save({reason:'v26-exam-trash'});renderSavedCustomExams();updateExamBuilderSummary();examToast?.('Đã chuyển đề vào Thùng rác V26.')}
function exportCustomExam(id){let e=(state.customExams||[]).find(x=>x.id===id);if(!e)return;let blob=new Blob([JSON.stringify({app:'Math12 Hub',version:APP_VERSION,kind:'custom-exam',exam:e},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`math12-exam-${String(e.id).replace(/[^A-Za-z0-9_-]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

const ROLE_ACCESS={
  student:new Set(['dashboard','learning-plan','lessons','lesson-detail','chapters','periodic','thpt','progress','analytics','reports','notifications','online']),
  teacher:new Set(['dashboard','lessons','lesson-detail','chapters','periodic','thpt','reports','notifications','online','question-bank','ai-teacher','exam-builder','teacher']),
  admin:new Set(['dashboard','lessons','lesson-detail','chapters','periodic','thpt','reports','notifications','online','question-bank','ai-teacher','exam-builder','teacher','admin'])
};
function currentSecureRole(){
  if(!firebaseUser||!firebaseProfile)return 'student';
  return firebaseProfile.role==='admin'?'admin':firebaseProfile.role==='teacher'?'teacher':'student';
}
function isTeacherRole(){return ['teacher','admin'].includes(currentSecureRole())}
function isAdminRole(){return currentSecureRole()==='admin'}
function canAccessPage(page,role=currentSecureRole()){return (ROLE_ACCESS[role]||ROLE_ACCESS.student).has(page)}
function clearTeacherPrivateLocal(){
  // V21: trước khi khóa nội dung giáo viên khỏi state đang hoạt động, luôn tạo bản cứu hộ.
  // Học sinh vẫn dùng ngân hàng mẫu cho luyện tập, còn câu/đề riêng của giáo viên được cất trong Data Safety Vault.
  state._meta=state._meta||{};
  // Chỉ cất khi nội dung giáo viên đang thực sự mở. Nếu đã khóa rồi, không ghi đè bản cứu hộ bằng ngân hàng mẫu.
  if(!state._meta.teacherContentInVault&&typeof v21StashTeacherContent==='function')v21StashTeacherContent('role-lock').catch(()=>{});
  state._meta.teacherContentInVault=true;state._meta.teacherLockedAt=new Date().toISOString();
  state.questionBank=JSON.parse(JSON.stringify(SEED_QUESTION_BANK));
  state.customExams=[];state.recycleBinV26={questions:[],customExams:[]};
  if(typeof examBuilderDraft!=='undefined')examBuilderDraft=null;
  try{localStorage.setItem(LOCAL_STATE_KEY||'math12hub2026',JSON.stringify(state))}catch(_){}
  const tb=document.getElementById('questionBankTable');if(tb)tb.innerHTML='';
  const sv=document.getElementById('examBuilderSaved');if(sv)sv.innerHTML='';
}
function applyRoleAccess(role='student',navigate=false){
  role=role==='admin'?'admin':role==='teacher'?'teacher':'student';
  state.role=role;
  try{localStorage.setItem('math12hub2026',JSON.stringify(state))}catch(_){}
  const app=document.getElementById('app');
  app?.classList.toggle('teacher-mode',role==='teacher'||role==='admin');
  app?.classList.toggle('admin-mode',role==='admin');
  const badge=document.getElementById('secureRoleBadge');
  if(badge){
    badge.className=`secure-role-badge ${firebaseUser?role:'guest'}`;
    badge.textContent=firebaseUser?(role==='admin'?'🛡 Quản trị viên':role==='teacher'?'♙ Giáo viên':'👤 Học sinh'):'○ Khách';
    badge.title=firebaseUser?'Vai trò được xác thực từ Firestore':'Chưa đăng nhập • quyền học sinh';
  }
  if(role!=='teacher'&&role!=='admin')clearTeacherPrivateLocal();
  if(typeof firebaseNotificationItems!=='undefined'){firebaseNotificationItems=[];firebaseSetNotificationBadge(0)}
  const active=document.querySelector('.section.active')?.id?.replace(/^page-/,'')||'dashboard';
  if(!canAccessPage(active,role)||navigate)goPage('dashboard',true);
  if(document.getElementById('page-online')?.classList.contains('active'))renderFirebaseOnlinePage();
}
function requireTeacher(action='Chức năng này'){
  if(isTeacherRole())return true;
  alert(`${action} chỉ dành cho tài khoản giáo viên đã được xác thực.`);
  return false;
}
function goPage(page,internal=false){
  const role=currentSecureRole();
  if(!canAccessPage(page,role)){
    if(!internal){let who=page==='admin'?'quản trị viên':['question-bank','ai-teacher','exam-builder','teacher'].includes(page)?'giáo viên':'học sinh',label=page==='question-bank'?'Ngân hàng câu hỏi':page==='ai-teacher'?'AI Teaching Intelligence':page==='exam-builder'?'Tạo đề kiểm tra':page==='teacher'?'Theo dõi lớp':page==='reports'?'Báo cáo học tập':page==='admin'?'Quản trị hệ thống':'này';alert(`Mục “${label}” chỉ dành cho ${who}.`);}
    page='dashboard';
  }
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));let p=document.getElementById('page-'+page);if(p)p.classList.add('active');document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));let titles={dashboard:'Tổng quan học tập','learning-plan':'Lộ trình của em',lessons:'Học theo bài',chapters:'Ôn theo chương',periodic:'Kiểm tra định kỳ',thpt:'Ôn thi tốt nghiệp THPT',progress:'Tiến độ của em',analytics:'Phân tích năng lực','lesson-detail':'Chi tiết bài học','question-bank':'Ngân hàng câu hỏi','ai-teacher':'AI Teaching Intelligence','exam-builder':'Tạo đề kiểm tra',notifications:'Thông báo',online:'Lớp học online',reports:'Báo cáo học tập',teacher:'Theo dõi lớp',admin:'Quản trị hệ thống'};document.getElementById('pageTitle').textContent=titles[page]||'Math12 Hub';if(page==='learning-plan')v28RenderStudentUX?.();if(page==='progress')renderProgress();if(page==='analytics')renderAnalytics();if(page==='lesson-detail')renderLessonDetail();if(page==='question-bank'&&isTeacherRole())renderQuestionBank(true);if(page==='ai-teacher'&&isTeacherRole())v32RenderAIAssistant?.();if(page==='exam-builder'&&isTeacherRole()){renderExamBuilder(!document.getElementById('examBuilderMatrix')?.children.length);toggleExamBuilderTypes(false)}if(page==='notifications'){renderNotificationsPage();setTimeout(()=>firebaseRefreshNotifications(false),0)}if(page==='online')renderFirebaseOnlinePage();if(page==='reports')setTimeout(()=>v33RenderReportsPage?.(),0);if(page==='teacher'&&isTeacherRole()){renderTeacher();setTimeout(()=>firebaseRefreshTeacherDashboard(false),0)}if(page==='admin'&&isAdminRole()){renderAdminV25?.();setTimeout(()=>v25AdminRefresh?.(false),0)}closeSidebar()
}
function setRole(){applyRoleAccess(currentSecureRole(),true)}

function analyticsQuestionMeta(history={}){
  let q=(state.questionBank||[]).find(x=>x.id===history.questionId)||null;
  let code=history.knowledgeCode||q?.knowledgeCode||'';
  let meta=allKnowledgeCodes().find(k=>k.code===code)||null;
  let chapterId=Number(history.chapterId||q?.chapterId||meta?.chapterId)||0;if(!chapterId){let m=String(code).match(/^F([1-6])$/);if(m)chapterId=Number(m[1])}
  return {q,code,lessonId:history.lessonId||q?.lessonId||meta?.lessonId||'',chapterId,level:history.level||q?.level||'',type:history.type||q?.type||'',title:meta?.title||(chapterId?`Câu tổng hợp Chương ${chapterId}`:code)};
}
function analyticsHistory(){
  return (state.questionHistory||[]).map((h,idx)=>{let m=analyticsQuestionMeta(h),credit=Number(h.credit);if(!Number.isFinite(credit))credit=h.correct?1:0;return {...h,_idx:idx,...m,credit:Math.max(0,Math.min(1,credit)),correct:credit>=.999,date:h.date||''}}).filter(h=>h.code);
}
function analyticsSkillStats(){
  const codes=allKnowledgeCodes(),hist=analyticsHistory(),map={};codes.forEach(k=>map[k.code]={...k,total:0,credit:0,accuracy:null,lastDate:'',questionIds:new Set()});
  hist.forEach(h=>{let s=map[h.code];if(!s)return;s.total++;s.credit+=h.credit;s.questionIds.add(h.questionId||'');if(!s.lastDate||h.date>s.lastDate)s.lastDate=h.date});
  Object.values(map).forEach(s=>{s.accuracy=s.total?s.credit/s.total:null;s.state=s.total<2?'new':s.accuracy<.6?'weak':s.accuracy<.8?'reinforce':'strong'});
  return Object.values(map);
}
function analyticsChapterStats(){
  const hist=analyticsHistory(),out=chapters.map(c=>({id:c.id,title:c.title,total:0,credit:0,levels:{NB:{n:0,c:0},TH:{n:0,c:0},VD:{n:0,c:0}}}));
  hist.forEach(h=>{let c=out.find(x=>x.id===h.chapterId);if(!c)return;c.total++;c.credit+=h.credit;let l=c.level;if(c.levels[l]){c.levels[l].n++;c.levels[l].c+=h.credit}});
  out.forEach(c=>c.accuracy=c.total?c.credit/c.total:null);return out;
}
function analyticsOverallStats(){let h=analyticsHistory(),credit=h.reduce((s,x)=>s+x.credit,0),skills=analyticsSkillStats(),chap=analyticsChapterStats(),tested=skills.filter(s=>s.total),weak=skills.filter(s=>s.total>=2&&s.accuracy<.6),strong=skills.filter(s=>s.total>=2&&s.accuracy>=.8),best=chap.filter(c=>c.total>=2&&c.accuracy!=null).sort((a,b)=>b.accuracy-a.accuracy)[0];return {history:h,total:h.length,accuracy:h.length?credit/h.length:null,skills,tested,weak,strong,chap,best}}
function analyticsStateLabel(s){return s==='weak'?'Cần học lại':s==='reinforce'?'Cần củng cố':s==='strong'?'Đã vững':'Chưa đủ dữ liệu'}
function analyticsStatusText(acc,total){if(total<5)return 'Đang thu thập dữ liệu';if(acc>=.85)return 'Năng lực tốt';if(acc>=.7)return 'Nền tảng khá';if(acc>=.55)return 'Cần củng cố';return 'Cần học lại trọng tâm'}
function analyticsWeakSkills(limit=5){let a=analyticsSkillStats().filter(s=>s.total>0).sort((x,y)=>{let ax=x.total<2?0.68:x.accuracy,ay=y.total<2?0.68:y.accuracy;return ax-ay||y.total-x.total});let proven=a.filter(s=>s.total>=2&&s.accuracy<.8),single=a.filter(s=>s.total<2);return [...proven,...single].filter((s,i,arr)=>arr.findIndex(x=>x.code===s.code)===i).slice(0,limit)}
function renderAnalytics(){
  const root=document.getElementById('analyticsContent');if(!root)return;let a=analyticsOverallStats(),no=document.getElementById('analyticsNoData');if(no)no.classList.toggle('hidden',a.total>0);root.classList.toggle('hidden',a.total===0);
  if(!a.total)return;
  const pct=Math.round(a.accuracy*100);document.getElementById('analyticsOverall').textContent=pct+'%';document.getElementById('analyticsEvidence').textContent=`${a.total} lượt câu đã phân tích • ${a.tested.length} mã đã có dữ liệu`;document.getElementById('analyticsStatus').textContent=analyticsStatusText(a.accuracy,a.total);document.getElementById('analyticsWeak').textContent=a.weak.length;document.getElementById('analyticsStrong').textContent=a.strong.length;document.getElementById('analyticsAttempts').textContent=(state.examAttempts||[]).length;document.getElementById('analyticsBestChapter').textContent=a.best?`Ch.${a.best.id}`:'—';
  document.getElementById('analyticsChapters').innerHTML=a.chap.map(c=>{let p=c.accuracy==null?null:Math.round(c.accuracy*100),lev=Object.entries(c.levels).map(([k,v])=>`<div><b>${k}</b>${v.n?Math.round(v.c/v.n*100)+'%':'—'}<br>${v.n} lượt</div>`).join('');return `<div class="analytics-chapter"><div class="analytics-chapter-head"><b>Chương ${c.id}. ${esc(c.title)}</b><span>${p==null?'Chưa có dữ liệu':p+'%'}</span></div><div class="analytics-bar"><span style="width:${p||0}%"></span></div><div class="analytics-levels">${lev}</div></div>`}).join('');
  let skillRows=a.skills.filter(s=>s.total).sort((x,y)=>(x.total>=2?x.accuracy:.7)-(y.total>=2?y.accuracy:.7)||y.total-x.total);document.getElementById('analyticsSkills').innerHTML=skillRows.map(s=>`<tr><td class="skill-code">${esc(s.code)}</td><td class="skill-name"><b>${esc(s.title)}</b></td><td>${esc(s.lessonId)}</td><td>${s.total}</td><td class="skill-accuracy">${Math.round(s.accuracy*100)}%</td><td><span class="skill-state ${s.state}">${analyticsStateLabel(s.state)}</span></td><td><button class="btn btn-soft" style="padding:6px 8px;font-size:10px" onclick="startAdaptivePractice(6,'${attrEsc(s.code)}')">Luyện</button></td></tr>`).join('')||'<tr><td colspan="7">Chưa có dữ liệu.</td></tr>';
  let weak=analyticsWeakSkills(4);document.getElementById('adaptiveWeakList').innerHTML=weak.length?weak.map((s,i)=>`<div class="adaptive-skill"><div class="adaptive-rank">${i+1}</div><div><strong>${esc(s.code)} • ${esc(s.title)}</strong><small>${s.total} lượt làm${s.total<2?' • cần thêm dữ liệu':''}</small></div><div class="adaptive-accuracy">${s.accuracy==null?'—':Math.round(s.accuracy*100)+'%'}</div></div>`).join(''):'<div class="analytics-empty" style="padding:14px">Chưa xác định được mã cần luyện.</div>';
  let attempts=(state.examAttempts||[]).slice(-8),trend=document.getElementById('analyticsTrend');trend.innerHTML=attempts.length?attempts.map((x,i)=>`<div class="analytics-trend-col"><b>${Number(x.score).toFixed(1)}</b><div class="analytics-trend-bar" style="height:${Math.max(5,Math.min(100,Number(x.score)*10))}%"></div><small>${i+1}</small></div>`).join(''):'<div class="analytics-empty" style="width:100%">Chưa có lịch sử điểm.</div>';
  document.getElementById('analyticsRecent').innerHTML=(state.examAttempts||[]).slice(-5).reverse().map(x=>`<div class="analytics-attempt"><div><b>${esc(x.title||x.type||'Bài kiểm tra')}</b><small>${new Date(x.date).toLocaleString('vi-VN')} • ${x.total||0} câu</small></div><div class="score">${Number(x.score).toFixed(1)}</div></div>`).join('')||'<div class="analytics-empty">Chưa có bài đã nộp.</div>';
  typesetMath(document.getElementById('page-analytics'));
}
function adaptiveQuestionPoolForCodes(codes=[]){let hist=analyticsHistory(),last={};hist.forEach(h=>last[h.questionId]={credit:h.credit,date:h.date});return (state.questionBank||[]).filter(q=>codes.includes(q.knowledgeCode)&&['mcq','tf','tf4','short'].includes(q.type)).map(q=>({q,last:last[q.id]||null})).sort((a,b)=>{let aa=a.last? (a.last.credit>=.999?2:0):1,bb=b.last?(b.last.credit>=.999?2:0):1;return aa-bb||Math.random()-.5})}
function startAdaptivePractice(count=10,forcedCode=''){
  count=Math.max(3,Math.min(20,Number(count)||10));let skills=forcedCode?analyticsSkillStats().filter(s=>s.code===forcedCode):analyticsWeakSkills(6);let codes=skills.map(s=>s.code);if(!codes.length){alert('Chưa có đủ dữ liệu để xác định điểm yếu. Hãy làm một bài kiểm tra trước.');return}let selected=[],used=new Set();
  for(let round=0;selected.length<count&&round<4;round++){for(const code of codes){let pool=adaptiveQuestionPoolForCodes([code]).filter(x=>!used.has(x.q.id));if(pool[round]?.q){selected.push(pool[round].q);used.add(pool[round].q.id);if(selected.length>=count)break}}}
  if(selected.length<count){for(const x of adaptiveQuestionPoolForCodes(codes)){if(!used.has(x.q.id)){selected.push(x.q);used.add(x.q.id);if(selected.length>=count)break}}}
  if(selected.length<3){alert(`Ngân hàng chưa đủ câu cho các mã yếu (${selected.length} câu khả dụng). Hãy bổ sung thêm câu hỏi.`);return}
  let target=codes.slice(0,4),config={id:`adaptive-${Date.now()}`,mode:'adaptive',attemptType:'adaptive',title:forcedCode?`Luyện thích ứng • ${forcedCode}`:'Luyện thích ứng điểm yếu',subtitle:`Tập trung: ${target.join(' • ')}`,durationMinutes:Math.max(10,Math.ceil(selected.length*1.8)),questions:examShuffle(selected.map(q=>normalizeBankQuestion(q,'Luyện thích ứng')),Date.now()),scoring:'standard',adaptiveCodes:target};openExamStart(config)
}

function renderProgress(){let attempts=state.examAttempts||[],scores=attempts.map(a=>Number(a.score)).filter(Number.isFinite);document.getElementById('pDone').textContent=state.done.length;document.getElementById('pQuiz').textContent=attempts.length;document.getElementById('pBest').textContent=scores.length?Math.max(...scores).toFixed(2):'—';document.getElementById('pLast').textContent=scores.length?scores.at(-1).toFixed(2):'—';document.getElementById('chapterProgress').innerHTML=chapters.map(c=>{let d=chapterDone(c),p=percent(d,c.lessons.length);return `<div style="margin:14px 0"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><b>Chương ${c.id}. ${esc(c.title)}</b><span>${p}%</span></div><div class="progress"><span style="width:${p}%"></span></div></div>`}).join('');let weak=analyticsWeakSkills(4);let rec=weak.length?weak.map(s=>({id:s.lessonId,common:s.title,code:s.code,adaptive:true})):chapters.flatMap(c=>c.lessons).filter(l=>!state.done.includes(l.id)).slice(0,4);document.getElementById('recommendations').innerHTML=rec.map((l,i)=>`<div class="lesson-row"><div class="lesson-index">${i+1}</div><div><h4>${esc(l.common)}</h4><p>${esc(l.code||l.id)}</p></div><button class="btn btn-soft" onclick="${l.adaptive?`startAdaptivePractice(6,'${attrEsc(l.code)}')`:`openLesson('${l.id}')`}">${l.adaptive?'Luyện':'Học'}</button></div>`).join('')||'<div class="notice">Em đã hoàn thành toàn bộ các bài trong khung cơ bản.</div>'}
function resetProgress(){if(!confirm('Đặt lại toàn bộ tiến độ, lịch sử thi và dữ liệu phân tích năng lực?'))return;state.done=[];state.attempts=[];state.examAttempts=[];state.mastered={};state.lessonScores={};state.questionHistory=[];state.adaptiveHistory=[];save();renderAll();renderProgress();renderAnalytics()}
let firebaseTeacherDashboardCache=null,firebaseTeacherDashboardLoading=false;
function renderTeacher(){
  const select=document.getElementById('teacherClassSelect'),notice=document.getElementById('teacherLiveNotice');if(!select)return;
  const owned=firebaseOwnedClasses||[];let selected=firebaseSelectedClassId&&owned.some(c=>c.id===firebaseSelectedClassId)?firebaseSelectedClassId:(owned[0]?.id||'');
  if(selected&&!firebaseSelectedClassId)firebaseSelectedClassId=selected;
  select.innerHTML='<option value="">Chọn lớp online</option>'+owned.map(c=>`<option value="${attrEsc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.name||'Lớp học')}</option>`).join('');
  if(!firebaseReady){if(notice){notice.className='firebase-banner error';notice.textContent='Firebase chưa sẵn sàng. Dashboard lớp cần kết nối Firestore.'}return resetTeacherDashboardUI()}
  if(!firebaseUser){if(notice){notice.className='firebase-banner warn';notice.textContent='Đăng nhập Firebase để xem dữ liệu lớp thật.'}return resetTeacherDashboardUI()}
  if(!owned.length){if(notice){notice.className='firebase-banner warn';notice.textContent='Tài khoản này chưa có lớp online. Hãy tạo lớp trong “Lớp học online”.'}return resetTeacherDashboardUI()}
  if(firebaseTeacherDashboardCache?.classId===selected)renderTeacherDashboardCache(firebaseTeacherDashboardCache);else{if(notice){notice.className='firebase-banner warn';notice.textContent='Chọn lớp hoặc bấm Làm mới để tải dữ liệu Firestore.'}resetTeacherDashboardUI(false)}
}
function resetTeacherDashboardUI(resetNotice=true){
  ['teacherMetricStudents','teacherMetricCompletion','teacherMetricAvg','teacherMetricHelp'].forEach(id=>{let e=document.getElementById(id);if(e)e.textContent='—'});
  let weak=document.getElementById('teacherWeak'),leader=document.getElementById('teacherLeaderboard'),assign=document.getElementById('teacherAssignmentSummary'),tbody=document.getElementById('studentTable');
  if(weak)weak.innerHTML='<div class="teacher-live-empty">Chưa có dữ liệu.</div>';if(leader)leader.innerHTML='<div class="teacher-live-empty">Chưa có dữ liệu.</div>';if(assign)assign.innerHTML='<div class="teacher-live-empty">Chưa có bài giao.</div>';if(tbody)tbody.innerHTML='<tr><td colspan="9">Chưa có dữ liệu lớp.</td></tr>';
  if(resetNotice){let n=document.getElementById('teacherLiveNotice');if(n&&!firebaseUser){n.className='firebase-banner warn';n.textContent='Đăng nhập Firebase để xem dữ liệu lớp thật.'}}
}
function exportCSV(){
  const c=firebaseTeacherDashboardCache;if(!c?.students?.length)return alert('Chưa có dữ liệu lớp để xuất.');
  let rows=[['Hạng','Học sinh','Email','Bài đã nộp','Tổng bài','Tỷ lệ nộp','Điểm TB','Độ chính xác','Mã yếu','Trạng thái','Cập nhật']];
  c.students.forEach((s,i)=>rows.push([i+1,s.name,s.email,s.submitted,s.assignmentCount,s.completion==null?'':Math.round(s.completion*100)+'%',s.avgScore==null?'':s.avgScore.toFixed(2),s.accuracy==null?'':Math.round(s.accuracy*100)+'%',s.weakCode||'',s.status,firebaseDateText(s.updatedAt)]));
  let csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`theo-doi-${String(c.className||'lop').replace(/[^a-zA-Z0-9_-]+/g,'-')}.csv`;a.click();URL.revokeObjectURL(a.href)
}
const lessonQ={
 'F1-01':{q:'Cho hàm số f(x)=x³−3x. Điểm cực đại của hàm số có hoành độ bằng',opts:['−1','0','1','3'],ans:0,ex:'f\'(x)=3x²−3; đạo hàm đổi dấu + sang − tại x=−1.'},
 'F1-02':{q:'Giá trị lớn nhất của f(x)=−x²+4x+1 trên [0;4] là',opts:['1','4','5','9'],ans:2,ex:'Parabol quay xuống, đỉnh tại x=2 và f(2)=5.'},
 'F1-03':{q:'Đồ thị y=(2x+1)/(x−3) có tiệm cận đứng là',opts:['x=−1/2','x=2','x=3','y=3'],ans:2,ex:'Mẫu số bằng 0 tại x=3 và tử khác 0.'},
 'F1-04':{q:'Để khảo sát sự biến thiên của hàm số, bước nào trực tiếp quyết định các khoảng đồng biến, nghịch biến?',opts:['Tính đạo hàm và xét dấu đạo hàm','Tính giao điểm với Oy','Tính f(0)','Chọn vài điểm ngẫu nhiên'],ans:0,ex:'Dấu của đạo hàm quyết định tính đơn điệu trên các khoảng.'},
 'F1-05':{q:'Trong bài toán tối ưu thực tiễn bằng đạo hàm, việc nào cần làm trước khi tìm cực trị?',opts:['Xác định biến và miền giá trị thực tế','Luôn cho đạo hàm bằng 1','Bỏ qua đơn vị','Chỉ xét nghiệm âm'],ans:0,ex:'Mô hình đúng cần biến, hàm mục tiêu và miền thực tế trước khi tối ưu.'},
 'F2-01':{q:'Trong không gian, nếu a=(1;2;−1), b=(2;−1;3) thì a+b bằng',opts:['(3;1;2)','(1;1;2)','(3;3;−4)','(2;2;3)'],ans:0,ex:'Cộng từng tọa độ.'},
 'F2-02':{q:'Điểm M(2;−1;4) có vectơ OM bằng',opts:['(−2;1;−4)','(2;−1;4)','(2;1;4)','(1;−2;4)'],ans:1,ex:'Tọa độ OM trùng với tọa độ điểm M.'},
 'F2-03':{q:'Cho a=(1;0;2), b=(2;1;−1). Tích vô hướng a·b bằng',opts:['0','1','2','3'],ans:0,ex:'1·2+0·1+2·(−1)=0.'},
 'F3-01':{q:'Khoảng biến thiên của mẫu có giá trị nhỏ nhất 12 và lớn nhất 38 là',opts:['24','25','26','50'],ans:2,ex:'R=38−12=26.'},
 'F3-02':{q:'Độ lệch chuẩn bằng',opts:['Bình phương phương sai','Căn bậc hai của phương sai','Nghịch đảo phương sai','Hai lần phương sai'],ans:1,ex:'s=√(s²).'},
 'F4-01':{q:'Một nguyên hàm của f(x)=3x² là',opts:['x³+C','3x³+C','x²+C','6x+C'],ans:0,ex:'(x³)\'=3x².'},
 'F4-02':{q:'∫₀¹ 2x dx bằng',opts:['0','1','2','1/2'],ans:1,ex:'[x²]₀¹=1.'},
 'F4-03':{q:'Diện tích hình phẳng giới hạn bởi y=x, trục Ox, x=0, x=2 bằng',opts:['1','2','3','4'],ans:1,ex:'S=∫₀² x dx=2.'},
 'F5-01':{q:'Mặt phẳng qua M(1;0;0) và có VTPT n=(1;2;−1) có phương trình',opts:['x+2y−z−1=0','x+2y−z+1=0','x−2y+z−1=0','2x+y−z−2=0'],ans:0,ex:'1(x−1)+2y−z=0.'},
 'F5-02':{q:'Đường thẳng có VTCP u=(1;−2;3). Vectơ nào sau đây cùng phương với u?',opts:['(2;−4;6)','(1;2;3)','(−1;−2;−3)','(3;−2;1)'],ans:0,ex:'(2;−4;6)=2u.'},
 'F5-03':{q:'Hai vectơ a,b vuông góc khi',opts:['a+b=0','a·b=0','|a|=|b|','a=b'],ans:1,ex:'Điều kiện tích vô hướng bằng 0.'},
 'F5-04':{q:'Mặt cầu tâm I(1;2;−1), bán kính 3 có phương trình',opts:['(x−1)²+(y−2)²+(z+1)²=9','(x+1)²+(y+2)²+(z−1)²=9','(x−1)²+(y−2)²+(z+1)²=3','x²+y²+z²=9'],ans:0,ex:'Dạng (x−a)²+(y−b)²+(z−c)²=R².'},
 'F6-01':{q:'Nếu P(A∩B)=0,2 và P(B)=0,5 thì P(A|B)=',opts:['0,1','0,4','0,5','0,7'],ans:1,ex:'P(A|B)=P(A∩B)/P(B)=0,4.'},
 'F6-02':{q:'Công thức Bayes dùng chủ yếu để',opts:['Tính trung bình','Đảo chiều xác suất có điều kiện','Tính đạo hàm','Tìm phương sai'],ans:1,ex:'Bayes cho phép suy ra xác suất nguyên nhân khi biết kết quả.'}
};
function buildSeedQuestionBank(){
  const items=[];
  chapters.forEach(ch=>ch.lessons.forEach(l=>{
    const meta=getLessonMeta(l.id),base=lessonQ[l.id];
    if(base){items.push({id:`${l.id}-K1-01`,chapterId:ch.id,lessonId:l.id,knowledgeCode:meta.knowledge[0]?.code||`${l.id}.K1`,form:meta.forms[0]?.title||'',level:meta.knowledge[0]?.level||'NB',type:'mcq',question:base.q,options:[...base.opts],answer:base.ans,explanation:base.ex,source:'seed'});}
    const k2=meta.knowledge[1];
    if(k2)items.push({id:`${l.id}-K2-01`,chapterId:ch.id,lessonId:l.id,knowledgeCode:k2.code,form:meta.forms[1]?.title||'',level:k2.level,type:'tf',question:`Khẳng định sau đúng hay sai? ${k2.summary}`,answer:true,explanation:`Đúng. ${k2.summary}`,source:'seed'});
    const k3=meta.knowledge[2];
    if(k3){let distract=meta.knowledge.filter(k=>k.code!==k3.code).map(k=>k.summary);while(distract.length<3)distract.push('Chỉ cần ghi nhớ công thức mà không cần xét điều kiện của bài toán.');items.push({id:`${l.id}-K3-01`,chapterId:ch.id,lessonId:l.id,knowledgeCode:k3.code,form:meta.forms[2]?.title||'',level:k3.level,type:'mcq',question:`Nội dung nào mô tả đúng nhất kiến thức “${k3.title}”?`,options:[k3.summary,...distract.slice(0,3)],answer:0,explanation:k3.summary,source:'seed'});}
  }));
  const shorts=[
    ['QB-S01',1,'F1-02','F1-02.K2','GTLN – GTNN trên đoạn','TH','Cho f(x)=−x²+4x+1 trên [0;4]. Giá trị lớn nhất của f bằng bao nhiêu?','5','Parabol quay xuống, đỉnh x=2 và f(2)=5.'],
    ['QB-S02',2,'F2-02','F2-02.K2','Khoảng cách và trung điểm','TH','Cho A(1;2;3), B(3;2;1). Tính độ dài AB, làm tròn đến hai chữ số thập phân.','2.83','AB=√[(2)²+0²+(−2)²]=√8≈2,83.'],
    ['QB-S03',3,'F3-02','F3-02.K3','Độ lệch chuẩn','VD','Một mẫu số liệu có phương sai bằng 16. Độ lệch chuẩn bằng bao nhiêu?','4','Độ lệch chuẩn là căn bậc hai của phương sai.'],
    ['QB-S04',4,'F4-02','F4-02.K2','Newton–Leibniz','TH','Tính ∫₀³ 2x dx.','9','[x²]₀³=9.'],
    ['QB-S05',5,'F5-04','F5-04.K1','Tâm và bán kính mặt cầu','NB','Mặt cầu x²+y²+z²=25 có bán kính bằng bao nhiêu?','5','R²=25 nên R=5.'],
    ['QB-S06',6,'F6-01','F6-01.K1','Định nghĩa xác suất có điều kiện','NB','Biết P(A∩B)=0,18 và P(B)=0,6. Tính P(A|B).','0.3','P(A|B)=0,18/0,6=0,3.']
  ];
  shorts.forEach(x=>items.push({id:x[0],chapterId:x[1],lessonId:x[2],knowledgeCode:x[3],form:x[4],level:x[5],type:'short',question:x[6],answer:x[7],explanation:x[8],source:'seed'}));
  return items;
}
const SEED_QUESTION_BANK=buildSeedQuestionBank();
if(!state.questionBank){state.questionBank=JSON.parse(JSON.stringify(SEED_QUESTION_BANK));save()}
function allKnowledgeCodes(){return chapters.flatMap(c=>c.lessons.flatMap(l=>getLessonMeta(l.id).knowledge.map(k=>({chapterId:c.id,lessonId:l.id,...k}))))}
function questionTypeName(t){return t==='mcq'?'Nhiều lựa chọn':t==='tf4'?'Đúng/Sai 4 ý':t==='tf'?'Đúng/Sai 1 mệnh đề':'Trả lời ngắn'}
function attrEsc(s){return esc(s).replace(/`/g,'&#96;')}

function extractTikzFromText(text=''){
  const src=String(text||'');
  const m=src.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/);
  if(!m)return {text:src.trim(),figure:''};
  const rest=(src.slice(0,m.index)+src.slice(m.index+m[0].length)).replace(/\n{3,}/g,'\n\n').trim();
  return {text:rest,figure:m[0].trim()};
}
function normalizeTikzFigure(tex=''){
  let s=String(tex||'').trim();
  const doc=s.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if(doc)s=doc[1].trim();
  const tikz=s.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/);
  if(tikz)s=tikz[0].trim();
  return s;
}
function tikzFigureSrcdoc(tex=''){
  const body=normalizeTikzFigure(tex).replace(/<\/script/gi,'<\\/script');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://tikzjax.com/v1/fonts.css"><style>html,body{margin:0;padding:8px;background:#fff}body{display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,sans-serif}.fallback{font-size:12px;color:#64748b;line-height:1.5;padding:12px;text-align:center}</style></head><body>\x3Cscript src="https://tikzjax.com/v1/tikzjax.js">\x3C/script>\x3Cscript type="text/tikz">${body}\x3C/script><div class="fallback">Nếu hình chưa hiện, hãy kết nối Internet hoặc mở mã hình để kiểm tra.</div></body></html>`;
}
function figureModeName(mode='tikz'){
  return ({tikz:'TikZ',tkz:'tkz-euclide / TikZ hình học',tkztab:'Bảng biến thiên tkz-tab',graph2d:'Đồ thị hàm số 2D',oxyz:'Hình Oxyz',none:'Không có hình'})[mode]||'Hình minh họa';
}
function figureModeTag(mode='tikz'){
  return ({tikz:'Có hình TikZ',tkz:'Hình học TikZ',tkztab:'Bảng biến thiên',graph2d:'Đồ thị 2D',oxyz:'Hình Oxyz'})[mode]||'Có hình';
}
function geometryTemplateForMode(mode='tikz'){
  if(mode==='tkz')return String.raw`\begin{tikzpicture}[scale=0.9]
\coordinate (A) at (0,0);
\coordinate (B) at (5,0);
\coordinate (C) at (1.5,3);
\draw (A)--(B)--(C)--cycle;
\draw[dashed] (C)--($(A)!(C)!(B)$);
\fill (A) circle (1.5pt) node[below]{$A$};
\fill (B) circle (1.5pt) node[below]{$B$};
\fill (C) circle (1.5pt) node[above]{$C$};
\end{tikzpicture}`;
  if(mode==='tkztab')return String.raw`\begin{tikzpicture}[>=stealth,scale=1]
\tkzTabInit[lgt=1.2,espcl=2]
{$x$ /0.7, $y'$ /0.7, $y$ /1.5}
{$-\infty$,$0$,$2$,$+\infty$}
\tkzTabLine{ ,-,0,+,0,-,}
\tkzTabVar{+/$+\infty$,-/$-1$,+/$3$,-/$-\infty$}
\end{tikzpicture}`;
  if(mode==='graph2d')return `title: Đồ thị hàm số\nfunctions: x^2-2*x-3 ; -x+1\nxMin: -4\nxMax: 6\nyMin: -6\nyMax: 8\ngrid: true\nsamples: 240`;
  if(mode==='oxyz')return `title: Hình chóp trong Oxyz\npoints: O(0,0,0); A(3,0,0); B(0,3,0); C(0,0,3); M(1.5,1.5,1.5)\nsegments: O-A; O-B; O-C; A-B; B-C; C-A; O-M\ndashed: A-C\npolygons: A-B-C\nxMax: 4\nyMax: 4\nzMax: 4\nscale: 38`;
  return String.raw`\begin{tikzpicture}[scale=0.85]
\draw[->] (-3,0)--(3,0) node[right]{$x$};
\draw[->] (0,-2)--(0,5) node[above]{$y$};
\draw[smooth,samples=100,domain=-2.2:2.2] plot(\x,{(\x)*(\x)-1});
\end{tikzpicture}`;
}
function openGeometrySupportInfo(){
  const body=`<div class="math-help"><b>TikZ / tkz-euclide:</b> phù hợp hình phẳng, đường tròn, tiếp tuyến, tam giác, đồ thị đơn giản. Với <b>tkz-euclide</b>, website ưu tiên các mẫu hình học phổ thông viết bằng TikZ thuần để xem trước ổn định.</div>
  <div class="math-help"><b>Bảng biến thiên tkz-tab:</b> website tự đọc <code>\tkzTabInit</code>, <code>\tkzTabLine</code>, <code>\tkzTabVar</code> rồi dựng lại bằng HTML/SVG, không phụ thuộc package tkz-tab khi hiển thị.</div>
  <div class="math-help"><b>Đồ thị hàm số 2D:</b> nhập cấu hình theo dòng <code>functions:</code>, <code>xMin:</code>, <code>xMax:</code>, <code>yMin:</code>, <code>yMax:</code>. Có thể nhập nhiều hàm, ngăn cách bằng dấu <code>;</code>.</div>
  <pre class="figure-spec">functions: x^2-2*x-3 ; -x+1\nxMin: -4\nxMax: 6\nyMin: -6\nyMax: 8\ngrid: true</pre>
  <div class="math-help"><b>Hình Oxyz:</b> nhập điểm, đoạn, đa giác theo cấu hình đơn giản.</div>
  <pre class="figure-spec">points: O(0,0,0); A(3,0,0); B(0,3,0); C(0,0,3)\nsegments: O-A; O-B; O-C; A-B; B-C; C-A\npolygons: A-B-C\nxMax: 4\nyMax: 4\nzMax: 4</pre>`;
  openModal('Hỗ trợ hình học nâng cao','TikZ • tkz-euclide • đồ thị hàm số • Oxyz',body,`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`);
}
function setQuestionFigureTemplate(){
  const mode=document.getElementById('qeFigureMode')?.value||'tikz';
  const box=document.getElementById('qeFigureLatex');
  if(!box)return;
  box.value=geometryTemplateForMode(mode);
  if(mode!=='none'){document.getElementById('qeFigureWrap')?.classList.remove('hidden')}
  updateQuestionEditorPreview();
}
function parseSpecLines(text=''){
  const out={};
  String(text||'').split(/\r?\n/).forEach(line=>{
    const s=line.trim();
    if(!s||s.startsWith('#')||s.startsWith('%'))return;
    const idx=s.indexOf(':');
    if(idx<0)return;
    out[s.slice(0,idx).trim()]=s.slice(idx+1).trim();
  });
  return out;
}
function safeNum(v,d){const n=Number(v);return Number.isFinite(n)?n:d}
function boolish(v,def=false){if(v==null||v==='')return def;return /^(1|true|yes|co|có)$/i.test(String(v).trim())}
function compileMathExpression(expr='x'){
  let s=String(expr||'x').trim();
  s=s.replace(/^y\s*=\s*/i,'').replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/π/gi,'pi').replace(/√/g,'sqrt').replace(/\^/g,'**');
  s=s.replace(/\bln\s*\(/gi,'Math.log(').replace(/\blog\s*\(/gi,'log10(').replace(/\bsqrt\s*\(/gi,'Math.sqrt(').replace(/\babs\s*\(/gi,'Math.abs(').replace(/\bexp\s*\(/gi,'Math.exp(');
  s=s.replace(/\bsin\s*\(/gi,'Math.sin(').replace(/\bcos\s*\(/gi,'Math.cos(').replace(/\btan\s*\(/gi,'Math.tan(').replace(/\bcot\s*\(/gi,'cot(');
  s=s.replace(/\bpi\b/gi,'Math.PI').replace(/\be\b/g,'Math.E');
  s=s.replace(/(\d)(x)/g,'$1*$2').replace(/(\))(x)/g,'$1*$2').replace(/(x)(\d)/g,'$1*$2');
  // Chỉ cho phép biểu thức toán học thuần; chặn câu lệnh/chuỗi/thuộc tính lạ khi import dữ liệu ngoài.
  if(/[;{}\[\]="'`\\]/.test(s))throw new Error('Biểu thức chứa ký tự không được hỗ trợ.');
  let probe=s
    .replace(/Math\.(?:log|sqrt|abs|exp|sin|cos|tan|PI|E)/g,'')
    .replace(/\b(?:log10|cot|x)\b/g,'')
    .replace(/\d+(?:\.\d+)?(?:e[+\-]?\d+)?/gi,'')
    .replace(/[+\-*/%().,\s]/g,'');
  if(probe)throw new Error('Biểu thức chứa tên hàm hoặc ký hiệu chưa được hỗ trợ.');
  return new Function('x',`const log10=(v)=>Math.log10?Math.log10(v):Math.log(v)/Math.LN10; const cot=(v)=>1/Math.tan(v); return (${s});`);
}
function graphFigureSrcdoc(specText=''){
  const spec=parseSpecLines(specText), funcs=(spec.functions||spec.function||'x').split(/\s*;\s*/).filter(Boolean);
  const xMin=safeNum(spec.xMin,-5), xMax=safeNum(spec.xMax,5), yMin=safeNum(spec.yMin,-5), yMax=safeNum(spec.yMax,5), samples=Math.max(40,Math.min(600,safeNum(spec.samples,220)));
  const width=560, height=360, pad=32; const sx=(width-2*pad)/(xMax-xMin||1), sy=(height-2*pad)/(yMax-yMin||1); const X=x=>pad+(x-xMin)*sx, Y=y=>height-pad-(y-yMin)*sy;
  const palette=['#2563eb','#dc2626','#16a34a','#7c3aed','#ea580c'];
  const grid=boolish(spec.grid,true); let svg=[];
  if(grid){ for(let x=Math.ceil(xMin); x<=Math.floor(xMax); x++){ svg.push(`<line x1="${X(x)}" y1="${pad}" x2="${X(x)}" y2="${height-pad}" stroke="#e8eef7" stroke-width="1"/>`)} for(let y=Math.ceil(yMin); y<=Math.floor(yMax); y++){ svg.push(`<line x1="${pad}" y1="${Y(y)}" x2="${width-pad}" y2="${Y(y)}" stroke="#e8eef7" stroke-width="1"/>`) } }
  if(xMin<0&&xMax>0)svg.push(`<line x1="${X(0)}" y1="${pad}" x2="${X(0)}" y2="${height-pad}" stroke="#334155" stroke-width="1.5"/>`);
  if(yMin<0&&yMax>0)svg.push(`<line x1="${pad}" y1="${Y(0)}" x2="${width-pad}" y2="${Y(0)}" stroke="#334155" stroke-width="1.5"/>`);
  funcs.forEach((expr,idx)=>{ try{ const fn=compileMathExpression(expr); let d='', started=false; for(let i=0;i<samples;i++){ const x=xMin+(xMax-xMin)*i/(samples-1); let y=fn(x); if(!Number.isFinite(y)||Math.abs(y)>1e4){ started=false; continue; } const px=X(x), py=Y(y); if(!started){ d+=`M ${px.toFixed(2)} ${py.toFixed(2)} `; started=true; } else d+=`L ${px.toFixed(2)} ${py.toFixed(2)} `; } svg.push(`<path d="${d}" fill="none" stroke="${palette[idx%palette.length]}" stroke-width="2.2"/>`); svg.push(`<text x="${width-pad-4}" y="${18+idx*16}" text-anchor="end" font-size="12" fill="${palette[idx%palette.length]}">${esc(expr)}</text>`);}catch(err){ svg.push(`<text x="${pad}" y="${18+idx*16}" font-size="12" fill="#dc2626">Lỗi hàm: ${esc(expr)}</text>`); }});
  const title=esc(spec.title||'Đồ thị hàm số');
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:10px;font-family:Arial,sans-serif;background:#fff}svg{text-rendering:geometricPrecision}.title{font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}</style></head><body><div class="title">${title}</div><svg viewBox="0 0 ${width} ${height}" width="100%" height="100%">${svg.join('')}</svg></body></html>`;
}
function projectOxyz(pt,scale=38,ox=180,oy=250){ return {x:ox+(pt.x-pt.y)*scale*0.95, y:oy-pt.z*scale+(pt.x+pt.y)*scale*0.33}; }
function parseOxyzSpec(text=''){
  const spec=parseSpecLines(text), points={};
  const pointRe=/([A-Za-z][A-Za-z0-9']*)\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g; let m;
  const src=spec.points||''; while((m=pointRe.exec(src)))points[m[1]]={x:+m[2],y:+m[3],z:+m[4],name:m[1]};
  const parseRefs=s=>String(s||'').split(/\s*;\s*/).filter(Boolean).map(t=>t.trim());
  return {title:spec.title||'Hình Oxyz', points, segments:parseRefs(spec.segments), dashed:parseRefs(spec.dashed), polygons:parseRefs(spec.polygons), xMax:safeNum(spec.xMax,4), yMax:safeNum(spec.yMax,4), zMax:safeNum(spec.zMax,4), scale:safeNum(spec.scale,38)};
}
function resolvePointRef(token, points){ return points[token]||null; }
function parseSegmentToken(token){ let t=token.trim(); if(t.includes('-')){ const p=t.split('-').map(s=>s.trim()).filter(Boolean); return p.length>=2?[p[0],p[1]]:null; } if(/^[A-Za-z][A-Za-z0-9']*[A-Za-z][A-Za-z0-9']*$/.test(t)&&!/\d/.test(t)) return [t[0],t.slice(1)]; return null; }
function oxyzFigureSrcdoc(specText=''){
  const s=parseOxyzSpec(specText), width=560,height=380, ox=190, oy=280, scale=s.scale; let svg=[];
  const axes={O:{x:0,y:0,z:0},X:{x:s.xMax,y:0,z:0},Y:{x:0,y:s.yMax,z:0},Z:{x:0,y:0,z:s.zMax}};
  const O=projectOxyz(axes.O,scale,ox,oy), X=projectOxyz(axes.X,scale,ox,oy), Y=projectOxyz(axes.Y,scale,ox,oy), Z=projectOxyz(axes.Z,scale,ox,oy);
  svg.push(`<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#475569"/></marker></defs>`);
  [['x',X],['y',Y],['z',Z]].forEach(([n,p])=>svg.push(`<line x1="${O.x}" y1="${O.y}" x2="${p.x}" y2="${p.y}" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow)"/><text x="${p.x+6}" y="${p.y-4}" font-size="12" fill="#0f172a">${n}</text>`));
  s.polygons.forEach(poly=>{ const names=poly.split('-').map(v=>v.trim()).filter(Boolean); const pts=names.map(n=>resolvePointRef(n,s.points)).filter(Boolean); if(pts.length>=3){ const pstr=pts.map(p=>{const q=projectOxyz(p,scale,ox,oy); return `${q.x},${q.y}`}).join(' '); svg.push(`<polygon points="${pstr}" fill="#dbeafe" fill-opacity="0.55" stroke="#93c5fd" stroke-width="1"/>`); }});
  const drawSeg=(token,dashed=false)=>{ const pair=parseSegmentToken(token); if(!pair)return; const A=resolvePointRef(pair[0],s.points), B=resolvePointRef(pair[1],s.points); if(!A||!B)return; const p=projectOxyz(A,scale,ox,oy), q=projectOxyz(B,scale,ox,oy); svg.push(`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#1e293b" stroke-width="1.6" ${dashed?'stroke-dasharray="6 4"':''}/>`); };
  s.segments.forEach(t=>drawSeg(t,false)); s.dashed.forEach(t=>drawSeg(t,true));
  Object.values(s.points).forEach(pt=>{ const p=projectOxyz(pt,scale,ox,oy); svg.push(`<circle cx="${p.x}" cy="${p.y}" r="2.8" fill="#111827"/><text x="${p.x+5}" y="${p.y-5}" font-size="12" fill="#111827">${pt.name}</text>`); });
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:10px;font-family:Arial,sans-serif;background:#fff}.title{font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}</style></head><body><div class="title">${esc(s.title)}</div><svg viewBox="0 0 ${width} ${height}" width="100%" height="100%">${svg.join('')}</svg></body></html>`;
}

function splitLatexTopLevel(src='',sep=','){
  const out=[];let cur='',brace=0,bracket=0,paren=0,escaped=false;
  for(let i=0;i<String(src).length;i++){
    const ch=src[i];
    if(escaped){cur+=ch;escaped=false;continue}
    if(ch==='\\'){cur+=ch;escaped=true;continue}
    if(ch==='{')brace++;else if(ch==='}')brace=Math.max(0,brace-1);else if(ch==='[')bracket++;else if(ch===']')bracket=Math.max(0,bracket-1);else if(ch==='(')paren++;else if(ch===')')paren=Math.max(0,paren-1);
    if(ch===sep&&brace===0&&bracket===0&&paren===0){out.push(cur.trim());cur='';}else cur+=ch;
  }
  out.push(cur.trim());return out;
}
function tkzTabCommandGroups(src='',cmd='',count=1){
  const marker='\\'+cmd;let pos=src.indexOf(marker);if(pos<0)return null;let i=pos+marker.length;
  while(/\s/.test(src[i]||''))i++;
  if(src[i]==='['){let depth=0,escaped=false;for(;i<src.length;i++){let ch=src[i];if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch==='[')depth++;else if(ch===']'){depth--;if(depth===0){i++;break}}}while(/\s/.test(src[i]||''))i++}
  const groups=[];
  for(let n=0;n<count;n++){if(src[i]!=='{')return null;const g=readBalancedGroup(src,i);if(!g)return null;groups.push(g.content);i=g.end;while(/\s/.test(src[i]||''))i++}
  return {groups,start:pos,end:i};
}
function tkzPlainMath(s=''){
  let x=String(s||'').trim().replace(/^\$|\$$/g,'').trim();
  x=x.replace(/\\displaystyle/g,'').replace(/\\left/g,'').replace(/\\right/g,'').replace(/\\,/g,' ').replace(/\\;/g,' ').replace(/\\!/g,'');
  x=x.replace(/\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,'($1)/($2)');
  x=x.replace(/\\sqrt\s*\{([^{}]+)\}/g,'√$1').replace(/\\sqrt\s*([A-Za-z0-9]+)/g,'√$1');
  x=x.replace(/\\mathbb\s*\{R\}/g,'ℝ').replace(/\\mathbb\s*\{N\}/g,'ℕ').replace(/\\mathbb\s*\{Z\}/g,'ℤ').replace(/\\mathbb\s*\{Q\}/g,'ℚ');
  x=x.replace(/\\infty/g,'∞').replace(/\\pm/g,'±').replace(/\\mp/g,'∓').replace(/\\leq?/g,'≤').replace(/\\geq?/g,'≥').replace(/\\neq/g,'≠').replace(/\\to/g,'→').replace(/\\cdot/g,'·');
  x=x.replace(/\\alpha/g,'α').replace(/\\beta/g,'β').replace(/\\gamma/g,'γ').replace(/\\Delta/g,'Δ').replace(/\\pi/g,'π');
  x=x.replace(/\^\{([^{}]+)\}/g,'^$1').replace(/_\{([^{}]+)\}/g,'_$1').replace(/[{}]/g,'');
  return x.trim();
}
function tkzMathRaw(s=''){
  let x=String(s||'').trim();
  if(x.startsWith('$')&&x.endsWith('$')&&x.length>=2)x=x.slice(1,-1).trim();
  return x;
}
function tkzMathCell(s=''){
  const raw=tkzMathRaw(s);return raw?mathHTML(`$${raw}$`):'';
}
function tkzAllCommandGroups(src='',cmd='',count=1){
  const out=[],marker='\\'+cmd;let from=0;
  while(from<src.length){let pos=src.indexOf(marker,from);if(pos<0)break;if(/[A-Za-z]/.test(src[pos+marker.length]||'')){from=pos+marker.length;continue}let i=pos+marker.length;while(/\s/.test(src[i]||''))i++;if(src[i]==='['){let depth=0,escaped=false;for(;i<src.length;i++){const ch=src[i];if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch==='[')depth++;else if(ch===']'){depth--;if(depth===0){i++;break}}}while(/\s/.test(src[i]||''))i++}const groups=[];let ok=true;for(let n=0;n<count;n++){if(src[i]!=='{'){ok=false;break}const g=readBalancedGroup(src,i);if(!g){ok=false;break}groups.push(g.content);i=g.end;while(/\s/.test(src[i]||''))i++}if(ok)out.push({groups,start:pos,end:i});from=Math.max(i,pos+marker.length)}
  return out;
}
function parseTkzTabFigure(tex=''){
  let src=String(tex||'').replace(/(^|[^\\])%.*$/gm,'$1');
  const init=tkzTabCommandGroups(src,'tkzTabInit',2),line=tkzTabCommandGroups(src,'tkzTabLine',1),vr=tkzTabCommandGroups(src,'tkzTabVar',1);
  if(!init)return {ok:false,error:'Không đọc được \\tkzTabInit.'};
  const rowDefs=splitLatexTopLevel(init.groups[0]).map(v=>v.replace(/\s*\/\s*[-+]?(?:\d+(?:\.\d*)?|\.\d+)\s*$/,'').trim()).filter(Boolean);
  const xsRaw=splitLatexTopLevel(init.groups[1]).map(v=>String(v||'').trim());
  const xs=xsRaw.map(tkzPlainMath);
  const lineTokens=line?splitLatexTopLevel(line.groups[0]):[];
  const boundary=[],interval=[];
  if(lineTokens.length){for(let i=0;i<xs.length;i++){boundary[i]=(lineTokens[2*i]||'').trim();if(i<xs.length-1)interval[i]=(lineTokens[2*i+1]||'').trim()}}
  const vars=vr?splitLatexTopLevel(vr.groups[0]).map(t=>{
    let p=splitLatexTopLevel(t,'/');let mode=(p.shift()||'').trim();
    if(mode.includes('D')){const [leftMode,rightMode]=mode.split('D');return {mode,discontinuity:true,leftMode:(leftMode||'').trim(),rightMode:(rightMode||'').trim(),leftRaw:String(p[0]||'').trim(),rightRaw:String(p[1]||'').trim(),leftValue:tkzPlainMath(p[0]||''),rightValue:tkzPlainMath(p[1]||'')}}
    return {mode,discontinuity:false,rawValue:String(p.join('/')||'').trim(),value:tkzPlainMath(p.join('/'))};
  }):[];
  const vals=tkzAllCommandGroups(src,'tkzTabVal',5).map(x=>({from:Number(x.groups[0]),to:Number(x.groups[1]),pos:Number(x.groups[2]),xRaw:x.groups[3],yRaw:x.groups[4]}));
  const imas=tkzAllCommandGroups(src,'tkzTabIma',4).map(x=>({from:Number(x.groups[0]),to:Number(x.groups[1]),slot:Number(x.groups[2]),valueRaw:x.groups[3]}));
  const unsupported=[];['tkzTabTan','tkzTabSlope'].forEach(cmd=>{if(src.includes('\\'+cmd))unsupported.push(cmd)});
  return {ok:true,rows:rowDefs,xs,xsRaw,boundary,interval,vars,rawLine:lineTokens,vals,imas,unsupported,source:src};
}
function tkzTabFigureSrcdoc(tex=''){
  const d=parseTkzTabFigure(tex);
  if(!d.ok)return `<!doctype html><html><body style="font-family:Arial;padding:20px;color:#b91c1c">${esc(d.error||'Không đọc được bảng biến thiên.')}</body></html>`;
  const n=Math.max(2,d.xs.length),labelX=tkzPlainMath(d.rows[0]||'$x$'),labelD=tkzPlainMath(d.rows[1]||"$y'$"),labelY=tkzPlainMath(d.rows[2]||'$y$');
  const width=Math.max(720,180+n*142),height=244,labelW=92,top=10,rowX=52,rowD=50,rowY=120,bottom=top+rowX+rowD+rowY;
  const outerRight=width-14;
  const edgeSafe=Math.max(50,Math.min(70,width*0.08));
  const dataLeft=labelW+edgeSafe,dataRight=outerRight-edgeSafe,usable=dataRight-dataLeft;
  const nodeXs=Array.from({length:n},(_,i)=>dataLeft+usable*(i/(n-1)));
  const yTop=top+rowX+rowD+26,yBottom=bottom-24,yMid=(yTop+yBottom)/2;
  const splitGap=Math.max(30,Math.min(42,usable/(n*5.5)));
  const lineGap=5;
  const svg=[];
  const add=(s)=>svg.push(s);
  const txt=(x,y,t,cls='',anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" class="${cls}">${esc(t)}</text>`;
  const modeY=(mode='')=>String(mode||'').includes('+')?yTop:String(mode||'').includes('-')?yBottom:yMid;
  const valueY=(value='',mode='')=>{const v=String(value||'');if(v.includes('+∞'))return yTop;if(v.includes('-∞'))return yBottom;return modeY(mode)};
  const parseSqrtValue=(t='')=>{const s=String(t||'').trim();const m=s.match(/^([+\-−]?)(?:√)(.+)$/);return m?{sign:(m[1]||'').trim(),rad:(m[2]||'').trim()}:null};
  const valueBoxWidth=(t='')=>{const sq=parseSqrtValue(t);if(sq)return Math.max(50,Math.min(124,30+(sq.sign?10:0)+String(sq.rad).length*14));return Math.max(38,Math.min(106,20+String(t).length*12))};
  const valueBox=(x,y,t)=>{if(!t)return '';const w=valueBoxWidth(t),h=28,left=x-w/2,topBox=y-h/2,sq=parseSqrtValue(t);if(!sq)return `<g><rect x="${left}" y="${topBox}" width="${w}" height="${h}" rx="1.5" class="value-bg"/>${txt(x,y+1,t,'value-text')}</g>`;const signW=sq.sign?10:0,radW=Math.max(11,String(sq.rad).length*10),rootX=left+8+signW,radTextX=rootX+16;const rootPath=`M ${rootX} ${y-1} L ${rootX+4} ${y+6} L ${rootX+9} ${y-9} L ${radTextX-1} ${y-9}`;return `<g><rect x="${left}" y="${topBox}" width="${w}" height="${h}" rx="1.5" class="value-bg"/>${sq.sign?`<text x="${left+9}" y="${y+1}" dominant-baseline="middle" text-anchor="start" class="value-text">${esc(sq.sign)}</text>`:''}<path d="${rootPath}" class="sqrt-stroke"/><line x1="${radTextX-1}" y1="${y-9}" x2="${radTextX+radW+2}" y2="${y-9}" class="sqrt-bar"/><text x="${radTextX}" y="${y+3}" dominant-baseline="middle" text-anchor="start" class="value-text sqrt-rad">${esc(sq.rad)}</text></g>`};
  add(`<defs><marker id="arr" markerWidth="9" markerHeight="9" refX="7.1" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7 z" class="arrow-head"/></marker></defs>`);
  add(`<rect x="0.75" y="${top}" width="${outerRight-0.75}" height="${rowX}" class="x-bg outer"/>`);
  add(`<rect x="0.75" y="${top+rowX}" width="${outerRight-0.75}" height="${rowD}" class="d-bg outer"/>`);
  add(`<rect x="0.75" y="${top+rowX+rowD}" width="${outerRight-0.75}" height="${rowY}" class="y-bg outer"/>`);
  add(`<rect x="0.75" y="${top}" width="${labelW}" height="${rowX}" class="label-x"/>`);
  add(`<rect x="0.75" y="${top+rowX}" width="${labelW}" height="${rowD}" class="label-d"/>`);
  add(`<rect x="0.75" y="${top+rowX+rowD}" width="${labelW}" height="${rowY}" class="label-y"/>`);
  add(`<line x1="${labelW}" y1="${top}" x2="${labelW}" y2="${bottom}" class="grid strong"/>`);
  add(`<line x1="0.75" y1="${top+rowX}" x2="${outerRight}" y2="${top+rowX}" class="grid"/>`);
  add(`<line x1="0.75" y1="${top+rowX+rowD}" x2="${outerRight}" y2="${top+rowX+rowD}" class="grid"/>`);
  add(txt(labelW/2,top+rowX/2+1,labelX,'axis-label italic'));
  add(txt(labelW/2,top+rowX+rowD/2+1,labelD,'axis-label italic'));
  add(txt(labelW/2,top+rowX+rowD+rowY/2+1,labelY,'axis-label italic'));
  for(let i=0;i<n;i++){
    add(txt(nodeXs[i],top+rowX/2+1,d.xs[i]||'','x-text'));
    const b=(d.boundary[i]||'').trim();
    if(b.includes('d')){
      // 'd' in tkzTabLine = f' undefined: double line only in y' row. 'D' in tkzTabVar = function discontinuity: extend through y row.
      const hasFunctionBreak=!!d.vars[i]?.discontinuity;
      const breakBottom=hasFunctionBreak?bottom:(top+rowX+rowD);
      if(hasFunctionBreak)add(`<rect x="${nodeXs[i]-lineGap+0.7}" y="${top+rowX}" width="${2*lineGap-1.4}" height="${breakBottom-(top+rowX)}" class="break-gap"/>`);
      add(`<line x1="${nodeXs[i]-lineGap}" y1="${top+rowX}" x2="${nodeXs[i]-lineGap}" y2="${breakBottom}" class="break-line ${hasFunctionBreak?'function-break':''}"/><line x1="${nodeXs[i]+lineGap}" y1="${top+rowX}" x2="${nodeXs[i]+lineGap}" y2="${breakBottom}" class="break-line ${hasFunctionBreak?'function-break':''}"/>`);
    }
    else if(b==='0'||b.includes('z')) add(txt(nodeXs[i],top+rowX+rowD/2+1,'0','sign-text zero'));
    else if(b) add(txt(nodeXs[i],top+rowX+rowD/2+1,tkzPlainMath(b),'sign-text'));
    if(i<n-1){
      const mid=(nodeXs[i]+nodeXs[i+1])/2,s=(d.interval[i]||'').trim(),sign=s.includes('+')?'+':s.includes('-')?'−':s.includes('0')?'0':tkzPlainMath(s);
      add(txt(mid,top+rowX+rowD/2+1,sign,'sign-text'));
    }
  }
  const nodes=[];
  for(let i=0;i<n;i++){
    const v=d.vars[i]||{};
    if(v.discontinuity){
      nodes.push({kind:'break',x:nodeXs[i],left:{x:nodeXs[i]-splitGap,y:valueY(v.leftValue,v.leftMode),value:v.leftValue},right:{x:nodeXs[i]+splitGap,y:valueY(v.rightValue,v.rightMode),value:v.rightValue}});
    }else nodes.push({kind:'normal',x:nodeXs[i],pt:{x:nodeXs[i],y:valueY(v.value,v.mode),value:v.value}});
  }
  const segStart=(node)=>node?.kind==='break'?node.right:node?.pt;
  const segEnd=(node)=>node?.kind==='break'?node.left:node?.pt;
  for(let i=0;i<n-1;i++){
    const a=segStart(nodes[i]),b=segEnd(nodes[i+1]);
    if(!a||!b)continue;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
    const padA=Math.min(46,22+String(a.value||'').length*4.2),padB=Math.min(46,22+String(b.value||'').length*4.2);
    const x1=a.x+ux*padA,y1=a.y+uy*padA,x2=b.x-ux*padB,y2=b.y-uy*padB;
    add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="trend-line" marker-end="url(#arr)"/>`);
  }
  nodes.forEach(node=>{if(node.kind==='break'){add(valueBox(node.left.x,node.left.y,node.left.value));add(valueBox(node.right.x,node.right.y,node.right.value));}else if(node.pt)add(valueBox(node.pt.x,node.pt.y,node.pt.value));});
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  *{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111}body{padding:10px;display:flex;align-items:center;justify-content:center;min-height:100vh;overflow:hidden}.wrap{width:100%;max-width:${width}px}.frame{width:100%;display:block}.outer{stroke:#141414;stroke-width:1.35}.x-bg{fill:#cff8cc}.d-bg,.y-bg{fill:#fff9d8}.label-x{fill:#f7f7f7;stroke:#141414;stroke-width:1.2}.label-d,.label-y{fill:#ffe4c6;stroke:#141414;stroke-width:1.2}.grid{stroke:#141414;stroke-width:1.2}.grid.strong{stroke-width:1.35}.break-gap{fill:#fffdf0}.break-line{stroke:#111;stroke-width:1.15}.break-line.function-break{stroke-width:1.45}.axis-label{font-family:"Times New Roman",Cambria,serif;font-size:24px;fill:#111}.italic{font-style:italic}.x-text,.sign-text,.value-text{font-family:"Times New Roman",Cambria,serif;fill:#111}.x-text{font-size:24px}.sign-text{font-size:25px}.sign-text.zero{font-size:23px}.trend-line{stroke:#111;stroke-width:1.25;fill:none}.arrow-head{fill:#111}.value-bg{fill:#fff;fill-opacity:.96}.value-text{font-size:24px;font-weight:500}.sqrt-rad{font-size:20px}.sqrt-bar,.sqrt-stroke{stroke:#111;stroke-width:1.35;fill:none;stroke-linecap:round;stroke-linejoin:round}.frame{shape-rendering:geometricPrecision;text-rendering:geometricPrecision}@media(max-width:620px){body{padding:4px}.axis-label,.x-text,.value-text{font-size:21px}.sign-text{font-size:22px}}
  </style></head><body><div class="wrap"><svg class="frame" viewBox="0 0 ${width} ${height}" role="img" aria-label="Bảng biến thiên">${svg.join('')}</svg></div></body></html>`;
}
function detectFigureMode(figure='',fallback='tikz'){
  const s=String(figure||'');if(/\\tkzTab(?:Init|Line|Var|Val|Ima|Tan|Slope)\b/.test(s))return 'tkztab';return fallback;
}

function figureSrcdocByMode(mode,figure){ if(mode==='tkztab')return tkzTabFigureSrcdoc(figure); if(mode==='graph2d')return graphFigureSrcdoc(figure); if(mode==='oxyz')return oxyzFigureSrcdoc(figure); return tikzFigureSrcdoc(figure); }
function tkzTabNativeHTML(tex=''){
  const d=parseTkzTabFigure(tex);if(!d.ok)return `<div class="bulk-errors fatal">${esc(d.error||'Không đọc được bảng biến thiên.')}</div>`;
  const n=Math.max(2,d.xsRaw?.length||d.xs.length),safeA=8,safeB=92,nodeX=Array.from({length:n},(_,i)=>safeA+(safeB-safeA)*(i/(n-1)));
  const modeY=(mode='')=>String(mode||'').includes('+')?20:String(mode||'').includes('-')?80:50;
  const normRaw=(raw='')=>tkzMathRaw(raw).replace(/\s+/g,'');
  const isPosInfRaw=(raw='')=>/^(?:\+?\\infty|\+?∞)$/.test(normRaw(raw));
  const isNegInfRaw=(raw='')=>/^(?:[-−]\\infty|[-−]∞)$/.test(normRaw(raw));
  const rawY=(raw='',mode='')=>{if(isPosInfRaw(raw))return 20;if(isNegInfRaw(raw))return 80;return modeY(mode)};
  const nodes=[];
  for(let i=0;i<n;i++){const v=d.vars[i]||{};if(v.discontinuity)nodes.push({kind:'break',left:{x:nodeX[i]-4.2,y:rawY(v.leftRaw,v.leftMode),raw:v.leftRaw},right:{x:nodeX[i]+4.2,y:rawY(v.rightRaw,v.rightMode),raw:v.rightRaw}});else nodes.push({kind:'normal',pt:{x:nodeX[i],y:rawY(v.rawValue,v.mode),raw:v.rawValue}})}
  const startPt=node=>node?.kind==='break'?node.right:node?.pt,endPt=node=>node?.kind==='break'?node.left:node?.pt;
  const ptPad=pt=>{const raw=tkzPlainMath(pt?.raw||'');const len=Math.max(1,raw.length);return Math.max(4.6,Math.min(8.2,4.2+(len-1)*0.45))};
  let hash=0;for(const c of String(tex||''))hash=(hash*31+c.charCodeAt(0))>>>0;const marker=`tkza${hash}`;
  const arrows=[];for(let i=0;i<n-1;i++){const a=startPt(nodes[i]),b=endPt(nodes[i+1]);if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,padA=ptPad(a),padB=ptPad(b)+0.8;arrows.push(`<line x1="${a.x+ux*padA}" y1="${a.y+uy*padA}" x2="${b.x-ux*padB}" y2="${b.y-uy*padB}" class="tkztab-trend" marker-end="url(#${marker})"/>`)}
  const rowLabel=(raw,fallback)=>`<div class="tkztab-label">${tkzMathCell(raw||fallback)}</div>`;
  const xNodes=nodeX.map((x,i)=>`<span class="tkztab-node" style="left:${x}%">${tkzMathCell(d.xsRaw?.[i]||d.xs[i]||'')}</span>`).join('');
  const xExtras=(d.vals||[]).map(v=>{let a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),r=Number.isFinite(v.pos)?Math.max(0,Math.min(1,v.pos)):.5,x=nodeX[a]+(nodeX[b]-nodeX[a])*r;return `<span class="tkztab-extra tkztab-node" style="left:${x}%">${tkzMathCell(v.xRaw)}</span>`}).join('');
  let dMarks='';for(let i=0;i<n;i++){const b=(d.boundary[i]||'').trim();if(b.includes('d'))dMarks+=`<span class="tkztab-break derivative-only" style="left:${nodeX[i]}%"></span>`;else if(b==='0'||b.includes('z'))dMarks+=`<span class="tkztab-sign" style="left:${nodeX[i]}%">${tkzMathCell('0')}</span>`;else if(b)dMarks+=`<span class="tkztab-sign" style="left:${nodeX[i]}%">${tkzMathCell(b)}</span>`;if(i<n-1){const mid=(nodeX[i]+nodeX[i+1])/2,s=(d.interval[i]||'').trim(),sign=s.includes('+')?'+':s.includes('-')?'-':s.includes('0')?'0':s;dMarks+=`<span class="tkztab-sign" style="left:${mid}%">${tkzMathCell(sign)}</span>`}}
  let yMarks='';nodes.forEach((node,i)=>{if(node.kind==='break'){yMarks+=`<span class="tkztab-break" style="left:${nodeX[i]}%"></span>`;yMarks+=`<span class="tkztab-value" style="left:${node.left.x}%;top:${node.left.y}%">${tkzMathCell(node.left.raw)}</span><span class="tkztab-value" style="left:${node.right.x}%;top:${node.right.y}%">${tkzMathCell(node.right.raw)}</span>`}else if(node.pt?.raw)yMarks+=`<span class="tkztab-value" style="left:${node.pt.x}%;top:${node.pt.y}%">${tkzMathCell(node.pt.raw)}</span>`});
  const valExtras=(d.vals||[]).map(v=>{let a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),r=Number.isFinite(v.pos)?Math.max(0,Math.min(1,v.pos)):.5,x=nodeX[a]+(nodeX[b]-nodeX[a])*r,pa=endPt(nodes[a]),pb=startPt(nodes[b]),y=pa&&pb?pa.y+(pb.y-pa.y)*r:50;return `<span class="tkztab-extra tkztab-value" style="left:${x}%;top:${y}%">${tkzMathCell(v.yRaw)}</span>`}).join('');
  const imaExtras=(d.imas||[]).map(v=>{let a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),x=(nodeX[a]+nodeX[b])/2;return `<span class="tkztab-extra tkztab-value" style="left:${x}%;top:50%">${tkzMathCell(v.valueRaw)}</span>`}).join('');
  const warn=d.unsupported?.length?`<div class="tkztab-validation">Chưa dựng trực tiếp: ${d.unsupported.map(x=>'\\'+x).join(', ')}. Mã gốc vẫn được giữ để chỉnh sửa.</div>`:'';
  return `<div class="tkztab-scroll"><div class="tkztab-native math-rich"><div class="tkztab-row tkztab-x">${rowLabel(d.rows[0],'$x$')}<div class="tkztab-data">${xNodes}${xExtras}</div></div><div class="tkztab-row tkztab-d">${rowLabel(d.rows[1],"$y'$")}<div class="tkztab-data">${dMarks}</div></div><div class="tkztab-row tkztab-y">${rowLabel(d.rows[2],'$y$')}<div class="tkztab-data"><svg class="tkztab-arrows" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><marker id="${marker}" markerWidth="4" markerHeight="4" refX="3.4" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#111"/></marker></defs>${arrows.join('')}</svg>${yMarks}${valExtras}${imaExtras}</div></div></div></div>${warn}`;
}
function questionFigureHTML(item={},compact=false){
  const mode=item.figureMode||((item.figureLatex||'').trim()?'tikz':'none');
  const figure=(mode==='tikz'||mode==='tkz')?normalizeTikzFigure(item.figureLatex||''):String(item.figureLatex||'').trim();if(!figure||mode==='none')return '';
  const caption=item.figureCaption?`<div class="latex-figure-caption">${mathHTML(item.figureCaption)}</div>`:'';const summary=mode==='tkztab'?'Mã tkz-tab gốc':mode==='graph2d'?'Cấu hình đồ thị':mode==='oxyz'?'Cấu hình Oxyz':'Mã hình LaTeX/TikZ';
  const visual=mode==='tkztab'?tkzTabNativeHTML(figure):`<iframe class="latex-figure-frame ${compact?'compact':''}" loading="lazy" sandbox="allow-scripts allow-same-origin" srcdoc="${attrEsc(figureSrcdocByMode(mode,figure))}"></iframe>`;
  return `<div class="latex-figure ${compact?'compact':''} ${mode==='tkztab'?'tkztab':''}">${visual}${caption}<details class="latex-figure-code"><summary>${summary}</summary><pre>${esc(figure)}</pre></details></div>`;
}
function buildQuestionPreviewHTML(x,{showAnswer=false,showExplanation=false}={}){
  const meta=`<div class="quiz-meta"><span class="pill">${esc(x.knowledgeCode||'')}</span>${x.level?`<span class="level-badge ${levelClass(x.level)}">${levelName(x.level)}</span>`:''}${x.type?`<span class="type-badge">${questionTypeName(x.type)}</span>`:''}${x.figureLatex?`<span class="bank-tag-figure">${figureModeTag(x.figureMode||'tikz')}</span>`:''}</div>`;
  const question=`<h4>${mathHTML(x.question||'')}</h4>`;const figure=questionFigureHTML(x,true);
  let body='';
  if(x.type==='mcq')body=`<ol type="A">${(x.options||[]).map(o=>`<li style="margin:7px 0">${mathHTML(o)}</li>`).join('')}</ol>`;
  else if(x.type==='tf4')body=`<div class="tf-grid">${(x.statements||[]).map((it,j)=>`<div><b>${String.fromCharCode(97+j)})</b> ${mathHTML(it.text||it[0]||'')}</div><div>${showAnswer?((it.answer??it[1])?'✓ Đúng':'✗ Sai'):''}</div><div></div>${showExplanation&&it.explanation?`<div class="tf-preview-explanation"><b>Lời giải ${String.fromCharCode(97+j)}):</b> ${mathHTML(it.explanation)}</div>`:''}`).join('')}</div>`;
  else if(x.type==='tf')body=`<div class="notice">Loại câu Đúng/Sai • Học sinh chọn một trong hai đáp án.</div>`;
  else body=`<div class="notice">Loại câu trả lời ngắn • Học sinh nhập đáp án vào ô trả lời.</div>`;
  let content=`${question}${body}`;if(figure){if(x.figureLayout==='right')content=`<div class="preview-immini"><div>${content}</div><div>${figure}</div></div>`;else if(x.figureLayout==='left')content=`<div class="preview-immini left"><div>${figure}</div><div>${content}</div></div>`;else content=`${question}${figure}${body}`}
  let tail='';if(showAnswer){const answer=x.type==='mcq'?(Number.isInteger(x.answer)&&x.answer>=0?`${String.fromCharCode(65+x.answer)}. ${x.options?.[x.answer]||''}`:'Chưa xác định'):x.type==='tf4'?(x.statements||[]).map((it,j)=>`${String.fromCharCode(97+j)}) ${(it.answer??it[1])?'Đúng':'Sai'}`).join(' • '):x.type==='tf'?(x.answer?'Đúng':'Sai'):(x.answer??'');tail+=`<div class="notice"><b>Đáp án:</b> ${mathHTML(answer)}</div>`}
  if(showExplanation&&x.explanation)tail+=`<div class="notice"><b>Giải thích:</b> ${mathHTML(x.explanation)}</div>`;
  return `<div class="quiz-q">${meta}${content}${tail}</div>`;
}
function readQuestionEditorDraft(){
  const type=document.getElementById('qeType')?.value||'mcq';
  const rawQuestion=document.getElementById('qeQuestion')?.value||'';
  const extracted=extractTikzFromText(rawQuestion);
  const mode=document.getElementById('qeFigureMode')?.value||'none';
  return {
    lessonId:document.getElementById('qeLesson')?.value||'',
    knowledgeCode:document.getElementById('qeKnowledge')?.value||'',
    level:document.getElementById('qeLevel')?.value||'NB',
    type,
    form:document.getElementById('qeForm')?.value.trim()||'',
    question:(extracted.text||rawQuestion).trim(),
    options:(document.getElementById('qeOptions')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean),
    statements:type==='tf4'?(()=>{let ex=(document.getElementById('qeTF4Explanations')?.value||'').split('\n');return (document.getElementById('qeTF4Statements')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean).map((s,i)=>({text:s.replace(/\\True\b/g,'').trim(),answer:/\\True\b/.test(s),explanation:(ex[i]||'').trim()}))})():[],
    answer:document.getElementById('qeAnswer')?.value.trim()||'',
    explanation:document.getElementById('qeExplanation')?.value.trim()||'',
    figureMode:mode,
    figureLatex:(mode==='tikz'||mode==='tkz')?(document.getElementById('qeFigureLatex')?.value.trim()||extracted.figure||''):(mode!=='none'?(document.getElementById('qeFigureLatex')?.value.trim()||''):''),
    figureCaption:document.getElementById('qeFigureCaption')?.value.trim()||'',
    figureLayout:document.getElementById('qeFigureLayout')?.value||'below'
  };
}
function updateQuestionEditorPreview(){
  const box=document.getElementById('qePreview');
  if(!box)return;
  const draft=readQuestionEditorDraft();
  box.innerHTML=`<div class="preview-title">Xem trước câu hỏi</div>${buildQuestionPreviewHTML(draft,{showExplanation:!!draft.explanation})}`;
  typesetMath(box);
}
function bindQuestionEditorPreview(){
  ['qeLesson','qeKnowledge','qeLevel','qeType','qeForm','qeQuestion','qeOptions','qeTF4Statements','qeTF4Explanations','qeAnswer','qeExplanation','qeFigureMode','qeFigureLayout','qeFigureLatex','qeFigureCaption'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;el.addEventListener('input',updateQuestionEditorPreview);el.addEventListener('change',()=>{if(id==='qeType')toggleQuestionEditorFields();if(id==='qeFigureMode')toggleQuestionFigureFields();updateQuestionEditorPreview();});
  });
}
function toggleQuestionFigureFields(){
  const mode=document.getElementById('qeFigureMode')?.value||'none',wrap=document.getElementById('qeFigureWrap'),lab=document.getElementById('qeFigureLabel'),hint=document.getElementById('qeFigureHint');if(wrap)wrap.classList.toggle('hidden',mode==='none');if(!wrap)return;
  if(lab)lab.textContent=mode==='tkztab'?'Mã bảng biến thiên tkz-tab':mode==='graph2d'?'Cấu hình đồ thị hàm số':mode==='oxyz'?'Cấu hình hình Oxyz':'Mã hình LaTeX/TikZ';
  if(hint)hint.innerHTML=mode==='tkztab'?'<b>Bảng biến thiên:</b> hỗ trợ trực tiếp <code>\\tkzTabInit</code>, <code>\\tkzTabLine</code>, <code>\\tkzTabVar</code>; website tự dựng lại bảng, không cần tkz-tab trên máy học sinh.':mode==='graph2d'?'<b>Đồ thị 2D:</b> dùng functions, xMin, xMax, yMin, yMax.':mode==='oxyz'?'<b>Oxyz:</b> dùng points, segments, dashed, polygons.':mode==='tkz'?'<b>tkz-euclide:</b> lưu mã tkz/TikZ; mẫu xem trước ưu tiên TikZ thuần.':'<b>TikZ:</b> dán trực tiếp môi trường tikzpicture.';
}
function refreshBankFilterOptions(force=false){
  const ch=document.getElementById('bankChapter'),ls=document.getElementById('bankLesson'),kn=document.getElementById('bankKnowledge');if(!ch||!ls||!kn)return;
  if(force||ch.options.length<=1){let val=ch.value;ch.innerHTML='<option value="">Tất cả chương</option>'+chapters.map(c=>`<option value="${c.id}">Chương ${c.id}</option>`).join('');ch.value=val;}
  let cid=Number(ch.value)||0,lessons=(cid?chapters.filter(c=>c.id===cid):chapters).flatMap(c=>c.lessons);let lv=ls.value;ls.innerHTML='<option value="">Tất cả bài</option>'+lessons.map(l=>`<option value="${l.id}">${l.id} • ${esc(l.common)}</option>`).join('');if(lessons.some(l=>l.id===lv))ls.value=lv;
  let lessonId=ls.value,codes=allKnowledgeCodes().filter(k=>(!cid||k.chapterId===cid)&&(!lessonId||k.lessonId===lessonId));let kv=kn.value;kn.innerHTML='<option value="">Tất cả mã kiến thức</option>'+codes.map(k=>`<option value="${k.code}">${k.code} • ${esc(k.title)}</option>`).join('');if(codes.some(k=>k.code===kv))kn.value=kv;
}
function renderQuestionBank(forceOptions=false){if(!requireTeacher('Ngân hàng câu hỏi'))return;
  if(!document.getElementById('questionBankTable'))return;refreshBankFilterOptions(forceOptions);
  const q=(document.getElementById('bankSearch')?.value||'').trim().toLowerCase(),cid=Number(document.getElementById('bankChapter')?.value)||0,lid=document.getElementById('bankLesson')?.value||'',kid=document.getElementById('bankKnowledge')?.value||'',lev=document.getElementById('bankLevel')?.value||'',typ=document.getElementById('bankType')?.value||'';
  const filtered=state.questionBank.filter(x=>(!cid||x.chapterId===cid)&&(!lid||x.lessonId===lid)&&(!kid||x.knowledgeCode===kid)&&(!lev||x.level===lev)&&(!typ||x.type===typ)&&(!q||[x.id,x.id6||'',x.id6Pattern||'',x.question,x.explanation,x.knowledgeCode,x.form,x.figureLatex||'',x.figureCaption||''].join(' ').toLowerCase().includes(q)));
  const codes=allKnowledgeCodes(),covered=new Set(state.questionBank.map(x=>x.knowledgeCode)),lessonCovered=new Set(state.questionBank.map(x=>x.lessonId));
  document.getElementById('bankTotal').textContent=state.questionBank.length;document.getElementById('bankCoverage').textContent=Math.round(covered.size/codes.length*100)+'%';document.getElementById('bankLessons').textContent=lessonCovered.size+'/'+TOTAL;document.getElementById('bankCustom').textContent=state.questionBank.filter(x=>x.source!=='seed').length;document.getElementById('bankResultCount').textContent=filtered.length+' câu';
  document.getElementById('questionBankTable').innerHTML=filtered.map(x=>{let l=getLesson(x.lessonId);return `<tr><td><b>${esc(x.id)}</b><br><small style="color:var(--muted)">${esc(x.lessonId)}</small></td><td class="bank-question"><b>${mathHTML(x.question)}</b>${x.figureLatex?`<div class="bank-tag-figure">${figureModeTag(x.figureMode||'tikz')}</div>`:''}<small>${l?esc(l.common):''}${x.form?' • '+esc(x.form):''}</small></td><td><span class="pill">${esc(x.knowledgeCode)}</span></td><td><span class="level-badge ${levelClass(x.level)}">${levelName(x.level)}</span></td><td><span class="type-badge">${questionTypeName(x.type)}</span></td><td><div class="bank-actions"><button class="btn btn-soft" onclick="previewBankQuestion('${x.id}')">Xem</button><button class="btn btn-soft" onclick="openQuestionEditor('${x.id}')">Sửa</button><button class="btn btn-danger" onclick="deleteBankQuestion('${x.id}')">Xóa</button></div></td></tr>`}).join('')||'<tr><td colspan="6"><div class="bank-empty">Không có câu hỏi phù hợp bộ lọc.</div></td></tr>';
  document.getElementById('bankCoverageCodes').innerHTML=codes.map(k=>`<span class="pill ${covered.has(k.code)?'tag-green':'missing'}" title="${attrEsc(k.title)}">${k.code}</span>`).join('');if(document.getElementById('page-question-bank')?.classList.contains('active'))typesetMath(document.getElementById('page-question-bank'));
}
function bankEditorLessonOptions(selected=''){return chapters.flatMap(c=>c.lessons.map(l=>`<option value="${l.id}" ${l.id===selected?'selected':''}>${l.id} • ${esc(l.common)}</option>`)).join('')}
function bankEditorKnowledgeOptions(lessonId,selected=''){return getLessonMeta(lessonId).knowledge.map(k=>`<option value="${k.code}" ${k.code===selected?'selected':''}>${k.code} • ${esc(k.title)}</option>`).join('')}

let bulkLatexParsed=[];
function readBalancedGroup(src,start){
  if(src[start]!=='{')return null;let depth=0,escaped=false;
  for(let i=start;i<src.length;i++){const ch=src[i];if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0)return {content:src.slice(start+1,i),start,end:i+1}}}return null;
}
function commandGroup(src,cmd,from=0){const marker='\\'+cmd;let pos=src.indexOf(marker,from);if(pos<0)return null;let i=pos+marker.length;while(/\s/.test(src[i]||''))i++;if(src[i]==='['){let close=src.indexOf(']',i+1);if(close<0)return null;i=close+1;while(/\s/.test(src[i]||''))i++}const g=readBalancedGroup(src,i);return g?{...g,commandStart:pos}:null}
function choiceGroups(src,cmd){const marker='\\'+cmd;let pos=src.indexOf(marker);while(pos>=0&&/[A-Za-z]/.test(src[pos+marker.length]||''))pos=src.indexOf(marker,pos+marker.length);if(pos<0)return null;let i=pos+marker.length,groups=[];while(/\s/.test(src[i]||''))i++;while(src[i]==='{'){const g=readBalancedGroup(src,i);if(!g)break;groups.push(g.content);i=g.end;while(/\s/.test(src[i]||''))i++;if(groups.length>=8)break}return {commandStart:pos,end:i,groups}}
function commandGroupsN(src,cmd,count=2){
  const marker='\\'+cmd;let pos=src.indexOf(marker);
  while(pos>=0&&/[A-Za-z]/.test(src[pos+marker.length]||''))pos=src.indexOf(marker,pos+marker.length);
  if(pos<0)return null;let i=pos+marker.length,groups=[];while(/\s/.test(src[i]||''))i++;
  for(let n=0;n<count;n++){if(src[i]!=='{')return null;const g=readBalancedGroup(src,i);if(!g)return null;groups.push(g.content);i=g.end;while(/\s/.test(src[i]||''))i++}
  return {commandStart:pos,end:i,groups};
}
function extractImminiBlock(src=''){
  const a=commandGroupsN(src,'immini',2),b=commandGroupsN(src,'imminiL',2);let hit=null,layout='right',macro='';
  if(a&&(!b||a.commandStart<b.commandStart)){hit=a;layout='right';macro='immini'}else if(b){hit=b;layout='left';macro='imminiL'}
  return hit?{...hit,content:hit.groups[0],figureSource:hit.groups[1],layout,macro}:null;
}
function parseItemChoiceExplanations(src=''){
  const m=String(src||'').match(/\\begin\{itemchoice\}([\s\S]*?)\\end\{itemchoice\}/);if(!m)return [];
  return m[1].split(/\\itemch\b/).slice(1).map(x=>cleanLatexImportedText(x)).filter(Boolean);
}
function cleanSolutionImportedText(src=''){
  return cleanLatexImportedText(String(src||'').replace(/\\begin\{itemchoice\}[\s\S]*?\\end\{itemchoice\}/g,'').replace(/\\itemch\b/g,''));
}
function latexMeta(block){const meta={};block.replace(/^\s*%\s*(id|id6|lesson|knowledge|level|form|source|year|tags|status|difficulty)\s*[:=]\s*(.+?)\s*$/gim,(_,k,v)=>{meta[k.toLowerCase()]=v.trim();return _});return meta}
function stripImportMeta(block){return block.replace(/^\s*%\s*(id|id6|lesson|knowledge|level|form|source|year|tags|status|difficulty)\s*[:=].*$/gim,'').trim()}
function cleanLatexImportedText(s=''){return String(s||'').replace(/\\True\b/g,'').replace(/\\begin\{(?:center|flushleft|flushright)\}|\\end\{(?:center|flushleft|flushright)\}/g,'').replace(/\\(?:noindent|par)\b/g,'').replace(/^\s*%.*$/gm,'').replace(/\n{3,}/g,'\n\n').trim()}
function latexStructuralIssues(src=''){
  const s=String(src||'').replace(/(^|[^\\])%.*$/gm,'$1'),errors=[],warnings=[];
  let brace=0,escaped=false;for(let i=0;i<s.length;i++){const ch=s[i];if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch==='{')brace++;else if(ch==='}'){brace--;if(brace<0){errors.push('Có dấu } đóng nhưng không có { tương ứng.');brace=0}}}if(brace!==0)errors.push(`Ngoặc nhọn LaTeX chưa cân bằng (${brace>0?'thiếu }':'thừa }'}).`);
  let dollars=0;escaped=false;for(let i=0;i<s.length;i++){const ch=s[i];if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch==='$')dollars++}if(dollars%2)errors.push('Có dấu $ mở/đóng công thức chưa cân bằng.');
  const pairs=[['\\(','\\)'],['\\[','\\]']];pairs.forEach(([a,b])=>{const ca=(s.match(new RegExp(a.replace(/[\\()[\]{}.*+?^$|]/g,'\\$&'),'g'))||[]).length,cb=(s.match(new RegExp(b.replace(/[\\()[\]{}.*+?^$|]/g,'\\$&'),'g'))||[]).length;if(ca!==cb)errors.push(`Cặp ${a} ... ${b} chưa cân bằng.`)});
  const envRe=/\\(begin|end)\{([^{}]+)\}/g,stack=[];let m;while((m=envRe.exec(s))){if(m[1]==='begin')stack.push(m[2]);else{const top=stack.pop();if(top!==m[2]){errors.push(`Môi trường LaTeX không khớp: gặp \\end{${m[2]}} khi đang ở ${top?`\\begin{${top}}`:'ngoài môi trường'}.`);break}}}if(stack.length)errors.push(`Chưa đóng môi trường: ${stack.map(x=>`\\begin{${x}}`).join(', ')}.`);
  if(/\\(?:imminiR|imminiT)\b/.test(s))warnings.push('Phát hiện biến thể immini chưa được tối ưu; nên kiểm tra bố cục hình trong xem trước.');
  return {errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
function validateTkzTabFigureData(tex=''){
  const errors=[],warnings=[],d=parseTkzTabFigure(tex);if(!d.ok)return {errors:[d.error||'Không đọc được tkz-tab.'],warnings};
  const n=d.xsRaw?.length||d.xs.length;if(n<2)errors.push('tkzTabInit cần ít nhất 2 mốc trên hàng x.');
  if(d.rawLine?.length&&d.rawLine.length!==2*n-1)warnings.push(`tkzTabLine có ${d.rawLine.length} phần tử; thông thường với ${n} mốc cần ${2*n-1} phần tử.`);
  if(d.vars?.length&&d.vars.length!==n)errors.push(`tkzTabVar có ${d.vars.length} trạng thái nhưng hàng x có ${n} mốc.`);
  d.vars?.forEach((v,i)=>{if(v.discontinuity&&(!tkzMathRaw(v.leftRaw)||!tkzMathRaw(v.rightRaw)))errors.push(`Điểm D thứ ${i+1} cần đủ hai giá trị giới hạn trái/phải.`)});
  d.vals?.forEach((v,i)=>{if(!Number.isFinite(v.from)||!Number.isFinite(v.to)||!Number.isFinite(v.pos))warnings.push(`tkzTabVal thứ ${i+1} có chỉ số/vị trí chưa đọc được.`)});
  d.imas?.forEach((v,i)=>{if(!Number.isFinite(v.from)||!Number.isFinite(v.to))warnings.push(`tkzTabIma thứ ${i+1} có chỉ số chưa đọc được.`)});
  if(d.unsupported?.length)warnings.push(`Có lệnh mở rộng chưa dựng trực tiếp: ${d.unsupported.map(x=>'\\'+x).join(', ')}.`);
  return {errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
function validateQuestionLatexItem(item={}){
  const errors=[],warnings=[],fields=[['Nội dung',item.question],['Lời giải',item.explanation]];
  (item.options||[]).forEach((v,i)=>fields.push([`Phương án ${String.fromCharCode(65+i)}`,v]));(item.statements||[]).forEach((v,i)=>{fields.push([`Ý ${String.fromCharCode(97+i)}`,v.text]);fields.push([`Lời giải ý ${String.fromCharCode(97+i)}`,v.explanation])});
  fields.forEach(([name,val])=>{if(!val)return;const r=latexStructuralIssues(val);r.errors.forEach(e=>errors.push(`${name}: ${e}`));r.warnings.forEach(e=>warnings.push(`${name}: ${e}`))});
  if(item.figureMode==='tkztab'&&item.figureLatex){const r=validateTkzTabFigureData(item.figureLatex);errors.push(...r.errors.map(e=>'Bảng biến thiên: '+e));warnings.push(...r.warnings.map(e=>'Bảng biến thiên: '+e))}
  return {errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
function importFigureFromSource(src=''){
  const out=extractTikzFromText(src);if(out.figure)return out;
  if(/\\tkzTab(?:Init|Line|Var|Val|Ima)\b/.test(src))return {text:String(src||'').replace(/\\tkzTab(?:Init|Line|Var|Val|Ima)[\s\S]*/,'').trim(),figure:String(src||'').trim()};
  return out;
}
function parseLatexExBlock(raw,index,defaults){
  const meta=latexMeta(raw);let block=stripImportMeta(raw),warnings=[],errors=[];
  const structure=latexStructuralIssues(block);warnings.push(...structure.warnings);errors.push(...structure.errors);
  const solution=commandGroup(block,'loigiai'),dapso=commandGroup(block,'dapso'),immini=extractImminiBlock(block);
  const questionBlock=immini?immini.content:block;
  const mcq=choiceGroups(questionBlock,'choice'),tf4=choiceGroups(questionBlock,'choiceTF')||choiceGroups(questionBlock,'choiceTFt')||choiceGroups(questionBlock,'choiceTFn'),short=commandGroup(questionBlock,'shortans');
  const itemExplanations=solution?parseItemChoiceExplanations(solution.content):[];
  let explanation=solution?cleanSolutionImportedText(solution.content):'';
  let first=[mcq?.commandStart,tf4?.commandStart,short?.commandStart].filter(x=>Number.isFinite(x));
  let stem=cleanLatexImportedText(questionBlock.slice(0,first.length?Math.min(...first):questionBlock.length));
  let fig={text:'',figure:''};
  if(immini){fig=importFigureFromSource(immini.figureSource);if(!fig.figure)warnings.push(`Đã nhận ${immini.macro} nhưng chưa tìm thấy hình TikZ/tkz-tab trong đối số hình.`)}
  else{fig=importFigureFromSource(stem);stem=cleanLatexImportedText(fig.text)}
  if(fig.figure&&detectFigureMode(fig.figure,'tikz')==='tkztab'){const tv=validateTkzTabFigureData(fig.figure);warnings.push(...tv.warnings);errors.push(...tv.errors)}
  let lessonId=meta.lesson&&getLesson(meta.lesson)?meta.lesson:defaults.lessonId;if(meta.lesson&&!getLesson(meta.lesson))warnings.push(`Mã bài ${meta.lesson} không tồn tại, dùng bài mặc định.`);
  let km=getLessonMeta(lessonId).knowledge||[];let knowledgeCode=meta.knowledge&&km.some(k=>k.code===meta.knowledge)?meta.knowledge:(defaults.knowledgeCode&&km.some(k=>k.code===defaults.knowledgeCode)?defaults.knowledgeCode:km[0]?.code||'');if(meta.knowledge&&!km.some(k=>k.code===meta.knowledge))warnings.push(`Mã kiến thức ${meta.knowledge} không thuộc bài ${lessonId}, dùng mã mặc định.`);
  let id6Level=meta.id6?({N:'NB',H:'TH',V:'VD',C:'VDC'}[String(meta.id6).charAt(3).toUpperCase()]||''):'';let level=(meta.level||id6Level||defaults.level||km.find(k=>k.code===knowledgeCode)?.level||'NB').toUpperCase();if(!['NB','TH','VD','VDC'].includes(level)){warnings.push(`Mức độ ${level} không hợp lệ, chuyển về NB.`);level='NB'}const lesson=getLesson(lessonId);
  let item={id:meta.id||`LATEX-${Date.now().toString(36).toUpperCase()}-${String(index+1).padStart(2,'0')}`,chapterId:lesson?.chapter.id||1,lessonId,knowledgeCode,form:meta.form||defaults.form||'',id6:meta.id6||'',level,question:stem,explanation,figureMode:fig.figure?detectFigureMode(fig.figure,'tikz'):'none',figureLatex:fig.figure||'',figureCaption:'',figureLayout:immini?.layout||'below',source:'latex-import',sourceName:meta.source||'Import LaTeX',sourceYear:String(meta.year||'').replace(/[^0-9]/g,'').slice(0,4),tags:String(meta.tags||'').split(/[,;]/).map(x=>x.trim()).filter(Boolean).slice(0,12),reviewStatus:/^(reviewed|duyet|đã duyệt|da duyet)$/i.test(meta.status||'')?'reviewed':'draft',difficulty:Math.min(5,Math.max(1,Number(meta.difficulty)||({NB:2,TH:3,VD:4,VDC:5}[level]||3)))};
  if(mcq){item.type='mcq';item.options=mcq.groups.map(cleanLatexImportedText);let trueIndex=mcq.groups.findIndex(g=>/\\True\b/.test(g));if(trueIndex<0&&dapso){let a='ABCD'.indexOf(dapso.content.trim().toUpperCase());if(a>=0)trueIndex=a}if(item.options.length<2)errors.push('Câu nhiều lựa chọn chưa đủ phương án.');if(item.options.length!==4)warnings.push(`Câu nhiều lựa chọn có ${item.options.length} phương án; đề THPT thường dùng 4 phương án.`);if(trueIndex<0){errors.push('Chưa tìm thấy đáp án đúng (\\True hoặc \\dapso).');item.answer=null}else item.answer=trueIndex}
  else if(tf4){item.type='tf4';item.statements=tf4.groups.map((g,i)=>({text:cleanLatexImportedText(g),answer:/\\True\b/.test(g),explanation:itemExplanations[i]||''}));if(item.statements.length!==4)errors.push(`Câu Đúng/Sai có ${item.statements.length} ý; cần đúng 4 ý.`);if(itemExplanations.length&&itemExplanations.length!==item.statements.length)warnings.push(`Lời giải itemchoice có ${itemExplanations.length} ý, khác số mệnh đề ${item.statements.length}.`)}
  else if(short){item.type='short';item.answer=cleanLatexImportedText(short.content);if(!item.answer)errors.push('Chưa có đáp án trong \\shortans{...}.')}
  else{errors.push('Không nhận diện được \\choice, \\choiceTF hoặc \\shortans.');item.type='short';item.answer=''}
  if(!stem)errors.push('Không tìm thấy nội dung câu hỏi.');
  warnings=[...new Set(warnings)];errors=[...new Set(errors)];return {item,warnings,errors,valid:errors.length===0};
}
function parseBulkLatexSource(source,defaults){
  const blocks=[],globalErrors=[],src=String(source||'');const beginCount=(src.match(/\\begin\{ex\}/g)||[]).length,endCount=(src.match(/\\end\{ex\}/g)||[]).length;if(beginCount!==endCount)globalErrors.push(`Số \\begin{ex} (${beginCount}) và \\end{ex} (${endCount}) không bằng nhau.`);
  const re=/((?:[ \t]*%[^\n]*\n)*)[ \t]*\\begin\{ex\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{ex\}/g;let m;while((m=re.exec(src)))blocks.push((m[1]||'')+(m[2]||''));if(!blocks.length)globalErrors.push('Không tìm thấy môi trường \\begin{ex} ... \\end{ex}.');
  const items=blocks.map((b,i)=>parseLatexExBlock(b,i,defaults)),seen=new Map();items.forEach((r,i)=>{const id=r.item.id;if(seen.has(id)){r.errors.push(`Mã câu ${id} bị trùng trong chính đợt import (câu ${seen.get(id)+1} và ${i+1}).`);r.valid=false}else seen.set(id,i)});
  return {items,globalErrors:[...new Set(globalErrors)]};
}
function updateBulkKnowledge(){const lid=document.getElementById('bulkLesson')?.value;if(!lid)return;const el=document.getElementById('bulkKnowledge');if(el)el.innerHTML=bankEditorKnowledgeOptions(lid)}

async function loadBulkTexFiles(fileList){
  const files=Array.from(fileList||[]).filter(f=>/\.(tex|txt|latex)$/i.test(f.name)||/text\//i.test(f.type||''));
  if(!files.length){alert('Hãy chọn file .tex hoặc .txt.');return}
  const status=document.getElementById('bulkFileStatus'),box=document.getElementById('bulkLatexSource'),preview=document.getElementById('bulkImportPreview'),commit=document.getElementById('bulkCommitBtn');
  try{
    const parts=[];
    for(const f of files){
      const content=(await f.text()).replace(/^\uFEFF/,'');
      parts.push(`% ===== FILE: ${f.name} =====\n${content}`);
    }
    if(box)box.value=parts.join('\n\n');
    bulkLatexParsed=[];
    if(preview)preview.innerHTML='';
    if(commit)commit.disabled=true;
    if(status)status.innerHTML=`<span class="pill tag-green">Đã đọc ${files.length} file</span> <span class="pill">${files.reduce((n,f)=>n+f.size,0).toLocaleString('vi-VN')} bytes</span> <small style="color:var(--muted)">${files.map(f=>esc(f.name)).join(' • ')}</small>`;
    const importStatus=document.getElementById('bulkImportStatus');if(importStatus)importStatus.innerHTML='<div class="notice">File đã được nạp. Bấm <b>Phân tích & xem trước</b> trước khi nhập vào ngân hàng.</div>';
  }catch(err){
    if(status)status.innerHTML=`<div class="bulk-errors">Không đọc được file: ${esc(err?.message||String(err))}</div>`;
  }
}
function setupBulkTexDropZone(){
  const zone=document.getElementById('bulkTexDropZone');if(!zone)return;
  ['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('drag')}));
  zone.addEventListener('drop',e=>loadBulkTexFiles(e.dataTransfer?.files));
}
function latexCompatibilityTestCases(){
  const ex=s=>`\\begin{ex}\n${s}\n\\end{ex}`;const cases=[];
  for(let i=0;i<6;i++)cases.push({name:`MCQ \\True ${i+1}`,src:ex(`Cho $x=${i+1}$. Chọn đáp án đúng.\\n\\choice{\\True $${i+1}$}{$0$}{$2$}{$3$}`),valid:true,type:'mcq'});
  cases.push({name:'MCQ dapso',src:ex('Tính $1+1$.\\n\\choice{$1$}{$2$}{$3$}{$4$}\\n\\dapso{B}'),valid:true,type:'mcq'});
  cases.push({name:'MCQ phân số/căn',src:ex('Giá trị $\\dfrac{\\sqrt{4}}{2}$ là\\n\\choice{$0$}{\\True $1$}{$2$}{$4$}'),valid:true,type:'mcq'});
  for(let i=0;i<5;i++)cases.push({name:`choiceTF ${i+1}`,src:ex(`Cho hàm số $f(x)=x^2+${i}$.\\n\\choiceTF{\\True $f(0)=${i}$}{\\True $f'(x)=2x$}{$f$ nghịch biến trên $\\mathbb R$}{\\True $f(x)\\ge ${i}$}`),valid:true,type:'tf4'});
  cases.push({name:'choiceTFt + itemchoice',src:ex('Cho $f(x)=x^2$.\\n\\choiceTFt{\\True $f(0)=0$}{$f(1)=0$}{\\True $f(x)\\ge0$}{\\True $f\\prime(1)=2$}\\n\\loigiai{\\begin{itemchoice}\\itemch Đúng.\\itemch Sai.\\itemch Đúng.\\itemch Đúng.\\end{itemchoice}}'),valid:true,type:'tf4'});
  for(let i=0;i<5;i++)cases.push({name:`shortans ${i+1}`,src:ex(`Tính $${i}+1$.\\shortans{${i+1}}`),valid:true,type:'short'});
  cases.push({name:'immini TikZ',src:ex('\\immini{Cho tam giác $ABC$.\\choice{\\True $1$}{$2$}{$3$}{$4$}}{\\begin{tikzpicture}\\draw (0,0)--(1,0)--(0,1)--cycle;\\end{tikzpicture}}'),valid:true,type:'mcq',layout:'right'});
  cases.push({name:'imminiL TikZ',src:ex('\\imminiL{Chọn đáp án.\\choice{\\True $A$}{$B$}{$C$}{$D$}}{\\begin{tikzpicture}\\draw (0,0) circle (1);\\end{tikzpicture}}'),valid:true,type:'mcq',layout:'left'});
  cases.push({name:'tkz-tab thường',src:ex('Bảng biến thiên.\\begin{tikzpicture}\\tkzTabInit{$x$/1,$y\\prime$/1,$y$/2}{$-\\infty$,$0$,$+\\infty$}\\tkzTabLine{,+,0,-,}\\tkzTabVar{-/$-\\infty$,+/$2$,-/$-\\infty$}\\end{tikzpicture}\\choice{\\True $A$}{$B$}{$C$}{$D$}'),valid:true,type:'mcq',figure:'tkztab'});
  cases.push({name:'tkz-tab d',src:ex('Bảng.\\begin{tikzpicture}\\tkzTabInit{$x$/1,$y\\prime$/1,$y$/2}{$-\\infty$,$0$,$+\\infty$}\\tkzTabLine{,+,d,-,}\\tkzTabVar{-/$-1$,+/$\\sqrt{2}$,-/$-2$}\\end{tikzpicture}\\choice{\\True $A$}{$B$}{$C$}{$D$}'),valid:true,type:'mcq',figure:'tkztab'});
  cases.push({name:'tkz-tab D',src:ex('Bảng.\\begin{tikzpicture}\\tkzTabInit{$x$/1,$y\\prime$/1,$y$/2}{$-\\infty$,$2$,$+\\infty$}\\tkzTabLine{,-,d,-,}\\tkzTabVar{+/$2$,-D+/$-\\infty$/$+\\infty$,-/$2$}\\end{tikzpicture}\\choice{$A$}{\\True $B$}{$C$}{$D$}'),valid:true,type:'mcq',figure:'tkztab'});
  cases.push({name:'tkzTabVal',src:ex('Bảng.\\begin{tikzpicture}\\tkzTabInit{$x$/1,$y\\prime$/1,$y$/2}{$-\\infty$,$0$,$+\\infty$}\\tkzTabLine{,+,0,-,}\\tkzTabVar{-/$-\\infty$,+/$2$,-/$-\\infty$}\\tkzTabVal{1}{2}{0.5}{$-1$}{$0$}\\end{tikzpicture}\\choice{\\True $A$}{$B$}{$C$}{$D$}'),valid:true,type:'mcq',figure:'tkztab'});
  cases.push({name:'tkzTabIma',src:ex('Bảng.\\begin{tikzpicture}\\tkzTabInit{$x$/1,$y\\prime$/1,$y$/2}{$-\\infty$,$0$,$+\\infty$}\\tkzTabLine{,+,0,-,}\\tkzTabVar{-/$-\\infty$,+/$2$,-/$-\\infty$}\\tkzTabIma{1}{2}{1}{$1$}\\end{tikzpicture}\\choice{\\True $A$}{$B$}{$C$}{$D$}'),valid:true,type:'mcq',figure:'tkztab'});
  cases.push({name:'Thiếu đáp án',src:ex('Chọn đáp án.\\choice{$A$}{$B$}{$C$}{$D$}'),valid:false,type:'mcq'});
  cases.push({name:'Sai dấu $',src:ex('Cho $x=1. Chọn.\\choice{\\True $1$}{$2$}{$3$}{$4$}'),valid:false,type:'mcq'});
  cases.push({name:'Metadata câu',src:`% id: TEST-META\n% lesson: F1-01\n% knowledge: F1-01.K1\n% level: VD\n${ex('Cho $x=1$.\\choice{\\True $1$}{$2$}{$3$}{$4$}')}`,valid:true,type:'mcq'});
  cases.push({name:'shortans có tùy chọn',src:ex('Tính $2+3$.\\shortans[oly]{5}'),valid:true,type:'short'});
  cases.push({name:'tkz-tab phân số',src:ex('Bảng.\\begin{tikzpicture}\\tkzTabInit{$x$/1,$y\\prime$/1,$y$/2}{$-\\infty$,$0$,$+\\infty$}\\tkzTabLine{,+,0,-,}\\tkzTabVar{-/$-\\infty$,+/$\\dfrac{1}{2}$,-/$-\\infty$}\\end{tikzpicture}\\choice{\\True $A$}{$B$}{$C$}{$D$}'),valid:true,type:'mcq',figure:'tkztab'});
  cases.push({name:'choiceTF thiếu ý',src:ex('Cho $f(x)=x$.\\choiceTF{\\True A}{B}{C}'),valid:false,type:'tf4'});
  return cases;
}
function runLatexCompatibilityTests(){
  const lid=document.getElementById('bulkLesson')?.value||chapters[0].lessons[0].id,defaults={lessonId:lid,knowledgeCode:document.getElementById('bulkKnowledge')?.value||getLessonMeta(lid).knowledge[0].code,level:'TH',form:'Self-test'};const cases=latexCompatibilityTestCases();let passed=0,details=[];
  cases.forEach((tc,i)=>{const r=parseBulkLatexSource(tc.src,defaults),q=r.items[0],ok=!!q&&q.valid===tc.valid&&(!tc.type||q.item.type===tc.type)&&(!tc.layout||q.item.figureLayout===tc.layout)&&(!tc.figure||q.item.figureMode===tc.figure);if(ok)passed++;else details.push(`${i+1}. ${tc.name}`)});
  const el=document.getElementById('bulkImportStatus');if(el)el.innerHTML=`<div class="bulk-test-report"><b>Self-test LaTeX V22: ${passed}/${cases.length} ca đạt.</b>${details.length?`<br><span style="color:var(--bad)">Cần kiểm tra: ${esc(details.join(' • '))}</span>`:'<br><span style="color:var(--good)">Các luồng chuẩn choice, choiceTF, shortans, immini và tkz-tab đều đạt.</span>'}</div>`;return {passed,total:cases.length,failed:details};
}
function openBulkLatexImport(){if(!requireTeacher('Import LaTeX'))return;
  const lessonId=chapters[0].lessons[0].id,knowledgeCode=getLessonMeta(lessonId).knowledge[0].code;const sample=`% lesson: F1-01
% knowledge: F1-01.K2
% level: TH
\\begin{ex}
Cho hàm số $y=x^3-3x$. Hàm số đạt cực đại tại giá trị nào của $x$?
\\choice
{\\True $x=-1$}
{$x=1$}
{$x=0$}
{$x=2$}
\\loigiai{Ta có $y'=3x^2-3$.}
\\end{ex}

\\begin{ex}
Cho hàm số $y=x^3-3x+2$.
\\choiceTF
{\\True $y'=3x^2-3$}
{\\True $y'=0$ khi $x=-1,x=1$}
{$y'>0$ trên $(-1;1)$}
{\\True Hàm số có hai điểm cực trị}
\\end{ex}`;
  const body=`<div class="bulk-import-grid"><div class="field"><label>Bài mặc định</label><select id="bulkLesson" onchange="updateBulkKnowledge()">${bankEditorLessonOptions(lessonId)}</select></div><div class="field"><label>Mã kiến thức mặc định</label><select id="bulkKnowledge">${bankEditorKnowledgeOptions(lessonId,knowledgeCode)}</select></div><div class="field"><label>Mức độ mặc định</label><select id="bulkLevel"><option value="NB">Nhận biết</option><option value="TH" selected>Thông hiểu</option><option value="VD">Vận dụng</option><option value="VDC">Vận dụng cao</option></select></div><div class="field full"><label>Dạng toán mặc định (tùy chọn)</label><input id="bulkForm" placeholder="Ví dụ: Xét cực trị bằng đạo hàm"></div>
  <div class="field full"><label>Nhập trực tiếp từ file .tex</label><div class="file-drop-zone" id="bulkTexDropZone"><div><strong>Chọn hoặc kéo thả file .tex vào đây</strong><small>Hỗ trợ nhiều file cùng lúc • đọc UTF-8 • không làm thay đổi file gốc</small></div><div><input id="bulkTexFile" type="file" accept=".tex,.latex,.txt,text/plain" multiple hidden onchange="loadBulkTexFiles(this.files)"><button type="button" class="btn btn-soft" onclick="document.getElementById('bulkTexFile').click()">Chọn file .tex</button></div></div><div id="bulkFileStatus" style="margin-top:8px"></div></div>
  <div class="field full"><label>Mã LaTeX hàng loạt</label><textarea id="bulkLatexSource" class="bulk-source" spellcheck="false">${esc(sample)}</textarea><div class="math-help"><b>Hỗ trợ:</b> <code>\\choice</code>, <code>\\choiceTF</code>, <code>\\shortans{...}</code>, <code>\\loigiai{...}</code>, <code>\\dapso{...}</code>, <code>\\True</code> và TikZ. Metadata từng câu: <code>% id6:</code>, <code>% id:</code>, <code>% lesson:</code>, <code>% knowledge:</code>, <code>% level:</code>, <code>% form:</code>.</div></div><div class="field"><label>Xử lý mã câu bị trùng</label><select id="bulkDuplicate"><option value="rename">Tự đổi mã mới</option><option value="skip">Bỏ qua câu trùng</option><option value="replace">Ghi đè câu cũ</option></select></div><div class="field"><label>Chỉ nhập câu hợp lệ</label><select id="bulkValidOnly"><option value="yes">Có</option><option value="no">Không</option></select></div><div class="field full"><div class="bulk-import-actions"><button class="btn btn-blue" onclick="previewBulkLatexImport()">Phân tích & xem trước</button><button class="btn btn-soft" onclick="runLatexCompatibilityTests()">✓ Self-test V22</button><button class="btn btn-soft" onclick="document.getElementById('bulkLatexSource').value='';document.getElementById('bulkImportPreview').innerHTML='';bulkLatexParsed=[];document.getElementById('bulkCommitBtn').disabled=true">Xóa nội dung</button></div><div id="bulkImportStatus"></div><div id="bulkImportPreview" class="bulk-preview"></div></div></div>`;
  openModal('Import câu hỏi LaTeX hàng loạt','Chọn file .tex hoặc dán nhiều môi trường ex; hệ thống luôn cho xem trước trước khi nhập',body,`<button class="btn btn-soft" onclick="closeModal()">Đóng</button><button class="btn btn-blue" id="bulkCommitBtn" onclick="commitBulkLatexImport()" disabled>Nhập vào ngân hàng</button>`);
  setupBulkTexDropZone();
}
function previewBulkLatexImport(){if(!requireTeacher('Import LaTeX'))return;
  const source=document.getElementById('bulkLatexSource')?.value||'',defaults={lessonId:document.getElementById('bulkLesson').value,knowledgeCode:document.getElementById('bulkKnowledge').value,level:document.getElementById('bulkLevel').value,form:document.getElementById('bulkForm').value.trim()};
  const parsed=parseBulkLatexSource(source,defaults);bulkLatexParsed=parsed.items;const status=document.getElementById('bulkImportStatus'),preview=document.getElementById('bulkImportPreview'),btn=document.getElementById('bulkCommitBtn');
  if(parsed.globalErrors.length){status.innerHTML=`<div class="bulk-errors fatal">${parsed.globalErrors.map(esc).join('<br>')}</div>`;preview.innerHTML='';btn.disabled=true;return}
  const valid=bulkLatexParsed.filter(x=>x.valid).length,warn=bulkLatexParsed.filter(x=>(x.warnings||[]).length).length,invalid=bulkLatexParsed.length-valid,figs=bulkLatexParsed.filter(x=>x.item.figureLatex).length,tkztabs=bulkLatexParsed.filter(x=>x.item.figureMode==='tkztab').length;
  status.innerHTML=`<div class="bulk-summary"><span class="pill tag-green">${bulkLatexParsed.length} câu nhận diện</span><span class="pill">${valid} hợp lệ</span>${invalid?`<span class="pill" style="background:#fff0f0;color:#b42318">${invalid} có lỗi</span>`:''}<span class="pill">${warn} có cảnh báo</span><span class="pill">${figs} có hình</span>${tkztabs?`<span class="pill">${tkztabs} bảng biến thiên</span>`:''}</div>`;
  preview.innerHTML=bulkLatexParsed.map((r,i)=>{const mode=r.item.figureMode||'none',figNote=r.item.figureLatex?` • ${figureModeName(mode)}`:'';return `<div class="bulk-card ${r.valid?((r.warnings||[]).length?'warn':'ok'):'bad'}"><div class="bulk-card-head"><div><h4>Câu ${i+1} • ${questionTypeName(r.item.type)} • ${esc(r.item.lessonId)} • ${esc(r.item.knowledgeCode)}</h4><div class="bulk-note">${esc(r.item.id)} • ${levelName(r.item.level)}${figNote}</div></div><span class="pill ${r.valid?'tag-green':''}">${r.valid?'Có thể nhập':'Không nhập mặc định'}</span></div>${buildQuestionPreviewHTML(r.item,{showAnswer:true,showExplanation:false})}${(r.errors||[]).length?`<div class="bulk-errors fatal"><b>Lỗi cần sửa</b><br>${r.errors.map(w=>'• '+esc(w)).join('<br>')}</div>`:''}${(r.warnings||[]).length?`<div class="bulk-errors"><b>Cảnh báo</b><br>${r.warnings.map(w=>'• '+esc(w)).join('<br>')}</div>`:''}</div>`}).join('');
  btn.disabled=bulkLatexParsed.length===0;typesetMath(preview);
}
function uniqueImportedId(base){let id=base||`LATEX-${Date.now().toString(36).toUpperCase()}`;if(!state.questionBank.some(q=>q.id===id))return id;let n=2;while(state.questionBank.some(q=>q.id===`${id}-${n}`))n++;return `${id}-${n}`}
function commitBulkLatexImport(){if(!requireTeacher('Import LaTeX'))return;if(!bulkLatexParsed.length){alert('Hãy phân tích dữ liệu trước khi nhập.');return}const validOnly=document.getElementById('bulkValidOnly').value==='yes',dup=document.getElementById('bulkDuplicate').value;let added=0,replaced=0,skipped=0;bulkLatexParsed.forEach(r=>{if(validOnly&&!r.valid){skipped++;return}let item=JSON.parse(JSON.stringify(r.item));let existing=state.questionBank.findIndex(q=>q.id===item.id);if(existing>=0){if(dup==='skip'){skipped++;return}if(dup==='replace'){state.questionBank[existing]=item;replaced++;return}item.id=uniqueImportedId(item.id)}state.questionBank.unshift(item);added++});save();renderQuestionBank(true);const status=document.getElementById('bulkImportStatus');if(status)status.innerHTML=`<div class="quiz-result"><b>Đã nhập xong.</b> Thêm mới ${added} câu${replaced?`, ghi đè ${replaced} câu`:''}${skipped?`, bỏ qua ${skipped} câu`:''}.</div>`;const btn=document.getElementById('bulkCommitBtn');if(btn)btn.disabled=true}
function openQuestionEditor(id=''){if(!requireTeacher('Soạn câu hỏi'))return;
  let x=id?state.questionBank.find(q=>q.id===id):null,lessonId=x?.lessonId||chapters[0].lessons[0].id,knowledgeCode=x?.knowledgeCode||getLessonMeta(lessonId).knowledge[0].code;
  const body=`<div class="field-grid"><div class="field"><label>Bài</label><select id="qeLesson" onchange="updateQuestionEditorKnowledge()">${bankEditorLessonOptions(lessonId)}</select></div><div class="field"><label>Mã kiến thức</label><select id="qeKnowledge">${bankEditorKnowledgeOptions(lessonId,knowledgeCode)}</select></div><div class="field"><label>Mức độ</label><select id="qeLevel"><option value="NB" ${x?.level==='NB'?'selected':''}>Nhận biết</option><option value="TH" ${x?.level==='TH'?'selected':''}>Thông hiểu</option><option value="VD" ${x?.level==='VD'?'selected':''}>Vận dụng</option><option value="VDC" ${x?.level==='VDC'?'selected':''}>Vận dụng cao</option></select></div><div class="field"><label>Loại câu</label><select id="qeType" onchange="toggleQuestionEditorFields()"><option value="mcq" ${!x||x?.type==='mcq'?'selected':''}>Nhiều lựa chọn</option><option value="tf" ${x?.type==='tf'?'selected':''}>Đúng/Sai 1 mệnh đề</option><option value="tf4" ${x?.type==='tf4'?'selected':''}>Đúng/Sai 4 ý</option><option value="short" ${x?.type==='short'?'selected':''}>Trả lời ngắn</option></select></div><div class="field full"><label>Dạng toán</label><input id="qeForm" value="${attrEsc(x?.form||'')}" placeholder="Ví dụ: Xét tính đơn điệu từ đạo hàm"></div><div class="field full"><label>Nội dung câu hỏi • hỗ trợ LaTeX</label><textarea id="qeQuestion" placeholder="Ví dụ: Cho hàm số $y=x^3-3x$...">${esc(x?.question||'')}</textarea><div class="math-help">Nhập công thức bằng <code>$...$</code>, <code>\(...\)</code> hoặc <code>\[...\]</code>. Nếu dán trực tiếp khối <code>\\begin{tikzpicture}...\\end{tikzpicture}</code> vào nội dung câu hỏi, hệ thống cũng sẽ tự nhận diện.</div></div><div class="field"><label>Hình vẽ kèm theo</label><select id="qeFigureMode" onchange="toggleQuestionFigureFields()"><option value="none" ${!x?.figureLatex?'selected':''}>Không có hình</option><option value="tikz" ${(x?.figureMode||'tikz')==='tikz'&&x?.figureLatex?'selected':''}>TikZ / PGFPlots</option><option value="tkz" ${x?.figureMode==='tkz'?'selected':''}>tkz-euclide / TikZ hình học</option><option value="tkztab" ${x?.figureMode==='tkztab'?'selected':''}>Bảng biến thiên tkz-tab</option><option value="graph2d" ${x?.figureMode==='graph2d'?'selected':''}>Đồ thị hàm số 2D</option><option value="oxyz" ${x?.figureMode==='oxyz'?'selected':''}>Hình Oxyz</option></select></div><div class="field"><label>Bố cục hình</label><select id="qeFigureLayout"><option value="below" ${(x?.figureLayout||'below')==='below'?'selected':''}>Hình dưới đề</option><option value="right" ${x?.figureLayout==='right'?'selected':''}>Hình bên phải (immini)</option><option value="left" ${x?.figureLayout==='left'?'selected':''}>Hình bên trái (imminiL)</option></select></div><div class="field"><label>Chú thích hình (tùy chọn)</label><input id="qeFigureCaption" value="${attrEsc(x?.figureCaption||'')}" placeholder="Ví dụ: Hình 1. Đồ thị hàm số"></div><div class="field full ${x?.figureLatex?'':'hidden'}" id="qeFigureWrap"><label id="qeFigureLabel">Mã hình / cấu hình hình</label><div class="figure-toolbar"><button type="button" class="btn btn-soft" onclick="setQuestionFigureTemplate()">Chèn mẫu</button><button type="button" class="btn btn-soft" onclick="openGeometrySupportInfo()">Hướng dẫn nhanh</button></div><textarea id="qeFigureLatex" class="figure-spec">${esc(x?.figureLatex||'')}</textarea><div class="figure-mode-hint" id="qeFigureHint"></div></div><div class="field full" id="qeOptionsWrap"><label>4 phương án (mỗi dòng một phương án, hỗ trợ LaTeX)</label><textarea id="qeOptions">${esc((x?.options||['','','','']).join('\n'))}</textarea></div><div class="field full hidden" id="qeTF4Wrap"><label>4 ý Đúng/Sai • mỗi dòng 1 ý; thêm <code>\\True</code> ở đầu ý đúng</label><textarea id="qeTF4Statements">${esc((x?.statements||[]).map(it=>(it.answer?'\\True ':'')+(it.text||'')).join('\n'))}</textarea><label style="margin-top:10px">Lời giải từng ý • mỗi dòng tương ứng a, b, c, d</label><textarea id="qeTF4Explanations" placeholder="Dòng 1: lời giải ý a ...&#10;Dòng 2: lời giải ý b ...">${esc((x?.statements||[]).map(it=>it.explanation||'').join('\n'))}</textarea></div><div class="field" id="qeAnswerWrap"><label id="qeAnswerLabel">Đáp án</label><input id="qeAnswer" value="${attrEsc(x?.type==='mcq'?String.fromCharCode(65+(Number(x?.answer)||0)):x?.type==='tf'?(x?.answer?'Đúng':'Sai'):(x?.answer??''))}" placeholder="A / Đúng / đáp án ngắn"></div><div class="field"><label>Mã bản ghi nội bộ</label><input id="qeId" value="${attrEsc(x?.id||'')}" placeholder="Để trống để tự sinh"></div><div class="field full"><label>Lời giải / giải thích • hỗ trợ LaTeX</label><textarea id="qeExplanation">${esc(x?.explanation||'')}</textarea></div><div class="field full"><label>Xem trước</label><div id="qePreview" class="preview-box"></div></div></div>`;
  openModal(id?'Sửa câu hỏi':'Thêm câu hỏi mới','Chuẩn hóa dữ liệu trước khi lưu vào ngân hàng',body,`<button class="btn btn-soft" onclick="closeModal()">Hủy</button><button class="btn btn-blue" onclick="saveQuestionEditor('${id}')">Lưu câu hỏi</button>`);
  toggleQuestionEditorFields();toggleQuestionFigureFields();bindQuestionEditorPreview();updateQuestionEditorPreview();
}
function updateQuestionEditorKnowledge(){let lid=document.getElementById('qeLesson').value;document.getElementById('qeKnowledge').innerHTML=bankEditorKnowledgeOptions(lid);let k=getLessonMeta(lid).knowledge[0];if(k)document.getElementById('qeLevel').value=k.level;updateQuestionEditorPreview()}
function toggleQuestionEditorFields(){let t=document.getElementById('qeType')?.value,w=document.getElementById('qeOptionsWrap'),tf4=document.getElementById('qeTF4Wrap'),lab=document.getElementById('qeAnswerLabel'),aw=document.getElementById('qeAnswerWrap');if(!w)return;w.classList.toggle('hidden',t!=='mcq');if(tf4)tf4.classList.toggle('hidden',t!=='tf4');if(aw)aw.classList.toggle('hidden',t==='tf4');lab.textContent=t==='mcq'?'Đáp án (A/B/C/D)':t==='tf'?'Đáp án (Đúng/Sai)':'Đáp án ngắn'}
function saveQuestionEditor(editId=''){if(!requireTeacher('Lưu câu hỏi'))return;
  let lessonId=document.getElementById('qeLesson').value,lesson=getLesson(lessonId),type=document.getElementById('qeType').value,question=document.getElementById('qeQuestion').value.trim(),rawAns=document.getElementById('qeAnswer').value.trim(),customId=document.getElementById('qeId').value.trim().replace(/[^A-Za-z0-9._-]/g,'-');
  const extracted=extractTikzFromText(question);question=(extracted.text||question).trim();
  if(!question){alert('Cần nhập nội dung câu hỏi.');return}
  let figureMode=document.getElementById('qeFigureMode').value,figureLatex=(figureMode==='tikz'||figureMode==='tkz')?(document.getElementById('qeFigureLatex').value.trim()||extracted.figure||''):(figureMode!=='none'?(document.getElementById('qeFigureLatex').value.trim()||''):''),figureCaption=document.getElementById('qeFigureCaption').value.trim(),figureLayout=document.getElementById('qeFigureLayout')?.value||'below';
  if(figureMode!=='none'&&!figureLatex){alert('Đã chọn chế độ hình nhưng chưa nhập mã hoặc cấu hình hình.');return}
  if(figureLatex&&['tikz','tkz'].includes(figureMode))figureMode=detectFigureMode(figureLatex,figureMode);
  let item={id:customId||editId||`QB-${Date.now().toString(36).toUpperCase()}`,chapterId:lesson.chapter.id,lessonId,knowledgeCode:document.getElementById('qeKnowledge').value,form:document.getElementById('qeForm').value.trim(),level:document.getElementById('qeLevel').value,type,question,explanation:document.getElementById('qeExplanation').value.trim(),figureMode:figureLatex?figureMode:'none',figureLatex,figureCaption,figureLayout,source:'custom'};
  if(type==='mcq'){let opts=document.getElementById('qeOptions').value.split('\n').map(x=>x.trim()).filter(Boolean);if(opts.length<2){alert('Câu nhiều lựa chọn cần ít nhất 2 phương án.');return}let ai='ABCD'.indexOf(rawAns.toUpperCase());if(ai<0||ai>=opts.length){alert('Đáp án câu nhiều lựa chọn cần là A, B, C hoặc D tương ứng phương án.');return}item.options=opts;item.answer=ai}else if(type==='tf4'){let lines=(document.getElementById('qeTF4Statements')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);if(lines.length!==4){alert('Câu Đúng/Sai 4 ý cần đúng 4 dòng.');return}let exps=(document.getElementById('qeTF4Explanations')?.value||'').split('\n');item.statements=lines.map((s,i)=>({text:s.replace(/\\True\b/g,'').trim(),answer:/\\True\b/.test(s),explanation:(exps[i]||'').trim()}))}else if(type==='tf'){let a=rawAns.toLowerCase();if(!['đúng','dung','true','sai','false'].includes(a)){alert('Đáp án Đúng/Sai hãy nhập “Đúng” hoặc “Sai”.');return}item.answer=['đúng','dung','true'].includes(a)}else{if(!rawAns){alert('Cần nhập đáp án ngắn.');return}item.answer=rawAns}
  const latexCheck=validateQuestionLatexItem(item);if(latexCheck.errors.length){alert('Câu hỏi còn lỗi LaTeX cần sửa trước khi lưu:\n- '+latexCheck.errors.join('\n- '));return}if(latexCheck.warnings.length&&!confirm('Có một số cảnh báo LaTeX:\n- '+latexCheck.warnings.join('\n- ')+'\n\nVẫn lưu câu hỏi?'))return;
  if(state.questionBank.some(q=>q.id===item.id&&q.id!==editId)){alert('Mã câu đã tồn tại.');return}
  if(editId){let i=state.questionBank.findIndex(q=>q.id===editId);if(i>=0)state.questionBank[i]=item}else state.questionBank.unshift(item);save();closeModal();renderQuestionBank(true)
}
async function deleteBankQuestion(id){if(!requireTeacher('Xóa câu hỏi'))return;let x=state.questionBank.find(q=>q.id===id);if(!x)return;if(!confirm(`Đưa câu ${id} vào Thùng rác V26?`))return;if(typeof v26TrashLocalContent==='function')await v26TrashLocalContent('question',x);state.questionBank=state.questionBank.filter(q=>q.id!==id);save({reason:'v26-question-trash'});renderQuestionBank();examToast?.('Đã chuyển câu hỏi vào Thùng rác V26.')}
function previewBankQuestion(id){if(!requireTeacher('Xem đáp án ngân hàng'))return;let x=state.questionBank.find(q=>q.id===id);if(!x)return;openModal(`${x.id} • ${questionTypeName(x.type)}`,`${x.knowledgeCode} • ${levelName(x.level)}${x.form?' • '+x.form:''}`,buildQuestionPreviewHTML(x,{showAnswer:true,showExplanation:true}),`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)}

function bankBackupFilename(prefix='math12-question-bank-backup'){
  const d=new Date(),pad=n=>String(n).padStart(2,'0');
  return `${prefix}-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}
function triggerJsonDownload(data,filename){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function backupQuestionBank(){if(!requireTeacher('Sao lưu ngân hàng'))return;
  const payload={format:'math12hub-question-bank-backup',version:APP_VERSION,createdAt:new Date().toISOString(),questionCount:state.questionBank.length,questionBank:state.questionBank};
  triggerJsonDownload(payload,bankBackupFilename());
}
function validateRestoredQuestion(q){
  const issues=[];
  if(!q||typeof q!=='object')return ['Không phải đối tượng câu hỏi'];
  if(!String(q.id||'').trim())issues.push('thiếu mã câu');
  if(!String(q.question||'').trim())issues.push('thiếu nội dung');
  if(!['mcq','tf','tf4','short'].includes(q.type))issues.push('loại câu không hợp lệ');
  if(q.type==='mcq'&&(!Array.isArray(q.options)||q.options.length<2||!Number.isInteger(Number(q.answer))||Number(q.answer)<0||Number(q.answer)>=q.options.length))issues.push('MCQ thiếu phương án/đáp án');
  if(q.type==='tf'&&typeof q.answer!=='boolean')issues.push('Đúng/Sai thiếu đáp án boolean');
  if(q.type==='tf4'&&(!Array.isArray(q.statements)||q.statements.length!==4||q.statements.some(s=>!s||!String(s.text||'').trim()||typeof s.answer!=='boolean')))issues.push('Đúng/Sai 4 ý không hợp lệ');
  if(q.type==='short'&&(q.answer===undefined||q.answer===null||String(q.answer).trim()===''))issues.push('trả lời ngắn thiếu đáp án');
  return issues;
}
let pendingBankRestore=null;
function parseBankBackupPayload(data){
  const bank=Array.isArray(data)?data:(Array.isArray(data?.questionBank)?data.questionBank:null);
  if(!bank)throw new Error('File không chứa mảng questionBank hợp lệ.');
  const seen=new Set();
  const checked=bank.map((q,i)=>{const issues=validateRestoredQuestion(q);const id=String(q?.id||'').trim();if(id&&seen.has(id))issues.push('trùng mã trong file');if(id)seen.add(id);return {q,issues,index:i}});
  return {bank,invalid:checked.filter(x=>x.issues.length),format:Array.isArray(data)?'legacy-array':(data.format||'json-package'),createdAt:data?.createdAt||null,version:data?.version||null};
}
function chooseQuestionBankBackup(){
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.style.display='none';document.body.appendChild(input);
  input.onchange=async()=>{const file=input.files?.[0];input.remove();if(!file)return;try{const raw=await file.text(),data=JSON.parse(raw),parsed=parseBankBackupPayload(data);pendingBankRestore={...parsed,fileName:file.name};openBankRestorePreview()}catch(err){alert('Không thể đọc bản sao lưu: '+(err?.message||err))}};
  input.click();
}
function openBankRestorePreview(){
  if(!pendingBankRestore)return;const r=pendingBankRestore,ids=new Set(state.questionBank.map(q=>q.id)),duplicates=r.bank.filter(q=>ids.has(q.id)).length,valid=r.bank.length-r.invalid.length;
  const warnings=r.invalid.slice(0,8).map(x=>`Câu #${x.index+1}: ${x.issues.join(', ')}`).join('<br>');
  const body=`<div class="notice"><b>File:</b> ${esc(r.fileName)}${r.createdAt?` • Sao lưu ${new Date(r.createdAt).toLocaleString('vi-VN')}`:''}${r.version?` • phiên bản ${esc(r.version)}`:''}</div><div class="backup-summary"><div><b>${r.bank.length}</b><small>Tổng câu trong file</small></div><div><b>${valid}</b><small>Câu đạt kiểm tra</small></div><div><b>${duplicates}</b><small>Mã trùng hiện tại</small></div></div>${r.invalid.length?`<div class="restore-warnings"><b>${r.invalid.length} câu có cảnh báo và sẽ bị bỏ qua:</b><br>${warnings}${r.invalid.length>8?'<br>…':''}</div>`:'<div class="notice"><b>✓ File hợp lệ.</b> Không phát hiện câu lỗi cấu trúc.</div>'}<div class="field" style="margin-top:12px"><label>Cách khôi phục</label><select id="restoreBankMode"><option value="replace">Thay toàn bộ ngân hàng hiện tại</option><option value="merge_keep">Gộp – giữ câu hiện tại nếu trùng mã</option><option value="merge_file">Gộp – câu trong file ghi đè nếu trùng mã</option></select></div><div class="math-help">Trước khi thực hiện, website tự lưu một bản <b>hoàn tác khôi phục gần nhất</b> trong trình duyệt.</div>`;
  openModal('Khôi phục ngân hàng câu hỏi','Kiểm tra bản sao lưu trước khi áp dụng',body,`<button class="btn btn-soft" onclick="closeModal()">Hủy</button><button class="btn btn-blue" onclick="commitBankRestore()">Khôi phục</button>`);
}
async function commitBankRestore(){
  if(!pendingBankRestore)return;const mode=document.getElementById('restoreBankMode')?.value||'replace';
  if(typeof v26SafetyCheckpoint==='function')await v26SafetyCheckpoint('bank-restore');
  const valid=pendingBankRestore.bank.filter(q=>validateRestoredQuestion(q).length===0).map(q=>JSON.parse(JSON.stringify(q)));
  if(!valid.length){alert('Không có câu hợp lệ để khôi phục.');return}
  localStorage.setItem('math12hub2026_bank_before_restore',JSON.stringify({savedAt:new Date().toISOString(),questionBank:state.questionBank}));
  if(mode==='replace')state.questionBank=valid;
  else if(mode==='merge_keep'){const ids=new Set(state.questionBank.map(q=>q.id));state.questionBank=[...state.questionBank,...valid.filter(q=>!ids.has(q.id))]}
  else{const incoming=new Map(valid.map(q=>[q.id,q]));state.questionBank=[...state.questionBank.filter(q=>!incoming.has(q.id)),...valid]}
  save();closeModal();renderQuestionBank(true);const count=state.questionBank.length;pendingBankRestore=null;alert(`Khôi phục thành công. Ngân hàng hiện có ${count} câu.`);
}
function undoLastBankRestore(){
  try{const raw=localStorage.getItem('math12hub2026_bank_before_restore');if(!raw){alert('Chưa có bản hoàn tác khôi phục.');return}const data=JSON.parse(raw);if(!Array.isArray(data.questionBank))throw new Error('Bản hoàn tác không hợp lệ');if(!confirm(`Hoàn tác về ngân hàng trước lần khôi phục gần nhất (${data.questionBank.length} câu)?`))return;state.questionBank=data.questionBank;save();renderQuestionBank(true);localStorage.removeItem('math12hub2026_bank_before_restore');alert('Đã hoàn tác lần khôi phục gần nhất.')}catch(err){alert('Không thể hoàn tác: '+(err?.message||err))}
}
async function resetQuestionBank(){if(!requireTeacher('Khôi phục ngân hàng'))return;if(!confirm('Khôi phục ngân hàng mẫu? Các câu đã thêm/sửa trong ngân hàng hiện tại sẽ bị thay thế. V26 sẽ tạo điểm khôi phục trước.'))return;if(typeof v26SafetyCheckpoint==='function')await v26SafetyCheckpoint('bank-reset');state.questionBank=JSON.parse(JSON.stringify(SEED_QUESTION_BANK));save({reason:'v26-bank-reset'});renderQuestionBank(true)}
function exportQuestionBank(){if(!requireTeacher('Xuất ngân hàng'))return;let blob=new Blob([JSON.stringify(state.questionBank,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`math12-question-bank-v${APP_VERSION}.json`;a.click();URL.revokeObjectURL(a.href)}
function equalShort(a,b){let x=normAns(a),y=normAns(b);return x===y||(!isNaN(Number(x))&&!isNaN(Number(y))&&Math.abs(Number(x)-Number(y))<.011)}
const fullExam={
 mcq:[
 ['Hàm số $y=x^3-3x$ đạt cực đại tại $x$ bằng',['$-1$','$0$','$1$','$3$'],0,'F1'],
 ['Giá trị lớn nhất của $y=-x^2+4x+1$ trên đoạn $[0;4]$ bằng',['$4$','$5$','$6$','$9$'],1,'F1'],
 ['Tiệm cận đứng của đồ thị $y=\\dfrac{x+2}{x-1}$ là',['$x=-2$','$x=1$','$y=1$','$y=-2$'],1,'F1'],
 ['Cho $\\vec a=(1;2;0)$ và $\\vec b=(2;-1;3)$. Tích vô hướng $\\vec a\\cdot\\vec b$ bằng',['$0$','$1$','$2$','$3$'],0,'F2'],
 ['Một mẫu số liệu có giá trị nhỏ nhất bằng $5$ và lớn nhất bằng $17$. Khoảng biến thiên bằng',['$12$','$17$','$22$','$5$'],0,'F3'],
 ['Một nguyên hàm của hàm số $f(x)=2x$ là',['$x^2+C$','$2x^2+C$','$x+C$','$2+C$'],0,'F4'],
 ['Giá trị $\\displaystyle\\int_0^2 x\\,dx$ bằng',['$1$','$2$','$3$','$4$'],1,'F4'],
 ['Một mặt phẳng có vectơ pháp tuyến $\\vec n=(1;-2;3)$. Vectơ nào sau đây cũng là vectơ pháp tuyến của mặt phẳng?',['$(2;-4;6)$','$(1;2;3)$','$(-1;-2;-3)$','$(3;-2;1)$'],0,'F5'],
 ['Mặt cầu tâm $O$, bán kính $2$ có phương trình',['$x^2+y^2+z^2=2$','$x^2+y^2+z^2=4$','$x+y+z=4$','$(x-2)^2+y^2+z^2=4$'],1,'F5'],
 ['Biết $P(A\\cap B)=0{,}15$ và $P(B)=0{,}3$. Khi đó $P(A\\mid B)$ bằng',['$0{,}05$','$0{,}45$','$0{,}5$','$2$'],2,'F6'],
 ['Nếu $P(A)=0{,}4$ thì $P(\\overline A)$ bằng',['$0{,}4$','$0{,}6$','$1$','$1{,}4$'],1,'F6'],
 ['Độ lệch chuẩn của một mẫu số liệu bằng',['Căn bậc hai của phương sai','Bình phương của phương sai','Trung vị của mẫu','Mốt của mẫu'],0,'F3']],
 tf:[
 {stem:'Cho hàm số $f(x)=x^3-3x+2$.',items:[['$f\'(x)=3x^2-3$.',true],['$f\'(x)=0$ khi $x=-1$ hoặc $x=1$.',true],['Hàm số nghịch biến trên khoảng $(-1;1)$.',true],['Giá trị cực đại của hàm số bằng $4$.',true]],topic:'F1'},
 {stem:'Trong không gian $Oxyz$, cho $\\vec a=(1;2;-1)$ và $\\vec b=(2;0;1)$.',items:[['$\\vec a+\\vec b=(3;2;0)$.',true],['$\\vec a\\cdot\\vec b=1$.',true],['$|\\vec b|=\\sqrt5$.',true],['$\\vec a\\perp\\vec b$.',false]],topic:'F2'},
 {stem:'Xét tích phân $I=\\displaystyle\\int_0^1 2x\\,dx$.',items:[['Một nguyên hàm của $2x$ là $x^2+C$.',true],['$I=1$.',true],['$I$ biểu diễn diện tích dưới đồ thị $y=2x$ trên đoạn $[0;1]$.',true],['$I=2$.',false]],topic:'F4'},
 {stem:'Cho $P(B)=0{,}5$ và $P(A\\cap B)=0{,}2$.',items:[['$P(A\\mid B)=0{,}4$.',true],['$P(A\\cap B)=P(A\\mid B)P(B)$.',true],['Nếu $P(A)=0{,}4$ thì $A$ và $B$ chắc chắn độc lập.',false],['Công thức Bayes liên quan đến xác suất có điều kiện.',true]],topic:'F6'}],
 short:[
 ['Tính $f(2)$ với $f(x)=x^3-3x$.','2','F1'],
 ['Cho $A(1;2;3)$ và $B(3;2;1)$. Tính độ dài $AB$, làm tròn đến hai chữ số thập phân.','2.83','F2'],
 ['Tính $\\displaystyle\\int_0^3 2x\\,dx$.','9','F4'],
 ['Mặt cầu $x^2+y^2+z^2=25$ có bán kính bằng bao nhiêu?','5','F5'],
 ['Biết $P(A\\cap B)=0{,}18$ và $P(B)=0{,}6$. Tính $P(A\\mid B)$.','0.3','F6'],
 ['Một mẫu số liệu có phương sai bằng $16$. Độ lệch chuẩn bằng bao nhiêu?','4','F3']]
};
function normAns(s){return String(s).trim().replace(',','.').replace(/\s+/g,'')}
