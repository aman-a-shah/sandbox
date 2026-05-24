import { clamp } from "../../core/utils";
import type { Vector2 } from "../../core/types/vector";
import { BASE_CONSTANTS, TERRAIN_COLORS } from "./constants";
import { drawPixelPlayer, drawPixelScene } from "./art";
import { isWalkableTile, getTileKind } from "./terrain";
import type { BaseState, BaseStatusSnapshot, MinimapLayout, SceneId } from "./types";

export function getMovementVector(keysDown: Set<string>, isInputLocked: boolean): Vector2 {
  if (isInputLocked) {
    return { x: 0, y: 0 };
  }

  let horizontal = 0;
  let vertical = 0;

  if (keysDown.has("a") || keysDown.has("arrowleft")) horizontal -= 1;
  if (keysDown.has("d") || keysDown.has("arrowright")) horizontal += 1;
  if (keysDown.has("w") || keysDown.has("arrowup")) vertical -= 1;
  if (keysDown.has("s") || keysDown.has("arrowdown")) vertical += 1;

  const magnitude = Math.hypot(horizontal, vertical) || 1;
  return { x: horizontal / magnitude, y: vertical / magnitude };
}

export function movePlayer(state: BaseState, targetX: number, targetY: number): void {
  const scene = state.scenes[state.currentSceneId];
  const half = state.player.size / 2;
  const worldWidthPx = scene.worldCols * BASE_CONSTANTS.TILE_SIZE;
  const worldHeightPx = scene.worldRows * BASE_CONSTANTS.TILE_SIZE;

  const nextX = clamp(targetX, half, worldWidthPx - half);
  if (!collidesAt(state, nextX, state.player.y)) {
    state.player.x = nextX;
  }

  const nextY = clamp(targetY, half, worldHeightPx - half);
  if (!collidesAt(state, state.player.x, nextY)) {
    state.player.y = nextY;
  }
}

function collidesAt(state: BaseState, centerX: number, centerY: number): boolean {
  if (!state.sceneTerrains[state.currentSceneId]) {
    return false;
  }

  const half = state.player.size / 2 - 0.001;
  const corners: Vector2[] = [
    { x: centerX - half, y: centerY - half },
    { x: centerX + half, y: centerY - half },
    { x: centerX - half, y: centerY + half },
    { x: centerX + half, y: centerY + half },
  ];

  for (const corner of corners) {
    const tileX = Math.floor(corner.x / BASE_CONSTANTS.TILE_SIZE);
    const tileY = Math.floor(corner.y / BASE_CONSTANTS.TILE_SIZE);
    if (!isWalkableTile(state.sceneTerrains, state.currentSceneId, tileX, tileY)) {
      return true;
    }
  }

  return false;
}

export function updateCamera(state: BaseState): void {
  const marginX = (state.camera.width - state.camera.deadzoneWidth) / 2;
  const marginY = (state.camera.height - state.camera.deadzoneHeight) / 2;

  const deadzoneLeft = state.camera.x + marginX;
  const deadzoneRight = deadzoneLeft + state.camera.deadzoneWidth;
  const deadzoneTop = state.camera.y + marginY;
  const deadzoneBottom = deadzoneTop + state.camera.deadzoneHeight;

  if (state.player.x < deadzoneLeft) {
    state.camera.x = state.player.x - marginX;
  } else if (state.player.x > deadzoneRight) {
    state.camera.x = state.player.x - marginX - state.camera.deadzoneWidth;
  }

  if (state.player.y < deadzoneTop) {
    state.camera.y = state.player.y - marginY;
  } else if (state.player.y > deadzoneBottom) {
    state.camera.y = state.player.y - marginY - state.camera.deadzoneHeight;
  }

  clampCameraToScene(state);
}

export function centerCameraOnPlayer(state: BaseState): void {
  state.camera.x = state.player.x - state.camera.width / 2;
  state.camera.y = state.player.y - state.camera.height / 2;
  clampCameraToScene(state);
}

function clampCameraToScene(state: BaseState): void {
  const scene = state.scenes[state.currentSceneId];
  const worldWidthPx = scene.worldCols * BASE_CONSTANTS.TILE_SIZE;
  const worldHeightPx = scene.worldRows * BASE_CONSTANTS.TILE_SIZE;
  const maxX = Math.max(0, worldWidthPx - state.camera.width);
  const maxY = Math.max(0, worldHeightPx - state.camera.height);

  state.camera.x = clamp(state.camera.x, 0, maxX);
  state.camera.y = clamp(state.camera.y, 0, maxY);
}

export function setPlayerSpawn(state: BaseState, sceneId: SceneId): void {
  const scene = state.scenes[sceneId];
  state.player.x = scene.spawn.x * BASE_CONSTANTS.TILE_SIZE + BASE_CONSTANTS.TILE_SIZE / 2;
  state.player.y = scene.spawn.y * BASE_CONSTANTS.TILE_SIZE + BASE_CONSTANTS.TILE_SIZE / 2;
}

