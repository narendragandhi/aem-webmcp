import { test, expect } from '@playwright/test';

const input = { fullName: 'Alex Example', email: 'alex@example.com', message: 'Please help restore my account access.' };
test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('AEM transport sends form parameters and a Granite header after confirmation', async ({ page }) => {
  await page.locator('form').evaluate(form => {
    form.setAttribute('data-webmcp-encoding', 'form');
    form.setAttribute('data-webmcp-csrf', 'granite');
  });
  await page.route('**/libs/granite/csrf/token.json', route => route.fulfill({ json: { token: 'test-token' } }));
  // Transport contract fixture only: this does not emulate Granite's validation filter.
  await page.route('**/api/support', route => route.fulfill({ json: { success: true, demo: true } }));
  await page.getByLabel('Full name', { exact: true }).fill(input.fullName);
  await page.getByLabel('Reply email').fill(input.email);
  await page.getByLabel('How can we help?').fill(input.message);
  await page.getByRole('button', { name: 'Review request' }).click();
  const sent = page.waitForRequest('**/api/support');
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  const request = await sent;
  expect(request.headers()['csrf-token']).toBe('test-token');
  expect(request.headers()['content-type']).toContain('application/x-www-form-urlencoded');
  expect(Object.fromEntries(new URLSearchParams(request.postData()!))).toEqual(input);
});

test('changes during token retrieval invalidate confirmation and send no form request', async ({ page }) => {
  let submissions = 0;
  page.on('request', request => { if (request.url().endsWith('/api/support')) submissions++; });
  await page.locator('form').evaluate(form => form.setAttribute('data-webmcp-csrf', 'granite'));
  await page.route('**/libs/granite/csrf/token.json', async route => {
    await page.locator('#message').evaluate(field => { (field as HTMLTextAreaElement).value = 'A newer human message'; });
    await route.fulfill({ json: { token: 'test-token' } });
  });
  await page.getByLabel('Full name', { exact: true }).fill(input.fullName);
  await page.getByLabel('Reply email').fill(input.email);
  await page.getByLabel('How can we help?').fill(input.message);
  await page.getByRole('button', { name: 'Review request' }).click();
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await expect(page.locator('form [role="status"]')).toContainText('The form changed');
  expect(submissions).toBe(0);
});

