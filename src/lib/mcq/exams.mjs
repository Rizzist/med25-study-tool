// Term 2 is opt-in by exam tag: overlapping subjects never import Term 1 content.
export const term2Exams = [
  { id: "term2-cvs", date: null, title: "CVS", scope: "Heart, vessels and circulation across anatomy, histology, embryology and physiology, plus book-based back and spinal anatomy grouped here at your request", status: "ready" },
  { id: "term2-respiratory", date: null, title: "Respiratory", scope: "Airway and thoracic anatomy, respiratory histology, lung development and respiratory physiology", status: "ready" },
  { id: "term2-limbs", date: null, title: "Upper & Lower Limbs", scope: "Both limbs, with local upper-limb carryover and book-based regional anatomy; missing lower-limb/hand teaching detail and related embryology, histology and muscle physiology are labeled book extensions", status: "ready" },
  { id: "term2-biochemistry", date: null, title: "Biochemistry II", scope: "Reconciled Lippincott Chapters 8–12 and 15 with local metabolism material, plus practical stations for equipment, titration, spectrophotometry, protein tests, enzymes and flame photometry", status: "ready" },
  { id: "term2-physiology-practical", date: "2026-08-31", title: "Physiology Practical", scope: "Blood pressure, heart sounds, ECG, spirometry, RBC/WBC counts, differential count, hematocrit and bleeding/clotting time", status: "ready" },
  { id: "term2-nutrition", date: null, title: "Nutrition", scope: "Nutrition Review and Nutrition & Diet Therapy, 9th edition: nutrients, energy, assessment, vitamins, minerals, life stages and clinical diets. Original downloaded past-paper questions stay in Final Exam; lecture scope is not yet confirmed", status: "ready" },
  { id: "term2-religion", date: null, title: "Religion", scope: "Religion Review: 25 teaching topics reconciled with available lecture material, Theological Instructions and identified supplementary references. Practice is newly authored; Final Exam retains all 180 original paper occurrences with qualified keys and correction notes", status: "ready" },
  { id: "term2-divine-ethics", date: null, title: "Divine Ethics", scope: "The new 15-page course extract: planning, sincerity and ostentation, trust, remembrance, gratitude, prayer and repentance. Twelve teaching pages plus three contents pages; source-based practice, not past papers", status: "ready" },
];

export const examIds = ["july25", "aug22", "july29", ...term2Exams.map((exam) => exam.id)];
export const isExamId = (value) => typeof value === "string" && examIds.includes(value);
export const isTerm2Exam = (value) => term2Exams.some((exam) => exam.id === value);
export const isTerm2Question = (question) => question.tags?.some((tag) => tag === "term-2" || tag.startsWith("exam-term2-")) ?? false;
export const matchesTerm2Exam = (question, exam) => isTerm2Exam(exam) && (question.tags ?? []).includes(`exam-${exam}`);
export const isImageQuestion = (question) => question.kind === "image_single_best_answer" || question.kind === "dynamic_anatomy";
export const isInteractive3dQuestion = (question) => question.kind === "dynamic_anatomy_3d";
