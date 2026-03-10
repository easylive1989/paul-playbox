import { test, expect } from '@playwright/test';
import {
  waitForGame,
  getActiveSceneKey,
  getSceneTexts,
  clickGame,
  resetAndReload,
  expectCanvasExists,
  waitForScene,
} from './helpers';

test.describe('MenuScene', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);
    // Ensure we're starting fresh
    await resetAndReload(page);
  });

  test('game loads and canvas renders', async ({ page }) => {
    await expectCanvasExists(page);
  });

  test('shows title text', async ({ page }) => {
    const texts = await getSceneTexts(page);
    const hasTitle = texts.some((t) => t.includes('STOCK CARD') || t.includes('TRADER'));
    expect(hasTitle).toBe(true);
  });

  test('shows start and reset buttons', async ({ page }) => {
    const texts = await getSceneTexts(page);
    expect(texts.some((t) => t.includes('開始遊戲'))).toBe(true);
    expect(texts.some((t) => t.includes('重置進度'))).toBe(true);
  });

  test('clicking start navigates to LevelSelectScene', async ({ page }) => {
    // "開始遊戲" button is at (400, 340) in game coordinates
    await clickGame(page, 400, 340);
    await waitForScene(page, 'LevelSelectScene');
    const sceneKey = await getActiveSceneKey(page);
    expect(sceneKey).toBe('LevelSelectScene');
  });

  test('clicking reset clears localStorage', async ({ page }) => {
    // First set some progress
    await page.evaluate(() => {
      localStorage.setItem(
        'stock_game_progress',
        JSON.stringify({ clearedLevel: 3, ownedCards: ['good_news'], currentDeck: ['good_news'] }),
      );
    });

    await page.reload();
    await waitForGame(page);

    // Click "重置進度" at (400, 420)
    await clickGame(page, 400, 420);
    await page.waitForTimeout(500);

    // Verify progress was reset (re-initialized with starter cards)
    const progress = await page.evaluate(() => {
      const raw = localStorage.getItem('stock_game_progress');
      return raw ? JSON.parse(raw) : null;
    });

    // After reset + initStarterCards, clearedLevel should be 0
    expect(progress.clearedLevel).toBe(0);
    // Should have starter deck (8 cards)
    expect(progress.currentDeck.length).toBe(8);
  });
});
