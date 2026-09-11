/* =========================================================
   Math12 Hub v40.15.8 — Avatar + Math Room Lighting/Material Polish
   - Mastery aura (lightweight mesh glow, no particle dependency)
   - Time-aware room environment helper
   - Premium runtime/performance helpers
   - Keeps Avatar v600 / Room v400 persistence unchanged
   ========================================================= */
(function(){
'use strict';
const BUILD='40.16.0-avatar-room-premium-production',VERSION=401600;
let auraRoot=null,auraObserver=null,auraScene=null;
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches||!!window.Math12Platform?.perf?.lowPower?.()}catch(_){return false}};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
function data(){try{return window.Math12RoomData?.get?.()||null}catch(_){return null}}
function mastery(){const d=data();return clamp(d?.mastery?.average??0)}
function achievementCount(){const d=data();return Math.max(0,Number(d?.achievements?.count)||0)}
function auraTier(){const m=mastery(),a=achievementCount();if(m>=.86||a>=18)return {id:'elite',label:'Tinh hoa',color:'#E9BD52',alpha:.28};if(m>=.68||a>=10)return {id:'gold',label:'Vững vàng',color:'#D8A93D',alpha:.23};if(m>=.45||a>=5)return {id:'silver',label:'Tiến bộ',color:'#9CB5C6',alpha:.19};if(m>=.20||a>=1)return {id:'blue',label:'Khởi sắc',color:'#7398D6',alpha:.15};return {id:'soft',label:'Đang hình thành',color:'#8DB19A',alpha:.11}}
function disposeAura(){if(auraObserver&&auraScene)try{auraScene.onBeforeRenderObservable.remove(auraObserver)}catch(_){}auraObserver=null;try{auraRoot?.dispose(false,true)}catch(_){}auraRoot=null;auraScene=null}
function attachAura(context='room'){
  const bridge=window.AvatarRendererBridge?.get?.(context),scene=bridge?.getScene?.(),root=bridge?.getRoot?.();if(!scene||!root||!window.BABYLON)return false;
  disposeAura();auraScene=scene;const tier=auraTier();
  const group=new BABYLON.TransformNode('math12PremiumAura',scene);group.parent=root;group.position.y=-.61;auraRoot=group;
  const c=BABYLON.Color3.FromHexString(tier.color);
  const material=(name,alpha)=>{const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=c;m.emissiveColor=c.scale(.72);m.specularColor=BABYLON.Color3.Black();m.alpha=alpha;m.disableLighting=true;return m};
  const ring1=BABYLON.MeshBuilder.CreateTorus('premiumAuraRing1',{diameter:2.18,thickness:.040,tessellation:48},scene);ring1.parent=group;ring1.rotation.x=Math.PI/2;ring1.material=material('premiumAuraMat1',tier.alpha);
  const ring2=BABYLON.MeshBuilder.CreateTorus('premiumAuraRing2',{diameter:2.52,thickness:.022,tessellation:48},scene);ring2.parent=group;ring2.rotation.x=Math.PI/2;ring2.position.y=.025;ring2.material=material('premiumAuraMat2',tier.alpha*.60);
  const glow=BABYLON.MeshBuilder.CreateDisc('premiumAuraDisc',{radius:1.20,tessellation:48},scene);glow.parent=group;glow.rotation.x=Math.PI/2;glow.position.y=-.01;glow.material=material('premiumAuraDiscMat',tier.alpha*.16);
  [ring1,ring2,glow].forEach(x=>{x.isPickable=false;x.receiveShadows=false});
  const start=performance.now();auraObserver=scene.onBeforeRenderObservable.add(()=>{if(reduced())return;const t=(performance.now()-start)/1000,p=.5+.5*Math.sin(t*1.45);ring1.scaling.setAll(1+p*.018);ring2.scaling.setAll(1+(1-p)*.026);ring1.rotation.z=t*.08;ring2.rotation.z=-t*.055});
  root.metadata={...(root.metadata||{}),masteryAura:tier.id,masteryAuraLabel:tier.label};
  return true;
}
function environment(profile={}){
  const hour=new Date().getHours(),mode=['auto','day','night'].includes(profile.lighting)?profile.lighting:'auto';
  const night=mode==='night'||(mode==='auto'&&(hour<6||hour>=18));
  let phase='day',warmth=1,exposure=1.04,hemi=.78,key=1.03,window=.56,fill=.24,rim=.18;
  if(night){phase='night';warmth=.58;exposure=.86;hemi=.44;key=.46;window=.18;fill=.14;rim=.20}
  else if(hour<9){phase='morning';warmth=1.12;exposure=1.03;hemi=.76;key=.98;window=.66;fill=.22;rim=.16}
  else if(hour>=16){phase='golden';warmth=1.18;exposure=1.00;hemi=.70;key=.92;window=.70;fill=.20;rim=.22}
  return {mode,night,phase,warmth,exposure,hemi,key,window,fill,rim,hour,materialPolish:'40.15.8'};
}
function performanceProfile(){let mobile=false;try{mobile=matchMedia('(max-width: 700px)').matches}catch(_){}const low=!!window.Math12Platform?.perf?.lowPower?.();return {lowPower:low,mobile,hardwareScaling:low?1.55:mobile?1.24:1,shadowSize:low?768:mobile?1024:1536,blurKernel:low?14:mobile?20:26}}
function label(profile={}){const mode=['auto','day','night'].includes(profile.lighting)?profile.lighting:'auto';return mode==='auto'?'◐ Ánh sáng tự động':mode==='day'?'☀ Ban ngày':'☾ Ban đêm'}
function refresh(){if(document.getElementById('page-room')?.classList.contains('active'))setTimeout(()=>attachAura('room'),60);if(document.getElementById('page-avatar')?.classList.contains('active'))setTimeout(()=>attachAura('studio'),60)}
function install(){
  window.addEventListener('math12hub:avatar-renderer-mounted',e=>{const c=e.detail?.context;if(c==='room'||c==='studio')setTimeout(()=>attachAura(c),80)});
  window.addEventListener('math12hub:room-presence-ready',()=>setTimeout(()=>attachAura('room'),80));
  window.addEventListener('math12hub:room-data-changed',refresh);
  window.addEventListener('math12hub:avatar-state-changed',()=>setTimeout(refresh,90));
  if(window.Math12Events){window.Math12Events.on('renderer:registered',d=>{if(['room','studio'].includes(d?.name))setTimeout(()=>attachAura(d.name),100)});window.Math12Events.on('page:changed',d=>{if(d?.page==='room')setTimeout(()=>attachAura('room'),180);if(d?.page==='avatar')setTimeout(()=>attachAura('studio'),180)})}
  document.documentElement.dataset.avatarRoomPremium=BUILD;
}
window.Math12AvatarRoomPremium={build:BUILD,version:VERSION,auraTier,attachAura,disposeAura,environment,performanceProfile,label,refresh,status:()=>({build:BUILD,version:VERSION,tier:auraTier(),mounted:!!auraRoot,context:auraRoot?.parent?.metadata?.context||null,environment:environment(window.v390Room?.profile?.()||{})})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
