import { test, expect } from '@playwright/test';

test.describe('Revision Word Problems Page with Mocked Data', () => {
  const TEST_USER = 'admin';
  const TEST_PASS = '@dm1N123';

  // Mock Data
  const mockLevels = [
    { id: 1, name: 'Primary 1' },
    { id: 2, name: 'Primary 2' }
  ];

  const mockTopics = [
    { id: 101, name: 'Addition', primary_level_id: 1 },
    { id: 201, name: 'Multiplication', primary_level_id: 2 }
  ];

  let mockQuestions = [
    { 
      id: 1, 
      comment: 'Mock Question One', 
      level_label: 'Primary 1', 
      subject_label: 'Addition', 
      question_no: 1, 
      difficulty: 3, 
      created_by_label: 'Admin User',
      primary_level_id: 1,
      main_topic_id: 101,
      level_id: 1, // field used in form
      subject_id: 101 // field used in form
    },
    { 
      id: 2, 
      comment: 'Mock Question Two', 
      level_label: 'Primary 2', 
      subject_label: 'Multiplication', 
      question_no: 5, 
      difficulty: 5, 
      created_by_label: 'Admin User',
      primary_level_id: 2,
      main_topic_id: 201,
      level_id: 2,
      subject_id: 201
    }
  ];

  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    // Reset state
    mockQuestions = [
      { 
        id: 1, 
        comment: 'Mock Question One', 
        level_label: 'Primary 1', 
        subject_label: 'Addition', 
        question_no: 1, 
        difficulty: 3, 
        created_by_label: 'Admin User',
        primary_level_id: 1,
        main_topic_id: 101,
        level_id: 1,
        subject_id: 101
      },
      { 
        id: 2, 
        comment: 'Mock Question Two', 
        level_label: 'Primary 2', 
        subject_label: 'Multiplication', 
        question_no: 5, 
        difficulty: 5, 
        created_by_label: 'Admin User',
        primary_level_id: 2,
        main_topic_id: 201,
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
      } else if (requestUrl.pathname.includes('/api/revision-problem-sums')) {
        if (method === 'GET') {
          // If it's a detail fetch
          const detailMatch = requestUrl.pathname.match(/\/revision-problem-sums\/(\d+)$/);
          if (detailMatch) {
            const id = parseInt(detailMatch[1]);
            const item = mockQuestions.find(q => q.id === id);
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: item }) });
          } else {
            // List fetch
            const levelId = requestUrl.searchParams.get('primary_level_id');
            const topicId = requestUrl.searchParams.get('main_topic_id');

            let filtered = [...mockQuestions];
            if (levelId && levelId !== '0') {
              filtered = filtered.filter(q => String(q.primary_level_id) === levelId);
            }
            if (topicId && topicId !== '0') {
              filtered = filtered.filter(q => String(q.main_topic_id) === topicId);
            }

            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: filtered }) });
          }
        } else if (method === 'DELETE') {
          const detailMatch = requestUrl.pathname.match(/\/revision-problem-sums\/(\d+)$/);
          if (detailMatch) {
            const id = parseInt(detailMatch[1]);
            mockQuestions = mockQuestions.filter(q => q.id !== id);
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: "Success" }) });
          }
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

  test('should display mocked questions accurately', async ({ page }) => {
    await page.goto('http://localhost:3000/revision-word-problems');
    await expect(page.getByText(/Loading questions/i)).not.toBeVisible();

    // Verify Title (Corrected locator to be unique)
    await expect(page.getByRole('main').getByText('Revision Word Problems').first()).toBeVisible();

    const table = page.locator('table');
    await expect(table.getByText('Mock Question One')).toBeVisible();
    await expect(table.getByText('Mock Question Two')).toBeVisible();
  });

  test('should filter and search questions', async ({ page }) => {
    await page.goto('http://localhost:3000/revision-word-problems');
    await expect(page.getByText(/Loading questions/i)).not.toBeVisible();

    // 1. Search Filter
    const searchInput = page.getByPlaceholder(/Search comments/i);
    await searchInput.fill('Two');
    
    const table = page.locator('table');
    await expect(table.getByText('Mock Question Two')).toBeVisible();
    await expect(table.getByText('Mock Question One')).not.toBeVisible();

    // Reset Search
    await searchInput.fill('');
    await expect(table.getByText('Mock Question One')).toBeVisible();

    // 2. Level Filter
    const levelTrigger = page.getByRole('combobox').filter({ hasText: 'All Levels' });
    await levelTrigger.click();
    await page.getByRole('option', { name: 'Primary 2' }).click();

    await expect(page.getByText(/Loading questions/i)).not.toBeVisible();
    await expect(table.getByText('Mock Question Two')).toBeVisible();
    await expect(table.getByText('Mock Question One')).not.toBeVisible();
  });

  test('should open action dialogs', async ({ page }) => {
    await page.goto('http://localhost:3000/revision-word-problems');
    await expect(page.getByText(/Loading questions/i)).not.toBeVisible();

    const table = page.locator('table');
    const firstRow = table.locator('tr').filter({ hasText: 'Mock Question One' });

    // 1. Edit Dialog (Corrected string / closing)
    await firstRow.locator('button').filter({ has: page.locator('svg.text-blue-600') }).click();
    // Wait for internal loading to finish
    await expect(page.getByRole('dialog').getByText(/Loading form data/i)).not.toBeVisible();
    await expect(page.getByRole('dialog')).toContainText(/Edit Revision Question/i);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 2. Preview Dialog
    await firstRow.locator('button').filter({ has: page.locator('svg.lucide-eye') }).click();
    await expect(page.getByRole('dialog')).toContainText(/Preview/i);
    await page.keyboard.press('Escape');

    // 3. Swap Dialog
    await firstRow.locator('button').filter({ has: page.locator('svg.lucide-arrow-up-down') }).click();
    await expect(page.getByRole('dialog')).toContainText(/Swap Question Number/i);
    await page.keyboard.press('Escape');
    
    // 4. New Item Dialog
    await page.click('button:has-text("New Item")');
    await expect(page.getByRole('dialog')).toContainText(/New Revision Question/i);
  });

  test('should delete a question', async ({ page }) => {
    await page.goto('http://localhost:3000/revision-word-problems');
    await expect(page.getByText(/Loading questions/i)).not.toBeVisible();

    const table = page.locator('table');
    const firstRow = table.locator('tr').filter({ hasText: 'Mock Question One' });

    await firstRow.locator('button').filter({ has: page.locator('svg.text-red-600') }).click();

    await expect(page.getByText('Delete Question?')).toBeVisible();
    await page.click('button:has-text("Delete")');

    await expect(page.getByText(/Deleted successfully/i)).toBeVisible();

    await expect(page.getByText(/Loading questions/i)).not.toBeVisible();
    await expect(table.getByText('Mock Question One')).not.toBeVisible();
  });
});
