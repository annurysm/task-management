import { test, expect } from '@playwright/test';

test.describe('Check Logged In State', () => {
  test('should check current logged-in user profile image', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3002');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'current-state.png', fullPage: true });
    
    // Check if we're redirected to dashboard (meaning we're logged in)
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('User is logged in, checking profile image...');
      
      // Look for all images on the page
      const images = await page.locator('img').all();
      console.log('Total images found:', images.length);
      
      for (let i = 0; i < images.length; i++) {
        const src = await images[i].getAttribute('src');
        const alt = await images[i].getAttribute('alt');
        const className = await images[i].getAttribute('class');
        console.log(`Image ${i}: src="${src}", alt="${alt}", class="${className}"`);
        
        // Check if this looks like a profile image
        if (src && (src.includes('googleusercontent.com') || src.includes('default-avatar') || alt?.includes('profile') || className?.includes('rounded-full'))) {
          console.log(`*** PROFILE IMAGE FOUND: ${src}`);
          
          // Check if image loads successfully
          const response = await page.goto(src || '');
          if (response) {
            console.log(`Image load status: ${response.status()}`);
          }
        }
      }
      
      // Specifically look for profile images in header
      const headerImages = await page.locator('header img, .header img, [class*="header"] img').all();
      console.log('Header images found:', headerImages.length);
      
      for (let i = 0; i < headerImages.length; i++) {
        const src = await headerImages[i].getAttribute('src');
        console.log(`Header image ${i}: ${src}`);
      }
    } else {
      console.log('User is not logged in, on sign-in page');
    }
  });

  test('should check user data in database', async ({ page }) => {
    // Navigate to Prisma Studio
    await page.goto('http://localhost:5555');
    
    // Wait for Prisma Studio to load
    await page.waitForTimeout(3000);
    
    // Click on User model
    await page.click('text=User');
    await page.waitForTimeout(2000);
    
    // Take screenshot of users table
    await page.screenshot({ path: 'users-data.png', fullPage: true });
    
    // Try to extract user data
    const userRows = await page.locator('[data-testid="data-table-row"]').count();
    console.log('User rows found:', userRows);
    
    if (userRows > 0) {
      // Get the first user's data
      const firstRow = page.locator('[data-testid="data-table-row"]').first();
      
      // Try to get image field value
      const imageCell = firstRow.locator('td').nth(3); // image is usually 4th column (0-indexed)
      const imageValue = await imageCell.textContent();
      console.log('Image field value:', imageValue);
    }
  });
});