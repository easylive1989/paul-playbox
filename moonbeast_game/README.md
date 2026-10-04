# 月蝕獸鬥

瀏覽器上的一對一回合制 3D 怪獸對戰遊戲。玩家每次勝利後會升級，並從三個隨機形態中選擇下一次進化；形態會改變屬性、被動能力與技能組。

## 啟動遊戲

需要透過本機 HTTP 伺服器載入 GLB 模型：

```bash
python3 -m http.server 8080
```

接著開啟 <http://127.0.0.1:8080/>。專案不需要安裝套件或執行建置。

## 操作方式

- 選擇同級對手後開始戰鬥。
- 點擊技能，或按數字鍵 `1`–`4` 行動。
- 勝利後從三個隨機形態中選擇進化。
- 完成四場戰鬥並擊敗最終敵人即可通關。

## 專案結構

```text
.
├── index.html           遊戲頁面與介面結構
├── game.js              戰鬥、進化與 Three.js 場景邏輯
├── data.js              怪獸、技能及關卡資料
├── style.css            主要視覺樣式
├── choices.css          選擇畫面樣式
├── assets/
│   ├── models/          遊戲直接載入的 GLB 模型
│   └── concepts/        怪獸概念圖與三視圖
├── vendor/              瀏覽器端第三方程式
└── docs/                遊戲設計文件
```

3D 模型均以遊戲資產形式直接納入，不包含模型生成器、編譯器或驗收工具鏈。

## 技術

- 原生 HTML、CSS、JavaScript
- Three.js
- GLB 3D 模型與骨架動畫

授權資訊見 [LICENSE](LICENSE)，第三方元件見 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
