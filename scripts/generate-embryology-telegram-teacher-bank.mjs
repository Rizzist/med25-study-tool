#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "data/bank/questions/embryology-telegram-teacher-gaps.jsonl");

const tri = "FORMATION OF TRILAMINAR EMBRYO.ppt";
const resp1 = "Embryology  of respiratory system E1.pptx";
const resp2 = "Embryology  of respiratory system E2.pptx";

const specs = [
  {
    slug: "nodal-cilia-leftward-flow", topic: "Third week: gastrulation and axial patterning", subtopic: "Left-right axis establishment", chapter: "Third week", slide: 4, title: tri, difficulty: 4, priority: "high",
    prompt: "An embryo has immotile cilia at the primitive node. Which normal event is most directly lost during establishment of the left-right axis?",
    correct: "A leftward nodal-fluid flow that initiates asymmetric signaling",
    wrong: [
      ["A caudal flow that initiates neural-tube closure", "Neural-tube closure is not initiated by a caudal nodal-fluid current."],
      ["A dorsal flow that separates ectoderm from mesoderm", "Germ-layer separation is not the left-right symmetry-breaking function of nodal cilia."],
      ["A rightward amniotic-fluid flow that forms somites", "Somite formation is not driven by amniotic-fluid flow, and normal nodal flow is leftward."],
    ],
    explanation: "Motile cilia at the primitive node generate a directional leftward flow. That mechanical cue initiates asymmetric molecular signaling and helps establish normal left-right organ patterning.",
    objective: "Relate motile nodal cilia to the first directional event in left-right axis specification.",
    excerpt: "Nodal cilia are presented as the symmetry-breaking mechanism in third-week development.", tags: ["nodal-cilia", "left-right-axis", "gastrulation"],
  },
  {
    slug: "notochord-nucleus-pulposus", topic: "Third week: gastrulation and axial patterning", subtopic: "Notochordal fate", chapter: "Third week", slide: 19, title: tri, difficulty: 2, priority: "core",
    prompt: "Most of the notochord disappears as the vertebral column forms. Which adult structure normally retains notochordal tissue?",
    correct: "Nucleus pulposus of an intervertebral disc",
    wrong: [
      ["Annulus fibrosus of an intervertebral disc", "The annulus fibrosus is mesenchymal; the notochord persists centrally as the nucleus pulposus."],
      ["Posterior longitudinal ligament", "The posterior longitudinal ligament is not a notochordal remnant."],
      ["Vertebral body cortical bone", "Vertebral bodies form around the notochord; their cortical bone is not persistent notochord."],
    ],
    explanation: "The notochord provides the axial template around which vertebrae develop. Its principal adult remnant is the gelatinous nucleus pulposus in each intervertebral disc.",
    objective: "Identify the adult remnant of the embryonic notochord.",
    excerpt: "The notochord is the axis around which the vertebral column forms and persists as the nucleus pulposus.", tags: ["notochord", "nucleus-pulposus", "vertebral-column"],
  },
  {
    slug: "neurenteric-canal-connection", topic: "Third week: gastrulation and axial patterning", subtopic: "Notochord formation", chapter: "Third week", slide: 20, title: tri, difficulty: 3, priority: "high",
    prompt: "During conversion of the notochordal process into the definitive notochord, a transient passage crosses the embryonic disc. Which spaces does it connect?",
    correct: "The amniotic cavity and yolk sac",
    wrong: [
      ["The chorionic cavity and maternal intervillous space", "Those spaces are not joined by the neurenteric canal."],
      ["The neural tube and intraembryonic coelom", "The neurenteric canal predates definitive neural-tube anatomy and does not open into the coelom."],
      ["The pericardial cavity and foregut", "This pair is unrelated to the temporary neurenteric passage."],
    ],
    explanation: "The temporary neurenteric canal passes through the primitive node and connects the amniotic cavity with the yolk sac. It normally obliterates when notochordal development is completed.",
    objective: "Name the two cavities temporarily linked by the neurenteric canal.",
    excerpt: "A small neurenteric canal temporarily connects the amniotic cavity and yolk sac and later obliterates.", tags: ["neurenteric-canal", "notochord", "amniotic-cavity", "yolk-sac"],
  },
  {
    slug: "somites-count-embryo-age", topic: "Embryonic period and germ-layer derivatives", subtopic: "Somitogenesis", chapter: "Third week", slide: 34, title: tri, difficulty: 3, priority: "high",
    prompt: "A day-20-to-30 embryo is being staged before external landmarks are reliable. Which observation from the lecture is most useful?",
    correct: "Count paired somites; about 38 pairs form during this period and 42-44 pairs ultimately develop",
    wrong: [
      ["Count pharyngeal pouches; 38 pairs form before day 30", "Humans do not form 38 paired pharyngeal pouches."],
      ["Measure crown-rump length; it uniquely identifies each day from 20 to 30", "The lecture specifically emphasizes somite number as a staging criterion during the somite period."],
      ["Count neural crest streams; 42-44 pairs form by day 30", "Neural crest streams are not counted as 42-44 serial pairs for embryonic age."],
    ],
    explanation: "Somite number is a practical age criterion during the somite period. The lecture states that roughly 38 pairs form from days 20-30 and that 42-44 pairs ultimately develop.",
    objective: "Use somite number as a staging clue in early embryonic development.",
    excerpt: "About 38 pairs form during days 20-30; eventually 42-44 pairs develop, and somite count helps determine embryonic age.", tags: ["somites", "embryonic-age", "paraxial-mesoderm"],
  },
  {
    slug: "angiogenesis-site-chronology", topic: "Early cardiovascular development", subtopic: "Onset of angiogenesis", chapter: "Third week", slide: 39, title: tri, difficulty: 3, priority: "high",
    prompt: "Which chronology of early blood-vessel formation matches the teacher's third-week lecture?",
    correct: "Angiogenesis begins in extraembryonic mesoderm of the yolk sac, connecting stalk, and chorion; embryonic vessels begin about two days later",
    wrong: [
      ["Embryonic vessels arise first in paraxial mesoderm; yolk-sac vessels follow two weeks later", "The extraembryonic sites begin first, and the delay is about two days rather than two weeks."],
      ["Angiogenesis begins simultaneously in the neural tube and amnion", "Neither the neural tube nor the amnion is listed as the initial angiogenic site."],
      ["Maternal vessels invade the embryo first and are remodeled into fetal endothelium", "Fetal endothelial channels form from embryonic angioblasts rather than maternal vascular invasion."],
    ],
    explanation: "At the beginning of week 3, vessel formation starts in extraembryonic mesoderm at the yolk sac, connecting stalk, and chorion. Comparable embryonic vessel development begins roughly two days later.",
    objective: "Order extraembryonic and embryonic angiogenesis and identify the first sites.",
    excerpt: "Angiogenesis starts in extraembryonic mesoderm at the beginning of week 3; embryonic vessels begin about two days later.", tags: ["angiogenesis", "yolk-sac", "connecting-stalk", "chorion"],
  },
  {
    slug: "blood-island-sequence", topic: "Early cardiovascular development", subtopic: "Blood-island formation", chapter: "Third week", slide: 40, title: tri, difficulty: 4, priority: "high",
    prompt: "Which sequence correctly describes formation of the first endothelial channels from mesenchyme?",
    correct: "Mesenchymal cells become angioblasts, aggregate as blood islands, develop central cavities, and flatten peripherally into endothelium",
    wrong: [
      ["Endoderm forms vascular tubes that recruit mesenchyme as circulating blood cells", "The endothelial channels arise from mesenchymal angioblasts, not endodermal tubes."],
      ["Mesenchyme first forms smooth muscle, which hollows out and becomes endothelium", "Smooth-muscle differentiation is not the blood-island sequence."],
      ["Neural crest cells form erythrocytes, which arrange themselves around an empty lumen", "The early blood-island pathway uses mesenchymal angioblasts; neural crest does not form this endothelial shell."],
    ],
    explanation: "Angioblasts aggregate into blood islands. Cavities appear inside the islands, while peripheral angioblasts flatten into endothelial cells; adjacent endothelial channels then connect by budding and fusion.",
    objective: "Arrange the cellular steps that convert angiogenic cell clusters into endothelial channels.",
    excerpt: "Angioblast clusters form blood islands; cavities appear and peripheral angioblasts flatten into endothelium-lined channels.", tags: ["blood-islands", "angioblasts", "endothelium", "vasculogenesis"],
  },
  {
    slug: "heart-beat-day-21-22", topic: "Early cardiovascular development", subtopic: "Functional circulation", chapter: "Third week", slide: 42, title: tri, difficulty: 2, priority: "core",
    prompt: "By the end of the third week, paired endocardial tubes have contributed to the primordial cardiovascular system. When does the lecture place the onset of the heartbeat?",
    correct: "Approximately day 21 or 22",
    wrong: [
      ["Approximately day 14", "Day 14 is too early for the stated onset of the heartbeat."],
      ["Approximately day 35", "The lecture places cardiac activity by the end of week 3, earlier than day 35."],
      ["At birth, when pulmonary circulation begins", "The embryonic heart begins beating long before birth."],
    ],
    explanation: "The primordial cardiovascular system becomes functional very early. The teacher slide states that blood circulates and the heart begins to beat on approximately day 21 or 22.",
    objective: "Recall the timing of the first embryonic heartbeat.",
    excerpt: "By the end of week 3, blood circulates and the heart begins beating on day 21 or 22.", tags: ["heart-tube", "heartbeat", "day-21", "circulation"],
  },
  {
    slug: "lung-bud-origin-week-four", topic: "Respiratory system development", subtopic: "Respiratory diverticulum", chapter: "Respiratory system I", slide: 3, title: resp1, difficulty: 2, priority: "core",
    prompt: "A four-week embryo develops the first recognizable lower-respiratory primordium. Which description is correct?",
    correct: "A ventral diverticulum buds from foregut endoderm",
    wrong: [
      ["A dorsal diverticulum buds from midgut mesoderm", "The lung bud is ventral and arises from foregut endoderm."],
      ["A lateral diverticulum buds from hindgut ectoderm", "Neither the position, gut region, nor germ layer is correct."],
      ["A paired cavity forms within paraxial mesoderm", "The respiratory diverticulum is an endodermal foregut outgrowth, not a paraxial-mesoderm cavity."],
    ],
    explanation: "At about week 4, the respiratory or laryngotracheal diverticulum appears as a ventral outgrowth of the foregut endoderm. It gives rise to the epithelial lining of the lower respiratory tract.",
    objective: "Identify the timing, position, and germ-layer origin of the lung bud.",
    excerpt: "At four weeks the lung bud appears as a ventral diverticulum in the endoderm of the foregut.", tags: ["lung-bud", "foregut", "endoderm", "week-four"],
  },
  {
    slug: "lung-bud-retinoic-acid-tbx4-image", kind: "image_single_best_answer", topic: "Respiratory system development", subtopic: "Lung-bud induction", chapter: "Respiratory system I", slide: 3, title: resp1, difficulty: 4, priority: "high",
    prompt: "The highlighted ventral outgrowth in this 25-day embryo depends on which signaling relationship for its normal position and initial development?",
    correct: "Retinoic acid from adjacent mesoderm upregulates TBX4 in foregut endoderm",
    wrong: [
      ["Sonic hedgehog from endoderm suppresses all TBX4 expression in mesoderm", "The lecture describes retinoic-acid-dependent upregulation, not suppression of TBX4."],
      ["BMP from surface ectoderm induces PAX6 in the foregut", "PAX6 is not the transcription factor identified for this lung-bud induction step."],
      ["Nodal from the primitive node directly converts paraxial mesoderm into lung epithelium", "Lower-respiratory epithelium is foregut endodermal and the cited induction uses retinoic acid and TBX4."],
    ],
    explanation: "The teacher slide links retinoic acid in adjacent mesoderm to upregulation of TBX4 in foregut endoderm. This interaction helps specify the location and appearance of the respiratory diverticulum.",
    objective: "Interpret a lung-bud image using the retinoic-acid-TBX4 induction pathway.",
    excerpt: "Retinoic acid in adjacent mesoderm causes upregulation of TBX4 in endoderm and controls lung-bud appearance and position.", tags: ["image-recognition", "lung-bud", "retinoic-acid", "tbx4"],
    media: { id: "telegram-respiratory-diverticulum-day25", path: "embryology/telegram/respiratory-diverticulum-day25.jpg", alt: "Sagittal diagram of a 25-day embryo showing the respiratory diverticulum as a ventral foregut outgrowth" },
  },
  {
    slug: "lung-epithelium-versus-mesenchyme", topic: "Respiratory system development", subtopic: "Germ-layer contributions", chapter: "Respiratory system I", slide: 5, title: resp1, difficulty: 3, priority: "core",
    prompt: "Which pairing correctly distinguishes epithelial from supporting-tissue origins in the developing lung?",
    correct: "Respiratory epithelium from foregut endoderm; cartilage, smooth muscle, vessels, connective tissue, and pleura from surrounding splanchnic mesoderm",
    wrong: [
      ["Respiratory epithelium from splanchnic mesoderm; cartilage and smooth muscle from endoderm", "This reverses epithelial and supporting-tissue origins."],
      ["All lung tissues from foregut endoderm", "Endoderm supplies epithelium, whereas surrounding splanchnic mesoderm supplies most supporting tissues."],
      ["All lung tissues from neural crest", "Neural crest is not the common origin of lung epithelium and mesenchyme."],
    ],
    explanation: "Foregut endoderm forms the respiratory epithelial lining. Splanchnic mesoderm surrounding the foregut produces connective tissue, smooth muscle, cartilage, blood and lymphatic components, and the mesothelium of the pleura.",
    objective: "Separate endodermal epithelial derivatives from splanchnic-mesodermal lung derivatives.",
    excerpt: "Splanchnic mesoderm around the foregut forms lung connective tissue, endothelium, smooth muscle, vessels, cartilage, lymphatics, and pleural mesothelium.", tags: ["lung-mesenchyme", "splanchnic-mesoderm", "endoderm", "pleura"],
  },
  {
    slug: "tracheoesophageal-septum-partition", topic: "Respiratory system development", subtopic: "Foregut partitioning", chapter: "Respiratory system I", slide: 6, title: resp1, difficulty: 3, priority: "core",
    prompt: "Tracheoesophageal ridges fuse in the early foregut. What is the normal result of this event?",
    correct: "A tracheoesophageal septum separates a ventral laryngotracheal tube from a dorsal esophagus",
    wrong: [
      ["A pleuropericardial membrane separates the stomach from the duodenum", "Pleuropericardial membranes partition thoracic cavities, not the foregut into airway and esophagus."],
      ["The buccopharyngeal membrane separates the trachea from the pharynx", "The buccopharyngeal membrane is not the longitudinal foregut partition."],
      ["A dorsal mesentery separates the right and left main bronchi", "The dorsal mesentery suspends gut structures and does not create the trachea-esophagus division."],
    ],
    explanation: "Fusion of the tracheoesophageal ridges creates the tracheoesophageal septum. The septum partitions the foregut into a ventral laryngotracheal tube and a dorsal esophagus.",
    objective: "Explain the normal outcome of tracheoesophageal-ridge fusion.",
    excerpt: "Tracheoesophageal ridges form a septum that splits the foregut into esophagus and trachea with lung buds.", tags: ["tracheoesophageal-septum", "foregut", "esophagus", "trachea"],
  },
  {
    slug: "tef-common-pattern-image", kind: "image_single_best_answer", topic: "Respiratory system development", subtopic: "Tracheoesophageal anomalies", chapter: "Respiratory system I", slide: 7, title: resp1, difficulty: 3, priority: "core",
    prompt: "The diagram compares major tracheoesophageal malformations. Which configuration accounts for roughly 90% of affected cases?",
    correct: "A blind-ending proximal esophagus with a distal tracheoesophageal fistula",
    wrong: [
      ["An isolated H-type fistula with a continuous esophagus", "The H-type fistula is much less common than atresia with a distal fistula."],
      ["Pure esophageal atresia without any fistula", "Isolated atresia represents only a small minority of cases."],
      ["A blind-ending distal esophagus with only a proximal fistula", "A proximal-only fistula is rare and is not the approximately 90% pattern."],
    ],
    explanation: "The overwhelmingly common configuration is esophageal atresia with a fistulous connection between the distal esophageal segment and trachea. The proximal esophagus ends blindly.",
    objective: "Recognize the most common tracheoesophageal anomaly from a pattern diagram.",
    excerpt: "The slide compares five atresia/fistula patterns and identifies the distal-fistula pattern as the major approximately 90% form.", tags: ["image-recognition", "tracheoesophageal-fistula", "esophageal-atresia"],
    media: { id: "telegram-tef-patterns", path: "embryology/telegram/tracheoesophageal-fistula-patterns.jpg", alt: "Five diagrams showing patterns of esophageal atresia and tracheoesophageal fistula" },
  },
  {
    slug: "tef-vacterl-association", topic: "Respiratory system development", subtopic: "VACTERL association", chapter: "Respiratory system I", slide: 9, title: resp1, difficulty: 3, priority: "high",
    prompt: "A newborn has a tracheoesophageal fistula. Which additional finding pair is most consistent with the association emphasized in the lecture?",
    correct: "Vertebral anomaly and renal anomaly",
    wrong: [
      ["Cataract and sensorineural deafness", "These findings are not components of VACTERL."],
      ["Polydactyly and holoprosencephaly", "This pair does not define the VACTERL association discussed with TEF."],
      ["Pyloric stenosis and biliary atresia", "Neither finding is represented by the VACTERL acronym."],
    ],
    explanation: "VACTERL comprises vertebral anomalies, anal atresia, cardiac defects, tracheoesophageal fistula/esophageal atresia, renal anomalies, and limb defects.",
    objective: "Recognize associated anomalies represented by the VACTERL acronym.",
    excerpt: "TEF may occur in VACTERL: vertebral, anal, cardiac, tracheoesophageal/esophageal, renal, and limb anomalies.", tags: ["vacterl", "tef", "renal-anomaly", "vertebral-anomaly"],
  },
  {
    slug: "tef-newborn-clinical-cluster", topic: "Respiratory system development", subtopic: "Clinical presentation of TEF", chapter: "Respiratory system I", slide: 10, title: resp1, difficulty: 3, priority: "high",
    prompt: "Which presentation most strongly suggests esophageal atresia with a tracheoesophageal fistula during the first feeding?",
    correct: "Excessive salivation with choking and cyanosis, followed by regurgitation through the mouth or nostrils",
    wrong: [
      ["Projectile nonbilious vomiting several weeks after birth", "This is more typical of pyloric stenosis and does not match the immediate three-C feeding presentation."],
      ["Painless jaundice with pale stools", "This suggests obstructive hepatobiliary disease, not a foregut connection anomaly."],
      ["Delayed passage of meconium with abdominal distension only", "This points toward distal intestinal obstruction rather than the feeding-associated respiratory signs of TEF."],
    ],
    explanation: "The lecture highlights excessive salivation and the three Cs during feeding: coughing, choking, and cyanosis. Fluid may return through the mouth and nostrils, and aspiration pneumonia can follow.",
    objective: "Recognize the characteristic early feeding presentation of esophageal atresia with TEF.",
    excerpt: "Clinical features include excessive salivation, coughing/choking/cyanosis during feeding, regurgitation, and aspiration pneumonia.", tags: ["tef", "esophageal-atresia", "choking", "cyanosis"],
  },
  {
    slug: "fgf-branching-morphogenesis", topic: "Respiratory system development", subtopic: "Branching morphogenesis", chapter: "Respiratory system II", slide: 4, title: resp2, difficulty: 3, priority: "high",
    prompt: "Experimental blockade of a mesoderm-derived signal markedly reduces airway branching. Which signal family does the teacher identify as central to this epithelial-mesenchymal interaction?",
    correct: "Fibroblast growth factors",
    wrong: [
      ["Immunoglobulins", "Immunoglobulins are not morphogens directing airway branching."],
      ["Hemoglobins", "Hemoglobins transport gas and are not mesodermal branching signals."],
      ["Troponins", "Troponins regulate muscle contraction rather than epithelial branching morphogenesis."],
    ],
    explanation: "Lung branching depends on reciprocal epithelial-mesenchymal interactions. The lecture specifically identifies mesodermal fibroblast growth factor family signals as drivers of branching.",
    objective: "Identify the growth-factor family emphasized in pulmonary branching morphogenesis.",
    excerpt: "Signals for branching emitted from mesoderm include members of the fibroblast growth factor family.", tags: ["fgf", "branching-morphogenesis", "epithelial-mesenchymal-interaction"],
  },
  {
    slug: "lung-development-phase-order", topic: "Respiratory system development", subtopic: "Developmental phases", chapter: "Respiratory system II", slide: 6, title: resp2, difficulty: 2, priority: "core",
    prompt: "Which sequence correctly orders the major morphologic phases of lung development after the embryonic phase?",
    correct: "Pseudoglandular, canalicular, saccular, then alveolar",
    wrong: [
      ["Canalicular, pseudoglandular, alveolar, then saccular", "The pseudoglandular phase precedes canalicular, and saccular precedes alveolar."],
      ["Saccular, embryonic, pseudoglandular, then canalicular", "Saccular is a later fetal phase and does not precede embryonic development."],
      ["Alveolar, saccular, canalicular, then pseudoglandular", "This is essentially the reverse of the developmental sequence."],
    ],
    explanation: "The lecture's timeline proceeds from embryonic to pseudoglandular, canalicular, saccular, and alveolar development. Alveolar maturation continues after birth and through childhood.",
    objective: "Order the major phases of prenatal and early postnatal lung maturation.",
    excerpt: "The lung-development timeline lists pseudoglandular, canalicular, saccular, and alveolar phases, with postnatal continuation.", tags: ["lung-phases", "pseudoglandular", "canalicular", "saccular", "alveolar"],
  },
  {
    slug: "pseudoglandular-phase-features", topic: "Respiratory system development", subtopic: "Pseudoglandular phase", chapter: "Respiratory system II", slide: 6, title: resp2, difficulty: 3, priority: "core",
    prompt: "A fetal lung has extensive branching through conducting airways but lacks structures adequate for gas exchange. Which phase is most likely?",
    correct: "Pseudoglandular phase, approximately weeks 5-16",
    wrong: [
      ["Canalicular phase, approximately weeks 16-26", "The canalicular phase adds respiratory bronchioles and marked vascular development, moving toward gas exchange."],
      ["Saccular phase, mainly the sixth and seventh prenatal months", "Terminal sacs with thinning epithelium characterize the saccular phase."],
      ["Alveolar phase, beginning late in gestation and continuing after birth", "The alveolar phase contains maturing gas-exchange units rather than only conducting airways."],
    ],
    explanation: "During the pseudoglandular phase the bronchial tree resembles a gland and conducting airways branch extensively, but respiratory units capable of effective gas exchange have not yet formed.",
    objective: "Recognize the timing and functional limitation of the pseudoglandular lung.",
    excerpt: "The phase timeline places pseudoglandular development after early lung-bud branching and before the canalicular phase.", tags: ["pseudoglandular-phase", "conducting-airways", "weeks-5-16"],
  },
  {
    slug: "canalicular-phase-features", topic: "Respiratory system development", subtopic: "Canalicular phase", chapter: "Respiratory system II", slide: 7, title: resp2, difficulty: 3, priority: "core",
    prompt: "A lung sample from 20 weeks shows respiratory bronchioles lined mainly by cuboidal cells and a rapidly increasing capillary network. Which phase is this?",
    correct: "Canalicular phase",
    wrong: [
      ["Embryonic phase", "The embryonic phase establishes the early lung bud and major bronchi, not respiratory bronchioles at 20 weeks."],
      ["Pseudoglandular phase", "Pseudoglandular development lacks the more distal respiratory bronchioles and vascular proximity described."],
      ["Alveolar phase", "Alveolar development is later and features mature alveoli with very thin type I epithelium."],
    ],
    explanation: "The canalicular phase spans roughly weeks 16-26. Lumina enlarge, respiratory bronchioles appear, vascularity increases, and the epithelium is still substantially cuboidal.",
    objective: "Identify the canalicular phase from gestational age, airway morphology, and vascular development.",
    excerpt: "At 16-26 weeks, the canalicular-phase respiratory bronchiole is lined by cuboidal cells.", tags: ["canalicular-phase", "respiratory-bronchioles", "weeks-16-26"],
  },
  {
    slug: "saccular-phase-thinning", topic: "Respiratory system development", subtopic: "Saccular phase", chapter: "Respiratory system II", slide: 7, title: resp2, difficulty: 3, priority: "high",
    prompt: "During the sixth and seventh prenatal months, cuboidal cells lining terminal sacs become progressively thin. What is the key functional consequence?",
    correct: "The diffusion distance between air spaces and capillaries decreases",
    wrong: [
      ["The tracheoesophageal septum begins to form", "Foregut partition occurs much earlier than the saccular phase."],
      ["The conducting bronchi lose all cartilage", "Epithelial thinning in terminal sacs does not imply complete loss of bronchial cartilage."],
      ["Pulmonary vessels are excluded from the terminal sacs", "Capillaries approach the thin epithelium rather than being excluded."],
    ],
    explanation: "Saccular maturation thins the epithelial barrier and brings capillaries into close apposition with terminal sacs. This shortens the diffusion path needed for postnatal gas exchange.",
    objective: "Explain why epithelial thinning in the saccular phase improves gas-exchange readiness.",
    excerpt: "In the sixth and seventh prenatal months, cuboidal cells become very thin as terminal sacs mature.", tags: ["saccular-phase", "terminal-sacs", "diffusion-barrier"],
  },
  {
    slug: "type-two-surfactant-end-sixth-month", topic: "Respiratory system development", subtopic: "Surfactant production", chapter: "Respiratory system II", slide: 8, title: resp2, difficulty: 2, priority: "core",
    prompt: "Which cell-product pair becomes especially important by the end of the sixth month of lung development?",
    correct: "Type II alveolar epithelial cell - surfactant-rich phospholipid fluid",
    wrong: [
      ["Type I alveolar epithelial cell - cartilage matrix", "Type I cells form the thin gas-exchange lining and do not produce cartilage."],
      ["Bronchial smooth-muscle cell - pulmonary surfactant", "Surfactant is produced by type II alveolar epithelial cells, not airway smooth muscle."],
      ["Pleural mesothelial cell - fetal hemoglobin", "Pleural mesothelium neither produces fetal hemoglobin nor supplies alveolar surfactant."],
    ],
    explanation: "Type II alveolar epithelial cells begin secreting phospholipid-rich surfactant by the end of the sixth month. Surfactant lowers surface tension at the air-alveolar interface.",
    objective: "Match pulmonary surfactant with its fetal cellular source and approximate onset.",
    excerpt: "At the end of the sixth month, type II alveolar epithelial cells produce surfactant, a phospholipid-rich fluid.", tags: ["type-ii-pneumocyte", "surfactant", "sixth-month"],
  },
  {
    slug: "fetal-lung-fluid-composition", topic: "Respiratory system development", subtopic: "Fetal lung fluid", chapter: "Respiratory system II", slide: 8, title: resp2, difficulty: 3, priority: "standard",
    prompt: "Before birth, which description best matches the fluid filling the lungs?",
    correct: "High chloride, little protein, some bronchial mucus, and surfactant from type II alveolar cells",
    wrong: [
      ["High protein with no chloride and no epithelial secretions", "The lecture specifies high chloride and little protein plus mucus and surfactant."],
      ["Pure swallowed amniotic fluid with no pulmonary contribution", "Fetal lung fluid includes secretions from bronchial glands and alveolar type II cells."],
      ["Maternal plasma ultrafiltrate rich in immunoglobulin", "The stated fetal lung fluid is not described as an immunoglobulin-rich maternal ultrafiltrate."],
    ],
    explanation: "The prenatal lung is fluid-filled. The teacher slide characterizes that fluid as chloride-rich and protein-poor, with some mucus from bronchial glands and surfactant from type II alveolar epithelial cells.",
    objective: "Recall the principal components of fetal lung fluid before birth.",
    excerpt: "Before birth the lungs contain high-chloride, low-protein fluid plus bronchial mucus and type-II-cell surfactant.", tags: ["fetal-lung-fluid", "chloride", "mucus", "surfactant"],
  },
  {
    slug: "surfactant-last-two-weeks-function", topic: "Respiratory system development", subtopic: "Surfactant physiology", chapter: "Respiratory system II", slide: 9, title: resp2, difficulty: 3, priority: "core",
    prompt: "Surfactant rises especially during the final two weeks before birth. What immediate mechanical problem does adequate surfactant prevent?",
    correct: "Excess surface tension causing alveolar collapse during expiration",
    wrong: [
      ["Excess cartilage formation obstructing the trachea", "Surfactant acts at the air-liquid interface and does not control tracheal cartilage formation."],
      ["Failure of the diaphragm to separate from the liver", "Diaphragm formation is unrelated to surfactant's surface-tension effect."],
      ["Persistent communication between the trachea and esophagus", "A tracheoesophageal fistula results from foregut partitioning defects, not surfactant deficiency."],
    ],
    explanation: "Surfactant lowers surface tension at the air-liquid interface. Without it, the pressure needed to keep small alveoli open rises and alveoli tend to collapse during expiration.",
    objective: "Explain the mechanical role of surfactant in preventing neonatal alveolar collapse.",
    excerpt: "Surfactant increases particularly in the last two weeks before birth and prevents high surface tension and expiratory alveolar collapse.", tags: ["surfactant", "surface-tension", "alveolar-collapse", "prematurity"],
  },
  {
    slug: "rds-hyaline-membranes", topic: "Respiratory system development", subtopic: "Neonatal respiratory distress syndrome", chapter: "Respiratory system II", slide: 10, title: resp2, difficulty: 3, priority: "high",
    prompt: "A very premature infant dies with surfactant-deficiency respiratory distress syndrome. Which pathologic finding best matches the lecture?",
    correct: "Collapsed alveoli containing protein-rich fluid and numerous hyaline membranes",
    wrong: [
      ["Overexpanded alveoli lined by keratinized stratified squamous epithelium", "Surfactant deficiency produces collapse, not overexpansion or keratinization."],
      ["Bronchi completely replaced by hyaline cartilage", "Cartilage replacement is not the lesion of neonatal surfactant deficiency."],
      ["Pleural cavities filled only with clear transudate", "The defining lesion is within collapsed alveoli and includes protein-rich material and hyaline membranes."],
    ],
    explanation: "In neonatal RDS, insufficient surfactant leads to widespread alveolar collapse. Protein-rich material and cellular debris form characteristic hyaline membranes along the collapsed air spaces.",
    objective: "Link surfactant deficiency to the characteristic pulmonary pathology of neonatal RDS.",
    excerpt: "Collapsed alveoli in RDS contain high-protein fluid, many hyaline membranes, and lamellar bodies.", tags: ["respiratory-distress-syndrome", "hyaline-membranes", "prematurity"],
  },
  {
    slug: "antenatal-glucocorticoids", topic: "Respiratory system development", subtopic: "Preterm-labor treatment", chapter: "Respiratory system II", slide: 10, title: resp2, difficulty: 3, priority: "core",
    prompt: "A pregnant patient is at high risk of imminent preterm delivery. Why are antenatal glucocorticoids given?",
    correct: "To accelerate fetal type II alveolar-cell maturation and surfactant production",
    wrong: [
      ["To close a fetal tracheoesophageal fistula", "Glucocorticoids do not repair an anatomic foregut-separation defect."],
      ["To prevent all prenatal breathing movements", "Breathing movements support lung development and are not the treatment target."],
      ["To convert type I alveolar cells into bronchial cartilage", "Glucocorticoids promote pulmonary maturation and surfactant, not cartilage metaplasia."],
    ],
    explanation: "Antenatal glucocorticoids accelerate maturation of the fetal lung, especially type II alveolar epithelial cells and their surfactant production, reducing morbidity and mortality from neonatal RDS.",
    objective: "Explain the embryologic rationale for antenatal glucocorticoids in threatened preterm birth.",
    excerpt: "Maternal glucocorticoid treatment in premature labor stimulates surfactant production and reduces RDS mortality.", tags: ["glucocorticoids", "preterm-labor", "surfactant", "type-ii-pneumocyte"],
  },
  {
    slug: "congenital-lung-cyst-honeycomb", topic: "Respiratory system development", subtopic: "Congenital lung abnormalities", chapter: "Respiratory system II", slide: 11, title: resp2, difficulty: 3, priority: "standard",
    prompt: "A congenital lung lesion produces multiple cystic spaces and a honeycomb appearance on radiography. Which developmental abnormality is described?",
    correct: "Dilation of terminal or larger bronchi forming congenital lung cysts",
    wrong: [
      ["Failure of the buccopharyngeal membrane to rupture", "That defect affects the primitive mouth and does not cause honeycomb pulmonary cysts."],
      ["Persistence of the neurenteric canal", "A persistent neurenteric connection does not create dilated bronchial cysts."],
      ["Absence of the septum transversum", "This would disrupt diaphragm development rather than selectively dilating bronchi into cysts."],
    ],
    explanation: "The lecture describes congenital lung cysts as dilations of terminal or larger bronchi. Multiple dilated spaces can create a honeycomb appearance on imaging.",
    objective: "Connect the honeycomb radiographic pattern with the bronchial basis of congenital lung cysts.",
    excerpt: "Congenital lung cysts arise from dilation of terminal or larger bronchi and can produce a honeycomb radiographic appearance.", tags: ["congenital-lung-cyst", "bronchi", "honeycomb-lung"],
  },
  {
    slug: "fetal-breathing-movement-function", topic: "Respiratory system development", subtopic: "Fetal breathing movements", chapter: "Respiratory system II", slide: 13, title: resp2, difficulty: 2, priority: "high",
    prompt: "What is the principal developmental value of breathing movements that begin before birth?",
    correct: "They stimulate lung development and condition the respiratory muscles",
    wrong: [
      ["They provide the fetus's sole source of oxygen", "Placental exchange, not fetal air breathing, supplies oxygen before birth."],
      ["They empty all lung fluid into the amniotic cavity", "Most lung fluid is resorbed around birth; fetal movements do not simply empty it all prenatally."],
      ["They initiate separation of the trachea from the esophagus", "Foregut partitioning occurs much earlier and is not driven by fetal breathing movements."],
    ],
    explanation: "Fetal breathing movements do not provide prenatal gas exchange. They mechanically stimulate pulmonary growth and prepare the respiratory musculature for effective ventilation after birth.",
    objective: "State the developmental functions of fetal breathing movements.",
    excerpt: "Breathing movements begin before birth and stimulate lung development while conditioning respiratory muscles.", tags: ["fetal-breathing", "lung-growth", "respiratory-muscles"],
  },
  {
    slug: "lung-fluid-resorption-at-birth", topic: "Respiratory system development", subtopic: "Transition at birth", chapter: "Respiratory system II", slide: 13, title: resp2, difficulty: 3, priority: "core",
    prompt: "Which change normally accompanies the onset of respiration at birth?",
    correct: "Most lung fluid is rapidly absorbed into blood and lymphatic capillaries, leaving a thin surfactant coat on alveolar cells",
    wrong: [
      ["Lung fluid becomes trapped permanently inside the terminal sacs", "Normal transition requires rapid clearance rather than permanent retention."],
      ["All surfactant is washed out with the fetal lung fluid", "Surfactant remains as a thin phospholipid coating after fluid resorption."],
      ["Pulmonary capillaries regress because placental flow has stopped", "Pulmonary perfusion increases after birth; capillaries do not regress."],
    ],
    explanation: "With the onset of breathing, most fetal lung fluid is rapidly cleared through pulmonary blood and lymphatic capillaries. Surfactant remains on alveolar cell membranes as a stabilizing phospholipid film.",
    objective: "Describe lung-fluid clearance and surfactant retention during the neonatal transition.",
    excerpt: "At birth most lung fluid is resorbed by blood and lymph capillaries; surfactant remains as a thin phospholipid coat.", tags: ["birth-transition", "lung-fluid", "lymphatics", "surfactant"],
  },
  {
    slug: "newborn-alveolus-image", kind: "image_single_best_answer", topic: "Respiratory system development", subtopic: "Histologic lung maturation", chapter: "Respiratory system II", slide: 7, title: resp2, difficulty: 3, priority: "core",
    prompt: "This field shows very thin alveolar epithelium with capillaries closely protruding toward mature air spaces. Which developmental stage best matches the image?",
    correct: "Newborn/alveolar stage",
    wrong: [
      ["Early embryonic lung-bud stage", "The lung-bud stage lacks mature alveolar air spaces and their capillary interface."],
      ["Pseudoglandular stage", "Pseudoglandular lungs resemble branching glands and do not yet contain mature thin-walled alveoli."],
      ["Early canalicular stage", "Canalicular lungs are developing respiratory bronchioles and vascularity but do not yet show this mature thin alveolar-capillary arrangement."],
    ],
    explanation: "The teacher's maturation sequence identifies the newborn lung by thin squamous type I epithelial cells and capillaries closely applied to mature alveoli. This architecture minimizes the blood-air diffusion distance.",
    objective: "Recognize a mature neonatal alveolar-capillary interface in a developmental image.",
    excerpt: "At the newborn stage, thin type I alveolar epithelial cells and surrounding capillaries protrude into mature alveoli.", tags: ["image-recognition", "alveolar-stage", "type-i-pneumocyte", "capillaries"],
    media: { id: "telegram-maturing-alveolus", path: "embryology/telegram/maturing-alveolus-capillaries.jpg", alt: "Cropped teacher diagram showing thin alveolar walls and closely apposed capillaries" },
  },
];

