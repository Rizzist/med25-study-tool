import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {CVS_SCOPES, savedCvsScope, matchesCvsPracticeScope} from '../src/lib/mcq/cvs-scope.mjs';
import {savedLimbPracticeScope} from '../src/lib/mcq/limb-practice-scope.mjs';
import {isExamId} from '../src/lib/mcq/exams.mjs';
import {guidanceMode} from '../src/lib/mcq/guided-exam.mjs';
import {sanitizeRetakeChapterIds} from '../src/lib/biochemistry/retake-practice-scope.mjs';

const root = path.resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url), modules = new Map();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const compile = source => ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText;
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (file.endsWith('.mjs')) return require(file);
  const loaded = {exports: {}}; modules.set(file, loaded);
  const local = id => {
    if (!id.startsWith('@/') && !id.startsWith('.')) return require(id);
    const base = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(file), id);
    return load([base, base + '.ts', base + '.json'].find(candidate => fs.existsSync(candidate)));
  };
  new Function('require', 'module', 'exports', compile(fs.readFileSync(file, 'utf8')))(local, loaded, loaded.exports);
  return loaded.exports;
}
const server = load(path.join(root, 'src/lib/server/study-bank.ts'));
const questions = server.loadVerifiedQuestions('term2-cvs'), allIds = questions.map(question => question.id);
const byId = new Map(questions.map(question => [question.id, question]));
const detail = read('public/study/runtime/term2-cvs.json');
const pageSource = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8');
const ast = ts.createSourceFile('page.tsx', pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function nodes(predicate, tree = ast) {
  const found = [];
  function visit(node) { if (predicate(node)) found.push(node); ts.forEachChild(node, visit); }
  visit(tree); return found;
}
function expression(source, bindings) {
  return new Function(...Object.keys(bindings), compile(`const result = (${source});`) + '\nreturn result;')(...Object.values(bindings));
}
const declaration = name => nodes(node => ts.isVariableDeclaration(node) && node.name.getText(ast) === name)[0];
const functionNode = name => nodes(node => ts.isFunctionDeclaration(node) && node.name?.text === name)[0];

test('every CVS collection intersects scope before query and Learn/Test sprint selection', () => {
  for (const {id: cvsScope} of CVS_SCOPES) for (const collection of Object.keys(detail.collectionQuestionIds)) {
    if (!server.isCollectionId(collection)) continue;
    const expected = questions.filter(question => matchesCvsPracticeScope(question, cvsScope) && server.matchesCollection(question, collection));
    const ids = new Set(expected.map(question => question.id));
    const query = server.questionSet(new URLSearchParams({exam: 'term2-cvs', collection, cvsScope, limit: '250'}));
    assert.equal(query.availableCount, expected.length, `${cvsScope}/${collection}/query`);
    assert(query.questions.every(question => ids.has(question.id)));
    for (const studyMode of ['learn', 'exam']) {
      const response = server.coverageQuestionSet({exam: 'term2-cvs', collection, cvsScope, studyMode, limit: 20, seenIds: allIds, repairIds: allIds});
      assert.equal(response.availableCount, expected.length, `${cvsScope}/${collection}/${studyMode}`);
      assert.equal(response.cvsScope, cvsScope);
      assert(response.questions.every(question => ids.has(question.id)));
      assert.equal(new Set(response.questions.map(question => question.id)).size, response.questions.length);
    }
  }
  assert.deepEqual(CVS_SCOPES.map(({id: cvsScope}) => server.coverageQuestionSet({exam: 'term2-cvs', cvsScope}).availableCount), [929, 135, 794]);
});

test('wrong/flagged ID requests retain opposite-scope valid IDs while selecting only requested scope', () => {
  for (const cvsScope of ['physio', 'non-physio']) {
    const expected = questions.filter(question => matchesCvsPracticeScope(question, cvsScope));
    const allowed = new Set(expected.map(question => question.id));
    for (const prioritize of [true, false]) {
      const result = server.questionSetByIds({exam: 'term2-cvs', ids: [...allIds, 'not-a-cvs-question'], cvsScope, preserveOrder: true, prioritize, repairIds: allIds, limit: 250});
      assert.equal(result.availableCount, expected.length);
      assert(result.questions.every(question => allowed.has(question.id)));
      assert.deepEqual(result.validIds, allIds);
      if (!prioritize) assert.deepEqual(result.questions.map(question => question.id), expected.slice(0, 250).map(question => question.id));
    }
  }
});

test('history retrieval keeps original mixed-session IDs even when a current portion is supplied', () => {
  const mixed = [questions.find(question => question.subject === 'physiology').id, questions.find(question => question.subject === 'anatomy').id];
  for (const {id: cvsScope} of CVS_SCOPES) {
    const result = server.questionSetByIds({exam: 'term2-cvs', ids: mixed, cvsScope, preserveOrder: true, purpose: 'history'});
    assert.equal(result.availableCount, mixed.length);
    assert.deepEqual(result.questions.map(question => question.id), mixed);
  }
});

test('every API boundary defaults missing scope to All and rejects invalid or cross-course scope', () => {
  const requests = [
    (exam, cvsScope) => server.questionSet(new URLSearchParams({exam, ...(cvsScope === undefined ? {} : {cvsScope})})),
    (exam, cvsScope) => server.coverageQuestionSet({exam, cvsScope}),
    (exam, cvsScope) => server.questionSetByIds({exam, cvsScope, ids: allIds}),
  ];
  for (const request of requests) {
    assert.equal(request('term2-cvs', undefined).availableCount, 929);
    assert.equal(request('term2-cvs', 'all').availableCount, 929);
    for (const value of ['invalid', '', 'physiology']) assert.throws(() => request('term2-cvs', value), /valid CVS scope/);
    for (const value of ['physio', 'non-physio']) assert.throws(() => request('term2-respiratory', value), /valid CVS scope/);
  }
});

test('actual app parser retains scope, exact questions, answers, and scores; legacy scopes stay All', () => {
  const names = ['cleanIds', 'optionalPracticeIds', 'cleanAnswers', 'isCollectionId', 'isTerm2CourseExam', 'cleanActiveSession', 'parseSessionArchive', 'isAnswered'];
  const definitions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text) || ts.isVariableStatement(node) && node.declarationList.declarations.some(item => item.name.getText(ast) === 'collectionLabel')).map(node => node.getText(ast)).join('\n');
  const bindings = {isExamId, guidanceMode, savedLimbPracticeScope, savedCvsScope, sanitizeRetakeChapterIds, isBiochemistryChapterId: load(path.join(root, 'src/lib/biochemistry/chapters.ts')).isBiochemistryChapterId};
  const parse = new Function(...Object.keys(bindings), compile(definitions) + '\nreturn parseSessionArchive;')(...Object.values(bindings));
  for (const cvsScope of ['all', 'physio', 'non-physio', undefined, 'outdated']) {
    const questionIds = questions.filter(question => matchesCvsPracticeScope(question, savedCvsScope('term2-cvs', cvsScope))).slice(0, 3).map(question => question.id);
    const active = {exam: 'term2-cvs', collection: 'all', cvsScope, questionIds, visitedQuestionIds: questionIds, questionIndex: 1, answers: {[questionIds[0]]: {mode: 'select', selectedOptionId: 'A', flagged: true}}, studyMode: 'exam', coursePracticeIds: questionIds};
    const parsed = parse(JSON.stringify({active, history: [{...active, id: 'attempt', correctCount: 1, answeredCount: 1, flaggedCount: 1}]}));
    assert.equal(parsed.active.cvsScope, savedCvsScope(active.exam, cvsScope));
    assert.deepEqual(parsed.active.questionIds, questionIds);
    assert.deepEqual(parsed.active.coursePracticeIds, questionIds);
    assert.equal(parsed.active.answers[questionIds[0]].selectedOptionId, 'A');
    assert.equal(parsed.history[0].cvsScope, savedCvsScope(active.exam, cvsScope));
    assert.equal(parsed.history[0].correctCount, 1);
    assert.deepEqual(parsed.history[0].questionIds, questionIds);
    assert.equal(parse(JSON.stringify({active: {...active, exam: 'term2-respiratory'}, history: []})).active.cvsScope, 'all');
  }
});

