import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const output = resolve(import.meta.dirname, "../data/bank/questions/july29-comprehensive-gaps.jsonl");
const items = [];
const optionIds = ["A", "B", "C", "D"];
const pages = {
  1: "PDF pp. 10-29",
  2: "PDF pp. 30-54",
  4: "PDF pp. 87-104",
  6: "PDF pp. 135-160",
  14: "PDF pp. 298-325",
  15: "PDF pp. 326-339",
  16: "PDF pp. 340-373",
  17: "PDF pp. 374-405",
  18: "PDF pp. 406-447",
  23: "PDF pp. 560-583",
  24: "PDF pp. 584-613",
  25: "PDF pp. 614-632",
  26: "PDF pp. 633-650",
  27: "PDF pp. 651-680",
  33: "PDF pp. 838-877",
};

function add(chapter, topic, subtopic, difficulty, prompt, correct, distractors, explanation, objective, tags = [], priority = "high") {
  const number = items.length + 1;
  const raw = [correct, ...distractors];
  if (raw.length !== 4 || new Set(raw).size !== 4) throw new Error(`Question ${number} needs four unique options`);
  const offset = (number - 1) % 4;
  const ordered = [...raw.slice(offset), ...raw.slice(0, offset)];
  const options = ordered.map((text, index) => ({ id: optionIds[index], text }));
  const correctOptionId = options.find((option) => option.text === correct).id;
  const distractorExplanations = Object.fromEntries(options
    .filter((option) => option.id !== correctOptionId)
    .map((option) => [option.id, `${option.text} is not correct here. ${explanation}`]));
  items.push({
    schemaVersion: "1.0.0",
    id: `july29-comprehensive-${String(number).padStart(3, "0")}-v1`,
    revision: 1,
    status: "verified",
    kind: "single_best_answer",
    subject: "biochemistry",
    topic,
    subtopic,
    chapter: `Lippincott Chapter ${chapter}`,
    difficulty,
    prompt,
    options,
    correctOptionId,
    acceptedFreeText: [correctOptionId, correct],
    explanation,
    distractorExplanations,
    learningObjective: objective,
    source: {
      title: "Lippincott Illustrated Reviews: Biochemistry",
      edition: "6th edition",
      chapter: `Chapter ${chapter}`,
      page: pages[chapter],
      lecture: "Confirmed August 25 Cell & Molecules scope",
    },
    tags: [...new Set(["july29", `lippincott-${chapter}`, ...tags])],
    examPriority: priority,
    qualityFlags: ["lippincott-6e-cross-checked", "confirmed-exam-scope", "deduplicated-gap-item"],
  });
}

function addLab(topic, subtopic, difficulty, prompt, correct, distractors, explanation, objective, tags = []) {
  const number = items.length + 1;
  const raw = [correct, ...distractors];
  const offset = (number - 1) % 4;
  const ordered = [...raw.slice(offset), ...raw.slice(0, offset)];
  const options = ordered.map((text, index) => ({ id: optionIds[index], text }));
  const correctOptionId = options.find((option) => option.text === correct).id;
  items.push({
    schemaVersion: "1.0.0",
    id: `july29-comprehensive-${String(number).padStart(3, "0")}-v1`,
    revision: 1,
    status: "verified",
    kind: "single_best_answer",
    subject: "biochemistry",
    topic,
    subtopic,
    chapter: "Cell & Molecules practical curriculum",
    difficulty,
    prompt,
    options,
    correctOptionId,
    acceptedFreeText: [correctOptionId, correct],
    explanation,
    distractorExplanations: Object.fromEntries(options
      .filter((option) => option.id !== correctOptionId)
      .map((option) => [option.id, `${option.text} is not correct here. ${explanation}`])),
    learningObjective: objective,
    source: {
      title: "Confirmed TUMS Cell & Molecules practical curriculum",
      chapter: topic,
      lecture: "August 25 practical-derived theory",
    },
    tags: [...new Set(["july29", "biochemistry-lab", ...tags])],
    examPriority: "core",
    qualityFlags: ["confirmed-curriculum", "standard-laboratory-principle-cross-checked", "deduplicated-gap-item"],
  });
}

// Chapter 1-2 reinforcement: charge logic and protein architecture.
add(1, "amino acids", "Isoelectric point", 3,
  "At which pH is an amino acid least mobile in an electric field and often least soluble?",
  "At its isoelectric point", ["At pH 1 for every amino acid", "At the pKa of water only", "Whenever its amino group is fully protonated"],
  "At the isoelectric point the molecule has zero net charge, so electrophoretic mobility is minimal and electrostatic repulsion between molecules is reduced.",
  "Relate isoelectric point to net charge, mobility, and solubility.", ["charge", "pI"]);
add(1, "amino acids", "Charge below pI", 3,
  "An amino acid is placed in a solution whose pH is below its pI. What is its predominant net charge?",
  "Positive", ["Negative", "Always exactly zero", "It has no ionizable groups"],
  "Below the pI, greater protonation gives the amino acid a net positive charge.",
  "Predict amino-acid charge from pH relative to pI.", ["charge", "pI"]);
add(1, "amino acids", "Charge above pI", 3,
  "An amino acid is placed in a solution whose pH is above its pI. What is its predominant net charge?",
  "Negative", ["Positive", "Always exactly zero", "The charge becomes unrelated to pH"],
  "Above the pI, deprotonation gives the amino acid a net negative charge.",
  "Predict amino-acid charge above the isoelectric point.", ["charge", "pI"]);
add(1, "amino acids", "Buffering region", 4,
  "Where on an amino-acid titration curve is buffering capacity greatest?",
  "Near the pKa of an ionizable group", ["Only at the isoelectric point", "At every pH equally", "Only after all groups are completely deprotonated"],
  "A conjugate acid-base pair is present in comparable amounts near its pKa, producing maximal resistance to added acid or base.",
  "Locate buffering regions on an amino-acid titration curve.", ["titration", "pKa"]);
add(2, "protein structure", "Peptide-bond geometry", 3,
  "Why is rotation around the peptide C-N bond restricted?",
  "Resonance gives the bond partial double-bond character", ["The bond is purely ionic", "Every peptide bond is a disulfide", "The carbonyl oxygen removes the nitrogen atom"],
  "Electron delocalization across the peptide group produces partial double-bond character and a planar peptide unit.",
  "Explain peptide-bond planarity.", ["peptide-bond"]);
add(2, "protein structure", "Alpha helix", 3,
  "Which interaction stabilizes a typical alpha helix?",
  "Backbone hydrogen bonds between residues i and i+4", ["Disulfide bonds between every adjacent residue", "Hydrogen bonds only between side chains", "Ionic bonds to membrane cholesterol"],
  "The alpha helix is stabilized by regular intrachain backbone hydrogen bonds from residue i to residue i+4.",
  "Recognize alpha-helical hydrogen bonding.", ["secondary-structure"]);
add(2, "protein structure", "Beta sheet", 3,
  "What primarily stabilizes a beta sheet?",
  "Backbone hydrogen bonds between adjacent extended strands", ["Covalent bonds between all side chains", "Hydrogen bonds only within one turn", "A central heme group"],
  "Extended polypeptide strands align so backbone carbonyl and amide groups form interstrand hydrogen bonds.",
  "Describe beta-sheet stabilization.", ["secondary-structure"]);
add(2, "protein denaturation", "Primary structure", 3,
  "Ordinary heat denaturation usually disrupts which level least directly?",
  "Primary structure", ["Secondary structure", "Tertiary structure", "Quaternary structure"],
  "Denaturation disrupts noncovalent folding and subunit association but usually does not hydrolyze peptide bonds of the primary sequence.",
  "Distinguish denaturation from peptide-bond hydrolysis.", ["denaturation"]);

// Chapter 4: collagen and elastin.
add(4, "fibrous proteins", "Collagen sequence", 2,
  "Which repeating sequence is characteristic of collagen alpha chains?",
  "Gly-X-Y", ["Ala-Ala-Ala", "Lys-Lys-Lys", "Trp-X-Trp"],
  "Every third residue is glycine, whose small side chain fits into the crowded center of the collagen triple helix.",
  "Recognize collagen's repeating primary structure.", ["collagen"]);
add(4, "fibrous proteins", "Collagen hydroxylation", 3,
  "Hydroxylation of selected proline and lysine residues during collagen synthesis requires which vitamin?",
  "Vitamin C", ["Vitamin K", "Vitamin B12", "Vitamin A"],
  "Ascorbate maintains the iron of prolyl and lysyl hydroxylases in its active reduced state; deficiency weakens collagen.",
  "Connect vitamin C to collagen hydroxylation.", ["collagen", "vitamin-C"]);
add(4, "fibrous proteins", "Intracellular collagen step", 3,
  "Where do proline and lysine hydroxylation of collagen chains occur?",
  "In the rough endoplasmic reticulum before secretion", ["In the extracellular matrix after fibril assembly", "Inside lysosomes after collagen degradation", "Only in the nucleus"],
  "Hydroxylation and selected glycosylation are intracellular ER modifications of nascent procollagen chains.",
  "Order intracellular collagen-processing steps.", ["collagen", "RER"]);
add(4, "fibrous proteins", "Procollagen secretion", 3,
  "Why does procollagen contain terminal propeptides while it is inside the cell?",
  "They prevent premature intracellular fibril assembly", ["They bind oxygen like hemoglobin", "They degrade all collagen chains", "They anchor collagen permanently to ribosomes"],
  "Terminal propeptides keep procollagen soluble until secretion; extracellular peptidases remove them before fibril assembly.",
  "Explain the purpose of procollagen propeptides.", ["collagen", "procollagen"]);
add(4, "fibrous proteins", "Tropocollagen formation", 3,
  "What extracellular event converts secreted procollagen into tropocollagen?",
  "Cleavage of N- and C-terminal propeptides", ["Addition of a heme group", "Complete hydrolysis into amino acids", "Attachment of a ribosome"],
  "Extracellular procollagen peptidases remove terminal extensions, permitting tropocollagen molecules to assemble into fibrils.",
  "Identify the extracellular cleavage step in collagen synthesis.", ["collagen", "tropocollagen"]);
add(4, "fibrous proteins", "Collagen cross-linking", 4,
  "Which enzyme creates covalent cross-links between collagen fibrils after secretion?",
  "Copper-dependent lysyl oxidase", ["Prolyl hydroxylase", "Pepsin", "DNA ligase"],
  "Extracellular lysyl oxidase oxidatively deaminates selected lysine/hydroxylysine residues so mature cross-links can form.",
  "Identify the enzyme and cofactor used for collagen cross-linking.", ["collagen", "lysyl-oxidase"]);
add(4, "fibrous proteins", "Type I collagen", 2,
  "Which collagen type predominates in bone, skin, tendon, and scar tissue?",
  "Type I", ["Type II", "Type III", "Type IV"],
  "Type I is the major tensile collagen of bone, skin, tendon, dentin, and mature scar.",
  "Map type I collagen to its major tissues.", ["collagen-types"]);
add(4, "fibrous proteins", "Type II collagen", 2,
  "Which collagen type is most characteristic of cartilage and vitreous body?",
  "Type II", ["Type I", "Type III", "Type IV"],
  "Type II collagen forms fibrils suited to cartilage, vitreous body, and nucleus pulposus.",
  "Map type II collagen to cartilage.", ["collagen-types"]);
add(4, "fibrous proteins", "Type III collagen", 2,
  "Reticular fibers in lymphoid organs and early wound repair are composed mainly of which collagen?",
  "Type III", ["Type I", "Type II", "Type IV"],
  "Type III collagen forms delicate reticular fibers and is abundant in extensible tissues and early granulation tissue.",
  "Recognize type III collagen as reticular collagen.", ["collagen-types"]);
add(4, "fibrous proteins", "Type IV collagen", 2,
  "Which collagen forms a sheet-like network in basement membranes rather than ordinary fibrils?",
  "Type IV", ["Type I", "Type II", "Type III"],
  "Type IV collagen contains interruptions in its helix that permit a flexible sheet-forming network in basal laminae.",
  "Recognize type IV collagen in basement membranes.", ["collagen-types"]);
add(4, "fibrous proteins", "Osteogenesis imperfecta", 3,
  "A child has recurrent fractures, blue sclerae, and hearing loss. Which protein is most directly abnormal?",
  "Type I collagen", ["Type II collagen", "Elastin only", "Fibrillin only"],
  "Osteogenesis imperfecta usually reflects defective type I collagen quantity or structure.",
  "Connect osteogenesis imperfecta with type I collagen.", ["collagen-disease"]);
add(4, "fibrous proteins", "Scurvy", 3,
  "Bleeding gums, perifollicular hemorrhage, and poor wound healing in severe dietary deficiency result from impaired collagen hydroxylation caused by lack of what?",
  "Ascorbate", ["Biotin", "Cobalamin", "Calcitriol"],
  "Vitamin C deficiency reduces proline and lysine hydroxylation, destabilizing collagen and weakening vessels and connective tissue.",
  "Explain the collagen defect in scurvy.", ["collagen-disease", "vitamin-C"]);
add(4, "fibrous proteins", "Elastin scaffold", 3,
  "Microfibrils made of which protein provide a scaffold for elastic-fiber assembly?",
  "Fibrillin", ["Actin", "Tubulin", "Type II collagen"],
  "Tropoelastin is deposited on fibrillin-rich microfibrils; fibrillin defects underlie Marfan syndrome.",
  "Distinguish fibrillin scaffold from elastin core.", ["elastin", "fibrillin"]);
add(4, "fibrous proteins", "Alpha1-antitrypsin", 4,
  "Why does alpha1-antitrypsin deficiency predispose to panacinar emphysema?",
  "Unopposed neutrophil elastase destroys alveolar elastic tissue", ["Collagen hydroxylation stops completely", "Hemoglobin loses heme", "Surfactant becomes type I collagen"],
  "Alpha1-antitrypsin normally inhibits neutrophil elastase; deficiency permits progressive elastin destruction, especially with smoking.",
  "Relate protease-antiprotease balance to emphysema.", ["elastin", "clinical"]);

