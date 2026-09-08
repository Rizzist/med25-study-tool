// Explicit practice-retirement policy; source records and full atlas context are retained.
// Classify the operation being tested, never every question mentioning a structure.
export function normalizedAnatomyLabel(label = '') {
  return label.toLowerCase().replace(/\([^)]*\)/g, ' ')
    .replace(/^\s*(left|right)\s+/, '')
    .replace(/\bmuscles?\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

// Exact coarse-target names only. Detailed modifiers such as branch, head,
// orifice, valve-of, anatomical snuff-box, or named branch remain distinct.
export const FOUNDATION_LABELS = [
  'heart','atrium','ventricle',
  'aorta','ascending aorta','arch of aorta','arch of the aorta','aortic arch','descending aorta','descending thoracic aorta',
  'superior vena cava','inferior vena cava','vena cava','svc','ivc',
  'pulmonary trunk','pulmonary artery','pulmonary vein','pulmonary veins',
  'brachiocephalic trunk','brachiocephalic vein','common carotid artery',
  'trachea','main bronchus',
  'lung','lungs','superior lobe','upper lobe','inferior lobe','lower lobe','middle lobe',
  'oesophagus','esophagus','thymus',
  'sternum','typical rib',
  'scapula','clavicle','humerus','radius','ulna','hip bone','ilium','ischium','pubis','femur','patella','tibia','fibula',
  'carpal bones','tarsal bones','metacarpals','metatarsals','metatarsal bones','phalanges','phalanges of the hand','phalanges of the foot',
];
const foundation = new Set(FOUNDATION_LABELS.map(normalizedAnatomyLabel));

// Audited obvious written recall; never expand this through a body-part regex.
// Relations, branches, injury/localization and procedures are retained by default.
export const FOUNDATION_WRITTEN_IDS = new Set([
  'cvs-anat-007', // Left ventricle forms the apex.
  'cvs-anat-013', // Left ventricular thickness versus systemic pressure.
  'cvs-anat-019', // Coronary sinus drains into the right atrium.
  'resp-anat-gap-034', // Name the complete laryngeal cartilage ring.
  'resp-anat-gap-076', // Name oxygenated vessel going to left atrium.
  'resp-anat-034', // Name the ridge at the tracheal bifurcation.
  'resp-anat-035', // Count right and left lobar bronchi.
  'limb-ul-003', // Glenoid cavity faces laterally.
  'limb-ul-025', // Lateral clavicle articulates with acromion.
  'limb-ll-025', // Name the three bones forming the hip bone.
]);

export function isFoundationTarget(target) {
  return foundation.has(normalizedAnatomyLabel(typeof target === 'string' ? target : target?.label));
}

export function visualRecallTarget(question, manifests = []) {
  if (question.anatomy) return question.media?.find(m => m.id === question.anatomy.imageId)?.annotations?.find(r => r.id === question.anatomy.targetRegionId);
  if (question.anatomy3d) return manifests.find(m => m.modelKey === question.anatomy3d.modelKey)?.structures.find(s => s.id === question.anatomy3d.structureId)
    ?? { label: question.anatomy3d.selectableStructures?.find(s => s.id === question.anatomy3d.structureId)?.label
      ?? question.options?.find(o => o.id === question.correctOptionId)?.text };
}

export function anatomyPracticeExclusion(question, manifests = []) {
  if (question.subject !== 'anatomy' || !(question.tags ?? []).some(tag => ['exam-term2-cvs','exam-term2-respiratory','exam-term2-limbs','anatomy-visual-atlas'].includes(tag))) return undefined;
  if (FOUNDATION_WRITTEN_IDS.has(question.id)) return 'audited-foundational-recall';
  if (/^The highlighted structure is part of which system\?$/i.test(question.prompt ?? '')) return 'elementary-system-classification';
  // The content must actually be identity/locate. A clinical question may still
  // carry anatomy media metadata and must not be lost just because its target is large.
  const visualRecall = /^Find .+\.(?: |$)/.test(question.prompt ?? '')
    && (question.anatomy?.responseMode === 'locate' || question.anatomy3d?.responseMode === 'locate')
    || /which structure is (?:highlighted|indicated by callout A|centered at marker A)\?/i.test(question.prompt ?? '');
  if (visualRecall && isFoundationTarget(visualRecallTarget(question, manifests))) return 'foundation-target-recognition';
  return undefined;
}

export const includeAdvancedAnatomyPractice = (question, manifests) => !anatomyPracticeExclusion(question, manifests);
