import { imageMeshStructures } from "../image-mesh-structures.mjs";
import { mediastinalNerveStructures } from "./thoracic-innervation-real.manifest.mjs";

/**
 * REAL (mesh-backed) MEDIASTINUM manifest — part of the CVS/Thorax region.
 *
 * The 19 REAL structures map 1:1 to named nodes in `/anatomy3d/cvs/mediastinum.glb`, built from
 * BodyParts3D PART-OF element meshes (Wavefront OBJ, 99% polygon-reduction release): the arterial
 * great vessels (ascending/arch/descending thoracic aorta + the three arch branches, pulmonary
 * trunk & pulmonary arteries), the systemic veins (SVC, IVC, right & left brachiocephalic veins,
 * pulmonary veins), and the visceral tubes/organs (trachea, right & left main bronchi, oesophagus,
 * thymus). The great-vessel FMA→element map is reused from the `cvs` heart build.
 *
 * The 13 SCHEMATIC (procedural) structures — the four mediastinal divisions, the ligamentum
 * arteriosum & aortopulmonary window, the azygos/hemiazygos/accessory-hemiazygos & left superior
 * intercostal veins, the carina, the oesophageal constrictions and the thoracic duct — have no
 * separable BodyParts3D mesh and are drawn procedurally in the factory, placed relative to the
 * real-mesh bounding boxes (userData.schematic = true, manifest schematic: true).
 *
 *   Attribution (required, CC-BY 4.0):
 *   "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const mediastinumManifest = {
  id: "mediastinum",
  region: "cvs",
  modelKey: "mediastinum",
  title: "Mediastinum & great vessels",
  subject: "anatomy",
  blurb:
    "The mediastinum reconstructed from BodyParts3D segmented meshes: the arterial and venous great vessels (aorta and its arch branches, pulmonary trunk and arteries, SVC/IVC, brachiocephalic and pulmonary veins), the visceral tubes (trachea, carina, main bronchi, oesophagus) and the thymus in true relationship, with the mediastinal divisions, azygos venous system, ligamentum arteriosum, aortopulmonary window and thoracic duct added as schematic diagrammatic layers.",
  structures: [
    // ---- Mediastinal divisions (4) — all schematic ----------------------------------
    {
      id: "superior-mediastinum",
      schematic: true,
      label: "Superior mediastinum",
      shortLabel: "Superior",
      tissue: "cavity",
      description:
        "Region above the sternal-angle plane (T4/T5), containing the aortic arch and its branches, the brachiocephalic veins and upper SVC, the trachea, oesophagus, thymus, vagus and phrenic nerves, and the thoracic duct.",
      keyPoints: [
        "Bounded below by the sternal-angle (transverse thoracic) plane.",
        "The left recurrent laryngeal nerve is a content here; the right is not.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-mediastinum", "middle-mediastinum", "posterior-mediastinum"],
      view: { azimuth: 0.2, elevation: 0.4, zoom: 0.95 },
    },
    {
      id: "anterior-mediastinum",
      schematic: true,
      label: "Anterior mediastinum",
      shortLabel: "Anterior",
      tissue: "cavity",
      description:
        "Narrow space between the sternal body and the pericardium below the sternal-angle plane; it contains the inferior thymus, fat and the sternopericardial ligaments.",
      keyPoints: [
        "The smallest of the inferior subdivisions.",
        "A common site of thymic remnants and pathology.",
      ],
      difficulty: 2,
      distractorIds: ["middle-mediastinum", "posterior-mediastinum", "superior-mediastinum"],
      view: { azimuth: 0.1, elevation: 0.1, zoom: 1.0 },
    },
    {
      id: "middle-mediastinum",
      schematic: true,
      label: "Middle mediastinum",
      shortLabel: "Middle",
      tissue: "cavity",
      description:
        "Central inferior compartment containing the heart, pericardium, roots of the great vessels, the main bronchi and the phrenic nerves.",
      keyPoints: [
        "Contains the heart and pericardium (covered in the heart module).",
        "The phrenic nerves run on its lateral walls.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-mediastinum", "posterior-mediastinum", "superior-mediastinum"],
      view: { azimuth: 0.2, elevation: 0.05, zoom: 1.0 },
    },
    {
      id: "posterior-mediastinum",
      schematic: true,
      label: "Posterior mediastinum",
      shortLabel: "Posterior",
      tissue: "cavity",
      description:
        "Compartment behind the pericardium containing the descending thoracic aorta, the oesophagus and its plexus, the azygos and hemiazygos veins, the thoracic duct and the splanchnic nerves.",
      keyPoints: [
        "The descending aorta, oesophagus and thoracic duct run together here.",
        "The azygos vein ascends on its right side.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-mediastinum", "middle-mediastinum", "superior-mediastinum"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.0 },
    },
    // ---- Arteries & arterial great vessels (11) -------------------------------------
    {
      id: "ascending-aorta",
      label: "Ascending aorta",
      shortLabel: "Asc. aorta",
      aliases: ["proximal aorta"],
      tissue: "artery",
      description:
        "Intrapericardial aorta (~5 cm) rising from the left ventricle behind the pulmonary trunk to the right of the sternum, becoming the arch at the right 2nd sternocostal joint; its root bears the aortic sinuses.",
      keyPoints: [
        "Its only branches are the coronary arteries.",
        "Dissection here can cause tamponade or coronary compromise.",
      ],
      difficulty: 1,
      distractorIds: ["arch-of-aorta", "descending-thoracic-aorta", "pulmonary-trunk"],
      view: { azimuth: 0.1, elevation: 0.25, zoom: 1.3 },
    },
    {
      id: "arch-of-aorta",
      label: "Arch of the aorta",
      shortLabel: "Aortic arch",
      aliases: ["aortic arch"],
      tissue: "artery",
      description:
        "Curves posterosuperiorly and to the left over the left main bronchus, from the right side of the sternal angle to the left of the T4/T5 disc, giving three branches.",
      keyPoints: [
        "Branch order: brachiocephalic trunk, left common carotid, then left subclavian.",
        "The ligamentum arteriosum and left recurrent laryngeal nerve hook beneath it (aortopulmonary window).",
      ],
      difficulty: 1,
      distractorIds: ["ascending-aorta", "descending-thoracic-aorta", "brachiocephalic-trunk"],
      view: { azimuth: 0.0, elevation: 0.5, zoom: 1.2 },
    },
    {
      id: "brachiocephalic-trunk",
      label: "Brachiocephalic trunk",
      shortLabel: "Brachiocephalic",
      aliases: ["innominate artery", "brachiocephalic artery"],
      tissue: "artery",
      description:
        "First and largest arch branch, ascending behind the manubrium to the right sternoclavicular joint where it divides into the right common carotid and right subclavian arteries.",
      keyPoints: [
        "Exists only on the right.",
        "May give off the thyroidea ima artery.",
      ],
      difficulty: 1,
      distractorIds: ["left-common-carotid-artery", "left-subclavian-artery", "arch-of-aorta"],
      view: { azimuth: 0.15, elevation: 0.55, zoom: 1.4 },
    },
    {
      id: "left-common-carotid-artery",
      label: "Left common carotid artery",
      shortLabel: "Left CCA",
      aliases: ["left CCA"],
      tissue: "artery",
      description:
        "Second arch branch, ascending through the superior mediastinum into the neck to the left of the trachea; it has no thoracic branches.",
      keyPoints: [
        "Arises directly from the arch (unlike the right common carotid).",
        "Lies anterior then lateral to the trachea.",
      ],
      difficulty: 2,
      distractorIds: ["brachiocephalic-trunk", "left-subclavian-artery", "arch-of-aorta"],
      view: { azimuth: 0.3, elevation: 0.6, zoom: 1.5 },
    },
    {
      id: "left-subclavian-artery",
      label: "Left subclavian artery",
      shortLabel: "Left subclavian",
      aliases: ["left subclavian"],
      tissue: "artery",
      description:
        "Third and most posterior arch branch, ascending toward the neck and grooving the mediastinal surface of the left lung; it gives the internal thoracic artery and the costocervical trunk.",
      keyPoints: [
        "Coarctation is classically distal to its origin.",
        "Source of the internal thoracic and (via the costocervical trunk) the supreme intercostal arteries.",
      ],
      difficulty: 2,
      distractorIds: ["left-common-carotid-artery", "brachiocephalic-trunk", "descending-thoracic-aorta"],
      view: { azimuth: 0.6, elevation: 0.5, zoom: 1.3 },
    },
    {
      id: "ligamentum-arteriosum",
      schematic: true,
      label: "Ligamentum arteriosum",
      shortLabel: "Lig. arteriosum",
      tissue: "ligament",
      description:
        "Fibrous remnant of the ductus arteriosus linking the aortic arch/isthmus to the bifurcation of the pulmonary trunk / left pulmonary artery.",
      keyPoints: [
        "The left recurrent laryngeal nerve hooks under the arch just lateral to it.",
        "It marks the aortopulmonary window.",
      ],
      difficulty: 2,
      distractorIds: ["arch-of-aorta", "pulmonary-trunk", "aortopulmonary-window"],
      view: { azimuth: 0.4, elevation: 0.2, zoom: 1.8 },
    },
    {
      id: "descending-thoracic-aorta",
      label: "Descending thoracic aorta",
      shortLabel: "Desc. aorta",
      aliases: ["thoracic aorta", "descending aorta"],
      tissue: "artery",
      description:
        "Continuation of the arch from the T4/T5 disc down the posterior mediastinum (left, then midline, of the vertebral bodies) to the aortic hiatus at T12; it gives posterior intercostal, bronchial, oesophageal, pericardial and superior phrenic branches.",
      keyPoints: [
        "Passes behind the root of the left lung and the left atrium.",
        "The lower nine pairs of posterior intercostal arteries arise from it.",
      ],
      difficulty: 1,
      distractorIds: ["arch-of-aorta", "ascending-aorta", "azygos-vein"],
      view: { azimuth: 3.14159, elevation: 0.0, zoom: 1.2 },
    },
    {
      id: "pulmonary-trunk",
      label: "Pulmonary trunk",
      shortLabel: "Pulmonary trunk",
      aliases: ["main pulmonary artery"],
      tissue: "artery",
      description:
        "Intrapericardial vessel from the right ventricle, passing up and to the left of the ascending aorta and bifurcating at the sternal-angle plane into the right and left pulmonary arteries.",
      keyPoints: [
        "Carries deoxygenated blood.",
        "The ligamentum arteriosum tethers its bifurcation to the aortic arch.",
      ],
      difficulty: 1,
      distractorIds: ["ascending-aorta", "right-pulmonary-artery", "left-pulmonary-artery"],
      view: { azimuth: 0.1, elevation: 0.25, zoom: 1.35 },
    },
    {
      id: "right-pulmonary-artery",
      label: "Right pulmonary artery",
      shortLabel: "RPA",
      aliases: ["RPA"],
      tissue: "artery",
      description:
        "Longer branch passing to the right behind the ascending aorta and SVC and anterior to the right main bronchus, to the right lung root.",
      keyPoints: [
        "At the hilum it lies anterior to the bronchus (RALS: Right-Anterior).",
        "Longer than the left pulmonary artery.",
      ],
      difficulty: 2,
      distractorIds: ["left-pulmonary-artery", "pulmonary-trunk", "pulmonary-veins"],
      view: { azimuth: -0.7, elevation: 0.25, zoom: 1.4 },
    },
    {
      id: "left-pulmonary-artery",
      label: "Left pulmonary artery",
      shortLabel: "LPA",
      aliases: ["LPA"],
      tissue: "artery",
      description:
        "Shorter branch passing to the left, anterior to the descending aorta and superior to the left main bronchus, to the left lung root.",
      keyPoints: [
        "At the hilum it lies superior to the bronchus (RALS: Left-Superior).",
        "The ligamentum arteriosum attaches near its origin.",
      ],
      difficulty: 2,
      distractorIds: ["right-pulmonary-artery", "pulmonary-trunk", "pulmonary-veins"],
      view: { azimuth: 0.7, elevation: 0.25, zoom: 1.4 },
    },
    {
      id: "aortopulmonary-window",
      schematic: true,
      label: "Aortopulmonary window",
      shortLabel: "AP window",
      aliases: ["AP window"],
      tissue: "cavity",
      description:
        "Space between the inferior aortic arch and the pulmonary bifurcation, traversed by the left recurrent laryngeal nerve and mediastinal lymph nodes.",
      keyPoints: [
        "Nodal masses here compress the left recurrent laryngeal nerve, causing hoarseness.",
        "It appears as a radiological 'window' on a frontal chest film.",
      ],
      difficulty: 3,
      distractorIds: ["ligamentum-arteriosum", "arch-of-aorta", "pulmonary-trunk"],
      view: { azimuth: 0.3, elevation: 0.3, zoom: 1.8 },
    },
    // ---- Venous great vessels & azygos system (9) -----------------------------------
    {
      id: "superior-vena-cava",
      label: "Superior vena cava",
      shortLabel: "SVC",
      aliases: ["SVC"],
      tissue: "vein",
      description:
        "Valveless vein formed behind the right 1st costal cartilage by the two brachiocephalic veins, descending to the right atrium behind the 3rd right cartilage; the azygos vein joins it before it pierces the pericardium.",
      keyPoints: [
        "Drains everything above the diaphragm except the heart and lungs.",
        "Its lower half lies within the fibrous pericardium.",
      ],
      difficulty: 1,
      distractorIds: ["inferior-vena-cava", "right-brachiocephalic-vein", "azygos-vein"],
      view: { azimuth: -0.4, elevation: 0.35, zoom: 1.4 },
    },
    {
      id: "right-brachiocephalic-vein",
      label: "Right brachiocephalic vein",
      shortLabel: "Right BCV",
      aliases: ["right innominate vein"],
      tissue: "vein",
      description:
        "Short vein formed behind the right sternoclavicular joint by the right internal jugular and subclavian veins, descending almost vertically to join its fellow.",
      keyPoints: [
        "Shorter and more vertical than the left brachiocephalic vein.",
        "Receives right vertebral, internal thoracic and (often) 1st posterior intercostal veins.",
      ],
      difficulty: 2,
      distractorIds: ["left-brachiocephalic-vein", "superior-vena-cava", "left-superior-intercostal-vein"],
      view: { azimuth: -0.6, elevation: 0.45, zoom: 1.4 },
    },
    {
      id: "left-brachiocephalic-vein",
      label: "Left brachiocephalic vein",
      shortLabel: "Left BCV",
      aliases: ["left innominate vein"],
      tissue: "vein",
      description:
        "Longer vein crossing behind the manubrium from left to right to join the right brachiocephalic vein; it receives both inferior thyroid veins and the left superior intercostal vein.",
      keyPoints: [
        "It can rise above the manubrium in children (a tracheostomy hazard).",
        "Crosses anterior to the three aortic arch branches.",
      ],
      difficulty: 2,
      distractorIds: ["right-brachiocephalic-vein", "superior-vena-cava", "left-superior-intercostal-vein"],
      view: { azimuth: 0.2, elevation: 0.5, zoom: 1.4 },
    },
    {
      id: "inferior-vena-cava",
      label: "Inferior vena cava (thoracic part)",
      shortLabel: "IVC",
      aliases: ["IVC"],
      tissue: "vein",
      description:
        "Enters through the caval opening in the central tendon (T8) for a very short intrapericardial course into the right atrium.",
      keyPoints: [
        "Pierces the diaphragm at T8 with the right phrenic nerve.",
        "It has almost no thoracic tributaries.",
      ],
      difficulty: 1,
      distractorIds: ["superior-vena-cava", "azygos-vein", "pulmonary-veins"],
      view: { azimuth: -0.3, elevation: -0.3, zoom: 1.4 },
    },
    {
      id: "pulmonary-veins",
      label: "Pulmonary veins",
      shortLabel: "Pulmonary veins",
      aliases: ["superior & inferior pulmonary veins"],
      tissue: "vein",
      description:
        "Usually four valveless veins (a superior and inferior on each side) returning oxygenated blood to the posterior left atrium.",
      keyPoints: [
        "They carry oxygenated blood despite being veins.",
        "The right veins pass behind the SVC and right atrium.",
      ],
      difficulty: 1,
      distractorIds: ["superior-vena-cava", "azygos-vein", "left-pulmonary-artery"],
      view: { azimuth: 3.14159, elevation: 0.1, zoom: 1.4 },
    },
    {
      id: "azygos-vein",
      schematic: true,
      label: "Azygos vein",
      shortLabel: "Azygos",
      tissue: "vein",
      description:
        "Formed near L1-L2 (from the right ascending lumbar and right subcostal veins), it enters through the aortic hiatus and ascends on the right of the vertebral bodies, arching over the right lung root at T4 into the SVC.",
      keyPoints: [
        "Receives the right posterior intercostal veins and the hemiazygos veins.",
        "A key caval-caval / porto-caval venous collateral.",
      ],
      difficulty: 2,
      distractorIds: ["hemiazygos-vein", "accessory-hemiazygos-vein", "superior-vena-cava"],
      view: { azimuth: -0.8, elevation: 0.1, zoom: 1.3 },
    },
    {
      id: "hemiazygos-vein",
      schematic: true,
      label: "Hemiazygos vein",
      shortLabel: "Hemiazygos",
      tissue: "vein",
      description:
        "Left-sided vein from the left ascending lumbar/subcostal veins, ascending to about T9 where it crosses the midline to join the azygos; it drains the lower left (9th-11th) posterior intercostal veins.",
      keyPoints: [
        "Crosses behind the aorta, oesophagus and thoracic duct at about T8-T9.",
        "Mirrors the lower azygos vein on the left.",
      ],
      difficulty: 2,
      distractorIds: ["accessory-hemiazygos-vein", "azygos-vein", "left-superior-intercostal-vein"],
      view: { azimuth: 2.6, elevation: 0.0, zoom: 1.4 },
    },
    {
      id: "accessory-hemiazygos-vein",
      schematic: true,
      label: "Accessory hemiazygos vein",
      shortLabel: "Acc. hemiazygos",
      tissue: "vein",
      description:
        "Descends on the left of the upper thoracic bodies draining the 4th-8th left posterior intercostal veins, crossing at about T7-T8 to the azygos vein.",
      keyPoints: [
        "Drains the mid-left posterior intercostal veins.",
        "May communicate with the left superior intercostal vein.",
      ],
      difficulty: 3,
      distractorIds: ["hemiazygos-vein", "azygos-vein", "left-superior-intercostal-vein"],
      view: { azimuth: 2.6, elevation: 0.15, zoom: 1.5 },
    },
    {
      id: "left-superior-intercostal-vein",
      schematic: true,
      label: "Left superior intercostal vein",
      shortLabel: "L. sup. intercostal v.",
      tissue: "vein",
      description:
        "Common trunk draining the upper (1st-3rd) left posterior intercostal veins, crossing the aortic arch to end in the left brachiocephalic vein.",
      keyPoints: [
        "Runs across the aortic arch, between the phrenic and vagus nerves.",
        "Drains the upper-left posterior intercostal veins.",
      ],
      difficulty: 3,
      distractorIds: ["accessory-hemiazygos-vein", "hemiazygos-vein", "left-brachiocephalic-vein"],
      view: { azimuth: 2.2, elevation: 0.4, zoom: 1.7 },
    },
    // ---- Visceral tubes, thymus & thoracic duct (8) ---------------------------------
    {
      id: "trachea",
      label: "Trachea",
      shortLabel: "Trachea",
      aliases: ["windpipe"],
      tissue: "cartilage",
      description:
        "Midline airway from about C6 to the sternal-angle plane, held open by C-shaped cartilage rings; it deviates slightly to the right around the aortic arch.",
      keyPoints: [
        "Bifurcates at the carina (about T4/T5, the sternal angle).",
        "The aortic arch and left brachiocephalic vein are anterior relations.",
      ],
      difficulty: 1,
      distractorIds: ["carina", "oesophagus", "right-main-bronchus"],
      view: { azimuth: 0.0, elevation: 0.35, zoom: 1.2 },
    },
    {
      id: "carina",
      schematic: true,
      label: "Carina",
      shortLabel: "Carina",
      aliases: ["tracheal bifurcation"],
      tissue: "cartilage",
      description:
        "Keel-shaped cartilage at the tracheal bifurcation between the two main bronchi; a sensitive cough landmark.",
      keyPoints: [
        "Sits at the sternal-angle plane (about T4/T5).",
        "Widened or distorted by subcarinal nodal disease.",
      ],
      difficulty: 2,
      distractorIds: ["trachea", "right-main-bronchus", "left-main-bronchus"],
      view: { azimuth: 0.0, elevation: 0.1, zoom: 1.8 },
    },
    {
      id: "right-main-bronchus",
      label: "Right main bronchus",
      shortLabel: "Right bronchus",
      aliases: ["right primary bronchus"],
      tissue: "cartilage",
      description:
        "Wider, shorter and more vertical main bronchus to the right lung, passing below the arch of the azygos vein.",
      keyPoints: [
        "More vertical, so inhaled foreign bodies tend to lodge here.",
        "The right pulmonary artery lies anterior to it at the hilum.",
      ],
      difficulty: 1,
      distractorIds: ["left-main-bronchus", "carina", "trachea"],
      view: { azimuth: -0.5, elevation: 0.1, zoom: 1.5 },
    },
    {
      id: "left-main-bronchus",
      label: "Left main bronchus",
      shortLabel: "Left bronchus",
      aliases: ["left primary bronchus"],
      tissue: "cartilage",
      description:
        "Narrower, longer and more horizontal main bronchus passing below the aortic arch and anterior to the descending aorta to the left hilum.",
      keyPoints: [
        "Longer and more transverse than the right.",
        "Passes under the arch (related to the left pulmonary artery and ligamentum arteriosum).",
      ],
      difficulty: 1,
      distractorIds: ["right-main-bronchus", "carina", "trachea"],
      view: { azimuth: 0.5, elevation: 0.1, zoom: 1.5 },
    },
    {
      id: "oesophagus",
      label: "Oesophagus",
      shortLabel: "Oesophagus",
      aliases: ["esophagus"],
      tissue: "muscle",
      description:
        "Muscular tube descending behind the trachea and left atrium through the posterior mediastinum to the oesophageal hiatus (T10); related to the aorta, azygos vein and vagal plexus.",
      keyPoints: [
        "Left-atrial enlargement or an aortic aneurysm can compress it.",
        "Passes the hiatus at T10 with the vagal trunks.",
      ],
      difficulty: 1,
      distractorIds: ["trachea", "descending-thoracic-aorta", "thoracic-duct"],
      view: { azimuth: 3.14159, elevation: 0.05, zoom: 1.25 },
    },
    {
      id: "oesophageal-constrictions",
      schematic: true,
      label: "Oesophageal constrictions",
      shortLabel: "Constrictions",
      aliases: ["anatomical narrowings"],
      tissue: "muscle",
      description:
        "The physiological narrowings where the oesophagus is compressed: cervical (cricopharyngeus), by the aortic arch, by the left main bronchus, and at the diaphragmatic hiatus.",
      keyPoints: [
        "Common sites of foreign-body impaction and stricture.",
        "Landmarks for measuring endoscopy distances.",
      ],
      difficulty: 3,
      distractorIds: ["oesophagus", "arch-of-aorta", "left-main-bronchus"],
      view: { azimuth: 3.0, elevation: 0.1, zoom: 1.3 },
    },
    {
      id: "thymus",
      label: "Thymus",
      shortLabel: "Thymus",
      aliases: ["thymic gland"],
      tissue: "gland",
      description:
        "Bilobed lymphoid gland in the superior/anterior mediastinum behind the manubrium, large in the child and fatty-involuted in the adult; supplied by thymic branches of the internal thoracic artery.",
      keyPoints: [
        "Overlies the great vessels and pericardium.",
        "Site of T-cell maturation; involutes after puberty.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-mediastinum", "left-brachiocephalic-vein", "thoracic-duct"],
      view: { azimuth: 0.05, elevation: 0.2, zoom: 1.4 },
    },
    {
      id: "thoracic-duct",
      schematic: true,
      label: "Thoracic duct",
      shortLabel: "Thoracic duct",
      tissue: "vein",
      description:
        "The main lymphatic channel, ascending from the cisterna chyli through the aortic hiatus (T12), between the azygos vein and the descending aorta, crossing to the left at about T4/T5 to drain into the left venous angle.",
      keyPoints: [
        "Drains all of the body except the right upper quadrant.",
        "Injury to it causes a chylothorax.",
      ],
      difficulty: 2,
      distractorIds: ["azygos-vein", "descending-thoracic-aorta", "oesophagus"],
      view: { azimuth: 2.8, elevation: 0.1, zoom: 1.4 },
    },
    ...mediastinalNerveStructures,
    ...imageMeshStructures("mediastinum"),
  ],
};
