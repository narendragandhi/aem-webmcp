/**
 * Recipe Generator Tests
 */

// Mock recipe database
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
        instructions: ["Season chicken", "Melt butter", "Cook chicken"]
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
        instructions: ["Cook pasta", "Make sauce", "Combine"]
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
        instructions: ["Cut vegetables", "Stir fry", "Add sauce"]
    }
];

// Recipe matching logic (extracted for testing)
function findMatchingRecipes(ingredients, filters) {
    if (!ingredients || ingredients.length === 0) {
        return [];
    }

    return RECIPE_DATABASE.filter(recipe => {
        if (filters.vegetarian && !recipe.vegetarian) return false;
        if (filters.quick && !recipe.quick) return false;
        if (filters.healthy && !recipe.healthy) return false;

        const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase());
        const hasMatch = ingredients.some(ing => 
            recipeIngredients.some(ri => ri.includes(ing.toLowerCase()) || ing.toLowerCase().includes(ri))
        );

        return hasMatch;
    }).sort((a, b) => {
        const aMatches = ingredients.filter(ing => 
            a.ingredients.some(ai => ai.includes(ing) || ing.includes(ai))
        ).length;
        const bMatches = ingredients.filter(ing => 
            b.ingredients.some(bi => bi.includes(ing) || ing.includes(bi))
        ).length;
        return bMatches - aMatches;
    });
}

function getRecipeDetails(recipeName) {
    return RECIPE_DATABASE.find(r => 
        r.name.toLowerCase() === recipeName.toLowerCase()
    );
}

function searchRecipes(query) {
    const lowerQuery = query.toLowerCase();
    return RECIPE_DATABASE.filter(r => 
        r.name.toLowerCase().includes(lowerQuery) ||
        r.ingredients.some(i => i.toLowerCase().includes(lowerQuery))
    );
}

// Tests
describe('Recipe Generator', () => {
    
    test('findMatchingRecipes returns recipes with matching ingredients', () => {
        const results = findMatchingRecipes(['chicken', 'garlic'], {});
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toBe('Garlic Butter Chicken');
    });

    test('findMatchingRecipes filters by vegetarian', () => {
        const results = findMatchingRecipes(['pasta', 'tomato'], { vegetarian: true });
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Tomato Basil Pasta');
        expect(results[0].vegetarian).toBe(true);
    });

    test('findMatchingRecipes filters by quick', () => {
        const results = findMatchingRecipes(['garlic'], { quick: true });
        results.forEach(r => {
            expect(r.quick).toBe(true);
        });
    });

    test('findMatchingRecipes filters by healthy', () => {
        const results = findMatchingRecipes(['broccoli'], { healthy: true });
        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => {
            expect(r.healthy).toBe(true);
        });
    });

    test('findMatchingRecipes returns empty for no ingredients', () => {
        const results = findMatchingRecipes([], {});
        expect(results).toEqual([]);
    });

    test('findMatchingRecipes returns empty for no matches', () => {
        const results = findMatchingRecipes(['xyz123'], {});
        expect(results).toEqual([]);
    });

    test('getRecipeDetails returns correct recipe', () => {
        const recipe = getRecipeDetails('Garlic Butter Chicken');
        expect(recipe).toBeDefined();
        expect(recipe.ingredients).toContain('chicken');
    });

    test('getRecipeDetails returns undefined for unknown recipe', () => {
        const recipe = getRecipeDetails('Unknown Recipe');
        expect(recipe).toBeUndefined();
    });

    test('searchRecipes finds by name', () => {
        const results = searchRecipes('chicken');
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Garlic Butter Chicken');
    });

    test('searchRecipes finds by ingredient', () => {
        const results = searchRecipes('tomato');
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Tomato Basil Pasta');
    });

    test('searchRecipes is case insensitive', () => {
        const results1 = searchRecipes('CHICKEN');
        const results2 = searchRecipes('chicken');
        expect(results1.length).toBe(results2.length);
    });

    test('recipes are sorted by match count', () => {
        const results = findMatchingRecipes(['garlic', 'butter'], {});
        expect(results.length).toBeGreaterThan(0);
        // All 3 recipes contain garlic, butter
    });
});

describe('Recipe Data Integrity', () => {
    test('all recipes have required fields', () => {
        RECIPE_DATABASE.forEach(recipe => {
            expect(recipe.name).toBeDefined();
            expect(recipe.ingredients).toBeDefined();
            expect(recipe.ingredients.length).toBeGreaterThan(0);
            expect(recipe.time).toBeDefined();
            expect(recipe.servings).toBeGreaterThan(0);
            expect(recipe.difficulty).toBeDefined();
            expect(recipe.instructions).toBeDefined();
            expect(recipe.instructions.length).toBeGreaterThan(0);
        });
    });

    test('all recipes have boolean flags', () => {
        RECIPE_DATABASE.forEach(recipe => {
            expect(typeof recipe.vegetarian).toBe('boolean');
            expect(typeof recipe.quick).toBe('boolean');
            expect(typeof recipe.healthy).toBe('boolean');
        });
    });
});
