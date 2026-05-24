import { BASE_CONSTANTS } from "./constants";
import { getTileKind, isRestaurantInteriorTile } from "./terrain";
import type { BaseState, PlayerDirection, SceneId } from "./types";

const propsUrl = "/sprites-clean/props_transparent.png";
const treesUrl = "/sprites-clean/trees_transparent.png";
const boatUrl = "/sprites-clean/boat_transparent.png";
const interiorUrl = "/sprites-clean/Interior.png";
const islandFullUrl = new URL("../../../sprites/island_full.png", import.meta.url).href;
const oceanFullUrl = new URL("../../../sprites/ocean_full.png", import.meta.url).href;
const kitchenFullUrl = new URL("../../../sprites/kitchen_full.png", import.meta.url).href;
const doorUrl = new URL("../../../sprites/door.png", import.meta.url).href;

const playerIdleUrls: Record<PlayerDirection, string> = {
  down: "/sprites-clean/player/idle-down.png",
  left: "/sprites-clean/player/idle-left.png",
  right: "/sprites-clean/player/idle-right.png",
  up: "/sprites-clean/player/idle-up.png",
};

const playerWalkUrls: Record<PlayerDirection, string> = {
  down: "/sprites-clean/player/walk-down.png",
  left: "/sprites-clean/player/walk-left.png",
  right: "/sprites-clean/player/walk-right.png",
  up: "/sprites-clean/player/walk-up.png",
};

interface SpriteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WorldSprite {
  sceneId: SceneId;
  source: HTMLImageElement;
  rect: SpriteRect;
  tileX: number;
  tileY: number;
  width: number;
  height: number;
  anchor?: "bottom" | "center";
}

const artImages = {
  props: loadImage(propsUrl),
  trees: loadImage(treesUrl),
  boat: loadImage(boatUrl),
  playerIdle: loadPlayerImages(playerIdleUrls),
  playerWalk: loadPlayerImages(playerWalkUrls),
  interior: loadImage(interiorUrl),
  islandFull: loadImage(islandFullUrl),
  oceanFull: loadImage(oceanFullUrl),
  kitchenFull: loadImage(kitchenFullUrl),
  door: loadImage(doorUrl),
};

const BOAT_RECT = { x: 410, y: 175, width: 430, height: 865 };
const PLAYER_FRAME_SIZE = 32;
const PLAYER_DRAW_SCALE = 1.4;
const PLAYER_IDLE_FRAMES = 4;
const PLAYER_WALK_FRAMES = 6;
const PLAYER_WALK_FRAME_SECONDS = 0.11;
const DOOR_RECT = { x: 700, y: 415, width: 135, height: 145 };

const PROP_RECTS = {
  driftLog: { x: 350, y: 170, width: 105, height: 70 },
  stump: { x: 480, y: 150, width: 92, height: 95 },
  rock: { x: 590, y: 150, width: 90, height: 105 },
  flowerBush: { x: 360, y: 305, width: 90, height: 85 },
  berryBush: { x: 480, y: 305, width: 90, height: 85 },
  palm: { x: 700, y: 430, width: 105, height: 145 },
  shell: { x: 650, y: 690, width: 44, height: 40 },
  starfish: { x: 880, y: 690, width: 45, height: 44 },
  coral: { x: 925, y: 680, width: 56, height: 58 },
  seaweedA: { x: 575, y: 805, width: 42, height: 65 },
  seaweedB: { x: 675, y: 805, width: 42, height: 65 },
  buoy: { x: 845, y: 560, width: 62, height: 65 },
  crate: { x: 965, y: 270, width: 78, height: 70 },
  dock: { x: 1080, y: 650, width: 105, height: 90 },
  post: { x: 865, y: 410, width: 48, height: 90 },
  sign: { x: 1220, y: 815, width: 80, height: 62 },
  lantern: { x: 1325, y: 650, width: 58, height: 88 },
} as const;

const TREE_RECTS = [
  { x: 70, y: 190, width: 220, height: 275 },
  { x: 390, y: 180, width: 195, height: 285 },
  { x: 670, y: 195, width: 220, height: 270 },
  { x: 85, y: 530, width: 205, height: 260 },
  { x: 690, y: 535, width: 190, height: 260 },
  { x: 990, y: 530, width: 195, height: 265 },
];

