import "./fish-sprite-lab.css";

interface FishSpriteCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FishSpriteCropEntry {
  id: string;
  crop: FishSpriteCropRect;
}

interface FishSpriteManifestEntry {
  id: string;
  fileName: string;
  crop: FishSpriteCropRect;
  outputWidth: number;
  outputHeight: number;
}

interface ParsedRecords {
  crops: FishSpriteCropEntry[];
  manifest: FishSpriteManifestEntry[];
}

type IssueLevel = "error" | "warning";

interface ValidationIssue {
  level: IssueLevel;
  message: string;
}

const CROPS_JSON_PATH = "/src/features/inventory/fish-sprite-crops.json";
const MANIFEST_JSON_PATH = "/src/features/inventory/fish-sprite-manifest.json";
const SOURCE_SHEET_PATH = "/sprites/fish_transparent.png";
const BUILT_SPRITE_DIR = "/sprites-clean/fishes";
const AUTO_REFRESH_MS = 1800;
const SHEET_MAX_WIDTH = 1200;

const OUTLINE_COLORS = [
  "#0d8bc4",
  "#d3590f",
  "#19864a",
  "#7f4ac7",
  "#be3345",
  "#6b6f1e",
  "#24796e",
  "#a51f8a",
];

const reloadButtonEl = mustGetElement<HTMLButtonElement>("#fish-lab-reload");
const autoRefreshEl = mustGetElement<HTMLInputElement>("#fish-lab-auto-refresh");
const updatedAtEl = mustGetElement<HTMLParagraphElement>("#fish-lab-updated-at");
const summaryEl = mustGetElement<HTMLElement>("#fish-lab-summary");
const errorsEl = mustGetElement<HTMLElement>("#fish-lab-errors");
const cardsEl = mustGetElement<HTMLElement>("#fish-lab-cards");
const sheetCanvasEl = mustGetElement<HTMLCanvasElement>("#fish-lab-sheet-canvas");

let sourceImage: HTMLImageElement | null = null;
let autoRefreshHandle: number | null = null;
let isRefreshing = false;

function mustGetElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertInteger(value: unknown, label: string, min: number, allowZero: boolean): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }
  if (allowZero && value < min) {
    throw new Error(`${label} must be >= ${min}.`);
  }
  if (!allowZero && value <= min) {
    throw new Error(`${label} must be > ${min}.`);
  }
  return value;
}

function parseRect(rawRect: unknown, label: string): FishSpriteCropRect {
  if (!isRecord(rawRect)) {
    throw new Error(`${label} must be an object.`);
  }

  const x = assertInteger(rawRect.x, `${label}.x`, 0, true);
  const y = assertInteger(rawRect.y, `${label}.y`, 0, true);
  const width = assertInteger(rawRect.width, `${label}.width`, 0, false);
  const height = assertInteger(rawRect.height, `${label}.height`, 0, false);
  return { x, y, width, height };
}

function parseCrops(rawValue: unknown): FishSpriteCropEntry[] {
  if (!Array.isArray(rawValue)) {
    throw new Error("fish-sprite-crops.json must contain an array.");
  }

  const seenIds = new Set<string>();
  return rawValue.map((rawEntry, index) => {
    if (!isRecord(rawEntry)) {
      throw new Error(`Crops entry at index ${index} must be an object.`);
    }

    const id = rawEntry.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new Error(`Crops entry at index ${index} has an invalid id.`);
    }
    if (seenIds.has(id)) {
      throw new Error(`Duplicate crops id: "${id}".`);
    }
    seenIds.add(id);

    const crop = parseRect(rawEntry.crop, `crops[${id}]`);
    return { id, crop };
  });
}

