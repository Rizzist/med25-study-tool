import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CVS_PAPER_STORAGE_KEY,emptyPaperProgress,readPaperProgress,newPaperAttempt,restorePaperAttempt,gradePaper} from '../src/lib/mcq/cvs-paper-state.mjs';

const root=new URL('../',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const catalog=json('public/study/cvs-past-papers/index.json');
const papers=catalog.papers.map(p=>json(`public${p.file}`));
const paper=id=>papers.find(p=>p.id===id);
const question=(id,n)=>paper(id).questions.find(q=>q.number===String(n));
const now='2026-09-15T12:00:00.000Z';

test('CVS: topic sidecar covers every source item without invalidating saved attempts',()=>{
  const mapping=json('public/study/cvs-past-papers/topic-map.json');
  const subjects=new Set(mapping.subjects.map(s=>s.id));
  const topics=new Map(mapping.topics.map(t=>[t.id,t]));
  const sourceIds=papers.flatMap(p=>p.questions.map(q=>q.id)).sort();
  assert.deepEqual(Object.keys(mapping.questions).sort(),sourceIds);
  assert.equal(mapping.topics.filter(t=>t.reviewLocator).length,64);
  for(const mapped of Object.values(mapping.questions)){
    assert(subjects.has(mapped.subjectId));
    assert.equal(topics.get(mapped.topicId)?.subjectId,mapped.subjectId);
  }
  for(const source of mapping.sourceFingerprints){
    const entry=catalog.papers.find(p=>p.id===source.paperId);
    assert(entry);
    assert.equal(createHash('sha256').update(readFileSync(new URL('public'+entry.file,root))).digest('hex'),source.sha256);
  }
  const css=readFileSync(new URL('app/globals.css',root),'utf8');
  assert.match(css,/setup-shell:has\(\[data-cvs-paper-session="active"\]\) > \.setup-sidebar/);
  assert.match(css,/setup-shell:has\(\[data-cvs-paper-session="active"\]\) \.setup-topbar \{ display: none; \}/);
});

test('CVS: eleven source papers/fragments, numbered without duplicated copies',()=>{
  assert.equal(papers.length,11);
  assert.equal(new Set(papers.map(p=>p.id)).size,11);
  assert.equal(papers.reduce((n,p)=>n+p.questions.length,0),942);
  for(const [index,p] of papers.entries()){
    assert.equal(p.questions.length,catalog.papers[index].count);
    assert.equal(p.questions.filter(q=>q.scoringKey).length,catalog.papers[index].keyed);
    assert.equal(p.fingerprint,catalog.papers[index].fingerprint);
    assert.equal(new Set(p.questions.map(q=>q.id)).size,p.questions.length);
    assert.deepEqual(p.questions.map(q=>Number(q.number)),Array.from({length:p.questions.length},(_,i)=>i+1));
    for(const q of p.questions){
      assert(q.prompt.length>=12, q.id);
      assert(q.page>0 && q.sourcePage);
      assert(q.keyNote.length>20);
      if(q.scoringKey){
        assert.match(q.scoringKey,/^[ABCD]$/);
        assert.equal(q.scoringKey,q.providedKey);
        assert.deepEqual(q.issues,[]);
        assert.equal(q.options.length,4);
        assert(q.options.every(o=>o.trim().length>0));
      }
    }
  }
});

test('CVS: every referenced scan, figure, source and combined Markdown exists',()=>{
  for(const p of papers){
    for(const path of [p.sourceUrl,p.transcriptUrl,...p.questions.flatMap(q=>[q.sourcePage,...q.media?[q.media]:[]])]){
      assert(path.startsWith('/study/cvs-past-papers/'));
      assert(!path.includes('..'));
      assert(existsSync(new URL(`public${path}`,root)),path);
    }
    const md=readFileSync(new URL(`public${p.transcriptUrl}`,root),'utf8');
    assert.match(md,/## Answer key \/ status/);
    assert.match(md,/## Complete source transcription appendix/);
    assert.match(md,/NOT an independently verified official/);
    for(const q of p.questions)assert(md.includes(`### Q${q.number} · source page ${q.page}`));
  }
});

test('CVS: source-preserving OCR corrections and known missing material are explicit',()=>{
  assert.match(question('cvs-undated-student-2023',4).prompt,/vascular resistance/);
  assert.match(question('cvs-undated-student-2023',84).prompt,/Pectineal/);
  assert.match(question('cvs-undated-student-2023',75).prompt,/cropped/);
  assert.deepEqual(question('cvs-undated-student-2023',57).options,['Lead I','Lead III','aVF','aVL']);
  assert.deepEqual(question('cvs-undated-student-2023',23).options,['Only lymphatic nodes','Liver','Bone marrow','Only spleen']);
  assert.match(question('cvs-undated-student-2023',51).prompt,/cropped/);
  assert.equal(question('cvs-undated-photo-paper',32).options[1],'Dependent on activation of integrins');
  assert.match(question('cvs-undated-photo-paper',34).prompt,/thromboplastin/);
  assert.match(question('cvs-undated-photo-paper',64).prompt,/middle mediastinum/);
  assert.match(question('cvs-2025-february',60).prompt,/repolarize first/);
  assert.match(paper('cvs-2023-january').note,/page 9 repeats/);
  assert.match(paper('cvs-2022-may').note,/nine short-answer questions are missing/);
  assert.equal(question('cvs-undated-answered-fragment',28).providedKey,'B');
  assert.equal(question('cvs-undated-answered-fragment',28).options[1],'8100 mL/min');
  assert.equal(paper('cvs-undated-answered-fragment').questions.filter(q=>q.visuallyTranscribed).length,50);
  for(const n of [4,6])assert.equal(question('cvs-2021-september',n).scoringKey,null);
  for(const id of ['cvs-2025-february','cvs-undated-photo-paper','cvs-undated-student-2023']){
    assert(paper(id).questions.every(q=>q.scoringKey===null));
  }
});

test('CVS: textbook/reference banks never masquerade as past papers or enter practice bank',()=>{
  assert(!catalog.papers.some(p=>/snell|sarmad|alzahraa|cvs_doc1/i.test(p.title)));
  const embedded=json('data/bank/embedded-bank.json');
  const ids=new Set(papers.flatMap(p=>p.questions.map(q=>q.id)));
  assert(embedded.questions.every(q=>!ids.has(q.id)));
  const page=readFileSync(new URL('app/page.tsx',root),'utf8');
  assert.match(page,/exam === "term2-cvs" && <CvsPastExams/);
  const component=readFileSync(new URL('src/components/CvsPastExams.tsx',root),'utf8');
  assert.match(component,/aria-disabled=\{locked\}/);
  assert.match(component,/if \(!locked\) onSubmit\(letter\)/);
  assert.match(component,/correctKey=\{reveal \? reliableKey : null\}/);
  assert.match(component,/onSessionActiveChange\?\.\(active\)/);
  assert.match(component,/sectionStats: gradePaperBreakdown/);
  assert.match(component,/options.length >= 2 && options.length <= 6/);
  assert.match(component,/Unreadable option — see original/);
  assert.match(component,/Latest final result/);
  assert.match(component,/localStorage.setItem\(CVS_PAPER_STORAGE_KEY/);
  assert.equal(CVS_PAPER_STORAGE_KEY,'med25-cvs-papers-v1');
});

const sample={id:'sample',fingerprint:'revision-1',questions:[
  {id:'a',scoringKey:'A',issues:[]},
  {id:'b',scoringKey:'B',issues:[]},
  {id:'c',scoringKey:null,issues:[]},
  {id:'d',scoringKey:'D',issues:['source key disputed']},
]};
test('CVS: end grading never guesses missing/disputed answers; self-marks are separate',()=>{
  const attempt=newPaperAttempt(sample,now);
  attempt.answers={a:' a ',b:'D',c:'any text'};
  attempt.manual={a:'incorrect',c:'correct',d:'incorrect'};
  const r=gradePaper(sample,attempt,now);
  assert.deepEqual(r,{paperId:'sample',fingerprint:'revision-1',completedAt:now,total:4,keyed:2,matched:1,unanswered:1,manualCorrect:1,manualGraded:2,ungraded:0,percentage:50});
  assert.equal(gradePaper({...sample,questions:[sample.questions[2]]},attempt,now).percentage,null);
});

test('CVS: answers, progress and latest completed result survive a storage round trip',()=>{
  const attempt=newPaperAttempt(sample,now);attempt.answers={a:'A'};attempt.index=2;
  const p=emptyPaperProgress();p.attempts.sample=attempt;
  assert.deepEqual(readPaperProgress(JSON.stringify(p)),p);
  const finished={...attempt,completedAt:now};
  p.attempts.sample=finished;p.latest.sample=gradePaper(sample,finished,now);
  assert.deepEqual(readPaperProgress(JSON.stringify(p)),p);
  assert.deepEqual(restorePaperAttempt(p.attempts.sample,sample),finished);
  p.attempts.sample=newPaperAttempt(sample,now);
  assert.deepEqual(readPaperProgress(JSON.stringify(p)).latest,p.latest);
});

test('CVS: stale attempts reset safely; previous results remain referenceable',()=>{
  const attempt=newPaperAttempt(sample,now);attempt.answers={a:'A'};
  assert.equal(restorePaperAttempt(attempt,{...sample,fingerprint:'revision-2'}),null);
  assert.equal(restorePaperAttempt(attempt,{...sample,id:'another'}),null);
  const dirty={...attempt,index:999,answers:{...attempt.answers,missing:'D',b:42},manual:{missing:'correct',c:'banana',d:'incorrect'}};
  const restored=restorePaperAttempt(dirty,sample);
  assert.equal(restored.index,3);
  assert.deepEqual(restored.answers,{a:'A'});
  assert.deepEqual(restored.manual,{d:'incorrect'});
});

test('CVS: corrupt browser storage cannot crash chooser/result formatting',()=>{
  for(const raw of [null,'bad json','null','[]','{}','{"version":1,"attempts":[],"latest":[]}'])assert.deepEqual(readPaperProgress(raw),emptyPaperProgress());
  const p=emptyPaperProgress();p.attempts.bad={fingerprint:'x'};p.latest.bad={completedAt:'no date'};
  assert.deepEqual(readPaperProgress(JSON.stringify(p)),emptyPaperProgress());
  const attempt=newPaperAttempt(sample,now);p.attempts.sample=attempt;
  p.latest.sample={...gradePaper(sample,attempt,now),matched:900};
  assert.deepEqual(Object.keys(readPaperProgress(JSON.stringify(p)).attempts),['sample']);
  assert.deepEqual(readPaperProgress(JSON.stringify(p)).latest,{});
});
