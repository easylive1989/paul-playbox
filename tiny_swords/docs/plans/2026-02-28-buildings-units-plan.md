# 新建築與兵種 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增 4 種建築 (Tower, Archery, House, Monastery) 和 2 種玩家兵種 (Archer, Monk)，並引入人口系統。

**Architecture:** 遵循現有模式 — 每個建築/單位是獨立 ES Module class，繼承 Building/Unit 基類。所有常數集中在 gameConfig.js，資源在 assetManifest.js 註冊。BuildMenu 和 BuildSystem 擴展以支援新建築類型。人口系統整合到 ResourceSystem。

**Tech Stack:** Phaser 3, JavaScript ES Modules, Playwright (E2E 測試)

---

### Task 1: 新增常數到 gameConfig.js

**Files:**
- Modify: `src/config/gameConfig.js`

**Step 1: 新增建築常數**

在 `gameConfig.js` 的建築屬性區塊後加入：

```javascript
// Tower
export const TOWER_COST = 125;
export const TOWER_HP = 400;
export const TOWER_ATTACK_RANGE = 5;      // tiles
export const TOWER_DAMAGE = 12;
export const TOWER_COOLDOWN = 1500;        // ms

// Archery
export const ARCHERY_COST = 175;
export const ARCHERY_HP = 500;

// House
export const HOUSE_COST = 75;
export const HOUSE_HP = 200;
export const HOUSE_POP_BONUS = 5;

// Monastery
export const MONASTERY_COST = 200;
export const MONASTERY_HP = 500;
```

**Step 2: 新增兵種常數**

```javascript
// Archer
export const ARCHER_COST = 60;
export const ARCHER_HP = 60;
export const ARCHER_SPEED = 70;
export const ARCHER_DAMAGE = 10;
export const ARCHER_ATTACK_RANGE = 4;      // tiles (遠程)
export const ARCHER_COOLDOWN = 1200;       // ms
export const ARCHER_PRODUCE_TIME = 12000;  // ms

// Monk
export const MONK_COST = 80;
export const MONK_HP = 50;
export const MONK_SPEED = 75;
export const MONK_HEAL_AMOUNT = 15;
export const MONK_HEAL_RANGE = 3;          // tiles
export const MONK_HEAL_COOLDOWN = 2000;    // ms
export const MONK_PRODUCE_TIME = 15000;    // ms
```

**Step 3: 新增人口系統常數**

```javascript
// Population
export const STARTING_POP_CAP = 10;
```

**Step 4: Commit**

```bash
git add src/config/gameConfig.js
git commit -m "feat: add constants for new buildings, units and population system"
```

---

### Task 2: 新增素材到 assetManifest.js

**Files:**
- Modify: `src/config/assetManifest.js`

**Step 1: 新增建築圖片**

在 `images` 陣列中加入：

```javascript
{ key: 'tower',              path: `${BLUE_BUILDINGS}/Tower.png` },
{ key: 'archery',            path: `${BLUE_BUILDINGS}/Archery.png` },
{ key: 'house',              path: `${BLUE_BUILDINGS}/House1.png` },
{ key: 'monastery',          path: `${BLUE_BUILDINGS}/Monastery.png` },
```

注意：需確認 `BLUE_BUILDINGS` 常數路徑是否已定義，應為 `assets/Buildings/Blue Buildings`。

**Step 2: 新增 Archer 精靈表**

在 `spritesheets` 陣列中加入：

```javascript
{ key: 'archer_idle',   path: `${UNITS_BLUE}/Archer/Archer_Idle.png`,   frameWidth: 192, frameHeight: 192 },
{ key: 'archer_run',    path: `${UNITS_BLUE}/Archer/Archer_Run.png`,    frameWidth: 192, frameHeight: 192 },
{ key: 'archer_shoot',  path: `${UNITS_BLUE}/Archer/Archer_Shoot.png`,  frameWidth: 192, frameHeight: 192 },
```

