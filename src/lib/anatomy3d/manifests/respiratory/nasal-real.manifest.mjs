/**
 * REAL (mesh-backed) + PROCEDURAL nasal / paranasal manifest — additive prototype, NOT registered.
 *
 * Real meshes from BodyParts3D (CC-BY 4.0), served in `nasal-real.glb`: nasal bones, septal +
 * lateral nasal cartilage, vomer, ethmoid, and the inferior nasal concha.
 *   Attribution: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
 *
 * BodyParts3D models solids only, so the paranasal AIR SPACES (frontal / maxillary / sphenoid
 * sinuses, ethmoidal air cells), the three meatuses, the superior + middle conchae (parts of the
 * ethmoid it does not separate), the hard palate and the choanae have NO mesh. Those are added
 * PROCEDURALLY in the factory (userData.schematic = true), reusing the stylised nasal shapes and
 * placed from the real nasal bounding box. Structure IDs match the stylised `nasal` manifest so
 * quiz progress stays aligned; vomer, ethmoid-bone and lateral-nasal-cartilage are new real parts.
 * (The whole maxilla and sphenoid bones are available in BodyParts3D but omitted — at ~93 mm and
 * ~111 mm wide they would triple the model and make the nasal cavity unreadable; their sinuses are
 * represented procedurally instead.)
 *
 * @type {import("../../types").AnatomyModuleManifest}
 */
