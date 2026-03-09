import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3099';

async function injectTracking(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const game = (window as any).__PHASER_GAME;
    if (!game) return false;

    const scene = game.scene.scenes[0];
    if (!scene?.bottleBody) return false;

    (window as any).__bottleTrack = [];
    scene.events.on('update', () => {
      const body = scene.bottleBody;
      const container = scene.bottle;
      if (!body) return;
      (window as any).__bottleTrack.push({
        bodyX: body.position.x,
        bodyY: body.position.y,
        containerX: container.x,
        containerY: container.y,
        isFlipping: scene.isFlipping,
        isStatic: body.isStatic,
      });
    });
    return true;
  });
}

test.describe('Water Bottle Flip', () => {
  test('bottle should fly through the air after throwing, not disappear', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const injected = await injectTracking(page);
    expect(injected).toBe(true);

    // Throw the bottle via spacebar
    await canvas.click({ position: { x: 10, y: 10 }, force: true });
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    const trackData: any[] = await page.evaluate(() => (window as any).__bottleTrack || []);
    const flippingFrames = trackData.filter((d) => d.isFlipping);

    // The bottle should be in flipping state
    expect(flippingFrames.length).toBeGreaterThan(0);

    // The bottle body positions must NOT be NaN (the original bug)
    for (let i = 0; i < Math.min(10, flippingFrames.length); i++) {
      const f = flippingFrames[i];
      expect(Number.isNaN(f.bodyX)).toBe(false);
      expect(Number.isNaN(f.bodyY)).toBe(false);
    }

    // The bottle should remain within visible bounds for the first 15 frames
    const earlyFrames = flippingFrames.slice(0, 15);
    for (const frame of earlyFrames) {
      expect(frame.bodyX).toBeGreaterThan(-100);
      expect(frame.bodyX).toBeLessThan(580);
      expect(frame.bodyY).toBeGreaterThan(-300);
      expect(frame.bodyY).toBeLessThan(800);
    }

    // The bottle should be moving (not stuck at the same position)
    const first = flippingFrames[0];
    const tenth = flippingFrames[Math.min(9, flippingFrames.length - 1)];
    const dx = Math.abs(tenth.bodyX - first.bodyX);
    const dy = Math.abs(tenth.bodyY - first.bodyY);
    expect(dx + dy).toBeGreaterThan(10);
  });

  test('bottle can be reset and thrown again', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const injected = await injectTracking(page);
    expect(injected).toBe(true);

    // First throw
    await canvas.click({ position: { x: 10, y: 10 }, force: true });
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    // Reset
    await page.keyboard.press('r');
    await page.waitForTimeout(500);

    // Clear tracking data
    await page.evaluate(() => { (window as any).__bottleTrack = []; });

    // Second throw
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    const trackData: any[] = await page.evaluate(() => (window as any).__bottleTrack || []);
    const flippingFrames = trackData.filter((d) => d.isFlipping);

    // Second throw should also work - no NaN
    expect(flippingFrames.length).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(10, flippingFrames.length); i++) {
      const f = flippingFrames[i];
      expect(Number.isNaN(f.bodyX)).toBe(false);
      expect(Number.isNaN(f.bodyY)).toBe(false);
    }

    // The bottle should be moving
    const first = flippingFrames[0];
    const tenth = flippingFrames[Math.min(9, flippingFrames.length - 1)];
    const dx = Math.abs(tenth.bodyX - first.bodyX);
    const dy = Math.abs(tenth.bodyY - first.bodyY);
    expect(dx + dy).toBeGreaterThan(10);
  });
});