const ISLAND_DECOR: Omit<WorldSprite, "source">[] = [
  tree(16, 9, 0),
  tree(27, 9, 2),
  tree(13, 15, 3),
  tree(30, 17, 5),
  prop("flowerBush", 20, 12, 32, 30),
  prop("berryBush", 25, 14, 32, 30),
  prop("stump", 18, 18, 30, 30),
  prop("rock", 29, 12, 28, 30),
  prop("palm", 33, 14, 40, 52),
  prop("shell", 13, 20, 16, 14),
  prop("starfish", 32, 20, 16, 16),
  prop("driftLog", 23, 20, 32, 20),
  prop("seaweedA", 9, 12, 16, 24),
  prop("seaweedB", 36, 13, 16, 24),
  prop("coral", 10, 19, 20, 20),
];

const OCEAN_DECOR: Omit<WorldSprite, "source">[] = [
  prop("buoy", 8, 7, 20, 22),
  prop("buoy", 35, 17, 20, 22),
  prop("crate", 30, 10, 26, 22),
  prop("dock", 10, 19, 42, 32),
  prop("post", 12, 8, 17, 34),
  prop("post", 33, 7, 17, 34),
  prop("driftLog", 6, 20, 32, 18),
  prop("shell", 37, 8, 16, 14),
  prop("starfish", 6, 12, 16, 16),
  prop("coral", 39, 21, 20, 20),
  prop("seaweedA", 5, 16, 14, 22),
  prop("seaweedB", 38, 13, 14, 22),
];

const SHOP_DECOR: Omit<WorldSprite, "source">[] = [
  interior(21, 23, { x: 0, y: 16, width: 16, height: 16 }, 17, 17, "center"),
  interior(23, 23, { x: 16, y: 16, width: 16, height: 16 }, 17, 17, "center"),
  interior(11, 7, { x: 0, y: 0, width: 16, height: 16 }, 16, 16, "center"),
  interior(16, 7, { x: 16, y: 0, width: 16, height: 16 }, 16, 16, "center"),
  interior(33, 6, { x: 32, y: 0, width: 16, height: 16 }, 17, 17, "center"),
];

export function drawPixelScene(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  const scene = state.scenes[state.currentSceneId];
  const startCol = Math.max(0, Math.floor(state.camera.x / BASE_CONSTANTS.TILE_SIZE));
  const endCol = Math.min(scene.worldCols - 1, Math.ceil((state.camera.x + state.camera.width) / BASE_CONSTANTS.TILE_SIZE));
  const startRow = Math.max(0, Math.floor(state.camera.y / BASE_CONSTANTS.TILE_SIZE));
  const endRow = Math.min(scene.worldRows - 1, Math.ceil((state.camera.y + state.camera.height) / BASE_CONSTANTS.TILE_SIZE));

  drawWaterBackdrop(renderCtx, state.camera.x, state.camera.y, state.camera.width, state.camera.height);

  if (state.currentSceneId === "shop") {
    drawRestaurantScene(renderCtx, state, startCol, endCol, startRow, endRow);
    return;
  }

  if (state.currentSceneId === "ocean" && artImages.oceanFull.complete) {
    drawFullSceneImage(renderCtx, state, artImages.oceanFull);
    return;
  }

  if (state.currentSceneId === "island" && artImages.islandFull.complete) {
    drawFullSceneImage(renderCtx, state, artImages.islandFull);
    return;
  }

  for (let y = startRow; y <= endRow; y += 1) {
    for (let x = startCol; x <= endCol; x += 1) {
      const tileKind = getTileKind(state.sceneTerrains, state.currentSceneId, x, y);
      if (tileKind === "land") {
        drawIslandTile(renderCtx, state, x, y);
      } else {
        drawWaterTile(renderCtx, state, x, y);
      }
    }
  }

  if (state.currentSceneId === "ocean") {
    drawBoat(renderCtx, state);
    drawWorldSprites(renderCtx, state, OCEAN_DECOR.map((sprite) => ({ ...sprite, sceneId: "ocean", source: artImages.props })));
    return;
  }

  drawWorldSprites(
    renderCtx,
    state,
    ISLAND_DECOR.map((sprite) => ({
      ...sprite,
      source: TREE_RECTS.some((treeRect) => treeRect === sprite.rect) ? artImages.trees : artImages.props,
    })),
  );
}

