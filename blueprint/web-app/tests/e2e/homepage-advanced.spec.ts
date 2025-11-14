import { test } from '@playwright/test';
import { HomePage } from './pages/HomePage';

test.describe('HomePage E2E Tests with Page Object Model', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForPageLoad();
  });
});
