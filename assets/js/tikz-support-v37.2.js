/* ==========================================================
   Math12 Hub V37.2 — TikZ Figure Support
   - Keeps original TikZ source for round-trip LaTeX export.
   - Native SVG renderer for common THPT Cartesian TikZ figures.
   - TikZJax 1.6.0 fallback for more complex TikZ when online.
   - Captures generated SVG into question.figureSvg when available.
   ========================================================== */
(function(){
'use strict';
const V='37.3.4';
const TIKZJAX_VERSION='1.6.0';
const TIKZJAX_BASE=`https://cdn.jsdelivr.net/npm/@rod2ik/tikzjax@${TIKZJAX_VERSION}/dist/`;
const svgCache=new Map();
const renderMetaCache=new Map();
const TIKZ_CACHE_DB='math12hub-tikz-cache-v372';
let tikzDbPromise=null;
function tikzDb(){
  if(!('indexedDB' in window))return Promise.resolve(null);
  if(tikzDbPromise)return tikzDbPromise;
  tikzDbPromise=new Promise(resolve=>{try{const req=indexedDB.open(TIKZ_CACHE_DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('svg'))db.createObjectStore('svg',{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)}catch(_){resolve(null)}});return tikzDbPromise;
}
async function idbPutSvg(key,svg,meta={}){if(!svg||svg.length>1500000)return false;const db=await tikzDb();if(!db)return false;return new Promise(resolve=>{try{const tx=db.transaction('svg','readwrite');tx.objectStore('svg').put({key,svg,meta,updatedAt:new Date().toISOString()});tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false)}catch(_){resolve(false)}})}
async function idbGetSvg(key){const db=await tikzDb();if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction('svg','readonly'),r=tx.objectStore('svg').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)}catch(_){resolve(null)}})}

