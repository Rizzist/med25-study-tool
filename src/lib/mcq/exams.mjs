// Term 2 is opt-in by exam tag: overlapping subjects never import Term 1 content.
export const term2Exams = [
  { id: "term2-cvs", date: null, title: "CVS", scope: "Heart, vessels and circulation across anatomy, histology, embryology and physiology, plus book-based back and spinal anatomy grouped here at your request", status: "ready" },
  { id: "term2-respiratory", date: null, title: "Respiratory", scope: "Airway and thoracic anatomy, respiratory histology, lung development and respiratory physiology", status: "ready" },
  { id: "term2-limbs", date: null, title: "Upper & Lower Limbs", scope: "Both limbs, with local upper-limb carryover and book-based regional anatomy; missing lower-limb/hand teaching detail and related embryology, histology and muscle physiology are labeled book extensions", status: "ready" },
  { id: "term2-biochemistry", date: null, title: "Biochemistry II", scope: "Reconciled Lippincott Chapters 8–12 and 15 with the local carbohydrate and dietary-lipid metabolism materials", status: "ready" },
  { id: "term2-physiology-practical", date: "2026-08-31", title: "Physiology Practical", scope: "Blood pressure, heart sounds, ECG, spirometry, RBC/WBC counts, differential count, hematocrit and bleeding/clotting time", status: "ready" },
];

export const examIds = ["july25", "aug22", "july29", ...term2Exams.map((exam) => exam.id)];
export const isExamId = (value) => typeof value === "string" && examIds.includes(value);
export const isTerm2Exam = (value) => term2Exams.some((exam) => exam.id === value);
export const isTerm2Question = (question) => question.tags?.some((tag) => tag === "term-2" || tag.startsWith("exam-term2-")) ?? false;
export const matchesTerm2Exam = (question, exam) => isTerm2Exam(exam) && (question.tags ?? []).includes(`exam-${exam}`);
export const isImageQuestion = (question) => question.kind === "image_single_best_answer" || question.kind === "dynamic_anatomy";
export const isInteractive3dQuestion = (question) => question.kind === "dynamic_anatomy_3d";
