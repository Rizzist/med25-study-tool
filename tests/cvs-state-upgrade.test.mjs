import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CVS_PAPER_STORAGE_KEY, emptyPaperProgress, readPaperProgress, newPaperAttempt,
  restorePaperAttempt, answerPaperQuestion, questionFeedback, gradePaper, gradePaperBreakdown,
} from '../src/lib/mcq/cvs-paper-state.mjs';

const now = '2026-09-15T12:00:00.000Z';
const choices = ['First', 'Second', 'Third', 'Fourth'];
const sample = { id: 'sample', fingerprint: 'revision-1', questions: [
  { id: 'a', options: choices, scoringKey: 'A', issues: [] },
  { id: 'b', options: choices, scoringKey: 'B', issues: [] },
  { id: 'c', options: [], scoringKey: null, issues: [] },
  { id: 'd', options: choices, scoringKey: 'D', issues: ['source key disputed'] },
] };
const topicMap = {
  subjects: [{ id: 'physiology', title: 'Physiology' }, { id: 'anatomy', label: 'Anatomy' }],
  topics: [{ id: 'pressure', title: 'Pressure', subjectId: 'physiology' }, { id: 'vessels', label: 'Vessels', subjectId: 'anatomy' }],
  questions: { a: { subjectId: 'physiology', topicId: 'pressure' }, b: { subjectId: 'physiology', topicId: 'pressure' }, c: { subjectId: 'anatomy', topicId: 'vessels' }, d: { subjectId: 'anatomy', topicId: 'vessels' } },
};

test('default learning mode and optional closed-book mode survive storage', () => {
  assert.equal(CVS_PAPER_STORAGE_KEY, 'med25-cvs-papers-v1');
  assert.equal(newPaperAttempt(sample, now).feedbackMode, 'instant');
  const attempt = newPaperAttempt(sample, now, 'deferred');
  const progress = { ...emptyPaperProgress(), attempts: { sample: attempt } };
  assert.deepEqual(readPaperProgress(JSON.stringify(progress)), progress);
  assert.equal(restorePaperAttempt(attempt, sample).feedbackMode, 'deferred');
});

test('legacy v1 data stays available and missing feedback mode migrates on restore', () => {
  const attempt = newPaperAttempt(sample, now);
  delete attempt.feedbackMode;
  attempt.answers = { a: 'A' };
  attempt.index = 2;
  const result = gradePaper(sample, attempt, now);
  const progress = { version: 1, attempts: { sample: attempt }, latest: { sample: result } };
  const loaded = readPaperProgress(JSON.stringify(progress));
  assert.deepEqual(loaded, progress);
  assert.equal(restorePaperAttempt(loaded.attempts.sample, sample).feedbackMode, 'instant');
  assert.deepEqual(restorePaperAttempt(loaded.attempts.sample, sample).answers, { a: 'A' });
  assert.deepEqual(loaded.latest.sample, result);
});

test('first committed answer is immutable and radio inputs are validated', () => {
  const attempt = newPaperAttempt(sample, now);
  for (const value of ['', ' ', 'E', '1', 'AB', 'First', 42, null]) {
    assert.equal(answerPaperQuestion(sample, attempt, 'a', value), attempt);
  }
  assert.equal(answerPaperQuestion(sample, attempt, 'unknown', 'A'), attempt);
  const answered = answerPaperQuestion(sample, attempt, 'a', ' a ');
  assert.notEqual(answered, attempt);
  assert.deepEqual(answered.answers, { a: 'A' });
  assert.deepEqual(attempt.answers, {});
  assert.equal(answerPaperQuestion(sample, answered, 'a', 'B'), answered);
  assert.equal(answerPaperQuestion(sample, answered, 'a', ''), answered);
  const finished = { ...answered, completedAt: now };
  assert.equal(answerPaperQuestion(sample, finished, 'b', 'B'), finished);
  assert.equal(answerPaperQuestion({ ...sample, fingerprint: 'revision-2' }, answered, 'b', 'B'), answered);
});

test('short answers and partially recovered choices commit trimmed text', () => {
  const attempt = newPaperAttempt(sample, now);
  const answered = answerPaperQuestion(sample, attempt, 'c', '  Increase venous return. \n');
  assert.equal(answered.answers.c, 'Increase venous return.');
  assert.equal(answerPaperQuestion(sample, answered, 'c', 'Different answer'), answered);
  const partial = { ...sample, questions: [{ ...sample.questions[0], options: ['First', '', 'Third'] }] };
  assert.equal(answerPaperQuestion(partial, attempt, 'a', '  My written answer  ').answers.a, 'My written answer');
  const twoChoices = { ...sample, questions: [{ ...sample.questions[0], options: ['First', 'Second'] }] };
  assert.equal(answerPaperQuestion(twoChoices, attempt, 'a', 'C'), attempt);
  const sixChoices = { ...sample, questions: [{ ...sample.questions[0], options: ['1', '2', '3', '4', '5', '6'] }] };
  assert.equal(answerPaperQuestion(sixChoices, attempt, 'a', 'f').answers.a, 'F');
});

