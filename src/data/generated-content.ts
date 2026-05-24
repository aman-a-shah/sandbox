import fallbackHabitatData from "../../generated/fish-by-habitat/coralline-crusts-in-surge-gullies-and-scoured-infralittoral-rock.json";

import type { InventoryFishDefinition, InventoryFoodDefinition } from "../features/inventory";
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
    habitatId?: string | number | null;
    habitatInformationName: string;
    inferredDepthZone: string | null;
    inferredSubstratum: string[] | null;
  };
  fish: HabitatFishRecord[];
}

interface HabitatCatchProfile {
  definition: OceanHabitatDefinition;
  fishCatalog: InventoryFishDefinition[];
  weightedCatchPool: Array<{
    fish: InventoryFishDefinition;
    weight: number;
  }>;
}

export interface OceanHabitatDefinition {
  id: string;
  name: string;
  jsonPath: string;
  depthZone: string | null;
  substratum: string[];
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
    fishBaseCommonLengthCm?: number | null;
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

const EMPTY_MASTER_RECIPES: MasterRecipeFile = {
  fishRecipes: [],
};

const LEGACY_FALLBACK_JSON_PATH = "generated/fish-by-habitat/coralline-crusts-in-surge-gullies-and-scoured-infralittoral-rock.json";
const BASELINE_FISH_PRICE = 15.5;
const BASELINE_CATCH_PERCENT = 13.5;

const habitatDataModules = import.meta.glob("../../generated/fish-by-habitat/*.json", {
  eager: true,
}) as Record<string, { default: HabitatDataFile }>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(value: string | null | undefined): string {
  return (value ?? "").replace(/\b([a-z])/g, (match) => match.toUpperCase());
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
  if (likelyCatchPercent >= 18) {
    return "Common";
  }

  if (likelyCatchPercent >= 9) {
    return "Uncommon";
  }

  if (likelyCatchPercent >= 4) {
    return "Rare";
  }

  return "Legendary";
}

function inferLengthFromSizeCategory(sizeCategory: string | null): number {
  const normalized = (sizeCategory ?? "").toLowerCase();
  if (normalized.includes("small-medium")) {
    return 7;
  }
  if (normalized.includes("medium-large")) {
    return 30;
  }
  if (normalized.includes("large")) {
    return 60;
  }
  if (normalized.includes("medium")) {
    return 15;
  }
  return 15;
}

function inferFishUnitPrice(
  likelyCatchPercent: number,
  fishBaseCommonLengthCm: number | null,
  sizeCategory: string | null,
): number {
  const effectiveLengthCm = fishBaseCommonLengthCm ?? inferLengthFromSizeCategory(sizeCategory);
  const scarcityFactor = Math.min(
    2.8,
    Math.max(0.7, Math.pow(BASELINE_CATCH_PERCENT / Math.max(likelyCatchPercent, 0.5), 0.6)),
  );
  const sizeFactor = Math.min(2.4, Math.max(0.75, 1 + (effectiveLengthCm - 15) / 90));
  return Number((BASELINE_FISH_PRICE * scarcityFactor * sizeFactor).toFixed(2));
}

function inferValue(
  likelyCatchPercent: number,
  fishBaseCommonLengthCm: number | null,
  sizeCategory: string | null,
): number {
  return inferFishUnitPrice(likelyCatchPercent, fishBaseCommonLengthCm, sizeCategory);
}

function normalizeFishName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeHabitatId(rawId: string | number | null | undefined, habitatName: string): string {
  const normalized = rawId === null || rawId === undefined ? "" : String(rawId).trim();
  if (normalized) {
    return normalized;
  }

  return slugify(habitatName);
}

function toPublicJsonPath(modulePath: string): string {
  const unixPath = modulePath.replace(/\\/g, "/");
  const marker = "/generated/";
  const markerIndex = unixPath.lastIndexOf(marker);
  if (markerIndex >= 0) {
    return unixPath.slice(markerIndex + 1);
  }

  return unixPath.replace(/^(\.\.\/)+/, "");
}

function replaceFishDisplayName(text: string | null | undefined, rawFishName: string, displayFishName: string): string | null {
  if (!text) {
    return text ?? null;
  }

  const escapedRawFishName = rawFishName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escapedRawFishName, "gi"), displayFishName);
}

function mapHabitatFishToInventoryFish(
  record: HabitatFishRecord,
  habitat: HabitatDataFile["habitat"],
): InventoryFishDefinition {
  const displayName = toTitleCase(record.commonName);
  const habitatName = habitat.habitatInformationName;
  return {
    kind: "fish",
    id: slugify(record.commonName),
    name: displayName,
    scientificName: record.scientificName,
    region: habitatName,
    rarity: inferRarity(record.likelyCatchPercent),
    value: inferValue(record.likelyCatchPercent, record.fishBaseCommonLengthCm, record.sizeCategory),
    placeholderVisual: createVisualToken(displayName),
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
    habitatName,
    habitatDepthZone: habitat.inferredDepthZone,
    habitatSubstratum: habitat.inferredSubstratum ?? [],
  };
}

