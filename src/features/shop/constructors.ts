import type { RecipeBookState, ShopState, Workstation } from "./types";

export function createWorkstation(): Workstation {
  return {
    sceneId: "shop",
    tileX: 15,
    tileY: 10,
  };
}

export function createRecipeBookState(): RecipeBookState {
  return {
    isOpen: false,
    currentPage: 0,
    selectedRecipeId: null,
  };
}

export function createShopState(): ShopState {
  return {
    workstation: createWorkstation(),
    recipeBook: createRecipeBookState(),
  };
}
