/* Math12 Hub — Character Studio Pro / Step 10 */
(function(){
'use strict';
const BUILD='avatar-step10-character-studio-pro';
let ready=false;
function camera(){return window.v384Avatar3D?.getScene?.()?.activeCamera||null}
function rotate(dir=1){const c=camera();if(c)c.alpha+=dir*.32}
function zoom(dir=1){const c=camera();if(c)c.radius=Math.max(c.lowerRadiusLimit||4.7,Math.min(c.upperRadiusLimit||7.8,c.radius+dir*.45))}
function resetView(){const c=camera();if(!c)return;c.alpha=-Math.PI/2.10;c.beta=Math.PI/2.30;c.radius=6.10}
function focusFace(){const c=camera();if(!c)return;c.radius=4.85;c.target.y=2.35}
function focusFull(){const c=camera();if(!c)return;c.radius=6.10;c.target.y=1.52}
function addToolbar(){
  const card=document.querySelector('#page-avatar .avatar-preview-card');if(!card)return;
  let bar=card.querySelector('.av10-toolbar');if(bar)return;
  bar=document.createElement('div');bar.className='av10-toolbar';bar.innerHTML=`<button title="Xoay trái" onclick="AvatarPro.rotate(-1)">↶</button><button title="Thu nhỏ" onclick="AvatarPro.zoom(1)">−</button><button title="Toàn thân" onclick="AvatarPro.full()">◎</button><button title="Cận mặt" onclick="AvatarPro.face()">◉</button><button title="Phóng to" onclick="AvatarPro.zoom(-1)">＋</button><button title="Xoay phải" onclick="AvatarPro.rotate(1)">↷</button>`;card.appendChild(bar);
  let quality=card.querySelector('.av10-quality');if(!quality){quality=document.createElement('div');quality.className='av10-quality';quality.innerHTML='<span></span><b>CHARACTER PRO</b><small>Soft 3D · 360° · Realtime</small>';card.appendChild(quality)}
}
function polishScene(){
  const scene=window.v384Avatar3D?.getScene?.();if(!scene)return;const c=scene.activeCamera;if(c){c.radius=6.10;c.target.y=1.56;c.wheelPrecision=92;c.inertia=.86}
  try{scene.clearColor=new BABYLON.Color4(.955,.96,.97,1)}catch(_){ }
}
function install(){addToolbar();window.addEventListener('math12hub:avatar3d-ready',()=>{ready=true;polishScene();addToolbar()});window.addEventListener('math12hub:avatar-state-changed',()=>setTimeout(addToolbar,40));if(typeof window.goPage==='function'&&!window.goPage.__av10){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='avatar')setTimeout(addToolbar,100);return r};wrap.__av10=true;window.goPage=wrap}}
window.AvatarPro={build:BUILD,rotate,zoom,reset:resetView,face:focusFace,full:focusFull,get ready(){return ready}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