function createFoodVisualToken(recipeName: string): string {
  const initials = recipeName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || "FOOD";
}

function buildHabitatCatchProfile(modulePath: string, habitatData: HabitatDataFile): HabitatCatchProfile {
  const definition: OceanHabitatDefinition = {
    id: normalizeHabitatId(habitatData.habitat.habitatId, habitatData.habitat.habitatInformationName),
    name: habitatData.habitat.habitatInformationName,
    jsonPath: toPublicJsonPath(modulePath),
    depthZone: habitatData.habitat.inferredDepthZone,
    substratum: [...(habitatData.habitat.inferredSubstratum ?? [])],
  };

  const fishCatalog = habitatData.fish.map((fish) => mapHabitatFishToInventoryFish(fish, habitatData.habitat));
  const weightedCatchPool = fishCatalog.map((fish) => ({
    fish,
    weight: Math.max(fish.likelyCatchPercent, 0.1),
  }));

  return {
    definition,
    fishCatalog,
    weightedCatchPool,
  };
}

function collectHabitatCatchProfiles(): HabitatCatchProfile[] {
  const profiles = Object.entries(habitatDataModules)
    .map(([modulePath, module]) => buildHabitatCatchProfile(modulePath, module.default))
    .filter((profile) => profile.fishCatalog.length > 0);

  if (profiles.length > 0) {
    return profiles;
  }

  return [buildHabitatCatchProfile(LEGACY_FALLBACK_JSON_PATH, fallbackHabitatData as HabitatDataFile)];
}

const unsortedHabitatProfiles = collectHabitatCatchProfiles();
const uniqueHabitatProfilesById = new Map<string, HabitatCatchProfile>();
for (const profile of unsortedHabitatProfiles) {
  if (!uniqueHabitatProfilesById.has(profile.definition.id)) {
    uniqueHabitatProfilesById.set(profile.definition.id, profile);
  }
}

const habitatProfiles = [...uniqueHabitatProfilesById.values()].sort((left, right) =>
  left.definition.name.localeCompare(right.definition.name),
);

const defaultHabitatProfile =
  habitatProfiles.find((profile) => profile.definition.jsonPath === LEGACY_FALLBACK_JSON_PATH) ?? habitatProfiles[0];

const habitatProfilesById = new Map(habitatProfiles.map((profile) => [profile.definition.id, profile]));

function resolveHabitatProfile(habitatId: string | null | undefined): HabitatCatchProfile {
  const normalizedHabitatId = habitatId?.trim();
  if (normalizedHabitatId) {
    const profile = habitatProfilesById.get(normalizedHabitatId);
    if (profile) {
      return profile;
    }
  }

  return defaultHabitatProfile;
}

function rollRandomCatchFromPool(profile: HabitatCatchProfile): InventoryFishDefinition {
  const totalWeight = profile.weightedCatchPool.reduce((sum, entry) => sum + entry.weight, 0);
  let target = Math.random() * totalWeight;

  for (const entry of profile.weightedCatchPool) {
    target -= entry.weight;
    if (target <= 0) {
      return { ...entry.fish };
    }
  }

  return { ...profile.weightedCatchPool[profile.weightedCatchPool.length - 1].fish };
}

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

function buildNutritionLines(recipe: RecipeRecord): string[] {
  const entries: string[] = [];
  if (recipe.nutrition.calories !== null) entries.push(`Calories: ${recipe.nutrition.calories}`);
  if (recipe.nutrition.protein !== null) entries.push(`Protein: ${recipe.nutrition.protein} g`);
  if (recipe.nutrition.fat !== null) entries.push(`Fat: ${recipe.nutrition.fat} g`);
  if (recipe.nutrition.carbohydrates !== null) entries.push(`Carbs: ${recipe.nutrition.carbohydrates} g`);
  if (recipe.nutrition.sodium !== null) entries.push(`Sodium: ${recipe.nutrition.sodium} mg`);
  if (recipe.nutrition.servingSize !== null && recipe.nutrition.servingUnit) {
    entries.push(`Serving Size: ${recipe.nutrition.servingSize} ${recipe.nutrition.servingUnit}`);
  }
  return entries;
}

function buildDisplayIngredients(recipe: RecipeRecord, rawFishName: string, displayFishName: string): RecipeBookRecipe["ingredients"] {
  const required = recipe.recipe.ingredients
    .filter((ingredient) => ingredient.isRequiredFishIngredient)
    .map((ingredient) => ({
      text: replaceFishDisplayName(ingredient.original || ingredient.name, rawFishName, displayFishName) ?? displayFishName,
      isRequiredFishIngredient: true,
    }));

  const remaining = recipe.recipe.ingredients
    .filter((ingredient) => !ingredient.isRequiredFishIngredient)
    .map((ingredient) => ({
      text: replaceFishDisplayName(ingredient.original || ingredient.name, rawFishName, displayFishName) ?? ingredient.name,
      isRequiredFishIngredient: false,
    }));

  return [...required, ...remaining];
}