function parseManifest(rawValue: unknown): FishSpriteManifestEntry[] {
  if (!Array.isArray(rawValue)) {
    throw new Error("fish-sprite-manifest.json must contain an array.");
  }

  const seenIds = new Set<string>();
  return rawValue.map((rawEntry, index) => {
    if (!isRecord(rawEntry)) {
      throw new Error(`Manifest entry at index ${index} must be an object.`);
    }

    const id = rawEntry.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new Error(`Manifest entry at index ${index} has an invalid id.`);
    }
    if (seenIds.has(id)) {
      throw new Error(`Duplicate manifest id: "${id}".`);
    }
    seenIds.add(id);

    const fileName = rawEntry.fileName;
    if (typeof fileName !== "string" || fileName.trim().length === 0) {
      throw new Error(`Manifest entry "${id}" has an invalid fileName.`);
    }

    const outputWidth = assertInteger(rawEntry.outputWidth, `manifest[${id}].outputWidth`, 0, false);
    const outputHeight = assertInteger(rawEntry.outputHeight, `manifest[${id}].outputHeight`, 0, false);
    const crop = parseRect(rawEntry.crop, `manifest[${id}].crop`);

    return { id, fileName, crop, outputWidth, outputHeight };
  });
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

async function loadSourceImage(): Promise<HTMLImageElement> {
  if (sourceImage) {
    return sourceImage;
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imageEl = new Image();
    imageEl.addEventListener("load", () => resolve(imageEl), { once: true });
    imageEl.addEventListener("error", () => reject(new Error(`Failed to load ${SOURCE_SHEET_PATH}.`)), { once: true });
    imageEl.src = SOURCE_SHEET_PATH;
  });

  sourceImage = image;
  return image;
}

async function loadData(): Promise<ParsedRecords> {
  const [rawCrops, rawManifest] = await Promise.all([fetchJson(CROPS_JSON_PATH), fetchJson(MANIFEST_JSON_PATH)]);
  return {
    crops: parseCrops(rawCrops),
    manifest: parseManifest(rawManifest),
  };
}

function rectKey(rect: FishSpriteCropRect): string {
  return `${rect.x},${rect.y},${rect.width},${rect.height}`;
}

function rectsMatch(left: FishSpriteCropRect, right: FishSpriteCropRect): boolean {
  return rectKey(left) === rectKey(right);
}

function getFishIds(crops: FishSpriteCropEntry[], manifest: FishSpriteManifestEntry[]): string[] {
  const fishIds = new Set<string>();
  for (const crop of crops) {
    fishIds.add(crop.id);
  }
  for (const entry of manifest) {
    fishIds.add(entry.id);
  }
  return [...fishIds].sort((left, right) => left.localeCompare(right));
}

function createValidationIssues(
  crops: FishSpriteCropEntry[],
  manifest: FishSpriteManifestEntry[],
  sourceWidth: number,
  sourceHeight: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const cropById = new Map(crops.map((entry) => [entry.id, entry]));
  const manifestById = new Map(manifest.map((entry) => [entry.id, entry]));
  const fishIds = getFishIds(crops, manifest);

  for (const fishId of fishIds) {
    const cropEntry = cropById.get(fishId);
    const manifestEntry = manifestById.get(fishId);
    if (!cropEntry) {
      issues.push({
        level: "warning",
        message: `${fishId}: missing crop entry in fish-sprite-crops.json.`,
      });
    }
    if (!manifestEntry) {
      issues.push({
        level: "warning",
        message: `${fishId}: missing manifest entry in fish-sprite-manifest.json.`,
      });
    }

    if (cropEntry && manifestEntry && !rectsMatch(cropEntry.crop, manifestEntry.crop)) {
      issues.push({
        level: "warning",
        message: `${fishId}: crop mismatch between crop config and manifest.`,
      });
    }

    if (
      manifestEntry &&
      (manifestEntry.outputWidth !== manifestEntry.crop.width || manifestEntry.outputHeight !== manifestEntry.crop.height)
    ) {
      issues.push({
        level: "warning",
        message: `${fishId}: manifest output size does not match manifest crop size.`,
      });
    }
  }

  for (const cropEntry of crops) {
    if (isOutOfBounds(cropEntry.crop, sourceWidth, sourceHeight)) {
      issues.push({
        level: "error",
        message: `${cropEntry.id}: crop entry is out of sheet bounds.`,
      });
    }
  }
  for (const manifestEntry of manifest) {
    if (isOutOfBounds(manifestEntry.crop, sourceWidth, sourceHeight)) {
      issues.push({
        level: "error",
        message: `${manifestEntry.id}: manifest crop is out of sheet bounds.`,
      });
    }
  }

  return issues;
}

