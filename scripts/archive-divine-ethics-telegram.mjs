// Local-only archive of files downloaded through Telegram's visible UI.
// No Telegram API, browser cache, or credentials are used here.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const downloads = process.argv[2];
if (!downloads || !path.isAbsolute(downloads)) throw Error('Pass the absolute Downloads directory');
const archive = path.join(downloads, 'Divine-Ethics-Telegram-2026-10-06');
const photo = n => `photo_621750222130680${n}_y.jpg`;
const newPhoto = n => `photo_527404065390866${n}_y.jpg`;
const groups = [
  ['01-ethics-1-fragment', 'Ethics 1 cover and Q3–12', 'admitted-fragment', [3196,3197,3198,3199].map(photo), 'Explicit Ethics 1 cover; body association provisional. Ten questions only, not a complete 30-item paper. July 2022 photo album re-posted 9 March 2025 in the mixed Ethics 2 topic.'],
  ['02-unlabelled-20-photos', 'Unlabelled 20-question photo paper', 'level-unconfirmed', [3195,3194,3193,3192].map(photo), 'Q1–20; separate format from the Ethics 1 cover. Do not merge papers. Same July 2022 album.'],
  ['03-report-2021-test20146', '20-question report TestId 20146', 'level-unconfirmed', ['divine ethics final.pdf'], 'Posted 18 August 2025 in MD|MBBS MCQs / Divine Ethics 2. Header has no I/II label. Mixed channel context is not sufficient proof.'],
  ['04-online-final', '20-question online screenshots', 'level-unconfirmed', ['ethic-online-final-exam.pdf'], 'McQ_ANS 25 January 2023; forwarded to Past papers Term 1 on 21 December 2023. Includes professional/medical rulings absent from the supplied review.'],
  ['05-99-item-compilation', '99-item compilation and Word version', 'mixed-scope-unconfirmed', ['Devine-Ethics-MCQs[1] (1).pdf', 'Devine_Ethics_MCQs[1].docx'], 'McQ_ANS 21/23 January 2023, forwarded to Term 1 topic. Channel correction: Q18 in Edited_ethic is C. Keys contain further apparent errors and are not accepted as official. Word and edited PDF are versions, not two exams.'],
  ['06-2017-compilation', 'Student-derived 2017 compilation versions', 'level-unconfirmed', ['Divine Ethics EXAM QUESTIONS_Filtered_Edited.pdf', 'Divine Ethics EXAM QUESTIONS_Filtered_Edited (1).pdf', 'Divine Ethics EXAM QUESTIONS(pdf).pdf'], 'TUMS MCQ BANK 16 January 2021; cross-posted in both Term 1 and Ethics 2. One exact duplicate and an identifying-information variant; originals stay private.'],
  ['07-first-term-lessons', 'First-term lesson Q&A notes', 'reference-not-exam', ['divin ethics 1st term qs.pdf'], 'McQ_ANS 28 May 2025 caption #devin_ethic #term1, forwarded source 23 February 2025. Prose lesson questions, not an MCQ sitting.'],
  ['08-lesson-mcq-compilation', 'Lesson MCQs in Blank 5', 'practice-not-past-exam', ['Blank 5.pdf'], 'Downloaded 6 October from 18 August 2025 Ethics 2 topic. Seven pages, lessons 1–11, 23 authored MCQs with answers. Student name and ID retained only in this private archive.'],
  ['09-september-2021-report', 'September 2021 tagged 20-question report', 'level-unconfirmed', ['4_6037512510981015930.PDF'], 'Original TUMS MCQ BANK post 1 February 2022 tagged #Divine_ethics #sep2021. Forwarded to Ethics 2 topic 5 October 2026. PDF itself says Divine ethics without I/II.'],
  ['10-unlabelled-30-photos', 'Complete Q1–30 photographed question body', 'level-unconfirmed-strong-content-match', [1951,1952,1953,1955,1956].map(newPhoto), 'Five images posted 18 August 2025 in Ethics 2 topic. Q1–30 closely match first-term lessons 1–10, but no cover/course numeral/date accompanies this body. Source page numbers 3–7 are not a sitting date.'],
  ['11-divine-texts-feb2023', 'Divine Texts February 2023 semester', 'different-course', ['Divine Texts (February 2023).pdf'], 'Cover explicitly says Divine Texts, Dr Mousavi, exam 26 July 2023. Not Divine Ethics 1. Twenty questions. Contains student identification; private archive only.'],
  ['12-divine-texts-sep2023', 'Divine Texts September 2023 semester', 'different-course', ['Divine Texts (September 2023).pdf'], 'Cover explicitly says Divine Texts, Dr Mosavi, exam 4 February 2024. Not Divine Ethics 1. Same 20 question stems as the February-semester copy, different cover/layout. Private archive only.'],
];
const digest = data => createHash('sha256').update(data).digest('hex');
const seen = new Map();
const rows = [];
for (const [folder,title,status,names,note] of groups) {
  const dest = path.join(archive, folder);
  fs.mkdirSync(dest, {recursive:true});
  for (const [index,name] of names.entries()) {
    const source = path.join(downloads,name), bytes = fs.readFileSync(source), hash = digest(bytes);
    const renamed = `${String(index+1).padStart(2,'0')}-${name}`;
    const output = path.join(dest,renamed);
    if (fs.existsSync(output) && digest(fs.readFileSync(output)) !== hash) throw Error(`Refusing to replace different archive file: ${output}`);
    if (!fs.existsSync(output)) fs.copyFileSync(source,output);
    rows.push({group:folder,title,status,originalFilename:name,archiveFilename:`${folder}/${renamed}`,bytes:bytes.length,sha256:hash,exactDuplicateOf:seen.get(hash)??null,note});
    if(!seen.has(hash)) seen.set(hash,`${folder}/${renamed}`);
  }
  fs.writeFileSync(path.join(dest,'README.md'),`# ${title}\n\nStatus: **${status}**\n\n${note}\n\nFiles are unchanged copies. Original downloads are preserved. Student-selected answers, highlights, and compilation keys are not authenticated official keys. No publication permission or course-level evidence is inferred from an attachment's presence in a chat.\n`);
}
const manifest = {date:'2026-10-06',searchScope:['Telegram All Chats: ethic (all relevant results through January 2021)', 'Telegram All Chats: divine', 'Telegram All Chats: اخلاق (no additional relevant course-paper results)', 'Past papers Term 1 / Divine ethics topic', 'MD|MBBS MCQs / Divine Ethics 2 topic including adjacent photographs', 'McQ_ANS and TUMS MCQ BANK original relevant posts'],limits:'Searchable accessible chats and their relevant topic attachments only; not a guarantee about deleted messages, inaccessible channels, or uncaptioned media elsewhere. Topic names conflict and contain unrelated Religion/Divine Texts files.',newlyDownloaded:10,files:rows.length,exactUniqueFiles:seen.size,groups:groups.length,rows};
fs.writeFileSync(path.join(archive,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'data/divine-ethics/telegram-audit-2026-10-06.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(archive,'INDEX.md'),`# Divine Ethics Telegram archive\n\nUpdated 6 October 2026. ${rows.length} source files in ${groups.length} groups; 10 newly downloaded files, plus 15 already-local sources. ${rows.length-seen.size} byte-identical duplicate retained. Originals are preserved.\n\nOnly the supported Ethics 1 Q3–12 fragment is currently admitted to MED25. Files without course-level confirmation are retained separately; Divine Texts and authored lesson MCQs are not imported as Ethics 1 past exams.\n\n| Group | Decision | Files |\n| --- | --- | --- |\n${groups.map(([folder,title,status,names])=>`| [${title}](${folder}/README.md) | ${status} | ${names.length} |`).join('\n')}\n\n## Search coverage\n\n${manifest.searchScope.map(s=>`- ${s}`).join('\n')}\n\n${manifest.limits}\n\n## Important distinctions\n\n- Term 1 and the Ethics 2 topic share copies; neither folder name alone establishes the university course level.\n- The new five-photo body has all 30 questions, but no identifying cover. It is not the same Q3–12 fragment.\n- The Divine Texts PDFs are a different named course, not an Ethics I/II classification.\n- Source annotations and unofficial keys need individual verification before grading.\n- SHA-256, original names and duplicate links are in [manifest.json](manifest.json). Evidence screenshots are in [evidence](evidence/).\n`);
console.log(JSON.stringify({archive,files:rows.length,newlyDownloaded:10,groups:groups.length,exactUniqueFiles:seen.size},null,2));

// Searchable extractions are deliberately not promoted to verified question banks.
const python='/Users/rizzist/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
for (const [folder,title,,names] of groups) {
  const chunks=[];
  for(const name of names) {
    if(!/\.(pdf|docx)$/i.test(name)) continue;
    const source=path.join(downloads,name);
    const code=name.endsWith('.docx')
      ? 'from docx import Document; import sys; print("\\n".join(p.text for p in Document(sys.argv[1]).paragraphs))'
      : 'from pypdf import PdfReader; import sys; print("\\n\\n".join("### Source page "+str(i+1)+"\\n"+(p.extract_text() or "[Image-only page; see original]") for i,p in enumerate(PdfReader(sys.argv[1]).pages)))';
    const content=execFileSync(python,['-c',code,source],{encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']});
    chunks.push(`## ${name}\n\n${content}`);
  }
  const ocrFolders={
    '01-ethics-1-fragment':['ethics-oct06/007','ethics-oct06/008','ethics-oct06/009','ethics-oct06/010'],
    '02-unlabelled-20-photos':['ethics-oct06/006','ethics-oct06/005','ethics-oct06/004','ethics-oct06/003'],
    '04-online-final':['ethics-oct06/001'],
    '10-unlabelled-30-photos':['ethics-telegram/001','ethics-telegram/002','ethics-telegram/003','ethics-telegram/004','ethics-telegram/005'],
    '11-divine-texts-feb2023':['ethics-telegram/006'],
    '12-divine-texts-sep2023':['ethics-telegram/007'],
  }[folder]??[];
  for(const relative of ocrFolders){
    const p=path.join(root,'tmp/pdfs',relative,'all.txt');
    if(fs.existsSync(p)) chunks.push(`## Draft OCR ${relative}\n\n${fs.readFileSync(p,'utf8')}`);
  }
  fs.writeFileSync(path.join(archive,folder,'SOURCE-TEXT.md'),`# ${title}\n\nMachine extraction for local comparison only. Not a verified transcript or answer key. OCR may misorder choices and omit Arabic. Original scans remain authoritative. Personal information in originals/extractions must not be published.\n\n${chunks.join('\n\n')}`);
}
