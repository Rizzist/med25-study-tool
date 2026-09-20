// Explicit source-concept -> review-heading navigation crosswalk.
// A trailing "broad" means the review is a broader/partial landing section;
// these links remain uncertain and must be shown as suggested in the product.
// No answer keys or structure locations are inferred here.
export const groups = {
  cvs: `
vertebrae|a:thoracic-vertebrae c:architecture c:regional-mechanics
thoracic-map|a:thoracic-apertures
rib-landmarks|a:ribs a:costal-joints a:thoracic-variants v:cvs-2d-typical-rib
sternum|a:sternum v:cvs-2d-gray-sternum
spinal-joints|a:vertebral-joints-discs c:discs-ligaments c:root-compression
intercostal|a:thoracic-movements a:intercostal-muscles a:accessory-wall-muscles v:cvs-2d-gray-intercostal-space v:gap-2d-intercostal-nerve-muscles
pectoral-muscles|a:pectoral-serratus v:cvs-2d-pectoral-muscles
diaphragm|a:diaphragm c:diaphragm-integration
breast|a:breast
wall-neurovascular|a:internal-thoracic a:posterior-intercostal a:intercostal-nerves c:thoracic-nerves v:cvs-2d-thoracic-sympathetic
wall-neurovascular|c:thoracic-joints|broad
esophagus-duct|a:azygos-wall a:azygos-mediastinum a:esophagus-duct v:cvs-2d-vagal-plexus v:cvs-2d-gray-azygos-system
pericardium|a:pericardial-layers a:pericardial-sinuses a:pericardial-innervation d:pericardial v:cvs-2d-pericardial-layers v:cvs-2d-pericardial-sinuses
heart-external|a:heart-position-surfaces v:cvs-2d-heart-anterior v:cvs-2d-heart-posterior
heart-external|a:surface-imaging|broad
right-heart|a:right-atrium a:right-ventricle v:cvs-2d-right-atrium-interior v:cvs-2d-right-ventricle-interior
left-heart|a:left-atrium a:left-ventricle v:cvs-2d-left-ventricle-interior
left-heart|a:fibrous-skeleton-valves c:cardiac-relations v:cvs-2d-gray-valvular-base|broad
conduction-phys|a:conduction p:pacemaker-autonomic p:functional-conduction
coronary|a:coronary-arteries a:cardiac-veins c:coronary-integration v:cvs-2d-gray-cardiac-veins
cardiac-nerves|a:cardiac-innervation
mediastinum|a:mediastinal-divisions a:brachiocephalic-svc a:aorta-branches a:thoracic-nerves d:mediastinal c:mediastinal-routes v:cvs-2d-vagus-aortic-relations v:cvs-2d-great-vessels-nerves v:cvs-2d-gray-mediastinal-divisions
flow-laws|p:circulatory-organization p:blood-rheology p:pressure-flow-resistance d:flow
arterial-pressure|p:laplace-compliance p:arterial-pressure
velocity-turbulence|p:velocity-turbulence
measurement-special-circulations|p:flow-measurement p:special-circulations
venous-return|p:venous-function
venous-return|d:integration|broad
microexchange|p:capillary-exchange p:starling-lymph-edema
local-regulation|p:local-humoral
neural-pressure|p:neural-reflexes
coronary-exercise|p:exercise p:coronary-circulation
shock-failure|p:hemorrhage-shock
cardiac-ap|p:cardiac-muscle-coupling p:fast-slow-action-potentials
cycle|p:cardiac-cycle
pv-loop|p:pressure-volume-pump
pv-loop|d:pump|broad
ecg-foundations|p:ecg-recording p:ecg-leads p:ecg-rate
ecg-patterns|p:ecg-waves-rhythm p:ecg-territories
ecg-axis|p:ecg-axis
rbc|p:rbc-structure
erythropoiesis|p:erythropoiesis p:rbc-maturation p:hemoglobin-iron p:rbc-turnover
platelets|p:platelet-hemostasis
coagulation|p:coagulation-cascade p:coagulation-cofactors p:fibrinolysis
coagulation|d:clot|broad
wbc|p:leukocyte-types p:phagocyte-recruitment p:inflammation p:eosinophils-basophils p:leukopenia-leukemia
vessel-histo|h:vascular-tunics h:elastic-muscular-arteries h:arterioles h:venules-veins h:atherosclerosis-diapedesis d:endothelium d:arteries
capillary-histo|h:capillaries-pericytes h:lymphatic-vessels d:microvasculature d:veins-lymphatics
heart-histo|h:heart-wall d:endocardium d:cardiac-muscle
immune-foundations|h:antibody-mhc c:follicular-processing
spleen-malt|h:lymphoid-malt h:spleen h:organ-comparison c:splenic-compartments
spleen-malt|d:secondary-lymphoid|broad
thymus|h:thymus h:t-selection d:thymus
lymph-node|h:lymph-node
heart-fields|e:heart-fields-tube e:looping-segments d:emb-looping-segments
atrial-septation|e:sinus-atrium e:atrial-septation d:emb-atrial-incorporation
ventricular-outflow|e:av-cushions-valves e:ventricular-septation e:outflow-ncc d:emb-valves-outflow
ventricular-outflow|d:emb-cushions-septa d:emb-congenital-mechanisms|broad
advanced-heart-development|d:emb-induction-fields d:emb-conduction-system
arch-arteries|e:aortic-arches e:arterial-remodeling d:emb-arterial-remodeling
venous-development|e:venous-systems d:emb-venous-remodeling
fetal-circulation|e:fetal-circulation d:emb-fetal-transition
lymph-embryo|e:lymphatics c:lymphatic-development
right-heart|d:intracardiac|broad
wall-neurovascular|d:wall|broad
craniovertebral-suboccipital|c:craniovertebral c:suboccipital
spinal-cord|c:roots-rami c:nomenclature c:cord-levels c:meninges c:lumbar-access
cord-vascular|c:spinal-vascular
back-muscles|c:intrinsic-muscles c:extrinsic-muscles c:fascia-posture
spinal-joints|c:clinical-localization|broad
advanced-excitation|c:excitation-1 c:excitation-2 c:ecg-vectors-1 c:ecg-vectors-2
longterm-pressure|c:pressure-control-1 c:pressure-control-2|broad
advanced-return-pressure|c:return-curves-1 c:return-curves-2
advanced-failure-shock|c:failure-valves-1 c:failure-valves-2 c:shock-1 c:shock-2
`,
  limbs: `
limbs-03-orientation|u:functional-overview u:osteology-language
limbs-20-upper-localization|u:surface-integration
limbs-42-lower-clinical|l:surface-integration
limbs-04-clavicle-scapula|u:clavicle u:scapula
limbs-05-humerus|u:humerus v:gap-2d-humerus-proximal v:gap-2d-humerus-attachments
limbs-06-distal-humerus|u:elbow-joint u:carrying-angle v:gap-2d-humerus-distal
limbs-07-radius-ulna|u:forearm-bones-joints
limbs-07-radius-ulna|c:forearm-mechanics|broad
limbs-10-shoulder|u:shoulder-joints u:glenohumeral c:shoulder-stability
limbs-11-shoulder-muscle-table|u:rotator-cuff u:deltoid-axillary v:limbs-2d-shoulder-muscles
limbs-09-axilla|u:posterior-spaces u:scapular-anastomosis u:axilla-boundaries u:axilla-fascia u:axillary-artery u:axillary-vein u:axillary-lymph
limbs-21-lower-overview|l:overview
limbs-22-hip-bone|v:gap-2d-hip-bone v:gap3-2d-hip-bone-internal
limbs-22-hip-bone|l:pelvis-femur|broad
limbs-23-femur|v:gap-2d-femur-proximal v:gap3-2d-femur-anterior-complete v:gap3-2d-femur-posterior-complete
limbs-24-hip-joint|l:hip-joint c:hip-capsule v:gap2-2d-hip-ligaments-anterior-posterior v:gap2-2d-hip-articular-cartilage-labrum
limbs-25-gluteal|l:pelvic-gateways l:gluteal-superficial l:gluteal-deep l:gluteal-neurovascular l:gluteal-injection v:limbs-2d-gluteal-neurovascular v:gap5-2d-sciatic-foramina-pelvic-gateways
limbs-26-anterior-thigh|l:thigh-anterior v:limbs-2d-thigh-anterior
limbs-27-medial-posterior-thigh|l:thigh-medial l:thigh-posterior v:gap-2d-posterior-thigh-muscles v:gap-2d-thigh-adductors
limbs-28-triangle-canal|l:femoral-triangle l:thigh-arteries-canal v:limbs-2d-femoral-triangle
limbs-30-lower-vessels|l:thigh-veins-lymph l:leg-transitions-veins c:thigh-circulation
limbs-31-knee-bones|l:leg-bones-joints v:gap-2d-femur-distal v:gap-2d-tibia-fibula v:gap3-2d-tibia-fibula-posterior v:gap3-2d-patella-surfaces v:gap3-2d-tibial-plateau-osteology
limbs-32-knee|l:knee-surfaces-capsule l:knee-cruciates l:knee-menisci-collaterals l:knee-locking c:knee-mechanics v:limbs-2d-knee-ligaments v:gap2-2d-knee-menisci-superior v:gap3-2d-knee-medial-patellar-ligaments v:gap3-2d-knee-posterior-capsule-ligaments
limbs-33-popliteal|l:popliteal-fossa v:limbs-2d-popliteal-fossa
limbs-35-anterolateral-leg|l:leg-lateral l:leg-anterior v:limbs-2d-leg-anterolateral
limbs-36-posterior-leg|l:leg-posterior v:limbs-2d-leg-deep-posterior v:gap-2d-calf-superficial
limbs-37-tarsals|v:limbs-2d-foot-bones v:gap3-2d-calcaneus-surfaces v:gap3-2d-talus-surfaces
limbs-38-ankle|l:foot-bones-joints
limbs-38-ankle|c:ankle-tendon-stability v:limbs-2d-ankle-ligaments v:gap-2d-plantar-ligaments v:gap2-2d-ankle-tendon-sheaths-retinacula v:gap3-2d-ankle-deltoid-cervical-ligaments v:gap3-2d-subtalar-bifurcate-ligament-parts v:gap3-2d-ankle-coronal-syndesmosis-cartilage v:gap3-2d-foot-plantar-collateral-ligaments
limbs-39-tarsal-tunnel|l:tarsal-tunnel v:gap5-2d-ankle-tarsal-tunnel-cross-section
limbs-41-arches-gait|l:foot-arches c:foot-mechanics
limbs-40-intrinsic-foot|l:plantar-fascia-sheaths l:intrinsic-foot v:gap-2d-plantar-muscles-layers-1-2 v:gap2-2d-foot-dorsal-plantar-interossei v:gap2-2d-plantar-muscles-third-layer
limbs-40-intrinsic-foot|l:foot-vessels l:foot-nerves-surface v:limbs-2d-plantar-neurovascular v:limbs-2d-plantar-neurovascular-expanded v:gap5-2d-plantar-digital-nerve-branches|broad
limbs-12-arm|u:arm-anterior u:arm-posterior u:arm-nerves v:limbs-2d-arm-anterior v:limbs-2d-arm-posterior
limbs-13-cubital-arteries|u:arm-arteries u:cubital-fossa
limbs-14-flexors|u:forearm-anterior-superficial u:forearm-anterior-deep u:forearm-anterior-neurovascular v:limbs-2d-forearm-flexors-superficial v:limbs-2d-forearm-flexors-deep
limbs-14-flexors|c:forearm-pathways|broad
limbs-15-extensors|u:forearm-posterior-superficial u:forearm-posterior-deep u:extensor-retinaculum v:limbs-2d-forearm-extensors-superficial v:limbs-2d-forearm-extensors-deep
limbs-17-wrist-tunnels|u:wrist-surface u:snuffbox u:wrist-joint u:carpal-tunnel u:palmar-fascia-sheaths v:gap3-2d-palmaris-brevis-palmar-digital-fascia
limbs-16-carpals|u:hand-bones-joints v:gap-2d-carpal-palmar v:gap-2d-carpal-dorsal
limbs-18-intrinsic-hand|u:extensor-hoods u:intrinsic-hand u:hand-nerves c:hand-tendon-mechanics v:limbs-2d-hand-muscles
limbs-19-hand-blood|u:hand-arteries v:limbs-2d-palmar-arch
limbs-19-hand-blood|c:hand-neurovascular-spaces|broad
limbs-08-plexus|u:plexus-plan u:plexus-root-branches u:plexus-lateral u:plexus-medial u:plexus-posterior u:plexus-lesions c:plexus-localization v:limbs-2d-brachial-plexus
limbs-29-lower-nerves|v:gap5-2d-lumbar-plexus-psoas-relations v:gap5-2d-lumbar-plexus-branches v:gap5-2d-sacral-plexus-pelvis c:leg-lesion-levels
limbs-43-development|e:development c:limb-development ae:milestones ae:field-and-bone-pattern ae:ridge-boundary ae:myogenic-domains ae:muscle-assembly
limbs-44-congenital-growth|ae:skeletal-maturation ae:defect-morphology ae:developmental-disruption ae:syndromic-limbs ae:joint-muscle-conditions ae:skeletal-dysplasia
limbs-45-cartilage-bone|c:cartilage-bone-function ah:cartilage-cells ah:cartilage-growth ah:synoviocytes ah:joint-microstructure ah:bone-cells ah:bone-growth-repair ah:bone-remodeling
limbs-45-cartilage-bone|ah:connective-recognition|broad
limbs-46-muscle-histology|c:skeletal-muscle-structure ah:muscle-architecture ah:muscle-interfaces
limbs-47-muscle-physiology|c:muscle-physiology ap:nmj-concept ap:coupling-concept ap:crossbridge-concept ap:units-concept ap:length-concept ap:work-concept ap:energy-concept
limbs-47-muscle-physiology|ap:axon-concept ap:conduction-concept ap:quantitative-concept ap:spindle-concept ap:stretch-concept ap:protective-concept|broad
limbs-20-upper-localization|d:axilla-arm d:hand|broad
limbs-42-lower-clinical|d:proximal-lower d:knee-foot|broad
limbs-34-leg-cross|v:gap3-2d-lower-limb-fascia-retinacula-tendons|broad
limbs-04-clavicle-scapula|v:limbs-2d-upper-bones|broad
limbs-22-hip-bone|v:limbs-2d-lower-bones|broad
`,
  biochemistry: `
biochem-glycolysis|b:ch08-anaerobic-rbc b:ch08-glycolysis-overview b:ch08-payoff
biochem-glucose-entry|b:ch08-glucose-phosphorylation b:ch08-glucose-transport
biochem-glycolysis-regulation|b:ch08-hormonal-pyruvate b:ch08-pfk-cleavage
biochem-metabolic-logic|b:ch08-metabolic-regulation b:ch08-pathway-architecture
biochem-pdh-tca|b:ch09-akg-succinate b:ch09-citrate-isocitrate b:ch09-cycle-role b:ch09-pdh-chemistry b:ch09-pdh-regulation-clinical b:ch09-succinate-oaa b:ch09-yield-regulation
biochem-gluconeogenesis|b:ch10-cycles-clinical b:ch10-energy-cost b:ch10-oaa-pepck b:ch10-phosphatase-bypasses b:ch10-purpose-sites b:ch10-pyruvate-carboxylase b:ch10-reciprocal-regulation b:ch10-substrates
biochem-glycogen|b:ch11-allosteric-calcium b:ch11-cytosolic-degradation b:ch11-debranching-lysosome b:ch11-hormonal-covalent b:ch11-storage-diseases b:ch11-structure-tissue b:ch11-synthase-branching b:ch11-udp-primer
biochem-other-sugars|b:ch12-fructose-disorders b:ch12-fructose-entry b:ch12-galactose-disorders b:ch12-galactose-pathway b:ch12-lactose-synthesis b:ch12-mannose-polyol
biochem-micelles-chylomicrons|b:ch15-chylomicron-assembly b:ch15-enterocyte-reesterification b:ch15-fa-glycerol-fates b:ch15-lpl b:ch15-micelles-absorption b:ch15-remnants-malabsorption
biochem-lipid-digestion|b:ch15-emulsification b:ch15-hormonal-control b:ch15-lipid-overview b:ch15-pancreatic-enzymes b:ch15-stomach-cf
biochem-nutrition-review|b:ch15-source-specific-intake|broad
biochem-metabolic-logic|depth-bio-integration|broad
biochemistry-practical/bp-glassware|p:lab-concept|broad
biochemistry-practical/bp-titration-calculation|p:titration-concept|broad
biochemistry-practical/bp-beer-lambert|p:photometry-concept|broad
biochemistry-practical/bp-tests-overview|p:proteins-concept|broad
biochemistry-practical/bp-enzyme-foundations|p:enzymes-concept|broad
biochemistry-practical/bp-flame-principle|p:flame-concept|broad
`,
};

export const prefixes = {
  cvs:{a:'cvs-anat-',p:'cvs-phys-',h:'cvs-histo-',e:'cvs-emb-',d:'depth-cvs-',c:'comp-cvs-',v:'cvs-visual-atlas-'},
  limbs:{u:'limb-concept-ul-',l:'limb-concept-ll-',d:'depth-limbs-',e:'depth-limb-emb-',c:'comp-limbs-',ae:'limb-audit-emb-concept-',ah:'limb-audit-hist-concept-',ap:'limb-audit-phys-',v:'limbs-visual-atlas-'},
  biochemistry:{b:'bio2-',p:'biochem2-practical-'},
};
