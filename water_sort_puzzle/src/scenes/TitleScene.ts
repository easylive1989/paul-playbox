import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { WATER_COLORS } from '../utils/colors';
import { loadProgress } from '../systems/LevelGenerator';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    // Decorative bottles in background
    this.drawDecorativeBottle(cx - 100, 200, WATER_COLORS[0], WATER_COLORS[1]);
    this.drawDecorativeBottle(cx, 180, WATER_COLORS[2], WATER_COLORS[3]);
    this.drawDecorativeBottle(cx + 100, 210, WATER_COLORS[4], WATER_COLORS[5]);

    // Title
    this.add.text(cx, GAME_HEIGHT * 0.45, 'Water Sort\nPuzzle', {
      fontSize: '52px',
      color: '#ffffff',
      align: 'center',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Start button
    const level = loadProgress();
    const label = level > 1 ? `Continue (Lv.${level})` : 'Start';

    const startBtn = this.add.text(cx, GAME_HEIGHT * 0.65, label, {
      fontSize: '32px',
      color: '#4ecca3',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#7effc8'));
    startBtn.on('pointerout', () => startBtn.setColor('#4ecca3'));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { level });
    });

    // Pulsing animation on button
    this.tweens.add({
      targets: startBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawDecorativeBottle(x: number, y: number, color1: number, color2: number): void {
    const g = this.add.graphics();
    g.setAlpha(0.3);
    const hw = 15;
    const hb = 25;
    const h = 80;
    const neck = 10;

    // Bottle outline
    g.lineStyle(2, 0xcccccc);
    g.beginPath();
    g.moveTo(x - hw, y);
    g.lineTo(x - hw, y + neck);
    g.lineTo(x - hb, y + neck + h);
    g.lineTo(x + hb, y + neck + h);
    g.lineTo(x + hw, y + neck);
    g.lineTo(x + hw, y);
    g.strokePath();

    // Water layers
    g.fillStyle(color1);
    g.fillRect(x - hb, y + neck + h / 2, hb * 2, h / 2);
    g.fillStyle(color2);
    g.fillRect(x - hb + 3, y + neck + 5, hb * 2 - 6, h / 2 - 5);
  }
}
