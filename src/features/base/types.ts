import type { Vector2 } from "../../core/types/vector";

export type SceneId = "island" | "ocean" | "shop";

export interface TilePosition {
  x: number;
  y: number;
}

export interface SceneConfig {
  id: SceneId;
  name: string;
  background: string;
  worldCols: number;
  worldRows: number;
  spawn: TilePosition;
}

export interface MinimapNode {
  sceneId: SceneId;
  x: number;
  y: number;
  radius: number;
}

export interface MinimapLayout {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  nodes: MinimapNode[];
}

export interface Player {
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface Camera {
  x: number;
  y: number;
  width: number;
  height: number;
  deadzoneWidth: number;
  deadzoneHeight: number;
}

export type TileKind = "land" | "water" | "boat" | "plain";
export type TerrainGrid = TileKind[][];

export interface BaseState {
  currentSceneId: SceneId;
  camera: Camera;
  player: Player;
  scenes: Record<SceneId, SceneConfig>;
  sceneTerrains: Partial<Record<SceneId, TerrainGrid>>;
}

export interface BaseStatusSnapshot {
  fps: number;
  fishingPhase: string | null;
  fishingTension: number | null;
  inventoryUsedSlots: number;
  inventoryTotalSlots: number;
  fishingHabitat?: string | null;
}

export type BasePoint = Vector2;
