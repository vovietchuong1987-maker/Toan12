/* =========================================================
   Math12 Hub  — Production Hardening inherited from 
   Keeps the  data/query architecture intact while improving:
   - on-demand loading for heavy/role-specific features
   - PWA/offline shell readiness
   - runtime diagnostics and regression checks
   - accessibility/focus/motion support
   - production readiness visibility for administrators
   No Firestore collection/schema migration is introduced by .
   ========================================================= */
const V35_HARDENING_SCHEMA=35;
const V35_BUILD='37.4.7-figure-qc-preview-approved-gate';
const V35_FEATURES={
  ai:{src:'assets/js/ai-teacher-v32.js?v=37.4.7',label:'Trợ lý AI'},
  reports:{src:'assets/js/reports-v33.js?v=37.4.7',label:'Báo cáo học tập'},
  xlsx:{src:'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',label:'Đọc Excel',crossOrigin:true}
};
const v35FeaturePromises=new Map();
const v35InitialFeatureState={xlsx:!!window.XLSX,ai:typeof v32RenderAIAssistant==='function',reports:typeof v33RenderReportsPage==='function'};
const v35RuntimeIssues=[];
let v35RegressionLast=null;
let v35ServiceWorkerState='checking';

function v35Now(){return new Date().toISOString()}
function v35FeatureReady(name){
  if(name==='ai')return typeof v32RenderAIAssistant==='function';
  if(name==='reports')return typeof v33RenderReportsPage==='function';
  if(name==='xlsx')return !!window.XLSX;
  return false
}
function v35SetFeatureLoading(show,label='Đang tải tính năng…'){
  let box=document.getElementById('v35FeatureLoader');
  if(!box){box=document.createElement('div');box.id='v35FeatureLoader';box.className='v35-feature-loader hidden';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.appendChild(box)}
  box.textContent=label;box.classList.toggle('hidden',!show)
}
function v35LoadScript(src,{crossOrigin=false}={}){
  return new Promise((resolve,reject)=>{
    let found=[...document.scripts].find(s=>s.src===new URL(src,location.href).href);
    if(found){if(found.dataset.loaded==='1')return resolve();found.addEventListener('load',()=>resolve(),{once:true});found.addEventListener('error',()=>reject(new Error(`Không tải được ${src}`)),{once:true});return}
    let s=document.createElement('script');s.src=src;s.async=true;s.dataset.v35Dynamic='1';if(crossOrigin)s.crossOrigin='anonymous';s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=()=>reject(new Error(`Không tải được ${src}`));document.head.appendChild(s)
  })
}
async function v35EnsureFeature(name,{quiet=false}={}){
  if(v35FeatureReady(name))return true;
  if(v35FeaturePromises.has(name))return v35FeaturePromises.get(name);
  let f=V35_FEATURES[name];if(!f)throw new Error(`Tính năng nền / không tồn tại: ${name}`);
  let p=(async()=>{try{if(!quiet)v35SetFeatureLoading(true,` đang tải ${f.label}…`);await v35LoadScript(f.src,{crossOrigin:f.crossOrigin});if(!v35FeatureReady(name))throw new Error(`${f.label} đã tải nhưng chưa khởi tạo được.`);v35RenderProductionCenter();return true}finally{if(!quiet)v35SetFeatureLoading(false)}})();
  v35FeaturePromises.set(name,p);try{return await p}catch(err){v35FeaturePromises.delete(name);throw err}
}
async function v35EnsureXlsx(){return v35EnsureFeature('xlsx')}

/* Lazy-load Excel only when an .xlsx/.xls file is actually chosen. */
if(typeof v27ReadRosterFile==='function'){
  const v35BaseReadRosterFile=v27ReadRosterFile;
  v27ReadRosterFile=async function(file){
    let name=String(file?.name||'').toLowerCase();
    if((name.endsWith('.xlsx')||name.endsWith('.xls'))&&!window.XLSX)await v35EnsureXlsx();
    return v35BaseReadRosterFile(file)
  }
}

