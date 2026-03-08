import Phaser from 'phaser';
import { Bottle } from '../objects/Bottle';
import { GameState } from '../systems/GameState';
import { PourAnimator } from '../systems/PourAnimator';
import { generateLevel, loadProgress, saveProgress } from '../systems/LevelGenerator';
import { GAME_WIDTH, GAME_HEIGHT, BOTTLE } from '../config/gameConfig';
import { playClick, playPour } from '../utils/audio';

export class GameScene extends Phaser.Scene {
  bottles: Bottle[] = [];
  private gameState!: GameState;
  private selectedIdx: number | null = null;
  private isAnimating = false;
  private pourAnimator!: PourAnimator;
  private level = 1;
  private initialData!: (number | null)[][];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { level?: number }): void {
    this.level = data?.level ?? loadProgress();
  }

  create(): void {
    this.bottles = [];
    this.selectedIdx = null;
    this.isAnimating = false;
    this.pourAnimator = new PourAnimator(this);

    // Level label
    this.add.text(GAME_WIDTH / 2, 40, `Level ${this.level}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Restart button
    const restartBtn = this.add.text(GAME_WIDTH - 20, 40, 'Restart', {
      fontSize: '20px',
      color: '#ff6b6b',
      fontFamily: 'Arial',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setColor('#ff9999'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#ff6b6b'));
    restartBtn.on('pointerdown', () => this.restartLevel());

    // Generate level
    this.initialData = generateLevel(this.level);
    this.gameState = new GameState(this.initialData);
    this.createBottles(this.gameState.bottles);
  }

  private restartLevel(): void {
    this.gameState = new GameState(this.initialData);
    this.syncBottles();
    this.selectedIdx = null;
    this.isAnimating = false;
  }

  createBottles(data: (number | null)[][]): void {
    this.bottles.forEach(b => b.destroy());
    this.bottles = [];

    const count = data.length;
    const maxPerRow = 5;
    const spacing = 85;
    const bottleFullH = BOTTLE.NECK_HEIGHT + BOTTLE.HEIGHT; // total visual height
    const rowGap = bottleFullH + 40; // gap between rows

    const rows = Math.ceil(count / maxPerRow);
    const totalHeight = rows * bottleFullH + (rows - 1) * 40;
    const topMargin = 80; // space for level label
    const baseY = topMargin + (GAME_HEIGHT - topMargin - totalHeight) / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / maxPerRow);
      const colCount = Math.min(count - row * maxPerRow, maxPerRow);
      const col = i % maxPerRow;
      const rowStartX = (GAME_WIDTH - (colCount - 1) * spacing) / 2;
      const x = rowStartX + col * spacing;
      const y = baseY + row * rowGap;

      const bottle = new Bottle(this, x, y, data[i]);
      bottle.on('pointerdown', () => this.onBottleClick(i));
      this.bottles.push(bottle);
    }
  }

  private onBottleClick(idx: number): void {
    if (this.isAnimating) return;

    if (this.selectedIdx === null) {
      if (this.gameState.isEmpty(idx)) return;
      this.selectedIdx = idx;
      this.bottles[idx].setSelected(true);
      playClick();
    } else if (this.selectedIdx === idx) {
      this.bottles[idx].setSelected(false);
      this.selectedIdx = null;
    } else {
      const fromIdx = this.selectedIdx;
      this.bottles[fromIdx].setSelected(false);
      this.selectedIdx = null;

      if (this.gameState.canPour(fromIdx, idx)) {
        this.executePourWithAnimation(fromIdx, idx);
      }
    }
  }

  private async executePourWithAnimation(fromIdx: number, toIdx: number): Promise<void> {
    this.isAnimating = true;

    const result = this.gameState.executePour(fromIdx, toIdx);
    if (!result) {
      this.isAnimating = false;
      return;
    }

    playPour();

    await this.pourAnimator.animate(
      this.bottles[fromIdx],
      this.bottles[toIdx],
      result,
      this.bottles,
      this.gameState.bottles,
    );

    this.syncBottles();
    this.isAnimating = false;

    if (this.gameState.checkWin()) {
      const nextLevel = this.level + 1;
      saveProgress(nextLevel);
      this.time.delayedCall(500, () => {
        this.scene.start('LevelCompleteScene', { level: this.level });
      });
    }
  }

  syncBottles(): void {
    for (let i = 0; i < this.bottles.length; i++) {
      this.bottles[i].layers = [...this.gameState.bottles[i]];
      this.bottles[i].redraw();
    }
  }
}