**Step 3: 新增 Arrow 投射物圖片**

在 `images` 陣列中加入：

```javascript
{ key: 'arrow',              path: `${UNITS_BLUE}/Archer/Arrow.png` },
```

**Step 4: 新增 Monk 精靈表**

在 `spritesheets` 陣列中加入：

```javascript
{ key: 'monk_idle',   path: `${UNITS_BLUE}/Monk/Idle.png`,          frameWidth: 192, frameHeight: 192 },
{ key: 'monk_run',    path: `${UNITS_BLUE}/Monk/Run.png`,           frameWidth: 192, frameHeight: 192 },
{ key: 'monk_heal',   path: `${UNITS_BLUE}/Monk/Heal.png`,          frameWidth: 192, frameHeight: 192 },
```

**Step 5: 驗證素材路徑**

在瀏覽器中啟動遊戲，確認 console 無載入錯誤。

**Step 6: Commit**

```bash
git add src/config/assetManifest.js
git commit -m "feat: add asset definitions for new buildings and units"
```

---

### Task 3: 人口系統 — ResourceSystem + HUD

**Files:**
- Modify: `src/systems/ResourceSystem.js`
- Modify: `src/ui/HUD.js`
- Modify: `src/scenes/GameScene.js`

**Step 1: 擴展 ResourceSystem**

在 ResourceSystem 中加入人口追蹤：

```javascript
import { STARTING_GOLD, STARTING_POP_CAP } from '../config/gameConfig.js';

export default class ResourceSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.gold = STARTING_GOLD;
        this.popCap = STARTING_POP_CAP;
        this.popUsed = 0;
    }

    // 新增方法
    getPopCap() { return this.popCap; }
    getPopUsed() { return this.popUsed; }

    addPopCap(amount) {
        this.popCap += amount;
        this.eventBus.emit('popChanged', this.popUsed, this.popCap);
    }

    removePopCap(amount) {
        this.popCap = Math.max(0, this.popCap - amount);
        this.eventBus.emit('popChanged', this.popUsed, this.popCap);
    }

    usePopulation(amount) {
        if (this.popUsed + amount > this.popCap) return false;
        this.popUsed += amount;
        this.eventBus.emit('popChanged', this.popUsed, this.popCap);
        return true;
    }

    freePopulation(amount) {
        this.popUsed = Math.max(0, this.popUsed - amount);
        this.eventBus.emit('popChanged', this.popUsed, this.popCap);
    }

    canAffordPop(amount) {
        return this.popUsed + amount <= this.popCap;
    }
}
```

**Step 2: 在 HUD 中顯示人口**

在 HUD 的金幣顯示旁邊，加入人口顯示文字：

```javascript
// 在 create 方法中，金幣文字右邊
this.popText = scene.add.text(goldTextX + 120, goldTextY, '0/10', style)
    .setDepth(1001);

// 監聽事件
scene.eventBus.on('popChanged', (used, cap) => {
    this.popText.setText(`${used}/${cap}`);
});
```

**Step 3: 在 GameScene 中，當玩家單位死亡時釋放人口**

在 `GameScene.update()` 的死亡單位清理邏輯中，呼叫 `freePopulation(1)`：

```javascript
// 清理死亡的玩家單位時
const beforeCount = this.playerUnits.length;
this.playerUnits = this.playerUnits.filter(u => u.alive);
const deadCount = beforeCount - this.playerUnits.length;
if (deadCount > 0) {
    this.resourceSystem.freePopulation(deadCount);
}
```

**Step 4: 驗證** — 啟動遊戲，確認 HUD 顯示人口 `0/10`。

**Step 5: Commit**

```bash
git add src/systems/ResourceSystem.js src/ui/HUD.js src/scenes/GameScene.js
git commit -m "feat: add population system with HUD display"
```

---

### Task 4: Archer 弓箭手單位

**Files:**
- Create: `src/entities/Archer.js`

**Step 1: 實作 Archer 類別**

