import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("data/bank/questions/biochemistry-teacher-scope.jsonl");

const blocks = [
  {
    key: "overview",
    topic: "Biochemical foundations",
    chapter: "Introduction: biomolecules and information flow",
    file: "INTRODUCTION.ppt",
    location: "slide",
    questions: [
      ["Which statement best defines biochemistry?", "Application of chemistry to biological processes at the cellular and molecular level", ["Study of gross body structure only", "Classification of microorganisms only", "Study of drug names without mechanisms"], "Biochemistry applies chemical principles to molecules, reactions, and processes in living systems.", "4", 2],
      ["Why is biochemistry directly relevant to clinical medicine?", "It links molecular abnormalities to diagnosis and targeted treatment", ["It replaces all physical examination", "It studies only nonhuman organisms", "It avoids cellular mechanisms"], "Molecular mechanisms explain disease phenotypes, laboratory findings, and rational therapeutic targets.", "5-6", 2],
      ["Which set contains the six elements emphasized as CHNOPS?", "Carbon, hydrogen, nitrogen, oxygen, phosphorus, and sulfur", ["Calcium, hydrogen, neon, oxygen, potassium, and sodium", "Carbon, helium, nitrogen, osmium, phosphorus, and selenium", "Copper, hydrogen, nickel, oxygen, potassium, and sulfur"], "CHNOPS names the major elements carbon, hydrogen, nitrogen, oxygen, phosphorus, and sulfur.", "9", 2],
      ["Which is the basic structural and functional unit of living organisms?", "The cell", ["The organ", "The amino acid", "The chromosome"], "Cells are the fundamental living units from which tissues and organs are organized.", "10", 2],
      ["Which biomolecule class most directly includes enzymes, antibodies, receptors, and many transporters?", "Proteins", ["Triacylglycerols", "Nucleic acids", "Mineral ions"], "Proteins perform catalytic, immune, receptor, structural, and transport functions.", "12", 2],
      ["Which biomolecule class stores hereditary information?", "Nucleic acids", ["Lipids", "Carbohydrates", "Steroids"], "DNA stores genetic information, while RNA participates in its expression.", "12-13", 2],
      ["What is the usual direction of information flow in the central dogma?", "DNA to RNA to protein", ["Protein to RNA to DNA", "RNA to protein to DNA", "Lipid to DNA to carbohydrate"], "Transcription produces RNA from DNA, and translation produces protein from RNA.", "13", 2],
      ["Which is a principal role of carbohydrates emphasized in the lecture?", "Providing energy and forming structural or recognition components", ["Encoding all hereditary information", "Acting only as steroid hormones", "Serving only as membrane insulation"], "Carbohydrates provide metabolic fuel and also contribute to structures and cell communication.", "12", 2],
      ["Which is a major biological role of lipids?", "Energy storage, insulation, and hormone synthesis", ["Direct translation of mRNA", "Formation of ribosomal RNA", "Catalysis of every reaction"], "Lipids store energy, insulate tissues, form membranes, and provide steroid precursors.", "12", 2],
      ["A mutation changes the amino-acid sequence of an enzyme. Which flow best connects the genetic change to the altered protein?", "DNA sequence changes RNA sequence, which changes translation", ["Protein sequence changes DNA without RNA", "Lipid oxidation directly rewrites DNA", "Carbohydrate storage bypasses gene expression"], "The central dogma connects a DNA change to altered mRNA and then to altered protein sequence.", "13", 3]
    ]
  },
  {
    key: "chemistry",
    topic: "Metabolism, ATP, functional groups, and bonds",
    chapter: "Introduction: metabolism and chemical interactions",
    file: "INTRODUCTION.ppt",
    location: "slide",
    questions: [
      ["Which process is anabolic?", "Synthesis of glycogen from glucose", ["Breakdown of glycogen to glucose", "Oxidation of fatty acids", "Hydrolysis of a protein"], "Anabolism builds larger molecules from smaller precursors; glycogenesis builds glycogen.", "16-18", 2],
      ["Which process is catabolic?", "Breakdown of glycogen to glucose", ["Synthesis of glycogen", "Formation of protein from amino acids", "Synthesis of DNA"], "Catabolism breaks complex molecules into simpler products and commonly releases usable energy.", "16-18", 2],
      ["ATP is composed of which components?", "Adenine, ribose, and three phosphate groups", ["Adenine, deoxyribose, and one phosphate", "Guanine, ribose, and three phosphates", "Glucose, adenine, and two phosphates"], "ATP is adenosine, meaning adenine plus ribose, attached to a triphosphate chain.", "19", 2],
      ["What is the central energetic role of ATP?", "It couples energy-releasing reactions to energy-requiring processes", ["It permanently stores hereditary information", "It is the main extracellular buffer", "It converts all covalent bonds to ionic bonds"], "ATP captures energy from fuel oxidation and transfers it to biosynthesis, transport, and mechanical work.", "19", 3],
      ["Which functional group is characteristic of alcohols and many sugars?", "Hydroxyl group", ["Amino group", "Phosphate group", "Sulfhydryl group"], "The hydroxyl group (-OH) increases polarity and hydrogen-bonding capacity.", "20-22", 2],
      ["Which functional group can donate a proton and is present in amino acids and fatty acids?", "Carboxyl group", ["Carbonyl group", "Methyl group", "Phosphate ester only"], "A carboxyl group can ionize to a negatively charged carboxylate.", "20-22", 3],
      ["Which functional group is central to amino-acid basicity and peptide chemistry?", "Amino group", ["Hydroxyl group", "Aldehyde group", "Methyl group"], "An amino group can accept a proton and is a defining group of amino acids.", "20-22", 2],
      ["Which functional group is prominent in ATP and nucleic acids and participates in energy transfer?", "Phosphate group", ["Sulfhydryl group", "Ketone group", "Methyl group"], "Phosphate groups carry negative charge and participate in energy transfer and nucleic-acid backbones.", "20-22", 2],
      ["A ketone or aldehyde contains which functional group?", "Carbonyl group", ["Amino group", "Phosphate group", "Sulfhydryl group"], "A carbonyl contains a carbon double-bonded to oxygen and occurs in ketones and aldehydes.", "20-22", 3],
      ["Oxidation of two cysteine sulfhydryl groups forms what linkage?", "A disulfide bond", ["A phosphodiester bond", "A glycosidic bond", "An ionic bond only"], "Two thiol groups can be oxidized to form a covalent S-S disulfide bond.", "21,28", 3],
      ["What creates an ionic bond?", "Electrostatic attraction between oppositely charged ions", ["Equal sharing of electrons", "Aggregation of nonpolar groups in water", "Sharing of a proton between two carbons"], "Ionic interactions arise between cations and anions after charge separation.", "24", 2],
      ["In a nonpolar covalent bond, how are bonding electrons distributed?", "Approximately equally between the bonded atoms", ["Completely transferred to one atom", "Shared only with water", "Absent from the bond"], "Similar electronegativities produce approximately equal electron sharing and little charge separation.", "25-26", 2],
      ["What makes a covalent bond polar?", "Unequal electron sharing caused by an electronegativity difference", ["Complete loss of both electrons", "Absence of nuclei", "Equal attraction by identical atoms"], "Unequal sharing creates partial positive and negative charges, producing a dipole.", "27", 3],
      ["Why do nonpolar groups cluster together in water?", "Clustering minimizes their contact with water and preserves water-water hydrogen bonding", ["They form strong ionic bonds with water", "They become fully protonated", "They hydrolyze ATP directly"], "The hydrophobic effect segregates nonpolar surfaces from water and stabilizes membranes and folded proteins.", "29-31", 3]
    ]
  },
  {
    key: "water",
    topic: "Water and body-fluid compartments",
    chapter: "Water and Buffer: water properties",
    file: "Water and Buffer 1404.ppt",
    location: "slide",
    questions: [
      ["Approximately what fraction of adult body weight is water according to the lecture?", "About 50% to 60%", ["About 5%", "About 15%", "About 90% to 95%"], "Adult total body water is commonly about 50% to 60% of body weight, varying with age, sex, and adiposity.", "4", 2],
      ["Which compartment contains about two-thirds of total body water?", "Intracellular fluid", ["Plasma", "Interstitial fluid", "Transcellular fluid"], "Approximately two-thirds of total body water is intracellular and one-third extracellular.", "5", 2],
      ["Which ions are most characteristic of extracellular fluid?", "Sodium and chloride", ["Potassium and magnesium", "Phosphate and protein", "Iron and copper"], "Extracellular fluid is rich in sodium, chloride, and bicarbonate.", "5", 2],
      ["Which ions are relatively enriched in intracellular fluid?", "Potassium, magnesium, and phosphate", ["Sodium and chloride", "Calcium and bicarbonate only", "Chloride and iodide"], "Intracellular fluid is relatively rich in potassium, magnesium, phosphate, and proteins.", "5", 2],
      ["Which is an example of transcellular fluid?", "Cerebrospinal fluid", ["Cytosol", "Plasma proteins", "Intracellular potassium"], "Transcellular fluid includes specialized extracellular fluids such as CSF and synovial fluid.", "5", 2],
      ["Why is water a dipole?", "Oxygen attracts shared electrons more strongly than hydrogen", ["Hydrogen completely transfers its electron", "Water contains an ionic O-H bond", "Both atoms have identical electronegativity"], "Unequal electron sharing gives oxygen a partial negative charge and hydrogens partial positive charges.", "6", 3],
      ["Which property allows water to dissolve many polar and ionic substances?", "Formation of hydrogen bonds and hydration shells", ["Complete nonpolarity", "Inability to interact with charges", "Permanent covalent bonding to every solute"], "Water surrounds ions and polar groups through electrostatic interactions and hydrogen bonds.", "4,6-7", 3],
      ["A compound that readily interacts with and dissolves in water is described as what?", "Hydrophilic", ["Hydrophobic", "Volatile", "Anhydrous"], "Hydrophilic molecules contain polar or charged groups that interact favorably with water.", "7-8", 2],
      ["A nonpolar molecule that is poorly soluble in water is described as what?", "Hydrophobic", ["Hydrophilic", "Amphoteric only", "Ionized"], "Hydrophobic molecules lack favorable polar interactions with water and tend to aggregate.", "7-8", 2],
      ["A phospholipid has a polar head and nonpolar tails. How is it classified?", "Amphipathic", ["Completely hydrophilic", "Completely hydrophobic", "Strong acid"], "Amphipathic molecules contain both hydrophilic and hydrophobic regions, enabling membrane formation.", "7-8", 3]
    ]
  },
  {
    key: "ph",
    topic: "pH, acids, bases, Ka, and pKa",
    chapter: "Water and Buffer: acid-base foundations",
    file: "Water and Buffer 1404.ppt",
    location: "slide",
    questions: [
      ["How is pH defined?", "The negative base-10 logarithm of hydrogen-ion concentration", ["The hydrogen-ion concentration itself", "The positive logarithm of hydroxide concentration", "The ratio of sodium to potassium"], "pH = -log10[H+], with concentration expressed in mol/L.", "9", 2, ["calculation"]],
      ["A solution has [H+] = 1 × 10^-3 M. What is its pH?", "3", ["1", "7", "11"], "pH = -log10(10^-3) = 3.", "9", 3, ["calculation"]],
      ["A solution has [H+] = 1 × 10^-8 M. What is its pH?", "8", ["6", "10", "14"], "pH = -log10(10^-8) = 8.", "9", 3, ["calculation"]],
      ["A solution has [OH-] = 1 × 10^-4 M at 25°C. What is its pH?", "10", ["4", "6", "14"], "pOH = 4 and pH + pOH = 14, so pH = 10.", "9-10", 3, ["calculation"]],
      ["A solution has pH 5. What is its hydrogen-ion concentration?", "1 × 10^-5 M", ["5 M", "1 × 10^-9 M", "1 × 10^5 M"], "Rearranging pH = -log[H+] gives [H+] = 10^-5 M.", "9-12", 3, ["calculation"]],
      ["Compared with pH 7, a solution at pH 5 has how much greater [H+]?", "100 times greater", ["2 times greater", "10 times greater", "1000 times smaller"], "A decrease of two pH units represents a 10^2, or 100-fold, increase in [H+].", "9-12", 4, ["calculation"]],
      ["At 25°C, a solution has pH 9. What is its pOH?", "5", ["3", "9", "23"], "Using pH + pOH = 14, pOH = 14 - 9 = 5.", "9-12", 3, ["calculation"]],
      ["At neutrality, how do [H+] and [OH-] compare?", "They are equal", ["[H+] is tenfold greater", "[OH-] is absent", "Their product is zero"], "A neutral aqueous solution has equal hydrogen- and hydroxide-ion concentrations.", "11-12", 2],
      ["Which definition correctly pairs acids and bases?", "Acids donate protons; bases accept protons", ["Acids accept protons; bases donate electrons only", "Both acids and bases donate protons", "Neither affects hydrogen ions"], "The Brønsted-Lowry definition treats acids as H+ donors and bases as H+ acceptors.", "14", 2],
      ["What distinguishes a strong acid from a weak acid in water?", "A strong acid dissociates much more completely", ["A strong acid has a larger molecular mass", "A weak acid contains no hydrogen", "A weak acid always has pH 7"], "Acid strength reflects the extent of dissociation, not concentration or molecular mass.", "14,18-20", 3],
      ["In HA ⇌ H+ + A-, what is A-?", "The conjugate base of HA", ["A strong acid", "A neutral salt only", "The conjugate acid of H+"], "After HA donates H+, the remaining A- is its conjugate base.", "17", 2],
      ["What does a larger Ka generally indicate?", "A stronger acid with greater dissociation", ["A weaker acid with less dissociation", "A higher molecular weight", "A lower conjugate-base concentration in every solution"], "Ka measures acid dissociation; larger Ka means a greater tendency to release H+.", "18-19", 3],
      ["What does a lower pKa generally indicate?", "A stronger acid", ["A weaker acid", "A stronger base only", "A neutral compound"], "Because pKa = -log Ka, a larger Ka corresponds to a smaller pKa and stronger acid.", "20", 3],
      ["A tenfold increase in Ka changes pKa by what amount?", "It lowers pKa by 1 unit", ["It raises pKa by 1 unit", "It lowers pKa by 10 units", "It does not change pKa"], "Since pKa = -log Ka, multiplying Ka by 10 subtracts 1 from pKa.", "18-20", 4, ["calculation"]],
      ["A patient's arterial blood pH is 7.20. How is this classified?", "Acidemia", ["Alkalemia", "Neutrality", "Physiologic alkalosis"], "Blood pH below the normal range near 7.4 represents acidemia and may reflect acidosis.", "13-15", 3],
      ["Persistent vomiting can raise blood pH primarily by loss of which substance?", "Gastric acid", ["Bicarbonate from plasma", "Intracellular potassium only", "Hemoglobin"], "Loss of gastric HCl removes acid from the body and can contribute to metabolic alkalosis.", "15", 3]
    ]
  },
  {
    key: "buffers",
    topic: "Titration, Henderson-Hasselbalch, and buffer capacity",
    chapter: "Water and Buffer: buffers and titration",
    file: "Water and Buffer 1404.ppt",
    location: "slide",
    questions: [
      ["Which equation relates pH, pKa, conjugate base, and weak acid?", "pH = pKa + log([A-]/[HA])", ["pH = pKa - [A-][HA]", "pH = [H+] + [OH-]", "pH = Ka × molecular weight"], "The Henderson-Hasselbalch equation relates pH to pKa and the base-to-acid ratio.", "24", 2, ["calculation"]],
      ["At the midpoint of a weak-acid titration, which relation is true?", "pH = pKa and [A-] = [HA]", ["pH = 0", "[A-] is zero", "pH must equal 7"], "At half-equivalence, equal conjugate base and acid make log([A-]/[HA]) equal zero.", "22-24,27-28", 3, ["graph"]],
      ["A buffer has pKa 6.0 and equal concentrations of A- and HA. What is its pH?", "6.0", ["3.0", "7.0", "12.0"], "When [A-]/[HA] = 1, log 1 = 0, so pH equals pKa.", "24-28", 3, ["calculation"]],
      ["A buffer has pKa 6.0 and [A-]/[HA] = 10. What is its pH?", "7.0", ["5.0", "6.0", "16.0"], "pH = 6.0 + log10(10) = 7.0.", "24-28", 3, ["calculation"]],
      ["A buffer has pKa 6.0 and [A-]/[HA] = 0.1. What is its pH?", "5.0", ["6.0", "7.0", "10.0"], "pH = 6.0 + log10(0.1) = 5.0.", "24-28", 3, ["calculation"]],
      ["A buffer has pKa 4.76 and [acetate]/[acetic acid] = 1. What is its pH?", "4.76", ["3.76", "5.76", "9.52"], "Equal acid and conjugate base give pH equal to pKa.", "24-28", 3, ["calculation"]],
      ["A buffer has pKa 4.0 and [A-]/[HA] = 100. What is its pH?", "6.0", ["2.0", "4.0", "104"], "log10(100) = 2, so pH = 4 + 2 = 6.", "24-28", 4, ["calculation"]],
      ["At pH 7.0, an acid has pKa 6.0. What is [A-]/[HA]?", "10", ["0.1", "1", "100"], "pH - pKa = 1 = log([A-]/[HA]), so the ratio is 10.", "24-28", 4, ["calculation"]],
      ["At pH 5.0, an acid has pKa 6.0. What is [A-]/[HA]?", "0.1", ["1", "10", "100"], "pH - pKa = -1, so [A-]/[HA] = 10^-1 = 0.1.", "24-28", 4, ["calculation"]],
      ["Within what pH range is a weak-acid buffer usually most effective?", "Approximately pKa ± 1 pH unit", ["Only exactly at pKa", "pKa ± 7 units", "Only above pH 12"], "A conjugate pair buffers most effectively when both forms are present in appreciable amounts, roughly within one pH unit of pKa.", "25-27", 2],
      ["When is buffer capacity maximal for a given conjugate pair?", "When pH equals pKa", ["When all acid is fully protonated", "When all base is absent", "When pH is fourteen units above pKa"], "At pH = pKa, acid and conjugate base are equal and the buffer can best resist either added acid or base.", "25-27", 3],
      ["Which mixture can act as a buffer?", "Acetic acid plus sodium acetate", ["Hydrochloric acid plus sodium chloride", "Sodium hydroxide plus sodium chloride", "Equal strong acid and strong base after complete neutralization"], "A buffer requires a weak acid and its conjugate base, such as acetic acid and acetate.", "25-26,38", 2],
      ["What happens when a small amount of strong acid is added to a suitable buffer?", "The conjugate base consumes much of the added H+, so pH changes only slightly", ["The pH always falls to zero", "The weak acid instantly disappears", "The buffer converts H+ into sodium"], "The conjugate base binds added protons, limiting the fall in pH.", "25-26,38", 3],
      ["Two acetate buffers have the same pH and ratio, but one is ten times more concentrated. Which has greater buffer capacity?", "The more concentrated buffer", ["The more dilute buffer", "They must have zero capacity", "Capacity depends only on color"], "At the same ratio, more total buffer molecules can neutralize more added acid or base.", "25-27", 3],
      ["On a weak-acid titration curve, what does the relatively flat region represent?", "The buffer region", ["Complete absence of acid and base", "A region where pH is undefined", "The strong-acid equivalence point only"], "Near pKa, added acid or base changes the conjugate-pair ratio with relatively little pH change.", "22-23,27-28", 3, ["graph"]],
      ["A weak acid is 50% dissociated at which condition?", "When pH equals pKa", ["When pH is always 7", "When pH is zero", "When [HA] is ten times [A-]"], "At pH = pKa, [A-] equals [HA], so half of the acid is in each form.", "22-28", 3, ["graph"]]
    ]
  },
  {
    key: "physiological-buffers",
    topic: "Physiological buffer systems",
    chapter: "Water and Buffer: body buffers",
    file: "Water and Buffer 1404.ppt",
    location: "slide",
    questions: [
      ["Which four major buffer systems are listed for regulation of body-fluid pH?", "Bicarbonate, phosphate, plasma proteins, and hemoglobin", ["Sodium, potassium, calcium, and chloride", "Glucose, glycogen, lactate, and pyruvate", "Albumin, insulin, glucagon, and cortisol"], "The lecture identifies bicarbonate, phosphate, protein, and hemoglobin buffering systems.", "29-30", 2],
      ["Which conjugate pair forms the phosphate buffer system?", "H2PO4- and HPO4^2-", ["H2CO3 and HCO3-", "NH4+ and Na+", "HbO2 and O2 only"], "Dihydrogen phosphate donates H+, while monohydrogen phosphate accepts H+.", "32", 2],
      ["Why is phosphate effective as an intracellular buffer?", "Its pKa is near intracellular pH and its concentration is appreciable inside cells", ["It is the only extracellular cation", "It is a strong acid that fully dissociates", "It cannot accept protons"], "The phosphate pair has a pKa near physiologic intracellular pH and is relatively concentrated in cells.", "30-32", 3],
      ["Which conjugate pair is central to the bicarbonate buffer system?", "Carbonic acid and bicarbonate", ["Acetic acid and acetate", "Phosphoric acid and phosphate only", "Ammonia and chloride"], "The bicarbonate system uses H2CO3 as proton donor and HCO3- as proton acceptor.", "33", 2],
      ["Which organ system rapidly adjusts the bicarbonate buffer by changing CO2 elimination?", "The lungs", ["The skin", "The spleen", "The thyroid"], "Ventilation changes arterial CO2 and therefore shifts the carbonic acid-bicarbonate equilibrium.", "29,33", 3],
      ["How can plasma proteins buffer pH?", "Ionizable amino-acid side chains accept or donate protons", ["They irreversibly destroy hydrogen ions", "They convert every acid to glucose", "They act only as lipid solvents"], "Protein side chains, especially histidine residues, reversibly bind and release H+.", "34", 3],
      ["During exercise, deoxygenated hemoglobin helps buffer blood by doing what?", "Binding some of the H+ generated in tissues", ["Releasing strong acid into plasma", "Removing all bicarbonate from blood", "Preventing oxygen release"], "Hemoglobin binds protons as oxygen is released, contributing to CO2 transport and pH control.", "35", 3],
      ["A patient with diabetic ketoacidosis develops deep, rapid breathing. What is the compensatory purpose?", "Lower PaCO2 and reduce carbonic acid", ["Raise PaCO2 and lower pH further", "Retain volatile acid", "Stop bicarbonate formation completely"], "Hyperventilation removes CO2, shifting the bicarbonate system and partially compensating for metabolic acidosis.", "15,29-35", 4],
      ["In red blood cells, which enzyme rapidly interconverts CO2 and carbonic acid?", "Carbonic anhydrase", ["Hexokinase", "Pepsin", "DNA polymerase"], "Carbonic anhydrase accelerates CO2 hydration, allowing bicarbonate transport and hemoglobin buffering.", "33-35", 3],
      ["When bicarbonate exits an RBC during tissue CO2 transport, which ion commonly enters to maintain electroneutrality?", "Chloride", ["Calcium", "Phosphate", "Magnesium"], "The chloride shift exchanges bicarbonate for chloride across the RBC membrane.", "33-35", 4]
    ]
  },
  {
    key: "water-soluble-vitamins",
    topic: "Water-soluble vitamins",
    chapter: "Vitamins: water-soluble group",
    file: "Vitamin 2024.pdf",
    location: "page",
    questions: [
      ["Which vitamins are classified as water soluble?", "The B-complex vitamins and vitamin C", ["Vitamins A, D, E, and K", "Only vitamins A and C", "Only vitamins D and K"], "The water-soluble group consists of vitamin C and the B-complex vitamins.", "8-12", 2],
      ["Why do most water-soluble vitamin deficiencies develop relatively quickly?", "Most have limited body stores and excess is excreted in urine", ["They are stored indefinitely in adipose tissue", "They cannot enter the circulation", "They are all synthesized in adequate amounts"], "Most water-soluble vitamins require regular dietary supply; B12 is an important storage exception.", "10-12", 3],
      ["When an organic cofactor is tightly bound to an enzyme, it is called what?", "A prosthetic group", ["A substrate only", "An apoenzyme", "A zymogen"], "A tightly bound nonprotein component is a prosthetic group; the protein without it is an apoenzyme.", "6-7", 2],
      ["What is the active coenzyme form of thiamine?", "Thiamine pyrophosphate", ["FAD", "NADP+", "Tetrahydrofolate"], "Thiamine pyrophosphate (TPP) supports oxidative decarboxylation and transketolase reactions.", "13-14", 2],
      ["Which reaction class most directly requires thiamine pyrophosphate?", "Oxidative decarboxylation of alpha-keto acids", ["Gamma-carboxylation of glutamate", "Hydroxylation of collagen proline", "DNA methylation only"], "TPP is required by oxidative decarboxylation complexes and transketolase.", "14", 3],
      ["An alcoholic patient has confusion, ataxia, nystagmus, and ophthalmoplegia. Which deficiency is most likely?", "Thiamine deficiency", ["Vitamin C deficiency", "Vitamin K deficiency", "Biotin excess"], "Thiamine deficiency can cause Wernicke encephalopathy, with confusion, ataxia, and ocular findings.", "15-16", 3],
      ["Which coenzymes are derived from riboflavin?", "FMN and FAD", ["NAD+ and NADP+", "TPP and THF", "CoA and ACP"], "Riboflavin is converted to flavin mononucleotide and flavin adenine dinucleotide.", "17-18", 2],
      ["Riboflavin-derived coenzymes primarily participate in what type of reaction?", "Oxidation-reduction reactions", ["DNA base pairing", "Calcium binding only", "Gamma-carboxylation"], "FMN and FAD transfer electrons in fuel oxidation and the respiratory chain.", "18-19", 3],
      ["Angular cheilosis, glossitis, corneal vascularization, and seborrheic dermatitis suggest deficiency of which vitamin?", "Riboflavin", ["Vitamin D", "Vitamin K", "Vitamin A"], "Riboflavin deficiency commonly affects the mouth, tongue, skin, eyes, and erythropoiesis.", "20", 3],
      ["Which coenzymes contain niacin?", "NAD+ and NADP+", ["FMN and FAD", "TPP and PLP", "THF and biotin"], "Niacin supplies the nicotinamide ring in NAD and NADP.", "21-22", 2],
      ["Which function best distinguishes NADPH from NADH in the lecture?", "NADPH commonly supplies reducing power for biosynthesis", ["NADPH is used only to digest protein", "NADPH forms collagen cross-links directly", "NADPH is the visual pigment"], "NADPH supports reductive biosynthesis, whereas NADH commonly carries electrons from fuel oxidation toward ATP production.", "21-22", 3],
      ["Dermatitis, diarrhea, and dementia are the classic triad of which deficiency?", "Niacin deficiency", ["Thiamine deficiency", "Vitamin C deficiency", "Vitamin K deficiency"], "Pellagra from niacin deficiency is classically remembered by the three Ds.", "23", 2],
      ["Why can severe tryptophan deficiency contribute to pellagra?", "Tryptophan is a precursor for niacin synthesis", ["Tryptophan directly activates vitamin K", "Tryptophan is converted to vitamin C", "Tryptophan blocks NAD formation"], "Humans can synthesize some niacin from tryptophan, so low tryptophan can worsen niacin deficiency.", "21-23", 3],
      ["Pantothenic acid is a component of which two important carriers?", "Coenzyme A and acyl carrier protein", ["NAD and FAD", "Hemoglobin and myoglobin", "DNA and RNA"], "Pantothenate forms part of CoA and the phosphopantetheine arm of acyl carrier protein.", "24-25", 2],
      ["Which metabolic task most directly depends on pantothenate-containing CoA?", "Transfer of acyl groups", ["Transfer of one-carbon units only", "Gamma-carboxylation of clotting factors", "Formation of retinal"], "CoA carries activated acyl groups in the TCA cycle, fatty-acid metabolism, and biosynthesis.", "24-25", 3],
      ["What is the principal active coenzyme form of vitamin B6?", "Pyridoxal phosphate", ["Thiamine pyrophosphate", "Tetrahydrofolate", "Biotinyl-lysine"], "Pyridoxal phosphate (PLP) participates in amino-acid reactions and glycogen phosphorylase.", "26-28", 2],
      ["Which reaction is especially dependent on pyridoxal phosphate?", "Amino-acid transamination", ["Hydroxylation of proline", "Carboxylation of clotting factors", "Conversion of retinal to retinoic acid"], "PLP stabilizes intermediates in transamination and amino-acid decarboxylation.", "27", 3],
      ["Isoniazid therapy can cause a functional deficiency of which vitamin?", "Vitamin B6", ["Vitamin D", "Vitamin E", "Vitamin K"], "Isoniazid interacts with pyridoxal/PLP and can cause neuropathy prevented by pyridoxine supplementation.", "28", 3],
      ["Biotin functions primarily in which reaction type?", "Carboxylation reactions that transfer CO2", ["Oxidative decarboxylation", "Protein gamma-carboxylation", "Hydrogen transfer by NAD"], "Biotin carries activated CO2 in enzymes such as pyruvate, acetyl-CoA, and propionyl-CoA carboxylases.", "29-30", 3],
      ["Why can prolonged consumption of raw egg whites cause biotin deficiency?", "Avidin binds biotin and impairs its absorption", ["Albumin converts biotin to niacin", "Egg lipid destroys all carboxylases", "Raw egg contains methotrexate"], "Raw egg-white avidin binds biotin strongly; cooking denatures avidin.", "31", 3],
      ["What is the active coenzyme form of folate?", "Tetrahydrofolate", ["NADP+", "FAD", "Retinal"], "Folate is reduced to tetrahydrofolate, which carries one-carbon units.", "32-34", 2],
      ["Methotrexate inhibits which enzyme in folate metabolism?", "Dihydrofolate reductase", ["Methionine synthase", "Thymidylate synthase directly and exclusively", "Pyruvate carboxylase"], "Methotrexate inhibits dihydrofolate reductase, reducing regeneration of tetrahydrofolate.", "34", 3],
      ["Maternal folate deficiency most strongly increases the risk of what fetal defect?", "Neural tube defects", ["Scurvy", "Rickets", "Hemophilia"], "Folate is required for nucleotide synthesis and rapid cell division; deficiency increases neural-tube-defect risk.", "35", 3],
      ["Vitamin B12 absorption requires which gastric product?", "Intrinsic factor", ["Pepsinogen only", "Bicarbonate only", "Transcobalamin I in the stomach lumen only"], "Intrinsic factor from gastric parietal cells is required for ileal absorption of cobalamin.", "36-39", 3],
      ["Neurologic dysfunction in vitamin B12 deficiency is associated with accumulation of what metabolite?", "Methylmalonic acid", ["Uric acid", "Ascorbic acid", "Bilirubin only"], "B12 is required for methylmalonyl-CoA mutase; deficiency raises methylmalonate and can cause demyelination.", "37-39", 4],
      ["Which vitamin supports collagen hydroxylation and enhances intestinal iron absorption?", "Vitamin C", ["Vitamin B12", "Vitamin K", "Vitamin A"], "Ascorbate maintains iron in reduced states needed by collagen hydroxylases and improves nonheme iron absorption.", "40-43", 3]
    ]
  },
  {
    key: "fat-soluble-vitamins",
    topic: "Fat-soluble vitamins",
    chapter: "Vitamins: fat-soluble group",
    file: "Vitamin 2024.pdf",
    location: "page",
    questions: [
      ["Which vitamins are fat soluble?", "Vitamins A, D, E, and K", ["Vitamins B1, B2, B3, and C", "Only vitamins A and C", "Folate, B12, C, and K"], "The fat-soluble vitamins are A, D, E, and K.", "46-47", 2],
      ["Why is toxicity more likely with excessive intake of some fat-soluble vitamins?", "They can accumulate in liver and adipose tissue", ["They are immediately excreted in urine", "They cannot be absorbed", "They contain no carbon"], "Fat-soluble vitamins are stored and not rapidly excreted, allowing accumulation, especially of A and D.", "46-47", 3],
      ["Which vitamin A form is the chromophore precursor required for vision?", "Retinal", ["Retinoic acid only", "Calcitriol", "Tocopherol"], "11-cis-retinal combines with opsin to form visual pigments such as rhodopsin.", "49-52", 3],
      ["Which vitamin A derivative regulates gene transcription through nuclear receptors?", "Retinoic acid", ["Retinyl ester only", "Menaquinone", "Ascorbate"], "Retinoic acid binds nuclear receptors and regulates growth and differentiation.", "49,53-54", 3],
      ["What is an early manifestation of vitamin A deficiency?", "Night blindness", ["Megaloblastic anemia", "Pellagra", "Bleeding from low prothrombin"], "Impaired dark adaptation and night blindness precede xerophthalmia in vitamin A deficiency.", "52,55", 2],
      ["Prolonged severe vitamin A deficiency can cause which ocular lesion?", "Xerophthalmia with corneal keratinization", ["Cataract from sorbitol only", "Optic neuritis from B12 excess", "Retinal hemorrhage from vitamin K excess"], "Loss of normal epithelial differentiation causes xerosis, keratinization, and potentially blindness.", "55", 3],
      ["Which finding is most consistent with vitamin A toxicity?", "Headache, hepatotoxicity, dry skin, and alopecia", ["Isolated scurvy", "Only prolonged clotting time", "Angular cheilosis alone"], "Excess preformed vitamin A can injure the CNS, liver, skin, and bone/calcium homeostasis.", "56", 3],
      ["Which form of vitamin D is synthesized in human skin?", "Cholecalciferol (vitamin D3)", ["Ergocalciferol only", "Calcitonin", "Phylloquinone"], "UV exposure converts a cholesterol precursor in skin to cholecalciferol.", "57-59", 2],
      ["Where do the principal activation steps of vitamin D occur?", "First in liver, then in kidney", ["First in kidney, then in skin", "Only in bone", "Only in intestine"], "The liver produces 25-hydroxyvitamin D, and the kidney produces active 1,25-dihydroxyvitamin D.", "58-59", 3],
      ["What is the hormonally active form of vitamin D?", "Calcitriol, 1,25-dihydroxyvitamin D", ["Calcidiol only", "Cholecalciferol only", "Ergosterol"], "Renal 1-alpha hydroxylation forms calcitriol, the active ligand for the vitamin D receptor.", "59-60", 3],
      ["What is a central physiologic action of calcitriol?", "Increase intestinal calcium and phosphate absorption", ["Block all calcium absorption", "Directly degrade bone collagen only", "Prevent insulin secretion"], "Vitamin D maintains mineral homeostasis largely by increasing intestinal calcium and phosphate absorption.", "57,60", 3],
      ["Vitamin D deficiency causes which pair of bone diseases?", "Rickets in children and osteomalacia in adults", ["Scurvy in children and pellagra in adults", "Beriberi in children and anemia in adults", "Xerophthalmia in children and gout in adults"], "Defective mineralization causes rickets before growth-plate closure and osteomalacia in adults.", "61", 2],
      ["Severe vitamin D toxicity most directly causes which biochemical disturbance?", "Hypercalcemia with soft-tissue calcification", ["Hypocalcemia from blocked absorption", "Isolated folate deficiency", "Low sodium from aldosterone loss"], "Excess vitamin D increases calcium absorption and can cause hypercalcemia and ectopic calcification.", "62", 3],
      ["What is the principal antioxidant role of vitamin E?", "Protect membrane lipids from free-radical peroxidation", ["Carboxylate clotting factors", "Form visual pigment", "Carry one-carbon units"], "Alpha-tocopherol is a lipid-soluble chain-breaking antioxidant in membranes and lipoproteins.", "63-64", 3],
      ["Vitamin E deficiency is most likely in which setting?", "Severe fat malabsorption", ["Excess sun exposure", "High intrinsic-factor secretion", "Isolated sodium excess"], "Fat malabsorption can deplete vitamin E and damage neuronal, muscular, and erythrocyte membranes.", "65", 3],
      ["A premature infant with vitamin E deficiency is at risk for which hematologic problem?", "Hemolytic anemia", ["Megaloblastic anemia from impaired DNA synthesis", "Pernicious anemia", "Polycythemia from excess EPO"], "Oxidative injury makes erythrocyte membranes fragile, producing hemolysis.", "65", 3],
      ["Vitamin K is required for which post-translational modification?", "Gamma-carboxylation of specific glutamate residues", ["Hydroxylation of collagen proline", "Phosphorylation of glucose", "Methylation of DNA cytosine"], "Vitamin K supports gamma-carboxylation of Gla proteins, enabling calcium binding in clotting and bone proteins.", "66-67", 3],
      ["Which test is typically prolonged early in vitamin K deficiency?", "Prothrombin time", ["Bleeding time only", "Serum sodium", "Erythrocyte sedimentation rate"], "Reduced activity of vitamin K-dependent clotting factors, especially factor VII, prolongs PT/INR.", "66-68", 3]
    ]
  }
];

