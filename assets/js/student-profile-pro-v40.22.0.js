/* Math12 Hub v40.22.0 — Achievement & Profile Pro */
(function(){
'use strict';
const BUILD='40.22.0-achievement-profile-pro',VERSION=402200;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=(fn,fallback=null)=>{try{const v=fn();return v==null?fallback:v}catch(_){return fallback}};
function attempts(){return (window.state?.examAttempts||[]).filter(a=>a&&Number.isFinite(Number(a.score))&&a.mode!=='assignment')}
function streak(){
  const native=safe(()=>window.learningStreakDays?.(),null);if(Number.isFinite(Number(native)))return Number(native);
  const days=[...new Set(attempts().map(a=>{const d=new Date(a.date||0);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`:''}).filter(Boolean))];
  let n=0,d=new Date();for(let i=0;i<365;i++){const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;if(days.includes(k))n++;else if(i>0)break;d.setDate(d.getDate()-1)}return n;
}
function learningStats(){
  const aa=attempts(),rows=aa.flatMap(a=>Array.isArray(a.questionResults)?a.questionResults:[]),correct=rows.filter(r=>r?.correct).length,scores=aa.map(a=>Number(a.score)).filter(Number.isFinite);
  const mastery=safe(()=>window.v363MasteryEngine?.masterySummary?.(),{})||{};
  return {attempts:aa.length,questions:rows.length,correct,accuracy:rows.length?correct/rows.length:null,avgScore:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,bestScore:scores.length?Math.max(...scores):null,streak:streak(),mastered:Number(mastery?.counts?.mastered)||0,coverage:Number(mastery?.coverage)||0,totalCodes:Number(mastery?.totalCodes)||0,masteryAverage:mastery?.average==null?null:Number(mastery.average)};
}
function recentAchievements(){
  const p=safe(()=>window.v388Achievements?.profile?.(),{})||{},defs=window.v388Achievements?.defs||[],unlocked=p.unlocked||{};
  return Object.entries(unlocked).map(([id,v])=>{const d=defs.find(x=>x.id===id)||{};return{id,label:d.label||v?.label||id,at:v?.at||v?.date||'',icon:d.icon||'🏆'}}).sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0)).slice(0,6);
}
function summary(){const c=window.M12CharacterPlatform?.snapshot?.()||{},l=learningStats();return{character:c,learning:l,recent:recentAchievements()}}
function metric(label,value,sub=''){return `<div class="m12profile-metric"><small>${esc(label)}</small><b>${esc(value)}</b>${sub?`<span>${esc(sub)}</span>`:''}</div>`}
function render(){
  const root=document.getElementById('m12StudentProfilePro');if(!root)return;const s=summary(),c=s.character||{},i=c.identity||{},e=c.economy||{},a=c.achievements||{},shop=c.shop||{},l=s.learning||{};
  const accuracy=l.accuracy==null?'—':`${Math.round(l.accuracy*100)}%`,avg=l.avgScore==null?'—':l.avgScore.toFixed(2),best=l.bestScore==null?'—':l.bestScore.toFixed(2),mastery=l.masteryAverage==null?'—':`${Math.round(l.masteryAverage*100)}%`;
  const presence=window.M12CharacterPlatform?.presenceHtml?.({compact:false})||'';
  root.innerHTML=`<div class="m12profile-shell">
    <section class="m12profile-hero"><div class="m12profile-presence">${presence}</div><div class="m12profile-head"><div class="m12profile-kicker">STUDENT IDENTITY</div><h2>${esc(i.name||'Học sinh Math12')}</h2><p>Hồ sơ tổng hợp nhân vật, tiến trình học, Mastery và thành tích — chỉ đọc từ dữ liệu học thật của tài khoản.</p><div class="m12profile-actions"><button class="btn btn-blue" onclick="goPage('avatar')">Chỉnh nhân vật</button><button class="btn btn-soft" onclick="goPage('shop')">Mở Shop</button></div></div></section>
    <section class="m12profile-grid">${metric('Level',`Lv.${e.level||1}`,e.rank||'')}${metric('Vàng',Number(e.gold||0).toLocaleString('vi-VN'),'Chỉ dùng cosmetic')}${metric('Streak',`${l.streak||0} ngày`,'Nhịp học liên tục')}${metric('Thành tích',`${a.unlockedCount||0}/${a.totalCount||0}`,'Đã mở khóa')}${metric('Lượt luyện',l.attempts||0,`${l.questions||0} câu đã làm`)}${metric('Độ chính xác',accuracy,`${l.correct||0} câu đúng`)}${metric('Điểm TB',avg,`Cao nhất ${best}`)}${metric('Mastery',mastery,`${l.mastered||0} mã đã làm chủ`)}${metric('Vật phẩm',shop.ownedCount||0,'Đã sở hữu')}</section>
    <section class="m12profile-columns"><div class="card"><div class="section-head"><div><h3>Thành tích gần đây</h3><p>Các mốc đã mở khóa từ hoạt động học tập.</p></div></div><div class="m12profile-achievements">${s.recent.length?s.recent.map(x=>`<div><span>${esc(x.icon)}</span><div><b>${esc(x.label)}</b><small>${x.at?new Date(x.at).toLocaleDateString('vi-VN'):'Đã mở khóa'}</small></div></div>`).join(''):'<p class="muted">Chưa có thành tích mới.</p>'}</div></div><div class="card"><h3>Tổng quan Mastery</h3><div class="m12profile-mastery"><b>${mastery}</b><span>${l.coverage||0}/${l.totalCodes||0} mã kiến thức đã có dữ liệu</span><i><em style="width:${l.masteryAverage==null?0:Math.max(0,Math.min(100,Math.round(l.masteryAverage*100)))}%"></em></i></div><p class="muted">Mastery là chỉ báo học tập; vật phẩm và Avatar không làm thay đổi điểm hay độ khó.</p></div></section>
  </div>`;
}
function inject(){
  try{window.ROLE_ACCESS?.student?.add?.('profile')}catch(_){}
  const nav=document.querySelector('[data-nav-group="student-progress"] .nav-group-items');if(nav&&!nav.querySelector('[data-page="profile"]'))nav.insertAdjacentHTML('beforeend','<button data-page="profile" title="Hồ sơ học tập"><span class="ico">👤</span><span class="nav-label">Hồ sơ</span></button>');
  const main=document.querySelector('main .content')||document.querySelector('main');if(main&&!document.getElementById('page-profile'))main.insertAdjacentHTML('beforeend','<section class="section student-only" id="page-profile"><div id="m12StudentProfilePro"></div></section>');
}
function install(){inject();if(typeof window.goPage==='function'&&!window.goPage.__m12profile4022){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='profile')requestAnimationFrame(render);return r};wrap.__m12profile4022=true;window.goPage=wrap}['math12hub:character-changed','math12hub:attempt-rewarded','math12hub:game-reward','math12hub:account-hydrated','math12hub:state-saved'].forEach(ev=>window.addEventListener(ev,()=>{if(document.getElementById('page-profile')?.classList.contains('active'))setTimeout(render,60)}));setTimeout(render,500)}
window.M12StudentProfilePro={build:BUILD,version:VERSION,learningStats,summary,render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
