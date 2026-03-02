# AEM WebMCP - API Reference

## JavaScript API

### Global Object: `AEMWebMCP`

The `AEMWebMCP` object is automatically available on any page with WebMCP enabled.

#### Page Actions

##### `getPageInfo()`
Get current page information.

```javascript
const info = AEMWebMCP.getPageInfo();
// Returns: { title, url, path, components }
```

##### `getComponents(category?)`
Get all interactive components on the page.

```javascript
// All components
const all = AEMWebMCP.getComponents();

// Filter by category
const forms = AEMWebMCP.getComponents('form');
const commerce = AEMWebMCP.getComponents('commerce');
```

#### Search

##### `search(query)`
Perform a site search.

```javascript
AEMWebMCP.search('products');
```

##### `getSearchResults()`
Get current search results.

```javascript
const results = AEMWebMCP.getSearchResults();
```

#### Form Actions

##### `fillForm(selector, value)`
Fill a form field.

```javascript
AEMWebMCP.fillForm('input[name="email"]', 'user@example.com');
AEMWebMCP.fillForm('#password', 'secret123');
```

##### `submitForm(selector)`
Submit a form.

```javascript
AEMWebMCP.submitForm('form');
AEMWebMCP.submitForm('#contact-form');
```

##### `getFormFields(selector)`
Get all fields in a form.

```javascript
const fields = AEMWebMCP.getFormFields('form');
// Returns: { success, fields: [{ name, type, required }] }
```

#### Navigation

##### `navigate(url)`
Navigate to a URL.

```javascript
AEMWebMCP.navigate('/products');
```

##### `clickElement(selector)`
Click an element.

```javascript
AEMWebMCP.clickElement('.btn-primary');
```

#### Commerce

##### `addToCart(selector, quantity?)`
Add product to cart.

```javascript
AEMWebMCP.addToCart('.product', 2);
```

##### `updateCartQuantity(selector, quantity)`
Update cart item quantity.

```javascript
AEMWebMCP.updateCartQuantity('.cart-item', 5);
```

#### Layout Interactions

##### `interactComponent(selector, action, options?)`
Interact with a component.

```javascript
// Accordion
AEMWebMCP.interactComponent('.accordion', 'expand');
AEMWebMCP.interactComponent('.accordion', 'collapse');

// Tabs
AEMWebMCP.interactComponent('.tabs', 'select-tab', { index: 1 });

// Carousel
AEMWebMCP.interactComponent('.carousel', 'next');
AEMWebMCP.interactComponent('.carousel', 'prev');
AEMWebMCP.interactComponent('.carousel', 'go-to-slide', { index: 2 });
```

#### Utility

##### `getElementInfo(selector)`
Get detailed element information.

```javascript
const info = AEMWebMCP.getElementInfo('.my-element');
// Returns: { tag, id, classes, attributes, text, webmcp }
```

##### `waitForElement(selector, timeout?)`
Wait for element to appear.

```javascript
await AEMWebMCP.waitForElement('.dynamic-content', 5000);
```

##### `getAccessibilityTree()`
Get accessibility tree for screen readers/AI.

```javascript
const tree = AEMWebMCP.getAccessibilityTree();
// Returns: { pageTitle, landmarks, tree }
```

## Configuration Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `WEBMCP_ENABLED` | boolean | `true` | Enable/disable WebMCP |
| `WEBMCP_DEBUG` | boolean | `false` | Enable debug logging |
| `WEBMCP_SHOW_PANEL` | boolean | `false` | Show debug panel |
| `WEBMCP_CONSENT` | boolean | `false` | Consent for AI agent API |
| `WEBMCP_AUTO_CONSENT` | boolean | `false` | Auto-consent (dev only) |

## Data Attributes

Components are enhanced with these attributes:

| Attribute | Description |
|-----------|-------------|
| `data-webmcp-action` | Action type (search, form, cart, etc.) |
| `data-webmcp-category` | Category (commerce, navigation, form, etc.) |
| `data-webmcp-description` | Human-readable description |
| `data-webmcp-interactions` | Available interactions |
| `data-webmcp-data` | JSON structured data |
| `data-webmcp-disabled` | Disable enhancement |

## Categories

- `commerce` - Search, Cart, Product
- `navigation` - Navigation, Breadcrumb, Language Nav
- `content` - Text, Title, Image, Teaser
- `layout` - Accordion, Tabs, Carousel
- `form` - Form fields
- `media` - PDF Viewer
- `experience` - Experience Fragment

## Interactions by Component

### Accordion
- `expand` - Expand item
- `collapse` - Collapse item
- `expand-all` - Expand all items

### Tabs
- `select-tab` - Select tab by index
- `next` - Go to next tab
- `prev` - Go to previous tab

### Carousel
- `next` - Next slide
- `prev` - Previous slide
- `go-to-slide` - Jump to slide by index

### Form
- `submit` - Submit form
- `reset` - Reset form

### Cart
- `update-quantity` - Update item qty
- `remove-item` - Remove item
- `checkout` - Proceed to checkout
