/**
 * REAL (mesh-backed) + procedural THORACIC-WALL manifest — module 1 of the CVS/Thorax region.
 *
 * The 22 REAL structures map 1:1 to named nodes in `/anatomy3d/cvs/thoracic-wall.glb`, built from
 * BodyParts3D element meshes (Wavefront OBJ, 99% polygon-reduction release): the thoracic vertebrae
 * (T1 / typical T2-T8 / atypical T9-T12), the ribs (1st, 2nd, typical, floating), the sternum
 * (manubrium / body / xiphoid), the intercostal (external/internal/innermost), transversus thoracis,
 * serratus posterior (superior/inferior), serratus anterior, pectoralis major/minor and subclavius
 * muscles, the diaphragm, and the internal thoracic artery. Compound bones (all typical ribs -> one
 * node, T2-T8 -> one node, etc.) are grouped per structureId. The single-side BodyParts3D muscle
 * meshes give a natural layered-dissection look (intercostals on one side, transversus/pectoral/
 * serratus on the other).
 *
 * The 22 SCHEMATIC (procedural) structures — costal cartilages/margin, the sternal angle & jugular
 * notch (features of the sternum, not separable BodyParts3D meshes), the two thoracic apertures,
 * the suprapleural membrane & endothoracic fascia, the costovertebral / costotransverse / sterno-
 * costal / sternoclavicular joints, intervertebral discs, the radiate ligament, the subcostal muscles
 * & levatores costarum (no separable BodyParts3D mesh), and the wall neurovascular vessels
 * (internal thoracic vein, anterior/posterior intercostal arteries & veins, musculophrenic & superior
 * epigastric arteries) — have no dedicated BodyParts3D mesh and are drawn procedurally in the factory
 * (userData.schematic = true), placed relative to the real-mesh bounding boxes.
 *
 * Note: thorax.md optimistically marks the jugular notch and subcostal muscles as real meshes, but
 * BodyParts3D has no separable element for either at this release, so both are rendered schematically.
 *
 *   Attribution (required, CC-BY 4.0):
 *   "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const thoracicWallManifest = {
  id: "thoracic-wall",
  region: "cvs",
  modelKey: "thoracic-wall",
  title: "Thoracic wall & diaphragm",
  subject: "anatomy",
  blurb:
    "Anatomically-accurate human thoracic cage from BodyParts3D segmented meshes — the thoracic vertebrae, ribs and sternum with the intercostal, transversus thoracis, serratus, pectoral and subclavius muscles and the diaphragm — layered with schematic costal cartilages, thoracic apertures, costovertebral/costotransverse/sternocostal joints and the intercostal neurovascular vessels in true anatomical relationship.",
  structures: [
    {
      id: "typical-thoracic-vertebra",
      label: "Typical thoracic vertebra (T2–T8)",
      tissue: "bone",
      aliases: ["typical vertebra", "T5"],
      description:
        "Heart-shaped body carrying superior and inferior costal demifacets, a transverse costal facet, and a long spinous process that slopes sharply downward and overlaps the vertebra below.",
      keyPoints: [
        "Superior + inferior demifacets take the head of the same-numbered rib and the rib above.",
        "Flat facets permit rotation in the thoracic region.",
      ],
      difficulty: 1,
      distractorIds: ["first-thoracic-vertebra", "atypical-thoracic-vertebrae", "intervertebral-disc"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.5 },
    },
    {
      id: "first-thoracic-vertebra",
      label: "First thoracic vertebra (T1)",
      tissue: "bone",
      aliases: ["atypical vertebra", "T1"],
      description:
        "Atypical vertebra with a complete superior costal facet for the whole head of rib 1 plus an inferior demifacet for rib 2; body is cervical-type and the spinous process is long and near-horizontal.",
      keyPoints: [
        "Complete (not demi) facet for rib 1 is the identifying feature.",
        "Spinous process is a back landmark with C7.",
      ],
      difficulty: 2,
      distractorIds: ["typical-thoracic-vertebra", "atypical-thoracic-vertebrae", "first-rib"],
      view: { azimuth: 3.14159, elevation: 0.25, zoom: 1.7 },
    },
    {
      id: "atypical-thoracic-vertebrae",
      label: "Atypical thoracic vertebrae (T9–T12)",
      tissue: "bone",
      aliases: ["T9, T10, T11, T12"],
      description:
        "Transition vertebrae: T9 has a superior demifacet only; T10–T12 each carry a single complete costal facet, and T11–T12 lack transverse costal facets (their transverse processes are stubby).",
      keyPoints: [
        "Single complete facets and loss of transverse facets mark the thoraco-lumbar transition.",
        "T12 changes from rotational to non-rotational function.",
      ],
      difficulty: 2,
      distractorIds: ["typical-thoracic-vertebra", "first-thoracic-vertebra", "floating-ribs"],
      view: { azimuth: 3.14159, elevation: -0.1, zoom: 1.5 },
    },
    {
      id: "typical-rib",
      label: "Typical rib (3rd–9th)",
      tissue: "bone",
      aliases: ["costa"],
      description:
        "Curved bone with a head (two demifacets + crest), neck, tubercle (articular + non-articular facet), angle, and a shaft whose inner-inferior costal groove shelters the neurovascular bundle.",
      keyPoints: [
        "The costal groove carries the intercostal vein→artery→nerve; the angle is the commonest fracture site.",
        "Head articulates with same-numbered + suprajacent vertebral bodies.",
      ],
      difficulty: 1,
      distractorIds: ["first-rib", "second-rib", "floating-ribs"],
      view: { azimuth: 1.3, elevation: 0.05, zoom: 1 },
    },
    {
      id: "first-rib",
      label: "First rib",
      tissue: "bone",
      aliases: ["rib 1"],
      description:
        "Shortest, broadest, most sharply curved rib, with superior/inferior surfaces; the scalene tubercle separates a groove for the subclavian vein (anterior) from a groove for the subclavian artery (posterior).",
      keyPoints: [
        "Vein anterior, artery + lower trunk of brachial plexus posterior to the scalene tubercle.",
        "A cervical rib can compress the subclavian artery here.",
      ],
      difficulty: 2,
      distractorIds: ["second-rib", "typical-rib", "floating-ribs"],
      view: { azimuth: 0.6, elevation: 0.5, zoom: 1.6 },
    },
    {
      id: "second-rib",
      label: "Second rib",
      tissue: "bone",
      aliases: ["rib 2"],
      description:
        "Roughly twice the length of the first rib with similar curvature; thin, with a roughened tuberosity for serratus anterior — its shaft surfaces make it \"atypical\".",
      keyPoints: [
        "Its cartilage meets the sternum at the sternal angle (rib-2 counting landmark).",
        "Articulates across the T1–T2 bodies.",
      ],
      difficulty: 2,
      distractorIds: ["first-rib", "typical-rib", "manubrium"],
      view: { azimuth: 0.7, elevation: 0.4, zoom: 1.5 },
    },
    {
      id: "floating-ribs",
      label: "Floating ribs (11th & 12th)",
      tissue: "bone",
      aliases: ["free ribs", "vertebral ribs"],
      description:
        "Short ribs with a single articular facet, no tubercle and no costal groove, ending in free cartilage-tipped anterior ends that never reach the sternum or costal margin.",
      keyPoints: [
        "Articulate only with their own-numbered vertebral body.",
        "Lack tubercle → no costotransverse joint.",
      ],
      difficulty: 2,
      distractorIds: ["first-rib", "typical-rib", "second-rib"],
      view: { azimuth: 2.4, elevation: -0.1, zoom: 1.4 },
    },
    {
      id: "costal-cartilages",
      schematic: true,
      label: "Costal cartilages",
      tissue: "cartilage",
      aliases: ["costochondral cartilage"],
      description:
        "Hyaline cartilage bars continuing the anterior rib ends: 1–7 reach the sternum (true), 8–10 join the cartilage above (false), 11–12 end free (floating).",
      keyPoints: [
        "True vs false vs floating classification.",
        "Ossify/calcify after ~55 yr, casting an X-ray shadow.",
      ],
      difficulty: 1,
      distractorIds: ["costal-margin", "intervertebral-disc", "xiphoid-process"],
      view: { azimuth: 0.2, elevation: 0.1, zoom: 1.15 },
    },
    {
      id: "costal-margin",
      schematic: true,
      label: "Costal margin",
      tissue: "cartilage",
      aliases: ["costal arch"],
      description:
        "The palpable inferior border formed by the fused 7th–10th costal cartilages, framing the inferior thoracic aperture; its lowest point is rib 10.",
      keyPoints: [
        "Lowest point lies ~L2–L3, only 4–6 cm above the iliac crest.",
        "Meeting of the two margins = infrasternal angle.",
      ],
      difficulty: 1,
      distractorIds: ["costal-cartilages", "inferior-thoracic-aperture", "xiphoid-process"],
      view: { azimuth: 0.2, elevation: -0.35, zoom: 1.2 },
    },
    {
      id: "manubrium",
      label: "Manubrium of sternum",
      tissue: "bone",
      aliases: ["manubrium sterni"],
      description:
        "Upper, roughly square part of the sternum bearing the jugular notch, the clavicular notches, and a facet for the 1st plus a demifacet for the 2nd costal cartilage.",
      keyPoints: [
        "Superior border (jugular notch) lies at ~T2.",
        "Angles backward on the body to raise the sternal angle.",
      ],
      difficulty: 1,
      distractorIds: ["sternal-body", "xiphoid-process", "sternal-angle"],
      view: { azimuth: 0, elevation: 0.2, zoom: 1.6 },
    },
    {
      id: "sternal-body",
      label: "Body of sternum",
      tissue: "bone",
      aliases: ["gladiolus", "mesosternum"],
      description:
        "Middle sternal part with lateral facets for the 2nd–7th costal cartilages and three transverse ridges marking fusion of four sternebrae.",
      keyPoints: [
        "Spans roughly T5–T9.",
        "Subcutaneous — a site for sternal marrow puncture.",
      ],
      difficulty: 1,
      distractorIds: ["manubrium", "xiphoid-process", "sternal-angle"],
      view: { azimuth: 0, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "xiphoid-process",
      label: "Xiphoid process",
      tissue: "bone",
      aliases: ["xiphisternum"],
      description:
        "Smallest, variably shaped inferior sternal part, cartilaginous in youth and ossifying in the adult; lies at ~T9.",
      keyPoints: [
        "Xiphisternal joint marks the inferior limit of the thoracic cavity anteriorly.",
        "Variable seventh-cartilage demifacet.",
      ],
      difficulty: 1,
      distractorIds: ["manubrium", "sternal-body", "costal-margin"],
      view: { azimuth: 0, elevation: -0.15, zoom: 1.9 },
    },
    {
      id: "sternal-angle",
      schematic: true,
      label: "Sternal angle (of Louis)",
      tissue: "cartilage",
      aliases: ["angle of Louis", "manubriosternal joint"],
      description:
        "Palpable symphysis where the manubrium meets the body; lies at the 2nd costal cartilage and the T4/T5 intervertebral disc.",
      keyPoints: [
        "The key rib-counting landmark.",
        "Its transverse plane divides superior from inferior mediastinum.",
      ],
      difficulty: 1,
      distractorIds: ["jugular-notch", "xiphoid-process", "manubrium"],
      view: { azimuth: 0, elevation: 0.15, zoom: 1.8 },
    },
    {
      id: "jugular-notch",
      schematic: true,
      label: "Jugular (suprasternal) notch",
      tissue: "bone",
      aliases: ["suprasternal notch"],
      description:
        "Concave midline superior border of the manubrium between the two clavicular notches; lies at ~T2.",
      keyPoints: [
        "Palpable surface landmark.",
        "Left brachiocephalic vein may rise above it in children (tracheostomy caution).",
      ],
      difficulty: 1,
      distractorIds: ["sternal-angle", "xiphoid-process", "manubrium"],
      view: { azimuth: 0, elevation: 0.4, zoom: 1.9 },
    },
    {
      id: "superior-thoracic-aperture",
      schematic: true,
      label: "Superior thoracic aperture (inlet)",
      tissue: "cavity",
      aliases: ["thoracic inlet"],
      description:
        "Kidney-shaped opening bounded by the T1 body, the first ribs and the superior manubrial border, ~5 cm AP × ~10 cm transverse, sloping downward and forward.",
      keyPoints: [
        "The downward slope carries the lung apex up into the neck.",
        "Roofed by the suprapleural membrane.",
      ],
      difficulty: 2,
      distractorIds: ["inferior-thoracic-aperture", "suprapleural-membrane", "costal-margin"],
      view: { azimuth: 0.4, elevation: 0.7, zoom: 1.35 },
    },
    {
      id: "inferior-thoracic-aperture",
      schematic: true,
      label: "Inferior thoracic aperture (outlet)",
      tissue: "cavity",
      aliases: ["thoracic outlet"],
      description:
        "Larger, expandable opening bounded by T12, rib 12, the distal 11th ribs, the costal margins and the xiphoid, closed by the diaphragm.",
      keyPoints: [
        "Closed by the diaphragm; its posterior margin sits below the anterior margin.",
        "All abdomino-thoracic structures pass through or behind the diaphragm here.",
      ],
      difficulty: 2,
      distractorIds: ["superior-thoracic-aperture", "diaphragm", "costal-margin"],
      view: { azimuth: 0.3, elevation: -0.55, zoom: 1.15 },
    },
    {
      id: "suprapleural-membrane",
      schematic: true,
      label: "Suprapleural membrane",
      tissue: "membrane",
      aliases: ["Sibson's fascia"],
      description:
        "Fibrous sheet slung from the C7 transverse process to the inner border of the first rib, roofing the cervical pleural dome and lung apex.",
      keyPoints: [
        "Protects the lung apex at the root of the neck.",
        "Resists pressure changes over the apex during respiration.",
      ],
      difficulty: 3,
      distractorIds: ["superior-thoracic-aperture", "endothoracic-fascia", "innermost-intercostal-muscles"],
      view: { azimuth: 0.5, elevation: 0.6, zoom: 1.6 },
    },
    {
      id: "endothoracic-fascia",
      schematic: true,
      label: "Endothoracic fascia",
      tissue: "membrane",
      description:
        "Thin connective-tissue layer lining the inner surface of the thoracic cage between the innermost intercostals and the parietal pleura.",
      keyPoints: [
        "A natural surgical cleavage plane.",
        "Thickens superiorly as the suprapleural membrane.",
      ],
      difficulty: 3,
      distractorIds: ["suprapleural-membrane", "internal-thoracic-artery", "innermost-intercostal-muscles"],
      view: { azimuth: 0.3, elevation: 0.1, zoom: 1.05 },
    },
    {
      id: "intervertebral-disc",
      schematic: true,
      label: "Intervertebral disc",
      tissue: "cartilage",
      aliases: ["anulus fibrosus", "nucleus pulposus"],
      description:
        "Fibrocartilaginous symphysis between vertebral bodies, an outer lamellar anulus fibrosus around a gelatinous nucleus pulposus.",
      keyPoints: [
        "The thinner posterolateral anulus is the usual herniation site → nerve-root compression.",
        "Absorbs water at rest, thins with activity.",
      ],
      difficulty: 2,
      distractorIds: ["costovertebral-joint", "sternocostal-joints", "costal-cartilages"],
      view: { azimuth: 3.6, elevation: 0, zoom: 1.7 },
    },
    {
      id: "costovertebral-joint",
      schematic: true,
      label: "Costovertebral joint (of the head)",
      tissue: "cartilage",
      aliases: ["joint of head of rib"],
      description:
        "Synovial joint of the rib head, whose two demifacets meet the same-numbered and suprajacent vertebral bodies and the interposed disc; split into two cavities by an intra-articular ligament.",
      keyPoints: [
        "Reinforced externally by the radiate ligament.",
        "Head of a typical rib spans two vertebrae.",
      ],
      difficulty: 2,
      distractorIds: ["costotransverse-joint", "sternocostal-joints", "sternoclavicular-joint"],
      view: { azimuth: 3.9, elevation: 0.05, zoom: 1.7 },
    },
    {
      id: "costotransverse-joint",
      schematic: true,
      label: "Costotransverse joint",
      tissue: "cartilage",
      description:
        "Synovial joint between the articular facet of the rib tubercle and the transverse-process facet, held by superior, lateral and (proper) costotransverse ligaments.",
      keyPoints: [
        "Absent at ribs 11–12 (no tubercle facet).",
        "Guides the bucket-handle rib movement.",
      ],
      difficulty: 2,
      distractorIds: ["costovertebral-joint", "sternocostal-joints", "radiate-ligament"],
      view: { azimuth: 3.4, elevation: 0.1, zoom: 1.7 },
    },
    {
      id: "sternocostal-joints",
      schematic: true,
      label: "Sternocostal joints",
      tissue: "cartilage",
      aliases: ["costosternal joints"],
      description:
        "Joints of costal cartilages 1–7 with the sternum: the 1st is a primary cartilaginous (synchondrosis), the 2nd–7th are synovial.",
      keyPoints: [
        "The 2nd has an intra-articular ligament → two cavities.",
        "Interchondral joints (7↔8↔9↔10) build the costal margin.",
      ],
      difficulty: 2,
      distractorIds: ["costovertebral-joint", "costotransverse-joint", "sternoclavicular-joint"],
      view: { azimuth: 0, elevation: 0.05, zoom: 1.5 },
    },
    {
      id: "sternoclavicular-joint",
      schematic: true,
      label: "Sternoclavicular joint",
      tissue: "cartilage",
      aliases: ["SC joint"],
      description:
        "Saddle-type synovial joint between the clavicle and the clavicular notch of the manubrium (with the first costal cartilage).",
      keyPoints: [
        "The only bony articulation linking the upper limb to the axial skeleton.",
        "Contains an articular disc.",
      ],
      difficulty: 2,
      distractorIds: ["sternocostal-joints", "manubrium", "jugular-notch"],
      view: { azimuth: 0.3, elevation: 0.45, zoom: 1.7 },
    },
    {
      id: "radiate-ligament",
      schematic: true,
      label: "Radiate ligament of head of rib",
      tissue: "ligament",
      aliases: ["radiate costovertebral ligament"],
      description:
        "Fan-shaped ligament spreading from the rib head to the bodies of the two adjacent vertebrae and their disc, reinforcing the costovertebral joint capsule.",
      keyPoints: [
        "Anterior reinforcement of the joint of the head.",
        "Superior/inferior/middle bands.",
      ],
      difficulty: 3,
      distractorIds: ["costotransverse-joint", "costovertebral-joint", "intervertebral-disc"],
      view: { azimuth: 3.9, elevation: 0, zoom: 1.9 },
    },
    {
      id: "external-intercostal-muscles",
      label: "External intercostal muscles",
      tissue: "muscle",
      aliases: ["external intercostals"],
      description:
        "Outermost intercostal layer (11 pairs), fibres running obliquely downward-and-forward from the lower border of the rib above to the upper border of the rib below; membranous anteriorly (external intercostal membrane).",
      keyPoints: [
        "Elevate the ribs in inspiration.",
        "Replaced anteriorly by the external intercostal membrane between the costal cartilages.",
      ],
      difficulty: 1,
      distractorIds: ["internal-intercostal-muscles", "innermost-intercostal-muscles", "transversus-thoracis"],
      view: { azimuth: 1.2, elevation: 0.1, zoom: 1.1 },
    },
    {
      id: "internal-intercostal-muscles",
      label: "Internal intercostal muscles",
      tissue: "muscle",
      aliases: ["internal intercostals"],
      description:
        "Middle layer, fibres at right angles to the external layer (downward-and-backward); membranous posteriorly (internal intercostal membrane).",
      keyPoints: [
        "Most active in expiration.",
        "Membranous posteriorly near the vertebral column.",
      ],
      difficulty: 1,
      distractorIds: ["external-intercostal-muscles", "innermost-intercostal-muscles", "subcostal-muscles"],
      view: { azimuth: 1.3, elevation: 0.1, zoom: 1.1 },
    },
    {
      id: "innermost-intercostal-muscles",
      label: "Innermost intercostal muscles",
      tissue: "muscle",
      aliases: ["intima", "intimal intercostals"],
      description:
        "Deepest, least distinct intercostal layer, best seen in the lateral wall; the neurovascular bundle runs between it and the internal intercostal.",
      keyPoints: [
        "Absent anteriorly and posteriorly (only the middle of the space).",
        "Bundle plane = between internal and innermost.",
      ],
      difficulty: 2,
      distractorIds: ["internal-intercostal-muscles", "external-intercostal-muscles", "subcostal-muscles"],
      view: { azimuth: 1.4, elevation: 0.1, zoom: 1.15 },
    },
    {
      id: "transversus-thoracis",
      label: "Transversus thoracis",
      tissue: "muscle",
      aliases: ["sternocostalis", "transverse thoracic"],
      description:
        "Fan of muscle on the deep surface of the anterior wall from the posterior xiphoid/lower body of sternum to the internal surface of costal cartilages 2/3–6; same plane as the innermost intercostals.",
      keyPoints: [
        "Lies deep to and steadies the internal thoracic vessels.",
        "Draws the costal cartilages inferiorly (weak expiration).",
      ],
      difficulty: 2,
      distractorIds: ["subcostal-muscles", "innermost-intercostal-muscles", "internal-intercostal-muscles"],
      view: { azimuth: 4.9, elevation: 0.05, zoom: 1.35 },
    },
    {
      id: "subcostal-muscles",
      schematic: true,
      label: "Subcostal muscles",
      tissue: "muscle",
      aliases: ["subcostals"],
      description:
        "Slips in the same plane as the innermost intercostals in the lower posterior wall, spanning one or two intercostal spaces parallel to the internal intercostals.",
      keyPoints: [
        "Cross more than one space, more numerous inferiorly.",
        "Depress/steady the ribs.",
      ],
      difficulty: 2,
      distractorIds: ["transversus-thoracis", "innermost-intercostal-muscles", "levatores-costarum"],
      view: { azimuth: 3.7, elevation: -0.1, zoom: 1.4 },
    },
    {
      id: "levatores-costarum",
      schematic: true,
      label: "Levatores costarum",
      tissue: "muscle",
      aliases: ["levator costae"],
      description:
        "Small fan-shaped muscles from the transverse processes (C7–T11) to the rib below, near its tubercle.",
      keyPoints: [
        "Elevate the ribs (segmental, posterior).",
        "Innervated by dorsal rami.",
      ],
      difficulty: 3,
      distractorIds: ["serratus-posterior-superior", "serratus-posterior-inferior", "subcostal-muscles"],
      view: { azimuth: 3.7, elevation: 0.05, zoom: 1.6 },
    },
    {
      id: "serratus-posterior-superior",
      label: "Serratus posterior superior",
      tissue: "muscle",
      description:
        "Thin sheet from the lower ligamentum nuchae and C7–T3 spines, descending laterally to the upper borders of ribs 2–5; deep to the rhomboids.",
      keyPoints: [
        "Elevates ribs 2–5 (accessory inspiration).",
        "Supplied by upper intercostal (ventral rami) nerves.",
      ],
      difficulty: 3,
      distractorIds: ["serratus-posterior-inferior", "serratus-anterior", "levatores-costarum"],
      view: { azimuth: 2.8, elevation: 0.35, zoom: 1.4 },
    },
    {
      id: "serratus-posterior-inferior",
      label: "Serratus posterior inferior",
      tissue: "muscle",
      description:
        "Thin sheet from T11–L3 spines ascending laterally to the lower borders of ribs 9–12; deep to latissimus dorsi.",
      keyPoints: [
        "Depresses/steadies ribs 9–12 against diaphragmatic pull.",
        "Blends medially with the thoracolumbar fascia.",
      ],
      difficulty: 3,
      distractorIds: ["serratus-posterior-superior", "serratus-anterior", "subcostal-muscles"],
      view: { azimuth: 3, elevation: -0.2, zoom: 1.35 },
    },
    {
      id: "diaphragm",
      label: "Diaphragm",
      tissue: "muscle",
      aliases: ["thoracic diaphragm"],
      description:
        "Dome-shaped musculotendinous floor of the thorax with a central tendon and right/left crura, closing the inferior thoracic aperture and driving the vertical dimension of breathing.",
      keyPoints: [
        "Openings: IVC T8 (central tendon), oesophagus T10 (with vagi), aorta T12 (with thoracic duct & azygos).",
        "Motor supply is the phrenic nerve (C3–C5); one phrenic = one hemidiaphragm.",
      ],
      difficulty: 1,
      distractorIds: ["transversus-thoracis", "serratus-posterior-inferior", "inferior-thoracic-aperture"],
      view: { azimuth: 0.3, elevation: -0.35, zoom: 1.1 },
    },
    {
      id: "pectoralis-major",
      label: "Pectoralis major",
      tissue: "muscle",
      aliases: ["pec major"],
      description:
        "Large superficial fan from the clavicle, sternum, upper six costal cartilages and external oblique aponeurosis to the humerus; forms the anterior axillary fold.",
      keyPoints: [
        "Adducts, medially rotates and flexes the humerus.",
        "Supplied by medial + lateral pectoral nerves.",
      ],
      difficulty: 1,
      distractorIds: ["pectoralis-minor", "subclavius", "serratus-anterior"],
      view: { azimuth: 0.1, elevation: 0.15, zoom: 1 },
    },
    {
      id: "pectoralis-minor",
      label: "Pectoralis minor",
      tissue: "muscle",
      aliases: ["pec minor"],
      description:
        "Triangular muscle deep to pec major from ribs 3–5 to the coracoid process; a key landmark of the axilla.",
      keyPoints: [
        "Depresses the shoulder tip and helps protract the scapula.",
        "Medial pectoral nerve pierces it to also reach pec major.",
      ],
      difficulty: 2,
      distractorIds: ["pectoralis-major", "subclavius", "serratus-anterior"],
      view: { azimuth: 5.2, elevation: 0.15, zoom: 1.35 },
    },
    {
      id: "subclavius",
      label: "Subclavius",
      tissue: "muscle",
      description:
        "Small muscle from the 1st rib/costal cartilage to the inferior surface of the clavicle, enclosed with pec minor in the clavipectoral fascia.",
      keyPoints: [
        "Steadies the clavicle at the SC joint and depresses the shoulder tip.",
        "Supplied by the nerve to subclavius.",
      ],
      difficulty: 2,
      distractorIds: ["pectoralis-minor", "pectoralis-major", "serratus-anterior"],
      view: { azimuth: 5.3, elevation: 0.45, zoom: 1.6 },
    },
    {
      id: "serratus-anterior",
      label: "Serratus anterior",
      tissue: "muscle",
      description:
        "Broad muscle from the upper 8 ribs, wrapping the chest wall to insert on the medial (vertebral) border of the scapula.",
      keyPoints: [
        "Main protractor of the scapula; anchors it for overhead reach.",
        "Long thoracic nerve injury → winged scapula.",
      ],
      difficulty: 1,
      distractorIds: ["pectoralis-major", "pectoralis-minor", "serratus-posterior-superior"],
      view: { azimuth: 4.4, elevation: 0, zoom: 1.15 },
    },
    {
      id: "internal-thoracic-artery",
      label: "Internal thoracic artery",
      tissue: "artery",
      aliases: ["internal mammary artery"],
      description:
        "Branch of the subclavian artery descending ~1 cm lateral to the sternum, behind the upper costal cartilages, dividing at the 6th space into musculophrenic and superior epigastric branches.",
      keyPoints: [
        "Gives the upper anterior intercostal, perforating (mammary), sternal, pericardiacophrenic and thymic branches.",
        "Its bed is guarded by transversus thoracis.",
      ],
      difficulty: 1,
      distractorIds: ["internal-thoracic-vein", "anterior-intercostal-arteries", "musculophrenic-artery"],
      view: { azimuth: 0, elevation: 0.1, zoom: 1.35 },
    },
    {
      id: "internal-thoracic-vein",
      schematic: true,
      label: "Internal thoracic veins",
      tissue: "vein",
      aliases: ["internal mammary veins"],
      description:
        "Venae comitantes of the artery, fusing to a single vein near the 3rd cartilage and draining into the brachiocephalic vein of its side.",
      keyPoints: [
        "Receives the anterior intercostal veins.",
        "Lies medial to the artery near its termination (dissection clue).",
      ],
      difficulty: 2,
      distractorIds: ["internal-thoracic-artery", "intercostal-veins", "anterior-intercostal-arteries"],
      view: { azimuth: 0.15, elevation: 0.1, zoom: 1.4 },
    },
    {
      id: "anterior-intercostal-arteries",
      schematic: true,
      label: "Anterior intercostal arteries",
      tissue: "artery",
      description:
        "Paired small arteries in each of the upper spaces from the internal thoracic (spaces 1–6) or musculophrenic (lower spaces); one runs along each rib margin.",
      keyPoints: [
        "Two per space (upper + lower rib margins); anastomose with the posterior intercostals.",
        "Smaller than the posterior intercostals.",
      ],
      difficulty: 2,
      distractorIds: ["posterior-intercostal-arteries", "internal-thoracic-artery", "musculophrenic-artery"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "posterior-intercostal-arteries",
      schematic: true,
      label: "Posterior intercostal arteries",
      tissue: "artery",
      description:
        "Single artery per space; upper two from the supreme intercostal (costocervical trunk), lower nine from the thoracic aorta; runs in the costal groove with a collateral branch along the rib below.",
      keyPoints: [
        "In the costal groove the order is V–A–N, superior→inferior.",
        "Right-sided vessels are longer (cross the vertebral bodies); dilate in aortic coarctation → rib notching.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-intercostal-arteries", "intercostal-veins", "internal-thoracic-artery"],
      view: { azimuth: 2.3, elevation: 0.05, zoom: 1.3 },
    },
    {
      id: "intercostal-veins",
      schematic: true,
      label: "Intercostal veins",
      tissue: "vein",
      aliases: ["anterior/posterior intercostal veins"],
      description:
        "Veins of each space; anterior tributaries drain to the internal thoracic vein, posterior tributaries to the azygos/hemiazygos system.",
      keyPoints: [
        "The highest structure in the costal groove (V of VAN).",
        "Posterior veins feed the azygos system (see mediastinum).",
      ],
      difficulty: 2,
      distractorIds: ["internal-thoracic-vein", "posterior-intercostal-arteries", "anterior-intercostal-arteries"],
      view: { azimuth: 2.2, elevation: 0.1, zoom: 1.35 },
    },
    {
      id: "musculophrenic-artery",
      schematic: true,
      label: "Musculophrenic artery",
      tissue: "artery",
      description:
        "One of the two terminal branches of the internal thoracic, running along the costal margin and supplying the lower anterior intercostal spaces and the diaphragm.",
      keyPoints: [
        "Source of the lower anterior intercostal arteries.",
        "Anastomoses with pericardiacophrenic and superior phrenic vessels.",
      ],
      difficulty: 2,
      distractorIds: ["superior-epigastric-artery", "internal-thoracic-artery", "anterior-intercostal-arteries"],
      view: { azimuth: 0.3, elevation: -0.25, zoom: 1.4 },
    },
    {
      id: "superior-epigastric-artery",
      schematic: true,
      label: "Superior epigastric artery",
      tissue: "artery",
      description:
        "The other terminal branch of the internal thoracic, continuing inferiorly behind the rectus sheath into the anterior abdominal wall.",
      keyPoints: [
        "Links thoracic to abdominal wall supply (anastomoses with inferior epigastric).",
        "Leaves the thorax through the sternocostal triangle.",
      ],
      difficulty: 2,
      distractorIds: ["musculophrenic-artery", "internal-thoracic-artery", "anterior-intercostal-arteries"],
      view: { azimuth: 0.1, elevation: -0.4, zoom: 1.5 },
    },
  ],
};
