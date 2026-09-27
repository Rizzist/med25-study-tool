import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import Ajv2020 from 'ajv/dist/2020.js';
import ts from 'typescript';
import {parseExport, keyOf} from '../src/lib/paper-pdf/parse-export.mjs';
import {combinedSourceSelection} from '../src/lib/mcq/paper-selection.mjs';
import {resolveGuidedReference} from '../src/lib/mcq/guided-exam.mjs';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const exam='term2-respiratory', bank='respiratory-past-papers', bankKey=exam+':'+bank;
const manifest=read('data/respiratory/source-manifest.json');
const imports=new Map(manifest.collections.map(s=>[s.id,read(`data/respiratory/imports/${s.id}.json`)]));
const catalog=read('data/mcq-refactor/past-source-catalog.json');
const collections=catalog.collections.filter(c=>c.courseId===exam);
const papers=new Map(collections.map(c=>[c.id,read(`data/respiratory/papers/${c.id}.json`)]));
const questions=fs.readFileSync(path.join(root,`data/final-exams/${bank}.jsonl`),'utf8').trim().split('\n').map(JSON.parse);
const byId=new Map(questions.map(q=>[q.id,q]));
// Reviewed source snapshot: 23 Q59 cannot be keyed literally; Q63 has two defensible choices.
const EXPECTED_RECORDS=690, EXPECTED_SCORED=579, EXPECTED_UNGRADED=85;
const sourcePages=s=>s.sources.reduce((total,source)=>total+source.pageCount,0);
const questionId=(paper,number)=>`${paper}-q${/^\d+$/.test(number)?String(number).padStart(3,'0'):number}`;

test('all 24 Respiratory sources and every original page remain accounted for in 23 cards',()=>{
  assert.equal(manifest.collections.length,24);
  assert.equal(collections.length,23);
  assert.equal(papers.size,23);
  assert.equal([...papers.values()].flatMap(p=>p.questions).length,EXPECTED_RECORDS);
  assert.equal(questions.length,EXPECTED_SCORED);
  assert.equal(byId.size,EXPECTED_SCORED);
  const audit=read('data/respiratory/import-audit.json');
  assert.deepEqual([audit.sourceFolders,audit.catalogCollections,audit.retainedRecords,audit.distinctScoredQuestions,audit.ungradedRecords],[24,23,EXPECTED_RECORDS,EXPECTED_SCORED,EXPECTED_UNGRADED]);
  for(const source of manifest.collections){
    const original=imports.get(source.id),total=sourcePages(source);
    assert.equal(original.id,source.id);
    assert(original.audit.status);
    const accounted=new Set();
    for(const item of [...original.questions,...original.excludedItems]){
      assert(Number.isInteger(item.page)&&item.page>=1&&item.page<=total,`${source.id}: page ${item.page}`);
      accounted.add(item.page);
    }
    assert.deepEqual([...accounted].sort((a,b)=>a-b),Array.from({length:total},(_,i)=>i+1),source.id);
    const card=collections.find(c=>c.id===(source.id==='respiratory-14'?'respiratory-10':source.id));
    assert(card,source.id);
    for(const asset of source.sources)assert(card.sources.some(s=>s.publicUrl===asset.url&&s.sha256===asset.sha256),asset.url);
  }
  // The native report ends at Q39; a nonexistent Q40 must not be invented.
  assert.equal(imports.get('respiratory-03').questions.length,39);
  assert.equal(imports.get('respiratory-03').questions.at(-1).sourceNumber,'39');
});

