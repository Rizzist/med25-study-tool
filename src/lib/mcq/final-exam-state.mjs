export const FINAL_EXAM_STORAGE_KEY = "med25-final-exam-v1";

export function emptyFinalExamProgress() {
  return {
    version: 1,
    exams: {
      july25: null,
      july29: null,
    },
  };
}

function cleanIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => typeof id === "string" && id.length > 0 && id.length <= 160))];
}

function cleanAnswer(value, question) {
  if (!value || typeof value !== "object" || typeof value.selectedOptionId !== "string") return null;
  const validOptionIds = new Set(question.options.map((option) => option.id));
  if (!validOptionIds.has(value.selectedOptionId)) return null;
  if (value.questionRevision !== question.revision || value.correctOptionId !== question.correctOptionId) return null;
  return {
    selectedOptionId: value.selectedOptionId.slice(0, 8),
    correct: Boolean(value.correct),
    answeredAt: typeof value.answeredAt === "string" ? value.answeredAt : new Date().toISOString(),
    questionRevision: question.revision,
    correctOptionId: question.correctOptionId,
  };
}

export function reconcileFinalExamSession(value, questions, fingerprint) {
  const validQuestions = new Map(questions.map((question) => [question.id, question]));
  const priorIds = cleanIds(value?.questionIds);
  const priorIndex = Math.max(0, Math.min(priorIds.length - 1, Math.floor(Number(value?.currentIndex) || 0)));
  const priorCurrentId = priorIds[priorIndex];
  const savedIds = priorIds.filter((id) => validQuestions.has(id));
  const savedSet = new Set(savedIds);
  const liveIds = cleanIds(questions.map((question) => question.id));
  const questionIds = [...savedIds, ...liveIds.filter((id) => !savedSet.has(id))];
  const sourceAnswers = value?.answers && typeof value.answers === "object" ? value.answers : {};
  const answers = {};

  for (const id of questionIds) {
    const question = validQuestions.get(id);
    const answer = cleanAnswer(sourceAnswers[id], question);
    if (answer) {
      answer.correct = answer.selectedOptionId === question.correctOptionId;
      answers[id] = answer;
    }
  }

  const preservedIndex = priorCurrentId ? questionIds.indexOf(priorCurrentId) : -1;
  const fallbackIndex = Math.max(0, Math.min(questionIds.length - 1, Math.floor(Number(value?.currentIndex) || 0)));
  return {
    bankFingerprint: fingerprint,
    questionIds,
    currentIndex: preservedIndex >= 0 ? preservedIndex : fallbackIndex,
    answers,
    startedAt: typeof value?.startedAt === "string" ? value.startedAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: Object.keys(answers).length === questionIds.length && questionIds.length
      ? (typeof value?.completedAt === "string" ? value.completedAt : new Date().toISOString())
      : null,
  };
}

export function parseFinalExamProgress(raw, banks = {}) {
  const empty = emptyFinalExamProgress();
  if (!raw) return empty;
  try {
    const value = JSON.parse(raw);
    return {
      version: 1,
      exams: {
        july25: banks.july25
          ? reconcileFinalExamSession(value?.exams?.july25, banks.july25.questions, banks.july25.fingerprint)
          : value?.exams?.july25 ?? null,
        july29: banks.july29
          ? reconcileFinalExamSession(value?.exams?.july29, banks.july29.questions, banks.july29.fingerprint)
          : value?.exams?.july29 ?? null,
      },
    };
  } catch {
    return empty;
  }
}
