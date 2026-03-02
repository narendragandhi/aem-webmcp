# AEM WebMCP - Getting Started Guide

This guide will help you get up and running with AEM WebMCP quickly.

## Prerequisites

- AEM 6.5+ or AEM as a Cloud Service
- AEM Core Components 2.0+
- Maven 3.6+

## Quick Start

### 1. Build and Deploy

```bash
# Clone and build
git clone <repo-url>
cd aem-webmcp
mvn clean install -DskipTests

# Deploy to AEM Author (localhost:4502)
cd all
mvn install -PautoInstallSinglePackage -Daem.host=localhost -Daem.port=4502

# Or deploy to AEM Publish
mvn install -PautoInstallSinglePackage -Daem.host=localhost -Daem.port=4503
```

### 2. Configure Your Site

Option A: Use the AEM WebMCP Page component:
```
sling:resourceSuperType = aem-webmcp/components/page
```

Option B: Add clientlibs to existing page:
```html
<sly data-sly-use.clientlib="core/wcm/components/commons/v1/templates/clientlib.html">
    <sly data-sly-call="${clientlib.js @ categories='aem-webmcp.base'}"/>
</sly>
```

### 3. Verify Installation

1. Visit any page on your AEM instance
2. Open browser console
3. Run: `AEMWebMCP.getPageInfo()`
4. You should see page info returned

Or enable debug panel:
```javascript
window.WEBMCP_SHOW_PANEL = true;
```

## Demo Page

After installation, visit:
- `/content/aem-webmcp/us/en.html`

This demo page showcases:
- Search component
- Contact form (text, email, options, button)
- Accordion with FAQ
- Tabs
- Teasers
- Download
- Breadcrumb

## Using with AI Agents

### Browser Console

```javascript
// Initialize agent
const agent = new AEMWebMCPAgent();

// Discover components
await agent.discover();

// Run demo
await agent.demoJourney();
```

### Programmatic Usage

```javascript
// Get all components
const components = AEMWebMCP.getComponents();

// Filter by category
const forms = AEMWebMCP.getComponents('form');

// Search
AEMWebMCP.search('products');

// Fill form
AEMWebMCP.fillForm('input[name="email"]', 'user@example.com');
AEMWebMCP.submitForm('form');

// Interact
AEMWebMCP.interact('.accordion', 'expand');
AEMWebMCP.interact('.tabs', 'select-tab', { index: 1 });
```

## Configuration

### Enable Debug Mode
```javascript
window.WEBMCP_DEBUG = true;
```

### Show Debug Panel
```javascript
window.WEBMCP_SHOW_PANEL = true;
```

### Disable WebMCP Completely
```javascript
window.WEBMCP_ENABLED = false;
```

### Consent-Based API Exposure
By default, WebMCP exposes actions via `navigator.modelContext`. To enable:
```javascript
// Opt-in to expose WebMCP actions to AI agents
window.WEBMCP_CONSENT = true;

// Or auto-consent (for development only)
window.WEBMCP_AUTO_CONSENT = true;
```

### Disable for Specific Elements
```html
<div data-webmcp-disabled="true">
    <!-- This won't be enhanced -->
</div>
```

## Building

### Standard Build
```bash
mvn clean install
```

### Production Build
Skips tests and uses higher CVSS threshold:
```bash
mvn clean install -Pproduction
```

### Skip OWASP Check
```bash
mvn clean install -Dowasp.skip=true
```

### Set NVD API Key
Get a free key from https://nvd.nist.gov/developers/request-an-api-key
```bash
export NVD_API_KEY=your-key-here
mvn clean install
```

### Build Profiles

| Profile | Purpose |
|---------|---------|
| default | Full build with tests |
| production | Optimized for production (skip tests, CVSS 9+) |
| autoInstallBundle | Deploy bundle only to AEM |
| autoInstallPackage | Deploy content package to AEM |

## Testing

### Unit Tests
```bash
mvn test -pl core
```

### Integration Tests
```bash
mvn verify -Plocal -pl it.tests
```

### E2E Tests
```bash
cd ui.tests/test-module
npm install
npm test
```

## JSON-LD Structured Data

The package automatically adds JSON-LD to your pages:
- WebSite with search action
- WebPage with breadcrumbs
- AI Agent capabilities

This improves SEO and enables AI agents to understand your site.

## Supported Components

| Category | Components |
|----------|------------|
| Commerce | Search, Cart, Product, Featured Products |
| Navigation | Navigation, Language Nav, Breadcrumb |
| Content | Text, Title, Image, Teaser, Download, Embed |
| Layout | Container, Accordion, Tabs, Carousel |
| Forms | Form, Text, Button, Hidden, Options |
| Media | PDF Viewer |
| Experience | Experience Fragment |

## Troubleshooting

### WebMCP not loading?
- Check browser console for errors
- Verify clientlibs are loaded: `document.querySelectorAll('[data-webmcp-action]').length`

### Components not detected?
- Ensure Core Components are on the page
- Check element has `data-resource-type` or `data-cq-resource-path`

### Debug panel not showing?
- Set `window.WEBMCP_SHOW_PANEL = true` in console
- Refresh the page

## Next Steps

1. Deploy to your AEM environment
2. Test with the demo page
3. Try the sample AI agent: `docs/sample-agent.js`
4. Enable debug panel to see all components
5. Check JSON-LD in page source

## Resources

- [WebMCP Documentation](https://developer.chrome.com/blog/webmcp-epp)
- [AEM Core Components](https://github.com/adobe/aem-core-wcm-components)
- [WebMCP W3C Spec](https://github.com/WICG/web-mcp)
