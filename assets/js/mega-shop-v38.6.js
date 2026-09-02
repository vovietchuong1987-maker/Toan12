/* =========================================================
   Math12 Hub V39.2 — Mega Shop + 3D Form Metadata
   300+ cosmetic items, filters, pagination, rarity, owned inventory.
   Cosmetic only: never changes scores, answers, difficulty or mastery.
   ========================================================= */
(function(){
'use strict';
const BUILD='39.2-mega-shop-3d-forms',SCHEMA=392,PAGE_SIZE=40;
const uid=()=>firebaseUser?.uid||'local', now=()=>new Date().toISOString();
const catalog=[];let filterSlot='all',filterRarity='all',sortMode='level',searchText='',pageNo=1;

const colors=[
 ['Navy','#24436F'],['Sky','#4F86E8'],['Mint','#35A879'],['Violet','#7654C8'],
 ['Rose','#D45A82'],['Amber','#D99B26'],['Slate','#4A596E'],['Aqua','#258FA8'],
 ['Crimson','#B6424A'],['Pearl','#E9EEF7'],['Emerald','#17865D'],['Cobalt','#2758C7'],
 ['Lavender','#9A78D7'],['Coral','#E36B62'],['Teal','#197C86'],['Gold','#D4A52D'],
 ['Indigo','#3E4A98'],['Ruby','#A93D55'],['Olive','#6C7C3D'],['Ice','#9CC6E7'],
 ['Charcoal','#343B49'],['Sand','#C49B72'],['Lime','#79A83B'],['Midnight','#17233D']
];
const rarityBy=i=>i<8?'common':i<14?'rare':i<20?'epic':'legendary';
const priceBy=(i,base=180)=>{
 const r=rarityBy(i),m=r==='legendary'?2.15:r==='epic'?1.55:r==='rare'?1.22:1;
 return Math.round((base+i*85)*m/10)*10
};
const levelBy=i=>1+Math.floor(i*1.35);
function add(it){if(!it?.id||catalog.some(x=>x.id===it.id))return;catalog.push({...it})}
function wardrobeSeries(slot,prefix,label,icon,props={}){
 colors.forEach(([name,color],i)=>add({
   id:`${prefix}-${i+1}`,slot,label:`${label} ${name}`,icon,color,
   rarity:rarityBy(i),price:priceBy(i,props.base||180),level:levelBy(i),shop:true,
   ...(props.make?.(i,color,name)||{})
 }))
}
wardrobeSeries('hair','hair-v391','Tóc', '💇',{base:140,make:(i,color)=>({hairStyle:['short','side','spiky','bob','pony','long','curly','undercut','twintail','bun','braid','messy','crew','wavy','layered','flow'][i%16],hairColor:color})});
wardrobeSeries('top','top-v391','Áo Math', '👕',{base:210,make:(i,color)=>({color,accent:colors[(i+5)%colors.length][1],topStyle:['shirt','hoodie','jacket','polo','sport','sweater','blazer','jersey','robe'][i%9]})});
wardrobeSeries('bottom','bottom-v391','Quần/Váy', '👖',{base:180,make:(i,color)=>({color,bottomStyle:['trousers','jogger','shorts','skirt','pleated'][i%5]})});
wardrobeSeries('shoes','shoes-v391','Sneaker', '👟',{base:160,make:(i,color)=>({color,shoeStyle:['school','sneaker','runner','hightop','boot'][i%5]})});
wardrobeSeries('head','head-v391','Mũ học giả', '🎓',{base:230,make:(i,color)=>({color,shape:i>=20?'crown':['cap','scholar','beanie','beret','wizard'][i%5]})});
wardrobeSeries('glasses','glasses-v391','Kính', '👓',{base:150,make:(i,color)=>({color,glassesShape:['round','square','rect','visor','neon'][i%5]})});
wardrobeSeries('back','back-v391','Ba lô', '🎒',{base:220,make:(i,color)=>({color,backStyle:['backpack','satchel','cape','wings'][i%4]})});
wardrobeSeries('hand','hand-v391','Dụng cụ', '📐',{base:190,make:(i,color)=>({color,tool:['compass','book','calculator','ruler'][i%4]})});

const specialGroups=[
 ['pet','pet-v391','Pet','🐾',[
  'Mèo Pi','Cú Euler','Cáo Gauss','Robot Newton','Thỏ Fibonacci','Rồng Vector','Gấu Sigma','Chim Delta',
  'Slime Integral','Drone Oxyz','Cá Heo Parabol','Panda Ma trận','Sói Logarit','Rùa Bayes','Hổ Gradient','Kỳ Lân Infinity',
  'Mèo Schrödinger','Robot Calculus'
 ]],
 ['aura','aura-v391','Aura','✨',[
  'Tia số','Đạo hàm','Tích phân','Vector','Oxyz','Xác suất','Ma trận','Vũ trụ π','Hàm số',
  'Legend 10','Fibonacci','Golden Ratio','Delta','Sigma','Logarit','Parabol','Infinity','Champion'
 ]],
 ['background','bg-v391','Nền','🖼',[
  'Lớp học','Thư viện','Bảng đen','Lưới Oxyz','Phòng Lab','Vũ trụ Toán','Đấu trường','Sân trường',
  'Đêm sao','Phòng Champion','Thành phố Neon','Đảo Hình học','Tháp Calculus','Rừng Fibonacci',
  'Cung điện Sigma','Trạm Oxyz','Studio Toán','Hall of Fame'
 ]],
 ['emote','emote-v391','Emote','🕺',[
  'Vẫy tay','Suy nghĩ','Yes!','Perfect 10','Nhảy Level Up','Cúi chào','High Five','Victory','Spin',
  'Champion','Clap','Study Focus','Power Pose','Happy Jump','Math Dance','Trophy Lift','Peace','Legend'
 ]]
];
specialGroups.forEach(([slot,prefix,label,icon,names])=>names.forEach((name,i)=>add({
 id:`${prefix}-${i+1}`,slot,label:`${label}: ${name}`,icon,
 color:colors[i%colors.length][1],rarity:rarityBy(Math.min(i+4,23)),
 price:priceBy(i+4,300),level:levelBy(i+3)+2,shop:true,variant:i+1
})));

[
 ['head-perfect-10','head','Vương miện Perfect 10','♛','#FFD65A'],
 ['aura-streak-7','aura','Hào quang Streak 7','✦','#F3B63E'],
 ['back-master-function','back','Áo choàng Master Hàm số','🎓','#3556A8'],
 ['pet-master-derivative','pet','Pet Đạo hàm','🐉','#7654C8'],
 ['head-master-oxyz','head','Mũ Master Oxyz','⌖','#315BC7'],
 ['aura-master-probability','aura','Hào quang Bayes','◉','#35A879'],
 ['hand-master-integral','hand','Trượng Tích phân','∫','#D99B26'],
 ['background-grand-master','background','Hall Grand Master','🏆','#8A63D2']
].forEach(([id,slot,label,icon,color])=>add({id,slot,label,icon,color,rarity:'legendary',price:null,level:1,shop:false,exclusive:true}));

const collections=[
 ['calculus','Calculus Elite',['top','bottom','shoes','head','glasses','back','hand','hair'],['∫','Δ','π','Σ','√','∞','f′','dx']],
 ['oxyz','Oxyz Explorer',['top','bottom','shoes','head','glasses','back','hand','hair'],['O','x','y','z','→','⌖','⃗','3D']],
 ['prob','Probability Lab',['top','bottom','shoes','head','glasses','back','hand','hair'],['P','Ω','A','B','∩','∪','|','Bayes']],
 ['champ','Champion 10',['top','bottom','shoes','head','glasses','back','hand','hair'],['10','★','🏆','✓','MAX','PRO','VIP','LEGEND']]
];
collections.forEach(([key,title,slots,icons],setIdx)=>slots.forEach((slot,i)=>{
 const color=colors[(setIdx*6+i+2)%colors.length][1];
 add({id:`collection-${key}-${slot}`,slot,label:`${title} • ${slotLabel(slot)}`,icon:icons[i],
   color,accent:colors[(setIdx*6+i+9)%colors.length][1],
   hairStyle:['short','side','spiky','bob','pony','long'][i%6],hairColor:color,
   tool:['book','calculator','compass','ruler'][i%4],shape:i%4===0?'crown':i%4===1?'scholar':i%4===2?'beanie':'cap',
   topStyle:['hoodie','jacket','blazer','robe'][i%4],bottomStyle:['trousers','jogger','pleated','shorts'][i%4],
   shoeStyle:['sneaker','runner','hightop','boot'][i%4],glassesShape:['round','square','visor','neon'][i%4],backStyle:['backpack','satchel','cape','wings'][i%4],
   rarity:setIdx===3?'legendary':setIdx===2?'epic':'rare',
   price:850+setIdx*550+i*90,level:8+setIdx*7+i,shop:true,collection:title
 })
}));

function slotLabel(s){return {
 all:'Tất cả',hair:'Tóc',top:'Áo',bottom:'Quần/Váy',shoes:'Giày',head:'Mũ',
 glasses:'Kính',back:'Ba lô',hand:'Cầm tay',pet:'Pet',aura:'Aura',
 background:'Nền',emote:'Emote',legacy:'Di sản'
}[s]||s}

function importLegacyCatalog(){
 const old=window.v380Shop?.catalog||[];
 old.forEach(it=>{
   if(catalog.some(x=>x.id===it.id))return;
   add({...it,slot:'legacy',legacyType:it.type,icon:it.type==='outfit'?'👕':it.type==='accessory'?'🎓':it.type==='pet'?'🐾':'🖼',
     rarity:it.shop===false?'legendary':(it.level||1)>=15?'epic':(it.level||1)>=7?'rare':'common',
     color:it.accent||it.top||'#315BC7',collection:'V38 Legacy'})
 })
}
function blank(){return {schemaVersion:SCHEMA,ownerUid:uid(),owned:[],equipped:{pet:'',aura:'',background:'',emote:''},purchases:[],updatedAt:''}}
function bucket(){state.megaShopV386ByUser=state.megaShopV386ByUser&&typeof state.megaShopV386ByUser==='object'?state.megaShopV386ByUser:{};return state.megaShopV386ByUser}
function profile(){const raw=bucket()[uid()]||blank();return {...blank(),...raw,ownerUid:uid(),owned:[...new Set(Array.isArray(raw.owned)?raw.owned:[])],equipped:{...blank().equipped,...(raw.equipped||{})},purchases:Array.isArray(raw.purchases)?raw.purchases.slice(-700):[]}}
function persist(p,{cloud=true}={}){p={...p,schemaVersion:SCHEMA,ownerUid:uid(),updatedAt:now()};bucket()[uid()]=p;try{save({sync:false,reason:'mega-shop-v39.2'})}catch(_){};if(cloud&&firebaseUser&&firebaseDb&&!firebaseAccountLocked){firebaseDb.collection('users').doc(firebaseUser.uid).set({megaShopV386:p,updatedAt:firebaseServerTimestamp()},{merge:true}).catch(e=>console.warn('V39.2 shop sync',e))}render();return p}
function item(id){return catalog.find(x=>x.id===id)||null}
function owned(id){return profile().owned.includes(id)||!!window.v380Shop?.owned?.(id)}
function equipped(id){const it=item(id);if(!it)return false;if(it.slot==='legacy')return !!window.v380Shop?.profile?.().equipped?.[it.legacyType]&&window.v380Shop.profile().equipped[it.legacyType]===id;if(['hair','top','bottom','shoes','head','glasses','back','hand'].includes(it.slot))return window.v385Wardrobe?.profile?.().equipped?.[it.slot]===id;return profile().equipped[it.slot]===id}
function buy(id){const it=item(id);if(!it||it.shop===false)return false;if(it.slot==='legacy')return !!window.v380Shop?.buy?.(id);if(owned(id)){equip(id);return true}const eco=window.v379Economy?.profile?.()||{level:1,gold:0};if(eco.level<(it.level||1)){window.examToast?.(`Cần Lv.${it.level} để mua ${it.label}`);return false}const pay=window.v379Economy?.spendGold?.(it.price||0,`mega-shop:${id}`);if(!pay?.ok){window.examToast?.(`Chưa đủ vàng • cần thêm ${pay?.need||it.price} 🪙`);return false}const p=profile();p.owned.push(id);p.purchases.push({id,price:it.price,at:now()});persist(p);equip(id);window.examToast?.(`✓ Đã mua ${it.label}`);return true}
function grantItem(id,source='achievement'){const it=item(id);if(!it)return false;if(it.slot==='legacy')return !!window.v380Shop?.grantItem?.(id,source);const p=profile();if(!p.owned.includes(id)){p.owned.push(id);p.purchases.push({id,price:0,source,at:now()});persist(p)}return true}
function equip(id){const it=item(id);if(!it||!owned(id))return false;if(it.slot==='legacy')return !!window.v380Shop?.equip?.(id);if(['hair','top','bottom','shoes','head','glasses','back','hand'].includes(it.slot)){window.v385Wardrobe?.equip?.(id)}else{const p=profile();p.equipped[it.slot]=p.equipped[it.slot]===id?'':id;persist(p);window.v384Avatar3D?.rebuild?.()}render();return true}
function adoptCloud(){const c=firebaseProfile?.megaShopV386;if(!c)return;const l=profile(),ct=Date.parse(c.updatedAt||0)||0,lt=Date.parse(l.updatedAt||0)||0;if(ct>=lt){bucket()[uid()]={...blank(),...c,ownerUid:uid()};try{save({sync:false,reason:'mega-shop-cloud-v39.2'})}catch(_){}}}
function card(it,eco){const has=owned(it.id),eq=equipped(it.id),locked=eco.level<(it.level||1),canBuy=it.shop!==false&&!locked;const price=it.shop===false?'Thành tích':`${Number(it.price||0).toLocaleString('vi-VN')} 🪙`;return `<article class="v386-card ${locked&&!has?'locked':''} ${eq?'equipped':''}"><div class="v386-preview" style="--swatch:${it.color||'#315bc7'}"><span class="v386-rarity ${it.rarity}">${String(it.rarity||'common').toUpperCase()}</span><i>${it.icon||'✦'}</i>${it.collection?`<small class="v391-set">${esc(it.collection)}</small>`:''}</div><h4>${esc(it.label)}</h4><div class="v386-meta"><span>${slotLabel(it.slot)}</span><span>Lv.${it.level||1}</span>${it.exclusive?'<span>Độc quyền</span>':''}</div><div class="v386-price ${it.shop===false?'free':''}">${price}</div>${has?`<button class="${eq?'soft':''}" onclick="v386MegaShop.equip('${it.id}')">${eq?'✓ Đang dùng':'Trang bị'}</button>`:`<button ${canBuy?'':'disabled'} onclick="v386MegaShop.buy('${it.id}')">${it.shop===false?'Mở bằng thành tích':locked?`Cần Lv.${it.level}`:'Mua ngay'}</button>`}</article>`}
function filtered(){
 let list=catalog.filter(it=>(filterSlot==='all'||it.slot===filterSlot)&&(filterRarity==='all'||it.rarity===filterRarity)&&(!searchText||(it.label+' '+(it.collection||'')).toLowerCase().includes(searchText.toLowerCase())));
 const rank={common:0,rare:1,epic:2,legendary:3};
 list.sort((a,b)=>sortMode==='price'?(a.price??999999)-(b.price??999999):sortMode==='rarity'?(rank[a.rarity]??0)-(rank[b.rarity]??0):(a.level||1)-(b.level||1));
 return list
}
function render(){const root=document.getElementById('v380ShopPage');if(!root)return;const eco=window.v379Economy?.profile?.()||{gold:0,level:1};const list=filtered();const pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));pageNo=Math.min(Math.max(1,pageNo),pages);const view=list.slice((pageNo-1)*PAGE_SIZE,pageNo*PAGE_SIZE);const p=profile();root.innerHTML=`<div class="v386-shop"><div class="v386-hero"><div><div class="v386-kicker">V39.2 • MEGA COSMETIC SHOP</div><h2>Math Avatar Mega Shop</h2><p><b>${catalog.length} vật phẩm</b> cosmetic • 13 nhóm • 4 độ hiếm • bộ sưu tập Toán học. Mua bằng vàng học tập; tuyệt đối không pay-to-win.</p></div><div class="v386-wallet"><small>SỐ DƯ HỌC TẬP</small><b>🪙 ${Number(eco.gold||0).toLocaleString('vi-VN')}</b><span>Lv.${eco.level||1} • ${p.owned.length} món Mega Shop</span></div></div><div class="v386-toolbar"><input class="v386-search" value="${esc(searchText)}" placeholder="Tìm áo, pet, aura, Oxyz, Calculus…" oninput="v386MegaShop.search(this.value)"><select class="v386-select" onchange="v386MegaShop.setRarity(this.value)"><option value="all" ${filterRarity==='all'?'selected':''}>Mọi độ hiếm</option><option value="common" ${filterRarity==='common'?'selected':''}>Common</option><option value="rare" ${filterRarity==='rare'?'selected':''}>Rare</option><option value="epic" ${filterRarity==='epic'?'selected':''}>Epic</option><option value="legendary" ${filterRarity==='legendary'?'selected':''}>Legendary</option></select><select class="v386-select" onchange="v386MegaShop.setSort(this.value)"><option value="level" ${sortMode==='level'?'selected':''}>Theo level</option><option value="price" ${sortMode==='price'?'selected':''}>Theo giá</option><option value="rarity" ${sortMode==='rarity'?'selected':''}>Theo độ hiếm</option></select></div><div class="v386-cats">${['all','hair','top','bottom','shoes','head','glasses','back','hand','pet','aura','background','emote','legacy'].map(s=>`<button class="${filterSlot===s?'active':''}" onclick="v386MegaShop.setSlot('${s}')">${slotLabel(s)} <small>${s==='all'?catalog.length:catalog.filter(x=>x.slot===s).length}</small></button>`).join('')}</div><div class="v386-summary"><span>Tìm thấy <b>${list.length}</b> vật phẩm • đang xem ${view.length} món</span><span>Trang <b>${pageNo}/${pages}</b> • Common → Rare → Epic → Legendary</span></div><div class="v386-grid">${view.length?view.map(it=>card(it,eco)).join(''):'<div class="v386-empty">Không tìm thấy vật phẩm phù hợp.</div>'}</div><div class="v391-pager"><button ${pageNo<=1?'disabled':''} onclick="v386MegaShop.page(${pageNo-1})">← Trước</button><span>Trang ${pageNo} / ${pages}</span><button ${pageNo>=pages?'disabled':''} onclick="v386MegaShop.page(${pageNo+1})">Sau →</button></div><div class="v386-collection-bar"><div class="v386-stat"><small>Tổng catalog</small><b>${catalog.length}</b></div><div class="v386-stat"><small>Đã sở hữu</small><b>${p.owned.length}</b></div><div class="v386-stat"><small>Legendary</small><b>${catalog.filter(x=>x.rarity==='legendary').length}</b></div><div class="v386-stat"><small>Nhóm vật phẩm</small><b>13</b></div></div></div>`}
function setSlot(x){filterSlot=x;pageNo=1;render()}function setRarity(x){filterRarity=x;pageNo=1;render()}function setSort(x){sortMode=x;pageNo=1;render()}function search(x){searchText=String(x||'');pageNo=1;render()}function page(x){pageNo=Number(x)||1;render();document.getElementById('v380ShopPage')?.scrollIntoView({behavior:'smooth',block:'start'})}
function install(){
 importLegacyCatalog();
 window.v385Wardrobe?.registerItems?.(catalog.filter(x=>['hair','top','bottom','shoes','head','glasses','back','hand'].includes(x.slot)));
 try{ROLE_ACCESS.student.add('shop')}catch(_){}
 if(typeof window.goPage==='function'&&!window.goPage.__v391shop){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='shop')requestAnimationFrame(render);return r};wrap.__v391shop=true;window.goPage=wrap}
 if(typeof window.firebaseHydrateUser==='function'&&!window.firebaseHydrateUser.__v391shop){const base=window.firebaseHydrateUser;const wrap=async function(u){const r=await base(u);adoptCloud();return r};wrap.__v391shop=true;window.firebaseHydrateUser=wrap}
 window.addEventListener('math12hub:game-reward',()=>requestAnimationFrame(render));
 setTimeout(()=>{if(document.getElementById('page-shop'))render()},350)
}
window.v386MegaShop={build:BUILD,schema:SCHEMA,catalog,profile,item,owned,equipped,buy,equip,grantItem,render,setSlot,setRarity,setSort,search,page,adoptCloud};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
