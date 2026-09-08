import { imageMeshStructures } from "../image-mesh-structures.mjs";
import { practicalMeshStructures } from "../practical-mesh-structures.mjs";
import { practicalLandmarkStructures } from "../practical-landmarks.mjs";
import { lowerPracticalConnectiveStructures } from "../practical-connective.mjs";
import { lowerLimbDetailStructures } from "../limb-detail-structures.mjs";
import { lowerLimbNerveDetailStructures } from "../limb-nerve-structures.mjs";

/**
 * REAL (mesh-backed) + procedural LOWER-LIMB manifest — additive prototype, NOT registered in the
 * live app (mirrors the respiratory "-real" prototypes).
 *
 * The 53 real structures (bones, muscles, major arteries and veins) map 1:1 to named nodes in the
 * core GLB plus the v4.3 high-detail OBJ supplement, built from BodyParts3D meshes of the LEFT
 * lower limb and remapped to the engine's
 * +Y superior / +Z anterior / +X subject-left frame, merged per structure, decimated and Draco-packed.
 *   Attribution (required, CC-BY 4.0):
 *   "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * The procedural structures (schematic:true) have no dedicated BodyParts3D mesh at this scope —
 * the knee ligaments / menisci / joint capsules, the nerves of the lumbosacral plexus and the small
 * fibular artery — so they are authored in the factory (userData.schematic = true) as tubes / bands /
 * rings routed relative to the real bones and muscles. Menisci are diagrammatic here (BodyParts3D has
 * no meniscal mesh at the 99%-reduction release).
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const lowerLimbManifest = {
  id: "lower-limb",
  region: "lower-limb",
  modelKey: "lower-limb",
  title: "Lower limb",
  subject: "anatomy",
  blurb:
    "Left lower limb: separate bones and muscle components from BodyParts3D, with practical landmark pins and diagrammatic nerves, ligaments, retinacula and cartilage. The labeled book figures cover fine anatomy and structures unavailable as individual source meshes.",
  structures: [
    {
      id: "hip-bone",
      label: "Hip bone",
      tissue: "bone",
      aliases: ["os coxae", "coxal bone", "innominate bone"],
      description:
        "The fused ilium, ischium, and pubis form the lateral and anterior walls of the bony pelvis and meet at the acetabulum. It articulates with the sacrum posteriorly and femur laterally.",
      keyPoints: [
        "The three parts fuse at the acetabulum.",
        "The ASIS, ischial spine, ischial tuberosity, and pubic tubercle are key landmarks.",
      ],
      difficulty: 1,
      distractorIds: ["femur", "tibia", "fibula"],
      view: { azimuth: 0.6, elevation: 0.25, zoom: 1.15 },
    },
    {
      id: "femur",
      label: "Femur",
      tissue: "bone",
      aliases: ["thigh bone"],
      description:
        "The femur is the long bone of the thigh, extending from the hip to the knee with a head, neck, trochanters, shaft, condyles, and epicondyles.",
      keyPoints: [
        "A femoral-neck fracture may disrupt retinacular vessels and cause avascular necrosis of the head.",
        "The linea aspera is the major posterior shaft landmark.",
      ],
      difficulty: 1,
      distractorIds: ["tibia", "fibula", "hip-bone"],
      view: { azimuth: 0.35, elevation: 0.12, zoom: 1.05 },
    },
    {
      id: "patella",
      label: "Patella",
      tissue: "bone",
      aliases: ["kneecap"],
      description:
        "The patella is a sesamoid bone embedded in the quadriceps tendon anterior to the knee, with its apex continuing into the patellar ligament.",
      keyPoints: [
        "It increases the quadriceps moment arm.",
        "Its posterior articular surface tracks in the femoral trochlea.",
      ],
      difficulty: 1,
      distractorIds: ["femur", "tibia", "tarsal-bones"],
      view: { azimuth: 0.15, elevation: 0.1, zoom: 1.9 },
    },
    {
      id: "tibia",
      label: "Tibia",
      tissue: "bone",
      aliases: ["shin bone"],
      description:
        "The tibia is the large medial weight-bearing bone of the leg, articulating with the femur, fibula, and talus. Its proximal condyles form the tibial plateau and its distal projection is the medial malleolus.",
      keyPoints: [
        "The tibial tuberosity receives the patellar ligament.",
        "The anterior border and medial surface are subcutaneous.",
      ],
      difficulty: 1,
      distractorIds: ["fibula", "femur", "patella"],
      view: { azimuth: -0.5, elevation: 0.1, zoom: 1.1 },
    },
    {
      id: "fibula",
      label: "Fibula",
      tissue: "bone",
      aliases: ["lateral bone of leg"],
      description:
        "The fibula is the slender lateral bone of the leg, joined to the tibia proximally and distally; its distal end forms the lateral malleolus.",
      keyPoints: [
        "It bears little body weight but provides extensive muscle attachment.",
        "The common fibular nerve is vulnerable at the fibular neck.",
      ],
      difficulty: 1,
      distractorIds: ["tibia", "femur", "patella"],
      view: { azimuth: 1.5, elevation: 0.1, zoom: 1.25 },
    },
    {
      id: "tarsal-bones",
      label: "Tarsal bones",
      tissue: "bone",
      aliases: ["tarsus", "talus, calcaneus, navicular, cuboid, and cuneiforms"],
      description:
        "Seven tarsal bones form the hindfoot and midfoot between the tibia-fibula mortise and the metatarsals. The talus receives body weight and the calcaneus forms the heel.",
      keyPoints: [
        "The talus has no muscular attachments and a vulnerable blood supply.",
        "The sustentaculum tali supports the talus on the calcaneus.",
      ],
      difficulty: 2,
      distractorIds: ["metatarsal-bones", "toe-phalanges", "tibia"],
      view: { azimuth: 0.8, elevation: 0.3, zoom: 1.6 },
    },
    {
      id: "metatarsal-bones",
      label: "Metatarsal bones",
      tissue: "bone",
      aliases: ["metatarsals", "first through fifth metatarsals"],
      description:
        "Five metatarsals form the forefoot between the tarsals and proximal phalanges, each with a base, shaft, and head.",
      keyPoints: [
        "The base of the fifth is the fibularis brevis insertion and a common avulsion-fracture site.",
        "The first metatarsal is short, stout, and load bearing.",
      ],
      difficulty: 2,
      distractorIds: ["tarsal-bones", "toe-phalanges", "fibula"],
      view: { azimuth: 0.3, elevation: 0.5, zoom: 1.6 },
    },
    {
      id: "toe-phalanges",
      label: "Phalanges of the foot",
      tissue: "bone",
      aliases: ["pedal phalanges", "toe bones"],
      description:
        "Four lateral toes each have proximal, middle, and distal phalanges, whereas the great toe has only proximal and distal phalanges.",
      keyPoints: [
        "The hallux has two phalanges.",
        "Toe alignment contributes to balance and propulsion during gait.",
      ],
      difficulty: 1,
      distractorIds: ["metatarsal-bones", "tarsal-bones", "patella"],
      view: { azimuth: 0.2, elevation: 0.5, zoom: 1.7 },
    },
    {
      id: "hip-joint",
      schematic: true,
      label: "Hip joint",
      tissue: "cavity",
      aliases: ["acetabulofemoral joint", "coxal joint"],
      description:
        "The hip is a multiaxial synovial ball-and-socket joint between the femoral head and acetabulum, enclosed by a strong capsule.",
      keyPoints: [
        "Stability comes from the deep acetabulum, labrum, capsule, and surrounding muscles.",
        "Posterior dislocation may injure the sciatic nerve.",
      ],
      difficulty: 1,
      distractorIds: ["ankle-joint", "iliofemoral-ligament", "anterior-cruciate-ligament"],
      view: { azimuth: 0.7, elevation: 0.25, zoom: 1.7 },
    },
    {
      id: "iliofemoral-ligament",
      schematic: true,
      label: "Iliofemoral ligament",
      tissue: "ligament",
      aliases: ["Y-ligament of Bigelow"],
      description:
        "This strong anterior capsular thickening runs from the anterior inferior iliac spine and acetabular rim to the intertrochanteric line.",
      keyPoints: [
        "It is one of the strongest ligaments in the body.",
        "It resists hyperextension and helps maintain upright posture.",
      ],
      difficulty: 2,
      distractorIds: ["tibial-collateral-ligament", "fibular-collateral-ligament", "deltoid-ligament"],
      view: { azimuth: 0.2, elevation: 0.2, zoom: 1.9 },
    },
    {
      id: "knee-joint",
      schematic: true,
      label: "Knee joint",
      tissue: "cavity",
      aliases: ["tibiofemoral and patellofemoral joint complex"],
      description:
        "The knee is a modified hinge synovial joint comprising medial and lateral tibiofemoral articulations plus the patellofemoral articulation within a common capsule.",
      keyPoints: [
        "It permits flexion-extension with limited rotation and uses menisci to improve congruence.",
        "The screw-home mechanism locks the knee near full extension.",
      ],
      difficulty: 1,
      distractorIds: ["hip-joint", "ankle-joint", "anterior-cruciate-ligament"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.8 },
    },
    {
      id: "anterior-cruciate-ligament",
      schematic: true,
      label: "Anterior cruciate ligament",
      tissue: "ligament",
      aliases: ["ACL"],
      description:
        "The ACL runs from the anterior intercondylar area of the tibia upward, backward, and laterally to the medial surface of the lateral femoral condyle.",
      keyPoints: [
        "It limits anterior translation of the tibia and hyperextension.",
        "It is commonly injured during pivoting and assessed by Lachman or anterior drawer testing.",
      ],
      difficulty: 1,
      distractorIds: ["posterior-cruciate-ligament", "tibial-collateral-ligament", "fibular-collateral-ligament"],
      view: { azimuth: 0.1, elevation: 0.05, zoom: 2.1 },
    },
    {
      id: "posterior-cruciate-ligament",
      schematic: true,
      label: "Posterior cruciate ligament",
      tissue: "ligament",
      aliases: ["PCL"],
      description:
        "The PCL runs from the posterior intercondylar area of the tibia upward, forward, and medially to the lateral surface of the medial femoral condyle.",
      keyPoints: [
        "It limits posterior translation of the tibia.",
        "A dashboard injury is a classic mechanism of rupture.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-cruciate-ligament", "tibial-collateral-ligament", "fibular-collateral-ligament"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 2.1 },
    },
    {
      id: "tibial-collateral-ligament",
      schematic: true,
      label: "Tibial collateral ligament",
      tissue: "ligament",
      aliases: ["medial collateral ligament", "MCL"],
      description:
        "This broad medial knee ligament extends from the medial femoral epicondyle to the medial tibia and blends with the capsule and medial meniscus.",
      keyPoints: [
        "It resists valgus stress.",
        "Its attachment to the medial meniscus helps explain combined injuries.",
      ],
      difficulty: 1,
      distractorIds: ["fibular-collateral-ligament", "anterior-cruciate-ligament", "iliofemoral-ligament"],
      view: { azimuth: -1.2, elevation: 0.05, zoom: 1.9 },
    },
    {
      id: "fibular-collateral-ligament",
      schematic: true,
      label: "Fibular collateral ligament",
      tissue: "ligament",
      aliases: ["lateral collateral ligament", "LCL"],
      description:
        "This cord-like lateral knee ligament extends from the lateral femoral epicondyle to the head of the fibula and remains separate from the lateral meniscus.",
      keyPoints: [
        "It resists varus stress.",
        "The popliteus tendon separates it from the lateral meniscus.",
      ],
      difficulty: 1,
      distractorIds: ["tibial-collateral-ligament", "posterior-cruciate-ligament", "deltoid-ligament"],
      view: { azimuth: 1.5, elevation: 0.05, zoom: 1.9 },
    },
    {
      id: "medial-meniscus",
      schematic: true,
      label: "Medial meniscus",
      tissue: "cartilage",
      aliases: ["medial semilunar cartilage"],
      description:
        "The C-shaped medial meniscus lies on the medial tibial plateau and is firmly attached to the capsule and tibial collateral ligament.",
      keyPoints: [
        "It is less mobile than the lateral meniscus and therefore more often torn.",
        "Menisci deepen the articular surfaces and distribute load.",
      ],
      difficulty: 1,
      distractorIds: ["lateral-meniscus", "anterior-cruciate-ligament", "tibial-collateral-ligament"],
      view: { azimuth: -0.8, elevation: 0.5, zoom: 2 },
    },
    {
      id: "lateral-meniscus",
      schematic: true,
      label: "Lateral meniscus",
      tissue: "cartilage",
      aliases: ["lateral semilunar cartilage"],
      description:
        "The nearly circular lateral meniscus lies on the lateral tibial plateau and is separated from the fibular collateral ligament by the popliteus tendon.",
      keyPoints: [
        "It is more mobile and less frequently injured than the medial meniscus.",
        "Meniscal tears can cause joint-line pain and locking.",
      ],
      difficulty: 1,
      distractorIds: ["medial-meniscus", "posterior-cruciate-ligament", "fibular-collateral-ligament"],
      view: { azimuth: 1.4, elevation: 0.5, zoom: 2 },
    },
    {
      id: "ankle-joint",
      schematic: true,
      label: "Ankle joint",
      tissue: "cavity",
      aliases: ["talocrural joint"],
      description:
        "The ankle is a synovial hinge joint where the trochlea of the talus fits within the mortise formed by the distal tibia and fibula.",
      keyPoints: [
        "It primarily permits dorsiflexion and plantarflexion.",
        "It is most stable in dorsiflexion because the anterior talar trochlea is wider.",
      ],
      difficulty: 1,
      distractorIds: ["hip-joint", "deltoid-ligament", "iliofemoral-ligament"],
      view: { azimuth: 0.3, elevation: 0.15, zoom: 1.9 },
    },
    {
      id: "deltoid-ligament",
      schematic: true,
      label: "Deltoid ligament of ankle",
      tissue: "ligament",
      aliases: ["medial ligament of ankle"],
      description:
        "The strong triangular medial ligament fans from the medial malleolus to the talus, calcaneus, and navicular.",
      keyPoints: [
        "It resists excessive eversion.",
        "Severe eversion may avulse the medial malleolus before this ligament tears.",
      ],
      difficulty: 2,
      distractorIds: ["iliofemoral-ligament", "tibial-collateral-ligament", "fibular-collateral-ligament"],
      view: { azimuth: -1.2, elevation: 0.1, zoom: 2 },
    },
    {
      id: "gluteus-maximus",
      label: "Gluteus maximus",
      tissue: "muscle",
      aliases: ["gluteus maximus muscle"],
      description:
        "This large superficial gluteal muscle passes from the posterior ilium, sacrum, and coccyx to the iliotibial tract and gluteal tuberosity.",
      keyPoints: [
        "It powerfully extends and laterally rotates the hip, especially when rising or climbing.",
        "It is supplied by the inferior gluteal nerve.",
      ],
      difficulty: 1,
      distractorIds: ["gluteus-medius", "gluteus-minimus", "iliopsoas"],
      view: { azimuth: 3.14159, elevation: 0.2, zoom: 1.1 },
    },
    {
      id: "gluteus-medius",
      label: "Gluteus medius",
      tissue: "muscle",
      aliases: ["gluteus medius muscle"],
      description:
        "Gluteus medius lies deep to gluteus maximus on the lateral ilium and inserts on the greater trochanter.",
      keyPoints: [
        "It abducts the hip and keeps the pelvis level during single-leg stance.",
        "Superior gluteal nerve injury produces a Trendelenburg sign.",
      ],
      difficulty: 1,
      distractorIds: ["gluteus-minimus", "gluteus-maximus", "iliopsoas"],
      view: { azimuth: 2.4, elevation: 0.3, zoom: 1.3 },
    },
    {
      id: "gluteus-minimus",
      label: "Gluteus minimus",
      tissue: "muscle",
      aliases: ["gluteus minimus muscle"],
      description:
        "Gluteus minimus is the deepest gluteal muscle, passing from the lateral ilium to the anterior greater trochanter.",
      keyPoints: [
        "It abducts and medially rotates the thigh.",
        "It works with gluteus medius and is supplied by the superior gluteal nerve.",
      ],
      difficulty: 2,
      distractorIds: ["gluteus-medius", "gluteus-maximus", "iliopsoas"],
      view: { azimuth: 2, elevation: 0.3, zoom: 1.5 },
    },
    {
      id: "quadriceps-femoris",
      label: "Quadriceps femoris",
      tissue: "muscle",
      aliases: ["rectus femoris and vasti", "quadriceps"],
      description:
        "This anterior-thigh group comprises rectus femoris and vastus lateralis, medialis, and intermedius, converging through the quadriceps tendon, patella, and patellar ligament to the tibial tuberosity.",
      keyPoints: [
        "It is the chief extensor of the knee and is supplied by the femoral nerve.",
        "Rectus femoris also flexes the hip.",
      ],
      difficulty: 1,
      distractorIds: ["biceps-femoris", "iliopsoas", "adductor-longus"],
      view: { azimuth: 0.3, elevation: 0.1, zoom: 1.05 },
    },
    {
      id: "biceps-femoris",
      label: "Biceps femoris",
      tissue: "muscle",
      aliases: ["lateral hamstring"],
      description:
        "The long and short heads form the lateral hamstring and insert mainly on the head of the fibula.",
      keyPoints: [
        "It flexes the knee and laterally rotates the flexed leg; the long head also extends the hip.",
        "The short head is supplied by the common fibular division of the sciatic nerve.",
      ],
      difficulty: 1,
      distractorIds: ["semitendinosus", "semimembranosus", "quadriceps-femoris"],
      view: { azimuth: 2.7, elevation: 0.1, zoom: 1.15 },
    },
    {
      id: "semitendinosus",
      label: "Semitendinosus",
      tissue: "muscle",
      aliases: ["medial superficial hamstring"],
      description:
        "Semitendinosus descends from the ischial tuberosity to the upper medial tibia as part of the pes anserinus.",
      keyPoints: [
        "It extends the hip, flexes the knee, and medially rotates the flexed leg.",
        "Its long distal tendon helps distinguish it from semimembranosus.",
      ],
      difficulty: 2,
      distractorIds: ["semimembranosus", "biceps-femoris", "gracilis"],
      view: { azimuth: 3.14159, elevation: 0.1, zoom: 1.3 },
    },
    {
      id: "semimembranosus",
      label: "Semimembranosus",
      tissue: "muscle",
      aliases: ["medial deep hamstring"],
      description:
        "Semimembranosus lies deep to semitendinosus and passes from the ischial tuberosity to the posterior medial tibial condyle.",
      keyPoints: [
        "It extends the hip, flexes the knee, and medially rotates the flexed leg.",
        "An expansion contributes to the oblique popliteal ligament.",
      ],
      difficulty: 2,
      distractorIds: ["semitendinosus", "biceps-femoris", "adductor-magnus"],
      view: { azimuth: 3.3, elevation: 0.1, zoom: 1.35 },
    },
    {
      id: "adductor-longus",
      label: "Adductor longus",
      tissue: "muscle",
      aliases: ["long adductor"],
      description:
        "Adductor longus is a superficial triangular medial-thigh muscle running from the pubis to the middle third of the linea aspera.",
      keyPoints: [
        "It adducts the thigh and helps define the medial border of the femoral triangle.",
        "It is supplied by the obturator nerve.",
      ],
      difficulty: 1,
      distractorIds: ["adductor-magnus", "gracilis", "iliopsoas"],
      view: { azimuth: -0.7, elevation: 0.1, zoom: 1.3 },
    },
    {
      id: "adductor-magnus",
      label: "Adductor magnus",
      tissue: "muscle",
      aliases: ["great adductor"],
      description:
        "This large medial-thigh muscle has an adductor part from the ischiopubic ramus and a hamstring part from the ischial tuberosity, inserting along the linea aspera and at the adductor tubercle.",
      keyPoints: [
        "The adductor hiatus transmits femoral vessels into the popliteal fossa.",
        "Its two parts have obturator and tibial-division innervation respectively.",
      ],
      difficulty: 2,
      distractorIds: ["adductor-longus", "gracilis", "semimembranosus"],
      view: { azimuth: -0.9, elevation: 0.05, zoom: 1.15 },
    },
    {
      id: "gracilis",
      label: "Gracilis",
      tissue: "muscle",
      aliases: ["gracilis muscle"],
      description:
        "Gracilis is a long superficial medial-thigh muscle running from the pubis to the medial proximal tibia in the pes anserinus.",
      keyPoints: [
        "It adducts the thigh and flexes and medially rotates the leg.",
        "It is the only adductor-compartment muscle that crosses the knee.",
      ],
      difficulty: 2,
      distractorIds: ["adductor-longus", "adductor-magnus", "semitendinosus"],
      view: { azimuth: -1.1, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "iliopsoas",
      label: "Iliopsoas",
      tissue: "muscle",
      aliases: ["iliacus and psoas major"],
      description:
        "Iliacus and psoas major unite deep to the inguinal ligament and insert on the lesser trochanter.",
      keyPoints: [
        "It is the chief flexor of the hip.",
        "The femoral nerve emerges lateral to it, while the femoral vessels lie medial.",
      ],
      difficulty: 1,
      distractorIds: ["quadriceps-femoris", "adductor-longus", "gluteus-maximus"],
      view: { azimuth: 0.4, elevation: 0.2, zoom: 1.2 },
    },
    {
      id: "tibialis-anterior",
      label: "Tibialis anterior",
      tissue: "muscle",
      aliases: ["tibialis anticus"],
      description:
        "This superficial anterior-compartment muscle runs from the lateral tibia to the medial cuneiform and base of the first metatarsal.",
      keyPoints: [
        "It dorsiflexes and inverts the foot and is supplied by the deep fibular nerve.",
        "Its tendon is a palpable landmark at the ankle.",
      ],
      difficulty: 1,
      distractorIds: ["tibialis-posterior", "extensor-digitorum-longus", "fibularis-longus-and-brevis"],
      view: { azimuth: 0.5, elevation: 0.05, zoom: 1.3 },
    },
    {
      id: "extensor-digitorum-longus",
      label: "Extensor digitorum longus",
      tissue: "muscle",
      aliases: ["long extensor of toes"],
      description:
        "This anterior-compartment muscle descends to four tendons for the lateral four toes.",
      keyPoints: [
        "It extends toes two through five and dorsiflexes the ankle.",
        "It is supplied by the deep fibular nerve.",
      ],
      difficulty: 2,
      distractorIds: ["tibialis-anterior", "fibularis-longus-and-brevis", "intrinsic-foot-muscles"],
      view: { azimuth: 0.7, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "gastrocnemius",
      label: "Gastrocnemius",
      tissue: "muscle",
      aliases: ["gastrocnemius muscle", "superficial calf muscle"],
      description:
        "The two-headed gastrocnemius arises above the femoral condyles and joins soleus in the calcaneal tendon.",
      keyPoints: [
        "It plantarflexes the ankle and flexes the knee.",
        "It is most effective in rapid, forceful plantarflexion with the knee extended.",
      ],
      difficulty: 1,
      distractorIds: ["soleus", "tibialis-posterior", "biceps-femoris"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.15 },
    },
    {
      id: "soleus",
      label: "Soleus",
      tissue: "muscle",
      aliases: ["soleus muscle"],
      description:
        "Soleus is the broad postural muscle deep to gastrocnemius, arising from the tibia and fibula and joining the calcaneal tendon.",
      keyPoints: [
        "It plantarflexes the ankle and is active during quiet standing.",
        "Unlike gastrocnemius, it does not cross the knee.",
      ],
      difficulty: 1,
      distractorIds: ["gastrocnemius", "tibialis-posterior", "tibialis-anterior"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.25 },
    },
    {
      id: "tibialis-posterior",
      label: "Tibialis posterior",
      tissue: "muscle",
      aliases: ["posterior tibial muscle"],
      description:
        "This deep posterior-compartment muscle passes behind the medial malleolus to the navicular and other tarsal and metatarsal attachments.",
      keyPoints: [
        "It plantarflexes and inverts the foot and supports the medial arch.",
        "Tendon dysfunction causes acquired flatfoot.",
      ],
      difficulty: 2,
      distractorIds: ["tibialis-anterior", "soleus", "fibularis-longus-and-brevis"],
      view: { azimuth: -1, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "fibularis-longus-and-brevis",
      label: "Fibularis longus and brevis",
      tissue: "muscle",
      aliases: ["peroneus longus and brevis", "lateral compartment muscles"],
      description:
        "These lateral-compartment muscles descend behind the lateral malleolus; brevis inserts on the fifth metatarsal and longus crosses the sole to the first metatarsal and medial cuneiform.",
      keyPoints: [
        "Both evert the foot and weakly plantarflex the ankle.",
        "They are supplied by the superficial fibular nerve.",
      ],
      difficulty: 2,
      distractorIds: ["tibialis-anterior", "tibialis-posterior", "extensor-digitorum-longus"],
      view: { azimuth: 1.5, elevation: 0.05, zoom: 1.35 },
    },
    {
      id: "intrinsic-foot-muscles",
      label: "Intrinsic muscles of the foot",
      tissue: "muscle",
      aliases: ["short muscles of foot", "plantar and dorsal intrinsic muscles"],
      description:
        "These small muscles arise and insert within the foot, occupying the dorsum and four plantar layers around the metatarsals and phalanges.",
      keyPoints: [
        "They stabilize the arches and control fine toe movements.",
        "The plantar interossei adduct and dorsal interossei abduct relative to the second toe.",
      ],
      difficulty: 3,
      distractorIds: ["extensor-digitorum-longus", "fibularis-longus-and-brevis", "tibialis-posterior"],
      view: { azimuth: 0.2, elevation: 0.4, zoom: 1.6 },
    },
    {
      id: "lumbosacral-plexus",
      schematic: true,
      label: "Lumbosacral plexus",
      tissue: "nerve",
      aliases: ["lumbar and sacral plexuses", "L1-S4 plexus"],
      description:
        "The lumbar and sacral plexuses are formed by anterior rami from approximately L1 through S4 and give rise to the major nerves of the lower limb.",
      keyPoints: [
        "Lumbar plexus branches mainly enter the anterior and medial thigh; sacral plexus branches mainly enter the gluteal region, posterior thigh, leg, and foot.",
        "Root patterns help localize neurologic lesions.",
      ],
      difficulty: 2,
      distractorIds: ["femoral-nerve", "obturator-nerve", "sciatic-nerve"],
      view: { azimuth: 3, elevation: 0.35, zoom: 1.6 },
    },
    {
      id: "femoral-nerve",
      schematic: true,
      label: "Femoral nerve",
      tissue: "nerve",
      aliases: ["nerve of anterior thigh", "L2-L4"],
      description:
        "The femoral nerve arises from posterior divisions of L2-L4, emerges lateral to psoas major, and passes deep to the inguinal ligament into the femoral triangle.",
      keyPoints: [
        "It supplies the anterior thigh and gives rise to the saphenous nerve.",
        "Injury weakens knee extension and reduces the patellar reflex.",
      ],
      difficulty: 1,
      distractorIds: ["obturator-nerve", "sciatic-nerve", "tibial-nerve"],
      view: { azimuth: 0.3, elevation: 0.15, zoom: 1.4 },
    },
    {
      id: "obturator-nerve",
      schematic: true,
      label: "Obturator nerve",
      tissue: "nerve",
      aliases: ["nerve of medial thigh", "L2-L4"],
      description:
        "The obturator nerve arises from anterior divisions of L2-L4, runs along the lateral pelvic wall, and enters the medial thigh through the obturator canal.",
      keyPoints: [
        "It supplies most thigh adductors and a small medial-thigh skin area.",
        "Injury causes weak adduction.",
      ],
      difficulty: 2,
      distractorIds: ["femoral-nerve", "sciatic-nerve", "tibial-nerve"],
      view: { azimuth: -1, elevation: 0.1, zoom: 1.6 },
    },
    {
      id: "sciatic-nerve",
      schematic: true,
      label: "Sciatic nerve",
      tissue: "nerve",
      aliases: ["ischiadic nerve", "L4-S3"],
      description:
        "The sciatic nerve leaves the pelvis through the greater sciatic foramen, usually inferior to piriformis, and descends in the posterior thigh before dividing into tibial and common fibular nerves.",
      keyPoints: [
        "It is the largest nerve in the body.",
        "Posterior hip dislocation or a misplaced gluteal injection may injure it.",
      ],
      difficulty: 1,
      distractorIds: ["femoral-nerve", "tibial-nerve", "common-fibular-nerve"],
      view: { azimuth: 3.14159, elevation: 0.1, zoom: 1.15 },
    },
    {
      id: "tibial-nerve",
      schematic: true,
      label: "Tibial nerve",
      tissue: "nerve",
      aliases: ["medial terminal branch of sciatic nerve", "L4-S3"],
      description:
        "The tibial component of the sciatic nerve descends through the popliteal fossa and posterior leg, then passes behind the medial malleolus into the sole.",
      keyPoints: [
        "It supplies posterior leg muscles and most intrinsic foot muscles.",
        "It is compressed in tarsal tunnel syndrome.",
      ],
      difficulty: 1,
      distractorIds: ["common-fibular-nerve", "superficial-fibular-nerve", "deep-fibular-nerve"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.3 },
    },
    {
      id: "common-fibular-nerve",
      schematic: true,
      label: "Common fibular nerve",
      tissue: "nerve",
      aliases: ["common peroneal nerve", "lateral popliteal nerve"],
      description:
        "This terminal branch of the sciatic nerve follows the biceps femoris tendon and winds around the fibular neck before dividing into superficial and deep fibular nerves.",
      keyPoints: [
        "Its superficial course at the fibular neck makes it vulnerable.",
        "Injury can cause foot drop and loss of dorsum-of-foot sensation.",
      ],
      difficulty: 1,
      distractorIds: ["tibial-nerve", "superficial-fibular-nerve", "deep-fibular-nerve"],
      view: { azimuth: 2.5, elevation: 0.1, zoom: 1.6 },
    },
    {
      id: "superficial-fibular-nerve",
      schematic: true,
      label: "Superficial fibular nerve",
      tissue: "nerve",
      aliases: ["superficial peroneal nerve"],
      description:
        "This branch of the common fibular nerve descends in the lateral compartment and becomes cutaneous in the distal leg.",
      keyPoints: [
        "It supplies fibularis longus and brevis.",
        "It provides sensation to most of the dorsum of the foot, excluding the first web space.",
      ],
      difficulty: 2,
      distractorIds: ["deep-fibular-nerve", "common-fibular-nerve", "tibial-nerve"],
      view: { azimuth: 1.5, elevation: 0.05, zoom: 1.6 },
    },
    {
      id: "deep-fibular-nerve",
      schematic: true,
      label: "Deep fibular nerve",
      tissue: "nerve",
      aliases: ["deep peroneal nerve", "anterior tibial nerve"],
      description:
        "This branch of the common fibular nerve accompanies the anterior tibial artery in the anterior leg and continues onto the dorsum of the foot.",
      keyPoints: [
        "It supplies the anterior compartment and sensation to the first dorsal web space.",
        "Compression or injury causes weakness of dorsiflexion.",
      ],
      difficulty: 2,
      distractorIds: ["superficial-fibular-nerve", "common-fibular-nerve", "tibial-nerve"],
      view: { azimuth: 0.4, elevation: 0.05, zoom: 1.6 },
    },
    {
      id: "external-iliac-artery",
      label: "External iliac artery",
      tissue: "artery",
      aliases: ["external iliac"],
      description:
        "The external iliac artery follows the pelvic brim and becomes the femoral artery after passing deep to the inguinal ligament at the midinguinal point.",
      keyPoints: [
        "It is the proximal arterial inflow to the lower limb.",
        "The pulse immediately distal to the inguinal ligament is the femoral pulse.",
      ],
      difficulty: 1,
      distractorIds: ["femoral-artery", "popliteal-artery", "posterior-tibial-artery"],
      view: { azimuth: 0.2, elevation: 0.35, zoom: 1.7 },
    },
    {
      id: "femoral-artery",
      label: "Femoral artery",
      tissue: "artery",
      aliases: ["common femoral artery", "femoral vessel"],
      description:
        "The continuation of the external iliac artery enters the femoral triangle, traverses the adductor canal, and becomes the popliteal artery at the adductor hiatus.",
      keyPoints: [
        "It is accessible for pulse examination and arterial catheterization.",
        "The profunda femoris is its major deep branch to the thigh.",
      ],
      difficulty: 1,
      distractorIds: ["external-iliac-artery", "popliteal-artery", "anterior-tibial-artery"],
      view: { azimuth: -0.4, elevation: 0.1, zoom: 1.3 },
    },
    {
      id: "popliteal-artery",
      label: "Popliteal artery",
      tissue: "artery",
      aliases: ["popliteal vessel"],
      description:
        "The popliteal artery is the continuation of the femoral artery behind the knee and lies deepest in the popliteal fossa against the capsule and femur.",
      keyPoints: [
        "It divides into anterior and posterior tibial arteries near the lower border of popliteus.",
        "It can be endangered by knee dislocation.",
      ],
      difficulty: 1,
      distractorIds: ["femoral-artery", "anterior-tibial-artery", "posterior-tibial-artery"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.5 },
    },
    {
      id: "anterior-tibial-artery",
      label: "Anterior tibial artery",
      tissue: "artery",
      aliases: ["anterior tibial vessel"],
      description:
        "This popliteal branch passes through the proximal interosseous membrane into the anterior compartment and descends with the deep fibular nerve.",
      keyPoints: [
        "It continues as dorsalis pedis at the ankle.",
        "Its distal pulse is assessed on the dorsum of the foot through dorsalis pedis.",
      ],
      difficulty: 2,
      distractorIds: ["posterior-tibial-artery", "fibular-artery", "popliteal-artery"],
      view: { azimuth: 0.4, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "posterior-tibial-artery",
      label: "Posterior tibial artery",
      tissue: "artery",
      aliases: ["posterior tibial vessel"],
      description:
        "This terminal branch of the popliteal artery descends in the deep posterior compartment and passes behind the medial malleolus into the sole.",
      keyPoints: [
        "Its pulse is palpated posterior to the medial malleolus.",
        "It terminates as the medial and lateral plantar arteries.",
      ],
      difficulty: 1,
      distractorIds: ["anterior-tibial-artery", "fibular-artery", "popliteal-artery"],
      view: { azimuth: 3.8, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "fibular-artery",
      schematic: true,
      label: "Fibular artery",
      tissue: "artery",
      aliases: ["peroneal artery"],
      description:
        "The fibular artery usually arises from the posterior tibial artery and descends close to the fibula in the deep posterior compartment.",
      keyPoints: [
        "It supplies the lateral and deep posterior leg and contributes to ankle anastomoses.",
        "Its course is distinct from the superficial fibular nerve in the lateral compartment.",
      ],
      difficulty: 2,
      distractorIds: ["posterior-tibial-artery", "anterior-tibial-artery", "popliteal-artery"],
      view: { azimuth: 2.4, elevation: 0.05, zoom: 1.5 },
    },
    {
      id: "great-saphenous-vein",
      label: "Great saphenous vein",
      tissue: "vein",
      aliases: ["long saphenous vein", "GSV"],
      description:
        "The great saphenous vein begins medially in the dorsal venous arch, passes anterior to the medial malleolus, ascends medially, and drains into the femoral vein at the saphenous opening.",
      keyPoints: [
        "It is the longest vein in the body and is used for grafts and venous access.",
        "Its valves and perforators are clinically important in varicose veins.",
      ],
      difficulty: 1,
      distractorIds: ["small-saphenous-vein", "femoral-vein", "popliteal-vein"],
      view: { azimuth: -0.8, elevation: 0.05, zoom: 1.1 },
    },
    {
      id: "small-saphenous-vein",
      label: "Small saphenous vein",
      tissue: "vein",
      aliases: ["short saphenous vein", "SSV"],
      description:
        "The small saphenous vein begins laterally in the dorsal venous arch, passes posterior to the lateral malleolus, and ascends the posterior calf to drain into the popliteal vein.",
      keyPoints: [
        "It commonly accompanies the sural nerve.",
        "Its termination is variable and should be mapped before intervention.",
      ],
      difficulty: 2,
      distractorIds: ["great-saphenous-vein", "popliteal-vein", "femoral-vein"],
      view: { azimuth: 3.14159, elevation: 0, zoom: 1.3 },
    },
    {
      id: "femoral-vein",
      label: "Femoral vein",
      tissue: "vein",
      aliases: ["femoral venous trunk"],
      description:
        "The femoral vein accompanies the femoral artery, lying medial to it in the femoral triangle, and becomes the external iliac vein deep to the inguinal ligament.",
      keyPoints: [
        "It receives the great saphenous and profunda femoris veins.",
        "It is a major site considered in lower-limb deep venous thrombosis and central access.",
      ],
      difficulty: 1,
      distractorIds: ["popliteal-vein", "great-saphenous-vein", "small-saphenous-vein"],
      view: { azimuth: -0.4, elevation: 0.1, zoom: 1.4 },
    },
    {
      id: "popliteal-vein",
      label: "Popliteal vein",
      tissue: "vein",
      aliases: ["popliteal venous trunk"],
      description:
        "The popliteal vein is formed by deep veins of the leg, lies superficial to the popliteal artery in the fossa, and becomes the femoral vein at the adductor hiatus.",
      keyPoints: [
        "It usually receives the small saphenous vein.",
        "Popliteal or femoral thrombosis is a clinically important proximal DVT.",
      ],
      difficulty: 2,
      distractorIds: ["femoral-vein", "small-saphenous-vein", "great-saphenous-vein"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.5 },
    },
    ...lowerLimbNerveDetailStructures,
    ...lowerLimbDetailStructures,
    ...imageMeshStructures("lower-limb"),
    ...practicalMeshStructures("lower-limb"),
    ...practicalLandmarkStructures("lower-limb"),
    ...lowerPracticalConnectiveStructures,
  ],
};
