/* =========================================================
   V21 — DATA SAFETY VAULT
   IndexedDB mirror, rotating recovery snapshots, full backup/restore,
   and local rescue storage for teacher content before role lock/logout.
   ========================================================= */
const V21_VAULT_DB='math12hub-v21-vault';
const V21_VAULT_VERSION=1;
const V21_RESCUE_KEY='math12hub2026_teacher_rescue_v21';
const V21_AUTO_BACKUP_INTERVAL=10*60*1000;
const V21_AUTO_BACKUP_KEEP=6;
let v21VaultDbPromise=null,v21MirrorTimer=null,v21LastAutoBackupAt=0,v21PendingFullRestore=null;

function v21OpenVault(){
  if(!('indexedDB' in window))return Promise.reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'));
  if(v21VaultDbPromise)return v21VaultDbPromise;
  v21VaultDbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(V21_VAULT_DB,V21_VAULT_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv',{keyPath:'key'});
      if(!db.objectStoreNames.contains('snapshots')){
        const s=db.createObjectStore('snapshots',{keyPath:'id'});
        s.createIndex('createdAt','createdAt');s.createIndex('kind','kind');
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Không mở được IndexedDB.'));
  });
  return v21VaultDbPromise;
}
function v21IdbRequest(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function v21VaultPut(store,value){const db=await v21OpenVault(),tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
async function v21VaultGet(store,key){const db=await v21OpenVault(),tx=db.transaction(store,'readonly');return v21IdbRequest(tx.objectStore(store).get(key))}
async function v21VaultDelete(store,key){const db=await v21OpenVault(),tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key);return new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function v21VaultGetAll(store){const db=await v21OpenVault(),tx=db.transaction(store,'readonly');return v21IdbRequest(tx.objectStore(store).getAll())}
function v21Clone(value){return JSON.parse(JSON.stringify(value))}
function v21TeacherPayload(){return {questionBank:v21Clone(state.questionBank||[]),customExams:v21Clone(state.customExams||[]),recycleBinV26:v21Clone(state.recycleBinV26||{questions:[],customExams:[]}),savedAt:new Date().toISOString(),revision:Number(state._meta?.revision)||0,teacherHash:typeof firebaseTeacherHash==='function'?firebaseTeacherHash():''}}
function v21SafeStateSnapshot(){const copy=v21Clone(state);if(copy?._meta){delete copy._meta.syncConflict;delete copy._meta.storageWarning}return copy}

async function v21MirrorStateNow(){
  try{
    const payload={key:'latest-state',updatedAt:new Date().toISOString(),revision:Number(state._meta?.revision)||0,state:v21SafeStateSnapshot()};
    await v21VaultPut('kv',payload);
    if(isTeacherRole?.())await v21VaultPut('kv',{key:'latest-teacher',updatedAt:payload.updatedAt,...v21TeacherPayload()});
    const now=Date.now();
    if(now-v21LastAutoBackupAt>=V21_AUTO_BACKUP_INTERVAL){v21LastAutoBackupAt=now;await v21CreateRecoverySnapshot('auto',false);}
    if(state._meta){state._meta.lastVaultMirrorAt=payload.updatedAt;state._meta.storageMode='localStorage+IndexedDB'}
  }catch(err){console.warn('V21 vault mirror',err);if(state._meta)state._meta.storageWarning=String(err?.message||err)}
}
function v21MirrorState(){clearTimeout(v21MirrorTimer);v21MirrorTimer=setTimeout(v21MirrorStateNow,800)}

async function v21CreateRecoverySnapshot(kind='manual',notify=true){
  const now=new Date().toISOString(),id=`${kind}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const snap={id,kind,createdAt:now,version:APP_VERSION,revision:Number(state._meta?.revision)||0,state:v21SafeStateSnapshot()};
  await v21VaultPut('snapshots',snap);
  if(kind==='auto')await v21TrimAutoSnapshots();
  if(state._meta){state._meta.lastBackupAt=now;state._meta.lastBackupKind=kind}
  try{localStorage.setItem('math12hub2026_last_backup_v21',now)}catch(_){}
  if(notify)alert('Đã tạo điểm khôi phục an toàn trên thiết bị.');
  return snap;
}
async function v21TrimAutoSnapshots(){
  const all=(await v21VaultGetAll('snapshots')).filter(x=>x.kind==='auto').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  for(const x of all.slice(V21_AUTO_BACKUP_KEEP))await v21VaultDelete('snapshots',x.id);
}
async function v21ListRecoverySnapshots(){return (await v21VaultGetAll('snapshots')).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}

async function v21StashTeacherContent(reason='role-lock'){
  const payload=v21TeacherPayload();payload.reason=reason;payload.key='latest-teacher';
  try{localStorage.setItem(V21_RESCUE_KEY,JSON.stringify(payload))}catch(err){console.warn('V21 local rescue quota',err)}
  try{await v21VaultPut('kv',payload)}catch(err){console.warn('V21 teacher vault rescue',err)}
  return payload;
}
function v21ReadTeacherRescue(){try{const raw=localStorage.getItem(V21_RESCUE_KEY);return raw?JSON.parse(raw):null}catch(_){return null}}
async function v21BestTeacherRescue(){
  const local=v21ReadTeacherRescue();let vault=null;try{vault=await v21VaultGet('kv','latest-teacher')}catch(_){}
  const candidates=[local,vault].filter(x=>x&&Array.isArray(x.questionBank));
  return candidates.sort((a,b)=>String(b.savedAt||b.updatedAt||'').localeCompare(String(a.savedAt||a.updatedAt||'')))[0]||null;
}
async function v21RestoreTeacherRescueIfUseful(){
  const rescue=await v21BestTeacherRescue();if(!rescue)return false;
  const currentCount=Array.isArray(state.questionBank)?state.questionBank.length:0;
  const rescueCount=rescue.questionBank.length;
  if(!currentCount||state._meta?.teacherContentInVault||rescue.revision>(Number(state._meta?.revision)||0)){
    state.questionBank=v21Clone(rescue.questionBank);state.customExams=v21Clone(rescue.customExams||[]);state.recycleBinV26=v21Clone(rescue.recycleBinV26||state.recycleBinV26||{questions:[],customExams:[]});
    if(state._meta)state._meta.teacherContentInVault=false;
    return true;
  }
  return false;
}

async function v21HydrateFromVault(){
  try{
    const latest=await v21VaultGet('kv','latest-state');
    const localRevision=Number(state._meta?.revision)||0,vaultRevision=Number(latest?.revision)||0;
    if(latest?.state&&(state._meta?.vaultFallback||state._meta?.localLoadError||vaultRevision>localRevision)){
      const keepRole=state.role;state=latest.state;state.role=keepRole||state.role||'student';
      state._meta=state._meta||{};state._meta.recoveredFromVaultAt=new Date().toISOString();state._meta.vaultFallback=false;
    }
    if(state._meta?.teacherContentInVault)await v21RestoreTeacherRescueIfUseful();
  }catch(err){console.warn('V21 hydrate vault',err)}
}

async function v21HandleStorageQuota(serialized,err){
  console.warn('V21 localStorage fallback to IndexedDB',err);
  try{
    await v21VaultPut('kv',{key:'latest-state',updatedAt:new Date().toISOString(),revision:Number(state._meta?.revision)||0,state:v21SafeStateSnapshot()});
    if(Array.isArray(state.questionBank))await v21StashTeacherContent('localStorage-quota');
    const slim=v21Clone(state);slim.questionBank=null;slim.customExams=[];slim._meta=slim._meta||{};slim._meta.vaultFallback=true;slim._meta.teacherContentInVault=true;slim._meta.storageMode='IndexedDB fallback';slim._meta.storageWarning='localStorage đầy; nội dung lớn đã chuyển sang IndexedDB.';
    localStorage.setItem('math12hub2026',JSON.stringify(slim));
  }catch(fallbackErr){console.error('V21 storage fallback failed',fallbackErr)}
}

function v21FullBackupPayload(){return {format:'math12hub-full-backup',version:APP_VERSION,schemaVersion:26,createdAt:new Date().toISOString(),meta:{revision:Number(state._meta?.revision)||0,role:state.role||'student'},state:v21SafeStateSnapshot()}}
function v21BackupFilename(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `math12hub-v26-full-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`}
function v21ExportFullBackup(){
  const payload=v21FullBackupPayload();triggerJsonDownload(payload,v21BackupFilename());
  if(state._meta){state._meta.lastExportAt=payload.createdAt}
  v21CreateRecoverySnapshot('export',false).catch(()=>{});
}
function v21ChooseFullBackup(){
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.style.display='none';document.body.appendChild(input);
  input.onchange=async()=>{const file=input.files?.[0];input.remove();if(!file)return;try{const data=JSON.parse(await file.text());if(data?.format!=='math12hub-full-backup'||!data.state)throw new Error('Không phải bản sao lưu đầy đủ Math12 Hub.');v21PendingFullRestore={data,fileName:file.name};v21OpenFullRestorePreview()}catch(err){alert('Không thể đọc bản sao lưu đầy đủ: '+(err?.message||err))}};
  input.click();
}
function v21OpenFullRestorePreview(){
  const p=v21PendingFullRestore;if(!p)return;const s=p.data.state||{},bank=Array.isArray(s.questionBank)?s.questionBank.length:0,exams=Array.isArray(s.customExams)?s.customExams.length:0,attempts=Array.isArray(s.examAttempts)?s.examAttempts.length:0;
  const body=`<div class="notice"><b>${esc(p.fileName)}</b><br>Phiên bản ${esc(p.data.version||'?')} • ${p.data.createdAt?new Date(p.data.createdAt).toLocaleString('vi-VN'):''}</div><div class="backup-summary"><div><b>${bank}</b><small>Câu hỏi</small></div><div><b>${exams}</b><small>Đề đã lưu</small></div><div><b>${attempts}</b><small>Lượt kiểm tra</small></div></div><div class="restore-warnings"><b>V26 sẽ tạo điểm khôi phục trước khi thay dữ liệu.</b><br>Dữ liệu khôi phục được giữ ở máy trước; nếu đang đăng nhập, hệ thống sẽ đánh dấu cần đồng bộ lại thay vì âm thầm ghi đè cloud.</div>`;
  openModal('Khôi phục toàn bộ dữ liệu','V26 • Data Safety',body,`<button class="btn btn-soft" onclick="closeModal()">Hủy</button><button class="btn btn-blue" onclick="v21CommitFullRestore()">Khôi phục</button>`);
}
async function v21CommitFullRestore(){
  if(!v21PendingFullRestore)return;
  await v21CreateRecoverySnapshot('before-full-restore',false);
  const restored=v21Clone(v21PendingFullRestore.data.state);restored._meta=restored._meta||{};restored._meta.schemaVersion=26;restored._meta.revision=(Number(restored._meta.revision)||0)+1;restored._meta.updatedAt=new Date().toISOString();restored._meta.restorePending=true;restored._meta.teacherBaseHash='';restored._meta.learningBaseHash='';
  state=restored;v21PendingFullRestore=null;save({sync:false,reason:'full-restore'});await v21MirrorStateNow();closeModal();applyRoleAccess(currentSecureRole(),true);renderAll();alert('Đã khôi phục dữ liệu trên thiết bị. Hãy kiểm tra rồi bấm “Đồng bộ ngay” nếu muốn cập nhật lên cloud.');
}
async function v21RestoreSnapshot(id){
  const snap=await v21VaultGet('snapshots',id);if(!snap?.state)return alert('Không tìm thấy điểm khôi phục.');
  if(!confirm(`Khôi phục dữ liệu về ${new Date(snap.createdAt).toLocaleString('vi-VN')}?`))return;
  await v21CreateRecoverySnapshot('before-snapshot-restore',false);state=v21Clone(snap.state);state._meta=state._meta||{};state._meta.revision=(Number(state._meta.revision)||0)+1;state._meta.updatedAt=new Date().toISOString();state._meta.restorePending=true;save({sync:false,reason:'snapshot-restore'});await v21MirrorStateNow();closeModal();applyRoleAccess(currentSecureRole(),true);renderAll();alert('Đã khôi phục điểm dữ liệu.');
}
async function v21OpenDataSafetyCenter(){
  let snaps=[];try{snaps=await v21ListRecoverySnapshots()}catch(_){}
  let cloudBundles=[];try{if(typeof v26ListCloudRecoveryBundles==='function')cloudBundles=await v26ListCloudRecoveryBundles()}catch(_){}
  const m=state._meta||{},latest=snaps[0],conflict=m.syncConflict;
  const rows=snaps.slice(0,6).map(s=>`<div class="teacher-history-row"><div><b>${s.kind==='auto'?'Tự động':s.kind==='manual'?'Thủ công':s.kind}</b><small>${new Date(s.createdAt).toLocaleString('vi-VN')} • rev ${s.revision||0}</small></div><button class="btn btn-soft" onclick="v21RestoreSnapshot('${attrEsc(s.id)}')">Khôi phục</button></div>`).join('')||'<div class="online-empty">Chưa có điểm khôi phục.</div>';
  const bundleRows=cloudBundles.slice(0,6).map(x=>`<div class="teacher-history-row"><div><b>${esc(x.payload?.type==='submission'?'Lượt nộp đã xóa':'Bài giao đã xóa')}</b><small>${new Date(x.createdAt||Date.now()).toLocaleString('vi-VN')} • ${esc(x.payload?.assignmentId||'')}</small></div><div class="online-actions"><button class="btn btn-soft" onclick="v26ExportCloudRecovery('${attrEsc(x.key)}')">Xuất JSON</button><button class="btn btn-danger" onclick="v26DeleteCloudRecovery('${attrEsc(x.key)}')">Xóa gói</button></div></div>`).join('')||'<div class="online-empty">Chưa có gói cứu hộ thao tác cloud.</div>';
  const body=`<div class="grid grid-3"><div class="card"><small>Phiên bản dữ liệu</small><h2>V26 / rev ${m.revision||0}</h2></div><div class="card"><small>Lưu cục bộ</small><h2>${esc(m.storageMode||'localStorage')}</h2></div><div class="card"><small>Cloud</small><h2>${conflict?'⚠ Xung đột':firebaseUser?'✓ Đã đăng nhập':'—'}</h2></div></div>${m.storageWarning?`<div class="firebase-banner warn mt">${esc(m.storageWarning)}</div>`:''}${conflict?'<div class="firebase-banner error mt"><b>Đang có xung đột local/cloud.</b> V26 đã tạm dừng tự ghi đè nội dung giáo viên.</div>':''}<div class="card mt"><div class="section-head" style="margin:0 0 8px"><div><h3>Sao lưu đầy đủ</h3><p>Bao gồm tiến độ, lịch sử, ngân hàng câu hỏi và đề đã lưu.</p></div></div><div class="online-actions"><button class="btn btn-blue" onclick="v21ExportFullBackup()">⬇ Xuất bản sao lưu</button><button class="btn btn-soft" onclick="v21ChooseFullBackup()">↥ Khôi phục từ file</button><button class="btn btn-soft" onclick="v21CreateRecoverySnapshot('manual',true).then(()=>v21OpenDataSafetyCenter())">＋ Tạo điểm khôi phục</button></div></div><div class="card mt"><h3 style="margin-top:0">Điểm khôi phục trên thiết bị</h3>${rows}</div><div class="card mt"><h3 style="margin-top:0">Gói cứu hộ thao tác cloud • V26</h3><p class="cloud-sync-note">V26 tự lưu bản câu trả lời/chỉ mục trước khi giáo viên xóa vĩnh viễn lượt nộp hoặc bài giao. Gói này nằm trong IndexedDB của thiết bị và có thể xuất JSON để đối soát.</p>${bundleRows}</div><div class="math-help mt">IndexedDB được dùng như kho cứu hộ và bản sao cho dữ liệu lớn. V26 vẫn giữ tương thích localStorage để website hoạt động như các bản trước.</div>`;
  openModal('Dữ liệu & sao lưu','V26 • Data Safety Vault',body,'<button class="btn btn-soft" onclick="closeModal()">Đóng</button>');
}
