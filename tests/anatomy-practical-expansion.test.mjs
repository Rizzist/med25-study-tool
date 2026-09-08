import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {practicalMeshModules} from '../src/lib/anatomy3d/manifests/practical-mesh-structures.mjs';
import {practicalLandmarkModules} from '../src/lib/anatomy3d/manifests/practical-landmarks.mjs';
import {lowerPracticalConnective} from '../src/lib/anatomy3d/manifests/practical-connective.mjs';
import {listAnatomyModules} from '../src/lib/anatomy3d/registry.ts';
import {buildAnatomyQuestions,anatomyValidationErrors} from '../src/lib/mcq/dynamic-anatomy.mjs';
import {buildLocationQuestions} from '../src/lib/mcq/anatomy-location.mjs';
import {layoutCalloutBadges} from '../src/lib/anatomy3d/callout-layout.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const practical=JSON.parse(read('data/term2/anatomy-practical-images.json')).images;
const manifests=listAnatomyModules().map(m=>m.manifest);

test('unreviewed study-only and gallery-only figures never become graded questions',()=>{
  const reviewed=practical.find(image=>image.regions.length>=4&&!image.galleryOnly&&!image.studyOnly);
  assert(buildAnatomyQuestions([reviewed]).length>0);
  assert.deepEqual(buildAnatomyQuestions([{...reviewed,studyOnly:true}]),[]);
  assert.deepEqual(buildAnatomyQuestions([{...reviewed,galleryOnly:true}]),[]);
  assert.match(read('src/components/anatomy3d/AnatomyLabelGame.tsx'),/!image\.galleryOnly&&!image\.studyOnly/);
});

