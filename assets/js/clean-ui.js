/* Product-facing UI cleanup. Internal build identifiers remain untouched for cache/runtime compatibility. */
(function(){
  'use strict';
  const VERSION_RE=/\bV\d{2}(?:\.\d+)*(?:[-A-Za-z0-9.]*)?\b/gi;
  const TECH_ONLY=/^(?:[\s•·|—–-]*(?:PRODUCTION(?:\s+RELEASE)?|LIVE|VISUAL|CHIBI\s+HD)[\s•·|—–-]*)+$/i;
  const SKIP=new Set(['SCRIPT','STYLE','CODE','PRE','TEXTAREA']);
  function cleanText(input){
    let s=String(input||'');
    const original=s;
    s=s.replace(/\bProduction\s+Release\b/gi,'')
       .replace(/\bProduction\s+Center\b/gi,'Trung tâm vận hành')
       .replace(/\bLỗi runtime phiên này\b/gi,'Lỗi phiên này')
       .replace(/\bLỗi runtime\b/gi,'Lỗi hệ thống')
       .replace(/\bExam Engine Pro\b/gi,'Tạo nhiều mã đề')
       .replace(/\bKiểm tra engine hình\b/gi,'Kiểm tra hình')
       .replace(/\bProduction Hình\b/gi,'Quản lý hình')
       .replace(/\bPRODUCTION\s+HEALTH\b/gi,'TRẠNG THÁI HỆ THỐNG')
       .replace(/\bCONTENT\s+PRODUCTION\b/gi,'NỘI DUNG HỌC TẬP')
       .replace(/\bLEARNING\s+PLATFORM\b/gi,'NỀN TẢNG HỌC TOÁN')
       .replace(/\bCHIBI\s+HD\b/gi,'')
       .replace(/\bLIVE\b/gi,'')
       .replace(/\bVISUAL\b/gi,'')
       .replace(VERSION_RE,'')
       .replace(/\s*•\s*(?=•|$)/g,'')
       .replace(/^\s*[•·|—–-]+\s*/,'')
       .replace(/\s*[•·|]+\s*$/,'')
       .replace(/\s+([,.;:!?])/g,'$1')
       .replace(/[ \t]{2,}/g,' ');
    if(/^\s*V\d{2}/i.test(original)){
      const i=s.search(/[A-Za-zÀ-ỹĐđ]/);
      if(i>=0) s=s.slice(0,i)+s.charAt(i).toUpperCase()+s.slice(i+1);
    }
    return s;
  }
  function scrubElement(el){
    if(!el||el.nodeType!==1||SKIP.has(el.tagName)) return;
    ['title','aria-label','placeholder'].forEach(a=>{if(el.hasAttribute&&el.hasAttribute(a)){const v=el.getAttribute(a),c=cleanText(v);if(c!==v)el.setAttribute(a,c)}});
    const raw=(el.textContent||'').trim();
    if(raw&&TECH_ONLY.test(raw)) el.style.setProperty('display','none','important');
  }
  function scrub(root){
    if(!root) return;
    if(root.nodeType===3){
      const p=root.parentElement;if(!p||SKIP.has(p.tagName))return;
      const v=root.nodeValue,c=cleanText(v);if(c!==v)root.nodeValue=c;return;
    }
    scrubElement(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    let n;while((n=walker.nextNode())){if(n.nodeType===3){const p=n.parentElement;if(!p||SKIP.has(p.tagName))continue;const v=n.nodeValue,c=cleanText(v);if(c!==v)n.nodeValue=c}else scrubElement(n)}
  }
  function productCopy(){
    document.title='Math12 Hub 2026–2027';
    document.querySelectorAll('#v28NextActionReason').forEach(el=>{const desired='Ưu tiên được xác định từ tiến độ học, câu sai và các nội dung em cần củng cố.';if(/Mastery Score|Scale|hoãn tải/i.test(el.textContent||'')&&el.textContent!==desired)el.textContent=desired;});
    document.querySelectorAll('#page-avatar .section-head p').forEach(el=>{const desired='Tùy chỉnh nhân vật, tích lũy EXP, cấp độ và vàng trong quá trình học.';if(/EXP|cấp độ|Shop|V\d/i.test(el.textContent||'')&&el.textContent!==desired)el.textContent=desired;});
  }
  function run(){scrub(document.body);productCopy()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  const obs=new MutationObserver(list=>{for(const m of list){if(m.type==='characterData')scrub(m.target);else m.addedNodes.forEach(scrub)}productCopy()});
  const start=()=>document.body&&obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
  window.Math12CleanUI={cleanText,scrub,run};
})();