test('the identical 10/14 photo family has one exam card and both original layouts',()=>{
  assert(!collections.some(c=>c.id==='respiratory-14'));
  assert(!questions.some(q=>q.id.startsWith('respiratory-14-')));
  const a=imports.get('respiratory-10'),b=imports.get('respiratory-14');
  assert.equal(a.questions.length,42);
  assert.deepEqual(a.questions.map(q=>[q.prompt,q.options,q.key]),b.questions.map(q=>[q.prompt,q.options,q.key]));
  assert.equal(collections.find(c=>c.id===a.id).sources.length,14);
  const defaults=catalog.courses.find(c=>c.id===exam).defaultCollectionIds;
  assert.equal(defaults.length,14);
  assert.deepEqual(defaults,collections.filter(c=>c.defaultEligible).map(c=>c.id));
  for(const n of ['16','17','18','19','20','21','22','23','24'])assert(!defaults.includes('respiratory-'+n));
});

test('screenshot references reuse 26 canonical July IDs without resurrecting withheld items',async()=>{
  const screenshot=papers.get('respiratory-22'),july=papers.get('respiratory-05');
  const refs=imports.get(screenshot.id).audit.overlapWithJuly2022;
  assert.equal(refs.length,28);
  assert.deepEqual(refs.map(r=>[r.question,r.relatedQuestion]),
    ['25','8','23','7','30','28','4','3','5','12','2','31','13','11','9','26','10','16','14','18','29','24','15','17','34','33','27','32']
      .map((n,i)=>['p'+String(i+1).padStart(2,'0'),n]));
  assert.equal(screenshot.questions.filter(q=>q.shortAnswer).length,4);
  for(const ref of refs){
    const row=screenshot.questions.find(q=>q.number===ref.question);
    const original=july.questions.find(q=>q.number===ref.relatedQuestion);
    assert.equal(ref.relatedSource,july.id);
    assert.equal(row.canonicalQuestionId,original.id);
    assert.equal(row.key,original.key);
    assert.equal(row.options.length,original.options.length);
    assert.equal(row.graded,original.graded);
    assert(!byId.has(row.id));
  }
  const card=collections.find(c=>c.id===screenshot.id);
  assert.equal(card.gradedQuestionIds.length,26);
  assert(card.gradedQuestionIds.every(id=>id.startsWith('respiratory-05-')&&byId.has(id)));
  for(const n of ['p19','p20'])assert.equal(screenshot.questions.find(q=>q.number===n).graded,false);
  const combined=await combinedSourceSelection(collections,[july.id,screenshot.id]);
  assert.deepEqual(new Set(combined.gradedQuestionIds),new Set(collections.find(c=>c.id===july.id).gradedQuestionIds));
  assert.equal(combined.gradedQuestionIds.length,32);
});

test('only keyed MCQs enter grading; short answers, defective questions and unmatched keys do not',()=>{
  let ungraded=0;
  for(const card of collections){
    const paper=papers.get(card.id),original=imports.get(card.id);
    assert.equal(paper.questions.length,original.questions.length);
    assert.equal(card.sourceRecordCount,paper.questions.length);
    assert.deepEqual(card.questionIds,paper.questions.map(q=>q.id));
    assert.deepEqual(card.gradedQuestionIds,paper.questions.filter(q=>q.graded).map(q=>q.canonicalQuestionId));
    assert.equal(card.ungradedCount,card.sourceRecordCount-card.gradedQuestionCount);
    for(let i=0;i<paper.questions.length;i++){
      const row=paper.questions[i],source=original.questions[i];
      for(const field of ['prompt','options','sourceOptions','key','providedKey','sourceNumber','page'])assert.deepEqual(row[field],source[field],`${row.id}/${field}`);
      assert.equal(row.id,questionId(card.id,row.number));
      const canonical=byId.get(row.canonicalQuestionId);
      if(!row.key||!row.options.length){
        ungraded++;assert.equal(row.graded,false);assert(!canonical,row.id);assert(row.note.trim());
        if(!row.options.length){assert(row.shortAnswer);assert.equal(row.key,null);}
      }else{
        assert(row.graded,row.id);assert(canonical,row.id);assert.equal(canonical.correctOptionId,row.key);
        if(row.id===canonical.id){assert.equal(canonical.prompt,row.prompt);assert.deepEqual(canonical.options.map(o=>o.text),row.options);}
      }
    }
  }
  assert.equal(ungraded,EXPECTED_UNGRADED);
  for(const number of ['59','63']){
    assert.equal(imports.get('respiratory-23').questions.find(q=>q.number===number).key,null);
    assert(!byId.has(questionId('respiratory-23',number)));
  }
  for(const n of ['17','18','24'])assert.equal(papers.get('respiratory-'+n).questions.length,0);
  assert.equal(papers.get('respiratory-24').unmatchedAnswers.length,40);
  assert(!questions.some(q=>q.id.startsWith('respiratory-24-')));
});

