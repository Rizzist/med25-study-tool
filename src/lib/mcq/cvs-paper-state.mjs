export const CVS_PAPER_STORAGE_KEY = 'med25-cvs-papers-v1';
export function emptyPaperProgress() { return { version: 1, attempts: {}, latest: {} }; }

const record = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const feedbackMode = value => value === 'instant' || value === 'deferred';
const text = value => typeof value === 'string' ? value.trim() : '';
const countFields = ['total', 'answered', 'correct', 'incorrect', 'unanswered', 'ungraded', 'manualCorrect', 'manualIncorrect', 'sourceKeyed'];
const nonnegativeInteger = value => Number.isSafeInteger(value) && value >= 0;
const ids = value => Array.isArray(value) && value.every(id => typeof id === 'string' && id.length > 0) && new Set(value).size === value.length;
const percentage = counts => counts.correct + counts.incorrect ? Math.round(counts.correct / (counts.correct + counts.incorrect) * 100) : null;

function validAttempt(p, id) {
  return record(p) && p.paperId === id && typeof p.fingerprint === 'string' && record(p.answers) && record(p.manual)
    && date(p.startedAt) && (p.completedAt === null || date(p.completedAt));
}

function validCounts(value) {
  return record(value) && countFields.every(field => nonnegativeInteger(value[field]))
    && value.answered + value.unanswered === value.total
    && value.correct + value.incorrect + value.ungraded === value.answered
    && value.manualCorrect <= value.correct && value.manualIncorrect <= value.incorrect
    && value.sourceKeyed <= value.total
    && value.correct - value.manualCorrect + value.incorrect - value.manualIncorrect <= value.sourceKeyed
    && value.manualCorrect + value.manualIncorrect <= value.total - value.sourceKeyed
    && value.percentage === percentage(value);
}

function validReviewIds(value, counts, questionIds) {
  if (!ids(value.wrongQuestionIds) || !ids(value.missedQuestionIds) || !ids(value.ungradedQuestionIds)) return false;
  if (value.wrongQuestionIds.length !== counts.incorrect || value.missedQuestionIds.length !== counts.unanswered || value.ungradedQuestionIds.length !== counts.ungraded) return false;
  const reviewIds = [...value.wrongQuestionIds, ...value.missedQuestionIds, ...value.ungradedQuestionIds];
  return new Set(reviewIds).size === reviewIds.length && (!questionIds || reviewIds.every(id => questionIds.has(id)));
}

function validSection(section, topic) {
  return validCounts(section) && typeof section.id === 'string' && Boolean(section.id)
    && typeof section.label === 'string' && Boolean(section.label)
    && typeof section.title === 'string' && Boolean(section.title)
    && (!topic || typeof section.subjectId === 'string' && Boolean(section.subjectId))
    && ids(section.questionIds) && section.questionIds.length === section.total
    && validReviewIds(section, section, new Set(section.questionIds));
}

function validBreakdown(value, total) {
  if (!record(value) || !validCounts(value.overall) || value.overall.total !== total
    || !Array.isArray(value.subjects) || !Array.isArray(value.topics)) return false;
  const questionSets = [];
  for (const [rows, topic] of [[value.subjects, false], [value.topics, true]]) {
    if (!rows.every(row => validSection(row, topic)) || new Set(rows.map(row => row.id)).size !== rows.length) return false;
    if (!countFields.every(field => rows.reduce((sum, row) => sum + row[field], 0) === value.overall[field])) return false;
    const allIds = rows.flatMap(row => row.questionIds);
    if (allIds.length !== total || new Set(allIds).size !== total) return false;
    questionSets.push(new Set(allIds));
  }
  if ([...questionSets[0]].some(id => !questionSets[1].has(id))) return false;
  if (!validReviewIds(value, value.overall, questionSets[0])) return false;
  for (const field of ['wrongQuestionIds', 'missedQuestionIds', 'ungradedQuestionIds']) {
    const expected = new Set(value[field]);
    if ([value.subjects, value.topics].some(rows => rows.flatMap(row => row[field]).some(id => !expected.has(id)))) return false;
  }
  return true;
}

