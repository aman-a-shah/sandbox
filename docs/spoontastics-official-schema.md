Search Recipes
Search through thousands of recipes using advanced filtering and ranking. NOTE: This method combines searching by query, by ingredients, and by nutrients into one endpoint.

If you are making a "what's in your fridge?" style app and require more filters than the Search Recipes by Ingredients endpoint allows, use the sort parameters max-used-ingredients or min-missing-ingredients with this endpoint instead.

GET https://api.spoonacular.com/recipes/complexSearch
Headers
Response Headers:

Content-Type: application/json
Parameters
Name	Type	Example	Description
query	string	pasta	The (natural language) recipe search query.
cuisine	string	italian	The cuisine(s) of the recipes. One or more, comma separated (will be interpreted as 'OR'). See a full list of supported cuisines.
excludeCuisine	string	greek	The cuisine(s) the recipes must not match. One or more, comma separated (will be interpreted as 'AND'). See a full list of supported cuisines.
diet	string	vegetarian	The diet(s) for which the recipes must be suitable. You can specify multiple with comma meaning AND connection. You can specify multiple diets separated with a pipe | meaning OR connection. For example diet=gluten free,vegetarian means the recipes must be both, gluten free and vegetarian. If you specify diet=vegan|vegetarian, it means you want recipes that are vegan OR vegetarian. See a full list of supported diets.
intolerances	string	gluten	A comma-separated list of intolerances. All recipes returned must not contain ingredients that are not suitable for people with the intolerances entered. See a full list of supported intolerances.
equipment	string	pan	The equipment required. Multiple values will be interpreted as 'or'. For example, value could be "blender, frying pan, bowl".See a full list of supported equipment.
includeIngredients	string	tomato,cheese	A comma-separated list of ingredients that should/must be used in the recipes.
excludeIngredients	string	eggs	A comma-separated list of ingredients or ingredient types that the recipes must not contain.
type	string	main course	The type of recipe. See a full list of supported meal types.
instructionsRequired	boolean	true	Whether the recipes must have instructions.
fillIngredients	boolean	false	Add information about the ingredients and whether they are used or missing in relation to the query.
addRecipeInformation	boolean	false	If set to true, you get more information about the recipes returned.
addRecipeInstructions	boolean	false	If set to true, you get analyzed instructions for each recipe returned. The addRecipeInformation parameter needs to be true for this to take effect.
addRecipeNutrition	boolean	false	If set to true, you get nutritional information about each recipes returned.
author	string	coffeebean	The username of the recipe author.
tags	string	myCustomTag	User defined tags that have to match. The author param has to be set.
recipeBoxId	number	2468	The id of the recipe box to which the search should be limited to.
titleMatch	string	Crock Pot	Enter text that must be found in the title of the recipes.
maxReadyTime	number	20	The maximum time in minutes it should take to prepare and cook the recipe.
minServings	number	1	The minimum amount of servings the recipe is for.
maxServings	number	8	The maximum amount of servings the recipe is for.
ignorePantry	boolean	true	Whether to ignore typical pantry items, such as water, salt, flour, etc.
sort	string	calories	The strategy to sort recipes by. See a full list of supported sorting options.
sortDirection	string	asc	The direction in which to sort. Must be either 'asc' (ascending) or 'desc' (descending).
minCarbs	number	10	The minimum amount of carbohydrates in grams the recipe must have per serving.
maxCarbs	number	100	The maximum amount of carbohydrates in grams the recipe can have per serving.
minProtein	number	10	The minimum amount of protein in grams the recipe must have per serving.
maxProtein	number	100	The maximum amount of protein in grams the recipe can have per serving.
minCalories	number	50	The minimum amount of calories the recipe must have per serving.
maxCalories	number	800	The maximum amount of calories the recipe can have per serving.
minFat	number	1	The minimum amount of fat in grams the recipe must have per serving.
maxFat	number	100	The maximum amount of fat in grams the recipe can have per serving.
minAlcohol	number	0	The minimum amount of alcohol in grams the recipe must have per serving.
maxAlcohol	number	100	The maximum amount of alcohol in grams the recipe can have per serving.
minCaffeine	number	0	The minimum amount of caffeine in milligrams the recipe must have per serving.
maxCaffeine	number	100	The maximum amount of caffeine in milligrams the recipe can have per serving.
minCopper	number	0	The minimum amount of copper in milligrams the recipe must have per serving.
maxCopper	number	100	The maximum amount of copper in milligrams the recipe can have per serving.
minCalcium	number	0	The minimum amount of calcium in milligrams the recipe must have per serving.
maxCalcium	number	100	The maximum amount of calcium in milligrams the recipe can have per serving.
minCholine	number	0	The minimum amount of choline in milligrams the recipe must have per serving.
maxCholine	number	100	The maximum amount of choline in milligrams the recipe can have per serving.
minCholesterol	number	0	The minimum amount of cholesterol in milligrams the recipe must have per serving.
maxCholesterol	number	100	The maximum amount of cholesterol in milligrams the recipe can have per serving.
minFluoride	number	0	The minimum amount of fluoride in milligrams the recipe must have per serving.
maxFluoride	number	100	The maximum amount of fluoride in milligrams the recipe can have per serving.
minSaturatedFat	number	0	The minimum amount of saturated fat in grams the recipe must have per serving.
maxSaturatedFat	number	100	The maximum amount of saturated fat in grams the recipe can have per serving.
minVitaminA	number	0	The minimum amount of Vitamin A in IU the recipe must have per serving.
maxVitaminA	number	100	The maximum amount of Vitamin A in IU the recipe can have per serving.
minVitaminC	number	0	The minimum amount of Vitamin C milligrams the recipe must have per serving.
maxVitaminC	number	100	The maximum amount of Vitamin C in milligrams the recipe can have per serving.
minVitaminD	number	0	The minimum amount of Vitamin D in micrograms the recipe must have per serving.
maxVitaminD	number	100	The maximum amount of Vitamin D in micrograms the recipe can have per serving.
minVitaminE	number	0	The minimum amount of Vitamin E in milligrams the recipe must have per serving.
maxVitaminE	number	100	The maximum amount of Vitamin E in milligrams the recipe can have per serving.
minVitaminK	number	0	The minimum amount of Vitamin K in micrograms the recipe must have per serving.
maxVitaminK	number	100	The maximum amount of Vitamin K in micrograms the recipe can have per serving.
minVitaminB1	number	0	The minimum amount of Vitamin B1 in milligrams the recipe must have per serving.
maxVitaminB1	number	100	The maximum amount of Vitamin B1 in milligrams the recipe can have per serving.
minVitaminB2	number	0	The minimum amount of Vitamin B2 in milligrams the recipe must have per serving.
maxVitaminB2	number	100	The maximum amount of Vitamin B2 in milligrams the recipe can have per serving.
minVitaminB5	number	0	The minimum amount of Vitamin B5 in milligrams the recipe must have per serving.
maxVitaminB5	number	100	The maximum amount of Vitamin B5 in milligrams the recipe can have per serving.
minVitaminB3	number	0	The minimum amount of Vitamin B3 in milligrams the recipe must have per serving.
maxVitaminB3	number	100	The maximum amount of Vitamin B3 in milligrams the recipe can have per serving.
minVitaminB6	number	0	The minimum amount of Vitamin B6 in milligrams the recipe must have per serving.
maxVitaminB6	number	100	The maximum amount of Vitamin B6 in milligrams the recipe can have per serving.
minVitaminB12	number	0	The minimum amount of Vitamin B12 in micrograms the recipe must have per serving.
maxVitaminB12	number	100	The maximum amount of Vitamin B12 in micrograms the recipe can have per serving.
minFiber	number	0	The minimum amount of fiber in grams the recipe must have per serving.
maxFiber	number	100	The maximum amount of fiber in grams the recipe can have per serving.
minFolate	number	0	The minimum amount of folate in micrograms the recipe must have per serving.
maxFolate	number	100	The maximum amount of folate in micrograms the recipe can have per serving.
minFolicAcid	number	0	The minimum amount of folic acid in micrograms the recipe must have per serving.
maxFolicAcid	number	100	The maximum amount of folic acid in micrograms the recipe can have per serving.
minIodine	number	0	The minimum amount of iodine in micrograms the recipe must have per serving.
maxIodine	number	100	The maximum amount of iodine in micrograms the recipe can have per serving.
minIron	number	0	The minimum amount of iron in milligrams the recipe must have per serving.
maxIron	number	100	The maximum amount of iron in milligrams the recipe can have per serving.
minMagnesium	number	0	The minimum amount of magnesium in milligrams the recipe must have per serving.
maxMagnesium	number	100	The maximum amount of magnesium in milligrams the recipe can have per serving.
minManganese	number	0	The minimum amount of manganese in milligrams the recipe must have per serving.
maxManganese	number	100	The maximum amount of manganese in milligrams the recipe can have per serving.
minPhosphorus	number	0	The minimum amount of phosphorus in milligrams the recipe must have per serving.
maxPhosphorus	number	100	The maximum amount of phosphorus in milligrams the recipe can have per serving.
minPotassium	number	0	The minimum amount of potassium in milligrams the recipe must have per serving.
maxPotassium	number	100	The maximum amount of potassium in milligrams the recipe can have per serving.
minSelenium	number	0	The minimum amount of selenium in micrograms the recipe must have per serving.
maxSelenium	number	100	The maximum amount of selenium in micrograms the recipe can have per serving.
minSodium	number	0	The minimum amount of sodium in milligrams the recipe must have per serving.
maxSodium	number	100	The maximum amount of sodium in milligrams the recipe can have per serving.
minSugar	number	0	The minimum amount of sugar in grams the recipe must have per serving.
maxSugar	number	100	The maximum amount of sugar in grams the recipe can have per serving.
minZinc	number	0	The minimum amount of zinc in milligrams the recipe must have per serving.
maxZinc	number	100	The maximum amount of zinc in milligrams the recipe can have per serving.
offset	number	0	The number of results to skip (between 0 and 900).
number	number	10	The number of expected results (between 1 and 100).
Example Request and Response
GET https://api.spoonacular.com/recipes/complexSearch?query=pasta&maxFat=25&number=2
{
    "offset": 0,
    "number": 2,
    "results": [
        {
            "id": 716429,
            "title": "Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs",
            "image": "https://img.spoonacular.com/recipes/716429-312x231.jpg",
            "imageType": "jpg",
        },
        {
            "id": 715538,
            "title": "What to make for dinner tonight?? Bruschetta Style Pork & Pasta",
            "image": "https://img.spoonacular.com/recipes/715538-312x231.jpg",
            "imageType": "jpg",
        }
    ],
    "totalResults": 86
}
The API response will give you arrays of usedIngredients, missedIngredients, and unusedIngredients for each returned recipe. This diagram shows you what they mean:



