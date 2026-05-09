# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: basic.spec.ts >> Basic Functionality >> should load the home page
- Location: tests/basic.spec.ts:4:3

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /AsOne Dealer/
Received string:  "One Dealer | India's Trusted Second-Hand Car & Bike Marketplace"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    8 × unexpected value "One Dealer | India's Trusted Second-Hand Car & Bike Marketplace"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - img [ref=e5]
  - heading "Access Blocked" [level=2] [ref=e7]
  - paragraph [ref=e8]: Automated behavior detected. For security purposes, this session has been terminated.
  - button "Retry Connection" [ref=e9]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Basic Functionality', () => {
  4  |   test('should load the home page', async ({ page }) => {
  5  |     await page.goto('/');
> 6  |     await expect(page).toHaveTitle(/AsOne Dealer/);
     |                        ^ Error: expect(page).toHaveTitle(expected) failed
  7  |     
  8  |     // Check if hero section is visible
  9  |     const heroTitle = page.locator('h1');
  10 |     await expect(heroTitle).toBeVisible();
  11 |   });
  12 | 
  13 |   test('should navigate to search page', async ({ page }) => {
  14 |     await page.goto('/');
  15 |     
  16 |     // Find search link/button
  17 |     const searchNav = page.getByRole('link', { name: /search/i }).first();
  18 |     if (await searchNav.isVisible()) {
  19 |       await searchNav.click();
  20 |       await expect(page).toHaveURL(/.*search/);
  21 |     } else {
  22 |       // Fallback: try direct navigation
  23 |       await page.goto('/search');
  24 |       await expect(page).toHaveURL(/.*search/);
  25 |     }
  26 |     
  27 |     // Check search page specific element
  28 |     await expect(page.getByPlaceholder(/search vehicles/i)).toBeVisible();
  29 |   });
  30 | 
  31 |   test('should display vehicle listings', async ({ page }) => {
  32 |     await page.goto('/search');
  33 |     
  34 |     // Wait for at least one vehicle card to appear
  35 |     const vehicleCard = page.locator('[id^="vehicle-card-"]').first();
  36 |     await expect(vehicleCard).toBeVisible({ timeout: 10000 });
  37 |   });
  38 | });
  39 | 
```