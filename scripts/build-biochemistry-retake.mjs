import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {biochemistryChapterIdForQuestion} from '../src/lib/biochemistry/chapter-mapping.mjs';
import {expandRetakePapers} from './content/retake-full-papers.mjs';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const lines=p=>fs.readFileSync(path.join(root,p),'utf8').trim().split('\n').map(JSON.parse);
const emit=(p,text)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),text);};
const json=(p,data)=>emit(p,JSON.stringify(data,null,2)+'\n');
const hash=data=>createHash('sha256').update(data).digest('hex');
const exam='term1-biochemistry-retake',volume='biochemistry-retake',bank='biochemistry-retake-past-papers';
// Sections in study order, grouped into teaching units that follow the teacher decks.
// Section IDs are stable (saved progress and guided anchors use them); only order and units are presentational.
const units=[
 ['foundations','Foundations',[['foundations','Biochemical foundations'],['water-buffers','Water, acids, bases and buffers']]],
 ['proteins','Proteins',[['ch-1','Amino acids'],['ch-2','Protein structure and folding'],['ch-3','Hemoglobin and globular proteins'],['ch-4','Collagen, elastin and fibrous proteins']]],
 ['enzymes-energy','Enzymes and energy',[['ch-5','Enzymes, kinetics and regulation'],['ch-6','Bioenergetics and oxidative phosphorylation']]],
 ['carbohydrates','Carbohydrates',[['ch-7','Carbohydrate structure and stereochemistry'],['ch-8','Glycolysis'],['ch-9','Pyruvate dehydrogenase and the TCA cycle'],['ch-10','Gluconeogenesis'],['ch-11','Glycogen metabolism'],['ch-12','Fructose, galactose and lactose'],['ch-13','Pentose phosphate pathway and NADPH'],['ch-14','Glycoconjugates']]],
 ['lipids','Lipids',[['ch-15','Dietary lipids and absorption'],['ch-16','Fatty acids, triacylglycerols and ketones'],['ch-17','Complex lipids and eicosanoids'],['ch-18','Cholesterol, lipoproteins and steroids']]],
 ['nitrogen','Nitrogen metabolism',[['ch-19','Amino acids: disposal of nitrogen'],['ch-20','Amino acid degradation and synthesis'],['ch-21','Heme, bilirubin and amine products'],['ch-22','Nucleotide metabolism']]],
 ['integration','Metabolic integration',[['ch-23','Insulin and glucagon'],['ch-24','Fed-fast integration'],['ch-25','Diabetes mellitus'],['ch-26','Obesity and energy balance']]],
 ['nutrition','Nutrition and vitamins',[['ch-27','Nutrition'],['ch-28','Vitamins']]],
 ['molecular','Molecular biology',[['ch-29','DNA structure, replication and repair'],['ch-30','RNA, transcription and processing'],['ch-31','Translation'],['ch-32','Gene regulation'],['ch-33','Biotechnology']]],
 ['laboratory','Laboratory',[['lab-practical','Laboratory principles and tests']]],
];
const definitions=units.flatMap(([unit,,list])=>list.map(([id,title])=>[id,title,unit]));
// Chapters 8-13 and 19-22 sit outside the confirmed Term 1 syllabus; they are taught because the reused practice bank tests them.
const practiceExtension=new Set(['ch-8','ch-9','ch-10','ch-11','ch-12','ch-13','ch-19','ch-20','ch-21','ch-22']);
const scope=new Set(definitions.map(([id])=>id));
const allCurated=read('data/bank/biochemistry-core-concepts.json').chapters;
// Retake expansion: extra concepts (empty selectedQuestionIds, so Practice is unchanged) and explicit
// question-to-concept links used only for review anchoring.
const expansionPath=path.join(root,'data/teacher-materials/biochemistry-concepts-retake-expansion.json');
const expansion=fs.existsSync(expansionPath)?JSON.parse(fs.readFileSync(expansionPath,'utf8')):{chapters:[],tables:{},links:{}};
for(const ch of expansion.chapters)for(const c of ch.concepts)assert.deepEqual(c.selectedQuestionIds,[],'Expansion concepts must not change Practice: '+c.id);
const curated=allCurated.filter(c=>scope.has(c.chapterId));
const byOriginal=new Map(fs.readdirSync(path.join(root,'data/bank/questions')).filter(f=>f.endsWith('.jsonl')&&f!=='biochemistry-retake.jsonl').flatMap(f=>lines('data/bank/questions/'+f)).map(q=>[q.id,q]));
const questionConcepts=new Map();
for(const ch of allCurated)for(const c of ch.concepts)for(const id of c.selectedQuestionIds)if(!questionConcepts.has(id))questionConcepts.set(id,c);
const practice=[...questionConcepts].map(([id,c])=>{
 const q=byOriginal.get(id);assert(q&&q.subject==='biochemistry'&&q.status==='verified',id);
 return {...q,id:'retake-practice-'+id,tags:[...q.tags.filter(t=>!t.startsWith('exam-')&&!t.startsWith('term-')),'term-1',`exam-${exam}`,...(scope.has(c.chapterId)?[`review-section-${volume}/${c.chapterId}`]:[])],qualityFlags:[...q.qualityFlags,'reused-cells-and-molecules-biochemistry'],retakeOriginalId:id};
});
// Same authored supplement that the Cells & Molecules runtime adds to Practice.
// It is not a past paper and must never enter the Final Exam bank.
practice.push(...lines('data/final-exams/aug25-downloaded-core.jsonl').filter(q=>q.subject==='biochemistry').map(q=>({...q,id:'retake-practice-'+q.id,tags:[...q.tags.filter(t=>!t.startsWith('exam-')&&!t.startsWith('term-')&&!t.startsWith('final-bank-')&&!['past-paper','telegram-final'].includes(t)),'term-1',`exam-${exam}`,'authored-practice'],qualityFlags:[...q.qualityFlags,'not-a-past-paper-question','reused-cells-and-molecules-biochemistry'],retakeOriginalId:q.id})));
const old=lines('data/telegram-final/july29.jsonl').filter(q=>q.subject==='biochemistry'&&!q.source.title.toLowerCase().includes('clinical biochemistry'));
const corrections={
 '56dd13c5004c':{accepted:['A','D'],note:'The intended comparison is lactose/cellobiose (both beta-1,4). Sucrose also has a beta-D-fructofuranosyl anomeric linkage, so the literal wording also allows lactose/sucrose.'},
 'c1cec67c7cad':{accepted:['B','D'],note:'Oxidation of the aldehyde group gives the aldonic acid. An aldehyde contains a carbonyl group, so both the broad and specific choices describe that same site.'},
 'aa973dca5239':{option:['D','Human nucleotide-excision repair proteins'],note:'Editorial repair: the source offered bacterial UvrABC as the human xeroderma pigmentosum defect. Human XP usually involves NER proteins XPA-XPG; the XP variant involves POLH/translesion synthesis. UvrABC is bacterial, not a human gene.'},
 '65aa9160927c':{accepted:['A','B'],note:'Km is independent of total enzyme concentration in the Michaelis-Menten model. Low Km is often used as an affinity shorthand, but Km is not universally a dissociation constant. The original wording permits both A and the customary textbook interpretation of B.'},
 '8d279cfffdf5':{accepted:['B','C'],note:'The liver secretes VLDL and also nascent HDL. VLDL is the intended triglyceride-export answer, but the unrestricted stem permits both HDL and VLDL.'},
 'a0541f11ce57':{accepted:['A','D'],note:'Phosphatidylinositol derivatives participate in signaling; phosphatidic acid is also a signaling lipid. Both choices are valid under this broad stem.'},
 'aaab86f1685e':{note:'The intended answer describes glycerophospholipids: sn-glycerol-3-phosphate (historically L-glycerol-3-phosphate). Not all phospholipids have glycerol: sphingomyelin has a sphingosine backbone.'},
 'c47685d556e9':{note:'Cardiolipin is the characteristic, functionally important inner-mitochondrial phospholipid intended by the exam. It is not necessarily the most abundant phospholipid by mass; “main component” is imprecise.'},
 '181923aef3fe':{note:'Ceramide is the common branch-point precursor for complex sphingolipids. De novo synthesis begins earlier with serine and palmitoyl-CoA; do not mistake the offered intermediate for the first substrates.'},
 '78b8c2c099d6':{note:'Rifampicin is the intended drug. More precisely, it binds the bacterial RNA-polymerase beta subunit and blocks early RNA-chain extension, rather than simply preventing promoter recognition.'},
 'a940138b0965':{note:'Ricin irreversibly depurinates 28S rRNA in the 60S subunit. Cycloheximide also inhibits eukaryotic elongation at the large subunit; the intended distinction is ricin-mediated ribosome damage.'},
 '044-v1':{accepted:['B','D'],note:'Both tryptophan and phenylalanine biosynthetic operons are anabolic. The original intended trp answer is not uniquely correct when phe is also offered.'},
 '036-v1':{note:'This paper uses eicosanoid loosely for lipid mediators from C20/C22 PUFAs. Strictly, eicosanoids derive from C20 precursors; C22 DHA gives docosanoids. The offered D is the intended broad PUFA choice, not the precise definition.'},
};
const corrected=q=>{
 const fix=Object.entries(corrections).find(([key])=>q.id.includes(key))?.[1];
 if(!fix)return {...q};
 const originalChoices=q.options.map(o=>`${o.id}. ${o.text}`).join('; ');
 return {...q,options:fix.option?q.options.map(o=>o.id===fix.option[0]?{...o,text:fix.option[1]}:o):q.options,
  ...(fix.accepted?{acceptedOptionIds:fix.accepted}:{}),
  explanation:fix.option?fix.note:q.explanation+' '+fix.note,
  distractorExplanations:{},source:{...q.source,excerpt:q.source.excerpt+' Original choices: '+originalChoices+' Review: '+fix.note},
  qualityFlags:[...q.qualityFlags,fix.option?'editorially-repaired-source-question':'qualified-source-wording',...(fix.accepted?['ambiguous-original-multiple-accepted']:[])],
  answerReview:{basis:'ai-inferred',confidence:'medium',canonicalSourceId:q.id,auditedAt:'2026-09-30',evidence:[fix.note,'Lippincott Illustrated Reviews: Biochemistry, 6th ed.; corresponding review chapter.']}};
};
const extra=(chapter,prompt,options,key,explanation,more={})=>({chapter,prompt,options:options.map((text,i)=>({id:String.fromCharCode(65+i),text})),correctOptionId:key,explanation,...more});
const extras={
 'cell-block:44':corrected(old.find(q=>q.id==='tg-final-j29-20241-biochem-044-v1')),
 'cell-block:57':old.find(q=>q.id==='tg-final-j29-20241-biochem-057-v1'),
 'cell-block:81':extra('ch-28','Which vitamin(s) play important roles in the metabolism of branched-chain amino acids and odd-carbon fatty acids?',['Pyridoxine','Thiamine','Biotin','Folic acid'],'C','Biotin supports propionyl-CoA carboxylase, shared by odd-chain fatty-acid and several amino-acid catabolic routes. B6 and B1 participate elsewhere in branched-chain amino-acid breakdown; they do not supply this shared carboxylase. B12 is also important downstream but is not offered.'),
 'february-2021:12':extra('ch-32','Lactose utilization by E. coli requires which lac gene products?',['Lac-Y','Lac-Z','Lac-I','Lac-A'],'B','LacY permease imports lactose and LacZ beta-galactosidase hydrolyzes it. Both A and B are valid for the unrestricted original question.',{acceptedOptionIds:['A','B']}),
 'february-2021:26':extra('ch-30','Which of the following is an incorrect statement about mRNA?',['Cap is added to the 5′ end','Histone mRNAs lack a 5′ cap','Exons are removed and introns are spliced together','A poly-A tail is added to the 3′ end'],'C','B and C are both incorrect. Replication-dependent histone mRNAs are capped but usually lack poly-A tails. Splicing removes introns and joins exons. Polyadenylation is typical, not universal.',{acceptedOptionIds:['B','C']}),
 'february-2021:34':extra('ch-5','Which enzyme class catalyzes the reaction shown?',['Isomerase','Oxidoreductase','Ligases','Hydrolases'],'A','Glucose-6-phosphate and fructose-6-phosphate are aldose/ketose isomers. Phosphoglucose isomerase interconverts them without changing overall oxidation state.',{image:'february-2021-reaction.png'}),
 'february-2021:36':corrected(old.find(q=>q.id==='tg-final-j29-feb2021-biochem-036-v1')),
 'february-2021:51':extra('water-buffers','Hydroxyapatite has a very small dissolution equilibrium constant (approximately 10^-26 in the source). Which description is correct under physiological conditions?',['It is relatively insoluble under physiological conditions','It dissolves only in basic solutions','It would dissolve well in calcium phosphate solution','It dissolves well under physiological conditions'],'A','A very small dissolution equilibrium constant favors solid hydroxyapatite. Acid promotes dissolution; added calcium/phosphate can suppress it by the common-ion effect. Source correction: hydroxyapatite is the inorganic mineral component of bone, not the organic matrix.'),
 'biochemistry-2022:10':extra('ch-5','Which enzyme class catalyzes the reaction shown?',['Oxidoreductases','Ligases','Hydrolases','Isomerases'],'A','Lactate dehydrogenase oxidizes lactate to pyruvate while reducing NAD+ to NADH. This is an oxidoreductase reaction.',{image:'biochemistry-2022-reaction.png'}),
 'biochemistry-2022:16':extra('ch-5','The catalytic efficiency of two enzymes acting on a substrate is commonly compared using which parameter?',['Product type','Optimum pH','Molecular size','kcat/Km'],'D','Editorial repair: the original offered Km alone. The specificity constant kcat/Km describes low-substrate catalytic performance; Km alone cannot establish catalytic efficiency.',{repair:'Original D: Km values. Replaced with kcat/Km because the source had no scientifically correct choice.'}),
 'biochemistry-2022:19':extra('ch-1','Choose the incorrect statement about amino acids.',['Glycine is optically inactive','Selenocysteine is the 21st genetically encoded amino acid','Only L-amino acids are found in biological systems','Tyrosine can be formed by hydroxylation of phenylalanine'],'C','D-amino acids occur, for example, in bacterial peptidoglycan and as D-serine in humans. Most ribosomally incorporated amino acids are L, with achiral glycine. The vague source phrase “tyrosine is a modified amino acid” is clarified here.',{repair:'Original D: Tyrosine is a modified amino acid. Clarified without changing the intended incorrect C.'}),
 'biochemistry-2022:56':extra('ch-5','Which of the following can restore the activity of an enzyme already irreversibly inhibited?',['Increasing substrate concentration','Removing free inhibitor','Increasing product concentration','Increasing temperature','None of these restores the already-inactivated enzyme'],'E','Editorial repair: the source provided no correct answer. Irreversible inactivation is not reversed by removing unbound inhibitor or adding substrate. Biological recovery commonly requires new enzyme synthesis.',{repair:'Added E; the original four choices cannot reverse irreversible inhibition.'}),
 'september-2021:8':extra('ch-5','The catalytic efficiency of two enzymes acting on a substrate is commonly compared using which parameter?',['Molecular size','Product type','kcat/Km','Optimum pH'],'C','Editorial repair: the source offered Km alone. kcat/Km, not Km alone, is the specificity constant used for low-substrate catalytic performance.',{repair:'Original C: Km values. Replaced with kcat/Km.'}),
 'september-2021:12':extra('ch-5','Which of the following can restore the activity of an enzyme already irreversibly inhibited?',['Increasing product concentration','Increasing temperature','Increasing substrate concentration','Removing free inhibitor','None of these restores the already-inactivated enzyme'],'E','The original four options cannot reverse irreversible enzyme inactivation. Adding E prevents teaching an incorrect source key.',{repair:'Added E; no valid choice was present in the original.'}),
 'september-2021:22':extra('ch-5','Which enzyme class catalyzes the reaction shown?',['Oxidoreductases','Ligases','Hydrolases','Isomerases'],'A','Lactate dehydrogenase couples lactate oxidation to NAD+ reduction. It is an oxidoreductase.',{image:'september-2021-reaction.png'}),
};
const chapterOverrides={...Object.fromEntries(['9d719f83e120','b676127404ca','e7ae1261746c','69bba6cbc782'].map(id=>[id,'ch-16'])),...Object.fromEntries(['e5c8df3edbcc','04568ceedc30','0ae6ffd297d6','26065cef6597','93e95d27f342','bd793fb352e7','dd85604db972','ddeb00557d0e'].map(id=>[id,'ch-4'])),'32329730b3ef':'ch-5'};
const sectionFor=q=>Object.entries(chapterOverrides).find(([id])=>q.id?.includes(id))?.[1]??(scope.has(q.chapter)?q.chapter:biochemistryChapterIdForQuestion(q));
const sources=read('data/biochemistry-retake/source-extract.json');
const titles={'cell-block':'Cell & Molecules · April 2021 report · Biochemistry','february-2021':'Cell & Molecules · February 2021 · Biochemistry','biochemistry-2022':'Biochemistry 1 · Finals 2022','september-2021':'Cell & Molecules · September 2021 · Biochemistry'};
const legacyPapers=sources.map(p=>({...p,id:`retake-${p.id}`,sourceId:p.id,title:titles[p.id],questions:p.questions.map(row=>{
 const match=old.find(q=>q.source.page.split(';').some(loc=>loc.trim()===`${p.name} p.${row.page} q.${row.number}`));
 const base=extras[`${p.id}:${row.number}`]??(match?corrected(match):null);
 assert(base,`Unaccounted source question ${p.id}:${row.number}`);
 const chapter=sectionFor(base);assert(scope.has(chapter),`Missing section ${p.id}:${row.number}`);
 const id=`retake-final-${p.id}-q${String(row.number).padStart(3,'0')}`;
 const repaired=Boolean(extras[`${p.id}:${row.number}`]||base.answerReview?.basis==='ai-inferred');
 const question={schemaVersion:'1.0.0',revision:1,status:'verified',kind:base.image?'image_single_best_answer':'single_best_answer',subject:'biochemistry',difficulty:base.difficulty??2,
  ...base,id,chapter,topic:definitions.find(([x])=>x===chapter)[1],learningObjective:`Explain ${definitions.find(([x])=>x===chapter)[1]}`,
  source:{title:titles[p.id],chapter:`Biochemistry · original Q${row.number}`,page:String(row.page),lecture:'Cells and Molecules, Term 1',excerpt:`Original Q${row.number}, ${p.name}, PDF page ${row.page}. Canonical study wording/options may be normalized; keys apply to displayed options, not necessarily the original letter. ${base.repair??''} ${base.source?.excerpt??''}`},
  tags:['term-1',`exam-${exam}`,'past-paper',`final-bank-${bank}`,`retake-${p.id}`,`review-section-${volume}/${chapter}`],
  qualityFlags:[...(base.qualityFlags??[]),'source-question-not-authored','canonical-options-not-original-order',...(repaired?['editorial-study-key']:[])],
  answerReview:{basis:repaired?'ai-inferred':'source-reviewed',confidence:repaired?'medium':'high',canonicalSourceId:match?.id??id,auditedAt:'2026-09-30',evidence:[`${p.name}, original Q${row.number}, PDF p. ${row.page}.`,`Lippincott Illustrated Reviews: Biochemistry, 6th ed., ${chapter}.`,base.explanation]},
  explanation:base.explanation,distractorExplanations:base.distractorExplanations??{},examPriority:'standard',retakeOriginalId:match?.id??null};
 if(base.image)question.media=[{id:id+'-figure',type:'image',path:`biochemistry-retake/${base.image}`,alt:'Original reaction diagram for enzyme-class identification',caption:'Original source reaction',attribution:p.name}];
 delete question.image;delete question.repair;delete question.acceptedFreeText;
 return {number:row.number,page:row.page,originalText:row.text,question};
})}));
const legacyFinals=legacyPapers.flatMap(p=>p.questions.map(r=>r.question));
const {papers,finals}=expandRetakePapers(legacyPapers,read('data/biochemistry-retake/full-source-extract.json'),lines('data/telegram-final/july29.jsonl'));
assert.equal(new Set(finals.map(q=>q.id)).size,finals.length);
for(const q of [...practice,...finals])assert(q.options.some(o=>o.id===q.correctOptionId),q.id);
const bankRecord=({retakeOriginalId,...q})=>({...q,tags:[...new Set(q.tags)],qualityFlags:[...new Set(q.qualityFlags)]});
emit('data/bank/questions/biochemistry-retake.jsonl',practice.map(q=>JSON.stringify(bankRecord(q))).join('\n')+'\n');
emit(`data/final-exams/${bank}.jsonl`,finals.map(q=>JSON.stringify(bankRecord(q))).join('\n')+'\n');
const sections=definitions.map(([id,title,unit],index)=>{
 // Preserve the version-locked manuscript. Expanded source banks do not silently
 // rewrite its confirmed syllabus or invalidate students' cached review PDF.
 const concepts=[...(curated.find(c=>c.chapterId===id)?.concepts??[]),...expansion.chapters.filter(c=>c.chapterId===id).flatMap(c=>c.concepts)];
 assert(concepts.length,'No concepts for section '+id);
 const checks=[...new Map(legacyFinals.filter(q=>q.chapter===id).map(q=>[q.retakeOriginalId??q.prompt,q])).values()];
 return {id,title,unit,unitTitle:units.find(u=>u[0]===unit)[1],extension:practiceExtension.has(id),order:index+1,concepts,tables:read('data/biochemistry-retake/review-tables.json')[id]??expansion.tables?.[id]??[],checkpoints:checks.map(q=>({id:q.id,title:q.prompt,summary:q.explanation,source:q.source.title+'; '+q.source.chapter,questionIds:legacyFinals.filter(f=>(q.retakeOriginalId&&q.retakeOriginalId===f.retakeOriginalId)||q.prompt===f.prompt).map(f=>f.id)}))};
});
const manuscript={title:'Biochemistry Retake',subtitle:'Cells and Molecules · Term 1',version:'2026-10-01',scope:'Original confirmed Term 1 syllabus: Lippincott Chapters 1–7, 14–18 and 23–33, plus foundations, water/buffers and laboratory-derived theory. Retake-specific exclusions have not been announced here. Chapters 8–13 and 19–22 are outside that confirmed syllabus but are taught here as clearly marked practice-bank sections, because the reused Cells & Molecules practice bank tests them. Physiology, histology and the Term 2 metabolism course are excluded.',
 sources:['Latest original course-scope reconciliation, 20 August 2026; original syllabus and teacher-material archive.','Ferrier, D. R. Lippincott Illustrated Reviews: Biochemistry, 6th edition (2014): confirmed chapters listed above.','Teacher foundations: INTRODUCTION.ppt; Water and Buffer 1404; Marks Essentials water/buffers reference.','Teacher biomolecules: Amino acids and Proteins Parts 1–2; Lipid structure (Esmaeili); Vitamin 2024.','Teacher enzymes and genetics: Enzyme Kinetics and Regulation; DNA Structure; DNA Replication; Transcription 2025; Translation 2025; Regulation of Gene Expression 2025.','Teacher laboratories: Laboratory Equipment, Titration and Carbohydrate Qualification Test (Esmaeili, January 2026), plus the original laboratory scope.','Four source-paper biochemistry sections: April 2021 Cell & Molecules report, February 2021, September 2021, Biochemistry 1 Finals 2022. Filename dates are retained; a report date is not proof of the exam sitting date.','Source caveats: human DNA repair — https://www.ncbi.nlm.nih.gov/books/NBK1397/ ; enzyme kinetics — https://www.ncbi.nlm.nih.gov/books/NBK92007/ ; hepatic HDL/VLDL — https://www.ncbi.nlm.nih.gov/books/NBK351/ .'],sections};
