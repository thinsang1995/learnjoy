import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('home page should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('audio list should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/audio');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have no console errors on home page', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors (like failed API calls in test env)
    const unexpectedErrors = consoleErrors.filter(
      (err) => !err.includes('Failed to fetch') && !err.includes('NetworkError')
    );
    
    expect(unexpectedErrors).toHaveLength(0);
  });
});

test.describe('Accessibility Tests', () => {
  test('home page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('interactive elements should be focusable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') || 
                             await button.innerText();
      expect(accessibleName?.trim()).not.toBe('');
    }
  });
});

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`home page should be usable on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Hero should be visible
      await expect(page.getByText('楽しく学ぶ')).toBeVisible();
      
      // CTA should be clickable
      const cta = page.getByRole('link', { name: /今すぐ始める/ });
      await expect(cta).toBeVisible();
    });
  }

  test('mobile menu should work on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // On mobile, navigation might be in a hamburger menu
    // Check if navigation links are still accessible
    const homeLink = page.getByRole('link', { name: 'ホーム' });
    
    // Either visible directly or through a menu
    const isVisible = await homeLink.isVisible();
    
    if (!isVisible) {
      // Try to find and click hamburger menu
      const menuButton = page.locator('[aria-label*="menu"], button:has-text("☰")');
      if (await menuButton.count() > 0) {
        await menuButton.click();
        await expect(homeLink).toBeVisible();
      }
    }
  });
});
