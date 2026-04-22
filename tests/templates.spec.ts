import { test, expect } from '@playwright/test';

test.describe('E-Lesson Templates Management Page', () => {
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

  const mockTerms = [
    { display_val: 'Term 1' },
    { display_val: 'Term 2' },
    { display_val: 'Term 3' },
    { display_val: 'Term 4' }
  ];

  let mockTemplates = [
    {
      id: 701,
      title: 'Math Basics E-Lesson',
      year: 2024,
      term: 'Term 1',
      published: true,
      published_at: '2024-01-01T00:00:00Z',
      topical_label: 'No',
      active_revision_label: 'No',
      level: 1,
      level_primary: { id: 1, code: 'P1' }
    },
    {
      id: 702,
      title: 'Advanced Addition Topical',
      year: 2024,
      term: '-',
      published: false,
      published_at: null,
      topical_label: 'Yes',
      active_revision_label: 'No',
      level: 2,
      level_primary: { id: 2, code: 'P2' }
    }
  ];

  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    // Reset state
    mockTemplates = [
      {
        id: 701,
        title: 'Math Basics E-Lesson',
        year: 2024,
        term: 'Term 1',
        published: true,
        published_at: '2024-01-01T00:00:00Z',
        topical_label: 'No',
        active_revision_label: 'No',
        level: 1,
        level_primary: { id: 1, code: 'P1' }
      },
      {
        id: 702,
        title: 'Advanced Addition Topical',
        year: 2024,
        term: '-',
        published: false,
        published_at: null,
        topical_label: 'Yes',
        active_revision_label: 'No',
        level: 2,
        level_primary: { id: 2, code: 'P2' }
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
      } else if (requestUrl.pathname.includes('/api/e-lesson/terms')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTerms) });
      } else if (requestUrl.pathname.includes('/api/e-lesson/template')) {
        const detailMatch = requestUrl.pathname.match(/\/template\/(\d+)$/);
        
        if (method === 'GET') {
          if (detailMatch) {
            const id = parseInt(detailMatch[1]);
            const item = mockTemplates.find(t => t.id === id);
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: item }) });
          } else {
            await route.fulfill({ 
              status: 200, 
              contentType: 'application/json', 
              body: JSON.stringify({ 
                data: mockTemplates,
                meta: { current_page: 1, last_page: 1, total: mockTemplates.length }
              }) 
            });
          }
        } else if (method === 'PATCH' && detailMatch) {
          const id = parseInt(detailMatch[1]);
          const payload = JSON.parse(route.request().postData() || '{}');
          const index = mockTemplates.findIndex(t => t.id === id);
          if (index !== -1) {
            // Handle publish toggle
            if (payload.type === 'only-status') {
              mockTemplates[index].published = payload.published;
              mockTemplates[index].published_at = payload.published ? new Date().toISOString() : null;
            } else {
              // General update
              mockTemplates[index] = { ...mockTemplates[index], ...payload };
            }
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockTemplates[index] }) });
          }
        } else if (method === 'DELETE' && detailMatch) {
          const id = parseInt(detailMatch[1]);
          mockTemplates = mockTemplates.filter(t => t.id !== id);
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: "Deleted" }) });
        } else if (method === 'POST') {
            const payload = JSON.parse(route.request().postData() || '{}');
            const newItem = {
                ...payload,
                id: Math.floor(Math.random() * 1000) + 1000,
                level_primary: mockLevels.find(l => String(l.id) === String(payload.level)),
                topical_label: payload.topical ? 'Yes' : 'No',
                active_revision_label: payload.active_revision ? 'Yes' : 'No',
                published: false
            };
            mockTemplates.push(newItem);
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: newItem }) });
        } else {
          await route.continue();
        }
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

  test('should display e-lesson templates', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    
    // Wait for the specific template loader
    await expect(page.getByText(/Initializing templates/i)).not.toBeVisible();

    // Verify Unique Page Title
    await expect(page.getByRole('main').getByText('E-Lessons').first()).toBeVisible();

    // Verify Table Rows
    const table = page.locator('table');
    // Identify by data-testid
    const firstRow = page.getByTestId('desktop-row-701');
    const secondRow = page.getByTestId('desktop-row-702');
    
    await expect(firstRow).toBeVisible();
    await expect(secondRow).toBeVisible();

    // Verify data in first row (Math Basics E-Lesson)
    await expect(firstRow.getByText('2024', { exact: true })).toBeVisible();
    await expect(firstRow.getByText('Published')).toBeVisible();
  });

  test('should search templates', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    await expect(page.getByText(/Initializing templates/i)).not.toBeVisible();

    const table = page.locator('table');
    const searchInput = page.getByPlaceholder(/Search\.\.\./i);
    
    await searchInput.fill('P2');
    await expect(table.getByText('P2')).toBeVisible();
    await expect(table.getByText('P1')).not.toBeVisible();

    await searchInput.fill('2024');
    await expect(table.getByText('Term 1')).toBeVisible();
  });

  test('should open create/edit dialogs', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    await expect(page.getByText(/Initializing templates/i)).not.toBeVisible();

    const table = page.locator('table');
    
    // 1. Create E-Lesson
    await page.getByTestId('new-item-trigger').click({ force: true });
    await page.getByTestId('new-elesson-item').click({ force: true });
    await expect(page.getByRole('heading', { name: /Create E-Lesson/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByRole('heading', { name: /Create E-Lesson/i })).not.toBeVisible();
    await page.waitForTimeout(500);

    // 2. Create Topical
    await page.getByTestId('new-item-trigger').click({ force: true });
    await page.getByTestId('new-topical-item').click({ force: true });
    await expect(page.getByRole('heading', { name: /Create Topical Test/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByRole('heading', { name: /Create Topical Test/i })).not.toBeVisible();
    await page.waitForTimeout(500);

    // 3. Edit Template
    const row = page.getByTestId('desktop-row-701');
    await row.getByTestId('edit-template-btn').click();
    
    // In edit dialog, the title IS visible in the heading
    await expect(page.getByRole('heading', { name: /Edit Math Basics E-Lesson/i })).toBeVisible();
  });

  test('should toggle publish status', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    await expect(page.getByText(/Initializing templates/i)).not.toBeVisible();

    const row = page.getByTestId('desktop-row-702');
    
    // Verify initial status
    await expect(row.getByText('Not Published')).toBeVisible();

    // Click Publish icon
    await row.getByTestId('publish-template-btn').click();

    // Verify Alert Dialog
    await expect(page.getByRole('heading', { name: 'Publish Template?' })).toBeVisible();
    await page.getByRole('button', { name: /^Publish$/ }).click();

    // Verify Success toast and UI update
    await expect(page.getByText(/Published successfully/i)).toBeVisible();
    await expect(row.getByText('Published')).toBeVisible();
  });

  test('should delete a template', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    await expect(page.getByText(/Initializing templates/i)).not.toBeVisible();

    const row = page.getByTestId('desktop-row-701');

    // Click Delete Trash icon
    await row.getByTestId('delete-template-btn').click();

    // Verify Delete Dialog
    await expect(page.getByRole('heading', { name: 'Delete Template?' })).toBeVisible();
    await page.getByRole('button', { name: /^Delete$/ }).click();

    // Verify Success toast and row removal
    await expect(page.getByText(/Deleted successfully/i)).toBeVisible();
    await expect(page.getByTestId('desktop-row-701')).not.toBeVisible();
  });
});
