import type { AddFishResult, InventoryFishDefinition, InventoryFoodDefinition, InventoryItemDefinition, InventoryState, InventoryView } from "./types";

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
  return state.slots.reduce((count, slot) => count + (slot.item ? 1 : 0), 0);
}

export function selectInventorySlot(state: InventoryState, slotIndex: number): void {
  if (slotIndex < 0 || slotIndex >= state.slots.length) {
    return;
  }

  const selectedSlot = state.slots[slotIndex];
  state.selectedSlotIndex = selectedSlot.item ? slotIndex : null;
}

export function getSelectedInventoryItem(state: InventoryState): InventoryItemDefinition | null {
  if (state.activeView === "discovered") {
    return state.discoveredFish.find((fish) => fish.id === state.selectedDiscoveredFishId) ?? null;
  }

  if (state.selectedSlotIndex === null) {
    return null;
  }

  const selectedSlot = state.slots[state.selectedSlotIndex];
  return selectedSlot?.item ?? null;
}

export function getInventoryFish(state: InventoryState): InventoryFishDefinition[] {
  return state.slots.flatMap((slot) => (slot.item?.kind === "fish" ? [slot.item] : []));
}

export function getInventoryFood(state: InventoryState): InventoryFoodDefinition[] {
  return state.slots.flatMap((slot) => (slot.item?.kind === "food" ? [slot.item] : []));
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
  return tryAddItemToInventory(state, fish);
}

export function tryAddFoodToInventory(state: InventoryState, food: InventoryFoodDefinition): AddFishResult {
  return tryAddItemToInventory(state, food);
}

export function tryAddItemToInventory(state: InventoryState, item: InventoryItemDefinition): AddFishResult {
  const openSlot = state.slots.find((slot) => slot.item === null);
  if (!openSlot) {
    return { added: false, slotIndex: null };
  }

  openSlot.item = item;
  if (state.selectedSlotIndex === null) {
    state.selectedSlotIndex = openSlot.slotIndex;
  }

  return { added: true, slotIndex: openSlot.slotIndex };
}

export function removeFishFromInventory(
  state: InventoryState,
  matcher: (fish: InventoryFishDefinition) => boolean,
  count: number,
): number {
  let removedCount = 0;

  for (const slot of state.slots) {
    if (removedCount >= count) {
      break;
    }

    if (slot.item?.kind !== "fish") {
      continue;
    }

    if (!matcher(slot.item)) {
      continue;
    }

    slot.item = null;
    removedCount += 1;
  }

  if (state.selectedSlotIndex !== null && state.slots[state.selectedSlotIndex]?.item === null) {
    state.selectedSlotIndex = state.slots.find((slot) => slot.item !== null)?.slotIndex ?? null;
  }

  return removedCount;
}
