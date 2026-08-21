import type { MCQQuestion } from "@/src/lib/mcq/types";

export type BiochemistryCoverage = "confirmed" | "partial" | "supplement";

export type BiochemistryChapterDefinition = {
  id: string;
  unit: string;
  chapterNumber?: number;
  chapterLabel: string;
  title: string;
  shortTitle: string;
  description: string;
  coverage: BiochemistryCoverage;
};

export const biochemistryChapters: BiochemistryChapterDefinition[] = [
  {
    id: "foundations",
    unit: "Course foundations",
    chapterLabel: "Teacher module",
    title: "Biochemical Foundations",
    shortTitle: "Foundations",
    description: "Biomolecule classes, ATP, metabolism, functional groups, bonds and information flow.",
    coverage: "confirmed",
  },
  {
    id: "water-buffers",
    unit: "Course foundations",
    chapterLabel: "Teacher module",
    title: "Water, Acids, Bases and Buffers",
    shortTitle: "Water & buffers",
    description: "Water chemistry, pH, pKa, Henderson-Hasselbalch, titration and physiological buffers.",
    coverage: "confirmed",
  },
  {
    id: "ch-1", unit: "Unit I · Protein structure and function", chapterNumber: 1, chapterLabel: "Chapter 1", title: "Amino Acids", shortTitle: "Amino acids", description: "Classification, ionization, titration, pI and clinically important amino-acid chemistry.", coverage: "confirmed",
  },
  {
    id: "ch-2", unit: "Unit I · Protein structure and function", chapterNumber: 2, chapterLabel: "Chapter 2", title: "Structure of Proteins", shortTitle: "Protein structure", description: "Peptide bonds, structural levels, folding, stabilization and denaturation.", coverage: "confirmed",
  },
  {
    id: "ch-3", unit: "Unit I · Protein structure and function", chapterNumber: 3, chapterLabel: "Chapter 3", title: "Globular Proteins", shortTitle: "Globular proteins", description: "Heme, myoglobin, hemoglobin, oxygen curves, allostery and hemoglobinopathies.", coverage: "confirmed",
  },
  {
    id: "ch-4", unit: "Unit I · Protein structure and function", chapterNumber: 4, chapterLabel: "Chapter 4", title: "Fibrous Proteins", shortTitle: "Fibrous proteins", description: "Collagen and elastin structure, synthesis, degradation and disease.", coverage: "confirmed",
  },
  {
    id: "ch-5", unit: "Unit I · Protein structure and function", chapterNumber: 5, chapterLabel: "Chapter 5", title: "Enzymes", shortTitle: "Enzymes", description: "Catalysis, Michaelis-Menten kinetics, inhibition and regulation.", coverage: "confirmed",
  },
  {
    id: "ch-6", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 6, chapterLabel: "Chapter 6", title: "Bioenergetics and Oxidative Phosphorylation", shortTitle: "Bioenergetics", description: "Free energy, electron transport, ATP synthesis, inhibitors and uncoupling.", coverage: "supplement",
  },
  {
    id: "ch-7", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 7, chapterLabel: "Chapter 7", title: "Introduction to Carbohydrates", shortTitle: "Carbohydrates", description: "Stereochemistry, monosaccharides, disaccharides and carbohydrate structure.", coverage: "confirmed",
  },
  {
    id: "ch-8", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 8, chapterLabel: "Chapter 8", title: "Metabolism and Glycolysis", shortTitle: "Glycolysis", description: "Metabolic organization, glycolytic reactions, regulation and pyruvate fates.", coverage: "confirmed",
  },
  {
    id: "ch-9", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 9, chapterLabel: "Chapter 9", title: "TCA Cycle and Pyruvate Dehydrogenase", shortTitle: "TCA & PDH", description: "PDH cofactors and regulation, TCA reactions, energy yield and anaplerosis.", coverage: "confirmed",
  },
  {
    id: "ch-10", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 10, chapterLabel: "Chapter 10", title: "Gluconeogenesis", shortTitle: "Gluconeogenesis", description: "Precursors, bypass reactions, energetic cost and reciprocal regulation.", coverage: "confirmed",
  },
  {
    id: "ch-11", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 11, chapterLabel: "Chapter 11", title: "Glycogen Metabolism", shortTitle: "Glycogen", description: "Synthesis, degradation, hormonal control and glycogen-storage diseases.", coverage: "confirmed",
  },
  {
    id: "ch-12", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 12, chapterLabel: "Chapter 12", title: "Monosaccharides and Disaccharides", shortTitle: "Other sugars", description: "Fructose, galactose, lactose, sorbitol and associated disorders.", coverage: "confirmed",
  },
  {
    id: "ch-13", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 13, chapterLabel: "Chapter 13", title: "Pentose Phosphate Pathway and NADPH", shortTitle: "PPP & NADPH", description: "Oxidative and nonoxidative phases, NADPH functions and G6PD deficiency.", coverage: "confirmed",
  },
  {
    id: "ch-14", unit: "Unit II · Bioenergetics and carbohydrate metabolism", chapterNumber: 14, chapterLabel: "Chapter 14", title: "Glycoconjugates", shortTitle: "Glycoconjugates", description: "Glycosaminoglycans, proteoglycans, glycoproteins and lysosomal disease.", coverage: "partial",
  },
  {
    id: "ch-15", unit: "Unit III · Lipid metabolism", chapterNumber: 15, chapterLabel: "Chapter 15", title: "Dietary Lipid Metabolism", shortTitle: "Dietary lipids", description: "Digestion, absorption, chylomicrons, lipoprotein lipase and clinical disorders.", coverage: "confirmed",
  },
  {
    id: "ch-16", unit: "Unit III · Lipid metabolism", chapterNumber: 16, chapterLabel: "Chapter 16", title: "Fatty Acids, Ketone Bodies and TAG", shortTitle: "Fatty acids & ketones", description: "Synthesis, oxidation, ketogenesis, triacylglycerol turnover and regulation.", coverage: "partial",
  },
  {
    id: "ch-17", unit: "Unit III · Lipid metabolism", chapterNumber: 17, chapterLabel: "Chapter 17", title: "Complex Lipids and Eicosanoids", shortTitle: "Complex lipids", description: "Phospholipids, sphingolipids, eicosanoids and their diseases.", coverage: "partial",
  },
  {
    id: "ch-18", unit: "Unit III · Lipid metabolism", chapterNumber: 18, chapterLabel: "Chapter 18", title: "Cholesterol, Lipoproteins and Steroids", shortTitle: "Cholesterol & LP", description: "Cholesterol synthesis, plasma lipoproteins, bile acids and steroids.", coverage: "partial",
  },
  {
    id: "ch-23", unit: "Unit V · Integration of metabolism", chapterNumber: 23, chapterLabel: "Chapter 23", title: "Insulin and Glucagon", shortTitle: "Insulin & glucagon", description: "Hormonal integration of fuel metabolism and glucose homeostasis.", coverage: "supplement",
  },
  {
    id: "ch-24", unit: "Unit V · Integration of metabolism", chapterNumber: 24, chapterLabel: "Chapter 24", title: "Feed-Fast Cycle", shortTitle: "Feed-fast cycle", description: "Organ-specific metabolism in fed, fasting and prolonged-fasting states.", coverage: "supplement",
  },
  {
    id: "ch-25", unit: "Unit V · Integration of metabolism", chapterNumber: 25, chapterLabel: "Chapter 25", title: "Diabetes Mellitus", shortTitle: "Diabetes", description: "Diagnosis, acute and chronic complications, and metabolic consequences.", coverage: "supplement",
  },
  {
    id: "ch-26", unit: "Unit V · Integration of metabolism", chapterNumber: 26, chapterLabel: "Chapter 26", title: "Obesity", shortTitle: "Obesity", description: "Energy balance, adipokines, appetite and metabolic syndrome.", coverage: "supplement",
  },
  {
    id: "ch-27", unit: "Unit V · Integration of metabolism", chapterNumber: 27, chapterLabel: "Chapter 27", title: "Nutrition", shortTitle: "Nutrition", description: "Dietary reference values, macronutrients and malnutrition.", coverage: "supplement",
  },
  {
    id: "ch-28", unit: "Unit V · Integration of metabolism", chapterNumber: 28, chapterLabel: "Chapter 28", title: "Vitamins", shortTitle: "Vitamins", description: "Coenzyme forms, pathways, deficiency, toxicity and clinical associations.", coverage: "confirmed",
  },
  {
    id: "ch-29", unit: "Unit VI · Genetic information", chapterNumber: 29, chapterLabel: "Chapter 29", title: "DNA Structure, Replication and Repair", shortTitle: "DNA", description: "Nucleotides, chromatin, replication, telomeres, mutation and repair.", coverage: "confirmed",
  },
  {
    id: "ch-30", unit: "Unit VI · Genetic information", chapterNumber: 30, chapterLabel: "Chapter 30", title: "RNA, Transcription and Processing", shortTitle: "RNA & transcription", description: "RNA classes, transcription, RNA processing and inhibitors.", coverage: "confirmed",
  },
  {
    id: "ch-31", unit: "Unit VI · Genetic information", chapterNumber: 31, chapterLabel: "Chapter 31", title: "Protein Synthesis", shortTitle: "Translation", description: "Genetic code, tRNA, ribosomes, translation and inhibitors.", coverage: "confirmed",
  },
  {
    id: "ch-32", unit: "Unit VI · Genetic information", chapterNumber: 32, chapterLabel: "Chapter 32", title: "Regulation of Gene Expression", shortTitle: "Gene regulation", description: "Prokaryotic operons and multilevel eukaryotic regulation.", coverage: "confirmed",
  },
  {
    id: "ch-33", unit: "Unit VI · Genetic information", chapterNumber: 33, chapterLabel: "Chapter 33", title: "Biotechnology and Molecular Techniques", shortTitle: "Biotechnology", description: "PCR, cloning, blotting, sequencing and molecular diagnostics.", coverage: "supplement",
  },
  {
    id: "lab-practical",
    unit: "Laboratory practicals",
    chapterLabel: "Practical module",
    title: "Biochemistry Laboratory Practicals",
    shortTitle: "Laboratory practicals",
    description: "Carbohydrate and protein tests, titration, equipment, assays and analytical methods.",
    coverage: "confirmed",
  },
];

