/* Math12 Hub  — AI Teacher Assistant
   Gemini client-side assistant for teacher-reviewed drafting/auditing only.
   API keys never enter app state, Firestore, backups or audit logs. */
const V32_AI_SCHEMA=32;
const V32_AI_DEFAULT_MODEL='gemini-3.7-flash';
const V32_AI_SETTINGS_KEY='math12hub.ai.v32.settings';
const V32_AI_KEY_LOCAL='math12hub.ai.v32.key';
const V32_AI_KEY_SESSION='math12hub.ai.v32.sessionKey';
const V32_AI_DRAFTS_KEY='math12hub.ai.v32.drafts';
const V32_AI_USAGE_KEY='math12hub.ai.v32.usage';
const V40133_RATE_KEY='math12hub.ai.v40.13.3.rate';
function v40133RateState(){
  const x=v32SafeParse(localStorage.getItem(V40133_RATE_KEY)||'{}',{}),now=Date.now(),events=Array.isArray(x.events)?x.events.filter(e=>now-Number(e?.at||0)<10*60*1000).slice(-160):[];
  return {events,knownLimit:Math.max(0,Number(x.knownLimit)||0),knownLimitAt:Number(x.knownLimitAt)||0,last429At:Number(x.last429At)||0,lastRetryAfterSec:Math.max(0,Number(x.lastRetryAfterSec)||0),lastMetric:String(x.lastMetric||''),updatedAt:Number(x.updatedAt)||0}
}
function v40133RateSave(s={}){try{localStorage.setItem(V40133_RATE_KEY,JSON.stringify({...s,events:(s.events||[]).slice(-160),updatedAt:Date.now()}))}catch(_){}}
function v40133RetrySeconds(response,data={}){
  let sec=0;const h=String(response?.headers?.get?.('retry-after')||'').trim();if(h&&/^\d+(?:\.\d+)?$/.test(h))sec=Math.max(sec,Number(h));
  const details=Array.isArray(data?.error?.details)?data.error.details:[];for(const d of details){const raw=String(d?.retryDelay||d?.retry_delay||'');const m=raw.match(/([0-9]+(?:\.[0-9]+)?)s/i);if(m)sec=Math.max(sec,Number(m[1]))}
  const msg=String(data?.error?.message||'');const patterns=[/Please retry in\s*([0-9]+(?:\.[0-9]+)?)s/i,/retry after\s*([0-9]+(?:\.[0-9]+)?)\s*s/i,/thử lại sau\s*([0-9]+(?:[\.,][0-9]+)?)/i];for(const re of patterns){const m=msg.match(re);if(m)sec=Math.max(sec,Number(String(m[1]).replace(',','.'))||0)}
  return sec?Math.max(1,Math.ceil(sec)):0
}
function v40133QuotaInfo(data={}){
  const msg=String(data?.error?.message||''),details=Array.isArray(data?.error?.details)?data.error.details:[];let limit=0,metric='';
  let m=msg.match(/limit:\s*([0-9]+)/i);if(m)limit=Number(m[1])||0;m=msg.match(/metric:\s*([^,\n]+)/i);if(m)metric=String(m[1]||'').trim();
  for(const d of details){for(const v of (d?.violations||d?.quotaViolations||[])){if(!metric)metric=String(v?.quotaMetric||v?.quotaId||v?.metric||'');if(!limit)limit=Number(v?.quotaValue||v?.limit)||0}}
  return {limit,metric}
}
function v40133RecordRateResult(response,data={},model=''){
  const s=v40133RateState(),now=Date.now(),status=Number(response?.status)||0,qi=v40133QuotaInfo(data),retry=v40133RetrySeconds(response,data);s.events.push({at:now,status,ok:!!response?.ok,model:String(model||'')});if(qi.limit){s.knownLimit=qi.limit;s.knownLimitAt=now}if(qi.metric)s.lastMetric=qi.metric;if(status===429){s.last429At=now;s.lastRetryAfterSec=retry||s.lastRetryAfterSec}v40133RateSave(s)
}
function v40133RateSummary(){const s=v40133RateState(),now=Date.now(),recent60=s.events.filter(e=>now-e.at<60000),recentOk=recent60.filter(e=>e.ok).length,recent429=recent60.filter(e=>e.status===429).length;return {...s,recent60:recent60.length,recentOk,recent429}}
function v40133RateLimitError(response,data={},fallback=''){
  const detail=String(data?.error?.message||fallback||'Đã chạm hạn mức/tốc độ Gemini.').slice(0,900),qi=v40133QuotaInfo(data),retry=v40133RetrySeconds(response,data),e=new Error(`Gemini 429: ${detail}`);e.status=429;e.code='GEMINI_RATE_LIMIT';e.retryAfterSec=retry;e.quotaLimit=qi.limit;e.quotaMetric=qi.metric;e.geminiData=data;return e
}
let v32AiDrafts=[];
let v32AiSelectedFile=null;
let v32AiBusy=false;
let v32AiLastAudit=null;

