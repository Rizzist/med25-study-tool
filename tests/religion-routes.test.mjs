import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
// Exercise current Next route handlers, not an obsolete dist/server bundle.
const root=resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
function load(file){
 if(modules.has(file))return modules.get(file).exports;
 if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
 if(file.endsWith('.mjs'))return require(file);
 const module={exports:{}};modules.set(file,module);
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?resolve(root,id.slice(2)):resolve(dirname(file),id);return load(/\.(?:json|mjs|ts)$/.test(base)?base:base+'.ts');};
 new Function('require','module','exports',code)(local,module,module.exports);return module.exports;
}
const catalog=JSON.parse(readFileSync(new URL('../data/religion/catalog.json',import.meta.url),'utf8'));
async function route(path,body){const method=body===undefined?'GET':'POST';const request=new Request(`http://localhost${path}`,body===undefined?undefined:{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});return load(resolve(root,'app'+new URL(request.url).pathname+'/route.ts'))[method](request);}
test('Religion routes: summary separates practice and original finals',async()=>{const response=await route('/api/bank/summary');assert.equal(response.status,200);const body=await response.json(),exam=body.exams.find(e=>e.id==='term2-religion');assert(exam);assert.equal(exam.questionCount,catalog.counts.practice);assert.equal(exam.finalExamQuestionCount,catalog.counts.scoredPastPaper);assert.equal(exam.finalExamBanks[0].id,'religion-past-papers');assert(body.subjects.some(s=>s.id==='religion'));});
test('Religion routes: default final bank, cross-exam rejection and source-only keys',async()=>{const response=await route('/api/final-exam?exam=term2-religion');assert.equal(response.status,200);const body=await response.json();assert.equal(body.questions.length,catalog.counts.scoredPastPaper);assert(body.questions.every(q=>q.tags.includes('final-bank-religion-past-papers')&&!q.tags.includes('religion-practice')));const explicit=await route('/api/final-exam?exam=term2-religion&bank=religion-past-papers');assert.deepEqual((await explicit.json()).questions,body.questions);assert.equal((await route('/api/final-exam?exam=term2-cvs&bank=religion-past-papers')).status,400);assert.equal((await route('/api/final-exam?exam=term2-religion&bank=nutrition-past-papers')).status,400);});
test('Religion routes: focused practice cannot import final or other-exam items',async()=>{const ids=catalog.modules[0].questionIds;const response=await route('/api/questions/by-ids',{exam:'term2-religion',ids:[...ids,'religion-past-o1'],limit:20,preserveOrder:true,purpose:'practice'});assert.equal(response.status,200);assert.deepEqual((await response.json()).questions.map(q=>q.id),ids);const other=await route('/api/questions/by-ids',{exam:'term2-nutrition',ids,limit:20,purpose:'practice'});assert.equal((await other.json()).questions.length,0);const sprint=await route('/api/questions/sprint',{exam:'term2-religion',collection:'all',limit:20});assert.equal(sprint.status,200);const questions=(await sprint.json()).questions;assert.equal(questions.length,20);assert(questions.every(q=>q.tags.includes('religion-practice')));});
