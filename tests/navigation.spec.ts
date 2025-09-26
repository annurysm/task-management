import { test, expect } from '@playwright/test';

test.describe('Navigation & Authentication', () => {
  test('should handle authentication flow', async ({ page }) => {
    await page.goto('/');
    
    // Try to access protected route without auth
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await expect(page.url()).toContain('localhost:3002');
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });

  test('should show proper error handling', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should handle 404 gracefully (Next.js default or custom 404)
    // This test will depend on your 404 page implementation
    const statusResponse = page.waitForResponse(response => 
      response.url().includes('/nonexistent-page') && response.status() === 404
    );
    
    await page.goto('/nonexistent-page');
    await statusResponse;
  });
});