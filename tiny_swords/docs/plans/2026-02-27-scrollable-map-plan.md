# Scrollable Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the game map to 40x24 grid (2560x1536 px) with camera scrolling via arrow buttons and keyboard arrow keys, keeping the viewport at 1280x768.

**Architecture:** Use Phaser's built-in camera system with `camera.setBounds()`. Add a `CameraSystem` class that renders 4 directional arrow buttons (drawn with Phaser Graphics) and listens to keyboard arrow keys. All UI elements already use `setScrollFactor(0)` — just need to fix position references from `GAME_WIDTH/HEIGHT` to new `VIEWPORT_WIDTH/HEIGHT` constants.

**Tech Stack:** Phaser 3, JavaScript ES Modules, Playwright for testing

---

### Task 1: Update game config constants

**Files:**
- Modify: `src/config/gameConfig.js`

**Step 1: Update constants**

Change `GRID_COLS`, `GRID_ROWS`, `ENEMY_SPAWN_MIN_X`, and add viewport constants:

```javascript
export const TILE_SIZE = 64;
export const GRID_COLS = 40;
export const GRID_ROWS = 24;
export const GAME_WIDTH = TILE_SIZE * GRID_COLS;   // 2560
export const GAME_HEIGHT = TILE_SIZE * GRID_ROWS;  // 1536
export const VIEWPORT_WIDTH = 1280;
export const VIEWPORT_HEIGHT = 768;

// Zones
export const PLAYER_ZONE_MAX_X = 13;
export const ENEMY_SPAWN_MIN_X = 38;   // columns 38-39 for enemy spawn
```

**Step 2: Commit**

```bash
git add src/config/gameConfig.js
git commit -m "feat: expand map to 40x24 grid and add viewport constants"
```

---

### Task 2: Update Phaser canvas config

**Files:**
- Modify: `src/main.js`

**Step 1: Use viewport constants for canvas size**

The Phaser config `width/height` must remain at 1280x768 (the viewport), not the world size. Import `VIEWPORT_WIDTH/HEIGHT` instead of `GAME_WIDTH/HEIGHT`:

```javascript
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './config/gameConfig.js';

const config = {
    type: Phaser.AUTO,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    // ... rest unchanged
};
```

**Step 2: Commit**

```bash
git add src/main.js
git commit -m "feat: use viewport constants for Phaser canvas size"
```

---

### Task 3: Update BootScene loading bar positioning

**Files:**
- Modify: `src/scenes/BootScene.js`

**Step 1: Use viewport constants**

BootScene centers its loading bar using `GAME_WIDTH/HEIGHT`. Change to `VIEWPORT_WIDTH/HEIGHT`:

```javascript
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';
// Remove GAME_WIDTH, GAME_HEIGHT import

// In preload():
const cx = VIEWPORT_WIDTH / 2;
const cy = VIEWPORT_HEIGHT / 2;
```

**Step 2: Commit**

```bash
git add src/scenes/BootScene.js
git commit -m "fix: use viewport constants for boot scene loading bar"
```

---

### Task 4: Expand terrain rendering

**Files:**
- Modify: `src/scenes/GameScene.js` (method: `renderTerrain`, lines 64-123)

**Step 1: Update background to cover full world**

The SpecialPaper 9-slice background must cover the entire 2560x1536 world. The `renderTerrain()` method already uses `GAME_WIDTH` and `GAME_HEIGHT` which now resolve to 2560/1536, so the background expands automatically.

The grass island range uses `GRID_COLS` and `GRID_ROWS` which now resolve to 40/24, so grass automatically fills columns 1-38, rows 1-22.

**Verify** that `renderTerrain()` requires NO code changes — the constants already drive the sizes. Just read and confirm.

**Step 2: Commit (if changes needed)**

Only commit if code changes were required.

---

### Task 5: Setup camera and physics world bounds

**Files:**
- Modify: `src/scenes/GameScene.js` (method: `create`, lines 29-56)

