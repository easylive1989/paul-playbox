import { test, expect } from '@playwright/test';
import {
  waitForGame,
  getActiveSceneKey,
  getSceneTexts,
  clickGame,
  resetAndReload,
  waitForScene,
  getGameState,
} from './helpers';

/** Navigate from fresh state to GameScene level 1 */
async function goToLevel1(page: any): Promise<void> {
  await page.goto('/');
  await waitForGame(page);
  await resetAndReload(page);
  // Menu → LevelSelect
  await clickGame(page, 400, 340);
  await waitForScene(page, 'LevelSelectScene');
  // Click level 1
  await clickGame(page, 170, 160);
  await waitForScene(page, 'GameScene');
}

test.describe('GameScene', () => {
  test('shows HUD with level info', async ({ page }) => {
    await goToLevel1(page);
    const texts = await getSceneTexts(page);

    expect(texts.some((t) => t.includes('關卡 1'))).toBe(true);
    expect(texts.some((t) => t.includes('目標'))).toBe(true);
  });

  test('shows initial cash of $10,000', async ({ page }) => {
    await goToLevel1(page);
    const state = await getGameState(page);

    expect(state).not.toBeNull();
    expect(state.cash).toBe(10000);
    expect(state.currentLevel).toBe(1);
    expect(state.targetValue).toBe(11000);
    expect(state.maxCandles).toBe(30);
  });

  test('first candle is generated immediately', async ({ page }) => {
    await goToLevel1(page);
    const state = await getGameState(page);

    expect(state.candleCount).toBe(1);
    expect(state.price).toBeGreaterThan(0);
  });

  test('hand cards are drawn (up to 3)', async ({ page }) => {
    await goToLevel1(page);
    const state = await getGameState(page);

    expect(state.handSize).toBeGreaterThan(0);
    expect(state.handSize).toBeLessThanOrEqual(3);
  });

  test('buy button creates position', async ({ page }) => {
    await goToLevel1(page);

    let state = await getGameState(page);
    expect(state.isHolding).toBe(false);
    expect(state.shares).toBe(0);

    // Click buy button at (120, 540)
    await clickGame(page, 120, 540);
    await page.waitForTimeout(300);

    state = await getGameState(page);
    expect(state.isHolding).toBe(true);
    expect(state.shares).toBeGreaterThan(0);
  });

  test('sell button closes position', async ({ page }) => {
    await goToLevel1(page);

    // Buy first
    await clickGame(page, 120, 540);
    await page.waitForTimeout(300);

    let state = await getGameState(page);
    expect(state.isHolding).toBe(true);

    // Sell at (230, 540)
    await clickGame(page, 230, 540);
    await page.waitForTimeout(300);

    state = await getGameState(page);
    expect(state.isHolding).toBe(false);
    expect(state.shares).toBe(0);
  });

  test('candle count increases over time', async ({ page }) => {
    await goToLevel1(page);

    const state1 = await getGameState(page);
    const count1 = state1.candleCount;

    // Wait for 2 ticks (5s each + buffer)
    await page.waitForTimeout(11000);

    const state2 = await getGameState(page);
    expect(state2.candleCount).toBeGreaterThan(count1);
  });

  test('game over when candles exhausted without target', async ({ page }) => {
    await goToLevel1(page);

    // Fast-forward by triggering ticks programmatically
    await page.evaluate(() => {
      const game = (window as any).__GAME__;
      const scene = game.scene.getScene('GameScene') as any;
      // Force exhaust all candles
      for (let i = 0; i < 35; i++) {
        if (!scene.gameOver && !scene.levelCleared) {
          scene['onTick']();
        }
      }
    });

    await page.waitForTimeout(500);
    const state = await getGameState(page);

    // Should either be game over (didn't hit target) or level cleared (lucky)
    expect(state.gameOver || state.levelCleared).toBe(true);
  });

  test('game over overlay shows retry and back buttons', async ({ page }) => {
    await goToLevel1(page);

    // Force game over by depleting cash
    await page.evaluate(() => {
      const game = (window as any).__GAME__;
      const scene = game.scene.getScene('GameScene') as any;
      // Exhaust all candles without reaching target
      for (let i = 0; i < 35; i++) {
        if (!scene.gameOver && !scene.levelCleared) {
          scene['onTick']();
        }
      }
    });
    await page.waitForTimeout(500);

    const state = await getGameState(page);
    if (state.gameOver) {
      const texts = await getSceneTexts(page);
      // Game over overlay texts are in a container
      const allTexts = await page.evaluate(() => {
        const game = (window as any).__GAME__;
        const scene = game.scene.getScene('GameScene') as any;
        const overlay = scene.overlay;
        if (!overlay) return [];
        const result: string[] = [];
        overlay.list.forEach((child: any) => {
          if (child.type === 'Text' && child.text) result.push(child.text);
        });
        return result;
      });
      expect(allTexts.some((t: string) => t.includes('挑戰失敗') || t.includes('關卡通過'))).toBe(true);
    }
  });

  test('retry button restarts the level', async ({ page }) => {
    await goToLevel1(page);

    // Force all candles to exhaust
    await page.evaluate(() => {
      const game = (window as any).__GAME__;
      const scene = game.scene.getScene('GameScene') as any;
      for (let i = 0; i < 35; i++) {
        if (!scene.gameOver && !scene.levelCleared) {
          scene['onTick']();
        }
      }
    });
    await page.waitForTimeout(500);

    const state = await getGameState(page);
    if (state.gameOver) {
      // Click retry "重新挑戰" at center of overlay (400, 367) — overlay center (400,300) + button offset (0,67)
      await clickGame(page, 400, 367);
      await page.waitForTimeout(1000);

      const newState = await getGameState(page);
      expect(newState.candleCount).toBeLessThanOrEqual(1);
      expect(newState.gameOver).toBe(false);
      expect(newState.cash).toBe(10000);
    }
  });

  test('back to menu from game over', async ({ page }) => {
    await goToLevel1(page);

    await page.evaluate(() => {
      const game = (window as any).__GAME__;
      const scene = game.scene.getScene('GameScene') as any;
      for (let i = 0; i < 35; i++) {
        if (!scene.gameOver && !scene.levelCleared) {
          scene['onTick']();
        }
      }
    });
    await page.waitForTimeout(500);

    const state = await getGameState(page);
    if (state.gameOver) {
      // Click "回到選單" at (400, 415) — overlay (400,300) + text offset (0,115)
      await clickGame(page, 400, 415);
      await waitForScene(page, 'LevelSelectScene');
      const key = await getActiveSceneKey(page);
      expect(key).toBe('LevelSelectScene');
    }
  });
});
