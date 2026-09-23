// Refresh an audit after layout-only PDF changes, without replacing the PDF or
// changing question routes, original sources, answer keys or private authoring.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const course=read('data/review-curriculum/courses/term2-biochemistry.json');
const volume=course.volumes.find(v=>v.id==='biochemistry');
const digest=createHash('sha256').update(fs.readFileSync(new URL('public/study/reviews/biochemistry.pdf',root))).digest('hex');
assert.equal(digest,volume.sha256,'Sync curriculum to the real PDF before refreshing coverage');
const audit=read('data/biochemistry/review-coverage.json');
audit.reviewSha256=digest;audit.reviewPages=volume.pageCount;
for(const q of audit.questionDestinations){const s=course.sections.find(s=>s.id===q.sectionId);assert(s);q.pdfPage=s.pdfPage;}
fs.writeFileSync(new URL('data/biochemistry/review-coverage.json',root),JSON.stringify(audit,null,2)+'\n');
const report=new URL('data/biochemistry/REVIEW-COVERAGE.md',root);
let md=fs.readFileSync(report,'utf8').replace(/Review: \d+ pages/,`Review: ${volume.pageCount} pages`);
const sectionPages=new Map(course.sections.map(s=>[s.title,s.pdfPage]));
const questionPages=new Map(audit.questionDestinations.map(q=>[`${q.paperId} Q${q.sourceNumber}`,q.pdfPage]));
md=md.split('\n').map(line=>{const cells=line.split(' | ');const key=cells[0]?.replace(/^\| /,'');const page=sectionPages.get(key)??questionPages.get(key);if(page)cells[2]=String(page)+(cells.length===3?' |':'');return cells.join(' | ');}).join('\n');
fs.writeFileSync(report,md);
console.log(`Coverage audit refreshed: ${audit.reviewPages} pages, ${audit.questionDestinations.length} routes.`);
