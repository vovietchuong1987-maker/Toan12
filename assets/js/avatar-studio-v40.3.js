/* =========================================================
   Math12 Hub — Avatar Studio
   Step 8: professional customization, preview, ownership and saved looks.
   ========================================================= */
(function(){
'use strict';
const BUILD='avatar-step8-complete-studio',SCHEMA=800,PAGE_SIZE=12;
const tabs=[
 {id:'profile',label:'Khuôn mặt',icon:'☺'}, {id:'hair',label:'Tóc',icon:'💇'}, {id:'top',label:'Áo',icon:'👕'},
 {id:'bottom',label:'Quần/Váy',icon:'👖'}, {id:'shoes',label:'Giày',icon:'👟'},
 {id:'accessories',label:'Phụ kiện',icon:'🎓'}, {id:'effects',label:'Hiệu ứng',icon:'✨'}
];
let activeTab='profile',filter='all',searchText='',pageNo=1,previewKey='',viewMap=new Map(),cloudTimer=0;
const uid=()=>firebaseUser?.uid||'local',now=()=>new Date().toISOString();
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch(_){return x}};
function blank(){return {schemaVersion:SCHEMA,ownerUid:uid(),looks:[],updatedAt:''}}
function bucket(){state.avatarStudioV800ByUser=state.avatarStudioV800ByUser&&typeof state.avatarStudioV800ByUser==='object'?state.avatarStudioV800ByUser:{};return state.avatarStudioV800ByUser}
function profile(){const r=bucket()[uid()]||blank();return {...blank(),...r,ownerUid:uid(),looks:Array.isArray(r.looks)?r.looks.slice(-6):[]}}
function persist(p,{cloud=true}={}){
  p={...p,schemaVersion:SCHEMA,ownerUid:uid(),looks:(p.looks||[]).slice(-6),updatedAt:now()};bucket()[uid()]=p;
  try{window.save?.({sync:false,reason:'avatar-studio-step8'})}catch(_){ }
  clearTimeout(cloudTimer);if(cloud&&firebaseUser&&firebaseDb&&!firebaseAccountLocked)cloudTimer=setTimeout(()=>firebaseDb.collection('users').doc(firebaseUser.uid).set({avatarStudioV800:p,updatedAt:firebaseServerTimestamp()},{merge:true}).catch(e=>console.warn('Avatar Studio sync',e)),450);
  return p;
}
function makeView(item,scope,slot=item.slot,key=`${scope}:${item.id}`){return {key,item,scope,slot,isNew:/v391-(1[8-9]|2[0-4])$/.test(item.id||'')}}
function baseViews(){
  const c=window.AvatarEngine?.get?.()||{};return [
    {key:'base:gender:male',scope:'base',field:'gender',value:'male',slot:'profile',item:{id:'male',label:'Nam',icon:'👦'}},
    {key:'base:gender:female',scope:'base',field:'gender',value:'female',slot:'profile',item:{id:'female',label:'Nữ',icon:'👧'}},
    ...Object.entries(AVATAR_V378_SKINS).map(([id,x])=>({key:`base:skin:${id}`,scope:'base',field:'skin',value:id,slot:'profile',item:{id,label:`Da ${x.label}`,icon:'●',color:x.fill}})),
    ...Object.entries(AVATAR_V378_FACES).map(([id,x])=>({key:`base:face:${id}`,scope:'base',field:'face',value:id,slot:'profile',item:{id,label:x.label,icon:id==='smile'?'☺':id==='confident'?'◕':id==='focus'?'⌁':'—'}}))
  ].map(v=>({...v,active:c[v.field]===v.value}));
}
function allViews(){
  if(activeTab==='profile')return baseViews();const rows=[],seen=new Set(),add=v=>{if(!v?.item?.id||seen.has(v.key))return;seen.add(v.key);rows.push(v)};
  const wardrobe=window.v385Wardrobe?.catalog||[],mega=window.v386MegaShop?.catalog||[],legacy=window.v380Shop?.catalog||[];
  if(['hair','top','bottom','shoes'].includes(activeTab)){
    wardrobe.filter(x=>x.slot===activeTab).forEach(x=>add(makeView(x,'wardrobe')));
    if(activeTab==='top')legacy.filter(x=>x.type==='outfit').forEach(x=>add(makeView({...x,slot:'outfit',color:x.top},'legacy','outfit')));
  }else if(activeTab==='accessories'){
    wardrobe.filter(x=>['head','glasses','back','hand'].includes(x.slot)).forEach(x=>add(makeView(x,'wardrobe')));
    legacy.filter(x=>x.type==='accessory').forEach(x=>add(makeView({...x,slot:'accessory'},'legacy','accessory')));
  }else if(activeTab==='effects')mega.filter(x=>['pet','aura','background','emote'].includes(x.slot)).forEach(x=>add(makeView(x,'mega')));
  return rows;
}
function owned(v){if(v.scope==='base')return true;if(v.scope==='wardrobe')return !!window.v385Wardrobe?.unlocked?.(v.item);if(v.scope==='mega')return !!window.v386MegaShop?.owned?.(v.item.id);return !!window.v380Shop?.owned?.(v.item.id)}
function equipped(v){
  const c=window.AvatarEngine?.get?.()||{equipped:{}};if(v.scope==='base')return !!v.active;
  if(v.slot==='outfit')return c.outfit===v.item.id;if(v.item.clear)return !c.equipped?.[v.slot];return c.equipped?.[v.slot]===v.item.id;
}
function purchasable(v){if(v.scope==='base'||owned(v))return false;return !!window.v386MegaShop?.item?.(v.item.id)||!!window.v380Shop?.item?.(v.item.id)}
function rarity(v){return v.item.rarity||((v.item.level||1)>=20?'legendary':(v.item.level||1)>=12?'epic':(v.item.level||1)>=6?'rare':'common')}
function rarityLabel(r){return {common:'Phổ biến',rare:'Hiếm',epic:'Sử thi',legendary:'Huyền thoại'}[r]||r}
function filteredViews(){
  let rows=allViews().filter(v=>!searchText||(v.item.label+' '+(v.item.collection||'')).toLowerCase().includes(searchText.toLowerCase()));
  if(filter==='owned')rows=rows.filter(owned);else if(filter==='worn')rows=rows.filter(equipped);else if(filter==='new')rows=rows.filter(v=>v.isNew);else if(filter==='locked')rows=rows.filter(v=>!owned(v));
  return rows;
}
function actionLabel(v){if(equipped(v))return '✓ Đang mặc';if(owned(v))return 'Mặc ngay';if(purchasable(v))return `Mua ${Number(v.item.price||0).toLocaleString('vi-VN')} 🪙`;return 'Chưa mở khóa'}
function card(v){
  viewMap.set(v.key,v);const has=owned(v),eq=equipped(v),canBuy=purchasable(v),level=Number(window.v379Economy?.profile?.().level)||1,levelLock=!has&&Number(v.item.level||1)>level,r=rarity(v),preview=previewKey===v.key;
  const swatch=v.item.hairColor||v.item.color||v.item.top||'#315bc7',meta=v.scope==='base'?'Miễn phí':has?(v.item.free?'Starter • miễn phí':'Đã sở hữu'):`Lv.${v.item.level||1}${canBuy?` • ${Number(v.item.price||0).toLocaleString('vi-VN')} vàng`:''}`;
  return `<article class="avatar-studio-item ${eq?'equipped':''} ${preview?'previewing':''} ${has?'owned':'locked'}" data-key="${h(v.key)}">
    <button class="avatar-studio-visual" style="--item-color:${h(swatch)}" onclick="AvatarStudio.preview('${h(v.key)}')" ${v.scope==='base'?'disabled':''}><span class="avatar-studio-rarity ${r}">${h(rarityLabel(r))}</span>${v.isNew?'<em>MỚI</em>':''}<i>${h(v.item.icon||'✦')}</i><small>${preview?'ĐANG XEM THỬ':eq?'ĐANG MẶC':has?'ĐÃ SỞ HỮU':'XEM THỬ'}</small></button>
    <div class="avatar-studio-item-copy"><b>${h(v.item.label)}</b><span>${h(v.item.collection||meta)}</span></div>
    <div class="avatar-studio-actions">${v.scope==='base'?`<button onclick="AvatarStudio.equip('${h(v.key)}')">${eq?'✓ Đang chọn':'Chọn'}</button>`:`<button class="preview" onclick="AvatarStudio.preview('${h(v.key)}')">👁 Xem thử</button><button onclick="AvatarStudio.${has?'equip':'buy'}('${h(v.key)}')" ${(eq||(!has&&!canBuy)||levelLock)?'disabled':''}>${levelLock?`Cần Lv.${v.item.level}`:actionLabel(v)}</button>`}</div>
  </article>`;
}
function looksHtml(){
  const looks=profile().looks||[];return `<div class="avatar-studio-looks"><div class="avatar-studio-looks-head"><div><b>Bộ phối của em</b><small>Lưu tối đa 6 cấu hình để thay nhanh.</small></div><button onclick="AvatarStudio.saveLook()">＋ Lưu bộ đang mặc</button></div><div class="avatar-studio-look-list">${looks.length?looks.map((x,i)=>`<div class="avatar-studio-look"><span>${i+1}</span><div><b>${h(x.label)}</b><small>${new Date(x.createdAt).toLocaleDateString('vi-VN')}</small></div><button onclick="AvatarStudio.applyLook('${h(x.id)}')">Áp dụng</button><button class="delete" onclick="AvatarStudio.deleteLook('${h(x.id)}')">×</button></div>`).join(''):'<div class="avatar-studio-empty-look">Chưa lưu bộ phối nào.</div>'}</div></div>`;
}
function render(){
  const root=document.getElementById('avatarV378Page'),grid=root?.querySelector('.avatar-page-grid');if(!root||!grid)return;root.classList.add('avatar-studio-ready');
  let studio=document.getElementById('avatarStudioV800');if(!studio){studio=document.createElement('section');studio.id='avatarStudioV800';studio.className='card avatar-studio';grid.appendChild(studio)}
  viewMap=new Map();const rows=filteredViews(),pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));pageNo=Math.max(1,Math.min(pageNo,pages));const page=rows.slice((pageNo-1)*PAGE_SIZE,pageNo*PAGE_SIZE),cfg=window.AvatarEngine?.get?.()||{},ownedCount=allViews().filter(owned).length,wornCount=Object.values(cfg.equipped||{}).filter(Boolean).length;
  studio.innerHTML=`<div class="avatar-studio-head"><div><div class="avatar-preview-kicker">AVATAR STUDIO</div><h2>Thiết kế nhân vật của em</h2><p>Xem thử trước khi mua, phối đồ theo từng lớp và thay đổi ngay trên nhân vật 3D.</p></div><div class="avatar-studio-live"><span></span><b>LIVE</b><small>Đồng bộ tức thì</small></div></div>
    <div class="avatar-studio-stats"><span><b>${ownedCount}</b> đang sở hữu</span><span><b>${wornCount}</b> slot đang mặc</span><span><b>${profile().looks.length}</b>/6 bộ phối</span><span>Revision <b>#${cfg.revision||0}</b></span></div>
    <nav class="avatar-studio-tabs">${tabs.map(t=>`<button class="${activeTab===t.id?'active':''}" onclick="AvatarStudio.tab('${t.id}')"><i>${t.icon}</i><span>${t.label}</span></button>`).join('')}</nav>
    <div class="avatar-studio-toolbar"><input value="${h(searchText)}" oninput="AvatarStudio.search(this.value)" placeholder="Tìm tóc, áo, phụ kiện…"><div>${[['all','Tất cả'],['owned','Đang sở hữu'],['worn','Đang mặc'],['new','Mới'],['locked','Chưa mở']].map(([id,label])=>`<button class="${filter===id?'active':''}" onclick="AvatarStudio.filter('${id}')">${label}</button>`).join('')}</div>${previewKey?'<button class="avatar-clear-preview" onclick="AvatarStudio.clearPreview()">✕ Bỏ xem thử</button>':''}</div>
    <div class="avatar-studio-result"><span>${rows.length} lựa chọn phù hợp</span><span>Trang ${pageNo}/${pages}</span></div>
    <div class="avatar-studio-grid">${page.length?page.map(card).join(''):'<div class="avatar-studio-empty">Không có vật phẩm phù hợp bộ lọc.</div>'}</div>
    <div class="avatar-studio-pager"><button ${pageNo===1?'disabled':''} onclick="AvatarStudio.page(${pageNo-1})">← Trước</button><span>${pageNo} / ${pages}</span><button ${pageNo===pages?'disabled':''} onclick="AvatarStudio.page(${pageNo+1})">Sau →</button></div>${looksHtml()}`;
  const previewCard=root.querySelector('.avatar-preview-card');if(previewCard){let badge=previewCard.querySelector('.avatar-studio-preview-badge');if(previewKey&&!badge){badge=document.createElement('div');badge.className='avatar-studio-preview-badge';previewCard.appendChild(badge)}if(badge){badge.textContent=previewKey?'👁 Chế độ xem thử':'';badge.hidden=!previewKey}}
}
function view(key){return viewMap.get(key)||allViews().find(x=>x.key===key)||null}
function preview(key){const v=view(key);if(!v||v.scope==='base')return;previewKey=key;window.AvatarEngine?.preview?.(v.item);render()}
function clearPreview(){previewKey='';window.AvatarEngine?.clearPreview?.();render()}
function equip(key){
  const v=view(key);if(!v)return false;let ok=false;
  if(v.scope==='base'){window.AvatarEngine?.set?.(v.field,v.value);ok=true}
  else if(v.scope==='wardrobe')ok=!!window.v385Wardrobe?.equip?.(v.item.id);
  else if(v.scope==='mega')ok=!!window.v386MegaShop?.equip?.(v.item.id);
  else ok=!!window.v380Shop?.equip?.(v.item.id);
  if(ok){previewKey='';window.AvatarEngine?.clearPreview?.();window.AvatarMotion?.reactEquip?.();setTimeout(render,60)}return ok;
}
function buy(key){
  const v=view(key);if(!v)return false;let ok=false;
  if(window.v386MegaShop?.item?.(v.item.id))ok=!!window.v386MegaShop.buy(v.item.id);else if(window.v380Shop?.item?.(v.item.id))ok=!!window.v380Shop.buy(v.item.id);
  if(ok){previewKey='';window.AvatarEngine?.clearPreview?.();setTimeout(render,90)}return ok;
}
function saveLook(){const p=profile(),n=p.looks.length+1,cfg=clone(window.AvatarEngine?.get?.()||{});p.looks.push({id:`look-${Date.now().toString(36)}`,label:`Bộ phối ${n}`,config:cfg,createdAt:now()});persist(p);window.examToast?.('✓ Đã lưu bộ phối hiện tại');render()}
function applyLook(id){const look=profile().looks.find(x=>x.id===id);if(!look)return;window.AvatarEngine?.apply?.(look.config);window.AvatarMotion?.reactEquip?.();window.examToast?.(`✓ Đã áp dụng ${look.label}`);render()}
function deleteLook(id){const p=profile(),look=p.looks.find(x=>x.id===id);if(!look||!confirm(`Xóa ${look.label}?`))return;p.looks=p.looks.filter(x=>x.id!==id);persist(p);render()}
function adoptCloud(){const c=firebaseProfile?.avatarStudioV800;if(!c)return;const l=profile(),ct=Date.parse(c.updatedAt||0)||0,lt=Date.parse(l.updatedAt||0)||0;if(ct>=lt){bucket()[uid()]={...blank(),...clone(c),ownerUid:uid()};try{window.save?.({sync:false,reason:'avatar-studio-cloud-step8'})}catch(_){ }}}
function install(){
  if(typeof window.avatarV378RenderPage==='function'&&!window.avatarV378RenderPage.__avatarStudioV800){const base=window.avatarV378RenderPage;const wrapped=function(){const out=base.apply(this,arguments);requestAnimationFrame(render);return out};wrapped.__avatarStudioV800=true;window.avatarV378RenderPage=wrapped}
  if(typeof window.goPage==='function'&&!window.goPage.__avatarStudioV800){const base=window.goPage;const wrapped=function(page,internal=false){const out=base(page,internal);if(page==='avatar')requestAnimationFrame(render);return out};wrapped.__avatarStudioV800=true;window.goPage=wrapped}
  if(typeof window.firebaseHydrateUser==='function'&&!window.firebaseHydrateUser.__avatarStudioV800){const base=window.firebaseHydrateUser;const wrapped=async function(){const out=await base.apply(this,arguments);adoptCloud();requestAnimationFrame(render);return out};wrapped.__avatarStudioV800=true;window.firebaseHydrateUser=wrapped}
  window.addEventListener('math12hub:avatar-state-changed',()=>requestAnimationFrame(render));window.addEventListener('math12hub:game-reward',()=>requestAnimationFrame(render));if(document.getElementById('page-avatar')?.classList.contains('active'))render();
}
window.AvatarStudio={build:BUILD,schema:SCHEMA,render,tab(id){if(tabs.some(t=>t.id===id)){activeTab=id;pageNo=1;previewKey='';window.AvatarEngine?.clearPreview?.();render()}},filter(id){filter=id;pageNo=1;render()},search(x){searchText=String(x||'');pageNo=1;render()},page(n){pageNo=Number(n)||1;render()},preview,clearPreview,equip,buy,saveLook,applyLook,deleteLook,profile,adoptCloud};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
