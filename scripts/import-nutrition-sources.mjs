// One-time local import. Ordinary builds use committed data, not the author's filesystem.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const sourceRoot = process.argv[2];
if (!sourceRoot) throw new Error("Pass the Nutrition Review _build directory.");
const review = JSON.parse(readFileSync(resolve(sourceRoot, "content/nutrition.json"), "utf8"));
const map = JSON.parse(readFileSync(resolve(sourceRoot, "audit/nutrition-exam-map.json"), "utf8"));
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const out = resolve(root, "data/nutrition");
const assets = resolve(root, "public/study/nutrition/past-papers");
mkdirSync(out, { recursive: true });
mkdirSync(assets, { recursive: true });
const definitions = [
  ["F", "English nutrition final", map.records.find(r => r.id === "F1").source, "english-final.pdf", 24],
  ["N", "Mixed-language nutrition scans", map.records.find(r => r.id === "N1").source, "nutrition-scans.pdf", 28],
  ["D", "Bilingual nutrition compilation", resolve(sourceRoot, "sources/nutrition/docx-render/تغذیه.pdf"), "bilingual-compilation.pdf", 40],
  ["O", "Nutrition in Oral Health · course match unconfirmed", map.records.find(r => r.id === "O1").source, "oral-health.pdf", 36],
];
const papers = definitions.map(([id,title,local,file,itemCount]) => {
  copyFileSync(local, resolve(assets,file));
  return { id, title, file: `/study/nutrition/past-papers/${file}`, itemCount, sha256: hash(local), originalFilename: id === "D" ? "تغذیه.docx (locally rendered to PDF)" : local.split("/").at(-1), courseConfirmed: false };
});
const docxPages = [1,1,2,2,3,3,4,4,4,5,6,6,6,7,7,8,8,9,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,17,17,18,18,19,19];
const oralPage = n => n <= 3 ? 1 : n <= 7 ? 2 : n <= 11 ? 3 : n <= 15 ? 4 : n <= 19 ? 5 : n <= 23 ? 6 : n <= 27 ? 7 : n <= 31 ? 8 : n <= 34 ? 9 : 10;
const sections = review.sections.filter(s => !s.id.startsWith("map-") && !["roadmap","last-pass"].includes(s.id)).map(s => ({
  id: s.id, title: s.title.replace(/^\d+ \/ /, ""), reviewSection: s.title.split(" / ")[0],
  bookLocator: s.sources[0].locator,
  references: s.sources.filter(x => x.url).map(x => ({ title:x.title, url:x.url })),
  supplementary: s.id === "oral",
}));
const records = map.records.map(({ id,locator,topic,explanation,sectionId,status,courseMatch }) => {
  const paperId = id[0], number = Number(id.slice(1));
  return { id,paperId,number,locator,topic,explanation,sectionId,status,courseMatch,
    page: paperId === "D" ? docxPages[number-1] : paperId === "O" ? oralPage(number) : number,
  };
});
writeFileSync(resolve(out,"sources.json"), JSON.stringify({
  version:1, imported:"2026-09-14", book:{ title:"Nutrition & Diet Therapy", authors:"DeBruyne, Pinna & Whitney", edition:"9th (2016)", sha256:hash(review.sourceFiles.find(f => typeof f === "string" && f.endsWith("/Nutrition")) ?? "/Users/rizzist/Documents/MED SCHOOL BOOKS/Nutrition") },
  review:{ title:"11 - Nutrition Review.pdf", sourceHash:hash(resolve(sourceRoot,"content/nutrition.json")), scope:"Review/book-derived; Nutrition lecture slides and official syllabus not yet confirmed." }, sections,papers,records,
},null,2)+"\n");
console.log(`Imported ${records.length} original source items across ${papers.length} papers; no item discarded.`);
