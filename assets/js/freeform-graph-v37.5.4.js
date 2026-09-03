/* Math12 Hub  — Native Freeform Graph Renderer
   - Stored SVG remains highest priority via .
   - Native SVG for freeform TikZ graphs before TikZJax fallback.
   - Supports cubic Bezier `.. controls ... and ... ..`, mixed line/curve paths,
     common \foreach expansions, fill circles, labels, dashed/thick/arrows,
     and tikzpicture scale/x/y unit options.
   - Additive presentation layer: does not modify math content, answers, ID6,
     reviewStatus or human figure verification. */
(function(){
'use strict';
const V='37.5.4', BUILD='37.5.4-native-freeform-graph-renderer';
let installed=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=s=>esc(s).replace(/`/g,'&#96;');
const norm=s=>String(s||'').replace(/\r\n?/g,'\n').trim();
function normalize(tex=''){return window.V3745FigureEngine?.normalize?.(tex)||window.V372Tikz?.normalize?.(tex)||norm(tex)}
function keyFor(tex=''){return window.V3745FigureEngine?.keyFor?.(tex)||window.V372Tikz?.keyFor?.(tex)||('v3754-'+hash32(normalize(tex)))}
function hash32(s=''){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function num(s){const n=Number(String(s).replace(/^\+/,''));return Number.isFinite(n)?n:null}
function cleanLabel(s=''){
  return String(s||'').trim().replace(/^\$|\$$/g,'').replace(/\\,/g,' ').replace(/\\;/g,' ').replace(/\\!/g,'')
    .replace(/\\infty/g,'∞').replace(/\\pi/g,'π').replace(/\\leq?/g,'≤').replace(/\\geq?/g,'≥').replace(/\\neq/g,'≠')
    .replace(/\\cdot/g,'·').replace(/\\times/g,'×').replace(/\\text\{([^{}]*)\}/g,'$1').replace(/\{([^{}]*)\}/g,'$1').trim();
}
function parseOpts(raw=''){
  const out={};splitTop(String(raw||''),',').map(x=>x.trim()).filter(Boolean).forEach(p=>{const i=p.indexOf('=');if(i<0)out[p]=true;else out[p.slice(0,i).trim()]=p.slice(i+1).trim()});return out;
}
function splitTop(s='',sep=','){
  const out=[];let cur='',brace=0,bracket=0,paren=0,escd=false;
  for(let i=0;i<s.length;i++){
    const ch=s[i];if(escd){cur+=ch;escd=false;continue}if(ch==='\\'){cur+=ch;escd=true;continue}
    if(ch==='{')brace++;else if(ch==='}')brace=Math.max(0,brace-1);else if(ch==='[')bracket++;else if(ch===']')bracket=Math.max(0,bracket-1);else if(ch==='(')paren++;else if(ch===')')paren=Math.max(0,paren-1);
    if(ch===sep&&brace===0&&bracket===0&&paren===0){out.push(cur);cur=''}else cur+=ch;
  }
  if(cur.length||s.length)out.push(cur);return out;
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
function readBalanced(s,start,open='{',close='}'){
  if(s[start]!==open)return null;let depth=0,escd=false;
  for(let i=start;i<s.length;i++){
    const ch=s[i];if(escd){escd=false;continue}if(ch==='\\'){escd=true;continue}if(ch===open)depth++;else if(ch===close){depth--;if(depth===0)return {inner:s.slice(start+1,i),end:i+1}}
  }return null;
}
function findCommandEnd(s,start){let brace=0,bracket=0,paren=0,escd=false;for(let i=start;i<s.length;i++){const ch=s[i];if(escd){escd=false;continue}if(ch==='\\'){escd=true;continue}if(ch==='{')brace++;else if(ch==='}')brace=Math.max(0,brace-1);else if(ch==='[')bracket++;else if(ch===']')bracket=Math.max(0,bracket-1);else if(ch==='(')paren++;else if(ch===')')paren=Math.max(0,paren-1);else if(ch===';'&&brace===0&&bracket===0&&paren===0)return i+1}return s.length}
function splitSlashTop(s=''){const out=[];let cur='',brace=0,paren=0,escd=false;for(let i=0;i<s.length;i++){const ch=s[i];if(escd){cur+=ch;escd=false;continue}if(ch==='\\'){cur+=ch;escd=true;continue}if(ch==='{')brace++;else if(ch==='}')brace=Math.max(0,brace-1);else if(ch==='(')paren++;else if(ch===')')paren=Math.max(0,paren-1);if(ch==='/'&&brace===0&&paren===0){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out}
function expandForeach(body=''){
  let s=String(body||''),out='',pos=0,guard=0;
  while(guard++<80){const idx=s.indexOf('\\foreach',pos);if(idx<0){out+=s.slice(pos);break}out+=s.slice(pos,idx);let i=idx+'\\foreach'.length;while(/\s/.test(s[i]||''))i++;
    const varsStart=i;while(i<s.length&&!/\s/.test(s[i]))i++;const varsSpec=s.slice(varsStart,i).trim();while(/\s/.test(s[i]||''))i++;
    if(s.slice(i,i+2)!=='in'){out+=s.slice(idx,i);pos=i;continue}i+=2;while(/\s/.test(s[i]||''))i++;const list=readBalanced(s,i,'{','}');if(!list){out+=s.slice(idx,i);pos=i;continue}i=list.end;while(/\s/.test(s[i]||''))i++;const end=findCommandEnd(s,i),cmd=s.slice(i,end),vars=varsSpec.split('/').map(v=>v.trim()).filter(Boolean),entries=splitTop(list.inner,',').map(x=>x.trim()).filter(Boolean);let exp='';
    for(const entry of entries){const vals=splitSlashTop(entry);let c=cmd;vars.forEach((v,k)=>{const re=new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![A-Za-z])','g');c=c.replace(re,vals[k]??'')});exp+=c+'\n'}out+=exp;pos=end;
  }
  return out;
}
const NUM='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
const coordRe=new RegExp('\\(\\s*('+NUM+')\\s*,\\s*('+NUM+')\\s*\\)','y');
function readCoord(s,pos){coordRe.lastIndex=pos;const m=coordRe.exec(s);if(!m||m.index!==pos)return null;return {x:Number(m[1]),y:Number(m[2]),end:coordRe.lastIndex,raw:m[0]}}
function skipWs(s,i){while(/\s/.test(s[i]||''))i++;return i}
function parseNodeTail(src=''){
  const m=src.match(/\s+node(?:\[([^\]]*)\])?\s*\{([\s\S]*?)\}\s*$/);if(!m)return {src,node:null};return {src:src.slice(0,m.index),node:{opts:parseOpts(m[1]),label:cleanLabel(m[2])}};
}
function parsePath(src=''){
  const tail=parseNodeTail(src),s=tail.src.trim();let i=skipWs(s,0),p=readCoord(s,i);if(!p)return null;let current={x:p.x,y:p.y},segments=[],all=[{...current}],unsupported=[];i=p.end;
  while(i<s.length){i=skipWs(s,i);if(i>=s.length)break;
    if(s.slice(i,i+2)==='--'){i=skipWs(s,i+2);const q=readCoord(s,i);if(!q){unsupported.push(s.slice(i,i+30));break}segments.push({type:'line',from:{...current},to:{x:q.x,y:q.y}});current={x:q.x,y:q.y};all.push({...current});i=q.end;continue}
    if(s.slice(i,i+2)==='..'){
      let j=skipWs(s,i+2);if(s.slice(j,j+8)!=='controls'){unsupported.push(s.slice(i,i+40));break}j=skipWs(s,j+8);const c1=readCoord(s,j);if(!c1){unsupported.push('Bezier control 1');break}j=skipWs(s,c1.end);if(s.slice(j,j+3)!=='and'){unsupported.push('Bezier and');break}j=skipWs(s,j+3);const c2=readCoord(s,j);if(!c2){unsupported.push('Bezier control 2');break}j=skipWs(s,c2.end);if(s.slice(j,j+2)!=='..'){unsupported.push('Bezier terminator');break}j=skipWs(s,j+2);const q=readCoord(s,j);if(!q){unsupported.push('Bezier endpoint');break}segments.push({type:'cubic',from:{...current},c1:{x:c1.x,y:c1.y},c2:{x:c2.x,y:c2.y},to:{x:q.x,y:q.y}});current={x:q.x,y:q.y};all.push({x:c1.x,y:c1.y},{x:c2.x,y:c2.y},{...current});i=q.end;continue
    }
    // Ignore harmless closing tokens/spaces; otherwise record unsupported tail.
    if(/^[\s]*$/.test(s.slice(i)))break;unsupported.push(s.slice(i,i+45));break;
  }
  if(!segments.length)return null;const node=tail.node?{...tail.node,x:current.x,y:current.y}:null;return {segments,points:all,node,unsupported};
}
function parseNode(cmd=''){
  const m=cmd.match(new RegExp('^\\\\node(?:\\[([^\\]]*)\\])?\\s+at\\s+\\(\\s*('+NUM+')\\s*,\\s*('+NUM+')\\s*\\)\\s*\\{([\\s\\S]*)\\}\\s*;?$'));if(!m)return null;return {kind:'node',opts:parseOpts(m[1]),x:Number(m[2]),y:Number(m[3]),label:cleanLabel(m[4])};
}
function parseFill(cmd=''){
  if(!/^\\fill\b/.test(cmd))return null;const h=cmd.match(/^\\fill(?:\[([^\]]*)\])?\s*([\s\S]*?);?$/),src=h?.[2]||'',circles=[];const re=new RegExp('\\(\\s*('+NUM+')\\s*,\\s*('+NUM+')\\s*\\)\\s*circle\\s*\\(\\s*('+NUM+')\\s*(pt|cm|mm)?\\s*\\)','g');let m;while((m=re.exec(src)))circles.push({x:Number(m[1]),y:Number(m[2]),r:Math.abs(Number(m[3])),unit:m[4]||'pt'});return circles.length?{kind:'fill',opts:parseOpts(h?.[1]),circles}:null;
}

function rewritePowers(expr=''){
  let s=String(expr||''),guard=0;
  while(s.includes('^')&&guard++<40){const i=s.indexOf('^');let l=i-1;while(l>=0&&/\s/.test(s[l]))l--;if(l<0)return null;let bs=l;if(s[l]===')'){let d=1;l--;while(l>=0&&d){if(s[l]===')')d++;else if(s[l]==='(')d--;l--}if(d)return null;bs=l+1}else{while(bs>0&&/[A-Za-z0-9_.]/.test(s[bs-1]))bs--}let r=i+1;while(r<s.length&&/\s/.test(s[r]))r++;if(r>=s.length)return null;let es=r,ee=r;if(s[ee]==='+'||s[ee]==='-')ee++;if(s[ee]==='('){let d=1;ee++;while(ee<s.length&&d){if(s[ee]==='(')d++;else if(s[ee]===')')d--;ee++}if(d)return null}else{const st=ee;while(ee<s.length&&/[A-Za-z0-9_.]/.test(s[ee]))ee++;if(ee===st)return null}const base=s.slice(bs,i).trim(),exp=s.slice(es,ee).trim();if(!base||!exp)return null;s=s.slice(0,bs)+`Math.pow(${base},${exp})`+s.slice(ee)}return s.includes('^')?null:s;
}
function safeExpr(raw=''){
  let s=String(raw||'').replace(/\\x/g,'x').replace(/[−–]/g,'-').trim();if(/\\[A-Za-z]+/.test(s))return null;const names={sqrt:'Math.sqrt',abs:'Math.abs',exp:'Math.exp',ln:'Math.log'};Object.entries(names).forEach(([a,b])=>{s=s.replace(new RegExp(`\\b${a}\\s*\\(`,'gi'),b+'(')});s=s.replace(/\bpi\b/gi,'Math.PI');s=rewritePowers(s);if(!s||!/^[0-9x+\-*/().,\sA-Za-z_]*$/.test(s))return null;if(/(?:constructor|prototype|window|document|global|this|eval|Function|fetch|XMLHttpRequest|localStorage|alert|prompt|confirm|location|navigator)/i.test(s))return null;const ids=s.match(/[A-Za-z_][A-Za-z0-9_]*/g)||[],allow=new Set(['x','Math','pow','sqrt','abs','exp','log','PI']);if(ids.some(id=>!allow.has(id)))return null;try{const fn=new Function('x',`"use strict";return (${s});`),v=fn(.137);return Number.isFinite(v)?fn:null}catch(_){return null}
}
function parsePlotDraw(cmd=''){
  const h=cmd.match(/^\\draw(?:\[([^\]]*)\])?\s*([\s\S]*?);?$/);if(!h)return null;const opts=parseOpts(h[1]),src=h[2],pm=src.match(/plot\s*\(\s*\\x\s*,\s*\{([\s\S]*?)\}\s*\)/);if(!pm)return null;const fn=safeExpr(pm[1]);if(!fn)return {kind:'unsupported',reason:'Biểu thức plot chưa hỗ trợ an toàn.'};const raw=String(h[1]||''),dm=raw.match(new RegExp('domain\\s*=\\s*('+NUM+')\\s*:\\s*('+NUM+')')),sm=raw.match(/samples\s*=\s*(\d+)/);let a=-5,b=5;if(dm){a=Number(dm[1]);b=Number(dm[2])}const n=Math.max(20,Math.min(600,sm?Number(sm[1]):160)),pts=[];for(let i=0;i<n;i++){const x=a+(b-a)*i/(n-1);let y;try{y=fn(x)}catch(_){continue}if(Number.isFinite(y)&&Math.abs(y)<1e6)pts.push({x,y})}return pts.length>1?{kind:'plot',opts,pts}:{kind:'unsupported',reason:'Không lấy được điểm plot.'};
}
function parseDraw(cmd=''){
  const h=cmd.match(/^\\draw(?:\[([^\]]*)\])?\s*([\s\S]*?);?$/);if(!h)return null;const opts=parseOpts(h[1]),src=h[2];if(/\bplot\s*\(/.test(src))return null;const path=parsePath(src);if(!path)return null;return {kind:'freepath',opts,...path};
}
function parseTikz(tex=''){
  const s=normalize(tex),m=s.match(/\\begin\{tikzpicture\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{tikzpicture\}/);if(!m)return {ok:false,reason:'Không tìm thấy môi trường tikzpicture.'};const topOpts=parseOpts(m[1]),body=expandForeach(m[2].replace(/(^|[^\\])%.*$/gm,'$1')),commands=splitCommands(body),items=[],unsupported=[];let freeform=false,foreach=/\\foreach/.test(m[2]),bezier=/\.\.\s*controls\b/.test(m[2]);
  for(const raw of commands){const cmd=raw.trim();if(!cmd)continue;let it=parseNode(cmd)||parseFill(cmd)||parseDraw(cmd);if(it){items.push(it);if(it.kind==='freepath')freeform=true;if(it.unsupported?.length)unsupported.push(...it.unsupported);continue}
    if(/^\\draw(?:\[[^\]]*\])?\s*[\s\S]*\bplot\s*\(/.test(cmd)){const plot=parsePlotDraw(cmd);if(plot&&plot.kind!=='unsupported'){items.push(plot);continue}if(plot?.reason)unsupported.push(plot.reason);continue}
    if(bezier||foreach)unsupported.push(cmd.slice(0,70));
  }
  return {ok:items.length>0,source:s,topOpts,items,unsupported,freeform,foreach,bezier,reason:items.length?'':'Không nhận diện được đồ thị vẽ tự do.'};
}
function unitFactor(v,def=1){const s=String(v??'').trim();if(!s)return def;const m=s.match(new RegExp('^('+NUM+')\\s*(cm|mm|pt)?$'));if(!m)return def;let n=Number(m[1]);const u=m[2]||'cm';if(u==='mm')n/=10;else if(u==='pt')n/=28.4527;return Number.isFinite(n)&&n>0?n:def}
function styleWords(o={}){return Object.keys(o||{}).join(' ').toLowerCase()}
function render(tex=''){
  const p=parseTikz(tex);if(!p.ok||(!p.freeform&&!p.foreach))return {ok:false,reason:p.reason||'Không phải đồ thị freeform .',unsupported:p.unsupported||[]};if(p.unsupported.length)return {ok:false,reason:'Còn lệnh TikZ chưa hỗ trợ native.',unsupported:p.unsupported};
  const pts=[];p.items.forEach(it=>{if(it.kind==='freepath')it.points?.forEach(q=>pts.push(q));if(it.kind==='plot')it.pts?.forEach(q=>pts.push(q));if(it.kind==='node')pts.push({x:it.x,y:it.y});if(it.kind==='fill')it.circles?.forEach(q=>pts.push(q))});if(!pts.length)return {ok:false,reason:'Không có tọa độ để dựng SVG.'};
  let minX=Math.min(...pts.map(q=>q.x)),maxX=Math.max(...pts.map(q=>q.x)),minY=Math.min(...pts.map(q=>q.y)),maxY=Math.max(...pts.map(q=>q.y));if(!(maxX>minX)){minX-=1;maxX+=1}if(!(maxY>minY)){minY-=1;maxY+=1}
  const scale=clamp(Number(p.topOpts.scale)||1,.25,2.5),xu=unitFactor(p.topOpts.x,1)*scale,yu=unitFactor(p.topOpts.y,1)*scale;const rx=maxX-minX,ry=maxY-minY,M=34;
  let base=50,W=rx*xu*base+2*M,H=ry*yu*base+2*M;const maxW=720,maxH=540,k=Math.min(1,(maxW-2*M)/Math.max(1,rx*xu*base),(maxH-2*M)/Math.max(1,ry*yu*base));base*=Math.max(.35,k);W=Math.round(rx*xu*base+2*M);H=Math.round(ry*yu*base+2*M);W=Math.max(260,W);H=Math.max(170,H);
  const X=x=>M+(x-minX)*xu*base,Y=y=>M+(maxY-y)*yu*base;const id=keyFor(tex).replace(/[^a-z0-9]/gi,'').slice(-12),arr='v3754arr'+id;
  const defs=`<defs><marker id="${arr}" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7 z" fill="currentColor"/></marker><marker id="${arr}s" markerWidth="7" markerHeight="7" refX=".8" refY="3.5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M7,0 L0,3.5 L7,7 z" fill="currentColor"/></marker></defs>`;
  function svgStyle(opts={}){const w=styleWords(opts),sw=w.includes('very thick')?2.6:w.includes('thick')?2.05:w.includes('thin')?1.05:1.35,dash=w.includes('dashed')?'stroke-dasharray="5 4"':'',end=w.includes('->')||w.includes('<->')?`marker-end="url(#${arr})"`:'',start=w.includes('<-')||w.includes('<->')?`marker-start="url(#${arr}s)"`:'';return `fill="none" stroke="currentColor" stroke-width="${sw}" ${dash} ${start} ${end} stroke-linecap="round" stroke-linejoin="round"`}
  function label(n){if(!n?.label)return '';const w=styleWords(n.opts),lab=cleanLabel(n.label);let dx=0,dy=5,anchor='middle';if(w.includes('left')){dx=-7;anchor='end'}if(w.includes('right')){dx=7;anchor='start'}if(w.includes('above'))dy=-8;if(w.includes('below'))dy=16;return `<text x="${(X(n.x)+dx).toFixed(2)}" y="${(Y(n.y)+dy).toFixed(2)}" text-anchor="${anchor}" class="v3754-label">${esc(lab)}</text>`}
  const body=[];for(const it of p.items){if(it.kind==='freepath'){let d='';for(const seg of it.segments){if(!d)d=`M${X(seg.from.x).toFixed(2)} ${Y(seg.from.y).toFixed(2)} `;if(seg.type==='line')d+=`L${X(seg.to.x).toFixed(2)} ${Y(seg.to.y).toFixed(2)} `;else d+=`C${X(seg.c1.x).toFixed(2)} ${Y(seg.c1.y).toFixed(2)} ${X(seg.c2.x).toFixed(2)} ${Y(seg.c2.y).toFixed(2)} ${X(seg.to.x).toFixed(2)} ${Y(seg.to.y).toFixed(2)} `}body.push(`<path d="${d}" ${svgStyle(it.opts)}/>`);if(it.node)body.push(label(it.node))}else if(it.kind==='plot'){let d='';for(const q of it.pts||[]){const px=X(q.x),py=Y(q.y);if(Number.isFinite(px)&&Number.isFinite(py))d+=(d?'L':'M')+px.toFixed(2)+' '+py.toFixed(2)+' '}if(d)body.push(`<path d="${d}" ${svgStyle(it.opts)}/>`)}else if(it.kind==='node')body.push(label(it));else if(it.kind==='fill'){for(const c of it.circles||[]){let r=c.unit==='cm'?c.r*28.45:c.unit==='mm'?c.r*2.845:c.r;r=clamp(r,1.25,10);body.push(`<circle cx="${X(c.x).toFixed(2)}" cy="${Y(c.y).toFixed(2)}" r="${r.toFixed(2)}" fill="currentColor"/>`)}}}
  if(!body.length)return {ok:false,reason:'Không tạo được phần tử SVG.'};const kind='graph-freeform';const svg=`<svg class="v3754-freeform-svg v3745-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Đồ thị TikZ freeform" style="color:#111">${defs}<style>.v3754-label{font:17px 'Times New Roman',Cambria,serif;font-style:italic;fill:currentColor}</style>${body.join('')}</svg>`;return {ok:true,svg,width:W,height:H,engine:'native-freeform-svg',kind,meta:{bezier:p.bezier,foreach:p.foreach,xUnit:xu,yUnit:yu,scale}};
}
function sourceDetails(tex=''){return `<details class="latex-figure-code"><summary>Mã TikZ gốc</summary><pre>${esc(tex)}</pre></details>`}
function wrap(item={},r={},compact=false){const d=item.figureDisplay&&typeof item.figureDisplay==='object'?item.figureDisplay:{},mw=clamp(Number(d.maxWidth)||650,320,980),mh=clamp(Number(d.maxHeight)||500,220,720),align=['left','right','center'].includes(d.align)?d.align:'center',cap=item.figureCaption?`<div class="latex-figure-caption">${typeof window.mathHTML==='function'?window.mathHTML(item.figureCaption):esc(item.figureCaption)}</div>`:'';return `<div class="latex-figure ${compact?'compact ':''}v3745-figure v3754-freeform ${align}" data-v3745-engine="native-freeform-svg" data-v3745-kind="graph-freeform" data-v3745-crop="tight" data-v3754-engine="native-freeform-svg" style="--v3745-max-w:${mw}px;--v3745-max-h:${mh}px"><div class="v3754-engine"><span>Native Freeform SVG</span><small>Bézier/foreach • offline</small></div><div class="v3745-stage">${r.svg}</div>${cap}${sourceDetails(normalize(item.figureLatex||''))}</div>`}
function storedFirst(item={},tex='',compact=false,mode='tikz'){try{return window.V3753UnifiedFigures?.storedFigure?.(item,tex,compact,mode)||''}catch(_){return ''}}
function patchRenderer(){if(installed||typeof window.questionFigureHTML!=='function')return false;const base=window.questionFigureHTML;const wrapped=function(item={},compact=false){const mode=item.figureMode||((item.figureLatex||'').trim()?'tikz':'none');if(!['tikz','tkz'].includes(mode))return base(item,compact);const tex=normalize(item.figureLatex||'');if(!tex)return '';const stored=storedFirst(item,tex,compact,mode);if(stored)return stored;if(!/\.\.\s*controls\b|\\foreach\b/.test(tex))return base(item,compact);const r=render(tex);return r.ok?wrap(item,r,compact):base(item,compact)};wrapped.__v3754=true;wrapped.__base=base;window.questionFigureHTML=wrapped;installed=true;return true}
function patchFigureQC(){const api=window.V3747FigureQC;if(!api?.qcQuestion||api.qcQuestion.__v3754)return;const old=api.qcQuestion;const w=function(q={},opts={}){const r=old(q,opts),mode=q.figureMode||((q.figureLatex||'').trim()?'tikz':'none'),tex=normalize(q.figureLatex||'');if(['tikz','tkz'].includes(mode)&&/\.\.\s*controls\b|\\foreach\b/.test(tex)&&!/stored-svg/i.test(String(r.renderEngine||''))){const n=render(tex);if(n.ok){r.renderEngine='native-freeform-svg';r.kind='graph-freeform';r.warnings=(r.warnings||[]).filter(x=>!/TikZJax|TikZ fallback/i.test(String(x)));r.checks=(r.checks||[]).filter(x=>x.name!=='TikZ fallback');r.checks.push({name:'Native Freeform SVG ',ok:true,detail:`Bézier/foreach dựng native ${n.width}×${n.height}px`,severity:'info'});r.pass=!(r.errors||[]).length}}return r};w.__v3754=true;w.__base=old;api.qcQuestion=w}
function patchEditor(){if(typeof window.openQuestionEditor!=='function'||window.openQuestionEditor.__v3754)return;const base=window.openQuestionEditor;const w=function(id=''){base(id);setTimeout(()=>{const bar=document.querySelector('#qeFigureWrap .figure-toolbar');if(bar&&!document.getElementById('v3754FreeformTestBtn')){const b=document.createElement('button');b.type='button';b.id='v3754FreeformTestBtn';b.className='btn btn-soft';b.textContent='〰 Kiểm tra Freeform';b.onclick=()=>{const tex=document.getElementById('qeFigureLatex')?.value||'';const r=render(tex);const hint=document.getElementById('qeFigureHint');if(hint)hint.innerHTML=r.ok?`<b>Freeform :</b> dựng Native SVG ✓ • ${r.meta?.bezier?'Bézier ':''}${r.meta?.foreach?'foreach ':''}`:`<b>Freeform :</b> ${esc(r.reason||'chưa hỗ trợ')}`;window.updateQuestionEditorPreview?.()};bar.appendChild(b)}},0)};w.__v3754=true;window.openQuestionEditor=w}
function regression(){
  const graph=String.raw`\begin{tikzpicture}[scale=.82,>=stealth,line cap=round,line join=round]
\draw[->](-1.8,0)--(3.7,0) node[below right]{$x$};
\draw[->](0,-4.7)--(0,2.8) node[above right]{$y$}; \node[above left] at (0,0){$O$};
\draw[dashed](-1,0)--(-1,2)--(0,2); \draw[dashed](1,0)--(1,-2)--(0,-2);
\draw[dashed](2,0)--(2,-4)--(0,-4); \draw[dashed](3,0)--(3,1)--(0,1);
\draw[thick] (-1,2) .. controls (-.88,-.3) and (-.42,-2.7) .. (0,-3)
             .. controls (.35,-3.05) and (.7,-2.3) .. (1,-2)
             -- (2,-4) -- (3,1);
\foreach \p in {(-1,2),(0,-3),(1,-2),(2,-4),(3,1)}\fill \p circle(1.25pt);
\node[below] at (-1,0){$-1$}; \node[above] at (1,0){$1$}; \node[above] at (2,0){$2$}; \node[below] at (3,0){$3$};
\node[right] at (0,2){$2$}; \node[left] at (0,1){$1$}; \node[left] at (0,-2){$-2$}; \node[left] at (0,-3){$-3$}; \node[left] at (0,-4){$-4$};
\end{tikzpicture}`;
  const sign=String.raw`\begin{tikzpicture}[x=1.55cm,y=.72cm,>=stealth]
\draw (-.6,0)--(5.1,0); \draw (-.6,-1)--(5.1,-1); \draw (0,.45)--(0,-1.45);
\node at (-.28,.22){$x$}; \node at (-.28,-.55){$f'(x)$};
\foreach \x/\t in {.65/$-\infty$,1.7/$-1$,2.7/$0$,3.7/$1$,4.75/$+\infty$} \node at (\x,.22){\t};
\draw (1.64,.05)--(1.64,-1.05); \draw (1.76,.05)--(1.76,-1.05);
\node at (1.05,-.55){$-$}; \node at (2.18,-.55){$-$}; \node at (2.7,-.55){$0$};
\node at (3.2,-.55){$+$}; \node at (3.7,-.55){$0$}; \node at (4.3,-.55){$-$};
\end{tikzpicture}`;
  const a=render(graph),b=render(sign);return {ok:a.ok&&b.ok&&/C[-0-9. ]+/.test(a.svg||'')&&(a.svg.match(/<circle/g)||[]).length===5&&Number(b.meta?.xUnit)>Number(b.meta?.yUnit),graph:{ok:a.ok,bytes:(a.svg||'').length,bezier:a.meta?.bezier,foreach:a.meta?.foreach,circles:(a.svg.match(/<circle/g)||[]).length},sign:{ok:b.ok,bytes:(b.svg||'').length,xUnit:b.meta?.xUnit,yUnit:b.meta?.yUnit}};
}
function auditBank(){const rows=(window.state?.questionBank||[]).filter(q=>['tikz','tkz'].includes(q.figureMode)&&/\.\.\s*controls\b|\\foreach\b/.test(String(q.figureLatex||'')));let native=0,fallback=0,stored=0;for(const q of rows){const tex=normalize(q.figureLatex||'');if(storedFirst(q,tex,false,q.figureMode))stored++;else if(render(tex).ok)native++;else fallback++}return {total:rows.length,stored,native,fallback,version:V}}
function openCenter(){if(typeof window.requireTeacher==='function'&&!window.requireTeacher('Native Freeform Graph '))return;const a=auditBank(),r=regression(),body=`<div class="v3754-audit"><div><b>${a.total}</b><small>Freeform TikZ</small></div><div><b>${a.stored}</b><small>Stored SVG</small></div><div><b>${a.native}</b><small>Native Freeform</small></div><div><b>${a.fallback}</b><small>Còn fallback</small></div></div><div class="math-help mt"><b>:</b> hỗ trợ Bézier <code>.. controls ..</code>, đường thẳng xen kẽ, <code>\\foreach</code> tạo điểm/nhãn, dashed/thick/arrows và tỉ lệ <code>scale/x/y</code>. Stored SVG vẫn được ưu tiên trước.</div><div class="notice mt"><b>${r.ok?'✓ Regression PASS':'⚠ Regression CHECK'}</b>Bézier ${r.graph.ok?'OK':'FAIL'} • foreach điểm ${r.graph.circles}/5 • x/y unit ${r.sign.ok?'OK':'FAIL'}.</div>`;window.openModal?.('Native Freeform Graph','Stored SVG → Native Freeform SVG → Smart SVG → TikZJax',body,'<button class="btn btn-blue" onclick="closeModal()">Đóng</button>')}
function addToolButton(){const groups=[...document.querySelectorAll('.v371-tool-group')],group=groups.find(g=>/Bảo trì|hình|Figure/i.test(g.textContent||''))||groups.find(g=>/Nhập & hỗ trợ/.test(g.textContent||''));if(group&&!document.getElementById('v3754FreeformBtn')){const b=document.createElement('button');b.id='v3754FreeformBtn';b.textContent='〰 Freeform Graph ';b.onclick=openCenter;group.appendChild(b)}}
function patchProduction(){if(typeof window.v35RunRegressionChecks!=='function'||window.v35RunRegressionChecks.__v3754)return;const base=window.v35RunRegressionChecks,w=function(opts={}){const res=base(opts);try{const r=regression(),a=auditBank();if(res?.checks&&!res.checks.some(x=>x.name==='Native Freeform Graph ')){const level=!r.ok?'fail':a.fallback?'warn':'pass';res.checks.push({name:'Native Freeform Graph ',ok:level==='pass',level,detail:!r.ok?'Regression Freeform chưa đạt':a.fallback?`${a.fallback}/${a.total} freeform còn cần TikZJax`:`${a.stored+a.native}/${a.total} freeform dùng Stored/Native SVG`});res.pass=res.checks.filter(x=>x.level==='pass').length;res.warn=res.checks.filter(x=>x.level==='warn').length;res.fail=res.checks.filter(x=>x.level==='fail').length}}catch(_){}return res};w.__v3754=true;window.v35RunRegressionChecks=w}
function init(){if(!patchRenderer()){setTimeout(init,60);return}patchFigureQC();patchEditor();patchProduction();addToolButton()}
window.v3754OpenFreeformCenter=openCenter;window.V3754FreeformGraph={version:V,build:BUILD,normalize,keyFor,expandForeach,parseTikz,render,regression,auditBank};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
