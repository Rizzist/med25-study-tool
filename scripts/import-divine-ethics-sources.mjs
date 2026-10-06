// One-time local-source ingestion. Portable builds use the saved manifest and imports.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
const source=process.argv[2];
if(!source)throw Error('Usage: node scripts/import-divine-ethics-sources.mjs /absolute/downloads');
const root=path.resolve(import.meta.dirname,'..');
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,b)=>{const dest=path.join(root,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);};
const json=(p,v)=>write(p,JSON.stringify(v,null,2)+'\n');
const rows=[];
function inspect(name,decision,reason,extra={}){
 const bytes=fs.readFileSync(path.join(source,name));
 rows.push({filename:name,bytes:bytes.length,sha256:sha(bytes),decision,reason,...extra});return bytes;
}
const lessons=inspect('divin ethics 1st term qs.pdf','reference-not-exam','First-term lesson questions with prose answers, not a past MCQ sitting. Lessons 1–4 corroborate the admitted fragment; lessons 5–6 overlap trust/humility background. Course title is from filename, not an authenticated syllabus.');
write('public/study/divine-ethics/references/first-term-lessons.pdf',lessons);
inspect('divine ethics final.pdf','withheld-course-level-unconfirmed','20-question report with date string 2/9/2021 and TestId 20146. No I/II label. Individual/social ethics and self-building overlap the notes, but overlap alone cannot prove Ethics 1 enrollment. Q20 spans pages 8–9; do not manufacture extra questions.');
const filtered=inspect('Divine Ethics EXAM QUESTIONS_Filtered_Edited.pdf','withheld-course-level-unconfirmed','2017 student-derived compilation, not an authenticated sitting. Mixes foundations, faith, research, social and physician ethics. No I/II label; some topics overlap the source, others are outside the supplied teaching pages.');
const duplicate=inspect('Divine Ethics EXAM QUESTIONS_Filtered_Edited (1).pdf','exact-duplicate','Byte-identical second copy; never create another exam card.',{duplicateOf:'Divine Ethics EXAM QUESTIONS_Filtered_Edited.pdf'});
if(sha(filtered)!==sha(duplicate))throw Error('Expected duplicate changed');
inspect('Divine Ethics EXAM QUESTIONS(pdf).pdf','same-content-version','Same 2017 compilation with a student name and ID added. Keep private; filtered copy is the canonical comparison source. No additional exam sitting established.',{duplicateOf:'Divine Ethics EXAM QUESTIONS_Filtered_Edited.pdf'});
inspect('Devine-Ethics-MCQs[1] (1).pdf','withheld-mixed-scope','99-item compilation plus answer sheet: foundations and social ethics mixed with medical rulings (dissection, liability, prohibited medication, examination). Possible Ethics 2/professional material, but no explicit II label. Supplied keys contain apparent errors; excluded wholesale rather than asserting Ethics 1.');
inspect('ethic-online-final-exam.pdf','withheld-course-level-unconfirmed','20 online-exam screenshots (source order Q2–20 then Q1). Includes medical rulings and social ethics; no I/II label. Shares concepts/questions with the 99-item compilation. Student selections are not an official answer key.');
for(const n of [3192,3193,3194,3195])inspect(`photo_621750222130680${n}_y.jpg`,'withheld-course-level-unconfirmed','Separate undated 20-question paper: these four photographs contain Q17–20, Q12–16, Q7–11 and Q1–6 respectively. No course-level/title page. Do not attach to the different 30-item cover or merge overlapping numbering.');
const pdf=await PDFDocument.create();
pdf.setTitle('Divine Ethics 1 - accompanying cover and table fragment Q3-12');
pdf.setSubject('Original photographs; cover association provisional; only Q3-12 survive.');
pdf.setCreator('MED25 source archive');
pdf.setCreationDate(new Date('2026-10-06T00:00:00Z'));pdf.setModificationDate(new Date('2026-10-06T00:00:00Z'));
const photoNames=[3196,3197,3198,3199].map(n=>`photo_621750222130680${n}_y.jpg`);
for(const [i,name]of photoNames.entries()){
 const bytes=inspect(name,i===0?'ethics-1-cover':'admitted-ethics-1-fragment',i===0?'Cover explicitly says Divine Ethics 1, 5 July 2022, 30 MCQs. The nearby body photos have no identifying header; date association remains provisional.':'Table-format source Q'+([null,'3–5','6–9','10–12'][i])+', matching first-term lesson text; not the separate numbered 20-question paper.');
 const jpeg=await pdf.embedJpg(bytes),page=pdf.addPage([jpeg.width,jpeg.height]);
 page.drawImage(jpeg,{x:0,y:0,width:jpeg.width,height:jpeg.height});
}
const bytes=await pdf.save();
const url='/study/divine-ethics/past-papers/ethics-1-table-fragment-original.pdf';
write('public'+url,bytes);
json('data/divine-ethics/paper-source-manifest.json',{updatedAt:'2026-10-06',policy:'Only supported Ethics 1 past-paper material admitted. Neither topic overlap nor the textbook heading Unit 1 proves a university course code. Unconfirmed and mixed papers stay outside all-bank and combined sessions.',collections:[{id:'divine-ethics-1-table-fragment',sources:[{title:'Original photographs — cover and Q3–12',url,bytes:bytes.length,sha256:sha(bytes),photos:photoNames}]}],references:[{title:'First-term lesson notes (reference, not an exam)',url:'/study/divine-ethics/references/first-term-lessons.pdf',bytes:lessons.length,sha256:sha(lessons)}]});
json('data/divine-ethics/download-audit-2026-10-06.json',{date:'2026-10-06',files:rows.length,rows,reviewComparison:{file:'/study/reviews/divine-ethics.pdf',scope:'Supplied individual-ethics extracts: planning, sincerity, remembrance, gratitude, prayer, trust, repentance and self-building. Textbook Unit 1 is not proof of university Divine Ethics 1 versus 2.',matchedQuestionNumbers:[3],noExactReviewCoverage:[4,5,6,7,8,9,10,11,12],sourceForGaps:'First-term lesson notes, PDF pages 1–10. No unrelated review sections assigned to fill missing mappings.'}});
console.log(`Classified ${rows.length} source files; admitted one ten-question Ethics 1 fragment. Originals preserved.`);
