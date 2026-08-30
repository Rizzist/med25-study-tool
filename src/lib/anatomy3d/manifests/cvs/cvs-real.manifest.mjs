/**
 * REAL (mesh-backed) cardiovascular manifest — additive prototype for the CVS region.
 *
 * The 29 REAL structures map 1:1 to named nodes in `/anatomy3d/cvs/cvs.glb`, built from
 * BodyParts3D PART-OF element meshes (Wavefront OBJ, 99% polygon-reduction release):
 * the four chamber cavities, papillary muscles, the four valves, the coronary vessels and the
 * great vessels. The 16 SCHEMATIC (procedural) structures — the septa, pectinate/moderator/chordae
 * apparatus, the whole conduction system and the pericardial layers — have no separable BodyParts3D
 * mesh and are drawn procedurally in the factory, placed relative to the real-mesh bounding boxes.
 *
 *   Attribution (required, CC-BY 4.0):
 *   "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const cvsManifest = {
  id: "cvs",
  region: "cvs",
  modelKey: "cvs",
  title: "Heart & great vessels",
  subject: "anatomy",
  blurb:
    "Anatomically-accurate human heart reconstructed from BodyParts3D segmented meshes: the four chamber cavities, valves, papillary muscles, coronary vessels and great vessels in true relationship, with the septa, conduction system and pericardium added as schematic diagrammatic layers.",
  structures: [
    // ---- Heart chambers & walls (10) ------------------------------------------------
    {
      id: "right-atrium",
      label: "Right atrium",
      shortLabel: "RA",
      aliases: ["right atrial chamber", "RA"],
      tissue: "cavity",
      description:
        "Thin-walled chamber forming the right heart border, receiving the SVC, IVC and coronary sinus and emptying through the tricuspid valve. Its posterior sinus venarum is smooth, whereas the anterior wall and auricle contain pectinate muscle.",
      keyPoints: [
        "The fossa ovalis is seen on its septal wall.",
        "Three major systemic venous channels open here.",
      ],
      difficulty: 1,
      distractorIds: ["left-atrium", "right-ventricle", "left-ventricle"],
      view: { azimuth: -0.5, elevation: 0.12, zoom: 1.15 },
    },
    {
      id: "left-atrium",
      label: "Left atrium",
      shortLabel: "LA",
      aliases: ["left atrial chamber", "LA"],
      tissue: "cavity",
      description:
        "Posterior chamber forming most of the base of the heart, receiving the pulmonary veins and emptying through the mitral valve. Most of its wall is smooth; pectinate muscle is largely confined to the auricle.",
      keyPoints: [
        "It is the most posterior chamber and lies just anterior to the oesophagus.",
        "Dilatation may compress the oesophagus.",
      ],
      difficulty: 1,
      distractorIds: ["right-atrium", "left-ventricle", "right-ventricle"],
      view: { azimuth: 3.14159, elevation: 0.14, zoom: 1.2 },
    },
    {
      id: "right-ventricle",
      label: "Right ventricle",
      shortLabel: "RV",
      aliases: ["right ventricular chamber", "RV"],
      tissue: "cavity",
      description:
        "Chamber lying mainly anterior to the left ventricle and forming most of the sternocostal surface; it receives blood through the tricuspid valve and ejects it into the pulmonary trunk. Its inflow is trabeculated and its outflow tract, the conus arteriosus, is smooth.",
      keyPoints: [
        "Its wall is thinner than the left ventricle because it pumps into the low-resistance pulmonary circuit.",
        "The supraventricular crest separates inflow from outflow.",
      ],
      difficulty: 1,
      distractorIds: ["left-ventricle", "right-atrium", "left-atrium"],
      view: { azimuth: 0.15, elevation: 0.08, zoom: 1.15 },
    },
    {
      id: "left-ventricle",
      label: "Left ventricle",
      shortLabel: "LV",
      aliases: ["left ventricular chamber", "LV"],
      tissue: "cavity",
      description:
        "Thick-walled chamber forming the apex, left border and much of the diaphragmatic surface of the heart; it receives blood through the mitral valve and ejects it through the aortic valve. The aortic vestibule is its smooth superior outflow region.",
      keyPoints: [
        "Its myocardium is roughly three times thicker than that of the right ventricle.",
        "The apex beat is normally palpable in the left fifth intercostal space near the midclavicular line.",
      ],
      difficulty: 1,
      distractorIds: ["right-ventricle", "left-atrium", "right-atrium"],
      view: { azimuth: 0.7, elevation: 0.0, zoom: 1.2 },
    },
    {
      id: "interatrial-septum",
      schematic: true,
      label: "Interatrial septum and fossa ovalis",
      shortLabel: "Atrial septum",
      aliases: ["atrial septum", "fossa ovalis", "oval fossa"],
      tissue: "muscle",
      description:
        "Partition between the atria, viewed most clearly from the right atrium; its thin central fossa ovalis is the remnant of the fetal foramen ovale and is bordered by the limbus. Only the floor of the fossa and its immediate rim form the true septum.",
      keyPoints: [
        "A probe-patent foramen ovale results from failed postnatal fusion of septum primum and septum secundum.",
        "Atrial septal defects permit an atrial-level shunt.",
      ],
      difficulty: 2,
      distractorIds: ["interventricular-septum", "septomarginal-trabecula", "right-atrial-pectinate-muscles"],
      view: { azimuth: 2.7, elevation: 0.1, zoom: 1.5 },
    },
    {
      id: "interventricular-septum",
      schematic: true,
      label: "Interventricular septum",
      shortLabel: "IV septum",
      aliases: ["ventricular septum", "IV septum", "IVS"],
      tissue: "muscle",
      description:
        "Oblique partition between the ventricles with a large muscular part and a small superior membranous part near the aortic and tricuspid valves. Its right surface bulges into the right ventricle because left ventricular pressure is higher.",
      keyPoints: [
        "The membranous part is the commonest site of a ventricular septal defect.",
        "The AV bundle traverses the fibrous/membranous region before dividing.",
      ],
      difficulty: 2,
      distractorIds: ["interatrial-septum", "septomarginal-trabecula", "papillary-muscles"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "right-atrial-pectinate-muscles",
      schematic: true,
      label: "Right atrial pectinate muscles",
      shortLabel: "Pectinate mm.",
      aliases: ["musculi pectinati", "pectinate muscle", "crista terminalis region"],
      tissue: "muscle",
      description:
        "Parallel muscular ridges in the right atrial auricle and anterior wall, separated from the smooth sinus venarum by the vertically oriented crista terminalis. The corresponding external landmark is the sulcus terminalis.",
      keyPoints: [
        "The SA node lies near the superior end of the crista terminalis.",
        "In the left atrium, pectinate muscle is mainly confined to the auricle.",
      ],
      difficulty: 2,
      distractorIds: ["papillary-muscles", "septomarginal-trabecula", "interatrial-septum"],
      view: { azimuth: -0.6, elevation: 0.15, zoom: 1.6 },
    },
    {
      id: "septomarginal-trabecula",
      schematic: true,
      label: "Septomarginal trabecula",
      shortLabel: "Moderator band",
      aliases: ["moderator band", "trabecula septomarginalis"],
      tissue: "muscle",
      description:
        "Muscular band crossing the right ventricular cavity from the interventricular septum to the base of the anterior papillary muscle. It is a specialized trabecula carnea unique to the right ventricle.",
      keyPoints: [
        "It conveys part of the right bundle branch toward the anterior papillary muscle.",
        "It helps coordinate right ventricular contraction.",
      ],
      difficulty: 2,
      distractorIds: ["papillary-muscles", "interventricular-septum", "right-atrial-pectinate-muscles"],
      view: { azimuth: 0.3, elevation: -0.1, zoom: 1.6 },
    },
    {
      id: "papillary-muscles",
      label: "Papillary muscles",
      shortLabel: "Papillary mm.",
      aliases: ["ventricular papillary muscles"],
      tissue: "muscle",
      description:
        "Conical myocardial projections from the ventricular walls that attach to AV-valve cusps through chordae tendineae; the right ventricle usually has anterior, posterior and septal groups, while the left has anterolateral and posteromedial groups. They tense during systole to stabilize the closed cusps.",
      keyPoints: [
        "They prevent AV-valve prolapse but do not pull the valves open.",
        "The posteromedial left papillary muscle is more vulnerable to infarction because its blood supply is commonly single-source.",
      ],
      difficulty: 2,
      distractorIds: ["septomarginal-trabecula", "right-atrial-pectinate-muscles", "interventricular-septum"],
      view: { azimuth: 0.5, elevation: -0.2, zoom: 1.5 },
    },
    {
      id: "chordae-tendineae",
      schematic: true,
      label: "Chordae tendineae",
      shortLabel: "Chordae",
      aliases: ["heart strings", "tendinous cords"],
      tissue: "ligament",
      description:
        "Fine fibrous cords joining papillary muscles to the free margins and ventricular surfaces of tricuspid and mitral cusps. They are part of the AV-valve apparatus and are absent from the semilunar valves.",
      keyPoints: [
        "They prevent cusp eversion during ventricular systole.",
        "Rupture can cause acute mitral or tricuspid regurgitation.",
      ],
      difficulty: 2,
      distractorIds: ["papillary-muscles", "tricuspid-valve", "mitral-valve"],
      view: { azimuth: 0.4, elevation: -0.15, zoom: 1.6 },
    },
    // ---- Valves (4) -----------------------------------------------------------------
    {
      id: "tricuspid-valve",
      label: "Tricuspid valve",
      shortLabel: "Tricuspid",
      aliases: ["right atrioventricular valve", "right AV valve"],
      tissue: "membrane",
      description:
        "Valve between the right atrium and right ventricle, usually formed by anterior, posterior and septal cusps attached to a fibrous annulus. Its cusps are tethered to right ventricular papillary muscles by chordae tendineae.",
      keyPoints: [
        "Best auscultated at the left lower sternal border.",
        "The septal cusp lies close to the membranous septum and AV conduction tissue.",
      ],
      difficulty: 1,
      distractorIds: ["mitral-valve", "pulmonary-valve", "aortic-valve"],
      view: { azimuth: -0.4, elevation: 0.8, zoom: 1.6 },
    },
    {
      id: "pulmonary-valve",
      label: "Pulmonary valve",
      shortLabel: "Pulmonary",
      aliases: ["pulmonic valve", "valve of pulmonary trunk"],
      tissue: "membrane",
      description:
        "Semilunar valve at the right ventricular outflow into the pulmonary trunk, with anterior, right and left cusps forming pulmonary sinuses. It has neither chordae tendineae nor papillary-muscle attachments.",
      keyPoints: [
        "It is the most anterior cardiac valve.",
        "Best auscultated in the left second intercostal space.",
      ],
      difficulty: 1,
      distractorIds: ["aortic-valve", "tricuspid-valve", "mitral-valve"],
      view: { azimuth: 0.2, elevation: 0.7, zoom: 1.6 },
    },
    {
      id: "mitral-valve",
      label: "Mitral valve",
      shortLabel: "Mitral",
      aliases: ["bicuspid valve", "left atrioventricular valve", "left AV valve"],
      tissue: "membrane",
      description:
        "Valve between the left atrium and left ventricle, formed by anterior and posterior leaflets attached to a fibrous annulus and tethered by chordae to two papillary-muscle groups. Its anterior leaflet is continuous with the aortic fibrous curtain.",
      keyPoints: [
        "Best auscultated at the cardiac apex.",
        "Papillary-muscle or chordal failure produces mitral regurgitation.",
      ],
      difficulty: 1,
      distractorIds: ["tricuspid-valve", "aortic-valve", "pulmonary-valve"],
      view: { azimuth: 2.8, elevation: 0.8, zoom: 1.6 },
    },
    {
      id: "aortic-valve",
      label: "Aortic valve",
      shortLabel: "Aortic",
      aliases: ["aortic semilunar valve"],
      tissue: "membrane",
      description:
        "Semilunar valve between the left ventricle and ascending aorta, with right coronary, left coronary and non-coronary cusps and corresponding aortic sinuses. The coronary arteries arise from the right and left aortic sinuses just superior to the cusps.",
      keyPoints: [
        "It has no chordae or papillary muscles.",
        "Best auscultated in the right second intercostal space.",
      ],
      difficulty: 1,
      distractorIds: ["pulmonary-valve", "mitral-valve", "tricuspid-valve"],
      view: { azimuth: 0.0, elevation: 0.8, zoom: 1.6 },
    },
    // ---- Coronary vessels (8) -------------------------------------------------------
    {
      id: "right-coronary-artery",
      label: "Right coronary artery",
      shortLabel: "RCA",
      aliases: ["RCA"],
      tissue: "artery",
      description:
        "Artery arising from the right aortic sinus and running in the right atrioventricular groove toward the crux of the heart. It supplies much of the right heart and, in right-dominant circulation, gives rise to the posterior interventricular artery.",
      keyPoints: [
        "It commonly supplies the SA and AV nodes.",
        "Coronary dominance is defined by the source of the posterior interventricular artery.",
      ],
      difficulty: 1,
      distractorIds: ["left-coronary-artery", "circumflex-artery", "right-marginal-artery"],
      view: { azimuth: -0.6, elevation: 0.15, zoom: 1.4 },
    },
    {
      id: "left-coronary-artery",
      label: "Left coronary artery",
      shortLabel: "LCA",
      aliases: ["LCA", "left main coronary artery", "LMCA"],
      tissue: "artery",
      description:
        "Short arterial trunk arising from the left aortic sinus and passing between the pulmonary trunk and left auricle before dividing, usually into anterior interventricular and circumflex branches. It supplies most of the left atrium, left ventricle and interventricular septum.",
      keyPoints: [
        "Left-main occlusion threatens a very large myocardial territory.",
        "It usually bifurcates into LAD and circumflex arteries.",
      ],
      difficulty: 1,
      distractorIds: ["right-coronary-artery", "anterior-interventricular-artery", "circumflex-artery"],
      view: { azimuth: 0.3, elevation: 0.15, zoom: 1.5 },
    },
    {
      id: "anterior-interventricular-artery",
      label: "Anterior interventricular artery",
      shortLabel: "LAD",
      aliases: ["left anterior descending artery", "LAD", "anterior descending artery"],
      tissue: "artery",
      description:
        "Major branch of the left coronary artery descending in the anterior interventricular sulcus with the great cardiac vein toward the apex. It supplies the anterior ventricular walls and anterior two-thirds of the interventricular septum.",
      keyPoints: [
        "A common site of clinically important coronary occlusion.",
        "Its septal branches supply the bundle branches.",
      ],
      difficulty: 1,
      distractorIds: ["posterior-interventricular-artery", "circumflex-artery", "right-marginal-artery"],
      view: { azimuth: 0.1, elevation: 0.1, zoom: 1.35 },
    },
    {
      id: "circumflex-artery",
      label: "Circumflex artery",
      shortLabel: "LCx",
      aliases: ["circumflex branch of LCA", "LCx"],
      tissue: "artery",
      description:
        "Branch of the left coronary artery that curves leftward in the atrioventricular groove beneath the left auricle and onto the posterior heart. It supplies the left atrium and lateral/posterior left ventricle.",
      keyPoints: [
        "It gives the posterior interventricular artery in left-dominant circulation.",
        "Obtuse marginal branches descend along the left ventricular margin.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-interventricular-artery", "right-coronary-artery", "posterior-interventricular-artery"],
      view: { azimuth: 1.5, elevation: 0.1, zoom: 1.4 },
    },
    {
      id: "posterior-interventricular-artery",
      label: "Posterior interventricular artery",
      shortLabel: "PDA",
      aliases: ["posterior descending artery", "PDA", "posterior IV artery"],
      tissue: "artery",
      description:
        "Artery descending in the posterior interventricular sulcus toward the apex, usually alongside the middle cardiac vein. It most often arises from the RCA but may arise from the circumflex artery.",
      keyPoints: [
        "Its origin defines right versus left coronary dominance.",
        "It supplies the posterior one-third of the interventricular septum.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-interventricular-artery", "right-marginal-artery", "circumflex-artery"],
      view: { azimuth: 3.14159, elevation: -0.1, zoom: 1.4 },
    },
    {
      id: "right-marginal-artery",
      label: "Right marginal artery",
      shortLabel: "Right marginal",
      aliases: ["acute marginal artery", "marginal branch of RCA"],
      tissue: "artery",
      description:
        "Usually a branch of the RCA that runs toward the apex along the acute/right margin of the heart. It chiefly supplies the right ventricular free wall.",
      keyPoints: [
        "Its size and exact origin vary.",
        "Do not confuse it with left-sided obtuse marginal branches of the circumflex artery.",
      ],
      difficulty: 2,
      distractorIds: ["right-coronary-artery", "anterior-interventricular-artery", "posterior-interventricular-artery"],
      view: { azimuth: -0.9, elevation: 0.0, zoom: 1.45 },
    },
    {
      id: "coronary-sinus",
      label: "Coronary sinus",
      shortLabel: "Coronary sinus",
      aliases: ["sinus coronarius"],
      tissue: "vein",
      description:
        "Large venous channel in the posterior atrioventricular groove that receives most cardiac veins and opens into the right atrium between the IVC orifice and tricuspid valve. It is the principal venous drainage route of the myocardium.",
      keyPoints: [
        "Its ostium is a landmark at the base of the triangle of Koch.",
        "It receives the great, middle and small cardiac veins.",
      ],
      difficulty: 1,
      distractorIds: ["great-cardiac-vein", "superior-vena-cava", "inferior-vena-cava"],
      view: { azimuth: 3.14159, elevation: -0.1, zoom: 1.4 },
    },
    {
      id: "great-cardiac-vein",
      label: "Great cardiac vein",
      shortLabel: "Great cardiac v.",
      aliases: ["anterior interventricular vein"],
      tissue: "vein",
      description:
        "Vein beginning near the apex and ascending in the anterior interventricular sulcus with the LAD before curving with the circumflex artery into the coronary sinus. It drains much of the territory supplied by the left coronary artery.",
      keyPoints: [
        "It accompanies the LAD anteriorly.",
        "It becomes continuous with the coronary sinus near the left AV groove.",
      ],
      difficulty: 2,
      distractorIds: ["coronary-sinus", "superior-vena-cava", "pulmonary-veins"],
      view: { azimuth: 0.2, elevation: 0.1, zoom: 1.4 },
    },
    // ---- Conduction system (5) — all schematic --------------------------------------
    {
      id: "sinoatrial-node",
      schematic: true,
      label: "Sinoatrial node",
      shortLabel: "SA node",
      aliases: ["SA node", "sinus node"],
      tissue: "muscle",
      description:
        "Small subepicardial focus of specialized myocardium at the superior end of the crista terminalis, near the SVC-right atrial junction. It initiates the normal cardiac impulse.",
      keyPoints: [
        "It is the normal pacemaker of the heart.",
        "Its arterial supply most often comes from the RCA but may come from the circumflex artery.",
      ],
      difficulty: 1,
      distractorIds: ["atrioventricular-node", "atrioventricular-bundle", "right-bundle-branch"],
      view: { azimuth: -0.5, elevation: 0.4, zoom: 1.8 },
    },
    {
      id: "atrioventricular-node",
      schematic: true,
      label: "Atrioventricular node",
      shortLabel: "AV node",
      aliases: ["AV node", "node of Tawara"],
      tissue: "muscle",
      description:
        "Small focus of specialized myocardium in the posteroinferior interatrial septal region, within the triangle of Koch near the coronary-sinus ostium and septal tricuspid cusp. It delays conduction before impulses enter the ventricles.",
      keyPoints: [
        "The delay permits ventricular filling after atrial contraction.",
        "It is commonly supplied by an AV nodal branch of the dominant coronary artery.",
      ],
      difficulty: 2,
      distractorIds: ["sinoatrial-node", "atrioventricular-bundle", "right-bundle-branch"],
      view: { azimuth: 2.8, elevation: 0.1, zoom: 1.8 },
    },
    {
      id: "atrioventricular-bundle",
      schematic: true,
      label: "Atrioventricular bundle",
      shortLabel: "Bundle of His",
      aliases: ["bundle of His", "AV bundle", "His bundle"],
      tissue: "muscle",
      description:
        "Tract of specialized myocardium leaving the AV node, penetrating the fibrous skeleton and entering the membranous interventricular septum before dividing into right and left bundle branches. It is the normal electrical bridge between atrial and ventricular myocardium.",
      keyPoints: [
        "It is the only normal conducting connection through the insulating cardiac skeleton.",
        "Damage can produce complete heart block.",
      ],
      difficulty: 2,
      distractorIds: ["atrioventricular-node", "right-bundle-branch", "left-bundle-branch"],
      view: { azimuth: 0.2, elevation: 0.1, zoom: 1.7 },
    },
    {
      id: "right-bundle-branch",
      schematic: true,
      label: "Right bundle branch",
      shortLabel: "RBB",
      aliases: ["right crus of AV bundle", "RBB"],
      tissue: "muscle",
      description:
        "Slender continuation of the AV bundle along the right side of the interventricular septum toward the apex and anterior papillary muscle. Part of it travels through the septomarginal trabecula to distribute the impulse through the right ventricle.",
      keyPoints: [
        "Its moderator-band relationship is a classic identification point.",
        "Block delays right ventricular depolarization.",
      ],
      difficulty: 2,
      distractorIds: ["left-bundle-branch", "atrioventricular-bundle", "sinoatrial-node"],
      view: { azimuth: 0.3, elevation: 0.0, zoom: 1.7 },
    },
    {
      id: "left-bundle-branch",
      schematic: true,
      label: "Left bundle branch",
      shortLabel: "LBB",
      aliases: ["left crus of AV bundle", "LBB"],
      tissue: "muscle",
      description:
        "Broad continuation of the AV bundle descending on the left side of the interventricular septum beneath the endocardium. It commonly divides into anterior and posterior fascicles that distribute conduction through the left ventricle.",
      keyPoints: [
        "It is broader and branches earlier than the right bundle branch.",
        "Its fascicles ultimately join the subendocardial Purkinje network.",
      ],
      difficulty: 2,
      distractorIds: ["right-bundle-branch", "atrioventricular-bundle", "atrioventricular-node"],
      view: { azimuth: 0.5, elevation: 0.0, zoom: 1.7 },
    },
    // ---- Great vessels (12) ---------------------------------------------------------
    {
      id: "ascending-aorta",
      label: "Ascending aorta",
      shortLabel: "Asc. aorta",
      aliases: ["proximal aorta"],
      tissue: "artery",
      description:
        "Intrapericardial aortic segment rising from the left ventricle behind the pulmonary trunk and continuing as the arch near the right second sternocostal joint. Its root contains the aortic sinuses.",
      keyPoints: [
        "The right and left coronary arteries are its only branches.",
        "Aortic dissection here can cause tamponade or coronary compromise.",
      ],
      difficulty: 1,
      distractorIds: ["aortic-arch", "descending-thoracic-aorta", "pulmonary-trunk"],
      view: { azimuth: 0.1, elevation: 0.3, zoom: 1.25 },
    },
    {
      id: "aortic-arch",
      label: "Arch of aorta",
      shortLabel: "Aortic arch",
      aliases: ["aortic arch"],
      tissue: "artery",
      description:
        "Curved continuation of the ascending aorta passing superiorly, posteriorly and leftward over the left main bronchus before becoming the descending thoracic aorta near the sternal-angle plane. It gives three usual branches.",
      keyPoints: [
        "Branch order is brachiocephalic trunk, left common carotid, then left subclavian artery.",
        "The left recurrent laryngeal nerve hooks beneath it near the ligamentum arteriosum.",
      ],
      difficulty: 1,
      distractorIds: ["ascending-aorta", "descending-thoracic-aorta", "pulmonary-trunk"],
      view: { azimuth: 0.0, elevation: 0.55, zoom: 1.2 },
    },
    {
      id: "descending-thoracic-aorta",
      label: "Descending thoracic aorta",
      shortLabel: "Desc. aorta",
      aliases: ["thoracic aorta", "descending aorta"],
      tissue: "artery",
      description:
        "Continuation of the aortic arch descending through the posterior mediastinum, initially left of the vertebral bodies, and passing through the aortic hiatus at T12 to become the abdominal aorta. It gives posterior intercostal and visceral thoracic branches.",
      keyPoints: [
        "It lies posterior to the root of the left lung.",
        "It passes through the diaphragm at T12.",
      ],
      difficulty: 1,
      distractorIds: ["aortic-arch", "ascending-aorta", "left-subclavian-artery"],
      view: { azimuth: 3.14159, elevation: 0.0, zoom: 1.3 },
    },
    {
      id: "brachiocephalic-trunk",
      label: "Brachiocephalic trunk",
      shortLabel: "Brachiocephalic",
      aliases: ["innominate artery", "brachiocephalic artery"],
      tissue: "artery",
      description:
        "First and largest branch of the aortic arch, ascending behind the manubrium toward the right sternoclavicular joint. It divides there into the right common carotid and right subclavian arteries.",
      keyPoints: [
        "It exists only on the right in normal anatomy.",
        "It crosses anterior to the trachea as it ascends.",
      ],
      difficulty: 1,
      distractorIds: ["left-common-carotid-artery", "left-subclavian-artery", "aortic-arch"],
      view: { azimuth: 0.2, elevation: 0.65, zoom: 1.35 },
    },
    {
      id: "left-common-carotid-artery",
      label: "Left common carotid artery",
      shortLabel: "Left CCA",
      aliases: ["left CCA"],
      tissue: "artery",
      description:
        "Second usual branch of the aortic arch, ascending through the superior mediastinum into the neck, initially posterior and left of the brachiocephalic trunk. It supplies the left side of the head and neck after dividing into internal and external carotid arteries.",
      keyPoints: [
        "Unlike the right common carotid, it arises directly from the aortic arch.",
        "It has no branches in the thorax.",
      ],
      difficulty: 2,
      distractorIds: ["brachiocephalic-trunk", "left-subclavian-artery", "aortic-arch"],
      view: { azimuth: 0.4, elevation: 0.75, zoom: 1.35 },
    },
    {
      id: "left-subclavian-artery",
      label: "Left subclavian artery",
      shortLabel: "Left subclavian",
      aliases: ["left subclavian"],
      tissue: "artery",
      description:
        "Third usual and most posterior branch of the aortic arch, ascending superolaterally toward the root of the neck and continuing as the axillary artery at the lateral border of the first rib. It arches over the cervical pleura and lung apex.",
      keyPoints: [
        "It arises directly from the arch; the right subclavian arises from the brachiocephalic trunk.",
        "Its first part gives the vertebral and internal thoracic arteries and thyrocervical trunk.",
      ],
      difficulty: 2,
      distractorIds: ["left-common-carotid-artery", "brachiocephalic-trunk", "descending-thoracic-aorta"],
      view: { azimuth: 0.7, elevation: 0.65, zoom: 1.4 },
    },
    {
      id: "superior-vena-cava",
      label: "Superior vena cava",
      shortLabel: "SVC",
      aliases: ["SVC"],
      tissue: "vein",
      description:
        "Large valveless vein formed by the right and left brachiocephalic veins behind the right first costal cartilage; it descends in the right superior mediastinum and enters the right atrium. The azygos vein joins it just before it pierces the pericardium.",
      keyPoints: [
        "It returns blood from structures above the diaphragm except the heart and lungs.",
        "Its lower half lies within the fibrous pericardium.",
      ],
      difficulty: 1,
      distractorIds: ["inferior-vena-cava", "pulmonary-veins", "coronary-sinus"],
      view: { azimuth: -0.3, elevation: 0.4, zoom: 1.3 },
    },
    {
      id: "inferior-vena-cava",
      label: "Inferior vena cava",
      shortLabel: "IVC",
      aliases: ["IVC"],
      tissue: "vein",
      description:
        "Large valveless vein entering the thorax through the caval opening in the central tendon at T8 and following a short intrapericardial course into the right atrium. It returns blood from below the diaphragm.",
      keyPoints: [
        "It passes through the diaphragm at T8.",
        "Its thoracic course is very short and it has no thoracic tributaries.",
      ],
      difficulty: 1,
      distractorIds: ["superior-vena-cava", "pulmonary-veins", "coronary-sinus"],
      view: { azimuth: -0.2, elevation: -0.45, zoom: 1.3 },
    },
    {
      id: "pulmonary-trunk",
      label: "Pulmonary trunk",
      shortLabel: "Pulmonary trunk",
      aliases: ["main pulmonary artery"],
      tissue: "artery",
      description:
        "Large intrapericardial vessel arising from the right ventricle, passing superiorly and posteriorly to the left of the ascending aorta and bifurcating into right and left pulmonary arteries near the sternal-angle plane. It carries deoxygenated blood.",
      keyPoints: [
        "The ligamentum arteriosum links the bifurcation/left pulmonary artery region to the aortic arch.",
        "It is anterior to the ascending aorta at its origin.",
      ],
      difficulty: 1,
      distractorIds: ["ascending-aorta", "right-pulmonary-artery", "left-pulmonary-artery"],
      view: { azimuth: 0.1, elevation: 0.3, zoom: 1.3 },
    },
    {
      id: "right-pulmonary-artery",
      label: "Right pulmonary artery",
      shortLabel: "RPA",
      aliases: ["RPA"],
      tissue: "artery",
      description:
        "Longer pulmonary arterial branch passing horizontally to the right, posterior to the ascending aorta and SVC and anterior to the right main bronchus. It divides at the right lung root to follow lobar bronchi.",
      keyPoints: [
        "At the hilum it lies anterior to the bronchus: mnemonic RALS, Right Anterior.",
        "It carries deoxygenated blood.",
      ],
      difficulty: 2,
      distractorIds: ["left-pulmonary-artery", "pulmonary-trunk", "pulmonary-veins"],
      view: { azimuth: -0.7, elevation: 0.3, zoom: 1.35 },
    },
    {
      id: "left-pulmonary-artery",
      label: "Left pulmonary artery",
      shortLabel: "LPA",
      aliases: ["LPA"],
      tissue: "artery",
      description:
        "Shorter pulmonary arterial branch passing leftward anterior to the descending aorta and superior to the left main bronchus beneath the aortic arch. It divides at the left lung root.",
      keyPoints: [
        "At the hilum it lies superior to the bronchus: mnemonic RALS, Left Superior.",
        "The ligamentum arteriosum attaches near its origin.",
      ],
      difficulty: 2,
      distractorIds: ["right-pulmonary-artery", "pulmonary-trunk", "pulmonary-veins"],
      view: { azimuth: 0.7, elevation: 0.3, zoom: 1.35 },
    },
    {
      id: "pulmonary-veins",
      label: "Pulmonary veins",
      shortLabel: "Pulmonary veins",
      aliases: [
        "right and left superior pulmonary veins",
        "right and left inferior pulmonary veins",
      ],
      tissue: "vein",
      description:
        "Usually four valveless veins, superior and inferior on each side, returning oxygenated blood from the lungs to the posterior left atrium. At each lung root they generally occupy the anterior/inferior part of the hilar arrangement.",
      keyPoints: [
        "They carry oxygenated blood despite being veins.",
        "The right veins pass posterior to the SVC and right atrium.",
      ],
      difficulty: 1,
      distractorIds: ["superior-vena-cava", "inferior-vena-cava", "great-cardiac-vein"],
      view: { azimuth: 3.14159, elevation: 0.1, zoom: 1.35 },
    },
    // ---- Pericardium (6) — all schematic --------------------------------------------
    {
      id: "fibrous-pericardium",
      schematic: true,
      label: "Fibrous pericardium",
      shortLabel: "Fibrous pericardium",
      aliases: ["fibrous pericardial sac"],
      tissue: "membrane",
      description:
        "Tough, inelastic outer pericardial sac enclosing the heart and roots of the great vessels; it is fused inferiorly to the central tendon of the diaphragm and blends superiorly with great-vessel adventitia. Sternopericardial ligaments anchor it anteriorly.",
      keyPoints: [
        "Its limited distensibility makes rapid effusion especially dangerous.",
        "The phrenic nerves descend on its lateral surfaces.",
      ],
      difficulty: 1,
      distractorIds: ["parietal-serous-pericardium", "visceral-serous-pericardium", "pericardial-cavity"],
      view: { azimuth: 0.2, elevation: 0.18, zoom: 1.0 },
    },
    {
      id: "parietal-serous-pericardium",
      schematic: true,
      label: "Parietal serous pericardium",
      shortLabel: "Parietal serous",
      aliases: ["parietal pericardium", "parietal layer"],
      tissue: "membrane",
      description:
        "Serous membrane lining the internal surface of the fibrous pericardium. It reflects around the roots of the great vessels to become the visceral serous layer.",
      keyPoints: [
        "It is separated from the visceral layer by the pericardial cavity.",
        "Pain from parietal/fibrous pericardium is carried mainly by the phrenic nerves.",
      ],
      difficulty: 2,
      distractorIds: ["visceral-serous-pericardium", "fibrous-pericardium", "pericardial-cavity"],
      view: { azimuth: 0.2, elevation: 0.18, zoom: 1.05 },
    },
    {
      id: "visceral-serous-pericardium",
      schematic: true,
      label: "Visceral serous pericardium",
      shortLabel: "Epicardium",
      aliases: ["epicardium", "visceral pericardium", "visceral layer"],
      tissue: "membrane",
      description:
        "Serous membrane adherent to the external surface of the heart, forming the epicardium and reflecting onto the great vessels. Coronary vessels and variable fat lie immediately deep to it in the subepicardial connective tissue.",
      keyPoints: [
        "It is the outer layer of the heart wall.",
        "It is relatively insensitive to pain compared with the parietal layer.",
      ],
      difficulty: 2,
      distractorIds: ["parietal-serous-pericardium", "fibrous-pericardium", "pericardial-cavity"],
      view: { azimuth: 0.2, elevation: 0.1, zoom: 1.1 },
    },
    {
      id: "pericardial-cavity",
      schematic: true,
      label: "Pericardial cavity",
      shortLabel: "Pericardial cavity",
      aliases: ["pericardial space", "serous pericardial cavity"],
      tissue: "cavity",
      description:
        "Potential space between parietal and visceral serous pericardium containing a thin film of lubricating serous fluid. Pathologic fluid accumulation can restrict diastolic filling.",
      keyPoints: [
        "Rapid accumulation may cause cardiac tamponade.",
        "Pericardiocentesis accesses this space while avoiding pleura and coronary vessels.",
      ],
      difficulty: 1,
      distractorIds: ["transverse-pericardial-sinus", "oblique-pericardial-sinus", "right-atrium"],
      view: { azimuth: 0.2, elevation: 0.15, zoom: 1.05 },
    },
    {
      id: "transverse-pericardial-sinus",
      schematic: true,
      label: "Transverse pericardial sinus",
      shortLabel: "Transverse sinus",
      aliases: ["transverse sinus of pericardium"],
      tissue: "cavity",
      description:
        "Short passage within the pericardial cavity lying posterior to the ascending aorta and pulmonary trunk and anterior to the SVC and superior atrial surfaces. It is created by serous reflections around the arterial and venous poles.",
      keyPoints: [
        "Surgeons can pass a clamp or finger through it to control the great arterial outflow.",
        "It separates the arterial outflow vessels from venous inflow structures.",
      ],
      difficulty: 2,
      distractorIds: ["oblique-pericardial-sinus", "pericardial-cavity", "left-atrium"],
      view: { azimuth: 0.1, elevation: 0.5, zoom: 1.5 },
    },
    {
      id: "oblique-pericardial-sinus",
      schematic: true,
      label: "Oblique pericardial sinus",
      shortLabel: "Oblique sinus",
      aliases: ["oblique sinus of pericardium"],
      tissue: "cavity",
      description:
        "Blind recess of the pericardial cavity posterior to the left atrium, bounded by serous reflections around the pulmonary veins and IVC. Its opening faces inferiorly.",
      keyPoints: [
        "It permits some expansion of the left atrium.",
        "Unlike the transverse sinus, it is a cul-de-sac and cannot be traversed.",
      ],
      difficulty: 2,
      distractorIds: ["transverse-pericardial-sinus", "pericardial-cavity", "left-atrium"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.5 },
    },
  ],
};
