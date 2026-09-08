import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(root, "data/term2/anatomy-visual-images.json");
const previous = JSON.parse(readFileSync(destination, "utf8")).images;
const imported = [];
for (const catalogPath of process.argv.slice(2)) {
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  const images = Array.isArray(catalog) ? catalog : catalog.images;
  for (const image of images) {
    const rawSource = image.source;
    image.source = Object.fromEntries(["title", "edition", "chapter", "page", "figure", "lecture", "slide", "excerpt"].flatMap((key) => rawSource[key] === undefined ? [] : [[key, String(rawSource[key])]]));
    image.source.chapter ??= image.source.lecture ?? image.title;
    if (rawSource.pageNumbering === "1-based PDF page index") image.source.page = `PDF page ${rawSource.pdfPage ?? rawSource.page}`;
    const labelIds = new Map();
    const remap = new Map();
    image.regions = image.regions.filter((region) => {
      const label = region.label.trim().toLowerCase();
      if (labelIds.has(label)) { remap.set(region.id, labelIds.get(label)); return false; }
      labelIds.set(label, region.id); return true;
    });
    for (const region of image.regions) if (region.distractorRegionIds) region.distractorRegionIds = [...new Set(region.distractorRegionIds.map((id) => remap.get(id) ?? id))].filter((id) => id !== region.id);
    const candidates = [resolve(dirname(catalogPath), basename(image.path)), resolve(dirname(catalogPath), "assets", basename(image.path))];
    const source = candidates.find(existsSync);
    if (!source) throw new Error(`Missing extracted source image: ${image.path}`);
    const path = resolve(root, "public/study", image.path);
    mkdirSync(dirname(path), { recursive: true });
    copyFileSync(source, path);
    imported.push(image);
  }
}
const exams = new Set(imported.map((image) => image.examId));
const images = [...previous.filter((image) => !exams.has(image.examId)), ...imported];
writeFileSync(destination, JSON.stringify({ images }, null, 2) + "\n");
console.log(`Imported ${imported.length} original source figures; ${images.length} total.`);