Quotas
Calling this endpoint requires 1 point and 0.01 points per result returned. Since this endpoint combines the capabilities of four different endpoints into one, additional points may be required depending on the parameters you set. If fillIngredients is set to true, 0.025 points will be added per recipe returned. If a nutrient filter is set, 1 point will be added. If addRecipeInformation is set to true, 0.025 points will be added per recipe returned. If addRecipeInstructions is set to true, 0.025 points will be added per recipe returned. If addRecipeNutrition is set to true, 0.025 points will be added per recipe returned and addRecipeInformation will automatically be set to true as well. Learn more about quotas.


Search Recipes by Ingredients
Ever wondered what recipes you can cook with the ingredients you have in your fridge or pantry? This endpoint lets you find recipes that either maximize the usage of ingredients you have at hand (pre shopping) or minimize the ingredients that you don't currently have (post shopping).

Find recipes that use as many of the given ingredients as possible and require as few additional ingredients as possible. This is a "what's in your fridge" API endpoint.

GET https://api.spoonacular.com/recipes/findByIngredients
Headers
Response Headers:

Content-Type: application/json
Parameters
Name	Type	Example	Description
ingredients	string	apples,flour,sugar	A comma-separated list of ingredients that the recipes should contain.
number	number	10	The maximum number of recipes to return (between 1 and 100). Defaults to 10.
ranking	number	1	Whether to maximize used ingredients (1) or minimize missing ingredients (2) first.
ignorePantry	boolean	true	Whether to ignore typical pantry items, such as water, salt, flour, etc.
Example Request and Response
GET https://api.spoonacular.com/recipes/findByIngredients?ingredients=apples,+flour,+sugar&number=2
[
    {
        "id": 73420,
        "image": "https://img.spoonacular.com/recipes/73420-312x231.jpg",
        "imageType": "jpg",
        "likes": 0,
        "missedIngredientCount": 3,
        "missedIngredients": [
            {
                "aisle": "Baking",
                "amount": 1.0,
                "id": 18371,
                "image": "https://img.spoonacular.com/ingredients_100x100/white-powder.jpg",
                "meta": [],
                "name": "baking powder",
                "original": "1 tsp baking powder",
                "originalName": "baking powder",
                "unit": "tsp",
                "unitLong": "teaspoon",
                "unitShort": "tsp"
            },
            {
                "aisle": "Spices and Seasonings",
                "amount": 1.0,
                "id": 2010,
                "image": "https://img.spoonacular.com/ingredients_100x100/cinnamon.jpg",
                "meta": [],
                "name": "cinnamon",
                "original": "1 tsp cinnamon",
                "originalName": "cinnamon",
                "unit": "tsp",
                "unitLong": "teaspoon",
                "unitShort": "tsp"
            },
            {
                "aisle": "Milk, Eggs, Other Dairy",
                "amount": 1.0,
                "id": 1123,
                "image": "https://img.spoonacular.com/ingredients_100x100/egg.png",
                "meta": [],
                "name": "egg",
                "original": "1 egg",
                "originalName": "egg",
                "unit": "",
                "unitLong": "",
                "unitShort": ""
            }
        ],
        "title": "Apple Or Peach Strudel",
        "unusedIngredients": [],
        "usedIngredientCount": 1,
        "usedIngredients": [
            {
                "aisle": "Produce",
                "amount": 6.0,
                "id": 9003,
                "image": "https://img.spoonacular.com/ingredients_100x100/apple.jpg",
                "meta": [],
                "name": "apples",
                "original": "6 large baking apples",
                "originalName": "baking apples",
                "unit": "large",
                "unitLong": "larges",
                "unitShort": "large"
            }
        ]
    },
    {
        "id": 632660,
        "image": "https://img.spoonacular.com/recipes/632660-312x231.jpg",
        "imageType": "jpg",
        "likes": 3,
        "missedIngredientCount": 4,
        "missedIngredients": [
            {
                "aisle": "Milk, Eggs, Other Dairy",
                "amount": 1.5,
                "extendedName": "unsalted butter",
                "id": 1001,
                "image": "https://img.spoonacular.com/ingredients_100x100/butter-sliced.jpg",
                "meta": [
                    "unsalted",
                    "cold"
                ],
                "name": "butter",
                "original": "1 1/2 sticks cold unsalted butter cold unsalted butter<",
                "originalName": "cold unsalted butter cold unsalted butter<",
                "unit": "sticks",
                "unitLong": "sticks",
                "unitShort": "sticks"
            },
            {
                "aisle": "Produce",
                "amount": 4.0,
                "id": 1079003,
                "image": "https://img.spoonacular.com/ingredients_100x100/red-delicious-apples.png",
                "meta": [
                    "red",
                    " such as golden delicious, peeled, cored and cut into 1/4-inch-thick slices "
                ],
                "name": "red apples",
                "original": "4 larges red apples, such as Golden Delicious, peeled, cored and cut into 1/4-inch-thick slices",
                "originalName": "s red apples, such as Golden Delicious, peeled, cored and cut into 1/4-inch-thick slices",
                "unit": "large",
                "unitLong": "larges",
                "unitShort": "large"
            },
            {
                "aisle": "Spices and Seasonings",
                "amount": 2.0,
                "id": 2010,
                "image": "https://img.spoonacular.com/ingredients_100x100/cinnamon.jpg",
                "meta": [],
                "name": "cinnamon",
                "original": "2 teaspoons cinnamon",
                "originalName": "cinnamon",
                "unit": "teaspoons",
                "unitLong": "teaspoons",
                "unitShort": "tsp"
            },
            {
                "aisle": "Nut butters, Jams, and Honey",
                "amount": 2.0,
                "id": 19719,
                "image": "https://img.spoonacular.com/ingredients_100x100/apricot-jam.jpg",
                "meta": [
                    "melted"
                ],
                "name": "apricot preserves",
                "original": "2 tablespoons apricot preserves, melted and strained",
                "originalName": "apricot preserves, melted and strained",
                "unit": "tablespoons",
                "unitLong": "tablespoons",
                "unitShort": "Tbsp"
            }
        ],
        "title": "Apricot Glazed Apple Tart",
        "unusedIngredients": [
            {
                "aisle": "Produce",
                "amount": 1.0,
                "id": 9003,
                "image": "https://img.spoonacular.com/ingredients_100x100/apple.jpg",
                "meta": [],
                "name": "apples",
                "original": "apples",
                "originalName": "apples",
                "unit": "serving",
                "unitLong": "serving",
                "unitShort": "serving"
            }
        ],
        "usedIngredientCount": 0,
        "usedIngredients": []
    }
]
If you need more filter options, consider using the recipe search and set the sort parameter to max-used-ingredients or min-missing-ingredients.

