/* Math12 Hub v40.23.0 — Shop Collections */
(function(){
'use strict';
const BUILD='40.23.0-shop-collections',VERSION=402300;
const SETS=[
 {key:'calculus',title:'Calculus Elite',icon:'∫',desc:'Đạo hàm • tích phân • phong cách học giả',tone:'#506fd8'},
 {key:'oxyz',title:'Oxyz Explorer',icon:'⌖',desc:'Vector • tọa độ • khám phá không gian',tone:'#3d8aa6'},
 {key:'prob',title:'Probability Lab',icon:'Ω',desc:'Xác suất • Bayes • phòng thí nghiệm',tone:'#3f9b72'},
 {key:'champ',title:'Champion 10',icon:'★',desc:'Bộ sưu tập cấp cao dành cho hành trình dài',tone:'#bb8432'}
];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalog=()=>window.v386MegaShop?.catalog||[];
const members=set=>catalog().filter(x=>String(x.collection||'')===set.title);
const owned=id=>!!window.v386MegaShop?.owned?.(id)||!!window.v385Wardrobe?.unlocked?.(window.v385Wardrobe?.item?.(id));
function setStats(set){const rows=members(set),have=rows.filter(x=>owned(x.id)).length;return{total:rows.length,owned:have,pct:rows.length?Math.round(have*100/rows.length):0}}
function focus(key){const set=SETS.find(x=>x.key===key);if(!set)return;window.M12Suite?.shopView?.('all');window.M12Suite?.shopSearch?.(set.title);setTimeout(()=>document.querySelector('.m12suite-shop-grid')?.scrollIntoView({behavior:'smooth',block:'start'}),80)}
function trySet(key){const set=SETS.find(x=>x.key===key);if(!set)return;window.M12Suite?.shopView?.('all');window.M12Suite?.shopSearch?.('');const slots=['hair','top','bottom','shoes'];let n=0;for(const slot of slots){const it=members(set).find(x=>x.slot===slot);if(it&&window.M12Suite?.previewWear?.(it.id)!==false)n++}try{window.examToast?.(`✓ Đang thử ${n} món của ${set.title}`)}catch(_){}setTimeout(decorate,40)}
function card(set){const s=setStats(set);return `<article class="m12collection-card" style="--set-tone:${set.tone}"><div class="m12collection-icon">${esc(set.icon)}</div><div class="m12collection-copy"><small>BỘ SƯU TẬP</small><b>${esc(set.title)}</b><span>${esc(set.desc)}</span><i><em style="width:${s.pct}%"></em></i><label>${s.owned}/${s.total} món đã sở hữu</label></div><div class="m12collection-actions"><button onclick="M12ShopCollections.focus('${set.key}')">Xem bộ</button><button class="primary" onclick="M12ShopCollections.trySet('${set.key}')">Thử 4 món</button></div></article>`}
function decorate(){const root=document.getElementById('v380ShopPage');if(!root||root.querySelector('.m12collections-pro'))return false;const hero=root.querySelector('.m12suite-shop-hero,.v386-hero,.v380-shop-hero');if(!hero)return false;const sec=document.createElement('section');sec.className='m12suite-card m12collections-pro';sec.innerHTML=`<div class="m12collections-head"><div><div class="m12suite-kicker">SHOP COLLECTIONS</div><h3>Bộ phối Toán học</h3><p>Chọn theo chủ đề thay vì ghép ngẫu nhiên từng món. Mỗi bộ dùng catalog hiện có và vẫn tuân thủ Asset/Mask Renderer an toàn.</p></div><button class="btn btn-soft" onclick="M12Suite.shopSearch('')">Xem toàn bộ Shop</button></div><div class="m12collections-grid">${SETS.map(card).join('')}</div>`;hero.insertAdjacentElement('afterend',sec);return true}
function install(){const root=document.getElementById('v380ShopPage');if(root){new MutationObserver(()=>requestAnimationFrame(decorate)).observe(root,{childList:true,subtree:true})}window.addEventListener('math12hub:page-changed',()=>setTimeout(decorate,80));window.addEventListener('math12hub:character-changed',()=>setTimeout(decorate,80));setTimeout(decorate,500)}
window.M12ShopCollections={build:BUILD,version:VERSION,sets:SETS,members,setStats,focus,trySet,decorate};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
