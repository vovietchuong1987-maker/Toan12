/* ==========================================================
   Math12 Hub  — Figure Layout & Zoom Layer
   Depends on  Hybrid Figure Engine and preserves it.
   - second-pass tight crop after SVG is attached to the DOM
   - aspect-aware display presets (graph / standard / wide / tall / table)
   - responsive sizing through ResizeObserver
   - vector zoom lightbox without changing question data
   - layout audit + production regression
   ========================================================== */
(function(){
'use strict';
const V='37.4.6';
const BUILD='37.4.6-auto-crop-responsive-zoom';
let scanRAF=0,resizeObserver=null,mutationObserver=null,zoom=1,activeSvg=null;

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function viewBoxOf(svg){
  try{const vb=svg?.viewBox?.baseVal;if(vb&&vb.width>0&&vb.height>0)return {x:vb.x,y:vb.y,width:vb.width,height:vb.height}}
  catch(_){}
  const raw=String(svg?.getAttribute?.('viewBox')||'').trim().split(/[ ,]+/).map(Number);return raw.length===4&&raw.every(Number.isFinite)&&raw[2]>0&&raw[3]>0?{x:raw[0],y:raw[1],width:raw[2],height:raw[3]}:null;
}
function ratioOf(svg){const b=viewBoxOf(svg);return b?b.width/b.height:1}
function layoutFor(ratio=1,kind='tikz',mode=''){
  ratio=Number.isFinite(Number(ratio))?Number(ratio):1;
  if(mode==='tkztab')return {preset:'table',idealW:760,idealH:460};
  if(kind==='graph-oxy')return {preset:'graph',idealW:540,idealH:410};
  if(ratio>=1.9)return {preset:'wide',idealW:760,idealH:400};
  if(ratio<=.72)return {preset:'tall',idealW:450,idealH:520};
  return {preset:'standard',idealW:620,idealH:460};
}
function figureKind(fig){return fig?.dataset?.v3745Kind||'tikz'}
function tighten(svg,fig){
  if(!svg||fig?.dataset?.v3745Crop==='none'||svg.dataset.v3746Crop==='1')return false;
  const old=viewBoxOf(svg);if(!old)return false;
  try{
    const bb=svg.getBBox?.();if(!bb||!(bb.width>0&&bb.height>0))return false;
    if(bb.width>old.width*4||bb.height>old.height*4)return false;
    const kind=figureKind(fig),ratio=Math.max(bb.width,bb.height),padRate=kind==='graph-oxy'?.055:.045;
    const pad=clamp(ratio*padRate,4,18),x=bb.x-pad,y=bb.y-pad,w=bb.width+2*pad,h=bb.height+2*pad;
    if(!(w>0&&h>0))return false;
    const oldArea=old.width*old.height,newArea=w*h;
    // Only rewrite when there is meaningful whitespace or when  already marked this as stored SVG.
    if(newArea<oldArea*.985||svg.classList.contains('v3745-stored-svg'))svg.setAttribute('viewBox',`${x.toFixed(3)} ${y.toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}`);
    svg.dataset.v3746Crop='1';return true;
  }catch(_){return false}
}
function addZoomButton(fig,svg){
  const stage=fig?.querySelector?.('.v3745-stage');if(!stage||!svg||stage.querySelector('.v3746-zoom-btn'))return;
  const b=document.createElement('button');b.type='button';b.className='v3746-zoom-btn';b.setAttribute('aria-label','Phóng to hình');b.title='Xem hình lớn';b.textContent='🔍 Hình lớn';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openZoom(svg,fig)});stage.appendChild(b);
  svg.addEventListener('dblclick',e=>{e.preventDefault();openZoom(svg,fig)});
}
function applyLayout(fig){
  if(!fig?.isConnected)return;const svg=fig.querySelector('.v3745-stage svg');if(!svg)return;
  tighten(svg,fig);
  const r=ratioOf(svg),mode=fig.closest?.('.tkztab-scroll')?'tkztab':'',spec=layoutFor(r,figureKind(fig),mode);
  fig.dataset.v3746Preset=spec.preset;fig.style.setProperty('--v3746-ideal-w',spec.idealW+'px');fig.style.setProperty('--v3746-ideal-h',spec.idealH+'px');fig.classList.add('v3746-ready');
  const hostWidth=fig.parentElement?.clientWidth||window.innerWidth;if(hostWidth<Math.min(spec.idealW+20,560))fig.dataset.v3746Narrow='1';else delete fig.dataset.v3746Narrow;
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.style.maxWidth='100%';addZoomButton(fig,svg);
}
function scan(root=document){
  const figs=[];if(root?.matches?.('.v3745-figure'))figs.push(root);root?.querySelectorAll?.('.v3745-figure').forEach(x=>figs.push(x));figs.forEach(applyLayout);
}
function schedule(root=document){
  if(scanRAF)cancelAnimationFrame(scanRAF);scanRAF=requestAnimationFrame(()=>requestAnimationFrame(()=>scan(root)));
}
function ensureLightbox(){
  let box=document.getElementById('v3746Lightbox');if(box)return box;
  box=document.createElement('div');box.id='v3746Lightbox';box.className='v3746-lightbox';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Xem hình lớn');
  box.innerHTML=`<div class="v3746-lightbox-bar"><div class="v3746-lightbox-title">Hình vẽ • SVG vector</div><div class="v3746-lightbox-actions"><button type="button" data-act="out" title="Thu nhỏ">−</button><span class="v3746-lightbox-zoom">100%</span><button type="button" data-act="in" title="Phóng to">+</button><button type="button" data-act="reset" title="Về 100%">100%</button><button type="button" class="v3746-close" data-act="close">Đóng</button></div></div><div class="v3746-lightbox-stage"><div class="v3746-lightbox-canvas"></div></div>`;
  box.addEventListener('click',e=>{const a=e.target?.closest?.('[data-act]')?.dataset?.act;if(a==='in')setZoom(zoom+.2);else if(a==='out')setZoom(zoom-.2);else if(a==='reset')setZoom(1);else if(a==='close')closeZoom();else if(e.target===box)closeZoom()});
  box.querySelector('.v3746-lightbox-stage').addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();setZoom(zoom+(e.deltaY<0?.12:-.12))},{passive:false});
  document.addEventListener('keydown',e=>{if(!box.classList.contains('open'))return;if(e.key==='Escape')closeZoom();if(e.key==='+'||e.key==='=')setZoom(zoom+.2);if(e.key==='-')setZoom(zoom-.2)});
  document.body.appendChild(box);return box;
}
function setZoom(v){zoom=clamp(Math.round(v*100)/100,.6,3);const box=ensureLightbox(),canvas=box.querySelector('.v3746-lightbox-canvas');canvas.style.transform=`scale(${zoom})`;box.querySelector('.v3746-lightbox-zoom').textContent=Math.round(zoom*100)+'%'}
function openZoom(svg,fig){
  const box=ensureLightbox(),canvas=box.querySelector('.v3746-lightbox-canvas');canvas.innerHTML='';activeSvg=svg;const clone=svg.cloneNode(true);clone.removeAttribute('width');clone.removeAttribute('height');clone.style.width='min(900px,82vw)';clone.style.height='auto';clone.style.maxWidth='none';clone.style.maxHeight='none';canvas.appendChild(clone);
  box.querySelector('.v3746-lightbox-title').textContent=`Hình vẽ • ${figureKind(fig)==='graph-oxy'?'Đồ thị Oxy':'SVG vector'}`;box.classList.add('open');document.documentElement.style.overflow='hidden';setZoom(1);
}
function closeZoom(){const box=document.getElementById('v3746Lightbox');if(box)box.classList.remove('open');document.documentElement.style.overflow='';activeSvg=null;zoom=1}
function installObservers(){
  schedule(document);
  if(typeof MutationObserver==='function'){mutationObserver=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)schedule(n)})));mutationObserver.observe(document.documentElement,{childList:true,subtree:true})}
  if(typeof ResizeObserver==='function'){resizeObserver=new ResizeObserver(entries=>entries.forEach(e=>{const fig=e.target.closest?.('.v3745-figure')||e.target;if(fig?.matches?.('.v3745-figure'))applyLayout(fig)}));document.querySelectorAll('.v3745-figure').forEach(f=>resizeObserver.observe(f))}
  window.addEventListener('resize',()=>schedule(document),{passive:true});window.addEventListener('beforeprint',()=>scan(document));
}
function regression(){
  const cases=[
    [1.12,'graph-oxy','', 'graph'],[2.4,'tikz','', 'wide'],[.55,'tikz','', 'tall'],[1.2,'tikz','', 'standard'],[3,'tikz','tkztab','table']
  ];
  const mapped=cases.map(c=>layoutFor(c[0],c[1],c[2]).preset),ok=cases.every((c,i)=>mapped[i]===c[3]);
  return {ok,version:V,build:BUILD,cases:mapped,zoomMin:.6,zoomMax:3};
}
function audit(){
  if(typeof requireTeacher==='function'&&!requireTeacher('Kiểm tra bố cục hình '))return;
  scan(document);const figs=[...document.querySelectorAll('.v3745-figure')],counts={graph:0,standard:0,wide:0,tall:0,table:0};figs.forEach(f=>{const p=f.dataset.v3746Preset||'standard';counts[p]=(counts[p]||0)+1});const rr=regression();
  const body=`<div class="v3746-audit-grid"><div><b>${figs.length}</b><small>Hình đang hiển thị</small></div><div><b>${counts.graph}</b><small>Đồ thị Oxy</small></div><div><b>${counts.wide}</b><small>Hình ngang rộng</small></div><div><b>${counts.tall}</b><small>Hình dọc</small></div><div><b>${counts.standard}</b><small>Khung chuẩn</small></div><div><b>${counts.table}</b><small>Bảng / BBT</small></div><div><b>0.6×–3×</b><small>Khoảng zoom</small></div><div><b>${rr.ok?'PASS':'CHECK'}</b><small>Regression layout</small></div></div><div class="math-help mt"><b>:</b> crop lần hai sau khi SVG gắn vào DOM, chọn kích thước theo tỉ lệ hình, tự co theo khung câu hỏi và cho phép phóng to SVG vector mà không thay đổi dữ liệu nguồn.</div>`;
  window.openModal?.('Figure Layout','Auto-crop • Responsive sizing • Vector zoom',body,`<button class="btn btn-blue" onclick="closeModal()">Đóng</button>`);
}
function installProductionCheck(){
  if(typeof window.v35RunRegressionChecks!=='function')return;const base=window.v35RunRegressionChecks;
  window.v35RunRegressionChecks=function(opts={}){const res=base(opts);try{const rr=regression(),exists=res?.checks?.some(x=>x.name==='Figure Layout ');if(res?.checks&&!exists){res.checks.push({name:'Figure Layout ',ok:rr.ok,detail:rr.ok?'Auto-crop • aspect presets • responsive • vector zoom':'Figure layout regression chưa đạt',level:rr.ok?'pass':'fail'});res.pass=res.checks.filter(x=>x.level==='pass').length;res.warn=res.checks.filter(x=>x.level==='warn').length;res.fail=res.checks.filter(x=>x.level==='fail').length;if(opts.render!==false)window.v35RenderProductionCenter?.()}}catch(_){}return res};
}
function init(){ensureLightbox();installObservers();installProductionCheck();}
window.v3746OpenFigureAudit=audit;
window.V3746FigureLayout={version:V,build:BUILD,viewBoxOf,ratioOf,layoutFor,applyLayout,scan,openZoom,closeZoom,regression,audit};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
