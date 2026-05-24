import { clamp, lerp, randomBetween } from "../../core/utils";
import type { Vector2 } from "../../core/types/vector";
import { BASE_CONSTANTS } from "../base";
import { FISHING_CONSTANTS } from "./constants";
import { resetFishingState } from "./constructors";
import type {
  FishingClickDependencies,
  FishingPhase,
  FishingRenderDependencies,
  FishingState,
  FishingUpdateDependencies,
} from "./types";

export function isFishingInputLocked(
  currentSceneId: FishingClickDependencies["currentSceneId"],
  fishingPhase: FishingPhase,
  overlaysOpen: boolean,
): boolean {
  if (overlaysOpen) {
    return true;
  }

  if (currentSceneId !== "ocean") {
    return false;
  }

  return fishingPhase !== "idle";
}

export function handleFishingClick(state: FishingState, worldPoint: Vector2, dependencies: FishingClickDependencies): void {
  if (dependencies.currentSceneId !== "ocean") {
    return;
  }

  if (state.session.phase === "biteWindow") {
    if (isPointInsideBobber(state, worldPoint)) {
      beginReelingPhase(state);
    }
    return;
  }

  if (state.session.phase !== "idle") {
    return;
  }

  tryStartCastAt(state, worldPoint, dependencies);
}

function tryStartCastAt(state: FishingState, worldPoint: Vector2, dependencies: FishingClickDependencies): void {
  const scene = dependencies.scenes.ocean;
  const clampedTarget = {
    x: clamp(worldPoint.x, 0, scene.worldCols * BASE_CONSTANTS.TILE_SIZE - 1),
    y: clamp(worldPoint.y, 0, scene.worldRows * BASE_CONSTANTS.TILE_SIZE - 1),
  };
  const tileX = Math.floor(clampedTarget.x / BASE_CONSTANTS.TILE_SIZE);
  const tileY = Math.floor(clampedTarget.y / BASE_CONSTANTS.TILE_SIZE);
  const tileKind = dependencies.getTileKind("ocean", tileX, tileY);

  if (tileKind !== "water") {
    state.session.statusText = "Cast into open water.";
    return;
  }

  const castStart = dependencies.getRodOriginWorld();
  state.session.phase = "casting";
  state.session.castStart = castStart;
  state.session.castTarget = clampedTarget;
  state.session.bobberPosition = { ...castStart };
  state.session.castingTimer = 0;
  state.session.waveTimer = 0;
  state.session.biteDelayTimer = 0;
  state.session.biteWindowTimer = 0;
  state.session.tension = 0;
  state.session.catchProgress = 0;
  state.session.statusText = "Casting...";
}

export function updateFishing(state: FishingState, dt: number, dependencies: FishingUpdateDependencies): void {
  if (dependencies.currentSceneId !== "ocean") {
    return;
  }

  switch (state.session.phase) {
    case "idle":
      break;
    case "casting":
      updateFishingCast(state, dt, dependencies.getRodOriginWorld);
      break;
    case "waitingBite":
      updateFishingWaitForBite(state, dt, dependencies.getRodOriginWorld);
      break;
    case "biteWindow":
      updateFishingBiteWindow(state, dt, dependencies.getRodOriginWorld);
      break;
    case "reeling":
      updateFishingReeling(state, dt, dependencies);
      break;
    case "success":
    case "fail":
      state.session.resultTimer -= dt;
      if (state.session.resultTimer <= 0) {
        resetFishingState(state);
      }
      break;
    default:
      break;
  }
}

function updateFishingCast(state: FishingState, dt: number, getRodOriginWorld: () => Vector2): void {
  if (!state.session.castStart || !state.session.castTarget) {
    resetFishingState(state);
    return;
  }

  state.session.castingTimer += dt;
  const travelRatio = clamp(state.session.castingTimer / FISHING_CONSTANTS.CAST_DURATION, 0, 1);
  const arcHeight = Math.sin(travelRatio * Math.PI) * FISHING_CONSTANTS.CAST_ARC_HEIGHT;
  state.session.bobberPosition = {
    x: lerp(state.session.castStart.x, state.session.castTarget.x, travelRatio),
    y: lerp(state.session.castStart.y, state.session.castTarget.y, travelRatio) - arcHeight,
  };

  if (travelRatio < 1) {
    return;
  }

  state.session.phase = "waitingBite";
  state.session.castingTimer = 0;
  state.session.waveTimer = 0;
  state.session.biteDelayTimer = randomBetween(FISHING_CONSTANTS.BITE_DELAY_MIN, FISHING_CONSTANTS.BITE_DELAY_MAX);
  state.session.statusText = "Waiting for a bite...";
  updateFloatingBobber(state, false, getRodOriginWorld);
}

