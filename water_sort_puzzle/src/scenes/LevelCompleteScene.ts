import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { WATER_COLORS } from '../utils/colors';
import { playWin } from '../utils/audio';

export class LevelCompleteScene extends Phaser.Scene {
  private level = 1;

  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  init(data?: { level?: number }): void {
    this.level = data?.level ?? 1;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    playWin();

    // Particle-like celebration: bouncing colored circles
    for (let i = 0; i < 12; i++) {
      const color = WATER_COLORS[i % WATER_COLORS.length];
      const circle = this.add.circle(
        Phaser.Math.Between(50, GAME_WIDTH - 50),
        Phaser.Math.Between(100, GAME_HEIGHT - 200),
        Phaser.Math.Between(8, 20),
        color,
        0.7,
      );

      this.tweens.add({
        targets: circle,
        y: circle.y - Phaser.Math.Between(40, 120),
        x: circle.x + Phaser.Math.Between(-60, 60),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(800, 1500),
        delay: Phaser.Math.Between(0, 500),
        ease: 'Quad.easeOut',
      });
    }

    // Congratulations text
    const congratsText = this.add.text(cx, GAME_HEIGHT * 0.3, 'Level Complete!', {
      fontSize: '44px',
      color: '#4ecca3',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: congratsText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Level number
    this.add.text(cx, GAME_HEIGHT * 0.4, `Level ${this.level}`, {
      fontSize: '24px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Next level button (with delay)
    const nextBtn = this.add.text(cx, GAME_HEIGHT * 0.6, 'Next Level', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: nextBtn,
      alpha: 1,
      duration: 400,
      delay: 800,
    });

    nextBtn.on('pointerover', () => nextBtn.setColor('#4ecca3'));
    nextBtn.on('pointerout', () => nextBtn.setColor('#ffffff'));
    nextBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { level: this.level + 1 });
    });
  }
}
