# AEM WebMCP AI Components Tutorial

This tutorial covers the new AI-powered components that leverage WebMCP, MediaPipe, and LiteRT for client-side AI capabilities.

## Overview

AEM WebMCP includes two AI-powered components:

| Component | Feature | Technology |
|-----------|---------|------------|
| Recipe Generator | Suggest recipes from ingredients | Local JavaScript |
| Image Tagger | Auto-tag images with objects | MediaPipe ML |

## Prerequisites

- AEM WebMCP package installed
- Chrome 146+ (for native WebMCP) or any modern browser
- Optional: WebGPU for faster ML inference

---

## Recipe Generator

### What It Does

The Recipe Generator suggests recipes based on ingredients you have. AI agents can programmatically generate recipes.

### Using in AEM

1. Create a new page or edit an existing one
2. Add the "Recipe Generator" component from AEM WebMCP group
3. Configure as needed

### Programmatic Usage

```javascript
// Get all available recipes
AEMWebMCP.RecipeGenerator.getAllRecipes();
// Returns: ["Garlic Butter Chicken", "Tomato Basil Pasta", ...]

// Generate recipes from ingredients
const result = AEMWebMCP.RecipeGenerator.generate(
    ["chicken", "garlic", "butter"],  // ingredients
    { vegetarian: false, quick: true } // filters
);
console.log(result.recipes); // Array of matching recipes
```

### WebMCP Tools (for AI Agents)

```javascript
// AI Agent can call:
generateRecipes({
    ingredients: ["pasta", "tomato", "basil"],
    filters: { vegetarian: true }
})
// Returns recipe suggestions

getRecipeDetails({ recipeName: "Tomato Basil Pasta" })
// Returns full recipe with instructions

searchRecipes({ query: "chicken" })
// Search by name or ingredient
```

### Filter Options

| Filter | Description |
|--------|-------------|
| vegetarian | Only vegetarian recipes |
| quick | Under 30 minutes |
| healthy | Low-fat/healthy options |

---

## Image Tagger

### What It Does

Automatically detects and tags objects in images using MediaPipe machine learning - entirely client-side.

### Using in AEM

1. Add the "Image Tagger" component
2. Users can upload images or drag-and-drop
3. Tags are generated automatically with confidence scores

### Programmatic Usage

```javascript
// Tag an image (base64 or URL)
const result = AEMWebMCP.ImageTagger.tag(imageData, { maxResults: 10 });
console.log(result.tags);
// [{name: "person", confidence: "98.5%"}, {name: "car", confidence: "87.2%"}, ...]

// Get last analysis
AEMWebMCP.ImageTagger.getLastResults();

// Search by tag
AEMWebMCP.ImageTagger.search("person");
```

### WebMCP Tools (for AI Agents)

```javascript
tagImage({ imageData: "...", maxResults: 5 })
getImageTags()
searchByTag({ tag: "vehicle" })
```

### Use Cases

- **DAM Auto-tagging**: Automatically tag uploaded assets
- **Accessibility**: Generate alt text descriptions
- **Content Moderation**: Detect inappropriate content
- **Search Enhancement**: Improve asset discoverability

---

## WebMCP & AI Agents

### Native WebMCP (Chrome 146+)

```javascript
// Check if native WebMCP is available
if (navigator.modelContext) {
    // Tools are automatically registered
    navigator.modelContext.getContext().then(ctx => {
        console.log('Available tools:', ctx.tools);
    });
}
```

### Fallback API (All Browsers)

```javascript
// AEMWebMCP is always available
AEMWebMCP.getPageInfo();
AEMWebMCP.getComponents();
AEMWebMCP.fillForm(selector, value);
```

### MCP-B Compliance

The components use MCP-B spec-compliant tool registration:

```javascript
// Tools registered with:
{
    name: "generateRecipes",
    description: "Generate recipe suggestions...",
    inputSchema: {
        type: "object",
        properties: {
            ingredients: { type: "array", items: { type: "string" } },
            filters: { type: "object" }
        }
    }
}
```

---

## MediaPipe & LiteRT

### MediaPipe Integration

The Image Tagger uses MediaPipe for on-device ML:

```javascript
// MediaPipe loads automatically from CDN
// Uses MobileNet model for classification
// Falls back to basic classification if unavailable
```

### LiteRT (TensorFlow Lite for Web)

LiteRT is available for more advanced ML:

```javascript
import { loadLiteRt } from '@litertjs/core';

// Load LiteRT runtime
await loadLiteRt('https://cdn.jsdelivr.net/npm/@litertjs/core/wasm/');
```

### Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebMCP (native) | 146+ | - | - | 146+ |
| MediaPipe | ✅ | ✅ | ✅ | ✅ |
| LiteRT (WASM) | ✅ | ✅ | ✅ | ✅ |
| WebGPU | 113+ | ✅ | ✅ | ✅ |

---

## Example: AI Agent Workflow

```javascript
// Example: AI Agent helping user cook dinner

// 1. Ask user for ingredients
const userIngredients = ["chicken", "rice", "garlic", "tomato"];

// 2. Generate recipes
const recipes = AEMWebMCP.RecipeGenerator.generate(userIngredients, {});

// 3. User selects a recipe
const recipe = recipes.recipes[0];

// 4. Get full details
const details = AEMWebMCP.RecipeGenerator.getRecipe(recipe.name);

// 5. Display to user
console.log(details.recipe.instructions);
```

---

## Troubleshooting

### Image Tagger Not Working

1. Check browser console for errors
2. Ensure WebGPU is available (or it falls back gracefully)
3. Try a smaller image (< 5MB)

### WebMCP Tools Not Available

1. Enable consent: `window.WEBMCP_CONSENT = true`
2. Use Chrome 146+ for native support
3. Fallback API always works: `AEMWebMCP.RecipeGenerator.generate()`

### MediaPipe Load Failure

- Falls back to basic classification
- Check network connectivity to CDN

---

## Next Steps

1. Try the demo: `/content/aem-webmcp/us/en.html`
2. Test browser demo: `test-site/components-test.html`
3. Explore API: Open browser console and try `AEMWebMCP.RecipeGenerator.getAllRecipes()`

## Resources

- [WebMCP Documentation](https://developer.chrome.com/blog/webmcp-epp)
- [MediaPipe Vision](https://developers.google.com/mediapipe/solutions/vision/image_classifier)
- [LiteRT for Web](https://ai.google.dev/edge/litert/web)
- [MCP-B Packages](https://www.npmjs.com/org/mcp-b)
