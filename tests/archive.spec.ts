import { test, expect } from '@playwright/test';

test.describe('Archive Pages with Mocked Data', () => {
  const TEST_USER = 'admin';
  const TEST_PASS = '@dm1N123';

  test.beforeEach(async ({ page }) => {
    // Navigate to Login Page
    await page.goto('http://localhost:3000/login');
    
    // Perform Login
    await page.fill('input[name="username"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASS);
    
    // Click the submit button
    await page.click('button:has-text("Start Learning")');

    // Wait for the redirect after successful login
    await page.waitForURL('http://localhost:3000/');

    // MOCK GLOBAL ENDPOINTS
    // 1. Mock the specific years endpoint for BOTH archive components
    await page.route('**/api/e-lesson/archived-years/worksheets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: ["2099"] }) // Returning a fake year
      });
    });

    // 2. Mock topics
    await page.route('**/api/e-lesson/topic*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 1, name: 'Mocked Topic' }] })
      });
    });

    // 3. Mock levels
    await page.route('**/api/e-lesson/level*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 1, code: 'MOCK-LVL', name: 'Mock Level' }], meta: { current_page: 1, last_page: 1, total: 1 } })
      });
    });
  });

  test('should display mocked data in Archived Lessons page', async ({ page }) => {
    // Set up the mocked HTTP intercept for lessons specifically
    await page.route('**/api/e-lesson/archived/template/*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 9999,
              year: 2099,
              title: "Mocked Secure Secret Lesson",
              term: "Term Infinity",
              topical_label: "No",
              active_revision_label: "No",
              published: true,
              level_primary: { code: "M-LVL" }
            }
          ],
          meta: { current_page: 1, last_page: 1, total: 1 }
        })
      });
    });

    // Navigate to Archive Lessons
    await page.goto('http://localhost:3000/archive-lessons');

    // Wait for our special mocked year to be selected
    await expect(page.locator('button[role="combobox"]', { hasText: '2099' })).toBeVisible();

    // Verify the table contains the mocked lesson title
    await expect(page.getByText('Mocked Secure Secret Lesson').first()).toBeVisible();

    // Optionally check if other mock fields like "Term Infinity" rendered
    await expect(page.getByText('Term Infinity').first()).toBeVisible();
  });

  test('should display mocked data in Archived Worksheets page', async ({ page }) => {
    // Set up the mocked HTTP intercept for worksheets specifically
    await page.route('**/api/e-lesson/archived/worksheet/*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 8888,
              year: 2099,
              title: "Mocked Worksheet Data",
              levelName: "Mock-Level",
              topicName: "Addition By Subtraction",
              created_by: "Test Bot"
            }
          ],
          meta: { current_page: 1, last_page: 1, total: 1 }
        })
      });
    });

    // Navigate to Archive Worksheets
    await page.goto('http://localhost:3000/archive-worksheets');

    // Wait for the combobox to settle on our mocked year
    await expect(page.locator('button[role="combobox"]', { hasText: '...2099' }).or(page.locator('button[role="combobox"]', { hasText: '2099' })).first()).toBeVisible();

    // Verify the table contains the mocked worksheet title
    await expect(page.getByText('Mocked Worksheet Data').first()).toBeVisible();

    // Verify topic Name
    await expect(page.getByText('Addition By Subtraction').first()).toBeVisible();
  });
});
