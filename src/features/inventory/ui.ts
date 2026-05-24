import { escapeHtml } from "../../core/utils";
import type { InventorySlot } from "./types";
import { getInventoryUsedSlots, getSelectedInventoryItem, selectDiscoveredFish, selectInventorySlot } from "./system";
import type { InventoryDomRefs, InventoryState } from "./types";

const fishSheetUrl = "/sprites-clean/fish_transparent.png";
const fishSheetImage = new Image();
fishSheetImage.src = fishSheetUrl;

interface FishSpriteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const NAMED_FISH_SPRITES: Record<string, FishSpriteRect> = {
  "sunstripe-snapper": { x: 70, y: 55, width: 190, height: 95 },
  "mist-fin-cod": { x: 1000, y: 170, width: 180, height: 85 },
  "ember-tail-perch": { x: 1225, y: 55, width: 190, height: 100 },
  "moon-reef-bream": { x: 770, y: 295, width: 180, height: 90 },
  "kelpback-bass": { x: 295, y: 295, width: 190, height: 90 },
  "jade-raylet": { x: 60, y: 505, width: 190, height: 105 },
  "storm-glass-eel": { x: 565, y: 690, width: 125, height: 75 },
  "frost-gill-trout": { x: 555, y: 500, width: 190, height: 80 },
  "ruby-lantern-koi": { x: 1010, y: 505, width: 190, height: 80 },
  "crownfin-oracle": { x: 55, y: 670, width: 250, height: 80 },
};

const GENERIC_FISH_SPRITES: FishSpriteRect[] = Object.values(NAMED_FISH_SPRITES);

fishSheetImage.addEventListener("load", () => {
  hydrateFishSprites(document.body);
});

export function syncInventoryOverlay(domRefs: InventoryDomRefs, state: InventoryState): void {
  domRefs.overlayEl.classList.toggle("is-hidden", !state.isOpen);
  domRefs.overlayEl.setAttribute("aria-hidden", String(!state.isOpen));
  domRefs.toggleButtonEl.setAttribute("aria-expanded", String(state.isOpen));
  domRefs.modeBannerEl.classList.toggle("is-hidden", state.interactionMode !== "sale");
  domRefs.salePanelEl.classList.toggle("is-hidden", state.interactionMode !== "sale");
}

export function renderInventory(
  domRefs: InventoryDomRefs,
  state: InventoryState,
  saleTableSlots: InventorySlot[] = [],
  onMoveToSaleTable?: (slotIndex: number) => void,
  onMoveToBackpack?: (slotIndex: number) => void,
): void {
  const usedSlots = getInventoryUsedSlots(state);
  domRefs.bagTabButtonEl.classList.toggle("is-active", state.activeView === "bag");
  domRefs.discoveredTabButtonEl.classList.toggle("is-active", state.activeView === "discovered");
  domRefs.bagTabButtonEl.setAttribute("aria-selected", String(state.activeView === "bag"));
  domRefs.discoveredTabButtonEl.setAttribute("aria-selected", String(state.activeView === "discovered"));
  domRefs.discoveredTabButtonEl.disabled = state.interactionMode === "sale";
  domRefs.modeBannerEl.textContent =
    state.interactionMode === "sale"
      ? "Sale Table Mode: click backpack items to move them onto the table. Click table items to move them back."
      : "";
  domRefs.gridEl.innerHTML = "";
  domRefs.saleGridEl.innerHTML = "";

  if (state.activeView === "bag") {
    domRefs.capacityEl.textContent = `${usedSlots} / ${state.slots.length} slots used`;
    renderSlotGrid(domRefs.gridEl, state.slots, state.selectedSlotIndex, (slot) => {
      if (state.interactionMode === "sale" && onMoveToSaleTable) {
        onMoveToSaleTable(slot.slotIndex);
      } else {
        selectInventorySlot(state, slot.slotIndex);
      }
      renderInventory(domRefs, state, saleTableSlots, onMoveToSaleTable, onMoveToBackpack);
    });

    if (state.interactionMode === "sale") {
      const saleTableUsedSlots = saleTableSlots.reduce((count, slot) => count + (slot.item ? 1 : 0), 0);
      domRefs.saleCapacityEl.textContent = `${saleTableUsedSlots} / ${saleTableSlots.length} slots used`;
      renderSlotGrid(domRefs.saleGridEl, saleTableSlots, null, (slot) => {
        onMoveToBackpack?.(slot.slotIndex);
        renderInventory(domRefs, state, saleTableSlots, onMoveToSaleTable, onMoveToBackpack);
      });
    }
  } else {
    domRefs.capacityEl.textContent = `${state.discoveredFish.length} fish discovered`;
    domRefs.gridEl.classList.add("inventory-grid--discovered");

    if (state.discoveredFish.length === 0) {
      domRefs.gridEl.innerHTML = "<p class=\"inventory-discovered-empty\">Catch fish to add them to your discovery journal.</p>";
    } else {
      for (const fish of state.discoveredFish) {
        const slotButtonEl = document.createElement("button");
        slotButtonEl.type = "button";
        slotButtonEl.className = "inventory-slot";

        if (state.selectedDiscoveredFishId === fish.id) {
          slotButtonEl.classList.add("is-selected");
        }

        slotButtonEl.innerHTML = [
          `<span class=\"inventory-slot-image\">${getFishSpriteMarkup(fish.id, "slot", fish.placeholderVisual)}</span>`,
          `<p class=\"inventory-slot-label\">${escapeHtml(fish.name)}</p>`,
        ].join("");

        slotButtonEl.addEventListener("click", () => {
          selectDiscoveredFish(state, fish.id);
          renderInventory(domRefs, state, saleTableSlots, onMoveToSaleTable, onMoveToBackpack);
        });

        domRefs.gridEl.append(slotButtonEl);
      }
    }
  }

  domRefs.gridEl.classList.toggle("inventory-grid--discovered", state.activeView === "discovered");
  hydrateFishSprites(domRefs.gridEl);
  hydrateFishSprites(domRefs.saleGridEl);

  renderInventoryDetails(domRefs, state);
}

