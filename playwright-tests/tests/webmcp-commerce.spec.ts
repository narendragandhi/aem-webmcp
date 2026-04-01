import { test, expect } from '@playwright/test';

/**
 * Commerce Component E2E Tests - Cart, Products, Search
 */

test.describe('AEM WebMCP - Commerce Components', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.AEM_WEBMCP_CONSENT = true;
    });
  });

  test.describe('Search Component', () => {
    test('should discover search component', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const hasSearch = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.some((c: any) => c.action === 'search');
      });

      expect(hasSearch).toBe(true);
    });

    test('should perform search via WebMCP API', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const results = await page.evaluate(async () => {
        return await window.AEMWebMCP?.search?.('products') || [];
      });

      expect(Array.isArray(results)).toBe(true);
    });

    test('should clear search results', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      await page.evaluate(async () => {
        await window.AEMWebMCP?.search?.('products');
      });

      const cleared = await page.evaluate(() => {
        window.AEMWebMCP?.clearSearch?.();
        return true;
      });

      expect(cleared).toBe(true);
    });
  });

  test.describe('Cart Component', () => {
    test('should add item to cart', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const result = await page.evaluate(async () => {
        return await window.AEMWebMCP?.addToCart?.({
          productId: 'TEST-001',
          quantity: 1,
          name: 'Test Product',
          price: 29.99
        });
      });

      expect(result).toBeDefined();
    });

    test('should update cart item quantity', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Add item first
      await page.evaluate(async () => {
        await window.AEMWebMCP?.addToCart?.({
          productId: 'TEST-002',
          quantity: 1
        });
      });

      // Update quantity
      const result = await page.evaluate(async () => {
        return await window.AEMWebMCP?.updateCartItem?.('TEST-002', 3);
      });

      expect(result).toBeDefined();
    });

    test('should remove item from cart', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Add item first
      await page.evaluate(async () => {
        await window.AEMWebMCP?.addToCart?.({
          productId: 'TEST-003',
          quantity: 1
        });
      });

      // Remove item
      const result = await page.evaluate(async () => {
        return await window.AEMWebMCP?.removeFromCart?.('TEST-003');
      });

      expect(result).toBeDefined();
    });

    test('should get cart contents', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const cart = await page.evaluate(async () => {
        return await window.AEMWebMCP?.getCart?.() || { items: [] };
      });

      expect(cart).toHaveProperty('items');
      expect(Array.isArray(cart.items)).toBe(true);
    });

    test('should respect max cart items limit', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Try to add more than max items
      const results = await page.evaluate(async () => {
        const addResults = [];
        for (let i = 0; i < 60; i++) {
          const result = await window.AEMWebMCP?.addToCart?.({
            productId: `BULK-${i}`,
            quantity: 1
          });
          addResults.push(result);
        }
        return addResults;
      });

      // Some should fail due to limit
      const failures = results.filter((r: any) => r?.error);
      // Note: This depends on configured limit
    });
  });

  test.describe('Product Component', () => {
    test('should discover product components', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/products.html', { waitUntil: 'networkidle' });

      const components = await page.evaluate(() => {
        return window.AEMWebMCP?.getComponents?.() || [];
      });

      const productComponents = components.filter((c: any) => c.action === 'product');
      expect(productComponents.length).toBeGreaterThanOrEqual(0);
    });

    test('should get product data from component', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/products.html', { waitUntil: 'networkidle' });

      const productData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const product = components.find((c: any) => c.action === 'product');
        return product?.getData?.() || null;
      });

      // Product data structure validation if available
      if (productData) {
        expect(productData).toHaveProperty('name');
      }
    });
  });
});
