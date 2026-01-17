import { test, expect } from '@playwright/test';

test.describe('Audio List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audio');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /レッスン一覧/ })).toBeVisible();
  });

  test('should display topic filters', async ({ page }) => {
    await expect(page.getByRole('button', { name: '全て' })).toBeVisible();
    await expect(page.getByRole('button', { name: '日常会話' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ビジネス' })).toBeVisible();
    await expect(page.getByRole('button', { name: '旅行' })).toBeVisible();
    await expect(page.getByRole('button', { name: '文化' })).toBeVisible();
  });

  test('should filter by topic when clicking filter button', async ({ page }) => {
    // Click on daily topic filter
    await page.getByRole('button', { name: '日常会話' }).click();
    
    // URL should include topic parameter
    await expect(page).toHaveURL(/topic=daily/);
  });

  test('should display audio cards or empty state', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Should show either audio cards or empty state message
    const hasAudioCards = await page.locator('.clay-card-peach, .clay-card-blue, .clay-card-mint, .clay-card-lilac').count() > 0;
    const hasEmptyState = await page.getByText(/まだレッスンがありません|No lessons/).count() > 0;
    
    expect(hasAudioCards || hasEmptyState).toBeTruthy();
  });

  test('should navigate to audio detail when clicking card', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    const audioCard = page.locator('a[href^="/audio/"]').first();
    
    if (await audioCard.count() > 0) {
      await audioCard.click();
      await expect(page).toHaveURL(/\/audio\/[a-zA-Z0-9-]+/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.getByRole('heading', { name: /レッスン一覧/ })).toBeVisible();
  });
});
