import Building from './Building.js';
import Archer from './Archer.js';
import { ARCHERY_HP, ARCHERY_COST, ARCHER_COST, ARCHER_PRODUCE_TIME, TILE_SIZE } from '../config/gameConfig.js';
import { t } from '../i18n/i18n.js';

export default class Archery extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 3, 3, 'archery', ARCHERY_HP);
        this.type = 'archery';
        this.faction = 'player';
        this.producing = false;
        this.produceTimer = 0;
        this.produceCallback = null;
        this.uiElements = [];

        this.createUI();
    }

    static get cost() { return ARCHERY_COST; }

    createUI() {
        const center = this.getCenter();
        const btnY = center.y - (this.gridH * TILE_SIZE) / 2 + 16;

        const style = { fontSize: '12px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Archer avatar icon to the left of the button
        this.avatarIcon = this.scene.add.image(center.x - 55, btnY, 'ui_avatar_archer')
            .setScale(0.25).setDepth(2001);
        this.uiElements.push(this.avatarIcon);

        // Button
        this.btnImage = this.scene.add.image(center.x, btnY, 'ui_btn_blue').setScale(0.7, 0.6)
            .setDepth(2000).setInteractive();
        this.uiElements.push(this.btnImage);

        // Label
        this.btnLabel = this.scene.add.text(center.x, btnY, t('train', { cost: ARCHER_COST }), style)
            .setOrigin(0.5).setDepth(2001);
        this.uiElements.push(this.btnLabel);

        // Progress bar base — 3-slice via spritesheet frames (5 frames of 64×64)
        // Frame 0 = left cap, frame 2 = middle wood, frame 4 = right cap
        const barY = btnY + 22;
        const barH = 22;
        const capW = 16;
        const totalW = 128;
        const midW = totalW - capW * 2;
        const barLeft = center.x - totalW / 2;

        this.barCapL = this.scene.add.image(barLeft, barY, 'ui_bigbar_base', 0)
            .setOrigin(0, 0.5).setDisplaySize(capW, barH).setDepth(2000);
        this.uiElements.push(this.barCapL);

        this.barMid = this.scene.add.image(barLeft + capW, barY, 'ui_bigbar_base', 2)
            .setOrigin(0, 0.5).setDisplaySize(midW, barH).setDepth(2000);
        this.uiElements.push(this.barMid);

        this.barCapR = this.scene.add.image(barLeft + capW + midW, barY, 'ui_bigbar_base', 4)
            .setOrigin(0, 0.5).setDisplaySize(capW, barH).setDepth(2000);
        this.uiElements.push(this.barCapR);

        // Progress bar fill (aligned inside the middle section)
        this.progressFill = this.scene.add.image(barLeft + capW, barY, 'ui_bigbar_fill')
            .setOrigin(0, 0.5).setDisplaySize(midW, 14).setDepth(2001);
        this.progressFill.setCrop(0, 0, 0, 64);
        this.uiElements.push(this.progressFill);

        this.canAfford = true;

        // Button interaction
        this.btnImage.on('pointerover', () => {
            if (this.canAfford && !this.producing) this.btnImage.setTexture('ui_btn_hover');
        });
        this.btnImage.on('pointerout', () => {
            this._updateBtnTexture();
        });
        this.btnImage.on('pointerdown', () => {
            if (!this.canAfford || this.producing) return;
            this.btnImage.setTexture('ui_btn_blue_pressed');
            this._startProduction();
        });
        this.btnImage.on('pointerup', () => {
            this._updateBtnTexture();
        });
    }

    _startProduction() {
        if (!this.scene.resourceSystem.spendGold(ARCHER_COST)) return;
        if (!this.scene.resourceSystem.usePopulation(1)) {
            this.scene.resourceSystem.addGold(ARCHER_COST); // refund
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

    _updateBtnTexture() {
        if (!this.btnImage) return;
        if (this.producing) {
            this.btnImage.setTexture('ui_btn_disable');
        } else {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        }
    }

    produceUnit(callback) {
        if (this.producing) return false;
        this.producing = true;
        this.produceTimer = 0;
        this.produceCallback = callback;
        this._updateBtnTexture();
        return true;
    }

    update(time, delta) {
        // Update afford state (gold + population)
        if (this.scene.resourceSystem) {
            this.canAfford = this.scene.resourceSystem.getGold() >= ARCHER_COST
                          && this.scene.resourceSystem.canAffordPop(1);
            this._updateBtnTexture();
        }

        if (!this.producing) {
            if (this.progressFill) this.progressFill.setCrop(0, 0, 0, 64);
            return;
        }

        this.produceTimer += delta;

        // Update progress bar
        if (this.progressFill) {
            const progress = this.produceTimer / ARCHER_PRODUCE_TIME;
            this.progressFill.setCrop(0, 0, Math.floor(64 * progress), 64);
        }

        if (this.produceTimer >= ARCHER_PRODUCE_TIME) {
            this.producing = false;
            this.produceTimer = 0;
            if (this.produceCallback) {
                this.produceCallback();
                this.produceCallback = null;
            }
            this._updateBtnTexture();
        }
    }

    getProduceProgress() {
        if (!this.producing) return 0;
        return this.produceTimer / ARCHER_PRODUCE_TIME;
    }

    onDestroyed() {
        for (const el of this.uiElements) {
            el.destroy();
        }
        this.uiElements = [];
        this.btnImage = null;
        this.progressFill = null;
        this.barCapL = null;
        this.barMid = null;
        this.barCapR = null;
        super.onDestroyed();
    }
}
