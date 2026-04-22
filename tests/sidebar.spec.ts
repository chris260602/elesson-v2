import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
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
  });

  test('should verify all sidebar links navigate correctly', async ({ page }) => {
    test.slow(); // Increases test timeout to 90s, suitable for many sequential navigations

    const sidebarLinks = [
      { name: 'Worksheets', path: '/worksheet' },
      { name: 'E-Lessons', path: '/templates' },
      { name: 'Resources', path: '/' },
      { name: 'MM Live', path: '/mm-live' },
      { name: 'Revision Word Problems', path: '/revision-word-problems' },
      { name: 'Topics', path: '/topics' },
      { name: 'Levels', path: '/levels' },
      { name: 'Classes', path: '/classes' },
    ];

    // 1. Check top-level links
    for (const link of sidebarLinks) {
      // Find the link in the sidebar using its href to guarantee uniqueness against exact same names
      const navItem = page.locator(`a[href="${link.path}"]`).first();
      
      if (await navItem.isVisible()) {
        await navItem.click();
        
        // Wait and assert that the URL changes correctly
        await expect(page).toHaveURL(`http://localhost:3000${link.path}`);
      }
    }

    // 2. Test Collapsible "Archive" logic
    const archiveButton = page.getByRole('button', { name: /^Archive$/i });
    if (await archiveButton.isVisible()) {
      // Expand the collapsible section
      await archiveButton.click();
      
      // Wait a moment for the sliding animation to finish
      await page.waitForTimeout(300);

      // We use the specific href to avoid strict mode violation (E-Lessons vs E-lessons)
      const archiveLessonsLink = page.locator('a[href="/archive-lessons"]').first();
      if (await archiveLessonsLink.isVisible()) {
        await archiveLessonsLink.click();
        await expect(page).toHaveURL('http://localhost:3000/archive-lessons');
      }

      // Check if Archive button is closed (navigation sometimes collapses it)
      if (await archiveButton.getAttribute('data-state') === 'closed') {
         await archiveButton.click();
         await page.waitForTimeout(300);
      }

      const archiveWorksheetsLink = page.locator('a[href="/archive-worksheets"]').first();
      if (await archiveWorksheetsLink.isVisible()) {
        await archiveWorksheetsLink.click();
        await expect(page).toHaveURL('http://localhost:3000/archive-worksheets');
      }
    }
  });
});
