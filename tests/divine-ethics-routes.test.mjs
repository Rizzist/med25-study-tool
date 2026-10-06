import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
// Current Next handlers, not the retired dist worker. Auth is independently tested.
function load(file){
 if(file===path.join(root,'src/lib/server/auth.ts'))return {requireApiSession:async()=>null};
 if(modules.has(file))return modules.get(file).exports;
 if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
 if(file.endsWith('.mjs'))return require(file);
 const module={exports:{}};modules.set(file,module);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);return load([base,base+'.ts',base+'.json'].find(p=>fs.existsSync(p)));};
 new Function('require','module','exports',code)(local,module,module.exports);return module.exports;
}
test('Divine Ethics API: separate ten-question Ethics 1 final, 75 practice, cache and course isolation',async()=>{
 const route=load(path.join(root,'app/api/final-exam/route.ts'));
 const request=(query,headers)=>route.GET(new Request('http://localhost/api/final-exam?'+query,{headers}));
 const response=await request('exam=term2-divine-ethics'),body=await response.json();
 assert.equal(response.status,200);assert.equal(body.bank,'divine-ethics-past-papers');assert.equal(body.questions.length,10);
 assert(body.questions.every(q=>q.tags.includes('divine-ethics-1-past-paper')));
 assert.equal((await request('exam=term2-divine-ethics&bank=religion-past-papers')).status,400);
 assert.equal((await request('exam=term2-religion&bank=divine-ethics-past-papers')).status,400);
 assert.equal((await request('exam=term2-divine-ethics',{'if-none-match':response.headers.get('etag')})).status,304);
 const policy=load(path.join(root,'src/lib/server/study-bank.ts'));
 const practice=policy.loadVerifiedQuestions('term2-divine-ethics');assert.equal(practice.length,75);
 assert(practice.every(q=>!body.questions.some(f=>f.id===q.id)));
 const summary=policy.bankSummary().exams.find(e=>e.id==='term2-divine-ethics');
 assert.equal(summary.questionCount,75);assert.equal(summary.finalExamQuestionCount,10);
});
