import {BufferGeometry,CatmullRomCurve3,ExtrudeGeometry,Float32BufferAttribute,Group,Matrix3,Mesh,Object3D,Shape,Vector3} from 'three';
import {lowerPracticalConnective} from '../manifests/practical-connective.mjs';
import {tissueMaterial} from '../materials.ts';

export function addLowerPracticalConnective(scene:Group,structures:Map<string,Object3D[]>){
  function add(id:string,mesh:Mesh){mesh.name=id;mesh.userData={structureId:id,schematic:true,sourceFidelity:'diagrammatic'};scene.add(mesh);structures.set(id,[...(structures.get(id)??[]),mesh]);}
  for(const item of lowerPracticalConnective.structures){
    for(const points of item.paths){
      const curve=new CatmullRomCurve3(points.map(point=>new Vector3(...point)),false,'centripetal');
      const shape=new Shape(),r=item.radius,thickness=r*.18;
      shape.moveTo(-r,-thickness);shape.lineTo(r,-thickness);shape.lineTo(r,thickness);shape.lineTo(-r,thickness);shape.closePath();
      const geometry=new ExtrudeGeometry(shape,{extrudePath:curve,steps:28,bevelEnabled:false});
      add(item.id,new Mesh(geometry,tissueMaterial(item.tissue)));
    }
  }
  scene.updateMatrixWorld(true);
  for(const item of lowerPracticalConnective.cartilage){
    const positions:number[]=[],normals:number[]=[];
    for(const object of structures.get(item.boneId)??[]){
      const mesh=object as Mesh;if(!mesh.geometry)continue;
      const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
      if(!geometry.getAttribute('normal'))geometry.computeVertexNormals();
      const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
      const normalMatrix=new Matrix3().getNormalMatrix(mesh.matrixWorld);
      for(let i=0;i<p.count;i+=3){
        const vertices=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,i+j).applyMatrix4(mesh.matrixWorld));
        const ns=[0,1,2].map(j=>new Vector3().fromBufferAttribute(n,i+j).applyMatrix3(normalMatrix).normalize());
        const c=vertices.reduce((sum,v)=>sum.add(v),new Vector3()).multiplyScalar(1/3);
        if(c.toArray().some((value,axis)=>value<item.bounds.min[axis]||value>item.bounds.max[axis]))continue;
        if(item.sphere&&c.distanceTo(new Vector3(...item.sphere.center))>item.sphere.radius)continue;
        // Whole triangles must lie within a reviewed region. A centroid-only
        // exclusion can still bridge the non-articular intercondylar eminence.
        if(item.vertexRegions&&!item.vertexRegions.some(region=>vertices.every(vertex=>{
          const value=vertex.getComponent(region.axis);
          return (region.lessThanOrEqual===undefined||value<=region.lessThanOrEqual)&&(region.greaterThanOrEqual===undefined||value>=region.greaterThanOrEqual);
        })))continue;
        const mean=ns.reduce((sum,v)=>sum.add(v),new Vector3()).normalize();
        const constraint=item.normalConstraint;
        if(constraint){const value=mean.getComponent(constraint.axis);if(constraint.lessThan!==undefined&&value>=constraint.lessThan||constraint.greaterThan!==undefined&&value<=constraint.greaterThan)continue;}
        for(let j=0;j<3;j++){positions.push(...vertices[j].addScaledVector(ns[j],item.normalOffset).toArray());normals.push(...ns[j].toArray());}
      }
      geometry.dispose();
    }
    if(positions.length<9)throw new Error(`No safe cartilage surface for ${item.id}`);
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new Float32BufferAttribute(normals,3));
    const mesh=new Mesh(geometry,tissueMaterial('cartilage'));mesh.userData.geometryRole='approximate cartilage patch on bone surface';add(item.id,mesh);
  }
}
