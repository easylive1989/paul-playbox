# Landing Scene 設計

## 概述

在遊戲啟動後、進入主遊戲前加入 Landing 畫面，讓玩家可以選擇開始遊戲或離開。

## 場景流程

```
BootScene (載入素材) → LandingScene (Landing 畫面) → GameScene (遊戲)
                           ↑                              │
                           └──── 遊戲結束「回主畫面」───────┘
```

## LandingScene 設計

**新檔案**：`src/scenes/LandingScene.js`

### 畫面內容

- **背景**：`landing_background.gif` 全螢幕顯示（1280×768）
- **按鈕**：使用現有 `ui_btn_blue` 長形按鈕素材，畫面中下方垂直排列
  - 「開始遊戲」→ `this.scene.start('GameScene')`
  - 「離開」→ `window.close()`
- **按鈕互動**：沿用現有 hover/pressed/normal 狀態切換模式

### 按鈕樣式

- 使用素材：`ui_btn_blue`, `ui_btn_hover`, `ui_btn_blue_pressed`
- 文字樣式：`{ fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial', stroke: '#3a2a14', strokeThickness: 3 }`

## 修改範圍

### 新增

- `src/scenes/LandingScene.js` — Landing 場景

### 修改

- `src/main.js` — scene 陣列加入 LandingScene
- `src/scenes/BootScene.js` — 完成後啟動 LandingScene 而非 GameScene
- `src/scenes/GameScene.js` — endGame() 彈窗加入「回到主畫面」按鈕

## 決策記錄

- 採用獨立 LandingScene 而非合併在 BootScene，保持場景職責分離
- 場景流程 Boot → Landing → Game，素材在 Boot 階段全部載完
- 不顯示遊戲標題文字，保持畫面簡潔
