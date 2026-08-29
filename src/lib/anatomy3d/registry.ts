import { larynxRealManifest } from "./manifests/respiratory/larynx-real.manifest.mjs";
import { larynxManifest } from "./manifests/respiratory/larynx.manifest.mjs";
import { nasalManifest } from "./manifests/respiratory/nasal.manifest.mjs";
import { tracheaLungManifest } from "./manifests/respiratory/trachea-lung.manifest.mjs";
import type { AnatomyModelHandle, AnatomyModuleManifest } from "./types.ts";

export type AnatomyModuleRegistration = {
  manifest: AnatomyModuleManifest;
  createModel: () => AnatomyModelHandle | Promise<AnatomyModelHandle>;
};

const registrations: AnatomyModuleRegistration[] = [
  {
    manifest: larynxRealManifest,
    async createModel() {
      const { createRealLarynxModel } = await import("./models/respiratory/larynx-real.ts");
      return createRealLarynxModel();
    },
  },
  {
    manifest: larynxManifest,
    async createModel() {
      const { createLarynxModel } = await import("./models/respiratory/larynx.ts");
      return createLarynxModel();
    },
  },
  {
    manifest: nasalManifest,
    async createModel() {
      const { createNasalModel } = await import("./models/respiratory/nasal.ts");
      return createNasalModel();
    },
  },
  {
    manifest: tracheaLungManifest,
    async createModel() {
      const { createTracheaLungModel } = await import("./models/respiratory/trachea-lung.ts");
      return createTracheaLungModel();
    },
  },
];

export function listAnatomyModules(region?: string): AnatomyModuleRegistration[] {
  return registrations.filter((registration) => !region || registration.manifest.region === region);
}

export function getAnatomyModule(id: string): AnatomyModuleRegistration | undefined {
  return registrations.find(({ manifest }) => manifest.modelKey === id || manifest.id === id);
}
