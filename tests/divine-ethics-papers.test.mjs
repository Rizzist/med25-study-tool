import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import Ajv2020 from 'ajv/dist/2020.js';
import {PDFDocument} from 'pdf-lib';
import {finalPaperKey,combinedSourceSelection,readCombinedSelections} from '../src/lib/mcq/paper-selection.mjs';
import {parseFinalExamProgress,reconcileFinalExamSession,isFinalAnswerCorrect} from '../src/lib/mcq/final-exam-state.mjs';
import {parseExport,keyOf} from '../src/lib/paper-pdf/parse-export.mjs';
import {reviewBreakdown} from '../src/lib/mcq/review-results.mjs';
const text=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(text(p));
const exam='term2-divine-ethics',bank='divine-ethics-past-papers';
const questions=text('data/final-exams/'+bank+'.jsonl').trim().split('\n').map(JSON.parse);
const cards=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id===exam).collections;
const course=read('data/review-curriculum/courses/'+exam+'.json');
test('every source classified; mixed, unconfirmed and duplicate papers never enter Final Exams',()=>{
 const audit=read('data/divine-ethics/download-audit-2026-10-06.json');
 assert.equal(audit.files,15);assert.equal(audit.rows.length,15);assert.equal(new Set(audit.rows.map(r=>r.filename)).size,15);
 assert(audit.rows.every(r=>r.sha256&&r.reason&&r.decision));
 const duplicate=audit.rows.find(r=>r.decision==='exact-duplicate');
 assert.equal(duplicate.sha256,audit.rows.find(r=>r.filename===duplicate.duplicateOf).sha256);
 assert.equal(cards.length,1);assert.equal(cards[0].courseMatch,'divine-ethics-1-source');assert(cards[0].defaultEligible);
 assert.equal(questions.length,10);assert.deepEqual(questions.map(q=>q.source.chapter),Array.from({length:10},(_,i)=>'Original Q'+(i+3)));
 assert.equal(cards[0].missingSourceNumbers.length,20);assert.equal(cards[0].sourceRecordCount,10);
 assert.match(cards[0].note,/association is provisional/);assert.equal(cards[0].date,null);
 assert(questions.every(q=>q.id.startsWith(cards[0].id)));
});
test('Telegram archive accounts for new sources without publishing unrelated or unconfirmed papers',()=>{
 const audit=read('data/divine-ethics/telegram-audit-2026-10-06.json');
 assert.equal(audit.files,25);assert.equal(audit.rows.length,25);assert.equal(audit.newlyDownloaded,10);
 assert.equal(audit.groups,12);assert.equal(audit.exactUniqueFiles,24);
 assert.equal(new Set(audit.rows.map(r=>r.sha256)).size,24);
 assert.equal(new Set(audit.rows.map(r=>r.archiveFilename)).size,25);
 assert(audit.rows.every(r=>r.status&&r.note&&r.bytes>0&&/^[a-f0-9]{64}$/.test(r.sha256)));
 assert.equal(audit.rows.filter(r=>r.status==='different-course').length,2);
 assert.equal(audit.rows.filter(r=>r.status==='level-unconfirmed-strong-content-match').length,5);
 assert.equal(audit.rows.filter(r=>r.status==='practice-not-past-exam').length,1);
 assert.equal(cards.length,1);assert.equal(questions.length,10);
 const manifest=read('data/divine-ethics/paper-source-manifest.json');
 assert.equal(manifest.collections.length,1);
 assert(manifest.collections.every(c=>c.id==='divine-ethics-1-table-fragment'));
 assert(!JSON.stringify(cards).includes('Blank 5'));
 assert(!JSON.stringify(cards).includes('Divine Texts'));
});
test('schema, checked study answers, retained correction and no false review mapping',()=>{
 const validate=new Ajv2020({allErrors:true}).compile(read('schemas/mcq-question.schema.json'));
 const key={3:'C',4:'B',5:'A',6:'C',7:'C',8:'B',9:'D',10:'A',11:'B',12:'B'};
 for(const q of questions){assert(validate(q),`${q.id}: ${JSON.stringify(validate.errors)}`);assert.equal(q.correctOptionId,key[Number(q.id.match(/q(\d+)$/)[1])]);assert(q.answerReview.evidence.some(e=>e.includes('first-term-lessons.pdf#page=')));assert(q.tags.includes('exam-'+exam));}
 const corrected=questions.find(q=>q.id.endsWith('q007'));
 assert.equal(corrected.answerReview.basis,'ai-inferred');assert.match(corrected.source.excerpt,/Supplied highlighted choice D/);
 for(const letter of ['B','C'])assert(isFinalAnswerCorrect(corrected,letter));
 for(const letter of ['A','D'])assert(!isFinalAnswerCorrect(corrected,letter));
 assert.equal(Object.values(course.questions).filter(m=>m.bankId===bank&&m.sectionId).length,1);
 for(const q of questions.slice(1)){assert.equal(course.questions[q.id].sectionId,null);assert.equal(course.questions[q.id].status,'needs-crosswalk');assert.match(q.answerReview.evidence.join(' '),/no exact teaching section/);}
 const rows=reviewBreakdown(questions.map(q=>({questionId:q.id,topic:q.topic,answered:true,correct:false,gradable:true})),course);
 assert.equal(rows.reduce((n,r)=>n+r.total,0),10);assert.equal(rows.filter(r=>!r.sectionId).reduce((n,r)=>n+r.total,0),9);
 assert(rows.filter(r=>!r.sectionId).every(r=>r.id.startsWith('source-topic:')&&r.title.includes('no linked review section')));
});
test('source/reference PDFs have cache hashes; source bundle preserves four original pages',async()=>{
 const manifest=read('data/divine-ethics/paper-source-manifest.json');
 for(const s of [...manifest.references,...manifest.collections.flatMap(c=>c.sources)]){
  const bytes=fs.readFileSync(new URL('../public'+s.url,import.meta.url));
  assert.equal(bytes.length,s.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);
  assert.equal(read('public/study/pdf-manifest.json').files[s.url].version,s.sha256);
 }
 const source=manifest.collections[0].sources[0];
 assert.equal((await PDFDocument.load(fs.readFileSync(new URL('../public'+source.url,import.meta.url)))).getPageCount(),4);
 assert.deepEqual(read('public/study/originals-manifest.json').collections[cards[0].id].sources,[source.url]);
});
test('exports retain ten numbered questions, original marks and corrected key',()=>{
 const card=cards[0],doc=parseExport(text('public'+card.downloads.questionsAndKey));
 assert.equal(doc.questions.length,10);assert.equal(doc.keys.length,10);assert.equal(doc.sources.length,1);
 assert.deepEqual(doc.questions.map(q=>Number(q.number)),[3,4,5,6,7,8,9,10,11,12]);
 for(const q of questions){assert.deepEqual(doc.questions.find(x=>x.id===q.id).options.map(o=>o.text),q.options.map(o=>o.text));assert.equal(keyOf(doc.keys.find(x=>x.id===q.id)).letter,q.correctOptionId);}
 assert.match(doc.keys.find(k=>k.number==='7').fields['Key provenance'],/Original mark: D.*Accepted choices: B, C/);
});
test('Ethics download variants render every English and Arabic character with bundled fonts',()=>{
 const require=createRequire(import.meta.url),fontkit=require('fontkit'),module={exports:{}};
 const source=text('src/lib/paper-pdf/document.ts');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)(id=>require(id==='./parse-export.mjs'?'../src/lib/paper-pdf/parse-export.mjs':id),module,module.exports);
 const {buildPaperDocument,paperFonts}=module.exports;
 const faces={[paperFonts.latin]:{normal:'NotoSans-Regular.ttf',bold:'NotoSans-Bold.ttf'},[paperFonts.arabic]:{normal:'NotoSansArabic-Regular.ttf',bold:'NotoSansArabic-Regular.ttf'}};
 for(const font of Object.values(faces))for(const weight of ['normal','bold'])font[weight]=fontkit.openSync(new URL('../public/fonts/'+font[weight],import.meta.url).pathname);
 function inspect(value,font=paperFonts.latin,bold=false){
  if(value==null)return;
  if(typeof value==='string'){for(const ch of value){const cp=ch.codePointAt(0);if(cp>=32)assert(faces[font][bold?'bold':'normal'].hasGlyphForCodePoint(cp),'Missing glyph '+ch);}return;}
  if(Array.isArray(value)){value.forEach(v=>inspect(v,font,bold));return;}
  const f=value.font??font,b=value.bold??bold;
  for(const key of ['text','stack','columns'])if(value[key])inspect(value[key],f,b);
  if(value.table)inspect(value.table.body,f,b);
 }
 const part={doc:parseExport(text('public'+cards[0].downloads.questionsAndKey)),courseTitle:'Divine Ethics 1',collection:cards[0]};
 for(const variant of ['questions','key','both']){const doc=buildPaperDocument([part],variant,'MED25 Ethics 1');inspect(doc.content);inspect(doc.footer(1,2));}
});
test('individual and combined saved progress are restored separately from Religion',async()=>{
 const combined=await combinedSourceSelection(cards,cards.map(c=>c.id));
 assert.equal(combined.gradedQuestionIds.length,10);
 assert.equal(readCombinedSelections(JSON.stringify([{...combined,exam}])).length,1);
 const session=reconcileFinalExamSession(null,questions,'test');
 const keys=[finalPaperKey(exam),finalPaperKey(exam,cards[0].id),finalPaperKey(exam,combined.id)];
 for(const key of keys)assert(key.startsWith(exam+':'+bank));
 const progress=parseFinalExamProgress(JSON.stringify({version:2,sessions:Object.fromEntries(keys.map(k=>[k,session]))}));
 for(const key of keys)assert.deepEqual(progress.sessions[key],session);
 assert.equal(progress.sessions['term2-religion:religion-past-papers'],null);
 assert.equal(read('data/mcq-runtime/index.json').finals[exam+':'+bank].count,10);
});
