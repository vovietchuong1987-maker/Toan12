/* =========================================================
   Math12 Hub — My Math Room / Soft 3D Premium Visual
   Keeps the V39 data schema and shop/progress integration intact.
   ========================================================= */
(function(){
'use strict';
const BUILD='math-room-soft3d-premium',SCHEMA=400,CDN='https://cdn.babylonjs.com/babylon.js';
let engine=null,scene=null,canvas=null,loadPromise=null,renderObs=null,shadowGen=null;
const uid=()=>firebaseUser?.uid||'local';
const themes=[
 {id:'classroom',label:'Góc học tập',color:'#DDE8F8',free:true,wall:'#F2F1F3',floor:'#ECEBED',wood:'#B78961',accent:'#527CC9',board:'#24453B'},
 {id:'library',label:'Thư viện học giả',color:'#E8D6BA',requires:'bg-v391-2',wall:'#F2E9DE',floor:'#DED0BE',wood:'#8B6346',accent:'#9A6A34',board:'#31443B'},
 {id:'space',label:'Không gian Oxyz',color:'#273A68',requires:'bg-v391-6',wall:'#202D4C',floor:'#26385D',wood:'#756B70',accent:'#7897FF',board:'#17233B'},
 {id:'champion',label:'Phòng Champion',color:'#F2D274',requires:'bg-v391-10',wall:'#FFF4D8',floor:'#EFE5C9',wood:'#B3814B',accent:'#C89718',board:'#28463A'}
];
function blank(){return {schemaVersion:SCHEMA,ownerUid:uid(),theme:'classroom',night:false,updatedAt:''}}
function bucket(){state.roomV390ByUser=state.roomV390ByUser&&typeof state.roomV390ByUser==='object'?state.roomV390ByUser:{};return state.roomV390ByUser}
function profile(){const r=bucket()[uid()]||blank();return {...blank(),...r,ownerUid:uid(),theme:themes.some(t=>t.id===r.theme)?r.theme:'classroom',night:!!r.night}}
function unlockedTheme(t){return !!t.free||!!window.v386MegaShop?.owned?.(t.requires)}
function persist(p){p={...p,schemaVersion:SCHEMA,ownerUid:uid(),updatedAt:new Date().toISOString()};bucket()[uid()]=p;try{window.save?.({sync:false,reason:'room-soft3d'})}catch(_){};if(firebaseUser&&firebaseDb&&!firebaseAccountLocked)firebaseDb.collection('users').doc(firebaseUser.uid).set({roomV390:p,updatedAt:firebaseServerTimestamp()},{merge:true}).catch(e=>console.warn('room sync',e));return p}
function stats(){const ach=window.v388Achievements?.profile?.().unlocked||{},achCount=Object.keys(ach).length,mastered=Number(window.v382Journey?.mastery?.()?.counts?.mastered)||0,lessonPass=Object.keys(window.v379Economy?.profile?.().rewardLedger?.lessonPass||{}).length,level=Number(window.v379Economy?.profile?.().level)||1,books=Math.min(18,Math.max(3,lessonPass+Math.floor(mastered/2))),trophies=Math.min(10,achCount),roomLevel=Math.min(5,1+Math.floor((achCount+mastered/2+level/5)/6));return {achCount,mastered,lessonPass,level,books,trophies,roomLevel}}
function currentTheme(){const p=profile(),t=themes.find(x=>x.id===p.theme)||themes[0];return unlockedTheme(t)?t:themes[0]}
function loadBabylon(){if(window.BABYLON)return Promise.resolve(window.BABYLON);if(loadPromise)return loadPromise;loadPromise=new Promise((res,rej)=>{let s=document.querySelector('script[data-v384-babylon],script[data-v390-babylon]');if(s){s.addEventListener('load',()=>res(window.BABYLON),{once:true});if(window.BABYLON)res(window.BABYLON);return}s=document.createElement('script');s.src=CDN;s.async=true;s.dataset.v390Babylon='1';s.onload=()=>window.BABYLON?res(window.BABYLON):rej(new Error('Babylon unavailable'));s.onerror=()=>rej(new Error('Babylon load failed'));document.head.appendChild(s)});return loadPromise}
function c3(h,f='#ffffff'){try{return BABYLON.Color3.FromHexString(h||f)}catch(_){return BABYLON.Color3.FromHexString(f)}}
function mat(name,color,{rough=.78,metal=.02,emissive=false,alpha=1}={}){const m=new BABYLON.PBRMaterial(name,scene);m.albedoColor=c3(color);m.roughness=rough;m.metallic=metal;m.alpha=alpha;if(emissive)m.emissiveColor=c3(color).scale(.65);if(alpha<1)m.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;return m}
function bx(name,w,h,d,x,y,z,m,parent=null){const q=BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);q.position.set(x,y,z);q.material=m;if(parent)q.parent=parent;return q}
function sp(name,d,x,y,z,m,parent=null,sx=1,sy=1,sz=1,seg=22){const q=BABYLON.MeshBuilder.CreateSphere(name,{diameter:d,segments:seg},scene);q.position.set(x,y,z);q.scaling.set(sx,sy,sz);q.material=m;if(parent)q.parent=parent;return q}
function cy(name,h,d,x,y,z,m,parent=null,tess=28){const q=BABYLON.MeshBuilder.CreateCylinder(name,{height:h,diameter:d,tessellation:tess},scene);q.position.set(x,y,z);q.material=m;if(parent)q.parent=parent;return q}
function cone(name,h,d,x,y,z,m,parent=null){const q=BABYLON.MeshBuilder.CreateCylinder(name,{height:h,diameterTop:0,diameterBottom:d,tessellation:24},scene);q.position.set(x,y,z);q.material=m;if(parent)q.parent=parent;return q}
function tor(name,d,th,x,y,z,m,parent=null){const q=BABYLON.MeshBuilder.CreateTorus(name,{diameter:d,thickness:th,tessellation:36},scene);q.position.set(x,y,z);q.material=m;if(parent)q.parent=parent;return q}
function tube(name,pts,r,m,parent=null){const path=pts.map(p=>new BABYLON.Vector3(p[0],p[1],p[2]));const q=BABYLON.MeshBuilder.CreateTube(name,{path,radius:r,tessellation:14,cap:BABYLON.Mesh.CAP_ALL},scene);q.material=m;if(parent)q.parent=parent;return q}
function caster(mesh){try{shadowGen?.addShadowCaster(mesh)}catch(_){}return mesh}
function groupCaster(root){try{root.getChildMeshes().forEach(m=>{caster(m);m.receiveShadows=true})}catch(_){}return root}

function resolvedAvatar(){const unified=window.AvatarEngine?.resolved?.(),a=unified?.base||window.avatarV378Stored?.()||window.avatarV378Current?.()||{skin:'warm',hair:'short',outfit:'school-blue'},g=unified?.garment||window.v385Wardrobe?.resolved?.(a)||{},out=window.AVATAR_V378_OUTFITS?.find?.(x=>x.id===a.outfit)||{top:'#4E8B59',bottom:'#204C48',accent:'#D6A721'};return {a,g,out}}
function roomAvatar(){
  const {a,g,out}=resolvedAvatar(),root=new BABYLON.TransformNode('roomAvatar',scene);root.position.set(-1.20,.20,.13);root.scaling.set(.78,.78,.78);
  const skin=window.AVATAR_V378_SKINS?.[a.skin]?.fill||'#E8B486',mSkin=mat('raSkin',skin,{rough:.88}),mHair=mat('raHair',g.hairColor||'#20283B',{rough:.58}),mVest=mat('raVest',g.topColor||out.top||'#4E8B59',{rough:.78}),mAccent=mat('raAccent',g.accent||out.accent||'#D4A827',{rough:.55}),mBottom=mat('raBottom',g.bottomColor||out.bottom||'#214C49',{rough:.79}),mShoe=mat('raShoe',g.shoeColor||'#202631',{rough:.58}),mWhite=mat('raWhite','#FBFAF8',{rough:.92}),mEye=mat('raEye','#1B1619',{rough:.34}),mIris=mat('raIris','#4B3429',{rough:.32}),mBlush=mat('raBlush','#F09A97',{rough:.9,alpha:.22});
  sp('raHead',1.18,0,2.38,.02,mSkin,root,1,1.04,.96,28);sp('raEarL',.24,-.58,2.37,.02,mSkin,root,.58,1,.58);sp('raEarR',.24,.58,2.37,.02,mSkin,root,.58,1,.58);
  sp('raHairCap',1.16,0,2.66,.07,mHair,root,1.02,.55,1.02,28);
  const hs=String(g.hairStyle||a.hair||'short').toLowerCase();
  const fringe=(x,y,sx=.66,sy=.35,rz=0)=>{const q=sp('raFringe'+x+y,.38,x,y,-.45,mHair,root,sx,sy,.44,22);q.rotation.z=rz;return q};
  if(/pony/.test(hs)){sp('raPony',.48,.52,2.49,.18,mHair,root,.72,1.35,.72);fringe(-.18,2.76,.92,.34,-.16)}
  else if(/long|flow|bob/.test(hs)){for(const x of [-.45,.45])sp('raLock'+x,.38,x,2.20,.11,mHair,root,.64,1.65,.64);fringe(-.18,2.76,.92,.34,-.14)}
  else if(/spiky/.test(hs)){for(let i=-2;i<=2;i++){const q=cone('raSpike'+i,.42,.20,i*.15,2.99+Math.abs(i)*.02,.04,mHair,root);q.rotation.z=-i*.12}}
  else{fringe(-.23,2.78,.70,.38,-.15);fringe(.20,2.76,.62,.34,.12)}
  for(const [i,x] of [-.21,.21].entries()){
    sp('raEyeWhite'+i,.22,x,2.42,-.545,mWhite,root,.82,1.08,.20);sp('raIris'+i,.115,x,2.414,-.642,mIris,root,.90,1,.16);sp('raPupil'+i,.061,x,2.413,-.663,mEye,root,.85,1,.14);sp('raEyeHi'+i,.027,x-.018,2.445,-.678,mWhite,root,1,1,.08);
  }
  sp('raBlushL',.16,-.35,2.22,-.532,mBlush,root,1.35,.52,.14);sp('raBlushR',.16,.35,2.22,-.532,mBlush,root,1.35,.52,.14);
  sp('raNose',.06,0,2.29,-.585,mSkin,root,.7,.85,.40);tube('raMouth',[[-.10,2.15,-.59],[0,2.10,-.607],[.10,2.15,-.59]],.014,mat('raMouth','#9B4653',{rough:.72}),root);
  const body=cy('raShirt',1.20,.82,0,1.47,.05,mWhite,root);body.scaling.z=.78;const vest=cy('raVestBody',.92,.78,0,1.47,.025,mVest,root);vest.scaling.z=.80;
  tor('raVestNeck',.49,.047,0,1.85,-.35,mAccent,root).rotation.x=Math.PI/2;bx('raTie',.075,.34,.04,0,1.70,-.435,mAccent,root);sp('raBadge',.13,.27,1.57,-.46,mAccent,root,1,1,.18);
  // seated legs
  for(const [i,x] of [-.22,.22].entries()){
    const thigh=cy('raThigh'+i,.62,.22,x,.80,-.03,mBottom,root);thigh.rotation.x=Math.PI/2.25;
    cy('raShin'+i,.68,.20,x,.48,-.31,mBottom,root);const shoe=bx('raShoe'+i,.40,.18,.58,x,.13,-.44,mShoe,root);shoe.rotation.x=-.05;bx('raSole'+i,.43,.06,.61,x,.035,-.45,mWhite,root);
  }
  // arms reaching toward notebook
  for(const [i,x] of [-.50,.50].entries()){
    const upper=cy('raSleeve'+i,.50,.17,x,1.48,-.13,mWhite,root);upper.rotation.x=-.52;upper.rotation.z=x<0?-.16:.16;
    const fore=cy('raFore'+i,.52,.13,x*.88,1.19,-.39,mSkin,root);fore.rotation.x=-.95;fore.rotation.z=x<0?-.08:.08;sp('raHand'+i,.23,x*.80,1.09,-.58,mSkin,root,.9,1,.9);
  }
  if(g.glasses){const gm=mat('raGlass',g.glasses.color||'#334155',{rough:.34,metal:.15});for(const [i,x] of [-.21,.21].entries()){const r=tor('raLens'+i,.31,.028,x,2.42,-.69,gm,root);r.rotation.x=Math.PI/2}bx('raBridge',.14,.022,.02,0,2.42,-.69,gm,root)}
  if(g.head){const hm=mat('raHat',g.head.color||'#315BC7',{rough:.60}),shape=String(g.head.shape||'cap');if(shape==='crown'){cy('raCrown',.23,.68,0,2.99,.03,hm,root,8)}else if(shape==='scholar'){bx('raGradBoard',.78,.07,.78,0,3.00,.03,hm,root);cy('raGradCap',.14,.55,0,2.92,.03,hm,root)}else{sp('raCap',.78,0,2.96,.03,hm,root,1,.28,1)}}
  if(g.back){const bm=mat('raBack',g.back.color||'#426A4A',{rough:.78});bx('raBackpack',.72,.82,.26,0,1.46,.47,bm,root)}
  return groupCaster(root)
}
function roomPet(){const it=window.v387Effects?.equipped?.('pet')||null;if(!it)return null;const root=new BABYLON.TransformNode('roomPet',scene);root.position.set(.55,.2,-.85);root.scaling.set(.70,.70,.70);const main=mat('roomPetMain',it.color||'#E7A86B',{rough:.82}),dark=mat('roomPetDark','#263248',{rough:.52});sp('rpBody',.65,0,.42,0,main,root,1,1.05,.9);sp('rpHead',.52,0,.82,-.03,main,root);for(const x of [-.14,.14]){sp('rpEar'+x,.23,x,1.08,0,main,root,.7,1.2,.6);sp('rpEye'+x,.06,x*.65,.85,-.25,dark,root)}return groupCaster(root)}

function addWindow(t,night){
  const frame=mat('windowFrame','#D6B88A',{rough:.82}),glass=mat('windowGlass',night?'#30456D':'#D9F0FF',{rough:.26,emissive:!night}),blind=mat('windowBlind',t.accent,{rough:.82});
  // left wall window, using Z as width because wall is on x=-4
  bx('windowGlow',.035,1.55,1.75,-3.91,2.23,.18,glass);for(const z of [-.88,.88])bx('wfV',.07,1.75,.07,-3.87,2.23,.18+z,frame);for(const y of [1.38,3.08])bx('wfH',.07,.07,1.82,-3.87,y,.18,frame);bx('windowMidV',.075,1.52,.06,-3.84,2.23,.18,frame);bx('windowMidH',.075,.06,1.65,-3.84,2.22,.18,frame);bx('blind',.08,.22,1.92,-3.80,3.12,.18,blind);
  const pot=cy('windowPot',.22,.24,-3.55,1.43,.18,mat('pot','#F5EFE6',{rough:.9}),null,24);for(let i=0;i<4;i++){const leaf=sp('windowLeaf'+i,.26,-3.55+(i-1.5)*.07,1.64+(i%2)*.09,.18+(i-1.5)*.06,mat('leaf'+i,'#68A853',{rough:.9}),null,.48,1.30,.40);leaf.rotation.z=(i-1.5)*.22}
}
function addBoard(t){
  const wood=mat('boardWood',t.wood,{rough:.83}),boardMat=mat('boardMat',t.board||'#28473F',{rough:.94});bx('boardCore',3.25,1.48,.08,-.52,2.48,2.89,boardMat);bx('boardTop',3.50,.10,.13,-.52,3.26,2.86,wood);bx('boardBottom',3.50,.12,.18,-.52,1.70,2.84,wood);bx('boardLeft',.11,1.62,.14,-2.24,2.48,2.86,wood);bx('boardRight',.11,1.62,.14,1.20,2.48,2.86,wood);
  const plane=BABYLON.MeshBuilder.CreatePlane('boardFormula',{width:2.72,height:.82},scene);plane.position.set(-.52,2.49,2.82);plane.rotation.y=Math.PI;const tex=new BABYLON.DynamicTexture('formulaTex',{width:1400,height:420},scene,true);tex.hasAlpha=true;const ctx=tex.getContext();ctx.clearRect(0,0,1400,420);ctx.fillStyle='#F2F1E8';ctx.font='56px Georgia';ctx.textAlign='center';ctx.fillText('ax² + bx + c = 0',700,150);ctx.font='48px Georgia';ctx.fillText('x = (−b ± √(b² − 4ac)) / 2a',700,270);tex.update();const tm=new BABYLON.StandardMaterial('formulaMat',scene);tm.diffuseTexture=tex;tm.emissiveColor=new BABYLON.Color3(.82,.84,.80);tm.backFaceCulling=false;plane.material=tm;
  bx('chalkWhite',.30,.045,.055,.55,1.78,2.70,mat('chalkW','#F7F5E8',{rough:.95}));bx('chalkBlue',.25,.045,.055,.88,1.78,2.70,mat('chalkB','#78A6E6',{rough:.95}));
}
function addDesk(t){
  const wood=mat('deskWood',t.wood,{rough:.80}),edge=mat('deskEdge',t.id==='space'?'#4D566D':'#C89C72',{rough:.76});
  bx('deskTop',3.05,.16,1.35,-1.05,1.13,-.42,wood);bx('deskLip',3.10,.07,1.40,-1.05,1.04,-.42,edge);for(const x of [-2.28,.18])for(const z of [-.87,.03])bx('deskLeg'+x+z,.13,1.08,.13,x,.54,z,wood);
  // open notebook
  const paper=mat('paper','#FFFDF7',{rough:.96});const left=bx('notebookL',.58,.035,.48,-1.15,1.235,-.74,paper);left.rotation.y=-.08;const right=bx('notebookR',.58,.035,.48,-.57,1.235,-.74,paper);right.rotation.y=.08;bx('notebookSpine',.055,.05,.50,-.86,1.245,-.74,mat('bookSpine','#A64C44',{rough:.80}));for(let i=0;i<4;i++){bx('lineL'+i,.38,.008,.012,-1.15,1.258,-.85+i*.09,mat('inkL'+i,'#D6D2C8',{rough:1}));bx('lineR'+i,.38,.008,.012,-.57,1.258,-.85+i*.09,mat('inkR'+i,'#D6D2C8',{rough:1}))}
  // pencil cup
  const cup=cy('pencilCup',.34,.27,-.07,1.34,-.58,mat('cup','#E9B93E',{rough:.68}),null,32);for(let i=0;i<4;i++){const pencil=cy('pencil'+i,.48,.035,-.16+i*.055,1.65,-.58+(i%2)*.04,mat('pencilM'+i,['#3B78CE','#E46B5A','#47A26B','#D69C35'][i],{rough:.7}),null,16);pencil.rotation.z=(i-1.5)*.06}
  // stack books
  const colors=['#416FC8','#4EA873','#D85E56'];for(let i=0;i<3;i++){const b=bx('deskBook'+i,.72,.12,.48,.25,1.25+i*.13,-.28,mat('deskBookM'+i,colors[i],{rough:.78}));b.rotation.y=(i-1)*.04}
  // desk lamp
  const dark=mat('lampDark','#38445A',{rough:.50,metal:.18});cy('lampBase',.06,.42,-2.02,1.20,-.70,dark);const stem=cy('lampStem',.68,.055,-2.02,1.54,-.70,dark);stem.rotation.z=-.22;const shade=cone('lampShade',.34,.50,-1.87,1.88,-.73,dark);shade.rotation.z=-.30;shade.rotation.x=Math.PI;sp('lampBulb',.13,-1.80,1.75,-.76,mat('lampGlow','#FFD36B',{rough:.35,emissive:true}),null,1,.75,1);
  const lampLight=new BABYLON.PointLight('deskLampLight',new BABYLON.Vector3(-1.80,1.72,-.78),scene);lampLight.diffuse=new BABYLON.Color3(1,.72,.40);lampLight.intensity=.28;lampLight.range=2.3;
  // desk plant
  cy('deskPot',.24,.28,-1.74,1.34,-.34,mat('deskPot','#D6C7A7',{rough:.9}),null,28);for(let i=0;i<5;i++){const leaf=sp('deskLeaf'+i,.27,-1.74+(i-2)*.055,1.55+(i%2)*.12,-.34+(i-2)*.035,mat('deskLeafM'+i,'#6EAD58',{rough:.9}),null,.46,1.35,.38);leaf.rotation.z=(i-2)*.20}
}
function addShelf(t,s){
  const wood=mat('shelfWood',t.wood,{rough:.83});for(let i=0;i<4;i++)bx('shelfBoard'+i,1.90,.11,.52,2.72,.43+i*.70,2.61,wood);for(const x of [1.82,3.62])bx('shelfSide'+x,.13,2.72,.55,x,1.48,2.61,wood);bx('shelfTop',2.05,.12,.58,2.72,3.18,2.61,wood);
  const bookColors=['#4C78C8','#D35B70','#4DAA78','#D8A03D','#745DC6','#398EA2'];const count=Math.min(s.books,12);for(let i=0;i<count;i++){const row=Math.floor(i/6),col=i%6;const b=bx('book'+i,.17,.38,.34,2.04+col*.245,.69+row*.70,2.33,mat('bookM'+i,bookColors[i%bookColors.length],{rough:.82}));b.rotation.z=(i%3-1)*.04}
  const gold=mat('gold','#DDB53A',{rough:.36,metal:.48});const tcount=Math.max(1,Math.min(s.trophies,5));for(let i=0;i<tcount;i++){const x=2.08+i*.32,y=2.15;cy('tStem'+i,.22,.065,x,y,2.34,gold);sp('tCup'+i,.22,x,y+.17,2.34,gold,null,1,.78,1)}
  // hero trophy and medal
  cy('heroStem',.28,.075,3.24,2.82,2.31,gold);sp('heroCup',.34,3.24,3.04,2.31,gold,null,1.22,.86,1);tor('heroHandleL',.29,.035,3.05,3.03,2.31,gold).rotation.y=Math.PI/2;tor('heroHandleR',.29,.035,3.43,3.03,2.31,gold).rotation.y=Math.PI/2;
  // plant top shelf
  cy('shelfPot',.23,.27,2.30,2.86,2.31,mat('shelfPot','#F5F1E9',{rough:.92}),null,28);for(let i=0;i<5;i++){const leaf=sp('shelfLeaf'+i,.28,2.30+(i-2)*.06,3.06+(i%2)*.10,2.31+(i-2)*.035,mat('shelfLeafM'+i,'#69A951',{rough:.9}),null,.46,1.30,.38);leaf.rotation.z=(i-2)*.18}
  // pastel storage boxes
  bx('boxPink',.62,.32,.42,2.25,.24,2.34,mat('boxPinkM','#E8A3AA',{rough:.86}));bx('boxMint',.62,.32,.42,3.12,.24,2.34,mat('boxMintM','#79C5AF',{rough:.86}));
}
function addChairAndRug(t){
  const rug=mat('rug',t.accent,{rough:.94});bx('rug',3.18,.035,2.10,-.82,.02,-.55,rug);const chair=mat('chair','#65728A',{rough:.82}),wood=mat('chairWood',t.wood,{rough:.84});bx('chairSeat',.70,.13,.68,.90,.46,.05,chair);bx('chairBack',.72,.92,.13,.90,.96,.34,chair);for(const x of [.63,1.17])for(const z of [-.18,.27])bx('chairLeg'+x+z,.09,.72,.09,x,.16,z,wood);
}
function addThemeExtras(t){if(t.id==='space'){const starM=mat('star','#A8B8FF',{rough:.35,emissive:true});for(let i=0;i<26;i++)sp('star'+i,.045,-3.6+Math.random()*7.0,.45+Math.random()*3.15,2.80,starM)}if(t.id==='champion'){const banner=bx('banner',1.45,1.00,.055,-2.82,2.38,2.86,mat('bannerM','#E7C251',{rough:.66}));banner.rotation.y=0}}
function buildFurniture(t,s,p){const floor=mat('floor',t.floor,{rough:.97}),wall=mat('wall',t.wall,{rough:.98});const fl=bx('floor',8,.16,6,0,-.08,0,floor);fl.receiveShadows=true;const bw=bx('backWall',8,4,.14,0,1.92,3,wall);bw.receiveShadows=true;const sw=bx('sideWall',.14,4,6,-4,1.92,0,wall);sw.receiveShadows=true;addWindow(t,p.night);addBoard(t);addDesk(t);addShelf(t,s);addChairAndRug(t);addThemeExtras(t)}
function createScene(){
  const p=profile(),t=currentTheme(),s=stats();scene=new BABYLON.Scene(engine);const bg=c3(t.wall);scene.clearColor=new BABYLON.Color4(bg.r,bg.g,bg.b,1);scene.environmentIntensity=.90;
  try{scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=p.night?.82:1.11;scene.imageProcessingConfiguration.contrast=1.035}catch(_){}
  const cam=new BABYLON.ArcRotateCamera('roomCam',-1.36,1.15,9.45,new BABYLON.Vector3(-.15,1.35,.38),scene);cam.lowerRadiusLimit=6.3;cam.upperRadiusLimit=12.4;cam.lowerBetaLimit=.78;cam.upperBetaLimit=1.48;cam.panningSensibility=0;cam.wheelPrecision=52;cam.inertia=.78;cam.attachControl(canvas,true);
  const hemi=new BABYLON.HemisphericLight('roomHemi',new BABYLON.Vector3(.2,1,-.4),scene);hemi.intensity=p.night?.40:.82;hemi.diffuse=p.night?new BABYLON.Color3(.58,.68,.90):new BABYLON.Color3(1,.95,.90);hemi.groundColor=c3(t.accent).scale(.22);
  const key=new BABYLON.DirectionalLight('roomKey',new BABYLON.Vector3(-.55,-1,.58),scene);key.position.set(-2.8,5.8,-4.2);key.diffuse=p.night?new BABYLON.Color3(.55,.66,1):new BABYLON.Color3(1,.88,.72);key.intensity=p.night?.45:1.15;
  const windowLight=new BABYLON.PointLight('windowLight',new BABYLON.Vector3(-3.2,2.55,-.1),scene);windowLight.diffuse=p.night?new BABYLON.Color3(.45,.60,1):new BABYLON.Color3(1,.82,.58);windowLight.intensity=p.night?.18:.62;windowLight.range=6;
  try{shadowGen=new BABYLON.ShadowGenerator(1536,key);shadowGen.useBlurExponentialShadowMap=true;shadowGen.blurKernel=26;shadowGen.bias=.0007}catch(_){shadowGen=null}
  buildFurniture(t,s,p);const av=roomAvatar(),pet=roomPet();
  scene.meshes.forEach(m=>{if(m.name!=='floor'&&m.name!=='backWall'&&m.name!=='sideWall')caster(m)});
  const start=performance.now();renderObs=scene.onBeforeRenderObservable.add(()=>{const z=(performance.now()-start)/1000;if(av){av.position.y=.20+Math.sin(z*1.65)*.010;av.rotation.y=Math.sin(z*.48)*.010}if(pet){pet.position.y=.2+Math.sin(z*3)*.035;pet.rotation.y=Math.sin(z*1.6)*.15}});return scene
}
function destroy(){try{if(scene&&renderObs)scene.onBeforeRenderObservable.remove(renderObs)}catch(_){}renderObs=null;shadowGen=null;try{scene?.dispose()}catch(_){};try{engine?.dispose()}catch(_){};scene=null;engine=null;canvas=null}
function hud(){const stage=document.querySelector('.v390-stage');if(!stage)return;const s=stats(),t=currentTheme();let x=stage.querySelector('.v390-stage-hud');if(!x){x=document.createElement('div');x.className='v390-stage-hud';stage.appendChild(x)}x.innerHTML=`<span>🏠 Lv.${s.roomLevel}</span><span>📚 ${s.books} sách</span><span>🏆 ${s.trophies} thành tích</span><span>${t.label}</span>`}
async function mount(){const stage=document.querySelector('#page-room.active .v390-stage');if(!stage)return;destroy();const c=stage.querySelector('canvas');if(!c)return;canvas=c;stage.querySelector('.v390-loading')?.classList.remove('hidden');try{await loadBabylon();if(!document.body.contains(stage))return;engine=new BABYLON.Engine(canvas,true,{antialias:true,adaptToDeviceRatio:true,preserveDrawingBuffer:false,stencil:true});try{if(window.Math12Platform?.perf?.lowPower?.())engine.setHardwareScalingLevel(Math.max(1.35,window.devicePixelRatio||1))}catch(_){}createScene();engine.runRenderLoop(()=>scene?.render());requestAnimationFrame(()=>engine?.resize());setTimeout(()=>stage.querySelector('.v390-loading')?.remove(),260);hud()}catch(err){console.warn('room fallback',err);stage.innerHTML='<div class="v390-fallback"><div class="v390-fallback-poster"></div><b>Phòng 3D chưa sẵn sàng</b><span>Hệ thống học tập vẫn hoạt động bình thường. Hãy kiểm tra WebGL/kết nối rồi mở lại.</span></div>'}}
function setTheme(id){const t=themes.find(x=>x.id===id);if(!t||!unlockedTheme(t)){window.examToast?.('Cần mở khóa nền tương ứng trong Mega Shop.');return}const p=profile();p.theme=id;persist(p);renderPage();setTimeout(mount,30)}
function toggleNight(){const p=profile();p.night=!p.night;persist(p);renderPage();setTimeout(mount,30)}
function focus(kind){const cam=scene?.activeCamera;if(!cam)return;if(kind==='avatar'){cam.target=new BABYLON.Vector3(-1.20,1.45,-.15);cam.radius=6.15;cam.alpha=-1.48;cam.beta=1.22}else if(kind==='trophy'){cam.target=new BABYLON.Vector3(2.72,1.70,2.42);cam.radius=5.85;cam.alpha=-1.18;cam.beta=1.20}else{cam.target=new BABYLON.Vector3(-.15,1.35,.38);cam.radius=9.45;cam.alpha=-1.36;cam.beta=1.15}}
function renderPage(){const root=document.getElementById('v390RoomPage');if(!root)return;const p=profile(),s=stats(),t=currentTheme();root.innerHTML=`<div class="v390-room-shell"><section class="card v390-stage-card"><div class="v390-stage"><div class="v390-loading"><div><b>Đang dựng góc học tập của em…</b><span>Soft 3D • ánh sáng ấm • Avatar • sách • cúp thành tích</span></div></div><canvas class="v390-canvas" aria-label="Phòng học 3D cá nhân"></canvas><div class="v390-controls"><button onclick="v390Room.focus('room')">⌂ Toàn phòng</button><button onclick="v390Room.focus('avatar')">☺ Nhân vật</button><button onclick="v390Room.focus('trophy')">🏆 Kệ thành tích</button><button onclick="v390Room.toggleNight()">${p.night?'☀ Ban ngày':'☾ Ban đêm'}</button></div></div></section><aside class="v390-side"><div class="v390-hero"><div class="avatar-preview-kicker">MY MATH ROOM</div><h2>Góc học tập của em</h2><p>Không gian học tập mềm mại, ấm áp hơn; sách, cúp và vật phẩm vẫn phản ánh đúng tiến trình học thật của tài khoản.</p><div class="v390-room-level"><strong>Lv.${s.roomLevel}</strong><div><b>${window.avatarV378DisplayName?.()||'Học sinh Math12'}</b><small>Level ${s.level} • ${s.mastered} mã mastered • ${s.achCount} thành tích</small></div></div></div><div class="card v390-panel"><h3>Phong cách căn phòng</h3><p>Đổi theme mà không ảnh hưởng điểm số. Theme nâng cao tiếp tục mở khóa từ Mega Shop.</p><div class="v390-themes">${themes.map(x=>{const ok=unlockedTheme(x),active=t.id===x.id;return `<button class="v390-theme ${active?'active':''} ${ok?'':'locked'}" ${ok?'':'disabled'} onclick="v390Room.setTheme('${x.id}')" style="--theme:${x.color}"><i></i><b>${x.label}</b><small>${x.free?'Có sẵn':ok?'Đã mở khóa':'Cần '+(window.v386MegaShop?.item?.(x.requires)?.label||'vật phẩm nền')}</small><em>${active?'Đang dùng':ok?'Có sẵn':'Khóa'}</em></button>`}).join('')}</div></div><div class="card v390-panel"><h3>Đồ trưng bày theo tiến độ</h3><div class="v390-summary"><div><small>Sách học tập</small><b>${s.books}</b></div><div><small>Cúp thành tích</small><b>${s.trophies}</b></div><div><small>Mã Mastery</small><b>${s.mastered}</b></div><div><small>Room Level</small><b>${s.roomLevel}/5</b></div></div></div><div class="card v390-panel"><h3>Thiết kế mới</h3><div class="v390-legend"><span>✓ Soft 3D</span><span>✓ Bóng đổ mềm</span><span>✓ Nhân vật ngồi học</span><span>✓ Cosmetic only</span></div></div></aside></div>`;hud()}
function inject(){try{ROLE_ACCESS.student.add('room')}catch(_){};const nav=document.querySelector('.student-nav-block .nav-group-items');if(nav&&!nav.querySelector('[data-page="room"]'))nav.insertAdjacentHTML('beforeend','<button data-page="room" title="Phòng học 3D của em"><span class="ico">🏠</span><span class="nav-label">Phòng của em</span></button>');const main=document.querySelector('main .content')||document.querySelector('main');if(main&&!document.getElementById('page-room'))main.insertAdjacentHTML('beforeend','<section class="section student-only" id="page-room"><div id="v390RoomPage"></div></section>')}
function adoptCloud(){const c=window.firebaseProfile?.roomV390;if(!c)return;const l=profile(),ct=Date.parse(c.updatedAt||0)||0,lt=Date.parse(l.updatedAt||0)||0;if(ct>=lt){bucket()[uid()]={...blank(),...c,ownerUid:uid()};try{window.save?.({sync:false,reason:'room-cloud'})}catch(_){}}}
function install(){inject();if(typeof window.goPage==='function'&&!window.goPage.__v390){const base=window.goPage;const wrap=function(page,internal=false){const r=base(page,internal);if(page==='room'){renderPage();setTimeout(mount,40)}else destroy();return r};wrap.__v390=true;window.goPage=wrap}if(typeof window.firebaseHydrateUser==='function'&&!window.firebaseHydrateUser.__v390){const base=window.firebaseHydrateUser;const wrap=async function(u){const r=await base(u);adoptCloud();return r};wrap.__v390=true;window.firebaseHydrateUser=wrap}window.addEventListener('resize',()=>engine?.resize());['math12hub:attempt-rewarded','math12hub:game-reward','math12hub:avatar-changed','math12hub:avatar-state-changed'].forEach(ev=>window.addEventListener(ev,()=>{if(document.getElementById('page-room')?.classList.contains('active')){renderPage();setTimeout(mount,50)}}));if(document.getElementById('page-room')?.classList.contains('active')){renderPage();mount()}}
window.v390Room={build:BUILD,schema:SCHEMA,themes,profile,stats,render:renderPage,mount,setTheme,toggleNight,focus,destroy};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
