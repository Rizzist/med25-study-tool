import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {buildLimbPracticeIndex,limbPracticeRegion,matchesLimbPracticeScope,requestedLimbPracticeScope,savedLimbPracticeScope} from '../src/lib/mcq/limb-practice-scope.mjs';
import {parseProgress} from '../src/lib/mcq/study-progress.mjs';
import {isExamId} from '../src/lib/mcq/exams.mjs';
import {guidanceMode} from '../src/lib/mcq/guided-exam.mjs';
import {savedCvsScope} from '../src/lib/mcq/cvs-scope.mjs';

const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
function load(file) {
  if(modules.has(file))return modules.get(file).exports;
  if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
  if(file.endsWith('.mjs'))return require(file);
  const loaded={exports:{}};modules.set(file,loaded);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const local=id=>{
    if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);
    const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
    return load([base,base+'.ts',base+'.json'].find(p=>fs.existsSync(p)));
  };
  new Function('require','module','exports',code)(local,loaded,loaded.exports);return loaded.exports;
}
const server=load(path.join(root,'src/lib/server/study-bank.ts'));
const questions=server.loadVerifiedQuestions('term2-limbs');
const index=buildLimbPracticeIndex(questions);

test('all regional practice IDs are covered once, with only shared science overlapping',()=>{
  assert.deepEqual(Object.fromEntries(Object.entries(index).map(([k,v])=>[k,v.length])),{all:3426,upper:1016,lower:2542,shared:132});
  assert.equal(new Set(index.all).size,questions.length);
  const upper=new Set(index.upper),lower=new Set(index.lower);
  assert.deepEqual(index.all.filter(id=>upper.has(id)&&lower.has(id)),index.shared);
  assert.equal(new Set([...upper,...lower]).size,questions.length);
  assert(questions.filter(q=>q.subject==='anatomy').every(q=>['upper','lower'].includes(limbPracticeRegion(q))));
  const detail=JSON.parse(fs.readFileSync(path.join(root,'public/study/runtime/term2-limbs.json')));
  assert.deepEqual(detail.limbPracticeQuestionIds,index);
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'public/study/runtime/catalog.json')));
  assert(catalog.exams.every(c=>!c.limbPracticeQuestionIds));
});

test('metadata wins over distractors and regional science cases remain separated',()=>{
  assert.equal(limbPracticeRegion({subject:'anatomy',tags:['atlas-module-upper-limb'],prompt:'A foot distractor'}),'upper');
  assert.equal(limbPracticeRegion({subject:'anatomy',chapter:'Chapter 79 Ankle and foot'}),'lower');
  assert.throws(()=>buildLimbPracticeIndex([{id:'unmapped',subject:'anatomy'}]),/Map limb practice region/);
  for(const [id,region] of [['comp-limbs-062','upper'],['limb-audit-phys-029','upper'],['limb-audit-emb-035','lower'],['limb-audit-phys-040','lower'],['limb-audit-hist-033','lower'],['limb-audit-phys-018','shared'],['depth-limb-emb-005','shared']]) {
    assert.equal(limbPracticeRegion(questions.find(q=>q.id===id)),region,id);
  }
});

test('every collection intersects its region before Learn/Test sprint selection',()=>{
  for(const limbScope of ['all','upper','lower'])for(const collection of ['all','anatomy','histology','embryology','physiology','dynamic-anatomy','images'])for(const studyMode of ['learn','exam']) {
    const expected=questions.filter(q=>matchesLimbPracticeScope(q,limbScope)&&server.matchesCollection(q,collection));
    const ids=new Set(expected.map(q=>q.id));
    const result=server.coverageQuestionSet({exam:'term2-limbs',collection,limbScope,studyMode,limit:20,seenIds:index.all,repairIds:index.all.slice(0,100)});
    assert.equal(result.availableCount,expected.length,`${limbScope}/${collection}/${studyMode}`);
    assert.equal(result.limbScope,limbScope);
    assert(result.questions.every(q=>ids.has(q.id)));
    assert.equal(new Set(result.questions.map(q=>q.id)).size,result.questions.length);
  }
});

test('GET questions and explicit-ID practice respect scope; saved IDs are not deleted by filters',()=>{
  for(const limbScope of ['upper','lower']) {
    const expected=new Set(index[limbScope]);
    const query=server.questionSet(new URLSearchParams({exam:'term2-limbs',limbScope,limit:'250'}));
    assert.equal(query.availableCount,expected.size);
    assert(query.questions.every(q=>expected.has(q.id)));
    const result=server.questionSetByIds({exam:'term2-limbs',ids:index.all,limbScope,prioritize:true,limit:250});
    assert.equal(result.availableCount,expected.size);
    assert(result.questions.every(q=>expected.has(q.id)));
    // The client prunes unavailable wrong/flagged IDs using validIds. Opposite
    // region mistakes must stay available for a later session.
    assert.deepEqual(result.validIds,index.all);
    const history=server.questionSetByIds({exam:'term2-limbs',ids:index.all,limbScope,purpose:'history'});
    assert.equal(history.availableCount,questions.length);
  }
});

