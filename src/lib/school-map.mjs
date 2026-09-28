export const SCHOOL_ROOMS_KEY = 'med25-school-rooms-v1';
export const SCHOOL_MAP_CENTER = [51.395, 35.706];
// These are translations of named OSM features, not invented building identities.
export const CAMPUS_PLACES = [
  {id:'way-671524505',name:'School of Medicine',aliases:['medicine','medical school','پزشکی'],kind:'school'},
  {id:'way-413428280',name:'School of Pharmacy',aliases:['pharmacy','داروسازی'],kind:'school'},
  {id:'way-423685536',name:'Dentistry / dental research building',aliases:['dentistry','dental','دندانپزشکی'],kind:'school'},
  {id:'node-10139044543',name:'School of Public Health',aliases:['public health','بهداشت'],kind:'school'},
  {id:'way-483125898',name:'Ibn Sina Hall',aliases:['ebnesina','avicenna','ibn sina','ابن سینا','ابن‌سینا','hall'],kind:'hall'},
  {id:'node-4680178608',name:'TUMS campus',aliases:['tehran medical','tehran university of medical sciences','دانشگاه علوم پزشکی تهران'],kind:'campus'},
];
export function normalizeSearch(value){
  return String(value??'').normalize('NFKC').toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d]/g,' ').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/\s+/g,' ').trim();
}
export function matchesSearch(place,query){
  const tokens=normalizeSearch(query).split(' ').filter(Boolean);
  const text=normalizeSearch([place.name,place.nativeName,...(place.aliases??[]),place.floor,place.number,place.notes,place.buildingName].join(' '));
  return tokens.every(token=>text.includes(token));
}
export function featureCenter(feature){
  const first=feature.points[0],last=feature.points.at(-1);
  const closed=feature.points.length>1&&first[0]===last[0]&&first[1]===last[1];
  const points=closed?feature.points.slice(0,-1):feature.points;
  return [points.reduce((n,p)=>n+p[0],0)/points.length,points.reduce((n,p)=>n+p[1],0)/points.length];
}
export function projectLocation([lon,lat]){
  return [(lon-SCHOOL_MAP_CENTER[0])*111320*Math.cos(SCHOOL_MAP_CENTER[1]*Math.PI/180),-(lat-SCHOOL_MAP_CENTER[1])*111320];
}
export function campusDirectory(features){
  return CAMPUS_PLACES.flatMap(place=>{
    const feature=features.find(f=>f.id===place.id);
    return feature?[{...place,nativeName:feature.tags['name:fa']??feature.tags.name,coordinates:featureCenter(feature),sourceUrl:feature.osmUrl,sourceLabel:'OpenStreetMap location; confirm access locally',positionQuality:'building-area'}]:[];
  });
}
export function googleMapsUrl(place,mode='search'){
  const query=place.coordinates?`${place.coordinates[1]},${place.coordinates[0]}`:`${place.name}, Tehran University of Medical Sciences, Tehran`;
  const p=new URLSearchParams({api:'1',...(mode==='directions'?{destination:query,travelmode:'walking'}:{query})});
  return `https://www.google.com/maps/${mode==='directions'?'dir':'search'}/?${p}`;
}
// No documented public destination-prefill contract was available. Open Snapp's
// official ride entry and offer explicit copy/share of the destination instead.
export const SNAPP_URL='https://snapp.ir/taxi-ride/';
export function destinationText(place){
  return `${place.name}${place.nativeName?' / '+place.nativeName:''}\nTehran University of Medical Sciences, Poursina Street, Tehran${place.coordinates?'\n'+place.coordinates[1].toFixed(6)+', '+place.coordinates[0].toFixed(6):''}\n${googleMapsUrl(place)}`;
}
export function parseRooms(raw,buildingIds){
  const data=typeof raw==='string'?JSON.parse(raw):raw;
  if(!data||data.version!==1||!Array.isArray(data.rooms)||data.rooms.length>500)throw new Error('Use a version 1 room directory with at most 500 rooms.');
  const ids=new Set();
  const rooms=data.rooms.map(room=>{
    if(!room||typeof room.id!=='string'||!/^room-[\w-]{1,75}$/.test(room.id)||ids.has(room.id))throw new Error('Room IDs must start with room- and be unique letters, numbers or hyphens (80 characters maximum).');
    ids.add(room.id);
    if(!buildingIds.includes(room.buildingId))throw new Error('Every room must reference a building in this map.');
    if(typeof room.name!=='string'||!room.name.trim()||room.name.length>120)throw new Error('Every room needs a name of 1–120 characters.');
    const result={id:room.id,buildingId:room.buildingId,name:room.name.trim()};
    for(const key of ['floor','number','notes','source']){
      if(room[key]!==undefined&&typeof room[key]!=='string')throw new Error(`Invalid ${key}.`);
      result[key]=(room[key]??'').slice(0,key==='notes'?1000:160);
    }
    return result;
  });
  return rooms;
}