**Step 1: Add camera bounds in create()**

After `this.renderTerrain()` in `create()`, add camera and physics bounds:

```javascript
import { TILE_SIZE, GRID_COLS, GRID_ROWS, GAME_WIDTH, GAME_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';

// In create(), after renderTerrain():
this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
```

**Step 2: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: set camera and physics world bounds for large map"
```

---

### Task 6: Create CameraSystem with arrow buttons and keyboard scrolling

**Files:**
- Create: `src/systems/CameraSystem.js`
- Modify: `src/scenes/GameScene.js` (import + instantiate + call update)

**Step 1: Create CameraSystem class**

```javascript
// src/systems/CameraSystem.js
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

const SCROLL_SPEED = 300; // pixels per second
const ARROW_SIZE = 32;
const ARROW_MARGIN = 12;
const ARROW_ALPHA = 0.5;
const ARROW_DEPTH = 2000;

export default class CameraSystem {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;

        // Scroll direction state
        this.scrollDir = { x: 0, y: 0 };

        this._createArrowButtons();
        this._setupKeyboard();
    }

    _createArrowButtons() {
        const s = this.scene;
        const hw = VIEWPORT_WIDTH / 2;
        const hh = VIEWPORT_HEIGHT / 2;

        // Create 4 triangle arrow buttons using Graphics
        this.arrows = {
            up:    this._createArrow(s, hw, ARROW_MARGIN, 0),          // top center
            down:  this._createArrow(s, hw, VIEWPORT_HEIGHT - ARROW_MARGIN, Math.PI),  // bottom center
            left:  this._createArrow(s, ARROW_MARGIN, hh, -Math.PI / 2),  // left center
            right: this._createArrow(s, VIEWPORT_WIDTH - ARROW_MARGIN, hh, Math.PI / 2), // right center
        };

        // Bind pointerdown / pointerup / pointerout
        this._bindArrow(this.arrows.up,    0, -1);
        this._bindArrow(this.arrows.down,  0,  1);
        this._bindArrow(this.arrows.left, -1,  0);
        this._bindArrow(this.arrows.right, 1,  0);
    }

    _createArrow(scene, x, y, rotation) {
        const g = scene.add.graphics();
        g.fillStyle(0xfef3c0, ARROW_ALPHA);
        g.lineStyle(2, 0x3a2a14, ARROW_ALPHA);
        // Draw upward-pointing triangle centered at origin
        const s = ARROW_SIZE;
        g.fillTriangle(-s / 2, s / 3, s / 2, s / 3, 0, -s / 3);
        g.strokeTriangle(-s / 2, s / 3, s / 2, s / 3, 0, -s / 3);
        g.setScrollFactor(0);
        g.setDepth(ARROW_DEPTH);
        g.setPosition(x, y);
        g.rotation = rotation;

        // Hit area for interaction
        const hitZone = scene.add.zone(x, y, ARROW_SIZE * 1.5, ARROW_SIZE * 1.5)
            .setScrollFactor(0).setDepth(ARROW_DEPTH).setInteractive();
        hitZone._arrowGraphics = g;

        return hitZone;
    }

    _bindArrow(zone, dx, dy) {
        zone.on('pointerdown', () => {
            this.scrollDir.x += dx;
            this.scrollDir.y += dy;
            zone._arrowGraphics.setAlpha(1);
        });
        const stop = () => {
            this.scrollDir.x -= dx;
            this.scrollDir.y -= dy;
            zone._arrowGraphics.setAlpha(ARROW_ALPHA);
        };
        zone.on('pointerup', stop);
        zone.on('pointerout', stop);
    }

    _setupKeyboard() {
        const cursors = this.scene.input.keyboard.createCursorKeys();
        this.cursors = cursors;
    }

    update(time, delta) {
        const dt = delta / 1000;
        let dx = this.scrollDir.x;
        let dy = this.scrollDir.y;

        // Keyboard arrow keys
        if (this.cursors.left.isDown)  dx -= 1;
        if (this.cursors.right.isDown) dx += 1;
        if (this.cursors.up.isDown)    dy -= 1;
        if (this.cursors.down.isDown)  dy += 1;

        // Clamp to -1..1
        dx = Math.max(-1, Math.min(1, dx));
        dy = Math.max(-1, Math.min(1, dy));

        // Apply scroll
        if (dx !== 0 || dy !== 0) {
            this.camera.scrollX += dx * SCROLL_SPEED * dt;
            this.camera.scrollY += dy * SCROLL_SPEED * dt;
        }

        // Update arrow visibility based on camera bounds
        const cam = this.camera;
        this.arrows.left.visible = cam.scrollX > 0;
        this.arrows.left._arrowGraphics.visible = this.arrows.left.visible;
        this.arrows.right.visible = cam.scrollX < GAME_WIDTH - VIEWPORT_WIDTH;
        this.arrows.right._arrowGraphics.visible = this.arrows.right.visible;
        this.arrows.up.visible = cam.scrollY > 0;
        this.arrows.up._arrowGraphics.visible = this.arrows.up.visible;
        this.arrows.down.visible = cam.scrollY < GAME_HEIGHT - VIEWPORT_HEIGHT;
        this.arrows.down._arrowGraphics.visible = this.arrows.down.visible;
    }
}
```

**Step 2: Integrate into GameScene**

In `GameScene.create()`, after other systems:

```javascript
import CameraSystem from '../systems/CameraSystem.js';

