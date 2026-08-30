import { cardiovascular } from "./cardiovascular.mjs";
import { ecg } from "./ecg.mjs";
import { spirometry } from "./spirometry.mjs";
import { counting } from "./counting.mjs";
import { differential } from "./differential.mjs";
import { blood } from "./blood.mjs";
export { sources } from "./authoring.mjs";
export const theoryUnits = [...cardiovascular, ...ecg, ...spirometry, ...counting, ...differential, ...blood];
const image = (file, title, locator, caption) => ({ path: `physiology-practical/${file}.png`, title, locator, caption });
export const additionalImages = {
  ecg: [
    image("ecg-calibration-detail", "Time and voltage calibration", "ECG main slide 3", "Time runs horizontally; voltage runs vertically. The illustrated calibration is 25 mm/s and 10 mm/mV."),
    image("ecg-rhythm-regular", "Regular rhythm practice", "ECG main slide 45", "Look for repeated P waves, their relationship to QRS, and RR regularity. Confirm calibration before calculating rate."),
    image("ecg-rhythm-atrial", "Atrial activity between complexes", "ECG main slide 46", "Describe the repeated inter-QRS atrial deflections before naming a rhythm. This unkeyed strip is not proof of a specific clinical diagnosis."),
    image("ecg-rhythm-fast", "Closely spaced complexes", "ECG main slide 48", "Assess regularity and paper calibration. A rapid regular pattern alone does not determine its mechanism."),
    image("ecg-rhythm-conduction", "Atrial-to-ventricular relationship", "ECG main slide 50", "Follow atrial deflections through the ventricular pause. Not every atrial event is followed by a QRS; do not infer a precise block type from an unkeyed image alone."),
  ],
  spirometry: [
    image("spirometry-apparatus", "Water-sealed spirometer", "Spirometry slide 5", "Follow the floating drum, water seal, counterweight and recording linkage. Unchanged course figure attributed to Guyton & Hall / Elsevier on the slide."),
    image("spirometry-volumes", "Lung volumes and capacities", "Spirometry slide 4", "This conceptual diagram includes RV, FRC and TLC, although simple spirometry cannot measure residual gas directly. Unchanged Guyton & Hall / Elsevier figure from the course."),
    image("spirometry-reference-table", "Course female predicted-VC table", "Spirometry slide 14", "Match height row and age column. Female, 158 cm, age 24: 3,725 mL. This historical course table is not a universal clinical reference equation."),
  ],
  rbc: [image("counting-microscope", "Microscope controls", "Cell Counting slide 3", "Identify the stage, condenser, iris, objective, ocular and coarse/fine controls."), image("counting-pipettes", "RBC and WBC pipettes", "Cell Counting slide 11", "Recognise the different beads, bulbs and graduations. Legacy illustrations do not authorise mouth-pipetting.")],
  differential: [image("differential-transfer-a", "Granulocyte comparison fields", "Differential slide 14", "Compare nuclear segmentation and granule colour across these additional course fields."), image("differential-transfer-b", "Additional leukocyte comparison fields", "Differential slide 15", "Upper-left basophil, upper-right monocyte and lower lymphocyte examples. Use morphology, not size alone.")],
  hemostasis: [image("hemostasis-platelet-plug", "Platelet-plug formation", "Bleeding-Time slide 13", "Injury exposes collagen; adhesion/activation and released mediators recruit platelets. Intact endothelium releases inhibitory prostacyclin and NO.")],
};

// Every visible source page has a disposition. A mapped page has questions on
// its concepts, not a claim that every possible exam question was exhausted.
export const pageExceptions = {
  bp: {
    1: ["noninstructional", "Title page."], 3: ["background", "Historical direct-measurement illustration; no date-recall question."],
    4: ["background", "Historical instrument timeline; no date-recall question."], 5: ["background", "Laennec/stethoscope history; acoustics assessed elsewhere, historical dates not assessed."],
    38: ["noninstructional", "Closing slide."],
  },
  ecg: {
    1: ["background", "Einthoven historical photograph; no biographical/date question."],
    30: ["unavailable", "Embedded-video placeholder has no playable content in the local rendered source."],
    ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [i + 31, ["limited", "Visible ECG examples audited. Transfer questions assess calibration/rhythm/axis; specific diagnoses are not keyed. Unrelated hidden vendor text is not teaching content; patient-labelled images are not newly republished."]])),
    49: ["limited", "Unkeyed axis example. Axis methods assessed; no invented official diagnosis/answer key."],
  },
  assignment: {
    1: ["limited", "Five-rule rhythm assessment practised; no invented definitive official answer to this unkeyed trace."],
    2: ["limited", "Recording-speed adjustment and rapid regular pattern assessed; exact rhythm mechanism not established by the unkeyed image."],
  },
  spiro: {
    1: ["noninstructional", "Decorative opening image."], 2: ["noninstructional", "Title slide."],
    24: ["limited", "All requested calculation types are practised with explicit values; exact volumes from this resized trace lack a reliable supplied answer key."],
    25: ["noninstructional", "Decorative closing image."],
  },
  count: { 1: ["noninstructional", "Title slide."], 18: ["noninstructional", "RBC-section heading."], 24: ["noninstructional", "Closing slide."] },
  dlc: { 1: ["noninstructional", "Decorative opening."], 2: ["noninstructional", "Title slide."], 7: ["limited", "Mature-cell lineages and RBC/platelet maturation assessed; full developmental chronology is not exhaustively tested."], 18: ["noninstructional", "Decorative closing."] },
  blood: { 1: ["noninstructional", "Hematocrit heading."], 14: ["noninstructional", "Bleeding-time heading."], 19: ["noninstructional", "Clotting-time title/illustration; endpoint assessed on the adjacent method slides."] },
  notes: Object.fromEntries([1,2,3].map((page) => [page, ["correction-only", "Handwritten BP notes cross-checked against the main pack. Incorrect fixed inflation, inter-arm difference and valve-area claims are not taught as facts."]])),
};

export const supplementalPageUnits = {
  assignment: { 1: ["ecg-sinus-check", "ecg-visual-transfer"], 2: ["ecg-calibration", "ecg-visual-transfer"], 3: ["ecg-rate-maths"], 4: ["ecg-equiphasic"] },
  notes: { 1: ["bp-procedure-reasons", "endpoint-troubleshooting"], 2: ["pressure-calculations", "position-errors"], 3: ["listening-landmarks", "sound-integration"] },
};
