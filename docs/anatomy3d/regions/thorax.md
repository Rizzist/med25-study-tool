# Thorax — curated, modularized 3D anatomy trainer scope

Full-region gross-anatomy scope for the med-school 3D trainer, grounded in **the actual course lecture
transcripts** for Term 2 · Cardiovascular · Anatomy (Tehran University of Medical Sciences decks, drawn from
*Gray's for Students*, Snell, Moore, Netter/Zobta). This document reconciles and **expands the current
heart-only `cvs` model into the whole thorax the course teaches**: five thoracic-bone lectures (A1–A5), two
muscle lectures (M1–M2), the heart series (A/B/C/E), the mediastinum series (A2–A4) and the neurovascular
series (A/B, V1/V2).

Source transcripts (all under `…/01 Cardiovascular/Anatomy/Lecture Transcripts/`):
bones A1–A5, "Muscles of thorax" M1–M2, Heart A/B/C/E, mediastinum A2–A4, "neurovascular system of thorax"
A/B and V1/V2.

## Conventions (inherited from `SPEC.md`, `cvs.md`, `upper-limb.md`)

- **Anatomical position:** `+Y` superior, `+Z` anterior, `+X` subject-left; viewer looks along `−Z`.
- **Engine `Tissue` union used here:** `bone | cartilage | muscle | ligament | membrane | nerve | artery | vein | fat | cavity | gland`. The `system / tissue` column names the anatomical system (documentation) and, in backticks, the engine tissue (drives colour). Airway/organ tubes are mapped to their defining tissue: trachea & main bronchi → `cartilage`; oesophagus & diaphragm → `muscle`; thymus → `gland`; thoracic duct → `vein` (lymphatic vessel, nearest engine colour).
- **Conduction tissue** stays `muscle` (specialised myocardium), matching `cvs.md`.
- **Scope rule:** paired structures are one quiz target when learners identify them as a set (e.g. floating ribs, pulmonary veins, splanchnic nerves are still separable where the course examines sides independently — right vs left phrenic/vagus/RLN are kept separate because their courses are independently high-yield).
- **`distractorIds`** are always other IDs **in the same module** (the seeded quiz builder pulls distractors from the current module), and every ID is unique **across the whole region**.
- **`proposedFMA`:** `?` = an exact BodyParts3D/FMA node has not been verified; never substitute a parent-organ ID for a specific structure.
- **`realOrSchematic`:** `YES (real mesh)` = a real BodyParts3D segmented mesh is the right target (bones, muscles, organs, valves, great vessels, chambers); `procedural (schematic)` = drawn procedurally and placed relative to real-mesh bounding boxes (nerves & plexuses, small/wall vessels, conduction, pericardial layers & sinuses, septa, membranes/fascia, ligaments, costal cartilage, potential spaces, thoracic duct).

## Module design (4 models)

The course maps cleanly onto **four** models — each becomes its own factory + manifest, exactly as respiratory
and `cvs` already are:

| moduleKey | title | course source | ~count |
|---|---|---|---:|
| `thoracic-wall` | Thoracic skeleton, wall & diaphragm | bones A1–A5, muscles M1–M2, neurovascular A/V1 (wall vessels) | 44 |
| `heart` | Heart, valves, coronaries, conduction & pericardium | heart A/B/C/E (refines the current `cvs` scope) | 48 |
| `mediastinum` | Mediastinum, great vessels & viscera | mediastinum A2–A4, neurovascular B/V2 (azygos), heart A (divisions) | 32 |
| `thoracic-innervation` | Thoracic nerves & autonomics | neurovascular A/B/V1/V2 (nerves), mediastinum A3–A4 | 25 |

> **Neurovascular-bundle split (design note).** The intercostal neurovascular bundle is taught as one unit but
> spans two models geometrically: its **vessels** (intercostal arteries/veins, internal thoracic) live in
> `thoracic-wall`; its **nerve** and all the somatic/autonomic thoracic nerves live in `thoracic-innervation`.
> The VAN order (**V**ein→**A**rtery→**N**erve, superior→inferior in the costal groove) and the
> "needle above the lower rib" rule are carried as key points on both sides.

---

## Module 1 — `thoracic-wall`

Thoracic cage (vertebrae, ribs, sternum, costal cartilages), the joints/ligaments that bind it, the two
apertures, the muscles that move it (intercostals + accessory + diaphragm + the pectoral/serratus muscles that
attach to it), and the wall vasculature of the intercostal spaces.

### Skeleton — vertebrae, ribs, sternum (14)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-wall` | `typical-thoracic-vertebra` | skeletal / `bone` | Typical thoracic vertebra (T2–T8) | typical vertebra; T5 | Heart-shaped body carrying superior and inferior **costal demifacets**, a **transverse costal facet**, and a long spinous process that slopes sharply downward and overlaps the vertebra below. | Superior + inferior demifacets take the head of the same-numbered rib and the rib above.<br>Flat facets permit rotation in the thoracic region. | 1 | `first-thoracic-vertebra`, `atypical-thoracic-vertebrae`, `intervertebral-disc` | ? | YES (real mesh) |
| `thoracic-wall` | `first-thoracic-vertebra` | skeletal / `bone` | First thoracic vertebra (T1) | atypical vertebra; T1 | Atypical vertebra with a **complete** superior costal facet for the whole head of rib 1 plus an inferior demifacet for rib 2; body is cervical-type and the spinous process is long and near-horizontal. | Complete (not demi) facet for rib 1 is the identifying feature.<br>Spinous process is a back landmark with C7. | 2 | `typical-thoracic-vertebra`, `atypical-thoracic-vertebrae`, `first-rib` | ? | YES (real mesh) |
| `thoracic-wall` | `atypical-thoracic-vertebrae` | skeletal / `bone` | Atypical thoracic vertebrae (T9–T12) | T9, T10, T11, T12 | Transition vertebrae: T9 has a superior demifacet only; T10–T12 each carry a **single complete** costal facet, and T11–T12 lack transverse costal facets (their transverse processes are stubby). | Single complete facets and loss of transverse facets mark the thoraco-lumbar transition.<br>T12 changes from rotational to non-rotational function. | 2 | `typical-thoracic-vertebra`, `first-thoracic-vertebra`, `floating-ribs` | ? | YES (real mesh) |
| `thoracic-wall` | `typical-rib` | skeletal / `bone` | Typical rib (3rd–9th) | costa | Curved bone with a head (two demifacets + crest), neck, tubercle (articular + non-articular facet), angle, and a shaft whose inner-inferior **costal groove** shelters the neurovascular bundle. | The costal groove carries the intercostal vein→artery→nerve; the angle is the commonest fracture site.<br>Head articulates with same-numbered + suprajacent vertebral bodies. | 1 | `first-rib`, `second-rib`, `floating-ribs` | ? | YES (real mesh) |
| `thoracic-wall` | `first-rib` | skeletal / `bone` | First rib | rib 1 | Shortest, broadest, most sharply curved rib, with superior/inferior surfaces; the **scalene tubercle** separates a groove for the subclavian **vein** (anterior) from a groove for the subclavian **artery** (posterior). | Vein anterior, artery + lower trunk of brachial plexus posterior to the scalene tubercle.<br>A cervical rib can compress the subclavian artery here. | 2 | `second-rib`, `typical-rib`, `floating-ribs` | ? | YES (real mesh) |
| `thoracic-wall` | `second-rib` | skeletal / `bone` | Second rib | rib 2 | Roughly twice the length of the first rib with similar curvature; thin, with a roughened tuberosity for serratus anterior — its shaft surfaces make it "atypical". | Its cartilage meets the sternum at the sternal angle (rib-2 counting landmark).<br>Articulates across the T1–T2 bodies. | 2 | `first-rib`, `typical-rib`, `manubrium` | ? | YES (real mesh) |
| `thoracic-wall` | `floating-ribs` | skeletal / `bone` | Floating ribs (11th & 12th) | free ribs; vertebral ribs | Short ribs with a single articular facet, **no tubercle and no costal groove**, ending in free cartilage-tipped anterior ends that never reach the sternum or costal margin. | Articulate only with their own-numbered vertebral body.<br>Lack tubercle → no costotransverse joint. | 2 | `first-rib`, `typical-rib`, `second-rib` | ? | YES (real mesh) |
| `thoracic-wall` | `costal-cartilages` | skeletal / `cartilage` | Costal cartilages | costochondral cartilage | Hyaline cartilage bars continuing the anterior rib ends: 1–7 reach the sternum (true), 8–10 join the cartilage above (false), 11–12 end free (floating). | True vs false vs floating classification.<br>Ossify/calcify after ~55 yr, casting an X-ray shadow. | 1 | `costal-margin`, `intervertebral-disc`, `xiphoid-process` | ? | procedural (schematic) |
| `thoracic-wall` | `costal-margin` | skeletal / `cartilage` | Costal margin | costal arch | The palpable inferior border formed by the fused 7th–10th costal cartilages, framing the inferior thoracic aperture; its lowest point is rib 10. | Lowest point lies ~L2–L3, only 4–6 cm above the iliac crest.<br>Meeting of the two margins = infrasternal angle. | 1 | `costal-cartilages`, `inferior-thoracic-aperture`, `xiphoid-process` | ? | procedural (schematic) |
| `thoracic-wall` | `manubrium` | skeletal / `bone` | Manubrium of sternum | manubrium sterni | Upper, roughly square part of the sternum bearing the jugular notch, the clavicular notches, and a facet for the 1st plus a demifacet for the 2nd costal cartilage. | Superior border (jugular notch) lies at ~T2.<br>Angles backward on the body to raise the sternal angle. | 1 | `sternal-body`, `xiphoid-process`, `sternal-angle` | ? | YES (real mesh) |
| `thoracic-wall` | `sternal-body` | skeletal / `bone` | Body of sternum | gladiolus; mesosternum | Middle sternal part with lateral facets for the 2nd–7th costal cartilages and three transverse ridges marking fusion of four sternebrae. | Spans roughly T5–T9.<br>Subcutaneous — a site for sternal marrow puncture. | 1 | `manubrium`, `xiphoid-process`, `sternal-angle` | ? | YES (real mesh) |
| `thoracic-wall` | `xiphoid-process` | skeletal / `bone` | Xiphoid process | xiphisternum | Smallest, variably shaped inferior sternal part, cartilaginous in youth and ossifying in the adult; lies at ~T9. | Xiphisternal joint marks the inferior limit of the thoracic cavity anteriorly.<br>Variable seventh-cartilage demifacet. | 1 | `manubrium`, `sternal-body`, `costal-margin` | ? | YES (real mesh) |
| `thoracic-wall` | `sternal-angle` | skeletal / `cartilage` | Sternal angle (of Louis) | angle of Louis; manubriosternal joint | Palpable symphysis where the manubrium meets the body; lies at the **2nd costal cartilage** and the **T4/T5 intervertebral disc**. | The key rib-counting landmark.<br>Its transverse plane divides superior from inferior mediastinum. | 1 | `jugular-notch`, `xiphoid-process`, `manubrium` | ? | procedural (schematic) |
| `thoracic-wall` | `jugular-notch` | skeletal / `bone` | Jugular (suprasternal) notch | suprasternal notch | Concave midline superior border of the manubrium between the two clavicular notches; lies at ~T2. | Palpable surface landmark.<br>Left brachiocephalic vein may rise above it in children (tracheostomy caution). | 1 | `sternal-angle`, `xiphoid-process`, `manubrium` | ? | YES (real mesh) |

### Apertures, membranes & fascia (4)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-wall` | `superior-thoracic-aperture` | skeletal / `cavity` | Superior thoracic aperture (inlet) | thoracic inlet | Kidney-shaped opening bounded by the T1 body, the first ribs and the superior manubrial border, ~5 cm AP × ~10 cm transverse, sloping downward and forward. | The downward slope carries the lung apex up into the neck.<br>Roofed by the suprapleural membrane. | 2 | `inferior-thoracic-aperture`, `suprapleural-membrane`, `costal-margin` | ? | procedural (schematic) |
| `thoracic-wall` | `inferior-thoracic-aperture` | skeletal / `cavity` | Inferior thoracic aperture (outlet) | thoracic outlet | Larger, expandable opening bounded by T12, rib 12, the distal 11th ribs, the costal margins and the xiphoid, closed by the diaphragm. | Closed by the diaphragm; its posterior margin sits below the anterior margin.<br>All abdomino-thoracic structures pass through or behind the diaphragm here. | 2 | `superior-thoracic-aperture`, `diaphragm`, `costal-margin` | ? | procedural (schematic) |
| `thoracic-wall` | `suprapleural-membrane` | connective / `membrane` | Suprapleural membrane | Sibson's fascia | Fibrous sheet slung from the C7 transverse process to the inner border of the first rib, roofing the cervical pleural dome and lung apex. | Protects the lung apex at the root of the neck.<br>Resists pressure changes over the apex during respiration. | 3 | `superior-thoracic-aperture`, `endothoracic-fascia`, `innermost-intercostal-muscles` | ? | procedural (schematic) |
| `thoracic-wall` | `endothoracic-fascia` | connective / `membrane` | Endothoracic fascia | ... | Thin connective-tissue layer lining the inner surface of the thoracic cage between the innermost intercostals and the parietal pleura. | A natural surgical cleavage plane.<br>Thickens superiorly as the suprapleural membrane. | 3 | `suprapleural-membrane`, `internal-thoracic-artery`, `innermost-intercostal-muscles` | ? | procedural (schematic) |

### Joints & ligaments (6)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-wall` | `intervertebral-disc` | connective / `cartilage` | Intervertebral disc | anulus fibrosus; nucleus pulposus | Fibrocartilaginous symphysis between vertebral bodies, an outer lamellar **anulus fibrosus** around a gelatinous **nucleus pulposus**. | The thinner posterolateral anulus is the usual herniation site → nerve-root compression.<br>Absorbs water at rest, thins with activity. | 2 | `costovertebral-joint`, `sternocostal-joints`, `costal-cartilages` | ? | procedural (schematic) |
| `thoracic-wall` | `costovertebral-joint` | connective / `cartilage` | Costovertebral joint (of the head) | joint of head of rib | Synovial joint of the rib head, whose two demifacets meet the same-numbered and suprajacent vertebral bodies and the interposed disc; split into two cavities by an intra-articular ligament. | Reinforced externally by the radiate ligament.<br>Head of a typical rib spans two vertebrae. | 2 | `costotransverse-joint`, `sternocostal-joints`, `sternoclavicular-joint` | ? | procedural (schematic) |
| `thoracic-wall` | `costotransverse-joint` | connective / `cartilage` | Costotransverse joint | ... | Synovial joint between the articular facet of the rib tubercle and the transverse-process facet, held by superior, lateral and (proper) costotransverse ligaments. | Absent at ribs 11–12 (no tubercle facet).<br>Guides the bucket-handle rib movement. | 2 | `costovertebral-joint`, `sternocostal-joints`, `radiate-ligament` | ? | procedural (schematic) |
| `thoracic-wall` | `sternocostal-joints` | connective / `cartilage` | Sternocostal joints | costosternal joints | Joints of costal cartilages 1–7 with the sternum: the **1st is a primary cartilaginous (synchondrosis)**, the 2nd–7th are synovial. | The 2nd has an intra-articular ligament → two cavities.<br>Interchondral joints (7↔8↔9↔10) build the costal margin. | 2 | `costovertebral-joint`, `costotransverse-joint`, `sternoclavicular-joint` | ? | procedural (schematic) |
| `thoracic-wall` | `sternoclavicular-joint` | connective / `cartilage` | Sternoclavicular joint | SC joint | Saddle-type synovial joint between the clavicle and the clavicular notch of the manubrium (with the first costal cartilage). | The only bony articulation linking the upper limb to the axial skeleton.<br>Contains an articular disc. | 2 | `sternocostal-joints`, `manubrium`, `jugular-notch` | ? | procedural (schematic) |
| `thoracic-wall` | `radiate-ligament` | connective / `ligament` | Radiate ligament of head of rib | radiate costovertebral ligament | Fan-shaped ligament spreading from the rib head to the bodies of the two adjacent vertebrae and their disc, reinforcing the costovertebral joint capsule. | Anterior reinforcement of the joint of the head.<br>Superior/inferior/middle bands. | 3 | `costotransverse-joint`, `costovertebral-joint`, `intervertebral-disc` | ? | procedural (schematic) |

### Muscles — intercostal, accessory & attaching (13)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-wall` | `external-intercostal-muscles` | muscular / `muscle` | External intercostal muscles | external intercostals | Outermost intercostal layer (11 pairs), fibres running obliquely **downward-and-forward** from the lower border of the rib above to the upper border of the rib below; membranous anteriorly (external intercostal membrane). | Elevate the ribs in inspiration.<br>Replaced anteriorly by the external intercostal membrane between the costal cartilages. | 1 | `internal-intercostal-muscles`, `innermost-intercostal-muscles`, `transversus-thoracis` | ? | YES (real mesh) |
| `thoracic-wall` | `internal-intercostal-muscles` | muscular / `muscle` | Internal intercostal muscles | internal intercostals | Middle layer, fibres at right angles to the external layer (downward-and-backward); membranous posteriorly (internal intercostal membrane). | Most active in expiration.<br>Membranous posteriorly near the vertebral column. | 1 | `external-intercostal-muscles`, `innermost-intercostal-muscles`, `subcostal-muscles` | ? | YES (real mesh) |
| `thoracic-wall` | `innermost-intercostal-muscles` | muscular / `muscle` | Innermost intercostal muscles | intima; intimal intercostals | Deepest, least distinct intercostal layer, best seen in the lateral wall; the **neurovascular bundle runs between it and the internal intercostal**. | Absent anteriorly and posteriorly (only the middle of the space).<br>Bundle plane = between internal and innermost. | 2 | `internal-intercostal-muscles`, `external-intercostal-muscles`, `subcostal-muscles` | ? | YES (real mesh) |
| `thoracic-wall` | `transversus-thoracis` | muscular / `muscle` | Transversus thoracis | sternocostalis; transverse thoracic | Fan of muscle on the deep surface of the anterior wall from the posterior xiphoid/lower body of sternum to the internal surface of costal cartilages 2/3–6; same plane as the innermost intercostals. | Lies deep to and steadies the internal thoracic vessels.<br>Draws the costal cartilages inferiorly (weak expiration). | 2 | `subcostal-muscles`, `innermost-intercostal-muscles`, `internal-intercostal-muscles` | ? | YES (real mesh) |
| `thoracic-wall` | `subcostal-muscles` | muscular / `muscle` | Subcostal muscles | subcostals | Slips in the same plane as the innermost intercostals in the lower posterior wall, spanning one or two intercostal spaces parallel to the internal intercostals. | Cross more than one space, more numerous inferiorly.<br>Depress/steady the ribs. | 2 | `transversus-thoracis`, `innermost-intercostal-muscles`, `levatores-costarum` | ? | YES (real mesh) |
| `thoracic-wall` | `levatores-costarum` | muscular / `muscle` | Levatores costarum | levator costae | Small fan-shaped muscles from the transverse processes (C7–T11) to the rib below, near its tubercle. | Elevate the ribs (segmental, posterior).<br>Innervated by dorsal rami. | 3 | `serratus-posterior-superior`, `serratus-posterior-inferior`, `subcostal-muscles` | ? | procedural (schematic) |
| `thoracic-wall` | `serratus-posterior-superior` | muscular / `muscle` | Serratus posterior superior | ... | Thin sheet from the lower ligamentum nuchae and C7–T3 spines, descending laterally to the upper borders of ribs 2–5; deep to the rhomboids. | Elevates ribs 2–5 (accessory inspiration).<br>Supplied by upper intercostal (ventral rami) nerves. | 3 | `serratus-posterior-inferior`, `serratus-anterior`, `levatores-costarum` | ? | YES (real mesh) |
| `thoracic-wall` | `serratus-posterior-inferior` | muscular / `muscle` | Serratus posterior inferior | ... | Thin sheet from T11–L3 spines ascending laterally to the lower borders of ribs 9–12; deep to latissimus dorsi. | Depresses/steadies ribs 9–12 against diaphragmatic pull.<br>Blends medially with the thoracolumbar fascia. | 3 | `serratus-posterior-superior`, `serratus-anterior`, `subcostal-muscles` | ? | YES (real mesh) |
| `thoracic-wall` | `diaphragm` | muscular / `muscle` | Diaphragm | thoracic diaphragm | Dome-shaped musculotendinous floor of the thorax with a central tendon and right/left crura, closing the inferior thoracic aperture and driving the vertical dimension of breathing. | Openings: **IVC T8** (central tendon), **oesophagus T10** (with vagi), **aorta T12** (with thoracic duct & azygos).<br>Motor supply is the phrenic nerve (C3–C5); one phrenic = one hemidiaphragm. | 1 | `transversus-thoracis`, `serratus-posterior-inferior`, `inferior-thoracic-aperture` | ? | YES (real mesh) |
| `thoracic-wall` | `pectoralis-major` | muscular / `muscle` | Pectoralis major | pec major | Large superficial fan from the clavicle, sternum, upper six costal cartilages and external oblique aponeurosis to the humerus; forms the anterior axillary fold. | Adducts, medially rotates and flexes the humerus.<br>Supplied by medial + lateral pectoral nerves. | 1 | `pectoralis-minor`, `subclavius`, `serratus-anterior` | ? | YES (real mesh) |
| `thoracic-wall` | `pectoralis-minor` | muscular / `muscle` | Pectoralis minor | pec minor | Triangular muscle deep to pec major from ribs 3–5 to the coracoid process; a key landmark of the axilla. | Depresses the shoulder tip and helps protract the scapula.<br>Medial pectoral nerve pierces it to also reach pec major. | 2 | `pectoralis-major`, `subclavius`, `serratus-anterior` | ? | YES (real mesh) |
| `thoracic-wall` | `subclavius` | muscular / `muscle` | Subclavius | ... | Small muscle from the 1st rib/costal cartilage to the inferior surface of the clavicle, enclosed with pec minor in the clavipectoral fascia. | Steadies the clavicle at the SC joint and depresses the shoulder tip.<br>Supplied by the nerve to subclavius. | 2 | `pectoralis-minor`, `pectoralis-major`, `serratus-anterior` | ? | YES (real mesh) |
| `thoracic-wall` | `serratus-anterior` | muscular / `muscle` | Serratus anterior | ... | Broad muscle from the upper 8 ribs, wrapping the chest wall to insert on the medial (vertebral) border of the scapula. | Main protractor of the scapula; anchors it for overhead reach.<br>Long thoracic nerve injury → winged scapula. | 1 | `pectoralis-major`, `pectoralis-minor`, `serratus-posterior-superior` | ? | YES (real mesh) |

### Wall vasculature — the intercostal neurovascular bundle & internal thoracic (7)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-wall` | `internal-thoracic-artery` | cardiovascular / `artery` | Internal thoracic artery | internal mammary artery | Branch of the subclavian artery descending ~1 cm lateral to the sternum, behind the upper costal cartilages, dividing at the 6th space into musculophrenic and superior epigastric branches. | Gives the upper anterior intercostal, perforating (mammary), sternal, pericardiacophrenic and thymic branches.<br>Its bed is guarded by transversus thoracis. | 1 | `internal-thoracic-vein`, `anterior-intercostal-arteries`, `musculophrenic-artery` | ? | YES (real mesh) |
| `thoracic-wall` | `internal-thoracic-vein` | cardiovascular / `vein` | Internal thoracic veins | internal mammary veins | Venae comitantes of the artery, fusing to a single vein near the 3rd cartilage and draining into the brachiocephalic vein of its side. | Receives the anterior intercostal veins.<br>Lies **medial** to the artery near its termination (dissection clue). | 2 | `internal-thoracic-artery`, `intercostal-veins`, `anterior-intercostal-arteries` | ? | procedural (schematic) |
| `thoracic-wall` | `anterior-intercostal-arteries` | cardiovascular / `artery` | Anterior intercostal arteries | ... | Paired small arteries in each of the upper spaces from the internal thoracic (spaces 1–6) or musculophrenic (lower spaces); one runs along each rib margin. | Two per space (upper + lower rib margins); anastomose with the posterior intercostals.<br>Smaller than the posterior intercostals. | 2 | `posterior-intercostal-arteries`, `internal-thoracic-artery`, `musculophrenic-artery` | ? | procedural (schematic) |
| `thoracic-wall` | `posterior-intercostal-arteries` | cardiovascular / `artery` | Posterior intercostal arteries | ... | Single artery per space; upper two from the **supreme intercostal (costocervical trunk)**, lower nine from the **thoracic aorta**; runs in the costal groove with a collateral branch along the rib below. | In the costal groove the order is **V–A–N**, superior→inferior.<br>Right-sided vessels are longer (cross the vertebral bodies); dilate in aortic coarctation → rib notching. | 2 | `anterior-intercostal-arteries`, `intercostal-veins`, `internal-thoracic-artery` | ? | procedural (schematic) |
| `thoracic-wall` | `intercostal-veins` | cardiovascular / `vein` | Intercostal veins | anterior/posterior intercostal veins | Veins of each space; anterior tributaries drain to the internal thoracic vein, posterior tributaries to the azygos/hemiazygos system. | The **highest** structure in the costal groove (V of VAN).<br>Posterior veins feed the azygos system (see `mediastinum`). | 2 | `internal-thoracic-vein`, `posterior-intercostal-arteries`, `anterior-intercostal-arteries` | ? | procedural (schematic) |
| `thoracic-wall` | `musculophrenic-artery` | cardiovascular / `artery` | Musculophrenic artery | ... | One of the two terminal branches of the internal thoracic, running along the costal margin and supplying the lower anterior intercostal spaces and the diaphragm. | Source of the lower anterior intercostal arteries.<br>Anastomoses with pericardiacophrenic and superior phrenic vessels. | 2 | `superior-epigastric-artery`, `internal-thoracic-artery`, `anterior-intercostal-arteries` | ? | procedural (schematic) |
| `thoracic-wall` | `superior-epigastric-artery` | cardiovascular / `artery` | Superior epigastric artery | ... | The other terminal branch of the internal thoracic, continuing inferiorly behind the rectus sheath into the anterior abdominal wall. | Links thoracic to abdominal wall supply (anastomoses with inferior epigastric).<br>Leaves the thorax through the sternocostal triangle. | 2 | `musculophrenic-artery`, `internal-thoracic-artery`, `anterior-intercostal-arteries` | ? | procedural (schematic) |

---

## Module 2 — `heart`

Refines and completes the current heart-only `cvs` scope with the internal detail the heart series (A/B/C/E)
emphasises: the right-atrial interior (crista terminalis, pectinate muscle, valves of IVC & coronary sinus),
the trabeculated ventricular interiors, the fibrous cardiac skeleton, and the external surfaces/borders — plus
the coronaries, conduction system and pericardium carried over from `cvs`. **Great vessels have moved out of
the heart model into `mediastinum`** (see reconciliation notes); their intrapericardial roots are shown here as
stubs but are quizzed in `mediastinum`.

### Chambers, walls & internal features (17)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `heart` | `right-atrium` | cardiovascular / `cavity` | Right atrium | RA | Chamber forming the right heart border, receiving SVC, IVC and coronary sinus; a smooth posterior **sinus venarum** and a trabeculated anterior wall/auricle separated by the crista terminalis. | Three venous channels open here.<br>Fossa ovalis lies on its septal wall. | 1 | `left-atrium`, `right-ventricle`, `right-auricle` | ? | YES (real mesh) |
| `heart` | `left-atrium` | cardiovascular / `cavity` | Left atrium | LA | Most posterior chamber, forming most of the base of the heart, receiving the four pulmonary veins; wall smooth except in the auricle. | Lies directly anterior to the oesophagus (dilatation → dysphagia).<br>Develops mostly from absorbed pulmonary veins. | 1 | `right-atrium`, `left-ventricle`, `base-of-heart` | ? | YES (real mesh) |
| `heart` | `right-ventricle` | cardiovascular / `cavity` | Right ventricle | RV | Anterior chamber forming most of the sternocostal surface; trabeculated inflow and a smooth outflow (conus/infundibulum) leading to the pulmonary trunk. | Thin-walled (low-resistance pulmonary circuit).<br>Supraventricular crest separates inflow from outflow. | 1 | `left-ventricle`, `right-atrium`, `conus-arteriosus` | ? | YES (real mesh) |
| `heart` | `left-ventricle` | cardiovascular / `cavity` | Left ventricle | LV | Thick-walled chamber forming the apex, left border and most of the diaphragmatic surface; smooth superior outflow (aortic vestibule). | Myocardium ~3× the RV thickness.<br>Two papillary-muscle groups; apex beat at the left 5th space, mid-clavicular line. | 1 | `right-ventricle`, `left-atrium`, `aortic-vestibule` | ? | YES (real mesh) |
| `heart` | `right-auricle` | cardiovascular / `cavity` | Right auricle | right atrial appendage | Muscular ear-shaped pouch projecting from the anterosuperior right atrium over the aortic root, lined by pectinate muscle. | Overlaps the ascending aorta; a cardiac-surgery landmark.<br>Marks the atrial (fetal) part of the RA. | 2 | `right-atrial-pectinate-muscles`, `crista-terminalis`, `right-atrium` | ? | YES (real mesh) |
| `heart` | `crista-terminalis` | cardiovascular / `muscle` | Crista terminalis | terminal crest | Vertical muscular ridge inside the right atrium separating the smooth sinus venarum from the pectinate anterior wall; corresponds to the external sulcus terminalis. | The SA node lies at its superior end.<br>Internal landmark matching the external sulcus terminalis. | 2 | `right-atrial-pectinate-muscles`, `right-auricle`, `interatrial-septum` | ? | procedural (schematic) |
| `heart` | `right-atrial-pectinate-muscles` | cardiovascular / `muscle` | Right atrial pectinate muscles | musculi pectinati | Comb-like muscular ridges fanning from the crista terminalis through the auricle and anterior right-atrial wall. | Confined anterior to the crista terminalis.<br>In the LA, pectinate muscle is restricted to the auricle. | 2 | `crista-terminalis`, `right-auricle`, `trabeculae-carneae` | ? | procedural (schematic) |
| `heart` | `valve-of-inferior-vena-cava` | cardiovascular / `membrane` | Valve of the inferior vena cava | Eustachian valve | Rudimentary crescentic fold at the IVC orifice in the right atrium. | Directed fetal blood toward the foramen ovale.<br>Non-functional remnant in the adult. | 3 | `valve-of-coronary-sinus`, `interatrial-septum`, `crista-terminalis` | ? | procedural (schematic) |
| `heart` | `valve-of-coronary-sinus` | cardiovascular / `membrane` | Valve of the coronary sinus | Thebesian valve | Small semicircular fold guarding the coronary-sinus ostium as it opens between the IVC orifice and the tricuspid valve. | Ostium is a landmark of the triangle of Koch (near the AV node).<br>Marks the venous drainage of the myocardium. | 3 | `valve-of-inferior-vena-cava`, `coronary-sinus`, `interatrial-septum` | ? | procedural (schematic) |
| `heart` | `interatrial-septum` | cardiovascular / `muscle` | Interatrial septum & fossa ovalis | atrial septum; fossa ovalis; limbus | Partition between the atria; its thin central **fossa ovalis** (bordered by the limbus) is the remnant of the fetal foramen ovale. | Probe-patent foramen ovale in >10% is usually silent; larger defects = ASD.<br>Fossa is best seen from the right atrium. | 2 | `interventricular-septum`, `crista-terminalis`, `valve-of-inferior-vena-cava` | ? | procedural (schematic) |
| `heart` | `interventricular-septum` | cardiovascular / `muscle` | Interventricular septum | IV septum; membranous septum | Oblique partition with a large muscular part and a small superior **membranous** part; bulges into the right ventricle. | Membranous part = commonest VSD site.<br>The AV bundle traverses the membranous septum before dividing. | 2 | `interatrial-septum`, `trabeculae-carneae`, `septomarginal-trabecula` | ? | procedural (schematic) |
| `heart` | `trabeculae-carneae` | cardiovascular / `muscle` | Trabeculae carneae | fleshy trabeculae | Muscular ridges/bridges lining the ventricular walls in three forms — ridges, bridges and papillary muscles. | More numerous in the left ventricle.<br>The moderator band is a specialised bridge. | 2 | `septomarginal-trabecula`, `papillary-muscles`, `right-atrial-pectinate-muscles` | ? | YES (real mesh) |
| `heart` | `septomarginal-trabecula` | cardiovascular / `muscle` | Septomarginal trabecula | moderator band | Muscular bridge crossing the RV cavity from the interventricular septum to the base of the anterior papillary muscle. | Carries the right bundle branch toward the anterior papillary muscle.<br>Helps prevent RV over-distension. | 2 | `trabeculae-carneae`, `papillary-muscles`, `right-bundle-branch` | ? | procedural (schematic) |
| `heart` | `conus-arteriosus` | cardiovascular / `cavity` | Conus arteriosus (infundibulum) | infundibulum | Smooth-walled, cone-shaped superior outflow of the right ventricle leading to the pulmonary valve/trunk. | Smooth outflow vs trabeculated inflow.<br>Separated from inflow by the supraventricular crest. | 2 | `right-ventricle`, `aortic-vestibule`, `pulmonary-valve` | ? | YES (real mesh) |
| `heart` | `papillary-muscles` | cardiovascular / `muscle` | Papillary muscles | ... | Conical myocardial projections anchoring AV-valve cusps via chordae tendineae — anterior/posterior/septal on the right, anterolateral/posteromedial on the left. | Tense in systole to prevent cusp prolapse.<br>The posteromedial LV muscle has single-source supply (infarct-prone). | 2 | `trabeculae-carneae`, `septomarginal-trabecula`, `chordae-tendineae` | ? | YES (real mesh) |
| `heart` | `chordae-tendineae` | cardiovascular / `ligament` | Chordae tendineae | tendinous cords | Fine fibrous cords joining papillary-muscle apices to the free margins of the tricuspid and mitral cusps; each muscle sends cords to two adjacent cusps. | Prevent cusp eversion in systole.<br>Absent from the semilunar valves. | 2 | `papillary-muscles`, `tricuspid-valve`, `mitral-valve` | ? | procedural (schematic) |
| `heart` | `aortic-vestibule` | cardiovascular / `cavity` | Aortic vestibule | LV outflow tract | Smooth-walled, fibrous-walled superior outflow region of the left ventricle immediately below the aortic valve. | Fibrous (not muscular) outflow, continuous with the mitral anterior leaflet.<br>Leads to the aortic opening (~3 cm). | 2 | `conus-arteriosus`, `left-ventricle`, `aortic-valve` | ? | YES (real mesh) |

### Valves & fibrous skeleton (5)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `heart` | `tricuspid-valve` | cardiovascular / `membrane` | Tricuspid valve | right AV valve | Right atrioventricular valve, anterior/posterior/septal cusps on a fibrous annulus, tethered to RV papillary muscles by chordae. | Auscultated at the left lower sternal border.<br>Septal cusp abuts the membranous septum & AV conduction tissue. | 1 | `mitral-valve`, `pulmonary-valve`, `aortic-valve` | ? | YES (real mesh) |
| `heart` | `pulmonary-valve` | cardiovascular / `membrane` | Pulmonary valve | pulmonic valve | Semilunar valve at the RV outflow into the pulmonary trunk; anterior + right + left cusps (each with a nodule and lunule), no chordae. | Most anterior cardiac valve; auscultated at the left 2nd space.<br>Cusp positions rotate between fetus and adult. | 1 | `aortic-valve`, `tricuspid-valve`, `conus-arteriosus` | ? | YES (real mesh) |
| `heart` | `mitral-valve` | cardiovascular / `membrane` | Mitral valve | bicuspid; left AV valve | Left atrioventricular valve, anterior + (smaller) posterior leaflets on a fibrous annulus, tethered by chordae to two papillary groups. | Auscultated at the apex.<br>Anterior leaflet is continuous with the aortic fibrous curtain. | 1 | `tricuspid-valve`, `aortic-valve`, `pulmonary-valve` | ? | YES (real mesh) |
| `heart` | `aortic-valve` | cardiovascular / `membrane` | Aortic valve | aortic semilunar valve | Semilunar valve between LV and ascending aorta; right-coronary, left-coronary and non-coronary cusps with matching **aortic sinuses**. | Right & left coronary arteries arise from the two coronary sinuses.<br>Auscultated at the right 2nd space. | 1 | `pulmonary-valve`, `mitral-valve`, `tricuspid-valve` | ? | YES (real mesh) |
| `heart` | `cardiac-skeleton` | cardiovascular / `ligament` | Fibrous cardiac skeleton | fibrous rings; right/left fibrous trigones | Four fibrous rings (two AV, aortic, pulmonary) joined by the right and left fibrous trigones, anchoring valve cusps and atrial/ventricular myocardium. | Electrically insulates atria from ventricles (only the AV bundle crosses it).<br>Maintains valve-orifice integrity. | 2 | `interventricular-septum`, `mitral-valve`, `aortic-valve` | ? | procedural (schematic) |

### External surfaces, borders & sulci (5)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `heart` | `cardiac-apex` | cardiovascular / `cavity` | Apex of the heart | cardiac apex | Blunt inferolateral tip formed by the left ventricle, pointing down-forward-left to the left 5th intercostal space near the mid-clavicular line. | Surface site of the apex beat.<br>Formed by the LV. | 1 | `base-of-heart`, `diaphragmatic-surface`, `sternocostal-surface` | ? | YES (real mesh) |
| `heart` | `base-of-heart` | cardiovascular / `cavity` | Base of the heart | posterior surface | Posterior aspect formed mainly by the left atrium (with a little right atrium), receiving the pulmonary veins and facing the oesophagus/descending aorta. | Faces posteriorly toward T5–T8 vertebrae.<br>Left-atrial enlargement here can compress the oesophagus. | 2 | `cardiac-apex`, `diaphragmatic-surface`, `left-atrium` | ? | YES (real mesh) |
| `heart` | `sternocostal-surface` | cardiovascular / `cavity` | Sternocostal (anterior) surface | anterior surface | Anterior surface facing the sternum and ribs, formed mostly by the right ventricle with the right atrium and a strip of left ventricle. | Right ventricle sits directly behind the sternum.<br>Crossed by the coronary and anterior interventricular sulci. | 2 | `diaphragmatic-surface`, `base-of-heart`, `cardiac-apex` | ? | YES (real mesh) |
| `heart` | `diaphragmatic-surface` | cardiovascular / `cavity` | Diaphragmatic (inferior) surface | inferior surface | Inferior surface resting on the central tendon of the diaphragm, formed mainly by the left ventricle and part of the right. | Bears the posterior interventricular sulcus & coronary sinus.<br>Sits on the diaphragm. | 2 | `sternocostal-surface`, `base-of-heart`, `cardiac-apex` | ? | YES (real mesh) |
| `heart` | `coronary-sulcus` | cardiovascular / `cavity` | Coronary & interventricular sulci | AV groove; interventricular grooves | Surface grooves marking the internal partitions: the **coronary (AV) sulcus** encircling between atria and ventricles, and the anterior/posterior **interventricular sulci** over the septum. | Carry the coronary vessels (RCA + LAD + circumflex + coronary sinus).<br>The crux is where AV and posterior IV sulci meet. | 2 | `sternocostal-surface`, `right-coronary-artery`, `anterior-interventricular-artery` | ? | procedural (schematic) |

### Coronary vessels (10)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `heart` | `right-coronary-artery` | cardiovascular / `artery` | Right coronary artery | RCA | Arises from the right aortic sinus, runs in the right AV groove toward the crux; supplies much of the right heart. | Usually supplies the SA and AV nodes.<br>Gives the posterior IV artery in right dominance. | 1 | `left-coronary-artery`, `circumflex-artery`, `right-marginal-artery` | ? | YES (real mesh) |
| `heart` | `left-coronary-artery` | cardiovascular / `artery` | Left coronary artery | LCA; left main; LMCA | Short trunk from the left aortic sinus between the pulmonary trunk and left auricle, dividing into anterior interventricular and circumflex branches. | Left-main occlusion threatens a large territory.<br>Supplies most of the LA, LV and septum. | 1 | `right-coronary-artery`, `anterior-interventricular-artery`, `circumflex-artery` | ? | YES (real mesh) |
| `heart` | `anterior-interventricular-artery` | cardiovascular / `artery` | Anterior interventricular artery | LAD | Descends the anterior IV sulcus with the great cardiac vein toward the apex; supplies the anterior walls and anterior 2/3 of the septum. | A common, clinically important occlusion site.<br>Septal branches supply the bundle branches. | 1 | `posterior-interventricular-artery`, `circumflex-artery`, `right-marginal-artery` | ? | YES (real mesh) |
| `heart` | `circumflex-artery` | cardiovascular / `artery` | Circumflex artery | LCx | Curves left in the AV groove beneath the left auricle onto the posterior heart; supplies the LA and lateral/posterior LV. | Gives the posterior IV artery in left dominance.<br>Obtuse marginal branches run on the LV margin. | 2 | `anterior-interventricular-artery`, `right-coronary-artery`, `posterior-interventricular-artery` | ? | YES (real mesh) |
| `heart` | `posterior-interventricular-artery` | cardiovascular / `artery` | Posterior interventricular artery | PDA | Runs the posterior IV sulcus with the middle cardiac vein; usually from the RCA. | Its origin defines coronary dominance.<br>Supplies the posterior 1/3 of the septum. | 2 | `anterior-interventricular-artery`, `right-marginal-artery`, `circumflex-artery` | ? | YES (real mesh) |
| `heart` | `right-marginal-artery` | cardiovascular / `artery` | Right marginal artery | acute marginal | RCA branch along the acute margin toward the apex; supplies the RV free wall. | Variable size/origin.<br>Distinct from left obtuse marginal branches. | 2 | `right-coronary-artery`, `posterior-interventricular-artery`, `anterior-interventricular-artery` | ? | YES (real mesh) |
| `heart` | `coronary-sinus` | cardiovascular / `vein` | Coronary sinus | sinus coronarius | Wide venous channel in the posterior AV groove receiving the main cardiac veins and opening into the RA between the IVC orifice and tricuspid valve. | Principal venous drainage of the myocardium.<br>Ostium at the base of the triangle of Koch. | 1 | `great-cardiac-vein`, `middle-cardiac-vein`, `valve-of-coronary-sinus` | ? | YES (real mesh) |
| `heart` | `great-cardiac-vein` | cardiovascular / `vein` | Great cardiac vein | anterior interventricular vein | Ascends the anterior IV sulcus with the LAD, then curves in the left AV groove into the coronary sinus. | Drains the LCA territory.<br>Becomes the coronary sinus at the left AV groove. | 2 | `coronary-sinus`, `middle-cardiac-vein`, `small-cardiac-vein` | ? | YES (real mesh) |
| `heart` | `middle-cardiac-vein` | cardiovascular / `vein` | Middle cardiac vein | posterior interventricular vein | Ascends the posterior IV sulcus with the posterior IV artery to the coronary sinus near its termination. | Runs with the PDA.<br>Drains the diaphragmatic surface & posterior septum. | 2 | `great-cardiac-vein`, `small-cardiac-vein`, `coronary-sinus` | ? | YES (real mesh) |
| `heart` | `small-cardiac-vein` | cardiovascular / `vein` | Small cardiac vein & venae cordis minimae | smallest cardiac veins | Small vein running with the right marginal artery/RCA in the right AV groove to the coronary sinus, plus tiny venae cordis minimae opening directly into the chambers. | Venae cordis minimae drain myocardium straight into the RA.<br>Variable, may open directly to the RA. | 3 | `middle-cardiac-vein`, `great-cardiac-vein`, `coronary-sinus` | ? | procedural (schematic) |

### Conduction system (5) — specialised myocardium (`muscle`)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `heart` | `sinoatrial-node` | cardiovascular / `muscle` | Sinoatrial node | SA node; pacemaker | ~10×4 mm focus of specialised myocardium at the SVC–RA junction, upper crista terminalis. | Normal pacemaker of the heart.<br>Usually RCA-supplied. | 1 | `atrioventricular-node`, `atrioventricular-bundle`, `crista-terminalis` | ? | procedural (schematic) |
| `heart` | `atrioventricular-node` | cardiovascular / `muscle` | Atrioventricular node | AV node | ~5×3 mm node in the lower interatrial septum near the coronary-sinus ostium and septal tricuspid cusp (triangle of Koch). | Delays conduction to allow ventricular filling.<br>AV-nodal branch usually from the dominant artery. | 2 | `sinoatrial-node`, `atrioventricular-bundle`, `right-bundle-branch` | ? | procedural (schematic) |
| `heart` | `atrioventricular-bundle` | cardiovascular / `muscle` | Atrioventricular bundle | bundle of His | Tract leaving the AV node, piercing the fibrous skeleton and running along the membranous septum before dividing into bundle branches. | The **only** normal electrical link across the cardiac skeleton.<br>Damage → complete heart block. | 2 | `atrioventricular-node`, `right-bundle-branch`, `left-bundle-branch` | ? | procedural (schematic) |
| `heart` | `right-bundle-branch` | cardiovascular / `muscle` | Right bundle branch | RBB | Runs down the right side of the septum, part traversing the moderator band, ending in a subendocardial Purkinje network. | Moderator-band relationship is a classic ID point.<br>Ends as Purkinje fibres. | 2 | `left-bundle-branch`, `atrioventricular-bundle`, `septomarginal-trabecula` | ? | procedural (schematic) |
| `heart` | `left-bundle-branch` | cardiovascular / `muscle` | Left bundle branch | LBB | Broad branch descending the left septal surface, dividing into anterior/posterior fascicles and a Purkinje network. | Broader, branches earlier than the RBB.<br>Fascicles feed the subendocardial Purkinje network. | 2 | `right-bundle-branch`, `atrioventricular-bundle`, `atrioventricular-node` | ? | procedural (schematic) |

### Pericardium (6)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `heart` | `fibrous-pericardium` | cardiovascular / `membrane` | Fibrous pericardium | fibrous sac | Tough conical outer sac enclosing the heart and great-vessel roots, fused below to the central tendon of the diaphragm and above to great-vessel adventitia. | Innervated by the phrenic nerves (pain → C3–C5 dermatomes, shoulder/neck).<br>Inelastic → rapid effusion is dangerous. | 1 | `parietal-serous-pericardium`, `visceral-serous-pericardium`, `pericardial-cavity` | ? | YES (real mesh) |
| `heart` | `parietal-serous-pericardium` | cardiovascular / `membrane` | Parietal serous pericardium | parietal layer | Serous layer lining the fibrous pericardium, reflected around the great-vessel roots to become the visceral layer. | Adherent to the fibrous pericardium.<br>Phrenic (somatic) sensory → referred shoulder pain. | 2 | `visceral-serous-pericardium`, `fibrous-pericardium`, `pericardial-cavity` | ? | procedural (schematic) |
| `heart` | `visceral-serous-pericardium` | cardiovascular / `membrane` | Visceral serous pericardium (epicardium) | epicardium | Serous layer adherent to the heart surface, the outer histological layer of the heart wall, over the subepicardial coronary vessels and fat. | Relatively pain-insensitive (autonomic).<br>= epicardium. | 2 | `parietal-serous-pericardium`, `fibrous-pericardium`, `pericardial-cavity` | ? | procedural (schematic) |
| `heart` | `pericardial-cavity` | cardiovascular / `cavity` | Pericardial cavity | pericardial space | Potential space between the serous layers holding a thin film of fluid; the "bare area/cardiac dullness" is the safe anterior access point. | Rapid filling → cardiac tamponade → biventricular failure.<br>Pericardiocentesis via the bare area avoids pleura & lung. | 1 | `transverse-pericardial-sinus`, `oblique-pericardial-sinus`, `fibrous-pericardium` | ? | procedural (schematic) |
| `heart` | `transverse-pericardial-sinus` | cardiovascular / `cavity` | Transverse pericardial sinus | ... | Passage within the pericardial cavity behind the ascending aorta & pulmonary trunk and in front of the SVC and atria. | A finger/clamp can pass through it to control the arterial outflow.<br>Separates arterial from venous poles. | 2 | `oblique-pericardial-sinus`, `pericardial-cavity`, `base-of-heart` | ? | procedural (schematic) |
| `heart` | `oblique-pericardial-sinus` | cardiovascular / `cavity` | Oblique pericardial sinus | ... | Blind cul-de-sac behind the left atrium, bounded by the reflections around the pulmonary veins and IVC; opens inferiorly. | Allows left-atrial expansion; cannot be traversed.<br>Admits a hand behind the heart at surgery. | 2 | `transverse-pericardial-sinus`, `pericardial-cavity`, `base-of-heart` | ? | procedural (schematic) |

---

## Module 3 — `mediastinum`

The mediastinal divisions, the great vessels (arterial and venous, including the azygos system), the visceral
tubes (trachea, main bronchi, oesophagus), the thymus, and the thoracic duct. The great vessels previously
carried in `cvs` live here.

### Mediastinal divisions (4)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `mediastinum` | `superior-mediastinum` | topographic / `cavity` | Superior mediastinum | ... | Region above the sternal-angle plane (T4/T5), containing the aortic arch & branches, brachiocephalic veins & upper SVC, trachea, oesophagus, thymus, vagus & phrenic nerves and the thoracic duct. | Bounded below by the sternal-angle (transverse thoracic) plane.<br>Left recurrent laryngeal nerve is a contents; the right is not. | 2 | `anterior-mediastinum`, `middle-mediastinum`, `posterior-mediastinum` | ? | procedural (schematic) |
| `mediastinum` | `anterior-mediastinum` | topographic / `cavity` | Anterior mediastinum | ... | Narrow space between the sternal body and the pericardium below the sternal-angle plane; contains the inferior thymus, fat, and sternopericardial ligaments. | Smallest inferior subdivision.<br>Site of thymic remnants/pathology. | 2 | `middle-mediastinum`, `posterior-mediastinum`, `superior-mediastinum` | ? | procedural (schematic) |
| `mediastinum` | `middle-mediastinum` | topographic / `cavity` | Middle mediastinum | ... | Central inferior compartment containing the heart, pericardium, roots of the great vessels, main bronchi and phrenic nerves. | Contains the heart & pericardium (`heart` module).<br>Phrenic nerves run on its lateral walls. | 2 | `anterior-mediastinum`, `posterior-mediastinum`, `superior-mediastinum` | ? | procedural (schematic) |
| `mediastinum` | `posterior-mediastinum` | topographic / `cavity` | Posterior mediastinum | ... | Compartment behind the pericardium containing the descending thoracic aorta, oesophagus & plexus, azygos/hemiazygos veins, thoracic duct and sympathetic-related splanchnic nerves. | Descending aorta, oesophagus and thoracic duct run together here.<br>Azygos vein ascends on its right. | 2 | `anterior-mediastinum`, `middle-mediastinum`, `superior-mediastinum` | ? | procedural (schematic) |

### Arteries & arterial great vessels (11)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `mediastinum` | `ascending-aorta` | cardiovascular / `artery` | Ascending aorta | proximal aorta | Intrapericardial aorta (~5 cm) rising from the LV behind the pulmonary trunk to the right of the sternum, becoming the arch at the right 2nd sternocostal joint; root bears the aortic sinuses. | Only branches are the coronary arteries.<br>Dissection here → tamponade or coronary compromise. | 1 | `arch-of-aorta`, `descending-thoracic-aorta`, `pulmonary-trunk` | ? | YES (real mesh) |
| `mediastinum` | `arch-of-aorta` | cardiovascular / `artery` | Arch of the aorta | aortic arch | Curves posterosuperiorly and left over the left main bronchus from the right side of the sternal angle to the left of the T4/T5 disc, giving three branches. | Branch order: brachiocephalic trunk → left common carotid → left subclavian.<br>Ligamentum arteriosum & left RLN hook beneath it (aortopulmonary window). | 1 | `ascending-aorta`, `descending-thoracic-aorta`, `brachiocephalic-trunk` | ? | YES (real mesh) |
| `mediastinum` | `brachiocephalic-trunk` | cardiovascular / `artery` | Brachiocephalic trunk | innominate artery | First and largest arch branch, ascending behind the manubrium to the right sternoclavicular joint where it divides into the right common carotid and right subclavian arteries. | Exists only on the right.<br>May give the thyroidea ima artery. | 1 | `left-common-carotid-artery`, `left-subclavian-artery`, `arch-of-aorta` | ? | YES (real mesh) |
| `mediastinum` | `left-common-carotid-artery` | cardiovascular / `artery` | Left common carotid artery | left CCA | Second arch branch, ascending through the superior mediastinum into the neck, left of the trachea; no thoracic branches. | Arises directly from the arch (unlike the right CCA).<br>Lies anterior then lateral to the trachea. | 2 | `brachiocephalic-trunk`, `left-subclavian-artery`, `arch-of-aorta` | ? | YES (real mesh) |
| `mediastinum` | `left-subclavian-artery` | cardiovascular / `artery` | Left subclavian artery | left subclavian | Third and most posterior arch branch, ascending toward the neck and grooving the mediastinal surface of the left lung; gives the internal thoracic artery and costocervical trunk. | Coarctation is classically distal to its origin.<br>Source of the internal thoracic & (via costocervical) supreme intercostal arteries. | 2 | `left-common-carotid-artery`, `brachiocephalic-trunk`, `descending-thoracic-aorta` | ? | YES (real mesh) |
| `mediastinum` | `ligamentum-arteriosum` | cardiovascular / `ligament` | Ligamentum arteriosum | ... | Fibrous remnant of the ductus arteriosus linking the aortic arch/isthmus to the bifurcation/left pulmonary artery. | Left RLN hooks under the arch just lateral to it.<br>Marks the aortopulmonary window. | 2 | `arch-of-aorta`, `pulmonary-trunk`, `aortopulmonary-window` | ? | procedural (schematic) |
| `mediastinum` | `descending-thoracic-aorta` | cardiovascular / `artery` | Descending thoracic aorta | thoracic aorta | Continuation of the arch from the T4/T5 disc down the posterior mediastinum (left then midline of the vertebral bodies) to the aortic hiatus at T12; gives posterior intercostal, bronchial, oesophageal, pericardial and superior phrenic branches. | Passes behind the left lung root and left atrium.<br>Lower 9 pairs of posterior intercostal arteries arise here. | 1 | `arch-of-aorta`, `ascending-aorta`, `azygos-vein` | ? | YES (real mesh) |
| `mediastinum` | `pulmonary-trunk` | cardiovascular / `artery` | Pulmonary trunk | main pulmonary artery | Intrapericardial vessel from the RV, passing up and left of the ascending aorta, bifurcating at the sternal-angle plane into right and left pulmonary arteries. | Carries deoxygenated blood.<br>Ligamentum arteriosum tethers its bifurcation to the arch. | 1 | `ascending-aorta`, `right-pulmonary-artery`, `left-pulmonary-artery` | ? | YES (real mesh) |
| `mediastinum` | `right-pulmonary-artery` | cardiovascular / `artery` | Right pulmonary artery | RPA | Longer branch passing right behind the ascending aorta and SVC, anterior to the right main bronchus, to the right lung root. | At the hilum lies anterior to the bronchus (RALS: Right–Anterior).<br>Longer than the left. | 2 | `left-pulmonary-artery`, `pulmonary-trunk`, `pulmonary-veins` | ? | YES (real mesh) |
| `mediastinum` | `left-pulmonary-artery` | cardiovascular / `artery` | Left pulmonary artery | LPA | Shorter branch passing left, anterior to the descending aorta and superior to the left main bronchus, to the left lung root. | At the hilum lies superior to the bronchus (RALS: Left–Superior).<br>Ligamentum arteriosum attaches near its origin. | 2 | `right-pulmonary-artery`, `pulmonary-trunk`, `pulmonary-veins` | ? | YES (real mesh) |
| `mediastinum` | `aortopulmonary-window` | topographic / `cavity` | Aortopulmonary window | AP window | Space between the inferior aortic arch and the pulmonary bifurcation, traversed by the left recurrent laryngeal nerve and mediastinal nodes. | Nodal masses here compress the left RLN → hoarseness.<br>Radiological "window" on a frontal film. | 3 | `ligamentum-arteriosum`, `arch-of-aorta`, `pulmonary-trunk` | ? | procedural (schematic) |

### Venous great vessels & azygos system (9)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `mediastinum` | `superior-vena-cava` | cardiovascular / `vein` | Superior vena cava | SVC | Valveless vein formed behind the right 1st costal cartilage by the two brachiocephalic veins, descending to the RA behind the 3rd right cartilage; the azygos vein joins it before it pierces the pericardium. | Drains everything above the diaphragm except heart & lungs.<br>Lower half is intrapericardial. | 1 | `inferior-vena-cava`, `right-brachiocephalic-vein`, `azygos-vein` | ? | YES (real mesh) |
| `mediastinum` | `right-brachiocephalic-vein` | cardiovascular / `vein` | Right brachiocephalic vein | right innominate vein | Short vein formed behind the right SC joint by the right internal jugular and subclavian veins, descending almost vertically to join its fellow. | Shorter and more vertical than the left.<br>Receives right vertebral, internal thoracic and (often) 1st posterior intercostal veins. | 2 | `left-brachiocephalic-vein`, `superior-vena-cava`, `left-superior-intercostal-vein` | ? | YES (real mesh) |
| `mediastinum` | `left-brachiocephalic-vein` | cardiovascular / `vein` | Left brachiocephalic vein | left innominate vein | Longer vein crossing behind the manubrium from left to right to join the right brachiocephalic vein; receives both inferior thyroid veins and the left superior intercostal vein. | Rises above the manubrium in children (tracheostomy hazard).<br>Crosses anterior to the three arch branches. | 2 | `right-brachiocephalic-vein`, `superior-vena-cava`, `left-superior-intercostal-vein` | ? | YES (real mesh) |
| `mediastinum` | `inferior-vena-cava` | cardiovascular / `vein` | Inferior vena cava (thoracic part) | IVC | Enters through the caval opening (central tendon, T8) for a very short intrapericardial course into the RA. | Pierces the diaphragm at T8 with the right phrenic nerve.<br>Almost no thoracic tributaries. | 1 | `superior-vena-cava`, `azygos-vein`, `pulmonary-veins` | ? | YES (real mesh) |
| `mediastinum` | `pulmonary-veins` | cardiovascular / `vein` | Pulmonary veins | superior & inferior pulmonary veins | Usually four valveless veins (superior + inferior each side) returning oxygenated blood to the posterior left atrium. | Carry oxygenated blood despite being veins.<br>Right veins pass behind the SVC/RA. | 1 | `superior-vena-cava`, `azygos-vein`, `left-pulmonary-artery` | ? | YES (real mesh) |
| `mediastinum` | `azygos-vein` | cardiovascular / `vein` | Azygos vein | ... | Formed near L1–L2 (right ascending lumbar + right subcostal veins), enters through the aortic hiatus and ascends on the right of the vertebral bodies, arching over the right lung root at T4 into the SVC. | Receives the right posterior intercostals and the hemiazygos veins.<br>A key porto-caval/caval-caval collateral. | 2 | `hemiazygos-vein`, `accessory-hemiazygos-vein`, `superior-vena-cava` | ? | procedural (schematic) |
| `mediastinum` | `hemiazygos-vein` | cardiovascular / `vein` | Hemiazygos vein | ... | Left-sided vein from the left ascending lumbar/subcostal veins, ascending to ~T9 where it crosses the midline to join the azygos; drains the lower left (9th–11th) posterior intercostal veins. | Crosses behind the aorta/oesophagus/thoracic duct at ~T8–T9.<br>Mirrors the lower azygos on the left. | 2 | `accessory-hemiazygos-vein`, `azygos-vein`, `left-superior-intercostal-vein` | ? | procedural (schematic) |
| `mediastinum` | `accessory-hemiazygos-vein` | cardiovascular / `vein` | Accessory hemiazygos vein | ... | Descends on the left of the upper thoracic bodies draining the 4th–8th left posterior intercostal veins, crossing at ~T7–T8 to the azygos. | Drains the mid-left posterior intercostal veins.<br>May communicate with the left superior intercostal vein. | 3 | `hemiazygos-vein`, `azygos-vein`, `left-superior-intercostal-vein` | ? | procedural (schematic) |
| `mediastinum` | `left-superior-intercostal-vein` | cardiovascular / `vein` | Left superior intercostal vein | ... | Common trunk draining the upper (1st–3rd) left posterior intercostal veins, crossing the arch to end in the left brachiocephalic vein. | Runs across the aortic arch (between phrenic & vagus).<br>Drains the upper-left posterior intercostals. | 3 | `accessory-hemiazygos-vein`, `hemiazygos-vein`, `left-brachiocephalic-vein` | ? | procedural (schematic) |

### Visceral tubes, thymus & thoracic duct (8)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `mediastinum` | `trachea` | respiratory / `cartilage` | Trachea | windpipe | Midline airway from ~C6 to the sternal-angle plane, held open by C-shaped cartilage rings; deviates slightly right around the arch. | Bifurcates at the carina (~T4/T5, sternal angle).<br>Arch of aorta and left brachiocephalic vein are anterior relations. | 1 | `carina`, `oesophagus`, `right-main-bronchus` | ? | YES (real mesh) |
| `mediastinum` | `carina` | respiratory / `cartilage` | Carina | tracheal bifurcation | Keel-shaped cartilage at the tracheal bifurcation between the two main bronchi; a sensitive cough landmark. | Sits at the sternal-angle plane (~T4/T5).<br>Widened/distorted by subcarinal nodal disease. | 2 | `trachea`, `right-main-bronchus`, `left-main-bronchus` | ? | procedural (schematic) |
| `mediastinum` | `right-main-bronchus` | respiratory / `cartilage` | Right main bronchus | right primary bronchus | Wider, shorter, more vertical main bronchus to the right lung, passing below the azygos arch. | More vertical → inhaled foreign bodies lodge here.<br>Right pulmonary artery lies anterior at the hilum. | 1 | `left-main-bronchus`, `carina`, `trachea` | ? | YES (real mesh) |
| `mediastinum` | `left-main-bronchus` | respiratory / `cartilage` | Left main bronchus | left primary bronchus | Narrower, longer, more horizontal main bronchus passing below the aortic arch and anterior to the descending aorta to the left hilum. | Longer and more transverse than the right.<br>Passes under the arch (relation to left pulmonary artery/ligamentum arteriosum). | 1 | `right-main-bronchus`, `carina`, `trachea` | ? | YES (real mesh) |
| `mediastinum` | `oesophagus` | alimentary / `muscle` | Oesophagus | esophagus | Muscular tube descending behind the trachea and left atrium through the posterior mediastinum to the oesophageal hiatus (T10); related to the aorta, azygos and vagal plexus. | Left atrial enlargement or an aortic aneurysm can compress it.<br>Passes the hiatus at T10 with the vagal trunks. | 1 | `trachea`, `descending-thoracic-aorta`, `thoracic-duct` | ? | YES (real mesh) |
| `mediastinum` | `oesophageal-constrictions` | alimentary / `muscle` | Oesophageal constrictions | anatomical narrowings | The physiological narrowings where the oesophagus is compressed — cervical (cricopharyngeus), by the aortic arch, by the left main bronchus, and at the diaphragmatic hiatus. | Common sites of impaction and stricture.<br>Landmarks for endoscopy distances. | 3 | `oesophagus`, `arch-of-aorta`, `left-main-bronchus` | ? | procedural (schematic) |
| `mediastinum` | `thymus` | lymphatic / `gland` | Thymus | thymic gland | Bilobed lymphoid gland in the superior/anterior mediastinum behind the manubrium, large in the child and fatty-involuted in the adult; supplied by thymic branches of the internal thoracic. | Overlies the great vessels and pericardium.<br>Site of T-cell maturation; involutes after puberty. | 2 | `anterior-mediastinum`, `left-brachiocephalic-vein`, `thoracic-duct` | ? | YES (real mesh) |
| `mediastinum` | `thoracic-duct` | lymphatic / `vein` | Thoracic duct | ... | Main lymphatic channel ascending from the cisterna chyli through the aortic hiatus (T12), between the azygos vein and descending aorta, crossing left at ~T4/T5 to drain into the left venous angle. | Drains all the body except the right upper quadrant.<br>Injury → chylothorax. | 2 | `azygos-vein`, `descending-thoracic-aorta`, `oesophagus` | ? | procedural (schematic) |

---

## Module 4 — `thoracic-innervation`

The nerves of the thorax as a coherent system: the somatic intercostal nerves and their branches, the phrenic
and vagus nerves and recurrent laryngeal branches, the sympathetic trunk with splanchnic nerves and rami
communicantes, and the autonomic plexuses. All are drawn procedurally and placed relative to real meshes.

### Somatic — intercostal nerves & branches (10)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-innervation` | `intercostal-nerve` | nervous / `nerve` | Intercostal nerve (T1–T11) | anterior ramus of thoracic spinal nerve | Anterior ramus of a thoracic spinal nerve running in the costal groove between the internal and innermost intercostals, supplying the intercostal muscles, parietal pleura and overlying skin. | The **N** of the costal-groove VAN (lowest of the three).<br>Block/aspiration: stay near the lower rib's upper border to spare the bundle. | 1 | `subcostal-nerve`, `lateral-cutaneous-branch`, `anterior-cutaneous-branch` | ? | procedural (schematic) |
| `thoracic-innervation` | `subcostal-nerve` | nervous / `nerve` | Subcostal nerve (T12) | ... | Anterior ramus of T12 running below the 12th rib (not in an intercostal space) into the abdominal wall. | Named "subcostal" because it lies below rib 12.<br>Contributes to anterior abdominal wall innervation. | 2 | `intercostal-nerve`, `posterior-ramus`, `lateral-cutaneous-branch` | ? | procedural (schematic) |
| `thoracic-innervation` | `posterior-ramus` | nervous / `nerve` | Posterior ramus | dorsal ramus | Branch given off as the spinal nerve emerges, supplying the intrinsic (deep) back muscles and the skin either side of the midline. | Motor to intrinsic back muscles (deep group).<br>Does not enter the intercostal space. | 2 | `intercostal-nerve`, `collateral-branch`, `lateral-cutaneous-branch` | ? | procedural (schematic) |
| `thoracic-innervation` | `collateral-branch` | nervous / `nerve` | Collateral branch | ... | Small branch of the intercostal nerve given near the rib angle, running along the upper border of the rib below. | Parallels the main nerve on the lower rib.<br>Supplies intercostal muscle & parietal pleura. | 3 | `lateral-cutaneous-branch`, `anterior-cutaneous-branch`, `intercostal-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `lateral-cutaneous-branch` | nervous / `nerve` | Lateral cutaneous branch | ... | Largest cutaneous branch, piercing the wall in the mid-axillary line and dividing into anterior and posterior branches for the overlying skin. | The largest branch of the intercostal nerve.<br>T1 has none; T2 branch = intercostobrachial. | 2 | `anterior-cutaneous-branch`, `collateral-branch`, `intercostobrachial-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `anterior-cutaneous-branch` | nervous / `nerve` | Anterior cutaneous branch | ... | Terminal cutaneous branch emerging parasternally (upper spaces) or on the anterior abdominal wall (T7–T12) to supply midline skin. | Upper six = thoracic; T7–T12 = thoraco-abdominal (supply abdominal skin).<br>Emerge lateral to the sternum/linea alba. | 2 | `lateral-cutaneous-branch`, `collateral-branch`, `intercostal-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `intercostobrachial-nerve` | nervous / `nerve` | Intercostobrachial nerve | ... | Lateral cutaneous branch of T2 (± T3) that joins the medial cutaneous nerve of the arm to supply the axilla and medial upper arm. | Explains axillary/medial-arm referral & post-mastectomy numbness.<br>Communicates with the brachial plexus. | 3 | `lateral-cutaneous-branch`, `intercostal-nerve`, `anterior-cutaneous-branch` | ? | procedural (schematic) |
| `thoracic-innervation` | `dermatomes` | nervous / `nerve` | Thoracic dermatomes | thoracic sensory levels | The segmental skin fields of the thoracic anterior rami — T2 at the sternal angle/clavicle line, **T4 nipple, T6 xiphoid, T10 umbilicus**. | Classic landmark levels (T4 nipple, T10 umbilicus).<br>Overlap makes single-level loss subtle. | 2 | `anterior-cutaneous-branch`, `lateral-cutaneous-branch`, `intercostal-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `white-ramus-communicans` | nervous / `nerve` | White ramus communicans | ... | Myelinated **preganglionic** sympathetic connection from a T1–L2 anterior ramus to the sympathetic trunk. | Present **only** at T1–L2 (lateral horn levels).<br>Carries preganglionic (myelinated) fibres. | 2 | `gray-ramus-communicans`, `sympathetic-trunk`, `greater-splanchnic-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `gray-ramus-communicans` | nervous / `nerve` | Gray ramus communicans | ... | Unmyelinated **postganglionic** sympathetic connection from the trunk back to every spinal nerve for distribution to the body wall. | Present at **all** spinal levels.<br>Carries postganglionic (unmyelinated) fibres. | 2 | `white-ramus-communicans`, `sympathetic-trunk`, `intercostal-nerve` | ? | procedural (schematic) |

### Phrenic & vagus (4)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-innervation` | `right-phrenic-nerve` | nervous / `nerve` | Right phrenic nerve | ... | C3–C5 nerve descending lateral to the right brachiocephalic vein, SVC and right atrium (anterior to the lung root) to the diaphragm, passing through the caval opening. | Motor to its own hemidiaphragm; sensory to fibrous/parietal pericardium & pleura.<br>Passes through the **caval opening (T8)**. | 2 | `left-phrenic-nerve`, `right-vagus-nerve`, `left-vagus-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `left-phrenic-nerve` | nervous / `nerve` | Left phrenic nerve | ... | C3–C5 nerve descending over the aortic arch, lateral to the left vagus, anterior to the lung root and over the pericardium (lateral to the LV) to pierce the diaphragm near the apex. | Lies lateral to the vagus on the arch.<br>Pierces the diaphragm near the cardiac apex (not the caval opening). | 2 | `right-phrenic-nerve`, `left-vagus-nerve`, `right-vagus-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `right-vagus-nerve` | nervous / `nerve` | Right vagus nerve | CN X (right) | Enters the thorax in front of the right subclavian artery, runs on the right of the trachea behind the SVC, gives the right recurrent laryngeal nerve, then forms the posterior oesophageal plexus → posterior gastric nerve. | Right RLN loops under the **right subclavian artery**.<br>Contributes to pulmonary, cardiac & oesophageal plexuses. | 2 | `left-vagus-nerve`, `right-phrenic-nerve`, `right-recurrent-laryngeal-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `left-vagus-nerve` | nervous / `nerve` | Left vagus nerve | CN X (left) | Descends between the left common carotid and subclavian arteries, crosses the aortic arch (giving the left recurrent laryngeal nerve), passes behind the lung root and forms the anterior oesophageal plexus → anterior gastric nerve. | Gives the left RLN at the arch.<br>Parasympathetic to thoracic & upper abdominal viscera. | 2 | `right-vagus-nerve`, `left-phrenic-nerve`, `left-recurrent-laryngeal-nerve` | ? | procedural (schematic) |

### Recurrent laryngeal nerves (2)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-innervation` | `left-recurrent-laryngeal-nerve` | nervous / `nerve` | Left recurrent laryngeal nerve | left RLN | Branch of the left vagus hooking **under the aortic arch** just lateral to the ligamentum arteriosum, ascending in the tracheo-oesophageal groove to the larynx. | A content of the superior mediastinum (longer than the right).<br>Compressed in the AP window (nodes, LA enlargement, aneurysm) → hoarseness. | 2 | `right-recurrent-laryngeal-nerve`, `left-vagus-nerve`, `right-vagus-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `right-recurrent-laryngeal-nerve` | nervous / `nerve` | Right recurrent laryngeal nerve | right RLN | Branch of the right vagus hooking under the **right subclavian artery** and ascending to the larynx; barely enters the thorax. | Loops at the neck root, not the mediastinum (unlike the left).<br>Shorter course than the left. | 2 | `left-recurrent-laryngeal-nerve`, `right-vagus-nerve`, `left-vagus-nerve` | ? | procedural (schematic) |

### Sympathetic trunk & splanchnic nerves (5)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-innervation` | `sympathetic-trunk` | nervous / `nerve` | Thoracic sympathetic trunk & ganglia | paravertebral chain | Paired ganglionated chains on the heads of the ribs (upper) and vertebral bodies (lower), ~11–12 ganglia joined by interganglionic fibres, continuous with the cervical and lumbar trunks. | Upper ganglia lie on rib heads; lower on the vertebral bodies.<br>Upper five give cardiac/pulmonary/oesophageal branches; lower seven give the splanchnics. | 2 | `cervicothoracic-ganglion`, `greater-splanchnic-nerve`, `white-ramus-communicans` | ? | procedural (schematic) |
| `thoracic-innervation` | `cervicothoracic-ganglion` | nervous / `nerve` | Cervicothoracic (stellate) ganglion | stellate ganglion | Fusion of the inferior cervical and first thoracic ganglia at the neck of the first rib. | Common fusion (stellate) supplying head, neck & upper limb sympathetics.<br>Lies on the neck of rib 1. | 3 | `sympathetic-trunk`, `greater-splanchnic-nerve`, `lesser-splanchnic-nerve` | ? | procedural (schematic) |
| `thoracic-innervation` | `greater-splanchnic-nerve` | nervous / `nerve` | Greater splanchnic nerve | ... | Preganglionic sympathetic nerve from **T5–T9** ganglia, descending medially to pierce the crus and synapse in the coeliac ganglion. | Preganglionic (myelinated) to the coeliac ganglion.<br>T5–T9 origin. | 2 | `lesser-splanchnic-nerve`, `least-splanchnic-nerve`, `sympathetic-trunk` | ? | procedural (schematic) |
| `thoracic-innervation` | `lesser-splanchnic-nerve` | nervous / `nerve` | Lesser splanchnic nerve | ... | Preganglionic nerve from **T9–T11** ganglia to the aorticorenal ganglion. | Synapses in the aorticorenal ganglion.<br>T9–T11 origin, lateral to the greater. | 3 | `greater-splanchnic-nerve`, `least-splanchnic-nerve`, `sympathetic-trunk` | ? | procedural (schematic) |
| `thoracic-innervation` | `least-splanchnic-nerve` | nervous / `nerve` | Least (lowest) splanchnic nerve | ... | Preganglionic nerve from the **T12** (lowest) ganglion piercing the crus to the renal plexus/ganglion. | Lowest, most lateral splanchnic.<br>Joins the renal plexus. | 3 | `lesser-splanchnic-nerve`, `greater-splanchnic-nerve`, `sympathetic-trunk` | ? | procedural (schematic) |

### Autonomic plexuses (4)

| moduleKey | id | system / tissue | label | aliases | description | keyPoints | difficulty | distractorIds | proposedFMA | realOrSchematic |
|---|---|---|---|---|---|---|---:|---|---|---|
| `thoracic-innervation` | `superficial-cardiac-plexus` | nervous / `nerve` | Superficial cardiac plexus | ... | Small plexus below the aortic arch (right of the ligamentum arteriosum) from the left sympathetic cardiac branch and left vagal (inferior cervical) cardiac branch. | Lies at the inferior arch border, right of the ligamentum arteriosum.<br>Sympathetic ↑ rate/force; parasympathetic ↓. | 3 | `deep-cardiac-plexus`, `pulmonary-plexus`, `oesophageal-plexus` | ? | procedural (schematic) |
| `thoracic-innervation` | `deep-cardiac-plexus` | nervous / `nerve` | Deep cardiac plexus | ... | Larger plexus anterior to the tracheal bifurcation, behind the arch, from both sympathetic trunks and both vagi (except the superficial contributors). | Sits in front of the carina, behind the arch.<br>Cardiac ischaemic pain refers via T1–T5 sympathetic afferents to the left chest/arm. | 3 | `superficial-cardiac-plexus`, `pulmonary-plexus`, `oesophageal-plexus` | ? | procedural (schematic) |
| `thoracic-innervation` | `pulmonary-plexus` | nervous / `nerve` | Pulmonary plexus | ... | Anterior and (larger) posterior plexuses at each lung root from the vagus and sympathetic trunk. | Vagal = bronchoconstriction/secretion; sympathetic = bronchodilation.<br>Located at the hila, mostly posterior. | 3 | `oesophageal-plexus`, `deep-cardiac-plexus`, `superficial-cardiac-plexus` | ? | procedural (schematic) |
| `thoracic-innervation` | `oesophageal-plexus` | nervous / `nerve` | Oesophageal plexus | esophageal plexus | Network on the lower oesophagus from both vagi (after the pulmonary plexuses) and sympathetic fibres, reforming as the anterior (left) & posterior (right) vagal trunks. | Left vagus → anterior trunk; right vagus → posterior trunk.<br>Trunks pass the oesophageal hiatus at T10. | 3 | `pulmonary-plexus`, `deep-cardiac-plexus`, `left-vagus-nerve` | ? | procedural (schematic) |

---

## Final module list & counts

### Per-module totals

| moduleKey | title | count |
|---|---|---:|
| `thoracic-wall` | Thoracic skeleton, wall & diaphragm | 44 |
| `heart` | Heart, valves, coronaries, conduction & pericardium | 48 |
| `mediastinum` | Mediastinum, great vessels & viscera | 32 |
| `thoracic-innervation` | Thoracic nerves & autonomics | 25 |
| **Region total** | | **149** |

### `thoracic-wall` (44) — by sub-group

| sub-group | count |
|---|---:|
| Skeleton (vertebrae, ribs, sternum) | 14 |
| Apertures, membranes & fascia | 4 |
| Joints & ligaments | 6 |
| Muscles | 13 |
| Wall vasculature | 7 |

### `heart` (48) — by sub-group

| sub-group | count |
|---|---:|
| Chambers, walls & internal features | 17 |
| Valves & fibrous skeleton | 5 |
| External surfaces, borders & sulci | 5 |
| Coronary vessels | 10 |
| Conduction system | 5 |
| Pericardium | 6 |

### `mediastinum` (32) — by sub-group

| sub-group | count |
|---|---:|
| Mediastinal divisions | 4 |
| Arteries & arterial great vessels | 11 |
| Venous great vessels & azygos system | 9 |
| Visceral tubes, thymus & thoracic duct | 8 |

### `thoracic-innervation` (25) — by sub-group

| sub-group | count |
|---|---:|
| Somatic (intercostal nerves & branches) | 10 |
| Phrenic & vagus | 4 |
| Recurrent laryngeal nerves | 2 |
| Sympathetic trunk & splanchnics | 5 |
| Autonomic plexuses | 4 |

### Per-engine-tissue totals (whole region)

| tissue | count | notes |
|---|---:|---|
| `bone` | 11 | vertebrae, ribs, manubrium/body/xiphoid/jugular-notch |
| `cartilage` | 12 | costal cartilage/margin, sternal angle, disc, costal & SC joints, trachea/carina/bronchi |
| `muscle` | 27 | wall + accessory + pectoral/serratus muscles, diaphragm, oesophagus, cardiac walls/septa/pectinate/trabeculae/conduction |
| `ligament` | 4 | radiate ligament, ligamentum arteriosum, cardiac skeleton, chordae tendineae |
| `membrane` | 11 | suprapleural/endothoracic, valves, IVC/coronary-sinus valves, pericardial serous layers |
| `nerve` | 25 | all of `thoracic-innervation` |
| `artery` | 20 | wall (5) + coronary (6) + arterial great vessels (9) |
| `vein` | 16 | wall (2) + cardiac (4) + venous great vessels/azygos (9) + thoracic duct (1) |
| `cavity` | 22 | apertures, mediastinal divisions/AP window, chambers, auricle, surfaces, conus/vestibule, pericardial spaces |
| `gland` | 1 | thymus |
| `fat` | 0 | none warranted (epicardial fat folded into descriptions) |

> Tissue counts are approximate groupings for asset planning; a few rows sit at a tissue boundary (e.g. the
> valves are `membrane`, conduction tissue is `muscle`, the thoracic duct is coloured as `vein`). The
> authoritative per-structure tissue is the `system / tissue` column above.

---

## Reconciliation notes — what the transcripts emphasise that the heart-only `cvs` model was missing

The current `cvs` model (`docs/anatomy3d/regions/cvs.md`, 45 structures) is an accurate **heart + great-vessel**
scope but only covers roughly one of the four blocks the course actually examines. Grounding in the transcripts
surfaces the following gaps, now filled by the four thorax modules:

1. **The whole bony/muscular wall is absent from `cvs`.** Five bone lectures (A1–A5) and two muscle lectures
   (M1–M2) — the largest single block of the course — cover the thoracic cage in depth: typical vs **atypical
   vertebrae** (T1, T9–T12) and **ribs** (1st, 2nd, floating), demifacets/costal facets, the **sternum**
   (manubrium/body/xiphoid) with the **sternal angle** as the master rib-counting and mediastinal-boundary
   landmark, **costal cartilages/margin**, the costovertebral/costotransverse/sternocostal joints, the two
   **thoracic apertures**, the **suprapleural membrane**, and the three-layer **intercostal muscles**
   (+ transversus thoracis, subcostals, levatores costarum, serratus posterior, serratus anterior, pectoral
   muscles) and the **diaphragm**. `cvs` has none of these → the new `thoracic-wall` module.

2. **Breathing mechanics and rib-motion landmarks.** The transcripts stress **pump-handle** (AP) and
   **bucket-handle** (transverse) rib movements, diaphragm-driven vertical change, and the diaphragm openings
   (**IVC T8, oesophagus T10, aorta T12**). These drive the wall module's key points.

3. **Wall neurovascular bundle.** The neurovascular lectures teach the **VAN order** in the costal groove, the
   **internal thoracic artery** and its branches (anterior intercostal, musculophrenic, superior epigastric,
   pericardiacophrenic, thymic), the **anterior vs posterior intercostal** arteries (upper 2 from the
   costocervical/supreme intercostal, lower 9 from the thoracic aorta), the "**needle above the lower rib**"
   rule, and **aortic coarctation → rib notching** — none of which appear in `cvs`.

4. **Heart-interior detail beyond chambers/valves.** The heart lectures (A/B/C) emphasise the **right-atrial
   interior** (crista terminalis / sulcus terminalis, pectinate muscle, sinus venarum, fossa ovalis + limbus,
   **valve of the IVC**, **valve of the coronary sinus**, right auricle), the **trabeculae carneae** (ridge/
   bridge/papillary) and **conus arteriosus/infundibulum**, the **aortic vestibule**, the **fibrous cardiac
   skeleton** (four rings + right/left fibrous trigones, with its electrical-insulation role), the **surfaces
   and borders** (apex at the left 5th space, base, sternocostal & diaphragmatic surfaces, coronary/
   interventricular sulci), and the **middle/small cardiac veins**. `cvs` collapses most of these into a few
   rows — the `heart` module restores them while keeping `cvs`'s chamber/valve/coronary/conduction/pericardium
   backbone.

5. **Great vessels belong to the mediastinum, not the heart.** The mediastinum lecture (A2) teaches the
   ascending aorta, arch (+ 3 branches), and descending thoracic aorta as one unit, plus the pulmonary trunk/
   arteries, brachiocephalic veins, SVC/IVC and pulmonary veins. **These IDs move from `cvs` into
   `mediastinum`** so they are not duplicated across the region; the `heart` module shows only their
   intrapericardial roots and defers the vessels themselves as quiz targets to `mediastinum`.

6. **The whole azygos venous system and posterior-mediastinal viscera are new.** The venous lecture (V2/B)
   details the **azygos / hemiazygos / accessory hemiazygos** veins, the **left superior intercostal vein**,
   and brachiocephalic-vein formation; the mediastinum lectures add the **trachea/carina/main bronchi**,
   **oesophagus** (+ constrictions), **thymus**, **thoracic duct**, the **mediastinal divisions**, and the
   **aortopulmonary window** — all absent from `cvs`.

7. **Thoracic innervation is an entire block `cvs` omits.** The neurovascular and mediastinum lectures give a
   full nervous-system tour: **intercostal nerves** and branches (posterior ramus, collateral, lateral &
   anterior cutaneous, **intercostobrachial**), **dermatomes** (T4 nipple, T10 umbilicus), **rami
   communicantes** (white T1–L2 preganglionic vs gray at all levels), **phrenic** (C3–C5; right through the
   caval opening, left piercing near the apex; pericardial sensation → shoulder-tip referral), **vagus** and
   **recurrent laryngeal** nerves (left under the arch/ligamentum arteriosum → hoarseness; right under the
   subclavian), the **sympathetic trunk** (stellate ganglion; upper-5 vs lower-7 branching), the **greater/
   lesser/least splanchnic** nerves (T5–T9 / T9–T11 / T12), and the **cardiac/pulmonary/oesophageal plexuses**
   (superficial vs deep cardiac). This is the `thoracic-innervation` module.

8. **Design choice for MCQ integrity.** `distractorIds` are kept **within-module** (matching the seeded
   `quiz.mjs`, which draws distractors from the current module), and every ID is unique across all four
   modules so the four manifests can register in one region without collision. The intercostal neurovascular
   bundle is deliberately split (vessels in `thoracic-wall`, nerve in `thoracic-innervation`) because the two
   halves colour differently and belong to different 3D models, with the VAN mnemonic carried on both sides.
