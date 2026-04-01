# AEM WebMCP Use Cases

This document provides practical examples of how to use AEM WebMCP for various automation and AI-agent scenarios.

## Table of Contents

1. [Form Automation](#1-form-automation)
2. [Content Discovery & Extraction](#2-content-discovery--extraction)
3. [E-Commerce Integration](#3-e-commerce-integration)
4. [Accessibility Auditing](#4-accessibility-auditing)
5. [Content Publishing Workflows](#5-content-publishing-workflows)
6. [Multi-Language Content Management](#6-multi-language-content-management)
7. [Performance Monitoring](#7-performance-monitoring)

---

## 1. Form Automation

### Use Case: Automated Lead Capture Form Submission

AI agents can discover and fill forms on AEM pages automatically.

```javascript
// Initialize WebMCP
const webmcp = new WebMCP({
  debug: true,
  timeout: 30000
});

// Discover forms on the page
const forms = await webmcp.discoverComponents('form');

// Find the lead capture form
const leadForm = forms.find(f => f.id === 'lead-capture-form');

// Fill form fields
await webmcp.agents.form.fill(leadForm, {
  'firstName': 'John',
  'lastName': 'Doe',
  'email': 'john.doe@example.com',
  'company': 'Acme Corp',
  'phone': '+1-555-0123'
});

// Submit the form
const result = await webmcp.agents.form.submit(leadForm);
console.log('Form submitted:', result.success);
```

### Use Case: Multi-Step Form Wizard

```javascript
// Handle multi-step forms
const wizard = await webmcp.discoverComponents('wizard')[0];

// Step 1: Personal Information
await webmcp.agents.form.fillStep(wizard, 1, {
  'name': 'Jane Smith',
  'email': 'jane@example.com'
});
await webmcp.agents.form.nextStep(wizard);

// Step 2: Preferences
await webmcp.agents.form.fillStep(wizard, 2, {
  'newsletter': true,
  'productUpdates': true
});
await webmcp.agents.form.nextStep(wizard);

// Step 3: Confirmation
await webmcp.agents.form.submit(wizard);
```

---

## 2. Content Discovery & Extraction

### Use Case: Extract Product Information

```javascript
// Discover all product components
const products = await webmcp.discoverComponents('product');

// Extract product data
const productData = products.map(product => ({
  name: product.getAttribute('data-product-name'),
  price: product.getAttribute('data-product-price'),
  sku: product.getAttribute('data-product-sku'),
  description: product.textContent,
  images: product.querySelectorAll('img').map(img => img.src)
}));

console.log('Found products:', productData);
```

### Use Case: Content Inventory

```javascript
// Get full page content structure
const contentTree = await webmcp.agents.content.getStructure();

// Find all headings
const headings = contentTree.filter(node =>
  ['h1', 'h2', 'h3'].includes(node.tagName)
);

// Find all links
const links = contentTree.filter(node => node.tagName === 'a');

// Find all images
const images = contentTree.filter(node => node.tagName === 'img');

// Generate content report
const report = {
  totalComponents: contentTree.length,
  headings: headings.length,
  links: links.length,
  images: images.length,
  structure: contentTree
};
```

---

## 3. E-Commerce Integration

### Use Case: Automated Cart Management

```javascript
// Search for products
const searchResults = await webmcp.commerce.search('laptop');

// Add first product to cart
const product = searchResults[0];
await webmcp.commerce.addToCart(product.sku, 1);

// Get cart contents
const cart = await webmcp.commerce.getCart();
console.log('Cart total:', cart.total);

// Update quantity
await webmcp.commerce.updateQuantity(product.sku, 2);

// Apply discount code
await webmcp.commerce.applyDiscount('SAVE10');

// Proceed to checkout
const checkoutUrl = await webmcp.commerce.checkout();
```

### Use Case: Price Monitoring

```javascript
// Monitor product prices
const watchlist = ['SKU001', 'SKU002', 'SKU003'];

async function checkPrices() {
  const prices = {};

  for (const sku of watchlist) {
    const product = await webmcp.commerce.getProduct(sku);
    prices[sku] = {
      name: product.name,
      currentPrice: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount
    };
  }

  return prices;
}

// Schedule regular price checks
setInterval(checkPrices, 3600000); // Every hour
```

---

## 4. Accessibility Auditing

### Use Case: WCAG Compliance Check

```javascript
// Run accessibility audit
const audit = await webmcp.agents.audit.accessibility({
  standard: 'WCAG2.1',
  level: 'AA'
});

// Check results
console.log('Accessibility Score:', audit.score);
console.log('Violations:', audit.violations);
console.log('Warnings:', audit.warnings);

// Get detailed violation info
audit.violations.forEach(violation => {
  console.log(`
    Rule: ${violation.rule}
    Impact: ${violation.impact}
    Elements: ${violation.elements.length}
    Fix: ${violation.fix}
  `);
});
```

### Use Case: Automated Accessibility Fixes

```javascript
// Get fixable accessibility issues
const issues = await webmcp.agents.audit.getFixableIssues();

// Auto-fix issues (generates code suggestions)
const fixes = issues.map(issue => ({
  element: issue.selector,
  currentCode: issue.currentHTML,
  suggestedCode: issue.suggestedHTML,
  rule: issue.rule
}));

// Export fixes for implementation
await webmcp.export(fixes, 'accessibility-fixes.json');
```

---

## 5. Content Publishing Workflows

### Use Case: Bulk Content Review

```javascript
// Get all pages pending review
const pendingPages = await webmcp.content.getPendingReview();

// Check each page
for (const page of pendingPages) {
  // Navigate to page
  await webmcp.navigate(page.path);

  // Run quality checks
  const quality = await webmcp.agents.audit.quality();

  // Check for broken links
  const links = await webmcp.agents.audit.links();

  // Check images
  const images = await webmcp.agents.audit.images();

  // Generate review report
  const report = {
    path: page.path,
    qualityScore: quality.score,
    brokenLinks: links.broken,
    missingAlt: images.missingAlt,
    recommendation: quality.score > 80 ? 'approve' : 'revise'
  };

  console.log('Page review:', report);
}
```

### Use Case: Scheduled Publishing

```javascript
// Set up scheduled publish
const publishSchedule = {
  pages: ['/content/site/campaign-page'],
  publishDate: '2024-03-15T09:00:00Z',
  unpublishDate: '2024-03-31T23:59:59Z',
  notifyOnComplete: ['editor@example.com']
};

await webmcp.content.schedulePublish(publishSchedule);
```

---

## 6. Multi-Language Content Management

### Use Case: Translation Status Check

```javascript
// Get translation status for all languages
const languages = ['en', 'de', 'fr', 'es', 'ja'];
const basePath = '/content/site/products';

const translationStatus = {};

for (const lang of languages) {
  const pages = await webmcp.content.getPages(`${basePath}/${lang}`);

  translationStatus[lang] = {
    totalPages: pages.length,
    translated: pages.filter(p => p.status === 'translated').length,
    pending: pages.filter(p => p.status === 'pending').length,
    outdated: pages.filter(p => p.status === 'outdated').length
  };
}

console.log('Translation Status:', translationStatus);
```

### Use Case: Language Navigation Testing

```javascript
// Test language switcher functionality
const languageNav = await webmcp.discoverComponents('languagenavigation')[0];

// Get available languages
const availableLanguages = languageNav.querySelectorAll('a');

// Test each language link
for (const langLink of availableLanguages) {
  const lang = langLink.getAttribute('hreflang');
  const href = langLink.getAttribute('href');

  // Verify link is valid
  const response = await fetch(href, { method: 'HEAD' });

  console.log(`${lang}: ${response.ok ? 'OK' : 'BROKEN'} - ${href}`);
}
```

---

## 7. Performance Monitoring

### Use Case: Core Web Vitals Tracking

```javascript
// Monitor Core Web Vitals
const vitals = await webmcp.performance.getCoreWebVitals();

console.log('Core Web Vitals:', {
  LCP: vitals.largestContentfulPaint,
  FID: vitals.firstInputDelay,
  CLS: vitals.cumulativeLayoutShift,
  FCP: vitals.firstContentfulPaint,
  TTFB: vitals.timeToFirstByte
});

// Check against thresholds
const thresholds = {
  LCP: 2500,  // Good: < 2.5s
  FID: 100,   // Good: < 100ms
  CLS: 0.1    // Good: < 0.1
};

const issues = [];
if (vitals.largestContentfulPaint > thresholds.LCP) {
  issues.push('LCP needs improvement');
}
if (vitals.firstInputDelay > thresholds.FID) {
  issues.push('FID needs improvement');
}
if (vitals.cumulativeLayoutShift > thresholds.CLS) {
  issues.push('CLS needs improvement');
}

console.log('Performance Issues:', issues);
```

### Use Case: Component Load Time Analysis

```javascript
// Analyze component load times
const components = await webmcp.discoverComponents();

const loadTimes = await Promise.all(
  components.map(async (component) => {
    const timing = await webmcp.performance.getComponentTiming(component.id);
    return {
      id: component.id,
      type: component.type,
      loadTime: timing.duration,
      renderTime: timing.renderTime
    };
  })
);

// Sort by load time (slowest first)
loadTimes.sort((a, b) => b.loadTime - a.loadTime);

console.log('Slowest Components:', loadTimes.slice(0, 5));
```

---

## Integration Examples

### With Claude AI Agent

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Use WebMCP tools with Claude
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  tools: webmcp.getToolDefinitions(),
  messages: [{
    role: 'user',
    content: 'Find and fill out the contact form on this page with test data'
  }]
});
```

### With Playwright for Testing

```javascript
import { test, expect } from '@playwright/test';

test('WebMCP form automation', async ({ page }) => {
  await page.goto('https://example.com/contact');

  // Initialize WebMCP
  await page.evaluate(() => {
    window.webmcp = new WebMCP({ debug: true });
  });

  // Use WebMCP to fill form
  await page.evaluate(async () => {
    const forms = await window.webmcp.discoverComponents('form');
    await window.webmcp.agents.form.fill(forms[0], {
      name: 'Test User',
      email: 'test@example.com'
    });
  });

  // Verify form was filled
  await expect(page.locator('#name')).toHaveValue('Test User');
});
```

---

## Best Practices

1. **Always wait for page load** before discovering components
2. **Use appropriate timeouts** for async operations
3. **Handle errors gracefully** with try/catch blocks
4. **Respect rate limits** when making multiple requests
5. **Cache component references** when working with the same components repeatedly
6. **Use debug mode** during development for detailed logging
7. **Test in staging** before running automations in production

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Components not discovered | Ensure page is fully loaded; check component data attributes |
| Form submission fails | Verify CSRF token handling; check form validation |
| Slow performance | Enable caching; reduce component discovery scope |
| Authentication required | Use session handling or API tokens |

---

For more examples and API documentation, see the [README](../README.md).
