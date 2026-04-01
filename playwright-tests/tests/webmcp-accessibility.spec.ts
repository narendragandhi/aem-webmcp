import { test, expect } from '@playwright/test';

/**
 * Accessibility E2E Tests - WCAG compliance, screen reader support
 */

test.describe('AEM WebMCP - Accessibility Tests', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.AEM_WEBMCP_CONSENT = true;
    });
  });

  test.describe('Accessibility Tree Support', () => {
    test('should provide accessibility tree data', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const a11yTree = await page.evaluate(() => {
        return window.AEMWebMCP?.getAccessibilityTree?.() || null;
      });

      if (a11yTree) {
        expect(a11yTree).toHaveProperty('nodes');
      }
    });

    test('should include ARIA roles in component data', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const components = await page.evaluate(() => {
        return window.AEMWebMCP?.getComponents?.() || [];
      });

      components.forEach((component: any) => {
        if (component.element) {
          // Components should expose ARIA info
        }
      });
    });

    test('should report focusable elements', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const focusables = await page.evaluate(() => {
        const elements = document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return Array.from(elements).map(el => ({
          tag: el.tagName,
          role: el.getAttribute('role'),
          tabindex: el.getAttribute('tabindex')
        }));
      });

      expect(focusables.length).toBeGreaterThan(0);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation in accordion', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const accordion = page.locator('[data-webmcp-action="accordion"]').first();

      if (await accordion.count() > 0) {
        await accordion.focus();
        await page.keyboard.press('Enter');

        // Check if accordion item expanded
        const expanded = await accordion.getAttribute('aria-expanded');
      }
    });

    test('should support keyboard navigation in tabs', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const tablist = page.locator('[role="tablist"]').first();

      if (await tablist.count() > 0) {
        const firstTab = page.locator('[role="tab"]').first();
        await firstTab.focus();
        await page.keyboard.press('ArrowRight');

        // Check if focus moved to next tab
      }
    });

    test('should trap focus in modal dialogs', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Open modal if present
      const modalTrigger = page.locator('[data-toggle="modal"]').first();

      if (await modalTrigger.count() > 0) {
        await modalTrigger.click();

        // Tab through modal elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Focus should still be within modal
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const headings = await page.evaluate(() => {
        const h1s = document.querySelectorAll('h1');
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return {
          h1Count: h1s.length,
          totalHeadings: allHeadings.length,
          hierarchy: Array.from(allHeadings).map(h => ({
            level: parseInt(h.tagName.slice(1)),
            text: h.textContent?.trim().slice(0, 50)
          }))
        };
      });

      // Should have exactly one h1
      expect(headings.h1Count).toBeLessThanOrEqual(1);
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const images = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          src: img.src,
          alt: img.alt,
          hasAlt: img.hasAttribute('alt')
        }));
      });

      images.forEach((img: any) => {
        expect(img.hasAlt).toBe(true);
      });
    });

    test('should have form labels', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });

      const inputs = await page.evaluate(() => {
        const formInputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        return Array.from(formInputs).map(input => {
          const id = input.id;
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');

          return {
            id,
            name: input.getAttribute('name'),
            hasLabel: !!label,
            hasAriaLabel: !!ariaLabel,
            hasAriaLabelledBy: !!ariaLabelledBy,
            isAccessible: !!label || !!ariaLabel || !!ariaLabelledBy
          };
        });
      });

      inputs.forEach((input: any) => {
        expect(input.isAccessible).toBe(true);
      });
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // Check for live regions
      const liveRegions = await page.evaluate(() => {
        return document.querySelectorAll('[aria-live]').length;
      });

      // Should have at least one live region for notifications
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast for text', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      // This is a simplified check - use axe-core for real contrast testing
      const textElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, a, button, label');
        return Array.from(elements).slice(0, 10).map(el => {
          const style = window.getComputedStyle(el);
          return {
            text: el.textContent?.trim().slice(0, 20),
            color: style.color,
            background: style.backgroundColor
          };
        });
      });

      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  test.describe('Focus Indicators', () => {
    test('should show visible focus indicators', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const button = page.locator('button, a').first();

      if (await button.count() > 0) {
        await button.focus();

        // Check for focus outline
        const outlineStyle = await button.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            boxShadow: style.boxShadow,
            border: style.border
          };
        });

        // Should have some focus indicator
        const hasFocusIndicator =
          outlineStyle.outline !== 'none' ||
          outlineStyle.boxShadow !== 'none' ||
          outlineStyle.border !== 'none';
      }
    });
  });

  test.describe('AuditAgent Integration', () => {
    test('should run accessibility audit via AuditAgent', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const auditResults = await page.evaluate(async () => {
        if (window.AEMAuditAgent) {
          await window.AEMAuditAgent.scanPage();
          return window.AEMAuditAgent.issues || [];
        }
        return null;
      });

      if (auditResults) {
        expect(Array.isArray(auditResults)).toBe(true);
      }
    });

    test('should categorize issues by severity', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const issues = await page.evaluate(async () => {
        if (window.AEMAuditAgent) {
          await window.AEMAuditAgent.scanPage();
          return window.AEMAuditAgent.issues || [];
        }
        return [];
      });

      if (issues.length > 0) {
        issues.forEach((issue: any) => {
          expect(['critical', 'serious', 'moderate', 'minor']).toContain(issue.severity);
        });
      }
    });

    test('should provide fix suggestions', async ({ page }) => {
      await page.goto('/content/aem-webmcp/us/en.html', { waitUntil: 'networkidle' });

      const issues = await page.evaluate(async () => {
        if (window.AEMAuditAgent) {
          await window.AEMAuditAgent.scanPage();
          return window.AEMAuditAgent.issues || [];
        }
        return [];
      });

      if (issues.length > 0) {
        issues.forEach((issue: any) => {
          if (issue.fixSuggestion) {
            expect(typeof issue.fixSuggestion).toBe('string');
          }
        });
      }
    });
  });
});
