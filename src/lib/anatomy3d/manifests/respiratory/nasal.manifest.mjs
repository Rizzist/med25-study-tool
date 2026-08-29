/** @type {import("../../types").AnatomyModuleManifest} */
export const nasalManifest = {
  id: "resp-nasal",
  region: "respiratory",
  modelKey: "nasal",
  title: "Nasal cavity & paranasal sinuses",
  subject: "anatomy",
  blurb:
    "A stylised cut-open block of the nasal cavity showing the septum, the three conchae and their meatuses, and the four paranasal sinuses.",
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
      label: "Nasal septum",
      shortLabel: "Septum",
      aliases: ["septum of nose", "nasal septum"],
      tissue: "cartilage",
      description:
        "The nasal septum is the midline vertical partition that divides the nasal cavity into right and left halves. It is formed by the perpendicular plate of the ethmoid and the vomer posteriorly and the septal cartilage anteriorly.",
      keyPoints: [
        "Lies in the midsagittal plane, separating the two nasal cavities.",
        "Deviation of the septum is a common cause of unilateral nasal obstruction.",
      ],
      difficulty: 1,
      distractorIds: ["middle-concha", "hard-palate", "inferior-concha"],
      view: { azimuth: 1.15, elevation: 0.08, zoom: 1.15 },
    },
    {
      id: "superior-concha",
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
      view: { azimuth: Math.PI, elevation: 0.12, zoom: 1.6 },
    },
    {
      id: "hard-palate",
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
      view: { azimuth: Math.PI, elevation: -0.05, zoom: 1.5 },
    },
  ],
};
