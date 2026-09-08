import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const input=process.argv[2];if(!input)throw new Error('Supply reviewed connective tissue descriptors');
const bundle=JSON.parse(fs.readFileSync(input,'utf8'));
const cfl=bundle.structures.find(item=>item.id==='practical-calcaneofibular-ligament');
if(cfl){
  cfl.paths[0][0]=[0.02426330745,-0.85107427835,-0.05792367458];
  cfl.paths[0][1]=[0.025,-0.87455064058,-0.06595539301];
  cfl.description='Oblique ligament from the depression anterior to the lateral-malleolar apex, passing posteroinferiorly to the lateral calcaneus; crosses the ankle and subtalar joints.';
}
// Independent triangle-level review: avoid coating non-articular attachment areas.
for(const item of bundle.cartilage){
  if(item.id==='practical-tibial-plateau-cartilage'){
    item.vertexRegions=[{axis:0,lessThanOrEqual:-0.033},{axis:0,greaterThanOrEqual:-0.002}];
    item.label='Tibial plateau cartilage · medial/lateral samples';
    item.limitations='Two conservative articular-facet samples. Every vertex excludes the central intercondylar eminence and attachment area; exact cartilage margins are not segmented. Gray 42 Figure 78.13.';
  }
  if(item.boneId==='femur'&&item.sphere){
    item.vertexRegions=[{axis:1,greaterThanOrEqual:0.490}];
    item.label='Femoral-head cartilage · superior sample';
    item.limitations='Partial superior articular sample only, excluding the posteroinferior fovea region. Not the complete cartilage surface or a segmented foveal margin. Gray 42 Chapter 77.';
  }
  if(item.boneId==='patella'){
    item.label='Patellar cartilage · posterior sample';
    item.limitations='Representative posterior articular-surface sample, not the complete medial/lateral/odd facet cartilage margins.';
  }
}
const normalize=item=>({...item,keyPoints:[item.description,item.limitations],difficulty:2,schematic:true});
const config={structures:bundle.structures.map(normalize),cartilage:bundle.cartilage.map(normalize)};
fs.writeFileSync(path.join(root,'src/lib/anatomy3d/manifests/practical-connective.mjs'),`// Source-grounded diagrammatic routes and surface masks, not segmented soft tissue.\nexport const lowerPracticalConnective = ${JSON.stringify(config,null,2)};\nexport const lowerPracticalConnectiveStructures = [...lowerPracticalConnective.structures,...lowerPracticalConnective.cartilage].map(({id,label,tissue,description,keyPoints,difficulty,schematic})=>({id,label,tissue,description,keyPoints,difficulty,schematic}));\n`);
fs.writeFileSync(path.join(root,'data/term2/provenance/practical-anatomy/connective-evidence.json'),JSON.stringify(bundle,null,2)+'\n');