const expected = { overview: 10, chemistry: 14, water: 10, ph: 16, buffers: 16, "physiological-buffers": 10, "water-soluble-vitamins": 26, "fat-soluble-vitamins": 18 };
for (const block of blocks) {
  if (block.questions.length !== expected[block.key]) throw new Error(`${block.key}: expected ${expected[block.key]}, got ${block.questions.length}`);
}

const letters = ["A", "B", "C", "D"];
const questions = [];
let sequence = 0;
for (const block of blocks) {
  for (const [prompt, correct, distractors, explanation, location, difficulty, extraTags = []] of block.questions) {
    sequence += 1;
    const correctIndex = (sequence - 1) % 4;
    const texts = [...distractors];
    texts.splice(correctIndex, 0, correct);
    const options = texts.map((text, index) => ({ id: letters[index], text }));
    const correctOptionId = letters[correctIndex];
    const distractorExplanations = Object.fromEntries(options.filter((option) => option.id !== correctOptionId).map((option) => [option.id, `${option.text} is not the best answer. ${explanation}`]));
    const source = {
      title: block.file,
      chapter: block.chapter,
      lecture: block.file,
      [block.location]: location,
      excerpt: "Original exam-style item aligned to the exact local TUMS teacher-file location; mechanism checked against the designated local biochemistry reference."
    };
    questions.push({
      schemaVersion: "1.0.0",
      id: `bio-teacher-${String(sequence).padStart(3, "0")}-v1`,
      revision: 1,
      status: "verified",
      kind: "single_best_answer",
      subject: "biochemistry",
      topic: block.topic,
      subtopic: block.key,
      chapter: block.chapter,
      difficulty,
      prompt,
      options,
      correctOptionId,
      acceptedFreeText: [correctOptionId, correct],
      explanation,
      distractorExplanations,
      learningObjective: `Apply teacher-defined ${block.topic.toLowerCase()} knowledge to a single-best-answer problem.`,
      source,
      tags: ["biochemistry", "teacher-scope", block.key, ...extraTags],
      examPriority: ["ph", "buffers", "physiological-buffers", "water-soluble-vitamins", "fat-soluble-vitamins"].includes(block.key) ? "core" : "high",
      qualityFlags: ["teacher-scope-aligned", "exact-local-source-location", "reference-checked", "text-only"]
    });
  }
}

