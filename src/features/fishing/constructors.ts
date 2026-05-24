import type { FishingSession, FishingState } from "./types";

export function createInitialFishingSession(): FishingSession {
  return {
    phase: "idle",
    castStart: null,
    castTarget: null,
    bobberPosition: null,
    castingTimer: 0,
    biteDelayTimer: 0,
    biteWindowTimer: 0,
    resultTimer: 0,
    waveTimer: 0,
    fishPullTimer: 0,
    burstStrength: 0,
    tension: 0,
    catchProgress: 0,
    statusText: "Click open water to cast.",
  };
}

export function createFishingState(): FishingState {
  return {
    session: createInitialFishingSession(),
    isReelHeld: false,
  };
}

export function resetFishingState(state: FishingState): void {
  state.session = createInitialFishingSession();
  state.isReelHeld = false;
}