/* Lazy-load AI and Reports when the user opens those pages. */
if(typeof goPage==='function'){
  const v35BaseGoPage=goPage;
  goPage=function(page,internal=false){
    let feature=page==='ai-teacher'?'ai':page==='reports'?'reports':'';
    if(feature&&!v35FeatureReady(feature)){
      v35EnsureFeature(feature).then(()=>v35BaseGoPage(page,internal)).catch(err=>{v35CaptureIssue('feature-load',err);alert(`Không tải được ${V35_FEATURES[feature].label}. Kiểm tra kết nối Internet rồi thử lại.`)});return
    }
    return v35BaseGoPage(page,internal)
  }
}

async function v35TryOpenPublicReport(){
  if(!new URLSearchParams(location.search).get('report'))return;
  try{await v35EnsureFeature('reports');let tries=0;let open=()=>{if(typeof v33TryOpenPublicReport!=='function')return;if(typeof firebaseDb!=='undefined'&&firebaseDb)return v33TryOpenPublicReport();if(tries++<20)setTimeout(open,150)};open()}catch(err){v35CaptureIssue('public-report-load',err)}
}

function v35SanitizeErrorText(v=''){
  return String(v||'').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]')
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g,'[id]').slice(0,700)
}
function v35CaptureIssue(kind,error){
  let item={at:v35Now(),kind:String(kind||'runtime').slice(0,80),name:v35SanitizeErrorText(error?.name||'Error'),message:v35SanitizeErrorText(error?.message||error||'Lỗi không xác định')};
  v35RuntimeIssues.unshift(item);if(v35RuntimeIssues.length>20)v35RuntimeIssues.length=20;
  try{sessionStorage.setItem('math12hub-v35-runtime-issues',JSON.stringify(v35RuntimeIssues))}catch(_){}
  v35RenderProductionCenter()
}
window.addEventListener('error',e=>{let src=String(e.filename||'');if(/^(chrome|edge|moz)-extension:/i.test(src))return;v35CaptureIssue('window-error',e.error||e.message)});
window.addEventListener('unhandledrejection',e=>v35CaptureIssue('unhandled-rejection',e.reason));
try{let old=JSON.parse(sessionStorage.getItem('math12hub-v35-runtime-issues')||'[]');if(Array.isArray(old))v35RuntimeIssues.push(...old.slice(0,20))}catch(_){}

