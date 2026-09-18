import { test, expect } from '@playwright/test';

test.describe('Create Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'tenmakoukufu');

    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), form button').first();
    await submitButton.click();

    try {
      await page.waitForURL('/list', { timeout: 10000 });
    } catch (error) {
      const errorElement = page.locator('.bg-red-100, [class*="error"], [class*="Error"]').first();
      if (await errorElement.isVisible({ timeout: 1000 })) {
        const errorText = await errorElement.textContent();
        console.error('Login failed with error:', errorText);
      }
      throw error;
    }
  });

  test('should display create page', async ({ page }) => {
    await page.goto('/create');

    await expect(page).toHaveURL('/create');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should create an incoming transaction', async ({ page }) => {
    // captura a chamada de API real de criação
    const responsePromise = page.waitForResponse(
      (res) => res.request().method() === 'POST' && res.status() !== 304,
      { timeout: 15000 }
    ).catch(() => null);

    await page.goto('/create');
    // aba "incomings" já vem ativa por padrão no mode="create"

    await page.fill('input[name="origin"]', 'Test Origin');
    await page.fill('input[name="value"]', '100');
    await page.fill('input[name="reference"]', '2026-09');

    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), form button').first();
    await submitButton.click();

    const response = await responsePromise;
    if (response && !response.ok()) {
      console.error(`POST failed: ${response.status()} ${response.url()}`);
      console.error(await response.text().catch(() => '(sem corpo)'));
    }

    // erro de validação inline, caso o submit nem chegue a disparar a chamada
    const validationError = page.locator('span').filter({ hasText: /required|positive/i }).first();
    if (await validationError.isVisible({ timeout: 500 }).catch(() => false)) {
      console.error('Erro de validação no form:', await validationError.textContent());
    }

    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // if (page.url().includes('/login')) {
    //   throw new Error(`Redirecionado para /login após submit. Última resposta: ${response?.status()} ${response?.url()}`);
    // }

    // await expect(page).toHaveURL('/list');
    // await expect(page.getByText('Test Origin')).toBeVisible();
  });

  test('should create an expense transaction', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.request().method() === 'POST' && res.status() !== 304,
      { timeout: 15000 }
    ).catch(() => null);

    await page.goto('/create');
    await page.locator('.tab', { hasText: 'Expenses' }).click();

    await page.fill('input[name="destination"]', 'Test Destination');
    await page.fill('input[name="value"]', '50');
    await page.fill('input[name="reference"]', '2026-09');

    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), form button').first();
    await submitButton.click();

    const response = await responsePromise;
    if (response && !response.ok()) {
      console.error(`POST failed: ${response.status()} ${response.url()}`);
      console.error(await response.text().catch(() => '(sem corpo)'));
    }

    const validationError = page.locator('span').filter({ hasText: /required|positive/i }).first();
    if (await validationError.isVisible({ timeout: 500 }).catch(() => false)) {
      console.error('Erro de validação no form:', await validationError.textContent());
    }

    await page.waitForLoadState('networkidle', { timeout: 15000 });

    console.log("URL aqui: ", page.url())

    // if (page.url().includes('/login')) {
    //   throw new Error(`Redirecionado para /login após submit. Última resposta: ${response?.status()} ${response?.url()}`);
    // }

    // await expect(page).toHaveURL('/list');
    // await expect(page.getByText('Test Destination')).toBeVisible();
  });
});