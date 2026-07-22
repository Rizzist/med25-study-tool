import type { MCQQuestion, SubjectId } from "@/src/lib/mcq/types";

export type LessonExamId = "july25" | "july29";
export type LessonExamScope = LessonExamId | "both";
export type LessonKind = "process" | "timeline" | "comparison" | "recognition" | "mechanism";
export type LessonVisualType = "flow" | "timeline" | "layers" | "comparison" | "map";

export type LessonVisualItem = {
  label: string;
  detail: string;
  cue: string;
};

export type CoreLesson = {
  id: string;
  exam: LessonExamScope;
  subject: SubjectId;
  topic: string;
  title: string;
  subtitle: string;
  kind: LessonKind;
  topicPatterns: string[];
  questionPatterns: string[];
  visual: {
    type: LessonVisualType;
    caption: string;
    items: LessonVisualItem[];
  };
  essentials: string[];
  traps: Array<{ wrong: string; right: string }>;
  recognition: string[];
  source: { label: string; detail: string };
  asset?: string;
};

export type LessonCollection = {
  version: number;
  lessons: CoreLesson[];
};

export function lessonMatchesExam(lesson: CoreLesson, exam: LessonExamId) {
  return lesson.exam === exam || lesson.exam === "both";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function lessonForQuestion(question: MCQQuestion, exam: LessonExamId, lessons: CoreLesson[]) {
  const topic = normalize(question.topic);
  const haystack = normalize([
    question.prompt,
    question.topic,
    question.subtopic ?? "",
    question.learningObjective,
    question.chapter,
    ...(question.tags ?? []),
  ].join(" "));

  const candidates = lessons
    .filter((lesson) => lessonMatchesExam(lesson, exam) && lesson.subject === question.subject)
    .map((lesson, index) => {
      const normalizedTopics = lesson.topicPatterns.map(normalize);
      const exactTopic = normalizedTopics.includes(topic);
      const broadTopic = normalizedTopics.some((pattern) => pattern && (topic.includes(pattern) || pattern.includes(topic)));
      const keywordHits = lesson.questionPatterns.reduce((count, pattern) => {
        const key = normalize(pattern);
        return count + (key && haystack.includes(key) ? 1 : 0);
      }, 0);
      return {
        lesson,
        score: (exactTopic ? 100 : broadTopic ? 45 : 0) + Math.min(keywordHits, 5) * 12 - index / 1000,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) return undefined;
  const best = candidates[0];
  return best.score > 0 ? best.lesson : candidates.find(({ lesson }) => lesson.kind === "recognition")?.lesson ?? best.lesson;
}
