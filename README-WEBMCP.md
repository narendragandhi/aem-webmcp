# AEM WebMCP - AI Agent Ready

> **Google WebMCP (Web Model Context Protocol) integration for AEM Core Components**

This project provides automatic WebMCP integration for AEM sites built with Adobe Experience Manager Core Components. It enables AI agents to interact with your site in a structured, reliable way.

## What is WebMCP?

WebMCP (Web Model Context Protocol) is a browser API being developed by Google that allows websites to expose structured tools to AI agents. Instead of AI agents clicking around blindly, they can:
- ✅ Understand site structure and components
- ✅ Fill forms with proper field validation
- ✅ Navigate precisely without guessing
- ✅ Perform complex e-commerce actions
- ✅ Get structured data from components

---

## Quick Start

### Option 1: Quick Demo (5 minutes)

```bash
# Clone and build
git clone <repo-url>
cd aem-webmcp
mvn clean install -DskipTests

# Deploy to local AEM author
cd all
mvn install -PautoInstallSinglePackage -Daem.host=localhost -Daem.port=4502

# Visit demo pages
# http://localhost:4502/content/aem-webmcp/us/en.html
```

### Option 2: Add to Existing AEM Project

```bash
# Add as dependency to your all/pom.xml
<dependency>
    <groupId>com.aem</groupId>
    <artifactId>aem-webmcp.all</artifactId>
    <version>1.0.0</version>
    <type>zip</type>
</dependency>
```

---

## Integration Guide

### How to Integrate with Your AEM Project

There are three ways to add WebMCP to your AEM project:

#### 1. Embedded Integration (Recommended for New Projects)

Add to your core bundle's `pom.xml`:

```xml
<dependency>
    <groupId>com.aem</groupId>
    <artifactId>aem-webmcp.core</artifactId>
    <version>1.0.0</version>
</dependency>
```

And add to your content package's `pom.xml`:

```xml
<dependency>
    <groupId>com.aem</groupId>
    <artifactId>aem-webmcp.ui.apps</artifactId>
    <version>1.0.0</version>
    <type>zip</type>
</dependency>
```

#### 2. Overlay Integration (Recommended for Existing Sites)

Copy only the clientlib to your project:

```bash
# Copy the WebMCP clientlib to your project
cp -r ui.apps/src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp \
      ui.apps/src/main/content/jcr_root/apps/<your-project>/clientlibs/
```

Then include it in your page component:

```html
<sly data-sly-call="${clientlib.js @ categories='<your-project>.webmcp'}" />
```

#### 3. Standalone Package (Quickest)

Deploy the pre-built package to your AEM:

```bash
# Upload to AEM Package Manager
# Or use curl
curl -u admin:admin -F package=@aem-webmcp.all-1.0.0.zip \
  http://localhost:4502/crx/packmgr/service.jsp
```

---

## Configuration

### OSGi Configuration

Create configuration at `ui.config/src/main/content/jcr_root/apps/aem-webmcp/config/org.apache.felix.http.cfg.json`:

```json
{
  "webmcp.enabled": true,
  "webmcp.debug": false,
  "webmcp.consentRequired": true,
  "commerce.mockData": true,
  "commerce.maxCartItems": 50,
  "commerce.cartTimeoutMinutes": 30,
  "form.rateLimitPerMinute": 10,
  "search.maxResults": 20
}
```

### Feature Flags

Control features via system properties or OSGi:

| Property | Default | Description |
|----------|---------|-------------|
| `webmcp.enabled` | `true` | Enable/disable WebMCP |
| `webmcp.debug` | `false` | Enable debug logging |
| `webmcp.consentRequired` | `true` | Require user consent |
| `commerce.mockData` | `true` | Use mock commerce data |

### JavaScript Configuration

```javascript
// In your site footer or clientlib
window.AEM_WEBMC_CONFIG = {
    enabled: true,
    debug: false,
    consentRequired: true,
    excludedComponents: ['/my-custom-component/'],
    componentMapping: {
        // Custom component mappings
    }
};
```

---

## Best Practices

### 1. Gradual Rollout

```javascript
// Start with debug mode on author only
window.WEBMCP_DEBUG = window.location.hostname.includes('author');
```

### 2. Consent Management

```javascript
// Before WebMCP initializes
window.addEventListener('webmcp:beforeinit', function(e) {
    if (!hasUserConsent()) {
        e.preventDefault();
    }
});

function hasUserConsent() {
    // Your consent logic
    return localStorage.getItem('webmcp-consent') === 'true';
}
```

### 3. Performance

The WebMCP clientlib should be loaded:
- **At end of page** (before `</body>`)
- **Deferred** to not block rendering
- **Only on pages** that need AI interaction

### 4. Security

- ✅ CSRF protection enabled by default
- ✅ Rate limiting on all endpoints
- ✅ Input sanitization on all inputs
- ✅ PII not logged

