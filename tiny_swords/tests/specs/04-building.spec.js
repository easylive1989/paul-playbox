import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Building System', () => {
    test('build a barracks via API', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await page.evaluate(() => window.gameAPI.setGold(500));

        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 3));
        const result = await page.evaluate(([gx, gy]) => window.gameAPI.buildStructure('barracks', gx, gy), [pos.gx, pos.gy]);
        expect(result.success).toBe(true);
        expect(result.buildingId).toBeTruthy();

        const state = await getGameState(page);
        expect(state.buildings).toHaveLength(2); // 1 castle + 1 barracks
        expect(state.buildings.filter(b => b.type === 'barracks')).toHaveLength(1);
        expect(state.gold).toBe(350); // 500 - 150
        expect(errors).toHaveLength(0);
    });

    test('build a gold mine via API', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await page.evaluate(() => window.gameAPI.setGold(500));

        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 2));
        const result = await page.evaluate(([gx, gy]) => window.gameAPI.buildStructure('goldmine', gx, gy), [pos.gx, pos.gy]);
        expect(result.success).toBe(true);
        expect(result.buildingId).toBeTruthy();

        const state = await getGameState(page);
        expect(state.buildings).toHaveLength(2); // 1 castle + 1 goldmine
        expect(state.buildings.filter(b => b.type === 'goldmine')).toHaveLength(1);
        expect(state.gold).toBe(400); // 500 - 100
        expect(errors).toHaveLength(0);
    });

    test('cannot build with insufficient gold', async ({ page }) => {
        await waitForGameReady(page);

        // Starting gold is 100, barracks costs 150
        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 3));
        const result = await page.evaluate(([gx, gy]) => window.gameAPI.buildStructure('barracks', gx, gy), [pos.gx, pos.gy]);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('insufficient_gold');
    });

    test('cannot build on occupied space', async ({ page }) => {
        await waitForGameReady(page);
        await page.evaluate(() => window.gameAPI.setGold(500));

        // Try to build overlapping the castle (wherever it is)
        const castle = await page.evaluate(() => window.gameAPI.getCastlePosition());
        const result = await page.evaluate(([gx, gy]) => window.gameAPI.buildStructure('barracks', gx, gy), [castle.gx, castle.gy]);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('invalid_placement');
    });
});
