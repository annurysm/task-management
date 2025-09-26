import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Task Management');
    
    // Check for description
    await expect(page.locator('text=Kanban board and task management tool for product design teams')).toBeVisible();
    
    // Check for Sign In button (be more specific to avoid multiple matches)
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Task Management/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if elements are visible and properly laid out on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });
});