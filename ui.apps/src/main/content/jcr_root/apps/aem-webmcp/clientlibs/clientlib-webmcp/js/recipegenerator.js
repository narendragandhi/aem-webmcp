/**
 * AEM WebMCP Recipe Generator
 * Generates recipes based on user-provided ingredients
 * Exposes WebMCP tools for AI agent interaction
 */

(function(document, window) {
    'use strict';

    const RECIPE_DATABASE = [
        {
            name: "Garlic Butter Chicken",
            ingredients: ["chicken", "garlic", "butter", "salt", "pepper", "rosemary"],
            time: "25 min",
            servings: 4,
            difficulty: "Easy",
            vegetarian: false,
            quick: true,
            healthy: false,
            instructions: [
                "Season chicken breasts with salt and pepper",
                "Melt butter in a large skillet over medium-high heat",
                "Add minced garlic and cook for 1 minute",
                "Add chicken and cook 6-7 minutes per side",
                "Add rosemary and baste with garlic butter",
                "Rest for 5 minutes before serving"
            ]
        },
        {
            name: "Tomato Basil Pasta",
            ingredients: ["pasta", "tomato", "basil", "garlic", "olive oil", "parmesan"],
            time: "20 min",
            servings: 4,
            difficulty: "Easy",
            vegetarian: true,
            quick: true,
            healthy: true,
            instructions: [
                "Cook pasta according to package directions",
                "Sauté garlic in olive oil until fragrant",
                "Add diced tomatoes and simmer for 10 minutes",
                "Toss with cooked pasta",
                "Garnish with fresh basil and parmesan"
            ]
        },
        {
            name: "Vegetable Stir Fry",
            ingredients: ["broccoli", "carrot", "bell pepper", "soy sauce", "garlic", "ginger"],
            time: "15 min",
            servings: 3,
            difficulty: "Easy",
            vegetarian: true,
            quick: true,
            healthy: true,
            instructions: [
                "Cut all vegetables into bite-sized pieces",
                "Heat oil in a wok over high heat",
                "Add garlic and ginger, stir for 30 seconds",
                "Add vegetables in order of cooking time",
                "Add soy sauce and toss to combine",
                "Serve immediately over rice"
            ]
        },
        {
            name: "Classic Beef Tacos",
            ingredients: ["beef", "taco shells", "lettuce", "tomato", "cheese", "sour cream"],
            time: "20 min",
            servings: 4,
            difficulty: "Easy",
            vegetarian: false,
            quick: true,
            healthy: false,
            instructions: [
                "Brown ground beef in a skillet",
                "Add taco seasoning and water, simmer 5 minutes",
                "Warm taco shells according to package",
                "Fill shells with beef",
                "Top with lettuce, tomato, cheese, sour cream"
            ]
        },
        {
            name: "Mediterranean Salad",
            ingredients: ["cucumber", "tomato", "feta", "olive oil", "lemon", "oregano"],
            time: "10 min",
            servings: 2,
            difficulty: "Easy",
            vegetarian: true,
            quick: true,
            healthy: true,
            instructions: [
                "Chop cucumber and tomato into cubes",
                "Combine in a bowl with olives",
                "Crumble feta cheese on top",
                "Drizzle with olive oil and lemon juice",
                "Season with oregano, salt and pepper"
            ]
        },
        {
            name: "Chicken Fried Rice",
            ingredients: ["chicken", "rice", "egg", "soy sauce", "carrot", "peas"],
            time: "25 min",
            servings: 4,
            difficulty: "Medium",
            vegetarian: false,
            quick: false,
            healthy: false,
            instructions: [
                "Cook rice and let cool (day-old rice works best)",
                "Scramble eggs and set aside",
                "Cook diced chicken until done",
                "Add vegetables and stir fry 3 minutes",
                "Add rice and soy sauce",
                "Fold in eggs and serve hot"
            ]
        },
        {
            name: "Mushroom Risotto",
            ingredients: ["rice", "mushroom", "onion", "white wine", "parmesan", "butter"],
            time: "40 min",
            servings: 4,
            difficulty: "Medium",
            vegetarian: true,
            quick: false,
            healthy: false,
            instructions: [
                "Sauté onion and mushrooms in butter",
                "Add rice and toast for 2 minutes",
                "Add wine and let absorb",
                "Add warm broth one ladle at a time",
                "Stir continuously until rice is creamy",
                "Finish with parmesan and butter"
            ]
        },
        {
            name: "Grilled Salmon",
            ingredients: ["salmon", "lemon", "garlic", "dill", "olive oil", "asparagus"],
            time: "20 min",
            servings: 2,
            difficulty: "Medium",
            vegetarian: false,
            quick: true,
            healthy: true,
            instructions: [
                "Marinate salmon with lemon, garlic, dill, olive oil",
                "Preheat grill to medium-high",
                "Grill salmon 4 minutes per side",
                "Grill asparagus alongside",
                "Serve with lemon wedges"
            ]
        },
        {
            name: "Banana Pancakes",
            ingredients: ["banana", "egg", "flour", "milk", "sugar", "butter"],
            time: "15 min",
            servings: 2,
            difficulty: "Easy",
            vegetarian: true,
            quick: true,
            healthy: false,
            instructions: [
                "Mash banana in a bowl",
                "Mix in egg, flour, milk, sugar",
                "Heat butter in a skillet",
                "Pour batter to form pancakes",
                "Flip when bubbles form",
                "Serve with maple syrup"
            ]
        },
        {
            name: "Shrimp Scampi",
            ingredients: ["shrimp", "pasta", "garlic", "white wine", "butter", "lemon"],
            time: "20 min",
            servings: 4,
            difficulty: "Easy",
            vegetarian: false,
            quick: true,
            healthy: false,
            instructions: [
                "Cook pasta according to package",
                "Sauté garlic in butter",
                "Add shrimp and cook until pink",
                "Add wine and lemon juice",
                "Toss with pasta",
                "Garnish with parsley"
            ]
        }
    ];

    class RecipeGenerator {
        constructor(element) {
            this.element = element;
            this.ingredientsInput = element.querySelector('#ingredients');
            this.resultsContainer = element.querySelector('#recipe-results');
            this.noResults = element.querySelector('.no-results');
            this.template = element.querySelector('.recipe-card.template');
            
            this.init();
        }

        init() {
            const generateBtn = this.element.querySelector('.generate-btn');
            if (generateBtn) {
                generateBtn.addEventListener('click', () => this.generateRecipes());
            }

            // Register WebMCP tools
            this.registerWebMTools();
        }

        registerWebMTools() {
            if (window.AEMWebMCPAutomator) {
                window.AEMWebMCPAutomator.registerTool({
                    name: "generateRecipes",
                    description: "Generate recipe suggestions based on available ingredients",
                    parameters: {
                        type: "object",
                        properties: {
                            ingredients: {
                                type: "array",
                                items: { type: "string" },
                                description: "List of ingredients available"
                            },
                            filters: {
                                type: "object",
                                properties: {
                                    vegetarian: { type: "boolean" },
                                    quick: { type: "boolean" },
                                    healthy: { type: "boolean" }
                                },
                                description: "Optional filters"
                            }
                        },
                        required: ["ingredients"]
                    }
                }, (params) => this.generateRecipesFromAI(params));

                window.AEMWebMCPAutomator.registerTool({
                    name: "getRecipeDetails",
                    description: "Get detailed information about a specific recipe",
                    parameters: {
                        type: "object",
                        properties: {
                            recipeName: {
                                type: "string",
                                description: "Name of the recipe"
                            }
                        },
                        required: ["recipeName"]
                    }
                }, (params) => this.getRecipeDetails(params.recipeName));
            }
        }

        generateRecipes() {
            const ingredientsText = this.ingredientsInput.value.toLowerCase();
            const ingredients = ingredientsText.split(',').map(i => i.trim()).filter(i => i);
            
            const filters = {
                vegetarian: this.element.querySelector('#vegetarian')?.checked || false,
                quick: this.element.querySelector('#quick')?.checked || false,
                healthy: this.element.querySelector('#healthy')?.checked || false
            };

            const recipes = this.findMatchingRecipes(ingredients, filters);
            this.displayRecipes(recipes);
        }

        generateRecipesFromAI(params) {
            const ingredients = params.ingredients || [];
            const filters = params.filters || {};
            
            const recipes = this.findMatchingRecipes(ingredients, filters);
            
            return {
                success: true,
                count: recipes.length,
                recipes: recipes.map(r => ({
                    name: r.name,
                    time: r.time,
                    servings: r.servings,
                    difficulty: r.difficulty,
                    ingredients: r.ingredients,
                    instructions: r.instructions
                }))
            };
        }

        getRecipeDetails(recipeName) {
            const recipe = RECIPE_DATABASE.find(r => 
                r.name.toLowerCase() === recipeName.toLowerCase()
            );
            
            if (recipe) {
                return { success: true, recipe };
            }
            return { success: false, error: "Recipe not found" };
        }

        findMatchingRecipes(ingredients, filters) {
            if (!ingredients || ingredients.length === 0) {
                return [];
            }

            return RECIPE_DATABASE.filter(recipe => {
                // Check filters
                if (filters.vegetarian && !recipe.vegetarian) return false;
                if (filters.quick && !recipe.quick) return false;
                if (filters.healthy && !recipe.healthy) return false;

                // Check ingredient match (at least one ingredient must match)
                const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase());
                const hasMatch = ingredients.some(ing => 
                    recipeIngredients.some(ri => ri.includes(ing) || ing.includes(ri))
                );

                return hasMatch;
            }).sort((a, b) => {
                // Sort by number of matching ingredients
                const aMatches = ingredients.filter(ing => 
                    a.ingredients.some(ai => ai.includes(ing) || ing.includes(ai))
                ).length;
                const bMatches = ingredients.filter(ing => 
                    b.ingredients.some(bi => bi.includes(ing) || ing.includes(bi))
                ).length;
                return bMatches - aMatches;
            });
        }

        displayRecipes(recipes) {
            // Clear existing recipes (keep template)
            const existing = this.resultsContainer.querySelectorAll('.recipe-card:not(.template)');
            existing.forEach(el => el.remove());

            if (recipes.length === 0) {
                this.resultsContainer.style.display = 'none';
                this.noResults.style.display = 'block';
                return;
            }

            this.resultsContainer.style.display = 'block';
            this.noResults.style.display = 'none';

            recipes.forEach(recipe => {
                const card = this.template.cloneNode(true);
                card.classList.remove('template');
                
                card.querySelector('.recipe-title').textContent = recipe.name;
                card.querySelector('.time').textContent = `⏱ ${recipe.time}`;
                card.querySelector('.servings').textContent = `👥 ${recipe.servings} servings`;
                card.querySelector('.difficulty').textContent = `📊 ${recipe.difficulty}`;
                
                const ingredientsList = card.querySelector('.recipe-ingredients ul');
                recipe.ingredients.forEach(ing => {
                    const li = document.createElement('li');
                    li.textContent = ing;
                    ingredientsList.appendChild(li);
                });
                
                const instructionsList = card.querySelector('.recipe-instructions ol');
                recipe.instructions.forEach(inst => {
                    const li = document.createElement('li');
                    li.textContent = inst;
                    instructionsList.appendChild(li);
                });
                
                this.resultsContainer.appendChild(card);
            });
        }
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        const generators = document.querySelectorAll('.aem-webmcp-recipegenerator');
        generators.forEach(el => new RecipeGenerator(el));
    });

    // Expose for AI agents
    window.AEMWebMCP = window.AEMWebMCP || {};
    window.AEMWebMCP.RecipeGenerator = {
        generate: (ingredients, filters) => {
            const gen = new RecipeGenerator(document.querySelector('.aem-webmcp-recipegenerator'));
            return gen.generateRecipesFromAI({ ingredients, filters });
        },
        getRecipe: (name) => {
            const gen = new RecipeGenerator(document.querySelector('.aem-webmcp-recipegenerator'));
            return gen.getRecipeDetails(name);
        },
        getAllRecipes: () => RECIPE_DATABASE.map(r => r.name)
    };

})(document, window);
