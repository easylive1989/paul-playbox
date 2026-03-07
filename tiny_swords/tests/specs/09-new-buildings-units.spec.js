import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('New Buildings and Units', () => {

    test('can build all new building types', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        await page.evaluate(() => window.gameAPI.setGold(5000));

        // Build each new type at dynamically found buildable positions
        const buildTypes = [
            ['tower', 2, 3],
            ['archery', 3, 3],
            ['house', 2, 2],
            ['monastery', 3, 3],
        ];
        for (const [type, w, h] of buildTypes) {
            const pos = await page.evaluate(([bw, bh]) => window.gameAPI.findBuildablePosition(bw, bh), [w, h]);
            const result = await page.evaluate(
                ([t, x, y]) => window.gameAPI.buildStructure(t, x, y),
                [type, pos.gx, pos.gy]
            );
            expect(result.success).toBe(true);
        }

        const state = await getGameState(page);
        // Castle + 4 new buildings = 5
        expect(state.buildings.length).toBeGreaterThanOrEqual(5);
        expect(errors).toHaveLength(0);
    });

    test('archery trains archer unit', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        await page.evaluate(() => window.gameAPI.setGold(5000));

        // Build archery at a buildable position
        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 3));
        const build = await page.evaluate(([gx, gy]) =>
            window.gameAPI.buildStructure('archery', gx, gy),
            [pos.gx, pos.gy]
        );
        expect(build.success).toBe(true);

        // Produce archer
        const produce = await page.evaluate((bid) =>
            window.gameAPI.produceUnit(bid, 'archer'),
            build.buildingId
        );
        expect(produce.success).toBe(true);

        // Fast-forward production
        await page.evaluate((bid) => {
            const scene = window.game.scene.getScene('GameScene');
            const building = scene.buildings.find(b => b.id === bid);
            if (building) building.produceTimer = 999999;
        }, build.buildingId);

        await page.waitForTimeout(500);

        const state = await getGameState(page);
        const archers = state.playerUnits.filter(u => u.type === 'archer');
        expect(archers.length).toBeGreaterThanOrEqual(1);
        expect(errors).toHaveLength(0);
    });

    test('monastery trains monk unit', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        await page.evaluate(() => window.gameAPI.setGold(5000));

        // Build monastery at a buildable position
        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 3));
        const build = await page.evaluate(([gx, gy]) =>
            window.gameAPI.buildStructure('monastery', gx, gy),
            [pos.gx, pos.gy]
        );
        expect(build.success).toBe(true);

        // Produce monk
        const produce = await page.evaluate((bid) =>
            window.gameAPI.produceUnit(bid, 'monk'),
            build.buildingId
        );
        expect(produce.success).toBe(true);

        // Fast-forward
        await page.evaluate((bid) => {
            const scene = window.game.scene.getScene('GameScene');
            const building = scene.buildings.find(b => b.id === bid);
            if (building) building.produceTimer = 999999;
        }, build.buildingId);

        await page.waitForTimeout(500);

        const state = await getGameState(page);
        const monks = state.playerUnits.filter(u => u.type === 'monk');
        expect(monks.length).toBeGreaterThanOrEqual(1);
        expect(errors).toHaveLength(0);
    });

    test('house increases population cap', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        await page.evaluate(() => window.gameAPI.setGold(5000));

        // Check initial pop cap
        const initialState = await page.evaluate(() => ({
            popCap: window.game.scene.getScene('GameScene').resourceSystem.getPopCap()
        }));
        expect(initialState.popCap).toBe(10);

        // Build house
        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(2, 2));
        const build = await page.evaluate(([gx, gy]) =>
            window.gameAPI.buildStructure('house', gx, gy),
            [pos.gx, pos.gy]
        );
        expect(build.success).toBe(true);

        // Check pop cap increased
        const newState = await page.evaluate(() => ({
            popCap: window.game.scene.getScene('GameScene').resourceSystem.getPopCap()
        }));
        expect(newState.popCap).toBe(15);
        expect(errors).toHaveLength(0);
    });

    test('population cap prevents over-training', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        await page.evaluate(() => window.gameAPI.setGold(50000));

        // Set pop cap very low for testing
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            scene.resourceSystem.popCap = 2;
            scene.resourceSystem.popUsed = 0;
        });

        // Build barracks
        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 3));
        const build = await page.evaluate(([gx, gy]) =>
            window.gameAPI.buildStructure('barracks', gx, gy),
            [pos.gx, pos.gy]
        );
        expect(build.success).toBe(true);

        // Produce 2 warriors (should succeed)
        for (let i = 0; i < 2; i++) {
            const produce = await page.evaluate((bid) =>
                window.gameAPI.produceUnit(bid, 'warrior'),
                build.buildingId
            );
            expect(produce.success).toBe(true);

            // Fast-forward
            await page.evaluate((bid) => {
                const scene = window.game.scene.getScene('GameScene');
                const building = scene.buildings.find(b => b.id === bid);
                if (building) building.produceTimer = 999999;
            }, build.buildingId);
            await page.waitForTimeout(300);
        }

        // 3rd warrior should fail (at cap)
        const produce3 = await page.evaluate((bid) =>
            window.gameAPI.produceUnit(bid, 'warrior'),
            build.buildingId
        );
        expect(produce3.success).toBe(false);
        expect(errors).toHaveLength(0);
    });

    test('tower auto-attacks enemies', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        await page.evaluate(() => window.gameAPI.setGold(5000));

        // Build tower
        const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(2, 3));
        const build = await page.evaluate(([gx, gy]) =>
            window.gameAPI.buildStructure('tower', gx, gy),
            [pos.gx, pos.gy]
        );
        expect(build.success).toBe(true);

        // Spawn enemy near tower
        const enemy = await page.evaluate(([gx, gy]) =>
            window.gameAPI.spawnTestEnemy('torch', gx + 1, gy),
            [pos.gx, pos.gy]
        );
        expect(enemy.success).toBe(true);

        // Wait for tower to attack
        await page.waitForTimeout(3000);

        // Check enemy took damage
        const state = await page.evaluate((eid) => {
            const scene = window.game.scene.getScene('GameScene');
            const e = scene.enemyUnits.find(u => u.id === eid);
            return e ? { hp: e.hp, maxHp: e.maxHp, alive: e.alive } : null;
        }, enemy.unitId);

        // Enemy should have taken at least some damage
        if (state && state.alive) {
            expect(state.hp).toBeLessThan(state.maxHp);
        }
        expect(errors).toHaveLength(0);
    });
});