json('data/biochemistry-retake/review.json',manuscript);
json('data/biochemistry-retake/papers.json',papers.map(({fullQuestions,...paper})=>({...paper,fullQuestionIds:fullQuestions.map(r=>r.question.id)})));

// PDF generation is an explicit authoring step, never a side effect of next build.
const layoutPath=path.join(root,'data/biochemistry-retake/pdf-layout.json');
if(!fs.existsSync(layoutPath)){console.log(`Prepared ${practice.length} practice questions, ${finals.length} paper occurrences and ${sections.length} review sections. Render the PDF, then rerun this script.`);process.exit(0);}
const layout=read('data/biochemistry-retake/pdf-layout.json');
assert.equal(layout.manuscriptSha256,hash(fs.readFileSync(path.join(root,'data/biochemistry-retake/review.json'))),'Review manuscript changed: re-render PDF before publishing mappings');
const pdfBytes=fs.readFileSync(path.join(root,`public/study/reviews/${volume}.pdf`));
assert.equal(hash(pdfBytes),layout.sha256,'PDF/layout hash mismatch');
const canonical={examId:exam,title:'Biochemistry Retake',volumes:[{id:volume,title:'Biochemistry Retake · Cells and Molecules',url:`/study/reviews/${volume}.pdf?v=${layout.sha256}`,sha256:layout.sha256,pageCount:layout.pageCount}],sections:sections.map(s=>({id:`${volume}/${s.id}`,title:s.title,volumeId:volume,order:s.order,role:'teaching',sourceBasis:'confirmed-term1-scope',pdfPage:layout.sections[s.id].page})),questions:{}};
const evidence=read('data/review-curriculum/evidence/question-review-map-v2.json');
for(const [id,m]of Object.entries(evidence.questions))if(m.examId===exam)delete evidence.questions[id];
const live0=q=>practice.includes(q);
const conceptById=new Map(sections.flatMap(s=>s.concepts.map(c=>[c.id,c])));
for(const [qid,cid] of Object.entries(expansion.links??{}))assert(conceptById.has(cid),'Expansion link to unknown concept '+qid+' -> '+cid);
const anchors={version:1,pdfSha256:layout.sha256,sections:Object.fromEntries(sections.map(s=>[`${volume}/${s.id}`,layout.sections[s.id]])),questions:{}};
for(const q of [...practice,...finals]){
 const own=live0(q)?questionConcepts.get(q.retakeOriginalId):null;
 const live=live0(q),concept=live?((own&&scope.has(own.chapterId))?own:(conceptById.get(expansion.links?.[q.id])??own)):null;
 const chapter=concept?.chapterId??sectionFor(q),sectionId=q.subject==='biochemistry'&&scope.has(chapter)?`${volume}/${chapter}`:null;
 const mapping={sectionId,uncertain:!sectionId,status:sectionId?'mapped':'needs-crosswalk',livePractice:live,bankId:live?'practice':bank};
 const point=concept?layout.concepts[concept.id]:layout.checkpoints[q.id==='retake-final-september-2021-q064'?'retake-final-biochemistry-2022-q019':q.id];
 canonical.questions[q.id]=mapping;evidence.questions[q.id]={examId:exam,...mapping,kind:q.kind,specificity:point?'paragraph':sectionId?'section':'unmapped',method:point?'confirmed-chapter-and-reviewed-concept':'existing-bank-chapter',evidence:point?'Explicit concept/checkpoint in version-locked retake review; original Term 1 scope.':sectionId?'Existing source-bank chapter maps to this review section; no exact paragraph claimed.':'Reused source content outside the version-locked biochemistry review; no substitute PDF reference assigned.'};
 if(point&&sectionId)anchors.questions[q.id]={...point,sectionId};
}
json(`data/review-curriculum/courses/${exam}.json`,canonical);json('data/review-curriculum/evidence/question-review-map-v2.json',evidence);
const locks=read('data/review-curriculum/source-locks.json');
if(!locks.courses.includes(exam))locks.courses.push(exam);
locks.volumes=locks.volumes.filter(v=>v.examId!==exam);
locks.volumes.push({id:volume,examId:exam,pdfPath:`public/study/reviews/${volume}.pdf`,sha256:layout.sha256,pageCount:layout.pageCount,originalPdfFilename:'Biochemistry Retake Review.pdf',authoringJson:{relativePath:'data/biochemistry-retake/review.json',sha256:layout.manuscriptSha256},pageEvidence:'Chrome-rendered notes PDF; section bookmarks and exact paragraph positions measured from the PDF text layer and verified.',sections:canonical.sections.map(s=>({id:s.id,sourceSectionId:s.id.split('/')[1],title:s.title,pdfPage:s.pdfPage}))});
json('data/review-curriculum/source-locks.json',locks);json(`public/study/guided/${exam}.json`,anchors);
const sourceCatalog=read('data/mcq-refactor/past-source-catalog.json'),downloads=read('public/study/past-paper-downloads/catalog.json');
const collections=[],assets=[];
for(const original of papers)for(const full of [false,true]){
 const paper=full?{...original,id:original.id+'--full',title:original.title.replace(/ · Biochemistry$/,'')+' · Full paper',first:1,last:original.fullQuestions.length,questions:original.fullQuestions}:original;
 const urls={questions:`/study/past-paper-downloads/${paper.id}/questions.md`,answerKey:`/study/past-paper-downloads/${paper.id}/answer-key.md`,questionsAndKey:`/study/past-paper-downloads/${paper.id}/questions-and-key.md`};
 const originals=[{name:paper.name,url:`/study/past-paper-downloads/originals/term1-source-${paper.asset}.pdf`}];
 const intro=`# ${paper.title}\n\n${full?'Full original paper, including other subjects where present.':'Biochemistry only.'} Original question numbers ${paper.first}–${paper.last}. Study transcriptions normalize some wording and option order; displayed answer letters apply to these choices, not automatically to the original PDF. Defective items have explicit editorial repairs. These are study keys, not certified university keys.\n\nOriginal: ${originals[0].url}\n\n`;
 const questions='## Questions\n\n'+paper.questions.map(r=>`### ${r.number} · ${r.question.id}\n\n${r.question.prompt}\n\n${r.question.options.map(o=>`${o.id}. ${o.text}`).join('\n')}\n\nSource: original Q${r.number}, page ${r.page}.${r.question.media?`\n\nOriginal figure: /study/${r.question.media[0].path}`:''}\n`).join('\n');
 const key='## Answer key and review locations\n\n'+paper.questions.map(r=>{const q=r.question,s=canonical.sections.find(s=>s.id===canonical.questions[q.id]?.sectionId);return `### ${r.number} · ${q.id}\n\nKey: ${q.correctOptionId} — ${q.options.find(o=>o.id===q.correctOptionId).text}${q.acceptedOptionIds?`\n\nAccepted choices: ${q.acceptedOptionIds.join(', ')}`:''}\n\n${q.explanation}\n\nReview: ${s?`/study/reviews/${volume}.pdf#page=${s.pdfPage} — ${s.title}`:`${q.topic}; outside the biochemistry review. Original PDF page ${r.page}.`}\n\nProvenance: ${q.source.excerpt}\n\nOriginal source transcription (may contain source defects; use the qualified study key above): ${r.originalText.replace(/\s+/g," ").trim()}\n`;}).join('\n');
 for(const [kind,content]of Object.entries({questions:intro+questions,answerKey:intro+key,questionsAndKey:intro+questions+key})){const text=content.replace(/[ \t]+$/gm,'');emit('public'+urls[kind],text);assets.push({collectionId:paper.id,url:urls[kind],bytes:Buffer.byteLength(text),sha256:hash(text)});}
 const collection={id:paper.id,courseId:exam,bankId:bank,bankKey:exam+':'+bank,title:paper.title,note:'Biochemistry-only source selection. Original question numbers retained; some wording/options normalized and defective keys qualified. Downloaded keys apply to displayed options. Original PDF also includes other subjects where present.',kind:'source-paper-selection',date:null,dateEvidence:paper.sourceId==='cell-block'?'April 2021 is the printed report date, not an independently verified sitting date.':'Year/month from original source title; exact sitting date unconfirmed.',courseMatch:'source-course',defaultEligible:true,originalOrderClaim:false,sources:originals.map(s=>({name:s.name,publicUrl:s.url,sha256:hash(fs.readFileSync(path.join(root,'public',s.url))),exists:true})),sourceRecordCount:paper.questions.length,transcribedQuestionCount:paper.questions.length,gradedQuestionCount:paper.questions.length,sourceKeyCount:paper.questions.filter(r=>r.question.answerReview.basis==='source-reviewed').length,editorialKeyCount:paper.questions.filter(r=>r.question.answerReview.basis==='ai-inferred').length,ungradedCount:0,questionIds:paper.questions.map(r=>r.question.id),gradedQuestionIds:paper.questions.map(r=>r.question.id),downloads:urls,originals};
 collection.independent=full;
 if(full)collection.note='Complete original paper. Includes physiology/histology where present; the Biochemistry 1 paper is entirely biochemistry. Separate progress from the biochemistry-only selection. Printed keys and any editorial corrections are distinguished in explanations and downloads.';
 collections.push(collection);
 for(const s of originals){const bytes=fs.readFileSync(path.join(root,'public',s.url));assets.push({collectionId:paper.id,url:s.url,bytes:bytes.length,sha256:hash(bytes)});}
}
const course={id:exam,title:'Biochemistry Retake',hasSourceCollections:true,sourceRecordCount:finals.length,gradedQuestionCount:finals.length,defaultCollectionIds:collections.filter(c=>!c.id.endsWith('--full')).map(c=>c.id),emptyReason:null};
sourceCatalog.collections=[...sourceCatalog.collections.filter(c=>c.courseId!==exam),...collections];
sourceCatalog.courses=[...sourceCatalog.courses.filter(c=>c.id!==exam),{...course,collectionIds:collections.map(c=>c.id)}];
sourceCatalog.assets=[...(sourceCatalog.assets??[]).filter(a=>!a.collectionId?.startsWith('retake-')),...assets];
const publicCollections=collections.map(({sources,bankKey,...c})=>c);
downloads.courses=[...downloads.courses.filter(c=>c.id!==exam),{...course,collections:publicCollections.filter(c=>!c.id.endsWith('--full')).map(c=>({...c,fullPaper:publicCollections.find(f=>f.id===c.id+'--full')}))}];
json('data/mcq-refactor/past-source-catalog.json',sourceCatalog);json('public/study/past-paper-downloads/catalog.json',downloads);
json('data/biochemistry-retake/audit.json',{examId:exam,displayTerm:2,scope:[...scope],practiceCount:practice.length,practiceSource:'All existing biochemistry Practice questions from Cells & Molecules, with stable retake-prefixed IDs.',conceptCount:sections.reduce((n,s)=>n+s.concepts.length,0),expansionLinks:Object.keys(expansion.links??{}).length,paperCount:papers.length,sourceOccurrences:finals.length,biochemistryOccurrences:finals.filter(q=>q.subject==='biochemistry').length,editorialKeys:finals.filter(q=>q.answerReview.basis==='ai-inferred').length,reviewPages:layout.pageCount,paragraphAnchors:Object.keys(anchors.questions).length,excluded:'PharmD Clinical Biochemistry; alternate duplicate February scan. Non-biochemistry is included only in full-paper mode, never Practice or biochemistry-only mode.',scopeCaveat:'Practice reuses the original biochemistry bank in full. The existing PDF retains its confirmed review syllabus; additional questions receive a section reference only where supported, otherwise no substitute reference. '+manuscript.scope});
console.log(`Biochemistry Retake: ${practice.length} practice MCQs; ${finals.length} full-paper occurrences; 243 biochemistry-only; ${Object.keys(anchors.questions).length} exact guided anchors.`);
