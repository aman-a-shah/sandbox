import { escapeHtml } from "../../core/utils";
import { getInventoryUsedSlots, getSelectedInventoryFish, selectInventorySlot } from "./system";
import type { InventoryDomRefs, InventoryState } from "./types";

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

    const visualToken = slotFish ? escapeHtml(slotFish.placeholderVisual) : "EMPTY";
    const slotLabel = slotFish ? escapeHtml(slotFish.name) : `Slot ${slot.slotIndex + 1}`;
    slotButtonEl.innerHTML = [
      `<span class=\"inventory-slot-image\">${visualToken}</span>`,
      `<p class=\"inventory-slot-label\">${slotLabel}</p>`,
    ].join("");

    slotButtonEl.addEventListener("click", () => {
      selectInventorySlot(state, slot.slotIndex);
      renderInventory(domRefs, state);
    });

    domRefs.gridEl.append(slotButtonEl);
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
    `<div class=\"inventory-details-image\">${escapeHtml(selectedFish.placeholderVisual)} Placeholder Image</div>`,
    `<h4 class=\"inventory-details-title\">${escapeHtml(selectedFish.name)}</h4>`,
    `<p class=\"inventory-rarity\" data-rarity=\"${rarityToken}\">${escapeHtml(selectedFish.rarity)}</p>`,
    "<dl class=\"inventory-detail-list\">",
    `<dt>Scientific</dt><dd>${escapeHtml(selectedFish.scientificName)}</dd>`,
    `<dt>Region</dt><dd>${escapeHtml(selectedFish.region)}</dd>`,
    `<dt>Value</dt><dd>$${selectedFish.value.toFixed(2)}</dd>`,
    "</dl>",
  ].join("");
}
