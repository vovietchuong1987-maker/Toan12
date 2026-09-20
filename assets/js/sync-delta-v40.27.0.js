/* Math12 Hub v40.27.0 — Firestore Delta Sync */
(function(){
'use strict';
const BUILD='40.27.0-firestore-delta-sync';
const VERSION=402700;
const BASELINE_SCHEMA=1;
const BATCH_SIZE=350;
const safeMode=new URLSearchParams(location.search).has('safe');
const stats={runs:0,bootstraps:0,sets:0,deletes:0,skipped:0,lastMs:0,lastAt:'',lastError:''};
const baseSync=typeof firebaseSyncTeacherContent==='function'?firebaseSyncTeacherContent:null;
const baseReplace=typeof firebaseReplaceOwnCollection==='function'?firebaseReplaceOwnCollection:null;

function uid(){try{return firebaseUser?.uid||''}catch(_){return ''}}
function key(){return `math12hub-sync-v4027-${uid()||'guest'}`}
function encodeId(id){return encodeURIComponent(String(id||''))}
function cleanForHash(x){
  if(Array.isArray(x))return x.map(cleanForHash);
  if(x&&typeof x==='object'){
    const out={};Object.keys(x).sort().forEach(k=>{if(k==='_updatedAt'||k==='_syncVersion')return;const v=x[k];if(v!==undefined&&typeof v!=='function')out[k]=cleanForHash(v)});return out;
  }
  return x;
}
function hashText(s){let h=2166136261;s=String(s||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function itemHash(x){return hashText(JSON.stringify(cleanForHash(x)))}
function collectionSnapshot(items=[]){
  const hashes={};const data=new Map();
  for(const x of items||[]){if(!x?.id)continue;const id=encodeId(x.id),h=itemHash(x);hashes[id]=h;data.set(id,x)}
  return {hashes,data,count:data.size};
}
function loadBaseline(){
  try{const x=JSON.parse(localStorage.getItem(key())||'null');return x&&x.schema===BASELINE_SCHEMA?x:null}catch(_){return null}
}
function saveBaseline(b){try{localStorage.setItem(key(),JSON.stringify(b));return true}catch(err){stats.lastError='baseline-storage';console.warn('[Delta Sync] baseline storage',err);return false}}
function currentCollections(){return {
  questionBank:state.questionBank||[],
  customExams:state.customExams||[],
  recycleBinV26:typeof v26TeacherRecycleDocs==='function'?v26TeacherRecycleDocs():[]
}}
async function commitOps(col,ops){
  for(let i=0;i<ops.length;i+=BATCH_SIZE){const batch=firebaseDb.batch();for(const op of ops.slice(i,i+BATCH_SIZE)){if(op.type==='delete')batch.delete(col.doc(op.id));else batch.set(col.doc(op.id),{...op.data,_v:27,_syncVersion:VERSION,_updatedAt:firebaseServerTimestamp()},{merge:false})}await batch.commit()}
}
async function deltaCollection(name,items,oldHashes){
  const snap=collectionSnapshot(items),ops=[];oldHashes=oldHashes||{};
  for(const [id,data] of snap.data){if(oldHashes[id]!==snap.hashes[id])ops.push({type:'set',id,data})}
  for(const id of Object.keys(oldHashes))if(!(id in snap.hashes))ops.push({type:'delete',id});
  if(!ops.length){stats.skipped+=snap.count;return {hashes:snap.hashes,count:snap.count,sets:0,deletes:0}}
  const col=firebaseDb.collection('users').doc(firebaseUser.uid).collection(name);await commitOps(col,ops);
  const sets=ops.filter(x=>x.type==='set').length,deletes=ops.length-sets;stats.sets+=sets;stats.deletes+=deletes;
  return {hashes:snap.hashes,count:snap.count,sets,deletes}
}
async function bootstrap(cols){
  if(!baseReplace)throw new Error('Không tìm thấy cơ chế đồng bộ nền để khởi tạo Delta Sync.');
  stats.bootstraps++;
  for(const [name,items] of Object.entries(cols))await baseReplace(name,items);
  const collections={};for(const [name,items] of Object.entries(cols)){const x=collectionSnapshot(items);collections[name]={hashes:x.hashes,count:x.count}}
  saveBaseline({schema:BASELINE_SCHEMA,version:VERSION,uid:uid(),collections,teacherHash:firebaseTeacherHash(),updatedAt:new Date().toISOString()});
}
async function sync(force=false){
  if(safeMode&&baseSync)return baseSync(force);
  if(!firebaseUser||!firebaseDb||!isTeacherRole())return;
  const teacherHash=firebaseTeacherHash();if(!force&&teacherHash===firebaseLastTeacherHash)return;
  const started=performance.now(),cols=currentCollections(),baseline=loadBaseline();stats.runs++;
  try{
    if(!baseline||baseline.uid!==uid()||!baseline.collections){await bootstrap(cols)}
    else{
      const next={schema:BASELINE_SCHEMA,version:VERSION,uid:uid(),collections:{},teacherHash,updatedAt:new Date().toISOString()};
      for(const [name,items] of Object.entries(cols)){const r=await deltaCollection(name,items,baseline.collections?.[name]?.hashes||{});next.collections[name]={hashes:r.hashes,count:r.count}}
      saveBaseline(next);
    }
    firebaseLastTeacherHash=teacherHash;stats.lastError='';stats.lastAt=new Date().toISOString();stats.lastMs=Math.round(performance.now()-started);
    try{window.dispatchEvent(new CustomEvent('math12hub:delta-sync',{detail:{...stats,teacherHash}}))}catch(_){}
  }catch(err){stats.lastError=String(err?.code||err?.message||err);console.error('[Delta Sync]',err);throw err}
}
function resetBaseline(){try{localStorage.removeItem(key())}catch(_){};firebaseLastTeacherHash='';return true}
function status(){const b=loadBaseline();return {build:BUILD,version:VERSION,safeMode,baseline:!!b,collections:Object.fromEntries(Object.entries(b?.collections||{}).map(([k,v])=>[k,v.count||0])),...stats}}
if(!safeMode&&baseSync)firebaseSyncTeacherContent=sync;
window.M12DeltaSync={build:BUILD,version:VERSION,status,resetBaseline,sync};
document.documentElement.dataset.deltaSync=safeMode?'safe':'40.27';
})();
