import { test, expect } from '@playwright/test';

/**
 * Core WebMCP E2E Tests - Component Detection & Enhancement
 */

test.describe('AEM WebMCP - Core Functionality', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.AEM_WEBMCP_CONSENT = true;
    });
  });

  test.describe('Initialization', () => {
    test('should load WebMCP library on page load', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const webmcpLoaded = await page.evaluate(() => {
        return typeof window.AEMWebMCP !== 'undefined';
      });

      expect(webmcpLoaded).toBe(true);
    });

    test('should expose AI tools API endpoint', async ({ page }) => {
      const response = await page.request.get('/content/aem-webmcp/us/en.webai-tools.json');
      expect(response.ok()).toBe(true);

      const tools = await response.json();
      expect(tools).toHaveProperty('tools');
      expect(Array.isArray(tools.tools)).toBe(true);
    });

    test('should fire webmcp:ready event after initialization', async ({ page }) => {
      const readyFired = await page.evaluate(() => {
        return new Promise((resolve) => {
          if (window.AEMWebMCP) {
            resolve(true);
          } else {
            window.addEventListener('webmcp:ready', () => resolve(true));
            setTimeout(() => resolve(false), 10000);
          }
        });
      });

      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });
      expect(readyFired).toBe(true);
    });

    test('should respect consent requirement', async ({ page, context }) => {
      // Test without consent
      await context.addInitScript(() => {
        window.AEM_WEBMCP_CONSENT = false;
      });

      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const apiEnabled = await page.evaluate(() => {
        return window.AEMWebMCP?.isConsentGranted?.() ?? false;
      });

      expect(apiEnabled).toBe(false);
    });
  });

  test.describe('Component Discovery', () => {
    test('should detect navigation components', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const components = await page.evaluate(() => {
        return window.AEMWebMCP?.getComponents?.() || [];
      });

      const navComponent = components.find((c: any) => c.category === 'navigation');
      expect(navComponent).toBeDefined();
    });

    test('should detect form components on contact page', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      const components = await page.evaluate(() => {
        return window.AEMWebMCP?.getComponents?.() || [];
      });

      const formComponent = components.find((c: any) => c.category === 'form');
      expect(formComponent).toBeDefined();
    });

    test('should assign unique IDs to all components', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const components = await page.evaluate(() => {
        return window.AEMWebMCP?.getComponents?.() || [];
      });

      const ids = components.map((c: any) => c.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    test('should emit webmcp:component event for each discovered component', async ({ page }) => {
      const componentEvents: any[] = [];

      await page.exposeFunction('captureComponent', (detail: any) => {
        componentEvents.push(detail);
      });

      await page.addInitScript(() => {
        window.addEventListener('webmcp:component', (e: CustomEvent) => {
          (window as any).captureComponent(e.detail);
        });
      });

      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      expect(componentEvents.length).toBeGreaterThan(0);
    });
  });

  test.describe('Debug Mode', () => {
    test('should show debug panel when enabled', async ({ page }) => {
      await page.addInitScript(() => {
        window.WEBMCP_DEBUG = true;
        window.WEBMCP_SHOW_PANEL = true;
      });

      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const debugPanel = page.locator('[data-webmcp-debug-panel]');
      await expect(debugPanel).toBeVisible();
    });

    test('should log component discovery in debug mode', async ({ page }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        if (msg.text().includes('WebMCP')) {
          consoleLogs.push(msg.text());
        }
      });

      await page.addInitScript(() => {
        window.WEBMCP_DEBUG = true;
      });

      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      expect(consoleLogs.length).toBeGreaterThan(0);
    });
  });
});
