import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {CatmullRomCurve3,DoubleSide,Group,Mesh,Object3D,TubeGeometry,Vector3} from 'three';
import {practicalCompletion} from '../manifests/practical-completion.mjs';
import {tissueMaterial} from '../materials.ts';
import type {Tissue} from '../types.ts';

/** Shared baked frame: attach before the model's single final normalization. */
export async function addPracticalCompletion(scene:Group,structures:Map<string,Object3D[]>,aliases:Map<string,string[]>){
  const loaded=await Promise.all(practicalCompletion.assets.map(asset=>new GLTFLoader().loadAsync(asset.path)));
  const replacements=new Map<Object3D,Object3D[]>();
  const metadata=new Map(practicalCompletion.structures.map(item=>[item.id,item]));
  const newMeshes=new Map<string,Object3D[]>();
  const referenceIds=new Set<string>();
  for(const [index,gltf] of loaded.entries()){
    const remainders=practicalCompletion.assets[index].path.endsWith('source-muscle-remainders.glb');
    const meshes:Mesh[]=[];
    gltf.scene.traverse(object=>{if((object as Mesh).isMesh)meshes.push(object as Mesh);});
    for(const mesh of meshes){
      let owner:Object3D|null=mesh;
      while(owner&&!owner.userData.structureId&&!owner.userData.referenceOnly)owner=owner.parent;
      const id=(owner?.userData.structureId??(owner?.userData.referenceOnly?mesh.name:undefined)) as string|undefined;
      if(!id){
        const ref=mesh.name;
        if(referenceIds.has(ref)){mesh.removeFromParent();mesh.geometry.dispose();continue;}
        referenceIds.add(ref);mesh.userData.referenceOnly=true;mesh.userData.tissue='bone';
        const old=mesh.material;mesh.material=tissueMaterial('bone');
        for(const material of Array.isArray(old)?old:[old])material.dispose();
        continue;
      }
      const item=metadata.get(id);
      if(owner?.userData.referenceOnly){if(referenceIds.has(id)){mesh.removeFromParent();mesh.geometry.dispose();continue;}referenceIds.add(id);}
      const tissue:Tissue=remainders?'muscle':item?.tissue??'cartilage';
      const old=mesh.material;mesh.material=tissueMaterial(tissue);mesh.material.side=DoubleSide;
      for(const material of Array.isArray(old)?old:[old])material.dispose();
      mesh.userData={...mesh.userData,structureId:id,tissue,schematic:remainders?false:item?.schematic??true,
        sourceFidelity:remainders?'scan-derived-partition':item?.sourceFidelity??'reconstructed',focusOnly:item?.focusOnly??false,
        landmarkOf:item?.landmarkOf,representation:item?.representation};
      newMeshes.set(id,[...(newMeshes.get(id)??[]),mesh]);
    }
    scene.add(gltf.scene);
  }
  // Redirect every aggregate alias before detaching originals, so groups cannot resurrect
  // overlapping full muscle surfaces after the reviewed tendon-end partition.
  for(const id of [...practicalCompletion.splitMuscleIds,...practicalCompletion.replaceProceduralIds]){
    const old=structures.get(id)??[], replacement=newMeshes.get(id)??[];
    for(const object of old)replacements.set(object,replacement);
    if(replacement.length)structures.set(id,replacement);else structures.delete(id);
  }
  for(const [id,objects] of structures)structures.set(id,[...new Set(objects.flatMap(object=>replacements.get(object)??[object]))]);
  for(const object of replacements.keys()){
    object.removeFromParent();const mesh=object as Mesh;mesh.geometry?.dispose();
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material?.dispose();
  }
  for(const [id,objects] of newMeshes)structures.set(id,objects);
  for(const group of practicalCompletion.groupAliases){
    const members=group.members.flatMap(id=>structures.get(id)??[]);
    if(group.members.some(id=>!structures.get(id)?.length))throw new Error(`Incomplete reconstructed group: ${group.id}`);
    structures.set(group.id,members);aliases.set(group.id,group.members);
  }
  for(const correction of practicalCompletion.parentRouteCorrections){
    const replacement=correction.paths.map(points=>{
      const mesh=new Mesh(new TubeGeometry(new CatmullRomCurve3(points.map(point=>new Vector3(...point))),32,.0045,7,false),tissueMaterial('nerve'));
      mesh.userData={structureId:correction.id,tissue:'nerve',schematic:true,sourceFidelity:'reconstructed'};
      scene.add(mesh);return mesh;
    });
    const old=structures.get(correction.id)??[];
    for(const [id,objects] of structures)structures.set(id,[...new Set(objects.flatMap(object=>old.includes(object)?replacement:[object]))]);
    structures.set(correction.id,replacement);
    for(const object of old){object.removeFromParent();const mesh=object as Mesh;mesh.geometry?.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material?.dispose();}
  }
  for(const item of practicalCompletion.structures)if(!structures.get(item.id)?.length)throw new Error(`Missing reconstructed anatomy: ${item.id}`);
}
