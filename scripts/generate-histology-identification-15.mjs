import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "data/bank/questions/histology-identification-15.jsonl");
const imageRoot = "histology/practicals/identification-15";

const book = (title, chapter, page, figure) => ({ title, edition: title.startsWith("Junqueira") ? "16th" : "11th", chapter, page, figure });
const course = (slide) => ({
  title: "TUMS Histology Practical Revision Slide Album",
  chapter: "Aug 22 microscope identification practical",
  lecture: "Practical revision session",
  slide,
});
const courseMorphology = (detail) => course(
  `2026-08 course microscope field: ${detail}; labels excluded and morphology independently verified`,
);
const practicalDeck = (slide) => ({
  title: "PRACTICAL.pptx",
  chapter: "Histology practical slide atlas",
  slide: `Slide ${slide}`,
});
const openGanglionSource = (slide) => ({
  title: "Open teaching micrographs — sensory (dorsal root) ganglion",
  chapter: "Sensory ganglion identification",
  lecture: "Wikimedia Commons (Merlin-UK, CC BY-SA 3.0) and UNSW Embryology",
  slide,
});

const specimens = [
  {
    slug: "trachea",
    name: "Trachea",
    accepted: ["trachea", "tracheal wall", "respiratory epithelium", "pseudostratified", "pseudostratified epithelium", "pseudostratified ciliated epithelium", "ciliated pseudostratified columnar epithelium"],
    priorityGroup: "epithelium-comparison",
    topic: "Respiratory system",
    subtopic: "Trachea identification",
    chapter: "Chapter 17 - The Respiratory System",
    source: book("Junqueira's Basic Histology", "Chapter 17 - The Respiratory System", "PDF 365; printed 354", "Figure 17-5"),
    overviewSource: courseMorphology("trachea with airway lumen, glands and cartilage"),
    overviewMedia: "trachea-course.jpg",
    cues: [
      "Ciliated pseudostratified respiratory epithelium sits above a gland-rich wall and hyaline cartilage.",
      "The close wall field keeps the respiratory lining, seromucous glands and supporting cartilage in the same orientation.",
    ],
    tissueDistractors: [
      ["Urinary bladder", "Bladder has urothelium and detrusor muscle, but no cilia, seromucous glands or hyaline cartilage."],
      ["Thyroid", "Thyroid is built from colloid-filled follicles and lacks a layered airway wall."],
      ["Skin without hair", "Hairless skin has keratinized epidermis and eccrine glands, not respiratory epithelium and cartilage."],
    ],
    parts: [
      {
        suffix: "respiratory-epithelium",
        media: "field-a",
        annotation: { x: 6, y: 3, width: 88, height: 34 },
        prompt: "Which tracheal component is enclosed by marker A at the luminal edge?",
        correct: "Ciliated pseudostratified respiratory epithelium",
        accepted: ["respiratory epithelium", "ciliated pseudostratified epithelium"],
        explanation: "Marker A surrounds the tall pseudostratified lining with apical cilia and basal nuclei: respiratory epithelium.",
        distractors: [
          ["Urothelium", "Urothelium has rounded umbrella cells and no apical ciliary border."],
          ["Keratinized stratified squamous epithelium", "Keratinized epithelium has a surface keratin sheet and flattened superficial cells."],
          ["Simple cuboidal epithelium", "A simple cuboidal lining is one cell layer thick and does not have the pseudostratified nuclear pattern shown."],
        ],
      },
      {
        suffix: "trachealis-smooth-muscle",
        media: "field-b",
        annotation: { x: 3, y: 61, width: 94, height: 37 },
        prompt: "Which muscular tissue forms the band enclosed by marker A in this tracheal-wall field?",
        correct: "Trachealis smooth muscle",
        accepted: ["trachealis muscle", "trachealis smooth muscle", "smooth muscle"],
        explanation: "The marked eosinophilic band contains parallel bundles of spindle-shaped, nonstriated cells: trachealis smooth muscle.",
        distractors: [
          ["Hyaline cartilage", "Hyaline cartilage has rounded chondrocytes in lacunae within a glassy matrix; those features are absent from the marked band."],
          ["Seromucous gland", "The glandular acini sit above the marker and have clustered secretory cells with small lumina, unlike this long fascicular band."],
          ["Dense irregular connective tissue", "Dense irregular connective tissue has interwoven collagen bundles rather than aligned spindle-shaped smooth-muscle cells."],
        ],
      },
    ],
  },
  {
    slug: "bladder",
    name: "Urinary bladder",
    accepted: ["bladder", "urinary bladder", "urothelium", "transitional", "transitional epithelium"],
    priorityGroup: "epithelium-comparison",
    topic: "Urinary system",
    subtopic: "Bladder identification",
    chapter: "Chapter 19 - The Urinary System",
    source: book("diFiore's Atlas of Histology with Functional Correlations", "Chapter 16 - Urinary System", "PDF 397; printed 377", "Figures 16.13-16.14"),
    overviewSource: courseMorphology("urinary bladder with folded urothelium and detrusor"),
    overviewMedia: "bladder-course.jpg",
    cues: [
      "A folded multilayered urothelium faces the lumen and an unusually thick wall of interlacing smooth muscle lies outside it.",
      "Even in a narrower field, the thick urothelial folds beside irregular detrusor bundles identify bladder.",
    ],
    tissueDistractors: [
      ["Trachea", "Trachea has ciliated respiratory epithelium, glands and cartilage instead of urothelium and detrusor."],
      ["Thyroid", "Thyroid uses a single cuboidal layer around colloid-filled follicles, not multilayered transitional epithelium with umbrella cells."],
      ["Skin without hair", "Thick skin has a keratin surface and dermal papillae, not folded urothelium."],
    ],
    parts: [
      {
        suffix: "urothelium",
        media: "field-a",
        annotation: { x: 47, y: 6, width: 48, height: 86 },
        prompt: "Which lining is enclosed by marker A on the folded luminal surface?",
        correct: "Urothelium (transitional epithelium)",
        accepted: ["urothelium", "transitional epithelium"],
        explanation: "Marker A follows the thick folded urothelium, including its large superficial umbrella cells.",
        distractors: [
          ["Respiratory epithelium", "Respiratory epithelium is ciliated and pseudostratified and normally includes goblet cells."],
          ["Simple columnar epithelium", "Simple columnar epithelium is a single layer, unlike this distensible multilayered lining."],
          ["Keratinized stratified squamous epithelium", "Keratinized epithelium ends in an anuclear keratin layer, which is absent here."],
        ],
      },
      {
        suffix: "detrusor",
        media: "field-b",
        annotation: { x: 8, y: 18, width: 72, height: 66 },
        prompt: "Which wall component occupies marker A in this bladder field?",
        correct: "Detrusor smooth muscle",
        accepted: ["detrusor", "smooth muscle", "detrusor muscle"],
        explanation: "The marked thick, irregularly interlacing fascicles are the detrusor smooth muscle of the bladder wall.",
        distractors: [
          ["Skeletal muscle", "Skeletal muscle would show long striated fibers and multiple peripheral nuclei."],
          ["Dense regular collagen", "Dense regular collagen is parallel and relatively acellular, not interlacing cellular fascicles."],
          ["Hyaline cartilage", "Hyaline cartilage has chondrocytes in lacunae within a homogeneous matrix."],
        ],
      },
    ],
  },
  {
    slug: "bone",
    name: "Spongy (trabecular) bone",
    accepted: ["spongy bone", "trabecular bone", "cancellous bone", "bone"],
    priorityGroup: "joint-cartilage-bone",
    topic: "Bone",
    subtopic: "Spongy bone identification",
    chapter: "Chapter 8 - Bone",
    source: course("2026-08-21 clarification: spongy bone with trabeculae, not compact bone"),
    alternateSource: practicalDeck(34),
    overviewSource: courseMorphology("spongy bone with trabeculae and marrow spaces"),
    overviewMedia: "bone-course.jpg",
    secondSource: courseMorphology("second spongy-bone field with branching trabeculae"),
    secondMedia: "bone-course-detail.jpg",
    cues: [
      "Branching eosinophilic trabeculae form a lattice around broad marrow spaces; complete osteons are not the organizing pattern.",
      "The second field again shows irregular bony plates with osteocyte lacunae separated by marrow, confirming spongy bone.",
    ],
    tissueDistractors: [
      ["Hyaline cartilage", "Hyaline cartilage has a glassy matrix and isogenous chondrocyte groups, not a trabecular lattice with marrow."],
      ["Tendon", "Tendon has parallel collagen bundles and rows of tenocyte nuclei, not mineralized trabeculae."],
      ["Synovial joint", "A joint is recognized by opposing articular surfaces and a cavity; this field is cancellous bone itself."],
    ],
    parts: [
      {
        suffix: "trabecula",
        media: "field-a",
        source: practicalDeck(34),
        annotation: { x: 55, y: 10, width: 18, height: 78 },
        prompt: "Which structure is enclosed by marker A in this spongy-bone field?",
        correct: "Bone trabecula",
        accepted: ["trabecula", "bone trabecula", "trabecula of spongy bone"],
        explanation: "Marker A lies on a branching eosinophilic bony plate containing osteocyte lacunae: a trabecula.",
        distractors: [
          ["Marrow space", "Marrow spaces are the pale cellular regions between trabeculae, not the solid eosinophilic plate."],
          ["Haversian canal", "A Haversian canal is central to a concentric osteon; spongy trabeculae usually lack complete osteons."],
          ["Perichondrium", "Perichondrium surrounds cartilage and is not part of this trabecular bone lattice."],
        ],
      },
      {
        suffix: "marrow-space",
        media: "field-a",
        source: practicalDeck(34),
        annotation: { x: 34, y: 30, width: 18, height: 35 },
        prompt: "What occupies the region enclosed by marker A between bony plates?",
        correct: "Marrow space",
        accepted: ["marrow", "marrow space", "bone marrow space"],
        explanation: "The marked pale interval lies between trabeculae and contains marrow rather than mineralized matrix.",
        distractors: [
          ["Osteon", "An osteon is concentric lamellar bone around a central canal, not the open region between trabeculae."],
          ["Cartilage lacuna", "A cartilage lacuna is a microscopic cavity around one chondrocyte, far smaller than this marrow compartment."],
          ["Joint cavity", "A joint cavity lies between opposing articular surfaces, not throughout cancellous bone."],
        ],
      },
    ],
  },
  {
    slug: "cartilage",
    name: "Hyaline cartilage",
    accepted: ["hyaline cartilage", "cartilage"],
    priorityGroup: "joint-cartilage-bone",
    topic: "Cartilage",
    subtopic: "Hyaline cartilage identification",
    chapter: "Chapter 7 - Cartilage",
    source: book("Junqueira's Basic Histology", "Chapter 7 - Cartilage", "PDF 143; printed 132", "Figure 7-3b"),
    overviewSource: courseMorphology("hyaline cartilage with chondrocytes in lacunae"),
    overviewMedia: "cartilage-course.jpg",
    secondSource: courseMorphology("second hyaline-cartilage field with isogenous groups"),
    secondMedia: "cartilage-course-detail.jpg",
    cues: [
      "Rounded chondrocytes sit in lacunae within a smooth basophilic matrix, often in small isogenous groups.",
      "The closer field retains lacunae, chondrocyte clusters and darker territorial matrix without visible thick type I bundles.",
    ],
    tissueDistractors: [
      ["Spongy bone", "Spongy bone has eosinophilic trabeculae and marrow spaces rather than a homogeneous cartilage matrix."],
      ["Synovial joint", "A joint shows opposing articular surfaces and a cavity; this field is one continuous cartilage matrix."],
      ["Tendon", "Tendon has parallel type I collagen and thin tenocyte nuclei, not round lacunae."],
    ],
    parts: [
      {
        suffix: "chondrocyte-lacuna",
        media: "field-a",
        annotation: { x: 32, y: 12, width: 18, height: 20 },
        prompt: "Which cell-and-space unit is enclosed by marker A?",
        correct: "Chondrocyte in a lacuna",
        accepted: ["chondrocyte", "chondrocyte in lacuna", "lacuna with chondrocyte"],
        explanation: "Marker A surrounds a rounded chondrocyte and its lacuna within the hyaline matrix.",
        distractors: [
          ["Osteocyte in a lacuna", "Osteocytes lie in mineralized lamellae and connect through canaliculi, which are not seen here."],
          ["Adipocyte", "An adipocyte has a large lipid vacuole and a thin cytoplasmic rim, not cartilage matrix around it."],
          ["Fibroblast", "A fibroblast is spindle-shaped between fibers and does not occupy a round cartilage lacuna."],
        ],
      },
      {
        suffix: "isogenous-group",
        media: "field-b",
        annotation: { x: 58, y: 66, width: 30, height: 25 },
        prompt: "What is the marked cluster of daughter chondrocytes called?",
        correct: "Isogenous group",
        accepted: ["isogenous group", "cell nest"],
        explanation: "The marked adjacent chondrocytes form a cell nest derived from division of one chondrocyte: an isogenous group.",
        distractors: [
          ["Osteon", "An osteon is concentric bone lamellae around a central canal."],
          ["Follicle", "A follicle is an epithelial sphere around a lumen or colloid, not a chondrocyte cluster."],
          ["Nerve fascicle", "A nerve fascicle contains many axons enclosed by perineurium, not chondrocytes in lacunae."],
        ],
      },
    ],
  },
  {
    slug: "joint",
    name: "Synovial joint",
    accepted: ["joint", "synovial joint"],
    priorityGroup: "joint-cartilage-bone",
    topic: "Bone and joint tissue",
    subtopic: "Synovial joint identification",
    chapter: "Chapter 8 - Bone",
    source: course("Course microscope image: opposing articular surfaces and joint space"),
    overviewSource: courseMorphology("synovial joint with opposing articular surfaces and cavity"),
    overviewMedia: "joint-course.jpg",
    cues: [
      "Opposing articular surfaces meet across a pale joint cavity, with capsule and periarticular connective tissue around them.",
      "A tighter field still shows the discontinuity between articular surfaces rather than one solid tissue mass.",
    ],
    tissueDistractors: [
      ["Spongy bone", "Spongy bone is a lattice of trabeculae and marrow, not two opposing surfaces around a cavity."],
      ["Tendon", "Tendon is a continuous parallel collagen bundle and lacks an articular cavity."],
      ["Hyaline cartilage", "Articular cartilage is one component of the joint; the whole field includes two surfaces and a cavity."],
    ],
    parts: [
      {
        suffix: "joint-cavity",
        media: "field-a",
        annotation: { x: 41, y: 1, width: 11, height: 55 },
        prompt: "Which space is enclosed by marker A between the opposing articular surfaces?",
        correct: "Synovial joint cavity",
        accepted: ["joint cavity", "synovial cavity", "synovial joint cavity"],
        explanation: "Marker A lies in the pale cleft separating the articular surfaces: the synovial joint cavity.",
        distractors: [
          ["Marrow cavity", "Marrow cavities occur within bone and contain hematopoietic or fatty marrow, not a slit between articular surfaces."],
          ["Haversian canal", "A Haversian canal is microscopic and central to an osteon, not this macroscopic cleft."],
          ["Bursa", "A bursa is a separate synovial sac near a joint, not the principal space between the articulating surfaces shown."],
        ],
      },
      {
        suffix: "articular-cartilage",
        media: "field-b",
        annotation: { x: 20, y: 20, width: 18, height: 50 },
        prompt: "Which tissue covers the marked joint surface?",
        correct: "Articular hyaline cartilage",
        accepted: ["articular cartilage", "hyaline cartilage", "articular hyaline cartilage"],
        explanation: "The marked smooth covering on the bone end is articular hyaline cartilage.",
        distractors: [
          ["Periosteum", "Periosteum covers external bone but is absent from the articular surface itself."],
          ["Dense regular connective tissue", "Dense regular connective tissue forms tendons and ligaments and does not create the smooth cartilage cap."],
          ["Fibrocartilage disc", "A fibrocartilage disc is an intra-articular structure in selected joints, not the covering of the bone end."],
        ],
      },
    ],
  },
  {
    slug: "nerve",
    name: "Peripheral nerve",
    accepted: ["nerve", "peripheral nerve"],
    priorityGroup: "ganglion-nerve",
    topic: "Nervous tissue",
    subtopic: "Peripheral nerve identification",
    chapter: "Chapter 9 - Nerve Tissue and the Nervous System",
    source: book("diFiore's Atlas of Histology with Functional Correlations", "Chapter 7 - Nervous Tissue", "PDF 179; printed 159", "Figure 7.15"),
    overviewSource: courseMorphology("transverse peripheral nerve with multiple fascicles"),
    overviewMedia: "nerve-course.jpg",
    cues: [
      "The low-power field shows rounded fascicles within surrounding connective tissue, the organizing pattern of a peripheral nerve.",
      "The higher-power field resolves myelinated axon profiles grouped into fascicles and bounded by perineurium.",
    ],
    tissueDistractors: [
      ["Ganglion", "A ganglion contains large neuronal cell bodies with satellite-cell rings; this field is organized into axon fascicles."],
      ["Tendon", "Tendon has parallel collagen and tenocyte nuclei rather than many circular myelinated axon profiles."],
      ["Skeletal muscle", "Skeletal muscle has large fibers with striations or peripheral nuclei, not perineurial fascicles."],
    ],
    parts: [
      {
        suffix: "fascicle",
        media: "field-a",
        annotation: { x: 3, y: 24, width: 52, height: 66 },
        prompt: "Which nerve compartment is enclosed by marker A?",
        correct: "Nerve fascicle",
        accepted: ["fascicle", "nerve fascicle"],
        explanation: "Marker A encloses a bundle of many axons grouped together as a nerve fascicle.",
        distractors: [
          ["Ganglion", "A ganglion is a collection of neuronal cell bodies, not a bundle of axons."],
          ["Muscle fascicle", "A muscle fascicle contains large muscle fibers rather than numerous tiny myelinated axon profiles."],
          ["Bone trabecula", "A bone trabecula is mineralized eosinophilic matrix with osteocyte lacunae."],
        ],
      },
      {
        suffix: "perineurium",
        media: "field-b",
        annotation: { x: 0, y: 35, width: 63, height: 60 },
        prompt: "Which connective-tissue sheath surrounds the large fascicle enclosed by marker A?",
        correct: "Perineurium",
        accepted: ["perineurium", "perineurial sheath"],
        explanation: "The marked concentric sheath directly enclosing one fascicle is the perineurium.",
        distractors: [
          ["Endoneurium", "Endoneurium surrounds individual nerve fibers inside a fascicle, not the whole bundle."],
          ["Epineurium", "Epineurium surrounds the entire nerve and fills between fascicles, not the immediate fascicular boundary."],
          ["Perimysium", "Perimysium surrounds skeletal-muscle fascicles, not nerve fascicles."],
        ],
      },
    ],
  },
  {
    slug: "ganglion",
    name: "Sensory ganglion",
    accepted: ["ganglion", "sensory ganglion", "dorsal root ganglion"],
    priorityGroup: "ganglion-nerve",
    topic: "Nervous tissue",
    subtopic: "Ganglion identification",
    chapter: "Chapter 9 - Nerve Tissue and the Nervous System",
    source: openGanglionSource("Merlin-UK fields 007–008 and unlabeled UNSW close field"),
    cues: [
      "Large round neuronal somata with prominent nuclei are clustered inside a capsule and each soma has a tight satellite-cell rim.",
      "The closer field emphasizes densely packed sensory neuron cell bodies rather than axon-only fascicles.",
    ],
    tissueDistractors: [
      ["Peripheral nerve", "Peripheral nerve is dominated by axon profiles in fascicles and lacks many large neuronal somata."],
      ["Thyroid", "Thyroid has colloid-filled follicles with cuboidal epithelium, not neuronal cell bodies."],
      ["Brown adipose tissue", "Brown adipose has multilocular fat cells and capillaries, not satellite-cell rings around neurons."],
    ],
    parts: [
      {
        suffix: "neuron-soma",
        media: "field-a",
        annotation: { x: 55, y: 30, width: 27, height: 32 },
        prompt: "Which principal cell type is enclosed by marker A in this sensory ganglion?",
        correct: "Sensory neuron cell body",
        accepted: ["neuron", "neuronal cell body", "sensory neuron", "sensory neuron soma"],
        explanation: "Marker A encloses the large round sensory neuron somata, recognized by pale nuclei and prominent nucleoli.",
        distractors: [
          ["Satellite cell", "Satellite cells are the small dark cells forming a ring around the much larger neuron."],
          ["Schwann cell", "Schwann cells accompany peripheral axons and do not have this large soma and prominent nucleolus."],
          ["Adipocyte", "An adipocyte is dominated by lipid droplets and lacks a neuronal nucleus and satellite-cell ring."],
        ],
      },
      {
        suffix: "satellite-cells",
        media: "field-b",
        annotation: { x: 0, y: 1, width: 58, height: 56 },
        prompt: "Which small supporting cells form the dark rings around the neuronal somata inside marker A?",
        correct: "Satellite glial cells",
        accepted: ["satellite cells", "satellite glial cells"],
        explanation: "The marked dark nuclei form a nearly continuous satellite-cell capsule around a sensory neuron.",
        distractors: [
          ["Oligodendrocytes", "Oligodendrocytes are CNS glia and do not form this peripheral ganglion cell capsule."],
          ["Schwann cells", "Schwann cells ensheath axons, whereas satellite cells surround neuronal somata in ganglia."],
          ["Follicular cells", "Follicular cells line thyroid follicles and are unrelated to neuronal cell bodies."],
        ],
      },
    ],
  },
  {
    slug: "skin-with-hair",
    name: "Skin with hair (thin skin)",
    accepted: ["skin with hair", "thin skin", "hairy skin"],
    priorityGroup: "thin-thick-skin",
    topic: "Skin",
    subtopic: "Hair-bearing skin identification",
    chapter: "Chapter 18 - Skin",
    source: book("diFiore's Atlas of Histology with Functional Correlations", "Chapter 10 - Integument", "PDF 241; printed 221", "Figure 10.1"),
    overviewSource: courseMorphology("thin skin with unmistakable hair follicles"),
    overviewMedia: "skin-with-hair-course.jpg",
    cues: [
      "Hair follicles descend from a relatively thin epidermis into the dermis, with sebaceous glands attached to follicles.",
      "A second field still contains a follicular epithelial sheath and hair shaft, which excludes glabrous skin.",
    ],
    tissueDistractors: [
      ["Skin without hair", "Glabrous skin lacks hair follicles and sebaceous glands and has a much thicker surface keratin layer."],
      ["Urinary bladder", "Bladder has folded urothelium over smooth muscle and no hair appendages."],
      ["Trachea", "Trachea has respiratory epithelium, glands and cartilage, not epidermis and follicles."],
    ],
    parts: [
      {
        suffix: "hair-follicle",
        media: "field-a",
        annotation: { x: 25, y: 10, width: 43, height: 84 },
        prompt: "Which skin appendage is enclosed by marker A?",
        correct: "Hair follicle",
        accepted: ["hair follicle", "follicle"],
        explanation: "Marker A follows the epithelial root sheath surrounding a hair shaft: a hair follicle.",
        distractors: [
          ["Eccrine sweat gland", "Eccrine glands are coiled tubular profiles without a central hair shaft."],
          ["Sebaceous gland", "Sebaceous glands are pale lobules attached to a follicle, not the long follicular sheath itself."],
          ["Arrector pili muscle", "Arrector pili is a thin smooth-muscle bundle attached obliquely to the follicle."],
        ],
      },
      {
        suffix: "sebaceous-gland",
        media: "field-b",
        annotation: { x: 18, y: 62, width: 28, height: 30 },
        prompt: "Which gland is enclosed by marker A beside the hair follicle?",
        correct: "Sebaceous gland",
        accepted: ["sebaceous gland", "sebaceous glands"],
        explanation: "The marked pale lobules open into the nearby follicle and are sebaceous glands.",
        distractors: [
          ["Eccrine sweat gland", "Eccrine glands form darker coiled tubules and open independently onto the surface."],
          ["Apocrine sweat gland", "Apocrine glands have large lumina and deeper coiled secretory units rather than pale holocrine lobules."],
          ["Meissner corpuscle", "A Meissner corpuscle is a small sensory structure in a dermal papilla, not a lobular gland."],
        ],
      },
    ],
  },
  {
    slug: "skin-without-hair",
    name: "Skin without hair (thick skin)",
    accepted: ["skin without hair", "thick skin", "glabrous skin"],
    priorityGroup: "thin-thick-skin",
    topic: "Skin",
    subtopic: "Glabrous skin identification",
    chapter: "Chapter 18 - Skin",
    source: book("diFiore's Atlas of Histology with Functional Correlations", "Chapter 10 - Integument", "PDF 247; printed 227", "Figure 10.7"),
    overviewSource: courseMorphology("glabrous skin with thick keratin and no hair follicles"),
    overviewMedia: "skin-without-hair-course.jpg",
    cues: [
      "A very thick keratinized epidermis with deep rete ridges overlies dermis containing eccrine glands but no hair follicles.",
      "The tighter field preserves the massive stratum corneum and regular epidermal ridges characteristic of palm or sole skin.",
    ],
    tissueDistractors: [
      ["Skin with hair", "Hair-bearing skin has follicles and sebaceous glands and usually a much thinner stratum corneum."],
      ["Urinary bladder", "Bladder has urothelium and detrusor, not a keratinized epidermis with dermal ridges."],
      ["Tendon", "Tendon is parallel collagen with tenocytes and has no surface epithelium or sweat glands."],
    ],
    parts: [
      {
        suffix: "stratum-corneum",
        media: "field-a",
        annotation: { x: 61, y: 4, width: 35, height: 88 },
        prompt: "Which epidermal layer is enclosed by marker A at the surface?",
        correct: "Stratum corneum",
        accepted: ["stratum corneum", "cornified layer", "keratin layer"],
        explanation: "The marked very thick, eosinophilic, anuclear surface layer is the stratum corneum.",
        distractors: [
          ["Stratum basale", "The stratum basale is the single deepest germinative layer along the dermal junction."],
          ["Papillary dermis", "Papillary dermis is loose connective tissue below the epidermis, not the surface keratin sheet."],
          ["Urothelium", "Urothelium is a nonkeratinized urinary lining and has superficial umbrella cells."],
        ],
      },
      {
        suffix: "eccrine-gland",
        media: "field-b",
        annotation: { x: 33, y: 35, width: 38, height: 42 },
        prompt: "Which appendage is enclosed by marker A in the deep dermis?",
        correct: "Eccrine sweat gland",
        accepted: ["eccrine gland", "eccrine sweat gland", "sweat gland"],
        explanation: "Marker A encloses multiple small coiled tubular profiles typical of an eccrine sweat gland.",
        distractors: [
          ["Sebaceous gland", "Sebaceous glands are pale lobules associated with hair follicles, which thick skin lacks."],
          ["Hair follicle", "A follicle has an elongated epithelial sheath and hair shaft; neither is present here."],
          ["Thyroid follicle", "Thyroid follicles contain colloid and occur in thyroid parenchyma, not dermis."],
        ],
      },
    ],
  },
  {
    slug: "white-adipose",
    name: "White adipose tissue",
    accepted: ["white adipose", "white adipose tissue", "white fat", "unilocular adipose tissue"],
    priorityGroup: "adipose-tendon",
    topic: "Adipose tissue",
    subtopic: "White adipose identification",
    chapter: "Chapter 6 - Adipose Tissue",
    source: book("Junqueira's Basic Histology", "Chapter 6 - Adipose Tissue", "PDF 134; printed 123", "Figure 6-3"),
    overviewSource: courseMorphology("white adipose with large unilocular adipocytes"),
    overviewMedia: "white-adipose-course.jpg",
    cues: [
      "The course field is dominated by large empty-appearing unilocular cells separated by delicate septa.",
      "The higher-power field shows signet-ring adipocytes with one large lipid space and a thin cytoplasmic rim.",
    ],
    tissueDistractors: [
      ["Brown adipose tissue", "Brown adipocytes are smaller and multilocular with more central nuclei and a dense capillary network."],
      ["Tendon", "Tendon is a solid field of parallel wavy collagen with thin tenocyte nuclei, not large clear unilocular cells."],
      ["Thyroid", "Thyroid follicles have cuboidal epithelial walls and homogeneous colloid, not empty lipid spaces."],
    ],
    parts: [
      {
        suffix: "unilocular-adipocyte",
        media: "field-a",
        annotation: { x: 14, y: 18, width: 30, height: 40 },
        prompt: "Which cell is enclosed by marker A?",
        correct: "Unilocular adipocyte",
        accepted: ["adipocyte", "white adipocyte", "unilocular adipocyte"],
        explanation: "Marker A encloses one large white adipocyte whose single lipid droplet was dissolved during processing.",
        distractors: [
          ["Brown adipocyte", "A brown adipocyte contains many small lipid droplets and more eosinophilic cytoplasm."],
          ["Thyroid follicle", "A follicle has an epithelial wall surrounding colloid rather than one flattened cell rim."],
          ["Chondrocyte", "A chondrocyte lies in a lacuna within cartilage matrix and is far smaller."],
        ],
      },
      {
        suffix: "capillary",
        media: "field-b",
        annotation: { x: 38, y: 40, width: 28, height: 30 },
        prompt: "Which small vascular structure is enclosed by marker A between white adipocytes?",
        correct: "Capillary",
        accepted: ["capillary", "blood capillary", "small blood vessel"],
        explanation: "Marker A encloses a thin endothelial tube containing erythrocytes: a capillary between adipocytes.",
        distractors: [
          ["Unilocular adipocyte", "An adipocyte is the much larger clear signet-ring cell surrounding a single lipid space."],
          ["Lipid droplet", "A lipid droplet is the large clear space within an adipocyte and has no endothelial wall or erythrocytes."],
          ["Collagen septum", "A collagen septum is an elongated fibrous partition and does not contain erythrocytes in a lumen."],
        ],
      },
    ],
  },
  {
    slug: "brown-adipose",
    name: "Brown adipose tissue",
    accepted: ["brown adipose", "brown adipose tissue", "multilocular adipose tissue"],
    priorityGroup: "adipose-tendon",
    topic: "Adipose tissue",
    subtopic: "Brown adipose identification",
    chapter: "Chapter 6 - Adipose Tissue",
    source: book("Junqueira's Basic Histology", "Chapter 6 - Adipose Tissue", "PDF 137; printed 126", "Figure 6-4a"),
    cues: [
      "Smaller polygonal cells contain many lipid vacuoles and relatively eosinophilic cytoplasm among abundant capillaries.",
      "The alternate field again shows multilocular adipocytes rather than the single huge vacuole of white fat.",
    ],
    tissueDistractors: [
      ["White adipose tissue", "White adipocytes are larger, unilocular and have flattened peripheral nuclei."],
      ["Tendon", "Tendon has parallel type I collagen bundles and thin tenocyte nuclei rather than multilocular adipocytes."],
      ["Thyroid", "Thyroid is organized into colloid-filled follicles with continuous epithelial walls."],
    ],
    parts: [
      {
        suffix: "multilocular-adipocyte",
        media: "field-a",
        annotation: { x: 34, y: 25, width: 31, height: 33 },
        prompt: "Which cell type is enclosed by marker A?",
        correct: "Multilocular brown adipocyte",
        accepted: ["brown adipocyte", "multilocular adipocyte"],
        explanation: "Marker A surrounds a brown adipocyte with numerous small lipid droplets and appreciable cytoplasm.",
        distractors: [
          ["Unilocular white adipocyte", "A white adipocyte has one dominant clear lipid space and a flattened peripheral nucleus."],
          ["Foam macrophage", "A foam macrophage can be vacuolated but does not form this uniform adipose lobule pattern."],
          ["Mucous acinar cell", "Mucous cells are arranged around acinar lumina in glands, not as vascular adipose tissue."],
        ],
      },
      {
        suffix: "central-nucleus",
        media: "field-b",
        annotation: { x: 44, y: 64, width: 10, height: 12 },
        prompt: "What is the dark round structure enclosed by marker A within a brown adipocyte?",
        correct: "Central adipocyte nucleus",
        accepted: ["nucleus", "central nucleus", "brown adipocyte nucleus"],
        explanation: "Brown adipocytes commonly retain a round, relatively central nucleus between multiple lipid droplets.",
        distractors: [
          ["Peripheral adipocyte nucleus", "A flattened peripheral nucleus is characteristic of a mature white adipocyte."],
          ["Lipid droplet", "Lipid droplets appear as clear vacuoles, not a dark basophilic round profile."],
          ["Erythrocyte", "Erythrocytes lie inside capillary lumina and are eosinophilic, not nucleated structures inside adipocytes."],
        ],
      },
    ],
  },
  {
    slug: "thyroid",
    name: "Thyroid gland",
    accepted: ["thyroid", "thyroid gland", "cuboidal epithelium", "simple cuboidal epithelium", "simple cuboidal"],
    priorityGroup: "epithelium-comparison",
    topic: "Endocrine organs",
    subtopic: "Thyroid identification",
    chapter: "Chapter 20 - Endocrine Glands",
    source: book("Junqueira's Basic Histology", "Chapter 20 - Endocrine Glands", "PDF 410; printed 399", "Figure 20-8"),
    overviewSource: courseMorphology("thyroid with colloid-filled follicles"),
    overviewMedia: "thyroid-course.jpg",
    cues: [
      "Many round follicles contain homogeneous eosinophilic colloid and are lined by simple cuboidal follicular cells.",
      "The second field shows follicles of different sizes separated by a capillary-rich stroma.",
    ],
    tissueDistractors: [
      ["Urinary bladder", "Bladder has multilayered transitional epithelium with umbrella cells and no colloid-filled follicles."],
      ["Trachea", "Trachea has pseudostratified ciliated epithelium, glands and cartilage rather than simple cuboidal follicular walls."],
      ["White adipose tissue", "White fat has empty unilocular cells without a cuboidal epithelial wall or colloid."],
    ],
    parts: [
      {
        suffix: "colloid",
        media: "field-a",
        annotation: { x: 57, y: 58, width: 37, height: 35 },
        prompt: "Which material is enclosed by marker A inside this thyroid follicle?",
        correct: "Colloid",
        accepted: ["colloid", "thyroid colloid"],
        explanation: "Marker A lies in the homogeneous eosinophilic follicular lumen containing thyroglobulin-rich colloid.",
        distractors: [
          ["Lipid droplet", "Lipid is dissolved during routine processing and leaves a clear vacuole rather than eosinophilic colloid."],
          ["Mucus", "Mucus occurs in exocrine or mucosal glands and does not fill thyroid follicles with this uniform appearance."],
          ["Bone matrix", "Bone matrix is mineralized and contains osteocyte lacunae, not an epithelial follicular lumen."],
        ],
      },
      {
        suffix: "follicular-cells",
        media: "field-b",
        annotation: { x: 40, y: 35, width: 31, height: 22 },
        prompt: "Which cells form the marked wall of the thyroid follicle?",
        correct: "Follicular cells",
        accepted: ["follicular cells", "thyroid follicular cells", "thyrocytes"],
        explanation: "The marked simple cuboidal epithelium consists of thyrocytes, or thyroid follicular cells.",
        distractors: [
          ["Parafollicular C cells", "C cells are paler cells in or beside follicular epithelium and do not form the entire follicle wall."],
          ["Umbrella cells", "Umbrella cells form the superficial urothelial layer in the urinary tract."],
          ["Chondrocytes", "Chondrocytes sit in lacunae within cartilage matrix rather than lining a colloid lumen."],
        ],
      },
    ],
  },
  {
    slug: "skeletal-muscle",
    name: "Skeletal muscle",
    accepted: ["skeletal muscle", "striated skeletal muscle"],
    priorityGroup: "cardiac-skeletal-muscle",
    topic: "Muscle tissue",
    subtopic: "Skeletal muscle identification",
    chapter: "Chapter 10 - Muscle Tissue",
    source: book("Junqueira's Basic Histology", "Chapter 10 - Muscle Tissue", "PDF 205; printed 194", "Figure 10-1a"),
    overviewSource: courseMorphology("longitudinal skeletal muscle with parallel fibers"),
    overviewMedia: "skeletal-muscle-course.jpg",
    cues: [
      "Long parallel unbranched fibers show very regular cross-striations and multiple elongated peripheral nuclei.",
      "The closer field preserves the uniform banding and parallel alignment that distinguish skeletal from cardiac muscle.",
    ],
    tissueDistractors: [
      ["Cardiac muscle", "Cardiac fibers branch, have central nuclei and show intercalated discs."],
      ["Tendon", "Tendon is collagenous and wavy with sparse flattened tenocyte nuclei and no cross-striations."],
      ["Peripheral nerve", "Nerve lacks myofibrillar striations and is arranged in perineurial fascicles."],
    ],
    parts: [
      {
        suffix: "cross-striations",
        media: "field-a",
        annotation: { x: 18, y: 8, width: 64, height: 52 },
        prompt: "Which feature is enclosed by marker A across these fibers?",
        correct: "Cross-striations",
        accepted: ["striations", "cross striations", "cross-striations"],
        explanation: "Marker A highlights the repeated dark and light bands produced by aligned sarcomeres.",
        distractors: [
          ["Intercalated discs", "Intercalated discs are less regular transverse junctional lines in cardiac muscle."],
          ["Collagen crimp", "Collagen crimp is broader waviness in tendon and does not form fine repetitive sarcomeric bands."],
          ["Myelin rings", "Myelin rings appear around axons in nerve cross-sections, not across longitudinal muscle fibers."],
        ],
      },
      {
        suffix: "peripheral-nucleus",
        media: "field-b",
        annotation: { x: 67, y: 56, width: 20, height: 17 },
        prompt: "What is the elongated dark structure enclosed by marker A at the edge of a fiber?",
        correct: "Peripheral skeletal-muscle nucleus",
        accepted: ["peripheral nucleus", "myonucleus", "skeletal muscle nucleus"],
        explanation: "The marked elongated nucleus lies just beneath the sarcolemma at the fiber periphery, a skeletal-muscle clue.",
        distractors: [
          ["Central cardiac nucleus", "Cardiac nuclei are central within shorter branching fibers."],
          ["Tenocyte nucleus", "A tenocyte nucleus lies between collagen bundles rather than beneath a striated muscle-fiber membrane."],
          ["Schwann-cell nucleus", "A Schwann-cell nucleus accompanies an axon and is not embedded in a striated muscle fiber."],
        ],
      },
    ],
  },
  {
    slug: "cardiac-muscle",
    name: "Cardiac muscle",
    accepted: ["cardiac muscle", "myocardium"],
    priorityGroup: "cardiac-skeletal-muscle",
    topic: "Muscle tissue",
    subtopic: "Cardiac muscle identification",
    chapter: "Chapter 10 - Muscle Tissue",
    source: book("Junqueira's Basic Histology", "Chapter 10 - Muscle Tissue", "PDF 215; printed 204", "Figure 10-8"),
    cues: [
      "Striated fibers branch and anastomose, with centrally placed nuclei and dark intercalated discs.",
      "The alternate field shows irregular fiber junctions and central nuclei rather than long parallel multinucleated fibers.",
    ],
    tissueDistractors: [
      ["Skeletal muscle", "Skeletal fibers are long, parallel, unbranched and have multiple peripheral nuclei."],
      ["Tendon", "Tendon has wavy collagen and sparse tenocytes but no striations or branching myocytes."],
      ["Ganglion", "A ganglion contains rounded neuronal somata and satellite cells, not branching striated fibers."],
    ],
    parts: [
      {
        suffix: "intercalated-disc",
        media: "field-a",
        annotation: { x: 51, y: 24, width: 10, height: 48 },
        prompt: "Which junctional structure is enclosed by marker A crossing a cardiac fiber?",
        correct: "Intercalated disc",
        accepted: ["intercalated disc", "intercalated disk"],
        explanation: "Marker A encloses a dark transverse cell-cell junction characteristic of cardiac muscle: an intercalated disc.",
        distractors: [
          ["Z line", "Z lines are fine repetitive sarcomeric lines and are far more closely spaced than this cell boundary."],
          ["Tendon septum", "A tendon septum is connective tissue and does not cross individual cardiac myocytes as a dark junction."],
          ["Perineurium", "Perineurium is a sheath around a nerve fascicle, not a junction between muscle cells."],
        ],
      },
      {
        suffix: "central-nucleus",
        media: "field-b",
        annotation: { x: 29, y: 10, width: 23, height: 16 },
        prompt: "Which structure is enclosed by marker A within this cardiac fiber?",
        correct: "Central cardiomyocyte nucleus",
        accepted: ["central nucleus", "cardiomyocyte nucleus", "cardiac muscle nucleus"],
        explanation: "The marked oval nucleus lies centrally in a cardiomyocyte, unlike the peripheral nuclei of skeletal muscle.",
        distractors: [
          ["Peripheral skeletal-muscle nucleus", "A skeletal myonucleus lies at the edge of a long unbranched fiber."],
          ["Tenocyte nucleus", "A tenocyte nucleus is thin and lies between collagen bundles without surrounding striated cytoplasm."],
          ["Satellite-cell nucleus", "Satellite-cell nuclei ring neuronal somata in ganglia, not cardiac fibers."],
        ],
      },
    ],
  },
  {
    slug: "tendon",
    name: "Tendon",
    accepted: ["tendon", "dense regular connective tissue"],
    priorityGroup: "adipose-tendon",
    topic: "Connective tissue",
    subtopic: "Tendon identification",
    chapter: "Chapter 5 - Connective Tissue",
    source: book("diFiore's Atlas of Histology with Functional Correlations", "Chapter 3 - Connective Tissue", "PDF 85; printed 65", "Figure 3.8"),
    overviewSource: courseMorphology("tendon with parallel wavy collagen bundles"),
    overviewMedia: "tendon-course.jpg",
    cues: [
      "Densely packed parallel wavy collagen bundles contain only sparse rows of flattened tenocyte nuclei.",
      "The closer field emphasizes collagen crimp and thin nuclei without muscle striations or nerve fascicles.",
    ],
    tissueDistractors: [
      ["White adipose tissue", "White adipose is formed by large clear unilocular cells rather than solid parallel collagen bundles."],
      ["Brown adipose tissue", "Brown adipose has small multilocular cells and abundant capillaries rather than sparse nuclei between wavy collagen."],
      ["Skeletal muscle", "Skeletal muscle has thick cellular fibers with cross-striations and peripheral myonuclei."],
    ],
    parts: [
      {
        suffix: "collagen-bundle",
        media: "field-a",
        annotation: { x: 17, y: 24, width: 63, height: 39 },
        prompt: "Which material forms the marked parallel wavy bundles?",
        correct: "Type I collagen",
        accepted: ["collagen", "type 1 collagen", "type I collagen", "collagen bundle"],
        explanation: "The marked eosinophilic parallel bundles are predominantly type I collagen arranged for uniaxial tensile strength.",
        distractors: [
          ["Skeletal muscle fibers", "Muscle fibers are more cellular and show cross-striations rather than collagen crimp."],
          ["Elastic fibers", "Elastic fibers are thinner, branching and darker with elastic stains, not these broad eosinophilic bundles."],
          ["Hyaline cartilage matrix", "Cartilage matrix contains chondrocyte lacunae and does not form parallel wavy bundles."],
        ],
      },
      {
        suffix: "tenocyte-nucleus",
        media: "field-b",
        annotation: { x: 54, y: 42, width: 18, height: 15 },
        prompt: "Which cell structure is enclosed by marker A between collagen bundles?",
        correct: "Tenocyte nucleus",
        accepted: ["tenocyte", "tenocyte nucleus", "fibroblast nucleus"],
        explanation: "The marked thin dark nucleus belongs to a tenocyte aligned between parallel collagen bundles.",
        distractors: [
          ["Peripheral myonucleus", "A myonucleus belongs to a striated muscle fiber, which is absent from this collagenous field."],
          ["Schwann-cell nucleus", "A Schwann-cell nucleus accompanies an axon within nerve tissue, not a collagen row."],
          ["Chondrocyte", "A chondrocyte is round and occupies a lacuna within cartilage matrix."],
        ],
      },
    ],
  },
];

