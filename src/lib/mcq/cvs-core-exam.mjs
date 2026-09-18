import {answerResolution} from './cvs-paper-enhancements.mjs';

export function coreExamId(scope='all') {
  return scope === 'anatomy' ? 'cvs-core-exam:anatomy' : 'cvs-core-exam:all';
}

export function createCoreExam(manifest, papers, scope='all') {
  const sources = new Map(papers.map(p => [p.id,p]));
  const rows = manifest.questions.filter(row => scope !== 'anatomy' || row.subjectId === 'anatomy');
  if (!rows.length) throw new Error('Core Exam selection is unavailable.');
  const questions = rows.map(row => {
    const source = sources.get(row.paperId);
    const q = source?.questions.find(q => q.id === row.questionId);
    if (!q || !answerResolution(q).key) throw new Error('A Core Exam answer could not load. Please retry; no ungraded substitute will be used.');
    return {...q, originPaper:{id:source.id,title:source.title,sourceUrl:source.sourceUrl,transcriptUrl:source.transcriptUrl}};
  });
  if (new Set(questions.map(q => q.id)).size !== questions.length) throw new Error('Duplicate Core Exam question.');
  // No sourcePaperIds: core attempts must not be restored as all-questions aggregates.
  return {id:coreExamId(scope),title:scope === 'anatomy' ? 'Core Exam · Anatomy 50' : 'Core Exam · 100 questions',
    fingerprint:manifest.fingerprint+':'+scope+':'+[...sources.values()].map(p=>p.id+':'+p.fingerprint).sort().join('|'),
    questions, aiRevision:papers.map(p=>p.aiRevision||'').join('|'),
    note:'Curated past-paper revision, not a new historical exam or a prediction.',keyStatus:'mixed',sourceUrl:'',transcriptUrl:''};
}
