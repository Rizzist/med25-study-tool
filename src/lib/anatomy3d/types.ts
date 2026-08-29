export type Tissue =
  | "cartilage"
  | "bone"
  | "mucosa"
  | "muscle"
  | "ligament"
  | "membrane"
  | "airway"
  | "lung"
  | "nerve"
  | "artery"
  | "vein"
  | "gland"
  | "cavity";

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
  dispose(): void;
};
