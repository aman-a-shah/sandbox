import type { AppState } from "./app/types";
import { GAME_CONFIG } from "./core/config/gameConfig";
import { getCanvasCoordinates, mustGet2DContext, mustGetElement, resizeCanvasDisplay } from "./core/utils";
import {
  getCraftableRecipesForInventory,
  getDefaultMasterRecipes,
  getFallbackHabitatJsonPath,
  getFallbackHabitatName,
  rollRandomCatchFromFallbackHabitat,
} from "./data/generated-content";
import {
  BASE_CONSTANTS,
  centerCameraOnPlayer,
  createBaseState,
  drawMiniMap,
  drawPlayer,
  drawSceneBackgroundAndGrid,
  getMovementVector,
  getSceneIdFromMinimapClick,
  getTileKind,
  movePlayer,
  renderStatus,
  setPlayerSpawn,
  switchScene as switchBaseScene,
  toScreenPoint,
  toWorldPoint,
  updateCamera,
} from "./features/base";
import type { SceneId } from "./features/base";
import { createFishingState, drawFishingHud, drawFishingWorldLayer, handleFishingClick, isFishingInputLocked, resetFishingState, updateFishing } from "./features/fishing";
import {
  INVENTORY_CAPACITY,
  createInventoryState,
  getDiscoveredFish,
  getInventoryFish,
  getInventoryUsedSlots,
  registerDiscoveredFish,
  renderInventory,
  selectDiscoveredFish,
  setInventoryOpen,
  setInventoryView,
  syncInventoryOverlay,
  tryAddFishToInventory,
} from "./features/inventory";
import type { InventoryDomRefs } from "./features/inventory";
import { closeRecipeBook, createShopState, drawWorkstation, getRecipeBookPageCount, isPlayerNearWorkstation, openRecipeBook, renderRecipeBook, setRecipeBookRecipes, updateWorkstationPrompt } from "./features/shop";
import type { ShopDomRefs } from "./features/shop";

const canvas = mustGetElement<HTMLCanvasElement>("game-canvas");
const renderCtx = mustGet2DContext(canvas);

const debugOverlayEl = mustGetElement<HTMLElement>("debug-overlay");
const statusReadoutEl = mustGetElement<HTMLDListElement>("status-readout");

const inventoryToggleButtonEl = mustGetElement<HTMLButtonElement>("inventory-toggle");
const inventoryBagTabButtonEl = mustGetElement<HTMLButtonElement>("inventory-tab-bag");
const inventoryDiscoveredTabButtonEl = mustGetElement<HTMLButtonElement>("inventory-tab-discovered");
const inventoryOverlayEl = mustGetElement<HTMLElement>("inventory-overlay");
const inventoryCloseButtonEl = mustGetElement<HTMLButtonElement>("inventory-close");
const inventoryGridEl = mustGetElement<HTMLDivElement>("inventory-grid");
const inventoryDetailsEl = mustGetElement<HTMLDivElement>("inventory-details");
const inventoryCapacityEl = mustGetElement<HTMLElement>("inventory-capacity");

const workstationPromptEl = mustGetElement<HTMLElement>("workstation-prompt");
const recipeBookOverlayEl = mustGetElement<HTMLElement>("recipe-book-overlay");
const recipeBookGridEl = mustGetElement<HTMLDivElement>("recipe-book-grid");
const recipeBookCloseButtonEl = mustGetElement<HTMLButtonElement>("recipe-book-close");
const recipeBookPrevButtonEl = mustGetElement<HTMLButtonElement>("recipe-book-prev");
const recipeBookNextButtonEl = mustGetElement<HTMLButtonElement>("recipe-book-next");
const recipeBookPageIndicatorEl = mustGetElement<HTMLElement>("recipe-book-page-indicator");
const recipeBookSelectionStatusEl = mustGetElement<HTMLElement>("recipe-book-selection-status");

const inventoryDomRefs: InventoryDomRefs = {
  toggleButtonEl: inventoryToggleButtonEl,
  bagTabButtonEl: inventoryBagTabButtonEl,
  discoveredTabButtonEl: inventoryDiscoveredTabButtonEl,
  overlayEl: inventoryOverlayEl,
  gridEl: inventoryGridEl,
  detailsEl: inventoryDetailsEl,
  capacityEl: inventoryCapacityEl,
};

const shopDomRefs: ShopDomRefs = {
  workstationPromptEl,
  recipeBookOverlayEl,
  recipeBookGridEl,
  recipeBookCloseButtonEl,
  recipeBookPrevButtonEl,
  recipeBookNextButtonEl,
  recipeBookPageIndicatorEl,
  recipeBookSelectionStatusEl,
};

