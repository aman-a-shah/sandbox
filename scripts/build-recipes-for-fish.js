import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "..", "generated", "recipes-by-fish");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "recipes.json");
const BULK_REQUEST_DELAY_MS = 1200;


const COMMON_FISH_ALIAS_MAP = {
  "atlantic salmon": ["salmon", "salmon fillet", "salmon filet"],
  salmon: ["salmon", "salmon fillet", "salmon filet"],
  "common sole": ["sole", "sole fillet"],
  sole: ["sole", "sole fillet"],
  "atlantic cod": ["cod", "cod fillet"],
  cod: ["cod", "cod fillet"],
  "atlantic herring": ["herring"],
  herring: ["herring"],
  "atlantic mackerel": ["mackerel"],
  mackerel: ["mackerel"],
  "common dragonet": ["dragonet"],
  "common goby": ["goby"],
  "sand goby": ["goby"],
  bib: ["bib", "pout"],
  cepelan: ["poor cod", "cepelan"],
  seahorse: ["seahorse"],
  "blue skate": ["skate", "ray"],
};

const MASS_UNIT_TO_GRAMS = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

const BASELINE_FISH_PRICE = 15.5;
const BASELINE_CATCH_PERCENT = 13.5;

const loadDotEnv = async () => {
  const envPath = path.resolve(__dirname, "..", ".env");

  try {
    const contents = await fs.readFile(envPath, "utf8");
    contents.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const resolveSpoonacularConfig = () => {
  const rapidApiHost = process.env["RECIPE-API-HOST"] || "";
  const explicitBaseUrl = process.env["SPOONACULAR_BASE_URL"] || "";
  const apiKey = process.env["SPOONACULAR_API_KEY"] || process.env["RECIPE-API-KEY"] || "";
  const baseUrl = explicitBaseUrl.trim() || (rapidApiHost ? `https://${rapidApiHost}` : "https://api.spoonacular.com");

  if (!apiKey) {
    throw new Error("Spoonacular API key is not configured.");
  }

  return { apiKey, rapidApiHost, baseUrl };
};

const createSpoonacularHeaders = () => {
  const config = resolveSpoonacularConfig();
  if (config.rapidApiHost) {
    return {
      Accept: "application/json",
      "X-RapidAPI-Key": config.apiKey,
      "X-RapidAPI-Host": config.rapidApiHost,
    };
  }

  return {
    Accept: "application/json",
    "x-api-key": config.apiKey,
  };
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status} ${response.statusText}) for ${url}: ${body}`);
  }

  return response.json();
};

const searchRecipes = async ({
  query,
  includeIngredients,
  excludeIngredients,
  cuisine,
  diet,
  type,
  sort,
  instructionsRequired,
  number = 10,
  addRecipeInformation = true,
  addRecipeNutrition = true,
} = {}) => {
  const { baseUrl } = resolveSpoonacularConfig();
  const url = `${baseUrl}/recipes/complexSearch${buildQueryString({
    query,
    includeIngredients: includeIngredients?.join(","),
    excludeIngredients: excludeIngredients?.join(","),
    cuisine,
    diet,
    type,
    sort,
    instructionsRequired,
    number,
    addRecipeInformation,
    addRecipeNutrition,
  })}`;

  return requestJson(url, {
    headers: createSpoonacularHeaders(),
  });
};

const getBulkRecipeInformation = async (recipeIds, { includeNutrition = true } = {}) => {
  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    throw new Error("getBulkRecipeInformation requires a non-empty recipeIds array.");
  }

  const { baseUrl } = resolveSpoonacularConfig();
  const url = `${baseUrl}/recipes/informationBulk${buildQueryString({
    ids: recipeIds.join(","),
    includeNutrition,
  })}`;

  return requestJson(url, {
    headers: createSpoonacularHeaders(),
  });
};

const loadFishRecord = async (jsonPath, fishQuery) => {
  const contents = await fs.readFile(jsonPath, "utf8");
  const data = JSON.parse(contents);

  if (!Array.isArray(data.fish)) {
    throw new Error("Input JSON does not contain a fish array.");
  }

  const normalizedQuery = (fishQuery || "").trim().toLowerCase();
  const fish = data.fish.find((entry) => entry.commonName?.toLowerCase() === normalizedQuery || entry.scientificName?.toLowerCase() === normalizedQuery);

  if (!fish) {
    throw new Error(`No fish found in ${jsonPath} for query "${fishQuery}".`);
  }

  return fish;
};

const buildAliases = (fish) => {
  const aliases = new Set();
  const commonName = (fish.commonName || "").toLowerCase();
  const scientificName = (fish.scientificName || "").toLowerCase();

  if (commonName) aliases.add(commonName);
  if (scientificName) aliases.add(scientificName);

  commonName
    .split(/[^a-z]+/)
    .filter((token) => token.length > 3 && !["common", "atlantic", "european"].includes(token))
    .forEach((token) => aliases.add(token));

  (COMMON_FISH_ALIAS_MAP[commonName] || []).forEach((alias) => aliases.add(alias));

  return [...aliases];
};

const matchesTargetFish = (ingredient, aliases) => {
  const text = `${ingredient.name || ""} ${ingredient.original || ""}`.toLowerCase();
  return aliases.some((alias) => text.includes(alias));
};

const inferWholeFishCount = (ingredient, fish) => {
  const unit = (ingredient.unit || ingredient.unitShort || "").toLowerCase();
  const amount = Number(ingredient.amount) || 0;
  const commonLength = Number(fish.fishBaseCommonLengthCm) || 30;

  if (["whole", "fish", "fishes", "fillet", "fillets"].includes(unit)) {
    return Math.max(1, Math.round(amount));
  }

  if (MASS_UNIT_TO_GRAMS[unit]) {
    const grams = amount * MASS_UNIT_TO_GRAMS[unit];
    const estimatedWholeFishMassGrams = Math.max(180, commonLength * 18);
    return Math.max(1, Math.round(grams / estimatedWholeFishMassGrams));
  }

  if (amount > 0) {
    return Math.max(1, Math.round(amount));
  }

  return 1;
};

const normalizeNutrition = (nutrition) => {
  const nutrients = Array.isArray(nutrition?.nutrients) ? nutrition.nutrients : [];
  const pick = (name) => nutrients.find((entry) => entry.name?.toLowerCase() === name.toLowerCase()) || null;

  return {
    calories: pick("Calories")?.amount || null,
    protein: pick("Protein")?.amount || null,
    fat: pick("Fat")?.amount || null,
    carbohydrates: pick("Carbohydrates")?.amount || null,
    sodium: pick("Sodium")?.amount || null,
    servingSize: nutrition?.weightPerServing?.amount || null,
    servingUnit: nutrition?.weightPerServing?.unit || null,
  };
};

const inferLengthFromSizeCategory = (sizeCategory) => {
  const normalized = (sizeCategory || "").toLowerCase();
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
};

const inferFishUnitPrice = (fish) => {
  const likelyCatchPercent = Math.max(Number(fish.likelyCatchPercent) || BASELINE_CATCH_PERCENT, 0.5);
  const commonLengthCm = Number(fish.fishBaseCommonLengthCm);
  const effectiveLengthCm = Number.isFinite(commonLengthCm) && commonLengthCm > 0 ? commonLengthCm : inferLengthFromSizeCategory(fish.sizeCategory);
  const scarcityFactor = Math.min(2.8, Math.max(0.7, Math.pow(BASELINE_CATCH_PERCENT / likelyCatchPercent, 0.6)));
  const sizeFactor = Math.min(2.4, Math.max(0.75, 1 + (effectiveLengthCm - 15) / 90));
  return Number((BASELINE_FISH_PRICE * scarcityFactor * sizeFactor).toFixed(2));
};

const computeRecipeRarity = (fish, quantityWholeFish) => {
  const catchWeight = Number(fish.likelyCatchPercent) || 1;
  const scarcity = Math.max(1, 100 - catchWeight);
  const weighted = scarcity + quantityWholeFish * 6;

  if (weighted >= 95) return "legendary";
  if (weighted >= 80) return "rare";
  if (weighted >= 60) return "uncommon";
  return "common";
};

const computeRecipePrice = (fish, recipe, quantityWholeFish) => {
  const combinedFishCost = inferFishUnitPrice(fish) * Math.max(1, quantityWholeFish);
  const basePriceFromApi = Number((((recipe.pricePerServing || 0) / 100) * (recipe.servings || 1)).toFixed(2));
  return {
    total: Number((combinedFishCost + basePriceFromApi).toFixed(2)),
    basePriceFromApi,
  };
};

const pickFallbackCategory = (fish) => {
  const name = (fish.commonName || "").toLowerCase();
  const family = (fish.family || "").toLowerCase();

  if (name.includes("sole") || name.includes("plaice") || name.includes("flounder") || family.includes("pleuronect")) {
    return "delicate";
  }

  if (name.includes("salmon") || name.includes("mackerel") || name.includes("herring") || name.includes("sard") || name.includes("tuna")) {
    return "oily";
  }

  if (name.includes("cod") || name.includes("poll") || name.includes("whiting") || name.includes("hake") || family.includes("gadidae")) {
    return "white";
  }

  return "generic";
};

const seededIndex = (seed, length) => [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % length;

const makeFallbackRecipe = (fish) => {
  const category = pickFallbackCategory(fish);
  const templates = FALLBACK_RECIPE_TEMPLATES[category] || FALLBACK_RECIPE_TEMPLATES.generic;
  const template = templates[seededIndex(fish.scientificName || fish.commonName || "fish", templates.length)];
  const fishLabel = fish.commonName || fish.scientificName || "fish";
  const quantityWholeFish = 2;
  const total = Number((inferFishUnitPrice(fish) * quantityWholeFish + template.basePrice).toFixed(2));

  return {
    requiredFishIngredients: [{ name: fishLabel, amount: quantityWholeFish, unit: "fish", original: `${quantityWholeFish} ${fishLabel}` }],
    recipeId: `fallback-${slugify(fishLabel)}`,
    title: template.title.replaceAll("{fish}", fishLabel),
    sourceUrl: null,
    image: null,
    readyInMinutes: template.readyInMinutes,
    servings: template.servings,
    popularityScore: null,
    fishUsed: {
      commonName: fish.commonName,
      scientificName: fish.scientificName,
      ingredientMatched: fishLabel,
      quantityWholeFish,
      rawAmount: quantityWholeFish,
      rawUnit: "fish",
    },
    rarity: computeRecipeRarity(fish, quantityWholeFish),
    estimatedPrice: { currency: "USD", total, basePriceFromApi: template.basePrice },
    nutrition: { ...template.nutrition, servingSize: null, servingUnit: null },
    recipe: {
      summary: `Fallback generated recipe for ${fishLabel} because Spoonacular did not return a matching result.`,
      dishTypes: template.dishTypes,
      cuisines: template.cuisines,
      diets: template.diets,
      instructions: template.instructions.replaceAll("{fish}", fishLabel),
      ingredients: template.ingredients.map((item, index) => {
        const rendered = item.replaceAll("{fish}", fishLabel);
        return {
          name: rendered,
          amount: index === 0 ? quantityWholeFish : null,
          unit: index === 0 ? "fish" : null,
          original: rendered,
          isRequiredFishIngredient: index === 0,
        };
      }),
    },
  };
};

const simplifyRecipe = (fish, recipe, targetIngredient, quantityWholeFish) => {
  const computedPrice = computeRecipePrice(fish, recipe, quantityWholeFish);

  return {
  requiredFishIngredients: (recipe.extendedIngredients || [])
    .filter((ingredient) => matchesTargetFish(ingredient, buildAliases(fish)))
    .map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit || ingredient.unitShort || null,
      original: ingredient.original || null,
    })),
  recipeId: recipe.id,
  title: recipe.title,
  sourceUrl: recipe.sourceUrl || recipe.spoonacularSourceUrl || null,
  image: recipe.image || null,
  readyInMinutes: recipe.readyInMinutes || null,
  servings: recipe.servings || null,
  popularityScore: recipe.spoonacularScore || recipe.healthScore || null,
  fishUsed: {
    commonName: fish.commonName,
    scientificName: fish.scientificName,
    ingredientMatched: targetIngredient.name || targetIngredient.originalName || targetIngredient.original || null,
    quantityWholeFish,
    rawAmount: targetIngredient.amount || null,
    rawUnit: targetIngredient.unit || targetIngredient.unitShort || null,
  },
  rarity: computeRecipeRarity(fish, quantityWholeFish),
  estimatedPrice: {
    currency: "USD",
    total: computedPrice.total,
    basePriceFromApi: computedPrice.basePriceFromApi,
  },
  nutrition: normalizeNutrition(recipe.nutrition),
  recipe: {
    summary: recipe.summary || null,
    dishTypes: recipe.dishTypes || [],
    cuisines: recipe.cuisines || [],
    diets: recipe.diets || [],
    instructions: recipe.instructions || null,
    ingredients: (recipe.extendedIngredients || []).map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit || ingredient.unitShort || null,
      original: ingredient.original || null,
      isRequiredFishIngredient: matchesTargetFish(ingredient, buildAliases(fish)),
    })),
  },
};
};

const isValidRecipeForFish = (recipe, aliases) => {
  const ingredients = Array.isArray(recipe.extendedIngredients) ? recipe.extendedIngredients : [];
  const targetMatches = ingredients.filter((ingredient) => matchesTargetFish(ingredient, aliases));
  if (targetMatches.length < 1) {
    return { valid: false };
  }

  return { valid: true, targetIngredient: targetMatches[0] };
};

const uniqueByTitle = (recipes) => {
  const seen = new Set();
  return recipes.filter((recipe) => {
    const key = (recipe.title || "").trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadExistingMasterRecipes = async () => {
  try {
    const contents = await fs.readFile(OUTPUT_PATH, "utf8");
    return JSON.parse(contents);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
};

const findExistingFishEntry = (masterOutput, fish) => {
  const entries = Array.isArray(masterOutput?.fishRecipes) ? masterOutput.fishRecipes : [];
  return entries.find((entry) => entry.fish?.commonName === fish.commonName && entry.fish?.scientificName === fish.scientificName) || null;
};

const buildFishEntry = (fish, recipes, quotaStrategy) => ({
  fish: {
    commonName: fish.commonName,
    scientificName: fish.scientificName,
    likelyCatchPercent: fish.likelyCatchPercent,
    observedSpeciesRecordPercent: fish.observedSpeciesRecordPercent,
    fishingActivityAssociatedPercent: fish.fishingActivityAssociatedPercent,
    sizeCategory: fish.sizeCategory || null,
    fishBaseCommonLengthCm: fish.fishBaseCommonLengthCm || null,
    averageDepthMeters: fish.averageDepthMeters || null,
  },
  notes: {
    quotaStrategy,
    filtering: "Recipes are kept when the target fish appears in the ingredient list, even if other seafood ingredients are also present.",
    pricing: "Estimated price is the combined value of the fish used plus Spoonacular basePriceFromApi.",
    quantityInference: "Whole-fish quantity uses explicit units when available, otherwise mass is inferred from ingredient amount and fish length.",
    fallback: "If Spoonacular returns no recipes, a generated fallback fish recipe is used instead.",
  },
  recipeCount: recipes.length,
  recipes,
});

const mergeRecipeOutputs = (existingOutput, nextOutput) => {
  const existingEntries = Array.isArray(existingOutput?.fishRecipes) ? existingOutput.fishRecipes : [];
  const nextEntries = Array.isArray(nextOutput?.fishRecipes) ? nextOutput.fishRecipes : [];
  const mergedEntries = [...existingEntries];

  nextEntries.forEach((nextEntry) => {
    const existingEntry = mergedEntries.find((entry) => entry.fish?.commonName === nextEntry.fish?.commonName && entry.fish?.scientificName === nextEntry.fish?.scientificName);
    if (!existingEntry) {
      mergedEntries.push(nextEntry);
      return;
    }

    const existingRecipes = Array.isArray(existingEntry.recipes) ? existingEntry.recipes : [];
    const incomingRecipes = Array.isArray(nextEntry.recipes) ? nextEntry.recipes : [];
    const seenRecipeIds = new Set(existingRecipes.map((recipe) => recipe.recipeId).filter(Boolean));

    incomingRecipes.forEach((recipe) => {
      if (recipe.recipeId && seenRecipeIds.has(recipe.recipeId)) {
        return;
      }
      existingRecipes.push(recipe);
      if (recipe.recipeId) {
        seenRecipeIds.add(recipe.recipeId);
      }
    });

    existingEntry.fish = nextEntry.fish;
    existingEntry.notes = nextEntry.notes;
    existingEntry.recipes = existingRecipes;
    existingEntry.recipeCount = existingRecipes.length;
  });

  return {
    generatedAt: nextOutput.generatedAt,
    fishRecipeCount: mergedEntries.length,
    fishRecipes: mergedEntries,
  };
};

const writeOutput = async (fish, recipes, quotaStrategy, existingMasterOutput, successLabel) => {
  const output = {
    generatedAt: new Date().toISOString(),
    fishRecipeCount: 1,
    fishRecipes: [buildFishEntry(fish, recipes, quotaStrategy)],
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const finalOutput = existingMasterOutput ? mergeRecipeOutputs(existingMasterOutput, output) : output;
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(finalOutput, null, 2), "utf8");
  console.log(`${successLabel} ${OUTPUT_PATH}`);
};

const main = async () => {
  await loadDotEnv();

  const [fishJsonPath, ...fishQueryParts] = process.argv.slice(2);
  const fishQuery = fishQueryParts.join(" ").trim();

  if (!fishJsonPath || !fishQuery) {
    throw new Error('Usage: node scripts/build-recipes-for-fish.js "<fish-by-habitat-json>" "<fish common or scientific name>"');
  }

  const fish = await loadFishRecord(fishJsonPath, fishQuery);
  const aliases = buildAliases(fish);
  const existingMasterOutput = await loadExistingMasterRecipes();
  const existingFishEntry = findExistingFishEntry(existingMasterOutput, fish);

  if (existingFishEntry && Array.isArray(existingFishEntry.recipes) && existingFishEntry.recipes.length > 0) {
    console.log(`Recipes already exist for ${fish.commonName} in ${OUTPUT_PATH}; skipping Spoonacular lookup.`);
    return;
  }

  const searchResponse = await searchRecipes({
    query: fish.commonName,
    includeIngredients: [aliases[0]],
    number: 6,
    sort: "popularity",
    instructionsRequired: true,
    addRecipeInformation: false,
    addRecipeNutrition: false,
  });

  const candidateResults = Array.isArray(searchResponse?.results) ? searchResponse.results : Array.isArray(searchResponse) ? searchResponse : [];
  const recipeIds = uniqueByTitle(candidateResults).slice(0, 6).map((recipe) => recipe.id).filter(Boolean);

  if (recipeIds.length === 0) {
    await writeOutput(
      fish,
      [makeFallbackRecipe(fish)],
      "This script is designed to use two Spoonacular requests per run: one search request and one bulk detail request, and it returns only one best recipe to stay conservative with quota.",
      existingMasterOutput,
      "Wrote fallback fish recipe JSON to",
    );
    return;
  }

  await sleep(BULK_REQUEST_DELAY_MS);

  const detailedRecipes = await getBulkRecipeInformation(recipeIds, { includeNutrition: true });
  const filteredRecipes = [];
  for (const recipe of detailedRecipes) {
    const validation = isValidRecipeForFish(recipe, aliases);
    if (!validation.valid) {
      continue;
    }

    const quantityWholeFish = inferWholeFishCount(validation.targetIngredient, fish);
    filteredRecipes.push(simplifyRecipe(fish, recipe, validation.targetIngredient, quantityWholeFish));
  }

  const finalRecipes = uniqueByTitle(filteredRecipes).slice(0, 1);
  const recipesToWrite = finalRecipes.length > 0 ? finalRecipes : [makeFallbackRecipe(fish)];

  await writeOutput(
    fish,
    recipesToWrite,
    "This script is designed to use two Spoonacular requests per run with a short pause between them to stay under the RapidAPI per-second rate limit, and it returns only one best recipe to stay conservative with quota.",
    existingMasterOutput,
    finalRecipes.length > 0 ? "Wrote fish recipe JSON to" : "Wrote fallback fish recipe JSON to",
  );
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});


const FALLBACK_RECIPE_TEMPLATES = {
  delicate: [
    {
      title: "Pan-Seared {fish} with Lemon Butter",
      dishTypes: ["main course", "dinner"],
      cuisines: ["Mediterranean"],
      diets: ["pescatarian"],
      readyInMinutes: 25,
      servings: 2,
      ingredients: ["2 {fish} fillets", "1 tbsp olive oil", "2 tbsp butter", "1 lemon", "1 clove garlic", "salt", "black pepper", "parsley"],
      instructions:
        "Pat the {fish} dry, season with salt and pepper, and sear in olive oil until cooked through. Add butter, garlic, and lemon juice, then spoon the sauce over the fish and finish with parsley.",
      nutrition: { calories: 420, protein: 34, fat: 26, carbohydrates: 6, sodium: 420 },
      basePrice: 16,
    },
    {
      title: "{fish} Nigiri Bowl",
      dishTypes: ["main course", "lunch"],
      cuisines: ["Japanese"],
      diets: ["pescatarian"],
      readyInMinutes: 35,
      servings: 2,
      ingredients: ["2 {fish} fillets", "2 cups cooked sushi rice", "1 tbsp rice vinegar", "1 cucumber", "1 sheet nori", "soy sauce", "pickled ginger"],
      instructions:
        "Cook and season the rice, slice the {fish} thinly, and build bowls with rice, cucumber, nori, and ginger. Serve with soy sauce.",
      nutrition: { calories: 510, protein: 29, fat: 12, carbohydrates: 67, sodium: 640 },
      basePrice: 14,
    },
  ],
  white: [
    {
      title: "Herb-Crusted Baked {fish}",
      dishTypes: ["main course", "dinner"],
      cuisines: ["American"],
      diets: ["pescatarian"],
      readyInMinutes: 30,
      servings: 2,
      ingredients: ["2 {fish} fillets", "1/2 cup breadcrumbs", "1 tbsp Dijon mustard", "1 tbsp olive oil", "1 tbsp parsley", "1 tsp thyme", "salt", "black pepper"],
      instructions:
        "Brush the {fish} with mustard, coat with herbed breadcrumbs, and bake until flaky and golden.",
      nutrition: { calories: 470, protein: 36, fat: 18, carbohydrates: 34, sodium: 510 },
      basePrice: 15,
    },
    {
      title: "Creamy {fish} Chowder",
      dishTypes: ["soup", "main course"],
      cuisines: ["American"],
      diets: ["pescatarian"],
      readyInMinutes: 45,
      servings: 4,
      ingredients: ["2 {fish} fillets", "2 potatoes", "1 onion", "2 cups milk", "1 cup stock", "1 tbsp butter", "1 celery stalk", "salt", "black pepper"],
      instructions:
        "Saute the onion and celery in butter, add potato and stock, then simmer. Stir in milk and chunks of {fish} and cook gently until tender.",
      nutrition: { calories: 390, protein: 24, fat: 14, carbohydrates: 39, sodium: 560 },
      basePrice: 13,
    },
  ],
  oily: [
    {
      title: "Grilled {fish} Steak with Charred Citrus",
      dishTypes: ["main course", "dinner"],
      cuisines: ["Mediterranean"],
      diets: ["pescatarian"],
      readyInMinutes: 28,
      servings: 2,
      ingredients: ["2 {fish} steaks", "1 orange", "1 lemon", "1 tbsp olive oil", "1 tsp smoked paprika", "salt", "black pepper"],
      instructions:
        "Rub the {fish} with oil and paprika, grill until browned, and serve with charred citrus wedges.",
      nutrition: { calories: 460, protein: 33, fat: 28, carbohydrates: 11, sodium: 390 },
      basePrice: 18,
    },
    {
      title: "{fish} Rice Bowl with Ginger Scallion Sauce",
      dishTypes: ["main course", "lunch"],
      cuisines: ["Asian"],
      diets: ["pescatarian"],
      readyInMinutes: 30,
      servings: 2,
      ingredients: ["2 {fish} fillets", "2 cups cooked rice", "2 scallions", "1 tsp ginger", "1 tbsp soy sauce", "1 tsp sesame oil", "1 cucumber"],
      instructions:
        "Cook the {fish}, whisk a ginger scallion sauce, and serve over rice with sliced cucumber.",
      nutrition: { calories: 540, protein: 31, fat: 17, carbohydrates: 61, sodium: 670 },
      basePrice: 15,
    },
  ],
  shellfishLike: [
    {
      title: "Crispy {fish} Cakes",
      dishTypes: ["main course", "appetizer"],
      cuisines: ["American"],
      diets: ["pescatarian"],
      readyInMinutes: 35,
      servings: 4,
      ingredients: ["3 portions {fish}", "1 egg", "1/2 cup breadcrumbs", "2 tbsp mayonnaise", "1 tsp mustard", "1 tbsp parsley", "salt", "black pepper"],
      instructions:
        "Mix flaked cooked {fish} with the binder ingredients, shape into cakes, and pan-fry until crisp on both sides.",
      nutrition: { calories: 320, protein: 18, fat: 16, carbohydrates: 24, sodium: 520 },
      basePrice: 12,
    },
  ],
  generic: [
    {
      title: "Roasted {fish} with Garlic and Herbs",
      dishTypes: ["main course", "dinner"],
      cuisines: ["European"],
      diets: ["pescatarian"],
      readyInMinutes: 32,
      servings: 2,
      ingredients: ["2 {fish} fillets", "1 tbsp olive oil", "2 cloves garlic", "1 tbsp mixed herbs", "salt", "black pepper", "1 lemon"],
      instructions:
        "Season the {fish}, roast until cooked through, and finish with garlic, herbs, and lemon.",
      nutrition: { calories: 430, protein: 32, fat: 24, carbohydrates: 8, sodium: 410 },
      basePrice: 14,
    },
  ],
};