export function drawPixelPlayer(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  const drawWidth = Math.round(PLAYER_FRAME_SIZE * BASE_CONSTANTS.GLOBAL_SCALE * PLAYER_DRAW_SCALE);
  const drawHeight = Math.round(PLAYER_FRAME_SIZE * BASE_CONSTANTS.GLOBAL_SCALE * PLAYER_DRAW_SCALE);
  const screenX = Math.round(state.player.x - state.camera.x - drawWidth / 2);
  const screenY = Math.round(state.player.y - state.camera.y - drawHeight + BASE_CONSTANTS.PLAYER_SIZE / 2);
  const source = state.player.isMoving ? artImages.playerWalk : artImages.playerIdle;
  const frameCount = state.player.isMoving ? PLAYER_WALK_FRAMES : PLAYER_IDLE_FRAMES;
  const frame = state.player.isMoving ? Math.floor(state.player.animationTime / PLAYER_WALK_FRAME_SECONDS) % frameCount : 0;
  const sprite = source[state.player.facing];

  if (!sprite.complete) {
    renderCtx.fillStyle = state.player.color;
    renderCtx.fillRect(screenX, screenY, drawWidth, drawHeight);
    return;
  }

  renderCtx.drawImage(
    sprite,
    frame * PLAYER_FRAME_SIZE,
    0,
    PLAYER_FRAME_SIZE,
    PLAYER_FRAME_SIZE,
    screenX,
    screenY,
    drawWidth,
    drawHeight,
  );
}

function drawIslandTile(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const isCoast =
    getTileKind(state.sceneTerrains, state.currentSceneId, tileX - 1, tileY) === "water" ||
    getTileKind(state.sceneTerrains, state.currentSceneId, tileX + 1, tileY) === "water" ||
    getTileKind(state.sceneTerrains, state.currentSceneId, tileX, tileY - 1) === "water" ||
    getTileKind(state.sceneTerrains, state.currentSceneId, tileX, tileY + 1) === "water";
  const screenX = tileX * BASE_CONSTANTS.TILE_SIZE - state.camera.x;
  const screenY = tileY * BASE_CONSTANTS.TILE_SIZE - state.camera.y;

  renderCtx.fillStyle = isCoast ? "#d7b56b" : "#68b856";
  renderCtx.fillRect(screenX, screenY, BASE_CONSTANTS.TILE_SIZE, BASE_CONSTANTS.TILE_SIZE);

  renderCtx.fillStyle = isCoast ? "#c99c5d" : "#4d9d47";
  renderCtx.fillRect(screenX + 1, screenY + BASE_CONSTANTS.TILE_SIZE - 3, BASE_CONSTANTS.TILE_SIZE - 2, 2);

  if (!isCoast && (tileX * 5 + tileY * 7) % 6 === 0) {
    renderCtx.fillStyle = "#92d768";
    renderCtx.fillRect(screenX + 5, screenY + 5, 2, 2);
    renderCtx.fillRect(screenX + 11, screenY + 10, 2, 2);
  }

  if (isCoast && (tileX + tileY) % 3 === 0) {
    renderCtx.fillStyle = "#f0cf7b";
    renderCtx.fillRect(screenX + 4, screenY + 6, 3, 2);
    renderCtx.fillRect(screenX + 10, screenY + 11, 2, 2);
  }
}

function drawWaterTile(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const screenX = tileX * BASE_CONSTANTS.TILE_SIZE - state.camera.x;
  const screenY = tileY * BASE_CONSTANTS.TILE_SIZE - state.camera.y;
  renderCtx.fillStyle = "#2677b8";
  renderCtx.fillRect(screenX, screenY, BASE_CONSTANTS.TILE_SIZE, BASE_CONSTANTS.TILE_SIZE);
  if ((tileX * 3 + tileY * 5) % 4 === 0) {
    renderCtx.fillStyle = "rgba(145, 214, 235, 0.34)";
    renderCtx.fillRect(screenX + 3, screenY + 8, 10, 2);
    renderCtx.fillRect(screenX + 13, screenY + 10, 7, 2);
  }
}

function drawRestaurantScene(
  renderCtx: CanvasRenderingContext2D,
  state: BaseState,
  _startCol: number,
  _endCol: number,
  _startRow: number,
  _endRow: number,
): void {
  const scene = state.scenes.shop;
  const worldWidth = scene.worldCols * BASE_CONSTANTS.TILE_SIZE;
  const worldHeight = scene.worldRows * BASE_CONSTANTS.TILE_SIZE;
  const screenX = -state.camera.x;
  const screenY = -state.camera.y;

  renderCtx.fillStyle = "#17364a";
  renderCtx.fillRect(0, 0, state.camera.width, state.camera.height);

  if (artImages.kitchenFull.complete) {
    renderCtx.drawImage(artImages.kitchenFull, screenX, screenY, worldWidth, worldHeight);
  }

  drawDoorSprite(renderCtx, state);
}

function drawFullSceneImage(renderCtx: CanvasRenderingContext2D, state: BaseState, image: HTMLImageElement): void {
  const scene = state.scenes[state.currentSceneId];
  const worldWidth = scene.worldCols * BASE_CONSTANTS.TILE_SIZE;
  const worldHeight = scene.worldRows * BASE_CONSTANTS.TILE_SIZE;

  renderCtx.drawImage(image, -state.camera.x, -state.camera.y, worldWidth, worldHeight);
}

