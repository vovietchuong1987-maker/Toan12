/* =========================================================
   Math12 Hub V36.1 — Question Quality Engine
   Structural + LaTeX + metadata + duplicate-option + TF4 coherence checks.
   Runs locally against the question bank already loaded in the session.
   No Firestore reads are started by this module.
   ========================================================= */
(function(){
  'use strict';
  const BUILD='36.1-quality-engine';
  const SCHEMA=361;
  const MAX_CENTER_ROWS=60;
  let auditCache={signature:'',full:false,report:null};
  let liveTimer=null;

  const sevRank={critical:3,warning:2,info:1,pass:0};
  const labels={critical:'Lỗi',warning:'Cảnh báo',info:'Gợi ý',pass:'Đạt'};
  const stopWords=new Set('cho cua là la và va với voi khi thì thi trong trên tren dưới duoi từ tu một mot các cac có co được duoc hãy hay biết biet rằng rang theo sau đây day giá gia trị tri hàm ham số so câu cau mệnh menh đề de ý y'.split(/\s+/));
  const escHtml=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const attr=s=>typeof attrEsc==='function'?attrEsc(String(s??'')):escHtml(s);
  const nowIso=()=>new Date().toISOString();
  const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\\(?:left|right|mathrm|text|operatorname|displaystyle|dfrac|tfrac)/g,' ').replace(/[^a-z0-9\\+\-*/^=<>.]+/g,' ').replace(/\s+/g,' ').trim();
  const compact=s=>normalize(s).replace(/\s+/g,' ');
  function tokens(s=''){
    return [...new Set(normalize(s).split(/\s+/).filter(x=>x.length>1&&!stopWords.has(x)&&!/^[0-9.]+$/.test(x)))];
  }
  function jaccard(a=[],b=[]){const A=new Set(a),B=new Set(b);if(!A.size&&!B.size)return 1;let n=0;A.forEach(x=>B.has(x)&&n++);return n/(A.size+B.size-n||1)}
  function issue(code,severity,title,detail='',category='Cấu trúc',fixable=false){return {code,severity,title,detail,category,fixable}}
  function push(arr,x){if(x)arr.push(x)}

  function latexAudit(text='',scope='Nội dung'){
    const s=String(text||'');if(!s)return [];
    const out=[];
    const plainDollar=s.replace(/\\\$/g,'').match(/\$/g)?.length||0;
    if(plainDollar%2)push(out,issue('LATEX_DOLLAR','critical',`${scope}: thiếu cặp dấu $`,'Số dấu $ không chẵn.','LaTeX'));
    const pairs=[['\\(','\\)','LATEX_PAREN'],['\\[','\\]','LATEX_BRACKET']];
    pairs.forEach(([a,b,code])=>{const na=(s.match(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,nb=(s.match(new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;if(na!==nb)push(out,issue(code,'critical',`${scope}: cặp ${a}…${b} không cân bằng`,`${na} mở / ${nb} đóng.`,'LaTeX'))});
    let braces=0,badBrace=false;
    for(let i=0;i<s.length;i++){
      if(s[i]==='\\'){i++;continue}
      if(s[i]==='{')braces++;
      if(s[i]==='}'){braces--;if(braces<0){badBrace=true;break}}
    }
    if(badBrace||braces!==0)push(out,issue('LATEX_BRACES','critical',`${scope}: ngoặc nhọn LaTeX không cân bằng`,badBrace?'Có dấu } đóng trước khi mở.':`Còn lệch ${braces} ngoặc.`,'LaTeX'));
    const env=[];let m;const re=/\\(begin|end)\{([^}]+)\}/g;
    while((m=re.exec(s))){if(m[1]==='begin')env.push(m[2]);else{const top=env.pop();if(top!==m[2]){push(out,issue('LATEX_ENV','critical',`${scope}: môi trường LaTeX không khớp`,top?`Đang mở ${top} nhưng đóng ${m[2]}.`:`Có \\end{${m[2]}} nhưng chưa mở.`,'LaTeX'));break}}}
    if(env.length)push(out,issue('LATEX_ENV_OPEN','critical',`${scope}: chưa đóng môi trường ${env[env.length-1]}`,`Thiếu \\end{${env[env.length-1]}}.`,'LaTeX'));
    const left=(s.match(/\\left\b/g)||[]).length,right=(s.match(/\\right\b/g)||[]).length;
    if(left!==right)push(out,issue('LATEX_LEFT_RIGHT','warning',`${scope}: \\left và \\right chưa cân bằng`,`${left} \\left / ${right} \\right.`,'LaTeX'));
    if(/\\True\b/.test(s)&&scope==='Nội dung')push(out,issue('TRUE_IN_STEM','warning','Nội dung câu có lệnh \\True','\\True thường chỉ nên nằm ở phương án/ý đúng khi nhập LaTeX.','LaTeX'));
    return out;
  }

  function referencedVisualButMissing(q={}){
    const stem=normalize(q.question||'');
    const ref=/(hinh ve|hinh ben|do thi|bang bien thien|bang sau|bang duoi|so do|bieu do)/.test(stem);
    return ref&&!String(q.figureLatex||'').trim();
  }
  function placeholderText(s=''){return /(?:\.{3,}|_{3,}|\[\s*\?\s*\]|<\s*todo\s*>|TODO)/i.test(String(s||''))}

  function auditMcq(q,issues){
    const opts=Array.isArray(q.options)?q.options.map(x=>String(x||'').trim()):[];
    if(opts.length!==4)push(issues,issue('MCQ_COUNT',opts.length<2?'critical':'warning','Câu nhiều lựa chọn chưa có đúng 4 phương án',`Hiện có ${opts.length} phương án; cấu trúc đề THPT dùng A, B, C, D.`,'Đáp án'));
    if(opts.some(x=>!x))push(issues,issue('MCQ_EMPTY','critical','Có phương án trống','','Đáp án'));
    const groups=new Map();opts.forEach((o,i)=>{const k=compact(o);if(k)(groups.get(k)||groups.set(k,[]).get(k)).push(i)});
    groups.forEach(ids=>{if(ids.length>1)push(issues,issue('MCQ_DUP_OPTION','critical','Có phương án trùng nhau',`Các phương án ${ids.map(i=>String.fromCharCode(65+i)).join(', ')} giống nhau sau chuẩn hóa.`,'Đáp án'))});
    const ans=Number(q.answer);
    if(!Number.isInteger(ans)||ans<0||ans>=opts.length)push(issues,issue('MCQ_ANSWER','critical','Đáp án MCQ không hợp lệ','Chỉ số đáp án không trỏ tới một phương án đang có.','Đáp án'));
    const markers=opts.map((o,i)=>/\\True\b/.test(o)?i:-1).filter(i=>i>=0);
    if(markers.length>1)push(issues,issue('MCQ_MULTI_TRUE','critical','Nhiều phương án chứa \\True',`Phát hiện ở ${markers.map(i=>String.fromCharCode(65+i)).join(', ')}.`,'Đáp án'));
    if(markers.length===1&&Number.isInteger(ans)&&markers[0]!==ans)push(issues,issue('MCQ_TRUE_MISMATCH','critical','\\True không khớp đáp án đã lưu',`\\True ở ${String.fromCharCode(65+markers[0])}, đáp án đang là ${String.fromCharCode(65+ans)}.`,'Đáp án'));
    opts.forEach((o,i)=>latexAudit(o,`Phương án ${String.fromCharCode(65+i)}`).forEach(x=>issues.push(x)));
  }
  function tf4Coherence(q={}){
    const ss=Array.isArray(q.statements)?q.statements:[];if(ss.length!==4)return null;
    const base=tokens(q.question||'');let disconnected=0;
    ss.forEach((s,i)=>{const t=tokens(s?.text||'');const related=base.length&&t.length?jaccard(base,t):0;const prev=i?tokens(ss[i-1]?.text||''):[];const chain=prev.length&&t.length?jaccard(prev,t):0;if(related<.015&&chain<.015&&t.length>=3)disconnected++});
    return disconnected>=3?disconnected:null;
  }
  function auditTf4(q,issues){
    const ss=Array.isArray(q.statements)?q.statements:[];
    if(ss.length!==4)push(issues,issue('TF4_COUNT','critical','Câu Đúng/Sai phải có đúng 4 ý',`Hiện có ${ss.length} ý.`,'Đúng/Sai'));
    const texts=ss.map(s=>String(s?.text||'').trim());
    if(texts.some(x=>!x))push(issues,issue('TF4_EMPTY','critical','Có ý Đúng/Sai bị trống','','Đúng/Sai'));
    const uniq=new Set(texts.map(compact).filter(Boolean));if(uniq.size<texts.filter(Boolean).length)push(issues,issue('TF4_DUP','critical','Có các ý Đúng/Sai trùng nhau','','Đúng/Sai'));
    if(ss.some(s=>typeof s?.answer!=='boolean'))push(issues,issue('TF4_ANSWER','critical','Có ý Đúng/Sai chưa có đáp án boolean','','Đúng/Sai'));
    const missingExp=ss.filter(s=>String(s?.text||'').trim()&&!String(s?.explanation||'').trim()).length;
    if(missingExp)push(issues,issue('TF4_EXPLAIN','warning',`${missingExp}/4 ý chưa có lời giải riêng`,'Nên có lời giải theo từng ý để học sinh biết vì sao đúng/sai.','Lời giải'));
    const d=tf4Coherence(q);if(d)push(issues,issue('TF4_COHERENCE','info','Các ý Đúng/Sai có dấu hiệu ít liên kết với dữ kiện chung',`${d}/4 ý có rất ít từ khóa chung với đề hoặc ý trước. Đây chỉ là kiểm tra heuristic, giáo viên quyết định cuối.`,'Đúng/Sai'));
    ss.forEach((s,i)=>{latexAudit(s?.text||'',`Ý ${String.fromCharCode(97+i)}`).forEach(x=>issues.push(x));latexAudit(s?.explanation||'',`Lời giải ý ${String.fromCharCode(97+i)}`).forEach(x=>issues.push(x))});
  }

  function auditQuestion(q={},opts={}){
    const issues=[];
    const stem=String(q.question||'').trim();
    const metadata=window.v360KnowledgeMap?.normalizedQuestion?window.v360KnowledgeMap.normalizedQuestion(q,q.formId||''):q;
    if(!stem)push(issues,issue('STEM_EMPTY','critical','Thiếu nội dung câu hỏi','','Cấu trúc'));
    else if(stem.length<18)push(issues,issue('STEM_SHORT','warning','Nội dung câu hỏi khá ngắn',`${stem.length} ký tự; nên rà lại dữ kiện.`,'Cấu trúc'));
    if(placeholderText(stem))push(issues,issue('STEM_PLACEHOLDER','warning','Nội dung còn dấu hiệu placeholder','Phát hiện “…”, “___”, “[?]” hoặc TODO.','Cấu trúc'));
    if(referencedVisualButMissing(q))push(issues,issue('VISUAL_MISSING','warning','Đề có nhắc hình/bảng/đồ thị nhưng chưa có hình kèm theo','','Dữ kiện'));
    const persistedMeta=Number(q.questionBankSchema)===36&&Number(q.knowledgeMapVersion)===36&&q.metadataStatusV36==='complete'&&String(q.formId||'').trim()&&String(q.blueprintKey||'').trim();
    if(!persistedMeta&&q.id!=='CÂU MỚI')push(issues,issue('META_V36','warning','Metadata Knowledge Map V36 chưa hoàn chỉnh','Cần chuẩn hóa metadata đã lưu: bài, mã kiến thức, dạng toán và blueprintKey.','Metadata',true));
    if(!['NB','TH','VD','VDC'].includes(q.level))push(issues,issue('LEVEL','warning','Mức độ NB/TH/VD/VDC chưa chuẩn','','Metadata',true));
    if(!['mcq','tf','tf4','short'].includes(q.type))push(issues,issue('TYPE','critical','Loại câu hỏi không hợp lệ','','Cấu trúc'));
    if(!String(q.formId||metadata.formId||'').trim())push(issues,issue('FORM','info','Chưa gắn dạng toán chuẩn V36','','Metadata',true));
    latexAudit(stem,'Nội dung').forEach(x=>issues.push(x));latexAudit(q.explanation||'','Lời giải').forEach(x=>issues.push(x));latexAudit(q.figureLatex||'','Hình vẽ').forEach(x=>issues.push(x));
    if(q.type==='mcq')auditMcq(q,issues);
    else if(q.type==='tf4')auditTf4(q,issues);
    else if(q.type==='tf'&&typeof q.answer!=='boolean')push(issues,issue('TF_ANSWER','critical','Câu Đúng/Sai chưa có đáp án boolean','','Đáp án'));
    else if(q.type==='short'&&!String(q.answer??'').trim())push(issues,issue('SHORT_ANSWER','critical','Câu trả lời ngắn chưa có đáp án','','Đáp án'));
    if(!String(q.explanation||'').trim()&&q.type!=='tf4')push(issues,issue('EXPLANATION','warning','Chưa có lời giải/giải thích','','Lời giải'));
    if(!String(q.sourceName||'').trim()&&q.source!=='seed')push(issues,issue('SOURCE','info','Chưa ghi nguồn câu hỏi','','Metadata'));
    if(q.reviewStatus!=='reviewed')push(issues,issue('DRAFT','info','Câu đang ở trạng thái Bản nháp','','Quy trình'));
    if(opts.nearDuplicateCount>0)push(issues,issue('NEAR_DUP','warning','Có câu khác gần trùng',`${opts.nearDuplicateCount} câu/cặp gần trùng theo lần quét hiện tại.`,'Trùng lặp'));
    const counts={critical:0,warning:0,info:0};issues.forEach(x=>counts[x.severity]++);
    let score=100-counts.critical*18-counts.warning*7-counts.info*2;score=Math.max(0,Math.min(100,score));
    const status=counts.critical?'bad':counts.warning||score<90?'warn':'good';
    return {id:q.id||'',score,status,issues:issues.map(x=>x.title),details:issues,counts,passed:issues.length===0,build:BUILD};
  }

  function bankSignature(){
    if(typeof v29BankSignature==='function')return v29BankSignature();
    return (state?.questionBank||[]).map(q=>`${q.id}:${q.updatedAt||''}:${q.version||1}`).join('|');
  }
  function scanBank({force=false,full=true}={}){
    const sig=bankSignature();if(!force&&auditCache.signature===sig&&auditCache.full===full&&auditCache.report)return auditCache.report;
    const bank=Array.isArray(state?.questionBank)?state.questionBank:[];
    let byDup=new Map(),pairs=[];
    if(full&&typeof v29ScanDuplicates==='function'){
      try{pairs=v29ScanDuplicates(force);pairs.forEach(p=>{byDup.set(p.a,(byDup.get(p.a)||0)+1);byDup.set(p.b,(byDup.get(p.b)||0)+1)})}catch(_){}
    }
    const rows=bank.map(q=>({q,audit:auditQuestion(q,{nearDuplicateCount:byDup.get(q.id)||0})}));
    const counts={critical:0,warning:0,info:0,pass:0};let sum=0;
    rows.forEach(r=>{sum+=r.audit.score;if(r.audit.counts.critical)counts.critical++;else if(r.audit.counts.warning)counts.warning++;else if(r.audit.counts.info)counts.info++;else counts.pass++});
    const issueCounts={};rows.forEach(r=>r.audit.details.forEach(i=>{const key=i.code;issueCounts[key]=issueCounts[key]||{code:key,title:i.title,severity:i.severity,category:i.category,count:0};issueCounts[key].count++}));
    const report={build:BUILD,at:nowIso(),total:bank.length,average:bank.length?Math.round(sum/bank.length):100,counts,pairs:pairs.length,rows,issues:Object.values(issueCounts).sort((a,b)=>sevRank[b.severity]-sevRank[a.severity]||b.count-a.count||a.title.localeCompare(b.title,'vi'))};
    auditCache={signature:sig,full,report};renderStrip(report);return report;
  }

  function v29CompatibleQuality(q={}){
    const r=auditQuestion(q);return {score:r.score,status:r.status,issues:r.details.map(i=>`${labels[i.severity]}: ${i.title}`),details:r.details,counts:r.counts,build:BUILD};
  }

  function renderStrip(report=null){
    const root=document.getElementById('v361QualityStrip');if(!root)return;const r=report||auditCache.report;
    const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=String(val)};
    if(!r){set('v361MetricScore','—');set('v361MetricCritical','—');set('v361MetricWarning','—');set('v361MetricPass','—');return}
    set('v361MetricScore',`${r.average}%`);set('v361MetricCritical',r.counts.critical);set('v361MetricWarning',r.counts.warning);set('v361MetricPass',r.counts.pass);
    const note=document.getElementById('v361LastScan');if(note)note.textContent=`Lần quét: ${new Date(r.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})} • ${r.total} câu • ${r.pairs} cặp gần trùng`;
  }

  function issueRowsHtml(report){
    if(!report.issues.length)return '<div class="online-empty">Không phát hiện vấn đề theo bộ kiểm tra V36.1.</div>';
    return `<div class="v361-rule-list">${report.issues.slice(0,24).map(x=>`<div class="v361-rule-row ${x.severity}"><span class="v361-sev">${labels[x.severity]}</span><div><b>${escHtml(x.title)}</b><small>${escHtml(x.category)} • ${x.count} câu</small></div></div>`).join('')}</div>`;
  }
  function questionRowsHtml(report){
    const rows=[...report.rows].sort((a,b)=>a.audit.score-b.audit.score||b.audit.counts.critical-a.audit.counts.critical||String(a.q.id).localeCompare(String(b.q.id))).slice(0,MAX_CENTER_ROWS);
    if(!rows.length)return '<div class="online-empty">Ngân hàng chưa có câu hỏi.</div>';
    return `<div class="v361-question-list">${rows.map(({q,audit:a})=>`<button type="button" class="v361-question-row ${a.status}" onclick="v361OpenQuestionAudit('${attr(q.id)}')"><span class="v361-score">${a.score}%</span><span class="v361-question-copy"><b>${escHtml(q.id||'Chưa có mã')} • ${escHtml((q.question||'').replace(/\s+/g,' ').slice(0,96))}</b><small>${a.counts.critical?`${a.counts.critical} lỗi • `:''}${a.counts.warning?`${a.counts.warning} cảnh báo • `:''}${a.details.slice(0,2).map(i=>i.title).join(' • ')||'Đạt kiểm tra'}</small></span><span>›</span></button>`).join('')}</div>`;
  }

  function openQualityCenter(){
    if(typeof requireTeacher==='function'&&!requireTeacher('Question Quality Engine V36.1'))return;
    const r=scanBank({force:true,full:true});
    const body=`<div class="v361-center-hero"><div><span class="v360-kicker">V36.1 • QUESTION QUALITY ENGINE</span><h3>Kiểm tra chất lượng trước khi dùng câu hỏi</h3><p>Quét trên dữ liệu đã tải trong phiên, không tự phát sinh Firestore Reads. Engine kiểm tra cấu trúc, LaTeX, metadata, phương án trùng, Đúng/Sai 4 ý, dữ kiện tham chiếu và câu gần trùng. Không thay thế thẩm định chuyên môn Toán của giáo viên.</p></div><div class="v361-center-score ${r.counts.critical?'bad':r.counts.warning?'warn':'good'}"><b>${r.average}%</b><small>Điểm kỹ thuật TB</small></div></div>
    <div class="v361-center-metrics"><div><b>${r.counts.critical}</b><small>Câu có lỗi</small></div><div><b>${r.counts.warning}</b><small>Câu cần rà soát</small></div><div><b>${r.counts.pass}</b><small>Câu đạt sạch</small></div><div><b>${r.pairs}</b><small>Cặp gần trùng</small></div></div>
    <div class="grid grid-2 mt"><div class="card"><h3 style="margin-top:0">Vấn đề thường gặp</h3>${issueRowsHtml(r)}</div><div class="card"><h3 style="margin-top:0">Câu cần ưu tiên</h3>${questionRowsHtml(r)}</div></div>`;
    openModal('Question Quality Engine • V36.1',`${r.total} câu • quét cục bộ • ${new Date(r.at).toLocaleString('vi-VN')}`,body,`<button class="btn btn-soft" onclick="v361ExportAudit()">⬇ Xuất báo cáo</button><button class="btn btn-soft" onclick="v361SafeFixBank()">🛡 Sửa an toàn</button><button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)
  }

  function openQuestionAudit(id=''){
    const q=(state?.questionBank||[]).find(x=>x.id===id);if(!q)return;
    const full=scanBank({force:false,full:true}),row=full.rows.find(x=>x.q.id===id),a=row?.audit||auditQuestion(q);
    const list=a.details.length?`<div class="v361-audit-list">${a.details.sort((x,y)=>sevRank[y.severity]-sevRank[x.severity]).map(i=>`<div class="v361-audit-item ${i.severity}"><span>${labels[i.severity]}</span><div><b>${escHtml(i.title)}</b>${i.detail?`<small>${escHtml(i.detail)}</small>`:''}<em>${escHtml(i.category)}</em></div></div>`).join('')}</div>`:'<div class="firebase-banner"><b>✓ Không phát hiện lỗi kỹ thuật.</b> Giáo viên vẫn nên kiểm tra chuyên môn, đáp án và mức độ trước khi duyệt.</div>';
    openModal(`QC V36.1 • ${escHtml(id)}`,`${a.score}% • ${a.counts.critical} lỗi • ${a.counts.warning} cảnh báo`,`${list}<div class="math-help mt">V36.1 không dùng CAS để kết luận tính đúng sai toán học của mọi phương án; các cảnh báo “liên kết” và “thiếu dữ kiện” là heuristic hỗ trợ rà soát.</div>`,`<button class="btn btn-soft" onclick="closeModal();previewBankQuestion('${attr(id)}')">Xem câu</button><button class="btn btn-blue" onclick="closeModal();openQuestionEditor('${attr(id)}')">Sửa câu</button>`)
  }

  function exportAudit(){
    const r=scanBank({force:false,full:true});const payload={format:'math12hub-quality-audit',version:'36.1',build:BUILD,createdAt:nowIso(),summary:{total:r.total,average:r.average,counts:r.counts,nearDuplicatePairs:r.pairs},rules:r.issues,questions:r.rows.map(({q,audit:a})=>({id:q.id,lessonId:q.lessonId,knowledgeCode:q.knowledgeCode,formId:q.formId||'',type:q.type,level:q.level,score:a.score,status:a.status,issues:a.details}))};
    if(typeof triggerJsonDownload==='function')return triggerJsonDownload(payload,`math12-quality-v36.1-${new Date().toISOString().slice(0,10)}.json`);
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='math12-quality-v36.1.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
  }

  async function safeFixBank(){
    if(typeof requireTeacher==='function'&&!requireTeacher('Sửa an toàn QC V36.1'))return;
    const r=scanBank({force:true,full:true}),criticalIds=new Set(r.rows.filter(x=>x.audit.counts.critical).map(x=>x.q.id));
    const needMeta=r.rows.filter(x=>x.audit.details.some(i=>i.code==='META_V36')).length,downgrade=(state?.questionBank||[]).filter(q=>criticalIds.has(q.id)&&q.reviewStatus==='reviewed').length;
    if(!needMeta&&!downgrade){window.v353Toast?.('Không có thay đổi an toàn cần áp dụng.');return}
    if(!confirm(`V36.1 sẽ chỉ thực hiện các sửa an toàn:\n• Chuẩn hóa metadata V36 cho ${needMeta} câu nếu có thể.\n• Chuyển ${downgrade} câu có lỗi nghiêm trọng từ “Đã duyệt” về “Bản nháp”.\n\nKhông thay nội dung, đáp án hoặc lời giải. Tiếp tục?`))return;
    if(typeof v21CreateRecoverySnapshot==='function'){try{await v21CreateRecoverySnapshot('v36.1-quality-safe-fix',false)}catch(_){}}
    let changed=0;
    state.questionBank=(state.questionBank||[]).map(q=>{let n=q;if(window.v360KnowledgeMap?.normalizedQuestion)n=window.v360KnowledgeMap.normalizedQuestion(n,n.formId||'');if(criticalIds.has(n.id)&&n.reviewStatus==='reviewed')n={...n,reviewStatus:'draft'};if(JSON.stringify(n)!==JSON.stringify(q))changed++;return n});
    if(changed&&typeof save==='function')save({reason:'v36.1-quality-safe-fix'});auditCache={signature:'',full:false,report:null};renderQuestionBank?.(true);closeModal();window.v353Toast?.(`V36.1 đã áp dụng ${changed} thay đổi an toàn.`)
  }

  function questionFromEditor(){
    const type=document.getElementById('qeType')?.value||'mcq',rawAns=(document.getElementById('qeAnswer')?.value||'').trim(),lessonId=document.getElementById('qeLesson')?.value||'',lesson=typeof getLesson==='function'?getLesson(lessonId):null;
    let q={id:(document.getElementById('qeId')?.value||'').trim()||'CÂU MỚI',chapterId:lesson?.chapter?.id||0,lessonId,knowledgeCode:document.getElementById('qeKnowledge')?.value||'',form:document.getElementById('qeForm')?.value||'',formId:document.getElementById('qeFormV36Editor')?.value||'',level:document.getElementById('qeLevel')?.value||'',type,question:document.getElementById('qeQuestion')?.value||'',explanation:document.getElementById('qeExplanation')?.value||'',figureMode:document.getElementById('qeFigureMode')?.value||'none',figureLatex:document.getElementById('qeFigureLatex')?.value||'',reviewStatus:document.getElementById('qeReviewStatus')?.value||'draft',sourceName:document.getElementById('qeSourceName')?.value||''};
    if(type==='mcq'){q.options=(document.getElementById('qeOptions')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);const ai='ABCD'.indexOf(rawAns.toUpperCase());q.answer=ai}
    else if(type==='tf4'){const lines=(document.getElementById('qeTF4Statements')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean),exps=(document.getElementById('qeTF4Explanations')?.value||'').split('\n');q.statements=lines.map((s,i)=>({text:s.replace(/\\True\b/g,'').trim(),answer:/\\True\b/.test(s),explanation:(exps[i]||'').trim()}))}
    else if(type==='tf'){q.answer=['đúng','dung','true'].includes(rawAns.toLowerCase())?true:['sai','false'].includes(rawAns.toLowerCase())?false:rawAns}
    else q.answer=rawAns;
    if(window.v360KnowledgeMap?.normalizedQuestion)q=window.v360KnowledgeMap.normalizedQuestion(q,q.formId||'');return q;
  }
  function renderLive(){
    const box=document.getElementById('v361LiveQuality');if(!box)return;const a=auditQuestion(questionFromEditor()),top=a.details.sort((x,y)=>sevRank[y.severity]-sevRank[x.severity]).slice(0,5);
    box.className=`v361-live-quality ${a.status}`;box.innerHTML=`<div class="v361-live-head"><div><b>QC V36.1 • ${a.score}%</b><small>${a.counts.critical} lỗi • ${a.counts.warning} cảnh báo • kiểm tra ngay trên máy</small></div><span>${a.status==='good'?'✓ Sẵn sàng rà soát':a.status==='warn'?'Cần rà soát':'Cần sửa trước khi duyệt'}</span></div>${top.length?`<div class="v361-live-issues">${top.map(i=>`<span class="${i.severity}">${labels[i.severity]} • ${escHtml(i.title)}</span>`).join('')}</div>`:'<div class="v361-live-ok">Không phát hiện lỗi kỹ thuật. Vẫn cần giáo viên duyệt chuyên môn.</div>'}`;
  }
  function scheduleLive(){clearTimeout(liveTimer);liveTimer=setTimeout(renderLive,180)}
  function injectLiveEditor(){
    const grid=document.querySelector('#modalBody .field-grid');if(!grid||document.getElementById('v361LiveQuality'))return;
    const preview=document.getElementById('qePreview')?.closest('.field');if(!preview)return;
    const wrap=document.createElement('div');wrap.id='v361LiveQuality';wrap.className='v361-live-quality';preview.insertAdjacentElement('beforebegin',wrap);
    const body=document.getElementById('modalBody');if(body&&!body.dataset.v361Live){body.dataset.v361Live='1';body.addEventListener('input',scheduleLive);body.addEventListener('change',scheduleLive)}
    renderLive();
  }

  function installEditorHooks(){
    if(typeof window.openQuestionEditor==='function'&&!window.openQuestionEditor.__v361){const base=window.openQuestionEditor;const wrapped=function(id=''){const out=base(id);injectLiveEditor();return out};wrapped.__v361=true;window.openQuestionEditor=wrapped}
    if(typeof window.saveQuestionEditor==='function'&&!window.saveQuestionEditor.__v361){const base=window.saveQuestionEditor;const wrapped=function(editId=''){
      const draft=questionFromEditor(),a=auditQuestion(draft),review=document.getElementById('qeReviewStatus');
      if(a.counts.critical&&review?.value==='reviewed'){review.value='draft';window.v353Toast?.(`QC V36.1: có ${a.counts.critical} lỗi kỹ thuật, câu được chuyển về Bản nháp.`,'warning',4200)}
      const out=base(editId);auditCache={signature:'',full:false,report:null};setTimeout(()=>{renderQuestionBank?.(true);renderStrip()},0);return out
    };wrapped.__v361=true;window.saveQuestionEditor=wrapped}
  }

  function installBankHooks(){
    if(typeof window.v29QuestionQuality==='function'&&!window.v29QuestionQuality.__v361){const wrapped=function(q){return v29CompatibleQuality(q)};wrapped.__v361=true;window.v29QuestionQuality=wrapped}
    if(typeof window.v29FilteredQuestions==='function'&&!window.v29FilteredQuestions.__v361){const base=window.v29FilteredQuestions;const wrapped=function(){let rows=base();const f=document.getElementById('bankQualityV361')?.value||'';if(f)rows=rows.filter(q=>{const a=auditQuestion(q);return f==='critical'?a.counts.critical>0:f==='warning'?a.counts.critical===0&&a.counts.warning>0:f==='pass'?a.counts.critical===0&&a.counts.warning===0:true});return rows};wrapped.__v361=true;window.v29FilteredQuestions=wrapped}
    if(typeof window.renderQuestionBank==='function'&&!window.renderQuestionBank.__v361){const base=window.renderQuestionBank;const wrapped=function(force=false){const out=base(force);decorateQualityButtons();renderStrip();return out};wrapped.__v361=true;window.renderQuestionBank=wrapped}
    const f=document.getElementById('bankQualityV361');if(f&&!f.dataset.v361Bound){f.dataset.v361Bound='1';f.addEventListener('change',()=>{try{v29BankPage=1}catch(_){};renderQuestionBank?.(false)})}
  }
  function decorateQualityButtons(){
    const tbody=document.getElementById('questionBankTable');if(!tbody)return;
    tbody.querySelectorAll('tr').forEach(tr=>{const id=tr.querySelector('td:first-child b')?.textContent?.trim(),btn=tr.querySelector('.v29-quality');if(!id||!btn)return;const q=(state?.questionBank||[]).find(x=>x.id===id);if(!q)return;const a=auditQuestion(q);btn.textContent=`${a.score}%`;btn.classList.remove('good','warn','bad');btn.classList.add(a.status);btn.title=a.details.slice(0,5).map(i=>`${labels[i.severity]}: ${i.title}`).join(' • ')||'Đạt kiểm tra kỹ thuật V36.1';btn.setAttribute('onclick',`v361OpenQuestionAudit('${attr(id)}')`)});
  }

  function init(){
    document.documentElement.dataset.qualityEngineBuild=BUILD;installEditorHooks();installBankHooks();renderStrip();setTimeout(()=>{decorateQualityButtons();renderStrip()},500);
    window.addEventListener('math12hub:state-saved',()=>{auditCache={signature:'',full:false,report:null};renderStrip()});
  }

  window.v361QualityEngine={build:BUILD,schema:SCHEMA,auditQuestion,scanBank,exportAudit,safeFixBank,questionFromEditor};
  window.v361ScanBank=()=>{const r=scanBank({force:true,full:true});window.v353Toast?.(`V36.1: ${r.total} câu • ${r.counts.critical} lỗi • ${r.counts.warning} cần rà soát.`);return r};
  window.v361OpenQualityCenter=openQualityCenter;
  window.v361OpenQuestionAudit=openQuestionAudit;
  window.v361ExportAudit=exportAudit;
  window.v361SafeFixBank=safeFixBank;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
