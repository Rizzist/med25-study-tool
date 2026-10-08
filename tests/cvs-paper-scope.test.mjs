import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';
import {scopeCvsDownloadCollection} from '../src/lib/mcq/cvs-paper-catalog.mjs';
import {scopeCvsPaper,scopedCvsPaperId,cvsPaperScopeFingerprint,matchesCvsPaperScope} from '../src/lib/mcq/cvs-scope.mjs';
import {createCombinedPaper,combinedPaperId,applyAnswerOverlay} from '../src/lib/mcq/cvs-paper-enhancements.mjs';
import {coreExamId,createCoreExam} from '../src/lib/mcq/cvs-core-exam.mjs';
import {createNonCoreAnatomyExam} from '../src/lib/mcq/cvs-noncore-anatomy.mjs';
import {newPaperAttempt,answerPaperQuestion,gradePaperBreakdown,restorePaperAttempt,readPaperProgress,gradePaper} from '../src/lib/mcq/cvs-paper-state.mjs';
import {parseExport,selectPaperExport,keyOf} from '../src/lib/paper-pdf/parse-export.mjs';

const root=path.resolve(import.meta.dirname,'..');
const read=url=>fs.readFileSync(path.join(root,'public',url),'utf8');
const json=url=>JSON.parse(read(url));
const map=json('/study/cvs-past-papers/topic-map.json');
const collections=json('/study/past-paper-downloads/catalog.json').courses.find(c=>c.id==='term2-cvs').collections;
const papers=json('/study/cvs-past-papers/index.json').papers.map(entry=>json(entry.file));
const overlay=json('/study/cvs-past-papers/ai-answers.json');
const core=json('/study/cvs-past-papers/core-exam.json');
const noncore=json('/study/cvs-past-papers/noncore-anatomy.json');
const reviewed=await Promise.all(papers.map(p=>applyAnswerOverlay(p,overlay)));
const now='2026-10-08T12:00:00.000Z';

test('CVS scoped catalogs partition every source question, including ungraded items, and omit empty papers',()=>{
  const totals={physio:0,'non-physio':0};
  for(const item of collections){
    assert.equal(scopeCvsDownloadCollection(item,'all'),item);
    const before=JSON.stringify(item);
    const parts=['physio','non-physio'].map(scope=>scopeCvsDownloadCollection(item,scope,map));
    assert.equal(JSON.stringify(item),before);
    assert.deepEqual(parts.flatMap(p=>p.questionIds).sort(),[...item.questionIds].sort());
    for(const part of parts){
      totals[part.cvsScope]+=part.sourceRecordCount;
      assert.equal(part.sourceRecordCount,part.questionIds.length);
      assert.equal(part.gradedQuestionCount+part.ungradedCount,part.sourceRecordCount);
      assert(part.gradedQuestionIds.every(id=>part.questionIds.includes(id)));
      assert(part.questionIds.every(id=>matchesCvsPaperScope(map.questions[id],part.cvsScope)));
    }
  }
  assert.deepEqual(totals,{physio:602,'non-physio':410});
  assert.equal(scopeCvsDownloadCollection(collections.find(c=>c.id==='cvs-izam-cardiac-ions'),'non-physio',map).sourceRecordCount,0);
  assert.throws(()=>scopeCvsDownloadCollection(collections[0],'physio',null),/mapping must load/);
  assert.throws(()=>scopeCvsDownloadCollection(collections[0],'non-physio',{...map,questions:{}}),/mapping must load/);
  assert.throws(()=>scopeCvsDownloadCollection({...collections[0],questionIds:undefined},'physio',map),/source question IDs/);
});

test('CVS generated questions, answer keys and bundles contain only selected IDs with source numbering intact',()=>{
  for(const item of collections)for(const scope of ['physio','non-physio']){
    const part=scopeCvsDownloadCollection(item,scope,map);
    if(!part.sourceRecordCount)continue;
    for(const url of Object.values(item.downloads)){
      const doc=parseExport(read(url)),before=JSON.stringify(doc);
      const selected=selectPaperExport(doc,{ids:part.questionIds,label:scope});
      assert.equal(JSON.stringify(doc),before);
      const expected=new Set(part.questionIds);
      assert([...selected.questions,...selected.keys].every(block=>expected.has(block.id)));
      if(doc.questions.length)assert.equal(selected.questions.length,part.sourceRecordCount);
      if(doc.keys.length){
        assert.equal(selected.keys.length,part.sourceRecordCount);
        assert.equal(selected.keys.filter(block=>keyOf(block).letter).length,part.gradedQuestionCount);
      }
      for(const block of [...selected.questions,...selected.keys]){
        assert.equal(block.number,[...doc.questions,...doc.keys].find(original=>original.id===block.id).number);
      }
    }
  }
  assert.throws(()=>selectPaperExport(parseExport(read(collections[0].downloads.questions)),{ids:['missing'],label:'Physio'}),/export has changed/);
});

