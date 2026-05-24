import type { AppState, OceanTravelState, WorldRect } from "./app/types";
import { GAME_CONFIG } from "./core/config/gameConfig";
import type { Vector2 } from "./core/types/vector";
import { clamp, getCanvasCoordinates, mustGet2DContext, mustGetElement, resizeCanvasDisplay } from "./core/utils";
import {
  createCookedFoodFromRecipe,
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
  SHOP_EXIT_DOOR,
  centerCameraOnPlayer,
  createBaseState,
  drawCollisionDebugBoxes,
  drawPlayer,
  drawSceneBackgroundAndGrid,
  getMovementVector,
  getIslandDockInteractionTileRect,
  getIslandHouseDoorInteractionTileRect,
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
import type { BaseState, PlayerDirection, SceneId } from "./features/base";
import { createFishingState, drawFishingHud, drawFishingWorldLayer, handleFishingClick, isFishingInputLocked, resetFishingState, updateFishing } from "./features/fishing";
import {
  INVENTORY_CAPACITY,
  createInventoryState,
  getDiscoveredFish,
  getInventoryFish,
  getInventoryUsedSlots,
  removeItemFromSlotsByIndex,
  registerDiscoveredFish,
  removeFishFromInventory,
  renderInventory,
  selectDiscoveredFish,
  setInventoryInteractionMode,
  setInventoryOpen,
  setInventoryView,
  syncInventoryOverlay,
  tryAddFoodToInventory,
  tryAddFishToInventory,
  tryAddItemToSlots,
} from "./features/inventory";
import type { InventoryDomRefs } from "./features/inventory";
import {
  closeRecipeBook,
  createShopState,
  drawWorkstation,
  getRecipeBookPageCount,
  getSelectedRecipe,
  isPlayerNearSaleTable,
  isPlayerNearWorkstation,
  openRecipeBook,
  renderRecipeBook,
  setRecipeBookRecipes,
} from "./features/shop";
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

interface CustomerTarget {
  x: number;
  y: number;
}

declare global {
  interface Window {
    gameDebug?: GameDebugControls;
  }
}

const CAST_COST = 10;
const BANKRUPTCY_LIMIT = -1000;
const CUSTOMER_PATIENCE_SECONDS = 30;
const CUSTOMER_EMPTY_PENALTY = 50;
const CUSTOMER_SPEED = 52;
const CUSTOMER_PURCHASE_DELAY = 1.6;
const CUSTOMER_FRAME_SIZE = 32;
const CUSTOMER_DRAW_SCALE = 1.4;
const CUSTOMER_IDLE_FRAMES = 4;
const CUSTOMER_WALK_FRAMES = 6;
const CUSTOMER_WALK_FRAME_SECONDS = 0.11;
const CUSTOMER_SELL_BOX_MIN_X = 80;
const CUSTOMER_SELL_BOX_MAX_X = 140;
const CUSTOMER_SELL_BOX_MIN_Y = 10;
const CUSTOMER_SELL_BOX_MAX_Y = 50;
const CUSTOMER_PLAYER_IDLE_URLS: Record<PlayerDirection, string> = {
  down: "/sprites-clean/player/idle-down.png",
  left: "/sprites-clean/player/idle-left.png",
  right: "/sprites-clean/player/idle-right.png",
  up: "/sprites-clean/player/idle-up.png",
};
const CUSTOMER_PLAYER_WALK_URLS: Record<PlayerDirection, string> = {
  down: "/sprites-clean/player/walk-down.png",
  left: "/sprites-clean/player/walk-left.png",
  right: "/sprites-clean/player/walk-right.png",
  up: "/sprites-clean/player/walk-up.png",
};
const customerIdleImages = loadCustomerDirectionImages(CUSTOMER_PLAYER_IDLE_URLS);
const customerWalkImages = loadCustomerDirectionImages(CUSTOMER_PLAYER_WALK_URLS);
const CUSTOMER_CLOTHING_COLORS = ["#b5644c", "#4d8bc7", "#5f9f64", "#b88444", "#8a6bc1", "#c06c8b", "#5d8f9f"];
const tintedCustomerSpriteCache = new Map<string, HTMLCanvasElement>();

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
const saleTableGridEl = mustGetElement<HTMLDivElement>("sale-table-grid");
const saleTablePanelEl = mustGetElement<HTMLElement>("sale-table-panel");
const saleTableCapacityEl = mustGetElement<HTMLElement>("sale-table-capacity");
const inventoryDetailsEl = mustGetElement<HTMLDivElement>("inventory-details");
const inventoryCapacityEl = mustGetElement<HTMLElement>("inventory-capacity");
const inventoryModeBannerEl = mustGetElement<HTMLElement>("inventory-mode-banner");
const oceanReturnButtonEl = mustGetElement<HTMLButtonElement>("ocean-return-button");

const workstationPromptEl = mustGetElement<HTMLElement>("workstation-prompt");
const craftToastEl = mustGetElement<HTMLElement>("craft-toast");
const balanceDisplayEl = mustGetElement<HTMLElement>("balance-display");
const moneyDeltaStackEl = mustGetElement<HTMLDivElement>("money-delta-stack");
const cookMarkerEl = mustGetElement<HTMLElement>("cook-marker");
const sellMarkerEl = mustGetElement<HTMLElement>("sell-marker");
const recipeBookOverlayEl = mustGetElement<HTMLElement>("recipe-book-overlay");
const recipeBookGridEl = mustGetElement<HTMLDivElement>("recipe-book-grid");
const recipeBookDetailsEl = mustGetElement<HTMLDivElement>("recipe-book-details");
const recipeBookCookButtonEl = mustGetElement<HTMLButtonElement>("recipe-book-cook");
const recipeBookCloseButtonEl = mustGetElement<HTMLButtonElement>("recipe-book-close");
const recipeBookPrevButtonEl = mustGetElement<HTMLButtonElement>("recipe-book-prev");
const recipeBookNextButtonEl = mustGetElement<HTMLButtonElement>("recipe-book-next");
const recipeBookPageIndicatorEl = mustGetElement<HTMLElement>("recipe-book-page-indicator");
const gameOverOverlayEl = mustGetElement<HTMLElement>("game-over-overlay");

const inventoryDomRefs: InventoryDomRefs = {
  toggleButtonEl: inventoryToggleButtonEl,
  bagTabButtonEl: inventoryBagTabButtonEl,
  discoveredTabButtonEl: inventoryDiscoveredTabButtonEl,
  overlayEl: inventoryOverlayEl,
  modeBannerEl: inventoryModeBannerEl,
  gridEl: inventoryGridEl,
  saleGridEl: saleTableGridEl,
  salePanelEl: saleTablePanelEl,
  saleCapacityEl: saleTableCapacityEl,
  detailsEl: inventoryDetailsEl,
  capacityEl: inventoryCapacityEl,
};

const shopDomRefs: ShopDomRefs = {
  workstationPromptEl,
  recipeBookOverlayEl,
  recipeBookGridEl,
  recipeBookDetailsEl,
  recipeBookCookButtonEl,
  recipeBookCloseButtonEl,
  recipeBookPrevButtonEl,
  recipeBookNextButtonEl,
  recipeBookPageIndicatorEl,
};

const oceanHabitatRoutes = createOceanHabitatRoutes();
const oceanHabitatRoutesById = new Map(oceanHabitatRoutes.map((route) => [route.id, route]));
const oceanHabitatRegions = createOceanHabitatRegions();
const oceanHabitatRegionsByRouteId = new Map(oceanHabitatRegions.map((region) => [region.routeId, region]));
const travelDebugState: TravelDebugSettings = {
  showHabitatRegionDebug: false,
};
const baseState = createBaseState();
const SHOP_EXIT_RECT: WorldRect = {
  x: SHOP_EXIT_DOOR.tileX * BASE_CONSTANTS.TILE_SIZE,
  y: SHOP_EXIT_DOOR.tileY * BASE_CONSTANTS.TILE_SIZE,
  width: SHOP_EXIT_DOOR.tileWidth * BASE_CONSTANTS.TILE_SIZE,
  height: SHOP_EXIT_DOOR.tileHeight * BASE_CONSTANTS.TILE_SIZE,
};
const SHOP_ENTRY_FROM_ISLAND_WORLD_X = SHOP_EXIT_RECT.x + SHOP_EXIT_RECT.width / 2;
const SHOP_ENTRY_FROM_ISLAND_WORLD_Y = SHOP_EXIT_RECT.y + SHOP_EXIT_RECT.height / 2;
const ISLAND_HOUSE_DOOR_RETURN_TILE_X = 16.5;
const ISLAND_HOUSE_DOOR_RETURN_TILE_Y = 11;

const appState: AppState = {
  base: baseState,
  fishing: createFishingState(),
  inventory: createInventoryState(INVENTORY_CAPACITY),
  shop: createShopState(),
  travel: createOceanTravelState(baseState),
  economy: {
    balance: 500,
    bankruptcyThreshold: BANKRUPTCY_LIMIT,
    isGameOver: false,
  },
  keysDown: new Set<string>(),
  fps: 0,
  lastFrameTime: performance.now(),
};

let currentMasterRecipes = getDefaultMasterRecipes();
const pendingRecipeGenerations = new Set<string>();
let nextCustomerSpriteIndex = 0;
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
renderBalanceHud();
syncInventoryOverlay(inventoryDomRefs, appState.inventory);
renderInventoryUi();
renderRecipeBook(appState.shop.recipeBook, shopDomRefs);
updateInteractionPromptVisibility();

window.addEventListener("keydown", (event: KeyboardEvent) => {
  if (appState.economy.isGameOver) {
    return;
  }

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
    if (tryExitShopFromDoor()) {
      return;
    }
    if (tryEnterShopFromIslandDoor()) {
      return;
    }
    if (tryOpenOceanMapFromDock()) {
      return;
    }
    if (tryOpenRecipeBookFromWorkstation()) {
      return;
    }
    tryOpenSaleManagement();
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
oceanReturnButtonEl.addEventListener("click", () => {
  returnToIslandFromOcean();
});

inventoryCloseButtonEl.addEventListener("click", closeInventory);
inventoryBagTabButtonEl.addEventListener("click", () => {
  setInventoryView(appState.inventory, "bag");
  renderInventoryUi();
});
inventoryDiscoveredTabButtonEl.addEventListener("click", () => {
  setInventoryView(appState.inventory, "discovered");
  const discoveredFish = getDiscoveredFish(appState.inventory);
  if (discoveredFish.length > 0 && appState.inventory.selectedDiscoveredFishId === null) {
    selectDiscoveredFish(appState.inventory, discoveredFish[0].id);
  }
  renderInventoryUi();
});
inventoryOverlayEl.addEventListener("click", (event: MouseEvent) => {
  if (event.target === inventoryOverlayEl) {
    closeInventory();
  }
});

recipeBookCloseButtonEl.addEventListener("click", closeRecipeBookOverlay);
recipeBookCookButtonEl.addEventListener("click", () => {
  cookSelectedRecipe();
});

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
  if (appState.economy.isGameOver) {
    renderStatusReadout();
    return;
  }

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
      renderInventoryUi();
    },
  });
  updateCustomers(dt);
  syncFishingStatusForActiveHabitat();
  updateInteractionPromptVisibility();

  updateCamera(appState.base);
  renderStatusReadout();
}

