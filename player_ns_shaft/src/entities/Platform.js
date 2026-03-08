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
            this.spikeIndicator = scene.add.rectangle(x, y - PLATFORM_HEIGHT / 2 - 2, PLATFORM_WIDTH, 4, 0xff4444);
        }
    }

    updateMoving(delta) {
        if (this.platformType !== 'moving') return;

        const dx = this.moveSpeed * this.moveDirection * (delta / 1000);
        this.x += dx;
        this.body.x = this.x - PLATFORM_WIDTH / 2;

        if (this.spikeIndicator) {
            this.spikeIndicator.x = this.x;
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
                this.spikeIndicator = this.scene.add.rectangle(x, y - PLATFORM_HEIGHT / 2 - 2, PLATFORM_WIDTH, 4, 0xff4444);
            } else {
                this.spikeIndicator.setPosition(x, y - PLATFORM_HEIGHT / 2 - 2);
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
        if (this.spikeIndicator) {
            this.spikeIndicator.y = this.y - PLATFORM_HEIGHT / 2 - 2;
        }
    }

    destroy() {
        if (this.spikeIndicator) {
            this.spikeIndicator.destroy();
        }
        super.destroy();
    }
}
