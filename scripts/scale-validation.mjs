import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { bodies } from '../src/data.js';
const out='outputs/qa/scale-update';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const errors=[],failed=[],checks=[],details={};
const relative=(actual,expected,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<=Math.max(1e-10,Math.abs(expected)*tolerance),actual+' vs '+expected);
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('requestfailed',r=>failed.push(r.url()));
const snap=()=>page.evaluate(()=>window.__solarApp.getScaleDiagnostics());
const shot=async name=>{await page.screenshot({path:out+'/'+name+'.png'});await page.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:65});};
try{
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__solarApp?.ready);
 await page.locator('#pause-button').click();await page.waitForTimeout(300);
 const range=page.locator('#speed-input');
 await range.focus();await page.keyboard.press('End');assert.equal(await range.inputValue(),'100');
 assert.equal(await range.evaluate(e=>e.style.getPropertyValue('--range-progress')),'100%');
 await page.keyboard.press('Home');assert.equal(await range.inputValue(),'0');assert.equal(await range.evaluate(e=>e.style.getPropertyValue('--range-progress')),'0%');
 const box=await range.boundingBox();await page.mouse.move(box.x+4,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.77,box.y+box.height/2,{steps:8});await page.mouse.up();
 const drag=await range.evaluate(e=>({value:Number(e.value),ratio:Number(e.style.getPropertyValue('--range-ratio')),background:getComputedStyle(e).backgroundImage}));
 relative(drag.ratio,drag.value/100);assert.ok(drag.value>60&&drag.value<90);
 await range.fill('35');await range.dispatchEvent('input');
 checks.push('Range fill follows drag, keyboard endpoints and initialization');details.range=drag;
 assert.equal(await page.locator('#scale-button').evaluate(e=>e.previousElementSibling.id),'quality-button');
 const before=await snap();await shot('observation-earth');
 await page.locator('#scale-button').click();await page.waitForTimeout(400);
 assert.equal(await page.locator('#scale-button').getAttribute('aria-pressed'),'true');
 let real=await snap();assert.equal(real.mode,'real');relative(real.cameraDistance/real.bodies.find(x=>x.id==='earth').radius,before.cameraDistance/before.bodies.find(x=>x.id==='earth').radius);
 relative(real.days,before.days);
 for(const item of real.bodies){
  const body=bodies.find(b=>b.id===item.id);
  relative(item.radius,body.radiusKm/1000,1e-12);relative(item.renderedRadius,item.radius,1e-12);
  relative(item.orbit,body.distanceKm/1000,1e-12);relative(item.renderedOrbit,item.orbit,2e-7);
  if(body.parent){const parent=real.bodies.find(x=>x.id===body.parent);relative(Math.hypot(...item.worldPosition.map((v,i)=>v-parent.worldPosition[i])),item.orbit,1e-9);}
 }
 await shot('real-earth');details.realDimensions=real;
 checks.push('All 23 rendered radii and orbital radii share one kilometre unit; selected view and time preserved');
 await page.locator('#scale-button').click();await page.waitForTimeout(100);
 const restored=await snap();for(const item of restored.bodies){const previous=before.bodies.find(b=>b.id===item.id);relative(item.radius,previous.radius,1e-12);relative(item.orbit,previous.orbit,1e-12);}
 checks.push('Observation scale restores without dimension drift');
 await page.locator('#system-button').click();await page.waitForTimeout(1450);const obsSystem=await snap();await shot('observation-earth-moon');
 await page.locator('#scale-button').click();await page.waitForTimeout(250);const realSystem=await snap();assert.equal(realSystem.view,'system');await shot('real-earth-moon');
 const find=(s,id)=>s.bodies.find(x=>x.id===id);
 assert.ok(find(realSystem,'moon').orbit/find(realSystem,'earth').radius>60);
 details.earthMoon={observation:obsSystem,real:realSystem};
 checks.push('Earth-Moon system switches to the actual size-distance ratio in a fitted system view');
 for(const body of bodies){
  if(body.type==='moon'){
   const toggle=page.locator('.moon-toggle[data-parent="'+body.parent+'"]');if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
  }
  await page.locator('#body-nav [data-body="'+body.id+'"]').click();await page.waitForTimeout(1400);
  const current=await snap(),selected=find(current,body.id);
  assert.equal(current.mode,'real');assert.ok(current.near<selected.radius*.1);assert.ok(Number.isFinite(current.cameraDistance));
  assert.ok(Math.hypot(...selected.localPosition)<1e-8,'Origin not rebased for '+body.id);
  current.sunLight.forEach((v,i)=>relative(v,-current.origin[i],1e-12));
  if(['deimos','phobos','titan','triton'].includes(body.id))await shot('real-'+body.id);
 }
 checks.push('All 23 targets remain reachable in real scale, including smallest moons; light and floating origin agree');
 await page.locator('#pause-button').click();await page.waitForTimeout(1200);
 const moving=await snap();assert.ok(Math.hypot(...find(moving,'triton').localPosition)<1e-8);details.moving=await page.evaluate(()=>window.__solarApp.getDiagnostics());
 await page.locator('#pause-button').click();checks.push('Moving real-scale Triton remains centred');
 await page.locator('#home-button').click();await page.waitForTimeout(1750);await shot('real-overview');
 assert.equal((await snap()).view,'overview');
 await page.locator('[data-mode="size"]').click();await page.selectOption('#compare-a','earth');await page.selectOption('#compare-b','moon');await page.waitForTimeout(300);
 assert.equal(await page.locator('#scale-button').isVisible(),false);assert.match(await page.locator('#comparison-content').textContent(),/3.67/);await shot('size-after-real');
 await page.locator('[data-mode="distance"]').click();await page.waitForTimeout(150);
 await page.locator('[data-mode="explore"]').click();await page.waitForTimeout(1450);
 assert.equal(await page.locator('#scale-button').getAttribute('aria-pressed'),'true');
 await page.locator('#scale-button').click();assert.equal((await snap()).mode,'observation');
 await page.locator('#body-nav [data-body="earth"]').click();await page.waitForTimeout(1400);await shot('restored-earth');
 checks.push('Size and distance comparison stay independent; real-scale preference survives returning to exploration');
 for(const width of [1100,680,390]){await page.setViewportSize({width,height:900});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);}
 checks.push('New control fits desktop and compact widths');
 assert.equal(errors.length,0);assert.equal(failed.length,0);
 console.log(JSON.stringify({checks,errors,failed,range:drag,moving:details.moving}));
}finally{
 await fs.writeFile(out+'/validation.json',JSON.stringify({checks,details,errors,failed},null,2));await browser.close();
}
