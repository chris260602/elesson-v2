import { test, expect } from '@playwright/test';

test.describe('MM Live Page with Mocked Data', () => {
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
    
    // 1. Mock classes dropdown for the creation dialog
    await page.route('**/api/classes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
            data: [
                { id: 1, class_id: 'Mocked Class Alpha' },
                { id: 2, class_id: 'Mocked Class Beta' }
            ] 
        })
      });
    });

    // 2. Mock live classes table
    await page.route('**/api/elearning', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                meeting_id: "mocked-meet-12345",
                url: "https://mock.live/room/12345",
                status: "open",
                title: "Mocked Live Geography Session",
                class: "Mocked Class Alpha",
                server: "europe-west",
                created_at: "2099-01-01T12:00:00.000Z"
              }
            ]
          })
        });
      } else if (route.request().method() === 'POST') {
        // Intercept Create
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: "Success", data: { meeting_id: "mocked-meet-new" } })
        });
      } else {
        await route.continue();
      }
    });

    // 3. Mock live class deletion
    await page.route('**/api/elearning/*', async route => {
      if (route.request().method() === 'DELETE') {
         await route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({ message: "Successfully deleted item" })
         });
      } else {
         await route.continue();
      }
    });
  });

  test('should display mocked live classes accurately', async ({ page }) => {
    // Navigate to MM Live Page
    await page.goto('http://localhost:3000/mm-live');

    // Verify the Card exists via title
    await expect(page.getByText('MM LIVE Classroom')).toBeVisible();

    // Verify the table contains the mocked live class title
    await expect(page.getByText('Mocked Live Geography Session').first()).toBeVisible();

    // Verify the capitalized server name renders
    await expect(page.getByText('Europe-west').first()).toBeVisible();

    // Check if status "Open" displays
    await expect(page.getByText('Open', { exact: true }).first()).toBeVisible();
  });

  test('should allow creating a new live class via mocked API POST', async ({ page }) => {
    // Navigate to MM Live Page
    await page.goto('http://localhost:3000/mm-live');
    
    // Wait for the main page to load
    await expect(page.getByText('MM LIVE Classroom')).toBeVisible();

    // Click "New online class"
    await page.click('button:has-text("New online class")');

    // Wait for the Create Dialog to open
    await expect(page.getByRole('dialog', { name: "New E-Learning" })).toBeVisible();

    // Fill the title
    await page.fill('input[name="title"]', 'Automated Test Session');

    // Select the class from the mocked dropdown
    await page.getByRole('dialog').getByRole('combobox').first().click();
    await expect(page.getByRole('option', { name: 'Mocked Class Alpha' }).first()).toBeVisible();
    await page.getByRole('option', { name: 'Mocked Class Alpha' }).first().click();

    // Click "Submit"
    await page.click('button:has-text("Submit")');

    // Assert the success toast exists!
    await expect(page.getByText('Online class created successfully')).toBeVisible();
  });
});