The API response will give you arrays of usedIngredients, missedIngredients, and unusedIngredients for each returned recipe. This diagram shows you what they mean:



Quotas
Calling this endpoint requires 1 point and 0.01 points per recipe returned. Learn more about quotas.


Get Recipe Information
Use a recipe id to get full information about a recipe, such as ingredients, nutrition, diet and allergen information, etc.

GET https://api.spoonacular.com/recipes/{id}/information
Headers
Response Headers:

Content-Type: application/json
Parameters
Name	Type	Example	Description
id	number	716429	The id of the recipe.
includeNutrition	boolean	false	Include nutrition data in the recipe information. Nutrition data is per serving. If you want the nutrition data for the entire recipe, just multiply by the number of servings.
addWinePairing	boolean	false	Add a wine pairing to the recipe.
addTasteData	boolean	false	Add taste data to the recipe.
Example Request and Response
GET https://api.spoonacular.com/recipes/716429/information?includeNutrition=false
{
    "id": 716429,
    "title": "Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs",
    "image": "https://img.spoonacular.com/recipes/716429-556x370.jpg",
    "imageType": "jpg",
    "servings": 2,
    "readyInMinutes": 45,
    "cookingMinutes": 25,
    "preparationMinutes": 20,
    "license": "CC BY-SA 3.0",
    "sourceName": "Full Belly Sisters",
    "sourceUrl": "http://fullbellysisters.blogspot.com/2012/06/pasta-with-garlic-scallions-cauliflower.html",
    "spoonacularSourceUrl": "https://spoonacular.com/pasta-with-garlic-scallions-cauliflower-breadcrumbs-716429",
    "healthScore": 19.0,
    "spoonacularScore": 83.0,
    "pricePerServing": 163.15,
    "analyzedInstructions": [],
    "cheap": false,
    "creditsText": "Full Belly Sisters",
    "cuisines": [],
    "dairyFree": false,
    "diets": [],
    "gaps": "no",
    "glutenFree": false,
    "instructions": "",
    "ketogenic": false,
    "lowFodmap": false,
    "occasions": [],
    "sustainable": false,
    "vegan": false,
    "vegetarian": false,
    "veryHealthy": false,
    "veryPopular": false,
    "whole30": false,
    "weightWatcherSmartPoints": 17,
    "dishTypes": [
        "lunch",
        "main course",
        "main dish",
        "dinner"
    ],
    "extendedIngredients": [
        {
            "aisle": "Milk, Eggs, Other Dairy",
            "amount": 1.0,
            "consistency": "solid",
            "id": 1001,
            "image": "butter-sliced.jpg",
            "measures": {
                "metric": {
                    "amount": 1.0,
                    "unitLong": "Tbsp",
                    "unitShort": "Tbsp"
                },
                "us": {
                    "amount": 1.0,
                    "unitLong": "Tbsp",
                    "unitShort": "Tbsp"
                }
            },
            "meta": [],
            "name": "butter",
            "original": "1 tbsp butter",
            "originalName": "butter",
            "unit": "tbsp"
        },
        {
            "aisle": "Produce",
            "amount": 2.0,
            "consistency": "solid",
            "id": 10011135,
            "image": "cauliflower.jpg",
            "measures": {
                "metric": {
                    "amount": 473.176,
                    "unitLong": "milliliters",
                    "unitShort": "ml"
                },
                "us": {
                    "amount": 2.0,
                    "unitLong": "cups",
                    "unitShort": "cups"
                }
            },
            "meta": [
                "frozen",
                "thawed",
                "cut into bite-sized pieces"
            ],
            "name": "cauliflower florets",
            "original": "about 2 cups frozen cauliflower florets, thawed, cut into bite-sized pieces",
            "originalName": "about frozen cauliflower florets, thawed, cut into bite-sized pieces",
            "unit": "cups"
        },
        {
            "aisle": "Cheese",
            "amount": 2.0,
            "consistency": "solid",
            "id": 1041009,
            "image": "cheddar-cheese.png",
            "measures": {
                "metric": {
                    "amount": 2.0,
                    "unitLong": "Tbsps",
                    "unitShort": "Tbsps"
                },
                "us": {
                    "amount": 2.0,
                    "unitLong": "Tbsps",
                    "unitShort": "Tbsps"
                }
            },
            "meta": [
                "grated",
                "(I used romano)"
            ],
            "name": "cheese",
            "original": "2 tbsp grated cheese (I used romano)",
            "originalName": "grated cheese (I used romano)",
            "unit": "tbsp"
        },
        {
            "aisle": "Oil, Vinegar, Salad Dressing",
            "amount": 1.0,
            "consistency": "liquid",
            "id": 1034053,
            "image": "olive-oil.jpg",
            "measures": {
                "metric": {
                    "amount": 1.0,
                    "unitLong": "Tbsp",
                    "unitShort": "Tbsp"
                },
                "us": {
                    "amount": 1.0,
                    "unitLong": "Tbsp",
                    "unitShort": "Tbsp"
                }
            },
            "meta": [],
            "name": "extra virgin olive oil",
            "original": "1-2 tbsp extra virgin olive oil",
            "originalName": "extra virgin olive oil",
            "unit": "tbsp"
        },
        {
            "aisle": "Produce",
            "amount": 5.0,
            "consistency": "solid",
            "id": 11215,
            "image": "garlic.jpg",
            "measures": {
                "metric": {
                    "amount": 5.0,
                    "unitLong": "cloves",
                    "unitShort": "cloves"
                },
                "us": {
                    "amount": 5.0,
                    "unitLong": "cloves",
                    "unitShort": "cloves"
                }
            },
            "meta": [],
            "name": "garlic",
            "original": "5-6 cloves garlic",
            "originalName": "garlic",
            "unit": "cloves"
        },
        {
            "aisle": "Pasta and Rice",
            "amount": 6.0,
            "consistency": "solid",
            "id": 20420,
            "image": "fusilli.jpg",
            "measures": {
                "metric": {
                    "amount": 170.097,
                    "unitLong": "grams",
                    "unitShort": "g"
                },
                "us": {
                    "amount": 6.0,
                    "unitLong": "ounces",
                    "unitShort": "oz"
                }
            },
            "meta": [
                "(I used linguine)"
            ],
            "name": "pasta",
            "original": "6-8 ounces pasta (I used linguine)",
            "originalName": "pasta (I used linguine)",
            "unit": "ounces"
        },
        {
            "aisle": "Spices and Seasonings",
            "amount": 2.0,
            "consistency": "solid",
            "id": 1032009,
            "image": "red-pepper-flakes.jpg",
            "measures": {
                "metric": {
                    "amount": 2.0,
                    "unitLong": "pinches",
                    "unitShort": "pinches"
                },
                "us": {
                    "amount": 2.0,
                    "unitLong": "pinches",
                    "unitShort": "pinches"
                }
            },
            "meta": [
                "red"
            ],
            "name": "red pepper flakes",
            "original": "couple of pinches red pepper flakes, optional",
            "originalName": "couple of red pepper flakes, optional",
            "unit": "pinches"
        },
        {
            "aisle": "Spices and Seasonings",
            "amount": 2.0,
            "consistency": "solid",
            "id": 1102047,
            "image": "salt-and-pepper.jpg",
            "measures": {
                "metric": {
                    "amount": 2.0,
                    "unitLong": "servings",
                    "unitShort": "servings"
                },
                "us": {
                    "amount": 2.0,
                    "unitLong": "servings",
                    "unitShort": "servings"
                }
            },
            "meta": [
                "to taste"
            ],
            "name": "salt and pepper",
            "original": "salt and pepper, to taste",
            "originalName": "salt and pepper, to taste",
            "unit": "servings"
        },
        {
            "aisle": "Produce",
            "amount": 3.0,
            "consistency": "solid",
            "id": 11291,
            "image": "spring-onions.jpg",
            "measures": {
                "metric": {
                    "amount": 3.0,
                    "unitLong": "",
                    "unitShort": ""
                },
                "us": {
                    "amount": 3.0,
                    "unitLong": "",
                    "unitShort": ""
                }
            },
            "meta": [
                "white",
                "green",
                "separated",
                "chopped"
            ],
            "name": "scallions",
            "original": "3 scallions, chopped, white and green parts separated",
            "originalName": "scallions, chopped, white and green parts separated",
            "unit": ""
        },
        {
            "aisle": "Alcoholic Beverages",
            "amount": 2.0,
            "consistency": "liquid",
            "id": 14106,
            "image": "white-wine.jpg",
            "measures": {
                "metric": {
                    "amount": 2.0,
                    "unitLong": "Tbsps",
                    "unitShort": "Tbsps"
                },
                "us": {
                    "amount": 2.0,
                    "unitLong": "Tbsps",
                    "unitShort": "Tbsps"
                }
            },
            "meta": [
                "white"
            ],
            "name": "white wine",
            "original": "2-3 tbsp white wine",
            "originalName": "white wine",
            "unit": "tbsp"
        },
        {
            "aisle": "Pasta and Rice",
            "amount": 0.25,
            "consistency": "solid",
            "id": 99025,
            "image": "breadcrumbs.jpg",
            "measures": {
                "metric": {
                    "amount": 59.147,
                    "unitLong": "milliliters",
                    "unitShort": "ml"
                },
                "us": {
                    "amount": 0.25,
                    "unitLong": "cups",
                    "unitShort": "cups"
                }
            },
            "meta": [
                "whole wheat",
                "(I used panko)"
            ],
            "name": "whole wheat bread crumbs",
            "original": "1/4 cup whole wheat bread crumbs (I used panko)",
            "originalName": "whole wheat bread crumbs (I used panko)",
            "unit": "cup"
        }
    ],
    "summary": "Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs might be a good recipe to expand your main course repertoire. One portion of this dish contains approximately <b>19g of protein </b>,  <b>20g of fat </b>, and a total of  <b>584 calories </b>. For  <b>$1.63 per serving </b>, this recipe  <b>covers 23% </b> of your daily requirements of vitamins and minerals. This recipe serves 2. It is brought to you by fullbellysisters.blogspot.com. 209 people were glad they tried this recipe. A mixture of scallions, salt and pepper, white wine, and a handful of other ingredients are all it takes to make this recipe so scrumptious. From preparation to the plate, this recipe takes approximately  <b>45 minutes </b>. All things considered, we decided this recipe  <b>deserves a spoonacular score of 83% </b>. This score is awesome. If you like this recipe, take a look at these similar recipes: <a href=\"https://spoonacular.com/recipes/cauliflower-gratin-with-garlic-breadcrumbs-318375\">Cauliflower Gratin with Garlic Breadcrumbs</a>, < href=\"https://spoonacular.com/recipes/pasta-with-cauliflower-sausage-breadcrumbs-30437\">Pasta With Cauliflower, Sausage, & Breadcrumbs</a>, and <a href=\"https://spoonacular.com/recipes/pasta-with-roasted-cauliflower-parsley-and-breadcrumbs-30738\">Pasta With Roasted Cauliflower, Parsley, And Breadcrumbs</a>.",
    "winePairing": {
        "pairedWines": [
            "chardonnay",
            "gruener veltliner",
            "sauvignon blanc"
        ],
        "pairingText": "Chardonnay, Gruener Veltliner, and Sauvignon Blanc are great choices for Pasta. Sauvignon Blanc and Gruner Veltliner both have herby notes that complement salads with enough acid to match tart vinaigrettes, while a Chardonnay can be a good pick for creamy salad dressings. The Buddha Kat Winery Chardonnay with a 4 out of 5 star rating seems like a good match. It costs about 25 dollars per bottle.",
        "productMatches": [
            {
                "id": 469199,
                "title": "Buddha Kat Winery Chardonnay",
                "description": "We barrel ferment our Chardonnay and age it in a mix of Oak and Stainless. Giving this light bodied wine modest oak character, a delicate floral aroma, and a warming finish.",
                "price": "$25.0",
                "imageUrl": "https://img.spoonacular.com/products/469199-312x231.jpg",
                "averageRating": 0.8,
                "ratingCount": 1.0,
                "score": 0.55,
                "link": "https://www.amazon.com/2015-Buddha-Kat-Winery-Chardonnay/dp/B00OSAVVM4?tag=spoonacular-20"
            }
        ]
    }
}
Quotas
Calling this endpoint requires 1 point and 0.1 points if includeNutrition is true + 1 point if addWinePairing is true and + 0.5 points if addTasteData is true.. Learn more about quotas.
Need Help? Just ask!


Get Recipe Information Bulk
Get information about multiple recipes at once. This is equivalent to calling the Get Recipe Information endpoint multiple times, but faster.

GET https://api.spoonacular.com/recipes/informationBulk
Headers
Response Headers:

Content-Type: application/json
Parameters
Name	Type	Example	Description
ids	string	715538,716429	A comma-separated list of recipe ids.
includeNutrition	boolean	false	Include nutrition data to the recipe information. Nutrition data is per serving. If you want the nutrition data for the entire recipe, just multiply by the number of servings.
Example Request and Response
GET https://api.spoonacular.com/recipes/informationBulk?ids=715538,716429
[
    {/* recipe data as in Get Recipe Information endpoint */},
    {/* recipe data as in Get Recipe Information endpoint */}
]
Quotas
Calling this endpoint requires 1 point for the first recipe and 0.5 points for every additional recipe returned. Learn more about quotas.

