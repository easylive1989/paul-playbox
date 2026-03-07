import { WARRIOR_COST, TILE_SIZE } from '../config/gameConfig.js';
import { t } from '../i18n/i18n.js';

export default class UnitPanel {
    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this.visible = false;
        this.canAfford = true;

        // Listen for selection changes
        this.scene.events.on('update', () => this.refresh());
    }

    refresh() {
        const sel = this.scene.selectionSystem;
        if (!sel) return;

        const selectedBuilding = sel.selectedBuilding;

        // Only show for barracks
        if (selectedBuilding && selectedBuilding.type === 'barracks' && selectedBuilding.alive) {
            if (!this.visible) this.show(selectedBuilding);
            this.updateProgress(selectedBuilding);
        } else {
            if (this.visible) this.hide();
        }
    }

    show(barracks) {
        this.visible = true;
        this.clear();

        const center = barracks.getCenter();
        const panelX = center.x;
        const panelY = center.y - (barracks.gridH * TILE_SIZE) / 2 - 40;

        const style = { fontSize: '12px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Button image
        this.btnImage = this.scene.add.image(panelX, panelY, 'ui_btn_blue').setScale(0.8, 0.7)
            .setDepth(2000).setInteractive();
        this.elements.push(this.btnImage);

        // Button label
        const label = this.scene.add.text(panelX, panelY, t('train', { cost: WARRIOR_COST }), style)
            .setOrigin(0.5).setDepth(2001);
        this.elements.push(label);

        // Button interaction
        this.btnImage.on('pointerover', () => {
            if (this.canAfford) this.btnImage.setTexture('ui_btn_hover');
        });

        this.btnImage.on('pointerout', () => {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        });

        this.btnImage.on('pointerdown', () => {
            if (!this.canAfford) return;
            this.btnImage.setTexture('ui_btn_blue_pressed');
            if (!this.scene.resourceSystem.spendGold(WARRIOR_COST)) return;
            barracks.produceUnit(() => {
                const cell = this.scene.gridSystem.findAdjacentFreeCell(
                    barracks.gx, barracks.gy, barracks.gridW, barracks.gridH
                );
                if (cell) {
                    const Warrior = this._getWarriorClass();
                    if (Warrior) {
                        const warrior = new Warrior(this.scene, this.scene.gridSystem, cell.gx, cell.gy);
                        this.scene.playerUnits.push(warrior);
                    }
                }
            });
        });

        this.btnImage.on('pointerup', () => {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        });

        // Progress bar base
        this.barBase = this.scene.add.image(panelX, panelY + 28, 'ui_bar_base').setScale(0.45, 0.35)
            .setDepth(2000);
        this.elements.push(this.barBase);

        // Progress bar fill
        this.progressFill = this.scene.add.image(panelX - 65, panelY + 28, 'ui_bar_fill')
            .setOrigin(0, 0.5).setDisplaySize(130, 18)
            .setDepth(2001);
        this.progressFill.setCrop(0, 0, 0, 64);
        this.elements.push(this.progressFill);

        // Update afford state
        this.canAfford = this.scene.resourceSystem.getGold() >= WARRIOR_COST;

        this.barracksRef = barracks;
    }

    updateProgress(barracks) {
        if (!this.progressFill) return;
        const progress = barracks.getProduceProgress();
        this.progressFill.setCrop(0, 0, Math.floor(64 * progress), 64);

        // Update afford state
        this.canAfford = this.scene.resourceSystem.getGold() >= WARRIOR_COST;
        if (this.btnImage) {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        }
    }

    hide() {
        this.visible = false;
        this.clear();
    }

    clear() {
        for (const el of this.elements) {
            el.destroy();
        }
        this.elements = [];
        this.progressFill = null;
        this.barBase = null;
        this.btnImage = null;
        this.barracksRef = null;
    }

    // Lazy import to avoid circular deps
    _getWarriorClass() {
        if (!this._WarriorClass) {
            // Set by GameScene after import
            this._WarriorClass = this.scene._WarriorClass;
        }
        return this._WarriorClass;
    }
}
