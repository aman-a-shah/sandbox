import { GAME_CONFIG } from "../../core/config/gameConfig";
import { canvasFont, scalePixels } from "../../core/utils";
import type { TileKind } from "./types";

const GLOBAL_SCALE = GAME_CONFIG.globalScale;

export const BASE_CONSTANTS = {
  GLOBAL_SCALE,
  TILE_SIZE: scalePixels(16, GLOBAL_SCALE),
  PLAYER_SIZE: scalePixels(10, GLOBAL_SCALE),
  PLAYER_SPEED: 145 * GLOBAL_SCALE,
  SCENE_WORLD_COLS: 44,
  SCENE_WORLD_ROWS: 28,
  MINIMAP_MARGIN: scalePixels(12, GLOBAL_SCALE),
  MINIMAP_BOX_WIDTH: scalePixels(126, GLOBAL_SCALE),
  MINIMAP_BOX_HEIGHT: scalePixels(96, GLOBAL_SCALE),
  RENDER_WIDTH: scalePixels(GAME_CONFIG.renderWidth, GLOBAL_SCALE),
  RENDER_HEIGHT: scalePixels(GAME_CONFIG.renderHeight, GLOBAL_SCALE),
  ISLAND_BLOB_WIDTH: 30,
  ISLAND_BLOB_HEIGHT: 20,
  BOAT_WIDTH: 7,
  BOAT_HEIGHT: 12,
  MINIMAP_FONT: canvasFont(11, GLOBAL_SCALE),
} as const;

export const TERRAIN_COLORS: Record<TileKind, string> = {
  land: "#4e9c3f",
  water: "#2c78bf",
  boat: "#7d5231",
  plain: "#7d5231",
};
