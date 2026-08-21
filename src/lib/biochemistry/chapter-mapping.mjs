export const biochemistryChapterIds = [
  "foundations", "water-buffers",
  "ch-1", "ch-2", "ch-3", "ch-4", "ch-5", "ch-6", "ch-7", "ch-8", "ch-9", "ch-10", "ch-11", "ch-12", "ch-13", "ch-14",
  "ch-15", "ch-16", "ch-17", "ch-18", "ch-23", "ch-24", "ch-25", "ch-26", "ch-27", "ch-28", "ch-29", "ch-30", "ch-31", "ch-32", "ch-33",
  "lab-practical",
];

const chapterIdSet = new Set(biochemistryChapterIds);
const topicMap = new Map(Object.entries({
  "biochemical foundations": "foundations",
  "metabolism, atp, functional groups, and bonds": "foundations",
  "water and body-fluid compartments": "water-buffers",
  "ph, acids, bases, ka, and pka": "water-buffers",
  "titration, henderson-hasselbalch, and buffer capacity": "water-buffers",
  "physiological buffer systems": "water-buffers",
  "amino acids": "ch-1",
  "protein structure": "ch-2",
  "protein denaturation": "ch-2",
  "hemoglobin structure and function": "ch-3",
  "fibrous proteins": "ch-4",
  "enzyme kinetics": "ch-5",
  "enzyme inhibition": "ch-5",
  "enzyme regulation": "ch-5",
  "bioenergetics": "ch-6",
  "carbohydrate structure": "ch-7",
  "metabolism and glycolysis": "ch-8",
  "glycolysis": "ch-8",
  "tca cycle and pyruvate dehydrogenase": "ch-9",
  "gluconeogenesis": "ch-10",
  "glycogen metabolism": "ch-11",
  "monosaccharides and disaccharides": "ch-12",
  "pentose phosphate pathway and nadph": "ch-13",
  "glycoconjugates": "ch-14",
  "glycosaminoglycans and proteoglycans": "ch-14",
  "dietary lipid metabolism": "ch-15",
  "fatty acid and ketone metabolism": "ch-16",
  "complex lipid metabolism": "ch-17",
  "phospholipids": "ch-17",
  "sphingolipids": "ch-17",
  "eicosanoids": "ch-17",
  "cholesterol and lipoprotein metabolism": "ch-18",
  "lipoproteins": "ch-18",
  "cholesterol": "ch-18",
  "metabolic effects of insulin and glucagon": "ch-23",
  "feed-fast cycle": "ch-24",
  "diabetes mellitus": "ch-25",
  "obesity": "ch-26",
  "nutrition": "ch-27",
  "water-soluble vitamins": "ch-28",
  "fat-soluble vitamins": "ch-28",
  "dna structure": "ch-29",
  "nucleotides": "ch-29",
  "dna conformation": "ch-29",
  "dna denaturation": "ch-29",
  "chromatin": "ch-29",
  "dna replication": "ch-29",
  "telomeres": "ch-29",
  "dna repair mechanisms": "ch-29",
  "rna": "ch-30",
  "transcription": "ch-30",
  "transcription inhibitors": "ch-30",
  "translation": "ch-31",
  "translation inhibitors": "ch-31",
  "mutations": "ch-31",
  "gene regulation": "ch-32",
  "lac operon": "ch-32",
  "trp operon": "ch-32",
  "biotechnology and molecular techniques": "ch-33",
}));

const structuralLipidTopics = new Set(["lipids", "fatty acids", "lipid oxidation", "lipid structure", "lipid classification", "triacylglycerol"]);

export function biochemistryChapterIdForQuestion(question) {
  if (question?.subject !== "biochemistry") return undefined;
  const topic = String(question.topic ?? "").trim().toLowerCase();
  const tags = (question.tags ?? []).map((tag) => String(tag).toLowerCase());
  if (tags.includes("biochemistry-lab") || topic.startsWith("practical ") || topic === "practical biochemistry" || [
    "spectrophotometry", "dna extraction", "chromatography", "flame photometry", "osmosis practical",
  ].includes(topic)) return "lab-practical";
  for (const tag of tags) {
    const match = tag.match(/^lippincott-(\d+)$/);
    if (match && chapterIdSet.has(`ch-${match[1]}`)) return `ch-${match[1]}`;
  }
  for (const value of [question.chapter, question.source?.chapter]) {
    const match = String(value ?? "").match(/chapter\s+(\d+)/i);
    if (match && chapterIdSet.has(`ch-${match[1]}`)) return `ch-${match[1]}`;
  }
  if (structuralLipidTopics.has(topic)) return "ch-15";
  return topicMap.get(topic);
}
