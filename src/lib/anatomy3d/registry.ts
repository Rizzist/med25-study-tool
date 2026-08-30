import { nasalRealManifest } from "./manifests/respiratory/nasal-real.manifest.mjs";
import { larynxRealManifest } from "./manifests/respiratory/larynx-real.manifest.mjs";
import { tracheaLungRealManifest } from "./manifests/respiratory/trachea-lung-real.manifest.mjs";
import { thoracicWallManifest } from "./manifests/cvs/thoracic-wall-real.manifest.mjs";
import { heartManifest } from "./manifests/cvs/heart-real.manifest.mjs";
import { mediastinumManifest } from "./manifests/cvs/mediastinum-real.manifest.mjs";
import { thoracicInnervationManifest } from "./manifests/cvs/thoracic-innervation-real.manifest.mjs";
import { upperLimbManifest } from "./manifests/upper-limb/upper-limb-real.manifest.mjs";
import { lowerLimbManifest } from "./manifests/lower-limb/lower-limb-real.manifest.mjs";
import type { AnatomyModelHandle, AnatomyModuleManifest } from "./types.ts";

export type AnatomyModuleRegistration = {
  manifest: AnatomyModuleManifest;
  createModel: () => AnatomyModelHandle | Promise<AnatomyModelHandle>;
};

// Real / hybrid BodyParts3D mesh-backed modules, ordered anatomically superior -> inferior.
// The stylised procedural models (larynx.ts / nasal.ts / trachea-lung.ts and their manifests)
// remain on disk but are no longer registered.
const registrations: AnatomyModuleRegistration[] = [
  {
    manifest: nasalRealManifest,
    async createModel() {
      const { createRealNasalModel } = await import("./models/respiratory/nasal-real.ts");
      return createRealNasalModel();
    },
  },
  {
    manifest: larynxRealManifest,
    async createModel() {
      const { createRealLarynxModel } = await import("./models/respiratory/larynx-real.ts");
      return createRealLarynxModel();
    },
  },
  {
    manifest: tracheaLungRealManifest,
    async createModel() {
      const { createRealTracheaLungModel } = await import("./models/respiratory/trachea-lung-real.ts");
      return createRealTracheaLungModel();
    },
  },
  {
    manifest: thoracicWallManifest,
    async createModel() {
      const { createThoracicWallModel } = await import("./models/cvs/thoracic-wall-real.ts");
      return createThoracicWallModel();
    },
  },
  {
    manifest: heartManifest,
    async createModel() {
      const { createHeartModel } = await import("./models/cvs/heart-real.ts");
      return createHeartModel();
    },
  },
  {
    manifest: mediastinumManifest,
    async createModel() {
      const { createMediastinumModel } = await import("./models/cvs/mediastinum-real.ts");
      return createMediastinumModel();
    },
  },
  {
    manifest: thoracicInnervationManifest,
    async createModel() {
      const { createThoracicInnervationModel } = await import("./models/cvs/thoracic-innervation-real.ts");
      return createThoracicInnervationModel();
    },
  },
  {
    manifest: upperLimbManifest,
    async createModel() {
      const { createUpperLimbModel } = await import("./models/upper-limb/upper-limb-real.ts");
      return createUpperLimbModel();
    },
  },
  {
    manifest: lowerLimbManifest,
    async createModel() {
      const { createLowerLimbModel } = await import("./models/lower-limb/lower-limb-real.ts");
      return createLowerLimbModel();
    },
  },
];

export function listAnatomyModules(region?: string): AnatomyModuleRegistration[] {
  return registrations.filter((registration) => !region || registration.manifest.region === region);
}

export function getAnatomyModule(id: string): AnatomyModuleRegistration | undefined {
  return registrations.find(({ manifest }) => manifest.modelKey === id || manifest.id === id);
}