function isOutOfBounds(rect: FishSpriteCropRect, sourceWidth: number, sourceHeight: number): boolean {
  return rect.x + rect.width > sourceWidth || rect.y + rect.height > sourceHeight;
}

function renderSummary(
  crops: FishSpriteCropEntry[],
  manifest: FishSpriteManifestEntry[],
  issues: ValidationIssue[],
  sourceImageEl: HTMLImageElement,
): void {
  const errors = issues.filter((issue) => issue.level === "error").length;
  const warnings = issues.filter((issue) => issue.level === "warning").length;
  const statusClass = errors > 0 ? "fish-lab-severity-error" : warnings > 0 ? "fish-lab-severity-warning" : "fish-lab-severity-ok";
  const fishCount = getFishIds(crops, manifest).length;

  summaryEl.innerHTML = [
    "<div class=\"fish-lab-metrics\">",
    `<span><strong>${fishCount}</strong> fish IDs</span>`,
    `<span><strong>${crops.length}</strong> crop rows</span>`,
    `<span><strong>${manifest.length}</strong> manifest rows</span>`,
    `<span><strong>${sourceImageEl.naturalWidth}×${sourceImageEl.naturalHeight}</strong> source sheet</span>`,
    `<span class="${statusClass}"><strong>${errors}</strong> errors / <strong>${warnings}</strong> warnings</span>`,
    "</div>",
  ].join("");
}

function renderIssues(issues: ValidationIssue[]): void {
  errorsEl.innerHTML = "";
  if (issues.length === 0) {
    return;
  }

  const errorIssues = issues.filter((issue) => issue.level === "error");
  const warningIssues = issues.filter((issue) => issue.level === "warning");

  if (errorIssues.length > 0) {
    const card = document.createElement("article");
    card.className = "fish-lab-error-card";
    card.innerHTML = [
      "<strong>Errors</strong>",
      ...errorIssues.map((issue) => `<p class="fish-lab-json-error">${escapeHtml(issue.message)}</p>`),
    ].join("");
    errorsEl.append(card);
  }

  if (warningIssues.length > 0) {
    const card = document.createElement("article");
    card.className = "fish-lab-warning-card";
    card.innerHTML = [
      "<strong>Warnings</strong>",
      ...warningIssues.map((issue) => `<p class="fish-lab-json-error">${escapeHtml(issue.message)}</p>`),
    ].join("");
    errorsEl.append(card);
  }
}

