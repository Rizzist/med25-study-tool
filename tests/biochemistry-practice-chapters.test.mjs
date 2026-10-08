import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {DEFAULT_RETAKE_CHAPTER_IDS, RETAKE_PRACTICE_CHAPTERS, isRetakeChapterIndexReady, retakeChapterQuestionIds, retakeChapterSelectionLabel, sanitizeRetakeChapterIds} from '../src/lib/biochemistry/retake-practice-scope.mjs';
import {isExamId} from '../src/lib/mcq/exams.mjs';
import {guidanceMode} from '../src/lib/mcq/guided-exam.mjs';
import {savedLimbPracticeScope} from '../src/lib/mcq/limb-practice-scope.mjs';
import {savedCvsScope} from '../src/lib/mcq/cvs-scope.mjs';

const pageSource = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('page.tsx', pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const compile = source => ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;

test('partial, stale and malformed chapter indexes remain loading rather than showing misleading zero counts', () => {
  const index = RETAKE_PRACTICE_CHAPTERS.map(c => ({id:c.id,questionCount:1,questionIds:[`${c.id}-q`]}));
  assert(isRetakeChapterIndexReady(index));
  for (const malformed of [undefined, [], index.slice(1), [...index.slice(1), index[1]], index.map((c,i) => i ? c : {...c,questionCount:2}), index.map((c,i) => i ? c : {...c,questionIds:[index[1].questionIds[0]]})]) assert.equal(isRetakeChapterIndexReady(malformed), false);
});

test('all Lippincott chapters and slide extras are selectable, with only confirmed Term 1 scope selected by default', () => {
  // Term 1 retake only: Lippincott 8-13 and 19-22 (Term 2 Biochemistry II metabolism) are not offered.
  assert.equal(RETAKE_PRACTICE_CHAPTERS.length, 26);
  assert.equal(new Set(RETAKE_PRACTICE_CHAPTERS.map(chapter => chapter.id)).size, 26);
  assert.equal(DEFAULT_RETAKE_CHAPTER_IDS.length, 26);
  for (let number = 1; number <= 33; number++) {
    const id = `ch-${number}`;
    const term1 = ![8, 9, 10, 11, 12, 13, 19, 20, 21, 22].includes(number);
    assert.equal(RETAKE_PRACTICE_CHAPTERS.some(chapter => chapter.id === id), term1);
    assert.equal(DEFAULT_RETAKE_CHAPTER_IDS.includes(id), term1);
  }
  for (const id of ['foundations', 'water-buffers', 'lab-practical']) assert(DEFAULT_RETAKE_CHAPTER_IDS.includes(id));
});

test('chapter union deduplicates IDs, rejects unknown chapters, and never substitutes all questions for empty selection', () => {
  const index = [{id: 'ch-1', questionCount: 2, questionIds: ['a', 'shared']}, {id: 'ch-2', questionCount: 2, questionIds: ['b', 'shared']}, {id: 'invalid', questionCount: 1, questionIds: ['x']}];
  assert.deepEqual(retakeChapterQuestionIds(index, ['ch-1', 'ch-2']), ['a', 'shared', 'b']);
  assert.deepEqual(retakeChapterQuestionIds(index, []), []);
  assert.deepEqual(retakeChapterQuestionIds(index, ['invalid']), []);
  assert.deepEqual(retakeChapterQuestionIds(undefined, DEFAULT_RETAKE_CHAPTER_IDS), []);
  assert.deepEqual(sanitizeRetakeChapterIds(['ch-1', 'ch-1', 'ch-34', 'ch-9', 1, 'lab-practical']), ['ch-1', 'lab-practical']);
  assert.equal(sanitizeRetakeChapterIds(undefined), undefined);
  assert.equal(retakeChapterSelectionLabel(DEFAULT_RETAKE_CHAPTER_IDS), 'Confirmed Term 1 scope');
  assert.equal(retakeChapterSelectionLabel(['ch-17']), 'Chapter 17 · Complex lipids');
});

test('actual archive parser preserves chapter scope, exact session pool, guidance, answers and original score', () => {
  const names = ['cleanIds', 'optionalPracticeIds', 'cleanAnswers', 'isCollectionId', 'isTerm2CourseExam', 'cleanActiveSession', 'parseSessionArchive', 'isAnswered'];
  const definitions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text) || ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === 'collectionLabel')).map(node => node.getText(ast)).join('\n');
  const parse = new Function('isExamId', 'guidanceMode', 'savedLimbPracticeScope', 'savedCvsScope', 'isBiochemistryChapterId', 'sanitizeRetakeChapterIds', `${compile(definitions)};return parseSessionArchive;`)(isExamId, guidanceMode, savedLimbPracticeScope, savedCvsScope, id => typeof id === 'string', sanitizeRetakeChapterIds);
  const exactPool = Array.from({length: 1200}, (_, i) => `retake-chapter-q-${i}`);
  const active = {exam: 'term1-biochemistry-retake', collection: 'all', questionIds: ['retake-chapter-q-1', 'retake-chapter-q-2'], practicalPracticeIds: exactPool, questionIndex: 1, answers: {'retake-chapter-q-1': {mode: 'select', selectedOptionId: 'B'}}, studyMode: 'exam', guidance: 'guided', biochemistryChapterIds: ['ch-1', 'ch-17', 'bad']};
  const result = parse(JSON.stringify({active, history: [{...active, id: 'completed', correctCount: 1, answeredCount: 2}]}));
  assert.deepEqual(result.active.biochemistryChapterIds, ['ch-1', 'ch-17']);
  assert.deepEqual(result.active.practicalPracticeIds, exactPool);
  assert.deepEqual(result.active.questionIds, active.questionIds);
  assert.equal(result.active.guidance, 'guided');
  assert.equal(result.active.answers['retake-chapter-q-1'].selectedOptionId, 'B');
  assert.deepEqual(result.history[0].biochemistryChapterIds, ['ch-1', 'ch-17']);
  assert.equal(result.history[0].correctCount, 1);
  const legacy = parse(JSON.stringify({active: {...active, biochemistryChapterIds: undefined}, history: []}));
  assert.equal(legacy.active.biochemistryChapterIds, undefined);
  assert.deepEqual(legacy.active.questionIds, active.questionIds);
  const otherCourse = parse(JSON.stringify({active: {...active, exam: 'term2-cvs'}, history: []}));
  assert.equal(otherCourse.active.biochemistryChapterIds, undefined);
});

