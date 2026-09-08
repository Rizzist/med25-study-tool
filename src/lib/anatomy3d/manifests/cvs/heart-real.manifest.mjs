import { imageMeshStructures } from "../image-mesh-structures.mjs";
import { heartNerveStructures } from "./thoracic-innervation-real.manifest.mjs";

/**
 * REAL (mesh-backed) HEART manifest — CVS/Thorax region, `heart` module.
 *
 * Refines and supersedes the old heart-only `cvs` scope with the interior detail the heart lecture
 * series (A/B/C/E) emphasises, per docs/anatomy3d/regions/thorax.md (Module 2 — `heart`). The great
 * vessels have moved out to the `mediastinum` module and are NOT included here.
 *
 * 19 REAL structures map 1:1 to named nodes in `/anatomy3d/cvs/heart.glb`, range-extracted from
 * BodyParts3D PART-OF element meshes (Wavefront OBJ, 99% polygon-reduction release) using the same
 * FMA→FJ map that built the `cvs` model: the four chamber cavities, papillary muscles, the four
 * valves, the six heart-region coronary vessels (RCA, LCA, LAD, circumflex, PDA, right marginal) and
 * the four coronary veins (coronary sinus, great/middle/small cardiac vein). The 29 SCHEMATIC
 * (procedural) structures — the auricle, crista terminalis, pectinate/trabeculae/moderator apparatus,
 * the IVC & coronary-sinus valves, the septa, the smooth outflow tracts (conus/vestibule), the fibrous
 * cardiac skeleton, the external surfaces/sulci, the whole conduction system and the pericardial
 * layers & sinuses — have no separable BodyParts3D mesh and are drawn procedurally in the factory,
 * placed relative to the real-mesh bounding boxes (userData.schematic = true).
 *
 *   Attribution (required, CC-BY 4.0):
 *   "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const heartManifest = {
  id: "heart",
  region: "cvs",
  modelKey: "heart",
  title: "Heart",
  subject: "anatomy",
  blurb:
    "Anatomically-accurate human heart reconstructed from BodyParts3D segmented meshes — the four chamber cavities, valves, papillary muscles and coronary arteries & veins in true relationship — with the right-atrial and ventricular interior detail, cardiac skeleton, conduction system and pericardium added as schematic diagrammatic layers. Great vessels are studied in the mediastinum module.",
  structures: [
    // ================= Chambers, walls & internal features (17) =================
    {
      id: "right-atrium",
      label: "Right atrium",
      shortLabel: "RA",
      aliases: ["right atrial chamber", "RA"],
      tissue: "cavity",
      description:
        "Chamber forming the right heart border, receiving the SVC, IVC and coronary sinus and emptying through the tricuspid valve. Its posterior sinus venarum is smooth, whereas the anterior wall and auricle contain pectinate muscle separated from the sinus venarum by the crista terminalis.",
      keyPoints: [
        "Three venous channels (SVC, IVC, coronary sinus) open into it.",
        "The fossa ovalis lies on its septal wall.",
      ],
      difficulty: 1,
      distractorIds: ["left-atrium", "right-ventricle", "right-auricle"],
      view: { azimuth: -0.5, elevation: 0.12, zoom: 1.15 },
    },
    {
      id: "left-atrium",
      label: "Left atrium",
      shortLabel: "LA",
      aliases: ["left atrial chamber", "LA"],
      tissue: "cavity",
      description:
        "Most posterior chamber, forming most of the base of the heart and receiving the four pulmonary veins; its wall is smooth except within the auricle. It empties through the mitral valve into the left ventricle.",
      keyPoints: [
        "It lies directly anterior to the oesophagus, so dilatation can cause dysphagia.",
        "It develops mostly from absorbed pulmonary-vein tissue.",
      ],
      difficulty: 1,
      distractorIds: ["right-atrium", "left-ventricle", "base-of-heart"],
      view: { azimuth: 3.14159, elevation: 0.14, zoom: 1.2 },
    },
    {
      id: "right-ventricle",
      label: "Right ventricle",
      shortLabel: "RV",
      aliases: ["right ventricular chamber", "RV"],
      tissue: "cavity",
      description:
        "Anterior chamber forming most of the sternocostal surface; it has a trabeculated inflow and a smooth outflow (the conus arteriosus/infundibulum) leading to the pulmonary trunk. It pumps into the low-resistance pulmonary circuit.",
      keyPoints: [
        "Its wall is thin because it pumps against low pulmonary resistance.",
        "The supraventricular crest separates its inflow from its outflow.",
      ],
      difficulty: 1,
      distractorIds: ["left-ventricle", "right-atrium", "conus-arteriosus"],
      view: { azimuth: 0.15, elevation: 0.08, zoom: 1.15 },
    },
    {
      id: "left-ventricle",
      label: "Left ventricle",
      shortLabel: "LV",
      aliases: ["left ventricular chamber", "LV"],
      tissue: "cavity",
      description:
        "Thick-walled chamber forming the apex, left border and most of the diaphragmatic surface; it has a smooth superior outflow, the aortic vestibule, leading to the aortic valve. Its myocardium is roughly three times as thick as the right ventricle.",
      keyPoints: [
        "It has two papillary-muscle groups (anterolateral and posteromedial).",
        "The apex beat is normally at the left fifth intercostal space, mid-clavicular line.",
      ],
      difficulty: 1,
      distractorIds: ["right-ventricle", "left-atrium", "aortic-vestibule"],
      view: { azimuth: 0.7, elevation: 0.0, zoom: 1.2 },
    },
    {
      id: "right-auricle",
      schematic: true,
      label: "Right auricle",
      shortLabel: "Right auricle",
      aliases: ["right atrial appendage", "auricula dextra"],
      tissue: "cavity",
      description:
        "Muscular ear-shaped pouch projecting from the anterosuperior right atrium over the root of the ascending aorta, lined internally by pectinate muscle. It marks the atrial (fetal) part of the right atrium.",
      keyPoints: [
        "It overlaps the ascending aorta and is a cardiac-surgery landmark.",
        "Its pectinate lining continues from the crista terminalis.",
      ],
      difficulty: 2,
      distractorIds: ["right-atrial-pectinate-muscles", "crista-terminalis", "right-atrium"],
      view: { azimuth: -0.4, elevation: 0.35, zoom: 1.6 },
    },
    {
      id: "crista-terminalis",
      schematic: true,
      label: "Crista terminalis",
      shortLabel: "Crista terminalis",
      aliases: ["terminal crest", "crista terminalis"],
      tissue: "muscle",
      description:
        "Vertical muscular ridge inside the right atrium separating the smooth posterior sinus venarum from the trabeculated (pectinate) anterior wall. It corresponds to the external sulcus terminalis.",
      keyPoints: [
        "The sinoatrial node lies at its superior end.",
        "It is the internal landmark matching the external sulcus terminalis.",
      ],
      difficulty: 2,
      distractorIds: ["right-atrial-pectinate-muscles", "right-auricle", "interatrial-septum"],
      view: { azimuth: -0.6, elevation: 0.15, zoom: 1.7 },
    },
    {
      id: "right-atrial-pectinate-muscles",
      schematic: true,
      label: "Right atrial pectinate muscles",
      shortLabel: "Pectinate mm.",
      aliases: ["musculi pectinati", "pectinate muscle"],
      tissue: "muscle",
      description:
        "Comb-like muscular ridges fanning from the crista terminalis through the right auricle and the anterior right-atrial wall. They are confined anterior to the crista terminalis.",
      keyPoints: [
        "They are confined to the region anterior to the crista terminalis.",
        "In the left atrium, pectinate muscle is restricted to the auricle.",
      ],
      difficulty: 2,
      distractorIds: ["crista-terminalis", "right-auricle", "trabeculae-carneae"],
      view: { azimuth: -0.6, elevation: 0.15, zoom: 1.7 },
    },
    {
      id: "valve-of-inferior-vena-cava",
      schematic: true,
      label: "Valve of the inferior vena cava",
      shortLabel: "Valve of IVC",
      aliases: ["Eustachian valve", "valve of IVC"],
      tissue: "membrane",
      description:
        "Rudimentary crescentic fold at the orifice of the inferior vena cava in the right atrium. In the adult it is a non-functional remnant.",
      keyPoints: [
        "In the fetus it directed IVC blood toward the foramen ovale.",
        "It is a non-functional remnant in the adult.",
      ],
      difficulty: 3,
      distractorIds: ["valve-of-coronary-sinus", "interatrial-septum", "crista-terminalis"],
      view: { azimuth: -0.3, elevation: -0.35, zoom: 1.8 },
    },
    {
      id: "valve-of-coronary-sinus",
      schematic: true,
      label: "Valve of the coronary sinus",
      shortLabel: "Valve of CS",
      aliases: ["Thebesian valve", "valve of coronary sinus"],
      tissue: "membrane",
      description:
        "Small semicircular fold guarding the ostium of the coronary sinus as it opens into the right atrium between the IVC orifice and the tricuspid valve.",
      keyPoints: [
        "The coronary-sinus ostium is a landmark of the triangle of Koch, near the AV node.",
        "It marks the venous drainage of the myocardium into the right atrium.",
      ],
      difficulty: 3,
      distractorIds: ["valve-of-inferior-vena-cava", "coronary-sinus", "interatrial-septum"],
      view: { azimuth: -0.2, elevation: -0.3, zoom: 1.9 },
    },
    {
      id: "interatrial-septum",
      schematic: true,
      label: "Interatrial septum & fossa ovalis",
      shortLabel: "Atrial septum",
      aliases: ["atrial septum", "fossa ovalis", "limbus"],
      tissue: "muscle",
      description:
        "Partition between the atria whose thin central fossa ovalis, bordered by the limbus, is the remnant of the fetal foramen ovale. The fossa is best seen from the right atrium.",
      keyPoints: [
        "A probe-patent foramen ovale occurs in more than 10% of people and is usually silent.",
        "Larger defects of the fossa are atrial septal defects (ASD).",
      ],
      difficulty: 2,
      distractorIds: ["interventricular-septum", "crista-terminalis", "valve-of-inferior-vena-cava"],
      view: { azimuth: 2.7, elevation: 0.1, zoom: 1.5 },
    },
    {
      id: "interventricular-septum",
      schematic: true,
      label: "Interventricular septum",
      shortLabel: "IV septum",
      aliases: ["ventricular septum", "membranous septum", "IVS"],
      tissue: "muscle",
      description:
        "Oblique partition between the ventricles with a large muscular part and a small superior membranous part; its right surface bulges into the right ventricle because left ventricular pressure is higher.",
      keyPoints: [
        "The membranous part is the commonest site of a ventricular septal defect.",
        "The AV bundle traverses the membranous septum before dividing.",
      ],
      difficulty: 2,
      distractorIds: ["interatrial-septum", "trabeculae-carneae", "septomarginal-trabecula"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "trabeculae-carneae",
      schematic: true,
      label: "Trabeculae carneae",
      shortLabel: "Trabeculae carneae",
      aliases: ["fleshy trabeculae", "trabeculae carneae"],
      tissue: "muscle",
      description:
        "Muscular ridges and bridges lining the ventricular walls in three forms — ridges, bridges and papillary muscles. They are more numerous in the left ventricle.",
      keyPoints: [
        "They are more numerous in the left ventricle.",
        "The moderator band is a specialised bridging trabecula.",
      ],
      difficulty: 2,
      distractorIds: ["septomarginal-trabecula", "papillary-muscles", "right-atrial-pectinate-muscles"],
      view: { azimuth: 0.4, elevation: -0.15, zoom: 1.5 },
    },
    {
      id: "septomarginal-trabecula",
      schematic: true,
      label: "Septomarginal trabecula",
      shortLabel: "Moderator band",
      aliases: ["moderator band", "trabecula septomarginalis"],
      tissue: "muscle",
      description:
        "Muscular bridge crossing the right-ventricular cavity from the interventricular septum to the base of the anterior papillary muscle. It carries the right bundle branch toward that muscle.",
      keyPoints: [
        "It conveys the right bundle branch to the anterior papillary muscle.",
        "It helps prevent right-ventricular over-distension.",
      ],
      difficulty: 2,
      distractorIds: ["trabeculae-carneae", "papillary-muscles", "right-bundle-branch"],
      view: { azimuth: 0.3, elevation: -0.1, zoom: 1.6 },
    },
    {
      id: "conus-arteriosus",
      schematic: true,
      label: "Conus arteriosus (infundibulum)",
      shortLabel: "Conus arteriosus",
      aliases: ["infundibulum", "conus arteriosus"],
      tissue: "cavity",
      description:
        "Smooth-walled, cone-shaped superior outflow of the right ventricle leading to the pulmonary valve and trunk. It is separated from the trabeculated inflow by the supraventricular crest.",
      keyPoints: [
        "Smooth outflow versus trabeculated inflow.",
        "Separated from the inflow by the supraventricular crest.",
      ],
      difficulty: 2,
      distractorIds: ["right-ventricle", "aortic-vestibule", "pulmonary-valve"],
      view: { azimuth: 0.2, elevation: 0.4, zoom: 1.6 },
    },
    {
      id: "papillary-muscles",
      label: "Papillary muscles",
      shortLabel: "Papillary mm.",
      aliases: ["ventricular papillary muscles"],
      tissue: "muscle",
      description:
        "Conical myocardial projections anchoring the AV-valve cusps via chordae tendineae — anterior, posterior and septal on the right; anterolateral and posteromedial on the left. They tense in systole to prevent cusp prolapse.",
      keyPoints: [
        "They stabilise the closed cusps but do not pull the valves open.",
        "The posteromedial LV muscle has a single-source supply, making it infarct-prone.",
      ],
      difficulty: 2,
      distractorIds: ["trabeculae-carneae", "septomarginal-trabecula", "chordae-tendineae"],
      view: { azimuth: 0.5, elevation: -0.2, zoom: 1.5 },
    },
    {
      id: "chordae-tendineae",
      schematic: true,
      label: "Chordae tendineae",
      shortLabel: "Chordae",
      aliases: ["tendinous cords", "heart strings"],
      tissue: "ligament",
      description:
        "Fine fibrous cords joining papillary-muscle apices to the free margins of the tricuspid and mitral cusps; each muscle sends cords to two adjacent cusps. They prevent cusp eversion in systole.",
      keyPoints: [
        "They prevent cusp eversion during ventricular systole.",
        "They are absent from the semilunar valves.",
      ],
      difficulty: 2,
      distractorIds: ["papillary-muscles", "tricuspid-valve", "mitral-valve"],
      view: { azimuth: 0.4, elevation: -0.15, zoom: 1.6 },
    },
    {
      id: "aortic-vestibule",
      schematic: true,
      label: "Aortic vestibule",
      shortLabel: "Aortic vestibule",
      aliases: ["LV outflow tract", "aortic vestibule"],
      tissue: "cavity",
      description:
        "Smooth, fibrous-walled superior outflow region of the left ventricle immediately below the aortic valve. Its wall is fibrous (not muscular) and is continuous with the anterior mitral leaflet.",
      keyPoints: [
        "Its wall is fibrous, continuous with the anterior mitral leaflet.",
        "It leads to the aortic opening.",
      ],
      difficulty: 2,
      distractorIds: ["conus-arteriosus", "left-ventricle", "aortic-valve"],
      view: { azimuth: 0.0, elevation: 0.4, zoom: 1.6 },
    },
    // ===================== Valves & fibrous skeleton (5) ========================
    {
      id: "tricuspid-valve",
      label: "Tricuspid valve",
      shortLabel: "Tricuspid",
      aliases: ["right atrioventricular valve", "right AV valve"],
      tissue: "membrane",
      description:
        "Right atrioventricular valve with anterior, posterior and septal cusps on a fibrous annulus, tethered to right-ventricular papillary muscles by chordae tendineae.",
      keyPoints: [
        "Auscultated at the left lower sternal border.",
        "The septal cusp abuts the membranous septum and AV conduction tissue.",
      ],
      difficulty: 1,
      distractorIds: ["mitral-valve", "pulmonary-valve", "aortic-valve"],
      view: { azimuth: -0.4, elevation: 0.6, zoom: 1.6 },
    },
    {
      id: "pulmonary-valve",
      label: "Pulmonary valve",
      shortLabel: "Pulmonary",
      aliases: ["pulmonic valve", "valve of pulmonary trunk"],
      tissue: "membrane",
      description:
        "Semilunar valve at the right-ventricular outflow into the pulmonary trunk, with anterior, right and left cusps (each with a nodule and lunule) and no chordae. It is the most anterior cardiac valve.",
      keyPoints: [
        "It is the most anterior cardiac valve; auscultated at the left second space.",
        "Cusp positions rotate between the fetus and adult.",
      ],
      difficulty: 1,
      distractorIds: ["aortic-valve", "tricuspid-valve", "conus-arteriosus"],
      view: { azimuth: 0.2, elevation: 0.7, zoom: 1.6 },
    },
    {
      id: "mitral-valve",
      label: "Mitral valve",
      shortLabel: "Mitral",
      aliases: ["bicuspid valve", "left atrioventricular valve", "left AV valve"],
      tissue: "membrane",
      description:
        "Left atrioventricular valve with anterior and (smaller) posterior leaflets on a fibrous annulus, tethered by chordae to two papillary-muscle groups. Its anterior leaflet is continuous with the aortic fibrous curtain.",
      keyPoints: [
        "Auscultated at the cardiac apex.",
        "Its anterior leaflet is continuous with the aortic fibrous curtain.",
      ],
      difficulty: 1,
      distractorIds: ["tricuspid-valve", "aortic-valve", "pulmonary-valve"],
      view: { azimuth: 2.8, elevation: 0.6, zoom: 1.6 },
    },
    {
      id: "aortic-valve",
      label: "Aortic valve",
      shortLabel: "Aortic",
      aliases: ["aortic semilunar valve"],
      tissue: "membrane",
      description:
        "Semilunar valve between the left ventricle and ascending aorta, with right-coronary, left-coronary and non-coronary cusps and matching aortic sinuses. The right and left coronary arteries arise from the two coronary sinuses.",
      keyPoints: [
        "The coronary arteries arise from the right and left aortic sinuses.",
        "Auscultated at the right second intercostal space.",
      ],
      difficulty: 1,
      distractorIds: ["pulmonary-valve", "mitral-valve", "tricuspid-valve"],
      view: { azimuth: 0.0, elevation: 0.6, zoom: 1.6 },
    },
    {
      id: "cardiac-skeleton",
      schematic: true,
      label: "Fibrous cardiac skeleton",
      shortLabel: "Cardiac skeleton",
      aliases: ["fibrous rings", "right fibrous trigone", "left fibrous trigone"],
      tissue: "ligament",
      description:
        "Four fibrous rings (two atrioventricular, aortic and pulmonary) joined by the right and left fibrous trigones, anchoring the valve cusps and the atrial and ventricular myocardium. It electrically insulates the atria from the ventricles.",
      keyPoints: [
        "Only the AV bundle crosses it, insulating atria from ventricles.",
        "It maintains valve-orifice integrity.",
      ],
      difficulty: 2,
      distractorIds: ["interventricular-septum", "mitral-valve", "aortic-valve"],
      view: { azimuth: 0.1, elevation: 0.75, zoom: 1.5 },
    },
    // =================== External surfaces, borders & sulci (5) =================
    {
      id: "cardiac-apex",
      schematic: true,
      label: "Apex of the heart",
      shortLabel: "Apex",
      aliases: ["cardiac apex", "apex cordis"],
      tissue: "cavity",
      description:
        "Blunt inferolateral tip of the heart formed by the left ventricle, pointing down, forward and to the left toward the left fifth intercostal space near the mid-clavicular line.",
      keyPoints: [
        "It is the surface site of the apex beat.",
        "It is formed by the left ventricle.",
      ],
      difficulty: 1,
      distractorIds: ["base-of-heart", "diaphragmatic-surface", "sternocostal-surface"],
      view: { azimuth: 0.7, elevation: -0.3, zoom: 1.5 },
    },
    {
      id: "base-of-heart",
      schematic: true,
      label: "Base of the heart",
      shortLabel: "Base",
      aliases: ["posterior surface of heart", "base of heart"],
      tissue: "cavity",
      description:
        "Posterior aspect of the heart formed mainly by the left atrium (with a little right atrium), receiving the pulmonary veins and facing the oesophagus and descending aorta at T5–T8.",
      keyPoints: [
        "It faces posteriorly toward the T5–T8 vertebrae.",
        "Left-atrial enlargement here can compress the oesophagus.",
      ],
      difficulty: 2,
      distractorIds: ["cardiac-apex", "diaphragmatic-surface", "left-atrium"],
      view: { azimuth: 3.14159, elevation: 0.1, zoom: 1.35 },
    },
    {
      id: "sternocostal-surface",
      schematic: true,
      label: "Sternocostal (anterior) surface",
      shortLabel: "Sternocostal surface",
      aliases: ["anterior surface of heart", "sternocostal surface"],
      tissue: "cavity",
      description:
        "Anterior surface of the heart facing the sternum and ribs, formed mostly by the right ventricle with the right atrium and a strip of left ventricle, and crossed by the coronary and anterior interventricular sulci.",
      keyPoints: [
        "The right ventricle sits directly behind the sternum.",
        "It is crossed by the coronary and anterior interventricular sulci.",
      ],
      difficulty: 2,
      distractorIds: ["diaphragmatic-surface", "base-of-heart", "cardiac-apex"],
      view: { azimuth: 0.1, elevation: 0.1, zoom: 1.25 },
    },
    {
      id: "diaphragmatic-surface",
      schematic: true,
      label: "Diaphragmatic (inferior) surface",
      shortLabel: "Diaphragmatic surface",
      aliases: ["inferior surface of heart", "diaphragmatic surface"],
      tissue: "cavity",
      description:
        "Inferior surface of the heart resting on the central tendon of the diaphragm, formed mainly by the left ventricle and part of the right, and bearing the posterior interventricular sulcus and coronary sinus.",
      keyPoints: [
        "It bears the posterior interventricular sulcus and coronary sinus.",
        "It sits on the diaphragm.",
      ],
      difficulty: 2,
      distractorIds: ["sternocostal-surface", "base-of-heart", "cardiac-apex"],
      view: { azimuth: 0.2, elevation: -0.6, zoom: 1.35 },
    },
    {
      id: "coronary-sulcus",
      schematic: true,
      label: "Coronary & interventricular sulci",
      shortLabel: "Cardiac sulci",
      aliases: ["AV groove", "atrioventricular groove", "interventricular grooves"],
      tissue: "cavity",
      description:
        "Surface grooves marking the internal partitions: the coronary (atrioventricular) sulcus encircling the heart between atria and ventricles, and the anterior and posterior interventricular sulci over the septum. They carry the coronary vessels.",
      keyPoints: [
        "They carry the RCA, LAD, circumflex artery and coronary sinus.",
        "The crux is where the AV and posterior interventricular sulci meet.",
      ],
      difficulty: 2,
      distractorIds: ["sternocostal-surface", "right-coronary-artery", "anterior-interventricular-artery"],
      view: { azimuth: 0.1, elevation: 0.1, zoom: 1.15 },
    },
    // ========================= Coronary vessels (10) ============================
    {
      id: "right-coronary-artery",
      label: "Right coronary artery",
      shortLabel: "RCA",
      aliases: ["RCA"],
      tissue: "artery",
      description:
        "Arises from the right aortic sinus and runs in the right atrioventricular groove toward the crux, supplying much of the right heart. In right dominance it gives the posterior interventricular artery.",
      keyPoints: [
        "It usually supplies the SA and AV nodes.",
        "It gives the posterior interventricular artery in right dominance.",
      ],
      difficulty: 1,
      distractorIds: ["left-coronary-artery", "circumflex-artery", "right-marginal-artery"],
      view: { azimuth: -0.6, elevation: 0.15, zoom: 1.4 },
    },
    {
      id: "left-coronary-artery",
      label: "Left coronary artery",
      shortLabel: "LCA",
      aliases: ["LCA", "left main", "LMCA"],
      tissue: "artery",
      description:
        "Short trunk from the left aortic sinus passing between the pulmonary trunk and left auricle before dividing into the anterior interventricular and circumflex branches. It supplies most of the LA, LV and septum.",
      keyPoints: [
        "Left-main occlusion threatens a large myocardial territory.",
        "It usually bifurcates into the LAD and circumflex arteries.",
      ],
      difficulty: 1,
      distractorIds: ["right-coronary-artery", "anterior-interventricular-artery", "circumflex-artery"],
      view: { azimuth: 0.3, elevation: 0.35, zoom: 1.5 },
    },
    {
      id: "anterior-interventricular-artery",
      label: "Anterior interventricular artery",
      shortLabel: "LAD",
      aliases: ["left anterior descending artery", "LAD", "anterior descending artery"],
      tissue: "artery",
      description:
        "Descends the anterior interventricular sulcus with the great cardiac vein toward the apex, supplying the anterior walls and the anterior two-thirds of the interventricular septum.",
      keyPoints: [
        "A common, clinically important site of coronary occlusion.",
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
        "Curves left in the atrioventricular groove beneath the left auricle onto the posterior heart, supplying the left atrium and the lateral and posterior left ventricle. Obtuse marginal branches run on the LV margin.",
      keyPoints: [
        "It gives the posterior interventricular artery in left dominance.",
        "Obtuse marginal branches run on the left-ventricular margin.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-interventricular-artery", "right-coronary-artery", "posterior-interventricular-artery"],
      view: { azimuth: 1.5, elevation: 0.1, zoom: 1.4 },
    },
    {
      id: "posterior-interventricular-artery",
      label: "Posterior interventricular artery",
      shortLabel: "PDA",
      aliases: ["posterior descending artery", "PDA"],
      tissue: "artery",
      description:
        "Runs the posterior interventricular sulcus with the middle cardiac vein toward the apex; usually a branch of the RCA. Its origin defines coronary dominance.",
      keyPoints: [
        "Its origin defines right versus left coronary dominance.",
        "It supplies the posterior one-third of the interventricular septum.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-interventricular-artery", "right-marginal-artery", "circumflex-artery"],
      view: { azimuth: 3.14159, elevation: -0.25, zoom: 1.4 },
    },
    {
      id: "right-marginal-artery",
      label: "Right marginal artery",
      shortLabel: "Right marginal",
      aliases: ["acute marginal artery", "marginal branch of RCA"],
      tissue: "artery",
      description:
        "Branch of the RCA running along the acute margin toward the apex, chiefly supplying the right-ventricular free wall.",
      keyPoints: [
        "Its size and exact origin vary.",
        "Distinct from the left obtuse marginal branches of the circumflex.",
      ],
      difficulty: 2,
      distractorIds: ["right-coronary-artery", "posterior-interventricular-artery", "anterior-interventricular-artery"],
      view: { azimuth: -0.9, elevation: 0.0, zoom: 1.45 },
    },
    {
      id: "coronary-sinus",
      label: "Coronary sinus",
      shortLabel: "Coronary sinus",
      aliases: ["sinus coronarius"],
      tissue: "vein",
      description:
        "Wide venous channel in the posterior atrioventricular groove receiving the main cardiac veins and opening into the right atrium between the IVC orifice and the tricuspid valve. It is the principal venous drainage of the myocardium.",
      keyPoints: [
        "It is the principal venous drainage of the myocardium.",
        "Its ostium lies at the base of the triangle of Koch.",
      ],
      difficulty: 1,
      distractorIds: ["great-cardiac-vein", "middle-cardiac-vein", "valve-of-coronary-sinus"],
      view: { azimuth: 3.14159, elevation: -0.2, zoom: 1.4 },
    },
    {
      id: "great-cardiac-vein",
      label: "Great cardiac vein",
      shortLabel: "Great cardiac v.",
      aliases: ["anterior interventricular vein"],
      tissue: "vein",
      description:
        "Ascends the anterior interventricular sulcus with the LAD, then curves in the left atrioventricular groove to become the coronary sinus. It drains the left coronary territory.",
      keyPoints: [
        "It drains the left coronary artery territory.",
        "It becomes the coronary sinus at the left AV groove.",
      ],
      difficulty: 2,
      distractorIds: ["coronary-sinus", "middle-cardiac-vein", "small-cardiac-vein"],
      view: { azimuth: 0.2, elevation: 0.1, zoom: 1.4 },
    },
    {
      id: "middle-cardiac-vein",
      label: "Middle cardiac vein",
      shortLabel: "Middle cardiac v.",
      aliases: ["posterior interventricular vein"],
      tissue: "vein",
      description:
        "Ascends the posterior interventricular sulcus with the posterior interventricular artery to reach the coronary sinus near its termination. It drains the diaphragmatic surface and posterior septum.",
      keyPoints: [
        "It runs with the posterior interventricular (PDA) artery.",
        "It drains the diaphragmatic surface and posterior septum.",
      ],
      difficulty: 2,
      distractorIds: ["great-cardiac-vein", "small-cardiac-vein", "coronary-sinus"],
      view: { azimuth: 3.14159, elevation: -0.25, zoom: 1.4 },
    },
    {
      id: "small-cardiac-vein",
      label: "Small cardiac vein & venae cordis minimae",
      shortLabel: "Small cardiac v.",
      aliases: ["smallest cardiac veins", "venae cordis minimae"],
      tissue: "vein",
      description:
        "Small vein running with the right marginal artery and RCA in the right atrioventricular groove to the coronary sinus, together with the tiny venae cordis minimae that open directly into the chambers.",
      keyPoints: [
        "The venae cordis minimae drain myocardium straight into the right atrium.",
        "It is variable and may open directly into the right atrium.",
      ],
      difficulty: 3,
      distractorIds: ["middle-cardiac-vein", "great-cardiac-vein", "coronary-sinus"],
      view: { azimuth: -0.7, elevation: 0.05, zoom: 1.45 },
    },
    // ========================= Conduction system (5) ============================
    {
      id: "sinoatrial-node",
      schematic: true,
      label: "Sinoatrial node",
      shortLabel: "SA node",
      aliases: ["SA node", "sinus node", "pacemaker"],
      tissue: "muscle",
      description:
        "A ~10×4 mm focus of specialised myocardium at the SVC–right-atrial junction, at the superior end of the crista terminalis. It is the normal pacemaker of the heart.",
      keyPoints: [
        "It is the normal pacemaker of the heart.",
        "It is usually supplied by the right coronary artery.",
      ],
      difficulty: 1,
      distractorIds: ["atrioventricular-node", "atrioventricular-bundle", "crista-terminalis"],
      view: { azimuth: -0.5, elevation: 0.45, zoom: 1.8 },
    },
    {
      id: "atrioventricular-node",
      schematic: true,
      label: "Atrioventricular node",
      shortLabel: "AV node",
      aliases: ["AV node", "node of Tawara"],
      tissue: "muscle",
      description:
        "A ~5×3 mm node in the lower interatrial septum near the coronary-sinus ostium and septal tricuspid cusp (the triangle of Koch). It delays conduction to allow ventricular filling.",
      keyPoints: [
        "The conduction delay permits ventricular filling.",
        "Its arterial branch usually comes from the dominant coronary artery.",
      ],
      difficulty: 2,
      distractorIds: ["sinoatrial-node", "atrioventricular-bundle", "right-bundle-branch"],
      view: { azimuth: 2.8, elevation: -0.1, zoom: 1.8 },
    },
    {
      id: "atrioventricular-bundle",
      schematic: true,
      label: "Atrioventricular bundle",
      shortLabel: "Bundle of His",
      aliases: ["bundle of His", "AV bundle", "His bundle"],
      tissue: "muscle",
      description:
        "Tract leaving the AV node, piercing the fibrous skeleton and running along the membranous septum before dividing into the right and left bundle branches. It is the only normal electrical link across the cardiac skeleton.",
      keyPoints: [
        "It is the only normal electrical connection across the cardiac skeleton.",
        "Damage produces complete heart block.",
      ],
      difficulty: 2,
      distractorIds: ["atrioventricular-node", "right-bundle-branch", "left-bundle-branch"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.7 },
    },
    {
      id: "right-bundle-branch",
      schematic: true,
      label: "Right bundle branch",
      shortLabel: "RBB",
      aliases: ["right crus of AV bundle", "RBB"],
      tissue: "muscle",
      description:
        "Runs down the right side of the interventricular septum, part traversing the moderator band, and ends in a subendocardial Purkinje network in the right ventricle.",
      keyPoints: [
        "Its moderator-band relationship is a classic identification point.",
        "It ends as Purkinje fibres.",
      ],
      difficulty: 2,
      distractorIds: ["left-bundle-branch", "atrioventricular-bundle", "septomarginal-trabecula"],
      view: { azimuth: 0.3, elevation: -0.05, zoom: 1.7 },
    },
    {
      id: "left-bundle-branch",
      schematic: true,
      label: "Left bundle branch",
      shortLabel: "LBB",
      aliases: ["left crus of AV bundle", "LBB"],
      tissue: "muscle",
      description:
        "Broad branch descending the left septal surface, dividing into anterior and posterior fascicles and a subendocardial Purkinje network. It is broader and branches earlier than the right bundle branch.",
      keyPoints: [
        "It is broader and branches earlier than the right bundle branch.",
        "Its fascicles feed the subendocardial Purkinje network.",
      ],
      difficulty: 2,
      distractorIds: ["right-bundle-branch", "atrioventricular-bundle", "atrioventricular-node"],
      view: { azimuth: 0.6, elevation: -0.05, zoom: 1.7 },
    },
    // ============================ Pericardium (6) ===============================
    {
      id: "fibrous-pericardium",
      schematic: true,
      label: "Fibrous pericardium",
      shortLabel: "Fibrous pericardium",
      aliases: ["fibrous sac", "fibrous pericardial sac"],
      tissue: "membrane",
      description:
        "Tough, inelastic conical outer sac enclosing the heart and great-vessel roots, fused below to the central tendon of the diaphragm and blending above with great-vessel adventitia.",
      keyPoints: [
        "It is innervated by the phrenic nerves (pain refers to C3–C5 dermatomes).",
        "Being inelastic, rapid effusion into it is dangerous.",
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
        "Serous layer lining the fibrous pericardium, reflected around the great-vessel roots to become the visceral layer. It is separated from the visceral layer by the pericardial cavity.",
      keyPoints: [
        "It is adherent to the fibrous pericardium.",
        "Its phrenic sensory supply refers pain to the shoulder.",
      ],
      difficulty: 2,
      distractorIds: ["visceral-serous-pericardium", "fibrous-pericardium", "pericardial-cavity"],
      view: { azimuth: 0.2, elevation: 0.18, zoom: 1.05 },
    },
    {
      id: "visceral-serous-pericardium",
      schematic: true,
      label: "Visceral serous pericardium (epicardium)",
      shortLabel: "Epicardium",
      aliases: ["epicardium", "visceral pericardium", "visceral layer"],
      tissue: "membrane",
      description:
        "Serous layer adherent to the heart surface — the outer histological layer of the heart wall — overlying the subepicardial coronary vessels and fat. It equals the epicardium.",
      keyPoints: [
        "It is relatively insensitive to pain (autonomic supply).",
        "It is the epicardium, the outer layer of the heart wall.",
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
        "Potential space between the serous layers holding a thin film of fluid. The anterior bare area / cardiac dullness is the safe access point for pericardiocentesis.",
      keyPoints: [
        "Rapid filling causes cardiac tamponade and biventricular failure.",
        "Pericardiocentesis via the bare area avoids pleura and lung.",
      ],
      difficulty: 1,
      distractorIds: ["transverse-pericardial-sinus", "oblique-pericardial-sinus", "fibrous-pericardium"],
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
        "Passage within the pericardial cavity behind the ascending aorta and pulmonary trunk and in front of the SVC and atria, created by the serous reflections around the arterial and venous poles.",
      keyPoints: [
        "A finger or clamp can pass through it to control the arterial outflow.",
        "It separates the arterial from the venous poles of the heart.",
      ],
      difficulty: 2,
      distractorIds: ["oblique-pericardial-sinus", "pericardial-cavity", "base-of-heart"],
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
        "Blind cul-de-sac of the pericardial cavity behind the left atrium, bounded by the serous reflections around the pulmonary veins and IVC, opening inferiorly.",
      keyPoints: [
        "It allows left-atrial expansion but cannot be traversed.",
        "It admits a hand behind the heart at surgery.",
      ],
      difficulty: 2,
      distractorIds: ["transverse-pericardial-sinus", "pericardial-cavity", "base-of-heart"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.5 },
    },
    ...heartNerveStructures,
    ...imageMeshStructures("heart"),
  ],
};
