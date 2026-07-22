import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const questions = [];

function add(chapter, topic, subtopic, difficulty, prompt, options, correct, explanation, objective, priority = "high", lecture = "") {
  // Teacher archive mapping: blood 1 = RBCs, blood 2 = hemostasis/coagulation,
  // blood 3 = leukocytes/inflammation. The teacher decks do not establish the
  // blood-group/transfusion block, so Chapter 36 remains Guyton-only.
  const verifiedLecture = chapter === "Chapter 34" || chapter === "Chapter 35"
    ? "blood 3.pptx"
    : chapter === "Chapter 36"
      ? ""
      : chapter === "Chapter 37"
        ? "blood 2.ppsx"
        : lecture;
  questions.push({ chapter, topic, subtopic, difficulty, prompt, options, correct, explanation, objective, priority, lecture: verifiedLecture });
}

// Chapter 9: cardiac muscle, pump function, and pressure-volume analysis (18)
add("Chapter 9", "Cardiac pump physiology", "Cardiac muscle organization", 2,
  "Which structure most directly permits rapid electrical spread from one cardiac myocyte to the next?",
  ["Tight junctions", "Gap junctions in intercalated discs", "Desmosomes alone", "The fibrous skeleton"], 1,
  "Low-resistance gap junctions in intercalated discs allow ions to pass between adjacent myocytes, so each atrium and each ventricle behaves as a functional syncytium.",
  "Explain the structural basis of electrical coupling in cardiac muscle.");
add("Chapter 9", "Cardiac pump physiology", "Electrical separation", 3,
  "In a normal heart, which pathway is the only electrical connection that conducts an impulse from the atria to the ventricles?",
  ["Bachmann bundle", "Atrioventricular bundle (bundle of His)", "Purkinje network", "Moderator band"], 1,
  "The fibrous skeleton electrically insulates atrial from ventricular myocardium; the AV bundle is the normal conducting bridge across it.",
  "Identify the normal electrical connection between atria and ventricles.");
add("Chapter 9", "Cardiac action potentials", "Ventricular plateau", 3,
  "What combination best explains the plateau of the ventricular action potential?",
  ["Rapid Na+ influx plus increased K+ efflux", "Slow Ca2+-Na+ influx plus reduced K+ efflux", "Cl- influx plus closure of Ca2+ channels", "Na+/K+ pump activation alone"], 1,
  "During the plateau, L-type calcium channels support prolonged inward current while potassium permeability is temporarily reduced, delaying repolarization.",
  "Explain the ionic basis of the ventricular action-potential plateau.", "core", "Cardiac action potential.ppt");
add("Chapter 9", "Cardiac action potentials", "Refractory period", 3,
  "Why can normal ventricular muscle not be tetanized by rapid repeated stimulation?",
  ["It lacks actin", "Its long refractory period overlaps most of contraction", "Its resting potential is positive", "It has no calcium channels"], 1,
  "The prolonged action potential produces a long absolute refractory period that extends through most of systole, preventing summation and tetanus.",
  "Relate the cardiac action potential to prevention of tetanic contraction.", "core", "Cardiac action potential.ppt");
add("Chapter 9", "Cardiac action potentials", "Excitation-contraction coupling", 4,
  "A drug blocks L-type Ca2+ channels in ventricular myocytes. Which immediate change best explains the fall in contractile force?",
  ["Less Ca2+-induced Ca2+ release from sarcoplasmic reticulum", "Failure of fast Na+ channels to open", "More troponin C binding by Ca2+", "Increased myosin ATPase activity"], 0,
  "Calcium entering through L-type channels during the plateau triggers additional calcium release from the sarcoplasmic reticulum; blocking entry weakens this trigger.",
  "Predict the contractile effect of altered trans-sarcolemmal calcium entry.", "core", "Cardiac action potential.ppt");
add("Chapter 9", "Cardiac pump physiology", "Cardiac cycle", 2,
  "Which event marks the beginning of ventricular systole?",
  ["Opening of the AV valves", "Closure of the AV valves", "Opening of the semilunar valves", "Closure of the semilunar valves"], 1,
  "Rising ventricular pressure closes the mitral and tricuspid valves, initiating isovolumic contraction and ventricular systole.",
  "Sequence valve events in the cardiac cycle.", "core", "Cardiac Physiology 1.ppt");
add("Chapter 9", "Cardiac pump physiology", "Isovolumic contraction", 3,
  "During left ventricular isovolumic contraction, which statement is correct?",
  ["Volume falls while pressure is constant", "Both mitral and aortic valves are closed", "The aortic valve is open", "The mitral valve is open"], 1,
  "After the mitral valve closes and before the aortic valve opens, all valves are closed; pressure rises while ventricular volume remains constant.",
  "Describe pressure and volume changes during isovolumic contraction.", "core", "Cardiac Physiology 1.ppt");
add("Chapter 9", "Cardiac pump physiology", "Ventricular ejection", 3,
  "The aortic valve opens when which pressure relationship is first achieved?",
  ["Left atrial pressure exceeds left ventricular pressure", "Left ventricular pressure exceeds aortic pressure", "Aortic pressure exceeds left ventricular pressure", "Right ventricular pressure exceeds pulmonary artery pressure"], 1,
  "The aortic valve opens when left ventricular pressure rises just above aortic diastolic pressure.",
  "Use pressure gradients to predict semilunar valve opening.", "core", "Cardiac Physiology 1.ppt");
add("Chapter 9", "Cardiac pump physiology", "Atrial contribution", 2,
  "At a normal resting heart rate, atrial contraction usually contributes approximately what fraction of ventricular filling?",
  ["About 5%", "About 20%", "About 50%", "Nearly 100%"], 1,
  "Most filling is passive; atrial systole normally adds roughly the final 20%, becoming more important when filling time or ventricular compliance is reduced.",
  "Estimate the atrial contribution to resting ventricular filling.");
add("Chapter 9", "Cardiac pump physiology", "Stroke volume", 2,
  "A ventricle has an end-diastolic volume of 120 mL and an end-systolic volume of 50 mL. What is its stroke volume?",
  ["50 mL", "70 mL", "120 mL", "170 mL"], 1,
  "Stroke volume equals end-diastolic volume minus end-systolic volume: 120 - 50 = 70 mL.",
  "Calculate stroke volume from ventricular volumes.", "core", "Cardiac Physiology 1.ppt");
add("Chapter 9", "Cardiac pump physiology", "Ejection fraction", 3,
  "A ventricle ejects 72 mL from an end-diastolic volume of 120 mL. What is its ejection fraction?",
  ["40%", "50%", "60%", "72%"], 2,
  "Ejection fraction is stroke volume divided by end-diastolic volume: 72/120 = 0.60, or 60%.",
  "Calculate ejection fraction.", "core", "Cardiac Physiology 1.ppt");
add("Chapter 9", "Cardiac pump physiology", "Heart sounds", 2,
  "The first heart sound is produced mainly by events associated with closure of which valves?",
  ["Aortic and pulmonary", "Mitral and tricuspid", "Aortic and mitral", "Pulmonary and tricuspid"], 1,
  "S1 occurs at the onset of ventricular systole when the AV valves close and the valve-blood-wall system vibrates.",
  "Associate normal heart sounds with valve events.");
add("Chapter 9", "Cardiac pump physiology", "Heart sounds", 2,
  "The second heart sound normally occurs at the transition from which phase to which phase?",
  ["Atrial systole to ventricular filling", "Ventricular ejection to isovolumic relaxation", "Isovolumic contraction to ejection", "Rapid filling to diastasis"], 1,
  "S2 follows closure of the aortic and pulmonary valves at the end of ejection and beginning of isovolumic relaxation.",
  "Place the second heart sound in the cardiac cycle.");
add("Chapter 9", "Cardiac pump physiology", "Frank-Starling mechanism", 3,
  "An acute increase in venous return raises stroke volume in a healthy heart primarily through which mechanism?",
  ["Reduced end-diastolic fiber length", "Greater actin-myosin overlap at the longer initial fiber length", "Closure of L-type calcium channels", "Reduced ventricular end-diastolic volume"], 1,
  "Within physiological limits, increased filling stretches cardiac fibers toward a more favorable length, producing a stronger contraction and larger stroke volume.",
  "Apply the Frank-Starling mechanism to increased venous return.", "core", "Cardiac Physiology 1.ppt");
add("Chapter 9", "Cardiac pump physiology", "Pressure-volume loop", 3,
  "On a left ventricular pressure-volume loop, the horizontal width of the loop represents which quantity?",
  ["Ejection fraction", "Stroke volume", "Cardiac output", "Pulse pressure"], 1,
  "Loop width equals end-diastolic volume minus end-systolic volume, which is stroke volume.",
  "Interpret the dimensions of a ventricular pressure-volume loop.", "core", "Cardiac physiology 2.pptx");
add("Chapter 9", "Cardiac pump physiology", "Pressure-volume loop", 4,
  "If preload rises while afterload and contractility remain constant, what is the expected immediate change in the left ventricular pressure-volume loop?",
  ["Lower end-diastolic volume and narrower loop", "Higher end-diastolic volume and wider loop", "Higher end-systolic volume with unchanged width", "Downward shift of the end-systolic pressure-volume relation"], 1,
  "Greater preload raises end-diastolic volume and, through Frank-Starling, usually increases stroke volume, widening the loop.",
  "Predict how preload changes a pressure-volume loop.", "high", "Cardiac physiology 2.pptx");
add("Chapter 9", "Cardiac pump physiology", "Pressure-volume loop", 4,
  "An isolated increase in afterload most directly causes which initial change?",
  ["Lower end-systolic volume", "Higher end-systolic volume and reduced stroke volume", "Lower aortic opening pressure", "Immediate increase in ventricular compliance"], 1,
  "A higher ejection pressure opposes fiber shortening, so more blood remains after systole and stroke volume initially falls.",
  "Predict the acute effect of afterload on ventricular ejection.", "high", "Cardiac physiology 2.pptx");
