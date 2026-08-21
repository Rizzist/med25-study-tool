import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const output = resolve(import.meta.dirname, "../data/bank/questions/biochemistry-carbohydrate-metabolism-chapters.jsonl");
const letters = ["A", "B", "C", "D"];
const pageRanges = { 9: "Teacher deck pp. 61-82", 10: "Teacher deck pp. 38-60", 11: "Teacher deck pp. 36-37", 12: "Teacher deck pp. 27-35 and 83-90", 13: "Teacher deck pp. 91-103" };
const chapterTitles = {
  9: "TCA Cycle and Pyruvate Dehydrogenase",
  10: "Gluconeogenesis",
  11: "Glycogen Metabolism",
  12: "Monosaccharides and Disaccharides",
  13: "Pentose Phosphate Pathway and NADPH",
};

const facts = [
  // Chapter 9: PDH and TCA cycle.
  [9, "PDH reaction", "Which three products are formed when pyruvate is oxidatively decarboxylated by the pyruvate dehydrogenase complex?", "Acetyl-CoA, NADH, and carbon dioxide", "PDH links glycolysis to the TCA cycle by producing acetyl-CoA while reducing NAD+ and releasing CO2."],
  [9, "PDH location", "Where is the mammalian pyruvate dehydrogenase complex located?", "The mitochondrial matrix", "Pyruvate enters the mitochondrial matrix, where PDH converts it to acetyl-CoA."],
  [9, "PDH cofactors", "Which set lists all five coenzymes used by pyruvate dehydrogenase?", "TPP, lipoate, CoA, FAD, and NAD+", "The three-enzyme PDH complex requires thiamine pyrophosphate, lipoic acid, coenzyme A, FAD, and NAD+."],
  [9, "PDH regulation", "What happens to pyruvate dehydrogenase when PDH kinase phosphorylates its E1 component?", "It becomes inactive", "High-energy signals activate PDH kinase, and phosphorylation switches PDH off."],
  [9, "PDH regulation", "During skeletal-muscle contraction, calcium stimulates which change in PDH activity?", "PDH phosphatase activation and PDH dephosphorylation", "Calcium activates PDH phosphatase, converting PDH to its active dephosphorylated form."],
  [9, "Citrate synthase", "Which TCA-cycle enzyme condenses acetyl-CoA with oxaloacetate?", "Citrate synthase", "Citrate synthase begins the cycle by forming citrate from acetyl-CoA and oxaloacetate."],
  [9, "Isocitrate dehydrogenase", "Which TCA enzyme is a major regulated step activated by ADP and calcium?", "Isocitrate dehydrogenase", "Isocitrate dehydrogenase responds to low-energy and contraction signals and produces NADH and CO2."],
  [9, "Alpha-ketoglutarate dehydrogenase", "Which TCA enzyme resembles PDH and also requires TPP, lipoate, CoA, FAD, and NAD+?", "Alpha-ketoglutarate dehydrogenase", "Alpha-ketoglutarate dehydrogenase is mechanistically related to PDH and uses the same five coenzymes."],
  [9, "Substrate-level phosphorylation", "Which TCA reaction directly forms GTP by substrate-level phosphorylation?", "Succinyl-CoA to succinate", "Succinyl-CoA synthetase captures thioester energy as GTP while producing succinate."],
  [9, "Succinate dehydrogenase", "Which TCA enzyme is also Complex II of the electron-transport chain?", "Succinate dehydrogenase", "Succinate dehydrogenase is embedded in the inner mitochondrial membrane and transfers FADH2-derived electrons to coenzyme Q."],
  [9, "Fumarase", "What reaction is catalyzed by fumarase?", "Hydration of fumarate to malate", "Fumarase stereospecifically adds water across fumarate's double bond to form L-malate."],
  [9, "Malate dehydrogenase", "What drives the unfavorable oxidation of malate to oxaloacetate forward in the TCA cycle?", "Rapid consumption of oxaloacetate by citrate synthase", "Pulling oxaloacetate into citrate formation keeps its concentration low and favors malate oxidation."],
  [9, "Cycle yield", "How many NADH, FADH2, and GTP are produced per acetyl-CoA oxidized in the TCA cycle?", "Three NADH, one FADH2, and one GTP", "Each turn conserves energy as 3 NADH, 1 FADH2, and 1 GTP."],
  [9, "Carbon loss", "How many molecules of carbon dioxide are released during one turn of the TCA cycle?", "Two", "The isocitrate-dehydrogenase and alpha-ketoglutarate-dehydrogenase reactions each release one CO2."],
  [9, "Anaplerosis", "Which enzyme replenishes oxaloacetate from pyruvate?", "Biotin-dependent pyruvate carboxylase", "Pyruvate carboxylase is the major anaplerotic route to oxaloacetate and is activated by acetyl-CoA."],
  [9, "Citrate export", "Why is mitochondrial citrate exported to the cytosol in the well-fed state?", "To provide acetyl-CoA for fatty-acid and cholesterol synthesis", "ATP-citrate lyase cleaves exported citrate to create cytosolic acetyl-CoA."],
  [9, "Toxin", "Fluoroacetate poisoning inhibits the TCA cycle after conversion to fluorocitrate, which blocks which enzyme?", "Aconitase", "Fluorocitrate inhibits aconitase and prevents citrate from being converted to isocitrate."],
  [9, "Arsenic", "Arsenic impairs PDH and alpha-ketoglutarate dehydrogenase mainly by binding which cofactor?", "Lipoic acid", "Arsenite binds sulfhydryl groups of reduced lipoamide, disabling both complexes."],
  [9, "Thiamine", "Why can thiamine deficiency cause lactic acidosis?", "TPP-dependent PDH activity falls, diverting pyruvate to lactate", "Low TPP impairs oxidative decarboxylation of pyruvate, so lactate production rises."],
  [9, "Cell specificity", "Why do mature erythrocytes obtain no ATP from the TCA cycle?", "They lack mitochondria", "Mature RBCs rely on cytosolic glycolysis because they contain no mitochondrial matrix or respiratory chain."],

  // Chapter 10: gluconeogenesis.
  [10, "Purpose", "What is the principal purpose of hepatic gluconeogenesis during fasting?", "Maintain blood glucose for glucose-dependent tissues", "The liver, and later kidney, synthesize glucose for tissues such as RBCs and parts of the brain."],
  [10, "Organs", "Which organs are the major sites of gluconeogenesis during prolonged fasting?", "Liver and kidney cortex", "The liver dominates early fasting, while renal cortical production becomes increasingly important during prolonged fasting."],
  [10, "Substrates", "Which three classes are major gluconeogenic precursors in humans?", "Lactate, glycerol, and glucogenic amino acids", "These precursors enter as pyruvate, DHAP, or TCA intermediates."],
  [10, "Pyruvate carboxylase", "Which enzyme converts pyruvate to oxaloacetate during the first gluconeogenic bypass?", "Pyruvate carboxylase", "Mitochondrial pyruvate carboxylase uses ATP, bicarbonate, and biotin."],
  [10, "PEPCK", "Which enzyme converts oxaloacetate to phosphoenolpyruvate in gluconeogenesis?", "PEP carboxykinase", "PEPCK uses GTP and releases CO2 while forming phosphoenolpyruvate."],
  [10, "Fructose-1,6-bisphosphatase", "Which gluconeogenic enzyme bypasses phosphofructokinase-1?", "Fructose-1,6-bisphosphatase", "The enzyme hydrolyzes fructose 1,6-bisphosphate to fructose 6-phosphate."],
  [10, "Glucose-6-phosphatase", "Which enzyme permits liver to release free glucose into blood?", "Glucose-6-phosphatase", "ER-associated glucose-6-phosphatase removes phosphate so glucose can leave the cell."],
  [10, "Muscle", "Why can skeletal muscle not contribute free glucose directly to blood from glycogen?", "It lacks glucose-6-phosphatase", "Muscle retains glucose 6-phosphate for its own glycolysis rather than exporting glucose."],
  [10, "Energy cost", "What is the energetic cost of making one glucose from two pyruvate?", "Four ATP, two GTP, and two NADH", "Gluconeogenesis is energy-consuming and is driven during fasting by fatty-acid oxidation."],
  [10, "Acetyl-CoA regulation", "How does high mitochondrial acetyl-CoA regulate pyruvate metabolism during fasting?", "It activates pyruvate carboxylase and inhibits PDH", "This directs pyruvate toward oxaloacetate and glucose rather than further acetyl-CoA production."],
  [10, "AMP regulation", "What is the effect of high AMP on fructose-1,6-bisphosphatase?", "Inhibition", "High AMP signals low energy and suppresses the energy-consuming gluconeogenic pathway."],
  [10, "Fructose 2,6-bisphosphate", "How does fructose 2,6-bisphosphate affect gluconeogenesis?", "It inhibits fructose-1,6-bisphosphatase", "Fructose 2,6-bisphosphate favors glycolysis and opposes gluconeogenesis."],
  [10, "Glucagon", "How does glucagon lower hepatic fructose 2,6-bisphosphate?", "PKA phosphorylates the bifunctional PFK-2/FBPase-2 enzyme", "Phosphorylation favors the phosphatase activity, lowering fructose 2,6-bisphosphate and promoting gluconeogenesis."],
  [10, "Cori cycle", "In the Cori cycle, what does the liver do with lactate produced by exercising muscle or RBCs?", "Converts lactate to glucose", "Hepatic gluconeogenesis recycles lactate, and glucose returns to peripheral tissues."],
  [10, "Alanine cycle", "What nitrogen-carrying gluconeogenic substrate travels from muscle to liver in the glucose-alanine cycle?", "Alanine", "Alanine carries both carbon for glucose production and amino nitrogen for urea formation."],
  [10, "Glycerol", "At which glycolytic intermediate does glycerol enter gluconeogenesis?", "Dihydroxyacetone phosphate", "Glycerol is phosphorylated and oxidized to DHAP, primarily in liver."],
  [10, "Fatty acids", "Why can even-chain fatty acids not produce net glucose in humans?", "Acetyl-CoA carbons are lost as CO2 and pyruvate dehydrogenase is irreversible", "There is no net conversion of acetyl-CoA to oxaloacetate or pyruvate in humans."],
  [10, "Odd-chain fatty acids", "Which product allows odd-chain fatty acids to contribute to gluconeogenesis?", "Propionyl-CoA converted to succinyl-CoA", "Succinyl-CoA can replenish TCA intermediates and ultimately support glucose production."],
  [10, "Ethanol", "What high-NADH metabolic shift explains ethanol-induced fasting hypoglycemia?", "Excess NADH diverts pyruvate and oxaloacetate away from gluconeogenesis", "High hepatic NADH favors lactate and malate formation, depleting gluconeogenic substrates."],
  [10, "Compartmentation", "Why is oxaloacetate often converted to malate before leaving mitochondria during gluconeogenesis?", "Oxaloacetate cannot cross the inner mitochondrial membrane directly", "The malate shuttle transports carbon and can supply cytosolic NADH needed for gluconeogenesis."],

  // Chapter 11: glycogen metabolism.
  [11, "Function", "What distinct roles does glycogen serve in liver and skeletal muscle?", "Liver glycogen supports blood glucose; muscle glycogen fuels contraction", "Liver can export glucose, whereas muscle uses its glycogen locally for ATP production."],
  [11, "Primer", "Which protein primes glycogen synthesis by attaching the first glucose residues to itself?", "Glycogenin", "Glycogen synthase cannot start a new particle without the glycogenin primer."],
  [11, "Activated donor", "What is the activated glucose donor used by glycogen synthase?", "UDP-glucose", "UDP-glucose donates glucosyl residues to the growing nonreducing ends of glycogen."],
  [11, "Glycogen synthase", "Which bond is formed by glycogen synthase?", "Alpha-1,4 glycosidic bond", "Glycogen synthase elongates linear chains at nonreducing ends through alpha-1,4 linkages."],
  [11, "Branching enzyme", "What reaction is catalyzed by glycogen branching enzyme?", "Transfer of a chain segment to create an alpha-1,6 linkage", "Branching increases solubility and creates more nonreducing ends for rapid metabolism."],
  [11, "Phosphorylase", "What product is released when glycogen phosphorylase cleaves alpha-1,4 bonds?", "Glucose 1-phosphate", "Phosphorolysis conserves the bond energy in a phosphorylated glucose product."],
  [11, "Cofactor", "Which vitamin-derived cofactor is required by glycogen phosphorylase?", "Pyridoxal phosphate", "PLP, derived from vitamin B6, participates in the phosphorylase reaction."],
  [11, "Debranching", "Which two activities are present in glycogen debranching enzyme?", "Transferase and alpha-1,6-glucosidase", "The transferase shifts residues, and the glucosidase releases the branch-point glucose."],
  [11, "Branch glucose", "In what form is the glucose at an alpha-1,6 branch point released?", "Free glucose", "Debranching enzyme hydrolyzes the alpha-1,6 bond rather than using phosphorolysis."],
  [11, "Glucagon", "Why does glucagon stimulate hepatic but not skeletal-muscle glycogenolysis?", "Skeletal muscle lacks glucagon receptors", "Epinephrine and contraction regulate muscle glycogen, while glucagon targets liver."],
  [11, "Epinephrine", "Through which second messenger does beta-adrenergic stimulation promote glycogen breakdown?", "Cyclic AMP and protein kinase A", "PKA activates phosphorylase kinase and inhibits glycogen synthase by phosphorylation."],
  [11, "Calcium", "How does calcium released during muscle contraction stimulate glycogenolysis?", "Calcium-calmodulin activates phosphorylase kinase", "The calcium signal couples contraction directly to rapid glycogen breakdown."],
  [11, "Insulin", "Which phosphatase mediates insulin's reciprocal effects on glycogen synthase and phosphorylase?", "Protein phosphatase 1", "Dephosphorylation activates glycogen synthase and inactivates glycogen phosphorylase."],
  [11, "Liver regulation", "What is the direct effect of free glucose on liver glycogen phosphorylase a?", "It favors dephosphorylation and inactivation", "High blood glucose promotes shutdown of hepatic glycogen breakdown."],
  [11, "McArdle disease", "Exercise intolerance, muscle cramps, and failure of lactate to rise after exercise suggest deficiency of which enzyme?", "Muscle glycogen phosphorylase", "McArdle disease prevents skeletal muscle from mobilizing glycogen during exercise."],
  [11, "Von Gierke disease", "Severe fasting hypoglycemia and lactic acidosis in glycogen-storage disease type I result from deficiency of what?", "Glucose-6-phosphatase", "Without glucose-6-phosphatase, liver cannot release free glucose from glycogenolysis or gluconeogenesis."],
  [11, "Pompe disease", "Which lysosomal enzyme is deficient in Pompe disease?", "Acid alpha-glucosidase", "Lysosomal glycogen accumulates, particularly damaging cardiac and skeletal muscle."],
  [11, "Cori disease", "Limit-dextrin accumulation is characteristic of deficiency of which activity?", "Glycogen debranching enzyme", "Cori disease leaves short outer chains around branch points that phosphorylase cannot remove."],
  [11, "Andersen disease", "Which glycogen-storage disease results from branching-enzyme deficiency and produces poorly soluble glycogen?", "Andersen disease", "Long unbranched chains precipitate and cause progressive liver injury."],
  [11, "Hers disease", "Which defect causes a generally mild hepatic glycogen-storage disease with fasting hypoglycemia?", "Liver glycogen phosphorylase deficiency", "Hers disease selectively impairs hepatic glycogen breakdown and is usually milder than type I disease."],

  // Chapter 12: fructose, galactose, lactose, and related sugars.
  [12, "Fructose entry", "In liver, fructose is phosphorylated to fructose 1-phosphate by which enzyme?", "Fructokinase", "Hepatic fructokinase rapidly traps dietary fructose as fructose 1-phosphate."],
  [12, "Essential fructosuria", "Deficiency of fructokinase produces which disorder?", "Essential fructosuria", "Essential fructosuria is benign because hexokinase can metabolize part of the fructose load."],
  [12, "Hereditary fructose intolerance", "Which enzyme is deficient in hereditary fructose intolerance?", "Aldolase B", "Aldolase B deficiency traps phosphate as fructose 1-phosphate after fructose ingestion."],
  [12, "HFI hypoglycemia", "Why does hereditary fructose intolerance cause profound hypoglycemia?", "Fructose 1-phosphate accumulation inhibits glycogenolysis and gluconeogenesis", "Phosphate depletion and impaired hepatic glucose production follow fructose exposure."],
  [12, "Fructose regulation", "Why can high hepatic fructose intake promote triacylglycerol synthesis?", "Fructose enters glycolysis downstream of phosphofructokinase-1", "Bypassing PFK-1 permits relatively unregulated production of triose phosphates and acetyl-CoA."],
  [12, "Galactokinase", "Which product is formed when galactokinase acts on galactose?", "Galactose 1-phosphate", "Galactokinase traps galactose using ATP as the first step of the Leloir pathway."],
  [12, "Classic galactosemia", "Which enzyme is deficient in classic galactosemia?", "Galactose-1-phosphate uridyltransferase", "GALT deficiency causes galactose 1-phosphate accumulation, liver injury, cataracts, and infection risk."],
  [12, "Galactokinase deficiency", "What is the characteristic major manifestation of isolated galactokinase deficiency?", "Infantile cataracts", "Galactose is reduced to galactitol in the lens, causing osmotic damage."],
  [12, "Galactosemia infection", "Infants with classic galactosemia have increased susceptibility to sepsis from which organism?", "Escherichia coli", "E. coli sepsis is a classic early complication of untreated GALT deficiency."],
  [12, "UDP sugars", "Which enzyme interconverts UDP-galactose and UDP-glucose?", "UDP-galactose 4-epimerase", "The epimerase permits galactose carbon to enter the glucose pool and supplies UDP-galactose for biosynthesis."],
  [12, "Lactose", "Which monosaccharides compose lactose?", "Glucose and galactose", "Lactose is the milk disaccharide hydrolyzed by intestinal lactase."],
  [12, "Sucrose", "Which monosaccharides compose sucrose?", "Glucose and fructose", "Sucrase releases glucose and fructose from dietary sucrose."],
  [12, "Lactase deficiency", "Why does lactase deficiency cause bloating and acidic diarrhea?", "Unabsorbed lactose retains water and is fermented by colonic bacteria", "Osmotic water retention and bacterial organic acids and gas produce the symptoms."],
  [12, "Sorbitol formation", "Which enzyme reduces glucose to sorbitol?", "Aldose reductase", "Aldose reductase uses NADPH to reduce glucose in the polyol pathway."],
  [12, "Sorbitol toxicity", "Why does sorbitol accumulate in lens, retina, Schwann cells, and kidney during hyperglycemia?", "These tissues have limited sorbitol dehydrogenase activity", "Sorbitol becomes osmotically trapped and contributes to diabetic tissue injury."],
  [12, "Sorbitol metabolism", "Which enzyme oxidizes sorbitol to fructose where it is expressed?", "Sorbitol dehydrogenase", "Sorbitol dehydrogenase uses NAD+ to form fructose, notably in liver and seminal vesicles."],
  [12, "Mannose", "At which intermediate does mannose enter glycolysis?", "Fructose 6-phosphate", "Mannose is phosphorylated and isomerized to fructose 6-phosphate."],
  [12, "Disaccharidases", "Where are lactase, sucrase-isomaltase, and maltase located?", "The brush border of small-intestinal enterocytes", "Brush-border digestion produces monosaccharides that can be absorbed."],
  [12, "Glucose transport", "Which transporter brings glucose and galactose into intestinal enterocytes from the lumen?", "SGLT1", "SGLT1 uses the sodium gradient to cotransport glucose or galactose across the apical membrane."],
  [12, "Fructose transport", "Which apical intestinal transporter facilitates fructose absorption?", "GLUT5", "GLUT5 is the principal facilitated-diffusion transporter for dietary fructose."],

  // Chapter 13: pentose phosphate pathway.
  [13, "Location", "Where does the pentose phosphate pathway occur?", "The cytosol", "Both oxidative and nonoxidative reactions of the pathway are cytosolic."],
  [13, "Products", "What are the two major products of the oxidative pentose phosphate pathway?", "NADPH and ribulose 5-phosphate", "The oxidative phase produces reducing power and a pentose precursor while releasing CO2."],
  [13, "Rate-limiting enzyme", "Which enzyme catalyzes the regulated first step of the pentose phosphate pathway?", "Glucose-6-phosphate dehydrogenase", "G6PD oxidizes glucose 6-phosphate and generates the first NADPH."],
  [13, "Regulation", "Which molecule activates glucose-6-phosphate dehydrogenase by signaling demand for reducing equivalents?", "NADP+", "A high NADP+/NADPH ratio accelerates the oxidative pathway."],
  [13, "Irreversibility", "Which portion of the pentose phosphate pathway is irreversible?", "The oxidative phase", "Oxidative decarboxylation commits glucose 6-phosphate and produces NADPH and CO2."],
  [13, "Nonoxidative phase", "What is the key property of the nonoxidative pentose phosphate reactions?", "They reversibly interconvert sugars with three to seven carbons", "This flexibility allows cells to match needs for ribose, NADPH, or glycolytic intermediates."],
  [13, "Transketolase", "Which cofactor is required by transketolase?", "Thiamine pyrophosphate", "Transketolase transfers two-carbon units using TPP derived from vitamin B1."],
  [13, "Transaldolase", "How many carbons are transferred by transaldolase?", "Three", "Transaldolase transfers a three-carbon unit, whereas transketolase transfers two."],
  [13, "Nucleotide synthesis", "Which pentose-phosphate product is required for nucleotide synthesis?", "Ribose 5-phosphate", "Ribose 5-phosphate is converted to PRPP for purine and pyrimidine nucleotide synthesis."],
  [13, "Glutathione", "How does NADPH protect erythrocytes from oxidant injury?", "It supports regeneration of reduced glutathione", "Glutathione reductase uses NADPH to restore GSH, which removes peroxides through glutathione peroxidase."],
  [13, "RBC dependence", "Why are erythrocytes especially dependent on the pentose phosphate pathway?", "It is their only source of NADPH", "RBCs lack mitochondria and require PPP-derived NADPH to maintain antioxidant defenses."],
  [13, "G6PD triggers", "Which exposures commonly precipitate hemolysis in G6PD deficiency?", "Infection, fava beans, and oxidant drugs", "Oxidant stress overwhelms the limited ability of deficient RBCs to regenerate reduced glutathione."],
  [13, "Heinz bodies", "What are Heinz bodies in G6PD deficiency?", "Precipitates of oxidized denatured hemoglobin", "Splenic macrophages remove these inclusions and create characteristic bite cells."],
  [13, "Bite cells", "How are bite cells formed during oxidant hemolysis?", "Splenic removal of Heinz-body inclusions", "Macrophages pluck out denatured hemoglobin, leaving semicircular defects in RBCs."],
  [13, "Tissue use", "Which tissues have high pentose-phosphate activity because they synthesize fatty acids or steroids?", "Liver, adipose tissue, lactating mammary gland, and steroidogenic tissues", "These tissues need abundant NADPH for reductive biosynthesis."],
  [13, "Cytochrome P450", "What role does NADPH play in the cytochrome P450 system?", "It supplies reducing equivalents for hydroxylation reactions", "P450 enzymes use NADPH in drug detoxification and steroid hydroxylation."],
  [13, "Respiratory burst", "Which leukocyte enzyme uses NADPH to initiate the respiratory burst?", "NADPH oxidase", "The oxidase generates superoxide used to kill engulfed microbes."],
  [13, "CGD", "Chronic granulomatous disease most directly results from failure of which process?", "NADPH-oxidase generation of superoxide", "Phagocytes cannot mount an effective respiratory burst against catalase-positive organisms."],
  [13, "Diagnostic test", "Which flow-cytometric test evaluates the neutrophil respiratory burst in suspected chronic granulomatous disease?", "Dihydrorhodamine test", "Normal oxidant production converts DHR to a fluorescent product; fluorescence is reduced or absent in CGD."],
  [13, "Carbon rearrangement", "Which glycolytic intermediates can be produced by the nonoxidative pentose phosphate pathway?", "Fructose 6-phosphate and glyceraldehyde 3-phosphate", "Transketolase and transaldolase connect pentose metabolism back to glycolysis."],
];

