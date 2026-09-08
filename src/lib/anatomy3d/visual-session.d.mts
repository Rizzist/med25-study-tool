import type { MCQQuestion } from "../mcq/types";
export type AnatomySessionItem = { question: MCQQuestion; initialView: "2d" | "3d" };
export function shuffleAnatomy<T>(items: T[], seed: string | number): T[];
export function selectAnatomySession(questions: MCQQuestion[], options?: { seed?: string | number; count?: number; moduleKey?: string; format?: "2d" | "3d" | "mixed"; direction?: "mixed" | "identify" | "locate"; feedback?: "learn" | "exam" }): AnatomySessionItem[];
export function parseAnatomySession(value: string | null, questions: MCQQuestion[]): { items: AnatomySessionItem[]; answers: Record<string,string>; locations: Record<string,string>; index: number; graded: boolean; feedback: "learn" | "exam" } | null;