function drawDoorSprite(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  if (!artImages.door.complete) {
    return;
  }

  const tile = BASE_CONSTANTS.TILE_SIZE;
  const doorWidth = tile * 2.5;
  const doorHeight = tile * 2.75;
  const doorX = 7.35 * tile - state.camera.x;
  const doorY = 15.1 * tile - state.camera.y;

  renderCtx.drawImage(
    artImages.door,
    DOOR_RECT.x,
    DOOR_RECT.y,
    DOOR_RECT.width,
    DOOR_RECT.height,
    doorX,
    doorY,
    doorWidth,
    doorHeight,
  );
}

function drawRestaurantWalls(
  renderCtx: CanvasRenderingContext2D,
  state: BaseState,
  startCol: number,
  endCol: number,
  startRow: number,
  endRow: number,
): void {
  for (let y = startRow; y <= endRow; y += 1) {
    for (let x = startCol; x <= endCol; x += 1) {
      if (!isRestaurantInteriorTile(x, y)) {
        continue;
      }

      const screenX = x * BASE_CONSTANTS.TILE_SIZE - state.camera.x;
      const screenY = y * BASE_CONSTANTS.TILE_SIZE - state.camera.y;
      const tile = BASE_CONSTANTS.TILE_SIZE;
      const isDoor = y >= 24 && x >= 21 && x <= 24;

      if (!isRestaurantInteriorTile(x, y - 1)) {
        drawWallSegment(renderCtx, screenX, screenY, tile, "top");
      }

      if (!isRestaurantInteriorTile(x - 1, y)) {
        drawWallSegment(renderCtx, screenX, screenY, tile, "left");
      }

      if (!isRestaurantInteriorTile(x + 1, y)) {
        drawWallSegment(renderCtx, screenX, screenY, tile, "right");
      }

      if (!isDoor && !isRestaurantInteriorTile(x, y + 1)) {
        drawWallSegment(renderCtx, screenX, screenY, tile, "bottom");
      }
    }
  }

  drawDoorway(renderCtx, state);
}

function drawWallSegment(renderCtx: CanvasRenderingContext2D, x: number, y: number, tile: number, side: "top" | "left" | "right" | "bottom"): void {
  renderCtx.fillStyle = "#f0dfbd";
  renderCtx.strokeStyle = "#4c3026";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);

  if (side === "top") {
    renderCtx.fillRect(x, y - tile * 0.55, tile, tile * 0.65);
    renderCtx.strokeRect(x, y - tile * 0.55, tile, tile * 0.65);
    renderCtx.fillStyle = "#c08a5d";
    renderCtx.fillRect(x, y + tile * 0.02, tile, tile * 0.16);
  } else if (side === "left") {
    renderCtx.fillRect(x - tile * 0.42, y, tile * 0.52, tile);
    renderCtx.strokeRect(x - tile * 0.42, y, tile * 0.52, tile);
    renderCtx.fillStyle = "#b27750";
    renderCtx.fillRect(x - tile * 0.1, y, tile * 0.15, tile);
  } else if (side === "right") {
    renderCtx.fillRect(x + tile * 0.9, y, tile * 0.52, tile);
    renderCtx.strokeRect(x + tile * 0.9, y, tile * 0.52, tile);
    renderCtx.fillStyle = "#b27750";
    renderCtx.fillRect(x + tile * 0.94, y, tile * 0.15, tile);
  } else {
    renderCtx.fillStyle = "#5a3328";
    renderCtx.fillRect(x, y + tile * 0.82, tile, tile * 0.28);
  }
}

function drawDoorway(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  const tile = BASE_CONSTANTS.TILE_SIZE;
  const x = 21 * tile - state.camera.x;
  const y = 24 * tile - state.camera.y;
  renderCtx.fillStyle = "#2f1d19";
  renderCtx.fillRect(x, y - tile * 0.2, tile * 4, tile * 1.1);
  renderCtx.fillStyle = "#bb6b37";
  renderCtx.fillRect(x + tile * 0.35, y + tile * 0.32, tile * 3.3, tile * 0.28);
  renderCtx.strokeStyle = "#f3cf83";
  renderCtx.strokeRect(x + tile * 0.18, y - tile * 0.12, tile * 3.64, tile * 0.9);
}