// Chapter 6: bioenergetics and oxidative phosphorylation.
add(6, "bioenergetics", "Free energy", 3,
  "A biochemical reaction with a negative delta G is best described as what?",
  "Thermodynamically favorable in the stated conditions", ["Necessarily instantaneous", "Unable to be coupled to another reaction", "Always at equilibrium"],
  "Negative delta G indicates a spontaneous thermodynamic direction, but it does not determine reaction rate.",
  "Separate thermodynamic favorability from kinetic rate.", ["free-energy"]);
add(6, "bioenergetics", "Energy coupling", 3,
  "How can ATP hydrolysis drive an otherwise unfavorable biosynthetic reaction?",
  "The reactions are coupled so their combined delta G is negative", ["ATP changes the equilibrium constant of water to zero", "ATP removes all activation energy", "ATP makes every enzyme irreversible"],
  "Enzymes couple reactions through shared intermediates so favorable ATP hydrolysis outweighs the positive free-energy change.",
  "Explain energetic coupling through ATP.", ["ATP", "coupling"]);
add(6, "bioenergetics", "Complex I", 3,
  "Which electron-transport-chain complex accepts electrons from NADH and pumps protons?",
  "Complex I", ["Complex II", "ATP synthase", "Adenine nucleotide translocase"],
  "Complex I transfers electrons from NADH to coenzyme Q and pumps protons from matrix to intermembrane space.",
  "Identify Complex I input and proton pumping.", ["ETC"]);
add(6, "bioenergetics", "Complex II", 3,
  "What distinguishes Complex II from Complexes I, III, and IV?",
  "It transfers electrons to coenzyme Q but does not pump protons", ["It reduces oxygen directly", "It synthesizes ATP directly", "It accepts electrons only from cytochrome c"],
  "Succinate dehydrogenase is both a TCA enzyme and ETC Complex II; it supplies FADH2-derived electrons without proton pumping.",
  "Explain why Complex II contributes less to the proton gradient.", ["ETC", "complex-II"]);
add(6, "bioenergetics", "Coenzyme Q", 3,
  "Which mobile lipid-soluble carrier transfers electrons from Complexes I and II to Complex III?",
  "Coenzyme Q", ["Cytochrome c", "NADPH oxidase", "ATP"],
  "Ubiquinone diffuses within the inner mitochondrial membrane and accepts electrons from multiple dehydrogenases.",
  "Locate coenzyme Q in the electron-transfer sequence.", ["ETC"]);
add(6, "bioenergetics", "Cytochrome c", 3,
  "Cytochrome c transfers electrons between which complexes?",
  "Complex III and Complex IV", ["Complex I and Complex II", "ATP synthase and Complex I", "Pyruvate dehydrogenase and citrate synthase"],
  "Cytochrome c is a small peripheral protein on the outer face of the inner membrane that carries one electron from III to IV.",
  "Locate cytochrome c in the respiratory chain.", ["ETC"]);
add(6, "bioenergetics", "Terminal acceptor", 2,
  "What is the final electron acceptor in the mitochondrial respiratory chain?",
  "Molecular oxygen", ["Carbon dioxide", "Pyruvate", "NAD+"],
  "Complex IV transfers electrons to oxygen, reducing it to water.",
  "Identify oxygen as the terminal electron acceptor.", ["ETC", "oxygen"]);
add(6, "bioenergetics", "Chemiosmosis", 3,
  "What directly powers ATP synthase during oxidative phosphorylation?",
  "Proton flow down the electrochemical gradient into the matrix", ["Direct transfer of phosphate from NADH", "Calcium binding to hemoglobin", "Hydrolysis of mitochondrial DNA"],
  "The proton-motive force generated by the respiratory chain drives rotation and ATP formation through F0F1 ATP synthase.",
  "Explain chemiosmotic ATP synthesis.", ["ATP-synthase"]);
add(6, "bioenergetics", "Oligomycin", 4,
  "Oligomycin inhibits oxidative phosphorylation by blocking which component?",
  "The proton channel of ATP synthase", ["Complex I NADH binding", "Cytochrome c synthesis", "Citrate export"],
  "Blocking F0 prevents proton return through ATP synthase, halting ATP production and secondarily slowing respiration.",
  "Identify the target and effect of oligomycin.", ["ETC-inhibitors"]);
add(6, "bioenergetics", "Uncoupling", 4,
  "What pattern is expected after adding a mitochondrial uncoupler when fuel and oxygen are available?",
  "Increased oxygen consumption, reduced ATP production, and increased heat", ["No oxygen consumption and increased ATP", "Reduced heat with maximal ATP", "Immediate inhibition of glycolysis only"],
  "Uncouplers dissipate the proton gradient, so electron transport accelerates but its energy is released as heat instead of captured as ATP.",
  "Predict the effects of uncoupling oxidative phosphorylation.", ["uncoupling"]);
add(6, "bioenergetics", "Thermogenin", 3,
  "What is the function of thermogenin in brown adipose tissue?",
  "It permits proton re-entry without ATP synthesis, generating heat", ["It blocks all fatty-acid oxidation", "It converts glucose directly to glycogen", "It transports oxygen in mitochondria"],
  "UCP1 uncouples oxidative phosphorylation in brown fat and converts fuel oxidation into nonshivering thermogenesis.",
  "Explain UCP1-mediated thermogenesis.", ["uncoupling", "brown-fat"]);
add(6, "bioenergetics", "Complex I inhibitor", 3,
  "Rotenone and amytal primarily inhibit which respiratory-chain complex?",
  "Complex I", ["Complex II", "Complex III", "Complex IV"],
  "Rotenone and amytal block transfer of electrons from Complex I iron-sulfur centers to coenzyme Q.",
  "Match classic toxins to Complex I.", ["ETC-inhibitors"]);
add(6, "bioenergetics", "Complex III inhibitor", 3,
  "Antimycin A primarily blocks which respiratory-chain complex?",
  "Complex III", ["Complex I", "Complex II", "Complex IV"],
  "Antimycin A blocks electron transfer through cytochrome bc1, preventing reduction of cytochrome c.",
  "Match antimycin A to Complex III.", ["ETC-inhibitors"]);
add(6, "bioenergetics", "Complex IV inhibitor", 3,
  "Cyanide and carbon monoxide can rapidly stop oxidative phosphorylation by inhibiting which complex?",
  "Complex IV", ["Complex I", "Complex II", "ATP-citrate lyase"],
  "They prevent cytochrome oxidase from transferring electrons to oxygen, stopping respiration despite available oxygen.",
  "Match cyanide and carbon monoxide to Complex IV.", ["ETC-inhibitors"]);
add(6, "bioenergetics", "P/O yield", 3,
  "Why does mitochondrial FADH2 generally yield less ATP than NADH?",
  "Its electrons enter at Complex II and bypass proton-pumping Complex I", ["FADH2 cannot donate electrons", "It directly inhibits ATP synthase", "It enters at Complex IV and releases oxygen"],
  "Bypassing Complex I results in fewer protons pumped per electron pair and approximately 1.5 rather than 2.5 ATP.",
  "Explain the different ATP yields of NADH and FADH2.", ["ETC", "ATP-yield"]);
add(6, "bioenergetics", "Malate-aspartate shuttle", 4,
  "Which cytosolic NADH shuttle preserves the higher mitochondrial NADH ATP yield?",
  "Malate-aspartate shuttle", ["Carnitine shuttle", "Citrate shuttle", "Glucose-alanine cycle"],
  "The malate-aspartate shuttle transfers reducing equivalents to matrix NAD+, whereas the glycerol-3-phosphate shuttle feeds electrons at coenzyme Q.",
  "Compare cytosolic NADH shuttles.", ["shuttles"]);
add(6, "bioenergetics", "Reactive oxygen species", 3,
  "Which enzyme converts superoxide radical to hydrogen peroxide?",
  "Superoxide dismutase", ["Catalase", "Glutathione reductase", "Cytochrome oxidase"],
  "Superoxide dismutase forms hydrogen peroxide, which catalase or glutathione peroxidase subsequently removes.",
  "Order antioxidant defenses against reactive oxygen species.", ["ROS"]);
add(6, "bioenergetics", "Glutathione peroxidase", 3,
  "Glutathione peroxidase requires which trace element?",
  "Selenium", ["Copper only", "Iodine", "Cobalt"],
  "Selenium-containing glutathione peroxidase reduces hydrogen peroxide and lipid peroxides using reduced glutathione.",
  "Connect selenium to peroxide detoxification.", ["ROS", "selenium"]);
add(6, "bioenergetics", "Compartmentation", 2,
  "Where are the respiratory-chain complexes located?",
  "Inner mitochondrial membrane", ["Outer mitochondrial membrane only", "Cytosol", "Nuclear envelope"],
  "The inner membrane houses electron transport and ATP synthase, while the TCA cycle largely occurs in the matrix.",
  "Locate oxidative phosphorylation within mitochondria.", ["mitochondria"]);
add(6, "bioenergetics", "Respiratory control", 4,
  "In tightly coupled mitochondria, a rise in available ADP generally has what effect?",
  "It accelerates ATP synthesis and electron transport", ["It permanently stops oxygen use", "It uncouples the membrane by itself", "It blocks phosphate entry"],
  "ADP availability controls the rate at which protons return through ATP synthase, thereby stimulating respiration.",
  "Explain acceptor control of oxidative phosphorylation.", ["respiratory-control"]);

// Chapter 14: glycoconjugates.
add(14, "glycosaminoglycans and proteoglycans", "GAG charge", 2,
  "Why do most glycosaminoglycans bind large amounts of water?",
  "They contain many negatively charged sulfate and carboxyl groups", ["They are entirely hydrophobic", "They contain only neutral triglycerides", "They form peptide bonds with oxygen"],
  "Dense negative charge attracts cations and water, producing hydrated gels that resist compression.",
  "Connect GAG chemistry with hydration and compression resistance.", ["GAG"]);
add(14, "glycosaminoglycans and proteoglycans", "Hyaluronan", 3,
  "Which feature distinguishes hyaluronan from most other glycosaminoglycans?",
  "It is unsulfated and is not covalently attached to a core protein", ["It contains no sugars", "It is synthesized only in lysosomes", "It is the only GAG rich in sulfate"],
  "Hyaluronan is synthesized at the plasma membrane as a very large unsulfated polymer and organizes proteoglycan aggregates.",
  "Recognize the distinctive features of hyaluronan.", ["GAG", "hyaluronan"]);
add(14, "glycosaminoglycans and proteoglycans", "Proteoglycan", 2,
  "What is the defining architecture of a proteoglycan?",
  "A core protein bearing long unbranched GAG chains", ["A lipid containing one glucose", "A protein composed only of collagen", "A nucleic acid attached to cholesterol"],
  "Proteoglycans contain much more carbohydrate than typical glycoproteins and carry repeated, negatively charged GAG chains.",
  "Distinguish proteoglycans from glycoproteins.", ["proteoglycan"]);
add(14, "glycoconjugates", "Glycoprotein", 3,
  "Compared with proteoglycans, typical glycoproteins contain what?",
  "Shorter, branched oligosaccharides and a larger protein fraction", ["Only long unbranched GAGs", "No covalent carbohydrate", "Only hyaluronan"],
  "Glycoproteins carry short branched oligosaccharides used in receptors, enzymes, antibodies, and cell recognition.",
  "Compare glycoprotein and proteoglycan architecture.", ["glycoprotein"]);
add(14, "glycoconjugates", "N-linked glycosylation", 3,
  "N-linked oligosaccharides are attached to which amino-acid side chain?",
  "Asparagine", ["Serine", "Threonine", "Glycine"],
  "N-linked carbohydrate attaches to the amide nitrogen of asparagine, whereas O-linked carbohydrate commonly attaches to serine or threonine.",
  "Differentiate N-linked from O-linked glycosylation.", ["glycoprotein"]);
add(14, "glycoconjugates", "Mannose-6-phosphate", 4,
  "Failure to add mannose-6-phosphate to lysosomal enzymes causes which disorder?",
  "I-cell disease", ["Tay-Sachs disease", "Sickle cell disease", "Phenylketonuria"],
  "Without the Golgi mannose-6-phosphate targeting signal, lysosomal hydrolases are secreted and undegraded material accumulates in cells.",
  "Explain lysosomal-enzyme targeting in I-cell disease.", ["lysosome", "I-cell"]);
add(14, "glycosaminoglycans and proteoglycans", "Keratan sulfate", 4,
  "Which glycosaminoglycan lacks a uronic acid residue?",
  "Keratan sulfate", ["Dermatan sulfate", "Heparan sulfate", "Chondroitin sulfate"],
  "Keratan sulfate contains galactose instead of a uronic acid in its repeating disaccharide.",
  "Recognize the compositional exception among GAGs.", ["GAG"]);
add(14, "glycosaminoglycans and proteoglycans", "Heparin", 3,
  "Which highly sulfated GAG is stored in mast-cell granules and acts as an anticoagulant?",
  "Heparin", ["Hyaluronan", "Keratan sulfate", "Chondroitin sulfate"],
  "Heparin potentiates antithrombin and is the most highly negatively charged GAG.",
  "Connect heparin structure with anticoagulant function.", ["GAG", "heparin"]);
add(14, "glycosaminoglycans and proteoglycans", "Hurler syndrome", 4,
  "Corneal clouding, developmental delay, coarse facial features, and elevated heparan and dermatan sulfate most strongly suggest what?",
  "Hurler syndrome", ["Hunter syndrome", "Fabry disease", "Niemann-Pick disease"],
  "Hurler syndrome is autosomal recessive alpha-L-iduronidase deficiency and characteristically includes corneal clouding.",
  "Distinguish Hurler from Hunter syndrome.", ["mucopolysaccharidosis"]);
add(14, "glycosaminoglycans and proteoglycans", "Hunter syndrome", 4,
  "Which mucopolysaccharidosis is X-linked and typically lacks corneal clouding?",
  "Hunter syndrome", ["Hurler syndrome", "Gaucher disease", "Pompe disease"],
  "Hunter syndrome is iduronate sulfatase deficiency; unlike Hurler syndrome, corneal clouding is generally absent.",
  "Recognize the inheritance and eye finding of Hunter syndrome.", ["mucopolysaccharidosis"]);