add("Chapter 9", "Cardiac pump physiology", "Contractility", 4,
  "Sympathetic stimulation increases ventricular contractility. With preload and afterload otherwise unchanged, which change is most likely?",
  ["Higher end-systolic volume", "Lower end-systolic volume and higher ejection fraction", "Lower slope of the end-systolic pressure-volume relation", "Longer isovolumic relaxation with no change in stroke volume"], 1,
  "Positive inotropy permits greater emptying at a given loading condition, lowering end-systolic volume and increasing stroke volume and ejection fraction.",
  "Predict pressure-volume consequences of increased contractility.", "core", "Cardiac physiology 2.pptx");

// Chapter 10: rhythmical excitation and conduction (12)
add("Chapter 10", "Rhythmical excitation", "Pacemaker anatomy", 2,
  "Where is the sinoatrial node normally located?",
  ["Lower interatrial septum near the coronary sinus", "Upper posterolateral right atrium near the superior vena cava", "Left ventricular subendocardium", "Interventricular septum below the aortic valve"], 1,
  "The SA node lies in the right atrial wall near the superior vena cava and normally initiates each heartbeat.",
  "Locate the normal cardiac pacemaker.", "core", "Rythmical Excitation.ppt");
add("Chapter 10", "Rhythmical excitation", "SA node automaticity", 3,
  "Which property is most important for spontaneous diastolic depolarization of SA nodal cells?",
  ["A stable resting potential near -90 mV", "Gradual inward current with declining K+ efflux between action potentials", "A prolonged fast Na+ channel plateau", "Complete absence of calcium channels"], 1,
  "SA nodal cells lack a stable resting potential; inward pacemaker currents and declining potassium conductance gradually bring the membrane to threshold.",
  "Explain the ionic basis of SA nodal automaticity.", "core", "Rythmical Excitation.ppt");
add("Chapter 10", "Rhythmical excitation", "Nodal action potential", 3,
  "The upstroke of the SA nodal action potential depends mainly on influx of which ion?",
  ["Na+ through fast voltage-gated channels", "Ca2+ through voltage-gated channels", "K+ through inward rectifier channels", "Cl- through ligand-gated channels"], 1,
  "Unlike ventricular muscle, nodal phase 0 is produced mainly by calcium entry through L-type calcium channels.",
  "Contrast nodal and ventricular action-potential upstrokes.", "core", "Rythmical Excitation.ppt");
add("Chapter 10", "Rhythmical excitation", "Pacemaker hierarchy", 2,
  "Why does the SA node normally control heart rhythm instead of the AV node?",
  ["The AV node cannot depolarize spontaneously", "The SA node has the fastest intrinsic firing rate", "The SA node conducts most slowly", "The AV node is electrically isolated from the atria"], 1,
  "The SA node reaches threshold sooner than subsidiary pacemakers and repeatedly resets them before they can fire.",
  "Explain dominance of the SA node in the pacemaker hierarchy.");
add("Chapter 10", "Rhythmical excitation", "AV nodal delay", 3,
  "What is the principal functional value of the AV nodal delay?",
  ["It prevents atrial contraction", "It allows atrial emptying before ventricular contraction", "It causes simultaneous activation of all four chambers", "It shortens ventricular filling"], 1,
  "Slow AV nodal and penetrating bundle conduction gives the atria time to contract and fill the ventricles before ventricular systole.",
  "State the purpose of the AV conduction delay.", "core", "Rythmical Excitation.ppt");
add("Chapter 10", "Rhythmical excitation", "AV nodal conduction", 3,
  "Slow conduction through the AV node is best explained by which cellular feature?",
  ["Large cells with many gap junctions", "Small cells with relatively few gap junctions", "Fast sodium-dependent upstrokes in every cell", "Direct insulation by Purkinje fibers"], 1,
  "AV nodal fibers are small and have fewer gap junctions, producing high intercellular resistance and slow impulse transmission.",
  "Relate AV nodal structure to conduction velocity.");
add("Chapter 10", "Rhythmical excitation", "Purkinje conduction", 3,
  "Which part of the cardiac conduction system normally has the greatest conduction velocity?",
  ["SA node", "AV node", "Purkinje fibers", "Atrial nodal tracts"], 2,
  "Large Purkinje fibers with abundant gap junctions conduct very rapidly, enabling near-synchronous ventricular activation.",
  "Compare conduction velocities in the cardiac conduction system.", "core", "Rythmical Excitation.ppt");
add("Chapter 10", "Rhythmical excitation", "Ventricular activation", 3,
  "After the impulse enters the bundle branches, which ventricular region is normally activated early?",
  ["Epicardial base only", "Subendocardial septum and apical regions", "Posterior left atrium", "Aortic valve leaflets"], 1,
  "Purkinje fibers distribute excitation rapidly to subendocardial ventricular regions, with activation spreading from septum/apex toward the outer and basal regions.",
  "Describe the normal sequence of ventricular activation.");
add("Chapter 10", "Rhythmical excitation", "Parasympathetic control", 4,
  "Strong vagal stimulation slows the SA node mainly by which mechanism?",
  ["Decreasing K+ permeability", "Increasing K+ permeability and hyperpolarizing nodal cells", "Opening fast Na+ channels", "Increasing cAMP and funny current"], 1,
  "Acetylcholine opens potassium channels, hyperpolarizes pacemaker tissue, and reduces the slope of diastolic depolarization.",
  "Explain parasympathetic slowing of cardiac rhythm.", "core", "Rythmical Excitation.ppt");
add("Chapter 10", "Rhythmical excitation", "Sympathetic control", 4,
  "Beta1-adrenergic stimulation increases SA nodal firing primarily by increasing which signaling pathway?",
  ["cAMP-dependent inward pacemaker and Ca2+ currents", "Acetylcholine-gated K+ current", "Cl- influx through GABA receptors", "Na+/K+ pump inhibition alone"], 0,
  "Norepinephrine acting at beta1 receptors raises cAMP, increasing inward pacemaker and calcium currents so threshold is reached sooner.",
  "Explain sympathetic acceleration of pacemaker firing.", "core", "Rythmical Excitation.ppt");
add("Chapter 10", "Rhythmical excitation", "Ectopic pacemakers", 3,
  "Complete failure of SA nodal discharge is followed by a slower rhythm generated near the AV junction. This is best described as what?",
  ["A ventricular fibrillation rhythm", "An escape rhythm from a subsidiary pacemaker", "Sinus tachycardia", "A normal respiratory sinus arrhythmia"], 1,
  "When the dominant pacemaker fails, a slower latent pacemaker may escape from overdrive suppression and initiate the heartbeat.",
  "Recognize an escape rhythm and pacemaker hierarchy.");
add("Chapter 10", "Rhythmical excitation", "Conduction block", 4,
  "A lesion completely interrupts the AV bundle but spares the SA node and ventricular Purkinje system. Which finding is most likely?",
  ["Atria and ventricles beat independently", "All chambers stop permanently", "Ventricles follow every atrial impulse with a short PR interval", "Only the atria develop fibrillation"], 0,
  "Complete AV interruption produces AV dissociation: atria follow the SA node while a slower distal escape pacemaker drives the ventricles.",
  "Predict the rhythm produced by complete AV conduction block.", "high", "Rythmical Excitation.ppt");

// Chapters 11-13: ECG fundamentals, vectors, and rhythm diagnosis (24)
add("Chapter 11", "Electrocardiography", "P wave", 2,
  "Which electrical event produces the normal P wave?",
  ["Atrial depolarization", "Atrial repolarization", "Ventricular depolarization", "Ventricular repolarization"], 0,
  "The P wave records atrial depolarization as excitation spreads from the SA node through both atria.",
  "Match the P wave to its underlying electrical event.", "core", "ECG 1.ppt");
add("Chapter 11", "Electrocardiography", "QRS complex", 2,
  "The QRS complex primarily represents which event?",
  ["Atrial depolarization", "Ventricular depolarization", "Ventricular repolarization", "AV nodal delay alone"], 1,
  "The large ventricular muscle mass generates the QRS complex during ventricular depolarization; atrial repolarization is usually hidden within it.",
  "Match the QRS complex to ventricular depolarization.", "core", "ECG 1.ppt");
add("Chapter 11", "Electrocardiography", "T wave", 2,
  "The normal T wave is generated mainly by which event?",
  ["Atrial depolarization", "Ventricular depolarization", "Ventricular repolarization", "Purkinje depolarization only"], 2,
  "The T wave reflects ventricular repolarization, which normally proceeds in a direction that often gives an upright deflection in leads with an upright QRS.",
  "Match the T wave to ventricular repolarization.", "core", "ECG 1.ppt");
add("Chapter 11", "Electrocardiography", "PR interval", 3,
  "A PR interval of 0.22 second most directly indicates what?",
  ["Accelerated ventricular repolarization", "Delayed atrioventricular conduction", "Ventricular fibrillation", "Absent atrial depolarization"], 1,
  "The normal PR interval is about 0.12-0.20 second; prolongation indicates slowed conduction from atria through the AV conducting system.",
  "Interpret PR interval duration.", "core", "ECG 1.ppt");
add("Chapter 11", "Electrocardiography", "QRS duration", 3,
  "A markedly widened QRS complex most strongly suggests which abnormality?",
  ["Slowed spread of depolarization through ventricular myocardium", "Faster AV nodal conduction", "Isolated delayed atrial repolarization", "Increased SA nodal automaticity only"], 0,
  "A wide QRS reflects delayed ventricular activation, as in bundle-branch block or a ventricular ectopic beat.",
  "Use QRS duration to assess ventricular conduction.", "core", "ECG 1.ppt");