function validResult(r, id) {
  if (!record(r) || r.paperId !== id || typeof r.fingerprint !== 'string' || !date(r.completedAt)) return false;
  const fields = ['total', 'keyed', 'matched', 'unanswered', 'manualCorrect', 'manualGraded', 'ungraded'];
  if (fields.some(k => !Number.isInteger(r[k]) || r[k] < 0)) return false;
  return r.matched <= r.keyed && r.manualCorrect <= r.manualGraded && r.unanswered <= r.total
    && r.keyed + r.manualGraded + r.ungraded === r.total
    && r.percentage === (r.keyed ? Math.round(r.matched / r.keyed * 100) : null);
}

export function readPaperProgress(raw) {
  try {
    const p = JSON.parse(raw);
    if (p?.version !== 1 || !record(p.attempts) || !record(p.latest)) return emptyPaperProgress();
    return {
      version: 1,
      attempts: Object.fromEntries(Object.entries(p.attempts).filter(([id, a]) => validAttempt(a, id)).map(([id, attempt]) => {
        const safe = { ...attempt };
        if (!feedbackMode(safe.feedbackMode)) delete safe.feedbackMode;
        return [id, safe];
      })),
      latest: Object.fromEntries(Object.entries(p.latest).filter(([id, r]) => validResult(r, id)).map(([id, result]) => {
        const safe = { ...result };
        if (!validBreakdown(safe.sectionStats, safe.total)) delete safe.sectionStats;
        return [id, safe];
      })),
    };
  } catch { return emptyPaperProgress(); }
}

export function newPaperAttempt(paper, now = new Date().toISOString(), mode = 'instant') {
  return { paperId: paper.id, fingerprint: paper.fingerprint, answers: {}, index: 0, startedAt: now, completedAt: null, manual: {}, feedbackMode: feedbackMode(mode) ? mode : 'instant' };
}

function normalizeAnswer(question, value) {
  const answer = text(value);
  if (!answer) return '';
  const options = question.options;
  const completeChoices = Array.isArray(options) && options.length >= 2 && options.length <= 6 && options.every(option => text(option));
  if (!completeChoices) return answer;
  const letter = answer.toUpperCase();
  return letter.length === 1 && 'ABCDEF'.slice(0, options.length).includes(letter) ? letter : '';
}

export function restorePaperAttempt(saved, paper) {
  if (!validAttempt(saved, paper.id) || saved.fingerprint !== paper.fingerprint) return null;
  const questions = new Map(paper.questions.map(q => [q.id, q]));
  const answers = Object.fromEntries(Object.entries(saved.answers).flatMap(([id, value]) => {
    const question = questions.get(id);
    const answer = question ? normalizeAnswer(question, value) : '';
    return answer ? [[id, answer]] : [];
  }));
  const manual = Object.fromEntries(Object.entries(saved.manual ?? {}).filter(([id, value]) => questions.has(id) && ['correct', 'incorrect', 'ungraded'].includes(value)));
  return { ...saved, answers, manual, feedbackMode: feedbackMode(saved.feedbackMode) ? saved.feedbackMode : 'instant', index: Math.max(0, Math.min(paper.questions.length - 1, Number.isInteger(saved.index) ? saved.index : 0)) };
}

// Committing an answer locks the first response; navigation and optional self-marks remain separate.
export function answerPaperQuestion(paper, attempt, questionId, value) {
  if (!attempt || attempt.completedAt || attempt.paperId !== paper.id || attempt.fingerprint !== paper.fingerprint
    || !record(attempt.answers) || text(attempt.answers[questionId])) return attempt;
  const question = paper.questions.find(q => q.id === questionId);
  if (!question) return attempt;
  const answer = normalizeAnswer(question, value);
  return answer ? { ...attempt, answers: { ...attempt.answers, [questionId]: answer } } : attempt;
}

function reliableKey(question) {
  return Array.isArray(question.issues) && question.issues.length === 0 ? text(question.scoringKey).toUpperCase() : '';
}

export function questionFeedback(question, answer) {
  const response = text(answer);
  if (!response) return 'unanswered';
  const key = reliableKey(question);
  if (!key) return 'ungraded';
  return response.toUpperCase() === key ? 'correct' : 'incorrect';
}

function emptyCounts() {
  return { total: 0, answered: 0, correct: 0, incorrect: 0, unanswered: 0, ungraded: 0, manualCorrect: 0, manualIncorrect: 0, sourceKeyed: 0, percentage: null };
}

function emptySection(id, label, subjectId) {
  return { id, label, title: label, ...(subjectId ? { subjectId } : {}), ...emptyCounts(), questionIds: [], wrongQuestionIds: [], missedQuestionIds: [], ungradedQuestionIds: [] };
}

