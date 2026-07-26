import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const items = [];

function q(chapter, topic, subtopic, difficulty, prompt, correct, wrong, explanation, objective, tags = [], priority = "high") {
  if (wrong.length !== 3) throw new Error(`Expected three distractors for: ${prompt}`);
  items.push({ chapter, topic, subtopic, difficulty, prompt, correct, wrong, explanation, objective, tags, priority });
}

// Chapter 1 - homeostasis and control systems (6)
q("Chapter 1", "Cell physiology and homeostasis", "Internal environment", 1,
  "Which body-fluid compartment is called the internal environment of the body?",
  "Extracellular fluid", ["Intracellular fluid", "Transcellular fluid only", "Cytosol of all cells"],
  "The extracellular fluid surrounds cells and supplies them with ions and nutrients, so Claude Bernard's internal environment refers to extracellular fluid.",
  "Identify the fluid compartment that constitutes the internal environment.", ["homeostasis"]);
q("Chapter 1", "Cell physiology and homeostasis", "Negative feedback", 2,
  "A rise in arterial pressure triggers reflex responses that lower arterial pressure. What type of control is this?",
  "Negative feedback", ["Positive feedback", "Feed-forward control", "Adaptive control only"],
  "The response opposes the initiating pressure change, which is the defining feature of negative feedback.",
  "Distinguish negative feedback from other control patterns.", ["homeostasis", "application"]);
q("Chapter 1", "Cell physiology and homeostasis", "Positive feedback", 2,
  "Which physiological event is a useful example of positive feedback?",
  "Progressive uterine contractions during childbirth", ["Baroreflex correction of high pressure", "Insulin lowering an elevated glucose concentration", "Thermoregulatory sweating during heat exposure"],
  "Cervical stretch strengthens uterine contractions, causing more cervical stretch until delivery terminates the loop.",
  "Recognize a physiologically useful positive-feedback loop.", ["homeostasis"]);
q("Chapter 1", "Cell physiology and homeostasis", "Control-system gain", 4,
  "A disturbance would raise a regulated variable by 30 units, but feedback limits the final rise to 10 units. Using gain = correction/error, what is the gain?",
  "-2", ["-3", "+2", "+3"],
  "The feedback correction is -20 units and the remaining error is +10 units, so gain = -20/+10 = -2.",
  "Calculate the gain of a negative-feedback control system.", ["homeostasis", "calculation", "application"], "core");
q("Chapter 1", "Cell physiology and homeostasis", "Feed-forward control", 3,
  "A motor program activates postural muscles just before a person voluntarily lifts a heavy object. Which control strategy is illustrated?",
  "Feed-forward control", ["Positive feedback", "Delayed negative feedback only", "Loss of homeostatic control"],
  "The anticipatory response occurs before sensory feedback from the movement can return, making it feed-forward control.",
  "Apply the concept of feed-forward regulation.", ["homeostasis", "application"]);
q("Chapter 1", "Cell physiology and homeostasis", "Dynamic stability", 2,
  "Which statement best describes homeostasis?",
  "Maintenance of variables within acceptable ranges by coordinated regulation", ["Complete constancy of every body variable", "Absence of exchange between cells and extracellular fluid", "Equal concentrations of all ions inside and outside cells"],
  "Homeostasis is dynamic stability around regulated ranges, not absolute chemical or physiological constancy.",
  "Define homeostasis accurately.", ["homeostasis"]);

// Chapter 2 - cell organization and organelles (6)
q("Chapter 2", "Cell physiology and homeostasis", "Cell organization", 1,
  "What are the two major compartments of a typical human cell as described in Guyton?",
  "Nucleus and cytoplasm", ["Golgi apparatus and lysosome", "Cytosol and extracellular matrix", "Mitochondrion and plasma"],
  "The nuclear membrane separates the nucleus from the cytoplasm, and the cell membrane separates the cytoplasm from extracellular fluid.",
  "Identify the major structural compartments of a cell.", ["cell-structure"]);
q("Chapter 2", "Cell physiology and homeostasis", "Mitochondria", 2,
  "A cell with very high sustained ATP demand would be expected to contain especially many of which organelle?",
  "Mitochondria", ["Lysosomes", "Peroxisomes", "Nucleoli"],
  "Mitochondria use oxidative phosphorylation to supply most ATP for sustained cellular work.",
  "Relate mitochondrial abundance to cellular energy demand.", ["cell-structure", "application"]);
q("Chapter 2", "Cell physiology and homeostasis", "Lysosomes", 2,
  "Which organelle contains acid hydrolases used to digest damaged cellular structures and material taken up by endocytosis?",
  "Lysosome", ["Smooth endoplasmic reticulum", "Centriole", "Nucleolus"],
  "Lysosomes are membrane-bound digestive organelles containing hydrolytic enzymes that function in an acidic interior.",
  "State the digestive role of lysosomes.", ["cell-structure"]);
q("Chapter 2", "Cell physiology and homeostasis", "Secretory pathway", 3,
  "A newly synthesized peptide hormone follows which route before regulated secretion?",
  "Rough endoplasmic reticulum to Golgi apparatus to secretory vesicle", ["Smooth endoplasmic reticulum to lysosome to nucleus", "Golgi apparatus to rough endoplasmic reticulum to mitochondrion", "Nucleus to peroxisome to plasma membrane"],
  "Secreted proteins enter the rough endoplasmic reticulum, are processed and sorted in the Golgi apparatus, and are packaged into secretory vesicles.",
  "Trace a secreted protein through the cell.", ["cell-structure", "application"]);
q("Chapter 2", "Cell physiology and homeostasis", "Peroxisomes", 3,
  "Which feature best distinguishes peroxisomes from lysosomes?",
  "They contain oxidases and catalase that handle hydrogen peroxide", ["They contain ribosomes for translation", "They generate action potentials", "They store acetylcholine for exocytosis"],
  "Peroxisomes perform oxidative reactions and use catalase to break down hydrogen peroxide; lysosomes chiefly use acid hydrolases.",
  "Differentiate peroxisomal and lysosomal functions.", ["cell-structure"]);
q("Chapter 2", "Cell physiology and homeostasis", "Cytoskeleton", 2,
  "Disruption of microtubule polymerization would most directly impair which process?",
  "Formation of the mitotic spindle", ["Diffusion of oxygen through lipid bilayer", "Hydrolysis of ATP by myosin", "Binding of calcium to calmodulin"],
  "Microtubules form the mitotic spindle and also support cilia and intracellular transport.",
  "Relate microtubules to their cellular functions.", ["cell-structure", "application"]);

// Chapter 3 - information flow (2)
q("Chapter 3", "Cell physiology and homeostasis", "Transcription", 2,
  "During transcription, genetic information is transferred from which molecule to which product?",
  "DNA to RNA", ["RNA to DNA", "Protein to RNA", "RNA to protein"],
  "RNA polymerase uses a DNA template to synthesize RNA; translation subsequently uses messenger RNA to direct protein synthesis.",
  "Distinguish transcription from translation.", ["gene-expression"]);
q("Chapter 3", "Cell physiology and homeostasis", "Translation", 2,
  "Which structure directly reads messenger RNA codons during protein synthesis?",
  "Ribosome", ["Lysosome", "Centriole", "Peroxisome"],
  "Ribosomes coordinate messenger RNA with transfer RNAs to assemble amino acids into a polypeptide.",
  "Identify the site of translation.", ["gene-expression"]);

// Chapter 4 - membrane transport (16)
q("Chapter 4", "Membrane transport", "Simple diffusion", 2,
  "Which substance most readily crosses a pure phospholipid bilayer by simple diffusion?",
  "Oxygen", ["Sodium ion", "Glucose", "Albumin"],
  "Small lipid-soluble molecules such as oxygen dissolve in the lipid bilayer and diffuse without a transporter.",
  "Predict membrane permeability from molecular properties.", ["diffusion"]);
q("Chapter 4", "Membrane transport", "Facilitated diffusion", 3,
  "Why does facilitated diffusion show a transport maximum?",
  "A finite number of carriers become saturated", ["ATP supply always becomes zero", "The lipid bilayer becomes impermeable", "Solute begins moving against its electrochemical gradient"],
  "Carrier-mediated diffusion plateaus when essentially all available carriers are occupied and cycling at their maximal rate.",
  "Explain saturation of facilitated diffusion.", ["facilitated-diffusion"]);
