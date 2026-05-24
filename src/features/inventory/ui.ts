import { escapeHtml } from "../../core/utils";
import { getFishSpriteManifestEntry, getFishSpritePublicPath } from "./fish-sprites";
import { getInventoryUsedSlots, getSelectedInventoryItem, selectDiscoveredFish, selectInventorySlot } from "./system";
import type { InventoryDomRefs, InventorySlot, InventoryState } from "./types";

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
  hydrateFishSpriteFallbacks(domRefs.gridEl);
  hydrateFishSpriteFallbacks(domRefs.saleGridEl);

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
  hydrateFishSpriteFallbacks(domRefs.detailsEl);
}

function getFishSpriteMarkup(fishId: string, variant: "slot" | "details", fallbackText: string): string {
  const sprite = getFishSpriteManifestEntry(fishId);
  if (!sprite) {
    return escapeHtml(fallbackText);
  }

  const spritePath = getFishSpritePublicPath(sprite);
  const escapedFallbackText = escapeHtml(fallbackText);
  return (
    `<img class=\"fish-sprite fish-sprite--${variant}\" ` +
    `src=\"${escapeHtml(spritePath)}\" ` +
    `alt=\"${escapedFallbackText}\" ` +
    `data-fallback-text=\"${escapedFallbackText}\" ` +
    `loading=\"lazy\" decoding=\"async\">`
  );
}

function hydrateFishSpriteFallbacks(rootEl: HTMLElement): void {
  const spriteEls = Array.from(rootEl.querySelectorAll<HTMLImageElement>("img.fish-sprite[data-fallback-text]"));
  for (const spriteEl of spriteEls) {
    if (spriteEl.dataset.fallbackBound === "true") {
      continue;
    }

    spriteEl.dataset.fallbackBound = "true";
    spriteEl.addEventListener("error", () => {
      const fallbackText = spriteEl.dataset.fallbackText;
      if (!fallbackText) {
        return;
      }

      const fallbackEl = document.createElement("span");
      fallbackEl.className = spriteEl.className;
      fallbackEl.textContent = fallbackText;
      spriteEl.replaceWith(fallbackEl);
    });
  }
}
