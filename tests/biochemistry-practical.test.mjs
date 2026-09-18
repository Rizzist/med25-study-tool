import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import { matchesTerm2Exam } from '../src/lib/mcq/exams.mjs';
import { auditTerm2ConceptCatalog } from '../src/lib/term2/concept-audit.mjs';

const root = resolve(import.meta.dirname, '..');
const json = file => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
const lines = file => readFileSync(resolve(root, file), 'utf8').trim().split('\n').map(line => JSON.parse(line));
const questions = lines('data/bank/questions/term2-biochemistry-practical.jsonl');
const catalog = json('data/term2/biochemistry-practical.json');
const concepts = json('data/term2/biochemistry-concepts.json');
const key = suffix => {
  const question = questions.find(q => q.id.endsWith(`-${suffix}-v1`));
  assert.ok(question, `Missing calculation: ${suffix}`);
  return question.options.find(option => option.id === question.correctOptionId).text;
};

test('six locally sourced stations contain 86 unique, valid practice questions', () => {
  assert.equal(questions.length, 86);
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  assert.equal(catalog.stations.length, 6);
  assert.deepEqual(catalog.stations.map(s => s.questionIds.length), [12, 12, 18, 18, 16, 10]);
  const validate = new Ajv({ allErrors: true, strict: false }).compile(json('schemas/mcq-question.schema.json'));
  for (const q of questions) {
    assert.ok(validate(q), `${q.id}: ${JSON.stringify(validate.errors)}`);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(option => option.text)).size, 4);
    assert.ok(q.explanation.length > 60);
    for (const option of q.options.filter(option => option.id !== q.correctOptionId)) assert.ok(q.distractorExplanations[option.id]?.length > 30, `${q.id}: weak distractor feedback`);
    assert.ok(q.source.page || q.source.slide);
    assert.ok(q.source.lecture.includes('Practical Review'));
    assert.ok(q.tags.includes('biochemistry-practical'));
  }
});

test('answer positions are balanced rather than always option A', () => {
  const counts = 'ABCD'.split('').map(id => questions.filter(q => q.correctOptionId === id).length);
  assert.deepEqual(counts, [22, 22, 21, 21]);
});

test('routing is exclusive to Biochemistry II and never manufactures past exams', () => {
  for (const q of questions) {
    assert.equal(matchesTerm2Exam(q, 'term2-biochemistry'), true);
    for (const exam of ['term2-cvs', 'term2-limbs', 'term2-respiratory', 'term2-physiology-practical']) assert.equal(matchesTerm2Exam(q, exam), false);
    assert.ok(!q.tags.some(tag => /^(past-|final-|official-|telegram-final)/.test(tag)));
  }
  const embedded = json('data/bank/embedded-bank.json');
  const finals = Object.values(embedded.finalExams).flat();
  assert.ok(finals.every(q => !q.tags?.includes('biochemistry-practical')));
  const derived = embedded.questions.filter(q => q.tags?.includes('biochemistry-practical'));
  assert.deepEqual(derived, questions, 'Embedded deployed bank must match authored practical questions');
});

test('every question maps to a source-backed concept and station', () => {
  const allBiochem = readdirSync(resolve(root, 'data/bank/questions')).filter(f => f.endsWith('.jsonl')).flatMap(f => lines(`data/bank/questions/${f}`)).filter(q => matchesTerm2Exam(q, 'term2-biochemistry'));
  assert.deepEqual(auditTerm2ConceptCatalog(concepts, allBiochem).errors, []);
  assert.deepEqual(new Set(catalog.stations.flatMap(s => s.questionIds)), new Set(questions.map(q => q.id)));
  for (const station of catalog.stations) {
    assert.ok(station.checkpoints.length >= 4);
    assert.ok(station.sources.length >= 2);
    assert.deepEqual(station.challengeIds, questions.filter(q => station.questionIds.includes(q.id) && q.difficulty >= 4).map(q => q.id));
    assert.deepEqual(station.imageIds, questions.filter(q => station.questionIds.includes(q.id) && q.media?.length).map(q => q.id));
  }
});

test('seven reasoning questions use six real local source figures', () => {
  const imageQuestions = questions.filter(q => q.media?.length);
  assert.equal(imageQuestions.length, 7);
  const paths = new Set(imageQuestions.flatMap(q => q.media.map(m => m.path)));
  assert.equal(paths.size, 6);
  for (const path of paths) {
    assert.ok(existsSync(resolve(root, 'public/study', path)));
    const png = readFileSync(resolve(root, 'public/study', path));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
  }
});

test('independent arithmetic confirms the keyed calculation cases', () => {
  assert.match(key('nonzero-burette'), new RegExp((0.100 * (12.80 - 0.60) / 10).toFixed(3)));
  assert.match(key('titre-difference'), new RegExp((0.100 * (18.65 - 3.25) / 20).toFixed(4)));
  assert.match(key('biuret-calculation'), new RegExp((0.225 / 0.243 * 7).toFixed(2)));
  assert.match(key('protein-transmittance'), new RegExp((100 * 10 ** -0.225).toFixed(2)));
  assert.match(key('ratio-not-raw'), new RegExp((6.83 / 7).toFixed(4)));
  assert.match(key('dye-standard'), /4.00 mg\/L/);
  assert.match(key('intercept'), new RegExp(((0.290 - 0.010) / 0.070).toFixed(2)));
  assert.match(key('predilution'), /8.40 g\/dL/);
  assert.match(key('flame-intercept'), new RegExp(String((61 - 5) / (45 - 5) * 100)));
  assert.match(key('saline-molarity'), new RegExp(String(Math.round(9 / 58.44 * 1000))));
  assert.match(key('enzyme-relative'), /4:2:1/);
});

test('protocol conflicts and interpretation limits remain explicit', () => {
  assert.match(key('ninhydrin-times'), /Ebrahimi: 5 min; Emamgholipour: 10 min/);
  assert.match(key('tca-protocols'), /7.5%/);
  assert.match(key('shared-dilution'), /^No;/);
  assert.match(key('zinc-mechanism-limit'), /proven to be a competitive inhibitor/);
  assert.match(key('clot-not-km'), /not a calibrated initial velocity/);
  assert.match(key('negative-hopkins'), /lacking detectable tryptophan/);
});
