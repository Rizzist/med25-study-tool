import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Mesh, BoxGeometry, PerspectiveCamera, Vector3 } from 'three';
import { tissueMaterial, setSurfaceMode, applyHighlight, clearHighlight } from '../src/lib/anatomy3d/materials.ts';
import { frameStructure, orbitCamera } from '../src/lib/anatomy3d/camera.ts';
import { listAnatomyModules } from '../src/lib/anatomy3d/registry.ts';
import { buildModelLocationQuestions, locationOptionId, restoredLocationResponse } from '../src/lib/mcq/anatomy-location.mjs';
import { selectAnatomySession, parseAnatomySession } from '../src/lib/anatomy3d/visual-session.mjs';
import { placeAnatomyLabel, gradeAnatomyLabels, restoreLabelBoard } from '../src/lib/anatomy3d/label-game.mjs';

const manifests=listAnatomyModules().map(item=>item.manifest);
const modelItems=manifests.flatMap(manifest=>manifest.structures.filter(s=>s.quizable!==false).map(s=>({id:`test-${manifest.modelKey}-${s.id}`,kind:'dynamic_anatomy_3d',anatomy3d:{modelKey:manifest.modelKey,structureId:s.id},tags:[],options:[{id:'A',text:'irrelevant system label'}]})));
const modelLocations=buildModelLocationQuestions(modelItems,manifests);
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('solid surfaces are opaque by default; X-ray is explicit and target aliases remain solid',()=>{
  const geometry=new BoxGeometry();
  const artery=new Mesh(geometry,tissueMaterial('artery'));
  const vein=new Mesh(geometry,tissueMaterial('vein'));
  const nerve=new Mesh(geometry,tissueMaterial('nerve'));
  const envelope=new Mesh(geometry,tissueMaterial('cavity'));
  envelope.material.opacity=.05;
  const all=new Map([['artery',[artery]],['vein',[vein]],['nerve',[nerve]],['cavity',[envelope]],['group',[artery,vein]]]);
  const colors=[artery,vein,nerve].map(item=>item.material.color.getHex());
  assert.equal(new Set(colors).size,3);
  setSurfaceMode(all,'solid');
  for(const item of [artery,vein,nerve,envelope]){
    assert.equal(item.material.opacity,1);assert.equal(item.material.transparent,false);assert.equal(item.material.depthWrite,true);
  }
  setSurfaceMode(all,'xray','group');
  assert.equal(artery.material.opacity,1);assert.equal(vein.material.opacity,1);
  assert.equal(nerve.material.opacity,.18);assert.equal(envelope.material.opacity,.05);
  assert.equal(nerve.material.depthWrite,false);
  setSurfaceMode(all,'solid');
  assert.deepEqual([artery,vein,nerve].map(item=>item.material.color.getHex()),colors);
  for(const item of [artery,vein,nerve,envelope]){assert.equal(item.material.opacity,1);item.material.dispose();}
  geometry.dispose();
});

