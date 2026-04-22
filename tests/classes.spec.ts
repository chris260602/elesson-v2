import { test, expect } from '@playwright/test';

test.describe('Classes Management Page with Mocked Data', () => {
  const TEST_USER = 'admin';
  const TEST_PASS = '@dm1N123';

  // State for the mock data - needs to be mutable to handle updates/re-fetches
  let currentClasses = [
    { id: 1, class_id: 'Mocked Class Alpha', tags: 'SG' },
    { id: 2, class_id: 'Mocked Class Beta', tags: 'R' },
    { id: 3, class_id: 'Mocked Class Gamma', tags: 'F' }
  ];

  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    // Reset state before each test
    currentClasses = [
      { id: 1, class_id: 'Mocked Class Alpha', tags: 'SG' },
      { id: 2, class_id: 'Mocked Class Beta', tags: 'R' },
      { id: 3, class_id: 'Mocked Class Gamma', tags: 'F' }
    ];

    // 1. Intercept before navigation
    await page.route(url => url.pathname.includes('/api/') && url.pathname.includes('/classes'), async (route) => {
      const method = route.request().method();
      const requestUrl = route.request().url();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: currentClasses })
        });
      } else if (method === 'PATCH') {
        const payload = route.request().postDataJSON();
        
        // Extract ID from URL: e.g. /api/classes/1
        const idMatch = requestUrl.match(/\/classes\/(\d+)/);
        const id = idMatch ? parseInt(idMatch[1]) : 1;
        
        console.log(`MOCK PATCH: Updating class ${id} to tag ${payload.tags}`);
        
        // Update the state
        currentClasses = currentClasses.map(c => 
          c.id === id ? { ...c, tags: payload.tags } : c
        );
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            message: "Success", 
            data: currentClasses.find(c => c.id === id)
          })
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

  test('should display mocked classes accurately', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/') && resp.url().includes('/classes') && resp.status() === 200
    );
    await page.goto('http://localhost:3000/classes');
    await responsePromise;
    
    await expect(page.getByText(/Loading classes/i)).not.toBeVisible();

    // Verify Title
    await expect(page.getByText('Classes Management')).toBeVisible();

    // Target table
    const table = page.locator('table');
    await expect(table).toBeVisible();
    for (const cls of currentClasses) {
      await expect(table.getByRole('cell', { name: cls.class_id, exact: true })).toBeVisible();
    }
  });

  test('should allow changing class status/tag', async ({ page }) => {
    await page.goto('http://localhost:3000/classes');
    await expect(page.getByText(/Loading classes/i)).not.toBeVisible();

    const table = page.locator('table');
    const alphaRow = table.locator('tr').filter({ hasText: 'Mocked Class Alpha' });
    
    // Find the select trigger in this row
    const selectTrigger = alphaRow.getByRole('combobox');
    await selectTrigger.click();

    // Select "Regular" from the dropdown options
    const option = page.getByRole('option', { name: 'Regular' }).last();
    await option.click();

    // Verify success toast appears
    await expect(page.getByText(/Tag updated to Regular/i)).toBeVisible();

    // Wait for the re-fetch loader to disappear
    await expect(page.getByText(/Loading classes/i)).not.toBeVisible({ timeout: 15000 });

    // Verify the UI reflects the change in the Status column (Badge)
    const badge = alphaRow.locator('span.inline-flex').filter({ hasText: 'Regular' });
    await expect(badge.first()).toBeVisible({ timeout: 15000 });
  });

  test('should filter classes by search query', async ({ page }) => {
    await page.goto('http://localhost:3000/classes');
    await expect(page.getByText(/Loading classes/i)).not.toBeVisible();

    const searchInput = page.getByPlaceholder(/Search by Class Name/i);
    await searchInput.fill('Beta');

    const table = page.locator('table');
    await expect(table.getByRole('cell', { name: 'Mocked Class Beta', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Mocked Class Alpha', exact: true })).not.toBeVisible();
  });

  test('should filter classes by tag', async ({ page }) => {
    await page.goto('http://localhost:3000/classes');
    await expect(page.getByText(/Loading classes/i)).not.toBeVisible();

    const filterTrigger = page.getByRole('combobox').filter({ hasText: 'All Tags' });
    await filterTrigger.click();
    
    // Select "Fast" option
    await page.getByRole('option', { name: 'Fast', exact: true }).click();

    const table = page.locator('table');
    await expect(table.getByRole('cell', { name: 'Mocked Class Gamma', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Mocked Class Alpha', exact: true })).not.toBeVisible();
  });
});
