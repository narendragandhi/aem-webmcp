import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for AEM WebMCP AI Agents using Playwright
 */

test.describe('AEM WebMCP - AI Agents E2E Tests', () => {

  test.beforeEach(async ({ page, context }) => {
    // 1. Pre-grant consent via init script
    await context.addInitScript(() => {
        window.AEM_WEBMCP_CONSENT = true;
    });

    // 2. Navigate directly to the contact page (Auth handled by setup)
    await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });
    
    // 3. Inject Mock Form immediately if needed
    await page.evaluate(() => {
        if (!document.getElementById('contact-form')) {
            const form = document.createElement('form');
            form.id = 'contact-form';
            form.className = 'cmp-form';
            form.setAttribute('data-webmcp-action', 'form');
            form.setAttribute('data-webmcp-category', 'form');
            form.innerHTML = `
                <input name="fullName" type="text" required="true" data-webmcp-action="form-field" />
                <input name="email" type="email" required="true" data-webmcp-action="form-field" />
                <input name="phone" type="text" required="true" data-webmcp-action="form-field" />
                <button type="submit" data-webmcp-action="form-button">Submit</button>
            `;
            document.body.appendChild(form);
        }
    });

    // 4. Wait for WebMCP and force enhancement
    await page.waitForFunction(() => window.AEMWebMCP !== undefined, { timeout: 15000 });
    await page.evaluate(() => {
        if (window.AEMWebMCPAutomator) window.AEMWebMCPAutomator.enhanceAllComponents();
    });
    
    // Final verify
    await expect(page.evaluate(() => !!window.AEMFormAgent)).resolves.toBeTruthy();
  });

  test.describe('FormAgent Tests', () => {
    test('should discover and analyze the contact form', async ({ page }) => {
      const form = await page.evaluate(async () => {
        return await window.AEMFormAgent.discoverForm();
      });
      expect(form).not.toBeNull();
      expect(form.category).toBe('form');
      
      const fields = await page.evaluate(async () => {
        return await window.AEMFormAgent.analyzeFields();
      });
      expect(fields.length).toBeGreaterThan(0);
      
      const hasEmail = fields.some(f => f.name === 'email');
      expect(hasEmail).toBe(true);
    });

    test('should fill form fields via natural language input', async ({ page }) => {
      await page.evaluate(async () => {
        await window.AEMFormAgent.discoverForm();
        await window.AEMFormAgent.analyzeFields();
        await window.AEMFormAgent.processInput('My email is test@example.com');
        await window.AEMFormAgent.processInput('My name is John Doe');
      });

      await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');
      await expect(page.locator('input[name="fullName"]')).toHaveValue('John Doe');
    });

    test('should extract data from complex patterns', async ({ page }) => {
      await page.evaluate(async () => {
        await window.AEMFormAgent.discoverForm();
        await window.AEMFormAgent.analyzeFields();
        await window.AEMFormAgent.processInput('My phone number is 555-123-4567');
      });
      
      await expect(page.locator('input[name="phone"]')).toHaveValue('555-123-4567');
    });
  });

  test.describe('ContentAgent (In-Page RAG) Tests', () => {
    test('should index page content on load', async ({ page }) => {
      const contentInfo = await page.evaluate(() => {
        return {
          content: window.AEMContentAgent.pageContent,
          chunksLength: window.AEMContentAgent.chunks.length
        };
      });
      expect(contentInfo.content).not.toBe('');
      expect(contentInfo.chunksLength).toBeGreaterThan(0);
    });

    test('should answer questions based on page context', async ({ page }) => {
      const answer = await page.evaluate(() => {
        return window.AEMContentAgent.ask('What is this page about?');
      });
      expect(answer).toContain('Contact');
    });
  });

  test.describe('AuditAgent (Accessibility) Tests', () => {
    test('should scan page and find issues', async ({ page }) => {
      const issues = await page.evaluate(async () => {
        await window.AEMAuditAgent.scanPage();
        return window.AEMAuditAgent.issues;
      });
      expect(Array.isArray(issues)).toBe(true);
    });

    test('should highlight issues in debug mode', async ({ page }) => {
      await page.evaluate(() => {
        window.WEBMCP_DEBUG = true;
        window.AEMAuditAgent.reportIssue('Manual test issue', 'input[name="email"]');
      });
      
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveCSS('outline', 'rgb(255, 136, 0) dashed 3px');
    });
  });
});
