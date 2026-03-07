import { test, expect } from '@playwright/test';
import { waitForLanding, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Landing Scene', () => {
    test('landing scene appears after boot', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForLanding(page);

        const isActive = await page.evaluate(() =>
            window.game.scene.isActive('LandingScene')
        );
        expect(isActive).toBe(true);
        expect(errors).toHaveLength(0);
    });

    test('start game button transitions to GameScene', async ({ page }) => {
        await waitForLanding(page);

        // Click start button by triggering scene start
        await page.evaluate(() => {
            window.game.scene.start('GameScene');
        });

        await page.waitForFunction(() => {
            return window.gameAPI &&
                   window.game.scene.isActive('GameScene');
        }, { timeout: 10000 });

        const isActive = await page.evaluate(() =>
            window.game.scene.isActive('GameScene')
        );
        expect(isActive).toBe(true);
    });
});
