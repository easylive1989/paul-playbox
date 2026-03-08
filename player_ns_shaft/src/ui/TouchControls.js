import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export default class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.direction = 0; // -1 left, 0 none, 1 right

        // Left zone
        this.leftZone = scene.add.rectangle(
            GAME_WIDTH / 4, GAME_HEIGHT / 2,
            GAME_WIDTH / 2, GAME_HEIGHT,
            0x000000, 0
        ).setInteractive().setDepth(5);

        // Right zone
        this.rightZone = scene.add.rectangle(
            GAME_WIDTH * 3 / 4, GAME_HEIGHT / 2,
            GAME_WIDTH / 2, GAME_HEIGHT,
            0x000000, 0
        ).setInteractive().setDepth(5);

        // Arrow indicators
        this.leftArrow = scene.add.text(40, GAME_HEIGHT - 60, '\u25C0', {
            fontSize: '32px', color: '#ffffff'
        }).setAlpha(0.2).setDepth(15);

        this.rightArrow = scene.add.text(GAME_WIDTH - 60, GAME_HEIGHT - 60, '\u25B6', {
            fontSize: '32px', color: '#ffffff'
        }).setAlpha(0.2).setDepth(15);

        // Touch events
        this.leftZone.on('pointerdown', () => { this.direction = -1; this.leftArrow.setAlpha(0.6); });
        this.rightZone.on('pointerdown', () => { this.direction = 1; this.rightArrow.setAlpha(0.6); });

        scene.input.on('pointerup', () => {
            this.direction = 0;
            this.leftArrow.setAlpha(0.2);
            this.rightArrow.setAlpha(0.2);
        });

        // Keyboard
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    getDirection() {
        // Keyboard overrides touch
        if (this.cursors.left.isDown || this.wasd.left.isDown) return -1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) return 1;
        return this.direction;
    }
}
