# AEM WebMCP Demo Script

## Demo Overview
**Duration:** 3-5 minutes
**Goal:** Show AI agent autonomously interacting with an AEM site using WebMCP

---

## Scene 1: Introduction (30 seconds)

> "Imagine telling an AI agent: 'Find our contact form and submit an inquiry.' Instead of clicking around blindly, it sees ALL your components and interacts precisely."

**[SHOW: Browser with demo page loaded]**

---

## Scene 2: Component Discovery (45 seconds)

**Action:** Open browser console, run:

```javascript
// In console - show all components discovered
const components = AEMWebMCP.getComponents();
console.table(components.map(c => ({
  category: c.category,
  action: c.action,
  interactions: c.interactions?.join(', ')
})));
```

**Say:** "Our JavaScript automatically detects 70+ AEM Core Components. Every button, form, cart - it's all discoverable."

**[SHOW: Console table with component list]**

---

## Scene 3: Search Functionality (30 seconds)

**Action:** Show search works

```javascript
// Search for products
const results = await AEMWebMCP.search('widget');
console.log(`Found ${results.total} results:`, results.results);
```

**Say:** "AI agents can search your site intelligently - not just Google search, but YOUR site's content."

---

## Scene 4: Form Filling (60 seconds) ⭐ MAIN EVENT

**Action:** Fill and submit contact form

```javascript
// 1. Find the form
const form = AEMWebMCP.findComponent('form')[0];
console.log('Found form:', form);

// 2. Fill fields
AEMWebMCP.fillForm('input[name="fullName"]', 'John Smith');
AEMWebMCP.fillForm('input[name="email"]', 'john@example.com');
AEMWebMCP.fillForm('textarea[name="message"]', 'Hi, interested in a demo!');
AEMWebMCP.fillForm('select[name="department"]', 'sales');

// 3. Submit
const result = await AEMWebMCP.submitForm('form');
console.log('Submission result:', result);
```

**Say:** "Watch this - I'm telling the AI: 'Submit a contact form for a demo.' It finds the form, fills every field correctly, and submits. That's 6 interactions - handled precisely."

**[SHOW: Form gets filled in real-time, submit, show success response]**

---

## Scene 5: E-commerce Demo (45 seconds)

**Action:** Add product to cart

```javascript
// Find product and add to cart
await AEMWebMCP.addToCart({
  productId: 'premium-widget',
  productName: 'Premium Widget',
  price: 49.99,
  quantity: 2
});

// View cart
const cart = await AEMWebMCP.getCart();
console.log('Cart:', cart);
```

**Say:** "E-commerce works the same way. 'Add 2 premium widgets to cart.' Done. AI agents can now handle shopping - opening huge possibilities for voice commerce."

---

## Scene 6: Behind the Scenes (30 seconds)

**Action:** Show WebMCP attributes

```javascript
// Show what's added to DOM
document.querySelector('[data-webmcp-category]')
```

**Say:** "We add these data attributes to every component. That's the WebMCP API - structured, typed, discoverable. No screen scraping, no guessing."

**[SHOW: HTML with data-webmcp-* attributes]**

---

## Scene 7: Enterprise Features (30 seconds)

**Say:** "But it's not just cool - it's production-ready:"

- CSRF protection ✓
- Rate limiting ✓  
- Input validation ✓
- PII-safe logging ✓
- JCR persistence option ✓
- OSGi configurable ✓

---

## Closing (15 seconds)

> "AEM WebMCP - the first enterprise integration for AI agents with Adobe Experience Manager. Build once, AI-ready forever."

**[SHOW: GitHub/Repo URL]**

---

## Backup / Q&A Scenarios

### "How is this different from chatbots?"
> "Traditional chatbots can't 'see' your site. This gives AI agents X-ray vision into your actual components."

### "Does it slow down the site?"
> "It's a lightweight clientlib - <10KB. Loads in parallel, no blocking."

### "Is it secure?"
> "Enterprise-grade: CSRF, rate limiting, input sanitization. We take security seriously."

### "What AEM versions?"
> "AEM as a Cloud Service and 6.5+. Core Components 2.0+."

---

## Technical Setup for Demo

```bash
# Deploy to AEM
cd aem-webmcp/all
mvn install -PautoInstallSinglePackage \
  -Daem.host=localhost -Daem.port=4502

# Demo URLs
http://localhost:4502/content/aem-webmcp/us/en.html          # Home
http://localhost:4502/content/aem-webmcp/us/en/contact.html # Forms
http://localhost:4502/content/aem-webmcp/us/en/shop.html   # Commerce

# Enable debug to show panel
window.WEBMCP_SHOW_PANEL = true;
```
