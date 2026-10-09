// Distilled paper views and a repetition-ranked Core, derived from reviewed source sidecars.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseExport} from '../../src/lib/paper-pdf/parse-export.mjs';
import {RETAKE_PRACTICE_CHAPTERS} from '../../src/lib/biochemistry/retake-practice-scope.mjs';

const root=new URL('../../',import.meta.url),check=process.argv.includes('--check');
const text=path=>fs.readFileSync(new URL(path,root),'utf8');
const read=path=>JSON.parse(text(path));
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
function emit(path,value){
  const body=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';
  if(check)assert.equal(text(path),body,`Stale ${path}: run npm run biochemistry:retake:distilled:generate`);
  else{fs.mkdirSync(new URL('./',new URL(path,root)),{recursive:true});fs.writeFileSync(new URL(path,root),body);}
}
const exam='term1-biochemistry-retake',base='/study/biochemistry-retake';
const sourceCourse=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id===exam);
const papers=sourceCourse.collections;
const topicMap=read('data/biochemistry-retake/source-topic-map.json');
const families=read('data/biochemistry-retake/source-families.json');
const repeats=read('data/biochemistry-retake/repeat-groups.json');
const guideSelection=read('data/biochemistry-retake/distilled-guide.json');
const review=read('data/biochemistry-retake/review.json');
const curriculum=read(`data/review-curriculum/courses/${exam}.json`);
const all=[...text('data/final-exams/biochemistry-retake-past-papers.jsonl').trim().split('\n').map(JSON.parse),...read('data/term1-telegram/banks.json')[`${exam}:biochemistry-retake-past-papers`]];
const byId=new Map(all.map(q=>[q.id,q]));
assert.equal(byId.size,all.length,'Distinct source occurrences required');
assert.deepEqual(Object.keys(topicMap.questions).sort(),[...byId.keys()].sort(),'Every source question needs a reviewed scope decision');
assert.deepEqual(Object.keys(families.papers).sort(),papers.map(p=>p.id).sort(),'Every source paper needs a family');
const chapters=new Set(RETAKE_PRACTICE_CHAPTERS.map(c=>c.id));
for(const q of all){
  const tag=topicMap.questions[q.id];
  assert.equal(tag.sourceHash,hash([q.prompt,q.options,q.correctOptionId,q.acceptedOptionIds??[],q.subject]),`Stale scope decision: ${q.id}`);
  assert(typeof tag.inScope==='boolean'&&tag.reason,`Missing scope decision: ${q.id}`);
  if(tag.inScope)assert(q.subject==='biochemistry'&&chapters.has(tag.chapterId),`Outside confirmed Biochemistry I: ${q.id}`);
}
const recordFor=new Map();
for(const paper of papers){
  const full=paper.fullPaper??paper;
  const doc=parseExport(text('public'+full.downloads.questionsAndKey));
  for(const block of doc.questions){
    assert(byId.has(block.id)&&!recordFor.has(block.id),`Unknown or multiply assigned source occurrence: ${block.id}`);
    recordFor.set(block.id,{paperId:paper.id,number:block.number});
  }
  assert.deepEqual(doc.questions.map(q=>q.id),full.takeableQuestionIds??full.questionIds??full.gradedQuestionIds,`Source/export drift: ${paper.id}`);
}
assert.equal(recordFor.size,all.length,'Every question must have an original paper');
const inScope=all.filter(q=>topicMap.questions[q.id].inScope);
const graded=inScope.filter(q=>q.correctOptionId&&q.answerReview?.basis!=='unresolved');
const sourcePaper=q=>papers.find(p=>p.id===recordFor.get(q.id).paperId);
const family=q=>families.papers[recordFor.get(q.id).paperId];
const originalUrl=q=>{
  const url=sourcePaper(q).originals[0]?.url;assert(url,`Missing original: ${q.id}`);
  assert(fs.existsSync(new URL('public'+url,root)),`Missing source file: ${url}`);
  return url+(/\.pdf$/i.test(url)&&/^\d+$/.test(q.source.page??'')?`#page=${q.source.page}`:'');
};
const scopeNote='Distilled for the confirmed Biochemistry I retake syllabus. Physiology, histology, Biochemistry II-only metabolism and unclassified items are excluded. Source numbering and study-key qualifications are retained. The downloadable original is the complete source document.';
function exportCollection(collection,questions){
  const urls=Object.fromEntries([['questions','questions'],['answerKey','answer-key'],['questionsAndKey','questions-and-key']].map(([key,name])=>[key,`${base}/papers/${collection.id}/${name}-distilled.md`]));
  const intro=`# ${collection.title}\n\n${collection.note}\n\n${questions.length} retained source records; ${questions.filter(q=>q.correctOptionId).length} scored and ${questions.filter(q=>!q.correctOptionId).length} ungraded.\n\nCollection ID: ${collection.id}\nCourse: ${exam}\n\n## Original sources\n\n${[...new Set(questions.map(q=>recordFor.get(q.id).paperId))].map(id=>{const p=papers.find(p=>p.id===id);return p.originals.map(o=>`- ${p.title}: ${o.url}`).join('\n');}).join('\n')}\n\n`;
  const number=(q,index)=>collection.kind==='core'?String(index+1):recordFor.get(q.id).number;
  const qs='## Questions\n\n'+questions.map((q,index)=>{
    const images=(q.media??[]).map(m=>{const path=m.path.replace(/^\/study\//,'');return '/study/'+path+'?v='+hash(fs.readFileSync(new URL('public/study/'+path,root))).slice(0,16);});
    return `### ${number(q,index)} · ${q.id}\n\n${q.prompt}\n\n${q.options.map(o=>`${o.id}. ${o.text}`).join('\n')}\n\n${images.length?'Image: '+images.join(' | ')+'\n\n':''}Source: ${sourcePaper(q).title} · original Q${recordFor.get(q.id).number} · ${originalUrl(q)}\n`;
  }).join('\n');
  const keys='## Answer key and provenance\n\nSource markings and editorial study answers are distinguished below. Ungraded items do not affect scores.\n\n'+questions.map((q,index)=>`### ${number(q,index)} · ${q.id}\n\nKey: ${q.correctOptionId?`${q.correctOptionId} — ${q.options.find(o=>o.id===q.correctOptionId).text}`:'Not graded — no reliable scored key'}\n\n${q.explanation}\n\nKey provenance: ${q.answerReview?.basis==='source-reviewed'?'Source-reviewed study key':q.correctOptionId?'Editorial study answer':'Unresolved / written response'}${q.acceptedOptionIds?.length?'; accepted choices: '+q.acceptedOptionIds.join(', '):''}\n\nProvenance note: ${(q.answerReview?.evidence??[]).join(' | ')}\n\nQuestion source: ${sourcePaper(q).title} · original Q${recordFor.get(q.id).number} · ${originalUrl(q)}\n`).join('\n');
  for(const [key,body] of Object.entries({questions:intro+qs,answerKey:intro+keys,questionsAndKey:intro+qs+'\n'+keys}))emit('public'+urls[key],body.replace(/[ \t]+$/gm,''));
  return {...collection,downloads:urls};
}
const collections=papers.map(p=>{
  const questions=(p.fullPaper??p).questionIds.map(id=>byId.get(id)).filter(q=>topicMap.questions[q.id].inScope);
  const {fullPaper,downloads,...original}=p;
  return exportCollection({...original,id:p.id+'-distilled',originalCollectionId:p.id,distilled:true,independent:true,title:p.title.replace(/ · Biochemistry(?: only)?$/,'')+' · Distilled',note:scopeNote+' '+p.note,
    sourceRecordCount:questions.length,transcribedQuestionCount:questions.length,gradedQuestionCount:questions.filter(q=>q.correctOptionId).length,ungradedCount:questions.filter(q=>!q.correctOptionId).length,
    sourceKeyCount:questions.filter(q=>q.correctOptionId&&q.answerReview?.basis==='source-reviewed').length,editorialKeyCount:questions.filter(q=>q.correctOptionId&&q.answerReview?.basis!=='source-reviewed').length,
    questionIds:questions.map(q=>q.id),takeableQuestionIds:questions.map(q=>q.id),gradedQuestionIds:questions.filter(q=>q.correctOptionId).map(q=>q.id)},questions);
});
assert.equal(collections.reduce((n,p)=>n+p.sourceRecordCount,0),inScope.length);
emit(`public${base}/past-papers-distilled.json`,{id:exam,title:'Biochemistry I Retake · Distilled',emptyReason:null,scope:scopeNote,sourceQuestionCount:all.length,retainedQuestionCount:inScope.length,excludedQuestionCount:all.length-inScope.length,collections});

// Preserve scientific symbols, numbers and negation. Only formatting/case normalize automatically.
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const signature=q=>JSON.stringify([normalize(q.prompt),q.options.map(o=>normalize(o.text)).sort(),q.options.filter(o=>o.id===q.correctOptionId||q.acceptedOptionIds?.includes(o.id)).map(o=>normalize(o.text)).sort(),(q.media??[]).map(m=>m.path)]);
const parent=new Map(graded.map(q=>[q.id,q.id]));
function find(id){assert(parent.has(id),`Unknown graded member: ${id}`);const p=parent.get(id);if(p!==id)parent.set(id,find(p));return parent.get(id);}
function join(a,b){parent.set(find(b),find(a));}
const exact=new Map();
for(const q of graded){const key=signature(q);if(exact.has(key))join(exact.get(key),q.id);else exact.set(key,q.id);}
for(const group of repeats.groups){
  assert(group.reason&&group.questionIds.length>=2,group.label);
  for(const id of group.questionIds)assert(byId.has(id),`Unknown reviewed repeat: ${id}`);
  const ids=group.questionIds.filter(id=>parent.has(id));
  for(const id of ids.slice(1))join(ids[0],id);
}
const groups=new Map();
for(const q of graded){const id=find(q.id);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(q);}
const votes=qs=>[...new Set(qs.filter(q=>family(q).role==='exam').map(q=>family(q).familyId))].sort();
const topicVotes=new Map();
for(const q of graded){const chapter=topicMap.questions[q.id].chapterId;if(!topicVotes.has(chapter))topicVotes.set(chapter,new Set());if(family(q).role==='exam')topicVotes.get(chapter).add(family(q).familyId);}
const labels=new Map();
for(const group of repeats.groups){const id=group.questionIds.find(id=>parent.has(id));if(id)labels.set(find(id),group.label);}
const member=q=>({questionId:q.id,paperId:recordFor.get(q.id).paperId,sourceNumber:recordFor.get(q.id).number,sourceUrl:originalUrl(q),familyId:family(q).familyId,role:family(q).role});
const rows=[...groups.entries()].filter(([,qs])=>votes(qs).length>=2).map(([id,qs])=>{
  // Prefer a complete, keyed exam occurrence. Supporting recollections never become representatives.
  const rank=q=>Number(!sourcePaper(q).defaultEligible)*10+Number(!q.id.startsWith('retake-final-'));
  const q=qs.filter(q=>family(q).role==='exam').sort((a,b)=>rank(a)-rank(b)||a.id.localeCompare(b.id))[0];
  const chapter=topicMap.questions[q.id].chapterId,section=curriculum.sections.find(s=>s.id===`biochemistry-retake/${chapter}`);assert(section,q.id);
  return {questionId:q.id,questionText:q.prompt,kind:'repeat',reason:labels.get(id)??'Same question wording, choices and accepted answer',paperId:recordFor.get(q.id).paperId,sectionId:section.id,sectionTitle:section.title,pdfPage:section.pdfPage,
    sourceUnitLabel:'source families',sourceCollectionCount:votes(qs).length,sourceFamilyIds:votes(qs),topicCollectionCount:topicVotes.get(chapter).size,sourcePaperIds:[...new Set(qs.map(q=>recordFor.get(q.id).paperId))].sort(),members:qs.map(member)};
}).sort((a,b)=>b.sourceCollectionCount-a.sourceCollectionCount||a.sectionId.localeCompare(b.sectionId)||a.questionId.localeCompare(b.questionId));
assert(rows.length,'No repeated patterns found');
assert.equal(new Set(rows.map(r=>find(r.questionId))).size,rows.length,'A repeated pattern may appear only once');
const sections=curriculum.sections.filter(s=>rows.some(r=>r.sectionId===s.id)).map(s=>({id:s.id,title:s.title,pdfPage:s.pdfPage,count:rows.filter(r=>r.sectionId===s.id).length,repeated:rows.filter(r=>r.sectionId===s.id).length,sourceCollectionCount:topicVotes.get(s.id.split('/').at(-1)).size}));
const methodology='One existing keyed past-paper question per detected repeated pattern, ranked by the number of distinct exam-source families. A pattern needs at least two exam families. Alternate scans, reordered copies and overlapping versions count once; recall notes and student compilations provide supporting evidence only. Exact wording/choice/answer matches and explicitly reviewed equivalent questions are combined; shared topics alone are not repeats. Historical recurrence is study priority, not an exam prediction.';
const coreId='biochemistry-retake-core-distilled';
const coreQuestions=rows.map(r=>byId.get(r.questionId));
const downloadCollection=exportCollection({id:coreId,courseId:exam,title:'Biochemistry I Core Exam · Distilled',note:methodology+' Core numbering follows this selection; original question numbers remain in source references. '+scopeNote,kind:'core',courseMatch:'source-course',defaultEligible:true,distilled:true,independent:true,sourceRecordCount:rows.length,gradedQuestionCount:rows.length,ungradedCount:0,questionIds:coreQuestions.map(q=>q.id),gradedQuestionIds:coreQuestions.map(q=>q.id),originals:[]},coreQuestions);
const result={revision:'2026-10-09.1',idPrefix:coreId,title:'Biochemistry I Core Exam',distilled:true,sourceQuestionCount:inScope.length,gradedSourceQuestionCount:graded.length,sourceCollectionCount:papers.length,sourceFamilyCount:new Set(Object.values(families.papers).filter(p=>p.role==='exam').map(p=>p.familyId)).size,
  optionalQuestionCount:all.length-inScope.length,repeatedPatternCount:rows.length,repeatedSourceOccurrenceCount:rows.reduce((n,r)=>n+r.members.length,0),supplementalCount:0,
  methodology,exclusionNote:scopeNote,papers:papers.map(p=>({id:p.id,title:p.title,url:p.originals[0].url,...families.papers[p.id]})),sections,questions:rows,downloadCollection,
  sourceFingerprint:hash([all,papers,topicMap,families,repeats,curriculum.sections])};
result.fingerprint=hash(result);
emit(`public${base}/core-exam-distilled.json`,result);

const seenConcepts=new Set();
const guideSections=guideSelection.sections.map(s=>{
  const chapter=review.sections.find(c=>c.id===s.chapterId),section=curriculum.sections.find(c=>c.id===`biochemistry-retake/${s.chapterId}`);assert(chapter&&section,s.chapterId);
  const concepts=s.conceptIds.map(id=>{
    const concept=chapter.concepts.find(c=>c.id===id);assert(concept&&!seenConcepts.has(id),`Unknown/repeated guide concept: ${id}`);seenConcepts.add(id);
    const override=guideSelection.conceptOverrides?.[id];if(override)assert(override.reason&&override.sourceUrl&&override.summary,id);
    return {id,title:concept.title,summary:override?.summary??concept.summary,keyPoints:concept.keyPoints,sourceEvidence:concept.sourceEvidence,...(override?{correctionSourceUrl:override.sourceUrl}: {})};
  });
  const sourceQuestions=s.sourceQuestionIds.map(id=>{
    assert(topicMap.questions[id]?.inScope&&topicMap.questions[id].chapterId===s.chapterId,`Guide evidence outside chapter: ${id}`);
    const q=byId.get(id);return {id,paperId:recordFor.get(id).paperId,title:sourcePaper(q).title,number:recordFor.get(id).number,url:originalUrl(q)};
  });
  assert(sourceQuestions.length&&concepts.length,s.chapterId);
  return {chapterId:s.chapterId,title:s.title,focus:s.focus,pdfPage:section.pdfPage,reviewUrl:curriculum.volumes[0].url+`#page=${section.pdfPage}`,sourceQuestions,concepts};
});
const guide={title:guideSelection.title,scope:'A concise review of concepts tested in the in-scope Biochemistry I past papers, including theory and laboratory principles. This is a study selection, not a replacement for the full confirmed syllabus.',conceptCount:seenConcepts.size,sourceQuestionCount:new Set(guideSections.flatMap(s=>s.sourceQuestions.map(q=>q.id))).size,reviewUrl:curriculum.volumes[0].url,sections:guideSections};
guide.fingerprint=hash([guide,guideSelection,review]);
emit(`public${base}/guide-distilled.json`,guide);
emit('docs/biochemistry-retake-distilled.md',[
  '# Biochemistry I retake: distilled papers and Core Exam','',
  `${papers.length} source papers, ${all.length} original occurrences reviewed. ${inScope.length} in-scope occurrences (${graded.length} scored; ${inScope.length-graded.length} ungraded); ${all.length-inScope.length} excluded or unclassified.`,
  '',scopeNote,'',`${rows.length} deduplicated Core questions; ${result.repeatedSourceOccurrenceCount} supporting occurrences. ${result.sourceFamilyCount} voting exam families. No coverage fillers.`,
  '',methodology,'',`${guide.conceptCount} existing review concepts selected across ${guideSections.length} sections, supported by ${guide.sourceQuestionCount} example source occurrences. Any guide-only scientific correction is explicitly sourced in the authoring manifest.`,
  '','## Source variants','','| Source paper | Distilled items | Scored | Ungraded | Family role |','|---|---:|---:|---:|---|',
  ...collections.map(p=>`| ${p.title} | ${p.sourceRecordCount} | ${p.gradedQuestionCount} | ${p.ungradedCount} | ${families.papers[p.originalCollectionId].role} |`),
  '','## Core evidence','','| Original question | Exam families | Review chapter |','|---|---:|---|',...rows.map(r=>`| ${r.questionId} | ${r.sourceCollectionCount} | ${r.sectionTitle} |`),
  '','## Maintenance','',
  'Reviewed question tags, source families, semantic equivalences and guide selections live in data/biochemistry-retake. Every topic tag is bound to a source-content hash. Run npm run biochemistry:retake:distilled:generate after a reviewed update; the check command rejects stale outputs. Existing source banks and full originals remain unchanged. Distilled paper IDs separate their saved attempts from historical full-paper or broader biochemistry attempts. Core and chapter attempts are independent of paper attempts.','',
].join('\n'));
console.log(JSON.stringify({status:check?'checked':'generated',papers:collections.length,retained:inScope.length,excluded:all.length-inScope.length,core:rows.length,guideConcepts:guide.conceptCount}));
