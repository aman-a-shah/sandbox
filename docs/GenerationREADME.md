# API Layer

This folder contains framework-agnostic API clients for the current data plan:

- Spoonacular for recipe search and recipe detail lookups
- WoRMS for marine taxonomy and distribution enrichment
- MarLIN for British Isles species and habitat enrichment

## Environment Variables

Create a local `.env` or equivalent runtime config with:

```bash
SPOONACULAR_API_KEY=your-key-here
SPOONACULAR_BASE_URL=https://api.spoonacular.com
RECIPE-API-KEY=your-rapidapi-key-here
RECIPE-API-HOST=spoonacular-recipe-food-nutrition-v1.p.rapidapi.com
WORMS_BASE_URL=https://www.marinespecies.org/rest
MARLIN_BASE_URL=https://api.mba.ac.uk/marlin
```

Use either:

- `SPOONACULAR_API_KEY` with the direct Spoonacular base URL, or
- `RECIPE-API-KEY` plus `RECIPE-API-HOST` for the RapidAPI-hosted version

## Current Exports

### Spoonacular

- `findRecipesByIngredients`
- `getRecipeInformation`
- `getBulkRecipeInformation`
- `searchRecipes`

Recipe generation helper scripts:

- `node scripts/build-recipes-for-fish.js "<fish-by-habitat-json>" "<fish name>"`

This script is intentionally conservative with Spoonacular quota.
It uses:

- 1 `complexSearch` request
- 1 `informationBulk` request

That keeps each run to roughly two Spoonacular requests, which is safer on a limited RapidAPI plan.
Each run returns at most one new recipe, and appends it into the master file at `generated/recipes-by-fish/recipes.json` if that recipe is not already stored under that fish.
If Spoonacular finds no recipes for the selected fish, the script generates one fallback fish recipe instead of failing.

### WoRMS

- `getAphiaIdByName`
- `searchRecordsByName`
- `getAphiaRecordById`
- `getVernacularsByAphiaId`
- `getDistributionsByAphiaId`

### MarLIN

- `getSpeciesByMarlinId`
- `getSpeciesByAphiaId`
- `searchSpeciesByName`
- `getSpeciesPressures`
- `getHabitatByJnccCode`

## Notes

- This layer assumes a runtime with `fetch` available.
- Global Fishing Watch is intentionally not included in this branch yet.
- Coastline snapping and `lat/lon -> live fish list` are still game-side concerns, not API responsibilities.
- The recipe script keeps recipes when the selected fish appears in the ingredient list, even if other seafood ingredients are also present.
- Recipe output is stored in one master file: `generated/recipes-by-fish/recipes.json`.
- Recipes are grouped by fish inside that master file and deduplicated by `recipeId` within each fish entry.
- Fallback recipes are varied by fish type, so missing fish do not all map to the same generic dish.
