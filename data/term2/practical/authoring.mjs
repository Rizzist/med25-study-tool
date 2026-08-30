// Each set is authored against inspected, visible course slides. Numeric cases
// are new applications of those methods, not purported official answer keys.
export const Q = (id, prompt, answer, explanation, distractors, media, style = "application") => ({ id: `theory-${id}`, prompt, answer, explanation, distractors, media, style });
export const U = (id, stationId, title, sourceKey, pages, questions) => ({ id, stationId, title, sourceKey, pages, questions });
export const sources = {
  bp: { title: "Blood pressure measurement international.pdf", file: "01 - Blood pressure and heart sounds.pdf", pages: 38, kind: "page" },
  ecg: { title: "ECG Appl Physio Class 7.ppt", file: "02 - ECG recording and interpretation.ppt", pages: 61, kind: "slide" },
  assignment: { title: "ECG Eng Appl Physio Assignment.ppt", file: "03 - ECG practice assignment.ppt", pages: 4, kind: "slide" },
  spiro: { title: "Spirometery for kish class.pptx", file: "04 - Spirometry and trace calculations.pptx", pages: 25, kind: "slide" },
  count: { title: "Cell Counting 1.pptx", file: "05 - RBC and WBC counting.pptx", pages: 24, kind: "slide" },
  dlc: { title: "differential count.ppt", file: "06 - Differential WBC identification.ppt", pages: 18, kind: "slide" },
  blood: { title: "Bleeding-Time.pptx", file: "07 - Hematocrit, bleeding time and clotting time.pptx", pages: 25, kind: "slide" },
  notes: { title: "Handwritten BP notes — corrections required.pdf", file: "08 - Handwritten BP notes - READ CORRECTIONS FIRST.pdf", pages: 3, kind: "page" },
};
