# 單位移動與路徑選擇系統

本文件說明遊戲中單位（玩家士兵與敵方哥布林）的移動系統設計。
涵蓋尋路演算法、移動引擎、碰撞處理、敵人 AI 追蹤邏輯。

---

## 1. 總覽：一個移動指令的生命週期

玩家右鍵點擊地圖某處，到士兵抵達目的地，經過以下階段：

```
玩家右鍵點擊
    │
    ▼
CommandSystem.issueMove()          ← 入口：發出移動命令
    │
    ▼
Unit.moveToWithPathfinding(px,py)  ← 轉換像素座標為格子座標
    │
    ▼
Pathfinding.findPath()             ← Theta* 尋路，產生格子路徑
    │
    ▼
Pathfinding.smoothPath()           ← LOS 剪枝，移除多餘路徑點
    │
    ▼
Unit.moveAlongPath()               ← 設定路徑陣列，開始跟隨
    │
    ▼
每幀 Unit.updateMovement()         ← 速度向量驅動，平滑移動
    │
    ▼
抵達目的地 → stopMoving()          ← 清除狀態，回到 IDLE
```

入口程式碼在 `src/systems/CommandSystem.js`：

```js
// src/systems/CommandSystem.js:6-12
issueMove(units, px, py) {
    for (const unit of units) {
        if (!unit.alive) continue;
        unit.moveToWithPathfinding(px, py);
    }
    this.showMoveMarker(px, py);
}
```

---

## 2. 地圖表示：GridSystem

> 原始碼：`src/systems/GridSystem.js`

地圖是一張 40×24 的二維格子（`GRID_COLS=40`, `GRID_ROWS=24`），每格 64×64 像素（`TILE_SIZE=64`）。

### 2.1 座標系統

遊戲中有兩套座標：**格子座標** `(gx, gy)` 與**像素座標** `(px, py)`。
所有尋路在格子座標上運作，所有渲染在像素座標上運作。

```js
// src/systems/GridSystem.js:12-25
gridToPixel(gx, gy) {
    return {
        x: gx * TILE_SIZE + TILE_SIZE / 2,   // 格子中心 x
        y: gy * TILE_SIZE + TILE_SIZE / 2     // 格子中心 y
    };
}

pixelToGrid(px, py) {
    return {
        gx: Math.floor(px / TILE_SIZE),       // 無條件捨去
        gy: Math.floor(py / TILE_SIZE)
    };
}
```

`gridToPixel` 回傳格子**中心點**，`pixelToGrid` 用 `floor` 無條件捨去。
這表示像素 `(128, 192)` 對應格子 `(2, 3)`，而格子 `(2, 3)` 的中心是像素 `(160, 224)`。

### 2.2 佔格與可行走判斷

建築放置時會在格子上標記佔用 ID，值為 0 表示可通行：

```js
// src/systems/GridSystem.js:28-38
occupy(gx, gy, width, height, id) {
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const cx = gx + dx;
            const cy = gy + dy;
            if (this.inBounds(cx, cy)) {
                this.grid[cy][cx] = id;    // 寫入建築 ID
            }
        }
    }
}

// src/systems/GridSystem.js:60-62
isWalkable(gx, gy) {
    return this.inBounds(gx, gy) && this.grid[gy][gx] === 0;
}
```

一個 3×3 的兵營會佔用 9 格，每格的值都是該建築的 ID（如 `"building_3"`）。

### 2.3 視線檢查（Line of Sight）

使用 **Bresenham 直線演算法** 判斷兩格之間是否有直接視線。
這是整套系統的核心查詢，被 Theta* 尋路、路徑剪枝、繞路截斷、追蹤 AI 反覆使用。

```js
// src/systems/GridSystem.js:65-80
hasLineOfSight(gx1, gy1, gx2, gy2) {
    const dx = Math.abs(gx2 - gx1);
    const dy = Math.abs(gy2 - gy1);
    const sx = gx1 < gx2 ? 1 : -1;
    const sy = gy1 < gy2 ? 1 : -1;
    let err = dx - dy;
    let x = gx1, y = gy1;

    while (x !== gx2 || y !== gy2) {
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
        // 只檢查中間格，不檢查起點和終點
        if ((x !== gx2 || y !== gy2) && !this.isWalkable(x, y)) return false;
    }
    return true;
}
```