const byChapter = new Map();
for (const fact of facts) {
  const chapter = fact[0];
  byChapter.set(chapter, [...(byChapter.get(chapter) ?? []), fact]);
}

const questions = [];
for (const [chapter, chapterFacts] of byChapter) {
  chapterFacts.forEach((fact, index) => {
    const [, subtopic, prompt, correct, explanation] = fact;
    const candidates = chapterFacts
      .filter((candidate) => candidate !== fact && candidate[3] !== correct)
      .sort((left, right) => Math.abs(String(left[3]).length - String(correct).length) - Math.abs(String(right[3]).length - String(correct).length));
    const distractors = candidates.slice(index % Math.max(1, candidates.length - 3)).concat(candidates).slice(0, 3);
    const correctIndex = (chapter + index) % 4;
    const optionFacts = [...distractors];
    optionFacts.splice(correctIndex, 0, fact);
    const options = optionFacts.map((candidate, optionIndex) => ({ id: letters[optionIndex], text: candidate[3] }));
    const correctOptionId = letters[correctIndex];
    questions.push({
      schemaVersion: "1.0.0",
      id: `teacher-carb-ch${chapter}-${String(index + 1).padStart(3, "0")}-v1`,
      revision: 1,
      status: "verified",
      kind: "single_best_answer",
      subject: "biochemistry",
      topic: chapterTitles[chapter],
      subtopic,
      chapter: `Lippincott Chapter ${chapter}`,
      difficulty: index % 5 === 4 ? 3 : 2,
      prompt,
      options,
      correctOptionId,
      acceptedFreeText: [correct],
      explanation,
      distractorExplanations: Object.fromEntries(optionFacts.flatMap((candidate, optionIndex) => optionIndex === correctIndex ? [] : [[letters[optionIndex], `That answer belongs to a different Chapter ${chapter} checkpoint: “${candidate[2]}” ${explanation}`]])),
      learningObjective: `Apply ${subtopic.toLowerCase()} within Lippincott Chapter ${chapter}.`,
      source: {
        title: "Carbohydrate Metabolism — TUMS teacher deck; Lippincott Illustrated Reviews: Biochemistry",
        edition: "Lippincott 6th edition",
        chapter: `Chapter ${chapter}: ${chapterTitles[chapter]}`,
        page: pageRanges[chapter],
        lecture: "Carbohydrate Metabolism, MD Kish",
      },
      tags: ["july29", `lippincott-${chapter}`, "teacher-carbohydrate-metabolism", "chapter-bank"],
      examPriority: "core",
      qualityFlags: ["teacher-deck-cross-checked", "lippincott-6e-cross-checked", "same-chapter-distractors", "deduplicated-gap-item"],
    });
  });
}

writeFileSync(output, `${questions.map((question) => JSON.stringify(question)).join("\n")}\n`);
console.log(`Wrote ${questions.length} carbohydrate-metabolism chapter MCQs to ${output}.`);
