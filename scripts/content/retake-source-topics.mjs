/** Validate the editorial source-topic map without modifying source questions. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {RETAKE_PRACTICE_CHAPTERS} from '../../src/lib/biochemistry/retake-practice-scope.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => JSON.parse(fs.readFileSync(root + path, 'utf8'));
export function retakeSourceHash(question) {
  return crypto.createHash('sha256').update(JSON.stringify([
    question.prompt, question.options, question.correctOptionId,
    question.acceptedOptionIds ?? [], question.subject,
  ])).digest('hex');
}

const sources = [
  ...fs.readFileSync(root + 'data/final-exams/biochemistry-retake-past-papers.jsonl', 'utf8')
    .trim().split('\n').map(line => JSON.parse(line)),
  ...read('data/term1-telegram/banks.json')['term1-biochemistry-retake:biochemistry-retake-past-papers'],
];
const map = read('data/biochemistry-retake/source-topic-map.json');
const chapters = new Set(RETAKE_PRACTICE_CHAPTERS.map(chapter => chapter.id));
const sourceIds = new Set(sources.map(question => question.id));
const counts = {};
let inScope = 0;
let graded = 0;
for (const question of sources) {
  const row = map.questions[question.id];
  if (!row) throw Error(`Missing mapping: ${question.id}`);
  if (row.sourceHash !== retakeSourceHash(question)) throw Error(`Stale mapping: ${question.id}`);
  if (typeof row.inScope !== 'boolean' || !row.reason?.trim()) throw Error(`Invalid decision: ${question.id}`);
  if (row.inScope) {
    if (question.subject !== 'biochemistry' || !chapters.has(row.chapterId)) {
      throw Error(`Invalid in-scope chapter: ${question.id}`);
    }
    inScope++;
    if (question.correctOptionId) graded++;
    counts[row.chapterId] = (counts[row.chapterId] ?? 0) + 1;
  } else if (row.chapterId !== null) {
    throw Error(`Excluded question must have null chapter: ${question.id}`);
  }
}
for (const id of Object.keys(map.questions)) {
  if (!sourceIds.has(id)) throw Error(`Unknown source ID: ${id}`);
}
if (sourceIds.size !== sources.length) throw Error('Duplicate source IDs');
console.log(JSON.stringify({
  sourceQuestions: sources.length,
  biochemistryQuestions: sources.filter(question => question.subject === 'biochemistry').length,
  inScope, inScopeGraded: graded, inScopeUngraded: inScope - graded,
  excludedOrUnclassified: sources.length - inScope,
  chapters: counts,
}, null, 2));
