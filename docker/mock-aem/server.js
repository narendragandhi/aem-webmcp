/**
 * Mock AEM Server for WebMCP E2E Testing
 * Provides endpoints that mimic AEM behavior for testing purposes
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4502;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session storage (in-memory for testing)
const sessions = new Map();
const cart = { items: [] };
const searchIndex = [];

// Static content serving
app.use('/content', express.static(path.join(__dirname, 'content')));
app.use('/apps', express.static(path.join(__dirname, 'apps')));
app.use('/libs', express.static(path.join(__dirname, 'libs')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Login page
app.get('/libs/granite/core/content/login.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>AEM Login</title></head>
    <body>
      <form action="/libs/granite/core/content/login.html/j_security_check" method="POST">
        <input type="text" name="j_username" id="username" />
        <input type="password" name="j_password" id="password" />
        <button type="submit" id="submit-button">Sign In</button>
      </form>
    </body>
    </html>
  `);
});

// Login handler
app.post('/libs/granite/core/content/login.html/j_security_check', (req, res) => {
  const { j_username, j_password } = req.body;

  if (j_username === 'admin' && j_password === 'admin') {
    const sessionId = Math.random().toString(36).substring(7);
    sessions.set(sessionId, { user: j_username, created: Date.now() });
    res.cookie('login-token', sessionId);
    res.redirect('/aem/start.html');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// AEM Start page
app.get('/aem/start.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>AEM Start</title></head>
    <body>
      <h1>Welcome to AEM</h1>
      <nav>
        <a href="/content/aem-webmcp/us/en.html">WebMCP Demo</a>
      </nav>
    </body>
    </html>
  `);
});

// Mock WebMCP demo pages
app.get('/content/aem-webmcp/us/en.html', (req, res) => {
  res.send(generateDemoPage('Home', `
    <div class="cmp-navigation" data-cmp-is="navigation" data-webmcp-action="navigation" data-webmcp-category="navigation">
      <ul>
        <li><a href="/content/aem-webmcp/us/en.html">Home</a></li>
        <li><a href="/content/aem-webmcp/us/en/contact.html">Contact</a></li>
        <li><a href="/content/aem-webmcp/us/en/products.html">Products</a></li>
      </ul>
    </div>

    <div class="cmp-search" data-cmp-is="search" data-webmcp-action="search" data-webmcp-category="commerce">
      <input type="search" placeholder="Search..." />
      <button type="submit">Search</button>
    </div>

    <div class="cmp-text" data-cmp-is="text" data-webmcp-action="content" data-webmcp-category="content">
      <p>Welcome to AEM WebMCP Demo. This page demonstrates AI agent integration with AEM Core Components.</p>
    </div>

    <div class="cmp-accordion" data-cmp-is="accordion" data-webmcp-action="accordion" data-webmcp-category="layout">
      <div class="cmp-accordion__item">
        <h3 class="cmp-accordion__header">What is WebMCP?</h3>
        <div class="cmp-accordion__panel">
          <p>WebMCP is a protocol for AI agents to interact with websites.</p>
        </div>
      </div>
      <div class="cmp-accordion__item">
        <h3 class="cmp-accordion__header">How does it work?</h3>
        <div class="cmp-accordion__panel">
          <p>It automatically detects and enhances AEM Core Components.</p>
        </div>
      </div>
    </div>

    <div class="cmp-carousel" data-cmp-is="carousel" data-webmcp-action="carousel" data-webmcp-category="layout">
      <div class="cmp-carousel__content">
        <div class="cmp-carousel__item">Slide 1</div>
        <div class="cmp-carousel__item">Slide 2</div>
        <div class="cmp-carousel__item">Slide 3</div>
      </div>
      <button class="cmp-carousel__prev">Previous</button>
      <button class="cmp-carousel__next">Next</button>
    </div>
  `));
});

app.get('/content/aem-webmcp/us/en/contact.html', (req, res) => {
  res.send(generateDemoPage('Contact', `
    <h1>Contact Us</h1>

    <form id="contact-form" class="cmp-form" data-cmp-is="form" data-webmcp-action="form" data-webmcp-category="form" method="POST" action="/content/aem-webmcp/us/en/contact.html">
      <input type="hidden" name=":cq_csrf_token" value="mock-csrf-token" />

      <div class="cmp-form-text">
        <label for="fullName">Full Name *</label>
        <input type="text" id="fullName" name="fullName" required data-webmcp-action="form-field" />
      </div>

      <div class="cmp-form-text">
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required data-webmcp-action="form-field" />
      </div>

      <div class="cmp-form-text">
        <label for="phone">Phone</label>
        <input type="tel" id="phone" name="phone" data-webmcp-action="form-field" />
      </div>

      <div class="cmp-form-text">
        <label for="message">Message</label>
        <textarea id="message" name="message" rows="4" data-webmcp-action="form-field"></textarea>
      </div>

      <button type="submit" class="cmp-form-button" data-webmcp-action="form-button">Submit</button>
    </form>
  `));
});

app.get('/content/aem-webmcp/us/en/products.html', (req, res) => {
  res.send(generateDemoPage('Products', `
    <h1>Products</h1>

    <div class="cmp-productlist">
      ${[1, 2, 3].map(i => `
        <div class="cmp-product" data-cmp-is="product" data-webmcp-action="product" data-webmcp-category="commerce"
             data-product-id="PROD-00${i}" data-product-name="Product ${i}" data-product-price="${29.99 * i}">
          <h3>Product ${i}</h3>
          <p>$${(29.99 * i).toFixed(2)}</p>
          <button data-action="add-to-cart">Add to Cart</button>
        </div>
      `).join('')}
    </div>

    <div class="cmp-cart" data-cmp-is="cart" data-webmcp-action="shopping-cart" data-webmcp-category="commerce">
      <h3>Shopping Cart</h3>
      <div id="cart-items"></div>
      <div id="cart-total"></div>
    </div>
  `));
});

// WebAI Tools endpoint
app.get('/content/aem-webmcp/us/en.webai-tools.json', (req, res) => {
  res.json({
    tools: [
      {
        name: 'search',
        description: 'Search the website',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          }
        }
      },
      {
        name: 'navigate',
        description: 'Navigate to a page',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' }
          }
        }
      },
      {
        name: 'fillForm',
        description: 'Fill a form field',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string' },
            value: { type: 'string' }
          }
        }
      },
      {
        name: 'addToCart',
        description: 'Add product to cart',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'number' }
          }
        }
      }
    ]
  });
});

// Cart API
app.post('/api/cart/add', (req, res) => {
  const { productId, quantity, name, price } = req.body;
  cart.items.push({ productId, quantity, name, price });
  res.json({ success: true, cart });
});

app.get('/api/cart', (req, res) => {
  res.json(cart);
});

app.delete('/api/cart/:productId', (req, res) => {
  cart.items = cart.items.filter(item => item.productId !== req.params.productId);
  res.json({ success: true, cart });
});

// Search API
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  const results = [
    { title: 'Search Result 1', url: '/content/aem-webmcp/us/en.html' },
    { title: 'Search Result 2', url: '/content/aem-webmcp/us/en/contact.html' },
    { title: 'Search Result 3', url: '/content/aem-webmcp/us/en/products.html' }
  ].filter(r => r.title.toLowerCase().includes(q?.toLowerCase() || ''));
  res.json({ results });
});

// Form submission handler
app.post('/content/aem-webmcp/us/en/contact.html', (req, res) => {
  const csrfToken = req.body[':cq_csrf_token'];

  if (!csrfToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  // Validate required fields
  if (!req.body.fullName || !req.body.email) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  res.json({ success: true, message: 'Form submitted successfully' });
});

// Helper function to generate demo pages
function generateDemoPage(title, content) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - AEM WebMCP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
        .cmp-navigation ul { display: flex; list-style: none; gap: 20px; padding: 0; }
        .cmp-navigation a { text-decoration: none; color: #0066cc; }
        .cmp-search { margin: 20px 0; }
        .cmp-form { max-width: 500px; }
        .cmp-form > div { margin-bottom: 15px; }
        .cmp-form label { display: block; margin-bottom: 5px; font-weight: 500; }
        .cmp-form input, .cmp-form textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
        .cmp-form button { background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .cmp-accordion { border: 1px solid #ddd; }
        .cmp-accordion__header { padding: 10px; background: #f5f5f5; cursor: pointer; margin: 0; }
        .cmp-accordion__panel { padding: 10px; display: none; }
        .cmp-accordion__item.active .cmp-accordion__panel { display: block; }
        .cmp-product { border: 1px solid #ddd; padding: 15px; margin: 10px; display: inline-block; }
      </style>
    </head>
    <body>
      ${content}

      <script>
        // Mock WebMCP library
        window.AEMWebMCP = {
          getComponents: function() {
            return Array.from(document.querySelectorAll('[data-webmcp-action]')).map(el => ({
              id: el.id || Math.random().toString(36).substr(2, 9),
              action: el.dataset.webmcpAction,
              category: el.dataset.webmcpCategory,
              element: el,
              getData: function() { return { element: el.tagName }; }
            }));
          },
          search: async function(query) {
            const response = await fetch('/api/search?q=' + encodeURIComponent(query));
            const data = await response.json();
            return data.results;
          },
          navigate: function(url) {
            window.location.href = url;
          },
          fillForm: function(selector, value) {
            const el = document.querySelector(selector);
            if (el) {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          },
          fillFormFields: function(fields) {
            Object.entries(fields).forEach(([name, value]) => {
              this.fillForm('input[name="' + name + '"], textarea[name="' + name + '"]', value);
            });
          },
          submitForm: function(selector) {
            const form = document.querySelector(selector);
            if (form) form.submit();
          },
          resetForm: function(selector) {
            const form = document.querySelector(selector);
            if (form) form.reset();
          },
          getFormErrors: function() {
            return [];
          },
          addToCart: async function(item) {
            const response = await fetch('/api/cart/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
            return response.json();
          },
          getCart: async function() {
            const response = await fetch('/api/cart');
            return response.json();
          },
          removeFromCart: async function(productId) {
            const response = await fetch('/api/cart/' + productId, { method: 'DELETE' });
            return response.json();
          },
          updateCartItem: async function(productId, quantity) {
            return { success: true };
          },
          clearSearch: function() {},
          isConsentGranted: function() {
            return window.AEM_WEBMCP_CONSENT === true;
          },
          revokeConsent: function() {
            window.AEM_WEBMCP_CONSENT = false;
          },
          getAccessibilityTree: function() {
            return { nodes: [] };
          }
        };

        // Mock agents
        window.AEMFormAgent = {
          discoverForm: async function() {
            const form = document.querySelector('form');
            return form ? { category: 'form', element: form } : null;
          },
          analyzeFields: async function() {
            return Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
              name: el.name,
              type: el.type,
              required: el.required
            }));
          },
          processInput: async function(text) {
            const emailMatch = text.match(/[\\w.-]+@[\\w.-]+/);
            const nameMatch = text.match(/(?:name is|I'm|I am)\\s+([\\w\\s]+)/i);
            const phoneMatch = text.match(/\\d{3}[-.]?\\d{3}[-.]?\\d{4}/);

            if (emailMatch) {
              const emailInput = document.querySelector('input[name="email"]');
              if (emailInput) emailInput.value = emailMatch[0];
            }
            if (nameMatch) {
              const nameInput = document.querySelector('input[name="fullName"]');
              if (nameInput) nameInput.value = nameMatch[1].trim();
            }
            if (phoneMatch) {
              const phoneInput = document.querySelector('input[name="phone"]');
              if (phoneInput) phoneInput.value = phoneMatch[0];
            }
          }
        };

        window.AEMContentAgent = {
          pageContent: document.body.textContent,
          chunks: document.body.textContent.split(/\\s+/).filter(s => s.length > 3),
          ask: function(question) {
            if (question.toLowerCase().includes('about')) {
              return 'Contact page for reaching out to our team.';
            }
            return 'This page contains information about our services.';
          }
        };

        window.AEMAuditAgent = {
          issues: [],
          scanPage: async function() {
            this.issues = [];
            document.querySelectorAll('img:not([alt])').forEach(img => {
              this.issues.push({ type: 'missing-alt', element: img, severity: 'serious' });
            });
            return this.issues;
          },
          reportIssue: function(message, selector) {
            const el = document.querySelector(selector);
            if (el && window.WEBMCP_DEBUG) {
              el.style.outline = '3px dashed rgb(255, 136, 0)';
            }
            this.issues.push({ message, selector });
          }
        };

        window.AEMWebMCPAutomator = {
          enhanceAllComponents: function() {
            document.querySelectorAll('[data-cmp-is]').forEach(el => {
              el.setAttribute('data-webmcp-enhanced', 'true');
            });
          }
        };

        // Fire ready event
        window.dispatchEvent(new Event('webmcp:ready'));
      </script>
    </body>
    </html>
  `;
}

// Start server
app.listen(PORT, () => {
  console.log(\`Mock AEM server running on http://localhost:\${PORT}\`);
  console.log('Available endpoints:');
  console.log('  - /health');
  console.log('  - /libs/granite/core/content/login.html');
  console.log('  - /content/aem-webmcp/us/en.html');
  console.log('  - /content/aem-webmcp/us/en/contact.html');
  console.log('  - /content/aem-webmcp/us/en/products.html');
  console.log('  - /content/aem-webmcp/us/en.webai-tools.json');
});
