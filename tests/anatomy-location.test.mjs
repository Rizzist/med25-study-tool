import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { buildAnatomyQuestions, anatomyValidationErrors } from '../src/lib/mcq/dynamic-anatomy.mjs';
import { buildLocationQuestions, locationOptionId, regionAtPoint, restoredLocationResponse, canRevealAnatomyFigure } from '../src/lib/mcq/anatomy-location.mjs';
import { selectAnatomySession, parseAnatomySession } from '../src/lib/anatomy3d/visual-session.mjs';
import { selectTerm2Sprint } from '../src/lib/mcq/term2-selection.mjs';
import { selectRespiratorySprint } from '../src/lib/mcq/respiratory-selection.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/term2/anatomy-visual-images.json',import.meta.url))).images;
const originals=buildAnatomyQuestions(catalog);
const reverse=buildLocationQuestions(originals);

test('retiring a target preserves surviving trainer answers and the current question by identity',()=>{
  const [a,b,c]=originals.slice(0,3);
  const saved=JSON.stringify({version:1,ids:[a.id,b.id,c.id],index:2,views:['2d','2d','2d'],answers:{[a.id]:'A',[c.id]:'B'}});
  const restored=parseAnatomySession(saved,[a,c]);
  assert.deepEqual(restored.items.map(item=>item.question.id),[a.id,c.id]);
  assert.equal(restored.index,1);assert.equal(restored.answers[c.id],'B');
  assert.equal(parseAnatomySession(saved,[]),null);
});

test('every authored image target has a distinct, source-preserving reverse question',()=>{
  assert.equal(reverse.length,catalog.reduce((n,image)=>n+image.regions.length,0));
  assert.equal(new Set(reverse.map(q=>q.id)).size,reverse.length);
  for(const q of reverse){
    assert.deepEqual(anatomyValidationErrors(q),[],q.id);
    assert.equal(q.anatomy.responseMode,'locate');
    assert.match(q.prompt,/^Find /);
    assert.equal(locationOptionId(q,q.anatomy.targetRegionId),'A');
    const wrong=q.media[0].annotations.find(r=>r.id!==q.anatomy.targetRegionId);
    assert.equal(locationOptionId(q,wrong.id),'B');
    assert.equal(locationOptionId(q,'unmapped'),'C');
    assert(q.source.page||q.source.slide);
    assert(!q.tags.some(t=>/past|final|official-exam/.test(t)));
  }
});

test('coordinate hit testing is bounded and independent of the requested target',()=>{
  const regions=[{id:'one',x:.1,y:.1,width:.2,height:.2},{id:'two',x:.3,y:.3,width:.2,height:.2}];
  assert.equal(regionAtPoint(regions,.2,.2),'one');
  assert.equal(regionAtPoint(regions,.4,.4),'two');
  assert.equal(regionAtPoint(regions,.9,.9),undefined);
  assert.equal(regionAtPoint(regions,NaN,.2),undefined);
  assert.equal(regionAtPoint(regions,-.1,.2),undefined);
  const overlapping=[{id:'wide',x:.1,y:.1,width:.4,height:.4},{id:'small',x:.3,y:.3,width:.1,height:.1}];
  assert.equal(regionAtPoint(overlapping,.305,.305),'wide');
  assert.equal(regionAtPoint([...overlapping].reverse(),.305,.305),'wide');
});

test('learn sessions do not retest labels revealed on the same figure; legacy siblings defer feedback',()=>{
  const pool=[...originals,...reverse];
  const sessions=[selectAnatomySession(pool,{count:1000,feedback:'learn'}).map(item=>item.question),selectTerm2Sprint(pool,{limit:1000,studyMode:'learn'}).questions,selectRespiratorySprint(pool,{limit:250,studyMode:'learn'}).questions];
  for(const session of sessions){
    const figures=session.map(q=>q.anatomy.imageId);
    assert.equal(new Set(figures).size,figures.length);
  }
  const q=reverse[0];
  const sibling=reverse.find(item=>item.anatomy.imageId===q.anatomy.imageId&&item.id!==q.id);
  assert(sibling);
  assert.equal(canRevealAnatomyFigure(q,[q,sibling],()=>false),false);
  assert.equal(canRevealAnatomyFigure(q,[q,sibling],()=>true),true);
});