test('CVS individual, combined, Core and non-core attempts remain isolated by scope while All stays identical',()=>{
  const combined=createCombinedPaper(reviewed);
  const fullCore=createCoreExam(core,reviewed);
  const anatomy=createNonCoreAnatomyExam(noncore,reviewed,core);
  assert.equal(fullCore.questions.length,183);
  for(const paper of [reviewed[0],combined,fullCore,anatomy]){
    assert.equal(scopeCvsPaper(paper,'all',map),paper);
    const attempts={};
    for(const scope of ['all','physio','non-physio']){
      const scoped=scopeCvsPaper(paper,scope,map);
      const attempt=newPaperAttempt(scoped,now);
      attempts[attempt.paperId]=attempt;
      assert.equal(attempt.paperId,scopedCvsPaperId(paper.id,scope));
      assert.equal(scoped.fingerprint,cvsPaperScopeFingerprint(paper.fingerprint,scoped.questions.map(q=>q.id),scope));
      assert(restorePaperAttempt(attempt,scoped));
      if(scope!=='all')assert.equal(restorePaperAttempt(attempt,paper),null);
    }
    assert.equal(Object.keys(readPaperProgress(JSON.stringify({version:1,attempts,latest:{}})).attempts).length,3);
  }
  assert.equal(combined.id,combinedPaperId(reviewed.map(p=>p.id)));
  for(const [scope,count] of [['physio',89],['non-physio',94]]){
    const scoped=scopeCvsPaper(fullCore,scope,map);
    assert.equal(scoped.questions.length,count);
    assert.equal(scoped.id,`${coreExamId()}::cvs-${scope}`);
    assert.deepEqual(scopeCvsPaper(combined,scope,map).sourcePaperIds,combined.sourcePaperIds);
  }
  assert.equal(scopeCvsPaper(anatomy,'physio',map).questions.length,0);
  assert.equal(scopeCvsPaper(anatomy,'non-physio',map).questions.length,119);
});

test('scoped counts, grading and card fingerprints match the actual launched sources',()=>{
  for(const paper of reviewed)for(const scope of ['physio','non-physio']){
    const scoped=scopeCvsPaper(paper,scope,map);
    const item=scopeCvsDownloadCollection(collections.find(c=>c.id===paper.id),scope,map);
    assert.equal(scoped.questions.length,item.sourceRecordCount);
    assert.equal(scoped.fingerprint,cvsPaperScopeFingerprint(paper.fingerprint,item.questionIds,scope));
    let attempt=newPaperAttempt(scoped,now);
    for(const q of scoped.questions)attempt=answerPaperQuestion(scoped,attempt,q.id,'A');
    const report=gradePaperBreakdown(scoped,attempt,map),result=gradePaper(scoped,attempt,now);
    assert.equal(report.overall.total,item.sourceRecordCount);
    assert.equal(report.overall.sourceKeyed+(report.overall.aiKeyed??0),item.gradedQuestionCount);
    assert.equal(report.overall.ungraded,item.ungradedCount);
    assert.equal(result.total,item.sourceRecordCount);
    assert(report.topics.every(topic=>matchesCvsPaperScope({subjectId:topic.subjectId,topicId:topic.id},scope)));
  }
});

// Exercise the browser PDF boundary with the real parser/document builder and a fake render only.
const require=createRequire(import.meta.url),modules=new Map();
function load(file){
  if(modules.has(file))return modules.get(file).exports;
  if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
  if(file.endsWith('.mjs'))return require(file);
  const loaded={exports:{}};modules.set(file,loaded);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);return load([base,base+'.ts',base+'.tsx',base+'.json'].find(p=>fs.existsSync(p)));};
  new Function('require','module','exports',code)(local,loaded,loaded.exports);return loaded.exports;
}
const {createPaperPdf}=load(path.join(root,'src/lib/paper-pdf/client.ts'));
test('PDF browser renderer receives only scoped questions/keys and isolates its cache by selected IDs',async()=>{
  const item=collections[0];let content;
  const make=createPaperPdf({authorize:async()=>{},origin:'https://study.test',crypto:webcrypto,
    fetch:async url=>new Response(read(new URL(url).pathname)),render:async definition=>{content=JSON.stringify(definition.content);return new Blob(['%PDF-fixture']);}});
  const keys=[];
  for(const variant of ['questions','key','both'])for(const scope of ['physio','non-physio']){
    const part=scopeCvsDownloadCollection(item,scope,map);
    const source={url:item.downloads[variant==='questions'?'questions':variant==='key'?'answerKey':'questionsAndKey'],collection:part,questionSelection:{ids:part.questionIds,label:scope}};
    const result=await make({sources:[source],variant,courseTitle:'CVS',footerLabel:'Scoped export'});
    keys.push(result.key);
    assert(new URL(result.key).pathname.endsWith(`-${scope}-${variant}.pdf`));
    for(const id of item.questionIds)assert.equal(content.includes('"'+id+'"'),part.questionIds.includes(id),`${variant} ${scope} ${id}`);
  }
  assert.equal(new Set(keys).size,6);
});

test('CVS UI scopes every launch and report and labels original downloads explicitly',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/CvsPastExams.tsx'),'utf8');
  assert.match(source,/scopeCvsPaper\(await loadPaper\(source\),cvsScope,topics\)/);
  assert.match(source,/scopeCvsPaper\(createCombinedPaper\(papers\),cvsScope,topics\)/);
  assert.match(source,/scopeCvsPaper\(createCoreExam\(scopedCoreManifest, sources, scope\),cvsScope,topics\)/);
  assert.match(source,/cvsScope!==['"]all['"]&&!topics/);
  assert.match(source,/cvsScope!==['"]physio['"]&&<PastPaperCard/);
  assert.match(source,/<WrongAnswerReview exam="term2-cvs" cvsScope=\{cvsScope\}/);
  const downloads=fs.readFileSync(path.join(root,'src/components/PaperDownloads.tsx'),'utf8');
  assert.match(downloads,/questionSelection:\{ids:item.questionIds/);
  assert.match(downloads,/Complete original/);
});
