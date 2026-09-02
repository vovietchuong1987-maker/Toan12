/* =========================================================
   Math12 Hub V40 — Avatar 3D Visual Upgrade
   Upgrades the existing V38.4 procedural foundation without changing
   student data schemas: expressive chibi proportions, richer face,
   real cosmetic geometry, natural idle/blink, 360° orbit and fallback.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.0-avatar-production';
const CDN='https://cdn.babylonjs.com/babylon.js';
let engine=null,scene=null,root=null,canvas=null,rafMount=0,loadPromise=null,celebrateUntil=0,parts={},previewItem=null;

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
function mat(name,color,rough=.72,metal=.02,emissive=null){const m=new BABYLON.PBRMaterial(name,scene);m.albedoColor=hex(color);m.roughness=rough;m.metallic=metal;if(emissive)m.emissiveColor=hex(emissive);return m}
function transparentMat(name,color,alpha=.18){const m=mat(name,color,.9,0);m.alpha=alpha;m.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;return m}
function sphere(name,diam,pos,material,scale={x:1,y:1,z:1},parent=root,segments=24){const m=BABYLON.MeshBuilder.CreateSphere(name,{diameter:diam,segments},scene);m.position.set(pos.x,pos.y,pos.z);m.scaling.set(scale.x,scale.y,scale.z);m.material=material;m.parent=parent;return m}
function capsule(name,h,r,pos,material,parent=root){let m;if(BABYLON.MeshBuilder.CreateCapsule)m=BABYLON.MeshBuilder.CreateCapsule(name,{height:h,radius:r,tessellation:20,capSubdivisions:6},scene);else m=BABYLON.MeshBuilder.CreateCylinder(name,{height:h,diameter:r*2,tessellation:20},scene);m.position.set(pos.x,pos.y,pos.z);m.material=material;m.parent=parent;return m}
function box(name,size,pos,material,parent=root){const m=BABYLON.MeshBuilder.CreateBox(name,{width:size.x,height:size.y,depth:size.z},scene);m.position.set(pos.x,pos.y,pos.z);m.material=material;m.parent=parent;return m}
function cyl(name,h,dt,db,pos,material,parent=root,tess=28){const m=BABYLON.MeshBuilder.CreateCylinder(name,{height:h,diameterTop:dt,diameterBottom:db,tessellation:tess},scene);m.position.set(pos.x,pos.y,pos.z);m.material=material;m.parent=parent;return m}
function torus(name,diam,thick,pos,material,parent=root){const m=BABYLON.MeshBuilder.CreateTorus(name,{diameter:diam,thickness:thick,tessellation:32},scene);m.position.set(pos.x,pos.y,pos.z);m.material=material;m.parent=parent;return m}
function cone(name,h,diam,pos,material,parent=root){return cyl(name,h,0,diam,pos,material,parent,20)}
function tube(name,pts,r,material,parent=root){const path=pts.map(p=>new BABYLON.Vector3(p.x,p.y,p.z));const m=BABYLON.MeshBuilder.CreateTube(name,{path,radius:r,tessellation:12,cap:BABYLON.Mesh.CAP_ALL},scene);m.material=material;m.parent=parent;return m}
function avatar(){return window.avatarV378Current?.()||window.avatarV378Stored?.()||{gender:'male',skin:'warm',face:'smile',hair:'short',outfit:'school-blue'}}
function outfit(a){return AVATAR_V378_OUTFITS?.find?.(x=>x.id===a.outfit)||[{top:'#EAF2FF',accent:'#315BC7',bottom:'#27364E'}][0]}
function skinColor(a){return AVATAR_V378_SKINS?.[a.skin]?.fill||({light:'#F4C7A1',warm:'#E6AD7B',tan:'#B97850'}[a.skin]||'#E6AD7B')}
function disposeModel(){if(root){try{root.dispose(false,true)}catch(_){}root=null}parts={}}
function makeNode(name,parent=root){const n=new BABYLON.TransformNode(name,scene);n.parent=parent;return n}
function normalizeStyle(style,fallback='classic'){return String(style||fallback).toLowerCase().replace(/[^a-z0-9-]/g,'')}

function buildFace(a,mSkin,mEye,mIris,mWhite,mAccent){
  const face=makeNode('face-group');parts.face=face;
  // Ears + subtle cheeks give the head much more depth than the V38.4 prototype.
  sphere('earL',.26,{x:-.69,y:2.73,z:-.02},mSkin,{x:.6,y:1,z:.55},face);sphere('earR',.26,{x:.69,y:2.73,z:-.02},mSkin,{x:.6,y:1,z:.55},face);
  const cheekMat=transparentMat('cheek','#EF8B91',.18);
  sphere('cheekL',.18,{x:-.36,y:2.55,z:-.676},cheekMat,{x:1.3,y:.55,z:.18},face);sphere('cheekR',.18,{x:.36,y:2.55,z:-.676},cheekMat,{x:1.3,y:.55,z:.18},face);
  parts.eyes=[];
  for(const [i,x] of [-.25,.25].entries()){
    const eye=makeNode('eye-group-'+i,face);eye.position.set(x,2.80,-.683);
    sphere('eye-white-'+i,.23,{x:0,y:0,z:0},mWhite,{x:.80,y:1.05,z:.24},eye);
    sphere('iris-'+i,.12,{x:0,y:-.005,z:-.105},mIris,{x:.86,y:1,z:.20},eye);
    sphere('pupil-'+i,.064,{x:0,y:-.004,z:-.128},mEye,{x:.82,y:1,z:.16},eye);
    const hi=mat('eye-highlight-'+i,'#ffffff',.2,0,'#ffffff');sphere('eye-hi-'+i,.027,{x:-.020,y:.026,z:-.143},hi,{x:1,y:1,z:.1},eye,16);
    parts.eyes.push(eye);
  }
  const brow=mat('brow','#3a2b25',.75);for(const [i,x] of [-.25,.25].entries()){const b=capsule('brow-'+i,.20,.018,{x,y:2.99,z:-.688},brow,face);b.rotation.z=(i?-.10:.10);b.rotation.x=Math.PI/2}
  sphere('nose',.065,{x:0,y:2.66,z:-.713},mSkin,{x:.7,y:.85,z:.45},face);
  const mouthMat=mat('mouth','#9A4050',.68);
  if(['serious','calm'].includes(a.face))tube('mouth', [{x:-.09,y:2.49,z:-.704},{x:0,y:2.485,z:-.712},{x:.09,y:2.49,z:-.704}],.018,mouthMat,face);
  else tube('mouth',[{x:-.13,y:2.53,z:-.70},{x:-.07,y:2.485,z:-.714},{x:0,y:2.47,z:-.719},{x:.07,y:2.485,z:-.714},{x:.13,y:2.53,z:-.70}],.020,mouthMat,face);
}

function buildHair(a,hairMat){
  const style=normalizeStyle(a.hair||'short');const group=makeNode('hair-group');
  // Shared cap is moved slightly upward so the forehead/eyes remain readable.
  sphere('hair-cap',1.36,{x:0,y:2.93,z:.03},hairMat,{x:1.02,y:.65,z:1.02},group);
  const lock=(name,x,y,z,sx,sy,sz,rz=0)=>{const q=sphere(name,.42,{x,y,z},hairMat,{x:sx,y:sy,z:sz},group);q.rotation.z=rz;return q};
  const fringe=(x,y,w=.52,h=.40,rz=0)=>lock('fringe-'+x+'-'+y,x,y,-.54,w,h,.42,rz);
  if(['side','sidesweep','layered'].includes(style)){fringe(-.27,3.10,1.12,.36,-.22);fringe(.22,3.06,.66,.30,.18)}
  else if(['spiky','spike','mohawk'].includes(style)){for(let i=0;i<7;i++){const s=cone('spike-'+i,.53,.30,{x:(i-3)*.17,y:3.36+Math.abs(i-3)*.025,z:-.02},hairMat,group);s.rotation.z=(i-3)*-.16}}
  else if(['bob','roundbob'].includes(style)){sphere('bob-back',1.30,{x:0,y:2.63,z:.18},hairMat,{x:1.04,y:1.08,z:.82},group);for(const x of [-.48,.48])lock('bob-side-'+x,x,2.57,-.18,.66,1.22,.65,x<0?.05:-.05)}
  else if(['pony','ponytail','highpony'].includes(style)){lock('pony-main',.67,2.72,.18,.70,1.48,.72,-.24);lock('pony-tip',.75,2.32,.22,.50,1.15,.50,-.20);fringe(-.14,3.08,.90,.32,-.12)}
  else if(['long','longwave','flow'].includes(style)){sphere('hair-back',1.30,{x:0,y:2.42,z:.22},hairMat,{x:1.02,y:1.65,z:.82},group);for(const x of [-.50,.50]){lock('long-lock-'+x,x,2.20,-.10,.62,2.05,.60,x<0?.06:-.06);lock('long-tip-'+x,x,1.83,-.06,.46,1.30,.48,x<0?.06:-.06)}}
  else if(['curly','curls'].includes(style)){for(let i=0;i<11;i++){const ang=(i/11)*Math.PI*2;lock('curl-'+i,Math.cos(ang)*.56,2.85+Math.sin(ang)*.38,Math.sin(ang)*.18,.68,.68,.68)}}
  else if(['undercut','fade'].includes(style)){for(let i=0;i<5;i++)fringe(-.30+i*.15,3.18+i%2*.03,.52,.34,(i-2)*-.06)}
  else if(['twintail','twin'].includes(style)){for(const x of [-.68,.68]){lock('tail-'+x,x,2.62,.12,.62,1.40,.62,x<0?.32:-.32);lock('tail-tip-'+x,x*1.08,2.25,.14,.48,1.16,.48,x<0?.27:-.27)}fringe(0,3.08,.95,.30,0)}
  else if(['bun','topbun'].includes(style)){sphere('bun',.65,{x:0,y:3.46,z:.12},hairMat,{x:1,y:.88,z:1},group);fringe(-.18,3.08,.72,.32,-.15)}
  else if(['braid','braids'].includes(style)){for(let j=0;j<2;j++){const x=j? .56:-.56;for(let k=0;k<5;k++)lock('braid-'+j+'-'+k,x+(j?.03:-.03)*k,2.48-k*.23,.02,.44,.62,.44,j?-.05:.05)}fringe(0,3.10,.88,.32,0)}
  else if(['messy','wavy'].includes(style)){for(let i=0;i<6;i++){const s=lock('messy-'+i,(i-2.5)*.18,3.19+(i%2)*.10,-.18,.70,.48,.48,(i-2.5)*-.12);s.rotation.x=.16}fringe(-.30,3.02,.62,.34,-.30)}
  else if(['crew','buzz'].includes(style)){sphere('crew',1.26,{x:0,y:3.04,z:.05},hairMat,{x:1.01,y:.43,z:1.01},group)}
  else {fringe(-.24,3.08,.74,.34,-.12);fringe(.23,3.08,.74,.34,.12)}
  return group;
}

function buildTorso(a,g,mTop,mAccent,mSkin){
  const style=normalizeStyle(g.top?.topStyle||g.top?.style||'shirt');
  const grp=makeNode('torso-group');parts.bodyGroup=grp;
  // The core torso is tapered for a softer chibi silhouette.
  const torso=cyl('torso',1.34,.88,1.04,{x:0,y:1.35,z:0},mTop,grp);torso.scaling.z=.78;torso.scaling.x=a.gender==='female'?.90:1;parts.body=torso;
  const neck=cyl('neck',.18,.28,.30,{x:0,y:2.06,z:0},mSkin,grp);neck.scaling.z=.95;
  if(style==='hoodie'){
    torus('hood',.78,.13,{x:0,y:1.92,z:.20},mTop,grp).rotation.x=Math.PI/2;
    for(const x of [-.08,.08]){const lace=capsule('lace-'+x,.38,.012,{x,y:1.67,z:-.53},mAccent,grp);lace.rotation.x=Math.PI/2}
    box('hoodie-pocket',{x:.66,y:.25,z:.08},{x:0,y:1.02,z:-.55},mAccent,grp);
  }else if(style==='jacket'||style==='blazer'||style==='varsity'){
    box('jacket-left',{x:.40,y:1.06,z:.08},{x:-.22,y:1.40,z:-.54},mTop,grp);box('jacket-right',{x:.40,y:1.06,z:.08},{x:.22,y:1.40,z:-.54},mTop,grp);
    box('jacket-line',{x:.055,y:1.02,z:.09},{x:0,y:1.40,z:-.59},mAccent,grp);
    for(let i=0;i<3;i++)sphere('button-'+i,.055,{x:.10,y:1.60-i*.25,z:-.61},mAccent,{x:1,y:1,z:.25},grp,16);
  }else if(style==='robe'||style==='cape-top'){
    const robe=cyl('robe',1.36,.88,1.22,{x:0,y:1.28,z:.10},mTop,grp);robe.scaling.z=.82;
    const collar=torus('robe-collar',.66,.09,{x:0,y:1.88,z:-.25},mAccent,grp);collar.rotation.x=Math.PI/2;
  }else if(style==='polo'){
    const col1=box('collar-l',{x:.26,y:.23,z:.06},{x:-.13,y:1.92,z:-.54},mAccent,grp);col1.rotation.z=.50;const col2=box('collar-r',{x:.26,y:.23,z:.06},{x:.13,y:1.92,z:-.54},mAccent,grp);col2.rotation.z=-.50;
  }else if(style==='jersey'||style==='sport'){
    box('sport-stripe-l',{x:.10,y:1.0,z:.08},{x:-.34,y:1.38,z:-.49},mAccent,grp);box('sport-stripe-r',{x:.10,y:1.0,z:.08},{x:.34,y:1.38,z:-.49},mAccent,grp);
  }else if(style==='sweater'){
    torus('sweater-neck',.55,.065,{x:0,y:1.93,z:-.12},mAccent,grp).rotation.x=Math.PI/2;
  }else{
    // shirt / uniform
    const col1=box('collar-l',{x:.24,y:.22,z:.06},{x:-.12,y:1.91,z:-.54},mAccent,grp);col1.rotation.z=.55;const col2=box('collar-r',{x:.24,y:.22,z:.06},{x:.12,y:1.91,z:-.54},mAccent,grp);col2.rotation.z=-.55;
    box('shirt-placket',{x:.055,y:.72,z:.07},{x:0,y:1.46,z:-.56},mAccent,grp);
  }
  // Small math badge makes the character feel tied to the learning world.
  const badge=sphere('math-badge',.18,{x:.30,y:1.63,z:-.585},mAccent,{x:1,y:1,z:.18},grp,20);badge.rotation.y=.05;
  return {style,grp};
}
function buildArm(side,mTop,mSkin,style){
  const sx=side==='L'?-1:1;const arm=makeNode('armGroup'+side);arm.position.set(sx*.57,1.83,0);parts[side==='L'?'leftArm':'rightArm']=arm;
  const sleeveLen=(style==='jersey'||style==='sport'||style==='polo') ? .40 : .47;
  const sleeve=capsule('sleeve'+side,sleeveLen,.19,{x:sx*.08,y:-.18,z:0},mTop,arm);sleeve.rotation.z=sx*-.12;
  const fore=capsule('forearm'+side,.66,.135,{x:sx*.13,y:-.64,z:0},mSkin,arm);fore.rotation.z=sx*-.04;
  sphere('hand'+side,.29,{x:sx*.15,y:-1.02,z:-.01},mSkin,{x:.92,y:1,z:.92},arm);
  arm.rotation.z=sx*.13;return arm;
}
function buildBottom(a,g,mBottom,mAccent){
  const style=normalizeStyle(g.bottom?.bottomStyle||g.bottom?.style||(a.gender==='female'?'skirt':'trousers'));
  const grp=makeNode('bottom-group');
  if(['skirt','pleated','dress'].includes(style)){
    const skirt=cyl('skirt',.70,.86,1.18,{x:0,y:.82,z:0},mBottom,grp,32);skirt.scaling.z=.84;
    if(style==='pleated')for(let i=-3;i<=3;i++)box('pleat-'+i,{x:.035,y:.50,z:.03},{x:i*.13,y:.79,z:-.54},mAccent,grp);
  }else if(style==='shorts'){
    box('shorts-core',{x:.78,y:.40,z:.68},{x:0,y:.78,z:0},mBottom,grp);
  }else if(style==='jogger'){
    box('waist',{x:.82,y:.18,z:.68},{x:0,y:.87,z:0},mAccent,grp);
  }else{
    box('belt',{x:.82,y:.13,z:.69},{x:0,y:.88,z:0},mAccent,grp);
  }
  return style;
}
function buildLegs(bottomStyle,mBottom,mShoe,g){
  const short=bottomStyle==='shorts'||bottomStyle==='skirt'||bottomStyle==='pleated'||bottomStyle==='dress';
  const legMat=short?mat('leg-skin',skinColor(avatar()),.82):mBottom;
  for(const [idx,x] of [-.27,.27].entries()){
    const side=idx?'R':'L';const leg=capsule('leg'+side,1.03,.20,{x,y:.29,z:0},legMat);parts['leg'+side]=leg;
    const shoeStyle=normalizeStyle(g.shoes?.shoeStyle||g.shoes?.style||'school');
    if(shoeStyle==='boot'||shoeStyle==='hightop'){
      const boot=box('boot'+side,{x:.43,y:.43,z:.63},{x,y:-.23,z:-.13},mShoe);boot.rotation.x=-.04;box('sole'+side,{x:.47,y:.09,z:.70},{x,y:-.45,z:-.15},mat('sole-'+side,'#182033',.6));
    }else if(shoeStyle==='runner'||shoeStyle==='sneaker'){
      const sh=box('shoe'+side,{x:.46,y:.22,z:.72},{x,y:-.35,z:-.17},mShoe);sh.rotation.x=-.06;box('sole'+side,{x:.49,y:.07,z:.75},{x,y:-.47,z:-.17},mat('sole-'+side,'#F4F6FA',.7));box('lace'+side,{x:.26,y:.035,z:.31},{x,y:-.25,z:-.49},mat('lace-'+side,'#F8FAFC',.65));
    }else{
      const sh=box('shoe'+side,{x:.46,y:.23,z:.68},{x,y:-.34,z:-.14},mShoe);sh.rotation.x=-.04;box('sole'+side,{x:.48,y:.065,z:.70},{x,y:-.47,z:-.14},mat('sole-'+side,'#1A2332',.6));
    }
  }
}
function buildHeadgear(g){if(!g.head)return;const it=g.head,style=normalizeStyle(it.shape||it.headStyle||'cap'),mh=mat('headGear',it.color||'#315BC7',.54,.05),dark=mat('headGearDark',it.accent||'#203B7A',.62);
  const grp=makeNode('headgear-group');
  if(style==='crown'){
    cyl('crown-band',.24,.79,.90,{x:0,y:3.48,z:0},mh,grp,10);for(let i=0;i<5;i++){const ang=(-2+i)*.18;const p=cone('crown-point-'+i,.42,.22,{x:(i-2)*.16,y:3.76,z:0},mh,grp);p.rotation.z=-ang}sphere('crown-gem',.13,{x:0,y:3.52,z:-.46},mat('gem','#43BFEA',.25,.25,'#187CB1'),{x:1,y:1,z:.35},grp);
  }else if(style==='scholar'||style==='mortarboard'){
    cyl('grad-cap',.18,.72,.78,{x:0,y:3.46,z:0},mh,grp,30);const board=box('grad-board',{x:1.05,y:.09,z:1.05},{x:0,y:3.60,z:0},mh,grp);board.rotation.y=.785;const tassel=capsule('tassel',.55,.018,{x:.48,y:3.34,z:-.12},dark,grp);tassel.rotation.z=.18;sphere('tassel-tip',.09,{x:.53,y:3.06,z:-.12},dark,{x:.75,y:1.15,z:.75},grp);
  }else if(style==='beanie'){
    sphere('beanie',1.06,{x:0,y:3.37,z:.02},mh,{x:1,y:.55,z:1},grp);torus('beanie-rim',.88,.10,{x:0,y:3.28,z:-.02},dark,grp).rotation.x=Math.PI/2;
  }else if(style==='beret'){
    sphere('beret',1.03,{x:-.10,y:3.43,z:.05},mh,{x:1.05,y:.27,z:1.02},grp);const stem=capsule('beret-stem',.18,.025,{x:-.10,y:3.62,z:.02},dark,grp);stem.rotation.z=.15;
  }else if(style==='wizard'){
    cone('wizard-hat',1.05,.88,{x:0,y:3.78,z:.06},mh,grp);cyl('wizard-brim',.08,1.15,1.15,{x:0,y:3.28,z:.02},dark,grp,36);
  }else{
    sphere('cap',1.02,{x:0,y:3.40,z:-.01},mh,{x:1,y:.31,z:1},grp);const visor=box('capVisor',{x:.72,y:.09,z:.50},{x:0,y:3.29,z:-.56},dark,grp);visor.rotation.x=-.08;
  }
}
function buildGlasses(g){if(!g.glasses)return;const it=g.glasses,style=normalizeStyle(it.glassesShape||it.shape||'round'),mg=mat('glasses',it.color||'#334155',.30,.18),grp=makeNode('glasses-group');
  if(style==='square'||style==='rect'){
    for(const [i,x] of [-.25,.25].entries()){const frame=box('frame-'+i,{x:.35,y:.26,z:.035},{x,y:2.80,z:-.735},mg,grp);const cut=box('lens-'+i,{x:.25,y:.16,z:.015},{x,y:2.80,z:-.757},transparentMat('lensMat-'+i,'#BFE3FA',.20),grp)}
  }else if(style==='visor'||style==='neon'){
    const visor=box('visor',{x:.88,y:.24,z:.04},{x:0,y:2.80,z:-.744},transparentMat('visorMat',it.color||'#55D9FF',.52),grp);box('visorTop',{x:.90,y:.035,z:.05},{x:0,y:2.93,z:-.746},mg,grp);
  }else{
    for(const [i,x] of [-.25,.25].entries()){const r=torus('glass-'+i,.36,.036,{x,y:2.80,z:-.737},mg,grp);r.rotation.x=Math.PI/2;sphere('lens-'+i,.30,{x,y:2.80,z:-.743},transparentMat('lensMat-'+i,'#CFE9FA',.16),{x:1,y:1,z:.07},grp)}
  }
  box('bridge',{x:.16,y:.033,z:.035},{x:0,y:2.80,z:-.742},mg,grp);for(const x of [-.49,.49]){const arm=box('glass-arm-'+x,{x:.23,y:.025,z:.025},{x,y:2.80,z:-.56},mg,grp);arm.rotation.y=x<0?-.42:.42}
}
function buildBack(g){if(!g.back)return;const it=g.back,style=normalizeStyle(it.backStyle||it.style||'backpack'),mb=mat('back',it.color||'#284D8F',.74),accent=mat('backAccent',it.accent||'#17325E',.62),grp=makeNode('back-group');
  if(style==='cape'||String(it.id||'').includes('master-function')){
    const cape=cyl('cape',1.54,.84,1.18,{x:0,y:1.25,z:.40},mb,grp,32);cape.scaling.z=.18;cape.rotation.x=-.06;torus('cape-collar',.68,.07,{x:0,y:1.95,z:.14},accent,grp).rotation.x=Math.PI/2;
  }else if(style==='wings'){
    for(const x of [-1,1]){const wing=sphere('wing-'+x,1.15,{x:x*.58,y:1.55,z:.40},mb,{x:.34,y:1.10,z:.28},grp);wing.rotation.z=x*.55;const wing2=sphere('wing2-'+x,.85,{x:x*.80,y:1.15,z:.43},mb,{x:.30,y:1.05,z:.24},grp);wing2.rotation.z=x*.75}
  }else if(style==='satchel'){
    const bag=box('satchel',{x:.88,y:.66,z:.30},{x:0,y:1.26,z:.48},mb,grp);box('satchel-flap',{x:.90,y:.23,z:.05},{x:0,y:1.47,z:.31},accent,grp);const strap=torus('satchel-strap',1.15,.035,{x:0,y:1.62,z:.31},accent,grp);strap.rotation.x=Math.PI/2;strap.scaling.y=1.35;
  }else{
    const bp=box('backpack',{x:.88,y:1.04,z:.34},{x:0,y:1.42,z:.47},mb,grp);bp.rotation.x=.04;box('bp-pocket',{x:.66,y:.39,z:.08},{x:0,y:1.20,z:.27},accent,grp);for(const x of [-.34,.34]){const st=capsule('bp-strap-'+x,.98,.035,{x,y:1.50,z:.18},accent,grp);st.rotation.x=.14}
  }
}
function buildHandTool(g){if(!g.hand)return;const it=g.hand,tool=normalizeStyle(it.tool||it.handStyle||'ruler'),mh=mat('handItem',it.color||'#E3B341',.42,.18),dark=mat('handItemDark',it.accent||'#6B5420',.55,.10),grp=makeNode('hand-tool');grp.position.set(.83,.87,-.10);grp.rotation.z=-.30;
  if(tool==='compass'){
    sphere('compass-hinge',.17,{x:0,y:.52,z:0},dark,{x:1,y:1,z:1},grp);for(const [i,x] of [-.11,.11].entries()){const leg=capsule('compass-leg-'+i,.82,.032,{x,y:.06,z:0},mh,grp);leg.rotation.z=x<0?-.17:.17}cone('compass-tip',.16,.055,{x:-.17,y:-.40,z:0},dark,grp);box('compass-pencil',{x:.055,y:.22,z:.07},{x:.17,y:-.36,z:0},mat('pencil','#315BC7',.55),grp);
  }else if(tool==='book'){
    box('book-cover',{x:.54,y:.70,z:.10},{x:0,y:.08,z:0},mh,grp);box('book-pages',{x:.47,y:.62,z:.105},{x:.02,y:.08,z:-.055},mat('pages','#FFF6DB',.88),grp);box('book-spine',{x:.055,y:.70,z:.13},{x:-.27,y:.08,z:0},dark,grp);box('book-mark',{x:.06,y:.23,z:.02},{x:.10,y:-.35,z:-.07},mat('bookmark','#D34F63',.6),grp);
  }else if(tool==='calculator'){
    box('calc-body',{x:.46,y:.72,z:.13},{x:0,y:.08,z:0},mh,grp);box('calc-screen',{x:.34,y:.16,z:.025},{x:0,y:.28,z:-.08},mat('screen','#A9D7C7',.30,.05,'#123B35'),grp);for(let r=0;r<4;r++)for(let c=0;c<3;c++)sphere('key-'+r+'-'+c,.052,{x:(c-1)*.12,y:.09-r*.105,z:-.085},dark,{x:1,y:1,z:.25},grp,12);
  }else if(tool==='staff'||tool==='wand'){
    const rod=capsule('staff',1.18,.035,{x:0,y:.02,z:0},mh,grp);sphere('staff-orb',.24,{x:0,y:.66,z:0},mat('orb','#FFD65A',.25,.15,'#D99B26'),{x:1,y:1,z:1},grp);
  }else{
    box('ruler',{x:.12,y:1.02,z:.055},{x:0,y:.06,z:0},mh,grp);for(let i=0;i<8;i++)box('tick-'+i,{x:i%2?.035:.06,y:.012,z:.012},{x:.04,y:-.35+i*.10,z:-.038},dark,grp);
  }
}

function buildAvatar(){
  disposeModel();const base=avatar(),o=outfit(base),g0=window.v385Wardrobe?.resolved?.(base)||{},g={...g0};
  if(previewItem&&previewItem.slot){g[previewItem.slot]=previewItem;if(previewItem.slot==='hair'){g.hairStyle=previewItem.hairStyle;g.hairColor=previewItem.hairColor||previewItem.color}}
  const a={...base,hair:g.hairStyle||base.hair};root=makeNode('avatarRoot',null);root.position.y=-.13;
  const mSkin=mat('skin',skinColor(a),.84),mHair=mat('hair',g.hairColor||'#263248',.62),mEye=mat('eye','#111827',.40),mIris=mat('iris','#385A87',.35),mWhite=mat('white','#ffffff',.66),mTop=mat('top',g.topColor||g.top?.color||o.top||'#EAF2FF',.72),mAccent=mat('accent',g.accent||g.top?.accent||o.accent||'#315BC7',.55),mBottom=mat('bottom',g.bottomColor||g.bottom?.color||o.bottom||'#27364E',.74),mShoe=mat('shoe',g.shoeColor||g.shoes?.color||'#263248',.54);
  buildTorso(a,g,mTop,mAccent,mSkin);
  const head=sphere('head',1.43,{x:0,y:2.76,z:-.02},mSkin,{x:1,y:1.04,z:.97});parts.head=head;
  buildFace(a,mSkin,mEye,mIris,mWhite,mAccent);buildHair(a,mHair);
  const topStyle=normalizeStyle(g.top?.topStyle||g.top?.style||'shirt');buildArm('L',mTop,mSkin,topStyle);buildArm('R',mTop,mSkin,topStyle);
  const bottomStyle=buildBottom(a,g,mBottom,mAccent);buildLegs(bottomStyle,mBottom,mShoe,g);
  buildHeadgear(g);buildGlasses(g);buildBack(g);buildHandTool(g);
  try{root.getChildMeshes().forEach(x=>{x.receiveShadows=true;x.isPickable=false})}catch(_){ }
}
function createScene(){
  scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.945,.968,1,1);scene.environmentIntensity=.78;
  try{scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=1.08;scene.imageProcessingConfiguration.contrast=1.04}catch(_){ }
  const cam=new BABYLON.ArcRotateCamera('cam',-Math.PI/2,Math.PI/2.23,6.15,new BABYLON.Vector3(0,1.48,0),scene);cam.lowerRadiusLimit=4.55;cam.upperRadiusLimit=7.8;cam.lowerBetaLimit=.88;cam.upperBetaLimit=1.64;cam.wheelPrecision=70;cam.panningSensibility=0;cam.inertia=.78;cam.attachControl(canvas,true);
  const hemi=new BABYLON.HemisphericLight('hemi',new BABYLON.Vector3(0,1,-.25),scene);hemi.intensity=1.03;hemi.groundColor=new BABYLON.Color3(.54,.62,.78);
  const key=new BABYLON.DirectionalLight('key',new BABYLON.Vector3(-.40,-1,.58),scene);key.position.set(4.5,7,-5);key.intensity=1.75;
  const fill=new BABYLON.PointLight('fill',new BABYLON.Vector3(-3,3,-3),scene);fill.diffuse=new BABYLON.Color3(.62,.78,1);fill.intensity=.45;
  let shadow=null;try{shadow=new BABYLON.ShadowGenerator(1024,key);shadow.useBlurExponentialShadowMap=true;shadow.blurKernel=24}catch(_){ }
  const groundMat=mat('ground','#dfe9fb',.96),ground=BABYLON.MeshBuilder.CreateDisc('ground',{radius:2.25,tessellation:64},scene);ground.rotation.x=Math.PI/2;ground.position.y=-.49;ground.material=groundMat;ground.receiveShadows=true;
  const ringMat=transparentMat('ring','#315BC7',.13),ring=torus('stage-ring',3.28,.035,{x:0,y:-.475,z:0},ringMat,null);ring.rotation.x=Math.PI/2;
  buildAvatar();try{root.getChildMeshes().forEach(m=>shadow?.addShadowCaster(m))}catch(_){ }
  scene.onBeforeRenderObservable.add(()=>{
    if(!root)return;const now=performance.now(),t=now/1000,c=now<celebrateUntil;
    root.position.y=-.13+(c?Math.abs(Math.sin(t*7))*.15:Math.sin(t*2.0)*.026);
    root.rotation.y=c?Math.sin(t*8)*.10:Math.sin(t*.55)*.018;
    if(parts.head){parts.head.rotation.z=c?Math.sin(t*8)*.055:Math.sin(t*.75)*.018;parts.head.rotation.y=Math.sin(t*.50)*.025}
    if(parts.leftArm&&parts.rightArm){if(c){parts.leftArm.rotation.z=-2.05+Math.sin(t*10)*.12;parts.rightArm.rotation.z=2.05-Math.sin(t*10)*.12}else{parts.leftArm.rotation.z=-.13+Math.sin(t*1.6)*.030;parts.rightArm.rotation.z=.13-Math.sin(t*1.6)*.030}}
    // Blink: 170 ms every ~4.3 seconds, with tiny double blink occasionally.
    const phase=now%4300;const blink=(phase<150)||(phase>330&&phase<420);const sy=blink?.10:1;for(const eye of parts.eyes||[])eye.scaling.y+=(sy-eye.scaling.y)*.42;
  });return scene;
}
function destroy(){if(rafMount)cancelAnimationFrame(rafMount);rafMount=0;try{scene?.dispose()}catch(_){}try{engine?.dispose()}catch(_){}scene=null;engine=null;root=null;canvas=null;parts={}}
function controls(shell){shell.insertAdjacentHTML('beforeend',`<div class="v384-avatar3d-badge">3D • V40 PRODUCTION</div><div class="v392-quality-chip">CHIBI HD</div><div class="v384-avatar3d-controls"><button type="button" data-act="left" title="Xoay trái">↶</button><button type="button" data-act="reset" title="Góc nhìn mặc định">◎</button><button type="button" data-act="celebrate" title="Ăn mừng">✦</button><button type="button" data-act="right" title="Xoay phải">↷</button></div>`);shell.querySelector('[data-act="left"]').onclick=()=>{if(scene?.activeCamera)scene.activeCamera.alpha-=.35};shell.querySelector('[data-act="right"]').onclick=()=>{if(scene?.activeCamera)scene.activeCamera.alpha+=.35};shell.querySelector('[data-act="reset"]').onclick=()=>{const c=scene?.activeCamera;if(c){c.alpha=-Math.PI/2;c.beta=Math.PI/2.23;c.radius=6.15}};shell.querySelector('[data-act="celebrate"]').onclick=()=>{celebrateUntil=performance.now()+1800}}
async function mount(){
  const stage=document.querySelector('#page-avatar.active .avatar-preview-stage')||document.querySelector('#page-avatar .avatar-preview-stage');if(!stage)return;
  if(stage.querySelector('.v384-avatar3d-shell'))return;
  destroy();const shell=document.createElement('div');shell.className='v384-avatar3d-shell v392-avatar3d-shell';shell.innerHTML='<div class="v384-avatar3d-loading"><div><b>Đang dựng Avatar 3D…</b><span>Chibi HD • blink • vật phẩm 3D thật • xoay 360°</span></div></div><canvas class="v384-avatar3d-canvas" aria-label="Nhân vật 3D Math12 Hub V40"></canvas>';stage.appendChild(shell);controls(shell);
  try{await loadBabylon();if(!document.body.contains(shell))return;canvas=shell.querySelector('canvas');engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true,adaptToDeviceRatio:true});try{if(window.Math12Platform?.perf?.lowPower?.())engine.setHardwareScalingLevel(Math.max(1.35,window.devicePixelRatio||1));}catch(_){}createScene();try{window.dispatchEvent(new CustomEvent('math12hub:avatar3d-ready',{detail:{scene,root,engine,build:BUILD}}))}catch(_){}engine.runRenderLoop(()=>scene?.render());const resize=()=>engine?.resize();window.addEventListener('resize',resize);shell._v384Resize=resize;requestAnimationFrame(()=>engine?.resize());setTimeout(()=>shell.querySelector('.v384-avatar3d-loading')?.remove(),180)}catch(err){console.warn('V40 3D fallback',err);shell.innerHTML='<div class="v384-webgl-fallback">3D chưa sẵn sàng • đang dùng avatar 2D an toàn</div>';setTimeout(()=>shell.remove(),2600)}
}
function remountSoon(){clearTimeout(remountSoon.t);remountSoon.t=setTimeout(()=>{const old=document.querySelector('.v384-avatar3d-shell');if(old?._v384Resize)window.removeEventListener('resize',old._v384Resize);destroy();mount()},45)}
function install(){
  if(typeof window.avatarV378RenderPage==='function'&&!window.avatarV378RenderPage.__v384){const base=window.avatarV378RenderPage;const wrap=function(){const r=base.apply(this,arguments);requestAnimationFrame(remountSoon);return r};wrap.__v384=true;window.avatarV378RenderPage=wrap}
  if(typeof window.goPage==='function'&&!window.goPage.__v384){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='avatar')requestAnimationFrame(remountSoon);else destroy();return r};wrap.__v384=true;window.goPage=wrap}
  window.addEventListener('math12hub:avatar-changed',remountSoon);if(document.getElementById('page-avatar')?.classList.contains('active'))remountSoon();
}
window.v384Avatar3D={build:BUILD,mount:remountSoon,rebuild:remountSoon,sync:remountSoon,celebrate(){celebrateUntil=performance.now()+1800},destroy,getScene:()=>scene,getRoot:()=>root,getEngine:()=>engine,preview(it){previewItem=it||null;remountSoon()},clearPreview(){previewItem=null;remountSoon()}};
window.v392Avatar3D=window.v384Avatar3D;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
