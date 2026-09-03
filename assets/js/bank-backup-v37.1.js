/* =========================================================
   Math12 Hub  — QUESTION BANK BACKUP V2
   - Chapter-aware backups without changing Firestore collections
   - Valid ZIP (STORE) package with manifest + 500/1000-question chunks
   - SHA-256 + CRC32 integrity checks
   - Restore scope: whole backup or one chapter
   - Restore modes: add missing / update by id / replace selected scope
   - Backward compatible with  JSON backups and legacy arrays
   ========================================================= */
(function(){
  'use strict';
  const BUILD='37.1-question-bank-backup-v2';
  const FORMAT='math12hub-question-bank-backup-v2';
  const CHUNK_FORMAT='math12hub-question-bank-chunk-v2';
  const SCHEMA=2;
  const DEFAULT_CHUNK=500;
  const CHUNK_CHOICES=[250,500,1000];
  let pendingRestore=null;

  const clone=x=>JSON.parse(JSON.stringify(x));
  const pad=(n,w=2)=>String(n).padStart(w,'0');
  const nowStamp=()=>{const d=new Date();return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`};
  const enc=new TextEncoder(),dec=new TextDecoder('utf-8');
  function bytes(v){return v instanceof Uint8Array?v:enc.encode(String(v??''))}
  function hex32(n){return (n>>>0).toString(16).padStart(8,'0')}
  function hex(buf){return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  async function sha256(data){
    const b=bytes(data);
    if(globalThis.crypto?.subtle){try{return hex(await crypto.subtle.digest('SHA-256',b))}catch(_){}}
    return `crc32-${hex32(crc32(b))}`;
  }

  let crcTable=null;
  function makeCrcTable(){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t}
  function crc32(data){const b=bytes(data);crcTable=crcTable||makeCrcTable();let c=0xFFFFFFFF;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
  function u16(n){const a=new Uint8Array(2);new DataView(a.buffer).setUint16(0,n,true);return a}
  function u32(n){const a=new Uint8Array(4);new DataView(a.buffer).setUint32(0,n>>>0,true);return a}
  function concat(parts){let len=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(len),o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
  function dosTimeDate(date=new Date()){
    const y=Math.max(1980,date.getFullYear()),time=((date.getHours()&31)<<11)|((date.getMinutes()&63)<<5)|((Math.floor(date.getSeconds()/2))&31),day=((y-1980)<<9)|(((date.getMonth()+1)&15)<<5)|(date.getDate()&31);return {time,day}
  }
  // Minimal standards-compliant ZIP writer using method 0 (STORE). JSON stays chunked;
  // no external CDN/library is needed, so backup works offline and cannot break due to a CDN.
  function makeZip(entries){
    const locals=[],centrals=[];let offset=0;const dt=dosTimeDate();
    for(const e of entries){
      const name=bytes(e.name),data=bytes(e.data),crc=crc32(data),flags=0x0800;
      const local=concat([u32(0x04034b50),u16(20),u16(flags),u16(0),u16(dt.time),u16(dt.day),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
      locals.push(local);
      const central=concat([u32(0x02014b50),u16(20),u16(20),u16(flags),u16(0),u16(dt.time),u16(dt.day),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
      centrals.push(central);offset+=local.length;
    }
    const central=concat(centrals),local=concat(locals),eocd=concat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(central.length),u32(local.length),u16(0)]);
    return concat([local,central,eocd]);
  }
  function findEocd(b){for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(new DataView(b.buffer,b.byteOffset+i,4).getUint32(0,true)===0x06054b50)return i;return -1}
  function readZip(arrayBuffer){
    const b=arrayBuffer instanceof Uint8Array?arrayBuffer:new Uint8Array(arrayBuffer),dv=new DataView(b.buffer,b.byteOffset,b.byteLength),e=findEocd(b);if(e<0)throw new Error('ZIP không có End of Central Directory.');
    const count=dv.getUint16(e+10,true),centralOffset=dv.getUint32(e+16,true),out=new Map();let p=centralOffset;
    for(let i=0;i<count;i++){
      if(dv.getUint32(p,true)!==0x02014b50)throw new Error('ZIP central directory không hợp lệ.');
      const method=dv.getUint16(p+10,true),crc=dv.getUint32(p+16,true),comp=dv.getUint32(p+20,true),raw=dv.getUint32(p+24,true),nameLen=dv.getUint16(p+28,true),extraLen=dv.getUint16(p+30,true),commentLen=dv.getUint16(p+32,true),localOffset=dv.getUint32(p+42,true),name=dec.decode(b.slice(p+46,p+46+nameLen));
      if(method!==0)throw new Error(`ZIP có file nén không được  hỗ trợ: ${name}. Hãy dùng ZIP do Math12 Hub  xuất.`);
      if(dv.getUint32(localOffset,true)!==0x04034b50)throw new Error(`Local header lỗi: ${name}`);
      const ln=dv.getUint16(localOffset+26,true),le=dv.getUint16(localOffset+28,true),start=localOffset+30+ln+le,data=b.slice(start,start+comp);
      if(raw!==data.length||crc32(data)!==crc)throw new Error(`CRC32 không khớp: ${name}`);
      out.set(name,{name,data,crc32:hex32(crc),bytes:data.length});p+=46+nameLen+extraLen+commentLen;
    }
    return out;
  }

  function chapterKey(q){
    let n=Number(q?.chapterId);if(Number.isInteger(n)&&n>=1&&n<=99)return `F${n}`;
    const s=String(q?.lessonId||q?.knowledgeCode||'');const m=s.match(/^F(\d+)/i);return m?`F${Number(m[1])}`:'OTHER';
  }
  function chapterMeta(key){
    if(key==='OTHER')return {key,title:'Chưa phân chương',number:null};const n=Number(String(key).replace(/^F/i,'')),c=(typeof chapters!=='undefined'?chapters:[]).find(x=>Number(x.id)===n);return {key,number:n,title:c?.title||`Chương ${n}`};
  }
  function groupBank(bank){const m=new Map();for(const q of bank||[]){const k=chapterKey(q);if(!m.has(k))m.set(k,[]);m.get(k).push(q)}return m}
  function sortedKeys(map){return [...map.keys()].sort((a,b)=>a==='OTHER'?1:b==='OTHER'?-1:Number(a.slice(1))-Number(b.slice(1)))}
  function validChunkSize(v){v=Number(v);return CHUNK_CHOICES.includes(v)?v:DEFAULT_CHUNK}
  function chunkArray(a,size){const out=[];for(let i=0;i<a.length;i+=size)out.push(a.slice(i,i+size));return out}
  function safeJson(obj){return JSON.stringify(obj,null,2)}
  function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
  function fmtSize(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
  function currentBank(){return Array.isArray(state?.questionBank)?state.questionBank:[]}

  async function packageEntries(bank,chunkSize=DEFAULT_CHUNK,onlyKey=null){
    chunkSize=validChunkSize(chunkSize);const groups=groupBank(bank),entries=[],chaptersMeta=[],allFileHashes=[];
    for(const key of sortedKeys(groups)){
      if(onlyKey&&key!==onlyKey)continue;
      const list=groups.get(key)||[],parts=chunkArray(list,chunkSize),cm=chapterMeta(key),chunkMeta=[];
      for(let i=0;i<parts.length;i++){
        const rel=`questions/${key}/${key}-${pad(i+1,3)}.json`,payload={format:CHUNK_FORMAT,backupSchema:SCHEMA,chapterId:key,chapterTitle:cm.title,part:i+1,totalParts:parts.length,questionCount:parts[i].length,questions:clone(parts[i])},text=safeJson(payload),b=bytes(text),hash=await sha256(b),crc=hex32(crc32(b));
        entries.push({name:rel,data:b});chunkMeta.push({path:rel,part:i+1,questionCount:parts[i].length,bytes:b.length,sha256:hash,crc32:crc});allFileHashes.push(`${rel}:${hash}`);
      }
      chaptersMeta.push({id:key,number:cm.number,title:cm.title,questionCount:list.length,chunkCount:parts.length,chunks:chunkMeta});
    }
    const total=chaptersMeta.reduce((s,c)=>s+c.questionCount,0),createdAt=new Date().toISOString();
    const manifest={format:FORMAT,backupSchema:SCHEMA,appVersion:String(typeof APP_VERSION!=='undefined'?APP_VERSION:'37.1'),build:BUILD,createdAt,curriculumId:globalThis.v360KnowledgeMap?.curriculumId||'MATH12-GDPT2018-2026',knowledgeMapVersion:36,questionBankSchema:36,questionIdMeta:window.QuestionIdV40?.metadata?.()||null,chunkSize,questionCount:total,chapterCount:chaptersMeta.length,chapters:chaptersMeta,integrity:{algorithm:'SHA-256 + CRC32',fileCount:entries.length,globalSha256:await sha256(allFileHashes.join('\n'))}};
    entries.unshift({name:'manifest.json',data:bytes(safeJson(manifest))});return {entries,manifest};
  }
  async function exportFullZip(){
    if(!requireTeacher?.('Sao lưu ngân hàng'))return;const bank=currentBank();if(!bank.length)return alert('Ngân hàng chưa có câu hỏi để sao lưu.');
    const size=validChunkSize(document.getElementById('v371ChunkSize')?.value);try{const {entries,manifest}=await packageEntries(bank,size),zip=makeZip(entries);downloadBlob(new Blob([zip],{type:'application/zip'}),`math12-question-bank-v37.1-${nowStamp()}.zip`);examToast?.(`Đã sao lưu ${manifest.questionCount} câu • ${manifest.chapterCount} chương • ${manifest.integrity.fileCount} chunk.`)}catch(err){alert('Không thể tạo ZIP sao lưu: '+(err?.message||err))}
  }
  async function exportChapterZip(key){
    if(!requireTeacher?.('Sao lưu chương'))return;const list=(groupBank(currentBank()).get(key)||[]);if(!list.length)return alert('Chương này chưa có câu hỏi.');const size=validChunkSize(document.getElementById('v371ChunkSize')?.value);try{const {entries,manifest}=await packageEntries(list,size,key),zip=makeZip(entries);downloadBlob(new Blob([zip],{type:'application/zip'}),`math12-question-bank-${key}-v37.1-${nowStamp()}.zip`);examToast?.(`Đã sao lưu ${manifest.questionCount} câu của ${key}.`)}catch(err){alert('Không thể sao lưu chương: '+(err?.message||err))}
  }
  async function exportChapterJson(key){
    if(!requireTeacher?.('Sao lưu chương'))return;const list=(groupBank(currentBank()).get(key)||[]);if(!list.length)return alert('Chương này chưa có câu hỏi.');const meta=chapterMeta(key),payload={format:FORMAT,backupSchema:SCHEMA,kind:'chapter-json',appVersion:String(APP_VERSION),createdAt:new Date().toISOString(),chapter:{id:key,title:meta.title},questionCount:list.length,questionIdMeta:window.QuestionIdV40?.metadata?.()||null,questionBank:clone(list)},raw=safeJson(payload);payload.integrity={sha256:await sha256(raw),crc32:hex32(crc32(raw))};triggerJsonDownload?.(payload,`math12-question-bank-${key}-v37.1-${nowStamp()}.json`)
  }
  function exportLegacyJson(){if(!requireTeacher?.('Sao lưu JSON tương thích'))return;const payload={format:'math12hub-question-bank-backup',version:APP_VERSION,createdAt:new Date().toISOString(),questionCount:currentBank().length,questionIdMeta:window.QuestionIdV40?.metadata?.()||null,questionBank:clone(currentBank())};triggerJsonDownload?.(payload,`math12-question-bank-legacy-v37.1-${nowStamp()}.json`)}

  function renderBackupCenter(){
    if(!requireTeacher?.('Sao lưu ngân hàng'))return;const bank=currentBank(),groups=groupBank(bank),rows=sortedKeys(groups).map(k=>{const m=chapterMeta(k),n=groups.get(k).length;return `<div class="teacher-history-row"><div><b>${esc(k)} • ${esc(m.title)}</b><small>${n.toLocaleString('vi-VN')} câu • ${Math.ceil(n/DEFAULT_CHUNK)} chunk nếu dùng 500 câu/chunk</small></div><div class="online-actions"><button class="btn btn-soft" onclick="v371ExportChapterJson('${attrEsc(k)}')">JSON</button><button class="btn btn-blue" onclick="v371ExportChapterZip('${attrEsc(k)}')">ZIP chunk</button></div></div>`}).join('')||'<div class="online-empty">Ngân hàng chưa có câu hỏi.</div>';
    const approx=bytes(safeJson(bank)).length;
    const body=`<div class="grid grid-3"><div class="card"><small>Tổng câu</small><h2>${bank.length.toLocaleString('vi-VN')}</h2></div><div class="card"><small>Chương có dữ liệu</small><h2>${groups.size}</h2></div><div class="card"><small>JSON thô ước tính</small><h2>${fmtSize(approx)}</h2></div></div><div class="card mt"><div class="section-head" style="margin:0 0 10px"><div><h3>Backup V2 • ZIP phân mảnh</h3><p>Firestore vẫn là một ngân hàng thống nhất. Chỉ file sao lưu được tách Chương → chunk để khôi phục an toàn.</p></div></div><div class="field" style="max-width:280px"><label>Kích thước chunk</label><select id="v371ChunkSize">${CHUNK_CHOICES.map(x=>`<option value="${x}" ${x===DEFAULT_CHUNK?'selected':''}>${x} câu / file</option>`).join('')}</select></div><div class="online-actions"><button class="btn btn-blue" onclick="v371ExportFullZip()">⬇ ZIP toàn bộ</button><button class="btn btn-soft" onclick="v371ExportLegacyJson()">JSON tương thích </button><button class="btn btn-soft" onclick="v371ChooseRestore()">↥ Khôi phục V2 / JSON cũ</button></div><div class="math-help mt"><b>ZIP </b> chứa <code>manifest.json</code> và các file <code>questions/F1/F1-001.json</code>… Mỗi chunk có SHA-256 + CRC32; ZIP được tạo ngay trên máy, không gửi câu hỏi lên máy chủ khác.</div></div><div class="card mt"><h3 style="margin-top:0">Sao lưu nhanh theo chương</h3>${rows}</div>`;
    openModal('Question Bank Backup V2','Chapter-aware • Chunked • Checksum',body,'<button class="btn btn-soft" onclick="closeModal()">Đóng</button>');
  }

  async function loadZipBackup(file){
    const entries=readZip(await file.arrayBuffer()),manifestEntry=entries.get('manifest.json');if(!manifestEntry)throw new Error('ZIP không có manifest.json.');const manifest=JSON.parse(dec.decode(manifestEntry.data));if(manifest?.format!==FORMAT||Number(manifest?.backupSchema)!==SCHEMA)throw new Error('Không phải ZIP Question Bank Backup V2 của Math12 Hub.');
    const problems=[],actualHashes=[];let verified=0;for(const c of manifest.chapters||[])for(const ch of c.chunks||[]){const e=entries.get(ch.path);if(!e){problems.push(`Thiếu ${ch.path}`);continue}if(ch.crc32&&String(ch.crc32).toLowerCase()!==String(e.crc32).toLowerCase()){problems.push(`CRC32 sai: ${ch.path}`);continue}const h=await sha256(e.data);if(ch.sha256&&h!==ch.sha256){problems.push(`SHA-256 sai: ${ch.path}`);continue}actualHashes.push(`${ch.path}:${h}`);verified++}
    if(!problems.length&&manifest.integrity?.globalSha256){const gh=await sha256(actualHashes.join('\n'));if(gh!==manifest.integrity.globalSha256)problems.push('Global checksum không khớp manifest.')}
    if(problems.length)throw new Error(`Backup không toàn vẹn (${problems.length} lỗi): ${problems.slice(0,3).join('; ')}`);
    return {kind:'v2-zip',fileName:file.name,manifest,entries,verified,createdAt:manifest.createdAt,version:manifest.appVersion,questionIdMeta:manifest?.questionIdMeta||null};
  }
  function parseJsonBackup(data,fileName){
    let bank=null,format='';if(Array.isArray(data)){bank=data;format='legacy-array'}else if(Array.isArray(data?.questionBank)){bank=data.questionBank;format=data.format||'json-package'}else if(data?.format===CHUNK_FORMAT&&Array.isArray(data.questions)){bank=data.questions;format='v2-chunk'}else throw new Error('File JSON không chứa questionBank/questions hợp lệ.');
    return {kind:'json',fileName,format,bank,createdAt:data?.createdAt||null,version:data?.appVersion||data?.version||null,manifest:data?.format===FORMAT?data:null,questionIdMeta:data?.questionIdMeta||null};
  }
  async function chooseRestore(){
    if(!requireTeacher?.('Khôi phục ngân hàng'))return;const input=document.createElement('input');input.type='file';input.accept='.json,.zip,application/json,application/zip';input.hidden=true;document.body.appendChild(input);
    input.onchange=async()=>{const f=input.files?.[0];input.remove();if(!f)return;try{const head=new Uint8Array(await f.slice(0,4).arrayBuffer()),isZip=head[0]===0x50&&head[1]===0x4b;pendingRestore=isZip?await loadZipBackup(f):parseJsonBackup(JSON.parse(await f.text()),f.name);openRestorePreview()}catch(err){pendingRestore=null;alert('Không thể đọc bản sao lưu: '+(err?.message||err))}};input.click();
  }
  function zipScopes(p){return (p.manifest?.chapters||[]).map(c=>({id:c.id,title:c.title,count:c.questionCount||0}))}
  function jsonScopes(p){const g=groupBank(p.bank||[]);return sortedKeys(g).map(k=>({id:k,title:chapterMeta(k).title,count:g.get(k).length}))}
  function scopes(p){return p.kind==='v2-zip'?zipScopes(p):jsonScopes(p)}
  function restoreCounts(p){const ss=scopes(p);return {total:ss.reduce((s,x)=>s+x.count,0),chapters:ss.length}}
  function openRestorePreview(){
    const p=pendingRestore;if(!p)return;const rc=restoreCounts(p),ss=scopes(p),scopeOptions=`<option value="ALL">Toàn bộ phạm vi trong file (${rc.total} câu)</option>`+ss.map(x=>`<option value="${attrEsc(x.id)}">${esc(x.id)} • ${esc(x.title)} (${x.count} câu)</option>`).join('');
    const integrity=p.kind==='v2-zip'?`<span class="badge ok">✓ ${p.verified} chunk checksum đạt</span>`:'<span class="badge">JSON tương thích</span>';
    const body=`<div class="notice"><b>${esc(p.fileName)}</b>${p.createdAt?`${new Date(p.createdAt).toLocaleString('vi-VN')}`:''}${p.version?`V${esc(p.version)}`:''}<br>${integrity}</div><div class="backup-summary"><div><b>${rc.total.toLocaleString('vi-VN')}</b><small>Câu trong file</small></div><div><b>${rc.chapters}</b><small>Phạm vi chương</small></div><div><b>${currentBank().length.toLocaleString('vi-VN')}</b><small>Câu hiện tại</small></div></div><div class="field-grid mt"><div class="field"><label>Phạm vi khôi phục</label><select id="v371RestoreScope">${scopeOptions}</select></div><div class="field"><label>Chế độ</label><select id="v371RestoreMode"><option value="add">Chỉ thêm câu chưa có</option><option value="update">Gộp – câu file cập nhật nếu trùng ID</option><option value="replace">Ghi đè phạm vi đã chọn</option></select></div></div><div class="restore-warnings"><b> luôn kiểm tra cấu trúc câu trước khi ghi.</b><br>Chế độ “Ghi đè” sẽ xóa câu hiện tại trong đúng phạm vi đã chọn rồi nạp câu từ file. Trước thao tác này Data Safety tạo Recovery Snapshot trên IndexedDB.</div>`;
    openModal('Khôi phục ngân hàng ','Chọn phạm vi và cách hợp nhất dữ liệu',body,'<button class="btn btn-soft" onclick="closeModal()">Hủy</button><button class="btn btn-blue" onclick="v371CommitRestore()">Kiểm tra & khôi phục</button>');
  }
  async function readScopeQuestions(p,scope){
    if(p.kind==='json')return clone((p.bank||[]).filter(q=>scope==='ALL'||chapterKey(q)===scope));
    const selected=(p.manifest.chapters||[]).filter(c=>scope==='ALL'||c.id===scope),out=[];for(const c of selected)for(const ch of c.chunks||[]){const e=p.entries.get(ch.path);if(!e)throw new Error(`Thiếu chunk ${ch.path}`);const payload=JSON.parse(dec.decode(e.data));if(payload?.format!==CHUNK_FORMAT||!Array.isArray(payload.questions))throw new Error(`Chunk sai cấu trúc: ${ch.path}`);out.push(...payload.questions)}return clone(out);
  }
  function validateIncoming(bank){
    const seen=new Set(),valid=[],invalid=[];for(let i=0;i<bank.length;i++){const q=bank[i],issues=typeof validateRestoredQuestion==='function'?validateRestoredQuestion(q):(!q?.id||!q?.question?['thiếu id/nội dung']:[]),id=String(q?.id||'').trim();if(id&&seen.has(id))issues.push('trùng mã trong file');if(id)seen.add(id);if(issues.length)invalid.push({index:i,id,issues});else valid.push(q)}return {valid,invalid}
  }
  function scopeMatch(q,scope){return scope==='ALL'||chapterKey(q)===scope}
  function mergeBanks(existing,incoming,scope,mode){
    existing=Array.isArray(existing)?existing:[];incoming=Array.isArray(incoming)?incoming:[];const existingQuestionIds=new Map(existing.filter(q=>q?.id&&q?.questionId).map(q=>[String(q.id),String(q.questionId)]));incoming=incoming.map(q=>{const x=clone(q),keep=existingQuestionIds.get(String(x?.id||''));if(keep)x.questionId=keep;return x});const existingIds=new Set(existing.map(q=>String(q.id)));let next,added=0,updated=0,kept=0;
    if(mode==='add'){const add=incoming.filter(q=>!existingIds.has(String(q.id)));added=add.length;kept=incoming.length-add.length;next=[...existing,...add]}
    else if(mode==='update'){const map=new Map(incoming.map(q=>[String(q.id),q]));updated=existing.filter(q=>map.has(String(q.id))).length;added=incoming.filter(q=>!existingIds.has(String(q.id))).length;next=[...existing.filter(q=>!map.has(String(q.id))),...incoming]}
    else{const outside=existing.filter(q=>!scopeMatch(q,scope));added=incoming.length;next=[...outside,...incoming]}
    try{window.QuestionIdV40?.ensureBank?.(next,{saveChanges:false,reason:'v371-restore-question-id'})}catch(_){}
    return {next,added,updated,kept}
  }

  async function checkpointBeforeRestore(mode){
    let snap=null;try{if(typeof v26SafetyCheckpoint==='function')snap=await v26SafetyCheckpoint(`bank-v371-${mode}`);else if(typeof v21CreateRecoverySnapshot==='function')snap=await v21CreateRecoverySnapshot(`bank-v371-${mode}`,false)}catch(_){snap=null}return snap
  }
  async function commitRestore(){
    if(!pendingRestore)return;const scope=document.getElementById('v371RestoreScope')?.value||'ALL',mode=document.getElementById('v371RestoreMode')?.value||'add';
    try{
      try{window.QuestionIdV40?.reconcileHighWater?.(pendingRestore?.questionIdMeta?.highWater||pendingRestore?.manifest?.questionIdMeta?.highWater)}catch(_){}
      const incoming=await readScopeQuestions(pendingRestore,scope),checked=validateIncoming(incoming);if(!checked.valid.length)return alert('Không có câu hợp lệ để khôi phục.');
      const existing=currentBank(),existingIds=new Set(existing.map(q=>String(q.id))),incomingIds=new Set(checked.valid.map(q=>String(q.id))),duplicates=checked.valid.filter(q=>existingIds.has(String(q.id))).length;
      let msg=`Phạm vi: ${scope==='ALL'?'toàn bộ file':scope}\nCâu hợp lệ: ${checked.valid.length}\nCâu lỗi bỏ qua: ${checked.invalid.length}\nID đã tồn tại: ${duplicates}.`;
      if(mode==='replace'){
        const affected=existing.filter(q=>scopeMatch(q,scope)).length,token=prompt(`${msg}\n\nGHI ĐÈ sẽ xóa ${affected} câu hiện tại trong phạm vi này trước khi nạp file.\nData Safety sẽ tạo Recovery Snapshot.\n\nNhập THAYTHE để xác nhận:`);if(String(token||'').trim().toUpperCase()!=='THAYTHE')return;
      }else if(!confirm(`${msg}\n\nTiếp tục khôi phục?`))return;
      const snap=await checkpointBeforeRestore(mode);if(mode==='replace'&&!snap&&typeof v21CreateRecoverySnapshot==='function'&&!confirm('Không tạo được Recovery Snapshot. Tiếp tục ghi đè vẫn có rủi ro. Thầy/cô có chắc chắn?'))return;
      const merged=mergeBanks(existing,checked.valid,scope,mode),{next,added,updated,kept}=merged;
      state.questionBank=next;state._meta=state._meta||{};state._meta.lastQuestionBankRestoreV371={at:new Date().toISOString(),source:pendingRestore.fileName,scope,mode,incoming:checked.valid.length,invalid:checked.invalid.length,added,updated,kept,recoverySnapshotId:snap?.id||''};
      save({reason:`v371-bank-restore-${mode}`});try{if(typeof v21MirrorStateNow==='function')await v21MirrorStateNow()}catch(_){};pendingRestore=null;closeModal();renderQuestionBank?.(true);examToast?.(` khôi phục xong • ${state.questionBank.length} câu.`);alert(`Khôi phục thành công.\n\nNgân hàng hiện có: ${state.questionBank.length} câu\nThêm: ${added}${updated?`\nCập nhật: ${updated}`:''}${kept?`\nGiữ câu hiện tại do trùng ID: ${kept}`:''}${checked.invalid.length?`\nBỏ qua câu lỗi: ${checked.invalid.length}`:''}${snap?.id?'\nRecovery Snapshot: đã tạo':'\nRecovery Snapshot: không xác nhận được'}`);
    }catch(err){alert('Khôi phục thất bại: '+(err?.message||err))}
  }

  async function undoLastRestore(){
    if(!requireTeacher?.('Hoàn tác khôi phục'))return;const info=state?._meta?.lastQuestionBankRestoreV371,id=info?.recoverySnapshotId||'';
    if(id&&typeof v21RestoreSnapshot==='function'){if(!confirm(`Hoàn tác lần khôi phục  từ file “${info.source||''}”?\nHệ thống sẽ phục hồi Recovery Snapshot trước thao tác đó.`))return;return v21RestoreSnapshot(id)}
    if(typeof undoLastBankRestore==='function')return undoLastBankRestore();alert('Chưa có Recovery Snapshot để hoàn tác.')
  }

  function patchToolbar(){
    const toolbar=document.querySelector('#page-question-bank .toolbar');if(!toolbar||toolbar.querySelector('[data-v371-backup]'))return;const old=[...toolbar.querySelectorAll('button')].find(b=>/Sao lưu/.test(b.textContent||''));if(old){old.textContent='⬇ Backup V2';old.setAttribute('onclick','v371OpenBackupCenter()');old.dataset.v371Backup='1'}const restore=[...toolbar.querySelectorAll('button')].find(b=>/Khôi phục/.test(b.textContent||''));if(restore){restore.textContent='↥ Khôi phục V2';restore.setAttribute('onclick','v371ChooseRestore()')}
  }
  function patchProductionCenter(){
    // Expose deterministic smoke-test information for  Trung tâm vận hành/manual diagnostics.
    globalThis.V371_BACKUP_STATUS={build:BUILD,schema:SCHEMA,zip:'STORE',chunkDefault:DEFAULT_CHUNK,checksum:'SHA-256+CRC32',legacyJson:true};
  }
  function init(){patchToolbar();patchProductionCenter();setTimeout(patchToolbar,600);setTimeout(patchToolbar,1800)}

  globalThis.v371OpenBackupCenter=renderBackupCenter;
  globalThis.v371ExportFullZip=exportFullZip;
  globalThis.v371ExportChapterZip=exportChapterZip;
  globalThis.v371ExportChapterJson=exportChapterJson;
  globalThis.v371ExportLegacyJson=exportLegacyJson;
  globalThis.v371ChooseRestore=chooseRestore;
  globalThis.v371CommitRestore=commitRestore;
  globalThis.v371UndoLastRestore=undoLastRestore;
  globalThis.v371BackupV2={build:BUILD,format:FORMAT,schema:SCHEMA,chapterKey,groupBank,packageEntries,readZip,makeZip,crc32,sha256,loadZipBackup,parseJsonBackup,validateIncoming,_test:{makeZip,readZip,crc32,chapterKey,chunkArray,validChunkSize,mergeBanks,scopeMatch}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
