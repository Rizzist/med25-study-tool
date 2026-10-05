// Organize the inspected 5 October batch without deleting Downloads or duplicating exams.
// Source classifications are editorial decisions; byte dedupe is deterministic.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'../..');
const archive=path.join(os.homedir(),'Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Past Exams');
const downloads=path.join(os.homedir(),'Downloads');
const batch='october-05-downloads',date='2026-10-05';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const writeNew=(file,bytes)=>{
 if(fs.existsSync(file))assert.equal(hash(fs.readFileSync(file)),hash(bytes),'Refusing to overwrite a different source: '+file);
 else {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
};
const inventory=read(path.join(root,'data/limbs/collection-inventory.json'));
const manifest=read(path.join(root,'data/limbs/source-manifest.json'));
const baseline=inventory.inventory.filter(r=>r.set!==batch);
const id='limbs-lower-attachment-screenshot';
const paper=read(path.join(root,`data/limbs/imports/${id}.json`));

const names=[
 'LOWER LIMB THEORY FINAL EXAM (1).pdf','LOWER LIMB THEORY FINAL EXAM (2).pdf',
 'LWEO1_lower limb online exam  (1).pdf','Limbs Theory 19 jan 22 (1).pdf','Limbs Theory 19 jan 22 (2).pdf',
 'Lower Limb Test Questions.pdf','Lower_Limb_322MCQs_With Answers (1).pdf','Lower_Limb_322MCQs_With Answers.pdf',
 'Lower_Limb_82 MCQs_82_With Answers (1).pdf','Lower_Limb_82 MCQs_82_With Answers.pdf',
 'Lower_Limb_mcqs (1).pdf','Lower_Limb_mcqs.pdf','Lower_limb_scan_2023_mcq (1).pdf',
 'limb mcq IMP (1).pdf','lower limb 2024 (1).pdf','lower_limb_2023_tums (1).pdf',
 'lower_limb_mcq_Quizlet_02.pdf','lower_limb_mcq_Quizlet_02_answers.pdf',
 ...Array.from({length:5},(_,i)=>`photo_${5193121898093995139n+BigInt(i)}_y (1).jpg`),
 ...Array.from({length:6},(_,i)=>`photo_${5246751101724774393n+BigInt(i)}_y.jpg`),
 'photo_5307739031737595333_y.jpg','photo_5307739031737595359_x.jpg',
 'photo_5310277696711949041_x.jpg','photo_5310277696711949091_x.jpg',
 ...Array.from({length:18},(_,i)=>`photo_${5429488023000688813n+BigInt(i)}_y (1).jpg`)
];
const referenceGroups={
 'lower-test-question-compilation':{
  title:'Lower Limb Test Questions · unattributed old-test compilation',
  note:'Reformatted 32-page copy of the 107-question Lower Limb Test Questions compilation already archived as _reference-only/lower-revision-book/01-source.pdf (18 pages). Cover, numbered sequence and final key match; not a new exam or new question bank. The cover references a Center for Academic Excellence and warns that answers may be wrong, without identifying a TUMS sitting. Both source formats are retained; keys have not been fully audited.'
 },
 'lower-322-mcq-booklet':{
  title:'Lower-limb MCQ revision booklet · filename says 322',
  note:'55-page sectioned revision bank, not a dated university paper. Four filenames are byte-identical and share one original. The number 322 comes from the filename, not a verified unique-question count. Some answer grids are incomplete. Not imported into Final Exam.'
 },
 'lower-82-mcq-booklet':{
  title:'Anatomy — Lower Limb · 82-question revision chapter',
  note:'19-page scan of book pages 38–56, ending with answers through Q82. Two downloads are identical. A book chapter, not evidence of an exam sitting. Answers remain source reference, not independently verified app keys.'
 },
 'lower-quizlet-muscles':{
  title:'Lower Limb Muscles · Quizlet practice exports',
  note:'30-page test and 20-page results/answers export. The test shows 54 items across question formats; the answer export begins with a different item, so do not join by question number. Keep together as study reference, not university PYQs or an authenticated key.'
 },
 'lower-khanfour-revision-fragments':{
  title:'Lower limb · Khanfour revision-book crops',
  note:'Two cropped revision-book images: knee questions 16–19 (printed page 33/34, author Dr Ayman Ahmed Khanfour) and talus-fracture/arch question 34. Highlighted choices are not an official exam key. No dated exam provenance; retained as reference only.'
 }
};
const referenceByHash={
 '4d9b1d47e2b8db8969584aabd76c5c43b1b97ebb238537862e80d92965f3ca0f':['lower-test-question-compilation','01-questions-and-source-key.pdf'],
 'cfa873a27444252626c3c33e555bd297bf3cf0ede78cdc53a3cd90f5785d3d28':['lower-322-mcq-booklet','01-questions-and-source-keys.pdf'],
 '44a492175bf589284547ab179d23bbc5b7130cef3018344d09f53a1c25253d82':['lower-82-mcq-booklet','01-questions-and-source-key.pdf'],
 'b3475bf42c4c3dd794dab3f78bbc4e7e5778ee478b81eff47351e3f0bbb42426':['lower-quizlet-muscles','01-practice-test.pdf'],
 '83a23f1f8afbebfb5019f165cf026b4bd27b7a29a479bd4bd374637c777de18b':['lower-quizlet-muscles','02-results-and-answers.pdf'],
 'd7319c9ee39bf6968d6d6b2d461576a318a8d2d7d042f1de9d2a157389085097':['lower-khanfour-revision-fragments','01-knee-q16-19.jpg'],
 '9dac05f5cf91e6e8bc7f68a9022dc0627401491ed26b41a624444e1039f168f7':['lower-khanfour-revision-fragments','02-arches-q34.jpg']
};
const photoCopies={
 'photo_5246751101724774394_y.jpg':['01-cover.jpg','18ac24a03daaa2ddfe84f11652b15c218a103a8f5011e32662a23c715ad8bac4'],
 'photo_5246751101724774393_y.jpg':['02-questions-01-09.jpg','10d1dd14a149df7cf995a950d02de91cc8efd94b7143271ffc99f8ff06f419e2'],
 'photo_5246751101724774395_y.jpg':['03-questions-10-17.jpg','67cd5ffb6391bdf9b3e76510b5f1173a9dfca4830f9bb7b096e9194f420f9ad2'],
 'photo_5246751101724774396_y.jpg':['04-questions-18-24.jpg','112c95a217631c461debd94b51c998b0f5fb69bb33f287a3cdc23fdd4ebfe1d2'],
 'photo_5246751101724774397_y.jpg':['05-questions-25-33.jpg','294e007a37d0da63b19c48cc189c23ea804ab54d27cf1a3895afbf9ff43aab36'],
 'photo_5246751101724774398_y.jpg':['06-questions-34-40.jpg','72788500bc216e91337810f14e1dcf67c68647d6588483338220bf2b273ba6df']
};

// Resolve and validate every classification before modifying the inventory.
const rows=[],copies=[],seen=new Set();
for(const [i,name] of names.entries()){
 const bytes=fs.readFileSync(path.join(downloads,name)),sha256=hash(bytes);
 const row={set:batch,index:i+1,originalName:name,sha256,bytes:bytes.length};
 const old=baseline.find(r=>r.sha256===sha256);
 if(old){
  row.disposition='exact-duplicate';
  if(old.collection)row.collection=old.collection;
  row.archivePath=old.archivePath;
  if(!row.archivePath){
   const source=manifest.collections.find(c=>c.id===old.collection)?.sources.find(s=>s.sha256===sha256||s.originalSha256===sha256);
   assert(source,`No canonical source for ${name}`);
   row.archivePath=`${old.collection}/${source.archiveName}`;
  }
  assert.equal(hash(fs.readFileSync(path.join(archive,row.archivePath))),sha256,`Canonical original mismatch: ${name}`);
  row.classification='Exact byte duplicate of an existing archived source; linked to canonical file, no new questions.';
 }else if(referenceByHash[sha256]){
  const [group,file]=referenceByHash[sha256];
  row.archivePath=`_reference-only/${group}/${file}`;
  row.disposition=seen.has(sha256)?'exact-duplicate':group==='lower-test-question-compilation'?'reference-reformat':'reference-only';
  if(row.disposition==='reference-reformat')row.duplicateOfArchivePath='_reference-only/lower-revision-book/01-source.pdf';
  row.classification=(seen.has(sha256)?'Exact duplicate within this batch. ':'')+referenceGroups[group].note;
  if(!seen.has(sha256))copies.push([row.archivePath,bytes]);
 }else if(photoCopies[name]){
  const [file,expected]=photoCopies[name];assert.equal(sha256,expected);
  row.collection='limbs-lower-midterm-2023';
  row.archivePath=`${row.collection}/reposts-2026-10-05/${file}`;
  row.disposition='same-paper-repost';
  row.classification='Photographed copy of existing 24 January 2023 midterm. Q1–40 match; Q31 still lacks its predicate. Pencil marks are not an official key; no question/answer changes.';
  copies.push([row.archivePath,bytes]);
 }else if(name==='photo_5310277696711949041_x.jpg'){
  assert.equal(sha256,'d517be73f68286dafb80a6b187b71556edf30c97fd38822953c3f01ed0ca9a82');
  row.collection=id;row.archivePath=`${id}/01-question-12.jpg`;row.disposition='new-question';
  row.classification='One new complete attachment-exception question, original Q12. Exam provenance unconfirmed: optional supplement only. Study answer independently checked; blue selection not assumed an official key.';
  copies.push([row.archivePath,bytes]);
 }else if(name==='photo_5310277696711949091_x.jpg'){
  assert.equal(sha256,'d640bd45e8895f68b7efe71f0bb9b5649bd4134e5aecee387ffd4220687bb61e');
  row.collection='limbs-lower-midterm-2023';row.duplicateQuestionId='limbs-lower-midterm-2023-q002';
  row.archivePath=`${id}/duplicates/02-question-17-fibula.jpg`;row.disposition='question-duplicate';
  row.classification='Same stem/alternatives as lower-midterm-2023 Q2, with choices reordered and source number 17. No independent sitting established; retained without another scored copy.';
  copies.push([row.archivePath,bytes]);
 }else throw new Error(`Unclassified source: ${name} ${sha256}`);
 seen.add(sha256);rows.push(row);
}
assert.equal(rows.length,51);
assert.equal(copies.length,15);
for(const [file,bytes]of copies)writeNew(path.join(archive,file),bytes);
const newRow=rows.find(r=>r.disposition==='new-question');
const url=`/study/limbs/past-papers/${newRow.archivePath}`;
writeNew(path.join(root,'public',url),fs.readFileSync(path.join(archive,newRow.archivePath)));
const entry={id,title:paper.title,note:paper.note,sources:[{title:newRow.originalName,archiveName:'01-question-12.jpg',url,sha256:newRow.sha256,bytes:newRow.bytes}]};
const prior=manifest.collections.findIndex(c=>c.id===id);
if(prior<0)manifest.collections.push(entry);else manifest.collections[prior]=entry;
manifest.updatedAt=date;inventory.updatedAt=date;inventory.inventory=[...baseline,...rows];
json(path.join(root,'data/limbs/source-manifest.json'),manifest);
json(path.join(root,'data/limbs/collection-inventory.json'),inventory);
json(path.join(archive,'source-inventory.json'),inventory.inventory);
json(path.join(archive,id,'source-manifest.json'),{...entry,collectedAt:date});
const exported=path.join(root,'public/study/past-paper-downloads',id,'questions-and-key.md');
if(fs.existsSync(exported))fs.writeFileSync(path.join(archive,id,'exam-and-answer-key.md'),fs.readFileSync(exported));
for(const [group,info] of Object.entries(referenceGroups)){
 const dir=path.join(archive,'_reference-only',group);
 const groupRows=rows.filter(r=>r.archivePath.startsWith(`_reference-only/${group}/`));
 const files=[...new Set(groupRows.map(r=>path.basename(r.archivePath)))];
 fs.writeFileSync(path.join(dir,'README.md'),`# ${info.title}\n\nOrganized ${date}. ${info.note}\n\n${files.map(f=>`- [${f}](${f})`).join('\n')}\n\nOriginal downloads retained unchanged. Duplicate filenames and hashes are recorded in source-manifest.json.\n`);
 json(path.join(dir,'source-manifest.json'),{date,title:info.title,note:info.note,sources:groupRows});
}
const summary=rows.reduce((out,row)=>{out[row.disposition]=(out[row.disposition]??0)+1;return out;},{});
const audit={date,batch,files:rows.length,uniqueHashes:new Set(rows.map(r=>r.sha256)).size,newCanonicalFiles:copies.length,newQuestionIds:[`${id}-q012`],summary,rows};
json(path.join(root,'data/limbs/download-audit-2026-10-05.json'),audit);
json(path.join(archive,'download-audit-2026-10-05.json'),audit);
console.log(JSON.stringify({files:rows.length,inventoryFiles:inventory.inventory.length,newCanonicalFiles:copies.length,summary},null,2));
