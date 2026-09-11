/* =========================================================
   Math12 Hub — Avatar Renderer Compatibility Bridge v40.14.3
   Registers the existing Studio renderer into the shared runtime.
   Room registers itself from math-room-v39.js.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.15.0-avatar-renderer-premium-bridge',VERSION=40150;
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