function updateFishingWaitForBite(state: FishingState, dt: number, getRodOriginWorld: () => Vector2): void {
  state.session.waveTimer += dt;
  updateFloatingBobber(state, false, getRodOriginWorld);

  state.session.biteDelayTimer -= dt;
  if (state.session.biteDelayTimer > 0) {
    return;
  }

  state.session.phase = "biteWindow";
  state.session.biteWindowTimer = FISHING_CONSTANTS.BITE_WINDOW;
  state.session.statusText = "Fish on! Click the bobber!";
}

function updateFishingBiteWindow(state: FishingState, dt: number, getRodOriginWorld: () => Vector2): void {
  state.session.waveTimer += dt;
  updateFloatingBobber(state, true, getRodOriginWorld);

  state.session.biteWindowTimer -= dt;
  if (state.session.biteWindowTimer <= 0) {
    setFishingOutcome(state, "fail", "Missed the bite.");
  }
}

function beginReelingPhase(state: FishingState): void {
  const zoneWidth = randomBetween(FISHING_CONSTANTS.GREEN_ZONE_WIDTH_MIN, FISHING_CONSTANTS.GREEN_ZONE_WIDTH_MAX);
  const zoneStartMin = FISHING_CONSTANTS.GREEN_ZONE_EDGE_PADDING;
  const zoneStartMax = 1 - FISHING_CONSTANTS.GREEN_ZONE_EDGE_PADDING - zoneWidth;
  const zoneStart = randomBetween(zoneStartMin, Math.max(zoneStartMin, zoneStartMax));

  state.session.phase = "reeling";
  state.session.waveTimer = 0;
  state.session.fishPullTimer = 0;
  state.session.burstStrength = 0;
  state.session.tension = 0.1;
  state.session.greenZoneStart = zoneStart;
  state.session.greenZoneEnd = clamp(zoneStart + zoneWidth, 0, 1);
  state.session.catchProgress = 0;
  state.session.statusText = "Hold mouse to reel. Keep the marker in green.";
}

function updateFishingReeling(state: FishingState, dt: number, dependencies: FishingUpdateDependencies): void {
  state.session.waveTimer += dt;
  state.session.fishPullTimer += dt;
  updateFloatingBobber(state, false, dependencies.getRodOriginWorld);

  if (Math.random() < FISHING_CONSTANTS.PULL_BURST_CHANCE * dt) {
    state.session.burstStrength = randomBetween(FISHING_CONSTANTS.PULL_BURST_MIN, FISHING_CONSTANTS.PULL_BURST_MAX);
  }

  state.session.burstStrength = Math.max(0, state.session.burstStrength - dt * FISHING_CONSTANTS.PULL_BURST_DRAIN);

  const driftPull =
    Math.sin(state.session.fishPullTimer * 4.6) * FISHING_CONSTANTS.PULL_WAVE +
    Math.sin(state.session.fishPullTimer * 9.4) * 0.07;
  const reelTensionDelta = state.isReelHeld ? FISHING_CONSTANTS.TENSION_GAIN : -FISHING_CONSTANTS.TENSION_RELEASE;
  state.session.tension += (reelTensionDelta + driftPull + state.session.burstStrength) * dt;
  state.session.tension = clamp(state.session.tension, 0, 1.35);

  if (state.session.tension >= FISHING_CONSTANTS.TENSION_SNAP) {
    setFishingOutcome(state, "fail", "Line snapped.");
    return;
  }

  const tensionRatio = clamp(state.session.tension / FISHING_CONSTANTS.TENSION_SNAP, 0, 1);
  const inGreenZone = tensionRatio >= state.session.greenZoneStart && tensionRatio <= state.session.greenZoneEnd;
  const progressDelta = inGreenZone
    ? state.isReelHeld
      ? FISHING_CONSTANTS.PROGRESS_GAIN_IN_GREEN
      : -FISHING_CONSTANTS.PROGRESS_DECAY_IDLE
    : -FISHING_CONSTANTS.PROGRESS_LOSS_IN_RED;
  state.session.catchProgress = clamp(
    state.session.catchProgress + progressDelta * dt,
    0,
    FISHING_CONSTANTS.PROGRESS_TARGET,
  );

  if (state.session.catchProgress >= FISHING_CONSTANTS.PROGRESS_TARGET) {
    const catchResult = dependencies.onCatchAttempt();
    if (!catchResult.added) {
      setFishingOutcome(state, "success", "Inventory full. No room for the catch.");
      return;
    }

    dependencies.onCatchAdded();
    setFishingOutcome(state, "success", `Caught: ${catchResult.fishName}!`);
  }
}

