import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';

const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
function load(file){
  if(modules.has(file))return modules.get(file).exports;
  if(file.endsWith('.mjs'))return require(file);
  const m={exports:{}};modules.set(file,m);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);return load([base,base+'.ts'].find(p=>fs.existsSync(p)));};
  new Function('require','module','exports',code)(local,m,m.exports);return m.exports;
}
const {buildPracticeDocument,practiceAnswer}=load(path.join(root,'src/lib/practice-pdf/document.ts'));
const {buildPaperDocument}=load(path.join(root,'src/lib/paper-pdf/document.ts'));
const {practiceImagePlan}=load(path.join(root,'src/lib/practice-pdf/media.ts'));
const {createPracticePdf,PRACTICE_PDF_CACHE}=load(path.join(root,'src/lib/practice-pdf/client.ts'));
const index=JSON.parse(fs.readFileSync(path.join(root,'data/mcq-runtime/index.json')));
const bank=id=>JSON.parse(fs.readFileSync(path.join(root,index.courses[id].file)));
const ethics=bank('term2-divine-ethics');
const sample=ethics[0];
const request={exam:'term2-divine-ethics',title:'Divine Ethics',version:'one',variant:'both',questionIds:ethics.map(q=>q.id),loadQuestions:async ids=>ids.map(id=>ethics.find(q=>q.id===id))};
function textOf(value){if(typeof value==='string')return value;if(Array.isArray(value))return value.map(textOf).join('');if(value&&typeof value==='object')return Object.values(value).map(textOf).join('');return '';}
const cards=doc=>doc.content.slice(2);
function fixture(extra={}){
  const saved=new Map();let renders=0,loads=0,authorized=true;
  const cache={match:async key=>saved.get(key)?.clone(),put:async(key,response)=>{saved.set(key,response.clone());},keys:async()=>[...saved.keys()].map(url=>new Request(url)),delete:async req=>saved.delete(req.url)};
  const make=createPracticePdf({origin:'https://study.test',crypto:webcrypto,authorize:async()=>{if(!authorized)throw Error('sign in');},caches:{open:async name=>{assert.equal(name,PRACTICE_PDF_CACHE);return cache;}},render:async()=>{renders++;return new Blob(['%PDF-test']);},figures:async()=>({}),...extra});
  const req={...request,loadQuestions:async ids=>{loads++;return request.loadQuestions(ids);}};
  return {make,req,saved,counts:()=>({renders,loads}),deny:()=>{authorized=false;}};
}

