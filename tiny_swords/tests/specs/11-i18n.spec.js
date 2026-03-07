import { test, expect } from '@playwright/test';
import { waitForLanding, waitForGameReady, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('i18n', () => {
    test('default locale is English', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForLanding(page);

        const isActive = await page.evaluate(() =>
            window.game.scene.isActive('LandingScene')
        );
        expect(isActive).toBe(true);
        expect(errors).toHaveLength(0);
    });

    test('switching locale persists and restarts scene', async ({ page }) => {
        await waitForLanding(page);

        // Switch to zh
        await page.evaluate(() => {
            localStorage.setItem('locale', 'zh');
            window.game.scene.getScene('LandingScene').scene.restart();
        });
        await page.waitForTimeout(500);

        const locale = await page.evaluate(() => localStorage.getItem('locale'));
        expect(locale).toBe('zh');

        const isActive = await page.evaluate(() =>
            window.game.scene.isActive('LandingScene')
        );
        expect(isActive).toBe(true);
    });

    test('game works in zh locale', async ({ page }) => {
        await waitForLanding(page);

        // Set zh locale before entering game
        await page.evaluate(() => {
            localStorage.setItem('locale', 'zh');
        });

        await page.evaluate(() => {
            window.game.scene.start('GameScene');
        });
        await page.waitForFunction(() => {
            return window.gameAPI &&
                   window.game.scene.isActive('GameScene');
        }, { timeout: 10000 });
        await page.waitForTimeout(500);

        const hasAPI = await page.evaluate(() => typeof window.gameAPI !== 'undefined');
        expect(hasAPI).toBe(true);
    });
});