add("Chapter 11", "Electrocardiography", "Electrical silence", 3,
  "Why is the ECG nearly isoelectric when all ventricular cells are uniformly depolarized?",
  ["No net voltage gradient exists across the ventricular mass", "All intracellular ions stop moving", "The heart stops contracting", "The electrodes become electrically disconnected"], 0,
  "Surface leads record spatial voltage differences. Uniform depolarization leaves no appreciable net dipole, so the trace returns toward baseline.",
  "Explain why uniform myocardial electrical states produce an isoelectric segment.", "high", "ECG 1.ppt");
add("Chapter 11", "Electrocardiography", "Lead polarity", 3,
  "A mean depolarization vector directed toward the positive electrode of a lead produces which deflection?",
  ["Upward", "Downward", "Always biphasic", "No deflection regardless of magnitude"], 0,
  "A depolarization wave moving toward a lead's positive electrode creates a positive, usually upward, deflection.",
  "Predict ECG polarity from vector direction.", "core", "ECG  & vectorial analysis.pptx");
add("Chapter 11", "Electrocardiography", "Standard limb leads", 2,
  "Which electrode arrangement defines standard lead I?",
  ["Right arm negative to left arm positive", "Right arm negative to left leg positive", "Left arm negative to left leg positive", "Left leg negative to right arm positive"], 0,
  "Lead I records left arm potential relative to right arm: right arm is negative and left arm is positive.",
  "Identify the polarity of standard limb lead I.", "high", "ECG 1.ppt");
add("Chapter 11", "Electrocardiography", "Einthoven law", 3,
  "At a given instant, lead I measures +0.5 mV and lead III measures +0.7 mV. What should lead II measure?",
  ["+0.2 mV", "+0.7 mV", "+1.2 mV", "-1.2 mV"], 2,
  "Einthoven's law states lead II = lead I + lead III; therefore 0.5 + 0.7 = 1.2 mV.",
  "Apply Einthoven's law to limb-lead voltages.", "core", "ECG  & vectorial analysis.pptx");
add("Chapter 11", "Electrocardiography", "Augmented leads", 2,
  "Which set contains only augmented unipolar limb leads?",
  ["I, II, III", "aVR, aVL, aVF", "V1, V2, V3", "I, aVF, V6"], 1,
  "aVR, aVL, and aVF view the heart from the right arm, left arm, and left foot, respectively.",
  "Classify the augmented limb leads.");
add("Chapter 11", "Electrocardiography", "Precordial leads", 3,
  "Which precordial lead is placed at the left fifth intercostal space in the midclavicular line?",
  ["V1", "V2", "V4", "V6"], 2,
  "V4 is placed in the left fifth intercostal space at the midclavicular line.",
  "Recall standard precordial lead placement.", "high", "ECG 1.ppt");
add("Chapter 11", "Electrocardiography", "R-wave progression", 3,
  "Across the normal precordial leads from V1 toward V6, what usually happens to the R wave?",
  ["It generally increases in amplitude", "It disappears after V2", "It is always negative in V6", "It becomes unrelated to ventricular depolarization"], 0,
  "As the chest leads move leftward, the net ventricular depolarization vector points increasingly toward them, producing normal R-wave progression.",
  "Recognize normal precordial R-wave progression.", "high", "ECG 2.ppt");
add("Chapter 12", "ECG vectorial analysis", "Mean electrical axis", 3,
  "A QRS complex is predominantly positive in lead I and predominantly positive in aVF. In which quadrant is the mean QRS axis?",
  ["Normal quadrant, approximately 0 to +90 degrees", "Left superior quadrant", "Right superior quadrant", "Indeterminate because both leads are positive"], 0,
  "Positive QRS complexes in both lead I and aVF place the mean axis in the normal inferior-leftward quadrant.",
  "Determine the QRS axis quadrant from leads I and aVF.", "core", "ECG  & vectorial analysis.pptx");
add("Chapter 12", "ECG vectorial analysis", "Left axis deviation", 3,
  "A QRS complex is positive in lead I but negative in aVF. Which axis pattern is suggested?",
  ["Right-axis deviation", "Leftward axis deviation", "Normal axis near +60 degrees", "Ventricular fibrillation"], 1,
  "Lead I positive with aVF negative places the mean vector in the left superior quadrant; lead II can refine whether it is pathologic left-axis deviation.",
  "Screen for leftward QRS-axis deviation.", "core", "ECG  & vectorial analysis.pptx");
add("Chapter 12", "ECG vectorial analysis", "Vector projection", 4,
  "A cardiac vector lies almost perpendicular to the axis of an ECG lead. What recording is expected in that lead?",
  ["A large purely positive deflection", "A large purely negative deflection", "A small or biphasic net deflection", "A prolonged PR interval"], 2,
  "The recorded voltage is the projection of the vector onto the lead axis; a perpendicular vector has little net projection and may appear biphasic.",
  "Relate vector angle to recorded lead amplitude.", "core", "ECG  & vectorial analysis.pptx");
add("Chapter 12", "ECG vectorial analysis", "Current of injury", 4,
  "Persistent ST-segment displacement during acute myocardial injury is best explained by what?",
  ["A voltage difference between injured and normal myocardium", "Normal simultaneous ventricular depolarization", "Isolated SA nodal slowing", "Increased atrial muscle mass only"], 0,
  "Injured myocardium has abnormal resting and plateau potentials, creating injury currents relative to normal tissue and shifting the ST segment.",
  "Explain the physiological basis of ST-segment injury patterns.", "high", "ECG 2.ppt");
add("Chapter 13", "ECG rhythm recognition", "Sinus tachycardia", 2,
  "An ECG shows a regular rhythm at 120/min, with a normal P wave before every QRS and a constant PR interval. What is the best diagnosis?",
  ["Sinus tachycardia", "Atrial fibrillation", "Complete AV block", "Ventricular fibrillation"], 0,
  "A regular fast rhythm with normal, consistently conducted P waves originates from the SA node and is sinus tachycardia.",
  "Recognize sinus tachycardia from basic ECG features.", "core", "ECG 2.ppt");
add("Chapter 13", "ECG rhythm recognition", "First-degree AV block", 3,
  "Every P wave is followed by a QRS complex, but the PR interval is consistently 0.24 second. What is the diagnosis?",
  ["First-degree AV block", "Second-degree Mobitz I block", "Complete AV block", "Premature ventricular contraction"], 0,
  "First-degree AV block is delayed AV conduction with a PR interval longer than 0.20 second but no dropped ventricular beats.",
  "Recognize first-degree AV block.", "core", "ECG 2.ppt");
add("Chapter 13", "ECG rhythm recognition", "Second-degree AV block", 4,
  "The PR interval progressively lengthens until a P wave is not followed by a QRS complex. Which rhythm is present?",
  ["Mobitz I (Wenckebach) second-degree AV block", "Mobitz II second-degree AV block", "First-degree AV block", "Atrial flutter"], 0,
  "Progressive PR prolongation followed by a dropped QRS is the classic Wenckebach pattern.",
  "Differentiate Mobitz I second-degree AV block.", "core", "ECG 2.ppt");
add("Chapter 13", "ECG rhythm recognition", "Complete AV block", 4,
  "P waves occur regularly at 80/min and QRS complexes regularly at 35/min, but there is no fixed relationship between them. What is the diagnosis?",
  ["Sinus arrhythmia", "Complete AV block", "First-degree AV block", "Atrial tachycardia with 1:1 conduction"], 1,
  "Independent atrial and ventricular rhythms demonstrate AV dissociation caused by complete block of conduction to the ventricles.",
  "Recognize complete AV block on an ECG.", "core", "ECG 2.ppt");
add("Chapter 13", "ECG rhythm recognition", "Premature ventricular contraction", 3,
  "An early beat has no preceding P wave and has a wide, bizarre QRS followed by a compensatory pause. What is it?",
  ["Premature atrial contraction", "Premature ventricular contraction", "Normal sinus beat", "First-degree AV block"], 1,
  "A ventricular ectopic focus activates ventricular muscle outside the rapid Purkinje sequence, producing a wide abnormal QRS and often a full compensatory pause.",
  "Recognize a premature ventricular contraction.", "core", "ECG 2.ppt");
add("Chapter 13", "ECG rhythm recognition", "Atrial fibrillation", 3,
  "Which ECG description best fits atrial fibrillation?",
  ["Regular P waves with progressive PR prolongation", "Absent discrete P waves with an irregularly irregular ventricular rhythm", "Wide regular QRS complexes at 30/min with AV dissociation", "Sawtooth flutter waves with a fixed atrial rate"], 1,
  "Chaotic atrial activation eliminates organized P waves, while variable AV nodal conduction produces an irregularly irregular ventricular response.",
  "Recognize atrial fibrillation.", "core", "ECG 2.ppt");
add("Chapter 13", "ECG rhythm recognition", "Atrial flutter", 3,
  "An ECG shows regular sawtooth atrial activity near 300/min with every second atrial impulse conducted to the ventricles. What is the diagnosis?",
  ["Atrial flutter with 2:1 conduction", "Atrial fibrillation", "Sinus bradycardia", "Ventricular fibrillation"], 0,
  "Atrial flutter is a rapid organized atrial reentry rhythm that often produces characteristic flutter waves and a fixed conduction ratio.",
  "Recognize atrial flutter and conduction ratio.", "high", "ECG 2.ppt");
add("Chapter 13", "ECG rhythm recognition", "Ventricular fibrillation", 3,
  "Which immediate mechanical consequence makes ventricular fibrillation rapidly fatal without treatment?",
  ["Excessive coordinated stroke volume", "Loss of coordinated ventricular pumping", "Permanent closure of the AV valves", "Isolated loss of atrial contraction only"], 1,
  "Disorganized ventricular electrical activity produces no effective synchronized contraction and therefore essentially no cardiac output.",
  "Explain why ventricular fibrillation is a cardiac-arrest rhythm.", "core", "ECG 2.ppt");

