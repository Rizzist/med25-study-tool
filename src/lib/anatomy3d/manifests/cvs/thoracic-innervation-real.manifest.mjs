/**
 * THORACIC INNERVATION manifest — Module 4 of the CVS/Thorax region (`docs/anatomy3d/regions/thorax.md`).
 *
 * The 25 quizable structures are the thoracic nerves & autonomics: the somatic intercostal nerves and
 * their branches, the phrenic and vagus nerves with the recurrent laryngeal branches, the sympathetic
 * trunk with its ganglia and splanchnic nerves and rami communicantes, and the autonomic plexuses.
 * ALL 25 are PROCEDURAL (schematic) — BodyParts3D has no separable mesh for them, so they are drawn as
 * smooth TubeGeometry cords in `thoracic-innervation-real.ts`, routed relative to the real context.
 *
 * The 7 `context-*` structures (quizable:false) ARE real BodyParts3D segmented meshes, rendered faint
 * and low-prominence purely to give the floating nerves an anatomical reference frame: the thoracic
 * vertebral column, sternum, trachea, thoracic aorta, SVC, IVC and a heart silhouette. They map 1:1 to
 * named nodes in `/anatomy3d/cvs/thoracic-innervation.glb`.
 *
 *   Attribution (required, CC-BY 4.0):
 *   "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const thoracicInnervationManifest = {
  id: "thoracic-innervation",
  region: "cvs",
  modelKey: "thoracic-innervation",
  title: "Thoracic nerves & autonomics",
  subject: "anatomy",
  blurb:
    "The nerves of the thorax as a coherent system — the somatic intercostal nerves and their branches, the phrenic and vagus nerves with the recurrent laryngeal branches, the sympathetic trunk with its ganglia and splanchnic nerves, and the cardiac, pulmonary and oesophageal autonomic plexuses — drawn schematically and routed relative to a faint real thoracic skeleton, great vessels, heart silhouette and airway.",
  structures: [
    // ---- Somatic — intercostal nerves & branches (10) -------------------------------
    {
      id: "intercostal-nerve",
      schematic: true,
      label: "Intercostal nerve (T1–T11)",
      shortLabel: "Intercostal n.",
      aliases: ["anterior ramus of thoracic spinal nerve"],
      tissue: "nerve",
      description:
        "Anterior ramus of a thoracic spinal nerve running in the costal groove between the internal and innermost intercostal muscles, supplying the intercostal muscles, parietal pleura and overlying skin.",
      keyPoints: [
        "It is the N of the costal-groove VAN order (lowest of the three).",
        "For a block or aspiration, stay near the lower rib's upper border to spare the bundle.",
      ],
      difficulty: 1,
      distractorIds: ["subcostal-nerve", "lateral-cutaneous-branch", "anterior-cutaneous-branch"],
    },
    {
      id: "subcostal-nerve",
      schematic: true,
      label: "Subcostal nerve (T12)",
      shortLabel: "Subcostal n.",
      tissue: "nerve",
      description:
        "Anterior ramus of T12 running below the 12th rib — not within an intercostal space — and passing on into the anterior abdominal wall.",
      keyPoints: [
        "It is named subcostal because it lies below rib 12.",
        "It contributes to innervation of the anterior abdominal wall.",
      ],
      difficulty: 2,
      distractorIds: ["intercostal-nerve", "posterior-ramus", "lateral-cutaneous-branch"],
    },
    {
      id: "posterior-ramus",
      schematic: true,
      label: "Posterior ramus",
      shortLabel: "Dorsal ramus",
      aliases: ["dorsal ramus"],
      tissue: "nerve",
      description:
        "Branch given off as the spinal nerve emerges, turning backward to supply the intrinsic (deep) back muscles and the skin either side of the midline.",
      keyPoints: [
        "It is motor to the deep group of intrinsic back muscles.",
        "It does not enter the intercostal space.",
      ],
      difficulty: 2,
      distractorIds: ["intercostal-nerve", "collateral-branch", "lateral-cutaneous-branch"],
    },
    {
      id: "collateral-branch",
      schematic: true,
      label: "Collateral branch",
      shortLabel: "Collateral br.",
      tissue: "nerve",
      description:
        "Small branch of the intercostal nerve given near the rib angle, running forward along the upper border of the rib below.",
      keyPoints: [
        "It parallels the main nerve on the lower rib.",
        "It supplies intercostal muscle and parietal pleura.",
      ],
      difficulty: 3,
      distractorIds: ["lateral-cutaneous-branch", "anterior-cutaneous-branch", "intercostal-nerve"],
    },
    {
      id: "lateral-cutaneous-branch",
      schematic: true,
      label: "Lateral cutaneous branch",
      shortLabel: "Lateral cut. br.",
      tissue: "nerve",
      description:
        "Largest cutaneous branch of the intercostal nerve, piercing the wall in the mid-axillary line and dividing into anterior and posterior branches for the overlying skin.",
      keyPoints: [
        "It is the largest branch of the intercostal nerve.",
        "T1 has none; the T2 branch is the intercostobrachial nerve.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-cutaneous-branch", "collateral-branch", "intercostobrachial-nerve"],
    },
    {
      id: "anterior-cutaneous-branch",
      schematic: true,
      label: "Anterior cutaneous branch",
      shortLabel: "Anterior cut. br.",
      tissue: "nerve",
      description:
        "Terminal cutaneous branch emerging parasternally in the upper spaces (or on the anterior abdominal wall for T7–T12) to supply the midline skin.",
      keyPoints: [
        "Upper six are thoracic; T7–T12 are thoraco-abdominal and supply abdominal skin.",
        "They emerge lateral to the sternum and the linea alba.",
      ],
      difficulty: 2,
      distractorIds: ["lateral-cutaneous-branch", "collateral-branch", "intercostal-nerve"],
    },
    {
      id: "intercostobrachial-nerve",
      schematic: true,
      label: "Intercostobrachial nerve",
      shortLabel: "Intercostobrachial n.",
      tissue: "nerve",
      description:
        "Lateral cutaneous branch of T2 (sometimes T3) that joins the medial cutaneous nerve of the arm to supply the axilla and medial upper arm.",
      keyPoints: [
        "It explains axillary and medial-arm referral and post-mastectomy numbness.",
        "It communicates with the brachial plexus.",
      ],
      difficulty: 3,
      distractorIds: ["lateral-cutaneous-branch", "intercostal-nerve", "anterior-cutaneous-branch"],
    },
    {
      id: "dermatomes",
      schematic: true,
      label: "Thoracic dermatomes",
      shortLabel: "Dermatomes",
      aliases: ["thoracic sensory levels"],
      tissue: "nerve",
      description:
        "The segmental skin fields of the thoracic anterior rami, shown here as schematic landmark-level bands — T2 at the sternal angle/clavicle line, T4 nipple, T6 xiphoid and T10 umbilicus.",
      keyPoints: [
        "Classic landmark levels are T4 (nipple) and T10 (umbilicus).",
        "Overlap of adjacent dermatomes makes single-level loss subtle.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-cutaneous-branch", "lateral-cutaneous-branch", "intercostal-nerve"],
    },
    {
      id: "white-ramus-communicans",
      schematic: true,
      label: "White ramus communicans",
      shortLabel: "White ramus",
      tissue: "nerve",
      description:
        "Myelinated preganglionic sympathetic connection from a T1–L2 anterior ramus to the sympathetic trunk.",
      keyPoints: [
        "It is present only at T1–L2, the lateral-horn levels.",
        "It carries preganglionic (myelinated) fibres.",
      ],
      difficulty: 2,
      distractorIds: ["gray-ramus-communicans", "sympathetic-trunk", "greater-splanchnic-nerve"],
    },
    {
      id: "gray-ramus-communicans",
      schematic: true,
      label: "Gray ramus communicans",
      shortLabel: "Gray ramus",
      tissue: "nerve",
      description:
        "Unmyelinated postganglionic sympathetic connection from the trunk back to a spinal nerve for distribution to the body wall.",
      keyPoints: [
        "It is present at every spinal level.",
        "It carries postganglionic (unmyelinated) fibres.",
      ],
      difficulty: 2,
      distractorIds: ["white-ramus-communicans", "sympathetic-trunk", "intercostal-nerve"],
    },
    // ---- Phrenic & vagus (4) --------------------------------------------------------
    {
      id: "right-phrenic-nerve",
      schematic: true,
      label: "Right phrenic nerve",
      shortLabel: "Right phrenic n.",
      tissue: "nerve",
      description:
        "C3–C5 nerve descending lateral to the right brachiocephalic vein, SVC and right atrium (anterior to the lung root) to the diaphragm, passing through the caval opening.",
      keyPoints: [
        "It is motor to its own hemidiaphragm and sensory to the fibrous/parietal pericardium and pleura.",
        "It passes through the caval opening at T8.",
      ],
      difficulty: 2,
      distractorIds: ["left-phrenic-nerve", "right-vagus-nerve", "left-vagus-nerve"],
    },
    {
      id: "left-phrenic-nerve",
      schematic: true,
      label: "Left phrenic nerve",
      shortLabel: "Left phrenic n.",
      tissue: "nerve",
      description:
        "C3–C5 nerve descending over the aortic arch, lateral to the left vagus, anterior to the lung root and over the pericardium (lateral to the left ventricle) to pierce the diaphragm near the apex of the heart.",
      keyPoints: [
        "It lies lateral to the vagus on the arch.",
        "It pierces the diaphragm near the cardiac apex, not through the caval opening.",
      ],
      difficulty: 2,
      distractorIds: ["right-phrenic-nerve", "left-vagus-nerve", "right-vagus-nerve"],
    },
    {
      id: "right-vagus-nerve",
      schematic: true,
      label: "Right vagus nerve",
      shortLabel: "Right vagus (CN X)",
      aliases: ["CN X (right)"],
      tissue: "nerve",
      description:
        "Enters the thorax in front of the right subclavian artery, runs on the right of the trachea behind the SVC, gives off the right recurrent laryngeal nerve, then forms the posterior oesophageal plexus and posterior gastric nerve.",
      keyPoints: [
        "Its recurrent laryngeal branch loops under the right subclavian artery.",
        "It contributes to the pulmonary, cardiac and oesophageal plexuses.",
      ],
      difficulty: 2,
      distractorIds: ["left-vagus-nerve", "right-phrenic-nerve", "right-recurrent-laryngeal-nerve"],
    },
    {
      id: "left-vagus-nerve",
      schematic: true,
      label: "Left vagus nerve",
      shortLabel: "Left vagus (CN X)",
      aliases: ["CN X (left)"],
      tissue: "nerve",
      description:
        "Descends between the left common carotid and subclavian arteries, crosses the aortic arch (giving the left recurrent laryngeal nerve), passes behind the lung root and forms the anterior oesophageal plexus and anterior gastric nerve.",
      keyPoints: [
        "It gives off the left recurrent laryngeal nerve at the arch.",
        "It is parasympathetic to the thoracic and upper abdominal viscera.",
      ],
      difficulty: 2,
      distractorIds: ["right-vagus-nerve", "left-phrenic-nerve", "left-recurrent-laryngeal-nerve"],
    },
    // ---- Recurrent laryngeal nerves (2) ---------------------------------------------
    {
      id: "left-recurrent-laryngeal-nerve",
      schematic: true,
      label: "Left recurrent laryngeal nerve",
      shortLabel: "Left RLN",
      aliases: ["left RLN"],
      tissue: "nerve",
      description:
        "Branch of the left vagus hooking under the aortic arch just lateral to the ligamentum arteriosum, then ascending in the tracheo-oesophageal groove to the larynx.",
      keyPoints: [
        "It is a content of the superior mediastinum and is longer than the right.",
        "Compression in the aortopulmonary window (nodes, LA enlargement, aneurysm) causes hoarseness.",
      ],
      difficulty: 2,
      distractorIds: ["right-recurrent-laryngeal-nerve", "left-vagus-nerve", "right-vagus-nerve"],
    },
    {
      id: "right-recurrent-laryngeal-nerve",
      schematic: true,
      label: "Right recurrent laryngeal nerve",
      shortLabel: "Right RLN",
      aliases: ["right RLN"],
      tissue: "nerve",
      description:
        "Branch of the right vagus hooking under the right subclavian artery and ascending to the larynx; it barely enters the thorax.",
      keyPoints: [
        "It loops at the root of the neck, not in the mediastinum, unlike the left.",
        "Its course is shorter than the left.",
      ],
      difficulty: 2,
      distractorIds: ["left-recurrent-laryngeal-nerve", "right-vagus-nerve", "left-vagus-nerve"],
    },
    // ---- Sympathetic trunk & splanchnic nerves (5) ----------------------------------
    {
      id: "sympathetic-trunk",
      schematic: true,
      label: "Thoracic sympathetic trunk & ganglia",
      shortLabel: "Sympathetic trunk",
      aliases: ["paravertebral chain", "sympathetic chain"],
      tissue: "nerve",
      description:
        "Paired ganglionated chains on the heads of the ribs (upper) and the vertebral bodies (lower), with about 11–12 ganglia joined by interganglionic fibres, continuous above and below with the cervical and lumbar trunks.",
      keyPoints: [
        "Upper ganglia lie on the rib heads; lower ganglia lie on the vertebral bodies.",
        "The upper five give cardiac/pulmonary/oesophageal branches; the lower seven give the splanchnic nerves.",
      ],
      difficulty: 2,
      distractorIds: ["cervicothoracic-ganglion", "greater-splanchnic-nerve", "white-ramus-communicans"],
    },
    {
      id: "cervicothoracic-ganglion",
      schematic: true,
      label: "Cervicothoracic (stellate) ganglion",
      shortLabel: "Stellate ganglion",
      aliases: ["stellate ganglion"],
      tissue: "nerve",
      description:
        "Fusion of the inferior cervical and first thoracic sympathetic ganglia at the neck of the first rib.",
      keyPoints: [
        "This common fusion supplies head, neck and upper-limb sympathetics.",
        "It lies on the neck of rib 1.",
      ],
      difficulty: 3,
      distractorIds: ["sympathetic-trunk", "greater-splanchnic-nerve", "lesser-splanchnic-nerve"],
    },
    {
      id: "greater-splanchnic-nerve",
      schematic: true,
      label: "Greater splanchnic nerve",
      shortLabel: "Greater splanchnic n.",
      tissue: "nerve",
      description:
        "Preganglionic sympathetic nerve from the T5–T9 ganglia, descending medially to pierce the crus of the diaphragm and synapse in the coeliac ganglion.",
      keyPoints: [
        "It is preganglionic (myelinated) to the coeliac ganglion.",
        "It arises from the T5–T9 sympathetic ganglia.",
      ],
      difficulty: 2,
      distractorIds: ["lesser-splanchnic-nerve", "least-splanchnic-nerve", "sympathetic-trunk"],
    },
    {
      id: "lesser-splanchnic-nerve",
      schematic: true,
      label: "Lesser splanchnic nerve",
      shortLabel: "Lesser splanchnic n.",
      tissue: "nerve",
      description:
        "Preganglionic sympathetic nerve from the T9–T11 ganglia running to the aorticorenal ganglion.",
      keyPoints: [
        "It synapses in the aorticorenal ganglion.",
        "It arises at T9–T11, lateral to the greater splanchnic nerve.",
      ],
      difficulty: 3,
      distractorIds: ["greater-splanchnic-nerve", "least-splanchnic-nerve", "sympathetic-trunk"],
    },
    {
      id: "least-splanchnic-nerve",
      schematic: true,
      label: "Least (lowest) splanchnic nerve",
      shortLabel: "Least splanchnic n.",
      tissue: "nerve",
      description:
        "Preganglionic sympathetic nerve from the T12 (lowest) ganglion, piercing the crus to reach the renal plexus/ganglion.",
      keyPoints: [
        "It is the lowest and most lateral splanchnic nerve.",
        "It joins the renal plexus.",
      ],
      difficulty: 3,
      distractorIds: ["lesser-splanchnic-nerve", "greater-splanchnic-nerve", "sympathetic-trunk"],
    },
    // ---- Autonomic plexuses (4) -----------------------------------------------------
    {
      id: "superficial-cardiac-plexus",
      schematic: true,
      label: "Superficial cardiac plexus",
      shortLabel: "Superficial cardiac plx.",
      tissue: "nerve",
      description:
        "Small plexus below the aortic arch, to the right of the ligamentum arteriosum, formed by the left sympathetic cardiac branch and the left vagal (inferior cervical) cardiac branch.",
      keyPoints: [
        "It lies at the inferior border of the arch, right of the ligamentum arteriosum.",
        "Sympathetic fibres raise rate and force; parasympathetic fibres lower them.",
      ],
      difficulty: 3,
      distractorIds: ["deep-cardiac-plexus", "pulmonary-plexus", "oesophageal-plexus"],
    },
    {
      id: "deep-cardiac-plexus",
      schematic: true,
      label: "Deep cardiac plexus",
      shortLabel: "Deep cardiac plx.",
      tissue: "nerve",
      description:
        "Larger plexus anterior to the tracheal bifurcation and behind the aortic arch, formed by both sympathetic trunks and both vagi (except the superficial contributors).",
      keyPoints: [
        "It sits in front of the carina, behind the arch.",
        "Cardiac ischaemic pain refers via T1–T5 sympathetic afferents to the left chest and arm.",
      ],
      difficulty: 3,
      distractorIds: ["superficial-cardiac-plexus", "pulmonary-plexus", "oesophageal-plexus"],
    },
    {
      id: "pulmonary-plexus",
      schematic: true,
      label: "Pulmonary plexus",
      shortLabel: "Pulmonary plx.",
      tissue: "nerve",
      description:
        "Anterior and (larger) posterior plexuses at each lung root, formed from the vagus and the sympathetic trunk.",
      keyPoints: [
        "Vagal fibres cause bronchoconstriction and secretion; sympathetic fibres cause bronchodilation.",
        "It is located at the hila, mostly posteriorly.",
      ],
      difficulty: 3,
      distractorIds: ["oesophageal-plexus", "deep-cardiac-plexus", "superficial-cardiac-plexus"],
    },
    {
      id: "oesophageal-plexus",
      schematic: true,
      label: "Oesophageal plexus",
      shortLabel: "Oesophageal plx.",
      aliases: ["esophageal plexus"],
      tissue: "nerve",
      description:
        "Network on the lower oesophagus formed by both vagi (after the pulmonary plexuses) and sympathetic fibres, reforming as the anterior (left) and posterior (right) vagal trunks.",
      keyPoints: [
        "The left vagus becomes the anterior trunk; the right vagus becomes the posterior trunk.",
        "The trunks pass the oesophageal hiatus at T10.",
      ],
      difficulty: 3,
      distractorIds: ["pulmonary-plexus", "deep-cardiac-plexus", "left-vagus-nerve"],
    },
    // ---- FAINT REAL CONTEXT (7) — scene-only reference meshes, quizable:false --------
    // Real BodyParts3D meshes rendered low-prominence so the schematic nerves have an anatomical
    // frame. NOT part of the quiz; authored here (they are not rows in docs/anatomy3d thorax.md).
    {
      id: "context-vertebral-column",
      quizable: false,
      label: "Thoracic vertebral column",
      shortLabel: "T-spine",
      tissue: "bone",
      description:
        "Faint reference: the twelve thoracic vertebrae (T1–T12). The sympathetic trunk runs on the rib heads and vertebral bodies, and the splanchnic nerves descend across them.",
      difficulty: 1,
    },
    {
      id: "context-sternum",
      quizable: false,
      label: "Sternum",
      shortLabel: "Sternum",
      tissue: "bone",
      description:
        "Faint reference: the manubrium, body and xiphoid process. The intercostal nerves' anterior cutaneous branches emerge just lateral to it.",
      difficulty: 1,
    },
    {
      id: "context-trachea",
      quizable: false,
      label: "Trachea",
      shortLabel: "Trachea",
      tissue: "cartilage",
      description:
        "Faint reference: the airway. The vagi run beside it, the recurrent laryngeal nerves ascend in the tracheo-oesophageal groove, and the deep cardiac plexus lies in front of its bifurcation.",
      difficulty: 1,
    },
    {
      id: "context-aorta",
      quizable: false,
      label: "Thoracic aorta",
      shortLabel: "Aorta",
      tissue: "artery",
      description:
        "Faint reference: the ascending aorta, arch and descending thoracic aorta. The left recurrent laryngeal nerve hooks under the arch and the left vagus and phrenic cross it.",
      difficulty: 1,
    },
    {
      id: "context-svc",
      quizable: false,
      label: "Superior vena cava",
      shortLabel: "SVC",
      tissue: "vein",
      description:
        "Faint reference: the great vein of the upper mediastinum. The right phrenic nerve descends along its lateral surface and the right vagus passes behind it.",
      difficulty: 1,
    },
    {
      id: "context-ivc",
      quizable: false,
      label: "Inferior vena cava",
      shortLabel: "IVC",
      tissue: "vein",
      description:
        "Faint reference: the vein passing through the caval opening (T8), which the right phrenic nerve also traverses.",
      difficulty: 1,
    },
    {
      id: "context-heart",
      quizable: false,
      label: "Heart",
      shortLabel: "Heart",
      tissue: "muscle",
      description:
        "Faint reference: a heart silhouette (the four chambers). The phrenic nerves descend over its pericardium and the cardiac plexuses supply it.",
      difficulty: 1,
    },
  ],
};
