import type { RecipeBookState, ShopState, Workstation } from "./types";

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

export function createShopState(): ShopState {
  return {
    workstation: createWorkstation(),
    recipeBook: createRecipeBookState(),
  };
}
