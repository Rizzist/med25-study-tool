import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Portable, reviewed authoring input. OCR and the user's archive are NOT build dependencies.
const root=path.resolve(import.meta.dirname,'..'),check=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const emit=(p,s)=>{const dest=path.join(root,p);if(check)assert.equal(fs.readFileSync(dest,'utf8'),s,`Stale ${p}`);else{fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,s);}};
const emitJson=(p,v)=>emit(p,JSON.stringify(v,null,2)+'\n');
const exam='term2-respiratory',bank='respiratory-past-papers',bankKey=exam+':'+bank;
const manifest=read('data/respiratory/source-manifest.json');
const papers=manifest.collections.map(s=>({...read(`data/respiratory/imports/${s.id}.json`),archive:s}));
const byPaper=new Map(papers.map(p=>[p.id,p]));
const curriculum=read(`data/review-curriculum/courses/${exam}.json`);
const sectionOverrides=read('data/respiratory/review-section-overrides.json');
const evidence=read('data/review-curriculum/evidence/question-review-map-v2.json');
const sourceCatalog=read('data/mcq-refactor/past-source-catalog.json');
const downloadCatalog=read('public/study/past-paper-downloads/catalog.json');
for(const[id,m]of Object.entries(evidence.questions))if(m.examId===exam&&m.bankId===bank){delete evidence.questions[id];delete curriculum.questions[id];}
const safe=s=>String(s).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');
const qid=(p,q)=>`${p}-q${/^\d+$/.test(String(q))?String(q).padStart(3,'0'):safe(q)}`;
const tokens=s=>new Set(String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>3));
function sectionFor(q,id){
  if(sectionOverrides[id]){
    const section=curriculum.sections.find(s=>s.id===sectionOverrides[id]);
    assert(section,'Invalid audited section '+id);
    return{section,uncertain:false,page:section.pdfPage};
  }
  const pages=[...new Set(q.evidence.flatMap(e=>{const m=e.match(/(?:\/|\b)respiratory\.pdf#page=(\d+)/);return m?[Number(m[1])]:[];}))];
  if(!pages.length)return{section:null,uncertain:true};
  const terms=tokens([q.prompt,...q.reviewTerms,q.note].join(' '));
  const matches=curriculum.sections.filter(s=>pages.includes(s.pdfPage));
  const candidates=matches.length?matches:curriculum.sections.filter(s=>s.pdfPage<=pages[0]&&s.pdfPage>=pages[0]-2);
  const scored=candidates.map(s=>({s,score:[...tokens(s.title)].filter(t=>terms.has(t)).length*3+(s.title.toLowerCase().startsWith(q.subject)?2:0)-(pages[0]-s.pdfPage)})).sort((a,b)=>b.score-a.score);
  return{section:scored[0]?.s??null,uncertain:!scored.length||(scored.length>1&&scored[0].score===scored[1].score),page:pages[0]};
}
const sanitizeRef=s=>s.replace(/^public\/study\//,'/study/').replace(/^\/Users\/.*(?=Past Exams\/)/,'');
const finalQuestions=[],collections=[],assets=[],allRecords=[],ids=new Set(),duplicates=[];

// 10/14 are the same 42-question paper in two photo layouts, not proven sittings.
const a=byPaper.get('respiratory-10'),b=byPaper.get('respiratory-14');
assert.equal(a.questions.length,b.questions.length);
for(let i=0;i<a.questions.length;i++)assert.deepEqual([a.questions[i].prompt,a.questions[i].options,a.questions[i].key],[b.questions[i].prompt,b.questions[i].options,b.questions[i].key],'Duplicate family drift');
duplicates.push({source:'respiratory-14',canonical:'respiratory-10',reason:'All 42 stems, ordered choices and study keys match; separate formatting/annotations, no evidence of a separate sitting.'});
const screenshotAliases=new Map(byPaper.get('respiratory-22').audit.overlapWithJuly2022.map(r=>[r.question,{paper:r.relatedSource,number:r.relatedQuestion}]));
const canonicalScored=new Map();
for(const paper of papers){
  if(paper.id==='respiratory-14')continue;
  assert(Array.isArray(paper.questions)&&paper.audit?.status,'Missing editorial audit '+paper.id);
  const sources=[...paper.archive.sources,...(paper.id==='respiratory-10'?b.archive.sources:[])];
  let note=paper.note;
  if(paper.id==='respiratory-10')note+=' Two photographed versions are combined here: the 42-item set and the seven photos posted 5 September 2025. Same questions and order; no second exam card or extra recurrence count.';
  if(paper.id==='respiratory-22')note+=' The 28 screenshot MCQs reuse the July 2022 canonical question IDs, so combined sessions do not repeat them. Four original short-answer prompts are preserved in downloads.';
  if(sources.some(s=>s.webOptimized))note+=' The downloadable PDF is a legible reduced-size web copy; the full-resolution original is preserved in the local archive.';
  const records=[],questionIds=[],gradedQuestionIds=[];
  for(const row of paper.questions){
    const id=qid(paper.id,row.number);assert(!ids.has(id),'Duplicate ID '+id);ids.add(id);
    assert(row.prompt.trim()&&Number.isInteger(row.page)&&row.page>0,id);
    assert(row.page<=(sources.length>1?paper.archive.sources.length:paper.archive.sources[0].pageCount),id+' source page');
    assert(Array.isArray(row.options)&&row.options.every(o=>typeof o==='string'&&o.trim()),id);
    assert(!row.key||row.options[row.key.charCodeAt(0)-65],id+' key');
    const alias=paper.id==='respiratory-22'?screenshotAliases.get(row.number):null;
    const liveId=alias?qid(alias.paper,alias.number):id;
    const canonical=alias?byPaper.get(alias.paper).questions.find(q=>q.number===alias.number):row;
    // A reference capture never resurrects a disputed canonical item.
    const gradeable=Boolean(row.key&&canonical?.key&&row.options.length>=2);
    const mapping=sectionFor(row,liveId),section=mapping.section;
    assert(!gradeable||section,id+' missing source-verified review location');
    const inferred=!row.providedKey||row.key!==row.providedKey||(row.acceptedOptionIds?.length??0)>1;
    const refs=[`${paper.title}; printed question ${row.sourceNumber}; source page ${row.page}.`,...row.evidence.map(sanitizeRef)];
    const record={...row,id,canonicalQuestionId:liveId,graded:gradeable,sectionId:section?.id??null,uncertain:mapping.uncertain,answerReview:{basis:inferred?'ai-inferred':'source-reviewed',confidence:inferred?'medium':'high',canonicalSourceId:liveId,auditedAt:'2026-09-27',evidence:refs}};
    records.push(record);allRecords.push(record);questionIds.push(id);
    if(!gradeable)continue;
    gradedQuestionIds.push(liveId);
    if(alias){
      assert(canonicalScored.has(liveId),'Missing earlier canonical item '+liveId);
      duplicates.push({source:id,canonical:liveId,reason:'Independent visual comparison of screenshot and July 2022 paper; same question and ordered choices.'});
      continue;
    }
    const options=row.options.map((text,i)=>({id:String.fromCharCode(65+i),text}));
    const question={schemaVersion:'1.0.0',id,revision:1,status:'verified',kind:row.media?'image_single_best_answer':'single_best_answer',subject:row.subject,topic:section.title,chapter:section.title,difficulty:2,prompt:row.prompt,options,correctOptionId:row.key,...(row.acceptedOptionIds?{acceptedOptionIds:row.acceptedOptionIds}:{}),explanation:row.note,answerReview:record.answerReview,distractorExplanations:{},learningObjective:`Review ${section.title}`,source:{title:paper.title,chapter:`Original Q${row.sourceNumber}`,page:String(row.page),lecture:note,excerpt:`${row.providedKey?`Supplied mark ${row.providedKey}. `:'No reliable source key. '}Study answer ${row.key}; source annotations are not authenticated official keys. ${row.note}`},tags:['term-2','exam-term2-respiratory','respiratory-past-paper',`final-bank-${bank}`,paper.id,`review-section-${section.id}`],examPriority:'standard',qualityFlags:['source-question-not-authored','key-not-official',inferred?'ai-inferred-answer':'source-key-transcribed',...(mapping.uncertain?['review-map-uncertain']:[])]};
    if(row.media){assert(fs.existsSync(path.join(root,'public/study',row.media.path)));question.media=[{id:id+'-figure',type:'image',...row.media,caption:'Original source figure; answer marks excluded.',attribution:paper.title}];}
    finalQuestions.push(question);canonicalScored.set(id,question);
    const status=mapping.uncertain?'needs-review':'mapped';
    evidence.questions[id]={examId:exam,bankId:bank,kind:question.kind,sectionId:section.id,uncertain:mapping.uncertain,status,specificity:'section',method:'source-question-review-page-audit',evidence:`Editorial evidence locates this concept on respiratory review PDF p. ${mapping.page}; section heading ${section.title}. ${mapping.uncertain?'Two heading candidates need finer review.':'Not a claim of an exact paragraph match.'}`,sourceQualityFlags:question.qualityFlags};
    curriculum.questions[id]={sectionId:section.id,uncertain:mapping.uncertain,status,livePractice:false,bankId:bank};
  }
  const originals=sources.map(s=>({name:s.title,url:s.url}));
  for(const s of sources){const bytes=fs.readFileSync(path.join(root,'public',s.url));assert.equal(hash(bytes),s.sha256,'Source drift '+s.url);assets.push({collectionId:paper.id,url:s.url,bytes:bytes.length,sha256:s.sha256});}
  const downloads=Object.fromEntries([['questions','questions'],['answerKey','answer-key'],['questionsAndKey','questions-and-key']].map(([k,v])=>[k,`/study/past-paper-downloads/${paper.id}/${v}.md`]));
  const intro=`# ${paper.title}\n\n${note}\n\nSource wording, abbreviations and annotated marks are retained. Study keys are independently reviewed or inferred, not authenticated official university answers. Defective or unreadable items are explicitly ungraded; none is silently assigned a default answer.\n\nCollection ID: ${paper.id}\nCourse: Respiratory\n\n## Original sources\n\n${sources.map(s=>`- ${s.title}: ${s.url} — ${s.webOptimized?'Reduced-size study copy; original retained in medical archive.':'Original archived study file.'}`).join('\n')}\n\n`;
  const questions=`## Questions\n\n${records.map(r=>`### ${r.number} · ${r.id}\n\n${r.prompt}\n\n${(r.sourceOptions??r.options).map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('\n')}\n\nSource: Original Q${r.sourceNumber}; source page ${r.page}.\n${r.sourceOptions?'\nOriginal choice wording retained here. The practice version uses disclosed typographical corrections; see the answer-key explanation.\n':''}${r.media?`\nOriginal figure: /study/${r.media.path}\n`:''}${!r.graded?`\nStatus: Ungraded - ${r.note}\n`:''}`).join('\n')}${!records.length?'No standalone MCQ questions in this source. Use the original labelled reference pages or unmatched key below.\n':''}\n## Archive coverage\n\n${paper.excludedItems.map(r=>`- Page ${r.page}: ${r.reason}`).join('\n')}\n`;
  const keys=`## Answer key and provenance\n\n${records.map(r=>`### ${r.number} · ${r.id}\n\nKey: ${r.key?`${r.key} — ${r.options[r.key.charCodeAt(0)-65]}`:r.shortAnswer?`Short answer — ${r.shortAnswer}`:'Ungraded - no defensible single key'}\n\nKey provenance: ${r.answerReview.basis==='ai-inferred'?'Editorial study answer':'Supplied mark independently reviewed'}; not an official university key.\n\nExisting answer note: ${r.note}\n\nProvenance note: ${r.providedKey?`Source marks ${r.providedKey}; retained separately from the study answer.`:'No unambiguous source selection.'}${r.canonicalQuestionId!==r.id?` Same question as ${r.canonicalQuestionId}; shared for combined-session deduplication.`:''}\n\nSource: Original Q${r.sourceNumber}; source page ${r.page}.\n\n${r.answerReview.evidence.join('\n')}\n`).join('\n')}${paper.unmatchedAnswers?`\nUnmatched key only: ${JSON.stringify(paper.unmatchedAnswers)}\nNo paper match is established; these selections are not used for grading.\n`:''}`;
  for(const[k,content]of Object.entries({questions:intro+questions,answerKey:intro+keys,questionsAndKey:intro+questions+'\n'+keys})){const text=content.trimEnd()+'\n';emit('public'+downloads[k],text);assets.push({collectionId:paper.id,url:downloads[k],bytes:Buffer.byteLength(text),sha256:hash(text)});}
  collections.push({id:paper.id,courseId:exam,bankId:bank,bankKey,title:paper.title,note,kind:paper.kind,date:null,dateEvidence:paper.archive.note,courseMatch:paper.defaultEligible?'respiratory-source':'supplement-or-reference',defaultEligible:paper.defaultEligible,originalOrderClaim:true,sources:sources.map(s=>({title:s.title,publicUrl:s.url,sha256:s.sha256,exists:true,note:paper.archive.note})),sourceRecordCount:records.length,transcribedQuestionCount:records.length,gradedQuestionCount:gradedQuestionIds.length,sourceKeyCount:records.filter(r=>r.providedKey).length,editorialKeyCount:gradedQuestionIds.length,inferredKeyCount:records.filter(r=>r.graded&&r.answerReview.basis==='ai-inferred').length,ungradedCount:records.length-gradedQuestionIds.length,missingSourceNumbers:[],questionIds,gradedQuestionIds,downloads,originals});
  emitJson(`data/respiratory/papers/${paper.id}.json`,{...paper,note,questions:records});
}
sourceCatalog.collections=[...sourceCatalog.collections.filter(c=>c.courseId!==exam),...collections];
sourceCatalog.assets=[...sourceCatalog.assets.filter(a=>!a.collectionId?.startsWith('respiratory-')),...assets];
const summary={emptyReason:null,collectionIds:collections.map(c=>c.id),defaultCollectionIds:collections.filter(c=>c.defaultEligible).map(c=>c.id),hasSourceCollections:true,sourceRecordCount:allRecords.length,gradedQuestionCount:finalQuestions.length};
Object.assign(sourceCatalog.courses.find(c=>c.id===exam),summary);
Object.assign(downloadCatalog.courses.find(c=>c.id===exam),summary,{collections});
emit(`data/final-exams/${bank}.jsonl`,finalQuestions.map(q=>JSON.stringify(q)).join('\n')+'\n');
for(const[p,v]of Object.entries({'data/mcq-refactor/past-source-catalog.json':sourceCatalog,'public/study/past-paper-downloads/catalog.json':downloadCatalog,[`data/review-curriculum/courses/${exam}.json`]:curriculum,'data/review-curriculum/evidence/question-review-map-v2.json':evidence}))emitJson(p,v);
emitJson('data/respiratory/import-audit.json',{version:1,date:'2026-09-27',sourceFolders:papers.length,catalogCollections:collections.length,retainedRecords:allRecords.length,distinctScoredQuestions:finalQuestions.length,ungradedRecords:allRecords.filter(r=>!r.graded).length,duplicateMappings:duplicates,policy:'Keep distinct sittings separate. Merge proven same-paper photo recaptures; reference screenshots share canonical exam IDs. Ungraded and non-MCQ materials remain downloadable, never fabricated as MCQs.',papers:collections.map(c=>({id:c.id,sourceItems:c.sourceRecordCount,scored:c.gradedQuestionCount,ungraded:c.ungradedCount,defaultEligible:c.defaultEligible}))});
console.log(`Respiratory: ${papers.length} archive folders -> ${collections.length} cards; ${allRecords.length} records, ${finalQuestions.length} distinct scored questions; ${allRecords.filter(r=>!r.graded).length} retained ungraded.`);
