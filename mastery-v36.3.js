/* =========================================================
   Math12 Hub  — Mastery Score & Adaptive Learning Engine
   - derives mastery from existing questionHistory (no new Firestore collection)
   - separates verified Secure Exam evidence from self-practice evidence
   - upgrades adaptive practice with difficulty matching, full-bank availability and recency
   - publishes a compact mastery snapshot through the existing progress document
   ========================================================= */
(function(){
  'use strict';
  const BUILD='36.3-mastery-adaptive',SCHEMA=363,PRIOR=0.64,PRIOR_WEIGHT=1.15;
  const DAY=86400000;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
  const nowIso=()=>new Date().toISOString();
  const isVerifiedMode=m=>String(m||'').startsWith('assignment');
  const codeMeta=code=>(typeof allKnowledgeCodes==='function'?allKnowledgeCodes():[]).find(x=>x.code===code)||{code,title:code,lessonId:'',chapterId:0,level:''};
  const humanCode=code=>window.v3821Taxonomy?.humanCode?.(code,true)||code;
  const humanFull=code=>window.v3821Taxonomy?.humanCode?.(code,false)||code;
  const practiceBank=()=>window.V383PracticeBank?.effectiveBank?.()||window.V3822PracticeBank?.effectiveBank?.({approvedOnly:false})||(state?.questionBank||[]);
  const bankMap=()=>new Map(practiceBank().map(q=>[q.id,q]));
  function rows(){return typeof analyticsHistory==='function'?analyticsHistory():[]}
  function difficultyOf(h,map){let q=map.get(h.questionId)||null,d=Number(q?.difficulty);if(Number.isFinite(d))return Math.max(1,Math.min(5,d));return h.level==='VD'?4:h.level==='TH'?3:2}
  function evidenceWeight(h,map,now=Date.now()){
    const t=Date.parse(h.date||'')||now,days=Math.max(0,(now-t)/DAY),recency=.55+.45*Math.exp(-days/60),verified=isVerifiedMode(h.mode)?1.35:1,level=h.level==='VD'?1.12:h.level==='TH'?1.03:.96,diff=1+(difficultyOf(h,map)-3)*.035;
    return verified*recency*level*diff
  }
  function trendFor(list){
    if(list.length<4)return 0;const a=list.slice(-3),b=list.slice(-6,-3);if(!b.length)return 0;const avg=x=>x.reduce((s,r)=>s+clamp(r.credit),0)/Math.max(1,x.length);return avg(a)-avg(b)
  }
  function stateFor(score,evidence,confidence){
    if(evidence<1.8||confidence<.28)return 'new';
    if(score<.55)return 'learn';
    if(score<.75)return 'reinforce';
    if(score<.88)return 'ready';
    return evidence>=5?'mastered':'ready'
  }
  function labelFor(s){return s==='mastered'?'Đã làm chủ':s==='ready'?'Sẵn sàng nâng mức':s==='reinforce'?'Cần củng cố':s==='learn'?'Cần học lại':'Đang thu thập dữ liệu'}
  function targetDifficulty(m){if(!m||m.state==='new')return 2;if(m.score<.55)return 1.7;if(m.score<.75)return 2.5;if(m.score<.88)return 3.4;return 4.25}
  function masteryForCode(code,sourceRows=null,sharedMap=null){
    const map=sharedMap||bankMap(),list=(sourceRows||rows()).filter(h=>h.code===code).sort((a,b)=>(Date.parse(a.date||'')||0)-(Date.parse(b.date||'')||0));
    let w=0,c=0,verifiedEvidence=0,practiceEvidence=0,lastDate='';
    for(const h of list){const ew=evidenceWeight(h,map);w+=ew;c+=ew*clamp(h.credit);if(isVerifiedMode(h.mode))verifiedEvidence+=ew;else practiceEvidence+=ew;if(!lastDate||String(h.date||'')>lastDate)lastDate=h.date||lastDate}
    const score=w?(c+PRIOR*PRIOR_WEIGHT)/(w+PRIOR_WEIGHT):null,confidence=w?1-Math.exp(-w/4):0,meta=codeMeta(code),trend=trendFor(list),stateName=stateFor(score??0,w,confidence);
    return {...meta,score,confidence,evidence:w,attempts:list.length,verifiedEvidence,practiceEvidence,lastDate,trend,state:stateName,label:labelFor(stateName),targetDifficulty:targetDifficulty(score==null?null:{score,state:stateName})}
  }
  function masteryAll(){const hist=rows(),map=bankMap(),available=new Set([...map.values()].map(q=>q?.knowledgeCode).filter(Boolean)),grouped=new Map();for(const h of hist){if(!available.has(h.code))continue;if(!grouped.has(h.code))grouped.set(h.code,[]);grouped.get(h.code).push(h)}return (typeof allKnowledgeCodes==='function'?allKnowledgeCodes():[]).filter(k=>available.has(k.code)).map(k=>masteryForCode(k.code,grouped.get(k.code)||[],map))}
  function masterySummary(){
    const codes=masteryAll(),tested=codes.filter(x=>x.attempts),credible=tested.filter(x=>x.confidence>=.28),weights=credible.reduce((s,x)=>s+x.evidence,0),average=weights?credible.reduce((s,x)=>s+(x.score||0)*x.evidence,0)/weights:null;
    const counts={new:codes.filter(x=>x.state==='new').length,learn:codes.filter(x=>x.state==='learn').length,reinforce:codes.filter(x=>x.state==='reinforce').length,ready:codes.filter(x=>x.state==='ready').length,mastered:codes.filter(x=>x.state==='mastered').length};
    const weak=credible.filter(x=>x.state==='learn'||x.state==='reinforce').sort((a,b)=>(a.score??1)-(b.score??1)||b.evidence-a.evidence),strong=credible.filter(x=>x.state==='mastered'||x.state==='ready').sort((a,b)=>(b.score??0)-(a.score??0));
    return {schemaVersion:SCHEMA,build:BUILD,average,coverage:tested.length,totalCodes:codes.length,counts,weak,strong,codes,generatedAt:nowIso()}
  }
  function latestQuestionState(){const out=new Map();for(const h of rows()){const key=h.questionId||`${h.code}|${h._idx}`;const old=out.get(key);if(!old||String(h.date||'')>=String(old.date||''))out.set(key,h)}return out}
  function mistakeBank(){
    const grouped=new Map();for(const h of rows()){const key=h.questionId||`${h.code}|${h._idx}`,x=grouped.get(key)||{questionId:h.questionId||'',code:h.code,title:h.title||h.code,wrongCount:0,successCount:0,history:[]};x.history.push(h);if(clamp(h.credit)<.999)x.wrongCount++;else x.successCount++;grouped.set(key,x)}
    return [...grouped.values()].map(x=>{x.history.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));const last=x.history.at(-1),lastWrong=[...x.history].reverse().find(h=>clamp(h.credit)<.999);x.lastCredit=clamp(last?.credit);x.lastDate=last?.date||'';x.lastWrongDate=lastWrong?.date||'';x.unresolved=x.lastCredit<.999;let correctStreak=0;for(let i=x.history.length-1;i>=0&&clamp(x.history[i].credit)>=.999;i--)correctStreak++;x.correctStreak=correctStreak;const gap=x.unresolved?0:correctStreak>=2?7:3;x.dueAt=lastWrong?new Date((Date.parse(last?.date||lastWrong.date)||Date.now())+gap*DAY).toISOString():'';x.due=x.unresolved|| (!!x.dueAt&&Date.parse(x.dueAt)<=Date.now());return x}).filter(x=>x.wrongCount).sort((a,b)=>Number(b.unresolved)-Number(a.unresolved)||Number(b.due)-Number(a.due)||String(b.lastWrongDate).localeCompare(String(a.lastWrongDate)))
  }
  function qcSafe(q){try{const a=window.v361QualityEngine?.auditQuestion?.(q);return !a||Number(a.counts?.critical||0)===0}catch(_){return true}}
  function qualityScore(q){try{return window.v361QualityEngine?.auditQuestion?.(q)?.score||100}catch(_){return 100}}
  function questionPriority(q,mastery,lastMap,qcScore=100){
    const last=lastMap.get(q.id),d=Math.max(1,Math.min(5,Number(q.difficulty)|| (q.level==='VD'?4:q.level==='TH'?3:2))),target=mastery?.targetDifficulty||2.5,fit=2.4-Math.abs(d-target)*.7;
    let recency=1.1;if(last){const days=Math.max(0,(Date.now()-(Date.parse(last.date||'')||Date.now()))/DAY);recency=clamp(days/10,0,.9)+(clamp(last.credit)<.999?2.4:-.35)}
    const reviewed=q.reviewStatus==='reviewed'?.25:0,metadata=q.metadataStatusV36==='complete'?.18:0;
    return fit+recency+reviewed+metadata+qcScore/500+Math.random()*.08
  }
  function adaptiveTargets(forcedCode=''){
    const sum=masterySummary(),available=new Set(practiceBank().map(q=>q?.knowledgeCode).filter(Boolean));
    if(forcedCode)return available.has(forcedCode)?sum.codes.filter(x=>x.code===forcedCode):[];
    let target=sum.codes.filter(x=>available.has(x.code)&&x.attempts&&x.state!=='mastered').sort((a,b)=>{const ua=(1-(a.score??PRIOR))*(.65+.35*a.confidence),ub=(1-(b.score??PRIOR))*(.65+.35*b.confidence);return ub-ua||b.evidence-a.evidence});
    if(!target.length){const next=(typeof v28NextIncompleteLessons==='function'?v28NextIncompleteLessons():[]).find(l=>practiceBank().some(q=>q.lessonId===l.id)),first=next?getLessonMeta(next.id)?.knowledge?.map(k=>k.code).find(c=>available.has(c)):'';if(first)target=sum.codes.filter(x=>x.code===first)}
    if(!target.length)target=sum.codes.filter(x=>available.has(x.code)).slice(0,6);
    return target.slice(0,6)
  }
  function selectAdaptive(count=10,forcedCode=''){
    count=Math.max(3,Math.min(20,Number(count)||10));const targets=adaptiveTargets(forcedCode),codes=targets.map(x=>x.code);if(!codes.length)return {questions:[],targets:[],reason:'no-target'};
    const lastMap=latestQuestionState(),used=new Set(),selected=[],summary=masterySummary(),masteryMap=new Map(summary.codes.map(x=>[x.code,x])),bank=practiceBank().filter(q=>codes.includes(q.knowledgeCode)&&['mcq','tf','tf4','short'].includes(q.type));
    const byCode=new Map(codes.map(c=>{const m=masteryMap.get(c)||targets.find(x=>x.code===c),ranked=bank.filter(q=>q.knowledgeCode===c).map(q=>({q,rank:questionPriority(q,m,lastMap,qualityScore(q))})).sort((a,b)=>b.rank-a.rank).map(x=>x.q);return [c,ranked]}));
    let round=0;while(selected.length<count&&round<12){for(const m of targets){const pool=byCode.get(m.code)||[],q=pool.find(x=>!used.has(x.id));if(q){selected.push(q);used.add(q.id);if(selected.length>=count)break}}round++;if(![...byCode.values()].some(p=>p.some(q=>!used.has(q.id))))break}
    if(selected.length<count){const lessons=new Set(targets.map(x=>x.lessonId));const fallback=practiceBank().filter(q=>lessons.has(q.lessonId)&&!used.has(q.id)&&['mcq','tf','tf4','short'].includes(q.type)).map(q=>({q,rank:questionPriority(q,masteryMap.get(q.knowledgeCode),lastMap,qualityScore(q))})).sort((a,b)=>b.rank-a.rank).map(x=>x.q);for(const q of fallback){selected.push(q);used.add(q.id);if(selected.length>=count)break}}
    return {questions:selected.slice(0,count),targets,codes}
  }
  function startAdaptive(count=10,forcedCode=''){
    //  canonicalizes old F1 metadata before selecting. This is intentionally
    // non-destructive to question text/answer and prevents the old lesson shift from
    // producing a false “0 câu khả dụng” warning.
    try{window.v3821Taxonomy?.syncState?.({persist:true,sync:false})}catch(_){}
    const plan=selectAdaptive(count,forcedCode);if(plan.questions.length<1){const label=forcedCode?humanFull(forcedCode):'các nội dung cần luyện';alert(`Hiện chưa có câu hỏi cho ${label} trong ngân hàng tự học.`);return}
    const target=plan.targets.slice(0,4),targetText=target.map(x=>`${humanCode(x.code)} ${x.score==null?'mới':Math.round(x.score*100)+'%'}`).join(''),config={id:`adaptive-v363-${Date.now()}`,mode:'adaptive',attemptType:'adaptive-v363',title:forcedCode?`Luyện thích ứng • ${humanCode(forcedCode)}`:'Luyện thích ứng theo nội dung',subtitle:`${plan.questions.length} câu • ${targetText}`,durationMinutes:Math.max(10,Math.ceil(plan.questions.length*1.8)),questions:plan.questions.map(q=>normalizeBankQuestion(q,'Mastery ')),scoring:'standard',adaptiveCodes:target.map(x=>x.code),v363:{build:BUILD,targets:target.map(x=>({code:x.code,mastery:x.score,confidence:x.confidence,targetDifficulty:x.targetDifficulty})),selectedAt:nowIso()}};openExamStart(config)
  }
  function renderStudentMastery(){
    const box=document.getElementById('v363StudentMastery');if(!box)return;const s=masterySummary(),weak=s.weak.slice(0,5),avg=s.average==null?'—':Math.round(s.average*100)+'%',mist=mistakeBank(),due=mist.filter(x=>x.due).length;
    box.innerHTML=`<div class="v363-mastery-head"><div><span class="v360-kicker">MASTERY SCORE</span><h3>Mức làm chủ kiến thức</h3><p>Tổng hợp theo độ chính xác, độ mới của kết quả, mức độ câu và nguồn Secure Exam/tự luyện. Điểm Mastery là chỉ báo học tập, không thay thế điểm kiểm tra.</p></div><div class="v363-master-score"><b>${avg}</b><small>${s.coverage}/${s.totalCodes} mã có dữ liệu</small></div></div><div class="v363-mastery-metrics"><span><b>${s.counts.mastered}</b><small>Đã làm chủ</small></span><span><b>${s.counts.ready}</b><small>Sẵn sàng nâng mức</small></span><span><b>${s.counts.learn+s.counts.reinforce}</b><small>Cần củng cố</small></span><span><b>${due}</b><small>Câu sai đến hạn ôn</small></span></div><div class="v363-weak-grid">${weak.length?weak.map(x=>`<button type="button" onclick="startAdaptivePractice(6,'${String(x.code).replaceAll("'","\\'")}')"><span><b>${String(x.title||'')}</b><small>${humanCode(x.code)} • ${x.label}</small></span><strong>${Math.round((x.score||0)*100)}%</strong><em>${x.label}</em></button>`).join(''):'<div class="v28-empty-good"><b>Chưa có mã yếu đáng kể.</b><span>Tiếp tục làm bài để tăng độ tin cậy của Mastery Score.</span></div>'}</div>`
  }
  function renderAnalyticsMastery(){
    const box=document.getElementById('v363AnalyticsMastery');if(!box)return;const s=masterySummary(),tested=s.codes.filter(x=>x.attempts).sort((a,b)=>(a.score??1)-(b.score??1));box.innerHTML=`<div class="section-head" style="margin:0 0 10px"><div><span class="v360-kicker">MASTERY ENGINE</span><h3>Mastery Score theo mã kiến thức</h3><p>Confidence tăng khi có thêm bằng chứng; Secure Exam được ưu tiên trọng số hơn tự luyện.</p></div><button class="btn btn-blue" onclick="startAdaptivePractice(10)">⚡ Luyện theo Mastery</button></div><div class="v363-legend"><span class="learn">&lt;55% Học lại</span><span class="reinforce">55–74% Củng cố</span><span class="ready">75–87% Sẵn sàng</span><span class="mastered">≥88% Làm chủ</span></div><div class="v363-mastery-list">${tested.length?tested.map(x=>`<button type="button" class="${x.state}" onclick="startAdaptivePractice(6,'${x.code}')"><div><b>${x.title}</b><small>${humanCode(x.code)} • ${x.attempts} lượt • tin cậy ${Math.round(x.confidence*100)}% • mục tiêu độ khó ~${x.targetDifficulty.toFixed(1)}/5 ${x.trend>.08?'↗ đang tăng':x.trend<-.08?'↘ cần chú ý':''}</small></div><strong>${Math.round((x.score||0)*100)}%</strong></button>`).join(''):'<div class="online-empty">Chưa có dữ liệu Mastery. Hãy làm một bài kiểm tra hoặc luyện tập.</div>'}</div>`
  }
  function teacherRows(c){
    const metas=typeof allKnowledgeCodes==='function'?allKnowledgeCodes():[],map=new Map(metas.map(m=>[m.code,{...m,n:0,sum:0,students:0}]));for(const st of c?.students||[]){const codes=st.progress?.masteryV363?.codes||[];for(const k of codes){if(!map.has(k.code))continue;const x=map.get(k.code),conf=clamp(k.confidence),score=clamp(k.score);if(conf<.28)continue;x.n+=conf;x.sum+=score*conf;x.students++}}
    return [...map.values()].map(x=>({...x,score:x.n?x.sum/x.n:null})).filter(x=>x.score!=null).sort((a,b)=>a.score-b.score||b.students-a.students)
  }
  function renderTeacherMastery(c){
    const box=document.getElementById('v363TeacherMastery');if(!box)return;if(!c){box.innerHTML='<div class="teacher-live-empty">Chọn lớp để xem Mastery đã đồng bộ.</div>';return}const r=teacherRows(c),weak=r.filter(x=>x.score<.75).slice(0,8),covered=r.length,students=(c.students||[]).filter(s=>s.progress?.masteryV363?.coverage).length;box.innerHTML=`<div class="v363-teacher-summary"><span><b>${students}</b><small>HS có Mastery</small></span><span><b>${covered}/${(typeof allKnowledgeCodes==='function'?allKnowledgeCodes().length:57)}</b><small>Mã có dữ liệu lớp</small></span><span><b>${weak.length}</b><small>Mã ưu tiên củng cố</small></span></div><div class="v363-teacher-weak">${weak.length?weak.map(x=>`<button type="button" onclick="typeof v22PrepareSuggestedAssignment==='function'&&v22PrepareSuggestedAssignment('${String(c.classId).replaceAll("'","\\'")}','${x.code}','support')"><span><b>${x.title}</b><small>${humanCode(x.code)} • ${x.students} học sinh có dữ liệu</small></span><strong>${Math.round(x.score*100)}%</strong></button>`).join(''):'<div class="teacher-live-empty">Chưa đủ dữ liệu Mastery hoặc lớp đang có kết quả tốt.</div>'}</div><div class="v22-data-note">Nguồn: <code>progress.masteryV363</code> do học sinh đồng bộ. Đây là chỉ báo cá nhân hóa có trọng số nguồn; năng lực xác minh chính thức của lớp vẫn dùng Secure Exam .</div>`
  }
  function compactSnapshot(){
    const s=masterySummary(),codes=s.codes.filter(x=>x.attempts).map(x=>({code:x.code,score:+Number(x.score||0).toFixed(4),confidence:+Number(x.confidence||0).toFixed(4),attempts:x.attempts,state:x.state,trend:+Number(x.trend||0).toFixed(4),lastDate:x.lastDate||''}));return {schemaVersion:SCHEMA,build:BUILD,average:s.average==null?null:+s.average.toFixed(4),coverage:s.coverage,masteredCount:s.counts.mastered,needsWork:s.counts.learn+s.counts.reinforce,codes,updatedAt:nowIso()}
  }
  function installSyncHooks(){
    if(typeof window.firebaseLearningSnapshot==='function'&&!window.firebaseLearningSnapshot.__v363){const base=window.firebaseLearningSnapshot,wrapped=function(){const x=base();x.schemaVersion=36;x.masteryV363=compactSnapshot();return x};wrapped.__v363=true;window.firebaseLearningSnapshot=wrapped}
    if(typeof window.firebaseProgressSummary==='function'&&!window.firebaseProgressSummary.__v363){const base=window.firebaseProgressSummary,wrapped=function(){const x=base();x.analyticsSchemaVersion=36;x.masteryV363=compactSnapshot();return x};wrapped.__v363=true;window.firebaseProgressSummary=wrapped}
  }
  function injectUI(){
    if(!document.getElementById('v363StudentMastery')){const anchor=document.querySelector('#page-dashboard .section-head.student-only');if(anchor){const card=document.createElement('div');card.id='v363StudentMastery';card.className='card mt student-only v363-mastery-card';anchor.insertAdjacentElement('beforebegin',card)}}
    if(!document.getElementById('v363AnalyticsMastery')){const hero=document.querySelector('#page-analytics .analytics-hero');if(hero){const card=document.createElement('div');card.id='v363AnalyticsMastery';card.className='card mt v363-analytics-card';hero.insertAdjacentElement('afterend',card)}}
    if(!document.getElementById('v363TeacherMastery')){const v31=document.querySelector('#page-teacher .v31-competency-card');if(v31){const card=document.createElement('div');card.className='card mt v363-teacher-card';card.innerHTML='<div class="section-head" style="margin:0 0 10px"><div><span class="v360-kicker">MASTERY CLASS VIEW</span><h3>Mastery cá nhân hóa của lớp</h3><p>Tổng hợp snapshot học tập học sinh đã đồng bộ, có thể gồm cả kết quả Secure Exam đã nhập về thiết bị và tự luyện; không mở thêm collection và không tải submission nền.</p></div><span class="pill">Snapshot</span></div><div id="v363TeacherMastery"><div class="teacher-live-empty">Chọn lớp để xem Mastery đã đồng bộ.</div></div>';v31.insertAdjacentElement('afterend',card)}}
  }
  function installRenderHooks(){
    if(typeof window.startAdaptivePractice==='function'&&!window.startAdaptivePractice.__v363){const wrapped=function(count=10,forcedCode=''){return startAdaptive(count,forcedCode)};wrapped.__v363=true;window.startAdaptivePractice=wrapped}
    if(typeof window.renderAnalytics==='function'&&!window.renderAnalytics.__v363){const base=window.renderAnalytics,wrapped=function(){const r=base();renderAnalyticsMastery();return r};wrapped.__v363=true;window.renderAnalytics=wrapped}
    if(typeof window.v28RenderStudentUX==='function'&&!window.v28RenderStudentUX.__v363){const base=window.v28RenderStudentUX,wrapped=function(){const r=base();renderStudentMastery();return r};wrapped.__v363=true;window.v28RenderStudentUX=wrapped}
    if(typeof window.renderTeacherDashboardCache==='function'&&!window.renderTeacherDashboardCache.__v363){const base=window.renderTeacherDashboardCache,wrapped=function(c){const r=base(c);renderTeacherMastery(c);return r};wrapped.__v363=true;window.renderTeacherDashboardCache=wrapped}
    if(typeof window.resetTeacherDashboardUI==='function'&&!window.resetTeacherDashboardUI.__v363){const base=window.resetTeacherDashboardUI,wrapped=function(...args){const r=base(...args);renderTeacherMastery(null);return r};wrapped.__v363=true;window.resetTeacherDashboardUI=wrapped}
  }
  function regression(){
    const sample=[{date:new Date(Date.now()-5*DAY).toISOString(),code:'F1-01.K1',knowledgeCode:'F1-01.K1',questionId:'R1',level:'NB',mode:'practice',credit:0},{date:new Date(Date.now()-2*DAY).toISOString(),code:'F1-01.K1',knowledgeCode:'F1-01.K1',questionId:'R2',level:'TH',mode:'assignment-graded',credit:1},{date:new Date().toISOString(),code:'F1-01.K1',knowledgeCode:'F1-01.K1',questionId:'R3',level:'TH',mode:'assignment-graded',credit:1}];const old=window.analyticsHistory;try{window.analyticsHistory=()=>sample;const m=masteryForCode('F1-01.K1'),ok=m.score>.55&&m.score<1&&m.verifiedEvidence>m.practiceEvidence&&m.confidence>0;return {ok,score:m.score,confidence:m.confidence,state:m.state}}finally{window.analyticsHistory=old}
  }
  function init(){document.documentElement.dataset.masteryBuild=BUILD;injectUI();installSyncHooks();installRenderHooks();setTimeout(()=>{renderStudentMastery();if(document.getElementById('page-analytics')?.classList.contains('active'))renderAnalyticsMastery();if(typeof firebaseTeacherDashboardCache!=='undefined'&&firebaseTeacherDashboardCache)renderTeacherMastery(firebaseTeacherDashboardCache)},300);window.addEventListener('math12hub:state-saved',()=>{renderStudentMastery();if(document.getElementById('page-analytics')?.classList.contains('active'))renderAnalyticsMastery()})}
  window.v363MasteryEngine={build:BUILD,schema:SCHEMA,masteryForCode,masteryAll,masterySummary,mistakeBank,adaptiveTargets,selectAdaptive,compactSnapshot,regression,stateLabel:labelFor};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
