import Building from './Building.js';
import { GOLDMINE_COST, GOLDMINE_HP, GOLDMINE_INCOME, GOLDMINE_INCOME_INTERVAL, TILE_SIZE } from '../config/gameConfig.js';
import { t } from '../i18n/i18n.js';

const BLINK_INTERVAL = 500;

export default class GoldMine extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 3, 2, 'goldmine_active', GOLDMINE_HP);
        this.type = 'goldmine';
        this.faction = 'player';
        this.incomeTimer = 0;
        this.blinkTimer = 0;
        this.blinkActive = true;
    }

    static get cost() { return GOLDMINE_COST; }

    update(_time, delta) {
        if (!this.alive) return;

        // Blink animation: alternate between active/inactive textures
        this.blinkTimer += delta;
        if (this.blinkTimer >= BLINK_INTERVAL) {
            this.blinkTimer -= BLINK_INTERVAL;
            this.blinkActive = !this.blinkActive;
            this.sprite.setTexture(this.blinkActive ? 'goldmine_active' : 'goldmine_inactive');
        }

        // Income generation
        this.incomeTimer += delta;
        if (this.incomeTimer >= GOLDMINE_INCOME_INTERVAL) {
            this.incomeTimer -= GOLDMINE_INCOME_INTERVAL;
            this.scene.resourceSystem.addGold(GOLDMINE_INCOME);
            this.showIncomeText();
        }
    }

    showIncomeText() {
        const center = this.getCenter();
        const x = center.x;
        const y = center.y - (this.gridH * TILE_SIZE) / 2 - 10;

        const text = this.scene.add.text(x, y, t('goldIncome', { amount: GOLDMINE_INCOME }), {
            fontSize: '16px',
            color: '#ffdd00',
            fontFamily: 'Arial',
            stroke: '#3a2a14',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(9999);

        this.scene.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => text.destroy()
        });
    }
}
