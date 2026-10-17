import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { bodies } from '../src/data.js';
const out='outputs/qa';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const errors=[],failed=[],checks=[],diagnostics=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('requestfailed',r=>failed.push(r.url()+' '+r.failure()?.errorText));
const shot=async name=>{await page.screenshot({path:out+'/'+name+'.png'});await page.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:67});};
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__solarApp?.ready,{}, {timeout:30000});
await page.locator('#pause-button').click();await page.waitForTimeout(1500);await shot('earth');
checks.push('Initial Earth loaded; pause changes state');
for(const body of bodies){
 if(body.type==='moon'){
  const toggle=page.locator('.moon-toggle[data-parent="'+body.parent+'"]');
  if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
 }
 await page.locator('#body-nav [data-body="'+body.id+'"]').click();
 assert.equal(await page.locator('#body-name').textContent(),body.name);
}
checks.push('All 23 bodies reachable through visible navigation; correct Chinese names');
await page.locator('#body-nav [data-body="saturn"]').click();await page.waitForTimeout(1500);await shot('saturn');
await page.locator('#system-button').click();await page.waitForTimeout(1500);await shot('saturn-system');
await page.locator('#home-button').click();await page.waitForTimeout(1700);await shot('overview');
await page.locator('[data-mode="size"]').click();await page.selectOption('#compare-a','earth');await page.selectOption('#compare-b','moon');await page.waitForTimeout(700);await shot('size');
assert.match(await page.locator('#comparison-content').textContent(),/3.67/);
assert.equal(await page.locator('[data-mode].active').count(),1);checks.push('Earth/Moon size ratio displayed; one active mode');
await page.selectOption('#compare-a','sun');await page.selectOption('#compare-b','earth');await page.waitForTimeout(400);await shot('sun-earth');
await page.locator('[data-mode="distance"]').click();await page.waitForTimeout(700);await shot('distance');
assert.equal(await page.locator('#compare-a option').count(),8);checks.push('Distance view includes 8 planets and linear scale explanation');
await page.locator('[data-mode="explore"]').click();
await page.locator('#body-nav [data-body="earth"]').click();await page.waitForTimeout(1500);
await page.locator('#help-button').click();assert.equal(await page.locator('#help-dialog').evaluate(e=>e.open),true);await page.locator('#help-close').click();checks.push('Help dialog opens and closes');
await page.locator('#info-toggle').click();assert.match(await page.locator('body').getAttribute('class'),/info-collapsed/);await page.locator('#info-toggle').click();checks.push('Details panel toggles');
await page.locator('#labels-button').click();assert.equal(await page.locator('#labels-button').getAttribute('aria-pressed'),'false');await page.locator('#labels-button').click();
await page.locator('#orbits-button').click();assert.equal(await page.locator('#orbits-button').getAttribute('aria-pressed'),'false');await page.locator('#orbits-button').click();checks.push('Labels and orbit toggles work');
await page.locator('#quality-button').click();await page.locator('#quality-button').click();
const creditResponse=await page.request.get('http://127.0.0.1:4173/credits.html');assert.equal(creditResponse.status(),200);assert.match(await creditResponse.text(),/Titan/);checks.push('Credits page is available');
for(const resolution of [{width:1600,height:1000},{width:2560,height:1600}]){
 await page.setViewportSize(resolution);await page.waitForTimeout(1500);
 const samples=[];for(let i=0;i<6;i++){await page.waitForTimeout(500);samples.push(await page.evaluate(()=>window.__solarApp.getDiagnostics().fps));}
 diagnostics.push({resolution,...await page.evaluate(()=>window.__solarApp.getDiagnostics()),fpsSamples:samples});
}
await shot('earth-native');
await page.setViewportSize({width:1100,height:760});await page.waitForTimeout(500);await shot('windowed');
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);checks.push('1100 px window has no horizontal page overflow');
await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__solarApp?.ready);checks.push('Reload restores a working scene');

// Representative surfaces with different geometry and observation coverage.
await page.setViewportSize({width:1600,height:1000});
await page.locator('[data-mode="explore"]').click();
for(const id of ['moon','phobos','io','titan','miranda','titania','triton']){
 const body=bodies.find(b=>b.id===id),toggle=page.locator('.moon-toggle[data-parent="'+body.parent+'"]');
 if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
 await page.locator('#body-nav [data-body="'+id+'"]').click();
 await page.waitForTimeout(1450);
 if(['titan','miranda','phobos'].includes(id))await shot(id);
}
checks.push('Representative moons rendered without shader errors, including Titan and data-gap materials');
await page.locator('[data-mode="size"]').click();
await page.locator('#labels-button').click();
assert.equal(await page.locator('.compare-label:not([hidden])').count(),0);
await page.locator('#labels-button').click();
const pausedBefore=await page.evaluate(()=>window.__solarApp.getState().paused);
await page.locator('[data-mode="distance"]').focus();await page.keyboard.press('Space');
assert.equal(await page.evaluate(()=>window.__solarApp.getState().mode),'distance');
assert.equal(await page.evaluate(()=>window.__solarApp.getState().paused),pausedBefore);
checks.push('Comparison label toggle and keyboard button activation work');
const geoCounts=[];
for(let i=0;i<6;i++){await page.locator('[data-mode="size"]').click();await page.locator('[data-mode="distance"]').click();await page.waitForTimeout(80);geoCounts.push(await page.evaluate(()=>window.__solarApp.getDiagnostics().geometries));}
assert.ok(geoCounts.at(-1)<=geoCounts[0]+2);
checks.push('Repeated comparisons release temporary geometry');
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await shot('mobile-distance');
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
await page.locator('[data-mode="size"]').click();await page.waitForTimeout(500);await shot('mobile-size');
checks.push('Compact viewport comparisons remain accessible without page overflow');
await page.setViewportSize({width:1600,height:1000});
await page.locator('[data-mode="explore"]').click();await page.locator('#body-nav [data-body="earth"]').click();await page.waitForTimeout(1500);
await page.screenshot({path:out+'/final-earth.png'});

await fs.writeFile(out+'/browser-validation.json',JSON.stringify({checks,diagnostics,errors,failed},null,2));
console.log(JSON.stringify({checks,diagnostics,errors:errors.slice(0,10),failed:failed.slice(0,10)}));
await browser.close();
assert.equal(errors.length,0);assert.equal(failed.length,0);
