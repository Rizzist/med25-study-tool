import visual from "@/data/term2/anatomy-visual-images.json";
import legacy from "@/data/term2/anatomy-images.json";
import practical from "@/data/term2/anatomy-practical-images.json";
import type { AnatomySourceImage } from "../mcq/dynamic-anatomy.mjs";

// One catalogue feeds study, both question directions and the label game.
export const allStudyImages: AnatomySourceImage[] = [
  ...visual.images, ...legacy.images, ...practical.images,
] as AnatomySourceImage[];
const superseded=new Set(allStudyImages.flatMap(image=>image.supersedesImageIds??[]));
// Sparse old views remain in the bank for saved-question history. The gallery
// presents only their expanded successor, without duplicate source photographs.
export const anatomyStudyImages=allStudyImages.filter(image=>!superseded.has(image.id));
export function anatomyImagesForExam(examId: string, includeHistorical = false) {
  return (includeHistorical ? allStudyImages : anatomyStudyImages).filter(image => image.examId === examId || (!image.examId && examId === "term2-respiratory"));
}