參照 Warrior.js 模式，但使用遠程攻擊（發射箭矢投射物）：

```javascript
import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import {
    ARCHER_HP, ARCHER_SPEED, ARCHER_DAMAGE,
    ARCHER_ATTACK_RANGE, ARCHER_COOLDOWN, TILE_SIZE
} from '../config/gameConfig.js';

export default class Archer extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'archer_idle', {
            hp: ARCHER_HP,
            speed: ARCHER_SPEED,
            attackDamage: ARCHER_DAMAGE,
            attackRange: ARCHER_ATTACK_RANGE,
            attackCooldown: ARCHER_COOLDOWN,
            faction: 'player',
            type: 'archer',
            frameSize: 192
        });
        this.initAnims();
        this.playAnim('idle');
    }

    initAnims() {
        createAnim(this.scene, 'archer_idle_anim', 'archer_idle', 0, 5, 8);
        createAnim(this.scene, 'archer_run_anim', 'archer_run', 0, 5, 10);
        createAnim(this.scene, 'archer_shoot_anim', 'archer_shoot', 0, 5, 8, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'archer_idle_anim',
            run: 'archer_run_anim',
            attack: 'archer_shoot_anim'
        };
        const animKey = map[name];
        if (animKey && this.sprite && this.sprite.anims) {
            this.sprite.play(animKey, true);
        }
    }

    update(time, delta) {
        if (!this.alive) return;

        if (this.attackTarget && this.attackTarget.alive && this.attackTarget.sprite) {
            const dist = this.distanceTo(this.attackTarget);
            const range = this.attackRange * TILE_SIZE;
            if (dist <= range) {
                if (this.state !== UnitState.ATTACKING) {
                    this.state = UnitState.ATTACKING;
                    this.playAnim('attack');
                    this.path = [];
                }
                this.performAttack(time);
            } else {
                if (this.state !== UnitState.MOVING) {
                    this.moveTo(this.attackTarget.sprite.x, this.attackTarget.sprite.y);
                }
            }
        } else if (this.attackTarget || this.state === UnitState.ATTACKING) {
            this.attackTarget = null;
            this.stopMoving();
        }

        if (this.state === UnitState.IDLE && !this.attackTarget) {
            this.scanForEnemies();
        }

        super.update(time, delta);
    }

    performAttack(time) {
        if (time - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = time;
        if (this.attackTarget && this.attackTarget.alive) {
            // 面朝目標
            if (this.attackTarget.sprite.x < this.sprite.x) {
                this.sprite.setFlipX(true);
            } else {
                this.sprite.setFlipX(false);
            }
            // 發射箭矢投射物
            this.fireArrow(this.attackTarget);
        }
    }

    fireArrow(target) {
        const arrow = this.scene.add.image(this.sprite.x, this.sprite.y - 10, 'arrow');
        arrow.setScale(0.3);
        arrow.setDepth(this.sprite.y);

        // 計算角度
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            target.sprite.x, target.sprite.y
        );
        arrow.setRotation(angle);

        // Tween 移動箭矢到目標位置
        this.scene.tweens.add({
            targets: arrow,
            x: target.sprite.x,
            y: target.sprite.y,
            duration: 300,
            onComplete: () => {
                arrow.destroy();
                if (target.alive) {
                    target.takeDamage(this.attackDamage);
                    if (!target.alive) {
                        this.attackTarget = null;
                        this.stopMoving();
                    }
                }
            }
        });
    }

    scanForEnemies() {
        const detectRange = 5 * TILE_SIZE;
        let closest = null;
        let closestDist = Infinity;
        for (const enemy of this.scene.enemyUnits) {
            if (!enemy.alive) continue;
            const dist = this.distanceTo(enemy);
            if (dist < detectRange && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }
        if (closest) {
            this.attackTarget = closest;
        }
    }
}
```

**Step 2: 驗證動畫幀數**