function v32JsonClone(x){return JSON.parse(JSON.stringify(x))}
function v32Now(){return new Date().toISOString()}
function v32SafeParse(raw,fallback){try{return JSON.parse(raw)}catch(_){return fallback}}
function v32AiSettings(){
  const s=v32SafeParse(localStorage.getItem(V32_AI_SETTINGS_KEY)||'{}',{});return {
    model:String(s.model||V32_AI_DEFAULT_MODEL).trim()||V32_AI_DEFAULT_MODEL,
    keyMode:s.keyMode==='device'?'device':'session',
    temperature:Math.max(0,Math.min(.7,Number(s.temperature)||.15)),
    thinkingLevel:['low','medium','high'].includes(s.thinkingLevel)?s.thinkingLevel:'medium'
  }
}
function v32AiGetKey(){const s=v32AiSettings();return String((s.keyMode==='device'?localStorage.getItem(V32_AI_KEY_LOCAL):sessionStorage.getItem(V32_AI_KEY_SESSION))||'').trim()}
function v32AiKeyMasked(){const k=v32AiGetKey();return k?`${k.slice(0,5)}•${k.slice(-4)}`:'Chưa cấu hình'}
function v32AiSaveSettings(show=true){
  if(!requireTeacher('Cài đặt AI'))return;const model=(document.getElementById('v32AiModel')?.value||V32_AI_DEFAULT_MODEL).trim(),key=(document.getElementById('v32AiKey')?.value||'').trim(),keyMode=document.getElementById('v32AiKeyMode')?.value==='device'?'device':'session',thinkingLevel=document.getElementById('v32AiThinking')?.value||'medium';
  localStorage.setItem(V32_AI_SETTINGS_KEY,JSON.stringify({model,keyMode,temperature:.15,thinkingLevel,schemaVersion:32,updatedAt:v32Now()}));
  if(key){if(keyMode==='device'){localStorage.setItem(V32_AI_KEY_LOCAL,key);sessionStorage.removeItem(V32_AI_KEY_SESSION)}else{sessionStorage.setItem(V32_AI_KEY_SESSION,key);localStorage.removeItem(V32_AI_KEY_LOCAL)}}
  const keyEl=document.getElementById('v32AiKey');if(keyEl)keyEl.value='';v32RenderAiStatus();if(show)examToast?.('Đã lưu cài đặt AI . API key không được đưa lên Firestore.')
}
function v32AiClearKey(){if(!requireTeacher('Xóa API key'))return;if(!confirm('Xóa API key Gemini đã lưu trên trình duyệt này?'))return;localStorage.removeItem(V32_AI_KEY_LOCAL);sessionStorage.removeItem(V32_AI_KEY_SESSION);v32RenderAiStatus();examToast?.('Đã xóa API key Gemini.')}
function v32AiLoadDrafts(){
  const arr=v32SafeParse(localStorage.getItem(V32_AI_DRAFTS_KEY)||'[]',[]);v32AiDrafts=Array.isArray(arr)?arr.slice(0,40):[];return v32AiDrafts
}
function v32AiPersistDrafts(){
  v32AiDrafts=(v32AiDrafts||[]).slice(0,40);let raw=JSON.stringify(v32AiDrafts);while(raw.length>420000&&v32AiDrafts.length>5){v32AiDrafts.pop();raw=JSON.stringify(v32AiDrafts)}
  try{localStorage.setItem(V32_AI_DRAFTS_KEY,raw)}catch(err){console.warn(' AI draft storage',err);v32AiDrafts=v32AiDrafts.slice(0,10);try{localStorage.setItem(V32_AI_DRAFTS_KEY,JSON.stringify(v32AiDrafts))}catch(_){}}
}
function v32AiUsage(){return v32SafeParse(localStorage.getItem(V32_AI_USAGE_KEY)||'{}',{requests:0,totalTokens:0,lastAt:''})}
function v32AiRecordUsage(meta={}){const u=v32AiUsage();u.requests=(Number(u.requests)||0)+1;u.totalTokens=(Number(u.totalTokens)||0)+(Number(meta.totalTokenCount)||Number(meta.totalTokens)||0);u.lastAt=v32Now();localStorage.setItem(V32_AI_USAGE_KEY,JSON.stringify(u));return u}
function v32CurriculumDigest(){return allKnowledgeCodes().map(k=>`${k.code}|F${k.chapterId}|${k.lessonId}|${k.level}|${k.title}`).join('\n')}
function v32AiSystemInstruction(){return `Bạn là trợ lý BIÊN TẬP môn Toán 12 Việt Nam theo Chương trình GDPT 2018. Mọi kết quả chỉ là bản nháp để giáo viên duyệt.\nQuy tắc bắt buộc:\n- Không bịa nội dung không đọc rõ từ ảnh/PDF; chỗ không chắc phải đưa vào warnings.\n- Công thức viết LaTeX trong $...$; không dùng ký hiệu Unicode thay cho LaTeX nếu có thể.\n- MCQ phải đúng 4 phương án A,B,C,D, đúng duy nhất 1 phương án; tránh hai đáp án tương đương.\n- TF4 phải đúng 4 ý a,b,c,d có liên hệ logic; ưu tiên ý sau dựa trên dữ kiện/kết quả ý trước khi phù hợp.\n- SHORT có đáp án ngắn, rõ và có thể chấm tự động.\n- Phân loại theo đúng mã kiến thức được cung cấp; nếu không chắc, giảm confidence và ghi warnings.\n- Luôn tự kiểm tra phép tính/đáp án trước khi trả kết quả.\n- Không đánh dấu nội dung là đã duyệt chuyên môn; giáo viên là người duyệt cuối.`}
function v32QuestionResponseSchema(){return {type:'object',properties:{questions:{type:'array',minItems:1,maxItems:10,items:{type:'object',properties:{question:{type:'string'},type:{type:'string',enum:['mcq','tf4','short']},options:{type:'array',items:{type:'string'},maxItems:4},answerText:{type:'string'},statements:{type:'array',maxItems:4,items:{type:'object',properties:{text:{type:'string'},answer:{type:'boolean'},explanation:{type:'string'}},required:['text','answer','explanation']}},explanation:{type:'string'},lessonId:{type:'string'},knowledgeCode:{type:'string'},level:{type:'string',enum:['NB','TH','VD']},form:{type:'string'},difficulty:{type:'integer',minimum:1,maximum:5},tags:{type:'array',items:{type:'string'},maxItems:8},confidence:{type:'integer',minimum:0,maximum:100},warnings:{type:'array',items:{type:'string'},maxItems:8},sourceNote:{type:'string'}},required:['question','type','options','answerText','statements','explanation','lessonId','knowledgeCode','level','form','difficulty','tags','confidence','warnings','sourceNote']}}},required:['questions']}}
function v32AuditResponseSchema(){return {type:'object',properties:{status:{type:'string',enum:['ok','needs_review','critical']},confidence:{type:'integer',minimum:0,maximum:100},summary:{type:'string'},issues:{type:'array',maxItems:12,items:{type:'object',properties:{severity:{type:'string',enum:['info','warn','critical']},category:{type:'string'},message:{type:'string'},suggestion:{type:'string'}},required:['severity','category','message','suggestion']}},answerCheck:{type:'object',properties:{valid:{type:'boolean'},reason:{type:'string'},alternativeAnswer:{type:'string'}},required:['valid','reason','alternativeAnswer']},recommended:{type:'object',properties:{lessonId:{type:'string'},knowledgeCode:{type:'string'},level:{type:'string',enum:['NB','TH','VD']},difficulty:{type:'integer',minimum:1,maximum:5},tags:{type:'array',items:{type:'string'},maxItems:8}},required:['lessonId','knowledgeCode','level','difficulty','tags']}},required:['status','confidence','summary','issues','answerCheck','recommended']}}
function v32ExtractJsonText(data){
  const parts=data?.candidates?.[0]?.content?.parts||[];let text=parts.map(p=>p.text||'').join('').trim();if(!text)throw new Error(data?.promptFeedback?.blockReason?`Yêu cầu bị chặn: ${data.promptFeedback.blockReason}`:'Gemini không trả về nội dung.');text=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();try{return JSON.parse(text)}catch(err){throw new Error('Gemini trả dữ liệu không phải JSON hợp lệ. Hãy thử lại hoặc đổi model.')}
}
function v32GeminiNormalizePart(part={}){
  if(!part||typeof part!=='object')return part;
  if(part.inline_data){const x=part.inline_data||{};return {inlineData:{mimeType:x.mimeType||x.mime_type||'application/octet-stream',data:x.data||''}}}
  if(part.inlineData){const x=part.inlineData||{};return {inlineData:{mimeType:x.mimeType||x.mime_type||'application/octet-stream',data:x.data||''}}}
  if(part.file_data){const x=part.file_data||{};return {fileData:{mimeType:x.mimeType||x.mime_type||'',fileUri:x.fileUri||x.file_uri||''}}}
  return part
}
function v32GeminiJsonContract(schema){
  let raw='';try{raw=JSON.stringify(schema)}catch(_){raw=''}
  return `\n\nYÊU CẦU ĐẦU RA: Chỉ trả về đúng MỘT JSON object hợp lệ, không Markdown, không code fence, không lời dẫn. Cố gắng tuân thủ schema sau: ${raw.slice(0,18000)}`
}
function v40132JsonSchema(schema){
  const allowed=new Set(['$id','$defs','$ref','$anchor','type','format','title','description','enum','items','prefixItems','minItems','maxItems','minimum','maximum','anyOf','oneOf','properties','additionalProperties','required','propertyOrdering']);
  function walk(v){if(Array.isArray(v))return v.map(walk);if(!v||typeof v!=='object')return v;const out={};for(const [k,val] of Object.entries(v)){if(!allowed.has(k))continue;out[k]=walk(val)}return out}
  return walk(schema||{type:'object'})
}
function v40132LegacySchema(schema){
  const map={object:'OBJECT',array:'ARRAY',string:'STRING',integer:'INTEGER',number:'NUMBER',boolean:'BOOLEAN'};
  function walk(v){if(Array.isArray(v))return v.map(walk);if(!v||typeof v!=='object')return v;const out={};for(const [k,val] of Object.entries(v)){if(k==='type'&&typeof val==='string')out[k]=map[val.toLowerCase()]||String(val).toUpperCase();else out[k]=walk(val)}return out}
  return walk(schema||{type:'object'})
}
function v40132GeminiErrorReason(data={}){
  const details=Array.isArray(data?.error?.details)?data.error.details:[];const info=details.find(x=>x&&typeof x==='object'&&(x.reason||String(x['@type']||'').includes('ErrorInfo')));return String(info?.reason||data?.error?.status||'').toUpperCase()
}
function v32GeminiInvalidArgument(response,data){return response?.status===400||String(data?.error?.status||'').toUpperCase()==='INVALID_ARGUMENT'}
function v40132AuthErrorMessage(key,response,data){
  const reason=v40132GeminiErrorReason(data),msg=String(data?.error?.message||'Không thể xác thực Gemini.').slice(0,360);if(response?.status===401||reason.includes('UNAUTHENTICATED')||reason.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')){const aq=String(key||'').startsWith('AQ.');return `Gemini 401: không xác thực được API key${aq?' dạng AQ':''}. ${reason?`Mã: ${reason}. `:''}${msg}`};return ''
}
async function v32GeminiGenerate(parts,schema,{timeoutMs=90000,systemInstruction=''}={}){
  if(v32AiBusy)throw new Error('AI đang xử lý một yêu cầu khác.');const key=v32AiGetKey();if(!key)throw new Error('Chưa có Gemini API key. Hãy lưu API key trong Cài đặt AI .');const s=v32AiSettings(),model=s.model||V32_AI_DEFAULT_MODEL,url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  v32AiBusy=true;v32RenderAiStatus();
  const cleanParts=(parts||[]).map(v32GeminiNormalizePart),systemText=String(systemInstruction||v32AiSystemInstruction()),base={contents:[{role:'user',parts:cleanParts}],systemInstruction:{parts:[{text:systemText}]}};
  const jsonSchema=v40132JsonSchema(schema),legacySchema=v40132LegacySchema(schema);
  const attempts=[
    {name:'json-schema',generationConfig:{thinkingConfig:{thinkingLevel:s.thinkingLevel},responseMimeType:'application/json',responseJsonSchema:jsonSchema}},
    {name:'json-schema-no-thinking',generationConfig:{responseMimeType:'application/json',responseJsonSchema:jsonSchema}},
    {name:'json-no-schema',generationConfig:{thinkingConfig:{thinkingLevel:s.thinkingLevel},responseMimeType:'application/json'},contract:true},
    {name:'json-no-schema-no-thinking',generationConfig:{responseMimeType:'application/json'},contract:true},
    {name:'legacy-response-schema',generationConfig:{responseMimeType:'application/json',responseSchema:legacySchema}},
    {name:'minimal-plain',minimal:true,contract:true}
  ];
  let response=null,data={},lastMessage='',used='';
  try{
    for(let i=0;i<attempts.length;i++){
      const a=attempts[i];let payload;
      if(a.minimal){const contract=systemText+v32GeminiJsonContract(schema),pp=[{text:contract},...cleanParts];payload={contents:[{role:'user',parts:pp}]}}
      else{payload=v32JsonClone(base);payload.generationConfig=a.generationConfig;if(a.contract)payload.systemInstruction.parts[0].text=systemText+v32GeminiJsonContract(schema)}
      response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(payload),signal:controller.signal});data=await response.json().catch(()=>({}));used=a.name;v40133RecordRateResult(response,data,model);
      if(response.ok)break;lastMessage=String(data?.error?.message||'Không thể xử lý yêu cầu.');const auth=v40132AuthErrorMessage(key,response,data);if(auth)throw new Error(auth);if(response.status===429)throw v40133RateLimitError(response,data,lastMessage);
      if(!v32GeminiInvalidArgument(response,data))break;
      console.warn(`[Math12 Hub AI] Gemini ${response.status} INVALID_ARGUMENT ở chế độ ${a.name}; tự thử cấu hình tương thích tiếp theo.`);
    }
    if(!response?.ok){const detail=String(data?.error?.message||lastMessage||'Không thể xử lý yêu cầu.').slice(0,420);if(v32GeminiInvalidArgument(response,data))throw new Error(`Gemini ${response?.status||400}: API từ chối request sau nhiều chế độ tương thích (JSON Schema → JSON thường → legacy schema → payload tối giản). ${detail}`);throw new Error(`Gemini ${response?.status||''}: ${detail}`)}
    v32AiRecordUsage(data?.usageMetadata||{});return {json:v32ExtractJsonText(data),usage:data?.usageMetadata||{},model,transport:used};
  }catch(err){if(err?.name==='AbortError')throw new Error('Yêu cầu AI quá thời gian chờ. Hãy thử lại với ít nội dung hơn.');throw err}finally{clearTimeout(timer);v32AiBusy=false;v32RenderAiStatus()}
}
function v32FileToInlinePart(file){return new Promise((resolve,reject)=>{if(!file)return resolve(null);const max=file.type==='application/pdf'?12*1024*1024:8*1024*1024;if(file.size>max)return reject(new Error(`Tệp quá lớn.  giới hạn ${Math.round(max/1024/1024)} MB cho ${file.type==='application/pdf'?'PDF':'ảnh'} để tránh trình duyệt quá tải.`));const ok=/^(image\/(png|jpeg|jpg|webp)|application\/pdf)$/i.test(file.type||'');if(!ok)return reject(new Error(' chỉ nhận PNG, JPG/JPEG, WEBP hoặc PDF.'));const r=new FileReader();r.onerror=()=>reject(new Error('Không đọc được tệp.'));r.onload=()=>{const data=String(r.result||'').split(',')[1]||'';resolve({inlineData:{mimeType:file.type||'application/octet-stream',data}})};r.readAsDataURL(file)})}
function v32AiHandleFile(input){v32AiSelectedFile=input?.files?.[0]||null;const box=document.getElementById('v32AiFileMeta');if(box)box.textContent=v32AiSelectedFile?`${v32AiSelectedFile.name} • ${(v32AiSelectedFile.size/1024/1024).toFixed(2)} MB • ${v32AiSelectedFile.type||'file'}`:'Chưa chọn tệp.'}
function v32ResolveKnowledge(q={}){
  const codes=allKnowledgeCodes();let meta=codes.find(k=>k.code===String(q.knowledgeCode||'').trim());if(!meta&&q.lessonId)meta=codes.find(k=>k.lessonId===q.lessonId&&k.level===q.level)||codes.find(k=>k.lessonId===q.lessonId);if(!meta)meta=codes[0];return meta
}
function v32AnswerIndex(answerText='',options=[]){const a=String(answerText||'').trim();if(/^[A-D]$/i.test(a))return a.toUpperCase().charCodeAt(0)-65;if(/^\d+$/.test(a)){const n=Number(a);if(n>=0&&n<options.length)return n;if(n>=1&&n<=options.length)return n-1}const ix=options.findIndex(o=>v29NormalizeText?.(o)===v29NormalizeText?.(a));return ix>=0?ix:0}
function v32NormalizeAiQuestion(raw={},origin={}){
  const meta=v32ResolveKnowledge(raw),type=['mcq','tf4','short'].includes(raw.type)?raw.type:'mcq',options=(raw.options||[]).map(x=>String(x||'').trim()).filter(Boolean).slice(0,4),statements=(raw.statements||[]).slice(0,4).map(s=>({text:String(s?.text||'').trim(),answer:!!s?.answer,explanation:String(s?.explanation||'').trim()}));
  let q={id:`AI32-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,chapterId:Number(meta.chapterId)||1,lessonId:meta.lessonId,knowledgeCode:meta.code,level:['NB','TH','VD'].includes(raw.level)?raw.level:meta.level,type,question:String(raw.question||'').trim(),explanation:String(raw.explanation||'').trim(),form:String(raw.form||meta.title||'').trim(),difficulty:Math.min(5,Math.max(1,Number(raw.difficulty)||v29DefaultDifficulty(raw.level||meta.level))),tags:v29NormalizeTags?.(raw.tags||[])||[],reviewStatus:'draft',source:'ai-v32',sourceName:`AI  • ${origin.model||v32AiSettings().model}`,sourceYear:String(new Date().getFullYear()),createdAt:v32Now(),updatedAt:v32Now(),version:1,_versions:[],aiV32:{schemaVersion:32,model:origin.model||v32AiSettings().model,task:origin.task||'extract',sourceKind:origin.sourceKind||'text',generatedAt:v32Now(),confidence:Math.min(100,Math.max(0,Number(raw.confidence)||0)),warnings:(raw.warnings||[]).map(x=>String(x||'').slice(0,240)).slice(0,8),sourceNote:String(raw.sourceNote||'').slice(0,400),teacherReviewed:false}};
  if(type==='mcq'){while(options.length<4)options.push('');q.options=options.slice(0,4);q.answer=v32AnswerIndex(raw.answerText,options)}else if(type==='tf4'){q.statements=statements;while(q.statements.length<4)q.statements.push({text:'',answer:false,explanation:''})}else q.answer=String(raw.answerText||'').trim();
  return typeof v29NormalizeQuestion==='function'?v29NormalizeQuestion(q):q
}
function v32LocalDraftChecks(q={}){
  const issues=[];if(String(q.question||'').length<12)issues.push('Nội dung quá ngắn');if(!allKnowledgeCodes().some(k=>k.code===q.knowledgeCode))issues.push('Mã kiến thức không hợp lệ');if(q.type==='mcq'){if((q.options||[]).length!==4||(q.options||[]).some(x=>!String(x).trim()))issues.push('MCQ chưa đủ 4 phương án');const norm=(q.options||[]).map(v29NormalizeText);if(new Set(norm).size!==norm.length)issues.push('Có phương án trùng nhau');if(!(Number(q.answer)>=0&&Number(q.answer)<4))issues.push('Đáp án MCQ chưa hợp lệ')}if(q.type==='tf4'&&(q.statements||[]).filter(s=>String(s.text||'').trim()).length!==4)issues.push('TF4 chưa đủ 4 ý');if(q.type==='short'&&!String(q.answer||'').trim())issues.push('Thiếu đáp án ngắn');if(!String(q.explanation||'').trim())issues.push('Thiếu lời giải');
  let duplicate=null,best=0;for(const b of (state.questionBank||[])){if(b.type!==q.type||Number(b.chapterId)!==Number(q.chapterId))continue;const sc=typeof v29Similarity==='function'?v29Similarity(q,b):0;if(sc>best){best=sc;duplicate=b}}return {issues,duplicate:best>=.72?{id:duplicate?.id||'',score:best}:null,quality:typeof v29QuestionQuality==='function'?v29QuestionQuality(q):{score:0,issues:[]}}
}
function v32AddAiDrafts(rawQuestions=[],origin={}){const list=(rawQuestions||[]).map(r=>({draftId:`D32-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`,createdAt:v32Now(),model:origin.model||v32AiSettings().model,sourceKind:origin.sourceKind||'text',task:origin.task||'extract',question:v32NormalizeAiQuestion(r,origin)}));v32AiDrafts=[...list,...v32AiDrafts].slice(0,40);v32AiPersistDrafts();v32RenderAiDraftQueue();v32RenderAiMetrics();return list}
function v32AiTargetDescription(){const lid=document.getElementById('v32AiTargetLesson')?.value||'';if(!lid)return 'Tự phân loại bài và mã kiến thức phù hợp.';const l=getLesson(lid),ks=getLessonMeta(lid).knowledge;return `Chỉ dùng bài ${lid} — ${l?.common||''}. Mã hợp lệ: ${ks.map(k=>`${k.code} (${k.level}: ${k.title})`).join('; ')}.`}
async function v32AiExtractQuestions(){
  if(!requireTeacher('AI tạo bản nháp'))return;const text=(document.getElementById('v32AiSourceText')?.value||'').trim(),file=v32AiSelectedFile,count=Math.min(10,Math.max(1,Number(document.getElementById('v32AiCount')?.value)||3)),typePolicy=document.getElementById('v32AiTypePolicy')?.value||'mixed';if(!text&&!file)return alert('Hãy dán nội dung/LaTeX hoặc chọn ảnh/PDF.');
  const status=document.getElementById('v32AiRunStatus');if(status)status.innerHTML='<span class="v32-ai-spinner"></span> Đang đọc nguồn và kiểm tra cấu trúc…';
  try{const parts=[{text:`Nhiệm vụ: trích xuất/biên tập tối đa ${count} câu hỏi Toán 12 từ nguồn giáo viên cung cấp.\n${v32AiTargetDescription()}\nLoại câu mong muốn: ${typePolicy==='mixed'?'trộn hợp lý mcq/tf4/short':typePolicy}.\nNếu nguồn là đề có sẵn, ưu tiên chép trung thực rồi chuẩn hóa LaTeX. Nếu nguồn chỉ là ý tưởng, có thể biên tập thành câu hoàn chỉnh nhưng phải ghi rõ trong sourceNote.\nDanh mục mã kiến thức:\n${v32CurriculumDigest()}\n${text?`\nVăn bản/LaTeX nguồn:\n${text.slice(0,28000)}`:''}`}];const media=await v32FileToInlinePart(file);if(media)parts.push(media);const res=await v32GeminiGenerate(parts,v32QuestionResponseSchema());const added=v32AddAiDrafts(res.json?.questions||[],{model:res.model,task:'extract',sourceKind:file?(text?'text+file':'file'):'text'});if(status)status.textContent=`✓ Đã tạo ${added.length} bản nháp. Hãy kiểm tra từng câu trước khi đưa vào ngân hàng.`;document.getElementById('v32AiDraftQueue')?.scrollIntoView({behavior:'smooth',block:'start'})}catch(err){if(status)status.textContent='';alert(err.message||String(err))}
}
function v32BankQuestionByInput(){const id=(document.getElementById('v32AiBankId')?.value||'').trim();return (state.questionBank||[]).find(q=>q.id===id)||null}
function v32AiQuestionPayload(q={}){return {id:q.id,chapterId:q.chapterId,lessonId:q.lessonId,knowledgeCode:q.knowledgeCode,level:q.level,type:q.type,question:q.question,options:q.options||[],answer:q.type==='mcq'?String.fromCharCode(65+(Number(q.answer)||0)):q.answer,statements:q.statements||[],explanation:q.explanation,form:q.form,difficulty:q.difficulty,tags:q.tags||[],sourceName:q.sourceName||''}}
async function v32AiAuditSelected(){
  if(!requireTeacher('AI kiểm định câu hỏi'))return;const q=v32BankQuestionByInput();if(!q)return alert('Nhập/chọn đúng mã câu trong ngân hàng.');const box=document.getElementById('v32AiAuditResult');if(box)box.innerHTML='<div class="v32-ai-loading"><span class="v32-ai-spinner"></span> AI đang kiểm tra đáp án, cấu trúc và phân loại…</div>';
  try{const local=v32LocalDraftChecks(q),prompt=`Kiểm định câu hỏi sau như một phản biện độc lập. Kiểm tra toán học, duy nhất đáp án, dữ kiện, LaTeX, mức độ, mã kiến thức và khả năng gây hiểu nhầm. Không tự sửa câu.\nDanh mục mã kiến thức:\n${v32CurriculumDigest()}\n\nCâu cần kiểm định:\n${JSON.stringify(v32AiQuestionPayload(q))}\n\nKiểm tra local đã phát hiện: ${JSON.stringify({issues:local.issues,nearDuplicate:local.duplicate})}`;const res=await v32GeminiGenerate([{text:prompt}],v32AuditResponseSchema());v32AiLastAudit={questionId:q.id,stableQuestionId:q.questionId||'',result:res.json,model:res.model,at:v32Now()};v32RenderAuditResult()}catch(err){if(box)box.innerHTML=`<div class="firebase-banner error">${esc(err.message||String(err))}</div>`}
}
async function v32AiGenerateVariants(){
  if(!requireTeacher('AI tạo biến thể'))return;const q=v32BankQuestionByInput();if(!q)return alert('Nhập/chọn đúng mã câu trong ngân hàng.');const n=Math.min(5,Math.max(1,Number(document.getElementById('v32AiVariantCount')?.value)||3)),box=document.getElementById('v32AiAuditResult');if(box)box.innerHTML='<div class="v32-ai-loading"><span class="v32-ai-spinner"></span> Đang tạo biến thể và tự kiểm tra đáp án…</div>';
  try{const prompt=`Tạo ${n} biến thể KHÁC DỮ LIỆU nhưng cùng mã kiến thức, cùng loại câu và gần cùng độ khó với câu gốc. Không chỉ đổi tên biến; hãy thay số liệu/ngữ cảnh hợp lý, ưu tiên nghiệm/đáp án đẹp. Mỗi biến thể phải tự giải lại, có đáp án duy nhất và lời giải. Không sao chép nguyên văn câu gốc.\nGiữ lessonId=${q.lessonId}, knowledgeCode=${q.knowledgeCode}, level=${q.level}, type=${q.type}.\nCâu gốc:\n${JSON.stringify(v32AiQuestionPayload(q))}`;const res=await v32GeminiGenerate([{text:prompt}],v32QuestionResponseSchema());const list=(res.json?.questions||[]).map(x=>({...x,lessonId:q.lessonId,knowledgeCode:q.knowledgeCode,level:q.level,type:q.type,difficulty:Number(x.difficulty)||Number(q.difficulty)||3}));const added=v32AddAiDrafts(list,{model:res.model,task:'variant',sourceKind:`bank:${q.id}`});if(box)box.innerHTML=`<div class="firebase-banner"><b>✓ Đã tạo ${added.length} biến thể.</b> Các câu đang ở Hàng chờ AI, chưa vào ngân hàng.</div>`;document.getElementById('v32AiDraftQueue')?.scrollIntoView({behavior:'smooth',block:'start'})}catch(err){if(box)box.innerHTML=`<div class="firebase-banner error">${esc(err.message||String(err))}</div>`}
}
function v32RenderAuditResult(){const box=document.getElementById('v32AiAuditResult'),a=v32AiLastAudit;if(!box)return;if(!a){box.innerHTML='<div class="online-empty">Chưa chạy kiểm định AI.</div>';return}const r=a.result||{},issues=(r.issues||[]).map(i=>`<div class="v32-audit-issue ${esc(i.severity||'info')}"><b>${esc(i.category||'Kiểm tra')}</b><span>${esc(i.message||'')}</span>${i.suggestion?`<small>Gợi ý: ${esc(i.suggestion)}</small>`:''}</div>`).join(''),rec=r.recommended||{};box.innerHTML=`<div class="v32-audit-head"><div><span class="v32-ai-status ${esc(r.status||'needs_review')}">${r.status==='ok'?'✓ Có vẻ ổn':r.status==='critical'?'⛔ Cần kiểm tra gấp':'⚠ Cần rà soát'}</span><h4>${esc(r.summary||'Kết quả kiểm định')}</h4></div><b>${Number(r.confidence)||0}% tin cậy</b></div><div class="v32-answer-check ${r.answerCheck?.valid?'ok':'warn'}"><b>Kiểm tra đáp án: ${r.answerCheck?.valid?'hợp lý':'cần xem lại'}</b><span>${esc(r.answerCheck?.reason||'')}</span>${r.answerCheck?.alternativeAnswer?`<small>AI đề xuất kiểm tra: ${esc(r.answerCheck.alternativeAnswer)}</small>`:''}</div>${issues||'<div class="v28-empty-good"><b>✓ AI chưa phát hiện lỗi nổi bật.</b></div>'}<div class="v32-recommended"><b>Metadata gợi ý</b><span>${esc(displayLessonLabel(rec.lessonId||''))} • ${esc(displayKnowledgeCode(rec.knowledgeCode||''))} • ${esc(rec.level||'')} • độ khó ${Number(rec.difficulty)||'—'}/5</span><small>${(rec.tags||[]).map(t=>`#${esc(t)}`).join(' ')}</small><button class="btn btn-soft" onclick="v32ApplyAuditMetadata()">Áp dụng metadata (không đổi đáp án)</button></div><div class="math-help">AI chỉ là phản biện thứ hai.  không tự sửa đáp án hoặc tự đánh dấu “Đã duyệt chuyên môn”.</div>`;typesetMath(box)}
function v32ApplyAuditMetadata(){if(!requireTeacher('Áp dụng metadata AI'))return;const a=v32AiLastAudit;if(!a)return;const i=(state.questionBank||[]).findIndex(q=>q.id===a.questionId);if(i<0)return;const q=state.questionBank[i],r=a.result?.recommended||{},codes=allKnowledgeCodes(),meta=codes.find(k=>k.code===r.knowledgeCode)||codes.find(k=>k.lessonId===r.lessonId);if(!meta)return alert('Metadata AI không khớp chương trình hiện tại, chưa áp dụng.');const history=typeof v29TrimVersions==='function'?v29TrimVersions([...(q._versions||[]),v29VersionSnapshot(q)]):(q._versions||[]);state.questionBank[i]=v29NormalizeQuestion({...q,chapterId:meta.chapterId,lessonId:meta.lessonId,knowledgeCode:meta.code,level:['NB','TH','VD'].includes(r.level)?r.level:q.level,difficulty:Math.min(5,Math.max(1,Number(r.difficulty)||q.difficulty||3)),tags:v29NormalizeTags([...(q.tags||[]),...(r.tags||[])]),updatedAt:v32Now(),version:(Number(q.version)||1)+1,_versions:history,aiV32:{...(q.aiV32||{}),lastAudit:{model:a.model,at:a.at,status:a.result?.status||'',confidence:Number(a.result?.confidence)||0}}});save({reason:'v32-ai-audit-metadata'});renderQuestionBank(true);v32RenderAiQuestionPicker();examToast?.(`Đã áp dụng metadata AI cho ${q.id}; đáp án không bị thay đổi.`)}
function v32UniqueBankId(base='AI32'){let id=String(base||'AI32').replace(/[^A-Za-z0-9._-]/g,'-');if(!(state.questionBank||[]).some(q=>q.id===id))return id;let n=2;while((state.questionBank||[]).some(q=>q.id===`${id}-${n}`))n++;return `${id}-${n}`}
function v32ApproveDraft(draftId,reviewed=false){
  if(!requireTeacher('Duyệt bản nháp AI'))return;const d=v32AiDrafts.find(x=>x.draftId===draftId);if(!d)return;const q=v32JsonClone(d.question),check=v32LocalDraftChecks(q);if(check.issues.length&&!confirm(`Câu còn ${check.issues.length} cảnh báo local:\n- ${check.issues.join('\n- ')}\n\nVẫn đưa vào ngân hàng?`))return;if(reviewed&&!confirm('Xác nhận thầy/cô đã tự kiểm tra nội dung, đáp án và lời giải để đánh dấu “Đã duyệt chuyên môn”?'))return;q.id=v32UniqueBankId(q.id);q.reviewStatus=reviewed?'reviewed':'draft';q.updatedAt=v32Now();q.createdAt=q.createdAt||v32Now();q.aiV32={...(q.aiV32||{}),teacherReviewed:true,teacherDecision:reviewed?'reviewed':'accepted-draft',approvedAt:v32Now()};state.questionBank.unshift(v29NormalizeQuestion(q));save({reason:reviewed?'v32-ai-approved-reviewed':'v32-ai-approved-draft'});v32AiDrafts=v32AiDrafts.filter(x=>x.draftId!==draftId);v32AiPersistDrafts();v29DuplicateCache.signature='';v32RenderAiDraftQueue();v32RenderAiQuestionPicker();v32RenderAiMetrics();renderQuestionBank(true);examToast?.(`Đã đưa ${q.id} vào ngân hàng${reviewed?' và đánh dấu đã duyệt':''}.`)
}
function v32DiscardDraft(id){if(!confirm('Bỏ bản nháp AI này?'))return;v32AiDrafts=v32AiDrafts.filter(x=>x.draftId!==id);v32AiPersistDrafts();v32RenderAiDraftQueue();v32RenderAiMetrics()}
function v32PreviewDraft(id){const d=v32AiDrafts.find(x=>x.draftId===id);if(!d)return;const q=d.question,check=v32LocalDraftChecks(q);openModal(`Bản nháp AI • ${q.id}`,`${displayKnowledgeCode(q.knowledgeCode)} • ${levelName(q.level)} • AI confidence ${Number(q.aiV32?.confidence)||0}%`,`${check.duplicate?`<div class="firebase-banner warn"><b>≈ Gần câu ${esc(check.duplicate.id)}</b>tương đồng ${Math.round(check.duplicate.score*100)}%. Hãy so sánh trước khi duyệt.</div>`:''}${buildQuestionPreviewHTML(q,{showAnswer:true,showExplanation:true})}<div class="math-help mt">Cảnh báo: ${esc([...(q.aiV32?.warnings||[]),...check.issues].join('')||'Chưa có cảnh báo tự động.')}</div>`,`<button class="btn btn-soft" onclick="closeModal()">Đóng</button><button class="btn btn-soft" onclick="closeModal();v32EditDraft('${attrEsc(id)}')">Mở trình soạn</button><button class="btn btn-blue" onclick="closeModal();v32ApproveDraft('${attrEsc(id)}',false)">Đưa vào kho (nháp)</button>`);typesetMath(document.getElementById('modalBody'))}
function v32EditDraft(id){
  if(!requireTeacher('Mở bản nháp AI'))return;const d=v32AiDrafts.find(x=>x.draftId===id);if(!d)return;const q=d.question;openQuestionEditor();const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v??''};set('qeLesson',q.lessonId);updateQuestionEditorKnowledge();set('qeKnowledge',q.knowledgeCode);set('qeLevel',q.level);set('qeType',q.type);set('qeForm',q.form);set('qeQuestion',q.question);set('qeOptions',(q.options||[]).join('\n'));set('qeTF4Statements',(q.statements||[]).map(s=>(s.answer?'\\True ':'')+(s.text||'')).join('\n'));set('qeTF4Explanations',(q.statements||[]).map(s=>s.explanation||'').join('\n'));set('qeAnswer',q.type==='mcq'?String.fromCharCode(65+(Number(q.answer)||0)):q.answer);set('qeId',v32UniqueBankId(q.id));set('qeExplanation',q.explanation);set('qeReviewStatus','draft');set('qeDifficulty',q.difficulty);set('qeSourceName',q.sourceName);set('qeSourceYear',q.sourceYear);set('qeTags',(q.tags||[]).join(', '));toggleQuestionEditorFields();updateQuestionEditorPreview();const sub=document.getElementById('modalSub');if(sub)sub.textContent='Bản nháp từ AI  • Hãy kiểm tra kỹ rồi lưu bằng trình soạn chuẩn .'
}
function v32RenderAiDraftQueue(){const box=document.getElementById('v32AiDraftQueue');if(!box)return;if(!v32AiDrafts.length){box.innerHTML='<div class="online-empty">Chưa có bản nháp AI. Nội dung AI sẽ nằm ở đây và chưa tự động đi vào ngân hàng.</div>';return}box.innerHTML=v32AiDrafts.map(d=>{const q=d.question,c=v32LocalDraftChecks(q),warn=(q.aiV32?.warnings||[]).length+c.issues.length,dup=c.duplicate?`<span class="v32-dup">≈ ${Math.round(c.duplicate.score*100)}% với ${esc(c.duplicate.id)}</span>`:'';return `<div class="v32-draft-card"><div class="v32-draft-head"><div><b>${esc(q.id)}</b><span>${esc(displayKnowledgeCode(q.knowledgeCode))} • ${esc(q.level)} • ${questionTypeName(q.type)}</span></div><div><span class="v32-confidence">AI ${Number(q.aiV32?.confidence)||0}%</span><span class="v32-qc">QC ${c.quality?.score||0}%</span></div></div><div class="v32-draft-question">${mathHTML(String(q.question||'').slice(0,400))}</div><div class="v32-draft-meta"><span>${esc(d.task==='variant'?'Biến thể':'Trích xuất')}</span><span>${esc(d.model)}</span>${warn?`<span class="warn">⚠ ${warn} cảnh báo</span>`:'<span class="ok">✓ Không có cảnh báo local</span>'}${dup}</div><div class="v32-draft-actions"><button class="btn btn-soft" onclick="v32PreviewDraft('${attrEsc(d.draftId)}')">Xem</button><button class="btn btn-soft" onclick="v32EditDraft('${attrEsc(d.draftId)}')">Mở trình soạn</button><button class="btn btn-blue" onclick="v32ApproveDraft('${attrEsc(d.draftId)}',false)">Đưa vào kho (nháp)</button><button class="btn btn-soft" onclick="v32ApproveDraft('${attrEsc(d.draftId)}',true)">Đã kiểm tra & duyệt</button><button class="btn btn-danger" onclick="v32DiscardDraft('${attrEsc(d.draftId)}')">Bỏ</button></div></div>`}).join('');typesetMath(box)}
function v32RenderAiQuestionPicker(){const list=document.getElementById('v32AiQuestionList');if(!list)return;list.innerHTML=(state.questionBank||[]).slice(0,1500).map(q=>`<option value="${attrEsc(q.id)}">${esc(String(q.question||'').slice(0,100))}</option>`).join('')}
function v32RenderAiMetrics(){const bank=state.questionBank||[],ai=bank.filter(q=>q.source==='ai-v32'||q.aiV32),reviewed=ai.filter(q=>q.reviewStatus==='reviewed').length;const vals={v32MetricDrafts:v32AiDrafts.length,v32MetricAiBank:ai.length,v32MetricReviewed:reviewed,v32MetricRequests:Number(v32AiUsage().requests)||0};Object.entries(vals).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v})}
function v32RenderAiStatus(){const s=v32AiSettings(),key=v32AiGetKey(),badge=document.getElementById('v32AiConnection'),busy=document.getElementById('v32AiBusyState'),model=document.getElementById('v32AiCurrentModel'),usage=document.getElementById('v32AiUsageText');if(badge){badge.className=`v32-connection ${key?'ready':'missing'}`;badge.textContent=key?'● API key sẵn sàng':'○ Chưa có API key'}if(busy)busy.textContent=v32AiBusy?'AI đang xử lý…':'Sẵn sàng';if(model)model.textContent=s.model;if(usage){const u=v32AiUsage(),r=v40133RateSummary();usage.textContent=`${Number(u.requests)||0} thành công • ${r.recent60} yêu cầu/60s${r.knownLimit?` / giới hạn ${r.knownLimit}`:''}`}}
async function v40132GeminiDiagnostic(){
  if(!requireTeacher('Chẩn đoán Gemini'))return;v32AiSaveSettings(false);const key=v32AiGetKey(),box=document.getElementById('v40132DiagResult');if(!key){if(box)box.innerHTML='<div class="firebase-banner error">Chưa có API key.</div>';return}
  const s=v32AiSettings(),model=s.model||V32_AI_DEFAULT_MODEL,aq=String(key).startsWith('AQ.');if(box)box.innerHTML='<div class="firebase-banner"><span class="v32-ai-spinner"></span> Đang chẩn đoán gọn trong 1 request để tiết kiệm quota…</div>';
  try{
    const parts=[{text:'Chẩn đoán kết nối Math12 Hub. Trả JSON: ok=true, note ngắn bằng tiếng Việt. Nếu có ảnh đi kèm, thêm visionHasMath=true/false tùy ảnh có chứa câu hỏi Toán hay không.'}];let hasImage=false;
    if(v32AiSelectedFile&&/^image\//i.test(v32AiSelectedFile.type||'')){parts.push(await v32FileToInlinePart(v32AiSelectedFile));hasImage=true}
    const schema={type:'object',properties:{ok:{type:'boolean'},note:{type:'string'},visionHasMath:{type:'boolean'}},required:['ok','note']};const r=await v32GeminiGenerate(parts,schema,{timeoutMs:45000,systemInstruction:'Bạn chỉ thực hiện chẩn đoán kỹ thuật ngắn. Trả JSON hợp lệ, không giải bài toán.'}),rate=v40133RateSummary();
    if(box)box.innerHTML=`<div class="firebase-banner"><b>✓ Gemini hoạt động • ${esc(model)}</b> • key ${aq?'AQ':'legacy'} (đã ẩn)<br>Transport: <code>${esc(r.transport||'')}</code> • ${esc(r.json?.note||'Kết nối hợp lệ.')}${hasImage?`<br>Vision: ${r.json?.visionHasMath===true?'✓ nhận ảnh Toán':r.json?.visionHasMath===false?'✓ nhận ảnh, không thấy bài Toán':'đã gửi ảnh'}`:''}</div><div class="math-help mt">Chẩn đoán mới thường chỉ dùng 1 request. 60 giây gần nhất trên trình duyệt này: <b>${rate.recent60}${rate.knownLimit?` / giới hạn server gần nhất ${rate.knownLimit}`:''}</b>.</div>`
  }catch(err){const rate=v40133RateSummary();if(err?.status===429||err?.code==='GEMINI_RATE_LIMIT'){const sec=Math.max(1,Number(err.retryAfterSec)||60);if(box)box.innerHTML=`<div class="firebase-banner warn"><b>429 • Gemini đang giới hạn tốc độ.</b> Key và endpoint đã phản hồi; hãy để pipeline tự chờ khoảng ${sec}s rồi tiếp tục.</div><div class="math-help mt">60 giây gần nhất trên trình duyệt này: ${rate.recent60}${rate.knownLimit?` / giới hạn server gần nhất ${rate.knownLimit}`:''}. Bộ đếm này chỉ là ước tính cục bộ.</div>`}else if(box)box.innerHTML=`<div class="firebase-banner error"><b>Chẩn đoán chưa qua.</b> ${esc(err?.message||String(err))}</div>`}
}
async function v32AiTestConnection(){if(!requireTeacher('Kiểm tra AI'))return;v32AiSaveSettings(false);const box=document.getElementById('v32AiTestResult');if(box)box.textContent='Đang kiểm tra…';try{const schema={type:'object',properties:{ok:{type:'boolean'},note:{type:'string'}},required:['ok','note']},r=await v32GeminiGenerate([{text:'Trả JSON xác nhận kết nối. ok=true, note ngắn bằng tiếng Việt.'}],schema,{timeoutMs:30000});if(box)box.textContent=`✓ Kết nối ${r.model} thành công.`}catch(err){if(box)box.textContent=`✗ ${err.message||err}`}}
function v32ClearDraftQueue(){if(!v32AiDrafts.length)return;if(!confirm(`Xóa ${v32AiDrafts.length} bản nháp AI đang chờ? Việc này không ảnh hưởng câu đã vào ngân hàng.`))return;v32AiDrafts=[];v32AiPersistDrafts();v32RenderAiDraftQueue();v32RenderAiMetrics()}
function v32RenderAIAssistant(){if(!requireTeacher('Trợ lý AI'))return;v32AiLoadDrafts();const s=v32AiSettings();const model=document.getElementById('v32AiModel');if(model&&!model.matches(':focus'))model.value=s.model;const km=document.getElementById('v32AiKeyMode');if(km)km.value=s.keyMode;const th=document.getElementById('v32AiThinking');if(th)th.value=s.thinkingLevel;const lesson=document.getElementById('v32AiTargetLesson');if(lesson&&lesson.options.length<=1)lesson.innerHTML='<option value="">AI tự phân loại bài</option>'+chapters.flatMap(c=>c.lessons.map(l=>`<option value="${l.id}">${l.id} • ${esc(l.common)}</option>`)).join('');v32RenderAiStatus();v32RenderAiMetrics();v32RenderAiDraftQueue();v32RenderAiQuestionPicker();v32RenderAuditResult()}

// Question Bank Pro  remains the authoritative storage/editor.  only adds provenance badges to previews where useful.
const v32OldPreviewBankQuestion=typeof previewBankQuestion==='function'?previewBankQuestion:null;
if(v32OldPreviewBankQuestion)previewBankQuestion=function(id){const q=(state.questionBank||[]).find(x=>x.id===id);v32OldPreviewBankQuestion(id);if(q?.aiV32){const body=document.getElementById('modalBody');if(body){const note=document.createElement('div');note.className='firebase-banner warn mt';note.innerHTML=`<b>AI  provenance</b>${esc(q.aiV32.model||'Gemini')} • ${q.aiV32.teacherReviewed?'đã có quyết định giáo viên':'chưa ghi nhận duyệt giáo viên'}${q.aiV32.warnings?.length?`<br>${esc(q.aiV32.warnings.join(''))}`:''}`;body.prepend(note)}}};

const v32OldFirebaseSignOut=typeof firebaseSignOut==='function'?firebaseSignOut:null;
if(v32OldFirebaseSignOut)firebaseSignOut=async function(){sessionStorage.removeItem(V32_AI_KEY_SESSION);v32AiSelectedFile=null;v32AiLastAudit=null;return v32OldFirebaseSignOut()};

v32AiLoadDrafts();
console.info('Math12 Hub  AI Teacher Assistant loaded');

/* =========================================================
   Math12 Hub V40.13 — AI Import Pipeline
   Extends AI Teacher V32 without replacing the existing Gemini workflow.
   - Word/PDF/image/text intake
   - Batch extraction with checkpoint/resume
   - LaTeX round-trip validation
   - duplicate guard against bank + queue
   - teacher-controlled bulk move to Question Bank draft
   ========================================================= */
(function(){
'use strict';
const V4013_PIPELINE_SCHEMA=4013;
const V4013_PIPELINE_KEY='math12hub.ai.v40.13.pipeline';
const V4013_MAX_DRAFTS=250;
const V4013_MAX_DRAFT_BYTES=3_700_000;
const V40133_MAX_RATE_RETRIES=6;
const V40133_MAX_AUTO_WAIT=180;
let v4013Job=null;
let v4013StopRequested=false;
let v4013LastAddStats={added:0,skipped:0};
const v4013BaseNormalize=v32NormalizeAiQuestion;
const v4013BaseChecks=v32LocalDraftChecks;
const v4013BaseRenderAssistant=v32RenderAIAssistant;
const v4013BaseRenderMetrics=v32RenderAiMetrics;

function v4013HashText(s=''){
  let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)
}
function v4013JobLoad(){
  const x=v32SafeParse(localStorage.getItem(V4013_PIPELINE_KEY)||'null',null);v4013Job=x&&typeof x==='object'?x:null;return v4013Job
}
function v4013JobSave(){
  if(!v4013Job)return localStorage.removeItem(V4013_PIPELINE_KEY);v4013Job.updatedAt=v32Now();try{localStorage.setItem(V4013_PIPELINE_KEY,JSON.stringify(v4013Job))}catch(_){ }
}
function v4013SourceFingerprint(text='',file=null){
  const meta=file?`${file.name}|${file.size}|${file.lastModified}|${file.type}`:'text-only';return `S-${v4013HashText(meta+'|'+String(text||'').slice(0,50000))}`
}
function v4013SourceName(file=null,text=''){return file?.name||((text||'').trim()?'Văn bản/LaTeX đã dán':'Nguồn AI')}
function v4013IsDocx(file){return !!file&&(/\.docx$/i.test(file.name||'')||String(file.type||'').includes('wordprocessingml.document'))}
function v4013IsTextFile(file){return !!file&&(/\.(?:txt|tex|latex)$/i.test(file.name||'')||/^text\//i.test(file.type||''))}
function v4013BytesToBase64(bytes){let out='',step=0x8000;for(let i=0;i<bytes.length;i+=step)out+=String.fromCharCode(...bytes.subarray(i,Math.min(i+step,bytes.length)));return btoa(out)}
async function v4013InflateRaw(bytes){
  if(!('DecompressionStream' in window))throw new Error('Trình duyệt chưa hỗ trợ giải nén Word .docx. Hãy dùng Chrome/Edge mới hoặc lưu tài liệu thành PDF.');
  const ds=new DecompressionStream('deflate-raw'),stream=new Blob([bytes]).stream().pipeThrough(ds);return new Uint8Array(await new Response(stream).arrayBuffer())
}
async function v4013ZipEntries(file){
  const buf=await file.arrayBuffer(),u8=new Uint8Array(buf),dv=new DataView(buf);let eocd=-1;
  for(let i=Math.max(0,u8.length-65557);i<=u8.length-22;i++){if(dv.getUint32(i,true)===0x06054b50)eocd=i}
  if(eocd<0)throw new Error('Không đọc được cấu trúc ZIP của tệp Word.');
  const count=dv.getUint16(eocd+10,true),cdOffset=dv.getUint32(eocd+16,true),dec=new TextDecoder('utf-8'),out=new Map();let p=cdOffset;
  for(let n=0;n<count&&p+46<=u8.length;n++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    const method=dv.getUint16(p+10,true),compSize=dv.getUint32(p+20,true),uncompSize=dv.getUint32(p+24,true),fnLen=dv.getUint16(p+28,true),exLen=dv.getUint16(p+30,true),cmLen=dv.getUint16(p+32,true),local=dv.getUint32(p+42,true),name=dec.decode(u8.subarray(p+46,p+46+fnLen));
    if(local+30<=u8.length&&dv.getUint32(local,true)===0x04034b50){const lfn=dv.getUint16(local+26,true),lex=dv.getUint16(local+28,true),start=local+30+lfn+lex,end=start+compSize;if(end<=u8.length)out.set(name,{name,method,compSize,uncompSize,bytes:u8.slice(start,end)})}
    p+=46+fnLen+exLen+cmLen;
  }
  return out
}
async function v4013EntryBytes(entry){if(!entry)return new Uint8Array();if(entry.method===0)return entry.bytes;if(entry.method===8)return v4013InflateRaw(entry.bytes);throw new Error(`Word dùng kiểu nén chưa hỗ trợ (${entry.method}).`)}
function v4013XmlToText(xml=''){
  try{
    const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('xml');
    doc.querySelectorAll('w\\:tab, tab').forEach(n=>n.replaceWith(doc.createTextNode('\t')));doc.querySelectorAll('w\\:br, br').forEach(n=>n.replaceWith(doc.createTextNode('\n')));
    const paras=[...doc.getElementsByTagNameNS('*','p')];if(paras.length)return paras.map(p=>String(p.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n');
    return String(doc.documentElement?.textContent||'').replace(/\s+/g,' ').trim()
  }catch(_){return String(xml||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
}
async function v4013DocxParts(file){
  if(file.size>12*1024*1024)throw new Error('Word .docx vượt 12 MB. Hãy chia file hoặc lưu từng phần thành PDF.');
  const entries=await v4013ZipEntries(file),dec=new TextDecoder('utf-8'),texts=[];
  const xmlNames=[...entries.keys()].filter(n=>/^word\/(?:document|header\d*|footer\d*)\.xml$/i.test(n)).sort((a,b)=>a.includes('document.xml')?-1:b.includes('document.xml')?1:a.localeCompare(b));
  for(const name of xmlNames.slice(0,8)){const raw=await v4013EntryBytes(entries.get(name));const t=v4013XmlToText(dec.decode(raw));if(t)texts.push(t)}
  const parts=[];if(texts.length)parts.push({text:`Nội dung trích cục bộ từ tệp Word ${file.name}:\n${texts.join('\n\n').slice(0,60000)}`});
  let imgBytes=0,imgCount=0;for(const [name,e] of entries){
    if(!/^word\/media\/.+\.(png|jpe?g|webp)$/i.test(name)||imgCount>=4)continue;const raw=await v4013EntryBytes(e);if(!raw.length||raw.length>1_500_000||imgBytes+raw.length>3_500_000)continue;const ext=(name.split('.').pop()||'png').toLowerCase(),mime=ext==='jpg'||ext==='jpeg'?'image/jpeg':ext==='webp'?'image/webp':'image/png';parts.push({inlineData:{mimeType:mime,data:v4013BytesToBase64(raw)}});imgBytes+=raw.length;imgCount++
  }
  if(!parts.length)throw new Error('Không trích được nội dung từ tệp Word này. Hãy lưu thành PDF rồi thử lại.');return parts
}
async function v4013FileParts(file){
  if(!file)return [];
  if(v4013IsTextFile(file)){if(file.size>4*1024*1024)throw new Error('Tệp văn bản vượt 4 MB. Hãy chia nhỏ nguồn.');return [{text:`Nội dung tệp ${file.name}:\n${(await file.text()).slice(0,120000)}`}]}
  if(v4013IsDocx(file))return v4013DocxParts(file);
  return [await v32FileToInlinePart(file)]
}
function v4013SplitSourceText(src=''){
  const s=String(src||'').trim();if(!s)return [];
  const ex=[];const rex=/((?:[ \t]*%[^\n]*\n)*)[ \t]*\\begin\{ex\}(?:\[[^\]]*\])?[\s\S]*?\\end\{ex\}/g;let m;while((m=rex.exec(s)))ex.push(m[0].trim());if(ex.length>=2)return ex;
  const re=/(?:^|\n)\s*(?:Câu|Cau|Question)\s*\d+\s*[\.\:\)]/gim,marks=[];while((m=re.exec(s)))marks.push(m.index+(s[m.index]==='\n'?1:0));if(marks.length>=2){const out=[];for(let i=0;i<marks.length;i++)out.push(s.slice(marks[i],marks[i+1]??s.length).trim());return out.filter(Boolean)}
  return [s]
}
function v4013QuestionSchema(){
  const base=v32QuestionResponseSchema().properties.questions.items;return {type:'object',properties:{questions:{type:'array',minItems:0,maxItems:15,items:{...base,properties:{...base.properties,sourceOrdinal:{type:'integer',minimum:1},sourceLabel:{type:'string'}},required:[...base.required,'sourceOrdinal','sourceLabel']}},hasMore:{type:'boolean'},sourceTotalEstimate:{type:'integer',minimum:0},batchNote:{type:'string'}},required:['questions','hasMore','sourceTotalEstimate','batchNote']}
}
function v4013Origin({model='',sourceKind='',sourceName='',fingerprint='',task='extract',batchNo=0}={}){return {model:model||v32AiSettings().model,sourceKind,sourceName,fingerprint,task,batchNo,pipelineSchema:V4013_PIPELINE_SCHEMA}}

v32NormalizeAiQuestion=function(raw={},origin={}){
  const q=v4013BaseNormalize(raw,origin);if(origin.sourceName)q.sourceName=String(origin.sourceName).slice(0,180);q.aiV32={...(q.aiV32||{}),pipelineSchema:V4013_PIPELINE_SCHEMA,sourceFingerprint:origin.fingerprint||'',sourceOrdinal:Number(raw.sourceOrdinal)||0,sourceLabel:String(raw.sourceLabel||'').slice(0,120),batchNo:Number(origin.batchNo)||0};q.tags=v29NormalizeTags?.([...(q.tags||[]),'ai-import-v40.13'])||q.tags;return q
};

v32AiLoadDrafts=function(){const arr=v32SafeParse(localStorage.getItem(V32_AI_DRAFTS_KEY)||'[]',[]);v32AiDrafts=Array.isArray(arr)?arr.slice(0,V4013_MAX_DRAFTS):[];return v32AiDrafts};
v32AiPersistDrafts=function(){
  v32AiDrafts=(v32AiDrafts||[]).slice(0,V4013_MAX_DRAFTS);let raw=JSON.stringify(v32AiDrafts);while(raw.length>V4013_MAX_DRAFT_BYTES&&v32AiDrafts.length>20){v32AiDrafts.pop();raw=JSON.stringify(v32AiDrafts)}
  try{localStorage.setItem(V32_AI_DRAFTS_KEY,raw)}catch(err){console.warn('AI pipeline draft storage',err);v32AiDrafts=v32AiDrafts.slice(0,80);try{localStorage.setItem(V32_AI_DRAFTS_KEY,JSON.stringify(v32AiDrafts))}catch(_){}}
};

function v4013QueueDuplicate(q={},selfId=''){
  const fp=q.aiV32?.sourceFingerprint,ord=Number(q.aiV32?.sourceOrdinal)||0;let best=null,bestScore=0;
  for(const d of v32AiDrafts||[]){if(d.draftId===selfId)continue;const x=d.question||{};if(fp&&ord&&x.aiV32?.sourceFingerprint===fp&&Number(x.aiV32?.sourceOrdinal)===ord)return {draftId:d.draftId,id:x.id,score:1,reason:'source-ordinal'};if(x.type!==q.type)continue;const sc=typeof v29Similarity==='function'?v29Similarity(q,x):0;if(sc>bestScore){bestScore=sc;best=d}}
  return bestScore>=.88?{draftId:best?.draftId,id:best?.question?.id,score:bestScore,reason:'similarity'}:null
}
function v4013LatexRoundTrip(q={}){
  const latex=typeof v29QuestionToLatex==='function'?v29QuestionToLatex(q):'';const errors=[],warnings=[];let parsed=null;
  try{
    if(typeof validateQuestionLatexItem==='function'){const r=validateQuestionLatexItem(q)||{};errors.push(...(r.errors||[]));warnings.push(...(r.warnings||[]))}
    if(latex&&typeof parseBulkLatexSource==='function'){
      const r=parseBulkLatexSource(latex,{lessonId:q.lessonId,knowledgeCode:q.knowledgeCode,level:q.level,form:q.form||''});parsed=r.items?.[0]||null;errors.push(...(r.globalErrors||[]),...(parsed?.errors||[]));warnings.push(...(parsed?.warnings||[]));if(parsed&&!parsed.valid)errors.push('Round-trip LaTeX chưa hợp lệ.');if(parsed?.item?.type&&parsed.item.type!==q.type)errors.push(`Round-trip đổi loại câu ${q.type} → ${parsed.item.type}.`)
    }
  }catch(err){errors.push(`Không kiểm tra được round-trip LaTeX: ${err?.message||err}`)}
  const unicode=String(latex||'').match(/[≤≥≠∞√→←×÷]/g);if(unicode)warnings.push('Còn ký hiệu toán Unicode; nên chuẩn hóa sang lệnh LaTeX.');return {latex,errors:[...new Set(errors)],warnings:[...new Set(warnings)],parsed}
}
v32LocalDraftChecks=function(q={}){
  const b=v4013BaseChecks(q),rt=v4013LatexRoundTrip(q),critical=[...(b.issues||[]),...rt.errors],warnings=[...rt.warnings],queueDuplicate=v4013QueueDuplicate(q,q._draftId||'');
  const conf=Number(q.aiV32?.confidence)||0;if(conf<80)warnings.push(`AI confidence ${conf}% dưới ngưỡng khuyến nghị 80%.`);if(q.aiV32?.warnings?.length)warnings.push(...q.aiV32.warnings.map(x=>`AI: ${x}`));
  const quality=Number(b.quality?.score)||0,threshold=Math.max(70,Math.min(90,Number(document.getElementById('v4013QcThreshold')?.value)||80));
  const safe=critical.length===0&&!b.duplicate&&!queueDuplicate&&conf>=80&&(quality===0||quality>=threshold)&&!(q.aiV32?.warnings||[]).length;
  return {...b,issues:[...new Set([...critical,...warnings])],critical:[...new Set(critical)],warnings:[...new Set(warnings)],queueDuplicate,latex:rt.latex,roundTrip:rt,safe,threshold}
};

v32AddAiDrafts=function(rawQuestions=[],origin={}){
  let skipped=0;const list=[];for(const r of rawQuestions||[]){const q=v32NormalizeAiQuestion(r,origin),fp=q.aiV32?.sourceFingerprint,ord=Number(q.aiV32?.sourceOrdinal)||0;const exact=(v32AiDrafts||[]).some(d=>fp&&ord&&d.question?.aiV32?.sourceFingerprint===fp&&Number(d.question?.aiV32?.sourceOrdinal)===ord);if(exact){skipped++;continue}const draftId=`D4013-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;q._draftId=draftId;list.push({draftId,createdAt:v32Now(),model:origin.model||v32AiSettings().model,sourceKind:origin.sourceKind||'text',sourceName:origin.sourceName||'',task:origin.task||'extract',question:q})}
  v32AiDrafts=[...list,...v32AiDrafts].slice(0,V4013_MAX_DRAFTS);v4013LastAddStats={added:list.length,skipped};v32AiPersistDrafts();v32RenderAiDraftQueue();v32RenderAiMetrics();return list
};

