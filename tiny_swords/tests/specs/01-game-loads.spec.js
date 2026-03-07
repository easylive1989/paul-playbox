import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Game Loading', () => {
    test('game boots and reaches GameScene without errors', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        // gameAPI should exist
        const hasAPI = await page.evaluate(() => typeof window.gameAPI !== 'undefined');
        expect(hasAPI).toBe(true);

        // No page errors
        expect(errors).toHaveLength(0);
    });

    test('initial state is correct', async ({ page }) => {
        await waitForGameReady(page);
        const state = await getGameState(page);

        // Gold
        expect(state.gold).toBe(100);

        // No starting units (pawns removed)
        expect(state.playerUnits).toHaveLength(0);

        // No enemies yet
        expect(state.enemyUnits).toHaveLength(0);

        // 1 building: castle only (gold mines must be built manually)
        expect(state.buildings).toHaveLength(1);
        expect(state.buildings.filter(b => b.type === 'castle')).toHaveLength(1);

        // Wave 0, not started
        expect(state.wave.current).toBe(0);
        expect(state.wave.allSpawned).toBe(false);

        // Game not over
        expect(state.gameOver).toBe(false);
        expect(state.gameResult).toBeNull();
    });
});