// Chapter 15: digestion and transport of dietary lipids.
add(15, "dietary lipid metabolism", "Bile salts", 3,
  "What is the main digestive role of bile salts?",
  "Emulsifying dietary lipids and forming mixed micelles", ["Hydrolyzing peptide bonds", "Activating glycogen phosphorylase", "Transporting oxygen"],
  "Amphipathic bile salts increase lipid surface area and keep digestion products soluble for delivery to enterocytes.",
  "Explain bile-salt function in lipid absorption.", ["lipid-digestion"]);
add(15, "dietary lipid metabolism", "Pancreatic lipase", 3,
  "Pancreatic lipase acting with colipase converts triacylglycerol mainly into what?",
  "Two free fatty acids and 2-monoacylglycerol", ["Glycerol and three amino acids", "Cholesterol and glucose", "Acetyl-CoA inside the intestinal lumen"],
  "Pancreatic lipase preferentially hydrolyzes the fatty acids at positions 1 and 3 of dietary triacylglycerol.",
  "State the major products of pancreatic lipase.", ["lipid-digestion"]);
add(15, "dietary lipid metabolism", "Colipase", 3,
  "Why is colipase important for pancreatic lipase action?",
  "It anchors lipase to the lipid-water interface despite bile salts", ["It synthesizes bile acids", "It degrades apoproteins", "It oxidizes fatty acids in mitochondria"],
  "Colipase is activated by trypsin and permits pancreatic lipase to act at emulsified lipid droplets.",
  "Explain colipase function.", ["lipid-digestion"]);
add(15, "dietary lipid metabolism", "Phospholipase A2", 3,
  "Pancreatic phospholipase A2 removes which group from a phospholipid?",
  "The fatty acid at carbon 2", ["The phosphate at carbon 3 only", "Both glucose residues", "The sphingosine backbone"],
  "Phospholipase A2 releases the sn-2 fatty acid, leaving a lysophospholipid.",
  "Identify the bond cleaved by phospholipase A2.", ["lipid-digestion"]);
add(15, "dietary lipid metabolism", "Mixed micelles", 3,
  "What is delivered to the enterocyte brush border by mixed micelles?",
  "Long-chain fatty acids, monoacylglycerol, cholesterol, and fat-soluble vitamins", ["Intact chylomicrons", "Only amino acids", "Newly synthesized VLDL"],
  "Micelles ferry hydrophobic digestion products through the unstirred water layer; bile salts largely remain in the lumen.",
  "Describe mixed-micelle cargo.", ["lipid-absorption"]);
add(15, "dietary lipid metabolism", "Medium-chain fatty acids", 3,
  "How do short- and medium-chain fatty acids usually leave enterocytes?",
  "Directly into portal blood bound to albumin", ["Only inside chylomicrons", "Inside LDL particles", "Through the lymph as free crystals"],
  "They are sufficiently water soluble to enter portal blood directly, unlike long-chain lipids packaged into chylomicrons.",
  "Compare absorption routes by fatty-acid chain length.", ["lipid-absorption"]);
add(15, "dietary lipid metabolism", "Chylomicron assembly", 4,
  "Which apoprotein is assembled with dietary lipid in enterocytes to form nascent chylomicrons?",
  "ApoB-48", ["ApoB-100", "ApoA-II only", "ApoC-III only"],
  "Enterocytes synthesize ApoB-48, and microsomal triglyceride-transfer protein loads it with lipid.",
  "Identify the structural apoprotein of chylomicrons.", ["chylomicron"]);
add(15, "dietary lipid metabolism", "Lipoprotein lipase", 3,
  "Which apoprotein activates lipoprotein lipase on capillary endothelium?",
  "ApoC-II", ["ApoB-48", "ApoA-I", "Apo(a)"],
  "ApoC-II obtained from HDL activates LPL to hydrolyze chylomicron and VLDL triacylglycerol.",
  "Match ApoC-II with lipoprotein lipase.", ["apoprotein", "LPL"]);
add(15, "dietary lipid metabolism", "Remnant uptake", 3,
  "Hepatic uptake of chylomicron remnants depends most directly on which apoprotein?",
  "ApoE", ["ApoC-II", "ApoA-I", "ApoB-48 alone"],
  "ApoE serves as the remnant-recognition ligand for hepatic receptors.",
  "Match ApoE with remnant clearance.", ["apoprotein", "chylomicron"]);
add(15, "dietary lipid metabolism", "Abetalipoproteinemia", 4,
  "Loss of microsomal triglyceride-transfer protein causes which lipoprotein defect?",
  "Failure to form ApoB-containing chylomicrons and VLDL", ["Failure to form HDL only", "Excess LDL-receptor activity", "Isolated loss of ApoC-II"],
  "MTP is required to lipidate ApoB; deficiency causes fat malabsorption, acanthocytes, neurologic problems, and deficiency of fat-soluble vitamins.",
  "Explain the lipoprotein defect in abetalipoproteinemia.", ["MTP", "clinical"]);
add(15, "dietary lipid metabolism", "Steatorrhea", 3,
  "Obstruction of bile flow most directly impairs absorption of which nutrients?",
  "Dietary lipids and fat-soluble vitamins", ["Amino acids only", "Water-soluble vitamins only", "Glucose only"],
  "Loss of bile salts prevents effective emulsification and micelle formation, causing steatorrhea and A, D, E, K deficiency.",
  "Predict consequences of impaired bile delivery.", ["steatorrhea"]);
add(15, "dietary lipid metabolism", "Orlistat", 3,
  "Orlistat promotes weight loss by inhibiting which digestive activity?",
  "Gastric and pancreatic lipases", ["Bile-acid synthesis", "Intestinal glucose transport", "Protein translation"],
  "Lipase inhibition reduces triacylglycerol digestion and absorption and may cause oily stool and fat-soluble-vitamin deficiency.",
  "Explain orlistat's mechanism and adverse effects.", ["lipid-digestion", "drug"]);

// Chapter 16: fatty-acid, ketone-body, and triacylglycerol metabolism.
add(16, "fatty acid and ketone metabolism", "Acetyl-CoA carboxylase", 3,
  "What is the committed rate-limiting step of fatty-acid synthesis?",
  "Biotin-dependent conversion of acetyl-CoA to malonyl-CoA by acetyl-CoA carboxylase", ["Transport of fatty acyl-CoA through CPT-I", "Hydrolysis of VLDL by LPL", "Conversion of ketones to glucose"],
  "ACC forms malonyl-CoA in the cytosol and is activated by insulin and citrate.",
  "Identify the regulated step of fatty-acid synthesis.", ["fatty-acid-synthesis"]);
add(16, "fatty acid and ketone metabolism", "Citrate shuttle", 3,
  "Why is citrate exported from mitochondria during fatty-acid synthesis?",
  "It carries acetyl units into the cytosol", ["It transports long-chain fatty acids into mitochondria", "It directly reduces oxygen", "It is the ketone used by brain"],
  "Mitochondrial acetyl-CoA cannot cross the inner membrane; citrate export and ATP-citrate lyase regenerate cytosolic acetyl-CoA.",
  "Explain the citrate shuttle in lipogenesis.", ["fatty-acid-synthesis"]);
add(16, "fatty acid and ketone metabolism", "NADPH source", 3,
  "Which two processes are major sources of NADPH for fatty-acid synthesis?",
  "Pentose phosphate pathway and malic enzyme", ["TCA cycle and urea cycle only", "Beta oxidation and ketolysis", "Glycogenolysis and lactate dehydrogenase"],
  "Cytosolic NADPH from the oxidative PPP and malic enzyme supplies reducing power for fatty-acid synthase.",
  "Identify reducing-equivalent sources for lipogenesis.", ["fatty-acid-synthesis", "NADPH"]);
add(16, "fatty acid and ketone metabolism", "Fatty-acid synthase product", 2,
  "What is the principal product released by mammalian fatty-acid synthase?",
  "Palmitate, 16:0", ["Stearate, 18:0 exclusively", "Arachidonate, 20:4", "Linolenate, 18:3"],
  "Fatty-acid synthase cycles seven times to produce the saturated 16-carbon fatty acid palmitate.",
  "Recall the direct product of fatty-acid synthase.", ["fatty-acid-synthesis"]);
add(16, "fatty acid and ketone metabolism", "Essential fatty acids", 3,
  "Why must linoleic and alpha-linolenic acids be supplied in the diet?",
  "Humans cannot introduce double bonds beyond carbon 9 from the carboxyl end", ["Humans cannot synthesize any fatty acid", "They contain nitrogen", "They are the only fatty acids entering mitochondria"],
  "Human desaturases lack the ability to create omega-6 and omega-3 double bonds, making these fatty acids essential.",
  "Explain why omega-6 and omega-3 parent fatty acids are essential.", ["essential-fatty-acid"]);
add(16, "fatty acid and ketone metabolism", "Hormone-sensitive lipase", 3,
  "Which hormonal state activates hormone-sensitive lipase in adipose tissue?",
  "Low insulin with elevated catecholamine or glucagon signaling", ["High insulin after a carbohydrate meal", "High malonyl-CoA alone", "High chylomicron ApoB-48"],
  "PKA-mediated phosphorylation promotes stored-TAG mobilization, whereas insulin favors dephosphorylation and storage.",
  "Relate hormonal state to adipose lipolysis.", ["lipolysis"]);
add(16, "fatty acid and ketone metabolism", "Fatty-acid activation", 4,
  "Activation of a fatty acid to fatty acyl-CoA consumes ATP to AMP. How many high-energy phosphate equivalents are used?",
  "Two", ["Zero", "One", "Four"],
  "ATP is cleaved to AMP plus pyrophosphate, and pyrophosphate hydrolysis makes the energetic cost equivalent to two ATP bonds.",
  "Calculate the energy cost of fatty-acid activation.", ["beta-oxidation"]);
add(16, "fatty acid and ketone metabolism", "Carnitine shuttle", 3,
  "Which system transports long-chain fatty acyl groups into the mitochondrial matrix?",
  "Carnitine shuttle", ["Malate-aspartate shuttle", "Cori cycle", "Urea transporter"],
  "CPT-I, the translocase, and CPT-II move long-chain acyl groups across the otherwise impermeable inner membrane.",
  "Describe mitochondrial entry of long-chain fatty acids.", ["beta-oxidation", "carnitine"]);
add(16, "fatty acid and ketone metabolism", "Malonyl-CoA regulation", 3,
  "Malonyl-CoA prevents simultaneous fatty-acid synthesis and oxidation by inhibiting what?",
  "Carnitine palmitoyltransferase I", ["Acetyl-CoA carboxylase", "Hormone-sensitive lipase", "HMG-CoA lyase"],
  "High malonyl-CoA during synthesis blocks mitochondrial entry of long-chain fatty acyl groups through CPT-I.",
  "Explain reciprocal regulation of synthesis and oxidation.", ["beta-oxidation", "regulation"]);
add(16, "fatty acid and ketone metabolism", "Beta-oxidation products", 3,
  "One cycle of beta oxidation of a saturated even-chain fatty acyl-CoA produces what?",
  "One FADH2, one NADH, one acetyl-CoA, and an acyl-CoA shortened by two carbons", ["One glucose and one lactate", "Only carbon dioxide", "One malonyl-CoA and one NADPH"],
  "The four-reaction spiral oxidizes the beta carbon and cleaves off a two-carbon acetyl-CoA unit.",
  "List the products of one beta-oxidation cycle.", ["beta-oxidation"]);
add(16, "fatty acid and ketone metabolism", "Odd-chain fatty acids", 4,
  "The final three-carbon product of odd-chain fatty-acid oxidation enters the TCA cycle as what?",
  "Succinyl-CoA", ["Citrate", "Acetyl-CoA only", "Malonyl-CoA"],
  "Propionyl-CoA is converted to methylmalonyl-CoA using biotin, then to succinyl-CoA using vitamin B12.",
  "Trace odd-chain fatty acids to succinyl-CoA.", ["beta-oxidation", "B12", "biotin"]);
add(16, "fatty acid and ketone metabolism", "MCAD deficiency", 4,
  "An infant develops vomiting, lethargy, hypoketotic hypoglycemia, and dicarboxylic aciduria after fasting. What is the likely defect?",
  "Medium-chain acyl-CoA dehydrogenase deficiency", ["Acetyl-CoA carboxylase overactivity", "Lipoprotein lipase excess", "HMG-CoA reductase deficiency"],
  "MCAD deficiency impairs beta oxidation during fasting, limiting ATP and ketone production and diverting fatty acids to omega oxidation.",
  "Recognize the presentation of MCAD deficiency.", ["beta-oxidation", "clinical"]);
add(16, "fatty acid and ketone metabolism", "Peroxisomal oxidation", 4,
  "What is a distinctive feature of the first step of peroxisomal beta oxidation?",
  "Electrons are transferred directly to oxygen to form hydrogen peroxide", ["It makes ATP through Complex I", "It requires no oxidation", "It occurs only in red blood cells"],
  "Peroxisomal acyl-CoA oxidase produces H2O2 and shortens very-long-chain fatty acids before mitochondrial completion.",
  "Compare peroxisomal and mitochondrial beta oxidation.", ["peroxisome"]);
add(16, "fatty acid and ketone metabolism", "Ketogenesis site", 2,
  "Where are ketone bodies synthesized during prolonged fasting?",
  "Liver mitochondrial matrix", ["Adipocyte cytosol", "Red-cell mitochondria", "Skeletal-muscle nucleus"],
  "High hepatic fatty-acid oxidation supplies acetyl-CoA for mitochondrial HMG-CoA synthase and ketogenesis.",
  "Locate ketone-body synthesis.", ["ketogenesis"]);
add(16, "fatty acid and ketone metabolism", "Hepatic ketolysis", 3,
  "Why can the liver synthesize but not use ketone bodies?",
  "It lacks succinyl-CoA:acetoacetate CoA transferase", ["It lacks mitochondria", "It cannot oxidize fatty acids", "It lacks HMG-CoA synthase"],
  "Absence of thiophorase directs ketones out of liver for oxidation by extrahepatic tissues.",
  "Explain why liver exports ketone bodies.", ["ketogenesis"]);
add(16, "fatty acid and ketone metabolism", "Red cells and ketones", 3,
  "Why can red blood cells not use ketone bodies?",
  "They lack mitochondria", ["They lack glucose transporters", "They contain too much oxygen", "They lack cytosolic enzymes"],
  "Ketone oxidation requires mitochondrial enzymes, whereas mature erythrocytes depend entirely on anaerobic glycolysis.",
  "Relate mitochondrial absence to erythrocyte fuel use.", ["ketogenesis"]);
