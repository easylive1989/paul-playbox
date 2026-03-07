/**
 * Wait for LandingScene to be active after boot.
 */
export async function waitForLanding(page) {
    await page.goto('/');
    await page.waitForFunction(() => {
        return window.game &&
               window.game.scene.getScene('LandingScene') &&
               window.game.scene.isActive('LandingScene');
    }, { timeout: 10000 });
    await page.waitForTimeout(300);
}

/**
 * Skip landing screen by starting GameScene directly.
 * Used by existing tests that need to go straight to game.
 */
export async function skipLanding(page) {
    await waitForLanding(page);
    await page.evaluate(() => {
        window.game.scene.start('GameScene');
    });
    await page.waitForFunction(() => {
        return window.gameAPI &&
               window.game.scene.getScene('GameScene') &&
               window.game.scene.getScene('GameScene').castle;
    }, { timeout: 10000 });
    await page.waitForTimeout(500);
}

/**
 * Wait for the game to fully load (GameScene active + gameAPI available).
 */
export async function waitForGameReady(page) {
    await skipLanding(page);
}

/**
 * Return the full game state via gameAPI.
 */
export async function getGameState(page) {
    return page.evaluate(() => window.gameAPI.getGameState());
}

/**
 * Collect page errors during a test.
 * Returns an array that is mutated in-place as errors occur.
 */
export function collectPageErrors(page) {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    return errors;
}
