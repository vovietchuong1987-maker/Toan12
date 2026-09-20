/* =========================================================
   Math12 Hub v40.20.0 — Character Platform Core
   Canonical public API for identity, appearance, economy,
   wardrobe/shop, achievements and cross-surface presence.
   Existing schemas remain unchanged; legacy engines are adapters.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.20.0-character-platform-core',SCHEMA=4020,VERSION=402000;
if(window.M12CharacterPlatform?.version>=VERSION)return;
const listeners=new Set();let lastSig='',timer=0,installed=false;
const safe=(fn,fallback=null)=>{try{const v=fn();return v==null?fallback:v}catch(_){return fallback}};
const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch(_){return x}};
const uid=()=>window.firebaseUser?.uid||'local';
function identity(){const p=window.firebaseProfile||{};const name=safe(()=>window.avatarV378DisplayName?.(),null)||p.displayName||p.name||window.firebaseUser?.displayName||'Học sinh Math12';return{uid:uid(),name:String(name),role:String(p.role||window.currentRole||'student'),email:String(window.firebaseUser?.email||p.email||'')}}
function appearance(){return clone(safe(()=>window.AvatarEngine?.get?.(),{gender:'female',skin:'warm',face:'smile',equipped:{}}))}
function resolved(){return clone(safe(()=>window.AvatarEngine?.resolved?.(),{config:appearance(),garment:{},effects:{}}))}
function economy(){return clone(safe(()=>window.v379Economy?.profile?.(),{level:1,gold:0,totalExp:0,rank:'Tân binh Toán học'}))}
function achievements(){const p=clone(safe(()=>window.v388Achievements?.profile?.(),{unlocked:{}}));const defs=window.v388Achievements?.defs||[];const unlocked=Object.keys(p?.unlocked||{}).length;return{...p,unlockedCount:unlocked,totalCount:defs.length}}
function shop(){const p=clone(safe(()=>window.v386MegaShop?.profile?.(),{owned:[],equipped:{}}));return{...p,ownedCount:Array.isArray(p.owned)?p.owned.length:0}}
function favoriteIds(){try{return JSON.parse(localStorage.getItem('math12hub-avatar-favorites-v40194')||'[]')}catch(_){return[]}}
function snapshot(){const a=appearance(),e=economy(),ach=achievements(),s=shop();return{schemaVersion:SCHEMA,build:BUILD,version:VERSION,identity:identity(),appearance:a,resolved:resolved(),economy:e,achievements:ach,shop:s,favorites:favoriteIds(),emotion:safe(()=>window.AvatarEmotion?.status?.().current,'neutral'),revision:Number(a?.revision)||0,updatedAt:String(a?.updatedAt||'')}}
function signature(s=snapshot()){return JSON.stringify([s.identity.uid,s.appearance.revision,s.economy.totalExp,s.economy.gold,s.shop.ownedCount,s.achievements.unlockedCount,s.emotion])}
function notify(reason='sync',detail={}){const s=snapshot(),sig=signature(s);if(sig===lastSig&&reason==='sync')return s;lastSig=sig;const payload={reason,state:s,...detail};for(const fn of [...listeners])try{fn(clone(s),payload)}catch(err){console.warn('[CharacterPlatform subscriber]',err)};try{window.Math12Events?.emit?.('character:changed',payload,{source:'character-platform'})}catch(_){};try{window.dispatchEvent(new CustomEvent('math12hub:character-changed',{detail:payload}))}catch(_){};renderPresenceSurfaces();return s}
function schedule(reason='sync',delay=30){clearTimeout(timer);timer=setTimeout(()=>notify(reason),delay)}
function subscribe(fn,{immediate=true}={}){if(typeof fn!=='function')return()=>{};listeners.add(fn);if(immediate)try{fn(snapshot(),{reason:'subscribe',state:snapshot()})}catch(_){};return()=>listeners.delete(fn)}
function item(id){return safe(()=>window.v385Wardrobe?.item?.(id),null)||safe(()=>window.v386MegaShop?.item?.(id),null)||safe(()=>window.v380Shop?.item?.(id),null)||null}
function set(field,value){const out=safe(()=>window.AvatarEngine?.set?.(field,value),false);schedule('set:'+field);return out}
function apply(config){const out=safe(()=>window.AvatarEngine?.apply?.(config),false);schedule('apply');return out}
function setHair(id,color){const out=safe(()=>window.AvatarEngine?.setHair?.(id,color),false);schedule('hair');return out}
function preview(id){const out=safe(()=>window.AvatarEngine?.preview?.(id),false);schedule('preview',0);return out}
function clearPreview(){const out=safe(()=>window.AvatarEngine?.clearPreview?.(),false);schedule('preview-clear',0);return out}
function equip(id){const it=item(id);if(!it)return false;let out=false;if(safe(()=>window.v385Wardrobe?.item?.(id),null))out=safe(()=>window.v385Wardrobe?.equip?.(id),false);else if(safe(()=>window.v386MegaShop?.item?.(id),null))out=safe(()=>window.v386MegaShop?.equip?.(id),false);else out=safe(()=>window.AvatarEngine?.equip?.(it.slot,id),false);schedule('equip:'+it.slot);return out}
function buy(id){const out=safe(()=>window.v386MegaShop?.buy?.(id),false);schedule('buy');return out}
function setEmotion(value){const out=safe(()=>window.AvatarEmotion?.set?.(value),false);schedule('emotion');return out}
function rendererHtml(options={}){const r=window.M12CharacterAssetRenderer;const cls=options.className||'m12character-presence-avatar';const alt=options.alt||'Nhân vật Math12';if(r?.html)return r.html(cls,alt);const g=appearance().gender==='male'?'male':'female';return `<span class="m12character-presence-fallback"><img src="assets/img/avatar-signature-${g}.png" alt="${String(alt).replace(/"/g,'&quot;')}" loading="lazy" decoding="async"></span>`}
function presenceHtml(options={}){const s=snapshot(),compact=options.compact!==false;return `<div class="m12character-presence ${compact?'is-compact':''}" data-character-platform="${BUILD}"><div class="m12character-presence-visual">${rendererHtml({className:'m12character-presence-avatar',alt:s.identity.name})}</div><div class="m12character-presence-copy"><b>${escapeHtml(s.identity.name)}</b><small>Lv.${s.economy.level||1} • ${escapeHtml(s.economy.rank||'')}</small>${options.showGold===false?'':`<span>🪙 ${Number(s.economy.gold||0).toLocaleString('vi-VN')} • 🏆 ${s.achievements.unlockedCount||0}</span>`}</div></div>`}
function escapeHtml(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mountPresence(target,options={}){const el=typeof target==='string'?document.querySelector(target):target;if(!el)return false;el.innerHTML=presenceHtml(options);el.dataset.characterMounted='1';return true}
function renderPresenceSurfaces(){document.querySelectorAll('[data-character-presence]').forEach(el=>mountPresence(el,{compact:el.dataset.characterPresence!=='full',showGold:el.dataset.characterGold!=='false'}));const arena=document.querySelector('#arenaPlayerAvatar,.arena-player-avatar,[data-arena-player-avatar]');if(arena)mountPresence(arena,{compact:true})}
function status(){const deps={engine:!!window.AvatarEngine,renderer:!!window.M12CharacterAssetRenderer,economy:!!window.v379Economy,wardrobe:!!window.v385Wardrobe,shop:!!window.v386MegaShop,achievements:!!window.v388Achievements,runtime:!!window.Math12CharacterRuntime};return{build:BUILD,version:VERSION,schema:SCHEMA,ready:Object.values(deps).every(Boolean),dependencies:deps,uid:uid(),revision:Number(appearance().revision)||0,surfaces:document.querySelectorAll('[data-character-presence]').length}}
function install(){if(installed)return;installed=true;safe(()=>window.AvatarEngine?.subscribe?.(()=>schedule('appearance',16)));['math12hub:game-reward','math12hub:attempt-rewarded','math12hub:account-hydrated'].forEach(ev=>window.addEventListener(ev,()=>schedule(ev,50)));window.addEventListener('math12hub:page-changed',()=>setTimeout(renderPresenceSurfaces,0));window.addEventListener('math12hub:arena-ready',()=>setTimeout(renderPresenceSurfaces,0));if(window.Math12Events){window.Math12Events.on('game:reward',()=>schedule('reward',30));window.Math12Events.on('account:hydrated',()=>schedule('hydrate',80))}setTimeout(()=>notify('ready'),60);try{window.dispatchEvent(new CustomEvent('math12hub:character-platform-ready',{detail:{build:BUILD,version:VERSION}}))}catch(_){}}
const API={build:BUILD,version:VERSION,schema:SCHEMA,identity,appearance,resolved,economy,achievements,shop,snapshot,status,item,subscribe,set,apply,setHair,preview,clearPreview,equip,buy,setEmotion,mountPresence,presenceHtml,refresh:(reason='manual')=>notify(reason)};
window.M12CharacterPlatform=API;window.CharacterPlatform=API;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
