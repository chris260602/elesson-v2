import { test, expect } from '@playwright/test';

test.describe('Worksheets Management Page with Mocked Data', () => {
  const TEST_USER = 'admin';
  const TEST_PASS = '@dm1N123';

  // Mock Data
  const mockLevels = [
    { id: 1, name: 'Primary 1', code: 'P1' },
    { id: 2, name: 'Primary 2', code: 'P2' }
  ];

  const mockTopics = [
    { id: 101, name: 'Addition', primary_level_id: 1 },
    { id: 201, name: 'Multiplication', primary_level_id: 2 }
  ];

  let mockWorksheets = [
    { 
      id: 501, 
      title: 'Worksheet Alpha', 
      year: '2024', 
      levelName: 'P1', 
      topicName: 'Addition', 
      created_by: 'Admin User',
      level_id: 1,
      subject_id: 101 
    },
    { 
      id: 502, 
      title: 'Worksheet Beta', 
      year: '2024', 
      levelName: 'P2', 
      topicName: 'Multiplication', 
      created_by: 'Admin User',
      level_id: 2,
      subject_id: 201
    }
  ];

  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    // Reset state for each test
    mockWorksheets = [
      { 
        id: 501, 
        title: 'Worksheet Alpha', 
        year: '2024', 
        levelName: 'P1', 
        topicName: 'Addition', 
        created_by: 'Admin User',
        level_id: 1,
        subject_id: 101 
      },
      { 
        id: 502, 
        title: 'Worksheet Beta', 
        year: '2024', 
        levelName: 'P2', 
        topicName: 'Multiplication', 
        created_by: 'Admin User',
        level_id: 2,
        subject_id: 201
      }
    ];

    // 1. Setup API Interception
    await page.route(url => url.pathname.includes('/api/'), async (route) => {
      const requestUrl = new URL(route.request().url());
      const method = route.request().method();

      if (requestUrl.pathname.includes('/api/level')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockLevels }) });
      } else if (requestUrl.pathname.includes('/api/topic')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockTopics }) });
      } else if (requestUrl.pathname.includes('/api/e-lesson/archived-years/worksheets')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: ['2023', '2024'] }) });
      } else if (requestUrl.pathname.includes('/api/e-lesson/worksheet')) {
        if (method === 'GET') {
          // Check for detail fetch
          const detailMatch = requestUrl.pathname.match(/\/worksheet\/(\d+)$/);
          if (detailMatch) {
            const id = parseInt(detailMatch[1]);
            const item = mockWorksheets.find(w => w.id === id);
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: item }) });
          } else {
            // List fetch - simulate pagination wrapper
            await route.fulfill({ 
              status: 200, 
              contentType: 'application/json', 
              body: JSON.stringify({ 
                data: mockWorksheets,
                meta: { current_page: 1, last_page: 1, total: mockWorksheets.length }
              }) 
            });
          }
        } else if (method === 'DELETE') {
          const detailMatch = requestUrl.pathname.match(/\/worksheet\/(\d+)$/);
          if (detailMatch) {
            const id = parseInt(detailMatch[1]);
            mockWorksheets = mockWorksheets.filter(w => w.id !== id);
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: "Deleted" }) });
          }
        } else {
          await route.continue();
        }
      } else if (requestUrl.pathname.includes('/api/e-lesson/clone/worksheet/')) {
        const idMatch = requestUrl.pathname.match(/\/clone\/worksheet\/(\d+)$/);
        if (idMatch) {
          const id = parseInt(idMatch[1]);
          const target = mockWorksheets.find(w => w.id === id);
          if (target) {
            const newWorksheet = { ...target, id: Math.floor(Math.random() * 1000) + 1000, title: `${target.title} (Clone)` };
            mockWorksheets.push(newWorksheet);
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [newWorksheet.id] }) });
          }
        }
      } else if (requestUrl.pathname.includes('/api/e-lesson/qrcode/worksheet/')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ qr_code: 'mock-qr-data', qr_code_name: 'Worksheet QR' }) });
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
    await page.waitForURL(/localhost:3000\/?$/, { timeout: 30000 });
  });

  test('should display active worksheets', async ({ page }) => {
    await page.goto('http://localhost:3000/worksheet');
    
    // Wait for the specific worksheet loader
    await expect(page.getByText(/Initializing worksheets/i)).not.toBeVisible();

    // Verify Unique Page Title
    await expect(page.getByRole('main').getByText('Active Worksheets').first()).toBeVisible();

    // Verify Table Rows
    const table = page.locator('table');
    await expect(table.getByText('Worksheet Alpha')).toBeVisible();
    await expect(table.getByText('Worksheet Beta')).toBeVisible();

    // Verify data in first row
    const alphaRow = table.locator('tr').filter({ hasText: 'Worksheet Alpha' });
    await expect(alphaRow.getByText('2024')).toBeVisible();
    await expect(alphaRow.getByText('Addition')).toBeVisible();
  });

  test('should filter and search worksheets', async ({ page }) => {
    await page.goto('http://localhost:3000/worksheet');
    await expect(page.getByText(/Initializing worksheets/i)).not.toBeVisible();

    // 1. Search Filter (Client Side)
    const searchInput = page.getByPlaceholder(/Search by title/i);
    await searchInput.fill('Beta');
    
    const table = page.locator('table');
    await expect(table.getByText('Worksheet Beta')).toBeVisible();
    await expect(table.getByText('Worksheet Alpha')).not.toBeVisible();

    // Reset Search
    await searchInput.fill('');
    await expect(table.getByText('Worksheet Alpha')).toBeVisible();

    // 2. Level Filter
    // In worksheet page, level filter matches by code ('P1', 'P2')
    const levelTrigger = page.getByRole('combobox').filter({ hasText: 'All Levels' });
    await levelTrigger.click();
    await page.getByRole('option', { name: 'Primary 2' }).click();

    await expect(table.getByText('Worksheet Beta')).toBeVisible();
    await expect(table.getByText('Worksheet Alpha')).not.toBeVisible();
  });

  test('should open action dialogs', async ({ page }) => {
    await page.goto('http://localhost:3000/worksheet');
    await expect(page.getByText(/Initializing worksheets/i)).not.toBeVisible();

    const table = page.locator('table');
    const alphaRow = table.locator('tr').filter({ hasText: 'Worksheet Alpha' });

    // 1. Edit Dialog
    await alphaRow.locator('button').filter({ has: page.locator('svg.lucide-pencil') }).click();
    await expect(page.getByRole('dialog').getByText(/Loading/i)).not.toBeVisible();
    await expect(page.getByRole('dialog')).toContainText(/Edit Worksheet/i);
    await page.keyboard.press('Escape');

    // 2. Archive by Year Dialog
    await page.click('button:has-text("Archive by Year")');
    await expect(page.getByRole('dialog')).toContainText(/Archive by Year/i);
    await page.keyboard.press('Escape');

    // 3. QR Code Dialog
    await alphaRow.locator('button').filter({ has: page.locator('svg.lucide-qr-code') }).click();
    await expect(page.getByRole('dialog')).toContainText(/QR Code/i);
    await page.keyboard.press('Escape');
    
    // 4. Add Worksheet Dialog
    await page.click('button:has-text("Add Worksheet")');
    // Wait for the dialog and initial loading if any (though for New it's usually fast)
    await expect(page.getByRole('dialog')).toContainText(/Create Worksheet/i);
  });

  test('should clone a worksheet', async ({ page }) => {
    await page.goto('http://localhost:3000/worksheet');
    await expect(page.getByText(/Initializing worksheets/i)).not.toBeVisible();

    const table = page.locator('table');
    const alphaRow = table.locator('tr').filter({ hasText: 'Worksheet Alpha' });

    // Click Clone (Copy icon)
    await alphaRow.locator('button').filter({ has: page.locator('svg.lucide-copy') }).click();

    // Confirm in Clone Dialog
    await expect(page.getByRole('heading', { name: 'Clone Worksheet?' })).toBeVisible();
    await page.click('button:has-text("Clone")');

    // Verify Success toast
    await expect(page.getByText(/Cloned successfully/i)).toBeVisible();

    // Verify new row exists
    await expect(page.getByText(/Initializing worksheets/i)).not.toBeVisible();
    await expect(table.getByText('Worksheet Alpha (Clone)')).toBeVisible();
  });

  test('should delete a worksheet', async ({ page }) => {
    await page.goto('http://localhost:3000/worksheet');
    await expect(page.getByText(/Initializing worksheets/i)).not.toBeVisible();

    const table = page.locator('table');
    const alphaRow = table.locator('tr').filter({ hasText: 'Worksheet Alpha' });

    // Click Delete Trash icon
    await alphaRow.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).click();

    // Affirmative action in Delete Dialog
    await expect(page.getByRole('heading', { name: 'Delete Worksheet?' })).toBeVisible();
    // Use part of the button text because it might be "Delete" or icon
    await page.getByRole('button', { name: /^Delete$/ }).click();

    // Verify Success toast
    await expect(page.getByText(/Deleted successfully/i)).toBeVisible();

    // Verify row is gone
    await expect(page.getByText(/Initializing worksheets/i)).not.toBeVisible();
    await expect(table.getByText('Worksheet Alpha')).not.toBeVisible();
  });
});
