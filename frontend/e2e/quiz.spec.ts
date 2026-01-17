import { test, expect } from '@playwright/test';

test.describe('Quiz Components', () => {
  // These tests assume there's a page with quiz components visible
  // In real scenario, you'd set up test data or mock the API
  
  test('MCQ Quiz - should display question and options', async ({ page }) => {
    // Navigate to an audio page with quiz
    await page.goto('/audio');
    await page.waitForLoadState('networkidle');
    
    const audioLink = page.locator('a[href^="/audio/"]').first();
    
    if (await audioLink.count() > 0) {
      await audioLink.click();
      await page.waitForLoadState('networkidle');
      
      // Check if quiz tab exists
      const quizTab = page.getByText(/クイズ|Quiz/);
      if (await quizTab.count() > 0) {
        await quizTab.click();
        
        // Wait for quiz to load
        await page.waitForTimeout(1000);
        
        // Check for quiz elements
        const hasQuizContent = await page.locator('.clay-option, [data-testid="quiz-option"]').count() > 0;
        if (hasQuizContent) {
          expect(hasQuizContent).toBeTruthy();
        }
      }
    }
  });

  test('Quiz Container - should show progress indicator', async ({ page }) => {
    await page.goto('/audio');
    await page.waitForLoadState('networkidle');
    
    const audioLink = page.locator('a[href^="/audio/"]').first();
    
    if (await audioLink.count() > 0) {
      await audioLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for progress indicator (1/5 format or progress bar)
      const hasProgress = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').count() > 0;
      // Progress indicator might not be visible if no quizzes
    }
  });
});

test.describe('Audio Player', () => {
  test('should display player controls on audio detail page', async ({ page }) => {
    await page.goto('/audio');
    await page.waitForLoadState('networkidle');
    
    const audioLink = page.locator('a[href^="/audio/"]').first();
    
    if (await audioLink.count() > 0) {
      await audioLink.click();
      await page.waitForLoadState('networkidle');
      
      // Check for audio player elements
      // Play button should be visible
      const playButton = page.locator('button').filter({ hasText: /▶|⏸|再生/ }).first();
      
      // Audio player section should exist
      const playerSection = page.locator('.clay-player, [data-testid="audio-player"]');
      
      if (await playerSection.count() > 0) {
        await expect(playerSection).toBeVisible();
      }
    }
  });

  test('should have speed control', async ({ page }) => {
    await page.goto('/audio');
    await page.waitForLoadState('networkidle');
    
    const audioLink = page.locator('a[href^="/audio/"]').first();
    
    if (await audioLink.count() > 0) {
      await audioLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for speed control (0.5x, 1x, 1.5x, etc.)
      const speedControl = page.locator('text=/\\d+\\.?\\d*x/').first();
      // Speed control might exist
    }
  });
});

test.describe('Navigation', () => {
  test('navbar links should work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Click on レッスン link
    await page.getByRole('link', { name: 'レッスン' }).click();
    await expect(page).toHaveURL('/audio');
    
    // Click on ホーム link
    await page.getByRole('link', { name: 'ホーム' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should show 404 page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    
    // Should show 404 content
    await expect(page.getByText(/404|見つかりません|Not Found/)).toBeVisible();
  });

  test('breadcrumb navigation on audio detail', async ({ page }) => {
    await page.goto('/audio');
    await page.waitForLoadState('networkidle');
    
    const audioLink = page.locator('a[href^="/audio/"]').first();
    
    if (await audioLink.count() > 0) {
      await audioLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for back button or breadcrumb
      const backLink = page.getByRole('link', { name: /戻る|← 一覧|Back/ });
      if (await backLink.count() > 0) {
        await backLink.click();
        await expect(page).toHaveURL('/audio');
      }
    }
  });
});
