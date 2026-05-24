import { INVENTORY_CAPACITY } from "./constants";
import type { InventorySlot, InventoryState } from "./types";

export function createInventoryState(capacity = INVENTORY_CAPACITY): InventoryState {
  const slots: InventorySlot[] = Array.from({ length: capacity }, (_, index) => ({
    slotIndex: index,
    item: null,
  }));

  return {
    isOpen: false,
    activeView: "bag",
    interactionMode: "default",
    selectedSlotIndex: null,
    selectedDiscoveredFishId: null,
    slots,
    discoveredFish: [],
  };
}
