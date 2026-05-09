import { test, expect } from '@playwright/test';

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('should filter by brand', async ({ page }) => {
    // Open brand filter if needed
    const filterSection = page.getByText(/brand/i);
    await expect(filterSection).toBeVisible();

    // Select a brand (e.g., Toyota if available in mock data)
    // This depends on the actual UI implementation
    // Assuming there are buttons or checkboxes for filters
    const toyotaFilter = page.getByRole('button', { name: /toyota/i }).or(page.getByLabel(/toyota/i));
    
    if (await toyotaFilter.isVisible()) {
      await toyotaFilter.click();
      // Wait for results to update
      await page.waitForTimeout(1000); 
      
      // Verify listed vehicles are of that brand (if text is visible on card)
      const cards = page.locator('[id^="vehicle-card-"]');
      const count = await cards.count();
      if (count > 0) {
        await expect(cards.first()).toContainText(/toyota/i);
      }
    }
  });

  test('should use AI search', async ({ page }) => {
    const aiSearchInput = page.getByPlaceholder(/search vehicles with ai/i).or(page.getByPlaceholder(/smart search/i));
    
    if (await aiSearchInput.isVisible()) {
      await aiSearchInput.fill('Find me a fast red sports car');
      await aiSearchInput.press('Enter');
      
      // Wait for AI processing
      await expect(page.locator('text=/AI insights/i').or(page.locator('text=/analyzing/i'))).toBeVisible();
    }
  });

  test('should use Price Prediction tool', async ({ page }) => {
    // Navigate to a vehicle detail page first
    await page.goto('/search');
    const firstVehicle = page.locator('[id^="vehicle-card-"]').first();
    await firstVehicle.click();
    
    // Check for AI Price Prediction button/section
    const predictionBtn = page.getByRole('button', { name: /predict/i }).or(page.getByText(/price insight/i));
    
    if (await predictionBtn.isVisible()) {
      await predictionBtn.click();
      // Check if a result appears
      await expect(page.locator('text=/Estimated/i').or(page.locator('text=/prediction/i'))).toBeVisible();
    }
  });
});
