import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Wave System', () => {
    test('skip to wave 1 spawns enemies', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        // Skip to wave 1 (sets timer near trigger)
        await page.evaluate(() => window.gameAPI.skipToWave(1));

        // Poll until wave 1 spawns enemies
        await page.waitForFunction(() => {
            const s = window.gameAPI.getGameState();
            return s.wave.current >= 1 && s.enemyUnits.length > 0;
        }, { timeout: 5000 });

        expect(errors).toHaveLength(0);
    });

    test('wave counter increments', async ({ page }) => {
        await waitForGameReady(page);

        // Skip to wave 2
        await page.evaluate(() => window.gameAPI.skipToWave(2));

        await page.waitForFunction(() => {
            const s = window.gameAPI.getGameState();
            return s.wave.current >= 2;
        }, { timeout: 5000 });
    });
});