q("Chapter 4", "Membrane transport", "Osmosis", 2,
  "A cell is placed in a solution with a higher concentration of nonpenetrating solute than its cytoplasm. What happens initially?",
  "Water leaves the cell and the cell shrinks", ["Water enters the cell and the cell swells", "Nonpenetrating solute rapidly enters until concentrations equalize", "No water movement occurs because solute cannot cross"],
  "Water moves toward the compartment with the higher effective concentration of nonpenetrating solute, so the cell loses water.",
  "Predict cell-volume change from extracellular tonicity.", ["osmosis", "application"]);
q("Chapter 4", "Membrane transport", "Osmotic pressure", 4,
  "A membrane is permeable to water but not solute. Side X contains 300 mOsm/L nonpenetrating solute and side Y contains 280 mOsm/L. What is the initial net water movement?",
  "From Y to X", ["From X to Y", "No net movement", "Solute moves from X to Y while water remains still"],
  "Water moves from the lower effective osmolarity of 280 mOsm/L toward the higher effective osmolarity of 300 mOsm/L.",
  "Use osmolarity to determine the direction of osmosis.", ["osmosis", "calculation", "application"], "core");
q("Chapter 4", "Membrane transport", "Fick principle", 4,
  "A membrane's surface area doubles and its thickness is halved, with all other diffusion factors unchanged. How does diffusion rate change?",
  "It becomes four times greater", ["It doubles", "It is halved", "It remains unchanged"],
  "Diffusion rate is proportional to area and inversely proportional to thickness; 2 divided by 0.5 gives a fourfold increase.",
  "Calculate the effect of area and thickness on diffusion.", ["diffusion", "calculation", "application"], "core");
q("Chapter 4", "Membrane transport", "Electrochemical gradients", 3,
  "The net passive movement of an ion across a membrane is determined by which combined influences?",
  "Its concentration gradient and the electrical potential across the membrane", ["Its concentration gradient only", "ATP concentration and membrane thickness only", "Hydrostatic pressure without membrane permeability"],
  "An ion's electrochemical gradient combines its chemical concentration difference with the force exerted by membrane voltage.",
  "Explain the forces that drive passive ion movement.", ["diffusion", "electrochemical-gradient"]);
q("Chapter 4", "Membrane transport", "Primary active transport", 2,
  "Which process is an example of primary active transport?",
  "Na+/K+-ATPase moving sodium out and potassium in", ["Glucose entry through GLUT", "Water movement through aquaporins", "Sodium entry through an open ion channel"],
  "The Na+/K+-ATPase directly hydrolyzes ATP to move both ions against their electrochemical gradients.",
  "Identify primary active transport.", ["active-transport"]);
q("Chapter 4", "Membrane transport", "Na+/K+-ATPase stoichiometry", 3,
  "For each ATP hydrolyzed, what does the Na+/K+-ATPase normally transport?",
  "Three Na+ out and two K+ in", ["Two Na+ out and three K+ in", "Three Na+ in and two K+ out", "One Na+ out and one K+ in"],
  "Each pump cycle exports three sodium ions and imports two potassium ions, making the pump electrogenic.",
  "Recall the stoichiometry of the sodium-potassium pump.", ["active-transport"]);
q("Chapter 4", "Membrane transport", "Secondary active cotransport", 3,
  "Intestinal uptake of glucose together with sodium is powered immediately by what?",
  "Energy stored in the inward sodium electrochemical gradient", ["Direct ATP hydrolysis by the glucose carrier", "An outward glucose gradient", "Hydrolysis of GTP within the channel pore"],
  "The sodium gradient created by primary active transport drives sodium-glucose cotransport; the cotransporter does not directly split ATP.",
  "Explain the energy source for secondary active cotransport.", ["secondary-active-transport"]);
q("Chapter 4", "Membrane transport", "Secondary active countertransport", 3,
  "Which transporter is a classic example of secondary active countertransport?",
  "Na+/Ca2+ exchanger", ["Aquaporin", "Voltage-gated sodium channel", "GLUT glucose carrier"],
  "The sodium-calcium exchanger uses downhill sodium entry to drive calcium in the opposite direction.",
  "Recognize secondary active countertransport.", ["secondary-active-transport"]);
q("Chapter 4", "Membrane transport", "Channel gating", 2,
  "A membrane channel opens when a neurotransmitter binds directly to it. How is this channel classified?",
  "Ligand-gated channel", ["Voltage-gated channel", "Mechanically gated channel", "Constitutively saturated carrier"],
  "Chemical binding to the channel or an associated receptor gates a ligand-gated channel.",
  "Classify channels by their gating stimulus.", ["ion-channels"]);
q("Chapter 4", "Membrane transport", "Bulk flow", 3,
  "Movement of water and dissolved small solutes together through membrane pores because of a pressure difference is called what?",
  "Filtration", ["Facilitated diffusion", "Primary active transport", "Countertransport"],
  "Filtration is bulk flow driven by a hydrostatic pressure difference across a porous barrier.",
  "Differentiate filtration from molecular diffusion.", ["filtration"]);
q("Chapter 4", "Membrane transport", "Carrier competition", 3,
  "Two structurally similar sugars use the same facilitated-diffusion carrier. Increasing one sugar is most likely to have what effect on transport of the other?",
  "Decrease it by competition for carrier binding", ["Increase it by creating ATP", "Leave it unchanged at every concentration", "Reverse the direction of osmosis only"],
  "Solutes sharing a finite carrier population can compete for binding sites and reduce one another's transport rates.",
  "Predict competition in carrier-mediated transport.", ["facilitated-diffusion", "application"]);
q("Chapter 4", "Membrane transport", "Diffusion rate", 4,
  "A solute flux is 6 units when its concentration difference is 3 mmol/L. If membrane properties are unchanged and the difference rises to 9 mmol/L, what flux is expected?",
  "18 units", ["2 units", "9 units", "54 units"],
  "Passive diffusion rate is proportional to the concentration difference; tripling the difference triples flux from 6 to 18 units.",
  "Calculate a diffusion-rate change from its concentration gradient.", ["diffusion", "calculation", "application"], "core");
q("Chapter 4", "Membrane transport", "Vesicular transport", 2,
  "A macrophage surrounds and internalizes a bacterium. Which transport process is occurring?",
  "Phagocytosis", ["Pinocytosis", "Facilitated diffusion", "Osmosis"],
  "Phagocytosis is the actin-dependent engulfment of large particles such as bacteria into intracellular vesicles.",
  "Identify phagocytosis as a form of endocytosis.", ["vesicular-transport"]);
q("Chapter 4", "Membrane transport", "Transport energetics", 4,
  "A membrane carrier moves solute from a low concentration to a high concentration and transport stops when cellular ATP is depleted. Which mechanism is most consistent?",
  "Active transport", ["Simple diffusion", "Osmosis", "Passive movement through an open channel"],
  "Movement against a concentration gradient that depends on metabolic energy is active transport.",
  "Infer transport mechanism from direction and energy dependence.", ["active-transport", "application"]);

// Chapter 5 - membrane potentials and action potentials (16)
q("Chapter 5", "Membrane potentials", "Resting membrane potential", 2,
  "At rest, neuronal membrane potential lies closest to the equilibrium potential of which ion?",
  "Potassium", ["Sodium", "Calcium", "Chloride in every neuron regardless of transporters"],
  "Resting neuronal membranes are much more permeable to potassium than sodium, so potassium has the dominant influence on resting voltage.",
  "Relate selective permeability to resting membrane potential.", ["resting-potential"]);
q("Chapter 5", "Membrane potentials", "Nernst potential", 3,
  "For a monovalent cation present at higher concentration inside than outside, its Nernst potential is usually in which direction?",
  "Negative inside relative to outside", ["Positive inside relative to outside", "Exactly zero at all concentrations", "Independent of the concentration ratio"],
  "A negative intracellular voltage is required to oppose the outward chemical diffusion of a cation concentrated inside.",
  "Predict the sign of an equilibrium potential.", ["nernst-potential"]);
q("Chapter 5", "Membrane potentials", "Nernst calculation", 4,
  "Using E = -61 log10(Cinside/Coutside) mV for a monovalent cation at 37 C, what is EK when intracellular K+ is 140 mmol/L and extracellular K+ is 14 mmol/L?",
  "-61 mV", ["+61 mV", "-122 mV", "+122 mV"],
  "The concentration ratio is 10, log10(10) is 1, and E = -61 mV.",
  "Calculate a monovalent cation equilibrium potential.", ["nernst-potential", "calculation", "application"], "core");
