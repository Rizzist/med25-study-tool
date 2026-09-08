export type Tissue =
  | "cartilage"
  | "bone"
  | "mucosa"
  | "muscle"
  | "ligament"
  | "tendon"
  | "fascia"
  | "membrane"
  | "airway"
  | "lung"
  | "nerve"
  | "artery"
  | "vein"
  | "gland"
  | "cavity"
  | "fat";

export type CameraView = {
  azimuth: number;
  elevation: number;
  zoom?: number;
};

export type AnatomyStructure = {
  id: string;
  label: string;
  shortLabel?: string;
  aliases?: string[];
  tissue: Tissue;
  description: string;
  keyPoints?: string[];
  difficulty: 1 | 2 | 3;
  distractorIds?: string[];
  view?: CameraView;
  quizable?: boolean;
  /**
   * True when the mesh is drawn PROCEDURALLY (diagrammatic — anatomically placed but not
   * scan-accurate) rather than loaded from the BodyParts3D GLB. Mirrors `userData.schematic` on the
   * built meshes. Omitted/false means the structure is a real, scan-derived mesh.
   */
  schematic?: boolean;
  /** A surface-pinned study marker. Retain its supporting bone when isolating it. */
  landmarkOf?: string;
};

export type AnatomyModuleManifest = {
  id: string;
  region: string;
  modelKey: string;
  title: string;
  subject: "anatomy";
  blurb: string;
  structures: AnatomyStructure[];
};

export type AnatomyModelHandle = {
  root: import("three").Group;
  structures: Map<string, import("three").Object3D[]>;
  aliases?: Map<string, string[]>;
  dispose(): void;
};
