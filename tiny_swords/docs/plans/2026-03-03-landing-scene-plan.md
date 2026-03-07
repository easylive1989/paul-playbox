# Landing Scene Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 加入 Landing 畫面，讓玩家在進入遊戲前可以選擇開始遊戲或離開，並在遊戲結束後可以回到主畫面。

**Architecture:** 新增 `LandingScene` 場景，插入在 `BootScene` 和 `GameScene` 之間。Landing 畫面使用 `landing_background.gif` 作為全螢幕背景，搭配現有 UI 按鈕素材。遊戲結束彈窗新增「回到主畫面」按鈕。

**Tech Stack:** Phaser 3, JavaScript ES Modules, Playwright

---

### Task 1: 在 BootScene 載入 landing_background.gif

**Files:**
- Modify: `src/config/assetManifest.js`

**Step 1: 在 assetManifest.js 的 images 陣列末尾加入 landing 背景圖**

在 `images` 陣列最後加入：

```javascript
    // --- Landing ---
    { key: 'landing_bg',          path: 'assets/landing_background.gif' },
```

注意：Phaser 3 的 `this.load.image()` 可以載入 GIF，但只會取第一幀作為靜態圖片。GIF 動畫需要特別處理（見 Task 2）。

**Step 2: Commit**

```bash
git add src/config/assetManifest.js
git commit -m "feat: add landing background to asset manifest"
```

---

### Task 2: 建立 LandingScene

**Files:**
- Create: `src/scenes/LandingScene.js`

**Step 1: 建立 LandingScene.js**

```javascript
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';

export default class LandingScene extends Phaser.Scene {
    constructor() {
        super('LandingScene');
    }

    create() {
        const cx = VIEWPORT_WIDTH / 2;
        const cy = VIEWPORT_HEIGHT / 2;

        // Full-screen background (static first frame of GIF)
        const bg = this.add.image(cx, cy, 'landing_bg');
        bg.setDisplaySize(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

        // --- Start Game button ---
        const startBtnY = cy + 120;
        const startBtn = this.add.image(cx, startBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setInteractive();
        const startText = this.add.text(cx, startBtnY - 2, 'Start Game', {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => startBtn.setTexture('ui_btn_hover'));
        startBtn.on('pointerout', () => startBtn.setTexture('ui_btn_blue'));
        startBtn.on('pointerdown', () => {
            startBtn.setTexture('ui_btn_blue_pressed');
            this.scene.start('GameScene');
        });

        // --- Quit button ---
        const quitBtnY = startBtnY + 60;
        const quitBtn = this.add.image(cx, quitBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setInteractive();
        const quitText = this.add.text(cx, quitBtnY - 2, 'Quit', {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        quitBtn.on('pointerover', () => quitBtn.setTexture('ui_btn_hover'));
        quitBtn.on('pointerout', () => quitBtn.setTexture('ui_btn_blue'));
        quitBtn.on('pointerdown', () => {
            quitBtn.setTexture('ui_btn_blue_pressed');
            window.close();
        });
    }
}
```

**Step 2: Commit**

```bash
git add src/scenes/LandingScene.js
git commit -m "feat: create LandingScene with start and quit buttons"
```

---

### Task 3: 串接場景流程 (Boot → Landing → Game)

**Files:**
- Modify: `src/main.js:2-11`
- Modify: `src/scenes/BootScene.js:51`

**Step 1: 在 main.js 中 import LandingScene 並加入 scene 陣列**

在 `main.js` 第 2 行後加入 import：

```javascript
import LandingScene from './scenes/LandingScene.js';
```

將 scene 陣列改為：

```javascript
scene: [BootScene, LandingScene, GameScene],
```

**Step 2: 修改 BootScene 完成後的目標場景**

將 `src/scenes/BootScene.js` 第 51 行：

```javascript
this.scene.start('GameScene');
```

改為：

```javascript
this.scene.start('LandingScene');
```

**Step 3: Commit**

```bash
git add src/main.js src/scenes/BootScene.js
git commit -m "feat: wire Boot → Landing → Game scene flow"
```

---

### Task 4: 遊戲結束彈窗加入「回到主畫面」按鈕

**Files:**
- Modify: `src/scenes/GameScene.js:158-193` (endGame 方法)

**Step 1: 在 endGame() 中加入「Main Menu」按鈕**

在現有 Play Again 按鈕下方加入第二個按鈕。需要調整 panel 高度和按鈕位置：

1. 將 `_createRegularPaperPanel` 的高度從 250 改為 310
2. 將 Play Again 按鈕 Y 位置從 `cy + 40` 改為 `cy + 20`
3. 在 Play Again 按鈕下方新增 Main Menu 按鈕：

```javascript
        // Main Menu button
        const menuBtnY = cy + 80;
        const menuBtnImg = this.add.image(cx, menuBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setScrollFactor(0).setDepth(5002).setInteractive();
        this.add.text(cx, menuBtnY - 2, 'Main Menu', {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5003);

        menuBtnImg.on('pointerover', () => menuBtnImg.setTexture('ui_btn_hover'));
        menuBtnImg.on('pointerout', () => menuBtnImg.setTexture('ui_btn_blue'));
        menuBtnImg.on('pointerdown', () => {
            menuBtnImg.setTexture('ui_btn_blue_pressed');
            this.scene.start('LandingScene');
        });
```

**Step 2: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add Main Menu button to game over popup"
```

---

### Task 5: 更新 Playwright 測試

**Files:**
- Modify: `tests/helpers/gameHelper.js:4-14`
- Create: `tests/specs/10-landing-scene.spec.js`

**Step 1: 更新 gameHelper.js 的 waitForGameReady**

由於現在 Boot 完成後進入 LandingScene 而非 GameScene，測試需要先跳過 Landing 畫面。新增 helper 函式：

```javascript
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
```

然後將 `waitForGameReady` 改為呼叫 `skipLanding`：

```javascript
export async function waitForGameReady(page) {
    await skipLanding(page);
}
```

這樣所有既有的測試不需要修改，仍然能正常運作。

**Step 2: 建立 Landing Scene 測試**

```javascript
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
```

**Step 3: 執行所有 Playwright 測試確認通過**

Run: `npx playwright test`
Expected: 所有測試通過（包含新的 landing scene 測試和既有測試）

**Step 4: Commit**

```bash
git add tests/helpers/gameHelper.js tests/specs/10-landing-scene.spec.js
git commit -m "test: add landing scene tests and update helper for new scene flow"
```

---

### Task 6: 手動驗證與最終確認

**Step 1: 啟動 live-server 手動驗證**

Run: `npx live-server --port=8081`

驗證清單：
- [ ] 遊戲啟動後顯示 Landing 畫面（背景圖 + 兩個按鈕）
- [ ] 點「Start Game」進入遊戲
- [ ] 點「Quit」嘗試關閉視窗
- [ ] 遊戲結束後顯示 Play Again 和 Main Menu 按鈕
- [ ] 點 Main Menu 回到 Landing 畫面
- [ ] 點 Play Again 重新開始遊戲

**Step 2: 執行全部 Playwright 測試**

Run: `npx playwright test`
Expected: 全部通過

**Step 3: Final commit（如果有修正）**
