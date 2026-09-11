/* =========================================================
   Math12 Hub v40.14.8 — Interactive Math Room
   Semantic object interactions for My Math Room.
   - Reuses the existing Babylon scene; no new 3D framework.
   - Camera focus + hover feedback + data-backed interaction cards.
   - Reads Math12RoomData only; no scoring/Firebase schema changes.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.15.0-interactive-room-premium';
let scene=null, api=null, stage=null, homeCam=null, currentKind='', boundMeshes=[], raf=0, roomDataListener=null;
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
const pct=v=>v==null?'—':`${Math.round(Number(v)*100)}%`;
const score=v=>v==null?'—':Number(v).toFixed(1);
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches||!!window.Math12Platform?.perf?.lowPower?.()}catch(_){return false}};
function data(){try{return window.Math12RoomData?.get?.()||api?.data?.()||null}catch(_){return null}}
function activeStage(){return document.querySelector('#page-room.active .v390-stage')||stage}
function camera(){return scene?.activeCamera||null}
function captureCamera(){const c=camera();if(!c)return null;return {target:c.target?.clone?.()||new BABYLON.Vector3(c.target?.x||0,c.target?.y||0,c.target?.z||0),radius:c.radius,alpha:c.alpha,beta:c.beta}}
function angleLerp(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI;return a+d*t}
function moveCamera(spec,duration=560){
  const c=camera();if(!c||!window.BABYLON)return false;cancelAnimationFrame(raf);
  const from=captureCamera(),target=spec.target?.clone?.()||new BABYLON.Vector3(...spec.target),to={target,radius:spec.radius,alpha:spec.alpha,beta:spec.beta};
  if(reduced()||duration<=0){c.target.copyFrom(to.target);c.radius=to.radius;c.alpha=to.alpha;c.beta=to.beta;return true}
  const start=performance.now(),dur=Math.max(180,duration);
  const tick=now=>{const raw=Math.min(1,(now-start)/dur),t=1-Math.pow(1-raw,3);c.target.copyFrom(BABYLON.Vector3.Lerp(from.target,to.target,t));c.radius=from.radius+(to.radius-from.radius)*t;c.alpha=angleLerp(from.alpha,to.alpha,t);c.beta=from.beta+(to.beta-from.beta)*t;if(raw<1)raf=requestAnimationFrame(tick)};
  raf=requestAnimationFrame(tick);return true;
}
const CAMERAS={
  notebook:{target:[-.85,1.30,-.64],radius:4.45,alpha:-1.48,beta:1.05},
  bookshelf:{target:[2.68,1.58,2.42],radius:5.05,alpha:-1.13,beta:1.16},
  trophy:{target:[3.12,2.45,2.34],radius:4.45,alpha:-1.02,beta:1.12},
  board:{target:[-.50,2.42,2.72],radius:5.20,alpha:-1.47,beta:1.20},
  window:{target:[-3.72,2.28,.18],radius:5.15,alpha:-2.02,beta:1.16},
  chair:{target:[.90,.78,.08],radius:4.50,alpha:-1.02,beta:1.18},
  avatar:{target:[-1.20,1.48,-.16],radius:5.05,alpha:-1.48,beta:1.18}
};
function iconFor(kind){return ({notebook:'📖',bookshelf:'📚',trophy:'🏆',board:'∑',window:'☁',chair:'☕',avatar:'☺'})[kind]||'✦'}
function titleFor(kind){return ({notebook:'Sổ học tập',bookshelf:'Kệ kiến thức',trophy:'Kệ thành tích',board:'Bảng tiến độ',window:'Khoảng lặng',chair:'Góc thư giãn',avatar:'Nhân vật của em'})[kind]||'Math Room'}
function recentAttempt(d){const a=d?.learning?.lastAttempt;if(!a)return '<div class="v40148-empty">Chưa có lượt học gần đây. Bắt đầu một bài ngắn để căn phòng ghi nhận nhịp học của em.</div>';return `<div class="v40148-focus-stat"><span>Gần nhất</span><b>${esc(a.title||'Lượt học')}</b><strong>${score(a.score)}</strong></div>`}
function notebookHtml(d){return `${recentAttempt(d)}<div class="v40148-grid"><div><small>Điểm TB 10 lượt</small><b>${score(d?.learning?.recentAverageScore)}</b></div><div><small>Điểm tốt nhất</small><b>${score(d?.learning?.bestScore)}</b></div><div><small>Bài hoàn thành</small><b>${Number(d?.learning?.lessonsCompleted)||0}</b></div><div><small>Streak</small><b>${Number(d?.learning?.streak)||0} ngày</b></div></div><p class="v40148-copy">Sổ học tập ưu tiên hiển thị nhịp học gần đây để em biết nên tiếp tục từ đâu.</p>`}
function chaptersHtml(d){const rows=(d?.chapters||[]).filter(x=>x.lessons>0);if(!rows.length)return '<div class="v40148-empty">Chưa có dữ liệu tiến độ theo chương.</div>';return `<div class="v40148-list">${rows.map(c=>{const lp=Math.round((Number(c.lessonProgress)||0)*100);return `<div class="v40148-row"><div><b>Chương ${c.id}</b><small>${esc(c.title||'')} • ${c.completed}/${c.lessons} bài${c.masteryAverage==null?'':` • Mastery ${pct(c.masteryAverage)}`}</small></div><strong>${lp}%</strong><i><em style="width:${lp}%"></em></i></div>`}).join('')}</div>`}
function trophyHtml(d){const a=d?.achievements?.recent;return `<div class="v40148-achievement"><span>${esc(a?.icon||'✦')}</span><div><small>Thành tích gần nhất</small><b>${esc(a?.title||'Chưa mở cột mốc đầu tiên')}</b>${a?.at?`<em>${new Date(a.at).toLocaleDateString('vi-VN')}</em>`:''}</div></div><div class="v40148-grid"><div><small>Thành tích</small><b>${Number(d?.achievements?.count)||0}</b></div><div><small>Room level</small><b>${Number(d?.visual?.roomLevel)||1}/5</b></div><div><small>Mã mastered</small><b>${Number(d?.mastery?.mastered)||0}</b></div><div><small>Level học tập</small><b>${Number(d?.identity?.level)||1}</b></div></div>`}
function boardHtml(d){return `<div class="v40148-board-score"><div><small>Mastery tổng hợp</small><b>${pct(d?.mastery?.average)}</b></div><div><small>Coverage</small><b>${pct(d?.mastery?.coverage)}</b></div></div><div class="v40148-grid"><div><small>Mã mastered</small><b>${Number(d?.mastery?.mastered)||0}</b></div><div><small>Tổng mã</small><b>${Number(d?.mastery?.totalCodes)||0}</b></div><div><small>Điểm TB</small><b>${score(d?.learning?.averageScore)}</b></div><div><small>Số lượt học</small><b>${Number(d?.learning?.attempts)||0}</b></div></div><p class="v40148-copy">Bảng này phản ánh năng lực tích lũy, không chỉ một lần làm bài.</p>`}
function windowHtml(d){return `<div class="v40148-window-card"><span>🔥</span><div><small>Nhịp học hiện tại</small><b>${Number(d?.learning?.streak)||0} ngày liên tiếp</b><em>Kỷ lục ${Number(d?.learning?.longestStreak)||0} ngày</em></div></div><p class="v40148-copy">Một khoảng nghỉ ngắn có thể giúp em trở lại bài khó với sự tập trung tốt hơn. Không cần học liên tục để giữ tiến bộ.</p>`}
function chairHtml(d){return `<div class="v40148-grid"><div><small>Điểm gần đây</small><b>${score(d?.learning?.recentAverageScore)}</b></div><div><small>Streak</small><b>${Number(d?.learning?.streak)||0} ngày</b></div><div><small>Bài hoàn thành</small><b>${Number(d?.learning?.lessonsCompleted)||0}</b></div><div><small>Mastery</small><b>${pct(d?.mastery?.average)}</b></div></div><p class="v40148-copy">Ngồi thư giãn một chút. Avatar sẽ trở về tư thế học khi em đóng bảng này.</p>`}
function avatarHtml(d){return `<div class="v40148-avatar-note"><b>Avatar đang đồng bộ với Studio</b><span>Khuôn mặt, tóc, trang phục, biểu cảm và Motion đều dùng chung renderer.</span></div><div class="v40148-grid"><div><small>Level</small><b>${Number(d?.identity?.level)||1}</b></div><div><small>Room level</small><b>${Number(d?.visual?.roomLevel)||1}/5</b></div></div>`}
function bodyFor(kind,d){return ({notebook:notebookHtml,bookshelf:chaptersHtml,trophy:trophyHtml,board:boardHtml,window:windowHtml,chair:chairHtml,avatar:avatarHtml})[kind]?.(d)||''}
function actionFor(kind){
  const map={notebook:{label:'Tiếp tục học theo bài',page:'lessons'},bookshelf:{label:'Mở tiến độ',page:'progress'},trophy:{label:'Xem bộ sưu tập',page:'collections'},board:{label:'Xem hành trình Mastery',page:'journey'},window:{label:'Xem lộ trình hôm nay',page:'learning-plan'},avatar:{label:'Mở Avatar Studio',page:'avatar'}};return map[kind]||null;
}
function ensurePanel(){
  const s=activeStage();if(!s)return null;let panel=s.querySelector('.v40148-interaction-panel');if(panel)return panel;
  panel=document.createElement('section');panel.className='v40148-interaction-panel';panel.setAttribute('aria-live','polite');panel.innerHTML='<button class="v40148-close" type="button" aria-label="Đóng">×</button><div data-v40148-content></div>';s.appendChild(panel);panel.querySelector('.v40148-close').addEventListener('click',close);return panel;
}
function renderPanel(kind){const p=ensurePanel(),d=data();if(!p)return;const action=actionFor(kind);p.querySelector('[data-v40148-content]').innerHTML=`<div class="v40148-kicker">${iconFor(kind)} INTERACTIVE ROOM</div><h3>${titleFor(kind)}</h3>${bodyFor(kind,d)}<div class="v40148-actions">${kind==='chair'?'<button type="button" data-room-action="study">📖 Quay lại bàn học</button>':''}${action?`<button type="button" class="primary" data-room-page="${action.page}">${esc(action.label)}</button>`:''}</div>`;p.classList.add('show');p.querySelectorAll('[data-room-page]').forEach(b=>b.onclick=()=>{close(false);try{window.goPage?.(b.dataset.roomPage)}catch(_){}});p.querySelector('[data-room-action="study"]')?.addEventListener('click',()=>{window.Math12RoomPresence?.go?.('study',{source:'panel'});close()})}
function poseFor(kind){if(kind==='window')return 'window';if(kind==='chair')return 'seated-relax';if(kind==='notebook'||kind==='board'||kind==='bookshelf')return 'study';return 'focus'}
function motionFor(kind){return ({notebook:'think',bookshelf:'nod',trophy:'smallCelebrate',board:'think',window:'headTilt',chair:'headTilt',avatar:'wave'})[kind]||'nod'}
function cameraFor(kind){if(kind!=='avatar')return CAMERAS[kind];const r=api?.getAvatarRoot?.();if(!r?.position)return CAMERAS.avatar;return {...CAMERAS.avatar,target:[r.position.x,r.position.y+1.07,r.position.z-.22]}}
function open(kind){const cameraSpec=cameraFor(kind);if(!cameraSpec)return false;currentKind=kind;moveCamera(cameraSpec);try{if(window.Math12RoomPresence?.goForInteraction)window.Math12RoomPresence.goForInteraction(kind,{gesture:motionFor(kind)});else{api?.setAvatarPose?.(poseFor(kind));setTimeout(()=>api?.playAvatarMotion?.(motionFor(kind)),120)}}catch(_){}renderPanel(kind);hideTip();try{window.Math12Events?.emit?.('room:interaction-opened',{kind,build:BUILD})}catch(_){}return true}
function close(restore=true){currentKind='';const p=activeStage()?.querySelector('.v40148-interaction-panel');p?.classList.remove('show');try{if(window.Math12RoomPresence?.go)window.Math12RoomPresence.go('study',{source:'interaction-close'});else api?.setAvatarPose?.('study')}catch(_){}if(restore&&homeCam)moveCamera(homeCam,520);return true}
function ensureTip(){const s=activeStage();if(!s)return null;let x=s.querySelector('.v40148-object-tip');if(!x){x=document.createElement('div');x.className='v40148-object-tip';s.appendChild(x)}return x}
function showTip(kind){const x=ensureTip();if(!x)return;x.textContent=`${iconFor(kind)} ${titleFor(kind)}`;x.classList.add('show')}
function hideTip(){activeStage()?.querySelector('.v40148-object-tip')?.classList.remove('show')}
function setHover(mesh,on){try{mesh.renderOverlay=!!on;mesh.overlayColor=new BABYLON.Color3(.95,.73,.25);mesh.overlayAlpha=.14}catch(_){}}
const GROUPS={
  notebook:n=>/^notebook|^line[LR]/.test(n),
  bookshelf:n=>/^shelf(Board|Side|Top)|^book\d+/.test(n),
  trophy:n=>/^t(Stem|Cup)\d+|^hero(Stem|Cup|Handle)/.test(n),
  board:n=>/^board(Core|Top|Bottom|Left|Right|Formula)|^chalk/.test(n),
  window:n=>/^window|^wf[VH]|^blind$/.test(n),
  chair:n=>/^chair(Seat|Back|Leg)/.test(n),
  avatar:n=>/^v384|^avatar|^roomAvatar/.test(n)
};
function bindMesh(mesh,kind){if(!mesh||mesh.isDisposed?.())return;mesh.isPickable=true;mesh.metadata={...(mesh.metadata||{}),roomInteraction:kind};const am=new BABYLON.ActionManager(scene);mesh.actionManager=am;am.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger,()=>{setHover(mesh,true);showTip(kind)}));am.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger,()=>{setHover(mesh,false);hideTip()}));am.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger,()=>open(kind)));boundMeshes.push(mesh)}
function clearBindings(){boundMeshes.forEach(m=>{try{m.actionManager?.dispose?.();m.actionManager=null;m.renderOverlay=false}catch(_){}});boundMeshes=[]}
function bindObjects(){clearBindings();Object.entries(GROUPS).forEach(([kind,test])=>{const hits=scene.meshes.filter(m=>test(String(m.name||'')));hits.forEach(m=>bindMesh(m,kind))});scene.hoverCursor='pointer';return boundMeshes.length}
function addHint(){const s=activeStage();if(!s||s.querySelector('.v40148-room-hint'))return;const h=document.createElement('div');h.className='v40148-room-hint';h.innerHTML='<span>✦</span> Chạm vào sổ, kệ sách, cúp, bảng, cửa sổ hoặc ghế';s.appendChild(h);setTimeout(()=>h.classList.add('soft'),5200)}
function mount(nextScene,nextApi){unmount(false);scene=nextScene;api=nextApi||window.v390Room||null;stage=activeStage();if(!scene||!stage||!window.BABYLON)return false;homeCam=captureCamera();bindObjects();addHint();roomDataListener=()=>{if(currentKind)renderPanel(currentKind)};window.addEventListener('math12hub:room-data-changed',roomDataListener);document.documentElement.dataset.roomInteractionsBuild=BUILD;try{window.Math12Events?.emit?.('room:interactions-ready',{count:boundMeshes.length,build:BUILD})}catch(_){}return true}
function rebind(){if(!scene)return 0;return bindObjects()}
function unmount(removeUi=true){cancelAnimationFrame(raf);if(roomDataListener)window.removeEventListener('math12hub:room-data-changed',roomDataListener);roomDataListener=null;clearBindings();if(removeUi){activeStage()?.querySelector('.v40148-interaction-panel')?.remove();activeStage()?.querySelector('.v40148-object-tip')?.remove();activeStage()?.querySelector('.v40148-room-hint')?.remove()}scene=null;api=null;stage=null;homeCam=null;currentKind=''}
window.Math12RoomInteractions={build:BUILD,mount,unmount,rebind,open,close,moveCamera,get current(){return currentKind},get count(){return boundMeshes.length}};
})();
