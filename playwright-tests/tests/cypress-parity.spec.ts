import { test, expect } from '@playwright/test';

declare const process: {
  env: Record<string, string | undefined>;
};

declare global {
  interface Window {
    AEMWebMCP?: unknown;
  }
}

/**
 * Coverage migrated from ui.tests/test-module/cypress/e2e.
 *
 * These checks intentionally use Playwright primitives rather than Cypress
 * compatibility helpers so they exercise the replacement test runner itself.
 */
test.describe('Cypress parity: AEM WebMCP smoke and release checks', () => {
  const pages = [
    { name: 'home', path: '/content/aem-webmcp/us/en.html' },
    { name: 'contact', path: '/content/aem-webmcp/us/en/contact.html' },
    { name: 'shop', path: '/content/aem-webmcp/us/en/shop.html' },
    { name: 'faq', path: '/content/aem-webmcp/us/en/faq.html' },
  ];

  test('loads the demo pages and exposes WebMCP', async ({ page }) => {
    for (const demoPage of pages) {
      await page.goto(demoPage.path, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
      await page.waitForFunction(() => window.AEMWebMCP !== undefined);
    }
  });

  test('does not emit browser errors on the publish surface', async ({ browser, page }) => {
    const publishUrl = process.env.AEM_PUBLISH_URL;
    const targetPage = publishUrl ? await browser.newPage({ baseURL: publishUrl }) : page;
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    targetPage.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    targetPage.on('pageerror', error => pageErrors.push(error.message));

    await targetPage.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });
    expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([]);

    if (targetPage !== page) await targetPage.close();
  });

  test('keeps the contact form usable at mobile and desktop widths', async ({ page }) => {
    for (const viewport of [
      { width: 375, height: 667 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      await expect(page.locator('form').first()).toBeVisible();
      await expect(page.locator('input, textarea, select').first()).toBeVisible();
      await page.locator('input[name="fullName"]').first().fill('Test User');
      await page.locator('input[name="email"]').first().fill('test@example.com');
      await expect(page.locator('input[name="fullName"]').first()).toHaveValue('Test User');
    }
  });

  test('returns the documented JSON metrics contract', async ({ request }) => {
    const response = await request.get('/bin/webmcp/metrics');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toMatchObject({
      status: 'ok',
      metrics: {
        counters: expect.objectContaining({
          componentDetections: expect.any(Number),
          formSubmissions: expect.any(Number),
          contentFragmentFetches: expect.any(Number),
        }),
        gauges: expect.objectContaining({
          activeCartSessions: expect.any(Number),
          activeChatSessions: expect.any(Number),
        }),
      },
      system: expect.objectContaining({
        totalMemoryMB: expect.any(Number),
        availableProcessors: expect.any(Number),
      }),
    });
  });

  for (const demoPage of pages) {
    test(`matches the ${demoPage.name} visual baseline`, async ({ page }) => {
      await page.goto(demoPage.path, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
      await expect(page).toHaveScreenshot(`webmcp-${demoPage.name}.png`, {
        fullPage: false,
        animations: 'disabled',
      });
    });
  }
});
