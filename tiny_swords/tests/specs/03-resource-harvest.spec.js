import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Resource Generation', () => {
    test('gold mine auto-generates gold over time', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        // Build a gold mine (costs 100)
        await page.evaluate(() => window.gameAPI.setGold(200));
        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 2));
        const result = await page.evaluate(([gx, gy]) => window.gameAPI.buildStructure('goldmine', gx, gy), [pos.gx, pos.gy]);
        expect(result.success).toBe(true);

        const stateAfterBuild = await getGameState(page);
        const goldAfterBuild = stateAfterBuild.gold; // 200 - 100 = 100

        // Fast-forward the gold mine income timer
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const mine = scene.buildings.find(b => b.type === 'goldmine');
            if (mine) mine.incomeTimer = 999999;
        });
        await page.waitForTimeout(200);

        // Gold should have increased
        await page.waitForFunction((prev) => {
            return window.gameAPI.getGameState().gold > prev;
        }, goldAfterBuild, { timeout: 3000 });

        expect(errors).toHaveLength(0);
    });
});
