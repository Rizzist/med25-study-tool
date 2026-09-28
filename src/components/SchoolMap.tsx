"use client";
import dynamic from 'next/dynamic';
import {useEffect,useMemo,useState,type FormEvent} from 'react';
import {StudyIcon} from './StudyIcon';
import {campusDirectory,destinationText,featureCenter,googleMapsUrl,matchesSearch,parseRooms,SCHOOL_ROOMS_KEY,SNAPP_URL,type CampusData,type CampusPlace,type SchoolRoom} from '@/src/lib/school-map.mjs';
const Scene=dynamic(()=>import('./SchoolMapScene'),{ssr:false,loading:()=> <div className="school-scene-placeholder" role="status">Loading 3D viewer…</div>});

export function SchoolMap(){
  const [data,setData]=useState<CampusData|null>(null);
  const [loadError,setLoadError]=useState('');
  const [retry,setRetry]=useState(0);
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('all');
  const [selected,setSelected]=useState('way-671524505');
  const [rooms,setRooms]=useState<SchoolRoom[]>([]);
  const [storageReady,setStorageReady]=useState(false);
  const [notice,setNotice]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [mapExpanded,setMapExpanded]=useState(false);
  useEffect(()=>{
    const abort=new AbortController();setLoadError('');
    fetch('/study/school-map/campus.json',{signal:abort.signal,cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('Map download failed.');return response.json();}).then(value=>{if(value.version!==1||!Array.isArray(value.features))throw new Error('Invalid campus data.');setData(value);}).catch(error=>{if(error.name!=='AbortError')setLoadError('The campus map could not load. Check your connection and retry.');});
    return()=>abort.abort();
  },[retry]);
  const places=useMemo(()=>data?campusDirectory(data.features):[],[data]);
  const buildings=useMemo(()=>data?.features.filter(f=>f.tags.building)??[],[data]);
  useEffect(()=>{
    if(!data)return;
    try{const saved=localStorage.getItem(SCHOOL_ROOMS_KEY);if(saved)setRooms(parseRooms(saved,buildings.map(f=>f.id)));}catch{setNotice('Saved rooms could not be read. The original browser entry has not been overwritten.');}
    setStorageReady(true);
  },[data,buildings]);
  const roomPlaces=useMemo(()=>rooms.map(room=>{
    const building=buildings.find(b=>b.id===room.buildingId)!;
    const name=places.find(p=>p.id===room.buildingId)?.name??building?.tags['name:en']??building?.tags.name??'Mapped building';
    return {...room,kind:'room',buildingName:name,coordinates:building?featureCenter(building):undefined,sourceLabel:'Your room note · building-level pin only'} as CampusPlace;
  }),[rooms,buildings,places]);
  const results=[...places,...roomPlaces].filter(place=>(filter==='all'||(filter==='rooms'?place.kind==='room':place.kind!=='room'))&&matchesSearch(place,query));
  const selectedRoom=rooms.find(r=>r.id===selected);
  const featureId=selectedRoom?.buildingId??selected;
  const feature=data?.features.find(f=>f.id===featureId);
  const active=places.find(p=>p.id===selected)??roomPlaces.find(p=>p.id===selected)??(feature?{id:feature.id,name:feature.tags['name:en']??feature.tags.name??'Unnamed mapped building',kind:'building',coordinates:featureCenter(feature),sourceUrl:feature.osmUrl,sourceLabel:'OpenStreetMap footprint · use local signage to identify'} as CampusPlace:undefined);
  function saveRooms(next:SchoolRoom[]){
    if(!storageReady)return;
    setRooms(next);
    try{localStorage.setItem(SCHOOL_ROOMS_KEY,JSON.stringify({version:1,rooms:next}));setNotice('Room directory saved on this device.');}catch{setNotice('Rooms are available for this visit, but local storage is unavailable. Export a backup.');}
  }
  async function copyDestination(){
    if(!active)return;
    try{await navigator.clipboard.writeText(destinationText(active));setNotice('Destination copied. Paste it into Snapp and confirm the arrival point.');}catch{setNotice('Clipboard is unavailable. Select and copy the destination text below.');}
  }
  function addRoom(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const values=new FormData(event.currentTarget);
    const room={id:`room-${crypto.randomUUID()}`,buildingId:String(values.get('buildingId')),name:String(values.get('name')),number:String(values.get('number')),floor:String(values.get('floor')),notes:String(values.get('notes')),source:String(values.get('source'))};
    try{const next=parseRooms({version:1,rooms:[...rooms,room]},buildings.map(b=>b.id));saveRooms(next);setSelected(room.id);setShowAdd(false);setFilter('all');setQuery('');}catch(error){setNotice(error instanceof Error?error.message:'Room could not be added.');}
  }
  function exportRooms(){
    const blob=new Blob([JSON.stringify({version:1,rooms},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='med25-tums-rooms.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className={`school-map-page${mapExpanded?' expanded':''}`} aria-labelledby="school-map-title">
    <header className="school-map-heading"><div><span className="school-eyebrow">Beyond the classroom</span><h1 id="school-map-title">School Map <span>TUMS · central Tehran</span></h1></div><button type="button" onClick={()=>setMapExpanded(!mapExpanded)}>{mapExpanded?'Exit expanded view':'Expand map'}</button></header>
    <p className="school-scope-note">Find a building, save your classroom, plan your arrival. <strong>Room locations and current class allocations need your timetable or a school directory.</strong> This is not a complete indoor map.</p>
    {loadError?<div className="school-map-error" role="alert">{loadError} <button onClick={()=>setRetry(n=>n+1)}>Retry map download</button></div>:!data?<div className="school-scene-placeholder" role="status">Downloading campus footprints and locations…</div>:<div className="school-map-grid">
      <aside className="school-directory" aria-label="Campus directory">
        <label className="school-search"><StudyIcon name="search"/><input type="search" placeholder="Building, room, class… / جستجو" aria-label="Search buildings, rooms and classes" value={query} onChange={e=>setQuery(e.target.value)}/></label>
        <div className="school-filters" role="group" aria-label="Location type">{[['all','All'],['buildings','Buildings'],['rooms','My rooms']].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
        <small className="school-result-count">{results.length} location{results.length===1?'':'s'} · English / فارسی</small>
        <div className="school-location-list">{results.map(place=><button key={place.id} className={selected===place.id?'selected':''} aria-pressed={selected===place.id} onClick={()=>setSelected(place.id)}><StudyIcon name={place.kind==='room'?'book':'map'}/><span><b>{place.name}</b><small dir="auto">{place.kind==='room'?`${place.buildingName}${place.floor?' · Floor '+place.floor:''}`:place.nativeName}</small></span><span aria-hidden="true">›</span></button>)}{!results.length&&<p className="school-empty">{filter==='rooms'&&!rooms.length?'No room notes yet. Add the classroom and building from your timetable.':'No matching location. Try the Persian name, or add a room from your timetable.'}</p>}</div>
        <div className="school-room-actions"><button onClick={()=>setShowAdd(!showAdd)} disabled={!storageReady}>{showAdd?'Close room form':'+ Add room / class'}</button><button onClick={exportRooms} disabled={!rooms.length}>Export rooms</button><label className="school-import">Import rooms<input type="file" accept="application/json,.json" aria-label="Import room directory JSON" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;e.target.value='';try{if(file.size>500000)throw new Error('Room directory is too large (500 KB maximum).');const incoming=parseRooms(await file.text(),buildings.map(b=>b.id));const merged=[...rooms];for(const room of incoming){const old=merged.find(r=>r.id===room.id);if(old&&JSON.stringify(old)!==JSON.stringify(room))throw new Error('An imported room conflicts with a saved room. No changes made.');if(!old)merged.push(room);}saveRooms(parseRooms({version:1,rooms:merged},buildings.map(b=>b.id)));}catch(error){setNotice(error instanceof Error?error.message:'Could not import rooms.');}}}/></label></div>
      </aside>
      <div className="school-map-stage"><Scene data={data} places={places} selected={featureId} onSelect={setSelected}/><div className="school-map-attribution"><a href={data.license} target="_blank" rel="noopener noreferrer">{data.attribution} · ODbL</a><span>Snapshot {data.retrievedAt.slice(0,10)} · not live access information</span></div></div>
      {active&&<aside className="school-location-detail" aria-label="Selected location"><div><span className="school-eyebrow">{selectedRoom?'Your room / class':'Selected destination'}</span><h2>{active.name}</h2><p dir="auto">{active.nativeName??active.buildingName}</p></div><p className="school-location-source">{active.sourceLabel}</p>{selectedRoom&&<dl><dt>Room</dt><dd>{selectedRoom.number||'Not specified'}</dd><dt>Floor</dt><dd>{selectedRoom.floor||'Not specified'}</dd><dt>Notes / classes</dt><dd>{selectedRoom.notes||'No notes'}</dd><dt>Your source</dt><dd>{selectedRoom.source||'Not supplied'}</dd></dl>}
        <p className="school-arrival-note">Pin marks the <strong>building area</strong>, not a verified entrance or taxi pickup point. Confirm the gate and room with campus staff.</p>
        <div className="school-travel-links"><a href={googleMapsUrl(active)} target="_blank" rel="noopener noreferrer"><StudyIcon name="map"/>Open Google Maps ↗</a><a href={googleMapsUrl(active,'directions')} target="_blank" rel="noopener noreferrer">Walking directions ↗</a><button onClick={copyDestination}><StudyIcon name="check"/>Copy destination</button><a href={SNAPP_URL} target="_blank" rel="noopener noreferrer" className="school-snapp">Open Snapp ↗</a></div>
        <small>For Snapp: copy the destination, open Snapp, then choose your pickup point and confirm the destination and fare there. No ride is booked by MED25.</small>
        <details><summary>Destination text & source</summary><textarea readOnly aria-label="Destination to copy" value={destinationText(active)}/>{active.sourceUrl&&<a href={active.sourceUrl} target="_blank" rel="noopener noreferrer">View mapped source ↗</a>}</details>
        {selectedRoom&&<button className="school-remove-room" onClick={()=>{if(window.confirm(`Remove your local note for ${selectedRoom.name}?`)){saveRooms(rooms.filter(r=>r.id!==selectedRoom.id));setSelected(selectedRoom.buildingId);}}}>Remove room note</button>}
      </aside>}
    </div>}
    {showAdd&&<form className="school-room-form" onSubmit={addRoom}><h2>Add your classroom</h2><p>Saved only on this device. The map highlights its building; it does not invent an indoor position.</p><div className="school-form-fields"><label>Room / class name<input name="name" required maxLength={120} placeholder="Name from your timetable"/></label><label>Mapped building<select name="buildingId" defaultValue={buildings.some(b=>b.id===featureId)?featureId:'way-671524505'}>{buildings.map(b=><option key={b.id} value={b.id}>{places.find(p=>p.id===b.id)?.name??b.tags['name:en']??b.tags.name??`Unnamed footprint (${b.id})`}</option>)}</select></label><label>Room number<input name="number" maxLength={80}/></label><label>Floor / level<input name="floor" maxLength={80} placeholder="Only if known"/></label><label>Source<input name="source" maxLength={160} placeholder="Timetable, school directory, confirmed visit…"/></label><label>Classes / directions<textarea name="notes" maxLength={1000}/></label></div><button className="primary" type="submit">Save room</button></form>}
    <p className="school-map-notice" role="status">{notice}</p>
    <details className="school-data-notes"><summary>Map coverage & campus resources</summary><p>School Map currently covers the central Poursina campus area, not every TUMS site. Building footprints and locations come from OpenStreetMap; heights without source measurements are illustrative. No verified room polygons, floor plans, entrance accessibility or live teaching timetable were available. Neighboring University of Tehran buildings are context, not TUMS teaching-room assignments.</p><p><a href="https://t.me/TUMS_mentoring/482" target="_blank" rel="noopener noreferrer">School of Medicine mentoring channel / campus guide ↗</a> · <a href="https://medicine.tums.ac.ir/" target="_blank" rel="noopener noreferrer">School of Medicine ↗</a></p><p>Room imports use <code>{'{"version":1,"rooms":[…]}'}</code>. Export a saved room to use as a template. Fields: id, buildingId, name, number, floor, notes, source. Imports merge without silently replacing your notes.</p></details>
  </section>;
}