test('restored location scores are derived only from valid saved locations',()=>{
  const q=reverse[0];
  const wrong=q.media[0].annotations.find(r=>r.id!==q.anatomy.targetRegionId).id;
  for(const [regionId,expected] of [[wrong,'B'],[q.anatomy.targetRegionId,'A'],['unknown',undefined],[undefined,undefined]]){
    const saved=JSON.stringify({version:1,ids:[q.id],views:['3d'],answers:{[q.id]:'A'},locations:{[q.id]:regionId}});
    const restored=parseAnatomySession(saved,[q]);
    assert.equal(restored.answers[q.id],expected);
    assert.equal(restored.locations[q.id],expected?regionId:undefined);
    assert.equal(restored.items[0].initialView,'2d');
    assert.equal(restoredLocationResponse(q,regionId)?.selectedOptionId,expected);
  }
});

test('mixed-direction 3D selection retains every eligible identification target',()=>{
  const pool=[...originals,...reverse];
  for(const seed of ['3d-a','3d-b','3d-c']){
    const options={seed,count:10000,format:'3d',feedback:'exam'};
    const mixed=selectAnatomySession(pool,{...options,direction:'mixed'});
    const identify=selectAnatomySession(pool,{...options,direction:'identify'});
    const keys=session=>session.map(({question:q})=>q.anatomy.imageId+':'+q.anatomy.targetRegionId).sort();
    assert.deepEqual(keys(mixed),keys(identify));
    assert(mixed.every(({question:q})=>q.anatomy.responseMode!=='locate'));
  }
});

test('both directions can be selected, and saved location outcomes obey delayed feedback',()=>{
  const pool=[...originals,...reverse];
  const locate=selectAnatomySession(pool,{direction:'locate',format:'2d',count:20});
  assert.equal(locate.length,20);
  assert(locate.every(item=>item.question.anatomy.responseMode==='locate'&&item.initialView==='2d'));
  assert(selectAnatomySession(pool,{direction:'identify'}).every(item=>item.question.anatomy?.responseMode!=='locate'));
  const mixed=selectAnatomySession(pool,{seed:'two-way',count:250});
  assert(mixed.some(item=>item.question.anatomy?.responseMode==='locate'));
  const keys=mixed.map(({question:q})=>q.anatomy.imageId+':'+q.anatomy.targetRegionId);
  assert.equal(new Set(keys).size,keys.length,'Same target cannot reveal its answer through the reverse question in one test');
  const bankTest=selectTerm2Sprint(pool,{limit:5000,studyMode:'exam'}).questions;
  const physicalKeys=bankTest.map(q=>q.anatomy.imageId+':'+q.anatomy.targetRegionId);
  assert.equal(new Set(physicalKeys).size,physicalKeys.length);
  const q=locate[0].question;
  const picked=q.media[0].annotations.find(r=>r.id!==q.anatomy.targetRegionId).id;
  const saved=JSON.stringify({version:1,ids:[q.id],answers:{[q.id]:'B'},locations:{[q.id]:picked},graded:false,feedback:'exam'});
  const restored=parseAnatomySession(saved,pool);
  assert.equal(restored.answers[q.id],'B');assert.equal(restored.graded,false);assert.equal(restored.feedback,'exam');
  assert.equal(restored.locations[q.id],picked);
  assert.deepEqual(parseAnatomySession(JSON.stringify({version:1,ids:[q.id],answers:{[q.id]:'B'},locations:{[q.id]:'not-a-region'}}),pool).locations,{});
});

