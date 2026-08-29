import { demoManifest } from "./manifests/respiratory/_demo.manifest.mjs";
import type { AnatomyModelHandle, AnatomyModuleManifest } from "./types.ts";

export type AnatomyModuleRegistration = {
  manifest: AnatomyModuleManifest;
  createModel: () => AnatomyModelHandle | Promise<AnatomyModelHandle>;
};

const registrations: AnatomyModuleRegistration[] = [
  {
    manifest: demoManifest,
    async createModel() {
      const { createDemoModel } = await import("./models/respiratory/_demo.ts");
      return createDemoModel();
    },
  },
];

export function listAnatomyModules(region?: string): AnatomyModuleRegistration[] {
  return registrations.filter((registration) => !region || registration.manifest.region === region);
}

export function getAnatomyModule(id: string): AnatomyModuleRegistration | undefined {
  return registrations.find(({ manifest }) => manifest.modelKey === id || manifest.id === id);
}