function drawKitchenFixtures(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  drawCounter(renderCtx, state, 6, 5, 15, 2, "back");
  drawCounter(renderCtx, state, 6, 7, 2, 7, "left");
  drawCounter(renderCtx, state, 20, 5, 3, 8, "right");
  drawCounter(renderCtx, state, 10, 13, 9, 2, "island");

  drawSink(renderCtx, state, 8, 6);
  drawStove(renderCtx, state, 12, 6);
  drawPrepBoard(renderCtx, state, 16, 6);
  drawShelves(renderCtx, state, 19, 8);
  drawIngredientBins(renderCtx, state, 7, 11);
  drawIngredientBins(renderCtx, state, 21, 11);
  drawPrepPots(renderCtx, state, 12, 14);
  drawPrepPots(renderCtx, state, 16, 14);
}

function drawDiningFixtures(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  drawHostStand(renderCtx, state, 22, 22);
  drawDiningTable(renderCtx, state, 28, 12, "round");
  drawDiningTable(renderCtx, state, 35, 13, "round");
  drawDiningTable(renderCtx, state, 29, 19, "long");
  drawDiningTable(renderCtx, state, 36, 20, "small");
  drawServiceBar(renderCtx, state, 25, 8);
  drawWindow(renderCtx, state, 29, 4, 5);
  drawWindow(renderCtx, state, 34, 6, 3);
}

function drawRestaurantDecor(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  drawPlant(renderCtx, state, 37, 8);
  drawPlant(renderCtx, state, 18, 21);
  drawPlant(renderCtx, state, 7, 19);
  drawRug(renderCtx, state, 22, 19, 4, 3);
  drawWallArt(renderCtx, state, 10, 4);
  drawWallArt(renderCtx, state, 31, 7);
  drawWallArt(renderCtx, state, 36, 9);
}

function drawCounter(
  renderCtx: CanvasRenderingContext2D,
  state: BaseState,
  tileX: number,
  tileY: number,
  tileWidth: number,
  tileHeight: number,
  kind: "back" | "left" | "right" | "island",
): void {
  const tile = BASE_CONSTANTS.TILE_SIZE;
  const x = tileX * tile - state.camera.x;
  const y = tileY * tile - state.camera.y;
  const width = tileWidth * tile;
  const height = tileHeight * tile;
  renderCtx.fillStyle = kind === "island" ? "#dfe8df" : "#cad7d4";
  renderCtx.fillRect(x, y, width, height);
  renderCtx.strokeStyle = "#29313b";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  renderCtx.strokeRect(x, y, width, height);
  renderCtx.fillStyle = "#69717a";
  renderCtx.fillRect(x, y + height - tile * 0.32, width, tile * 0.32);
  renderCtx.fillStyle = "rgba(255, 255, 255, 0.35)";
  renderCtx.fillRect(x + tile * 0.15, y + tile * 0.14, width - tile * 0.3, tile * 0.16);
}

function drawSink(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 2, 1.35);
  renderCtx.fillStyle = "#8dabb6";
  renderCtx.fillRect(r.x + r.tile * 0.25, r.y + r.tile * 0.18, r.w - r.tile * 0.5, r.h - r.tile * 0.35);
  renderCtx.strokeStyle = "#2e3a42";
  renderCtx.strokeRect(r.x + r.tile * 0.25, r.y + r.tile * 0.18, r.w - r.tile * 0.5, r.h - r.tile * 0.35);
  renderCtx.fillStyle = "#dff5ff";
  renderCtx.fillRect(r.x + r.tile * 0.7, r.y + r.tile * 0.35, r.tile * 0.7, r.tile * 0.22);
}

function drawStove(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 2.4, 1.45);
  renderCtx.fillStyle = "#343842";
  renderCtx.fillRect(r.x, r.y, r.w, r.h);
  renderCtx.strokeStyle = "#10141b";
  renderCtx.strokeRect(r.x, r.y, r.w, r.h);
  renderCtx.strokeStyle = "#a8b1b9";
  for (let i = 0; i < 4; i += 1) {
    const cx = r.x + r.tile * (0.45 + (i % 2) * 0.9);
    const cy = r.y + r.tile * (0.42 + Math.floor(i / 2) * 0.55);
    renderCtx.strokeRect(cx, cy, r.tile * 0.35, r.tile * 0.25);
  }
}

function drawPrepBoard(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 2, 1.2);
  renderCtx.fillStyle = "#b97842";
  renderCtx.fillRect(r.x + r.tile * 0.25, r.y + r.tile * 0.25, r.w - r.tile * 0.5, r.h - r.tile * 0.45);
  renderCtx.fillStyle = "#f3c65e";
  renderCtx.fillRect(r.x + r.tile * 0.6, r.y + r.tile * 0.42, r.tile * 0.72, r.tile * 0.15);
}

