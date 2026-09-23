import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Portable authoring input: no dependency on Downloads, OCR or the local medical archive.
const root=path.resolve(import.meta.dirname,'..');
const check=process.argv.includes('--check');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const emit=(file,text)=>{const target=path.join(root,file);if(check)assert.equal(fs.readFileSync(target,'utf8'),text,`Stale ${file}`);else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);}};
const hash=value=>createHash('sha256').update(value).digest('hex');
const data=read('data/biochemistry/past-papers.json');
const curriculum=read('data/review-curriculum/courses/term2-biochemistry.json');
const evidence=read('data/review-curriculum/evidence/question-review-map-v2.json');
const sourceCatalog=read('data/mcq-refactor/past-source-catalog.json');
const downloadCatalog=read('public/study/past-paper-downloads/catalog.json');
const bank=data.bankId,exam=data.courseId,bankKey=exam+':'+bank;
// Rebuild only this bank's mappings; other courses and their history stay untouched.
for(const [id,m] of Object.entries(evidence.questions))if(m.examId===exam&&m.bankId===bank){delete evidence.questions[id];delete curriculum.questions[id];}

// Prioritized stem-level routing. These map to actual PDF headings, not invented chapters.
// Clinical diagnostics absent from the review outline stay explicitly unmapped.
const routes=[
 ['aa-disorders',/phenylketon|hartnup|maple syrup|homocystin|alkapton|albinism|branched.chain.*deficien/i],
 ['nucleotides',/purin|pyrimid|nucleotid|nucleosid|uric acid|hyperuric|lesch|hgprt|scid|thioredoxin|ribonucle|xanthine|orotic|de novo.*imp|imp.*synthesis/i],
 ['heme',/bilirubin|jaundice|porphyr|heme|haem|urobilin|crigler|gilbert|kernicter|biliverdin/i],
 ['special-products',/creatine(?! kinase)|phosphocreatine|creatinine.*(product|formation)|melanin|dopamine|serotonin|catecholamine|nitric oxide/i],
 ['ppp',/pentose|phosphate shunt|g6pd|glucose.6.phosphate dehydrogenase|nadph|glutathione|favism/i],
 ['glycogen',/glycogen|von gierke|mcardle|pompe|debranch/i],
 ['gluconeogenesis',/gluconeogen|cori cycle|pyruvate.*phosphoenolpyruvate|conversion.*pyruvate.*pep/i],
 ['other-sugars',/galactos|fructose intolerance|sorbitol|polyol pathway|essential fructosuria/i],
 ['glucose-entry',/glucose transport|glut.?[1-5]|glucose.*(absorption|transporter)|hexokinase.*glucokinase/i],
 ['glycolysis-regulation',/phosphofructokinase|pfk.?1|pyruvate kinase|lactate|lactic acid|anaerobic.*glycolysis/i],
 ['glycolysis',/glycoly|glyceraldehyde|phosphoglycerate|enolase/i],
 ['ketones',/keton|ketogen|ketolysis|acetoacet|hydroxybutyr|hmg.?coa synthase/i],
 ['beta-oxidation',/beta.?oxidation|β.?oxidation|ß.?oxidation|carnitine|fatty acid.*oxid|oxid.*fatty acid|palmit.*atp|atp.*palmit|lipolysis/i],
 ['fatty-acid-synthesis',/fatty.acid synthesis|acetyl.?coa carboxylase|malonyl|fatty.acyl chains|desatur|acyl.carrier|triglyceride synthesis/i],
 ['lipoprotein-map',/lipoprotein|apoprotein|apolipoprotein|\bhdl\b|\bldl\b|\bvldl\b|\bldl-c\b|lcat|cetp|abeta/i],
 ['micelles-chylomicrons',/chylomicron|micelle/i],
 ['cholesterol',/cholesterol|statin|bile acid|bile salt|smith.lemli|sl.?os|mevalon|isopren|farnesyl|geranyl|steroid/i],
 ['lipid-digestion',/fat digestion|lipid digestion|pancreatic juice|cholecystokinin|orlistat|gallbladder bile|secretin|lingual lipase|gastric lipase|pancreatic lipase|dietary fats/i],
 ['complex-lipids',/sphing|ganglios|phospholipid|prostagland|eicosanoid|tay.sachs|gaucher|niemann|arachidonic|lipoxygenase|cyclooxygenase/i],
 ['urea',/urea cycle|urea.*(nitrogen|atoms|contribut|cycle|synthesi)|ornithine|citrulline|carbamoyl phosphate synthetase i\b/i],
 ['protein-nitrogen',/transamin|deamin|ammonia|amino group|amino acid.*transport|protein.*digest|proteasome|ubiquitin|peptidas|glutamate dehydrogenase/i],
 ['aa-carbon',/glucogenic|ketogenic amino|amino.acid.*(degrad|carbon|essential)|one.carbon|s.adenosyl|homocysteine/i],
 ['pdh-tca',/krebs|kreb.s|citric|tricarboxylic|\btca\b|pyruvate dehydrogenase|succinat|succinyl/i],
 ['oxphos',/electron transport|respiratory chain|oxidative phosphory|cytochrome|atp synthase|uncoupl|coenzyme q|nadh dehydrogenase/i],
 ['insulin-glucagon',/insulin|glucagon|fasting|starvation|postprandial|mixed meal|fed state/i],
 ['diabetes-integration',/diabet|glucosuria|glycosuria|hyperglyc|hypoglyc/i],
 ['vitamins',/vitamin|cofactor|coenzyme|thiamin|biotin|pyridox|riboflavin|pantothen|niacin|folate|folic/i],
 ['nutrition-review',/nitrogen balance|kwashiorkor|marasmus|nutrition|calori|protein.*(quality|value)/i],
];
function sectionFor(paper,q){
 const reviewed = reviewCoverage.questionDestinations.find(r=>r.questionId===`${paper.id}-q${String(q.number).padStart(3,'0')}`);
 if(reviewed) return {sectionId:reviewed.sectionId,uncertain:false};
 if(paper.sourceId==='41'&&q.number===16)return {sectionId:'biochemistry/biochem-nucleotides',uncertain:false};
 if(/(serum|plasma|diagnos|disease|urine|kidney|hepat|myocard|rhabdomy|aminotransferase|alkaline|acid phosphatase|troponin|bun|azotemia)/i.test(q.prompt)
   && !/bilirubin|jaundice|porphyr|insulin|diabet|glyco|phenyl|hartnup|maple syrup|alkapton|urea cycle|sphing|uric acid/i.test(q.prompt))
   return {sectionId:null,uncertain:true};
 const direct=routes.find(([,re])=>re.test(q.prompt));
 if(direct)return {sectionId:'biochemistry/biochem-'+direct[0],uncertain:false};
 const contextual=routes.find(([,re])=>re.test(q.options.join(' ')));
 return {sectionId:contextual?'biochemistry/biochem-'+contextual[0]:null,uncertain:true};
}
// Exact question-level destinations are reviewed against the expanded source PDF.
// Older heuristic rules above remain only for source items not yet audited.
const reviewCoverage=read('data/biochemistry/review-coverage.json');
function evidenceFor(q){
 const refs=[];const text=q.prompt+' '+q.note;
 if(/hmg.*synthase|key ketogenic/i.test(text))refs.push('https://www.ncbi.nlm.nih.gov/books/NBK493179/');
 if(/smith.lemli|7.dehydrocholesterol/i.test(text))refs.push('https://www.ncbi.nlm.nih.gov/books/NBK1143/');
 if(/glycolysis occurs in the cytosol/i.test(text))refs.push('https://www.ncbi.nlm.nih.gov/books/NBK482303/');
 if(/three disulfide/i.test(text))refs.push('https://pubmed.ncbi.nlm.nih.gov/14744022/');
 if(/129.*ATP|106.*ATP|Modern P\/O/i.test(text))refs.push('https://www.bu.edu/aldolase/biochemistry2/17_LipidCatabolism_V2026.pdf');
 if(/basolateral release into portal/i.test(text))refs.push('https://theses.ncl.ac.uk/jspui/bitstream/10443/4897/1/Albalawi%20M%20S%202020.pdf');
 if(/neonatal hyperbilirubinemia/i.test(text))refs.push('https://www.ncbi.nlm.nih.gov/books/NBK532930/');
 if(/Cholestasis is a recognized complication/i.test(text))refs.push('https://pubmed.ncbi.nlm.nih.gov/24436365/');
 return refs;
}
const finalQuestions=[],collections=[],assets=[],ids=new Set();
for(const paper of data.papers){
 const questionIds=[],gradedQuestionIds=[],records=[];
 assert.equal(new Set(paper.questions.map(q=>q.number)).size,paper.questions.length,`Repeated source number ${paper.id}`);
 for(const row of paper.questions){
  const id=`${paper.id}-q${String(row.number).padStart(3,'0')}`;
  assert(!ids.has(id));ids.add(id);questionIds.push(id);
  const options=row.options.map((text,i)=>({id:String.fromCharCode(65+i),text}));
  assert(options.length>=4&&options.length<=5&&options.every(o=>o.text.trim()),id);
  assert(!row.key||options.some(o=>o.id===row.key),id);
  assert(row.acceptedOptionIds.every(k=>options.some(o=>o.id===k)),id);
  const mapping=sectionFor(paper,row);
  const section=curriculum.sections.find(s=>s.id===mapping.sectionId);
  assert(!mapping.sectionId||section,`Unknown section ${mapping.sectionId}`);
  const status=mapping.sectionId?(mapping.uncertain?'needs-review':'mapped'):'needs-crosswalk';
  const inferred=!row.providedKey||row.key!==row.providedKey||row.acceptedOptionIds.length>1;
  const basis=inferred?'ai-inferred':'source-reviewed';
 const reviewed=reviewCoverage.questionDestinations.find(r=>r.questionId===id);
 const refs=[`${paper.title}, original question ${row.number}, source page ${row.page}.`,...(reviewed?[`Biochemistry II review, PDF p. ${reviewed.pdfPage}: ${reviewed.sectionTitle}.`]:[]),...evidenceFor(row)];
  const explanation=row.note||`${options.find(o=>o.id===row.key)?.text??'Withheld'} is the ${inferred?'editorial study answer':'retained source answer'} for the printed question. ${section?`Review: ${section.title}.`:'This clinical/theory detail has no exact section in the current review PDF; consult the original paper and your course notes.'}`;
  const record={...row,id,sectionId:mapping.sectionId,uncertain:mapping.uncertain,answerReview:{basis,confidence:row.note||mapping.uncertain?'medium':'high',canonicalSourceId:id,auditedAt:data.importedAt,evidence:refs},explanation};
  records.push(record);
  if(!row.key)continue;
  const q={schemaVersion:'1.0.0',id,revision:1,status:'verified',kind:row.media?'image_single_best_answer':'single_best_answer',subject:'biochemistry',topic:section?.title??'Clinical biochemistry · additional source topics',chapter:section?`Biochemistry II review: ${section.title}`:paper.title,difficulty:2,prompt:row.prompt,options,correctOptionId:row.key,acceptedOptionIds:row.acceptedOptionIds,explanation,answerReview:record.answerReview,distractorExplanations:{},learningObjective:`Review source question ${row.number}: ${section?.title??'clinical biochemistry'}`,source:{title:paper.original.title,chapter:`${paper.title} · Original Q${row.number}`,page:String(row.page),lecture:paper.note,excerpt:`${row.providedKey?`Supplied mark: ${row.providedKey}. `:''}Study key: ${row.key}; not an authenticated official university key. ${row.note}`},tags:['term-2','exam-term2-biochemistry','biochemistry-metabolism-past-paper',`final-bank-${bank}`,paper.id,...(section?[`review-section-${section.id}`]:[])],examPriority:'standard',qualityFlags:['source-question-not-authored','key-not-official',inferred?'ai-inferred-answer':'source-key-transcribed',...(row.note?['qualified-source-wording']:[]),...(mapping.uncertain?['review-map-uncertain']:[])]};
  if(row.media){assert(fs.existsSync(path.join(root,'public/study',row.media.path)),id);q.media=[{id:id+'-figure',type:'image',...row.media,caption:'Original source figure; numbering retained.',attribution:paper.title}];}
  finalQuestions.push(q);gradedQuestionIds.push(id);
  evidence.questions[id]={examId:exam,bankId:bank,kind:q.kind,sectionId:mapping.sectionId,uncertain:mapping.uncertain,status,specificity:section?'section':'unmapped',method:reviewed?'source-question-review-audit':section?'source-stem-topic-routing':'no-exact-review-heading',evidence:reviewed?`${section.id}: explicit question-level review audit, PDF p. ${reviewed.pdfPage}; concept coverage does not certify the source key.`:section?`${section.id}: ${mapping.uncertain?'suggested by choices; not a confirmed exact match':'matched to the source stem topic'}`:'The source asks a clinical detail not explicitly covered by a review heading.',sourceQualityFlags:q.qualityFlags};
  curriculum.questions[id]={sectionId:mapping.sectionId,uncertain:mapping.uncertain,status,livePractice:false,bankId:bank};
 }
 const sources=[{title:paper.original.title,publicUrl:paper.original.url,sha256:paper.original.sha256,exists:true,note:paper.note}];
 const originalBytes=fs.readFileSync(path.join(root,'public',paper.original.url));assert.equal(hash(originalBytes),paper.original.sha256,`Source drift ${paper.id}`);
 assets.push({collectionId:paper.id,url:paper.original.url,bytes:originalBytes.length,sha256:paper.original.sha256});
 const downloads={questions:`/study/past-paper-downloads/${paper.id}/questions.md`,answerKey:`/study/past-paper-downloads/${paper.id}/answer-key.md`,questionsAndKey:`/study/past-paper-downloads/${paper.id}/questions-and-key.md`};
 const intro=`# ${paper.title}\n\n${paper.note}\n\n${data.keyPolicy} Supplied translations are reproduced as supplied. OCR spacing and obvious recognition errors were repaired; original choice order and numbering are retained.\n\nCollection ID: ${paper.id}\nCourse: Biochemistry II - Metabolism\n\n## Original sources\n\n${sources.map(s=>`- ${s.title}: ${s.publicUrl} — ${s.note}`).join('\n')}\n\n`;
 const questionText=`## Questions\n\n${records.map(r=>`### ${r.number} · ${r.id}\n\n${r.prompt}\n\n${r.options.map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('\n')}\n\nSource: Original Q${r.number}; page ${r.page}.\n${r.media?`\nOriginal figure: /study/${r.media.path}\n`:''}${!r.key?`\nStatus: Ungraded - ${r.note}\n`:''}`).join('\n')}`;
 const keyText=`## Answer key and provenance\n\n${records.map(r=>`### ${r.number} · ${r.id}\n\nKey: ${r.key?`${r.key} — ${r.options[r.key.charCodeAt(0)-65]}`:'Ungraded - no defensible single key'}\n\nKey provenance: ${r.answerReview.basis==='ai-inferred'?'AI-inferred editorial answer':'Transcribed source answer with editorial checks'}; not an official university key.\n\nExisting answer note: ${r.explanation}\n\nProvenance note: ${r.providedKey?`Printed source mark ${r.providedKey}; retained separately from the study key.`:'No authoritative key supplied.'}\n${r.acceptedOptionIds.length>1?`\nNote: Accepted source alternatives: ${r.acceptedOptionIds.join(', ')}.\n`:''}\nSource: Original Q${r.number}; page ${r.page}.\n\n${r.answerReview.evidence.join('\n')}\n`).join('\n')}`;
 for(const [type,text] of Object.entries({questions:intro+questionText,answerKey:intro+keyText,questionsAndKey:intro+questionText+'\n'+keyText})){
  emit('public'+downloads[type],text);assets.push({collectionId:paper.id,url:downloads[type],bytes:Buffer.byteLength(text),sha256:hash(text)});
 }
 collections.push({id:paper.id,courseId:exam,bankId:bank,bankKey,title:paper.title,note:paper.note,kind:paper.defaultEligible?'supplied-source-paper':'supplied-reconstruction',date:paper.date,dateEvidence:paper.note,courseMatch:paper.defaultEligible?'metabolism-and-clinical-theory':'metabolism-reconstruction',defaultEligible:paper.defaultEligible,originalOrderClaim:true,sources,sourceRecordCount:records.length,transcribedQuestionCount:records.length,gradedQuestionCount:gradedQuestionIds.length,sourceKeyCount:records.filter(r=>r.providedKey).length,editorialKeyCount:gradedQuestionIds.length,inferredKeyCount:records.filter(r=>r.key&&r.answerReview.basis==='ai-inferred').length,ungradedCount:records.length-gradedQuestionIds.length,missingSourceNumbers:paper.missingSourceNumbers,questionIds,gradedQuestionIds,downloads,originals:[{name:paper.original.title,url:paper.original.url}]});
 emit(`data/biochemistry/papers/${paper.id}.json`,JSON.stringify({...paper,questions:records},null,2)+'\n');
}
sourceCatalog.collections=[...sourceCatalog.collections.filter(c=>c.courseId!==exam),...collections];
sourceCatalog.assets=[...sourceCatalog.assets.filter(a=>!a.collectionId?.startsWith('biochemistry-')),...assets];
const course=downloadCatalog.courses.find(c=>c.id===exam);assert(course);
const courseSummary={emptyReason:null,collectionIds:collections.map(c=>c.id),defaultCollectionIds:collections.filter(c=>c.defaultEligible).map(c=>c.id),hasSourceCollections:true,sourceRecordCount:collections.reduce((n,c)=>n+c.sourceRecordCount,0),gradedQuestionCount:finalQuestions.length};
Object.assign(sourceCatalog.courses.find(c=>c.id===exam),courseSummary);
Object.assign(course,courseSummary,{collections});
emit(`data/final-exams/${bank}.jsonl`,finalQuestions.map(q=>JSON.stringify(q)).join('\n')+'\n');
for(const [file,value]of Object.entries({'data/mcq-refactor/past-source-catalog.json':sourceCatalog,'public/study/past-paper-downloads/catalog.json':downloadCatalog,'data/review-curriculum/courses/term2-biochemistry.json':curriculum,'data/review-curriculum/evidence/question-review-map-v2.json':evidence}))emit(file,JSON.stringify(value,null,2)+'\n');
console.log(`Biochemistry metabolism: ${collections.length} collections, ${ids.size} source items, ${finalQuestions.length} scored, ${ids.size-finalQuestions.length} retained ungraded.`);
