import { test, expect } from '@playwright/test';

test.describe('UI Components & Theming', () => {
  test('should load and display basic UI elements', async ({ page }) => {
    await page.goto('/');
    
    // Check if gradient background is applied
    const backgroundElement = page.locator('.bg-gradient-to-br');
    await expect(backgroundElement).toBeVisible();
    
    // Check if buttons have proper styling
    const signInButton = page.locator('text=Sign in with Google').first();
    await expect(signInButton).toBeVisible();
    
    // Verify responsive layout
    const container = page.locator('.max-w-md');
    await expect(container).toBeVisible();
  });

  test('should handle different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have accessible elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('Task Management');
    
    // Check button accessibility
    const button = page.locator('text=Sign in with Google').first();
    await expect(button).toBeVisible();
    
    // Verify proper contrast and readability
    const description = page.locator('text=Kanban board and task management tool for product design teams');
    await expect(description).toBeVisible();
  });
});