add(16, "fatty acid and ketone metabolism", "Beta-hydroxybutyrate", 3,
  "Which circulating ketone body predominates when the hepatic mitochondrial NADH/NAD+ ratio is high?",
  "Beta-hydroxybutyrate", ["Acetoacetate only", "Acetone exclusively", "Malonate"],
  "High NADH reduces acetoacetate to beta-hydroxybutyrate, even though beta-hydroxybutyrate is chemically a hydroxy acid.",
  "Predict the major ketone body in a highly reduced liver.", ["ketogenesis"]);
add(16, "fatty acid and ketone metabolism", "Adipose glycerol", 3,
  "Why is glycerol released from adipose lipolysis sent mainly to the liver?",
  "Adipose tissue has little glycerol kinase", ["Adipose cannot release fatty acids", "The liver lacks glycerol kinase", "Glycerol cannot travel in blood"],
  "Liver phosphorylates glycerol for gluconeogenesis or TAG synthesis, while adipose relies mainly on glycolytic glycerol-3-phosphate.",
  "Explain tissue handling of glycerol.", ["triacylglycerol"]);
add(16, "fatty acid and ketone metabolism", "Omega oxidation", 4,
  "Dicarboxylic acid production becomes prominent when beta oxidation is impaired because fatty acids undergo what alternative pathway?",
  "Omega oxidation in the endoplasmic reticulum", ["Glycolysis in lysosomes", "Ketolysis in red cells", "Protein translation"],
  "ER omega oxidation attacks the terminal methyl carbon and produces dicarboxylic acids excreted in urine.",
  "Connect dicarboxylic aciduria with omega oxidation.", ["omega-oxidation"]);
add(16, "fatty acid and ketone metabolism", "Insulin and TAG", 3,
  "How does insulin favor triacylglycerol storage in adipose tissue?",
  "It increases GLUT4 glucose uptake and adipose LPL while inhibiting hormone-sensitive lipase", ["It activates HSL and blocks glucose uptake", "It inhibits all fatty-acid synthesis", "It removes ApoB from chylomicrons"],
  "Insulin supplies glycerol-3-phosphate, promotes uptake of circulating fatty acids, and suppresses stored-fat mobilization.",
  "Integrate insulin's effects on adipose TAG storage.", ["triacylglycerol", "insulin"]);

// Chapter 17: phospholipids, sphingolipids, and eicosanoids.
add(17, "complex lipid metabolism", "Phosphatidic acid", 3,
  "Which molecule is a central precursor for both glycerophospholipids and triacylglycerol?",
  "Phosphatidic acid", ["Sphingosine", "Cholesterol", "Acetoacetate"],
  "Glycerol-3-phosphate with two fatty acyl groups forms phosphatidic acid, which can enter TAG or phospholipid synthesis.",
  "Recognize phosphatidic acid as a branch-point intermediate.", ["phospholipid"]);
add(17, "complex lipid metabolism", "Cardiolipin", 3,
  "Which phospholipid is especially enriched in the inner mitochondrial membrane?",
  "Cardiolipin", ["Phosphatidylcholine only", "Platelet-activating factor", "Cerebroside"],
  "Cardiolipin supports the structure and function of respiratory-chain complexes in the inner mitochondrial membrane.",
  "Map cardiolipin to mitochondria.", ["phospholipid"]);
add(17, "complex lipid metabolism", "Pulmonary surfactant", 3,
  "The major surface-tension-lowering phospholipid in pulmonary surfactant is what?",
  "Dipalmitoyl phosphatidylcholine", ["Sphingomyelin", "Phosphatidylinositol", "Cardiolipin"],
  "DPPC, or dipalmitoyl lecithin, is produced by type II pneumocytes and reduces alveolar surface tension.",
  "Identify the major surfactant phospholipid.", ["phospholipid", "surfactant"]);
add(17, "complex lipid metabolism", "Phospholipase A2", 3,
  "Activation of phospholipase A2 can initiate eicosanoid synthesis by releasing what?",
  "Arachidonic acid from membrane phospholipids", ["Cholesterol from LDL", "Glucose from glycogen", "Heme from hemoglobin"],
  "PLA2 releases arachidonate from the sn-2 position; glucocorticoids reduce this step through lipocortin.",
  "Connect PLA2 with arachidonic-acid release.", ["eicosanoid"]);
add(17, "complex lipid metabolism", "Ceramide", 3,
  "What is the core structure from which sphingomyelin and glycosphingolipids are built?",
  "Ceramide", ["Phosphatidic acid", "Cholesteryl ester", "Malonyl-CoA"],
  "Ceramide consists of sphingosine plus an amide-linked fatty acid and serves as the sphingolipid core.",
  "Recognize ceramide as the sphingolipid precursor.", ["sphingolipid"]);
add(17, "complex lipid metabolism", "Sphingomyelin", 2,
  "Which sphingolipid contains phosphocholine and is abundant in myelin?",
  "Sphingomyelin", ["Cerebroside", "Ganglioside", "Cardiolipin"],
  "Sphingomyelin is a phosphosphingolipid consisting of ceramide plus phosphocholine.",
  "Distinguish sphingomyelin from glycosphingolipids.", ["sphingolipid"]);
add(17, "complex lipid metabolism", "Cerebroside", 3,
  "A glycosphingolipid containing a single sugar but no sialic acid is called what?",
  "Cerebroside", ["Ganglioside", "Sphingomyelin", "Phosphatidylinositol"],
  "Cerebrosides carry one glucose or galactose; gangliosides contain oligosaccharides with sialic acid.",
  "Compare cerebrosides and gangliosides.", ["sphingolipid"]);
add(17, "complex lipid metabolism", "Tay-Sachs disease", 4,
  "Progressive neurodegeneration, a cherry-red macula, exaggerated startle, and no hepatosplenomegaly suggest deficiency of what?",
  "Hexosaminidase A", ["Sphingomyelinase", "Glucocerebrosidase", "Arylsulfatase A"],
  "Hexosaminidase A deficiency causes GM2 ganglioside accumulation in Tay-Sachs disease.",
  "Recognize the biochemical defect in Tay-Sachs disease.", ["sphingolipid-disease"]);
add(17, "complex lipid metabolism", "Niemann-Pick disease", 4,
  "Foam cells, neurodegeneration, hepatosplenomegaly, and a cherry-red macula can result from deficiency of what?",
  "Sphingomyelinase", ["Hexosaminidase A", "Alpha-galactosidase A", "Galactocerebrosidase"],
  "Sphingomyelinase deficiency causes sphingomyelin accumulation in Niemann-Pick types A and B.",
  "Recognize Niemann-Pick disease.", ["sphingolipid-disease"]);
add(17, "complex lipid metabolism", "Gaucher disease", 4,
  "Macrophages with crumpled-paper cytoplasm and hepatosplenomegaly suggest deficiency of what?",
  "Glucocerebrosidase", ["Hexosaminidase A", "Sphingomyelinase", "Iduronate sulfatase"],
  "Gaucher disease results from glucocerebrosidase deficiency and accumulation of glucocerebroside in macrophages.",
  "Recognize Gaucher disease.", ["sphingolipid-disease"]);
add(17, "complex lipid metabolism", "Fabry disease", 4,
  "An X-linked disorder causing angiokeratomas, acroparesthesias, renal disease, and cardiomyopathy results from deficiency of what?",
  "Alpha-galactosidase A", ["Beta-glucocerebrosidase", "Hexosaminidase A", "Sphingomyelinase"],
  "Fabry disease causes globotriaosylceramide accumulation because of alpha-galactosidase A deficiency.",
  "Recognize Fabry disease and its inheritance.", ["sphingolipid-disease"]);
add(17, "complex lipid metabolism", "Cyclooxygenase", 3,
  "Cyclooxygenase converts arachidonic acid into precursors of which mediators?",
  "Prostaglandins, prostacyclin, and thromboxanes", ["Leukotrienes only", "Bile acids", "Catecholamines"],
  "COX-1 and COX-2 form cyclic endoperoxides used for prostanoid synthesis; NSAIDs inhibit these enzymes.",
  "Map the cyclooxygenase branch of eicosanoid synthesis.", ["eicosanoid"]);
add(17, "complex lipid metabolism", "Lipoxygenase", 3,
  "The 5-lipoxygenase pathway produces which family of mediators?",
  "Leukotrienes", ["Thromboxanes", "Bile salts", "Steroid hormones"],
  "5-lipoxygenase produces leukotrienes involved in leukocyte recruitment and bronchoconstriction.",
  "Map the lipoxygenase branch.", ["eicosanoid"]);
add(17, "complex lipid metabolism", "Thromboxane versus prostacyclin", 4,
  "Which pairing correctly contrasts platelet thromboxane A2 with endothelial prostacyclin?",
  "TXA2 promotes aggregation and vasoconstriction; PGI2 inhibits aggregation and dilates vessels", ["Both inhibit platelets", "TXA2 dilates while PGI2 constricts", "Both are leukotrienes"],
  "The opposing platelet and endothelial prostanoids help regulate thrombosis and vascular tone.",
  "Compare TXA2 and PGI2 actions.", ["eicosanoid", "platelets"]);
add(17, "complex lipid metabolism", "Leukotriene B4", 3,
  "Which eicosanoid is a potent neutrophil chemotactic factor?",
  "Leukotriene B4", ["Leukotriene C4", "Thromboxane A2", "Prostaglandin I2"],
  "LTB4 recruits and activates neutrophils, whereas LTC4, LTD4, and LTE4 promote bronchoconstriction and vascular permeability.",
  "Differentiate leukotriene functions.", ["eicosanoid"]);
add(17, "complex lipid metabolism", "Aspirin", 4,
  "Why does low-dose aspirin inhibit platelet thromboxane production for the life of the platelet?",
  "It irreversibly acetylates cyclooxygenase, and platelets cannot synthesize new enzyme", ["It degrades platelet DNA", "It irreversibly inhibits lipoxygenase only", "It removes all arachidonic acid from endothelium"],
  "Anucleate platelets cannot replace irreversibly inhibited COX, whereas endothelial cells can synthesize new enzyme.",
  "Explain aspirin's persistent antiplatelet effect.", ["eicosanoid", "aspirin"]);

// Chapter 18: cholesterol, lipoprotein, and steroid metabolism.
add(18, "cholesterol and lipoprotein metabolism", "HMG-CoA reductase", 3,
  "What is the rate-limiting enzyme of cholesterol synthesis?",
  "HMG-CoA reductase", ["HMG-CoA lyase", "Lipoprotein lipase", "LCAT"],
  "Cytosolic HMG-CoA reductase converts HMG-CoA to mevalonate and is the target of statins.",
  "Identify the regulated step of cholesterol synthesis.", ["cholesterol"]);
add(18, "cholesterol and lipoprotein metabolism", "Statins", 3,
  "How do statins lower plasma LDL cholesterol?",
  "They inhibit HMG-CoA reductase and increase hepatic LDL-receptor expression", ["They activate intestinal cholesterol absorption", "They inhibit lipoprotein lipase", "They block ApoA-I synthesis"],
  "Reduced hepatic cholesterol activates SREBP-mediated LDL-receptor expression, increasing LDL clearance.",
  "Explain the primary LDL-lowering mechanism of statins.", ["cholesterol", "statin"]);
add(18, "cholesterol and lipoprotein metabolism", "Cholesterol elimination", 3,
  "What is the principal route for net elimination of the cholesterol steroid nucleus?",
  "Secretion into bile as cholesterol or bile acids", ["Complete oxidation to carbon dioxide", "Urinary excretion of intact LDL", "Conversion to glucose"],
  "Humans cannot completely degrade the sterol ring, so cholesterol leaves primarily through bile and feces.",
  "Identify the route of cholesterol disposal.", ["cholesterol", "bile-acid"]);
add(18, "cholesterol and lipoprotein metabolism", "Bile-acid regulation", 4,
  "Which enzyme is rate limiting in bile-acid synthesis from cholesterol?",
  "Cholesterol 7-alpha-hydroxylase", ["HMG-CoA lyase", "Acetyl-CoA carboxylase", "Hormone-sensitive lipase"],
  "CYP7A1 is feedback inhibited by bile acids and controls the major route of cholesterol catabolism.",
  "Identify the regulated step of bile-acid synthesis.", ["bile-acid"]);
add(18, "cholesterol and lipoprotein metabolism", "Chylomicron role", 2,
  "Which lipoprotein primarily transports dietary triacylglycerol from intestine to peripheral tissues?",
  "Chylomicron", ["VLDL", "LDL", "HDL"],
  "ApoB-48-containing chylomicrons deliver exogenous TAG and then return remnants to liver.",
  "State the principal cargo and origin of chylomicrons.", ["lipoprotein"]);
add(18, "cholesterol and lipoprotein metabolism", "VLDL role", 2,
  "Which lipoprotein transports triacylglycerol synthesized in the liver?",
  "VLDL", ["Chylomicron", "LDL", "HDL"],
  "ApoB-100-containing VLDL exports endogenous hepatic TAG and becomes IDL and then LDL after lipolysis.",
  "State the principal cargo and origin of VLDL.", ["lipoprotein"]);
add(18, "cholesterol and lipoprotein metabolism", "LDL receptor", 3,
  "Which apoprotein on LDL binds the LDL receptor?",
  "ApoB-100", ["ApoB-48", "ApoC-II", "ApoA-I"],
  "ApoB-100 is the structural ligand for receptor-mediated LDL uptake; ApoE also binds remnant receptors.",
  "Match ApoB-100 with LDL-receptor binding.", ["lipoprotein", "apoprotein"]);
add(18, "cholesterol and lipoprotein metabolism", "HDL role", 3,
  "What is the central antiatherogenic function of HDL?",
  "Reverse cholesterol transport from peripheral tissues to liver", ["Delivery of dietary TAG from gut", "Delivery of hepatic TAG to muscle", "Formation of ketone bodies"],
  "ApoA-I-containing HDL accepts peripheral cholesterol, esterifies it, and returns it directly or indirectly to liver.",
  "Explain reverse cholesterol transport.", ["lipoprotein", "HDL"]);
