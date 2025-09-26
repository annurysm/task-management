import { test, expect } from '@playwright/test';

test.describe('Profile Image Tests', () => {
  test('should display profile image after Google sign-in', async ({ page }) => {
    // Listen for console messages first
    page.on('console', msg => {
      console.log('Console:', msg.type(), msg.text());
    });
    
    // Navigate to the app
    await page.goto('http://localhost:3002');
    
    // Take screenshot of initial page
    await page.screenshot({ path: 'initial-page.png', fullPage: true });
    
    // Check if we're on the sign-in page - use button selector specifically
    const signInButton = page.getByRole('button', { name: 'Sign in with Google' });
    await expect(signInButton).toBeVisible();
    
    // Click sign in button
    await signInButton.click();
    
    // Wait for redirect
    await page.waitForTimeout(3000);
    
    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'after-signin-click.png', fullPage: true });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Look for profile image elements
    const profileImages = await page.locator('img').all();
    console.log('Total images found:', profileImages.length);
    
    for (let i = 0; i < profileImages.length; i++) {
      const src = await profileImages[i].getAttribute('src');
      const alt = await profileImages[i].getAttribute('alt');
      console.log(`Image ${i}: src="${src}", alt="${alt}"`);
    }
  });

  test('should check database for user image data', async ({ page }) => {
    // Navigate to Prisma Studio
    await page.goto('http://localhost:5555');
    
    // Wait for Prisma Studio to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of Prisma Studio
    await page.screenshot({ path: 'prisma-studio.png', fullPage: true });
    
    // Check if users table exists and has data
    const usersTable = page.locator('text=users');
    if (await usersTable.isVisible()) {
      await usersTable.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'users-table.png', fullPage: true });
    }
  });
});