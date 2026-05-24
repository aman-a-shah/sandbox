import type { BaseState } from "../features/base";
import type { FishingState } from "../features/fishing";
import type { InventoryState } from "../features/inventory";
import type { ShopState } from "../features/shop";

export interface AppState {
  base: BaseState;
  fishing: FishingState;
  inventory: InventoryState;
  shop: ShopState;
  keysDown: Set<string>;
  fps: number;
  lastFrameTime: number;
}
