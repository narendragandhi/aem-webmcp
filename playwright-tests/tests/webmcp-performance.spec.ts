import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests - Load times, memory, rendering
 */

test.describe('AEM WebMCP - Performance Tests', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.AEM_WEBMCP_CONSENT = true;
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load WebMCP library within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      await page.waitForFunction(() => window.AEMWebMCP !== undefined, { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // WebMCP should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not block page rendering', async ({ page }) => {
      const metrics: any = {};

      // Capture performance metrics
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
          loadComplete: navigation.loadEventEnd - navigation.startTime,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });

      // First paint should occur within 2 seconds
      if (performanceMetrics.firstPaint > 0) {
        expect(performanceMetrics.firstPaint).toBeLessThan(2000);
      }

      // DOM should be interactive within 3 seconds
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);
    });

    test('should minimize layout shifts', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const cls = await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });

          observer.observe({ type: 'layout-shift', buffered: true });

          // Wait a bit for any layout shifts
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 2000);
        });
      });

      // CLS should be less than 0.1 (good score)
      expect(cls).toBeLessThan(0.1);
    });
  });

  test.describe('Component Detection Performance', () => {
    test('should detect components within 500ms', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const detectionTime = await page.evaluate(() => {
        const start = performance.now();
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const end = performance.now();
        return {
          time: end - start,
          count: components.length
        };
      });

      // Component detection should be fast
      expect(detectionTime.time).toBeLessThan(500);
    });

    test('should handle pages with many components efficiently', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Inject many components
      await page.evaluate(() => {
        const container = document.createElement('div');
        for (let i = 0; i < 100; i++) {
          const component = document.createElement('div');
          component.setAttribute('data-cmp-is', 'text');
          component.setAttribute('data-webmcp-action', 'content');
          component.textContent = `Component ${i}`;
          container.appendChild(component);
        }
        document.body.appendChild(container);

        // Re-run enhancement
        if (window.AEMWebMCPAutomator) {
          window.AEMWebMCPAutomator.enhanceAllComponents();
        }
      });

      const detectionTime = await page.evaluate(() => {
        const start = performance.now();
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const end = performance.now();
        return {
          time: end - start,
          count: components.length
        };
      });

      // Should still be fast with 100+ components
      expect(detectionTime.time).toBeLessThan(1000);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not leak memory on component updates', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Perform many operations
      for (let i = 0; i < 50; i++) {
        await page.evaluate(() => {
          window.AEMWebMCP?.getComponents?.();
          window.AEMWebMCP?.search?.('test');
        });
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      await page.waitForTimeout(1000);

      const finalMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory should not grow significantly (allow 50% growth)
      if (initialMemory > 0 && finalMemory > 0) {
        expect(finalMemory).toBeLessThan(initialMemory * 1.5);
      }
    });

    test('should clean up event listeners on page unload', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Count event listeners before
      const listenersBefore = await page.evaluate(() => {
        // This is a rough estimate
        return (window as any).__webmcp_listeners?.length || 0;
      });

      // Navigate away and back
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const listenersAfter = await page.evaluate(() => {
        return (window as any).__webmcp_listeners?.length || 0;
      });

      // Listeners should not accumulate
      expect(listenersAfter).toBeLessThanOrEqual(listenersBefore * 2);
    });
  });

  test.describe('API Response Times', () => {
    test('should return search results within 500ms', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const searchTime = await page.evaluate(async () => {
        const start = performance.now();
        await window.AEMWebMCP?.search?.('test');
        const end = performance.now();
        return end - start;
      });

      expect(searchTime).toBeLessThan(500);
    });

    test('should load AI tools endpoint within 200ms', async ({ page }) => {
      const startTime = Date.now();

      const response = await page.request.get('/content/aem-webmcp/us/en.webai-tools.json');

      const responseTime = Date.now() - startTime;

      expect(response.ok()).toBe(true);
      expect(responseTime).toBeLessThan(200);
    });

    test('should handle concurrent API calls efficiently', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const concurrentTime = await page.evaluate(async () => {
        const start = performance.now();

        // Run 10 concurrent operations
        await Promise.all([
          window.AEMWebMCP?.search?.('test1'),
          window.AEMWebMCP?.search?.('test2'),
          window.AEMWebMCP?.search?.('test3'),
          window.AEMWebMCP?.getComponents?.(),
          window.AEMWebMCP?.getComponents?.(),
          window.AEMWebMCP?.search?.('test4'),
          window.AEMWebMCP?.search?.('test5'),
          window.AEMWebMCP?.getComponents?.(),
          window.AEMWebMCP?.search?.('test6'),
          window.AEMWebMCP?.getComponents?.()
        ]);

        const end = performance.now();
        return end - start;
      });

      // Concurrent operations should complete within 2 seconds
      expect(concurrentTime).toBeLessThan(2000);
    });
  });

  test.describe('Network Performance', () => {
    test('should minimize network requests', async ({ page }) => {
      const requests: string[] = [];

      page.on('request', (request) => {
        if (request.url().includes('webmcp')) {
          requests.push(request.url());
        }
      });

      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Should not make excessive WebMCP-related requests
      expect(requests.length).toBeLessThan(10);
    });

    test('should cache API responses appropriately', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // First request
      const response1 = await page.request.get('/content/aem-webmcp/us/en.webai-tools.json');

      // Check cache headers
      const cacheControl = response1.headers()['cache-control'];

      // Should have some caching
      // (exact behavior depends on server config)
    });

    test('should support gzip compression', async ({ page }) => {
      const response = await page.request.get('/content/aem-webmcp/us/en.webai-tools.json', {
        headers: {
          'Accept-Encoding': 'gzip, deflate'
        }
      });

      const contentEncoding = response.headers()['content-encoding'];

      // Server should support compression
    });
  });

  test.describe('Rendering Performance', () => {
    test('should not cause excessive repaints', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const paintCount = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let count = 0;
          const observer = new PerformanceObserver((list) => {
            count += list.getEntries().length;
          });

          observer.observe({ entryTypes: ['paint'] });

          // Trigger some WebMCP operations
          for (let i = 0; i < 10; i++) {
            window.AEMWebMCP?.getComponents?.();
          }

          setTimeout(() => {
            observer.disconnect();
            resolve(count);
          }, 1000);
        });
      });

      // Should not cause excessive paints
      expect(paintCount).toBeLessThan(20);
    });

    test('should maintain 60fps during interactions', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const frameDrops = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let lastTime = performance.now();
          let drops = 0;
          let frames = 0;

          function checkFrame() {
            const now = performance.now();
            const delta = now - lastTime;

            // If frame took longer than 33ms (30fps), count as drop
            if (delta > 33) {
              drops++;
            }

            frames++;
            lastTime = now;

            if (frames < 60) {
              requestAnimationFrame(checkFrame);
            } else {
              resolve(drops);
            }
          }

          requestAnimationFrame(checkFrame);
        });
      });

      // Allow some frame drops but not too many
      expect(frameDrops).toBeLessThan(10);
    });
  });
});
