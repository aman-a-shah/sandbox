import type { InventorySlot } from "../inventory/types";
import type { RecipeBookState, ShopCustomerState, ShopState, Workstation } from "./types";

export function createWorkstation(): Workstation {
  return {
    sceneId: "shop",
    tileX: 13,
    tileY: 9,
  };
}

export function createRecipeBookState(): RecipeBookState {
  return {
    isOpen: false,
    currentPage: 0,
    selectedRecipeId: null,
    availableRecipes: [],
  };
}

export function createSaleTable(): Workstation {
  return {
    sceneId: "shop",
    tileX: 13,
    tileY: 13,
  };
}

export function createShopCustomerState(): ShopCustomerState {
  return {
    isActive: false,
    x: 0,
    y: 0,
    state: "arriving",
    patienceRemaining: 30,
    purchaseTimer: 0,
  };
}

export function createSaleTableSlots(capacity = 5): InventorySlot[] {
  return Array.from({ length: capacity }, (_, index) => ({
    slotIndex: index,
    item: null,
  }));
}

export function createShopState(): ShopState {
  return {
    workstation: createWorkstation(),
    saleTable: createSaleTable(),
    recipeBook: createRecipeBookState(),
    isSaleManagementOpen: false,
    saleTableSlots: createSaleTableSlots(),
    customer: createShopCustomerState(),
    customerSpawnTimer: 20,
    gameElapsedSeconds: 0,
  };
}
