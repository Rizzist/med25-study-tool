import { ecgVisualCases } from './ecg-visual.mjs';
import { stationVisualCases } from './station-visual.mjs';
import { toUnit } from './visual-authoring.mjs';
export const visualCases = [...ecgVisualCases, ...stationVisualCases];
export const visualUnits = visualCases.map(toUnit);
export const externalPractice = [
 {title:'ECGpedia · keyed ECG practice',url:'https://en.ecgpedia.org/wiki/Practice_ECGs',stations:['ecg'],use:'Additional worked cases. The downloaded ECG examples in this lab come from ECGpedia; diagnoses are checked against their source pages.'},
 {title:'LITFL · Top ECG quiz cases',url:'https://litfl.com/top-100/ecg/',stations:['ecg'],use:'External answered ECG problem sets; many are advanced clinical extension, not confirmed Term 2 scope.'},
 {title:'Geeky Medics · free ECG quiz',url:'https://geekymedics.com/ecg-quiz/',stations:['ecg'],use:'Independent interpretation self-test. Linked for practice, not copied into MED25; premium collections are not included.'},
 {title:'University of Leeds · blood mystery cells',url:'https://www.histology.leeds.ac.uk/blood/wbc_identify_pg2.php',stations:['differential'],use:'Try cell identification before switching on the original labels.'},
 {title:'University of Leeds · blood quiz',url:'https://www.histology.leeds.ac.uk/blood/quiz/',stations:['differential','rbc','wbc','hematocrit','hemostasis'],use:'Cell morphology, function and blood constituents. Additional context, not an official practical marking scheme.'},
 {title:'OpenStax · cardiac cycle questions',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-review-questions',stations:['heart-sounds'],use:'Heart-cycle and electrical/mechanical theory. Newly authored MED25 questions apply these concepts to the course.'},
 {title:'OpenStax · blood-flow and pressure questions',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-review-questions',stations:['bp'],use:'Pressure, resistance and circulation reasoning; read feedback with the local measurement protocol.'},
 {title:'OpenStax · respiratory questions',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-review-questions',stations:['spirometry'],use:'Volumes, ventilation and respiratory physiology; use the course-specific calibration separately.'},
];
