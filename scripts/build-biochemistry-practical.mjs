import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { stations, sources, review } from './content/biochemistry-practical.mjs';

const root = resolve(import.meta.dirname, '..');
const check = process.argv.includes('--check');
const prefix = 'biochem2-practical-';
const questions = [];
const modules = [];
const concepts = [];
const audit = [];
const stationCatalog = [];
const imageSources = {
  'lab-19': `${sources.lab}, PDF p. 19`,
  'beer-lambert-graphs': `${sources.photometry}, slide 14 (embedded graphs)`,
  'photometry-28': `${sources.photometry}, physical slide 28 (printed 26)`,
  'enzymes-17': `${sources.enzymes}, slide 17`,
  'enzymes-18': `${sources.enzymes}, slide 18`,
  'enzymes-20': `${sources.enzymes}, slide 20`,
};
function save(relative, value, lines = false) {
  const path = resolve(root, relative);
  const text = lines ? value.map(item => JSON.stringify(item)).join('\n') + '\n' : JSON.stringify(value, null, 2) + '\n';
  if (check) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== text) throw new Error(`Stale biochemistry practical output: ${relative}`);
  } else writeFileSync(path, text);
}

for (const [stationIndex, station] of stations.entries()) {
  const moduleId = `${prefix}${station.id}`;
  const conceptId = `${moduleId}-concept`;
  const ownQuestions = station.questions.map(item => {
    const offset = questions.length % 4;
    const ordered = item.choices.map((choice, index) => ({ ...choice, isCorrect: index === 0 }));
    for (let n = 0; n < offset; n++) ordered.unshift(ordered.pop());
    const options = ordered.map((choice, index) => ({ id: 'ABCD'[index], text: choice.text }));
    const correctOptionId = 'ABCD'[ordered.findIndex(choice => choice.isCorrect)];
    const source = {
      title: item.locator.startsWith('Review:') ? review : sources[station.id],
      chapter: station.title,
      [sources[station.id].endsWith('.pdf') || item.locator.startsWith('Review:') ? 'page' : 'slide']: item.locator.replace(/^Slides?\s+/i, ''),
      lecture: `Cross-reference: ${review}, ${station.title}${station.id === 'proteins' ? `; ${sources.proteinsB}` : ''}`,
    };
    const question = {
      schemaVersion: '1.0.0', id: `${moduleId}-${item.id}-v1`, revision: 1, status: 'verified',
      kind: item.image ? 'image_single_best_answer' : 'single_best_answer', subject: 'biochemistry',
      topic: station.title, subtopic: 'Practical biochemistry', chapter: station.title,
      difficulty: item.difficulty, prompt: item.prompt, options, correctOptionId,
      acceptedFreeText: [item.choices[0].text], explanation: item.choices[0].why,
      distractorExplanations: Object.fromEntries(ordered.flatMap((choice, index) => choice.isCorrect ? [] : [['ABCD'[index], choice.why]])),
      learningObjective: `${station.title}: ${item.prompt}`,
      source,
      ...(item.image ? { media: [{
        id: `${moduleId}-${item.image}`, type: 'image', path: `biochemistry-practical/${item.image}.png`,
        alt: `Source figure for ${station.title}`,
        caption: `${station.title} · ${item.locator}. Use the figure to reason through the experiment.`,
        attribution: `Figure: ${imageSources[item.image]}. Local practical teaching material, extracted for the student's study collection.`,
      }] } : {}),
      tags: ['exam-term2-biochemistry', 'term-2', 'study-practice', 'source-based', 'course', 'biochemistry-lab', 'biochemistry-practical', `biochemistry-practical-${station.id}`, item.difficulty >= 4 ? 'knowledge-challenge' : 'knowledge-core'],
      examPriority: item.difficulty >= 4 ? 'high' : 'core',
      qualityFlags: ['local-slides-review-reconciled', 'authored-practice-not-past-paper', 'option-specific-explanations'],
    };
    questions.push(question);
    return question;
  });
  modules.push({ id: moduleId, subject: 'biochemistry', title: `Practical · ${station.title}`, description: station.summary, order: 100 + stationIndex });
  const conceptSources = [
    { title: sources[station.id], locator: station.locator, basis: 'slides' },
    { title: review, locator: `Section: ${station.title}`, basis: 'notes' },
    ...(station.id === 'proteins' ? [{ title: sources.proteinsB, locator: 'PDF pp. 13–27', basis: 'slides' }] : []),
  ];
  concepts.push({
    id: conceptId, moduleId, subject: 'biochemistry', title: station.title, summary: station.summary,
    keyPoints: station.checkpoints, examTraps: station.traps,
    retrievalPrompts: ownQuestions.map(question => ({ prompt: question.prompt, answer: question.explanation })),
    sources: conceptSources, scope: 'course',
    objectives: ownQuestions.map(question => ({ id: `${question.id}-objective`, text: question.learningObjective, questionIds: [question.id] })),
  });
  for (const source of conceptSources) audit.push({
    source: source.title, locator: source.locator, topic: station.title, conceptIds: [conceptId], status: 'mapped',
    note: 'Newly authored study practice from the local slides and saved review; no question is presented as a past or official exam item. Calculation stems state their own input data.',
  });
  stationCatalog.push({
    id: station.id, moduleId, title: station.title, summary: station.summary,
    checkpoints: station.checkpoints, traps: station.traps, sources: conceptSources,
    questionIds: ownQuestions.map(question => question.id),
    challengeIds: ownQuestions.filter(question => question.difficulty >= 4).map(question => question.id),
    imageIds: ownQuestions.filter(question => question.media?.length).map(question => question.id),
  });
}
const conceptPath = resolve(root, 'data/term2/biochemistry-concepts.json');
const catalog = JSON.parse(readFileSync(conceptPath, 'utf8'));
catalog.title = 'Biochemistry II: metabolism theory and local practical concepts';
catalog.updatedAt = '2026-09-13';
const practicalNote = ' Practical coverage additionally reconciles all six local laboratory stations with the saved Biochemistry Practical Review, including both qualitative-test lecturer versions. Numerical scenarios are authored practice; the past-exam bank is unchanged.';
catalog.scopeNote = catalog.scopeNote.replace(practicalNote, '') + practicalNote;
catalog.modules = [...catalog.modules.filter(item => !item.id.startsWith(prefix)), ...modules];
catalog.concepts = [...catalog.concepts.filter(item => !item.id.startsWith(prefix)), ...concepts];
catalog.sourceAudit = [...catalog.sourceAudit.filter(item => !item.conceptIds.some(id => id.startsWith(prefix))), ...audit];
save('data/bank/questions/term2-biochemistry-practical.jsonl', questions, true);
save('data/term2/biochemistry-concepts.json', catalog);
save('data/term2/biochemistry-practical.json', {
  schemaVersion: '1.0.0', examId: 'term2-biochemistry', updatedAt: '2026-09-13',
  title: 'Biochemistry practicals',
  scopeNote: 'Authored practice from your six local practical stations and saved review. These are not past-paper questions. Lecturer-specific protocols remain named; numerical cases state their own data and are not claimed as your laboratory observations.',
  totals: { questions: questions.length, stations: stations.length, challenge: questions.filter(q => q.difficulty >= 4).length, images: questions.filter(q => q.media?.length).length },
  stations: stationCatalog,
});
console.log(`${check ? 'Checked' : 'Built'} ${questions.length} biochemistry practical questions, ${concepts.length} mapped concepts and ${stations.length} stations.`);
