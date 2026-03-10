import Phaser from 'phaser';
import { LevelSystem, LEVELS } from '../systems/LevelSystem';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const levelSystem = new LevelSystem();
    const cleared = levelSystem.getClearedLevel();

    // Background
    this.add.graphics().fillStyle(0x0a0a1a, 1).fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, 40, '選擇關卡', {
      fontSize: '32px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backText = this.add.text(30, 30, '← 返回', {
      fontSize: '16px',
      color: '#8888aa',
    }).setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => this.scene.start('MenuScene'));
    backText.on('pointerover', () => backText.setColor('#ffffff'));
    backText.on('pointerout', () => backText.setColor('#8888aa'));

    // Level cards grid
    const cols = 3;
    const cardW = 200;
    const cardH = 140;
    const gapX = 30;
    const gapY = 20;
    const startX = (width - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = 90;

    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const isUnlocked = level.level <= cleared + 1;
      const isCleared = level.level <= cleared;

      this.drawLevelCard(x, y, cardW, cardH, level.level, level, isUnlocked, isCleared);
    }

    // Deck info
    const deck = levelSystem.getCurrentDeck();
    this.add.text(width / 2, height - 50, `卡組: ${deck.length} 張卡牌`, {
      fontSize: '14px',
      color: '#6688aa',
    }).setOrigin(0.5);
  }

  private drawLevelCard(
    x: number, y: number, w: number, h: number,
    levelNum: number, level: typeof LEVELS[0],
    unlocked: boolean, cleared: boolean
  ): void {
    const g = this.add.graphics();

    if (unlocked) {
      g.fillStyle(cleared ? 0x1a2a1a : 0x1a1a2e, 1);
      g.lineStyle(2, cleared ? 0x00ff88 : 0x4466aa);
    } else {
      g.fillStyle(0x111118, 1);
      g.lineStyle(1, 0x333344);
    }
    g.fillRoundedRect(x, y, w, h, 10);
    g.strokeRoundedRect(x, y, w, h, 10);

    // Level number
    const titleColor = unlocked ? '#ffffff' : '#555566';
    this.add.text(x + w / 2, y + 20, `關卡 ${levelNum}`, {
      fontSize: '20px',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (cleared) {
      this.add.text(x + w - 15, y + 15, '✓', {
        fontSize: '18px',
        color: '#00ff88',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Target
    this.add.text(x + w / 2, y + 50, `目標: $${level.targetValue.toLocaleString()}`, {
      fontSize: '14px',
      color: unlocked ? '#ffcc00' : '#444455',
    }).setOrigin(0.5);

    // Candle limit
    this.add.text(x + w / 2, y + 72, `${level.maxCandles} 根K棒`, {
      fontSize: '13px',
      color: unlocked ? '#8888aa' : '#333344',
    }).setOrigin(0.5);

    // Hint
    this.add.text(x + w / 2, y + 95, level.hint, {
      fontSize: '11px',
      color: unlocked ? '#666688' : '#333344',
      wordWrap: { width: w - 20 },
      align: 'center',
    }).setOrigin(0.5);

    if (!unlocked) {
      this.add.text(x + w / 2, y + 120, '🔒', {
        fontSize: '16px',
      }).setOrigin(0.5);
      return;
    }

    // Click to start
    const hitArea = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => {
      g.clear();
      g.fillStyle(cleared ? 0x223322 : 0x222244, 1);
      g.lineStyle(2, cleared ? 0x00ff88 : 0x6688cc);
      g.fillRoundedRect(x, y, w, h, 10);
      g.strokeRoundedRect(x, y, w, h, 10);
    });
    hitArea.on('pointerout', () => {
      g.clear();
      g.fillStyle(cleared ? 0x1a2a1a : 0x1a1a2e, 1);
      g.lineStyle(2, cleared ? 0x00ff88 : 0x4466aa);
      g.fillRoundedRect(x, y, w, h, 10);
      g.strokeRoundedRect(x, y, w, h, 10);
    });
    hitArea.on('pointerdown', () => {
      this.scene.start('GameScene', { level: levelNum });
    });
  }
}
