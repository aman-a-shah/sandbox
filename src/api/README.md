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