注意：**起點和終點不檢查**，只檢查中間經過的格子。
這是刻意設計——單位可能站在起點（已佔用）或目標是建築格子（不可行走）。

---

## 3. 尋路演算法：Theta*

> 原始碼：`src/utils/Pathfinding.js`

### 3.1 為什麼選 Theta*

| 演算法 | 路徑品質 | 複雜度 | 適用場景 |
|--------|---------|--------|---------|
| A* | 45°/90° 鋸齒路徑 | 低 | 簡單格子遊戲 |
| **Theta*** | **任意角度平滑路徑** | **中** | **本專案 40×24 地圖** |
| JPS | 同 A*（需後處理） | 中 | 大型開放地圖 |
| Flow Field | 適合大量單位 | 高 | 千人 RTS |

Theta* 是 A* 的變體，在搜尋過程中就產生任意角度路徑。
對 40×24 的小地圖來說，效能差異可忽略，但路徑品質顯著提升。

### 3.2 Theta* 核心概念

標準 A* 只能沿格子邊走，路徑是鋸齒狀。Theta* 的關鍵改進：
**展開鄰居時，嘗試跳過 parent，直接連接 grandparent**。

```
A* 路徑:                     Theta* 路徑:
  S → → → ↘                    S
  ·   ·   · ↘                    ↘
  ·   ·   ·   E                    → → E
  （沿格子走，5 步）              （直線，更短）
```

核心邏輯在 `findPath()` 的鄰居展開中：

```js
// src/utils/Pathfinding.js:129-162
// 取得 current 的 parent
const parentKey = cameFrom.get(ck);
const parent = parentKey !== undefined ? parentPos.get(parentKey) : null;

for (const dir of DIRS) {
    const nx = current.x + dir.dx;
    const ny = current.y + dir.dy;
    // ... 邊界與可行走檢查 ...

    let tentativeG, fromKey;

    // Theta*：如果 parent → neighbor 有視線，跳過 current
    if (parent && gridSystem.hasLineOfSight(parent.x, parent.y, nx, ny)) {
        const parentG = gScore.get(parentKey);
        tentativeG = parentG + euclideanDist(parent.x, parent.y, nx, ny);
        fromKey = parentKey;    // 鄰居的 parent 設為 grandparent
    } else {
        // 退回標準 A*：經過 current
        tentativeG = currentG + dir.cost;
        fromKey = ck;
    }
}
```

當 `parent → neighbor` 有視線時，鄰居直接連到 grandparent，產生更短的任意角度路徑。

### 3.3 8 方向移動與對角阻擋

支援 8 方向移動（N, NE, E, SE, S, SW, W, NW），對角線成本 1.41（≈√2）：

```js
// src/utils/Pathfinding.js:4-13
const DIRS = [
    { dx: 0, dy: -1, cost: 1 },    // N
    { dx: 1, dy: -1, cost: 1.41 },  // NE
    { dx: 1, dy: 0, cost: 1 },      // E
    // ... 共 8 方向
];
```

**對角阻擋規則**：走 NE 時，N 和 E 都必須可行走，否則不允許。
防止單位穿過兩面牆的交角縫隙：

```js
// src/utils/Pathfinding.js:143-149
if (dir.dx !== 0 && dir.dy !== 0) {
    if (!gridSystem.isWalkable(current.x + dir.dx, current.y) ||
        !gridSystem.isWalkable(current.x, current.y + dir.dy)) {
        continue;  // 不允許穿過對角縫隙
    }
}
```

```
  ██          走 NE？
  · → ?       只有 N(空) 和 E(空) 都通過才允許
  ██          如果 N 是牆或 E 是牆 → 禁止
```

### 3.4 目標不可行走時的處理

當玩家點擊建築或被佔用的格子時，目標不可行走。
`findPath` 會自動找到最近的可行走格子：

```js
// src/utils/Pathfinding.js:94-100
if (!gridSystem.isWalkable(ex, ey)) {
    const nearest = findNearestWalkable(gridSystem, ex, ey);
    if (!nearest) return null;
    ex = nearest.gx;
    ey = nearest.gy;
}
```

