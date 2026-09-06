/* Math12 Hub  — Variation Table & Exam Layout Polish
   - Anchor-based tkz-tab variation arrows
   - Compact exam question/figure/options layout
   - Hides authoring/source diagnostics from student exam mode
*/
(function(){
'use strict';
const V='37.3.6';

function v3736RawMath(raw=''){
  try{return typeof tkzMathRaw==='function'?tkzMathRaw(raw):String(raw||'').replace(/^\$|\$$/g,'').trim()}catch(_){return String(raw||'').trim()}
}
function v3736MathCell(raw=''){
  const s=v3736RawMath(raw);return s?(typeof mathHTML==='function'?mathHTML(`$${s}$`):s):'';
}
function v3736Norm(raw=''){return v3736RawMath(raw).replace(/\s+/g,'')}
function v3736PosInf(raw=''){return /^(?:\+?\\infty|\+?∞)$/.test(v3736Norm(raw))}
function v3736NegInf(raw=''){return /^(?:[-−]\\infty|[-−]∞)$/.test(v3736Norm(raw))}
function v3736PointY(raw='',mode=''){
  if(v3736PosInf(raw))return 23;
  if(v3736NegInf(raw))return 77;
  const m=String(mode||'');
  if(m.includes('+'))return 24;
  if(m.includes('-'))return 76;
  return 50;
}
function v3736LabelY(raw='',mode=''){
  if(v3736PosInf(raw))return 17;
  if(v3736NegInf(raw))return 83;
  const m=String(mode||'');
  if(m.includes('+'))return 17;
  if(m.includes('-'))return 83;
  return 50;
}
function v3736Segment(a,b,index){
  if(!a||!b)return '';
  const dx=b.x-a.x,dy=b.y-a.y;
  // Keep the shaft inside its interval. The actual arrow head is a separate
  // polygon recalculated in screen pixels, so browser zoom / responsive SVG
  // scaling cannot make it disappear or become hairline-thin.
  const t1=.075,t2=.925;
  const x1=a.x+dx*t1,y1=a.y+dy*t1,x2=a.x+dx*t2,y2=a.y+dy*t2;
  return `<g class="v3736-arrow-segment" data-x1="${x1.toFixed(4)}" data-y1="${y1.toFixed(4)}" data-x2="${x2.toFixed(4)}" data-y2="${y2.toFixed(4)}" data-index="${index}"><line x1="${x1.toFixed(4)}" y1="${y1.toFixed(4)}" x2="${x2.toFixed(4)}" y2="${y2.toFixed(4)}" class="tkztab-trend v3736-trend"/><polygon class="v3736-arrow-head" points="${x2.toFixed(4)},${y2.toFixed(4)} ${x2.toFixed(4)},${y2.toFixed(4)} ${x2.toFixed(4)},${y2.toFixed(4)}"/></g>`;
}

function v3736ArrowGeometry(x1,y1,x2,y2,width,height,headLen=10,headHalf=4.5){
  width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);
  const p1={x:x1*width/100,y:y1*height/100},tip={x:x2*width/100,y:y2*height/100};
  let dx=tip.x-p1.x,dy=tip.y-p1.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
  const base={x:tip.x-ux*headLen,y:tip.y-uy*headLen};
  const px=-uy,py=ux;
  const left={x:base.x+px*headHalf,y:base.y+py*headHalf};
  const right={x:base.x-px*headHalf,y:base.y-py*headHalf};
  const shaft={x:tip.x-ux*(headLen*.72),y:tip.y-uy*(headLen*.72)};
  const toV=p=>({x:p.x/width*100,y:p.y/height*100});
  return {tip:toV(tip),left:toV(left),right:toV(right),shaft:toV(shaft),headLenPx:headLen,headWidthPx:headHalf*2};
}

function v3736PaintArrowHeads(root=document){
  const svgs=(root?.matches?.('svg.v3736-arrows')?[root]:Array.from(root?.querySelectorAll?.('svg.v3736-arrows')||[]));
  svgs.forEach(svg=>{
    const rect=svg.getBoundingClientRect();if(rect.width<20||rect.height<20)return;
    svg.querySelectorAll('.v3736-arrow-segment').forEach(g=>{
      const x1=Number(g.dataset.x1),y1=Number(g.dataset.y1),x2=Number(g.dataset.x2),y2=Number(g.dataset.y2);
      const geo=v3736ArrowGeometry(x1,y1,x2,y2,rect.width,rect.height);
      const line=g.querySelector('line'),head=g.querySelector('polygon');
      if(line){line.setAttribute('x2',geo.shaft.x.toFixed(4));line.setAttribute('y2',geo.shaft.y.toFixed(4));}
      if(head)head.setAttribute('points',`${geo.tip.x.toFixed(4)},${geo.tip.y.toFixed(4)} ${geo.left.x.toFixed(4)},${geo.left.y.toFixed(4)} ${geo.right.x.toFixed(4)},${geo.right.y.toFixed(4)}`);
    });
    svg.dataset.arrowPainted='1';
    if(!svg.__v3736ResizeObserver&&typeof ResizeObserver==='function'){
      svg.__v3736ResizeObserver=new ResizeObserver(()=>v3736ScheduleArrowPaint(svg));
      svg.__v3736ResizeObserver.observe(svg);
    }
  });
}
let v3736PaintRAF=0;
function v3736ScheduleArrowPaint(root=document){
  cancelAnimationFrame?.(v3736PaintRAF);
  v3736PaintRAF=requestAnimationFrame(()=>requestAnimationFrame(()=>v3736PaintArrowHeads(root)));
}
function v3736InstallArrowWatcher(){
  v3736ScheduleArrowPaint(document);
  if(typeof MutationObserver==='function'){
    const mo=new MutationObserver(list=>{if(list.some(m=>m.addedNodes?.length))v3736ScheduleArrowPaint(document)});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    window.__v3736ArrowMutationObserver=mo;
  }
  window.addEventListener('resize',()=>v3736ScheduleArrowPaint(document),{passive:true});
  window.addEventListener('beforeprint',()=>v3736PaintArrowHeads(document));
}


function v3736TkzTabNativeHTML(tex=''){
  const d=(typeof parseTkzTabFigure==='function'?parseTkzTabFigure(tex):{ok:false,error:'Thiếu bộ đọc tkz-tab.'});
  if(!d.ok)return `<div class="bulk-errors fatal">${typeof esc==='function'?esc(d.error||'Không đọc được bảng biến thiên.'):d.error}</div>`;
  const n=Math.max(2,d.xsRaw?.length||d.xs?.length||2),safeA=7,safeB=93;
  const nodeX=Array.from({length:n},(_,i)=>safeA+(safeB-safeA)*(i/(n-1)));
  const nodes=[];
  for(let i=0;i<n;i++){
    const v=d.vars?.[i]||{};
    if(v.discontinuity){
      nodes.push({kind:'break',left:{x:nodeX[i]-3.5,y:v3736PointY(v.leftRaw,v.leftMode),labelY:v3736LabelY(v.leftRaw,v.leftMode),raw:v.leftRaw},right:{x:nodeX[i]+3.5,y:v3736PointY(v.rightRaw,v.rightMode),labelY:v3736LabelY(v.rightRaw,v.rightMode),raw:v.rightRaw}});
    }else{
      nodes.push({kind:'normal',pt:{x:nodeX[i],y:v3736PointY(v.rawValue,v.mode),labelY:v3736LabelY(v.rawValue,v.mode),raw:v.rawValue}});
    }
  }
  const startPt=node=>node?.kind==='break'?node.right:node?.pt;
  const endPt=node=>node?.kind==='break'?node.left:node?.pt;
  const arrows=[];for(let i=0;i<n-1;i++)arrows.push(v3736Segment(startPt(nodes[i]),endPt(nodes[i+1]),i));

  const rowLabel=(raw,fallback)=>`<div class="tkztab-label">${v3736MathCell(raw||fallback)}</div>`;
  const xNodes=nodeX.map((x,i)=>`<span class="tkztab-node" style="left:${x}%">${v3736MathCell(d.xsRaw?.[i]||d.xs?.[i]||'')}</span>`).join('');
  const xExtras=(d.vals||[]).map(v=>{const a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),r=Number.isFinite(v.pos)?Math.max(0,Math.min(1,v.pos)):.5,x=nodeX[a]+(nodeX[b]-nodeX[a])*r;return `<span class="tkztab-extra tkztab-node" style="left:${x}%">${v3736MathCell(v.xRaw)}</span>`}).join('');

  let dMarks='';
  for(let i=0;i<n;i++){
    const b=String(d.boundary?.[i]||'').trim();
    if(b.includes('d'))dMarks+=`<span class="tkztab-break derivative-only" style="left:${nodeX[i]}%"></span>`;
    else if(b==='0'||b.includes('z'))dMarks+=`<span class="tkztab-sign" style="left:${nodeX[i]}%">${v3736MathCell('0')}</span>`;
    else if(b)dMarks+=`<span class="tkztab-sign" style="left:${nodeX[i]}%">${v3736MathCell(b)}</span>`;
    if(i<n-1){const mid=(nodeX[i]+nodeX[i+1])/2,s=String(d.interval?.[i]||'').trim(),sign=s.includes('+')?'+':s.includes('-')?'-':s.includes('0')?'0':s;dMarks+=`<span class="tkztab-sign" style="left:${mid}%">${v3736MathCell(sign)}</span>`}
  }

  let yMarks='';
  nodes.forEach((node,i)=>{
    if(node.kind==='break'){
      yMarks+=`<span class="tkztab-break" style="left:${nodeX[i]}%"></span>`;
      if(node.left.raw)yMarks+=`<span class="tkztab-value v3736-value" style="left:${node.left.x}%;top:${node.left.labelY}%">${v3736MathCell(node.left.raw)}</span>`;
      if(node.right.raw)yMarks+=`<span class="tkztab-value v3736-value" style="left:${node.right.x}%;top:${node.right.labelY}%">${v3736MathCell(node.right.raw)}</span>`;
    }else if(node.pt?.raw){
      yMarks+=`<span class="tkztab-value v3736-value" style="left:${node.pt.x}%;top:${node.pt.labelY}%">${v3736MathCell(node.pt.raw)}</span>`;
    }
  });

  const valExtras=(d.vals||[]).map(v=>{const a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),r=Number.isFinite(v.pos)?Math.max(0,Math.min(1,v.pos)):.5,x=nodeX[a]+(nodeX[b]-nodeX[a])*r,pa=endPt(nodes[a]),pb=startPt(nodes[b]),y=pa&&pb?pa.y+(pb.y-pa.y)*r:50;return `<span class="tkztab-extra tkztab-value v3736-value" style="left:${x}%;top:${y}%">${v3736MathCell(v.yRaw)}</span>`}).join('');
  const imaExtras=(d.imas||[]).map(v=>{const a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1)),b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1)),x=(nodeX[a]+nodeX[b])/2;return `<span class="tkztab-extra tkztab-value v3736-value" style="left:${x}%;top:50%">${v3736MathCell(v.valueRaw)}</span>`}).join('');
  const warn=d.unsupported?.length?`<div class="tkztab-validation">Chưa dựng trực tiếp: ${d.unsupported.map(x=>'\\'+x).join(', ')}. Mã gốc vẫn được giữ để chỉnh sửa.</div>`:'';

  return `<div class="tkztab-scroll v3736-tkztab-scroll"><div class="tkztab-native v3736-tkztab math-rich"><div class="tkztab-row tkztab-x">${rowLabel(d.rows?.[0],'$x$')}<div class="tkztab-data">${xNodes}${xExtras}</div></div><div class="tkztab-row tkztab-d">${rowLabel(d.rows?.[1],"$f'(x)$")}<div class="tkztab-data">${dMarks}</div></div><div class="tkztab-row tkztab-y">${rowLabel(d.rows?.[2],'$f(x)$')}<div class="tkztab-data"><svg class="tkztab-arrows v3736-arrows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${arrows.join('')}</svg>${yMarks}${valExtras}${imaExtras}</div></div></div></div>${warn}`;
}

