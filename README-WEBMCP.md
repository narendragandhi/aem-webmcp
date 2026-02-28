# AEM WebMCP - AI Agent Ready

> **Google WebMCP (Web Model Context Protocol) integration for AEM Core Components**

This project provides automatic WebMCP integration for AEM sites built with Adobe Experience Manager Core Components. It enables AI agents to interact with your site in a structured, reliable way - no custom component development required.

## What is WebMCP?

WebMCP (Web Model Context Protocol) is a new browser API being developed by Google that allows websites to expose structured tools to AI agents. Instead of AI agents clicking around blindly, they can:

- ✅ Understand site structure and components
- ✅ Fill forms with proper field validation
- ✅ Navigate precisely without guessing
- ✅ Perform complex e-commerce actions
- ✅ Get structured data from components

## Features

### 🤖 Automatic Component Detection
Automatically detects and enhances **50+ AEM Core Components**:

| Category | Components |
|----------|------------|
| **Commerce** | Search, Cart, Product, Featured Products |
| **Navigation** | Navigation, Language Navigation, Breadcrumb |
| **Content** | Text, Title, Image, Teaser, Download, Embed, Content Fragment |
| **Layout** | Container, Accordion, Tabs, Carousel, Progress Bar, Separator, TOC |
| **Forms** | Form Container, Text, Button, Hidden, Options |
| **Media** | PDF Viewer |
| **Experience** | Experience Fragment |

### 🚀 Zero Configuration
- Auto-loaded via clientlib on every page
- Works with any Core Components already on your page
- No custom components needed

### 🔧 Rich Interactions
AI agents can perform actions like:
- Navigate to any page
- Fill and submit forms
- Search the site
- Add products to cart
- Expand/collapse accordions
- Switch tabs
- Carousel navigation

## Installation

```bash
# Build the project
cd aem-webmcp
mvn clean install

# Deploy to AEM (author)
cd all
mvn install -PautoInstallSinglePackage -Daem.host=localhost -Daem.port=4502
```

## Usage

### For AI Agents (when WebMCP is enabled)

Once deployed, AI agents with WebMCP support can:

```javascript
// Get all components on page
AEMWebMCP.getComponents()

// Get page info
AEMWebMCP.getPageInfo()

// Search the site
AEMWebMCP.search('products')

// Find a form and fill it
AEMWebMCP.fillForm('input[name="email"]', 'user@example.com')
AEMWebMCP.submitForm('form')

// Navigate to a page
AEMWebMCP.navigate('/products')
```

### For Developers

The WebMCP automation runs automatically. All Core Components on your page will be enhanced with:

```html
<!-- Automatically added attributes -->
<div data-webmcp-action="search"
     data-webmcp-description="Site search functionality"
     data-webmcp-category="commerce"
     data-webmcp-interactions="submit,clear"
     data-webmcp-data="{&quot;query&quot;:&quot;...&quot;}">
```

### Configuration

#### Enable Debug Mode
Add to your page or console:
```javascript
window.WEBMCP_DEBUG = true;
```

#### Enable Debug Panel
To visualize all detected WebMCP components on the page:
```javascript
window.WEBMCP_SHOW_PANEL = true;
```
This displays an overlay panel showing:
- Total components detected
- Components by category
- Each component's action, category, and description

#### Disable for Specific Components
Add to any element:
```html
<div data-webmcp-disabled="true">
    <!-- This component won't be enhanced -->
</div>
```

## Architecture

```
aem-webmcp/
├── core/                          # Java bundle
├── ui.apps/
│   └── src/main/content/jcr_root/
│       └── apps/aem-webmcp/
│           ├── clientlibs/
│           │   └── clientlib-webmcp/
│           │       └── js/webmcp.js    # Main WebMCP automation
│           └── components/
│               └── page/
│                   └── customfooterlibs.html  # Loads WebMCP
├── ui.content/                    # Sample content
├── all/                           # Combined package
└── dispatcher/                    # AEM dispatcher config
```

## How It Works

1. **Page Load**: WebMCP JS initializes after DOM is ready
2. **Component Detection**: Scans page for Core Components by:
   - `data-cq-resource-path` attribute
   - `data-resource-type` attribute  
   - `core-wcm-components-*` CSS classes
3. **Attribute Enhancement**: Adds WebMCP attributes with:
   - Action type (search, form, cart, etc.)
   - Description
   - Available interactions
   - Structured data from component
4. **API Exposure**: Registers actions with browser's `navigator.modelContext`

## Supported Components Reference

### Commerce
- `core/wcm/components/search` → Search functionality
- `core/wcm/components/cart` → Shopping cart
- `core/wcm/components/product` → Product display
- `core/wcm/components/featuredproducts` → Featured products

### Navigation  
- `core/wcm/components/navigation` → Main navigation menu
- `core/wcm/components/languagenavigation` → Language selector
- `core/wcm/components/breadcrumb` → Breadcrumb trail

### Content
- `core/wcm/components/text` → Rich text
- `core/wcm/components/title` → Heading/title
- `core/wcm/components/image` → Image
- `core/wcm/components/teaser` → Teaser
- `core/wcm/components/download` → Download
- `core/wcm/components/embed` → Embedded content

### Layout
- `core/wcm/components/container` → Container/parsys
- `core/wcm/components/accordion` → Accordion
- `core/wcm/components/tabs` → Tabbed panels
- `core/wcm/components/carousel` → Carousel/slider

### Forms
- `core/wcm/components/form/container` → Form container
- `core/wcm/components/form/text` → Text input
- `core/wcm/components/form/button` → Button
- `core/wcm/components/form/options` → Radio/checkbox/select

## Browser Support

- **WebMCP Enabled Browsers**: Chrome with `--enable-features=WebMCPExperimentalFlag` (Early Preview)
- **Fallback**: Site works normally in all browsers - WebMCP features are opt-in

## Requirements

- AEM as a Cloud Service or AEM 6.5+
- AEM Core Components 2.0+
- Maven 3.6+

## License

Apache License 2.0

## Resources

- [WebMCP Documentation](https://developer.chrome.com/blog/webmcp-epp)
- [AEM Core Components](https://github.com/adobe/aem-core-wcm-components)
- [WebMCP W3C Spec](https://github.com/WICG/web-mcp)

---

Built with ❤️ for the agentic web