function h32(s=''){
  let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0');
}
function keyFor(tex=''){return 'tikz-'+h32(normalize(tex))}
function normalize(tex=''){
  let s=String(tex||'').trim();
  const doc=s.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);if(doc)s=doc[1].trim();
  const m=s.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/);if(m)s=m[0].trim();
  return s;
}
function escXml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function sanitizeSvg(svg=''){
  const raw=String(svg||'').trim();if(!/^<svg\b/i.test(raw))return '';
  try{const doc=new DOMParser().parseFromString(raw,'image/svg+xml'),root=doc.documentElement;if(!root||root.nodeName.toLowerCase()!=='svg'||doc.querySelector('parsererror'))return '';
    doc.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video').forEach(n=>n.remove());
    doc.querySelectorAll('*').forEach(el=>{[...el.attributes].forEach(a=>{const n=a.name.toLowerCase(),v=a.value.trim();if(n.startsWith('on')||((n==='href'||n.endsWith(':href'))&&/^javascript:/i.test(v))||n==='srcdoc')el.removeAttribute(a.name)})});
    return new XMLSerializer().serializeToString(root)
  }catch(_){return ''}
}
function cleanLabel(s=''){
  return String(s||'').trim().replace(/^\$|\$$/g,'').replace(/\\,/g,' ').replace(/\\;/g,' ').replace(/\\!/g,'')
   .replace(/\\infty/g,'∞').replace(/\\leq/g,'≤').replace(/\\geq/g,'≥').replace(/\\cdot/g,'·').replace(/\\times/g,'×')
   .replace(/\\text\{([^{}]*)\}/g,'$1').replace(/[{}]/g,'').trim();
}
function parseOpts(raw=''){
  const out={};String(raw||'').split(',').map(x=>x.trim()).filter(Boolean).forEach(p=>{const i=p.indexOf('=');if(i<0)out[p]=true;else out[p.slice(0,i).trim()]=p.slice(i+1).trim()});return out;
}
function coordMatches(s=''){
  const out=[];const re=/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;let m;while((m=re.exec(s)))out.push({x:Number(m[1]),y:Number(m[2]),index:m.index,end:re.lastIndex});return out;
}
function rewritePowers(expr=''){
  let s=String(expr||''),guard=0;
  // Convert TeX-style a^b to Math.pow(a,b) before JavaScript evaluation.
  // This also fixes mathematically common forms such as -(x)^3 and -x^3,
  // which are syntax errors when naively rewritten as -(x)**3 / -x**3.
  while(s.includes('^')&&guard++<40){
    const i=s.indexOf('^');
    let l=i-1;while(l>=0&&/\s/.test(s[l]))l--;
    if(l<0)return null;
    let bs=l;
    if(s[l]===')'){
      let depth=1;l--;
      while(l>=0&&depth){if(s[l]===')')depth++;else if(s[l]==='(')depth--;l--}
      if(depth)return null;bs=l+1;
    }else{
      while(bs>0&&/[A-Za-z0-9_.]/.test(s[bs-1]))bs--;
    }
    let r=i+1;while(r<s.length&&/\s/.test(s[r]))r++;
    if(r>=s.length)return null;
    let es=r,ee=r;
    if(s[ee]==='+'||s[ee]==='-')ee++;
    if(s[ee]==='('){
      let depth=1;ee++;
      while(ee<s.length&&depth){if(s[ee]==='(')depth++;else if(s[ee]===')')depth--;ee++}
      if(depth)return null;
    }else{
      const start=ee;while(ee<s.length&&/[A-Za-z0-9_.]/.test(s[ee]))ee++;
      if(ee===start)return null;
    }
    const base=s.slice(bs,i).trim(),exp=s.slice(es,ee).trim();
    if(!base||!exp)return null;
    s=s.slice(0,bs)+`Math.pow(${base},${exp})`+s.slice(ee);
  }
  return s.includes('^')?null:s;
}
function safeExpr(raw=''){
  let s=String(raw||'').replace(/\\x/g,'x').replace(/[−–]/g,'-').trim();
  if(/\\[A-Za-z]+/.test(s))return null;
  const names={sqrt:'Math.sqrt',abs:'Math.abs',exp:'Math.exp',ln:'Math.log'};
  Object.entries(names).forEach(([a,b])=>{s=s.replace(new RegExp(`\\b${a}\\s*\\(`,'gi'),b+'(')});
  s=s.replace(/\bpi\b/gi,'Math.PI');
  s=rewritePowers(s);if(!s)return null;
  if(!/^[0-9x+\-*/().,\sA-Za-z_]*$/.test(s))return null;
  if(/(?:constructor|prototype|window|document|global|this|eval|Function|fetch|XMLHttpRequest|localStorage|alert|prompt|confirm|location|navigator)/i.test(s))return null;
  const ids=s.match(/[A-Za-z_][A-Za-z0-9_]*/g)||[];
  const allowed=new Set(['x','Math','pow','sqrt','abs','exp','log','PI']);
  if(ids.some(id=>!allowed.has(id)))return null;
  try{const fn=new Function('x',`"use strict";return (${s});`);const v=fn(.137);return Number.isFinite(v)?fn:null}catch(_){return null}
}
function splitCommands(body=''){
  const out=[];let cur='',brace=0,bracket=0,paren=0,escd=false;
  for(let i=0;i<body.length;i++){
    const ch=body[i];cur+=ch;
    if(escd){escd=false;continue}if(ch==='\\'){escd=true;continue}
    if(ch==='{')brace++;else if(ch==='}')brace=Math.max(0,brace-1);else if(ch==='[')bracket++;else if(ch===']')bracket=Math.max(0,bracket-1);else if(ch==='(')paren++;else if(ch===')')paren=Math.max(0,paren-1);
    if(ch===';'&&brace===0&&bracket===0&&paren===0){out.push(cur.trim());cur=''}
  }
  if(cur.trim())out.push(cur.trim());return out;
}
function parseNode(cmd=''){
  const m=cmd.match(/^\\node(?:\[([^\]]*)\])?\s+at\s+\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*\{([\s\S]*)\}\s*;?$/);
  if(!m)return null;return {kind:'node',opts:parseOpts(m[1]),x:Number(m[2]),y:Number(m[3]),label:cleanLabel(m[4])};
}
function parseFill(cmd=''){
  if(!/^\\fill\b/.test(cmd))return null;const circles=[];const re=/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*circle\s*\(\s*(-?\d+(?:\.\d+)?)\s*(pt|cm|mm)?\s*\)/g;let m;while((m=re.exec(cmd)))circles.push({x:Number(m[1]),y:Number(m[2]),r:Number(m[3]),unit:m[4]||'pt'});return circles.length?{kind:'fill',circles}:null;
}
function parseDraw(cmd=''){
  const h=cmd.match(/^\\draw(?:\[([^\]]*)\])?\s*([\s\S]*?);?$/);if(!h)return null;
  const opts=parseOpts(h[1]),src=h[2];
  const plot=src.match(/plot\s*\(\s*\\x\s*,\s*\{([\s\S]*?)\}\s*\)/);
  if(plot){
    const fn=safeExpr(plot[1]);if(!fn)return {kind:'unsupported',reason:'Biểu thức plot chưa hỗ trợ an toàn.'};
    const dm=String(h[1]||'').match(/domain\s*=\s*(-?\d+(?:\.\d+)?)\s*:\s*(-?\d+(?:\.\d+)?)/),sm=String(h[1]||'').match(/samples\s*=\s*(\d+)/);
    const a=dm?Number(dm[1]):-5,b=dm?Number(dm[2]):5,n=Math.max(20,Math.min(600,sm?Number(sm[1]):160)),pts=[];
    for(let i=0;i<n;i++){const x=a+(b-a)*i/(n-1);let y;try{y=fn(x)}catch(_){continue}if(Number.isFinite(y)&&Math.abs(y)<1e6)pts.push({x,y})}
    return pts.length>1?{kind:'plot',opts,pts}:{kind:'unsupported',reason:'Không lấy được điểm plot.'};
  }
  const pts=coordMatches(src).map(({x,y})=>({x,y}));if(pts.length<2)return {kind:'unsupported',reason:'Đường vẽ không phải chuỗi tọa độ số.'};
  const nm=src.match(/node(?:\[([^\]]*)\])?\s*\{([\s\S]*?)\}\s*$/);
  return {kind:'path',opts,pts,node:nm?{opts:parseOpts(nm[1]),label:cleanLabel(nm[2]),x:pts[pts.length-1].x,y:pts[pts.length-1].y}:null};
}
function parseTikz(tex=''){
  const s=normalize(tex),m=s.match(/\\begin\{tikzpicture\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{tikzpicture\}/);if(!m)return {ok:false,reason:'Không tìm thấy môi trường tikzpicture.'};
  const topOpts=parseOpts(m[1]),cleanBody=m[2].replace(/(^|[^\\])%.*$/gm,'$1'),commands=splitCommands(cleanBody),items=[],unsupported=[];
  for(const raw of commands){const cmd=raw.trim();if(!cmd||cmd.startsWith('%'))continue;let x=parseNode(cmd)||parseFill(cmd)||parseDraw(cmd);if(x){if(x.kind==='unsupported')unsupported.push(x.reason);else items.push(x)}else if(/^\\(?:clip|path|coordinate|foreach|tkz|pgf|addplot|filldraw|shade|matrix|graph|pic)\b/.test(cmd))unsupported.push(cmd.slice(0,45));else unsupported.push(cmd.slice(0,45));}
  return {ok:items.length>0,topOpts,items,unsupported,source:s,reason:items.length?'':'Chưa nhận diện được lệnh TikZ.'};
}
function nativeSvg(tex=''){
  const p=parseTikz(tex);if(!p.ok)return {ok:false,reason:p.reason,unsupported:p.unsupported||[]};
  // Native mode is deliberately strict: if unknown structural commands exist, use TikZJax instead.
  if(p.unsupported.length)return {ok:false,reason:'Có lệnh TikZ ngoài bộ dựng SVG nhanh.',unsupported:p.unsupported};
  const pts=[];p.items.forEach(it=>{if(it.pts)pts.push(...it.pts);if(it.x!=null)pts.push({x:it.x,y:it.y});if(it.circles)pts.push(...it.circles)});if(!pts.length)return {ok:false,reason:'Không có tọa độ để dựng hình.'};
  let minX=Math.min(...pts.map(x=>x.x)),maxX=Math.max(...pts.map(x=>x.x)),minY=Math.min(...pts.map(x=>x.y)),maxY=Math.max(...pts.map(x=>x.y));
  if(minX===maxX){minX-=1;maxX+=1}if(minY===maxY){minY-=1;maxY+=1}
  const rx=maxX-minX,ry=maxY-minY;minX-=Math.max(.25,rx*.08);maxX+=Math.max(.25,rx*.08);minY-=Math.max(.25,ry*.08);maxY+=Math.max(.25,ry*.08);
  const W=620,M=34,innerW=W-2*M,aspect=(maxY-minY)/(maxX-minX),H=Math.max(240,Math.min(520,Math.round(innerW*aspect+2*M))),innerH=H-2*M;
  const X=x=>M+(x-minX)/(maxX-minX)*innerW,Y=y=>M+(maxY-y)/(maxY-minY)*innerH;
  const scaleX=innerW/(maxX-minX),scaleY=innerH/(maxY-minY),strokeBase=1.7;
  let body=[],defs=`<defs><marker id="v372arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker><marker id="v372arrstart" markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M8,0 L0,4 L8,8 z" fill="currentColor"/></marker></defs>`;
  function style(opts={}){let sw=opts.thick?2.35:opts['very thick']?3:strokeBase,dash=opts.dashed?'stroke-dasharray="7 6"':'',end=opts['->']||opts['<->']?'marker-end="url(#v372arr)"':'',start=opts['<-']||opts['<->']?'marker-start="url(#v372arrstart)"':'';return `fill="none" stroke="currentColor" stroke-width="${sw}" ${dash} ${start} ${end} stroke-linecap="round" stroke-linejoin="round"`}
  function label(n){if(!n||!n.label)return '';const o=n.opts||{},words=Object.keys(o).join(' ');let dx=0,dy=0,anchor='middle';if(o.left||/\bleft\b/.test(words)){dx=-8;anchor='end'}if(o.right||/\bright\b/.test(words)){dx=8;anchor='start'}if(o.above||/\babove\b/.test(words))dy=-9;if(o.below||/\bbelow\b/.test(words))dy=15;return `<text x="${X(n.x)+dx}" y="${Y(n.y)+dy}" text-anchor="${anchor}" class="v372-label">${escXml(n.label)}</text>`}
  p.items.forEach(it=>{
    if(it.kind==='path'){body.push(`<polyline points="${it.pts.map(q=>`${X(q.x).toFixed(2)},${Y(q.y).toFixed(2)}`).join(' ')}" ${style(it.opts)}/>`);if(it.node)body.push(label(it.node))}
    else if(it.kind==='plot'){let d='';let prev=null;it.pts.forEach(q=>{const px=X(q.x),py=Y(q.y);if(!Number.isFinite(px)||!Number.isFinite(py))return;const jump=prev&&Math.abs(py-prev.py)>innerH*.75;d+=(d===''||jump?'M':'L')+px.toFixed(2)+' '+py.toFixed(2)+' ';prev={px,py}});body.push(`<path d="${d}" ${style(it.opts)}/>`)}
    else if(it.kind==='node')body.push(label(it));
    else if(it.kind==='fill')it.circles.forEach(c=>{let r=c.unit==='cm'?c.r*28.35:c.unit==='mm'?c.r*2.835:c.r*1.15;r=Math.max(1.5,Math.min(12,r));body.push(`<circle cx="${X(c.x)}" cy="${Y(c.y)}" r="${r}" fill="currentColor"/>`)})
  });
  const svg=`<svg class="v372-native-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hình TikZ" style="color:#111">${defs}<style>.v372-label{font:18px 'Times New Roman',Cambria,serif;fill:currentColor}</style>${body.join('')}</svg>`;
  return {ok:true,svg,width:W,height:H,engine:'native-svg',unsupported:[]};
}
function cachedSvg(tex=''){const k=keyFor(tex);return svgCache.get(k)||''}
function cacheSvg(tex,svg,meta={}){svg=sanitizeSvg(svg);if(!svg)return false;const k=keyFor(tex),m={engine:meta.engine||'tikzjax',at:new Date().toISOString()};svgCache.set(k,svg);renderMetaCache.set(k,m);idbPutSvg(k,svg,m).catch(()=>{});return true}
function loadCachedSvg(tex=''){const k=keyFor(tex);return svgCache.get(k)||''}
function replaceBoxWithSvg(box,svg,label='SVG đã lưu'){
  if(!box||!svg)return;const frame=box.querySelector('iframe');if(frame){const w=document.createElement('div');w.className='v372-svg-wrap';w.innerHTML=svg;frame.replaceWith(w)}const st=box.querySelector('.v372-tikz-status');if(st){st.className='v372-tikz-status ok';st.innerHTML=`<span>${label}</span><small>cache IndexedDB</small>`}
}
async function hydrateBoxFromIdb(box){if(!box||box.dataset.v372Hydrating==='1'||!box.querySelector('iframe'))return;box.dataset.v372Hydrating='1';const key=box.dataset.v372Key;if(!key)return;const hit=await idbGetSvg(key);if(hit?.svg){const safe=sanitizeSvg(hit.svg);if(safe){svgCache.set(key,safe);renderMetaCache.set(key,hit.meta||{});replaceBoxWithSvg(box,safe,'SVG cache ✓')}}}
function scanTikzBoxes(root=document){const boxes=[];if(root?.matches?.('.v372-tikz[data-v372-key]'))boxes.push(root);root?.querySelectorAll?.('.v372-tikz[data-v372-key]').forEach(x=>boxes.push(x));boxes.forEach(hydrateBoxFromIdb)}
const v372Observer=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)scanTikzBoxes(n)})));v372Observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>scanTikzBoxes(document),0);
function tikzJaxSrcdoc(tex=''){
  const source=normalize(tex).replace(/<\/script/gi,'<\\/script'),key=keyFor(source),safeKey=key.replace(/[^a-z0-9_-]/gi,'');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${TIKZJAX_BASE}fonts.min.css"><style>html,body{margin:0;background:#fff;color:#111}body{padding:10px;display:flex;align-items:center;justify-content:center;min-height:180px;overflow:auto}.status{position:absolute;left:8px;bottom:5px;font:10px system-ui;color:#8290a5;background:rgba(255,255,255,.88);padding:3px 6px;border-radius:6px}svg{max-width:100%;height:auto}</style></head><body><script src="${TIKZJAX_BASE}tikzjax.min.js" defer><\/script><script id="src" type="text/tikz">${source}<\/script><div id="st" class="status">Đang dựng TikZ…</div><script>(function(){const K='${safeKey}',st=document.getElementById('st');let n=0;const send=()=>{const svg=document.querySelector('svg:not(.loader)');if(svg){st.textContent='TikZJax ✓';try{parent.postMessage({type:'math12-v372-tikz-svg',key:K,svg:svg.outerHTML},'*')}catch(e){}return true}return false};const obs=new MutationObserver(()=>{if(send())obs.disconnect()});obs.observe(document.body,{childList:true,subtree:true});const t=setInterval(()=>{n++;if(send()||n>60){clearInterval(t);if(n>60)st.textContent='Không dựng được — xem mã TikZ'}},250)})();<\/script></body></html>`;
}
function statusHtml(engine,extra=''){const cls=engine==='native-svg'?'ok':engine==='cached-svg'?'ok':engine==='tikzjax'?'wait':'warn';const name=engine==='native-svg'?'SVG nhanh V37.3.4':engine==='cached-svg'?'SVG đã lưu':engine==='tikzjax'?'TikZJax dự phòng':'Chưa dựng';return `<div class="v372-tikz-status ${cls}"><span>${name}</span>${extra?`<small>${extra}</small>`:''}</div>`}
function figureHtml(item={},compact=false){
  const mode=item.figureMode||((item.figureLatex||'').trim()?'tikz':'none');
  if(!['tikz','tkz'].includes(mode))return null;
  const tex=normalize(item.figureLatex||'');if(!tex)return '';
  const caption=item.figureCaption?`<div class="latex-figure-caption">${typeof mathHTML==='function'?mathHTML(item.figureCaption):escXml(item.figureCaption)}</div>`:'';
  let svg=sanitizeSvg(item.figureSvg||'');if(item.figureSourceHash&&item.figureSourceHash!==keyFor(tex))svg='';if(svg&&!/^<svg\b/i.test(svg))svg='';
  if(svg){cacheSvg(tex,svg,{engine:item.figureRenderEngine||'stored-svg'});return `<div class="latex-figure ${compact?'compact':''} v372-tikz" data-v372-key="${keyFor(tex)}">${statusHtml('cached-svg')}<div class="v372-svg-wrap">${svg}</div>${caption}<details class="latex-figure-code"><summary>Mã TikZ gốc</summary><pre>${typeof esc==='function'?esc(tex):escXml(tex)}</pre></details></div>`}
  svg=loadCachedSvg(tex);if(svg)return `<div class="latex-figure ${compact?'compact':''} v372-tikz" data-v372-key="${keyFor(tex)}">${statusHtml('cached-svg','cache trình duyệt')}<div class="v372-svg-wrap">${svg}</div>${caption}<details class="latex-figure-code"><summary>Mã TikZ gốc</summary><pre>${typeof esc==='function'?esc(tex):escXml(tex)}</pre></details></div>`;
  const fast=nativeSvg(tex);if(fast.ok){cacheSvg(tex,fast.svg,{engine:'native-svg'});return `<div class="latex-figure ${compact?'compact':''} v372-tikz" data-v372-key="${keyFor(tex)}">${statusHtml('native-svg')}<div class="v372-svg-wrap">${fast.svg}</div>${caption}<details class="latex-figure-code"><summary>Mã TikZ gốc</summary><pre>${typeof esc==='function'?esc(tex):escXml(tex)}</pre></details></div>`}
  const reason=(fast.unsupported||[]).length?`Có ${fast.unsupported.length} lệnh cần TeX đầy đủ`:fast.reason||'';
  return `<div class="latex-figure ${compact?'compact':''} v372-tikz" data-v372-key="${keyFor(tex)}">${statusHtml('tikzjax',reason)}<iframe class="latex-figure-frame ${compact?'compact':''} v372-tikz-frame" loading="lazy" sandbox="allow-scripts" srcdoc="${typeof attrEsc==='function'?attrEsc(tikzJaxSrcdoc(tex)):escXml(tikzJaxSrcdoc(tex))}"></iframe>${caption}<details class="latex-figure-code"><summary>Mã TikZ gốc</summary><pre>${typeof esc==='function'?esc(tex):escXml(tex)}</pre></details></div>`;
}

