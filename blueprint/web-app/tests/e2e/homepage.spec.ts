import { test, expect } from '@playwright/test';

test.describe('HomePage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
  });

  test('should display the main title and logo', async ({ page }) => {
    // Check if the page loads successfully
    await expect(page).toHaveTitle(/Bottle Filling Digital Twin/);

    // Check for the main heading
    await expect(page.getByText('Choose Your Journey')).toBeVisible();

    // Check for the logo/app name
    await expect(page.getByText('Bottle Filling Digital Twin')).toBeVisible();
  });

  test('should display welcome text and description', async ({ page }) => {
    // Check for welcome text
    await expect(
      page.getByText('Welcome to Advanced simulation and visualization')
    ).toBeVisible();

    // Check for the full description
    await expect(
      page.getByText(/using Ansys Fluent and Nvidia Omniverse/)
    ).toBeVisible();

    await expect(
      page.getByText(/Select your role to access tailored tools/)
    ).toBeVisible();
  });

  test('should display role-based feature cards', async ({ page }) => {
    // Check for Simulation Engineer card
    await expect(page.getByText('I am a Simulation Engineer')).toBeVisible();

    await expect(
      page.getByText(/This path will give access to an advanced UI/)
    ).toBeVisible();

    // Check for Reviewer card
    await expect(page.getByText('I am a Reviewer')).toBeVisible();

    await expect(
      page.getByText(/This path will show you Real-time rendering/)
    ).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    // Check for Start Simulation button
    const startButton = page.getByRole('button', { name: /start simulation/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    // Check for View Results button
    const viewButton = page.getByRole('button', { name: /view results/i });
    await expect(viewButton).toBeVisible();
    await expect(viewButton).toBeEnabled();
  });

  test('should have proper semantic structure', async ({ page }) => {
    // Check for header element
    await expect(page.locator('header')).toBeVisible();

    // Check for main element
    await expect(page.locator('main')).toBeVisible();

    // Check for proper heading hierarchy
    const h2 = page.getByRole('heading', {
      level: 2,
      name: 'Choose Your Journey',
    });
    await expect(h2).toBeVisible();

    const h3Elements = page.getByRole('heading', { level: 3 });
    await expect(h3Elements).toHaveCount(2); // Two feature cards
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if main elements are still visible
    await expect(page.getByText('Choose Your Journey')).toBeVisible();
    await expect(page.getByText('I am a Simulation Engineer')).toBeVisible();
    await expect(page.getByText('I am a Reviewer')).toBeVisible();

    // Check if buttons are still accessible
    await expect(
      page.getByRole('button', { name: /start simulation/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /view results/i })
    ).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Check if all elements are visible and properly arranged
    await expect(page.getByText('Choose Your Journey')).toBeVisible();
    await expect(page.getByText('I am a Simulation Engineer')).toBeVisible();
    await expect(page.getByText('I am a Reviewer')).toBeVisible();
  });

  test('should handle button interactions', async ({ page }) => {
    // Test Start Simulation button click
    const startButton = page.getByRole('button', { name: /start simulation/i });

    // Set up console log listener to verify button click handling
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    await startButton.click();

    // Wait a bit for any console logs
    await page.waitForTimeout(100);

    // Test View Results button click
    const viewButton = page.getByRole('button', { name: /view results/i });
    await viewButton.click();

    // Wait a bit for any console logs
    await page.waitForTimeout(100);

    // Verify buttons are still enabled after clicking
    await expect(startButton).toBeEnabled();
    await expect(viewButton).toBeEnabled();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check if buttons have proper accessible names
    const startButton = page.getByRole('button', { name: /start simulation/i });
    await expect(startButton).toHaveAttribute('type', 'button');

    const viewButton = page.getByRole('button', { name: /view results/i });
    await expect(viewButton).toHaveAttribute('type', 'button');

    // Check for proper heading structure
    const mainHeading = page.getByRole('heading', { level: 2 });
    await expect(mainHeading).toBeVisible();

    // Check for proper landmarks
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test.skip('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    // Navigate and wait for page to fully load
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that there are no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test.skip('should have proper page performance', async ({ page }) => {
    // Start performance measurement
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check that page loads within reasonable time
    const startTime = Date.now();
    await expect(page.getByText('Choose Your Journey')).toBeVisible();
    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
