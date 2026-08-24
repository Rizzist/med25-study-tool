import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "data/final-exams/aug25-downloaded-core.jsonl");

// One row represents one durable relationship after concept-level deduplication of
// the five newly downloaded PDFs and the two photo-only papers. Source markings
// were re-keyed against current medical biochemistry; ambiguous and obsolete
// questions are deliberately absent.
const rows = [
  // Carbohydrate and central energy metabolism.
  ["carbohydrate metabolism", "Where does glycolysis occur in a human cell?", "Cytosol", "Mitochondrial matrix", "Inner mitochondrial membrane", "Lysosome", "All ten reactions of glycolysis are catalyzed by soluble cytosolic enzymes."],
  ["carbohydrate metabolism", "Where is the pyruvate dehydrogenase complex located?", "Mitochondrial matrix", "Cytosol", "Outer mitochondrial membrane", "Nucleus", "PDH is a mitochondrial-matrix complex that converts pyruvate to acetyl-CoA."],
  ["bioenergetics", "Where do most reactions of the TCA cycle occur?", "Mitochondrial matrix", "Cytosol", "Intermembrane space", "Golgi apparatus", "Most TCA enzymes are in the matrix; succinate dehydrogenase is the membrane-bound exception."],
  ["carbohydrate metabolism", "Which enzyme is part of glycolysis?", "Pyruvate kinase", "Pyruvate carboxylase", "Fructose-1,6-bisphosphatase", "Glucose-6-phosphatase", "Pyruvate kinase catalyzes the final ATP-forming step of glycolysis."],
  ["carbohydrate metabolism", "Which enzyme is not a normal enzyme of human glycolysis?", "Glucose oxidase", "Hexokinase", "Phosphofructokinase-1", "Enolase", "Glucose oxidase is not part of the ten-step human glycolytic pathway."],
  ["carbohydrate metabolism", "Which glycolytic intermediate has a high-energy acyl-phosphate bond?", "1,3-Bisphosphoglycerate", "Glucose-6-phosphate", "Fructose-6-phosphate", "3-Phosphoglycerate", "1,3-BPG donates phosphate to ADP through phosphoglycerate kinase."],
  ["carbohydrate metabolism", "Which enzyme reduces pyruvate to lactate while regenerating NAD+?", "Lactate dehydrogenase", "Pyruvate dehydrogenase", "Malate dehydrogenase", "Glucose-6-phosphate dehydrogenase", "LDH transfers reducing equivalents from NADH to pyruvate, allowing anaerobic glycolysis to continue."],
  ["carbohydrate metabolism", "How much ATP does glycolysis form per glucose before and after subtracting the investment phase?", "4 gross and 2 net", "2 gross and 2 net", "6 gross and 4 net", "4 gross and 4 net", "Glycolysis makes four ATP but consumes two, yielding two ATP net."],
  ["bioenergetics", "Using modern P/O ratios, approximately how much ATP is produced by complete oxidation of one glucose?", "30–32 ATP", "36–38 ATP", "4 ATP", "106 ATP", "Modern estimates account for shuttle choice and give about 30–32 ATP per glucose."],
  ["carbohydrate metabolism", "How do mature erythrocytes obtain ATP?", "Anaerobic glycolysis", "TCA cycle", "Fatty-acid beta-oxidation", "Ketone-body oxidation", "Mature RBCs lack mitochondria and therefore depend entirely on anaerobic glycolysis."],
  ["carbohydrate metabolism", "Why can pyruvate-kinase deficiency cause hemolytic anemia?", "It lowers erythrocyte ATP production", "It blocks heme oxygenase", "It increases mitochondrial ROS", "It prevents beta-oxidation", "RBCs depend on glycolysis, so impaired pyruvate kinase depletes ATP and destabilizes the membrane."],
  ["carbohydrate metabolism", "What are the two major products of the pentose phosphate pathway?", "NADPH and ribose-5-phosphate", "ATP and lactate", "FADH2 and acetyl-CoA", "NADH and glucose", "The PPP supplies reducing power as NADPH and pentoses for nucleotide synthesis."],
  ["carbohydrate metabolism", "What is the major protective role of G6PD-derived NADPH in erythrocytes?", "Maintaining glutathione in its reduced form", "Producing mitochondrial ATP", "Making urea", "Activating glycogen phosphorylase", "NADPH permits glutathione reductase to maintain reduced glutathione against oxidant stress."],
  ["carbohydrate metabolism", "What commonly precipitates hemolysis in G6PD deficiency?", "Oxidant stress from infection, drugs, or fava beans", "A high-protein meal", "Vitamin C deficiency alone", "Hyperinsulinemia", "Without adequate NADPH, oxidant exposures damage hemoglobin and the RBC membrane."],
  ["carbohydrate metabolism", "Which description best fits GLUT2?", "An insulin-independent bidirectional transporter in liver and pancreatic beta cells", "An insulin-responsive transporter in muscle and adipose", "A sodium-glucose cotransporter in intestine", "A fructose-only transporter", "GLUT2 has high capacity and supports bidirectional hepatic glucose movement and beta-cell sensing."],
  ["carbohydrate metabolism", "Which transporter mediates insulin-stimulated glucose uptake in skeletal muscle and adipose tissue?", "GLUT4", "GLUT1", "GLUT2", "SGLT1", "Insulin triggers translocation of GLUT4 vesicles to the plasma membrane."],
  ["carbohydrate metabolism", "What is the central purpose of the Cori cycle?", "Return muscle or RBC lactate to liver for gluconeogenesis", "Carry ketones from liver to brain", "Move cholesterol from tissues to liver", "Convert ammonia directly to uric acid", "The liver converts circulating lactate back to glucose, which can return to peripheral tissues."],
  ["carbohydrate metabolism", "What product does glycogen phosphorylase release from glycogen?", "Glucose-1-phosphate", "Free glucose only", "Glucose-6-phosphate", "UDP-glucose", "Phosphorolysis of alpha-1,4 bonds releases glucose-1-phosphate."],
  ["carbohydrate metabolism", "What activated glucose donor is used for glycogen synthesis?", "UDP-glucose", "ADP-glucose", "GDP-glucose", "Free glucose", "Mammalian glycogen synthase transfers glucosyl units from UDP-glucose."],
  ["carbohydrate metabolism", "Where does glycogen synthesis occur?", "Cytosol of liver and skeletal muscle cells", "Mitochondrial matrix", "Lysosomal lumen", "Nuclear matrix", "Glycogen granules and their synthetic enzymes are cytosolic."],
  ["carbohydrate metabolism", "Which defect causes Pompe disease?", "Lysosomal acid alpha-glucosidase deficiency", "Muscle glycogen phosphorylase deficiency", "Glucose-6-phosphatase deficiency", "Debranching enzyme deficiency", "Pompe is glycogen storage disease II caused by deficient lysosomal acid maltase."],
  ["carbohydrate metabolism", "Which enzyme is deficient in classic galactosemia?", "Galactose-1-phosphate uridyltransferase", "Galactokinase", "Aldolase B", "Fructokinase", "Classic galactosemia is caused by GALT deficiency and accumulation of galactose-1-phosphate."],
  ["carbohydrate metabolism", "How many pyruvate molecules are required to synthesize one glucose by gluconeogenesis?", "Two", "One", "Three", "Four", "One six-carbon glucose is formed from two three-carbon pyruvate molecules."],
  ["carbohydrate metabolism", "Which enzyme is not a gluconeogenic bypass enzyme?", "Glycogen phosphorylase", "PEP carboxykinase", "Fructose-1,6-bisphosphatase", "Glucose-6-phosphatase", "Glycogen phosphorylase belongs to glycogenolysis, not the gluconeogenic bypass pathway."],
  ["carbohydrate metabolism", "What is a major consequence of impaired hepatic gluconeogenesis?", "Fasting hypoglycemia", "Postprandial hypercalcemia", "Respiratory alkalosis", "Hyperuricemia in every case", "Hepatic gluconeogenesis is essential for maintaining plasma glucose during fasting."],
  ["carbohydrate metabolism", "Which enzyme predominantly phosphorylates glucose in hepatocytes after a carbohydrate-rich meal?", "Glucokinase", "Glucose-6-phosphatase", "Glycogen phosphorylase", "Fructose-1,6-bisphosphatase", "Hepatic glucokinase has a high Km and high capacity for postprandial glucose."],
  ["carbohydrate metabolism", "How is the pyruvate dehydrogenase complex activated?", "Dephosphorylation", "Phosphorylation by PDH kinase", "Ubiquitination", "Proteolytic cleavage", "PDH phosphatase removes inhibitory phosphate groups from the complex."],
  ["bioenergetics", "During skeletal-muscle contraction, how do ADP and calcium affect oxidative metabolism?", "They stimulate ATP production and TCA dehydrogenases", "They shut down the TCA cycle", "They inhibit electron transport", "They activate glycogen synthase only", "ADP signals energy demand, while calcium activates key mitochondrial dehydrogenases."],
  ["bioenergetics", "In the canonical GDP-linked TCA reaction, what does succinyl-CoA synthetase produce?", "GTP", "NADH", "FADH2", "cAMP", "Succinyl-CoA synthetase performs substrate-level phosphorylation of GDP to GTP."],

  // Lipid metabolism.
  ["cholesterol and lipoprotein metabolism", "What is the main function of LDL?", "Deliver cholesterol to peripheral tissues through LDL receptors", "Remove cholesterol from tissues to liver", "Hydrolyze dietary TAG in the gut", "Carry free fatty acids bound to albumin", "LDL is the major cholesterol-delivery lipoprotein and is internalized through LDL receptors."],
  ["cholesterol and lipoprotein metabolism", "What is a central function of HDL?", "Reverse cholesterol transport to the liver", "Deliver dietary TAG from intestine", "Deliver endogenous TAG from liver", "Transport free fatty acids from adipose", "HDL accepts peripheral cholesterol; LCAT esterifies it for reverse transport."],
  ["cholesterol and lipoprotein metabolism", "What reaction is catalyzed by lipoprotein lipase?", "Hydrolysis of TAG in chylomicrons and VLDL", "Synthesis of cholesterol in liver", "Esterification of HDL cholesterol", "Release of bile acids into intestine", "Endothelial LPL releases fatty acids from circulating TAG-rich lipoproteins."],
  ["cholesterol and lipoprotein metabolism", "Lipoprotein-lipase deficiency classically causes which disorder?", "Familial chylomicronemia syndrome", "Familial hypercholesterolemia", "Abetalipoproteinemia", "Tangier disease", "Absent LPL activity produces severe fasting chylomicronemia, formerly type I hyperlipoproteinemia."],
  ["cholesterol and lipoprotein metabolism", "Which enzyme helps remodel IDL toward LDL?", "Hepatic lipase", "Pancreatic lipase", "Hormone-sensitive lipase", "LCAT", "Hepatic lipase removes residual TAG and phospholipid from remnant particles."],
  ["fatty acid and ketone metabolism", "How are nonesterified fatty acids transported in plasma?", "Bound to albumin", "Inside LDL", "Bound to hemoglobin", "As free micelles", "Hydrophobic nonesterified fatty acids circulate noncovalently bound to albumin."],
  ["dietary lipid metabolism", "How are short- and medium-chain fatty acids absorbed?", "They pass directly into portal blood", "They require chylomicron assembly", "They first enter HDL", "They require the carnitine shuttle in enterocytes", "Their relative water solubility permits direct portal transport, unlike most long-chain fatty acids."],
  ["dietary lipid metabolism", "What is the mechanism of orlistat?", "Inhibition of gastric and pancreatic lipases", "Blockade of NPC1L1", "Inhibition of HMG-CoA reductase", "Activation of LPL", "Orlistat reduces dietary TAG digestion by covalently inhibiting luminal lipases."],
  ["cholesterol and lipoprotein metabolism", "What is the mechanism of ezetimibe?", "Blockade of intestinal NPC1L1 cholesterol uptake", "Inhibition of pancreatic lipase", "Binding of bile acids in the lumen", "Inhibition of HMG-CoA reductase", "Ezetimibe blocks the NPC1L1 sterol transporter at the intestinal brush border."],
  ["cholesterol and lipoprotein metabolism", "What enzyme is competitively inhibited by statins?", "HMG-CoA reductase", "HMG-CoA synthase", "Cholesterol 7-alpha-hydroxylase", "Acetyl-CoA carboxylase", "Statins inhibit the rate-limiting reductase in cholesterol biosynthesis."],
  ["cholesterol and lipoprotein metabolism", "How do bile-acid sequestrants lower LDL cholesterol?", "They interrupt bile-acid reabsorption and increase hepatic cholesterol conversion to bile acids", "They directly inhibit pancreatic lipase", "They activate intestinal NPC1L1", "They inhibit LCAT", "Fecal bile-acid loss drives hepatic cholesterol use and increases LDL-receptor expression."],
  ["cholesterol and lipoprotein metabolism", "What is the rate-limiting enzyme of cholesterol synthesis?", "HMG-CoA reductase", "HMG-CoA lyase", "Lipoprotein lipase", "CYP7A1", "HMG-CoA reductase converts HMG-CoA to mevalonate in the committed regulatory step."],
  ["cholesterol and lipoprotein metabolism", "What is the rate-limiting enzyme in bile-acid synthesis?", "Cholesterol 7-alpha-hydroxylase", "HMG-CoA reductase", "LCAT", "Acyl-CoA cholesterol acyltransferase", "CYP7A1 initiates the classic pathway and is feedback-inhibited by bile acids."],
  ["cholesterol and lipoprotein metabolism", "How do bile acids regulate their own synthesis?", "They suppress cholesterol 7-alpha-hydroxylase", "They activate HMG-CoA reductase", "They inhibit lipoprotein lipase", "They activate pancreatic lipase transcription", "Bile-acid feedback lowers CYP7A1 expression and activity."],
  ["fatty acid and ketone metabolism", "Which set contains only ketone bodies?", "Acetoacetate, beta-hydroxybutyrate, and acetone", "Acetyl-CoA, citrate, and malate", "Lactate, pyruvate, and alanine", "Palmitate, stearate, and oleate", "The three ketone bodies are acetoacetate, beta-hydroxybutyrate, and acetone."],
  ["fatty acid and ketone metabolism", "Which hormonal state promotes ketogenesis?", "Low insulin with high glucagon", "High insulin with low glucagon", "High insulin with high malonyl-CoA", "Low glucagon after a carbohydrate meal", "Low insulin permits adipose lipolysis and high glucagon favors hepatic fatty-acid oxidation and ketogenesis."],
  ["fatty acid and ketone metabolism", "What is the rate-limiting enzyme of hepatic ketogenesis?", "Mitochondrial HMG-CoA synthase", "HMG-CoA lyase", "Cytosolic HMG-CoA synthase", "HMG-CoA reductase", "Mitochondrial HMGCS2 is the regulated, rate-limiting ketogenesis enzyme; lyase acts downstream."],
  ["fatty acid and ketone metabolism", "Why does liver produce but not consume ketone bodies?", "It lacks succinyl-CoA:acetoacetate CoA transferase", "It lacks mitochondria", "It lacks HMG-CoA synthase", "It cannot oxidize fatty acids", "Hepatocytes lack thiophorase, the enzyme needed to activate acetoacetate for oxidation."],
  ["fatty acid and ketone metabolism", "Which tissues can use ketone bodies during prolonged fasting?", "Extrahepatic tissues including brain", "Liver only", "Erythrocytes only", "Adipose tissue only", "Extrahepatic mitochondria can oxidize ketones; brain use rises during prolonged fasting."],
  ["feed-fast cycle", "What fuel does skeletal muscle favor late in prolonged starvation?", "Fatty acids", "Ketone bodies exclusively", "Glucose exclusively", "Amino acids exclusively", "Muscle reduces ketone uptake and relies largely on fatty acids, helping spare ketones for brain."],
  ["fatty acid and ketone metabolism", "Where does most fatty-acid beta-oxidation occur?", "Mitochondrial matrix", "Cytosol", "Golgi lumen", "Nucleus", "Most fatty-acid oxidation occurs in the mitochondrial matrix; very-long-chain fatty acids begin in peroxisomes."],
  ["fatty acid and ketone metabolism", "Why can even-chain fatty acids not yield net glucose in humans?", "Their acetyl-CoA carbons are lost in the TCA cycle and PDH is irreversible", "They cannot enter mitochondria", "They contain no carbon", "They are converted directly to glycogen", "Humans cannot convert acetyl-CoA back to pyruvate, and TCA entry gives no net oxaloacetate gain."],
  ["fatty acid and ketone metabolism", "What is the purpose of the carnitine shuttle?", "Transport long-chain fatty acyl groups into the mitochondrial matrix", "Export ketones from liver", "Import glucose into muscle", "Transport cholesterol into lysosomes", "CPT-I, translocase, and CPT-II move long-chain acyl groups across the inner mitochondrial membrane."],
  ["lipid metabolism", "How is cytosolic acetyl-CoA supplied for fatty-acid synthesis?", "Citrate export followed by ATP-citrate lyase", "Direct acetyl-CoA diffusion through the inner membrane", "Carnitine-mediated acetyl-CoA import", "Beta-oxidation in cytosol", "Mitochondrial citrate carries acetyl units to cytosol, where ATP-citrate lyase regenerates acetyl-CoA."],
  ["fatty acid and ketone metabolism", "What TCA intermediate is formed from the propionyl-CoA end of an odd-chain fatty acid?", "Succinyl-CoA", "Citrate", "Acetyl-CoA", "Oxaloacetate directly", "Propionyl-CoA is carboxylated and rearranged to succinyl-CoA."],
  ["fatty acid and ketone metabolism", "Why does oxidation of pentadecanoate yield less energy than a comparable even-chain fatty acid?", "It ends with propionyl-CoA, whose conversion is less energy-rich than another acetyl-CoA", "It cannot undergo beta-oxidation", "It makes no NADH", "It blocks the TCA cycle", "Odd-chain oxidation leaves propionyl-CoA rather than a final acetyl-CoA pair."],
  ["fatty acid and ketone metabolism", "What is the modern net ATP yield from complete oxidation of palmitate?", "106 ATP", "129 ATP", "38 ATP", "30 ATP", "Seven cycles plus eight acetyl-CoA give 108 ATP before subtracting two for activation, for 106 net."],
  ["fatty acid and ketone metabolism", "What reducing equivalents are produced in each standard beta-oxidation cycle?", "One FADH2 and one NADH", "Two NADPH", "One GTP and one ATP", "Two FADH2 and no NADH", "The acyl-CoA and hydroxyacyl-CoA dehydrogenation steps produce FADH2 and NADH respectively."],
  ["fatty acid and ketone metabolism", "What happens to water during the hydration step of beta-oxidation?", "Water is consumed", "Water is produced", "Water is not involved", "Water is converted to peroxide", "Enoyl-CoA hydratase adds water across the trans double bond."],
  ["lipid metabolism", "Which enzyme supplies NADPH while converting malate to pyruvate?", "Malic enzyme", "Cytosolic malate dehydrogenase", "Pyruvate carboxylase", "Succinate dehydrogenase", "NADP-dependent malic enzyme produces pyruvate, CO2, and NADPH."],
  ["lipid metabolism", "Which metabolite directly activates acetyl-CoA carboxylase?", "Citrate", "Palmitoyl-CoA", "Malonyl-CoA", "Carnitine", "Citrate promotes ACC polymerization; long-chain acyl-CoA products oppose it."],
  ["lipid metabolism", "What are the two key roles of malonyl-CoA?", "Fatty-acid synthesis substrate and CPT-I inhibitor", "Ketone body and LPL activator", "Bile acid precursor and lipase inhibitor", "Cholesterol carrier and uncoupler", "Malonyl-CoA donates two-carbon units to fatty-acid synthase and prevents simultaneous mitochondrial import for oxidation."],
  ["feed-fast cycle", "Which pattern characterizes the fed lipogenic state?", "Active ACC and fatty-acid synthase with suppressed CPT-I", "Inactive ACC with active CPT-I", "High ketogenesis with high glucagon", "High adipose lipolysis with low insulin", "Insulin favors fatty-acid synthesis; malonyl-CoA then inhibits CPT-I."],
  ["lipid metabolism", "Which enzyme initiates adipose triacylglycerol lipolysis?", "Adipose triglyceride lipase", "Hormone-sensitive lipase", "Lipoprotein lipase", "Pancreatic lipase", "ATGL performs the major TAG-to-DAG step; HSL preferentially hydrolyzes DAG."],
  ["feed-fast cycle", "Which change promotes adipose fatty-acid release during fasting?", "Low insulin with catecholamine signaling", "High insulin with active phosphodiesterase", "High malonyl-CoA", "High glucose uptake through GLUT4", "Falling insulin and catecholamine signaling permit phosphorylation-driven lipolysis."],
  ["lipid metabolism", "Where does fatty-acid desaturation occur, and what is a key human limitation?", "Smooth ER; humans cannot introduce double bonds beyond delta-9", "Mitochondrial matrix; humans cannot make cis bonds", "Nucleus; humans cannot desaturate stearate", "Lysosome; humans cannot make oleate", "ER desaturases introduce cis bonds, but humans lack enzymes for double bonds beyond carbon 9 from the carboxyl end."],
  ["dietary lipid metabolism", "Which condition can cause steatorrhea?", "Pancreatic insufficiency", "Isolated essential hypertension", "Uncomplicated iron deficiency", "Hyperventilation", "Poor pancreatic enzymes, deficient bile delivery, or reduced absorptive surface can all cause fat malabsorption."],
  ["lipid metabolism", "What is a common hepatic effect of sustained high-carbohydrate intake?", "Increased TAG synthesis and VLDL secretion", "Complete suppression of lipogenesis", "Immediate ketogenesis", "Loss of cytosolic acetyl-CoA", "Excess carbohydrate supplies acetyl-CoA and glycerol-3-phosphate for hepatic TAG and VLDL production."],

  // Amino acids, proteins, and nitrogen.
  ["amino acid metabolism", "Which amino acids are poorly reabsorbed in cystinuria?", "Cystine, ornithine, lysine, and arginine", "Glycine, alanine, serine, and valine", "Phenylalanine, tyrosine, and tryptophan", "Glutamate and aspartate only", "The COLA amino acids share the defective dibasic amino-acid transporter."],
  ["amino acid metabolism", "Which amino acids contribute to creatine synthesis?", "Arginine, glycine, and methionine", "Leucine, lysine, and valine", "Phenylalanine, tyrosine, and tryptophan", "Aspartate, glutamate, and glutamine", "Arginine and glycine form guanidinoacetate, which receives a methyl group from SAM derived from methionine."],
  ["amino acid metabolism", "How is creatinine formed?", "Spontaneous nonenzymatic cyclization of creatine or phosphocreatine", "Proteolysis by trypsin", "Oxidation by xanthine oxidase", "Transamination by PLP", "Creatinine forms at a relatively constant rate by spontaneous cyclization."],
  ["amino acid metabolism", "What is the immediate energetic role of phosphocreatine?", "Rapid donation of phosphate to ADP through creatine kinase", "Long-term storage of glucose", "Transport of ammonia to liver", "Activation of fatty acids", "The creatine kinase reaction rapidly buffers ATP during abrupt energy demand."],
  ["amino acid metabolism", "What obligatory activator stimulates carbamoyl-phosphate synthetase I?", "N-Acetylglutamate", "Citrate", "Malonyl-CoA", "Glutathione", "Mitochondrial CPS-I requires N-acetylglutamate for urea-cycle flux."],
  ["amino acid metabolism", "Which molecule provides the second nitrogen of urea?", "Aspartate", "Free ammonia", "Alanine", "Glutamine directly", "Free ammonia supplies one nitrogen through carbamoyl phosphate; aspartate supplies the second."],
  ["amino acid metabolism", "What does arginase produce in the final urea-cycle reaction?", "Urea and ornithine", "Citrulline and ammonia", "Argininosuccinate and fumarate", "Carbamoyl phosphate and aspartate", "Hydrolysis of arginine releases urea and regenerates ornithine."],
  ["amino acid metabolism", "What is the major nonprotein nitrogen compound in blood?", "Urea", "Uric acid", "Creatinine", "Ammonia", "Urea is quantitatively the major circulating nonprotein nitrogen product."],
  ["amino acid metabolism", "Which coenzyme is required by aminotransferases?", "Pyridoxal phosphate", "Biotin", "FAD", "Tetrahydrofolate", "PLP, derived from vitamin B6, transiently carries amino groups."],
  ["amino acid metabolism", "Which reaction is catalyzed by AST?", "Aspartate plus alpha-ketoglutarate to oxaloacetate plus glutamate", "Alanine plus alpha-ketoglutarate to pyruvate plus glutamate", "Glutamate to GABA", "Arginine to urea and ornithine", "AST transfers the amino group of aspartate to alpha-ketoglutarate."],
  ["amino acid metabolism", "What cofactors participate when serine is converted to glycine?", "PLP directly and tetrahydrofolate as one-carbon acceptor", "Biotin only", "Vitamin B12 only", "FAD and NAD+", "Serine hydroxymethyltransferase is PLP-dependent and transfers a one-carbon unit to THF."],
  ["amino acid metabolism", "Which amino acid supplies the carbon skeleton of carnitine?", "Lysine", "Leucine", "Glycine", "Aspartate", "Trimethyllysine supplies the carnitine skeleton, while methionine supplies methyl groups."],
  ["amino acid metabolism", "Which two amino acids are exclusively ketogenic?", "Leucine and lysine", "Valine and isoleucine", "Alanine and glycine", "Phenylalanine and tyrosine", "Only leucine and lysine yield no net glucogenic product."],
  ["amino acid metabolism", "Which enzyme complex is deficient in maple syrup urine disease?", "Branched-chain alpha-ketoacid dehydrogenase", "Phenylalanine hydroxylase", "Homogentisate dioxygenase", "Cystathionine beta-synthase", "MSUD blocks degradation of leucine, isoleucine, and valine after transamination."],
  ["amino acid metabolism", "Which enzyme is deficient in alkaptonuria?", "Homogentisate dioxygenase", "Tyrosinase", "Phenylalanine hydroxylase", "Branched-chain alpha-ketoacid dehydrogenase", "Homogentisate accumulation causes dark urine and ochronosis."],
  ["amino acid metabolism", "What is the usual biochemical defect in classic phenylketonuria?", "Phenylalanine hydroxylase deficiency", "Tyrosinase deficiency", "Homogentisate dioxygenase deficiency", "Arginase deficiency", "Failure to hydroxylate phenylalanine to tyrosine causes classic PKU; BH4 defects are an important alternative."],
  ["amino acid metabolism", "What is the principal activated methyl donor derived from methionine?", "S-Adenosylmethionine", "Tetrahydrobiopterin", "Carbamoyl phosphate", "UDP-glucose", "Methionine is activated to SAM, the major methyl donor in human metabolism."],
  ["amino acid metabolism", "How is histamine synthesized?", "Decarboxylation of histidine", "Hydroxylation of histidine", "Transamination of histamine", "Methylation of glycine", "Histidine decarboxylase, a PLP-dependent enzyme, forms histamine."],
  ["amino acids", "Which amino acid is nonessential in healthy adults?", "Serine", "Leucine", "Lysine", "Tryptophan", "Serine can be synthesized from the glycolytic intermediate 3-phosphoglycerate."],
  ["amino acid metabolism", "How are most amino acids taken up across the apical membrane of enterocytes?", "Sodium-dependent secondary active transport", "Simple diffusion", "Primary active ATPase transport for every amino acid", "LDL-receptor endocytosis", "Apical amino-acid uptake is commonly coupled to the sodium gradient."],
  ["amino acid metabolism", "How do amino acids usually leave the basolateral side of an enterocyte for portal blood?", "Facilitated transport", "Sodium-dependent apical cotransport", "Phagocytosis", "Covalent binding to albumin", "Basolateral carriers mediate facilitated amino-acid exit down their gradients."],
  ["amino acid metabolism", "What is the detoxifying role of glutamine synthetase?", "Incorporate free ammonia into glutamine", "Release ammonia from glutamine", "Convert urea to ammonia", "Produce uric acid from purines", "The ATP-dependent reaction traps toxic ammonia in the nontoxic carrier glutamine."],
  ["amino acid metabolism", "Which amino acid is the characteristic nitrogen carrier from muscle to liver in the glucose–alanine cycle?", "Alanine", "Leucine", "Serine", "Histidine", "Alanine carries amino nitrogen and a pyruvate carbon skeleton from muscle to liver."],
  ["protein metabolism", "What is the role of ubiquitin in protein degradation?", "Mark proteins for ATP-dependent proteasomal destruction", "Hydrolyze peptide bonds in the stomach", "Fold proteins in the ER lumen", "Activate ribosomal translation", "Polyubiquitin chains target selected cytosolic proteins to the 26S proteasome."],
  ["protein metabolism", "Which enzyme activates chymotrypsinogen in the intestinal lumen?", "Trypsin", "Pepsin", "Enteropeptidase directly", "Pancreatic amylase", "Trypsin cleaves chymotrypsinogen after enteropeptidase has initiated trypsin activation."],

  // Nucleotides, heme, and clinical chemistry.
  ["nucleotide metabolism", "What is the final product of purine degradation in humans?", "Uric acid", "Allantoin", "Urea", "Creatinine", "Humans lack uricase, so purine breakdown terminates at uric acid."],
  ["nucleotide metabolism", "Which enzyme is deficient in Lesch–Nyhan syndrome?", "HGPRT", "Adenosine deaminase", "Xanthine oxidase", "Dihydrofolate reductase", "HGPRT deficiency blocks hypoxanthine and guanine salvage and increases urate production."],
  ["nucleotide metabolism", "How can adenosine-deaminase deficiency cause SCID?", "Toxic deoxyadenosine and dATP accumulate in lymphocytes", "Uric acid directly destroys neutrophils", "Thymidylate synthase is activated", "Purine salvage becomes excessive", "ADA deficiency raises dATP, which impairs DNA synthesis and is toxic to developing lymphocytes."],
  ["nucleotide metabolism", "What is the first fully formed nucleotide in de novo purine synthesis?", "IMP", "AMP", "GMP", "UMP", "The purine ring is assembled on ribose phosphate to form IMP before branching to AMP and GMP."],
  ["nucleotide metabolism", "Which amino acid is not a carbon or nitrogen donor to the pyrimidine ring?", "Glycine", "Aspartate", "Glutamine", "None; all three are donors", "Pyrimidines use aspartate and carbamoyl phosphate; glycine contributes to the purine ring instead."],
  ["nucleotide metabolism", "Which statement distinguishes purine from pyrimidine synthesis?", "Glycine contributes to purines but not pyrimidines", "Aspartate contributes only to pyrimidines", "Glutamine contributes only to purines", "Carbon dioxide contributes to neither", "Glutamine, aspartate, and CO2 participate in both pathways, whereas glycine is purine-specific."],
  ["nucleotide metabolism", "What enzyme is inhibited by allopurinol?", "Xanthine oxidase", "HGPRT", "Adenosine deaminase", "Thymidylate synthase", "Allopurinol lowers uric acid by inhibiting xanthine oxidase."],
  ["nucleotide metabolism", "What enzyme is inhibited by the active metabolite of 5-fluorouracil?", "Thymidylate synthase", "Thymidine kinase", "IMP dehydrogenase", "Ribonucleotide reductase", "FdUMP forms a stable complex with thymidylate synthase and blocks dTMP synthesis."],
  ["nucleotide metabolism", "What enzyme is inhibited by mycophenolate?", "IMP dehydrogenase", "Xanthine oxidase", "Dihydrofolate reductase", "HGPRT", "Mycophenolic acid impairs guanine nucleotide synthesis by inhibiting IMP dehydrogenase."],
  ["nucleotide metabolism", "How does Fanconi syndrome tend to affect uric acid?", "It causes renal urate wasting", "It always causes urate overproduction", "It blocks xanthine oxidase", "It increases HGPRT activity", "Generalized proximal-tubule dysfunction reduces urate reabsorption and may cause hypouricemia."],
  ["heme metabolism", "What is the rate-limiting enzyme of heme synthesis?", "ALA synthase", "ALA dehydratase", "Ferrochelatase", "Heme oxygenase", "Mitochondrial ALA synthase catalyzes the regulated first step of heme synthesis."],
  ["heme metabolism", "Which enzyme is deficient in porphyria cutanea tarda?", "Uroporphyrinogen decarboxylase", "Porphobilinogen deaminase", "Ferrochelatase", "ALA synthase", "UROD deficiency leads to photosensitive porphyrin accumulation in PCT."],
  ["heme metabolism", "What does heme oxygenase require and release when opening the heme ring?", "Oxygen and NADPH; carbon monoxide is released", "ATP and biotin; ammonia is released", "FAD and glucose; methane is released", "PLP and folate; urea is released", "Heme oxygenase uses O2 and reducing power, generating biliverdin, iron, and carbon monoxide."],
  ["heme metabolism", "Which enzyme opens the porphyrin ring during heme degradation?", "Heme oxygenase", "Biliverdin reductase", "Ferrochelatase", "ALA dehydratase", "Heme oxygenase cleaves the alpha-methene bridge to form biliverdin."],
  ["heme metabolism", "What bilirubin pattern is expected in complete extrahepatic biliary obstruction?", "Predominantly conjugated hyperbilirubinemia", "Predominantly unconjugated hyperbilirubinemia", "No bilirubin increase", "Only urinary urobilinogen increases", "Conjugated bilirubin refluxes into plasma when bile flow is obstructed."],
  ["clinical biochemistry", "Which plasma analyte is measured to assess jaundice directly?", "Bilirubin", "Creatinine", "Albumin only", "Urea", "Jaundice reflects bilirubin accumulation in plasma and tissues."],
  ["heme metabolism", "What pigment is produced when urinary urobilinogen is oxidized?", "Urobilin", "Stercobilinogen", "Biliverdin", "Hemosiderin", "Oxidation of urinary urobilinogen produces the yellow pigment urobilin."],
  ["heme metabolism", "Which urinary urobilinogen pattern is most consistent with complete biliary obstruction?", "Absent or markedly reduced", "Markedly increased from intestinal bilirubin delivery", "Always normal", "Converted entirely to conjugated bilirubin in urine", "No bilirubin reaches the intestine, so bacterial urobilinogen formation falls or disappears."],
  ["clinical biochemistry", "Which enzyme is a sensitive marker of skeletal-muscle necrosis in rhabdomyolysis?", "Creatine kinase", "Alkaline phosphatase", "Amylase", "Gamma-glutamyl transferase", "CK is abundant in skeletal muscle and rises markedly after myocyte injury."],
  ["clinical biochemistry", "What are the two major tissue sources of serum alkaline phosphatase?", "Liver/biliary tract and bone", "Heart and pancreas", "Brain and skeletal muscle", "Kidney and thyroid only", "The clinically dominant ALP isoenzymes arise from hepatobiliary epithelium and osteoblasts."],
  ["clinical biochemistry", "Which aminotransferase is more liver-enriched?", "ALT", "AST", "Creatine kinase", "Amylase", "ALT is more liver-enriched than AST, although neither is absolutely organ-specific."],
  ["clinical biochemistry", "Which small enzyme is normally filtered and can be detected in urine?", "Amylase", "Lipoprotein lipase", "ALT", "Alkaline phosphatase", "Amylase is small enough to undergo glomerular filtration."],
  ["clinical biochemistry", "Which enzyme is not a pancreatic digestive enzyme?", "Aldolase", "Trypsin", "Pancreatic lipase", "Amylase", "Aldolase is an intracellular glycolytic enzyme, not a pancreatic luminal digestive enzyme."],

  // ETC and oxidative phosphorylation.
  ["bioenergetics", "Which respiratory-chain complex does not pump protons?", "Complex II", "Complex I", "Complex III", "Complex IV", "Succinate–Q reductase transfers electrons to ubiquinone but does not pump protons."],
  ["bioenergetics", "Cytochromes a and a3 are components of which respiratory complex?", "Complex IV", "Complex I", "Complex II", "Complex III", "Cytochrome-c oxidase, Complex IV, contains cytochromes a and a3."],
  ["bioenergetics", "Atractyloside inhibits which mitochondrial transporter?", "Adenine nucleotide translocase", "Carnitine-acylcarnitine translocase", "Phosphate translocase", "Pyruvate carrier", "Atractyloside blocks ADP/ATP exchange across the inner mitochondrial membrane."],
  ["bioenergetics", "What is the electron-transfer role of cytochrome c?", "It carries electrons from Complex III to Complex IV", "It transfers electrons from Complex I to II", "It pumps protons at Complex II", "It reduces NAD+ in the matrix", "Cytochrome c is the mobile intermembrane-space carrier between Complexes III and IV."],
  ["bioenergetics", "In which complex is FAD covalently associated with succinate dehydrogenase?", "Complex II", "Complex I", "Complex III", "Complex IV", "Succinate dehydrogenase is both a TCA enzyme and the FAD-containing Complex II."],
  ["bioenergetics", "Which statement best describes dehydrogenases?", "They transfer hydrogen or electrons without directly using molecular oxygen", "They always use oxygen as a substrate", "They hydrolyze peptide bonds", "They synthesize ATP directly in every reaction", "Dehydrogenases use carriers such as NAD+ or FAD; oxidases use O2 directly."],

  // Unique, medically valid cores present only in the new photo papers.
  ["carbohydrate structure", "What type of linkage does the ring oxygen of a cyclic pyranose sugar represent?", "An ether-like C–O–C linkage", "A peptide bond", "A phosphodiester bond", "A disulfide bond", "Cyclization creates a hemiacetal containing a ring oxygen bonded to two carbons."],
  ["enzyme kinetics", "What does the induced-fit model propose?", "Substrate binding induces a conformational change in the enzyme active site", "The active site is permanently rigid", "Enzymes change the reaction equilibrium", "Substrates are covalently incorporated into every enzyme", "Binding energy drives active-site rearrangement that improves catalytic alignment."],
  ["enzyme kinetics", "What is the shape of a Michaelis–Menten plot of initial velocity against substrate concentration?", "A rectangular hyperbola approaching Vmax", "A straight line through the origin at all concentrations", "A bell-shaped curve", "A vertical line at Km", "Saturation causes velocity to asymptotically approach Vmax."],
  ["enzyme regulation", "How does reversible phosphorylation commonly alter enzyme activity?", "It induces a conformational change", "It permanently destroys the enzyme", "It changes the reaction equilibrium constant", "It removes every amino acid side chain", "Kinases add and phosphatases remove phosphate, changing electrostatics and conformation."],
  ["carbohydrate structure", "Which of the following is not a disaccharide?", "Hyaluronic acid", "Maltose", "Lactose", "Sucrose", "Hyaluronic acid is a glycosaminoglycan polymer made of repeating disaccharide units."],
  ["carbohydrate structure", "What is the main storage polysaccharide in plants?", "Starch", "Glycogen", "Cellulose", "Hyaluronic acid", "Plants store glucose mainly as amylose and amylopectin, collectively called starch."],
  ["carbohydrate structure", "What are two stereoisomers that differ at exactly one chiral carbon called?", "Epimers", "Enantiomers", "Anomers only", "Constitutional isomers", "Epimers differ in configuration at one, and only one, stereogenic center."],
  ["carbohydrate structure", "Which polymer consists of beta(1→4)-linked glucose residues?", "Cellulose", "Amylose", "Glycogen", "Dextran", "Cellulose is a linear beta(1→4) glucan that humans cannot digest."],
  ["vitamins", "Which vitamin-derived hormone increases renal tubular calcium reabsorption?", "Calcitriol", "Vitamin C", "Vitamin K", "Niacin", "Active vitamin D increases intestinal calcium absorption and supports renal calcium conservation."],
  ["vitamins", "Deficiency of which vitamin increases neural-tube-defect risk?", "Folate", "Vitamin B12 only", "Vitamin C", "Vitamin K", "Periconceptional folate is required for one-carbon metabolism and neural-tube closure."],
  ["lipids", "What is the major storage form of lipid in humans?", "Triacylglycerol", "Free cholesterol", "Phosphatidylcholine", "Sphingomyelin", "Triacylglycerol stores reduced carbon compactly and without associated water in adipose tissue."],
  ["cholesterol and lipoprotein metabolism", "What is the obligatory structural apolipoprotein of chylomicrons?", "ApoB-48", "ApoB-100", "ApoA-I", "ApoC-II", "Intestinal ApoB-48 remains with each chylomicron and its remnant throughout particle metabolism."],
  ["heme metabolism", "Which defect causes acute intermittent porphyria?", "Porphobilinogen deaminase deficiency", "Uroporphyrinogen decarboxylase deficiency", "Ferrochelatase deficiency", "Heme oxygenase deficiency", "HMBS deficiency causes neurovisceral attacks without the cutaneous photosensitivity typical of several other porphyrias."],
  ["heme metabolism", "What biochemical pattern characterizes Gilbert syndrome?", "Benign intermittent unconjugated hyperbilirubinemia from reduced UGT1A1 activity", "Severe conjugated hyperbilirubinemia from bile-duct obstruction", "Complete absence of heme synthesis", "Hemolysis from G6PD deficiency", "Reduced bilirubin glucuronidation causes mild unconjugated hyperbilirubinemia, often during fasting or illness."],
  ["heme metabolism", "What is the correct treatment principle for physiologic neonatal jaundice when therapy is indicated?", "Blue or blue-green light converts unconjugated bilirubin to excretable photoisomers", "Ultraviolet light conjugates bilirubin in liver", "Exchange transfusion is required in every newborn", "Bile-acid sequestrants activate UGT1A1", "Phototherapy around 460–490 nm increases elimination of unconjugated bilirubin without requiring hepatic conjugation."],
  ["amino acid metabolism", "Which amino acid is the precursor for melanin synthesis?", "Tyrosine", "Tryptophan", "Histidine", "Methionine", "Tyrosinase converts tyrosine toward DOPA and melanin."],
  ["bioenergetics", "Which respiratory complex is inhibited by rotenone?", "Complex I", "Complex II", "Complex III", "Complex IV", "Rotenone blocks electron transfer from the iron-sulfur centers of Complex I to ubiquinone."],
  ["bioenergetics", "Which compound is not considered a high-energy phosphate compound?", "Glucose-6-phosphate", "Phosphoenolpyruvate", "Phosphocreatine", "Carbamoyl phosphate", "G6P has a relatively low phosphoryl-transfer potential compared with PEP, phosphocreatine, and carbamoyl phosphate."],
  ["bioenergetics", "What protein physiologically uncouples oxidative phosphorylation in brown adipose tissue?", "Thermogenin (UCP1)", "ATP synthase", "Adenine nucleotide translocase", "Cytochrome c", "UCP1 allows proton re-entry without ATP synthesis, releasing the gradient as heat."],
  ["lipid metabolism", "Which vitamin is part of the 4-prime-phosphopantetheine arm of acyl carrier protein?", "Pantothenic acid (vitamin B5)", "Riboflavin (vitamin B2)", "Biotin (vitamin B7)", "Folate (vitamin B9)", "The mobile phosphopantetheine arm of ACP is derived from pantothenate."],
  ["dietary lipid metabolism", "What are the principal products of pancreatic-lipase digestion of dietary triacylglycerol?", "2-Monoacylglycerol and free fatty acids", "Glycerol and three fatty acids exclusively", "Cholesterol and phospholipid", "Acetyl-CoA and ketone bodies", "Pancreatic lipase preferentially hydrolyzes the sn-1 and sn-3 ester bonds."],
  ["cholesterol and lipoprotein metabolism", "How does nascent VLDL become fully functional in plasma?", "It acquires ApoC-II and ApoE from HDL", "It exchanges ApoB-100 for ApoB-48", "It loses all apolipoproteins", "It acquires albumin from LDL", "HDL donates ApoC-II for LPL activation and ApoE for remnant recognition."],
  ["carbohydrate metabolism", "What is the energetic cost of making one glucose from two pyruvate?", "4 ATP, 2 GTP, and 2 NADH", "2 ATP only", "4 GTP and no ATP", "30–32 ATP", "Gluconeogenesis consumes six high-energy phosphate equivalents plus two cytosolic NADH per glucose."],
  ["carbohydrate metabolism", "What is the direct end product of glycolysis under aerobic conditions?", "Pyruvate", "Acetyl-CoA", "Carbon dioxide", "Citrate", "Oxygen changes the downstream fate of pyruvate and NADH; glycolysis itself ends at pyruvate."],
  ["nucleotide metabolism", "What lymphocyte pattern is expected in untreated ADA-deficient SCID?", "Profound lymphopenia affecting T, B, and NK lineages", "Persistent lymphocytosis", "Isolated neutrophilia", "Normal lymphocyte numbers and function", "Toxic purine metabolites injure developing lymphocytes, producing severe combined lymphopenia."],
  ["nucleotide metabolism", "What bacterial enzyme is inhibited by sulfamethoxazole?", "Dihydropteroate synthase", "Dihydrofolate reductase", "Thymidylate synthase", "DNA gyrase", "Sulfonamides compete with PABA at dihydropteroate synthase, lowering bacterial folate-dependent purine and dTMP synthesis."],
  ["bioenergetics", "What occurs when mitochondrial cytochrome c is released into the cytosol?", "Apoptosome formation and intrinsic caspase activation", "Direct activation of glycolysis", "Inhibition of every caspase", "Conversion of bilirubin to heme", "Cytosolic cytochrome c binds Apaf-1 and helps activate caspase-9 through the apoptosome."],
  ["cholesterol and lipoprotein metabolism", "Which apolipoproteins are ligands for the LDL receptor?", "ApoB-100 and ApoE", "ApoA-I and ApoC-I", "ApoB-48 only", "ApoC-II only", "LDLR recognizes ApoB-100 on LDL and ApoE on remnant particles."],
  ["fatty acid and ketone metabolism", "Which cofactors are required as propionyl-CoA is converted to succinyl-CoA?", "Biotin first, then vitamin B12", "PLP first, then folate", "FAD only", "Vitamin C and vitamin K", "Propionyl-CoA carboxylase is biotin-dependent; methylmalonyl-CoA mutase requires adenosylcobalamin."],
  ["fatty acid and ketone metabolism", "Why does beta-oxidation of palmitoleate yield less ATP than palmitate?", "Its existing double bond bypasses one FAD-dependent dehydrogenation", "It produces no acetyl-CoA", "It consumes all mitochondrial NADH", "It cannot enter the carnitine shuttle", "A pre-existing cis double bond eliminates one acyl-CoA dehydrogenase step, so one fewer FADH2 is generated."],
];

