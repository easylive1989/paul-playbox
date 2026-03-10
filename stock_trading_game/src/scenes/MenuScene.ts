import Phaser from 'phaser';
import { LevelSystem } from '../systems/LevelSystem';
import { STARTER_DECK_IDS } from '../systems/CardSystem';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Initialize starter cards on first play
    const levelSystem = new LevelSystem();
    levelSystem.initStarterCards(STARTER_DECK_IDS);

    // Background gradient effect
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative lines (fake chart in background)
    this.drawDecorativeChart(bg, width, height);

    // Title
    this.add.text(width / 2, 140, 'STOCK CARD\nTRADER', {
      fontSize: '52px',
      color: '#00ff88',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 240, '用卡牌操控市場，達成目標金額', {
      fontSize: '16px',
      color: '#8888aa',
    }).setOrigin(0.5);

    // Start button
    this.createButton(width / 2, 340, '開始遊戲', 0x008844, () => {
      this.scene.start('LevelSelectScene');
    });

    // Reset progress button
    this.createButton(width / 2, 420, '重置進度', 0x663333, () => {
      const ls = new LevelSystem();
      ls.resetProgress();
      ls.initStarterCards(STARTER_DECK_IDS);
      // Flash confirmation
      const confirmText = this.add.text(width / 2, 470, '進度已重置！', {
        fontSize: '14px',
        color: '#ff8888',
      }).setOrigin(0.5);
      this.time.delayedCall(1500, () => confirmText.destroy());
    });

    // Version
    this.add.text(width / 2, height - 30, 'v2.0 - Card Edition', {
      fontSize: '11px',
      color: '#444466',
    }).setOrigin(0.5);
  }

  private drawDecorativeChart(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    g.lineStyle(1, 0x112233, 0.3);
    let y = h / 2;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x < w; x += 8) {
      y += (Math.random() - 0.48) * 12;
      y = Math.max(100, Math.min(h - 100, y));
      g.lineTo(x, y);
    }
    g.strokePath();
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - 120, y - 25, 240, 50, 10);

    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, 240, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', onClick);
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 0.7);
      bg.fillRoundedRect(x - 120, y - 25, 240, 50, 10);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x - 120, y - 25, 240, 50, 10);
    });
  }
}