function render(): void {
  drawSceneBackgroundAndGrid(renderCtx, appState.base, GAME_CONFIG.debugMode);
  drawIslandInteractionPlaceholders();
  drawFishingWorldLayer(renderCtx, appState.fishing, {
    currentSceneId: appState.base.currentSceneId,
    toScreenPoint: (worldPoint) => toScreenPoint(appState.base, worldPoint),
    getRodOriginWorld,
  });
  drawWorkstation(renderCtx, appState.base.currentSceneId, appState.shop.workstation, appState.base.camera);
  drawCustomer(renderCtx);
  drawCollisionDebugBoxes(renderCtx, appState.base, GAME_CONFIG.debugMode);
  drawPlayer(renderCtx, appState.base);
  drawFishingHud(renderCtx, appState.fishing, appState.base.currentSceneId);
  drawOceanMapOverlay();
  updateOceanReturnButtonVisibility();
  updateWorldMarkers();
}

function handleCanvasClick(event: MouseEvent): void {
  if (appState.economy.isGameOver) {
    return;
  }

  const clickScreenPoint = getCanvasCoordinates(canvas, event);

  if (appState.travel.isMapOpen) {
    handleOceanMapClick(clickScreenPoint);
    return;
  }

  if (isBlockingOverlayOpen()) {
    return;
  }

  if (appState.base.currentSceneId !== "ocean") {
    return;
  }

  const clickWorldPoint = toWorldPoint(appState.base, clickScreenPoint);
  maybeChargeForCast(clickWorldPoint);
  if (appState.economy.isGameOver) {
    return;
  }
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
  appState.shop.isSaleManagementOpen = false;
  setInventoryInteractionMode(appState.inventory, "default");
  setInventoryOpen(appState.inventory, true);
  refreshCraftableRecipes();
  syncInventoryOverlay(inventoryDomRefs, appState.inventory);
  renderInventoryUi();
  updateInteractionPromptVisibility();
}