function renderSlotGrid(
  rootEl: HTMLDivElement,
  slots: InventorySlot[],
  selectedSlotIndex: number | null,
  onClick: (slot: InventorySlot) => void,
): void {
  for (const slot of slots) {
    const slotButtonEl = document.createElement("button");
    slotButtonEl.type = "button";
    slotButtonEl.className = "inventory-slot";
    const slotItem = slot.item;

    if (!slotItem) {
      slotButtonEl.classList.add("is-empty");
    }

    if (selectedSlotIndex === slot.slotIndex) {
      slotButtonEl.classList.add("is-selected");
    }

    const slotLabel = slotItem ? escapeHtml(slotItem.name) : `Slot ${slot.slotIndex + 1}`;
    slotButtonEl.innerHTML = [
      `<span class=\"inventory-slot-image\">${
        slotItem ? getFishSpriteMarkup(slotItem.id, "slot", slotItem.placeholderVisual) : "EMPTY"
      }</span>`,
      `<p class=\"inventory-slot-label\">${slotLabel}</p>`,
    ].join("");

    slotButtonEl.addEventListener("click", () => onClick(slot));
    rootEl.append(slotButtonEl);
  }
}

export function renderInventoryDetails(domRefs: InventoryDomRefs, state: InventoryState): void {
  const selectedItem = getSelectedInventoryItem(state);
  if (!selectedItem) {
    domRefs.detailsEl.innerHTML = "<p class=\"inventory-details-placeholder\">Select an item to see details.</p>";
    return;
  }

  if (selectedItem.kind === "food") {
    const rarityToken = selectedItem.rarity.toLowerCase();
    domRefs.detailsEl.innerHTML = [
      `<div class=\"inventory-details-image\">${escapeHtml(selectedItem.placeholderVisual)} Cooked Dish</div>`,
      `<h4 class=\"inventory-details-title\">${escapeHtml(selectedItem.name)}</h4>`,
      `<p class=\"inventory-rarity\" data-rarity=\"${rarityToken}\">${escapeHtml(selectedItem.rarity)}</p>`,
      "<dl class=\"inventory-detail-list\">",
      `<dt>Type</dt><dd>Cooked Food</dd>`,
      `<dt>Main Fish</dt><dd>${escapeHtml(selectedItem.requiredFishName)}</dd>`,
      `<dt>Cook Time</dt><dd>${escapeHtml(`${selectedItem.cookTimeMinutes} min`)}</dd>`,
      `<dt>Servings</dt><dd>${escapeHtml(selectedItem.servingsLabel.replace(/^Servings:\\s*/, ""))}</dd>`,
      `<dt>Calories</dt><dd>${selectedItem.calories === null ? "Unknown" : escapeHtml(String(selectedItem.calories))}</dd>`,
      `<dt>Value</dt><dd>$${selectedItem.value.toFixed(2)}</dd>`,
      "</dl>",
    ].join("");
    return;
  }

  const selectedFish = selectedItem;
  const rarityToken = selectedFish.rarity.toLowerCase();
  const depthText =
    selectedFish.averageDepthMeters === null ? "Unknown" : `${selectedFish.averageDepthMeters.toFixed(1)} m`;
  const lengthText =
    selectedFish.fishBaseCommonLengthCm === null ? "Unknown" : `${selectedFish.fishBaseCommonLengthCm} cm`;
  const distributionText =
    selectedFish.wormsDistributionSummary.length > 0 ? selectedFish.wormsDistributionSummary.join(", ") : "No summary";

  domRefs.detailsEl.innerHTML = [
    `<div class=\"inventory-details-image\">${getFishSpriteMarkup(selectedFish.id, "details", selectedFish.placeholderVisual)}</div>`,
    `<h4 class=\"inventory-details-title\">${escapeHtml(selectedFish.name)}</h4>`,
    `<p class=\"inventory-rarity\" data-rarity=\"${rarityToken}\">${escapeHtml(selectedFish.rarity)}</p>`,
    "<dl class=\"inventory-detail-list\">",
    `<dt>Scientific</dt><dd>${escapeHtml(selectedFish.scientificName)}</dd>`,
    `<dt>Family</dt><dd>${escapeHtml(selectedFish.family ?? "Unknown")}</dd>`,
    `<dt>Order</dt><dd>${escapeHtml(selectedFish.order ?? "Unknown")}</dd>`,
    `<dt>Habitat</dt><dd>${escapeHtml(selectedFish.habitatName)}</dd>`,
    `<dt>Avg Depth</dt><dd>${escapeHtml(depthText)}</dd>`,
    `<dt>Common Length</dt><dd>${escapeHtml(lengthText)}</dd>`,
    `<dt>Catch Chance</dt><dd>${selectedFish.likelyCatchPercent.toFixed(2)}%</dd>`,
    `<dt>Region</dt><dd>${escapeHtml(selectedFish.region)}</dd>`,
    `<dt>Value</dt><dd>$${selectedFish.value.toFixed(2)}</dd>`,
    `<dt>Distribution</dt><dd>${escapeHtml(distributionText)}</dd>`,
    "</dl>",
  ].join("");
  hydrateFishSprites(domRefs.detailsEl);
}

