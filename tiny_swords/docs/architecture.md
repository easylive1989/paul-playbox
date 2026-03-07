# Tiny Swords RTS — 架構文件

## 專案概述

類似星海爭霸的即時戰略防禦遊戲。玩家在地圖上建造基地、訓練兵種、抵禦 10 波哥布林進攻。

**技術棧:** Phaser 3.60 (CDN) + JavaScript ES Modules + live-server

**地圖:** 2560×1536 像素 (40×24 格, 每格 64px)
**視窗:** 1280×768 像素
**測試:** Playwright + window.gameAPI

---

## 目錄結構

```
src/
├── main.js                    # 入口，建立 Phaser Game
├── config/
│   ├── gameConfig.js          # 所有常數 (數值、成本、時間)
│   └── assetManifest.js       # 素材清單 (圖片、精靈表)
├── scenes/
│   ├── BootScene.js           # 載入所有資源
│   └── GameScene.js           # 主遊戲場景 (遊戲迴圈)
├── entities/
│   ├── Unit.js                # 單位基類
│   ├── Warrior.js             # 近戰戰士
│   ├── Archer.js              # 遠程弓箭手
│   ├── Monk.js                # 治療僧侶
│   ├── GoblinTorch.js         # 敵方近戰
│   ├── GoblinBarrel.js        # 敵方坦克
│   ├── GoblinTNT.js           # 敵方爆破
│   ├── Building.js            # 建築基類
│   ├── Castle.js              # 主城堡
│   ├── Barracks.js            # 兵營 (訓練戰士)
│   ├── Archery.js             # 射箭場 (訓練弓箭手)
│   ├── Monastery.js           # 修道院 (訓練僧侶)
│   ├── Tower.js               # 防禦塔 (自動射擊)
│   ├── GoldMine.js            # 金礦 (被動收入)
│   └── House.js               # 房屋 (人口加成)
├── systems/
│   ├── GridSystem.js          # 網格佔用、座標轉換
│   ├── ResourceSystem.js      # 金幣與人口管理
│   ├── SelectionSystem.js     # 滑鼠選取單位/建築
│   ├── CommandSystem.js       # 移動/攻擊指令
│   ├── BuildSystem.js         # 建造模式、放置驗證
│   ├── CombatSystem.js        # 攻擊目標清理
│   ├── WaveSystem.js          # 敵波生成計時
│   └── CameraSystem.js        # 視角捲動 (滑鼠邊緣+鍵盤)
├── ui/
│   ├── HUD.js                 # 金幣、人口、波次顯示
│   ├── BuildMenu.js           # 城堡建造選單 (6 項)
│   └── HealthBar.js           # 血條 UI
├── utils/
│   ├── EventBus.js            # 發布/訂閱事件系統
│   ├── SpriteHelper.js        # 動畫建立輔助
│   └── Pathfinding.js         # 8 方向 A* 尋路
└── api/
    └── GameAPI.js             # Playwright 測試介面

tests/
├── specs/                     # 9 個 Playwright 測試模組
│   ├── 01-game-loads.spec.js
│   ├── 02-unit-selection.spec.js
│   ├── ...
│   └── 09-new-buildings-units.spec.js
└── helpers/
    └── gameHelper.js          # 測試輔助函數
```

---

## 架構總覽

```mermaid
graph TB
    subgraph Entry["入口"]
        HTML["index.html"] --> Main["main.js"]
        Main --> Boot["BootScene"]
        Boot -->|"載入素材"| Game["GameScene"]
    end

    subgraph Scene["GameScene (主場景)"]
        Game --> Systems
        Game --> Entities
        Game --> UI
    end

    subgraph Systems["系統層"]
        GS["GridSystem<br/>網格佔用"]
        RS["ResourceSystem<br/>金幣+人口"]
        SS["SelectionSystem<br/>選取輸入"]
        CS["CommandSystem<br/>移動/攻擊指令"]
        BS["BuildSystem<br/>建造放置"]
        CB["CombatSystem<br/>戰鬥清理"]
        WS["WaveSystem<br/>敵波生成"]
        CAM["CameraSystem<br/>視角捲動"]
    end

    subgraph Entities["實體層"]
        U["Unit (基類)"]
        B["Building (基類)"]
        U --> W["Warrior"]
        U --> A["Archer"]
        U --> MK["Monk"]
        U --> GT["GoblinTorch"]
        U --> GB["GoblinBarrel"]
        U --> GTNT["GoblinTNT"]
        B --> CA["Castle"]
        B --> BA["Barracks"]
        B --> AR["Archery"]
        B --> MO["Monastery"]
        B --> TW["Tower"]
        B --> GM["GoldMine"]
        B --> HO["House"]
    end

    subgraph UI["UI 層"]
        HUD["HUD<br/>資源/波次"]
        BM["BuildMenu<br/>建造選單"]
        HB["HealthBar<br/>血條"]
    end

    subgraph Utils["工具層"]
        EB["EventBus"]
        PF["Pathfinding"]
        SH["SpriteHelper"]
    end

    RS -->|"goldChanged<br/>popChanged"| EB
    EB -->|"事件"| HUD
    EB -->|"事件"| BM
    WS -->|"waveChanged"| EB
```

