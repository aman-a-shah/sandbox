import type { RecipeStub } from "./types";

export const MOCK_RECIPES: RecipeStub[] = [
  {
    id: "pan-fried-whitefish",
    name: "Pan-Fried Whitefish",
    subtitle: "Crisp skin, lemon butter",
    cookTimeMinutes: 18,
    requiredFishName: "whitefish",
    requiredFishScientificName: null,
    requiredFishQuantity: 1,
    rarity: "common",
    estimatedPrice: 12,
    calories: 420,
    instructions: null,
    isCraftable: true,
    missingRequiredFishCount: 0,
    availabilityLabel: "Ready to cook",
  },
];