function catalog(entries) {
  return new Map((Array.isArray(entries) ? entries : []).filter(entry => record(entry) && text(entry.id)).map(entry => [entry.id, entry]));
}

function label(entry, fallback) { return text(entry?.label) || text(entry?.title) || fallback; }

function increment(counts, question, status, manualMark) {
  counts.total++;
  if (reliableKey(question)) counts.sourceKeyed++;
  if (status === 'unanswered') counts.unanswered++;
  else {
    counts.answered++;
    counts[status]++;
    if (manualMark === 'correct') counts.manualCorrect++;
    else if (manualMark === 'incorrect') counts.manualIncorrect++;
  }
  counts.percentage = percentage(counts);
}

/** Accuracy includes answered, graded questions only. Manual grades are explicit subsets. */
export function gradePaperBreakdown(paper, attempt, topicMap) {
  const subjects = catalog(topicMap?.subjects);
  const topics = catalog(topicMap?.topics);
  const mapping = record(topicMap?.questions) ? topicMap.questions : {};
  const subjectRows = new Map();
  const topicRows = new Map();
  const result = { overall: emptyCounts(), subjects: [], topics: [], wrongQuestionIds: [], missedQuestionIds: [], ungradedQuestionIds: [] };
  for (const question of paper.questions) {
    const mapped = record(mapping[question.id]) ? mapping[question.id] : {};
    const topic = topics.get(mapped.topicId);
    const mappedSubject = subjects.has(mapped.subjectId) ? mapped.subjectId : subjects.has(topic?.subjectId) ? topic.subjectId : 'unclassified';
    const subjectId = mappedSubject;
    // A topic assigned to another subject is unsafe navigation metadata: keep the subject and use its fallback topic.
    const knownTopic = topic && (!topic.subjectId || topic.subjectId === subjectId);
    const topicId = knownTopic ? topic.id : `unclassified:${subjectId}`;
    if (!subjectRows.has(subjectId)) subjectRows.set(subjectId, emptySection(subjectId, label(subjects.get(subjectId), 'Unclassified / source review needed')));
    if (!topicRows.has(topicId)) topicRows.set(topicId, emptySection(topicId, label(knownTopic ? topic : null, 'Unclassified / source review needed'), subjectId));
    let status = questionFeedback(question, attempt.answers?.[question.id]);
    const manualMark = status === 'ungraded' && ['correct', 'incorrect'].includes(attempt.manual?.[question.id]) ? attempt.manual[question.id] : null;
    if (manualMark) status = manualMark;
    const reviewField = status === 'incorrect' ? 'wrongQuestionIds' : status === 'unanswered' ? 'missedQuestionIds' : status === 'ungraded' ? 'ungradedQuestionIds' : null;
    increment(result.overall, question, status, manualMark);
    if (reviewField) result[reviewField].push(question.id);
    for (const row of [subjectRows.get(subjectId), topicRows.get(topicId)]) {
      increment(row, question, status, manualMark);
      row.questionIds.push(question.id);
      if (reviewField) row[reviewField].push(question.id);
    }
  }
  const ordered = (rows, definitions) => {
    const order = new Map([...definitions.keys()].map((id, index) => [id, index]));
    return [...rows.values()].sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
  };
  result.subjects = ordered(subjectRows, subjects);
  result.topics = ordered(topicRows, topics);
  return result;
}

// Preserve the original v1 source-key result semantics for existing saved results and consumers.
export function gradePaper(paper, attempt, now = new Date().toISOString()) {
  let keyed = 0, matched = 0, unanswered = 0, manualCorrect = 0, manualGraded = 0;
  for (const q of paper.questions) {
    const answer = (attempt.answers[q.id] ?? '').trim();
    if (!answer) unanswered++;
    if (q.scoringKey && !q.issues.length) { keyed++; if (answer.toUpperCase() === q.scoringKey) matched++; }
    else if (['correct', 'incorrect'].includes(attempt.manual?.[q.id])) { manualGraded++; if (attempt.manual[q.id] === 'correct') manualCorrect++; }
  }
  return { paperId: paper.id, fingerprint: paper.fingerprint, completedAt: now, total: paper.questions.length, keyed, matched, unanswered, manualCorrect, manualGraded, ungraded: paper.questions.length - keyed - manualGraded, percentage: keyed ? Math.round(matched / keyed * 100) : null };
}