const appState: AppState = {
  base: createBaseState(),
  fishing: createFishingState(),
  inventory: createInventoryState(INVENTORY_CAPACITY),
  shop: createShopState(),
  keysDown: new Set<string>(),
  fps: 0,
  lastFrameTime: performance.now(),
};

let currentMasterRecipes = getDefaultMasterRecipes();
const pendingRecipeGenerations = new Set<string>();

document.documentElement.style.setProperty("--global-scale", String(BASE_CONSTANTS.GLOBAL_SCALE));

canvas.width = BASE_CONSTANTS.RENDER_WIDTH;
canvas.height = BASE_CONSTANTS.RENDER_HEIGHT;
renderCtx.imageSmoothingEnabled = false;

if (!GAME_CONFIG.debugMode) {
  debugOverlayEl.classList.add("is-hidden");
}

resizeCanvasDisplay(canvas, BASE_CONSTANTS.RENDER_WIDTH, BASE_CONSTANTS.RENDER_HEIGHT);
window.addEventListener("resize", () => resizeCanvasDisplay(canvas, BASE_CONSTANTS.RENDER_WIDTH, BASE_CONSTANTS.RENDER_HEIGHT));

setPlayerSpawn(appState.base, appState.base.currentSceneId);
centerCameraOnPlayer(appState.base);
refreshCraftableRecipes();
void hydrateMasterRecipes();
renderStatusReadout();
syncInventoryOverlay(inventoryDomRefs, appState.inventory);
renderInventory(inventoryDomRefs, appState.inventory);
renderRecipeBook(appState.shop.recipeBook, shopDomRefs);
updateWorkstationPromptVisibility();

window.addEventListener("keydown", (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  appState.keysDown.add(key);

  if (key === "escape") {
    if (appState.inventory.isOpen) {
      closeInventory();
      return;
    }

    if (appState.shop.recipeBook.isOpen) {
      closeRecipeBookOverlay();
      return;
    }
  }

  if (key === "e") {
    tryOpenRecipeBookFromWorkstation();
  }
});

window.addEventListener("keyup", (event: KeyboardEvent) => {
  appState.keysDown.delete(event.key.toLowerCase());
});

canvas.addEventListener("mousedown", (event: MouseEvent) => {
  if (event.button === 0) {
    appState.fishing.isReelHeld = true;
  }
});

window.addEventListener("mouseup", (event: MouseEvent) => {
  if (event.button === 0) {
    appState.fishing.isReelHeld = false;
  }
});

window.addEventListener("blur", () => {
  appState.fishing.isReelHeld = false;
  appState.keysDown.clear();
});

canvas.addEventListener("click", (event: MouseEvent) => {
  handleCanvasClick(event);
});

inventoryToggleButtonEl.addEventListener("click", () => {
  toggleInventory();
});

inventoryCloseButtonEl.addEventListener("click", closeInventory);
inventoryBagTabButtonEl.addEventListener("click", () => {
  setInventoryView(appState.inventory, "bag");
  renderInventory(inventoryDomRefs, appState.inventory);
});
inventoryDiscoveredTabButtonEl.addEventListener("click", () => {
  setInventoryView(appState.inventory, "discovered");
  const discoveredFish = getDiscoveredFish(appState.inventory);
  if (discoveredFish.length > 0 && appState.inventory.selectedDiscoveredFishId === null) {
    selectDiscoveredFish(appState.inventory, discoveredFish[0].id);
  }
  renderInventory(inventoryDomRefs, appState.inventory);
});
inventoryOverlayEl.addEventListener("click", (event: MouseEvent) => {
  if (event.target === inventoryOverlayEl) {
    closeInventory();
  }
});

recipeBookCloseButtonEl.addEventListener("click", closeRecipeBookOverlay);

recipeBookPrevButtonEl.addEventListener("click", () => {
  if (appState.shop.recipeBook.currentPage <= 0) {
    return;
  }

  appState.shop.recipeBook.currentPage -= 1;
  renderRecipeBook(appState.shop.recipeBook, shopDomRefs);
});

recipeBookNextButtonEl.addEventListener("click", () => {
  const lastPageIndex = getRecipeBookPageCount(appState.shop.recipeBook) - 1;
  if (appState.shop.recipeBook.currentPage >= lastPageIndex) {
    return;
  }

  appState.shop.recipeBook.currentPage += 1;
  renderRecipeBook(appState.shop.recipeBook, shopDomRefs);
});

