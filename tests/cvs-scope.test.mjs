import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CVS_SCOPES, isCvsScope, normalizeCvsScope, savedCvsScope, requestedCvsScope, cvsScopeLabel,
  matchesCvsPracticeScope, matchesCvsPaperScope, scopedCvsPaperId, cvsPaperScopeFingerprint, scopeCvsPaper,
} from '../src/lib/mcq/cvs-scope.mjs';
import { createCombinedPaper } from '../src/lib/mcq/cvs-paper-enhancements.mjs';
import { newPaperAttempt, restorePaperAttempt, gradePaperBreakdown } from '../src/lib/mcq/cvs-paper-state.mjs';

const read = file => JSON.parse(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'));
const practice = read('data/mcq-runtime/term2-cvs.json');
const topics = read('public/study/cvs-past-papers/topic-map.json');
const catalog = read('public/study/cvs-past-papers/index.json');
const papers = catalog.papers.map(entry => read('public' + entry.file));
const sourceQuestions = papers.flatMap(paper => paper.questions);
const core = read('public/study/cvs-past-papers/core-exam.json');

function assertPartition(rows, predicate, idOf, expected) {
  const all = rows.filter(row => predicate(row, 'all'));
  const physio = rows.filter(row => predicate(row, 'physio'));
  const nonPhysio = rows.filter(row => predicate(row, 'non-physio'));
  assert.deepEqual([all.length, physio.length, nonPhysio.length], expected);
  const physioIds = new Set(physio.map(idOf));
  assert(nonPhysio.every(row => !physioIds.has(idOf(row))));
  assert.deepEqual(new Set([...physio, ...nonPhysio].map(idOf)), new Set(all.map(idOf)));
}

test('CVS scope contract normalizes older or invalid scope values to All', () => {
  assert.deepEqual(CVS_SCOPES, [
    { id: 'all', label: 'All' }, { id: 'physio', label: 'Physio' }, { id: 'non-physio', label: 'Non-Physio' },
  ]);
  for (const { id, label } of CVS_SCOPES) {
    assert(isCvsScope(id));
    assert.equal(normalizeCvsScope(id), id);
    assert.equal(cvsScopeLabel(id), label);
  }
  for (const invalid of [undefined, null, '', 'physiology', 'nonphysio', 0, {}, ['physio']]) {
    assert.equal(isCvsScope(invalid), false);
    assert.equal(normalizeCvsScope(invalid), 'all');
  }
});

test('Saved scope tolerates old records while request scope validates course and value strictly', () => {
  for (const { id } of CVS_SCOPES) {
    assert.equal(savedCvsScope('term2-cvs', id), id);
    assert.equal(requestedCvsScope('term2-cvs', id), id);
    assert.equal(savedCvsScope('term2-respiratory', id), 'all');
  }
  for (const missing of [undefined, null]) {
    assert.equal(savedCvsScope('term2-cvs', missing), 'all');
    assert.equal(requestedCvsScope('term2-cvs', missing), 'all');
    assert.equal(requestedCvsScope('term2-limbs', missing), 'all');
  }
  for (const invalid of ['', 'physiology', 'nonphysio', 0, {}, ['physio']]) {
    assert.equal(savedCvsScope('term2-cvs', invalid), 'all');
    assert.throws(() => requestedCvsScope('term2-cvs', invalid), /valid CVS scope/);
  }
  assert.equal(requestedCvsScope('term2-respiratory', 'all'), 'all');
  for (const scope of ['physio', 'non-physio']) {
    assert.throws(() => requestedCvsScope('term2-respiratory', scope), /valid CVS scope/);
  }
});

test('Live practice subjects form the exact 929 = 135 + 794 partition', () => {
  assertPartition(practice, matchesCvsPracticeScope, question => question.id, [929, 135, 794]);
  assert(matchesCvsPracticeScope(practice.find(question => question.id === 'depth-cvs-phys-017'), 'physio'));
  for (const id of ['comp-cvs-hist-001', 'comp-cvs-hist-002', 'comp-cvs-hist-003', 'cvs-histo-gap-001']) {
    assert(matchesCvsPracticeScope(practice.find(question => question.id === id), 'non-physio'), id);
  }
});

test('Past papers and Core use the audited blood/immune boundary and exact partitions', () => {
  assertPartition(sourceQuestions, (question, scope) => matchesCvsPaperScope(topics.questions[question.id], scope), question => question.id, [1012, 602, 410]);
  assertPartition(core.questions, matchesCvsPaperScope, row => row.questionId, [183, 89, 94]);
  for (const topicId of ['rbc', 'erythropoiesis', 'wbc', 'platelets', 'coagulation', 'blood-groups']) {
    assert(matchesCvsPaperScope({ subjectId: 'blood-immune', topicId }, 'physio'), topicId);
  }
  assert(matchesCvsPaperScope({ subjectId: 'blood-immune', topicId: 'immune-foundations' }, 'non-physio'));
  for (const mapping of [undefined, null, {}, { subjectId: 'unclassified', topicId: 'unclassified' }]) {
    assert(matchesCvsPaperScope(mapping, 'all'));
    assert(matchesCvsPaperScope(mapping, 'non-physio'));
    assert.equal(matchesCvsPaperScope(mapping, 'physio'), false);
  }
});

test('All retains original object identity and every scoped session has independent stable identity', () => {
  const paper = createCombinedPaper(papers);
  const before = JSON.stringify(paper);
  assert.equal(scopeCvsPaper(paper, 'all', topics), paper);
  assert.equal(scopeCvsPaper(paper, undefined, topics), paper);
  assert.equal(scopedCvsPaperId(paper.id, 'all'), paper.id);
  assert.equal(cvsPaperScopeFingerprint(paper.fingerprint, paper.questions.map(question => question.id), 'all'), paper.fingerprint);
  const physio = scopeCvsPaper(paper, 'physio', topics);
  const nonPhysio = scopeCvsPaper(paper, 'non-physio', topics);
  assert.equal(physio.id, `${paper.id}::cvs-physio`);
  assert.equal(nonPhysio.id, `${paper.id}::cvs-non-physio`);
  assert.equal(new Set([paper.id, physio.id, nonPhysio.id]).size, 3);
  assert.equal(new Set([paper.fingerprint, physio.fingerprint, nonPhysio.fingerprint]).size, 3);
  assert.deepEqual(scopeCvsPaper(paper, 'physio', topics), physio);
  assert.equal(cvsPaperScopeFingerprint(paper.fingerprint, physio.questions.map(question => question.id), 'physio'), physio.fingerprint);
  assert.deepEqual([physio.questions.length, nonPhysio.questions.length], [602, 410]);
  assert.equal(physio.sourcePaperIds, paper.sourcePaperIds);
  assert.equal(physio.questions[0], paper.questions.find(question => question.id === physio.questions[0].id));
  assert.deepEqual(physio.questions[0].originPaper, paper.questions.find(question => question.id === physio.questions[0].id).originPaper);
  assert.equal(JSON.stringify(paper), before);
  assert.match(physio.title, /Physio/);
  assert.match(nonPhysio.title, /Non-Physio/);
});

test('Scoped fingerprints change with selected membership or source content, and attempts cannot cross scopes', () => {
  const paper = papers[0];
  const physio = scopeCvsPaper(paper, 'physio', topics);
  const nonPhysio = scopeCvsPaper(paper, 'non-physio', topics);
  const attempt = newPaperAttempt(physio, '2026-10-08T00:00:00.000Z');
  assert(restorePaperAttempt(attempt, scopeCvsPaper(paper, 'physio', topics)));
  assert.equal(restorePaperAttempt(attempt, paper), null);
  assert.equal(restorePaperAttempt(attempt, nonPhysio), null);
  const changedTopics = { ...topics, questions: { ...topics.questions, [physio.questions[0].id]: { subjectId: 'histology' } } };
  assert.notEqual(scopeCvsPaper(paper, 'physio', changedTopics).fingerprint, physio.fingerprint);
  assert.notEqual(scopeCvsPaper({ ...paper, fingerprint: 'updated-source' }, 'physio', topics).fingerprint, physio.fingerprint);
  assert.equal(gradePaperBreakdown(physio, attempt, topics).overall.total, physio.questions.length);
});

test('An anatomy-only paper has an empty Physio scope without silently restoring all questions', () => {
  const paper = papers.find(paper => paper.id === 'cvs-2021-practical');
  assert.equal(scopeCvsPaper(paper, 'physio', topics).questions.length, 0);
  assert.equal(scopeCvsPaper(paper, 'non-physio', topics).questions.length, 14);
});

test('a missing whole topic map cannot turn a scoped request into a full paper', () => {
  const paper = papers[0];
  for (const missing of [undefined, null, {}, {questions: null}, {questions: []}, {questions: {}}, {questions: 'invalid'}]) {
    assert.equal(scopeCvsPaper(paper, 'all', missing), paper);
    for (const scope of ['physio', 'non-physio']) assert.throws(() => scopeCvsPaper(paper, scope, missing), /topic map must load/);
  }
  const missingOne = {...topics, questions: {...topics.questions}};
  delete missingOne.questions[paper.questions[0].id];
  assert(scopeCvsPaper(paper, 'non-physio', missingOne).questions.some(question => question.id === paper.questions[0].id));
});

test('scoped Core titles show their question count once while All titles remain unchanged', () => {
  const paper = {...papers[0], title: 'Core Exam · 183 questions'};
  const scoped = scopeCvsPaper(paper, 'non-physio', topics);
  assert.equal(scoped.title, `Core Exam · Non-Physio · ${scoped.questions.length} questions`);
  assert.equal(scopeCvsPaper(paper, 'all', topics).title, paper.title);
  const originalTitle = 'Questions · original source';
  assert.equal(scopeCvsPaper({...paper, title: originalTitle}, 'physio', topics).title, `${originalTitle} · Physio · 58 questions`);
});