test('course header exports the full bank, independently of session length and filters',()=>{
  const page=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
  assert.match(page,/PracticePdfDownload[^\n]+questionIds=\{subjectIds\?\.all\}/);
  const component=fs.readFileSync(path.join(root,'src/components/PracticePdfDownload.tsx'),'utf8');
  assert.match(component,/await import\('\.\.\/lib\/practice-pdf\/client'\)/);
  assert.match(component,/disabled=\{!ready\|\|busy\}/);
  assert.match(component,/variant="questions"/);assert.match(component,/variant="both"/);
  assert.match(component,/Questions \+ key/);assert.match(component,/without-answers/);
});
test('both variants use PYQ question cards; only keyed PDF contains inline answers and explanations',()=>{
  const before=JSON.stringify(ethics),plain=buildPracticeDocument('Divine Ethics',ethics,'questions'),keyed=buildPracticeDocument('Divine Ethics',ethics,'both');
  assert.equal(cards(plain).length,75);assert.equal(cards(keyed).length,75);
  assert.equal(plain.content[0].table.body[0][0].stack[1].text,'QUESTIONS');
  assert.equal(keyed.content[0].table.body[0][0].stack[1].text,'QUESTIONS WITH ANSWER KEY');
  for(const [i,q] of ethics.entries()){
    const question=textOf(cards(plain)[i]),key=textOf(cards(keyed)[i]);
    assert(question.includes(q.prompt));assert(!question.includes('Reference:'));assert(!question.includes(q.explanation));
    assert(!question.includes('Answer '));assert(key.includes('Answer '));assert(key.includes(q.explanation));assert(key.includes(practiceAnswer(q)));
  }
  // Uses the same actual renderer, not a separately maintained lookalike.
  const pyq=buildPaperDocument([{courseTitle:'Sample',collection:{id:'sample',title:'Sample'},doc:{title:'Sample',intro:[],meta:{},sources:[],keys:[],keyIntro:[],questions:[{id:'q',number:'1',paragraphs:['Question'],options:[{letter:'A',text:'Option'}],fields:{}}]}}],'questions','Sample');
  assert.deepEqual(plain.pageMargins,pyq.pageMargins);assert.deepEqual(plain.defaultStyle,pyq.defaultStyle);
  assert.equal(cards(plain)[0].layout.hLineColor(),cards(pyq)[0].layout.hLineColor());
  assert.equal(JSON.stringify(ethics),before);
});
test('every course catalog ID has a printable question and correct answer',()=>{
  for(const [id,entry] of Object.entries(index.courses)){
    const questions=bank(id),detail=JSON.parse(fs.readFileSync(path.join(root,'public/study/runtime',id+'.json')));
    assert.equal(questions.length,entry.count,id);assert.equal(detail.collectionQuestionIds.all.length,questions.length,id);
    assert.deepEqual(new Set(detail.collectionQuestionIds.all),new Set(questions.map(q=>q.id)),id);
    for(const q of questions)assert(practiceAnswer(q),q.id);
    const figures=Object.fromEntries(questions.map(q=>[q.id,(q.media??[]).map(()=>({image:'data:image/png;base64,fixture'}))]));
    for(const variant of ['questions','both'])assert.doesNotThrow(()=>buildPracticeDocument(id,questions,variant,figures),id);
  }
});
test('questions-only and keyed PDFs cache independently, including later version updates',async()=>{
  const f=fixture(),plain=await f.make({...f.req,variant:'questions'}),keyed=await f.make(f.req);
  assert.notEqual(plain.key,keyed.key);assert(f.saved.has(plain.key));assert(f.saved.has(keyed.key));
  assert((await f.make({...f.req,variant:'questions'})).fromCache);assert((await f.make(f.req)).fromCache);
  assert.deepEqual(f.counts(),{renders:2,loads:2});
  const changed=await f.make({...f.req,version:'two'});assert(f.saved.has(plain.key));assert(f.saved.has(changed.key));assert(!f.saved.has(keyed.key));
});
test('cached repeat downloads skip question loading and rendering; new versions replace only this course',async()=>{
  const f=fixture(),first=await f.make(f.req);assert(first.cached);assert(!first.fromCache);
  assert((await f.make(f.req)).fromCache);assert.deepEqual(f.counts(),{loads:1,renders:1});
  const other=await f.make({...f.req,exam:'other-course'});
  const next=await f.make({...f.req,version:'two'});
  assert.notEqual(first.key,next.key);assert(!f.saved.has(first.key));assert(f.saved.has(other.key));assert(f.saved.has(next.key));
  f.deny();await assert.rejects(f.make({...f.req,version:'two'}),/sign in/);
});
test('large banks batch below API limits, deduplicate IDs, and preserve catalog order',async()=>{
  const questions=Array.from({length:351},(_,i)=>({...sample,id:'q'+i}));let batches=[];let doc;
  const f=fixture({render:async d=>{doc=d;return new Blob(['%PDF-test']);}});
  await f.make({...f.req,questionIds:[...questions.map(q=>q.id),'q0'],loadQuestions:async ids=>{batches.push(ids.length);return questions.filter(q=>ids.includes(q.id)).reverse();}});
  assert.deepEqual(batches,[150,150,51]);assert.equal(cards(doc).length,351);
  for(const [i,card] of cards(doc).entries()){const body=card.table.body[0][0].stack;assert.equal(body[0].columns[1].text,'q'+i);assert.equal(body[1].text,sample.prompt);}
});
test('missing/draft questions and missing images fail instead of exporting incomplete banks',async()=>{
  const f=fixture();
  await assert.rejects(f.make({...f.req,loadQuestions:async()=>[]}),/did not load completely/);
  await assert.rejects(f.make({...f.req,questionIds:[sample.id],loadQuestions:async()=>[{...sample,status:'draft'}]}),/did not load completely/);
  assert.equal(f.saved.size,0);
  assert.throws(()=>buildPracticeDocument('Image',[{...sample,media:[{id:'x',type:'image'}]}],'questions'),/Missing question media/);
});
test('quota failures still download and concurrent identical requests share one render',async()=>{
  const f=fixture({caches:{open:async()=>{throw Error('storage disabled');}}});
  const rows=await Promise.all([f.make(f.req),f.make(f.req)]);
  assert.equal(f.counts().renders,1);assert(rows.every(r=>!r.cached));
});
test('signing out during generation prevents saving or returning protected content',async()=>{
  const f=fixture({render:async()=>{f.deny();return new Blob(['%PDF-test']);}});
  await assert.rejects(f.make(f.req),/sign in/);assert.equal(f.saved.size,0);
});
test('anatomical masks and neutral markers are retained without answer captions; locate key uses real figure number',()=>{
  const annotations=[{id:'a',label:'First structure',x:0,y:0,width:.1,height:.1},{id:'b',label:'Second structure',x:.2,y:.2,width:.1,height:.1}];
  const media={id:'image',type:'image',annotations,labelMasks:[{x:0,y:0,width:.2,height:.3}],caption:'Spoiler'};
  const q={...sample,kind:'dynamic_anatomy',media:[media],anatomy:{targetRegionId:'b',responseMode:'locate'}};
  const plan=practiceImagePlan(q,media);assert.deepEqual(plan.masks,media.labelMasks);assert.deepEqual(plan.markers.map(m=>m.text),['1','2']);
  assert.equal(practiceAnswer(q),'Location 2 · Second structure');
  const doc=buildPracticeDocument('Anatomy',[q],'questions',{[q.id]:[{image:'fixture'}]});
  assert(textOf(cards(doc)[0]).includes('Write the location number'));
  assert(!textOf(cards(doc)[0]).includes(sample.options[0].text));assert(!textOf(cards(doc)[0]).includes('Spoiler'));
  assert(!textOf(cards(doc)[0]).includes('Location 2'));
  const keyed=buildPracticeDocument('Anatomy',[q],'both',{[q.id]:[{image:'fixture'}]});
  assert(textOf(cards(keyed)[0]).includes('Location 2 · Second structure'));assert(!textOf(keyed).includes('Not graded'));
  q.anatomy.responseMode='identify';assert.deepEqual(practiceImagePlan(q,media).markers.map(m=>m.text),['A']);
  const practical={...media,practicalCase:{masks:media.labelMasks}};
  assert.equal(practiceImagePlan(q,practical).markers.length,0);
});
test('keyed cards highlight every accepted answer, never highlights in questions-only variant',()=>{
  const q={...sample,acceptedOptionIds:[sample.options[1].id]};
  for(const variant of ['questions','both']){
    const card=cards(buildPracticeDocument('Test',[q],variant))[0],options=card.table.body[0][0].stack[2].table.body;
    assert.equal(options.filter(row=>row[0].fillColor==='#126747').length,variant==='both'?2:0);
  }
});