function closeInventory(): void {
  if (!appState.inventory.isOpen) {
    return;
  }

  appState.shop.isSaleManagementOpen = false;
  setInventoryInteractionMode(appState.inventory, "default");
  setInventoryOpen(appState.inventory, false);
  syncInventoryOverlay(inventoryDomRefs, appState.inventory);
  updateInteractionPromptVisibility();
}

function renderInventoryUi(): void {
  renderInventory(
    inventoryDomRefs,
    appState.inventory,
    appState.shop.saleTableSlots,
    moveItemFromBackpackToSaleTable,
    moveItemFromSaleTableToBackpack,
  );
}

function tryOpenOceanMapFromDock(): boolean {
  if (!isPlayerOnDock()) {
    return false;
  }

  openOceanMap();
  return true;
}

function tryOpenRecipeBookFromWorkstation(): boolean {
  if (!isPlayerNearWorkstation(appState.base, appState.shop.workstation)) {
    return false;
  }

  openRecipeBookOverlay();
  return true;
}

function tryOpenSaleManagement(): boolean {
  if (!isPlayerNearSaleTable(appState.base, appState.shop.saleTable)) {
    return false;
  }

  openSaleManagement();
  return true;
}

function openSaleManagement(): void {
  closeOceanMap();
  closeRecipeBookOverlay();
  appState.shop.isSaleManagementOpen = true;
  setInventoryInteractionMode(appState.inventory, "sale");
  setInventoryView(appState.inventory, "bag");
  setInventoryOpen(appState.inventory, true);
  syncInventoryOverlay(inventoryDomRefs, appState.inventory);
  renderInventoryUi();
  updateInteractionPromptVisibility();
}

function moveItemFromBackpackToSaleTable(slotIndex: number): void {
  const removedItem = removeItemFromSlotsByIndex(appState.inventory.slots, slotIndex);
  if (!removedItem) {
    return;
  }

  const addResult = tryAddItemToSlots(appState.shop.saleTableSlots, removedItem);
  if (!addResult.added) {
    tryAddItemToSlots(appState.inventory.slots, removedItem);
    showCraftToast("The sale table is full.");
    return;
  }

  appState.inventory.selectedSlotIndex = appState.inventory.slots.find((slot) => slot.item !== null)?.slotIndex ?? null;
}

function moveItemFromSaleTableToBackpack(slotIndex: number): void {
  const removedItem = removeItemFromSlotsByIndex(appState.shop.saleTableSlots, slotIndex);
  if (!removedItem) {
    return;
  }

  const addResult = tryAddItemToSlots(appState.inventory.slots, removedItem);
  if (!addResult.added) {
    tryAddItemToSlots(appState.shop.saleTableSlots, removedItem);
    showCraftToast("Your backpack is full.");
    return;
  }

  appState.inventory.selectedSlotIndex = addResult.slotIndex;
}

