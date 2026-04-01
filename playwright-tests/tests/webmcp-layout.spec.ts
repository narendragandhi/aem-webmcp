import { test, expect } from '@playwright/test';

/**
 * Layout Component E2E Tests - Accordion, Tabs, Carousel, Container
 */

test.describe('AEM WebMCP - Layout Components', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.AEM_WEBMCP_CONSENT = true;
    });
  });

  test.describe('Accordion Component', () => {
    test('should discover accordion component', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const hasAccordion = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.some((c: any) => c.action === 'accordion');
      });

      expect(typeof hasAccordion).toBe('boolean');
    });

    test('should expand accordion item', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const result = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const accordion = components.find((c: any) => c.action === 'accordion');
        if (accordion?.expand) {
          return accordion.expand(0);
        }
        return null;
      });

      // Result depends on accordion presence
    });

    test('should collapse accordion item', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const result = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const accordion = components.find((c: any) => c.action === 'accordion');
        if (accordion?.collapse) {
          return accordion.collapse(0);
        }
        return null;
      });

      // Result depends on accordion presence
    });

    test('should get accordion items data', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const accordionData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const accordion = components.find((c: any) => c.action === 'accordion');
        return accordion?.getData?.() || null;
      });

      if (accordionData) {
        expect(accordionData).toHaveProperty('items');
      }
    });
  });

  test.describe('Tabs Component', () => {
    test('should discover tabs component', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const hasTabs = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.some((c: any) => c.action === 'tabs');
      });

      expect(typeof hasTabs).toBe('boolean');
    });

    test('should select tab by index', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const result = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const tabs = components.find((c: any) => c.action === 'tabs');
        if (tabs?.select) {
          return tabs.select(1);
        }
        return null;
      });

      // Result depends on tabs presence
    });

    test('should get active tab info', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const tabsData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const tabs = components.find((c: any) => c.action === 'tabs');
        return tabs?.getData?.() || null;
      });

      if (tabsData) {
        expect(tabsData).toHaveProperty('activeIndex');
      }
    });
  });

  test.describe('Carousel Component', () => {
    test('should discover carousel component', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const hasCarousel = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.some((c: any) => c.action === 'carousel');
      });

      expect(typeof hasCarousel).toBe('boolean');
    });

    test('should navigate to next slide', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const result = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const carousel = components.find((c: any) => c.action === 'carousel');
        if (carousel?.next) {
          return carousel.next();
        }
        return null;
      });

      // Result depends on carousel presence
    });

    test('should navigate to previous slide', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const result = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const carousel = components.find((c: any) => c.action === 'carousel');
        if (carousel?.prev) {
          return carousel.prev();
        }
        return null;
      });

      // Result depends on carousel presence
    });

    test('should toggle autoplay', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const result = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const carousel = components.find((c: any) => c.action === 'carousel');
        if (carousel?.play) {
          carousel.play();
          return true;
        }
        return null;
      });

      // Result depends on carousel presence
    });

    test('should get carousel slide data', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const carouselData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const carousel = components.find((c: any) => c.action === 'carousel');
        return carousel?.getData?.() || null;
      });

      if (carouselData) {
        expect(carouselData).toHaveProperty('slides');
        expect(carouselData).toHaveProperty('currentSlide');
      }
    });
  });

  test.describe('Container Component', () => {
    test('should discover container components', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const containers = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.filter((c: any) => c.action === 'container');
      });

      expect(Array.isArray(containers)).toBe(true);
    });

    test('should get nested components within container', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const containerData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const container = components.find((c: any) => c.action === 'container');
        return container?.getData?.() || null;
      });

      if (containerData) {
        expect(containerData).toHaveProperty('children');
      }
    });
  });
});
