import { TILE_SIZE, GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';
import Barracks from '../entities/Barracks.js';
import GoldMine from '../entities/GoldMine.js';
import Tower from '../entities/Tower.js';
import Archery from '../entities/Archery.js';
import House from '../entities/House.js';
import Monastery from '../entities/Monastery.js';

export default class BuildSystem {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.buildingType = null;
        this.ghostSprite = null;
        this.gridW = 0;
        this.gridH = 0;
        this.gridOverlay = null;

        this.setupInput();
    }

    setupInput() {
        this.scene.input.on('pointermove', (pointer) => {
            if (!this.active) return;
            this.updateGhost(pointer);
        });

        this.scene.input.on('pointerdown', (pointer) => {
            if (!this.active) return;
            if (pointer.leftButtonDown()) {
                this.confirmPlacement(pointer);
            } else if (pointer.rightButtonDown()) {
                this.cancelBuild();
            }
        });
    }

    enterBuildMode(type) {
        this.active = true;
        this.buildingType = type;

        const config = { barracks:   { w: 3, h: 3, tex: 'barracks' },
                         goldmine:   { w: 3, h: 2, tex: 'goldmine_active' },
                         tower:      { w: 2, h: 3, tex: 'tower' },
                         archery:    { w: 3, h: 3, tex: 'archery' },
                         house:      { w: 2, h: 2, tex: 'house' },
                         monastery:  { w: 3, h: 3, tex: 'monastery' } };
        const c = config[type];
        if (c) {
            this.gridW = c.w;
            this.gridH = c.h;
            this.ghostSprite = this.scene.add.image(0, 0, c.tex);
            this.ghostSprite.setAlpha(0.6);
            this.ghostSprite.setDepth(2000);
        }

        this.showGridOverlay();
    }

    showGridOverlay() {
        this.gridOverlay = this.scene.add.graphics().setDepth(1999);

        const gs = this.scene.gridSystem;
        // Grass area: 1 tile border
        const gLeft = 0, gRight = GRID_COLS - 1;
        const gTop = 0, gBottom = GRID_ROWS - 1;

        // Draw cell tints
        for (let gy = gTop; gy <= gBottom; gy++) {
            for (let gx = gLeft; gx <= gRight; gx++) {
                const px = gx * TILE_SIZE;
                const py = gy * TILE_SIZE;
                const free = gs.grid[gy][gx] === 0;

                if (free) {
                    this.gridOverlay.fillStyle(0x00ff00, 0.1);
                } else {
                    this.gridOverlay.fillStyle(0xff0000, 0.15);
                }
                this.gridOverlay.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw grid lines
        this.gridOverlay.lineStyle(1, 0xffffff, 0.2);
        const x1 = gLeft * TILE_SIZE, x2 = (gRight + 1) * TILE_SIZE;
        const y1 = gTop * TILE_SIZE, y2 = (gBottom + 1) * TILE_SIZE;

        for (let gx = gLeft; gx <= gRight + 1; gx++) {
            const px = gx * TILE_SIZE;
            this.gridOverlay.lineBetween(px, y1, px, y2);
        }
        for (let gy = gTop; gy <= gBottom + 1; gy++) {
            const py = gy * TILE_SIZE;
            this.gridOverlay.lineBetween(x1, py, x2, py);
        }

    }

    hideGridOverlay() {
        if (this.gridOverlay) {
            this.gridOverlay.destroy();
            this.gridOverlay = null;
        }
    }

    updateGhost(pointer) {
        if (!this.ghostSprite) return;

        const grid = this.scene.gridSystem.pixelToGrid(pointer.worldX, pointer.worldY);
        const gx = grid.gx;
        const gy = grid.gy;

        // Snap to grid
        const px = gx * TILE_SIZE + (this.gridW * TILE_SIZE) / 2;
        const py = gy * TILE_SIZE + (this.gridH * TILE_SIZE) / 2;
        this.ghostSprite.setPosition(px, py);

        // Check if placement is valid
        const canPlace = this.canPlaceAt(gx, gy);
        this.ghostSprite.setTint(canPlace ? 0x00ff00 : 0xff0000);
    }

    canPlaceAt(gx, gy) {
        // Must be within grass area (1 tile border)
        if (gx < 0 || gy < 0 || gx + this.gridW > GRID_COLS || gy + this.gridH > GRID_ROWS) return false;

        // Must be free
        return this.scene.gridSystem.isFree(gx, gy, this.gridW, this.gridH);
    }

    confirmPlacement(pointer) {
        const grid = this.scene.gridSystem.pixelToGrid(pointer.worldX, pointer.worldY);
        const gx = grid.gx;
        const gy = grid.gy;

        if (!this.canPlaceAt(gx, gy)) return;

        // Check cost
        const cost = this.getCost();
        if (!this.scene.resourceSystem.spendGold(cost)) return;

        // Place building
        let building = null;
        if (this.buildingType === 'barracks') {
            building = new Barracks(this.scene, this.scene.gridSystem, gx, gy);
        } else if (this.buildingType === 'goldmine') {
            building = new GoldMine(this.scene, this.scene.gridSystem, gx, gy);
        } else if (this.buildingType === 'tower') {
            building = new Tower(this.scene, this.scene.gridSystem, gx, gy);
        } else if (this.buildingType === 'archery') {
            building = new Archery(this.scene, this.scene.gridSystem, gx, gy);
        } else if (this.buildingType === 'house') {
            building = new House(this.scene, this.scene.gridSystem, gx, gy);
        } else if (this.buildingType === 'monastery') {
            building = new Monastery(this.scene, this.scene.gridSystem, gx, gy);
        }

        if (building) {
            this.scene.buildings.push(building);
        }

        this.cancelBuild();
    }

    getCost() {
        if (this.buildingType === 'barracks') return Barracks.cost;
        if (this.buildingType === 'goldmine') return GoldMine.cost;
        if (this.buildingType === 'tower') return Tower.cost;
        if (this.buildingType === 'archery') return Archery.cost;
        if (this.buildingType === 'house') return House.cost;
        if (this.buildingType === 'monastery') return Monastery.cost;
        return 0;
    }

    cancelBuild() {
        this.active = false;
        this.buildingType = null;
        this.hideGridOverlay();
        if (this.ghostSprite) {
            this.ghostSprite.destroy();
            this.ghostSprite = null;
        }
    }
}
