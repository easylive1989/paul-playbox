import { PLATFORM_WIDTH, PLATFORM_HEIGHT, MOVING_SPEED, GAME_WIDTH } from '../config/gameConfig.js';

const TEXTURE_MAP = {
    normal: 'platform_normal',
    spike: 'platform_spike',
    moving: 'platform_moving',
};

export default class Platform extends Phaser.GameObjects.Image {
    constructor(scene, x, y, type = 'normal') {
        super(scene, x, y, TEXTURE_MAP[type] || 'platform_normal');

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body

        this.setDisplaySize(PLATFORM_WIDTH, PLATFORM_HEIGHT);

        this.platformType = type;
        this.moveDirection = 1;
        this.moveSpeed = MOVING_SPEED;

        // Spike indicator: red glow on top
        if (type === 'spike') {
            this.spikeIndicator = this.createSpikes(scene, x, y);
        }
    }

    createSpikes(scene, cx, cy) {
        const gfx = scene.add.graphics();
        this.drawSpikesAt(gfx, cx, cy);
        return gfx;
    }

    drawSpikesAt(gfx, cx, cy) {
        gfx.clear();
        const topY = cy - PLATFORM_HEIGHT / 2;
        const spikeW = 8;
        const spikeH = 8;
        const count = Math.floor(PLATFORM_WIDTH / spikeW);
        const totalW = count * spikeW;
        const startX = cx - totalW / 2;

        gfx.fillStyle(0xaaaaaa, 1);
        for (let i = 0; i < count; i++) {
            const sx = startX + i * spikeW;
            gfx.fillTriangle(
                sx, topY,
                sx + spikeW / 2, topY - spikeH,
                sx + spikeW, topY
            );
        }
    }

    updateMoving(delta) {
        if (this.platformType !== 'moving') return;

        const dx = this.moveSpeed * this.moveDirection * (delta / 1000);
        this.x += dx;
        this.body.x = this.x - PLATFORM_WIDTH / 2;

        if (this.spikeIndicator && this.spikeIndicator.visible) {
            this.drawSpikesAt(this.spikeIndicator, this.x, this.y);
        }

        // Bounce off walls
        if (this.x <= PLATFORM_WIDTH / 2) {
            this.moveDirection = 1;
        } else if (this.x >= GAME_WIDTH - PLATFORM_WIDTH / 2) {
            this.moveDirection = -1;
        }
    }

    reposition(x, y, type) {
        this.x = x;
        this.y = y;
        this.platformType = type;
        this.body.x = x - PLATFORM_WIDTH / 2;
        this.body.y = y - PLATFORM_HEIGHT / 2;

        // Update visual
        this.setTexture(TEXTURE_MAP[type] || 'platform_normal');
        this.setDisplaySize(PLATFORM_WIDTH, PLATFORM_HEIGHT);

        if (type === 'spike') {
            if (!this.spikeIndicator) {
                this.spikeIndicator = this.createSpikes(this.scene, x, y);
            } else {
                this.drawSpikesAt(this.spikeIndicator, x, y);
                this.spikeIndicator.setVisible(true);
            }
        } else {
            if (this.spikeIndicator) {
                this.spikeIndicator.setVisible(false);
            }
        }

        this.moveDirection = Math.random() < 0.5 ? 1 : -1;
    }

    scrollUp(amount) {
        this.y -= amount;
        this.body.y = this.y - PLATFORM_HEIGHT / 2;
        if (this.spikeIndicator && this.spikeIndicator.visible) {
            this.drawSpikesAt(this.spikeIndicator, this.x, this.y);
        }
    }

    destroy() {
        if (this.spikeIndicator) {
            this.spikeIndicator.destroy();
        }
        super.destroy();
    }
}
