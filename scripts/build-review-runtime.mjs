import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// Deterministic metadata build. PDF files are read only and NEVER regenerated or modified.
const args=process.argv.slice(2);
const flags=new Set(['--repo','--data','--output','--archive','--check','--help']);
for(let i=0;i<args.length;i++){assert(flags.has(args[i]),'Unknown argument '+args[i]);if(!['--check','--help'].includes(args[i])){assert(args[i+1]&&!args[i+1].startsWith('--'),'Missing argument '+args[i]);i++;}}
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
if(args.includes('--help')){console.log('node scripts/build-review-runtime.mjs [--repo ROOT] [--data CANONICAL_DIR] [--output PUBLIC_DIR] [--archive ARCHIVE_ROOT] [--check]\nDefaults: current repo; data/review-curriculum; public/study/reviews. --check performs no writes. --archive optionally verifies original editable authoring JSON hashes.');process.exit(0);}
const repo=path.resolve(option('--repo',process.cwd()));
const data=path.resolve(option('--data',path.join(repo,'data/review-curriculum')));
const output=path.resolve(option('--output',path.join(repo,'public/study/reviews')));
const archive=option('--archive',null),checkOnly=args.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const serialize=v=>JSON.stringify(v,null,2)+'\n';
const privacy=v=>assert(!/\/Users\/|\/home\/|\/private\/|\/tmp\/|file:\/\//i.test(serialize(v)),'Local path leaked into canonical/public data');
const keys=(o,expected)=>assert.deepEqual(Object.keys(o).sort(),[...expected].sort(),'Unexpected schema keys');
const unique=(values,label)=>assert.equal(new Set(values).size,values.length,'Duplicate '+label);
const equalIds=(a,b,label)=>assert.deepEqual([...a].sort(),[...b].sort(),label);
const safeId=s=>assert(typeof s==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(s),'Unsafe file ID '+s);
const locks=read(path.join(data,'source-locks.json'));
const evidence=read(path.join(data,'evidence/question-review-map-v2.json'));
const occurrence=read(path.join(data,'evidence/source-occurrence-review-map.json'));
const crosswalk=read(path.join(data,'evidence/concept-review-crosswalk-v2.json'));
const runtime=read(path.join(repo,'data/mcq-runtime/index.json'));
for(const v of [locks,evidence,occurrence,crosswalk])privacy(v);
unique(locks.courses,'course');unique(locks.volumes.map(v=>v.id),'volume');
equalIds(locks.courses,Object.keys(runtime.courses).filter(id=>id.startsWith('term2-')),'All Term 2 courses must be explicit');
equalIds(fs.readdirSync(path.join(data,'courses')).filter(f=>f.endsWith('.json')),locks.courses.map(id=>id+'.json'),'Canonical course files');
const index={version:'',courses:{}},files=new Map(),allSections=new Map(),globalLiveIds=new Set();
const totals={courses:0,volumes:0,sections:0,questionRecords:0,livePractice:0,establishedLive:0,suggestedLive:0,unmappedLive:0,sourceOccurrences:0,scoredFinals:0};
for(const exam of locks.courses){
  safeId(exam);
  const c=read(path.join(data,'courses',exam+'.json'));privacy(c);
  keys(c,['examId','title','volumes','sections','questions']);assert.equal(c.examId,exam);
  unique(c.volumes.map(v=>v.id),'course volume');unique(c.sections.map(s=>s.id),'section');
  const courseLocks=locks.volumes.filter(v=>v.examId===exam);
  equalIds(c.volumes.map(v=>v.id),courseLocks.map(v=>v.id),'Course volume membership');
  for(const v of c.volumes){
    keys(v,['id','title','url','sha256','pageCount']);safeId(v.id);
    const l=courseLocks.find(l=>l.id===v.id);assert.equal(l.pdfPath,'public/study/reviews/'+v.id+'.pdf');
    const bytes=fs.readFileSync(path.join(repo,l.pdfPath));
    assert.equal(bytes.subarray(0,5).toString(),'%PDF-','PDF header '+v.id);
    const actual=hash(bytes);assert.equal(actual,l.sha256,'PDF changed; revalidate its outline before updating source-locks: '+v.id);
    assert.equal(v.pageCount,l.pageCount,'Page count must match hash-locked original');
    assert(Number.isInteger(v.pageCount)&&v.pageCount>0);
    v.sha256=actual;v.url='/study/reviews/'+v.id+'.pdf?v='+actual;
    if(archive){const author=fs.readFileSync(path.join(path.resolve(archive),l.authoringJson.relativePath));assert.equal(hash(author),l.authoringJson.sha256,'Editable authoring JSON drift: '+v.id);}
    const localSections=c.sections.filter(s=>s.volumeId===v.id);equalIds(localSections.map(s=>s.id),l.sections.map(s=>s.id),'Exact source section IDs '+v.id);
    unique(localSections.map(s=>s.order),'section order '+v.id);
    for(const s of localSections){
      keys(s,['id','title','volumeId','order','role','sourceBasis','pdfPage']);
      const proof=l.sections.find(x=>x.id===s.id);
      assert.equal(s.id,v.id+'/'+proof.sourceSectionId);assert.equal(s.title,proof.title,'Exact authoring heading');
      assert.equal(s.pdfPage,proof.pdfPage,'Verified bookmark destination');
      assert(Number.isInteger(s.pdfPage)&&s.pdfPage>=1&&s.pdfPage<=v.pageCount,'Source PDF page bounds');
      assert(Number.isInteger(s.order)&&s.order>0);assert(!allSections.has(s.id),'Cross-course section collision');allSections.set(s.id,{...s,examId:exam});
    }
    totals.volumes++;
  }
  const sectionIds=new Set(c.sections.map(s=>s.id));assert(c.sections.every(s=>c.volumes.some(v=>v.id===s.volumeId)),'Unknown section volume');
  const expected=new Map(Object.entries(evidence.questions).filter(([,q])=>q.examId===exam).map(([id,q])=>[id,{sectionId:q.sectionId,uncertain:q.uncertain,status:q.status,livePractice:q.bankId==='practice'&&q.livePractice===true,bankId:q.bankId}]));
  for(const o of Object.values(occurrence.occurrences).filter(o=>o.examId===exam)){
    assert(!expected.has(o.sourceOccurrenceId),'Occurrence/graded ID collision');
    expected.set(o.sourceOccurrenceId,{sectionId:o.sectionId,uncertain:o.uncertain,status:o.sectionId?(o.uncertain?'needs-review':'mapped'):'needs-crosswalk',livePractice:false,bankId:exam.slice(6)+'-source-archive'});totals.sourceOccurrences++;
  }
  equalIds(Object.keys(c.questions),expected.keys(),'All evidence and source-occurrence IDs retained');
  for(const [id,q] of Object.entries(c.questions)){
    keys(q,['sectionId','uncertain','status','livePractice','bankId']);assert(typeof id==='string'&&id.length>0);assert(typeof q.uncertain==='boolean'&&typeof q.livePractice==='boolean');
    assert(q.sectionId===null||sectionIds.has(q.sectionId),'Question points outside its course: '+id);
    assert(q.sectionId||q.uncertain,'Missing section must stay uncertain: '+id);
    assert.deepEqual(q,expected.get(id),'Canonical/evidence disagreement: '+id);
  }
  const questions=read(path.join(repo,runtime.courses[exam].file));
  const live=Object.entries(c.questions).filter(([,q])=>q.livePractice);
  unique(questions.map(q=>q.id),'live bank ID');equalIds(live.map(([id])=>id),questions.map(q=>q.id),'Live runtime coverage '+exam);
  for(const q of questions){assert(q.kind!=='dynamic_anatomy_3d','3D must stay excluded');assert(!globalLiveIds.has(q.id),'Cross-course live ID collision');globalLiveIds.add(q.id);}
  for(const [key,entry] of Object.entries(runtime.finals).filter(([k])=>k.startsWith(exam+':'))){
    for(const q of read(path.join(repo,entry.file))){assert(c.questions[q.id]&&!c.questions[q.id].livePractice,'Scored final ID '+key+'/'+q.id);totals.scoredFinals++;}
  }
  if(['term2-nutrition','term2-religion'].includes(exam)){
    const sourceCourse=exam.slice(6),archiveItems=read(path.join(repo,'data',sourceCourse,'catalog.json')).archive;
    const aliases=Object.entries(c.questions).filter(([,q])=>q.bankId===sourceCourse+'-source-archive');
    equalIds(aliases.map(([id])=>id),archiveItems.map(q=>q.id),'Every original source occurrence '+exam);
    for(const item of archiveItems){const q=c.questions[item.id];assert.equal(q.livePractice,false);assert.equal(q.sectionId,item.sectionId?sourceCourse+'/'+item.sectionId:null,'Original occurrence section '+exam+'/'+item.id);}
  }
  const serialized=serialize(c),version=hash(serialized);files.set(exam+'.json',serialized);
  index.courses[exam]={url:'/study/reviews/'+exam+'.json?v='+version,version,title:c.title};
  totals.courses++;totals.sections+=c.sections.length;totals.questionRecords+=Object.keys(c.questions).length;totals.livePractice+=live.length;
  totals.establishedLive+=live.filter(([,q])=>!q.uncertain).length;totals.suggestedLive+=live.filter(([,q])=>q.uncertain&&q.sectionId).length;totals.unmappedLive+=live.filter(([,q])=>!q.sectionId).length;
}
for(const [id,x] of Object.entries(crosswalk.crosswalk)){
  const s=allSections.get(x.sectionId);assert(s&&s.examId===x.examId&&s.title===x.sectionTitle,'Invalid curated crosswalk '+id);
}
for(const [id,q] of Object.entries(evidence.questions))if(q.crosswalkId){
  const x=crosswalk.crosswalk[q.crosswalkId];assert(x&&x.examId===q.examId,'Unknown/cross-course crosswalk '+id);
}
// CVS paper identities are original occurrence IDs, unlike nutrition/religion scored aliases.
const cvs=read(path.join(data,'courses/term2-cvs.json'));
for(const p of read(path.join(repo,'public/study/cvs-past-papers/index.json')).papers){
  for(const q of read(path.join(repo,'public/study/cvs-past-papers',p.id,'paper.json')).questions)assert(cvs.questions[q.id]&&!cvs.questions[q.id].livePractice,'Missing CVS source ID '+q.id);
}
index.version=hash(JSON.stringify(index.courses));files.set('index.json',serialize(index));
for(const [filename,content] of files){privacy(JSON.parse(content));if(checkOnly)assert.equal(fs.readFileSync(path.join(output,filename),'utf8'),content,'Generated drift: '+filename);}
// Validate everything before writing; this loop only updates JSON, never source PDFs.
if(!checkOnly){fs.mkdirSync(output,{recursive:true});for(const [filename,content] of files)fs.writeFileSync(path.join(output,filename),content);}
console.log(JSON.stringify({status:'passed',mode:checkOnly?'check':'build',indexVersion:index.version,totals,pdfPolicy:'Read-only; SHA-256 locked to verified source outlines',authoringHashChecked:Boolean(archive)},null,2));
