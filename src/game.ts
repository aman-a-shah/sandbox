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
import { closeRecipeBook, createShopState, drawWorkstation, getRecipeBookPageCount, isPlayerNearWorkstation, openRecipeBook, renderRecipeBook, setRecipeBookRecipes, updateWorkstationPrompt } from "./features/shop";
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
  mapPoint: Vector2;
}

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
  updateWorkstationPromptVisibility();

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

  if (appState.base.currentSceneId === "island") {
    const clickWorldPoint = toWorldPoint(appState.base, clickScreenPoint);
    if (isPointInsideRect(clickWorldPoint, appState.travel.dockRect)) {
      openOceanMap();
      return;
    }
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

  const normalizedPoint = {
    x: (clickScreenPoint.x - layout.chartX) / layout.chartWidth,
    y: (clickScreenPoint.y - layout.chartY) / layout.chartHeight,
  };
  const selectedHabitat = resolveOceanHabitatFromMapPoint(normalizedPoint);
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

  closeOceanMap();
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
  updateWorkstationPromptVisibility();
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

function updateWorkstationPromptVisibility(): void {
  updateWorkstationPrompt(
    shopDomRefs.workstationPromptEl,
    appState.shop.recipeBook,
    appState.inventory.isOpen || appState.travel.isMapOpen,
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
      fishingHabitat: appState.base.currentSceneId === "ocean" ? getHabitatNameById(appState.travel.selectedHabitatId) : null,
    },
    GAME_CONFIG.debugMode,
  );
}

function createOceanHabitatRoutes(): OceanHabitatRoute[] {
  const habitats = getOceanHabitats();
  const mapPoints = createNormalizedRoutePoints(habitats.length);

  return habitats.map((habitat, index) => ({
    id: habitat.id,
    name: habitat.name,
    jsonPath: habitat.jsonPath,
    depthZone: habitat.depthZone,
    substratum: [...habitat.substratum],
    mapPoint: mapPoints[index] ?? { x: 0.5, y: 0.5 },
  }));
}

function createNormalizedRoutePoints(count: number): Vector2[] {
  if (count <= 1) {
    return [{ x: 0.66, y: 0.5 }];
  }

  const points: Vector2[] = [];
  const centerX = 0.63;
  const centerY = 0.5;
  const radiusX = 0.28;
  const radiusY = 0.34;

  for (let index = 0; index < count; index += 1) {
    const ratio = index / count;
    const angle = -Math.PI / 2 + ratio * Math.PI * 2;
    const wobbleX = Math.sin(index * 1.7) * 0.03;
    const wobbleY = Math.cos(index * 2.1) * 0.03;
    points.push({
      x: clamp(centerX + Math.cos(angle) * radiusX + wobbleX, 0.14, 0.9),
      y: clamp(centerY + Math.sin(angle) * radiusY + wobbleY, 0.12, 0.88),
    });
  }

  return points;
}

function getActiveOceanHabitatRoute(): OceanHabitatRoute {
  const selectedHabitatId = appState.travel.selectedHabitatId;
  if (selectedHabitatId) {
    const selectedRoute = oceanHabitatRoutes.find((route) => route.id === selectedHabitatId);
    if (selectedRoute) {
      return selectedRoute;
    }
  }

  return (
    oceanHabitatRoutes[0] ?? {
      id: getDefaultHabitatId(),
      name: getHabitatNameById(null),
      jsonPath: getHabitatJsonPathById(null),
      depthZone: null,
      substratum: [],
      mapPoint: { x: 0.5, y: 0.5 },
    }
  );
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
    oceanHabitatRoutes.find((route) => route.id === defaultHabitatId)?.id ?? oceanHabitatRoutes[0]?.id ?? defaultHabitatId;

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

function getExpandedMapLayout(): ExpandedMapLayout {
  const panelPadding = Math.max(1, Math.round(16 * BASE_CONSTANTS.GLOBAL_SCALE));
  const boxWidth = Math.max(1, Math.round(BASE_CONSTANTS.RENDER_WIDTH * 0.84));
  const boxHeight = Math.max(1, Math.round(BASE_CONSTANTS.RENDER_HEIGHT * 0.78));
  const boxX = Math.round((BASE_CONSTANTS.RENDER_WIDTH - boxWidth) / 2);
  const boxY = Math.round((BASE_CONSTANTS.RENDER_HEIGHT - boxHeight) / 2);
  const sidePanelWidth = Math.max(1, Math.round(boxWidth * 0.33));

  return {
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    chartX: boxX + panelPadding,
    chartY: boxY + panelPadding,
    chartWidth: boxWidth - panelPadding * 3 - sidePanelWidth,
    chartHeight: boxHeight - panelPadding * 2,
  };
}

function resolveOceanHabitatFromMapPoint(normalizedPoint: Vector2): OceanHabitatRoute {
  let nearestRoute = getActiveOceanHabitatRoute();
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const route of oceanHabitatRoutes) {
    const deltaX = normalizedPoint.x - route.mapPoint.x;
    const deltaY = normalizedPoint.y - route.mapPoint.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestRoute = route;
    }
  }

  return nearestRoute;
}

