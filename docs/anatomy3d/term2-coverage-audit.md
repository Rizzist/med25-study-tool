# Term 2 interactive anatomy coverage

This is the source-of-truth audit for the interactive anatomy layer used by both the atlas trainer and embedded MCQs. The theoretical concept banks remain the authority for non-spatial material such as actions, injury mechanisms, dermatomes, imaging interpretation and embryology.

## Current selectable scope

| Exam region | Modules | Selectable targets | Scan-derived BodyParts3D targets | Diagrammatic targets |
|---|---:|---:|---:|---:|
| CVS | Thoracic wall, heart and mediastinum (each with an integrated nerve layer) | 157 | 60 | 97 |
| Respiratory | Nasal cavity, larynx, trachea & lungs | 103 | 34 | 69 |
| Upper limb | Upper limb regional model | 106 | 46 | 60 |
| Lower limb | Lower limb regional model | 98 | 53 | 45 |

Every registered target has a unique selectable object, identification/system quiz variants, an explanation, at least one checkpoint, and a verified model-to-manifest mapping. The UI exposes the complete exam-scope index, aliases, tissue/system filters, scan-derived-only filtering and isolation.

## Fidelity policy

- **Scan-derived** means a segmented BodyParts3D mesh is used.
- **Schematic** means a dedicated segmented mesh is unavailable in the locally licensed atlas build, so the structure is represented as an anatomically positioned teaching overlay. It is always labeled as schematic in training and after grading.
- Grouped structures are named as groups; they are never presented as individually separable parts.
- “Complete exam-scope index” means every selectable structure registered for that module, not every named structure in the human body.
- Peripheral and autonomic nerves are procedural paths because the local atlas release has no usable separable fine-nerve segmentation. The atlas now exposes 33 CVS thoracic/cardiac, 40 respiratory, 49 upper-limb and 33 lower-limb nerve targets and labels every one as schematic.

## Sectioning and MCQ behavior

The shared viewer supports sagittal, coronal and transverse clipping, continuous plane depth, kept-side reversal, rotation and zoom. The clipping plane remains locked to the anatomical axes while the model rotates. Hidden or clipped fragments cannot intercept a click, and labels disappear when the entire target lies beyond the active section.

The same controls are present in embedded 3D MCQs before answering. Labels and free-picking remain locked until grading, preserving closed-book identification while allowing the learner to create the view or cross-section they need.

## Source alignment

The CVS modules map the thoracic-wall, pericardial, heart, great-vessel, mediastinal and thoracic/cardiac-innervation objectives in the Term 2 course data. Nerves are not a separate atlas or module: wall nerves are layered onto the thoracic wall, cardiac autonomics onto the heart, and visceral/mediastinal nerves onto the mediastinum. Its nerve map includes phrenic and vagus courses, recurrent laryngeal nerves, sympathetic chain and rami, thoracic splanchnics, cardiac/pulmonary/oesophageal plexuses, cervical and thoracic cardiac branches, coronary plexuses and visceral-afferent routes. Respiratory adds the V1/V2 and pterygopalatine pathways of the nasal cavity, named superior and recurrent laryngeal branches, the Galen anastomosis, side-specific phrenic/vagus/RLN courses, anterior/posterior pulmonary plexuses and bronchial autonomic routes. Upper- and lower-limb modules map the regional osteology, major joints, muscle compartments, root-to-terminal peripheral nerves, arterial routes and superficial/deep venous routes. The limb nerve pass includes plexus roots/divisions/collaterals, major terminal nerves, clinically tested cutaneous branches, interosseous branches, gluteal branches, sural and saphenous paths, and dorsal/plantar foot branches. The scan-derived detail pass adds deep-forearm/thumb muscles, the snuffbox tendons, deep gluteal rotators, femoral-triangle/adductor muscles, deep leg muscles, dorsalis pedis and the plantar arteries. Clinical and functional objectives that do not correspond to a separable 3D object remain in the theory concepts and conventional MCQs rather than being represented by a misleading geometric object.