export const nasalRealManifest = {
  id: "resp-nasal-real",
  region: "respiratory",
  modelKey: "nasal-real",
  title: "Nasal cavity & paranasal sinuses",
  subject: "anatomy",
  blurb:
    "The bony and cartilaginous nasal skeleton from BodyParts3D — nasal bones, septal cartilage, vomer, ethmoid and inferior concha — with the conchae, meatuses and paranasal sinuses overlaid as schematic air spaces.",
  structures: [
    {
      id: "nasal-bone",
      label: "Nasal bones",
      shortLabel: "Nasal bone",
      aliases: ["nasal bone", "bones of the nose"],
      tissue: "bone",
      description:
        "The paired nasal bones are small rectangular bones that meet in the midline to form the bridge (dorsum) of the nose. They lie superiorly and anteriorly, between the frontal processes of the maxillae.",
      keyPoints: [
        "Articulate superiorly with the frontal bone and laterally with the maxillae.",
        "Their lower borders attach the lateral (upper) nasal cartilages that form the mobile nose.",
      ],
      difficulty: 1,
      distractorIds: ["hard-palate", "nasal-septum", "frontal-sinus"],
      view: { azimuth: 0.2, elevation: 0.35, zoom: 1.6 },
    },
    {
      id: "nasal-septum",
      label: "Nasal septum (septal cartilage)",
      shortLabel: "Septum",
      aliases: ["septum of nose", "septal cartilage", "nasal septum"],
      tissue: "cartilage",
      description:
        "The nasal septum is the midline partition dividing the nasal cavity into right and left halves. Its anterior part, shown here, is the septal cartilage; posteriorly it is completed by the perpendicular plate of the ethmoid above and the vomer below.",
      keyPoints: [
        "Lies in the midsagittal plane, separating the two nasal cavities.",
        "Deviation of the septum is a common cause of unilateral nasal obstruction.",
      ],
      difficulty: 1,
      distractorIds: ["vomer", "lateral-nasal-cartilage", "middle-concha"],
      view: { azimuth: 1.15, elevation: 0.08, zoom: 1.15 },
    },
    {
      id: "lateral-nasal-cartilage",
      label: "Lateral nasal cartilage",
      shortLabel: "Lat. nasal cart.",
      aliases: ["upper lateral cartilage", "lateral cartilage of nose"],
      tissue: "cartilage",
      description:
        "The paired lateral (upper) nasal cartilages form the middle third of the external nose, extending from the lower border of the nasal bones down toward the alar cartilages. They are continuous in the midline with the septal cartilage.",
      keyPoints: [
        "Continuous superiorly with the nasal bones and medially with the septal cartilage.",
        "Help keep the nasal vestibule patent during inspiration.",
      ],
      difficulty: 3,
      distractorIds: ["nasal-septum", "nasal-bone", "inferior-concha"],
      view: { azimuth: 0.25, elevation: 0.05, zoom: 1.7 },
    },
    {
      id: "vomer",
      label: "Vomer",
      shortLabel: "Vomer",
      aliases: ["vomer bone"],
      tissue: "bone",
      description:
        "The vomer is a thin, flat, plough-shaped midline bone that forms the posteroinferior part of the bony nasal septum. It articulates above with the sphenoid and the perpendicular plate of the ethmoid, and below with the nasal crests of the maxillae and palatine bones.",
      keyPoints: [
        "Forms the posteroinferior bony nasal septum.",
        "Its posterior free border separates the two choanae.",
      ],
      difficulty: 2,
      distractorIds: ["nasal-septum", "ethmoid-bone", "hard-palate"],
      view: { azimuth: 1.2, elevation: 0.0, zoom: 1.3 },
    },
    {
      id: "ethmoid-bone",
      label: "Ethmoid bone",
      shortLabel: "Ethmoid",
      aliases: ["ethmoid"],
      tissue: "bone",
      description:
        "The ethmoid is a light, cubical midline bone lying between the orbits. It contributes the cribriform plate (roof), the perpendicular plate (upper septum), the superior and middle conchae, and the ethmoidal air cells, forming much of the roof and lateral walls of the nasal cavity.",
      keyPoints: [
        "Gives rise to the superior and middle nasal conchae.",
        "Its cribriform plate transmits the olfactory nerve filaments into the cranial cavity.",
      ],
      difficulty: 2,
      distractorIds: ["vomer", "middle-concha", "sphenoid-sinus"],
      view: { azimuth: 0.3, elevation: 0.22, zoom: 1.4 },
    },
    {
      id: "superior-concha",
      schematic: true,
      label: "Superior nasal concha",
      shortLabel: "Sup. concha",
      aliases: ["superior turbinate", "superior concha"],
      tissue: "bone",
      description:
        "The superior nasal concha is the smallest and highest scroll-like shelf projecting from the lateral wall of the nasal cavity. It is a process of the ethmoid bone and overhangs the superior meatus.",
      keyPoints: [
        "A projection of the ethmoid bone.",
        "The sphenoethmoidal recess, which receives the sphenoid sinus, lies above and behind it.",
      ],
      difficulty: 3,
      distractorIds: ["middle-concha", "inferior-concha", "superior-meatus"],
      view: { azimuth: 0.35, elevation: 0.26, zoom: 1.7 },
    },
    {
      id: "middle-concha",
      schematic: true,
      label: "Middle nasal concha",
      shortLabel: "Mid. concha",
      aliases: ["middle turbinate", "middle concha"],
      tissue: "bone",
      description:
        "The middle nasal concha is a scroll-like shelf of the ethmoid bone projecting from the lateral wall between the superior and inferior conchae. It overhangs and shelters the middle meatus.",
      keyPoints: [
        "Part of the ethmoid bone.",
        "The middle meatus beneath it receives drainage from most of the paranasal sinuses.",
      ],
      difficulty: 2,
      distractorIds: ["superior-concha", "inferior-concha", "middle-meatus"],
      view: { azimuth: 0.35, elevation: 0.1, zoom: 1.55 },
    },
    {
      id: "inferior-concha",
      label: "Inferior nasal concha",
      shortLabel: "Inf. concha",
      aliases: ["inferior turbinate", "inferior concha"],
      tissue: "bone",
      description:
        "The inferior nasal concha is the largest and lowest scroll-like shelf on the lateral wall of the nasal cavity. Unlike the other two it is a separate bone in its own right, and it overhangs the inferior meatus.",
      keyPoints: [
        "A separate (independent) bone, not a process of the ethmoid.",
        "The nasolacrimal duct opens into the inferior meatus beneath it.",
      ],
      difficulty: 2,
      distractorIds: ["middle-concha", "superior-concha", "inferior-meatus"],
      view: { azimuth: 0.35, elevation: -0.02, zoom: 1.5 },
    },
    {
      id: "superior-meatus",
      schematic: true,
      label: "Superior meatus",
      shortLabel: "Sup. meatus",
      aliases: ["superior nasal meatus"],
      tissue: "cavity",
      description:
        "The superior meatus is the air passage of the lateral wall lying beneath the superior concha. The posterior ethmoidal air cells open into it.",
      keyPoints: [
        "Receives the posterior ethmoidal air cells.",
        "Lies between the superior and middle conchae.",
      ],
      difficulty: 3,
      distractorIds: ["middle-meatus", "inferior-meatus", "superior-concha"],
      view: { azimuth: 0.4, elevation: 0.2, zoom: 1.75 },
    },
    {
      id: "middle-meatus",
      schematic: true,
      label: "Middle meatus",
      shortLabel: "Mid. meatus",
      aliases: ["middle nasal meatus"],
      tissue: "cavity",
      description:
        "The middle meatus is the air passage beneath the middle concha. Through the hiatus semilunaris and ethmoidal bulla it receives the frontal, maxillary and anterior ethmoidal sinuses.",
      keyPoints: [
        "Drains the frontal, maxillary and anterior ethmoidal sinuses.",
        "Contains the ethmoidal bulla and the hiatus semilunaris.",
      ],
      difficulty: 2,
      distractorIds: ["superior-meatus", "inferior-meatus", "middle-concha"],
      view: { azimuth: 0.4, elevation: 0.05, zoom: 1.65 },
    },
    {
      id: "inferior-meatus",
      schematic: true,
      label: "Inferior meatus",
      shortLabel: "Inf. meatus",
      aliases: ["inferior nasal meatus"],
      tissue: "cavity",
      description:
        "The inferior meatus is the air passage beneath the inferior concha and is the largest of the three meatuses. The nasolacrimal duct opens into its anterior part.",
      keyPoints: [
        "Receives the nasolacrimal duct, which drains tears from the eye.",
        "Largest of the three nasal meatuses.",
      ],
      difficulty: 2,
      distractorIds: ["middle-meatus", "superior-meatus", "inferior-concha"],
      view: { azimuth: 0.4, elevation: -0.08, zoom: 1.6 },
    },
    {
      id: "frontal-sinus",
      schematic: true,
      label: "Frontal sinus",
      shortLabel: "Frontal sinus",
      aliases: ["frontal air sinus"],
      tissue: "cavity",
      description:
        "The frontal sinus is a paranasal air cavity within the frontal bone, above the medial ends of the orbits. It drains into the middle meatus through the frontonasal duct.",
      keyPoints: [
        "Lies above the orbits within the frontal bone.",
        "Drains into the middle meatus.",
      ],
      difficulty: 1,
      distractorIds: ["ethmoidal-air-cells", "sphenoid-sinus", "maxillary-sinus"],
      view: { azimuth: 0.15, elevation: 0.4, zoom: 1.55 },
    },
    {
      id: "maxillary-sinus",
      schematic: true,
      label: "Maxillary sinus",
      shortLabel: "Maxillary sinus",
      aliases: ["antrum of Highmore", "maxillary antrum"],
      tissue: "cavity",
      description:
        "The maxillary sinus is the largest paranasal sinus, a pyramidal air cavity that occupies the body of the maxilla lateral to the nasal cavity. It drains into the middle meatus, and its ostium lies high on its medial wall.",
      keyPoints: [
        "Largest of the paranasal sinuses; paired.",
        "Its high ostium drains poorly, predisposing it to sinusitis.",
        "Its floor is related to the roots of the upper molar and premolar teeth.",
      ],
      difficulty: 1,
      distractorIds: ["frontal-sinus", "sphenoid-sinus", "ethmoidal-air-cells"],
      view: { azimuth: 0.3, elevation: -0.05, zoom: 1.35 },
    },
    {
      id: "ethmoidal-air-cells",
      schematic: true,
      label: "Ethmoidal air cells",
      shortLabel: "Ethmoid cells",
      aliases: ["ethmoidal sinuses", "ethmoid air cells"],
      tissue: "cavity",
      description:
        "The ethmoidal air cells are a variable cluster of small, thin-walled air spaces within the ethmoid bone, lying between the upper nasal cavity and the orbit. They are grouped as anterior, middle and posterior cells.",
      keyPoints: [
        "Separated from the orbit only by the paper-thin lamina papyracea.",
        "Anterior and middle cells drain to the middle meatus; posterior cells to the superior meatus.",
      ],
      difficulty: 2,
      distractorIds: ["sphenoid-sinus", "frontal-sinus", "maxillary-sinus"],
      view: { azimuth: 0.2, elevation: 0.28, zoom: 1.7 },
    },
    {
      id: "sphenoid-sinus",
      schematic: true,
      label: "Sphenoid sinus",
      shortLabel: "Sphenoid sinus",
      aliases: ["sphenoidal sinus", "sphenoidal air sinus"],
      tissue: "cavity",
      description:
        "The sphenoid sinus is a paranasal air cavity within the body of the sphenoid bone, lying deep and posterior in the nasal region. It drains into the sphenoethmoidal recess above the superior concha.",
      keyPoints: [
        "Lies posteriorly within the sphenoid body, below the pituitary fossa (sella turcica).",
        "The trans-sphenoidal surgical route to the pituitary gland passes through it.",
      ],
      difficulty: 2,
      distractorIds: ["ethmoidal-air-cells", "frontal-sinus", "choanae"],
      view: { azimuth: 3.14159, elevation: 0.12, zoom: 1.6 },
    },
    {
      id: "hard-palate",
      schematic: true,
      label: "Hard palate",
      shortLabel: "Hard palate",
      aliases: ["bony palate"],
      tissue: "bone",
      description:
        "The hard palate is the horizontal bony plate that forms the floor of the nasal cavity and the roof of the oral cavity. It is built from the palatine processes of the maxillae and the horizontal plates of the palatine bones.",
      keyPoints: [
        "Separates the nasal cavity above from the oral cavity below.",
        "Formed by the maxillae anteriorly and the palatine bones posteriorly.",
      ],
      difficulty: 1,
      distractorIds: ["nasal-septum", "inferior-concha", "nasal-bone"],
      view: { azimuth: 0.25, elevation: -0.32, zoom: 1.4 },
    },
    {
      id: "choanae",
      schematic: true,
      label: "Choanae",
      shortLabel: "Choanae",
      aliases: ["posterior nasal apertures", "posterior nasal aperture"],
      tissue: "cavity",
      description:
        "The choanae are the paired posterior nasal apertures through which the nasal cavities open into the nasopharynx. Each is bounded medially by the vomer, laterally by the medial pterygoid plate and inferiorly by the horizontal plate of the palatine bone.",
      keyPoints: [
        "Open posteriorly into the nasopharynx.",
        "Congenital choanal atresia causes neonatal airway obstruction.",
      ],
      difficulty: 2,
      distractorIds: ["sphenoid-sinus", "inferior-meatus", "hard-palate"],
      view: { azimuth: 3.14159, elevation: -0.05, zoom: 1.5 },
    },
    {
      id: "nasopalatine-nerve",
      schematic: true,
      label: "Nasopalatine nerve",
      shortLabel: "Nasopalatine n.",
      aliases: ["long sphenopalatine nerve"],
      tissue: "nerve",
      description:
        "The nasopalatine nerve enters the nasal cavity at the sphenopalatine foramen and runs antero-inferiorly across the roof and down the nasal septum to the incisive canal, supplying the septal mucosa and the anterior hard palate.",
      keyPoints: [
        "A branch of the maxillary nerve (CN V2) relayed through the pterygopalatine ganglion.",
        "Runs on the septum and passes through the incisive foramen to the anterior palate.",
      ],
      difficulty: 3,
      distractorIds: ["anterior-ethmoidal-nerve", "olfactory-nerve", "sphenopalatine-artery"],
      view: { azimuth: 1.2, elevation: 0.0, zoom: 1.4 },
    },
    {
      id: "anterior-ethmoidal-nerve",
      schematic: true,
      label: "Anterior ethmoidal nerve",
      shortLabel: "Ant. ethmoidal n.",
      aliases: ["anterior ethmoidal branch"],
      tissue: "nerve",
      description:
        "The anterior ethmoidal nerve, a branch of the nasociliary nerve (CN V1), enters the nasal cavity through the cribriform region and supplies the anterosuperior nasal mucosa before emerging as the external nasal nerve on the dorsum of the nose.",
      keyPoints: [
        "Branch of the nasociliary nerve (ophthalmic division, CN V1).",
        "Supplies the anterosuperior nasal cavity and the skin over the nasal tip.",
      ],
      difficulty: 3,
      distractorIds: ["nasopalatine-nerve", "olfactory-nerve", "anterior-ethmoidal-artery"],
      view: { azimuth: 0.3, elevation: 0.3, zoom: 1.5 },
    },
    {
      id: "olfactory-nerve",
      schematic: true,
      label: "Olfactory nerve (CN I)",
      shortLabel: "Olfactory (I)",
      aliases: ["CN I", "first cranial nerve", "olfactory fila"],
      tissue: "nerve",
      description:
        "The olfactory nerve is formed by ~15–20 bundles of fine fibres (fila olfactoria) that arise from receptors in the olfactory epithelium of the roof and pass upward through the cribriform plate of the ethmoid to the olfactory bulb.",
      keyPoints: [
        "The special sensory nerve of smell.",
        "Its fila pass through the cribriform plate; fractures there cause anosmia and CSF rhinorrhoea.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-ethmoidal-nerve", "nasopalatine-nerve", "ethmoid-bone"],
      view: { azimuth: 0.2, elevation: 0.45, zoom: 1.6 },
    },
    {
      id: "sphenopalatine-artery",
      schematic: true,
      label: "Sphenopalatine artery",
      shortLabel: "Sphenopalatine a.",
      aliases: ["artery of epistaxis"],
      tissue: "artery",
      description:
        "The sphenopalatine artery is the terminal branch of the maxillary artery, entering the nasal cavity through the sphenopalatine foramen to supply the lateral wall (conchae) and, via its septal branch, the nasal septum. It is the main artery of posterior epistaxis.",
      keyPoints: [
        "Terminal branch of the maxillary artery.",
        "The principal source of posterior (and severe) epistaxis.",
      ],
      difficulty: 2,
      distractorIds: ["anterior-ethmoidal-artery", "kiesselbach-plexus", "nasopalatine-nerve"],
      view: { azimuth: 2.6, elevation: 0.05, zoom: 1.4 },
    },
    {
      id: "anterior-ethmoidal-artery",
      schematic: true,
      label: "Anterior ethmoidal artery",
      shortLabel: "Ant. ethmoidal a.",
      aliases: ["anterior ethmoidal branch of ophthalmic artery"],
      tissue: "artery",
      description:
        "The anterior ethmoidal artery, a branch of the ophthalmic artery, enters the nasal cavity through the anterior ethmoidal foramen and cribriform region to supply the anterosuperior lateral wall and septum. It contributes to Kiesselbach's plexus.",
      keyPoints: [
        "Branch of the ophthalmic artery (from the internal carotid).",
        "Supplies the anterosuperior nose and feeds Little's area.",
      ],
      difficulty: 3,
      distractorIds: ["sphenopalatine-artery", "kiesselbach-plexus", "anterior-ethmoidal-nerve"],
      view: { azimuth: 0.3, elevation: 0.3, zoom: 1.5 },
    },
    {
      id: "kiesselbach-plexus",
      schematic: true,
      label: "Kiesselbach's plexus",
      shortLabel: "Little's area",
      aliases: ["Little's area", "Kiesselbach's area"],
      tissue: "artery",
      description:
        "Kiesselbach's plexus is the anastomotic vascular network on the anteroinferior nasal septum (Little's area), where the sphenopalatine, anterior ethmoidal, greater palatine and superior labial arteries meet. It is the commonest site of anterior epistaxis.",
      keyPoints: [
        "A four-artery anastomosis on the anterior septum (Little's area).",
        "The commonest site of nosebleeds (anterior epistaxis).",
      ],
      difficulty: 2,
      distractorIds: ["sphenopalatine-artery", "anterior-ethmoidal-artery", "nasal-septum"],
      view: { azimuth: 1.5, elevation: -0.05, zoom: 1.7 },
    },
  ],
};