// Override the mature native renderer while keeping the parser/source data intact.
window.tkzTabNativeHTML=v3736TkzTabNativeHTML;

function v3736OptionTextLength(s=''){
  return String(s||'').replace(/\\(?:d|t)?frac/g,'/').replace(/\\[A-Za-z]+/g,'').replace(/[${}]/g,'').replace(/\s+/g,' ').trim().length;
}
function v3736CompactMcq(q={}){
  const a=q.options||[];if(a.length!==4)return false;
  const lens=a.map(v3736OptionTextLength);
  return Math.max(...lens,0)<=52 && lens.reduce((x,y)=>x+y,0)<=150;
}

function v3736RenderCurrentExamQuestion(){
  const box=document.getElementById('examQuestion');if(!box||typeof examSession==='undefined'||!examSession)return;
  const q=examSession.config.questions[examSession.current],ans=examSession.answers[examSession.current],fig=questionFigureHTML(q,true);
  const head=`<div class="exam-question-head"><div><div class="exam-qno">Câu ${examSession.current+1} / ${examSession.config.questions.length}</div></div><span class="exam-part">${esc(q.part||questionTypeName(q.type))}</span></div>`;
  const stem=`<div class="exam-question-text">${mathHTML(q.question)}</div>`;
  let answers='';
  if(q.type==='mcq'){
    const compact=v3736CompactMcq(q);
    answers=`<div class="exam-answer-list ${compact?'v3736-answer-grid':''}">${(q.options||[]).map((o,j)=>`<div class="exam-answer-option ${Number(ans)===j?'selected':''}" onclick="setExamAnswer(${j})"><div class="exam-answer-letter">${String.fromCharCode(65+j)}</div><div class="exam-answer-content">${mathHTML(o)}</div></div>`).join('')}</div>`;
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
    else content=`<div class="v3736-question-core">${stem}<div class="v3736-exam-figure">${fig}</div>${answers}</div>`;
  }else content=core;
  box.innerHTML=head+content;
  const f=document.getElementById('examFlagBtn');if(f){f.classList.toggle('active',!!examSession.flags[examSession.current]);f.textContent=examSession.flags[examSession.current]?'★ Đã đánh dấu xem lại':'☆ Đánh dấu xem lại'}
  typesetMath(box);v3736ScheduleArrowPaint(box);
}
window.renderCurrentExamQuestion=v3736RenderCurrentExamQuestion;