需要先確認 Archer 精靈表的實際幀數（Idle/Run/Shoot 各有幾幀），可能需要在實作時調整 `createAnim` 的 startFrame/endFrame。

**Step 3: Commit**

```bash
git add src/entities/Archer.js
git commit -m "feat: add Archer ranged unit with arrow projectile"
```

---

### Task 5: Monk 僧侶單位

**Files:**
- Create: `src/entities/Monk.js`

**Step 1: 實作 Monk 類別**

Monk 是治療單位，不攻擊敵人，而是自動尋找受傷的友軍單位治療：

```javascript
import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import {
    MONK_HP, MONK_SPEED, MONK_HEAL_AMOUNT,
    MONK_HEAL_RANGE, MONK_HEAL_COOLDOWN, TILE_SIZE
} from '../config/gameConfig.js';

const HEAL_STATE = 'healing';

export default class Monk extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'monk_idle', {
            hp: MONK_HP,
            speed: MONK_SPEED,
            attackDamage: 0,
            attackRange: MONK_HEAL_RANGE,
            attackCooldown: MONK_HEAL_COOLDOWN,
            faction: 'player',
            type: 'monk',
            frameSize: 192
        });
        this.healTarget = null;
        this.initAnims();
        this.playAnim('idle');
    }

    initAnims() {
        createAnim(this.scene, 'monk_idle_anim', 'monk_idle', 0, 5, 8);
        createAnim(this.scene, 'monk_run_anim', 'monk_run', 0, 5, 10);
        createAnim(this.scene, 'monk_heal_anim', 'monk_heal', 0, 5, 8, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'monk_idle_anim',
            run: 'monk_run_anim',
            heal: 'monk_heal_anim'
        };
        const animKey = map[name];
        if (animKey && this.sprite && this.sprite.anims) {
            this.sprite.play(animKey, true);
        }
    }

    update(time, delta) {
        if (!this.alive) return;

        // 如果有治療目標
        if (this.healTarget) {
            // 目標已滿血或死亡 → 清除
            if (!this.healTarget.alive || this.healTarget.hp >= this.healTarget.maxHp) {
                this.healTarget = null;
                this.stopMoving();
            } else {
                const dist = this.distanceTo(this.healTarget);
                const range = this.attackRange * TILE_SIZE;
                if (dist <= range) {
                    if (this.state !== HEAL_STATE) {
                        this.state = HEAL_STATE;
                        this.playAnim('heal');
                        this.path = [];
                    }
                    this.performHeal(time);
                } else {
                    if (this.state !== UnitState.MOVING) {
                        this.moveTo(this.healTarget.sprite.x, this.healTarget.sprite.y);
                    }
                }
            }
        }

        // 空閒時自動掃描受傷友軍
        if ((this.state === UnitState.IDLE || !this.healTarget) && this.state !== UnitState.MOVING) {
            this.scanForInjured();
        }

        // 手動移動指令 — 正常移動邏輯
        if (this.state === UnitState.MOVING) {
            this.updateMovement(delta);
            if (this.sprite) this.sprite.setDepth(this.sprite.y);
            if (this.selectionCircle) {
                this.selectionCircle.setPosition(this.sprite.x, this.sprite.y);
                this.selectionCircle.setDepth(this.sprite.y - 1);
            }
            if (this.healthBar) this.healthBar.update();
            return; // 跳過 super.update 避免重複
        }

        super.update(time, delta);
    }

    performHeal(time) {
        if (time - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = time;

        if (this.healTarget && this.healTarget.alive && this.healTarget.hp < this.healTarget.maxHp) {
            this.healTarget.hp = Math.min(this.healTarget.maxHp, this.healTarget.hp + MONK_HEAL_AMOUNT);
            if (this.healTarget.healthBar) this.healTarget.healthBar.update();

            // 治療滿了就換下一個
            if (this.healTarget.hp >= this.healTarget.maxHp) {
                this.healTarget = null;
                this.stopMoving();
            }
        }
    }

    scanForInjured() {
        const detectRange = 6 * TILE_SIZE;
        let mostInjured = null;
        let lowestHpRatio = 1;

        for (const unit of this.scene.playerUnits) {
            if (!unit.alive || unit === this) continue;
            if (unit.hp >= unit.maxHp) continue;
            const dist = this.distanceTo(unit);
            if (dist > detectRange) continue;
            const ratio = unit.hp / unit.maxHp;
            if (ratio < lowestHpRatio) {
                lowestHpRatio = ratio;
                mostInjured = unit;
            }
        }

        if (mostInjured) {
            this.healTarget = mostInjured;
        }
    }
}
```