function renderSheetOverlay(crops: FishSpriteCropEntry[], manifest: FishSpriteManifestEntry[], sourceImageEl: HTMLImageElement): void {
  const sourceWidth = sourceImageEl.naturalWidth;
  const sourceHeight = sourceImageEl.naturalHeight;
  const displayWidth = Math.min(sourceWidth, SHEET_MAX_WIDTH);
  const scale = displayWidth / sourceWidth;
  const displayHeight = Math.round(sourceHeight * scale);
  const dpr = window.devicePixelRatio || 1;

  sheetCanvasEl.width = Math.round(displayWidth * dpr);
  sheetCanvasEl.height = Math.round(displayHeight * dpr);
  sheetCanvasEl.style.width = `${displayWidth}px`;
  sheetCanvasEl.style.height = `${displayHeight}px`;

  const ctx = sheetCanvasEl.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(sourceImageEl, 0, 0, displayWidth, displayHeight);

  const cropById = new Map(crops.map((entry) => [entry.id, entry]));
  const manifestById = new Map(manifest.map((entry) => [entry.id, entry]));
  const fishIds = getFishIds(crops, manifest);

  for (let index = 0; index < fishIds.length; index += 1) {
    const fishId = fishIds[index];
    const color = OUTLINE_COLORS[index % OUTLINE_COLORS.length];
    const cropRect = cropById.get(fishId)?.crop ?? null;
    const manifestRect = manifestById.get(fishId)?.crop ?? null;

    if (cropRect) {
      drawRect(ctx, cropRect, fishId, color, scale, false);
    }
    if (manifestRect) {
      drawRect(ctx, manifestRect, fishId, color, scale, true);
    }
  }
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  rect: FishSpriteCropRect,
  label: string,
  color: string,
  scale: number,
  dashed: boolean,
): void {
  const left = rect.x * scale;
  const top = rect.y * scale;
  const width = rect.width * scale;
  const height = rect.height * scale;

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  if (dashed) {
    ctx.setLineDash([6, 5]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.strokeRect(left, top, width, height);

  ctx.setLineDash([]);
  ctx.font = "12px 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";
  const textWidth = ctx.measureText(label).width + 8;
  const textY = Math.max(14, top - 2);
  ctx.fillStyle = color;
  ctx.fillRect(left, textY - 13, textWidth, 13);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, left + 4, textY - 3);
  ctx.restore();
}

function renderCards(crops: FishSpriteCropEntry[], manifest: FishSpriteManifestEntry[], sourceImageEl: HTMLImageElement): void {
  cardsEl.innerHTML = "";
  const cropById = new Map(crops.map((entry) => [entry.id, entry]));
  const manifestById = new Map(manifest.map((entry) => [entry.id, entry]));
  const fishIds = getFishIds(crops, manifest);

  for (const fishId of fishIds) {
    const cropEntry = cropById.get(fishId) ?? null;
    const manifestEntry = manifestById.get(fishId) ?? null;
    const cardEl = document.createElement("article");
    cardEl.className = "fish-lab-card";

    const problems: string[] = [];
    if (!cropEntry) {
      problems.push("Missing crop row");
    }
    if (!manifestEntry) {
      problems.push("Missing manifest row");
    }
    if (cropEntry && manifestEntry && !rectsMatch(cropEntry.crop, manifestEntry.crop)) {
      problems.push("Crop values differ");
    }
    if (
      manifestEntry &&
      (manifestEntry.outputWidth !== manifestEntry.crop.width || manifestEntry.outputHeight !== manifestEntry.crop.height)
    ) {
      problems.push("Manifest output size differs from crop size");
    }

    const headerEl = document.createElement("header");
    headerEl.className = "fish-lab-card-header";
    headerEl.innerHTML = [
      `<h3>${escapeHtml(fishId)}</h3>`,
      `<span class="fish-lab-pill">${problems.length === 0 ? "Aligned" : `${problems.length} issue(s)`}</span>`,
    ].join("");
    cardEl.append(headerEl);

    if (problems.length > 0) {
      const problemsEl = document.createElement("p");
      problemsEl.className = "fish-lab-card-problems";
      problemsEl.textContent = problems.join(" • ");
      cardEl.append(problemsEl);
    }

    const previewGridEl = document.createElement("div");
    previewGridEl.className = "fish-lab-card-previews";
    previewGridEl.append(createRectPreviewPane("Crop JSON", cropEntry?.crop ?? null, sourceImageEl));
    previewGridEl.append(createRectPreviewPane("Manifest JSON", manifestEntry?.crop ?? null, sourceImageEl));
    previewGridEl.append(createBuiltSpritePane(manifestEntry, fishId));
    cardEl.append(previewGridEl);

    cardsEl.append(cardEl);
  }
}

function createRectPreviewPane(title: string, rect: FishSpriteCropRect | null, sourceImageEl: HTMLImageElement): HTMLElement {
  const wrapperEl = document.createElement("section");
  wrapperEl.className = "fish-lab-preview";

  const titleEl = document.createElement("p");
  titleEl.className = "fish-lab-preview-title";
  titleEl.textContent = title;
  wrapperEl.append(titleEl);

  const bodyEl = document.createElement("div");
  bodyEl.className = "fish-lab-preview-body";
  wrapperEl.append(bodyEl);

  const dataEl = document.createElement("p");
  dataEl.className = "fish-lab-preview-data";
  wrapperEl.append(dataEl);

  if (!rect) {
    const emptyEl = document.createElement("span");
    emptyEl.className = "fish-lab-preview-empty";
    emptyEl.textContent = "No row";
    bodyEl.append(emptyEl);
    dataEl.textContent = "";
    return wrapperEl;
  }

  const previewCanvas = createCropPreviewCanvas(rect, sourceImageEl);
  bodyEl.append(previewCanvas);
  dataEl.textContent = `x:${rect.x} y:${rect.y} w:${rect.width} h:${rect.height}`;
  return wrapperEl;
}

function createBuiltSpritePane(manifestEntry: FishSpriteManifestEntry | null, fishId: string): HTMLElement {
  const wrapperEl = document.createElement("section");
  wrapperEl.className = "fish-lab-preview";

  const titleEl = document.createElement("p");
  titleEl.className = "fish-lab-preview-title";
  titleEl.textContent = "Built sprite file";
  wrapperEl.append(titleEl);

  const bodyEl = document.createElement("div");
  bodyEl.className = "fish-lab-preview-body";
  wrapperEl.append(bodyEl);

  const dataEl = document.createElement("p");
  dataEl.className = "fish-lab-preview-data";
  wrapperEl.append(dataEl);

  const fileName = manifestEntry?.fileName ?? `${fishId}.png`;
  const imageEl = document.createElement("img");
  imageEl.loading = "lazy";
  imageEl.decoding = "async";
  imageEl.alt = `${fishId} sprite`;
  imageEl.src = `${BUILT_SPRITE_DIR}/${fileName}?t=${Date.now()}`;

  imageEl.addEventListener(
    "error",
    () => {
      bodyEl.innerHTML = "";
      const emptyEl = document.createElement("span");
      emptyEl.className = "fish-lab-preview-empty";
      emptyEl.textContent = "File missing";
      bodyEl.append(emptyEl);
    },
    { once: true },
  );

  bodyEl.append(imageEl);
  dataEl.textContent = fileName;
  return wrapperEl;
}

function createCropPreviewCanvas(rect: FishSpriteCropRect, sourceImageEl: HTMLImageElement): HTMLCanvasElement {
  const scale = Math.min(2.5, Math.max(1, Math.floor(165 / Math.max(rect.width, rect.height))));
  const canvasEl = document.createElement("canvas");
  canvasEl.width = rect.width * scale;
  canvasEl.height = rect.height * scale;
  const ctx = canvasEl.getContext("2d");
  if (!ctx) {
    return canvasEl;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sourceImageEl,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width * scale,
    rect.height * scale,
  );
  return canvasEl;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function updateTimestamp(loadedAt: Date): void {
  updatedAtEl.textContent = `Loaded ${loadedAt.toLocaleTimeString()}`;
}

function renderRuntimeError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  errorsEl.innerHTML = `<article class="fish-lab-error-card"><strong>Load failed</strong><p class="fish-lab-json-error">${escapeHtml(
    message,
  )}</p></article>`;
}

async function refreshData(): Promise<void> {
  if (isRefreshing) {
    return;
  }

  isRefreshing = true;
  try {
    const [imageEl, records] = await Promise.all([loadSourceImage(), loadData()]);
    const issues = createValidationIssues(records.crops, records.manifest, imageEl.naturalWidth, imageEl.naturalHeight);
    renderSummary(records.crops, records.manifest, issues, imageEl);
    renderIssues(issues);
    renderSheetOverlay(records.crops, records.manifest, imageEl);
    renderCards(records.crops, records.manifest, imageEl);
    updateTimestamp(new Date());
  } catch (error) {
    renderRuntimeError(error);
  } finally {
    isRefreshing = false;
  }
}

function syncAutoRefreshState(): void {
  if (autoRefreshEl.checked) {
    if (autoRefreshHandle !== null) {
      return;
    }

    autoRefreshHandle = window.setInterval(() => {
      void refreshData();
    }, AUTO_REFRESH_MS);
    return;
  }

  if (autoRefreshHandle !== null) {
    window.clearInterval(autoRefreshHandle);
    autoRefreshHandle = null;
  }
}

reloadButtonEl.addEventListener("click", () => {
  void refreshData();
});

autoRefreshEl.addEventListener("change", () => {
  syncAutoRefreshState();
});

window.addEventListener("resize", () => {
  void refreshData();
});

syncAutoRefreshState();
void refreshData();
