import type { MCQMedia, MCQQuestion } from './types';
export function isLocationQuestion(question: MCQQuestion): boolean;
export function locationLabel(question: MCQQuestion, regionId?: string): string | undefined;
export function regionAtPoint(regions: NonNullable<MCQMedia['annotations']>, x: number, y: number): string | undefined;
export function locationOptionId(question: MCQQuestion, regionId?: string): string | undefined;
export function restoredLocationResponse(question: MCQQuestion, regionId?: string): { selectedRegionId: string; selectedOptionId: string } | undefined;
export function canRevealAnatomyFigure(question: MCQQuestion, questions: MCQQuestion[], hasAnswered: (question: MCQQuestion) => boolean): boolean;
export function buildLocationQuestions(questions: MCQQuestion[]): MCQQuestion[];
export function buildModelLocationQuestions(questions: MCQQuestion[], manifests: import('../anatomy3d/types').AnatomyModuleManifest[]): MCQQuestion[];