function previewEditorStatus(){
  const box=document.getElementById('qeFigureHint'),mode=document.getElementById('qeFigureMode')?.value,tex=document.getElementById('qeFigureLatex')?.value||extractFromQuestion();if(!box||!['tikz','tkz'].includes(mode)||!tex)return;
  const r=nativeSvg(tex);box.innerHTML=`<b>TikZ V37.2:</b> ${r.ok?'hình này được dựng SVG trực tiếp, dùng được cả khi mất mạng.':'sẽ dùng TikZJax cho các lệnh nâng cao khi có mạng.'} <span class="v372-inline-state ${r.ok?'ok':'wait'}">${r.ok?'SVG nhanh ✓':'TikZJax fallback'}</span>`;
}
function extractFromQuestion(){try{return (typeof extractTikzFromText==='function'?extractTikzFromText(document.getElementById('qeQuestion')?.value||''):{figure:''}).figure||''}catch(_){return ''}}
function svgForTex(tex=''){
  const fast=nativeSvg(tex);if(fast.ok){cacheSvg(tex,fast.svg,{engine:'native-svg'});return {svg:fast.svg,engine:'native-svg'}}
  const c=loadCachedSvg(tex);return c?{svg:c,engine:renderMetaCache.get(keyFor(tex))?.engine||'cached-svg'}:{svg:'',engine:'tikzjax-pending'};
}
function enrichItem(item){if(!item||!['tikz','tkz'].includes(item.figureMode)||!item.figureLatex)return item;const got=svgForTex(item.figureLatex);item.figureRenderEngine=got.engine;item.figureRenderVersion=V;item.figureSourceHash=keyFor(item.figureLatex);return item}

