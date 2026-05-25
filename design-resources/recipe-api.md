# Recipe API Resources

## API

Spoonacular's Recipe, Food, Nutrition API is available directly from Spoonacular and through RapidAPI.

- RapidAPI listing: https://rapidapi.com/spoonacular/api/recipe-food-nutrition/playground
- Spoonacular docs: https://spoonacular.com/food-api/docs
- RapidAPI host: `spoonacular-recipe-food-nutrition-v1.p.rapidapi.com`
- Main response format: JSON

Use this API when you want to:

- Search recipes by dish name, ingredient, diet, cuisine, nutrition, or meal type.
- Ask "what can I make with these ingredients?"
- Fetch full recipe details, ingredients, instructions, source URLs, nutrition, price breakdowns, equipment, and diet/allergen flags.
- Search ingredient and food databases.

## Authentication

For RapidAPI requests, set:

```bash
export RAPIDAPI_KEY="YOUR_RAPIDAPI_KEY"
export RAPIDAPI_HOST="spoonacular-recipe-food-nutrition-v1.p.rapidapi.com"
```

RapidAPI requests use these headers:

```http
X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
X-RapidAPI-Host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com
```

Direct Spoonacular requests use an `apiKey` query parameter or `x-api-key` header.

## Best Endpoints For Recipe Search

### Find Recipes By Ingredients

Use this for "I have chicken, rice, and broccoli. What can I make?"

- Endpoint: `GET /recipes/findByIngredients`
- Key inputs: `ingredients`, `number`, `ranking`, `ignorePantry`
- Key output: recipe IDs, titles, images, used ingredients, missing ingredients, unused ingredients, and ingredient counts.

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "ingredients=chicken,broccoli,rice" \
  --data-urlencode "number=5" \
  --data-urlencode "ranking=1" \
  --data-urlencode "ignorePantry=true"
```

Useful parameter notes:

- `ingredients`: comma-separated ingredient names.
- `number`: number of recipes to return.
- `ranking=1`: maximize used ingredients.
- `ranking=2`: minimize missing ingredients.
- `ignorePantry=true`: ignore common pantry staples like salt, pepper, oil, flour, sugar.

### Complex Recipe Search

Use this for broad recipe discovery with filters.

- Endpoint: `GET /recipes/complexSearch`
- Key inputs: `query`, `includeIngredients`, `excludeIngredients`, `diet`, `intolerances`, `cuisine`, `type`, `maxReadyTime`, nutrition ranges, sorting, pagination.
- Key output: recipe IDs, titles, images, and optionally full recipe/nutrition data.

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "query=pasta" \
  --data-urlencode "includeIngredients=tomato,cheese" \
  --data-urlencode "excludeIngredients=eggs" \
  --data-urlencode "diet=vegetarian" \
  --data-urlencode "intolerances=gluten" \
  --data-urlencode "type=main course" \
  --data-urlencode "maxReadyTime=30" \
  --data-urlencode "addRecipeInformation=true" \
  --data-urlencode "addRecipeNutrition=true" \
  --data-urlencode "number=5"
```

Common filter parameters:

- `query`: natural language or dish search, such as `chicken tacos`.
- `includeIngredients`: comma-separated ingredients that should appear.
- `excludeIngredients`: comma-separated ingredients to avoid.
- `diet`: examples include `vegetarian`, `vegan`, `gluten free`, `ketogenic`, `paleo`, `pescetarian`, `whole30`.
- `intolerances`: examples include `dairy`, `egg`, `gluten`, `grain`, `peanut`, `seafood`, `sesame`, `shellfish`, `soy`, `sulfite`, `tree nut`, `wheat`.
- `cuisine`: examples include `American`, `Chinese`, `French`, `Greek`, `Indian`, `Italian`, `Japanese`, `Korean`, `Mediterranean`, `Mexican`, `Thai`, `Vietnamese`.
- `type`: examples include `main course`, `side dish`, `dessert`, `appetizer`, `salad`, `breakfast`, `soup`, `snack`, `drink`.
- `equipment`: examples include `oven`, `blender`, `frying pan`, `slow cooker`, `rice cooker`, `food processor`.
- `maxReadyTime`: maximum ready time in minutes.
- `minProtein`, `maxProtein`, `minCalories`, `maxCalories`, `minCarbs`, `maxCarbs`, `minFat`, `maxFat`: nutrition limits.
- `sort`: examples include `popularity`, `healthiness`, `price`, `time`, `random`, `max-used-ingredients`, `min-missing-ingredients`, `calories`, `protein`, `sugar`, `sodium`.
- `offset` and `number`: pagination.

