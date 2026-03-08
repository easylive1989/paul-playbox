import { spritesheets, images } from '../config/assetManifest.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const barW = 300;
        const barH = 20;

        const bg = this.add.rectangle(cx, cy, barW, barH, 0x222222);
        const fill = this.add.rectangle(cx - barW / 2, cy, 0, barH, 0x44aa44);
        fill.setOrigin(0, 0.5);

        const label = this.add.text(cx, cy - 30, 'Loading...', {
            fontSize: '16px', color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            fill.width = barW * value;
            label.setText(`Loading... ${Math.round(value * 100)}%`);
        });

        this.load.on('complete', () => {
            bg.destroy();
            fill.destroy();
            label.destroy();
        });

        for (const s of spritesheets) {
            this.load.spritesheet(s.key, s.path, {
                frameWidth: s.frameWidth,
                frameHeight: s.frameHeight
            });
        }

        for (const img of images) {
            this.load.image(img.key, img.path);
        }
    }

    create() {
        // Extract tiles with exact pixel boundaries (no transparency)
        // Orange tile: x=16, y=16, w=48, h=35
        this.createPlatformTexture('platform_normal', 16, 16, 48, 35);
        // Blue tile: x=16, y=160, w=48, h=41
        this.createPlatformTexture('platform_spike', 16, 160, 48, 41);
        // Moving: use second row orange tile
        this.createPlatformTexture('platform_moving', 16, 16, 48, 35);

        this.scene.start('TitleScene');
    }

    createPlatformTexture(key, sx, sy, sw, sh) {
        const src = this.textures.get('tiles').getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
        this.textures.addCanvas(key, canvas);
    }
}