// Receive SVG produced by the full TikZJax fallback and swap it into currently visible figures.
window.addEventListener('message',e=>{
  const d=e?.data;if(!d||d.type!=='math12-v372-tikz-svg'||!d.key||!d.svg)return;
  const boxes=[...document.querySelectorAll(`.v372-tikz[data-v372-key="${CSS.escape(d.key)}"]`)];
  if(!boxes.some(box=>box.querySelector('iframe')?.contentWindow===e.source))return;
  const safe=sanitizeSvg(d.svg);if(!safe)return;
  const key=d.key,meta={engine:'tikzjax',at:new Date().toISOString()};svgCache.set(key,safe);renderMetaCache.set(key,meta);idbPutSvg(key,safe,meta).catch(()=>{});
  boxes.forEach(box=>replaceBoxWithSvg(box,safe,'SVG TikZJax ✓'));
});

// Override only TikZ/tkz presentation. Existing graph2d/Oxyz/tkz-tab renderer remains untouched.
if(typeof window.questionFigureHTML==='function'){
  const baseFigure=window.questionFigureHTML;
  window.questionFigureHTML=function(item={},compact=false){const x=figureHtml(item,compact);return x===null?baseFigure(item,compact):x};
}

// Extend editor without replacing mature V29/V36 validation and version-history logic.
if(typeof window.openQuestionEditor==='function'){
  const baseOpen=window.openQuestionEditor;
  window.openQuestionEditor=function(id=''){baseOpen(id);setTimeout(()=>{const bar=document.querySelector('#qeFigureWrap .figure-toolbar');if(bar&&!document.getElementById('v372TikzTestBtn')){const b=document.createElement('button');b.type='button';b.className='btn btn-soft';b.id='v372TikzTestBtn';b.textContent='▶ Kiểm tra TikZ';b.onclick=()=>{updateQuestionEditorPreview?.();previewEditorStatus()};bar.appendChild(b)}previewEditorStatus();const ta=document.getElementById('qeFigureLatex');ta?.addEventListener('input',previewEditorStatus);document.getElementById('qeFigureMode')?.addEventListener('change',previewEditorStatus);const qt=document.getElementById('qeQuestion');qt?.addEventListener('input',()=>{const fig=extractFromQuestion(),mode=document.getElementById('qeFigureMode'),fb=document.getElementById('qeFigureLatex');if(fig&&mode&&fb){if(mode.value==='none')mode.value='tikz';if(!fb.value.trim())fb.value=fig;toggleQuestionFigureFields?.();previewEditorStatus();updateQuestionEditorPreview?.()}})},0)};
}
if(typeof window.saveQuestionEditor==='function'){
  const baseSave=window.saveQuestionEditor;
  window.saveQuestionEditor=function(editId=''){
    const embedded=extractFromQuestion(),modeEl=document.getElementById('qeFigureMode'),figEl=document.getElementById('qeFigureLatex');if(embedded&&modeEl&&figEl&&modeEl.value==='none'){modeEl.value='tikz';figEl.value=figEl.value.trim()||embedded;toggleQuestionFigureFields?.()}
    const typed=(document.getElementById('qeId')?.value||'').trim().replace(/[^A-Za-z0-9._-]/g,'-'),mode=modeEl?.value||'none',raw=figEl?.value.trim()||embedded,before=(state.questionBank||[]).map(q=>q.id);
    const got=(raw&&['tikz','tkz'].includes(mode))?svgForTex(raw):{svg:'',engine:''};
    const rev=Number(state._meta?.revision)||0;baseSave(editId);if((Number(state._meta?.revision)||0)<=rev)return;
    let q=null;if(typed)q=(state.questionBank||[]).find(x=>x.id===typed);if(!q&&editId)q=(state.questionBank||[]).find(x=>x.id===editId);if(!q)q=(state.questionBank||[]).find(x=>!before.includes(x.id))||(state.questionBank||[])[0];
    if(q&&q.figureLatex&&['tikz','tkz'].includes(q.figureMode)){q.figureRenderEngine=got.engine||q.figureRenderEngine||'tikzjax-pending';q.figureRenderVersion=V;q.figureSourceHash=keyFor(q.figureLatex);save({reason:'v37.2-tikz-svg-cache'});renderQuestionBank?.(true)}
  };
}