q("Chapter 5", "Membrane potentials", "Nernst calculation", 4,
  "Using E = +61 log10(Coutside/Cinside) mV for Na+ at 37 C, what is ENa when extracellular Na+ is 140 mmol/L and intracellular Na+ is 14 mmol/L?",
  "+61 mV", ["-61 mV", "+14 mV", "0 mV"],
  "The outside-to-inside ratio is 10, so the base-10 logarithm is 1 and ENa is approximately +61 mV.",
  "Calculate the sodium equilibrium potential from a concentration ratio.", ["nernst-potential", "calculation", "application"], "core");
q("Chapter 5", "Action potentials", "Depolarization", 2,
  "What does depolarization mean?",
  "The membrane potential becomes less negative than its resting value", ["The membrane potential becomes more negative", "All ion gradients disappear", "Potassium concentration becomes identical on both sides"],
  "Depolarization is a movement of membrane voltage toward zero or a positive value from a negative resting potential.",
  "Define membrane depolarization.", ["action-potential"]);
q("Chapter 5", "Action potentials", "Threshold", 3,
  "Once a neuronal membrane reaches threshold, rapid depolarization becomes regenerative mainly because of what?",
  "Voltage-gated Na+ channels open and further depolarization opens more of them", ["Na+/K+-ATPase instantly reverses", "Voltage-gated K+ channels all close permanently", "Chloride permeability becomes infinite"],
  "Threshold starts positive feedback in which sodium entry causes depolarization that recruits still more voltage-gated sodium channels.",
  "Explain the regenerative upstroke of a nerve action potential.", ["action-potential"]);
q("Chapter 5", "Action potentials", "Absolute refractory period", 3,
  "A second action potential cannot be elicited during the absolute refractory period primarily because most voltage-gated Na+ channels are what?",
  "Inactivated", ["Closed but fully activatable", "Replaced by calcium pumps", "Removed from the membrane"],
  "After opening, fast sodium channels enter an inactivated state and cannot reopen until sufficient repolarization restores availability.",
  "Explain the ionic basis of the absolute refractory period.", ["action-potential", "refractory-period"]);
q("Chapter 5", "Action potentials", "Repolarization", 2,
  "Which change contributes most directly to repolarization of a typical nerve action potential?",
  "Increased K+ efflux through voltage-gated K+ channels", ["Sustained Na+ influx through fast channels", "Closure of every potassium channel", "Active influx of large proteins"],
  "Delayed opening of voltage-gated potassium channels increases outward positive current and returns the membrane toward a negative voltage.",
  "Identify the major ionic current producing repolarization.", ["action-potential"]);
q("Chapter 5", "Membrane potentials", "Hyperkalemia", 4,
  "A moderate acute rise in extracellular K+ initially changes the resting membrane potential of a neuron in which direction?",
  "It becomes less negative", ["It becomes more negative", "It becomes exactly equal to ENa", "It cannot change because only intracellular K+ matters"],
  "Raising extracellular potassium reduces the outward potassium concentration gradient, making the potassium equilibrium potential and resting voltage less negative.",
  "Predict the effect of extracellular potassium on resting voltage.", ["resting-potential", "application"], "core");
q("Chapter 5", "Action potentials", "Sodium-channel blockade", 4,
  "A local anesthetic blocks voltage-gated Na+ channels in a peripheral nerve. Which effect is most direct?",
  "Failure of regenerative action-potential propagation", ["A larger sodium-dependent upstroke", "Increased acetylcholine release from all terminals", "Immediate contraction without membrane excitation"],
  "Fast sodium channels are required for the regenerative inward current that propagates a nerve action potential.",
  "Predict the electrophysiological effect of sodium-channel blockade.", ["action-potential", "application"], "core");
q("Chapter 5", "Action potentials", "Saltatory conduction", 3,
  "Why does myelination increase conduction velocity?",
  "Action potentials are regenerated mainly at nodes while current spreads rapidly beneath myelin", ["Myelin continuously releases neurotransmitter", "Every internodal membrane segment produces a full action potential", "Myelin eliminates all membrane capacitance and resistance"],
  "Myelin increases membrane resistance and reduces effective capacitance, allowing local current to reach the next node rapidly.",
  "Explain saltatory conduction.", ["nerve-conduction"]);
q("Chapter 5", "Action potentials", "Axon diameter", 2,
  "Increasing axon diameter generally has what effect on conduction velocity?",
  "It increases velocity by lowering internal resistance", ["It decreases velocity by increasing internal resistance", "It has no effect in unmyelinated fibers", "It prevents local circuit current"],
  "A larger diameter lowers axial resistance, permitting depolarizing current to spread farther and faster.",
  "Relate axon diameter to conduction velocity.", ["nerve-conduction"]);
q("Chapter 5", "Action potentials", "All-or-none principle", 2,
  "Once threshold is reached in a single normal axon, increasing stimulus strength mainly changes what?",
  "Firing frequency or recruitment, not the amplitude of each propagated action potential", ["The amplitude of each action potential without limit", "The sodium equilibrium potential", "The number of potassium ions in extracellular fluid"],
  "A propagated action potential in one axon is all-or-none; stronger stimuli are encoded mainly by firing frequency and recruitment.",
  "Apply the all-or-none principle to stimulus coding.", ["action-potential", "application"]);
q("Chapter 5", "Action potentials", "Plateau potentials", 3,
  "A prolonged action-potential plateau is most directly supported by which current?",
  "Sustained inward Ca2+ current through slow channels", ["Only a brief fast Na+ current", "Unopposed rapid K+ efflux", "Active chloride pumping out of the cell"],
  "Slow calcium entry, often accompanied by delayed reduction of outward potassium current, can prolong depolarization into a plateau.",
  "Explain the ionic basis of an action-potential plateau.", ["action-potential"]);
q("Chapter 5", "Action potentials", "Extracellular calcium", 4,
  "A marked fall in extracellular Ca2+ makes nerve membranes more excitable. What is the best explanation?",
  "Voltage-gated Na+ channels open with less depolarization", ["The potassium equilibrium potential becomes +60 mV", "All sodium channels remain permanently inactivated", "Myelin thickness immediately doubles"],
  "Low extracellular calcium reduces stabilization of sodium-channel gating, lowering the excitation threshold.",
  "Predict how extracellular calcium affects membrane excitability.", ["excitability", "application"]);
q("Chapter 5", "Action potentials", "Conduction time", 3,
  "An impulse travels along a 1.2 m nerve at 60 m/s. Approximately how long does conduction take?",
  "20 ms", ["2 ms", "72 ms", "200 ms"],
  "Time equals distance divided by velocity: 1.2/60 second = 0.02 second = 20 ms.",
  "Calculate nerve conduction time.", ["nerve-conduction", "calculation", "application"], "core");

// Chapter 6 - skeletal muscle contraction (14)
q("Chapter 6", "Skeletal muscle", "Sarcomere anatomy", 1,
  "A sarcomere extends between which two structures?",
  "Two successive Z discs", ["Two successive M lines", "The ends of one thick filament", "The A band and the H zone"],
  "The repeating contractile unit of a myofibril is bounded by Z discs.",
  "Define the anatomical boundaries of a sarcomere.", ["skeletal-muscle"]);
q("Chapter 6", "Skeletal muscle", "Filament composition", 2,
  "Which protein forms the major component of the thick filament?",
  "Myosin", ["Actin", "Tropomyosin", "Troponin C"],
  "Thick filaments are assemblies of myosin molecules whose heads form cross-bridges with actin.",
  "Identify the principal protein in thick filaments.", ["skeletal-muscle"]);
q("Chapter 6", "Skeletal muscle", "Calcium regulation", 2,
  "During skeletal muscle activation, Ca2+ binds directly to which regulatory protein?",
  "Troponin C", ["Tropomyosin", "Myosin light-chain kinase", "Dystrophin"],
  "Calcium binding to troponin C changes the troponin-tropomyosin complex and exposes myosin-binding sites on actin.",
  "State the calcium sensor in skeletal muscle.", ["skeletal-muscle", "molecular-contraction"]);
