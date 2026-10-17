import { bodies, bodyById } from './data.js';
import { SolarScene } from './scene.js';
import { AU_KM, diameterRatio, formatNumber, formatDistance, formatPeriod, validateCatalog } from './math.js';
import './enhancements.css';
import { updateRangeFill } from './range-control.js';

const $=id=>document.getElementById(id);
const state={selected:'earth',mode:'explore',a:'earth',b:'jupiter',paused:false,labels:true,orbits:true,quality:true,scale:'observation'};
let scene,assets={},toastTimer;
const typeNames={star:'恒星',planet:'行星',moon:'天然卫星'};
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2800);}
function bodyButton(b,moon=false){
 return '<button class="body-item'+(moon?' is-moon':'')+'" data-body="'+b.id+'" aria-label="观察'+b.name+'"><span class="body-dot" style="--body-color:'+b.color+';background:'+b.color+'"></span><span class="body-item-name">'+b.name+'</span><span class="body-item-en">'+b.en+'</span></button>';
}
function renderNavigation(){
 const sun=bodyById.sun;let html='<div class="nav-group-title">恒星</div>'+bodyButton(sun)+'<div class="nav-group-title">行星与卫星</div>';
 for(const b of bodies.filter(x=>x.type==='planet')){
  const moons=bodies.filter(x=>x.parent===b.id);
  html+='<div class="nav-planet"><div class="nav-planet-row">'+bodyButton(b)+(moons.length?'<button class="moon-toggle" data-parent="'+b.id+'" aria-expanded="'+(b.id==='earth')+'" title="'+b.name+'的'+moons.length+'颗入选卫星"><span>'+moons.length+'</span><span class="chevron">⌄</span></button>':'')+'</div>';
  if(moons.length)html+='<div class="moon-list" data-moons="'+b.id+'" '+(b.id==='earth'?'':'hidden')+'>'+moons.map(x=>bodyButton(x,true)).join('')+'</div>';
  html+='</div>';
 }
 $('body-nav').innerHTML=html;
 $('body-nav').addEventListener('click',e=>{
  const button=e.target.closest('[data-body]');if(button){selectBody(button.dataset.body);document.body.classList.remove('nav-open');return;}
  const toggle=e.target.closest('[data-parent]');if(toggle){const list=$('body-nav').querySelector('[data-moons="'+toggle.dataset.parent+'"]');list.hidden=!list.hidden;toggle.setAttribute('aria-expanded',String(!list.hidden));}
 });
}
function markSelection(){
 document.querySelectorAll('[data-body]').forEach(el=>{const active=el.dataset.body===state.selected;el.classList.toggle('is-active',active);if(active)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
 const parent=bodyById[state.selected]?.parent;
 if(parent&&parent!=='sun'){const list=document.querySelector('[data-moons="'+parent+'"]'),toggle=document.querySelector('[data-parent="'+parent+'"]');if(list)list.hidden=false;if(toggle)toggle.setAttribute('aria-expanded','true');}
}
function stat(label,value){return '<div class="stat"><div class="stat-label">'+label+'</div><div class="stat-value">'+value+'</div></div>';}
function showInfo(id){
 const b=bodyById[id],parent=bodyById[b.parent],children=bodies.filter(x=>x.parent===id);
 $('body-kind').textContent=typeNames[b.type]+(parent?' · '+parent.name+'系统':' · 太阳系的中心');
 $('body-name').textContent=b.name;$('body-en').textContent=b.en.toUpperCase();$('body-tagline').textContent=b.tagline;$('body-description').textContent=b.description;
 $('body-stats').innerHTML=stat('平均直径',formatNumber(b.radiusKm*2,0)+' km')+stat('自转一圈',formatNumber(b.dayHours,1)+' 小时')+(parent?stat('绕'+parent.name+'一圈',formatPeriod(b.orbitalDays))+stat('距'+parent.name+' · 平均',formatDistance(b.distanceKm)):stat('已知八大行星','8 颗')+stat('本次探索范围','23 个天体'));
 $('body-facts').innerHTML=b.facts.map(f=>'<li class="fact">'+f+'</li>').join('');
 $('body-source').href=b.source;$('body-source').textContent='查阅 NASA / JPL 资料 ↗';$('body-source').target='_blank';$('body-source').rel='noopener noreferrer';
 const asset=assets[id]||{};let note=asset.note||b.assetNote||'观测资料与可视化纹理';
 if(asset.dataGapColor)note+=' 未观测的黑色缺口以中性无细节表面呈现。';
 if(id==='phobos'||id==='deimos')note+=' 外形为不规则形状的示意近似。';
 $('asset-note').textContent=note;
 $('focus-button').textContent='靠近'+b.name;
 $('system-button').textContent=children.length?(id==='sun'?'返回太阳系全景':'观察卫星 · '+children.length):parent&&parent.id!=='sun'?'返回'+parent.name+'系统':'观察所在轨道';
 $('system-button').dataset.target=children.length?id:(parent?.id||'sun');
 $('breadcrumb').innerHTML='<button data-breadcrumb="sun">太阳系</button>'+(b.type==='moon'?'<span>／</span><button data-breadcrumb="'+b.parent+'">'+parent.name+'</button>':'')+(id!=='sun'?'<span>／</span><span>'+b.name+'</span>':'');
}
function updateExploreScaleNote(){
 if(state.mode!=='explore')return;
 const scope=scene.viewKind==='overview'?'太阳系全景':scene.viewKind==='system'?'行星与卫星系统':'三维探索';
 $('scale-note').textContent=state.scale==='real'
  ?scope+' · 真实比例：天体半径与轨道距离同尺度 · 圆轨道、位置仍为示意 · 名称仅作定位'
  :scope+' · 观察比例：天体大小与轨道距离分别缩放 · 位置为示意';
}
function selectBody(id,{system=false}={}){
 if(!bodyById[id])return;
 state.selected=id;
 if(state.mode!=='explore')setMode('explore');
 scene.selected=id;scene.focusBody(id,{system});showInfo(id);markSelection();
 updateExploreScaleNote();
}
function home(){
 if(state.mode!=='explore')setMode('explore');
 state.selected='sun';scene.selected='sun';showInfo('sun');markSelection();scene.goHome();$('breadcrumb').innerHTML='<span>太阳系全景</span><span class="breadcrumb-hint">选择一颗天体，开始探索</span>';
 updateExploreScaleNote();
}
function populateCompare(){
 const candidates=state.mode==='distance'?bodies.filter(x=>x.type==='planet'):bodies;
 if(!candidates.some(x=>x.id===state.a))state.a='earth';
 if(!candidates.some(x=>x.id===state.b))state.b=state.mode==='distance'?'neptune':'jupiter';
 for(const [id,key]of [['compare-a','a'],['compare-b','b']]){
  $(id).innerHTML=candidates.map(x=>'<option value="'+x.id+'">'+x.name+' · '+x.en+'</option>').join('');$(id).value=state[key];
 }
}
function renderComparison(){
 const a=bodyById[state.a],b=bodyById[state.b];
 scene.setMode(state.mode,a.id,b.id);
 const isSize=state.mode==='size';$('comparison-title').textContent=isSize?'把它们放在同一把尺子上':'从太阳出发，看看有多远';
 if(isSize){
  const larger=a.radiusKm>=b.radiusKm?a:b,smaller=larger===a?b:a,ratio=diameterRatio(a,b);
  $('comparison-content').innerHTML='<div class="comparison-values"><div><span>'+a.name+' · 平均直径</span><strong>'+formatNumber(a.radiusKm*2,0)+' 千米'+'</strong></div><div><span>'+b.name+' · 平均直径</span><strong>'+formatNumber(b.radiusKm*2,0)+' 千米'+'</strong></div></div><p class="comparison-insight"><strong>'+formatNumber(ratio,2)+'<small> 倍</small></strong><span>'+larger.name+'的直径约为'+smaller.name+'的 '+formatNumber(ratio,2)+' 倍</span></p><p class="comparison-explainer">两颗天体使用相同的直径比例。体积若近似为球体，约相差 '+formatNumber(ratio**3,1)+' 倍。拖动可以换个角度看。</p>';
  $('scale-note').textContent='大小比较 · 天体按平均直径同比例显示 · 中心间距仅为便于观察而排列';
 }else{
  const farther=a.distanceKm>=b.distanceKm?a:b,nearer=farther===a?b:a,ratio=farther.distanceKm/nearer.distanceKm;
  $('comparison-content').innerHTML='<div class="comparison-values"><div><span>'+a.name+' · 距太阳平均距离</span><strong>'+formatDistance(a.distanceKm)+'</strong><em>'+formatNumber(a.distanceKm/AU_KM,3)+' AU</em></div><div><span>'+b.name+' · 距太阳平均距离</span><strong>'+formatDistance(b.distanceKm)+'</strong><em>'+formatNumber(b.distanceKm/AU_KM,3)+' AU</em></div></div><p class="comparison-insight"><strong>'+formatNumber(ratio,2)+'<small> 倍</small></strong><span>'+farther.name+'距太阳约为'+nearer.name+'的 '+formatNumber(ratio,2)+' 倍</span></p><p class="comparison-explainer">横向间距按平均距离同比例显示。1 AU 约等于地球到太阳的平均距离。可以缩放观察挤在一起的内侧行星。</p>';
  $('scale-note').textContent='距离比较 · 距太阳平均距离按线性比例排列 · 标记大小仅用于定位 · 非当前排成一线的位置';
 }
 requestAnimationFrame(()=>scene.fitComparison());
}
function setMode(mode){
 state.mode=mode;document.body.classList.toggle('comparison-mode',mode!=='explore');document.body.dataset.mode=mode;
 document.querySelectorAll('button[data-mode]').forEach(el=>{const active=el.dataset.mode===mode;el.classList.toggle('is-active',active);el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
 $('comparison-panel').hidden=mode==='explore';
 if(mode==='explore'){scene.setMode(mode);showInfo(state.selected);updateExploreScaleNote();}
 else{if(mode==='distance'&&bodyById[state.b]?.type!=='planet')state.b='neptune';populateCompare();renderComparison();$('breadcrumb').innerHTML='<button data-breadcrumb="sun">太阳系</button><span>／</span><span>'+(mode==='size'?'大小比较':'距离比较')+'</span>';}
}
function togglePaused(){state.paused=!state.paused;scene.paused=state.paused;$('pause-button').setAttribute('aria-pressed',String(state.paused));$('pause-button').innerHTML=state.paused?'<svg><use href="#icon-play"/></svg>':'<svg><use href="#icon-pause"/></svg>';$('pause-button').setAttribute('aria-label',state.paused?'继续天体运动':'暂停天体运动');$('pause-button').title=state.paused?'继续示意运动（空格）':'暂停示意运动（空格）';}
function wireControls(){
 document.querySelectorAll('button[data-mode]').forEach(el=>el.onclick=()=>{if(el.dataset.mode==='size'){state.a=state.selected;state.b=state.selected==='jupiter'?'earth':'jupiter';}if(el.dataset.mode==='distance'){state.a=bodyById[state.selected].type==='planet'?state.selected:'earth';state.b='neptune';}setMode(el.dataset.mode);});
 $('home-button').onclick=home;document.querySelector('.brand').onclick=e=>{e.preventDefault();home();};$('focus-button').onclick=()=>selectBody(state.selected);
 $('system-button').onclick=()=>{const id=$('system-button').dataset.target;if(id==='sun')home();else selectBody(id,{system:true});};
 $('compare-button').onclick=()=>{state.a=state.selected;state.b=state.selected==='earth'?'moon':'earth';setMode('size');};
 $('pause-button').onclick=togglePaused;
 $('speed-input').oninput=()=>{updateRangeFill($('speed-input'));const value=Number($('speed-input').value);scene.speed=value===0?0:.0006*10**(value/30);$('speed-label').textContent=value===0?'静止':scene.speed<.04?formatNumber(scene.speed*1440,1)+' 分钟/秒':formatNumber(scene.speed,2)+' 天/秒';};$('speed-input').dispatchEvent(new Event('input'));
 $('labels-button').onclick=()=>{state.labels=!state.labels;scene.labelsVisible=state.labels;$('labels-button').classList.toggle('active',state.labels);$('labels-button').setAttribute('aria-pressed',String(state.labels));toast(state.labels?'天体名称已显示':'天体名称已隐藏');};
 $('orbits-button').onclick=()=>{state.orbits=!state.orbits;scene.orbitsVisible=state.orbits;$('orbits-button').classList.toggle('active',state.orbits);$('orbits-button').setAttribute('aria-pressed',String(state.orbits));toast(state.orbits?'示意轨道已显示':'示意轨道已隐藏');};
 $('quality-button').onclick=()=>{state.quality=!state.quality;scene.setQuality(state.quality);$('quality-button').innerHTML='<svg><use href="#icon-quality"/></svg><span>'+(state.quality?'精细':'轻量')+'</span>';$('quality-button').setAttribute('aria-pressed',String(state.quality));toast(state.quality?'已切换精细画质':'已降低渲染分辨率，减轻负载');};
 $('scale-button').onclick=()=>{
  const next=state.scale==='real'?'observation':'real';
  scene.setScaleMode(next);state.scale=next;
  const real=next==='real',button=$('scale-button');
  button.querySelector('span').textContent=real?'真实比例':'观察比例';
  button.classList.toggle('active',real);button.setAttribute('aria-pressed',String(real));
  button.title=real?'当前：真实比例。点击切回便于观察外观的比例':'当前：观察比例。点击将天体大小和轨道距离统一为真实比例';
  updateExploreScaleNote();
  toast(real?'已切为真实比例；天体可能很小，点击名称可靠近观察':'已切回观察比例');
 };
 $('info-toggle').onclick=()=>{document.body.classList.toggle('info-collapsed');$('info-toggle').setAttribute('aria-expanded',String(!document.body.classList.contains('info-collapsed')));};
 $('mobile-nav-button').onclick=()=>document.body.classList.toggle('nav-open');
 $('breadcrumb').onclick=e=>{const b=e.target.closest('[data-breadcrumb]');if(b)b.dataset.breadcrumb==='sun'?home():selectBody(b.dataset.breadcrumb,{system:true});};
 $('help-button').onclick=()=>$('help-dialog').showModal();$('help-close').onclick=()=>$('help-dialog').close();$('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog'))$('help-dialog').close();});
 for(const [id,key] of [['compare-a','a'],['compare-b','b']])$(id).onchange=()=>{state[key]=$(id).value;renderComparison();};
 document.addEventListener('keydown',e=>{
  if(e.target.closest('button,a,input,select,textarea,[contenteditable=true]')||$('help-dialog').open)return;
  if(e.code==='Space'){e.preventDefault();togglePaused();}
  if(e.key.toLowerCase()==='h')$('help-dialog').showModal();
  if(e.key.toLowerCase()==='i')$('info-toggle').click();
  if(e.key.toLowerCase()==='l')$('labels-button').click();
  if(e.key.toLowerCase()==='o')$('orbits-button').click();
  if(e.key==='Home'||e.key.toLowerCase()==='r'){e.preventDefault();home();}
  if(e.key==='1')setMode('explore');if(e.key==='2'){state.a=state.selected;setMode('size');}if(e.key==='3'){state.a='earth';state.b='neptune';setMode('distance');}
  if(e.key==='Escape'){document.body.classList.remove('nav-open');if(state.mode!=='explore')setMode('explore');}
 });
}
async function start(){
 try{
  validateCatalog(bodies);
  const response=await fetch('/textures/manifest.json');if(!response.ok)throw new Error('纹理清单无法读取');assets=await response.json();
  if(innerWidth<=680)document.body.classList.add('info-collapsed');
  renderNavigation();
  scene=new SolarScene($('space-canvas'),$('labels'),bodies,assets,id=>{if(state.mode==='distance'&&bodyById[id]?.type==='planet'){state.a=id;$('compare-a').value=id;renderComparison();}else selectBody(id);});
  wireControls();showInfo('earth');markSelection();
  await scene.initialize(p=>{const percent=Math.round(p*100);$('loading-progress').style.width=percent+'%';$('loading-message').textContent='正在准备天体纹理 · '+percent+'%';});
  const credits=document.createElement('p');credits.className='credits-link';credits.innerHTML='<a href="/credits.html" target="_blank" rel="noopener">天文数据、纹理来源与展示说明 ↗</a>';$('help-dialog').append(credits);
  updateExploreScaleNote();document.body.classList.add('app-ready');$('loading').classList.add('is-complete');setTimeout(()=>$('loading').hidden=true,650);
  window.__solarApp={ready:true,getDiagnostics:()=>scene.diagnostics(),getState:()=>({...state}),getScaleDiagnostics:()=>scene.scaleSnapshot(),bodyIds:bodies.map(b=>b.id)};
  if(scene.failures.length)toast('部分纹理未能加载，已显示有标注的示意表面');
 }catch(error){
  console.error(error);$('loading-message').innerHTML='场景暂未能启动：'+error.message+'。<br>请使用支持 WebGL 2 的现代浏览器，并检查硬件加速。';
  $('loading').classList.add('has-error');window.__solarApp={ready:false,error:error.message};
 }
}
start();
