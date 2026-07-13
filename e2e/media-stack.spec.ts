import { test, expect } from '@playwright/test';

test.describe('MediaStack E2E Showcase', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the demo app
    await page.goto('/');
  });

  test('should load the page and show main elements', async ({ page }) => {
    // Verify logo/title
    await expect(page.locator('.demo-logo h1')).toHaveText('MediaStack');
    
    // Verify simulated device contains the media list
    const viewport = page.locator('.media-stack-viewport');
    await expect(viewport).toBeVisible();
  });

  test('should log interaction events in the feed dashboard', async ({ page }) => {
    // Locate the first item's Like button inside the simulated viewport and click it
    const likeBtn = page.getByRole('button', { name: 'Like' }).first();
    await likeBtn.click();

    // Verify event logs container now includes the action message
    const logStream = page.locator('.log-stream');
    await expect(logStream).toContainText('Liked item:');
  });

  test('should toggle controls and update scroll classes', async ({ page }) => {
    const viewport = page.locator('.media-stack-viewport');
    
    // Initial scroll direction is vertical
    await expect(viewport).toHaveClass(/vertical/);

    // Toggle horizontal scroll in dashboard settings
    const horizBtn = page.locator('text=Horizontal');
    await horizBtn.click();

    // Verify viewport class switched to horizontal
    await expect(viewport).toHaveClass(/horizontal/);
  });
});
