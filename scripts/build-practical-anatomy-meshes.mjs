// Explicit asset-generation step. Inputs are independently audited BodyParts3D descriptors.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const root = path.resolve(import.meta.dirname, '..');
const inputs = process.argv.slice(2);
if (!inputs.length) throw new Error('Supply reviewed mesh descriptor JSON files');
const modules = {}, provenance = {};
const bundles = new Map();
for (const input of inputs) {
  const bundle = JSON.parse(fs.readFileSync(input, 'utf8'));
  const previous = bundles.get(bundle.modelKey);
  bundles.set(bundle.modelKey, previous ? {...previous, included:[...previous.included,...bundle.included], groupReplacements:[...(previous.groupReplacements ?? []),...(bundle.groupReplacements ?? [])]} : bundle);
}
for (const bundle of bundles.values()) {
  const { modelKey } = bundle;
  if (!['upper-limb', 'lower-limb'].includes(modelKey)) throw new Error('Unexpected module');
  const chunks = [], accessors = [], bufferViews = [], meshes = [], nodes = [];
  let bytes = 0;
  function accessor(values, type, componentType, bounds = {}) {
    const buffer = Buffer.from(values.buffer, values.byteOffset, values.byteLength);
    const view = bufferViews.length;
    bufferViews.push({buffer:0,byteOffset:bytes,byteLength:buffer.length});
    chunks.push(buffer);bytes += buffer.length;
    if (bytes % 4) {const pad = Buffer.alloc(4 - bytes % 4);chunks.push(pad);bytes += pad.length;}
    accessors.push({bufferView:view,componentType,count:values.length/(type==='VEC3'?3:1),type,...bounds});
    return accessors.length - 1;
  }
  const seen = new Set();
  provenance[modelKey] = { source: bundle.attribution, revision: bundle.revision, files: [] };
  for (const entry of bundle.included) {
    if (seen.has(entry.id)) throw new Error(`Duplicate ID ${entry.id}`);
    seen.add(entry.id);
    for (const file of entry.files) {
      const raw = fs.readFileSync(file.localPath);
      const sha256 = createHash('sha256').update(raw).digest('hex');
      if (sha256 !== file.sha256) throw new Error(`Source changed: ${entry.id}`);
      provenance[modelKey].files.push({structureId:entry.id,sourceUrl:file.sourceUrl,sourcePath:file.sourcePath,sha256,transform:entry.transform});
      new OBJLoader().parse(raw.toString('utf8')).traverse(object => {
        if (!object.isMesh) return;
        const geometry = mergeVertices(object.geometry, 1e-8);
        const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
        const {scale,translate:[tx,ty,tz]} = entry.transform;
        if (![scale,tx,ty,tz].every(Number.isFinite) || scale <= 0) throw new Error('Invalid frame');
        for (let i=0;i<positions.count;i++) {
          const [x,y,z] = [positions.getX(i),positions.getY(i),positions.getZ(i)];
          positions.setXYZ(i,x*scale+tx,z*scale+ty,-y*scale+tz);
          if (normals) {const [nx,ny,nz]=[normals.getX(i),normals.getY(i),normals.getZ(i)];normals.setXYZ(i,nx,nz,-ny);}
        }
        if (!normals) geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        const attributes = {POSITION:accessor(positions.array,'VEC3',5126,{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()}),NORMAL:accessor(geometry.getAttribute('normal').array,'VEC3',5126)};
        const indices=geometry.index;
        const primitive={attributes,...(indices?{indices:accessor(indices.array,'SCALAR',indices.array instanceof Uint16Array?5123:5125)}:{})};
        const mesh=meshes.length;meshes.push({name:entry.id,primitives:[primitive]});
        nodes.push({name:entry.id,mesh,extras:{structureId:entry.id,sourceFidelity:'scan-derived'}});
      });
    }
  }
  const gltf={asset:{version:'2.0',generator:'MED25 reviewed practical mesh packer',copyright:`${bundle.attribution.author}; ${bundle.attribution.license}`},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes,accessors,bufferViews,buffers:[{byteLength:bytes}]};
  let json=Buffer.from(JSON.stringify(gltf));if(json.length%4)json=Buffer.concat([json,Buffer.alloc(4-json.length%4,32)]);
  const head=Buffer.alloc(20);head.writeUInt32LE(0x46546c67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(28+json.length+bytes,8);head.writeUInt32LE(json.length,12);head.writeUInt32LE(0x4e4f534a,16);
  const bin=Buffer.alloc(8);bin.writeUInt32LE(bytes);bin.writeUInt32LE(0x004e4942,4);
  const asset=`/anatomy3d/practical-detail/${modelKey}.glb`;
  fs.mkdirSync(path.join(root,'public/anatomy3d/practical-detail'),{recursive:true});
  fs.writeFileSync(path.join(root,'public',asset),Buffer.concat([head,json,bin,...chunks]));
  modules[modelKey]={asset,source:bundle.attribution,structures:bundle.included.map(entry=>({id:entry.id,label:entry.label,tissue:entry.tissue,description:entry.description,keyPoints:entry.keyPoints?.length?entry.keyPoints:[entry.description],...(entry.aliases?.length?{aliases:entry.aliases}:{}),difficulty:2,schematic:false})),groups:bundle.groupReplacements.filter(group=>group.coverage.startsWith('complete')).map(group=>({id:group.id,members:group.members}))};
  console.log(`${modelKey}: ${bundle.included.length} structures, ${meshes.length} mesh components`);
}
fs.writeFileSync(path.join(root,'src/lib/anatomy3d/manifests/practical-mesh-structures.mjs'),`// Generated from independently reviewed source mesh descriptors.\nexport const practicalMeshModules = ${JSON.stringify(modules,null,2)};\nexport const practicalMeshStructures = key => practicalMeshModules[key]?.structures ?? [];\n`);
fs.writeFileSync(path.join(root,'public/anatomy3d/practical-detail/source-attribution.json'),JSON.stringify(provenance,null,2)+'\n');
