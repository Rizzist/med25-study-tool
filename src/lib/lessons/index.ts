import embryologyData from "@/data/lessons/embryology.json";
import histologyData from "@/data/lessons/histology.json";
import july29Data from "@/data/lessons/july29-cell-molecules.json";
import curriculumGapData from "@/data/lessons/curriculum-gaps.json";
import july29ComprehensiveData from "@/data/lessons/july29-comprehensive.json";
import histologyPracticalsData from "@/data/lessons/histology-practicals.json";
import { lessonMatchesExam, type CoreLesson, type LessonCollection, type LessonExamId } from "@/src/lib/lessons/types";

const collections = [embryologyData, histologyData, july29Data, curriculumGapData, july29ComprehensiveData, histologyPracticalsData] as unknown as LessonCollection[];

export const allLessons: CoreLesson[] = collections.flatMap((collection) => collection.lessons);
export const histologyPracticalLessons = histologyPracticalsData.lessons as CoreLesson[];

export function lessonsForExam(exam: LessonExamId) {
  return allLessons.filter((lesson) => lessonMatchesExam(lesson, exam));
}
