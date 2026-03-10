import { test, expect } from '@playwright/test';
import {
  waitForGame,
  getActiveSceneKey,
  getSceneTexts,
  clickGame,
  resetAndReload,
  waitForScene,
} from './helpers';

test.describe('LevelSelectScene', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);
    await resetAndReload(page);
    // Navigate to LevelSelectScene
    await clickGame(page, 400, 340); // "開始遊戲"
    await waitForScene(page, 'LevelSelectScene');
  });

  test('shows level selection title', async ({ page }) => {
    const texts = await getSceneTexts(page);
    expect(texts.some((t) => t.includes('選擇關卡'))).toBe(true);
  });

  test('displays 7 level cards', async ({ page }) => {
    const texts = await getSceneTexts(page);
    for (let i = 1; i <= 7; i++) {
      expect(texts.some((t) => t.includes(`關卡 ${i}`))).toBe(true);
    }
  });

  test('shows target value for level 1', async ({ page }) => {
    const texts = await getSceneTexts(page);
    expect(texts.some((t) => t.includes('$11,000'))).toBe(true);
  });

  test('shows deck info', async ({ page }) => {
    const texts = await getSceneTexts(page);
    expect(texts.some((t) => t.includes('卡組'))).toBe(true);
  });

  test('back button returns to MenuScene', async ({ page }) => {
    // "← 返回" is at approximately (30, 30)
    await clickGame(page, 50, 35);
    await waitForScene(page, 'MenuScene');
    const key = await getActiveSceneKey(page);
    expect(key).toBe('MenuScene');
  });

  test('clicking level 1 enters GameScene', async ({ page }) => {
    // Level 1 card is first in the grid. Grid starts at:
    // cols=3, cardW=200, gapX=30, startX=(800-(3*200+2*30))/2 = (800-660)/2 = 70
    // Level 1 center: x=70+100=170, y=90+70=160
    await clickGame(page, 170, 160);
    await waitForScene(page, 'GameScene');
    const key = await getActiveSceneKey(page);
    expect(key).toBe('GameScene');
  });
});
