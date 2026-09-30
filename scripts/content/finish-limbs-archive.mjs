import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),scratch='/tmp/med25-limbs-import';
const archive='/Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Past Exams';
const read=p=>JSON.parse(fs.readFileSync(p)),digest=b=>createHash('sha256').update(b).digest('hex');
const papers=fs.readdirSync(path.join(root,'data/limbs/imports')).filter(f=>f.endsWith('.json')).map(f=>read(path.join(root,'data/limbs/imports',f)));
const assigned=new Map();
for(const paper of papers){
 for(const f of paper.originalFiles)assigned.set(digest(fs.readFileSync(f)),paper.id);
 const text=fs.readFileSync(path.join(root,'public/study/past-paper-downloads',paper.id,'questions-and-key.md'),'utf8');
 fs.writeFileSync(path.join(archive,paper.id,'exam-and-answer-key.md'),text);
}
const groups=[
 {id:'lower-revision-book',items:[['input',[2,...Array.from({length:18},(_,i)=>34+i)]]],reason:'Generic lower-limb revision/book questions, not identified exam sittings. Not mixed into Final Exam.'},
 {id:'occupational-therapy-reference',items:[['input',Array.from({length:15},(_,i)=>52+i)]],reason:'Occupational-therapy LMS mixed-body short-answer screenshots, not a limb final MCQ paper. Private local reference only.'},
 {id:'upper-sums-answer-report',items:[['input',[33]]],reason:'SUMS report preserves stems and selected/correct answers, but not full MCQ choices. Original report retained; no fabricated distractors.'},
 {id:'lower-sums-answer-report',items:[['input',[31]]],reason:'SUMS report preserves stems and selected/correct answers, but not full MCQ choices. Original report retained; no fabricated distractors.'},
 {id:'lower-annotated-online-duplicate',items:[['extra',[1]]],reason:'Annotated version of the lower online screenshot questions already represented by the mixed-online paper. Not an independent exam.'},
 {id:'upper-revision-book',items:[['input',[83]]],reason:'Generic 48-page MCQ revision material; not verified as an original exam sitting.'},
 {id:'mixed-practical-reposts',items:[['last',[1]]],reason:'Mixed CVS and limb practical screenshots, with student-identifying UI. Limb images overlap existing upper-practical questions; private reference, not a new limb final.'},
 {id:'upper-final-2023-photo-reposts',items:[['input',[13,14,15,16,17]]],reason:'Photographed repost of the 8 July 2023 final already imported from the cleaner PDF.'},
 {id:'mixed-paper-reposted-crops',items:[['input',[67,68]]],reason:'Duplicate crops of the mixed photographed paper, Q7–9 and Q19–21.'},
 {id:'unmatched-key',items:[['input',[75]]],reason:'Unmatched answer-grid photo. Not applied to any paper without reliable question/paper identity.'},
];
const groupFor=new Map();
for(const g of groups)for(const [set,ns]of g.items)for(const n of ns)groupFor.set(`${set}:${n}`,g);
const inventory=[],counts=new Map();
for(const set of ['input','extra','more','last','translation'])for(const [i,file]of read(`${scratch}/${set}.json`).entries()){
 const bytes=fs.readFileSync(file),sha256=digest(bytes),owner=assigned.get(sha256),group=groupFor.get(`${set}:${i+1}`);
 if(owner){inventory.push({set,index:i+1,originalName:path.basename(file),sha256,collection:owner,classification:'imported source or exact duplicate'});continue;}
 const category=group?.id??'unclassified-source',folder=path.join(archive,'_reference-only',category);fs.mkdirSync(folder,{recursive:true});
 const n=(counts.get(category)??0)+1;counts.set(category,n);
 const filename=`${String(n).padStart(2,'0')}-source${path.extname(file).toLowerCase()}`;fs.copyFileSync(file,path.join(folder,filename));
 const reason=group?.reason??'Source needs explicit classification; not imported.';
 fs.writeFileSync(path.join(folder,'README.md'),`# ${category}\n\n${reason}\n\nOriginals copied, not removed from Downloads. SHA-256 and original filenames are recorded in the parent inventory.\n`);
 inventory.push({set,index:i+1,originalName:path.basename(file),sha256,archivePath:`_reference-only/${category}/${filename}`,classification:reason});
}
for(const [category,ocr] of [['upper-sums-answer-report','tall-upper'],['lower-sums-answer-report','tall-lower']]){
 const text=fs.readFileSync(`${scratch}/${ocr}/all.txt`,'utf8');
 fs.writeFileSync(path.join(archive,'_reference-only',category,'source-report-extraction.md'),`# Source answer report — OCR reference\n\nFull distractor lists are absent. This extraction contains overlapping tile text and OCR spelling defects; it is not a newly authored exam or an authenticated answer key. Read the original alongside it.\n\n${text}\n`);
}
fs.writeFileSync(path.join(archive,'source-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
const audit=read(path.join(root,'data/limbs/import-audit.json'));
const index=`# Upper & lower limb past-paper archive\n\nCollected from Telegram on 30 September 2026 using the browser UI. Coverage: McQ Anatomy limbs topic (@vipargantina), TUMS MCQ BANK (@TUMS_2020), and McQ_ANS (@mcqtums) limb-paper search. This is the collected accessible corpus, not a claim that no other Telegram channel has more papers.\n\n${audit.collections} paper collections; ${audit.sourceItems} transcribed source items; ${audit.scored} scored; ${audit.ungraded} defective/incomplete items retained without guessed choices. Repeated concepts across genuinely different papers remain; exact reposts and shuffled exports are grouped.\n\n## Papers\n\n| Paper | Source items | Scored | Default final selection | Exam + key |\n| --- | ---: | ---: | --- | --- |\n${audit.papers.map(p=>`| ${papers.find(x=>x.id===p.id).title} | ${p.sourceItems} | ${p.scored} | ${p.defaultEligible?'Yes':'No — optional supplement'} | [Open](${p.id}/exam-and-answer-key.md) |`).join('\n')}\n\n## Reference-only and duplicate sources\n\n${groups.map(g=>`- [${g.id}](_reference-only/${g.id}/README.md): ${g.reason}`).join('\n')}\n\nThe 180 MB Limb_TUMS_translated_AI.pdf Telegram post describes lecture notes, not a past paper, and was excluded. Existing downloads were never deleted. Source originals containing student names are kept locally, not published with the app.\n\n## App behavior\n\nUpper & lower / Upper only / Lower only filter individual questions, including mixed papers. Each scope has separate saved progress and results. Paper downloads always retain the complete source, and ambiguous alternatives/corrections are disclosed.\n`;
fs.writeFileSync(path.join(archive,'INDEX.md'),index);
fs.writeFileSync(path.join(root,'data/limbs/collection-inventory.json'),JSON.stringify({collectedAt:'2026-09-30',inventory},null,2)+'\n');
console.log('Archive indexed:',inventory.length,'source files;',inventory.filter(x=>x.classification.startsWith('Source needs')).length,'unclassified.');
