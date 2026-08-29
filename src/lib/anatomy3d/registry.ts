import { nasalRealManifest } from "./manifests/respiratory/nasal-real.manifest.mjs";
import { larynxRealManifest } from "./manifests/respiratory/larynx-real.manifest.mjs";
import { tracheaLungRealManifest } from "./manifests/respiratory/trachea-lung-real.manifest.mjs";
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
];

export function listAnatomyModules(region?: string): AnatomyModuleRegistration[] {
  return registrations.filter((registration) => !region || registration.manifest.region === region);
}

export function getAnatomyModule(id: string): AnatomyModuleRegistration | undefined {
  return registrations.find(({ manifest }) => manifest.modelKey === id || manifest.id === id);
}