requestAnimationFrame(gameLoop);

function gameLoop(timestamp: number): void {
  const dt = Math.min((timestamp - appState.lastFrameTime) / 1000, 0.033);
  appState.lastFrameTime = timestamp;
  appState.fps = Math.round(1 / dt);

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt: number): void {
  const velocity = getMovementVector(appState.keysDown, isInputLocked());
  const nextX = appState.base.player.x + velocity.x * BASE_CONSTANTS.PLAYER_SPEED * dt;
  const nextY = appState.base.player.y + velocity.y * BASE_CONSTANTS.PLAYER_SPEED * dt;

  movePlayer(appState.base, nextX, nextY);
  updateFishing(appState.fishing, dt, {
    currentSceneId: appState.base.currentSceneId,
    scenes: appState.base.scenes,
    getTileKind: (sceneId, tileX, tileY) => getTileKind(appState.base.sceneTerrains, sceneId, tileX, tileY),
    getRodOriginWorld,
    onCatchAttempt: attemptCatch,
    onCatchAdded: () => {
      refreshCraftableRecipes();
      renderInventory(inventoryDomRefs, appState.inventory);
    },
  });
  updateWorkstationPromptVisibility();

  updateCamera(appState.base);
  renderStatusReadout();
}

function render(): void {
  drawSceneBackgroundAndGrid(renderCtx, appState.base);
  drawFishingWorldLayer(renderCtx, appState.fishing, {
    currentSceneId: appState.base.currentSceneId,
    toScreenPoint: (worldPoint) => toScreenPoint(appState.base, worldPoint),
    getRodOriginWorld,
  });
  drawWorkstation(renderCtx, appState.base.currentSceneId, appState.shop.workstation, appState.base.camera);
  drawPlayer(renderCtx, appState.base);
  drawMiniMap(renderCtx, appState.base);
  drawFishingHud(renderCtx, appState.fishing, appState.base.currentSceneId);
}

function handleCanvasClick(event: MouseEvent): void {
  if (isAnyOverlayOpen()) {
    return;
  }

  const clickScreenPoint = getCanvasCoordinates(canvas, event);
  const minimapSceneId = getSceneIdFromMinimapClick(clickScreenPoint);
  if (minimapSceneId !== null) {
    if (minimapSceneId !== appState.base.currentSceneId && !isInputLocked()) {
      switchScene(minimapSceneId);
    }
    return;
  }

  if (appState.base.currentSceneId !== "ocean") {
    return;
  }

  const clickWorldPoint = toWorldPoint(appState.base, clickScreenPoint);
  handleFishingClick(appState.fishing, clickWorldPoint, {
    currentSceneId: appState.base.currentSceneId,
    scenes: appState.base.scenes,
    getTileKind: (sceneId, tileX, tileY) => getTileKind(appState.base.sceneTerrains, sceneId, tileX, tileY),
    getRodOriginWorld,
  });
}

function toggleInventory(): void {
  if (appState.inventory.isOpen) {
    closeInventory();
    return;
  }

  openInventory();
}

function openInventory(): void {
  if (appState.inventory.isOpen) {
    return;
  }

  closeRecipeBookOverlay();
  setInventoryOpen(appState.inventory, true);
  refreshCraftableRecipes();
  syncInventoryOverlay(inventoryDomRefs, appState.inventory);
  renderInventory(inventoryDomRefs, appState.inventory);
  updateWorkstationPromptVisibility();
}

function closeInventory(): void {
  if (!appState.inventory.isOpen) {
    return;
  }

  setInventoryOpen(appState.inventory, false);
  syncInventoryOverlay(inventoryDomRefs, appState.inventory);
  updateWorkstationPromptVisibility();
}

function tryOpenRecipeBookFromWorkstation(): void {
  if (!isPlayerNearWorkstation(appState.base, appState.shop.workstation)) {
    return;
  }

  openRecipeBookOverlay();
}

function openRecipeBookOverlay(): void {
  if (appState.shop.recipeBook.isOpen) {
    return;
  }

  closeInventory();
  refreshCraftableRecipes();
  openRecipeBook(appState.shop.recipeBook, shopDomRefs);
  renderRecipeBook(appState.shop.recipeBook, shopDomRefs);
  updateWorkstationPromptVisibility();
}

function closeRecipeBookOverlay(): void {
  if (!appState.shop.recipeBook.isOpen) {
    return;
  }

  closeRecipeBook(appState.shop.recipeBook, shopDomRefs);
  updateWorkstationPromptVisibility();
}