function v4013BatchPrompt({start=1,end=10,count=10,typePolicy='mixed',exactUnits=[],text='',file=null}={}){
  const type=typePolicy==='mixed'?'trộn hợp lý mcq/tf4/short':typePolicy,sourceRule=exactUnits.length?`Nguồn đã được Math12 Hub chia chính xác thành ${exactUnits.length} mục. Mỗi mục có nhãn SOURCE_ITEM_n; trả sourceOrdinal đúng theo nhãn.`:`Chỉ trích các câu ở vị trí thứ ${start} đến ${end} theo thứ tự xuất hiện trong nguồn. Không lặp lại câu ngoài khoảng này.`;
  return `Nhiệm vụ: chuyển nguồn giáo viên thành dữ liệu câu hỏi Toán 12 theo GDPT 2018 để Math12 Hub chuẩn hóa sang LaTeX.\n${sourceRule}\nSố câu tối đa batch này: ${count}. Loại mong muốn: ${type}.\nQUAN TRỌNG:\n- Nếu nguồn không còn câu ở khoảng yêu cầu, trả questions=[] và hasMore=false. Không tự sáng tác để đủ số lượng.\n- sourceOrdinal là số thứ tự của câu trong NGUỒN GỐC, không phải thứ tự trong batch. sourceLabel ghi nhãn như “Câu 12”.\n- Chép trung thực nội dung nguồn; chỉ sửa lỗi hiển nhiên về ký hiệu/LaTeX, mọi chỗ không chắc đưa vào warnings.\n- Công thức phải là LaTeX trong $...$. MCQ đúng 4 lựa chọn và duy nhất 1 đáp án. TF4 đúng 4 ý có liên hệ logic.\n- Tự kiểm tra đáp án trước khi trả JSON.\n${v32AiTargetDescription()}\nDanh mục mã kiến thức:\n${v32CurriculumDigest()}\n${exactUnits.length?exactUnits.map((u,i)=>`\n[SOURCE_ITEM_${start+i}]\n${u}`).join('\n').slice(0,50000):text?`\nGhi chú/văn bản nguồn:\n${String(text).slice(0,24000)}`:''}${file?`\nTệp nguồn: ${file.name}. Hãy đọc tệp/ảnh đi kèm.`:''}`
}
async function v4013PrepareBatch({text='',file=null,start=1,batchSize=10}={}){
  const units=!file?v4013SplitSourceText(text):[],localUnits=units.length>1?units:[],slice=localUnits.slice(start-1,start-1+batchSize),count=slice.length||batchSize,end=slice.length?start+slice.length-1:start+batchSize-1,parts=[{text:v4013BatchPrompt({start,end,count,exactUnits:slice,text:localUnits.length?'':text,file,typePolicy:document.getElementById('v32AiTypePolicy')?.value||'mixed'})}];
  if(file)parts.push(...await v4013FileParts(file));return {parts,count,end,localTotal:localUnits.length||0}
}
async function v4013RunBatch({start=1,batchSize=10,text='',file=null,batchNo=1,fingerprint='',sourceName=''}={}){
  const prep=await v4013PrepareBatch({text,file,start,batchSize});if(prep.localTotal&&start>prep.localTotal)return {added:[],skipped:0,hasMore:false,total:prep.localTotal,end:start-1,returned:0};
  const res=await v32GeminiGenerate(prep.parts,v4013QuestionSchema(),{timeoutMs:file?150000:100000});let rows=Array.isArray(res.json?.questions)?res.json.questions:[];
  rows=rows.filter(x=>Number(x.sourceOrdinal)>=start&&Number(x.sourceOrdinal)<=prep.end);const origin=v4013Origin({model:res.model,sourceKind:file?(v4013IsDocx(file)?'docx':file.type==='application/pdf'?'pdf':'image'):'text',sourceName,fingerprint,task:'batch-import',batchNo});const added=v32AddAiDrafts(rows,origin);return {added,skipped:v4013LastAddStats.skipped,hasMore:prep.localTotal?prep.end<prep.localTotal:!!res.json?.hasMore,total:prep.localTotal||Number(res.json?.sourceTotalEstimate)||0,end:prep.end,returned:rows.length,note:String(res.json?.batchNote||'')}
}

