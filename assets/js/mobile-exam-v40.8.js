/* =========================================================
   Math12 Hub V40.8 — Mobile Exam UX
   - Thanh điều hướng câu hỏi cố định ở đáy màn hình điện thoại
   - Không cần kéo xuống cuối câu để sang câu tiếp theo
   - Tương thích Visual Viewport / bàn phím ảo / safe-area
   - Drawer danh sách câu tối ưu cho màn hình nhỏ
   - Chỉ bổ sung lớp UX; giữ nguyên engine thi, chấm điểm và dữ liệu V40.7
   ========================================================= */
(function(){
  'use strict';
  const VERSION='40.8', BUILD='40.8-mobile-exam-ux';
  let installed=false, base={};

  const mobile=()=>window.matchMedia?.('(max-width: 900px)')?.matches;
  const app=()=>document.getElementById('examApp');
  const view=()=>document.getElementById('examView');
  const session=()=>{try{return typeof examSession!=='undefined'?examSession:null}catch(_){return null}};

  function questionStatus(){
    const s=session();
    if(!s?.config?.questions?.length)return 'empty';
    const q=s.config.questions[s.current], a=s.answers?.[s.current];
    try{return typeof window.examQuestionStatus==='function'?window.examQuestionStatus(q,a):((a==null||a==='')?'empty':'answered')}catch(_){return 'empty'}
  }

  function statusText(st){
    if(st==='answered')return 'Đã trả lời';
    if(st==='partial')return 'Đang trả lời';
    return 'Chưa trả lời';
  }

  function ensureBar(){
    const s=session(), v=view();
    if(!s?.startedAt || s.submitted || !v?.querySelector('.exam-body')){removeBar();return null}
    let bar=document.getElementById('v408MobileExamNav');
    if(!bar){
      bar=document.createElement('nav');
      bar.id='v408MobileExamNav';
      bar.className='v408-mobile-exam-nav';
      bar.setAttribute('aria-label','Điều hướng câu hỏi trên điện thoại');
      bar.innerHTML=`
        <button type="button" id="v408PrevBtn" class="v408-mobile-nav-btn v408-prev" onclick="moveExamQuestion(-1)" aria-label="Câu trước">
          <span class="v408-nav-arrow">←</span><span class="v408-nav-word">Trước</span>
        </button>
        <button type="button" id="v408QuestionBtn" class="v408-mobile-question-btn" onclick="toggleExamNavigatorMobile()" aria-label="Mở danh sách câu hỏi">
          <b id="v408QuestionLabel">Câu 1/1</b>
          <small id="v408QuestionStatus">Chưa trả lời</small>
        </button>
        <button type="button" id="v408NextBtn" class="v408-mobile-nav-btn v408-next" onclick="moveExamQuestion(1)" aria-label="Câu tiếp theo">
          <span class="v408-nav-word" id="v408NextWord">Tiếp</span><span class="v408-nav-arrow">→</span>
        </button>`;
      v.appendChild(bar);
    }
    updateBar();
    return bar;
  }

  function removeBar(){document.getElementById('v408MobileExamNav')?.remove()}

  function updateBar(){
    const s=session(), bar=document.getElementById('v408MobileExamNav');
    if(!s?.config?.questions?.length || !bar)return;
    const n=s.config.questions.length, i=Math.max(0,Math.min(n-1,Number(s.current)||0)), st=questionStatus();
    const prev=document.getElementById('v408PrevBtn'), next=document.getElementById('v408NextBtn');
    const ql=document.getElementById('v408QuestionLabel'), qs=document.getElementById('v408QuestionStatus'), nw=document.getElementById('v408NextWord');
    if(ql)ql.textContent=`Câu ${i+1}/${n}`;
    if(qs){qs.textContent=statusText(st);qs.dataset.status=st}
    if(prev){prev.disabled=i===0;prev.setAttribute('aria-disabled',String(i===0))}
    if(next){next.classList.toggle('overview',i===n-1);next.setAttribute('aria-label',i===n-1?'Mở tổng quan bài làm':'Câu tiếp theo')}
    if(nw)nw.textContent=i===n-1?'Tổng quan':'Tiếp';
    bar.dataset.current=String(i+1);bar.dataset.total=String(n);
  }

  function decorateDrawer(){
    const side=document.getElementById('examSide');
    if(!side)return;
    if(!side.querySelector('.v408-side-close')){
      const b=document.createElement('button');
      b.type='button';b.className='v408-side-close';b.setAttribute('aria-label','Đóng danh sách câu hỏi');b.textContent='×';
      b.onclick=()=>window.toggleExamNavigatorMobile?.();
      side.prepend(b);
    }
  }

  function syncViewport(){
    const el=app(); if(!el)return;
    if(!mobile()){
      el.classList.remove('v408-mobile-viewport');
      el.style.removeProperty('--v408-visual-height');
      el.style.removeProperty('--v408-visual-top');
      return;
    }
    const vv=window.visualViewport;
    const h=Math.max(320,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||640));
    const top=Math.max(0,Math.round(vv?.offsetTop||0));
    el.style.setProperty('--v408-visual-height',`${h}px`);
    el.style.setProperty('--v408-visual-top',`${top}px`);
    el.classList.add('v408-mobile-viewport');
  }

  function afterRender(){
    syncViewport();
    ensureBar();
    decorateDrawer();
    document.documentElement.dataset.mobileExamBuild=BUILD;
  }

  function install(){
    if(installed)return;installed=true;
    base={
      renderRunner:window.renderExamRunner,
      renderCurrent:window.renderCurrentExamQuestion,
      renderNav:window.renderExamNavigator,
      move:window.moveExamQuestion,
      go:window.goExamQuestion,
      close:window.closeExamApp,
      renderResult:window.renderExamResult,
      renderSecure:window.renderSecureAssignmentSubmitted
    };

    if(typeof base.renderRunner==='function')window.renderExamRunner=function(){const r=base.renderRunner.apply(this,arguments);afterRender();return r};
    if(typeof base.renderCurrent==='function')window.renderCurrentExamQuestion=function(){const r=base.renderCurrent.apply(this,arguments);ensureBar();updateBar();return r};
    if(typeof base.renderNav==='function')window.renderExamNavigator=function(){const r=base.renderNav.apply(this,arguments);decorateDrawer();ensureBar();updateBar();return r};
    if(typeof base.move==='function')window.moveExamQuestion=function(){const r=base.move.apply(this,arguments);afterRender();return r};
    if(typeof base.go==='function')window.goExamQuestion=function(){const r=base.go.apply(this,arguments);afterRender();return r};
    if(typeof base.close==='function')window.closeExamApp=function(){removeBar();const r=base.close.apply(this,arguments);syncViewport();return r};
    if(typeof base.renderResult==='function')window.renderExamResult=function(){removeBar();return base.renderResult.apply(this,arguments)};
    if(typeof base.renderSecure==='function')window.renderSecureAssignmentSubmitted=function(){removeBar();return base.renderSecure.apply(this,arguments)};

    // Trạng thái của câu trả lời ngắn thay đổi ngay cả khi không dựng lại câu hỏi.
    document.addEventListener('input',e=>{if(e.target?.classList?.contains('exam-short-input'))updateBar()},{passive:true});

    // VisualViewport giúp thanh đáy vẫn nằm trên vùng nhìn thấy khi thanh trình duyệt
    // hoặc bàn phím ảo làm thay đổi chiều cao màn hình trên iOS/Android.
    window.visualViewport?.addEventListener('resize',syncViewport,{passive:true});
    window.visualViewport?.addEventListener('scroll',syncViewport,{passive:true});
    window.addEventListener('resize',syncViewport,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(syncViewport,120),{passive:true});

    syncViewport();
    if(session()?.startedAt)afterRender();
  }

  window.MobileExamV408={version:VERSION,build:BUILD,install,ensureBar,updateBar,syncViewport};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
