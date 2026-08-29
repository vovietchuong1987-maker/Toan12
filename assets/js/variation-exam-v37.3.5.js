/* Math12 Hub V37.3.5 — Variation Table & Exam Layout Polish
   - Anchor-based tkz-tab variation arrows
   - Compact exam question/figure/options layout
   - Hides authoring/source diagnostics from student exam mode
*/
(function(){
'use strict';
const V='37.3.5';

function v3735RawMath(raw=''){
  try{return typeof tkzMathRaw==='function'?tkzMathRaw(raw):String(raw||'').replace(/^\$|\$$/g,'').trim()}catch(_){return String(raw||'').trim()}
}
function v3735MathCell(raw=''){
  const s=v3735RawMath(raw);return s?(typeof mathHTML==='function'?mathHTML(`$${s}$`):s):'';
}
function v3735Norm(raw=''){return v3735RawMath(raw).replace(/\s+/g,'')}
function v3735PosInf(raw=''){return /^(?:\+?\\infty|\+?∞)$/.test(v3735Norm(raw))}
function v3735NegInf(raw=''){return /^(?:[-−]\\infty|[-−]∞)$/.test(v3735Norm(raw))}
function v3735PointY(raw='',mode=''){
  if(v3735PosInf(raw))return 23;
  if(v3735NegInf(raw))return 77;
  const m=String(mode||'');
  if(m.includes('+'))return 24;
  if(m.includes('-'))return 76;
  return 50;
}
function v3735LabelY(raw='',mode=''){
  if(v3735PosInf(raw))return 11;
  if(v3735NegInf(raw))return 89;
  const m=String(mode||'');
  if(m.includes('+'))return 11;
  if(m.includes('-'))return 89;
  return 50;
}
function v3735Segment(a,b,marker){
  if(!a||!b)return '';
  const dx=b.x-a.x,dy=b.y-a.y;
  // Keep every arrow inside its interval so labels at extrema stay clean.
  // Interpolation rather than arbitrary pixel padding makes the endpoint
  // consistently anchored to the exact x-column on all screen widths.
  const t1=.075,t2=.925;
  const x1=a.x+dx*t1,y1=a.y+dy*t1,x2=a.x+dx*t2,y2=a.y+dy*t2;
  return `<line x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}" class="tkztab-trend v3735-trend" marker-end="url(#${marker})"/>`;
}

function v3735TkzTabNativeHTML(tex=''){
  const d=(typeof parseTkzTabFigure==='function'?parseTkzTabFigure(tex):{ok:false,error:'Thiếu bộ đọc tkz-tab.'});
  if(!d.ok)return `<div class="bulk-errors fatal">${typeof esc==='function'?esc(d.error||'Không đọc được bảng biến thiên.'):d.error}</div>`;
  const n=Math.max(2,d.xsRaw?.length||d.xs?.length||2),safeA=7,safeB=93;
  const nodeX=Array.from({length:n},(_,i)=>safeA+(safeB-safeA)*(i/(n-1)));
  const nodes=[];
  for(let i=0;i<n;i++){
    const v=d.vars?.[i]||{};
    if(v.discontinuity){
      nodes.push({kind:'break',left:{x:nodeX[i]-3.5,y:v3735PointY(v.leftRaw,v.leftMode),labelY:v3735LabelY(v.leftRaw,v.leftMode),raw:v.leftRaw},right:{x:nodeX[i]+3.5,y:v3735PointY(v.rightRaw,v.rightMode),labelY:v3735LabelY(v.rightRaw,v.rightMode),raw:v.rightRaw}});
    }else{
      nodes.push({kind:'normal',pt:{x:nodeX[i],y:v3735PointY(v.rawValue,v.mode),labelY:v3735LabelY(v.rawValue,v.mode),raw:v.rawValue}});
    }
  }
  const startPt=node=>node?.kind==='break'?node.right:node?.pt;
  const endPt=node=>node?.kind==='break'?node.left:node?.pt;
  let hash=5381;for(const c of String(tex||''))hash=((hash<<5)+hash+c.charCodeAt(0))>>>0;const marker=`v3735a${hash}`;
  const arrows=[];for(let i=0;i<n-1;i++)arrows.push(v3735Segment(startPt(nodes[i]),endPt(nodes[i+1]),marker));

  const rowLabel=(raw,fallback)=>`<div class="tkztab-label">${v3735MathCell(raw||fallback)}</div>`;
  const xNodes=nodeX.map((x,i)=>`<span class="tkztab-node" style="left:${x}%">${v3735MathCell(d.xsRaw?.[i]||d.xs?.[i]||'')}</span>`).join('');
  const xExtras=(d.vals||[]).map(v=>{const a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),r=Number.isFinite(v.pos)?Math.max(0,Math.min(1,v.pos)):.5,x=nodeX[a]+(nodeX[b]-nodeX[a])*r;return `<span class="tkztab-extra tkztab-node" style="left:${x}%">${v3735MathCell(v.xRaw)}</span>`}).join('');

  let dMarks='';
  for(let i=0;i<n;i++){
    const b=String(d.boundary?.[i]||'').trim();
    if(b.includes('d'))dMarks+=`<span class="tkztab-break derivative-only" style="left:${nodeX[i]}%"></span>`;
    else if(b==='0'||b.includes('z'))dMarks+=`<span class="tkztab-sign" style="left:${nodeX[i]}%">${v3735MathCell('0')}</span>`;
    else if(b)dMarks+=`<span class="tkztab-sign" style="left:${nodeX[i]}%">${v3735MathCell(b)}</span>`;
    if(i<n-1){const mid=(nodeX[i]+nodeX[i+1])/2,s=String(d.interval?.[i]||'').trim(),sign=s.includes('+')?'+':s.includes('-')?'-':s.includes('0')?'0':s;dMarks+=`<span class="tkztab-sign" style="left:${mid}%">${v3735MathCell(sign)}</span>`}
  }

  let yMarks='';
  nodes.forEach((node,i)=>{
    if(node.kind==='break'){
      yMarks+=`<span class="tkztab-break" style="left:${nodeX[i]}%"></span>`;
      if(node.left.raw)yMarks+=`<span class="tkztab-value v3735-value" style="left:${node.left.x}%;top:${node.left.labelY}%">${v3735MathCell(node.left.raw)}</span>`;
      if(node.right.raw)yMarks+=`<span class="tkztab-value v3735-value" style="left:${node.right.x}%;top:${node.right.labelY}%">${v3735MathCell(node.right.raw)}</span>`;
    }else if(node.pt?.raw){
      yMarks+=`<span class="tkztab-value v3735-value" style="left:${node.pt.x}%;top:${node.pt.labelY}%">${v3735MathCell(node.pt.raw)}</span>`;
    }
  });

  const valExtras=(d.vals||[]).map(v=>{const a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),r=Number.isFinite(v.pos)?Math.max(0,Math.min(1,v.pos)):.5,x=nodeX[a]+(nodeX[b]-nodeX[a])*r,pa=endPt(nodes[a]),pb=startPt(nodes[b]),y=pa&&pb?pa.y+(pb.y-pa.y)*r:50;return `<span class="tkztab-extra tkztab-value v3735-value" style="left:${x}%;top:${y}%">${v3735MathCell(v.yRaw)}</span>`}).join('');
  const imaExtras=(d.imas||[]).map(v=>{const a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),x=(nodeX[a]+nodeX[b])/2;return `<span class="tkztab-extra tkztab-value v3735-value" style="left:${x}%;top:50%">${v3735MathCell(v.valueRaw)}</span>`}).join('');
  const warn=d.unsupported?.length?`<div class="tkztab-validation">Chưa dựng trực tiếp: ${d.unsupported.map(x=>'\\'+x).join(', ')}. Mã gốc vẫn được giữ để chỉnh sửa.</div>`:'';

  return `<div class="tkztab-scroll v3735-tkztab-scroll"><div class="tkztab-native v3735-tkztab math-rich"><div class="tkztab-row tkztab-x">${rowLabel(d.rows?.[0],'$x$')}<div class="tkztab-data">${xNodes}${xExtras}</div></div><div class="tkztab-row tkztab-d">${rowLabel(d.rows?.[1],"$f'(x)$")}<div class="tkztab-data">${dMarks}</div></div><div class="tkztab-row tkztab-y">${rowLabel(d.rows?.[2],'$f(x)$')}<div class="tkztab-data"><svg class="tkztab-arrows v3735-arrows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="${marker}" markerWidth="7" markerHeight="7" refX="5.7" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L6,3.5 L0,7 z" class="v3735-arrow-head"/></marker></defs>${arrows.join('')}</svg>${yMarks}${valExtras}${imaExtras}</div></div></div></div>${warn}`;
}

