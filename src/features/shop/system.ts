import { escapeHtml } from "../../core/utils";
import { BASE_CONSTANTS } from "../base";
import type { BaseState } from "../base";
import { RECIPES_PER_COLUMN, RECIPE_COLUMNS_PER_SPREAD, RECIPES_PER_SPREAD, WORKSTATION_INTERACT_TILE_DISTANCE } from "./constants";
import type { RecipeBookState, RecipeStub, ShopDomRefs, Workstation } from "./types";

const cookingTableUrl = "/sprites-clean/cooking_table_transparent.png";
const cookingTableImage = new Image();
cookingTableImage.src = cookingTableUrl;

export function drawWorkstation(
  renderCtx: CanvasRenderingContext2D,
  currentSceneId: BaseState["currentSceneId"],
  workstation: Workstation,
  camera: BaseState["camera"],
): void {
  if (currentSceneId !== workstation.sceneId) {
    return;
  }

  const screenX = workstation.tileX * BASE_CONSTANTS.TILE_SIZE - camera.x;
  const screenY = workstation.tileY * BASE_CONSTANTS.TILE_SIZE - camera.y;
  const drawWidth = BASE_CONSTANTS.TILE_SIZE * 5;
  const drawHeight = BASE_CONSTANTS.TILE_SIZE * 4;
  const drawX = screenX - BASE_CONSTANTS.TILE_SIZE * 2;
  const drawY = screenY - BASE_CONSTANTS.TILE_SIZE * 3;

  if (cookingTableImage.complete) {
    renderCtx.drawImage(cookingTableImage, 360, 365, 540, 445, drawX, drawY, drawWidth, drawHeight);
    return;
  }

  renderCtx.fillStyle = "#9a642f";
  renderCtx.fillRect(drawX, drawY + BASE_CONSTANTS.TILE_SIZE, drawWidth, BASE_CONSTANTS.TILE_SIZE * 2);
  renderCtx.strokeStyle = "rgba(60, 46, 33, 0.7)";
  renderCtx.strokeRect(drawX, drawY + BASE_CONSTANTS.TILE_SIZE, drawWidth, BASE_CONSTANTS.TILE_SIZE * 2);
}

export function isPlayerNearWorkstation(baseState: BaseState, workstation: Workstation): boolean {
  if (baseState.currentSceneId !== workstation.sceneId) {
    return false;
  }

  const playerTileX = Math.floor(baseState.player.x / BASE_CONSTANTS.TILE_SIZE);
  const playerTileY = Math.floor(baseState.player.y / BASE_CONSTANTS.TILE_SIZE);
  const tileDistance = Math.abs(playerTileX - workstation.tileX) + Math.abs(playerTileY - workstation.tileY);
  return tileDistance <= WORKSTATION_INTERACT_TILE_DISTANCE;
}

export function updateWorkstationPrompt(
  workstationPromptEl: HTMLElement,
  recipeBookState: RecipeBookState,
  inventoryIsOpen: boolean,
  playerNearWorkstation: boolean,
): void {
  const shouldShow = !recipeBookState.isOpen && !inventoryIsOpen && playerNearWorkstation;
  workstationPromptEl.classList.toggle("is-hidden", !shouldShow);
}

export function openRecipeBook(state: RecipeBookState, domRefs: ShopDomRefs): void {
  if (state.isOpen) {
    return;
  }

  state.isOpen = true;
  domRefs.recipeBookOverlayEl.classList.remove("is-hidden");
  domRefs.recipeBookOverlayEl.setAttribute("aria-hidden", "false");
}

export function closeRecipeBook(state: RecipeBookState, domRefs: ShopDomRefs): void {
  if (!state.isOpen) {
    return;
  }

  state.isOpen = false;
  domRefs.recipeBookOverlayEl.classList.add("is-hidden");
  domRefs.recipeBookOverlayEl.setAttribute("aria-hidden", "true");
}

export function setRecipeBookRecipes(state: RecipeBookState, recipes: RecipeStub[]): void {
  state.availableRecipes = recipes;
  const hasSelection = recipes.some((recipe) => recipe.id === state.selectedRecipeId);
  if (!hasSelection) {
    state.selectedRecipeId = recipes[0]?.id ?? null;
  }

  const pageCount = getRecipeBookPageCount(state);
  state.currentPage = Math.min(state.currentPage, pageCount - 1);
}

