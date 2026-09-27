import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './reference',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/reference', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4178',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-blink-features=WebMCP,WebMCPTesting'] },
    ...(process.env.WEBMCP_BROWSER_CHANNEL ? { channel: process.env.WEBMCP_BROWSER_CHANNEL } : {}),
  },
  projects: [{ name: 'reference-chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'node ../test-site/server.mjs',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: !process.env.CI,
  },
});
