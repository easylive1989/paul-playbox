import { spritesheets, images } from '../config/assetManifest.js';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';
import { t } from '../i18n/i18n.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Opaque background (canvas is transparent globally for LandingScene video)
        this.cameras.main.setBackgroundColor('#525B66');

        // Progress bar
        const cx = VIEWPORT_WIDTH / 2;
        const cy = VIEWPORT_HEIGHT / 2;
        const barW = 400;
        const barH = 30;

        const bg = this.add.rectangle(cx, cy, barW, barH, 0x222222);
        const fill = this.add.rectangle(cx - barW / 2, cy, 0, barH, 0x44aa44);
        fill.setOrigin(0, 0.5);

        const label = this.add.text(cx, cy - 40, t('loading'), {
            fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            fill.width = barW * value;
            label.setText(t('loadingPct', { pct: Math.round(value * 100) }));
        });

        this.load.on('complete', () => {
            bg.destroy();
            fill.destroy();
            label.destroy();
        });

        // Load all spritesheets
        for (const s of spritesheets) {
            this.load.spritesheet(s.key, s.path, {
                frameWidth: s.frameWidth,
                frameHeight: s.frameHeight
            });
        }

        // Load all images
        for (const img of images) {
            this.load.image(img.key, img.path);
        }

    }

    create() {
        console.log('Boot OK — all assets loaded');
        this.scene.start('LandingScene');
        this.scene.stop();
    }
}
