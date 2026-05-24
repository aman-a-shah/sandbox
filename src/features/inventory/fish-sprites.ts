import fishSpriteManifest from "./fish-sprite-manifest.json";
import fishSpriteAssignments from "./fish-sprite-assignments.json";

export interface FishSpriteCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FishSpriteManifestEntry {
  id: string;
  fileName: string;
  crop: FishSpriteCropRect;
  outputWidth: number;
  outputHeight: number;
}

export interface FishSpriteAssignment {
  fishId: string;
  spriteId: string;
}

const parsedFishSpriteManifest = fishSpriteManifest as FishSpriteManifestEntry[];
const parsedFishSpriteAssignments = fishSpriteAssignments as FishSpriteAssignment[];

const fishSpriteManifestById = new Map(parsedFishSpriteManifest.map((entry) => [entry.id, entry]));
const fishSpriteAssignmentByFishId = new Map(parsedFishSpriteAssignments.map((entry) => [entry.fishId, entry.spriteId]));

export const FISH_SPRITE_MANIFEST: readonly FishSpriteManifestEntry[] = parsedFishSpriteManifest;
export const FISH_SPRITE_ASSIGNMENTS: readonly FishSpriteAssignment[] = parsedFishSpriteAssignments;
export const FISH_SPRITE_IDS: readonly string[] = parsedFishSpriteManifest.map((entry) => entry.id);

export function getFishSpriteManifestEntry(fishId: string): FishSpriteManifestEntry | null {
  const manifestEntry = fishSpriteManifestById.get(fishId);
  if (manifestEntry) {
    return manifestEntry;
  }

  const assignedSpriteId = fishSpriteAssignmentByFishId.get(fishId);
  if (!assignedSpriteId) {
    return null;
  }

  return fishSpriteManifestById.get(assignedSpriteId) ?? null;
}

export function getFishSpritePublicPath(sprite: FishSpriteManifestEntry): string {
  return `/sprites-clean/fishes/${sprite.fileName}`;
}
