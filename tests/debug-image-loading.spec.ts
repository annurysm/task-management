import { test, expect } from '@playwright/test';

test.describe('Debug Image Loading', () => {
  test('should debug profile image loading issues', async ({ page }) => {
    // Track network requests
    const requests: any[] = [];
    const responses: any[] = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
      console.log('REQUEST:', request.method(), request.url());
    });

    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers()
      });
      console.log('RESPONSE:', response.status(), response.url());
    });

    // Listen for console messages
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });

    // Navigate to the app
    await page.goto('http://localhost:3002');
    
    // Wait for the page to load completely
    await page.waitForTimeout(5000);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'debug-current-state.png', fullPage: true });
    
    // Check if we're authenticated by looking for profile section
    const profileSection = page.locator('[class*="rounded-full"]');
    const profileImages = page.locator('img[class*="rounded-full"]');
    
    console.log('Profile sections found:', await profileSection.count());
    console.log('Profile images found:', await profileImages.count());
    
    // If we find profile images, check their attributes
    const imageCount = await profileImages.count();
    for (let i = 0; i < imageCount; i++) {
      const img = profileImages.nth(i);
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const className = await img.getAttribute('class');
      
      console.log(`Image ${i}:`, {
        src,
        alt,
        className,
        isVisible: await img.isVisible()
      });
      
      // Check if the image is actually loaded
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
      const complete = await img.evaluate((el: HTMLImageElement) => el.complete);
      
      console.log(`Image ${i} load status:`, {
        naturalWidth,
        naturalHeight,
        complete,
        loaded: naturalWidth > 0 && naturalHeight > 0
      });
    }
    
    // Check for any image-related network requests
    const imageRequests = requests.filter(req => 
      req.url.includes('googleusercontent.com') || 
      req.url.includes('.jpg') || 
      req.url.includes('.png') ||
      req.url.includes('.svg')
    );
    
    console.log('Image-related requests:', imageRequests);
    
    // Check for any failed image responses
    const imageResponses = responses.filter(res => 
      res.url.includes('googleusercontent.com') || 
      res.url.includes('.jpg') || 
      res.url.includes('.png') ||
      res.url.includes('.svg')
    );
    
    console.log('Image-related responses:', imageResponses);
    
    // Check the DOM structure around profile images
    const profileContainer = page.locator('div:has(img[class*="rounded-full"])');
    if (await profileContainer.count() > 0) {
      const html = await profileContainer.first().innerHTML();
      console.log('Profile container HTML:', html);
    }
    
    // Try to manually test the Google image URL if we find one
    const googleImageUrls = requests
      .map(req => req.url)
      .filter(url => url.includes('googleusercontent.com'));
      
    if (googleImageUrls.length > 0) {
      console.log('Found Google image URLs:', googleImageUrls);
      
      // Test direct access to the image
      for (const imageUrl of googleImageUrls) {
        try {
          const response = await page.goto(imageUrl);
          console.log(`Direct image access for ${imageUrl}:`, {
            status: response?.status(),
            contentType: response?.headers()['content-type']
          });
          await page.screenshot({ path: `direct-image-${Date.now()}.png` });
        } catch (error) {
          console.log(`Failed to load image directly: ${imageUrl}`, error);
        }
      }
    }
  });
});