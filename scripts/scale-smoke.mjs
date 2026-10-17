import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__solarApp?.ready);
 await page.locator('#pause-button').click();await page.locator('#system-button').click();await page.waitForTimeout(1450);
 await page.locator('#scale-button').click();await page.waitForTimeout(450);
 assert.equal(await page.locator('.planet-label[data-id="uranus"]').isVisible(),false);
 assert.equal(await page.locator('#scale-button').getAttribute('aria-pressed'),'true');
 await page.screenshot({path:'outputs/qa/scale-update/real-earth-moon.png'});
 await page.screenshot({path:'outputs/qa/scale-update/real-earth-moon.jpg',type:'jpeg',quality:65});
 await page.locator('#help-button').click();assert.match(await page.locator('.help-science-note').textContent(),/真实比例/);await page.locator('#help-close').click();
 const credits=await page.request.get('http://127.0.0.1:4173/credits.html');assert.equal(credits.status(),200);assert.match(await credits.text(),/真实比例/);
 assert.equal(errors.length,0);
 const result={passed:true,errors,scale:await page.evaluate(()=>window.__solarApp.getState().scale),checks:['Production ready','Focused true Earth-Moon view','Scale button state','Help and credits updated']};
 await fs.writeFile('outputs/qa/scale-update/final-smoke.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
