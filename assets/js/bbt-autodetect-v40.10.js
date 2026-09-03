/* ==========================================================
   Math12 Hub V40.10 — BBT / BXD Source Auto-Detect Router
   ----------------------------------------------------------
   Goals:
   1) Detect tkz-tab from source, even when legacy metadata says tikz/tkz.
   2) Route detected tkz-tab directly to the Native BBT/BXD renderer.
   3) Preserve the V40.6 exact-row policy: x + f'(x) stays 2 rows.
   4) Recognize common legacy hand-drawn TikZ sign/variation tables and
      synthesize equivalent tkz-tab without modifying the saved question.
   5) Never infer an f(x) row when the source does not explicitly contain it.
   Additive runtime patch: no question/answer/ID6/Firestore migration.
   ========================================================== */
(function(){
'use strict';
const VERSION='40.10';
const BUILD='40.10-bbt-source-autodetect';
let installed=false, baseRenderer=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=s=>esc(s).replace(/`/g,'&#96;');
const norm=s=>String(s||'').replace(/\r\n?/g,'\n').trim();

function hasCmd(tex='',cmd=''){
  return new RegExp('\\\\'+cmd+'\\b').test(String(tex||''));
}
function isTkzTabSource(tex=''){
  const s=String(tex||'');
  return hasCmd(s,'tkzTabInit') && (hasCmd(s,'tkzTabLine') || hasCmd(s,'tkzTabVar') || hasCmd(s,'tkzTabVal') || hasCmd(s,'tkzTabIma'));
}
function explicitRows(tex=''){
  try{
    const d=window.parseTkzTabFigure?.(tex);
    return d?.ok && Array.isArray(d.rows) ? d.rows.length : 0;
  }catch(_){ return 0; }
}
function cleanMath(raw=''){
  let s=String(raw||'').trim();
  if(s.startsWith('$')&&s.endsWith('$')&&s.length>=2)s=s.slice(1,-1).trim();
  return s;
}
function plainForCompare(raw=''){
  return cleanMath(raw).replace(/\s+/g,'').replace(/\\prime/g,"'").replace(/[′’]/g,"'");
}
function isXLabel(raw=''){ return plainForCompare(raw)==='x'; }
function isDerivativeLabel(raw=''){
  const s=plainForCompare(raw);
  return /^(?:f|y)'\(x\)$/.test(s)||/^(?:f|y)'$/.test(s)||/^(?:f|y)\^'?\(x\)$/.test(s);
}
function isFunctionLabel(raw=''){
  const s=plainForCompare(raw);
  return /^(?:f|y)\(x\)$/.test(s)||/^(?:f|y)$/.test(s);
}
function parseNum(v){ const n=Number(String(v).replace(',','.')); return Number.isFinite(n)?n:null; }
function dist(a,b){ return Math.abs(Number(a)-Number(b)); }
function nearestIndex(xs=[],x=0){
  let best=-1,bd=Infinity;xs.forEach((v,i)=>{const d=dist(v,x);if(d<bd){bd=d;best=i}});return best;
}
function nearestGap(xs=[],x=0){
  let best=-1,bd=Infinity;for(let i=0;i<xs.length-1;i++){const mid=(xs[i]+xs[i+1])/2,d=dist(mid,x);if(d<bd){bd=d;best=i}}return best;
}
function latexGroup(raw=''){
  const s=String(raw||'').trim();
  return s || '';
}

/* Strict recognizer for the common legacy TikZ table style used in the bank.
   It intentionally requires x and f'(x) row labels. f(x) is optional.
   A full variation table additionally requires arrows in the lower row. */
function parseLegacyTikzTable(tex=''){
  const src=norm(tex);
  if(!/\\begin\s*\{tikzpicture\}/.test(src))return {ok:false};
  if(isTkzTabSource(src))return {ok:false};
  if(!/\\draw\b[\s\S]*?rectangle\s*\(/.test(src) && !/\\draw\b[\s\S]*?--/.test(src))return {ok:false};

  const nodes=[];
  const re=/\\node(?:\s*\[[^\]]*\])?\s+at\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)\s*\{([\s\S]*?)\}\s*;/g;
  let m;
  while((m=re.exec(src))){
    const x=parseNum(m[1]),y=parseNum(m[2]);
    if(x===null||y===null)continue;
    nodes.push({x,y,raw:String(m[3]||'').trim()});
  }
  if(nodes.length<5)return {ok:false};
  const xLab=nodes.find(n=>isXLabel(n.raw));
  const dLab=nodes.find(n=>isDerivativeLabel(n.raw));
  const yLab=nodes.find(n=>isFunctionLabel(n.raw) && !isDerivativeLabel(n.raw));
  if(!xLab||!dLab)return {ok:false};
  if(Math.abs(xLab.x-dLab.x)>.9)return {ok:false};

  const dataMinX=Math.max(xLab.x,dLab.x)+.35;
  const topTol=.36, dTol=.42;
  const xNodes=nodes.filter(n=>n.x>dataMinX&&Math.abs(n.y-xLab.y)<=topTol&&!isXLabel(n.raw)).sort((a,b)=>a.x-b.x);
  if(xNodes.length<2)return {ok:false};
  // Deduplicate coordinates in case the source repeats labels.
  const uniq=[];for(const n of xNodes){if(!uniq.some(u=>Math.abs(u.x-n.x)<.08))uniq.push(n)}
  if(uniq.length<2)return {ok:false};
  const xsCoord=uniq.map(n=>n.x), xsRaw=uniq.map(n=>cleanMath(n.raw));
  if(xsRaw.some(v=>!v))return {ok:false};

  const derivativeNodes=nodes.filter(n=>n.x>dataMinX&&Math.abs(n.y-dLab.y)<=dTol);
  const boundary=Array(xsRaw.length).fill('');
  const interval=Array(Math.max(0,xsRaw.length-1)).fill('');
  derivativeNodes.forEach(n=>{
    const raw=cleanMath(n.raw), cmp=plainForCompare(n.raw);
    let token='';
    if(cmp==='+')token='+'; else if(cmp==='-'||cmp==='−')token='-'; else if(cmp==='0')token='z'; else return;
    const ni=nearestIndex(xsCoord,n.x),gi=nearestGap(xsCoord,n.x);
    const nd=ni>=0?dist(xsCoord[ni],n.x):Infinity;
    const gd=gi>=0?dist((xsCoord[gi]+xsCoord[gi+1])/2,n.x):Infinity;
    if(token==='z'||nd<=gd*.7)boundary[ni]=token; else if(gi>=0)interval[gi]=token;
  });
  if(!interval.some(Boolean) && !boundary.some(Boolean))return {ok:false};
  // Safe conversion policy: a simple hand-drawn BBT must explicitly mark every
  // interior finite critical point in the derivative row (normally 0).
  // Tables with asymptote/discontinuity double bars are left to the existing TikZ
  // pipeline rather than being guessed into the wrong mathematical structure.
  for(let i=1;i<xsRaw.length-1;i++){
    if(!boundary[i])return {ok:false,reason:'complex-or-discontinuous-legacy-table'};
  }

  const hasFunctionRow=!!yLab;
  const arrowRe=/\\draw\s*(?:\[[^\]]*(?:->|stealth)[^\]]*\])?\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)\s*--\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)\s*;/g;
  const arrows=[];
  while((m=arrowRe.exec(src))){
    const a=[parseNum(m[1]),parseNum(m[2])],b=[parseNum(m[3]),parseNum(m[4])];
    if(a.every(v=>v!==null)&&b.every(v=>v!==null))arrows.push({x1:a[0],y1:a[1],x2:b[0],y2:b[1]});
  }
  if(hasFunctionRow && arrows.length===0)return {ok:false};

  const values=Array(xsRaw.length).fill('');
  if(hasFunctionRow){
    const yCut=dLab.y-.15;
    nodes.filter(n=>n.x>dataMinX&&n.y<yCut&&!['+','-','−','0'].includes(plainForCompare(n.raw))).forEach(n=>{
      const i=nearestIndex(xsCoord,n.x);
      const spacing=xsCoord.length>1?Math.min(...xsCoord.slice(1).map((v,j)=>v-xsCoord[j])):1;
      if(i>=0&&dist(xsCoord[i],n.x)<=Math.max(.42,spacing*.22))values[i]=cleanMath(n.raw);
    });
  }

  const line=[];
  for(let i=0;i<xsRaw.length;i++){
    line.push(boundary[i]||'');
    if(i<xsRaw.length-1)line.push(interval[i]||'');
  }
  const rowDefs=hasFunctionRow?`$x$/1,$f'(x)$/1,$f(x)$/2`:`$x$/1,$f'(x)$/1`;
  let synthetic=`\\begin{tikzpicture}\n\\tkzTabInit{${rowDefs}}{${xsRaw.map(x=>`$${latexGroup(x)}$`).join(',')}}\n\\tkzTabLine{${line.join(',')}}`;
  if(hasFunctionRow){
    const modes=xsRaw.map((_,i)=>{
      const left=i>0?interval[i-1]:'';
      const right=i<interval.length?interval[i]:'';
      if(i===0)return right.includes('+')?'-':right.includes('-')?'+':'';
      if(i===xsRaw.length-1)return left.includes('+')?'+':left.includes('-')?'-':'';
      if(left.includes('+')&&right.includes('-'))return '+';
      if(left.includes('-')&&right.includes('+'))return '-';
      return left.includes('+')||right.includes('+')?'+':left.includes('-')||right.includes('-')?'-':'';
    });
    const vars=modes.map((mode,i)=>`${mode||''}/${values[i]?`$${latexGroup(values[i])}$`:''}`);
    synthetic+=`\n\\tkzTabVar{${vars.join(',')}}`;
  }
  synthetic+='\n\\end{tikzpicture}';
  return {ok:true,kind:hasFunctionRow?'legacy-variation':'legacy-derivative-sign',rows:hasFunctionRow?3:2,synthetic,xsRaw,interval,boundary,values};
}

function detect(tex=''){
  const s=norm(tex);
  if(!s)return {kind:'none',rows:0};
  if(isTkzTabSource(s))return {kind:'tkztab',rows:explicitRows(s)||0,tex:s};
  const legacy=parseLegacyTikzTable(s);
  if(legacy.ok)return {...legacy,tex:legacy.synthetic,sourceTex:s};
  return {kind:'other',rows:0,tex:s};
}
function caption(item={}){
  return item.figureCaption?`<div class="latex-figure-caption">${typeof window.mathHTML==='function'?window.mathHTML(item.figureCaption):esc(item.figureCaption)}</div>`:'';
}
function sourceDetails(tex='',synthetic=false){
  // Keep source available for teachers/editing, but do not add engine/debug badges to the student view.
  return `<details class="latex-figure-code v4010-source"><summary>${synthetic?'Mã TikZ gốc':'Mã tkz-tab gốc'}</summary><pre>${esc(tex)}</pre></details>`;
}
function nativeWrap(item={},nativeTex='',compact=false,sourceTex='',synthetic=false){
  let html='';
  try{ html=typeof window.tkzTabNativeHTML==='function'?window.tkzTabNativeHTML(nativeTex):''; }catch(e){ html=''; }
  if(!html)return '';
  const details=sourceDetails(sourceTex||nativeTex,synthetic);
  return `<div class="latex-figure ${compact?'compact ':''}tkztab v3753-unified v3753-tkztab-native v4010-bbt-auto" data-v4010-engine="native-bbt" data-v4010-auto="${synthetic?'legacy-tikz':'tkztab'}"><div class="v3753-native-shell"><div class="v3753-native-stage">${html}</div><button type="button" class="v3753-native-zoom" onclick="v3753OpenNativeTableZoom(this)" aria-label="Phóng to bảng biến thiên">🔍 Bảng lớn</button></div>${caption(item)}${details}</div>`;
}
function renderDetected(item={},compact=false){
  const original=norm(item?.figureLatex||'');
  const info=detect(original);
  if(info.kind==='tkztab'){
    return nativeWrap(item,info.tex,compact,original,false);
  }
  if(info.kind==='legacy-variation'||info.kind==='legacy-derivative-sign'){
    return nativeWrap(item,info.synthetic,compact,original,true);
  }
  return null;
}
function patchRenderer(){
  if(installed||typeof window.questionFigureHTML!=='function')return false;
  baseRenderer=window.questionFigureHTML;
  const wrapped=function(item={},compact=false){
    const tex=norm(item?.figureLatex||'');
    if(tex){
      const hit=renderDetected(item,compact);
      if(hit!==null&&hit!=='')return hit;
    }
    return baseRenderer(item,compact);
  };
  wrapped.__v4010=true;wrapped.__base=baseRenderer;
  window.questionFigureHTML=wrapped;installed=true;return true;
}
function patchFigureModeTag(){
  // Improve display tags for legacy questions without mutating stored metadata.
  if(typeof window.figureModeTag!=='function'||window.figureModeTag.__v4010)return;
  const old=window.figureModeTag;
  const wrapped=function(mode){return old(mode)};
  wrapped.__v4010=true;wrapped.__base=old;window.figureModeTag=wrapped;
}
function regression(){
  const tkz=String.raw`\begin{tikzpicture}
\tkzTabInit[nocadre=false,lgt=1.2,espcl=3]{$x$/1,$f'(x)$/1,$f(x)$/2}{$0$,$200$,$+\infty$}
\tkzTabLine{,+,z,-,}
\tkzTabVar{-/,+/$100$,-/}
\end{tikzpicture}`;
  const sign=String.raw`\begin{tikzpicture}
\tkzTabInit{$x$/1,$f'(x)$/1}{$-\infty$,$-3$,$-1$,$1$,$+\infty$}
\tkzTabLine{,-,z,+,z,-,z,+,}
\end{tikzpicture}`;
  const legacy=String.raw`\begin{tikzpicture}[>=stealth,scale=.9]
\draw (0,0) rectangle (8,3);
\draw (1.25,0)--(1.25,3);
\draw (0,2.35)--(8,2.35);
\draw (0,1.65)--(8,1.65);
\node at (.62,2.67) {$x$};
\node at (.62,2.00) {$f'(x)$};
\node at (.62,.82) {$f(x)$};
\node at (1.55,2.67) {$0$};
\node at (4.55,2.67) {$200$};
\node at (7.45,2.67) {$+\infty$};
\node at (2.75,2.00) {$+$};
\node at (4.55,2.00) {$0$};
\node at (6.25,2.00) {$-$};
\node at (4.55,1.40) {$100$};
\draw[->] (2.0,.38)--(4.2,1.32);
\draw[->] (4.9,1.32)--(7.1,.38);
\end{tikzpicture}`;
  const a=detect(tkz),b=detect(sign),c=detect(legacy);
  let aHtml='',bHtml='',cHtml='';
  try{aHtml=nativeWrap({figureMode:'tikz'},a.tex,true,tkz,false);bHtml=nativeWrap({figureMode:'tikz'},b.tex,true,sign,false);cHtml=nativeWrap({figureMode:'tikz'},c.synthetic,true,legacy,true)}catch(_){}
  const a3=(aHtml.match(/class="tkztab-row\b/g)||[]).length===3;
  const b2=(bHtml.match(/class="tkztab-row\b/g)||[]).length===2 && !/tkztab-y/.test(bHtml);
  const c3=(cHtml.match(/class="tkztab-row\b/g)||[]).length===3 && /100/.test(cHtml);
  return {ok:a.kind==='tkztab'&&a.rows===3&&a3&&b.kind==='tkztab'&&b.rows===2&&b2&&c.kind==='legacy-variation'&&c.rows===3&&c3,version:VERSION,build:BUILD,tkzMislabeled:a3,signTwoRows:b2,legacyConverted:c3,legacySynthetic:c.synthetic||''};
}
function auditBank(){
  const bank=window.state?.questionBank||window.MATH12_ALL_PRACTICE_BANK||[];
  const out={totalFigures:0,tkzTabSources:0,metadataMismatch:0,legacyCandidates:0,derivative2Row:0,variation3Row:0,other:0};
  for(const q of bank){
    const tex=String(q?.figureLatex||'').trim();if(!tex)continue;out.totalFigures++;
    const d=detect(tex);
    if(d.kind==='tkztab'){
      out.tkzTabSources++;if(q.figureMode!=='tkztab')out.metadataMismatch++;
      if(d.rows===2)out.derivative2Row++;else if(d.rows>=3)out.variation3Row++;
    }else if(d.kind==='legacy-variation'||d.kind==='legacy-derivative-sign')out.legacyCandidates++;else out.other++;
  }
  return out;
}
function init(){
  // Wait until V37.5.3 and V40.6 have finished wrapping the renderer/parser.
  if(typeof window.questionFigureHTML!=='function'||typeof window.tkzTabNativeHTML!=='function'||typeof window.parseTkzTabFigure!=='function')return setTimeout(init,45);
  if(!patchRenderer())return setTimeout(init,45);
  patchFigureModeTag();
}
window.V4010BBTAutoDetect={version:VERSION,build:BUILD,isTkzTabSource,parseLegacyTikzTable,detect,renderDetected,patchRenderer,regression,auditBank};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,30),{once:true});
else setTimeout(init,30);
})();