`findNearestWalkable` 從目標向外做 BFS，一圈一圈擴大搜尋直到找到可行走格子：

```js
// src/utils/Pathfinding.js:222-237
function findNearestWalkable(gridSystem, gx, gy) {
    for (let r = 1; r < Math.max(GRID_COLS, GRID_ROWS); r++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // 只掃外圈
                const nx = gx + dx;
                const ny = gy + dy;
                if (gridSystem.isWalkable(nx, ny)) {
                    return { gx: nx, gy: ny };
                }
            }
        }
    }
    return null;
}
```

### 3.5 smoothPath 後處理

Theta* 產生的路徑已經比 A* 平滑，但仍可能有多餘的中間路徑點。
`smoothPath` 做貪心剪枝：從每個路徑點出發，找最遠有視線的點，跳過中間所有點。

```js
// src/utils/Pathfinding.js:200-220
export function smoothPath(gridSystem, path) {
    if (!path || path.length <= 2) return path;

    const result = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
        // 從最遠的點開始檢查，找到第一個有視線的就跳過去
        let farthest = current + 1;
        for (let i = path.length - 1; i > current + 1; i--) {
            if (gridSystem.hasLineOfSight(
                path[current].gx, path[current].gy,
                path[i].gx, path[i].gy
            )) {
                farthest = i;
                break;
            }
        }
        result.push(path[farthest]);
        current = farthest;
    }

    return result;
}
```

效果範例：

```
Theta* 原始路徑: A → B → C → D → E    (5 個路徑點)
smoothPath 後:   A → → → → → → → E    (2 個路徑點，A 對 E 有直接視線)
```

兩者在 `moveToWithPathfinding` 中串接使用：

```js
// src/entities/Unit.js:114-128
moveToWithPathfinding(px, py) {
    const start = this.getGridPos();
    const end = this.gridSystem.pixelToGrid(px, py);
    const path = findPath(this.gridSystem, start.gx, start.gy, end.gx, end.gy);

    if (path && path.length > 0) {
        this.moveAlongPath(smoothPath(this.gridSystem, path));  // 先尋路，再剪枝
    } else if (path && path.length === 0) {
        this.stopMoving();         // 已在目的地
    } else {
        this.moveTo(px, py);       // 無路徑，fallback 直線
    }
}
```

---

## 4. 移動引擎：Velocity-based Steering

> 原始碼：`src/entities/Unit.js` — `updateMovement()`

### 4.1 為什麼用速度向量

直接設定位置（`sprite.x = targetX`）會導致：
- 轉彎銳角突變（瞬間改變方向）
- 追蹤目標時抖動（每幀重新對準方向）
- 到達目的地急停（沒有減速過程）

速度向量系統讓方向和速率都是**逐漸改變**的，產生自然的移動感。

### 4.2 核心運算

每幀的 `updateMovement(delta)` 做四件事：

**1. 計算期望速度（desired velocity）**

```js
// src/entities/Unit.js:188-200
const nx = dx / dist;                     // 朝向目標的單位向量
const ny = dy / dist;

const desiredVx = nx * desiredSpeed;       // 期望速度 = 方向 × 速率
const desiredVy = ny * desiredSpeed;
```

**2. 平滑轉向（smooth steering）**

不直接採用期望速度，而是用 lerp 逐漸靠近：

```js
// src/entities/Unit.js:202-205
const lerpFactor = Math.min(1, this.turnRate * dt);
this.vx += (desiredVx - this.vx) * lerpFactor;   // 當前速度漸變到期望速度
this.vy += (desiredVy - this.vy) * lerpFactor;
```

`turnRate = 8` 表示每秒可以大幅度調整方向。
`lerpFactor` 在 60fps 下約 0.13，表示每幀修正 13% 的速度差。

**3. 更新位置**

```js
// src/entities/Unit.js:207-208
const newX = this.sprite.x + this.vx * dt;
const newY = this.sprite.y + this.vy * dt;
```

**4. 碰撞檢測**（見第 5 節）

### 4.3 Arrive 行為：到達減速

只在最終目的地附近減速，中間路徑點全速通過。
這讓單位在巡航時流暢，到達時自然停下：