export function switchScene(state: BaseState, sceneId: SceneId): void {
  state.currentSceneId = sceneId;
  setPlayerSpawn(state, sceneId);
  centerCameraOnPlayer(state);
}

export function drawSceneBackgroundAndGrid(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  const scene = state.scenes[state.currentSceneId];
  const worldWidthPx = scene.worldCols * BASE_CONSTANTS.TILE_SIZE;
  const worldHeightPx = scene.worldRows * BASE_CONSTANTS.TILE_SIZE;

  const startCol = Math.max(0, Math.floor(state.camera.x / BASE_CONSTANTS.TILE_SIZE));
  const endCol = Math.min(
    scene.worldCols - 1,
    Math.ceil((state.camera.x + state.camera.width) / BASE_CONSTANTS.TILE_SIZE) - 1,
  );
  const startRow = Math.max(0, Math.floor(state.camera.y / BASE_CONSTANTS.TILE_SIZE));
  const endRow = Math.min(
    scene.worldRows - 1,
    Math.ceil((state.camera.y + state.camera.height) / BASE_CONSTANTS.TILE_SIZE) - 1,
  );

  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  drawPixelScene(renderCtx, state);

  renderCtx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  renderCtx.strokeRect(-state.camera.x, -state.camera.y, worldWidthPx, worldHeightPx);
}

export function drawCollisionDebugBoxes(renderCtx: CanvasRenderingContext2D, state: BaseState, debugMode: boolean): void {
  if (!debugMode || state.currentSceneId !== "shop") {
    return;
  }

  const scene = state.scenes[state.currentSceneId];
  const tile = BASE_CONSTANTS.TILE_SIZE;
  const startCol = Math.max(0, Math.floor(state.camera.x / tile));
  const endCol = Math.min(scene.worldCols - 1, Math.ceil((state.camera.x + state.camera.width) / tile) - 1);
  const startRow = Math.max(0, Math.floor(state.camera.y / tile));
  const endRow = Math.min(scene.worldRows - 1, Math.ceil((state.camera.y + state.camera.height) / tile) - 1);

  renderCtx.save();
  renderCtx.fillStyle = "rgba(255, 81, 81, 0.18)";
  renderCtx.strokeStyle = "rgba(255, 112, 112, 0.95)";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);

  for (let y = startRow; y <= endRow; y += 1) {
    for (let x = startCol; x <= endCol; x += 1) {
      if (isWalkableTile(state.sceneTerrains, state.currentSceneId, x, y)) {
        continue;
      }

      const screenX = x * tile - state.camera.x;
      const screenY = y * tile - state.camera.y;
      renderCtx.fillRect(screenX, screenY, tile, tile);
      renderCtx.strokeRect(screenX, screenY, tile, tile);
    }
  }

  renderCtx.restore();
}

export function drawPlayer(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  drawPixelPlayer(renderCtx, state);
}

