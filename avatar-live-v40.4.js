/* Math12 Hub — Avatar Live Customization / Step 9 */
(function(){
'use strict';
const BUILD='avatar-step9-live-customization',SCHEMA=900;
const uid=()=>window.firebaseUser?.uid||'local';
const now=()=>new Date().toISOString();
const HAIRS=['hair-campus-modern','hair-classic','hair-side','hair-spiky','hair-bob','hair-long','hair-pony'];
const PREMIUM={hair:'hair-campus-modern',top:'top-campus-green',bottom:'bottom-campus-green',shoes:'shoes-campus',back:'back-campus'};
const OLD_STARTERS=new Set(['hair-classic','top-school-blue','bottom-navy','shoes-school']);
let migrated=false,renderQueued=0;
function cfg(){return window.AvatarEngine?.get?.()||{equipped:{}}}
function storage(){try{return state.avatarStep9ByUser||(state.avatarStep9ByUser={})}catch(_){return {}}}
function mark(){const b=storage();b[uid()]={schemaVersion:SCHEMA,updatedAt:now(),migratedPremium:true};try{window.save?.({sync:false,reason:'avatar-step9'})}catch(_){}}
function shouldMigrate(){const c=cfg(),e=c.equipped||{},m=storage()[uid()];if(m?.migratedPremium)return false;const ids=[e.hair,e.top,e.bottom,e.shoes].filter(Boolean);return !ids.length||ids.every(id=>OLD_STARTERS.has(id))}
function applyPremium(showToast=true){
  const e=window.AvatarEngine;if(!e)return false;
  const ok=['hair','top','bottom','shoes','back'].every(slot=>{const id=PREMIUM[slot];return !id||window.v385Wardrobe?.item?.(id)});
  if(!ok)return false;
  e.apply({hairId:PREMIUM.hair,shirt:PREMIUM.top,pants:PREMIUM.bottom,shoes:PREMIUM.shoes,back:PREMIUM.back,hairColor:'#20283B'});
  mark();if(showToast)window.examToast?.('✓ Đã áp dụng phong cách Campus Pro');return true;
}
function migrate(){if(migrated)return;migrated=true;if(shouldMigrate())setTimeout(()=>applyPremium(false),80)}
function set(field,value){const e=window.AvatarEngine;if(!e)return;if(field==='hair')e.setHair(value);else e.set(field,value);requestRender()}
function equip(slot,id){if(window.AvatarEngine?.equip?.(slot,id)){window.AvatarMotion?.reactEquip?.();requestRender();return true}return false}
function randomize(){
  const e=window.AvatarEngine;if(!e)return;
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const genders=['male','female'],skins=['light','warm','tan'],faces=['smile','confident','focus','calm'];
  const gender=pick(genders);e.set('gender',gender);e.set('skin',pick(skins));e.set('face',pick(faces));
  const available=HAIRS.filter(id=>window.v385Wardrobe?.item?.(id)&&window.v385Wardrobe?.unlocked?.(window.v385Wardrobe.item(id)));
  if(available.length)e.setHair(pick(available));
  const looks=[
    {top:'top-campus-green',bottom:'bottom-campus-green',shoes:'shoes-campus',back:'back-campus'},
    {top:'top-school-blue',bottom:'bottom-navy',shoes:'shoes-school',back:''},
    {top:'top-sport',bottom:'bottom-green',shoes:'shoes-school',back:''}
  ];
  const look=pick(looks);for(const [slot,id] of Object.entries(look))e.equip(slot,id);
  window.AvatarMotion?.reactEquip?.();window.examToast?.('✦ Đã tạo phối ngẫu nhiên');requestRender();
}
function resetPremium(){applyPremium(true);requestRender()}
function requestRender(){cancelAnimationFrame(renderQueued);renderQueued=requestAnimationFrame(renderPanel)}
function chip(label,active,onclick,icon=''){return `<button class="av9-chip ${active?'active':''}" onclick="${onclick}" type="button">${icon?`<i>${icon}</i>`:''}<span>${label}</span></button>`}
function renderPanel(){
  const root=document.getElementById('avatarV378Page');if(!root)return;const c=cfg(),e=c.equipped||{};
  let box=document.getElementById('avatarLiveV900');if(!box){box=document.createElement('section');box.id='avatarLiveV900';box.className='card avatar-live-panel';const grid=root.querySelector('.avatar-page-grid');grid?.appendChild(box)}
  if(!box)return;
  const hairItems=HAIRS.map(id=>window.v385Wardrobe?.item?.(id)).filter(Boolean);
  box.innerHTML=`<div class="av9-head"><div><div class="avatar-preview-kicker">LIVE CUSTOMIZER</div><h3>Chỉnh trực tiếp trên nhân vật</h3><p>Mỗi lựa chọn cập nhật tức thì, tự lưu trên máy và đồng bộ tài khoản khi đăng nhập.</p></div><span class="av9-live"><i></i> LIVE</span></div>
  <div class="av9-section"><b>Kiểu nhân vật</b><div class="av9-row">${chip('Nam',c.gender==='male',"AvatarLive.set('gender','male')",'♂')}${chip('Nữ',c.gender==='female',"AvatarLive.set('gender','female')",'♀')}</div></div>
  <div class="av9-section"><b>Tông da</b><div class="av9-row">${chip('Sáng',c.skin==='light',"AvatarLive.set('skin','light')")}${chip('Ấm',c.skin==='warm',"AvatarLive.set('skin','warm')")}${chip('Nâu',c.skin==='tan',"AvatarLive.set('skin','tan')")}</div></div>
  <div class="av9-section"><b>Biểu cảm</b><div class="av9-row">${chip('Thân thiện',c.face==='smile',"AvatarLive.set('face','smile')",'☺')}${chip('Tự tin',c.face==='confident',"AvatarLive.set('face','confident')",'◕')}${chip('Tập trung',c.face==='focus',"AvatarLive.set('face','focus')",'⌁')}${chip('Điềm tĩnh',c.face==='calm',"AvatarLive.set('face','calm')",'—')}</div></div>
  <div class="av9-section"><b>Kiểu tóc</b><div class="av9-row av9-hair">${hairItems.map(it=>chip(it.label,e.hair===it.id,`AvatarLive.equip('hair','${it.id}')`,'✦')).join('')}</div></div>
  <div class="av9-section"><b>Phong cách nhanh</b><div class="av9-actions"><button onclick="AvatarLive.premium()">✦ Campus Pro</button><button onclick="AvatarLive.randomize()">⤨ Ngẫu nhiên</button><button onclick="AvatarStudio?.saveLook?.()">♡ Lưu bộ phối</button></div></div>`;
}
function install(){migrate();window.addEventListener('math12hub:avatar-state-changed',requestRender);window.addEventListener('math12hub:avatar3d-ready',requestRender);if(document.getElementById('page-avatar')?.classList.contains('active'))requestRender();if(typeof window.goPage==='function'&&!window.goPage.__av9){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='avatar')setTimeout(()=>{migrate();renderPanel()},80);return r};wrap.__av9=true;window.goPage=wrap}}
window.AvatarLive={build:BUILD,schema:SCHEMA,set,equip,randomize,premium:resetPremium,render:renderPanel};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
