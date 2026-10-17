import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=process.cwd(),stage=path.join(root,'outputs/portable/solar-system-explorer-2026-09-19'),extracted=path.join(root,'outputs/qa/portable smoke 20260919/solar-system-explorer-2026-09-19');
async function files(dir,prefix=''){const result=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const relative=path.join(prefix,entry.name);if(entry.isDirectory())result.push(...await files(path.join(dir,entry.name),relative));else result.push(relative);}return result;}
const list=await files(stage);
for(const file of list){const a=await fs.readFile(path.join(stage,file)),b=await fs.readFile(path.join(extracted,file));assert.ok(a.equals(b),'Archive mismatch: '+file);}
assert.equal(list.some(p=>p.startsWith('node_modules')),false);
const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const child=spawn(process.execPath,[path.join(extracted,'scripts/serve.mjs'),'--port='+port],{cwd:extracted,windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
let browser;
try{
 const url='http://127.0.0.1:'+port;
 let ready=false;for(let i=0;i<30;i++){try{const r=await fetch(url+'/__health');ready=(await r.json()).application==='solar-system-explorer';if(ready)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 assert.ok(ready,'Extracted server did not start: '+output);
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push(r.url()));
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__solarApp?.ready,{}, {timeout:30000});
 const diagnostics=await page.evaluate(()=>window.__solarApp.getDiagnostics());assert.equal(diagnostics.bodies,23);assert.deepEqual(diagnostics.failures,[]);
 await page.locator('#scale-button').click();assert.equal(await page.evaluate(()=>window.__solarApp.getState().scale),'real');
 assert.equal((await page.request.get(url+'/credits.html')).status(),200);
 assert.equal(errors.length,0);assert.equal(failed.length,0);
 const zip=await fs.readFile(path.join(root,'outputs/portable/solar-system-explorer-2026-09-19.zip'));
 const result={passed:true,files:list.length,archiveBytes:zip.length,sha256:crypto.createHash('sha256').update(zip).digest('hex'),runtime:process.version,checks:['All extracted files match archive staging','Starts from relocated directory with spaces','No node_modules or original project path needed','23 bodies and textures loaded','Real scale switch available','Credits preserved'],errors,failed};
 await fs.writeFile(path.join(root,'outputs/portable/validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{if(browser)await browser.close();child.kill();}
