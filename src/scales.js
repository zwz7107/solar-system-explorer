export const TRUE_SCALE_KM_PER_UNIT = 1000;
export const OBSERVATION_ORBITS = {mercury:19,venus:27,earth:37,mars:48,jupiter:70,saturn:95,uranus:122,neptune:150};
export const OBSERVATION_RADII = {sun:6.5,mercury:.75,venus:1.36,earth:1.45,mars:1.05,jupiter:4.1,saturn:3.5,uranus:2.5,neptune:2.4};

/** Real mode uses one length unit for body radii and parent-centred orbital radii. */
export function getBodyDimensions(body, catalog, mode='observation') {
 if(mode==='real')return {radius:body.radiusKm/TRUE_SCALE_KM_PER_UNIT,orbit:body.distanceKm/TRUE_SCALE_KM_PER_UNIT};
 if(mode!=='observation')throw new Error('Unknown scale mode: '+mode);
 const parent=catalog.find(b=>b.id===body.parent),parentRadius=OBSERVATION_RADII[body.parent]||1.45;
 const radius=OBSERVATION_RADII[body.id]??Math.max(.14,parentRadius*body.radiusKm/parent.radiusKm);
 const siblings=catalog.filter(b=>b.parent===body.parent&&b.type==='moon').sort((a,b)=>a.distanceKm-b.distanceKm);
 const index=siblings.findIndex(b=>b.id===body.id);
 const orbit=body.type==='moon'?parentRadius*2.7+(index+1)*parentRadius*1.7:(OBSERVATION_ORBITS[body.id]||0);
 return {radius,orbit};
}