test('every scored question validates against the application schema and preserves answer provenance',()=>{
  const validate=new Ajv2020({allErrors:true}).compile(read('schemas/mcq-question.schema.json'));
  for(const q of questions){
    assert(validate(q),`${q.id}: ${JSON.stringify(validate.errors)}`);
    assert.deepEqual(q.options.map(o=>o.id),q.options.map((_,i)=>String.fromCharCode(65+i)));
    assert(q.options.some(o=>o.id===q.correctOptionId));
    assert(q.tags.includes('exam-'+exam));assert(q.tags.includes('final-bank-'+bank));
    assert(q.qualityFlags.includes('key-not-official'));
    const row=[...papers.values()].flatMap(p=>p.questions).find(r=>r.id===q.id);
    assert.equal(q.answerReview.basis,!row.providedKey||row.providedKey!==row.key?'ai-inferred':'source-reviewed');
    assert(q.answerReview.evidence.some(e=>e.includes('respiratory.pdf#page=')),q.id);
    for(const media of q.media??[]){
      assert(!path.isAbsolute(media.path)&&!media.path.split('/').includes('..'));
      assert(fs.statSync(path.join(root,'public/study',media.path)).size>1000);
      assert(media.alt.trim());
    }
  }
  assert.equal(byId.get('respiratory-15-q030').options.length,4);
  for(const [id,key] of [['01-q028','A'],['02-q032','A'],['03-q018','B'],['03-q030','A'],['04-q029','C'],['15-q020','A'],['15-q027','D']])assert.equal(byId.get('respiratory-'+id).correctOptionId,key);
});

test('every original and generated download matches its recorded bytes and SHA-256',()=>{
  for(const source of manifest.collections)for(const item of source.sources){
    const bytes=fs.readFileSync(path.join(root,'public',item.url));
    assert.equal(bytes.length,item.bytes,item.url);assert.equal(digest(bytes),item.sha256,item.url);
    assert.match(item.archiveSha256,/^[a-f0-9]{64}$/);
    if(!item.webOptimized)assert.equal(item.sha256,item.archiveSha256);
    if(item.url.endsWith('.pdf'))assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
    else assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff');
  }
  for(const asset of catalog.assets.filter(a=>a.collectionId?.startsWith('respiratory-'))){
    const bytes=fs.readFileSync(path.join(root,'public',asset.url));
    assert.equal(bytes.length,asset.bytes,asset.url);assert.equal(digest(bytes),asset.sha256,asset.url);
  }
  const downloadCourse=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id===exam);
  assert.equal(downloadCourse.gradedQuestionCount,EXPECTED_SCORED);assert.deepEqual(downloadCourse.collections,collections);
  for(const card of collections){
    const doc=parseExport(fs.readFileSync(path.join(root,'public',card.downloads.questionsAndKey),'utf8'));
    const rows=papers.get(card.id).questions;
    assert.equal(doc.questions.length,rows.length,card.id);assert.equal(doc.keys.length,rows.length,card.id);
    for(let i=0;i<rows.length;i++){
      assert.equal(doc.questions[i].id,rows[i].id);
      assert.deepEqual(doc.questions[i].options.map(o=>o.text),rows[i].sourceOptions??rows[i].options);
      assert.equal(keyOf(doc.keys[i]).letter,rows[i].key??'');
    }
    assert.deepEqual(new Set(doc.sources.map(s=>s.url)),new Set(card.sources.map(s=>s.publicUrl)));
  }
  for(const [paperId,number] of [['respiratory-06','30'],['respiratory-12','38']]){
    const row=papers.get(paperId).questions.find(q=>q.number===number);
    assert(Array.isArray(row.sourceOptions),row.id+' original typo choices');
    assert.equal(row.sourceOptions.length,row.options.length);
    assert(row.sourceOptions.every(o=>typeof o==='string'&&o.trim()));
    assert.notDeepEqual(row.sourceOptions,row.options,row.id+' disclosed study correction');
    assert.deepEqual(byId.get(row.id).options.map(o=>o.text),row.options);
  }
});

