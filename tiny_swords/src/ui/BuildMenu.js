import { GOLDMINE_COST, BARRACKS_COST, TOWER_COST, ARCHERY_COST, HOUSE_COST, MONASTERY_COST, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';
import { t } from '../i18n/i18n.js';

export default class BuildMenu {
    constructor(scene) {
        this.scene = scene;
        this.panelOpen = false;
        this.panelElements = [];
        this.canAffordMine = true;
        this.canAffordBarracks = true;
        this.canAffordTower = true;
        this.canAffordArchery = true;
        this.canAffordHouse = true;
        this.canAffordMonastery = true;

        // Hammer button in the top HUD bar (between population and wave)
        const btnX = 480;
        const btnY = 30;

        this.hammerBtnBg = scene.add.image(btnX, btnY, 'ui_btn_sq_blue')
            .setDisplaySize(50, 50).setDepth(1000).setScrollFactor(0).setInteractive();
        this.hammerIcon = scene.add.image(btnX, btnY, 'ui_icon_hammer')
            .setScale(0.42).setDepth(1001).setScrollFactor(0);

        this.hammerBtnBg.on('pointerover', () => {
            this.hammerBtnBg.setTexture('ui_btn_sq_hover');
        });
        this.hammerBtnBg.on('pointerout', () => {
            this.hammerBtnBg.setTexture('ui_btn_sq_blue');
        });
        this.hammerBtnBg.on('pointerdown', () => {
            this.hammerBtnBg.setTexture('ui_btn_sq_pressed');
            this.hammerIcon.y = btnY + 2;
        });
        this.hammerBtnBg.on('pointerup', () => {
            this.hammerBtnBg.setTexture('ui_btn_sq_blue');
            this.hammerIcon.y = btnY;
            if (this.panelOpen) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        });

        // Listen for gold changes
        scene.eventBus.on('goldChanged', (gold) => this.updateAffordState(gold));
        this.updateAffordState(scene.resourceSystem.getGold());
    }

    openPanel() {
        if (this.panelOpen) return;
        this.panelOpen = true;

        const scene = this.scene;

        const style = { fontSize: '13px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Click-outside-to-close backdrop
        this.backdrop = scene.add.rectangle(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 0x000000, 0.15)
            .setScrollFactor(0).setDepth(949).setInteractive();
        this.backdrop.on('pointerdown', () => this.closePanel());

        // Panel on the right side — vertical strip
        const items = [
            { name: t('goldMine'), icon: 'goldmine_active', iconScale: 0.16, cost: GOLDMINE_COST, type: 'goldmine', canAfford: () => this.canAffordMine },
            { name: t('house'), icon: 'house', iconScale: 0.16, cost: HOUSE_COST, type: 'house', canAfford: () => this.canAffordHouse },
            { name: t('barracks'), icon: 'barracks', iconScale: 0.19, cost: BARRACKS_COST, type: 'barracks', canAfford: () => this.canAffordBarracks },
            { name: t('archery'), icon: 'archery', iconScale: 0.19, cost: ARCHERY_COST, type: 'archery', canAfford: () => this.canAffordArchery },
            { name: t('tower'), icon: 'tower', iconScale: 0.16, cost: TOWER_COST, type: 'tower', canAfford: () => this.canAffordTower },
            { name: t('monastery'), icon: 'monastery', iconScale: 0.16, cost: MONASTERY_COST, type: 'monastery', canAfford: () => this.canAffordMonastery },
        ];

        const pw = 170;
        const rowH = 50;
        const ph = rowH * items.length + 20;
        const panelX = 480;
        const panelY = 55 + ph / 2;

        this.panelBg = scene.add.rectangle(panelX, panelY, pw, ph, 0x3a2a14, 0.9)
            .setScrollFactor(0).setDepth(950).setStrokeStyle(2, 0xfef3c0);

        const startY = panelY - ((items.length - 1) * rowH) / 2;
        const createdElements = [];

        items.forEach((item, i) => {
            const rowY = startY + i * rowH;

            const icon = scene.add.image(panelX - 55, rowY, item.icon)
                .setScale(item.iconScale).setScrollFactor(0).setDepth(952);
            const btn = scene.add.image(panelX + 15, rowY, 'ui_btn_blue')
                .setScale(0.75, 0.65).setScrollFactor(0).setDepth(951).setInteractive();
            const label = scene.add.text(panelX + 15, rowY - 8, item.name, style)
                .setOrigin(0.5).setScrollFactor(0).setDepth(952);
            const cost = scene.add.text(panelX + 15, rowY + 8, `${item.cost}g`, { ...style, color: '#ffdd44' })
                .setOrigin(0.5).setScrollFactor(0).setDepth(952);

            this._setupItemButton(btn, item.type, item.canAfford);

            if (!item.canAfford()) {
                btn.setTexture('ui_btn_disable');
                icon.setAlpha(0.5);
                cost.setColor('#aa6666');
            }

            createdElements.push(icon, btn, label, cost);
        });

        this.panelElements = [this.backdrop, this.panelBg, ...createdElements];
    }

    closePanel() {
        for (const el of this.panelElements) {
            el.destroy();
        }
        this.panelElements = [];
        this.panelOpen = false;
    }

    _setupItemButton(btn, buildType, canAffordFn) {
        btn.on('pointerover', () => {
            if (canAffordFn()) btn.setTexture('ui_btn_hover');
        });
        btn.on('pointerout', () => {
            btn.setTexture(canAffordFn() ? 'ui_btn_blue' : 'ui_btn_disable');
        });
        btn.on('pointerdown', (pointer, _localX, _localY, event) => {
            event.stopPropagation();
            if (!canAffordFn()) return;
            if (this.scene.buildSystem.active) return;
            this.scene.buildSystem.enterBuildMode(buildType);
            this.closePanel();
        });
    }

    updateAffordState(gold) {
        this.canAffordMine = gold >= GOLDMINE_COST;
        this.canAffordBarracks = gold >= BARRACKS_COST;
        this.canAffordTower = gold >= TOWER_COST;
        this.canAffordArchery = gold >= ARCHERY_COST;
        this.canAffordHouse = gold >= HOUSE_COST;
        this.canAffordMonastery = gold >= MONASTERY_COST;
    }
}