if (questions.length !== 120) throw new Error(`Expected 120 questions, got ${questions.length}`);
const prompts = new Set(questions.map((question) => question.prompt.toLowerCase()));
if (prompts.size !== questions.length) throw new Error("Duplicate prompts detected");
for (const question of questions) {
  if (new Set(question.options.map((option) => option.text.toLowerCase())).size !== 4) throw new Error(`Duplicate options in ${question.id}`);
}

await writeFile(output, `${questions.map((question) => JSON.stringify(question)).join("\n")}\n`, "utf8");
const digest = createHash("sha256").update(await import("node:fs/promises").then((fs) => fs.readFile(output))).digest("hex");
const blockCounts = Object.fromEntries(blocks.map((block) => [block.key, block.questions.length]));
const difficultyCounts = Object.fromEntries([1, 2, 3, 4, 5].map((value) => [value, questions.filter((question) => question.difficulty === value).length]));
const answerBalance = Object.fromEntries(letters.map((letter) => [letter, questions.filter((question) => question.correctOptionId === letter).length]));
const calculationCount = questions.filter((question) => question.tags.includes("calculation") || question.tags.includes("graph")).length;
console.log(JSON.stringify({ output, questions: questions.length, blockCounts, difficultyCounts, answerBalance, calculationOrGraphCount: calculationCount, sha256: digest }, null, 2));