test('every scored record maps to the current review PDF and the published guided curriculum',()=>{
  const curriculum=read('data/review-curriculum/courses/'+exam+'.json');
  const published=read('public/study/reviews/'+exam+'.json');
  const anchors=read('public/study/guided/'+exam+'.json');
  const overrides=read('data/respiratory/review-section-overrides.json');
  const evidence=read('data/review-curriculum/evidence/question-review-map-v2.json').questions;
  for(const volume of curriculum.volumes){
    const bytes=fs.readFileSync(path.join(root,'public',volume.url.split('?')[0]));
    assert.equal(digest(bytes),volume.sha256);assert(volume.url.includes(volume.sha256));
  }
  for(const q of questions){
    const mapping=curriculum.questions[q.id],live=published.questions[q.id];
    assert(mapping,q.id);assert(live,q.id+' published review mapping');
    assert.equal(mapping.bankId,bank);assert.equal(mapping.livePractice,false);
    assert.equal(live.sectionId,mapping.sectionId);assert.equal(live.bankId,bank);
    const section=curriculum.sections.find(s=>s.id===mapping.sectionId);
    assert(section,q.id);assert(published.sections.some(s=>s.id===section.id));
    const volume=curriculum.volumes.find(v=>v.id===section.volumeId);
    assert(Number.isInteger(section.pdfPage)&&section.pdfPage>0&&section.pdfPage<=volume.pageCount);
    assert.equal(evidence[q.id].sectionId,section.id);assert.equal(evidence[q.id].bankId,bank);
    const pages=q.answerReview.evidence.flatMap(e=>[...e.matchAll(/respiratory\.pdf#page=(\d+)/g)].map(m=>Number(m[1])));
    assert(pages.length&&pages.every(p=>p>0&&p<=volume.pageCount),q.id);
    if(overrides[q.id]){
      assert.equal(section.id,overrides[q.id],q.id+' audited override');
      assert.equal(mapping.uncertain,false);assert.equal(mapping.status,'mapped');
    }else assert(pages.some(p=>p===section.pdfPage)||(section.pdfPage<=pages[0]&&section.pdfPage>=pages[0]-2),q.id);
    const reference=resolveGuidedReference(published,anchors,q.id);
    assert(reference,q.id+' guided reference');assert.equal(reference.sectionId,section.id);
    assert.equal(reference.url,volume.url);assert(reference.page>=1&&reference.page<=volume.pageCount);
    if(reference.precision==='section'){
      assert.equal(reference.page,section.pdfPage);assert.equal(reference.uncertain,mapping.uncertain);
    }else assert(reference.quote);
  }
});

test('69 audited section overrides and 110 explicit past-paper quotes reach their current PDF anchors',()=>{
  const curriculum=read('public/study/reviews/'+exam+'.json');
  const anchors=read('public/study/guided/'+exam+'.json');
  const overrides=read('data/respiratory/review-section-overrides.json');
  const locators=read('data/guided-review/respiratory-past-paragraphs.json');
  const ids=locators.flatMap(p=>p.questionIds);
  assert.equal(Object.keys(overrides).length,69);
  assert.equal(locators.length,110);assert.equal(ids.length,354);assert.equal(new Set(ids).size,354);
  assert.equal(anchors.pdfSha256,curriculum.volumes[0].sha256);
  for(const [id,sectionId] of Object.entries(overrides)){
    assert(byId.has(id),id);assert.equal(curriculum.questions[id].sectionId,sectionId);
    assert.equal(curriculum.questions[id].uncertain,false);
    const row=[...papers.values()].flatMap(p=>p.questions).find(q=>q.id===id);
    assert.equal(row.sectionId,sectionId);assert.equal(row.uncertain,false);
  }
  for(const locator of locators)for(const id of locator.questionIds){
    assert(byId.has(id),id);
    const reference=resolveGuidedReference(curriculum,anchors,id),stored=anchors.questions[id];
    assert(stored,id);assert.equal(stored.sectionId,curriculum.questions[id].sectionId);
    assert.equal(reference.precision,'paragraph',id);assert.equal(reference.page,locator.page);
    assert(reference.top>=0&&reference.top<1,id);assert(reference.quote.includes(locator.quote),id);
    assert.equal(reference.uncertain,false);
    const fallback=resolveGuidedReference(curriculum,{...anchors,pdfSha256:'stale'},id);
    assert.equal(fallback.precision,'section');assert.equal(fallback.sectionId,curriculum.questions[id].sectionId);
  }
  assert.deepEqual(Object.keys(anchors.questions).filter(id=>id.startsWith('respiratory-')).sort(),ids.sort());
});

// Exercise current Next handlers with the generated runtime, not an old server build.
const require=createRequire(import.meta.url),modules=new Map();
function load(file){
  if(modules.has(file))return modules.get(file).exports;
  if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
  if(file.endsWith('.mjs'))return require(file);
  const module={exports:{}};modules.set(file,module);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const local=id=>{
    if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);
    const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
    return load([base,base+'.ts',base+'.json'].find(p=>fs.existsSync(p)));
  };
  new Function('require','module','exports',code)(local,module,module.exports);return module.exports;
}

test('Respiratory final API defaults to the source-only bank, validates course boundaries and caches by fingerprint',async()=>{
  const route=load(path.join(root,'app/api/final-exam/route.ts'));
  const request=(query,headers)=>route.GET(new Request('http://localhost/api/final-exam?'+query,{headers}));
  const response=request('exam='+exam),body=await response.json();
  assert.equal(response.status,200,JSON.stringify(body));
  assert.equal(body.bank,bank);assert.equal(body.availableCount,EXPECTED_SCORED);
  assert.deepEqual(body.questions.map(q=>q.id),questions.map(q=>q.id));
  const explicit=await request('exam='+exam+'&bank='+bank).json();
  assert.deepEqual(explicit,body);
  assert.equal(request('exam='+exam+'&bank=telegram-past-papers').status,400);
  assert.equal(request('exam=term2-cvs&bank='+bank).status,400);
  assert.equal(request('exam='+exam,{'if-none-match':response.headers.get('etag')}).status,304);
  const runtime=read('data/mcq-runtime/index.json').finals[bankKey];
  assert.equal(runtime.count,EXPECTED_SCORED);assert.equal(runtime.version,body.fingerprint);
  const course=read('public/study/runtime/catalog.json').exams.find(c=>c.id===exam);
  assert.equal(course.finalExamQuestionCount,EXPECTED_SCORED);
  assert.equal(course.finalExamBanks.find(b=>b.id===bank).questionCount,EXPECTED_SCORED);
  const mediaIndex=read('data/mcq-runtime/media.json');
  const mediaRoute=load(path.join(root,'app/api/media/route.ts'));
  for(const q of body.questions)for(const media of q.media??[]){
    assert.equal(mediaIndex[q.id+'::'+media.id].path,media.path);assert(media.url.startsWith('/study/'));
    const response=mediaRoute.GET(new Request(`http://localhost/api/media?questionId=${q.id}&mediaId=${media.id}`));
    assert.equal(response.status,307);assert.equal(response.headers.get('location'),'http://localhost'+media.url);
  }
});