export function getRecipeBookPageCount(state: RecipeBookState): number {
  return Math.max(1, Math.ceil(state.availableRecipes.length / RECIPES_PER_SPREAD));
}

function getRecipesForPage(state: RecipeBookState, pageIndex: number): RecipeStub[] {
  const clampedPage = Math.min(Math.max(pageIndex, 0), getRecipeBookPageCount(state) - 1);
  const startIndex = clampedPage * RECIPES_PER_SPREAD;
  return state.availableRecipes.slice(startIndex, startIndex + RECIPES_PER_SPREAD);
}

export function renderRecipeBook(state: RecipeBookState, domRefs: ShopDomRefs): void {
  const pageCount = getRecipeBookPageCount(state);
  state.currentPage = Math.min(Math.max(state.currentPage, 0), pageCount - 1);
  const pageRecipes = getRecipesForPage(state, state.currentPage);
  const selectedRecipe =
    state.selectedRecipeId === null ? null : state.availableRecipes.find((recipe) => recipe.id === state.selectedRecipeId) ?? null;

  domRefs.recipeBookGridEl.innerHTML = "";

  if (state.availableRecipes.length === 0) {
    domRefs.recipeBookPageIndicatorEl.textContent = "Page 1 / 1";
    domRefs.recipeBookPrevButtonEl.disabled = true;
    domRefs.recipeBookNextButtonEl.disabled = true;
    domRefs.recipeBookSelectionStatusEl.textContent = "Catch fish to discover recipes from the generated recipe file.";
    return;
  }

  for (let columnIndex = 0; columnIndex < RECIPE_COLUMNS_PER_SPREAD; columnIndex += 1) {
    const columnEl = document.createElement("div");
    columnEl.className = "recipe-column";
    const columnStart = columnIndex * RECIPES_PER_COLUMN;
    const columnRecipes = pageRecipes.slice(columnStart, columnStart + RECIPES_PER_COLUMN);

    for (const recipe of columnRecipes) {
      const cardButtonEl = document.createElement("button");
      cardButtonEl.type = "button";
      cardButtonEl.className = "recipe-card";
      if (!recipe.isCraftable) {
        cardButtonEl.classList.add("is-locked");
      }
      if (state.selectedRecipeId === recipe.id) {
        cardButtonEl.classList.add("is-selected");
      }

      cardButtonEl.innerHTML = [
        `<h3 class="recipe-card-title">${escapeHtml(recipe.name)}</h3>`,
        `<p class="recipe-card-subtitle">${escapeHtml(recipe.subtitle)}</p>`,
        `<p class="recipe-card-time">Needs ${recipe.requiredFishQuantity} ${escapeHtml(recipe.requiredFishName)}</p>`,
        `<p class="recipe-card-time">${escapeHtml(recipe.availabilityLabel)}</p>`,
        `<p class="recipe-card-time">${recipe.cookTimeMinutes} min</p>`,
      ].join("");

      cardButtonEl.addEventListener("click", () => {
        state.selectedRecipeId = recipe.id;
        domRefs.recipeBookSelectionStatusEl.textContent = `Selected recipe: ${recipe.name}`;
        renderRecipeBook(state, domRefs);
      });

      columnEl.append(cardButtonEl);
    }

    domRefs.recipeBookGridEl.append(columnEl);
  }

  domRefs.recipeBookPageIndicatorEl.textContent = `Page ${state.currentPage + 1} / ${pageCount}`;
  domRefs.recipeBookPrevButtonEl.disabled = state.currentPage <= 0;
  domRefs.recipeBookNextButtonEl.disabled = state.currentPage >= pageCount - 1;

  if (selectedRecipe) {
    const priceText = selectedRecipe.estimatedPrice === null ? "Unknown price" : `$${selectedRecipe.estimatedPrice.toFixed(2)}`;
    const caloriesText = selectedRecipe.calories === null ? "Unknown calories" : `${selectedRecipe.calories} kcal`;
    domRefs.recipeBookSelectionStatusEl.textContent =
      `Selected recipe: ${selectedRecipe.name} • ${selectedRecipe.rarity} • ${selectedRecipe.availabilityLabel} • ${priceText} • ${caloriesText}`;
  } else {
    domRefs.recipeBookSelectionStatusEl.textContent = "Select a recipe from this spread.";
  }
}