q("Chapter 6", "Skeletal muscle", "Thin-filament activation", 3,
  "What directly exposes active sites on actin during skeletal muscle contraction?",
  "Movement of tropomyosin away from the sites", ["Removal of actin from the sarcomere", "Breakdown of all troponin", "Detachment of thick filaments from the M line"],
  "Calcium-bound troponin shifts tropomyosin away from actin's myosin-binding sites.",
  "Explain thin-filament activation.", ["skeletal-muscle", "molecular-contraction"]);
q("Chapter 6", "Skeletal muscle", "Cross-bridge cycle", 3,
  "Binding of ATP to a myosin head causes which immediate event?",
  "Detachment of myosin from actin", ["The power stroke without prior hydrolysis", "Calcium release from troponin C", "Permanent rigor binding"],
  "ATP binding lowers myosin's affinity for actin and detaches the cross-bridge; ATP hydrolysis then re-cocks the head.",
  "Sequence ATP-dependent steps of the cross-bridge cycle.", ["skeletal-muscle", "molecular-contraction"]);
q("Chapter 6", "Skeletal muscle", "Rigor", 3,
  "Why does severe ATP depletion produce rigor?",
  "Myosin heads cannot detach from actin", ["Actin filaments dissolve", "Troponin C cannot bind calcium", "Sodium channels become permanently open"],
  "ATP must bind myosin for cross-bridge detachment; without ATP, attached heads remain bound.",
  "Explain rigor from the cross-bridge cycle.", ["skeletal-muscle", "application"]);
q("Chapter 6", "Skeletal muscle", "Power stroke", 4,
  "Release of inorganic phosphate from an attached myosin head is most closely associated with which event?",
  "The force-generating power stroke", ["ATP binding and cross-bridge detachment", "Calcium reuptake by SERCA", "Action-potential propagation in the motor axon"],
  "Phosphate release strengthens actin-myosin binding and is coupled to the myosin head's force-generating conformational change.",
  "Relate nucleotide state to cross-bridge mechanics.", ["skeletal-muscle", "molecular-contraction"]);
q("Chapter 6", "Skeletal muscle", "Length-tension relation", 4,
  "A skeletal muscle fiber is stretched so far that thick and thin filaments no longer overlap. What active tension can it develop?",
  "Essentially none", ["Maximal tension", "Twice maximal tension", "Normal tension independent of overlap"],
  "Without thick-thin filament overlap, myosin cannot form force-producing cross-bridges with actin.",
  "Predict active force from sarcomere overlap.", ["skeletal-muscle", "application"], "core");
q("Chapter 6", "Skeletal muscle", "Contraction types", 2,
  "A muscle develops tension while its overall length remains constant. What type of contraction is this?",
  "Isometric contraction", ["Isotonic shortening", "Eccentric isotonic contraction only", "Passive relaxation"],
  "In an isometric contraction, tension changes without a measurable change in muscle length.",
  "Distinguish isometric from isotonic contraction.", ["skeletal-muscle"]);
q("Chapter 6", "Skeletal muscle", "Motor units", 2,
  "Each of five recruited motor neurons innervates 120 distinct skeletal muscle fibers. How many muscle fibers are activated?",
  "600 fibers", ["24 fibers", "125 fibers", "1200 fibers"],
  "A motor unit is one motor neuron plus all fibers it innervates. With no overlap, five units activate 5 x 120 = 600 fibers.",
  "Calculate the number of fibers activated by motor-unit recruitment.", ["skeletal-muscle", "calculation", "application"]);
q("Chapter 6", "Skeletal muscle", "Recruitment", 3,
  "How does the nervous system usually increase whole-muscle force smoothly?",
  "By recruiting additional motor units and increasing their firing rates", ["By increasing the amplitude of each muscle action potential", "By converting actin into myosin", "By eliminating the refractory period"],
  "Spatial recruitment and temporal summation allow graded whole-muscle force despite all-or-none activation of individual fibers.",
  "Explain grading of whole-muscle force.", ["skeletal-muscle", "application"]);
q("Chapter 6", "Skeletal muscle", "Frequency summation", 3,
  "A second stimulus reaches a muscle fiber before it has fully relaxed. Why is the second twitch stronger?",
  "Cytosolic Ca2+ remains elevated, allowing more cross-bridge activity", ["The second action potential has unlimited amplitude", "All ATP has been depleted", "The sarcomeres have lost every thin filament"],
  "Residual calcium from the first twitch adds to calcium released by the next, producing temporal summation of force.",
  "Explain frequency summation in skeletal muscle.", ["skeletal-muscle", "application"]);
q("Chapter 6", "Skeletal muscle", "Mechanical work", 4,
  "A muscle shortens by 0.05 m while lifting a constant 200 N load. How much external work does it perform?",
  "10 J", ["4 J", "40 J", "4000 J"],
  "Work equals force times distance: 200 N x 0.05 m = 10 joules.",
  "Calculate external work performed by muscle.", ["skeletal-muscle", "calculation", "application"], "core");
q("Chapter 6", "Skeletal muscle", "Muscle energetics", 3,
  "During the first few seconds of maximal muscle activity, which source most rapidly helps regenerate ATP?",
  "Phosphocreatine", ["Hepatic gluconeogenesis alone", "New protein synthesis", "Oxidation of ketone bodies only"],
  "Phosphocreatine transfers a high-energy phosphate to ADP and provides a rapid, short-lived ATP buffer.",
  "Identify the immediate reserve for ATP regeneration in muscle.", ["skeletal-muscle", "energetics"]);

// Chapter 7 - neuromuscular transmission and excitation-contraction coupling (10)
q("Chapter 7", "Neuromuscular junction", "Transmitter release", 2,
  "What directly triggers acetylcholine-vesicle fusion at a motor nerve terminal?",
  "Ca2+ entry through voltage-gated channels", ["K+ entry through leak channels", "Na+ extrusion by the Na+/K+-ATPase", "Chloride entry into the muscle fiber"],
  "Terminal depolarization opens voltage-gated calcium channels, and local calcium entry activates synaptic-vesicle fusion.",
  "Explain the trigger for acetylcholine release.", ["neuromuscular-junction"]);
q("Chapter 7", "Neuromuscular junction", "End-plate potential", 3,
  "Activation of nicotinic acetylcholine receptors at the motor end plate produces depolarization mainly because of what?",
  "Net Na+ influx through ligand-gated cation channels", ["Selective K+ influx", "Active Ca2+ extrusion", "Opening of chloride-only channels"],
  "The receptor channel passes both sodium and potassium, but the inward sodium driving force predominates at resting voltage, producing an end-plate potential.",
  "Explain the ionic basis of the end-plate potential.", ["neuromuscular-junction"]);
q("Chapter 7", "Neuromuscular junction", "Acetylcholinesterase", 2,
  "What normally terminates the action of acetylcholine in the synaptic cleft at the neuromuscular junction?",
  "Rapid hydrolysis by acetylcholinesterase", ["Reuptake of intact acetylcholine into the muscle fiber", "Diffusion into the T tubule followed by calcium binding", "Conversion to norepinephrine"],
  "Acetylcholinesterase rapidly splits acetylcholine, limiting the duration of the end-plate signal.",
  "State how neuromuscular acetylcholine signaling ends.", ["neuromuscular-junction"]);
q("Chapter 7", "Neuromuscular junction", "Myasthenia gravis", 4,
  "A patient has fatigable weakness caused by antibodies that reduce functional nicotinic acetylcholine receptors. Where is the primary defect?",
  "Postsynaptic motor end plate", ["Presynaptic synthesis of myosin", "Sarcoplasmic reticulum calcium pump only", "Central corticospinal tract"],
  "Myasthenia gravis reduces the postsynaptic receptor reserve and lowers the safety factor for neuromuscular transmission.",
  "Localize the physiological defect in myasthenia gravis.", ["neuromuscular-junction", "application"], "core");
q("Chapter 7", "Neuromuscular junction", "Botulinum toxin", 4,
  "Botulinum toxin causes flaccid paralysis primarily by preventing what?",
  "Presynaptic acetylcholine-vesicle fusion and release", ["Postsynaptic acetylcholine breakdown", "Calcium binding to troponin C", "ATP binding to myosin"],
  "Botulinum toxins cleave vesicle-fusion proteins in cholinergic nerve terminals, reducing acetylcholine release.",
  "Predict the neuromuscular effect of impaired transmitter exocytosis.", ["neuromuscular-junction", "application"], "core");
