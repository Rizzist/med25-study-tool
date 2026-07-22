export const MCQ_SCHEMA_VERSION = "1.0.0" as const;

export type SubjectId = "histology" | "embryology" | "physiology" | "biochemistry";
export type QuestionKind = "single_best_answer" | "image_single_best_answer";
export type QuestionStatus = "draft" | "verified" | "retired";
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type MCQOption = {
  id: string;
  text: string;
};

export type MCQMedia = {
  id: string;
  type: "image";
  path: string;
  alt: string;
  caption?: string;
  attribution?: string;
  annotations?: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

export type MCQSource = {
  title: string;
  edition?: string;
  chapter: string;
  page?: string;
  figure?: string;
  lecture?: string;
  slide?: string;
  excerpt?: string;
};

export type MCQQuestion = {
  schemaVersion: typeof MCQ_SCHEMA_VERSION;
  id: string;
  revision: number;
  status: QuestionStatus;
  kind: QuestionKind;
  subject: SubjectId;
  topic: string;
  subtopic?: string;
  chapter: string;
  difficulty: Difficulty;
  prompt: string;
  options: MCQOption[];
  correctOptionId: string;
  acceptedFreeText?: string[];
  explanation: string;
  distractorExplanations: Record<string, string>;
  learningObjective: string;
  source: MCQSource;
  media?: MCQMedia[];
  tags: string[];
  examPriority: "core" | "high" | "standard";
  qualityFlags: string[];
};

export type StudentAnswer = {
  questionId: string;
  mode: "select" | "write";
  selectedOptionId?: string;
  writtenAnswer?: string;
  reasoning: string;
  confidence: "guess" | "unsure" | "confident";
  elapsedMs?: number;
};

export type CodexGrade = {
  verdict: "correct" | "incorrect" | "partially_correct" | "ungradable";
  reasoningQuality: "sound" | "mixed" | "flawed" | "missing";
  confidenceAlignment: "calibrated" | "overconfident" | "underconfident" | "unknown";
  misconception: string;
  teachingNote: string;
  whyCorrectAnswerWins: string;
  optionFeedback: Array<{ optionId: string; feedback: string }>;
  reflectionQuestion: string;
  sourceWarning: string;
};