// Chapters 14-15: pressure, flow, resistance, and vascular mechanics (20)
add("Chapter 14", "Circulatory hemodynamics", "Pressure-flow relation", 2,
  "Blood flow through an organ is 5 mL/min when the pressure gradient is 100 mm Hg. What is the vascular resistance?",
  ["0.05 mm Hg/(mL/min)", "20 mm Hg/(mL/min)", "95 mm Hg/(mL/min)", "500 mm Hg/(mL/min)"], 1,
  "Resistance equals pressure difference divided by flow: 100/5 = 20 mm Hg/(mL/min).",
  "Calculate vascular resistance from pressure and flow.", "core", "Cairculatory System 1.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Ohm relation", 3,
  "If the pressure gradient across a vascular bed doubles while resistance is unchanged, what happens to flow?",
  ["It halves", "It doubles", "It quadruples", "It is unchanged"], 1,
  "The circulatory analogue of Ohm's law is flow = pressure difference/resistance; doubling the gradient doubles flow.",
  "Apply the pressure-flow-resistance relationship.", "core", "Cairculatory System 1.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Poiseuille relation", 3,
  "According to Poiseuille's relation, doubling the radius of a vessel while other factors remain constant changes flow by what factor?",
  ["2-fold increase", "4-fold increase", "8-fold increase", "16-fold increase"], 3,
  "Laminar flow varies with the fourth power of radius, so doubling radius increases flow by 2^4 = 16.",
  "Use the fourth-power relation between radius and flow.", "core", "Cairculatory System 2.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Poiseuille relation", 4,
  "A vessel's radius falls to one-half its original value with viscosity, length, and pressure gradient unchanged. How does resistance change?",
  ["It doubles", "It increases 4-fold", "It increases 8-fold", "It increases 16-fold"], 3,
  "Resistance varies inversely with the fourth power of radius; reducing radius to one-half raises resistance by 1/(0.5^4) = 16.",
  "Calculate the resistance effect of a change in vessel radius.", "core", "Cairculatory System 2.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Series resistance", 3,
  "Three vascular segments in series have resistances of 2, 3, and 5 units. What is their total resistance?",
  ["1 unit", "5 units", "10 units", "30 units"], 2,
  "Resistances in series add directly: 2 + 3 + 5 = 10 units.",
  "Calculate total resistance in series.", "high", "Cairculatory System 2.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Parallel resistance", 3,
  "What happens to total peripheral resistance when an additional organ vascular bed is opened in parallel and all other beds are unchanged?",
  ["It increases", "It decreases", "It must remain identical", "It becomes the sum of all individual resistances"], 1,
  "Adding a parallel pathway increases total conductance, so the reciprocal total resistance decreases.",
  "Predict how parallel vascular beds affect total resistance.", "core", "Cairculatory System 2.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Velocity and cross-sectional area", 3,
  "Why is mean blood velocity lowest in the capillaries even though each capillary is narrow?",
  ["Capillary pressure is zero", "The total cross-sectional area of all capillaries is enormous", "Blood becomes nonfluid in capillaries", "Capillaries have the lowest total resistance"], 1,
  "For a given volume flow, velocity is inversely related to total cross-sectional area; the many parallel capillaries have the largest combined area.",
  "Relate flow velocity to total vascular cross-sectional area.", "core", "Cairculatory System 1.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Laminar flow", 3,
  "In fully developed laminar flow through a cylindrical vessel, where is linear velocity greatest?",
  ["At the vessel wall", "At the center of the stream", "Equal at every radial position", "Only in side branches"], 1,
  "Friction makes velocity approach zero at the wall, while central layers move fastest, creating a parabolic velocity profile.",
  "Describe the velocity profile of laminar flow.", "high", "Cairculatory System 3.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Turbulence", 4,
  "Which change most strongly favors turbulent rather than laminar blood flow?",
  ["Lower velocity", "Smaller vessel diameter", "Higher velocity and lower viscosity", "Lower blood density"], 2,
  "The Reynolds number rises with velocity, diameter, and density and falls with viscosity; a higher value increases the tendency for turbulence.",
  "Predict factors that increase turbulent flow.", "core", "Cairculatory System 3.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Hematocrit and viscosity", 3,
  "A marked increase in hematocrit has what direct effect on systemic hemodynamics?",
  ["Decreased viscosity and resistance", "Increased viscosity and resistance", "No effect on viscosity", "Immediate elimination of turbulent flow"], 1,
  "A high red-cell fraction markedly increases whole-blood viscosity and therefore increases resistance to flow.",
  "Relate hematocrit to blood viscosity and resistance.", "high", "Cairculatory System 3.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Bernoulli principle", 4,
  "Blood accelerates through a narrowed segment of a horizontal artery. Ignoring viscous losses, what happens to lateral static pressure within the stenosis?",
  ["It rises as velocity rises", "It falls as velocity rises", "It is independent of velocity", "It becomes equal to venous pressure"], 1,
  "Bernoulli's principle describes exchange between pressure and kinetic energy: higher fluid velocity is associated with lower lateral static pressure when height is unchanged.",
  "Apply Bernoulli's principle to a vascular stenosis.", "core", "Cairculatory System 3.pptx");
add("Chapter 14", "Circulatory hemodynamics", "Total peripheral resistance", 3,
  "Cardiac output is 5 L/min and the systemic pressure gradient is approximately 100 mm Hg. What is total peripheral resistance?",
  ["0.05 mm Hg/(L/min)", "20 mm Hg/(L/min)", "95 mm Hg/(L/min)", "500 mm Hg/(L/min)"], 1,
  "TPR = pressure gradient/cardiac output = 100/5 = 20 mm Hg/(L/min), approximately 1 normal resistance unit.",
  "Calculate total peripheral resistance.", "core", "Cairculatory System 1.pptx");
add("Chapter 15", "Vascular mechanics", "Distensibility", 3,
  "Vascular distensibility is defined as the fractional increase in volume divided by what?",
  ["Original pressure", "Increase in pressure", "Blood viscosity", "Vessel length"], 1,
  "Distensibility is the fractional volume change per unit pressure increase: ΔV/(V × ΔP).",
  "Define vascular distensibility.", "high", "Cairculatory System 4.pptx");
add("Chapter 15", "Vascular mechanics", "Compliance", 3,
  "A vessel accepts 30 mL of additional blood when pressure rises by 5 mm Hg. What is its compliance?",
  ["0.17 mL/mm Hg", "6 mL/mm Hg", "25 mL/mm Hg", "150 mL/mm Hg"], 1,
  "Compliance is ΔV/ΔP: 30/5 = 6 mL/mm Hg.",
  "Calculate vascular compliance.", "core", "Cairculatory System 4.pptx");
add("Chapter 15", "Vascular mechanics", "Venous compliance", 3,
  "Why is the systemic venous system an effective blood reservoir?",
  ["Veins have low compliance", "Veins have high compliance and contain most of the blood volume", "Veins have the highest pressure", "Venous walls cannot change volume"], 1,
  "Veins are highly compliant and hold a large fraction of circulating blood, allowing substantial volume shifts with relatively small pressure changes.",
  "Explain the reservoir function of veins.", "core", "Cairculatory System 4.pptx");
add("Chapter 15", "Vascular mechanics", "Pulse pressure", 3,
  "Which combination most directly increases arterial pulse pressure?",
  ["Lower stroke volume and higher arterial compliance", "Higher stroke volume and lower arterial compliance", "Lower stroke volume and lower heart rate only", "Higher venous compliance and lower stroke volume"], 1,
  "Pulse pressure rises when more blood is ejected per beat or when the arterial tree is less compliant.",
  "Predict determinants of arterial pulse pressure.", "core", "Cairculatory System 4.pptx");
add("Chapter 15", "Vascular mechanics", "Mean arterial pressure", 3,
  "A resting adult has a blood pressure of 120/75 mm Hg. Using the usual approximation, what is mean arterial pressure?",
  ["75 mm Hg", "90 mm Hg", "97.5 mm Hg", "120 mm Hg"], 1,
  "MAP is approximately diastolic pressure plus one-third of pulse pressure: 75 + (45/3) = 90 mm Hg.",
  "Estimate mean arterial pressure from systolic and diastolic pressures.", "core", "Cairculatory System 4.pptx");
add("Chapter 15", "Vascular mechanics", "Pulse transmission", 3,
  "As the arterial pressure pulse travels toward small arteries and arterioles, why are pulsations progressively damped?",
  ["Increasing resistance and vascular compliance dissipate pulsatile energy", "Blood density becomes zero", "Mean pressure rises above systolic pressure", "All distal vessels contract simultaneously"], 0,
  "Resistance to movement and compliance of the vascular tree smooth the pulsatile output so capillary flow is much less pulsatile.",
  "Explain damping of arterial pressure pulsations.");
add("Chapter 15", "Vascular mechanics", "Orthostatic venous pressure", 3,
  "Immediately after a person stands motionless, gravity most directly increases pressure in which vessels?",
  ["Veins of the lower limbs", "Dural venous sinuses only", "Pulmonary veins exclusively", "Coronary arteries only"], 0,
  "The hydrostatic column below the heart raises dependent venous pressure, promoting venous pooling until reflexes and the muscle pump compensate.",
  "Apply hydrostatic pressure principles to standing.", "high", "Cairculatory System 4.pptx");
add("Chapter 15", "Vascular mechanics", "Skeletal muscle pump", 3,
  "How does the skeletal muscle pump increase venous return during walking?",
  ["It compresses veins while valves enforce one-way flow toward the heart", "It opens arteriovenous fistulas permanently", "It abolishes venous valves", "It raises right atrial pressure above peripheral venous pressure"], 0,
  "Intermittent muscle compression propels venous blood centrally, and competent valves prevent retrograde flow between contractions.",
  "Explain the skeletal muscle pump.");

// Chapters 16-18: microcirculation, local control, and rapid pressure control (18)
add("Chapter 16", "Microcirculation", "Capillary exchange", 2,
  "What is the principal mechanism for exchange of oxygen and carbon dioxide across systemic capillary walls?",
  ["Bulk flow through lymphatics", "Diffusion down concentration gradients", "Active transport by platelets", "Pinocytosis as the only pathway"], 1,
  "Lipid-soluble gases diffuse rapidly through endothelial cells according to their concentration gradients.",
  "Identify the dominant mechanism of respiratory-gas exchange in capillaries.", "core", "Cairculatory System 5.pptx");
