export type FishRarity = "Common" | "Uncommon" | "Rare" | "Legendary";

export interface InventoryFoodDefinition {
  kind: "food";
  id: string;
  recipeId: string;
  name: string;
  rarity: FishRarity;
  value: number;
  placeholderVisual: string;
  requiredFishName: string;
  servingsLabel: string;
  cookTimeMinutes: number;
  calories: number | null;
  summary: string | null;
}

export interface InventoryFishDefinition {
  kind: "fish";
  id: string;
  name: string;
  scientificName: string;
  region: string;
  rarity: FishRarity;
  value: number;
  placeholderVisual: string;
  family: string | null;
  order: string | null;
  aphiaId: string | null;
  marlinSpeciesId: string | null;
  marlinUrl: string | null;
  fishBaseSummaryUrl: string | null;
  fishBaseEnvironment: string | null;
  fishBaseEcology: string | null;
  sizeCategory: string | null;
  averageDepthMeters: number | null;
  fishBaseCommonLengthCm: number | null;
  wormsDistributionCount: number | null;
  wormsDistributionSummary: string[];
  habitatFitPercent: number | null;
  likelyCatchPercent: number;
  observedSpeciesRecordPercent: number | null;
  fishingActivityAssociatedPercent: number | null;
  habitatName: string;
  habitatDepthZone: string | null;
  habitatSubstratum: string[];
}

export type PlaceholderFishDefinition = InventoryFishDefinition;
export type InventoryItemDefinition = InventoryFishDefinition | InventoryFoodDefinition;

export interface InventorySlot {
  slotIndex: number;
  item: InventoryItemDefinition | null;
}

export type InventoryView = "bag" | "discovered";

export interface InventoryState {
  isOpen: boolean;
  activeView: InventoryView;
  selectedSlotIndex: number | null;
  selectedDiscoveredFishId: string | null;
  slots: InventorySlot[];
  discoveredFish: InventoryFishDefinition[];
}

export interface AddFishResult {
  added: boolean;
  slotIndex: number | null;
}

export interface InventoryDomRefs {
  toggleButtonEl: HTMLButtonElement;
  bagTabButtonEl: HTMLButtonElement;
  discoveredTabButtonEl: HTMLButtonElement;
  overlayEl: HTMLElement;
  gridEl: HTMLDivElement;
  detailsEl: HTMLDivElement;
  capacityEl: HTMLElement;
}
