import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),dist=path.join(root,'dist'),out=path.join(root,'outputs/portable/solar-system-explorer-offline-2026-09-19');
try{await fs.access(out);throw new Error('Offline output already exists; inspect before replacing.');}catch(e){if(e.code!=='ENOENT')throw e;}
let html=await fs.readFile(path.join(dist,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
const styles=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
assert.equal(scripts.length,1);assert.equal(styles.length,1);
let js=await fs.readFile(path.join(dist,scripts[0][1].slice(1)),'utf8');
const css=await fs.readFile(path.join(dist,styles[0][1].slice(1)),'utf8');
assert.ok(!/<\/script/i.test(js));assert.ok(!/<\/style/i.test(css));
const manifest=JSON.parse(await fs.readFile(path.join(dist,'textures/manifest.json'),'utf8'));
const types={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
let embeddedTextures=0;
for(const entry of Object.values(manifest)){
 for(const key of ['map','clouds','night','ring','bump','normal']){
  if(typeof entry[key]!=='string'||!entry[key].startsWith('/textures/'))continue;
  const image=await fs.readFile(path.join(dist,entry[key].slice(1))),type=types[path.extname(entry[key])];
  assert.ok(type);entry[key]='data:'+type+';base64,'+image.toString('base64');embeddedTextures++;
 }
}
assert.equal(embeddedTextures,25);
const fetchPattern=/fetch\((["'\x60])\/textures\/manifest\.json\1\)/g;
assert.equal([...js.matchAll(fetchPattern)].length,1);
js=js.replace(fetchPattern,"Promise.resolve({ok:true,json:async()=>JSON.parse(document.getElementById('embedded-textures').textContent)})");
assert.ok(js.includes('/credits.html'));js=js.replaceAll('/credits.html','./credits.html');
const data=JSON.stringify(manifest).replaceAll('<','\\u003c');
html=html.replace(scripts[0][0],()=>'<script id="embedded-textures" type="application/json">'+data+'</script>\n<script type="module">'+js+'</script>');
html=html.replace(styles[0][0],()=>'<style>'+css+'</style>');
assert.ok(!/src="\/assets\//.test(html));assert.ok(!/href="\/assets\//.test(html));
let credits=await fs.readFile(path.join(dist,'credits.html'),'utf8');credits=credits.replaceAll('href="./"','href="./solar-system-explorer.html"');
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'solar-system-explorer.html'),html);
await fs.writeFile(path.join(out,'credits.html'),credits);
await fs.copyFile(path.join(root,'node_modules/three/LICENSE'),path.join(out,'THIRD-PARTY-NOTICES.txt'));
await fs.writeFile(path.join(out,'README.txt'),[
'太阳系探索 — 浏览器离线版',
'更新：2026-09-19',
'',
'使用方法：',
'1. 完整解压压缩包。',
'2. 双击 solar-system-explorer.html，用 Edge 或 Chrome 打开。',
'3. 不需要安装 Node.js，不需要启动服务，也不需要联网下载场景素材。',
'',
'请保留整个文件夹：credits.html是资料与素材来源页，THIRD-PARTY-NOTICES.txt保留软件许可。',
'',
'包含23个天体、大小和距离比较、观察比例/真实比例切换，以及已修复的时间流速填充。',
'程序、样式和全部25张纹理已内嵌在主网页中。点击官方来源链接时需要联网。',
'',
'需要支持WebGL 2的现代浏览器。已在本机Edge浏览器验证；其他设备的画质和流畅度依其硬件而定。',
'',
'这是运行体验版本，不包含项目开发源码。',
''
].join('\r\n'));
console.log(JSON.stringify({out,htmlBytes:Buffer.byteLength(html),embeddedTextures,files:await fs.readdir(out)}));