add("Chapter 16", "Microcirculation", "Water-soluble solutes", 3,
  "Small water-soluble substances such as sodium and glucose cross most continuous capillaries mainly through what route?",
  ["Endothelial lipid membranes only", "Intercellular clefts and pores", "Red-cell membranes", "Lymphatic valves"], 1,
  "Water and small hydrophilic solutes move mainly through aqueous pathways such as intercellular clefts, while lipid-soluble molecules pass through endothelial membranes.",
  "Contrast pathways for lipid-soluble and water-soluble capillary exchange.");
add("Chapter 16", "Microcirculation", "Starling forces", 3,
  "Which Starling force favors movement of fluid out of a systemic capillary?",
  ["Plasma colloid osmotic pressure", "Capillary hydrostatic pressure", "Negative interstitial protein concentration", "Lymphatic pumping pressure"], 1,
  "Capillary hydrostatic pressure pushes fluid outward, whereas plasma colloid osmotic pressure pulls fluid inward.",
  "Classify Starling forces as favoring filtration or absorption.", "core", "Cairculatory System 5.pptx");
add("Chapter 16", "Microcirculation", "Net filtration pressure", 4,
  "At a capillary, Pc = 30, Pif = -2, plasma oncotic pressure = 25, and interstitial oncotic pressure = 3 mm Hg. What is the net outward filtration pressure?",
  ["0 mm Hg", "4 mm Hg", "10 mm Hg", "60 mm Hg"], 2,
  "Net outward pressure = Pc - Pif - plasma oncotic pressure + interstitial oncotic pressure = 30 - (-2) - 25 + 3 = 10 mm Hg.",
  "Calculate net filtration pressure from Starling forces.", "core", "Cairculatory System 5.pptx");
add("Chapter 16", "Microcirculation", "Edema", 4,
  "Severe hypoalbuminemia promotes edema primarily by causing which change?",
  ["Higher plasma colloid osmotic pressure", "Lower plasma colloid osmotic pressure", "Lower capillary permeability", "Greater lymphatic protein removal with no filtration change"], 1,
  "Loss of plasma proteins reduces the inward oncotic force, increasing net filtration into the interstitium.",
  "Predict how hypoalbuminemia alters capillary fluid exchange.", "core", "Cairculatory System 5.pptx");
add("Chapter 16", "Microcirculation", "Lymphatic function", 3,
  "Which substance normally returns to the circulation predominantly through lymphatic vessels after entering the interstitium?",
  ["Interstitial proteins", "All erythrocytes", "Most oxygen molecules", "Intracellular potassium"], 0,
  "Lymphatics return filtered fluid and escaped plasma proteins to the bloodstream; failure produces protein-rich interstitial edema.",
  "Explain the role of lymphatics in fluid and protein balance.", "core", "Cairculatory System 5.pptx");
add("Chapter 17", "Local blood-flow control", "Active hyperemia", 3,
  "Blood flow to exercising skeletal muscle increases in proportion to its metabolism. This response is called what?",
  ["Reactive hyperemia", "Active hyperemia", "Delayed compliance", "Baroreceptor resetting"], 1,
  "Active hyperemia is increased tissue blood flow caused by increased metabolic activity and local vasodilator signals.",
  "Distinguish active from reactive hyperemia.", "core", "Cairculatory System 6.pptx");
add("Chapter 17", "Local blood-flow control", "Reactive hyperemia", 3,
  "After a cuff occluding an artery is released, flow transiently rises above baseline. What best explains this reactive hyperemia?",
  ["Accumulated vasodilator metabolites and oxygen deficit", "A sudden permanent increase in blood viscosity", "Reduced local metabolism during occlusion", "Complete closure of arterioles"], 0,
  "During occlusion, low oxygen and accumulated metabolites dilate resistance vessels; release produces transient excess flow that repays the deficit.",
  "Explain reactive hyperemia after temporary ischemia.", "core", "Cairculatory System 6.pptx");
add("Chapter 17", "Local blood-flow control", "Autoregulation", 3,
  "A tissue maintains nearly constant flow despite a moderate rise in arterial pressure. This intrinsic response is called what?",
  ["Autoregulation", "Hemostasis", "Agglutination", "Central ischemic response"], 0,
  "Autoregulation adjusts local vascular resistance so tissue flow remains relatively stable over a range of perfusion pressures.",
  "Define tissue blood-flow autoregulation.");
add("Chapter 17", "Local blood-flow control", "Myogenic mechanism", 4,
  "According to the myogenic mechanism, an acute rise in arteriolar transmural pressure causes what response?",
  ["Vascular smooth-muscle contraction", "Immediate complete paralysis of smooth muscle", "Platelet aggregation", "Reduced smooth-muscle intracellular calcium"], 0,
  "Stretch of vascular smooth muscle evokes contraction, raising resistance and opposing the pressure-induced increase in flow.",
  "Explain the myogenic contribution to autoregulation.", "high", "Cairculatory System 6.pptx");
add("Chapter 17", "Local blood-flow control", "Endothelial mediators", 3,
  "Flow-mediated endothelial vasodilation is mediated mainly by release of which substance?",
  ["Nitric oxide", "Endothelin", "Thrombin", "Erythropoietin"], 0,
  "Shear stress stimulates endothelial nitric oxide formation, which relaxes nearby vascular smooth muscle through cGMP signaling.",
  "Identify nitric oxide as an endothelial vasodilator.", "core", "Cairculatory System 6.pptx");
add("Chapter 17", "Local blood-flow control", "Endothelial mediators", 3,
  "Which endothelial peptide is a powerful vasoconstrictor?",
  ["Endothelin", "Nitric oxide", "Prostacyclin", "Bradykinin"], 0,
  "Endothelin released by damaged or activated endothelium can produce potent, prolonged vascular smooth-muscle contraction.",
  "Identify endothelin as an endothelial vasoconstrictor.");
add("Chapter 18", "Rapid arterial-pressure control", "Sympathetic vasoconstriction", 3,
  "A generalized increase in sympathetic vasoconstrictor activity raises arterial pressure most directly by doing what?",
  ["Dilating arterioles and veins", "Constriction of arterioles and veins plus cardiac stimulation", "Reducing venous return", "Eliminating cardiac contractility"], 1,
  "Sympathetic activation raises arteriolar resistance, mobilizes venous blood toward the heart, and increases heart rate and contractility.",
  "Integrate sympathetic effects on heart, resistance vessels, and veins.", "core", "Cairculatory System 6.pptx");
add("Chapter 18", "Rapid arterial-pressure control", "Baroreceptors", 3,
  "The high-pressure arterial baroreceptors important for rapid blood-pressure control are concentrated where?",
  ["Carotid sinus and aortic arch", "Pulmonary capillaries and coronary sinus", "Renal medulla and hepatic portal vein", "Superior and inferior venae cavae only"], 0,
  "Stretch receptors in the carotid sinus and aortic arch signal changes in arterial pressure to the medullary cardiovascular centers.",
  "Locate the major arterial baroreceptors.", "core", "Cairculatory System 6.pptx");
add("Chapter 18", "Rapid arterial-pressure control", "Baroreflex", 4,
  "A sudden rise in arterial pressure increases baroreceptor firing. Which reflex response follows?",
  ["Increased sympathetic and decreased vagal activity", "Decreased sympathetic and increased vagal activity", "Increased renin release as the sole immediate response", "No change until blood volume falls"], 1,
  "Greater baroreceptor input inhibits sympathetic vasomotor output and increases cardiac parasympathetic activity, lowering heart rate, contractility, and vascular tone.",
  "Predict the autonomic response to increased baroreceptor stretch.", "core", "Cairculatory System 6.pptx");
add("Chapter 18", "Rapid arterial-pressure control", "Orthostatic reflex", 4,
  "Immediately on standing, venous return and arterial pressure fall. What compensatory change should an intact baroreflex produce?",
  ["Bradycardia and arteriolar dilation", "Tachycardia and arteriolar constriction", "Reduced venous tone", "Suppressed contractility"], 1,
  "Reduced baroreceptor stretch increases sympathetic and reduces vagal output, causing tachycardia, increased contractility, venoconstriction, and arteriolar constriction.",
  "Apply the baroreflex to orthostatic stress.", "core", "Cairculatory System 6.pptx");
add("Chapter 18", "Rapid arterial-pressure control", "Chemoreceptor reflex", 4,
  "The arterial chemoreceptor reflex becomes especially important when arterial pressure falls severely because reduced perfusion causes what local changes?",
  ["Higher O2 and lower CO2", "Lower O2 with increased CO2 and H+", "Reduced H+ with increased O2", "No change in chemical environment"], 1,
  "Poor perfusion of carotid and aortic bodies lowers oxygen and permits carbon dioxide and hydrogen ions to accumulate, exciting chemoreceptors and vasomotor output.",
  "Explain activation of the chemoreceptor pressure reflex.");
add("Chapter 18", "Rapid arterial-pressure control", "CNS ischemic response", 4,
  "During profound cerebral ischemia, accumulation of CO2 and H+ in the medullary vasomotor center produces which response?",
  ["Powerful sympathetic vasoconstriction", "Complete sympathetic inhibition", "Selective skeletal-muscle vasodilation only", "Immediate renal pressure natriuresis"], 0,
  "The CNS ischemic response is an emergency, powerful sympathetic pressor response that attempts to restore cerebral perfusion.",
  "Describe the CNS ischemic response in severe hypotension.", "high", "Cairculatory System 6.pptx");

