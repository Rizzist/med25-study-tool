import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {assertDistilledRetakeCourse,retakeBankSelection,scopeRetakePaper} from '../src/lib/mcq/retake-paper-scope.mjs';
import {finalPaperKey} from '../src/lib/mcq/paper-selection.mjs';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map(),stubs=new Map();
const stub=name=>{if(!stubs.has(name))stubs.set(name,Object.defineProperty(()=>null,'name',{value:name}));return stubs.get(name);};
function loadComponent(name){
 if(modules.has(name))return modules.get(name);
 let source=fs.readFileSync(path.join(root,'src/components',name+'.tsx'),'utf8');
 if(name==='PastExamHub')source+='\nexport {HubTools,CombinedDownloads};';
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const m={exports:{}};
 const local=id=>{
  if(id==='next/dynamic')return ()=>stub('DynamicComponent');
  if(id==='./PaperDownloads')return loadComponent('PaperDownloads');
  if(id.startsWith('@/src/lib/')&&id.endsWith('.mjs'))return require(path.join(root,id.slice(2)));
  if(id.startsWith('.')||id.startsWith('@/'))return new Proxy({},{get:(_,key)=>stub(String(key))});
  return require(id);
 };
 new Function('require','module','exports',code)(local,m,m.exports);modules.set(name,m.exports);return m.exports;
}
function nodes(tree,name,out=[]){if(!tree)return out;if(Array.isArray(tree)){tree.forEach(x=>nodes(x,name,out));return out;}if(typeof tree==='object'){if(tree.type?.name===name||tree.type===name)out.push(tree.props);nodes(tree.props?.children,name,out);}return out;}
const paper=()=>({id:'retake-example-distilled',originalCollectionId:'retake-example',courseId:'term1-biochemistry-retake',title:'Example · Distilled',distilled:true,independent:true,note:'Scoped paper',kind:'theory',courseMatch:'source-course',defaultEligible:true,sourceRecordCount:2,gradedQuestionCount:1,ungradedCount:1,questionIds:['q1','q2'],takeableQuestionIds:['q1','q2'],gradedQuestionIds:['q1'],downloads:{questions:'/study/questions-distilled.md',answerKey:'/study/key-distilled.md',questionsAndKey:'/study/both-distilled.md'},originals:[{name:'Page 1',url:'/study/page1.jpg'},{name:'Page 2',url:'/study/page2.jpg'}]});
const course=()=>({id:'term1-biochemistry-retake',title:'Retake',emptyReason:null,collections:[paper()]});

test('distilled retake catalog rejects raw, mixed, duplicate and incomplete payloads',()=>{
 const good=course();assert.equal(assertDistilledRetakeCourse(good),good);
 const mutations=[c=>delete c.collections[0].distilled,c=>c.collections[0].fullPaper=paper(),c=>c.collections[0].downloads.questions='/study/raw.md',c=>c.collections[0].id='retake-example',c=>c.collections[0].title='Example',c=>c.collections.push({...c.collections[0]}),c=>c.collections=[],c=>c.id='july29'];
 for(const mutate of mutations){const bad=course();mutate(bad);assert.throws(()=>assertDistilledRetakeCourse(bad),/distilled retake catalog/);}
});
test('distilled all-bank sessions have separate identities and retain ungraded source occurrences',()=>{
 const p=paper(),scoped=retakeBankSelection([p],'distilled');assert.equal(scoped.id,'retake-all-distilled');assert.deepEqual(scoped.takeableQuestionIds,['q1','q2']);assert(scoped.independent);
 assert.notEqual(finalPaperKey(p.courseId,scoped.id),finalPaperKey(p.courseId,retakeBankSelection([p],'biochemistry').id));
 assert.equal(scopeRetakePaper(p,'distilled'),p);assert.throws(()=>retakeBankSelection([{...p,distilled:false}],'distilled'));
 const legacy={id:'old',gradedQuestionIds:['q1'],fullPaper:{id:'old-full',gradedQuestionIds:['q1','q2']}};assert.equal(scopeRetakePaper(legacy),legacy);assert.equal(scopeRetakePaper(legacy,'full'),legacy.fullPaper);
});
test('individual distilled PDFs use scoped filenames and original image lookup uses the original ID',()=>{
 const {PaperDownloads}=loadComponent('PaperDownloads'),p=paper(),tree=PaperDownloads({item:p,courseTitle:'Retake'});
 const pdfs=nodes(tree,'PaperPdfDownload');assert.equal(pdfs.length,3);assert.deepEqual(pdfs.map(p=>p.filename),['retake-example-questions-distilled.pdf','retake-example-answer-key-distilled.pdf','retake-example-questions-and-answer-key-distilled.pdf']);
 assert(pdfs.every(p=>p.sources[0].url.endsWith('-distilled.md')));
 assert.equal(nodes(tree,'OriginalPdfDownload')[0].collectionId,'retake-example');assert.equal(nodes(tree,'OriginalPdfDownload')[0].label,'Complete original');
 const doc={...p,originals:[{name:'Original Word source',url:'/study/source.docx'}]};assert.equal(nodes(PaperDownloads({item:doc,courseTitle:'Retake'}),'a')[0].href,'/study/source.docx');
 const legacy={...p,id:'old-paper',distilled:false,originalCollectionId:undefined};assert.deepEqual(nodes(PaperDownloads({item:legacy,courseTitle:'Other'}),'PaperPdfDownload').map(p=>p.filename),['old-paper-questions.pdf','old-paper-answer-key.pdf','old-paper-questions-and-answer-key.pdf']);
});
test('bundle and combined download filenames retain distilled suffix and source order',()=>{
 const {HubTools,CombinedDownloads}=loadComponent('PastExamHub'),c=course();
 const bundle=nodes(HubTools({course:c,open:false,onToggle:()=>{}}),'PaperPdfDownload');assert.equal(bundle.length,2);assert(bundle.every(p=>p.filename.endsWith('-distilled.pdf')));
 const second={...paper(),id:'aaa-distilled'};const combined=nodes(CombinedDownloads({papers:[paper(),second],courseTitle:'Retake',id:'combined-test'}),'PaperPdfDownload');assert.equal(combined.length,3);assert(combined.every(p=>p.filename.endsWith('-distilled.pdf')));assert.deepEqual(combined[0].sources.map(s=>s.collection.id),['aaa-distilled','retake-example-distilled']);
 const plain=nodes(CombinedDownloads({papers:[{...paper(),distilled:false}],courseTitle:'Other',id:'plain'}),'PaperPdfDownload');assert.deepEqual(plain.map(p=>p.filename),['plain-questions.pdf','plain-key.pdf','plain-both.pdf']);
});