function drawShelves(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 2.2, 3);
  renderCtx.fillStyle = "#73422d";
  renderCtx.fillRect(r.x, r.y, r.w, r.h);
  renderCtx.strokeStyle = "#2e1b18";
  renderCtx.strokeRect(r.x, r.y, r.w, r.h);
  renderCtx.fillStyle = "#e0d5b9";
  for (let i = 0; i < 3; i += 1) {
    renderCtx.fillRect(r.x + r.tile * 0.22, r.y + r.tile * (0.35 + i * 0.75), r.w - r.tile * 0.44, r.tile * 0.16);
  }
  renderCtx.fillStyle = "#d55e3f";
  renderCtx.fillRect(r.x + r.tile * 0.35, r.y + r.tile * 0.62, r.tile * 0.3, r.tile * 0.28);
  renderCtx.fillStyle = "#5ba956";
  renderCtx.fillRect(r.x + r.tile * 1.25, r.y + r.tile * 1.38, r.tile * 0.38, r.tile * 0.3);
}

function drawIngredientBins(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 2, 1.5);
  renderCtx.fillStyle = "#8d5a32";
  renderCtx.fillRect(r.x, r.y, r.w, r.h);
  renderCtx.strokeStyle = "#37231d";
  renderCtx.strokeRect(r.x, r.y, r.w, r.h);
  renderCtx.fillStyle = "#68b856";
  renderCtx.fillRect(r.x + r.tile * 0.2, r.y + r.tile * 0.18, r.tile * 0.55, r.tile * 0.42);
  renderCtx.fillStyle = "#e4743e";
  renderCtx.fillRect(r.x + r.tile * 1.05, r.y + r.tile * 0.18, r.tile * 0.55, r.tile * 0.42);
}

function drawPrepPots(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 2, 1);
  renderCtx.fillStyle = "#343842";
  renderCtx.beginPath();
  renderCtx.ellipse(r.x + r.tile * 0.6, r.y + r.tile * 0.45, r.tile * 0.38, r.tile * 0.24, 0, 0, Math.PI * 2);
  renderCtx.fill();
  renderCtx.beginPath();
  renderCtx.ellipse(r.x + r.tile * 1.35, r.y + r.tile * 0.45, r.tile * 0.32, r.tile * 0.22, 0, 0, Math.PI * 2);
  renderCtx.fill();
}

function drawHostStand(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 2.4, 1.6);
  renderCtx.fillStyle = "#7b472c";
  renderCtx.fillRect(r.x, r.y, r.w, r.h);
  renderCtx.strokeStyle = "#2e1b18";
  renderCtx.strokeRect(r.x, r.y, r.w, r.h);
  renderCtx.fillStyle = "#f3dfac";
  renderCtx.fillRect(r.x + r.tile * 0.35, r.y + r.tile * 0.32, r.w - r.tile * 0.7, r.tile * 0.28);
}

function drawDiningTable(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number, kind: "round" | "long" | "small"): void {
  const tile = BASE_CONSTANTS.TILE_SIZE;
  const centerX = tileX * tile - state.camera.x;
  const centerY = tileY * tile - state.camera.y;
  const seats = kind === "long" ? [
    [-1.9, 0],
    [1.9, 0],
    [-0.7, -1.05],
    [0.7, -1.05],
    [-0.7, 1.05],
    [0.7, 1.05],
  ] : [
    [-1.25, 0],
    [1.25, 0],
    [0, -1.2],
    [0, 1.2],
  ];

  for (const [seatX, seatY] of seats) {
    drawChair(renderCtx, centerX + seatX * tile, centerY + seatY * tile, tile);
  }

  renderCtx.fillStyle = "#8b5130";
  renderCtx.strokeStyle = "#33201a";
  if (kind === "round") {
    renderCtx.beginPath();
    renderCtx.ellipse(centerX, centerY, tile * 0.95, tile * 0.72, 0, 0, Math.PI * 2);
    renderCtx.fill();
    renderCtx.stroke();
  } else if (kind === "small") {
    renderCtx.fillRect(centerX - tile * 0.75, centerY - tile * 0.55, tile * 1.5, tile * 1.1);
    renderCtx.strokeRect(centerX - tile * 0.75, centerY - tile * 0.55, tile * 1.5, tile * 1.1);
  } else {
    renderCtx.fillRect(centerX - tile * 1.45, centerY - tile * 0.62, tile * 2.9, tile * 1.24);
    renderCtx.strokeRect(centerX - tile * 1.45, centerY - tile * 0.62, tile * 2.9, tile * 1.24);
  }

  renderCtx.fillStyle = "#f6e2b8";
  renderCtx.fillRect(centerX - tile * 0.18, centerY - tile * 0.14, tile * 0.36, tile * 0.28);
}