test('actual app ID pool drives exact download and saved-collection counts for all three portions', () => {
  const subjectOf = id => byId.get(id)?.subject;
  const poolExpression = declaration('cvsPracticeIds').initializer.getText(ast);
  const filterExpression = declaration('inPracticeRegion').initializer.getText(ast);
  const download = nodes(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'PracticePdfDownload')[0];
  const downloadIds = download.attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.text === 'questionIds').initializer.expression.getText(ast);
  for (const {id: cvsScope} of CVS_SCOPES) {
    const cvsPracticeIds = expression(poolExpression, {exam: 'term2-cvs', cvsScope, subjectIds: detail.collectionQuestionIds, subjectOf, matchesCvsPracticeScope, useMemo: callback => callback()});
    const expected = questions.filter(question => matchesCvsPracticeScope(question, cvsScope)).map(question => question.id);
    const exported = expression(downloadIds, {cvsPracticeIds, subjectIds: detail.collectionQuestionIds});
    assert.deepEqual(new Set(exported), new Set(expected));
    assert.equal(exported.length, expected.length);
    const filter = expression(filterExpression, {regionalIds: null, retakeSelectedIds: null, cvsPracticeIds});
    assert.deepEqual(new Set(filter(allIds)), new Set(expected));
  }
});

test('actual resume and completed-review handlers restore saved portion and exact IDs independently of current selection', async () => {
  for (const name of ['continueSavedSprint', 'openSavedReview']) for (const cvsScope of ['physio', 'non-physio', undefined]) {
    const questionIds = questions.filter(question => matchesCvsPracticeScope(question, cvsScope ?? 'all')).slice(0, 3).map(question => question.id);
    const saved = {exam: 'term2-cvs', collection: 'all', cvsScope, questionIds, visitedQuestionIds: questionIds, questionIndex: 1, answers: {[questionIds[0]]: {selectedOptionId: 'A'}}, studyMode: 'exam', id: 'saved'};
    const node = functionNode(name), changes = {}, loads = [];
    const setters = Object.fromEntries(nodes(item => ts.isCallExpression(item) && ts.isIdentifier(item.expression) && /^set[A-Z]/.test(item.expression.text), node).map(item => [item.expression.text, value => { changes[item.expression.text] = value; }]));
    const bindings = {...setters, sessionArchive: {active: saved}, sessionRequest: {current: 0}, savedCvsScope, savedLimbPracticeScope, guidanceMode, optionalPracticeIds: ids => ids, answerForQuestion: (question, answer) => answer, loadQuestionsByIds: async (...args) => { loads.push(args); return args[1].map(id => byId.get(id)); }};
    const invoke = new Function(...Object.keys(bindings), compile(node.getText(ast)) + `\nreturn ${name};`)(...Object.values(bindings));
    await invoke(saved);
    assert.equal(changes.setCvsScope, savedCvsScope(saved.exam, cvsScope));
    assert.deepEqual(loads[0].slice(0, 2), [saved.exam, questionIds]);
    assert.equal(loads[0][2], name === 'openSavedReview' ? 'history' : undefined);
    assert.deepEqual(changes.setQuestions.map(question => question.id), questionIds);
    assert.equal(changes.setAnswers[questionIds[0]].selectedOptionId, 'A');
    assert.equal(changes.setPhase, name === 'openSavedReview' ? 'review' : 'active');
  }
});

test('Results separates scoped sessions while All retains legacy and scoped history', () => {
  const history = [undefined, 'all', 'physio', 'non-physio'].map((cvsScope, index) => ({exam: 'term2-cvs', cvsScope, id: index}));
  history.push({exam: 'term2-respiratory', id: 'other'});
  for (const {id: cvsScope} of CVS_SCOPES) {
    const result = expression(declaration('examHistory').initializer.getText(ast), {sessionArchive: {history}, exam: 'term2-cvs', cvsScope, savedCvsScope});
    assert.deepEqual(result.map(row => row.id), cvsScope === 'all' ? [0, 1, 2, 3] : cvsScope === 'physio' ? [2] : [3]);
  }
});