## Fetching Full Recipe Data

### Single Recipe Information

Use this after search returns a recipe `id`.

- Endpoint: `GET /recipes/{id}/information`
- Key inputs: `includeNutrition`, `addWinePairing`, `addTasteData`
- Key output: full recipe metadata, servings, ready time, source URL, diets, dish types, extended ingredients, instructions, nutrition, and flags such as `vegan`, `vegetarian`, `glutenFree`, and `dairyFree`.

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/716429/information" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "includeNutrition=true"
```

### Bulk Recipe Information

Use this when you have multiple recipe IDs from a search response.

- Endpoint: `GET /recipes/informationBulk`
- Key inputs: `ids`, `includeNutrition`

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "ids=715538,716429" \
  --data-urlencode "includeNutrition=true"
```

## Discovery And Database Endpoints

There is not a public endpoint for downloading the entire Spoonacular recipe database in one shot. The practical approach is:

1. Use `complexSearch` with filters and pagination.
2. Store returned recipe IDs.
3. Fetch details with `informationBulk`.
4. Use autocomplete and food search endpoints to discover available ingredients, dish names, products, and menu items.

### Recipe Autocomplete

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/autocomplete" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "query=chick" \
  --data-urlencode "number=10"
```

### Ingredient Search

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/ingredients/search" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "query=banana" \
  --data-urlencode "number=10" \
  --data-urlencode "metaInformation=true"
```

### Ingredient Autocomplete

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/ingredients/autocomplete" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "query=tom" \
  --data-urlencode "number=10"
```

### Search All Food Content

Use this to search across recipes, products, menu items, ingredients, and videos.

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/search" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "query=apple" \
  --data-urlencode "number=10"
```

## Natural Language Query Analysis

Use this to parse a user query like "salmon with fusilli and no nuts" into included/excluded ingredients and target dishes.

- Endpoint: `GET /recipes/queries/analyze`

```bash
curl --get "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/queries/analyze" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --data-urlencode "q=salmon with fusilli and no nuts"
```

## Expected Output Shapes

### Ingredient Recipe Search Output

Expected fields include:

```json
[
  {
    "id": 12345,
    "title": "Recipe Title",
    "image": "https://...",
    "usedIngredientCount": 3,
    "missedIngredientCount": 2,
    "usedIngredients": [],
    "missedIngredients": [],
    "unusedIngredients": []
  }
]
```

### Recipe Information Output

Expected fields include:

```json
{
  "id": 716429,
  "title": "Recipe Title",
  "image": "https://...",
  "servings": 2,
  "readyInMinutes": 45,
  "sourceUrl": "https://...",
  "spoonacularSourceUrl": "https://...",
  "healthScore": 19,
  "spoonacularScore": 83,
  "pricePerServing": 163.15,
  "cuisines": [],
  "diets": [],
  "dishTypes": ["lunch", "main course", "dinner"],
  "extendedIngredients": [],
  "analyzedInstructions": [],
  "nutrition": {}
}
```

## Notes

- Recipe image URLs can usually be built from recipe `id` and `imageType` using `https://img.spoonacular.com/recipes/{ID}-{SIZE}.{TYPE}`.
- Ingredient autocomplete often returns image filenames; build full ingredient image URLs with `https://img.spoonacular.com/ingredients_{SIZE}/{IMAGE}`.
- Many endpoints consume quota points. Returning more results or adding full recipe/nutrition data can increase quota usage.
- Free plan quota resets at midnight UTC according to the Spoonacular docs.
- RapidAPI requires that your account is subscribed to the API, even for free-tier usage.

## Recommended App Flow

For an app where a user enters ingredients and gets possible meals:

1. Accept user input as a comma-separated list of ingredients.
2. Call `/recipes/findByIngredients`.
3. Display recipe cards using `title`, `image`, `usedIngredientCount`, and `missedIngredientCount`.
4. When the user opens a recipe, call `/recipes/{id}/information?includeNutrition=true`.
5. Show ingredients, instructions, nutrition, source URL, and dietary flags.
6. For advanced filters, switch to `/recipes/complexSearch`.

