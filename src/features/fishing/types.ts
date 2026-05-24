import type { Vector2 } from "../../core/types/vector";
import type { SceneConfig, SceneId, TileKind } from "../base/types";

export type FishingPhase = "idle" | "casting" | "waitingBite" | "biteWindow" | "reeling" | "success" | "fail";

export interface FishingSession {
  phase: FishingPhase;
  castStart: Vector2 | null;
  castTarget: Vector2 | null;
  bobberPosition: Vector2 | null;
  castingTimer: number;
  biteDelayTimer: number;
  biteWindowTimer: number;
  resultTimer: number;
  waveTimer: number;
  fishPullTimer: number;
  burstStrength: number;
  tension: number;
  greenZoneStart: number;
  greenZoneEnd: number;
  catchProgress: number;
  statusText: string;
}

export interface FishingState {
  session: FishingSession;
  isReelHeld: boolean;
}

export interface FishingCatchAttemptResult {
  added: boolean;
  fishName: string;
}

export interface FishingClickDependencies {
  currentSceneId: SceneId;
  scenes: Record<SceneId, SceneConfig>;
  getTileKind: (sceneId: SceneId, tileX: number, tileY: number) => TileKind;
  getRodOriginWorld: () => Vector2;
}

export interface FishingUpdateDependencies extends FishingClickDependencies {
  onCatchAttempt: () => FishingCatchAttemptResult;
  onCatchAdded: () => void;
}

export interface FishingRenderDependencies {
  currentSceneId: SceneId;
  toScreenPoint: (worldPoint: Vector2) => Vector2;
  getRodOriginWorld: () => Vector2;
}