const sources = [
  "final biochemistry thoery.pdf",
  "Biochemistry_with answer.pdf",
  "Biochemistery_2023_with_answers_key.pdf",
  "Biochemistry Theory Answer Key 2025-9-7.pdf",
  "2026 July, Biochemistry Questions With Answers Key.pdf",
  "photo_521529… question paper",
  "photo_547002… question paper",
];

function questionFromRow(row, index) {
  const [topic, prompt, correct, ...tail] = row;
  const rationale = tail.pop();
  const distractors = tail;
  if (distractors.length !== 3) throw new Error(`Expected three distractors for row ${index + 1}`);
  const optionTexts = [correct, ...distractors];
  const rotation = index % 4;
  const ordered = [...optionTexts.slice(rotation), ...optionTexts.slice(0, rotation)];
  const optionIds = ["A", "B", "C", "D"];
  const options = ordered.map((text, optionIndex) => ({ id: optionIds[optionIndex], text }));
  const correctOptionId = options.find((option) => option.text === correct)?.id;
  const digest = createHash("sha256").update(prompt.toLowerCase()).digest("hex").slice(0, 12);
  const distractorExplanations = Object.fromEntries(options
    .filter((option) => option.id !== correctOptionId)
    .map((option) => [option.id, `${option.text} does not fit this relationship. ${rationale}`]));
  return {
    schemaVersion: "1.0.0",
    id: `aug25d-${digest}-v1`,
    revision: 1,
    status: "verified",
    kind: "single_best_answer",
    subject: "biochemistry",
    topic,
    subtopic: "new downloads core distilled",
    chapter: topic,
    difficulty: index % 5 === 0 ? 3 : 2,
    prompt,
    options,
    correctOptionId,
    acceptedFreeText: [correctOptionId, correct],
    explanation: rationale,
    distractorExplanations,
    learningObjective: `Apply the core ${topic} relationship tested across the newly downloaded August 25 past papers.`,
    source: {
      title: "New August 25 downloads: 2021–2026 biochemistry past papers and photo-only exams",
      chapter: topic,
      page: "Cross-paper distilled audit",
      lecture: "TUMS Cell & Molecules final archive",
      excerpt: `Canonical, medically re-keyed relationship distilled from: ${sources.join("; ")}.`,
    },
    tags: ["exam-july29", "downloaded-final", "final-bank-aug25-downloaded-core", "distilled-core", "past-paper"],
    examPriority: "high",
    qualityFlags: ["multi-source-extracted", "concept-deduplicated", "medically-rekeyed", "obsolete-conventions-removed"],
  };
}

const questions = rows.map(questionFromRow);
const normalized = questions.map((question) => question.prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
if (new Set(normalized).size !== normalized.length) throw new Error("Duplicate normalized prompts in downloaded-core bank");
if (new Set(questions.map((question) => question.id)).size !== questions.length) throw new Error("Duplicate IDs in downloaded-core bank");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${questions.map((question) => JSON.stringify(question)).join("\n")}\n`);
console.log(`Generated ${questions.length} medically re-keyed, concept-distilled August 25 final questions.`);
