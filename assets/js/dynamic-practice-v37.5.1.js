/* Math12 Hub V37.5.1 — Dynamic Practice Engine
   Học theo bài + Ôn tập chương lấy câu trực tiếp từ ngân hàng.
   Bộ hiện tại được giữ ổn định để có thể tiếp tục bài dở; giáo viên/học sinh
   có thể chủ động tạo bộ mới. Không thay đổi nội dung/đáp án/ID6 của câu. */
(function(){
'use strict';
const VERSION='37.5.1';
const BUILD='37.5.1-dynamic-practice-id6-balanced';
const STORE_KEY='math12hub-dynamic-practice-v3751';
const TYPES=new Set(['mcq','tf','tf4','short']);
const LEVEL_TARGET={NB:.35,TH:.40,VD:.20,VDC:.05};

function now(){return new Date().toISOString()}
function safeParse(s,fallback){try{return JSON.parse(s)}catch(_){return fallback}}
function readStore(){const x=safeParse(localStorage.getItem(STORE_KEY)||'{}',{});return x&&typeof x==='object'?x:{}}
function writeStore(x){try{localStorage.setItem(STORE_KEY,JSON.stringify(x))}catch(_){}}
function scopeKey(kind,id){return `${kind}:${id}`}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(_){return ((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0)}}
function seededRand(seed){let x=(Number(seed)||1)>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296}}
function shuffle(arr,seed=randomSeed()){const a=[...arr],rnd=seededRand(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function formKey(q){return String(q.id6Pattern||q.formId||q.form||q.knowledgeCode||'').trim()||`Q:${q.id}`}
function lessonKey(q){return String(q.lessonId||'').trim()}
function levelKey(q){const x=String(q.level||'').toUpperCase();return ['NB','TH','VD','VDC'].includes(x)?x:'TH'}
function qcPass(q){try{return !window.V3747FigureQC?.qcQuestion||window.V3747FigureQC.qcQuestion(q).pass!==false}catch(_){return true}}
function eligiblePool(predicate){
  let pool=(state.questionBank||[]).filter(q=>q&&q.id&&TYPES.has(q.type)&&predicate(q)&&qcPass(q));
  const hasWorkflow=pool.some(q=>String(q.reviewStatus||'').trim());
  if(hasWorkflow)pool=pool.filter(q=>q.reviewStatus==='approved');
  return pool;
}
function scopePool(kind,id){
  if(kind==='lesson')return eligiblePool(q=>lessonKey(q)===String(id));
  const cid=Number(id)||0,chapter=chapters.find(c=>c.id===cid),ids=new Set((chapter?.lessons||[]).map(l=>l.id));
  return eligiblePool(q=>Number(q.chapterId)===cid||ids.has(lessonKey(q)));
}
function targetCount(kind,id,pool){
  if(kind==='lesson')return Math.min(8,pool.length);
  const c=chapters.find(x=>x.id===Number(id)),base=Math.max(12,(c?.lessons?.length||4)*3);
  return Math.min(20,base,pool.length);
}
function countMap(list,keyFn){const m=new Map();for(const x of list){const k=keyFn(x);m.set(k,(m.get(k)||0)+1)}return m}
function pickBalanced(pool,count,opts={}){
  if(count<=0||!pool.length)return [];
  const seed=opts.seed||randomSeed(),rnd=seededRand(seed),previous=new Set(opts.previous||[]),picked=[],used=new Set();
  const availableLessons=new Set(pool.map(lessonKey).filter(Boolean));
  const availableForms=new Set(pool.map(formKey).filter(Boolean));
  const selectedLesson=new Set(),selectedForm=new Set(),selectedKnowledge=new Set();
  const selectedLevel={NB:0,TH:0,VD:0,VDC:0};
  const desired={};Object.keys(LEVEL_TARGET).forEach(k=>desired[k]=Math.max(k==='VDC'?0:1,Math.round(count*LEVEL_TARGET[k])));
  function score(q,phase){
    const lesson=lessonKey(q),form=formKey(q),know=String(q.knowledgeCode||''),lev=levelKey(q);
    let s=rnd()*50;
    if(opts.kind==='chapter'&&lesson&&!selectedLesson.has(lesson))s+=phase===0?1600:850;
    if(form&&!selectedForm.has(form))s+=phase<=1?520:230;
    if(know&&!selectedKnowledge.has(know))s+=280;
    if(selectedLevel[lev]<(desired[lev]||0))s+=260;
    if(previous.has(q.id))s-=opts.fresh?900:50;
    // Ưu tiên câu có ID6 rõ ràng và metadata hoàn chỉnh, nhưng không loại câu legacy hợp lệ.
    if(q.id6||q.id6Pattern)s+=45;if(q.metadataStatusV36==='complete')s+=20;
    return s;
  }
  for(let phase=0;phase<4&&picked.length<count;phase++){
    while(picked.length<count){
      const candidates=pool.filter(q=>!used.has(q.id));if(!candidates.length)break;
      candidates.sort((a,b)=>score(b,phase)-score(a,phase));
      const best=candidates[0];
      // Ở pha phủ bài, nếu đã phủ hết bài có dữ liệu thì chuyển pha.
      if(phase===0&&opts.kind==='chapter'&&selectedLesson.size>=Math.min(availableLessons.size,count))break;
      // Ở pha phủ dạng, nếu đã phủ đủ số dạng có thể phủ thì chuyển pha.
      if(phase===1&&selectedForm.size>=Math.min(availableForms.size,count))break;
      picked.push(best);used.add(best.id);const l=lessonKey(best),f=formKey(best),k=String(best.knowledgeCode||''),lev=levelKey(best);
      if(l)selectedLesson.add(l);if(f)selectedForm.add(f);if(k)selectedKnowledge.add(k);selectedLevel[lev]++;
      if(phase===0&&opts.kind==='chapter'&&selectedLesson.size>=Math.min(availableLessons.size,count))break;
      if(phase===1&&selectedForm.size>=Math.min(availableForms.size,count))break;
      if(phase>=2&&picked.length>=count)break;
    }
  }
  // Trường hợp score phase dừng sớm, lấp đủ số câu còn thiếu ngẫu nhiên.
  if(picked.length<count){for(const q of shuffle(pool.filter(q=>!used.has(q.id)),seed+991)){picked.push(q);used.add(q.id);if(picked.length>=count)break}}
  return picked.slice(0,count);
}
function loadCurrent(kind,id,pool){
  const store=readStore(),rec=store[scopeKey(kind,id)];if(!rec?.questionIds?.length)return null;
  const map=new Map(pool.map(q=>[q.id,q])),qs=rec.questionIds.map(x=>map.get(x)).filter(Boolean);
  return qs.length===rec.questionIds.length?{...rec,questions:qs}:null;
}
function saveCurrent(kind,id,questions,seed){
  const store=readStore(),key=scopeKey(kind,id);store[key]={version:VERSION,kind,id:String(id),seed,createdAt:now(),questionIds:questions.map(q=>q.id)};writeStore(store);return store[key]
}
function buildSet(kind,id,{fresh=false}={}){
  const pool=scopePool(kind,id),count=targetCount(kind,id,pool),old=loadCurrent(kind,id,pool);
  if(old&&!fresh)return {...old,poolCount:pool.length};
  const seed=randomSeed(),previous=old?.questionIds||[],questions=pickBalanced(pool,count,{kind,seed,previous,fresh:true});
  const rec=saveCurrent(kind,id,questions,seed);return {...rec,questions,poolCount:pool.length};
}
function normalized(q,part){return typeof normalizeBankQuestion==='function'?normalizeBankQuestion(q,part):{...JSON.parse(JSON.stringify(q)),part}}
function lessonConfig(id,{fresh=false}={}){
  const item=getLesson(id),set=buildSet('lesson',id,{fresh}),qs=(set.questions||[]).map(q=>normalized(q,'Kiểm tra sau bài'));
  const forms=new Set(qs.map(formKey).filter(Boolean)).size,levels=countMap(qs,levelKey);
  return {id:`lesson-${id}`,mode:'lesson',lessonId:id,title:`Kiểm tra sau bài • ${item?.common||id}`,subtitle:`${qs.length} câu ngẫu nhiên từ ngân hàng • ${forms} dạng • NB ${levels.get('NB')||0} • TH ${levels.get('TH')||0} • VD+ ${((levels.get('VD')||0)+(levels.get('VDC')||0))}`,durationMinutes:Math.max(8,qs.length*2),questions:qs,scoring:'normalized',attemptType:`lesson-${id}`,passScore:7,dynamicPractice:{version:VERSION,kind:'lesson',setCreatedAt:set.createdAt,poolCount:set.poolCount},rules:'Câu hỏi lấy trực tiếp từ ngân hàng đã duyệt, ưu tiên phủ dạng/kiến thức và cân bằng mức độ. “Bộ hiện tại” được giữ để có thể tiếp tục bài dở; chọn “Tạo bộ câu mới” khi muốn đổi câu.'}
}
function chapterConfig(chapterId,{fresh=false}={}){
  const c=chapters.find(x=>x.id===Number(chapterId)),set=buildSet('chapter',chapterId,{fresh}),qs=(set.questions||[]).map(q=>normalized(q,`Ôn Chương ${chapterId}`));
  const lessons=new Set(qs.map(lessonKey).filter(Boolean)).size,forms=new Set(qs.map(formKey).filter(Boolean)).size,levels=countMap(qs,levelKey);
  return {id:`chapter-${chapterId}`,mode:'chapter',chapterId:Number(chapterId),title:`Ôn tập Chương ${chapterId} • ${c?.title||''}`,subtitle:`${qs.length} câu ngẫu nhiên • phủ ${lessons} bài có dữ liệu • ${forms} dạng ID6 • NB ${levels.get('NB')||0} • TH ${levels.get('TH')||0} • VD+ ${((levels.get('VD')||0)+(levels.get('VDC')||0))}`,durationMinutes:Math.max(20,qs.length*2),questions:qs,scoring:'normalized',attemptType:`chapter-${chapterId}`,dynamicPractice:{version:VERSION,kind:'chapter',setCreatedAt:set.createdAt,poolCount:set.poolCount},rules:'Bài ôn chương lấy trực tiếp từ ngân hàng đã duyệt. Engine ưu tiên phủ các bài có dữ liệu, phủ dạng ID6, sau đó cân bằng NB/TH/VD và lấy ngẫu nhiên các câu còn lại.'}
}
function clearScopeDraft(kind,id){try{clearExamDraft?.({id:`${kind}-${id}`})}catch(_){try{localStorage.removeItem(`math12-exam-draft:${kind}-${id}`)}catch(__){}}}
function openLesson(id,fresh=false){if(fresh)clearScopeDraft('lesson',id);openExamStart(lessonConfig(id,{fresh}))}
function openChapter(id,fresh=false){if(fresh)clearScopeDraft('chapter',id);openExamStart(chapterConfig(id,{fresh}))}
function setInfo(kind,id){const pool=scopePool(kind,id),current=loadCurrent(kind,id,pool);return {pool:pool.length,current:current?.questionIds?.length||0,createdAt:current?.createdAt||''}}
function addLessonControls(){
  const host=document.getElementById('lessonDetail');if(!host||!window.activeLessonId&&typeof activeLessonId==='undefined')return;
  const id=typeof activeLessonId!=='undefined'?activeLessonId:window.activeLessonId,info=setInfo('lesson',id);
  host.querySelectorAll('button[onclick*="openLessonQuiz"]').forEach((b,i)=>{
    b.textContent=i===0?'Làm bộ câu hiện tại':'Làm bộ câu hiện tại';b.setAttribute('onclick',`openLessonQuiz('${id}',false)`);
    if(!b.parentElement?.querySelector('.v3751-new-set')){const n=document.createElement('button');n.type='button';n.className='btn btn-soft v3751-new-set';n.textContent='↻ Tạo bộ câu mới';n.onclick=()=>window.openLessonQuiz(id,true);b.insertAdjacentElement('afterend',n)}
  });
  const card=[...host.querySelectorAll('.study-card')].find(x=>/Luyện tập & kiểm tra/.test(x.textContent||''));
  if(card&&!card.querySelector('.v3751-practice-note')){const p=document.createElement('div');p.className='v3751-practice-note';p.innerHTML=`<b>Dynamic Practice V37.5.1:</b> ngân hàng có <strong>${info.pool}</strong> câu phù hợp với bài này. Bộ hiện tại ${info.current?`gồm <strong>${info.current}</strong> câu`:'sẽ được tạo khi bắt đầu'}; tạo bộ mới sẽ ưu tiên tránh lặp lại câu của bộ trước.`;card.querySelector('p')?.insertAdjacentElement('afterend',p)}
}
function enhanceChapterCards(){
  const host=document.getElementById('allChapters');if(!host)return;
  const cards=[...host.querySelectorAll('.chapter')];cards.forEach((card,i)=>{const c=chapters[i];if(!c)return;const info=setInfo('chapter',c.id),btn=card.querySelector('button');if(!btn)return;
    btn.textContent='Làm bài ôn chương';btn.removeAttribute('onclick');btn.onclick=()=>window.openChapterReview(c.id,false);
    let box=card.querySelector('.v3751-chapter-actions');if(!box){box=document.createElement('div');box.className='v3751-chapter-actions';btn.parentNode.insertBefore(box,btn);box.appendChild(btn);const fresh=document.createElement('button');fresh.type='button';fresh.className='btn btn-soft';fresh.textContent='↻ Bộ mới';fresh.onclick=()=>window.openChapterReview(c.id,true);box.appendChild(fresh)}
    let note=card.querySelector('.v3751-chapter-note');if(!note){note=document.createElement('div');note.className='v3751-chapter-note';card.querySelector('.progress')?.insertAdjacentElement('afterend',note)}
    if(note)note.textContent=info.pool?`${info.pool} câu trong ngân hàng • bộ hiện tại ${info.current||'chưa tạo'} câu`:'Chưa có câu Approved phù hợp trong ngân hàng';
  })
}
function install(){
  // Giữ tên API cũ để các nút/module trước đây tiếp tục hoạt động.
  window.lessonExamConfig=(id)=>lessonConfig(id,{fresh:false});
  window.openLessonQuiz=(id,fresh=false)=>openLesson(id,!!fresh);
  window.chapterExamConfig=(id)=>chapterConfig(id,{fresh:false});
  window.openChapterReview=(id,fresh=false)=>openChapter(id,!!fresh);
  if(typeof window.renderLessonDetail==='function'&&!window.renderLessonDetail.__v3751){const base=window.renderLessonDetail;const w=function(){const out=base.apply(this,arguments);setTimeout(addLessonControls,0);return out};w.__v3751=true;window.renderLessonDetail=w}
  if(typeof window.renderDashboard==='function'&&!window.renderDashboard.__v3751){const base=window.renderDashboard;const w=function(){const out=base.apply(this,arguments);setTimeout(enhanceChapterCards,0);return out};w.__v3751=true;window.renderDashboard=w}
  setTimeout(()=>{addLessonControls();enhanceChapterCards()},20);
}
window.V3751DynamicPractice={version:VERSION,build:BUILD,scopePool,targetCount,pickBalanced,buildSet,lessonConfig,chapterConfig,setInfo,openLessonQuiz:openLesson,openChapterReview:openChapter};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