export function drawMiniMap(renderCtx: CanvasRenderingContext2D, state: BaseState): void {
  const layout = getMinimapLayout();

  renderCtx.fillStyle = "rgba(8, 17, 32, 0.85)";
  renderCtx.strokeStyle = "rgba(201, 214, 229, 0.4)";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  renderCtx.fillRect(layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);
  renderCtx.strokeRect(layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);

  renderCtx.strokeStyle = "rgba(200, 220, 255, 0.4)";
  renderCtx.beginPath();
  renderCtx.moveTo(layout.nodes[0].x, layout.nodes[0].y);
  renderCtx.lineTo(layout.nodes[1].x, layout.nodes[1].y);
  renderCtx.lineTo(layout.nodes[2].x, layout.nodes[2].y);
  renderCtx.closePath();
  renderCtx.stroke();

  for (const node of layout.nodes) {
    const active = node.sceneId === state.currentSceneId;
    const nodeScene = state.scenes[node.sceneId];

    renderCtx.fillStyle = active ? lightenColor(nodeScene.background) : nodeScene.background;
    renderCtx.strokeStyle = active ? "#ffffff" : "rgba(255, 255, 255, 0.45)";
    renderCtx.beginPath();
    renderCtx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    renderCtx.fill();
    renderCtx.stroke();

    renderCtx.fillStyle = "#0f1723";
    renderCtx.font = BASE_CONSTANTS.MINIMAP_FONT;
    renderCtx.textAlign = "center";
    renderCtx.textBaseline = "middle";
    renderCtx.fillText(getSceneShortLabel(node.sceneId), node.x, node.y + 0.5 * BASE_CONSTANTS.GLOBAL_SCALE);
  }

  renderCtx.fillStyle = "#e6edf7";
  renderCtx.font = BASE_CONSTANTS.MINIMAP_FONT;
  renderCtx.textAlign = "left";
  renderCtx.fillText(
    "Minimap",
    layout.boxX + Math.max(1, Math.round(8 * BASE_CONSTANTS.GLOBAL_SCALE)),
    layout.boxY + layout.boxHeight - Math.max(1, Math.round(8 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );
}

export function getSceneIdFromMinimapClick(screenPoint: Vector2): SceneId | null {
  const minimapLayout = getMinimapLayout();
  for (const node of minimapLayout.nodes) {
    const dx = screenPoint.x - node.x;
    const dy = screenPoint.y - node.y;
    if (Math.hypot(dx, dy) <= node.radius) {
      return node.sceneId;
    }
  }

  return null;
}

function getMinimapLayout(): MinimapLayout {
  const boxWidth = BASE_CONSTANTS.MINIMAP_BOX_WIDTH;
  const boxHeight = BASE_CONSTANTS.MINIMAP_BOX_HEIGHT;
  const boxX = BASE_CONSTANTS.RENDER_WIDTH - boxWidth - BASE_CONSTANTS.MINIMAP_MARGIN;
  const boxY = BASE_CONSTANTS.MINIMAP_MARGIN;

  return {
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    nodes: [
      {
        sceneId: "island",
        x: boxX + Math.max(1, Math.round(24 * BASE_CONSTANTS.GLOBAL_SCALE)),
        y: boxY + Math.max(1, Math.round(28 * BASE_CONSTANTS.GLOBAL_SCALE)),
        radius: Math.max(1, Math.round(11 * BASE_CONSTANTS.GLOBAL_SCALE)),
      },
      {
        sceneId: "ocean",
        x: boxX + Math.max(1, Math.round(76 * BASE_CONSTANTS.GLOBAL_SCALE)),
        y: boxY + Math.max(1, Math.round(24 * BASE_CONSTANTS.GLOBAL_SCALE)),
        radius: Math.max(1, Math.round(11 * BASE_CONSTANTS.GLOBAL_SCALE)),
      },
      {
        sceneId: "shop",
        x: boxX + Math.max(1, Math.round(52 * BASE_CONSTANTS.GLOBAL_SCALE)),
        y: boxY + Math.max(1, Math.round(68 * BASE_CONSTANTS.GLOBAL_SCALE)),
        radius: Math.max(1, Math.round(11 * BASE_CONSTANTS.GLOBAL_SCALE)),
      },
    ],
  };
}

function getSceneShortLabel(sceneId: SceneId): string {
  if (sceneId === "island") return "I";
  if (sceneId === "ocean") return "O";
  return "S";
}

function lightenColor(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);

  const bump = 34;
  const nextR = clamp(r + bump, 0, 255);
  const nextG = clamp(g + bump, 0, 255);
  const nextB = clamp(b + bump, 0, 255);

  return `rgb(${nextR}, ${nextG}, ${nextB})`;
}

export function renderStatus(
  statusReadoutEl: HTMLDListElement,
  state: BaseState,
  snapshot: BaseStatusSnapshot,
  debugMode: boolean,
): void {
  if (!debugMode) {
    return;
  }

  const tileX = Math.floor(state.player.x / BASE_CONSTANTS.TILE_SIZE);
  const tileY = Math.floor(state.player.y / BASE_CONSTANTS.TILE_SIZE);
  const scene = state.scenes[state.currentSceneId];

  const rows: [string, string][] = [
    ["Scene", scene.name],
    ["Tile", `${tileX}, ${tileY}`],
    ["Camera", `${Math.round(state.camera.x)}, ${Math.round(state.camera.y)}`],
    ["FPS", String(snapshot.fps)],
  ];

  if (snapshot.fishingPhase !== null && snapshot.fishingTension !== null) {
    rows.push(["Fishing", snapshot.fishingPhase]);
    rows.push(["Tension", snapshot.fishingTension.toFixed(2)]);
    if (snapshot.fishingHabitat) {
      rows.push(["Habitat", snapshot.fishingHabitat]);
    }
  }
  rows.push(["Bag", `${snapshot.inventoryUsedSlots}/${snapshot.inventoryTotalSlots}`]);
  if (typeof snapshot.balance === "number") {
    rows.push(["Cash", `$${snapshot.balance.toFixed(2)}`]);
  }

  statusReadoutEl.innerHTML = rows.map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join("");
}

export function toWorldPoint(state: BaseState, screenPoint: Vector2): Vector2 {
  return {
    x: screenPoint.x + state.camera.x,
    y: screenPoint.y + state.camera.y,
  };
}

export function toScreenPoint(state: BaseState, worldPoint: Vector2): Vector2 {
  return {
    x: worldPoint.x - state.camera.x,
    y: worldPoint.y - state.camera.y,
  };
}
