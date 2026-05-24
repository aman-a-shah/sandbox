Search recipes
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/complexSearch?query=side%20salad&diet=vegetarian&intolerances=gluten&includeIngredients=cheese%2Cnuts&excludeIngredients=eggs&instructionsRequired=true&fillIngredients=false&addRecipeInformation=false&addRecipeInstructions=false&addRecipeNutrition=false&maxReadyTime=45&ignorePantry=true&sort=max-used-ingredients&offset=0&number=10' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'


Search recipes by ingredients
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?ingredients=apples%2Cflour%2Csugar&number=5&ignorePantry=true&ranking=1' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

get recipe info
curl --request GET \
	--url https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/479101/information \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'


get recipe info bulk
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk?ids=456%2C987%2C321' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

get similar recipe
curl --request GET \
	--url https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/156992/similar \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

autocomplete recipe search
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/autocomplete?number=10&query=chicken' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

price breakdown by id
curl --request GET \
	--url https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/1003464/priceBreakdownWidget.json \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

curl --request GET \
	--url https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/1003464/ingredientWidget.json \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

get analyzed recipe instructions
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/324694/analyzedInstructions?stepBreakdown=true' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

extract recipe from website
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/extract?url=http%3A%2F%2Fwww.melskitchencafe.com%2Fthe-best-fudgy-brownies%2F' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

summarize recipe
curl --request GET \
	--url https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/4632/summary \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

analyze a recipe search query
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/queries/analyze?q=salmon%20with%20fusilli%20and%20no%20nuts' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'


guess nutrition by name
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/guessNutrition?title=Spaghetti%20Aglio%20et%20Olio' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

ingredient search
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/ingredients/search?query=yogurt&addChildren=true&minProteinPercent=5&maxProteinPercent=50&minFatPercent=1&maxFatPercent=10&minCarbsPercent=5&maxCarbsPercent=30&metaInformation=false&intolerances=egg&sort=calories&sortDirection=asc&offset=0&number=10' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

get ingredient info
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/ingredients/9266/information?amount=150&unit=grams' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'


compute ingredient amount
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/ingredients/16223/amount?nutrient=protein&target=10&unit=oz' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

convert amounts
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/convert?ingredientName=flour&sourceUnit=cups&targetUnit=grams&sourceAmount=2.5' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

autocomplete ingredient search
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/ingredients/autocomplete?query=appl&number=10&intolerances=egg' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

search menu items
curl --request GET \
	--url 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/menuItems/search?query=burger&offset=0&number=10&minCalories=0&maxCalories=5000&minProtein=0&maxProtein=100&minFat=0&maxFat=100&minCarbs=0&maxCarbs=100' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'

get menu info 
curl --request GET \
	--url https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/menuItems/%7Bid%7D \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: spoonacular-recipe-food-nutrition-v1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 551df33a04msh7ee4bc555c8e406p119393jsnc4c748f687c7'
