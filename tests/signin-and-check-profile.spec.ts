import { test, expect } from '@playwright/test';

test.describe('Sign In and Check Profile Image', () => {
  test('should sign in and check profile image display', async ({ page }) => {
    // Listen for console messages and network requests
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });

    page.on('request', request => {
      if (request.url().includes('googleusercontent.com') || request.url().includes('.jpg') || request.url().includes('.png')) {
        console.log('IMAGE REQUEST:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('googleusercontent.com') || response.url().includes('.jpg') || response.url().includes('.png')) {
        console.log('IMAGE RESPONSE:', response.status(), response.url());
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:3002');
    
    // Verify we're on the sign-in page
    const signInButton = page.getByRole('button', { name: 'Sign in with Google' });
    await expect(signInButton).toBeVisible();
    
    console.log('Found sign-in page, clicking sign-in button...');
    
    // Click sign in button
    await signInButton.click();
    
    // Wait for authentication redirect and completion
    await page.waitForTimeout(5000);
    
    // Take screenshot after sign-in attempt
    await page.screenshot({ path: 'after-signin.png', fullPage: true });
    
    // Check if we're now authenticated by looking for profile elements
    const profileImages = page.locator('img[class*="rounded-full"]');
    const profileSections = page.locator('[class*="rounded-full"]');
    
    console.log('Profile sections found:', await profileSections.count());
    console.log('Profile images found:', await profileImages.count());
    
    // If we find profile images, analyze them
    const imageCount = await profileImages.count();
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = profileImages.nth(i);
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');
        
        console.log(`Profile Image ${i}:`, {
          src,
          alt,
          isVisible: await img.isVisible()
        });
        
        // Check if image is loaded properly
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
        const complete = await img.evaluate((el: HTMLImageElement) => el.complete);
        
        console.log(`Image ${i} load status:`, {
          naturalWidth,
          naturalHeight,
          complete,
          actuallyLoaded: naturalWidth > 0 && naturalHeight > 0
        });
        
        // If we have a Google image URL, test it directly
        if (src && src.includes('googleusercontent.com')) {
          console.log(`Testing Google image URL directly: ${src}`);
          
          try {
            const imageResponse = await page.goto(src);
            console.log('Direct Google image test:', {
              status: imageResponse?.status(),
              contentType: imageResponse?.headers()['content-type'],
              url: src
            });
            await page.screenshot({ path: `direct-google-image-test.png` });
          } catch (error) {
            console.log('Error loading Google image directly:', error);
          }
          
          // Go back to the main page
          await page.goto('http://localhost:3002');
          await page.waitForTimeout(2000);
        }
      }
    } else {
      console.log('No profile images found - checking if we need to wait longer for authentication...');
      
      // Wait a bit longer and check again
      await page.waitForTimeout(3000);
      const newImageCount = await profileImages.count();
      console.log('Profile images after waiting longer:', newImageCount);
      
      if (newImageCount === 0) {
        console.log('Still no profile images - checking current URL and page state...');
        console.log('Current URL:', page.url());
        
        // Check if we're still on sign-in page or somewhere else
        const stillHasSignInButton = await page.getByRole('button', { name: 'Sign in with Google' }).isVisible().catch(() => false);
        console.log('Still showing sign-in button:', stillHasSignInButton);
      }
    }
    
    // Final screenshot of the current state
    await page.screenshot({ path: 'final-state.png', fullPage: true });
  });
});