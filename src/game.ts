import type { AppState, OceanTravelState, WorldRect } from "./app/types";
import { GAME_CONFIG } from "./core/config/gameConfig";
import type { Vector2 } from "./core/types/vector";
import { clamp, getCanvasCoordinates, mustGet2DContext, mustGetElement, resizeCanvasDisplay } from "./core/utils";
import {
  getDefaultHabitatId,
  getCraftableRecipesForInventory,
  getDefaultMasterRecipes,
  getHabitatJsonPathById,
  getHabitatNameById,
  getOceanHabitats,
  rollRandomCatchForHabitat,
} from "./data/generated-content";
import {
  BASE_CONSTANTS,
  centerCameraOnPlayer,
  createBaseState,
  drawCollisionDebugBoxes,
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
  updatePlayerAnimation,
} from "./features/base";
import type { BaseState, SceneId } from "./features/base";
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
import { closeRecipeBook, createShopState, drawWorkstation, getRecipeBookPageCount, isPlayerNearWorkstation, openRecipeBook, renderRecipeBook, setRecipeBookRecipes } from "./features/shop";
import type { ShopDomRefs } from "./features/shop";

interface ExpandedMapLayout {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  chartX: number;
  chartY: number;
  chartWidth: number;
  chartHeight: number;
}

interface OceanHabitatRoute {
  id: string;
  name: string;
  jsonPath: string;
  depthZone: string | null;
  substratum: string[];
}

interface OceanHabitatRegion {
  routeId: string;
  circles: OceanHabitatBlobCircle[];
  centroid: Vector2;
  debugColor: string;
}

interface OceanHabitatBlobCircle {
  x: number;
  y: number;
  radius: number;
}

interface OceanChartGeometry {
  centerX: number;
  centerY: number;
  islandRadiusX: number;
  islandRadiusY: number;
}

interface TravelDebugSettings {
  showHabitatRegionDebug: boolean;
}

interface SelectedHabitatDebugSnapshot {
  id: string;
  name: string;
}

interface GameDebugControls {
  setHabitatRegionDebug: (enabled: boolean) => boolean;
  toggleHabitatRegionDebug: () => boolean;
  getState: () => TravelDebugSettings;
  getSelectedHabitatId: () => string | null;
  getSelectedHabitat: () => SelectedHabitatDebugSnapshot | null;
}

declare global {
  interface Window {
    gameDebug?: GameDebugControls;
  }
}

const OCEAN_REGION_DEBUG_COLORS = [
  "#4cb26f",
  "#4f9fd1",
  "#c97957",
  "#8b7be0",
  "#f0b451",
  "#49b6b1",
  "#cf69a1",
];
const oceanMinimapUrl = new URL("../sprites/minimap full.png", import.meta.url).href;
const oceanMinimapImage = new Image();
oceanMinimapImage.src = oceanMinimapUrl;
const OCEAN_MINIMAP_ASPECT_RATIO = 1537 / 1023;