function v40133Is429(err){return Number(err?.status)===429||err?.code==='GEMINI_RATE_LIMIT'||/\b429\b|quota|resource.?exhausted|rate.?limit/i.test(String(err?.message||''))}
function v40133RateMode(){return document.getElementById('v40133RateMode')?.value==='pause'?'pause':'auto'}
function v40133Friendly429(err){const sec=Math.max(1,Number(err?.retryAfterSec)||60),lim=Number(err?.quotaLimit)||v40133RateSummary().knownLimit||0;return `Gemini đang giới hạn tốc độ${lim?` (giới hạn gần nhất ${lim} request)`:''}. ${v40133RateMode()==='auto'?`Hệ thống sẽ tự thử lại sau khoảng ${sec}s.`:'Checkpoint đã được giữ để thầy tiếp tục sau.'}`}
function v40133Sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function v40133WaitCountdown(seconds,statusEl,{standalone=false,batchNo=0,start=0,end=0}={}){
  let remain=Math.max(1,Math.ceil(seconds));const until=Date.now()+remain*1000;if(!standalone&&v4013Job){v4013Job.status='cooldown';v4013Job.retryAt=new Date(until).toISOString();v4013Job.retryAfterSec=remain;v4013JobSave()}
  while(remain>0){if(v4013StopRequested&&!standalone)return false;if(statusEl)statusEl.textContent=`⏳ Gemini 429 • tự tiếp tục sau ${remain}s${batchNo?` • batch ${batchNo}, câu ${start}–${end}`:''}`;if(!standalone)v4013RenderPipeline();await v40133Sleep(Math.min(1000,remain*1000));remain=Math.max(0,Math.ceil((until-Date.now())/1000))}
  if(!standalone&&v4013Job){v4013Job.status='running';v4013Job.retryAt='';v4013Job.retryAfterSec=0;v4013Job.lastError='';v4013JobSave();v4013RenderPipeline()}return true
}
async function v40133RunBatchResilient(args,statusEl,{standalone=false,maxRetries=V40133_MAX_RATE_RETRIES}={}){
  let tries=0;while(true){try{return await v4013RunBatch(args)}catch(err){if(!v40133Is429(err))throw err;tries++;const suggested=Math.max(1,Number(err?.retryAfterSec)||60),wait=Math.min(V40133_MAX_AUTO_WAIT,suggested+1);if(!standalone&&v4013Job){v4013Job.rateLimits=(Number(v4013Job.rateLimits)||0)+1;v4013Job.lastError=v40133Friendly429(err);v4013JobSave();v4013RenderPipeline()}
      if(v40133RateMode()==='pause'||tries>maxRetries||suggested>V40133_MAX_AUTO_WAIT){err.autoRetryExhausted=true;throw err}const ok=await v40133WaitCountdown(wait,statusEl,{standalone,batchNo:args.batchNo,start:args.start,end:args.start+args.batchSize-1});if(!ok){const stopErr=new Error('Pipeline đã được dừng theo yêu cầu.');stopErr.pipelineStopped=true;throw stopErr}}
  }
}

