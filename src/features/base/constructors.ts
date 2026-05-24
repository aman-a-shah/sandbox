import { GAME_CONFIG } from "../../core/config/gameConfig";
import { BASE_CONSTANTS } from "./constants";
import { createIslandTerrain, createOceanTerrain, createRestaurantTerrain } from "./terrain";
import type { BaseState, Camera, Player, SceneConfig, SceneId, TerrainGrid } from "./types";

export function createCamera(): Camera {
  return {
    x: 0,
    y: 0,
    width: BASE_CONSTANTS.RENDER_WIDTH,
    height: BASE_CONSTANTS.RENDER_HEIGHT,
    deadzoneWidth: BASE_CONSTANTS.RENDER_WIDTH * GAME_CONFIG.camera.deadzonePercent,
    deadzoneHeight: BASE_CONSTANTS.RENDER_HEIGHT * GAME_CONFIG.camera.deadzonePercent,
  };
}

export function createPlayer(): Player {
  return {
    x: 0,
    y: 0,
    size: BASE_CONSTANTS.PLAYER_SIZE,
    color: "#f8f32b",
    facing: "down",
    isMoving: false,
    animationTime: 0,
  };
}

export function createScenes(): Record<SceneId, SceneConfig> {
  return {
    island: {
      id: "island",
      name: "Island",
      background: "#4e9c3f",
      worldCols: BASE_CONSTANTS.SCENE_WORLD_COLS,
      worldRows: BASE_CONSTANTS.SCENE_WORLD_ROWS,
      spawn: { x: 22, y: 14 },
    },
    ocean: {
      id: "ocean",
      name: "Ocean",
      background: "#2c78bf",
      worldCols: BASE_CONSTANTS.SCENE_WORLD_COLS,
      worldRows: BASE_CONSTANTS.SCENE_WORLD_ROWS,
      spawn: { x: 21, y: 13 },
    },
    shop: {
      id: "shop",
      name: "Shop",
      background: "#7d5231",
      worldCols: BASE_CONSTANTS.SCENE_WORLD_COLS,
      worldRows: BASE_CONSTANTS.SCENE_WORLD_ROWS,
      spawn: { x: 15, y: 11 },
    },
  };
}

export function createSceneTerrains(): Partial<Record<SceneId, TerrainGrid>> {
  return {
    island: createIslandTerrain(
      BASE_CONSTANTS.SCENE_WORLD_COLS,
      BASE_CONSTANTS.SCENE_WORLD_ROWS,
      BASE_CONSTANTS.ISLAND_BLOB_WIDTH,
      BASE_CONSTANTS.ISLAND_BLOB_HEIGHT,
    ),
    ocean: createOceanTerrain(
      BASE_CONSTANTS.SCENE_WORLD_COLS,
      BASE_CONSTANTS.SCENE_WORLD_ROWS,
      BASE_CONSTANTS.BOAT_WIDTH,
      BASE_CONSTANTS.BOAT_HEIGHT,
    ),
    shop: createRestaurantTerrain(BASE_CONSTANTS.SCENE_WORLD_COLS, BASE_CONSTANTS.SCENE_WORLD_ROWS),
  };
}

export function createBaseState(): BaseState {
  return {
    currentSceneId: "island",
    camera: createCamera(),
    player: createPlayer(),
    scenes: createScenes(),
    sceneTerrains: createSceneTerrains(),
  };
}