function updateFloatingBobber(state: FishingState, withBiteDip: boolean, getRodOriginWorld: () => Vector2): void {
  if (!state.session.castTarget) {
    state.session.bobberPosition = null;
    return;
  }

  const swayX = Math.sin(state.session.waveTimer * 2.6) * FISHING_CONSTANTS.BOBBER_SWAY_X;
  const swayY = Math.cos(state.session.waveTimer * 3.2) * FISHING_CONSTANTS.BOBBER_SWAY_Y;
  const biteDip = withBiteDip
    ? FISHING_CONSTANTS.BOBBER_BITE_DIP_BASE + Math.sin(state.session.waveTimer * 26) * FISHING_CONSTANTS.BOBBER_BITE_DIP_WAVE
    : 0;
  const pullBias = state.session.phase === "reeling" ? state.session.catchProgress * 0.18 : 0;
  const rodOrigin = getRodOriginWorld();

  state.session.bobberPosition = {
    x: lerp(state.session.castTarget.x, rodOrigin.x, pullBias) + swayX,
    y: lerp(state.session.castTarget.y, rodOrigin.y, pullBias) + swayY + biteDip,
  };
}

function setFishingOutcome(state: FishingState, phase: "success" | "fail", message: string): void {
  state.session.phase = phase;
  state.session.resultTimer = FISHING_CONSTANTS.RESULT_DURATION;
  state.session.statusText = message;
  state.session.castStart = null;
  state.session.castTarget = null;
  state.session.bobberPosition = null;
  state.session.castingTimer = 0;
  state.session.biteDelayTimer = 0;
  state.session.biteWindowTimer = 0;
  state.session.tension = 0;
  state.session.catchProgress = 0;
  state.session.burstStrength = 0;
}

function isPointInsideBobber(state: FishingState, worldPoint: Vector2): boolean {
  if (!state.session.bobberPosition) {
    return false;
  }

  return (
    Math.hypot(worldPoint.x - state.session.bobberPosition.x, worldPoint.y - state.session.bobberPosition.y) <=
    FISHING_CONSTANTS.BOBBER_HIT_RADIUS
  );
}

export function drawFishingWorldLayer(
  renderCtx: CanvasRenderingContext2D,
  state: FishingState,
  dependencies: FishingRenderDependencies,
): void {
  if (dependencies.currentSceneId !== "ocean") {
    return;
  }

  if (state.session.phase === "idle" || !state.session.bobberPosition) {
    return;
  }

  const bobberScreen = dependencies.toScreenPoint(state.session.bobberPosition);
  const rodOriginScreen = dependencies.toScreenPoint(dependencies.getRodOriginWorld());

  renderCtx.strokeStyle = "rgba(247, 250, 255, 0.9)";
  renderCtx.lineWidth = FISHING_CONSTANTS.LINE_WIDTH;
  renderCtx.beginPath();
  renderCtx.moveTo(rodOriginScreen.x, rodOriginScreen.y);
  renderCtx.lineTo(bobberScreen.x, bobberScreen.y);
  renderCtx.stroke();

  if (state.session.phase === "biteWindow") {
    const pulse = FISHING_CONSTANTS.BOBBER_PULSE_BASE + Math.sin(state.session.waveTimer * 20) * FISHING_CONSTANTS.BOBBER_PULSE_WAVE;
    renderCtx.strokeStyle = "rgba(255, 245, 157, 0.7)";
    renderCtx.beginPath();
    renderCtx.arc(bobberScreen.x, bobberScreen.y, pulse, 0, Math.PI * 2);
    renderCtx.stroke();
  }

  renderCtx.fillStyle = "#ff5656";
  renderCtx.beginPath();
  renderCtx.arc(bobberScreen.x, bobberScreen.y, FISHING_CONSTANTS.BOBBER_VISUAL_RADIUS, 0, Math.PI * 2);
  renderCtx.fill();
  renderCtx.fillStyle = "#ffffff";
  renderCtx.beginPath();
  renderCtx.arc(
    bobberScreen.x,
    bobberScreen.y - 2 * BASE_CONSTANTS.GLOBAL_SCALE,
    FISHING_CONSTANTS.BOBBER_VISUAL_RADIUS * 0.62,
    0,
    Math.PI * 2,
  );
  renderCtx.fill();
}

export function drawFishingHud(
  renderCtx: CanvasRenderingContext2D,
  state: FishingState,
  currentSceneId: FishingRenderDependencies["currentSceneId"],
): void {
  if (currentSceneId !== "ocean") {
    return;
  }

  drawFishingStatusText(renderCtx, state);
  if (state.session.phase === "reeling") {
    drawFishingTensionBar(renderCtx, state);
  }
}

