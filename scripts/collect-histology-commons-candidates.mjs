#!/usr/bin/env node

import { writeFile } from "node:fs/promises";

const categoryTargets = [
  ["Histology of joints", "synovial-joint"],
  ["Synovial joints", "synovial-joint"],
  ["Histology of hyaline cartilage", "hyaline-cartilage"],
  ["Histology of elastic cartilage", "elastic-cartilage"],
  ["Histology of human cartilage", "fibrocartilage"],
  ["Histology of bones", "bone-review"],
  ["Osteons", "compact-bone"],
  ["Substantia spongiosa", "spongy-bone"],
  ["Histology of ossification", "immature-bone"],
  ["Histology of dorsal root ganglion", "sensory-ganglion"],
  ["Histology of ganglia", "ganglion-review"],
  ["Histology of nerves", "peripheral-nerve"],
  ["Histology of human nerves", "peripheral-nerve"],
  ["Histology of mammal nerves", "peripheral-nerve"],
  ["Cardiac muscle", "cardiac-muscle"],
  ["Histology of skeletal muscles", "skeletal-muscle"],
  ["Histology of adipose tissue", "white-adipose"],
  ["Histology of brown adipose tissue", "brown-adipose"],
  ["Histology of tendon", "tendon"],
  ["Ligaments", "ligament"],
  ["Histology of skin", "skin-review"],
  ["Histology of human skin", "skin-review"],
  ["Simple cuboidal epithelium", "simple-cuboidal"],
  ["Transitional epithelium", "transitional-epithelium"],
  ["Pseudostratified columnar epithelium", "pseudostratified-epithelium"],
  ["Histology of thyroid", "simple-cuboidal-thyroid"],
  ["Histology of kidney", "simple-cuboidal-kidney"],
  ["Histology of urinary bladder", "transitional-bladder"],
  ["Histology of ureters", "transitional-ureter"],
  ["Histology of trachea", "pseudostratified-trachea"],
  ["Histology of epididymis", "pseudostratified-epididymis"],
];

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/tiff"]);
const allowedLicensePattern = /public domain|cc0|cc by(?:-sa)?(?: |$)/i;
const rejectedTitlePattern = /\.svg$|diagram|schematic|anatomy and physiology|blausen|smart-servier|illustration|cartoon|drawing|types of|structureN|histological architecture|animated/i;
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function plainText(value = "") {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchCategory(category, target) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    generator: "categorymembers",
    gcmtitle: `Category:${category}`,
    gcmnamespace: "6",
    gcmlimit: "500",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1600",
    format: "json",
    origin: "*",
  });

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": "MED25HistologyTrainer/1.0 (local educational app)" } });
    const body = await response.text();
    if (response.ok && body.startsWith("{")) {
      const data = JSON.parse(body);
      return Object.values(data.query?.pages ?? {}).flatMap((page) => {
        const info = page.imageinfo?.[0];
        const meta = info?.extmetadata ?? {};
        const license = plainText(meta.LicenseShortName?.value ?? meta.License?.value ?? "");
        if (!info || !allowedMimeTypes.has(info.mime) || info.width < 500 || info.height < 300) return [];
        if (!allowedLicensePattern.test(license) || rejectedTitlePattern.test(page.title)) return [];
        return [{
          pageId: page.pageid,
          title: page.title.replace(/^File:/, ""),
          category,
          target,
          descriptionUrl: info.descriptionurl,
          originalUrl: info.url,
          downloadUrl: info.thumburl ?? info.url,
          mime: info.thumbmime ?? info.mime,
          width: info.thumbwidth ?? info.width,
          height: info.thumbheight ?? info.height,
          originalWidth: info.width,
          originalHeight: info.height,
          author: plainText(meta.Artist?.value ?? meta.Credit?.value ?? "Wikimedia Commons contributor"),
          credit: plainText(meta.Credit?.value ?? ""),
          license,
          licenseUrl: meta.LicenseUrl?.value ?? "",
          description: plainText(meta.ImageDescription?.value ?? meta.ObjectName?.value ?? page.title),
        }];
      });
    }
    await pause(attempt * 3_000);
  }
  process.stderr.write(`Warning: Wikimedia Commons API did not return ${category}; continuing with zero candidates.\n`);
  return [];
}

const outputPath = process.argv[2] ?? "/tmp/med25-histology-commons-candidates.json";
const start = Math.max(0, Number(process.argv[3] ?? 0));
const end = Math.min(categoryTargets.length, Number(process.argv[4] ?? categoryTargets.length));
const collected = [];
for (const [category, target] of categoryTargets.slice(start, end)) {
  const candidates = await fetchCategory(category, target);
  process.stdout.write(`${String(candidates.length).padStart(3)}  ${category}\n`);
  collected.push(...candidates);
  await pause(1_500);
}

await writeFile(outputPath, `${JSON.stringify(collected, null, 2)}\n`);
process.stdout.write(`Wrote ${collected.length} candidates to ${outputPath}\n`);