test('native stale proposal preserves the human edit without submitting', async ({ page, browser }) => {
  const available = await page.evaluate(() => {
    const mc = (document as any).modelContext || (navigator as any).modelContext;
    return typeof mc?.getTools === 'function' && typeof mc?.executeTool === 'function';
  });
  test.skip(!available, 'Native invocation unavailable; required native gate checks support separately.');
  const legacy = Number(browser.version().split('.')[0]) < 155;
  await page.getByRole('button', { name: 'Enable assistant access' }).click();
  await page.getByRole('button', { name: 'Allow Access' }).click();
  const revision = await page.evaluate(async legacy => {
    const mc = (document as any).modelContext || (navigator as any).modelContext;
    const tool = (await mc.getTools()).find((t: any) => t.name === 'inspect_submit_support_request');
    const result = await mc.executeTool(tool, legacy ? '{}' : {});
    return (typeof result === 'string' ? JSON.parse(result) : result).revision;
  }, legacy);
  await page.getByLabel('How can we help?').fill('Preserve this human edit.');
  const result = await page.evaluate(async ({ input, revision, legacy }) => {
    const mc = (document as any).modelContext || (navigator as any).modelContext;
    const tool = (await mc.getTools()).find((t: any) => t.name === 'submit_support_request');
    const args = { ...input, expectedRevision: revision };
    const result = await mc.executeTool(tool, legacy ? JSON.stringify(args) : args);
    return typeof result === 'string' ? JSON.parse(result) : result;
  }, { input, revision, legacy });
  expect(result.error).toBe('STALE_REVISION');
  await expect(page.getByLabel('How can we help?')).toHaveValue('Preserve this human edit.');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('human journey validates, confirms and displays the backend receipt', async ({ page }) => {
  await page.getByRole('button', { name: 'Review request' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Full name', { exact: true }).fill(input.fullName);
  await page.getByLabel('Reply email').fill(input.email);
  await page.getByLabel('How can we help?').fill(input.message);
  await page.getByRole('button', { name: 'Review request' }).click();
  await expect(page.getByRole('dialog')).toContainText(input.email);
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await expect(page.locator('form [role="status"]')).toContainText('"demo": true');
  await expect(page.locator('form [role="status"]')).toContainText('"receipt"');
});

test('declining confirmation sends no request', async ({ page }) => {
  let requests = 0;
  page.on('request', request => { if (request.url().endsWith('/api/support')) requests++; });
  await page.getByLabel('Full name', { exact: true }).fill(input.fullName);
  await page.getByLabel('Reply email').fill(input.email);
  await page.getByLabel('How can we help?').fill(input.message);
  await page.getByRole('button', { name: 'Review request' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('form [role="status"]')).toContainText('Submission canceled');
  expect(requests).toBe(0);
});

test('public API example supports positional arguments', async ({ page }) => {
  await page.getByRole('button', { name: 'Enable assistant access' }).click();
  await page.getByRole('button', { name: 'Allow Access' }).click();
  await page.evaluate(() => (window as any).AEMWebMCP.fillForm('#email', 'user@example.com'));
  await expect(page.locator('#email')).toHaveValue('user@example.com');
});

test('backend rejects invalid requests even when browser validation is bypassed', async ({ request }) => {
  const response = await request.post('/api/support', {
    headers: { Origin: 'http://127.0.0.1:4178' },
    data: { ...input, email: 'invalid' },
  });
  expect(response.status()).toBe(400);
});

test('backend failures remain failures in the visible form', async ({ page }) => {
  await page.route('**/api/support', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false,"error":"Support unavailable"}' }));
  await page.getByLabel('Full name', { exact: true }).fill(input.fullName);
  await page.getByLabel('Reply email').fill(input.email);
  await page.getByLabel('How can we help?').fill(input.message);
  await page.getByRole('button', { name: 'Review request' }).click();
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await expect(page.locator('form [role="status"]')).toContainText('Support unavailable');
});

test('native discovery and execution use the browser API, never a mock', async ({ page, browser }, testInfo) => {
  const capabilities = await page.evaluate(() => {
    const mc = (document as any).modelContext || (navigator as any).modelContext;
    return { registerTool: typeof mc?.registerTool, getTools: typeof mc?.getTools, executeTool: typeof mc?.executeTool };
  });
  await testInfo.attach('browser-capabilities', { body: JSON.stringify({ version: browser.version(), capabilities }), contentType: 'application/json' });
  // Explicit opt-in gate: absence fails certification, never passes through a mock.
  if (process.env.WEBMCP_REQUIRE_NATIVE === '1') {
    expect(capabilities.getTools, 'Selected browser must implement current native discovery').toBe('function');
    expect(capabilities.executeTool).toBe('function');
  }
  test.skip(capabilities.getTools !== 'function' || capabilities.executeTool !== 'function', 'Current native API unavailable; this browser is not certified.');
  await page.getByRole('button', { name: 'Enable assistant access' }).click();
  await page.getByRole('button', { name: 'Allow Access' }).click();
  const names = await page.evaluate(async () => {
    const mc = (document as any).modelContext || (navigator as any).modelContext;
    return (await mc.getTools()).map((tool: any) => tool.name);
  });
  expect(names).toContain('prepare_support_request');
  expect(names).toContain('submit_support_request');
  const legacyArguments = Number(browser.version().split('.')[0]) < 155;
  const invocation = page.evaluate(async ({ input, legacyArguments }) => {
    const mc = (document as any).modelContext || (navigator as any).modelContext;
    const tool = (await mc.getTools()).find((tool: any) => tool.name === 'submit_support_request');
    const result = await mc.executeTool(tool, legacyArguments ? JSON.stringify(input) : input);
    return typeof result === 'string' ? JSON.parse(result) : result;
  }, { input, legacyArguments });
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  expect(await invocation).toMatchObject({ success: true, demo: true });
});

test('adapter cancellation while awaiting confirmation sends no request', async ({ page }) => {
  let requests = 0;
  page.on('request', request => { if (request.url().endsWith('/api/support')) requests++; });
  await page.getByLabel('Full name', { exact: true }).fill(input.fullName);
  await page.getByLabel('Reply email').fill(input.email);
  await page.getByLabel('How can we help?').fill(input.message);
  const pending = page.evaluate(async () => {
    const controller = new AbortController();
    (window as any).pendingController = controller;
    try { await (document.querySelector('form') as any).webmcpSubmit(controller.signal); }
    catch (error) { return (error as Error).name; }
  });
  await page.getByRole('dialog').waitFor();
  await page.evaluate(() => (window as any).pendingController.abort());
  expect(await pending).toBe('AbortError');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(requests).toBe(0);
});