function drawFishingStatusText(renderCtx: CanvasRenderingContext2D, state: FishingState): void {
  const boxHeight = Math.max(1, Math.round(28 * BASE_CONSTANTS.GLOBAL_SCALE));
  const boxWidth = Math.max(1, Math.round(420 * BASE_CONSTANTS.GLOBAL_SCALE));
  const x = Math.max(1, Math.round(14 * BASE_CONSTANTS.GLOBAL_SCALE));
  const y = BASE_CONSTANTS.RENDER_HEIGHT - boxHeight - Math.max(1, Math.round(12 * BASE_CONSTANTS.GLOBAL_SCALE));

  renderCtx.fillStyle = "rgba(7, 15, 31, 0.78)";
  renderCtx.strokeStyle = "rgba(162, 197, 233, 0.5)";
  renderCtx.lineWidth = Math.max(1, BASE_CONSTANTS.GLOBAL_SCALE);
  renderCtx.fillRect(x, y, boxWidth, boxHeight);
  renderCtx.strokeRect(x, y, boxWidth, boxHeight);

  renderCtx.fillStyle = "#e9f4ff";
  renderCtx.font = FISHING_CONSTANTS.HUD_TEXT_FONT;
  renderCtx.textAlign = "left";
  renderCtx.textBaseline = "middle";
  renderCtx.fillText(state.session.statusText, x + Math.max(1, Math.round(10 * BASE_CONSTANTS.GLOBAL_SCALE)), y + boxHeight / 2 + 0.5 * BASE_CONSTANTS.GLOBAL_SCALE);
}

function drawFishingTensionBar(renderCtx: CanvasRenderingContext2D, state: FishingState): void {
  const barWidth = Math.max(1, Math.round(250 * BASE_CONSTANTS.GLOBAL_SCALE));
  const barHeight = Math.max(1, Math.round(12 * BASE_CONSTANTS.GLOBAL_SCALE));
  const x = (BASE_CONSTANTS.RENDER_WIDTH - barWidth) / 2;
  const y = BASE_CONSTANTS.RENDER_HEIGHT - Math.max(1, Math.round(58 * BASE_CONSTANTS.GLOBAL_SCALE));

  renderCtx.fillStyle = "rgba(4, 11, 22, 0.87)";
  renderCtx.fillRect(
    x - Math.max(1, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)),
    y - Math.max(1, Math.round(22 * BASE_CONSTANTS.GLOBAL_SCALE)),
    barWidth + Math.max(1, Math.round(12 * BASE_CONSTANTS.GLOBAL_SCALE)),
    barHeight + Math.max(1, Math.round(36 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );
  renderCtx.strokeStyle = "rgba(150, 182, 214, 0.55)";
  renderCtx.strokeRect(
    x - Math.max(1, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)),
    y - Math.max(1, Math.round(22 * BASE_CONSTANTS.GLOBAL_SCALE)),
    barWidth + Math.max(1, Math.round(12 * BASE_CONSTANTS.GLOBAL_SCALE)),
    barHeight + Math.max(1, Math.round(36 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );

  renderCtx.fillStyle = "#cf5252";
  renderCtx.fillRect(x, y, barWidth, barHeight);
  const greenZoneX = x + barWidth * state.session.greenZoneStart;
  const greenZoneWidth = barWidth * (state.session.greenZoneEnd - state.session.greenZoneStart);
  renderCtx.fillStyle = "#29b46f";
  renderCtx.fillRect(greenZoneX, y, greenZoneWidth, barHeight);
  renderCtx.strokeStyle = "rgba(245, 250, 255, 0.9)";
  renderCtx.strokeRect(x, y, barWidth, barHeight);

  const tensionRatio = clamp(state.session.tension / FISHING_CONSTANTS.TENSION_SNAP, 0, 1);
  const tensionX = x + tensionRatio * barWidth;
  renderCtx.strokeStyle = "#ffffff";
  renderCtx.beginPath();
  renderCtx.moveTo(tensionX, y - Math.max(1, Math.round(3 * BASE_CONSTANTS.GLOBAL_SCALE)));
  renderCtx.lineTo(tensionX, y + barHeight + Math.max(1, Math.round(3 * BASE_CONSTANTS.GLOBAL_SCALE)));
  renderCtx.stroke();

  renderCtx.fillStyle = "#e8f5ff";
  renderCtx.font = FISHING_CONSTANTS.HUD_META_FONT;
  renderCtx.textAlign = "left";
  renderCtx.textBaseline = "alphabetic";
  renderCtx.fillText("Tension", x, y - Math.max(1, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)));

  renderCtx.textAlign = "right";
  renderCtx.fillText(
    `Reel ${Math.round(state.session.catchProgress * 100)}%`,
    x + barWidth,
    y - Math.max(1, Math.round(6 * BASE_CONSTANTS.GLOBAL_SCALE)),
  );
}