function getSaleTableItems() {
  return appState.shop.saleTableSlots.flatMap((slot) => (slot.item ? [{ slotIndex: slot.slotIndex, item: slot.item }] : []));
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
    x: appState.base.player.x,
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
  const craftableRecipes = getCraftableRecipesForInventory(inventoryFish, discoveredFish, currentMasterRecipes)
    .map((recipe) => {
      const hasRequiredFish = recipe.currentFishQuantity >= recipe.requiredFishQuantity;
      const canAfford = appState.economy.balance >= recipe.craftCost;
      const missingRequiredFishCount = Math.max(0, recipe.requiredFishQuantity - recipe.currentFishQuantity);
      const missingBalanceAmount = Number(Math.max(0, recipe.craftCost - appState.economy.balance).toFixed(2));

      return {
        ...recipe,
        hasRequiredFish,
        canAfford,
        isCraftable: hasRequiredFish && canAfford,
        missingRequiredFishCount,
        missingBalanceAmount,
        availabilityLabel: !hasRequiredFish
          ? `Need ${missingRequiredFishCount} more ${recipe.requiredFishName}`
          : canAfford
            ? "Ready to cook"
            : `Need $${missingBalanceAmount.toFixed(2)} more`,
      };
    })
    .sort((left, right) => {
      if (left.isCraftable !== right.isCraftable) {
        return left.isCraftable ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
  setRecipeBookRecipes(appState.shop.recipeBook, craftableRecipes);

  if (!appState.shop.recipeBook.isOpen) {
    return;
  }

  renderRecipeBook(appState.shop.recipeBook, shopDomRefs);
}

function cookSelectedRecipe(): void {
  const selectedRecipe = getSelectedRecipe(appState.shop.recipeBook);
  if (!selectedRecipe || !selectedRecipe.isCraftable) {
    return;
  }

  if (appState.economy.balance < selectedRecipe.craftCost) {
    showCraftToast(`You need $${selectedRecipe.craftCost.toFixed(2)} to cook ${selectedRecipe.name}.`);
    refreshCraftableRecipes();
    return;
  }

  const normalizedRequiredName = normalizeInventoryFishName(selectedRecipe.requiredFishName);
  const normalizedScientificName = normalizeInventoryFishName(selectedRecipe.requiredFishScientificName);
  const removedFishCount = removeFishFromInventory(
    appState.inventory,
    (fish) => {
      const candidateNames = [normalizeInventoryFishName(fish.name), normalizeInventoryFishName(fish.scientificName)];
      return candidateNames.includes(normalizedRequiredName) || (normalizedScientificName !== "" && candidateNames.includes(normalizedScientificName));
    },
    selectedRecipe.requiredFishQuantity,
  );

  if (removedFishCount < selectedRecipe.requiredFishQuantity) {
    refreshCraftableRecipes();
    renderInventoryUi();
    return;
  }

  changeBalance(-selectedRecipe.craftCost, `Cooked ${selectedRecipe.name}`);

  const cookedFood = createCookedFoodFromRecipe(selectedRecipe);
  const addResult = tryAddFoodToInventory(appState.inventory, cookedFood);
  if (!addResult.added) {
    console.warn(`Cooked ${selectedRecipe.name} but could not add it to inventory because the bag is full.`);
    showCraftToast(`Cooked ${selectedRecipe.name}, but the bag is full.`);
  } else {
    showCraftToast(`${selectedRecipe.name} was cooked and added to your bag.`);
  }

  refreshCraftableRecipes();
  renderInventoryUi();
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

  if (isPlayerAtShopExitDoor()) {
    workstationPromptEl.textContent = "Press E to return to island";
    workstationPromptEl.classList.remove("is-hidden");
    return;
  }

  if (isPlayerOnDock()) {
    workstationPromptEl.textContent = "Press E to open ocean chart";
    workstationPromptEl.classList.remove("is-hidden");
    return;
  }

  if (isPlayerAtIslandHouseDoor()) {
    workstationPromptEl.textContent = "Press E to enter shop";
    workstationPromptEl.classList.remove("is-hidden");
    return;
  }

  if (isPlayerNearWorkstation(appState.base, appState.shop.workstation)) {
    workstationPromptEl.textContent = "Press E to open workstation";
    workstationPromptEl.classList.remove("is-hidden");
    return;
  }

  if (isPlayerNearSaleTable(appState.base, appState.shop.saleTable)) {
    workstationPromptEl.textContent = "Press E to manage sale table";
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
        balance: appState.economy.balance,
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
  const dockTileRect = getIslandDockInteractionTileRect();
  const houseDoorTileRect = getIslandHouseDoorInteractionTileRect();
  const dockRectWidth = Math.max(1, Math.round(tileSize * dockTileRect.width));
  const dockRectHeight = Math.max(1, Math.round(tileSize * dockTileRect.height));
  const houseDoorRectWidth = Math.max(1, Math.round(tileSize * houseDoorTileRect.width));
  const houseDoorRectHeight = Math.max(1, Math.round(tileSize * houseDoorTileRect.height));
  const islandWorldWidth = islandScene.worldCols * tileSize;
  const islandWorldHeight = islandScene.worldRows * tileSize;
  const defaultHabitatId = getDefaultHabitatId();
  const selectedHabitatId =
    oceanHabitatRoutesById.get(defaultHabitatId)?.id ?? oceanHabitatRoutes[0]?.id ?? defaultHabitatId;

  return {
    isMapOpen: false,
    dockRect: {
      x: clamp(Math.round(tileSize * dockTileRect.x), 0, Math.max(0, islandWorldWidth - dockRectWidth)),
      y: clamp(Math.round(tileSize * dockTileRect.y), 0, Math.max(0, islandWorldHeight - dockRectHeight)),
      width: dockRectWidth,
      height: dockRectHeight,
    },
    houseDoorRect: {
      x: clamp(Math.round(tileSize * houseDoorTileRect.x), 0, Math.max(0, islandWorldWidth - houseDoorRectWidth)),
      y: clamp(Math.round(tileSize * houseDoorTileRect.y), 0, Math.max(0, islandWorldHeight - houseDoorRectHeight)),
      width: houseDoorRectWidth,
      height: houseDoorRectHeight,
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

function isPlayerAtIslandHouseDoor(): boolean {
  if (appState.base.currentSceneId !== "island") {
    return false;
  }

  return isPointInsideRect(
    {
      x: appState.base.player.x,
      y: appState.base.player.y,
    },
    appState.travel.houseDoorRect,
  );
}

function isPlayerAtShopExitDoor(): boolean {
  if (appState.base.currentSceneId !== "shop") {
    return false;
  }

  return isPointInsideRect(
    {
      x: appState.base.player.x,
      y: appState.base.player.y,
    },
    SHOP_EXIT_RECT,
  );
}

function placePlayerAtSceneTile(tileX: number, tileY: number): void {
  const tile = BASE_CONSTANTS.TILE_SIZE;
  appState.base.player.x = tileX * tile + tile / 2;
  appState.base.player.y = tileY * tile + tile / 2;
  centerCameraOnPlayer(appState.base);
}

function placePlayerAtWorldPoint(worldX: number, worldY: number): void {
  appState.base.player.x = worldX;
  appState.base.player.y = worldY;
  centerCameraOnPlayer(appState.base);
}

function tryExitShopFromDoor(): boolean {
  if (!isPlayerAtShopExitDoor()) {
    return false;
  }

  switchScene("island");
  placePlayerAtSceneTile(ISLAND_HOUSE_DOOR_RETURN_TILE_X, ISLAND_HOUSE_DOOR_RETURN_TILE_Y);
  updateInteractionPromptVisibility();
  return true;
}

function tryEnterShopFromIslandDoor(): boolean {
  if (!isPlayerAtIslandHouseDoor()) {
    return false;
  }

  switchScene("shop");
  placePlayerAtWorldPoint(SHOP_ENTRY_FROM_ISLAND_WORLD_X, SHOP_ENTRY_FROM_ISLAND_WORLD_Y);
  updateInteractionPromptVisibility();
  return true;
}

function returnToIslandFromOcean(): void {
  if (appState.base.currentSceneId !== "ocean" || appState.economy.isGameOver) {
    return;
  }

  switchScene("island");
  placePlayerAtWorldPoint(
    appState.travel.dockRect.x + appState.travel.dockRect.width / 2,
    appState.travel.dockRect.y + appState.travel.dockRect.height / 2,
  );
  updateInteractionPromptVisibility();
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

function drawIslandInteractionPlaceholders(): void {
  if (!GAME_CONFIG.debugMode || appState.base.currentSceneId !== "island") {
    return;
  }

  drawInteractionPlaceholder(
    appState.travel.houseDoorRect,
    "House door: stand here + press E",
    "rgba(70, 90, 142, 0.95)",
    "rgba(199, 226, 255, 0.95)",
    "rgba(32, 47, 87, 0.75)",
  );
  drawInteractionPlaceholder(
    appState.travel.dockRect,
    "Dock: stand here + press E",
    "rgba(101, 72, 43, 0.95)",
    "rgba(249, 217, 159, 0.95)",
    "rgba(67, 46, 26, 0.75)",
  );
}

function drawInteractionPlaceholder(
  rect: WorldRect,
  label: string,
  fillColor: string,
  borderColor: string,
  innerFillColor: string,
): void {
  const rectTopLeft = toScreenPoint(appState.base, { x: rect.x, y: rect.y });
  const rectInset = Math.max(1, Math.round(2 * BASE_CONSTANTS.GLOBAL_SCALE));

  renderCtx.fillStyle = fillColor;
  renderCtx.fillRect(rectTopLeft.x, rectTopLeft.y, rect.width, rect.height);

  renderCtx.strokeStyle = borderColor;
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  renderCtx.strokeRect(rectTopLeft.x, rectTopLeft.y, rect.width, rect.height);

  renderCtx.fillStyle = innerFillColor;
  renderCtx.fillRect(
    rectTopLeft.x + rectInset,
    rectTopLeft.y + rectInset,
    rect.width - rectInset * 2,
    rect.height - rectInset * 2,
  );

  renderCtx.fillStyle = "#f5e4c1";
  renderCtx.font = `${Math.max(10, Math.round(11 * BASE_CONSTANTS.GLOBAL_SCALE))}px monospace`;
  renderCtx.textAlign = "center";
  renderCtx.textBaseline = "middle";
  renderCtx.fillText(
    label,
    rectTopLeft.x + rect.width / 2,
    rectTopLeft.y - Math.max(3, Math.round(4 * BASE_CONSTANTS.GLOBAL_SCALE)),
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

function updateOceanReturnButtonVisibility(): void {
  const shouldShow =
    appState.base.currentSceneId === "ocean" &&
    !appState.travel.isMapOpen &&
    !appState.inventory.isOpen &&
    !appState.shop.recipeBook.isOpen &&
    !appState.economy.isGameOver;

  oceanReturnButtonEl.classList.toggle("is-hidden", !shouldShow);
  oceanReturnButtonEl.setAttribute("aria-hidden", String(!shouldShow));
  oceanReturnButtonEl.disabled = !shouldShow;
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

  appState.fishing.session.statusText = `Uncharted waters. Click open water to cast. Each cast costs $${CAST_COST}.`;
}

function maybeChargeForCast(worldPoint: Vector2): void {
  if (appState.base.currentSceneId !== "ocean" || appState.fishing.session.phase !== "idle") {
    return;
  }

  const tileX = Math.floor(worldPoint.x / BASE_CONSTANTS.TILE_SIZE);
  const tileY = Math.floor(worldPoint.y / BASE_CONSTANTS.TILE_SIZE);
  const tileKind = getTileKind(appState.base.sceneTerrains, "ocean", tileX, tileY);
  if (tileKind !== "water") {
    return;
  }

  changeBalance(-CAST_COST, "Cast the fishing line");
}

function changeBalance(delta: number, reason: string): void {
  const nextBalance = Number((appState.economy.balance + delta).toFixed(2));
  appState.economy.balance = nextBalance;
  renderBalanceHud();
  showMoneyDelta(delta, reason);
  refreshCraftableRecipes();

  if (appState.economy.balance <= appState.economy.bankruptcyThreshold) {
    triggerBankruptcy();
  }
}

function renderBalanceHud(): void {
  balanceDisplayEl.textContent = `Balance: ${formatMoney(appState.economy.balance)}`;
  gameOverOverlayEl.classList.toggle("is-hidden", !appState.economy.isGameOver);
  gameOverOverlayEl.setAttribute("aria-hidden", String(!appState.economy.isGameOver));
}

function showMoneyDelta(delta: number, reason: string): void {
  const entryEl = document.createElement("p");
  entryEl.className = `money-delta ${delta >= 0 ? "is-positive" : "is-negative"}`;
  entryEl.textContent = `${delta >= 0 ? "+" : "-"}${formatMoney(Math.abs(delta))} • ${reason}`;
  moneyDeltaStackEl.prepend(entryEl);
  window.setTimeout(() => {
    entryEl.remove();
  }, 2400);
}

function formatMoney(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function triggerBankruptcy(): void {
  if (appState.economy.isGameOver) {
    return;
  }

  appState.economy.isGameOver = true;
  appState.keysDown.clear();
  appState.fishing.isReelHeld = false;
  closeOceanMap();
  closeRecipeBookOverlay();
  closeInventory();
  renderBalanceHud();
  showCraftToast("You filed for bankruptcy.");
}

function showCraftToast(message: string): void {
  craftToastEl.textContent = message;
  craftToastEl.classList.remove("is-hidden");

  const token = String(Date.now());
  craftToastEl.dataset.toastToken = token;
  window.setTimeout(() => {
    if (craftToastEl.dataset.toastToken !== token) {
      return;
    }

    craftToastEl.classList.add("is-hidden");
  }, 2400);
}

function normalizeInventoryFishName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function updateCustomers(dt: number): void {
  appState.shop.gameElapsedSeconds += dt;
  const customer = appState.shop.customer;

  if (!customer.isActive) {
    appState.shop.customerSpawnTimer -= dt;
    if (appState.shop.customerSpawnTimer <= 0) {
      spawnCustomer();
      appState.shop.customerSpawnTimer = getCustomerSpawnInterval();
    }
    return;
  }

  if (customer.state === "arriving") {
    moveCustomerTowards(getCustomerCurrentTarget(), dt);
    if (isCustomerAtTarget(getCustomerSellTarget())) {
      customer.state = "waiting";
      customer.patienceRemaining = CUSTOMER_PATIENCE_SECONDS;
      customer.purchaseTimer = CUSTOMER_PURCHASE_DELAY;
      setCustomerWanderTarget();
    }
    return;
  }

  if (customer.state === "waiting") {
    if (getSaleTableItems().length > 0) {
      customer.state = "buying";
      customer.purchaseTimer = CUSTOMER_PURCHASE_DELAY;
      wanderCustomerInSellBox(dt);
      return;
    }

    customer.patienceRemaining -= dt;
    if (customer.patienceRemaining <= 0) {
      changeBalance(-CUSTOMER_EMPTY_PENALTY, "Customer left with no items to buy");
      customer.state = "leaving";
      return;
    }
    wanderCustomerInSellBox(dt);
    return;
  }

  if (customer.state === "buying") {
    if (getSaleTableItems().length === 0) {
      customer.state = "waiting";
      return;
    }

    customer.purchaseTimer -= dt;
    if (customer.purchaseTimer <= 0) {
      completeCustomerPurchase();
      customer.state = "leaving";
      return;
    }
    wanderCustomerInSellBox(dt);
    return;
  }

  moveCustomerTowards(getCustomerExitTarget(), dt);
  if (isCustomerAtTarget(getCustomerExitTarget())) {
    resetCustomer();
  }
}

function spawnCustomer(): void {
  const entry = getCustomerEntryTarget();
  const spriteIndex = nextCustomerSpriteIndex % CUSTOMER_CLOTHING_COLORS.length;
  const target = createCustomerSellBoxTarget();
  nextCustomerSpriteIndex += 1;
  appState.shop.customer = {
    isActive: true,
    x: entry.x,
    y: entry.y,
    state: "arriving",
    patienceRemaining: CUSTOMER_PATIENCE_SECONDS,
    purchaseTimer: CUSTOMER_PURCHASE_DELAY,
    spriteIndex,
    facing: "up",
    isMoving: true,
    animationTime: 0,
    targetX: target.x,
    targetY: target.y,
  };
}

function resetCustomer(): void {
  appState.shop.customer.isActive = false;
  appState.shop.customer.state = "arriving";
  appState.shop.customer.patienceRemaining = CUSTOMER_PATIENCE_SECONDS;
  appState.shop.customer.purchaseTimer = 0;
  appState.shop.customer.isMoving = false;
  appState.shop.customer.animationTime = 0;
  appState.shop.customer.targetX = 0;
  appState.shop.customer.targetY = 0;
}

function getCustomerSpawnInterval(): number {
  return Math.max(6, 20 - Math.floor(appState.shop.gameElapsedSeconds / 45) * 2);
}

function getCustomerEntryTarget(): CustomerTarget {
  const tile = BASE_CONSTANTS.TILE_SIZE;
  return {
    x: appState.base.scenes.shop.worldCols * tile * 0.5,
    y: 26 * tile + tile / 2,
  };
}

function getCustomerExitTarget(): CustomerTarget {
  const customer = appState.shop.customer;
  return {
    x: customer.x,
    y: getCustomerEntryTarget().y,
  };
}

function getCustomerSellTarget(): CustomerTarget {
  const customer = appState.shop.customer;
  return {
    x: customer.targetX,
    y: customer.targetY,
  };
}

function getCustomerCurrentTarget(): CustomerTarget {
  const customer = appState.shop.customer;
  return {
    x: customer.targetX,
    y: customer.targetY,
  };
}

function createCustomerSellBoxTarget(): CustomerTarget {
  const tile = BASE_CONSTANTS.TILE_SIZE;
  const saleX = appState.shop.saleTable.tileX * tile + tile / 2;
  const saleY = appState.shop.saleTable.tileY * tile + tile * 0.65;
  return {
    x: saleX + randomInRange(CUSTOMER_SELL_BOX_MIN_X, CUSTOMER_SELL_BOX_MAX_X),
    y: saleY + randomInRange(CUSTOMER_SELL_BOX_MIN_Y, CUSTOMER_SELL_BOX_MAX_Y),
  };
}

function setCustomerWanderTarget(): void {
  const customer = appState.shop.customer;
  const target = createCustomerSellBoxTarget();
  customer.targetX = target.x;
  customer.targetY = target.y;
}

function wanderCustomerInSellBox(dt: number): void {
  if (isCustomerAtTarget(getCustomerCurrentTarget())) {
    setCustomerWanderTarget();
  }

  moveCustomerTowards(getCustomerCurrentTarget(), dt);
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function moveCustomerTowards(target: CustomerTarget, dt: number): void {
  const customer = appState.shop.customer;
  const dx = target.x - customer.x;
  const dy = target.y - customer.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0.001) {
    customer.x = target.x;
    customer.y = target.y;
    customer.isMoving = false;
    customer.animationTime = 0;
    return;
  }

  const step = Math.min(distance, CUSTOMER_SPEED * dt);
  customer.x += (dx / distance) * step;
  customer.y += (dy / distance) * step;
  customer.facing = getCustomerFacing(dx, dy);
  customer.isMoving = true;
  customer.animationTime += dt;
}

function isCustomerAtTarget(target: CustomerTarget): boolean {
  const customer = appState.shop.customer;
  return Math.hypot(target.x - customer.x, target.y - customer.y) < 4;
}

function getCustomerFacing(dx: number, dy: number): PlayerDirection {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }

  return dy > 0 ? "down" : "up";
}

function stopCustomerWalking(facing: PlayerDirection): void {
  const customer = appState.shop.customer;
  customer.facing = facing;
  customer.isMoving = false;
  customer.animationTime = 0;
}

function completeCustomerPurchase(): void {
  const saleItems = getSaleTableItems();
  if (saleItems.length === 0) {
    return;
  }

  const chosenSaleItem = saleItems[Math.floor(Math.random() * saleItems.length)];
  const soldItem = removeItemFromSlotsByIndex(appState.shop.saleTableSlots, chosenSaleItem.slotIndex);
  if (!soldItem) {
    return;
  }

  changeBalance(soldItem.value, `${soldItem.name} sold`);
  showCraftToast(`Customer bought ${soldItem.name} for ${formatMoney(soldItem.value)}.`);

  if (appState.inventory.isOpen) {
    renderInventoryUi();
  }
}

function drawCustomer(targetCtx: CanvasRenderingContext2D): void {
  const customer = appState.shop.customer;
  if (!customer.isActive || appState.base.currentSceneId !== "shop") {
    return;
  }

  const screenPoint = toScreenPoint(appState.base, { x: customer.x, y: customer.y });
  drawCustomerSprite(targetCtx, screenPoint);

  if (customer.state === "waiting" && getSaleTableItems().length === 0) {
    const barWidth = Math.round(44 * BASE_CONSTANTS.GLOBAL_SCALE);
    const barHeight = Math.max(4, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE));
    const x = screenPoint.x - barWidth / 2;
    const y = screenPoint.y - Math.round(54 * BASE_CONSTANTS.GLOBAL_SCALE);
    const ratio = clamp(customer.patienceRemaining / CUSTOMER_PATIENCE_SECONDS, 0, 1);

    targetCtx.fillStyle = "rgba(20, 15, 14, 0.8)";
    targetCtx.fillRect(x, y, barWidth, barHeight);
    targetCtx.fillStyle = ratio > 0.4 ? "#71cf7a" : "#d76f53";
    targetCtx.fillRect(x, y, barWidth * ratio, barHeight);
    targetCtx.strokeStyle = "rgba(255, 245, 223, 0.8)";
    targetCtx.strokeRect(x, y, barWidth, barHeight);
  }
}

function drawCustomerSprite(targetCtx: CanvasRenderingContext2D, screenPoint: Vector2): void {
  const customer = appState.shop.customer;
  const drawWidth = Math.round(CUSTOMER_FRAME_SIZE * BASE_CONSTANTS.GLOBAL_SCALE * CUSTOMER_DRAW_SCALE);
  const drawHeight = Math.round(CUSTOMER_FRAME_SIZE * BASE_CONSTANTS.GLOBAL_SCALE * CUSTOMER_DRAW_SCALE);
  const screenX = Math.round(screenPoint.x - drawWidth / 2);
  const screenY = Math.round(screenPoint.y - drawHeight + BASE_CONSTANTS.PLAYER_SIZE / 2);
  const source = customer.isMoving ? customerWalkImages : customerIdleImages;
  const sprite = source[customer.facing];

  if (!sprite.complete) {
    drawCustomerFallback(targetCtx, screenPoint);
    return;
  }

  const palette = CUSTOMER_CLOTHING_COLORS[customer.spriteIndex % CUSTOMER_CLOTHING_COLORS.length] ?? CUSTOMER_CLOTHING_COLORS[0];
  const tintedSprite = getTintedCustomerSprite(sprite, palette);
  const frameCount = customer.isMoving ? CUSTOMER_WALK_FRAMES : CUSTOMER_IDLE_FRAMES;
  const frame = customer.isMoving
    ? Math.floor(customer.animationTime / CUSTOMER_WALK_FRAME_SECONDS) % frameCount
    : 0;

  targetCtx.drawImage(
    tintedSprite,
    frame * CUSTOMER_FRAME_SIZE,
    0,
    CUSTOMER_FRAME_SIZE,
    CUSTOMER_FRAME_SIZE,
    screenX,
    screenY,
    drawWidth,
    drawHeight,
  );
}

function drawCustomerFallback(targetCtx: CanvasRenderingContext2D, screenPoint: Vector2): void {
  const customer = appState.shop.customer;
  const bodyRadius = Math.round(7 * BASE_CONSTANTS.GLOBAL_SCALE);

  targetCtx.fillStyle = "#f2d2b6";
  targetCtx.beginPath();
  targetCtx.arc(screenPoint.x, screenPoint.y - bodyRadius * 1.7, bodyRadius * 0.72, 0, Math.PI * 2);
  targetCtx.fill();

  targetCtx.fillStyle = customer.state === "buying" ? "#4d8bc7" : "#b5644c";
  targetCtx.fillRect(screenPoint.x - bodyRadius, screenPoint.y - bodyRadius, bodyRadius * 2, bodyRadius * 2.4);
}

function loadCustomerDirectionImages(urls: Record<PlayerDirection, string>): Record<PlayerDirection, HTMLImageElement> {
  return {
    down: loadCustomerImage(urls.down),
    left: loadCustomerImage(urls.left),
    right: loadCustomerImage(urls.right),
    up: loadCustomerImage(urls.up),
  };
}

function loadCustomerImage(src: string): HTMLImageElement {
  const image = new Image();
  image.src = src;
  return image;
}

function getTintedCustomerSprite(source: HTMLImageElement, clothingColor: string): HTMLCanvasElement {
  const cacheKey = `${source.src}:${clothingColor}`;
  const cached = tintedCustomerSpriteCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const canvasEl = document.createElement("canvas");
  canvasEl.width = source.naturalWidth;
  canvasEl.height = source.naturalHeight;
  const context = canvasEl.getContext("2d");
  if (!context) {
    return canvasEl;
  }

  context.drawImage(source, 0, 0);
  const imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height);
  const target = parseHexColor(clothingColor);
  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = imageData.data[index + 3] ?? 0;
    if (alpha === 0) {
      continue;
    }

    const red = imageData.data[index] ?? 0;
    const green = imageData.data[index + 1] ?? 0;
    const blue = imageData.data[index + 2] ?? 0;
    if (!isPlayerClothingPixel(red, green, blue)) {
      continue;
    }

    const shade = clamp((red + green + blue) / (255 * 3), 0, 1);
    const multiplier = 0.48 + shade * 0.82;
    imageData.data[index] = Math.round(target.r * multiplier);
    imageData.data[index + 1] = Math.round(target.g * multiplier);
    imageData.data[index + 2] = Math.round(target.b * multiplier);
  }

  context.putImageData(imageData, 0, 0);
  tintedCustomerSpriteCache.set(cacheKey, canvasEl);
  return canvasEl;
}

function isPlayerClothingPixel(red: number, green: number, blue: number): boolean {
  return blue > red + 12 && blue > green + 4 && green > 35;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  return {
    r: Number.parseInt(cleaned.slice(0, 2), 16),
    g: Number.parseInt(cleaned.slice(2, 4), 16),
    b: Number.parseInt(cleaned.slice(4, 6), 16),
  };
}

function updateWorldMarkers(): void {
  updateWorldMarker(cookMarkerEl, appState.shop.workstation.tileX, appState.shop.workstation.tileY - 1.1, "shop");
  updateWorldMarker(sellMarkerEl, appState.shop.saleTable.tileX, appState.shop.saleTable.tileY - 0.8, "shop");
}

function updateWorldMarker(markerEl: HTMLElement, tileX: number, tileY: number, sceneId: SceneId): void {
  if (appState.base.currentSceneId !== sceneId || appState.travel.isMapOpen) {
    markerEl.classList.add("is-hidden");
    return;
  }

  const worldPoint = {
    x: tileX * BASE_CONSTANTS.TILE_SIZE + BASE_CONSTANTS.TILE_SIZE / 2,
    y: tileY * BASE_CONSTANTS.TILE_SIZE + BASE_CONSTANTS.TILE_SIZE / 2,
  };
  const screenPoint = toScreenPoint(appState.base, worldPoint);
  const onscreen =
    screenPoint.x >= -24 &&
    screenPoint.x <= BASE_CONSTANTS.RENDER_WIDTH + 24 &&
    screenPoint.y >= -24 &&
    screenPoint.y <= BASE_CONSTANTS.RENDER_HEIGHT + 24;

  markerEl.classList.toggle("is-hidden", !onscreen);
  if (!onscreen) {
    return;
  }

  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / canvas.width;
  const scaleY = canvasRect.height / canvas.height;
  markerEl.style.left = `${canvasRect.left + screenPoint.x * scaleX}px`;
  markerEl.style.top = `${canvasRect.top + screenPoint.y * scaleY}px`;
}
