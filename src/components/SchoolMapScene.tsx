"use client";
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {featureCenter,projectLocation,type CampusData,type CampusPlace} from '@/src/lib/school-map.mjs';

export default function SchoolMapScene({data,places,selected,onSelect}:{data:CampusData;places:CampusPlace[];selected:string;onSelect:(id:string)=>void}){
  const host=useRef<HTMLDivElement>(null);
  const api=useRef<{select:(id:string)=>void;home:()=>void;top:()=>void;zoom:(factor:number)=>void;focus:()=>void}|null>(null);
  const callback=useRef(onSelect);
  const [fallback,setFallback]=useState(false);
  const [ready,setReady]=useState(false);
  useEffect(()=>{callback.current=onSelect;},[onSelect]);
  useEffect(()=>{
    const current=host.current;if(!current||fallback)return;
    const element:HTMLDivElement=current;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch{setFallback(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setClearColor('#e7eee7');
    const canvas=renderer.domElement;canvas.setAttribute('aria-label','Interactive 3D TUMS campus map. Use the searchable location list and view controls for keyboard navigation.');canvas.setAttribute('role','img');element.prepend(canvas);
    const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(42,1,1,3000);
    const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.minDistance=65;controls.maxDistance=1300;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=true;
    scene.add(new THREE.HemisphereLight(0xffffff,0x6c806c,2.4));const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.position.set(-200,600,300);scene.add(sun);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(780,530),new THREE.MeshStandardMaterial({color:'#dce7d7',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;scene.add(ground);
    const grid=new THREE.GridHelper(800,40,0xc0cfbc,0xcad7c6);grid.position.y=.02;scene.add(grid);
    const meshes:THREE.Mesh[]=[];const points=new Map<string,THREE.Vector3>();
    for(const feature of data.features){
      const coordinates=feature.points.map(projectLocation);const [cx,cz]=projectLocation(featureCenter(feature));
      points.set(feature.id,new THREE.Vector3(cx,20,cz));
      if(feature.tags.building&&coordinates.length>=4&&Math.abs(cx)<370&&Math.abs(cz)<250){
        const shape=new THREE.Shape();coordinates.forEach(([x,z],i)=>{if(i===0)shape.moveTo(x,-z);else shape.lineTo(x,-z);});shape.closePath();
        // Only explicit height is a measured height. All other extrusions are illustrative.
        const sourceHeight=Number.parseFloat(feature.tags.height??'');const height=Number.isFinite(sourceHeight)?Math.max(3,Math.min(60,sourceHeight)):12;
        const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geometry.rotateX(-Math.PI/2);
        const named=places.some(p=>p.id===feature.id);
        const material=new THREE.MeshStandardMaterial({color:named?'#729b8a':'#b5c4ba',roughness:.88,metalness:0});
        const mesh=new THREE.Mesh(geometry,material);mesh.userData={id:feature.id,color:material.color.clone()};scene.add(mesh);meshes.push(mesh);points.set(feature.id,new THREE.Vector3(cx,height+3,cz));
        const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,25),new THREE.LineBasicMaterial({color:0x72897c,transparent:true,opacity:.5}));scene.add(edges);
      }else if(feature.tags.highway&&coordinates.length>=2){
        const geometry=new THREE.BufferGeometry().setFromPoints(coordinates.map(([x,z])=>new THREE.Vector3(x,.15,z)));
        scene.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({color:feature.tags.highway==='footway'?0xb5c3ac:0xffffff})));
      }
    }
    const marker=new THREE.Mesh(new THREE.ConeGeometry(5,15,16),new THREE.MeshStandardMaterial({color:0xe2aa3d}));marker.rotation.z=Math.PI;scene.add(marker);
    let active='';let disposed=false;
    const labelElements=places.map(place=>{
      const button=document.createElement('button');button.type='button';button.className='school-map-pin';button.textContent=place.name;button.setAttribute('aria-label',`Locate ${place.name}`);button.onclick=()=>callback.current(place.id);element.appendChild(button);
      return {button,place};
    });
    function render(){
      if(disposed)return;renderer.render(scene,camera);
      const width=element.clientWidth,height=element.clientHeight;
      const occupied:{left:number;top:number;right:number;bottom:number}[]=[];
      [...labelElements].sort((a,b)=>Number(b.place.id===active)-Number(a.place.id===active)).forEach(({button,place})=>{
        const position=(points.get(place.id)??new THREE.Vector3()).clone();position.y+=13;position.project(camera);
        const x=(position.x+1)*width/2,y=(1-position.y)*height/2;
        button.style.left=`${x}px`;button.style.top=`${y}px`;
        button.hidden=false;
        const rect={left:x-button.offsetWidth/2-3,right:x+button.offsetWidth/2+3,top:y-button.offsetHeight-3,bottom:y+3};
        button.hidden=position.z>1||position.z< -1||rect.left<0||rect.right>width||rect.top<60||rect.bottom>height-65||occupied.some(r=>rect.left<r.right&&rect.right>r.left&&rect.top<r.bottom&&rect.bottom>r.top);
        if(!button.hidden)occupied.push(rect);
        button.classList.toggle('selected',active===place.id);button.setAttribute('aria-pressed',String(active===place.id));
      });
    }
    function home(){camera.position.set(450,530,580);controls.target.set(0,0,0);controls.update();render();}
    function select(id:string){active=id;meshes.forEach(mesh=>{const material=mesh.material as THREE.MeshStandardMaterial;material.color.copy(mesh.userData.color);if(mesh.userData.id===id)material.color.set('#e8b551');});const point=points.get(id);marker.visible=!!point;if(point)marker.position.copy(point).add(new THREE.Vector3(0,16,0));render();}
    const resize=new ResizeObserver(()=>{const w=element.clientWidth,h=element.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();});resize.observe(element);
    controls.addEventListener('change',render);
    const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let start:[number,number]=[0,0];
    const down=(event:PointerEvent)=>{start=[event.clientX,event.clientY];};
    const up=(event:PointerEvent)=>{if(Math.hypot(event.clientX-start[0],event.clientY-start[1])>5)return;const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes)[0];if(hit)callback.current(hit.object.userData.id);};
    const lost=(event:Event)=>{event.preventDefault();setFallback(true);};
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('webglcontextlost',lost);
    api.current={select,home,top:()=>{camera.position.set(0,750,.1);controls.target.set(0,0,0);controls.update();render();},zoom:factor=>{camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();render();},focus:()=>{const p=points.get(active);if(p){controls.target.copy(p);camera.position.copy(p).add(new THREE.Vector3(110,160,160));controls.update();render();}}};
    home();setReady(true);
    return()=>{disposed=true;api.current=null;resize.disconnect();controls.removeEventListener('change',render);controls.dispose();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('webglcontextlost',lost);labelElements.forEach(({button})=>button.remove());scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose());}});renderer.dispose();canvas.remove();};
  },[data,places,fallback]);
  useEffect(()=>{api.current?.select(selected);},[selected,ready,data,places]);
  return <div className="school-scene-wrap">
    {!fallback&&<div ref={host} className="school-scene"/>}
    {fallback&&<div className="school-map-fallback"><p>3D is unavailable on this device. The map and destination list still work.</p><svg viewBox="-360 -240 720 480" role="img" aria-label="2D campus footprint map">{data.features.filter(f=>f.tags.building).map(f=><polygon key={f.id} points={f.points.map(p=>projectLocation(p).join(',')).join(' ')} fill={selected===f.id?'#e8b551':'#94b4a3'} stroke="#fff"/>)}{places.map(p=>{const [x,z]=projectLocation(p.coordinates!);return <g key={p.id}><circle cx={x} cy={z} r="5" fill="#126747"/><text x={x+7} y={z} fontSize="10">{p.name}</text></g>;})}</svg></div>}
    {!ready&&!fallback&&<p className="school-scene-loading" role="status">Building the campus view…</p>}
    {!fallback&&<div className="school-view-controls" role="group" aria-label="Map view controls"><button onClick={()=>api.current?.home()}>Reset view</button><button onClick={()=>api.current?.top()}>North ↑ · top view</button><button onClick={()=>api.current?.focus()}>Focus selected</button><button onClick={()=>api.current?.zoom(.8)} aria-label="Zoom in">+</button><button onClick={()=>api.current?.zoom(1.25)} aria-label="Zoom out">−</button></div>}
    <div className="school-map-legend"><span>Drag to orbit · scroll/pinch to zoom · right-drag/two fingers to pan</span><small>Mapped footprints · illustrative heights · no indoor floor plan</small></div>
  </div>;
}
