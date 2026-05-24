import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const SOURCE_SHEET_PATH = path.resolve(projectRoot, "sprites", "fish_transparent.png");
const CROP_CONFIG_PATH = path.resolve(projectRoot, "src", "features", "inventory", "fish-sprite-crops.json");
const RUNTIME_MANIFEST_PATH = path.resolve(projectRoot, "src", "features", "inventory", "fish-sprite-manifest.json");
const RUNTIME_ASSIGNMENTS_PATH = path.resolve(projectRoot, "src", "features", "inventory", "fish-sprite-assignments.json");
const GENERATED_HABITAT_DATA_DIR = path.resolve(projectRoot, "generated", "fish-by-habitat");

const OUTPUT_DIRS = [
  path.resolve(projectRoot, "sprites", "fishes"),
  path.resolve(projectRoot, "public", "sprites-clean", "fishes"),
];

function toPosixRelative(targetPath) {
  return path.relative(projectRoot, targetPath).replaceAll(path.sep, "/");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}

function parseCropConfig(rawConfig) {
  if (!Array.isArray(rawConfig)) {
    throw new Error("Fish sprite crop config must be an array.");
  }

  const seenIds = new Set();
  return rawConfig.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Invalid fish sprite entry at index ${index}.`);
    }

    const { id, crop } = entry;
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new Error(`Fish sprite id at index ${index} must be a non-empty string.`);
    }
    if (seenIds.has(id)) {
      throw new Error(`Duplicate fish sprite id detected: "${id}".`);
    }
    seenIds.add(id);

    if (!crop || typeof crop !== "object") {
      throw new Error(`Fish sprite crop for "${id}" is missing.`);
    }

    assertNonNegativeInteger(crop.x, `crop.x for "${id}"`);
    assertNonNegativeInteger(crop.y, `crop.y for "${id}"`);
    assertPositiveInteger(crop.width, `crop.width for "${id}"`);
    assertPositiveInteger(crop.height, `crop.height for "${id}"`);

    return {
      id,
      crop: {
        x: crop.x,
        y: crop.y,
        width: crop.width,
        height: crop.height,
      },
    };
  });
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

async function ensureOutputDirectories() {
  await Promise.all(OUTPUT_DIRS.map((outputDir) => mkdir(outputDir, { recursive: true })));
}

async function pruneManagedArtifacts(entries) {
  const expectedFiles = new Set(["index.json", ...entries.map((entry) => `${entry.id}.png`)]);

  await Promise.all(
    OUTPUT_DIRS.map(async (outputDir) => {
      const existingFiles = await readdir(outputDir, { withFileTypes: true });
      await Promise.all(
        existingFiles.map(async (item) => {
          if (!item.isFile()) {
            return;
          }
          if (expectedFiles.has(item.name)) {
            return;
          }

          if (item.name.toLowerCase().endsWith(".png") || item.name === "index.json") {
            await rm(path.join(outputDir, item.name), { force: true });
          }
        }),
      );
    }),
  );
}

function validateCropBounds(entries, sheetWidth, sheetHeight) {
  for (const entry of entries) {
    const { x, y, width, height } = entry.crop;
    if (x + width > sheetWidth || y + height > sheetHeight) {
      throw new Error(
        `Crop for "${entry.id}" is out of bounds (${x},${y},${width},${height}) for sheet ${sheetWidth}x${sheetHeight}.`,
      );
    }
  }
}

async function writeManifest(manifestEntries) {
  const manifestJson = `${JSON.stringify(manifestEntries, null, 2)}\n`;
  await Promise.all(
    OUTPUT_DIRS.map((outputDir) => writeFile(path.resolve(outputDir, "index.json"), manifestJson, "utf8")),
  );
  await writeFile(RUNTIME_MANIFEST_PATH, manifestJson, "utf8");
}

async function collectKnownFishIds() {
  const fishIds = new Set();
  const dataFiles = await readdir(GENERATED_HABITAT_DATA_DIR, { withFileTypes: true });

  for (const item of dataFiles) {
    if (!item.isFile() || !item.name.toLowerCase().endsWith(".json")) {
      continue;
    }

    const filePath = path.resolve(GENERATED_HABITAT_DATA_DIR, item.name);
    const jsonText = await readFile(filePath, "utf8");
    const parsedData = JSON.parse(jsonText);
    const fishEntries = Array.isArray(parsedData?.fish) ? parsedData.fish : [];

    for (const fishEntry of fishEntries) {
      const commonName = typeof fishEntry?.commonName === "string" ? fishEntry.commonName : "";
      const fishId = slugify(commonName);
      if (fishId.length > 0) {
        fishIds.add(fishId);
      }
    }
  }

  return [...fishIds];
}

function createFishSpriteAssignments(manifestEntries, knownFishIds) {
  if (manifestEntries.length === 0) {
    throw new Error("Cannot create fish sprite assignments without any manifest entries.");
  }

  const manifestIds = manifestEntries.map((entry) => entry.id);
  const manifestIdSet = new Set(manifestIds);
  const combinedFishIds = new Set([...manifestIds, ...knownFishIds]);
  const sortedFishIds = [...combinedFishIds].sort((left, right) => left.localeCompare(right));

  return sortedFishIds.map((fishId) => {
    const spriteId = manifestIdSet.has(fishId)
      ? fishId
      : manifestIds[Math.abs(hashString(fishId)) % manifestIds.length];

    return {
      fishId,
      spriteId,
    };
  });
}

async function writeFishSpriteAssignments(assignments) {
  const assignmentsJson = `${JSON.stringify(assignments, null, 2)}\n`;
  await writeFile(RUNTIME_ASSIGNMENTS_PATH, assignmentsJson, "utf8");
}

async function run() {
  const configText = await readFile(CROP_CONFIG_PATH, "utf8");
  const cropEntries = parseCropConfig(JSON.parse(configText));

  if (cropEntries.length === 0) {
    throw new Error("Fish sprite crop config is empty.");
  }

  const sourceImage = sharp(SOURCE_SHEET_PATH);
  const sourceMetadata = await sourceImage.metadata();
  const sheetWidth = sourceMetadata.width ?? 0;
  const sheetHeight = sourceMetadata.height ?? 0;
  if (sheetWidth === 0 || sheetHeight === 0) {
    throw new Error("Unable to read source fish sprite sheet dimensions.");
  }

  validateCropBounds(cropEntries, sheetWidth, sheetHeight);
  await ensureOutputDirectories();
  await pruneManagedArtifacts(cropEntries);

  const manifestEntries = [];
  for (const entry of cropEntries) {
    const { id, crop } = entry;
    const spriteBuffer = await sharp(SOURCE_SHEET_PATH)
      .extract({
        left: crop.x,
        top: crop.y,
        width: crop.width,
        height: crop.height,
      })
      .png()
      .toBuffer();
    const fileName = `${id}.png`;

    await Promise.all(
      OUTPUT_DIRS.map((outputDir) => writeFile(path.resolve(outputDir, fileName), spriteBuffer)),
    );

    manifestEntries.push({
      id,
      fileName,
      crop,
      outputWidth: crop.width,
      outputHeight: crop.height,
    });
  }

  await writeManifest(manifestEntries);
  const knownFishIds = await collectKnownFishIds();
  const assignments = createFishSpriteAssignments(manifestEntries, knownFishIds);
  await writeFishSpriteAssignments(assignments);

  console.log(`Built ${manifestEntries.length} fish sprites from ${toPosixRelative(SOURCE_SHEET_PATH)}.`);
  for (const outputDir of OUTPUT_DIRS) {
    console.log(`- ${toPosixRelative(outputDir)}`);
  }
  console.log(`- ${toPosixRelative(RUNTIME_MANIFEST_PATH)}`);
  console.log(`- ${toPosixRelative(RUNTIME_ASSIGNMENTS_PATH)} (${assignments.length} fish IDs)`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
