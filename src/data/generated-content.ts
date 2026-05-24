import fallbackHabitatData from "../../generated/fish-by-habitat/coralline-crusts-in-surge-gullies-and-scoured-infralittoral-rock.json";

import type { InventoryFishDefinition } from "../features/inventory";
import type { RecipeBookRecipe } from "../features/shop";

interface HabitatFishRecord {
  commonName: string;
  scientificName: string;
  family: string | null;
  order: string | null;
  aphiaId: string | number | null;
  marlinSpeciesId: string | number | null;
  marlinUrl: string | null;
  fishBaseSummaryUrl: string | null;
  fishBaseEnvironment: string | null;
  fishBaseEcology: string | null;
  sizeCategory: string | null;
  averageDepthMeters: number | null;
  fishBaseCommonLengthCm: number | null;
  wormsDistributionCount: number | null;
  wormsDistributionSummary: string[];
  habitatFitPercent: number | null;
  likelyCatchPercent: number;
  observedSpeciesRecordPercent: number | null;
  fishingActivityAssociatedPercent: number | null;
}

interface HabitatDataFile {
  habitat: {
    habitatInformationName: string;
    inferredDepthZone: string | null;
    inferredSubstratum: string[] | null;
  };
  fish: HabitatFishRecord[];
}

export interface MasterRecipeFile {
  fishRecipes: MasterRecipeFishEntry[];
}

interface MasterRecipeFishEntry {
  fish: {
    commonName: string;
    scientificName: string | null;
    likelyCatchPercent: number | null;
    observedSpeciesRecordPercent: number | null;
    fishingActivityAssociatedPercent: number | null;
    sizeCategory: string | null;
    averageDepthMeters: number | null;
  };
  recipes: RecipeRecord[];
}

interface RecipeRecord {
  recipeId: string;
  title: string;
  sourceUrl: string | null;
  image: string | null;
  readyInMinutes: number | null;
  servings: number | null;
  popularityScore: number | null;
  requiredFishIngredients: Array<{
    name: string;
    amount: number | null;
    unit: string | null;
    original: string;
  }>;
  fishUsed: {
    commonName: string;
    scientificName: string | null;
    ingredientMatched: string | null;
    quantityWholeFish: number | null;
    rawAmount: number | null;
    rawUnit: string | null;
  };
  rarity: string;
  estimatedPrice: {
    currency: string;
    total: number | null;
    basePriceFromApi: number | null;
  };
  nutrition: {
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbohydrates: number | null;
    sodium: number | null;
    servingSize: number | null;
    servingUnit: string | null;
  };
  recipe: {
    summary: string | null;
    dishTypes: string[];
    cuisines: string[];
    diets: string[];
    instructions: string | null;
    ingredients: Array<{
      name: string;
      amount: number | null;
      unit: string | null;
      original: string;
      isRequiredFishIngredient: boolean;
    }>;
  };
}

