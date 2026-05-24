import type { InventorySlot } from "../inventory/types";
import type { SceneId } from "../base/types";

export interface Workstation {
  sceneId: SceneId;
  tileX: number;
  tileY: number;
}

export interface ShopCustomerState {
  isActive: boolean;
  x: number;
  y: number;
  state: "arriving" | "waiting" | "buying" | "leaving";
  patienceRemaining: number;
  purchaseTimer: number;
  spriteIndex: number;
  facing: "down" | "left" | "right" | "up";
  isMoving: boolean;
  animationTime: number;
  targetX: number;
  targetY: number;
}

export interface RecipeStub {
  id: string;
  name: string;
  cookTimeMinutes: number;
  requiredFishName: string;
  requiredFishScientificName: string | null;
  currentFishQuantity: number;
  requiredFishQuantity: number;
  rarity: string;
  estimatedPrice: number | null;
  craftCost: number;
  calories: number | null;
  instructions: string | null;
  hasRequiredFish: boolean;
  canAfford: boolean;
  isCraftable: boolean;
  missingRequiredFishCount: number;
  missingBalanceAmount: number;
  availabilityLabel: string;
  summary: string | null;
  dishTypes: string[];
  cuisines: string[];
  diets: string[];
  servingsLabel: string;
  nutritionLines: string[];
  ingredients: Array<{
    text: string;
    isRequiredFishIngredient: boolean;
  }>;
}

export type RecipeBookRecipe = RecipeStub;

export interface RecipeBookState {
  isOpen: boolean;
  currentPage: number;
  selectedRecipeId: string | null;
  availableRecipes: RecipeBookRecipe[];
}

export interface ShopState {
  workstation: Workstation;
  saleTable: Workstation;
  recipeBook: RecipeBookState;
  isSaleManagementOpen: boolean;
  saleTableSlots: InventorySlot[];
  customer: ShopCustomerState;
  customerSpawnTimer: number;
  gameElapsedSeconds: number;
}

export interface ShopDomRefs {
  workstationPromptEl: HTMLElement;
  recipeBookOverlayEl: HTMLElement;
  recipeBookGridEl: HTMLDivElement;
  recipeBookDetailsEl: HTMLDivElement;
  recipeBookCookButtonEl: HTMLButtonElement;
  recipeBookCloseButtonEl: HTMLButtonElement;
  recipeBookPrevButtonEl: HTMLButtonElement;
  recipeBookNextButtonEl: HTMLButtonElement;
  recipeBookPageIndicatorEl: HTMLElement;
}