add(18, "cholesterol and lipoprotein metabolism", "LCAT", 3,
  "Which enzyme esterifies free cholesterol on circulating HDL and is activated by ApoA-I?",
  "LCAT", ["ACAT", "LPL", "HMG-CoA reductase"],
  "Plasma lecithin-cholesterol acyltransferase traps cholesterol in the HDL core as cholesteryl ester.",
  "Differentiate LCAT from intracellular ACAT.", ["lipoprotein", "LCAT"]);
add(18, "cholesterol and lipoprotein metabolism", "ACAT", 3,
  "Which enzyme esterifies cholesterol for intracellular storage?",
  "ACAT", ["LCAT", "CETP", "Hormone-sensitive lipase"],
  "Acyl-CoA:cholesterol acyltransferase acts inside cells, whereas LCAT acts in plasma on HDL.",
  "Distinguish intracellular ACAT from plasma LCAT.", ["cholesterol"]);
add(18, "cholesterol and lipoprotein metabolism", "CETP", 4,
  "What exchange is mediated by cholesteryl ester transfer protein?",
  "HDL cholesteryl esters for triacylglycerol in VLDL and related particles", ["LDL cholesterol for glucose", "Chylomicron ApoB-48 for ApoB-100", "Bile salts for amino acids"],
  "CETP transfers cholesteryl ester from HDL to ApoB particles in exchange for TAG.",
  "Explain CETP-mediated lipid exchange.", ["lipoprotein", "CETP"]);
add(18, "cholesterol and lipoprotein metabolism", "ApoA-I", 3,
  "Which apoprotein is the major structural protein of HDL and activates LCAT?",
  "ApoA-I", ["ApoB-48", "ApoC-II", "ApoE"],
  "ApoA-I initiates nascent HDL formation and activates LCAT during reverse cholesterol transport.",
  "Recall ApoA-I functions.", ["apoprotein"]);
add(18, "cholesterol and lipoprotein metabolism", "Familial hypercholesterolemia", 4,
  "Tendon xanthomas and markedly elevated LDL from childhood most strongly suggest defective function of what pathway?",
  "LDL-receptor-mediated clearance", ["Chylomicron lipolysis only", "Ketone-body synthesis", "HDL ApoA-I production only"],
  "Familial hypercholesterolemia commonly results from LDL receptor, ApoB-100, or PCSK9 abnormalities that reduce LDL clearance.",
  "Recognize familial hypercholesterolemia.", ["lipoprotein", "clinical"]);
add(18, "cholesterol and lipoprotein metabolism", "LPL deficiency", 4,
  "Recurrent pancreatitis, eruptive xanthomas, and creamy plasma with very high chylomicrons suggest deficiency of what?",
  "Lipoprotein lipase or ApoC-II", ["LDL receptor", "HMG-CoA reductase", "LCAT only"],
  "Failure to hydrolyze chylomicron TAG causes severe hypertriglyceridemia and pancreatitis.",
  "Recognize familial chylomicronemia.", ["lipoprotein", "clinical"]);
add(18, "cholesterol and lipoprotein metabolism", "Remnant particles", 3,
  "Which apoprotein mediates hepatic uptake of both chylomicron remnants and much of IDL?",
  "ApoE", ["ApoA-I", "ApoC-II", "ApoB-48 only"],
  "ApoE is the principal ligand for remnant receptors in the liver.",
  "Connect ApoE with remnant clearance.", ["apoprotein"]);
add(18, "cholesterol and lipoprotein metabolism", "Foam cells", 4,
  "Why can macrophages accumulate massive amounts of cholesterol from oxidized LDL?",
  "Scavenger-receptor uptake is not normally downregulated by intracellular cholesterol", ["LDL cannot enter macrophages", "Macrophages completely degrade cholesterol to carbon dioxide", "Oxidized LDL activates LCAT only"],
  "Unregulated scavenger-receptor uptake produces lipid-laden foam cells in atherosclerotic plaques.",
  "Explain foam-cell formation.", ["atherosclerosis"]);
add(18, "cholesterol and lipoprotein metabolism", "Steroid precursor", 2,
  "All steroid hormones are synthesized from which precursor?",
  "Cholesterol", ["Palmitate", "Glucose directly", "Heme"],
  "Mitochondrial cholesterol side-chain cleavage forms pregnenolone, the common precursor for steroid hormones.",
  "Identify the precursor of steroid hormones.", ["steroid"]);
add(18, "cholesterol and lipoprotein metabolism", "StAR protein", 4,
  "What acute regulated step is required for steroid-hormone synthesis?",
  "Transfer of cholesterol into mitochondria by StAR protein", ["Export of pregnenolone into lysosomes", "Conversion of cholesterol to bile salts in blood", "Binding of cholesterol to hemoglobin"],
  "Steroidogenic acute regulatory protein moves cholesterol to the inner mitochondrial membrane for side-chain cleavage.",
  "Explain acute control of steroidogenesis.", ["steroid"]);
add(18, "cholesterol and lipoprotein metabolism", "Tangier disease", 4,
  "Very low HDL, orange tonsils, and cholesterol accumulation in tissues can result from defective what?",
  "ABCA1-mediated cholesterol efflux to nascent HDL", ["ApoB-48 translation", "CPT-I transport", "Bile-salt conjugation"],
  "ABCA1 deficiency prevents cells from transferring cholesterol to ApoA-I, causing Tangier disease.",
  "Recognize the defect in Tangier disease.", ["lipoprotein", "clinical"]);
add(18, "cholesterol and lipoprotein metabolism", "HDL apoprotein reservoir", 3,
  "Besides reverse cholesterol transport, what important service does HDL provide to nascent chylomicrons and VLDL?",
  "It supplies ApoC-II and ApoE", ["It replaces ApoB with hemoglobin", "It supplies glucose transporters", "It removes all phospholipids"],
  "HDL acts as a circulating apoprotein reservoir, donating ApoC-II for LPL activation and ApoE for remnant uptake.",
  "Explain HDL's role as an apoprotein reservoir.", ["lipoprotein", "HDL"]);

// Chapter 23: insulin, glucagon, and hypoglycemia.
add(23, "metabolic effects of insulin and glucagon", "Insulin synthesis", 3,
  "Which sequence correctly describes insulin biosynthesis?",
  "Preproinsulin is processed to proinsulin in the ER, then C-peptide is removed in secretory granules", ["Proinsulin is made in lysosomes and converted to glucagon", "C-peptide is added after insulin secretion", "Insulin is synthesized directly without a precursor"],
  "Signal-peptide removal produces proinsulin; granule proteases then release insulin and C-peptide in equimolar amounts.",
  "Order the major steps of insulin biosynthesis.", ["insulin"]);
add(23, "metabolic effects of insulin and glucagon", "C-peptide", 3,
  "Which measurement best distinguishes endogenous insulin secretion from injected insulin?",
  "Plasma C-peptide", ["Plasma glucose alone", "Hemoglobin concentration", "Serum cholesterol alone"],
  "Endogenous insulin and C-peptide are released together, whereas ordinary injected insulin contains no C-peptide.",
  "Use C-peptide to identify endogenous insulin production.", ["insulin", "C-peptide"]);
add(23, "metabolic effects of insulin and glucagon", "Glucose-stimulated secretion", 4,
  "What event directly links rising beta-cell ATP to membrane depolarization during glucose-stimulated insulin release?",
  "Closure of ATP-sensitive potassium channels", ["Opening of ATP-sensitive potassium channels", "Inhibition of all calcium channels", "Activation of hormone-sensitive lipase"],
  "Higher ATP closes KATP channels, depolarizing the beta cell and opening voltage-gated Ca2+ channels for exocytosis.",
  "Trace glucose sensing to insulin granule release.", ["insulin", "KATP"]);
add(23, "metabolic effects of insulin and glucagon", "Sulfonylureas", 3,
  "Sulfonylureas stimulate insulin secretion primarily by doing what in pancreatic beta cells?",
  "Closing ATP-sensitive potassium channels", ["Opening chloride channels", "Activating glucagon receptors", "Blocking insulin receptors"],
  "Binding the SUR1 component closes KATP channels and triggers depolarization, calcium entry, and insulin release.",
  "Explain sulfonylurea-stimulated insulin secretion.", ["insulin", "drug"]);
add(23, "metabolic effects of insulin and glucagon", "Insulin receptor", 3,
  "The insulin receptor belongs to which receptor class?",
  "Receptor tyrosine kinase", ["G-protein-coupled receptor", "Ligand-gated chloride channel", "Intracellular steroid receptor"],
  "Insulin binding activates intrinsic receptor tyrosine kinase and downstream IRS-PI3K-Akt signaling.",
  "Classify the insulin receptor.", ["insulin", "receptor"]);
add(23, "metabolic effects of insulin and glucagon", "GLUT4", 3,
  "Insulin acutely increases glucose uptake in skeletal muscle and adipose tissue by recruiting which transporter?",
  "GLUT4", ["GLUT2", "SGLT1", "GLUT5"],
  "Akt signaling moves GLUT4 vesicles to the plasma membrane in muscle and adipocytes.",
  "Match GLUT4 with insulin-responsive tissues.", ["insulin", "GLUT4"]);
add(23, "metabolic effects of insulin and glucagon", "Hepatic glucose transport", 3,
  "Why does insulin not need to recruit GLUT4 to hepatocytes?",
  "Hepatocytes use insulin-independent GLUT2 for glucose transport", ["Hepatocytes cannot take up glucose", "Liver uses only SGLT1", "Insulin never affects liver metabolism"],
  "Insulin controls hepatic enzyme activity and expression, but bidirectional glucose movement uses GLUT2.",
  "Distinguish hepatic GLUT2 from muscle/adipose GLUT4.", ["insulin", "GLUT2"]);
add(23, "metabolic effects of insulin and glucagon", "Insulin metabolic pattern", 3,
  "Which metabolic pattern is most consistent with insulin action after a meal?",
  "Increased glycogen, fatty-acid, triacylglycerol, and protein synthesis", ["Increased hepatic ketogenesis and proteolysis", "Increased adipose hormone-sensitive lipase", "Increased hepatic gluconeogenesis"],
  "Insulin promotes fuel storage and protein synthesis while suppressing hepatic glucose output, lipolysis, and ketogenesis.",
  "Summarize insulin's anabolic metabolic effects.", ["insulin"]);
add(23, "metabolic effects of insulin and glucagon", "Glucagon receptor", 3,
  "Glucagon signals in hepatocytes mainly through which pathway?",
  "Gs, adenylyl cyclase, cAMP, and protein kinase A", ["Receptor tyrosine kinase and Akt", "Nuclear vitamin-D receptor", "Ligand-gated sodium channel"],
  "The glucagon GPCR raises cAMP and activates PKA, favoring phosphorylation patterns of fasting.",
  "Trace glucagon's second-messenger pathway.", ["glucagon", "cAMP"]);
add(23, "metabolic effects of insulin and glucagon", "Skeletal muscle", 3,
  "Why does circulating glucagon have little direct effect on skeletal-muscle glycogen?",
  "Skeletal muscle lacks significant glucagon receptors", ["Muscle lacks glycogen", "Muscle cannot use cAMP", "Glucagon cannot circulate in blood"],
  "Muscle glycogenolysis responds mainly to epinephrine and contraction-associated signals rather than glucagon.",
  "Explain tissue specificity of glucagon action.", ["glucagon", "muscle"]);
add(23, "metabolic effects of insulin and glucagon", "Amino-acid meal", 4,
  "Why can an amino-acid-rich meal stimulate both insulin and glucagon secretion?",
  "Insulin supports amino-acid uptake while glucagon prevents excessive hypoglycemia", ["Both hormones always have identical actions", "Amino acids close all beta-cell channels", "Glucagon forces amino acids into fat"],
  "Insulin promotes protein synthesis, while glucagon maintains hepatic glucose output when little carbohydrate accompanies the meal.",
  "Explain the dual hormonal response to dietary protein.", ["insulin", "glucagon"]);
add(23, "metabolic effects of insulin and glucagon", "Counterregulation", 3,
  "Which hormones provide the most rapid defense against falling plasma glucose?",
  "Glucagon and epinephrine", ["Insulin and leptin", "Aldosterone and calcitonin", "Thyroxine and vitamin D"],
  "Glucagon and epinephrine rapidly increase hepatic glucose production; cortisol and growth hormone act more slowly.",
  "Identify major counterregulatory hormones.", ["hypoglycemia"]);
add(23, "metabolic effects of insulin and glucagon", "Adrenergic symptoms", 3,
  "Tremor, palpitations, anxiety, and sweating during hypoglycemia are primarily what type of symptoms?",
  "Autonomic or adrenergic warning symptoms", ["Neuroglycopenic symptoms only", "Signs of hypercalcemia", "Consequences of hyperketonemia only"],
  "Sympathoadrenal activation produces early warning symptoms, whereas confusion, seizures, and coma reflect brain glucose deprivation.",
  "Differentiate autonomic from neuroglycopenic hypoglycemia.", ["hypoglycemia"]);
add(23, "metabolic effects of insulin and glucagon", "Neuroglycopenia", 3,
  "Confusion, abnormal behavior, seizures, and coma during severe hypoglycemia reflect what?",
  "Insufficient glucose delivery to the brain", ["Excess hepatic glycogen synthesis", "Increased chylomicron formation", "Vitamin C excess"],
  "The brain normally depends heavily on circulating glucose, so severe deficiency impairs neuronal function.",
  "Recognize neuroglycopenic manifestations.", ["hypoglycemia"]);
add(23, "metabolic effects of insulin and glucagon", "Alcohol hypoglycemia", 4,
  "Why can heavy ethanol intake precipitate fasting hypoglycemia?",
  "High hepatic NADH inhibits gluconeogenesis from lactate and other substrates", ["Ethanol directly activates glycogen synthase forever", "Ethanol supplies excessive glucagon receptors", "High NADH accelerates pyruvate formation from lactate"],
  "Ethanol oxidation drives pyruvate to lactate and oxaloacetate to malate, removing gluconeogenic substrates.",
  "Explain ethanol-associated fasting hypoglycemia.", ["hypoglycemia", "ethanol"]);
