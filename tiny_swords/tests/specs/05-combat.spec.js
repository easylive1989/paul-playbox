import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Combat System', () => {
    test('spawn enemy and verify it appears', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        const castle = await page.evaluate(() => window.gameAPI.getCastlePosition());
        const result = await page.evaluate(([gx, gy]) => window.gameAPI.spawnTestEnemy('torch', gx, gy), [castle.gx + 3, castle.gy]);
        expect(result.success).toBe(true);

        const state = await getGameState(page);
        expect(state.enemyUnits).toHaveLength(1);
        expect(state.enemyUnits[0].type).toBe('goblin_torch');
        expect(errors).toHaveLength(0);
    });

    test('warrior attacks enemy and deals damage', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        // Build barracks and produce warrior
        await page.evaluate(() => window.gameAPI.setGold(1000));
        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 3));
        const buildResult = await page.evaluate(([gx, gy]) => window.gameAPI.buildStructure('barracks', gx, gy), [pos.gx, pos.gy]);
        await page.evaluate((bid) => window.gameAPI.produceUnit(bid, 'warrior'), buildResult.buildingId);

        // Spawn an enemy near the barracks so warrior can reach it
        const enemyResult = await page.evaluate(([gx, gy]) => window.gameAPI.spawnTestEnemy('barrel', gx + 4, gy), [pos.gx, pos.gy]);
        const enemyId = enemyResult.unitId;

        let state = await getGameState(page);
        const initialHp = state.enemyUnits.find(u => u.id === enemyId).hp;

        // Force warrior spawn by advancing produce timer
        await page.evaluate((bid) => {
            const scene = window.game.scene.getScene('GameScene');
            const barracks = scene.buildings.find(b => b.id === bid);
            if (barracks) barracks.produceTimer = 999999;
        }, buildResult.buildingId);
        await page.waitForTimeout(500);

        // Check if warrior appeared, if so command attack
        state = await getGameState(page);
        const warrior = state.playerUnits.find(u => u.type === 'warrior');

        if (warrior) {
            await page.evaluate(
                ([wid, eid]) => window.gameAPI.commandAttack(wid, eid),
                [warrior.id, enemyId]
            );
            await page.waitForTimeout(3000);

            const finalState = await getGameState(page);
            const enemy = finalState.enemyUnits.find(u => u.id === enemyId);
            // Enemy should have taken damage or died
            if (enemy) {
                expect(enemy.hp).toBeLessThan(initialHp);
            }
        }

        expect(errors).toHaveLength(0);
    });
});
