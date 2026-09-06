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


/* =========================================================
   Math12 Hub V40.13.4 — Figure Extraction & Figure Attach
   - giữ nguyên pipeline v40.13.3
   - tự giữ và gắn hình gốc của nguồn vào bản nháp khi phát hiện câu có hình
   - hỗ trợ hiển thị figureMode=image trong preview / exam / ngân hàng
   ========================================================= */
(function(){
'use strict';
const V40134_BUILD='40.13.4-figure-attach';
const V40134_CTX_KEY='math12hub.ai.v40.13.4.figureContexts';
const V40134_MAX_CTX=10;
const V40134_MAX_DOCX_IMAGES=6;
const V40134_MAX_TOTAL_IMAGE_BYTES=2_100_000;
let v40134InitDone=false;

function v40134SafeParse(raw,fallback){try{return JSON.parse(raw)}catch(_){return fallback}}
function v40134Now(){return new Date().toISOString()}
function v40134Hash(s=''){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function v40134Fingerprint(text='',file=null){const meta=file?`${file.name}|${file.size}|${file.lastModified}|${file.type}`:'text-only';return `S-${v40134Hash(meta+'|'+String(text||'').slice(0,50000))}`}
function v40134LoadStore(){return v40134SafeParse(localStorage.getItem(V40134_CTX_KEY)||'{}',{})}
function v40134SaveStore(store){try{localStorage.setItem(V40134_CTX_KEY,JSON.stringify(store||{}))}catch(_){}}
function v40134GetCtx(fp=''){const store=v40134LoadStore();return store[String(fp||'')]||null}
function v40134PutCtx(ctx){if(!ctx?.fingerprint)return;const store=v40134LoadStore();store[ctx.fingerprint]=ctx;const items=Object.entries(store).sort((a,b)=>String(b[1]?.updatedAt||'').localeCompare(String(a[1]?.updatedAt||''))).slice(0,V40134_MAX_CTX);const trimmed=Object.fromEntries(items);v40134SaveStore(trimmed)}
function v40134Esc(s=''){return typeof esc==='function'?esc(String(s||'')):String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function v40134Attr(s=''){return typeof attrEsc==='function'?attrEsc(String(s||'')):v40134Esc(s).replace(/`/g,'&#96;')}
function v40134Math(s=''){return typeof mathHTML==='function'?mathHTML(String(s||'')):v40134Esc(String(s||''))}
function v40134IsFigureLikely(q={}){
  const blob=[q.question,q.explanation,q.form,q.aiV32?.sourceNote,...(q.options||[]),...(q.statements||[]).map(x=>x?.text||''),...(q.aiV32?.warnings||[])].join(' ').toLowerCase();
  return /(hình|hình vẽ|đồ thị|bảng biến thiên|biểu đồ|bên hình|hình bên|trục tọa độ|tọa độ|oxyz|oxy|quan sát hình|theo đồ thị|hàm số có đồ thị|hình sau)/i.test(blob);
}
function v40134ModeTag(mode='image'){return mode==='image'?'Hình gốc đính kèm':(typeof figureModeTag==='function'?figureModeTag(mode):mode)}

async function v40134BlobToDataUrl(blob){return await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Không đọc được Blob hình ảnh.'));r.onload=()=>resolve(String(r.result||''));r.readAsDataURL(blob)})}
async function v40134FileToDataUrl(file){return await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Không đọc được tệp hình.'));r.onload=()=>resolve(String(r.result||''));r.readAsDataURL(file)})}
function v40134DataUrlToImage(dataUrl){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Không nạp được ảnh để tối ưu kích thước.'));img.src=dataUrl})}
async function v40134OptimizeDataUrl(dataUrl,{maxW=1200,maxH=1200,quality=.82,preferJpeg=true}={}){
  if(!String(dataUrl||'').startsWith('data:image/'))return {dataUrl,width:0,height:0,bytes:Math.round((String(dataUrl||'').length*3)/4)};
  const img=await v40134DataUrlToImage(dataUrl);const w=img.naturalWidth||img.width||1,h=img.naturalHeight||img.height||1,scale=Math.min(1,maxW/w,maxH/h);const nw=Math.max(1,Math.round(w*scale)),nh=Math.max(1,Math.round(h*scale));
  const c=document.createElement('canvas');c.width=nw;c.height=nh;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,nw,nh);g.drawImage(img,0,0,nw,nh);let out='';
  try{out=c.toDataURL(preferJpeg?'image/jpeg':'image/png',quality)}catch(_){out=c.toDataURL('image/png')}
  return {dataUrl:out,width:nw,height:nh,bytes:Math.round((out.length*3)/4)};
}
function v40134BytesToBase64(bytes){let out='',step=0x8000;for(let i=0;i<bytes.length;i+=step)out+=String.fromCharCode(...bytes.subarray(i,Math.min(i+step,bytes.length)));return btoa(out)}
async function v40134InflateRaw(bytes){
  if(!('DecompressionStream' in window))throw new Error('Trình duyệt chưa hỗ trợ giải nén Word .docx. Hãy dùng Chrome/Edge mới hoặc lưu tài liệu thành PDF.');
  const ds=new DecompressionStream('deflate-raw'),stream=new Blob([bytes]).stream().pipeThrough(ds);return new Uint8Array(await new Response(stream).arrayBuffer())
}
async function v40134ZipEntries(file){
  const buf=await file.arrayBuffer(),u8=new Uint8Array(buf),dv=new DataView(buf);let eocd=-1;
  for(let i=Math.max(0,u8.length-65557);i<=u8.length-22;i++){if(dv.getUint32(i,true)===0x06054b50)eocd=i}
  if(eocd<0)throw new Error('Không đọc được cấu trúc ZIP của tệp Word.');
  const count=dv.getUint16(eocd+10,true),cdOffset=dv.getUint32(eocd+16,true),dec=new TextDecoder('utf-8'),out=new Map();let p=cdOffset;
  for(let n=0;n<count&&p+46<=u8.length;n++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    const method=dv.getUint16(p+10,true),compSize=dv.getUint32(p+20,true),fnLen=dv.getUint16(p+28,true),exLen=dv.getUint16(p+30,true),cmLen=dv.getUint16(p+32,true),local=dv.getUint32(p+42,true),name=dec.decode(u8.subarray(p+46,p+46+fnLen));
    if(local+30<=u8.length&&dv.getUint32(local,true)===0x04034b50){const lfn=dv.getUint16(local+26,true),lex=dv.getUint16(local+28,true),start=local+30+lfn+lex,end=start+compSize;if(end<=u8.length)out.set(name,{name,method,bytes:u8.slice(start,end)})}
    p+=46+fnLen+exLen+cmLen;
  }
  return out;
}
async function v40134EntryBytes(entry){if(!entry)return new Uint8Array();if(entry.method===0)return entry.bytes;if(entry.method===8)return await v40134InflateRaw(entry.bytes);throw new Error(`Word dùng kiểu nén chưa hỗ trợ (${entry.method}).`)}
async function v40134DocxAssets(file){
  const entries=await v40134ZipEntries(file),assets=[];let total=0,order=0;
  for(const [name,e] of entries){
    if(!/^word\/media\/.+\.(png|jpe?g|webp|gif|bmp)$/i.test(name))continue;
    if(assets.length>=V40134_MAX_DOCX_IMAGES)break;
    const raw=await v40134EntryBytes(e);if(!raw.length)continue;
    const ext=(name.split('.').pop()||'png').toLowerCase(),mime=ext==='jpg'||ext==='jpeg'?'image/jpeg':ext==='webp'?'image/webp':'image/png';
    const base64=v40134BytesToBase64(raw);let opt=await v40134OptimizeDataUrl(`data:${mime};base64,${base64}`,{maxW:1280,maxH:1280,quality:.80,preferJpeg:true});
    if(total+opt.bytes>V40134_MAX_TOTAL_IMAGE_BYTES&&assets.length)break;total+=opt.bytes;order++;
    assets.push({assetId:`F${order}`,kind:'docx-media',label:`Hình nhúng ${order}`,name,dataUrl:opt.dataUrl,width:opt.width,height:opt.height,bytes:opt.bytes})
  }
  return assets;
}
async function v40134FigureAssetsFromCurrentSource(){
  const file=v32AiSelectedFile||null,text=(document.getElementById('v32AiSourceText')?.value||'').trim(),fp=v40134Fingerprint(text,file),cached=v40134GetCtx(fp);if(cached)return cached;
  const ctx={fingerprint:fp,sourceName:file?.name||(text?'Văn bản/LaTeX đã dán':'Nguồn AI'),sourceKind:file?(text?'text+file':'file'):'text',fileMeta:file?{name:file.name,size:file.size,type:file.type||'',lastModified:file.lastModified||0}:null,assets:[],updatedAt:v40134Now(),notes:[]};
  try{
    if(file){
      if(/^image\//i.test(file.type||'')){const raw=await v40134FileToDataUrl(file),opt=await v40134OptimizeDataUrl(raw,{maxW:1400,maxH:1400,quality:.82,preferJpeg:true});ctx.assets=[{assetId:'F1',kind:'image-file',label:file.name||'Ảnh nguồn',name:file.name||'image',dataUrl:opt.dataUrl,width:opt.width,height:opt.height,bytes:opt.bytes}]}
      else if(/\.docx$/i.test(file.name||'')||String(file.type||'').includes('wordprocessingml.document')){ctx.assets=await v40134DocxAssets(file);if(!ctx.assets.length)ctx.notes.push('Word không phát hiện ảnh nhúng phù hợp để gắn vào câu.')}
      else if(String(file.type||'')==='application/pdf'){ctx.notes.push('PDF hiện vẫn gửi tốt cho Gemini nhưng v40.13.4 chưa tách được hình riêng từng câu ở phía trình duyệt. Có thể vẫn nhập câu; phần gắn hình riêng sẽ cần bước kiểm tra thủ công.')}
    }
  }catch(err){ctx.notes.push(String(err?.message||err))}
  v40134PutCtx(ctx);return ctx;
}
function v40134AssignAssets(newDrafts=[],ctx=null){
  if(!Array.isArray(newDrafts)||!newDrafts.length||!ctx?.assets?.length)return 0;
  const candidates=newDrafts.filter(d=>v40134IsFigureLikely(d.question||{}));if(!candidates.length)return 0;
  let changed=0,figureOrdinal=0;
  for(const d of candidates){
    const q=d.question||{};if(q.figureMode==='image'&&q.figureImageData)continue;
    const ord=Math.max(0,Number(q.aiV32?.sourceOrdinal)||0);
    let asset=null;
    if(ctx.assets.length===1)asset=ctx.assets[0];
    else if(ord>0&&ctx.assets[ord-1])asset=ctx.assets[ord-1];
    else asset=ctx.assets[Math.min(figureOrdinal,ctx.assets.length-1)];
    if(!asset)continue;figureOrdinal++;
    q.figureMode='image';q.figureLayout=q.figureLayout||'below';q.figureCaption=q.figureCaption||'';q.figureImageData=asset.dataUrl;q.figureSourceKind='source-image';q.figureImageName=asset.name||asset.label||'';
    q.figureAssetMeta={assetId:asset.assetId,label:asset.label||'',kind:asset.kind||'image',width:asset.width||0,height:asset.height||0,bytes:asset.bytes||0,assignedBy:'v40.13.4-auto',assignedAt:v40134Now(),sourceFingerprint:ctx.fingerprint};
    q.aiV32={...(q.aiV32||{}),figureAttached:true,figureAttachmentMode:'source-image',figureAttachmentSource:ctx.sourceKind||'',pipelineSchema:Math.max(40134,Number(q.aiV32?.pipelineSchema)||0)};
    const existing=Array.isArray(q.tags)?q.tags.slice():[];if(!existing.includes('figure-source-image'))existing.push('figure-source-image');q.tags=typeof v29NormalizeTags==='function'?v29NormalizeTags(existing):existing;
    d.sourceName=d.sourceName||ctx.sourceName;changed++;
  }
  if(changed&&typeof v32AiPersistDrafts==='function')v32AiPersistDrafts();
  return changed;
}
async function v40134PrepareContext(){
  const box=document.getElementById('v32AiFileMeta');
  try{const ctx=await v40134FigureAssetsFromCurrentSource();if(box&&v32AiSelectedFile){const extra=ctx.assets?.length?` • phát hiện ${ctx.assets.length} hình nhúng/gốc`:(ctx.notes?.length?` • ${ctx.notes[0]}`:'');box.textContent=`${v32AiSelectedFile.name} • ${(v32AiSelectedFile.size/1024/1024).toFixed(2)} MB • ${v32AiSelectedFile.type||'file'}${extra}`}return ctx}catch(err){if(box&&v32AiSelectedFile)box.textContent=`${v32AiSelectedFile.name} • ${(v32AiSelectedFile.size/1024/1024).toFixed(2)} MB • ${v32AiSelectedFile.type||'file'} • ${String(err?.message||err)}`;return null}
}

const v40134BaseHandleFile=window.v32AiHandleFile;
window.v32AiHandleFile=function(input){const r=v40134BaseHandleFile? v40134BaseHandleFile(input):undefined;Promise.resolve().then(v40134PrepareContext).catch(()=>{});return r};

const v40134BaseAddDrafts=window.v32AddAiDrafts;
window.v32AddAiDrafts=function(rawQuestions=[],origin={}){
  const file=v32AiSelectedFile||null,text=(document.getElementById('v32AiSourceText')?.value||'').trim();const origin2={...(origin||{})};
  if(!origin2.fingerprint)origin2.fingerprint=v40134Fingerprint(text,file);
  if(!origin2.sourceName)origin2.sourceName=file?.name||(text?'Văn bản/LaTeX đã dán':'Nguồn AI');
  if(!origin2.sourceKind)origin2.sourceKind=file?(text?'text+file':'file'):'text';
  const list=v40134BaseAddDrafts? v40134BaseAddDrafts(rawQuestions,origin2):[];const ctx=v40134GetCtx(origin2.fingerprint)||null;const attached=v40134AssignAssets(list,ctx);
  if(attached&&typeof v32RenderAiDraftQueue==='function')v32RenderAiDraftQueue();
  return list;
};

const v40134BaseExtract=window.v32AiExtractQuestions;
window.v32AiExtractQuestions=async function(){await v40134PrepareContext();return await v40134BaseExtract.apply(this,arguments)};
const v40134BasePipeStart=window.v4013StartPipeline;
window.v4013StartPipeline=async function(){await v40134PrepareContext();return await v40134BasePipeStart.apply(this,arguments)};

const v40134BaseFigureTag=window.figureModeTag;
window.figureModeTag=function(mode='tikz'){if(mode==='image')return 'Hình gốc đính kèm';return v40134BaseFigureTag? v40134BaseFigureTag(mode):mode};

const v40134BaseQuestionFigureHTML=window.questionFigureHTML;
window.questionFigureHTML=function(item={},compact=false){
  const mode=item.figureMode||((item.figureLatex||'').trim()?'tikz':'none');
  if(mode==='image'&&String(item.figureImageData||'').startsWith('data:image/')){
    const cap=item.figureCaption?`<div class="latex-figure-caption">${v40134Math(item.figureCaption)}</div>`:'';
    const meta=item.figureAssetMeta||{},summary=`Hình gốc của câu • ${meta.label||item.figureImageName||'ảnh nguồn'}`;
    return `<div class="latex-figure ${compact?'compact':''} v40134-image-figure"><div class="v40134-image-shell"><img class="v40134-image" loading="lazy" alt="Hình gốc câu hỏi" src="${v40134Attr(item.figureImageData)}"></div>${cap}<details class="latex-figure-code"><summary>${v40134Esc(summary)}</summary><div class="math-help">Chế độ: hình gốc đính kèm • ${v40134Esc(meta.kind||item.figureSourceKind||'image')} ${meta.width&&meta.height?`• ${meta.width}×${meta.height}`:''}</div></details></div>`;
  }
  return v40134BaseQuestionFigureHTML? v40134BaseQuestionFigureHTML(item,compact):'';
};

const v40134BaseBuildPreview=window.buildQuestionPreviewHTML;
if(typeof v40134BaseBuildPreview==='function')window.buildQuestionPreviewHTML=function(x,opts={}){
  let html=v40134BaseBuildPreview(x,opts);
  if((x?.figureMode==='image'&&x?.figureImageData)&&!html.includes('Hình gốc đính kèm')){
    html=html.replace(/(<div class="quiz-meta">)/,`$1<span class="bank-tag-figure">Hình gốc đính kèm</span>`)
  }
  return html;
};

const v40134BaseQuestionToLatex=window.v29QuestionToLatex;
if(typeof v40134BaseQuestionToLatex==='function')window.v29QuestionToLatex=function(q={}){
  let tex=v40134BaseQuestionToLatex(q);
  if(q?.figureMode==='image'&&q?.figureImageData){
    tex += `\n% figure-mode=image\n% figure-image-name=${String(q.figureImageName||q.figureAssetMeta?.label||'source-image').replace(/\s+/g,' ')}\n% figure-note=Hinh goc duoc dinh kem trong Math12 Hub v40.13.4; neu xuat sang LaTeX doc lap can thay bang \\includegraphics hoac ve lai TikZ.\n`;
  }
  return tex;
};

function v40134InjectStyles(){if(document.getElementById('v40134FigureStyles'))return;const css=`
.v40134-image-figure{border:1px solid rgba(63,92,179,.15);border-radius:16px;padding:10px;background:linear-gradient(180deg,#fff,#f7f9ff)}
.v40134-image-shell{display:flex;justify-content:center;align-items:center;background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:12px;padding:8px;overflow:auto}
.v40134-image{display:block;max-width:100%;height:auto;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.08)}
.v40134-queue-figure{margin-top:10px;border:1px dashed rgba(59,130,246,.35);background:#f8fbff;border-radius:12px;padding:10px}
.v40134-queue-figure-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}
.v40134-queue-chip{display:inline-flex;align-items:center;gap:6px;background:#eaf2ff;color:#23408e;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700}
.v40134-queue-thumb{max-width:100%;max-height:240px;border:1px solid rgba(15,23,42,.08);border-radius:10px;background:#fff;display:block;margin:auto}
.v40134-preview-note{font-size:12px;color:#5f6c82;line-height:1.55;margin-top:8px}
`;
  const st=document.createElement('style');st.id='v40134FigureStyles';st.textContent=css;document.head.appendChild(st)}
function v40134EnhanceDraftCards(){
  v40134InjectStyles();const box=document.getElementById('v32AiDraftQueue');if(!box)return;
  box.querySelectorAll('.v32-draft-card').forEach(card=>{
    if(card.querySelector('.v40134-queue-figure'))return;const html=card.innerHTML||'';const m=html.match(/v32PreviewDraft\('([^']+)'\)/);if(!m)return;const id=m[1];const draft=(v32AiDrafts||[]).find(x=>x.draftId===id);const q=draft?.question||{};if(!(q.figureMode==='image'&&q.figureImageData))return;
    const wrap=document.createElement('div');wrap.className='v40134-queue-figure';const meta=q.figureAssetMeta||{};wrap.innerHTML=`<div class="v40134-queue-figure-head"><span class="v40134-queue-chip">🖼 Hình gốc</span><span class="v40134-queue-chip">${v40134Esc(meta.label||q.figureImageName||'ảnh nguồn')}</span>${meta.width&&meta.height?`<span class="v40134-queue-chip">${meta.width}×${meta.height}</span>`:''}</div><img class="v40134-queue-thumb" alt="Hình gốc câu hỏi" src="${v40134Attr(q.figureImageData)}"><div class="v40134-preview-note">v40.13.4 đã đính kèm hình gốc từ nguồn vào câu này. Thầy/cô vẫn nên xem lại việc gắn đúng câu, nhất là khi nguồn có nhiều hình hoặc PDF scan.</div>`;
    const anchor=card.querySelector('.v32-draft-meta')||card.querySelector('.v32-draft-actions')||card;anchor.parentNode.insertBefore(wrap,anchor.nextSibling);
  })
}
const v40134BaseRenderDraftQueue=window.v32RenderAiDraftQueue;
window.v32RenderAiDraftQueue=function(){const r=v40134BaseRenderDraftQueue? v40134BaseRenderDraftQueue.apply(this,arguments):undefined;setTimeout(v40134EnhanceDraftCards,0);return r};

const v40134BasePreviewDraft=window.v32PreviewDraft;
window.v32PreviewDraft=function(){const r=v40134BasePreviewDraft? v40134BasePreviewDraft.apply(this,arguments):undefined;setTimeout(v40134InjectStyles,0);return r};

window.V40134FigureAttach={prepareContext:v40134PrepareContext,build:V40134_BUILD,loadContext:v40134GetCtx,assignAssets:v40134AssignAssets};
Promise.resolve().then(()=>{if(!v40134InitDone){v40134InitDone=true;v40134InjectStyles();setTimeout(v40134EnhanceDraftCards,100)}}).catch(()=>{});
console.info('Math12 Hub V40.13.4 Figure Attach loaded');
})();


/* =========================================================
   Math12 Hub V40.13.5 — Figure Picker & Image Editor Support
   - gán/đổi/xóa hình thủ công cho từng draft AI
   - trình soạn hỗ trợ figureMode=image, không làm mất hình khi sửa/lưu
   ========================================================= */
(function(){
'use strict';
const V40135_BUILD='40.13.5-figure-picker-editor';
const V40135_CTX_KEY='math12hub.ai.v40.13.4.figureContexts';
function v40135Safe(raw,fallback){try{return JSON.parse(raw)}catch(_){return fallback}}
function v40135Store(){return v40135Safe(localStorage.getItem(V40135_CTX_KEY)||'{}',{})}
function v40135Esc(s=''){return typeof esc==='function'?esc(String(s||'')):String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function v40135Attr(s=''){return typeof attrEsc==='function'?attrEsc(String(s||'')):v40135Esc(s).replace(/`/g,'&#96;')}
function v40135Math(s=''){return typeof mathHTML==='function'?mathHTML(String(s||'')):v40135Esc(s)}
function v40135Draft(id){return (v32AiDrafts||[]).find(x=>x.draftId===id)||null}
function v40135QuestionLikelyHasFigure(q={}){const blob=[q.question,q.explanation,q.form,...(q.options||[]),...(q.statements||[]).map(x=>x?.text||''),...(q.aiV32?.warnings||[])].join(' ').toLowerCase();return /(hình|hình vẽ|đồ thị|bảng biến thiên|biểu đồ|hình bên|bên hình|quan sát hình|theo đồ thị|oxyz|oxy|trục tọa độ|hàm số có đồ thị)/i.test(blob)}
function v40135RelevantContexts(draft){
  const store=v40135Store(),fp=draft?.question?.aiV32?.sourceFingerprint||'';
  const arr=[];if(fp&&store[fp])arr.push({fingerprint:fp,...store[fp]});
  Object.entries(store).forEach(([k,v])=>{if(k===fp)return;arr.push({fingerprint:k,...(v||{})})});
  return arr.filter(x=>Array.isArray(x.assets)&&x.assets.length)
}
function v40135SetDraftImageData(draftId,{dataUrl='',name='',label='',kind='image',width=0,height=0,bytes=0,ctxFingerprint='',ctxSourceKind='',assetId=''}={}){
  const d=v40135Draft(draftId);if(!d)return false;const q=d.question||{};if(!String(dataUrl||'').startsWith('data:image/'))return false;
  q.figureMode='image';q.figureLayout=q.figureLayout||'below';q.figureCaption=q.figureCaption||'';q.figureLatex='';q.figureImageData=dataUrl;q.figureImageName=name||label||'image';q.figureSourceKind=ctxSourceKind||'image';
  q.figureAssetMeta={assetId:assetId||'',label:label||name||'',kind,width,height,bytes,assignedBy:'v40.13.5-manual',sourceFingerprint:ctxFingerprint||q.aiV32?.sourceFingerprint||'',assignedAt:new Date().toISOString()};
  q.aiV32={...(q.aiV32||{}),figureAttached:true,figureAttachmentMode:'manual-image',pipelineSchema:40135};
  let tags=Array.isArray(q.tags)?q.tags.slice():[];if(!tags.includes('figure-source-image'))tags.push('figure-source-image');if(typeof v29NormalizeTags==='function')tags=v29NormalizeTags(tags);q.tags=tags;
  v32AiPersistDrafts?.();v32RenderAiDraftQueue?.();return true
}
function v40135ClearDraftImage(draftId){
  const d=v40135Draft(draftId);if(!d)return false;const q=d.question||{};delete q.figureImageData;delete q.figureImageName;delete q.figureAssetMeta;delete q.figureSourceKind;q.figureLatex='';q.figureMode='none';q.figureCaption='';
  if(Array.isArray(q.tags))q.tags=q.tags.filter(x=>x!=='figure-source-image');
  q.aiV32={...(q.aiV32||{}),figureAttached:false,figureAttachmentMode:'cleared',pipelineSchema:40135};
  v32AiPersistDrafts?.();v32RenderAiDraftQueue?.();return true
}
async function v40135ReadFileAsDataUrl(file){return await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Không đọc được tệp hình.'));r.onload=()=>resolve(String(r.result||''));r.readAsDataURL(file)})}
function v40135ImageInfo(dataUrl){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth||img.width||0,height:img.naturalHeight||img.height||0});img.onerror=()=>reject(new Error('Không đọc được kích thước ảnh.'));img.src=dataUrl})}
async function v40135UploadDraftFigure(draftId,input){const file=input?.files?.[0];if(!file)return;if(!/^image\//i.test(file.type||''))return alert('Chỉ nhận tệp ảnh.');const dataUrl=await v40135ReadFileAsDataUrl(file);const info=await v40135ImageInfo(dataUrl).catch(()=>({width:0,height:0}));v40135SetDraftImageData(draftId,{dataUrl,name:file.name,label:file.name,kind:'manual-upload',width:info.width,height:info.height,bytes:Math.round((dataUrl.length*3)/4)});closeModal();examToast?.('Đã gắn hình cho câu trong Hàng chờ AI.');}
function v40135PickDraftSourceFigure(draftId,ctxFp,assetId){const ctx=v40135Store()[ctxFp];const asset=(ctx?.assets||[]).find(x=>x.assetId===assetId);if(!asset)return;v40135SetDraftImageData(draftId,{dataUrl:asset.dataUrl,name:asset.name||asset.label,label:asset.label||asset.name,kind:asset.kind||'source-image',width:Number(asset.width)||0,height:Number(asset.height)||0,bytes:Number(asset.bytes)||0,ctxFingerprint:ctxFp,ctxSourceKind:ctx?.sourceKind||'',assetId:asset.assetId||''});closeModal();examToast?.('Đã gắn hình nguồn cho câu.');}
function v40135OpenDraftFigurePicker(draftId){
  const d=v40135Draft(draftId);if(!d)return;const q=d.question||{},contexts=v40135RelevantContexts(d),cur=q.figureMode==='image'&&q.figureImageData?`<div class="v40135-current"><b>Hình hiện tại</b><img src="${v40135Attr(q.figureImageData)}" alt="Hình hiện tại"><div class="math-help">${v40135Esc(q.figureImageName||q.figureAssetMeta?.label||'')}</div></div>`:'<div class="math-help">Câu này chưa có hình đính kèm.</div>';
  const gallery=contexts.length?contexts.map(ctx=>`<div class="v40135-ctx"><div class="v40135-ctx-head"><b>${v40135Esc(ctx.sourceName||'Nguồn ảnh')}</b><span>${v40135Esc(ctx.sourceKind||'')}</span></div><div class="v40135-gallery">${(ctx.assets||[]).map(a=>`<div class="v40135-asset"><img src="${v40135Attr(a.dataUrl||'')}" alt="${v40135Attr(a.label||a.name||'asset')}"><div class="v40135-asset-meta"><b>${v40135Esc(a.label||a.name||'Ảnh')}</b><small>${a.width&&a.height?`${a.width}×${a.height}`:''}</small></div><button class="btn btn-blue" onclick="v40135PickDraftSourceFigure('${v40135Attr(draftId)}','${v40135Attr(ctx.fingerprint)}','${v40135Attr(a.assetId||'')}')">Chọn ảnh này</button></div>`).join('')}</div></div>`).join(''):'<div class="math-help">Chưa có bộ hình nguồn đã lưu. Hãy nhập lại bằng ảnh/Word hoặc tải ảnh lên trực tiếp cho câu này.</div>';
  const body=`<div class="v40135-picker"><div class="firebase-banner"><b>${v40135Esc(q.id)}</b> • ${v40135Esc(displayKnowledgeCode?.(q.knowledgeCode)||q.knowledgeCode||'')} • ${v40135Esc(q.level||'')}</div>${cur}<div class="field"><label>Tải ảnh thủ công cho riêng câu này</label><input type="file" accept="image/*" onchange="v40135UploadDraftFigure('${v40135Attr(draftId)}',this)"></div><div class="v40135-sep"></div>${gallery}</div>`;
  openModal('Gán/đổi hình cho bản nháp AI','Chọn một ảnh nguồn hoặc tải ảnh mới',body,`<button class="btn btn-soft" onclick="closeModal()">Đóng</button><button class="btn btn-danger" onclick="v40135ClearDraftImage('${v40135Attr(draftId)}');closeModal();">Bỏ hình</button>`);v40135InjectStyles();
}
function v40135InjectStyles(){if(document.getElementById('v40135FigureStyles'))return;const st=document.createElement('style');st.id='v40135FigureStyles';st.textContent=`
.v40135-picker{display:grid;gap:14px}.v40135-current{border:1px solid rgba(59,130,246,.18);background:#f8fbff;border-radius:14px;padding:12px}.v40135-current img{display:block;max-width:100%;max-height:260px;margin:10px auto 0;border-radius:10px;border:1px solid rgba(15,23,42,.08)}
.v40135-sep{height:1px;background:rgba(15,23,42,.08)}.v40135-ctx{border:1px solid rgba(15,23,42,.08);border-radius:14px;padding:12px;background:#fff}.v40135-ctx-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px;color:#44506a}
.v40135-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.v40135-asset{border:1px solid rgba(15,23,42,.08);border-radius:12px;padding:10px;background:#fcfdff;display:grid;gap:8px}.v40135-asset img{width:100%;height:140px;object-fit:contain;background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:10px}
.v40135-asset-meta{display:grid;gap:4px}.v40135-draft-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:#eaf2ff;color:#1e3a8a;padding:4px 10px;font-size:12px;font-weight:700;margin-left:8px}
#qeFigureImageWrap .v40135-editor-preview{margin-top:10px;border:1px dashed rgba(59,130,246,.35);border-radius:12px;padding:10px;background:#f8fbff}#qeFigureImageWrap .v40135-editor-preview img{display:block;max-width:100%;max-height:260px;margin:auto;border-radius:10px;border:1px solid rgba(15,23,42,.08);background:#fff}
`;document.head.appendChild(st)}
function v40135EnhanceDraftActions(){
  v40135InjectStyles();const box=document.getElementById('v32AiDraftQueue');if(!box)return;
  box.querySelectorAll('.v32-draft-card').forEach(card=>{
    const m=(card.innerHTML||'').match(/v32PreviewDraft\('([^']+)'\)/);if(!m)return;const id=m[1],d=v40135Draft(id),q=d?.question||{};const act=card.querySelector('.v32-draft-actions');if(!act)return;
    if(!act.querySelector('.v40135-pick-btn')){const btn=document.createElement('button');btn.className='btn btn-soft v40135-pick-btn';btn.textContent=(q.figureMode==='image'&&q.figureImageData)?'Đổi hình':'Gán hình';btn.onclick=()=>v40135OpenDraftFigurePicker(id);act.insertBefore(btn,act.firstChild)}
    const pick=act.querySelector('.v40135-pick-btn');if(pick)pick.textContent=(q.figureMode==='image'&&q.figureImageData)?'Đổi hình':'Gán hình';
    let clear=act.querySelector('.v40135-clear-btn');if(q.figureMode==='image'&&q.figureImageData){if(!clear){clear=document.createElement('button');clear.className='btn btn-soft v40135-clear-btn';clear.textContent='Bỏ hình';clear.onclick=()=>{if(confirm('Bỏ hình đang gắn cho bản nháp này?'))v40135ClearDraftImage(id)};act.insertBefore(clear,pick?.nextSibling||null)}if(!card.querySelector('.v40135-draft-chip')){const meta=card.querySelector('.v32-draft-meta');if(meta){const span=document.createElement('span');span.className='v40135-draft-chip';span.textContent='🖼 có hình gốc';meta.appendChild(span)}}}
    else{clear?.remove();card.querySelector('.v40135-draft-chip')?.remove()}
  })
}
const v40135BaseRenderDraftQueue=window.v32RenderAiDraftQueue;window.v32RenderAiDraftQueue=function(){const r=v40135BaseRenderDraftQueue?v40135BaseRenderDraftQueue.apply(this,arguments):undefined;setTimeout(v40135EnhanceDraftActions,0);return r};

function v40135EnsureEditorImageControls(){
  const modeSel=document.getElementById('qeFigureMode');if(!modeSel)return;v40135InjectStyles();if(!modeSel.querySelector('option[value="image"]')){const op=document.createElement('option');op.value='image';op.textContent='Hình ảnh gốc đính kèm';modeSel.appendChild(op)}
  let wrap=document.getElementById('qeFigureImageWrap');if(!wrap){wrap=document.createElement('div');wrap.id='qeFigureImageWrap';wrap.className='field full hidden';wrap.innerHTML=`<label>Hình gốc đính kèm</label><div class="figure-toolbar"><button type="button" class="btn btn-soft" onclick="v40135PickEditorImage()">Chọn / đổi ảnh</button><button type="button" class="btn btn-soft" onclick="document.getElementById('v40135UploadEditorImageInput').click()">Tải ảnh lên</button><button type="button" class="btn btn-soft" onclick="v40135ClearEditorImage()">Xóa ảnh</button><input id="v40135UploadEditorImageInput" type="file" accept="image/*" style="display:none" onchange="v40135UploadEditorImage(this)"><input type="hidden" id="qeFigureImageData"><input type="hidden" id="qeFigureImageName"><input type="hidden" id="qeFigureAssetMetaJson"></div><div id="qeFigureImagePreview" class="v40135-editor-preview"></div><div class="math-help">Dùng cho câu có hình gốc/ảnh scan. Khi xuất LaTeX độc lập, thầy/cô nên thay bằng <code>\\includegraphics</code> hoặc vẽ lại TikZ nếu cần.</div>`;const anchor=document.getElementById('qeFigureWrap');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(wrap,anchor.nextSibling)}
}
function v40135SyncEditorImageUI(){
  v40135EnsureEditorImageControls();const mode=document.getElementById('qeFigureMode')?.value||'none',codeWrap=document.getElementById('qeFigureWrap'),imgWrap=document.getElementById('qeFigureImageWrap'),prev=document.getElementById('qeFigureImagePreview');if(codeWrap)codeWrap.classList.toggle('hidden',mode==='none'||mode==='image');if(imgWrap)imgWrap.classList.toggle('hidden',mode!=='image');
  const data=document.getElementById('qeFigureImageData')?.value||'',name=document.getElementById('qeFigureImageName')?.value||'',meta=v40135Safe(document.getElementById('qeFigureAssetMetaJson')?.value||'{}',{});
  if(prev){prev.innerHTML=data?`<img src="${v40135Attr(data)}" alt="Hình câu hỏi"><div class="v40135-editor-meta">${v40135Esc(name||meta.label||'')}</div>`:'<div class="math-help">Chưa chọn hình cho câu này.</div>'}
}
function v40135SetEditorImage({dataUrl='',name='',meta=null}={}){v40135EnsureEditorImageControls();const d=document.getElementById('qeFigureImageData'),n=document.getElementById('qeFigureImageName'),m=document.getElementById('qeFigureAssetMetaJson'),mode=document.getElementById('qeFigureMode');if(d)d.value=dataUrl||'';if(n)n.value=name||'';if(m)m.value=JSON.stringify(meta||{});if(mode)mode.value=dataUrl?'image':'none';v40135SyncEditorImageUI();updateQuestionEditorPreview?.()}
async function v40135UploadEditorImage(input){const file=input?.files?.[0];if(!file)return;const dataUrl=await v40135ReadFileAsDataUrl(file),info=await v40135ImageInfo(dataUrl).catch(()=>({width:0,height:0}));v40135SetEditorImage({dataUrl,name:file.name,meta:{kind:'manual-upload',label:file.name,width:info.width,height:info.height,bytes:Math.round((dataUrl.length*3)/4)}});if(input)input.value=''}
function v40135ClearEditorImage(){v40135SetEditorImage({dataUrl:'',name:'',meta:{}})}
function v40135PickEditorImage(){
  const sourceDraft=(()=>{const qid=document.getElementById('qeId')?.value||'';return (v32AiDrafts||[]).find(d=>d.question?.id===qid)||null})();
  const contexts=v40135RelevantContexts(sourceDraft||{}),gallery=contexts.length?contexts.map(ctx=>`<div class="v40135-ctx"><div class="v40135-ctx-head"><b>${v40135Esc(ctx.sourceName||'Nguồn ảnh')}</b><span>${v40135Esc(ctx.sourceKind||'')}</span></div><div class="v40135-gallery">${(ctx.assets||[]).map(a=>`<div class="v40135-asset"><img src="${v40135Attr(a.dataUrl||'')}" alt="${v40135Attr(a.label||a.name||'asset')}"><div class="v40135-asset-meta"><b>${v40135Esc(a.label||a.name||'Ảnh')}</b><small>${a.width&&a.height?`${a.width}×${a.height}`:''}</small></div><button class="btn btn-blue" onclick="v40135UseEditorAsset('${v40135Attr(ctx.fingerprint)}','${v40135Attr(a.assetId||'')}')">Dùng ảnh này</button></div>`).join('')}</div></div>`).join(''):'<div class="math-help">Chưa có bộ hình nguồn đã lưu để chọn.</div>';
  openModal('Chọn hình cho trình soạn','Gán ảnh gốc vào câu hỏi',`<div class="v40135-picker"><div class="field"><label>Tải ảnh lên từ máy</label><input type="file" accept="image/*" onchange="v40135UploadEditorImage(this);closeModal()"></div><div class="v40135-sep"></div>${gallery}</div>`,`<button class="btn btn-soft" onclick="closeModal()">Đóng</button><button class="btn btn-danger" onclick="v40135ClearEditorImage();closeModal()">Xóa ảnh</button>`);v40135InjectStyles();
}
function v40135UseEditorAsset(ctxFp,assetId){const ctx=v40135Store()[ctxFp];const asset=(ctx?.assets||[]).find(x=>x.assetId===assetId);if(!asset)return;v40135SetEditorImage({dataUrl:asset.dataUrl,name:asset.name||asset.label,meta:{assetId:asset.assetId||'',label:asset.label||asset.name||'',kind:asset.kind||'source-image',width:Number(asset.width)||0,height:Number(asset.height)||0,bytes:Number(asset.bytes)||0,sourceFingerprint:ctxFp,sourceKind:ctx?.sourceKind||'',assignedBy:'v40.13.5-editor'}});closeModal()}

const v40135BaseOpenEditor=window.openQuestionEditor;window.openQuestionEditor=function(id=''){const r=v40135BaseOpenEditor? v40135BaseOpenEditor.apply(this,arguments):undefined;setTimeout(()=>{v40135EnsureEditorImageControls();const q=id?state.questionBank.find(x=>x.id===id):null;if(q?.figureMode==='image'&&q?.figureImageData)v40135SetEditorImage({dataUrl:q.figureImageData,name:q.figureImageName||q.figureAssetMeta?.label||'',meta:q.figureAssetMeta||{}});else v40135SyncEditorImageUI()},0);return r};
const v40135BaseToggleFigure=window.toggleQuestionFigureFields;window.toggleQuestionFigureFields=function(){const r=v40135BaseToggleFigure? v40135BaseToggleFigure.apply(this,arguments):undefined;v40135SyncEditorImageUI();return r};
const v40135BaseReadDraft=window.readQuestionEditorDraft;window.readQuestionEditorDraft=function(){const x=v40135BaseReadDraft? v40135BaseReadDraft.apply(this,arguments):{};const mode=document.getElementById('qeFigureMode')?.value||x.figureMode||'none';if(mode==='image'){x.figureMode='image';x.figureLatex='';x.figureImageData=document.getElementById('qeFigureImageData')?.value||'';x.figureImageName=document.getElementById('qeFigureImageName')?.value||'';x.figureAssetMeta=v40135Safe(document.getElementById('qeFigureAssetMetaJson')?.value||'{}',{})}return x};
const v40135BaseEditDraft=window.v32EditDraft;window.v32EditDraft=function(id){const r=v40135BaseEditDraft? v40135BaseEditDraft.apply(this,arguments):undefined;setTimeout(()=>{const d=v40135Draft(id),q=d?.question||{};if(q.figureMode==='image'&&q.figureImageData)v40135SetEditorImage({dataUrl:q.figureImageData,name:q.figureImageName||q.figureAssetMeta?.label||'',meta:q.figureAssetMeta||{}})},0);return r};

const v40135BaseSaveEditor=window.saveQuestionEditor;window.saveQuestionEditor=function(editId=''){
  const mode=document.getElementById('qeFigureMode')?.value||'none';if(mode!=='image')return v40135BaseSaveEditor? v40135BaseSaveEditor.apply(this,arguments):undefined;
  if(!requireTeacher('Lưu câu hỏi'))return;
  let lessonId=document.getElementById('qeLesson').value,lesson=getLesson(lessonId),type=document.getElementById('qeType').value,question=document.getElementById('qeQuestion').value.trim(),rawAns=document.getElementById('qeAnswer').value.trim(),customId=document.getElementById('qeId').value.trim().replace(/[^A-Za-z0-9._-]/g,'-');
  const extracted=extractTikzFromText(question);question=(extracted.text||question).trim();if(!question){alert('Cần nhập nội dung câu hỏi.');return}
  const figureImageData=document.getElementById('qeFigureImageData')?.value||'',figureImageName=document.getElementById('qeFigureImageName')?.value||'',figureAssetMeta=v40135Safe(document.getElementById('qeFigureAssetMetaJson')?.value||'{}',{}),figureCaption=document.getElementById('qeFigureCaption').value.trim(),figureLayout=document.getElementById('qeFigureLayout')?.value||'below';
  if(!figureImageData){alert('Đã chọn chế độ hình ảnh nhưng chưa gắn ảnh.');return}
  let item={id:customId||editId||`QB-${Date.now().toString(36).toUpperCase()}`,chapterId:lesson.chapter.id,lessonId,knowledgeCode:document.getElementById('qeKnowledge').value,form:document.getElementById('qeForm').value.trim(),level:document.getElementById('qeLevel').value,type,question,explanation:document.getElementById('qeExplanation').value.trim(),figureMode:'image',figureLatex:'',figureCaption,figureLayout,figureImageData,figureImageName,figureAssetMeta,source:'custom'};
  if(type==='mcq'){let opts=document.getElementById('qeOptions').value.split('\n').map(x=>x.trim()).filter(Boolean);if(opts.length<2){alert('Câu nhiều lựa chọn cần ít nhất 2 phương án.');return}let ai='ABCD'.indexOf(rawAns.toUpperCase());if(ai<0||ai>=opts.length){alert('Đáp án câu nhiều lựa chọn cần là A, B, C hoặc D tương ứng phương án.');return}item.options=opts;item.answer=ai}else if(type==='tf4'){let lines=(document.getElementById('qeTF4Statements')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);if(lines.length!==4){alert('Câu Đúng/Sai 4 ý cần đúng 4 dòng.');return}let exps=(document.getElementById('qeTF4Explanations')?.value||'').split('\n');item.statements=lines.map((s,i)=>({text:s.replace(/\\True\b/g,'').trim(),answer:/\\True\b/.test(s),explanation:(exps[i]||'').trim()}))}else if(type==='tf'){let a=rawAns.toLowerCase();if(!['đúng','dung','true','sai','false'].includes(a)){alert('Đáp án Đúng/Sai hãy nhập “Đúng” hoặc “Sai”.');return}item.answer=['đúng','dung','true'].includes(a)}else{if(!rawAns){alert('Cần nhập đáp án ngắn.');return}item.answer=rawAns}
  const latexCheck=validateQuestionLatexItem(item);if(latexCheck.errors.length){alert('Câu hỏi còn lỗi LaTeX cần sửa trước khi lưu:\n- '+latexCheck.errors.join('\n- '));return}if(latexCheck.warnings.length&&!confirm('Có một số cảnh báo LaTeX:\n- '+latexCheck.warnings.join('\n- ')+'\n\nVẫn lưu câu hỏi?'))return;
  const oldStableId=editId?state.questionBank.find(q=>q.id===editId)?.questionId||'':'';window.QuestionIdV40?.ensure?.(item,{preserve:oldStableId});
  if(state.questionBank.some(q=>q.id===item.id&&q.id!==editId)){alert('Mã câu đã tồn tại.');return}
  if(editId){let i=state.questionBank.findIndex(q=>q.id===editId);if(i>=0)state.questionBank[i]=item}else state.questionBank.unshift(item);save();closeModal();renderQuestionBank(true)
 };

window.v40135OpenDraftFigurePicker=v40135OpenDraftFigurePicker;window.v40135UploadDraftFigure=v40135UploadDraftFigure;window.v40135PickDraftSourceFigure=v40135PickDraftSourceFigure;window.v40135ClearDraftImage=function(draftId){v40135ClearDraftImage(draftId);examToast?.('Đã bỏ hình khỏi bản nháp AI.')};window.v40135PickEditorImage=v40135PickEditorImage;window.v40135UploadEditorImage=v40135UploadEditorImage;window.v40135UseEditorAsset=v40135UseEditorAsset;window.v40135ClearEditorImage=v40135ClearEditorImage;
Promise.resolve().then(()=>setTimeout(v40135EnhanceDraftActions,120));console.info('Math12 Hub V40.13.5 Figure Picker & Image Editor loaded');
})();

/* =========================================================
   Math12 Hub V40.13.6 — Smart Figure Mapping & Review Center
   - map Word embedded images to sourceOrdinal from document order
   - block bulk QC when a referenced figure is missing/unverified
   - bulk Figure Review Center for teacher confirmation
   ========================================================= */
(function(){
'use strict';
const V40136_BUILD='40.13.6-smart-figure-review';
const V40136_CTX_KEY='math12hub.ai.v40.13.4.figureContexts';
function v40136Safe(raw,fallback){try{return JSON.parse(raw)}catch(_){return fallback}}
function v40136Store(){return v40136Safe(localStorage.getItem(V40136_CTX_KEY)||'{}',{})}
function v40136SaveStore(x){try{localStorage.setItem(V40136_CTX_KEY,JSON.stringify(x||{}))}catch(_){}}
function v40136Esc(s=''){return typeof esc==='function'?esc(String(s||'')):String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function v40136Attr(s=''){return typeof attrEsc==='function'?attrEsc(String(s||'')):v40136Esc(s).replace(/`/g,'&#96;')}
function v40136Likely(q={}){const blob=[q.question,q.explanation,q.form,q.aiV32?.sourceNote,...(q.options||[]),...(q.statements||[]).map(x=>x?.text||''),...(q.aiV32?.warnings||[])].join(' ').toLowerCase();return /(hình|hình vẽ|đồ thị|bảng biến thiên|biểu đồ|hình bên|bên hình|quan sát hình|theo đồ thị|hàm số có đồ thị|oxyz|oxy|trục tọa độ|hình sau)/i.test(blob)}
function v40136HasImage(q={}){return q.figureMode==='image'&&String(q.figureImageData||'').startsWith('data:image/')}
function v40136HasCodeFigure(q={}){return q.figureMode&&q.figureMode!=='none'&&q.figureMode!=='image'&&!!String(q.figureLatex||'').trim()}
function v40136Verified(q={}){const m=q.figureAssetMeta||{};return !!m.verifiedByTeacher||/manual|editor/i.test(String(m.assignedBy||''))}
function v40136Status(q={}){if(v40136HasImage(q))return v40136Verified(q)?'verified':'unverified';if(v40136HasCodeFigure(q))return 'latex';if(v40136Likely(q))return 'missing';return 'none'}
function v40136Draft(id){return (v32AiDrafts||[]).find(x=>x.draftId===id)||null}
function v40136CurrentFingerprint(){const file=v32AiSelectedFile||null,text=(document.getElementById('v32AiSourceText')?.value||'').trim();const meta=file?`${file.name}|${file.size}|${file.lastModified}|${file.type}`:'text-only';let h=2166136261,s=meta+'|'+text.slice(0,50000);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return `S-${(h>>>0).toString(36)}`}
async function v40136InflateRaw(bytes){if(!('DecompressionStream' in window))throw new Error('Trình duyệt chưa hỗ trợ giải nén Word.');const ds=new DecompressionStream('deflate-raw');return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer())}
async function v40136ZipEntries(file){const buf=await file.arrayBuffer(),u8=new Uint8Array(buf),dv=new DataView(buf);let eocd=-1;for(let i=Math.max(0,u8.length-65557);i<=u8.length-22;i++){if(dv.getUint32(i,true)===0x06054b50)eocd=i}if(eocd<0)throw new Error('Không đọc được cấu trúc Word.');const count=dv.getUint16(eocd+10,true),cdOffset=dv.getUint32(eocd+16,true),dec=new TextDecoder('utf-8'),out=new Map();let p=cdOffset;for(let n=0;n<count&&p+46<=u8.length;n++){if(dv.getUint32(p,true)!==0x02014b50)break;const method=dv.getUint16(p+10,true),compSize=dv.getUint32(p+20,true),fnLen=dv.getUint16(p+28,true),exLen=dv.getUint16(p+30,true),cmLen=dv.getUint16(p+32,true),local=dv.getUint32(p+42,true),name=dec.decode(u8.subarray(p+46,p+46+fnLen));if(local+30<=u8.length&&dv.getUint32(local,true)===0x04034b50){const lfn=dv.getUint16(local+26,true),lex=dv.getUint16(local+28,true),start=local+30+lfn+lex,end=start+compSize;if(end<=u8.length)out.set(name,{name,method,bytes:u8.slice(start,end)})}p+=46+fnLen+exLen+cmLen}return out}
async function v40136EntryBytes(e){if(!e)return new Uint8Array();if(e.method===0)return e.bytes;if(e.method===8)return await v40136InflateRaw(e.bytes);throw new Error('Kiểu nén Word chưa hỗ trợ.')}
function v40136RelTargetPath(target=''){let t=String(target||'').replace(/\\/g,'/').replace(/^\.\//,'');if(t.startsWith('../'))t=t.replace(/^\.\.\//,'');return t.startsWith('word/')?t:`word/${t}`}
function v40136EmbedId(node){if(!node)return '';for(const a of [...(node.attributes||[])])if(a.localName==='embed'||/(:|^)embed$/i.test(a.name))return a.value||'';return ''}
async function v40136AnnotateDocx(file,ctx){
  if(!file||!(/\.docx$/i.test(file.name||'')||String(file.type||'').includes('wordprocessingml.document'))||!ctx?.assets?.length)return ctx;
  const entries=await v40136ZipEntries(file),dec=new TextDecoder('utf-8'),docE=entries.get('word/document.xml'),relsE=entries.get('word/_rels/document.xml.rels');if(!docE||!relsE)return ctx;
  const docXml=dec.decode(await v40136EntryBytes(docE)),relsXml=dec.decode(await v40136EntryBytes(relsE)),doc=new DOMParser().parseFromString(docXml,'application/xml'),rels=new DOMParser().parseFromString(relsXml,'application/xml');
  const relMap={};[...rels.getElementsByTagNameNS('*','Relationship')].forEach(r=>{const id=r.getAttribute('Id')||'',target=r.getAttribute('Target')||'';if(id&&target)relMap[id]=v40136RelTargetPath(target)});
  let currentOrdinal=0,lastText='',imgSeq=0;const mapped=[];for(const p of [...doc.getElementsByTagNameNS('*','p')]){const text=String(p.textContent||'').replace(/\s+/g,' ').trim();const qm=text.match(/(?:Câu|Cau|Question)\s*(\d+)/i);if(qm)currentOrdinal=Number(qm[1])||currentOrdinal;if(text)lastText=text.slice(0,220);for(const blip of [...p.getElementsByTagNameNS('*','blip')]){const rid=v40136EmbedId(blip),path=relMap[rid]||'',base=path.split('/').pop()||'';let asset=ctx.assets.find(a=>String(a.name||'').replace(/\\/g,'/')===path)||ctx.assets.find(a=>String(a.name||'').endsWith('/'+base))||ctx.assets[imgSeq]||null;if(!asset)continue;imgSeq++;asset.sourceOrdinalHint=currentOrdinal||0;asset.nearText=(text||lastText||'').slice(0,220);asset.relationshipId=rid;asset.documentPath=path;asset.smartMappedAt=new Date().toISOString();mapped.push(asset.assetId)}}
  ctx.smartWordMap={mappedAssets:[...new Set(mapped)].length,totalAssets:ctx.assets.length,version:40136,updatedAt:new Date().toISOString()};ctx.updatedAt=new Date().toISOString();return ctx
}
async function v40136PrepareSmartContext(){
  const file=v32AiSelectedFile||null;if(!file)return null;let ctx=null;try{ctx=await window.V40134FigureAttach?.prepareContext?.()}catch(_){}if(!ctx)return null;
  if(/\.docx$/i.test(file.name||'')||String(file.type||'').includes('wordprocessingml.document')){try{ctx=await v40136AnnotateDocx(file,ctx)}catch(err){ctx.notes=Array.isArray(ctx.notes)?ctx.notes:[];ctx.notes.push('Smart Word mapping: '+String(err?.message||err))}}
  const store=v40136Store();store[ctx.fingerprint]=ctx;v40136SaveStore(store);const meta=document.getElementById('v32AiFileMeta');if(meta&&ctx.smartWordMap?.mappedAssets)meta.textContent=`${file.name} • ${(file.size/1024/1024).toFixed(2)} MB • ${file.type||'file'} • ${ctx.assets.length} hình • ghép vị trí được ${ctx.smartWordMap.mappedAssets}/${ctx.assets.length}`;return ctx
}
function v40136AssignExact(drafts=[],ctx=null){if(!ctx?.assets?.length)return 0;let changed=0;for(const d of drafts||[]){const q=d.question||{},ord=Number(q.aiV32?.sourceOrdinal)||0;if(!ord||!v40136Likely(q))continue;const current=q.figureAssetMeta||{};if(current.verifiedByTeacher||/manual|editor/i.test(String(current.assignedBy||'')))continue;const asset=ctx.assets.find(a=>Number(a.sourceOrdinalHint)===ord);if(!asset?.dataUrl)continue;q.figureMode='image';q.figureLatex='';q.figureLayout=q.figureLayout||'below';q.figureImageData=asset.dataUrl;q.figureImageName=asset.name||asset.label||'';q.figureSourceKind='docx-smart-map';q.figureAssetMeta={assetId:asset.assetId||'',label:asset.label||asset.name||'',kind:asset.kind||'docx-media',width:Number(asset.width)||0,height:Number(asset.height)||0,bytes:Number(asset.bytes)||0,sourceFingerprint:ctx.fingerprint,sourceOrdinalHint:ord,nearText:asset.nearText||'',assignedBy:'v40.13.6-word-ordinal',mappingConfidence:95,verifiedByTeacher:false,assignedAt:new Date().toISOString()};q.aiV32={...(q.aiV32||{}),figureAttached:true,figureAttachmentMode:'word-ordinal-smart',pipelineSchema:40136};changed++}if(changed)v32AiPersistDrafts?.();return changed}
const v40136BaseAdd=window.v32AddAiDrafts;window.v32AddAiDrafts=function(rawQuestions=[],origin={}){const rows=v40136BaseAdd?v40136BaseAdd.apply(this,arguments):[];const fp=origin?.fingerprint||rows?.[0]?.question?.aiV32?.sourceFingerprint||v40136CurrentFingerprint(),ctx=v40136Store()[fp]||null;const n=v40136AssignExact(rows,ctx);if(n)setTimeout(()=>v32RenderAiDraftQueue?.(),0);return rows};
const v40136BaseExtract=window.v32AiExtractQuestions;window.v32AiExtractQuestions=async function(){await v40136PrepareSmartContext();return await v40136BaseExtract.apply(this,arguments)};
const v40136BasePipeline=window.v4013StartPipeline;window.v4013StartPipeline=async function(){await v40136PrepareSmartContext();return await v40136BasePipeline.apply(this,arguments)};
const v40136BaseHandle=window.v32AiHandleFile;window.v32AiHandleFile=function(input){const r=v40136BaseHandle? v40136BaseHandle.apply(this,arguments):undefined;setTimeout(()=>v40136PrepareSmartContext().catch(()=>{}),180);return r};

const v40136BaseChecks=window.v32LocalDraftChecks;window.v32LocalDraftChecks=function(q={}){const r=v40136BaseChecks?v40136BaseChecks(q):{issues:[],critical:[],warnings:[],safe:false};const likely=v40136Likely(q),status=v40136Status(q),critical=[...(r.critical||[])],warnings=[...(r.warnings||[])],issues=[...(r.issues||[])];if(likely&&status==='missing'){const msg='Câu có tham chiếu hình nhưng chưa gắn hình.';critical.push(msg);issues.push(msg)}else if(status==='unverified'){const msg='Hình đang được gán tự động, giáo viên chưa xác nhận đúng hình.';warnings.push(msg);issues.push(msg)}return {...r,critical:[...new Set(critical)],warnings:[...new Set(warnings)],issues:[...new Set(issues)],figureStatus:status,safe:!!r.safe&&status!=='missing'&&status!=='unverified'}};
function v40136VerifyDraft(id){const d=v40136Draft(id);if(!d||!v40136HasImage(d.question))return;d.question.figureAssetMeta={...(d.question.figureAssetMeta||{}),verifiedByTeacher:true,verifiedAt:new Date().toISOString(),verifiedBy:'teacher'};d.question.aiV32={...(d.question.aiV32||{}),figureVerifiedByTeacher:true,pipelineSchema:40136};v32AiPersistDrafts?.();v32RenderAiDraftQueue?.();examToast?.('Đã xác nhận hình đúng với câu.');}
function v40136ReassignAll(){const store=v40136Store();let n=0;for(const ctx of Object.values(store))n+=v40136AssignExact(v32AiDrafts||[],ctx);v32RenderAiDraftQueue?.();examToast?.(`Đã ghép lại ${n} câu theo vị trí hình Word.`);setTimeout(()=>v40136OpenFigureReviewCenter('all'),80)}
function v40136Counts(){const c={total:0,verified:0,unverified:0,latex:0,missing:0,none:0};for(const d of v32AiDrafts||[]){c.total++;const s=v40136Status(d.question||{});c[s]=(c[s]||0)+1}return c}
function v40136InjectStyles(){if(document.getElementById('v40136Styles'))return;const st=document.createElement('style');st.id='v40136Styles';st.textContent=`
.v40136-review{display:grid;gap:12px}.v40136-review-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.v40136-review-tools button.active{box-shadow:0 0 0 2px rgba(59,130,246,.25)}.v40136-review-list{display:grid;gap:10px;max-height:58vh;overflow:auto;padding-right:3px}.v40136-row{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:12px;border:1px solid rgba(15,23,42,.09);border-radius:14px;padding:12px;background:#fff}.v40136-row.missing{border-color:#ef4444;background:#fffafa}.v40136-row.unverified{border-color:#f59e0b;background:#fffdf6}.v40136-row.verified{border-color:#22c55e;background:#fbfffc}.v40136-stem{font-weight:700;line-height:1.55}.v40136-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.v40136-chip{font-size:12px;font-weight:800;border-radius:999px;padding:4px 9px;background:#eef2ff;color:#334155}.v40136-thumb{width:100%;height:120px;object-fit:contain;border:1px solid rgba(15,23,42,.08);border-radius:10px;background:#fff}.v40136-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.v40136-actions .btn{padding:6px 9px}.v40136-noimg{height:120px;border:1px dashed rgba(15,23,42,.18);border-radius:10px;display:grid;place-items:center;color:#64748b;font-size:12px;text-align:center;padding:8px}.v40136-summary{display:flex;flex-wrap:wrap;gap:8px}.v40136-summary span{background:#f6f8fc;border:1px solid rgba(15,23,42,.07);border-radius:10px;padding:7px 10px;font-size:12px;font-weight:700}@media(max-width:720px){.v40136-row{grid-template-columns:1fr}.v40136-thumb,.v40136-noimg{height:180px}}
`;document.head.appendChild(st)}
function v40136ReviewHtml(filter='all'){const counts=v40136Counts(),rows=(v32AiDrafts||[]).filter(d=>filter==='all'||v40136Status(d.question||{})===filter).slice(0,160);const label={verified:'✓ Đã xác nhận',unverified:'⚠ Chưa xác nhận',latex:'LaTeX/TikZ',missing:'⛔ Thiếu hình',none:'Không cần hình'};return `<div class="v40136-review"><div class="v40136-summary"><span>Tổng ${counts.total}</span><span>✓ ${counts.verified} đã xác nhận</span><span>⚠ ${counts.unverified} chưa xác nhận</span><span>⛔ ${counts.missing} thiếu hình</span><span>LaTeX ${counts.latex}</span></div><div class="v40136-review-tools"><button class="btn btn-soft ${filter==='all'?'active':''}" onclick="v40136OpenFigureReviewCenter('all')">Tất cả</button><button class="btn btn-soft ${filter==='missing'?'active':''}" onclick="v40136OpenFigureReviewCenter('missing')">Thiếu hình</button><button class="btn btn-soft ${filter==='unverified'?'active':''}" onclick="v40136OpenFigureReviewCenter('unverified')">Chưa xác nhận</button><button class="btn btn-soft ${filter==='verified'?'active':''}" onclick="v40136OpenFigureReviewCenter('verified')">Đã xác nhận</button><button class="btn btn-blue" onclick="v40136ReassignAll()">↻ Ghép lại theo Word</button></div><div class="v40136-review-list">${rows.length?rows.map(d=>{const q=d.question||{},s=v40136Status(q),has=v40136HasImage(q);return `<div class="v40136-row ${s}"><div><div class="v40136-stem">${v40136Esc(q.id||'')} • ${v40136Esc(String(q.question||'').slice(0,220))}</div><div class="v40136-meta"><span class="v40136-chip">${label[s]||s}</span>${q.aiV32?.sourceOrdinal?`<span class="v40136-chip">Nguồn #${Number(q.aiV32.sourceOrdinal)}</span>`:''}${q.figureAssetMeta?.mappingConfidence?`<span class="v40136-chip">Ghép ${Number(q.figureAssetMeta.mappingConfidence)}%</span>`:''}${q.figureAssetMeta?.nearText?`<span class="v40136-chip" title="${v40136Attr(q.figureAssetMeta.nearText)}">Theo vị trí Word</span>`:''}</div><div class="v40136-actions"><button class="btn btn-soft" onclick="closeModal();v32PreviewDraft('${v40136Attr(d.draftId)}')">Xem câu</button><button class="btn btn-soft" onclick="closeModal();v40135OpenDraftFigurePicker('${v40136Attr(d.draftId)}')">${has?'Đổi hình':'Gán hình'}</button>${has&&!v40136Verified(q)?`<button class="btn btn-blue" onclick="v40136VerifyDraft('${v40136Attr(d.draftId)}');v40136OpenFigureReviewCenter('${v40136Attr(filter)}')">✓ Đúng hình</button>`:''}</div></div><div>${has?`<img class="v40136-thumb" src="${v40136Attr(q.figureImageData)}" alt="Hình câu hỏi">`:`<div class="v40136-noimg">${s==='missing'?'Câu có nhắc tới hình nhưng chưa có ảnh':'Không có hình ảnh gốc'}</div>`}</div></div>`}).join(''):'<div class="online-empty">Không có câu trong nhóm này.</div>'}</div></div>`}
function v40136OpenFigureReviewCenter(filter='all'){v40136InjectStyles();openModal('Kiểm duyệt hình AI','Rà soát câu có hình trước khi đưa vào ngân hàng',v40136ReviewHtml(filter),`<button class="btn btn-soft" onclick="closeModal()">Đóng</button><button class="btn btn-blue" onclick="closeModal();v4013SelectSafeDrafts()">✓ Chọn câu đạt QC</button>`)}
function v40136UpdateQueueSummary(){const sum=document.getElementById('v4013QueueSummary');if(!sum)return;const c=v40136Counts();if(sum.querySelector('.v40136-summary-extra'))return;const extra=document.createElement('span');extra.className='v40136-summary-extra';extra.textContent=`🖼 ${c.verified} xác nhận • ${c.unverified} chờ xác nhận • ${c.missing} thiếu hình`;sum.appendChild(extra)}
const v40136BaseRenderQueue=window.v32RenderAiDraftQueue;window.v32RenderAiDraftQueue=function(){const r=v40136BaseRenderQueue?v40136BaseRenderQueue.apply(this,arguments):undefined;setTimeout(v40136UpdateQueueSummary,0);return r};
window.v40136OpenFigureReviewCenter=v40136OpenFigureReviewCenter;window.v40136VerifyDraft=v40136VerifyDraft;window.v40136ReassignAll=v40136ReassignAll;window.V40136FigureReview={build:V40136_BUILD,counts:v40136Counts,prepareSmartContext:v40136PrepareSmartContext};v40136InjectStyles();setTimeout(v40136UpdateQueueSummary,150);console.info('Math12 Hub V40.13.6 Smart Figure Review loaded');
})();

/* =========================================================
   Math12 Hub V40.13.7 — Auto ID6 Classifier
   Gemini proposes one official ID6 pattern; Math12 Hub validates,
   builds the final ID6, synchronizes metadata, and gates bulk import.
   ========================================================= */
(function(){
'use strict';
const V40137_BUILD='40.13.7-auto-id6-classifier';
const V40137_REVIEW_THRESHOLD=75;
const V40137_DEFAULT_AUTO_THRESHOLD=90;
const V40137_STOP=new Set('bai toan ham so tim xac dinh cho cua va la mot cac trong duoc theo voi bang dua vao tu ve co khi tren tai'.split(' '));
function api(){return window.ID6V374||null}
function hapi(){return window.ID6V3741||null}
function forms(){return api()?.allForms?.()||[]}
function validPattern(p=''){return !!api()?.formByPattern?.(String(p||''))}
function patternFromId6(v=''){const s=String(v||'');return api()?.isId6?.(s)?s.replace(/^(.{3})[NHVC](.+)$/,'$1?$2'):''}
function norm(s=''){return api()?.norm?.(s)||String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function esc37(s=''){return typeof esc==='function'?esc(String(s||'')):String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function attr37(s=''){return typeof attrEsc==='function'?attrEsc(String(s||'')):esc37(s).replace(/`/g,'&#96;')}
function autoThreshold(){return Math.max(80,Math.min(99,Number(document.getElementById('v40137Id6AutoThreshold')?.value)||V40137_DEFAULT_AUTO_THRESHOLD))}
function internalLesson(pattern=''){
  const map=api()?.BY_APP_LESSON||{};for(const [lid,arr] of Object.entries(map))if((arr||[]).some(f=>f.id6Pattern===pattern))return lid;return hapi()?.internalLessonForPattern?.(pattern)||''
}
function patternMeta(pattern='',level='TH'){
  if(!validPattern(pattern))return null;const f=api().formByPattern(pattern),lid=internalLesson(pattern),d=hapi()?.decode?.(pattern,level)||null;
  return {pattern,id6:api().buildId6(pattern,level)||'',title:f?.title||'',lessonTitle:f?.officialLessonTitle||'',lessonId:lid,decode:d}
}
function tokens(s=''){return new Set(norm(s).split(' ').filter(x=>x.length>1&&!V40137_STOP.has(x)))}
function overlapScore(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let hit=0;B.forEach(x=>{if(A.has(x))hit++});return hit/B.size}
function localCandidate(q={}){
  const explicit=validPattern(q.id6Pattern)?q.id6Pattern:validPattern(q.formId)?q.formId:patternFromId6(q.id6);if(explicit)return {pattern:explicit,confidence:100,reason:'Mã ID6/pattern đã có sẵn và hợp lệ.'};
  const exactAlias=api()?.ALIASES?.[norm(q.form||q.formTitle||'')];if(validPattern(exactAlias))return {pattern:exactAlias,confidence:97,reason:'Tên dạng khớp alias ID6 chính thức.'};
  const direct=forms().find(f=>norm(f.title)===norm(q.form||q.formTitle||''));if(direct)return {pattern:direct.id6Pattern,confidence:97,reason:'Tên dạng khớp chính xác danh mục ID6.'};
  const inferred=api()?.inferPattern?.(q)||'';if(validPattern(inferred)){
    const f=api().formByPattern(inferred),sim=overlapScore(`${q.form||''} ${q.question||''}`,`${f?.title||''}`),confidence=Math.round(Math.min(94,78+sim*14));
    return {pattern:inferred,confidence,reason:'Suy luận cục bộ từ lesson/form/nội dung câu.'};
  }
  const lid=String(q.lessonId||''),pool=lid?(api()?.BY_APP_LESSON?.[lid]||[]):forms(),hay=`${q.form||''} ${q.question||''} ${q.aiV32?.sourceNote||''}`;let best=null,bestScore=0;
  for(const f of pool){const s1=overlapScore(hay,f.title||''),s2=overlapScore(hay,f.officialLessonTitle||''),score=s1*.82+s2*.18;if(score>bestScore){bestScore=score;best=f}}
  if(best&&bestScore>=.22){const conf=Math.round(Math.min(88,58+bestScore*34+(lid?4:0)));return {pattern:best.id6Pattern,confidence:conf,reason:'So khớp từ khóa với dạng ID6 gần nhất.'}}
  return {pattern:'',confidence:0,reason:'Chưa đủ dữ kiện để suy luận ID6.'}
}
function chooseCandidate(q={},raw={}){
  const aiPattern=String(raw.id6Pattern||q.aiV32?.id6AiPattern||'').trim(),aiValid=validPattern(aiPattern),aiConfidence=Math.max(0,Math.min(100,Number(raw.id6Confidence??q.aiV32?.id6AiConfidence)||0)),aiReason=String(raw.id6Reason||q.aiV32?.id6AiReason||'').slice(0,260),local=localCandidate(q);
  let pattern='',confidence=0,reason='',source='local';
  if(aiValid&&local.pattern===aiPattern){pattern=aiPattern;confidence=Math.min(99,Math.max(aiConfidence,local.confidence)+4);reason=`Gemini và bộ phân loại cục bộ đồng thuận. ${aiReason||local.reason}`;source='consensus'}
  else if(aiValid){
    if(local.pattern&&local.pattern!==aiPattern&&local.confidence>=88&&aiConfidence>=80){if(local.confidence>=96&&aiConfidence<92){pattern=local.pattern;confidence=Math.min(89,local.confidence);reason=`Gemini đề xuất ${aiPattern} nhưng dạng/metadata cục bộ khớp mạnh với ${local.pattern}; cần rà soát.`;source='conflict-local'}else{pattern=aiConfidence>=local.confidence?aiPattern:local.pattern;confidence=Math.min(89,Math.max(aiConfidence,local.confidence));reason=`Gemini và bộ phân loại cục bộ chưa đồng thuận (${aiPattern} ↔ ${local.pattern}); bắt buộc kiểm tra.`;source='conflict'}}
    else{pattern=aiPattern;confidence=aiConfidence||82;reason=aiReason||'Gemini chọn mẫu ID6 có trong taxonomy chính thức.';source='gemini'}
  }else if(local.pattern){pattern=local.pattern;confidence=local.confidence;reason=local.reason;source='local'}
  return {pattern,confidence,reason,source,aiPattern,aiValid,aiConfidence,aiReason,localPattern:local.pattern,localConfidence:local.confidence,invalidAiPattern:!!aiPattern&&!aiValid}
}
function canonicalMeta(q={},pattern=''){
  const m=patternMeta(pattern,q.level||'TH');if(!m)return {...q};let out={...q,formId:pattern,id6Pattern:pattern,id6:m.id6,id6Title:m.title,formTitle:m.title,form:m.title,id6Status:'complete',id6Schema:1,id6Build:api()?.BUILD||'',id6ClassifierBuild:V40137_BUILD};
  if(m.lessonId){const codes=typeof allKnowledgeCodes==='function'?allKnowledgeCodes().filter(k=>k.lessonId===m.lessonId):[],km=codes.find(k=>k.level===q.level)||codes[0];out.lessonId=m.lessonId;if(km){out.knowledgeCode=km.code;out.chapterId=Number(km.chapterId)||out.chapterId}}
  if(window.v3821Taxonomy?.canonicalizeQuestion)out=window.v3821Taxonomy.canonicalizeQuestion(out);
  if(m.decode){out.id6Domain=m.decode.domain||out.id6Domain;out.id6Chapter=m.decode.chapter||out.id6Chapter;out.id6Lesson=m.decode.lesson||out.id6Lesson;out.id6Form=m.decode.form||out.id6Form;out.id6ChapterTitle=m.decode.chapterTitle||out.id6ChapterTitle;out.id6LessonTitle=m.decode.lessonTitle||out.id6LessonTitle;out.id6FormTitle=m.decode.formTitle||out.id6FormTitle}
  return out
}
function mismatchList(q={},pattern=''){
  const m=patternMeta(pattern,q.level||'TH');if(!m)return [];const out=canonicalMeta(q,pattern),mis=[];if(m.lessonId&&q.lessonId&&q.lessonId!==out.lessonId)mis.push(`Bài ${q.lessonId} → ${out.lessonId}`);if(q.knowledgeCode&&out.knowledgeCode&&q.knowledgeCode!==out.knowledgeCode)mis.push(`Mã kiến thức ${q.knowledgeCode} → ${out.knowledgeCode}`);if(q.form&&m.title&&norm(q.form)!==norm(m.title))mis.push('Tên dạng được đồng bộ theo ID6');return mis
}
function applyClassification(q={},raw={},force=false){
  if(!q||typeof q!=='object')return q;const old=q.id6Auto||{};if(old.teacherConfirmed&&!force&&validPattern(old.pattern||q.id6Pattern)){const n=canonicalMeta(q,old.pattern||q.id6Pattern);n.id6Auto={...old,status:'confirmed',teacherConfirmed:true,valid:true};return n}
  const c=chooseCandidate(q,raw),thr=autoThreshold(),status=!c.pattern||c.confidence<V40137_REVIEW_THRESHOLD?'missing':c.confidence>=thr?'auto':'review',mis=c.pattern?mismatchList(q,c.pattern):[];
  let out={...q,aiV32:{...(q.aiV32||{}),id6AiPattern:c.aiPattern,id6AiConfidence:c.aiConfidence,id6AiReason:c.aiReason,pipelineSchema:40137},id6Auto:{pattern:c.pattern,id6:c.pattern?api()?.buildId6?.(c.pattern,q.level)||'':'',confidence:c.confidence,status,reason:c.reason,source:c.source,valid:!!c.pattern,teacherConfirmed:false,invalidAiPattern:c.invalidAiPattern,localPattern:c.localPattern,localConfidence:c.localConfidence,mismatches:mis,classifiedAt:new Date().toISOString(),build:V40137_BUILD}};
  if(c.pattern){const m=patternMeta(c.pattern,q.level||'TH');out.id6Pattern=c.pattern;out.formId=c.pattern;out.id6=m?.id6||'';out.id6Title=m?.title||out.form;out.id6Status=status==='auto'?'complete':'review';if(status==='auto')out=canonicalMeta(out,c.pattern)}else{out.id6Status='review'}return out
}
function confirmPattern(q={},pattern='',method='teacher'){if(!validPattern(pattern))return q;let out=canonicalMeta(q,pattern);const m=patternMeta(pattern,q.level||'TH'),prev=q.id6Auto||{};out.id6Auto={...prev,pattern,id6:m?.id6||'',confidence:100,status:'confirmed',reason:method==='teacher'?'Giáo viên xác nhận ID6.':'Xác nhận hàng loạt từ nhóm ID6 tự động.',source:method,valid:true,teacherConfirmed:true,mismatches:mismatchList(q,pattern),confirmedAt:new Date().toISOString(),build:V40137_BUILD};out.aiV32={...(out.aiV32||{}),id6VerifiedByTeacher:true,pipelineSchema:40137};out.id6Status='complete';return out}
function id6Status(q={}){const a=q.id6Auto||{};if(a.teacherConfirmed||a.status==='confirmed')return 'confirmed';if(a.status==='auto'&&validPattern(a.pattern))return 'auto';if(a.status==='review'&&validPattern(a.pattern))return 'review';if(validPattern(q.id6Pattern)&&api()?.isId6?.(q.id6))return 'auto';return 'missing'}
function counts(){const c={total:0,auto:0,review:0,missing:0,confirmed:0};for(const d of v32AiDrafts||[]){c.total++;const s=id6Status(d.question||{});c[s]=(c[s]||0)+1}return c}

// Extend AI schema: Gemini must select an official pattern, never invent a final ID6.
const baseSchema=window.v32QuestionResponseSchema;
window.v32QuestionResponseSchema=function(){const s=baseSchema?baseSchema():{type:'object',properties:{questions:{type:'array',items:{type:'object',properties:{},required:[]}}},required:['questions']},item=s?.properties?.questions?.items;if(item){const pats=forms().map(f=>f.id6Pattern);item.properties=item.properties||{};item.properties.id6Pattern=pats.length?{type:'string',enum:pats}:{type:'string'};item.properties.id6Confidence={type:'integer',minimum:0,maximum:100};item.properties.id6Reason={type:'string'};item.required=[...new Set([...(item.required||[]),'id6Pattern','id6Confidence','id6Reason'])]}return s};
const baseSystem=window.v32AiSystemInstruction;window.v32AiSystemInstruction=function(){return `${baseSystem?baseSystem():''}\n- Với mỗi câu, chọn id6Pattern CHÍNH XÁC từ danh mục ID6 chính thức được cung cấp; tuyệt đối không tự tạo mã mới.\n- id6Pattern chỉ là mẫu dạng 2D1?1-1; Math12 Hub tự thay ? bằng N/H/V/C theo level để tạo ID6 cuối.\n- id6Confidence 0-100 phản ánh độ chắc chắn phân loại; nếu không chắc vẫn chọn mẫu gần nhất nhưng phải hạ confidence và giải thích ngắn ở id6Reason.`};
const baseDigest=window.v32CurriculumDigest;window.v32CurriculumDigest=function(){const base=baseDigest?baseDigest():'';const id6=forms().map(f=>`${f.id6Pattern}|${f.officialLessonTitle||''}|${f.title||''}`).join('\n');return `${base}\n\nDANH MỤC ID6 CHÍNH THỨC (chỉ được chọn một mẫu trong danh sách này):\n${id6}`};

const baseNormalize=window.v32NormalizeAiQuestion;window.v32NormalizeAiQuestion=function(raw={},origin={}){const q=baseNormalize?baseNormalize(raw,origin):raw;return applyClassification(q,raw)};
const baseChecks=window.v32LocalDraftChecks;window.v32LocalDraftChecks=function(q={}){let a=q.id6Auto;if(!a){const n=applyClassification(q,{},false);Object.assign(q,n);a=q.id6Auto}const r=baseChecks?baseChecks(q):{issues:[],critical:[],warnings:[],safe:false},s=id6Status(q),critical=[...(r.critical||[])],warnings=[...(r.warnings||[])],issues=[...(r.issues||[])];if(s==='missing'){const msg='Chưa xác định ID6 chính thức với độ tin cậy tối thiểu.';critical.push(msg);issues.push(msg)}else if(s==='review'){const msg=`ID6 đề xuất ${q.id6Auto?.id6||q.id6||''} (${Number(q.id6Auto?.confidence)||0}%) cần giáo viên kiểm tra.`;warnings.push(msg);issues.push(msg)}return {...r,critical:[...new Set(critical)],warnings:[...new Set(warnings)],issues:[...new Set(issues)],id6Status:s,id6Auto:q.id6Auto,safe:!!r.safe&&(s==='auto'||s==='confirmed')}};

function draft(id){return (v32AiDrafts||[]).find(x=>x.draftId===id)||null}
function saveDrafts(){v32AiPersistDrafts?.();v32RenderAiDraftQueue?.();v32RenderAiMetrics?.()}
function confirmDraft(id){const d=draft(id);if(!d)return;const p=d.question?.id6Auto?.pattern||d.question?.id6Pattern;if(!validPattern(p))return v40137OpenId6Picker(id);d.question=confirmPattern(d.question,p,'teacher');saveDrafts();examToast?.(`Đã xác nhận ${d.question.id6}.`)}
function confirmAllAuto(){if(!requireTeacher?.('Xác nhận ID6 hàng loạt'))return;const rows=(v32AiDrafts||[]).filter(d=>id6Status(d.question)==='auto');if(!rows.length)return alert('Không có câu ID6 tự động để xác nhận.');if(!confirm(`Xác nhận ID6 cho ${rows.length} câu đang ở trạng thái “ID6 tự động”?\n\nViệc này chỉ xác nhận phân loại ID6/metadata; không publish câu.`))return;rows.forEach(d=>{d.question=confirmPattern(d.question,d.question.id6Auto?.pattern||d.question.id6Pattern,'bulk-auto')});saveDrafts();examToast?.(`Đã xác nhận ID6 cho ${rows.length} câu.`)}
function setDraftPattern(id,pattern){const d=draft(id);if(!d||!validPattern(pattern))return;d.question=confirmPattern(d.question,pattern,'teacher');saveDrafts();closeModal?.();examToast?.(`Đã gắn ${d.question.id6} và đồng bộ metadata.`)}
function reclassifyAll(){let n=0;for(const d of v32AiDrafts||[]){if(id6Status(d.question)==='confirmed')continue;d.question=applyClassification(d.question,{id6Pattern:d.question?.aiV32?.id6AiPattern||'',id6Confidence:d.question?.aiV32?.id6AiConfidence||0,id6Reason:d.question?.aiV32?.id6AiReason||''},true);n++}saveDrafts();examToast?.(`Đã phân loại lại ID6 cho ${n} bản nháp theo ngưỡng ${autoThreshold()}%.`)}
function groupedOptions(selected=''){const map=api()?.BY_APP_LESSON||{};return Object.entries(map).map(([lid,arr])=>`<optgroup label="${attr37(lid)} • ${attr37(arr?.[0]?.officialLessonTitle||'')}">${(arr||[]).map(f=>`<option value="${attr37(f.id6Pattern)}" ${f.id6Pattern===selected?'selected':''}>${esc37(f.id6Pattern)} • ${esc37(f.title)}</option>`).join('')}</optgroup>`).join('')}
function openPicker(id){const d=draft(id);if(!d)return;const q=d.question||{},current=q.id6Auto?.pattern||q.id6Pattern||'',body=`<div class="v40137-picker"><div class="firebase-banner"><b>${esc37(q.id||'')}</b> • ${esc37(String(q.question||'').slice(0,220))}</div><div class="field"><label>Dạng ID6 chính thức</label><select id="v40137PickerPattern">${groupedOptions(current)}</select></div><div class="math-help">Mức độ hiện tại: <b>${esc37(q.level||'')}</b>. Math12 Hub sẽ tự tạo ID6 hoàn chỉnh và đồng bộ Bài • Mã kiến thức • Dạng toán.</div></div>`;openModal('Chọn ID6 cho câu','Chỉ dùng 91 dạng trong taxonomy chính thức',body,`<button class="btn btn-soft" onclick="closeModal()">Hủy</button><button class="btn btn-blue" onclick="v40137SetDraftPattern('${attr37(id)}',document.getElementById('v40137PickerPattern').value)">Xác nhận ID6</button>`)}
function rowHtml(d,filter='all'){const q=d.question||{},s=id6Status(q),a=q.id6Auto||{},p=a.pattern||q.id6Pattern||'',m=patternMeta(p,q.level||'TH'),mis=(a.mismatches||[]);return `<div class="v40137-row ${s}"><div><div class="v40137-stem"><b>${esc37(q.id||'')}</b> • ${esc37(String(q.question||'').slice(0,250))}</div><div class="v40137-chips"><span class="v40137-chip status-${s}">${s==='confirmed'?'✓ Đã xác nhận':s==='auto'?'✓ ID6 tự động':s==='review'?'⚠ Cần kiểm tra':'⛔ Chưa có ID6'}</span>${m?.id6?`<span class="v40137-chip code">${esc37(m.id6)}</span>`:''}${a.confidence?`<span class="v40137-chip">${Number(a.confidence)}%</span>`:''}${m?.title?`<span class="v40137-chip" title="${attr37(m.title)}">${esc37(String(m.title).slice(0,72))}</span>`:''}</div>${a.reason?`<div class="v40137-reason">${esc37(a.reason)}</div>`:''}${mis.length?`<div class="v40137-mismatch">Đồng bộ metadata: ${esc37(mis.join(' • '))}</div>`:''}<div class="v40137-actions"><button class="btn btn-soft" onclick="closeModal();v32PreviewDraft('${attr37(d.draftId)}')">Xem câu</button><button class="btn btn-soft" onclick="v40137OpenId6Picker('${attr37(d.draftId)}')">${p?'Đổi ID6':'Gán ID6'}</button>${p&&s!=='confirmed'?`<button class="btn btn-blue" onclick="v40137ConfirmDraftId6('${attr37(d.draftId)}');v40137OpenId6ReviewCenter('${attr37(filter)}')">✓ Xác nhận</button>`:''}</div></div></div>`}
function reviewCenter(filter='all'){injectStyles();const c=counts(),rows=(v32AiDrafts||[]).filter(d=>filter==='all'||id6Status(d.question)===filter).slice(0,180),body=`<div class="v40137-review"><div class="v40137-summary"><span>Tổng ${c.total}</span><span>✓ ${c.auto} tự động</span><span>⚠ ${c.review} cần xem</span><span>⛔ ${c.missing} chưa có</span><span>👤 ${c.confirmed} đã xác nhận</span></div><div class="v40137-tools"><button class="btn btn-soft ${filter==='all'?'active':''}" onclick="v40137OpenId6ReviewCenter('all')">Tất cả</button><button class="btn btn-soft ${filter==='auto'?'active':''}" onclick="v40137OpenId6ReviewCenter('auto')">ID6 tự động</button><button class="btn btn-soft ${filter==='review'?'active':''}" onclick="v40137OpenId6ReviewCenter('review')">Cần kiểm tra</button><button class="btn btn-soft ${filter==='missing'?'active':''}" onclick="v40137OpenId6ReviewCenter('missing')">Chưa có ID6</button><button class="btn btn-soft ${filter==='confirmed'?'active':''}" onclick="v40137OpenId6ReviewCenter('confirmed')">Đã xác nhận</button><button class="btn btn-blue" onclick="v40137ConfirmAllAuto();v40137OpenId6ReviewCenter('confirmed')">✓ Xác nhận ID6 tự động</button></div><div class="v40137-list">${rows.length?rows.map(d=>rowHtml(d,filter)).join(''):'<div class="online-empty">Không có câu trong nhóm này.</div>'}</div></div>`;openModal('Kiểm duyệt ID6 AI',`Ngưỡng tự động ${autoThreshold()}% • chỉ dùng taxonomy ID6 chính thức`,body,'<button class="btn btn-soft" onclick="closeModal()">Đóng</button><button class="btn btn-blue" onclick="closeModal();v4013SelectSafeDrafts()">✓ Chọn câu đạt QC</button>')}
function summary(){const host=document.getElementById('v4013QueueSummary');if(!host)return;host.querySelector('.v40137-summary-extra')?.remove();const c=counts(),x=document.createElement('span');x.className='v40137-summary-extra';x.textContent=`🏷 ID6: ${c.auto} tự động • ${c.review} cần xem • ${c.missing} chưa có • ${c.confirmed} xác nhận`;host.appendChild(x)}
function enhanceCards(){injectStyles();const box=document.getElementById('v32AiDraftQueue');if(!box)return;box.querySelectorAll('.v32-draft-card').forEach(card=>{const m=(card.innerHTML||'').match(/v32PreviewDraft\('([^']+)'\)/);if(!m)return;const id=m[1],d=draft(id),q=d?.question||{},s=id6Status(q),a=q.id6Auto||{},code=a.id6||q.id6||'';const meta=card.querySelector('.v32-draft-meta');if(meta&&!meta.querySelector('.v40137-card-chip')){const chip=document.createElement('span');chip.className=`v40137-card-chip ${s}`;chip.textContent=s==='missing'?'ID6: chưa có':`${code||a.pattern||'ID6'} • ${Number(a.confidence)||0}%${s==='confirmed'?' ✓':''}`;meta.appendChild(chip)}const act=card.querySelector('.v32-draft-actions');if(act&&!act.querySelector('.v40137-id6-btn')){const b=document.createElement('button');b.className='btn btn-soft v40137-id6-btn';b.textContent=s==='missing'?'Gán ID6':'ID6';b.onclick=()=>openPicker(id);act.insertBefore(b,act.firstChild)}});summary()}
function injectStyles(){if(document.getElementById('v40137Styles'))return;const st=document.createElement('style');st.id='v40137Styles';st.textContent=`
.v40137-card-chip{display:inline-flex;align-items:center;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;background:#eef2ff;color:#334155}.v40137-card-chip.auto{background:#eafaf0;color:#166534}.v40137-card-chip.review{background:#fff7df;color:#92400e}.v40137-card-chip.missing{background:#fff0f0;color:#b91c1c}.v40137-card-chip.confirmed{background:#e8f7ff;color:#075985}
.v40137-review{display:grid;gap:12px}.v40137-summary,.v40137-tools,.v40137-chips,.v40137-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.v40137-summary span{background:#f6f8fc;border:1px solid rgba(15,23,42,.07);border-radius:10px;padding:7px 10px;font-size:12px;font-weight:800}.v40137-tools button.active{box-shadow:0 0 0 2px rgba(59,130,246,.25)}.v40137-list{display:grid;gap:10px;max-height:60vh;overflow:auto;padding-right:3px}.v40137-row{border:1px solid rgba(15,23,42,.09);border-radius:14px;padding:12px;background:#fff}.v40137-row.auto{border-color:#86efac;background:#fbfffc}.v40137-row.review{border-color:#facc15;background:#fffdf6}.v40137-row.missing{border-color:#fca5a5;background:#fffafa}.v40137-row.confirmed{border-color:#7dd3fc;background:#fbfeff}.v40137-stem{line-height:1.55}.v40137-chips{margin-top:8px}.v40137-chip{font-size:12px;font-weight:800;border-radius:999px;padding:4px 9px;background:#eef2ff;color:#334155}.v40137-chip.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#e8edff;color:#233876}.v40137-chip.status-auto{background:#dcfce7;color:#166534}.v40137-chip.status-review{background:#fef3c7;color:#92400e}.v40137-chip.status-missing{background:#fee2e2;color:#b91c1c}.v40137-chip.status-confirmed{background:#e0f2fe;color:#075985}.v40137-reason{margin-top:8px;color:#5f6c82;font-size:12px;line-height:1.55}.v40137-mismatch{margin-top:6px;color:#9a3412;font-size:12px}.v40137-actions{margin-top:10px}.v40137-picker select{width:100%;min-height:44px}
`;document.head.appendChild(st)}
const baseRenderQueue=window.v32RenderAiDraftQueue;window.v32RenderAiDraftQueue=function(){const r=baseRenderQueue?baseRenderQueue.apply(this,arguments):undefined;setTimeout(enhanceCards,0);return r};
const baseRenderAssistant=window.v32RenderAIAssistant;window.v32RenderAIAssistant=function(){const r=baseRenderAssistant?baseRenderAssistant.apply(this,arguments):undefined;setTimeout(()=>{for(const d of v32AiDrafts||[]){if(!d.question?.id6Auto)d.question=applyClassification(d.question,{},false)}v32AiPersistDrafts?.();enhanceCards()},80);return r};
window.v40137OpenId6ReviewCenter=reviewCenter;window.v40137OpenId6Picker=openPicker;window.v40137SetDraftPattern=setDraftPattern;window.v40137ConfirmDraftId6=confirmDraft;window.v40137ConfirmAllAuto=confirmAllAuto;window.v40137ReclassifyAll=reclassifyAll;window.V40137AutoId6={build:V40137_BUILD,counts,applyClassification,confirmPattern,id6Status,patternMeta};injectStyles();setTimeout(()=>{for(const d of v32AiDrafts||[]){if(!d.question?.id6Auto)d.question=applyClassification(d.question,{},false)}v32AiPersistDrafts?.();enhanceCards()},180);console.info('Math12 Hub V40.13.7 Auto ID6 Classifier loaded');
})();
