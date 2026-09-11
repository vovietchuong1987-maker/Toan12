/* =========================================================
   Math12 Hub  — Avatar 3D Visual Upgrade
   Upgrades the existing  procedural foundation without changing
   student data schemas: expressive chibi proportions, richer face,
   real cosmetic geometry, natural idle/blink, 360° orbit and fallback.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.16.0-avatar-renderer-production';
const CDN='https://cdn.babylonjs.com/babylon.js';
let engine=null,scene=null,root=null,canvas=null,rafMount=0,loadPromise=null,celebrateUntil=0,parts={},previewItem=null,renderLoop=null;

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
  const n=String(name||'').toLowerCase(),base=hex(color,'#ffffff');
  m.environmentIntensity=.74;m.useRadianceOverAlpha=true;
  let profile='neutral';
  try{
    if(/(^skin$|leg-skin|inner-ear|nose)/.test(n)){
      profile='skin';m.metallic=0;m.roughness=.68;m.ambientColor=base.scale(.10);
      if('specularIntensity' in m)m.specularIntensity=.72;
      if(m.subSurface){m.subSurface.isTranslucencyEnabled=true;m.subSurface.translucencyIntensity=.105;m.subSurface.tintColor=base;m.subSurface.minimumThickness=.12;m.subSurface.maximumThickness=.52}
      if(m.sheen){m.sheen.isEnabled=true;m.sheen.intensity=.035;m.sheen.color=hex(toneHex(color,1.05,.01))}
    }else if(/hair/.test(n)){
      profile='hair';m.metallic=.005;m.roughness=n.includes('highlight')?.44:.56;
      if('specularIntensity' in m)m.specularIntensity=.62;
      if(m.sheen){m.sheen.isEnabled=true;m.sheen.intensity=n.includes('highlight')?.22:.135;m.sheen.color=hex(toneHex(color,1.14,.015))}
      if(m.clearCoat){m.clearCoat.isEnabled=false}
    }else if(/(^eye$|^iris$|^white$|pupil|eye-highlight|lens|glasses|visor)/.test(n)){
      profile='eye';m.metallic=0;m.roughness=n.includes('pupil')?.16:.24;
      if(m.clearCoat){m.clearCoat.isEnabled=true;m.clearCoat.intensity=.54;m.clearCoat.roughness=.14}
    }else if(/(top|bottom|garment|uniform|sleeve|hood|jacket|lapel|polo|sport|sweater|robe|skirt|short|trouser|jogger|pant|vest|collar|cuff|pocket|pleat)/.test(n)){
      profile='fabric';m.metallic=0;m.roughness=.86;
      if('specularIntensity' in m)m.specularIntensity=.42;
      if(m.sheen){m.sheen.isEnabled=true;m.sheen.intensity=.060;m.sheen.color=hex(toneHex(color,1.07,.01))}
      if(m.clearCoat){m.clearCoat.isEnabled=false}
    }else if(/(shoe|boot|hightop|runner|sole|lace)/.test(n)){
      profile=n.includes('sole')?'rubber':'sneaker';m.metallic=0;m.roughness=n.includes('sole')?.84:.60;
      if('specularIntensity' in m)m.specularIntensity=n.includes('sole')?.36:.54;
      if(m.clearCoat){m.clearCoat.isEnabled=true;m.clearCoat.intensity=n.includes('sole')?.035:.10;m.clearCoat.roughness=.36}
    }else if(/(gem|orb|crown|staff|compass|button|phi|signature|crest)/.test(n)){
      profile='accent';m.metallic=Math.max(.24,m.metallic||0);m.roughness=Math.min(.42,m.roughness||1);
      if(m.clearCoat){m.clearCoat.isEnabled=true;m.clearCoat.intensity=.28;m.clearCoat.roughness=.20}
    }
    m.metadata={...(m.metadata||{}),math12SurfaceProfile:profile,materialPolish:'40.15.8'};
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
function avatar(){return window.AvatarEngine?.get?.()||window.AvatarEngine?.base?.()||window.avatarV378Current?.()||window.avatarV378Stored?.()||{gender:'male',skin:'warm',face:'smile',hair:'short',outfit:'school-blue'}}
function outfit(a){return AVATAR_V378_OUTFITS?.find?.(x=>x.id===a.outfit)||[{top:'#EAF2FF',accent:'#315BC7',bottom:'#27364E'}][0]}
function skinColor(a){return AVATAR_V378_SKINS?.[a.skin]?.fill||({light:'#F4C7A1',warm:'#E6AD7B',tan:'#B97850'}[a.skin]||'#E6AD7B')}
function disposeModel(){if(root){try{root.dispose(false,true)}catch(_){}root=null}parts={}}
function makeNode(name,parent=root){const n=new BABYLON.TransformNode(name,scene);n.parent=parent;return n}
function normalizeStyle(style,fallback='classic'){return String(style||fallback).toLowerCase().replace(/[^a-z0-9-]/g,'')}
function toneHex(value,mul=1,lift=0){const c=hex(value,'#263248'),clamp=v=>Math.max(0,Math.min(1,v));return new BABYLON.Color3(clamp(c.r*mul+lift),clamp(c.g*mul+lift),clamp(c.b*mul+lift)).toHexString()}
function isLowPower(){try{return !!window.Math12Platform?.perf?.lowPower?.()}catch(_){return false}}

function faceShapeProfile(style='soft'){
  const key=normalizeStyle(style,'soft');
  return ({
    round:{x:.995,y:1.015,z:.955},
    oval:{x:.925,y:1.105,z:.925},
    angular:{x:.955,y:1.030,z:.930},
    soft:{x:.965,y:1.060,z:.945}
  })[key]||{x:.965,y:1.060,z:.945};
}
function eyeStyleProfile(style='classic'){
  const key=normalizeStyle(style,'classic');
  return ({
    almond:{sx:.88,sy:.90,iris:.132,pupil:.069,lid:.205,tilt:.055},
    bright:{sx:.86,sy:1.13,iris:.151,pupil:.076,lid:.215,tilt:.018},
    soft:{sx:.84,sy:1.00,iris:.141,pupil:.071,lid:.198,tilt:.025},
    sharp:{sx:.91,sy:.82,iris:.126,pupil:.067,lid:.222,tilt:.095},
    classic:{sx:.80,sy:1.06,iris:.137,pupil:.072,lid:.205,tilt:.035}
  })[key]||{sx:.80,sy:1.06,iris:.137,pupil:.072,lid:.205,tilt:.035};
}
function browStyleProfile(style='natural'){
  const key=normalizeStyle(style,'natural');
  return ({
    straight:{len:.245,r:.019,baseTilt:.018,y:3.022},
    soft:{len:.230,r:.017,baseTilt:.055,y:3.030},
    bold:{len:.255,r:.026,baseTilt:.060,y:3.026},
    arc:{len:.238,r:.019,baseTilt:.115,y:3.035},
    natural:{len:.235,r:.020,baseTilt:.075,y:3.025}
  })[key]||{len:.235,r:.020,baseTilt:.075,y:3.025};
}
function mouthPoints(style='soft-smile',legacy='smile'){
  const key=normalizeStyle(style,'soft-smile');
  if(key==='natural')return [{x:-.100,y:2.520,z:-.674},{x:0,y:2.510,z:-.681},{x:.100,y:2.520,z:-.674}];
  if(key==='calm')return [{x:-.105,y:2.525,z:-.672},{x:0,y:2.507,z:-.682},{x:.105,y:2.525,z:-.672}];
  if(key==='confident')return [{x:-.115,y:2.532,z:-.671},{x:-.025,y:2.505,z:-.683},{x:.075,y:2.512,z:-.679},{x:.125,y:2.542,z:-.670}];
  if(key==='small')return [{x:-.078,y:2.523,z:-.674},{x:0,y:2.506,z:-.681},{x:.078,y:2.523,z:-.674}];
  if(legacy==='focus')return [{x:-.090,y:2.505,z:-.674},{x:0,y:2.512,z:-.680},{x:.090,y:2.505,z:-.674}];
  return [{x:-.125,y:2.545,z:-.670},{x:-.065,y:2.505,z:-.682},{x:0,y:2.492,z:-.687},{x:.065,y:2.505,z:-.682},{x:.125,y:2.545,z:-.670}];
}
function buildFace(a,mSkin,mEye,mIris,mWhite,mAccent,parent=root){
  const face=makeNode('face-group',parent);parts.face=face;
  const expression=normalizeStyle(a.face||'smile');
  const eyeProfile=eyeStyleProfile(a.eyeStyle||a.eyes||'classic');
  const browProfile=browStyleProfile(a.browStyle||'natural');

  // v40.15.5 — expressive face polish:
  // keep the same saved Face 2.0 choices, but render them with softer eye framing,
  // subtler cheeks and a more readable lower-lid / mouth silhouette.
  face.metadata={facePolish:'expressive-face-v1',version:'40.15.5'};

  const innerEar=mat('inner-ear','#C98270',.88);
  for(const [i,x] of [-.655,.655].entries()){
    sphere('ear-'+i,.30,{x,y:2.79,z:-.005},mSkin,{x:.60,y:1,z:.72},face);
    sphere('ear-fold-'+i,.135,{x:x+(i?-.006:.006),y:2.79,z:-.105},innerEar,{x:.48,y:.78,z:.22},face,18);
  }

  const cheekMat=transparentMat('cheek','#E98B87',.095);
  parts.cheeks=[];
  for(const [i,x] of [-.36,.36].entries()){
    const cheek=makeNode('cheek-pivot-'+i,face);cheek.position.set(x,2.59,-.654);
    sphere('cheek-'+i,.18,{x:0,y:0,z:0},cheekMat,{x:1.34,y:.46,z:.09},cheek,18);
    cheek.metadata={side:i?'R':'L',baseSoftness:.095};parts.cheeks.push(cheek);
  }

  const socketMat=transparentMat('eye-socket','#6A483F',.050);
  const lidMat=mat('eyelid-line','#3A2D2B',.84);
  const lowerLidMat=transparentMat('lower-lid-line','#8B5E55',.19);
  parts.eyes=[];parts.gaze=[];parts.irises=[];parts.eyelids=[];parts.lowerLids=[];
  for(const [i,x] of [-.232,.232].entries()){
    sphere('eye-socket-'+i,.282,{x,y:2.835,z:-.647},socketMat,{x:eyeProfile.sx*1.08,y:eyeProfile.sy*.99,z:.095},face);
    const eye=makeNode('eye-group-'+i,face);eye.position.set(x,2.835,-.650);
    eye.metadata={baseScaleY:1,side:i?'R':'L',eyeStyle:a.eyeStyle||a.eyes||'classic'};
    sphere('eye-white-'+i,.250,{x:0,y:0,z:0},mWhite,{x:eyeProfile.sx*.99,y:eyeProfile.sy*.99,z:.14},eye);

    const gaze=makeNode('eye-gaze-'+i,eye);parts.gaze.push(gaze);
    const iris=sphere('iris-'+i,eyeProfile.iris,{x:0,y:-.008,z:-.034},mIris,{x:.90,y:1,z:.12},gaze);parts.irises.push(iris);
    const rimMat=transparentMat('iris-rim-'+i,'#15141A',.24);
    torus('iris-rim-mesh-'+i,eyeProfile.iris*1.66,.010,{x:0,y:-.008,z:-.049},rimMat,gaze).rotation.x=Math.PI/2;
    sphere('pupil-'+i,eyeProfile.pupil,{x:0,y:-.008,z:-.052},mEye,{x:.84,y:1,z:.10},gaze);

    const hi=mat('eye-highlight-'+i,'#ffffff',.10,0,'#ffffff');
    sphere('eye-hi-main-'+i,.032,{x:-.024,y:.032,z:-.063},hi,{x:1,y:1,z:.07},gaze,18);
    if(a.eyeStyle!=='sharp')sphere('eye-hi-soft-'+i,.013,{x:.021,y:-.019,z:-.064},hi,{x:1,y:1,z:.07},gaze,14);

    const lid=capsule('upper-lid-'+i,eyeProfile.lid,.0115,{x:0,y:.111,z:-.010},lidMat,eye);
    lid.rotation.z=Math.PI/2+(i?-eyeProfile.tilt:eyeProfile.tilt);parts.eyelids.push(lid);

    const lowerPivot=makeNode('lower-lid-pivot-'+i,eye);
    lowerPivot.position.set(0,-.112,-.010);
    const lower=capsule('lower-lid-'+i,eyeProfile.lid*.68,.0065,{x:0,y:0,z:0},lowerLidMat,lowerPivot);
    lower.rotation.z=Math.PI/2+(i?eyeProfile.tilt*.28:-eyeProfile.tilt*.28);
    lowerPivot.metadata={side:i?'R':'L'};parts.lowerLids.push(lowerPivot);

    if(a.gender==='female'){
      const lash=capsule('lash-'+i,.070,.0095,{x:i?.110:-.110,y:.088,z:-.012},lidMat,eye);
      lash.rotation.z=Math.PI/2+(i?-.30:.30);
    }
    parts.eyes.push(eye);
  }

  const brow=mat('brow','#382B2A',.86);parts.eyebrows=[];
  const focus=expression==='focus',confident=expression==='confident';
  for(const [i,x] of [-.232,.232].entries()){
    const pivot=makeNode('brow-pivot-'+i,face);pivot.position.set(x,browProfile.y,-.650);
    const tilt=focus?(i?-.15:.15):confident?(i?-.035:.12):(i?-browProfile.baseTilt:browProfile.baseTilt);
    const b=capsule('brow-'+i,browProfile.len*.97,browProfile.r*.92,{x:0,y:confident&&i===0?.016:0,z:0},brow,pivot);
    b.rotation.z=Math.PI/2+tilt;
    pivot.metadata={baseTilt:tilt,side:i?'R':'L',browStyle:a.browStyle||'natural'};parts.eyebrows.push(pivot);
  }

  const noseShadow=transparentMat('nose-shadow','#9A5F4D',.105);
  sphere('nose-shadow',.074,{x:.010,y:2.668,z:-.671},noseShadow,{x:.68,y:.82,z:.30},face,18);
  sphere('nose',.058,{x:-.005,y:2.681,z:-.680},mSkin,{x:.62,y:.78,z:.26},face,18);

  const mouthMat=mat('mouth','#7E4748',.78);
  const lipLight=transparentMat('lip-light','#F3A5A0',.18);
  const mouth=makeNode('mouth-group',face),mouthOrigin={x:0,y:2.520,z:-.680};
  mouth.position.set(mouthOrigin.x,mouthOrigin.y,mouthOrigin.z);parts.mouth=mouth;
  mouth.metadata={mouthStyle:a.mouthStyle||'soft-smile',baseY:mouthOrigin.y,facePolish:'40.15.5'};
  const points=mouthPoints(a.mouthStyle||'soft-smile',expression).map(p=>({x:p.x-mouthOrigin.x,y:p.y-mouthOrigin.y,z:p.z-mouthOrigin.z}));
  tube('mouth',points,.0125+(a.mouthStyle==='confident'?.0015:0),mouthMat,mouth);
  sphere('lower-lip-sheen',.070,{x:0,y:-.020,z:-.011},lipLight,{x:1.16,y:.13,z:.08},mouth,16);
  if((a.mouthStyle||'soft-smile')==='soft-smile'&&expression!=='focus'){
    sphere('smile-light',.068,{x:0,y:2.493-mouthOrigin.y,z:-.690-mouthOrigin.z},lipLight,{x:1.24,y:.14,z:.08},mouth,16);
  }
}

function buildHair(a,hairMat,parent=root,headItem=null){
  const style=normalizeStyle(a.hair||'short'),group=makeNode('hair-group',parent),hatSafe=!!headItem;
  const baseHex=hairMat.albedoColor?.toHexString?.()||'#263248';
  const shadowMat=mat('hair-shadow',toneHex(baseHex,.68),.68),highlightMat=mat('hair-highlight',toneHex(baseHex,1.16,.018),.43);
  const sheenMat=transparentMat('hair-sheen',toneHex(baseHex,1.18,.026),.20);
  const modules={back:makeNode('hairBack',group),base:makeNode('hairBase',group),side:makeNode('hairSides',group),top:makeNode('hairTop',group),front:makeNode('hairFront',group),detail:makeNode('hairHighlights',group)};
  parts.hair=group;parts.hairModules=modules;group.metadata={style,hatSafe,layered:true,naturalHairV40153:true};
  const blob=(name,x,y,z,sx,sy,sz,material=hairMat,parentNode=modules.front)=>sphere(name,.40,{x,y,z},material,{x:sx,y:sy,z:sz},parentNode);
  const strand=(name,x,y,z,len=.35,width=.085,angle=0,material=hairMat,parentNode=modules.front)=>{const s=capsule(name,len,width,{x,y,z},material,parentNode);s.rotation.z=angle;s.scaling.z=.72;return s};
  // v40.15.3: tapered locks replace the old uniformly thick "plastic rods" in
  // the visible fringe.  The wider root + narrower tip reads more like hair.
  const taper=(name,x,y,z,len=.30,width=.075,angle=0,material=hairMat,parentNode=modules.front)=>{const s=cyl(name,len,width*1.55,width*.48,{x,y,z},material,parentNode,16);s.rotation.z=angle;s.scaling.z=.72;return s};
  const curl=(name,x,y,z,size=.24,material=hairMat,parentNode=modules.side)=>sphere(name,size,{x,y,z},material,{x:1,y:.92,z:.86},parentNode,18);
  const lowPower=isLowPower();
  // Keep the cap on the upper skull and slightly in front of the skin.  Step 4
  // adds only a small amount of crown lift so the hairstyle is no longer flat.
  const cap=(y=3.32,sy=.35,z=-.02)=>sphere('hair-cap',1.32,{x:0,y,z},hairMat,{x:1.01,y:hatSafe?Math.min(sy,.27):sy,z:.96},modules.base);
  const softPart=(x,y,len,angle,parentNode=modules.front)=>strand('hair-part-'+x+'-'+y,x,y,-.552,len,.016,angle,sheenMat,parentNode);
  const crownLift=()=>{
    if(hatSafe||lowPower||['crew','buzz','curly','curls','mohawk','spiky','spike','undercut','fade','messy','wavy','bun','topbun'].includes(style))return;
    blob('crown-air-left',-.25,3.40,-.005,.80,.48,.70,hairMat,modules.top);
    blob('crown-air-center',.01,3.44,-.015,.92,.55,.74,hairMat,modules.top);
    blob('crown-air-right',.27,3.38,.005,.76,.44,.68,hairMat,modules.top);
  };
  const faceWisps=()=>{
    if(lowPower||['crew','buzz','undercut','fade'].includes(style))return;
    taper('face-wisp-left',-.43,2.98,-.505,.30,.052,.16,shadowMat,modules.front);
    taper('face-wisp-right',.43,2.98,-.505,.30,.052,-.16,shadowMat,modules.front);
  };

  if(['crew','buzz'].includes(style)){
    sphere('crew-cap',1.29,{x:0,y:3.27,z:-.025},hairMat,{x:1.00,y:hatSafe?.25:.30,z:.96},modules.base);
    if(!hatSafe)for(let i=0;i<7;i++)curl('crew-texture-'+i,-.39+i*.13,3.19+(i%2)*.035,-.485,.085,i%2?highlightMat:shadowMat,modules.detail);
  }else if(!['undercut','fade'].includes(style))cap();

  if(['side','sidesweep'].includes(style)){
    taper('side-sweep-a',-.15,3.19,-.548,.38,.105,-.64,hairMat);
    taper('side-sweep-b',.18,3.16,-.550,.31,.095,-.47,hairMat);
    strand('side-temple',.49,2.89,-.39,.37,.11,-.05,shadowMat,modules.side);
    softPart(-.18,3.205,.29,-.60);
  }else if(style==='layered'){
    for(const [i,x] of [-.38,-.20,0,.20,.38].entries())taper('layered-front-'+i,x,3.16+(i%2)*.025,-.55,.23+(i%3)*.025,.075,(i-2)*-.14,hairMat);
    for(const x of [-.51,.51])strand('layered-side-'+x,x,2.76,-.22,.62,.145,x<0?.08:-.08,shadowMat,modules.side);
    softPart(-.12,3.20,.25,-.18);
  }else if(['spiky','spike','mohawk'].includes(style)){
    for(const [i,x] of [-.36,-.22,-.07,.09,.24,.37].entries())strand('spiky-fringe-'+i,x,3.15+(i%2)*.025,-.55,.21,.065,(i-2.5)*-.12,hairMat);
    if(!hatSafe)for(const [i,x] of [-.38,-.23,-.07,.10,.26,.40].entries()){
      const tuft=cone('soft-tuft-'+i,.34+(i%2)*.055,.20,{x,y:3.36+(i%3)*.025,z:.03},i%3===0?highlightMat:hairMat,modules.top);tuft.rotation.z=(i-2.5)*-.13;
    }
  }else if(['bob','roundbob'].includes(style)){
    sphere('bob-back',1.30,{x:0,y:2.72,z:.20},shadowMat,{x:1.035,y:1.02,z:.82},modules.back);
    for(const x of [-.52,.52]){strand('bob-side-'+x,x,2.63,-.16,.78,.175,x<0?.035:-.035,hairMat,modules.side);curl('bob-tip-'+x,x,2.27,-.15,.30,hairMat,modules.side)}
    for(const [i,x] of [-.29,-.10,.10,.29].entries())taper('bob-fringe-'+i,x,3.15,-.55,.22,.072,(i-1.5)*-.12,hairMat);
    softPart(-.16,3.17,.22,-.16);
  }else if(['pony','ponytail','highpony'].includes(style)){
    taper('pony-sweep-a',-.15,3.19,-.55,.34,.098,-.56,hairMat);
    taper('pony-sweep-b',.18,3.16,-.55,.28,.088,-.42,hairMat);
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
    for(const [i,x] of [-.28,-.09,.10,.29].entries())taper('long-fringe-'+i,x,3.15,-.55,.22,.072,(i-1.5)*-.10,hairMat);
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
    for(const [i,x] of [-.27,-.09,.09,.27].entries())taper('twin-fringe-'+i,x,3.15,-.55,.22,.070,(i-1.5)*-.10,hairMat);
  }else if(['bun','topbun'].includes(style)){
    const bunY=hatSafe?2.78:3.48,bunZ=hatSafe?.61:.18;
    sphere('bun-shadow',.62,{x:0,y:bunY,z:bunZ+.025},shadowMat,{x:1,y:.88,z:1},modules.back);
    sphere('bun-main',.52,{x:-.02,y:bunY+.02,z:bunZ-.015},hairMat,{x:1,y:.88,z:1},modules.back);
    strand('bun-sweep',-.12,3.18,-.55,.32,.095,-.52,hairMat);
    softPart(-.17,3.18,.23,-.50);
  }else if(['braid','braids'].includes(style)){
    for(const [j,x] of [-.54,.54].entries()){
      for(let k=0;k<6;k++)curl('braid-'+j+'-'+k,x+(j?.025:-.025)*k,2.62-k*.18,.01,.245-k*.012,k%2?shadowMat:hairMat,modules.side);
      curl('braid-tie-'+j,x+(j?.13:-.13),1.55,.01,.14,highlightMat,modules.side);
    }
    for(const [i,x] of [-.27,-.09,.09,.27].entries())taper('braid-fringe-'+i,x,3.15,-.55,.22,.070,(i-1.5)*-.11,hairMat);
  }else if(['messy','wavy'].includes(style)){
    for(const [i,x] of [-.39,-.24,-.08,.09,.25,.39].entries())taper('messy-front-'+i,x,3.16+(i%2)*.028,-.54,.23+(i%3)*.025,.072,(i-2.5)*-.18,i===1||i===4?highlightMat:hairMat);
    if(!hatSafe)for(const [i,x] of [-.30,-.10,.12,.31].entries())blob('messy-volume-'+i,x,3.28+(i%2)*.06,-.04,.72,.52,.68,i===2?highlightMat:hairMat,modules.top);
    for(const x of [-.50,.50])strand('wavy-side-'+x,x,2.77,-.20,.55,.13,x<0?.12:-.12,shadowMat,modules.side);
  }else if(!['crew','buzz'].includes(style)){
    blob('classic-fringe-left',-.21,3.15,-.555,.90,.31,.29,hairMat,modules.front);
    blob('classic-fringe-right',.18,3.16,-.555,.84,.30,.29,hairMat,modules.front);
    taper('classic-lock-left',-.27,3.08,-.575,.25,.060,.20,hairMat,modules.front);
    taper('classic-lock-center',-.02,3.11,-.584,.23,.054,-.04,hairMat,modules.front);
    taper('classic-lock-right',.23,3.09,-.575,.24,.058,-.18,hairMat,modules.front);
    strand('classic-part',-.015,3.21,-.575,.20,.018,-.08,sheenMat,modules.detail);
    for(const x of [-.50,.50])blob('classic-temple-'+x,x,3.00,-.34,.50,.80,.50,shadowMat,modules.side);
  }

  // v40.15.3 Step 4 — Natural Hair Polish.
  // A light crown layer breaks the flat helmet silhouette, while two tiny face
  // wisps soften the transition around the cheeks.  Both are skipped on low-
  // power devices (and where hats/fades would conflict) to protect mobile FPS.
  crownLift();
  faceWisps();
  if(!hatSafe&&!['crew','buzz','curly','curls'].includes(style)){
    softPart(-.22,3.22,.21,-.16,modules.detail);softPart(.03,3.25,.19,.03,modules.detail);softPart(.24,3.20,.18,.16,modules.detail);
    if(!lowPower){
      strand('soft-sheen-left',-.15,3.31,-.506,.20,.012,-.22,sheenMat,modules.detail);
      strand('soft-sheen-right',.16,3.30,-.500,.18,.011,.20,sheenMat,modules.detail);
    }
  }
  return group;
}

function buildMath12Signature(parent,mAccent,pos={x:.27,y:1.67,z:-.365},scale=.92){
  // v40.15.4 Step 5 — Math12 Signature System.
  // A tiny fixed-brand crest makes the avatar recognizable even when students
  // completely change outfit colors. Geometry only: no texture/font/network cost.
  const logo=makeNode('math12-signature-crest',parent);logo.position.set(pos.x,pos.y,pos.z);logo.scaling.set(scale,scale,scale);
  const navy=mat('math12-brand-navy','#172033',.58,.06),indigo=mat('math12-brand-indigo','#7B92FF',.46,.04),mint=mat('math12-brand-mint','#51D4B4',.48,.03),white=mat('math12-brand-white','#F8FAFC',.82,0);
  const plate=cyl('math12-crest-plate',.028,.29,.29,{x:0,y:0,z:.002},navy,logo,28);plate.rotation.x=Math.PI/2;
  const orbit=torus('math12-orbit',.205,.015,{x:0,y:0,z:-.026},mint,logo);orbit.rotation.x=Math.PI/2;orbit.scaling.y=.78;
  // Stylised sigma/∑, matching the Math12 Hub navigation mark.
  box('math12-sigma-top',{x:.112,y:.020,z:.018},{x:-.014,y:.052,z:-.043},white,logo);
  const diag=box('math12-sigma-diag',{x:.128,y:.020,z:.018},{x:-.006,y:0,z:-.044},white,logo);diag.rotation.z=-.58;
  box('math12-sigma-bottom',{x:.112,y:.020,z:.018},{x:-.014,y:-.052,z:-.043},white,logo);
  sphere('math12-orbit-node',.034,{x:.090,y:.060,z:-.046},indigo,{x:1,y:1,z:.45},logo,12);
  const accent=box('math12-accent-tick',{x:.040,y:.013,z:.014},{x:.070,y:-.067,z:-.044},mAccent,logo);accent.rotation.z=.18;
  logo.metadata={brand:'Math12 Hub',signature:'sum-orbit',version:'40.15.4'};
  parts.identity=logo;
  return logo;
}
function buildPhiLogo(parent,mAccent,pos={x:.27,y:1.67,z:-.365},scale=.92){return buildMath12Signature(parent,mAccent,pos,scale)}

function buildMath12SleeveTag(arm,side,style){
  // One small left-sleeve tab is enough to create a recurring brand cue without
  // re-introducing the decorative clutter removed in Step 3.
  if(side!=='L'||['robe','cape-top'].includes(style))return null;
  const grp=makeNode('math12-sleeve-signature',arm);
  const navy=mat('math12-sleeve-navy','#172033',.72,0),mint=mat('math12-sleeve-mint','#51D4B4',.60,.01),indigo=mat('math12-sleeve-indigo','#7B92FF',.58,.01);
  const base=box('math12-sleeve-tag-base',{x:.070,y:.125,z:.022},{x:-.150,y:-.255,z:-.115},navy,grp);base.rotation.z=-.03;
  box('math12-sleeve-tag-mint',{x:.055,y:.025,z:.010},{x:-.150,y:-.225,z:-.128},mint,grp);
  box('math12-sleeve-tag-indigo',{x:.055,y:.025,z:.010},{x:-.150,y:-.285,z:-.128},indigo,grp);
  grp.metadata={brand:'Math12 Hub',signature:'sleeve-tab',version:'40.15.4'};
  return grp;
}

function buildTorso(a,g,mTop,mAccent,mSkin){
  const style=normalizeStyle(g.top?.topStyle||g.top?.style||'shirt');
  const grp=makeNode('torso-group');parts.bodyGroup=grp;
  const isUniform=['shirt','uniform','school','classic',''].includes(style);
  const mWhite=mat('garment-white','#F8FAFC',.88),baseHex=mTop.albedoColor?.toHexString?.()||'#EAF2FF';
  const mLight=mat('garment-light',toneHex(baseHex,1.12,.025),.80),mDark=mat('garment-shadow',toneHex(baseHex,.72),.84);
  const garment=makeNode('garment-layers',grp);parts.garment=garment;
  const torso=capsule('torso',1.48,.405,{x:0,y:1.55,z:0},mTop,garment);torso.scaling.set(a.gender==='female'?.96:1.00,1,.76);parts.body=torso;
  const chest=sphere('soft-chest',.84,{x:0,y:1.94,z:0},mTop,{x:a.gender==='female'?.98:1.04,y:.40,z:.74},garment);parts.chest=chest;
  sphere('soft-waist',.70,{x:0,y:.91,z:.01},mTop,{x:a.gender==='female'?.96:1.00,y:.31,z:.73},garment);
  const neck=capsule('neck',.30,.135,{x:0,y:2.32,z:0},mSkin,grp);neck.scaling.z=.92;
  const hem=torus('garment-hem',.72,.035,{x:0,y:.88,z:.01},style==='robe'?mAccent:mDark,garment);hem.scaling.z=.78;
  if(isUniform){
    // v40.15.2 Step 3 — Clean garment language.
    // Keep the recognizable school collar + Math12 mark, but remove the old
    // double side panels, twin waist pockets and extra trim that made the shirt noisy.
    for(const x of [-.295,.295])sphere('uniform-shoulder-'+x,.42,{x,y:1.95,z:-.01},mWhite,{x:.66,y:.42,z:.63},garment);
    const colL=box('uniform-collar-l',{x:.245,y:.18,z:.040},{x:-.112,y:2.07,z:-.344},mWhite,garment);colL.rotation.z=.52;
    const colR=box('uniform-collar-r',{x:.245,y:.18,z:.040},{x:.112,y:2.07,z:-.344},mWhite,garment);colR.rotation.z=-.52;
    capsule('uniform-placket',.36,.011,{x:0,y:1.86,z:-.363},mDark,garment);
    for(let i=0;i<2;i++)sphere('uniform-button-'+i,.030,{x:0,y:1.94-i*.145,z:-.380},mAccent,{x:1,y:1,z:.22},garment,12);
    buildPhiLogo(garment,mAccent,{x:.27,y:1.69,z:-.374},.86);
  }else if(style==='hoodie'){
    const hood=torus('hood',.71,.095,{x:0,y:2.04,z:.12},mDark,garment);hood.rotation.x=Math.PI/2;hood.scaling.y=.92;
    // Short, low-contrast drawcords: enough to read as a hoodie without looking strapped-on.
    for(const x of [-.065,.065])capsule('hood-lace-'+x,.20,.008,{x,y:1.88,z:-.362},mDark,garment);
    sphere('hoodie-pocket',.54,{x:0,y:1.12,z:-.334},mDark,{x:1.04,y:.30,z:.13},garment);
    buildPhiLogo(garment,mAccent,{x:.25,y:1.70,z:-.372},.82);
  }else if(style==='jacket'||style==='blazer'||style==='varsity'){
    // One clean front seam instead of zipper + 3 buttons + 2 accent pockets.
    box('jacket-left',{x:.37,y:1.10,z:.052},{x:-.202,y:1.48,z:-.345},style==='blazer'?mDark:mTop,garment);
    box('jacket-right',{x:.37,y:1.10,z:.052},{x:.202,y:1.48,z:-.345},mTop,garment);
    if(style==='blazer'){
      const lapelL=box('lapel-l',{x:.22,y:.43,z:.038},{x:-.115,y:1.91,z:-.382},mLight,garment);lapelL.rotation.z=-.38;
      const lapelR=box('lapel-r',{x:.22,y:.43,z:.038},{x:.115,y:1.91,z:-.382},mLight,garment);lapelR.rotation.z=.38;
      for(let i=0;i<2;i++)sphere('jacket-button-'+i,.033,{x:.065,y:1.60-i*.20,z:-.410},mDark,{x:1,y:1,z:.22},garment,12);
    }else{
      const collar=torus('jacket-collar',.49,.040,{x:0,y:2.06,z:-.07},mDark,garment);collar.rotation.x=Math.PI/2;
    }
    box('jacket-line',{x:.020,y:.88,z:.038},{x:0,y:1.46,z:-.382},mDark,garment);
    buildPhiLogo(garment,mAccent,{x:.275,y:1.73,z:-.408},.68);
  }else if(style==='robe'||style==='cape-top'){
    const robe=cyl('robe',1.50,.82,1.17,{x:0,y:1.30,z:.09},mTop,garment,36);robe.scaling.z=.80;
    const collar=torus('robe-collar',.61,.075,{x:0,y:2.00,z:-.20},mAccent,garment);collar.rotation.x=Math.PI/2;
    for(const x of [-.32,.32])capsule('robe-edge-'+x,1.08,.025,{x,y:1.37,z:-.405},mAccent,garment);
    box('robe-sash',{x:.82,y:.09,z:.055},{x:0,y:.92,z:-.352},mAccent,garment);
    buildPhiLogo(garment,mAccent,{x:0,y:1.58,z:-.425},.96);
  }else if(style==='polo'){
    const col1=box('polo-collar-l',{x:.24,y:.19,z:.040},{x:-.115,y:2.04,z:-.350},mAccent,garment);col1.rotation.z=.50;
    const col2=box('polo-collar-r',{x:.24,y:.19,z:.040},{x:.115,y:2.04,z:-.350},mAccent,garment);col2.rotation.z=-.50;
    capsule('polo-placket',.27,.011,{x:0,y:1.91,z:-.370},mDark,garment);
    sphere('polo-button',.030,{x:0,y:1.98,z:-.389},mAccent,{x:1,y:1,z:.22},garment,12);
    buildPhiLogo(garment,mAccent,{x:.275,y:1.67,z:-.373},.75);
  }else if(style==='jersey'||style==='sport'){
    const neckRing=torus('sport-neck',.49,.036,{x:0,y:2.07,z:-.08},mAccent,garment);neckRing.rotation.x=Math.PI/2;
    // Single restrained chest band replaces two long vertical racing stripes.
    box('sport-chest-band',{x:.62,y:.042,z:.038},{x:0,y:1.55,z:-.372},mLight,garment);
    buildPhiLogo(garment,mAccent,{x:0,y:1.77,z:-.390},.96);
  }else if(style==='sweater'){
    const neckRing=torus('sweater-neck',.52,.052,{x:0,y:2.07,z:-.07},mAccent,garment);neckRing.rotation.x=Math.PI/2;
    const rib=torus('sweater-rib',.72,.042,{x:0,y:.91,z:.01},mDark,garment);rib.scaling.z=.78;
    // Flat knit body: texture is implied by material/shading rather than decorative cords.
    buildPhiLogo(garment,mAccent,{x:.27,y:1.70,z:-.378},.78);
  }
  return {style,isUniform,grp};
}
function buildArm(side,mTop,mAccent,mSkin,style){
  const sx=side==='L'?-1:1;const arm=makeNode('armGroup'+side);arm.position.set(sx*.425,1.94,0);parts[side==='L'?'leftArm':'rightArm']=arm;
  const uniform=['shirt','uniform','school','classic',''].includes(style),longSleeve=['hoodie','jacket','blazer','varsity','sweater','robe','cape-top'].includes(style);
  const sleeveMat=uniform?mat('uniform-sleeve-'+side,'#F8FAFC',.90):mTop;
  const sleeveLen=longSleeve?.52:.40;
  sphere('shoulder'+side,.285,{x:sx*.010,y:-.02,z:0},sleeveMat,{x:.84,y:.90,z:.83},arm);
  const upper=capsule('upperArm'+side,sleeveLen,.125,{x:sx*.055,y:-.25,z:0},sleeveMat,arm);upper.rotation.z=sx*-.095;
  sphere('elbow'+side,.218,{x:sx*.100,y:-.52,z:0},longSleeve?sleeveMat:mSkin,{x:.93,y:1,z:.90},arm);
  const fore=capsule('forearm'+side,.56,.102,{x:sx*.115,y:-.77,z:0},longSleeve?sleeveMat:mSkin,arm);fore.rotation.z=sx*-.020;
  // v40.15.2: cuffs follow the garment instead of adding another accent ring on every top.
  const cuffY=longSleeve?-1.01:-.46,cuffMat=(style==='robe'||style==='cape-top'||style==='sport'||style==='jersey')?mAccent:sleeveMat;
  const cuff=torus('sleeve-cuff'+side,.208,.018,{x:sx*(longSleeve?.125:.10),y:cuffY,z:0},cuffMat,arm);cuff.scaling.z=.86;
  sphere('wrist'+side,.158,{x:sx*.125,y:-1.045,z:0},mSkin,{x:.90,y:1,z:.88},arm);
  sphere('hand'+side,.215,{x:sx*.130,y:-1.17,z:-.015},mSkin,{x:.80,y:1.05,z:.70},arm);
  sphere('thumb'+side,.094,{x:sx*.212,y:-1.15,z:-.068},mSkin,{x:.70,y:.98,z:.72},arm,16);
  buildMath12SleeveTag(arm,side,style);
  arm.rotation.z=sx*.050;return arm;
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
  sphere('pelvis',.77,{x:0,y:.78,z:.02},mBottom,{x:1.01,y:.41,z:.74},root);
  for(const [idx,x] of [-.205,.205].entries()){
    const side=idx?'R':'L';
    // v40.15: real hip + knee transform pivots.  The visual geometry remains
    // procedural, but poses can now bend at the anatomical joints instead of
    // rotating a whole leg mesh around its centre.
    const hip=makeNode('hipPivot'+side);hip.position.set(x,.78,0);parts['leg'+side]=hip;
    const thigh=capsule('thigh'+side,.67,.165,{x:0,y:-.30,z:0},legMat,hip);thigh.scaling.z=.96;
    if(!short)capsule('pant-thigh-crease'+side,.48,.009,{x:0,y:-.30,z:-.145},pantSeam,hip);
    const knee=makeNode('kneePivot'+side,hip);knee.position.set(0,-.65,-.005);parts['knee'+side]=knee;
    sphere('knee'+side,.255,{x:0,y:0,z:0},legMat,{x:.94,y:1,z:.90},knee);
    const calf=capsule('calf'+side,.64,.138,{x:0,y:-.29,z:.02},legMat,knee);calf.scaling.set(.94,1,.92);
    if(!short)capsule('pant-calf-crease'+side,.50,.008,{x:0,y:-.28,z:-.13},pantSeam,knee);
    if(bottomStyle==='jogger'){const cuff=torus('jogger-cuff'+side,.29,.035,{x:0,y:-.56,z:.02},mAccent,knee);cuff.scaling.z=.94}
    // v40.15.1 Steps 1+2: lower-profile footwear.  The old spherical foot/toe
    // silhouette read like a paw.  Keep every wardrobe shoeStyle compatible,
    // but build the shoe from a slim heel/upper/toe + flat sole stack.
    const shoeBase=(prefix,upperMat=mShoe,accentMat=shoeLight,depth=.62)=>{
      const heel=sphere(prefix+'-heel'+side,.33,{x:0,y:-.665,z:.015},upperMat,{x:.92,y:.54,z:.72},knee,20);
      const upper=sphere(prefix+'-upper'+side,.37,{x:0,y:-.665,z:-.205},upperMat,{x:.94,y:.43,z:1.25},knee,22);
      const toe=sphere(prefix+'-toe'+side,.29,{x:0,y:-.675,z:-.445},accentMat,{x:1.03,y:.37,z:.82},knee,20);
      const mid=box(prefix+'-midsole'+side,{x:.35,y:.055,z:depth},{x:0,y:-.755,z:-.225},sole,knee);
      const out=box(prefix+'-outsole'+side,{x:.36,y:.040,z:depth+.025},{x:0,y:-.802,z:-.225},shoeDark,knee);
      [heel,upper,toe,mid,out].forEach(m=>{m.isPickable=false});
      return {heel,upper,toe,mid,out};
    };
    if(shoeStyle==='boot'){
      capsule('boot-shaft'+side,.43,.155,{x:0,y:-.49,z:.025},mShoe,knee).scaling.z=.90;
      shoeBase('boot',mShoe,shoeLight,.60);
      box('boot-cap'+side,{x:.34,y:.045,z:.16},{x:0,y:-.66,z:-.43},shoeLight,knee);
    }else if(shoeStyle==='hightop'){
      const collar=sphere('hightop-collar'+side,.33,{x:0,y:-.525,z:.015},mShoe,{x:.90,y:.78,z:.88},knee,20);
      shoeBase('hightop',mShoe,shoeLight,.62);
      const tongue=box('hightop-tongue'+side,{x:.19,y:.20,z:.030},{x:0,y:-.58,z:-.435},shoeLight,knee);tongue.rotation.x=-.12;
      for(let k=0;k<3;k++)box('hightop-lace-'+side+'-'+k,{x:.18-k*.010,y:.014,z:.020},{x:0,y:-.555-k*.040,z:-.458},mAccent,knee);
      collar.isPickable=false;
    }else{
      const runner=shoeStyle==='runner',school=shoeStyle==='school';
      shoeBase(runner?'runner':school?'school':'sneaker',mShoe,runner?shoeLight:mShoe,runner?.66:.61);
      const tongue=box('shoe-tongue'+side,{x:.18,y:.13,z:.025},{x:0,y:-.605,z:-.425},shoeLight,knee);tongue.rotation.x=-.12;
      if(school){
        const strap=box('school-strap'+side,{x:.27,y:.025,z:.075},{x:0,y:-.615,z:-.335},shoeLight,knee);strap.rotation.x=-.08;
      }else{
        for(let k=0;k<3;k++)box('lace-'+side+'-'+k,{x:.18-k*.012,y:.013,z:.020},{x:0,y:-.595-k*.032,z:-.455},shoeStyle==='sneaker'?mAccent:shoeDark,knee);
      }
      if(runner){
        const stripe=box('runner-stripe'+side,{x:.24,y:.028,z:.032},{x:idx?.145:-.145,y:-.675,z:-.325},mAccent,knee);stripe.rotation.y=idx?-.34:.34;
        box('runner-heel-tab'+side,{x:.12,y:.10,z:.022},{x:0,y:-.61,z:.120},mAccent,knee);
      }
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

function buildAvatarCore(){
  const unified=window.AvatarEngine?.resolved?.(),base=unified?.config||unified?.base||avatar(),o=outfit(base),g0=unified?.garment||window.v385Wardrobe?.resolved?.(base)||{},g={...g0};
  if(previewItem&&previewItem.slot){g[previewItem.slot]=previewItem;if(previewItem.slot==='hair'){g.hairStyle=previewItem.hairStyle;g.hairColor=previewItem.hairColor||previewItem.color}}
  const a={...base,hair:g.hairStyle||base.hair,eyeStyle:base.eyeStyle||base.eyes||'classic',browStyle:base.browStyle||'natural',mouthStyle:base.mouthStyle||'soft-smile',irisColor:base.irisColor||'#5A3C2C',faceShape:base.faceShape||'soft'};root=makeNode('avatarRoot',null);root.position.y=-.02;
  const mSkin=mat('skin',skinColor(a),.88),mHair=mat('hair',g.hairColor||'#1F2940',.58),mEye=mat('eye','#17151B',.20),mIris=mat('iris',a.irisColor||'#5A3C2C',.22),mWhite=mat('white','#FDFDFD',.34),mTop=mat('top',g.topColor||g.top?.color||o.top||'#3B7B4B',.78),mAccent=mat('accent',g.accent||g.top?.accent||o.accent||'#D6A721',.56),mBottom=mat('bottom',g.bottomColor||g.bottom?.color||o.bottom||'#204C48',.78),mShoe=mat('shoe',g.shoeColor||g.shoes?.color||'#202631',.56);
  const torsoInfo=buildTorso(a,g,mTop,mAccent,mSkin);
  // A motion pivot at the actual head centre prevents the face from orbiting
  // around the body when it tilts. The inner rig maps legacy coordinates to
  // the smaller Step 1/2 head without breaking hats, glasses or hairstyles.
  const headMotion=makeNode('head-motion');headMotion.position.set(0,2.94,-.0172);parts.head=headMotion;
  const headRig=makeNode('head-rig',headMotion);headRig.position.set(0,-2.4252,.0172);headRig.scaling.set(.82,.82,.82);
  const fs=faceShapeProfile(a.faceShape);const genderShape=a.gender==='female'?{x:.985,y:1.015,z:.995}:{x:1.015,y:.995,z:1.005};const headShape={x:fs.x*genderShape.x,y:fs.y*genderShape.y,z:fs.z*genderShape.z};
  sphere('head',1.36,{x:0,y:2.82,z:-.02},mSkin,headShape,headRig);
  buildFace(a,mSkin,mEye,mIris,mWhite,mAccent,headRig);buildHair(a,mHair,headRig,g.head);
  buildArm('L',mTop,mAccent,mSkin,torsoInfo.style);buildArm('R',mTop,mAccent,mSkin,torsoInfo.style);
  const bottomStyle=buildBottom(a,g,mBottom,mAccent);buildLegs(bottomStyle,mBottom,mShoe,mAccent,g);
  buildAvatarAO();
  buildHeadgear(g,headRig);buildGlasses(g,headRig);
  if(g.back)buildBack(g);else buildBack({back:{backStyle:'backpack',color:g.accent||'#416B48',accent:'#294B33'}});
  buildHandTool(g);
  root.metadata={...(root.metadata||{}),brandIdentity:'math12-signature-v1',brandIdentityVersion:'40.15.4',facePolish:'expressive-face-v1',facePolishVersion:'40.15.5'};
  try{root.getChildMeshes().forEach(x=>{x.receiveShadows=true;x.isPickable=false})}catch(_){ }
  return {root,parts,appearance:a,garment:g};
}
function buildAvatar(){disposeModel();return buildAvatarCore()}
function applyFactoryPose(model,pose='stand'){
  const p=model?.parts||{},r=model?.root;if(!r)return false;
  // Pose only touches reusable pivots. Motion 2.0 blends between these baselines,
  // so Studio and Room can share the same body language without rebuilding geometry.
  if(p.head){p.head.rotation.x=0;p.head.rotation.y=0;p.head.rotation.z=0}
  if(p.leftArm){p.leftArm.rotation.x=0;p.leftArm.rotation.y=0;p.leftArm.rotation.z=-.065}
  if(p.rightArm){p.rightArm.rotation.x=0;p.rightArm.rotation.y=0;p.rightArm.rotation.z=.065}
  if(p.legL){p.legL.rotation.x=0;p.legL.rotation.y=0;p.legL.rotation.z=0}
  if(p.legR){p.legR.rotation.x=0;p.legR.rotation.y=0;p.legR.rotation.z=0}
  if(p.kneeL){p.kneeL.rotation.x=0;p.kneeL.rotation.y=0;p.kneeL.rotation.z=0}
  if(p.kneeR){p.kneeR.rotation.x=0;p.kneeR.rotation.y=0;p.kneeR.rotation.z=0}
  const key=normalizeStyle(pose,'stand');
  if(key==='study'||key==='desk'||key==='sit-study'){
    if(p.head){p.head.rotation.x=.070;p.head.rotation.y=-.018}
    if(p.leftArm){p.leftArm.rotation.x=-.76;p.leftArm.rotation.z=.105}
    if(p.rightArm){p.rightArm.rotation.x=-.76;p.rightArm.rotation.z=-.105}
    if(p.legL)p.legL.rotation.x=.055;
    if(p.legR)p.legR.rotation.x=.055;
  }else if(key==='focus'){
    if(p.head)p.head.rotation.x=.042;
    if(p.leftArm)p.leftArm.rotation.x=-.08;
    if(p.rightArm)p.rightArm.rotation.x=-.08;
  }else if(key==='seated'||key==='seated-relax'||key==='chair'){
    if(p.head){p.head.rotation.x=-.020;p.head.rotation.y=.028;p.head.rotation.z=.025}
    if(p.leftArm){p.leftArm.rotation.x=-.10;p.leftArm.rotation.z=-.20}
    if(p.rightArm){p.rightArm.rotation.x=-.10;p.rightArm.rotation.z=.20}
    if(p.legL){p.legL.rotation.x=1.17;p.legL.rotation.z=-.035}
    if(p.legR){p.legR.rotation.x=1.17;p.legR.rotation.z=.035}
    if(p.kneeL)p.kneeL.rotation.x=-1.14;
    if(p.kneeR)p.kneeR.rotation.x=-1.14;
  }else if(key==='relax'){
    if(p.head){p.head.rotation.x=-.025;p.head.rotation.y=.025;p.head.rotation.z=.030}
    if(p.leftArm){p.leftArm.rotation.x=.055;p.leftArm.rotation.z=-.17}
    if(p.rightArm){p.rightArm.rotation.x=.055;p.rightArm.rotation.z=.17}
    if(p.legL)p.legL.rotation.z=-.018;
    if(p.legR)p.legR.rotation.z=.018;
  }else if(key==='window'||key==='look-window'){
    if(p.head){p.head.rotation.x=-.012;p.head.rotation.y=.235;p.head.rotation.z=-.018}
    if(p.leftArm)p.leftArm.rotation.z=-.12;
    if(p.rightArm)p.rightArm.rotation.z=.12;
  }
  model.pose=key;return true;
}
function createAvatarModel(targetScene,options={}){
  if(!targetScene||!window.BABYLON)throw new Error('Avatar model factory requires a Babylon scene');
  const prevScene=scene,prevRoot=root,prevParts=parts,prevPreview=previewItem;
  try{
    scene=targetScene;root=null;parts={};previewItem=options.previewItem||null;
    const built=buildAvatarCore(),modelRoot=built.root,modelParts=built.parts;
    if(options.name)modelRoot.name=String(options.name);
    const pos=options.position||{};modelRoot.position.set(Number(pos.x)||0,Number(pos.y??-.02),Number(pos.z)||0);
    const scale=options.scaling??options.scale??1;
    if(typeof scale==='number')modelRoot.scaling.set(scale,scale,scale);else modelRoot.scaling.set(Number(scale.x)||1,Number(scale.y)||1,Number(scale.z)||1);
    if(Number.isFinite(options.rotationY))modelRoot.rotation.y=options.rotationY;
    modelRoot.metadata={...(modelRoot.metadata||{}),math12AvatarRenderer:true,rendererBuild:BUILD,context:String(options.context||'external'),avatarRevision:Number(window.AvatarEngine?.get?.().revision)||0};
    const model={root:modelRoot,parts:modelParts,scene:targetScene,build:BUILD,context:String(options.context||'external'),appearance:built.appearance,garment:built.garment,pose:'stand'};
    model.setPose=value=>applyFactoryPose(model,value);
    model.dispose=()=>{
      const mats=new Set();
      try{modelRoot.getChildMeshes().forEach(mesh=>{if(mesh.material)mats.add(mesh.material)})}catch(_){ }
      try{modelRoot.dispose(false)}catch(_){ }
      for(const material of mats)try{material.dispose(false,true)}catch(_){ }
      model.root=null;model.parts={};
    };
    if(options.pose)model.setPose(options.pose);
    return model;
  }finally{
    scene=prevScene;root=prevRoot;parts=prevParts;previewItem=prevPreview;
  }
}
function createScene(){
  const lowPower=isLowPower(),perf=window.Math12AvatarRoomPremium?.performanceProfile?.()||{lowPower,mobile:false,hardwareScaling:lowPower?1.55:1};scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.965,.965,.975,1);scene.environmentIntensity=.78;scene.ambientColor=new BABYLON.Color3(.13,.14,.18);
  try{
    const ip=scene.imageProcessingConfiguration;ip.toneMappingEnabled=true;ip.toneMappingType=BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;ip.exposure=1.035;ip.contrast=1.055;ip.colorCurvesEnabled=true;ip.vignetteEnabled=true;ip.vignetteWeight=1.15;ip.vignetteStretch=.35;ip.vignetteColor=new BABYLON.Color4(.88,.90,.95,1);ip.vignetteBlendMode=BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
  }catch(_){ }
  const cam=new BABYLON.ArcRotateCamera('cam',-Math.PI/2.10,Math.PI/2.30,6.25,new BABYLON.Vector3(0,1.52,0),scene);cam.lowerRadiusLimit=4.7;cam.upperRadiusLimit=7.8;cam.lowerBetaLimit=.90;cam.upperBetaLimit=1.60;cam.wheelPrecision=78;cam.panningSensibility=0;cam.inertia=.80;cam.attachControl(canvas,true);
  const hemi=new BABYLON.HemisphericLight('ambient-soft',new BABYLON.Vector3(.12,1,-.28),scene);hemi.intensity=.78;hemi.diffuse=new BABYLON.Color3(1,.96,.92);hemi.groundColor=new BABYLON.Color3(.43,.49,.61);
  const key=new BABYLON.DirectionalLight('key-warm',new BABYLON.Vector3(-.42,-1,.48),scene);key.position.set(4.8,7.4,-5.8);key.diffuse=new BABYLON.Color3(1,.88,.74);key.specular=new BABYLON.Color3(1,.90,.80);key.intensity=1.16;
  const fill=new BABYLON.PointLight('fill-cool',new BABYLON.Vector3(-3.4,3.6,-3.1),scene);fill.diffuse=new BABYLON.Color3(.65,.79,1);fill.specular=new BABYLON.Color3(.48,.66,.92);fill.intensity=.38;fill.radius=3.2;
  const faceFill=new BABYLON.PointLight('face-softbox',new BABYLON.Vector3(.15,3.25,-3.8),scene);faceFill.diffuse=new BABYLON.Color3(1,.91,.82);faceFill.specular=new BABYLON.Color3(.92,.86,.80);faceFill.intensity=.32;faceFill.radius=2.8;
  const rim=new BABYLON.PointLight('rim-soft',new BABYLON.Vector3(3.2,3.6,2.9),scene);rim.diffuse=new BABYLON.Color3(.72,.82,1);rim.specular=new BABYLON.Color3(.74,.84,1);rim.intensity=.34;rim.radius=2.4;
  let shadow=null;try{shadow=new BABYLON.ShadowGenerator(lowPower?1024:2048,key);shadow.useBlurExponentialShadowMap=true;shadow.blurKernel=lowPower?20:36;shadow.bias=.00055;shadow.normalBias=.018;shadow.setDarkness(.20)}catch(_){ }
  const groundMat=mat('ground','#E8E9ED',.98),ground=BABYLON.MeshBuilder.CreateDisc('ground',{radius:2.35,tessellation:72},scene);ground.rotation.x=Math.PI/2;ground.position.y=-.66;ground.material=groundMat;ground.receiveShadows=true;
  const haloMat=transparentMat('halo','#F2C980',.075),halo=BABYLON.MeshBuilder.CreateDisc('warm-halo',{radius:1.68,tessellation:64},scene);halo.rotation.x=Math.PI/2;halo.position.set(-.35,-.651,.16);halo.material=haloMat;
  const contactMat=transparentMat('contact-shadow','#182033',.14);contactMat.unlit=true;contactMat.disableLighting=true;const contact=BABYLON.MeshBuilder.CreateDisc('contact-shadow-disc',{radius:.78,tessellation:64},scene);contact.rotation.x=Math.PI/2;contact.scaling.set(.90,1,.52);contact.position.set(0,-.647,-.02);contact.material=contactMat;
  buildAvatar();try{root.getChildMeshes().forEach(m=>{if(!String(m.name||'').startsWith('ao-'))shadow?.addShadowCaster(m)})}catch(_){ }
  try{const pipeline=new BABYLON.DefaultRenderingPipeline('avatar-soft3d-pipeline',true,scene,[cam]);pipeline.samples=lowPower?1:2;pipeline.fxaaEnabled=true;pipeline.bloomEnabled=!lowPower&&!perf.mobile;pipeline.bloomWeight=.032;pipeline.bloomThreshold=.91;pipeline.bloomKernel=48}catch(_){ }
  if(!window.AvatarMotion?.managed)scene.onBeforeRenderObservable.add(()=>{
    if(!root)return;const now=performance.now(),t=now/1000,c=now<celebrateUntil;
    root.position.y=-.02+(c?Math.abs(Math.sin(t*7))*.14:Math.sin(t*1.8)*.018);
    root.rotation.y=c?Math.sin(t*8)*.10:Math.sin(t*.48)*.015;
    if(parts.head){parts.head.rotation.z=c?Math.sin(t*8)*.05:Math.sin(t*.68)*.014;parts.head.rotation.y=Math.sin(t*.46)*.022}
    if(parts.leftArm&&parts.rightArm){if(c){parts.leftArm.rotation.z=-2.0+Math.sin(t*10)*.12;parts.rightArm.rotation.z=2.0-Math.sin(t*10)*.12}else{parts.leftArm.rotation.z=-.12+Math.sin(t*1.45)*.022;parts.rightArm.rotation.z=.12-Math.sin(t*1.45)*.022}}
    const phase=now%4300;const blink=(phase<145)||(phase>340&&phase<410);const sy=blink?.09:1;for(const eye of parts.eyes||[])eye.scaling.y+=(sy-eye.scaling.y)*.44;
  });return scene;
}
function stopRender(){if(engine&&renderLoop)try{engine.stopRenderLoop(renderLoop)}catch(_){}}
function startRender(){if(engine&&renderLoop&&!document.hidden)try{engine.runRenderLoop(renderLoop)}catch(_){}}
function handleVisibility(){if(document.hidden)stopRender();else startRender()}
function destroy(){if(rafMount)cancelAnimationFrame(rafMount);rafMount=0;stopRender();renderLoop=null;try{scene?.dispose()}catch(_){}try{engine?.dispose()}catch(_){}scene=null;engine=null;root=null;canvas=null;parts={}}
function controls(shell){shell.insertAdjacentHTML('beforeend',`<div class="v384-avatar3d-badge">∑ MATH12 • LIVE</div><div class="v392-quality-chip"></div><div class="v384-avatar3d-controls"><button type="button" data-act="left" title="Xoay trái">↶</button><button type="button" data-act="reset" title="Góc nhìn mặc định">◎</button><button type="button" data-act="celebrate" title="Ăn mừng">✦</button><button type="button" data-act="right" title="Xoay phải">↷</button></div>`);shell.querySelector('[data-act="left"]').onclick=()=>{if(scene?.activeCamera)scene.activeCamera.alpha-=.35};shell.querySelector('[data-act="right"]').onclick=()=>{if(scene?.activeCamera)scene.activeCamera.alpha+=.35};shell.querySelector('[data-act="reset"]').onclick=()=>{const c=scene?.activeCamera;if(c){c.alpha=-Math.PI/2.10;c.beta=Math.PI/2.30;c.radius=6.35}};shell.querySelector('[data-act="celebrate"]').onclick=()=>{if(window.AvatarMotion?.celebrate)return window.AvatarMotion.celebrate();celebrateUntil=performance.now()+1800}}
async function mount(){
  const stage=document.querySelector('#page-avatar.active .avatar-preview-stage')||document.querySelector('#page-avatar .avatar-preview-stage');if(!stage)return;
  if(stage.querySelector('.v384-avatar3d-shell'))return;
  destroy();const shell=document.createElement('div');shell.className='v384-avatar3d-shell v392-avatar3d-shell';shell.innerHTML='<div class="v384-avatar3d-loading"><div><b>Đang dựng Avatar 3D…</b><span>Soft 3D • ánh sáng ấm • biểu cảm tự nhiên • xoay 360°</span></div></div><canvas class="v384-avatar3d-canvas" aria-label="Nhân vật 3D Math12 Hub "></canvas>';stage.appendChild(shell);controls(shell);
  try{await loadBabylon();if(!document.body.contains(shell))return;canvas=shell.querySelector('canvas');engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true,adaptToDeviceRatio:true});try{const perf=window.Math12AvatarRoomPremium?.performanceProfile?.()||{};if(perf.hardwareScaling>1)engine.setHardwareScalingLevel(Math.max(perf.hardwareScaling,1));}catch(_){}createScene();try{window.dispatchEvent(new CustomEvent('math12hub:avatar3d-ready',{detail:{scene,root,parts,engine,build:BUILD}}))}catch(_){}renderLoop=()=>scene?.render();startRender();const resize=()=>engine?.resize();window.addEventListener('resize',resize);shell._v384Resize=resize;requestAnimationFrame(()=>engine?.resize());setTimeout(()=>shell.querySelector('.v384-avatar3d-loading')?.remove(),180)}catch(err){console.warn(' 3D fallback',err);shell.innerHTML='<div class="v384-webgl-fallback">3D chưa sẵn sàng • đang dùng avatar 2D an toàn</div>';setTimeout(()=>shell.remove(),2600)}
}
function remountSoon(){clearTimeout(remountSoon.t);remountSoon.t=setTimeout(()=>{const old=document.querySelector('.v384-avatar3d-shell');if(old?._v384Resize)window.removeEventListener('resize',old._v384Resize);destroy();mount()},45)}
function install(){
  if(!install._visibility){install._visibility=true;document.addEventListener('visibilitychange',handleVisibility)}
  if(typeof window.avatarV378RenderPage==='function'&&!window.avatarV378RenderPage.__v384){const base=window.avatarV378RenderPage;const wrap=function(){const r=base.apply(this,arguments);requestAnimationFrame(remountSoon);return r};wrap.__v384=true;window.avatarV378RenderPage=wrap}
  if(typeof window.goPage==='function'&&!window.goPage.__v384){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='avatar')requestAnimationFrame(remountSoon);else destroy();return r};wrap.__v384=true;window.goPage=wrap}
  window.addEventListener('math12hub:avatar-changed',remountSoon);window.addEventListener('math12hub:avatar-state-changed',remountSoon);if(document.getElementById('page-avatar')?.classList.contains('active'))remountSoon();
}
window.v384Avatar3D={build:BUILD,mount:remountSoon,rebuild:remountSoon,sync:remountSoon,setPose(value){return applyFactoryPose({root,parts,pose:'stand'},value)},celebrate(){if(window.AvatarMotion?.celebrate)return window.AvatarMotion.celebrate();celebrateUntil=performance.now()+1800},destroy,getScene:()=>scene,getRoot:()=>root,getParts:()=>parts,getEngine:()=>engine,createAvatarModel,applyFactoryPose,preview(it){if(window.AvatarEngine)return window.AvatarEngine.preview(it);previewItem=it||null;remountSoon()},clearPreview(){if(window.AvatarEngine)return window.AvatarEngine.clearPreview();previewItem=null;remountSoon()}};
window.v392Avatar3D=window.v384Avatar3D;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();


/* =========================================================
   Math12 Hub — Unified Avatar Renderer v40.14.3
   Stable facade over the procedural Avatar 3D core.
   Studio and Math Room now use the exact same model builder.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.16.0-unified-avatar-renderer',VERSION=40155;
const instances=new Set();
function core(){return window.v384Avatar3D||window.v392Avatar3D||null}
function available(){return typeof core()?.createAvatarModel==='function'}
function create(scene,options={}){
  if(!available())throw new Error('Unified Avatar renderer core is not ready');
  const model=core().createAvatarModel(scene,options);
  instances.add(model);
  const dispose=model.dispose?.bind(model);
  model.setExpression=(value,detail={})=>window.AvatarEmotion?.applyToParts?.(model.parts,value,{...detail,context:String(options.context||model.context||'external')})??false;
  model.dispose=()=>{instances.delete(model);return dispose?.()};
  return model;
}
function setPose(model,pose){return model?.setPose?.(pose)??core()?.applyFactoryPose?.(model,pose)??false}
function setExpression(model,value,detail={}){return model?.setExpression?.(value,detail)??window.AvatarEmotion?.applyToParts?.(model?.parts||null,value,detail)??false}
function dispose(model){if(!model)return false;try{model.dispose?.();return true}catch(err){console.warn('[UnifiedAvatarRenderer] dispose',err);return false}}
function status(){return {build:BUILD,version:VERSION,available:available(),instances:instances.size,studioUsesSameCore:!!core()?.getRoot}}
const API={build:BUILD,version:VERSION,available,create,setPose,setExpression,dispose,status};
window.Math12AvatarRenderer=API;
window.AvatarRenderer=API;
try{window.Math12Events?.emit?.('avatar:renderer-ready',status(),{source:'avatar-unified-renderer'})}catch(_){ }
try{window.dispatchEvent(new CustomEvent('math12hub:avatar-renderer-ready',{detail:status()}))}catch(_){ }
})();


/* =========================================================
   Math12 Hub — Avatar Renderer Compatibility Bridge v40.14.3
   Registers the existing Studio renderer into the shared runtime.
   Room registers itself from math-room-v40.15.9.js.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.16.0-avatar-renderer-bridge',VERSION=40150;
let unregister=null;
function registerStudio(){
  const bridge=window.AvatarRendererBridge,studio=window.v384Avatar3D;
  if(!bridge||!studio||bridge.has('studio'))return false;
  unregister=bridge.register('studio',{
    isMounted:()=>!!studio.getScene?.()&&!!studio.getRoot?.(),
    getScene:()=>studio.getScene?.()||null,
    getRoot:()=>studio.getRoot?.()||null,
    getParts:()=>studio.getParts?.()||null,
    // AvatarEngine v40.1 still owns Studio refresh in this compatibility step.
    // autoSync=false prevents a duplicate rebuild while we migrate gradually.
    applyAppearance:()=>true,
    setExpression:(value,detail={})=>window.AvatarEmotion?.applyToParts?.(studio.getParts?.(),value,{...detail,context:'studio'})??false,
    setPose:(value)=>studio.setPose?.(value)??false,
    refresh:()=>studio.rebuild?.(),
    destroy:()=>studio.destroy?.()
  },{autoSync:false});
  return true;
}
function install(){
  registerStudio();
  window.addEventListener('math12hub:avatar3d-ready',registerStudio);
  window.addEventListener('math12hub:avatar-runtime-ready',registerStudio);
  let tries=0;const timer=setInterval(()=>{tries++;if(registerStudio()||tries>=20)clearInterval(timer)},250);
}
window.AvatarRendererCompat={build:BUILD,version:VERSION,registerStudio,status:()=>({registered:!!window.AvatarRendererBridge?.has?.('studio'),unifiedFactory:!!window.Math12AvatarRenderer?.available?.()})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
