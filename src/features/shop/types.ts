import type { SceneId } from "../base/types";

export interface Workstation {
  sceneId: SceneId;
  tileX: number;
  tileY: number;
}

export interface RecipeStub {
  id: string;
  name: string;
  subtitle: string;
  cookTimeMinutes: number;
}

export interface RecipeBookState {
  isOpen: boolean;
  currentPage: number;
  selectedRecipeId: string | null;
}

export interface ShopState {
  workstation: Workstation;
  recipeBook: RecipeBookState;
}

export interface ShopDomRefs {
  workstationPromptEl: HTMLElement;
  recipeBookOverlayEl: HTMLElement;
  recipeBookGridEl: HTMLDivElement;
  recipeBookCloseButtonEl: HTMLButtonElement;
  recipeBookPrevButtonEl: HTMLButtonElement;
  recipeBookNextButtonEl: HTMLButtonElement;
  recipeBookPageIndicatorEl: HTMLElement;
  recipeBookSelectionStatusEl: HTMLElement;
}
