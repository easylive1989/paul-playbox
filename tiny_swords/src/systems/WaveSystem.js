import { WAVE_INTERVAL, MAX_WAVES, GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';
import GoblinTorch from '../entities/GoblinTorch.js';
import GoblinBarrel from '../entities/GoblinBarrel.js';
import GoblinTNT from '../entities/GoblinTNT.js';

// Wave definitions: each wave is an array of { type, count }
const WAVE_DEFS = [
    [{ type: 'torch', count: 3 }],                                          // Wave 1
    [{ type: 'torch', count: 5 }],                                          // Wave 2
    [{ type: 'torch', count: 4 }, { type: 'barrel', count: 2 }],            // Wave 3
    [{ type: 'torch', count: 5 }, { type: 'barrel', count: 3 }],            // Wave 4
    [{ type: 'torch', count: 4 }, { type: 'barrel', count: 2 }, { type: 'tnt', count: 1 }], // Wave 5
    [{ type: 'torch', count: 6 }, { type: 'barrel', count: 3 }, { type: 'tnt', count: 2 }], // Wave 6
    [{ type: 'torch', count: 8 }, { type: 'barrel', count: 4 }],            // Wave 7
    [{ type: 'torch', count: 6 }, { type: 'barrel', count: 4 }, { type: 'tnt', count: 3 }], // Wave 8
    [{ type: 'torch', count: 10 }, { type: 'barrel', count: 5 }, { type: 'tnt', count: 2 }], // Wave 9
    [{ type: 'torch', count: 12 }, { type: 'barrel', count: 6 }, { type: 'tnt', count: 4 }], // Wave 10
];

const DIRECTIONS = ['top', 'bottom', 'left', 'right'];

export default class WaveSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.maxWaves = MAX_WAVES;
        this.waveInterval = WAVE_INTERVAL;
        this.timer = 0;
        this.allWavesSpawned = false;
        this.gameOver = false;
        this.lastSpawnDirection = null;
    }

    update(time, delta) {
        if (this.gameOver || this.allWavesSpawned) return;

        this.timer += delta;

        // Update HUD timer
        const remaining = (this.waveInterval - this.timer) / 1000;
        this.scene.hud.updateTimer(remaining);

        if (this.timer >= this.waveInterval) {
            this.timer = 0;
            this.spawnWave();
        }
    }

    spawnWave() {
        if (this.currentWave >= this.maxWaves) {
            this.allWavesSpawned = true;
            return;
        }

        this.currentWave++;
        this.scene.eventBus.emit('waveChanged', this.currentWave);

        const waveDef = WAVE_DEFS[this.currentWave - 1] || WAVE_DEFS[WAVE_DEFS.length - 1];

        // Pick a random direction for this wave
        this.lastSpawnDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

        for (const group of waveDef) {
            for (let i = 0; i < group.count; i++) {
                const pos = this.findWalkableSpawn(this.lastSpawnDirection);
                if (!pos) continue;

                const enemy = this.createEnemy(group.type, pos.gx, pos.gy);
                if (enemy) {
                    this.scene.enemyUnits.push(enemy);
                }
            }
        }
    }

    /**
     * Find a walkable spawn position on a map edge.
     * Collects all walkable cells on the preferred direction first,
     * then falls back to other directions if none found.
     */
    findWalkableSpawn(direction) {
        const grid = this.scene.gridSystem;
        const dirs = [direction, ...DIRECTIONS.filter(d => d !== direction)];

        for (const dir of dirs) {
            const candidates = this._getEdgeCandidates(dir).filter(
                p => grid.isWalkable(p.gx, p.gy)
            );
            if (candidates.length > 0) {
                return candidates[Math.floor(Math.random() * candidates.length)];
            }
        }
        return null;
    }

    /** Return all edge cells for a given direction. */
    _getEdgeCandidates(direction) {
        const cells = [];
        switch (direction) {
            case 'top':
                for (let gx = 1; gx < GRID_COLS - 1; gx++) cells.push({ gx, gy: 1 });
                break;
            case 'bottom':
                for (let gx = 1; gx < GRID_COLS - 1; gx++) cells.push({ gx, gy: GRID_ROWS - 2 });
                break;
            case 'left':
                for (let gy = 1; gy < GRID_ROWS - 1; gy++) cells.push({ gx: 1, gy });
                break;
            case 'right':
                for (let gy = 1; gy < GRID_ROWS - 1; gy++) cells.push({ gx: GRID_COLS - 2, gy });
                break;
        }
        return cells;
    }

    createEnemy(type, gx, gy) {
        switch (type) {
            case 'torch':
                return new GoblinTorch(this.scene, this.scene.gridSystem, gx, gy);
            case 'barrel':
                return new GoblinBarrel(this.scene, this.scene.gridSystem, gx, gy);
            case 'tnt':
                return new GoblinTNT(this.scene, this.scene.gridSystem, gx, gy);
            default:
                return null;
        }
    }

    // For testing: skip to specific wave
    skipToWave(n) {
        this.currentWave = n - 1;
        this.timer = this.waveInterval - 100; // about to trigger
    }

    // Check if all waves complete and all enemies dead
    isVictory() {
        if (!this.allWavesSpawned) return false;
        return this.scene.enemyUnits.every(e => !e.alive);
    }
}
