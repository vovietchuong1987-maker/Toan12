/* Math12 Hub V28 — Student Learning UX
   Personal goal, next-best-action queue, dynamic 7-day plan, mistake notebook.
   Uses local learning state + V27 assignment cache only; no background Firestore queries. */
const V28_DEFAULT_PLAN={targetScore:8,dailyMinutes:35,weeklyDays:5,updatedAt:''};
let v28ActionCache=[];

function v28EnsurePlan(){
  const p=state.studentPlanV28&&typeof state.studentPlanV28==='object'?state.studentPlanV28:{};
  state.studentPlanV28={
    targetScore:Math.min(10,Math.max(5,Number(p.targetScore)||V28_DEFAULT_PLAN.targetScore)),
    dailyMinutes:Math.min(90,Math.max(15,Number(p.dailyMinutes)||V28_DEFAULT_PLAN.dailyMinutes)),
    weeklyDays:Math.min(7,Math.max(2,Number(p.weeklyDays)||V28_DEFAULT_PLAN.weeklyDays)),
    updatedAt:typeof p.updatedAt==='string'?p.updatedAt:''
  };
  return state.studentPlanV28;
}
function v28Plan(){return v28EnsurePlan()}
function v28DateKey(d=new Date()){let x=d instanceof Date?d:new Date(d);return Number.isNaN(x.getTime())?'':`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`}
function v28DateLabel(d){return new Intl.DateTimeFormat('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit'}).format(d).replace('Th ','T')}
function v28RecentActivityKeys(){
  const keys=new Set();
  (state.examAttempts||[]).forEach(x=>{let d=new Date(x.date||0);if(!Number.isNaN(d.getTime()))keys.add(v28DateKey(d))});
  (state.questionHistory||[]).forEach(x=>{let d=new Date(x.date||0);if(!Number.isNaN(d.getTime()))keys.add(v28DateKey(d))});
  return keys
}
function v28MistakeItems(limit=50){
  const latest=new Map();
  analyticsHistory().forEach(h=>{let id=h.questionId||`${h.code}|${h._idx}`;let old=latest.get(id);if(!old||String(h.date||'')>=String(old.date||''))latest.set(id,h)});
  return [...latest.values()].filter(h=>Number(h.credit)<.999).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,limit)
}
function v28MistakeCodes(){
  const map=new Map();v28MistakeItems(100).forEach(h=>{let x=map.get(h.code)||{code:h.code,title:h.title||h.code,count:0,credit:0};x.count++;x.credit+=Number(h.credit)||0;map.set(h.code,x)});
  return [...map.values()].sort((a,b)=>b.count-a.count||a.credit/a.count-b.credit/b.count)
}
function v28AverageScore(){let s=(state.examAttempts||[]).map(x=>Number(x.score)).filter(Number.isFinite);return s.length?s.reduce((a,b)=>a+b,0)/s.length:null}
function v28Readiness(){
  const a=analyticsOverallStats(),avg=v28AverageScore(),completion=TOTAL?state.done.length/TOTAL:0,accuracy=a.accuracy==null?0:a.accuracy,score=avg==null?0:Math.max(0,Math.min(1,avg/10)),streak=Math.min(1,learningStreakDays()/5),evidence=Math.min(1,a.total/40);
  const hasEvidence=a.total>0||(state.examAttempts||[]).length>0||state.done.length>0;
  let value=Math.round(100*(.28*completion+.32*accuracy+.20*score+.10*streak+.10*evidence));
  if(!hasEvidence)value=0;
  return {value,completion,accuracy:a.accuracy,avg,evidence:a.total,label:value>=80?'Đang đi đúng mục tiêu':value>=60?'Nền tảng khá':value>=35?'Đang xây nền':'Cần bắt đầu tích lũy dữ liệu'}
}
function v28AssignmentState(a,now=Date.now()){
  const open=firebaseToDate?.(a.opensAt),due=firebaseToDate?.(a.dueAt),submitted=!!a.submission,graded=submitted&&a.submission.score!=null;
  return {open,due,submitted,graded,isFuture:!!open&&open.getTime()>now,isOver:!!due&&due.getTime()<now,isOpen:(!open||open.getTime()<=now)&&(!due||due.getTime()>=now)}
}
function v28NextIncompleteLessons(){return chapters.flatMap(c=>c.lessons).filter(l=>!state.done.includes(l.id))}
function v28Queue(){
  const now=Date.now(),plan=v28Plan(),q=[];
  for(const a of (typeof firebaseStudentAssignments!=='undefined'?firebaseStudentAssignments:[])||[]){
    const s=v28AssignmentState(a,now);if(s.submitted)continue;
    if(s.isOpen){let left=s.due?s.due.getTime()-now:null;q.push({priority:left!=null&&left<=24*3600e3?0:left!=null&&left<=72*3600e3?1:3,kind:'assignment',title:a.title||'Bài giáo viên giao',meta:`${a.className||'Lớp học'}${s.due?' • hạn '+firebaseDateText(a.dueAt):''}`,reason:left!=null&&left<=24*3600e3?'Ưu tiên cao vì sắp hết hạn.':'Bài đang mở và chưa nộp.',minutes:Number(a.durationMinutes)||45,classId:a.classId,assignmentId:a.id})}
    else if(s.isFuture&&s.open.getTime()<=now+48*3600e3)q.push({priority:4,kind:'upcoming',title:`Sắp mở: ${a.title||'Bài được giao'}`,meta:`${a.className||'Lớp học'} • ${firebaseDateText(a.opensAt)}`,reason:'Chuẩn bị trước kiến thức liên quan.',minutes:10,classId:a.classId,assignmentId:a.id})
  }
  const mistakes=v28MistakeItems(50),mistakeCodes=v28MistakeCodes();
  if(mistakes.length)q.push({priority:2,kind:'mistakes',title:`Luyện lại ${mistakes.length} câu còn sai`,meta:mistakeCodes.slice(0,2).map(x=>x.code).join(' • ')||'Sổ câu sai',reason:'Ôn lại lỗi cũ trước khi học thêm giúp giảm lặp lại sai sót.',minutes:Math.min(plan.dailyMinutes,Math.max(15,mistakes.length*2))});
  const weak=analyticsWeakSkills(4).find(x=>x.total>=2&&x.accuracy<.8)||analyticsWeakSkills(1)[0];
  if(weak)q.push({priority:2.5,kind:'weak',title:`Củng cố ${weak.code}`,meta:`${weak.title} • ${weak.total} lượt • ${weak.accuracy==null?'—':Math.round(weak.accuracy*100)+'%'}`,reason:'Đây là mã kiến thức có kết quả thấp trong lịch sử hiện tại.',minutes:Math.min(plan.dailyMinutes,25),code:weak.code});
  const next=v28NextIncompleteLessons()[0];
  if(next)q.push({priority:5,kind:'lesson',title:`Học tiếp: ${next.common}`,meta:`${next.id} • khoảng ${getLessonMeta(next.id).minutes||45} phút`,reason:'Tiếp tục hoàn thành chương trình theo thứ tự.',minutes:Math.min(plan.dailyMinutes,getLessonMeta(next.id).minutes||45),lessonId:next.id});
  if(!q.length)q.push({priority:9,kind:'exam',title:'Làm đề mô phỏng THPT',meta:'22 câu • 90 phút',reason:'Em đã xử lý các ưu tiên ngắn hạn; hãy kiểm tra năng lực tổng hợp.',minutes:90});
  return q.sort((a,b)=>a.priority-b.priority||a.minutes-b.minutes)
}
function v28RunAction(i=0){
  const x=v28ActionCache[Number(i)]||v28Queue()[Number(i)]||v28Queue()[0];if(!x)return;
  if(x.kind==='assignment')return firebaseOpenAssignment(x.classId,x.assignmentId);
  if(x.kind==='upcoming')return goPage('online');
  if(x.kind==='mistakes')return v28PracticeMistakes(10);
  if(x.kind==='weak')return startAdaptivePractice(10,x.code);
  if(x.kind==='lesson')return openLesson(x.lessonId);
  if(x.kind==='exam')return openFullExam();
}
function v28StartNextAction(){v28ActionCache=v28Queue();return v28RunAction(0)}
function v28PracticeMistakes(count=10){
  count=Math.max(3,Math.min(20,Number(count)||10));const mistakes=v28MistakeItems(80),ids=new Set(mistakes.map(x=>x.questionId).filter(Boolean)),codes=[...new Set(mistakes.map(x=>x.code).filter(Boolean))];
  let pool=(state.questionBank||[]).filter(q=>ids.has(q.id)&&['mcq','tf','tf4','short'].includes(q.type));
  if(pool.length<count){for(const q of (state.questionBank||[])){if(pool.length>=count)break;if(codes.includes(q.knowledgeCode)&&!pool.some(x=>x.id===q.id)&&['mcq','tf','tf4','short'].includes(q.type))pool.push(q)}}
  if(pool.length<3){if(codes[0])return startAdaptivePractice(count,codes[0]);return alert('Chưa có đủ câu sai có thể luyện lại. Hãy làm thêm bài kiểm tra trước.')}
  let selected=examShuffle(pool,Date.now()).slice(0,count),config={id:`mistake-retry-${Date.now()}`,mode:'adaptive',attemptType:'mistake-retry',title:'Luyện lại câu sai • V29',subtitle:`${selected.length} câu • ưu tiên lỗi cũ${codes.length?' • '+codes.slice(0,4).join(' • '):''}`,durationMinutes:Math.max(10,Math.ceil(selected.length*1.8)),questions:selected.map(q=>normalizeBankQuestion(q,'Luyện lại câu sai')),scoring:'standard',adaptiveCodes:codes.slice(0,4)};openExamStart(config)
}
function v28OpenPlanSettings(){
  const p=v28Plan();openModal('Mục tiêu học tập • V29','Cấu hình lộ trình cá nhân; dữ liệu được đồng bộ cùng tiến độ học.',`<div class="firebase-banner"><b>Gợi ý:</b> đặt mục tiêu vừa sức và duy trì đều. Chỉ báo V29 là công cụ định hướng, không dự đoán điểm thi.</div><div class="online-form mt"><label>Mục tiêu điểm</label><select id="v28GoalScore">${[5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10].map(n=>`<option value="${n}" ${Number(p.targetScore)===n?'selected':''}>${n.toFixed(1)}+</option>`).join('')}</select><label>Thời lượng mỗi ngày</label><select id="v28DailyMinutes">${[15,20,25,30,35,40,45,60,75,90].map(n=>`<option value="${n}" ${Number(p.dailyMinutes)===n?'selected':''}>${n} phút</option>`).join('')}</select><label>Số ngày học mỗi tuần</label><select id="v28WeeklyDays">${[2,3,4,5,6,7].map(n=>`<option value="${n}" ${Number(p.weeklyDays)===n?'selected':''}>${n} ngày/tuần</option>`).join('')}</select></div>`,`<button class="btn btn-soft" onclick="closeModal()">Hủy</button><button class="btn btn-blue" onclick="v28SavePlanSettings()">Lưu mục tiêu</button>`)
}
function v28SavePlanSettings(){
  state.studentPlanV28={targetScore:Number(document.getElementById('v28GoalScore')?.value)||8,dailyMinutes:Number(document.getElementById('v28DailyMinutes')?.value)||35,weeklyDays:Number(document.getElementById('v28WeeklyDays')?.value)||5,updatedAt:new Date().toISOString()};save();closeModal();renderAll();examToast?.('Đã cập nhật mục tiêu học tập V28.')
}
function v28WeeklyPlan(){
  const p=v28Plan(),queue=v28Queue(),weak=analyticsWeakSkills(4),mist=v28MistakeItems(50),lessons=v28NextIncompleteLessons(),assignments=((typeof firebaseStudentAssignments!=='undefined'?firebaseStudentAssignments:[])||[]).filter(a=>!a.submission),out=[],activity=v28RecentActivityKeys(),today=new Date();today.setHours(0,0,0,0);
  let wi=0,li=0;
  for(let i=0;i<7;i++){
    let d=new Date(today);d.setDate(d.getDate()+i);let key=v28DateKey(d),dayAssignments=assignments.filter(a=>{let due=firebaseToDate?.(a.dueAt);return due&&v28DateKey(due)===key}),task=null;
    if(dayAssignments.length){let a=dayAssignments[0];task={title:`Hoàn thành: ${a.title||'Bài được giao'}`,meta:`${a.className||'Lớp học'} • hạn hôm nay`,kind:'assignment',classId:a.classId,assignmentId:a.id}}
    else if(i===0&&queue[0])task={...queue[0]};
    else if(mist.length&&i%3===1)task={title:'Ôn sổ câu sai',meta:`${Math.min(mist.length,10)} câu • ${Math.min(p.dailyMinutes,25)} phút`,kind:'mistakes'};
    else if(weak.length&&i%2===0){let w=weak[wi++%weak.length];task={title:`Củng cố ${w.code}`,meta:`${w.title} • ${Math.min(p.dailyMinutes,25)} phút`,kind:'weak',code:w.code}}
    else if(lessons.length){let l=lessons[li++%lessons.length];task={title:l.common,meta:`${l.id} • ${Math.min(p.dailyMinutes,getLessonMeta(l.id).minutes||45)} phút`,kind:'lesson',lessonId:l.id}}
    else task={title:'Ôn tổng hợp / đề ngắn',meta:`${p.dailyMinutes} phút`,kind:'exam'};
    let activeDay=i<p.weeklyDays,status=activity.has(key)?'done':activeDay?'planned':'light';out.push({date:d,key,activeDay,status,...task})
  }
  return out
}
function v28RenderQueue(targetId='v28TodayQueue',limit=4){
  const box=document.getElementById(targetId);if(!box)return;v28ActionCache=v28Queue();const q=v28ActionCache.slice(0,limit);box.innerHTML=q.map((x,i)=>`<div class="v28-queue-item ${i===0?'primary':''}"><div class="v28-queue-rank">${i+1}</div><div><b>${esc(x.title)}</b><small>${esc(x.meta||x.reason||'')}</small></div><button class="btn ${i===0?'btn-blue':'btn-soft'}" onclick="v28RunAction(${i})">${x.kind==='assignment'?'Làm bài':x.kind==='lesson'?'Học':x.kind==='upcoming'?'Xem':x.kind==='exam'?'Thi':'Luyện'}</button></div>`).join('')
}
function v28RenderMistakes(targetId='v28MistakeBook',limit=6){
  const box=document.getElementById(targetId);if(!box)return;const rows=v28MistakeCodes().slice(0,limit),total=v28MistakeItems(100).length;box.innerHTML=rows.length?`<div class="v28-mistake-summary"><div><b>${total}</b><small>Câu còn sai theo lần làm gần nhất</small></div><button class="btn btn-blue" onclick="v28PracticeMistakes(10)">Luyện lại 10 câu</button></div><div class="v28-mistake-list">${rows.map(x=>`<div><span class="skill-code">${esc(x.code)}</span><b>${esc(x.title)}</b><small>${x.count} câu cần xem lại</small><button class="btn btn-soft" onclick="startAdaptivePractice(6,'${attrEsc(x.code)}')">Luyện mã này</button></div>`).join('')}</div>`:'<div class="v28-empty-good"><b>✓ Chưa có câu sai tồn đọng.</b><span>Làm thêm bài kiểm tra để V29 tạo sổ lỗi theo lần làm gần nhất.</span></div>'
}
function v28RenderWeek(targetId='v28WeeklyPlan'){
  const box=document.getElementById(targetId);if(!box)return;const week=v28WeeklyPlan();box.innerHTML=`<div class="v28-week-grid">${week.map((x,i)=>`<div class="v28-day ${x.status}"><div class="v28-day-head"><b>${v28DateLabel(x.date)}</b><span>${x.status==='done'?'✓ Có học':x.status==='light'?'Nghỉ/ôn nhẹ':'Gợi ý'}</span></div><strong>${esc(x.title)}</strong><small>${esc(x.meta||'')}</small>${x.status!=='done'&&x.status!=='light'?`<button class="link-btn" onclick="v28RunWeekAction(${i})">Bắt đầu →</button>`:''}</div>`).join('')}</div>`
}
function v28RunWeekAction(i){const x=v28WeeklyPlan()[Number(i)];if(!x)return;if(x.kind==='assignment')return firebaseOpenAssignment(x.classId,x.assignmentId);if(x.kind==='mistakes')return v28PracticeMistakes(10);if(x.kind==='weak')return startAdaptivePractice(8,x.code);if(x.kind==='lesson')return openLesson(x.lessonId);return openFullExam()}
function v28RenderStudentUX(){
  if(typeof isTeacherRole==='function'&&isTeacherRole())return;const p=v28Plan(),r=v28Readiness(),q=v28Queue(),first=q[0],mist=v28MistakeItems(100).length,weak=analyticsWeakSkills(5).filter(x=>x.total>=2&&x.accuracy<.8).length;
  const text=(id,val)=>{let e=document.getElementById(id);if(e)e.textContent=val},html=(id,val)=>{let e=document.getElementById(id);if(e)e.innerHTML=val};
  text('v28GoalScoreHero',`${Number(p.targetScore).toFixed(1)}+`);text('v28GoalScore',`${Number(p.targetScore).toFixed(1)}+`);text('v28DailyGoal',`${p.dailyMinutes} phút`);text('v28WeeklyGoal',`${p.weeklyDays} ngày`);text('v28ReadinessValue',`${r.value}%`);text('v28ReadinessLabel',r.label);let bar=document.getElementById('v28ReadinessBar');if(bar)bar.style.width=`${r.value}%`;
  text('v28MistakeMetric',mist);text('v28WeakMetric',weak);text('v28PriorityMetric',q.filter(x=>x.priority<=1).length);
  if(first){text('v28NextActionTitle',first.title);text('v28NextActionTitlePlan',first.title);text('v28NextActionMeta',first.meta||`${first.minutes||p.dailyMinutes} phút`);text('v28NextActionReason',first.reason||'Đây là bước ưu tiên tiếp theo theo dữ liệu hiện có.');let b=document.getElementById('v28NextActionBtn');if(b)b.textContent=first.kind==='assignment'?'Làm bài ngay':first.kind==='lesson'?'Học tiếp':first.kind==='exam'?'Thi thử':'Bắt đầu luyện'}
  v28RenderQueue('v28TodayQueue',4);v28RenderQueue('v28PlanQueue',6);v28RenderMistakes('v28MistakeBook',6);v28RenderMistakes('v28PlanMistakes',8);v28RenderWeek('v28WeeklyPlan');v28RenderWeek('v28PlanWeek');
  const summary=`<div class="v28-plan-summary"><div><small>Mục tiêu</small><b>${Number(p.targetScore).toFixed(1)}+</b></div><div><small>Nhịp học</small><b>${p.dailyMinutes}' × ${p.weeklyDays} ngày</b></div><div><small>Chỉ báo lộ trình</small><b>${r.value}%</b></div><button class="btn btn-soft" onclick="v28OpenPlanSettings()">Điều chỉnh</button></div>`;html('v28ProgressPlanSummary',summary);html('v28ProgressSummary',summary)
}