const OCEAN_HABITAT_BLOB_LAYOUT: Array<{
  circles: OceanHabitatBlobCircle[];
  centroid: Vector2;
}> = [
  {
    circles: [
      { x: 0.2, y: 0.2, radius: 0.09 },
      { x: 0.25, y: 0.18, radius: 0.06 },
      { x: 0.17, y: 0.25, radius: 0.05 },
      { x: 0.24, y: 0.25, radius: 0.045 },
    ],
    centroid: { x: 0.215, y: 0.215 },
  },
  {
    circles: [
      { x: 0.5, y: 0.14, radius: 0.085 },
      { x: 0.45, y: 0.17, radius: 0.055 },
      { x: 0.56, y: 0.16, radius: 0.05 },
      { x: 0.5, y: 0.22, radius: 0.045 },
    ],
    centroid: { x: 0.5, y: 0.165 },
  },
  {
    circles: [
      { x: 0.79, y: 0.27, radius: 0.095 },
      { x: 0.74, y: 0.24, radius: 0.06 },
      { x: 0.83, y: 0.23, radius: 0.05 },
      { x: 0.81, y: 0.33, radius: 0.045 },
      { x: 0.74, y: 0.31, radius: 0.042 },
    ],
    centroid: { x: 0.785, y: 0.275 },
  },
  {
    circles: [
      { x: 0.84, y: 0.63, radius: 0.1 },
      { x: 0.79, y: 0.58, radius: 0.06 },
      { x: 0.87, y: 0.56, radius: 0.048 },
      { x: 0.81, y: 0.72, radius: 0.055 },
      { x: 0.88, y: 0.69, radius: 0.043 },
    ],
    centroid: { x: 0.835, y: 0.63 },
  },
  {
    circles: [
      { x: 0.56, y: 0.84, radius: 0.102 },
      { x: 0.48, y: 0.8, radius: 0.055 },
      { x: 0.64, y: 0.8, radius: 0.05 },
      { x: 0.52, y: 0.91, radius: 0.05 },
      { x: 0.62, y: 0.9, radius: 0.044 },
    ],
    centroid: { x: 0.56, y: 0.845 },
  },
  {
    circles: [
      { x: 0.23, y: 0.75, radius: 0.098 },
      { x: 0.17, y: 0.7, radius: 0.056 },
      { x: 0.3, y: 0.71, radius: 0.05 },
      { x: 0.19, y: 0.83, radius: 0.05 },
      { x: 0.29, y: 0.81, radius: 0.042 },
    ],
    centroid: { x: 0.23, y: 0.755 },
  },
  {
    circles: [
      { x: 0.11, y: 0.47, radius: 0.088 },
      { x: 0.08, y: 0.39, radius: 0.05 },
      { x: 0.17, y: 0.43, radius: 0.048 },
      { x: 0.1, y: 0.56, radius: 0.053 },
      { x: 0.16, y: 0.53, radius: 0.04 },
    ],
    centroid: { x: 0.11, y: 0.475 },
  },
];

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

const oceanHabitatRoutes = createOceanHabitatRoutes();
const oceanHabitatRoutesById = new Map(oceanHabitatRoutes.map((route) => [route.id, route]));
const oceanHabitatRegions = createOceanHabitatRegions();
const oceanHabitatRegionsByRouteId = new Map(oceanHabitatRegions.map((region) => [region.routeId, region]));
const travelDebugState: TravelDebugSettings = {
  showHabitatRegionDebug: false,
};
const baseState = createBaseState();

const appState: AppState = {
  base: baseState,
  fishing: createFishingState(),
  inventory: createInventoryState(INVENTORY_CAPACITY),
  shop: createShopState(),
  travel: createOceanTravelState(baseState),
  keysDown: new Set<string>(),
  fps: 0,
  lastFrameTime: performance.now(),
};

let currentMasterRecipes = getDefaultMasterRecipes();
const pendingRecipeGenerations = new Set<string>();
attachDebugConsoleControls();

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
updateInteractionPromptVisibility();

window.addEventListener("keydown", (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  appState.keysDown.add(key);

  if (key === "escape") {
    if (appState.travel.isMapOpen) {
      closeOceanMap();
      return;
    }

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
    if (tryOpenOceanMapFromDock()) {
      return;
    }
    tryOpenRecipeBookFromWorkstation();
  }
});

window.addEventListener("keyup", (event: KeyboardEvent) => {
  appState.keysDown.delete(event.key.toLowerCase());
});