**Step 2: 驗證動畫幀數**

同 Archer，需確認 Monk 精靈表的實際幀數。

**Step 3: Commit**

```bash
git add src/entities/Monk.js
git commit -m "feat: add Monk healer unit with auto-heal AI"
```

---

### Task 6: House 房屋建築

**Files:**
- Create: `src/entities/House.js`

**Step 1: 實作 House 類別**

House 是最簡單的建築 — 建造時增加人口上限，被摧毀時減少：

```javascript
import Building from './Building.js';
import { HOUSE_HP, HOUSE_POP_BONUS, HOUSE_COST } from '../config/gameConfig.js';

export default class House extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 2, 2, 'house', HOUSE_HP);
        this.type = 'house';
        this.faction = 'player';

        // 建造時增加人口上限
        if (scene.resourceSystem) {
            scene.resourceSystem.addPopCap(HOUSE_POP_BONUS);
        }
    }

    static get cost() { return HOUSE_COST; }

    onDestroyed() {
        // 被摧毀時減少人口上限
        if (this.scene.resourceSystem) {
            this.scene.resourceSystem.removePopCap(HOUSE_POP_BONUS);
        }
        super.onDestroyed();
    }
}
```

**Step 2: Commit**

```bash
git add src/entities/House.js
git commit -m "feat: add House building with population cap bonus"
```

---

### Task 7: Tower 防禦塔建築

**Files:**
- Create: `src/entities/Tower.js`

**Step 1: 實作 Tower 類別**

Tower 自動偵測範圍內敵人並發射箭矢：

```javascript
import Building from './Building.js';
import {
    TOWER_HP, TOWER_COST, TOWER_ATTACK_RANGE,
    TOWER_DAMAGE, TOWER_COOLDOWN, TILE_SIZE
} from '../config/gameConfig.js';

export default class Tower extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 2, 3, 'tower', TOWER_HP);
        this.type = 'tower';
        this.faction = 'player';
        this.lastAttackTime = 0;
        this.attackTarget = null;
    }

    static get cost() { return TOWER_COST; }

    update(time, delta) {
        if (!this.alive) return;

        // 掃描敵人
        if (!this.attackTarget || !this.attackTarget.alive) {
            this.attackTarget = null;
            this.scanForEnemies();
        }

        // 驗證目標仍在射程內
        if (this.attackTarget && this.attackTarget.alive) {
            const dist = this.distanceToUnit(this.attackTarget);
            if (dist > TOWER_ATTACK_RANGE * TILE_SIZE) {
                this.attackTarget = null;
            }
        }

        // 攻擊
        if (this.attackTarget && this.attackTarget.alive) {
            if (time - this.lastAttackTime >= TOWER_COOLDOWN) {
                this.lastAttackTime = time;
                this.fireArrow(this.attackTarget);
            }
        }
    }

    scanForEnemies() {
        const range = TOWER_ATTACK_RANGE * TILE_SIZE;
        let closest = null;
        let closestDist = Infinity;
        const center = this.getCenter();

        for (const enemy of this.scene.enemyUnits) {
            if (!enemy.alive || !enemy.sprite) continue;
            const dx = enemy.sprite.x - center.x;
            const dy = enemy.sprite.y - center.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < range && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }

        this.attackTarget = closest;
    }

    distanceToUnit(unit) {
        const center = this.getCenter();
        const dx = unit.sprite.x - center.x;
        const dy = unit.sprite.y - center.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    fireArrow(target) {
        const center = this.getCenter();
        const arrow = this.scene.add.image(center.x, center.y - 20, 'arrow');
        arrow.setScale(0.3);
        arrow.setDepth(center.y);

        const angle = Phaser.Math.Angle.Between(
            center.x, center.y,
            target.sprite.x, target.sprite.y
        );
        arrow.setRotation(angle);

        this.scene.tweens.add({
            targets: arrow,
            x: target.sprite.x,
            y: target.sprite.y,
            duration: 400,
            onComplete: () => {
                arrow.destroy();
                if (target.alive) {
                    target.takeDamage(TOWER_DAMAGE);
                }
            }
        });
    }
}
```

