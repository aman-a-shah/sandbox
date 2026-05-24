import type { PlaceholderFishDefinition } from "./types";

function createCatalogFish(
  id: string,
  name: string,
  scientificName: string,
  region: string,
  rarity: PlaceholderFishDefinition["rarity"],
  value: number,
  placeholderVisual: string,
): PlaceholderFishDefinition {
  return {
    kind: "fish",
    id,
    name,
    scientificName,
    region,
    rarity,
    value,
    placeholderVisual,
    family: null,
    order: null,
    aphiaId: null,
    marlinSpeciesId: null,
    marlinUrl: null,
    fishBaseSummaryUrl: null,
    fishBaseEnvironment: null,
    fishBaseEcology: null,
    sizeCategory: null,
    averageDepthMeters: null,
    fishBaseCommonLengthCm: null,
    wormsDistributionCount: null,
    wormsDistributionSummary: [],
    habitatFitPercent: null,
    likelyCatchPercent: 0,
    observedSpeciesRecordPercent: null,
    fishingActivityAssociatedPercent: null,
    habitatName: region,
    habitatDepthZone: null,
    habitatSubstratum: [],
  };
}

export const PLACEHOLDER_FISH_CATALOG: PlaceholderFishDefinition[] = [
  createCatalogFish("sunstripe-snapper", "Sunstripe Snapper", "Snapperus aurora", "Coral Shelf", "Common", 14, "SNP"),
];