function mapRecipeRecordToRecipeBookRecipe(entry: MasterRecipeFishEntry, recipe: RecipeRecord): RecipeBookRecipe {
  const rawFishName = entry.fish.commonName;
  const displayFishName = toTitleCase(rawFishName);
  const requiredQuantity = sumRequiredFishQuantity(recipe);

  return {
    id: String(recipe.recipeId),
    name: replaceFishDisplayName(recipe.title, rawFishName, displayFishName) ?? recipe.title,
    cookTimeMinutes: recipe.readyInMinutes ?? 0,
    requiredFishName: displayFishName,
    requiredFishScientificName: entry.fish.scientificName,
    currentFishQuantity: 0,
    requiredFishQuantity: requiredQuantity,
    rarity: recipe.rarity,
    estimatedPrice: recipe.estimatedPrice.total,
    calories: recipe.nutrition.calories,
    instructions: replaceFishDisplayName(recipe.recipe.instructions, rawFishName, displayFishName),
    isCraftable: true,
    missingRequiredFishCount: 0,
    availabilityLabel: "Ready to cook",
    summary: replaceFishDisplayName(recipe.recipe.summary, rawFishName, displayFishName),
    dishTypes: recipe.recipe.dishTypes,
    cuisines: recipe.recipe.cuisines,
    diets: recipe.recipe.diets,
    servingsLabel: recipe.servings === null ? "Servings: Unknown" : `Servings: ${recipe.servings}`,
    nutritionLines: buildNutritionLines(recipe),
    ingredients: buildDisplayIngredients(recipe, rawFishName, displayFishName),
  };
}

export function getOceanHabitats(): OceanHabitatDefinition[] {
  return habitatProfiles.map((profile) => ({
    ...profile.definition,
    substratum: [...profile.definition.substratum],
  }));
}

export function getDefaultHabitatId(): string {
  return defaultHabitatProfile.definition.id;
}

export function getHabitatNameById(habitatId: string | null | undefined): string {
  return resolveHabitatProfile(habitatId).definition.name;
}

export function getHabitatJsonPathById(habitatId: string | null | undefined): string {
  return resolveHabitatProfile(habitatId).definition.jsonPath;
}

export function rollRandomCatchForHabitat(habitatId: string | null | undefined): InventoryFishDefinition {
  return rollRandomCatchFromPool(resolveHabitatProfile(habitatId));
}

export function getFallbackHabitatFishCatalog(): InventoryFishDefinition[] {
  return resolveHabitatProfile(null).fishCatalog.map((fish) => ({ ...fish }));
}

export function getFallbackHabitatName(): string {
  return getHabitatNameById(null);
}

export function getFallbackHabitatJsonPath(): string {
  return getHabitatJsonPathById(null);
}

export function getDefaultMasterRecipes(): MasterRecipeFile {
  return structuredClone(EMPTY_MASTER_RECIPES);
}

export function createCookedFoodFromRecipe(recipe: RecipeBookRecipe): InventoryFoodDefinition {
  const rarity =
    recipe.rarity === "Legendary" || recipe.rarity === "Rare" || recipe.rarity === "Uncommon" || recipe.rarity === "Common"
      ? recipe.rarity
      : "Common";

  return {
    kind: "food",
    id: `food-${slugify(recipe.id)}-${slugify(recipe.name)}`,
    recipeId: recipe.id,
    name: recipe.name,
    rarity,
    value: Number((recipe.estimatedPrice ?? 10).toFixed(2)),
    placeholderVisual: createFoodVisualToken(recipe.name),
    requiredFishName: recipe.requiredFishName,
    servingsLabel: recipe.servingsLabel,
    cookTimeMinutes: recipe.cookTimeMinutes,
    calories: recipe.calories,
    summary: recipe.summary,
  };
}

export function rollRandomCatchFromFallbackHabitat(): InventoryFishDefinition {
  return rollRandomCatchForHabitat(null);
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
      normalizeFishName(toTitleCase(fishEntry.fish.commonName)),
      normalizeFishName(fishEntry.fish.scientificName),
      normalizeFishName(fishEntry.fish.commonName),
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

      mappedRecipe.currentFishQuantity = availableCount;
      mappedRecipe.isCraftable = missingRequiredFishCount === 0;
      mappedRecipe.missingRequiredFishCount = missingRequiredFishCount;
      mappedRecipe.availabilityLabel =
        missingRequiredFishCount === 0
          ? "Ready to cook"
          : `Need ${missingRequiredFishCount} more ${mappedRecipe.requiredFishName}`;

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