```js
// src/entities/Unit.js:192-197
const isFinalTarget = this.path.length === 0 || this.pathIndex >= this.path.length - 1;
let desiredSpeed = this.speed;
if (isFinalTarget && dist < this.slowRadius) {          // slowRadius = 32px
    desiredSpeed = this.speed * (dist / this.slowRadius); // 線性減速
}
```

```
速度
  │  ████████████████████──────.
  │                             ╲
  │                              ╲
  │                               ·
  └─────────────────────────────────→ 距離目標
                            ↑
                        slowRadius (32px)
```

### 4.4 路徑點推進

到達路徑點的判定是 `dist < 2px`，此時吸附到路徑點並推進到下一個：

```js
// src/entities/Unit.js:172-186
if (dist < 2) {
    this.sprite.x = this.targetX;     // 吸附到路徑點
    this.sprite.y = this.targetY;
    this.vx = 0;
    this.vy = 0;

    if (this.path.length > 0) {
        this.pathIndex++;
        this._advanceToNextPathPoint();  // 設定下一個路徑點為目標
    } else {
        this.stopMoving();               // 路徑結束
    }
    return;
}
```

---

## 5. 碰撞與繞路

> 原始碼：`src/entities/Unit.js` — `updateMovement()`, `_detourAroundObstacle()`

### 5.1 即時碰撞檢測（Wall Sliding）

每幀更新位置後，檢查新位置是否進入不可行走的格子。
如果撞牆，**拆開 X/Y 軸分別判定**——撞牆的軸歸零，另一軸繼續移動，讓單位沿牆面滑過角落：

```js
// src/entities/Unit.js:210-236
const newGrid = this.gridSystem.pixelToGrid(newX, newY);
if (!this.gridSystem.isWalkable(newGrid.gx, newGrid.gy)) {
    // Wall sliding: 拆開 X/Y 軸
    const xGrid = this.gridSystem.pixelToGrid(newX, this.sprite.y);
    const yGrid = this.gridSystem.pixelToGrid(this.sprite.x, newY);
    const canX = this.gridSystem.isWalkable(xGrid.gx, xGrid.gy);
    const canY = this.gridSystem.isWalkable(yGrid.gx, yGrid.gy);

    if (canX || canY) {
        if (canX) { this.sprite.x = newX; } else { this.vx = 0; }
        if (canY) { this.sprite.y = newY; } else { this.vy = 0; }
    } else {
        // 兩軸都被擋住
        this.vx = 0;
        this.vy = 0;
        if (this.path.length === 0) {
            this._detourAroundObstacle();
        } else {
            this.stopMoving();
        }
        return;
    }
} else {
    this.sprite.x = newX;
    this.sprite.y = newY;
}
```

```
修改前：切角衝進建築格 → 完全停止 → 等 300ms 重算 → 反覆卡頓
修改後：切角 → Y 軸撞牆歸零，X 軸繼續 → 沿牆面滑過角落
```

只有兩軸都被擋住時才觸發 `_detourAroundObstacle()`（直線移動）或 `stopMoving()`（路徑移動）。

### 5.2 繞路策略：路徑截斷

`_detourAroundObstacle()` 不是盲目重算完整路徑，而是計算完整路徑後**截斷**——
只保留到「第一個對終點有視線的路徑點」為止，之後改回直線前進：

```js
// src/entities/Unit.js:259-279
_detourAroundObstacle() {
    const start = this.getGridPos();
    const end = this.gridSystem.pixelToGrid(this.finalTargetX, this.finalTargetY);
    const fullPath = findPath(this.gridSystem, start.gx, start.gy, end.gx, end.gy);

    if (!fullPath || fullPath.length === 0) {
        this.stopMoving();
        return;
    }

    // 截斷：找到第一個對終點有視線的路徑點就停
    let truncated = fullPath;
    for (let i = 0; i < fullPath.length; i++) {
        if (this.gridSystem.hasLineOfSight(fullPath[i].gx, fullPath[i].gy, end.gx, end.gy)) {
            truncated = fullPath.slice(0, i + 1);
            break;
        }
    }

    this.moveAlongPath(truncated);
}
```

```
單位 → → → ██ （撞到建築）
             ↓  _detourAroundObstacle()
單位 → ↗ B ██   B 有視線到終點
         ↘ → → → 終點   之後直線前進
```

