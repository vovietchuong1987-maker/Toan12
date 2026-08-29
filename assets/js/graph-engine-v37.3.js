/* ==========================================================
   Math12 Hub V37.3 — Native Function Graph Engine
   Supported families:
   1) cubic:       y = ax^3 + bx^2 + cx + d
   2) rational11:  y = (ax+b)/(cx+d)
   3) rational21:  y = (ax^2+bx+c)/(dx+e)
   - Native SVG, works offline.
   - Auto characteristic analysis: extrema, intercepts, asymptotes.
   - Teacher graph builder + direct text spec.
   - Exports native graph back to TikZ for LaTeX round-trip.
   ========================================================== */
(function(){
'use strict';
const VERSION='37.3';
const BUILD='37.3-native-function-graph';
const MODE='graphthpt';

function escXml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function escHtml(v=''){return typeof window.esc==='function'?window.esc(String(v??'')):escXml(v)}
function fmt(n,max=3){if(!Number.isFinite(n))return '';if(Math.abs(n)<1e-10)n=0;let s=Number(n.toFixed(max)).toString();return s==='-0'?'0':s}
function near(a,b,eps=1e-8){return Math.abs(a-b)<=eps}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function bool(v,d=false){if(v==null||String(v).trim()==='')return d;return /^(1|true|yes|on|có|co)$/i.test(String(v).trim())}
function num(v,d=NaN){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:d}
function clone(v){return JSON.parse(JSON.stringify(v))}
function specLines(text=''){
  const out={};String(text||'').split(/\r?\n/).forEach(line=>{const s=line.trim();if(!s||s.startsWith('#')||s.startsWith('%'))return;const i=s.indexOf(':');if(i<0)return;out[s.slice(0,i).trim().toLowerCase()]=s.slice(i+1).trim()});return out
}
function normalizeFormula(s=''){
  let x=String(s||'').trim().replace(/^\$|\$$/g,'').replace(/^y\s*=\s*/i,'').replace(/[−–]/g,'-').replace(/\\left|\\right/g,'').replace(/\\,/g,'').replace(/\s+/g,'');
  x=x.replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g,'($1)/($2)').replace(/\^\{([0-9]+)\}/g,'^$1').replace(/[{}]/g,'');
  return x
}
function stripOuterParens(s=''){
  let x=String(s);while(x.startsWith('(')&&x.endsWith(')')){let dep=0,ok=true;for(let i=0;i<x.length;i++){if(x[i]==='(')dep++;else if(x[i]===')')dep--;if(dep===0&&i<x.length-1){ok=false;break}}if(!ok)break;x=x.slice(1,-1)}return x
}
function splitTopFraction(s=''){
  const x=normalizeFormula(s);let dep=0;for(let i=0;i<x.length;i++){const ch=x[i];if(ch==='(')dep++;else if(ch===')')dep--;else if(ch==='/'&&dep===0)return [stripOuterParens(x.slice(0,i)),stripOuterParens(x.slice(i+1))]}
  if(x.startsWith('(')){dep=0;for(let i=0;i<x.length;i++){if(x[i]==='(')dep++;else if(x[i]===')')dep--;if(dep===0&&x[i+1]==='/')return [stripOuterParens(x.slice(0,i+1)),stripOuterParens(x.slice(i+2))]}}
  return null
}
function parsePolynomial(raw='',maxDeg=3){
  let s=normalizeFormula(raw).replace(/\*/g,'');s=stripOuterParens(s);if(!s)return null;
  if(!/^[+\-0-9.x^]+$/i.test(s))return null;
  if(!/^[+-]/.test(s))s='+'+s;
  const terms=s.match(/[+-][^+-]+/g)||[],coef=Array(maxDeg+1).fill(0);
  for(const t0 of terms){let sign=t0[0]==='-'?-1:1,t=t0.slice(1);if(!t)return null;let deg=0,c=0;
    if(/x/i.test(t)){const parts=t.split(/x/i);let pre=parts[0];c=pre===''?1:Number(pre);if(!Number.isFinite(c))return null;deg=1;if(parts[1]){const m=parts[1].match(/^\^(\d+)$/);if(!m)return null;deg=Number(m[1])}}
    else{c=Number(t);if(!Number.isFinite(c))return null;deg=0}
    if(deg>maxDeg)return null;coef[deg]+=sign*c
  }
  let degree=maxDeg;while(degree>0&&Math.abs(coef[degree])<1e-12)degree--;
  return {coef,degree}
}
function parseFormulaFamily(formula=''){
  const f=normalizeFormula(formula),fr=splitTopFraction(f);
  if(fr){const n=parsePolynomial(fr[0],2),d=parsePolynomial(fr[1],1);if(!n||!d||d.degree!==1||Math.abs(d.coef[1])<1e-12)return null;
    if(n.degree<=1)return {type:'rational11',a:n.coef[1]||0,b:n.coef[0]||0,c:d.coef[1],d:d.coef[0],formula};
    if(n.degree===2)return {type:'rational21',a:n.coef[2],b:n.coef[1]||0,c:n.coef[0]||0,d:d.coef[1],e:d.coef[0],formula};
    return null
  }
  const p=parsePolynomial(f,3);if(p&&p.degree===3&&Math.abs(p.coef[3])>1e-12)return {type:'cubic',a:p.coef[3],b:p.coef[2]||0,c:p.coef[1]||0,d:p.coef[0]||0,formula};
  return null
}
function normalizeType(v=''){const s=String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');if(['cubic','bac3','bậc3','3'].includes(s))return 'cubic';if(['rational11','phanthuc11','11','mobius'].includes(s))return 'rational11';if(['rational21','phanthuc21','21'].includes(s))return 'rational21';return 'auto'}
function defaultSpec(type='cubic'){
  if(type==='rational11')return {type,a:2,b:1,c:1,d:-1,showGrid:true,showAsymptotes:true,showExtrema:true,showGuides:true,showPointLabels:false,showIntercepts:false};
  if(type==='rational21')return {type,a:1,b:-2,c:3,d:1,e:1,showGrid:true,showAsymptotes:true,showExtrema:true,showGuides:true,showPointLabels:false,showIntercepts:false};
  return {type:'cubic',a:1,b:0,c:-3,d:-2,showGrid:true,showAsymptotes:true,showExtrema:true,showGuides:true,showPointLabels:false,showIntercepts:false}
}
function parseSpec(text=''){
  const raw=specLines(text),formula=raw.function||raw.formula||raw['hàm']||raw['ham']||'';let inferred=formula?parseFormulaFamily(formula):null,type=normalizeType(raw.type||raw.kind||inferred?.type||'auto');if(type==='auto'&&inferred)type=inferred.type;if(type==='auto')type='cubic';
  let base=defaultSpec(type),s={...base,...(inferred||{}),type};
  ['a','b','c','d','e'].forEach(k=>{if(raw[k]!=null&&raw[k]!=='')s[k]=num(raw[k],s[k]??0)});
  s.formula=formula||formulaText(s);s.title=raw.title||raw['tiêu đề']||'Đồ thị hàm số';
  s.showGrid=bool(raw.grid??raw.showgrid,s.showGrid);s.showAsymptotes=bool(raw.asymptotes??raw.showasymptotes,s.showAsymptotes);s.showExtrema=bool(raw.extrema??raw.showextrema,s.showExtrema);s.showGuides=bool(raw.guides??raw.showguides,s.showGuides);s.showPointLabels=bool(raw.pointlabels??raw.showpointlabels,s.showPointLabels);s.showIntercepts=bool(raw.intercepts??raw.showintercepts,s.showIntercepts);
  ['xmin','xmax','ymin','ymax'].forEach(k=>{if(raw[k]!=null&&String(raw[k]).toLowerCase()!=='auto')s[k]=num(raw[k],undefined)});
  s.samples=clamp(Math.round(num(raw.samples,420)),120,1000);return s
}
function specToText(s={}){
  const rows=[`type: ${s.type}`,`function: ${formulaText(s)}`,`a: ${fmt(s.a)}`,`b: ${fmt(s.b)}`,`c: ${fmt(s.c)}`,`d: ${fmt(s.d)}`];if(s.type==='rational21')rows.push(`e: ${fmt(s.e)}`);
  rows.push(`xMin: ${Number.isFinite(s.xmin)?fmt(s.xmin):'auto'}`,`xMax: ${Number.isFinite(s.xmax)?fmt(s.xmax):'auto'}`,`yMin: ${Number.isFinite(s.ymin)?fmt(s.ymin):'auto'}`,`yMax: ${Number.isFinite(s.ymax)?fmt(s.ymax):'auto'}`,`grid: ${s.showGrid!==false}`,`asymptotes: ${s.showAsymptotes!==false}`,`extrema: ${s.showExtrema!==false}`,`guides: ${s.showGuides!==false}`,`pointLabels: ${!!s.showPointLabels}`,`intercepts: ${!!s.showIntercepts}`,`samples: ${s.samples||420}`);return rows.join('\n')
}
function polyText(terms){let out='';terms.forEach(([coef,pow])=>{if(Math.abs(coef)<1e-12)return;const sign=coef<0?'-':'+';const abs=Math.abs(coef),core=pow===0?fmt(abs):(near(abs,1)?'':fmt(abs))+'x'+(pow===1?'':`^${pow}`);if(!out)out=(coef<0?'-':'')+core;else out+=` ${sign} ${core}`});return out||'0'}
function formulaText(s={}){
  if(s.type==='rational11')return `(${polyText([[s.a,1],[s.b,0]])})/(${polyText([[s.c,1],[s.d,0]])})`;
  if(s.type==='rational21')return `(${polyText([[s.a,2],[s.b,1],[s.c,0]])})/(${polyText([[s.d,1],[s.e,0]])})`;
  return polyText([[s.a,3],[s.b,2],[s.c,1],[s.d,0]])
}
function validate(s={}){const errors=[];if(!['cubic','rational11','rational21'].includes(s.type))errors.push('Loại đồ thị chưa hỗ trợ.');if(s.type==='cubic'&&Math.abs(s.a)<1e-12)errors.push('Hàm bậc ba cần a ≠ 0.');if(s.type==='rational11'&&Math.abs(s.c)<1e-12)errors.push('Mẫu cx+d cần c ≠ 0.');if(s.type==='rational21'&&Math.abs(s.d)<1e-12)errors.push('Mẫu dx+e cần d ≠ 0.');return errors}
function functionFor(s){if(s.type==='cubic')return x=>s.a*x*x*x+s.b*x*x+s.c*x+s.d;if(s.type==='rational11')return x=>(s.a*x+s.b)/(s.c*x+s.d);return x=>(s.a*x*x+s.b*x+s.c)/(s.d*x+s.e)}
function quadraticRoots(a,b,c){if(Math.abs(a)<1e-12){if(Math.abs(b)<1e-12)return [];return [-c/b]}const D=b*b-4*a*c;if(D<-1e-10)return [];if(Math.abs(D)<1e-10)return [-b/(2*a)];const r=Math.sqrt(Math.max(0,D));return [(-b-r)/(2*a),(-b+r)/(2*a)].sort((x,y)=>x-y)}
function cubicRootsNumeric(fn,min=-20,max=20){const roots=[],N=2400;let px=min,py=fn(px);for(let i=1;i<=N;i++){let x=min+(max-min)*i/N,y=fn(x);if(Number.isFinite(py)&&Number.isFinite(y)){if(Math.abs(y)<1e-7)roots.push(x);else if(py*y<0){let a=px,b=x,fa=py;for(let k=0;k<50;k++){let m=(a+b)/2,fm=fn(m);if(fa*fm<=0)b=m;else{a=m;fa=fm}}roots.push((a+b)/2)}}px=x;py=y}return roots.filter((r,i,a)=>i===0||Math.abs(r-a[i-1])>1e-4)}
function analyze(s){
  const fn=functionFor(s),out={type:s.type,formula:formulaText(s),singular:null,vertical:[],horizontal:[],oblique:[],holes:[],extrema:[],intercepts:{x:[],y:null},inflection:null,center:null};
  if(s.type==='cubic'){
    const dr=quadraticRoots(3*s.a,2*s.b,s.c);out.extrema=dr.map(x=>({x,y:fn(x)}));const xi=-s.b/(3*s.a);out.inflection={x:xi,y:fn(xi)};out.intercepts.x=cubicRootsNumeric(fn,-30,30).map(x=>({x,y:0}));out.intercepts.y={x:0,y:fn(0)}
  }else if(s.type==='rational11'){
    const xv=-s.d/s.c,yh=s.a/s.c,cancel=Math.abs(s.a*s.d-s.b*s.c)<1e-10;out.singular=xv;if(cancel)out.holes=[{x:xv,y:yh}];else out.vertical=[xv];out.horizontal=[yh];out.center={x:xv,y:yh};if(Math.abs(s.a)>1e-12){const xr=-s.b/s.a;if(Math.abs(xr-xv)>1e-8)out.intercepts.x=[{x:xr,y:0}]}if(Math.abs(s.d)>1e-12)out.intercepts.y={x:0,y:s.b/s.d}
  }else{
    const xv=-s.e/s.d,m=s.a/s.d,n=(s.b*s.d-s.a*s.e)/(s.d*s.d),rem=s.c-n*s.e,cancel=Math.abs(rem)<1e-10;out.singular=xv;if(cancel)out.holes=[{x:xv,y:m*xv+n}];else out.vertical=[xv];out.oblique=[{m,n}];out.center={x:xv,y:m*xv+n};const ers=quadraticRoots(s.a*s.d,2*s.a*s.e,s.b*s.e-s.c*s.d);out.extrema=ers.filter(x=>Math.abs(x-xv)>1e-7).map(x=>({x,y:fn(x)})).filter(p=>Number.isFinite(p.y));out.intercepts.x=quadraticRoots(s.a,s.b,s.c).filter(x=>Math.abs(x-xv)>1e-8).map(x=>({x,y:0}));if(Math.abs(s.e)>1e-12)out.intercepts.y={x:0,y:s.c/s.e}
  }
  return out
}
function quantile(arr,q){if(!arr.length)return 0;const a=arr.slice().sort((x,y)=>x-y),i=(a.length-1)*q,lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(i-lo)}
function autoBounds(s,a){
  let xMin,xMax;
  if(s.type==='cubic'&&a.extrema.length>=2){const xs=a.extrema.map(p=>p.x),span=Math.max(1.8,xs[1]-xs[0]),m=span*.65;xMin=xs[0]-m;xMax=xs[1]+m}
  else if(s.type==='cubic'){const cx=a.inflection?.x||0;xMin=cx-3.5;xMax=cx+3.5}
  else{const xv=Number.isFinite(a.singular)?a.singular:(a.vertical[0]||0);xMin=xv-4.5;xMax=xv+4.5;if(a.intercepts.x.length){xMin=Math.min(xMin,...a.intercepts.x.map(p=>p.x-1.2));xMax=Math.max(xMax,...a.intercepts.x.map(p=>p.x+1.2))}}
  if(Number.isFinite(s.xmin))xMin=s.xmin;if(Number.isFinite(s.xmax))xMax=s.xmax;if(!(xMax>xMin)){xMin=-5;xMax=5}
  const fn=functionFor(s),ys=[],N=900,vert=Number.isFinite(a.singular)?a.singular:a.vertical[0];for(let i=0;i<N;i++){const x=xMin+(xMax-xMin)*i/(N-1);if(Number.isFinite(vert)&&Math.abs(x-vert)<(xMax-xMin)/100)continue;let y=fn(x);if(Number.isFinite(y)&&Math.abs(y)<1e5)ys.push(y)}
  let yMin,yMax;if(s.type==='cubic'){yMin=ys.length?quantile(ys,.04):-5;yMax=ys.length?quantile(ys,.96):5}else{const guide=[];if(Number.isFinite(vert)){[.7,1,1.6,2.5].forEach(delta=>[-1,1].forEach(sign=>{const y=fn(vert+sign*delta);if(Number.isFinite(y)&&Math.abs(y)<1e4)guide.push(y)}))}guide.push(...a.extrema.map(p=>p.y));if(a.intercepts.y)guide.push(a.intercepts.y.y);if(a.center)guide.push(a.center.y);if(a.horizontal.length)guide.push(...a.horizontal);if(a.oblique.length){const o=a.oblique[0];guide.push(o.m*xMin+o.n,o.m*xMax+o.n)}const clean=guide.filter(Number.isFinite);yMin=clean.length?Math.min(...clean):(ys.length?quantile(ys,.12):-5);yMax=clean.length?Math.max(...clean):(ys.length?quantile(ys,.88):5)}const key=[...a.extrema.map(p=>p.y),a.intercepts.y?.y,a.center?.y].filter(Number.isFinite);if(key.length){yMin=Math.min(yMin,...key);yMax=Math.max(yMax,...key)}
  if(a.horizontal.length){yMin=Math.min(yMin,...a.horizontal);yMax=Math.max(yMax,...a.horizontal)}
  if(a.oblique.length){const o=a.oblique[0];yMin=Math.min(yMin,o.m*xMin+o.n,o.m*xMax+o.n);yMax=Math.max(yMax,o.m*xMin+o.n,o.m*xMax+o.n)}
  if(!(yMax>yMin)){yMin-=2;yMax+=2}let pad=Math.max(.8,(yMax-yMin)*.14);yMin-=pad;yMax+=pad;
  if(Number.isFinite(s.ymin))yMin=s.ymin;if(Number.isFinite(s.ymax))yMax=s.ymax;if(!(yMax>yMin)){yMin=-5;yMax=5}
  return {xMin,xMax,yMin,yMax}
}
function niceStep(span,target=8){const raw=Math.abs(span)/target;if(!raw||!Number.isFinite(raw))return 1;const p=Math.pow(10,Math.floor(Math.log10(raw))),n=raw/p;return (n<1.5?1:n<3?2:n<7?5:10)*p}
function graphSvg(specInput){
  const s=typeof specInput==='string'?parseSpec(specInput):{...defaultSpec(specInput?.type),...(specInput||{})},errors=validate(s);if(errors.length)return {ok:false,errors};const a=analyze(s),b=autoBounds(s,a),fn=functionFor(s),W=680,H=420,P={l:54,r:22,t:22,b:42},iw=W-P.l-P.r,ih=H-P.t-P.b,X=x=>P.l+(x-b.xMin)/(b.xMax-b.xMin)*iw,Y=y=>P.t+(b.yMax-y)/(b.yMax-b.yMin)*ih;
  const xStep=niceStep(b.xMax-b.xMin,9),yStep=niceStep(b.yMax-b.yMin,8),parts=[],defs=`<defs><marker id="v373arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#334155"/></marker></defs>`;
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="#fff"/>`);
  if(s.showGrid!==false){for(let x=Math.ceil(b.xMin/xStep)*xStep;x<=b.xMax+1e-9;x+=xStep)parts.push(`<line x1="${X(x)}" y1="${P.t}" x2="${X(x)}" y2="${H-P.b}" stroke="#e8eef7" stroke-width="1"/>`);for(let y=Math.ceil(b.yMin/yStep)*yStep;y<=b.yMax+1e-9;y+=yStep)parts.push(`<line x1="${P.l}" y1="${Y(y)}" x2="${W-P.r}" y2="${Y(y)}" stroke="#e8eef7" stroke-width="1"/>`)}
  if(s.showAsymptotes!==false){a.vertical.forEach(x=>{if(x>b.xMin&&x<b.xMax)parts.push(`<line x1="${X(x)}" y1="${P.t}" x2="${X(x)}" y2="${H-P.b}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="7 6"/>`)});a.horizontal.forEach(y=>{if(y>b.yMin&&y<b.yMax)parts.push(`<line x1="${P.l}" y1="${Y(y)}" x2="${W-P.r}" y2="${Y(y)}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="7 6"/>`)});a.oblique.forEach(o=>parts.push(`<line x1="${X(b.xMin)}" y1="${Y(o.m*b.xMin+o.n)}" x2="${X(b.xMax)}" y2="${Y(o.m*b.xMax+o.n)}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="7 6"/>`))}
  const axisY=(b.yMin<=0&&b.yMax>=0)?Y(0):H-P.b,axisX=(b.xMin<=0&&b.xMax>=0)?X(0):P.l;parts.push(`<line x1="${P.l}" y1="${axisY}" x2="${W-P.r+2}" y2="${axisY}" stroke="#0f172a" stroke-width="1.7" marker-end="url(#v373arr)"/>`,`<line x1="${axisX}" y1="${H-P.b}" x2="${axisX}" y2="${P.t-2}" stroke="#0f172a" stroke-width="1.7" marker-end="url(#v373arr)"/>`);
  for(let x=Math.ceil(b.xMin/xStep)*xStep;x<=b.xMax+1e-9;x+=xStep){if(Math.abs(x)<xStep*.08)continue;const px=X(x);parts.push(`<line x1="${px}" y1="${axisY-3}" x2="${px}" y2="${axisY+3}" stroke="#334155"/><text x="${px}" y="${Math.min(H-8,axisY+17)}" text-anchor="middle" font-size="11" fill="#475569">${escXml(fmt(x,2))}</text>`)}
  for(let y=Math.ceil(b.yMin/yStep)*yStep;y<=b.yMax+1e-9;y+=yStep){if(Math.abs(y)<yStep*.08)continue;const py=Y(y);parts.push(`<line x1="${axisX-3}" y1="${py}" x2="${axisX+3}" y2="${py}" stroke="#334155"/><text x="${Math.max(14,axisX-7)}" y="${py+4}" text-anchor="end" font-size="11" fill="#475569">${escXml(fmt(y,2))}</text>`)}
  parts.push(`<text x="${W-P.r-2}" y="${axisY-8}" text-anchor="end" font-size="15" font-style="italic" fill="#0f172a">x</text>`,`<text x="${axisX+9}" y="${P.t+12}" font-size="15" font-style="italic" fill="#0f172a">y</text>`);if(b.xMin<=0&&b.xMax>=0&&b.yMin<=0&&b.yMax>=0)parts.push(`<text x="${axisX-8}" y="${axisY+17}" text-anchor="end" font-size="11" fill="#334155">O</text>`);
  let paths=[],cur=[],N=s.samples||420,vert=Number.isFinite(a.singular)?a.singular:a.vertical[0],prevY=null;function flush(){if(cur.length>1)paths.push(cur);cur=[];prevY=null}
  for(let i=0;i<N;i++){const x=b.xMin+(b.xMax-b.xMin)*i/(N-1);if(Number.isFinite(vert)&&Math.abs(x-vert)<(b.xMax-b.xMin)/N*1.6){flush();continue}let y=fn(x);if(!Number.isFinite(y)||y<b.yMin-(b.yMax-b.yMin)*2||y>b.yMax+(b.yMax-b.yMin)*2){flush();continue}if(prevY!=null&&Math.abs(Y(y)-Y(prevY))>ih*.7)flush();cur.push({x,y});prevY=y}flush();paths.forEach(ps=>parts.push(`<path d="${ps.map((p,i)=>`${i?'L':'M'} ${X(p.x).toFixed(2)} ${Y(p.y).toFixed(2)}`).join(' ')}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`));
  function point(p,label=''){if(!p||p.x<b.xMin||p.x>b.xMax||p.y<b.yMin||p.y>b.yMax)return;if(s.showGuides){if(b.yMin<0&&b.yMax>0)parts.push(`<line x1="${X(p.x)}" y1="${Y(p.y)}" x2="${X(p.x)}" y2="${Y(0)}" stroke="#94a3b8" stroke-width="1.15" stroke-dasharray="5 5"/>`);if(b.xMin<0&&b.xMax>0)parts.push(`<line x1="${X(p.x)}" y1="${Y(p.y)}" x2="${X(0)}" y2="${Y(p.y)}" stroke="#94a3b8" stroke-width="1.15" stroke-dasharray="5 5"/>`)}parts.push(`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.8" fill="#0f172a"/>`);if(s.showPointLabels&&label)parts.push(`<text x="${X(p.x)+7}" y="${Y(p.y)-8}" font-size="11.5" font-weight="600" fill="#0f172a">${escXml(label)}</text>`)}
  if(s.showExtrema!==false)a.extrema.forEach((p,i)=>point(p,`(${fmt(p.x,2)}; ${fmt(p.y,2)})`));a.holes.forEach(p=>{if(p.x>=b.xMin&&p.x<=b.xMax&&p.y>=b.yMin&&p.y<=b.yMax)parts.push(`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" fill="#fff" stroke="#2563eb" stroke-width="2.2"/>`)});if(s.showIntercepts){a.intercepts.x.forEach(p=>point(p,`(${fmt(p.x,2)}; 0)`));if(a.intercepts.y)point(a.intercepts.y,`(0; ${fmt(a.intercepts.y.y,2)})`)}
  const info=[];if(a.holes.length)info.push(`Khuyết x=${fmt(a.holes[0].x,3)}`);if(a.vertical.length)info.push(`TCĐ x=${fmt(a.vertical[0],3)}`);if(a.horizontal.length)info.push(`TCN y=${fmt(a.horizontal[0],3)}`);if(a.oblique.length){const o=a.oblique[0];info.push(`TCX y=${fmt(o.m,3)}x${o.n>=0?'+':''}${fmt(o.n,3)}`)}
  const svg=`<svg class="v373-graph-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escXml(s.title||'Đồ thị hàm số')}">${defs}${parts.join('')}</svg>`;return {ok:true,svg,spec:s,analysis:a,bounds:b,info}
}
function graphHtml(item={},compact=false){const r=graphSvg(item.figureLatex||'');if(!r.ok)return `<div class="latex-figure v373-graph-error"><div class="firebase-banner error"><b>Graph V37.3:</b> ${escHtml(r.errors.join(' • '))}</div><details class="latex-figure-code"><summary>Cấu hình đồ thị</summary><pre>${escHtml(item.figureLatex||'')}</pre></details></div>`;const cap=item.figureCaption?`<div class="latex-figure-caption">${typeof mathHTML==='function'?mathHTML(item.figureCaption):escHtml(item.figureCaption)}</div>`:'';return `<div class="latex-figure ${compact?'compact':''} v373-native-graph"><div class="v373-graph-head"><span>Đồ thị chuẩn THPT • SVG V37.3</span><small>${escHtml(r.info.join(' • ')||'Tự phân tích đặc trưng')}</small></div><div class="v373-graph-wrap">${r.svg}</div>${cap}<details class="latex-figure-code"><summary>Cấu hình Graph Engine</summary><pre>${escHtml(item.figureLatex||'')}</pre></details></div>`}
function tikzExpr(s){if(s.type==='cubic')return `${fmt(s.a,6)}*(\\x)^3+${fmt(s.b,6)}*(\\x)^2+${fmt(s.c,6)}*(\\x)+${fmt(s.d,6)}`;if(s.type==='rational11')return `(${fmt(s.a,6)}*(\\x)+${fmt(s.b,6)})/(${fmt(s.c,6)}*(\\x)+${fmt(s.d,6)})`;return `(${fmt(s.a,6)}*(\\x)^2+${fmt(s.b,6)}*(\\x)+${fmt(s.c,6)})/(${fmt(s.d,6)}*(\\x)+${fmt(s.e,6)})`}
function toTikz(specInput){const s=typeof specInput==='string'?parseSpec(specInput):specInput,a=analyze(s),b=autoBounds(s,a),lines=[`\\begin{tikzpicture}[>=stealth,scale=0.8]`,`\\draw[->] (${fmt(b.xMin,2)},0) -- (${fmt(b.xMax,2)},0) node[below]{$x$};`,`\\draw[->] (0,${fmt(b.yMin,2)}) -- (0,${fmt(b.yMax,2)}) node[right]{$y$};`,`\\node[below left] at (0,0) {$O$};`];
  if(s.showAsymptotes!==false){a.vertical.forEach(x=>lines.push(`\\draw[dashed] (${fmt(x,5)},${fmt(b.yMin,2)}) -- (${fmt(x,5)},${fmt(b.yMax,2)});`));a.horizontal.forEach(y=>lines.push(`\\draw[dashed] (${fmt(b.xMin,2)},${fmt(y,5)}) -- (${fmt(b.xMax,2)},${fmt(y,5)});`));a.oblique.forEach(o=>lines.push(`\\draw[dashed] (${fmt(b.xMin,2)},{${fmt(o.m,6)}*(${fmt(b.xMin,2)})+${fmt(o.n,6)}}) -- (${fmt(b.xMax,2)},{${fmt(o.m,6)}*(${fmt(b.xMax,2)})+${fmt(o.n,6)}});`))}
  const expr=tikzExpr(s),sing=Number.isFinite(a.singular)?a.singular:null;if(Number.isFinite(sing)){const v=sing,gap=Math.max(.025,(b.xMax-b.xMin)*.004);lines.push(`\\draw[smooth,samples=220,domain=${fmt(b.xMin,4)}:${fmt(v-gap,4)},thick] plot(\\x,{${expr}});`,`\\draw[smooth,samples=220,domain=${fmt(v+gap,4)}:${fmt(b.xMax,4)},thick] plot(\\x,{${expr}});`)}else lines.push(`\\draw[smooth,samples=240,domain=${fmt(b.xMin,4)}:${fmt(b.xMax,4)},thick] plot(\\x,{${expr}});`);a.holes.forEach(p=>lines.push(`\\draw[fill=white] (${fmt(p.x,5)},${fmt(p.y,5)}) circle (2pt);`));
  if(s.showExtrema!==false)a.extrema.forEach(p=>{if(s.showGuides)lines.push(`\\draw[dashed] (${fmt(p.x,5)},0) -- (${fmt(p.x,5)},${fmt(p.y,5)}) -- (0,${fmt(p.y,5)});`);lines.push(`\\fill (${fmt(p.x,5)},${fmt(p.y,5)}) circle (1.5pt);`)});lines.push('\\end{tikzpicture}');return lines.join('\n')}
function builderFields(type,s){
  if(type==='cubic')return `<div class="v373-coeff-grid">${['a','b','c','d'].map(k=>`<label><span>${k}</span><input id="v373_${k}" type="number" step="any" value="${escHtml(fmt(s[k]))}"></label>`).join('')}</div><div class="math-help">$y=ax^3+bx^2+cx+d$, với $a\\ne0$.</div>`;
  if(type==='rational11')return `<div class="v373-coeff-grid">${['a','b','c','d'].map(k=>`<label><span>${k}</span><input id="v373_${k}" type="number" step="any" value="${escHtml(fmt(s[k]))}"></label>`).join('')}</div><div class="math-help">$y=\\dfrac{ax+b}{cx+d}$, với $c\\ne0$.</div>`;
  return `<div class="v373-coeff-grid">${['a','b','c','d','e'].map(k=>`<label><span>${k}</span><input id="v373_${k}" type="number" step="any" value="${escHtml(fmt(s[k]))}"></label>`).join('')}</div><div class="math-help">$y=\\dfrac{ax^2+bx+c}{dx+e}$, với $d\\ne0$.</div>`
}
function readBuilder(){const type=document.getElementById('v373Type')?.value||'cubic',s=defaultSpec(type);['a','b','c','d','e'].forEach(k=>{const el=document.getElementById('v373_'+k);if(el)s[k]=num(el.value,s[k]??0)});s.showGrid=!!document.getElementById('v373Grid')?.checked;s.showAsymptotes=!!document.getElementById('v373Asym')?.checked;s.showExtrema=!!document.getElementById('v373Extrema')?.checked;s.showGuides=!!document.getElementById('v373Guides')?.checked;s.showPointLabels=!!document.getElementById('v373Labels')?.checked;s.showIntercepts=!!document.getElementById('v373Intercepts')?.checked;return s}
function refreshBuilder(typeOnly=false){const type=document.getElementById('v373Type')?.value||'cubic',holder=document.getElementById('v373CoeffHolder');if(typeOnly&&holder){const prev=defaultSpec(type);holder.innerHTML=builderFields(type,prev)}const s=readBuilder(),r=graphSvg(s),preview=document.getElementById('v373Preview'),formula=document.getElementById('v373Formula');if(formula)formula.textContent='y = '+formulaText(s);if(preview)preview.innerHTML=r.ok?r.svg:`<div class="firebase-banner error">${escHtml(r.errors.join(' • '))}</div>`}
function recognizeBuilderFormula(){const input=document.getElementById('v373FormulaInput'),f=input?.value||'',parsed=parseFormulaFamily(f);if(!parsed)return alert('Chưa nhận dạng được công thức. Hỗ trợ: ax^3+bx^2+cx+d, (ax+b)/(cx+d), (ax^2+bx+c)/(dx+e).');const type=document.getElementById('v373Type');if(type)type.value=parsed.type;const holder=document.getElementById('v373CoeffHolder');if(holder)holder.innerHTML=builderFields(parsed.type,{...defaultSpec(parsed.type),...parsed});refreshBuilder(false);examToast?.('Đã nhận dạng công thức và điền hệ số.')}
function closeBuilder(){document.getElementById('v373BuilderOverlay')?.remove()}
function openBuilder(){
  let existing=document.getElementById('qeFigureLatex')?.value||'',s;try{s=parseSpec(existing)}catch(_){s=defaultSpec('cubic')}if(!existing.trim()||validate(s).length)s=defaultSpec('cubic');
  closeBuilder();const overlay=document.createElement('div');overlay.id='v373BuilderOverlay';overlay.className='v373-builder-overlay';overlay.innerHTML=`<div class="v373-builder-modal" role="dialog" aria-modal="true" aria-labelledby="v373BuilderTitle"><div class="v373-builder-head"><div><h3 id="v373BuilderTitle">Graph Engine V37.3</h3><small>Vẽ nhanh 3 họ hàm số thường gặp trong chương Ứng dụng đạo hàm</small></div><button type="button" class="close" id="v373BuilderClose">×</button></div><div class="v373-builder-body"><div class="v373-builder"><div class="field-grid"><div class="field"><label>Loại đồ thị</label><select id="v373Type"><option value="cubic" ${s.type==='cubic'?'selected':''}>Hàm bậc ba</option><option value="rational11" ${s.type==='rational11'?'selected':''}>Phân thức bậc nhất / bậc nhất</option><option value="rational21" ${s.type==='rational21'?'selected':''}>Phân thức bậc hai / bậc nhất</option></select></div><div class="field"><label>Công thức</label><div id="v373Formula" class="v373-formula"></div></div><div class="field full"><label>Nhập nhanh công thức (tùy chọn)</label><div class="v373-formula-entry"><input id="v373FormulaInput" value="${escHtml(formulaText(s))}" placeholder="Ví dụ: (x^2-2x+3)/(x+1)"><button type="button" class="btn btn-soft" id="v373Recognize">Nhận dạng</button></div><div class="math-help">Có thể dùng <code>x^3-3x-2</code>, <code>(2x+1)/(x-3)</code>, <code>(x^2-2x+3)/(x+1)</code> hoặc dạng <code>\dfrac{...}{...}</code>.</div></div><div class="field full" id="v373CoeffHolder">${builderFields(s.type,s)}</div><div class="field full"><div class="v373-checks"><label><input id="v373Grid" type="checkbox" ${s.showGrid!==false?'checked':''}> Lưới</label><label><input id="v373Asym" type="checkbox" ${s.showAsymptotes!==false?'checked':''}> Tiệm cận</label><label><input id="v373Extrema" type="checkbox" ${s.showExtrema!==false?'checked':''}> Điểm cực trị</label><label><input id="v373Guides" type="checkbox" ${s.showGuides!==false?'checked':''}> Nét đứt chiếu trục</label><label><input id="v373Labels" type="checkbox" ${s.showPointLabels?'checked':''}> Ghi tọa độ điểm</label><label><input id="v373Intercepts" type="checkbox" ${s.showIntercepts?'checked':''}> Giao trục</label></div></div><div class="field full"><label>Xem trước SVG</label><div id="v373Preview" class="v373-builder-preview"></div></div></div></div></div><div class="v373-builder-foot"><button class="btn btn-soft" id="v373BuilderCancel">Hủy</button><button class="btn btn-soft" id="v373BuilderCopy">Sao chép TikZ</button><button class="btn btn-blue" id="v373BuilderApply">Dùng đồ thị này</button></div></div>`;document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeBuilder()});document.getElementById('v373BuilderClose').onclick=closeBuilder;document.getElementById('v373BuilderCancel').onclick=closeBuilder;document.getElementById('v373BuilderCopy').onclick=copyTikz;document.getElementById('v373BuilderApply').onclick=applyBuilder;document.getElementById('v373Recognize').onclick=recognizeBuilderFormula;document.getElementById('v373FormulaInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();recognizeBuilderFormula()}});document.getElementById('v373Type')?.addEventListener('change',()=>refreshBuilder(true));document.querySelector('#v373BuilderOverlay .v373-builder-body')?.addEventListener('input',e=>{if(e.target?.id?.startsWith('v373'))refreshBuilder(false)});refreshBuilder(false);typesetMath?.(overlay);document.getElementById('v373Type')?.focus()
}
function applyBuilder(){const s=readBuilder(),errors=validate(s);if(errors.length)return alert(errors.join('\n'));const target=document.getElementById('qeFigureLatex');if(!target)return alert('Không tìm thấy trình soạn câu hỏi.');target.value=specToText(s);const mode=document.getElementById('qeFigureMode');if(mode)mode.value=MODE;closeBuilder();toggleQuestionFigureFields?.();updateQuestionEditorPreview?.();setTimeout(updateEditorHint,0)}
async function copyTikz(){const s=readBuilder(),errors=validate(s);if(errors.length)return alert(errors.join('\n'));const t=toTikz(s);try{await navigator.clipboard.writeText(t);examToast?.('Đã sao chép mã TikZ của đồ thị.')}catch(_){prompt('Sao chép mã TikZ:',t)}}
function updateEditorHint(){const mode=document.getElementById('qeFigureMode')?.value,box=document.getElementById('qeFigureHint');if(mode!==MODE||!box)return;const raw=document.getElementById('qeFigureLatex')?.value||'',r=graphSvg(raw);box.innerHTML=r.ok?`<b>Graph V37.3:</b> ${escHtml(r.spec.type==='cubic'?'hàm bậc ba':r.spec.type==='rational11'?'phân thức bậc nhất/bậc nhất':'phân thức bậc hai/bậc nhất')} • SVG offline ✓${r.info.length?` • ${escHtml(r.info.join(' • '))}`:''}`:`<b>Graph V37.3:</b> <span class="bad">${escHtml(r.errors.join(' • '))}</span>`}
function installEditor(){
  const baseOpen=window.openQuestionEditor;window.openQuestionEditor=function(id=''){baseOpen(id);setTimeout(()=>{const sel=document.getElementById('qeFigureMode');if(!sel)return;if(![...sel.options].some(o=>o.value===MODE)){const opt=document.createElement('option');opt.value=MODE;opt.textContent='Đồ thị chuẩn THPT V37.3';const graphOpt=[...sel.options].find(o=>o.value==='graph2d');graphOpt?graphOpt.insertAdjacentElement('beforebegin',opt):sel.appendChild(opt)}const q=id?(state.questionBank||[]).find(x=>x.id===id):null;if(q?.figureMode===MODE)sel.value=MODE;const bar=document.querySelector('#qeFigureWrap .figure-toolbar');if(bar&&!document.getElementById('v373BuilderBtn')){const b=document.createElement('button');b.type='button';b.className='btn btn-soft';b.id='v373BuilderBtn';b.textContent='📈 Trình tạo đồ thị';b.onclick=openBuilder;bar.prepend(b)}toggleQuestionFigureFields?.();updateEditorHint();document.getElementById('qeFigureLatex')?.addEventListener('input',updateEditorHint);sel.addEventListener('change',updateEditorHint)},0)};
  const baseToggle=window.toggleQuestionFigureFields;window.toggleQuestionFigureFields=function(){baseToggle?.();const mode=document.getElementById('qeFigureMode')?.value,lab=document.getElementById('qeFigureLabel');if(mode===MODE&&lab)lab.textContent='Cấu hình đồ thị chuẩn THPT V37.3';updateEditorHint()};
  const baseTemplate=window.setQuestionFigureTemplate;window.setQuestionFigureTemplate=function(){if(document.getElementById('qeFigureMode')?.value!==MODE)return baseTemplate?.();const box=document.getElementById('qeFigureLatex');if(box)box.value=specToText(defaultSpec('cubic'));updateEditorHint();updateQuestionEditorPreview?.()}
}
function installPresentation(){
  const baseFig=window.questionFigureHTML;window.questionFigureHTML=function(item={},compact=false){if(item?.figureMode===MODE)return graphHtml(item,compact);return baseFig(item,compact)};
  const baseName=window.figureModeName;window.figureModeName=function(mode='tikz'){return mode===MODE?'Đồ thị chuẩn THPT V37.3':baseName(mode)};
  const baseTag=window.figureModeTag;window.figureModeTag=function(mode='tikz'){return mode===MODE?'Đồ thị chuẩn THPT':baseTag(mode)};
  const baseLatex=window.v29QuestionToLatex;if(typeof baseLatex==='function')window.v29QuestionToLatex=function(q={}){if(q.figureMode!==MODE)return baseLatex(q);const copy=clone(q);copy.figureMode='tikz';copy.figureLatex=toTikz(parseSpec(q.figureLatex||''));return baseLatex(copy)}
}
function openAudit(){
  if(typeof requireTeacher==='function'&&!requireTeacher('Kiểm tra đồ thị V37.3'))return;const rows=(state.questionBank||[]).filter(q=>q.figureMode===MODE),counts={cubic:0,rational11:0,rational21:0,invalid:0},bad=[];rows.forEach(q=>{const r=graphSvg(q.figureLatex||'');if(r.ok)counts[r.spec.type]=(counts[r.spec.type]||0)+1;else{counts.invalid++;bad.push(`${q.id}: ${r.errors.join(', ')}`)}});const rr=regression();const body=`<div class="v372-audit-grid"><div><b>${rows.length}</b><small>Câu dùng Graph V37.3</small></div><div><b>${counts.cubic}</b><small>Hàm bậc ba</small></div><div><b>${counts.rational11}</b><small>Bậc nhất / bậc nhất</small></div><div><b>${counts.rational21}</b><small>Bậc hai / bậc nhất</small></div></div><div class="math-help mt"><b>Regression:</b> ${rr.ok?'✓ 3/3 họ hàm và nhận dạng công thức đạt.':'⚠ Cần kiểm tra Graph Engine.'} Đồ thị V37.3 dựng SVG cục bộ, không cần Internet; khi xuất LaTeX, cấu hình được chuyển ngược sang TikZ.</div>${bad.length?`<div class="bulk-errors fatal mt"><b>${bad.length} cấu hình cần sửa:</b><br>${bad.slice(0,12).map(escHtml).join('<br>')}${bad.length>12?'<br>…':''}</div>`:'<div class="notice mt"><b>✓ Không phát hiện cấu hình Graph V37.3 lỗi.</b></div>'}`;openModal('Native Function Graph V37.3','Kiểm tra 3 họ đồ thị chuẩn THPT trong ngân hàng',body,`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`)
}
function regression(){
  const cases=[
    {name:'cubic',text:'type: cubic\na: 1\nb: 0\nc: -3\nd: -2',expect:r=>r.analysis.extrema.length===2&&near(r.analysis.extrema[0].x,-1,1e-6)&&near(r.analysis.extrema[1].x,1,1e-6)},
    {name:'r11',text:'type: rational11\na: 2\nb: 1\nc: 1\nd: -3',expect:r=>near(r.analysis.vertical[0],3)&&near(r.analysis.horizontal[0],2)},
    {name:'r21',text:'type: rational21\na: 1\nb: -2\nc: 3\nd: 1\ne: 1',expect:r=>near(r.analysis.vertical[0],-1)&&r.analysis.oblique.length===1}
  ];let passed=0,details=[];for(const c of cases){const r=graphSvg(c.text),ok=r.ok&&c.expect(r)&&r.svg.includes('<path');if(ok)passed++;else details.push(c.name)}const f1=parseFormulaFamily('x^3-3x-2'),f2=parseFormulaFamily('(2x+1)/(x-3)'),f3=parseFormulaFamily('(x^2-2x+3)/(x+1)'),formulaOk=f1?.type==='cubic'&&f2?.type==='rational11'&&f3?.type==='rational21';return {ok:passed===cases.length&&formulaOk,passed,total:cases.length,formulaOk,failed:details}
}
function init(){installPresentation();installEditor()}
window.v373RecognizeBuilderFormula=recognizeBuilderFormula;window.v373OpenGraphBuilder=openBuilder;window.v373OpenGraphAudit=openAudit;window.v373CloseGraphBuilder=closeBuilder;window.v373ApplyBuilder=applyBuilder;window.v373CopyTikz=copyTikz;window.v373GraphRegression=regression;window.V373Graph={version:VERSION,build:BUILD,mode:MODE,parseSpec,parseFormulaFamily,analyze,render:graphSvg,toTikz,specToText,defaultSpec,regression};
init();
})();