function switchScene(sceneId: SceneId): void {
  if (appState.base.currentSceneId === "ocean" && sceneId !== "ocean") {
    resetFishingState(appState.fishing);
  }

  if (sceneId === "ocean" && appState.base.currentSceneId !== "ocean") {
    resetFishingState(appState.fishing);
  }

  switchBaseScene(appState.base, sceneId);
  closeInventory();
  closeRecipeBookOverlay();
  updateWorkstationPromptVisibility();
}

function getRodOriginWorld() {
  return {
    x: appState.base.player.x + appState.base.player.size * 0.2,
    y: appState.base.player.y - appState.base.player.size * 0.3,
  };
}

function isAnyOverlayOpen(): boolean {
  return appState.shop.recipeBook.isOpen || appState.inventory.isOpen;
}

function isInputLocked(): boolean {
  return isFishingInputLocked(appState.base.currentSceneId, appState.fishing.session.phase, isAnyOverlayOpen());
}

function attemptCatch(): { added: boolean; fishName: string } {
  const caughtFish = rollRandomCatchFromFallbackHabitat();
  registerDiscoveredFish(appState.inventory, caughtFish);
  const addResult = tryAddFishToInventory(appState.inventory, caughtFish);
  if (addResult.added) {
    void maybeGenerateRecipesForCaughtFish(caughtFish.name);
  }
  return {
    added: addResult.added,
    fishName: caughtFish.name,
  };
}

function refreshCraftableRecipes(): void {
  const inventoryFish = getInventoryFish(appState.inventory);
  const discoveredFish = getDiscoveredFish(appState.inventory);
  const craftableRecipes = getCraftableRecipesForInventory(inventoryFish, discoveredFish, currentMasterRecipes);
  setRecipeBookRecipes(appState.shop.recipeBook, craftableRecipes);

  if (!appState.shop.recipeBook.isOpen) {
    return;
  }

  renderRecipeBook(appState.shop.recipeBook, shopDomRefs);
}

async function maybeGenerateRecipesForCaughtFish(fishName: string): Promise<void> {
  const normalizedFishName = fishName.trim().toLowerCase();
  if (!normalizedFishName || pendingRecipeGenerations.has(normalizedFishName)) {
    return;
  }

  pendingRecipeGenerations.add(normalizedFishName);

  try {
    const response = await fetch("/api/recipes/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fishJsonPath: getFallbackHabitatJsonPath(),
        fishQuery: fishName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Recipe generation failed for ${fishName}: ${response.status} ${response.statusText}`, errorText);
      return;
    }

    const payload = (await response.json()) as { recipes?: typeof currentMasterRecipes };
    if (payload.recipes) {
      currentMasterRecipes = payload.recipes;
      refreshCraftableRecipes();
      console.info(`Recipe data refreshed for ${fishName}.`);
    }
  } catch (error) {
    console.error(`Recipe generation bridge failed for ${fishName}.`, error);
  } finally {
    pendingRecipeGenerations.delete(normalizedFishName);
  }
}

async function hydrateMasterRecipes(): Promise<void> {
  try {
    const response = await fetch("/api/recipes");
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to load recipe data: ${response.status} ${response.statusText}`, errorText);
      return;
    }

    const payload = (await response.json()) as { recipes?: typeof currentMasterRecipes };
    if (payload.recipes) {
      currentMasterRecipes = payload.recipes;
      refreshCraftableRecipes();
    }
  } catch (error) {
    console.error("Recipe data hydration failed.", error);
  }
}

function updateWorkstationPromptVisibility(): void {
  updateWorkstationPrompt(
    shopDomRefs.workstationPromptEl,
    appState.shop.recipeBook,
    appState.inventory.isOpen,
    isPlayerNearWorkstation(appState.base, appState.shop.workstation),
  );
}

function renderStatusReadout(): void {
  renderStatus(
    statusReadoutEl,
    appState.base,
    {
      fps: appState.fps,
      fishingPhase: appState.base.currentSceneId === "ocean" ? appState.fishing.session.phase : null,
      fishingTension: appState.base.currentSceneId === "ocean" ? appState.fishing.session.tension : null,
      inventoryUsedSlots: getInventoryUsedSlots(appState.inventory),
      inventoryTotalSlots: appState.inventory.slots.length,
      fishingHabitat: appState.base.currentSceneId === "ocean" ? getFallbackHabitatName() : null,
    },
    GAME_CONFIG.debugMode,
  );
}
