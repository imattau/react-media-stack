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

  test('should toggle Developer Performance HUD visibility', async ({ page }) => {
    // Dev HUD is ON by default in our demo sandbox settings
    const hud = page.locator('text=FPS:').first();
    await expect(hud).toBeVisible();

    // Toggle HUD OFF
    const devHudOffBtn = page.locator('text=Developer Performance HUD >> xpath=following-sibling::div >> text=OFF');
    await devHudOffBtn.click();

    // Verify HUD is hidden
    await expect(hud).not.toBeVisible();
  });

  test('should support slot components overrides (custom buttons)', async ({ page }) => {
    // Custom button slot is OFF by default. Let's toggle it ON
    const slotsOnBtn = page.locator('text=Slots Custom Buttons (Overlay) >> xpath=following-sibling::div >> text=ON');
    await slotsOnBtn.click();

    // Verify custom 💖 emoji slot button exists in the DOM
    const heartBtn = page.locator('text=💖').first();
    await expect(heartBtn).toBeVisible();

    // Verify default 'Like' SVG icon doesn't render inside standard button anymore
    const defaultLikeSvg = page.locator('button[aria-label="Like"] svg').first();
    await expect(defaultLikeSvg).not.toBeVisible();
  });
});
