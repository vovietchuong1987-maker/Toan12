/* =========================================================
   Math12 Hub — Unified Avatar Renderer v40.14.3
   Stable facade over the procedural Avatar 3D core.
   Studio and Math Room now use the exact same model builder.
   ========================================================= */
(function(){
'use strict';
const BUILD='40.15.1-unified-avatar-body-sneaker-renderer',VERSION=40151;
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
