import { test, expect } from '@playwright/test';

test('Debug AEM WebMCP Load with Login', async ({ page }) => {
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

  // 1. Perform Login
  await page.goto('http://localhost:4502/libs/granite/core/content/login.html');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin');
  await page.click('#submit-button');
  await page.waitForURL('**/aem/start.html');
  console.log('Login successful');

  // 2. Navigate to target page
  await page.goto('http://localhost:4502/content/aem-webmcp/us/en/contact.html', { waitUntil: 'networkidle' });
  
  const state = await page.evaluate(() => {
    return {
      url: window.location.href,
      webmcp: !!window.AEMWebMCP,
      automator: !!window.AEMWebMCPAutomator,
      agents: {
          form: !!window.AEMFormAgent,
          content: !!window.AEMContentAgent,
          audit: !!window.AEMAuditAgent
      },
      scripts: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s.includes('clientlib'))
    };
  });
  
  console.log('Page State:', JSON.stringify(state, null, 2));
  expect(state.url).toContain('contact.html');
  expect(state.webmcp).toBeTruthy();
});
