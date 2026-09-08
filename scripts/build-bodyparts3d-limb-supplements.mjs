import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaBase = "https://media.githubusercontent.com/media/olivercase/body_parts_3d_api/main/";

const modules = [
  {
    output: "public/anatomy3d/upper-limb/upper-limb-detail.obj",
    // Raw BodyParts3D (X lateral, Y AP, Z superior) -> the existing normalized model contract.
    transform: { scale: 0.00270371, translate: [0.03027, -2.71448, -0.25740] },
    sources: [
      ["brachioradialis-muscle", "meshes/FJ1487_BP20916_FMA38486_Right brachioradialis.obj"],
      ["palmaris-longus-muscle", "meshes/FJ1502_BP20900_FMA38463_Right palmaris longus.obj"],
      ["pronator-quadratus-muscle", "meshes/FJ1503_BP20975_FMA38454_Right pronator quadratus.obj"],
      ["flexor-pollicis-longus-muscle", "meshes/FJ1498_BP20993_FMA38482_Right flexor pollicis longus.obj"],
      ["extensor-carpi-radialis-longus-muscle", "meshes/FJ1490_BP20888_FMA38495_Right extensor carpi radialis longus.obj"],
      ["extensor-carpi-radialis-brevis-muscle", "meshes/FJ1489_BP20943_FMA38498_Right extensor carpi radialis brevis.obj"],
      ["extensor-digiti-minimi-muscle", "meshes/FJ1491_BP20922_FMA38504_Right extensor digiti minimi.obj"],
      ["supinator-muscle", "meshes/FJ1505_BP20779_FMA38513_Right supinator.obj"],
      ["abductor-pollicis-longus-muscle", "meshes/FJ1484_BP20840_FMA38516_Right abductor pollicis longus.obj"],
      ["extensor-pollicis-brevis-muscle", "meshes/FJ1494_BP20939_FMA38519_Right extensor pollicis brevis.obj"],
      ["extensor-pollicis-longus-muscle", "meshes/FJ1495_BP20770_FMA38522_Right extensor pollicis longus.obj"],
      ["extensor-indicis-muscle", "meshes/FJ1493_BP20815_FMA38525_Right extensor indicis.obj"],
      ["adductor-pollicis-muscle", "meshes/FJ1481_BP23077_FMA46121_Oblique head of right adductor pollicis.obj"],
      ["adductor-pollicis-muscle", "meshes/FJ1515_BP20577_FMA46123_Transverse head of right adductor pollicis.obj"],
      // The original packed GLB's thenar group contains a disconnected, mirrored fragment that
      // expands the upper-limb bounds by almost a full body width. Rebuild the group from the
      // three correctly lateraled BodyParts3D source muscles and discard that corrupt core node
      // in the runtime loader.
      ["thenar-muscle-group", "meshes/FJ1483_BP20944_FMA37386_Right abductor pollicis brevis.obj"],
      ["thenar-muscle-group", "meshes/FJ1514_BP23262_FMA65198_Superficial head of right flexor pollicis brevis.obj"],
      ["thenar-muscle-group", "meshes/FJ1501_BP21042_FMA37390_Right opponens pollicis.obj"],
    ],
  },
  {
    output: "public/anatomy3d/lower-limb/lower-limb-detail.obj",
    transform: { scale: 0.00162186, translate: [-0.13614, -0.83198, -0.17600] },
    sources: [
      ["tensor-fasciae-latae", "meshes/FJ1438M_BP20090_FMA22426_Left tensor fasciae latae.obj"],
      ["piriformis", "meshes/FJ1428M_BP23829_FMA22341_Left piriformis.obj"],
      ["obturator-internus", "meshes/FJ1426M_BP22090_FMA22325_Left obturator internus.obj"],
      ["gemellus-superior", "meshes/FJ1417M_BP22517_FMA22335_Left gemellus superior.obj"],
      ["gemellus-inferior", "meshes/FJ1416M_BP20398_FMA22337_Left gemellus inferior.obj"],
      ["quadratus-femoris", "meshes/FJ1432M_BP20315_FMA22339_Left quadratus femoris.obj"],
      ["sartorius", "meshes/FJ1434M_BP20388_FMA22355_Left sartorius.obj"],
      ["pectineus", "meshes/FJ1427M_BP20433_FMA22451_Left pectineus.obj"],
      ["adductor-brevis", "meshes/FJ1401M_BP20483_FMA22454_Left adductor brevis.obj"],
      ["plantaris", "meshes/FJ1429M_BP20980_FMA22561_Left plantaris.obj"],
      ["popliteus", "meshes/FJ1430M_BP20999_FMA22592_Left popliteus.obj"],
      ["flexor-digitorum-longus", "meshes/FJ1414M_BP20886_FMA65017_Left flexor digitorum longus.obj"],
      ["flexor-hallucis-longus", "meshes/FJ1415M_BP20821_FMA65015_Left flexor hallucis longus.obj"],
      ["extensor-hallucis-longus", "meshes/FJ1408M_BP22411_FMA22547_Left extensor hallucis longus.obj"],
      ["fibularis-tertius", "meshes/FJ1411M_BP19733_FMA22551_Left fibularis tertius.obj"],
      ["dorsalis-pedis-artery", "meshes/FJ2073_BP23420_FMA43917_Left dorsalis pedis artery.obj"],
      ["lateral-plantar-artery", "meshes/FJ2079_BP23390_FMA69567_Trunk of left lateral plantar artery.obj"],
      ["medial-plantar-artery", "meshes/FJ2082_BP23388_FMA69757_Trunk of left medial plantar artery.obj"],
    ],
  },
];

