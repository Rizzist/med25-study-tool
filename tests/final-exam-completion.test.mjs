import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {reconcileFinalExamSession} from '../src/lib/mcq/final-exam-state.mjs';

const require=createRequire(import.meta.url),module={exports:{}};
const code=ts.transpileModule(readFileSync(new URL('../src/components/FinalExamStatusBanner.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('require','module','exports',code)(require,module,module.exports);
const {FinalExamStatusBanner}=module.exports;
const props={title:'Original 40-item paper',completed:false,hasSession:false,answeredCount:0,correctCount:0,total:35,currentIndex:0,onOpen(){},onRestart(){}};
const render=overrides=>renderToStaticMarkup(createElement(FinalExamStatusBanner,{...props,...overrides}));

test('completed paper shows its saved score and review, never resume or continue',()=>{
  const html=render({completed:true,hasSession:true,answeredCount:35,correctCount:28,currentIndex:34});
  assert.match(html,/FINAL EXAM COMPLETE/);assert.match(html,/35 of 35 answered/);assert.match(html,/28 correct \(80%\)/);
  assert.match(html,/Your result is saved/);assert.match(html,/Review answers/);assert.match(html,/Original 40-item paper/);
  assert.doesNotMatch(html,/Resume at|Continue final exam|Start final exam/);
  assert.match(html,/Delete progress &amp; restart/);
});
test('unfinished and unstarted papers retain their distinct actions',()=>{
  const unfinished=render({hasSession:true,answeredCount:12,correctCount:9,currentIndex:12});
  assert.match(unfinished,/12 of 35 answered\. Resume at question 13/);assert.match(unfinished,/Continue final exam/);assert.doesNotMatch(unfinished,/FINAL EXAM COMPLETE|Review answers/);
  const fresh=render({});assert.match(fresh,/Start final exam/);assert.doesNotMatch(fresh,/Resume at|Continue final exam|Delete progress/);
});
test('completed saved attempt survives reopen and review without changing its answers or completion date',()=>{
  const question={id:'one',revision:1,correctOptionId:'A',options:[{id:'A'},{id:'B'}]};
  const timestamp='2026-09-21T01:00:00.000Z';
  const answer={selectedOptionId:'A',correct:true,questionRevision:1,correctOptionId:'A',answeredAt:timestamp};
  const saved={questionIds:['one'],currentIndex:0,answers:{one:answer},completedAt:timestamp};
  const restored=reconcileFinalExamSession(saved,[question],'updated-bank');
  assert.equal(restored.completedAt,timestamp);assert.deepEqual(restored.answers,saved.answers);
  const source=readFileSync(new URL('../src/components/FinalExam.tsx',import.meta.url),'utf8');
  assert.match(source,/else if \(completed\)\s*\{[\s\S]*?moveTo\(0\)/);
  assert.match(source,/session\.answers\[question\.id\]\) return/);
});
