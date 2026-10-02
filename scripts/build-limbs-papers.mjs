import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),check=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const emit=(p,text)=>{const dest=path.join(root,p);if(check)assert.equal(fs.readFileSync(dest,'utf8'),text,`Stale ${p}`);else{fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text);}};
const json=(p,v)=>emit(p,JSON.stringify(v,null,2)+'\n');
const exam='term2-limbs',bank='limbs-past-papers',bankKey=exam+':'+bank;
const manifest=read('data/limbs/source-manifest.json');
const curriculum=read(`data/review-curriculum/courses/${exam}.json`);
const evidence=read('data/review-curriculum/evidence/question-review-map-v2.json');
const sourceCatalog=read('data/mcq-refactor/past-source-catalog.json');
const downloadCatalog=read('public/study/past-paper-downloads/catalog.json');
const finals=[],collections=[],assets=[],allRecords=[],ids=new Set();
for(const archive of manifest.collections){
 const paper=read(`data/limbs/imports/${archive.id}.json`);
 assert.equal(paper.audit.status,'reviewed',paper.id+' missing audit');
 const records=[],questionIds=[],gradedQuestionIds=[],limbQuestionIds={upper:[],lower:[],axial:[],general:[]},limbSourceCounts={upper:0,lower:0,axial:0,general:0};
 for(const row of paper.questions){
  const id=`${paper.id}-q${String(row.number).padStart(3,'0')}`;
  assert(!ids.has(id));ids.add(id);
  assert(['upper','lower','axial','general'].includes(row.region),id+' region');
  assert(row.prompt.trim()&&row.options.every(o=>typeof o==='string'&&o.trim()),id);
  assert(Number.isInteger(row.page)&&row.page>0,id+' page');
  const section=curriculum.sections.find(s=>s.order===row.sectionOrder||Number(s.id.match(/limbs-(\d+)-/)?.[1])===row.sectionOrder);
  const graded=Boolean(row.key&&row.options.length>=2);
  assert(!graded||section||(row.region==='axial'&&row.topic&&row.evidence?.length),id+' course mapping or explicit axial reference');
  assert(!graded||row.options[row.key.charCodeAt(0)-65],id+' invalid answer');
  assert(!row.acceptedOptionIds||row.acceptedOptionIds.includes(row.key),id+' canonical key must be accepted');
  const inferred=!row.providedKey||row.key!==row.providedKey||Boolean(row.acceptedOptionIds?.length>1)||Boolean(row.sourcePrompt);
  const refs=[`${paper.title}; original Q${row.sourceNumber}, source page ${row.page}.`,...(section?[`/study/reviews/limbs.pdf#page=${section.pdfPage} — ${section.title}`]:[]),...(row.evidence??[])];
  const answerReview={basis:inferred?'ai-inferred':'source-reviewed',confidence:inferred?'medium':'high',canonicalSourceId:id,auditedAt:paper.audit.date??'2026-09-30',evidence:refs};
  const record={...row,id,graded,sectionId:section?.id??null,answerReview};records.push(record);allRecords.push(record);questionIds.push(id);limbSourceCounts[row.region]++;
  if(!graded)continue;
  gradedQuestionIds.push(id);limbQuestionIds[row.region].push(id);
  const flags=['source-question-not-authored','key-not-official',inferred?'ai-inferred-answer':'source-key-transcribed',...(row.sourceOptions||row.sourcePrompt?['editorially-repaired-source-question']:[]),...(row.acceptedOptionIds?.length>1?['ambiguous-original-multiple-accepted']:[])];
  const topic=section?.title??row.topic;
  const question={schemaVersion:'1.0.0',id,revision:1,status:'verified',kind:row.media?'image_single_best_answer':'single_best_answer',subject:row.subject??'anatomy',topic,chapter:topic,difficulty:2,prompt:row.prompt,options:row.options.map((text,i)=>({id:String.fromCharCode(65+i),text})),correctOptionId:row.key,...(row.acceptedOptionIds?{acceptedOptionIds:row.acceptedOptionIds}:{}),explanation:row.note,answerReview,distractorExplanations:{},learningObjective:`Review ${topic}`,source:{title:paper.title,chapter:`Original Q${row.sourceNumber}`,page:String(row.page),lecture:paper.note,excerpt:`${row.providedKey?`Supplied mark ${row.providedKey}. `:'No reliable source key. '}Study answer ${row.key}. ${row.note}`},tags:['term-2','exam-term2-limbs','limbs-past-paper',`limb-region-${row.region}`,`final-bank-${bank}`,paper.id,...(section?[`review-section-${section.id}`]:[])],examPriority:'standard',qualityFlags:flags};
  if(row.media){const file=path.join(root,'public/study',row.media.path);assert(fs.existsSync(file),id+' missing figure');const bytes=fs.readFileSync(file);assets.push({collectionId:paper.id,url:'/study/'+row.media.path,bytes:bytes.length,sha256:hash(bytes)});question.media=[{id:id+'-figure',type:'image',path:row.media.path,alt:row.media.alt,caption:'Original source figure, with answer marks excluded.',attribution:paper.title}];}
  if(row.sourceOptions)question.source.excerpt+=` Original choices: ${row.sourceOptions.map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('; ')}`;
  if(row.sourcePrompt)question.source.excerpt+=` Original stem: ${row.sourcePrompt}`;
  finals.push(question);
  const mapping={sectionId:section?.id??null,uncertain:!section,status:section?'mapped':'needs-crosswalk'};
  curriculum.questions[id]={...mapping,livePractice:false,bankId:bank};
  evidence.questions[id]={examId:exam,bankId:bank,kind:question.kind,...mapping,specificity:section?'section':'unmapped',method:'source-question-review-page-audit',evidence:section?`Concept mapped to ${section.title}, review PDF p. ${section.pdfPage}. Mapping indicates the review section, not a claim of an exact duplicate paragraph.`:`Axial source item retained in Full only. No matching section in the limb review; consult explicit references: ${row.evidence.join('; ')}`,sourceQualityFlags:flags};
 }
 const sources=archive.sources;
 const scanNote=sources.some(s=>s.processing)?' Large scanned PDFs are web-optimized; untouched originals remain in the local archive.':'';
 for(const s of sources){const bytes=fs.readFileSync(path.join(root,'public',s.url));assert.equal(hash(bytes),s.sha256);assets.push({collectionId:paper.id,url:s.url,bytes:bytes.length,sha256:s.sha256});}
 const downloads=Object.fromEntries([['questions','questions'],['answerKey','answer-key'],['questionsAndKey','questions-and-key']].map(([k,v])=>[k,`/study/past-paper-downloads/${paper.id}/${v}.md`]));
 const intro=`# ${paper.title}\n\n${paper.note}${scanNote}\n\nCollection ID: ${paper.id}\nCourse: Upper & Lower Limbs\n\nSource questions, not newly authored MCQs. Study answers are reviewed/inferred and are not authenticated official university keys. Original wording defects and alternative acceptable answers are disclosed below.\n\n${!sources.length?'Original account screenshots are retained in the private archive; identifying student details are not republished.\n\n':''}## Original sources\n\n${sources.map(s=>`- ${s.title}: ${s.url} — SHA-256 ${s.sha256}${s.processing?` — ${s.processing} Original SHA-256 ${s.originalSha256}.`:''}`).join('\n')}\n\n`;
 const questions=`## Questions\n\n${records.map(r=>`### ${r.number} · ${r.id}\n\n${r.sourcePrompt??r.prompt}\n\n${(r.sourceOptions??r.options).map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('\n')}${r.sourceOptions||r.sourcePrompt?`\n\nPractice correction (original choices above): ${r.note}`:''}\n\nSource: ${['upper','lower'].includes(r.region)?r.region+' limb':r.region+' anatomy'} · original Q${r.sourceNumber}, page ${r.page}.${r.media?`\n\nOriginal figure: /study/${r.media.path}`:''}\n${!r.graded?`\nStatus: Ungraded — ${r.note}\n`:''}`).join('\n')}\n`;
 const key=`## Answer key and review locations\n\n${records.map(r=>`### ${r.number} · ${r.id}\n\nKey: ${r.graded?`${r.key} — ${r.options[r.key.charCodeAt(0)-65]}`:'Ungraded — incomplete or ambiguous source.'}${r.acceptedOptionIds?`\n\nAccepted choices for the original wording: ${r.acceptedOptionIds.join(', ')}.`:''}\n\nExisting answer note: ${r.note}\n\nKey provenance: ${r.providedKey?`Original supplied mark: ${r.providedKey}.`:'No reliable source answer selection.'} ${r.answerReview.basis==='ai-inferred'?'Editorial study answer.':'Supplied answer independently checked.'}\n\n${r.answerReview.evidence.join('\n')}\n`).join('\n')}\n${paper.excludedItems.length?`## Other archive content\n\n${paper.excludedItems.map(r=>`- ${r.reason}`).join('\n')}\n`:''}`;
 for(const [kind,raw]of Object.entries({questions:intro+questions,answerKey:intro+key,questionsAndKey:intro+questions+key})){const text=raw.trimEnd()+'\n';emit('public'+downloads[kind],text);assets.push({collectionId:paper.id,url:downloads[kind],bytes:Buffer.byteLength(text),sha256:hash(text)});}
 const collection={id:paper.id,courseId:exam,bankId:bank,bankKey,title:paper.title,note:paper.note,kind:paper.kind,date:null,dateEvidence:paper.note,courseMatch:paper.defaultEligible?'limbs-source':'supplement-or-reference',defaultEligible:paper.defaultEligible,originalOrderClaim:true,sources:sources.map(s=>({title:s.title,publicUrl:s.url,sha256:s.sha256,exists:true,note:paper.note})),sourceRecordCount:records.length,transcribedQuestionCount:records.length,gradedQuestionCount:gradedQuestionIds.length,sourceKeyCount:records.filter(r=>r.providedKey).length,editorialKeyCount:gradedQuestionIds.length,inferredKeyCount:records.filter(r=>r.graded&&r.answerReview.basis==='ai-inferred').length,ungradedCount:records.length-gradedQuestionIds.length,missingSourceNumbers:paper.missingSourceNumbers??[],questionIds,gradedQuestionIds,limbQuestionIds,limbSourceCounts,downloads,originals:sources.map(s=>({name:s.title,url:s.url}))};
 collection.note+=scanNote;
 collection.originalOrderClaim=paper.originalOrderClaim!==false;
 collections.push(collection);
 // Runtime records contain no private workstation paths.
 const {originalFiles,...portable}=paper;
 json(`data/limbs/papers/${paper.id}.json`,{...portable,questions:records});
}
// Keep unrelated course ordering intact: other generators share these catalogs.
// Removing/re-appending our entire group made --check depend on which ran last.
function replaceOwned(existing,incoming,belongs,key){
 const pending=new Map(incoming.map(row=>[key(row),row]));
 const out=existing.flatMap(row=>{
  if(!belongs(row))return [row];
  const replacement=pending.get(key(row));pending.delete(key(row));
  return replacement?[replacement]:[];
 });
 return [...out,...pending.values()];
}
sourceCatalog.collections=replaceOwned(sourceCatalog.collections,collections,c=>c.courseId===exam,c=>c.id);
sourceCatalog.assets=replaceOwned(sourceCatalog.assets,assets,a=>a.collectionId?.startsWith('limbs-'),a=>a.collectionId+'|'+a.url);
for(const [id,m]of Object.entries(evidence.questions))if(m.examId===exam&&m.bankId===bank&&!ids.has(id)){delete evidence.questions[id];delete curriculum.questions[id];}
const summary={emptyReason:null,collectionIds:collections.map(c=>c.id),defaultCollectionIds:collections.filter(c=>c.defaultEligible).map(c=>c.id),hasSourceCollections:true,sourceRecordCount:allRecords.length,gradedQuestionCount:finals.length};
Object.assign(sourceCatalog.courses.find(c=>c.id===exam),summary);
Object.assign(downloadCatalog.courses.find(c=>c.id===exam),summary,{collections});
emit(`data/final-exams/${bank}.jsonl`,finals.map(q=>JSON.stringify(q)).join('\n')+'\n');
for(const [p,v]of Object.entries({'data/mcq-refactor/past-source-catalog.json':sourceCatalog,'public/study/past-paper-downloads/catalog.json':downloadCatalog,[`data/review-curriculum/courses/${exam}.json`]:curriculum,'data/review-curriculum/evidence/question-review-map-v2.json':evidence}))json(p,v);
json('data/limbs/import-audit.json',{version:1,date:manifest.updatedAt??'2026-09-30',collections:collections.length,sourceItems:allRecords.length,scored:finals.length,ungraded:allRecords.filter(r=>!r.graded).length,upper:finals.filter(q=>q.tags.includes('limb-region-upper')).length,lower:finals.filter(q=>q.tags.includes('limb-region-lower')).length,fullOnly:finals.filter(q=>q.tags.includes('limb-region-axial')||q.tags.includes('limb-region-general')).length,papers:collections.map(c=>({id:c.id,sourceItems:c.sourceRecordCount,scored:c.gradedQuestionCount,defaultEligible:c.defaultEligible,upper:c.limbQuestionIds.upper.length,lower:c.limbQuestionIds.lower.length,fullOnly:c.limbQuestionIds.axial.length+c.limbQuestionIds.general.length}))});
console.log(`Limbs: ${collections.length} papers, ${allRecords.length} source items, ${finals.length} scored.`);
