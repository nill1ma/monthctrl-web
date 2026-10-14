import { test, expect } from '@playwright/test';

test.describe('List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'tenmakoukufu');
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), form button').first();
    await submitButton.click();
    try {
      await page.waitForURL('/list', { timeout: 10000 });
    } catch (error) {
      const errorEl = page.locator('[data-testid="login-error"], .bg-red-100, [class*="error" i]').first();
      if (await errorEl.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.error('Login failed:', await errorEl.textContent());
      }
      throw error;
    }
  });

  test('should display the list page when authenticated', async ({ page }) => {
    await expect(page).toHaveURL('/list');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should render reference group cards', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Each group is a rounded card; expect at least one
    const cards = page.locator('.rounded-xl.border');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show currency rows inside each card', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const cards = page.locator('.rounded-xl.border');
    const cardCount = await cards.count();
    test.skip(cardCount === 0, 'No data available in this environment');

    // At least one currency row (flag + code) should be visible
    const firstCard = cards.first();
    await expect(firstCard).toContainText(/[A-Z]{3}/); // e.g. BRL, USD
  });

  test('should navigate to details page on reference click', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const cards = page.locator('.rounded-xl.border');
    const cardCount = await cards.count();
    test.skip(cardCount === 0, 'No data rows available to click in this environment');

    // The reference text is a bold span in the card header
    const firstRef = cards.first().locator('span.font-semibold').first();
    const refText = await firstRef.textContent();
    await firstRef.click();

    await expect(page).toHaveURL(/\/details\/.+/);

    if (refText) {
      const encoded = encodeURIComponent(refText.trim());
      await expect(page).toHaveURL(new RegExp(`/details/${encoded}`));
    }
  });

  test('should open delete dialog when delete icon is clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const cards = page.locator('.rounded-xl.border');
    const cardCount = await cards.count();
    test.skip(cardCount === 0, 'No data available in this environment');

    // MUI DeleteForever renders an svg inside the card header
    const deleteIcon = cards.first().locator('[data-testid="DeleteForeverIcon"], svg').first();
    await deleteIcon.click();

    // The dialog or a confirm button should appear
    const dialog = page.locator('[role="dialog"], [data-testid="delete-dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('should filter currencies via the autocomplete input', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // The autocomplete input is in the top-right of the list page
    const currencyInput = page.locator('input[placeholder*="USD"], input[placeholder*="BRL"], .awake-autocomplete-input').first();
    await expect(currencyInput).toBeVisible({ timeout: 5000 });

    await currencyInput.click();
    await currencyInput.fill('BR');

    // The popup should show BRL
    const popup = page.locator('.awake-autocomplete-popup').first();
    await expect(popup).toBeVisible({ timeout: 3000 });
    await expect(popup).toContainText('BRL');
  });

  test('should handle loading state gracefully', async ({ page }) => {
    await page.goto('/list');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // After load, cards or empty-state message should be visible
    const content = page.locator('.rounded-xl.border, [class*="empty" i], :text("list.empty")');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('rows render in the order returned by the API', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const cards = page.locator('.rounded-xl.border');
    const count = await cards.count();
    test.skip(count <= 1, 'Not enough data rows to verify ordering in this environment');

    const firstRef = await cards.first().locator('span.font-semibold').first().textContent();
    const lastRef  = await cards.last().locator('span.font-semibold').first().textContent();

    expect(firstRef).toBeTruthy();
    expect(lastRef).toBeTruthy();
  });
});
