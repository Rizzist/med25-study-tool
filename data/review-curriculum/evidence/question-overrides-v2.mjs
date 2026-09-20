// Exact question IDs inspected against the embedded bank's visible prompts.
// These refine broad Biochemistry Practical concept links to exact review topics.
export const practicalQuestionGroups = `
bp-glassware|lab|stock-flask final-volume meniscus mohr-delivery fumehood filter-versus-salt balance-tare
bp-safety|lab|centrifuge-balance pipette-aid eye-splash acid-dilution acetone-bath
bp-titration-principle|titration|endpoint-observation equivalence-ph
bp-titration-calculation|titration|nonzero-burette diprotic-normality overshoot-direction flask-dilution wet-burette tip-air unknown-aliquot titre-difference duplicate-titres base-molarity
bp-beer-lambert|photometry|transmittance-ratio protein-transmittance doubling-concentration pathlength cuvette-mismatch
bp-wavelength-standards|photometry|lambda-max dye-standard
bp-blanks-calibration|photometry|blank-selection intercept above-linearity turbid-sample blank-standard-control
bp-protein-assay|photometry|biuret-calculation ratio-not-raw shared-dilution predilution timing-wavelength reference-meaning
bp-ninhydrin|proteins|ninhydrin-yellow ninhydrin-not-protein ninhydrin-times decarboxylation
bp-xanthoproteic|proteins|xantho-orange phenylalanine
bp-pauly|proteins|pauly-pair pauly-reagent-order
bp-hopkins|proteins|hopkins-interface negative-hopkins
bp-biuret-tca|proteins|tripeptide hydrolysis-figure blue-versus-violet tca-protocols tca-meaning control-failure
bp-tests-overview|proteins|tyrosine-pattern
bp-amino-acid-properties|proteins|denaturation
bp-rennin-temperature|enzymes|rennin-identity pre-equilibration temperature-denaturation
bp-rennin-concentrations|enzymes|enzyme-table-control enzyme-relative enzyme-time substrate-table clot-not-km
bp-enzyme-foundations|enzymes|ph-specificity activation-equilibrium
bp-urease|enzymes|urease-comparison urease-specificity ammonia-indicator zinc-mechanism-limit indicator-control
bp-kinetics|enzymes|enzyme-saturation
bp-flame-principle|flame|emission-versus-absorption potassium-wavelength sodium-calibration flame-intercept matrix-effect selected-elements ise-alternative colour-mixture
bp-electrolytes|flame|electrolyte-charge saline-molarity
`;

// Exact anatomy target IDs in multi-bone figures. Anatomical target identity is
// supplied by the question/media metadata; these do not infer image locations.
export const boneTargetGroups = `
limbs-2d-upper-bones|upper-bones-|limbs-04-clavicle-scapula|coracoid-process superior-angle acromion clavicle scapula inferior-angle
limbs-2d-upper-bones|upper-bones-|limbs-05-humerus|intertubercular-groove surgical-neck lesser-tubercle greater-tubercle deltoid-tuberosity humerus
limbs-2d-upper-bones|upper-bones-|limbs-06-distal-humerus|medial-epicondyle lateral-epicondyle trochlea capitulum
limbs-2d-upper-bones|upper-bones-|limbs-07-radius-ulna|coronoid-process ulna ulna-styloid-process radius-styloid-process radius tuberosity-of-radius head-of-radius
limbs-2d-upper-bones|upper-bones-|limbs-16-carpals|carpal-bones
limbs-2d-lower-bones|lower-bones-|limbs-22-hip-bone|ilium pubis ischium
limbs-2d-lower-bones|lower-bones-|limbs-23-femur|femur
limbs-2d-lower-bones|lower-bones-|limbs-31-knee-bones|patella tibia fibula
limbs-2d-lower-bones|lower-bones-|limbs-37-tarsals|talus navicular medial-cuneiform calcaneus metatarsals phalanges
`;

// Mixed concepts checked at question level so their principal study targets do
// not inherit an over-broad chapter-level relationship.
export const generalQuestionGroups = `
cvs/measurement-special-circulations|depth-cvs-phys-015
cvs/advanced-return-pressure|depth-cvs-phys-016
cvs/pericardium|depth-cvs-phys-017
cvs/coronary-exercise|depth-cvs-phys-018 depth-cvs-phys-019
cvs/ecg-axis|comp-cvs-phys-009 comp-cvs-phys-010
cvs/advanced-excitation|comp-cvs-phys-011
cvs/ecg-foundations|comp-cvs-phys-012 comp-cvs-phys-013 comp-cvs-phys-016
cvs/ecg-patterns|comp-cvs-phys-014 comp-cvs-phys-015
limbs/limbs-22-hip-bone|limb-ll-025
limbs/limbs-23-femur|limb-ll-026 limb-ll-031
limbs/limbs-07-radius-ulna|comp-limbs-011 comp-limbs-014
limbs/limbs-06-distal-humerus|comp-limbs-012
limbs/limbs-17-wrist-tunnels|comp-limbs-013
limbs/limbs-12-arm|comp-limbs-015
`;
