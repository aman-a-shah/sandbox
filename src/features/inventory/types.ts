export type FishRarity = "Common" | "Uncommon" | "Rare" | "Legendary";

export interface PlaceholderFishDefinition {
  id: string;
  name: string;
  scientificName: string;
  region: string;
  rarity: FishRarity;
  value: number;
  placeholderVisual: string;
}

export interface InventorySlot {
  slotIndex: number;
  fish: PlaceholderFishDefinition | null;
}

export interface InventoryState {
  isOpen: boolean;
  selectedSlotIndex: number | null;
  slots: InventorySlot[];
}

export interface AddFishResult {
  added: boolean;
  slotIndex: number | null;
}

export interface InventoryDomRefs {
  toggleButtonEl: HTMLButtonElement;
  overlayEl: HTMLElement;
  gridEl: HTMLDivElement;
  detailsEl: HTMLDivElement;
  capacityEl: HTMLElement;
}