q("Chapter 7", "Neuromuscular junction", "Safety factor", 3,
  "A muscle fiber rests at -90 mV and reaches action-potential threshold at -75 mV. What minimum end-plate depolarization is required to reach threshold?",
  "15 mV", ["-165 mV", "75 mV", "90 mV"],
  "The required depolarization is -75 - (-90) = +15 mV. Normal end-plate potentials exceed threshold by a safety margin.",
  "Calculate the end-plate depolarization required to reach threshold.", ["neuromuscular-junction", "calculation", "application"]);
q("Chapter 7", "Excitation-contraction coupling", "T tubules", 2,
  "What is the main function of skeletal-muscle T tubules?",
  "Carry surface depolarization deep into the muscle fiber", ["Synthesize actin", "Store most intracellular ATP", "Hydrolyze acetylcholine in the synaptic cleft"],
  "T tubules are invaginations of the sarcolemma that rapidly transmit the action potential near the sarcoplasmic reticulum throughout the fiber.",
  "State the role of T tubules in muscle activation.", ["excitation-contraction-coupling"]);
q("Chapter 7", "Excitation-contraction coupling", "DHP-RyR coupling", 4,
  "In skeletal muscle, T-tubule depolarization opens sarcoplasmic-reticulum Ca2+ release channels through which key coupling?",
  "Mechanical coupling of dihydropyridine receptors to ryanodine receptors", ["Direct binding of acetylcholine to troponin", "Sodium-glucose cotransport", "Opening of nuclear pores by ATP"],
  "Voltage-sensitive dihydropyridine receptors in the T-tubule membrane mechanically activate ryanodine receptors in the terminal cisternae.",
  "Explain skeletal-muscle excitation-contraction coupling.", ["excitation-contraction-coupling"], "core");
q("Chapter 7", "Excitation-contraction coupling", "Relaxation", 3,
  "Which process is most directly responsible for the fall in cytosolic Ca2+ during skeletal muscle relaxation?",
  "SERCA pumps Ca2+ back into the sarcoplasmic reticulum", ["Nicotinic receptors pump Ca2+ outside", "Myosin carries Ca2+ into the nucleus", "Voltage-gated Na+ channels bind and destroy Ca2+"],
  "The sarcoplasmic-reticulum Ca2+-ATPase actively resequesters calcium, allowing it to dissociate from troponin C.",
  "Explain calcium removal during skeletal muscle relaxation.", ["excitation-contraction-coupling"]);
q("Chapter 7", "Excitation-contraction coupling", "Signal sequence", 4,
  "Which sequence correctly links motor-neuron excitation to skeletal-muscle force?",
  "ACh release, end-plate depolarization, muscle action potential, SR Ca2+ release, cross-bridge cycling", ["SR Ca2+ release, ACh release, muscle action potential, ATP synthesis", "Muscle action potential, motor-neuron action potential, ACh breakdown, Ca2+ release", "Cross-bridge cycling, end-plate depolarization, ACh release, SR Ca2+ uptake"],
  "Neuromuscular transmission precedes sarcolemmal excitation, T-tubule signaling, calcium release, and activation of cross-bridge cycling.",
  "Order the major events of neuromuscular excitation-contraction coupling.", ["excitation-contraction-coupling", "application"], "core");

// Chapter 8 - smooth muscle (10)
q("Chapter 8", "Smooth muscle", "Calcium regulation", 2,
  "In smooth muscle, Ca2+ initiates contraction by first binding to what?",
  "Calmodulin", ["Troponin C", "Dystrophin", "Titin"],
  "Smooth muscle lacks troponin; calcium binds calmodulin, which activates myosin light-chain kinase.",
  "Identify the calcium sensor in smooth muscle.", ["smooth-muscle"]);
q("Chapter 8", "Smooth muscle", "Myosin activation", 3,
  "What is the key action of myosin light-chain kinase in smooth muscle?",
  "Phosphorylation of myosin light chains to permit cross-bridge cycling", ["Removal of calcium from calmodulin", "Hydrolysis of acetylcholine", "Polymerization of actin into microtubules"],
  "The calcium-calmodulin complex activates MLCK, which phosphorylates regulatory myosin light chains and increases myosin ATPase activity.",
  "Explain activation of smooth-muscle myosin.", ["smooth-muscle", "molecular-contraction"]);
q("Chapter 8", "Smooth muscle", "Relaxation", 3,
  "Activation of myosin light-chain phosphatase favors which outcome?",
  "Smooth-muscle relaxation", ["Faster myosin phosphorylation", "More calcium binding to troponin C", "Initiation of a nerve action potential"],
  "Myosin light-chain phosphatase removes activating phosphate from myosin and thereby favors reduced cross-bridge cycling and relaxation.",
  "State the role of myosin light-chain phosphatase.", ["smooth-muscle"]);
q("Chapter 8", "Smooth muscle", "Latch mechanism", 4,
  "The latch mechanism allows smooth muscle to maintain tonic force with what advantage?",
  "Very low ATP consumption", ["An action potential in every millisecond", "Complete absence of actin-myosin attachment", "Dependence on troponin C"],
  "Slowly cycling or latched cross-bridges can maintain force for long periods with little ATP use.",
  "Explain the energetic advantage of the smooth-muscle latch state.", ["smooth-muscle"], "core");
q("Chapter 8", "Smooth muscle", "Membrane structure", 2,
  "Smooth-muscle caveolae are functionally analogous to which skeletal-muscle structure?",
  "T tubules", ["Z discs", "Motor end plates", "Myelin sheaths"],
  "Caveolae are membrane invaginations positioned near sarcoplasmic reticulum and participate in calcium signaling despite the absence of developed T tubules.",
  "Relate smooth-muscle caveolae to excitation-contraction coupling.", ["smooth-muscle"]);
q("Chapter 8", "Smooth muscle", "Cross-bridge kinetics", 2,
  "Compared with skeletal muscle, smooth-muscle cross-bridge cycling is generally what?",
  "Slower and more economical of ATP", ["Faster and more ATP-consuming", "Unable to generate force", "Independent of myosin ATPase"],
  "Smooth-muscle myosin ATPase activity and cross-bridge cycling are slow, supporting sustained economical contraction.",
  "Compare contraction kinetics of smooth and skeletal muscle.", ["smooth-muscle"]);
q("Chapter 8", "Smooth muscle", "Single-unit muscle", 3,
  "Which property is characteristic of single-unit visceral smooth muscle?",
  "Many cells are electrically coupled by gap junctions", ["Each cell requires a separate somatic motor end plate", "Cells cannot respond to stretch", "There is no spontaneous electrical activity"],
  "Gap junctions permit excitation to spread through sheets of visceral smooth muscle so they contract as a functional syncytium.",
  "Distinguish single-unit from multiunit smooth muscle.", ["smooth-muscle"]);
q("Chapter 8", "Smooth muscle", "Autonomic innervation", 3,
  "How do autonomic nerve endings commonly release transmitter onto smooth muscle?",
  "From multiple varicosities along diffusely branching fibers", ["Only from a single specialized motor end plate", "Directly through gap junctions from the nerve", "Through T-tubule terminal cisternae"],
  "Autonomic fibers often have varicosities that release transmitter diffusely across many smooth-muscle cells rather than forming skeletal-style end plates.",
  "Describe autonomic neuromuscular transmission in smooth muscle.", ["smooth-muscle"]);
q("Chapter 8", "Smooth muscle", "Calcium entry", 4,
  "Blocking voltage-gated Ca2+ channels in depolarization-dependent smooth muscle most directly reduces contraction by doing what?",
  "Reducing cytosolic Ca2+-calmodulin activation of MLCK", ["Preventing Ca2+ binding to troponin C", "Stopping acetylcholine synthesis in all neurons", "Increasing myosin light-chain phosphorylation"],
  "Many smooth muscles depend strongly on extracellular calcium entry; less calcium-calmodulin activation produces less MLCK activity and less myosin phosphorylation.",
  "Predict the contractile effect of calcium-channel blockade.", ["smooth-muscle", "application"], "core");