test('focus shader keeps anatomical colors, uses a clamped rim and clears its uniform',()=>{
  const mesh=new Mesh(new BoxGeometry(),tissueMaterial('nerve'));
  const color=mesh.material.color.getHex();
  applyHighlight([mesh]);
  const shader={uniforms:{},fragmentShader:'#include <opaque_fragment>'};
  mesh.material.onBeforeCompile(shader,{});
  assert.equal(shader.uniforms.anatomyFocus.value,1);
  assert.match(shader.fragmentShader,/pow\(clamp\(/);
  assert.match(shader.fragmentShader,/#include <opaque_fragment>/);
  assert.equal(mesh.material.color.getHex(),color);
  assert.equal(mesh.material.emissive.getHex(),color);
  clearHighlight([mesh]);assert.equal(shader.uniforms.anatomyFocus.value,0);
  applyHighlight([mesh]);assert.equal(shader.uniforms.anatomyFocus.value,1);
  const next={uniforms:{},fragmentShader:'#include <opaque_fragment>'};mesh.material.onBeforeCompile(next,{});
  assert.equal((next.fragmentShader.match(/uniform float anatomyFocus/g)??[]).length,1);
  mesh.geometry.dispose();mesh.material.dispose();
});

test('camera orbits the selected world target without moving anatomy, and fits portrait width',()=>{
  const mesh=new Mesh(new BoxGeometry(.3,.2,.4),tissueMaterial('bone'));mesh.position.set(1,2,3);
  const camera=new PerspectiveCamera(44,2,.01,100);
  const pose=frameStructure([mesh],camera);
  assert(pose.target.distanceTo(mesh.position)<1e-10);
  camera.position.copy(pose.position);camera.lookAt(pose.target);
  const distance=camera.position.distanceTo(pose.target),rotation=mesh.quaternion.clone();
  orbitCamera(camera,pose.target,120,30);
  assert(Math.abs(camera.position.distanceTo(pose.target)-distance)<1e-10);
  assert(mesh.quaternion.equals(rotation));assert(mesh.position.equals(new Vector3(1,2,3)));
  const look=camera.getWorldDirection(new Vector3());
  assert(look.dot(pose.target.clone().sub(camera.position).normalize())>.999999);
  camera.aspect=.35;
  const portrait=frameStructure([mesh],camera);
  assert(portrait.position.distanceTo(portrait.target)>distance);
  mesh.geometry.dispose();mesh.material.dispose();
});

test('all registered model targets support name-to-location grading, including aggregate aliases',()=>{
  assert.equal(modelLocations.length,650);
  for(const q of modelLocations){
    const target=manifests.find(m=>m.modelKey===q.anatomy3d.modelKey).structures.find(s=>s.id===q.anatomy3d.structureId);
    assert(q.prompt.includes(target.label));assert(!q.prompt.includes('irrelevant system label'));
    assert.equal(locationOptionId(q,target.id),'A');
    const wrong=q.anatomy3d.selectableStructures.find(s=>s.id!==target.id).id;
    assert.equal(locationOptionId(q,wrong),'B');assert.equal(locationOptionId(q,'unknown'),'C');
    assert.equal(restoredLocationResponse(q,wrong).selectedOptionId,'B');
  }
});

test('3D-only find sessions actually use 3D and restore location-derived scores',()=>{
  const selected=selectAnatomySession(modelLocations,{direction:'locate',format:'3d',count:25});
  assert.equal(selected.length,25);assert(selected.every(item=>item.initialView==='3d'));
  const q=selected[0].question,wrong=q.anatomy3d.selectableStructures.find(s=>s.id!==q.anatomy3d.structureId).id;
  const saved=parseAnatomySession(JSON.stringify({version:1,ids:[q.id],views:['2d'],locations:{[q.id]:wrong},answers:{[q.id]:'A'},feedback:'exam'}),modelLocations);
  assert.equal(saved.answers[q.id],'B');assert.equal(saved.items[0].initialView,'3d');assert.equal(saved.graded,false);
});

const labels=[{id:'a',label:'Alpha'},{id:'b',label:'Beta'},{id:'c',label:'Gamma'},{id:'d',label:'Alpha'}];
test('drag-label placement is one-to-one; invalid drops do not mutate the board',()=>{
  const start={a:'a',b:'b'};
  assert.equal(placeAnatomyLabel(start,'outside','a',labels,labels),start);
  assert.equal(placeAnatomyLabel(start,'a','untrusted payload',labels,labels),start);
  const moved=placeAnatomyLabel(start,'b','a',labels,labels);
  assert.deepEqual(moved,{b:'a'});assert.deepEqual(start,{a:'a',b:'b'});
  assert.equal(gradeAnatomyLabels(moved,labels,labels).filter(result=>result.correct).length,0);
  const duplicatedLabels={d:'a',a:'d',b:'b'};
  assert.equal(gradeAnatomyLabels(duplicatedLabels,labels,labels).filter(result=>result.correct).length,3);
});

test('game restores only valid IDs and recomputes grades, without trusting saved scores',()=>{
  const saved=restoreLabelBoard(JSON.stringify({version:1,boardId:'figure',labelIds:labels.map(l=>l.id),graded:true,score:100,assignments:{a:'b',outside:'c',b:'b'}}),'figure',labels,labels);
  assert.deepEqual(saved,{graded:true,assignments:{b:'b'}});
  assert.equal(gradeAnatomyLabels(saved.assignments,labels,labels).filter(result=>result.correct).length,1);
  const changed=restoreLabelBoard(JSON.stringify({version:1,boardId:'figure',labelIds:['a','b'],graded:true,assignments:{a:'a'}}),'figure',labels,labels);
  assert.deepEqual(changed,{graded:false,assignments:{a:'a'}},'New target inventory must be checked again');
  for(const raw of ['broken','null','{}',JSON.stringify({version:1,boardId:'other',assignments:{}})])assert.equal(restoreLabelBoard(raw,'figure',labels,labels),null);
});

test('cartilage uses pinned anatomical source geometry and all joint anchors are represented',()=>{
  const source=JSON.parse(read('public/anatomy3d/cvs/costal-cartilages.provenance.json'));
  const mesh=read('public/anatomy3d/cvs/costal-cartilages.obj');
  assert.equal(createHash('sha256').update(mesh).digest('hex'),source.output.sha256);
  assert.equal((mesh.match(/^o /gm)??[]).length,20);
  assert.equal(source.source.license,'CC-BY-SA 2.1 Japan');
  assert.doesNotMatch(JSON.stringify(source),/\/Users\//);
  const anchors=JSON.parse(read('src/lib/anatomy3d/models/cvs/sternocostal-anchors.json'));
  assert.equal(anchors.anchors.length,14);
  assert(anchors.anchors.every(item=>item.sourceGap<.001));
});

test('interaction UI guards cancellation, hidden locations and pre-feedback answer leakage',()=>{
  const game=read('src/components/anatomy3d/AnatomyLabelGame.tsx');
  const model=read('src/components/anatomy3d/ModelLocationQuestion.tsx');
  const viewer=read('src/components/anatomy3d/AnatomyViewer.tsx');
  assert.match(game,/onDragEnd=\{\(\)=>setSelected\(undefined\)\}/);
  assert.match(game,/event.key==='Escape'/);
  assert.match(game,/graded\|\|failed\|\|!modelReady\|\|!locationId\|\|!labelId\|\|hidden.has\(locationId\)/);
  assert.match(game,/setAssignments\(next\);setSelected\(undefined\);setKeyboardLocation\(undefined\)/);
  assert.match(model,/focusStructureId=\{revealed \? targetId : pending\}/);
  assert.match(model,/showLabels=\{revealed\}/);
  assert.match(model,/Submit location/);
  assert.doesNotMatch(viewer,/materialHelpers\.applyDim\(/);
  assert.match(viewer,/depthTest: false, depthWrite: false, clipping: true/);
});