v32AiHandleFile=function(input){v32AiSelectedFile=input?.files?.[0]||null;const box=document.getElementById('v32AiFileMeta');if(box)box.textContent=v32AiSelectedFile?`${v32AiSelectedFile.name} • ${(v32AiSelectedFile.size/1024/1024).toFixed(2)} MB • ${v32AiSelectedFile.type||'file'}`:'Chưa chọn tệp.';v4013RenderPipeline()};
v32AiExtractQuestions=async function(){
  if(!requireTeacher('AI tạo bản nháp'))return;const text=(document.getElementById('v32AiSourceText')?.value||'').trim(),file=v32AiSelectedFile,count=Math.min(15,Math.max(1,Number(document.getElementById('v32AiCount')?.value)||3));if(!text&&!file)return alert('Hãy dán nội dung/LaTeX hoặc chọn Word/PDF/ảnh.');const status=document.getElementById('v32AiRunStatus');if(status)status.innerHTML='<span class="v32-ai-spinner"></span> Đang chạy 1 batch…';
  try{const fp=v4013SourceFingerprint(text,file),r=await v40133RunBatchResilient({start:1,batchSize:count,text,file,batchNo:1,fingerprint:fp,sourceName:v4013SourceName(file,text)},status,{standalone:true,maxRetries:3});if(status)status.textContent=`✓ Đã thêm ${r.added.length} bản nháp${r.skipped?`, bỏ qua ${r.skipped} câu đã có`:''}.`;document.getElementById('v32AiDraftQueue')?.scrollIntoView({behavior:'smooth',block:'start'})}catch(err){if(status)status.textContent=v40133Is429(err)?`⏸ ${v40133Friendly429(err)}`:'';if(!v40133Is429(err))alert(err.message||String(err))}
};

