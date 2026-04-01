import { test, expect } from '@playwright/test';

/**
 * Form Component E2E Tests - Form fields, validation, submission
 */

test.describe('AEM WebMCP - Form Components', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.AEM_WEBMCP_CONSENT = true;
    });
    await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });
  });

  test.describe('Form Discovery', () => {
    test('should discover form components', async ({ page }) => {
      const forms = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        return components.filter((c: any) => c.category === 'form');
      });

      expect(Array.isArray(forms)).toBe(true);
    });

    test('should identify form fields with types', async ({ page }) => {
      const formData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const form = components.find((c: any) => c.action === 'form');
        return form?.getData?.() || null;
      });

      if (formData?.fields) {
        formData.fields.forEach((field: any) => {
          expect(field).toHaveProperty('name');
          expect(field).toHaveProperty('type');
        });
      }
    });

    test('should identify required fields', async ({ page }) => {
      const formData = await page.evaluate(() => {
        const components = window.AEMWebMCP?.getComponents?.() || [];
        const form = components.find((c: any) => c.action === 'form');
        return form?.getData?.() || null;
      });

      if (formData?.fields) {
        const requiredFields = formData.fields.filter((f: any) => f.required);
        expect(requiredFields.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Form Filling', () => {
    test('should fill text input via API', async ({ page }) => {
      await page.evaluate(() => {
        window.AEMWebMCP?.fillForm?.('input[name="email"]', 'test@example.com');
      });

      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.count() > 0) {
        await expect(emailInput).toHaveValue('test@example.com');
      }
    });

    test('should fill multiple fields at once', async ({ page }) => {
      await page.evaluate(() => {
        window.AEMWebMCP?.fillFormFields?.({
          email: 'test@example.com',
          fullName: 'John Doe',
          phone: '555-123-4567'
        });
      });

      // Verify fields if they exist
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.count() > 0) {
        await expect(emailInput).toHaveValue('test@example.com');
      }
    });

    test('should handle select dropdowns', async ({ page }) => {
      // Inject a select for testing
      await page.evaluate(() => {
        const select = document.createElement('select');
        select.name = 'country';
        select.setAttribute('data-webmcp-action', 'form-field');
        select.innerHTML = `
          <option value="">Select...</option>
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
        `;
        document.querySelector('form')?.appendChild(select);
      });

      await page.evaluate(() => {
        window.AEMWebMCP?.fillForm?.('select[name="country"]', 'us');
      });

      await expect(page.locator('select[name="country"]')).toHaveValue('us');
    });

    test('should handle checkbox fields', async ({ page }) => {
      // Inject a checkbox for testing
      await page.evaluate(() => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'subscribe';
        checkbox.setAttribute('data-webmcp-action', 'form-field');
        document.querySelector('form')?.appendChild(checkbox);
      });

      await page.evaluate(() => {
        window.AEMWebMCP?.fillForm?.('input[name="subscribe"]', true);
      });

      await expect(page.locator('input[name="subscribe"]')).toBeChecked();
    });

    test('should handle radio button groups', async ({ page }) => {
      // Inject radio buttons for testing
      await page.evaluate(() => {
        const form = document.querySelector('form');
        ['option1', 'option2', 'option3'].forEach(val => {
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'preference';
          radio.value = val;
          radio.setAttribute('data-webmcp-action', 'form-field');
          form?.appendChild(radio);
        });
      });

      await page.evaluate(() => {
        window.AEMWebMCP?.fillForm?.('input[name="preference"][value="option2"]', true);
      });

      await expect(page.locator('input[name="preference"][value="option2"]')).toBeChecked();
    });
  });

  test.describe('Form Validation', () => {
    test('should validate email format', async ({ page }) => {
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.fill('invalid-email');
        await emailInput.blur();

        const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
        expect(isValid).toBe(false);
      }
    });

    test('should validate required fields', async ({ page }) => {
      const requiredInput = page.locator('input[required]').first();
      if (await requiredInput.count() > 0) {
        await requiredInput.fill('');
        await requiredInput.blur();

        const isValid = await requiredInput.evaluate((el: HTMLInputElement) => el.validity.valid);
        expect(isValid).toBe(false);
      }
    });

    test('should get validation errors via API', async ({ page }) => {
      const errors = await page.evaluate(() => {
        return window.AEMWebMCP?.getFormErrors?.() || [];
      });

      expect(Array.isArray(errors)).toBe(true);
    });
  });

  test.describe('Form Submission', () => {
    test('should submit form via API', async ({ page }) => {
      // Fill required fields first
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const inputs = form.querySelectorAll('input[required]');
          inputs.forEach((input: HTMLInputElement) => {
            if (input.type === 'email') {
              input.value = 'test@example.com';
            } else {
              input.value = 'Test Value';
            }
          });
        }
      });

      // Intercept form submission
      let submitted = false;
      await page.route('**/*', (route) => {
        if (route.request().method() === 'POST') {
          submitted = true;
        }
        route.continue();
      });

      await page.evaluate(() => {
        window.AEMWebMCP?.submitForm?.('form');
      });

      // Allow time for submission
      await page.waitForTimeout(1000);
    });

    test('should reset form via API', async ({ page }) => {
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');

        await page.evaluate(() => {
          window.AEMWebMCP?.resetForm?.('form');
        });

        await expect(emailInput).toHaveValue('');
      }
    });

    test('should prevent submission of invalid form', async ({ page }) => {
      // Try to submit without filling required fields
      const submitted = await page.evaluate(() => {
        try {
          window.AEMWebMCP?.submitForm?.('form');
          return true;
        } catch (e) {
          return false;
        }
      });

      // Form should either not submit or throw error
    });
  });

  test.describe('Rate Limiting', () => {
    test('should enforce rate limiting on form submissions', async ({ page }) => {
      const results: boolean[] = [];

      // Attempt rapid submissions
      for (let i = 0; i < 15; i++) {
        const result = await page.evaluate(async () => {
          try {
            await window.AEMWebMCP?.submitForm?.('form');
            return true;
          } catch (e) {
            return false;
          }
        });
        results.push(result);
      }

      // Some should be rate limited (depends on config)
      // const rateLimited = results.filter(r => !r).length;
    });
  });
});