// In create(), after other systems:
this.cameraSystem = new CameraSystem(this);
```

In `GameScene.update()`, add camera update before the gameOver check:

```javascript
update(time, delta) {
    // Update camera scrolling
    this.cameraSystem.update(time, delta);

    if (this.gameOver) return;
    // ... rest unchanged
}
```

**Step 3: Commit**

```bash
git add src/systems/CameraSystem.js src/scenes/GameScene.js
git commit -m "feat: add CameraSystem with arrow buttons and keyboard scrolling"
```

---

### Task 7: Fix UI positioning to use viewport constants

**Files:**
- Modify: `src/ui/HUD.js` (lines 1, 21-29)
- Modify: `src/ui/BuildMenu.js` (lines 1, 7-8)
- Modify: `src/scenes/GameScene.js` (method: `endGame`, lines 169-205)

**Step 1: Fix HUD.js**

Replace `GAME_WIDTH` import with `VIEWPORT_WIDTH`:

```javascript
import { VIEWPORT_WIDTH } from '../config/gameConfig.js';
```

Update the right-side timer position (line 27-29 use hardcoded 1172 which is near GAME_WIDTH=1280 — keep as-is since it's hardcoded relative to viewport).

Update the center wave display (line 21 uses hardcoded 640 = GAME_WIDTH/2 — this is fine for viewport center).

No actual changes needed since HUD uses hardcoded pixel values that match the viewport, not `GAME_WIDTH`. Just verify and confirm.

**Step 2: Fix BuildMenu.js**

```javascript
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, BARRACKS_COST, GOLDMINE_COST } from '../config/gameConfig.js';

