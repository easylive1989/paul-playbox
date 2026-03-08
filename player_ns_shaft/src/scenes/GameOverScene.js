import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        const score = data.score || 0;
        const highScore = data.highScore || 0;

        // Background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Game Over text
        this.add.text(GAME_WIDTH / 2, 200, 'GAME OVER', {
            fontSize: '40px',
            fontFamily: 'Georgia, serif',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Score
        this.add.text(GAME_WIDTH / 2, 300, `Floor: ${score}`, {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // High score
        this.add.text(GAME_WIDTH / 2, 350, `Best: ${highScore}`, {
            fontSize: '20px',
            color: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Death knight
        const knight = this.add.sprite(GAME_WIDTH / 2, 450, 'knight_death');
        knight.setScale(2);
        if (this.anims.exists('knight_death')) {
            knight.play('knight_death');
        }

        // Restart prompt
        const prompt = this.add.text(GAME_WIDTH / 2, 560, 'Tap or Press Enter to Retry', {
            fontSize: '18px',
            color: '#cccccc'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: prompt,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Delay input to prevent accidental restart
        this.time.delayedCall(500, () => {
            this.input.once('pointerdown', () => this.restart());
            this.input.keyboard.once('keydown-ENTER', () => this.restart());
            this.input.keyboard.once('keydown-SPACE', () => this.restart());
        });
    }

    restart() {
        this.scene.start('GameScene');
    }
}
