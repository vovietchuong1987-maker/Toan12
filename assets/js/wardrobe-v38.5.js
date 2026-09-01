/* =========================================================
   Math12 Hub V38.5 — Wardrobe Engine
   Independent cosmetic slots that can later be fed by Mega Shop.
   ========================================================= */
(function(){
'use strict';
const BUILD='39.1-wardrobe-engine-hotfix',SCHEMA=391;
const uid=()=>firebaseUser?.uid||'local';
const slots=[
 {id:'hair',label:'Tóc',icon:'💇'}, {id:'top',label:'Áo',icon:'👕'}, {id:'bottom',label:'Quần/Váy',icon:'👖'},
 {id:'shoes',label:'Giày',icon:'👟'}, {id:'head',label:'Mũ',icon:'🎓'}, {id:'glasses',label:'Kính',icon:'👓'},
 {id:'back',label:'Lưng',icon:'🎒'}, {id:'hand',label:'Cầm tay',icon:'📐'}
];
const catalog=[
 {id:'hair-classic',slot:'hair',label:'Tóc cổ điển',icon:'✦',free:true,hairStyle:'short',hairColor:'#263248'},
 {id:'hair-side',slot:'hair',label:'Rẽ ngôi',icon:'〽',free:true,hairStyle:'side',hairColor:'#2b3143'},
 {id:'hair-bob',slot:'hair',label:'Tóc bob',icon:'◖',free:true,hairStyle:'bob',hairColor:'#293044'},
 {id:'hair-pony',slot:'hair',label:'Buộc cao',icon:'➰',free:true,hairStyle:'pony',hairColor:'#293044'},
 {id:'top-school-blue',slot:'top',label:'Áo đồng phục xanh',icon:'👕',free:true,color:'#EAF2FF',accent:'#315BC7'},
 {id:'top-school-white',slot:'top',label:'Áo đồng phục trắng',icon:'👔',free:true,color:'#FFFFFF',accent:'#64748B'},
 {id:'top-sport',slot:'top',label:'Áo thể thao',icon:'🎽',free:true,color:'#E8F7EF',accent:'#27845A'},
 {id:'top-hoodie-pi',slot:'top',label:'Hoodie π',icon:'π',free:false,color:'#F1EAFE',accent:'#7048C8'},
 {id:'bottom-navy',slot:'bottom',label:'Quần navy',icon:'▥',free:true,color:'#27364E'},
 {id:'bottom-slate',slot:'bottom',label:'Quần slate',icon:'▥',free:true,color:'#334155'},
 {id:'bottom-green',slot:'bottom',label:'Quần xanh',icon:'▥',free:true,color:'#1F4D3A'},
 {id:'bottom-violet',slot:'bottom',label:'Quần tím',icon:'▥',free:false,color:'#3D315F'},
 {id:'shoes-school',slot:'shoes',label:'Giày học đường',icon:'👟',free:true,color:'#263248'},
 {id:'shoes-white',slot:'shoes',label:'Sneaker trắng',icon:'👟',free:false,color:'#F8FAFC'},
 {id:'shoes-blue',slot:'shoes',label:'Sneaker Vector',icon:'👟',free:false,color:'#315BC7'},
 {id:'head-none',slot:'head',label:'Không đội mũ',icon:'○',free:true,clear:true},
 {id:'head-sigma',slot:'head',label:'Mũ Sigma',icon:'Σ',free:false,color:'#315BC7',shape:'cap'},
 {id:'head-crown',slot:'head',label:'Vương miện 10',icon:'♛',free:false,color:'#FFD65A',shape:'crown'},
 {id:'glasses-none',slot:'glasses',label:'Không đeo kính',icon:'○',free:true,clear:true},
 {id:'glasses-scholar',slot:'glasses',label:'Kính học giả',icon:'👓',free:false,color:'#334155'},
 {id:'back-none',slot:'back',label:'Không đeo',icon:'○',free:true,clear:true},
 {id:'back-bookbag',slot:'back',label:'Ba lô sách',icon:'🎒',free:false,color:'#284D8F'},
 {id:'hand-none',slot:'hand',label:'Tay không',icon:'○',free:true,clear:true},
 {id:'hand-compass',slot:'hand',label:'Compa Toán học',icon:'📐',free:false,color:'#E3B341'}
];
let activeSlot='top';
function blank(){return {schemaVersion:SCHEMA,ownerUid:uid(),equipped:{hair:'hair-classic',top:'top-school-blue',bottom:'bottom-navy',shoes:'shoes-school',head:'',glasses:'',back:'',hand:''},updatedAt:''}}
function bucket(){state.wardrobeV385ByUser=state.wardrobeV385ByUser&&typeof state.wardrobeV385ByUser==='object'?state.wardrobeV385ByUser:{};return state.wardrobeV385ByUser}
function sanitize(raw){const x={...blank(),...(raw&&typeof raw==='object'?raw:{})};x.ownerUid=uid();x.schemaVersion=SCHEMA;x.equipped={...blank().equipped,...(x.equipped||{})};for(const s of slots){const id=String(x.equipped[s.id]||'');if(id&&!catalog.some(i=>i.id===id&&i.slot===s.id))x.equipped[s.id]=''}return x}
function profile(){return sanitize(bucket()[uid()]||blank())}
function persist(p){p=sanitize(p);p.updatedAt=new Date().toISOString();bucket()[uid()]=p;try{window.save?.({sync:false,reason:'wardrobe-v38.5'})}catch(_){};try{window.v384Avatar3D?.rebuild?.()}catch(_){};renderPanel();return p}
function item(id){return catalog.find(x=>x.id===id)||null}
function registerItems(items=[]){for(const it of items){if(!it?.id||!it?.slot||catalog.some(x=>x.id===it.id))continue;catalog.push({...it})}return catalog.length}
function unlocked(it){return !!it?.free||!!window.v386MegaShop?.owned?.(it.id)||!!window.v380Shop?.owned?.(it.id)}
function equip(id){const it=item(id);if(!it||!unlocked(it))return false;const p=profile();p.equipped[it.slot]=it.clear?'':it.id;persist(p);try{window.examToast?.(`✓ Đã trang bị ${it.label}`)}catch(_){};return true}
function resolved(base={}){const p=profile(),out={};for(const s of slots){const it=item(p.equipped[s.id]);if(it)out[s.id]=it}out.hairStyle=out.hair?.hairStyle||base.hair;out.hairColor=out.hair?.hairColor||'#263248';out.topColor=out.top?.color;out.accent=out.top?.accent;out.bottomColor=out.bottom?.color;out.shoeColor=out.shoes?.color;return out}
function equippedLabel(s){const id=profile().equipped[s.id],it=item(id);return it?.label||'Không dùng'}
function renderPanel(){
  const root=document.getElementById('avatarV378Page');if(!root)return;let box=document.getElementById('v385Wardrobe');if(!box){box=document.createElement('section');box.className='card v385-wardrobe';box.id='v385Wardrobe';root.appendChild(box)}
  const items=catalog.filter(x=>x.slot===activeSlot),p=profile();
  box.innerHTML=`<div class="v385-wardrobe-head"><div><div class="avatar-preview-kicker">V38.5 • WARDROBE ENGINE</div><h3>Tủ đồ nhiều lớp</h3><p>Mỗi món nằm ở một slot độc lập. Từ V38.6 Shop có thể thêm vật phẩm mà không phải dựng lại nhân vật.</p></div><span class="avatar-save-state saved">8 slot sẵn sàng</span></div><div class="v385-slot-pills">${slots.map(s=>`<button type="button" class="${activeSlot===s.id?'active':''}" onclick="v385Wardrobe.setSlot('${s.id}')">${s.icon} ${s.label}</button>`).join('')}</div><div class="v385-items">${items.map(it=>{const has=unlocked(it),eq=p.equipped[it.slot]===it.id||(!p.equipped[it.slot]&&it.clear);return `<button type="button" class="v385-item ${eq?'equipped':''} ${has?'':'locked'}" ${has?'': 'disabled'} onclick="v385Wardrobe.equip('${it.id}')"><div class="v385-item-icon">${it.icon||'✦'}</div><b>${it.label}</b><small>${has?(it.free?'Starter • miễn phí':'Đã sở hữu'):'Mở tại Shop V38.6'}</small><em>${eq?'Đang dùng':has?'Có sẵn':'Khóa'}</em></button>`}).join('')}</div><div class="v385-equipped">${slots.map(s=>`<span>${s.icon} ${s.label}: ${equippedLabel(s)}</span>`).join('')}</div>`;
}
function setSlot(s){if(slots.some(x=>x.id===s)){activeSlot=s;renderPanel()}}
function install(){
  if(typeof window.avatarV378RenderPage==='function'&&!window.avatarV378RenderPage.__v385){const base=window.avatarV378RenderPage;const wrap=function(){const r=base.apply(this,arguments);requestAnimationFrame(renderPanel);return r};wrap.__v385=true;window.avatarV378RenderPage=wrap}
  if(typeof window.goPage==='function'&&!window.goPage.__v385){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='avatar')requestAnimationFrame(renderPanel);return r};wrap.__v385=true;window.goPage=wrap}
  if(document.getElementById('page-avatar')?.classList.contains('active'))renderPanel();
}
window.v385Wardrobe={build:BUILD,slots,catalog,profile,item,resolved,equip,setSlot,render:renderPanel,unlocked,registerItems};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