function getFishSpriteMarkup(fishId: string, variant: "slot" | "details", fallbackText: string): string {
  const sprite = resolveFishSprite(fishId);
  if (!sprite) {
    return escapeHtml(fallbackText);
  }

  return `<span class=\"fish-sprite fish-sprite--${variant}\" data-fish-id=\"${escapeHtml(fishId)}\" data-variant=\"${variant}\" aria-label=\"${escapeHtml(fallbackText)}\">${escapeHtml(fallbackText)}</span>`;
}

function hydrateFishSprites(rootEl: HTMLElement): void {
  const spriteEls = Array.from(rootEl.querySelectorAll<HTMLElement>(".fish-sprite[data-fish-id]"));
  for (const spriteEl of spriteEls) {
    const fishId = spriteEl.dataset.fishId;
    const variant = spriteEl.dataset.variant === "details" ? "details" : "slot";
    const sprite = fishId ? resolveFishSprite(fishId) : null;
    if (!sprite || !fishSheetImage.complete) {
      continue;
    }

    const scale = variant === "slot" ? 0.32 : 0.72;
    const canvas = document.createElement("canvas");
    canvas.className = spriteEl.className;
    canvas.width = Math.round(sprite.width * scale);
    canvas.height = Math.round(sprite.height * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      continue;
    }

    context.imageSmoothingEnabled = false;
    context.drawImage(fishSheetImage, sprite.x, sprite.y, sprite.width, sprite.height, 0, 0, canvas.width, canvas.height);
    spriteEl.replaceWith(canvas);
  }
}

function resolveFishSprite(fishId: string): FishSpriteRect | null {
  const namedSprite = NAMED_FISH_SPRITES[fishId];
  if (namedSprite) {
    return namedSprite;
  }

  if (GENERIC_FISH_SPRITES.length === 0) {
    return null;
  }

  const fallbackIndex = Math.abs(hashString(fishId)) % GENERIC_FISH_SPRITES.length;
  return GENERIC_FISH_SPRITES[fallbackIndex];
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}