**Step 2: Commit**

```bash
git add src/entities/Tower.js
git commit -m "feat: add Tower building with auto-attack arrow"
```

---

### Task 8: Archery 射箭場建築

**Files:**
- Create: `src/entities/Archery.js`

**Step 1: 實作 Archery 類別**

參照 Barracks.js 模式，訓練 Archer 單位。完整複製 Barracks 的 UI 模式（按鈕 + 進度條），但改用 Archer 相關常數。

需包含：
- 訓練按鈕 + 成本標籤
- 3-slice 進度條
- 人口檢查（`resourceSystem.canAffordPop(1)` + `resourceSystem.usePopulation(1)`）
- 完成時在建築旁邊 spawn Archer

```javascript
import Building from './Building.js';
import Archer from './Archer.js';
import {
    ARCHERY_HP, ARCHERY_COST, ARCHER_COST, ARCHER_PRODUCE_TIME, TILE_SIZE
} from '../config/gameConfig.js';

export default class Archery extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 3, 3, 'archery', ARCHERY_HP);
        this.type = 'archery';
        this.faction = 'player';
        this.producing = false;
        this.produceTimer = 0;
        this.produceCallback = null;
        this.uiElements = [];
        this.canAfford = true;
        this.createUI();
    }

    static get cost() { return ARCHERY_COST; }

    // createUI() — 同 Barracks 模式:
    // 按鈕 (ui_btn_blue) + 成本文字 + 進度條 (ui_bigbar_base/fill)
    // 按鈕點擊 → _startProduction()

    _startProduction() {
        if (!this.scene.resourceSystem.spendGold(ARCHER_COST)) return;
        if (!this.scene.resourceSystem.usePopulation(1)) {
            this.scene.resourceSystem.addGold(ARCHER_COST); // 退還金幣
            return;
        }
        this.produceUnit(() => {
            const cell = this.scene.gridSystem.findAdjacentFreeCell(
                this.gx, this.gy, this.gridW, this.gridH
            );
            if (cell) {
                const archer = new Archer(this.scene, this.scene.gridSystem, cell.gx, cell.gy);
                this.scene.playerUnits.push(archer);
            }
        });
    }

    // produceUnit(), update(), onDestroyed() — 同 Barracks 模式
    // update 中使用 ARCHER_PRODUCE_TIME 和 ARCHER_COST
}
```

完整程式碼需複製 Barracks 的 UI 建立邏輯（按鈕、進度條、圖標）。

**Step 2: Commit**

```bash
git add src/entities/Archery.js
git commit -m "feat: add Archery building that trains Archers"
```

---

### Task 9: Monastery 修道院建築

**Files:**
- Create: `src/entities/Monastery.js`

**Step 1: 實作 Monastery 類別**

同 Archery/Barracks 模式，但訓練 Monk：

```javascript
import Building from './Building.js';
import Monk from './Monk.js';
import {
    MONASTERY_HP, MONASTERY_COST, MONK_COST, MONK_PRODUCE_TIME, TILE_SIZE
} from '../config/gameConfig.js';
```

