const { apiConfig, assertApiKey } = require("./config.js");
const { createUrl, requestJson } = require("./http.js");

const resolveSpoonacularConfig = () => {
  const rapidApiHost = process.env["RECIPE-API-HOST"] || apiConfig.spoonacular.rapidApiHost;
  const explicitBaseUrl = process.env["SPOONACULAR_BASE_URL"];
  const apiKey =
    process.env["SPOONACULAR_API_KEY"] ||
    process.env["RECIPE-API-KEY"] ||
    apiConfig.spoonacular.apiKey;
  const baseUrl =
    (explicitBaseUrl && explicitBaseUrl.trim()) ||
    (rapidApiHost ? `https://${rapidApiHost}` : "https://api.spoonacular.com");

  return {
    apiKey,
    rapidApiHost,
    baseUrl,
  };
};

const createHeaders = () => {
  const spoonacularConfig = resolveSpoonacularConfig();
  assertApiKey(spoonacularConfig.apiKey, "Spoonacular");

  if (spoonacularConfig.rapidApiHost) {
    return {
      "X-RapidAPI-Key": spoonacularConfig.apiKey,
      "X-RapidAPI-Host": spoonacularConfig.rapidApiHost,
    };
  }

  return {
    "x-api-key": spoonacularConfig.apiKey,
  };
};

const findRecipesByIngredients = async ({
  ingredients,
  number = 10,
  ranking = 2,
  ignorePantry = true,
} = {}) => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error("findRecipesByIngredients requires a non-empty ingredients array.");
  }

  const url = createUrl(
    resolveSpoonacularConfig().baseUrl,
    "/recipes/findByIngredients",
    {
      ingredients: ingredients.join(","),
      number,
      ranking,
      ignorePantry,
    },
  );

  return requestJson(url, {
    headers: createHeaders(),
  });
};

const getRecipeInformation = async (
  recipeId,
  { includeNutrition = true, addWinePairing = false, addTasteData = false } = {},
) => {
  if (!recipeId) {
    throw new Error("getRecipeInformation requires a recipeId.");
  }

  const url = createUrl(
    resolveSpoonacularConfig().baseUrl,
    `/recipes/${recipeId}/information`,
    {
      includeNutrition,
      addWinePairing,
      addTasteData,
    },
  );

  return requestJson(url, {
    headers: createHeaders(),
  });
};

const getBulkRecipeInformation = async (
  recipeIds,
  { includeNutrition = true } = {},
) => {
  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    throw new Error("getBulkRecipeInformation requires a non-empty recipeIds array.");
  }

  const url = createUrl(
    resolveSpoonacularConfig().baseUrl,
    "/recipes/informationBulk",
    {
      ids: recipeIds.join(","),
      includeNutrition,
    },
  );

  return requestJson(url, {
    headers: createHeaders(),
  });
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
  const url = createUrl(resolveSpoonacularConfig().baseUrl, "/recipes/complexSearch", {
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
  });

  return requestJson(url, {
    headers: createHeaders(),
  });
};

module.exports = {
  findRecipesByIngredients,
  getRecipeInformation,
  getBulkRecipeInformation,
  searchRecipes,
};
