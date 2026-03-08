import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        // Background
        const bgSolid = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_solid');
        bgSolid.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        const bgStars = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_stars');
        bgStars.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        bgStars.setAlpha(0.6);

        // Title
        this.add.text(GAME_WIDTH / 2, 180, 'Knight Going\nDownstairs', {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Knight idle preview
        this.anims.create({
            key: 'title_idle',
            frames: this.anims.generateFrameNumbers('knight_idle', { start: 0, end: 9 }),
            frameRate: 8,
            repeat: -1
        });

        const knight = this.add.sprite(GAME_WIDTH / 2, 360, 'knight_idle');
        knight.setScale(2);
        knight.play('title_idle');

        // Prompt
        const prompt = this.add.text(GAME_WIDTH / 2, 520, 'Tap or Press Enter to Start', {
            fontSize: '18px',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        // Blink prompt
        this.tweens.add({
            targets: prompt,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Input
        this.input.once('pointerdown', () => this.startGame());
        this.input.keyboard.once('keydown-ENTER', () => this.startGame());
        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    }

    startGame() {
        this.scene.start('GameScene');
    }
}