function v35Check(name,ok,detail='',level='fail'){return {name,ok:!!ok,detail:String(detail||''),level:ok?'pass':level}}
function v35RunRegressionChecks({render=true,toast=false}={}){
  let checks=[];
  let meta=document.querySelector('meta[name="app-version"]')?.content||'',build=document.querySelector('meta[name="app-build"]')?.content||'';
  checks.push(v35Check('Phiên bản ứng dụng',String(APP_VERSION)==='40.8'&&meta==='40.8',`APP_VERSION=${APP_VERSION}; meta=${meta}; build=${build||V35_BUILD}`));
  let ids=[...document.querySelectorAll('[id]')].map(x=>x.id),dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
  checks.push(v35Check('ID giao diện không trùng',dup.length===0,dup.length?`Trùng: ${dup.slice(0,8).join(', ')}`:`${ids.length} ID hợp lệ`));
  checks.push(v35Check('Hàm thi cốt lõi',typeof calculateExamResultFor==='function'&&typeof thptTfScore==='function'&&typeof thptExamConfig==='function','Exam engine + scoring'));
  try{
    let c=thptExamConfig(),counts=(c.questions||[]).reduce((m,q)=>(m[q.section]=(m[q.section]||0)+1,m),{});
    checks.push(v35Check('Cấu trúc THPT',c.durationMinutes===90&&c.questions.length===22&&counts.I===12&&counts.II===4&&counts.III===6,`${counts.I||0}/${counts.II||0}/${counts.III||0} • ${c.durationMinutes}'`));
    let tf=[thptTfScore(1),thptTfScore(2),thptTfScore(3),thptTfScore(4)];
    checks.push(v35Check('Thang điểm Đúng/Sai',tf.join('|')==='0.1|0.25|0.5|1',tf.join(' / ')));
  }catch(err){checks.push(v35Check('Cấu trúc THPT',false,v35SanitizeErrorText(err?.message)))}
  try{
    let roleOk=canAccessPage('question-bank','student')===false&&canAccessPage('question-bank','teacher')===true&&canAccessPage('admin','teacher')===false&&canAccessPage('admin','admin')===true;
    checks.push(v35Check('Phân quyền giao diện',roleOk,'Student / Teacher / Admin'))
  }catch(err){checks.push(v35Check('Phân quyền giao diện',false,v35SanitizeErrorText(err?.message)))}
  checks.push(v35Check('Data Safety',typeof v21HydrateFromVault==='function'&&typeof save==='function','Local + IndexedDB vault'));
  checks.push(v35Check('Firebase core',typeof initFirebaseV21==='function'&&typeof firebaseLearningSnapshot==='function','Auth + Firestore'));
  checks.push(v35Check('Scale engine ',typeof v34Diagnostics==='function'&&typeof v34RenderScaleCenter==='function','Phân trang + cache'));
  checks.push(v35Check('PWA shell','serviceWorker' in navigator&&!!document.querySelector('link[rel="manifest"]'),'Service Worker + manifest', 'warn'));
  let appCheckKey=String(window.MATH12_APP_CHECK_SITE_KEY||'').trim();
  checks.push(v35Check('Firebase App Check',appCheckKey&&typeof firebaseAppCheckStatus!=='undefined'&&firebaseAppCheckStatus==='active',appCheckKey?(typeof firebaseAppCheckStatus==='undefined'?'Chờ Firebase khởi tạo':firebaseAppCheckStatus):'Chưa nhập reCAPTCHA site key','warn'));
  checks.push(v35Check('Smart Loading',!v35InitialFeatureState.xlsx&&!v35InitialFeatureState.ai&&!v35InitialFeatureState.reports,'Excel/AI/Báo cáo được hoãn tải ở trang đầu','warn'));
  checks.push(v35Check('Smart Navigation',!!window.v354SmartNavigation&&!!document.getElementById('v354SearchTrigger'),'Tìm nhanh + ghim + gần đây + nhớ bộ lọc','warn'));
  checks.push(v35Check('Knowledge Map ',!!window.v360KnowledgeMap&&window.v360KnowledgeMap.build==='36.0-knowledge-map'&&window.v360KnowledgeMap.map().counts.knowledge===57&&window.v360KnowledgeMap.map().counts.lessons===19,'6 chương • 19 bài • 57 chuẩn • metadata câu hỏi','fail'));
  try{const id6=window.ID6V374,forms=id6?.allForms?.()||[],ok=id6?.buildId6?.('2D1?1-1','NB')==='2D1N1-1'&&id6?.buildId6?.('2D1?1-1','TH')==='2D1H1-1'&&id6?.buildId6?.('2D1?1-1','VD')==='2D1V1-1'&&id6?.buildId6?.('2D1?1-1','VDC')==='2D1C1-1'&&forms.length===91;checks.push(v35Check('Official ID6 Taxonomy ',ok,ok?'91 dạng • N/H/V/C • giữ khóa nội bộ riêng':'ID6 regression chưa đạt','fail'))}catch(err){checks.push(v35Check('Official ID6 Taxonomy ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{const pu=window.ID6V3742,m=pu?.meta?.({id6Pattern:'2D1?2-2',level:'TH'}),ok=pu?.BUILD==='37.4.2-pure-id6-taxonomy-ui'&&m?.id6==='2D1H2-2'&&m?.chapter===1&&m?.lesson===2&&m?.form===2;checks.push(v35Check('Pure ID6 UI ',ok,ok?'Chương → Bài → Dạng → Mức độ → ID6':'Pure ID6 regression chưa đạt','fail'))}catch(err){checks.push(v35Check('Pure ID6 UI ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{const cr=window.v3743CleanReset?._test?.regression?.(),ok=cr?.ok===true&&cr?.seedBankDisabled===true;checks.push(v35Check('Clean Question Bank Reset ',ok,ok?'Seed/demo = 0 • backup bắt buộc • giữ lớp/đề/lịch sử học tập':'Reset regression chưa đạt','fail'))}catch(err){checks.push(v35Check('Clean Question Bank Reset ',false,v35SanitizeErrorText(err?.message),'fail'))}

  try{
    const qe=window.v361QualityEngine,sample={id:'REG-QC',questionBankSchema:36,knowledgeMapVersion:36,metadataStatusV36:'complete',curriculumId:'MATH12-GDPT2018-2026',blueprintKey:'F1-01.K1|F1-01.D1|NB|mcq',chapterId:1,lessonId:'F1-01',knowledgeCode:'F1-01.K1',formId:'F1-01.D1',form:'Regression',level:'NB',type:'mcq',question:'Chọn phương án đúng cho biểu thức $x^2$.',options:['$x=1$','$x=1$','$x=2$','$x=3$'],answer:0,explanation:'Dữ liệu kiểm tra regression.',sourceName:'Regression',reviewStatus:'reviewed'},qr=qe?.auditQuestion?.(sample);
    checks.push(v35Check('Question Quality Engine ',qe?.build==='36.1-quality-engine'&&qr?.details?.some(x=>x.code==='MCQ_DUP_OPTION'),'Cấu trúc + LaTeX + đáp án + TF4 + near-duplicate','fail'))
  }catch(err){checks.push(v35Check('Question Quality Engine ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{
    const se=window.v362SmartExam,rr=se?.regression?.();
    checks.push(v35Check('Smart Exam Matrix ',se?.build==='36.2-smart-exam'&&rr?.ok===true,rr?.ok?`Mã ${rr.codes.join('–')} • giữ nhóm câu phụ thuộc`:'Smart exam regression chưa đạt','fail'))
  }catch(err){checks.push(v35Check('Smart Exam Matrix ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{
    const me=window.v363MasteryEngine,rr=me?.regression?.();
    checks.push(v35Check('Mastery & Adaptive ',me?.build==='36.3-mastery-adaptive'&&rr?.ok===true,rr?.ok?`Mastery ${Math.round(rr.score*100)}% • confidence ${Math.round(rr.confidence*100)}%`:'Mastery regression chưa đạt','fail'))
  }catch(err){checks.push(v35Check('Mastery & Adaptive ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{
    const ti=window.v37TeachingIntelligence,rr=ti?.privacyRegression?.();
    checks.push(v35Check('AI Teaching Intelligence ',ti?.build==='37-ai-teaching-intelligence'&&rr?.ok===true,rr?.ok?`Privacy Guard đạt • payload ${rr.bytes} bytes • ưu tiên ${rr.priority}`:' privacy regression chưa đạt','fail'))
  }catch(err){checks.push(v35Check('AI Teaching Intelligence ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{
    const bk=window.v371BackupV2,rt=bk?._test,zip=rt?.makeZip?.([{name:'manifest.json',data:new TextEncoder().encode('{\"ok\":true}')}]),files=zip?rt.readZip(zip):null;
    checks.push(v35Check('Question Bank Backup ',bk?.build==='37.1-question-bank-backup-v2'&&files?.has('manifest.json')&&window.V371_BACKUP_STATUS?.legacyJson===true,'ZIP chunk + checksum + khôi phục theo chương + JSON cũ','fail'))
  }catch(err){checks.push(v35Check('Question Bank Backup ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{
    const rr=window.v372TikzRegression?.();
    checks.push(v35Check('TikZ Figure Support ',!!window.V372Tikz&&rr?.ok===true,rr?.ok?`SVG ${rr.engine} • ${rr.bytes} bytes`:'TikZ regression chưa đạt','fail'))
  }catch(err){checks.push(v35Check('TikZ Figure Support ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{
    const ge=window.V373Graph,rr=window.v373GraphRegression?.();
    checks.push(v35Check('Smart Graph Layout ',ge?.build==='37.3.3-smart-graph-layout'&&rr?.ok===true,rr?.ok?`3/3 họ hàm • preset ${rr.presetOk?'đạt':'chưa đạt'} • layout ${rr.layoutOk?'đạt':'chưa đạt'} • overlap ${rr.labelOverlaps}`:'Graph regression chưa đạt','fail'))
  }catch(err){checks.push(v35Check('Smart Graph Layout ',false,v35SanitizeErrorText(err?.message),'fail'))}
  try{
    const rr=window.v3736VariationRegression?.();
    checks.push(v35Check('Variation Arrow Rendering ',rr?.ok===true,rr?.ok?`Bảng biến thiên ${rr.segments} đoạn • ${rr.heads} đầu mũi tên • đầu ${rr.headPx}px cố định khi zoom`:' regression chưa đạt','fail'))
  }catch(err){checks.push(v35Check('Variation Arrow Rendering ',false,v35SanitizeErrorText(err?.message),'fail'))}
  let fail=checks.filter(x=>x.level==='fail').length,warn=checks.filter(x=>x.level==='warn').length,pass=checks.filter(x=>x.level==='pass').length;
  v35RegressionLast={at:v35Now(),pass,warn,fail,checks};if(render)v35RenderProductionCenter();if(toast)examToast?.(fail?`: còn ${fail} lỗi kiểm tra`:`: ${pass} kiểm tra đạt${warn?`, ${warn} cảnh báo`:''}`);return v35RegressionLast
}

function v35StatusChip(level,text){return `<span class="v35-status ${level}">${esc(text)}</span>`}
function v35RenderProductionCenter(){
  let result=v35RegressionLast,reg=document.getElementById('v35MetricRegression'),app=document.getElementById('v35MetricAppCheck'),pwa=document.getElementById('v35MetricPWA'),lazy=document.getElementById('v35MetricLazy'),errors=document.getElementById('v35MetricErrors');
  if(reg)reg.textContent=result?(result.fail?`${result.fail} lỗi`:`${result.pass} đạt`):'Chưa chạy';
  if(app){let key=String(window.MATH12_APP_CHECK_SITE_KEY||'').trim();app.textContent=key?(typeof firebaseAppCheckStatus!=='undefined'&&firebaseAppCheckStatus==='active'?'Đang bật':'Đang kiểm tra'):'Chưa cấu hình'}
  if(pwa)pwa.textContent=v35ServiceWorkerState==='ready'?'Sẵn sàng':v35ServiceWorkerState==='unsupported'?'Không hỗ trợ':v35ServiceWorkerState==='error'?'Có lỗi':'Đang kiểm tra';
  if(lazy){let loaded=['xlsx','ai','reports'].filter(v35FeatureReady).length;lazy.textContent=`${3-loaded}/3 hoãn tải`}
  if(errors)errors.textContent=String(v35RuntimeIssues.length);
  let box=document.getElementById('v35RegressionList');if(box&&result){box.innerHTML=result.checks.map(x=>`<div class="v35-check-row"><div>${v35StatusChip(x.level,x.level==='pass'?'ĐẠT':x.level==='warn'?'CẢNH BÁO':'LỖI')}<b>${esc(x.name)}</b></div><span>${esc(x.detail)}</span></div>`).join('')}
  let errBox=document.getElementById('v35RuntimeIssues');if(errBox){errBox.innerHTML=v35RuntimeIssues.length?v35RuntimeIssues.slice(0,8).map(x=>`<div class="v35-issue-row"><b>${esc(x.kind)}</b><span>${esc(x.message)}</span><small>${new Date(x.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</small></div>`).join(''):'<div class="online-empty">Chưa ghi nhận lỗi JavaScript trong phiên.</div>'}
}

function v35ClearRuntimeIssues(){
  v35RuntimeIssues.length=0;
  try{sessionStorage.removeItem('math12hub-v35-runtime-issues')}catch(_){}
  v35RenderProductionCenter();
  examToast?.('Đã xóa lỗi runtime đã ghi nhận trong phiên.');
}

function v35Diagnostics(){
  let base=typeof v34Diagnostics==='function'?v34Diagnostics():{};
  return {...base,appVersion:APP_VERSION,hardeningSchema:V35_HARDENING_SCHEMA,build:V35_BUILD,v35:{createdAt:v35Now(),serviceWorker:v35ServiceWorkerState,features:{xlsx:v35FeatureReady('xlsx'),ai:v35FeatureReady('ai'),reports:v35FeatureReady('reports')},regression:v35RegressionLast,runtimeIssues:v35RuntimeIssues.slice(0,20)}}
}
function v35ExportDiagnostics(){
  let payload=v35Diagnostics(),name=`math12hub-v37.4-diagnostics-${new Date().toISOString().slice(0,10)}.json`;
  if(typeof triggerJsonDownload==='function')return triggerJsonDownload(payload,name);
  let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

function v35EnhanceAccessibility(){
  document.documentElement.lang='vi';
  let modal=document.querySelector('#modalBackdrop .modal');if(modal){modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','modalTitle')}
  document.getElementById('nav')?.setAttribute('aria-label','Điều hướng chính');
  document.getElementById('mobileOverlay')?.setAttribute('aria-hidden','true');
  document.querySelectorAll('button').forEach(b=>{if(!b.getAttribute('aria-label')){let t=(b.textContent||b.title||'').replace(/\s+/g,' ').trim();if(t)b.setAttribute('aria-label',t.slice(0,140))}});
  document.querySelectorAll('input,select,textarea').forEach((el,i)=>{
    if(!el.id)el.id=`v35-field-${i+1}`;
    if(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby'))return;
    let wrapped=el.closest('label');if(wrapped){if(!wrapped.htmlFor)wrapped.htmlFor=el.id;return}
    let prev=el.previousElementSibling;if(prev?.tagName==='LABEL'){prev.htmlFor=el.id;let text=(prev.textContent||'').trim();if(text)el.setAttribute('aria-label',text)}
    else if(el.placeholder)el.setAttribute('aria-label',el.placeholder)
  })
}
function v35UpdateConnectivity(){
  let b=document.getElementById('v35Connectivity');if(!b){b=document.createElement('div');b.id='v35Connectivity';b.className='v35-connectivity hidden';b.setAttribute('role','status');b.setAttribute('aria-live','polite');document.body.appendChild(b)}
  if(navigator.onLine){b.classList.add('hidden');b.textContent=''}else{b.classList.remove('hidden');b.textContent='Đang ngoại tuyến • dữ liệu trên máy vẫn dùng được; đồng bộ Firebase sẽ tiếp tục khi có mạng.'}
}
window.addEventListener('online',v35UpdateConnectivity);window.addEventListener('offline',v35UpdateConnectivity);

async function v35RegisterServiceWorker(){
  if(!('serviceWorker' in navigator)){v35ServiceWorkerState='unsupported';v35RenderProductionCenter();return}
  if(!/^https?:$/.test(location.protocol)){v35ServiceWorkerState='unsupported';v35RenderProductionCenter();return}
  try{let reg=await navigator.serviceWorker.register('./sw-v39.js?v=40.0',{scope:'./',updateViaCache:'none'});v35ServiceWorkerState='ready';reg.update?.().catch(()=>{});v35RenderProductionCenter()}catch(err){v35ServiceWorkerState='error';v35CaptureIssue('service-worker',err)}
}

function v35Init(){
  v35EnhanceAccessibility();v35UpdateConnectivity();v35RegisterServiceWorker();
  setTimeout(()=>v35RunRegressionChecks({render:true}),900)
}
window.addEventListener('load',v35Init,{once:true});