---

## 場景生命週期

```mermaid
sequenceDiagram
    participant B as BootScene
    participant G as GameScene
    participant GS as GridSystem
    participant WS as WaveSystem

    B->>B: preload() 載入所有素材
    B->>G: scene.start('GameScene')

    G->>GS: new GridSystem()
    G->>G: renderTerrain() 渲染地形
    G->>G: new Castle() 放置城堡
    G->>G: 初始化所有 Systems
    G->>G: 初始化 UI (HUD, BuildMenu)
    G->>G: new GameAPI() 暴露測試介面

    loop 每幀 update(time, delta)
        G->>G: CameraSystem.update()
        G->>G: 更新所有 playerUnits
        G->>G: 更新所有 enemyUnits
        G->>G: CombatSystem.update()
        G->>G: 更新所有 buildings
        G->>WS: WaveSystem.update()
        G->>G: 清理死亡單位 + 釋放人口
        G->>G: checkGameOver()
    end
```

---

## 類別繼承圖

```mermaid
classDiagram
    class Unit {
        +id: string
        +hp / maxHp: number
        +speed: number
        +state: UnitState
        +attackTarget: Unit|Building
        +sprite: Phaser.Sprite
        +moveTo(px, py)
        +moveToWithPathfinding(px, py)
        +takeDamage(amount)
        +playAnim(name)
        +update(time, delta)
    }

    class Building {
        +id: string
        +hp / maxHp: number
        +gx, gy, gridW, gridH
        +sprite: Phaser.Image
        +static cost: number
        +takeDamage(amount)
        +getCenter(): {x,y}
        +onDestroyed()
    }

    Unit <|-- Warrior : 近戰 HP100 DMG15
    Unit <|-- Archer : 遠程 HP60 DMG10 Range4
    Unit <|-- Monk : 治療 HP50 Heal15
    Unit <|-- GoblinTorch : 敵方近戰 HP60
    Unit <|-- GoblinBarrel : 敵方坦克 HP150
    Unit <|-- GoblinTNT : 敵方爆破 HP30

    Building <|-- Castle : 主基地 5x4 HP1000
    Building <|-- Barracks : 訓練戰士 3x3
    Building <|-- Archery : 訓練弓箭手 3x3
    Building <|-- Monastery : 訓練僧侶 3x3
    Building <|-- Tower : 自動射擊 2x3
    Building <|-- GoldMine : 被動收入 3x2
    Building <|-- House : 人口+5 2x2
```

---

## 系統間通訊

```mermaid
graph LR
    subgraph Input["玩家輸入"]
        LClick["左鍵"]
        RClick["右鍵"]
        Edge["滑鼠邊緣"]
        Key["方向鍵"]
    end

    subgraph Systems
        SEL["SelectionSystem"]
        CMD["CommandSystem"]
        BLD["BuildSystem"]
        CAM["CameraSystem"]
        RES["ResourceSystem"]
        WAV["WaveSystem"]
    end

    subgraph EventBus
        EB["EventBus"]
    end

    subgraph UI
        HUD["HUD"]
        MENU["BuildMenu"]
    end

    LClick --> SEL
    LClick --> BLD
    RClick --> SEL
    Edge --> CAM
    Key --> CAM

    SEL -->|"issueMove/Attack"| CMD
    CMD -->|"unit.moveTo()"| Units["Units"]
    BLD -->|"new Building()"| Buildings["Buildings"]
    BLD -->|"spendGold()"| RES
    WAV -->|"createEnemy()"| Enemies["Enemy Units"]

    RES -->|"goldChanged"| EB
    RES -->|"popChanged"| EB
    WAV -->|"waveChanged"| EB

    EB --> HUD
    EB --> MENU
```

---

## 核心資料流

### 建造建築

```mermaid
sequenceDiagram
    actor P as 玩家
    participant BM as BuildMenu
    participant BS as BuildSystem
    participant RS as ResourceSystem
    participant GS as GridSystem
    participant Scene as GameScene

    P->>BM: 點擊 Build 按鈕
    BM->>BM: openPanel() 顯示 6 種建築
    P->>BM: 選擇建築類型
    BM->>BS: enterBuildMode(type)
    BS->>BS: 顯示幽靈預覽 + 網格疊層
    P->>BS: 左鍵確認放置
    BS->>GS: canPlaceAt(gx, gy) 檢查空間
    BS->>RS: spendGold(cost) 扣金幣
    BS->>Scene: new Building() + buildings.push()
    GS->>GS: occupy(gx, gy, w, h)
```

### 訓練單位