test('new pairings and retained history share a catalog while fresh sessions omit superseded views',()=>{
  assert.match(read('src/components/anatomy3d/PairedAnatomyMedia.tsx'),/allStudyImages as images/);
  const trainer=read('src/components/anatomy3d/AnatomyTrainer.tsx');
  assert.match(trainer,/parseAnatomySession\([^;]*restorePool/);
  assert.match(trainer,/currentIds\.has\(question\.anatomy\.imageId\)/);
  assert.match(trainer,/<div hidden=\{exploring\}>/);
  const gallery=read('src/components/anatomy3d/AnatomyStudyGallery.tsx');
  assert.match(gallery,/sourceNumber!=null/);assert.match(gallery,/markerMode === "label"&&!numbered/);
  const game=read('src/components/anatomy3d/AnatomyLabelGame.tsx');
  assert.match(game,/layoutCalloutBadges\(board\.image\.regions/);
  assert.match(game,/onDrop=\{event=>\{event\.preventDefault\(\);event\.stopPropagation\(\);place\(region\.id/);
  assert.match(game,/image\.id===rememberedBoardId/);
});

test('dense numbered badges remain distinct on phone and laptop without changing source anchors',()=>{
  const image=practical.find(i=>i.id==='gap-2d-humerus-distal');
  for(const width of [280,900]){
    const height=width*image.height/image.width;
    const badges=layoutCalloutBadges(image.regions,width,height);
    for(const [index,badge] of badges.entries()){
      const source=image.regions[index];assert.equal(badge.anchorX,(source.x+source.width/2)*width);assert.equal(badge.id,source.id);
      for(const other of badges.slice(index+1))assert(Math.abs(other.x-badge.x)>=badge.size||Math.abs(other.y-badge.y)>=badge.size,'Displayed numbered buttons overlap');
    }
  }
});

test('source-preserving supplements have 55 separately named meshes and valid group aliases',()=>{
  assert.equal(practicalMeshModules['upper-limb'].structures.length,15);
  assert.equal(practicalMeshModules['lower-limb'].structures.length,40);
  for(const [key,module] of Object.entries(practicalMeshModules)){
    const bytes=readFileSync(new URL('../public'+module.asset,import.meta.url));
    assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
    const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
    assert.equal(gltf.meshes.length,module.structures.length);
    const ids=new Set(manifests.find(m=>m.modelKey===key).structures.map(s=>s.id));
    for(const group of module.groups){assert(ids.has(group.id));assert.equal(new Set(group.members).size,group.members.length);assert(group.members.every(id=>ids.has(id)),group.id);}
  }
  assert.equal(practicalMeshModules['upper-limb'].groups.find(g=>g.id==='carpal-bones').members.length,8);
  const foot=practicalMeshModules['lower-limb'];
  assert.equal(foot.groups.find(g=>g.id==='metatarsal-bones').members.length,5);
  assert.equal(foot.groups.find(g=>g.id==='toe-phalanges').members.length,14);
  assert.equal(foot.structures.filter(s=>s.id.includes('hallux-sesamoid')).length,2);
});

test('49 landmark pins retain their actual parent bones and explicit approximate fidelity',()=>{
  assert.equal(practicalLandmarkModules['upper-limb'].length,18);assert.equal(practicalLandmarkModules['lower-limb'].length,31);
  for(const [key,markers] of Object.entries(practicalLandmarkModules))for(const marker of markers){
    assert(marker.schematic);assert(marker.position.every(Number.isFinite));
    assert(manifests.find(m=>m.modelKey===key).structures.some(s=>s.id===marker.landmarkOf),marker.id);
    assert(marker.keyPoints.some(text=>/not an independently segmented/i.test(text)),marker.id);
  }
});

test('cartilage samples exclude the intercondylar attachment area and fovea region',()=>{
  assert.equal(lowerPracticalConnective.structures.length,11);assert.equal(lowerPracticalConnective.cartilage.length,6);
  const tibia=lowerPracticalConnective.cartilage.find(s=>s.id==='practical-tibial-plateau-cartilage');
  assert.deepEqual(tibia.vertexRegions,[{axis:0,lessThanOrEqual:-.033},{axis:0,greaterThanOrEqual:-.002}]);
  const head=lowerPracticalConnective.cartilage.find(s=>s.boneId==='femur'&&s.sphere);
  assert.deepEqual(head.vertexRegions,[{axis:1,greaterThanOrEqual:.490}]);
  assert.match(head.label,/sample/);assert.match(read('src/lib/anatomy3d/models/practical-connective.ts'),/vertices\.every/);
  const cfl=lowerPracticalConnective.structures.find(s=>s.id==='practical-calcaneofibular-ligament');
  assert(cfl.paths[0][0][1]>cfl.paths[0].at(-1)[1]);assert(cfl.paths[0][0][2]>cfl.paths[0].at(-1)[2]);
});

test('original figures are accessible, questions have unique choices, and reverse direction remains available',()=>{
  assert(practical.length>=22);
  const numbered=practical.filter(i=>i.studyRegions?.some(region=>region.sourceNumber));
  assert.equal(numbered.reduce((sum,i)=>sum+i.studyRegions.length,0),131);
  assert.equal(numbered.reduce((sum,i)=>sum+i.regions.length,0),118);
  for(const image of practical)assert(existsSync(new URL('../public/study/'+image.path,import.meta.url)),image.id);
  const questions=buildAnatomyQuestions(practical.filter(i=>i.regions.length>=4&&!i.galleryOnly));
  assert(questions.length>=620);
  for(const q of questions){assert.deepEqual(anatomyValidationErrors(q),[],q.id);assert.equal(new Set(q.options.map(o=>o.text.toLowerCase())).size,4);}
  const reverse=buildLocationQuestions(questions.filter(q=>q.id.endsWith('-v1')));
  assert(reverse.length>=310);assert(reverse.every(q=>q.anatomy.responseMode==='locate'));
});

test('book-only checklist gaps are visible, not promoted to modeled or exam-certified coverage',()=>{
  const data=JSON.parse(read('data/term2/anatomy-practical-coverage.json')).modules;
  assert.equal(data['lower-limb'].rows.length,379);
  assert.equal(data['lower-limb'].rows.filter(r=>!r.status.startsWith('3d')).length,168);
  assert.equal(data['lower-limb'].rows.filter(r=>r.status==='book-reference').length,42);
  assert.equal(data['lower-limb'].rows.filter(r=>r.status==='regional-context').length,9);
  assert(data['upper-limb'].rows.some(r=>r.id==='latissimus-dorsi-muscle'&&r.status!=='3d-scan'));
});

test('gallery renders both directions and all-region navigation; immersive document and plain wheel allow scrolling',async()=>{
  const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Gallery from './src/components/anatomy3d/AnatomyStudyGallery';export const render=examId=>renderToStaticMarkup(<Gallery examId={examId} onExit={()=>{}} onExplore={()=>{}}/>);`,loader:'tsx',resolveDir:root},platform:'node',format:'cjs',bundle:true,packages:'external',write:false,alias:{'@':root}});
  const compiled={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),compiled,compiled.exports);
  for(const exam of ['term2-cvs','term2-respiratory','term2-limbs']){
    const html=compiled.exports.render(exam);assert.match(html,/Study · labeled/);assert.match(html,/Practice · find the label/);assert.match(html,/Previous figure/);assert.match(html,/Next figure/);assert.match(html,/Hide labels/);assert.match(html,/All anatomy/);
  }
  assert.match(read('app/globals.css'),/html:has\(\.anatomy-test-immersive\),body:has\(\.anatomy-test-immersive\)\{[^}]*overflow-y:auto/);
  assert.match(read('src/components/anatomy3d/AnatomyViewer.tsx'),/if \(!event\.ctrlKey && !event\.altKey\) return/);
});
