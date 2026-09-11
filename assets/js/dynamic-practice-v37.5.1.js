/* Math12 Hub  — Dynamic Practice Engine
   V40.14.1 Motivational Practice refinement
   - Lần đầu/điểm thấp: khởi động nhẹ, ưu tiên NB và câu difficulty 1–2.
   - Khi học sinh đã ổn: quay về phân bố cân bằng; kết quả tốt mới tăng thử thách.
   - Chỉ áp dụng cho tự luyện theo bài/chương; không thay đổi đề thi thật, bài giao hay đáp án/ID6. */
(function(){
'use strict';
const VERSION='40.14.1';
const BUILD='40.14.1-motivational-dynamic-practice';
const STORE_KEY='math12hub-dynamic-practice-v40141';
const TYPES=new Set(['mcq','tf','tf4','short']);
const LEVEL_TARGETS={
  starter:{NB:.60,TH:.30,VD:.10,VDC:0},
  balanced:{NB:.35,TH:.40,VD:.20,VDC:.05},
  challenge:{NB:.20,TH:.40,VD:.30,VDC:.10}
};

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
function difficultyKey(q){const d=Number(q?.difficulty);if(Number.isFinite(d))return Math.max(1,Math.min(5,d));return levelKey(q)==='NB'?1.5:levelKey(q)==='TH'?2.5:levelKey(q)==='VD'?3.7:4.7}
function qcPass(q){return true}
function eligiblePool(predicate){
  const source=window.V383PracticeBank?.effectiveBank?.()||window.V3822PracticeBank?.effectiveBank?.({approvedOnly:false})||(state.questionBank||[]);
  return source.filter(q=>q&&q.id&&TYPES.has(q.type)&&predicate(q));
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
function attemptStats(kind,id){
  const type=`${kind}-${id}`,arr=(state?.examAttempts||[]).filter(a=>String(a?.type||'')===type).slice().sort((a,b)=>(Date.parse(a.date||'')||0)-(Date.parse(b.date||'')||0));
  const last=arr.at(-1),score=Number(last?.score);
  return {count:arr.length,lastScore:Number.isFinite(score)?score:null};
}
function practiceProfile(kind,id){
  const a=attemptStats(kind,id);
  if(!a.count||a.lastScore==null||a.lastScore<7)return 'starter';
  if(a.lastScore>=8.5)return 'challenge';
  return 'balanced';
}
function profileLabel(p){return p==='starter'?'Khởi động nhẹ':p==='challenge'?'Nâng thử thách':'Cân bằng'}
function isWarmup(q){return levelKey(q)==='NB'||difficultyKey(q)<=2}
function pickBalanced(pool,count,opts={}){
  if(count<=0||!pool.length)return [];
  const seed=opts.seed||randomSeed(),rnd=seededRand(seed),previous=new Set(opts.previous||[]),picked=[],used=new Set();
  const profile=opts.profile||'balanced',LEVEL_TARGET=LEVEL_TARGETS[profile]||LEVEL_TARGETS.balanced;
  const availableLessons=new Set(pool.map(lessonKey).filter(Boolean));
  const availableForms=new Set(pool.map(formKey).filter(Boolean));
  const selectedLesson=new Set(),selectedForm=new Set(),selectedKnowledge=new Set();
  const selectedLevel={NB:0,TH:0,VD:0,VDC:0};
  const desired={};Object.keys(LEVEL_TARGET).forEach(k=>desired[k]=Math.max(k==='VDC'?0:1,Math.round(count*LEVEL_TARGET[k])));
  function add(q){
    if(!q||used.has(q.id)||picked.length>=count)return false;
    picked.push(q);used.add(q.id);const l=lessonKey(q),f=formKey(q),k=String(q.knowledgeCode||''),lev=levelKey(q);
    if(l)selectedLesson.add(l);if(f)selectedForm.add(f);if(k)selectedKnowledge.add(k);selectedLevel[lev]++;
    return true;
  }
  // Lần đầu/điểm thấp luôn có 2–3 câu khởi động dễ nếu ngân hàng có sẵn.
  if(profile==='starter'){
    const warm=shuffle(pool.filter(isWarmup),seed+41).sort((a,b)=>difficultyKey(a)-difficultyKey(b));
    const warmNeed=Math.min(warm.length,count,Math.max(2,Math.min(3,Math.ceil(count*.35))));
    for(const q of warm){
      if(picked.length>=warmNeed)break;
      // Ưu tiên phủ bài/dạng khác nhau khi có thể.
      const l=lessonKey(q),f=formKey(q);
      if(opts.kind==='chapter'&&l&&selectedLesson.has(l)&&warm.some(x=>!used.has(x.id)&&lessonKey(x)&&!selectedLesson.has(lessonKey(x))))continue;
      if(f&&selectedForm.has(f)&&warm.some(x=>!used.has(x.id)&&formKey(x)&&!selectedForm.has(formKey(x))))continue;
      add(q);
    }
    for(const q of warm){if(picked.length>=warmNeed)break;add(q)}
  }
  function score(q,phase){
    const lesson=lessonKey(q),form=formKey(q),know=String(q.knowledgeCode||''),lev=levelKey(q),diff=difficultyKey(q);
    let s=rnd()*50;
    if(opts.kind==='chapter'&&lesson&&!selectedLesson.has(lesson))s+=phase===0?1600:850;
    if(form&&!selectedForm.has(form))s+=phase<=1?520:230;
    if(know&&!selectedKnowledge.has(know))s+=280;
    if(selectedLevel[lev]<(desired[lev]||0))s+=profile==='starter'?430:260;
    if(profile==='starter'&&lev==='NB')s+=220;
    if(profile==='starter'&&diff<=2)s+=140;
    if(profile==='starter'&&lev==='VD'&&selectedLevel.VD>=Math.max(1,Math.floor(count*.15)))s-=5000;
    if(profile==='starter'&&lev==='VDC')s-=8000;
    if(profile==='challenge'&&(lev==='VD'||lev==='VDC'))s+=100;
    if(previous.has(q.id))s-=opts.fresh?900:50;
    if(q.id6||q.id6Pattern)s+=45;if(q.metadataStatusV36==='complete')s+=20;
    return s;
  }
  for(let phase=0;phase<4&&picked.length<count;phase++){
    while(picked.length<count){
      const candidates=pool.filter(q=>!used.has(q.id));if(!candidates.length)break;
      candidates.sort((a,b)=>score(b,phase)-score(a,phase));
      const best=candidates[0];
      if(phase===0&&opts.kind==='chapter'&&selectedLesson.size>=Math.min(availableLessons.size,count))break;
      if(phase===1&&selectedForm.size>=Math.min(availableForms.size,count))break;
      add(best);
      if(phase===0&&opts.kind==='chapter'&&selectedLesson.size>=Math.min(availableLessons.size,count))break;
      if(phase===1&&selectedForm.size>=Math.min(availableForms.size,count))break;
      if(phase>=2&&picked.length>=count)break;
    }
  }
  if(picked.length<count){for(const q of shuffle(pool.filter(q=>!used.has(q.id)),seed+991)){add(q);if(picked.length>=count)break}}
  let out=picked.slice(0,count);
  // Ở chế độ starter: giữ các câu dễ ở đầu, sau đó tăng dần vừa phải.
  if(profile==='starter'){
    const warm=out.filter(isWarmup).sort((a,b)=>difficultyKey(a)-difficultyKey(b));
    const hard=out.filter(q=>!isWarmup(q)).sort((a,b)=>difficultyKey(a)-difficultyKey(b));
    out=[...warm,...hard];
  }
  return out;
}
function loadCurrent(kind,id,pool){
  const store=readStore(),rec=store[scopeKey(kind,id)];if(!rec?.questionIds?.length||rec.version!==VERSION)return null;
  const map=new Map(pool.map(q=>[q.id,q])),qs=rec.questionIds.map(x=>map.get(x)).filter(Boolean);
  return qs.length===rec.questionIds.length?{...rec,questions:qs}:null;
}
function saveCurrent(kind,id,questions,seed,profile){
  const store=readStore(),key=scopeKey(kind,id);store[key]={version:VERSION,kind,id:String(id),seed,profile,createdAt:now(),questionIds:questions.map(q=>q.id)};writeStore(store);return store[key]
}
function buildSet(kind,id,{fresh=false}={}){
  const pool=scopePool(kind,id),count=targetCount(kind,id,pool),old=loadCurrent(kind,id,pool),profile=practiceProfile(kind,id);
  if(old&&!fresh)return {...old,poolCount:pool.length};
  const seed=randomSeed(),previous=old?.questionIds||[],questions=pickBalanced(pool,count,{kind,seed,previous,fresh:true,profile});
  const rec=saveCurrent(kind,id,questions,seed,profile);return {...rec,questions,poolCount:pool.length};
}
function normalized(q,part){return typeof normalizeBankQuestion==='function'?normalizeBankQuestion(q,part):{...JSON.parse(JSON.stringify(q)),part}}
function lessonConfig(id,{fresh=false}={}){
  const item=getLesson(id),set=buildSet('lesson',id,{fresh}),qs=(set.questions||[]).map(q=>normalized(q,'Kiểm tra sau bài'));
  const forms=new Set(qs.map(formKey).filter(Boolean)).size,levels=countMap(qs,levelKey),p=set.profile||'balanced';
  return {id:`lesson-${id}`,mode:'lesson',lessonId:id,title:`Kiểm tra sau bài • ${item?.common||id}`,subtitle:`${profileLabel(p)} • ${qs.length} câu • ${forms} dạng • NB ${levels.get('NB')||0} • TH ${levels.get('TH')||0} • VD+ ${((levels.get('VD')||0)+(levels.get('VDC')||0))}`,durationMinutes:Math.max(8,qs.length*2),questions:qs,scoring:'normalized',attemptType:`lesson-${id}`,passScore:7,dynamicPractice:{version:VERSION,kind:'lesson',profile:p,setCreatedAt:set.createdAt,poolCount:set.poolCount},rules:p==='starter'?'Lượt khởi động ưu tiên câu Nhận biết và độ khó 1–2, sắp câu dễ trước để tạo đà. Khi kết quả ổn định, hệ thống tự tăng dần mức độ.':'Câu hỏi lấy trực tiếp từ ngân hàng hiện tại, ưu tiên phủ dạng/kiến thức và điều chỉnh mức độ theo kết quả gần nhất.'}
}
function chapterConfig(chapterId,{fresh=false}={}){
  const c=chapters.find(x=>x.id===Number(chapterId)),set=buildSet('chapter',chapterId,{fresh}),qs=(set.questions||[]).map(q=>normalized(q,`Ôn Chương ${chapterId}`));
  const lessons=new Set(qs.map(lessonKey).filter(Boolean)).size,forms=new Set(qs.map(formKey).filter(Boolean)).size,levels=countMap(qs,levelKey),p=set.profile||'balanced';
  return {id:`chapter-${chapterId}`,mode:'chapter',chapterId:Number(chapterId),title:`Ôn tập Chương ${chapterId} • ${c?.title||''}`,subtitle:`${profileLabel(p)} • ${qs.length} câu • phủ ${lessons} bài • ${forms} dạng ID6 • NB ${levels.get('NB')||0} • TH ${levels.get('TH')||0} • VD+ ${((levels.get('VD')||0)+(levels.get('VDC')||0))}`,durationMinutes:Math.max(20,qs.length*2),questions:qs,scoring:'normalized',attemptType:`chapter-${chapterId}`,dynamicPractice:{version:VERSION,kind:'chapter',profile:p,setCreatedAt:set.createdAt,poolCount:set.poolCount},rules:p==='starter'?'Lượt ôn đầu ưu tiên câu dễ, nhất là Nhận biết/difficulty 1–2, sau đó mới tăng dần để học sinh có động lực.':'Ôn chương lấy trực tiếp từ ngân hàng, ưu tiên phủ bài, phủ dạng ID6 và điều chỉnh độ khó theo kết quả gần nhất.'}
}
function clearScopeDraft(kind,id){try{clearExamDraft?.({id:`${kind}-${id}`})}catch(_){try{localStorage.removeItem(`math12-exam-draft:${kind}-${id}`)}catch(__){}}}
function openLesson(id,fresh=false){if(fresh)clearScopeDraft('lesson',id);openExamStart(lessonConfig(id,{fresh}))}
function openChapter(id,fresh=false){if(fresh)clearScopeDraft('chapter',id);openExamStart(chapterConfig(id,{fresh}))}
function setInfo(kind,id){const pool=scopePool(kind,id),current=loadCurrent(kind,id,pool),p=current?.profile||practiceProfile(kind,id);return {pool:pool.length,current:current?.questionIds?.length||0,createdAt:current?.createdAt||'',profile:p}}
function addLessonControls(){
  const host=document.getElementById('lessonDetail');if(!host||!window.activeLessonId&&typeof activeLessonId==='undefined')return;
  const id=typeof activeLessonId!=='undefined'?activeLessonId:window.activeLessonId,info=setInfo('lesson',id);
  host.querySelectorAll('button[onclick*="openLessonQuiz"]').forEach((b,i)=>{
    b.textContent=i===0?'Làm bộ câu hiện tại':'Làm bộ câu hiện tại';b.setAttribute('onclick',`openLessonQuiz('${id}',false)`);
    if(!b.parentElement?.querySelector('.v3751-new-set')){const n=document.createElement('button');n.type='button';n.className='btn btn-soft v3751-new-set';n.textContent='↻ Tạo bộ câu mới';n.onclick=()=>window.openLessonQuiz(id,true);b.insertAdjacentElement('afterend',n)}
  });
  const card=[...host.querySelectorAll('.study-card')].find(x=>/Luyện tập & kiểm tra/.test(x.textContent||''));
  if(card&&!card.querySelector('.v3751-practice-note')){const p=document.createElement('div');p.className='v3751-practice-note';p.innerHTML=`<b>${profileLabel(info.profile)}:</b> ngân hàng có <strong>${info.pool}</strong> câu phù hợp. ${info.profile==='starter'?'Lượt đầu ưu tiên câu dễ trước, sau đó tăng dần mức độ.':'Mức độ được điều chỉnh theo kết quả gần nhất.'}`;card.querySelector('p')?.insertAdjacentElement('afterend',p)}
}
function enhanceChapterCards(){
  const host=document.getElementById('allChapters');if(!host)return;
  const cards=[...host.querySelectorAll('.chapter')];cards.forEach((card,i)=>{const c=chapters[i];if(!c)return;const info=setInfo('chapter',c.id),btn=card.querySelector('button');if(!btn)return;
    btn.textContent='Làm bài ôn chương';btn.removeAttribute('onclick');btn.onclick=()=>window.openChapterReview(c.id,false);
    let box=card.querySelector('.v3751-chapter-actions');if(!box){box=document.createElement('div');box.className='v3751-chapter-actions';btn.parentNode.insertBefore(box,btn);box.appendChild(btn);const fresh=document.createElement('button');fresh.type='button';fresh.className='btn btn-soft';fresh.textContent='↻ Bộ mới';fresh.onclick=()=>window.openChapterReview(c.id,true);box.appendChild(fresh)}
    let note=card.querySelector('.v3751-chapter-note');if(!note){note=document.createElement('div');note.className='v3751-chapter-note';card.querySelector('.progress')?.insertAdjacentElement('afterend',note)}
    if(note)note.textContent=info.pool?`${info.pool} câu • ${profileLabel(info.profile)} • bộ hiện tại ${info.current||'chưa tạo'} câu`:'Chưa có câu phù hợp trong ngân hàng';
  })
}
function install(){
  window.lessonExamConfig=(id)=>lessonConfig(id,{fresh:false});
  window.openLessonQuiz=(id,fresh=false)=>openLesson(id,!!fresh);
  window.chapterExamConfig=(id)=>chapterConfig(id,{fresh:false});
  window.openChapterReview=(id,fresh=false)=>openChapter(id,!!fresh);
  if(typeof window.renderLessonDetail==='function'&&!window.renderLessonDetail.__v40141){const base=window.renderLessonDetail;const w=function(){const out=base.apply(this,arguments);setTimeout(addLessonControls,0);return out};w.__v40141=true;window.renderLessonDetail=w}
  if(typeof window.renderDashboard==='function'&&!window.renderDashboard.__v40141){const base=window.renderDashboard;const w=function(){const out=base.apply(this,arguments);setTimeout(enhanceChapterCards,0);return out};w.__v40141=true;window.renderDashboard=w}
  setTimeout(()=>{addLessonControls();enhanceChapterCards()},20);
}
window.V3751DynamicPractice={version:VERSION,build:BUILD,scopePool,targetCount,pickBalanced,buildSet,lessonConfig,chapterConfig,setInfo,practiceProfile,openLessonQuiz:openLesson,openChapterReview:openChapter};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