這避免了走完整條 A* 路徑的浪費——只需要繞過障礙就好。

---

## 6. 敵人 AI：chaseTarget() 統一追蹤

> 原始碼：`src/entities/Unit.js` — `chaseTarget()`

### 6.1 設計目標

所有單位（玩家和敵人）的追蹤邏輯統一在 `chaseTarget()` 中。
子類（如 GoblinTorch）只需要：

```js
// src/entities/GoblinTorch.js:70-76
if (this.attackTarget && this.attackTarget.alive) {
    const result = this.chaseTarget(time, this.attackTarget);
    if (result === 'attacking') {
        this.playAnim('attack');
        this.performAttack(time);
    }
    return;
}
```

提供目標，取得狀態（`'attacking'` / `'chasing'` / `'idle'`），根據狀態決定動畫和攻擊。

### 6.2 四層決策

`chaseTarget()` 根據目標類型和距離採用不同策略：

```
                        ┌─────────────────────────────────────────┐
                        │            目標                          │
                        └─────────────────────────────────────────┘
                         ▲          ▲              ▲              ▲
                         │          │              │              │
距離 ≤ range       ──► 攻擊     │              │              │
                                 │              │              │
建築 + < 1 tile    ─────► 貼邊直走       │              │
                                              │              │
單位 + < 5 tiles + LOS ──────► Seek 直追      │
                                                           │
其他               ────────────────────────► Pathfinding
```

攻擊範圍因目標類型不同：建築 = 10px（幾乎貼到邊緣），單位 = `attackRange * TILE_SIZE`：

```js
// src/entities/Unit.js:412
const range = isBuilding ? 10 : this.attackRange * TILE_SIZE;
```

**層 1：攻擊範圍內 → 停下攻擊**

```js
// src/entities/Unit.js:414-430
if (dist <= range) {
    if (this.state !== UnitState.ATTACKING) {
        this.state = UnitState.ATTACKING;
        this.path = [];
        this.vx = 0;
        this.vy = 0;
    }
    return 'attacking';
}
```

**層 2：建築近距離 → 直接貼邊移動**

Pathfinding 只能定位到格子中心（距邊緣 32px），無法滿足建築 10px 的攻擊範圍。
當距離 < 1 格時，改用 direct movement 走向邊緣像素點，繞過格子精度限制：

```js
// src/entities/Unit.js:432-444
if (isBuilding && dist < TILE_SIZE) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.finalTargetX = targetX;
    this.finalTargetY = targetY;
    this.path = [];
    if (this.state !== UnitState.MOVING) {
        this.state = UnitState.MOVING;
        this.playAnim('run');
    }
    return 'chasing';
}
```

**層 3：單位近距離 + 有視線 → 直接 Seek**

不用尋路，直接把目標像素座標設為移動目標。每幀更新目標位置，實現平滑追蹤：

```js
// src/entities/Unit.js:446-467
if (!isBuilding) {
    const seekThreshold = 5 * TILE_SIZE;
    if (dist < seekThreshold && target.sprite) {
        const start = this.getGridPos();
        const end = this.gridSystem.pixelToGrid(targetX, targetY);
        if (this.gridSystem.hasLineOfSight(start.gx, start.gy, end.gx, end.gy)) {
            this.targetX = targetX;
            this.targetY = targetY;
            this.finalTargetX = targetX;
            this.finalTargetY = targetY;
            this.path = [];
            if (this.state !== UnitState.MOVING) {
                this.state = UnitState.MOVING;
                this.playAnim('run');
            }
            return 'chasing';
        }
    }
}
```

**層 4：遠距離或無視線 → Pathfinding + 節流**

```js
// src/entities/Unit.js:469-474
if (this.state !== UnitState.MOVING && this.canRepath(time)) {
    this.lastRepathTime = time;
    this.moveToWithPathfinding(targetX, targetY);
}
return 'chasing';
```

### 6.3 建築目標的特殊處理

建築是多格物體（兵營 3×3、城堡 5×3），需要特殊處理四個問題：

**問題 1：距離計算**

如果用到建築中心的距離，單位站在建築旁邊（距中心 96px）卻超出攻擊範圍。
改為計算到建築**矩形邊緣最近點**的距離：

