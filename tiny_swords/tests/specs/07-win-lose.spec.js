import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Win/Lose Conditions', () => {
    test('DEFEAT when castle is destroyed', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        // Kill the castle
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            scene.castle.hp = 1;
            scene.castle.takeDamage(1);
        });

        // Poll until game loop processes checkGameOver
        await page.waitForFunction(() => {
            return window.gameAPI.getGameState().gameOver === true;
        }, { timeout: 3000 });

        const state = await getGameState(page);
        expect(state.gameResult).toBe('defeat');
        expect(errors).toHaveLength(0);
    });

    test('VICTORY when all waves spawned and enemies dead', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        // Simulate victory conditions
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            scene.waveSystem.allWavesSpawned = true;
            scene.waveSystem.currentWave = 10;
            scene.enemyUnits = [];
        });

        // Poll until game loop processes checkGameOver
        await page.waitForFunction(() => {
            return window.gameAPI.getGameState().gameOver === true;
        }, { timeout: 3000 });

        const state = await getGameState(page);
        expect(state.gameResult).toBe('victory');
        expect(errors).toHaveLength(0);
    });
});
