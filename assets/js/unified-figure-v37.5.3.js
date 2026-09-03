/* Math12 Hub  — Unified Figure Renderer
   Unifies TikZ and tkz-tab display priority:
   Stored SVG -> native tkz-tab fallback.
   Additive renderer only: never changes mathematical content, answers, ID6 or review status. */
(function(){
'use strict';
const V='37.5.3', BUILD='37.5.3-unified-figure-renderer-stored-svg-first';
let installed=false, nativeZoom=1, resizeObserver=null, mutationObserver=null, baseSanitize=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=s=>esc(s).replace(/`/g,'&#96;');
const norm=s=>String(s||'').replace(/\r\n?/g,'\n').trim();
function fe(){return window.V3745FigureEngine||null}
function fq(){return window.V3747FigureQC||null}
function keyFor(tex=''){if(fe()?.keyFor)return fe().keyFor(norm(tex));let h=2166136261>>>0;for(const c of norm(tex)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return 'fig-'+(h>>>0).toString(16).padStart(8,'0')}
function cleanSvgSource(svg=''){let raw=String(svg||'').replace(/^\uFEFF/,'').trim(),i=raw.search(/<svg\b/i);if(i<0)return '';raw=raw.slice(i);const end=raw.search(/<\/svg\s*>/i);if(end>=0)raw=raw.slice(0,end+raw.slice(end).match(/^<\/svg\s*>/i)[0].length);return raw.trim()}
function sanitize(svg=''){const raw=cleanSvgSource(svg);if(!raw)return '';const legacy=baseSanitize||(fe()?.sanitizeStoredSvg&&!fe().sanitizeStoredSvg.__v3753?fe().sanitizeStoredSvg.bind(fe()):null);const via=legacy?.(raw);if(via)return via;if(typeof DOMParser!=='function')return raw;try{const d=new DOMParser().parseFromString(raw,'image/svg+xml'),r=d.documentElement;if(!r||r.nodeName.toLowerCase()!=='svg'||d.querySelector('parsererror'))return '';r.querySelectorAll('script,foreignObject,iframe,object,embed').forEach(x=>x.remove());r.querySelectorAll('*').forEach(el=>{[...el.attributes].forEach(a=>{if(/^on/i.test(a.name)||/^(?:javascript|data):/i.test(String(a.value||'').trim()))el.removeAttribute(a.name)})});r.classList.add('v3753-stored-svg');return r.outerHTML}catch(_){return ''}}
function patchSharedSanitizer(){const api=fe();if(!api?.sanitizeStoredSvg||api.sanitizeStoredSvg.__v3753)return;const old=api.sanitizeStoredSvg.bind(api);baseSanitize=old;const wrapped=function(svg=''){return sanitize(svg)};wrapped.__v3753=true;wrapped.__base=old;api.sanitizeStoredSvg=wrapped}
function stored(item={},tex=''){
  const safe=sanitize(item.figureSvg||'');if(!safe)return '';
  const h=String(item.figureSourceHash||'').trim();if(!h)return safe;
  const pure=keyFor(tex),qhash=fq()?.sourceHash?.({...item,figureMode:item.figureMode||'tikz',figureLatex:tex})||'';
  return (h===pure||h===qhash)?safe:'';
}
function caption(item={}){return item.figureCaption?`<div class="latex-figure-caption">${typeof window.mathHTML==='function'?window.mathHTML(item.figureCaption):esc(item.figureCaption)}</div>`:''}
function source(tex=''){return `<details class="latex-figure-code"><summary>Mã tkz-tab gốc</summary><pre>${esc(tex)}</pre></details>`}
function storedFigure(item={},tex='',compact=false,mode='tikz'){
  const svg=stored(item,tex);if(!svg)return '';
  const display=item.figureDisplay&&typeof item.figureDisplay==='object'?item.figureDisplay:{},kind=mode==='tkztab'?'table':(item.figureKind||fe()?.detectKind?.(tex)||'tikz');
  const maxW=Math.max(360,Math.min(980,Number(display.maxWidth)||(kind==='table'?780:680))),maxH=Math.max(220,Math.min(680,Number(display.maxHeight)||(kind==='table'?500:480))),align=['left','right','center'].includes(display.align)?display.align:'center';
  const label=mode==='tkztab'?'BBT • bản biên dịch ưu tiên':'TikZ • bản biên dịch ưu tiên';
  const summary=mode==='tkztab'?'Mã tkz-tab gốc':'Mã hình LaTeX/TikZ';
  return `<div class="latex-figure ${compact?'compact ':''}v3745-figure v3753-unified ${mode==='tkztab'?'v3753-tkztab-svg':'v3753-tikz-svg'} ${align}" data-v3745-engine="stored-svg" data-v3745-kind="${attr(kind)}" data-v3745-crop="${attr(display.crop||'tight')}" data-v3753-engine="stored-svg" style="--v3745-max-w:${maxW}px;--v3745-max-h:${maxH}px"><div class="v3753-engine"><span>LaTeX SVG</span><small>${label}</small></div><div class="v3745-stage">${svg}</div>${caption(item)}<details class="latex-figure-code"><summary>${summary}</summary><pre>${esc(tex)}</pre></details></div>`;
}
function storedTkz(item={},tex='',compact=false){return storedFigure(item,tex,compact,'tkztab')}
function nativeTkz(item={},tex='',compact=false){
  let html='';try{html=typeof window.tkzTabNativeHTML==='function'?window.tkzTabNativeHTML(tex):''}catch(e){html=`<div class="bulk-errors fatal">${esc(e?.message||e)}</div>`}
  if(!html)return '';
  return `<div class="latex-figure ${compact?'compact ':''}tkztab v3753-unified v3753-tkztab-native" data-v3753-engine="native-tkztab"><div class="v3753-engine native"><span>Native BBT</span><small>fallback khi chưa có Stored SVG</small></div><div class="v3753-native-shell"><div class="v3753-native-stage">${html}</div><button type="button" class="v3753-native-zoom" onclick="v3753OpenNativeTableZoom(this)" aria-label="Phóng to bảng biến thiên">🔍 Bảng lớn</button></div>${caption(item)}${source(tex)}</div>`;
}
function fitNative(fig){
  if(!fig?.isConnected)return;const shell=fig.querySelector('.v3753-native-shell'),stage=fig.querySelector('.v3753-native-stage'),table=stage?.querySelector('.tkztab-native');if(!shell||!stage||!table)return;
  table.style.transform='';table.style.transformOrigin='top center';stage.style.height='';stage.style.minHeight='';stage.style.overflowX='';
  const avail=Math.max(250,shell.clientWidth-8),natural=Math.max(table.scrollWidth,table.getBoundingClientRect().width||0,640);let scale=Math.min(1,avail/natural);
  // Preserve readability in native fallback. Below 72%, retain horizontal scrolling instead of shrinking text too far.
  if(scale<.72){scale=.72;stage.style.overflowX='auto'}
  table.style.transform=`scale(${scale})`;table.style.marginLeft='auto';table.style.marginRight='auto';stage.style.height=Math.ceil(table.getBoundingClientRect().height*scale/Math.max(scale,.001)+4)+'px';
  stage.style.setProperty('--v3753-native-scale',String(scale));fig.dataset.v3753Fit=scale<1?String(Math.round(scale*100)):'100';
}
function scan(root=document){
  const natives=[];if(root?.matches?.('.v3753-tkztab-native'))natives.push(root);root?.querySelectorAll?.('.v3753-tkztab-native').forEach(x=>natives.push(x));natives.forEach(f=>requestAnimationFrame(()=>fitNative(f)));
  try{window.V3746FigureLayout?.scan?.(root)}catch(_){}
}
function schedule(root=document){requestAnimationFrame(()=>requestAnimationFrame(()=>scan(root)))}
function ensureNativeLightbox(){
  let box=document.getElementById('v3753NativeLightbox');if(box)return box;
  box=document.createElement('div');box.id='v3753NativeLightbox';box.className='v3753-lightbox';box.innerHTML=`<div class="v3753-lightbar"><b>Bảng biến thiên</b><div><button data-a="out">−</button><span id="v3753NativeZoomLabel">100%</span><button data-a="in">+</button><button data-a="reset">100%</button><button data-a="close">Đóng</button></div></div><div class="v3753-lightstage"><div class="v3753-lightcanvas"></div></div>`;
  box.addEventListener('click',e=>{const a=e.target?.closest?.('[data-a]')?.dataset?.a;if(a==='in')setNativeZoom(nativeZoom+.15);else if(a==='out')setNativeZoom(nativeZoom-.15);else if(a==='reset')setNativeZoom(1);else if(a==='close'||e.target===box)closeNativeZoom()});
  document.addEventListener('keydown',e=>{if(!box.classList.contains('open'))return;if(e.key==='Escape')closeNativeZoom();else if(e.key==='+'||e.key==='=')setNativeZoom(nativeZoom+.15);else if(e.key==='-')setNativeZoom(nativeZoom-.15)});
  document.body.appendChild(box);return box;
}
function setNativeZoom(v){nativeZoom=Math.max(.65,Math.min(2.5,Math.round(v*100)/100));const box=ensureNativeLightbox(),canvas=box.querySelector('.v3753-lightcanvas');canvas.style.transform=`scale(${nativeZoom})`;box.querySelector('#v3753NativeZoomLabel').textContent=Math.round(nativeZoom*100)+'%'}
function openNativeZoom(btn){const fig=btn?.closest?.('.v3753-tkztab-native'),table=fig?.querySelector('.tkztab-native');if(!table)return;const box=ensureNativeLightbox(),canvas=box.querySelector('.v3753-lightcanvas');canvas.innerHTML='';const clone=table.cloneNode(true);clone.style.transform='none';clone.style.margin='0';clone.style.maxWidth='none';canvas.appendChild(clone);box.classList.add('open');document.documentElement.style.overflow='hidden';setNativeZoom(1)}
function closeNativeZoom(){document.getElementById('v3753NativeLightbox')?.classList.remove('open');document.documentElement.style.overflow='';nativeZoom=1}
function patchRenderer(){
  if(installed||typeof window.questionFigureHTML!=='function')return false;const base=window.questionFigureHTML;
  const wrapped=function(item={},compact=false){const mode=item.figureMode||((item.figureLatex||'').trim()?'tikz':'none');if(!['tkztab','tikz','tkz'].includes(mode))return base(item,compact);const tex=norm(item.figureLatex||'');if(!tex)return '';const hit=storedFigure(item,tex,compact,mode);if(hit)return hit;if(mode==='tkztab')return nativeTkz(item,tex,compact)||base(item,compact);return base(item,compact)};
  wrapped.__v3753=true;wrapped.__base=base;window.questionFigureHTML=wrapped;installed=true;return true;
}
function patchFigureQC(){
  const api=window.V3747FigureQC;if(!api?.qcQuestion||api.qcQuestion.__v3753)return;const old=api.qcQuestion;
  const wrapped=function(q={},opts={}){const r=old(q,opts);if((q.figureMode||'')==='tkztab'&&stored(q,norm(q.figureLatex||''))){r.renderEngine='stored-svg';r.kind='table';if(Array.isArray(r.checks)&&!r.checks.some(x=>x.name==='Unified tkz-tab SVG'))r.checks.push({name:'Unified tkz-tab SVG',ok:true,detail:' ưu tiên Stored SVG; native BBT chỉ là fallback.',severity:'info'})}return r};wrapped.__v3753=true;api.qcQuestion=wrapped;
}
function regression(){
  const tex=String.raw`\begin{tikzpicture}\tkzTabInit{$x$/1,$f'(x)$/1,$f(x)$/2}{$-\infty$,$0$,$+\infty$}\tkzTabLine{,+,z,-,}\tkzTabVar{-/$-\infty$,+/$2$,-/$-\infty$}\end{tikzpicture}`;
  const fakeSvg='<!-- Created with Inkscape -->\n<svg viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="698" height="218" fill="white" stroke="black"/></svg>';
  const hash=keyFor(tex),fake={figureMode:'tkztab',figureLatex:tex,figureSvg:fakeSvg,figureSourceHash:hash,figureRenderEngine:'stored-svg'};
  const s=stored(fake,tex),storedOk=!!s&&/^<svg\b/i.test(s),nativeReady=typeof window.tkzTabNativeHTML==='function',rendererReady=typeof window.questionFigureHTML==='function';
  return {ok:storedOk&&nativeReady&&rendererReady,version:V,build:BUILD,storedOk,nativeReady,rendererReady};
}
function auditBank(){
  const rows=(window.state?.questionBank||[]).filter(q=>q.figureMode==='tkztab'&&String(q.figureLatex||'').trim());let storedOk=0,stale=0,native=0;
  rows.forEach(q=>{const safe=sanitize(q.figureSvg||'');if(safe){if(stored(q,norm(q.figureLatex||'')))storedOk++;else stale++}else native++});
  return {total:rows.length,storedOk,stale,native,version:V};
}
function openCenter(){
  if(typeof window.requireTeacher==='function'&&!window.requireTeacher('Unified Figure Renderer '))return;const a=auditBank(),rr=regression();const body=`<div class="v3753-audit-grid"><div><b>${a.total}</b><small>BBT/tkz-tab</small></div><div><b>${a.storedOk}</b><small>Stored SVG ưu tiên</small></div><div><b>${a.native}</b><small>Native fallback</small></div><div><b>${a.stale}</b><small>SVG lệch nguồn</small></div></div><div class="math-help mt"><b>:</b> tkz-tab dùng cùng pipeline với TikZ: Stored SVG hợp lệ → auto-crop/responsive/vector zoom. Chỉ khi không có SVG hợp lệ mới dùng Native BBT với auto-fit và cửa sổ phóng to riêng.</div><div class="notice mt"><b>${rr.ok?'✓ Regression PASS':'⚠ Regression CHECK'}</b>Stored SVG ${rr.storedOk?'OK':'FAIL'} • Native fallback ${rr.nativeReady?'OK':'thiếu'}.</div>`;window.openModal?.('Unified Figure Renderer','TikZ + tkz-tab • Stored SVG first • Auto-fit • Zoom',body,'<button class="btn btn-blue" onclick="closeModal()">Đóng</button>')
}
function addToolButton(){const groups=[...document.querySelectorAll('.v371-tool-group')],group=groups.find(g=>/Bảo trì|hình|Figure/i.test(g.textContent||''))||groups.find(g=>/Nhập & hỗ trợ/.test(g.textContent||''));if(group&&!document.getElementById('v3753UnifiedFigureBtn')){const b=document.createElement('button');b.id='v3753UnifiedFigureBtn';b.textContent='🖼 Unified Figures ';b.onclick=openCenter;group.appendChild(b)}}
function patchProduction(){if(typeof window.v35RunRegressionChecks!=='function'||window.v35RunRegressionChecks.__v3753)return;const base=window.v35RunRegressionChecks;const w=function(opts={}){const res=base(opts);try{const rr=regression(),a=auditBank();if(res?.checks&&!res.checks.some(x=>x.name==='Unified Figure Renderer ')){const level=!rr.ok||a.stale?'fail':a.native?'warn':'pass';res.checks.push({name:'Unified Figure Renderer ',ok:level==='pass',detail:a.stale?`${a.stale} tkz-tab Stored SVG lệch source hash`:a.native?`${a.storedOk}/${a.total} BBT dùng Stored SVG; ${a.native} native fallback`:`${a.storedOk}/${a.total} BBT dùng Stored SVG • auto-fit • zoom`,level});res.pass=res.checks.filter(x=>x.level==='pass').length;res.warn=res.checks.filter(x=>x.level==='warn').length;res.fail=res.checks.filter(x=>x.level==='fail').length}}catch(_){}return res};w.__v3753=true;window.v35RunRegressionChecks=w}
function installObservers(){schedule(document);if(typeof MutationObserver==='function'){mutationObserver=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)schedule(n)})));mutationObserver.observe(document.documentElement,{childList:true,subtree:true})}if(typeof ResizeObserver==='function'){resizeObserver=new ResizeObserver(es=>es.forEach(e=>{const f=e.target.closest?.('.v3753-tkztab-native')||e.target;if(f?.matches?.('.v3753-tkztab-native'))fitNative(f)}));document.querySelectorAll('.v3753-tkztab-native').forEach(f=>resizeObserver.observe(f))}window.addEventListener('resize',()=>schedule(document),{passive:true})}
function init(){patchSharedSanitizer();if(!patchRenderer())setTimeout(init,60);else{patchFigureQC();patchProduction();addToolButton();ensureNativeLightbox();installObservers()}}
window.v3753OpenNativeTableZoom=openNativeZoom;window.v3753CloseNativeTableZoom=closeNativeZoom;window.v3753OpenUnifiedFigureCenter=openCenter;window.V3753UnifiedFigures={version:V,build:BUILD,keyFor,cleanSvgSource,sanitize,patchSharedSanitizer,stored,storedFigure,storedTkz,nativeTkz,fitNative,scan,regression,auditBank};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