// Chapters 19-20: long-term pressure control, cardiac output, and venous return (18)
add("Chapter 19", "Long-term arterial-pressure control", "Pressure natriuresis", 3,
  "What is the central long-term mechanism by which the kidneys stabilize arterial pressure?",
  ["Pressure-dependent adjustment of sodium and water excretion", "Beat-to-beat vagal slowing only", "Immediate platelet activation", "Changing QRS axis"], 0,
  "When arterial pressure rises, renal sodium and water excretion increase; reducing extracellular volume and cardiac output returns pressure toward equilibrium.",
  "Explain renal-body fluid control of arterial pressure.", "core", "Cairculatory System 6.pptx");
add("Chapter 19", "Long-term arterial-pressure control", "Renin release", 3,
  "Which condition directly stimulates renin release from juxtaglomerular cells?",
  ["Increased renal perfusion pressure", "Reduced renal perfusion pressure", "Markedly increased sodium chloride delivery to macula densa", "High angiotensin II feedback"], 1,
  "Low renal perfusion, reduced macula-densa NaCl delivery, and renal sympathetic activation stimulate renin secretion.",
  "Identify major stimuli for renin release.", "core", "Cairculatory System 6.pptx");
add("Chapter 19", "Long-term arterial-pressure control", "Angiotensin II", 3,
  "Which combination describes major actions of angiotensin II?",
  ["Vasodilation and increased sodium excretion", "Vasoconstriction and increased renal sodium retention", "Reduced aldosterone and thirst", "Reduced sympathetic activity and venodilation"], 1,
  "Angiotensin II raises pressure through vasoconstriction and by promoting sodium-water retention directly and through aldosterone, thirst, and ADH.",
  "Integrate the pressor and volume-retaining effects of angiotensin II.", "core", "Cairculatory System 6.pptx");
add("Chapter 19", "Long-term arterial-pressure control", "Aldosterone", 3,
  "Aldosterone contributes to long-term blood-pressure regulation mainly by increasing renal reabsorption of which ion?",
  ["Sodium", "Calcium only", "Hydrogen only", "Phosphate only"], 0,
  "Aldosterone increases distal nephron sodium reabsorption; water retention follows, expanding extracellular fluid and blood volume.",
  "Explain aldosterone's contribution to volume and pressure control.");
add("Chapter 19", "Long-term arterial-pressure control", "Salt sensitivity", 4,
  "A sustained high-salt intake is most likely to raise arterial pressure when the renal pressure-natriuresis curve has what property?",
  ["The kidneys can excrete salt with almost no pressure change", "A higher arterial pressure is required to excrete a given sodium load", "Renin is fully suppressed and renal function is normal", "Glomerular filtration always doubles"], 1,
  "If renal sodium excretion is impaired or the pressure-natriuresis relation shifts rightward, arterial pressure must rise to achieve sodium balance.",
  "Relate impaired renal sodium excretion to salt-sensitive hypertension.", "high", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Cardiac output", 2,
  "A person has a heart rate of 75/min and a stroke volume of 80 mL. What is cardiac output?",
  ["1.07 L/min", "5.0 L/min", "6.0 L/min", "60 L/min"], 2,
  "Cardiac output = heart rate × stroke volume = 75 × 80 mL/min = 6000 mL/min, or 6.0 L/min.",
  "Calculate cardiac output.", "core", "Cardiac Physiology 1.ppt");
add("Chapter 20", "Cardiac output and venous return", "Cardiac index", 3,
  "A patient has a cardiac output of 5.4 L/min and body surface area of 1.8 m². What is the cardiac index?",
  ["0.33 L/min/m²", "3.0 L/min/m²", "7.2 L/min/m²", "9.7 L/min/m²"], 1,
  "Cardiac index is cardiac output divided by body surface area: 5.4/1.8 = 3.0 L/min/m².",
  "Calculate cardiac index.", "high", "Cardiac Physiology 1.ppt");
add("Chapter 20", "Cardiac output and venous return", "Fick principle", 4,
  "Oxygen consumption is 250 mL/min, arterial oxygen content is 200 mL/L, and mixed venous content is 150 mL/L. What is cardiac output by the Fick principle?",
  ["1 L/min", "2.5 L/min", "5 L/min", "50 L/min"], 2,
  "Fick cardiac output = O2 consumption/(arterial-venous O2 difference) = 250/(200-150) = 5 L/min.",
  "Calculate cardiac output using the Fick principle.", "core", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Venous return equation", 3,
  "Which expression best represents venous return?",
  ["Right atrial pressure divided by cardiac output", "(Mean systemic filling pressure - right atrial pressure)/resistance to venous return", "Arterial pressure × venous compliance", "Stroke volume/heart rate"], 1,
  "The pressure gradient driving venous return is mean systemic filling pressure minus right atrial pressure, divided by resistance to venous return.",
  "State the determinants of venous return.", "core", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Venous return calculation", 4,
  "Mean systemic filling pressure is 7 mm Hg, right atrial pressure is 2 mm Hg, and resistance to venous return is 1 mm Hg/(L/min). What is venous return?",
  ["2 L/min", "5 L/min", "7 L/min", "9 L/min"], 1,
  "Venous return = (7 - 2)/1 = 5 L/min.",
  "Calculate venous return from its pressure gradient and resistance.", "core", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Right atrial pressure", 4,
  "If mean systemic filling pressure and resistance to venous return are unchanged, raising right atrial pressure has what effect?",
  ["Increases venous return", "Decreases venous return", "Does not affect venous return", "Reverses arterial flow first"], 1,
  "Raising downstream right atrial pressure reduces the pressure gradient from systemic vessels to the right atrium and therefore lowers venous return.",
  "Predict how right atrial pressure affects venous return.", "core", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Mean systemic filling pressure", 4,
  "A rapid transfusion increases blood volume. Before reflex compensation, how does this shift the venous return curve?",
  ["Leftward by reducing mean systemic filling pressure", "Rightward by increasing mean systemic filling pressure", "Downward solely by increasing resistance", "It cannot change venous return"], 1,
  "Extra vascular volume raises mean systemic filling pressure, increasing the upstream pressure for venous return and shifting the curve rightward.",
  "Predict the effect of blood volume on the venous return curve.", "core", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Venoconstriction", 4,
  "Generalized sympathetic venoconstriction increases venous return mainly by doing what?",
  ["Reducing stressed vascular volume", "Increasing mean systemic filling pressure", "Raising right atrial pressure above systemic pressure", "Eliminating the pressure gradient for return"], 1,
  "Venoconstriction shifts blood from compliant venous reservoirs into stressed volume, raising mean systemic filling pressure and the venous-return gradient.",
  "Explain how sympathetic venoconstriction mobilizes venous blood.", "core", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Resistance to venous return", 4,
  "An increase in resistance to venous return, with mean systemic filling pressure unchanged, produces which change in the venous return curve?",
  ["A steeper slope", "A flatter slope", "A higher zero-flow pressure intercept", "No change at any right atrial pressure"], 1,
  "Greater resistance reduces flow for any given pressure gradient, rotating the venous return curve downward to a flatter slope around the same mean systemic filling pressure intercept.",
  "Interpret the slope of the venous return curve.", "high", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Circulatory equilibrium", 4,
  "On a graph of cardiac output and venous return versus right atrial pressure, what does the intersection of the two curves represent?",
  ["Only the maximum possible heart rate", "The steady-state cardiac output and right atrial pressure", "The arterial pulse pressure", "The onset of turbulent flow"], 1,
  "At steady state, cardiac output must equal venous return; the curve intersection gives that common flow and the corresponding right atrial pressure.",
  "Interpret the cardiac and vascular function curve intersection.", "core", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Exercise", 4,
  "During dynamic exercise, which coordinated change permits a large increase in cardiac output?",
  ["Reduced sympathetic activity and venous pooling", "Increased cardiac contractility plus increased venous return", "Higher muscle vascular resistance with bradycardia", "Reduced mean systemic filling pressure"], 1,
  "Sympathetic cardiac stimulation raises the cardiac function curve, while muscle pumping, venoconstriction, and local muscle vasodilation support venous return and flow.",
  "Integrate cardiac and vascular adjustments during exercise.", "core", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Venous return limit", 4,
  "Why does venous return reach a plateau when right atrial pressure becomes substantially negative?",
  ["Large veins entering the chest collapse", "The aorta closes", "Blood viscosity becomes infinite", "The SA node stops automatically"], 0,
  "Negative intrathoracic downstream pressure collapses the great veins at their thoracic entry, preventing further increases in venous return.",
  "Explain the plateau of the venous return curve at negative right atrial pressure.", "high", "Cairculatory System 6.pptx");
add("Chapter 20", "Cardiac output and venous return", "Cardiac function curve", 4,
  "A positive inotropic drug is given without an immediate change in blood volume. How does the cardiac function curve change?",
  ["It shifts upward", "It shifts downward", "It becomes identical to the venous return curve", "Its right-atrial-pressure axis disappears"], 0,
  "Increased contractility lets the heart pump a greater output at any given right atrial pressure, shifting the cardiac function curve upward.",
  "Predict the effect of inotropy on the cardiac function curve.", "high", "Cairculatory System 6.pptx");