test('Practice resolves chapter selection before choosing guided/unguided and preserves explicit Review Topics pools', () => {
  let startNode;
  const visit = node => {if (ts.isFunctionDeclaration(node) && node.name?.text === 'startSession') startNode = node; ts.forEachChild(node, visit);};
  visit(ast);
  const selectedIds = ['q-one', 'q-two'];
  for (const [tab, exactInput] of [['Practice MCQs', undefined], ['Review topics', ['q-review']]]) {
    const declarations = {
      collection: 'all', exam: 'term1-biochemistry-retake', tab, phase: 'setup',
      selectedRetakeChapterIds: ['ch-1'], sessionSize: 20,
      inPracticeRegion: ids => ids.filter(id => selectedIds.includes(id)),
      isSavedCollection: id => ['wrong', 'flagged'].includes(id),
      examProgress: {wrongIds: ['q-one', 'q-outside'], flaggedIds: []},
      selectedExam: {collectionQuestionIds: {all: [...selectedIds, 'q-outside']}},
    };
    const filterStatement = startNode.body.statements[0].getText(ast);
    const prepare = new Function(...Object.keys(declarations), `${compile(`function prepare(nextCollection, exactIds, options) {${filterStatement}; return {exactIds, options};}`)}; return prepare;`)(...Object.values(declarations));
    const result = prepare('all', exactInput, {mode: 'exam'});
    assert.deepEqual(result.exactIds, tab === 'Practice MCQs' ? selectedIds : exactInput);
    assert.deepEqual(result.options.biochemistryChapterIds, tab === 'Practice MCQs' ? ['ch-1'] : undefined);
    assert.equal(result.options.limit, tab === 'Practice MCQs' ? 20 : undefined);
    if (tab === 'Practice MCQs') assert.deepEqual(prepare('wrong', undefined, {}).exactIds, ['q-one']);
    assert.match(startNode.body.statements[1].getText(ast), /supportsGuidedExam/);
  }
  // Stored exact IDs take precedence on New sprint; no new scope is inferred from the current tab.
  assert.match(pageSource, /startSession\(collection, activeRespiratoryPracticeIds \?\? activePracticalPracticeIds \?\? activeCoursePracticeIds, \{ biochemistryChapterId: activeBiochemistryChapterId, biochemistryChapterIds: activeRetakeChapterIds/);
});