// Line 7-8: change GAME_WIDTH/HEIGHT to VIEWPORT_WIDTH/HEIGHT
const panelX = VIEWPORT_WIDTH / 2;
const panelY = VIEWPORT_HEIGHT - 25;
```

**Step 3: Fix GameScene.endGame()**

```javascript
// In endGame() method, replace GAME_WIDTH/HEIGHT with VIEWPORT_WIDTH/HEIGHT:
endGame(result) {
    this.gameOver = true;
    this.gameResult = result;
    this.waveSystem.gameOver = true;

    const cx = VIEWPORT_WIDTH / 2;
    const cy = VIEWPORT_HEIGHT / 2;

    // Darken overlay — must cover full viewport
    const overlay = this.add.rectangle(cx, cy, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 0x000000, 0.6);
    overlay.setScrollFactor(0).setDepth(5000);

    // ... rest uses cx, cy which are now viewport-centered
```

Ensure `VIEWPORT_WIDTH` and `VIEWPORT_HEIGHT` are imported at the top of `GameScene.js`.

**Step 4: Commit**

```bash
git add src/ui/HUD.js src/ui/BuildMenu.js src/scenes/GameScene.js
git commit -m "fix: use viewport constants for UI positioning"
```

---

### Task 8: Add camera API for testing

**Files:**
- Modify: `src/api/GameAPI.js`

**Step 1: Add camera query and scroll methods**

```javascript
// Add to GameAPI class:

getCameraState() {
    const cam = this.scene.cameras.main;
    return {
        scrollX: cam.scrollX,
        scrollY: cam.scrollY,
        viewportWidth: cam.width,
        viewportHeight: cam.height
    };
}

scrollCamera(dx, dy) {
    const cam = this.scene.cameras.main;
    cam.scrollX += dx;
    cam.scrollY += dy;
    return this.getCameraState();
}
```

**Step 2: Commit**

```bash
git add src/api/GameAPI.js
git commit -m "feat: add camera state and scroll methods to GameAPI"
```

---

### Task 9: Playwright test for scrollable map

**Files:**
- Create: `tests/specs/08-scrollable-map.spec.js`

**Step 1: Write the test**

```javascript
import { test, expect } from '@playwright/test';
import { waitForGameReady } from '../helpers/gameHelper.js';

test.describe('Scrollable Map', () => {
    test('camera starts at top-left and can scroll', async ({ page }) => {
        await waitForGameReady(page);

        // Camera should start at (0, 0)
        const initial = await page.evaluate(() => window.gameAPI.getCameraState());
        expect(initial.scrollX).toBe(0);
        expect(initial.scrollY).toBe(0);
        expect(initial.viewportWidth).toBe(1280);
        expect(initial.viewportHeight).toBe(768);

        // Scroll right and down
        const after = await page.evaluate(() => window.gameAPI.scrollCamera(200, 100));
        expect(after.scrollX).toBe(200);
        expect(after.scrollY).toBe(100);
    });

    test('camera respects world bounds', async ({ page }) => {
        await waitForGameReady(page);

        // Scroll far beyond world bounds
        await page.evaluate(() => window.gameAPI.scrollCamera(9999, 9999));
        const state = await page.evaluate(() => window.gameAPI.getCameraState());

        // Camera bounds: max scrollX = 2560 - 1280 = 1280, max scrollY = 1536 - 768 = 768
        expect(state.scrollX).toBeLessThanOrEqual(1280);
        expect(state.scrollY).toBeLessThanOrEqual(768);
    });

    test('keyboard arrow keys scroll the camera', async ({ page }) => {
        await waitForGameReady(page);

        // Hold right arrow for 500ms
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(500);
        await page.keyboard.up('ArrowRight');

        const state = await page.evaluate(() => window.gameAPI.getCameraState());
        expect(state.scrollX).toBeGreaterThan(0);
    });

    test('map has expanded grid (40x24)', async ({ page }) => {
        await waitForGameReady(page);

        const gridInfo = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const grid = scene.gridSystem.grid;
            return { rows: grid.length, cols: grid[0].length };
        });

        expect(gridInfo.rows).toBe(24);
        expect(gridInfo.cols).toBe(40);
    });
});
```

**Step 2: Run the tests**

```bash
npx playwright test tests/specs/08-scrollable-map.spec.js --headed
```

Expected: All 4 tests pass.

**Step 3: Run ALL existing tests to verify no regressions**

```bash
npx playwright test
```

Expected: All specs pass.

**Step 4: Commit**

```bash
git add tests/specs/08-scrollable-map.spec.js
git commit -m "test: add Playwright tests for scrollable map and camera"
```
