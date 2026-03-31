import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/libs/granite/core/content/login.html');
  await page.fill('input[name="j_username"]', 'admin');
  await page.fill('input[name="j_password"]', 'admin');
  await page.click('#submit-button');
  await page.waitForURL('**/aem/start.html');
  await page.context().storageState({ path: 'storageState.json' });
});
