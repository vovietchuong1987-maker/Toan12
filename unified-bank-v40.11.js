/* =========================================================
   Math12 Hub V40.11 — Unified Bank Firestore Bridge
   Publishes the approved teacher bank in chunks and lets learners consume
   the same public snapshot. Bundled canonical data remains the offline fallback.
   ========================================================= */
(function(){
'use strict';
const VERSION='40.11',BUILD='40.11-unified-bank-firestore';
const COLL='publicQuestionBankV4011',SCHEMA=4011,CHUNK_SIZE=40;
let lastUid='',lastRole='',lastRevision=-1,lastBankHash='',busyLoad=false,busyPublish=false,publishTimer=0,lastRemoteHash='';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function role(){try{return typeof currentSecureRole==='function'?currentSecureRole():(typeof isTeacherRole==='function'&&isTeacherRole()?'teacher':'student')}catch(_){return 'student'}}
function canTeacher(){const r=role();return r==='teacher'||r==='admin'}
function db(){try{return typeof firebaseDb!=='undefined'?firebaseDb:null}catch(_){return null}}
function user(){try{return typeof firebaseUser!=='undefined'?firebaseUser:null}catch(_){return null}}
function serverTime(){try{return typeof firebaseServerTimestamp==='function'?firebaseServerTimestamp():new Date()}catch(_){return new Date()}}
function canonical(){return Array.isArray(window.MATH12_CANONICAL_QUESTION_BANK)?window.MATH12_CANONICAL_QUESTION_BANK:[]}
function currentTeacherBank(){try{return typeof state!=='undefined'&&Array.isArray(state?.questionBank)?state.questionBank:null}catch(_){return null}}
function isApproved(q){const s=String(q?.reviewStatus||'approved').toLowerCase();return s==='approved'||s==='reviewed'}
function stableRows(rows){return [...(rows||[])].filter(q=>q&&q.id).sort((a,b)=>String(a.questionId||a.id).localeCompare(String(b.questionId||b.id),'en'))}
function hashText(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function bankHash(rows){const slim=stableRows(rows).map(q=>[q.id,q.questionId||'',q.version||'',q.updatedAt||'',q.reviewStatus||'',q.id6||'',q.type||'',q.question||'',q.answer??'',q.options||[],q.statements||[],q.figureMode||'',q.figureLatex||'']);return hashText(JSON.stringify(slim))}
function seedTeacherIfNeeded(){
  if(!canTeacher()||typeof state==='undefined')return false;
  if(state.questionBank!==null)return false;
  const rows=canonical();if(!rows.length)return false;
  state.questionBank=JSON.parse(JSON.stringify(rows));state._meta=state._meta||{};state._meta.unifiedBankSeed='40.11';state._meta.questionBankSource='canonical-v40.11';
  try{window.QuestionIdV40?.ensureBank?.(state.questionBank,{saveChanges:false,reason:'v40.11-unified-seed'})}catch(_){}
  try{typeof save==='function'&&save({reason:'v40.11-unified-bank-seed'})}catch(_){}
  return true;
}
function chunks(rows){const out=[];for(let i=0;i<rows.length;i+=CHUNK_SIZE)out.push(rows.slice(i,i+CHUNK_SIZE));return out}
async function loadRemote(force=false){
  const f=db(),u=user();if(!f||!u||busyLoad||canTeacher())return false;busyLoad=true;
  try{const ms=await f.collection(COLL).doc('manifest').get();if(!ms.exists)return false;const m=ms.data()||{};if(Number(m.schemaVersion)!==SCHEMA||!Array.isArray(m.chunkIds))return false;if(!force&&m.hash&&m.hash===lastRemoteHash)return true;
    const snaps=await Promise.all(m.chunkIds.map(id=>f.collection(COLL).doc(id).get()));let rows=[];for(const s of snaps){if(!s.exists)throw new Error('Thiếu chunk '+s.id);const d=s.data()||{};if(String(d.hash||'')!==String(m.hash||''))throw new Error('Chunk không đồng bộ '+s.id);rows.push(...(Array.isArray(d.rows)?d.rows:[]))}
    if(Number(m.count)!==rows.length)throw new Error(`Manifest ${m.count} câu nhưng tải ${rows.length}`);
    if(window.Math12Content?.setRemoteBank?.(rows,{hash:m.hash,count:m.count,publishedAt:m.publishedAt||'',publisher:m.publisher||'',schemaVersion:m.schemaVersion})){lastRemoteHash=String(m.hash||'');refreshUI();return true}
  }catch(err){console.warn('V40.11 public bank load:',err?.message||err)}finally{busyLoad=false}
  return false;
}
async function publishNow(force=false){
  const f=db(),u=user();if(!f||!u||!canTeacher()||busyPublish)return false;let src=currentTeacherBank();if(src===null){seedTeacherIfNeeded();src=currentTeacherBank()}if(src===null)return false;const rows=stableRows(src.filter(isApproved)),hash=bankHash(rows);if(!force&&hash===lastBankHash)return true;busyPublish=true;
  try{const ref=f.collection(COLL).doc('manifest'),old=await ref.get(),om=old.exists?(old.data()||{}):{};if(!force&&om.hash===hash&&Number(om.count)===rows.length){lastBankHash=hash;return true}
    const parts=chunks(rows),ids=parts.map((_,i)=>`chunk-${String(i+1).padStart(3,'0')}`);
    for(let i=0;i<parts.length;i++){await f.collection(COLL).doc(ids[i]).set({schemaVersion:SCHEMA,index:i,count:parts[i].length,hash,rows:parts[i],updatedAt:serverTime()},{merge:false})}
    const stale=Array.isArray(om.chunkIds)?om.chunkIds.filter(id=>!ids.includes(id)):[];for(const id of stale){try{await f.collection(COLL).doc(id).delete()}catch(_){}}
    await ref.set({schemaVersion:SCHEMA,build:BUILD,hash,count:rows.length,approved:rows.length,blocked:Math.max(0,src.length-rows.length),chunkIds:ids,chunkSize:CHUNK_SIZE,publisher:u.uid,publishedAt:serverTime()},{merge:false});
    lastBankHash=hash;try{if(typeof state!=='undefined'){state._meta=state._meta||{};state._meta.publicBankV4011={hash,count:rows.length,publishedAt:new Date().toISOString()}}}catch(_){}
    try{window.dispatchEvent(new CustomEvent('math12hub:unified-bank-published',{detail:{count:rows.length,hash}}))}catch(_){}refreshUI();return true;
  }catch(err){console.warn('V40.11 public bank publish:',err?.message||err);return false}finally{busyPublish=false}
}
function schedulePublish(delay=1800){clearTimeout(publishTimer);publishTimer=setTimeout(()=>publishNow(false),delay)}
function refreshUI(){try{window.Math12Platform?.renderContentReadiness?.()}catch(_){}try{typeof renderDashboard==='function'&&renderDashboard()}catch(_){}try{window.v383SelfStudy?.removeClassroomUI?.()}catch(_){}try{window.dispatchEvent(new CustomEvent('math12hub:practice-bank-refresh'))}catch(_){}}
function tick(){
  const u=user(),r=role(),uid=u?.uid||'',rev=(()=>{try{return Number(state?._meta?.revision)||0}catch(_){return 0}})();
  if(r!==lastRole||uid!==lastUid){lastRole=r;lastUid=uid;if(canTeacher()){lastRevision=-1;lastBankHash='';setTimeout(()=>{seedTeacherIfNeeded();refreshUI()},3200)}else if(uid)loadRemote(true);else window.Math12Content?.clearRemote?.();refreshUI()}
  if(canTeacher()&&u&&rev!==lastRevision){lastRevision=rev;const src=currentTeacherBank();if(src!==null){const h=bankHash(src.filter(isApproved));if(h!==lastBankHash)schedulePublish()}}
}
function stats(){const r=window.Math12Content?.readiness?.()||{};return {version:VERSION,build:BUILD,role:role(),firebase:!!db(),signedIn:!!user(),source:r.source||{},total:r.total||0,approved:r.approved||0,blocked:r.excluded||0,lastBankHash,lastRemoteHash,busyLoad,busyPublish}}
window.V4011UnifiedBank={version:VERSION,build:BUILD,collection:COLL,seedTeacherIfNeeded,loadRemote,publishNow,schedulePublish,stats,bankHash};
window.addEventListener('math12hub:content-pack',()=>refreshUI());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(tick,250);setInterval(tick,1800)},{once:true});else{setTimeout(tick,250);setInterval(tick,1800)}
})();
