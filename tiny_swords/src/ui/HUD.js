import { t } from '../i18n/i18n.js';

export default class HUD {
    constructor(scene, eventBus) {
        this.scene = scene;
        this.eventBus = eventBus;

        const style = { fontSize: '16px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // --- Left: Gold display ---
        const pad = 16;
        scene.add.image(108 + pad, 30, 'ui_carved').setScale(1.15, 0.8)
            .setScrollFactor(0).setDepth(999);
        scene.add.image(30 + pad, 30, 'ui_icon_coin').setScale(0.5)
            .setScrollFactor(0).setDepth(1000);
        this.goldText = scene.add.text(58 + pad, 21, '100', style)
            .setScrollFactor(0).setDepth(1000);

        // --- Left: Population display (next to gold) ---
        const popOffsetX = 220;
        scene.add.image(108 + pad + popOffsetX, 30, 'ui_carved').setScale(1.15, 0.8)
            .setScrollFactor(0).setDepth(999);
        scene.add.image(30 + pad + popOffsetX, 30, 'ui_icon_sword').setScale(0.5)
            .setScrollFactor(0).setDepth(1000);
        this.popText = scene.add.text(58 + pad + popOffsetX, 21, '0/10', style)
            .setScrollFactor(0).setDepth(1000);

        // --- Center: Wave display ---
        scene.add.image(640, 28, 'ui_ribbon_yellow').setScale(1.3, 0.85)
            .setScrollFactor(0).setDepth(999);
        this.waveText = scene.add.text(640, 24, t('waveCount', { wave: 0 }), { ...style, fontSize: '18px' })
            .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1000);

        // --- Right: Timer display ---
        scene.add.image(1172 - pad, 30, 'ui_carved').setScale(1.15, 0.8)
            .setScrollFactor(0).setDepth(999);
        this.timerText = scene.add.text(1245 - pad, 21, t('nextWave', { sec: 60 }), style)
            .setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        // Listen for gold changes
        eventBus.on('goldChanged', (gold) => {
            this.goldText.setText(`${gold}`);
        });

        // Listen for population changes
        eventBus.on('popChanged', (used, cap) => {
            this.popText.setText(`${used}/${cap}`);
        });

        // Listen for wave changes
        eventBus.on('waveChanged', (wave) => {
            this.waveText.setText(t('waveCount', { wave }));
        });
    }

    updateTimer(seconds) {
        if (seconds <= 0) {
            this.timerText.setText(t('waveIncoming'));
            this.timerText.setColor('#ff6644');
        } else {
            this.timerText.setText(t('nextWave', { sec: Math.ceil(seconds) }));
            this.timerText.setColor('#fef3c0');
        }
    }

    showVictory() {
        this.timerText.setText(t('victoryHud'));
    }

    showDefeat() {
        this.timerText.setText(t('defeatHud'));
    }
}