test('feedback never guesses missing/disputed keys or calls unanswered questions incorrect', () => {
  assert.equal(questionFeedback(sample.questions[0], undefined), 'unanswered');
  assert.equal(questionFeedback(sample.questions[0], '  '), 'unanswered');
  assert.equal(questionFeedback(sample.questions[0], ' a '), 'correct');
  assert.equal(questionFeedback(sample.questions[0], 'B'), 'incorrect');
  assert.equal(questionFeedback(sample.questions[2], 'Some answer'), 'ungraded');
  assert.equal(questionFeedback(sample.questions[3], 'D'), 'ungraded');
  assert.equal(questionFeedback(sample.questions[3], 'A'), 'ungraded');
  assert.equal(questionFeedback({ ...sample.questions[0], issues: undefined }, 'B'), 'ungraded');
});

test('breakdowns use graded answers as denominator and keep missed/ungraded lists separate', () => {
  const attempt = newPaperAttempt(sample, now);
  attempt.answers = { a: 'A', c: 'Some answer', d: 'D' };
  const report = gradePaperBreakdown(sample, attempt, topicMap);
  assert.deepEqual(report.overall, { total: 4, answered: 3, correct: 1, incorrect: 0, unanswered: 1, ungraded: 2, manualCorrect: 0, manualIncorrect: 0, sourceKeyed: 2, percentage: 100 });
  assert.deepEqual(report.wrongQuestionIds, []);
  assert.deepEqual(report.missedQuestionIds, ['b']);
  assert.deepEqual(report.ungradedQuestionIds, ['c', 'd']);
  assert.equal(report.subjects[0].label, 'Physiology');
  assert.equal(report.subjects[1].title, 'Anatomy');
  assert.equal(report.subjects[1].percentage, null);
  assert.deepEqual(report.topics[0].questionIds, ['a', 'b']);
  assert.deepEqual(report.topics[0].missedQuestionIds, ['b']);
  assert.deepEqual(report.topics[1].ungradedQuestionIds, ['c', 'd']);
});

test('manual grading applies only to answered items without a reliable source key', () => {
  const attempt = newPaperAttempt(sample, now);
  attempt.answers = { a: 'A', b: 'D', c: 'Some answer', d: 'D' };
  attempt.manual = { a: 'incorrect', b: 'correct', c: 'correct', d: 'incorrect' };
  const report = gradePaperBreakdown(sample, attempt, topicMap);
  assert.deepEqual(report.overall, { total: 4, answered: 4, correct: 2, incorrect: 2, unanswered: 0, ungraded: 0, manualCorrect: 1, manualIncorrect: 1, sourceKeyed: 2, percentage: 50 });
  assert.deepEqual(report.wrongQuestionIds, ['b', 'd']);
  assert.deepEqual(report.topics[1].wrongQuestionIds, ['d']);
  assert.equal(report.topics[1].manualCorrect, 1);
  delete attempt.answers.d;
  const missing = gradePaperBreakdown(sample, attempt, topicMap);
  assert.equal(missing.overall.percentage, 67);
  assert.equal(missing.overall.manualIncorrect, 0);
  assert.deepEqual(missing.missedQuestionIds, ['d']);
  assert.deepEqual(missing.wrongQuestionIds, ['b']);
});

test('missing/malformed metadata uses explicit unclassified groups and does not change papers', () => {
  const attempt = newPaperAttempt(sample, now);
  const before = JSON.stringify(sample);
  for (const metadata of [undefined, null, {}, { subjects: 'bad', topics: null, questions: [] }]) {
    const report = gradePaperBreakdown(sample, attempt, metadata);
    assert.equal(report.subjects.length, 1);
    assert.equal(report.subjects[0].id, 'unclassified');
    assert.equal(report.topics[0].id, 'unclassified:unclassified');
    assert.equal(report.overall.percentage, null);
    assert.deepEqual(report.missedQuestionIds, ['a', 'b', 'c', 'd']);
  }
  const report = gradePaperBreakdown(sample, attempt, { ...topicMap, questions: { a: { topicId: 'pressure' }, b: { subjectId: 'anatomy', topicId: 'pressure' } } });
  assert.deepEqual(report.topics.find(row => row.id === 'pressure').questionIds, ['a']);
  assert.deepEqual(report.topics.find(row => row.id === 'unclassified:anatomy').questionIds, ['b']);
  assert.equal(JSON.stringify(sample), before);
});