完整複製 Barracks 的生產 UI 模式，替換為 Monk 常數。

**Step 2: Commit**

```bash
git add src/entities/Monastery.js
git commit -m "feat: add Monastery building that trains Monks"
```

---

### Task 10: 更新 Barracks 加入人口檢查

**Files:**
- Modify: `src/entities/Barracks.js`

**Step 1: 在 _startProduction 中加入人口檢查**

```javascript
_startProduction() {
    if (!this.scene.resourceSystem.spendGold(WARRIOR_COST)) return;
    if (!this.scene.resourceSystem.usePopulation(1)) {
        this.scene.resourceSystem.addGold(WARRIOR_COST); // 退還
        return;
    }
    this.produceUnit(() => { /* 同原本 */ });
}
```

**Step 2: 在 update 中更新按鈕可用狀態**

加入 `canAffordPop` 檢查：

```javascript
this.canAfford = this.scene.resourceSystem.getGold() >= WARRIOR_COST
              && this.scene.resourceSystem.canAffordPop(1);
```

**Step 3: Commit**

```bash
git add src/entities/Barracks.js
git commit -m "feat: add population check to Barracks training"
```

---

### Task 11: 更新 BuildSystem 支援新建築

**Files:**
- Modify: `src/systems/BuildSystem.js`

**Step 1: 新增 import**

```javascript
import Tower from '../entities/Tower.js';
import Archery from '../entities/Archery.js';
import House from '../entities/House.js';
import Monastery from '../entities/Monastery.js';
```

**Step 2: 擴展 enterBuildMode 的 config**

```javascript
const config = {
    barracks:   { w: 3, h: 3, tex: 'barracks' },
    goldmine:   { w: 3, h: 2, tex: 'goldmine_active' },
    tower:      { w: 2, h: 3, tex: 'tower' },
    archery:    { w: 3, h: 3, tex: 'archery' },
    house:      { w: 2, h: 2, tex: 'house' },
    monastery:  { w: 3, h: 3, tex: 'monastery' },
};
```

**Step 3: 擴展 confirmPlacement 的建築建立**

```javascript
if (this.buildingType === 'tower') {
    building = new Tower(this.scene, this.scene.gridSystem, gx, gy);
} else if (this.buildingType === 'archery') {
    building = new Archery(this.scene, this.scene.gridSystem, gx, gy);
} else if (this.buildingType === 'house') {
    building = new House(this.scene, this.scene.gridSystem, gx, gy);
} else if (this.buildingType === 'monastery') {
    building = new Monastery(this.scene, this.scene.gridSystem, gx, gy);
}
```

**Step 4: 擴展 getCost**

```javascript
getCost() {
    const costs = {
        barracks: Barracks.cost,
        goldmine: GoldMine.cost,
        tower: Tower.cost,
        archery: Archery.cost,
        house: House.cost,
        monastery: Monastery.cost,
    };
    return costs[this.buildingType] || 0;
}
```

**Step 5: Commit**

```bash
git add src/systems/BuildSystem.js
git commit -m "feat: update BuildSystem to support all new building types"
```

---

### Task 12: 更新 BuildMenu 顯示所有建築

**Files:**
- Modify: `src/ui/BuildMenu.js`

**Step 1: 新增 import 和成本常數**

```javascript
import { TOWER_COST, ARCHERY_COST, HOUSE_COST, MONASTERY_COST } from '../config/gameConfig.js';
```

**Step 2: 重構 openPanel 為 6 個項目**

將面板從 2 項擴展為 6 項，調整面板高度和佈局。每項包含：圖標 + 按鈕 + 名稱 + 成本。

6 個建築項目順序：
1. Gold Mine (100g)
2. House (75g)
3. Barracks (150g)
4. Archery (175g)
5. Tower (125g)
6. Monastery (200g)

面板高度需調整：`rows = 6`, `ph = rowH * 6 + 20`。

**Step 3: 新增所有 canAfford 狀態**