```mermaid
sequenceDiagram
    actor P as 玩家
    participant BK as Barracks/Archery/Monastery
    participant RS as ResourceSystem
    participant GS as GridSystem
    participant Scene as GameScene

    P->>BK: 點擊 Train 按鈕
    BK->>RS: spendGold(unitCost)
    BK->>RS: usePopulation(1)
    alt 人口不足
        RS-->>BK: return false
        BK->>RS: addGold(unitCost) 退還
    end
    BK->>BK: 開始倒計時 (進度條)
    Note over BK: 10-15 秒後...
    BK->>GS: findAdjacentFreeCell()
    BK->>Scene: new Unit() + playerUnits.push()
```

### 戰鬥流程

```mermaid
sequenceDiagram
    participant W as Warrior/Archer
    participant E as Enemy
    participant Scene as GameScene

    W->>W: scanForEnemies() 偵測範圍內敵人
    W->>W: attackTarget = enemy

    loop update() 每幀
        W->>W: 計算距離
        alt 在射程內
            W->>W: performAttack() / fireArrow()
            W->>E: takeDamage(damage)
            alt HP <= 0
                E->>E: die() 死亡動畫
                E->>Scene: 從 enemyUnits 移除
            end
        else 超出射程
            W->>W: moveTo(enemy) 追擊
        end
    end
```

### 敵波生成

```mermaid
sequenceDiagram
    participant WS as WaveSystem
    participant Scene as GameScene
    participant EB as EventBus
    participant HUD as HUD

    Note over WS: 每 60 秒觸發
    WS->>WS: 選擇隨機方向 (上/下/左/右)
    WS->>WS: 讀取 WAVE_DEFS[currentWave]

    loop 每個敵人
        WS->>WS: createEnemy(type, gx, gy)
        WS->>Scene: enemyUnits.push(enemy)
    end

    WS->>EB: emit('waveChanged', waveNumber)
    EB->>HUD: 更新波次顯示
```

---

## 建築與兵種數值表

### 建築

| 建築 | 尺寸 | HP | 成本 | 功能 |
|------|------|-----|------|------|
| Castle | 5×4 | 1000 | — | 主基地，被毀=失敗 |
| Barracks | 3×3 | 500 | 150g | 訓練 Warrior (10s, 75g) |
| Archery | 3×3 | 500 | 175g | 訓練 Archer (12s, 60g) |
| Monastery | 3×3 | 500 | 200g | 訓練 Monk (15s, 80g) |
| Tower | 2×3 | 400 | 125g | 自動射擊 (5格射程, 12傷害, 1.5s) |
| GoldMine | 3×2 | 300 | 100g | 每 5s +25 金幣 |
| House | 2×2 | 200 | 75g | 人口上限 +5 |

### 玩家兵種

| 兵種 | HP | 速度 | 傷害 | 射程 | 冷卻 | 特殊 |
|------|-----|------|------|------|------|------|
| Warrior | 100 | 80 | 15 | 1.2格 | 1.0s | 近戰自動追擊 |
| Archer | 60 | 70 | 10 | 4格 | 1.2s | 箭矢投射物 |
| Monk | 50 | 75 | 0 | 3格 | 2.0s | 自動治療友軍 +15HP |

### 敵方兵種

| 兵種 | HP | 速度 | 傷害 | 特殊 |
|------|-----|------|------|------|
| GoblinTorch | 60 | 60 | 10 | 標準近戰 |
| GoblinBarrel | 150 | 40 | 20 | 高HP慢速坦克 |
| GoblinTNT | 30 | 50 | 80 | 一次性自爆 |

---

## 波次定義

| 波次 | Torch | Barrel | TNT | 總數 |
|------|-------|--------|-----|------|
| 1 | 3 | — | — | 3 |
| 2 | 5 | — | — | 5 |
| 3 | 4 | 2 | — | 6 |
| 4 | 5 | 3 | — | 8 |
| 5 | 4 | 2 | 1 | 7 |
| 6 | 6 | 3 | 2 | 11 |
| 7 | 8 | 4 | — | 12 |
| 8 | 6 | 4 | 3 | 13 |
| 9 | 10 | 5 | 2 | 17 |
| 10 | 12 | 6 | 4 | 22 |

---

## 勝負條件

- **勝利:** 10 波全部生成 + 所有敵人死亡
- **失敗:** Castle HP 降到 0

---

## 測試架構

```mermaid
graph TB
    PW["Playwright"] -->|"page.evaluate()"| API["window.gameAPI"]
    API --> Scene["GameScene"]

    subgraph GameAPI 方法
        Q["查詢: getGameState()"]
        C["命令: selectUnit(), commandMove(), commandAttack()"]
        B["建造: buildStructure(), produceUnit()"]
        T["測試: setGold(), skipToWave(), spawnTestEnemy()"]
    end

    API --> Q
    API --> C
    API --> B
    API --> T

    subgraph 測試模組
        T1["01 遊戲載入"]
        T2["02 單位選取"]
        T3["03 資源收穫"]
        T4["04 建築系統"]
        T5["05 戰鬥機制"]
        T6["06 波次系統"]
        T7["07 勝負條件"]
        T8["08 地圖捲動"]
        T9["09 新建築兵種"]
    end
```

**執行測試:**
```bash
npm run dev          # 啟動 live-server (port 8081)
npm test             # 執行所有 Playwright 測試
```
