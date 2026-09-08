import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {listAnatomyModules} from '../src/lib/anatomy3d/registry.ts';
import {buildAnatomyQuiz} from '../src/lib/anatomy3d/quiz.mjs';
import {buildModelLocationQuestions} from '../src/lib/mcq/anatomy-location.mjs';

test('all three exams render selectable 2D/3D game boards and model-locate submission without MCQ shortcuts',async()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Game from './src/components/anatomy3d/AnatomyLabelGame';import Locate from './src/components/anatomy3d/ModelLocationQuestion';export const game=(examId,modules)=>renderToStaticMarkup(<Game examId={examId} modules={modules} onExit={()=>{}}/>);export const locate=q=>renderToStaticMarkup(<Locate question={q} revealed={false} onSubmit={()=>{}}/>);`,loader:'tsx',resolveDir:root},platform:'node',format:'cjs',bundle:true,packages:'external',write:false,alias:{'@':root}});
  const compiled={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),compiled,compiled.exports);
  for(const [exam,regions] of [['cvs',['cvs']],['respiratory',['respiratory']],['limbs',['upper-limb','lower-limb']]]){
    const manifests=regions.flatMap(r=>listAnatomyModules(r).map(m=>m.manifest));
    const html=compiled.exports.game('term2-'+exam,manifests);
    assert.match(html,/2D source figures/);assert.match(html,/3D model rounds/);
    assert.match(html,/draggable="true"/);assert.match(html,/Check board/);
    assert.match(html,/source-label-mask/);assert.match(html,/Location 1/);
    assert.doesNotMatch(html,/Your selection:|Correct:|✓ Correct/);
    const modelQuestions=buildAnatomyQuiz(manifests[0],{seed:'render-locate'}).map(q=>({...q,tags:[],anatomy3d:{modelKey:manifests[0].modelKey,structureId:q.structureId}}));
    const q=buildModelLocationQuestions(modelQuestions,manifests)[0];
    const before=compiled.exports.locate(q);
    assert.match(before,/Submit location/);assert.match(before,/Inspect a numbered 3D location/);
    assert.doesNotMatch(before,/Answer choices|Correct:|<option[^>]*>[^<]*(?:nerve|artery|vein)/i);
    assert.match(before,/disabled=""[^>]*>Submit location/,'Do not accept a location before its model loads');
  }
});