For production, ensure:
```json
{
  "webmcp.consentRequired": true,
  "form.rateLimitPerMinute": 10
}
```

---

## Component Mapping Reference

### Automatic Detection

The following AEM Core Components are automatically detected:

| Category | Resource Type | Action | Interactions |
|----------|---------------|--------|--------------|
| **Search** | `core/wcm/components/search` | search | submit, clear |
| **Cart** | `core/wcm/components/cart` | shopping-cart | add, remove, update |
| **Form** | `core/wcm/components/form/*` | form | submit, reset |
| **Navigation** | `core/wcm/components/navigation` | navigation | navigate, expand |
| **Breadcrumb** | `core/wcm/components/breadcrumb` | breadcrumb | navigate |
| **Language Nav** | `core/wcm/components/languagenavigation` | language-nav | select |
| **Accordion** | `core/wcm/components/accordion` | accordion | expand, collapse |
| **Tabs** | `core/wcm/components/tabs` | tabs | select |
| **Carousel** | `core/wcm/components/carousel` | carousel | next, prev, play |

### Custom Component Mapping

To add WebMCP support to custom components:

```javascript
AEMWebMCP.registerComponent('my-project/components/product-card', {
    category: 'commerce',
    action: 'product',
    description: 'Product card with add to cart',
    interactions: ['add-to-cart', 'view-details'],
    getData: function(el) {
        return {
            name: el.dataset.productName,
            price: el.dataset.productPrice,
            sku: el.dataset.productSku
        };
    }
});
```

---

## API Reference

### JavaScript API

```javascript
// Initialize
AEMWebMCP.init();

// Get all components
const components = AEMWebMCP.getComponents();

// Search
AEMWebMCP.search('query').then(results => console.log(results));

// Form operations
AEMWebMCP.fillForm('input[name="email"]', 'test@example.com');
AEMWebMCP.submitForm('form');

// Cart operations  
AEMWebMCP.addToCart({ productId: '123', quantity: 1 });

// Navigate
AEMWebMCP.navigate('/content/mysite/products.html');
```

### Events

```javascript
// WebMCP initialized
window.addEventListener('webmcp:ready', () => console.log('Ready!'));

// Component discovered
window.addEventListener('webmcp:component', (e) => {
    console.log('Found:', e.detail);
});

// Error occurred
window.addEventListener('webmcp:error', (e) => {
    console.error('Error:', e.detail);
});
```

---

## Troubleshooting

### Components Not Detected

1. Check Core Components are loaded
2. Verify clientlib is included
3. Enable debug: `window.WEBMCP_DEBUG = true`

### Forms Not Submitting

1. Check network tab for errors
2. Verify CSRF token is present
3. Check rate limiting not triggered

### AI Agent Not Working

1. Verify WebMCP browser flag enabled
2. Check browser console for errors
3. Verify consent given: `navigator.modelContext` exists

### Performance Issues

1. Disable debug mode in production
2. Exclude components that don't need WebMCP
3. Use lazy loading for clientlib

---

## Frequently Asked Questions

### Q: Does this work with AEM Forms?
Yes! All AEM Forms Core Components are supported including text, textarea, date, dropdown, checkbox, radio, and file upload.

### Q: Can I use this with AEM Commerce (CIF)?
Yes, but you'll need to configure the commerce endpoints. The demo uses mock data by default.

### Q: Is this secure?
Yes. Features include:
- CSRF protection
- Rate limiting
- Input sanitization
- No PII logging
- Consent requirement option

### Q: What browsers support WebMCP?
Currently Chrome with experimental flags. The JavaScript API works in all browsers - AI agent features require WebMCP support.

### Q: How do I disable WebMCP for specific components?
```html
<div data-webmcp-disabled="true">...</div>
```

---

## Migration Guide

### From Version 1.0 to 2.0

1. Update dependencies
2. Review new OSGi config options
3. Test rate limiting settings
4. Update consent handling if used

---

## Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs` folder
- **Demo**: `/content/aem-webmcp/us/en.html`

---

## Architecture

```
aem-webmcp/
├── core/                          # OSGi bundle
│   └── src/main/java/
│       └── aemwebmcp/core/
│           ├── servlets/          # REST endpoints
│           ├── models/            # Sling models
│           └── services/          # OSGi services
├── ui.apps/
│   └── src/main/content/jcr_root/
│       └── apps/aem-webmcp/
│           ├── clientlibs/        # WebMCP JavaScript
│           └── components/        # Demo components
├── ui.config/                     # OSGi configurations
├── ui.content/                    # Sample content
└── all/                          # Combined package
```

---

## Requirements

- AEM as a Cloud Service or AEM 6.5+
- AEM Core Components 2.0+
- Maven 3.6+
- Java 11+

---

## License

Apache License 2.0

---

Built for the agentic web 🚀
