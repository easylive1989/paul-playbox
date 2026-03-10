import Phaser from 'phaser';
import { LevelSystem } from '../systems/LevelSystem';
import { getRandomRewardCards, CardDef, rarityColor } from '../systems/CardSystem';

export class RewardScene extends Phaser.Scene {
  private level!: number;
  private totalValue!: number;
  private candleCount!: number;

  constructor() {
    super({ key: 'RewardScene' });
  }

  init(data: { level: number; totalValue: number; candleCount: number }): void {
    this.level = data.level;
    this.totalValue = data.totalValue;
    this.candleCount = data.candleCount;
  }

  create(): void {
    const { width, height } = this.scale;
    const levelSystem = new LevelSystem();

    // Mark level as cleared
    levelSystem.clearLevel(this.level);

    // Background
    this.add.graphics().fillStyle(0x0a0a1a, 1).fillRect(0, 0, width, height);

    // Victory text
    this.add.text(width / 2, 50, '關卡通過！', {
      fontSize: '36px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stats
    this.add.text(width / 2, 100, `關卡 ${this.level} | 最終資產: $${this.totalValue.toLocaleString()} | K棒: ${this.candleCount}`, {
      fontSize: '15px',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Reward cards
    this.add.text(width / 2, 150, '選擇一張新卡牌加入卡組', {
      fontSize: '18px',
      color: '#ffcc00',
    }).setOrigin(0.5);

    const rewards = getRandomRewardCards(3);
    const cardW = 180;
    const cardH = 240;
    const gap = 30;
    const totalW = rewards.length * cardW + (rewards.length - 1) * gap;
    const startX = (width - totalW) / 2;

    for (let i = 0; i < rewards.length; i++) {
      const card = rewards[i];
      const cx = startX + i * (cardW + gap) + cardW / 2;
      const cy = 300;
      this.drawRewardCard(cx, cy, cardW, cardH, card, levelSystem);
    }

    // Skip button
    const skipText = this.add.text(width / 2, height - 60, '跳過 →', {
      fontSize: '16px',
      color: '#666688',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skipText.on('pointerdown', () => this.goNext());
    skipText.on('pointerover', () => skipText.setColor('#ffffff'));
    skipText.on('pointerout', () => skipText.setColor('#666688'));
  }

  private drawRewardCard(
    cx: number, cy: number, w: number, h: number,
    card: CardDef, levelSystem: LevelSystem
  ): void {
    const x = cx - w / 2;
    const y = cy - h / 2;
    const color = rarityColor(card.rarity);

    const g = this.add.graphics();
    g.fillStyle(0x1a1a2e, 1);
    g.lineStyle(3, color);
    g.fillRoundedRect(x, y, w, h, 12);
    g.strokeRoundedRect(x, y, w, h, 12);

    // Rarity badge
    const rarityLabels = { common: '普通', rare: '稀有', epic: '史詩' };
    this.add.text(cx, y + 20, rarityLabels[card.rarity], {
      fontSize: '11px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Card name
    this.add.text(cx, y + 50, card.nameCn, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, y + 75, card.name, {
      fontSize: '12px',
      color: '#888899',
    }).setOrigin(0.5);

    // Description
    this.add.text(cx, y + 120, card.description, {
      fontSize: '13px',
      color: '#aaaacc',
      wordWrap: { width: w - 24 },
      align: 'center',
    }).setOrigin(0.5);

    // Duration
    if (card.duration > 0) {
      this.add.text(cx, y + 165, `持續: ${card.duration} 根K棒`, {
        fontSize: '11px',
        color: '#666688',
      }).setOrigin(0.5);
    }

    // Click to select
    const hitArea = this.add.rectangle(cx, cy, w, h, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => {
      g.clear();
      g.fillStyle(0x222244, 1);
      g.lineStyle(3, 0xffffff);
      g.fillRoundedRect(x, y, w, h, 12);
      g.strokeRoundedRect(x, y, w, h, 12);
    });
    hitArea.on('pointerout', () => {
      g.clear();
      g.fillStyle(0x1a1a2e, 1);
      g.lineStyle(3, color);
      g.fillRoundedRect(x, y, w, h, 12);
      g.strokeRoundedRect(x, y, w, h, 12);
    });
    hitArea.on('pointerdown', () => {
      // Add card to collection and deck
      levelSystem.addCard(card.id);
      const deck = levelSystem.getCurrentDeck();
      deck.push(card.id);
      levelSystem.setCurrentDeck(deck);
      this.goNext();
    });
  }

  private goNext(): void {
    const levelSystem = new LevelSystem();
    const maxLevel = levelSystem.getMaxLevel();
    if (this.level >= maxLevel) {
      // All levels cleared!
      this.scene.start('MenuScene');
    } else {
      this.scene.start('LevelSelectScene');
    }
  }
}
