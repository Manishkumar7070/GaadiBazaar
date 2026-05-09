import { test, expect } from '@playwright/test';

test.describe('Basic Functionality', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/One Dealer/);
    
    // Check if hero section is visible
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/');
    
    // Find search link/button
    const searchNav = page.getByRole('link', { name: /search/i }).first();
    if (await searchNav.isVisible()) {
      await searchNav.click();
      await expect(page).toHaveURL(/.*search/);
    } else {
      // Fallback: try direct navigation
      await page.goto('/search');
      await expect(page).toHaveURL(/.*search/);
    }
    
    // Check search page specific element
    await expect(page.getByPlaceholder(/search vehicles/i)).toBeVisible();
  });

  test('should display vehicle listings', async ({ page }) => {
    await page.goto('/search');
    
    // Wait for at least one vehicle card to appear
    const vehicleCard = page.locator('[id^="vehicle-card-"]').first();
    await expect(vehicleCard).toBeVisible({ timeout: 10000 });
  });
});
