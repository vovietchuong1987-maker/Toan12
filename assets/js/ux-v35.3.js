/* Math12 Hub  — UX Polish
   Role dashboards • mobile bottom navigation • breadcrumb • autosave state
   • skeleton loading • smart empty states • unified success toasts • table hints.
*/
(function(){
  'use strict';
  const BUILD='35.3-ux-polish';
  const HEAVY_PAGES=new Set(['reports','admin','question-bank','ai-teacher']);
  const PAGE_META={
    dashboard:{title:'Tổng quan',group:'Trang chủ'},
    'learning-plan':{title:'Lộ trình của em',group:'Cá nhân'},
    avatar:{title:'Nhân vật của em',group:'Cá nhân'},
    lessons:{title:'Học theo bài',group:'Học tập'},
    'lesson-detail':{title:'Chi tiết bài học',group:'Học tập'},
    chapters:{title:'Ôn theo chương',group:'Học tập'},
    periodic:{title:'Kiểm tra định kỳ',group:'Luyện & thi'},
    thpt:{title:'Ôn thi THPT',group:'Luyện & thi'},
    progress:{title:'Tiến độ của em',group:'Cá nhân'},
    analytics:{title:'Phân tích năng lực',group:'Cá nhân'},
    reports:{title:'Báo cáo học tập',group:'Báo cáo'},
    notifications:{title:'Thông báo',group:'Kết nối'},
    'question-bank':{title:'Ngân hàng câu hỏi',group:'Công cụ giáo viên'},
    'exam-builder':{title:'Tạo đề kiểm tra',group:'Công cụ giáo viên'},
    'ai-teacher':{title:'Trợ lý AI',group:'Công cụ giáo viên'},
    admin:{title:'Quản trị hệ thống',group:'Hệ thống'}
  };
  let skeletonTimer=0;

  function role(){
    try{return typeof currentSecureRole==='function'?currentSecureRole():'student'}catch(_){return 'student'}
  }
  function currentPage(){return document.querySelector('.section.active')?.id?.replace(/^page-/,'')||'dashboard'}
  function roleLabel(r=role()){return r==='admin'?'Quản trị viên':r==='teacher'?'Giáo viên':'Học sinh'}
  function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text}
  function safeCount(v){return Array.isArray(v)?v.length:0}

  function toast(message,type='success',duration=2600){
    const region=document.getElementById('v353ToastRegion');if(!region)return;
    const el=document.createElement('div');el.className=`v353-toast ${type}`;el.setAttribute('role','status');
    const icon=type==='error'?'!':type==='warn'?'⚠':'✓';
    el.innerHTML=`<span class="v353-toast-icon">${icon}</span><span>${typeof esc==='function'?esc(message):String(message)}</span>`;
    region.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220)},duration);
  }
  window.v353Toast=toast;

  function installSuccessAlertBridge(){
    if(window.__v353AlertBridge)return;window.__v353AlertBridge=true;
    const nativeAlert=window.alert.bind(window);window.__v353NativeAlert=nativeAlert;
    window.alert=function(msg){
      const s=String(msg??'').trim();
      const shortSuccess=/^(Đã\b|Thành công\b|Hoàn tất\b|✓)/i.test(s) && s.length<=160;
      const important=/(không|lỗi|thất bại|từ chối|hãy\b|mã tham gia|mật khẩu|khôi phục|xác minh)/i.test(s);
      if(shortSuccess&&!important){toast(s,'success',Math.min(4200,2200+Math.floor(s.length*10)));return;}
      return nativeAlert(msg);
    };
  }

  function setSaveState(kind='idle',detail=''){
    const box=document.getElementById('v353SaveState');if(!box)return;
    const icon=box.querySelector('.v353-save-icon'),text=box.querySelector('.v353-save-text');
    box.className=`v353-save-state ${kind}`;
    if(kind==='saving'){if(icon)icon.textContent='○';if(text)text.textContent='Đang lưu…'}
    else if(kind==='offline'){if(icon)icon.textContent='↺';if(text)text.textContent='Ngoại tuyến • đã giữ trên máy'}
    else if(kind==='saved'){if(icon)icon.textContent='✓';if(text)text.textContent=detail||'Đã lưu trên máy'}
    else {if(icon)icon.textContent='✓';if(text)text.textContent='Tự lưu sẵn sàng'}
  }
  window.v353SetSaveState=setSaveState;

  function installAutosaveIndicator(){
    if(typeof window.save==='function'&&!window.save.__v353){
      const base=window.save;const wrapped=function(options={}){setSaveState('saving');const out=base(options);setTimeout(()=>setSaveState(navigator.onLine?'saved':'offline'),120);return out};wrapped.__v353=true;window.save=wrapped;
    }
    if(typeof window.saveExamDraft==='function'&&!window.saveExamDraft.__v353){
      const base=window.saveExamDraft;const wrapped=function(){setSaveState('saving');const out=base();setTimeout(()=>setSaveState(navigator.onLine?'saved':'offline','Đã tự lưu bài làm'),90);return out};wrapped.__v353=true;window.saveExamDraft=wrapped;
    }
    addEventListener('offline',()=>setSaveState('offline'),{passive:true});
    addEventListener('online',()=>setSaveState('saved','Đã có mạng • dữ liệu trên máy an toàn'),{passive:true});
    setSaveState(navigator.onLine?'idle':'offline');
  }

  function breadcrumb(page=currentPage()){
    const wrap=document.getElementById('v353Breadcrumb');if(!wrap)return;
    const meta=PAGE_META[page]||{title:document.getElementById('pageTitle')?.textContent||'Math12 Hub',group:''};
    let detail='';
    if(page==='lesson-detail'){
      try{const item=typeof getLesson==='function'?getLesson(activeLessonId):null;if(item)detail=item.common||activeLessonId}catch(_){ }
    }
    wrap.innerHTML=`<button type="button" onclick="goPage('dashboard')" aria-label="Về Tổng quan">⌂</button><span>›</span>${meta.group&&meta.group!==meta.title?`<span class="v353-crumb-group">${meta.group}</span><span>›</span>`:''}<b>${detail||meta.title}</b>`;
  }

  function updateMobileNav(page=currentPage()){
    const nav=document.getElementById('v353MobileNav');if(!nav)return;
    nav.dataset.role=role();
    nav.querySelectorAll('[data-mobile-page]').forEach(b=>b.classList.toggle('active',b.dataset.mobilePage===page));
    const roleBlock=nav.querySelector(`.v353-mobile-role[data-role="${role()}"]`);
    if(roleBlock&&!roleBlock.querySelector('.active'))roleBlock.querySelector('[data-mobile-more]')?.classList.add('active');
  }

  function refreshRoleDashboard(){
    const classes=typeof firebaseOwnedClasses!=='undefined'?safeCount(firebaseOwnedClasses):0;
    const bank=typeof state!=='undefined'?safeCount(state.questionBank):0;
    const exams=typeof state!=='undefined'?safeCount(state.customExams):0;
    const notices=typeof firebaseNotificationItems!=='undefined'?safeCount(firebaseNotificationItems):0;
    setText('v353TeacherClasses',String(classes));setText('v353TeacherBank',String(bank));setText('v353TeacherExams',String(exams));setText('v353TeacherNotices',String(notices));
    setText('v353AdminAppCheck',typeof firebaseAppCheckStatus!=='undefined'?(firebaseAppCheckStatus==='active'?'Đang bật':'Chưa bật'):'—');
    let runtimeCount=0;try{runtimeCount=Array.isArray(v35RuntimeIssues)?v35RuntimeIssues.length:0}catch(_){};setText('v353AdminRuntime',String(runtimeCount));
  }

  function emptyStateHTML(icon,title,text,action='',page=''){
    return `<div class="v353-empty"><div class="v353-empty-icon">${icon}</div><b>${title}</b><p>${text}</p>${action&&page?`<button class="btn btn-soft" onclick="goPage('${page}')">${action}</button>`:''}</div>`;
  }
  function enhanceEmptyStates(){
    const specs=[
      ['weakList','✓','Chưa có chủ đề cần cảnh báo','Hãy tiếp tục học để hệ thống xác định chính xác điểm cần củng cố.','Học theo bài','lessons'],
      ['v28TodayQueue','☀','Hôm nay chưa có việc gấp','Em có thể tiếp tục bài đang học hoặc luyện một đề ngắn.','Tiếp tục học','lessons'],
      ['v28WeeklyPlan','▦','Đang xây dựng lộ trình','Hệ thống sẽ cập nhật khi có thêm dữ liệu học tập.','Học theo bài','lessons'],
      ['v28MistakeBook','★','Sổ câu sai đang trống','Các câu làm sai sẽ tự xuất hiện ở đây để em luyện lại.','Luyện thi THPT','thpt']
    ];
    specs.forEach(([id,icon,title,text,action,page])=>{const el=document.getElementById(id);if(el&&!el.innerHTML.trim())el.innerHTML=emptyStateHTML(icon,title,text,action,page)});
  }

  function showSkeleton(page){
    if(!HEAVY_PAGES.has(page))return;
    const sec=document.getElementById('page-'+page);if(!sec||sec.querySelector(':scope > .v353-page-skeleton'))return;
    const sk=document.createElement('div');sk.className='v353-page-skeleton';sk.setAttribute('aria-hidden','true');
    sk.innerHTML='<div class="v353-sk-line wide"></div><div class="v353-sk-line mid"></div><div class="v353-sk-grid"><i></i><i></i><i></i></div><div class="v353-sk-card"></div>';
    sec.prepend(sk);sec.setAttribute('aria-busy','true');clearTimeout(skeletonTimer);skeletonTimer=setTimeout(()=>hideSkeleton(page),650);
  }
  function hideSkeleton(page=currentPage()){
    const sec=document.getElementById('page-'+page);sec?.querySelector(':scope > .v353-page-skeleton')?.remove();sec?.removeAttribute('aria-busy');
  }

  function enhanceTables(){
    document.querySelectorAll('.table-wrap').forEach(w=>{
      const overflow=w.scrollWidth>w.clientWidth+8;w.classList.toggle('v353-scrollable',overflow);
      let hint=w.querySelector(':scope > .v353-table-hint');
      if(innerWidth<=760&&overflow&&!hint){hint=document.createElement('div');hint.className='v353-table-hint';hint.textContent='← Vuốt ngang để xem thêm →';w.appendChild(hint);w.addEventListener('scroll',()=>{if(w.scrollLeft>8)hint?.classList.add('hidden')},{passive:true,once:false})}
      if((innerWidth>760||!overflow)&&hint)hint.remove();
    });
  }

  function applyAria(){
    document.querySelectorAll('#nav button[data-page]').forEach(b=>{if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.title||b.querySelector('.nav-label')?.textContent?.trim()||'Điều hướng')});
    document.getElementById('menuBtn')?.setAttribute('aria-label','Mở menu điều hướng');
  }

  function afterNavigate(page){
    requestAnimationFrame(()=>{
      breadcrumb(page);updateMobileNav(page);refreshRoleDashboard();enhanceEmptyStates();enhanceTables();
      if(page!=='lesson-detail'&&innerWidth>760)document.querySelector('.content')?.scrollTo?.({top:0,behavior:'auto'});
      else if(page!=='lesson-detail')window.scrollTo?.({top:0,behavior:'auto'});
      setTimeout(()=>hideSkeleton(page),HEAVY_PAGES.has(page)?520:0);
    });
  }

  function installNavigationHooks(){
    if(typeof window.goPage==='function'&&!window.goPage.__v353){
      const base=window.goPage;const wrapped=function(page,internal=false){showSkeleton(page);const out=base(page,internal);afterNavigate(page);return out};wrapped.__v353=true;window.goPage=wrapped;
    }
    if(typeof window.applyRoleAccess==='function'&&!window.applyRoleAccess.__v353){
      const base=window.applyRoleAccess;const wrapped=function(r='student',navigate=false){const out=base(r,navigate);requestAnimationFrame(()=>{document.documentElement.dataset.userRole=role();breadcrumb();updateMobileNav();refreshRoleDashboard();enhanceEmptyStates()});return out};wrapped.__v353=true;window.applyRoleAccess=wrapped;
    }
    if(typeof window.renderAll==='function'&&!window.renderAll.__v353){
      const base=window.renderAll;const wrapped=function(){const out=base();requestAnimationFrame(()=>{refreshRoleDashboard();enhanceEmptyStates();enhanceTables()});return out};wrapped.__v353=true;window.renderAll=wrapped;
    }
  }

  function bindMobileNav(){
    document.getElementById('v353MobileNav')?.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.mobilePage){goPage(b.dataset.mobilePage);return}
      if(b.hasAttribute('data-mobile-more')){typeof openSidebar==='function'&&openSidebar()}
    });
  }

  function init(){
    document.documentElement.dataset.uxBuild=BUILD;document.documentElement.dataset.userRole=role();
    installSuccessAlertBridge();installAutosaveIndicator();installNavigationHooks();bindMobileNav();applyAria();
    breadcrumb();updateMobileNav();refreshRoleDashboard();enhanceEmptyStates();enhanceTables();
    addEventListener('resize',()=>{enhanceTables();updateMobileNav()},{passive:true});
    // Dynamic Firestore/render changes can change table overflow and quick counts.
    const content=document.querySelector('.content');if(content){let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{enhanceTables();refreshRoleDashboard()},140)}).observe(content,{childList:true,subtree:true})}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