const chapterById = new Map(biochemistryChapters.map((chapter) => [chapter.id, chapter]));

export function isBiochemistryChapterId(value: unknown): value is string {
  return typeof value === "string" && chapterById.has(value);
}

export function biochemistryChapterById(id: string | undefined) {
  return id ? chapterById.get(id) : undefined;
}

const topicMap = new Map<string, string>([
  ["biochemical foundations", "foundations"],
  ["metabolism, atp, functional groups, and bonds", "foundations"],
  ["water and body-fluid compartments", "water-buffers"],
  ["ph, acids, bases, ka, and pka", "water-buffers"],
  ["titration, henderson-hasselbalch, and buffer capacity", "water-buffers"],
  ["physiological buffer systems", "water-buffers"],
  ["amino acids", "ch-1"],
  ["protein structure", "ch-2"],
  ["protein denaturation", "ch-2"],
  ["hemoglobin structure and function", "ch-3"],
  ["fibrous proteins", "ch-4"],
  ["enzyme kinetics", "ch-5"],
  ["enzyme inhibition", "ch-5"],
  ["enzyme regulation", "ch-5"],
  ["bioenergetics", "ch-6"],
  ["carbohydrate structure", "ch-7"],
  ["metabolism and glycolysis", "ch-8"],
  ["glycolysis", "ch-8"],
  ["tca cycle and pyruvate dehydrogenase", "ch-9"],
  ["gluconeogenesis", "ch-10"],
  ["glycogen metabolism", "ch-11"],
  ["monosaccharides and disaccharides", "ch-12"],
  ["pentose phosphate pathway and nadph", "ch-13"],
  ["glycoconjugates", "ch-14"],
  ["glycosaminoglycans and proteoglycans", "ch-14"],
  ["dietary lipid metabolism", "ch-15"],
  ["fatty acid and ketone metabolism", "ch-16"],
  ["complex lipid metabolism", "ch-17"],
  ["phospholipids", "ch-17"],
  ["sphingolipids", "ch-17"],
  ["eicosanoids", "ch-17"],
  ["cholesterol and lipoprotein metabolism", "ch-18"],
  ["lipoproteins", "ch-18"],
  ["cholesterol", "ch-18"],
  ["metabolic effects of insulin and glucagon", "ch-23"],
  ["feed-fast cycle", "ch-24"],
  ["diabetes mellitus", "ch-25"],
  ["obesity", "ch-26"],
  ["nutrition", "ch-27"],
  ["water-soluble vitamins", "ch-28"],
  ["fat-soluble vitamins", "ch-28"],
  ["dna structure", "ch-29"],
  ["nucleotides", "ch-29"],
  ["dna conformation", "ch-29"],
  ["dna denaturation", "ch-29"],
  ["chromatin", "ch-29"],
  ["dna replication", "ch-29"],
  ["telomeres", "ch-29"],
  ["dna repair mechanisms", "ch-29"],
  ["rna", "ch-30"],
  ["transcription", "ch-30"],
  ["transcription inhibitors", "ch-30"],
  ["translation", "ch-31"],
  ["translation inhibitors", "ch-31"],
  ["mutations", "ch-31"],
  ["gene regulation", "ch-32"],
  ["lac operon", "ch-32"],
  ["trp operon", "ch-32"],
  ["biotechnology and molecular techniques", "ch-33"],
]);

const structureLipidTopics = new Set(["lipids", "fatty acids", "lipid oxidation", "lipid structure", "lipid classification", "triacylglycerol"]);

export function biochemistryChapterIdForQuestion(question: MCQQuestion): string | undefined {
  if (question.subject !== "biochemistry") return undefined;
  const topic = question.topic.trim().toLowerCase();
  const tags = (question.tags ?? []).map((tag) => tag.toLowerCase());

  if (tags.includes("biochemistry-lab") || topic.startsWith("practical ") || topic === "practical biochemistry" || [
    "spectrophotometry", "dna extraction", "chromatography", "flame photometry", "osmosis practical",
  ].includes(topic)) return "lab-practical";

  for (const tag of tags) {
    const match = tag.match(/^lippincott-(\d+)$/);
    if (match && chapterById.has(`ch-${match[1]}`)) return `ch-${match[1]}`;
  }

  for (const value of [question.chapter, question.source?.chapter]) {
    const match = value?.match(/chapter\s+(\d+)/i);
    if (match && chapterById.has(`ch-${match[1]}`)) return `ch-${match[1]}`;
  }

  if (structureLipidTopics.has(topic)) return "ch-15";
  return topicMap.get(topic);
}
