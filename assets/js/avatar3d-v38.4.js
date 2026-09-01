/* =========================================================
   Math12 Hub V38.4 — Avatar 3D Foundation
   Procedural chibi avatar using Babylon.js. No model files needed.
   360° orbit, idle animation, celebrate animation, SVG fallback.
   ========================================================= */
(function(){
'use strict';
const BUILD='38.4-avatar-3d-foundation';
const CDN='https://cdn.babylonjs.com/babylon.js';
let engine=null,scene=null,root=null,canvas=null,rafMount=0,loadPromise=null,celebrateUntil=0,parts={};
function loadBabylon(){
  if(window.BABYLON)return Promise.resolve(window.BABYLON);
  if(loadPromise)return loadPromise;
  loadPromise=new Promise((resolve,reject)=>{
    const old=document.querySelector('script[data-v384-babylon]');
    if(old){old.addEventListener('load',()=>resolve(window.BABYLON),{once:true});old.addEventListener('error',reject,{once:true});return}
    const s=document.createElement('script');s.src=CDN;s.async=true;s.dataset.v384Babylon='1';
    s.onload=()=>window.BABYLON?resolve(window.BABYLON):reject(new Error('Babylon unavailable'));
    s.onerror=()=>reject(new Error('Không tải được Babylon.js'));
    document.head.appendChild(s);
  });
  return loadPromise;
}
function hex(v,fallback='#ffffff'){try{return BABYLON.Color3.FromHexString(v||fallback)}catch(_){return BABYLON.Color3.FromHexString(fallback)}}
function mat(name,color,rough=.72,metal=.02){const m=new BABYLON.PBRMaterial(name,scene);m.albedoColor=hex(color);m.roughness=rough;m.metallic=metal;return m}
function sphere(name,diam,pos,material,scale={x:1,y:1,z:1},parent=root){const m=BABYLON.MeshBuilder.CreateSphere(name,{diameter:diam,segments:24},scene);m.position.set(pos.x,pos.y,pos.z);m.scaling.set(scale.x,scale.y,scale.z);m.material=material;m.parent=parent;return m}
function capsule(name,h,r,pos,material,parent=root){let m;if(BABYLON.MeshBuilder.CreateCapsule)m=BABYLON.MeshBuilder.CreateCapsule(name,{height:h,radius:r,tessellation:20,capSubdivisions:6},scene);else m=BABYLON.MeshBuilder.CreateCylinder(name,{height:h,diameter:r*2,tessellation:20},scene);m.position.set(pos.x,pos.y,pos.z);m.material=material;m.parent=parent;return m}
function box(name,size,pos,material,parent=root){const m=BABYLON.MeshBuilder.CreateBox(name,{width:size.x,height:size.y,depth:size.z},scene);m.position.set(pos.x,pos.y,pos.z);m.material=material;m.parent=parent;return m}
function torus(name,diam,thick,pos,material,parent=root){const m=BABYLON.MeshBuilder.CreateTorus(name,{diameter:diam,thickness:thick,tessellation:28},scene);m.position.set(pos.x,pos.y,pos.z);m.material=material;m.parent=parent;return m}
function avatar(){return window.avatarV378Current?.()||window.avatarV378Stored?.()||{gender:'male',skin:'warm',face:'smile',hair:'short',outfit:'school-blue'}}
function outfit(a){return AVATAR_V378_OUTFITS?.find?.(x=>x.id===a.outfit)||[{top:'#EAF2FF',accent:'#315BC7',bottom:'#27364E'}][0]}
function skinColor(a){return AVATAR_V378_SKINS?.[a.skin]?.fill||({light:'#F4C7A1',warm:'#E6AD7B',tan:'#B97850'}[a.skin]||'#E6AD7B')}
function disposeModel(){if(root){try{root.dispose(false,true)}catch(_){}root=null}parts={}}
function buildHair(a,hairMat){
  const style=a.hair||'short';
  const group=new BABYLON.TransformNode('hair-group',scene);group.parent=root;
  sphere('hair-cap',1.31,{x:0,y:2.82,z:.02},hairMat,{x:1.02,y:.72,z:1.02},group);
  if(a.gender==='female'&&(style==='long'||style==='bob')){sphere('hair-back',1.28,{x:0,y:2.55,z:.20},hairMat,{x:1.03,y:1.30,z:.78},group)}
  if(style==='pony'){sphere('pony',.63,{x:.72,y:2.70,z:.13},hairMat,{x:.72,y:1.45,z:.72},group)}
  if(style==='spiky')for(let i=0;i<7;i++){const s=sphere('spike'+i,.38,{x:(i-3)*.18,y:3.34+Math.abs(i-3)*.02,z:.02},hairMat,{x:.65,y:1.5,z:.65},group);s.rotation.z=(i-3)*-.18}
  if(style==='side'){const s=sphere('side-fringe',.72,{x:-.34,y:3.12,z:-.50},hairMat,{x:1.1,y:.45,z:.6},group);s.rotation.z=-.28}
  if(style==='long')for(const x of [-.52,.52])sphere('long-lock'+x,.44,{x,y:2.05,z:.04},hairMat,{x:.72,y:2.0,z:.72},group);
  return group;
}
function buildAvatar(){
  disposeModel();const base=avatar(),o=outfit(base),g=window.v385Wardrobe?.resolved?.(base)||{},a={...base,hair:g.hairStyle||base.hair};
  root=new BABYLON.TransformNode('avatarRoot',scene);root.position.y=-.15;
  const mSkin=mat('skin',skinColor(a),.82),mHair=mat('hair',g.hairColor||'#263248',.62),mEye=mat('eye','#172033',.45),mWhite=mat('white','#ffffff',.7),mTop=mat('top',g.topColor||o.top||'#EAF2FF',.72),mAccent=mat('accent',g.accent||o.accent||'#315BC7',.58),mBottom=mat('bottom',g.bottomColor||o.bottom||'#27364E',.72),mShoe=mat('shoe',g.shoeColor||'#263248',.54);
  parts.body=capsule('body',1.48,.52,{x:0,y:1.34,z:0},mTop);parts.body.scaling.z=.72;
  box('shirt-accent',{x:.16,y:.78,z:.08},{x:0,y:1.45,z:-.53},mAccent);
  const head=sphere('head',1.38,{x:0,y:2.74,z:-.03},mSkin,{x:1,y:1.06,z:.98});parts.head=head;
  buildHair(a,mHair);
  for(const x of [-.25,.25])sphere('eye'+x,.10,{x,y:2.79,z:-.68},mEye,{x:.75,y:1.05,z:.45});
  if(a.face==='smile'){const sm=torus('smile',.25,.035,{x:0,y:2.52,z:-.675},mAccent);sm.rotation.x=Math.PI/2;sm.scaling.y=.55;sm.rotation.z=Math.PI}
  sphere('nose',.055,{x:0,y:2.66,z:-.70},mSkin,{x:.7,y:.7,z:.5});
  parts.leftArm=capsule('armL',1.08,.16,{x:-.65,y:1.42,z:0},mTop);parts.leftArm.rotation.z=-.15;
  parts.rightArm=capsule('armR',1.08,.16,{x:.65,y:1.42,z:0},mTop);parts.rightArm.rotation.z=.15;
  sphere('handL',.30,{x:-.73,y:.89,z:0},mSkin);sphere('handR',.30,{x:.73,y:.89,z:0},mSkin);
  const legY=.28;parts.leftLeg=capsule('legL',1.10,.22,{x:-.29,y:legY,z:0},mBottom);parts.rightLeg=capsule('legR',1.10,.22,{x:.29,y:legY,z:0},mBottom);
  box('shoeL',{x:.48,y:.23,z:.72},{x:-.29,y:-.32,z:-.14},mShoe);box('shoeR',{x:.48,y:.23,z:.72},{x:.29,y:-.32,z:-.14},mShoe);
  if(a.gender==='female'){const skirt=BABYLON.MeshBuilder.CreateCylinder('skirt',{height:.58,diameterTop:.86,diameterBottom:1.18,tessellation:32},scene);skirt.position.set(0,.82,0);skirt.material=mBottom;skirt.parent=root}
  if(g.head){const mh=mat('headGear',g.head.color||'#315BC7',.55);if(g.head.shape==='crown'){const c=BABYLON.MeshBuilder.CreateCylinder('crown',{height:.32,diameterTop:.72,diameterBottom:.92,tessellation:8},scene);c.position.set(0,3.58,0);c.material=mh;c.parent=root}else{const cap=sphere('cap',1.02,{x:0,y:3.45,z:-.02},mh,{x:1,y:.32,z:1});box('capVisor',{x:.72,y:.10,z:.48},{x:0,y:3.32,z:-.58},mh)}}
  if(g.glasses){const mg=mat('glasses',g.glasses.color||'#334155',.3,.18);for(const x of [-.25,.25]){const r=torus('glass'+x,.34,.035,{x,y:2.79,z:-.725},mg);r.rotation.x=Math.PI/2}box('bridge',{x:.18,y:.035,z:.035},{x:0,y:2.79,z:-.73},mg)}
  if(g.back){const mb=mat('back',g.back.color||'#284D8F',.75);const bp=box('backpack',{x:.92,y:1.10,z:.34},{x:0,y:1.42,z:.48},mb);bp.rotation.x=.04}
  if(g.hand){const mh=mat('handItem',g.hand.color||'#E3B341',.42,.22);const rod=box('handItem',{x:.08,y:1.02,z:.08},{x:.91,y:1.05,z:-.08},mh);rod.rotation.z=-.38}
  try{root.getChildMeshes().forEach(x=>{x.receiveShadows=true})}catch(_){}
}
function createScene(){
  scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.94,.97,1,1);
  scene.environmentIntensity=.75;
  const cam=new BABYLON.ArcRotateCamera('cam',-Math.PI/2,Math.PI/2.22,6.3,new BABYLON.Vector3(0,1.45,0),scene);cam.lowerRadiusLimit=4.7;cam.upperRadiusLimit=8;cam.lowerBetaLimit=.85;cam.upperBetaLimit=1.75;cam.wheelPrecision=60;cam.panningSensibility=0;cam.attachControl(canvas,true);
  const hemi=new BABYLON.HemisphericLight('hemi',new BABYLON.Vector3(0,1,-.2),scene);hemi.intensity=1.08;hemi.groundColor=new BABYLON.Color3(.58,.66,.82);
  const key=new BABYLON.DirectionalLight('key',new BABYLON.Vector3(-.45,-1,.55),scene);key.position.set(4,7,-5);key.intensity=1.7;
  const groundMat=mat('ground','#dce8fb',.95);const ground=BABYLON.MeshBuilder.CreateDisc('ground',{radius:2.2,tessellation:64},scene);ground.rotation.x=Math.PI/2;ground.position.y=-.46;ground.material=groundMat;
  buildAvatar();
  scene.onBeforeRenderObservable.add(()=>{if(!root)return;const t=performance.now()/1000;root.position.y=-.15+Math.sin(t*2.1)*.035;if(parts.leftArm&&parts.rightArm){const c=performance.now()<celebrateUntil;if(c){parts.leftArm.rotation.z=-2.15+Math.sin(t*9)*.12;parts.rightArm.rotation.z=2.15-Math.sin(t*9)*.12;root.rotation.y=Math.sin(t*7)*.08}else{parts.leftArm.rotation.z=-.15+Math.sin(t*1.7)*.035;parts.rightArm.rotation.z=.15-Math.sin(t*1.7)*.035}}});
  return scene;
}
function destroy(){if(rafMount)cancelAnimationFrame(rafMount);rafMount=0;try{scene?.dispose()}catch(_){}try{engine?.dispose()}catch(_){}scene=null;engine=null;root=null;canvas=null;parts={}}
function controls(shell){shell.insertAdjacentHTML('beforeend',`<div class="v384-avatar3d-badge">3D • V38.4</div><div class="v384-avatar3d-controls"><button type="button" data-act="left" title="Xoay trái">↶</button><button type="button" data-act="reset" title="Góc nhìn mặc định">◎</button><button type="button" data-act="celebrate" title="Ăn mừng">✦</button><button type="button" data-act="right" title="Xoay phải">↷</button></div>`);shell.querySelector('[data-act="left"]').onclick=()=>{if(scene?.activeCamera)scene.activeCamera.alpha-=.35};shell.querySelector('[data-act="right"]').onclick=()=>{if(scene?.activeCamera)scene.activeCamera.alpha+=.35};shell.querySelector('[data-act="reset"]').onclick=()=>{const c=scene?.activeCamera;if(c){c.alpha=-Math.PI/2;c.beta=Math.PI/2.22;c.radius=6.3}};shell.querySelector('[data-act="celebrate"]').onclick=()=>{celebrateUntil=performance.now()+1700}}
async function mount(){
  const stage=document.querySelector('#page-avatar.active .avatar-preview-stage')||document.querySelector('#page-avatar .avatar-preview-stage');if(!stage)return;
  if(stage.querySelector('.v384-avatar3d-shell'))return;
  destroy();const shell=document.createElement('div');shell.className='v384-avatar3d-shell';shell.innerHTML='<div class="v384-avatar3d-loading"><div><b>Đang dựng nhân vật 3D…</b><span>Xoay 360° • WebGL • fallback an toàn</span></div></div><canvas class="v384-avatar3d-canvas" aria-label="Nhân vật 3D Math12 Hub"></canvas>';stage.appendChild(shell);controls(shell);
  try{await loadBabylon();if(!document.body.contains(shell))return;canvas=shell.querySelector('canvas');engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true,adaptToDeviceRatio:true});createScene();try{window.dispatchEvent(new CustomEvent('math12hub:avatar3d-ready',{detail:{scene,root,engine}}))}catch(_){};engine.runRenderLoop(()=>scene?.render());const resize=()=>engine?.resize();window.addEventListener('resize',resize);shell._v384Resize=resize;requestAnimationFrame(()=>engine?.resize());setTimeout(()=>shell.querySelector('.v384-avatar3d-loading')?.remove(),160)}catch(err){console.warn('V38.4 3D fallback',err);shell.innerHTML='<div class="v384-webgl-fallback">3D chưa sẵn sàng • đang dùng avatar 2D an toàn</div>';setTimeout(()=>shell.remove(),2600)}
}
function remountSoon(){clearTimeout(remountSoon.t);remountSoon.t=setTimeout(()=>{const old=document.querySelector('.v384-avatar3d-shell');if(old?._v384Resize)window.removeEventListener('resize',old._v384Resize);destroy();mount()},40)}
function install(){
  if(typeof window.avatarV378RenderPage==='function'&&!window.avatarV378RenderPage.__v384){const base=window.avatarV378RenderPage;const wrap=function(){const r=base.apply(this,arguments);requestAnimationFrame(remountSoon);return r};wrap.__v384=true;window.avatarV378RenderPage=wrap}
  if(typeof window.goPage==='function'&&!window.goPage.__v384){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='avatar')requestAnimationFrame(remountSoon);else destroy();return r};wrap.__v384=true;window.goPage=wrap}
  window.addEventListener('math12hub:avatar-changed',remountSoon);if(document.getElementById('page-avatar')?.classList.contains('active'))remountSoon();
}
window.v384Avatar3D={build:BUILD,mount:remountSoon,rebuild:remountSoon,celebrate(){celebrateUntil=performance.now()+1700},destroy,getScene:()=>scene,getRoot:()=>root,getEngine:()=>engine};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
