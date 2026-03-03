/**
 * AEM WebMCP Recipe Generator
 * Generates recipes based on user-provided ingredients
 * Uses spec-compliant MCP-B tool registration
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

    // MCP-B Spec-Compliant Tool Definitions
    const MCP_TOOLS = {
        generateRecipes: {
            name: "generateRecipes",
            description: "Generate recipe suggestions based on available ingredients. Returns a list of matching recipes sorted by ingredient relevance.",
            inputSchema: {
                type: "object",
                properties: {
                    ingredients: {
                        type: "array",
                        items: { type: "string" },
                        description: "List of ingredients available to cook with"
                    },
                    filters: {
                        type: "object",
                        properties: {
                            vegetarian: { type: "boolean", description: "Filter for vegetarian recipes" },
                            quick: { type: "boolean", description: "Filter for quick recipes under 30 minutes" },
                            healthy: { type: "boolean", description: "Filter for healthy recipes" }
                        },
                        description: "Optional filters to apply"
                    }
                },
                required: ["ingredients"]
            }
        },
        getRecipeDetails: {
            name: "getRecipeDetails",
            description: "Get detailed information about a specific recipe including full ingredients list and step-by-step instructions.",
            inputSchema: {
                type: "object",
                properties: {
                    recipeName: {
                        type: "string",
                        description: "Name of the recipe to get details for"
                    }
                },
                required: ["recipeName"]
            }
        },
        searchRecipes: {
            name: "searchRecipes",
            description: "Search recipes by name or ingredient keyword.",
            inputSchema: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search query - can match recipe name or ingredients"
                    }
                },
                required: ["query"]
            }
        }
    };

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

            // Register MCP-B spec-compliant tools
            this.registerMCPTools();
        }

        /**
         * Register tools using MCP-B spec-compliant approach
         * Supports both native navigator.modelContext and fallback
         */
        registerMCPTools() {
            const tools = [
                {
                    name: "generateRecipes",
                    description: "Generate recipe suggestions based on available ingredients",
                    inputSchema: MCP_TOOLS.generateRecipes.inputSchema,
                    handler: (params) => this.handleGenerateRecipes(params)
                },
                {
                    name: "getRecipeDetails", 
                    description: "Get detailed information about a specific recipe",
                    inputSchema: MCP_TOOLS.getRecipeDetails.inputSchema,
                    handler: (params) => this.handleGetRecipeDetails(params)
                },
                {
                    name: "searchRecipes",
                    description: "Search recipes by name or ingredient",
                    inputSchema: MCP_TOOLS.searchRecipes.inputSchema,
                    handler: (params) => this.handleSearchRecipes(params)
                }
            ];

            // Try native WebMCP first (navigator.modelContext)
            if (window.navigator?.modelContext) {
                this.registerWithNativeModelContext(tools);
            }
            
            // Also register with our fallback automator
            if (window.AEMWebMCPAutomator) {
                this.registerWithAutomator(tools);
            }

            // Expose globally for direct access
            window.AEMWebMCP = window.AEMWebMCP || {};
            window.AEMWebMCP.RecipeGenerator = {
                generate: (ingredients, filters) => this.handleGenerateRecipes({ ingredients, filters }),
                getDetails: (name) => this.handleGetRecipeDetails({ recipeName: name }),
                search: (query) => this.handleSearchRecipes({ query }),
                getAllRecipes: () => RECIPE_DATABASE.map(r => r.name)
            };
        }

        /**
         * Register with native navigator.modelContext (WebMCP spec)
         */
        registerWithNativeModelContext(tools) {
            try {
                const registeredTools = tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    handle: tool.handler
                }));

                if (window.navigator.modelContext.register) {
                    window.navigator.modelContext.register(registeredTools);
                    console.log('[MCP-B] Registered tools with native navigator.modelContext');
                }
            } catch (e) {
                console.warn('[MCP-B] Native registration failed:', e);
            }
        }

        /**
         * Register with fallback automator
         */
        registerWithAutomator(tools) {
            tools.forEach(tool => {
                window.AEMWebMCPAutomator.registerTool({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.inputSchema
                }, tool.handler);
            });
        }

        // Tool Handlers
        handleGenerateRecipes(params) {
            const { ingredients = [], filters = {} } = params;
            
            const recipes = RECIPE_DATABASE.filter(recipe => {
                if (filters.vegetarian && !recipe.vegetarian) return false;
                if (filters.quick && !recipe.quick) return false;
                if (filters.healthy && !recipe.healthy) return false;

                if (ingredients.length === 0) return true;

                const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase());
                return ingredients.some(ing => 
                    recipeIngredients.some(ri => ri.includes(ing.toLowerCase()) || ing.toLowerCase().includes(ri))
                );
            }).sort((a, b) => {
                const aMatches = ingredients.filter(ing => 
                    a.ingredients.some(ai => ai.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(ai.toLowerCase()))
                ).length;
                const bMatches = ingredients.filter(ing => 
                    b.ingredients.some(bi => bi.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(bi.toLowerCase()))
                ).length;
                return bMatches - aMatches;
            });

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        count: recipes.length,
                        recipes: recipes.map(r => ({
                            name: r.name,
                            time: r.time,
                            servings: r.servings,
                            difficulty: r.difficulty,
                            matchCount: ingredients.filter(ing => 
                                r.ingredients.some(ri => ri.toLowerCase().includes(ing.toLowerCase()))
                            ).length
                        }))
                    }, null, 2)
                }]
            };
        }

        handleGetRecipeDetails(params) {
            const { recipeName } = params;
            const recipe = RECIPE_DATABASE.find(r => 
                r.name.toLowerCase() === recipeName.toLowerCase()
            );

            if (!recipe) {
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({ success: false, error: "Recipe not found" }, null, 2)
                    }]
                };
            }

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ success: true, recipe }, null, 2)
                }]
            };
        }

        handleSearchRecipes(params) {
            const { query } = params;
            const lowerQuery = query.toLowerCase();

            const recipes = RECIPE_DATABASE.filter(r => 
                r.name.toLowerCase().includes(lowerQuery) ||
                r.ingredients.some(i => i.toLowerCase().includes(lowerQuery))
            );

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        count: recipes.length,
                        recipes: recipes.map(r => ({ name: r.name, ingredients: r.ingredients }))
                    }, null, 2)
                }]
            };
        }

        generateRecipes() {
            const ingredientsText = this.ingredientsInput.value.toLowerCase();
            const ingredients = ingredientsText.split(',').map(i => i.trim()).filter(i => i);
            
            const filters = {
                vegetarian: this.element.querySelector('#vegetarian')?.checked || false,
                quick: this.element.querySelector('#quick')?.checked || false,
                healthy: this.element.querySelector('#healthy')?.checked || false
            };

            const result = this.handleGenerateRecipes({ ingredients, filters });
            const data = JSON.parse(result.content[0].text);
            
            this.displayRecipes(data.recipes);
        }

        displayRecipes(recipes) {
            const existing = this.resultsContainer.querySelectorAll('.recipe-card:not(.template)');
            existing.forEach(el => el.remove());

            if (!recipes || recipes.length === 0) {
                this.resultsContainer.style.display = 'none';
                this.noResults.style.display = 'block';
                return;
            }

            this.resultsContainer.style.display = 'block';
            this.noResults.style.display = 'none';

            recipes.forEach(recipeData => {
                const recipe = RECIPE_DATABASE.find(r => r.name === recipeData.name);
                if (!recipe) return;

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

})(document, window);