q("Chapter 8", "Smooth muscle", "Pharmacomechanical coupling", 5,
  "A hormone contracts a smooth-muscle cell without producing an action potential. Which mechanism can account for this?",
  "Receptor-mediated release of Ca2+ from intracellular stores", ["Activation of skeletal-muscle troponin by a motor end plate", "Elimination of all cytosolic calcium", "Permanent closure of myosin-binding sites by calmodulin"],
  "Smooth muscle can contract through receptor-operated signaling that raises cytosolic calcium or calcium sensitivity without requiring an action potential.",
  "Explain pharmacomechanical coupling in smooth muscle.", ["smooth-muscle", "application"], "core");

// Chapters 5-8 comprehensive expansion.
// Appending these preserves the IDs of the original 80 questions and all saved progress.

// Chapter 5 expansion - membrane potentials and action potentials (8)
q("Chapter 5", "Membrane potentials", "Relative permeability", 3,
  "A resting membrane suddenly becomes much more permeable to K+ while all ion gradients remain unchanged. Toward which value will membrane voltage move?",
  "The K+ equilibrium potential", ["The Na+ equilibrium potential", "Exactly 0 mV", "The Cl- concentration in millimoles"],
  "Increasing one ion's conductance gives that ion greater control of membrane voltage, so increased K+ permeability drives voltage toward EK.",
  "Predict how a selective conductance change shifts membrane potential.", ["goldman", "conductance", "application"]);
q("Chapter 5", "Membrane potentials", "Shunting inhibition", 4,
  "Opening postsynaptic Cl- channels whose reversal potential is near the resting potential inhibits firing mainly by what mechanism?",
  "Increasing membrane conductance so excitatory current produces a smaller voltage change", ["Producing a large regenerative Cl- action potential", "Permanently closing all voltage-gated Na+ channels", "Eliminating the transmembrane chloride gradient"],
  "Cl- channels can inhibit with little hyperpolarization: conductance rises, input resistance falls, and the same excitatory current produces a smaller EPSP because delta V = I x R.",
  "Explain conductance-based shunting inhibition.", ["chloride", "conductance", "shunting", "application"], "core");
q("Chapter 5", "Action potentials", "Relative refractory period", 3,
  "Why is a stronger-than-normal stimulus required during the relative refractory period?",
  "Some Na+ channels have not recovered and K+ conductance may remain elevated", ["All Na+ channels are permanently closed", "The Na+/K+-ATPase has removed every intracellular Na+ ion", "Membrane capacitance has become zero"],
  "Incomplete recovery of Na+ channels and persistent outward K+ current make threshold harder, but not impossible, to reach.",
  "Distinguish the relative from the absolute refractory period.", ["refractory-period"]);
q("Chapter 5", "Action potentials", "Sodium-channel gates", 3,
  "What is the usual gate configuration of a voltage-gated Na+ channel at the resting membrane potential?",
  "Activation gate closed and inactivation gate open", ["Activation gate open and inactivation gate closed", "Both gates open", "Both gates irreversibly closed"],
  "At rest the rapid activation gate is closed while the slower inactivation gate is open, leaving the channel closed but available to activate.",
  "Recall voltage-gated sodium-channel states.", ["sodium-channel", "gating"]);
q("Chapter 5", "Action potentials", "Action-potential peak", 4,
  "Which paired change most directly turns rapid depolarization into repolarization near the peak of a neuronal action potential?",
  "Na+ channel inactivation and delayed opening of K+ channels", ["Further Na+ activation and closure of K+ channels", "Opening of ligand-gated Cl- channels only", "Immediate reversal of the Na+/K+-ATPase"],
  "The inward Na+ current wanes as Na+ channels inactivate while delayed K+ channels increase outward current.",
  "Explain the current switch at the action-potential peak.", ["sodium-channel", "potassium-channel", "application"], "core");
q("Chapter 5", "Membrane potentials", "Electrogenic pump", 3,
  "Which statement best describes the Na+/K+-ATPase contribution to membrane voltage?",
  "It maintains Na+ and K+ gradients and is mildly electrogenic because it moves 3 Na+ out for 2 K+ in", ["It produces the rapid upstroke by pumping Na+ inward", "It directly opens voltage-gated K+ channels at threshold", "It moves equal positive charge in both directions"],
  "The pump maintains gradients and makes the inside slightly more negative, but channel currents—not rapid pump cycling—create each action-potential phase.",
  "Separate the pump's long-term and immediate electrical roles.", ["sodium-potassium-pump", "application"]);
q("Chapter 5", "Action potentials", "Myelin electrical properties", 4,
  "Which combination of electrical changes beneath myelin most directly speeds passive spread of local current?",
  "Increased membrane resistance and decreased effective membrane capacitance", ["Decreased membrane resistance and increased capacitance", "Increased axial resistance and increased capacitance", "Decreased membrane resistance with unchanged capacitance"],
  "High membrane resistance reduces current leak, while low capacitance means less charge is needed to change voltage; the next node therefore charges faster.",
  "Relate myelin's electrical properties to conduction velocity.", ["myelin", "resistance", "capacitance"], "core");
q("Chapter 5", "Action potentials", "Axial resistance", 4,
  "If an axon's diameter doubles while resistivity and length stay constant, its internal axial resistance is approximately what fraction of the original?",
  "One-quarter", ["One-half", "Twice", "Four times"],
  "Axial resistance is inversely proportional to cross-sectional area, and area is proportional to diameter squared.",
  "Calculate how axon diameter changes internal resistance.", ["axon-diameter", "resistance", "calculation"], "core");

// Chapter 6 expansion - skeletal muscle contraction (8)
q("Chapter 6", "Skeletal muscle", "Band changes", 3,
  "During shortening of a skeletal-muscle sarcomere, which band remains essentially constant in length?",
  "A band", ["I band", "H zone", "Distance between Z discs"],
  "Thick-filament length defines the A band and does not change; the I band and H zone narrow and Z discs approach.",
  "Predict sarcomere band changes during contraction.", ["sarcomere", "sliding-filament"], "core");
q("Chapter 6", "Skeletal muscle", "Troponin subunits", 3,
  "Which mapping of troponin subunits is correct?",
  "TnC binds Ca2+, TnI inhibits actin-myosin interaction, and TnT binds tropomyosin", ["TnC binds tropomyosin, TnI binds Ca2+, and TnT hydrolyzes ATP", "TnC pumps Ca2+, TnI binds myosin ATP, and TnT forms titin", "All three subunits bind Ca2+ and perform identical functions"],
  "Use the initials: C binds calcium, I is inhibitory, and T attaches the complex to tropomyosin.",
  "Differentiate the three troponin subunits.", ["troponin", "calcium-regulation"], "core");
q("Chapter 6", "Skeletal muscle", "Cross-bridge recocking", 3,
  "After ATP causes myosin to detach from actin, what event re-cocks the myosin head into its high-energy position?",
  "Hydrolysis of ATP to ADP plus phosphate", ["Release of calcium from troponin C", "Binding of a second actin molecule to tropomyosin", "Pumping sodium into the sarcoplasmic reticulum"],
  "Myosin ATPase hydrolyzes ATP, storing the energy in the cocked ADP-Pi myosin head for the next cycle.",
  "Order ATP binding, hydrolysis, attachment, and the power stroke.", ["cross-bridge", "ATP"]);
q("Chapter 6", "Skeletal muscle", "Titin", 2,
  "Which sarcomeric protein centers the thick filament and contributes passive elastic recoil when muscle is stretched?",
  "Titin", ["Troponin I", "Dystrophin", "Calmodulin"],
  "Titin spans from the Z disc toward the thick filament, stabilizes it, and behaves as a molecular spring.",
  "State titin's structural and elastic roles.", ["sarcomere", "titin"]);
q("Chapter 6", "Skeletal muscle", "Optimal length", 4,
  "Why is active skeletal-muscle tension maximal near a sarcomere length of about 2.0 to 2.2 micrometers?",
  "Actin and myosin overlap optimally without excessive thin-filament interference", ["Thick filaments completely disappear", "Every myosin head is detached by ATP depletion", "No actin overlaps myosin"],
  "Maximum active force needs many possible cross-bridges without excessive overlap or compression; excessive shortening or stretch reduces productive interactions.",
  "Explain the molecular basis of the length-tension curve.", ["length-tension", "application"], "core");
q("Chapter 6", "Skeletal muscle", "Force-velocity relation", 4,
  "During an isotonic skeletal-muscle contraction, increasing the opposing load generally has what effect on shortening velocity?",
  "It decreases shortening velocity", ["It increases shortening velocity without limit", "It has no effect until the muscle tears", "It reverses ATP hydrolysis at every load"],
  "Muscle shortens fastest against a light load; as load approaches maximal isometric force, shortening velocity approaches zero.",
  "Interpret the force-velocity relationship.", ["force-velocity", "application"]);
