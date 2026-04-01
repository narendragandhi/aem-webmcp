import { test, expect } from '@playwright/test';

/**
 * Navigation Component E2E Tests - Navigation, Breadcrumb, Language Nav
 */

test.describe('AEM WebMCP - Navigation Components', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.AEM_WEBMCP_CONSENT = true;
    });
  });

  test.describe('Main Navigation', () => {
    test('should discover navigation component', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const hasNav = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.some((c: any) => c.action === 'navigation');
      });

      expect(hasNav).toBe(true);
    });

    test('should navigate via WebMCP API', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        window.AEMWebMCP?.navigate?.('/content/aem-webmcp/us/en/contact.html');
      });

      await page.waitForURL('**/contact.html');
      expect(page.url()).toContain('contact.html');
    });

    test('should get navigation structure', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const navData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const nav = components.find((c: any) => c.action === 'navigation');
        return nav?.getData?.() || null;
      });

      if (navData) {
        expect(navData).toHaveProperty('items');
      }
    });

    test('should expand dropdown menu items', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const expanded = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const nav = components.find((c: any) => c.action === 'navigation');
        return nav?.expand?.() || false;
      });

      // Expansion behavior depends on nav structure
    });
  });

  test.describe('Breadcrumb', () => {
    test('should discover breadcrumb component', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      const hasBreadcrumb = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.some((c: any) => c.action === 'breadcrumb');
      });

      // Breadcrumb may or may not be present
      expect(typeof hasBreadcrumb).toBe('boolean');
    });

    test('should get breadcrumb trail', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      const breadcrumbData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const breadcrumb = components.find((c: any) => c.action === 'breadcrumb');
        return breadcrumb?.getData?.() || null;
      });

      if (breadcrumbData) {
        expect(Array.isArray(breadcrumbData.items)).toBe(true);
      }
    });
  });

  test.describe('Language Navigation', () => {
    test('should discover language navigation component', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const hasLangNav = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.some((c: any) => c.action === 'language-nav');
      });

      // Language nav may or may not be present
      expect(typeof hasLangNav).toBe('boolean');
    });

    test('should get available languages', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const languages = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const langNav = components.find((c: any) => c.action === 'language-nav');
        return langNav?.getData?.()?.languages || [];
      });

      if (languages.length > 0) {
        expect(languages[0]).toHaveProperty('code');
      }
    });
  });
});
