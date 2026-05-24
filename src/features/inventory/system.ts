import { PLACEHOLDER_FISH_CATALOG } from "./catalog";
import type { AddFishResult, InventoryState, PlaceholderFishDefinition } from "./types";

export function toggleInventoryOpen(state: InventoryState): boolean {
  state.isOpen = !state.isOpen;
  return state.isOpen;
}

export function setInventoryOpen(state: InventoryState, isOpen: boolean): void {
  state.isOpen = isOpen;
}

export function getInventoryUsedSlots(state: InventoryState): number {
  return state.slots.reduce((count, slot) => count + (slot.fish ? 1 : 0), 0);
}

export function selectInventorySlot(state: InventoryState, slotIndex: number): void {
  if (slotIndex < 0 || slotIndex >= state.slots.length) {
    return;
  }

  const selectedSlot = state.slots[slotIndex];
  state.selectedSlotIndex = selectedSlot.fish ? slotIndex : null;
}

export function getSelectedInventoryFish(state: InventoryState): PlaceholderFishDefinition | null {
  if (state.selectedSlotIndex === null) {
    return null;
  }

  const selectedSlot = state.slots[state.selectedSlotIndex];
  return selectedSlot?.fish ?? null;
}

export function getRandomPlaceholderFish(): PlaceholderFishDefinition {
  const randomIndex = Math.floor(Math.random() * PLACEHOLDER_FISH_CATALOG.length);
  const source = PLACEHOLDER_FISH_CATALOG[randomIndex] ?? PLACEHOLDER_FISH_CATALOG[0];

  return { ...source };
}

export function tryAddFishToInventory(state: InventoryState, fish: PlaceholderFishDefinition): AddFishResult {
  const openSlot = state.slots.find((slot) => slot.fish === null);
  if (!openSlot) {
    return { added: false, slotIndex: null };
  }

  openSlot.fish = fish;
  if (state.selectedSlotIndex === null) {
    state.selectedSlotIndex = openSlot.slotIndex;
  }

  return { added: true, slotIndex: openSlot.slotIndex };
}
