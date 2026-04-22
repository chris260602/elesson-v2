import { test, expect } from '@playwright/test';

test.describe('Levels Management Page with Mocked Data', () => {
  const TEST_USER = 'admin';
  const TEST_PASS = '@dm1N123';

  const mockLevels = {
    data: [
      { id: 1, code: 'P1', name: 'Primary 1', password: 'p1-password' },
      { id: 2, code: 'P2', name: 'Primary 2', password: 'p2-password' },
      { id: 3, code: 'S1', name: 'Secondary 1', password: 's1-password' }
    ],
    meta: { current_page: 1, last_page: 1, total: 3 }
  };

  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    // Stricter route matching to avoid accidental interception of page HTML
    await page.route(url => url.pathname.includes('/api/') && url.pathname.includes('/level'), async (route) => {
      console.log(`MOCKING API: ${route.request().method()} ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLevels)
      });
    });

    // Login Sequence - wait for network idle to ensure login page is ready
    await page.goto('http://localhost:3000/login');
    const usernameInput = page.locator('input[name="username"]');
    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    
    await usernameInput.fill(TEST_USER);
    await page.fill('input[name="password"]', TEST_PASS);
    await page.click('button:has-text("Start Learning")');

    // Wait for auth redirect
    await page.waitForURL(/localhost:3000\/?$/, { timeout: 30000 });
  });

  test('should display mocked levels accurately', async ({ page }) => {
    // Explicitly wait for the API call to complete
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/') && resp.url().includes('/level') && resp.status() === 200
    );
    
    await page.goto('http://localhost:3000/levels');
    await responsePromise;

    // Verify Title and Table structure
    await expect(page.getByText('Level Management')).toBeVisible();
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify cell contents carefully
    await expect(table.getByRole('cell', { name: 'P1', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Primary 1', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'S1', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Secondary 1', exact: true })).toBeVisible();
  });

  test('should filter levels by search query', async ({ page }) => {
    await page.goto('http://localhost:3000/levels');
    await expect(page.locator('table')).toBeVisible();

    // Search
    const searchInput = page.getByPlaceholder(/Search code or name/i);
    await searchInput.fill('Secondary');

    const table = page.locator('table');
    await expect(table.getByRole('cell', { name: 'Secondary 1', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Primary 1', exact: true })).not.toBeVisible();
  });

  test('should open level details dialog', async ({ page }) => {
    await page.goto('http://localhost:3000/levels');
    await expect(page.locator('table')).toBeVisible();

    // Open Dialog
    const p1Row = page.locator('table tr').filter({ hasText: 'Primary 1' });
    await p1Row.getByTitle('View Details').click();

    // Verify Dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Level Details')).toBeVisible();

    // Verify details
    await expect(dialog.locator('input').first()).toHaveValue('Primary 1');
    await expect(dialog.locator('input').last()).toHaveValue('p1-password');

    // Close
    await dialog.getByRole('button', { name: 'Close', exact: true }).first().click();
    await expect(dialog).not.toBeVisible();
  });
});
