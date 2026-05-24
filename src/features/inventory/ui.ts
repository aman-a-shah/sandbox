import { escapeHtml } from "../../core/utils";
import { getInventoryUsedSlots, getSelectedInventoryItem, selectDiscoveredFish, selectInventorySlot } from "./system";
import type { InventoryDomRefs, InventoryState } from "./types";

export function syncInventoryOverlay(domRefs: InventoryDomRefs, state: InventoryState): void {
  domRefs.overlayEl.classList.toggle("is-hidden", !state.isOpen);
  domRefs.overlayEl.setAttribute("aria-hidden", String(!state.isOpen));
  domRefs.toggleButtonEl.setAttribute("aria-expanded", String(state.isOpen));
}

export function renderInventory(domRefs: InventoryDomRefs, state: InventoryState): void {
  const usedSlots = getInventoryUsedSlots(state);
  domRefs.bagTabButtonEl.classList.toggle("is-active", state.activeView === "bag");
  domRefs.discoveredTabButtonEl.classList.toggle("is-active", state.activeView === "discovered");
  domRefs.bagTabButtonEl.setAttribute("aria-selected", String(state.activeView === "bag"));
  domRefs.discoveredTabButtonEl.setAttribute("aria-selected", String(state.activeView === "discovered"));
  domRefs.gridEl.innerHTML = "";

  if (state.activeView === "bag") {
    domRefs.capacityEl.textContent = `${usedSlots} / ${state.slots.length} slots used`;

    for (const slot of state.slots) {
      const slotButtonEl = document.createElement("button");
      slotButtonEl.type = "button";
      slotButtonEl.className = "inventory-slot";
      const slotItem = slot.item;

      if (!slotItem) {
        slotButtonEl.classList.add("is-empty");
      }

      if (state.selectedSlotIndex === slot.slotIndex) {
        slotButtonEl.classList.add("is-selected");
      }

      const visualToken = slotItem ? escapeHtml(slotItem.placeholderVisual) : "EMPTY";
      const slotLabel = slotItem ? escapeHtml(slotItem.name) : `Slot ${slot.slotIndex + 1}`;
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
          `<span class=\"inventory-slot-image\">${escapeHtml(fish.placeholderVisual)}</span>`,
          `<p class=\"inventory-slot-label\">${escapeHtml(fish.name)}</p>`,
        ].join("");

        slotButtonEl.addEventListener("click", () => {
          selectDiscoveredFish(state, fish.id);
          renderInventory(domRefs, state);
        });

        domRefs.gridEl.append(slotButtonEl);
      }
    }
  }

  domRefs.gridEl.classList.toggle("inventory-grid--discovered", state.activeView === "discovered");

  renderInventoryDetails(domRefs, state);
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
  const substratumText = selectedFish.habitatSubstratum.length > 0 ? selectedFish.habitatSubstratum.join(", ") : "Unknown";
  const distributionText =
    selectedFish.wormsDistributionSummary.length > 0 ? selectedFish.wormsDistributionSummary.join(", ") : "No summary";

  domRefs.detailsEl.innerHTML = [
    `<div class=\"inventory-details-image\">${escapeHtml(selectedFish.placeholderVisual)} Placeholder Image</div>`,
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
}