```js
// src/entities/Unit.js:390-406
if (isBuilding) {
    const bx = target.gx * TILE_SIZE;
    const by = target.gy * TILE_SIZE;
    const bw = target.gridW * TILE_SIZE;
    const bh = target.gridH * TILE_SIZE;
    targetX = Math.max(bx, Math.min(this.sprite.x, bx + bw));   // 邊緣最近 x
    targetY = Math.max(by, Math.min(this.sprite.y, by + bh));   // 邊緣最近 y
    dist = this.distanceToPoint(targetX, targetY);
}
```

```
                 ┌───────────┐
                 │           │
    Unit ·─ ─ ─ ★           │   ★ = 邊緣最近點（targetX, targetY）
                 │  Building │   距離 = Unit 到 ★ 的距離
                 │           │
                 └───────────┘
```

**問題 2：攻擊範圍**

建築使用固定 10px 的攻擊範圍（而非單位的 `attackRange * TILE_SIZE`），
讓敵人必須幾乎貼到建築格子邊緣才能攻擊，避免在隔壁格子就開始攻擊。

**問題 3：貼邊移動（最後一格的精度問題）**

Pathfinding 只能定位到格子中心（距邊緣 32px），但建築攻擊範圍只有 10px。
中間 22px 的差距用 direct movement 補上——當距離 < 1 格時直接走向邊緣像素點（見層 2）。

**問題 4：跳過 LOS Seek**

建築格子不可行走，`hasLineOfSight` 到建築中心一定失敗。
因此建築目標跳過 Seek 層，改用層 2 的貼邊直走（近距離）或層 4 的 Pathfinding（遠距離）。

### 6.4 重算節流

追蹤移動目標時不能每幀重算路徑（太耗效能），但也不能完全不重算（目標會移動）。
用 `repathInterval = 300ms` 控制最小重算間隔：

```js
// src/entities/Unit.js:374-376
canRepath(time) {
    return time - this.lastRepathTime >= this.repathInterval;
}
```

搭配 `this.state !== UnitState.MOVING` 條件——只有在 IDLE 狀態（上一段移動結束）才重算，
避免在移動中途打斷路徑。

### 6.5 建築類型判定

因為不同建築子類有不同的 `type`（`'castle'`, `'barracks'`, `'archery'` 等），
用一個明確的清單判斷是否為建築：

```js
// src/entities/Unit.js:386-387
const BUILDING_TYPES = ['building', 'castle', 'barracks', 'house', 'tower', 'monastery', 'goldmine', 'archery'];
const isBuilding = BUILDING_TYPES.includes(target.type);
```

---

## 7. 關鍵參數速查表

| 參數 | 位置 | 預設值 | 說明 |
|------|------|--------|------|
| `TILE_SIZE` | `gameConfig.js` | `64` | 每格像素大小 |
| `GRID_COLS × GRID_ROWS` | `gameConfig.js` | `40 × 24` | 地圖格子數 |
| `speed` | 各單位 constructor | 40-80 | 移動速率（px/s） |
| `turnRate` | `Unit.js:48` | `8` | 轉向速率，越大方向改變越快 |
| `slowRadius` | `Unit.js:49` | `32` | 最終目標減速距離（px） |
| `repathInterval` | `Unit.js:42` | `300` | 重算路徑最小間隔（ms） |
| `attackRange`（單位） | 各單位 constructor | 1.2-5 | 攻擊範圍（格數，乘 TILE_SIZE 換算像素） |
| `attackRange`（建築） | `Unit.js:412` | `10` | 建築攻擊範圍（固定 px），幾乎貼到邊緣 |
| 建築貼邊閾值 | `Unit.js:432` | `TILE_SIZE` (64) | 距建築邊緣低於此距離改用 direct movement |
| Seek 閾值 | `Unit.js:446` | `5 * TILE_SIZE` | 低於此距離且有 LOS 用 Seek 直追（僅限單位目標） |
| 路徑點到達距離 | `Unit.js:172` | `2` | 低於此像素距離視為到達路徑點 |
| 對角線成本 | `Pathfinding.js:6-12` | `1.41` | ≈√2，正交為 1 |
