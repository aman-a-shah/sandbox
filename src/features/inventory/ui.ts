import { escapeHtml } from "../../core/utils";
import { getInventoryUsedSlots, getSelectedInventoryFish, selectInventorySlot } from "./system";
import type { InventoryDomRefs, InventoryState } from "./types";

const fishSheetUrl = "/sprites-clean/fish_transparent.png";
const fishSheetImage = new Image();
fishSheetImage.src = fishSheetUrl;

const FISH_SPRITES: Record<string, { x: number; y: number; width: number; height: number }> = {
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

export function syncInventoryOverlay(domRefs: InventoryDomRefs, state: InventoryState): void {
  domRefs.overlayEl.classList.toggle("is-hidden", !state.isOpen);
  domRefs.overlayEl.setAttribute("aria-hidden", String(!state.isOpen));
  domRefs.toggleButtonEl.setAttribute("aria-expanded", String(state.isOpen));
}

export function renderInventory(domRefs: InventoryDomRefs, state: InventoryState): void {
  const usedSlots = getInventoryUsedSlots(state);
  domRefs.capacityEl.textContent = `${usedSlots} / ${state.slots.length} slots used`;
  domRefs.gridEl.innerHTML = "";

  for (const slot of state.slots) {
    const slotButtonEl = document.createElement("button");
    slotButtonEl.type = "button";
    slotButtonEl.className = "inventory-slot";
    const slotFish = slot.fish;

    if (!slotFish) {
      slotButtonEl.classList.add("is-empty");
    }

    if (state.selectedSlotIndex === slot.slotIndex) {
      slotButtonEl.classList.add("is-selected");
    }

    const slotLabel = slotFish ? escapeHtml(slotFish.name) : `Slot ${slot.slotIndex + 1}`;
    const visualContent = slotFish ? getFishSpriteMarkup(slotFish.id, "slot", slotFish.placeholderVisual) : "EMPTY";
    slotButtonEl.innerHTML = [
      `<span class=\"inventory-slot-image\">${visualContent}</span>`,
      `<p class=\"inventory-slot-label\">${slotLabel}</p>`,
    ].join("");

    slotButtonEl.addEventListener("click", () => {
      selectInventorySlot(state, slot.slotIndex);
      renderInventory(domRefs, state);
    });

    domRefs.gridEl.append(slotButtonEl);
    hydrateFishSprites(slotButtonEl);
  }

  renderInventoryDetails(domRefs, state);
}

export function renderInventoryDetails(domRefs: InventoryDomRefs, state: InventoryState): void {
  const selectedFish = getSelectedInventoryFish(state);
  if (!selectedFish) {
    domRefs.detailsEl.innerHTML = "<p class=\"inventory-details-placeholder\">Select a fish slot to see details.</p>";
    return;
  }

  const rarityToken = selectedFish.rarity.toLowerCase();
  domRefs.detailsEl.innerHTML = [
    `<div class=\"inventory-details-image\">${getFishSpriteMarkup(selectedFish.id, "details", selectedFish.placeholderVisual)}</div>`,
    `<h4 class=\"inventory-details-title\">${escapeHtml(selectedFish.name)}</h4>`,
    `<p class=\"inventory-rarity\" data-rarity=\"${rarityToken}\">${escapeHtml(selectedFish.rarity)}</p>`,
    "<dl class=\"inventory-detail-list\">",
    `<dt>Scientific</dt><dd>${escapeHtml(selectedFish.scientificName)}</dd>`,
    `<dt>Region</dt><dd>${escapeHtml(selectedFish.region)}</dd>`,
    `<dt>Value</dt><dd>$${selectedFish.value.toFixed(2)}</dd>`,
    "</dl>",
  ].join("");
  hydrateFishSprites(domRefs.detailsEl);
}

function getFishSpriteMarkup(fishId: string, variant: "slot" | "details", fallbackText: string): string {
  const sprite = FISH_SPRITES[fishId];
  if (!sprite) {
    return escapeHtml(fallbackText);
  }

  return `<span class=\"fish-sprite fish-sprite--${variant}\" data-fish-id=\"${escapeHtml(fishId)}\" data-variant=\"${variant}\" aria-label=\"${escapeHtml(fallbackText)}\"></span>`;
}

function hydrateFishSprites(rootEl: HTMLElement): void {
  const spriteEls = Array.from(rootEl.querySelectorAll<HTMLElement>(".fish-sprite[data-fish-id]"));
  for (const spriteEl of spriteEls) {
    const fishId = spriteEl.dataset.fishId;
    const variant = spriteEl.dataset.variant === "details" ? "details" : "slot";
    const sprite = fishId ? FISH_SPRITES[fishId] : null;
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
