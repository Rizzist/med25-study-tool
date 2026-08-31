export type Term2CourseSource = {
  title: string;
  kind: string;
  locator: string;
  status: string;
};
export type Term2CourseModule = {
  id: string;
  subject: "anatomy" | "histology" | "embryology" | "physiology" | "biochemistry";
  title: string;
  summary: string;
  sourceLocator: string;
  scope: "course" | "book-extension";
  keyPoints: string[];
  retrieval: Array<{ prompt: string; answer: string }>;
  questionIds: string[];
};

export type Term2CourseCatalog = {
  examId: "term2-cvs" | "term2-limbs" | "term2-biochemistry";
  title: string;
  scopeNote: string;
  sources: Term2CourseSource[];
  modules: Term2CourseModule[];
  unresolved: string[];
};
