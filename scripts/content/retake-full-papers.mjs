import assert from 'node:assert/strict';

// Editorial corrections are separate from the faithfully extracted printed keys.
const repairs={
 'cell-block:4':{key:'B',explanation:'The printed key marks the nucleolus, but the nucleolus disassembles during mitosis. Of these choices, the centriole retains its structure. The study key is corrected to B.',evidence:['https://www.ncbi.nlm.nih.gov/books/NBK9890/','https://www.ncbi.nlm.nih.gov/books/NBK9932/']},
 'february-2021:58':{key:'A',accepted:['A','B'],explanation:'The printed key selects fatty-acid synthesis. The original also offers mitochondrial membrane proteins: most are synthesized on free cytosolic ribosomes and imported, with a minority encoded in mitochondria. They are not the usual RER products either. Both A and B are accepted for this defective stem.',evidence:['https://www.ncbi.nlm.nih.gov/books/NBK9896/','https://www.ncbi.nlm.nih.gov/books/NBK26841/']},
 'february-2021:79':{key:'D',explanation:'Diagram C shows the intracellular inactivation gate occluding the pore, whereas diagram B shows the open conducting channel. Because the answer choices are ordered A, D, B, C, the study answer is option D (diagram C). The printed key incorrectly selects option C (diagram B).',evidence:['Original February 2021 Q79 figure, PDF page 17.','https://pmc.ncbi.nlm.nih.gov/articles/PMC1693860/']},
};

export function expandRetakePapers(legacyPapers,extracts,oldQuestions) {
 const papers=legacyPapers.map(p=>{
  const extracted=extracts.find(x=>x.id===p.sourceId);assert(extracted,p.id);
  const bio=new Map(p.questions.map(r=>[r.number,r]));
  const fullQuestions=extracted.questions.map(row=>{
   if(bio.has(row.number))return bio.get(row.number);
   const id=`retake-final-${p.sourceId}-q${String(row.number).padStart(3,'0')}`;
   if(row.biochemistry){
    assert.equal(`${p.sourceId}:${row.number}`,'september-2021:64');
    const equivalent=legacyPapers.find(x=>x.sourceId==='biochemistry-2022').questions.find(x=>x.number===19).question;
    const question={...equivalent,id,source:{...equivalent.source,title:p.title,chapter:'Biochemistry · original Q64',page:String(row.page),excerpt:`Original Q64, ${p.name}, PDF page ${row.page}. The printed key selects the vague tyrosine statement. Study wording/options use the already-reviewed equivalent 2022 Q19: the claim that biological systems contain only L-amino acids is false.`},tags:equivalent.tags.map(t=>t==='retake-biochemistry-2022'?'retake-september-2021':t),answerReview:{...equivalent.answerReview,canonicalSourceId:equivalent.id,auditedAt:'2026-10-01',evidence:[`${p.name}, Q64; equivalent Biochemistry 1 Finals 2022 Q19.`,equivalent.explanation]},retakeOriginalId:null};
    return {number:row.number,page:row.page,originalText:row.text,question};
   }
   const histology=p.sourceId==='cell-block'?row.number<=9:p.sourceId==='february-2021'?row.number<=66:row.number>=79;
   const subject=histology?'histology':'physiology';
   const match=oldQuestions.find(q=>q.source.page.split(';').some(loc=>loc.trim()===`${p.name} p.${row.page} q.${row.number}`));
   const repair=repairs[`${p.sourceId}:${row.number}`];
   const answer=row.options.find(o=>o.id===(repair?.key??row.sourceKey));assert(answer,id);
   const normalized=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
   const sameAnswer=match&&normalized(match.options.find(o=>o.id===match.correctOptionId)?.text??'')===normalized(answer.text);
   const explanation=repair?.explanation??(sameAnswer?match.explanation:`The printed source key selects ${answer.text}. This item is retained from the ${subject} section of the complete Cells and Molecules paper; it is outside the biochemistry-only retake selection.`);
   const question={schemaVersion:'1.0.0',revision:1,status:'verified',kind:row.image?'image_single_best_answer':'single_best_answer',subject,difficulty:match?.difficulty??2,id,chapter:match?.chapter??(histology?'Cell histology':'Cell physiology'),topic:match?.topic??(histology?'Cell organelles, nucleus and cell cycle':'Membrane transport and cellular signaling'),learningObjective:match?.learningObjective??`Review the original ${subject} question in its full-paper context.`,prompt:row.prompt,options:row.options,correctOptionId:answer.id,
    ...(repair?.accepted?{acceptedOptionIds:repair.accepted}:{}),
    explanation,distractorExplanations:{},examPriority:'standard',
    source:{title:p.title.replace(/ · Biochemistry$/,''),chapter:`${subject} · original Q${row.number}`,page:String(row.page),lecture:'Cells and Molecules, Term 1',excerpt:`Original Q${row.number}, ${p.name}, PDF page ${row.page}. Original option order retained. Printed key: ${row.sourceKey}. ${repair?.explanation??'Printed key transcribed; not a newly certified university key.'}`},
    tags:['term-1','exam-term1-biochemistry-retake','past-paper','final-bank-biochemistry-retake-past-papers',`retake-${p.sourceId}`,'retake-full-paper-only'],
    qualityFlags:['source-question-not-authored','source-option-order-preserved',...(repair?['qualified-source-wording','editorial-study-key']:[])],
    answerReview:{basis:repair?'ai-inferred':'source-reviewed',confidence:repair?.accepted?'medium':'high',canonicalSourceId:match?.id??id,auditedAt:'2026-10-01',evidence:[`${p.name}, original Q${row.number}, PDF page ${row.page}; printed answer ${row.sourceKey}.`,...(repair?.evidence??[])]},retakeOriginalId:match?.id??null};
   if(row.image)question.media=[{id:id+'-figure',type:'image',path:`biochemistry-retake/${row.image}`,alt:'Original source illustration for this question',caption:'Original source figure',attribution:p.name}];
   return {number:row.number,page:row.page,originalText:row.text,question};
  });
  return {...p,last:Math.max(...extracted.questions.filter(r=>r.biochemistry).map(r=>r.number)),questions:fullQuestions.filter(r=>r.question.subject==='biochemistry'),fullQuestions};
 });
 const finals=papers.flatMap(p=>p.fullQuestions.map(r=>r.question));
 assert.equal(finals.length,314);assert.equal(finals.filter(q=>q.subject==='biochemistry').length,243);
 return {papers,finals};
}
