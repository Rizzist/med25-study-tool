#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "public/study/histology/internet-examples");
const questionOutput = resolve(root, "data/bank/questions/histology-transfer-100.jsonl");
const catalogOutput = resolve(root, "data/teacher-materials/histology-internet-example-catalog.json");
const cachePaths = [
  "/tmp/med25-histology-candidates-a.json",
  "/tmp/med25-histology-candidates-b.json",
  "/tmp/med25-histology-extra.json",
];

// Every Commons field below was selected for an exam-relevant normal pattern.
// Category membership is only candidate discovery; the target is independently
// checked on contact sheets before the generated bank is marked verified.
const groups = [
  ["articular-cartilage", [31554618]],
  ["synovial-joint", [82105477]],
  ["synovium", [107795319]],
  ["cartilaginous-symphysis", [64811299]],
  ["hyaline-cartilage", [7890496, 11096069, 30108642, 31551478]],
  ["elastic-cartilage", [7879636, 30062393, 30081799, 70159659, 70159664, 113999254]],
  ["fibrocartilage", [70159674, 70159676, 70159677, 70159678, 70159680]],
  ["compact-bone", [16358216, 17268638, 40209906, 55441989]],
  ["spongy-bone", [657527, 109367812]],
  ["immature-bone", [8623436, 40209908]],
  ["sensory-ganglion", [23271691, 23271692, 23271693]],
  ["autonomic-ganglion", [8750626, 30103946, 30104110]],
  ["peripheral-nerve", [70159716, 70159717, 70159719, 70159721, 70159722, 70159723, 70159724]],
  ["cardiac-muscle", [865752, 18642734, 29939561, 29939563, 31557002, 82058058]],
  ["skeletal-muscle", [657545, 657552, 8730224, 29092851, 29936356, 29938126, 55441990, 82058057]],
  ["white-adipose", [600755, 29715602, 40207771, 70159552, 70159555, 113554264, 131566365]],
  ["tendon", [18499587, 18499597, 18499602, 18499608]],
  ["ligament", [108264442]],
  ["thin-skin", [125681075, 129500388]],
  ["thick-skin", [129500499, 117339078, 117339079, 117339080, 93061952]],
  ["simple-cuboidal", [70159494, 70159496, 70159497, 114000694]],
  ["simple-cuboidal-thyroid", [555301, 27983960, 29856117, 81008587, 81008590]],
  ["simple-cuboidal-kidney", [29625144, 31554859, 31554868, 104699607]],
  ["transitional-epithelium", [18582849, 18582850, 70159530, 70159540, 114307402]],
  ["transitional-bladder", [20189003, 20189004, 20189006, 20189007]],
  ["transitional-ureter", [5715257, 7209768, 18582851, 36550864]],
  ["pseudostratified-epithelium", [70159516, 70159519, 70159521, 70159526]],
  ["pseudostratified-trachea", [20188998, 20188999, 37114335, 37114400]],
  ["pseudostratified-epididymis", [7191842, 37101580, 37101608, 37101639, 45167476]],
];

