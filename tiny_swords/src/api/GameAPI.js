import Warrior from '../entities/Warrior.js';
import Archer from '../entities/Archer.js';
import Monk from '../entities/Monk.js';
import Barracks from '../entities/Barracks.js';
import GoldMine from '../entities/GoldMine.js';
import Tower from '../entities/Tower.js';
import Archery from '../entities/Archery.js';
import House from '../entities/House.js';
import Monastery from '../entities/Monastery.js';
import { WARRIOR_COST, ARCHER_COST, MONK_COST } from '../config/gameConfig.js';

export default class GameAPI {
    constructor(scene) {
        this.scene = scene;
    }

    // --- State Queries ---

    getCastlePosition() {
        const c = this.scene.castle;
        return { gx: c.gx, gy: c.gy };
    }

    getMapName() {
        return this.scene.currentMap?.name || 'unknown';
    }

    /** Find a free walkable position for building (w×h) near the castle. */
    findBuildablePosition(w = 3, h = 3) {
        const gs = this.scene.gridSystem;
        const cx = this.scene.castle.gx;
        const cy = this.scene.castle.gy;
        // Spiral outward from castle
        for (let radius = 6; radius < 15; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                    const gx = cx + dx, gy = cy + dy;
                    if (gx < 1 || gy < 1 || gx + w > 39 || gy + h > 23) continue;
                    if (gs.isFree(gx, gy, w, h)) return { gx, gy };
                }
            }
        }
        return null;
    }

    getGameState() {
        const s = this.scene;
        return {
            gold: s.resourceSystem.getGold(),
            gameOver: s.gameOver,
            gameResult: s.gameResult,
            wave: {
                current: s.waveSystem.currentWave,
                max: s.waveSystem.maxWaves,
                allSpawned: s.waveSystem.allWavesSpawned,
                lastSpawnDirection: s.waveSystem.lastSpawnDirection
            },
            playerUnits: s.playerUnits.filter(u => u.alive).map(u => this._serializeUnit(u)),
            enemyUnits: s.enemyUnits.filter(u => u.alive).map(u => this._serializeUnit(u)),
            buildings: s.buildings.filter(b => b.alive).map(b => this._serializeBuilding(b))
        };
    }

    _serializeUnit(u) {
        return {
            id: u.id,
            type: u.type,
            faction: u.faction,
            hp: u.hp,
            maxHp: u.maxHp,
            alive: u.alive,
            state: u.state,
            x: u.sprite ? u.sprite.x : 0,
            y: u.sprite ? u.sprite.y : 0
        };
    }

    _serializeBuilding(b) {
        return {
            id: b.id,
            type: b.type,
            faction: b.faction,
            hp: b.hp,
            maxHp: b.maxHp,
            alive: b.alive,
            gridX: b.gridX,
            gridY: b.gridY,
            producing: b.producing || false,
            produceProgress: b.getProduceProgress ? b.getProduceProgress() : 0
        };
    }

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
        cam.scrollX = Math.max(cam._bounds.x, Math.min(cam._bounds.right - cam.width, cam.scrollX + dx));
        cam.scrollY = Math.max(cam._bounds.y, Math.min(cam._bounds.bottom - cam.height, cam.scrollY + dy));
        return this.getCameraState();
    }

    // --- Unit Commands ---

    selectUnit(unitId) {
        const unit = this._findUnit(unitId);
        if (!unit) return false;
        this.scene.selectionSystem.deselectAll();
        unit.setSelected(true);
        this.scene.selectionSystem.selectedUnits = [unit];
        return true;
    }

    commandMove(unitId, gx, gy) {
        const unit = this._findUnit(unitId);
        if (!unit || !unit.alive) return false;
        const pos = this.scene.gridSystem.gridToPixel(gx, gy);
        unit.moveTo(pos.x, pos.y);
        return true;
    }

    commandAttack(unitId, targetId) {
        const unit = this._findUnit(unitId);
        if (!unit || !unit.alive) return false;
        const target = this._findUnit(targetId) || this.scene.buildings.find(b => b.id === targetId);
        if (!target || !target.alive) return false;
        unit.attackTarget = target;
        return true;
    }

    // --- Building ---

    buildStructure(type, gx, gy) {
        const bs = this.scene.buildSystem;
        const configs = {
            barracks: { w: 3, h: 3, cls: Barracks },
            goldmine: { w: 3, h: 2, cls: GoldMine },
            tower: { w: 2, h: 3, cls: Tower },
            archery: { w: 3, h: 3, cls: Archery },
            house: { w: 2, h: 2, cls: House },
            monastery: { w: 3, h: 3, cls: Monastery },
        };
        const cfg = configs[type];
        if (!cfg) return { success: false, reason: 'unknown_type' };

        bs.gridW = cfg.w;
        bs.gridH = cfg.h;
        bs.buildingType = type;
        if (!bs.canPlaceAt(gx, gy)) return { success: false, reason: 'invalid_placement' };
        if (!this.scene.resourceSystem.spendGold(cfg.cls.cost)) return { success: false, reason: 'insufficient_gold' };
        const building = new cfg.cls(this.scene, this.scene.gridSystem, gx, gy);
        this.scene.buildings.push(building);
        return { success: true, buildingId: building.id };
    }

    produceUnit(buildingId, unitType) {
        const building = this.scene.buildings.find(b => b.id === buildingId && b.alive);
        if (!building) return { success: false, reason: 'building_not_found' };

        const productionConfigs = {
            barracks: { warrior: { cost: WARRIOR_COST, cls: Warrior } },
            archery: { archer: { cost: ARCHER_COST, cls: Archer } },
            monastery: { monk: { cost: MONK_COST, cls: Monk } },
        };

        const buildingConfig = productionConfigs[building.type];
        if (!buildingConfig) return { success: false, reason: 'building_cannot_produce' };

        const unitConfig = buildingConfig[unitType];
        if (!unitConfig) return { success: false, reason: 'unsupported' };

        if (!this.scene.resourceSystem.spendGold(unitConfig.cost)) {
            return { success: false, reason: 'insufficient_gold' };
        }
        if (!this.scene.resourceSystem.usePopulation(1)) {
            this.scene.resourceSystem.addGold(unitConfig.cost); // refund
            return { success: false, reason: 'population_cap' };
        }
        const started = building.produceUnit(() => {
            const cell = this.scene.gridSystem.findAdjacentFreeCell(
                building.gx, building.gy, building.gridW, building.gridH
            );
            if (cell) {
                const unit = new unitConfig.cls(this.scene, this.scene.gridSystem, cell.gx, cell.gy);
                this.scene.playerUnits.push(unit);
            }
        });
        if (!started) {
            this.scene.resourceSystem.addGold(unitConfig.cost); // refund
            this.scene.resourceSystem.freePopulation(1); // refund pop
            return { success: false, reason: 'already_producing' };
        }
        return { success: true };
    }

    // --- Test Helpers ---

    setGold(amount) {
        const rs = this.scene.resourceSystem;
        const diff = amount - rs.getGold();
        if (diff > 0) rs.addGold(diff);
        else if (diff < 0) rs.spendGold(-diff);
        return rs.getGold();
    }

    skipToWave(n) {
        this.scene.waveSystem.skipToWave(n);
        return true;
    }

    spawnTestEnemy(type, gx, gy) {
        const enemy = this.scene.waveSystem.createEnemy(type, gx, gy);
        if (enemy) {
            this.scene.enemyUnits.push(enemy);
            return { success: true, unitId: enemy.id };
        }
        return { success: false, reason: 'unknown_type' };
    }

    // --- Internal ---

    _findUnit(unitId) {
        return this.scene.playerUnits.find(u => u.id === unitId) ||
               this.scene.enemyUnits.find(u => u.id === unitId);
    }
}