q("Chapter 6", "Skeletal muscle", "Fiber types", 3,
  "Which profile best describes a slow oxidative type I skeletal-muscle fiber?",
  "Many mitochondria, abundant myoglobin and capillaries, and high fatigue resistance", ["Few mitochondria, little myoglobin, and fastest fatigue", "No oxidative enzymes and no blood supply", "Largest diameter with exclusively anaerobic metabolism"],
  "Type I fibers are red, richly vascularized, mitochondrial, and adapted for sustained aerobic activity.",
  "Recognize the properties of type I fibers.", ["fiber-types", "type-I"]);
q("Chapter 6", "Skeletal muscle", "Size principle", 4,
  "As force demand gradually increases, which motor units are normally recruited first?",
  "Small, fatigue-resistant motor units", ["The largest, fastest-fatiguing units", "All motor units simultaneously", "Only denervated motor units"],
  "The size principle recruits small low-threshold units first, then progressively larger high-force units.",
  "Apply the size principle of motor-unit recruitment.", ["motor-unit", "recruitment"], "core");

// Chapter 7 expansion - neuromuscular transmission and excitation-contraction coupling (8)
q("Chapter 7", "Neuromuscular junction", "Nicotinic receptor", 3,
  "At the adult neuromuscular junction, opening one nicotinic acetylcholine receptor normally requires what?",
  "Binding of two acetylcholine molecules to alpha subunits", ["Binding of one norepinephrine molecule", "Direct phosphorylation by myosin light-chain kinase", "Entry of calcium through the DHP receptor"],
  "The muscle nicotinic receptor is a pentameric ligand-gated cation channel with two alpha ACh-binding sites.",
  "Recall nicotinic receptor stoichiometry and activation.", ["acetylcholine", "nicotinic-receptor"]);
q("Chapter 7", "Neuromuscular junction", "Graded versus all-or-none", 4,
  "Which statement correctly compares the end-plate potential with the muscle action potential?",
  "The end-plate potential is graded; if it reaches threshold, nearby voltage-gated Na+ channels generate an all-or-none action potential", ["Both are always all-or-none events produced by the same receptor", "The end-plate potential is generated mainly by voltage-gated K+ channels", "The muscle action potential remains confined to the motor end plate"],
  "ACh receptor current produces a local graded EPP. Nearby voltage-gated Na+ channels convert sufficient depolarization into a regenerative action potential.",
  "Differentiate an EPP from a muscle action potential.", ["end-plate-potential", "action-potential"], "core");
q("Chapter 7", "Neuromuscular junction", "Quantal release", 4,
  "A miniature end-plate potential recorded without a motor-neuron action potential usually represents what?",
  "Spontaneous release of acetylcholine from one synaptic vesicle", ["A full skeletal-muscle action potential", "Opening of every receptor at the end plate", "One cycle of the Na+/K+-ATPase"],
  "One vesicle is one quantum of transmitter; spontaneous fusion produces a small miniature EPP.",
  "Explain quantal acetylcholine release.", ["quantal-release", "end-plate-potential"]);
q("Chapter 7", "Neuromuscular junction", "Junctional folds", 4,
  "Where are voltage-gated Na+ channels concentrated relative to nicotinic ACh receptors at the motor end plate?",
  "Na+ channels are concentrated deeper in junctional folds, while ACh receptors are dense near their crests", ["Both are located only in the presynaptic terminal", "ACh receptors are only in T tubules", "Na+ channels float freely in the synaptic cleft"],
  "ACh receptors detect transmitter at fold crests; Na+ channels deeper along the folds initiate the muscle action potential.",
  "Relate motor end-plate microanatomy to function.", ["junctional-folds", "image-recognition"]);
q("Chapter 7", "Neuromuscular junction", "Competitive blockade", 3,
  "Curare-like nondepolarizing neuromuscular blockers cause weakness primarily by what action?",
  "Competitive blockade of postsynaptic nicotinic acetylcholine receptors", ["Inhibition of acetylcholine synthesis by skeletal muscle", "Persistent opening of ryanodine receptors", "Activation of muscarinic receptors"],
  "Competitive receptor blockade reduces end-plate current and can lower the EPP below threshold despite normal ACh release.",
  "Explain nondepolarizing neuromuscular blockade.", ["curare", "nicotinic-receptor", "application"]);
q("Chapter 7", "Excitation-contraction coupling", "Triad anatomy", 3,
  "What structures form a skeletal-muscle triad?",
  "One T tubule flanked by two terminal cisternae of sarcoplasmic reticulum", ["One Z disc between two thick filaments", "Two T tubules around one nucleus", "One motor axon between two Schwann cells"],
  "At each A-I junction, a T tubule lies between two terminal cisternae.",
  "Identify triad components and location.", ["triad", "image-recognition"], "core");
q("Chapter 7", "Excitation-contraction coupling", "Skeletal versus cardiac coupling", 4,
  "Why can a skeletal-muscle twitch occur even when extracellular Ca2+ entry during its action potential is minimal?",
  "The DHP voltage sensor mechanically opens RyR1 to release Ca2+ already stored in the sarcoplasmic reticulum", ["Skeletal muscle does not require cytosolic Ca2+", "Troponin C binds sodium", "Acetylcholine releases calcium from mitochondria"],
  "In skeletal muscle, depolarization changes DHP receptor conformation and mechanically gates RyR1; extracellular trigger calcium is not the primary requirement.",
  "Distinguish skeletal from cardiac excitation-contraction coupling.", ["DHP", "ryanodine-receptor", "application"], "core");
q("Chapter 7", "Excitation-contraction coupling", "Malignant hyperthermia", 5,
  "A susceptible patient develops rigidity, hypercapnia, and rapidly rising temperature after a volatile anesthetic. Which treatment targets the skeletal-muscle defect?",
  "Dantrolene inhibition of ryanodine-receptor-mediated Ca2+ release", ["Curare activation of nicotinic receptors", "Atropine inhibition of acetylcholinesterase", "Digoxin activation of SERCA"],
  "Malignant hyperthermia reflects uncontrolled SR Ca2+ release, often through abnormal RyR1; dantrolene reduces that release.",
  "Apply excitation-contraction coupling to malignant hyperthermia.", ["malignant-hyperthermia", "ryanodine-receptor", "application"], "core");

// Chapter 8 expansion - smooth muscle (8)
q("Chapter 8", "Smooth muscle", "Dense bodies", 2,
  "Which smooth-muscle structure serves as an anchoring site analogous to the Z disc of skeletal muscle?",
  "Dense body", ["Terminal cisterna", "Motor end plate", "H zone"],
  "Actin and intermediate filaments attach to dense bodies, transmitting force through a non-sarcomeric network.",
  "Identify the Z-disc analogue in smooth muscle.", ["dense-body", "image-recognition"]);
q("Chapter 8", "Smooth muscle", "Multiunit muscle", 3,
  "Which is a classic example of multiunit smooth muscle with individually controlled fibers and little electrical coupling?",
  "Iris muscle", ["Intestinal wall", "Uterine myometrium during labor", "Urinary bladder detrusor"],
  "Iris and ciliary muscles are multiunit: fibers are more independently innervated and have few gap junctions.",
  "Recognize multiunit smooth muscle.", ["multiunit", "application"]);
q("Chapter 8", "Smooth muscle", "Single-unit muscle", 3,
  "Which property is most characteristic of single-unit visceral smooth muscle?",
  "Gap junctions allow many cells to contract as a functional syncytium", ["Every cell requires a separate motor end plate", "It contains sarcomeres and troponin", "It cannot respond to stretch"],
  "Visceral smooth muscle in organs such as gut and uterus is electrically coupled and often responds coordinately.",
  "Recognize single-unit smooth muscle.", ["single-unit", "gap-junction"]);
q("Chapter 8", "Smooth muscle", "Calcium source", 4,
  "Compared with skeletal muscle, smooth-muscle contraction depends more strongly on which calcium source?",
  "Entry from extracellular fluid through membrane calcium channels", ["Calcium bound to extracellular collagen", "Release from terminal cisternae exclusively", "Calcium synthesized by myosin ATPase"],
  "Smooth muscle has a less extensive sarcoplasmic reticulum, so extracellular Ca2+ entry commonly makes a major contribution.",
  "Compare calcium sources in smooth and skeletal muscle.", ["calcium-entry", "application"], "core");
