import { GAME_WIDTH, KNIGHT_MAX_HP } from '../config/gameConfig.js';

export default class HUD {
    constructor(scene) {
        this.scene = scene;

        // HP display
        this.hpText = scene.add.text(16, 8, '', {
            fontSize: '16px',
            color: '#ff6666',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(20);

        // Score display
        this.scoreText = scene.add.text(GAME_WIDTH - 16, 8, 'Floor: 0', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(1, 0).setDepth(20);

        this.updateHP(KNIGHT_MAX_HP);
    }

    updateHP(hp) {
        let hearts = '';
        for (let i = 0; i < KNIGHT_MAX_HP; i++) {
            hearts += i < hp ? '\u2665 ' : '\u2661 ';
        }
        this.hpText.setText(hearts.trim());
    }

    updateScore(score) {
        this.scoreText.setText(`Floor: ${score}`);
    }
}
