import type { AddFishResult, InventoryFishDefinition, InventoryState, InventoryView } from "./types";

export function toggleInventoryOpen(state: InventoryState): boolean {
  state.isOpen = !state.isOpen;
  return state.isOpen;
}

export function setInventoryOpen(state: InventoryState, isOpen: boolean): void {
  state.isOpen = isOpen;
}

export function setInventoryView(state: InventoryState, view: InventoryView): void {
  state.activeView = view;
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

export function getSelectedInventoryFish(state: InventoryState): InventoryFishDefinition | null {
  if (state.activeView === "discovered") {
    return state.discoveredFish.find((fish) => fish.id === state.selectedDiscoveredFishId) ?? null;
  }

  if (state.selectedSlotIndex === null) {
    return null;
  }

  const selectedSlot = state.slots[state.selectedSlotIndex];
  return selectedSlot?.fish ?? null;
}

export function getInventoryFish(state: InventoryState): InventoryFishDefinition[] {
  return state.slots.flatMap((slot) => (slot.fish ? [slot.fish] : []));
}

export function getDiscoveredFish(state: InventoryState): InventoryFishDefinition[] {
  return state.discoveredFish.map((fish) => ({ ...fish }));
}

export function selectDiscoveredFish(state: InventoryState, fishId: string): void {
  if (!state.discoveredFish.some((fish) => fish.id === fishId)) {
    return;
  }

  state.selectedDiscoveredFishId = fishId;
}

export function registerDiscoveredFish(state: InventoryState, fish: InventoryFishDefinition): void {
  const alreadyDiscovered = state.discoveredFish.some((entry) => entry.id === fish.id);
  if (alreadyDiscovered) {
    return;
  }

  state.discoveredFish.push({ ...fish });
  state.discoveredFish.sort((left, right) => left.name.localeCompare(right.name));

  if (state.selectedDiscoveredFishId === null) {
    state.selectedDiscoveredFishId = fish.id;
  }
}

export function tryAddFishToInventory(state: InventoryState, fish: InventoryFishDefinition): AddFishResult {
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
