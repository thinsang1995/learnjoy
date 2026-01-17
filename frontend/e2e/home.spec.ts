import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check hero title
    await expect(page.getByText('楽しく学ぶ')).toBeVisible();
    await expect(page.getByText('日本語リスニング')).toBeVisible();
    
    // Check CTA button
    const ctaButton = page.getByRole('link', { name: /今すぐ始める/ });
    await expect(ctaButton).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');
    
    // Check feature cards
    await expect(page.getByText('日常会話')).toBeVisible();
    await expect(page.getByText('ビジネス')).toBeVisible();
    await expect(page.getByText('旅行')).toBeVisible();
  });

  test('should navigate to audio list from CTA', async ({ page }) => {
    await page.goto('/');
    
    // Click CTA button
    await page.getByRole('link', { name: /今すぐ始める/ }).click();
    
    // Should navigate to /audio
    await expect(page).toHaveURL('/audio');
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/LearnJoy/);
  });

  test('should display navbar', async ({ page }) => {
    await page.goto('/');
    
    // Check navbar elements
    await expect(page.getByText('LearnJoy').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'レッスン' })).toBeVisible();
  });
});
