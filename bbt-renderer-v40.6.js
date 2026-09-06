/* ==========================================================
   Math12 Hub V40.6 — Native BBT/BXD Row-Aware Renderer
   ----------------------------------------------------------
   Core rule:
   - Render exactly the mathematical rows explicitly present in \tkzTabInit.
   - A derivative sign table x + f'(x) stays a 2-row table.
   - Never infer/create f(x) from the sign of f'(x).
   - Full BBT x + f'(x) + f(x) continues through the existing renderer.
   - Legacy 2-row x + f(x) variation tables are preserved by the existing engine.
   Additive hotfix: no question schema, answer, ID6 or Firestore migration.
   ========================================================== */
(function(){
'use strict';
const VERSION='40.6';
const BUILD='40.6-native-bbt-row-aware';
let installed=false, baseRenderer=null;

function esc(s=''){
  if(typeof window.esc==='function')return window.esc(String(s));
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function rawMath(s=''){
  let x=String(s||'').trim();
  if(x.startsWith('$')&&x.endsWith('$')&&x.length>=2)x=x.slice(1,-1).trim();
  return x;
}
function mathCell(s=''){
  const raw=rawMath(s);
  if(!raw)return '';
  return typeof window.mathHTML==='function'?window.mathHTML(`$${raw}$`):esc(raw);
}
function hasCommand(tex='',cmd=''){
  return new RegExp('\\\\'+cmd+'\\b').test(String(tex||''));
}
function derivativeLabel(raw=''){
  const s=rawMath(raw).replace(/\s+/g,'');
  return /(?:\\prime|['′])/.test(s);
}
function classify(tex='',d=null){
  if(!d?.ok)return {kind:'invalid',rows:0,hasLine:false,hasVar:false};
  const rows=Array.isArray(d.rows)?d.rows.length:0;
  const hasLine=hasCommand(tex,'tkzTabLine');
  const hasVar=hasCommand(tex,'tkzTabVar');
  const secondIsDerivative=rows>=2&&derivativeLabel(d.rows[1]);
  // Exact-source policy: if row 3 is explicitly present, it is a full BBT.
  if(rows>=3)return {kind:'full-bbt',rows,hasLine,hasVar,secondIsDerivative};
  // Two explicit rows where row 2 is f' (or where only a sign line exists) are a sign table.
  if(rows===2&&(secondIsDerivative||(hasLine&&!hasVar)))return {kind:'derivative-sign-2row',rows,hasLine,hasVar,secondIsDerivative};
  // Preserve old x + f(x) 2-row variation tables through the established renderer.
  if(rows===2&&hasVar)return {kind:'legacy-variation-2row',rows,hasLine,hasVar,secondIsDerivative};
  return {kind:'other',rows,hasLine,hasVar,secondIsDerivative};
}
function nodePositions(n){
  const a=8,b=92;
  return Array.from({length:Math.max(2,n)},(_,i)=>a+(b-a)*(i/(Math.max(2,n)-1)));
}
function renderXRow(d,nodeX){
  const xNodes=nodeX.map((x,i)=>`<span class="tkztab-node" style="left:${x}%">${mathCell(d.xsRaw?.[i]||d.xs?.[i]||'')}</span>`).join('');
  const xExtras=(d.vals||[]).map(v=>{
    const n=nodeX.length;
    const a=Math.max(0,Math.min(n-1,(Number(v.from)||1)-1));
    const b=Math.max(0,Math.min(n-1,(Number(v.to)||2)-1));
    const r=Number.isFinite(v.pos)?Math.max(0,Math.min(1,v.pos)):.5;
    const x=nodeX[a]+(nodeX[b]-nodeX[a])*r;
    return `<span class="tkztab-extra tkztab-node" style="left:${x}%">${mathCell(v.xRaw)}</span>`;
  }).join('');
  return `<div class="tkztab-row tkztab-x"><div class="tkztab-label">${mathCell(d.rows?.[0]||'$x$')}</div><div class="tkztab-data">${xNodes}${xExtras}</div></div>`;
}
function signText(token=''){
  const s=String(token||'').trim();
  if(s.includes('+'))return '+';
  if(s.includes('-'))return '-';
  if(s==='0'||s.includes('z'))return '0';
  return s;
}
function renderDerivativeRow(d,nodeX){
  const n=nodeX.length;
  let marks='';
  for(let i=0;i<n;i++){
    const boundary=String(d.boundary?.[i]||'').trim();
    if(boundary.includes('d')){
      marks+=`<span class="tkztab-break derivative-only" style="left:${nodeX[i]}%" aria-label="không xác định"></span>`;
    }else if(boundary==='0'||boundary.includes('z')){
      marks+=`<span class="tkztab-sign" style="left:${nodeX[i]}%">${mathCell('0')}</span>`;
    }else if(boundary){
      marks+=`<span class="tkztab-sign" style="left:${nodeX[i]}%">${mathCell(signText(boundary))}</span>`;
    }
    if(i<n-1){
      const mid=(nodeX[i]+nodeX[i+1])/2;
      const interval=String(d.interval?.[i]||'').trim();
      const sign=signText(interval);
      if(sign)marks+=`<span class="tkztab-sign" style="left:${mid}%">${mathCell(sign)}</span>`;
    }
  }
  return `<div class="tkztab-row tkztab-d"><div class="tkztab-label">${mathCell(d.rows?.[1]||"$f'(x)$")}</div><div class="tkztab-data">${marks}</div></div>`;
}
function renderDerivativeSignTable(tex='',d=null){
  d=d||window.parseTkzTabFigure?.(tex);
  if(!d?.ok)return '';
  const n=Math.max(2,d.xsRaw?.length||d.xs?.length||2),nodeX=nodePositions(n);
  return `<div class="tkztab-scroll v406-bxd-scroll" data-v406-table="derivative-sign" data-v406-rows="2"><div class="tkztab-native v406-bxd v406-bxd-2row math-rich" role="img" aria-label="Bảng xét dấu đạo hàm gồm hai dòng">${renderXRow(d,nodeX)}${renderDerivativeRow(d,nodeX)}</div></div>`;
}
function render(tex=''){
  const parser=window.parseTkzTabFigure;
  if(typeof parser!=='function')return baseRenderer?baseRenderer(tex):'';
  let d=null;
  try{d=parser(tex)}catch(_){return baseRenderer?baseRenderer(tex):''}
  const info=classify(tex,d);
  if(info.kind==='derivative-sign-2row')return renderDerivativeSignTable(tex,d);
  return baseRenderer?baseRenderer(tex):'';
}
function patch(){
  if(installed)return true;
  if(typeof window.tkzTabNativeHTML!=='function'||typeof window.parseTkzTabFigure!=='function')return false;
  baseRenderer=window.tkzTabNativeHTML;
  const wrapped=function(tex=''){return render(tex)};
  wrapped.__v406=true;
  wrapped.__base=baseRenderer;
  window.tkzTabNativeHTML=wrapped;
  installed=true;
  return true;
}
function inspect(tex=''){
  try{const d=window.parseTkzTabFigure?.(tex);return {...classify(tex,d),parsed:!!d?.ok,rowLabels:d?.rows||[]}}catch(e){return {kind:'invalid',rows:0,error:String(e?.message||e)}}
}
function regression(){
  if(typeof window.parseTkzTabFigure!=='function')return {ok:false,version:VERSION,build:BUILD,error:'Thiếu parseTkzTabFigure'};
  const sign=String.raw`\begin{tikzpicture}
\tkzTabInit[lgt=1.4,espcl=1.9]{$x$/1,$f'(x)$/1}{$-\infty$,$-3$,$-1$,$1$,$+\infty$}
\tkzTabLine{,-,0,+,0,-,0,+,}
\end{tikzpicture}`;
  const full=String.raw`\begin{tikzpicture}
\tkzTabInit{$x$/1,$f'(x)$/1,$f(x)$/2}{$-\infty$,$0$,$+\infty$}
\tkzTabLine{,+,0,-,}
\tkzTabVar{-/$-\infty$,+/$2$,-/$-\infty$}
\end{tikzpicture}`;
  const sInfo=inspect(sign),fInfo=inspect(full),sHtml=render(sign),fHtml=render(full);
  const signTwoRows=(sHtml.match(/class="tkztab-row\b/g)||[]).length===2;
  const noFunctionRow=!/tkztab-y/.test(sHtml)&&!/data-v406-rows="3"/.test(sHtml);
  const signValues=['-','0','+'].every(x=>sHtml.includes(`$${x}$`)||sHtml.includes(`>${x}<`)||sHtml.includes(x));
  const fullPreserved=fInfo.kind==='full-bbt'&&/tkztab-y/.test(fHtml);
  return {ok:sInfo.kind==='derivative-sign-2row'&&signTwoRows&&noFunctionRow&&signValues&&fullPreserved,version:VERSION,build:BUILD,signKind:sInfo.kind,signRows:signTwoRows?2:null,noFunctionRow,fullPreserved};
}
function auditBank(){
  const bank=window.state?.questionBank||window.MATH12_ALL_PRACTICE_BANK||[];
  const stats={totalTkzTab:0,sign2Row:0,full3Row:0,legacy2Row:0,other:0};
  for(const q of bank){
    if(q?.figureMode!=='tkztab'||!q.figureLatex)continue;
    stats.totalTkzTab++;
    const k=inspect(q.figureLatex).kind;
    if(k==='derivative-sign-2row')stats.sign2Row++;
    else if(k==='full-bbt')stats.full3Row++;
    else if(k==='legacy-variation-2row')stats.legacy2Row++;
    else stats.other++;
  }
  return stats;
}
function init(){
  if(!patch())setTimeout(init,40);
}

window.V406BBTRenderer={version:VERSION,build:BUILD,classify,inspect,renderDerivativeSignTable,render,patch,regression,auditBank};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
else setTimeout(init,0);
})();