const optionIds = ["A", "B", "C", "D"];
let questionOrdinal = 0;

function buildOptions(correct, distractors) {
  const correctIndex = questionOrdinal % optionIds.length;
  const items = [...distractors];
  items.splice(correctIndex, 0, [correct, ""]);
  const options = items.map(([text], index) => ({ id: optionIds[index], text }));
  const correctOptionId = options[correctIndex].id;
  const distractorExplanations = Object.fromEntries(items.flatMap(([, reason], index) => reason ? [[optionIds[index], reason]] : []));
  questionOrdinal += 1;
  return { options, correctOptionId, distractorExplanations };
}

function mediaFor(specimen, suffix, mediaInput, annotation, source) {
  const inputs = Array.isArray(mediaInput) ? mediaInput : [mediaInput];
  return inputs.map((input, index) => {
    const descriptor = typeof input === "string" ? { variant: input } : input;
    const filename = descriptor.variant.endsWith(".jpg") ? descriptor.variant : `${specimen.slug}-${descriptor.variant}.jpg`;
    const mediaSource = descriptor.source ?? source;
    return {
      id: `hpi15-${specimen.slug}-${suffix}-image${inputs.length > 1 ? `-${index + 1}` : ""}`,
      type: "image",
      path: `${imageRoot}/${filename}`,
      alt: `${descriptor.role ?? specimen.name} microscope field used for ${suffix.replaceAll("-", " ")} practice`,
      caption: annotation ? `Structure identification · marker A` : descriptor.role ?? `Specimen identification · ${specimen.name}`,
      attribution: mediaSource.title,
      ...(annotation ? { annotations: [{
        id: "A",
        label: "A",
        x: annotation.x / 100,
        y: annotation.y / 100,
        width: annotation.width / 100,
        height: annotation.height / 100,
      }] } : {}),
    };
  });
}

