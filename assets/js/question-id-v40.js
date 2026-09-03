/* Permanent Question ID — stable user-facing IDs without changing legacy record keys. */
(function(){
  'use strict';
  const KEY='math12hub_question_id_registry_v1';
  const PREFIX='Q';
  const WIDTH=6;
  const RE=/^Q(\d{6,})$/;
  const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch(_){return x}};
  function parse(id){const m=String(id||'').trim().toUpperCase().match(RE);return m?Number(m[1])||0:0}
  function format(n){return PREFIX+String(Math.max(1,Number(n)||1)).padStart(WIDTH,'0')}
  function registry(){
    let r={highWater:0,issued:{}};
    try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&typeof x==='object')r={highWater:Number(x.highWater)||0,issued:x.issued&&typeof x.issued==='object'?x.issued:{}}}catch(_){}
    return r;
  }
  function saveRegistry(r){
    try{localStorage.setItem(KEY,JSON.stringify({highWater:Number(r.highWater)||0,issued:r.issued||{}}))}catch(_){}
    if(typeof state!=='undefined'){
      state._meta=state._meta||{};
      state._meta.questionIdHighWater=Math.max(Number(state._meta.questionIdHighWater)||0,Number(r.highWater)||0);
    }
  }
  function allKnownQuestions(){
    const out=[];
    try{if(Array.isArray(window.MATH12_ALL_PRACTICE_BANK))out.push(...window.MATH12_ALL_PRACTICE_BANK)}catch(_){}
    try{if(typeof state!=='undefined'&&Array.isArray(state.questionBank))out.push(...state.questionBank)}catch(_){}
    try{if(typeof state!=='undefined'&&Array.isArray(state.recycleBinV26?.questions))out.push(...state.recycleBinV26.questions.map(x=>x?.data||x).filter(Boolean))}catch(_){}
    return out;
  }
  function currentHighWater(){
    const r=registry();let high=Math.max(Number(r.highWater)||0,Number(typeof state!=='undefined'?state?._meta?.questionIdHighWater:0)||0);
    for(const q of allKnownQuestions())high=Math.max(high,parse(q?.questionId));
    return high;
  }
  function publishedMap(){
    const map=new Map();
    try{for(const q of window.MATH12_ALL_PRACTICE_BANK||[])if(q?.id&&parse(q.questionId))map.set(String(q.id),String(q.questionId).toUpperCase())}catch(_){}
    return map;
  }
  function usedMap(extra=[]){
    const map=new Map();
    for(const q of [...allKnownQuestions(),...(Array.isArray(extra)?extra:[])]){
      const qid=String(q?.questionId||'').toUpperCase();if(parse(qid)&&q?.id&&!map.has(qid))map.set(qid,String(q.id));
    }
    const r=registry();for(const [qid,id] of Object.entries(r.issued||{}))if(parse(qid)&&!map.has(qid))map.set(qid,String(id||''));
    return map;
  }
  function reserve(qid,recordId=''){
    qid=String(qid||'').toUpperCase();const n=parse(qid);if(!n)return '';
    const r=registry();r.highWater=Math.max(Number(r.highWater)||0,n);r.issued=r.issued||{};r.issued[qid]=String(recordId||r.issued[qid]||'');saveRegistry(r);return qid;
  }
  function next(recordId=''){
    const r=registry();let n=Math.max(currentHighWater(),Number(r.highWater)||0)+1,qid=format(n),used=usedMap();
    while(used.has(qid)){qid=format(++n)}
    r.highWater=n;r.issued=r.issued||{};r.issued[qid]=String(recordId||'');saveRegistry(r);return qid;
  }
  function ensure(q,{used=null,preserve='',allowAllocate=true}={}){
    if(!q||typeof q!=='object')return '';
    const recordId=String(q.id||'');
    const pub=publishedMap().get(recordId)||'';
    let qid=String(preserve||q.questionId||pub||'').trim().toUpperCase();
    const occupied=used||usedMap([q]);
    if(parse(qid)){
      const owner=occupied.get(qid);
      if(!owner||owner===recordId||String(preserve||'').toUpperCase()===qid){q.questionId=qid;reserve(qid,recordId);return qid}
    }
    if(!allowAllocate)return '';
    qid=next(recordId);q.questionId=qid;reserve(qid,recordId);return qid;
  }
  function ensureBank(bank,{saveChanges=false,reason='permanent-question-id'}={}){
    if(!Array.isArray(bank))return {changed:false,count:0,highWater:currentHighWater()};
    let changed=false,count=0;const used=usedMap(bank);const pub=publishedMap();
    // Existing valid IDs win; reserve them first.
    for(const q of bank){const qid=String(q?.questionId||'').toUpperCase();if(parse(qid)){reserve(qid,q?.id||'');used.set(qid,String(q?.id||''))}}
    // Missing/colliding IDs get a permanent ID. Published mapping is preferred.
    const localSeen=new Map();
    for(const q of bank){
      if(!q||typeof q!=='object')continue;const before=String(q.questionId||'');const recordId=String(q.id||'');let preferred=pub.get(recordId)||before.toUpperCase();
      if(parse(preferred)&&(!localSeen.has(preferred)||localSeen.get(preferred)===recordId)){q.questionId=preferred;localSeen.set(preferred,recordId);reserve(preferred,recordId)}
      else {q.questionId=next(recordId);localSeen.set(q.questionId,recordId)}
      if(String(q.questionId||'')!==before){changed=true;count++}
    }
    if(changed&&saveChanges&&typeof save==='function')save({reason});
    return {changed,count,highWater:currentHighWater()};
  }
  function get(q){return String(q?.questionId||'').toUpperCase()||String(q?.id||'')}
  function find(value,bank){
    const v=String(value||'').trim().toUpperCase();const arr=Array.isArray(bank)?bank:(typeof state!=='undefined'&&Array.isArray(state.questionBank)?state.questionBank:[]);
    return arr.find(q=>String(q?.questionId||'').toUpperCase()===v||String(q?.id||'').toUpperCase()===v)||null;
  }
  async function copy(value){
    const text=String(value||'').trim();if(!text)return false;
    try{await navigator.clipboard.writeText(text)}catch(_){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
    try{typeof examToast==='function'&&examToast(`Đã sao chép ID ${text}.`)}catch(_){}
    return true;
  }
  function normalizeLookup(value){return String(value||'').trim().toUpperCase()}
  function publicQuestions(){
    try{if(window.Math12Content?.allRaw)return window.Math12Content.allRaw()||[]}catch(_){}
    try{return Array.isArray(window.MATH12_ALL_PRACTICE_BANK)?window.MATH12_ALL_PRACTICE_BANK:[]}catch(_){return []}
  }
  function focusSearch(value){
    const input=document.getElementById('bankSearch');if(input){input.value=normalizeLookup(value);input.focus();try{typeof renderQuestionBank==='function'&&renderQuestionBank(true)}catch(_){}}
  }
  function openEditorById(raw=''){
    try{if(typeof requireTeacher==='function'&&!requireTeacher('Sửa câu theo ID'))return false}catch(_){}
    let value=normalizeLookup(raw);if(!value)value=normalizeLookup(prompt('Nhập ID câu cần tìm (ví dụ Q000128):','')||'');if(!value)return false;
    const local=find(value,typeof state!=='undefined'?state.questionBank:[]);if(local){try{typeof openQuestionEditor==='function'&&openQuestionEditor(local.id)}catch(_){};return true}
    const pub=publicQuestions().find(q=>normalizeLookup(q?.questionId)===value||normalizeLookup(q?.id)===value)||null;
    if(!pub){try{focusSearch(value)}catch(_){};alert(`Không tìm thấy câu ${value} trong ngân hàng hiện tại.`);return false}
    const label=get(pub);if(!confirm(`Câu ${label} đang ở ngân hàng phát hành chỉ đọc.\n\nTạo bản chỉnh sửa riêng của giáo viên với đúng ID này để sửa lỗi?`))return false;
    if(typeof state==='undefined')return false;state.questionBank=Array.isArray(state.questionBank)?state.questionBank:[];
    const x=clone(pub);ensure(x,{preserve:pub.questionId||''});const i=state.questionBank.findIndex(q=>String(q?.id||'')===String(x.id||''));if(i>=0)state.questionBank[i]=x;else state.questionBank.unshift(x);
    try{typeof save==='function'&&save({reason:'question-id-edit-public-override'})}catch(_){}
    try{typeof renderQuestionBank==='function'&&renderQuestionBank(true)}catch(_){}
    try{typeof openQuestionEditor==='function'&&openQuestionEditor(x.id)}catch(_){}
    return true;
  }
  function reconcileHighWater(remote){
    const n=Number(remote)||0;if(!n)return currentHighWater();const r=registry();r.highWater=Math.max(Number(r.highWater)||0,n);saveRegistry(r);return r.highWater;
  }
  function metadata(){return {highWater:currentHighWater(),prefix:PREFIX,width:WIDTH}}
  window.QuestionIdV40={parse,format,next,ensure,ensureBank,get,find,copy,reserve,currentHighWater,reconcileHighWater,metadata,clone,focusSearch,openEditorById};
  try{if(Array.isArray(window.MATH12_ALL_PRACTICE_BANK))ensureBank(window.MATH12_ALL_PRACTICE_BANK,{saveChanges:false})}catch(_){}
  try{if(typeof state!=='undefined'&&Array.isArray(state.questionBank))ensureBank(state.questionBank,{saveChanges:true,reason:'permanent-question-id-migration'})}catch(err){console.warn('Question ID migration',err)}
})();
