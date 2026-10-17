import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4174',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__solarApp?.ready);
 const nativeSupport=await page.evaluate(()=>!!document.modelContext?.registerTool);
 const initial=await page.evaluate(()=>window.__solarApp.getDiagnostics());assert.equal(initial.bodies,23);assert.deepEqual(initial.failures,[]);
 const checks=['Static Site loads 23 bodies and local textures'];
 if(!nativeSupport){
  await page.addInitScript(()=>{window.__registeredSiteTools={};Object.defineProperty(document,'modelContext',{configurable:true,value:{registerTool(tool){window.__registeredSiteTools[tool.name]=tool;}}});});
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__solarApp?.ready);
  assert.equal(await page.evaluate(()=>Object.keys(window.__registeredSiteTools).length),4);
  await page.evaluate(()=>window.__registeredSiteTools.navigate_to_celestial_body.execute({body_id:'moon'}));
  assert.equal(await page.evaluate(()=>window.__solarApp.getState().selected),'moon');
  await page.evaluate(()=>window.__registeredSiteTools.set_exploration_scale.execute({scale:'real'}));
  assert.equal(await page.evaluate(()=>window.__solarApp.getState().scale),'real');
  await page.evaluate(()=>window.__registeredSiteTools.compare_celestial_bodies.execute({comparison:'size',first:'earth',second:'moon'}));
  assert.match(await page.locator('#comparison-content').textContent(),/3.67/);
  const invalid=await page.evaluate(async()=>{const before=JSON.stringify(window.__solarApp.getState());try{await window.__registeredSiteTools.compare_celestial_bodies.execute({comparison:'distance',first:'moon',second:'earth'});return false;}catch{return before===JSON.stringify(window.__solarApp.getState());}});
  assert.equal(invalid,true);
  const reading=await page.evaluate(()=>window.__registeredSiteTools.read_explorer_state.execute({}));assert.equal(reading.availableBodyIds.length,23);
  checks.push('Mock registration and all 4 callbacks validated; invalid distance input preserves state');
 }
 assert.equal(errors.length,0);
 const result={passed:true,checks,errors,nativeWebMCP:nativeSupport?'available':'unavailable in this browser; only mocked callback validation performed',deployedUrlFetched:false};
 await fs.mkdir('outputs/sites',{recursive:true});await fs.writeFile('outputs/sites/local-validation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
