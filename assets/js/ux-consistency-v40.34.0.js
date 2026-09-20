/* Math12 Hub v40.34.0 — UX Consistency & Teacher Workflow */
(function(){
'use strict';
const BUILD='40.34.0-ux-consistency-teacher-workflow';
const VERSION=403400;
const safeMode=new URLSearchParams(location.search).has('safe');
const nativeAlert=window.alert?.bind(window);
const dialogQueue=[];
let dialogBusy=false;
let lastFocus=null;

function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function text(v=''){return String(v??'').trim()}
function destructive(msg=''){return /(xóa|xoá|khóa|khoá|thu hồi|ghi đè|đặt lại|rời lớp|thùng rác|purge|delete|reset)/i.test(msg)}
function inferTone(msg=''){
  const s=text(msg);
  if(/^(đã|✓|thành công|hoàn tất|sao chép)/i.test(s))return 'success';
  if(/(lỗi|không thể|thất bại|permission|denied|invalid)/i.test(s))return 'error';
  if(/(chưa|hãy|cần|cảnh báo|không có|không tìm thấy|vui lòng)/i.test(s))return 'warn';
  return 'info';
}
function ensureRoot(){
  let root=document.getElementById('m12uiRoot');
  if(root)return root;
  root=document.createElement('div');root.id='m12uiRoot';
  root.innerHTML='<div id="m12uiToastStack" class="m12ui-toast-stack" aria-live="polite" aria-atomic="false"></div><div id="m12uiDialogLayer" class="m12ui-dialog-layer" aria-hidden="true"></div><div id="m12uiTopProgress" class="m12ui-top-progress" aria-hidden="true"><span></span></div>';
  document.body.appendChild(root);return root;
}
function toast(message,options={}){
  ensureRoot();const stack=document.getElementById('m12uiToastStack');if(!stack)return;
  const tone=options.tone||inferTone(message),item=document.createElement('div');item.className=`m12ui-toast ${tone}`;item.setAttribute('role',tone==='error'?'alert':'status');
  const icon={success:'✓',error:'!',warn:'!',info:'i'}[tone]||'i';
  item.innerHTML=`<span class="m12ui-toast-icon" aria-hidden="true">${icon}</span><div><b>${esc(options.title||({success:'Hoàn tất',error:'Có lỗi xảy ra',warn:'Cần chú ý',info:'Thông báo'}[tone]))}</b><p>${esc(text(message)).replace(/\n/g,'<br>')}</p></div><button type="button" aria-label="Đóng thông báo">×</button>`;
  const close=()=>{item.classList.add('leaving');setTimeout(()=>item.remove(),180)};item.querySelector('button').onclick=close;stack.appendChild(item);
  requestAnimationFrame(()=>item.classList.add('show'));const ms=Number(options.duration)||((tone==='error'||tone==='warn')?6500:4000);if(ms>0)setTimeout(close,ms);return item;
}
function alertUI(message,options={}){
  const s=text(message);if(!s)return;
  if(s.length>210||s.includes('\n\n')||options.modal)return void openDialog({kind:'alert',message:s,title:options.title||'Thông báo',tone:options.tone||inferTone(s)});
  toast(s,options);
}
function focusables(host){return [...host.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null)}
function dequeue(){if(dialogBusy||!dialogQueue.length)return;dialogBusy=true;const job=dialogQueue.shift();renderDialog(job)}
function openDialog(opts={}){return new Promise(resolve=>{dialogQueue.push({opts,resolve});dequeue()})}
function renderDialog(job){
  ensureRoot();const layer=document.getElementById('m12uiDialogLayer'),o=job.opts||{},kind=o.kind||'confirm',danger=o.danger??destructive(o.message),tone=o.tone||((danger&&kind!=='prompt')?'danger':'info');
  lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const title=o.title||(kind==='prompt'?'Nhập thông tin':kind==='alert'?'Thông báo':danger?'Xác nhận thao tác':'Xác nhận');
  const cancelLabel=o.cancelLabel||'Hủy',okLabel=o.okLabel||(danger?'Xác nhận':'Đồng ý');
  layer.innerHTML=`<div class="m12ui-dialog-backdrop" data-m12-dismiss="1"></div><section class="m12ui-dialog ${tone}" role="${kind==='alert'?'alertdialog':'dialog'}" aria-modal="true" aria-labelledby="m12uiDialogTitle" aria-describedby="m12uiDialogMessage"><div class="m12ui-dialog-head"><span class="m12ui-dialog-mark" aria-hidden="true">${danger?'!':kind==='prompt'?'✎':'✓'}</span><div><h3 id="m12uiDialogTitle">${esc(title)}</h3>${o.subtitle?`<small>${esc(o.subtitle)}</small>`:''}</div></div><div class="m12ui-dialog-body"><p id="m12uiDialogMessage">${esc(text(o.message)).replace(/\n/g,'<br>')}</p>${kind==='prompt'?`<label class="m12ui-prompt-label">${esc(o.inputLabel||'Nội dung')}<input id="m12uiPromptInput" autocomplete="off" value="${esc(o.defaultValue||'')}" ${o.placeholder?`placeholder="${esc(o.placeholder)}"`:''}></label>`:''}</div><div class="m12ui-dialog-actions">${kind==='alert'?'':`<button type="button" class="btn btn-soft" data-m12-cancel>${esc(cancelLabel)}</button>`}<button type="button" class="btn ${danger?'btn-danger':'btn-blue'}" data-m12-ok>${esc(kind==='alert'?'Đóng':okLabel)}</button></div></section>`;
  layer.classList.add('show');layer.setAttribute('aria-hidden','false');document.documentElement.classList.add('m12ui-dialog-open');
  const dialog=layer.querySelector('.m12ui-dialog'),input=layer.querySelector('#m12uiPromptInput'),ok=layer.querySelector('[data-m12-ok]'),cancel=layer.querySelector('[data-m12-cancel]');
  let finished=false;const finish=(value)=>{if(finished)return;finished=true;layer.removeEventListener('keydown',onKey);layer.classList.remove('show');layer.setAttribute('aria-hidden','true');document.documentElement.classList.remove('m12ui-dialog-open');setTimeout(()=>{layer.innerHTML='';dialogBusy=false;try{job.resolve(value)}finally{try{lastFocus?.focus?.({preventScroll:true})}catch(_){};dequeue()}},120)};
  ok.onclick=()=>finish(kind==='prompt'?(input?.value??''):true);if(cancel)cancel.onclick=()=>finish(kind==='prompt'?null:false);
  layer.querySelector('[data-m12-dismiss]')?.addEventListener('click',()=>{if(kind==='alert')finish(true);else finish(kind==='prompt'?null:false)});
  const onKey=e=>{if(!layer.classList.contains('show'))return;if(e.key==='Escape'){e.preventDefault();finish(kind==='alert'?true:kind==='prompt'?null:false);return}if(e.key==='Enter'&&kind==='prompt'&&document.activeElement===input){e.preventDefault();finish(input.value);return}if(e.key==='Tab'){const f=focusables(dialog);if(!f.length)return;const first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
  layer.addEventListener('keydown',onKey,{once:false});requestAnimationFrame(()=>{(input||ok)?.focus?.();if(input)input.select()});
}
function confirmUI(message,options={}){return openDialog({kind:'confirm',message:text(message),...options})}
function promptUI(message,defaultValue='',options={}){return openDialog({kind:'prompt',message:text(message),defaultValue:String(defaultValue??''),...options})}
function renderState(host,{type='empty',title='',message='',actionLabel='',onAction=null}={}){
  if(typeof host==='string')host=document.querySelector(host);if(!host)return null;
  const icon={loading:'',empty:'○',error:'!',success:'✓',offline:'↯'}[type]||'○';
  host.classList.add('m12ui-state-host');host.dataset.m12State=type;host.setAttribute('role',type==='error'?'alert':'status');host.setAttribute('aria-live','polite');
  host.innerHTML=`<div class="m12ui-state ${esc(type)}"><span class="m12ui-state-icon" aria-hidden="true">${icon}</span><div>${title?`<b>${esc(title)}</b>`:''}${message?`<p>${esc(message)}</p>`:''}</div>${actionLabel?`<button type="button" class="btn btn-soft">${esc(actionLabel)}</button>`:''}</div>`;
  if(actionLabel&&typeof onAction==='function')host.querySelector('button').onclick=onAction;return host;
}
function classifyStateNode(el){
  const s=text(el.textContent).toLowerCase();if(!s)return 'empty';
  if(/đang |đang tải|đang chuẩn bị|đang kiểm tra|đang đồng bộ|vui lòng chờ/.test(s))return 'loading';
  if(/lỗi|không thể|permission|mất quyền|thất bại/.test(s))return 'error';
  if(/đã |hoàn tất|sẵn sàng/.test(s)&&!/chưa/.test(s))return 'success';
  return 'empty';
}
function decorateStateNode(el){if(!(el instanceof HTMLElement)||el.closest('#m12uiRoot'))return;const type=classifyStateNode(el);el.dataset.m12State=type;el.setAttribute('role',type==='error'?'alert':'status');el.setAttribute('aria-live','polite')}
function scanStates(root=document){root.querySelectorAll?.('.online-empty,.teacher-live-empty,.analytics-empty,.avatar-studio-empty-look,.v35-check-list .online-empty').forEach(decorateStateNode)}
function installStateObserver(){scanStates();const mo=new MutationObserver(ms=>{for(const m of ms){if(m.target instanceof HTMLElement&&m.target.matches?.('.online-empty,.teacher-live-empty,.analytics-empty,.avatar-studio-empty-look'))decorateStateNode(m.target);m.addedNodes.forEach(n=>{if(n instanceof HTMLElement){if(n.matches?.('.online-empty,.teacher-live-empty,.analytics-empty,.avatar-studio-empty-look'))decorateStateNode(n);scanStates(n)}})}});mo.observe(document.body,{subtree:true,childList:true,characterData:true});return mo}
function topProgress(on=true){ensureRoot();const bar=document.getElementById('m12uiTopProgress');if(!bar)return;bar.classList.toggle('active',!!on);bar.setAttribute('aria-hidden',on?'false':'true');if(!on)setTimeout(()=>bar.classList.remove('finishing'),180)}

const teacherPages=new Set(['question-bank','exam-builder','ai-teacher','notifications','online','teacher','reports','lessons','chapters','periodic','thpt']);
function role(){try{return typeof currentSecureRole==='function'?currentSecureRole():(window.firebaseProfile?.role||'student')}catch(_){return window.firebaseProfile?.role||'student'}}
function rememberTeacherPage(page){if(!teacherPages.has(page)||!['teacher','admin'].includes(role()))return;let arr=[];try{arr=JSON.parse(localStorage.getItem('math12hub-v4034-teacher-recent')||'[]')}catch(_){};arr=[page,...arr.filter(x=>x!==page)].slice(0,4);localStorage.setItem('math12hub-v4034-teacher-recent',JSON.stringify(arr));renderTeacherWorkflow()}
function teacherStepData(){
  const classroom=!!document.getElementById('page-online')&&!!document.getElementById('page-teacher');
  if(classroom)return [
    ['1','Ngân hàng','Chuẩn bị câu hỏi','question-bank'],['2','Tạo đề','Ghép đề theo mục tiêu','exam-builder'],['3','Giao lớp','Chọn lớp và hạn nộp','online'],['4','Theo dõi','Tiến độ và bài thiếu','teacher'],['5','Phân tích','Xem kết quả xác minh','reports'],['6','Can thiệp','Giao việc bù / nhắc học','notifications']
  ];
  return [
    ['1','Ngân hàng','Làm sạch & kiểm duyệt','question-bank'],['2','Tạo đề','Ghép đề theo ma trận','exam-builder'],['3','Trợ lý AI','Soạn & rà câu hỏi','ai-teacher'],['4','Xem như học sinh','Kiểm tra luồng học','lessons'],['5','Luyện đề','Kiểm tra trải nghiệm thi','thpt'],['6','Thông báo','Rà nội dung cần chú ý','notifications']
  ];
}
function labelForPage(p){return ({'question-bank':'Ngân hàng','exam-builder':'Tạo đề','ai-teacher':'Trợ lý AI','notifications':'Thông báo',online:'Giao lớp',teacher:'Theo dõi lớp',reports:'Báo cáo',lessons:'Bài học',chapters:'Chương',periodic:'Định kỳ',thpt:'Luyện đề'})[p]||p}
function renderTeacherWorkflow(){
  const dash=document.getElementById('page-dashboard');if(!dash)return;let host=document.getElementById('v4034TeacherWorkflow');
  const show=['teacher','admin'].includes(role());if(!show){host?.remove();return}
  if(!host){host=document.createElement('section');host.id='v4034TeacherWorkflow';host.className='teacher-only v4034-teacher-workflow';const anchor=dash.querySelector('.teacher-only.hero');if(anchor)anchor.insertAdjacentElement('afterend',host);else dash.prepend(host)}
  let recent=[];try{recent=JSON.parse(localStorage.getItem('math12hub-v4034-teacher-recent')||'[]')}catch(_){}
  const steps=teacherStepData();host.innerHTML=`<div class="v4034-workflow-head"><div><span class="v4034-kicker">QUY TRÌNH GIÁO VIÊN</span><h3>Tiếp tục công việc theo đúng thứ tự</h3><p>Ưu tiên một luồng rõ ràng thay vì phải tìm chức năng trong nhiều menu.</p></div>${recent.length?`<div class="v4034-recent"><small>Gần đây</small>${recent.map(p=>`<button type="button" data-v4034-page="${esc(p)}">${esc(labelForPage(p))}</button>`).join('')}</div>`:''}</div><div class="v4034-stepper">${steps.map(([n,title,sub,page],i)=>`<button type="button" class="v4034-step" data-v4034-page="${esc(page)}"><span class="v4034-step-no">${n}</span><span><b>${esc(title)}</b><small>${esc(sub)}</small></span>${i<steps.length-1?'<i aria-hidden="true">→</i>':''}</button>`).join('')}</div>`;
  host.querySelectorAll('[data-v4034-page]').forEach(b=>b.onclick=()=>{const p=b.dataset.v4034Page;rememberTeacherPage(p);window.goPage?.(p)});
}
function wrapNavigation(){
  const tryWrap=()=>{const base=window.goPage;if(typeof base!=='function'||base.__v4034)return false;const w=function(page,...rest){topProgress(true);rememberTeacherPage(page);let out;try{out=base.call(this,page,...rest)}finally{requestAnimationFrame(()=>setTimeout(()=>topProgress(false),120))}return out};w.__v4034=true;w.__base=base;window.goPage=w;return true};
  if(!tryWrap()){let n=0;const t=setInterval(()=>{if(tryWrap()||++n>30)clearInterval(t)},100)}
}
function installAlertBridge(){
  window.alert=function(message){alertUI(message);return undefined};
  window.Math12NativeAlert=nativeAlert;
}
function install(){
  ensureRoot();installAlertBridge();installStateObserver();
  if(!safeMode){wrapNavigation();setTimeout(renderTeacherWorkflow,350);}
  window.addEventListener('math12hub:account-hydrated',()=>{if(!safeMode)setTimeout(renderTeacherWorkflow,80)});
  window.addEventListener('storage',e=>{if(e.key==='math12hub-v4034-teacher-recent')renderTeacherWorkflow()});
  document.documentElement.dataset.uxConsistency='40.34';
}

window.Math12UI={build:BUILD,version:VERSION,toast,notify:alertUI,alert:alertUI,confirm:confirmUI,prompt:promptUI,state:renderState,scanStates,topProgress,teacherWorkflow:renderTeacherWorkflow};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