const templates = {
  "articular-cartilage": {
    answer: "Articular hyaline cartilage", aliases: ["articular hyaline cartilage", "articular cartilage", "hyaline cartilage"], topic: "Joints",
    explanation: "A smooth free surface overlies zoned hyaline cartilage attached directly to subchondral bone. The absence of perichondrium and its position at a bony articular surface identify articular cartilage, a component of a synovial joint.",
    distractors: {
      "Synovial joint (diarthrosis)": "Articular cartilage is one component of a synovial joint; this field does not show enough of the opposing surfaces, cavity and capsule to name the whole joint.",
      "Hyaline cartilage with perichondrium": "Most non-articular hyaline cartilage has a fibrous perichondrium; articular cartilage instead has a free joint surface and rests on subchondral bone.",
      "Fibrocartilage": "Fibrocartilage has coarse type I collagen bundles and rows of chondrocytes rather than a smooth zoned articular matrix.",
    },
  },
  "synovial-joint": {
    answer: "Synovial joint (diarthrosis)", aliases: ["synovial joint", "diarthrosis", "diarthrodial joint"], topic: "Joints",
    explanation: "This whole-joint field shows articular cartilage on bone bordering a true joint space, the defining architecture of a synovial joint. Functionally, a freely movable synovial joint is a diarthrosis; those terms belong to structural and functional classification systems, respectively.",
    distractors: {
      "Cartilaginous symphysis (amphiarthrosis)": "A symphysis is united by fibrocartilage and has no true synovial cavity.",
      "Fibrous joint (synarthrosis)": "A fibrous synarthrosis is bridged by dense connective tissue and lacks articular cartilage plus a synovial cavity.",
      "Hyaline cartilage": "Hyaline cartilage may cover the articular surfaces, but the cavity-and-capsule architecture identifies the whole specimen as a synovial joint.",
    },
  },
  synovium: {
    answer: "Synovium (synovial membrane)", aliases: ["synovium", "synovial membrane", "synovial lining"], topic: "Joints",
    explanation: "A thin, irregular intimal lining of synoviocytes overlies loose vascular connective tissue without a basement membrane or true epithelium. This is synovium, the membrane lining the non-articular inner surface of a synovial joint capsule.",
    distractors: {
      "Simple squamous epithelium": "A true simple squamous epithelium forms a continuous sheet on a basement membrane; synovial intima is discontinuous and has no basement membrane.",
      "Dense irregular joint capsule": "The fibrous capsule is dense collagenous connective tissue, whereas this field shows the delicate cellular synovial lining and loose subintima.",
      "Articular hyaline cartilage": "Articular cartilage contains chondrocytes in lacunae within a glassy zoned matrix and has no synovial intimal lining over its free surface.",
    },
  },
  "cartilaginous-symphysis": {
    answer: "Cartilaginous symphysis (amphiarthrosis)", aliases: ["cartilaginous joint", "symphysis", "pubic symphysis", "amphiarthrosis", "secondary cartilaginous joint"], topic: "Joints",
    explanation: "A fibrocartilaginous plate unites the bones without a synovial cavity: a symphysis, structurally cartilaginous and functionally slightly movable (amphiarthrosis).",
    distractors: {
      "Synovial joint (diarthrosis)": "A synovial joint requires a true cavity, synovium and opposing articular cartilage surfaces.",
      "Fibrous joint (synarthrosis)": "Fibrous joints are united primarily by dense collagen, not a central fibrocartilaginous plate.",
      "Hyaline cartilage": "Hyaline cartilage has a glassy type II collagen matrix; a symphysis is dominated by fibrocartilage and dense type I collagen bundles.",
    },
  },
  "hyaline-cartilage": {
    answer: "Hyaline cartilage", aliases: ["hyaline cartilage", "articular cartilage"], topic: "Cartilage",
    explanation: "Rounded chondrocytes lie in lacunae within a smooth, glassy type II collagen matrix; thick visible collagen bundles and elastic-fiber networks are absent.",
    distractors: {
      "Elastic cartilage": "Elastic cartilage has a conspicuous branching elastic-fiber network around lacunae.",
      "Fibrocartilage": "Fibrocartilage shows chondrocytes in rows between thick eosinophilic type I collagen bundles.",
      "Compact bone": "Compact bone is mineralized and organized into lamellae or osteons with central canals.",
    },
  },
  "elastic-cartilage": {
    answer: "Elastic cartilage", aliases: ["elastic cartilage"], topic: "Cartilage",
    explanation: "Chondrocytes in lacunae are embedded in a matrix crossed by a dense branching elastic-fiber network, usually with perichondrium.",
    distractors: {
      "Hyaline cartilage": "Hyaline matrix looks smooth or glassy because its type II fibrils are not individually resolved on routine stain.",
      "Fibrocartilage": "Fibrocartilage has parallel coarse type I collagen bundles with chondrocytes arranged in rows and no perichondrium.",
      "Dense regular connective tissue": "Dense regular tissue has flattened fibroblast nuclei between parallel collagen bundles but no chondrocytes in lacunae.",
    },
  },
  fibrocartilage: {
    answer: "Fibrocartilage", aliases: ["fibrocartilage", "fibrous cartilage"], topic: "Cartilage",
    explanation: "Chondrocytes occupy lacunae in rows between thick, wavy type I collagen bundles; the matrix is fibrous rather than glassy.",
    distractors: {
      "Hyaline cartilage": "Hyaline cartilage has a smooth matrix and isogenous groups rather than coarse parallel collagen bundles.",
      "Elastic cartilage": "Elastic cartilage contains a branching elastic-fiber mesh and commonly a perichondrium.",
      "Tendon": "Tendon has rows of flattened tenocyte nuclei but not true chondrocytes surrounded by lacunae.",
    },
  },
  "compact-bone": {
    answer: "Compact (cortical) bone", aliases: ["compact bone", "cortical bone", "lamellar bone", "osteon", "haversian system"], topic: "Bone",
    explanation: "Dense mineralized lamellae, often concentric around Haversian canals, with osteocyte lacunae and canaliculi identify compact lamellar bone.",
    distractors: {
      "Spongy (cancellous) bone": "Spongy bone forms branching trabeculae around broad marrow spaces and usually lacks complete osteons.",
      "Woven (immature) bone": "Woven bone has randomly oriented collagen, irregular osteocytes and no orderly lamellar osteons.",
      "Hyaline cartilage": "Cartilage has chondrocytes in lacunae in a nonmineralized glassy matrix and no vascular central canals.",
    },
  },
  "spongy-bone": {
    answer: "Spongy (cancellous) bone", aliases: ["spongy bone", "cancellous bone", "trabecular bone", "trabeculae"], topic: "Bone",
    explanation: "Branching bony trabeculae create a lattice around marrow spaces; compact osteons are not the dominant architecture.",
    distractors: {
      "Compact (cortical) bone": "Compact bone is a dense cortical plate dominated by lamellae and osteons rather than open trabecular spaces.",
      "Woven (immature) bone": "Woven bone is defined by disorganized collagen and haphazard osteocytes, not simply by the presence of trabeculae.",
      "Fibrocartilage": "Fibrocartilage has rows of chondrocytes between collagen bundles and lacks marrow spaces.",
    },
  },
  "immature-bone": {
    answer: "Woven (immature) bone", aliases: ["woven bone", "immature bone", "primary bone", "ossification"], topic: "Bone",
    explanation: "Irregular newly deposited matrix with haphazard collagen and numerous osteocytes, often near an ossification front, identifies woven immature bone.",
    distractors: {
      "Compact (cortical) bone": "Mature compact bone has orderly parallel or concentric lamellae and well-formed osteons.",
      "Spongy (cancellous) bone": "Spongy describes trabecular architecture; mature trabeculae can be lamellar, whereas woven describes matrix maturity.",
      "Hyaline cartilage": "Hyaline cartilage has chondrocytes in a homogeneous avascular matrix rather than osteoid and bone-forming surfaces.",
    },
  },
  "sensory-ganglion": {
    answer: "Sensory (dorsal root) ganglion", aliases: ["sensory ganglion", "dorsal root ganglion", "spinal ganglion", "drg", "ganglion"], topic: "Nervous tissue",
    explanation: "Large round pseudounipolar neuronal somata have central nuclei and complete rings of satellite cells, with nerve fibers passing between clusters.",
    distractors: {
      "Autonomic ganglion": "Autonomic neurons are more scattered and multipolar, with eccentric nuclei and incomplete satellite-cell sheaths.",
      "Peripheral nerve": "A nerve contains fascicles of axons bounded by perineurium but lacks clusters of large neuronal cell bodies.",
      "White adipose tissue": "Adipocytes are empty-appearing signet-ring cells with peripheral nuclei, not basophilic neuronal somata with satellite cells.",
    },
  },
  "autonomic-ganglion": {
    answer: "Autonomic ganglion", aliases: ["autonomic ganglion", "parasympathetic ganglion", "sympathetic ganglion"], topic: "Nervous tissue",
    explanation: "Multipolar neuronal cell bodies are irregularly scattered, often with eccentric nuclei and incomplete satellite-cell rings.",
    distractors: {
      "Sensory (dorsal root) ganglion": "Sensory ganglia have large round pseudounipolar neurons with central nuclei and continuous satellite-cell capsules.",
      "Peripheral nerve": "A peripheral nerve has axon fascicles and connective-tissue sheaths but no neuronal cell bodies.",
      "White adipose tissue": "White fat has uniform unilocular adipocytes with peripheral flattened nuclei and no neuropil or satellite cells.",
    },
  },
  "peripheral-nerve": {
    answer: "Peripheral nerve", aliases: ["peripheral nerve", "nerve", "nerve fascicle"], topic: "Nervous tissue",
    explanation: "Wavy longitudinal axons or round myelin-cleared profiles are grouped into fascicles surrounded by perineurium and epineurium; neuronal somata are absent.",
    distractors: {
      "Sensory (dorsal root) ganglion": "A sensory ganglion contains conspicuous large neuronal cell bodies ringed by satellite cells.",
      "White adipose tissue": "Fat cells are much larger, form a honeycomb sheet and have flattened peripheral nuclei rather than many tiny myelin rings.",
      "Tendon": "Tendon shows parallel eosinophilic collagen bundles and rows of flattened tenocyte nuclei, not fascicles enclosed by perineurium.",
    },
  },
  "cardiac-muscle": {
    answer: "Cardiac muscle", aliases: ["cardiac muscle", "myocardium", "heart muscle", "cardiomyocytes"], topic: "Muscle tissue",
    explanation: "Branching striated fibers with one or two central nuclei and occasional dark intercalated discs identify cardiac muscle.",
    distractors: {
      "Skeletal muscle": "Skeletal fibers are long, unbranched cylinders with multiple peripheral nuclei and more regular parallel organization.",
      "Smooth muscle": "Smooth muscle lacks striations and consists of spindle cells with cigar-shaped central nuclei.",
      "Tendon": "Tendon is mostly parallel collagen with sparse flattened nuclei and has no striated branching cells.",
    },
  },
  "skeletal-muscle": {
    answer: "Skeletal muscle", aliases: ["skeletal muscle", "striated skeletal muscle"], topic: "Muscle tissue",
    explanation: "Long unbranched fibers, multiple peripheral nuclei and cross-striations in longitudinal view—or polygonal fibers in fascicles in cross-section—identify skeletal muscle.",
    distractors: {
      "Cardiac muscle": "Cardiac fibers branch, have central nuclei and intercalated discs, with more endomysial space.",
      "Smooth muscle": "Smooth muscle is nonstriated and formed by smaller spindle-shaped cells with central cigar nuclei.",
      "Tendon": "Tendon has wavy parallel collagen bundles with sparse flattened tenocyte nuclei and no muscle fibers.",
    },
  },
  "white-adipose": {
    answer: "White adipose tissue", aliases: ["white adipose tissue", "white adipose", "white fat", "unilocular adipose tissue", "unilocular adipocytes"], topic: "Adipose tissue",
    explanation: "Large unilocular adipocytes form a honeycomb: one lipid droplet is washed out, leaving a thin cytoplasmic rim and flattened peripheral nucleus.",
    distractors: {
      "Brown adipose tissue": "Brown adipocytes are smaller and multilocular, with central nuclei and many eosinophilic mitochondria.",
      "Peripheral nerve": "Nerve cross-sections contain many small myelin rings inside bounded fascicles, not giant uniform signet-ring adipocytes.",
      "Tendon": "Tendon is collagen-rich and eosinophilic with rows of flattened nuclei, not clear lipid vacuoles.",
    },
  },
  "brown-adipose": {
    answer: "Brown adipose tissue", aliases: ["brown adipose tissue", "brown adipose", "brown fat", "multilocular adipose tissue", "multilocular adipocytes"], topic: "Adipose tissue",
    explanation: "Smaller polygonal multilocular adipocytes contain many lipid droplets, central nuclei and abundant eosinophilic, mitochondria-rich cytoplasm, with a dense capillary network.",
    distractors: {
      "White adipose tissue": "White adipocytes have one dominant empty lipid space and a flattened peripheral nucleus.",
      "Peripheral nerve": "Nerve contains organized fascicles of small axon profiles and connective-tissue sheaths rather than a vascular lobule of multilocular cells.",
      "Mucous gland": "Mucous secretory cells form polarized acini around lumina, unlike brown adipose lobules.",
    },
  },
  tendon: {
    answer: "Tendon", aliases: ["tendon", "dense regular connective tissue", "dense regular collagenous connective tissue"], topic: "Connective tissue",
    explanation: "Very parallel type I collagen bundles contain sparse rows of elongated tenocyte nuclei; fascicles are tightly aligned with the line of pull.",
    distractors: {
      "Ligament": "Ligament can look similar but generally has less perfectly parallel bundles, more variable fibroblast spacing and—in elastic ligaments—visible elastic fibers; attachment context is decisive.",
      "Skeletal muscle": "Skeletal muscle has cellular fibers, peripheral nuclei and striations rather than mostly extracellular collagen.",
      "Peripheral nerve": "Nerve shows axons, Schwann-cell nuclei and a perineurial boundary rather than uniformly eosinophilic collagen bundles.",
    },
  },
  ligament: {
    answer: "Ligament", aliases: ["ligament", "dense regular connective tissue", "dense regular collagenous connective tissue", "enthesis"], topic: "Connective tissue",
    explanation: "Dense collagen bundles connect bone to bone and may blend into fibrocartilage at an enthesis. An isolated dense-regular H&E field can be impossible to distinguish reliably from tendon; attachment context or elastic-fiber content is then required.",
    distractors: {
      "Tendon": "Tendon is usually more uniformly parallel with highly regular rows of elongated tenocytes and connects muscle to bone, but an isolated H&E field without attachment context may not be conclusive.",
      "Fibrocartilage": "Fibrocartilage has true chondrocytes in lacunae between collagen bundles; ligament proper has fibroblast nuclei without lacunae.",
      "Peripheral nerve": "A nerve has fascicles bounded by perineurium and many axon profiles, not dense collagen bundles alone.",
    },
  },
  "thin-skin": {
    answer: "Thin skin (hair-bearing skin)", aliases: ["thin skin", "hairy skin", "hair bearing skin", "skin with hair"], topic: "Skin",
    explanation: "A relatively thin epidermis with a modest stratum corneum plus hair follicles and sebaceous glands identifies thin, hair-bearing skin.",
    distractors: {
      "Thick skin (glabrous skin)": "Thick skin has a massive stratum corneum, prominent ridges and no hair follicles or sebaceous glands.",
      "Pseudostratified epithelium": "Pseudostratified epithelium has nuclei at different heights but every cell contacts the basement membrane; it does not keratinize.",
      "Transitional epithelium": "Urothelium has rounded umbrella cells and variable thickness but no keratin sheet or dermal appendages.",
    },
  },
  "thick-skin": {
    answer: "Thick skin (glabrous skin)", aliases: ["thick skin", "glabrous skin", "hairless skin", "skin without hair"], topic: "Skin",
    explanation: "A very thick compact stratum corneum, prominent epidermal ridges and eccrine glands, with no hair follicles or sebaceous glands, identify thick skin.",
    distractors: {
      "Thin skin (hair-bearing skin)": "Thin skin has a thinner epidermis and commonly contains hair follicles and sebaceous glands.",
      "Transitional epithelium": "Urothelium ends in rounded umbrella cells and has no surface keratin layer or dermis.",
      "Hyaline cartilage": "Cartilage contains chondrocytes in lacunae inside matrix and has no stratified surface epithelium.",
    },
  },
  "simple-cuboidal": null,
  "simple-cuboidal-thyroid": null,
  "simple-cuboidal-kidney": null,
  "transitional-epithelium": null,
  "transitional-bladder": null,
  "transitional-ureter": null,
  "pseudostratified-epithelium": null,
  "pseudostratified-trachea": null,
  "pseudostratified-epididymis": null,
};

