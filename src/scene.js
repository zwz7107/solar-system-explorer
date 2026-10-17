import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sizeLayout, distancePosition } from './math.js';
import { getBodyDimensions } from './scales.js';

const TAU=Math.PI*2;

const phases={mercury:2.3,venus:3.7,earth:1.8,mars:.1,jupiter:4.6,saturn:2.55,uranus:.95,neptune:5.65};
function seeded(seed) { let t=seed;return ()=>{t+=0x6D2B79F5;let a=t;a=Math.imul(a^a>>>15,a|1);a^=a+Math.imul(a^a>>>7,a|61);return ((a^a>>>14)>>>0)/4294967296;}; }
function fallbackTexture(body) {
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const ctx=canvas.getContext('2d'),rand=seeded([...body.id].reduce((s,c)=>s+c.charCodeAt(0),0)*73);
 ctx.fillStyle=body.color;ctx.fillRect(0,0,1024,512);
 if(body.id==='titan'){const g=ctx.createLinearGradient(0,0,0,512);g.addColorStop(0,'#9a784e');g.addColorStop(.3,'#c79553');g.addColorStop(.62,'#c99e62');g.addColorStop(1,'#ab804d');ctx.fillStyle=g;ctx.fillRect(0,0,1024,512);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
 for(let i=0;i<25000;i++){const x=rand()*1024,y=rand()*512,v=Math.floor(rand()*180);ctx.fillStyle='rgba('+v+','+v+','+v+','+(rand()*.14)+')';ctx.fillRect(x,y,rand()*9+1,rand()*5+1);}
 for(let i=0;i<230;i++){
 const x=rand()*1024,y=rand()*512,r=rand()*12+1;
 const g=ctx.createRadialGradient(x-r*.25,y-r*.3,0,x,y,r);
 g.addColorStop(0,'rgba(20,17,15,.20)');g.addColorStop(.65,'rgba(20,17,15,.25)');g.addColorStop(.88,'rgba(220,210,193,.20)');g.addColorStop(1,'rgba(60,50,40,0)');
 ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
 }
 if(body.id==='iapetus'){const g=ctx.createLinearGradient(150,0,720,0);g.addColorStop(0,'rgba(12,10,8,.86)');g.addColorStop(.55,'rgba(20,15,10,.5)');g.addColorStop(1,'rgba(220,215,205,.35)');ctx.fillStyle=g;ctx.fillRect(0,0,1024,512);}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function glowTexture() {
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),g=x.createRadialGradient(128,128,5,128,128,128);
 g.addColorStop(0,'rgba(255,242,199,.75)');g.addColorStop(.22,'rgba(255,177,59,.3)');g.addColorStop(.48,'rgba(247,127,33,.10)');g.addColorStop(1,'rgba(246,116,20,0)');x.fillStyle=g;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);
}
function ringTexture() {
 const c=document.createElement('canvas');c.width=1024;c.height=4;const x=c.getContext('2d'),rand=seeded(85);
 for(let i=0;i<1024;i++){let v=.32+.34*Math.sin(i*.057)**2+.2*rand();const f=i/1024;if(f>.58&&f<.635)v=.035;if(f<.1)v*=f*10;if(f>.95)v*=(1-f)*20;x.fillStyle='rgba(193,173,139,'+v+')';x.fillRect(i,0,1,4);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export class SolarScene {
 constructor(canvas,labels,bodies,assets,onSelect) {
  this.canvas=canvas;this.labelsElement=labels;this.bodies=bodies;this.assets=assets;this.byId=Object.fromEntries(bodies.map(b=>[b.id,b]));this.onSelect=onSelect;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',logarithmicDepthBuffer:true});
  const gpuContext=this.renderer.getContext(),gpuExtension=gpuContext.getExtension('WEBGL_debug_renderer_info');this.integratedGpu=gpuExtension?/Intel|SwiftShader|Microsoft Basic/i.test(gpuContext.getParameter(gpuExtension.UNMASKED_RENDERER_WEBGL)):true;
  this.renderer.setClearColor(0x03070c);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(43,1,.01,8000);this.camera.position.set(0,130,195);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.minDistance=.08;this.controls.maxDistance=650;this.controls.enablePan=true;
  this.controls.addEventListener('start',()=>{this.tween=null;});
  this.explore=new THREE.Group();this.comparison=new THREE.Group();this.scene.add(this.explore,this.comparison);this.comparison.visible=false;
  this.ambient=new THREE.AmbientLight(0x859bbe,.48);this.scene.add(this.ambient);
  this.sunLight=new THREE.PointLight(0xfff7e9,3.0,0,0);this.scene.add(this.sunLight);
  this.compareLight=new THREE.DirectionalLight(0xfff9ee,2.6);this.compareLight.position.set(-5,8,14);this.compareLight.visible=false;this.scene.add(this.compareLight);
  this.scaleMode='observation';this.viewKind='body';this.renderOrigin=new THREE.Vector3();
  this.records=new Map();this.picks=[];this.comparePicks=[];this.labels=[];this.mode='explore';this.selected='earth';this.follow=null;this.paused=false;this.speed=.5;this.days=0;this.lastTime=0;this.frameCount=0;this.fps=0;this.fpsTime=0;this.labelsVisible=true;this.orbitsVisible=true;this.failures=[];this.highQuality=true;
  this.loader=new THREE.TextureLoader();this.loader.setCrossOrigin('anonymous');this.cache=new Map();
  this.createStars();this.createBodies();this.bindPointer();
  this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
  this.tick=this.tick.bind(this);requestAnimationFrame(this.tick);
 }
 async initialize(progress=()=>{}) {
  let done=0;
  await Promise.all(this.bodies.map(async b=>{
   const entry=this.assets[b.id]||{},rec=this.records.get(b.id);
   try{
    if(entry.map){rec.material.map=await this.texture(entry.map,true);rec.material.color.set(0xffffff);rec.material.needsUpdate=true;rec.hasMap=true;}
    if(entry.dataGapColor){rec.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(length(diffuseColor.rgb)<.005) diffuseColor.rgb=vec3(.24,.23,.21);');};rec.material.needsUpdate=true;}
    if(entry.ring&&rec.ring){rec.ring.material.map=await this.texture(entry.ring,true);rec.ring.material.needsUpdate=true;}
    if(entry.bump){rec.material.bumpMap=await this.texture(entry.bump,false);rec.material.bumpScale=.012;rec.material.needsUpdate=true;}
    if(entry.normal){rec.material.normalMap=await this.texture(entry.normal,false);rec.material.normalScale=new THREE.Vector2(.35,.35);rec.material.needsUpdate=true;}
    if(b.id==='earth'){
     if(entry.clouds){rec.cloud.material.map=await this.texture(entry.clouds,true);rec.cloud.material.alphaMap=await this.texture(entry.clouds,false);rec.cloud.material.opacity=.8;rec.cloud.material.needsUpdate=true;}
     if(entry.night){rec.material.emissiveMap=await this.texture(entry.night,true);rec.material.emissive.set(0xffcf8b);rec.material.emissiveIntensity=1.1;
      rec.material.onBeforeCompile=shader=>{
       shader.uniforms.uSunPosition={value:this.sunLight.position};
       shader.vertexShader='varying vec3 vSurfaceWorld; varying vec3 vSurfaceNormal;\n'+shader.vertexShader;
       shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfaceWorld=(modelMatrix*vec4(position,1.)).xyz;vSurfaceNormal=normalize(mat3(modelMatrix)*normal);');
       shader.fragmentShader='uniform vec3 uSunPosition; varying vec3 vSurfaceWorld; varying vec3 vSurfaceNormal;\n'+shader.fragmentShader;
       shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat nightSide=1.-smoothstep(-.18,.12,dot(normalize(vSurfaceNormal),normalize(uSunPosition-vSurfaceWorld)));totalEmissiveRadiance*=nightSide;');
      };rec.material.needsUpdate=true;
     }
    }
   }catch(e){this.failures.push(b.id);console.warn('素材加载失败',b.id,e.message);}
   progress(++done/this.bodies.length);
  }));
  this.focusBody('earth',{immediate:true});this.updatePositions(0);
 }
 async texture(url,color=true) {
  const key=url+(color?'color':'linear');if(this.cache.has(key))return this.cache.get(key);
  const p=this.loader.loadAsync(url).then(t=>{if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());return t;});this.cache.set(key,p);return p;
 }
 createStars() {
  const rand=seeded(874),n=2400,pos=new Float32Array(n*3),colors=new Float32Array(n*3),sizes=new Float32Array(n);
  for(let i=0;i<n;i++){const a=rand()*TAU,z=rand()*2-1,r=1400+rand()*700,s=Math.sqrt(1-z*z);pos.set([r*s*Math.cos(a),r*z,r*s*Math.sin(a)],i*3);const col=new THREE.Color().setHSL(.55+rand()*.13,.05+rand()*.25,.6+rand()*.4);colors.set([col.r,col.g,col.b],i*3);sizes[i]=rand()>.985?3:rand()*1.5+.45;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.setAttribute('size',new THREE.BufferAttribute(sizes,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,vertexShader:'attribute float size;varying vec3 vColor;void main(){vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size;}',fragmentShader:'varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vColor,a*.8);}'});
  this.stars=new THREE.Points(g,m);this.scene.add(this.stars);
 }
 createBodies() {
  const sphere=new THREE.SphereGeometry(1,96,64);
  for(const b of this.bodies){
   const {radius:r,orbit}=getBodyDimensions(b,this.bodies,'observation');
   const siblings=this.bodies.filter(x=>x.parent===b.parent&&x.type==='moon').sort((a,b)=>a.distanceKm-b.distanceKm);
   const moonIndex=siblings.findIndex(x=>x.id===b.id);
   const anchor=new THREE.Group(),tilt=new THREE.Group();anchor.add(tilt);tilt.rotation.z=THREE.MathUtils.degToRad(b.tiltDeg||0);this.explore.add(anchor);
   let geometry=sphere;
   if(b.id==='phobos'||b.id==='deimos'){
    geometry=new THREE.SphereGeometry(1,48,32);const pos=geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),f=1+.06*Math.sin(x*9+z*7)*Math.cos(y*8);pos.setXYZ(i,x*f*1.3,y*f*.85,z*f*.95);}geometry.computeVertexNormals();
   }
   const material=b.id==='sun'?new THREE.MeshBasicMaterial({color:0xffe9b7,map:fallbackTexture(b)}):new THREE.MeshStandardMaterial({color:0xffffff,map:fallbackTexture(b),roughness:b.id==='earth'?.83:.99,metalness:0});
   const mesh=new THREE.Mesh(geometry,material);mesh.scale.setScalar(r);mesh.userData.bodyId=b.id;tilt.add(mesh);this.picks.push(mesh);
   const rec={body:b,anchor,tilt,mesh,material,radius:r,orbit,observationRadius:r,observationOrbit:orbit,worldPosition:new THREE.Vector3(),phase:phases[b.id]??(.75+moonIndex*1.8),last:new THREE.Vector3(),hasMap:false};
   if(b.id==='sun'){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:0xffb961,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));s.scale.setScalar(r*7.5);anchor.add(s);rec.glow=s;}
   if(b.id==='earth'||b.id==='venus'||b.id==='titan'||b.id==='neptune'){
    const atmosphere=new THREE.Mesh(sphere,new THREE.ShaderMaterial({transparent:true,side:THREE.FrontSide,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uSunPosition:{value:this.sunLight.position},uColor:{value:new THREE.Color(b.id==='earth'?0x399dff:b.id==='neptune'?0x567dec:0xd9a258)}},vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'uniform vec3 uSunPosition;uniform vec3 uColor;varying vec3 vN;varying vec3 vP;void main(){vec3 N=normalize(vN);float rim=pow(1.-max(dot(N,normalize(cameraPosition-vP)),0.),3.5);float lit=.2+.8*max(dot(N,normalize(uSunPosition-vP)),0.);gl_FragColor=vec4(uColor,rim*lit*.8);}'}));
    atmosphere.scale.setScalar(r*(b.id==='earth'?1.018:1.03));tilt.add(atmosphere);rec.atmosphere=atmosphere;
   }
   if(b.id==='earth'){
    const cloud=new THREE.Mesh(sphere,new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,roughness:1}));cloud.scale.setScalar(r*1.011);tilt.add(cloud);rec.cloud=cloud;
   }
   if(b.id==='saturn'||b.id==='uranus'){
    const inner=b.id==='saturn'?1.25:1.85,outer=b.id==='saturn'?2.32:2.05,rg=new THREE.RingGeometry(r*inner,r*outer,180);
    const uv=rg.attributes.uv,positions=rg.attributes.position;
    for(let i=0;i<uv.count;i++){const len=Math.hypot(positions.getX(i),positions.getY(i));uv.setXY(i,(len/r-inner)/(outer-inner),.5);}
    const ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:ringTexture(),color:b.id==='saturn'?0xe6d9b8:0x788c99,side:THREE.DoubleSide,transparent:true,opacity:b.id==='saturn'?.9:.36,depthWrite:false}));ring.rotation.x=Math.PI/2;ring.userData.bodyId=b.id;tilt.add(ring);this.picks.push(ring);rec.ring=ring;
   }
   if(orbit){
    const pts=Array.from({length:193},(_,i)=>new THREE.Vector3(Math.cos(i/192*TAU)*orbit,0,Math.sin(i/192*TAU)*orbit));
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x8596aa,transparent:true,opacity:b.type==='moon'?.13:.18,depthWrite:false}));
    this.explore.add(line);rec.orbitLine=line;
   }
   const el=document.createElement('button');el.className='planet-label';el.innerHTML='<span class="label-dot"></span><span>'+b.name+'</span>';el.addEventListener('click',()=>this.onSelect(b.id));el.dataset.id=b.id;this.labelsElement.append(el);
   rec.label=el;this.labels.push({el,rec});this.records.set(b.id,rec);
  }
  this.updatePositions(0);
 }
 updatePositions(dt) {
  if(!this.paused)this.days+=dt*this.speed;
  for(const rec of this.records.values()){
   const b=rec.body;rec.last.copy(rec.anchor.position);
   if(b.type==='star')rec.worldPosition.set(0,0,0);
   else{
    const angle=rec.phase+this.days/Math.max(.25,b.orbitalDays)*TAU*(b.retrograde?-1:1);
    const parent=this.records.get(b.parent);
    rec.worldPosition.set(Math.cos(angle)*rec.orbit,0,Math.sin(angle)*rec.orbit).add(parent.worldPosition);
   }
   if(!this.paused){rec.mesh.rotation.y+=dt*this.speed*24/Math.max(.01,b.dayHours)*TAU*(b.retrograde?-1:1);if(rec.cloud)rec.cloud.rotation.y=rec.mesh.rotation.y;}
  }
  // Follow the selected body's double-precision position, leaving its local mesh at zero.
  if(this.scaleMode==='real'&&this.follow)this.renderOrigin.copy(this.records.get(this.follow).worldPosition);
  for(const rec of this.records.values()){
   rec.anchor.position.copy(rec.worldPosition).sub(this.renderOrigin);
   if(rec.orbitLine)rec.orbitLine.position.copy(this.records.get(rec.body.parent).worldPosition).sub(this.renderOrigin);
  }
  this.sunLight.position.copy(this.renderOrigin).negate();
 }
 rebaseOrigin(position) {
  const delta=position.clone().sub(this.renderOrigin);if(delta.lengthSq()===0)return;
  this.renderOrigin.copy(position);this.camera.position.sub(delta);this.controls.target.sub(delta);
  if(this.lastFollow)this.lastFollow.sub(delta);
  if(this.tween)for(const key of ['from','to','targetFrom','targetTo'])this.tween[key].sub(delta);
  for(const rec of this.records.values()){rec.anchor.position.sub(delta);if(rec.orbitLine)rec.orbitLine.position.sub(delta);}
  this.sunLight.position.copy(this.renderOrigin).negate();
 }
 systemExtent(id) {
  const rec=this.records.get(id),children=[...this.records.values()].filter(x=>x.body.parent===id);
  return Math.max(rec.radius,...children.map(x=>x.orbit+x.radius));
 }
 configureExploreCamera(radius) {
  const real=this.scaleMode==='real',outer=this.systemExtent('sun');
  this.camera.near=real?Math.max(1e-7,Math.min(.01,radius*.001)):.01;
  this.camera.far=real?Math.max(outer*16,100000):8000;this.camera.updateProjectionMatrix();
  this.controls.minDistance=radius*1.12;this.controls.maxDistance=real?outer*6:650;
 }
 setScaleMode(mode) {
  if(mode!== 'real'&&mode!=='observation')throw new Error('Unknown scale mode');
  if(mode===this.scaleMode)return;
  const rec=this.records.get(this.selected),overview=this.viewKind==='overview';
  const oldTarget=overview?this.records.get('sun').anchor.position.clone():rec.anchor.position.clone();
  const oldReference=overview?this.systemExtent('sun'):this.viewKind==='system'?this.systemExtent(this.selected):rec.radius;
  const cameraOffset=this.camera.position.clone().sub(oldTarget),controlOffset=this.controls.target.clone().sub(oldTarget);
  this.tween=null;this.scaleMode=mode;this.renderOrigin.set(0,0,0);
  for(const current of this.records.values()){
   const dimensions=getBodyDimensions(current.body,this.bodies,mode);
   current.radius=dimensions.radius;current.orbit=dimensions.orbit;
   current.tilt.scale.setScalar(current.radius/current.observationRadius);
   if(current.orbitLine)current.orbitLine.scale.setScalar(current.orbit/current.observationOrbit);
   if(current.glow){current.glow.scale.setScalar(current.radius*7.5);current.glow.visible=mode==='observation';}
  }
  this.updatePositions(0);
  const newTarget=overview?this.records.get('sun').anchor.position.clone():rec.anchor.position.clone();
  const newReference=overview?this.systemExtent('sun'):this.viewKind==='system'?this.systemExtent(this.selected):rec.radius;
  const ratio=newReference/oldReference;
  this.camera.position.copy(newTarget).add(cameraOffset.multiplyScalar(ratio));
  this.controls.target.copy(newTarget).add(controlOffset.multiplyScalar(ratio));
  this.configureExploreCamera(overview?this.records.get('sun').radius:rec.radius);
  this.lastFollow=this.follow?rec.anchor.position.clone():null;
  this.controls.update();this.updateLabels();
 }
 focusBody(id,{system=false,immediate=false}={}) {
  if(this.mode!=='explore')return;
  const rec=this.records.get(id);if(!rec)return;
  this.selected=id;this.viewKind=system?'system':'body';
  if(this.scaleMode==='real')this.rebaseOrigin(rec.worldPosition);
  this.follow=id;
  const target=rec.anchor.position.clone();
  let distance=rec.radius*(id==='saturn'?8.8:4.7);
  if(system)distance=Math.max(rec.radius*6,this.systemExtent(id)*2.3);
  const direction=rec.worldPosition.length()>.00001?rec.worldPosition.clone().negate().normalize():new THREE.Vector3(0,0,1);
  direction.applyAxisAngle(new THREE.Vector3(0,1,0),.83);direction.y=id==='saturn'?.7:.25;direction.normalize();
  const position=target.clone().addScaledVector(direction,distance);
  this.configureExploreCamera(rec.radius);
  if(immediate){this.camera.position.copy(position);this.controls.target.copy(target);this.tween=null;this.controls.update();}
  else this.startTween(position,target,1300);
  this.lastFollow=target.clone();
 }
 startTween(position,target,duration=1400) {this.tween={start:performance.now(),duration,from:this.camera.position.clone(),to:position.clone(),targetFrom:this.controls.target.clone(),targetTo:target.clone()};}
 goHome() {
  this.follow=null;this.lastFollow=null;this.viewKind='overview';this.rebaseOrigin(new THREE.Vector3());
  const factor=this.scaleMode==='real'?this.systemExtent('sun')/(150+2.4):1;
  this.configureExploreCamera(this.records.get('sun').radius);
  this.camera.near=this.scaleMode==='real'?1e-7:.01;this.camera.updateProjectionMatrix();
  this.controls.minDistance=this.scaleMode==='real'?this.records.get('sun').radius*1.12:7;
  this.startTween(new THREE.Vector3(0,230,345).multiplyScalar(factor),new THREE.Vector3(),1600);
 }
 scaleSnapshot(){
  return {mode:this.scaleMode,view:this.viewKind,days:this.days,origin:this.renderOrigin.toArray(),sunLight:this.sunLight.position.toArray(),near:this.camera.near,far:this.camera.far,cameraDistance:this.controls.getDistance(),bodies:[...this.records.values()].map(r=>({id:r.body.id,radius:r.radius,renderedRadius:r.mesh.scale.x*r.tilt.scale.x,orbit:r.orbit,renderedOrbit:r.orbitLine?r.orbitLine.geometry.attributes.position.getX(0)*r.orbitLine.scale.x:0,worldPosition:r.worldPosition.toArray(),localPosition:r.anchor.position.toArray()}))};
 }
 setMode(mode,a='earth',b='jupiter') {
  this.mode=mode;this.camera.clearViewOffset();this.explore.visible=mode==='explore';this.comparison.visible=mode!=='explore';this.compareLight.visible=mode!=='explore';this.sunLight.visible=mode==='explore';this.tween=null;this.follow=null;this.lastFollow=null;
  for(const {el}of this.labels)el.hidden=true;
  this.clearComparison();
  if(mode==='explore'){this.updatePositions(0);this.focusBody(this.selected);return;}
  this.sunLight.position.copy(this.compareLight.position);this.camera.near=.01;this.camera.far=8000;this.camera.updateProjectionMatrix();
  this.controls.minDistance=1;this.controls.maxDistance=80;
  if(mode==='size')this.createSizeComparison(a,b);
  else this.createDistanceComparison(a,b);
  this.fitComparison();
 }
 clearComparison() {
  this.comparison.traverse(o=>{if(o.userData.ownedGeometry)o.geometry?.dispose();if(o.userData.ownedMaterial)o.material?.dispose();});
  while(this.comparison.children.length)this.comparison.remove(this.comparison.children[0]);
  for(const x of this.compareLabels||[])x.el.remove();this.compareLabels=[];this.comparePicks=[];
 }
 addCompareLabel(id,position,text) {
  const el=document.createElement('button');el.className='planet-label compare-label';el.textContent=text||this.byId[id].name;el.onclick=()=>this.onSelect(id);this.labelsElement.append(el);this.compareLabels.push({el,position});return el;
 }
 createSizeComparison(a,b) {
  const da=this.byId[a],db=this.byId[b];if(!da||!db)return;
  for(const layout of sizeLayout(da,db)){
   const original=this.records.get(layout.id),group=original.tilt.clone(true),scale=layout.r/original.radius;
   group.scale.multiplyScalar(scale);group.position.set(layout.x,layout.y,0);
   group.traverse(o=>{if(o.isMesh){o.userData.bodyId=layout.id;this.comparePicks.push(o);}});
   this.comparison.add(group);this.addCompareLabel(layout.id,new THREE.Vector3(layout.x,-3.8,0),this.byId[layout.id].name);
  }
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10,-3.3,0),new THREE.Vector3(10,-3.3,0)]),new THREE.LineBasicMaterial({color:0x4a515c,transparent:true,opacity:.45}));line.userData.ownedGeometry=true;line.userData.ownedMaterial=true;this.comparison.add(line);
  this.camera.position.set(0,2,21);this.controls.target.set(0,-.6,0);this.controls.update();
 }
 createDistanceComparison(a,b) {
  const planets=this.bodies.filter(x=>x.type==='planet'),max=Math.max(...planets.map(x=>x.distanceKm));
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-12,0,0),new THREE.Vector3(12,0,0)]),new THREE.LineBasicMaterial({color:0x7e8b9a,transparent:true,opacity:.55}));line.userData.ownedGeometry=true;line.userData.ownedMaterial=true;this.comparison.add(line);
  const sun=new THREE.Mesh(new THREE.SphereGeometry(.33,32,24),this.records.get('sun').material);sun.userData.ownedGeometry=true;sun.position.set(-12,0,0);this.comparison.add(sun);this.addCompareLabel('sun',new THREE.Vector3(-12,-.9,0),'太阳');
  for(let i=0;i<planets.length;i++){
   const p=planets[i],x=distancePosition(p.distanceKm,max),chosen=p.id===a||p.id===b;
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(chosen?.23:.13,32,20),this.records.get(p.id).material);mesh.position.set(x,0,0);mesh.userData.ownedGeometry=true;mesh.userData.bodyId=p.id;this.comparison.add(mesh);this.comparePicks.push(mesh);
   const labelY=.75+(i<4?(i%4)*.8:0);
   const guide=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,.2,0),new THREE.Vector3(x,labelY-.15,0)]),new THREE.LineBasicMaterial({color:chosen?0xd7bf85:0x506273,transparent:true,opacity:.6}));guide.userData.ownedGeometry=true;guide.userData.ownedMaterial=true;this.comparison.add(guide);
   this.addCompareLabel(p.id,new THREE.Vector3(x,labelY,0),p.name);
  }
  this.camera.position.set(0,1,36);this.controls.target.set(0,.7,0);this.controls.update();
 }
 bindPointer() {
  let down=null;
  this.canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
  this.canvas.addEventListener('pointerup',e=>{
   if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;down=null;
   const r=this.canvas.getBoundingClientRect(),ndc=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(ndc,this.camera);
   const objects=(this.mode==='explore'?this.picks:this.comparePicks).filter(o=>{let p=o;while(p){if(!p.visible)return false;p=p.parent;}return true;});
   const hit=ray.intersectObjects(objects,false)[0];if(hit)this.onSelect(hit.object.userData.bodyId);
  });
 }
 resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;const pixelBudget=this.highQuality?(this.integratedGpu?2400000:5000000):1200000;this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(pixelBudget/(w*h))));this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(this.mode!=='explore')this.fitComparison();}
 fitComparison(){
  const w=this.canvas.clientWidth,h=this.canvas.clientHeight,panel=document.getElementById('comparison-panel').getBoundingClientRect();
  let region;
  if(w>=1000){const left=Math.min(panel.right+35,w*.56);region={x:left,y:160,w:w-left-36,h:h-310};}
  else{const top=Math.min(panel.bottom+22,h*.56);region={x:24,y:top,w:w-48,h:Math.max(140,h-top-125)};}
  const bounds=new THREE.Box3();
  for(const child of this.comparison.children)if(!child.isLine)bounds.expandByObject(child);
  if(this.mode==='distance'){bounds.min.set(-12.5,-1.4,-.4);bounds.max.set(12.5,3.8,.4);}
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const pixels=Math.max(8,Math.min(region.w/Math.max(1,size.x*1.12),region.h/Math.max(1,size.y*1.17)));
  const distance=h/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*pixels)+size.z*.55;
  this.camera.setViewOffset(w,h,w/2-(region.x+region.w/2),h/2-(region.y+region.h/2),w,h);
  this.camera.position.copy(center).add(new THREE.Vector3(0,0,distance));this.controls.target.copy(center);this.controls.maxDistance=Math.max(150,distance*3);this.controls.update();
 }
 setQuality(high){this.highQuality=high;this.resize();}
 updateLabels(){
  const w=this.canvas.clientWidth,h=this.canvas.clientHeight,v=new THREE.Vector3(),camDir=new THREE.Vector3();this.camera.getWorldDirection(camDir);
  if(this.mode==='explore'){
   const sorted=[...this.records.values()].sort((a,b)=>(a.body.id===this.selected?-1:0)-(b.body.id===this.selected?-1:0));
   const occupied=[];
   for(const rec of sorted){
    const dist=this.camera.position.distanceTo(rec.anchor.position),selectedSystem=rec.body.parent===this.selected||this.byId[this.selected]?.parent===rec.body.parent;
    const focusRec=this.records.get(this.selected),focusExtent=this.viewKind==='system'?Math.max(focusRec.radius*13,this.systemExtent(this.selected)*4):focusRec.radius*13,closeView=this.follow&&this.camera.position.distanceTo(focusRec.anchor.position)<focusExtent;
    const inSystem=rec.body.id===this.selected||rec.body.parent===this.selected||rec.body.id===this.byId[this.selected]?.parent||(this.byId[this.selected]?.type==='moon'&&rec.body.parent===this.byId[this.selected].parent);
    const visible=(rec.body.type!=='moon'||selectedSystem||dist<rec.radius*45)&&(!closeView||inSystem||rec.body.id==='sun');
    rec.anchor.visible=visible; if(rec.orbitLine)rec.orbitLine.visible=this.orbitsVisible&&visible;
    if(rec.orbitLine)rec.orbitLine.material.opacity=rec.body.id===this.selected?.45:rec.body.type==='moon'?.12:.16;
    const world=rec.anchor.position.clone();world.y+=rec.radius*1.13;v.copy(world).project(this.camera);
    const inFront=world.clone().sub(this.camera.position).dot(camDir)>0;
    const ray=rec.anchor.position.clone().sub(this.camera.position),targetDist=ray.length();ray.normalize();
    const occluded=[...this.records.values()].some(other=>{if(other===rec||!other.anchor.visible)return false;const offset=other.anchor.position.clone().sub(this.camera.position),along=offset.dot(ray);return along>0&&along<targetDist-rec.radius&&offset.lengthSq()-along*along<other.radius*other.radius;});
    let shown=this.labelsVisible&&visible&&!occluded&&inFront&&v.z<1&&v.z>-1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1;
    const x=(v.x*.5+.5)*w,y=(-v.y*.5+.5)*h;
    if(shown&&rec.body.id!==this.selected&&occupied.some(p=>Math.abs(p.x-x)<70&&Math.abs(p.y-y)<23))shown=false;
    if(shown)occupied.push({x,y});
    rec.label.hidden=!shown;rec.label.classList.toggle('is-selected',rec.body.id===this.selected);
    if(shown)rec.label.style.transform='translate(-50%, -100%) translate('+x+'px,'+y+'px)';
   }
  }else{
   for(const x of this.compareLabels||[]){v.copy(x.position).project(this.camera);x.el.hidden=!this.labelsVisible||v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1;x.el.style.transform='translate(-50%, -50%) translate('+((v.x*.5+.5)*w)+'px,'+((-v.y*.5+.5)*h)+'px)';}
  }
 }
 tick(now) {
  const dt=Math.min((now-(this.lastTime||now))/1000,.05);this.lastTime=now;
  if(!document.hidden){
   if(this.mode==='explore'){
    this.updatePositions(dt);
    if(this.follow&&this.lastFollow){
     const p=this.records.get(this.follow).anchor.position,delta=p.clone().sub(this.lastFollow);
     this.camera.position.add(delta);this.controls.target.add(delta);if(this.tween){this.tween.from.add(delta);this.tween.to.add(delta);this.tween.targetFrom.add(delta);this.tween.targetTo.add(delta);}
     this.lastFollow.copy(p);
    }
   }else if(!this.paused){for(const group of this.comparison.children)if(group.isGroup){const mesh=group.children.find(x=>x.isMesh);if(mesh)mesh.rotation.y+=dt*.045;}}
   if(this.tween){const t=Math.min((now-this.tween.start)/this.tween.duration,1),s=t*t*(3-2*t);this.camera.position.lerpVectors(this.tween.from,this.tween.to,s);this.controls.target.lerpVectors(this.tween.targetFrom,this.tween.targetTo,s);if(t===1)this.tween=null;}
   this.controls.update();this.stars.position.copy(this.camera.position);this.updateLabels();this.renderer.render(this.scene,this.camera);
   this.frameCount++;if(now-this.fpsTime>1000){this.fps=this.frameCount*1000/(now-this.fpsTime);this.fpsTime=now;this.frameCount=0;}
  }
  requestAnimationFrame(this.tick);
 }
 diagnostics(){const gl=this.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {mode:this.mode,scaleMode:this.scaleMode,viewKind:this.viewKind,selected:this.selected,fps:Math.round(this.fps),drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,textures:this.renderer.info.memory.textures,geometries:this.renderer.info.memory.geometries,failures:this.failures,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),size:{width:this.canvas.width,height:this.canvas.height},bodies:this.records.size};}
}