add(23, "metabolic effects of insulin and glucagon", "Insulinoma pattern", 4,
  "During symptomatic hypoglycemia, which laboratory pattern supports an insulin-secreting tumor rather than injected insulin?",
  "High insulin with high C-peptide", ["High insulin with absent C-peptide", "Low insulin with low C-peptide", "Normal glucose with high ketones only"],
  "An insulinoma releases endogenous insulin and C-peptide together; exogenous insulin produces high insulin with suppressed C-peptide.",
  "Use insulin and C-peptide to distinguish causes of hypoglycemia.", ["hypoglycemia", "C-peptide"]);

// Chapter 24: the feed-fast cycle.
add(24, "feed-fast cycle", "Hormonal ratio", 2,
  "Which hormonal pattern characterizes the absorptive state after a carbohydrate-containing meal?",
  "High insulin-to-glucagon ratio", ["Low insulin-to-glucagon ratio", "Absence of both hormones", "High glucagon with no insulin response"],
  "A high insulin-to-glucagon ratio directs liver, muscle, and adipose tissue toward fuel use and storage.",
  "Identify the hormonal signal of the fed state.", ["fed-state"]);
add(24, "feed-fast cycle", "Hepatic glucose trapping", 3,
  "Which hepatic enzyme helps trap glucose after a carbohydrate-rich meal?",
  "Glucokinase", ["Glucose-6-phosphatase", "Hormone-sensitive lipase", "Fructose-1,6-bisphosphatase"],
  "Insulin induces glucokinase, which phosphorylates abundant portal glucose and supports glycogen synthesis and glycolysis.",
  "Explain hepatic glucose handling in the fed state.", ["fed-state", "liver"]);
add(24, "feed-fast cycle", "Fructose 2,6-bisphosphate", 4,
  "In fed liver, increased fructose 2,6-bisphosphate has what paired effect?",
  "Activation of PFK-1 and inhibition of fructose-1,6-bisphosphatase", ["Inhibition of both glycolysis and gluconeogenesis", "Activation of gluconeogenesis only", "Activation of hormone-sensitive lipase"],
  "Fructose 2,6-bisphosphate coordinates increased glycolysis with decreased gluconeogenesis.",
  "Explain reciprocal control by fructose 2,6-bisphosphate.", ["fed-state", "glycolysis"]);
add(24, "feed-fast cycle", "Fed liver", 3,
  "Which pathway combination is favored in liver during the absorptive state?",
  "Glycogen synthesis, glycolysis, pentose phosphate activity, and fatty-acid synthesis", ["Gluconeogenesis, ketogenesis, and glycogen breakdown", "Proteolysis and urea excretion only", "Hormone-sensitive lipolysis"],
  "Fed liver stores glucose, generates NADPH, and converts excess carbohydrate into fatty acids and TAG.",
  "Summarize fed-state hepatic metabolism.", ["fed-state", "liver"]);
add(24, "feed-fast cycle", "Fed adipose tissue", 3,
  "Which change most directly supports triacylglycerol storage in adipose tissue after a meal?",
  "Insulin-stimulated GLUT4 and adipose lipoprotein lipase", ["Activation of hormone-sensitive lipase", "Inhibition of glucose uptake", "Suppression of capillary LPL"],
  "Glucose supplies glycerol-3-phosphate while LPL supplies fatty acids from chylomicrons and VLDL.",
  "Integrate fed-state adipose glucose and lipid handling.", ["fed-state", "adipose"]);
add(24, "feed-fast cycle", "Fed skeletal muscle", 3,
  "What are major insulin-stimulated fates of glucose and amino acids in resting skeletal muscle after a meal?",
  "Glycogen synthesis and protein synthesis", ["Ketone synthesis and urea formation", "Glucose export through glucose-6-phosphatase", "Chylomicron assembly"],
  "Insulin recruits GLUT4, activates glycogen synthesis, and increases amino-acid uptake and protein synthesis.",
  "Describe fed-state skeletal-muscle metabolism.", ["fed-state", "muscle"]);
add(24, "feed-fast cycle", "Brain fuel", 3,
  "Which fuel does the brain normally use in the fed state?",
  "Glucose", ["Long-chain fatty acids", "Chylomicron triacylglycerol", "Amino acids as its exclusive fuel"],
  "Glucose crosses the blood-brain barrier and is the normal dominant brain fuel; long-chain fatty acids do not supply substantial brain energy.",
  "Identify normal brain fuel use.", ["brain"]);
add(24, "feed-fast cycle", "Red-cell fuel", 3,
  "Which pathway supplies ATP to mature erythrocytes in both fed and fasting states?",
  "Anaerobic glycolysis", ["Beta oxidation", "Ketone-body oxidation", "Oxidative phosphorylation"],
  "Mature red cells lack mitochondria and therefore convert glucose to lactate for ATP.",
  "Explain obligatory erythrocyte glucose use.", ["RBC"]);
add(24, "feed-fast cycle", "Early fasting", 3,
  "During the first several hours after a meal, what is the main immediate source maintaining blood glucose?",
  "Hepatic glycogenolysis", ["Adipose ketogenesis", "Muscle glucose export", "Dietary chylomicron breakdown into glucose"],
  "Liver glycogen provides rapid glucose while gluconeogenesis progressively increases.",
  "Identify the early-fasting glucose source.", ["fasting"]);
add(24, "feed-fast cycle", "Glycogen depletion", 3,
  "After roughly one day of fasting, maintenance of blood glucose increasingly depends on what?",
  "Gluconeogenesis", ["Continued unlimited hepatic glycogenolysis", "Ketones converted directly to glucose", "Fatty acids converted to glucose in red cells"],
  "Liver glycogen is limited, so gluconeogenesis from lactate, glycerol, and glucogenic amino acids becomes dominant.",
  "Describe the transition from glycogenolysis to gluconeogenesis.", ["fasting"]);
add(24, "feed-fast cycle", "Gluconeogenic substrates", 3,
  "Which set contains major gluconeogenic substrates during fasting?",
  "Lactate, glycerol, and alanine", ["Even-chain fatty acids, cholesterol, and ketones", "Leucine, lysine, and acetyl-CoA only", "Bile salts, heme, and creatinine"],
  "Lactate enters the Cori cycle, alanine carries muscle carbon and nitrogen, and glycerol comes from adipose TAG.",
  "Identify major gluconeogenic precursors.", ["fasting", "gluconeogenesis"]);
add(24, "feed-fast cycle", "Even-chain fatty acids", 4,
  "Why do even-chain fatty acids fail to produce net glucose in humans?",
  "They yield acetyl-CoA, whose carbons are lost in the TCA cycle without net oxaloacetate production", ["They never enter mitochondria", "They contain no carbon", "They directly inhibit every gluconeogenic enzyme"],
  "Pyruvate dehydrogenase is irreversible and acetyl-CoA cannot generate net gluconeogenic carbon.",
  "Explain why even-chain fatty acids are not glucogenic.", ["fasting", "gluconeogenesis"]);
add(24, "feed-fast cycle", "Adipose fasting response", 3,
  "What products are released when adipose triacylglycerol is mobilized during fasting?",
  "Free fatty acids and glycerol", ["Glucose and glycogen", "Ketone bodies made inside adipocytes", "Chylomicrons"],
  "Fatty acids travel on albumin for oxidation, while glycerol goes to liver for gluconeogenesis.",
  "Trace products of fasting adipose lipolysis.", ["fasting", "adipose"]);
add(24, "feed-fast cycle", "Hepatic beta oxidation", 4,
  "How does hepatic fatty-acid oxidation support gluconeogenesis during fasting?",
  "It supplies ATP and acetyl-CoA, which activates pyruvate carboxylase", ["It converts every acetyl-CoA directly to glucose", "It consumes all hepatic ATP", "It blocks glycerol use"],
  "Beta oxidation provides the energy and allosteric signal needed to divert pyruvate toward oxaloacetate and glucose.",
  "Connect fatty-acid oxidation with gluconeogenesis.", ["fasting", "liver"]);
add(24, "feed-fast cycle", "Ketone adaptation", 3,
  "What major adaptation reduces muscle-protein breakdown during prolonged fasting?",
  "The brain increases its use of ketone bodies", ["The brain switches entirely to long-chain fatty acids", "Red cells begin beta oxidation", "The liver stops fatty-acid oxidation"],
  "Brain ketone use lowers its glucose requirement, reducing amino-acid demand for gluconeogenesis.",
  "Explain protein sparing during prolonged fasting.", ["prolonged-fasting", "ketone"]);
add(24, "feed-fast cycle", "Liver ketone export", 3,
  "Which tissues can oxidize liver-derived ketone bodies during fasting?",
  "Extrahepatic tissues with mitochondria, including muscle and eventually brain", ["Liver itself only", "Mature red blood cells", "Adipose lipid droplets only"],
  "Extrahepatic mitochondria contain thiophorase; liver lacks it and red cells lack mitochondria.",
  "Identify tissues capable of ketone utilization.", ["fasting", "ketone"]);
add(24, "feed-fast cycle", "Cori cycle", 3,
  "What carbon compound is transported from anaerobic muscle or red cells to liver in the Cori cycle?",
  "Lactate", ["Acetyl-CoA", "Cholesterol", "Citrate only"],
  "Liver converts lactate to glucose at an energy cost, and glucose can return to peripheral tissue.",
  "Describe carbon flow in the Cori cycle.", ["fasting", "Cori-cycle"]);
add(24, "feed-fast cycle", "Glucose-alanine cycle", 3,
  "What additional function distinguishes the glucose-alanine cycle from the Cori cycle?",
  "Alanine transports amino nitrogen from muscle to liver", ["It transports dietary cholesterol", "It makes ketones in red cells", "It bypasses the liver"],
  "Muscle transfers amino groups to pyruvate to form alanine; liver uses its carbon for glucose and nitrogen for urea.",
  "Explain the dual carbon-and-nitrogen role of the alanine cycle.", ["fasting", "alanine-cycle"]);
add(24, "feed-fast cycle", "CPT-I in fasting", 4,
  "Why is hepatic CPT-I active during fasting?",
  "Low malonyl-CoA removes inhibition of mitochondrial fatty-acid entry", ["High insulin activates acetyl-CoA carboxylase", "High malonyl-CoA activates CPT-I", "Glucose directly opens the carnitine shuttle"],
  "Glucagon-mediated ACC inhibition lowers malonyl-CoA, permitting beta oxidation and ketogenesis.",
  "Integrate hormonal control of fatty-acid entry during fasting.", ["fasting", "CPT-I"]);

// Chapter 25: diabetes mellitus.
add(25, "diabetes mellitus", "Type 1 mechanism", 3,
  "What is the fundamental defect in type 1 diabetes mellitus?",
  "Autoimmune destruction of pancreatic beta cells causing absolute insulin deficiency", ["Primary insulin resistance with high insulin forever", "Excessive beta-cell mass", "Defective glucagon receptors only"],
  "Loss of beta-cell function produces low insulin and C-peptide and a strong tendency toward ketosis.",
  "Define the pathogenesis of type 1 diabetes.", ["diabetes"]);
add(25, "diabetes mellitus", "Type 2 mechanism", 3,
  "Which pattern best describes early type 2 diabetes mellitus?",
  "Insulin resistance with compensatory hyperinsulinemia", ["Absolute insulin deficiency from birth in every case", "Absent glucagon secretion", "Normal insulin sensitivity with isolated ketogenesis"],
  "Peripheral and hepatic insulin resistance initially drives increased beta-cell insulin secretion; beta-cell failure progresses later.",
  "Describe the early pathophysiology of type 2 diabetes.", ["diabetes"]);
add(25, "diabetes mellitus", "Fasting diagnosis", 3,
  "A repeated fasting plasma glucose at or above which value meets a standard diagnostic threshold for diabetes?",
  "126 mg/dL", ["70 mg/dL", "90 mg/dL", "110 mg/dL"],
  "A fasting plasma glucose of at least 126 mg/dL on appropriate confirmatory testing is diagnostic.",
  "Recall the fasting glucose threshold for diabetes.", ["diabetes", "diagnosis"]);
add(25, "diabetes mellitus", "HbA1c diagnosis", 3,
  "Which HbA1c value meets a standard diagnostic threshold for diabetes?",
  "6.5% or greater", ["4.0% or greater", "5.0% exactly", "Less than 5.7%"],
  "HbA1c of at least 6.5% using a standardized assay is diagnostic when appropriately confirmed.",
  "Recall the HbA1c diagnostic threshold.", ["diabetes", "diagnosis"]);
add(25, "diabetes mellitus", "HbA1c meaning", 3,
  "HbA1c most closely reflects average glycemia over approximately what interval?",
  "The preceding 2 to 3 months, weighted toward recent weeks", ["The preceding 10 minutes", "Exactly one year", "Only the current fasting hour"],
  "Nonenzymatic glycation accumulates over the erythrocyte lifespan, making HbA1c a longer-term glycemic marker.",
  "Interpret HbA1c as an integrated glycemic measure.", ["diabetes", "HbA1c"]);
add(25, "diabetes mellitus", "Polyuria", 3,
  "Why does marked hyperglycemia cause polyuria?",
  "Filtered glucose exceeds reabsorptive capacity and produces osmotic diuresis", ["Insulin directly blocks all renal water channels", "Glucose prevents filtration", "Ketones are converted to ADH"],
  "Glucosuria retains water in the tubular lumen and increases urinary water and electrolyte loss.",
  "Explain diabetic osmotic diuresis.", ["diabetes"]);
add(25, "diabetes mellitus", "DKA", 4,
  "Which metabolic change is central to diabetic ketoacidosis in severe insulin deficiency?",
  "Unrestrained adipose lipolysis and hepatic ketone-body production", ["Suppressed fatty-acid delivery to liver", "Excess insulin activation of ACC", "Complete inhibition of glucagon"],
  "Low insulin and high counterregulatory hormones activate HSL, beta oxidation, and ketogenesis, producing high-anion-gap acidosis.",
  "Explain the biochemical basis of diabetic ketoacidosis.", ["diabetes", "DKA"]);
