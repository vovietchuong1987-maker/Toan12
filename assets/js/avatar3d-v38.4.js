/* =========================================================
   Math12 Hub  — Avatar 3D Visual Upgrade
   Upgrades the existing  procedural foundation without changing
   student data schemas: expressive chibi proportions, richer face,
   real cosmetic geometry, natural idle/blink, 360° orbit and fallback.
   ========================================================= */
(function(){
'use strict';
const BUILD='avatar-step5-premium-material-lighting';
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
function applySurfaceProfile(m,name,color){
  const n=String(name||'').toLowerCase(),base=hex(color,'#ffffff');m.environmentIntensity=.82;m.useRadianceOverAlpha=true;
  try{
    if(/(^skin$|leg-skin|inner-ear|nose)/.test(n)){
      m.metallic=0;m.roughness=.82;m.ambientColor=base.scale(.12);
      if(m.subSurface){m.subSurface.isTranslucencyEnabled=true;m.subSurface.translucencyIntensity=.075;m.subSurface.tintColor=base;m.subSurface.minimumThickness=.15;m.subSurface.maximumThickness=.65}
    }else if(/hair/.test(n)){
      m.metallic=.015;m.roughness=n.includes('highlight')?.38:.52;
      if(m.sheen){m.sheen.isEnabled=true;m.sheen.intensity=n.includes('highlight')?.28:.16;m.sheen.color=hex(toneHex(color,1.18,.02))}
    }else if(/(^eye$|^iris$|^white$|pupil|eye-highlight|lens|glasses|visor)/.test(n)){
      m.metallic=0;m.roughness=n.includes('pupil')?.12:.24;
      if(m.clearCoat){m.clearCoat.isEnabled=true;m.clearCoat.intensity=.72;m.clearCoat.roughness=.10}
    }else if(/(top|bottom|garment|uniform|sleeve|hood|jacket|lapel|polo|sport|sweater|robe|skirt|short|trouser|jogger|pant|vest|collar|cuff|pocket|pleat)/.test(n)){
      m.metallic=0;m.roughness=Math.max(.72,m.roughness||0);
      if(m.sheen){m.sheen.isEnabled=true;m.sheen.intensity=.105;m.sheen.color=hex(toneHex(color,1.10,.02))}
    }else if(/(shoe|boot|hightop|runner|sole|lace)/.test(n)){
      m.metallic=.015;m.roughness=n.includes('sole')?.68:.48;
      if(m.clearCoat){m.clearCoat.isEnabled=true;m.clearCoat.intensity=n.includes('sole')?.10:.22;m.clearCoat.roughness=.28}
    }else if(/(gem|orb|crown|staff|compass|button|phi)/.test(n)){
      m.metallic=Math.max(.18,m.metallic||0);m.roughness=Math.min(.46,m.roughness||1);
      if(m.clearCoat){m.clearCoat.isEnabled=true;m.clearCoat.intensity=.34;m.clearCoat.roughness=.18}
    }
  }catch(_){ }
  return m
}
function mat(name,color,rough=.72,metal=.02,emissive=null){const m=new BABYLON.PBRMaterial(name,scene);m.albedoColor=hex(color);m.roughness=rough;m.metallic=metal;if(emissive)m.emissiveColor=hex(emissive);return applySurfaceProfile(m,name,color)}
function transparentMat(name,color,alpha=.18){const m=mat(name,color,.9,0);m.alpha=alpha;m.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;m.alphaMode=BABYLON.Engine.ALPHA_COMBINE;return m}
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
function toneHex(value,mul=1,lift=0){const c=hex(value,'#263248'),clamp=v=>Math.max(0,Math.min(1,v));return new BABYLON.Color3(clamp(c.r*mul+lift),clamp(c.g*mul+lift),clamp(c.b*mul+lift)).toHexString()}
function isLowPower(){try{return !!window.Math12Platform?.perf?.lowPower?.()}catch(_){return false}}

function buildFace(a,mSkin,mEye,mIris,mWhite,mAccent,parent=root){
  const face=makeNode('face-group',parent);parts.face=face;
  const expression=normalizeStyle(a.face||'smile');
  const innerEar=mat('inner-ear','#C98270',.88);
  // Soft ears with a shallow inner fold. The old flat side-discs are removed.
  for(const [i,x] of [-.655,.655].entries()){
    sphere('ear-'+i,.30,{x,y:2.79,z:-.005},mSkin,{x:.60,y:1,z:.72},face);
    sphere('ear-fold-'+i,.135,{x:x+(i?-.006:.006),y:2.79,z:-.105},innerEar,{x:.48,y:.78,z:.22},face,18);
  }

  // A restrained blush gives warmth without the painted-doll look.
  const cheekMat=transparentMat('cheek','#E98B87',.12);
  sphere('cheekL',.18,{x:-.36,y:2.59,z:-.654},cheekMat,{x:1.42,y:.52,z:.10},face);
  sphere('cheekR',.18,{x:.36,y:2.59,z:-.654},cheekMat,{x:1.42,y:.52,z:.10},face);

  const socketMat=transparentMat('eye-socket','#6A483F',.075);
  const lidMat=mat('eyelid-line','#3A2D2B',.80);
  parts.eyes=[];
  for(const [i,x] of [-.235,.235].entries()){
    sphere('eye-socket-'+i,.285,{x,y:2.835,z:-.647},socketMat,{x:.88,y:1.08,z:.10},face);
    const eye=makeNode('eye-group-'+i,face);eye.position.set(x,2.835,-.650);
    sphere('eye-white-'+i,.252,{x:0,y:0,z:0},mWhite,{x:.80,y:1.06,z:.14},eye);
    // Iris, pupil and highlights now sit only millimetres in front of the eye
    // surface instead of floating far outside the head.
    sphere('iris-'+i,.137,{x:0,y:-.006,z:-.034},mIris,{x:.90,y:1,z:.12},eye);
    sphere('pupil-'+i,.072,{x:0,y:-.007,z:-.050},mEye,{x:.86,y:1,z:.10},eye);
    const hi=mat('eye-highlight-'+i,'#ffffff',.12,0,'#ffffff');
    sphere('eye-hi-main-'+i,.034,{x:-.023,y:.031,z:-.061},hi,{x:1,y:1,z:.07},eye,18);
    sphere('eye-hi-soft-'+i,.015,{x:.020,y:-.020,z:-.062},hi,{x:1,y:1,z:.07},eye,14);
    const lid=capsule('upper-lid-'+i,.205,.012,{x:0,y:.112,z:-.009},lidMat,eye);lid.rotation.z=Math.PI/2+(i?-.035:.035);
    if(a.gender==='female'){
      const lash=capsule('lash-'+i,.075,.010,{x:i?.112:-.112,y:.088,z:-.012},lidMat,eye);lash.rotation.z=Math.PI/2+(i?-.32:.32);
    }
    parts.eyes.push(eye);
  }

  const brow=mat('brow','#382B2A',.84);
  const focus=expression==='focus',confident=expression==='confident';
  for(const [i,x] of [-.235,.235].entries()){
    const tilt=focus?(i?-.18:.18):confident?(i?-.04:.15):(i?-.075:.075);
    const y=confident&&i===0?3.045:3.025;
    const b=capsule('brow-'+i,.235,.020,{x,y,z:-.650},brow,face);b.rotation.z=Math.PI/2+tilt;
  }

  // Small nose with a soft shadow and highlight, kept subtle for chibi scale.
  const noseShadow=transparentMat('nose-shadow','#9A5F4D',.14);
  sphere('nose-shadow',.078,{x:.012,y:2.668,z:-.671},noseShadow,{x:.72,y:.88,z:.34},face,18);
  sphere('nose',.064,{x:-.006,y:2.682,z:-.680},mSkin,{x:.64,y:.82,z:.28},face,18);

  const mouthMat=mat('mouth','#854B49',.76);
  const lipLight=transparentMat('lip-light','#F3A5A0',.24);
  if(expression==='focus'){
    tube('mouth',[{x:-.090,y:2.505,z:-.674},{x:0,y:2.512,z:-.680},{x:.090,y:2.505,z:-.674}],.014,mouthMat,face);
  }else if(expression==='calm'){
    tube('mouth',[{x:-.105,y:2.525,z:-.672},{x:0,y:2.507,z:-.682},{x:.105,y:2.525,z:-.672}],.014,mouthMat,face);
  }else if(expression==='confident'){
    tube('mouth',[{x:-.115,y:2.532,z:-.671},{x:-.025,y:2.505,z:-.683},{x:.075,y:2.512,z:-.679},{x:.125,y:2.542,z:-.670}],.016,mouthMat,face);
  }else{
    tube('mouth',[{x:-.125,y:2.545,z:-.670},{x:-.065,y:2.505,z:-.682},{x:0,y:2.492,z:-.687},{x:.065,y:2.505,z:-.682},{x:.125,y:2.545,z:-.670}],.016,mouthMat,face);
    sphere('smile-light',.075,{x:0,y:2.491,z:-.690},lipLight,{x:1.35,y:.17,z:.09},face,16);
  }
}

function buildHair(a,hairMat,parent=root,headItem=null){
  const style=normalizeStyle(a.hair||'short'),group=makeNode('hair-group',parent),hatSafe=!!headItem;
  const baseHex=hairMat.albedoColor?.toHexString?.()||'#263248';
  const shadowMat=mat('hair-shadow',toneHex(baseHex,.68),.68),highlightMat=mat('hair-highlight',toneHex(baseHex,1.24,.025),.46);
  const modules={back:makeNode('hairBack',group),base:makeNode('hairBase',group),side:makeNode('hairSides',group),top:makeNode('hairTop',group),front:makeNode('hairFront',group),detail:makeNode('hairHighlights',group)};
  parts.hair=group;parts.hairModules=modules;group.metadata={style,hatSafe,layered:true};
  const blob=(name,x,y,z,sx,sy,sz,material=hairMat,parentNode=modules.front)=>sphere(name,.40,{x,y,z},material,{x:sx,y:sy,z:sz},parentNode);
  const strand=(name,x,y,z,len=.35,width=.085,angle=0,material=hairMat,parentNode=modules.front)=>{const s=capsule(name,len,width,{x,y,z},material,parentNode);s.rotation.z=angle;s.scaling.z=.72;return s};
  const curl=(name,x,y,z,size=.24,material=hairMat,parentNode=modules.side)=>sphere(name,size,{x,y,z},material,{x:1,y:.92,z:.86},parentNode,18);
  const cap=(y=3.035,sy=.56,z=.14)=>sphere('hair-cap',1.32,{x:0,y,z},hairMat,{x:1.01,y:hatSafe?Math.min(sy,.45):sy,z:.96},modules.base);
  const softPart=(x,y,len,angle,parentNode=modules.front)=>strand('hair-part-'+x+'-'+y,x,y,-.552,len,.020,angle,highlightMat,parentNode);

  if(['crew','buzz'].includes(style)){
    sphere('crew-cap',1.29,{x:0,y:3.045,z:.13},hairMat,{x:1.00,y:hatSafe?.34:.41,z:.96},modules.base);
    if(!hatSafe)for(let i=0;i<7;i++)curl('crew-texture-'+i,-.39+i*.13,3.19+(i%2)*.035,-.485,.085,i%2?highlightMat:shadowMat,modules.detail);
  }else if(!['undercut','fade'].includes(style))cap();

  if(['side','sidesweep'].includes(style)){
    strand('side-sweep-a',-.15,3.115,-.548,.54,.125,-.64,hairMat);
    strand('side-sweep-b',.18,3.075,-.550,.43,.115,-.47,hairMat);
    strand('side-temple',.49,2.89,-.39,.37,.11,-.05,shadowMat,modules.side);
    softPart(-.18,3.205,.29,-.60);
  }else if(style==='layered'){
    for(const [i,x] of [-.38,-.20,0,.20,.38].entries())strand('layered-front-'+i,x,3.055+(i%2)*.045,-.55,.34+(i%3)*.045,.092,(i-2)*-.14,hairMat);
    for(const x of [-.51,.51])strand('layered-side-'+x,x,2.76,-.22,.62,.145,x<0?.08:-.08,shadowMat,modules.side);
    softPart(-.12,3.20,.25,-.18);
  }else if(['spiky','spike','mohawk'].includes(style)){
    for(const [i,x] of [-.36,-.22,-.07,.09,.24,.37].entries())strand('spiky-fringe-'+i,x,3.02+(i%2)*.035,-.55,.28,.075,(i-2.5)*-.12,hairMat);
    if(!hatSafe)for(const [i,x] of [-.38,-.23,-.07,.10,.26,.40].entries()){
      const tuft=cone('soft-tuft-'+i,.34+(i%2)*.055,.20,{x,y:3.36+(i%3)*.025,z:.03},i%3===0?highlightMat:hairMat,modules.top);tuft.rotation.z=(i-2.5)*-.13;
    }
  }else if(['bob','roundbob'].includes(style)){
    sphere('bob-back',1.30,{x:0,y:2.72,z:.20},shadowMat,{x:1.035,y:1.02,z:.82},modules.back);
    for(const x of [-.52,.52]){strand('bob-side-'+x,x,2.63,-.16,.78,.175,x<0?.035:-.035,hairMat,modules.side);curl('bob-tip-'+x,x,2.27,-.15,.30,hairMat,modules.side)}
    for(const [i,x] of [-.29,-.10,.10,.29].entries())strand('bob-fringe-'+i,x,3.02,-.55,.31,.090,(i-1.5)*-.12,hairMat);
    softPart(-.16,3.17,.22,-.16);
  }else if(['pony','ponytail','highpony'].includes(style)){
    strand('pony-sweep-a',-.15,3.10,-.55,.50,.115,-.56,hairMat);
    strand('pony-sweep-b',.18,3.06,-.55,.39,.105,-.42,hairMat);
    const tieY=hatSafe?2.92:3.08;curl('pony-tie',.02,tieY,.65,.20,highlightMat,modules.back);
    strand('pony-upper',.10,tieY-.22,.66,.56,.19,-.18,hairMat,modules.back);
    strand('pony-lower',.20,tieY-.64,.60,.56,.17,-.27,shadowMat,modules.back);
    curl('pony-tip',.28,tieY-.91,.53,.31,hairMat,modules.back);
  }else if(['long','longwave','flow'].includes(style)){
    sphere('long-back',1.30,{x:0,y:2.35,z:.23},shadowMat,{x:1.035,y:1.62,z:.80},modules.back);
    for(const x of [-.52,.52]){
      if(style==='flow'||style==='longwave'){
        strand('flow-a-'+x,x,2.55,-.10,.72,.16,x<0?-.08:.08,hairMat,modules.side);
        strand('flow-b-'+x,x+(x<0?-.035:.035),2.02,-.08,.60,.15,x<0?.10:-.10,hairMat,modules.side);
        curl('flow-tip-'+x,x,1.70,-.05,.31,shadowMat,modules.side);
      }else{
        strand('long-side-'+x,x,2.25,-.10,1.42,.17,x<0?.025:-.025,hairMat,modules.side);
        curl('long-tip-'+x,x,1.54,-.07,.30,shadowMat,modules.side);
      }
      strand('long-highlight-'+x,x+(x<0?.035:-.035),2.29,-.255,.74,.025,x<0?.02:-.02,highlightMat,modules.detail);
    }
    for(const [i,x] of [-.28,-.09,.10,.29].entries())strand('long-fringe-'+i,x,3.02,-.55,.31,.09,(i-1.5)*-.10,hairMat);
  }else if(['curly','curls'].includes(style)){
    const curls=[[-.43,3.24],[-.22,3.36],[0,3.39],[.22,3.36],[.43,3.24],[-.52,3.05],[.52,3.05],[-.55,2.82],[.55,2.82],[-.39,2.94],[-.13,3.04],[.14,3.04],[.39,2.94]];
    for(const [i,p] of curls.entries())if(!hatSafe||p[1]<3.18)curl('curl-'+i,p[0],p[1],p[1]<3.10?-.43:-.12,.27,i%4===0?highlightMat:hairMat,p[1]<3.10?modules.front:modules.top);
  }else if(['undercut','fade'].includes(style)){
    sphere('fade-base',1.27,{x:0,y:3.00,z:.15},shadowMat,{x:1.00,y:hatSafe?.32:.38,z:.95},modules.base);
    for(const [i,x] of [-.27,-.08,.12,.29].entries())strand('undercut-top-'+i,x,3.16+(i%2)*.025,-.48,hatSafe?.28:.42,.10,-.60+(i*.08),i===1?highlightMat:hairMat,modules.top);
    strand('fade-temple',-.49,2.91,-.31,.30,.075,.03,shadowMat,modules.side);
  }else if(['twintail','twin'].includes(style)){
    for(const [i,x] of [-.72,.72].entries()){
      curl('twin-tie-'+i,x,2.83,.20,.21,highlightMat,modules.side);
      strand('twin-upper-'+i,x,2.55,.16,.56,.17,i?-.18:.18,hairMat,modules.side);
      strand('twin-lower-'+i,x+(i?.07:-.07),2.14,.13,.54,.15,i?.20:-.20,shadowMat,modules.side);
      curl('twin-tip-'+i,x+(i?.13:-.13),1.87,.10,.29,hairMat,modules.side);
    }
    for(const [i,x] of [-.27,-.09,.09,.27].entries())strand('twin-fringe-'+i,x,3.01,-.55,.30,.085,(i-1.5)*-.10,hairMat);
  }else if(['bun','topbun'].includes(style)){
    const bunY=hatSafe?2.78:3.48,bunZ=hatSafe?.61:.18;
    sphere('bun-shadow',.62,{x:0,y:bunY,z:bunZ+.025},shadowMat,{x:1,y:.88,z:1},modules.back);
    sphere('bun-main',.52,{x:-.02,y:bunY+.02,z:bunZ-.015},hairMat,{x:1,y:.88,z:1},modules.back);
    strand('bun-sweep',-.12,3.08,-.55,.46,.11,-.52,hairMat);
    softPart(-.17,3.18,.23,-.50);
  }else if(['braid','braids'].includes(style)){
    for(const [j,x] of [-.54,.54].entries()){
      for(let k=0;k<6;k++)curl('braid-'+j+'-'+k,x+(j?.025:-.025)*k,2.62-k*.18,.01,.245-k*.012,k%2?shadowMat:hairMat,modules.side);
      curl('braid-tie-'+j,x+(j?.13:-.13),1.55,.01,.14,highlightMat,modules.side);
    }
    for(const [i,x] of [-.27,-.09,.09,.27].entries())strand('braid-fringe-'+i,x,3.02,-.55,.30,.085,(i-1.5)*-.11,hairMat);
  }else if(['messy','wavy'].includes(style)){
    for(const [i,x] of [-.39,-.24,-.08,.09,.25,.39].entries())strand('messy-front-'+i,x,3.06+(i%2)*.045,-.54,.34+(i%3)*.04,.09,(i-2.5)*-.18,i===1||i===4?highlightMat:hairMat);
    if(!hatSafe)for(const [i,x] of [-.30,-.10,.12,.31].entries())blob('messy-volume-'+i,x,3.28+(i%2)*.06,-.04,.72,.52,.68,i===2?highlightMat:hairMat,modules.top);
    for(const x of [-.50,.50])strand('wavy-side-'+x,x,2.77,-.20,.55,.13,x<0?.12:-.12,shadowMat,modules.side);
  }else if(!['crew','buzz'].includes(style)){
    for(const [i,x] of [-.32,-.16,.02,.20,.35].entries())strand('classic-front-'+i,x,3.04+(i%2)*.025,-.55,.30,.085,(i-2)*-.105,hairMat);
    for(const x of [-.49,.49])strand('classic-side-'+x,x,2.88,-.31,.34,.095,x<0?.03:-.03,shadowMat,modules.side);
  }

  if(!hatSafe&&!['crew','buzz','curly','curls'].includes(style)){
    softPart(-.22,3.20,.20,-.16,modules.detail);softPart(.03,3.23,.18,.03,modules.detail);softPart(.24,3.18,.17,.16,modules.detail);
  }
  return group;
}

function buildPhiLogo(parent,mAccent,pos={x:.27,y:1.67,z:-.365},scale=.92){
  const logo=makeNode('math-phi-logo',parent);logo.position.set(pos.x,pos.y,pos.z);logo.scaling.set(scale,scale,scale);
  const ring=torus('phi-ring',.18,.024,{x:0,y:0,z:0},mAccent,logo);ring.rotation.x=Math.PI/2;
  capsule('phi-stem',.235,.014,{x:0,y:0,z:-.014},mAccent,logo);
  return logo;
}

function buildTorso(a,g,mTop,mAccent,mSkin){
  const style=normalizeStyle(g.top?.topStyle||g.top?.style||'shirt');
  const grp=makeNode('torso-group');parts.bodyGroup=grp;
  const isUniform=['shirt','uniform','school','classic',''].includes(style);
  const mWhite=mat('garment-white','#F8FAFC',.88),baseHex=mTop.albedoColor?.toHexString?.()||'#EAF2FF';
  const mLight=mat('garment-light',toneHex(baseHex,1.12,.025),.80),mDark=mat('garment-shadow',toneHex(baseHex,.72),.84);
  const garment=makeNode('garment-layers',grp);parts.garment=garment;
  const torso=capsule('torso',1.48,.43,{x:0,y:1.55,z:0},mTop,garment);torso.scaling.set(a.gender==='female'?.98:1.07,1,.78);parts.body=torso;
  const chest=sphere('soft-chest',.88,{x:0,y:1.94,z:0},mTop,{x:a.gender==='female'?1.00:1.10,y:.42,z:.76},garment);parts.chest=chest;
  sphere('soft-waist',.74,{x:0,y:.91,z:.01},mTop,{x:a.gender==='female'?.98:1.05,y:.32,z:.76},garment);
  const neck=capsule('neck',.30,.135,{x:0,y:2.32,z:0},mSkin,grp);neck.scaling.z=.92;
  const hem=torus('garment-hem',.72,.035,{x:0,y:.88,z:.01},style==='robe'?mAccent:mDark,garment);hem.scaling.z=.78;
  if(isUniform){
    for(const x of [-.31,.31])sphere('uniform-shoulder-'+x,.46,{x,y:1.95,z:-.01},mWhite,{x:.80,y:.54,z:.72},garment);
    for(const x of [-.365,.365]){const panel=capsule('uniform-side-panel-'+x,.86,.037,{x,y:1.42,z:-.285},mAccent,garment);panel.rotation.z=x<0?-.035:.035}
    const colL=box('uniform-collar-l',{x:.25,y:.19,z:.045},{x:-.115,y:2.07,z:-.346},mWhite,garment);colL.rotation.z=.52;
    const colR=box('uniform-collar-r',{x:.25,y:.19,z:.045},{x:.115,y:2.07,z:-.346},mWhite,garment);colR.rotation.z=-.52;
    capsule('uniform-placket',.50,.015,{x:0,y:1.79,z:-.365},mAccent,garment);
    for(let i=0;i<3;i++)sphere('uniform-button-'+i,.038,{x:0,y:1.91-i*.16,z:-.384},mAccent,{x:1,y:1,z:.25},garment,14);
    for(const x of [-.225,.225]){
      box('uniform-pocket-'+x,{x:.22,y:.16,z:.035},{x,y:1.16,z:-.345},mLight,garment);
      box('uniform-pocket-trim-'+x,{x:.23,y:.025,z:.044},{x,y:1.24,z:-.365},mAccent,garment);
    }
    buildPhiLogo(garment,mAccent,{x:.27,y:1.69,z:-.374},.90);
  }else if(style==='hoodie'){
    const hood=torus('hood',.72,.105,{x:0,y:2.04,z:.12},mDark,garment);hood.rotation.x=Math.PI/2;hood.scaling.y=.92;
    for(const x of [-.075,.075]){capsule('hood-lace-'+x,.38,.011,{x,y:1.79,z:-.365},mAccent,garment);sphere('hood-lace-tip-'+x,.045,{x,y:1.59,z:-.374},mAccent,{x:.75,y:1,z:.55},garment,14)}
    sphere('hoodie-pocket',.57,{x:0,y:1.12,z:-.335},mDark,{x:1.08,y:.34,z:.16},garment);
    const pocketTop=box('hoodie-pocket-top',{x:.52,y:.022,z:.035},{x:0,y:1.23,z:-.382},mAccent,garment);pocketTop.rotation.z=0;
    buildPhiLogo(garment,mAccent,{x:.25,y:1.70,z:-.372},.86);
  }else if(style==='jacket'||style==='blazer'||style==='varsity'){
    box('jacket-left',{x:.37,y:1.10,z:.055},{x:-.205,y:1.48,z:-.346},style==='blazer'?mDark:mTop,garment);
    box('jacket-right',{x:.37,y:1.10,z:.055},{x:.205,y:1.48,z:-.346},mTop,garment);
    const lapelL=box('lapel-l',{x:.25,y:.48,z:.045},{x:-.12,y:1.91,z:-.385},mLight,garment);lapelL.rotation.z=-.38;
    const lapelR=box('lapel-r',{x:.25,y:.48,z:.045},{x:.12,y:1.91,z:-.385},mLight,garment);lapelR.rotation.z=.38;
    box('jacket-line',{x:.035,y:.98,z:.060},{x:0,y:1.42,z:-.390},mAccent,garment);
    for(let i=0;i<3;i++)sphere('jacket-button-'+i,.046,{x:.075,y:1.68-i*.22,z:-.425},mAccent,{x:1,y:1,z:.22},garment,14);
    for(const x of [-.25,.25])box('jacket-pocket-'+x,{x:.20,y:.032,z:.045},{x,y:1.18,z:-.395},mAccent,garment);
    buildPhiLogo(garment,mAccent,{x:.275,y:1.73,z:-.420},.70);
  }else if(style==='robe'||style==='cape-top'){
    const robe=cyl('robe',1.50,.82,1.17,{x:0,y:1.30,z:.09},mTop,garment,36);robe.scaling.z=.80;
    const collar=torus('robe-collar',.61,.075,{x:0,y:2.00,z:-.20},mAccent,garment);collar.rotation.x=Math.PI/2;
    for(const x of [-.32,.32])capsule('robe-edge-'+x,1.08,.025,{x,y:1.37,z:-.405},mAccent,garment);
    box('robe-sash',{x:.82,y:.09,z:.055},{x:0,y:.92,z:-.352},mAccent,garment);
    buildPhiLogo(garment,mAccent,{x:0,y:1.58,z:-.425},.96);
  }else if(style==='polo'){
    const col1=box('polo-collar-l',{x:.25,y:.20,z:.045},{x:-.12,y:2.04,z:-.352},mAccent,garment);col1.rotation.z=.50;
    const col2=box('polo-collar-r',{x:.25,y:.20,z:.045},{x:.12,y:2.04,z:-.352},mAccent,garment);col2.rotation.z=-.50;
    capsule('polo-placket',.34,.014,{x:0,y:1.88,z:-.372},mDark,garment);
    for(let i=0;i<2;i++)sphere('polo-button-'+i,.034,{x:0,y:1.98-i*.13,z:-.391},mAccent,{x:1,y:1,z:.22},garment,14);
    buildPhiLogo(garment,mAccent,{x:.275,y:1.67,z:-.373},.78);
  }else if(style==='jersey'||style==='sport'){
    for(const x of [-.33,.33])capsule('sport-stripe-'+x,1.02,.032,{x,y:1.46,z:-.315},mAccent,garment);
    const neckRing=torus('sport-neck',.49,.040,{x:0,y:2.07,z:-.08},mAccent,garment);neckRing.rotation.x=Math.PI/2;
    box('sport-chest-band',{x:.58,y:.055,z:.045},{x:0,y:1.55,z:-.375},mLight,garment);
    buildPhiLogo(garment,mAccent,{x:0,y:1.77,z:-.392},1.02);
  }else if(style==='sweater'){
    const neckRing=torus('sweater-neck',.52,.060,{x:0,y:2.07,z:-.07},mAccent,garment);neckRing.rotation.x=Math.PI/2;
    const rib=torus('sweater-rib',.72,.050,{x:0,y:.91,z:.01},mAccent,garment);rib.scaling.z=.78;
    for(const x of [-.22,0,.22])capsule('sweater-knit-'+x,.72,.010,{x,y:1.40,z:-.365},mLight,garment);
    buildPhiLogo(garment,mAccent,{x:.27,y:1.70,z:-.378},.82);
  }
  return {style,isUniform,grp};
}
function buildArm(side,mTop,mAccent,mSkin,style){
  const sx=side==='L'?-1:1;const arm=makeNode('armGroup'+side);arm.position.set(sx*.47,1.96,0);parts[side==='L'?'leftArm':'rightArm']=arm;
  const uniform=['shirt','uniform','school','classic',''].includes(style),longSleeve=['hoodie','jacket','blazer','varsity','sweater','robe','cape-top'].includes(style);
  const sleeveMat=uniform?mat('uniform-sleeve-'+side,'#F8FAFC',.90):mTop;
  const sleeveLen=longSleeve?.52:.40;
  sphere('shoulder'+side,.35,{x:sx*.015,y:-.02,z:0},sleeveMat,{x:.92,y:1,z:.90},arm);
  const upper=capsule('upperArm'+side,sleeveLen,.145,{x:sx*.065,y:-.25,z:0},sleeveMat,arm);upper.rotation.z=sx*-.11;
  sphere('elbow'+side,.245,{x:sx*.115,y:-.52,z:0},longSleeve?sleeveMat:mSkin,{x:.95,y:1,z:.92},arm);
  const fore=capsule('forearm'+side,.56,.115,{x:sx*.13,y:-.77,z:0},longSleeve?sleeveMat:mSkin,arm);fore.rotation.z=sx*-.025;
  const cuffY=longSleeve?-1.01:-.46,cuff=torus('sleeve-cuff'+side,.245,.028,{x:sx*(longSleeve?.14:.11),y:cuffY,z:0},mAccent,arm);cuff.scaling.z=.88;
  sphere('wrist'+side,.18,{x:sx*.14,y:-1.045,z:0},mSkin,{x:.92,y:1,z:.90},arm);
  sphere('hand'+side,.25,{x:sx*.145,y:-1.17,z:-.015},mSkin,{x:.82,y:1.08,z:.72},arm);
  sphere('thumb'+side,.11,{x:sx*.245,y:-1.15,z:-.075},mSkin,{x:.72,y:1,z:.75},arm,16);
  arm.rotation.z=sx*.065;return arm;
}
function buildBottom(a,g,mBottom,mAccent){
  const style=normalizeStyle(g.bottom?.bottomStyle||g.bottom?.style||(a.gender==='female'?'skirt':'trousers'));
  const grp=makeNode('bottom-group');parts.bottom=grp;
  const bottomHex=mBottom.albedoColor?.toHexString?.()||'#27364E',mDark=mat('bottom-shadow',toneHex(bottomHex,.70),.84),mLight=mat('bottom-light',toneHex(bottomHex,1.16,.02),.78);
  const waist=torus('waistband',.76,.050,{x:0,y:.89,z:.01},style==='jogger'?mAccent:mDark,grp);waist.scaling.z=.78;
  if(['skirt','pleated','dress'].includes(style)){
    const skirt=cyl('skirt',.72,.84,1.14,{x:0,y:.65,z:.02},mBottom,grp,36);skirt.scaling.z=.82;
    const skirtHem=torus('skirt-hem',1.07,.036,{x:0,y:.30,z:.02},mDark,grp);skirtHem.scaling.z=.82;
    if(style==='pleated')for(let i=-3;i<=3;i++){
      const pleat=box('pleat-'+i,{x:.028,y:.52,z:.025},{x:i*.13,y:.61,z:-.455+Math.abs(i)*.007},i%2?mLight:mAccent,grp);pleat.rotation.z=i*.010;
    }
  }else if(style==='shorts'){
    sphere('shorts-hip',.79,{x:0,y:.76,z:.02},mBottom,{x:1.03,y:.42,z:.76},grp);
    for(const x of [-.21,.21]){const leg=capsule('short-leg-'+x,.43,.205,{x,y:.58,z:.01},mBottom,grp);leg.scaling.z=.78;const hem=torus('short-hem-'+x,.36,.030,{x,y:.38,z:.01},mAccent,grp);hem.scaling.z=.80}
    capsule('shorts-centre-seam',.29,.012,{x:0,y:.57,z:-.315},mDark,grp);
  }else if(style==='jogger'){
    for(const x of [-.045,.045]){const cord=capsule('jogger-cord-'+x,.23,.010,{x,y:.76,z:-.325},mAccent,grp);cord.rotation.z=x<0?-.10:.10}
    sphere('jogger-knot',.055,{x:0,y:.83,z:-.342},mAccent,{x:1,y:1,z:.45},grp,14);
  }else{
    capsule('trouser-fly',.32,.012,{x:0,y:.69,z:-.325},mDark,grp);
    for(const x of [-.27,.27]){const pocket=box('trouser-pocket-'+x,{x:.18,y:.022,z:.026},{x,y:.75,z:-.325},mLight,grp);pocket.rotation.z=x<0?-.20:.20}
  }
  return style;
}
function buildLegs(bottomStyle,mBottom,mShoe,mAccent,g){
  const short=bottomStyle==='shorts'||bottomStyle==='skirt'||bottomStyle==='pleated'||bottomStyle==='dress';
  const legMat=short?mat('leg-skin',skinColor(avatar()),.82):mBottom;
  const bottomHex=mBottom.albedoColor?.toHexString?.()||'#27364E',pantSeam=mat('pant-seam',toneHex(bottomHex,.66),.86);
  const shoeHex=mShoe.albedoColor?.toHexString?.()||'#263248',shoeLight=mat('shoe-light',toneHex(shoeHex,1.28,.055),.52),shoeDark=mat('shoe-dark',toneHex(shoeHex,.62),.62),sole=mat('shoe-sole','#F7F8FB',.76);
  const shoeStyle=normalizeStyle(g.shoes?.shoeStyle||g.shoes?.style||'school');
  sphere('pelvis',.82,{x:0,y:.78,z:.02},mBottom,{x:1.04,y:.43,z:.76},root);
  for(const [idx,x] of [-.22,.22].entries()){
    const side=idx?'R':'L';
    const thigh=capsule('thigh'+side,.67,.18,{x,y:.48,z:0},legMat);parts['leg'+side]=thigh;
    sphere('knee'+side,.285,{x,y:.13,z:-.005},legMat,{x:.96,y:1,z:.92});
    const calf=capsule('calf'+side,.64,.15,{x,y:-.16,z:.015},legMat);calf.scaling.set(.96,1,.94);
    if(!short)capsule('pant-crease'+side,.73,.009,{x,y:.09,z:-.145},pantSeam);
    if(bottomStyle==='jogger'){const cuff=torus('jogger-cuff'+side,.29,.035,{x,y:-.43,z:.015},mAccent);cuff.scaling.z=.94}
    if(shoeStyle==='boot'){
      capsule('boot-shaft'+side,.48,.185,{x,y:-.36,z:.02},mShoe).scaling.z=.94;
      sphere('boot-foot'+side,.48,{x,y:-.53,z:-.13},mShoe,{x:.96,y:.55,z:1.42});
      sphere('boot-toe'+side,.38,{x,y:-.53,z:-.40},shoeLight,{x:1.02,y:.54,z:.82});
      sphere('boot-sole'+side,.47,{x,y:-.645,z:-.16},shoeDark,{x:1.00,y:.17,z:1.48});
    }else if(shoeStyle==='hightop'){
      sphere('hightop-collar'+side,.40,{x,y:-.39,z:.00},mShoe,{x:.94,y:.84,z:.94});
      sphere('hightop-foot'+side,.46,{x,y:-.53,z:-.14},mShoe,{x:.96,y:.54,z:1.44});
      sphere('hightop-sole'+side,.47,{x,y:-.645,z:-.16},sole,{x:1.00,y:.18,z:1.49});
      for(let k=0;k<3;k++)box('hightop-lace-'+side+'-'+k,{x:.22,y:.018,z:.025},{x,y:-.40-k*.045,z:-.405},shoeLight);
    }else{
      const runner=shoeStyle==='runner';
      sphere('shoe'+side,.46,{x,y:-.53,z:-.14},mShoe,{x:runner?1.00:.96,y:runner?.50:.55,z:runner?1.54:1.44});
      sphere('toe'+side,.37,{x,y:-.53,z:runner?-.43:-.40},runner?shoeLight:mShoe,{x:1.04,y:.56,z:.84});
      sphere('sole'+side,.47,{x,y:-.645,z:-.17},sole,{x:1.00,y:.18,z:runner?1.58:1.49});
      if(shoeStyle==='school')box('school-strap'+side,{x:.28,y:.030,z:.10},{x,y:-.45,z:-.33},shoeLight);
      else for(let k=0;k<3;k++)box('lace-'+side+'-'+k,{x:.22-k*.018,y:.018,z:.025},{x,y:-.43-k*.035,z:-.405},shoeStyle==='sneaker'?mAccent:shoeDark);
      if(runner){const stripe=box('runner-stripe'+side,{x:.26,y:.035,z:.035},{x,y:-.52,z:-.46},mAccent);stripe.rotation.z=idx?-.28:.28}
    }
  }
}
function buildHeadgear(g,parent=root){if(!g.head)return;const it=g.head,style=normalizeStyle(it.shape||it.headStyle||'cap'),mh=mat('headGear',it.color||'#315BC7',.54,.05),dark=mat('headGearDark',it.accent||'#203B7A',.62);
  const grp=makeNode('headgear-group',parent);
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
function buildGlasses(g,parent=root){if(!g.glasses)return;const it=g.glasses,style=normalizeStyle(it.glassesShape||it.shape||'round'),mg=mat('glasses',it.color||'#334155',.30,.18),grp=makeNode('glasses-group',parent);
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

function buildAvatarAO(){
  const ao=transparentMat('ao-soft','#172033',.105);ao.unlit=true;ao.disableLighting=true;
  const grp=makeNode('avatar-ambient-occlusion');parts.ao=grp;
  const neck=torus('ao-neck',.305,.027,{x:0,y:2.185,z:.015},ao,grp);neck.scaling.z=.90;
  const waist=torus('ao-waist',.72,.025,{x:0,y:.875,z:.025},ao,grp);waist.scaling.z=.76;
  for(const x of [-.43,.43])sphere('ao-underarm-'+x,.22,{x,y:1.72,z:.075},ao,{x:.72,y:.40,z:.64},grp,18);
  for(const x of [-.22,.22]){const ankle=torus('ao-ankle-'+x,.275,.022,{x,y:-.43,z:.02},ao,grp);ankle.scaling.z=.90}
  sphere('ao-chin',.34,{x:0,y:2.36,z:.12},ao,{x:1.18,y:.18,z:.78},grp,18);
}

function buildAvatar(){
  disposeModel();const base=avatar(),o=outfit(base),g0=window.v385Wardrobe?.resolved?.(base)||{},g={...g0};
  if(previewItem&&previewItem.slot){g[previewItem.slot]=previewItem;if(previewItem.slot==='hair'){g.hairStyle=previewItem.hairStyle;g.hairColor=previewItem.hairColor||previewItem.color}}
  const a={...base,hair:g.hairStyle||base.hair};root=makeNode('avatarRoot',null);root.position.y=-.02;
  const mSkin=mat('skin',skinColor(a),.88),mHair=mat('hair',g.hairColor||'#1F2940',.58),mEye=mat('eye','#17151B',.20),mIris=mat('iris','#5A3C2C',.22),mWhite=mat('white','#FDFDFD',.34),mTop=mat('top',g.topColor||g.top?.color||o.top||'#3B7B4B',.78),mAccent=mat('accent',g.accent||g.top?.accent||o.accent||'#D6A721',.56),mBottom=mat('bottom',g.bottomColor||g.bottom?.color||o.bottom||'#204C48',.78),mShoe=mat('shoe',g.shoeColor||g.shoes?.color||'#202631',.56);
  const torsoInfo=buildTorso(a,g,mTop,mAccent,mSkin);
  // A motion pivot at the actual head centre prevents the face from orbiting
  // around the body when it tilts. The inner rig maps legacy coordinates to
  // the smaller Step 1/2 head without breaking hats, glasses or hairstyles.
  const headMotion=makeNode('head-motion');headMotion.position.set(0,2.94,-.0172);parts.head=headMotion;
  const headRig=makeNode('head-rig',headMotion);headRig.position.set(0,-2.4252,.0172);headRig.scaling.set(.86,.86,.86);
  const headShape=a.gender==='female'?{x:.945,y:1.070,z:.935}:{x:.975,y:1.045,z:.945};
  sphere('head',1.36,{x:0,y:2.82,z:-.02},mSkin,headShape,headRig);
  buildFace(a,mSkin,mEye,mIris,mWhite,mAccent,headRig);buildHair(a,mHair,headRig,g.head);
  buildArm('L',mTop,mAccent,mSkin,torsoInfo.style);buildArm('R',mTop,mAccent,mSkin,torsoInfo.style);
  const bottomStyle=buildBottom(a,g,mBottom,mAccent);buildLegs(bottomStyle,mBottom,mShoe,mAccent,g);
  buildAvatarAO();
  buildHeadgear(g,headRig);buildGlasses(g,headRig);
  if(g.back)buildBack(g);else buildBack({back:{backStyle:'backpack',color:g.accent||'#416B48',accent:'#294B33'}});
  buildHandTool(g);
  try{root.getChildMeshes().forEach(x=>{x.receiveShadows=true;x.isPickable=false})}catch(_){ }
}
function createScene(){
  const lowPower=isLowPower();scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.965,.965,.975,1);scene.environmentIntensity=.78;scene.ambientColor=new BABYLON.Color3(.13,.14,.18);
  try{
    const ip=scene.imageProcessingConfiguration;ip.toneMappingEnabled=true;ip.toneMappingType=BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;ip.exposure=1.08;ip.contrast=1.075;ip.colorCurvesEnabled=true;ip.vignetteEnabled=true;ip.vignetteWeight=1.15;ip.vignetteStretch=.35;ip.vignetteColor=new BABYLON.Color4(.88,.90,.95,1);ip.vignetteBlendMode=BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
  }catch(_){ }
  const cam=new BABYLON.ArcRotateCamera('cam',-Math.PI/2.10,Math.PI/2.30,6.25,new BABYLON.Vector3(0,1.52,0),scene);cam.lowerRadiusLimit=4.7;cam.upperRadiusLimit=7.8;cam.lowerBetaLimit=.90;cam.upperBetaLimit=1.60;cam.wheelPrecision=78;cam.panningSensibility=0;cam.inertia=.80;cam.attachControl(canvas,true);
  const hemi=new BABYLON.HemisphericLight('ambient-soft',new BABYLON.Vector3(.12,1,-.28),scene);hemi.intensity=.74;hemi.diffuse=new BABYLON.Color3(1,.96,.92);hemi.groundColor=new BABYLON.Color3(.43,.49,.61);
  const key=new BABYLON.DirectionalLight('key-warm',new BABYLON.Vector3(-.42,-1,.48),scene);key.position.set(4.8,7.4,-5.8);key.diffuse=new BABYLON.Color3(1,.88,.74);key.specular=new BABYLON.Color3(1,.90,.80);key.intensity=1.38;
  const fill=new BABYLON.PointLight('fill-cool',new BABYLON.Vector3(-3.4,3.6,-3.1),scene);fill.diffuse=new BABYLON.Color3(.65,.79,1);fill.specular=new BABYLON.Color3(.48,.66,.92);fill.intensity=.46;fill.radius=3.2;
  const faceFill=new BABYLON.PointLight('face-softbox',new BABYLON.Vector3(.15,3.25,-3.8),scene);faceFill.diffuse=new BABYLON.Color3(1,.91,.82);faceFill.specular=new BABYLON.Color3(.92,.86,.80);faceFill.intensity=.28;faceFill.radius=2.8;
  const rim=new BABYLON.PointLight('rim-soft',new BABYLON.Vector3(3.2,3.6,2.9),scene);rim.diffuse=new BABYLON.Color3(.72,.82,1);rim.specular=new BABYLON.Color3(.74,.84,1);rim.intensity=.48;rim.radius=2.4;
  let shadow=null;try{shadow=new BABYLON.ShadowGenerator(lowPower?1024:2048,key);shadow.useBlurExponentialShadowMap=true;shadow.blurKernel=lowPower?20:36;shadow.bias=.00055;shadow.normalBias=.018;shadow.setDarkness(.20)}catch(_){ }
  const groundMat=mat('ground','#E8E9ED',.98),ground=BABYLON.MeshBuilder.CreateDisc('ground',{radius:2.35,tessellation:72},scene);ground.rotation.x=Math.PI/2;ground.position.y=-.66;ground.material=groundMat;ground.receiveShadows=true;
  const haloMat=transparentMat('halo','#F2C980',.075),halo=BABYLON.MeshBuilder.CreateDisc('warm-halo',{radius:1.68,tessellation:64},scene);halo.rotation.x=Math.PI/2;halo.position.set(-.35,-.651,.16);halo.material=haloMat;
  const contactMat=transparentMat('contact-shadow','#182033',.14);contactMat.unlit=true;contactMat.disableLighting=true;const contact=BABYLON.MeshBuilder.CreateDisc('contact-shadow-disc',{radius:.78,tessellation:64},scene);contact.rotation.x=Math.PI/2;contact.scaling.set(.90,1,.52);contact.position.set(0,-.647,-.02);contact.material=contactMat;
  buildAvatar();try{root.getChildMeshes().forEach(m=>{if(!String(m.name||'').startsWith('ao-'))shadow?.addShadowCaster(m)})}catch(_){ }
  try{const pipeline=new BABYLON.DefaultRenderingPipeline('avatar-soft3d-pipeline',true,scene,[cam]);pipeline.samples=lowPower?1:2;pipeline.fxaaEnabled=true;pipeline.bloomEnabled=!lowPower;pipeline.bloomWeight=.055;pipeline.bloomThreshold=.88;pipeline.bloomKernel=48}catch(_){ }
  scene.onBeforeRenderObservable.add(()=>{
    if(!root)return;const now=performance.now(),t=now/1000,c=now<celebrateUntil;
    root.position.y=-.02+(c?Math.abs(Math.sin(t*7))*.14:Math.sin(t*1.8)*.018);
    root.rotation.y=c?Math.sin(t*8)*.10:Math.sin(t*.48)*.015;
    if(parts.head){parts.head.rotation.z=c?Math.sin(t*8)*.05:Math.sin(t*.68)*.014;parts.head.rotation.y=Math.sin(t*.46)*.022}
    if(parts.leftArm&&parts.rightArm){if(c){parts.leftArm.rotation.z=-2.0+Math.sin(t*10)*.12;parts.rightArm.rotation.z=2.0-Math.sin(t*10)*.12}else{parts.leftArm.rotation.z=-.12+Math.sin(t*1.45)*.022;parts.rightArm.rotation.z=.12-Math.sin(t*1.45)*.022}}
    const phase=now%4300;const blink=(phase<145)||(phase>340&&phase<410);const sy=blink?.09:1;for(const eye of parts.eyes||[])eye.scaling.y+=(sy-eye.scaling.y)*.44;
  });return scene;
}
function destroy(){if(rafMount)cancelAnimationFrame(rafMount);rafMount=0;try{scene?.dispose()}catch(_){}try{engine?.dispose()}catch(_){}scene=null;engine=null;root=null;canvas=null;parts={}}
function controls(shell){shell.insertAdjacentHTML('beforeend',`<div class="v384-avatar3d-badge">3D • SOFT</div><div class="v392-quality-chip"></div><div class="v384-avatar3d-controls"><button type="button" data-act="left" title="Xoay trái">↶</button><button type="button" data-act="reset" title="Góc nhìn mặc định">◎</button><button type="button" data-act="celebrate" title="Ăn mừng">✦</button><button type="button" data-act="right" title="Xoay phải">↷</button></div>`);shell.querySelector('[data-act="left"]').onclick=()=>{if(scene?.activeCamera)scene.activeCamera.alpha-=.35};shell.querySelector('[data-act="right"]').onclick=()=>{if(scene?.activeCamera)scene.activeCamera.alpha+=.35};shell.querySelector('[data-act="reset"]').onclick=()=>{const c=scene?.activeCamera;if(c){c.alpha=-Math.PI/2.10;c.beta=Math.PI/2.30;c.radius=6.35}};shell.querySelector('[data-act="celebrate"]').onclick=()=>{celebrateUntil=performance.now()+1800}}
async function mount(){
  const stage=document.querySelector('#page-avatar.active .avatar-preview-stage')||document.querySelector('#page-avatar .avatar-preview-stage');if(!stage)return;
  if(stage.querySelector('.v384-avatar3d-shell'))return;
  destroy();const shell=document.createElement('div');shell.className='v384-avatar3d-shell v392-avatar3d-shell';shell.innerHTML='<div class="v384-avatar3d-loading"><div><b>Đang dựng Avatar 3D…</b><span>Soft 3D • ánh sáng ấm • biểu cảm tự nhiên • xoay 360°</span></div></div><canvas class="v384-avatar3d-canvas" aria-label="Nhân vật 3D Math12 Hub "></canvas>';stage.appendChild(shell);controls(shell);
  try{await loadBabylon();if(!document.body.contains(shell))return;canvas=shell.querySelector('canvas');engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true,adaptToDeviceRatio:true});try{if(window.Math12Platform?.perf?.lowPower?.())engine.setHardwareScalingLevel(Math.max(1.35,window.devicePixelRatio||1));}catch(_){}createScene();try{window.dispatchEvent(new CustomEvent('math12hub:avatar3d-ready',{detail:{scene,root,engine,build:BUILD}}))}catch(_){}engine.runRenderLoop(()=>scene?.render());const resize=()=>engine?.resize();window.addEventListener('resize',resize);shell._v384Resize=resize;requestAnimationFrame(()=>engine?.resize());setTimeout(()=>shell.querySelector('.v384-avatar3d-loading')?.remove(),180)}catch(err){console.warn(' 3D fallback',err);shell.innerHTML='<div class="v384-webgl-fallback">3D chưa sẵn sàng • đang dùng avatar 2D an toàn</div>';setTimeout(()=>shell.remove(),2600)}
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