canvas.addEventListener("mousedown", (event: MouseEvent) => {
  if (event.button === 0 && !appState.travel.isMapOpen) {
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
  updatePlayerAnimation(appState.base, velocity, dt);
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
  syncFishingStatusForActiveHabitat();
  updateInteractionPromptVisibility();

  updateCamera(appState.base);
  renderStatusReadout();
}

function render(): void {
  drawSceneBackgroundAndGrid(renderCtx, appState.base);
  drawDockPlaceholder();
  drawFishingWorldLayer(renderCtx, appState.fishing, {
    currentSceneId: appState.base.currentSceneId,
    toScreenPoint: (worldPoint) => toScreenPoint(appState.base, worldPoint),
    getRodOriginWorld,
  });
  drawWorkstation(renderCtx, appState.base.currentSceneId, appState.shop.workstation, appState.base.camera);
  drawCollisionDebugBoxes(renderCtx, appState.base, GAME_CONFIG.debugMode);
  drawPlayer(renderCtx, appState.base);
  drawMiniMap(renderCtx, appState.base);
  drawFishingHud(renderCtx, appState.fishing, appState.base.currentSceneId);
  drawOceanMapOverlay();
}

function handleCanvasClick(event: MouseEvent): void {
  const clickScreenPoint = getCanvasCoordinates(canvas, event);

  if (appState.travel.isMapOpen) {
    handleOceanMapClick(clickScreenPoint);
    return;
  }

  if (isBlockingOverlayOpen()) {
    return;
  }

  const minimapSceneId = getSceneIdFromMinimapClick(clickScreenPoint);
  if (minimapSceneId !== null) {
    if (minimapSceneId === "ocean" && appState.base.currentSceneId === "island") {
      openOceanMap();
      return;
    }

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

function handleOceanMapClick(clickScreenPoint: Vector2): void {
  const layout = getExpandedMapLayout();
  if (!isPointInsideRect(clickScreenPoint, { x: layout.boxX, y: layout.boxY, width: layout.boxWidth, height: layout.boxHeight })) {
    closeOceanMap();
    return;
  }

  if (!isPointInsideRect(clickScreenPoint, { x: layout.chartX, y: layout.chartY, width: layout.chartWidth, height: layout.chartHeight })) {
    closeOceanMap();
    return;
  }

  const selectedHabitat = resolveOceanHabitatFromChartPoint(clickScreenPoint, layout);
  if (!selectedHabitat) {
    return;
  }

  appState.travel.selectedHabitatId = selectedHabitat.id;
  closeOceanMap();
  switchScene("ocean");
  syncFishingStatusForActiveHabitat();
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

  closeOceanMap();
  closeRecipeBookOverlay();
  setInventoryOpen(appState.inventory, true);
  refreshCraftableRecipes();
  syncInventoryOverlay(inventoryDomRefs, appState.inventory);
  renderInventory(inventoryDomRefs, appState.inventory);
  updateInteractionPromptVisibility();
}

function closeInventory(): void {
  if (!appState.inventory.isOpen) {
    return;
  }

  setInventoryOpen(appState.inventory, false);
  syncInventoryOverlay(inventoryDomRefs, appState.inventory);
  updateInteractionPromptVisibility();
}

function tryOpenOceanMapFromDock(): boolean {
  if (!isPlayerOnDock()) {
    return false;
  }

  openOceanMap();
  return true;
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

  closeOceanMap();
  closeInventory();
  refreshCraftableRecipes();
  openRecipeBook(appState.shop.recipeBook, shopDomRefs);
  renderRecipeBook(appState.shop.recipeBook, shopDomRefs);
  updateInteractionPromptVisibility();
}

function closeRecipeBookOverlay(): void {
  if (!appState.shop.recipeBook.isOpen) {
    return;
  }

  closeRecipeBook(appState.shop.recipeBook, shopDomRefs);
  updateInteractionPromptVisibility();
}

function openOceanMap(): void {
  if (appState.base.currentSceneId !== "island") {
    return;
  }

  closeInventory();
  closeRecipeBookOverlay();
  appState.fishing.isReelHeld = false;
  appState.travel.isMapOpen = true;
}

function closeOceanMap(): void {
  appState.travel.isMapOpen = false;
}

function getSelectedHabitatRoute(): OceanHabitatRoute | null {
  const selectedHabitatId = appState.travel.selectedHabitatId;
  if (selectedHabitatId) {
    const selectedRoute = oceanHabitatRoutesById.get(selectedHabitatId);
    if (selectedRoute) {
      return selectedRoute;
    }
  }

  return oceanHabitatRoutes[0] ?? null;
}

function cloneTravelDebugState(): TravelDebugSettings {
  return {
    showHabitatRegionDebug: travelDebugState.showHabitatRegionDebug,
  };
}

function attachDebugConsoleControls(): void {
  window.gameDebug = {
    setHabitatRegionDebug: (enabled: boolean): boolean => {
      travelDebugState.showHabitatRegionDebug = Boolean(enabled);
      return travelDebugState.showHabitatRegionDebug;
    },
    toggleHabitatRegionDebug: (): boolean => {
      travelDebugState.showHabitatRegionDebug = !travelDebugState.showHabitatRegionDebug;
      return travelDebugState.showHabitatRegionDebug;
    },
    getState: (): TravelDebugSettings => cloneTravelDebugState(),
    getSelectedHabitatId: (): string | null => getSelectedHabitatRoute()?.id ?? null,
    getSelectedHabitat: (): SelectedHabitatDebugSnapshot | null => {
      const selectedRoute = getSelectedHabitatRoute();
      if (!selectedRoute) {
        return null;
      }

      return {
        id: selectedRoute.id,
        name: selectedRoute.name,
      };
    },
  };
}

function switchScene(sceneId: SceneId): void {
  if (appState.base.currentSceneId === "ocean" && sceneId !== "ocean") {
    resetFishingState(appState.fishing);
  }

  if (sceneId === "ocean" && appState.base.currentSceneId !== "ocean") {
    resetFishingState(appState.fishing);
  }

  switchBaseScene(appState.base, sceneId);
  closeOceanMap();
  closeInventory();
  closeRecipeBookOverlay();
  syncFishingStatusForActiveHabitat();
  updateInteractionPromptVisibility();
}

function getRodOriginWorld() {
  return {
    x: appState.base.player.x + appState.base.player.size * 0.2,
    y: appState.base.player.y - appState.base.player.size * 0.3,
  };
}

function isBlockingOverlayOpen(): boolean {
  return appState.shop.recipeBook.isOpen || appState.inventory.isOpen;
}

function isAnyOverlayOpen(): boolean {
  return isBlockingOverlayOpen() || appState.travel.isMapOpen;
}

function isInputLocked(): boolean {
  return isFishingInputLocked(appState.base.currentSceneId, appState.fishing.session.phase, isAnyOverlayOpen());
}

function attemptCatch(): { added: boolean; fishName: string } {
  const caughtFish = rollRandomCatchForHabitat(appState.travel.selectedHabitatId);
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
        fishJsonPath: getHabitatJsonPathById(appState.travel.selectedHabitatId),
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

function updateInteractionPromptVisibility(): void {
  const hasBlockingOverlay = appState.shop.recipeBook.isOpen || appState.inventory.isOpen || appState.travel.isMapOpen;
  if (hasBlockingOverlay) {
    workstationPromptEl.classList.add("is-hidden");
    return;
  }

  if (isPlayerOnDock()) {
    workstationPromptEl.textContent = "Press E to open ocean chart";
    workstationPromptEl.classList.remove("is-hidden");
    return;
  }

  if (isPlayerNearWorkstation(appState.base, appState.shop.workstation)) {
    workstationPromptEl.textContent = "Press E to open workstation";
    workstationPromptEl.classList.remove("is-hidden");
    return;
  }

  workstationPromptEl.classList.add("is-hidden");
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
      fishingHabitat: appState.base.currentSceneId === "ocean" ? getHabitatNameById(appState.travel.selectedHabitatId) : null,
    },
    GAME_CONFIG.debugMode,
  );
}

function createOceanHabitatRoutes(): OceanHabitatRoute[] {
  const habitats = getOceanHabitats();

  return habitats.map((habitat) => ({
    id: habitat.id,
    name: habitat.name,
    jsonPath: habitat.jsonPath,
    depthZone: habitat.depthZone,
    substratum: [...habitat.substratum],
  }));
}

function createOceanHabitatRegions(): OceanHabitatRegion[] {
  return oceanHabitatRoutes.map((route, index) => {
    const layout = OCEAN_HABITAT_BLOB_LAYOUT[index % OCEAN_HABITAT_BLOB_LAYOUT.length];
    return {
      routeId: route.id,
      circles: layout.circles.map((circle) => ({ ...circle })),
      centroid: { ...layout.centroid },
      debugColor: OCEAN_REGION_DEBUG_COLORS[index % OCEAN_REGION_DEBUG_COLORS.length],
    };
  });
}

function createOceanTravelState(state: BaseState): OceanTravelState {
  const islandScene = state.scenes.island;
  const tileSize = BASE_CONSTANTS.TILE_SIZE;
  const dockRectWidth = Math.max(1, Math.round(tileSize * 4));
  const dockRectHeight = Math.max(1, Math.round(tileSize * 3));
  const islandWorldWidth = islandScene.worldCols * tileSize;
  const islandWorldHeight = islandScene.worldRows * tileSize;
  const defaultHabitatId = getDefaultHabitatId();
  const selectedHabitatId =
    oceanHabitatRoutesById.get(defaultHabitatId)?.id ?? oceanHabitatRoutes[0]?.id ?? defaultHabitatId;

  return {
    isMapOpen: false,
    dockRect: {
      x: clamp(Math.round(tileSize * 31), 0, Math.max(0, islandWorldWidth - dockRectWidth)),
      y: clamp(Math.round(tileSize * 12), 0, Math.max(0, islandWorldHeight - dockRectHeight)),
      width: dockRectWidth,
      height: dockRectHeight,
    },
    selectedHabitatId,
  };
}

function isPointInsideRect(point: Vector2, rect: WorldRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function isPlayerOnDock(): boolean {
  if (appState.base.currentSceneId !== "island") {
    return false;
  }

  return isPointInsideRect(
    {
      x: appState.base.player.x,
      y: appState.base.player.y,
    },
    appState.travel.dockRect,
  );
}

function getExpandedMapLayout(): ExpandedMapLayout {
  const panelPadding = Math.max(1, Math.round(16 * BASE_CONSTANTS.GLOBAL_SCALE));
  const maxBoxWidth = Math.max(1, Math.round(BASE_CONSTANTS.RENDER_WIDTH * 0.84));
  const maxBoxHeight = Math.max(1, Math.round(BASE_CONSTANTS.RENDER_HEIGHT * 0.78));
  const maxChartWidth = Math.max(1, maxBoxWidth - panelPadding * 2);
  const maxChartHeight = Math.max(1, maxBoxHeight - panelPadding * 2);
  const chartWidth =
    maxChartWidth / maxChartHeight > OCEAN_MINIMAP_ASPECT_RATIO
      ? Math.round(maxChartHeight * OCEAN_MINIMAP_ASPECT_RATIO)
      : maxChartWidth;
  const chartHeight =
    maxChartWidth / maxChartHeight > OCEAN_MINIMAP_ASPECT_RATIO
      ? maxChartHeight
      : Math.round(maxChartWidth / OCEAN_MINIMAP_ASPECT_RATIO);
  const boxWidth = chartWidth + panelPadding * 2;
  const boxHeight = chartHeight + panelPadding * 2;
  const boxX = Math.round((BASE_CONSTANTS.RENDER_WIDTH - boxWidth) / 2);
  const boxY = Math.round((BASE_CONSTANTS.RENDER_HEIGHT - boxHeight) / 2);

  return {
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    chartX: boxX + panelPadding,
    chartY: boxY + panelPadding,
    chartWidth,
    chartHeight,
  };
}

function getOceanChartGeometry(layout: ExpandedMapLayout): OceanChartGeometry {
  const centerX = layout.chartX + layout.chartWidth * 0.5;
  const centerY = layout.chartY + layout.chartHeight * 0.5;
  const islandRadiusX = Math.max(1, layout.chartWidth * 0.1);
  const islandRadiusY = Math.max(1, layout.chartHeight * 0.12);

  return {
    centerX,
    centerY,
    islandRadiusX,
    islandRadiusY,
  };
}

function drawOceanHabitatBlobPath(layout: ExpandedMapLayout, circles: OceanHabitatBlobCircle[]): void {
  const chartScale = Math.min(layout.chartWidth, layout.chartHeight);
  renderCtx.beginPath();
  for (const circle of circles) {
    const centerX = layout.chartX + circle.x * layout.chartWidth;
    const centerY = layout.chartY + circle.y * layout.chartHeight;
    const radius = circle.radius * chartScale;
    renderCtx.moveTo(centerX + radius, centerY);
    renderCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  }
}

function isPointInsideIsland(point: Vector2, geometry: OceanChartGeometry): boolean {
  const normalizedDeltaX = (point.x - geometry.centerX) / geometry.islandRadiusX;
  const normalizedDeltaY = (point.y - geometry.centerY) / geometry.islandRadiusY;
  return normalizedDeltaX * normalizedDeltaX + normalizedDeltaY * normalizedDeltaY <= 1;
}

function resolveOceanHabitatFromChartPoint(clickScreenPoint: Vector2, layout: ExpandedMapLayout): OceanHabitatRoute | null {
  const geometry = getOceanChartGeometry(layout);
  if (isPointInsideIsland(clickScreenPoint, geometry)) {
    return null;
  }

  const chartScale = Math.min(layout.chartWidth, layout.chartHeight);
  let strongestMatch: { routeId: string; score: number } | null = null;

  for (const region of oceanHabitatRegionsByRouteId.values()) {
    for (const circle of region.circles) {
      const centerX = layout.chartX + circle.x * layout.chartWidth;
      const centerY = layout.chartY + circle.y * layout.chartHeight;
      const radius = circle.radius * chartScale;
      const distance = Math.hypot(clickScreenPoint.x - centerX, clickScreenPoint.y - centerY);
      if (distance > radius) {
        continue;
      }

      const score = 1 - distance / Math.max(radius, 0.0001);
      if (!strongestMatch || score > strongestMatch.score) {
        strongestMatch = {
          routeId: region.routeId,
          score,
        };
      }
    }
  }

  if (strongestMatch) {
    return oceanHabitatRoutesById.get(strongestMatch.routeId) ?? null;
  }

  let nearestFallbackRoute: OceanHabitatRoute | null = null;
  let nearestFallbackDistance = Number.POSITIVE_INFINITY;
  for (const region of oceanHabitatRegionsByRouteId.values()) {
    const centroidX = layout.chartX + region.centroid.x * layout.chartWidth;
    const centroidY = layout.chartY + region.centroid.y * layout.chartHeight;
    const distance = Math.hypot(clickScreenPoint.x - centroidX, clickScreenPoint.y - centroidY);
    if (distance < nearestFallbackDistance) {
      nearestFallbackDistance = distance;
      nearestFallbackRoute = oceanHabitatRoutesById.get(region.routeId) ?? null;
    }
  }

  return nearestFallbackRoute;
}

function drawDockPlaceholder(): void {
  if (appState.base.currentSceneId !== "island") {
    return;
  }

  const dockRect = appState.travel.dockRect;
  const dockTopLeft = toScreenPoint(appState.base, { x: dockRect.x, y: dockRect.y });
  const dockInset = Math.max(1, Math.round(2 * BASE_CONSTANTS.GLOBAL_SCALE));

  renderCtx.fillStyle = "#8b5130";
  renderCtx.fillRect(dockTopLeft.x, dockTopLeft.y, dockRect.width, dockRect.height);

  renderCtx.strokeStyle = "#4b2b22";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  renderCtx.strokeRect(dockTopLeft.x, dockTopLeft.y, dockRect.width, dockRect.height);

  renderCtx.fillStyle = "#5f3528";
  renderCtx.fillRect(
    dockTopLeft.x + dockInset,
    dockTopLeft.y + dockInset,
    dockRect.width - dockInset * 2,
    dockRect.height - dockInset * 2,
  );

  const labelWidth = Math.max(1, Math.round(228 * BASE_CONSTANTS.GLOBAL_SCALE));
  const labelHeight = Math.max(1, Math.round(22 * BASE_CONSTANTS.GLOBAL_SCALE));
  const labelX = Math.round(dockTopLeft.x + dockRect.width / 2 - labelWidth / 2);
  const labelY = Math.round(dockTopLeft.y - labelHeight - Math.max(5, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)));

  renderCtx.fillStyle = "#8b5130";
  renderCtx.fillRect(labelX, labelY, labelWidth, labelHeight);
  renderCtx.fillStyle = "#5f3528";
  renderCtx.fillRect(
    labelX + Math.max(1, Math.round(3 * BASE_CONSTANTS.GLOBAL_SCALE)),
    labelY + Math.max(1, Math.round(3 * BASE_CONSTANTS.GLOBAL_SCALE)),
    labelWidth - Math.max(1, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)),
    labelHeight - Math.max(1, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );
  renderCtx.strokeStyle = "#4b2b22";
  renderCtx.strokeRect(labelX, labelY, labelWidth, labelHeight);

  renderCtx.fillStyle = "#ffe4ae";
  renderCtx.font = `${Math.max(10, Math.round(11 * BASE_CONSTANTS.GLOBAL_SCALE))}px monospace`;
  renderCtx.textAlign = "center";
  renderCtx.textBaseline = "middle";
  renderCtx.fillText(
    "Dock: stand here + press E",
    labelX + labelWidth / 2,
    labelY + labelHeight / 2 + 0.5 * BASE_CONSTANTS.GLOBAL_SCALE,
  );
}

function drawOceanMapOverlay(): void {
  if (!appState.travel.isMapOpen) {
    return;
  }

  const layout = getExpandedMapLayout();

  renderCtx.fillStyle = "rgba(25, 39, 45, 0.72)";
  renderCtx.fillRect(0, 0, BASE_CONSTANTS.RENDER_WIDTH, BASE_CONSTANTS.RENDER_HEIGHT);

  renderCtx.fillStyle = "#8b5130";
  renderCtx.fillRect(layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);
  renderCtx.fillStyle = "#7b422b";
  renderCtx.fillRect(
    layout.boxX + Math.max(1, Math.round(4 * BASE_CONSTANTS.GLOBAL_SCALE)),
    layout.boxY + Math.max(1, Math.round(4 * BASE_CONSTANTS.GLOBAL_SCALE)),
    layout.boxWidth - Math.max(1, Math.round(8 * BASE_CONSTANTS.GLOBAL_SCALE)),
    layout.boxHeight - Math.max(1, Math.round(8 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );
  renderCtx.strokeStyle = "#4b2b22";
  renderCtx.lineWidth = 1;
  renderCtx.strokeRect(layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);
  renderCtx.strokeStyle = "rgba(255, 224, 150, 0.28)";
  renderCtx.strokeRect(
    layout.boxX + Math.max(1, Math.round(3 * BASE_CONSTANTS.GLOBAL_SCALE)),
    layout.boxY + Math.max(1, Math.round(3 * BASE_CONSTANTS.GLOBAL_SCALE)),
    layout.boxWidth - Math.max(1, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)),
    layout.boxHeight - Math.max(1, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );

  renderCtx.fillStyle = "#5f3528";
  renderCtx.fillRect(layout.chartX, layout.chartY, layout.chartWidth, layout.chartHeight);

  if (oceanMinimapImage.complete) {
    drawImageContained(
      oceanMinimapImage,
      layout.chartX,
      layout.chartY,
      layout.chartWidth,
      layout.chartHeight,
    );
  }

  renderCtx.strokeStyle = "#4b2b22";
  renderCtx.lineWidth = 1;
  renderCtx.strokeRect(layout.chartX, layout.chartY, layout.chartWidth, layout.chartHeight);

  if (travelDebugState.showHabitatRegionDebug) {
    const selectedRoute = getSelectedHabitatRoute();
    const selectedDebugLabel = selectedRoute ? `#${selectedRoute.id} ${selectedRoute.name}` : "None";
    renderCtx.fillStyle = "rgba(255, 231, 182, 0.92)";
    renderCtx.fillText(
      `DEBUG: hidden regions visible • selected habitat: ${selectedDebugLabel}`,
      layout.boxX + Math.max(1, Math.round(12 * BASE_CONSTANTS.GLOBAL_SCALE)),
      layout.boxY + layout.boxHeight - Math.max(1, Math.round(32 * BASE_CONSTANTS.GLOBAL_SCALE)),
    );
  }
}

function drawImageContained(image: HTMLImageElement, x: number, y: number, width: number, height: number): void {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  renderCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function syncFishingStatusForActiveHabitat(): void {
  if (appState.base.currentSceneId !== "ocean" || appState.fishing.session.phase !== "idle") {
    return;
  }

  appState.fishing.session.statusText = "Uncharted waters. Click open water to cast.";
}