add(25, "diabetes mellitus", "HHS", 4,
  "Why is substantial ketoacidosis often absent in hyperosmolar hyperglycemic state?",
  "Residual insulin is usually sufficient to suppress major lipolysis and ketogenesis", ["Type 2 patients cannot make ketone bodies", "Glucose neutralizes all acids", "HHS occurs only after eating"],
  "Profound hyperglycemia and dehydration can coexist with enough insulin action to limit ketone production.",
  "Differentiate HHS from DKA.", ["diabetes", "HHS"]);
add(25, "diabetes mellitus", "Untreated type 1 metabolism", 3,
  "Which hepatic pattern is expected in untreated type 1 diabetes?",
  "Increased gluconeogenesis, fatty-acid oxidation, and ketogenesis", ["Increased glycogenesis and lipogenesis", "Suppressed glucose output", "Increased malonyl-CoA blocking CPT-I"],
  "The low-insulin/high-glucagon state resembles uncontrolled fasting despite extracellular glucose abundance.",
  "Integrate hepatic metabolism in untreated type 1 diabetes.", ["diabetes"]);
add(25, "diabetes mellitus", "Metformin", 3,
  "What is the major glucose-lowering action of metformin?",
  "Reduction of hepatic gluconeogenesis with improved insulin sensitivity", ["Direct stimulation of insulin release regardless of glucose", "Activation of intestinal glucose absorption", "Inhibition of renal glucose excretion"],
  "Metformin lowers hepatic glucose output and usually does not cause hypoglycemia when used alone.",
  "Explain metformin's principal metabolic effect.", ["diabetes", "drug"]);
add(25, "diabetes mellitus", "Microvascular complications", 3,
  "Which group contains classic microvascular complications of diabetes?",
  "Retinopathy, nephropathy, and neuropathy", ["Aortic dissection, appendicitis, and gallstones", "Asthma, eczema, and urticaria", "Scurvy, rickets, and pellagra"],
  "Chronic hyperglycemia damages small vessels and tissue through glycation, oxidative stress, and related mechanisms.",
  "Recognize diabetic microvascular complications.", ["diabetes", "complications"]);
add(25, "diabetes mellitus", "Advanced glycation", 4,
  "How do advanced glycation end products contribute to chronic diabetic injury?",
  "They cross-link proteins and activate inflammatory receptors", ["They enzymatically remove glucose from blood", "They synthesize insulin", "They prevent basement-membrane thickening"],
  "Nonenzymatic glycation alters long-lived extracellular proteins and signaling, contributing to vascular stiffness and tissue damage.",
  "Explain AGE-mediated diabetic complications.", ["diabetes", "complications"]);
add(25, "diabetes mellitus", "Sorbitol pathway", 4,
  "In which tissues can hyperglycemia cause sorbitol accumulation because sorbitol dehydrogenase activity is limited?",
  "Lens, retina, Schwann cells, and kidney", ["Liver only", "Red blood cells only", "Adipose tissue only"],
  "Aldose reductase consumes NADPH to form sorbitol, contributing to osmotic and oxidative injury in susceptible tissues.",
  "Explain the polyol pathway in diabetic injury.", ["diabetes", "sorbitol"]);
add(25, "diabetes mellitus", "C-peptide in type 1", 3,
  "Which laboratory finding is most consistent with established type 1 diabetes before insulin injection?",
  "Low insulin and low C-peptide", ["High insulin and high C-peptide", "High C-peptide with absent glucose", "Normal beta-cell reserve in every case"],
  "Autoimmune beta-cell destruction reduces secretion of both insulin and its coproduct C-peptide.",
  "Use C-peptide to assess beta-cell reserve.", ["diabetes", "C-peptide"]);

// Chapter 26: obesity.
add(26, "obesity", "BMI calculation", 2,
  "How is body mass index calculated?",
  "Weight in kilograms divided by height in meters squared", ["Height divided by weight", "Waist circumference divided by age", "Weight in pounds multiplied by height"],
  "BMI is kg/m2 and is a screening measure rather than a direct measurement of body fat.",
  "Calculate and interpret body mass index.", ["BMI"]);
add(26, "obesity", "Obesity threshold", 2,
  "In adults, a BMI of 30 kg/m2 or greater is conventionally classified as what?",
  "Obesity", ["Underweight", "Normal weight", "Overweight but never obesity"],
  "BMI 25.0-29.9 is overweight and 30 or greater is obesity, although risk also depends on fat distribution and context.",
  "Recall the conventional adult BMI threshold for obesity.", ["BMI"]);
add(26, "obesity", "Visceral fat", 3,
  "Why is upper-body visceral obesity metabolically more hazardous than predominantly gluteofemoral fat?",
  "Visceral fat has high lipolytic and inflammatory activity and drains toward the liver", ["Visceral fat contains no triglyceride", "Gluteofemoral fat always causes diabetes", "Only visceral fat stores vitamins"],
  "Visceral fatty-acid flux and cytokines promote hepatic insulin resistance, dyslipidemia, and cardiovascular risk.",
  "Relate fat distribution to metabolic risk.", ["visceral-fat"]);
add(26, "obesity", "Leptin source", 3,
  "What does circulating leptin normally communicate to the hypothalamus?",
  "The size of long-term adipose energy stores", ["Immediate gastric acidity", "Blood oxygen content", "Renal potassium filtration"],
  "Adipocytes secrete leptin in proportion to fat mass, suppressing appetite and supporting energy expenditure.",
  "Explain leptin as a long-term adiposity signal.", ["leptin"]);
add(26, "obesity", "Common obesity leptin pattern", 3,
  "What leptin pattern is typical of common obesity?",
  "Elevated leptin with central leptin resistance", ["Absent leptin in nearly every patient", "Low leptin caused by no adipose tissue", "Leptin unrelated to fat mass"],
  "Most obese individuals make abundant leptin but have reduced responsiveness; congenital leptin deficiency is rare.",
  "Distinguish leptin resistance from leptin deficiency.", ["leptin"]);
add(26, "obesity", "Adiponectin", 3,
  "How does adiponectin generally change in obesity?",
  "It decreases, contributing to reduced insulin sensitivity", ["It always increases dramatically", "It becomes insulin", "It blocks fatty-acid oxidation"],
  "Adiponectin promotes fatty-acid oxidation and insulin sensitivity and is paradoxically lower with greater adiposity.",
  "Relate adiponectin to obesity and insulin sensitivity.", ["adiponectin"]);
add(26, "obesity", "Ghrelin", 3,
  "Which gastrointestinal hormone rises before meals and stimulates appetite?",
  "Ghrelin", ["Leptin", "Insulin", "Adiponectin"],
  "Ghrelin is secreted mainly by the stomach and activates orexigenic hypothalamic pathways.",
  "Identify ghrelin as a short-term hunger signal.", ["appetite"]);
add(26, "obesity", "Hypothalamic pathways", 4,
  "Which hypothalamic neuronal pair is primarily orexigenic?",
  "NPY and AgRP neurons", ["POMC and CART neurons", "Dopamine and rhodopsin neurons", "Motor neurons and Schwann cells"],
  "NPY/AgRP activity promotes feeding, whereas POMC/CART melanocortin signaling reduces food intake.",
  "Contrast orexigenic and anorexigenic hypothalamic pathways.", ["appetite"]);
add(26, "obesity", "Metabolic syndrome", 3,
  "Which cluster best represents metabolic syndrome?",
  "Central obesity, elevated triglycerides, low HDL, hypertension, and impaired glucose regulation", ["Low blood pressure, low triglycerides, and hypoglycemia", "Isolated vitamin C deficiency", "Anemia with thrombocytopenia only"],
  "This insulin-resistance-associated cluster identifies increased risk of type 2 diabetes and cardiovascular disease.",
  "Recognize the components of metabolic syndrome.", ["metabolic-syndrome"]);
add(26, "obesity", "Adipose inflammation", 4,
  "How can expanded adipose tissue worsen systemic insulin resistance?",
  "It recruits macrophages and releases inflammatory cytokines and excess fatty acids", ["It removes all circulating fatty acids", "It secretes only adiponectin", "It converts insulin to glucagon"],
  "Inflammatory signaling and ectopic lipid interfere with insulin pathways in liver and muscle.",
  "Explain obesity-associated insulin resistance.", ["inflammation"]);
add(26, "obesity", "Weight-loss adaptation", 3,
  "Why can maintaining weight loss become metabolically difficult?",
  "Energy expenditure and satiety signals adapt downward after weight loss", ["The body loses the ability to oxidize glucose permanently", "Leptin becomes infinitely high", "Basal metabolic rate always doubles"],
  "Reduced mass, lower leptin, and adaptive thermogenesis can lower energy requirements and increase hunger.",
  "Explain adaptive responses after weight loss.", ["weight-loss"]);
add(26, "obesity", "Bariatric effects", 3,
  "Why can metabolic improvement occur rapidly after some bariatric procedures before maximal weight loss?",
  "Altered gut hormones and nutrient signaling can improve insulin action", ["All adipocytes are immediately removed", "The pancreas stops making glucagon permanently", "No nutrients are ever absorbed"],
  "Changes in GLP-1, bile-acid signaling, intake, and hepatic metabolism contribute to early glycemic improvement.",
  "Recognize metabolic effects of bariatric surgery.", ["weight-loss"]);

// Chapter 27: nutrition.
add(27, "nutrition", "EAR and RDA", 3,
  "Which statement correctly relates the Estimated Average Requirement and Recommended Dietary Allowance?",
  "EAR meets about half a group's requirement; RDA covers nearly all healthy individuals", ["They are identical values", "RDA is always lower than EAR", "EAR is a toxic upper limit"],
  "The RDA is generally derived from the EAR with an allowance for population variability.",
  "Differentiate EAR from RDA.", ["DRI"]);
add(27, "nutrition", "Adequate intake", 3,
  "When is an Adequate Intake value used?",
  "When evidence is insufficient to establish an EAR and RDA", ["Only when a nutrient is toxic", "Only for energy intake", "Whenever everyone has the same requirement"],
  "AI is an observed or experimentally derived intake judged adequate when data cannot support an RDA.",
  "Explain the purpose of Adequate Intake.", ["DRI"]);
add(27, "nutrition", "Upper limit", 3,
  "What does the Tolerable Upper Intake Level represent?",
  "The highest usual intake unlikely to pose adverse-effect risk to most people", ["The minimum intake needed to prevent death", "The average energy requirement", "A recommended daily target for everyone"],
  "Risk of adverse effects increases above the UL; it is not a recommended intake goal.",
  "Interpret the Tolerable Upper Intake Level.", ["DRI"]);
add(27, "nutrition", "Energy density", 2,
  "How much energy is supplied by one gram of fat?",
  "9 kcal", ["4 kcal", "7 kcal", "2 kcal"],
  "Fat supplies about 9 kcal/g, carbohydrate and protein about 4 kcal/g, and alcohol about 7 kcal/g.",
  "Recall macronutrient energy densities.", ["energy"]);
add(27, "nutrition", "Alcohol energy", 2,
  "How much energy is supplied by one gram of ethanol?",
  "7 kcal", ["4 kcal", "9 kcal", "0 kcal"],
  "Alcohol provides energy but no essential nutrient function and supplies approximately 7 kcal/g.",
  "Recall the energy density of alcohol.", ["energy"]);
add(27, "nutrition", "Basal expenditure", 3,
  "In a sedentary adult, which component usually accounts for the largest share of total daily energy expenditure?",
  "Basal or resting energy expenditure", ["Thermic effect of food only", "Voluntary exercise in every person", "Urinary glucose loss"],
  "Maintaining ion gradients, organ function, and body temperature consumes the largest baseline share.",
  "Identify major components of energy expenditure.", ["energy"]);
add(27, "nutrition", "Thermic effect", 3,
  "Which macronutrient generally has the highest thermic effect of feeding?",
  "Protein", ["Fat", "Alcohol always", "Cholesterol"],
  "Protein digestion, amino-acid processing, and urea synthesis require a relatively large fraction of its energy content.",
  "Compare the thermic effects of macronutrients.", ["energy"]);
add(27, "nutrition", "AMDR carbohydrate", 3,
  "What is the adult Acceptable Macronutrient Distribution Range for carbohydrate?",
  "Approximately 45-65% of total energy", ["0-5%", "10-20%", "80-100%"],
  "The standard adult AMDR assigns roughly 45-65% of energy to carbohydrate.",
  "Recall the adult carbohydrate AMDR.", ["AMDR"]);
add(27, "nutrition", "AMDR fat", 3,
  "What is the adult Acceptable Macronutrient Distribution Range for fat?",
  "Approximately 20-35% of total energy", ["0-5%", "45-65%", "70-90%"],
  "The standard adult AMDR assigns roughly 20-35% of energy to fat.",
  "Recall the adult fat AMDR.", ["AMDR"]);
add(27, "nutrition", "AMDR protein", 3,
  "What is the adult Acceptable Macronutrient Distribution Range for protein?",
  "Approximately 10-35% of total energy", ["0-2%", "45-65%", "70-90%"],
  "The standard adult AMDR assigns roughly 10-35% of energy to protein.",
  "Recall the adult protein AMDR.", ["AMDR"]);
add(27, "nutrition", "Trans fat", 3,
  "What is a characteristic effect of dietary trans fatty acids on plasma lipoproteins?",
  "They raise LDL and can lower HDL", ["They lower LDL and raise HDL reliably", "They contain no energy", "They are essential fatty acids"],
  "Trans fats create an unfavorable lipoprotein profile and increase cardiovascular risk.",
  "Explain why trans fats are particularly atherogenic.", ["dietary-fat"]);
add(27, "nutrition", "Essential fatty acids", 2,
  "Which pair contains the two parent essential fatty acids?",
  "Linoleic acid and alpha-linolenic acid", ["Palmitic acid and stearic acid", "Oleic acid and palmitoleic acid", "Arachidic acid and cholesterol"],
  "Linoleic omega-6 and alpha-linolenic omega-3 acids cannot be synthesized because humans lack the required desaturases.",
  "Identify the essential parent fatty acids.", ["dietary-fat"]);
add(27, "nutrition", "Fiber", 3,
  "Which is a major benefit of soluble dietary fiber?",
  "It can reduce cholesterol absorption and slow postprandial glucose rise", ["It supplies 9 kcal/g as human-digestible fat", "It eliminates the need for water", "It converts all starch into ketones"],
  "Viscous soluble fiber binds bile acids and slows nutrient absorption; insoluble fiber increases stool bulk.",
  "Differentiate major dietary-fiber effects.", ["dietary-carbohydrate"]);
