import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campusDirectory,CAMPUS_PLACES,featureCenter,projectLocation,matchesSearch,normalizeSearch,googleMapsUrl,destinationText,parseRooms,SNAPP_URL} from '../src/lib/school-map.mjs';
import {DEFAULT_SPLIT,clampSplit,readSplit,splitAtPointer} from '../src/lib/mcq/guided-split.mjs';
const data=JSON.parse(readFileSync(new URL('../public/study/school-map/campus.json',import.meta.url)));
const buildings=data.features.filter(f=>f.tags.building).map(f=>f.id);
const places=campusDirectory(data.features);
test('Guided split clamps, restores and computes pointer movement safely',()=>{
  assert.equal(DEFAULT_SPLIT,54);assert.equal(readSplit(null),54);assert.equal(readSplit(''),54);assert.equal(readSplit('bad'),54);
  assert.equal(readSplit('62'),62);assert.equal(clampSplit(5),30);assert.equal(clampSplit(90),70);
  assert.equal(splitAtPointer(700,100,1000),60);assert.equal(splitAtPointer(100,100,0),54);
});
test('Every curated destination resolves to a sourced snapshot location',()=>{
  assert.equal(data.version,1);assert.equal(places.length,CAMPUS_PLACES.length);assert.equal(places.length,6);
  assert.ok(data.attribution.includes('OpenStreetMap'));assert.equal(new Set(data.features.map(f=>f.id)).size,data.features.length);
  for(const place of places){assert.match(place.sourceUrl,/^https:\/\/www.openstreetmap.org\/(way|node)\/\d+$/);assert.ok(place.nativeName);const [lon,lat]=place.coordinates;assert.ok(lon>51.39&&lon<51.4&&lat>35.70&&lat<35.71);}
  assert.deepEqual(projectLocation([51.395,35.706]),[0,-0]);
});
test('Open polylines keep endpoints; polygon closure is not double-counted',()=>{
  assert.deepEqual(featureCenter({points:[[1,1],[3,3]]}),[2,2]);
  assert.deepEqual(featureCenter({points:[[1,1],[3,3],[1,1]]}),[2,2]);
});
test('Search supports English, Persian variants, room numbers and classes',()=>{
  assert.equal(normalizeSearch('كلاس ۲۰۳'), 'کلاس 203');
  assert.equal(matchesSearch(places[0],'medical school'),true);
  assert.equal(matchesSearch(places[0],'پزشکی'),true);
  assert.equal(matchesSearch({name:'Anatomy',number:'۲۰۳',notes:'Dissection class'},'203 dissection'),true);
  assert.equal(matchesSearch(places[0],'pharmacy'),false);
});
test('Google URLs use latitude then longitude and Snapp never auto-books',()=>{
  const place=places[0];const map=new URL(googleMapsUrl(place));const directions=new URL(googleMapsUrl(place,'directions'));
  assert.equal(map.searchParams.get('api'),'1');assert.equal(map.searchParams.get('query'),`${place.coordinates[1]},${place.coordinates[0]}`);
  assert.equal(directions.searchParams.get('travelmode'),'walking');assert.equal(directions.searchParams.has('origin'),false);
  assert.ok(destinationText(place).includes(place.name));assert.equal(new URL(SNAPP_URL).hostname,'snapp.ir');
});
test('Room import rejects unknown buildings, duplicates, huge rosters and malformed fields',()=>{
  const room={id:'room-qa',buildingId:buildings[0],name:' Room 3 ',floor:'2',number:'3',notes:'Anatomy',source:'Timetable',extra:'ignored'};
  const valid=parseRooms({version:1,rooms:[room]},buildings);assert.equal(valid[0].name,'Room 3');assert.equal(valid[0].extra,undefined);
  for(const bad of [{version:2,rooms:[]},{version:1,rooms:[room,room]},{version:1,rooms:[{...room,id:buildings[0]}]},{version:1,rooms:[{...room,buildingId:'made-up'}]},{version:1,rooms:[{...room,floor:2}]},{version:1,rooms:Array(501).fill(room)}])assert.throws(()=>parseRooms(bad,buildings));
});
test('Map is lazy, uses measured footprints and keeps source limitations visible',()=>{
  const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../src/components/SchoolMap.tsx',import.meta.url),'utf8');
  const scene=readFileSync(new URL('../src/components/SchoolMapScene.tsx',import.meta.url),'utf8');
  assert.match(page,/const SchoolMap = dynamic/);assert.match(ui,/const Scene=dynamic/);
  assert.match(scene,/illustrative heights/);assert.match(ui,/not a complete indoor map/);
  assert.match(scene,/renderer\.dispose\(\)/);assert.match(scene,/\[data,places,fallback\]/);
});
