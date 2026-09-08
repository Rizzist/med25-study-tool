import { imageMeshStructures } from "../image-mesh-structures.mjs";
import { practicalMeshStructures } from "../practical-mesh-structures.mjs";
import { practicalLandmarkStructures } from "../practical-landmarks.mjs";
import { upperLimbDetailStructures } from "../limb-detail-structures.mjs";
import { upperLimbNerveDetailStructures } from "../limb-nerve-structures.mjs";

/**
 * REAL (mesh-backed) upper-limb manifest.
 *
 * The bones, muscles and major arteries/veins map 1:1 to named nodes in the core GLB plus the
 * v4.3 high-detail OBJ supplement, built from BodyParts3D segmented meshes for the RIGHT upper limb.
 *   Attribution (required, CC-BY 4.0):
 *   "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * BodyParts3D has no segmented brachial-plexus / peripheral-nerve, joint-capsule, ligament, palmar
 * arch or median-cubital-vein meshes, so those are authored procedurally in the factory
 * (`userData.schematic = true`) and routed relative to the real bones/muscles. Those structures carry
 * `schematic: true` here. Compound bones (carpals / metacarpals / phalanges) and multi-head muscles
 * are grouped into ONE selectable node per structureId.
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const upperLimbManifest = {
  id: "upper-limb",
  region: "upper-limb",
  modelKey: "upper-limb",
  title: "Upper limb",
  subject: "anatomy",
  blurb:
    "Right upper limb: individually selectable carpals and muscle components from BodyParts3D. Bone-landmark pins, nerves, joints and ligament overlays are diagrammatic; use the labeled book figures for fine surface anatomy and structures not separately segmented.",
  structures: [
    // ---- Bones (real) ---------------------------------------------------------------------------
    {
      id: "scapula",
      label: "Scapula",
      shortLabel: "Scapula",
      aliases: ["shoulder blade"],
      tissue: "bone",
      description:
        "A triangular flat bone on the posterolateral thoracic wall, spanning roughly ribs 2–7; its lateral angle bears the glenoid cavity and its spine expands into the acromion.",
      keyPoints: [
        "The glenoid is shallow and faces laterally, slightly anteriorly and superiorly.",
        "Long thoracic nerve injury produces medial winging by disabling serratus anterior.",
      ],
      difficulty: 1,
      distractorIds: ["clavicle", "humerus", "carpal-bones"],
      view: { azimuth: 3.14159, elevation: 0.16, zoom: 1.15 },
    },
    {
      id: "clavicle",
      label: "Clavicle",
      shortLabel: "Clavicle",
      aliases: ["collarbone"],
      tissue: "bone",
      description:
        "An S-shaped subcutaneous strut between the manubrium and acromion that holds the upper limb away from the trunk and transmits load to the axial skeleton.",
      keyPoints: [
        "The common fracture site is the junction of the middle and lateral thirds.",
        "The medial fragment is elevated by sternocleidomastoid while the limb pulls the lateral fragment downward.",
      ],
      difficulty: 1,
      distractorIds: ["scapula", "humerus", "radius"],
      view: { azimuth: 0.2, elevation: 0.32, zoom: 1.2 },
    },
    {
      id: "humerus",
      label: "Humerus",
      shortLabel: "Humerus",
      aliases: ["arm bone"],
      tissue: "bone",
      description:
        "The long bone of the arm, articulating with the glenoid proximally and the radius and ulna distally; key landmarks include the surgical neck, radial groove and medial epicondyle.",
      keyPoints: [
        "Surgical-neck fractures endanger the axillary nerve and posterior circumflex humeral artery.",
        "Midshaft fractures can injure the radial nerve in the radial groove.",
      ],
      difficulty: 1,
      distractorIds: ["radius", "ulna", "clavicle"],
      view: { azimuth: 0.3, elevation: 0.05, zoom: 1.05 },
    },
    {
      id: "radius",
      label: "Radius",
      shortLabel: "Radius",
      aliases: ["lateral forearm bone"],
      tissue: "bone",
      description:
        "The lateral forearm bone in anatomical position, with a disc-shaped head proximally and a broad distal end that articulates with the scaphoid and lunate.",
      keyPoints: [
        "The radial head rotates within the annular ligament during pronation and supination.",
        "A distal-radius Colles fracture classically follows a fall on the outstretched hand.",
      ],
      difficulty: 1,
      distractorIds: ["ulna", "humerus", "metacarpals"],
      view: { azimuth: 0.4, elevation: 0.0, zoom: 1.2 },
    },
    {
      id: "ulna",
      label: "Ulna",
      shortLabel: "Ulna",
      aliases: ["medial forearm bone"],
      tissue: "bone",
      description:
        "The medial forearm bone, whose olecranon and coronoid process form the trochlear notch around the humeral trochlea; its distal head is separated from the carpus by an articular disc.",
      keyPoints: [
        "The ulna is the principal stabilizing bone of the forearm at the elbow.",
        "A Monteggia injury combines proximal ulnar fracture with radial-head dislocation.",
      ],
      difficulty: 1,
      distractorIds: ["radius", "humerus", "carpal-bones"],
      view: { azimuth: 2.9, elevation: 0.0, zoom: 1.2 },
    },
    {
      id: "carpal-bones",
      label: "Carpal bones",
      shortLabel: "Carpals",
      aliases: [
        "carpus",
        "wrist bones",
        "scaphoid",
        "lunate",
        "triquetrum",
        "pisiform",
        "trapezium",
        "trapezoid",
        "capitate",
        "hamate",
      ],
      tissue: "bone",
      description:
        "Eight short bones arranged in proximal and distal rows form the carpus between the forearm and metacarpals.",
      keyPoints: [
        "Scaphoid fracture can compromise the proximal pole because most blood enters distally.",
        "A lunate dislocation may compress the median nerve in the carpal tunnel.",
      ],
      difficulty: 2,
      distractorIds: ["metacarpals", "hand-phalanges", "radius"],
      view: { azimuth: 0.3, elevation: 0.35, zoom: 1.9 },
    },
    {
      id: "metacarpals",
      label: "Metacarpals",
      shortLabel: "Metacarpals",
      aliases: ["metacarpal bones", "metacarpus"],
      tissue: "bone",
      description:
        "Five long bones form the palm, numbered I–V from thumb to little finger, with bases proximally and heads forming the knuckles distally.",
      keyPoints: [
        "A fifth-metacarpal neck fracture is the classic boxer's fracture.",
        "The first metacarpal is short, mobile and rotated relative to the others for opposition.",
      ],
      difficulty: 1,
      distractorIds: ["carpal-bones", "hand-phalanges", "radius"],
      view: { azimuth: 0.2, elevation: 0.4, zoom: 1.7 },
    },
    {
      id: "hand-phalanges",
      label: "Phalanges of the hand",
      shortLabel: "Phalanges",
      aliases: [
        "digital phalanges",
        "finger bones",
        "proximal phalanges",
        "middle phalanges",
        "distal phalanges",
      ],
      tissue: "bone",
      description:
        "Fourteen phalanges form the digits: the thumb has proximal and distal phalanges, while digits II–V each also have a middle phalanx.",
      keyPoints: [
        "Flexor digitorum superficialis inserts on middle phalanges and profundus on distal phalanges.",
        "The thumb has only two phalanges.",
      ],
      difficulty: 1,
      distractorIds: ["metacarpals", "carpal-bones", "ulna"],
      view: { azimuth: 0.2, elevation: 0.42, zoom: 1.8 },
    },

    // ---- Joints & ligaments (procedural) --------------------------------------------------------
    {
      id: "glenohumeral-joint",
      schematic: true,
      label: "Glenohumeral joint",
      shortLabel: "GH joint",
      aliases: ["shoulder joint"],
      tissue: "cartilage",
      description:
        "A synovial ball-and-socket joint between the humeral head and glenoid cavity, enclosed by a lax capsule that permits exceptional mobility.",
      keyPoints: [
        "Most dislocations are anteroinferior and may injure the axillary nerve.",
        "Dynamic stability depends heavily on the rotator cuff because the bony socket is shallow.",
      ],
      difficulty: 1,
      distractorIds: ["elbow-joint", "radiocarpal-joint", "radioulnar-joints"],
      view: { azimuth: 0.4, elevation: 0.12, zoom: 1.5 },
    },
    {
      id: "glenoid-labrum",
      schematic: true,
      label: "Glenoid labrum",
      shortLabel: "Labrum",
      aliases: ["glenoidal labrum"],
      tissue: "cartilage",
      description:
        "A fibrocartilaginous rim attached around the glenoid margin that deepens the socket while preserving glenohumeral mobility.",
      keyPoints: [
        "A Bankart lesion involves the anteroinferior labrum after anterior dislocation.",
        "A SLAP tear affects the superior labrum near the long-head biceps attachment.",
      ],
      difficulty: 2,
      distractorIds: ["glenohumeral-joint", "elbow-joint", "radiocarpal-joint"],
      view: { azimuth: 0.5, elevation: 0.1, zoom: 1.9 },
    },
    {
      id: "elbow-joint",
      schematic: true,
      label: "Elbow joint",
      shortLabel: "Elbow",
      aliases: ["cubital joint", "humeroulnar and humeroradial joints"],
      tissue: "cartilage",
      description:
        "A compound synovial hinge region in which the trochlea meets the trochlear notch and the capitulum meets the radial head within one capsule.",
      keyPoints: [
        "Flexion and extension occur chiefly at the humeroulnar articulation.",
        "In extension the epicondyles and olecranon form a straight line; in flexion, a triangle.",
      ],
      difficulty: 1,
      distractorIds: ["glenohumeral-joint", "radioulnar-joints", "radiocarpal-joint"],
      view: { azimuth: 0.4, elevation: 0.0, zoom: 1.6 },
    },
    {
      id: "radioulnar-joints",
      schematic: true,
      label: "Proximal and distal radioulnar joints",
      shortLabel: "Radioulnar jts",
      aliases: ["superior and inferior radioulnar joints", "PRUJ and DRUJ"],
      tissue: "cartilage",
      description:
        "Paired synovial pivot joints link the radius and ulna at both ends of the forearm, with the interosseous membrane coupling them between the joints.",
      keyPoints: [
        "Pronation and supination rotate the radius around a relatively fixed ulna.",
        "The radial head spins proximally while the distal radius sweeps around the ulnar head.",
      ],
      difficulty: 2,
      distractorIds: ["elbow-joint", "radiocarpal-joint", "glenohumeral-joint"],
      view: { azimuth: 0.5, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "radiocarpal-joint",
      schematic: true,
      label: "Radiocarpal joint",
      shortLabel: "Wrist joint",
      aliases: ["wrist joint"],
      tissue: "cartilage",
      description:
        "An ellipsoid synovial joint between the distal radius and articular disc proximally and the scaphoid, lunate and triquetrum distally.",
      keyPoints: [
        "The ulna does not directly articulate with the carpal bones.",
        "Flexion, extension and deviation are shared with the midcarpal joints.",
      ],
      difficulty: 2,
      distractorIds: ["radioulnar-joints", "elbow-joint", "glenohumeral-joint"],
      view: { azimuth: 0.3, elevation: 0.28, zoom: 1.9 },
    },
    {
      id: "coracoacromial-ligament",
      schematic: true,
      label: "Coracoacromial ligament",
      shortLabel: "CA ligament",
      aliases: ["coracoacromial arch ligament"],
      tissue: "ligament",
      description:
        "A strong triangular band from the coracoid process to the acromion that forms the roof of the coracoacromial arch above the humeral head.",
      keyPoints: [
        "It helps prevent superior displacement of the humeral head.",
        "The supraspinatus tendon and subacromial bursa can be impinged beneath the arch.",
      ],
      difficulty: 2,
      distractorIds: ["ulnar-collateral-ligament-elbow", "annular-ligament-radius", "glenohumeral-joint"],
      view: { azimuth: 0.4, elevation: 0.3, zoom: 1.8 },
    },
    {
      id: "ulnar-collateral-ligament-elbow",
      schematic: true,
      label: "Ulnar collateral ligament of the elbow",
      shortLabel: "UCL (elbow)",
      aliases: ["medial collateral ligament of elbow", "UCL"],
      tissue: "ligament",
      description:
        "A triangular medial ligament extending from the medial epicondyle to the coronoid process and olecranon, resisting valgus stress at the elbow.",
      keyPoints: [
        "Its anterior band is the principal valgus stabilizer during throwing.",
        "Reconstruction is commonly called Tommy John surgery.",
      ],
      difficulty: 2,
      distractorIds: ["annular-ligament-radius", "coracoacromial-ligament", "elbow-joint"],
      view: { azimuth: 1.4, elevation: 0.0, zoom: 1.9 },
    },
    {
      id: "annular-ligament-radius",
      schematic: true,
      label: "Annular ligament of the radius",
      shortLabel: "Annular lig.",
      aliases: ["orbicular ligament"],
      tissue: "ligament",
      description:
        "A strong ring attached to the anterior and posterior margins of the radial notch of the ulna, encircling and retaining the radial head.",
      keyPoints: [
        "It permits radial-head rotation during pronation and supination.",
        "Subluxation from the ligament produces nursemaid's elbow in young children.",
      ],
      difficulty: 2,
      distractorIds: ["ulnar-collateral-ligament-elbow", "coracoacromial-ligament", "radioulnar-joints"],
      view: { azimuth: 0.5, elevation: 0.0, zoom: 2.0 },
    },

    // ---- Muscles (real) -------------------------------------------------------------------------
    {
      id: "deltoid-muscle",
      label: "Deltoid muscle",
      shortLabel: "Deltoid",
      aliases: ["deltoid"],
      tissue: "muscle",
      description:
        "A thick multipennate muscle forming the rounded shoulder, arising from the lateral clavicle, acromion and scapular spine and inserting on the deltoid tuberosity.",
      keyPoints: [
        "Its middle fibres are the prime abductors from about 15–90 degrees after supraspinatus initiates the movement.",
        "It is supplied by the axillary nerve.",
      ],
      difficulty: 1,
      distractorIds: ["supraspinatus-muscle", "infraspinatus-muscle", "subscapularis-muscle"],
      view: { azimuth: -0.6, elevation: 0.1, zoom: 1.3 },
    },
    {
      id: "supraspinatus-muscle",
      label: "Supraspinatus muscle",
      shortLabel: "Supraspinatus",
      aliases: ["supraspinatus", "SITS muscle"],
      tissue: "muscle",
      description:
        "A rotator-cuff muscle arising in the supraspinous fossa, passing beneath the acromion and inserting on the superior facet of the greater tubercle.",
      keyPoints: [
        "It initiates the first roughly 15 degrees of abduction and then assists deltoid.",
        "Its tendon is the rotator-cuff tendon most often torn or impinged.",
      ],
      difficulty: 1,
      distractorIds: ["infraspinatus-muscle", "teres-minor-muscle", "subscapularis-muscle"],
      view: { azimuth: 3.14159, elevation: 0.4, zoom: 1.6 },
    },
    {
      id: "infraspinatus-muscle",
      label: "Infraspinatus muscle",
      shortLabel: "Infraspinatus",
      aliases: ["infraspinatus", "SITS muscle"],
      tissue: "muscle",
      description:
        "A broad rotator-cuff muscle occupying the infraspinous fossa and inserting on the middle facet of the greater tubercle.",
      keyPoints: [
        "It laterally rotates the humerus and stabilizes the humeral head.",
        "It is supplied by the suprascapular nerve.",
      ],
      difficulty: 2,
      distractorIds: ["supraspinatus-muscle", "teres-minor-muscle", "subscapularis-muscle"],
      view: { azimuth: 3.14159, elevation: 0.15, zoom: 1.6 },
    },
    {
      id: "teres-minor-muscle",
      label: "Teres minor muscle",
      shortLabel: "Teres minor",
      aliases: ["teres minor", "SITS muscle"],
      tissue: "muscle",
      description:
        "A narrow rotator-cuff muscle along the lateral scapular border that inserts on the inferior facet of the greater tubercle.",
      keyPoints: [
        "It laterally rotates and weakly adducts the arm.",
        "Unlike nearby teres major, it is supplied by the axillary nerve and is part of the cuff.",
      ],
      difficulty: 2,
      distractorIds: ["infraspinatus-muscle", "subscapularis-muscle", "deltoid-muscle"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.8 },
    },
    {
      id: "subscapularis-muscle",
      label: "Subscapularis muscle",
      shortLabel: "Subscapularis",
      aliases: ["subscapularis", "SITS muscle"],
      tissue: "muscle",
      description:
        "A broad rotator-cuff muscle filling the subscapular fossa on the anterior scapula and inserting on the lesser tubercle of the humerus.",
      keyPoints: [
        "It is the cuff's principal medial rotator and reinforces the anterior capsule.",
        "The upper and lower subscapular nerves supply it.",
      ],
      difficulty: 2,
      distractorIds: ["supraspinatus-muscle", "infraspinatus-muscle", "teres-minor-muscle"],
      view: { azimuth: 0.4, elevation: 0.1, zoom: 1.7 },
    },
    {
      id: "biceps-brachii-muscle",
      label: "Biceps brachii muscle",
      shortLabel: "Biceps",
      aliases: ["biceps", "biceps of arm"],
      tissue: "muscle",
      description:
        "A two-headed anterior arm muscle whose long head arises from the supraglenoid tubercle and short head from the coracoid, joining to insert on the radial tuberosity and bicipital aponeurosis.",
      keyPoints: [
        "It is a powerful supinator and elbow flexor, especially with the forearm supinated.",
        "The long-head tendon runs in the intertubercular sulcus and is prone to tendinopathy or rupture.",
      ],
      difficulty: 1,
      distractorIds: ["brachialis-muscle", "triceps-brachii-muscle", "flexor-carpi-radialis-muscle"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.3 },
    },
    {
      id: "brachialis-muscle",
      label: "Brachialis muscle",
      shortLabel: "Brachialis",
      aliases: ["brachialis"],
      tissue: "muscle",
      description:
        "A deep anterior arm muscle from the distal anterior humerus to the ulnar tuberosity and coronoid process.",
      keyPoints: [
        "It is the primary elbow flexor in every forearm position because it inserts on the ulna.",
        "It is mainly musculocutaneous-nerve supplied, with a small radial contribution laterally.",
      ],
      difficulty: 1,
      distractorIds: ["biceps-brachii-muscle", "triceps-brachii-muscle", "pronator-teres-muscle"],
      view: { azimuth: 0.2, elevation: 0.0, zoom: 1.4 },
    },
    {
      id: "triceps-brachii-muscle",
      label: "Triceps brachii muscle",
      shortLabel: "Triceps",
      aliases: ["triceps", "triceps of arm"],
      tissue: "muscle",
      description:
        "A three-headed posterior arm muscle converging on the olecranon, with the long head arising from the infraglenoid tubercle and the other heads from the posterior humerus.",
      keyPoints: [
        "It is the principal elbow extensor and is supplied by the radial nerve.",
        "The long head also extends and adducts the arm at the shoulder.",
      ],
      difficulty: 1,
      distractorIds: ["biceps-brachii-muscle", "brachialis-muscle", "extensor-digitorum-muscle"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.3 },
    },
    {
      id: "pronator-teres-muscle",
      label: "Pronator teres muscle",
      shortLabel: "Pronator teres",
      aliases: ["pronator teres"],
      tissue: "muscle",
      description:
        "A superficial proximal forearm muscle with humeral and ulnar heads that crosses to the lateral midshaft of the radius.",
      keyPoints: [
        "It pronates the forearm and weakly flexes the elbow.",
        "The median nerve passes between its heads and can be compressed there.",
      ],
      difficulty: 2,
      distractorIds: ["flexor-carpi-radialis-muscle", "flexor-carpi-ulnaris-muscle", "extensor-carpi-radialis-muscles"],
      view: { azimuth: 0.3, elevation: 0.0, zoom: 1.6 },
    },
    {
      id: "flexor-carpi-radialis-muscle",
      label: "Flexor carpi radialis muscle",
      shortLabel: "FCR",
      aliases: ["FCR"],
      tissue: "muscle",
      description:
        "A superficial anterior forearm muscle from the medial epicondyle to the bases of the second and third metacarpals on the radial side.",
      keyPoints: [
        "It flexes and abducts the wrist.",
        "Its tendon is a useful surface landmark for the radial artery at the wrist.",
      ],
      difficulty: 2,
      distractorIds: ["flexor-carpi-ulnaris-muscle", "flexor-digitorum-superficialis-muscle", "extensor-carpi-radialis-muscles"],
      view: { azimuth: 0.3, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "flexor-carpi-ulnaris-muscle",
      label: "Flexor carpi ulnaris muscle",
      shortLabel: "FCU",
      aliases: ["FCU"],
      tissue: "muscle",
      description:
        "A superficial anterior forearm muscle with humeral and ulnar heads, inserting through the pisiform onto the hamate and fifth metacarpal.",
      keyPoints: [
        "It flexes and adducts the wrist.",
        "It is the only superficial forearm flexor supplied by the ulnar nerve, which enters between its two heads.",
      ],
      difficulty: 2,
      distractorIds: ["flexor-carpi-radialis-muscle", "flexor-digitorum-superficialis-muscle", "extensor-carpi-ulnaris-muscle"],
      view: { azimuth: 1.2, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "flexor-digitorum-superficialis-muscle",
      label: "Flexor digitorum superficialis muscle",
      shortLabel: "FDS",
      aliases: ["FDS", "superficial digital flexor"],
      tissue: "muscle",
      description:
        "An intermediate anterior forearm muscle that divides into four tendons, each splitting around a profundus tendon to insert on the sides of a middle phalanx.",
      keyPoints: [
        "It flexes the proximal interphalangeal joints of digits II–V and is tested by holding the other fingers extended.",
        "All its fibres are supplied by the median nerve.",
      ],
      difficulty: 2,
      distractorIds: ["flexor-digitorum-profundus-muscle", "flexor-carpi-radialis-muscle", "extensor-digitorum-muscle"],
      view: { azimuth: 0.3, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "flexor-digitorum-profundus-muscle",
      label: "Flexor digitorum profundus muscle",
      shortLabel: "FDP",
      aliases: ["FDP", "deep digital flexor"],
      tissue: "muscle",
      description:
        "A deep anterior forearm muscle from the ulna and interosseous membrane whose four tendons pass through the carpal tunnel to the distal phalanges of digits II–V.",
      keyPoints: [
        "It is the only muscle that flexes the distal interphalangeal joints.",
        "Its lateral half is anterior-interosseous-nerve supplied and its medial half is ulnar-nerve supplied.",
      ],
      difficulty: 2,
      distractorIds: ["flexor-digitorum-superficialis-muscle", "flexor-carpi-ulnaris-muscle", "extensor-digitorum-muscle"],
      view: { azimuth: 0.4, elevation: 0.0, zoom: 1.6 },
    },
    {
      id: "extensor-carpi-radialis-muscles",
      label: "Extensor carpi radialis longus and brevis",
      shortLabel: "ECRL / ECRB",
      aliases: ["ECRL and ECRB", "radial wrist extensors"],
      tissue: "muscle",
      description:
        "Two posterior-lateral forearm muscles inserting on the bases of metacarpals II and III; both extend and abduct the wrist.",
      keyPoints: [
        "ECRL is supplied directly by the radial nerve while ECRB is commonly supplied by its deep branch.",
        "ECRB's common extensor origin is frequently involved in lateral epicondylitis.",
      ],
      difficulty: 2,
      distractorIds: ["extensor-carpi-ulnaris-muscle", "extensor-digitorum-muscle", "flexor-carpi-radialis-muscle"],
      view: { azimuth: 2.6, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "extensor-digitorum-muscle",
      label: "Extensor digitorum muscle",
      shortLabel: "Ext. digitorum",
      aliases: ["extensor digitorum communis", "EDC"],
      tissue: "muscle",
      description:
        "A superficial posterior forearm muscle whose four tendons enter the dorsal digital expansions of digits II–V.",
      keyPoints: [
        "It chiefly extends the metacarpophalangeal joints and assists interphalangeal extension through the extensor hoods.",
        "It is supplied by the posterior interosseous nerve.",
      ],
      difficulty: 2,
      distractorIds: ["extensor-carpi-radialis-muscles", "extensor-carpi-ulnaris-muscle", "flexor-digitorum-superficialis-muscle"],
      view: { azimuth: 3.14159, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "extensor-carpi-ulnaris-muscle",
      label: "Extensor carpi ulnaris muscle",
      shortLabel: "ECU",
      aliases: ["ECU"],
      tissue: "muscle",
      description:
        "A superficial posterior forearm muscle running from the lateral epicondyle and posterior ulna to the base of the fifth metacarpal.",
      keyPoints: [
        "It extends and adducts the wrist and stabilizes it during power grip.",
        "It is supplied by the posterior interosseous nerve.",
      ],
      difficulty: 2,
      distractorIds: ["extensor-carpi-radialis-muscles", "extensor-digitorum-muscle", "flexor-carpi-ulnaris-muscle"],
      view: { azimuth: 2.4, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "thenar-muscle-group",
      label: "Thenar muscle group",
      shortLabel: "Thenar",
      aliases: [
        "thenar eminence",
        "abductor pollicis brevis",
        "flexor pollicis brevis",
        "opponens pollicis",
      ],
      tissue: "muscle",
      description:
        "The intrinsic thumb muscle mass on the lateral palm, principally comprising abductor pollicis brevis, flexor pollicis brevis and opponens pollicis.",
      keyPoints: [
        "The recurrent branch of the median nerve supplies most thenar muscles and enables opposition.",
        "Median-nerve injury causes thenar wasting and loss of effective thumb opposition.",
      ],
      difficulty: 2,
      distractorIds: ["hypothenar-muscle-group", "flexor-digitorum-superficialis-muscle", "extensor-carpi-radialis-muscles"],
      view: { azimuth: 0.2, elevation: 0.35, zoom: 1.9 },
    },
    {
      id: "hypothenar-muscle-group",
      label: "Hypothenar muscle group",
      shortLabel: "Hypothenar",
      aliases: [
        "hypothenar eminence",
        "abductor digiti minimi",
        "flexor digiti minimi brevis",
        "opponens digiti minimi",
      ],
      tissue: "muscle",
      description:
        "The intrinsic little-finger muscle mass on the medial palm, comprising abductor digiti minimi, flexor digiti minimi brevis and opponens digiti minimi.",
      keyPoints: [
        "The deep branch of the ulnar nerve supplies the group.",
        "Wasting flattens the hypothenar eminence and accompanies significant ulnar neuropathy.",
      ],
      difficulty: 2,
      distractorIds: ["thenar-muscle-group", "flexor-carpi-ulnaris-muscle", "flexor-digitorum-profundus-muscle"],
      view: { azimuth: 1.0, elevation: 0.35, zoom: 1.9 },
    },

    // ---- Nerves (procedural) --------------------------------------------------------------------
    {
      id: "upper-trunk-brachial-plexus",
      schematic: true,
      label: "Upper trunk of brachial plexus",
      shortLabel: "Upper trunk",
      aliases: ["superior trunk", "C5–C6 trunk"],
      tissue: "nerve",
      description:
        "The union of the C5 and C6 ventral rami at the lateral border of the scalene interval, dividing into anterior and posterior divisions above the clavicle.",
      keyPoints: [
        "It gives rise to the suprascapular nerve and nerve to subclavius.",
        "Upper-trunk injury produces the Erb pattern of C5–C6 weakness.",
      ],
      difficulty: 2,
      distractorIds: ["middle-trunk-brachial-plexus", "lower-trunk-brachial-plexus", "lateral-cord-brachial-plexus"],
      view: { azimuth: 0.3, elevation: 0.35, zoom: 1.6 },
    },
    {
      id: "middle-trunk-brachial-plexus",
      schematic: true,
      label: "Middle trunk of brachial plexus",
      shortLabel: "Middle trunk",
      aliases: ["C7 trunk"],
      tissue: "nerve",
      description:
        "The continuation of the C7 ventral ramus through the interscalene interval, dividing into anterior and posterior divisions behind the clavicle.",
      keyPoints: [
        "It is the only trunk formed by a single root.",
        "Its fibres contribute substantially to the radial and median nerves.",
      ],
      difficulty: 2,
      distractorIds: ["upper-trunk-brachial-plexus", "lower-trunk-brachial-plexus", "posterior-cord-brachial-plexus"],
      view: { azimuth: 0.3, elevation: 0.32, zoom: 1.6 },
    },
    {
      id: "lower-trunk-brachial-plexus",
      schematic: true,
      label: "Lower trunk of brachial plexus",
      shortLabel: "Lower trunk",
      aliases: ["inferior trunk", "C8–T1 trunk"],
      tissue: "nerve",
      description:
        "The union of C8 and T1 ventral rami, lying inferiorly in the plexus before dividing behind the clavicle.",
      keyPoints: [
        "Lower-trunk injury produces the Klumpke pattern with prominent intrinsic-hand weakness.",
        "It may be compressed by a cervical rib or apical lung lesion.",
      ],
      difficulty: 2,
      distractorIds: ["upper-trunk-brachial-plexus", "middle-trunk-brachial-plexus", "medial-cord-brachial-plexus"],
      view: { azimuth: 0.3, elevation: 0.28, zoom: 1.6 },
    },
    {
      id: "lateral-cord-brachial-plexus",
      schematic: true,
      label: "Lateral cord of brachial plexus",
      shortLabel: "Lateral cord",
      aliases: ["lateral cord"],
      tissue: "nerve",
      description:
        "A cord lateral to the second part of the axillary artery, formed by the anterior divisions of the upper and middle trunks.",
      keyPoints: [
        "It gives the musculocutaneous nerve and lateral root of the median nerve.",
        "It carries predominantly C5–C7 fibres.",
      ],
      difficulty: 2,
      distractorIds: ["posterior-cord-brachial-plexus", "medial-cord-brachial-plexus", "upper-trunk-brachial-plexus"],
      view: { azimuth: 0.3, elevation: 0.22, zoom: 1.6 },
    },
    {
      id: "posterior-cord-brachial-plexus",
      schematic: true,
      label: "Posterior cord of brachial plexus",
      shortLabel: "Posterior cord",
      aliases: ["posterior cord"],
      tissue: "nerve",
      description:
        "A cord posterior to the second part of the axillary artery, formed by all three posterior divisions.",
      keyPoints: [
        "It terminates as the axillary and radial nerves.",
        "Compression can affect shoulder abduction and extension throughout the limb.",
      ],
      difficulty: 2,
      distractorIds: ["lateral-cord-brachial-plexus", "medial-cord-brachial-plexus", "radial-nerve"],
      view: { azimuth: 0.3, elevation: 0.2, zoom: 1.6 },
    },
    {
      id: "medial-cord-brachial-plexus",
      schematic: true,
      label: "Medial cord of brachial plexus",
      shortLabel: "Medial cord",
      aliases: ["medial cord"],
      tissue: "nerve",
      description:
        "A cord medial to the second part of the axillary artery, formed by the anterior division of the lower trunk.",
      keyPoints: [
        "It gives the ulnar nerve and medial root of the median nerve.",
        "It carries mainly C8–T1 fibres important to intrinsic hand function.",
      ],
      difficulty: 2,
      distractorIds: ["lateral-cord-brachial-plexus", "posterior-cord-brachial-plexus", "lower-trunk-brachial-plexus"],
      view: { azimuth: 0.3, elevation: 0.2, zoom: 1.6 },
    },
    {
      id: "axillary-nerve",
      schematic: true,
      label: "Axillary nerve",
      shortLabel: "Axillary n.",
      aliases: ["circumflex nerve"],
      tissue: "nerve",
      description:
        "A C5–C6 terminal branch of the posterior cord that passes through the quadrangular space with the posterior circumflex humeral artery and winds around the surgical neck.",
      keyPoints: [
        "It supplies deltoid and teres minor plus skin over the regimental-badge area.",
        "It is vulnerable in surgical-neck fracture and anterior shoulder dislocation.",
      ],
      difficulty: 1,
      distractorIds: ["musculocutaneous-nerve", "radial-nerve", "posterior-cord-brachial-plexus"],
      view: { azimuth: -0.6, elevation: 0.15, zoom: 1.6 },
    },
    {
      id: "musculocutaneous-nerve",
      schematic: true,
      label: "Musculocutaneous nerve",
      shortLabel: "Musculocut. n.",
      aliases: ["musculocutaneous nerve of arm"],
      tissue: "nerve",
      description:
        "A C5–C7 terminal branch of the lateral cord that pierces coracobrachialis and descends between biceps and brachialis before continuing as the lateral cutaneous nerve of the forearm.",
      keyPoints: [
        "It supplies the anterior arm flexors.",
        "Injury weakens elbow flexion and supination and reduces sensation on the lateral forearm.",
      ],
      difficulty: 1,
      distractorIds: ["median-nerve", "axillary-nerve", "lateral-cord-brachial-plexus"],
      view: { azimuth: 0.2, elevation: 0.1, zoom: 1.5 },
    },
    {
      id: "median-nerve",
      schematic: true,
      label: "Median nerve",
      shortLabel: "Median n.",
      aliases: ["median nerve of upper limb"],
      tissue: "nerve",
      description:
        "A terminal nerve formed by lateral and medial roots around the axillary artery, descending with the brachial artery and entering the hand through the carpal tunnel.",
      keyPoints: [
        "It supplies most forearm flexors and thenar muscles.",
        "Carpal tunnel syndrome causes lateral three-and-a-half-digit sensory symptoms while sparing the palmar cutaneous territory over the thenar eminence.",
      ],
      difficulty: 1,
      distractorIds: ["ulnar-nerve", "radial-nerve", "musculocutaneous-nerve"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "ulnar-nerve",
      schematic: true,
      label: "Ulnar nerve",
      shortLabel: "Ulnar n.",
      aliases: ["ulnar nerve of upper limb"],
      tissue: "nerve",
      description:
        "A C8–T1 dominant terminal branch of the medial cord that passes behind the medial epicondyle, between the heads of flexor carpi ulnaris and into the hand superficial to the flexor retinaculum in Guyon's canal.",
      keyPoints: [
        "It supplies most intrinsic hand muscles and the medial half of flexor digitorum profundus.",
        "Lesions can produce an ulnar claw, with the apparent claw often worse after a distal lesion.",
      ],
      difficulty: 1,
      distractorIds: ["median-nerve", "radial-nerve", "medial-cord-brachial-plexus"],
      view: { azimuth: 1.2, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "radial-nerve",
      schematic: true,
      label: "Radial nerve",
      shortLabel: "Radial n.",
      aliases: ["radial nerve of upper limb"],
      tissue: "nerve",
      description:
        "A large terminal branch of the posterior cord that passes through the triangular interval, winds in the radial groove and divides near the lateral elbow into superficial sensory and deep motor branches.",
      keyPoints: [
        "It supplies the posterior compartments of arm and forearm.",
        "Axillary compression or humeral-shaft injury may cause wrist drop, with the sensory deficit classically tested in the first dorsal web space.",
      ],
      difficulty: 1,
      distractorIds: ["median-nerve", "ulnar-nerve", "axillary-nerve"],
      view: { azimuth: 2.7, elevation: 0.05, zoom: 1.4 },
    },

    // ---- Arteries (real: 5) ---------------------------------------------------------------------
    {
      id: "subclavian-artery",
      label: "Subclavian artery",
      shortLabel: "Subclavian a.",
      aliases: ["subclavian artery of upper limb"],
      tissue: "artery",
      description:
        "The proximal arterial supply to the upper limb, arching over the first rib and becoming the axillary artery at the lateral border of that rib.",
      keyPoints: [
        "It is divided into three parts by anterior scalene.",
        "Thoracic outlet compression can affect the vessel and lower brachial-plexus fibres.",
      ],
      difficulty: 1,
      distractorIds: ["axillary-artery", "brachial-artery", "radial-artery"],
      view: { azimuth: 0.3, elevation: 0.3, zoom: 1.5 },
    },
    {
      id: "axillary-artery",
      label: "Axillary artery",
      shortLabel: "Axillary a.",
      aliases: ["axillary artery proper"],
      tissue: "artery",
      description:
        "The continuation of the subclavian from the lateral border of the first rib to the inferior border of teres major, where it becomes brachial.",
      keyPoints: [
        "Pectoralis minor divides it into three parts and the brachial-plexus cords are named around its second part.",
        "Its branches participate in scapular and shoulder anastomoses.",
      ],
      difficulty: 1,
      distractorIds: ["subclavian-artery", "brachial-artery", "ulnar-artery"],
      view: { azimuth: 0.3, elevation: 0.18, zoom: 1.5 },
    },
    {
      id: "brachial-artery",
      label: "Brachial artery",
      shortLabel: "Brachial a.",
      aliases: ["main artery of arm"],
      tissue: "artery",
      description:
        "The continuation of the axillary artery below teres major, running with the median nerve in the medial bicipital groove and dividing into radial and ulnar arteries in the cubital fossa.",
      keyPoints: [
        "The pulse and blood pressure are assessed medial to the biceps tendon.",
        "Supracondylar fracture can compromise it and cause forearm ischemia or Volkmann contracture.",
      ],
      difficulty: 1,
      distractorIds: ["axillary-artery", "radial-artery", "ulnar-artery"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "radial-artery",
      label: "Radial artery",
      shortLabel: "Radial a.",
      aliases: ["radial pulse artery"],
      tissue: "artery",
      description:
        "A terminal branch of the brachial artery that descends along the lateral forearm, crosses the anatomical snuffbox and enters the palm to form most of the deep palmar arch.",
      keyPoints: [
        "Its pulse is palpable just lateral to the flexor carpi radialis tendon.",
        "Collateral hand flow should be assessed before cannulation or harvest.",
      ],
      difficulty: 1,
      distractorIds: ["ulnar-artery", "brachial-artery", "deep-palmar-arch"],
      view: { azimuth: 0.3, elevation: 0.0, zoom: 1.4 },
    },
    {
      id: "ulnar-artery",
      label: "Ulnar artery",
      shortLabel: "Ulnar a.",
      aliases: ["ulnar artery of forearm"],
      tissue: "artery",
      description:
        "The larger terminal branch of the brachial artery, passing deep to pronator teres and then with the ulnar nerve toward the palm, where it forms most of the superficial palmar arch.",
      keyPoints: [
        "Its common interosseous branch supplies deeper forearm pathways.",
        "At the wrist it enters Guyon's canal superficial to the flexor retinaculum.",
      ],
      difficulty: 1,
      distractorIds: ["radial-artery", "brachial-artery", "superficial-palmar-arch"],
      view: { azimuth: 0.8, elevation: 0.0, zoom: 1.4 },
    },
    {
      id: "superficial-palmar-arch",
      schematic: true,
      label: "Superficial palmar arch",
      shortLabel: "Superf. palmar arch",
      aliases: ["superficial volar arch"],
      tissue: "artery",
      description:
        "An arterial arcade lying just deep to the palmar aponeurosis, formed mainly by the ulnar artery and usually completed by a superficial radial contribution.",
      keyPoints: [
        "It gives common palmar digital arteries.",
        "Completeness varies, making collateral assessment important before radial-artery procedures.",
      ],
      difficulty: 2,
      distractorIds: ["deep-palmar-arch", "ulnar-artery", "radial-artery"],
      view: { azimuth: 0.2, elevation: 0.3, zoom: 2.0 },
    },
    {
      id: "deep-palmar-arch",
      schematic: true,
      label: "Deep palmar arch",
      shortLabel: "Deep palmar arch",
      aliases: ["deep volar arch"],
      tissue: "artery",
      description:
        "A deep arterial arcade across the metacarpal bases, formed mainly by the radial artery and completed by the deep branch of the ulnar artery.",
      keyPoints: [
        "It lies deep to the long flexor tendons and supplies palmar metacarpal arteries.",
        "Remember the reciprocal pattern: radial predominates deep and ulnar predominates superficial.",
      ],
      difficulty: 2,
      distractorIds: ["superficial-palmar-arch", "radial-artery", "ulnar-artery"],
      view: { azimuth: 0.2, elevation: 0.3, zoom: 2.0 },
    },

    // ---- Veins (real: 2, procedural: 1) ---------------------------------------------------------
    {
      id: "cephalic-vein",
      label: "Cephalic vein",
      shortLabel: "Cephalic v.",
      aliases: ["preaxial superficial vein"],
      tissue: "vein",
      description:
        "A superficial vein ascending on the lateral forearm and arm, then running in the deltopectoral groove to pierce clavipectoral fascia and drain into the axillary vein.",
      keyPoints: [
        "It is commonly used for venous access and a deltopectoral approach.",
        "Its course in the deltopectoral groove helps identify the interval between deltoid and pectoralis major.",
      ],
      difficulty: 1,
      distractorIds: ["basilic-vein", "median-cubital-vein", "axillary-artery"],
      view: { azimuth: -0.4, elevation: 0.05, zoom: 1.3 },
    },
    {
      id: "basilic-vein",
      label: "Basilic vein",
      shortLabel: "Basilic v.",
      aliases: ["postaxial superficial vein"],
      tissue: "vein",
      description:
        "A superficial vein ascending medially from the hand and forearm, piercing deep fascia in the mid-arm and joining brachial veins to form the axillary vein near teres major.",
      keyPoints: [
        "It is larger and more medial than the cephalic vein.",
        "Basilic-vein transposition may be used for dialysis access.",
      ],
      difficulty: 1,
      distractorIds: ["cephalic-vein", "median-cubital-vein", "brachial-artery"],
      view: { azimuth: 1.1, elevation: 0.05, zoom: 1.3 },
    },
    {
      id: "median-cubital-vein",
      schematic: true,
      label: "Median cubital vein",
      shortLabel: "Median cubital v.",
      aliases: ["median basilic vein"],
      tissue: "vein",
      description:
        "A variable superficial channel crossing the cubital fossa, usually connecting cephalic and basilic veins superficial to the bicipital aponeurosis.",
      keyPoints: [
        "It is the preferred venipuncture site because it is relatively fixed and superficial.",
        "The bicipital aponeurosis helps protect the brachial artery and median nerve deep to it.",
      ],
      difficulty: 1,
      distractorIds: ["cephalic-vein", "basilic-vein", "superficial-palmar-arch"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.7 },
    },
    ...upperLimbNerveDetailStructures,
    ...upperLimbDetailStructures,
    ...imageMeshStructures("upper-limb"),
    ...practicalMeshStructures("upper-limb"),
    ...practicalLandmarkStructures("upper-limb"),
  ],
};