function makeQuestion(specimen, item) {
  const optionData = buildOptions(item.correct, item.distractors);
  return {
    schemaVersion: "1.0.0",
    id: `hpi15-${specimen.slug}-${item.suffix}`,
    revision: 1,
    status: "verified",
    kind: "image_single_best_answer",
    subject: "histology",
    topic: specimen.topic,
    subtopic: specimen.subtopic,
    chapter: specimen.chapter,
    difficulty: item.difficulty ?? 2,
    prompt: item.prompt,
    ...optionData,
    acceptedFreeText: item.accepted,
    explanation: item.explanation,
    learningObjective: item.objective,
    source: item.source ?? specimen.source,
    media: mediaFor(specimen, item.suffix, item.media, item.annotation, item.source ?? specimen.source),
    tags: [
      "histo-practical",
      "histo-identification-15",
      "identification-only",
      "written-answer",
      "exam-aug22",
      specimen.slug,
      `priority-${specimen.priorityGroup}`,
      item.annotation ? "structure-identification" : "specimen-identification",
    ],
    examPriority: "core",
    qualityFlags: [
      "source-traceable",
      "image-verified",
      "complete-distractor-reasoning",
      "answer-neutral-image",
      "student-labels-independent",
    ],
  };
}

const questions = specimens.flatMap((specimen) => {
  const overviewSource = specimen.overviewSource ?? specimen.source;
  const overviewMedia = specimen.overviewMedia ?? "overview";
  const secondSource = specimen.secondSource ?? specimen.alternateSource ?? specimen.source;
  const secondMedia = specimen.secondMedia ?? "field-a";
  const identification = [
    {
      suffix: "identify-overview",
      media: [
        { variant: overviewMedia, source: overviewSource, role: "Wide field · orient to the whole-slide architecture" },
        { variant: "field-a", source: specimen.source, role: "Close field · confirm the diagnostic cellular pattern" },
      ],
      source: overviewSource,
      prompt: `Study the wide and close fields together. What tissue or specimen should be written?`,
      correct: specimen.name,
      accepted: specimen.accepted,
      distractors: specimen.tissueDistractors,
      explanation: specimen.cues[0],
      objective: `Identify ${specimen.name} from a low- or medium-power microscope field.`,
    },
    {
      suffix: "identify-second-field",
      media: [
        { variant: secondMedia, source: secondSource, role: "Second field · transfer the low-power pattern" },
        { variant: "field-b", source: specimen.source, role: "Diagnostic close field · verify the decisive feature" },
      ],
      source: secondSource,
      prompt: `Use both magnifications to identify this required slide. Write the tissue, specimen or defining epithelial pattern.`,
      correct: specimen.name,
      accepted: specimen.accepted,
      distractors: specimen.tissueDistractors,
      explanation: specimen.cues[1],
      objective: `Transfer ${specimen.name} recognition to a different field and magnification.`,
      difficulty: 3,
    },
  ];
  return [...identification, ...specimen.parts.map((part) => ({
    ...part,
    accepted: part.accepted,
    objective: `Identify ${part.correct} on a microscope field of ${specimen.name}.`,
  }))].map((item) => makeQuestion(specimen, item));
});

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${questions.map((question) => JSON.stringify(question)).join("\n")}\n`);
console.log(`Wrote ${questions.length} identification-only questions for ${specimens.length} required specimens.`);