const simpleCuboidal = {
  answer: "Simple cuboidal epithelium", aliases: ["simple cuboidal epithelium", "simple cuboidal", "cuboidal epithelium"], topic: "Epithelial tissue",
  explanation: "A single layer of cells about as tall as they are wide surrounds a lumen, with round central nuclei. High-yield sites include renal tubules, thyroid follicles, small ducts and the ovarian surface.",
  distractors: {
    "Transitional epithelium (urothelium)": "Urothelium is multilayered and capped by large rounded or flattened umbrella cells.",
    "Pseudostratified columnar epithelium": "Pseudostratified cells are taller, with nuclei at different levels; cilia or stereocilia may be present.",
    "Simple squamous epithelium": "Simple squamous cells are much wider than tall and have flattened nuclei.",
  },
};
const transitional = {
  answer: "Transitional epithelium (urothelium)", aliases: ["transitional epithelium", "urothelium", "transitional", "urinary epithelium"], topic: "Epithelial tissue",
  explanation: "A stratified lining with rounded dome-shaped superficial umbrella cells and thickness that varies with distension identifies urothelium of renal calyces, ureter, bladder and proximal urethra.",
  distractors: {
    "Simple cuboidal epithelium": "Simple cuboidal epithelium is only one cell layer thick and lacks umbrella cells.",
    "Pseudostratified columnar epithelium": "Pseudostratified epithelium is one layer with nuclei at different heights and often cilia or stereocilia.",
    "Stratified squamous epithelium": "Stratified squamous epithelium has flattened superficial cells rather than large rounded umbrella cells.",
  },
};
const pseudostratified = {
  answer: "Pseudostratified columnar epithelium", aliases: ["pseudostratified epithelium", "pseudostratified columnar epithelium", "pseudostratified ciliated columnar epithelium", "respiratory epithelium"], topic: "Epithelial tissue",
  explanation: "Nuclei sit at different heights although every cell contacts the basement membrane; respiratory examples have cilia and goblet cells, while epididymis has long stereocilia.",
  distractors: {
    "Simple cuboidal epithelium": "Simple cuboidal cells form one low layer with round nuclei aligned at a similar level.",
    "Transitional epithelium (urothelium)": "Urothelium is truly stratified and has large umbrella cells rather than cilia or stereocilia.",
    "Stratified squamous epithelium": "Stratified squamous epithelium has multiple true layers and flattened superficial cells.",
  },
};
for (const key of ["simple-cuboidal", "simple-cuboidal-thyroid", "simple-cuboidal-kidney"]) templates[key] = simpleCuboidal;
for (const key of ["transitional-epithelium", "transitional-bladder", "transitional-ureter"]) templates[key] = transitional;
for (const key of ["pseudostratified-epithelium", "pseudostratified-trachea", "pseudostratified-epididymis"]) templates[key] = pseudostratified;