const fallbackHabitat = fallbackHabitatData as HabitatDataFile;
const EMPTY_MASTER_RECIPES: MasterRecipeFile = {
  fishRecipes: [],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createVisualToken(commonName: string): string {
  const initials = commonName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || commonName.slice(0, 3).toUpperCase();
}

function inferRarity(likelyCatchPercent: number): InventoryFishDefinition["rarity"] {
  if (likelyCatchPercent >= 9.5) {
    return "Common";
  }

  if (likelyCatchPercent >= 8.25) {
    return "Uncommon";
  }

  if (likelyCatchPercent >= 7) {
    return "Rare";
  }

  return "Legendary";
}

function inferValue(likelyCatchPercent: number, averageDepthMeters: number | null): number {
  const scarcityMultiplier = Math.max(1.15, 14 / Math.max(likelyCatchPercent, 1));
  const depthBonus = averageDepthMeters ? Math.min(averageDepthMeters / 12, 9) : 0;
  return Number((8 + scarcityMultiplier * 3.2 + depthBonus).toFixed(2));
}

function normalizeFishName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function mapHabitatFishToInventoryFish(record: HabitatFishRecord): InventoryFishDefinition {
  return {
    id: slugify(record.commonName),
    name: record.commonName,
    scientificName: record.scientificName,
    region: fallbackHabitat.habitat.habitatInformationName,
    rarity: inferRarity(record.likelyCatchPercent),
    value: inferValue(record.likelyCatchPercent, record.averageDepthMeters),
    placeholderVisual: createVisualToken(record.commonName),
    family: record.family,
    order: record.order,
    aphiaId: record.aphiaId === null ? null : String(record.aphiaId),
    marlinSpeciesId: record.marlinSpeciesId === null ? null : String(record.marlinSpeciesId),
    marlinUrl: record.marlinUrl,
    fishBaseSummaryUrl: record.fishBaseSummaryUrl,
    fishBaseEnvironment: record.fishBaseEnvironment,
    fishBaseEcology: record.fishBaseEcology,
    sizeCategory: record.sizeCategory,
    averageDepthMeters: record.averageDepthMeters,
    fishBaseCommonLengthCm: record.fishBaseCommonLengthCm,
    wormsDistributionCount: record.wormsDistributionCount,
    wormsDistributionSummary: record.wormsDistributionSummary,
    habitatFitPercent: record.habitatFitPercent,
    likelyCatchPercent: record.likelyCatchPercent,
    observedSpeciesRecordPercent: record.observedSpeciesRecordPercent,
    fishingActivityAssociatedPercent: record.fishingActivityAssociatedPercent,
    habitatName: fallbackHabitat.habitat.habitatInformationName,
    habitatDepthZone: fallbackHabitat.habitat.inferredDepthZone,
    habitatSubstratum: fallbackHabitat.habitat.inferredSubstratum ?? [],
  };
}

const fallbackHabitatFishCatalog = fallbackHabitat.fish.map(mapHabitatFishToInventoryFish);

const weightedCatchPool = fallbackHabitatFishCatalog.map((fish) => ({
  fish,
  weight: Math.max(fish.likelyCatchPercent, 0.1),
}));

function sumRequiredFishQuantity(recipe: RecipeRecord): number {
  const explicitQuantity = recipe.fishUsed.quantityWholeFish;
  if (typeof explicitQuantity === "number" && Number.isFinite(explicitQuantity) && explicitQuantity > 0) {
    return Math.max(1, Math.round(explicitQuantity));
  }

  const ingredientQuantity = recipe.requiredFishIngredients.reduce((total, ingredient) => {
    const amount = ingredient.amount ?? 0;
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  return Math.max(1, Math.round(ingredientQuantity || 1));
}

function mapRecipeRecordToRecipeBookRecipe(entry: MasterRecipeFishEntry, recipe: RecipeRecord): RecipeBookRecipe {
  const requiredQuantity = sumRequiredFishQuantity(recipe);

  return {
    id: String(recipe.recipeId),
    name: recipe.title,
    subtitle: `${entry.fish.commonName} x${requiredQuantity} • ${recipe.rarity}`,
    cookTimeMinutes: recipe.readyInMinutes ?? 0,
    requiredFishName: entry.fish.commonName,
    requiredFishScientificName: entry.fish.scientificName,
    requiredFishQuantity: requiredQuantity,
    rarity: recipe.rarity,
    estimatedPrice: recipe.estimatedPrice.total,
    calories: recipe.nutrition.calories,
    instructions: recipe.recipe.instructions,
    isCraftable: true,
    missingRequiredFishCount: 0,
    availabilityLabel: "Ready to cook",
  };
}

export function getFallbackHabitatFishCatalog(): InventoryFishDefinition[] {
  return fallbackHabitatFishCatalog.map((fish) => ({ ...fish }));
}

export function getFallbackHabitatName(): string {
  return fallbackHabitat.habitat.habitatInformationName;
}

export function getFallbackHabitatJsonPath(): string {
  return "generated/fish-by-habitat/coralline-crusts-in-surge-gullies-and-scoured-infralittoral-rock.json";
}

export function getDefaultMasterRecipes(): MasterRecipeFile {
  return structuredClone(EMPTY_MASTER_RECIPES);
}

export function rollRandomCatchFromFallbackHabitat(): InventoryFishDefinition {
  const totalWeight = weightedCatchPool.reduce((sum, entry) => sum + entry.weight, 0);
  let target = Math.random() * totalWeight;

  for (const entry of weightedCatchPool) {
    target -= entry.weight;
    if (target <= 0) {
      return { ...entry.fish };
    }
  }

  return { ...weightedCatchPool[weightedCatchPool.length - 1].fish };
}

export function getCraftableRecipesForInventory(
  inventoryFish: InventoryFishDefinition[],
  discoveredFish: InventoryFishDefinition[],
  recipeSource: MasterRecipeFile = EMPTY_MASTER_RECIPES,
): RecipeBookRecipe[] {
  const inventoryCounts = new Map<string, number>();
  const discoveredKeys = new Set<string>();

  for (const fish of inventoryFish) {
    const keys = [normalizeFishName(fish.name), normalizeFishName(fish.scientificName)];
    for (const key of keys) {
      if (!key) {
        continue;
      }

      inventoryCounts.set(key, (inventoryCounts.get(key) ?? 0) + 1);
    }
  }

  for (const fish of discoveredFish) {
    const keys = [normalizeFishName(fish.name), normalizeFishName(fish.scientificName)];
    for (const key of keys) {
      if (key) {
        discoveredKeys.add(key);
      }
    }
  }

  const visibleRecipes: RecipeBookRecipe[] = [];

  for (const fishEntry of recipeSource.fishRecipes) {
    const possibleKeys = [
      normalizeFishName(fishEntry.fish.commonName),
      normalizeFishName(fishEntry.fish.scientificName),
    ].filter(Boolean);

    const isDiscovered = possibleKeys.some((key) => discoveredKeys.has(key));
    if (!isDiscovered) {
      continue;
    }

    for (const recipe of fishEntry.recipes) {
      const requiredQuantity = sumRequiredFishQuantity(recipe);
      const availableCount = possibleKeys.reduce((maxCount, key) => Math.max(maxCount, inventoryCounts.get(key) ?? 0), 0);
      const mappedRecipe = mapRecipeRecordToRecipeBookRecipe(fishEntry, recipe);
      const missingRequiredFishCount = Math.max(0, requiredQuantity - availableCount);

      mappedRecipe.isCraftable = missingRequiredFishCount === 0;
      mappedRecipe.missingRequiredFishCount = missingRequiredFishCount;
      mappedRecipe.availabilityLabel =
        missingRequiredFishCount === 0
          ? "Ready to cook"
          : `Need ${missingRequiredFishCount} more ${fishEntry.fish.commonName}`;

      visibleRecipes.push(mappedRecipe);
    }
  }

  return visibleRecipes.sort((left, right) => {
    if (left.isCraftable !== right.isCraftable) {
      return left.isCraftable ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}
