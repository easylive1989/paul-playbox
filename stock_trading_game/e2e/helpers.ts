import { Page, expect } from '@playwright/test';

/**
 * Wait for Phaser game to be fully booted and a scene to be active.
 */
export async function waitForGame(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const game = (window as any).__GAME__;
      return game && game.isBooted && game.scene && game.scene.scenes.length > 0;
    },
    { timeout: 10000 },
  );
  // Give Phaser one extra frame to render
  await page.waitForTimeout(500);
}

/**
 * Get the key of the currently active scene.
 */
export async function getActiveSceneKey(page: Page): Promise<string> {
  return page.evaluate(() => {
    const game = (window as any).__GAME__;
    const scenes = game.scene.scenes as any[];
    for (const s of scenes) {
      if (s.scene.isActive()) return s.scene.key;
    }
    return '';
  });
}

/**
 * Wait for a specific scene to become active.
 */
export async function waitForScene(page: Page, key: string, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    (sceneKey: string) => {
      const game = (window as any).__GAME__;
      if (!game || !game.scene) return false;
      const s = game.scene.getScene(sceneKey);
      return s && s.scene.isActive();
    },
    key,
    { timeout },
  );
  await page.waitForTimeout(300);
}

/**
 * Get all Phaser Text objects' content from the active scene.
 */
export async function getSceneTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = (window as any).__GAME__;
    const scenes = game.scene.scenes as any[];
    for (const s of scenes) {
      if (s.scene.isActive()) {
        const texts: string[] = [];
        s.children.list.forEach((child: any) => {
          if (child.type === 'Text' && child.text) {
            texts.push(child.text);
          }
          // Also check containers
          if (child.type === 'Container' && child.list) {
            child.list.forEach((c: any) => {
              if (c.type === 'Text' && c.text) texts.push(c.text);
            });
          }
        });
        return texts;
      }
    }
    return [];
  });
}

/**
 * Get GameScene's test state.
 */
export async function getGameState(page: Page): Promise<any> {
  return page.evaluate(() => {
    const game = (window as any).__GAME__;
    const scene = game.scene.getScene('GameScene');
    return scene?.__testState ?? null;
  });
}

/**
 * Click at a position on the Phaser canvas.
 * Phaser game is 800x600 and uses Scale.FIT, so we need to map
 * game coordinates to actual canvas element coordinates.
 */
export async function clickGame(page: Page, gameX: number, gameY: number): Promise<void> {
  const coords = await page.evaluate(
    ({ gx, gy }: { gx: number; gy: number }) => {
      const game = (window as any).__GAME__;
      const canvas = game.canvas as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      // Game dimensions
      const gameW = 800;
      const gameH = 600;

      // Scale factor
      const scaleX = rect.width / gameW;
      const scaleY = rect.height / gameH;

      return {
        x: rect.left + gx * scaleX,
        y: rect.top + gy * scaleY,
      };
    },
    { gx: gameX, gy: gameY },
  );

  await page.mouse.click(coords.x, coords.y);
  await page.waitForTimeout(200);
}

/**
 * Clear localStorage and reload to start fresh.
 */
export async function resetAndReload(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForGame(page);
}

/**
 * Verify canvas is present on the page.
 */
export async function expectCanvasExists(page: Page): Promise<void> {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
}
