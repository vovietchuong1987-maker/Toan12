/* =========================================================
   Math12 Hub — Avatar Engine / Single Source of Truth
   Step 6: one canonical config for Avatar, Wardrobe, Shops and Room.
   Existing V37.8–V39 APIs remain available and are mirrored for compatibility.
   ========================================================= */
(function(){
'use strict';
const BUILD='avatar-step6-unified-state',SCHEMA=600;
const WARDROBE_SLOTS=['hair','top','bottom','shoes','head','glasses','back','hand'];
const EFFECT_SLOTS=['pet','aura','background','emote'];
const ALL_SLOTS=[...WARDROBE_SLOTS,'accessory',...EFFECT_SLOTS];
const listeners=new Set();
let previewItem=null,cloudTimer=0,lastSignature='';

const uid=()=>firebaseUser?.uid||'local';
const now=()=>new Date().toISOString();
const copy=x=>{try{return JSON.parse(JSON.stringify(x))}catch(_){return x}};
const validHex=x=>/^#[0-9a-f]{6}$/i.test(String(x||''));
const starterHair=(gender,hair)=>{
  const fallback=gender==='female'?'bob':'short';
  try{return AVATAR_V378_HAIR[gender].some(x=>x.id===hair)?hair:fallback}catch(_){return fallback}
};
function defaults(){
  return {schemaVersion:SCHEMA,ownerUid:uid(),revision:0,initialized:false,
    gender:'male',skin:'warm',face:'smile',eyes:'classic',starterHair:'short',hair:'short',hairColor:'#263248',outfit:'school-blue',
    equipped:{hair:'hair-classic',top:'top-school-blue',bottom:'bottom-navy',shoes:'shoes-school',head:'',glasses:'',back:'',hand:'',accessory:'',pet:'',aura:'',background:'',emote:''},
    updatedAt:''};
}
function bucket(){
  state.avatarEngineV600ByUser=state.avatarEngineV600ByUser&&typeof state.avatarEngineV600ByUser==='object'?state.avatarEngineV600ByUser:{};
  return state.avatarEngineV600ByUser;
}
function sanitize(raw){
  const d=defaults(),x=raw&&typeof raw==='object'?raw:{};
  const gender=x.gender==='female'?'female':'male';
  const skins=typeof AVATAR_V378_SKINS!=='undefined'?AVATAR_V378_SKINS:{};
  const faces=typeof AVATAR_V378_FACES!=='undefined'?AVATAR_V378_FACES:{};
  const outfits=typeof AVATAR_V378_OUTFITS!=='undefined'?AVATAR_V378_OUTFITS:[];
  const starter=starterHair(gender,x.starterHair||x.hair);
  const out={...d,...x,schemaVersion:SCHEMA,ownerUid:uid(),gender,
    skin:skins[x.skin]?x.skin:'warm',face:faces[x.face]?x.face:'smile',eyes:String(x.eyes||'classic'),
    starterHair:starter,hair:String(x.hair||starter),hairColor:validHex(x.hairColor)?x.hairColor:d.hairColor,
    outfit:outfits.some(o=>o.id===x.outfit)?x.outfit:'school-blue',
    equipped:{...d.equipped,...(x.equipped&&typeof x.equipped==='object'?x.equipped:{})},
    revision:Math.max(0,Number(x.revision)||0),initialized:x.initialized===true,updatedAt:String(x.updatedAt||'')};
  for(const slot of ALL_SLOTS)out.equipped[slot]=String(out.equipped[slot]||'');
  return out;
}
function signature(c){
  c=sanitize(c);return JSON.stringify({gender:c.gender,skin:c.skin,face:c.face,eyes:c.eyes,starterHair:c.starterHair,hair:c.hair,hairColor:c.hairColor,outfit:c.outfit,equipped:c.equipped,initialized:c.initialized});
}
function wardrobeItem(id){return window.v385Wardrobe?.item?.(id)||window.v386MegaShop?.item?.(id)||null}
function megaItem(id){return window.v386MegaShop?.item?.(id)||window.v380Shop?.item?.(id)||null}
function syncOutfitSlots(c,id=c.outfit){
  const female=c.gender==='female',sets={
    'school-blue':{top:'top-school-blue',bottom:female?'bottom-skirt-navy':'bottom-navy',shoes:'shoes-school'},
    'school-white':{top:'top-school-white',bottom:female?'bottom-skirt-slate':'bottom-slate',shoes:'shoes-school'},
    'sport-basic':{top:'top-sport',bottom:'bottom-green',shoes:'shoes-school'}
  };
  const set=sets[id];
  if(set)for(const [slot,itemId] of Object.entries(set))c.equipped[slot]=wardrobeItem(itemId)?itemId:'';
  else{c.equipped.top='';c.equipped.bottom='';c.equipped.shoes=''}
  return c;
}
function captureLegacy(){
  const base=window.avatarV378Current?.()||window.avatarV378Stored?.()||{};
  const wp=window.v385Wardrobe?.profile?.()||{equipped:{}},wr=window.v385Wardrobe?.resolved?.(base)||{};
  const old=window.v380Shop?.profile?.()||{equipped:{}},mega=window.v386MegaShop?.profile?.()||{equipped:{}};
  const previous=bucket()[uid()]||defaults(),eq={...defaults().equipped,...(wp.equipped||{})};
  eq.accessory=String(old.equipped?.accessory||previous.equipped?.accessory||'');
  for(const slot of EFFECT_SLOTS)eq[slot]=String(mega.equipped?.[slot]||old.equipped?.[slot]||previous.equipped?.[slot]||'');
  return sanitize({...previous,initialized:base.initialized===true,gender:base.gender,skin:base.skin,face:base.face,
    starterHair:base.hair,hair:wr.hairStyle||base.hair,hairColor:wr.hairColor||previous.hairColor,
    outfit:base.outfit,equipped:eq,updatedAt:previous.updatedAt||base.updatedAt||''});
}
function mirrorLegacy(c){
  c=sanitize(c);const owner=uid(),stamp=c.updatedAt||now();
  const legacyBase={...(state.avatarV378||{}),schemaVersion:1,ownerUid:owner,initialized:c.initialized,gender:c.gender,skin:c.skin,face:c.face,
    hair:starterHair(c.gender,c.starterHair),outfit:c.outfit,level:1,rank:'Tân binh Toán học',starter:true,updatedAt:stamp};
  state.avatarV378=legacyBase;
  state.wardrobeV385ByUser=state.wardrobeV385ByUser&&typeof state.wardrobeV385ByUser==='object'?state.wardrobeV385ByUser:{};
  const oldW=state.wardrobeV385ByUser[owner]||{};
  state.wardrobeV385ByUser[owner]={...oldW,schemaVersion:3921,ownerUid:owner,equipped:{...(oldW.equipped||{}),...Object.fromEntries(WARDROBE_SLOTS.map(s=>[s,c.equipped[s]]))},updatedAt:stamp};
  state.inventoryV380ByUser=state.inventoryV380ByUser&&typeof state.inventoryV380ByUser==='object'?state.inventoryV380ByUser:{};
  const oldI=state.inventoryV380ByUser[owner]||{};
  state.inventoryV380ByUser[owner]={...oldI,schemaVersion:380,ownerUid:owner,equipped:{...(oldI.equipped||{}),accessory:c.equipped.accessory,pet:c.equipped.pet,background:c.equipped.background},updatedAt:stamp};
  state.megaShopV386ByUser=state.megaShopV386ByUser&&typeof state.megaShopV386ByUser==='object'?state.megaShopV386ByUser:{};
  const oldM=state.megaShopV386ByUser[owner]||{};
  state.megaShopV386ByUser[owner]={...oldM,schemaVersion:392,ownerUid:owner,equipped:{...(oldM.equipped||{}),...Object.fromEntries(EFFECT_SLOTS.map(s=>[s,c.equipped[s]]))},updatedAt:stamp};
  try{if(firebaseProfile)firebaseProfile.avatarV378=legacyBase}catch(_){ }
}
function scheduleCloud(c){
  clearTimeout(cloudTimer);
  if(!firebaseUser||!firebaseDb||firebaseAccountLocked)return;
  cloudTimer=setTimeout(()=>{
    const payload=sanitize(c);
    firebaseDb.collection('users').doc(firebaseUser.uid).set({avatarEngineV600:payload,updatedAt:firebaseServerTimestamp()},{merge:true})
      .then(()=>{firebaseProfile={...(firebaseProfile||{}),avatarEngineV600:payload}})
      .catch(err=>console.warn('Avatar Engine cloud sync',err));
  },420);
}
function publicConfig(raw){
  const c=sanitize(raw||current());return Object.freeze({...copy(c),hairId:c.equipped.hair,shirt:c.equipped.top,pants:c.equipped.bottom,shoes:c.equipped.shoes,accessory:c.equipped.accessory});
}
function notify(currentValue,previous,source='engine',changed=[]){
  const detail={build:BUILD,schemaVersion:SCHEMA,source,changed:[...new Set(changed)],current:publicConfig(currentValue),previous:previous?publicConfig(previous):null,at:Date.now()};
  try{window.dispatchEvent(new CustomEvent('math12hub:avatar-state-changed',{detail}))}catch(_){ }
  for(const fn of [...listeners])try{fn(detail.current,detail)}catch(err){console.warn('Avatar subscriber',err)}
  requestAnimationFrame(()=>{
    try{window.v384Avatar3D?.rebuild?.()}catch(_){ }
    try{window.avatarV378RefreshUI?.()}catch(_){ }
    try{window.v385Wardrobe?.render?.()}catch(_){ }
    if(document.getElementById('page-shop')?.classList.contains('active'))try{window.v386MegaShop?.render?.()}catch(_){ }
    renderStatus();
  });
}
function current(){
  let saved=bucket()[uid()];
  if(!saved){saved=captureLegacy();saved.updatedAt=saved.updatedAt||now();bucket()[uid()]=saved;mirrorLegacy(saved);try{window.save?.({sync:false,reason:'avatar-engine-migration-step6'})}catch(_){}}
  return sanitize(saved);
}
function write(next,{source='engine',cloud=true,force=false,changed=[]}={}){
  const previous=current(),clean=sanitize(next),sig=signature(clean);
  if(!force&&sig===signature(previous)){lastSignature=sig;return previous}
  clean.revision=Math.max(previous.revision||0,clean.revision||0)+1;clean.updatedAt=now();
  bucket()[uid()]=clean;mirrorLegacy(clean);lastSignature=sig;
  try{window.save?.({sync:false,reason:'avatar-engine-step6'})}catch(_){ }
  if(cloud)scheduleCloud(clean);notify(clean,previous,source,changed);return clean;
}
function base(){const c=current();return {schemaVersion:1,initialized:c.initialized,ownerUid:c.ownerUid,gender:c.gender,skin:c.skin,face:c.face,hair:c.starterHair,outfit:c.outfit,level:1,rank:'Tân binh Toán học',starter:true,updatedAt:c.updatedAt}}
function resolved(){
  const c=current(),eq={...c.equipped},preview=previewItem,garment={};
  for(const slot of WARDROBE_SLOTS){let it=wardrobeItem(eq[slot]);if(preview?.slot===slot)it=preview;if(it)garment[slot]=it}
  const previewOutfit=preview?.slot==='outfit'?preview:null,fullOutfit=previewOutfit||AVATAR_V378_OUTFITS.find(x=>x.id===c.outfit);
  if(fullOutfit&&(previewOutfit||!garment.top))garment.top={id:fullOutfit.id,color:fullOutfit.top,accent:fullOutfit.accent,topStyle:/hoodie/i.test(fullOutfit.id)?'hoodie':/coat|scholar/i.test(fullOutfit.id)?'blazer':'shirt'};
  if(fullOutfit&&(previewOutfit||!garment.bottom))garment.bottom={id:fullOutfit.id,color:fullOutfit.bottom,bottomStyle:c.gender==='female'?'skirt':'trousers'};
  garment.hairStyle=garment.hair?.hairStyle||c.hair||c.starterHair;
  garment.hairColor=garment.hair?.hairColor||garment.hair?.color||c.hairColor;
  garment.topColor=garment.top?.color;garment.accent=garment.top?.accent;garment.bottomColor=garment.bottom?.color;garment.shoeColor=garment.shoes?.color;
  const effects={};for(const slot of ['accessory',...EFFECT_SLOTS]){let it=megaItem(eq[slot]);if(preview?.slot===slot)it=preview;if(it)effects[slot]=it}
  return {config:publicConfig(c),base:base(),garment,effects,preview:preview?copy(preview):null};
}
function ingest(source='legacy'){
  const next=captureLegacy(),before=current();
  if(signature(next)===signature(before)){lastSignature=signature(before);return before}
  const changed=[];for(const k of ['gender','skin','face','starterHair','hair','hairColor','outfit'])if(next[k]!==before[k])changed.push(k);
  for(const slot of ALL_SLOTS)if(next.equipped[slot]!==before.equipped[slot])changed.push(slot);
  return write(next,{source,changed});
}
function setBase(field,value){
  const c=current();
  if(field==='gender'){
    c.gender=value==='female'?'female':'male';c.starterHair=starterHair(c.gender,c.gender==='female'?'bob':'short');
    c.hair=c.starterHair;const hid=c.gender==='female'?'hair-bob':'hair-classic',hit=wardrobeItem(hid);if(hit){c.equipped.hair=hid;c.hairColor=hit.hairColor||hit.color||c.hairColor}syncOutfitSlots(c);
  }else if(field==='skin'&&AVATAR_V378_SKINS[value])c.skin=value;
  else if(field==='face'&&AVATAR_V378_FACES[value])c.face=value;
  else if(field==='eyes')c.eyes=String(value||'classic');
  else if(field==='outfit'&&AVATAR_V378_OUTFITS.some(x=>x.id===value)){c.outfit=value;syncOutfitSlots(c,value)}
  else if(field==='hair')return setHair(value);
  else return publicConfig(c);
  return publicConfig(write(c,{source:'set-base',changed:[field]}));
}
function canEquip(slot,id){
  if(!id)return true;
  if(WARDROBE_SLOTS.includes(slot)){const it=wardrobeItem(id);return !!it&&it.slot===slot&&!!window.v385Wardrobe?.unlocked?.(it)}
  if(EFFECT_SLOTS.includes(slot)){const it=window.v386MegaShop?.item?.(id);return !!it&&it.slot===slot&&!!window.v386MegaShop?.owned?.(id)}
  if(slot==='accessory'){const it=window.v380Shop?.item?.(id);return !!it&&it.type==='accessory'&&!!window.v380Shop?.owned?.(id)}
  return false;
}
function equip(slot,id){
  slot=String(slot||'');id=String(id||'');if(!ALL_SLOTS.includes(slot)||!canEquip(slot,id))return false;
  const c=current();c.equipped[slot]=id;
  const it=wardrobeItem(id);if(slot==='hair'&&it){c.hair=it.hairStyle||c.hair;c.hairColor=it.hairColor||it.color||c.hairColor}
  write(c,{source:'equip',changed:[slot]});return true;
}
function setHair(value,color=''){
  const c=current();let it=wardrobeItem(value);
  if(!it)it=(window.v385Wardrobe?.catalog||[]).find(x=>x.slot==='hair'&&x.hairStyle===value&&window.v385Wardrobe?.unlocked?.(x))||null;
  if(it&&canEquip('hair',it.id)){c.equipped.hair=it.id;c.hair=it.hairStyle||c.hair;c.hairColor=validHex(color)?color:(it.hairColor||it.color||c.hairColor)}
  else{const h=starterHair(c.gender,value);if(h!==value)return publicConfig(c);c.starterHair=h;c.hair=h;if(validHex(color))c.hairColor=color}
  return publicConfig(write(c,{source:'set-hair',changed:['hair','hairColor']}));
}
function applyConfig(input={}){
  if(!input||typeof input!=='object')return publicConfig();const c=current(),changed=[];
  if(input.gender!==undefined){c.gender=input.gender==='female'?'female':'male';c.starterHair=starterHair(c.gender,c.gender==='female'?'bob':'short');c.hair=c.starterHair;const hid=c.gender==='female'?'hair-bob':'hair-classic',hit=wardrobeItem(hid);if(hit){c.equipped.hair=hid;c.hairColor=hit.hairColor||hit.color||c.hairColor}syncOutfitSlots(c);changed.push('gender','hair','top','bottom','shoes')}
  if(input.skin!==undefined&&AVATAR_V378_SKINS[input.skin]){c.skin=input.skin;changed.push('skin')}
  if(input.face!==undefined&&AVATAR_V378_FACES[input.face]){c.face=input.face;changed.push('face')}
  if(input.eyes!==undefined){c.eyes=String(input.eyes||'classic');changed.push('eyes')}
  if(input.outfit!==undefined&&AVATAR_V378_OUTFITS.some(x=>x.id===input.outfit)){c.outfit=input.outfit;syncOutfitSlots(c,input.outfit);changed.push('outfit','top','bottom','shoes')}
  const mapping={hairId:'hair',shirt:'top',pants:'bottom',shoes:'shoes',accessory:'accessory',head:'head',glasses:'glasses',back:'back',hand:'hand',pet:'pet',aura:'aura',background:'background',emote:'emote'};
  const incoming={...(input.equipped||{})};for(const [key,slot] of Object.entries(mapping))if(input[key]!==undefined)incoming[slot]=input[key];
  for(const [slot,idRaw] of Object.entries(incoming)){const id=String(idRaw||'');if(ALL_SLOTS.includes(slot)&&canEquip(slot,id)){c.equipped[slot]=id;changed.push(slot)}}
  const hairItem=wardrobeItem(c.equipped.hair);if(input.hair!==undefined){const byStyle=(window.v385Wardrobe?.catalog||[]).find(x=>x.slot==='hair'&&x.hairStyle===input.hair&&window.v385Wardrobe?.unlocked?.(x));if(byStyle){c.equipped.hair=byStyle.id;c.hair=byStyle.hairStyle;changed.push('hair')}else{const h=starterHair(c.gender,input.hair);if(h===input.hair){c.starterHair=h;c.hair=h;changed.push('hair')}}}else if(hairItem)c.hair=hairItem.hairStyle||c.hair;
  if(validHex(input.hairColor)){c.hairColor=input.hairColor;changed.push('hairColor')}else if(hairItem)c.hairColor=hairItem.hairColor||hairItem.color||c.hairColor;
  return publicConfig(write(c,{source:'render-avatar',changed}));
}
function preview(itemOrId){
  previewItem=typeof itemOrId==='string'?wardrobeItem(itemOrId)||megaItem(itemOrId):itemOrId||null;
  notify(current(),current(),'preview',previewItem?.slot?[previewItem.slot]:[]);return resolved();
}
function clearPreview(){if(!previewItem)return;previewItem=null;notify(current(),current(),'preview-clear',[])}
function effect(slot){return resolved().effects[slot]||null}
function subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn)}
function adoptCloud(){
  const cloud=firebaseProfile?.avatarEngineV600;if(!cloud)return current();
  const local=current(),remote=sanitize(cloud),lt=Date.parse(local.updatedAt||0)||0,rt=Date.parse(remote.updatedAt||0)||0;
  if(rt>=lt){bucket()[uid()]=remote;mirrorLegacy(remote);try{window.save?.({sync:false,reason:'avatar-engine-cloud-step6'})}catch(_){ }notify(remote,local,'cloud',['cloud']);return remote}
  return local;
}
function wrapFunction(owner,key,source){
  const fn=owner?.[key];if(typeof fn!=='function'||fn.__avatarEngineV600)return;
  const wrapped=function(){const result=fn.apply(this,arguments);if(result&&typeof result.then==='function')return result.finally(()=>setTimeout(()=>ingest(source),0));setTimeout(()=>ingest(source),0);return result};
  wrapped.__avatarEngineV600=true;wrapped.__avatarEngineBase=fn;owner[key]=wrapped;
}
function wrapLegacyShopEquip(){
  const shop=window.v380Shop,fn=shop?.equip;if(typeof fn!=='function'||fn.__avatarEngineV600)return;
  const wrapped=function(id){
    const it=shop.item?.(id),result=fn.apply(this,arguments);
    if(it?.type==='outfit'&&result!==false)setTimeout(()=>{
      const c=current();c.outfit=id;c.equipped.top='';c.equipped.bottom='';c.equipped.shoes='';
      write(c,{source:'shop-outfit',changed:['outfit','top','bottom','shoes']});
    },8);else setTimeout(()=>ingest('shop-legacy'),0);
    return result;
  };
  wrapped.__avatarEngineV600=true;wrapped.__avatarEngineBase=fn;shop.equip=wrapped;
}
function renderStatus(){
  const root=document.getElementById('avatarV378Page');if(!root)return;let box=document.getElementById('avatarEngineV600Status');
  if(!box){box=document.createElement('section');box.id='avatarEngineV600Status';box.className='card avatar-engine-status';root.appendChild(box)}
  const c=publicConfig(),active=ALL_SLOTS.filter(s=>c.equipped[s]).length;
  box.innerHTML=`<div><span class="avatar-engine-pulse"></span><div><b>Avatar Engine đã đồng bộ</b><small>Một cấu hình dùng chung cho Nhân vật 3D, Tủ đồ, Mega Shop và Phòng học.</small></div></div><div class="avatar-engine-metrics"><span><b>${active}</b> slot đang dùng</span><span><b>#${c.revision}</b> lần cập nhật</span><span>✓ Lưu theo tài khoản</span></div>`;
}
function install(){
  wrapFunction(window,'avatarV378Set','avatar-editor');wrapFunction(window,'avatarV378Save','avatar-save');wrapFunction(window,'avatarV378ResetDraft','avatar-reset');
  wrapFunction(window.v385Wardrobe,'equip','wardrobe');wrapFunction(window.v385Wardrobe,'syncBase','wardrobe-base');
  wrapLegacyShopEquip();wrapFunction(window.v386MegaShop,'equip','mega-shop');
  if(typeof window.avatarV378RenderPage==='function'&&!window.avatarV378RenderPage.__avatarEngineV600){const baseRender=window.avatarV378RenderPage;const wrapped=function(){const out=baseRender.apply(this,arguments);requestAnimationFrame(renderStatus);return out};wrapped.__avatarEngineV600=true;window.avatarV378RenderPage=wrapped}
  if(typeof window.firebaseHydrateUser==='function'&&!window.firebaseHydrateUser.__avatarEngineV600){const hydrate=window.firebaseHydrateUser;const wrapped=async function(){const out=await hydrate.apply(this,arguments);adoptCloud();ingest('account-hydrate');return out};wrapped.__avatarEngineV600=true;window.firebaseHydrateUser=wrapped}
  window.addEventListener('math12hub:avatar-changed',()=>setTimeout(()=>ingest('avatar-event'),0));
  const c=current();lastSignature=signature(c);renderStatus();
}

const API={build:BUILD,schema:SCHEMA,slots:ALL_SLOTS,get:()=>publicConfig(),base,resolved,effect,set:setBase,setHair,equip,apply:applyConfig,renderAvatar:applyConfig,preview,clearPreview,subscribe,ingest,adoptCloud,renderStatus};
window.AvatarEngine=API;window.Math12AvatarEngine=API;
try{Object.defineProperty(window,'AvatarConfig',{configurable:true,get:()=>API.get()})}catch(_){window.AvatarConfig=API.get()}
window.renderAvatar=input=>API.renderAvatar(input);window.setHair=(value,color)=>API.setHair(value,color);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
