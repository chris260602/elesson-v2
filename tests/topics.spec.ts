import { test, expect } from '@playwright/test';

test.describe('Topics Management Page with Mocked Data', () => {
  const TEST_USER = 'admin';
  const TEST_PASS = '@dm1N123';

  // Predefined mock data
  const mockLevels = {
    data: [
      { id: 1, code: 'P1', name: 'Primary 1' },
      { id: 2, code: 'P2', name: 'Primary 2' }
    ],
    meta: { total: 2 }
  };

  const mockTopics = [
    { id: 101, name: 'Addition', available_level: ['P1', 'P2'] },
    { id: 102, name: 'Multiplication', available_level: ['P2'] }
  ];

  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    // 1. Mock API Endpoints (Strict matching to avoid intercepting pages)
    await page.route(url => url.pathname.includes('/api/') && url.pathname.includes('/level'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLevels)
      });
    });

    await page.route(url => url.pathname.includes('/api/') && url.pathname.includes('/topic'), async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockTopics })
        });
      } else if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: "Success", data: { id: 103, ...route.request().postDataJSON() } })
        });
      } else if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: "Success" })
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: "Successfully deleted topic" })
        });
      } else {
        await route.continue();
      }
    });

    // 2. Perform Login
    await page.goto('http://localhost:3000/login');
    const usernameInput = page.locator('input[name="username"]');
    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    
    await usernameInput.fill(TEST_USER);
    await page.fill('input[name="password"]', TEST_PASS);
    await page.click('button:has-text("Start Learning")');

    // 3. Wait for redirect
    await page.waitForURL(/localhost:3000\/?$/, { timeout: 30000 });
  });

  test('should display mocked topics accurately', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/') && resp.url().includes('/topic') && resp.status() === 200
    );
    await page.goto('http://localhost:3000/topics');
    await responsePromise;

    await expect(page.getByText(/Loading topics/i)).not.toBeVisible();

    // Verify Title
    await expect(page.getByText('Topic Management')).toBeVisible();

    // Target the table to avoid cross-DOM pollution
    const table = page.locator('table');
    await expect(table.getByRole('cell', { name: 'Addition', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Multiplication', exact: true })).toBeVisible();

    // Verify badges
    const additionRow = table.locator('tr').filter({ hasText: 'Addition' });
    await expect(additionRow.getByText('P1')).toBeVisible();
    await expect(additionRow.getByText('P2')).toBeVisible();
  });

  test('should allow creating a new topic', async ({ page }) => {
    await page.goto('http://localhost:3000/topics');
    await expect(page.getByText(/Loading topics/i)).not.toBeVisible();

    // Click "New Topic"
    await page.click('button:has-text("New Topic")');

    // Verify Dialog is open
    const dialog = page.getByRole('dialog', { name: /Add New Topic/i });
    await expect(dialog).toBeVisible();

    // Fill Name
    await dialog.getByPlaceholder(/e\.g\. Fractions/i).fill('Fractions');

    // Toggle P1 and P2 checkboxes
    await dialog.locator('label:has-text("P1")').click();
    await dialog.locator('label:has-text("P2")').click();

    // Submit
    await dialog.getByRole('button', { name: /Save/i }).click();

    // Assert Toast
    await expect(page.getByText('New topic created')).toBeVisible();
  });

  test('should allow editing an existing topic', async ({ page }) => {
    await page.goto('http://localhost:3000/topics');
    await expect(page.getByText(/Loading topics/i)).not.toBeVisible();

    // Find row in table
    const table = page.locator('table');
    const additionRow = table.locator('tr').filter({ hasText: 'Addition' });
    await additionRow.getByTitle('Edit').click();

    // Verify Dialog
    const dialog = page.getByRole('dialog', { name: /Edit Topic/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input').first()).toHaveValue('Addition');

    // Change name
    await dialog.locator('input').first().fill('Advanced Addition');

    // Submit
    await dialog.getByRole('button', { name: /Save/i }).click();

    // Assert Toast
    await expect(page.getByText('Topic updated')).toBeVisible();
  });

  test('should allow deleting a topic', async ({ page }) => {
    await page.goto('http://localhost:3000/topics');
    await expect(page.getByText(/Loading topics/i)).not.toBeVisible();

    // Find row
    const table = page.locator('table');
    const multRow = table.locator('tr').filter({ hasText: 'Multiplication' });
    await multRow.getByTitle('Delete').click();

    // Verify Alert Dialog
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible();

    // Confirm Delete
    await alertDialog.getByRole('button', { name: /Yes, delete it!/i }).click();

    // Assert Toast
    await expect(page.getByText('Topic deleted')).toBeVisible();
  });

  test('should filter topics by name', async ({ page }) => {
    await page.goto('http://localhost:3000/topics');
    await expect(page.getByText(/Loading topics/i)).not.toBeVisible();

    // Search
    const searchInput = page.getByPlaceholder(/Search topics by name/i);
    await searchInput.fill('Mult');

    // Verify result in table
    const table = page.locator('table');
    await expect(table.getByRole('cell', { name: 'Multiplication', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Addition', exact: true })).not.toBeVisible();
  });
});
