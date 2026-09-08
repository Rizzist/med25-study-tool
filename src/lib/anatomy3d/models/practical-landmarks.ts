import {Group,Mesh,Object3D,SphereGeometry} from 'three';
import {practicalLandmarkModules} from '../manifests/practical-landmarks.mjs';
import {tissueMaterial} from '../materials.ts';

/** Surface-pinned study markers are NOT manufactured bone surfaces. */
export function addPracticalLandmarks(scene:Group,structures:Map<string,Object3D[]>,modelKey:string){
  for(const landmark of practicalLandmarkModules[modelKey]??[]){
    if(!landmark.landmarkOf||!structures.get(landmark.landmarkOf)?.length)throw new Error(`Landmark has no parent bone: ${landmark.id}`);
    const marker=new Mesh(new SphereGeometry(landmark.radius,14,10),tissueMaterial('bone'));
    marker.position.set(...landmark.position);
    marker.name=landmark.id;
    marker.userData={structureId:landmark.id,schematic:true,landmarkOf:landmark.landmarkOf,sourceFidelity:'schematic',geometryRole:'surface landmark marker, not segmented anatomy'};
    scene.add(marker);structures.set(landmark.id,[marker]);
  }
}