test('optional section reports persist with existing results, and damaged reports are discarded', () => {
  const attempt = newPaperAttempt(sample, now);
  attempt.answers = { a: 'A', c: 'Text' };
  const result = { ...gradePaper(sample, attempt, now), sectionStats: gradePaperBreakdown(sample, attempt, topicMap) };
  const progress = { version: 1, attempts: { sample: attempt }, latest: { sample: result } };
  assert.deepEqual(readPaperProgress(JSON.stringify(progress)), progress);
  const corruptions = [
    report => { report.overall.percentage = 0; },
    report => { report.subjects[0].total = -1; },
    report => { report.topics[0].questionIds = ['a', 'a']; },
    report => { report.wrongQuestionIds = ['b']; },
    report => { report.missedQuestionIds = ['unknown', 'd']; },
    report => { report.subjects[0].missedQuestionIds = ['a']; },
    report => { report.subjects[0].label = null; },
  ];
  for (const corrupt of corruptions) {
    const dirty = structuredClone(progress);
    corrupt(dirty.latest.sample.sectionStats);
    const loaded = readPaperProgress(JSON.stringify(dirty));
    assert.deepEqual(loaded.latest.sample, gradePaper(sample, attempt, now));
    assert.deepEqual(loaded.attempts.sample, attempt);
  }
  const dirtyMode = structuredClone(progress);
  dirtyMode.attempts.sample.feedbackMode = { mode: 'anything' };
  const loaded = readPaperProgress(JSON.stringify(dirtyMode));
  assert.equal(loaded.attempts.sample.feedbackMode, undefined);
  assert.equal(restorePaperAttempt(loaded.attempts.sample, sample).feedbackMode, 'instant');
  assert.deepEqual(loaded.latest.sample, result);
});

test('old final score semantics are unchanged', () => {
  const attempt = newPaperAttempt(sample, now);
  attempt.answers = { a: ' a ', b: 'D', c: 'any text' };
  attempt.manual = { a: 'incorrect', c: 'correct', d: 'incorrect' };
  assert.deepEqual(gradePaper(sample, attempt, now), { paperId: 'sample', fingerprint: 'revision-1', completedAt: now, total: 4, keyed: 2, matched: 1, unanswered: 1, manualCorrect: 1, manualGraded: 2, ungraded: 0, percentage: 50 });
  assert.equal(gradePaper({ ...sample, questions: [sample.questions[2]] }, attempt, now).percentage, null);
});

test('stale attempts reset while restored answer types, navigation, and manual marks are sanitized', () => {
  const attempt = newPaperAttempt(sample, now);
  assert.equal(restorePaperAttempt(attempt, { ...sample, fingerprint: 'revision-2' }), null);
  assert.equal(restorePaperAttempt(attempt, { ...sample, id: 'another' }), null);
  const restored = restorePaperAttempt({ ...attempt, index: 999, answers: { a: ' a ', b: 42, c: ' text ', d: 'Z', missing: 'D' }, manual: { missing: 'correct', c: 'banana', d: 'incorrect' } }, sample);
  assert.equal(restored.index, 3);
  assert.deepEqual(restored.answers, { a: 'A', c: 'text' });
  assert.deepEqual(restored.manual, { d: 'incorrect' });
  const finished = { ...restored, completedAt: now };
  const progress = { version: 1, attempts: { sample: finished }, latest: { sample: gradePaper(sample, finished, now) } };
  assert.deepEqual(readPaperProgress(JSON.stringify(progress)), progress);
});

test('corrupt storage cannot discard valid attempts or manufacture valid results', () => {
  for (const raw of [null, 'bad json', 'null', '[]', '{}', '{"version":1,"attempts":[],"latest":[]}']) assert.deepEqual(readPaperProgress(raw), emptyPaperProgress());
  const attempt = newPaperAttempt(sample, now);
  const progress = { version: 1, attempts: { sample: attempt, bad: { fingerprint: 'x' } }, latest: { bad: { completedAt: 'no date' }, sample: { ...gradePaper(sample, attempt, now), matched: 900 } } };
  const loaded = readPaperProgress(JSON.stringify(progress));
  assert.deepEqual(loaded.attempts, { sample: attempt });
  assert.deepEqual(loaded.latest, {});
});

test('empty papers produce a valid empty optional report', () => {
  const paper = { ...sample, questions: [] };
  const attempt = newPaperAttempt(paper, now);
  const report = gradePaperBreakdown(paper, attempt, topicMap);
  const result = { ...gradePaper(paper, attempt, now), sectionStats: report };
  assert.equal(report.overall.total, 0);
  assert.equal(report.overall.percentage, null);
  assert.deepEqual(report.subjects, []);
  assert.deepEqual(report.topics, []);
  const progress = { version: 1, attempts: { sample: attempt }, latest: { sample: result } };
  assert.deepEqual(readPaperProgress(JSON.stringify(progress)), progress);
});
