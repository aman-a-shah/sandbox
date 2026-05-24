import { escapeHtml } from "../../core/utils";
import { BASE_CONSTANTS } from "../base";
import type { BaseState } from "../base";
import { RECIPES_PER_SPREAD, WORKSTATION_INTERACT_TILE_DISTANCE } from "./constants";
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

export function drawSaleTable(
  renderCtx: CanvasRenderingContext2D,
  currentSceneId: BaseState["currentSceneId"],
  saleTable: Workstation,
  camera: BaseState["camera"],
): void {
  if (currentSceneId !== saleTable.sceneId) {
    return;
  }

  const tile = BASE_CONSTANTS.TILE_SIZE;
  const x = saleTable.tileX * tile - camera.x - tile * 1.1;
  const y = saleTable.tileY * tile - camera.y - tile * 0.45;
  const width = tile * 2.2;
  const height = tile * 1.1;

  renderCtx.fillStyle = "#6b3e29";
  renderCtx.fillRect(x, y, width, height);
  renderCtx.strokeStyle = "#2f1b16";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  renderCtx.strokeRect(x, y, width, height);
  renderCtx.fillStyle = "#f2ddb4";
  renderCtx.fillRect(x + tile * 0.16, y + tile * 0.18, width - tile * 0.32, tile * 0.18);
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

export function isPlayerNearSaleTable(baseState: BaseState, saleTable: Workstation): boolean {
  if (baseState.currentSceneId !== saleTable.sceneId) {
    return false;
  }

  const playerTileX = Math.floor(baseState.player.x / BASE_CONSTANTS.TILE_SIZE);
  const playerTileY = Math.floor(baseState.player.y / BASE_CONSTANTS.TILE_SIZE);
  const tileDistance = Math.abs(playerTileX - saleTable.tileX) + Math.abs(playerTileY - saleTable.tileY);
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

export function getSelectedRecipe(state: RecipeBookState): RecipeStub | null {
  return state.selectedRecipeId === null ? null : state.availableRecipes.find((recipe) => recipe.id === state.selectedRecipeId) ?? null;
}

function renderRecipeDetails(recipe: RecipeStub | null, detailsEl: HTMLDivElement): void {
  if (!recipe) {
    detailsEl.innerHTML = "<p class=\"recipe-book-empty\">Catch fish to discover recipes.</p>";
    return;
  }

  const metaLines = [
    `Ready in ${recipe.cookTimeMinutes || "?"} min`,
    recipe.servingsLabel,
    recipe.availabilityLabel,
    `Cost: $${recipe.craftCost.toFixed(2)}`,
  ].filter(Boolean);

  const nutritionMarkup =
    recipe.nutritionLines.length > 0
      ? `<ul class="recipe-detail-list">${recipe.nutritionLines
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul>`
      : "<p class=\"recipe-book-muted\">No nutrition facts available.</p>";

  const ingredientsMarkup =
    recipe.ingredients.length > 0
      ? `<ul class="recipe-detail-list">${recipe.ingredients
          .map((ingredient) => {
            const content = escapeHtml(ingredient.text);
            return ingredient.isRequiredFishIngredient ? `<li><strong>${content}</strong></li>` : `<li>${content}</li>`;
          })
          .join("")}</ul>`
      : "<p class=\"recipe-book-muted\">No ingredient list available.</p>";

  detailsEl.innerHTML = [
    `<h3 class="recipe-detail-title">${escapeHtml(recipe.name)}</h3>`,
    `<p class="recipe-detail-fish">${escapeHtml(recipe.requiredFishName)}</p>`,
    `<div class="recipe-detail-meta">${metaLines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</div>`,
    `<section class="recipe-detail-section"><h4>Ingredients</h4>${ingredientsMarkup}</section>`,
    `<section class="recipe-detail-section"><h4>Nutrition Facts</h4>${nutritionMarkup}</section>`,
    `<section class="recipe-detail-section"><h4>Instructions</h4>${
      recipe.instructions ? `<p class="recipe-detail-instructions">${escapeHtml(recipe.instructions)}</p>` : '<p class="recipe-book-muted">No instructions available.</p>'
    }</section>`,
  ].join("");
}

export function renderRecipeBook(state: RecipeBookState, domRefs: ShopDomRefs): void {
  const pageCount = getRecipeBookPageCount(state);
  state.currentPage = Math.min(Math.max(state.currentPage, 0), pageCount - 1);
  const pageRecipes = getRecipesForPage(state, state.currentPage);
  const selectedRecipeIsOnPage = pageRecipes.some((recipe) => recipe.id === state.selectedRecipeId);
  if (!selectedRecipeIsOnPage) {
    state.selectedRecipeId = pageRecipes[0]?.id ?? null;
  }
  const selectedRecipe = getSelectedRecipe(state);

  domRefs.recipeBookGridEl.innerHTML = "";

  if (state.availableRecipes.length === 0) {
    domRefs.recipeBookPageIndicatorEl.textContent = "Page 1 / 1";
    domRefs.recipeBookPrevButtonEl.disabled = true;
    domRefs.recipeBookNextButtonEl.disabled = true;
    domRefs.recipeBookCookButtonEl.disabled = true;
    domRefs.recipeBookCookButtonEl.textContent = "Cook";
    renderRecipeDetails(null, domRefs.recipeBookDetailsEl);
    return;
  }

  for (const recipe of pageRecipes) {
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
      `<p class="recipe-card-fish">${recipe.currentFishQuantity}/${recipe.requiredFishQuantity} ${escapeHtml(recipe.requiredFishName)} • $${recipe.craftCost.toFixed(2)}</p>`,
    ].join("");

    cardButtonEl.addEventListener("click", () => {
      state.selectedRecipeId = recipe.id;
      renderRecipeBook(state, domRefs);
    });

    domRefs.recipeBookGridEl.append(cardButtonEl);
  }

  domRefs.recipeBookPageIndicatorEl.textContent = `Page ${state.currentPage + 1} / ${pageCount}`;
  domRefs.recipeBookPrevButtonEl.disabled = state.currentPage <= 0;
  domRefs.recipeBookNextButtonEl.disabled = state.currentPage >= pageCount - 1;
  const recipeForDetails = selectedRecipe ?? pageRecipes[0] ?? null;
  domRefs.recipeBookCookButtonEl.disabled = !recipeForDetails?.isCraftable;
  domRefs.recipeBookCookButtonEl.textContent = recipeForDetails?.isCraftable
    ? `Cook ($${recipeForDetails.craftCost.toFixed(2)})`
    : recipeForDetails && !recipeForDetails.hasRequiredFish
      ? "Need More Fish"
      : "Not Enough Cash";
  renderRecipeDetails(recipeForDetails, domRefs.recipeBookDetailsEl);
}
