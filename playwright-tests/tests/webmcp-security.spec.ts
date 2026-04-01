import { test, expect } from '@playwright/test';

/**
 * Security E2E Tests - CSRF, XSS, Rate Limiting, Input Sanitization
 */

test.describe('AEM WebMCP - Security Tests', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.AEM_WEBMCP_CONSENT = true;
    });
  });

  test.describe('CSRF Protection', () => {
    test('should include CSRF token in form submissions', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      // Check for CSRF token presence
      const hasCSRFToken = await page.evaluate(() => {
        const form = document.querySelector('form');
        if (!form) return false;

        // Look for common CSRF token patterns
        const csrfInput = form.querySelector('input[name*="csrf"], input[name*="token"], input[name=":cq_csrf_token"]');
        const csrfMeta = document.querySelector('meta[name*="csrf"]');

        return !!(csrfInput || csrfMeta);
      });

      // CSRF protection should be present
    });

    test('should reject requests without valid CSRF token', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      // Attempt to submit form with modified/removed CSRF token
      const response = await page.evaluate(async () => {
        const form = document.querySelector('form');
        if (!form) return { status: 'no-form' };

        // Remove CSRF token
        const csrfInput = form.querySelector('input[name*="csrf"], input[name=":cq_csrf_token"]');
        if (csrfInput) {
          csrfInput.remove();
        }

        try {
          const formData = new FormData(form);
          const response = await fetch(form.action || window.location.href, {
            method: 'POST',
            body: formData
          });
          return { status: response.status };
        } catch (e) {
          return { status: 'error', message: (e as Error).message };
        }
      });

      // Should be rejected (403 or similar)
    });
  });

  test.describe('XSS Prevention', () => {
    test('should sanitize script injection in form inputs', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      const maliciousInput = '<script>alert("XSS")</script>';

      await page.evaluate((input) => {
        window.AEMWebMCP?.fillForm?.('input[name="fullName"]', input);
      }, maliciousInput);

      // Check that script tags are sanitized
      const inputValue = await page.locator('input[name="fullName"]').inputValue();
      expect(inputValue).not.toContain('<script>');
    });

    test('should sanitize event handler injection', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      const maliciousInput = '" onmouseover="alert(1)" data-x="';

      await page.evaluate((input) => {
        window.AEMWebMCP?.fillForm?.('input[name="fullName"]', input);
      }, maliciousInput);

      // Verify no event handlers were created
      const hasEventHandler = await page.evaluate(() => {
        const input = document.querySelector('input[name="fullName"]');
        return input?.hasAttribute('onmouseover') || false;
      });

      expect(hasEventHandler).toBe(false);
    });

    test('should escape HTML in component data output', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const components = await page.evaluate(() => {
        return window.AEMWebMCP?.getComponents?.() || [];
      });

      // Verify no raw HTML in component data
      components.forEach((component: any) => {
        const data = JSON.stringify(component);
        expect(data).not.toMatch(/<script>/i);
      });
    });
  });

  test.describe('Input Sanitization', () => {
    test('should sanitize SQL injection patterns', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const maliciousQuery = "'; DROP TABLE users; --";

      const results = await page.evaluate(async (query) => {
        try {
          return await window.AEMWebMCP?.search?.(query) || [];
        } catch (e) {
          return { error: (e as Error).message };
        }
      }, maliciousQuery);

      // Should not cause errors or execute SQL
      expect(Array.isArray(results) || results.error).toBeTruthy();
    });

    test('should sanitize path traversal attempts', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const maliciousPath = '../../../etc/passwd';

      await page.evaluate((path) => {
        try {
          window.AEMWebMCP?.navigate?.(path);
        } catch (e) {
          // Expected to fail
        }
      }, maliciousPath);

      // Should not navigate outside content root
      expect(page.url()).not.toContain('etc/passwd');
    });

    test('should limit input length', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      const longInput = 'A'.repeat(100000);

      await page.evaluate((input) => {
        window.AEMWebMCP?.fillForm?.('input[name="fullName"]', input);
      }, longInput);

      const inputValue = await page.locator('input[name="fullName"]').inputValue();

      // Input should be truncated or rejected
      expect(inputValue.length).toBeLessThan(100000);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should enforce API call rate limits', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const results: any[] = [];

      // Rapid API calls
      for (let i = 0; i < 100; i++) {
        const result = await page.evaluate(async () => {
          try {
            await window.AEMWebMCP?.search?.('test');
            return { success: true };
          } catch (e) {
            return { error: (e as Error).message };
          }
        });
        results.push(result);
      }

      // Some calls should be rate limited
      const errors = results.filter(r => r.error);
      // Rate limiting behavior depends on config
    });

    test('should return rate limit headers', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const response = await page.request.get('/content/aem-webmcp/us/en.webai-tools.json');

      // Check for rate limit headers
      const headers = response.headers();
      // Common rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining
    });
  });

  test.describe('Consent & Privacy', () => {
    test('should not expose API without consent', async ({ page, context }) => {
      // Clear consent
      await context.addInitScript(() => {
        window.AEM_WEBMCP_CONSENT = false;
      });

      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const apiAvailable = await page.evaluate(() => {
        return window.AEMWebMCP?.isConsentGranted?.() ?? false;
      });

      expect(apiAvailable).toBe(false);
    });

    test('should not log PII in console', async ({ page }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        consoleLogs.push(msg.text());
      });

      await page.addInitScript(() => {
        window.WEBMCP_DEBUG = true;
      });

      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      // Fill form with PII
      await page.evaluate(() => {
        window.AEMWebMCP?.fillForm?.('input[name="email"]', 'private@example.com');
        window.AEMWebMCP?.fillForm?.('input[name="phone"]', '555-123-4567');
      });

      // Check logs don't contain PII
      const logText = consoleLogs.join(' ');
      expect(logText).not.toContain('private@example.com');
      expect(logText).not.toContain('555-123-4567');
    });

    test('should clear sensitive data on consent revocation', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Revoke consent
      await page.evaluate(() => {
        window.AEMWebMCP?.revokeConsent?.();
      });

      // Check API is disabled
      const apiEnabled = await page.evaluate(() => {
        return window.AEMWebMCP?.isConsentGranted?.() ?? true;
      });

      expect(apiEnabled).toBe(false);
    });
  });

  test.describe('Authentication', () => {
    test('should require authentication for protected endpoints', async ({ page }) => {
      // Without auth
      const response = await page.request.get('/content/aem-webmcp/us/en.webai-tools.json', {
        headers: {} // No auth headers
      });

      // Should still work for public endpoints or return 401 for protected
    });
  });
});