q("Chapter 8", "Smooth muscle", "Action potentials", 4,
  "The rapid inward current of many smooth-muscle action potentials is carried mainly by which ion?",
  "Ca2+ through slow voltage-gated calcium channels", ["Na+ through only fast neuronal sodium channels", "K+ through delayed rectifier channels", "Cl- through acetylcholine receptors"],
  "Many smooth muscles use slow Ca2+ or Ca2+-Na+ channels for the upstroke, so their action potentials are slower and longer.",
  "Explain the ionic basis of smooth-muscle action potentials.", ["smooth-action-potential", "calcium-channel"]);
q("Chapter 8", "Smooth muscle", "Slow waves", 4,
  "Which statement about gastrointestinal smooth-muscle slow waves is most accurate?",
  "They are rhythmic membrane-potential oscillations that trigger spike potentials only when threshold is reached", ["Every slow wave is itself a full action potential", "They are caused by skeletal-muscle motor end plates", "They permanently hyperpolarize the membrane"],
  "Slow waves organize rhythmic excitability but usually are not action potentials; spikes appear near their peaks if threshold is crossed.",
  "Distinguish slow waves from spike potentials.", ["slow-waves", "rhythmicity"], "core");
q("Chapter 8", "Smooth muscle", "Stress-relaxation", 4,
  "Why can the bladder accommodate increased volume without maintaining a proportionally large pressure rise?",
  "Smooth muscle undergoes stress-relaxation, adapting its tension after stretch", ["Its cells immediately lose all actin", "Stretch permanently closes every ion channel", "It converts smooth muscle into skeletal muscle"],
  "After an initial stretch-induced tension increase, visceral smooth muscle can reduce tension and accommodate volume.",
  "Explain the stress-relaxation response.", ["stress-relaxation", "application"]);
q("Chapter 8", "Smooth muscle", "Nitric oxide", 4,
  "Endothelial nitric oxide relaxes vascular smooth muscle mainly through which intracellular messenger?",
  "cGMP", ["cAMP produced only by skeletal muscle", "IP3-mediated release of more Ca2+", "Troponin C"],
  "Nitric oxide activates soluble guanylyl cyclase, raises cGMP, and promotes relaxation.",
  "Explain nitric-oxide-mediated smooth-muscle relaxation.", ["nitric-oxide", "cGMP", "application"], "core");

if (items.length !== 112) throw new Error(`Expected 112 items, found ${items.length}`);

// Page-level teacher evidence. Questions absent from this map remain explicitly
// provisional even though the four filename-level scope documents now exist.
const teacherEvidence = new Map(Object.entries({
  1: ["Introduction to Cell Physiology PDF.pdf", "1"],
  2: ["Introduction to Cell Physiology PDF.pdf", "2"],
  3: ["Introduction to Cell Physiology PDF.pdf", "2"],
  6: ["Introduction to Cell Physiology PDF.pdf", "2"],
  9: ["Introduction to Cell Physiology PDF.pdf", "4"],
  15: ["Introduction to Cell Physiology PDF.pdf", "3, 6"],
  16: ["Introduction to Cell Physiology PDF.pdf", "8"],
  17: ["Introduction to Cell Physiology PDF.pdf", "8"],
  18: ["Introduction to Cell Physiology PDF.pdf", "8"],
  20: ["Introduction to Cell Physiology PDF.pdf", "6"],
  21: ["Introduction to Cell Physiology PDF.pdf", "9"],
  22: ["Introduction to Cell Physiology PDF.pdf", "9"],
  23: ["Introduction to Cell Physiology PDF.pdf", "9"],
  24: ["Introduction to Cell Physiology PDF.pdf", "9"],
  25: ["Introduction to Cell Physiology PDF.pdf", "7"],
  28: ["Introduction to Cell Physiology PDF.pdf", "6"],
  29: ["Introduction to Cell Physiology PDF.pdf", "4"],
  30: ["Introduction to Cell Physiology PDF.pdf", "8"],
  31: ["Introduction to Cell Physiology PDF.pdf", "10"],
  35: ["Introduction to Cell Physiology PDF.pdf", "10"],
  36: ["Introduction to Cell Physiology PDF.pdf", "11-12"],
  38: ["Introduction to Cell Physiology PDF.pdf", "10-11"],
  41: ["Introduction to Cell Physiology PDF.pdf", "13-14"],
  44: ["Introduction to Cell Physiology PDF.pdf", "12-13"],
  46: ["Introduction to Cell Physiology PDF.pdf", "14"],
  47: ["1. Molecular basis of contraction.pdf", "5, 7"],
  48: ["1. Molecular basis of contraction.pdf", "5, 9"],
  50: ["1. Molecular basis of contraction.pdf", "10-11"],
  51: ["1. Molecular basis of contraction.pdf", "13-24"],
  52: ["1. Molecular basis of contraction.pdf", "24"],
  53: ["1. Molecular basis of contraction.pdf", "13-24"],
  55: ["2. Skeletal muscle.pdf", "2"],
  56: ["2. Skeletal muscle.pdf", "3-4"],
  61: ["2. Skeletal muscle.pdf", "11, 14"],
  62: ["2. Skeletal muscle.pdf", "11-12, 14"],
  63: ["2. Skeletal muscle.pdf", "11, 13-14"],
  66: ["2. Skeletal muscle.pdf", "15"],
  67: ["2. Skeletal muscle.pdf", "17"],
  68: ["2. Skeletal muscle.pdf", "18"],
  69: ["2. Skeletal muscle.pdf", "19"],
  70: ["1. Molecular basis of contraction.pdf", "6"],
  71: ["3. Smooth muscle.pdf", "10-11"],
  72: ["3. Smooth muscle.pdf", "10-11"],
  73: ["3. Smooth muscle.pdf", "10-11, 13"],
  75: ["3. Smooth muscle.pdf", "12"],
  76: ["3. Smooth muscle.pdf", "9"],
  77: ["3. Smooth muscle.pdf", "6-8"],
  78: ["3. Smooth muscle.pdf", "15-16"],
  79: ["3. Smooth muscle.pdf", "10-11, 17"],
}));

const letters = ["A", "B", "C", "D"];
const output = items.map((item, index) => {
  const questionNumber = index + 1;
  const evidence = teacherEvidence.get(String(questionNumber));
  const correctIndex = index % 4;
  const optionTexts = [...item.wrong];
  optionTexts.splice(correctIndex, 0, item.correct);
  const options = optionTexts.map((text, optionIndex) => ({ id: letters[optionIndex], text }));
  const correctOptionId = letters[correctIndex];
  const distractorExplanations = Object.fromEntries(options
    .filter((option) => option.id !== correctOptionId)
    .map((option) => [option.id, `${option.text} is not the best answer. ${item.explanation}`]));
  return {
    schemaVersion: "1.0.0",
    id: `phys-term1-${String(index + 1).padStart(3, "0")}-v1`,
    revision: 1,
    status: "verified",
    kind: "single_best_answer",
    subject: "physiology",
    topic: item.topic,
    subtopic: item.subtopic,
    chapter: item.chapter,
    difficulty: item.difficulty,
    prompt: item.prompt,
    options,
    correctOptionId,
    acceptedFreeText: [correctOptionId, item.correct],
    explanation: item.explanation,
    distractorExplanations,
    learningObjective: item.objective,
    source: {
      title: "Guyton and Hall Textbook of Medical Physiology",
      edition: "15th (2026)",
      chapter: item.chapter,
      ...(evidence ? { lecture: evidence[0], page: evidence[1] } : {}),
    },
    tags: ["physiology", `chapter-${item.chapter.replace("Chapter ", "")}`, ...item.tags],
    examPriority: item.priority,
    qualityFlags: evidence
      ? ["teacher-slide-verified", "guyton-15e-cross-checked"]
      : ["teacher-filename-scope-pending-download", "guyton-15e-cross-checked"],
  };
});

const destination = resolve(import.meta.dirname, "../data/bank/questions/physiology-term1-general.jsonl");
writeFileSync(destination, `${output.map((item) => JSON.stringify(item)).join("\n")}\n`);
console.log(`Wrote ${output.length} questions to ${destination}`);
