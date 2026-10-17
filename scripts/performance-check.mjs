import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__solarApp?.ready);
 const samples=[];
 for(const viewport of [{width:1600,height:1000},{width:2560,height:1600}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(1800);
  const frames=[];for(let i=0;i<6;i++){await page.waitForTimeout(500);frames.push(await page.evaluate(()=>window.__solarApp.getDiagnostics().fps));}
  samples.push({viewport,...await page.evaluate(()=>window.__solarApp.getDiagnostics()),motion:await page.evaluate(()=>!window.__solarApp.getState().paused),fpsSamples:frames});
 }
 await page.screenshot({path:'outputs/qa/earth-native.png'});
 await page.locator('#quality-button').click();await page.waitForTimeout(1300);samples.push({quality:'light',...await page.evaluate(()=>window.__solarApp.getDiagnostics())});
 await page.setViewportSize({width:1600,height:1000});await page.locator('#quality-button').click();await page.waitForTimeout(500);await page.screenshot({path:'outputs/qa/final-earth.png'});
 await fs.writeFile('outputs/qa/moving-performance.json',JSON.stringify({samples,errors},null,2));console.log(JSON.stringify({samples,errors}));
}finally{await browser.close();}