window.v3736VariationRegression=function(){
  try{
    const src=String.raw`\begin{tikzpicture}\tkzTabInit{$x$/1,$f'(x)$/1,$f(x)$/2}{$-\infty$,$-1$,$3$,$+\infty$}\tkzTabLine{,+,0,-,0,+,}\tkzTabVar{-/$-\infty$,+/$1$,-/$-3$,+/$+\infty$}\end{tikzpicture}`;
    const html=v3736TkzTabNativeHTML(src),segments=(html.match(/class="v3736-arrow-segment"/g)||[]).length,heads=(html.match(/class="v3736-arrow-head"/g)||[]).length;
    const gWide=v3736ArrowGeometry(8,77,30,24,1280,94),gNarrow=v3736ArrowGeometry(8,77,30,24,560,88);
    const fixed=Math.abs(gWide.headLenPx-gNarrow.headLenPx)<.001&&Math.abs(gWide.headWidthPx-gNarrow.headWidthPx)<.001;
    return {ok:segments===3&&heads===3&&fixed&&html.includes('v3736-tkztab'),segments,heads,fixedPixelHead:fixed,headPx:`${gWide.headLenPx}×${gWide.headWidthPx}`,version:V};
  }catch(error){return {ok:false,error:String(error?.message||error),version:V}}
};

window.V3736={version:V,renderVariation:v3736TkzTabNativeHTML,compactMcq:v3736CompactMcq,arrowGeometry:v3736ArrowGeometry,paintArrows:v3736PaintArrowHeads,regression:window.v3736VariationRegression};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v3736InstallArrowWatcher,{once:true});else v3736InstallArrowWatcher();
})();
