import type { BaseState } from "../features/base";
import type { FishingState } from "../features/fishing";
import type { InventoryState } from "../features/inventory";
import type { ShopState } from "../features/shop";

export interface WorldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OceanTravelState {
  isMapOpen: boolean;
  dockRect: WorldRect;
  selectedHabitatId: string | null;
}

export interface EconomyState {
  balance: number;
  bankruptcyThreshold: number;
  isGameOver: boolean;
}

export interface AppState {
  base: BaseState;
  fishing: FishingState;
  inventory: InventoryState;
  shop: ShopState;
  travel: OceanTravelState;
  economy: EconomyState;
  keysDown: Set<string>;
  fps: number;
  lastFrameTime: number;
}