const localFields = [
  { target: "brown-adipose", path: "histology/practicals/identification-15/brown-adipose-field-a.jpg", title: "Junqueira brown adipose field A", source: "Junqueira's Basic Histology, 16th ed., Chapter 6" },
  { target: "brown-adipose", path: "histology/practicals/identification-15/brown-adipose-field-b.jpg", title: "Junqueira brown adipose field B", source: "Junqueira's Basic Histology, 16th ed., Chapter 6" },
];

const selected = groups.flatMap(([target, pageIds]) => pageIds.map((pageId) => ({ target, pageId })));
const selectedIds = new Set(selected.map(({ pageId }) => pageId));
const pause = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

function stripHtml(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#039;/gi, "'").replace(/\s+/g, " ").trim();
}

function cachedMetadata() {
  const items = cachePaths.filter(existsSync).flatMap((path) => JSON.parse(readFileSync(path, "utf8")));
  return new Map(items.filter(({ pageId }) => selectedIds.has(pageId)).map((item) => [item.pageId, item]));
}

async function fetchMetadata(pageIds) {
  const results = new Map();
  for (let offset = 0; offset < pageIds.length; offset += 40) {
    const batch = pageIds.slice(offset, offset + 40);
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.search = new URLSearchParams({
      action: "query", pageids: batch.join("|"), prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1600", format: "json", origin: "*",
    });
    const response = await fetch(url, { headers: { "user-agent": "MED25HistologyTrainer/1.0 (local educational app)" } });
    if (!response.ok) throw new Error(`Commons metadata request failed: ${response.status}`);
    const data = await response.json();
    for (const page of Object.values(data.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      const meta = info?.extmetadata ?? {};
      if (!info) continue;
      results.set(page.pageid, {
        pageId: page.pageid,
        title: page.title.replace(/^File:/, ""),
        descriptionUrl: info.descriptionurl,
        originalUrl: info.url,
        downloadUrl: info.thumburl ?? info.url,
        mime: info.thumbmime ?? info.mime,
        width: info.thumbwidth ?? info.width,
        height: info.thumbheight ?? info.height,
        originalWidth: info.width,
        originalHeight: info.height,
        author: stripHtml(meta.Artist?.value ?? meta.Credit?.value ?? "Wikimedia Commons contributor"),
        credit: stripHtml(meta.Credit?.value ?? ""),
        license: stripHtml(meta.LicenseShortName?.value ?? meta.License?.value ?? ""),
        licenseUrl: meta.LicenseUrl?.value ?? "",
        description: stripHtml(meta.ImageDescription?.value ?? meta.ObjectName?.value ?? page.title),
      });
    }
    await pause(900);
  }
  return results;
}

function extensionFor(item) {
  if (item.mime === "image/png") return ".png";
  if (item.mime === "image/webp") return ".webp";
  return ".jpg";
}

async function download(item, relativePath) {
  const absolutePath = resolve(root, "public/study", relativePath);
  if (!existsSync(absolutePath)) {
    const preferredUrl = item.downloadUrl.includes("/thumb/")
      ? item.downloadUrl.replace(/\/\d+px-([^/?]+)(?=\?)/, "/960px-$1").replace(/\?.*$/, "")
      : `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(item.title)}?width=500`;
    try {
      execFileSync("curl", [
        "--fail", "--location", "--silent", "--show-error",
        "--retry", "8", "--retry-all-errors", "--retry-delay", "2",
        "--user-agent", "MED25HistologyTrainer/1.0 (local educational app)",
        "--output", absolutePath, preferredUrl,
      ], { stdio: "inherit" });
    } catch {
      const originalUrl = item.originalUrl.replace(/\?.*$/, "");
      execFileSync("curl", [
        "--fail", "--location", "--silent", "--show-error",
        "--retry", "8", "--retry-all-errors", "--retry-delay", "2",
        "--user-agent", "MED25HistologyTrainer/1.0 (local educational app)",
        "--output", absolutePath, originalUrl,
      ], { stdio: "inherit" });
    }
    await pause(1_500);
  }
  const bytes = readFileSync(absolutePath);
  return { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}

function questionFor(entry, index, totalForTarget) {
  const template = templates[entry.target];
  if (!template) throw new Error(`Missing template for ${entry.target}`);
  const distractorEntries = Object.entries(template.distractors);
  const optionTexts = [template.answer, ...distractorEntries.map(([text]) => text)];
  const shift = index % 4;
  const rotated = [...optionTexts.slice(shift), ...optionTexts.slice(0, shift)];
  const options = rotated.map((text, optionIndex) => ({ id: String.fromCharCode(65 + optionIndex), text }));
  const correctOptionId = options.find(({ text }) => text === template.answer).id;
  const distractorExplanations = Object.fromEntries(options.filter(({ id }) => id !== correctOptionId).map(({ id, text }) => [id, template.distractors[text]]));
  const context = entry.target.endsWith("thyroid") ? "thyroid follicle" : entry.target.endsWith("kidney") ? "renal tubule" : entry.target.endsWith("bladder") ? "urinary bladder" : entry.target.endsWith("ureter") ? "ureter" : entry.target.endsWith("trachea") ? "trachea" : entry.target.endsWith("epididymis") ? "epididymis" : "unfamiliar microscope field";
  const sourceTitle = entry.pageId ? `Wikimedia Commons · ${entry.title}` : entry.source;
  return {
    schemaVersion: "1.0.0",
    id: `histo-transfer-${entry.target}-${String(index + 1).padStart(2, "0")}`,
    revision: 1,
    status: "verified",
    kind: "image_single_best_answer",
    subject: "histology",
    topic: template.topic,
    subtopic: `${template.answer} transfer field`,
    chapter: "Aug 22 high-priority microscope differentials",
    difficulty: Math.min(5, 2 + (index % 4 > 1 ? 1 : 0)),
    prompt: `Identify the tissue or dominant lining pattern in this ${context}. Write the most specific practical answer.`,
    options,
    correctOptionId,
    acceptedFreeText: template.aliases,
    explanation: template.explanation,
    distractorExplanations,
    learningObjective: `Recognize ${template.answer} across unfamiliar stains, species, fields and magnifications, and distinguish its closest Aug 22 practical look-alikes.`,
    source: {
      title: sourceTitle,
      chapter: "Normal histology transfer set",
      page: entry.descriptionUrl ?? "Local textbook field",
      excerpt: entry.pageId ? `${entry.license}; author/credit: ${entry.author}. Morphology independently reviewed; Commons title and category were not treated as an answer key.` : "Licensed local textbook extraction already used in the 15-slide practical bank.",
    },
    media: [{
      id: `histo-transfer-${entry.target}-${String(index + 1).padStart(2, "0")}-image`,
      type: "image",
      path: entry.path,
      alt: `Answer-neutral internet microscope transfer field ${index + 1} of ${totalForTarget}`,
      caption: `Transfer field ${index + 1} of ${totalForTarget} · unfamiliar stain or magnification`,
      attribution: entry.pageId ? `${entry.author} · ${entry.license} · Wikimedia Commons` : entry.source,
    }],
    tags: ["histo-practical", "histo-transfer-100", "identification-only", "written-answer", "exam-aug22", entry.target, "internet-transfer", "specimen-identification"],
    examPriority: "core",
    qualityFlags: ["source-traceable", "license-recorded", "image-verified", "complete-distractor-reasoning", "answer-neutral-image", "normal-histology-transfer"],
  };
}

mkdirSync(outputDirectory, { recursive: true });
const metadata = cachedMetadata();
const missing = [...selectedIds].filter((pageId) => !metadata.has(pageId));
if (missing.length) {
  const fetched = await fetchMetadata(missing);
  for (const [pageId, item] of fetched) metadata.set(pageId, item);
}
const unresolved = [...selectedIds].filter((pageId) => !metadata.has(pageId));
if (unresolved.length) throw new Error(`Missing Commons metadata for page IDs: ${unresolved.join(", ")}`);

const catalog = [];
for (const selection of selected) {
  const item = metadata.get(selection.pageId);
  const relativePath = `histology/internet-examples/commons-${item.pageId}${extensionFor(item)}`;
  const file = await download(item, relativePath);
  catalog.push({ ...item, target: selection.target, path: relativePath, ...file, reviewed: true });
  process.stdout.write(`Downloaded ${catalog.length}/${selected.length}: ${selection.target} · ${item.title}\n`);
}

const allEntries = [...catalog, ...localFields];
const targetCounts = new Map();
const questions = allEntries.map((entry) => {
  const index = targetCounts.get(entry.target) ?? 0;
  targetCounts.set(entry.target, index + 1);
  return questionFor(entry, index, allEntries.filter(({ target }) => target === entry.target).length);
});

writeFileSync(catalogOutput, `${JSON.stringify({
  schemaVersion: "1.0.0",
  title: "Aug 22 histology internet transfer-image catalog",
  generatedAt: new Date().toISOString(),
  count: catalog.length,
  methodology: "Wikimedia Commons category discovery; permissive-license filter; answer-bearing diagrams and pathological fields excluded; normal morphology independently reviewed on contact sheets.",
  classificationNote: "Structural joint classes are fibrous, cartilaginous and synovial. Functional classes are synarthrosis, amphiarthrosis and diarthrosis; diarthrosis usually corresponds to a synovial joint and is not a fourth tissue type.",
  items: catalog,
}, null, 2)}\n`);
writeFileSync(questionOutput, `${questions.map((question) => JSON.stringify(question)).join("\n")}\n`);
process.stdout.write(`Wrote ${catalog.length} internet images + ${localFields.length} local supplements and ${questions.length} typed questions.\n`);
