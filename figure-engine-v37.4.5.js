/* ==========================================================
   Math12 Hub V37.4.5 — Hybrid LaTeX Figure Engine
   - Stored SVG first (highest fidelity / LaTeX-compiled output).
   - Smart native SVG for common THPT TikZ Cartesian figures.
   - Existing TikZJax renderer remains the fallback for advanced TikZ.
   - Smart axis-based viewport prevents asymptote plots from stretching canvas.
   - Responsive, tight-crop post-processing for stored SVG.
   - Native support for legacy 2-row tkz-tab (x, f(x)).
   - No question schema migration and no Firestore collection changes.
   - V37.7.1 hotfix retries Smart SVG before stale TikZJax metadata fallback.
   ========================================================== */
(function(){
'use strict';
const V='37.4.5';
const BUILD='37.4.5-hybrid-latex-figure-engine';
const TIKZ_MODES=new Set(['tikz','tkz']);
const renderedStats={stored:0,smart:0,fallback:0,tkz2:0};

function escHtml(s=''){
  if(typeof window.esc==='function')return window.esc(String(s));
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function attr(s=''){
  if(typeof window.attrEsc==='function')return window.attrEsc(String(s));
  return escHtml(s).replace(/`/g,'&#96;');
}
function normalize(tex=''){
  if(window.V372Tikz?.normalize)return window.V372Tikz.normalize(tex);
  let s=String(tex||'').trim();
  const doc=s.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);if(doc)s=doc[1].trim();
  const tikz=s.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/);if(tikz)s=tikz[0].trim();
  return s;
}
function keyFor(tex=''){
  if(window.V372Tikz?.keyFor)return window.V372Tikz.keyFor(tex);
  let h=2166136261>>>0,s=normalize(tex);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return 'tikz-'+(h>>>0).toString(16).padStart(8,'0');
}
function parseNumber(v,def){const n=Number(v);return Number.isFinite(n)?n:def}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function displaySpec(item={},kind=''){
  const d=(item.figureDisplay&&typeof item.figureDisplay==='object')?item.figureDisplay:{};
  const isGraph=kind==='graph-oxy';
  return {
    maxWidth:clamp(parseNumber(d.maxWidth,isGraph?520:680),260,980),
    maxHeight:clamp(parseNumber(d.maxHeight,isGraph?390:480),180,720),
    align:['left','right','center'].includes(d.align)?d.align:'center',
    scale:clamp(parseNumber(d.scale,1),.55,1.8),
    crop:d.crop==='none'?'none':'tight'
  };
}
function sanitizeStoredSvg(raw=''){
  raw=String(raw||'').trim();if(!/^<svg\b/i.test(raw)||typeof DOMParser!=='function')return '';
  try{
    const doc=new DOMParser().parseFromString(raw,'image/svg+xml'),root=doc.documentElement;
    if(!root||root.nodeName.toLowerCase()!=='svg'||doc.querySelector('parsererror'))return '';
    doc.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video').forEach(n=>n.remove());
    doc.querySelectorAll('*').forEach(el=>[...el.attributes].forEach(a=>{
      const n=a.name.toLowerCase(),v=String(a.value||'').trim();
      if(n.startsWith('on')||n==='srcdoc'||((n==='href'||n.endsWith(':href'))&&/^javascript:/i.test(v)))el.removeAttribute(a.name);
    }));
    let vb=root.getAttribute('viewBox');
    if(!vb){
      const w=parseFloat(root.getAttribute('width')||''),h=parseFloat(root.getAttribute('height')||'');
      if(Number.isFinite(w)&&w>0&&Number.isFinite(h)&&h>0)root.setAttribute('viewBox',`0 0 ${w} ${h}`);
    }
    root.removeAttribute('width');root.removeAttribute('height');
    root.setAttribute('preserveAspectRatio','xMidYMid meet');
    root.classList.add('v3745-svg','v3745-stored-svg');
    root.setAttribute('data-v3745-auto-crop','1');
    root.setAttribute('role','img');
    if(!root.getAttribute('aria-label'))root.setAttribute('aria-label','Hình LaTeX');
    return new XMLSerializer().serializeToString(root);
  }catch(_){return ''}
}
function detectKind(tex='',parsed=null){
  const s=String(tex||'');
  if(/\\draw\s*\[[^\]]*(?:->|<->)[^\]]*\][^;]*\([^,]+,\s*0\)[^;]*--[^;]*\([^,]+,\s*0\)/.test(s)&&
     /\\draw\s*\[[^\]]*(?:->|<->)[^\]]*\][^;]*\(\s*0\s*,[^)]+\)[^;]*--[^;]*\(\s*0\s*,[^)]+\)/.test(s)&&/\bplot\s*\(/.test(s))return 'graph-oxy';
  const p=parsed;if(p?.items?.some(x=>x.kind==='plot')&&p.items.some(x=>x.kind==='path'&&isHorizontal(x))&&p.items.some(x=>x.kind==='path'&&isVertical(x)))return 'graph-oxy';
  return 'tikz';
}
function words(opts={}){return Object.keys(opts||{}).join(' ').toLowerCase()}
function isHorizontal(it){if(it?.kind!=='path'||!it.pts?.length)return false;const ys=it.pts.map(p=>p.y);return Math.max(...ys)-Math.min(...ys)<1e-7}
function isVertical(it){if(it?.kind!=='path'||!it.pts?.length)return false;const xs=it.pts.map(p=>p.x);return Math.max(...xs)-Math.min(...xs)<1e-7}
function isArrowPath(it){const w=words(it?.opts);return w.includes('->')||w.includes('<->')||w.includes('<-')}
function longest(items=[]){return items.sort((a,b)=>{
  const span=x=>x?.pts?.length?Math.hypot((x.pts.at(-1).x-x.pts[0].x),(x.pts.at(-1).y-x.pts[0].y)):0;return span(b)-span(a);
})[0]||null}
function allPoints(parsed={}){
  const out=[];(parsed.items||[]).forEach(it=>{if(it.pts)out.push(...it.pts);if(it.x!=null&&it.y!=null)out.push({x:it.x,y:it.y});if(it.circles)out.push(...it.circles)});return out.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
}
function percentile(a=[],q=.5){if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y),i=(b.length-1)*q,l=Math.floor(i),r=Math.ceil(i);return l===r?b[l]:b[l]+(b[r]-b[l])*(i-l)}
function smartBounds(parsed={}){
  const paths=(parsed.items||[]).filter(x=>x.kind==='path');
  const hx=longest(paths.filter(x=>isHorizontal(x)&&isArrowPath(x))),vy=longest(paths.filter(x=>isVertical(x)&&isArrowPath(x)));
  if(hx&&vy){
    const xs=hx.pts.map(p=>p.x),ys=vy.pts.map(p=>p.y);
    let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    if(maxX-minX>.1&&maxY-minY>.1)return {minX,maxX,minY,maxY,source:'axes'};
  }
  const pts=allPoints(parsed);if(!pts.length)return null;
  let xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  // Robust quantiles prevent isolated near-asymptote samples from defining the whole canvas.
  let minX=percentile(xs,.01),maxX=percentile(xs,.99),minY=percentile(ys,.02),maxY=percentile(ys,.98);
  if(!(maxX>minX)){minX=Math.min(...xs)-1;maxX=Math.max(...xs)+1}
  if(!(maxY>minY)){minY=Math.min(...ys)-1;maxY=Math.max(...ys)+1}
  const rx=maxX-minX,ry=maxY-minY;
  return {minX:minX-rx*.06,maxX:maxX+rx*.06,minY:minY-ry*.06,maxY:maxY+ry*.06,source:'robust'};
}
function texScale(parsed={}){
  const raw=parsed?.topOpts?.scale;const n=Number(raw);return Number.isFinite(n)?clamp(n,.45,1.6):1;
}
function escapeXml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function prettyLabel(s=''){
  let x=String(s||'').trim();
  x=x.replace(/\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,'$1/$2')
     .replace(/\\sqrt\s*\{([^{}]+)\}/g,'√$1').replace(/\\infty/g,'∞').replace(/\\pi/g,'π')
     .replace(/\\leq?/g,'≤').replace(/\\geq?/g,'≥').replace(/\\neq/g,'≠').replace(/\\cdot/g,'·')
     .replace(/\\,/g,' ').replace(/\\;/g,' ').replace(/\\!/g,'').replace(/\{([^{}]*)\}/g,'$1');
  return x;
}
function smartNativeSvg(tex=''){
  if(!window.V372Tikz?.parseTikz)return {ok:false,reason:'Thiếu bộ đọc TikZ nền.'};
  const parsed=window.V372Tikz.parseTikz(tex);if(!parsed?.ok)return {ok:false,reason:parsed?.reason||'Không đọc được TikZ.'};
  if(parsed.unsupported?.length)return {ok:false,reason:'TikZ nâng cao cần TeX đầy đủ.',unsupported:parsed.unsupported};
  const b=smartBounds(parsed);if(!b)return {ok:false,reason:'Không xác định được vùng hình.'};
  const rx=b.maxX-b.minX,ry=b.maxY-b.minY;if(!(rx>0&&ry>0))return {ok:false,reason:'Vùng hình không hợp lệ.'};
  const kind=detectKind(tex,parsed),M=28,basePpu=50*texScale(parsed),maxW=kind==='graph-oxy'?560:650,maxH=kind==='graph-oxy'?430:500;
  let ppu=Math.min(basePpu,(maxW-2*M)/rx,(maxH-2*M)/ry);ppu=clamp(ppu,28,72);
  const W=Math.round(rx*ppu+2*M),H=Math.round(ry*ppu+2*M);
  const X=x=>M+(x-b.minX)*ppu,Y=y=>M+(b.maxY-y)*ppu;
  const vis=(p,extra=.03)=>p.x>=b.minX-rx*extra&&p.x<=b.maxX+rx*extra&&p.y>=b.minY-ry*extra&&p.y<=b.maxY+ry*extra;
  const clipId='v3745clip'+keyFor(tex).replace(/[^a-z0-9]/gi,'').slice(-10),arrId='v3745arr'+keyFor(tex).replace(/[^a-z0-9]/gi,'').slice(-10);
  const defs=`<defs><clipPath id="${clipId}"><rect x="${M}" y="${M}" width="${Math.max(1,W-2*M)}" height="${Math.max(1,H-2*M)}"/></clipPath><marker id="${arrId}" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7 z" fill="currentColor"/></marker><marker id="${arrId}s" markerWidth="7" markerHeight="7" refX=".8" refY="3.5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M7,0 L0,3.5 L7,7 z" fill="currentColor"/></marker></defs>`;
  function style(opts={},plot=false){const w=words(opts);let sw=w.includes('very thick')?2.5:w.includes('thick')?2.05:w.includes('thin')?1.05:1.35;const dash=w.includes('dashed')?'stroke-dasharray="5 4"':'',end=w.includes('->')||w.includes('<->')?`marker-end="url(#${arrId})"`:'',start=w.includes('<-')||w.includes('<->')?`marker-start="url(#${arrId}s)"`:'';return `fill="none" stroke="currentColor" stroke-width="${sw}" ${dash} ${start} ${end} stroke-linecap="round" stroke-linejoin="round" ${plot?`clip-path="url(#${clipId})"`:''}`}
  function label(n){if(!n||!n.label)return '';const w=words(n.opts),lab=prettyLabel(n.label);let dx=0,dy=5,anchor='middle';if(w.includes('left')){dx=-7;anchor='end'}if(w.includes('right')){dx=7;anchor='start'}if(w.includes('above'))dy=-8;if(w.includes('below'))dy=15;if(w.includes('above')&&w.includes('right')){dx=7;anchor='start'}if(w.includes('above')&&w.includes('left')){dx=-7;anchor='end'}if(w.includes('below')&&w.includes('right')){dx=7;anchor='start'}if(w.includes('below')&&w.includes('left')){dx=-7;anchor='end'}return `<text x="${(X(n.x)+dx).toFixed(2)}" y="${(Y(n.y)+dy).toFixed(2)}" text-anchor="${anchor}" class="v3745-label">${escapeXml(lab)}</text>`}
  const body=[];
  (parsed.items||[]).forEach(it=>{
    if(it.kind==='path'){
      const pts=(it.pts||[]).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));if(pts.length>=2)body.push(`<polyline points="${pts.map(q=>`${X(q.x).toFixed(2)},${Y(q.y).toFixed(2)}`).join(' ')}" ${style(it.opts,false)}/>`);if(it.node)body.push(label(it.node));
    }else if(it.kind==='plot'){
      let d='',started=false,prev=null;
      (it.pts||[]).forEach(q=>{if(!vis(q,.015)){started=false;prev=null;return}const px=X(q.x),py=Y(q.y);const jump=prev&&Math.hypot(px-prev.x,py-prev.y)>Math.max(W,H)*.48;if(!started||jump){d+=`M${px.toFixed(2)} ${py.toFixed(2)} `;started=true}else d+=`L${px.toFixed(2)} ${py.toFixed(2)} `;prev={x:px,y:py}});
      if(d)body.push(`<path d="${d}" ${style(it.opts,true)}/>`);
    }else if(it.kind==='node')body.push(label(it));
    else if(it.kind==='fill'){
      (it.circles||[]).forEach(c=>{if(!vis(c,.03))return;let r=c.unit==='cm'?c.r*28.35:c.unit==='mm'?c.r*2.835:c.r*1.1;r=clamp(r,1.3,9);body.push(`<circle cx="${X(c.x).toFixed(2)}" cy="${Y(c.y).toFixed(2)}" r="${r.toFixed(2)}" fill="currentColor"/>`)})
    }
  });
  if(!body.length)return {ok:false,reason:'Không có phần tử SVG để hiển thị.'};
  const svg=`<svg class="v3745-svg v3745-smart-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hình TikZ" style="color:#111">${defs}<style>.v3745-label{font:17px 'Times New Roman',Cambria,serif;font-style:italic;fill:currentColor}</style>${body.join('')}</svg>`;
  return {ok:true,svg,width:W,height:H,kind,bounds:b,engine:'smart-native-svg'};
}
function sourceDetails(tex='',label='Mã TikZ gốc'){return `<details class="latex-figure-code"><summary>${escHtml(label)}</summary><pre>${escHtml(tex)}</pre></details>`}
function engineBadge(label,detail=''){return `<div class="v3745-engine"><span>${escHtml(label)}</span>${detail?`<small>${escHtml(detail)}</small>`:''}</div>`}
function figureWrap(item={},svg='',engine='',kind='tikz',compact=false){
  const d=displaySpec(item,kind),cap=item.figureCaption?`<div class="latex-figure-caption">${typeof mathHTML==='function'?mathHTML(item.figureCaption):escHtml(item.figureCaption)}</div>`:'',align=`v3745-align-${d.align}`;
  const vars=`--v3745-max-w:${Math.round(d.maxWidth*d.scale)}px;--v3745-max-h:${Math.round(d.maxHeight*d.scale)}px`;
  const name=engine==='stored-svg'?'LaTeX SVG':engine==='smart-native-svg'?'Smart SVG':'SVG';
  return `<div class="latex-figure ${compact?'compact':''} v3745-figure ${align}" data-v3745-engine="${attr(engine)}" data-v3745-kind="${attr(kind)}" data-v3745-crop="${attr(d.crop)}" style="${vars}">${engineBadge(name,engine==='stored-svg'?'ưu tiên bản đã biên dịch':'viewport theo trục tọa độ')}<div class="v3745-stage">${svg}</div>${cap}${sourceDetails(normalize(item.figureLatex||''))}</div>`;
}
function renderTikz(item={},compact=false){
  const mode=item.figureMode||((item.figureLatex||'').trim()?'tikz':'none');if(!TIKZ_MODES.has(mode))return null;
  const tex=normalize(item.figureLatex||'');if(!tex)return '';
  const kind=item.figureKind||detectKind(tex);
  let stored=sanitizeStoredSvg(item.figureSvg||'');
  if(stored&&item.figureSourceHash&&item.figureSourceHash!==keyFor(tex))stored='';
  if(stored){renderedStats.stored++;return figureWrap(item,stored,'stored-svg',kind,compact)}
  // V37.7.1: always retry the strict Smart SVG parser first. Older imported questions may
  // carry `tikzjax-pending` only because a previous parser rejected harmless scope/clip or
  // compact `node[...]at(...)` syntax. If Smart SVG now succeeds, prefer it automatically.
  const native=smartNativeSvg(tex);if(native.ok){renderedStats.smart++;return figureWrap(item,native.svg,'smart-native-svg',native.kind||kind,compact)}
  // Preserve the full-TeX route only when the current strict parser still cannot render it.
  if(/tikzjax|cached/i.test(String(item.figureRenderEngine||''))){renderedStats.fallback++;return null}
  renderedStats.fallback++;return null;
}
function twoRowTkzTab(tex=''){
  if(typeof window.parseTkzTabFigure!=='function')return null;const d=window.parseTkzTabFigure(tex);if(!d?.ok||d.rows?.length!==2||!(d.vars||[]).length)return null;
  const n=Math.max(2,d.xsRaw?.length||d.xs?.length||2),nodeX=Array.from({length:n},(_,i)=>7+86*(i/(n-1))),Ymode=m=>String(m||'').includes('+')?20:String(m||'').includes('-')?80:50;
  const mathCell=s=>{const raw=String(s||'').trim().replace(/^\$|\$$/g,'');return raw&&typeof mathHTML==='function'?mathHTML(`$${raw}$`):escHtml(raw)};
  const nodes=[];for(let i=0;i<n;i++){const v=d.vars?.[i]||{};if(v.discontinuity)nodes.push({kind:'break',left:{x:nodeX[i]-3.3,y:Ymode(v.leftMode),raw:v.leftRaw},right:{x:nodeX[i]+3.3,y:Ymode(v.rightMode),raw:v.rightRaw}});else nodes.push({kind:'normal',pt:{x:nodeX[i],y:Ymode(v.mode),raw:v.rawValue}})}
  const start=x=>x?.kind==='break'?x.right:x?.pt,end=x=>x?.kind==='break'?x.left:x?.pt,segments=[];
  for(let i=0;i<n-1;i++){const a=start(nodes[i]),b=end(nodes[i+1]);if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;segments.push(`<line x1="${a.x+ux*5.5}" y1="${a.y+uy*5.5}" x2="${b.x-ux*6}" y2="${b.y-uy*6}" class="v3745-var-line" marker-end="url(#v3745vararr)"/>`)}
  const xNodes=nodeX.map((x,i)=>`<span class="tkztab-node" style="left:${x}%">${mathCell(d.xsRaw?.[i]||d.xs?.[i]||'')}</span>`).join('');
  let yMarks='';nodes.forEach((node,i)=>{if(node.kind==='break'){yMarks+=`<span class="tkztab-break" style="left:${nodeX[i]}%"></span>`;if(node.left.raw)yMarks+=`<span class="tkztab-value" style="left:${node.left.x}%;top:${node.left.y}%">${mathCell(node.left.raw)}</span>`;if(node.right.raw)yMarks+=`<span class="tkztab-value" style="left:${node.right.x}%;top:${node.right.y}%">${mathCell(node.right.raw)}</span>`}else if(node.pt?.raw)yMarks+=`<span class="tkztab-value" style="left:${node.pt.x}%;top:${node.pt.y}%">${mathCell(node.pt.raw)}</span>`});
  renderedStats.tkz2++;
  return `<div class="tkztab-scroll v3745-tkztab2-scroll"><div class="tkztab-native v3745-tkztab2 math-rich"><div class="tkztab-row tkztab-x"><div class="tkztab-label">${mathCell(d.rows?.[0]||'$x$')}</div><div class="tkztab-data">${xNodes}</div></div><div class="tkztab-row tkztab-y"><div class="tkztab-label">${mathCell(d.rows?.[1]||'$f(x)$')}</div><div class="tkztab-data"><svg class="tkztab-arrows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="v3745vararr" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill="#111"/></marker></defs>${segments.join('')}</svg>${yMarks}</div></div></div></div>`;
}
function installTkzTwoRow(){
  if(typeof window.tkzTabNativeHTML!=='function')return;const base=window.tkzTabNativeHTML;
  window.tkzTabNativeHTML=function(tex=''){const two=twoRowTkzTab(tex);return two||base(tex)};
}
function tightenSvg(svg){
  if(!svg||svg.dataset.v3745Cropped==='1'||svg.closest('[data-v3745-crop="none"]'))return;
  svg.dataset.v3745Cropped='1';
  try{
    const old=svg.viewBox?.baseVal;if(!old||!(old.width>0&&old.height>0))return;
    const bb=svg.getBBox?.();if(!bb||!(bb.width>0&&bb.height>0))return;
    // Ignore suspicious boxes that are dramatically larger than the declared page.
    if(bb.width>old.width*4||bb.height>old.height*4)return;
    const pad=Math.max(3,Math.min(14,Math.max(bb.width,bb.height)*.035)),x=bb.x-pad,y=bb.y-pad,w=bb.width+2*pad,h=bb.height+2*pad;
    if(w>0&&h>0)svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);
  }catch(_){/* SVG getBBox can fail while detached; keep original viewBox. */}
}
let cropRAF=0;function scheduleCrop(root=document){cancelAnimationFrame?.(cropRAF);cropRAF=requestAnimationFrame(()=>requestAnimationFrame(()=>{const list=[];if(root?.matches?.('.v3745-stored-svg'))list.push(root);root?.querySelectorAll?.('.v3745-stored-svg').forEach(x=>list.push(x));list.forEach(tightenSvg)}))}
function installCropWatcher(){
  scheduleCrop(document);if(typeof MutationObserver==='function'){const mo=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)scheduleCrop(n)})));mo.observe(document.documentElement,{childList:true,subtree:true});window.__v3745FigureObserver=mo}
  window.addEventListener('resize',()=>scheduleCrop(document),{passive:true});window.addEventListener('beforeprint',()=>scheduleCrop(document));
}
function installQuestionRenderer(){
  if(typeof window.questionFigureHTML!=='function')return;const base=window.questionFigureHTML;
  window.questionFigureHTML=function(item={},compact=false){const r=renderTikz(item,compact);return r===null?base(item,compact):r};
}
function findSavedQuestion(editId='',typed='',before=[]){
  const rows=(window.state?.questionBank||[]);if(typed){const q=rows.find(x=>x.id===typed);if(q)return q}if(editId){const q=rows.find(x=>x.id===editId);if(q)return q}return rows.find(x=>!before.includes(x.id))||null;
}
function installEditorMetadata(){
  if(typeof window.saveQuestionEditor!=='function')return;const base=window.saveQuestionEditor;
  window.saveQuestionEditor=function(editId=''){
    const before=(window.state?.questionBank||[]).map(q=>q.id),typed=(document.getElementById('qeId')?.value||'').trim().replace(/[^A-Za-z0-9._-]/g,'-');
    const out=base(editId),q=findSavedQuestion(editId,typed,before);if(!q||!TIKZ_MODES.has(q.figureMode)||!q.figureLatex)return out;
    const r=smartNativeSvg(q.figureLatex),kind=q.figureKind||detectKind(q.figureLatex,r.ok?null:undefined);q.figureKind=kind;q.figureDisplay=q.figureDisplay||{maxWidth:kind==='graph-oxy'?520:680,maxHeight:kind==='graph-oxy'?390:480,align:'center',scale:1,crop:'tight'};
    if(q.figureSvg&&sanitizeStoredSvg(q.figureSvg)){q.figureRenderEngine='stored-svg';q.figureRenderVersion=V}
    else if(r.ok){q.figureRenderEngine='smart-native-svg';q.figureRenderVersion=V}
    q.figureSourceHash=keyFor(q.figureLatex);try{window.save?.({reason:'v37.4.5-figure-metadata'})}catch(_){}return out;
  };
}
function regression(){
  const src=String.raw`\begin{tikzpicture}[scale=.88,>=stealth]
\draw[->](-3.2,0)--(3.2,0) node[below]{$x$};\draw[->](0,-2.8)--(0,2.8) node[right]{$y$};\node[above right] at (0,0){$O$};
\draw[dashed](-1,-2.8)--(-1,2.8);\draw[dashed](-3,-1)--(3,-1);\node[below] at (-1,0){$-1$};\node[left] at (0,-1){$-1$};
\draw[thick,smooth,samples=100,domain=-3:-1.12] plot(\x,{-\x/(\x+1)});
\draw[thick,smooth,samples=100,domain=-.88:3] plot(\x,{-\x/(\x+1)});
\end{tikzpicture}`;
  const r=smartNativeSvg(src),axisOk=r.ok&&r.kind==='graph-oxy'&&r.bounds?.source==='axes',ratioOk=r.ok&&r.width<500&&r.height<420,clipOk=r.ok&&String(r.svg).includes('clip-path=');
  return {ok:!!(axisOk&&ratioOk&&clipOk),version:V,build:BUILD,axisBounds:axisOk,compactCanvas:ratioOk,plotClipping:clipOk,width:r.width||0,height:r.height||0,engine:r.engine||'fallback'};
}
function audit(){
  if(typeof requireTeacher==='function'&&!requireTeacher('Kiểm tra hình V37.4.5'))return;
  const rows=(window.state?.questionBank||[]).filter(q=>q.figureLatex&&q.figureMode!=='none'),counts={stored:0,smart:0,fallback:0,tkztab:0,tkz2:0};
  rows.forEach(q=>{if(q.figureMode==='tkztab'){counts.tkztab++;try{const d=window.parseTkzTabFigure?.(q.figureLatex);if(d?.rows?.length===2)counts.tkz2++}catch(_){}return}if(!TIKZ_MODES.has(q.figureMode))return;const tex=normalize(q.figureLatex);let stored=sanitizeStoredSvg(q.figureSvg||'');if(stored&&(!q.figureSourceHash||q.figureSourceHash===keyFor(tex)))counts.stored++;else if(smartNativeSvg(tex).ok)counts.smart++;else counts.fallback++});
  const rr=regression(),body=`<div class="v3745-audit-grid"><div><b>${rows.length}</b><small>Hình trong ngân hàng</small></div><div><b>${counts.stored}</b><small>LaTeX SVG ưu tiên</small></div><div><b>${counts.smart}</b><small>Smart SVG</small></div><div><b>${counts.fallback}</b><small>TikZJax fallback</small></div><div><b>${counts.tkztab}</b><small>Bảng biến thiên</small></div><div><b>${counts.tkz2}</b><small>BBT 2 dòng</small></div></div><div class="math-help mt"><b>Hybrid Figure Engine V37.4.5:</b> ưu tiên SVG đã biên dịch, sau đó dùng Smart SVG với viewport lấy từ trục tọa độ; TikZ nâng cao mới chuyển sang TikZJax. Plot gần tiệm cận được clip trong vùng trục nên không kéo dẹt hình.</div><div class="notice mt"><b>${rr.ok?'✓ Regression đạt':'⚠ Regression cần kiểm tra'}:</b> canvas ${rr.width}×${rr.height}px • axis bounds ${rr.axisBounds?'đạt':'chưa đạt'} • clipping ${rr.plotClipping?'đạt':'chưa đạt'}.</div>`;
  window.openModal?.('Figure Engine • V37.4.5','LaTeX SVG → Smart SVG → TikZJax fallback',body,`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`);
}
function installProductionCheck(){
  if(typeof window.v35RunRegressionChecks!=='function')return;const base=window.v35RunRegressionChecks;
  window.v35RunRegressionChecks=function(opts={}){const res=base(opts);try{const rr=regression(),exists=res?.checks?.some(x=>x.name==='Hybrid Figure Engine V37.4.5');if(res?.checks&&!exists){res.checks.push({name:'Hybrid Figure Engine V37.4.5',ok:rr.ok,detail:rr.ok?`Stored SVG first • Smart viewport ${rr.width}×${rr.height} • TikZ fallback`:'Figure regression chưa đạt',level:rr.ok?'pass':'fail'});res.pass=res.checks.filter(x=>x.level==='pass').length;res.warn=res.checks.filter(x=>x.level==='warn').length;res.fail=res.checks.filter(x=>x.level==='fail').length;if(opts.render!==false)window.v35RenderProductionCenter?.()}}catch(_){}return res};
}
function init(){installTkzTwoRow();installQuestionRenderer();installEditorMetadata();installCropWatcher();installProductionCheck();}
window.v3745OpenFigureAudit=audit;
window.V3745FigureEngine={version:V,build:BUILD,normalize,keyFor,sanitizeStoredSvg,detectKind,smartNativeSvg,twoRowTkzTab,regression,audit,stats:()=>({...renderedStats})};
init();
})();
