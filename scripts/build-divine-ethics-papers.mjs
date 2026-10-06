import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..'),check=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const emit=(p,text)=>{const file=path.join(root,p);if(check)assert.equal(fs.readFileSync(file,'utf8'),text,`Stale ${p}`);else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}};
const json=(p,v)=>emit(p,JSON.stringify(v,null,2)+'\n');
const exam='term2-divine-ethics',bank='divine-ethics-past-papers',bankKey=exam+':'+bank;
const manifest=read('data/divine-ethics/paper-source-manifest.json');
const curriculum=read(`data/review-curriculum/courses/${exam}.json`);
const evidence=read('data/review-curriculum/evidence/question-review-map-v2.json');
const catalog=read('data/mcq-refactor/past-source-catalog.json');
const downloads=read('public/study/past-paper-downloads/catalog.json');
const questions=[],collections=[],assets=[],ids=new Set();
emit('public/study/divine-ethics/paper-audit.md',fs.readFileSync(path.join(root,'docs/divine-ethics-paper-audit.md'),'utf8'));
function asset(source,collectionId){
 const bytes=fs.readFileSync(path.join(root,'public',source.url));
 assert.equal(hash(bytes),source.sha256,'Source drift '+source.url);
 assert.equal(bytes.length,source.bytes);
 assets.push({collectionId,url:source.url,sha256:source.sha256,bytes:bytes.length});
}
for(const archive of manifest.collections){
 const paper=read(`data/divine-ethics/imports/${archive.id}.json`);
 assert.equal(paper.courseLevel,1,'Final Exams must contain Ethics 1 only');
 assert.equal(paper.audit.status,'reviewed');assert(paper.courseEvidence);
 const records=paper.questions.map(row=>{
  const id=`${paper.id}-q${String(row.number).padStart(3,'0')}`;
  assert(!ids.has(id));ids.add(id);
  assert(row.options.length===4&&row.options.every(v=>v.trim()));
  assert(row.options[row.key.charCodeAt(0)-65]);assert(row.lessonPages.length);
  const section=row.sectionId?curriculum.sections.find(s=>s.id===row.sectionId):null;
  assert(!row.sectionId||section);
  const inferred=Boolean(row.inferred||row.key!==row.providedKey||row.acceptedOptionIds?.length>1);
  const refs=[`${paper.title}; original Q${row.number}; original-photo PDF page ${row.page}.`,...row.lessonPages.map(p=>`/study/divine-ethics/references/first-term-lessons.pdf#page=${p}`),...(row.evidence??[]),...(section?[`/study/reviews/divine-ethics.pdf#page=${section.pdfPage} — ${section.title}`]:['This question has no exact teaching section in the current review PDF. Use the first-term lesson notes above.'])];
  const answerReview={basis:inferred?'ai-inferred':'source-reviewed',confidence:inferred?'medium':'high',canonicalSourceId:id,auditedAt:'2026-10-06',evidence:refs};
  const flags=['source-question-not-authored','key-not-official','ethics-1-content-audited',inferred?'ai-inferred-answer':'source-key-transcribed',...(!section?['review-map-unavailable']:[]),...(row.acceptedOptionIds?.length>1?['ambiguous-original-multiple-accepted']:[])];
  questions.push({schemaVersion:'1.0.0',id,revision:1,status:'verified',kind:'single_best_answer',subject:'religion',topic:row.topic,chapter:row.topic,difficulty:2,prompt:row.prompt,options:row.options.map((text,i)=>({id:String.fromCharCode(65+i),text})),correctOptionId:row.key,...(row.acceptedOptionIds?{acceptedOptionIds:row.acceptedOptionIds}:{}),explanation:row.note,distractorExplanations:{},answerReview,learningObjective:`Review ${row.topic} in the supplied course framework.`,source:{title:paper.title,chapter:`Original Q${row.number}`,page:String(row.page),lecture:paper.note,excerpt:`Supplied highlighted choice ${row.providedKey}; study key ${row.key}. ${row.note}`},tags:['term-2',`exam-${exam}`,'divine-ethics-1-past-paper',`final-bank-${bank}`,paper.id,...(section?[`review-section-${section.id}`]:[])],examPriority:'standard',qualityFlags:flags});
  const mapping={sectionId:section?.id??null,uncertain:!section,status:section?'mapped':'needs-crosswalk'};
  curriculum.questions[id]={...mapping,livePractice:false,bankId:bank};
  evidence.questions[id]={examId:exam,bankId:bank,kind:'single_best_answer',...mapping,specificity:section?'section':'unmapped',method:'visual-source-and-course-comparison',evidence:section?`Shared divine-supervision concept in the apple case, review p. ${section.pdfPage}; not an exact verse/paragraph mapping.`:`Current review omits this lesson topic. First-term notes pp. ${row.lessonPages.join(', ')}; no substitute review section assigned.`,sourceQualityFlags:flags};
  return {...row,id,graded:true,answerReview};
 });
 const urls=Object.fromEntries([['questions','questions'],['answerKey','answer-key'],['questionsAndKey','questions-and-key']].map(([key,name])=>[key,`/study/past-paper-downloads/${paper.id}/${name}.md`]));
 const intro=`# ${paper.title}\n\n${paper.note}\n\nCollection ID: ${paper.id}\nCourse: Divine Ethics 1\n\nMissing from the stated 30-item paper: Q${paper.missingSourceNumbers.join(', Q')}. Missing questions are not invented or counted as ungraded items.\n\n## Original sources\n\n${archive.sources.map(s=>`- ${s.title}: ${s.url} — SHA-256 ${s.sha256}`).join('\n')}\n\n`;
 const qs=`## Questions\n\n${records.map(q=>`### ${q.number} · ${q.id}\n\n${q.prompt}\n\n${q.options.map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('\n')}\n\nSource: Original Q${q.number}; source PDF page ${q.page}.\n`).join('\n')}`;
 const keys=`## Answer key and provenance\n\nStudy answers are not an authenticated official key. Course-specific claims are interpreted within the supplied notes.\n\n${records.map(q=>`### ${q.number} · ${q.id}\n\nKey: ${q.key} — ${q.options[q.key.charCodeAt(0)-65]}\n\nKey provenance: ${q.answerReview.basis==='ai-inferred'?'Editorial study answer':'Supplied highlighted answer checked against teaching notes'}. Original mark: ${q.providedKey}.${q.acceptedOptionIds?` Accepted choices: ${q.acceptedOptionIds.join(', ')}.`:''}\n\nExisting answer note: ${q.note}\n\nSource: Original Q${q.number}; source PDF page ${q.page}.\n\n${q.answerReview.evidence.join('\n')}\n`).join('\n')}`;
 for(const [kind,text]of Object.entries({questions:intro+qs,answerKey:intro+keys,questionsAndKey:intro+qs+'\n'+keys})){emit('public'+urls[kind],text);assets.push({collectionId:paper.id,url:urls[kind],bytes:Buffer.byteLength(text),sha256:hash(text)});}
 for(const source of [...archive.sources,...manifest.references])asset(source,paper.id);
 const questionIds=records.map(q=>q.id);
 collections.push({id:paper.id,courseId:exam,bankId:bank,bankKey,title:paper.title,note:paper.note,kind:paper.kind,date:null,dateEvidence:'Accompanying cover: 5 July 2022; question pages lack a date. Association provisional.',courseMatch:'divine-ethics-1-source',defaultEligible:true,originalOrderClaim:true,sources:archive.sources.map(s=>({title:s.title,publicUrl:s.url,sha256:s.sha256,exists:true,note:paper.courseEvidence})),sourceRecordCount:records.length,transcribedQuestionCount:records.length,gradedQuestionCount:records.length,sourceKeyCount:records.length,editorialKeyCount:records.length,inferredKeyCount:records.filter(q=>q.answerReview.basis==='ai-inferred').length,ungradedCount:0,missingSourceNumbers:paper.missingSourceNumbers,questionIds,gradedQuestionIds:questionIds,downloads:urls,originals:archive.sources.map(s=>({name:s.title,url:s.url}))});
 json(`data/divine-ethics/papers/${paper.id}.json`,{...paper,questions:records});
}
function replaceOwned(existing,incoming,belongs,key){const pending=new Map(incoming.map(r=>[key(r),r]));return [...existing.flatMap(r=>{if(!belongs(r))return[r];const replacement=pending.get(key(r));pending.delete(key(r));return replacement?[replacement]:[];}),...pending.values()];}
catalog.collections=replaceOwned(catalog.collections,collections,c=>c.courseId===exam,c=>c.id);
catalog.assets=replaceOwned(catalog.assets,assets,a=>a.collectionId?.startsWith('divine-ethics-'),a=>a.collectionId+'|'+a.url);
for(const[id,m]of Object.entries(evidence.questions))if(m.examId===exam&&m.bankId===bank&&!ids.has(id)){delete evidence.questions[id];delete curriculum.questions[id];}
const summary={emptyReason:null,collectionIds:collections.map(c=>c.id),defaultCollectionIds:collections.map(c=>c.id),hasSourceCollections:true,sourceRecordCount:questions.length,gradedQuestionCount:questions.length};
Object.assign(catalog.courses.find(c=>c.id===exam),summary);
Object.assign(downloads.courses.find(c=>c.id===exam),summary,{collections});
emit(`data/final-exams/${bank}.jsonl`,questions.map(q=>JSON.stringify(q)).join('\n')+'\n');
for(const[p,value]of Object.entries({'data/mcq-refactor/past-source-catalog.json':catalog,'public/study/past-paper-downloads/catalog.json':downloads,[`data/review-curriculum/courses/${exam}.json`]:curriculum,'data/review-curriculum/evidence/question-review-map-v2.json':evidence}))json(p,value);
console.log(`Divine Ethics 1: ${collections.length} source fragment, ${questions.length} scored questions. Unconfirmed course-level material excluded.`);
