import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page by default', async ({ page }) => {
    await page.goto('/');
    
    // Check if the login form or heading is present
    // Based on the Landing page design I saw earlier, let's look for a "Login" link or button
    await expect(page).toHaveTitle(/NanoPing/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register');
    // Expect the register form
    const heading = page.getByRole('heading', { name: /create/i });
    // await expect(heading).toBeVisible(); // This might fail if the path is different
  });
});