async function v4013StartPipeline(resume=false){
  if(!requireTeacher('AI Import Pipeline'))return;const text=(document.getElementById('v32AiSourceText')?.value||'').trim(),file=v32AiSelectedFile;if(!text&&!file)return alert('Hãy dán nội dung/LaTeX hoặc chọn Word/PDF/ảnh.');if(!v32AiGetKey())return alert('Chưa có Gemini API key. Hãy lưu API key trước.');
  const fingerprint=v4013SourceFingerprint(text,file),batchSize=Math.min(15,Math.max(5,Number(document.getElementById('v4013BatchSize')?.value)||10)),target=Math.min(250,Math.max(batchSize,Number(document.getElementById('v4013TargetCount')?.value)||60));
  if(resume){v4013JobLoad();if(!v4013Job)return alert('Chưa có checkpoint để tiếp tục.');if(v4013Job.sourceFingerprint!==fingerprint)return alert(`Nguồn hiện tại khác checkpoint (${v4013Job.sourceName||'nguồn cũ'}). Hãy chọn/dán lại đúng nguồn hoặc đặt lại tiến trình.`);v4013Job.batchSize=batchSize;v4013Job.target=Math.max(v4013Job.target||0,target)}
  else{if(v4013Job?.status==='running'&&!confirm('Có tiến trình đang chạy. Bắt đầu lại từ câu 1?'))return;v4013Job={schemaVersion:V4013_PIPELINE_SCHEMA,id:`P4013-${Date.now().toString(36).toUpperCase()}`,sourceFingerprint:fingerprint,sourceName:v4013SourceName(file,text),sourceKind:file?(v4013IsDocx(file)?'docx':file.type==='application/pdf'?'pdf':'image'):'text',batchSize,target,nextOrdinal:1,processed:0,added:0,skipped:0,batches:0,errors:0,rateLimits:0,retryAt:'',retryAfterSec:0,lastError:'',status:'idle',startedAt:v32Now(),updatedAt:v32Now()}}
  if(v4013Job.status==='complete'&&resume&&v4013Job.nextOrdinal>v4013Job.target)return alert('Checkpoint này đã hoàn thành. Hãy đặt lại tiến trình để chạy nguồn mới.');
  v4013StopRequested=false;v4013Job.status='running';v4013Job.lastError='';v4013JobSave();v4013RenderPipeline();const status=document.getElementById('v32AiRunStatus');
  try{
    while(v4013Job.nextOrdinal<=v4013Job.target&&!v4013StopRequested){
      const start=v4013Job.nextOrdinal,bno=v4013Job.batches+1;if(status)status.innerHTML=`<span class="v32-ai-spinner"></span> Batch ${bno}: đang đọc câu ${start}–${Math.min(v4013Job.target,start+v4013Job.batchSize-1)}…`;
      const r=await v40133RunBatchResilient({start,batchSize:v4013Job.batchSize,text,file,batchNo:bno,fingerprint:v4013Job.sourceFingerprint,sourceName:v4013Job.sourceName},status,{standalone:false});v4013Job.batches++;v4013Job.added+=r.added.length;v4013Job.skipped+=r.skipped;v4013Job.nextOrdinal=r.end+1;v4013Job.processed=Math.min(v4013Job.target,r.end);if(r.total)v4013Job.target=Math.min(v4013Job.target,r.total);v4013JobSave();v4013RenderPipeline();
      if(!r.hasMore||r.returned===0){v4013Job.status='complete';break}
    }
    if(v4013StopRequested&&v4013Job.status==='running')v4013Job.status='paused';else if(v4013Job.status==='running')v4013Job.status='complete';v4013JobSave();v4013RenderPipeline();if(status)status.textContent=v4013Job.status==='complete'?`✓ Pipeline hoàn thành: ${v4013Job.added} câu vào hàng chờ, ${v4013Job.skipped} câu trùng bỏ qua.`:`⏸ Đã dừng tại checkpoint câu ${v4013Job.nextOrdinal}.`;
  }catch(err){if(err?.pipelineStopped){v4013Job.status='paused';v4013Job.lastError='Đã dừng theo yêu cầu; checkpoint được giữ nguyên.'}else if(v40133Is429(err)){v4013Job.status='paused';v4013Job.lastError=v40133Friendly429(err)}else{v4013Job.errors=(Number(v4013Job.errors)||0)+1;v4013Job.status='error';v4013Job.lastError=String(err?.message||err).slice(0,600)}v4013JobSave();v4013RenderPipeline();if(status)status.textContent=v4013Job.status==='paused'?`⏸ ${v4013Job.lastError} Checkpoint ở câu ${v4013Job.nextOrdinal}.`:`✗ ${v4013Job.lastError}`}
}
function v4013StopPipeline(){v4013StopRequested=true;if(['running','cooldown'].includes(v4013Job?.status)){v4013Job.status='paused';v4013Job.retryAt='';v4013Job.retryAfterSec=0;v4013JobSave();v4013RenderPipeline()}examToast?.('Đã yêu cầu dừng; nếu đang chờ 429 hệ thống dừng ngay, nếu đang gửi request sẽ dừng sau request hiện tại. Checkpoint được giữ.')}
function v4013ResetPipeline(){if(v4013Job&&!confirm('Đặt lại checkpoint AI Import Pipeline? Các bản nháp trong hàng chờ vẫn được giữ nguyên.'))return;v4013Job=null;v4013StopRequested=true;localStorage.removeItem(V4013_PIPELINE_KEY);v4013RenderPipeline();examToast?.('Đã đặt lại tiến trình AI Import Pipeline.')}
function v4013Gate(check,q){if(check.safe)return {cls:'safe',label:'✓ ĐẠT QC'};if(check.critical.length||check.duplicate||check.queueDuplicate)return {cls:'block',label:'⛔ CHẶN'};return {cls:'review',label:'⚠ CẦN XEM'}}
function v4013QueueStats(){let safe=0,warn=0,dup=0,block=0;for(const d of v32AiDrafts||[]){const c=v32LocalDraftChecks(d.question);if(c.safe)safe++;else warn++;if(c.duplicate||c.queueDuplicate)dup++;if(c.critical.length)block++}return {safe,warn,dup,block,total:(v32AiDrafts||[]).length}}
function v4013RenderPipeline(){
  v4013JobLoad();const j=v4013Job,stateEl=document.getElementById('v4013PipelineState'),fill=document.getElementById('v4013ProgressFill'),lab=document.getElementById('v4013ProgressLabel'),meta=document.getElementById('v4013ProgressMeta'),cp=document.getElementById('v4013CheckpointText'),quota=document.getElementById('v40133QuotaText'),retryEl=document.getElementById('v40133RetryText'),qs=v4013QueueStats(),rate=v40133RateSummary();
  if(stateEl){const st=j?.status||'idle';stateEl.className=`v4013-state ${st}`;stateEl.textContent=st==='running'?'ĐANG CHẠY':st==='cooldown'?'CHỜ 429':st==='paused'?'TẠM DỪNG':st==='complete'?'HOÀN THÀNH':st==='error'?'CÓ LỖI':'SẴN SÀNG'}
  const target=Math.max(1,Number(j?.target)||1),processed=Math.max(0,Number(j?.processed)||0),pct=j?Math.min(100,Math.round(processed/target*100)):0;if(fill)fill.style.width=`${pct}%`;if(lab)lab.textContent=j?`${processed}/${j.target} vị trí nguồn • ${pct}%`:'Chưa chạy';if(meta)meta.textContent=j?`${j.batches||0} batch • ${j.added||0} câu thêm • ${j.skipped||0} trùng • ${j.rateLimits||0} lần 429`:'0 batch • 0 câu thêm • 0 câu trùng bỏ qua';if(cp)cp.textContent=j?`Checkpoint ${j.id}: nguồn “${j.sourceName}” • tiếp theo từ câu ${j.nextOrdinal}${j.lastError?` • ${j.lastError}`:''}`:'Checkpoint chưa được tạo.';
  if(quota)quota.innerHTML=`Request 60s gần nhất: <b>${rate.recent60}${rate.knownLimit?` / ${rate.knownLimit}`:''}</b>${rate.recent429?` • <b>${rate.recent429}</b> lần 429`:''}<small>Ước tính cục bộ; nếu cùng key được dùng ở nơi khác thì số thực tế có thể cao hơn.</small>`;
  if(retryEl){const until=j?.retryAt?new Date(j.retryAt).getTime():0,sec=until>Date.now()?Math.max(1,Math.ceil((until-Date.now())/1000)):0;retryEl.textContent=sec?`⏳ Tự tiếp tục sau ${sec}s`:(j?.status==='paused'&&j?.lastError?j.lastError:'')}
  const vals={v4013MetricSafe:qs.safe,v4013MetricWarn:qs.warn,v4013MetricDup:qs.dup,v4013MetricErrors:Number(j?.errors)||0};Object.entries(vals).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v});const sum=document.getElementById('v4013QueueSummary');if(sum)sum.innerHTML=`<span>${qs.total} bản nháp</span><span>✓ ${qs.safe} đạt QC</span><span>⚠ ${qs.warn} cần xem</span><span>≈ ${qs.dup} nghi trùng</span><span>⛔ ${qs.block} lỗi cấu trúc</span>`;
  const busy=['running','cooldown'].includes(j?.status);['v4013StartBtn','v4013ResumeBtn'].forEach(id=>{const e=document.getElementById(id);if(e)e.disabled=!!busy});const stop=document.getElementById('v4013StopBtn');if(stop)stop.disabled=!busy;v32RenderAiStatus()
}
function v4013DraftLatex(id){const d=v32AiDrafts.find(x=>x.draftId===id);return d?String(v32LocalDraftChecks(d.question).latex||''):''}
async function v4013CopyDraftLatex(id){const tex=v4013DraftLatex(id);if(!tex)return;try{await navigator.clipboard.writeText(tex)}catch(_){const t=document.createElement('textarea');t.value=tex;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}examToast?.('Đã sao chép LaTeX của câu nháp.')}
function v4013PreviewLatex(id){const d=v32AiDrafts.find(x=>x.draftId===id);if(!d)return;const c=v32LocalDraftChecks(d.question),g=v4013Gate(c,d.question);openModal(`LaTeX • ${d.question.id}`,`${g.label} • Round-trip ${c.roundTrip?.errors?.length?'có lỗi':'đạt'}`,`<textarea class="v4013-latex-box" readonly>${esc(c.latex||'')}</textarea><div class="math-help mt">${esc([...c.critical,...c.warnings].join(' • ')||'LaTeX vượt qua kiểm tra cấu trúc.')}</div>`,`<button class="btn btn-soft" onclick="closeModal()">Đóng</button><button class="btn btn-blue" onclick="v4013CopyDraftLatex('${attrEsc(id)}')">Sao chép LaTeX</button>`)}
function v4013CommitDraft(d,reviewed=false){
  const q=v32JsonClone(d.question);delete q._draftId;q.id=v32UniqueBankId(q.id);q.reviewStatus=reviewed?'reviewed':'draft';q.updatedAt=v32Now();q.createdAt=q.createdAt||v32Now();q.aiV32={...(q.aiV32||{}),teacherReviewed:!!reviewed,teacherDecision:reviewed?'reviewed':'accepted-draft',approvedAt:v32Now(),pipelineSchema:V4013_PIPELINE_SCHEMA};window.QuestionIdV40?.ensure?.(q);const normalized=v29NormalizeQuestion(q);window.QuestionIdV40?.ensure?.(normalized,{preserve:q.questionId||''});state.questionBank.unshift(normalized);return normalized
}
v32ApproveDraft=function(draftId,reviewed=false){
  if(!requireTeacher('Duyệt bản nháp AI'))return;const d=v32AiDrafts.find(x=>x.draftId===draftId);if(!d)return;const c=v32LocalDraftChecks(d.question),problem=[...c.critical,...c.warnings];if((c.critical.length||c.duplicate||c.queueDuplicate)&&!confirm(`Câu đang bị chặn/cảnh báo:\n- ${[...problem,c.duplicate?`Gần câu ${c.duplicate.id} (${Math.round(c.duplicate.score*100)}%)`:'',c.queueDuplicate?`Gần bản nháp ${c.queueDuplicate.id||''}`:''].filter(Boolean).join('\n- ')}\n\nVẫn đưa vào ngân hàng?`))return;if(reviewed&&!confirm('Xác nhận thầy/cô đã tự kiểm tra nội dung, đáp án, lời giải và LaTeX để đánh dấu “Đã duyệt chuyên môn”?'))return;const q=v4013CommitDraft(d,reviewed);save({reason:reviewed?'v4013-ai-approved-reviewed':'v4013-ai-approved-draft'});v32AiDrafts=v32AiDrafts.filter(x=>x.draftId!==draftId);v32AiPersistDrafts();v29DuplicateCache.signature='';v32RenderAiDraftQueue();v32RenderAiQuestionPicker();v32RenderAiMetrics();renderQuestionBank(true);examToast?.(`Đã đưa ${q.questionId||q.id} vào ngân hàng${reviewed?' và đánh dấu đã duyệt':''}.`)
};
function v4013SelectSafeDrafts(){document.querySelectorAll('.v4013-draft-check').forEach(el=>{const d=v32AiDrafts.find(x=>x.draftId===el.value);el.checked=!!d&&v32LocalDraftChecks(d.question).safe});const n=[...document.querySelectorAll('.v4013-draft-check:checked')].length;examToast?.(`Đã chọn ${n} câu đạt QC.`)}
function v4013BulkApproveDrafts(){
  if(!requireTeacher('Đưa hàng loạt câu AI vào ngân hàng'))return;const ids=[...document.querySelectorAll('.v4013-draft-check:checked')].map(x=>x.value),picked=v32AiDrafts.filter(d=>ids.includes(d.draftId)),safe=picked.filter(d=>v32LocalDraftChecks(d.question).safe);if(!picked.length)return alert('Hãy chọn các câu đạt QC trước.');if(safe.length!==picked.length)return alert(`Có ${picked.length-safe.length} câu chưa đạt QC. Bulk import chỉ nhận câu “Đạt QC”; hãy xử lý riêng các câu đó.`);if(!confirm(`Đưa ${safe.length} câu đã chọn vào Question Bank ở trạng thái BẢN NHÁP?\n\nHệ thống sẽ cấp ID câu cố định Qxxxxxx nhưng KHÔNG tự publish.`))return;const idSet=new Set(safe.map(d=>d.draftId));const rows=safe.map(d=>v4013CommitDraft(d,false));v32AiDrafts=v32AiDrafts.filter(d=>!idSet.has(d.draftId));v32AiPersistDrafts();v29DuplicateCache.signature='';save({reason:'v4013-ai-bulk-approved-draft'});v32RenderAiDraftQueue();v32RenderAiQuestionPicker();v32RenderAiMetrics();renderQuestionBank(true);examToast?.(`Đã đưa ${rows.length} câu đạt QC vào ngân hàng ở trạng thái nháp.`)
}
function v4013ExportDraftsLatex(){
  const checked=new Set([...document.querySelectorAll('.v4013-draft-check:checked')].map(x=>x.value)),rows=(v32AiDrafts||[]).filter(d=>!checked.size||checked.has(d.draftId));if(!rows.length)return alert('Hàng chờ AI đang trống.');const tex=`% Math12 Hub V40.13 — AI Import Pipeline\n% ${new Date().toISOString()}\n% ${rows.length} câu bản nháp; cần giáo viên duyệt.\n\n`+rows.map(d=>v4013DraftLatex(d.draftId)).join('\n\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([tex],{type:'text/plain;charset=utf-8'}));a.download=`math12-ai-queue-v40.13-${rows.length}-cau.tex`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
function v4013SortedDrafts(){return [...(v32AiDrafts||[])].sort((a,b)=>{const af=a.question?.aiV32?.sourceFingerprint===v4013Job?.sourceFingerprint,bf=b.question?.aiV32?.sourceFingerprint===v4013Job?.sourceFingerprint;if(af!==bf)return af?-1:1;const ao=Number(a.question?.aiV32?.sourceOrdinal)||999999,bo=Number(b.question?.aiV32?.sourceOrdinal)||999999;if(af&&bf&&ao!==bo)return ao-bo;return String(b.createdAt||'').localeCompare(String(a.createdAt||''))})}
v32RenderAiDraftQueue=function(){
  const box=document.getElementById('v32AiDraftQueue');if(!box)return;if(!v32AiDrafts.length){box.innerHTML='<div class="online-empty">Chưa có bản nháp AI. Nội dung AI sẽ nằm ở đây và chưa tự động đi vào ngân hàng.</div>';v4013RenderPipeline();return}
  box.innerHTML=v4013SortedDrafts().map(d=>{const q=d.question,c=v32LocalDraftChecks(q),g=v4013Gate(c,q),warn=c.critical.length+c.warnings.length,dup=c.duplicate?`<span class="v32-dup">≈ ${Math.round(c.duplicate.score*100)}% với ${esc(c.duplicate.id)}</span>`:c.queueDuplicate?`<span class="v32-dup">≈ trùng bản nháp ${esc(c.queueDuplicate.id||'')}</span>`:'',ord=Number(q.aiV32?.sourceOrdinal)||0,cardCls=g.cls==='safe'?'v4013-draft-card-safe':g.cls==='block'?'v4013-draft-card-block':'v4013-draft-card-review';return `<div class="v32-draft-card ${cardCls}"><div class="v32-draft-head"><div><label class="v4013-draft-select" title="Chọn để nhập hàng loạt"><input class="v4013-draft-check" type="checkbox" value="${attrEsc(d.draftId)}" ${c.safe?'':'disabled'}><span class="v4013-gate ${g.cls}">${g.label}</span></label><b>${esc(q.id)}</b><span>${esc(displayKnowledgeCode(q.knowledgeCode))} • ${esc(q.level)} • ${questionTypeName(q.type)}</span></div><div><span class="v32-confidence">AI ${Number(q.aiV32?.confidence)||0}%</span><span class="v32-qc">QC ${c.quality?.score||0}%</span></div></div><div class="v32-draft-question">${mathHTML(String(q.question||'').slice(0,500))}</div><div class="v32-draft-meta">${ord?`<span class="v4013-source-ordinal">Nguồn #${ord}${q.aiV32?.sourceLabel?` • ${esc(q.aiV32.sourceLabel)}`:''}</span>`:''}<span>${esc(d.sourceName||d.sourceKind||'AI')}</span><span>${esc(d.model)}</span><span class="v4013-latex-status">LaTeX ${c.roundTrip?.errors?.length?'cần sửa':'✓ round-trip'}</span>${warn?`<span class="warn">⚠ ${warn} cảnh báo</span>`:'<span class="ok">✓ Không có cảnh báo</span>'}${dup}</div><div class="v32-draft-actions"><button class="btn btn-soft" onclick="v32PreviewDraft('${attrEsc(d.draftId)}')">Xem</button><button class="btn btn-soft" onclick="v4013PreviewLatex('${attrEsc(d.draftId)}')">LaTeX</button><button class="btn btn-soft" onclick="v32EditDraft('${attrEsc(d.draftId)}')">Mở trình soạn</button><button class="btn btn-blue" onclick="v32ApproveDraft('${attrEsc(d.draftId)}',false)">Đưa vào kho (nháp)</button><button class="btn btn-soft" onclick="v32ApproveDraft('${attrEsc(d.draftId)}',true)">Đã kiểm tra & duyệt</button><button class="btn btn-danger" onclick="v32DiscardDraft('${attrEsc(d.draftId)}')">Bỏ</button></div></div>`}).join('');typesetMath(box);v4013RenderPipeline()
};

v32RenderAiMetrics=function(){v4013BaseRenderMetrics();v4013RenderPipeline()};
v32RenderAIAssistant=function(){v4013BaseRenderAssistant();v4013JobLoad();v4013RenderPipeline()};
const v4013BaseClear=v32ClearDraftQueue;v32ClearDraftQueue=function(){v4013BaseClear();v4013RenderPipeline()};

Object.assign(window,{v4013StartPipeline,v4013StopPipeline,v4013ResetPipeline,v4013SelectSafeDrafts,v4013BulkApproveDrafts,v4013ExportDraftsLatex,v4013CopyDraftLatex,v4013PreviewLatex,v4013RenderPipeline,v40133RateSummary});
v4013JobLoad();
console.info('Math12 Hub V40.13.3 Gemini 429 auto-retry loaded');
})();