```javascript
updateAffordState(gold) {
    this.canAffordMine = gold >= GOLDMINE_COST;
    this.canAffordBarracks = gold >= BARRACKS_COST;
    this.canAffordTower = gold >= TOWER_COST;
    this.canAffordArchery = gold >= ARCHERY_COST;
    this.canAffordHouse = gold >= HOUSE_COST;
    this.canAffordMonastery = gold >= MONASTERY_COST;
}
```

**Step 4: Commit**

```bash
git add src/ui/BuildMenu.js
git commit -m "feat: expand BuildMenu to show all 6 building types"
```

---

### Task 13: 整合測試與驗證

**Files:**
- Modify: `tests/` (Playwright 測試)

**Step 1: 手動驗證**

在瀏覽器中啟動遊戲 (`live-server`)，逐一驗證：

1. BuildMenu 顯示 6 種建築
2. 每種建築可正確放置
3. House 增加人口上限 (HUD 顯示)
4. Tower 自動射擊敵人
5. Archery 訓練出 Archer（遠程攻擊）
6. Monastery 訓練出 Monk（自動治療友軍）
7. 人口上限阻止過度訓練
8. 建築被摧毀時正確清理

**Step 2: 撰寫 Playwright 測試**

```javascript
test('can build all new building types', async ({ page }) => {
    // 給予足夠金幣
    await page.evaluate(() => window.gameAPI.setGold(5000));

    // 測試建造每種建築
    for (const type of ['tower', 'archery', 'house', 'monastery']) {
        const result = await page.evaluate((t) => window.gameAPI.build(t), type);
        expect(result).toBeTruthy();
    }
});

test('archer attacks enemies at range', async ({ page }) => {
    // 生成 Archer 和敵人，驗證遠程攻擊行為
});

test('monk heals injured allies', async ({ page }) => {
    // 生成 Monk 和受傷友軍，驗證治療行為
});

test('population cap prevents over-training', async ({ page }) => {
    // 設定低人口上限，驗證訓練被拒絕
});
```

**Step 3: Commit**

```bash
git add tests/
git commit -m "test: add Playwright tests for new buildings and units"
```

---

## 任務依賴圖

```
Task 1 (常數) ──┬──> Task 4 (Archer)  ──> Task 8 (Archery)
                │                          │
Task 2 (素材) ──┤──> Task 5 (Monk)    ──> Task 9 (Monastery)
                │                          │
                ├──> Task 6 (House)        ├──> Task 11 (BuildSystem)
                │                          │
                ├──> Task 7 (Tower)        ├──> Task 12 (BuildMenu)
                │                          │
                └──> Task 3 (人口) ──> Task 10 (Barracks改) ──> Task 13 (測試)
```

## 估計影響範圍

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/config/gameConfig.js` | 修改 | 新增 ~25 個常數 |
| `src/config/assetManifest.js` | 修改 | 新增 ~10 個素材 |
| `src/entities/Archer.js` | 新建 | ~150 行 |
| `src/entities/Monk.js` | 新建 | ~130 行 |
| `src/entities/House.js` | 新建 | ~25 行 |
| `src/entities/Tower.js` | 新建 | ~100 行 |
| `src/entities/Archery.js` | 新建 | ~120 行 (參考 Barracks) |
| `src/entities/Monastery.js` | 新建 | ~120 行 (參考 Barracks) |
| `src/entities/Barracks.js` | 修改 | 加入人口檢查 (~5 行) |
| `src/systems/ResourceSystem.js` | 修改 | 加入人口方法 (~30 行) |
| `src/systems/BuildSystem.js` | 修改 | 擴展建築配置 (~20 行) |
| `src/ui/BuildMenu.js` | 修改 | 擴展為 6 項 (~60 行) |
| `src/ui/HUD.js` | 修改 | 加入人口顯示 (~10 行) |
| `src/scenes/GameScene.js` | 修改 | 死亡單位釋放人口 (~5 行) |
