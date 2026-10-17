import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const arg=process.argv.find(x=>x.startsWith('--port='));
const port=arg?Number(arg.split('=')[1]):4173;
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid port');
const url='http://127.0.0.1:'+port;
const open=()=>{if(process.argv.includes('--open'))execFile('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true},()=>{});};
if(!existsSync(path.join(root,'index.html'))){console.error('Build first: npm run build');process.exit(1);}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,url).pathname);
  if(pathname==='/__health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({application:'solar-system-explorer',version:'1.0.0'}));return;}
  let file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  let s;try{s=await stat(file);}catch{res.writeHead(404);res.end('Not found');return;}
  if(s.isDirectory()){file=path.join(file,'index.html');s=await stat(file);}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':s.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
 }catch{res.writeHead(400);res.end('Bad request');}
});
server.on('error',async error=>{
 if(error.code==='EADDRINUSE'){
  try{const response=await fetch(url+'/__health',{signal:AbortSignal.timeout(1500)});const data=await response.json();if(data.application==='solar-system-explorer'){console.log('Already running: '+url);open();process.exit(0);}}catch{}
  console.error('Port '+port+' is occupied. Use --port=another-port.');process.exit(1);
 }
 console.error(error.message);process.exit(1);
});
server.listen(port,'127.0.0.1',()=>{console.log('Solar System Explorer: '+url);console.log('Press Ctrl+C to stop.');open();});