function drawDockPlaceholder(): void {
  if (appState.base.currentSceneId !== "island") {
    return;
  }

  const dockRect = appState.travel.dockRect;
  const dockTopLeft = toScreenPoint(appState.base, { x: dockRect.x, y: dockRect.y });
  const dockInset = Math.max(1, Math.round(2 * BASE_CONSTANTS.GLOBAL_SCALE));

  renderCtx.fillStyle = "rgba(101, 72, 43, 0.95)";
  renderCtx.fillRect(dockTopLeft.x, dockTopLeft.y, dockRect.width, dockRect.height);

  renderCtx.strokeStyle = "rgba(249, 217, 159, 0.95)";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  renderCtx.strokeRect(dockTopLeft.x, dockTopLeft.y, dockRect.width, dockRect.height);

  renderCtx.fillStyle = "rgba(67, 46, 26, 0.75)";
  renderCtx.fillRect(
    dockTopLeft.x + dockInset,
    dockTopLeft.y + dockInset,
    dockRect.width - dockInset * 2,
    dockRect.height - dockInset * 2,
  );

  renderCtx.fillStyle = "#f5e4c1";
  renderCtx.font = `${Math.max(10, Math.round(11 * BASE_CONSTANTS.GLOBAL_SCALE))}px monospace`;
  renderCtx.textAlign = "center";
  renderCtx.textBaseline = "bottom";
  renderCtx.fillText(
    "Dock: click for chart",
    dockTopLeft.x + dockRect.width / 2,
    dockTopLeft.y - Math.max(3, Math.round(4 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );
}

function drawOceanMapOverlay(): void {
  if (!appState.travel.isMapOpen) {
    return;
  }

  const layout = getExpandedMapLayout();
  const panelPadding = Math.max(1, Math.round(16 * BASE_CONSTANTS.GLOBAL_SCALE));
  const routeHub = {
    x: layout.chartX + layout.chartWidth * 0.15,
    y: layout.chartY + layout.chartHeight * 0.52,
  };
  const activeRoute = getActiveOceanHabitatRoute();

  renderCtx.fillStyle = "rgba(4, 9, 22, 0.75)";
  renderCtx.fillRect(0, 0, BASE_CONSTANTS.RENDER_WIDTH, BASE_CONSTANTS.RENDER_HEIGHT);

  renderCtx.fillStyle = "rgba(8, 23, 40, 0.95)";
  renderCtx.strokeStyle = "rgba(167, 203, 230, 0.7)";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  renderCtx.fillRect(layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);
  renderCtx.strokeRect(layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);

  renderCtx.fillStyle = "rgba(19, 53, 87, 0.95)";
  renderCtx.fillRect(layout.chartX, layout.chartY, layout.chartWidth, layout.chartHeight);
  renderCtx.strokeStyle = "rgba(164, 209, 255, 0.55)";
  renderCtx.strokeRect(layout.chartX, layout.chartY, layout.chartWidth, layout.chartHeight);

  renderCtx.strokeStyle = "rgba(152, 188, 220, 0.2)";
  renderCtx.lineWidth = Math.max(1, Math.round(BASE_CONSTANTS.GLOBAL_SCALE));
  for (let row = 1; row < 6; row += 1) {
    const y = layout.chartY + (layout.chartHeight * row) / 6;
    renderCtx.beginPath();
    renderCtx.moveTo(layout.chartX, y);
    renderCtx.lineTo(layout.chartX + layout.chartWidth, y);
    renderCtx.stroke();
  }
  for (let column = 1; column < 8; column += 1) {
    const x = layout.chartX + (layout.chartWidth * column) / 8;
    renderCtx.beginPath();
    renderCtx.moveTo(x, layout.chartY);
    renderCtx.lineTo(x, layout.chartY + layout.chartHeight);
    renderCtx.stroke();
  }

  renderCtx.fillStyle = "#ffe2ad";
  renderCtx.strokeStyle = "#fff3d5";
  renderCtx.beginPath();
  renderCtx.arc(routeHub.x, routeHub.y, Math.max(3, Math.round(4 * BASE_CONSTANTS.GLOBAL_SCALE)), 0, Math.PI * 2);
  renderCtx.fill();
  renderCtx.stroke();

  for (const route of oceanHabitatRoutes) {
    const routePoint = {
      x: layout.chartX + route.mapPoint.x * layout.chartWidth,
      y: layout.chartY + route.mapPoint.y * layout.chartHeight,
    };
    const isActive = route.id === activeRoute.id;
    const nodeRadius = isActive ? Math.max(5, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)) : Math.max(4, Math.round(5 * BASE_CONSTANTS.GLOBAL_SCALE));

    renderCtx.strokeStyle = isActive ? "rgba(245, 245, 245, 0.95)" : "rgba(176, 211, 236, 0.6)";
    renderCtx.lineWidth = isActive ? Math.max(1, Math.round(2 * BASE_CONSTANTS.GLOBAL_SCALE)) : Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
    renderCtx.beginPath();
    renderCtx.moveTo(routeHub.x, routeHub.y);
    renderCtx.lineTo(routePoint.x, routePoint.y);
    renderCtx.stroke();

    renderCtx.fillStyle = isActive ? "#f4c96a" : "#8ec1e2";
    renderCtx.beginPath();
    renderCtx.arc(routePoint.x, routePoint.y, nodeRadius, 0, Math.PI * 2);
    renderCtx.fill();

    renderCtx.fillStyle = "#0f2235";
    renderCtx.font = `${Math.max(9, Math.round(10 * BASE_CONSTANTS.GLOBAL_SCALE))}px monospace`;
    renderCtx.textAlign = "left";
    renderCtx.textBaseline = "middle";
    renderCtx.fillText(`#${route.id}`, routePoint.x + nodeRadius + Math.max(4, Math.round(3 * BASE_CONSTANTS.GLOBAL_SCALE)), routePoint.y);
  }

  const detailsPanelX = layout.chartX + layout.chartWidth + panelPadding;
  const detailsPanelWidth = layout.boxX + layout.boxWidth - detailsPanelX - panelPadding;
  const detailsPanelY = layout.chartY;
  const detailsPanelHeight = layout.chartHeight;
  renderCtx.fillStyle = "rgba(11, 32, 57, 0.9)";
  renderCtx.fillRect(detailsPanelX, detailsPanelY, detailsPanelWidth, detailsPanelHeight);
  renderCtx.strokeStyle = "rgba(156, 204, 232, 0.45)";
  renderCtx.strokeRect(detailsPanelX, detailsPanelY, detailsPanelWidth, detailsPanelHeight);

  const lineX = detailsPanelX + Math.max(1, Math.round(10 * BASE_CONSTANTS.GLOBAL_SCALE));
  let lineY = detailsPanelY + Math.max(1, Math.round(18 * BASE_CONSTANTS.GLOBAL_SCALE));
  const lineGap = Math.max(1, Math.round(14 * BASE_CONSTANTS.GLOBAL_SCALE));

  renderCtx.fillStyle = "#e5f5ff";
  renderCtx.font = `${Math.max(10, Math.round(12 * BASE_CONSTANTS.GLOBAL_SCALE))}px monospace`;
  renderCtx.textAlign = "left";
  renderCtx.textBaseline = "top";
  renderCtx.fillText("Ocean Chart", lineX, lineY);
  lineY += lineGap * 1.4;
  renderCtx.fillText(`Habitat #${activeRoute.id}`, lineX, lineY);
  lineY += lineGap;

  const nameLines = splitTextForWidth(activeRoute.name, detailsPanelWidth - Math.max(1, Math.round(16 * BASE_CONSTANTS.GLOBAL_SCALE)));
  for (const nameLine of nameLines.slice(0, 3)) {
    renderCtx.fillText(nameLine, lineX, lineY);
    lineY += lineGap;
  }

  const depthLine = activeRoute.depthZone ? `Depth: ${activeRoute.depthZone}` : "Depth: Unknown";
  renderCtx.fillText(depthLine, lineX, lineY);
  lineY += lineGap;

  const substratumLabel = activeRoute.substratum.length > 0 ? activeRoute.substratum.join(", ") : "unspecified";
  const substratumLines = splitTextForWidth(
    `Substratum: ${substratumLabel}`,
    detailsPanelWidth - Math.max(1, Math.round(16 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );
  for (const substratumLine of substratumLines.slice(0, 3)) {
    renderCtx.fillText(substratumLine, lineX, lineY);
    lineY += lineGap;
  }

  lineY += lineGap * 0.6;
  renderCtx.fillStyle = "#9fd2f2";
  renderCtx.fillText("Click a route node to depart.", lineX, lineY);
  lineY += lineGap;
  renderCtx.fillText("Click outside chart to close.", lineX, lineY);
}

function splitTextForWidth(text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = words[0];
  for (let index = 1; index < words.length; index += 1) {
    const nextCandidate = `${currentLine} ${words[index]}`;
    if (renderCtx.measureText(nextCandidate).width <= maxWidth) {
      currentLine = nextCandidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = words[index];
  }

  lines.push(currentLine);
  return lines;
}

function syncFishingStatusForActiveHabitat(): void {
  if (appState.base.currentSceneId !== "ocean" || appState.fishing.session.phase !== "idle") {
    return;
  }

  const activeRoute = getActiveOceanHabitatRoute();
  appState.fishing.session.statusText = `Route #${activeRoute.id}: ${activeRoute.name}. Click open water to cast.`;
}