function drawChair(renderCtx: CanvasRenderingContext2D, x: number, y: number, tile: number): void {
  renderCtx.fillStyle = "#5f3929";
  renderCtx.fillRect(x - tile * 0.32, y - tile * 0.26, tile * 0.64, tile * 0.52);
  renderCtx.strokeStyle = "#2e1b18";
  renderCtx.strokeRect(x - tile * 0.32, y - tile * 0.26, tile * 0.64, tile * 0.52);
}

function drawServiceBar(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 5, 2);
  renderCtx.fillStyle = "#5b3326";
  renderCtx.fillRect(r.x, r.y, r.w, r.h);
  renderCtx.strokeStyle = "#2a1916";
  renderCtx.strokeRect(r.x, r.y, r.w, r.h);
  renderCtx.fillStyle = "#d5c6a5";
  renderCtx.fillRect(r.x + r.tile * 0.2, r.y + r.tile * 0.18, r.w - r.tile * 0.4, r.tile * 0.5);
  renderCtx.fillStyle = "#e7e0ca";
  for (let i = 0; i < 4; i += 1) {
    renderCtx.fillRect(r.x + r.tile * (0.55 + i), r.y + r.tile * 0.92, r.tile * 0.34, r.tile * 0.34);
  }
}

function drawWindow(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number, tileWidth: number): void {
  const r = rectForTile(state, tileX, tileY, tileWidth, 1.3);
  renderCtx.fillStyle = "#8cc6d9";
  renderCtx.fillRect(r.x, r.y, r.w, r.h);
  renderCtx.strokeStyle = "#35241e";
  renderCtx.strokeRect(r.x, r.y, r.w, r.h);
  renderCtx.fillStyle = "rgba(255, 255, 255, 0.45)";
  renderCtx.fillRect(r.x + r.tile * 0.3, r.y + r.tile * 0.2, r.w - r.tile * 0.6, r.tile * 0.18);
}

function drawPlant(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 1, 1);
  renderCtx.fillStyle = "#76502f";
  renderCtx.fillRect(r.x + r.tile * 0.2, r.y + r.tile * 0.55, r.tile * 0.62, r.tile * 0.34);
  renderCtx.fillStyle = "#4ca545";
  renderCtx.fillRect(r.x + r.tile * 0.18, r.y + r.tile * 0.25, r.tile * 0.22, r.tile * 0.35);
  renderCtx.fillRect(r.x + r.tile * 0.42, r.y + r.tile * 0.14, r.tile * 0.22, r.tile * 0.45);
  renderCtx.fillRect(r.x + r.tile * 0.65, r.y + r.tile * 0.28, r.tile * 0.22, r.tile * 0.34);
}

function drawRug(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number, tileWidth: number, tileHeight: number): void {
  const r = rectForTile(state, tileX, tileY, tileWidth, tileHeight);
  renderCtx.fillStyle = "#9c3f37";
  renderCtx.fillRect(r.x, r.y, r.w, r.h);
  renderCtx.fillStyle = "#f0c26b";
  renderCtx.fillRect(r.x + r.tile * 0.22, r.y + r.tile * 0.22, r.w - r.tile * 0.44, r.h - r.tile * 0.44);
  renderCtx.fillStyle = "#7d2e2f";
  renderCtx.fillRect(r.x + r.tile * 0.5, r.y + r.tile * 0.5, r.w - r.tile, r.h - r.tile);
}

function drawWallArt(renderCtx: CanvasRenderingContext2D, state: BaseState, tileX: number, tileY: number): void {
  const r = rectForTile(state, tileX, tileY, 1.4, 1);
  renderCtx.fillStyle = "#4b2b22";
  renderCtx.fillRect(r.x, r.y, r.w, r.h);
  renderCtx.fillStyle = "#f5d9a0";
  renderCtx.fillRect(r.x + r.tile * 0.14, r.y + r.tile * 0.14, r.w - r.tile * 0.28, r.h - r.tile * 0.28);
  renderCtx.fillStyle = "#d97545";
  renderCtx.fillRect(r.x + r.tile * 0.42, r.y + r.tile * 0.34, r.tile * 0.42, r.tile * 0.22);
}

function rectForTile(state: BaseState, tileX: number, tileY: number, tileWidth: number, tileHeight: number) {
  const tile = BASE_CONSTANTS.TILE_SIZE;
  return {
    x: tileX * tile - state.camera.x,
    y: tileY * tile - state.camera.y,
    w: tileWidth * tile,
    h: tileHeight * tile,
    tile,
  };
}