// Override the mature native renderer while keeping the parser/source data intact.
window.tkzTabNativeHTML=v3735TkzTabNativeHTML;

function v3735OptionTextLength(s=''){
  return String(s||'').replace(/\\(?:d|t)?frac/g,'/').replace(/\\[A-Za-z]+/g,'').replace(/[${}]/g,'').replace(/\s+/g,' ').trim().length;
}
function v3735CompactMcq(q={}){
  const a=q.options||[];if(a.length!==4)return false;
  const lens=a.map(v3735OptionTextLength);
  return Math.max(...lens,0)<=52 && lens.reduce((x,y)=>x+y,0)<=150;
}

function v3735RenderCurrentExamQuestion(){
  const box=document.getElementById('examQuestion');if(!box||typeof examSession==='undefined'||!examSession)return;
  const q=examSession.config.questions[examSession.current],ans=examSession.answers[examSession.current],fig=questionFigureHTML(q,true);
  const head=`<div class="exam-question-head"><div><div class="exam-qno">Câu ${examSession.current+1} / ${examSession.config.questions.length}</div></div><span class="exam-part">${esc(q.part||questionTypeName(q.type))}</span></div>`;
  const stem=`<div class="exam-question-text">${mathHTML(q.question)}</div>`;
  let answers='';
  if(q.type==='mcq'){
    const compact=v3735CompactMcq(q);
    answers=`<div class="exam-answer-list ${compact?'v3735-answer-grid':''}">${(q.options||[]).map((o,j)=>`<div class="exam-answer-option ${Number(ans)===j?'selected':''}" onclick="setExamAnswer(${j})"><div class="exam-answer-letter">${String.fromCharCode(65+j)}</div><div class="exam-answer-content">${mathHTML(o)}</div></div>`).join('')}</div>`;
  }else if(q.type==='tf4'){
    const a=Array.isArray(ans)?ans:[];answers=`<div class="exam-tf-list">${(q.statements||[]).map((it,j)=>`<div class="exam-tf-row"><div class="exam-tf-text"><b>${String.fromCharCode(97+j)})</b> ${mathHTML(it.text||'')}</div><div class="exam-tf-actions"><button class="exam-tf-choice ${a[j]===true?'selected':''}" onclick="setExamTF(${j},true)">Đúng</button><button class="exam-tf-choice ${a[j]===false?'selected':''}" onclick="setExamTF(${j},false)">Sai</button></div></div>`).join('')}</div>`;
  }else if(q.type==='tf'){
    answers=`<div class="exam-tf-actions"><button class="exam-tf-choice ${ans===true?'selected':''}" onclick="setExamAnswer(true)">Đúng</button><button class="exam-tf-choice ${ans===false?'selected':''}" onclick="setExamAnswer(false)">Sai</button></div>`;
  }else{
    answers=`<input class="exam-short-input" value="${attrEsc(ans??'')}" placeholder="Nhập đáp án" oninput="setExamShort(this.value)">`;
  }
  const core=`${stem}${answers}`;
  let content;
  if(fig){
    if(q.figureLayout==='right')content=`<div class="exam-immini"><div>${core}</div><div class="exam-immini-figure">${fig}</div></div>`;
    else if(q.figureLayout==='left')content=`<div class="exam-immini left"><div class="exam-immini-figure">${fig}</div><div>${core}</div></div>`;
    else content=`<div class="v3735-question-core">${stem}<div class="v3735-exam-figure">${fig}</div>${answers}</div>`;
  }else content=core;
  box.innerHTML=head+content;
  const f=document.getElementById('examFlagBtn');if(f){f.classList.toggle('active',!!examSession.flags[examSession.current]);f.textContent=examSession.flags[examSession.current]?'★ Đã đánh dấu xem lại':'☆ Đánh dấu xem lại'}
  typesetMath(box);
}
window.renderCurrentExamQuestion=v3735RenderCurrentExamQuestion;

window.v3735VariationRegression=function(){
  try{
    const src=String.raw`\begin{tikzpicture}\tkzTabInit{$x$/1,$f'(x)$/1,$f(x)$/2}{$-\infty$,$-1$,$3$,$+\infty$}\tkzTabLine{,+,0,-,0,+,}\tkzTabVar{-/$-\infty$,+/$1$,-/$-3$,+/$+\infty$}\end{tikzpicture}`;
    const html=v3735TkzTabNativeHTML(src),segments=(html.match(/class="tkztab-trend v3735-trend"/g)||[]).length;
    return {ok:segments===3&&html.includes('v3735-tkztab'),segments,version:V};
  }catch(error){return {ok:false,error:String(error?.message||error),version:V}}
};
window.V3735={version:V,renderVariation:v3735TkzTabNativeHTML,compactMcq:v3735CompactMcq,regression:window.v3735VariationRegression};
})();
