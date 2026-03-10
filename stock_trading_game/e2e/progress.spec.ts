import { test, expect } from '@playwright/test';
import {
  waitForGame,
  getActiveSceneKey,
  getSceneTexts,
  clickGame,
  resetAndReload,
  waitForScene,
} from './helpers';

test.describe('Progress & Persistence', () => {
  test('starter cards are initialized on first load', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);
    // Clear everything
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForGame(page);

    const progress = await page.evaluate(() => {
      const raw = localStorage.getItem('stock_game_progress');
      return raw ? JSON.parse(raw) : null;
    });

    expect(progress).not.toBeNull();
    expect(progress.ownedCards.length).toBe(8);
    expect(progress.currentDeck.length).toBe(8);
    expect(progress.clearedLevel).toBe(0);
  });

  test('cleared level is persisted after beating level 1', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);
    await resetAndReload(page);

    // Simulate having cleared level 1 by writing to localStorage directly
    await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('stock_game_progress') || '{}');
      progress.clearedLevel = 1;
      localStorage.setItem('stock_game_progress', JSON.stringify(progress));
    });

    // Reload and go to level select
    await page.reload();
    await waitForGame(page);
    await clickGame(page, 400, 340);
    await waitForScene(page, 'LevelSelectScene');

    // Level 2 should show its target (not locked)
    const texts = await getSceneTexts(page);
    expect(texts.some((t) => t.includes('$13,000'))).toBe(true);

    // Level 2 card center: x=70+200+30+100=400, y=90+70=160
    // Should be clickable
    await clickGame(page, 400, 160);
    await waitForScene(page, 'GameScene');
    const key = await getActiveSceneKey(page);
    expect(key).toBe('GameScene');
  });

  test('reset progress clears cleared levels', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);

    // Set some progress
    await page.evaluate(() => {
      localStorage.setItem(
        'stock_game_progress',
        JSON.stringify({
          clearedLevel: 5,
          ownedCards: ['good_news', 'bull_market', 'black_swan'],
          currentDeck: ['good_news', 'bull_market', 'black_swan'],
        }),
      );
    });

    await page.reload();
    await waitForGame(page);

    // Click reset (400, 420)
    await clickGame(page, 400, 420);
    await page.waitForTimeout(500);

    const progress = await page.evaluate(() => {
      const raw = localStorage.getItem('stock_game_progress');
      return raw ? JSON.parse(raw) : null;
    });

    expect(progress.clearedLevel).toBe(0);
    // Should have starter deck again
    expect(progress.currentDeck.length).toBe(8);
  });

  test('level 2 is unlocked after clearing level 1', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);
    await resetAndReload(page);

    // Navigate to level select
    await clickGame(page, 400, 340);
    await waitForScene(page, 'LevelSelectScene');

    // Level 2 center is at (400, 160) - try clicking it
    // It should NOT navigate to GameScene since level 2 is locked
    await clickGame(page, 400, 160);
    await page.waitForTimeout(500);

    // Should still be on LevelSelectScene
    let key = await getActiveSceneKey(page);
    expect(key).toBe('LevelSelectScene');

    // Now clear level 1 via localStorage
    await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('stock_game_progress') || '{}');
      progress.clearedLevel = 1;
      localStorage.setItem('stock_game_progress', JSON.stringify(progress));
    });

    // Go back to menu and re-enter level select
    await clickGame(page, 50, 35); // back
    await waitForScene(page, 'MenuScene');
    await clickGame(page, 400, 340); // start
    await waitForScene(page, 'LevelSelectScene');

    // Now clicking level 2 should work
    await clickGame(page, 400, 160);
    await waitForScene(page, 'GameScene');
    key = await getActiveSceneKey(page);
    expect(key).toBe('GameScene');
  });
});
