import type { SceneId } from "../base/types";

export interface Workstation {
  sceneId: SceneId;
  tileX: number;
  tileY: number;
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
  calories: number | null;
  instructions: string | null;
  isCraftable: boolean;
  missingRequiredFishCount: number;
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
  recipeBook: RecipeBookState;
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