function drawWaterBackdrop(renderCtx: CanvasRenderingContext2D, cameraX: number, cameraY: number, width: number, height: number): void {
  renderCtx.fillStyle = "#2677b8";
  renderCtx.fillRect(0, 0, width, height);
  const spacing = Math.round(22 * BASE_CONSTANTS.GLOBAL_SCALE);
  const offsetX = -Math.round(cameraX % spacing);
  const offsetY = -Math.round(cameraY % spacing);
  renderCtx.fillStyle = "rgba(145, 214, 235, 0.34)";
  for (let y = offsetY; y < height + spacing; y += spacing) {
    for (let x = offsetX; x < width + spacing; x += spacing) {
      if (((x + y) / spacing) % 3 < 1) {
        renderCtx.fillRect(x + 3, y + 8, 10, 2);
        renderCtx.fillRect(x + 13, y + 10, 7, 2);
      }
    }
  }
}

function drawBoat(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  const scene = state.scenes.ocean;
  const drawWidth = BASE_CONSTANTS.TILE_SIZE * 7;
  const drawHeight = BASE_CONSTANTS.TILE_SIZE * 12;
  const x = (scene.worldCols * BASE_CONSTANTS.TILE_SIZE - drawWidth) / 2 - state.camera.x;
  const y = (scene.worldRows * BASE_CONSTANTS.TILE_SIZE - drawHeight) / 2 - state.camera.y + BASE_CONSTANTS.TILE_SIZE;

  if (artImages.boat.complete) {
    renderCtx.drawImage(artImages.boat, BOAT_RECT.x, BOAT_RECT.y, BOAT_RECT.width, BOAT_RECT.height, x, y, drawWidth, drawHeight);
    return;
  }

  renderCtx.fillStyle = "#7d5231";
  renderCtx.fillRect(x, y, drawWidth, drawHeight);
}

function drawWorldSprites(renderCtx: CanvasRenderingContext2D, state: BaseState, sprites: WorldSprite[]): void {
  const visibleSprites = sprites
    .filter((sprite) => sprite.sceneId === state.currentSceneId)
    .sort((a, b) => a.tileY - b.tileY);

  for (const sprite of visibleSprites) {
    const source = sprite.source;
    const worldX = sprite.tileX * BASE_CONSTANTS.TILE_SIZE;
    const worldY = sprite.tileY * BASE_CONSTANTS.TILE_SIZE;
    const screenX = Math.round(worldX - state.camera.x - sprite.width / 2);
    const screenY =
      sprite.anchor === "center"
        ? Math.round(worldY - state.camera.y - sprite.height / 2)
        : Math.round(worldY - state.camera.y - sprite.height);

    if (!source.complete) {
      continue;
    }

    renderCtx.drawImage(
      source,
      sprite.rect.x,
      sprite.rect.y,
      sprite.rect.width,
      sprite.rect.height,
      screenX,
      screenY,
      sprite.width,
      sprite.height,
    );
  }
}

function loadImage(src: string): HTMLImageElement {
  const image = new Image();
  image.src = src;
  return image;
}

function loadPlayerImages(urls: Record<PlayerDirection, string>): Record<PlayerDirection, HTMLImageElement> {
  return {
    down: loadImage(urls.down),
    left: loadImage(urls.left),
    right: loadImage(urls.right),
    up: loadImage(urls.up),
  };
}

function tree(tileX: number, tileY: number, treeIndex: number): Omit<WorldSprite, "source"> {
  const rect = TREE_RECTS[treeIndex % TREE_RECTS.length];
  return {
    sceneId: "island",
    rect,
    tileX,
    tileY,
    width: Math.round(58 * BASE_CONSTANTS.GLOBAL_SCALE),
    height: Math.round(68 * BASE_CONSTANTS.GLOBAL_SCALE),
  };
}

function prop(
  key: keyof typeof PROP_RECTS,
  tileX: number,
  tileY: number,
  width: number,
  height: number,
  anchor: WorldSprite["anchor"] = "bottom",
): Omit<WorldSprite, "source"> {
  return {
    sceneId: "island",
    rect: PROP_RECTS[key],
    tileX,
    tileY,
    width: Math.round(width * BASE_CONSTANTS.GLOBAL_SCALE),
    height: Math.round(height * BASE_CONSTANTS.GLOBAL_SCALE),
    anchor,
  };
}

function interior(
  tileX: number,
  tileY: number,
  rect: SpriteRect,
  width: number,
  height: number,
  anchor: WorldSprite["anchor"] = "bottom",
): Omit<WorldSprite, "source"> {
  return {
    sceneId: "shop",
    rect,
    tileX,
    tileY,
    width: Math.round(width * BASE_CONSTANTS.GLOBAL_SCALE),
    height: Math.round(height * BASE_CONSTANTS.GLOBAL_SCALE),
    anchor,
  };
}