function adjustedIndex(raw, offset) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value === 0) throw new Error(`Invalid OBJ index: ${raw}`);
  return value > 0 ? value + offset : value;
}

function remapFaceToken(token, offsets) {
  const [vertex, texture = "", normal = ""] = token.split("/");
  const mapped = [String(adjustedIndex(vertex, offsets.vertex))];
  if (token.includes("/")) mapped.push(texture ? String(adjustedIndex(texture, offsets.texture)) : "");
  if (token.split("/").length > 2) mapped.push(normal ? String(adjustedIndex(normal, offsets.normal)) : "");
  return mapped.join("/");
}

function transformSource(source, structureId, transform, offsets) {
  const out = [`\n# ${structureId}`, `o ${structureId}`];
  let vertexCount = 0;
  let textureCount = 0;
  let normalCount = 0;
  const [tx, ty, tz] = transform.translate;
  for (const line of source.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v") {
      const [x, y, z] = parts.slice(1, 4).map(Number);
      out.push(`v ${(x * transform.scale + tx).toFixed(7)} ${(z * transform.scale + ty).toFixed(7)} ${(-y * transform.scale + tz).toFixed(7)}`);
      vertexCount += 1;
    } else if (parts[0] === "vn") {
      const [x, y, z] = parts.slice(1, 4).map(Number);
      out.push(`vn ${x.toFixed(7)} ${z.toFixed(7)} ${(-y).toFixed(7)}`);
      normalCount += 1;
    } else if (parts[0] === "vt") {
      out.push(line.trim());
      textureCount += 1;
    } else if (parts[0] === "f") {
      out.push(`f ${parts.slice(1).map((token) => remapFaceToken(token, offsets)).join(" ")}`);
    } else if (parts[0] === "s") {
      out.push(line.trim());
    }
  }
  return {
    text: out.join("\n"),
    counts: { vertex: vertexCount, texture: textureCount, normal: normalCount },
  };
}

async function download(sourcePath) {
  const response = await fetch(encodeURI(`${mediaBase}${sourcePath}`));
  if (!response.ok) throw new Error(`${response.status} while downloading ${sourcePath}`);
  return response.text();
}

for (const moduleConfig of modules) {
  const downloaded = await Promise.all(moduleConfig.sources.map(async ([structureId, sourcePath]) => ({
    structureId,
    sourcePath,
    source: await download(sourcePath),
  })));
  const chunks = [
    "# BodyParts3D v4.3 detail supplement",
    "# Source: https://github.com/olivercase/body_parts_3d_api",
    "# BodyParts3D data: Database Center for Life Science (DBCLS)",
  ];
  const offsets = { vertex: 0, texture: 0, normal: 0 };
  for (const item of downloaded) {
    chunks.push(`# Original: ${item.sourcePath}`);
    const transformed = transformSource(item.source, item.structureId, moduleConfig.transform, offsets);
    chunks.push(transformed.text);
    offsets.vertex += transformed.counts.vertex;
    offsets.texture += transformed.counts.texture;
    offsets.normal += transformed.counts.normal;
  }
  const destination = path.join(repoRoot, moduleConfig.output);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, `${chunks.join("\n")}\n`);
  console.log(`Built ${moduleConfig.output}: ${moduleConfig.sources.length} source meshes, ${offsets.vertex} vertices.`);
}