test('scope validation, non-limb isolation and old saved sessions default safely',()=>{
  assert.equal(savedLimbPracticeScope('term2-limbs',undefined),'all');
  assert.equal(savedLimbPracticeScope('term2-limbs','corrupt'),'all');
  assert.equal(savedLimbPracticeScope('term2-limbs','upper'),'upper');
  assert.equal(savedLimbPracticeScope('term2-cvs','upper'),'all');
  assert.equal(requestedLimbPracticeScope('term2-limbs',undefined),'all');
  for(const bad of ['both','',{},1])assert.throws(()=>server.coverageQuestionSet({exam:'term2-limbs',limbScope:bad}),/valid limb/);
  assert.throws(()=>server.coverageQuestionSet({exam:'term2-cvs',limbScope:'lower'}),/valid limb/);
  assert.throws(()=>server.questionSetByIds({exam:'term2-limbs',ids:index.all,limbScope:'bad'}),/valid limb/);
  assert.equal(server.coverageQuestionSet({exam:'term2-limbs'}).availableCount,questions.length);
});

test('long existing ankle question IDs survive progress and saved-session parsing',()=>{
  const id=questions.find(q=>q.id.length>160).id;
  const progress=parseProgress(JSON.stringify({exams:{'term2-limbs':{wrongIds:[id],flaggedIds:[id]}}}));
  assert.deepEqual(progress.exams['term2-limbs'],{wrongIds:[id],flaggedIds:[id]});
  // Exercise the actual parser used by active/completed sessions, not a copy.
  const source=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
  const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const clean=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='cleanIds');
  const compiled=ts.transpileModule(clean.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  assert.deepEqual(new Function(`${compiled};return cleanIds;`)()([id,'x'.repeat(257)]),[id]);
});

test('actual archive parser retains scope, questions and scores for active/completed attempts',()=>{
  const source=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
  const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const names=['cleanIds','optionalPracticeIds','cleanAnswers','isCollectionId','isTerm2CourseExam','cleanActiveSession','parseSessionArchive','isAnswered'];
  const definitions=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&names.includes(node.name?.text)||ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>d.name.getText(ast)==='collectionLabel')).map(node=>node.getText(ast)).join('\n');
  const compiled=ts.transpileModule(definitions,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const parse=new Function('isExamId','guidanceMode','savedLimbPracticeScope','savedCvsScope','isBiochemistryChapterId',`${compiled};return parseSessionArchive;`)(isExamId,guidanceMode,savedLimbPracticeScope,savedCvsScope,load(path.join(root,'src/lib/biochemistry/chapters.ts')).isBiochemistryChapterId);
  for(const limbScope of ['all','upper','lower',undefined]) {
    const questionIds=index[limbScope??'all'].slice(-3),id=questionIds[0];
    const active={exam:'term2-limbs',collection:'all',limbScope,questionIds,visitedQuestionIds:questionIds,questionIndex:1,answers:{[id]:{mode:'select',selectedOptionId:'A',flagged:true}},studyMode:'exam'};
    const parsed=parse(JSON.stringify({active,history:[{...active,id:'attempt',correctCount:1,answeredCount:1,flaggedCount:1}]}));
    assert.equal(parsed.active.limbScope,limbScope??'all');
    assert.deepEqual(parsed.active.questionIds,questionIds);
    assert.equal(parsed.active.answers[id].selectedOptionId,'A');
    for (const key of ['respiratoryPracticeIds','practicalPracticeIds','coursePracticeIds']) {
      assert.equal(parsed.active[key],undefined,'New sprint must not receive an empty exact-ID pool');
    }
    assert.equal(parsed.history[0].limbScope,limbScope??'all');
    assert.equal(parsed.history[0].correctCount,1);
  }
});

test('return-to-practice catalog refresh keeps unchanged details but invalidates new versions',()=>{
  const source=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
  const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let refresh;
  function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='refresh')refresh=node;ts.forEachChild(node,visit);}
  visit(ast);
  let callback;
  function find(node){if(ts.isCallExpression(node)&&node.expression.getText(ast)==='setBank')callback=node.arguments[0];ts.forEachChild(node,find);}
  find(refresh);
  const compiled=ts.transpileModule(`const merge=${callback.getText(ast)};`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const course={id:'term2-limbs',detailUrl:'limbs?v=1'},current={exams:[{...course,collectionQuestionIds:{all:index.all},limbPracticeQuestionIds:index}]};
  const merge=summary=>new Function('summary',`${compiled};return merge;`)(summary)(current);
  assert.deepEqual(merge({exams:[course]}).exams[0].limbPracticeQuestionIds,index);
  assert.equal(merge({exams:[{...course,detailUrl:'limbs?v=2'}]}).exams[0].limbPracticeQuestionIds,undefined);
});
