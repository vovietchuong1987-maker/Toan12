/* Math12 Hub V36.0 — Smart Navigation inherited from V35.4
   Global search • recent items • pins • remembered filters • keyboard navigation.
   Client-side only: uses data already loaded in the current session and adds no Firestore reads by itself.
*/
(function(){
  'use strict';
  const BUILD='36.0-smart-navigation';
  const KEYS={
    recent:'math12hub:v35.4:recent',
    pins:'math12hub:v35.4:pins',
    filters:'math12hub:v35.4:filters'
  };
  const MAX_RECENT=8,MAX_PINS=8,MAX_RESULTS=12;
  const PAGE_META={
    dashboard:{title:'Tổng quan',subtitle:'Trang chủ và việc cần làm',icon:'⌂',keywords:'trang chủ dashboard tổng quan'},
    'learning-plan':{title:'Lộ trình của em',subtitle:'Mục tiêu và kế hoạch học',icon:'✦',keywords:'lộ trình kế hoạch mục tiêu'},
    avatar:{title:'Nhân vật của em',subtitle:'Avatar tân thủ và diện mạo cá nhân',icon:'♟',keywords:'avatar nhân vật tân thủ trang phục hồ sơ'},
    lessons:{title:'Học theo bài',subtitle:'19 bài Toán 12 theo GDPT 2018',icon:'▤',keywords:'bài học kiến thức chương trình'},
    chapters:{title:'Ôn theo chương',subtitle:'Ôn tập theo 6 chương',icon:'◫',keywords:'chương ôn tập'},
    periodic:{title:'Kiểm tra định kỳ',subtitle:'Bài kiểm tra giữa kỳ và học kỳ',icon:'◷',keywords:'kiểm tra định kỳ giữa kỳ học kỳ'},
    thpt:{title:'Ôn thi THPT',subtitle:'Luyện đề theo cấu trúc tốt nghiệp',icon:'★',keywords:'thpt tốt nghiệp luyện đề'},
    progress:{title:'Tiến độ của em',subtitle:'Theo dõi tiến độ học tập',icon:'↗',keywords:'tiến độ hoàn thành'},
    analytics:{title:'Phân tích năng lực',subtitle:'Điểm mạnh, điểm yếu và mã kiến thức',icon:'◎',keywords:'phân tích năng lực yếu mạnh'},
    reports:{title:'Báo cáo học tập',subtitle:'Báo cáo kết quả và phụ huynh',icon:'▣',keywords:'báo cáo phụ huynh kết quả'},
    notifications:{title:'Thông báo',subtitle:'Thông báo hệ thống và học tập',icon:'🔔',keywords:'thông báo tin nhắn học tập'},
    'question-bank':{title:'Ngân hàng câu hỏi',subtitle:'Kho câu hỏi của giáo viên',icon:'▦',keywords:'ngân hàng câu hỏi kho đề'},
    'exam-builder':{title:'Tạo đề kiểm tra',subtitle:'Sinh đề từ ma trận câu hỏi',icon:'▧',keywords:'tạo đề ma trận kiểm tra'},
    'ai-teacher':{title:'AI Teaching Intelligence',subtitle:'Phân tích nội dung, lập kế hoạch và tạo nháp',icon:'✦',keywords:'ai giáo viên gemini teaching intelligence kế hoạch dạy học mastery'},
    admin:{title:'Quản trị hệ thống',subtitle:'Tài khoản và Production Center',icon:'🛡',keywords:'admin quản trị hệ thống'}
  };
  const FILTER_IDS=['lessonSearch','bankSearch','bankChapter','bankLesson','bankKnowledge','bankFormV36','bankLevel','bankType','bankReviewStatus','bankDifficulty','bankSource','bankTag','bankDuplicateFilter','bankQualityV361','bankSort','bankPageSize'];
  let paletteOpen=false,currentResults=[],activeIndex=0,restoreBusy=false;

  function role(){try{return typeof currentSecureRole==='function'?currentSecureRole():'student'}catch(_){return 'student'}}
  function allowed(page){try{return typeof canAccessPage==='function'?canAccessPage(page,role()):true}catch(_){return true}}
  function norm(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/\s+/g,' ').trim()}
  function escText(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function readJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch(_){return fallback}}
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function notify(msg){if(typeof window.v353Toast==='function')window.v353Toast(msg);else if(typeof examToast==='function')examToast(msg)}
  function currentPage(){return document.querySelector('.section.active')?.id?.replace(/^page-/,'')||'dashboard'}
  function keyOf(item){return `${item.type}:${item.id}`}

  function itemPage(page){const m=PAGE_META[page]||{title:page,subtitle:'',icon:'•',keywords:''};return {type:'page',id:page,page,title:m.title,subtitle:m.subtitle,icon:m.icon,keywords:m.keywords,pinnable:page!=='dashboard'}}
  function itemLesson(id){let l=null;try{l=typeof getLesson==='function'?getLesson(id):null}catch(_){};if(!l)return null;const m=typeof getLessonMeta==='function'?getLessonMeta(id):null;return {type:'lesson',id,page:'lesson-detail',title:l.common||id,subtitle:`${id} • Chương ${l.chapter?.id||''}`,icon:'▤',keywords:[id,l.common,l.chapter?.title,...(m?.goals||[]),...(m?.knowledge||[]).flatMap(k=>[k.code,k.title])].join(' '),pinnable:true}}
  function itemChapter(c){return {type:'chapter',id:String(c.id),page:'lessons',title:`Chương ${c.id}. ${c.title}`,subtitle:`${c.lessons?.length||0} bài • ${c.desc||''}`,icon:'◫',keywords:[c.title,c.desc,...(c.lessons||[]).map(l=>l.common)].join(' '),pinnable:true}}
  function itemQuestion(q){return {type:'question',id:String(q.id),page:'question-bank',title:`${q.id} • ${String(q.question||'').replace(/<[^>]+>/g,' ').slice(0,110)}`,subtitle:`${displayLessonLabel(q.lessonId||'')}${q.knowledgeCode?' • '+displayKnowledgeCode(q.knowledgeCode):''}${q.formId?' • '+q.formId:''}`,icon:'▦',keywords:[q.id,q.question,q.explanation,q.knowledgeCode,q.lessonId,q.formId,q.formTitle,q.form,q.sourceName,(q.tags||[]).join(' ')].join(' '),pinnable:true}}
  function itemExam(e){return {type:'exam',id:String(e.id),page:'exam-builder',title:e.title||'Đề kiểm tra',subtitle:`${e.questions?.length||0} câu • ${e.durationMinutes||45} phút`,icon:'▧',keywords:[e.title,e.id].join(' '),pinnable:true}}
  function itemClass(c){return {type:'class',id:String(c.id||c.classId||''),page:'teacher',title:c.name||c.className||'Lớp học',subtitle:c.joinCode?`Mã lớp ${c.joinCode}`:'Lớp học online',icon:'☁',keywords:[c.name,c.className,c.joinCode,c.teacherName].join(' '),pinnable:true}}
  function itemKnowledge(k){let l=null;try{l=typeof getLesson==='function'?getLesson(k.lessonId):null}catch(_){};return {type:'knowledge',id:String(k.code),page:'lesson-detail',lessonId:k.lessonId,title:`${displayKnowledgeCode(k.code)} • ${k.title}`,subtitle:l?`${displayLessonLabel(k.lessonId)}`:displayLessonLabel(k.lessonId),icon:'◇',keywords:[k.code,k.title,k.lessonId,k.summary].join(' '),pinnable:true}}
  function itemForm(f){return {type:'form',id:String(f.id),page:'question-bank',knowledgeCode:f.knowledgeCode||'',lessonId:f.lessonId||'',title:`${f.id} • ${f.title}`,subtitle:`${f.knowledgeCode||''} • ${f.lessonId||''}`,icon:'◆',keywords:[f.id,f.title,f.knowledgeCode,f.lessonId,f.tip].join(' '),pinnable:true}}

  function resolveStored(s){
    if(!s||!s.type)return null;
    try{
      if(s.type==='page')return allowed(s.id)?itemPage(s.id):null;
      if(s.type==='lesson')return itemLesson(s.id);
      if(s.type==='chapter'){const c=(typeof chapters!=='undefined'?chapters:[]).find(x=>String(x.id)===String(s.id));return c?itemChapter(c):null}
      if(s.type==='knowledge'){const k=(typeof allKnowledgeCodes==='function'?allKnowledgeCodes():[]).find(x=>String(x.code)===String(s.id));return k?itemKnowledge(k):null}
      if(s.type==='form'){const f=(typeof v360AllForms==='function'?v360AllForms():[]).find(x=>String(x.id)===String(s.id));return f?itemForm(f):null}
      if(s.type==='question'&&allowed('question-bank')){const q=(typeof state!=='undefined'?state.questionBank||[]:[]).find(x=>String(x.id)===String(s.id));return q?itemQuestion(q):null}
      if(s.type==='exam'&&allowed('exam-builder')){const e=(typeof state!=='undefined'?state.customExams||[]:[]).find(x=>String(x.id)===String(s.id));return e?itemExam(e):null}
    }catch(_){ }
    return null;
  }

  function persistShape(item){return {type:item.type,id:item.id,title:item.title,subtitle:item.subtitle,icon:item.icon,page:item.page}}
  function recents(){return readJSON(KEYS.recent,[]).map(resolveStored).filter(Boolean)}
  function pins(){return readJSON(KEYS.pins,[]).map(resolveStored).filter(Boolean)}
  function isPinned(item){return pins().some(x=>keyOf(x)===keyOf(item))}
  function addRecent(item){if(!item||item.type==='page'&&item.id==='dashboard')return;let arr=readJSON(KEYS.recent,[]).filter(x=>`${x.type}:${x.id}`!==keyOf(item));arr.unshift(persistShape(item));writeJSON(KEYS.recent,arr.slice(0,MAX_RECENT));renderSmartDock()}
  function togglePin(item){if(!item?.pinnable)return;let arr=readJSON(KEYS.pins,[]),k=keyOf(item),exists=arr.some(x=>`${x.type}:${x.id}`===k);arr=arr.filter(x=>`${x.type}:${x.id}`!==k);if(!exists)arr.unshift(persistShape(item));writeJSON(KEYS.pins,arr.slice(0,MAX_PINS));notify(exists?'Đã bỏ ghim.':'Đã ghim để truy cập nhanh.');renderSmartDock();updatePinCurrent();if(paletteOpen)renderResults(document.getElementById('v354SearchInput')?.value||'')}

  function execute(item){
    if(!item)return;
    closePalette();
    try{
      if(item.type==='page')goPage(item.id);
      else if(item.type==='lesson')openLesson(item.id);
      else if(item.type==='chapter'){selectChapter(Number(item.id));goPage('lessons')}
      else if(item.type==='knowledge'){openLesson(item.lessonId);setTimeout(()=>document.getElementById('lessonKnowledge')?.scrollIntoView({behavior:'smooth',block:'start'}),180)}
      else if(item.type==='form'){goPage('question-bank');setTimeout(()=>typeof v360ApplyKnowledgeFilter==='function'&&v360ApplyKnowledgeFilter(item.knowledgeCode||'',item.id),180)}
      else if(item.type==='question'){goPage('question-bank');setTimeout(()=>typeof previewBankQuestion==='function'&&previewBankQuestion(item.id),180)}
      else if(item.type==='exam'){goPage('exam-builder');setTimeout(()=>typeof previewSavedCustomExam==='function'&&previewSavedCustomExam(item.id),180)}
      addRecent(item);
    }catch(err){console.warn('V36.0 navigation',err)}
  }

  function score(item,q,tokens){
    const title=norm(item.title),sub=norm(item.subtitle),kw=norm(item.keywords||''),id=norm(item.id);
    let s=0;if(!q)return 1;if(title===q||id===q)s+=150;if(title.startsWith(q)||id.startsWith(q))s+=90;if(title.includes(q))s+=70;if(sub.includes(q))s+=45;if(kw.includes(q))s+=35;
    tokens.forEach(t=>{if(title.includes(t))s+=18;else if(sub.includes(t))s+=10;else if(kw.includes(t))s+=6});
    if(isPinned(item))s+=8;return s;
  }
  function baseSearchItems(){
    const out=[];
    Object.keys(PAGE_META).forEach(p=>{if(allowed(p))out.push(itemPage(p))});
    try{(chapters||[]).forEach(c=>{out.push(itemChapter(c));(c.lessons||[]).forEach(l=>{const x=itemLesson(l.id);if(x)out.push(x)})})}catch(_){}
    try{(typeof allKnowledgeCodes==='function'?allKnowledgeCodes():[]).forEach(k=>out.push(itemKnowledge(k)))}catch(_){}
    try{if(allowed('question-bank')&&typeof v360AllForms==='function')v360AllForms().forEach(f=>out.push(itemForm(f)))}catch(_){}
    if(allowed('exam-builder'))try{(state.customExams||[]).forEach(e=>out.push(itemExam(e)))}catch(_){}
    return out;
  }
  function searchItems(query){
    const q=norm(query),tokens=q.split(' ').filter(Boolean);let items=baseSearchItems();
    if(!q){const unique=new Map();[...pins(),...recents(),...items.filter(x=>x.type==='page')].forEach(x=>x&&unique.set(keyOf(x),x));return [...unique.values()].slice(0,MAX_RESULTS)}
    if(allowed('question-bank')&&q.length>=2){try{for(const qb of (state.questionBank||[])){const x=itemQuestion(qb),hay=norm(x.title+' '+x.subtitle+' '+x.keywords);if(tokens.every(t=>hay.includes(t)))items.push(x);if(items.length>6500)break}}catch(_){} }
    return items.map(item=>({item,score:score(item,q,tokens)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'vi')).slice(0,MAX_RESULTS).map(x=>x.item);
  }

  function injectUI(){
    const right=document.querySelector('.topbar-right');
    if(right&&!document.getElementById('v354SearchTrigger')){const b=document.createElement('button');b.id='v354SearchTrigger';b.className='v354-search-trigger';b.type='button';b.innerHTML='<span class="v354-search-icon">⌕</span><span class="v354-search-label">Tìm nhanh</span><kbd>Ctrl K</kbd>';b.setAttribute('aria-label','Tìm nhanh toàn hệ thống');b.addEventListener('click',()=>openPalette());right.prepend(b)}
    if(!document.getElementById('v354Palette')){const wrap=document.createElement('div');wrap.id='v354Palette';wrap.className='v354-palette-backdrop hidden';wrap.setAttribute('aria-hidden','true');wrap.innerHTML=`<div class="v354-palette" role="dialog" aria-modal="true" aria-labelledby="v354PaletteTitle"><div class="v354-search-head"><span>⌕</span><input id="v354SearchInput" autocomplete="off" spellcheck="false" placeholder="Tìm trang, bài học, mã kiến thức, dạng toán, câu hỏi…" aria-label="Tìm nhanh toàn hệ thống"><button id="v354CloseSearch" type="button" aria-label="Đóng tìm kiếm">Esc</button></div><div class="v354-search-caption"><b id="v354PaletteTitle">Tìm nhanh Math12 Hub</b><span id="v354SearchHint">Không phát sinh Firestore Reads mới</span></div><div id="v354SearchResults" class="v354-search-results"></div><div class="v354-search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> chọn</span><span><kbd>Enter</kbd> mở</span><span><kbd>☆</kbd> ghim</span><span><kbd>/</kbd> tìm nhanh</span></div></div>`;document.body.appendChild(wrap);wrap.addEventListener('mousedown',e=>{if(e.target===wrap)closePalette()});document.getElementById('v354CloseSearch').addEventListener('click',closePalette);document.getElementById('v354SearchInput').addEventListener('input',e=>renderResults(e.target.value));document.getElementById('v354SearchResults').addEventListener('click',e=>{const pin=e.target.closest('[data-v354-pin]');if(pin){e.stopPropagation();let x=currentResults[Number(pin.dataset.v354Pin)];if(x)togglePin(x);return}const row=e.target.closest('[data-v354-result]');if(row){let x=currentResults[Number(row.dataset.v354Result)];if(x)execute(x)}})}
    const crumbBar=document.querySelector('.v353-breadcrumb-bar');if(crumbBar&&!document.getElementById('v354PinCurrent')){const b=document.createElement('button');b.id='v354PinCurrent';b.className='v354-pin-current';b.type='button';b.addEventListener('click',()=>{const item=getCurrentItem();if(item?.pinnable)togglePin(item)});crumbBar.appendChild(b)}
    ensureSmartDock();
  }
  function ensureSmartDock(){
    const dash=document.getElementById('page-dashboard');if(!dash||document.getElementById('v354SmartDock'))return;
    const dock=document.createElement('div');dock.id='v354SmartDock';dock.className='card mt v354-smart-dock';dock.innerHTML=`<div class="v354-dock-head"><div><span class="v354-kicker">V36.0 • SMART NAVIGATION</span><h3>Truy cập nhanh</h3><p>Ghim mục thường dùng và quay lại công việc gần đây mà không phải tìm lại trong menu.</p></div><button class="btn btn-soft" type="button" data-v354-open-search>⌕ Tìm nhanh <kbd>Ctrl K</kbd></button></div><div class="v354-dock-grid"><div><div class="v354-dock-title"><b>★ Đã ghim</b><small>Tối đa ${MAX_PINS} mục</small></div><div id="v354PinnedList" class="v354-chip-list"></div></div><div><div class="v354-dock-title"><b>↶ Vừa truy cập</b><button type="button" id="v354ClearRecent">Xóa lịch sử</button></div><div id="v354RecentList" class="v354-chip-list"></div></div></div>`;
    const anchor=dash.querySelector('.v353-admin-strip')||dash.querySelector('.v353-role-dashboard')||dash.querySelector('.teacher-only.hero')||dash.querySelector('.student-only.hero');if(anchor)anchor.insertAdjacentElement('afterend',dock);else dash.prepend(dock);
    dock.querySelector('[data-v354-open-search]').addEventListener('click',()=>openPalette());dock.querySelector('#v354ClearRecent').addEventListener('click',()=>{writeJSON(KEYS.recent,[]);renderSmartDock();notify('Đã xóa danh sách vừa truy cập.')});dock.addEventListener('click',e=>{const b=e.target.closest('[data-v354-dock]');if(!b)return;const source=b.dataset.v354Source==='pin'?pins():recents(),item=source[Number(b.dataset.v354Dock)];if(item)execute(item)});
  }
  function dockItem(item,i,source){return `<button type="button" class="v354-dock-item" data-v354-dock="${i}" data-v354-source="${source}" title="${escText(item.subtitle||item.title)}"><span>${escText(item.icon||'•')}</span><b>${escText(item.title)}</b></button>`}
  function renderSmartDock(){ensureSmartDock();const p=document.getElementById('v354PinnedList'),r=document.getElementById('v354RecentList');if(p){const arr=pins();p.innerHTML=arr.length?arr.map((x,i)=>dockItem(x,i,'pin')).join(''):'<div class="v354-dock-empty">Chưa ghim mục nào. Mở một trang rồi bấm <b>☆ Ghim</b>.</div>'}if(r){const arr=recents();r.innerHTML=arr.length?arr.map((x,i)=>dockItem(x,i,'recent')).join(''):'<div class="v354-dock-empty">Các bài/trang vừa mở sẽ xuất hiện ở đây.</div>'}}

  function renderResults(query=''){
    currentResults=searchItems(query);activeIndex=Math.min(activeIndex,Math.max(0,currentResults.length-1));const box=document.getElementById('v354SearchResults'),hint=document.getElementById('v354SearchHint');if(!box)return;if(hint)hint.textContent=query?`${currentResults.length} kết quả phù hợp`:'Gợi ý từ mục đã ghim, gần đây và điều hướng';
    if(!currentResults.length){box.innerHTML='<div class="v354-no-result"><b>Không tìm thấy nội dung phù hợp</b><span>Thử tên bài, mã như F1-01, mã kiến thức hoặc một từ khóa ngắn hơn.</span></div>';return}
    box.innerHTML=currentResults.map((x,i)=>`<div class="v354-result ${i===activeIndex?'active':''}" data-v354-result="${i}" role="option" aria-selected="${i===activeIndex?'true':'false'}"><span class="v354-result-icon">${escText(x.icon||'•')}</span><span class="v354-result-copy"><b>${escText(x.title)}</b><small>${escText(x.subtitle||'')}</small></span><span class="v354-result-type">${escText(({page:'Trang',lesson:'Bài học',chapter:'Chương',knowledge:'Kiến thức',form:'Dạng toán',question:'Câu hỏi',exam:'Đề',class:'Lớp'})[x.type]||x.type)}</span>${x.pinnable?`<button type="button" class="v354-result-pin ${isPinned(x)?'pinned':''}" data-v354-pin="${i}" aria-label="${isPinned(x)?'Bỏ ghim':'Ghim'} ${escText(x.title)}">${isPinned(x)?'★':'☆'}</button>`:''}</div>`).join('');
    box.querySelector('.v354-result.active')?.scrollIntoView({block:'nearest'});
  }
  function openPalette(seed=''){
    injectUI();paletteOpen=true;activeIndex=0;const wrap=document.getElementById('v354Palette');wrap.classList.remove('hidden');wrap.setAttribute('aria-hidden','false');document.body.classList.add('v354-search-open');const input=document.getElementById('v354SearchInput');input.value=seed;renderResults(seed);requestAnimationFrame(()=>input.focus())
  }
  function closePalette(){if(!paletteOpen)return;paletteOpen=false;document.getElementById('v354Palette')?.classList.add('hidden');document.getElementById('v354Palette')?.setAttribute('aria-hidden','true');document.body.classList.remove('v354-search-open')}
  function moveSelection(delta){if(!currentResults.length)return;activeIndex=(activeIndex+delta+currentResults.length)%currentResults.length;renderResults(document.getElementById('v354SearchInput')?.value||'')}

  function getCurrentItem(){const p=currentPage();if(p==='lesson-detail'){try{const x=itemLesson(activeLessonId);if(x)return x}catch(_){}}return allowed(p)?itemPage(p):null}
  function updatePinCurrent(){const b=document.getElementById('v354PinCurrent');if(!b)return;const x=getCurrentItem();if(!x?.pinnable){b.classList.add('hidden');return}b.classList.remove('hidden');const on=isPinned(x);b.classList.toggle('pinned',on);b.innerHTML=on?'★ Đã ghim':'☆ Ghim';b.title=on?'Bỏ khỏi truy cập nhanh':'Ghim mục hiện tại vào truy cập nhanh'}

  function readFilters(){return readJSON(KEYS.filters,{})}
  function rememberFilter(el){if(restoreBusy||!FILTER_IDS.includes(el.id))return;let f=readFilters();f[el.id]=el.value;if(el.id==='bankChapter'){delete f.bankLesson;delete f.bankKnowledge;delete f.bankFormV36}else if(el.id==='bankLesson'){delete f.bankKnowledge;delete f.bankFormV36}else if(el.id==='bankKnowledge')delete f.bankFormV36;writeJSON(KEYS.filters,f)}
  function setIfOption(el,value){if(!el)return false;if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===String(value)))return false;el.value=String(value??'');return true}
  function restoreLessonFilter(){const f=readFilters(),el=document.getElementById('lessonSearch');if(el&&typeof f.lessonSearch==='string'&&el.value!==f.lessonSearch){el.value=f.lessonSearch;try{renderLessons()}catch(_){}}}
  function restoreBankFilters(){if(!allowed('question-bank'))return;const f=readFilters();if(!Object.keys(f).some(k=>k.startsWith('bank')))return;restoreBusy=true;try{
    const ch=document.getElementById('bankChapter');if(typeof refreshBankFilterOptions==='function')refreshBankFilterOptions(true);setIfOption(ch,f.bankChapter||'');if(typeof refreshBankFilterOptions==='function')refreshBankFilterOptions(false);setIfOption(document.getElementById('bankLesson'),f.bankLesson||'');if(typeof refreshBankFilterOptions==='function')refreshBankFilterOptions(false);setIfOption(document.getElementById('bankKnowledge'),f.bankKnowledge||'');if(typeof v360RefreshFormFilter==='function')v360RefreshFormFilter();
    ['bankSearch','bankFormV36','bankLevel','bankType','bankReviewStatus','bankDifficulty','bankSource','bankTag','bankDuplicateFilter','bankQualityV361','bankSort','bankPageSize'].forEach(id=>{if(Object.prototype.hasOwnProperty.call(f,id))setIfOption(document.getElementById(id),f[id])});
    if(typeof renderQuestionBank==='function')renderQuestionBank(false);
  }catch(err){console.warn('V36.0 restore filters',err)}finally{restoreBusy=false}}
  function restoreChapter(){const f=readFilters(),c=Number(f.activeChapter);if(c&&typeof chapters!=='undefined'&&chapters.some(x=>Number(x.id)===c)){try{activeChapter=c}catch(_){}}}

  function installHooks(){
    if(typeof window.goPage==='function'&&!window.goPage.__v354){const base=window.goPage;const wrapped=function(page,internal=false){const out=base(page,internal);requestAnimationFrame(()=>{if(page==='question-bank')setTimeout(restoreBankFilters,40);restoreLessonFilter();updatePinCurrent();renderSmartDock();if(page!=='dashboard'&&page!=='lesson-detail'&&allowed(page))addRecent(itemPage(page))});return out};wrapped.__v354=true;window.goPage=wrapped}
    if(typeof window.openLesson==='function'&&!window.openLesson.__v354){const base=window.openLesson;const wrapped=function(id){const out=base(id);const x=itemLesson(id);if(x)addRecent(x);requestAnimationFrame(updatePinCurrent);return out};wrapped.__v354=true;window.openLesson=wrapped}
    if(typeof window.selectChapter==='function'&&!window.selectChapter.__v354){const base=window.selectChapter;const wrapped=function(id){let f=readFilters();f.activeChapter=Number(id)||1;writeJSON(KEYS.filters,f);return base(id)};wrapped.__v354=true;window.selectChapter=wrapped}
    if(typeof window.applyRoleAccess==='function'&&!window.applyRoleAccess.__v354){const base=window.applyRoleAccess;const wrapped=function(r='student',navigate=false){const out=base(r,navigate);requestAnimationFrame(()=>{renderSmartDock();updatePinCurrent();renderResults(document.getElementById('v354SearchInput')?.value||'')});return out};wrapped.__v354=true;window.applyRoleAccess=wrapped}
  }

  function bindGlobal(){
    document.addEventListener('input',e=>{const el=e.target;if(el instanceof HTMLElement&&FILTER_IDS.includes(el.id))rememberFilter(el)},true);document.addEventListener('change',e=>{const el=e.target;if(el instanceof HTMLElement&&FILTER_IDS.includes(el.id))rememberFilter(el)},true);
    document.addEventListener('keydown',e=>{
      const editable=e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target?.isContentEditable;
      if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();paletteOpen?closePalette():openPalette();return}
      if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!editable&&!paletteOpen&&!document.getElementById('modalBackdrop')?.classList.contains('show')){e.preventDefault();openPalette();return}
      if(!paletteOpen)return;
      if(e.key==='Escape'){e.preventDefault();closePalette()}else if(e.key==='ArrowDown'){e.preventDefault();moveSelection(1)}else if(e.key==='ArrowUp'){e.preventDefault();moveSelection(-1)}else if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();execute(currentResults[activeIndex])}
    });
  }

  function init(){
    document.documentElement.dataset.smartNavBuild=BUILD;restoreChapter();injectUI();installHooks();bindGlobal();restoreLessonFilter();renderSmartDock();updatePinCurrent();
    setTimeout(()=>{restoreLessonFilter();if(currentPage()==='question-bank')restoreBankFilters();renderSmartDock();updatePinCurrent()},700);
  }
  window.v354SmartNavigation={build:BUILD,open:openPalette,close:closePalette,pins,recents,search:searchItems,togglePin};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
