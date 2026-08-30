/**
 * REAL (mesh-backed) larynx manifest — additive prototype, NOT registered in the live app.
 *
 * Structures map 1:1 to named nodes in `/anatomy3d/respiratory/larynx-real.glb`, which is built
 * from BodyParts3D IS-A tree element meshes (Wavefront OBJ, 99% polygon-reduction release).
 *   Attribution (required, CC-BY 4.0):
 *   "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * Unlike the stylised model, the real thyroid cartilage is a SINGLE mesh, so the stylised
 * sub-parts (laryngeal-prominence, superior/inferior horns) are not separately selectable and are
 * intentionally omitted here. The vestibular (false) fold has no mesh in BodyParts3D and is omitted.
 * In exchange, the real source adds the intrinsic muscles and the vocal ligament / conus elasticus,
 * demonstrating the multi-system (cartilage / bone / muscle / membrane / ligament) layered atlas.
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const larynxRealManifest = {
  id: "resp-larynx-real",
  region: "respiratory",
  modelKey: "larynx-real",
  title: "Larynx",
  subject: "anatomy",
  blurb:
    "Anatomically-accurate human larynx reconstructed from BodyParts3D segmented meshes: the laryngeal cartilages, hyoid bone, intrinsic muscles, membranes and the vocal ligament in true anatomical relationship.",
  structures: [
    {
      id: "thyroid-cartilage",
      label: "Thyroid cartilage",
      shortLabel: "Thyroid",
      aliases: ["thyroid cartilage of larynx"],
      tissue: "cartilage",
      description:
        "The largest laryngeal cartilage, formed by two quadrilateral laminae that fuse anteriorly in the midline while remaining open posteriorly. The anterior fusion angle forms the laryngeal prominence, and the superior and inferior horns project from each posterior border.",
      keyPoints: [
        "Made of hyaline cartilage.",
        "The anterior fusion angle is more acute in males (~90°) than in females (~120°).",
        "Its posterior borders give rise to the superior and inferior horns.",
      ],
      difficulty: 1,
      distractorIds: ["cricoid-cartilage", "epiglottis", "hyoid-bone"],
      view: { azimuth: 0.3, elevation: 0.12, zoom: 1.1 },
    },
    {
      id: "cricoid-cartilage",
      label: "Cricoid cartilage",
      shortLabel: "Cricoid",
      aliases: ["cricoid"],
      tissue: "cartilage",
      description:
        "A complete signet-ring of cartilage lying below the thyroid, with a narrow anterior arch and a tall, broad posterior lamina (the 'signet'). It is the only complete cartilaginous ring of the airway.",
      keyPoints: [
        "Lies at the level of the C6 vertebra.",
        "The arch is palpable below the thyroid cartilage; the lamina faces posteriorly.",
        "Articulates above with the arytenoids and with the inferior horns of the thyroid.",
      ],
      difficulty: 1,
      distractorIds: ["thyroid-cartilage", "arytenoid-cartilage", "epiglottis"],
      view: { azimuth: 2.7, elevation: 0.12, zoom: 1.25 },
    },
    {
      id: "arytenoid-cartilage",
      label: "Arytenoid cartilage",
      shortLabel: "Arytenoid",
      aliases: ["arytenoids"],
      tissue: "cartilage",
      description:
        "Paired pyramid-shaped cartilages perched on the superior border of the cricoid lamina. Each has an anterior vocal process, to which the vocal ligament attaches, and a lateral muscular process.",
      keyPoints: [
        "The vocal process anchors the vocal ligament of the true fold.",
        "The muscular process receives the posterior and lateral cricoarytenoid muscles.",
        "They pivot and glide on the cricoid to open and close the rima glottidis.",
      ],
      difficulty: 2,
      distractorIds: ["corniculate-cartilage", "cuneiform-cartilage", "cricoid-cartilage"],
      view: { azimuth: 3.14159, elevation: 0.26, zoom: 1.7 },
    },
    {
      id: "corniculate-cartilage",
      label: "Corniculate cartilage",
      shortLabel: "Corniculate",
      aliases: ["cartilage of Santorini"],
      tissue: "cartilage",
      description:
        "Small paired nodules of elastic cartilage sitting on the apex of each arytenoid within the aryepiglottic fold, extending the arytenoid posteromedially.",
      keyPoints: ["Also called the cartilages of Santorini.", "Made of elastic cartilage."],
      difficulty: 3,
      distractorIds: ["cuneiform-cartilage", "arytenoid-cartilage", "epiglottis"],
      view: { azimuth: 3.14159, elevation: 0.36, zoom: 2.0 },
    },
    {
      id: "cuneiform-cartilage",
      label: "Cuneiform cartilage",
      shortLabel: "Cuneiform",
      aliases: ["cartilage of Wrisberg"],
      tissue: "cartilage",
      description:
        "Small paired rod-like cartilages lying in the aryepiglottic folds, anterolateral to the corniculate cartilages, where they raise small surface elevations and stiffen the fold.",
      keyPoints: [
        "Also called the cartilages of Wrisberg.",
        "Do not directly articulate with the other laryngeal cartilages.",
      ],
      difficulty: 3,
      distractorIds: ["corniculate-cartilage", "arytenoid-cartilage", "epiglottis"],
      view: { azimuth: 2.9, elevation: 0.36, zoom: 2.0 },
    },
    {
      id: "epiglottis",
      label: "Epiglottis",
      shortLabel: "Epiglottis",
      aliases: ["epiglottic cartilage"],
      tissue: "cartilage",
      description:
        "A leaf-shaped plate of elastic cartilage that projects upward behind the hyoid and tongue; its narrow lower stalk, the petiole, is attached to the back of the thyroid cartilage.",
      keyPoints: [
        "Made of elastic cartilage.",
        "Folds back to cover the laryngeal inlet during swallowing.",
        "Its stalk attaches to the thyroid via the thyroepiglottic ligament.",
      ],
      difficulty: 1,
      distractorIds: ["hyoid-bone", "thyroid-cartilage", "thyrohyoid-membrane"],
      view: { azimuth: 0.2, elevation: 0.28, zoom: 1.2 },
    },
    {
      id: "hyoid-bone",
      label: "Hyoid bone",
      shortLabel: "Hyoid",
      aliases: ["hyoid"],
      tissue: "bone",
      description:
        "A U-shaped bone suspended above the larynx, with a central body and paired greater horns sweeping posteriorly. It is the only bone in the region and articulates with no other bone.",
      keyPoints: [
        "Does not articulate with any other bone; it is slung by muscles and ligaments.",
        "Lies at the level of the C3 vertebra.",
        "Gives attachment to the thyrohyoid membrane below.",
      ],
      difficulty: 1,
      distractorIds: ["thyroid-cartilage", "epiglottis", "thyrohyoid-membrane"],
      view: { azimuth: 0.2, elevation: 0.4, zoom: 1.2 },
    },
    {
      id: "cricothyroid-muscle",
      label: "Cricothyroid muscle",
      shortLabel: "Cricothyroid m.",
      aliases: ["cricothyroid"],
      tissue: "muscle",
      description:
        "The one intrinsic laryngeal muscle visible on the external surface, running from the anterolateral arch of the cricoid upward and backward to the thyroid; it tilts the thyroid forward to tense and lengthen the vocal folds.",
      keyPoints: [
        "The only intrinsic laryngeal muscle supplied by the external laryngeal nerve; all others are supplied by the recurrent laryngeal nerve.",
        "Tenses and elongates the vocal folds, raising the pitch of the voice.",
      ],
      difficulty: 2,
      distractorIds: ["thyroarytenoid-muscle", "lateral-cricoarytenoid-muscle", "median-cricothyroid-ligament"],
      view: { azimuth: 0.5, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "thyroarytenoid-muscle",
      label: "Thyroarytenoid muscle",
      shortLabel: "Thyroarytenoid m.",
      aliases: ["thyro-arytenoid"],
      tissue: "muscle",
      description:
        "A broad, thin intrinsic muscle running from the inner surface of the thyroid angle backward to the anterolateral surface of the arytenoid; it relaxes and shortens the vocal folds and helps close the laryngeal inlet.",
      keyPoints: [
        "Supplied by the recurrent laryngeal nerve.",
        "Its deeper, finer fibres alongside the vocal ligament form the vocalis muscle.",
      ],
      difficulty: 2,
      distractorIds: ["vocalis-muscle", "cricothyroid-muscle", "lateral-cricoarytenoid-muscle"],
      view: { azimuth: 1.2, elevation: 0.1, zoom: 1.6 },
    },
    {
      id: "vocalis-muscle",
      label: "Vocalis muscle",
      shortLabel: "Vocalis",
      aliases: ["vocalis"],
      tissue: "muscle",
      description:
        "The fine medial part of the thyroarytenoid lying within the vocal fold, immediately lateral to the vocal ligament; it makes delicate local adjustments to the tension of parts of the vocal fold during phonation.",
      keyPoints: [
        "Lies inside the true vocal fold, lateral to the vocal ligament.",
        "Fine-tunes pitch by selectively tensing segments of the fold.",
      ],
      difficulty: 3,
      distractorIds: ["thyroarytenoid-muscle", "vocal-ligament", "lateral-cricoarytenoid-muscle"],
      view: { azimuth: 3.14159, elevation: 0.4, zoom: 1.9 },
    },
    {
      id: "posterior-cricoarytenoid-muscle",
      label: "Posterior cricoarytenoid muscle",
      shortLabel: "Post. cricoaryt. m.",
      aliases: ["posterior crico-arytenoid", "PCA"],
      tissue: "muscle",
      description:
        "Paired muscles on the posterior surface of the cricoid lamina passing up to the muscular process of the arytenoid; they are the ONLY abductors of the vocal folds, opening the rima glottidis for breathing.",
      keyPoints: [
        "The only muscles that ABDUCT (open) the vocal folds.",
        "Bilateral paralysis threatens the airway because the folds cannot be opened.",
      ],
      difficulty: 2,
      distractorIds: ["lateral-cricoarytenoid-muscle", "transverse-arytenoid-muscle", "oblique-arytenoid-muscle"],
      view: { azimuth: 3.14159, elevation: 0.15, zoom: 1.5 },
    },
    {
      id: "lateral-cricoarytenoid-muscle",
      label: "Lateral cricoarytenoid muscle",
      shortLabel: "Lat. cricoaryt. m.",
      aliases: ["lateral crico-arytenoid", "LCA"],
      tissue: "muscle",
      description:
        "Paired muscles running from the arch of the cricoid up and back to the muscular process of the arytenoid; they rotate the arytenoids to adduct the vocal folds and close the rima glottidis.",
      keyPoints: [
        "Adduct (close) the membranous part of the vocal folds.",
        "Antagonists of the posterior cricoarytenoids.",
      ],
      difficulty: 2,
      distractorIds: ["posterior-cricoarytenoid-muscle", "transverse-arytenoid-muscle", "cricothyroid-muscle"],
      view: { azimuth: 0.9, elevation: 0.05, zoom: 1.6 },
    },
    {
      id: "transverse-arytenoid-muscle",
      label: "Transverse arytenoid muscle",
      shortLabel: "Transverse aryt. m.",
      aliases: ["transverse arytenoid", "interarytenoid"],
      tissue: "muscle",
      description:
        "The single unpaired muscle bridging the posterior surfaces of the two arytenoid cartilages; it draws them together to close the posterior (intercartilaginous) part of the rima glottidis.",
      keyPoints: [
        "The only unpaired intrinsic laryngeal muscle.",
        "Closes the posterior part of the rima glottidis.",
      ],
      difficulty: 3,
      distractorIds: ["oblique-arytenoid-muscle", "posterior-cricoarytenoid-muscle", "lateral-cricoarytenoid-muscle"],
      view: { azimuth: 3.14159, elevation: 0.2, zoom: 1.8 },
    },
    {
      id: "oblique-arytenoid-muscle",
      label: "Oblique arytenoid muscle",
      shortLabel: "Oblique aryt. m.",
      aliases: ["oblique arytenoid"],
      tissue: "muscle",
      description:
        "Paired superficial fibres crossing between the arytenoids from the muscular process of one to the apex of the other; some continue into the aryepiglottic fold, acting as a sphincter of the laryngeal inlet.",
      keyPoints: [
        "Superficial to the transverse arytenoid.",
        "Continue as the aryepiglotticus to narrow the laryngeal inlet.",
      ],
      difficulty: 3,
      distractorIds: ["transverse-arytenoid-muscle", "posterior-cricoarytenoid-muscle", "thyroarytenoid-muscle"],
      view: { azimuth: 3.14159, elevation: 0.24, zoom: 1.8 },
    },
    {
      id: "thyrohyoid-membrane",
      label: "Thyrohyoid membrane",
      shortLabel: "Thyrohyoid membr.",
      aliases: ["hyothyroid membrane"],
      tissue: "membrane",
      description:
        "The broad fibro-elastic sheet spanning the gap between the upper border of the thyroid cartilage and the hyoid bone; it is pierced laterally by the internal laryngeal nerve and the superior laryngeal vessels.",
      keyPoints: [
        "Thickened in the midline as the median thyrohyoid ligament.",
        "Pierced by the internal laryngeal nerve and superior laryngeal artery.",
      ],
      difficulty: 2,
      distractorIds: ["median-cricothyroid-ligament", "conus-elasticus", "hyoid-bone"],
      view: { azimuth: 0.0, elevation: 0.2, zoom: 1.4 },
    },
    {
      id: "median-cricothyroid-ligament",
      label: "Median cricothyroid ligament",
      shortLabel: "Cricothyroid lig.",
      aliases: ["cricothyroid ligament"],
      tissue: "ligament",
      description:
        "The strong band bridging the anterior gap between the arch of the cricoid and the lower border of the thyroid cartilage in the midline; it is the target of an emergency cricothyrotomy.",
      keyPoints: [
        "The anterior thickening of the cricothyroid (cricovocal) membrane.",
        "The surface landmark for emergency cricothyrotomy.",
      ],
      difficulty: 2,
      distractorIds: ["thyrohyoid-membrane", "conus-elasticus", "cricothyroid-muscle"],
      view: { azimuth: 0.0, elevation: -0.05, zoom: 1.8 },
    },
    {
      id: "vocal-ligament",
      label: "Vocal ligament",
      shortLabel: "Vocal ligament",
      aliases: ["vocal cord", "vocal fold (ligament)"],
      tissue: "ligament",
      description:
        "The free, thickened upper margin of the conus elasticus, stretching from the vocal process of the arytenoid posteriorly to the thyroid angle anteriorly; it forms the structural core of the true vocal fold.",
      keyPoints: [
        "The tense band deep to the mucosa of the true vocal fold.",
        "The gap between the two vocal ligaments is the rima glottidis.",
      ],
      difficulty: 1,
      distractorIds: ["conus-elasticus", "vocalis-muscle", "thyroarytenoid-muscle"],
      view: { azimuth: 3.14159, elevation: 0.5, zoom: 1.8 },
    },
    {
      id: "conus-elasticus",
      label: "Conus elasticus",
      shortLabel: "Conus elasticus",
      aliases: ["cricovocal membrane", "cricothyroid membrane (lateral part)"],
      tissue: "membrane",
      description:
        "The elastic membrane extending upward from the upper border of the cricoid arch to the vocal ligaments; its anterior midline thickening is the median cricothyroid ligament and its free upper edge forms the vocal ligament.",
      keyPoints: [
        "Also called the cricovocal membrane.",
        "Its free upper margin is the vocal ligament; its anterior thickening is the median cricothyroid ligament.",
      ],
      difficulty: 3,
      distractorIds: ["vocal-ligament", "median-cricothyroid-ligament", "thyrohyoid-membrane"],
      view: { azimuth: 0.4, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "vagus-nerve",
      schematic: true,
      label: "Vagus nerve (CN X)",
      shortLabel: "Vagus (X)",
      aliases: ["CN X", "tenth cranial nerve", "pneumogastric nerve"],
      tissue: "nerve",
      description:
        "The vagus nerve descends through the neck within the carotid sheath, between the internal jugular vein and the common carotid artery. It gives off the superior laryngeal and recurrent laryngeal nerves that supply the larynx.",
      keyPoints: [
        "Runs in the carotid sheath between the internal jugular vein and carotid artery.",
        "Parent nerve of both the superior and recurrent laryngeal nerves.",
      ],
      difficulty: 2,
      distractorIds: ["superior-laryngeal-nerve", "recurrent-laryngeal-nerve", "superior-thyroid-artery"],
      view: { azimuth: 1.4, elevation: 0.1, zoom: 1.2 },
    },
    {
      id: "superior-laryngeal-nerve",
      schematic: true,
      label: "Superior laryngeal nerve",
      shortLabel: "Sup. laryngeal n.",
      aliases: ["SLN", "internal and external laryngeal nerves"],
      tissue: "nerve",
      description:
        "A branch of the vagus that divides into an internal laryngeal nerve — which pierces the thyrohyoid membrane to give sensation above the vocal folds — and an external laryngeal nerve, which supplies the cricothyroid muscle.",
      keyPoints: [
        "Internal branch: sensory to the larynx above the vocal folds; pierces the thyrohyoid membrane.",
        "External branch: motor to the cricothyroid muscle and at risk in thyroidectomy.",
      ],
      difficulty: 2,
      distractorIds: ["vagus-nerve", "recurrent-laryngeal-nerve", "superior-laryngeal-artery"],
      view: { azimuth: 1.2, elevation: 0.2, zoom: 1.4 },
    },
    {
      id: "recurrent-laryngeal-nerve",
      schematic: true,
      label: "Recurrent laryngeal nerve",
      shortLabel: "Recurrent laryngeal n.",
      aliases: ["RLN", "inferior laryngeal nerve"],
      tissue: "nerve",
      description:
        "The recurrent laryngeal nerve ascends in the groove between the trachea and oesophagus to enter the larynx behind the cricothyroid joint. It supplies all the intrinsic laryngeal muscles except the cricothyroid, and sensation below the vocal folds.",
      keyPoints: [
        "Motor to every intrinsic laryngeal muscle except the cricothyroid.",
        "Sensory to the larynx below the vocal folds.",
        "Closely related to the inferior thyroid artery; injured in thyroid surgery.",
      ],
      difficulty: 2,
      distractorIds: ["superior-laryngeal-nerve", "vagus-nerve", "inferior-thyroid-artery"],
      view: { azimuth: 3.0, elevation: 0.0, zoom: 1.5 },
    },
    {
      id: "superior-thyroid-artery",
      schematic: true,
      label: "Superior thyroid artery",
      shortLabel: "Sup. thyroid a.",
      aliases: ["superior thyroid"],
      tissue: "artery",
      description:
        "The first branch of the external carotid artery, descending to the upper pole of the thyroid gland. It gives off the superior laryngeal artery and accompanies the external laryngeal nerve.",
      keyPoints: [
        "First anterior branch of the external carotid artery.",
        "Ligated at the superior thyroid pole in thyroidectomy, sparing the external laryngeal nerve.",
      ],
      difficulty: 2,
      distractorIds: ["superior-laryngeal-artery", "inferior-thyroid-artery", "superior-laryngeal-nerve"],
      view: { azimuth: 0.8, elevation: 0.1, zoom: 1.3 },
    },
    {
      id: "superior-laryngeal-artery",
      schematic: true,
      label: "Superior laryngeal artery",
      shortLabel: "Sup. laryngeal a.",
      aliases: ["superior laryngeal"],
      tissue: "artery",
      description:
        "A branch of the superior thyroid artery that pierces the thyrohyoid membrane together with the internal laryngeal nerve to supply the interior of the larynx above the vocal folds.",
      keyPoints: [
        "Branch of the superior thyroid artery.",
        "Pierces the thyrohyoid membrane with the internal laryngeal nerve.",
      ],
      difficulty: 3,
      distractorIds: ["superior-thyroid-artery", "inferior-thyroid-artery", "superior-laryngeal-nerve"],
      view: { azimuth: 0.6, elevation: 0.2, zoom: 1.6 },
    },
    {
      id: "inferior-thyroid-artery",
      schematic: true,
      label: "Inferior thyroid artery",
      shortLabel: "Inf. thyroid a.",
      aliases: ["inferior thyroid"],
      tissue: "artery",
      description:
        "A branch of the thyrocervical trunk (from the subclavian artery) that ascends to the lower pole of the thyroid gland. Its inferior laryngeal branch accompanies the recurrent laryngeal nerve into the larynx.",
      keyPoints: [
        "Arises from the thyrocervical trunk of the subclavian artery.",
        "Intimately related to the recurrent laryngeal nerve at the lower thyroid pole.",
      ],
      difficulty: 2,
      distractorIds: ["superior-thyroid-artery", "superior-laryngeal-artery", "recurrent-laryngeal-nerve"],
      view: { azimuth: 0.6, elevation: -0.1, zoom: 1.4 },
    },
    {
      id: "pre-epiglottic-fat",
      schematic: true,
      label: "Pre-epiglottic fat",
      shortLabel: "Pre-epiglottic fat",
      aliases: ["pre-epiglottic space"],
      tissue: "fat",
      description:
        "The pre-epiglottic space is a wedge of fat anterior to the epiglottis, bounded by the hyoid bone, the thyrohyoid membrane and the epiglottis. It is an important route of spread for supraglottic carcinoma.",
      keyPoints: [
        "Bounded by the hyoid, the thyrohyoid membrane and the epiglottis.",
        "Its invasion upstages supraglottic laryngeal cancer.",
      ],
      difficulty: 2,
      distractorIds: ["paraglottic-fat", "epiglottis", "thyrohyoid-membrane"],
      view: { azimuth: 0.0, elevation: 0.2, zoom: 1.5 },
    },
    {
      id: "paraglottic-fat",
      schematic: true,
      label: "Paraglottic fat",
      shortLabel: "Paraglottic fat",
      aliases: ["paraglottic space"],
      tissue: "fat",
      description:
        "The paraglottic spaces are the fat-filled compartments on each side of the larynx, lateral to the laryngeal ventricle and deep to the thyroid lamina. They communicate anteriorly with the pre-epiglottic space and are important in the spread of laryngeal tumours.",
      keyPoints: [
        "Lie lateral to the ventricle, deep to the thyroid cartilage.",
        "Continuous anteriorly with the pre-epiglottic space.",
      ],
      difficulty: 3,
      distractorIds: ["pre-epiglottic-fat", "vocalis-muscle", "thyroarytenoid-muscle"],
      view: { azimuth: 1.2, elevation: 0.05, zoom: 1.5 },
    },
  ],
};