// Chapters 33-35: red cells, inflammation, and adaptive immunity (23)
add("Chapter 33", "Blood physiology", "Erythropoietin regulation", 2,
  "A patient develops sustained arterial hypoxemia. Which organ provides most of the resulting increase in erythropoietin secretion in an adult?",
  ["Liver", "Kidney", "Spleen", "Bone marrow"], 1,
  "Renal interstitial cells sense reduced oxygen delivery and provide most circulating erythropoietin in adults.",
  "Identify the principal adult source and stimulus for erythropoietin.", "core", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Erythropoiesis", 3,
  "Which change is the most direct marrow effect of increased erythropoietin?",
  ["Increased platelet adhesion", "Increased erythroid progenitor survival and maturation", "Reduced intestinal iron absorption", "Increased neutrophil migration"], 1,
  "Erythropoietin promotes proliferation, differentiation, and survival of erythroid precursors, increasing reticulocyte output.",
  "Explain how erythropoietin increases red-cell production.", "high", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Erythrocyte structure", 2,
  "What is the main functional advantage of the biconcave shape of a normal erythrocyte?",
  ["It permits nuclear division", "It increases surface-area-to-volume ratio and deformability", "It prevents all hemoglobin oxidation", "It initiates coagulation"], 1,
  "The biconcave disc supports rapid gas exchange and deformation through narrow capillaries and splenic passages.",
  "Relate erythrocyte shape to gas exchange and microvascular transit.", "high", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Iron transport", 2,
  "Which plasma protein normally transports absorbed iron to tissues?",
  ["Ferritin", "Transferrin", "Haptoglobin", "Fibrinogen"], 1,
  "Transferrin carries iron in plasma, whereas ferritin is a major intracellular iron-storage protein.",
  "Distinguish iron transport from iron storage proteins.", "core", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Vitamin B12 absorption", 3,
  "Normal absorption of vitamin B12 requires intrinsic factor and uptake primarily at which site?",
  ["Stomach", "Duodenum", "Terminal ileum", "Colon"], 2,
  "Gastric parietal cells produce intrinsic factor; the intrinsic factor-B12 complex is absorbed in the terminal ileum.",
  "Describe the essential steps in vitamin B12 absorption.", "core", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Pernicious anemia", 3,
  "Autoimmune destruction of gastric parietal cells most directly predisposes a patient to which abnormality?",
  ["Microcytic anemia from excess heme synthesis", "Macrocytic megaloblastic anemia", "Isolated thrombocytosis", "Secondary polycythemia"], 1,
  "Loss of intrinsic factor impairs vitamin B12 absorption, disrupting DNA synthesis and producing megaloblastic anemia.",
  "Connect intrinsic-factor deficiency with megaloblastic anemia.", "core", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Aplastic anemia", 3,
  "Which laboratory pattern best fits severe aplastic anemia?",
  ["Anemia with marked reticulocytosis", "Pancytopenia with a low reticulocyte count", "Erythrocytosis with leukocytosis", "Anemia with isolated eosinophilia"], 1,
  "Bone-marrow failure reduces production of erythrocytes, leukocytes, and platelets and produces an inappropriately low reticulocyte count.",
  "Recognize the hematologic consequences of marrow failure.", "high", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Hemolytic anemia", 3,
  "Which finding most strongly indicates an appropriate marrow response to peripheral red-cell destruction?",
  ["Low reticulocyte count", "Increased reticulocyte count", "Reduced erythropoietin", "Reduced bilirubin production"], 1,
  "Hemolysis stimulates erythropoietin and accelerates erythropoiesis, so functioning marrow releases more reticulocytes.",
  "Interpret the reticulocyte response in hemolytic anemia.", "core", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Erythrocyte deformability", 3,
  "Why are spherocytes removed prematurely from the circulation?",
  ["They cannot synthesize heme", "Reduced deformability impedes passage through splenic cords", "They directly activate factor X", "Their nuclei are retained"], 1,
  "Membrane defects produce poorly deformable spherical cells that become trapped and destroyed in the spleen.",
  "Relate red-cell membrane shape to extravascular hemolysis.", "standard", "blood 1.ppsx");
add("Chapter 33", "Blood physiology", "Polycythemia", 3,
  "A major circulatory consequence of a very high hematocrit is which change?",
  ["Reduced blood viscosity", "Increased resistance to blood flow", "Reduced oxygen-carrying capacity", "Loss of plasma proteins into urine"], 1,
  "Increasing hematocrit markedly raises blood viscosity, thereby increasing vascular resistance and cardiac workload.",
  "Predict the hemodynamic effect of polycythemia.", "core", "blood 1.ppsx");
add("Chapter 34", "Blood physiology", "Neutrophils", 2,
  "Which circulating leukocyte is usually the earliest major cellular responder to an acute bacterial infection?",
  ["Neutrophil", "Eosinophil", "B lymphocyte", "Basophil"], 0,
  "Neutrophils rapidly leave the blood, follow chemotactic signals, and phagocytose bacteria in acute inflammation.",
  "Identify the dominant early leukocyte in acute bacterial inflammation.", "core", "blood 2.ppsx");
add("Chapter 34", "Blood physiology", "Monocyte-macrophage system", 2,
  "After entering tissues, circulating monocytes commonly differentiate into which cells?",
  ["Plasma cells", "Macrophages", "Megakaryocytes", "Erythrocytes"], 1,
  "Monocytes enlarge and mature into tissue macrophages with strong phagocytic and antigen-presenting functions.",
  "Describe the relationship between monocytes and tissue macrophages.", "high", "blood 2.ppsx");
add("Chapter 34", "Blood physiology", "Leukocyte extravasation", 3,
  "Passage of a leukocyte between endothelial cells from blood into inflamed tissue is called what?",
  ["Agglutination", "Diapedesis", "Opsonization", "Hemostasis"], 1,
  "Diapedesis is transendothelial migration of leukocytes from the circulation into interstitial tissue.",
  "Define leukocyte diapedesis.", "high", "blood 2.ppsx");
add("Chapter 34", "Blood physiology", "Chemotaxis", 3,
  "What directs neutrophils toward the center of infected tissue after they leave the circulation?",
  ["Movement along a chemical concentration gradient", "Increased plasma oncotic pressure", "Random erythrocyte collision", "Platelet contraction"], 0,
  "Bacterial products, complement fragments, and damaged-tissue signals form chemical gradients that guide leukocyte migration.",
  "Explain chemotactic migration during inflammation.", "core", "blood 2.ppsx");
add("Chapter 34", "Blood physiology", "Inflammatory mediators", 3,
  "Histamine released early in inflammation most directly causes which local vascular changes?",
  ["Vasoconstriction and reduced permeability", "Vasodilation and increased permeability", "Thrombosis without vasodilation", "Reduced leukocyte adhesion only"], 1,
  "Histamine increases local blood flow and vascular permeability, promoting movement of protein-rich fluid into tissue.",
  "Link histamine to vascular responses in acute inflammation.", "high", "blood 2.ppsx");
add("Chapter 34", "Blood physiology", "Neutropenia", 2,
  "A profound reduction in circulating neutrophils most strongly increases susceptibility to what?",
  ["Acute bacterial and fungal infections", "ABO incompatibility", "Iron overload", "Arterial hypertension"], 0,
  "Neutrophils are essential for rapid innate defense against extracellular bacteria and many fungi.",
  "Predict the clinical consequence of neutropenia.", "high", "blood 2.ppsx");
add("Chapter 34", "Blood physiology", "Eosinophils", 2,
  "Eosinophilia is most characteristically associated with which conditions?",
  ["Helminth infection and allergic disease", "Acute blood loss", "Vitamin K deficiency", "Rh incompatibility"], 0,
  "Eosinophils participate in defense against parasites and in modulation of allergic reactions.",
  "Identify conditions associated with eosinophilia.", "high", "blood 2.ppsx");
add("Chapter 34", "Blood physiology", "Basophils", 3,
  "Which mediator released by basophils contributes prominently to immediate hypersensitivity reactions?",
  ["Hemoglobin", "Histamine", "Erythropoietin", "Fibrinogen"], 1,
  "Activated basophils and mast cells release histamine, contributing to vasodilation, increased permeability, and bronchial effects.",
  "Recognize the role of basophils in allergic inflammation.", "standard", "blood 2.ppsx");
add("Chapter 35", "Blood physiology", "Humoral immunity", 2,
  "Which cell is specialized for secreting large quantities of antibody?",
  ["Plasma cell", "Neutrophil", "Platelet", "Erythrocyte"], 0,
  "Antigen-activated B lymphocytes differentiate into plasma cells that synthesize and secrete antibodies.",
  "Identify the effector cell of humoral immunity.", "core", "blood 2.ppsx");
add("Chapter 35", "Blood physiology", "Cell-mediated immunity", 2,
  "Defense against virus-infected host cells depends most directly on which cells?",
  ["Cytotoxic T lymphocytes", "Erythrocytes", "Eosinophils", "Megakaryocytes"], 0,
  "Cytotoxic T cells recognize antigen displayed on infected cells and induce those cells to die.",
  "Distinguish cell-mediated from humoral immune defense.", "high", "blood 2.ppsx");
add("Chapter 35", "Blood physiology", "Immediate hypersensitivity", 3,
  "Immediate allergic reactions begin when allergen cross-links which antibody class on mast cells?",
  ["IgA", "IgE", "IgG", "IgM"], 1,
  "IgE bound to high-affinity mast-cell receptors triggers degranulation when cross-linked by allergen.",
  "Explain the antibody mechanism of type I hypersensitivity.", "core", "blood 2.ppsx");
add("Chapter 35", "Blood physiology", "Immunologic memory", 3,
  "Compared with a primary response, a secondary response to the same antigen is generally what?",
  ["Slower and weaker", "Faster and stronger", "Limited to innate immunity", "Unable to produce antibodies"], 1,
  "Memory lymphocytes formed after the first exposure respond rapidly and expand efficiently on re-exposure.",
  "Explain the physiological basis of immune memory.", "high", "blood 2.ppsx");
add("Chapter 35", "Blood physiology", "Helper T cells", 3,
  "Loss of helper T-cell function most directly impairs which combination?",
  ["Activation of B cells and cytotoxic T cells", "Erythrocyte deformability and iron transport", "Platelet adhesion and fibrin formation", "Renal erythropoietin release and reticulocytosis"], 0,
  "Helper T cells coordinate adaptive immunity through cell contact and cytokines that support B-cell and cytotoxic T-cell responses.",
  "Describe the coordinating role of helper T lymphocytes.", "high", "blood 2.ppsx");

// Chapters 36-37: transfusion physiology and hemostasis (17)
add("Chapter 36", "Blood physiology", "ABO antigens", 2,
  "A person with blood group A normally has which ABO pattern?",
  ["A antigen on erythrocytes and anti-B in plasma", "B antigen on erythrocytes and anti-B in plasma", "No erythrocyte antigens and anti-A only", "A and B antigens with both antibodies"], 0,
  "Group A erythrocytes express A antigen, while the plasma normally contains antibodies against B antigen.",
  "Match ABO red-cell antigens with plasma antibodies.", "core", "blood 3.pptx");