// Bulk-import: enrich parsed questions before commit, preserving figureLatex as the source of truth.
if(typeof window.parseBulkLatexSource==='function'){
  const baseParse=window.parseBulkLatexSource;
  window.parseBulkLatexSource=function(source,defaults){const out=baseParse(source,defaults);const rows=Array.isArray(out)?out:(out?.items||out?.rows||[]);rows.forEach(r=>{if(r?.item)enrichItem(r.item)});return out};
}
if(typeof window.commitBulkLatexImport==='function'){
  const baseCommit=window.commitBulkLatexImport;
  window.commitBulkLatexImport=function(){try{(window.bulkLatexParsed||[]).forEach(r=>r?.item&&enrichItem(r.item))}catch(_){}return baseCommit()};
}

function auditBank(){
  if(typeof requireTeacher==='function'&&!requireTeacher('Kiểm tra hình TikZ'))return;
  const rows=(state.questionBank||[]).filter(q=>q.figureLatex&&['tikz','tkz'].includes(q.figureMode||'tikz'));let native=0,cached=0,fallback=0,missing=0;
  rows.forEach(q=>{const r=nativeSvg(q.figureLatex);if(r.ok)native++;else if(q.figureSvg||loadCachedSvg(q.figureLatex))cached++;else fallback++;if(!normalize(q.figureLatex))missing++});
  const body=`<div class="v372-audit-grid"><div><b>${rows.length}</b><small>Câu có TikZ</small></div><div><b>${native}</b><small>Dựng SVG nhanh</small></div><div><b>${cached}</b><small>Đã có SVG cache</small></div><div><b>${fallback}</b><small>Cần TikZJax</small></div></div><div class="math-help mt"><b>V37.3.4:</b> mã TikZ gốc luôn được giữ để xuất LaTeX. Hình đơn giản kiểu trục tọa độ, đường thẳng, đường gấp khúc, điểm và <code>plot(\\x,{...})</code> được dựng SVG ngay trên máy. Hình nâng cao dùng TikZJax khi có mạng và sẽ cache SVG sau khi dựng thành công.</div>${missing?`<div class="bulk-errors fatal mt">${missing} câu có metadata hình nhưng không có mã TikZ hợp lệ.</div>`:''}`;
  openModal('TikZ Figure Support V37.3.4','Kiểm tra khả năng hiển thị hình trong ngân hàng',body,`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)
}
window.v372OpenTikzAudit=auditBank;
window.V372Tikz={version:V,normalize,keyFor,parseTikz,nativeSvg,svgForTex,enrichItem,auditBank};

// Small production-test hook.
window.v372TikzRegression=function(){
  const samples=[
String.raw`\begin{tikzpicture}[scale=0.8, >=stealth]
\draw[->] (-2.2,0) -- (2.2,0) node[below]{$x$};
\draw[->] (0,-4.5) -- (0,1) node[right]{$y$};
\node[below left] at (0,0) {$O$};
\draw[dashed] (1,0) -- (1,-4) -- (0,-4);
\draw[smooth, samples=100, domain=-2.1:1.75, thick] plot(\x, {(\x)^3 - 3*(\x) - 2});
\node[above] at (-1,0) {$-1$};
\node[above] at (1,0) {$1$};
\node[left] at (0,-2) {$-2$};
\node[left] at (0,-4) {$-4$};
\fill (-1,0) circle (1.5pt) (1,-4) circle (1.5pt);
\end{tikzpicture}`,
String.raw`\begin{tikzpicture}[scale=0.8, >=stealth]
\draw[->] (-2.2,0) -- (2.2,0) node[below]{$x$};
\draw[->] (0,-2.7) -- (0,2.7) node[right]{$y$};
\node[below left] at (0,0) {$O$};
\draw[dashed] (-1,0) -- (-1,-2) -- (0,-2);
\draw[dashed] (1,0) -- (1,2) -- (0,2);
\draw[smooth, samples=100, domain=-1.9:1.9, thick] plot(\x, {-(\x)^3 + 3*(\x)});
\node[above left] at (-1,0) {$-1$};
\node[below right] at (1,0) {$1$};
\node[left] at (0,2) {$2$};
\node[right] at (0,-2) {$-2$};
\fill (-1,-2) circle (1.5pt) (1,2) circle (1.5pt);
\end{tikzpicture}`
  ];
  const results=samples.map(sample=>{const r=nativeSvg(sample);return {ok:!!r.ok&&/polyline|path/.test(r.svg||'')&&/circle/.test(r.svg||''),engine:r.engine||'',bytes:(r.svg||'').length,key:keyFor(sample),unsupported:r.unsupported||[]}});
  return {ok:results.every(x=>x.ok),cases:results};
};})();
