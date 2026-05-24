const { apiConfig, assertApiKey } = require("./config.js");
const { createUrl, requestJson } = require("./http.js");

const createHeaders = () => {
  assertApiKey(apiConfig.spoonacular.apiKey, "Spoonacular");

  if (apiConfig.spoonacular.rapidApiHost) {
    return {
      "X-RapidAPI-Key": apiConfig.spoonacular.apiKey,
      "X-RapidAPI-Host": apiConfig.spoonacular.rapidApiHost,
    };
  }

  return {
    "x-api-key": apiConfig.spoonacular.apiKey,
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
    apiConfig.spoonacular.baseUrl,
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
    apiConfig.spoonacular.baseUrl,
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
    apiConfig.spoonacular.baseUrl,
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
  number = 10,
  addRecipeInformation = true,
  addRecipeNutrition = true,
} = {}) => {
  const url = createUrl(apiConfig.spoonacular.baseUrl, "/recipes/complexSearch", {
    query,
    includeIngredients: includeIngredients?.join(","),
    excludeIngredients: excludeIngredients?.join(","),
    cuisine,
    diet,
    type,
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
