import { test, expect } from '@playwright/test';

// Configuration
test.use({
  viewport: { width: 1280, height: 720 },
});

// Avoid login logic, since it seems standard across existing test specs
const TEST_USER = 'admin';
const TEST_PASS = '@dm1N123';

const MOCK_TEMPLATES = [
  {
    id: 1,
    title: "Math Basics E-Lesson",
    title_label: "Math Basics E-Lesson (P1 Term 1)",
    year: "2024",
    level: 1,
    term: "Term 1",
    topical: 0,
    topical_label: "No",
    active_revision: 0,
    active_revision_label: "No",
    published: true,
    level_primary: { id: 1, name: "P1", code: "P1", password: "" },
  }
];

const MOCK_LESSON_DETAILS = {
  id: 1,
  title: "Math Basics E-Lesson",
  topical_label: "No",
  active_revision_label: "No",
  main_lesson: [
    {
      id: 101,
      title: "Addition Basics",
      tags: "Core",
      main_instruction: "Follow these steps to learn addition.",
      conclusion: "Great job completing addition basics!",
      enable_passcode: 1, // Requires Passcode
      worksheet_id: 50,
      materials: [
        {
          id: 201,
          type: "videos",
          name: "addition_video.mp4",
          link_title: "Watch Intro Video",
          select: 1,
          sequence: 1,
          instruction: "Watch this video carefully.",
          uid: "v1",
        },
        {
          id: 202,
          type: "pdf",
          name: "addition_worksheet.pdf",
          link_title: "View Worksheet",
          select: 1,
          sequence: 2,
          instruction: "Read the worksheet.",
          uid: "v2",
        }
      ],
      homework: [],
    }
  ],
  review_lesson: [
    {
      id: 102,
      title: "Number Bonds Review",
      tags: "Enriched",
      main_instruction: "Reviewing number bonds.",
      conclusion: "",
      enable_passcode: 0, // Unlocked
      worksheet_id: 50,
      materials: [],
      homework: []
    }
  ],
  homework: [
    {
      id: 301,
      worksheet: { pdf: { name: "Weekend_Homework.pdf" } }
    }
  ]
};

test.describe('E-Lesson Dashboard / Resources Page', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Mock Templates List
    await page.route('**/api/e-lesson/template?limit=999*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { data: MOCK_TEMPLATES }
      });
    });

    // 2. Mock Lesson Details
    await page.route('**/api/e-lesson/template/1*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { data: MOCK_LESSON_DETAILS }
      });
    });

    // 3. Mock Passcode API
    await page.route('**/api/e-lesson/template/passcode*', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      if (postData.passcode === '1234') {
        await route.fulfill({
          status: 200,
          json: { status: true, message: "Success" }
        });
      } else {
        await route.fulfill({
          status: 200,
          json: { status: false, message: "Wrong Passcode" }
        });
      }
    });

    // 4. Mock AWS Resource HEAD requests
    await page.route('**/worksheets/50/videos/addition_video.mp4', async (route) => {
      await route.fulfill({ status: 200, contentType: 'video/mp4', body: 'mock-video' });
    });

    // Perform Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASS);
    await page.click('button:has-text("Start Learning")');
    await page.waitForURL(/localhost:3000\/?$/, { timeout: 30000 });
  });

  test('should display welcome information initially', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByRole('heading', { name: "E-Lesson Dashboard" })).toBeVisible();
    await expect(page.getByRole('heading', { name: "RESOURCES" })).toBeVisible();
    await expect(page.getByRole('heading', { name: "MM LIVE" })).toBeVisible();
    
    // Ensure combobox prompt is correct
    await expect(page.getByRole('combobox')).toContainText('Search for E-Lesson...');
  });

  test('should select a template and display lesson content', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Open Combobox
    await page.getByRole('combobox').click();
    
    // Validate combobox list is populated correctly
    const option = page.getByText('Math Basics E-Lesson (P1 Term 1)');
    await expect(option).toBeVisible();
    await option.click();

    // Verify Main Headers and Tabs are loaded
    await expect(page.getByText('Math Basics E-Lesson').first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Main Lesson' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Review' })).toBeVisible();

    // Verify Review tab content (unlocked by default here, but hidden under accordion)
    await page.getByRole('tab', { name: 'Review' }).click();
    await expect(page.getByRole('button', { name: /Number Bonds Review/i })).toBeVisible();
    
    // Expand the review accordion
    await page.getByRole('button', { name: /Number Bonds Review/i }).click();
    await expect(page.getByText('Reviewing number bonds.')).toBeVisible();

    // Verify Homework list exists under "Main Lesson" (so switch tab first)
    await page.getByRole('tab', { name: 'Main Lesson' }).click();
    await expect(page.getByRole('heading', { name: 'Homework List:' })).toBeVisible();
    await expect(page.getByText('Weekend_Homework')).toBeVisible();
  });

  test('should prompt for passcode to unlock protected lessons and open file preview', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Select Template
    await page.getByRole('combobox').click();
    await page.getByText('Math Basics E-Lesson (P1 Term 1)').click();

    // Make sure we are on Main Lesson tab
    await page.getByRole('tab', { name: 'Main Lesson' }).click();

    // Try expanding the locked lesson
    const lockedLessonTrigger = page.getByRole('button', { name: /Addition Basics/i });
    await expect(lockedLessonTrigger).toBeVisible();
    await lockedLessonTrigger.click();

    // Passcode modal should appear
    const passcodeDialogHeading = page.getByRole('heading', { name: /Enter Passcode/i });
    await expect(passcodeDialogHeading).toBeVisible();
    
    // Enter wrong passcode and verify error
    await page.getByPlaceholder('Enter Passcode').fill('0000');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Wrong Passcode')).toBeVisible();

    // Enter correct passcode
    await page.getByPlaceholder('Enter Passcode').fill('');
    await page.getByPlaceholder('Enter Passcode').fill('1234');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Lesson unlocked successfully')).toBeVisible();
    await expect(passcodeDialogHeading).not.toBeVisible();

    // The accordion should now contain the instructions/resources since it auto-opens
    await expect(page.getByText('Follow these steps to learn addition.')).toBeVisible();
    await expect(page.getByText('Watch this video carefully.')).toBeVisible();

    // Test Material Clicking (Preview Dialog)
    await page.getByRole('button', { name: /Watch Intro Video/i }).click();
    
    // Validate FilePreviewDialog renders
    // The dialog title takes the `link_title` ("Watch Intro Video")
    const dialogTitle = page.getByRole('dialog').getByText('Watch Intro Video');
    await expect(dialogTitle).toBeVisible();

    // Verify video tag is rendered (meaning the HEAD check passed)
    await expect(page.locator('video')).toBeVisible();
  });
});