test('location UI hides answer highlighting, named hotspots and option shortcuts before feedback',()=>{
  const image=readFileSync(new URL('../src/components/AnatomyImage.tsx',import.meta.url),'utf8');
  const paired=readFileSync(new URL('../src/components/anatomy3d/PairedAnatomyMedia.tsx',import.meta.url),'utf8');
  const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
  assert.match(image,/target && \(!locate \|\| revealed\)/);
  assert.match(image,/aria-label=\{`Select location/);
  assert.match(image,/revealed && regions\.map/);
  assert.match(image,/Submit location/);
  assert.match(paired,/disabled=\{locating && !canLocate3D\}/);
  assert.match(page,/!isLocationQuestion\(question\) && <div className="mode-switch"/);
});

test('rendered locate questions offer neutral locations and reveal the saved selection only with feedback',async()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {AnatomyImage} from './src/components/AnatomyImage';export const render=(question,revealed,savedRegionId)=>renderToStaticMarkup(<AnatomyImage question={question} media={question.media[0]} src="/source.png" revealed={revealed} savedRegionId={savedRegionId} onLocationSubmit={()=>{}}/>);`,loader:'tsx',resolveDir:root},platform:'node',format:'cjs',bundle:true,packages:'external',write:false,alias:{'@':root}});
  const compiled={exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),compiled,compiled.exports);
  for(const exam of ['cvs','respiratory','limbs']){
    const q=reverse.find(item=>item.tags.includes(`exam-term2-${exam}`));
    const region=q.media[0].annotations.find(r=>r.id!==q.anatomy.targetRegionId);
    const before=compiled.exports.render(q,false,region.id);
    const after=compiled.exports.render(q,true,region.id);
    assert.equal((before.match(/class="anatomy-location-hotspot/g)??[]).length,q.media[0].annotations.length);
    assert.match(before,/Select location 1/);assert.match(before,/Submit location/);
    assert.doesNotMatch(before,/class="anatomy-target"|correct target|Your selected location:/);
    assert.match(after,/aria-label="Correct location"/);
    assert.match(after,/Your selected location:/);
    assert.doesNotMatch(after,/Submit location/);
  }
});

test('rendered hotspot pointer clicks reach coordinate resolution while keyboard chooses the focused location',async()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const result=await build({stdin:{contents:`export {AnatomyImage} from './src/components/AnatomyImage';`,loader:'tsx',resolveDir:root},platform:'node',format:'cjs',bundle:true,packages:'external',write:false,alias:{'@':root}});
  const require=createRequire(import.meta.url);
  const compiled={exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(require,compiled,compiled.exports);
  const React=require('react');
  const realUseState=React.useState;
  const updates=[];
  const regions=[{id:'wide',label:'Wide',x:.1,y:.1,width:.4,height:.4},{id:'small',label:'Small',x:.3,y:.3,width:.1,height:.1}];
  const q={...reverse[0],anatomy:{...reverse[0].anatomy,targetRegionId:'wide'}};
  let element;
  try {
    React.useState=initial=>[initial,value=>updates.push(value)];
    element=compiled.exports.AnatomyImage({question:q,media:{...q.media[0],annotations:regions},src:'/source.png',revealed:false});
  } finally {React.useState=realUseState;}
  const descendants=node=>Array.isArray(node)?node.flatMap(descendants):node&&typeof node==='object'?[node,...descendants(node.props?.children)]:[];
  const nodes=descendants(element);
  const stage=nodes.find(node=>node.props?.className==='anatomy-stage');
  const small=nodes.find(node=>node.props?.['aria-label']==='Select location 2');
  let stopped=false;
  const event={detail:1,clientX:30.5,clientY:30.5,stopPropagation:()=>{stopped=true;}};
  small.props.onClick(event);
  assert.equal(stopped,false,'Pointer must bubble, even when the topmost box is not nearest');
  stage.props.onClick({...event,currentTarget:{getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})}});
  assert.deepEqual(updates,['wide',false]);
  updates.length=0;
  small.props.onClick({...event,detail:0});
  assert.equal(stopped,true);
  assert.deepEqual(updates,['small',false]);
});
