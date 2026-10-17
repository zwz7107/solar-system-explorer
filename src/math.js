export const AU_KM = 149597870.7;
export function diameterRatio(a,b) { return Math.max(a.radiusKm,b.radiusKm)/Math.min(a.radiusKm,b.radiusKm); }
export function sizeLayout(a,b) {
 const k=3.25/Math.max(a.radiusKm,b.radiusKm);
 return [{id:a.id,r:a.radiusKm*k,x:-3.8,y:a.radiusKm*k-3.25},{id:b.id,r:b.radiusKm*k,x:3.8,y:b.radiusKm*k-3.25}];
}
export function distancePosition(km,maxKm,width=24) { return -width/2+width*km/maxKm; }
export function formatNumber(n, digits=1) { return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:digits}).format(n); }
export function formatDistance(km) {
 if(km>=1e8) return formatNumber(km/1e8,2)+' 亿千米';
 if(km>=1e4) return formatNumber(km/1e4,1)+' 万千米';
 return formatNumber(km,0)+' 千米';
}
export function formatPeriod(days) {
 if(days>=365.25) return formatNumber(days/365.25,2)+' 地球年';
 if(days<1) return formatNumber(days*24,1)+' 小时';
 return formatNumber(days,2)+' 天';
}
export function validateCatalog(bodies) {
 const ids=new Set(bodies.map(b=>b.id));
 if(ids.size!==bodies.length) throw new Error('天体标识重复');
 for(const b of bodies) {
  if(!(b.radiusKm>0)) throw new Error(b.id+' 半径无效');
  if(b.parent&&!ids.has(b.parent)) throw new Error(b.id+' 母体不存在');
  if(b.parent&&!(b.distanceKm>b.radiusKm)) throw new Error(b.id+' 轨道距离无效');
  if(b.parent&&!(b.orbitalDays>0)) throw new Error(b.id+' 公转周期无效');
 }
 const byId=Object.fromEntries(bodies.map(b=>[b.id,b]));
 for(const body of bodies) {
  const seen=new Set();let current=body;
  while(current){if(seen.has(current.id))throw new Error(body.id+' 父体关系存在循环');seen.add(current.id);current=current.parent?byId[current.parent]:null;}
 }
 return true;
}
