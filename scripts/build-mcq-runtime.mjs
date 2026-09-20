// Build-time only: preserve legacy course selection while keeping the 64 MB
// authoring corpus and lesson/concept payloads out of the application runtime.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const require=createRequire(import.meta.url),modules=new Map();
function load(file) {
  if(modules.has(file)) return modules.get(file).exports;
  if(file.endsWith('.json')) return JSON.parse(fs.readFileSync(file,'utf8'));
  if(file.endsWith('.mjs')) return require(file);
  const module={exports:{}};modules.set(file,module);
  const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  const localRequire=id=>{
    if(!id.startsWith('@/')&&!id.startsWith('.')) return require(id);
    const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
    const target=[base,base+'.ts',base+'.json',path.join(base,'index.ts')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
    if(!target)throw Error('Missing build input '+id);return load(target);
  };
  new Function('require','module','exports',compiled)(localRequire,module,module.exports);
  return module.exports;
}
const policy=load(path.join(root,'scripts/content/source-bank-policy.ts'));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,data)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),JSON.stringify(data)+'\n');};
const hash=data=>createHash('sha256').update(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data)).digest('hex').slice(0,24);
const bank=read('data/bank/embedded-bank.json');
const summary=policy.bankSummary();
const all=policy.loadVerifiedQuestions().filter(q=>q.kind!=='dynamic_anatomy_3d');
const practical=load(path.join(root,'src/lib/physiology-practical.ts'));
const mediaIndex={},versions={};
function enrich(q) {
  const item=practical.practicalCaseForQuestion(q.id);
  return {...q,media:q.media?.map(media=>{
    const full=path.join(root,'public/study',media.path.replace(/^\/+/,''));
    const version=fs.existsSync(full)?(versions[media.path]??=hash(fs.readFileSync(full))):hash(media.path);
    const url='/study/'+media.path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')+'?v='+version;
    mediaIndex[q.id+'::'+media.id]={path:media.path,alt:media.alt,type:media.type,url};
    return {...media,url,version,...(item?{practicalCase:item}:{})};
  })};
}
const past=read('data/mcq-refactor/past-source-catalog.json');
const finals={};
for(const [key,questions] of Object.entries(bank.finalExams)) {
  if(key.endsWith(':downloaded-core'))continue;
  const approved=new Set(past.collections.filter(c=>c.bankKey===key).flatMap(c=>c.gradedQuestionIds));
  const filtered=questions.filter(q=>approved.has(q.id)&&q.status==='verified'&&!q.tags.includes('distilled-core')).map(enrich);
  const version=hash(filtered),file='data/mcq-runtime/final-'+key.replaceAll(':','-')+'.json';
  write(file,filtered);finals[key]={file,version,count:filtered.length};
}
const courseFiles={},visibleQuestions=new Map();
for(const course of summary.exams) {
  let questions=all.filter(q=>policy.matchesExam(q,course.id));
  // These authored questions remain practice; never masquerade as a paper.
  if(course.id==='july29') questions.push(...(bank.finalExams['july29:downloaded-core']??[]).map(q=>({...q,tags:[...q.tags.filter(t=>!['past-paper','telegram-final','final-bank-aug25-downloaded-core'].includes(t)),'authored-practice'],qualityFlags:[...q.qualityFlags,'not-a-past-paper-question']})));
  questions=questions.map(enrich);
  questions.forEach(q=>visibleQuestions.set(q.id,q));
  const history=[...new Map([...bank.questions.filter(q=>q.status==='verified'&&policy.matchesExam(q,course.id)).map(enrich),...questions].map(q=>[q.id,q])).values()];
  const file='data/mcq-runtime/'+course.id+'.json',historyFile='data/mcq-runtime/'+course.id+'-history.json';
  const version=hash({questions,history});write(file,questions);write(historyFile,history);
  courseFiles[course.id]={file,historyFile,version,count:questions.length};
  course.questionCount=questions.length;course.imageQuestionCount=questions.filter(q=>q.media?.some(m=>m.type==='image')).length;course.interactive3dCount=0;
  const collections=Object.keys(course.collectionCounts);
  course.collectionCounts=Object.fromEntries(collections.map(c=>[c,questions.filter(q=>policy.matchesCollection(q,c)).length]));
  course.collectionQuestionIds=Object.fromEntries(collections.map(c=>[c,questions.filter(q=>policy.matchesCollection(q,c)).map(q=>q.id)]));
  const topics=[...new Set(questions.map(q=>q.topic))].map(title=>({id:title,title,questionIds:questions.filter(q=>q.topic===title).map(q=>q.id)}));
  course.finalExamBanks=course.finalExamBanks.filter(b=>b.id!=='downloaded-core').map(b=>({...b,questionCount:finals[course.id+':'+b.id]?.count??0}));
  course.finalExamQuestionCount=past.collections.filter(c=>c.courseId===course.id).reduce((n,c)=>n+c.gradedQuestionCount,0);
  const detail={...course,topics,version};write('public/study/runtime/'+course.id+'.json',detail);
  delete course.collectionQuestionIds;delete course.biochemistryChapters;
  course.version=version;course.detailUrl='/study/runtime/'+course.id+'.json?v='+hash(detail);
}
summary.questionCount=visibleQuestions.size;summary.tags={};
summary.imageQuestionCount=[...visibleQuestions.values()].filter(q=>q.media?.some(m=>m.type==='image')).length;
summary.subjects=summary.subjects.map(subject=>({...subject,questionCount:[...visibleQuestions.values()].filter(q=>q.subject===subject.id).length}));
summary.version=hash({courses:courseFiles,finals});
write('public/study/runtime/catalog.json',summary);
write('data/mcq-runtime/index.json',{version:summary.version,courses:courseFiles,finals});
write('data/mcq-runtime/media.json',mediaIndex);
console.log('MCQ runtime built: '+summary.exams.length+' lazy courses, '+Object.keys(finals).length+' source-only final banks; catalog '+JSON.stringify(summary).length+' bytes.');