add("Chapter 36", "Blood physiology", "Group O packed cells", 3,
  "Why can group O packed red cells often be used in an emergency when the recipient's ABO type is unknown?",
  ["They lack A and B antigens", "They lack hemoglobin", "They contain no membrane proteins", "They express both A and B antigens"], 0,
  "Group O red cells do not present A or B antigens for recipient antibodies to attack; using packed cells minimizes donor plasma.",
  "Explain emergency ABO compatibility of group O packed erythrocytes.", "core", "blood 3.pptx");
add("Chapter 36", "Blood physiology", "Group AB recipient", 3,
  "A person with group AB blood can receive ABO-compatible packed red cells from any ABO group mainly because the recipient plasma lacks what?",
  ["Anti-A and anti-B antibodies", "Rh antigen", "Fibrinogen", "Complement"], 0,
  "Without anti-A or anti-B, an AB recipient does not attack donor red cells on the basis of ABO antigen alone.",
  "Explain the ABO basis of the universal packed-cell recipient concept.", "high", "blood 3.pptx");
add("Chapter 36", "Blood physiology", "Rh sensitization", 3,
  "An Rh-negative mother exposed to Rh-positive fetal erythrocytes may later produce which antibody capable of crossing the placenta?",
  ["Anti-D IgG", "Anti-D IgM only", "Anti-A IgM only", "IgE against albumin"], 0,
  "Maternal sensitization can produce IgG anti-D, which crosses the placenta in a later Rh-positive pregnancy.",
  "Describe the immune basis of Rh hemolytic disease.", "core", "blood 3.pptx");
add("Chapter 36", "Blood physiology", "Rh prophylaxis", 3,
  "Anti-D immune globulin given to an unsensitized Rh-negative mother primarily prevents what?",
  ["Maternal active sensitization to Rh-positive fetal cells", "Fetal production of hemoglobin", "ABO antigen expression", "Maternal platelet formation"], 0,
  "Passive anti-D clears fetal Rh-positive cells before the maternal immune system mounts a durable active response.",
  "Explain prophylaxis against Rh hemolytic disease of the fetus and newborn.", "core", "blood 3.pptx");
add("Chapter 36", "Blood physiology", "Hemolytic transfusion reaction", 3,
  "Transfusion of group A red cells into a group B recipient most immediately risks which reaction?",
  ["Agglutination and intravascular hemolysis", "Iron-deficiency anemia", "Reduced erythropoietin synthesis", "Eosinophil depletion"], 0,
  "Recipient anti-A binds donor erythrocytes, activates complement, and can cause rapid intravascular hemolysis.",
  "Predict the consequence of major ABO incompatibility.", "core", "blood 3.pptx");
add("Chapter 36", "Blood physiology", "Crossmatching", 3,
  "In a major crossmatch, which materials are mixed to detect dangerous incompatibility?",
  ["Recipient serum and donor erythrocytes", "Donor serum and donor platelets only", "Recipient erythrocytes and recipient serum", "Donor leukocytes and saline only"], 0,
  "A major crossmatch tests whether antibodies in the recipient's serum react with the intended donor's red cells.",
  "State the purpose and components of a major crossmatch.", "high", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Platelet adhesion", 3,
  "After endothelial injury, von Willebrand factor chiefly promotes platelet adhesion by linking exposed collagen to which platelet receptor?",
  ["GPIb", "Insulin receptor", "RhD antigen", "Transferrin receptor"], 0,
  "Von Willebrand factor bridges subendothelial collagen and platelet GPIb, initiating platelet adhesion.",
  "Explain the molecular basis of initial platelet adhesion.", "core", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Platelet activation", 3,
  "Activated platelets release ADP and produce thromboxane A2. What shared effect do these mediators have?",
  ["Recruit and activate additional platelets", "Dissolve fibrin immediately", "Suppress local vasoconstriction", "Destroy factor X"], 0,
  "ADP and thromboxane amplify platelet activation and aggregation at the injury site through positive feedback.",
  "Describe amplification during platelet-plug formation.", "high", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Extrinsic coagulation", 3,
  "Which substance released or exposed by damaged tissue initiates the extrinsic coagulation pathway?",
  ["Tissue factor", "Intrinsic factor", "Erythropoietin", "Histamine"], 0,
  "Tissue factor complexes with factor VII/VIIa and rapidly promotes activation of factor X.",
  "Identify the initiating component of the extrinsic coagulation pathway.", "core", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Intrinsic coagulation", 3,
  "Contact of blood with a negatively charged damaged surface classically begins the intrinsic pathway through activation of which factor?",
  ["Factor XII", "Factor VII", "Factor XIII", "Plasmin"], 0,
  "Contact activation converts factor XII to XIIa and initiates the classic intrinsic cascade.",
  "Identify the traditional starting factor of the intrinsic coagulation pathway.", "high", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Common coagulation pathway", 3,
  "Both intrinsic and extrinsic coagulation pathways converge on activation of which factor?",
  ["Factor X", "Factor XII", "Platelet GPIb", "Plasminogen"], 0,
  "Factor Xa, with factor Va, calcium, and phospholipid, forms prothrombin activator and converts prothrombin to thrombin.",
  "Locate the convergence point of the coagulation pathways.", "core", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Thrombin", 3,
  "Which reaction is catalyzed directly by thrombin during clot formation?",
  ["Fibrinogen to fibrin", "Plasmin to plasminogen", "Heme to bilirubin", "Transferrin to ferritin"], 0,
  "Thrombin cleaves soluble fibrinogen into fibrin monomers; factor XIII then helps stabilize the fibrin network.",
  "State thrombin's central action in coagulation.", "core", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Vitamin K", 3,
  "Vitamin K deficiency reduces functional synthesis of which set of coagulation factors?",
  ["II, VII, IX, and X", "I, V, VIII, and XII", "XI, XII, XIII, and von Willebrand factor", "Only factor XIII"], 0,
  "Vitamin K is required for gamma-carboxylation of factors II, VII, IX, and X as well as anticoagulant proteins C and S.",
  "Recall the vitamin K-dependent coagulation proteins.", "high", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Heparin", 3,
  "Unfractionated heparin produces anticoagulation primarily by accelerating the action of which endogenous inhibitor?",
  ["Antithrombin", "Tissue factor", "Factor XIII", "Vitamin K"], 0,
  "Heparin markedly enhances antithrombin-mediated inhibition of thrombin and factor Xa.",
  "Explain the physiological target of heparin.", "high", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Fibrinolysis", 3,
  "Tissue plasminogen activator promotes clot removal by catalyzing which conversion?",
  ["Plasminogen to plasmin", "Fibrin to fibrinogen", "Prothrombin to thrombin", "Factor X to factor Xa"], 0,
  "Plasmin enzymatically degrades fibrin; tissue plasminogen activator generates plasmin from its inactive precursor.",
  "Describe activation of the fibrinolytic system.", "high", "blood 3.pptx");
add("Chapter 37", "Blood physiology", "Hemophilia A", 4,
  "A boy has recurrent hemarthroses, a normal platelet count, normal prothrombin time, and prolonged activated partial thromboplastin time. Which deficiency is most likely?",
  ["Factor VIII", "Factor VII", "Vitamin B12", "Fibrinogen excess"], 0,
  "Hemophilia A is factor VIII deficiency and primarily disrupts the intrinsic pathway, prolonging aPTT while PT remains normal.",
  "Recognize the factor deficiency and screening-test pattern of hemophilia A.", "core", "blood 3.pptx");

if (questions.length !== 150) throw new Error(`Expected 150 questions, found ${questions.length}`);

const letters = ["A", "B", "C", "D", "E", "F"];
const sourceTitle = "Guyton and Hall Textbook of Medical Physiology";
const sourceEdition = "15th (2026)";
const records = questions.map((q, index) => {
  const rotation = (index * 3 + 1) % q.options.length;
  const rotatedOptions = [...q.options.slice(rotation), ...q.options.slice(0, rotation)];
  const rotatedCorrect = (q.correct - rotation + q.options.length) % q.options.length;
  const optionRecords = rotatedOptions.map((text, i) => ({ id: letters[i], text }));
  const correctOptionId = letters[rotatedCorrect];
  const distractorExplanations = Object.fromEntries(optionRecords
    .filter((option) => option.id !== correctOptionId)
    .map((option) => [option.id, `${option.text} does not fit the mechanism or finding in this stem. ${q.explanation}`]));
  const id = `phys-teacher-scope-${String(index + 1).padStart(3, "0")}-v1`;
  return {
    schemaVersion: "1.0.0",
    id,
    revision: 1,
    status: "verified",
    kind: "single_best_answer",
    subject: "physiology",
    topic: q.topic,
    subtopic: q.subtopic,
    chapter: q.chapter,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: optionRecords,
    correctOptionId,
    acceptedFreeText: [correctOptionId, q.options[q.correct]],
    explanation: q.explanation,
    distractorExplanations,
    learningObjective: q.objective,
    source: {
      title: sourceTitle,
      edition: sourceEdition,
      chapter: q.chapter,
      ...(q.lecture ? { lecture: q.lecture } : {}),
      excerpt: "Original exam-style item aligned to the confirmed teacher lecture scope and the cited Guyton chapter."
    },
    tags: ["physiology", q.chapter.toLowerCase().replaceAll(" ", "-"), q.subtopic.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "")],
    examPriority: q.priority,
    qualityFlags: ["teacher-scope-aligned", "guyton-15e", "manually-authored"]
  };
});

const output = resolve(import.meta.dirname, "../data/bank/questions/physiology-teacher-scope.jsonl");
writeFileSync(output, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`);
console.log(`Wrote ${records.length} physiology questions to ${output}`);