const letters = ["A", "B", "C", "D"];

function makeQuestion(spec, index) {
  const correctIndex = index % 4;
  const options = [...spec.wrong];
  options.splice(correctIndex, 0, [spec.correct, null]);
  const formattedOptions = options.map(([text], optionIndex) => ({ id: letters[optionIndex], text }));
  const distractorExplanations = Object.fromEntries(
    options.flatMap(([, reason], optionIndex) => reason ? [[letters[optionIndex], reason]] : []),
  );
  const correctOptionId = letters[correctIndex];
  const question = {
    schemaVersion: "1.0.0",
    id: `embr-tg-${spec.slug}`,
    revision: 1,
    status: "verified",
    kind: spec.kind ?? "single_best_answer",
    subject: "embryology",
    topic: spec.topic,
    subtopic: spec.subtopic,
    chapter: spec.chapter,
    difficulty: spec.difficulty,
    prompt: spec.prompt,
    options: formattedOptions,
    correctOptionId,
    acceptedFreeText: [correctOptionId, spec.correct],
    explanation: spec.explanation,
    distractorExplanations,
    learningObjective: spec.objective,
    source: {
      title: spec.title,
      chapter: spec.chapter,
      lecture: spec.title.includes("respiratory") ? "Respiratory system embryology" : "Formation of the trilaminar embryo",
      slide: String(spec.slide),
      excerpt: spec.excerpt,
    },
    ...(spec.media ? { media: [{ ...spec.media, type: "image", attribution: `Teacher slide ${spec.slide}` }] } : {}),
    tags: ["embryology", "telegram-teacher-scope", ...spec.tags],
    examPriority: spec.priority,
    qualityFlags: ["teacher-slide-verified", "teacher-specific-gap", ...(spec.media ? ["crop-visually-reviewed"] : [])],
  };
  return question;
}

const questions = specs.map(makeQuestion);
writeFileSync(output, `${questions.map((question) => JSON.stringify(question)).join("\n")}\n`);

const answerCounts = Object.fromEntries(letters.map((letter) => [letter, questions.filter((question) => question.correctOptionId === letter).length]));
console.log(`Wrote ${questions.length} questions to ${output}`);
console.log(`Answer balance: ${JSON.stringify(answerCounts)}`);