add(27, "nutrition", "Glycemic load", 3,
  "How does glycemic load differ from glycemic index?",
  "It incorporates both carbohydrate quality and the amount eaten", ["It measures protein quality", "It ignores serving size", "It is identical to BMI"],
  "Glycemic load approximates glycemic index multiplied by available carbohydrate in a serving.",
  "Differentiate glycemic load from glycemic index.", ["dietary-carbohydrate"]);
add(27, "nutrition", "Nitrogen balance", 3,
  "Which state is most likely to produce positive nitrogen balance?",
  "Growth, pregnancy, or recovery with net protein synthesis", ["Severe burns", "Starvation", "Untreated wasting illness"],
  "Positive nitrogen balance means nitrogen intake exceeds loss, reflecting net tissue protein gain.",
  "Interpret positive and negative nitrogen balance.", ["protein"]);
add(27, "nutrition", "Protein quality", 3,
  "What is a limiting amino acid?",
  "The essential amino acid present in the lowest amount relative to need", ["Any nonessential amino acid", "The most abundant amino acid in a food", "An amino acid that cannot enter protein"],
  "The limiting essential amino acid constrains how effectively dietary protein supports new protein synthesis.",
  "Explain limiting amino acids and protein quality.", ["protein"]);
add(27, "nutrition", "Kwashiorkor", 4,
  "A child has edema, fatty liver, skin and hair changes, and low serum albumin. Which diagnosis is most likely?",
  "Kwashiorkor", ["Marasmus", "Scurvy", "Isolated obesity"],
  "Severe protein deficiency with relatively greater calorie availability causes hypoalbuminemia, edema, and impaired hepatic lipoprotein synthesis.",
  "Recognize kwashiorkor.", ["protein-energy-malnutrition"]);
add(27, "nutrition", "Marasmus", 4,
  "A child has severe wasting of muscle and subcutaneous fat without prominent edema. Which diagnosis is most likely?",
  "Marasmus", ["Kwashiorkor", "Pellagra", "Rickets"],
  "Severe overall energy deficiency produces marked wasting; albumin is relatively better preserved than in kwashiorkor.",
  "Differentiate marasmus from kwashiorkor.", ["protein-energy-malnutrition"]);

// Chapter 33: biotechnology and molecular methods.
add(33, "biotechnology and molecular techniques", "Restriction endonucleases", 3,
  "What type of DNA sequence is commonly recognized by a restriction endonuclease?",
  "A short palindromic sequence", ["A random amino-acid sequence", "Only a telomere repeat", "An RNA poly-A tail"],
  "Type II restriction enzymes recognize specific short DNA sequences that are often palindromic and cut at reproducible sites.",
  "Explain sequence-specific restriction digestion.", ["restriction-enzyme"]);
add(33, "biotechnology and molecular techniques", "Sticky ends", 3,
  "Why are staggered restriction-enzyme cuts useful in DNA cloning?",
  "They produce complementary single-stranded overhangs that can base-pair", ["They destroy all vector DNA", "They prevent ligase action", "They translate DNA into protein"],
  "Compatible sticky ends align insert and vector, after which DNA ligase seals the phosphodiester backbone.",
  "Explain how cohesive ends facilitate cloning.", ["restriction-enzyme", "cloning"]);
add(33, "biotechnology and molecular techniques", "Cloning vector", 3,
  "Which features are essential in a basic plasmid cloning vector?",
  "An origin of replication, a selectable marker, and a cloning site", ["A ribosome and a mitochondrion", "Only a poly-A tail", "A complete human chromosome"],
  "The origin permits propagation, the marker identifies transformed cells, and the cloning site accepts inserted DNA.",
  "Identify the functional components of a plasmid vector.", ["cloning"]);
add(33, "biotechnology and molecular techniques", "cDNA", 3,
  "Why is complementary DNA made from mature mRNA useful for expressing a human protein in bacteria?",
  "It lacks introns that bacteria cannot remove", ["It contains extra introns", "It cannot be replicated", "It is made of amino acids"],
  "Reverse transcriptase copies processed mRNA, producing a coding sequence without eukaryotic introns.",
  "Explain why cDNA is used for bacterial expression.", ["cDNA", "reverse-transcriptase"]);
add(33, "biotechnology and molecular techniques", "Hybridization probe", 3,
  "What property allows a labeled nucleic-acid probe to detect a target sequence?",
  "Complementary base pairing", ["Peptide-bond formation", "Lipid solubility", "ATP synthase rotation"],
  "Under controlled stringency, a probe hybridizes to a complementary DNA or RNA sequence and its label reveals the target.",
  "Explain nucleic-acid probe specificity.", ["probe"]);
add(33, "biotechnology and molecular techniques", "PCR order", 3,
  "What is the correct order of the three repeating steps in a PCR cycle?",
  "Denaturation, primer annealing, extension", ["Extension, translation, denaturation", "Annealing, ligation, transcription", "Replication, meiosis, translation"],
  "Heat separates strands, cooling permits primer binding, and thermostable polymerase extends from each primer.",
  "Order the steps of polymerase chain reaction.", ["PCR"]);
add(33, "biotechnology and molecular techniques", "PCR primers", 4,
  "What determines the boundaries of the DNA segment amplified by PCR?",
  "The positions and orientations of the two primers", ["The color of the reaction tube", "The number of ribosomes", "The sequence of the protein product only"],
  "Primers bind opposite strands with their 3-prime ends directed toward the target, defining the amplified interval.",
  "Explain how primers define a PCR amplicon.", ["PCR"]);
add(33, "biotechnology and molecular techniques", "Taq polymerase", 3,
  "Why can Taq polymerase function through repeated PCR cycles?",
  "It is thermostable", ["It is an RNA molecule", "It has no need for primers", "It creates restriction sites automatically"],
  "Taq survives repeated high-temperature denaturation, although ordinary Taq has lower proofreading fidelity than some alternatives.",
  "State the useful property and limitation of Taq polymerase.", ["PCR"]);
add(33, "biotechnology and molecular techniques", "RT-PCR", 3,
  "What additional first step is needed when PCR is used to analyze an RNA transcript?",
  "Reverse transcription of RNA into cDNA", ["Translation into protein", "Conversion of RNA to lipid", "Removal of every primer"],
  "Reverse transcriptase creates a DNA template that can then be amplified by PCR.",
  "Explain reverse-transcription PCR.", ["PCR", "RNA"]);
add(33, "biotechnology and molecular techniques", "Southern blot", 2,
  "A Southern blot detects which macromolecule?",
  "DNA", ["RNA", "Protein", "Triacylglycerol"],
  "Southern blotting separates DNA fragments and detects a sequence with a labeled nucleic-acid probe.",
  "Match Southern blotting with DNA.", ["blot"]);
add(33, "biotechnology and molecular techniques", "Northern blot", 2,
  "A Northern blot is primarily used to detect what?",
  "RNA", ["DNA", "Protein", "Cholesterol"],
  "Northern analysis separates RNA and probes for specific transcripts, providing information about RNA size and abundance.",
  "Match Northern blotting with RNA.", ["blot"]);
add(33, "biotechnology and molecular techniques", "Western blot", 2,
  "A Western blot detects a specific target using antibodies. What is the target?",
  "Protein", ["DNA", "RNA", "Glycogen"],
  "Proteins are separated by electrophoresis, transferred to a membrane, and detected with target-specific antibodies.",
  "Match Western blotting with protein.", ["blot"]);
add(33, "biotechnology and molecular techniques", "RFLP", 4,
  "A single-nucleotide change abolishes a restriction site. What analysis can reveal the resulting difference in fragment length?",
  "Restriction fragment length polymorphism analysis", ["Karyotyping only", "Gram staining", "Flame photometry"],
  "Loss or creation of a restriction site changes the fragment pattern detected after digestion and hybridization.",
  "Explain the basis of RFLP analysis.", ["RFLP"]);
add(33, "biotechnology and molecular techniques", "Sanger sequencing", 4,
  "How do dideoxynucleotides terminate DNA synthesis in Sanger sequencing?",
  "They lack the 3-prime hydroxyl required for the next phosphodiester bond", ["They remove the template strand", "They inhibit all base pairing", "They contain ribose instead of deoxyribose only"],
  "Random incorporation of labeled ddNTPs creates terminated fragments whose lengths reveal the DNA sequence.",
  "Explain chain termination in Sanger sequencing.", ["sequencing"]);
add(33, "biotechnology and molecular techniques", "Gene-expression array", 4,
  "What does a gene-expression microarray compare?",
  "Hybridization of labeled cDNA populations to many immobilized gene probes", ["Protein folding by microscopy", "Lipid digestion in intestine", "Chromosome number without sequence probes"],
  "Relative cDNA signal at thousands of probes estimates relative transcript abundance between samples.",
  "Explain the principle of expression microarrays.", ["microarray"]);
add(33, "biotechnology and molecular techniques", "Allele-specific detection", 4,
  "Why can an allele-specific oligonucleotide distinguish two sequences differing by one nucleotide?",
  "Stringent hybridization destabilizes a mismatched probe-target duplex", ["Every mismatch strengthens base pairing", "The probe binds protein rather than DNA", "It uses no complementary sequence"],
  "Carefully chosen temperature and salt conditions permit stable binding to the perfect match but not the single-base mismatch.",
  "Explain allele-specific oligonucleotide testing.", ["probe", "mutation"]);

// Practical-derived reinforcement.
addLab("Spectrophotometry", "Beer-Lambert law", 3,
  "Within the linear range, doubling the concentration of an absorbing analyte while path length is unchanged should do what to absorbance?",
  "Approximately double it", ["Halve it", "Leave it unchanged", "Make it negative"],
  "Beer-Lambert law states A = epsilon times path length times concentration.",
  "Apply the Beer-Lambert relationship.", ["spectrophotometry"]);
addLab("Spectrophotometry", "Blank", 3,
  "What should a spectrophotometer blank contain?",
  "Everything in the assay except the analyte being measured", ["Only the analyte at maximum concentration", "A different colored product", "Distilled water regardless of assay composition"],
  "The blank corrects absorbance caused by solvent, reagents, and cuvette so the remaining signal represents analyte.",
  "Explain the purpose and composition of an assay blank.", ["spectrophotometry"]);
addLab("Chromatography", "Rf value", 3,
  "How is the retention factor in planar chromatography calculated?",
  "Distance traveled by solute divided by distance traveled by solvent front", ["Solvent distance divided by solute distance", "Absorbance divided by concentration", "Sample mass divided by time"],
  "Rf is dimensionless and lies between zero and one when measured from the same origin.",
  "Calculate and interpret an Rf value.", ["chromatography"]);
addLab("DNA extraction", "Alcohol precipitation", 3,
  "Why is cold ethanol or isopropanol added near the end of a DNA extraction?",
  "To reduce DNA solubility and precipitate it", ["To hydrolyze DNA completely", "To translate DNA", "To dissolve membrane lipids more effectively than detergent"],
  "Salt neutralizes phosphate charges and cold alcohol lowers dielectric support, allowing DNA strands to aggregate.",
  "Explain alcohol precipitation of DNA.", ["DNA-extraction"]);
addLab("Flame photometry", "Emission principle", 3,
  "What physical signal is measured by flame photometry?",
  "Element-specific light emitted by excited atoms returning to lower energy states", ["DNA fluorescence after PCR", "Protein absorbance at every wavelength", "Heat released by neutralization only"],
  "The flame excites atoms such as sodium or potassium, and emitted intensity is compared with standards.",
  "Explain the analytical principle of flame photometry.", ["flame-photometry"]);
addLab("Practical enzyme assays", "Initial velocity", 3,
  "Why are enzyme assays commonly interpreted from the initial linear rate?",
  "Substrate depletion, product inhibition, and reverse reaction are still minimal", ["The enzyme has already denatured completely", "Product concentration is maximal", "Equilibrium has already been reached"],
  "Initial-rate measurement best reflects catalytic velocity under the chosen substrate and enzyme conditions.",
  "Explain why enzyme activity is measured from initial velocity.", ["enzyme-assay"]);
addLab("Practical amino acid and protein tests", "Biuret test", 2,
  "A positive Biuret test primarily detects what structural feature?",
  "Peptide bonds", ["Free reducing-sugar aldehydes", "DNA phosphates", "Cholesterol rings"],
  "Copper ions form a violet complex with multiple peptide nitrogens in alkaline solution.",
  "State the molecular target of the Biuret reaction.", ["protein-test"]);
addLab("Practical amino acid and protein tests", "Ninhydrin test", 2,
  "Ninhydrin is most useful for detecting what?",
  "Free alpha-amino groups", ["Peptide bonds only", "Cholesterol", "Phospholipid phosphate"],
  "Most amino acids produce a purple product with ninhydrin, while imino acids such as proline give a yellow product.",
  "State the target and characteristic result of the ninhydrin test.", ["amino-acid-test"]);
addLab("Titration, Henderson-Hasselbalch, and buffer capacity", "Half-equivalence point", 3,
  "At the half-equivalence point of titrating a weak acid with strong base, what relationship holds?",
  "pH equals pKa", ["pH always equals 7", "The weak acid concentration is zero", "Buffer capacity is absent"],
  "Equal concentrations of weak acid and conjugate base make the Henderson-Hasselbalch logarithm zero.",
  "Recognize the half-equivalence point of a weak-acid titration.", ["titration"]);
addLab("Osmosis practical", "Tonicity", 3,
  "A red blood cell placed in a strongly hypotonic solution undergoes what change?",
  "Water enters, causing swelling and possible hemolysis", ["Water leaves, causing crenation", "Cell volume is unchanged", "The cell begins beta oxidation"],
  "A lower effective extracellular osmolarity drives water into the cell.",
  "Predict cell-volume changes from tonicity.", ["osmosis"]);

if (items.length < 200) throw new Error(`Expected comprehensive expansion, found only ${items.length} items`);
writeFileSync(output, `${items.map((item) => JSON.stringify(item)).join("\n")}\n`);
console.log(`Wrote ${items.length} August 25 comprehensive gap questions to ${output}`);
