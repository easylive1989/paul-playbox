import Phaser from 'phaser';
import { PriceGenerator } from '../systems/PriceGenerator';
import { TradingSystem } from '../systems/TradingSystem';
import { CandlestickChart } from '../objects/CandlestickChart';
import { CardSystem, getCardDef, CardDef, rarityColor } from '../systems/CardSystem';
import { LevelSystem, LevelDef } from '../systems/LevelSystem';

const TICK_INTERVAL = 5000;

export class GameScene extends Phaser.Scene {
  private priceGenerator!: PriceGenerator;
  private tradingSystem!: TradingSystem;
  private cardSystem!: CardSystem;
  private chart!: CandlestickChart;
  private tickTimer!: Phaser.Time.TimerEvent;
  private candleCount: number = 0;
  private gameOver: boolean = false;
  private levelCleared: boolean = false;
  private frozen: boolean = false;

  // Level
  private currentLevel!: number;
  private levelDef!: LevelDef;

  // HUD texts
  private cashText!: Phaser.GameObjects.Text;
  private sharesText!: Phaser.GameObjects.Text;
  private plText!: Phaser.GameObjects.Text;
  private priceText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private candleCountText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private tickElapsed: number = 0;

  // Buttons
  private buyBtn!: Phaser.GameObjects.Container;
  private sellBtn!: Phaser.GameObjects.Container;
  private shortBtn!: Phaser.GameObjects.Container;
  private coverBtn!: Phaser.GameObjects.Container;

  // Card UI
  private handContainer!: Phaser.GameObjects.Container;
  private effectsText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private deckInfoText!: Phaser.GameObjects.Text;

  // Overlay
  private overlay!: Phaser.GameObjects.Container;

  // Short sell enabled this turn
  private shortEnabled: boolean = false;

  // ── Test helpers (public getters for E2E) ──
  get __testState() {
    const price = this.priceGenerator?.getCurrentPrice() ?? 0;
    return {
      candleCount: this.candleCount,
      gameOver: this.gameOver,
      levelCleared: this.levelCleared,
      currentLevel: this.currentLevel,
      cash: this.tradingSystem?.getCash() ?? 0,
      shares: this.tradingSystem?.getShares() ?? 0,
      isHolding: this.tradingSystem?.isHolding() ?? false,
      isShort: this.tradingSystem?.isShort() ?? false,
      totalValue: this.tradingSystem?.getTotalValue(price) ?? 0,
      targetValue: this.levelDef?.targetValue ?? 0,
      maxCandles: this.levelDef?.maxCandles ?? 0,
      handSize: this.cardSystem?.getHand().length ?? 0,
      drawPileSize: this.cardSystem?.getDrawPileSize() ?? 0,
      discardPileSize: this.cardSystem?.getDiscardPileSize() ?? 0,
      frozen: this.frozen,
      shortEnabled: this.shortEnabled,
      price,
    };
  }

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { level?: number }): void {
    this.currentLevel = data.level || 1;
  }

  create(): void {
    this.gameOver = false;
    this.levelCleared = false;
    this.candleCount = 0;
    this.tickElapsed = 0;
    this.frozen = false;
    this.shortEnabled = false;

    // Load level
    const levelSystem = new LevelSystem();
    const def = levelSystem.getLevelDef(this.currentLevel);
    if (!def) {
      this.scene.start('LevelSelectScene');
      return;
    }
    this.levelDef = def;

    this.priceGenerator = new PriceGenerator(def.startPrice);
    this.tradingSystem = new TradingSystem(def.startCash);

    // Load deck
    const deck = levelSystem.getCurrentDeck();
    this.cardSystem = new CardSystem(deck);

    // Chart area (slightly smaller to make room for cards)
    this.chart = new CandlestickChart(this, 20, 75, 760, 310);

    // HUD
    this.createHUD();

    // Buttons
    this.createButtons();

    // Card UI
    this.createCardUI();

    // Timer bar
    this.timerBar = this.add.graphics();

    // Start ticking
    this.tickTimer = this.time.addEvent({
      delay: TICK_INTERVAL,
      callback: this.onTick,
      callbackScope: this,
      loop: true,
    });

    // Generate first candle + draw first hand
    this.onTick();
    this.updateHUD();
  }

  // ── HUD ──────────────────────────────────────────────────────

  private createHUD(): void {
    const s = { fontSize: '13px', color: '#ffffff' };

    // Top bar
    this.levelText = this.add.text(20, 10, '', {
      fontSize: '16px',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    this.targetText = this.add.text(20, 32, '', {
      fontSize: '12px',
      color: '#ffcc00',
    });
    this.candleCountText = this.add.text(250, 10, '', {
      fontSize: '13px',
      color: '#aaaacc',
    });

    this.cashText = this.add.text(250, 32, '', s);
    this.sharesText = this.add.text(440, 10, '', s);
    this.plText = this.add.text(440, 32, '', s);
    this.priceText = this.add.text(650, 10, '', {
      fontSize: '16px',
      color: '#ffcc00',
      fontStyle: 'bold',
    });

    // Effects indicator
    this.effectsText = this.add.text(650, 32, '', {
      fontSize: '11px',
      color: '#aa88ff',
    });

    // Insider hint
    this.hintText = this.add.text(20, 55, '', {
      fontSize: '12px',
      color: '#ff88ff',
    });
  }

  // ── Buttons ──────────────────────────────────────────────────

  private createButton(
    x: number, y: number, w: number, label: string, color: number, onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -18, w, 36, 6);
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(text);

    const hitArea = this.add.rectangle(0, 0, w, 36, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerdown', onClick);
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 0.7);
      bg.fillRoundedRect(-w / 2, -18, w, 36, 6);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-w / 2, -18, w, 36, 6);
    });

    return container;
  }

  private createButtons(): void {
    const btnY = 540;
    this.buyBtn = this.createButton(120, btnY, 100, '買入', 0x008844, () => this.onBuy());
    this.sellBtn = this.createButton(230, btnY, 100, '賣出', 0xcc3333, () => this.onSell());
    this.shortBtn = this.createButton(340, btnY, 100, '做空', 0x884400, () => this.onShort());
    this.coverBtn = this.createButton(450, btnY, 100, '回補', 0x886600, () => this.onCover());

    this.shortBtn.setAlpha(0.2);
    this.coverBtn.setAlpha(0.2);
  }

  // ── Card UI ──────────────────────────────────────────────────

  private createCardUI(): void {
    this.handContainer = this.add.container(0, 0);

    this.deckInfoText = this.add.text(680, 540, '', {
      fontSize: '11px',
      color: '#6688aa',
    }).setOrigin(0.5);
  }

  private renderHand(): void {
    this.handContainer.removeAll(true);

    const hand = this.cardSystem.getHand();
    const cardW = 120;
    const cardH = 80;
    const gap = 10;
    const startX = 540;
    const startY = 395;

    for (let i = 0; i < hand.length; i++) {
      const def = getCardDef(hand[i]);
      if (!def) continue;

      const cx = startX + i * (cardW + gap);
      const cy = startY;

      this.drawHandCard(cx, cy, cardW, cardH, def, i);
    }

    this.deckInfoText.setText(
      `牌堆:${this.cardSystem.getDrawPileSize()} 棄牌:${this.cardSystem.getDiscardPileSize()}`
    );
  }

  private drawHandCard(
    x: number, y: number, w: number, h: number, card: CardDef, index: number
  ): void {
    const color = rarityColor(card.rarity);
    const g = this.add.graphics();
    g.fillStyle(0x1a1a2e, 1);
    g.lineStyle(2, color);
    g.fillRoundedRect(x, y, w, h, 8);
    g.strokeRoundedRect(x, y, w, h, 8);
    this.handContainer.add(g);

    const nameText = this.add.text(x + w / 2, y + 18, card.nameCn, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.handContainer.add(nameText);

    const descText = this.add.text(x + w / 2, y + 42, card.description, {
      fontSize: '9px',
      color: '#aaaacc',
      wordWrap: { width: w - 10 },
      align: 'center',
    }).setOrigin(0.5);
    this.handContainer.add(descText);

    if (card.duration > 0) {
      const durText = this.add.text(x + w / 2, y + h - 12, `${card.duration}回合`, {
        fontSize: '9px',
        color: '#666688',
      }).setOrigin(0.5);
      this.handContainer.add(durText);
    }

    // Click to play
    const hitArea = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.handContainer.add(hitArea);

    hitArea.on('pointerover', () => {
      g.clear();
      g.fillStyle(0x222244, 1);
      g.lineStyle(2, 0xffffff);
      g.fillRoundedRect(x, y, w, h, 8);
      g.strokeRoundedRect(x, y, w, h, 8);
    });
    hitArea.on('pointerout', () => {
      g.clear();
      g.fillStyle(0x1a1a2e, 1);
      g.lineStyle(2, color);
      g.fillRoundedRect(x, y, w, h, 8);
      g.strokeRoundedRect(x, y, w, h, 8);
    });
    hitArea.on('pointerdown', () => {
      this.playCard(index);
    });
  }

  // ── Card Logic ──────────────────────────────────────────────

  private playCard(handIndex: number): void {
    if (this.gameOver || this.levelCleared) return;

    const played = this.cardSystem.playCard(handIndex);
    if (!played) return;

    // Handle instant effects
    switch (played.effectType) {
      case 'insider_info': {
        const hint = this.priceGenerator.getScenarioHint();
        const arrow = hint.trendDirection === 'up' ? '↑' : hint.trendDirection === 'down' ? '↓' : '→';
        this.hintText.setText(
          `內線: 趨勢 ${arrow} (${hint.name}) 剩餘 ${hint.remainingCandles} 根K棒`
        );
        this.time.delayedCall(15000, () => this.hintText.setText(''));
        break;
      }
      case 'time_freeze': {
        this.frozen = true;
        this.tickTimer.paused = true;
        const freezeText = this.add.text(400, 240, '⏸ 時間暫停', {
          fontSize: '28px',
          color: '#88ccff',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.time.delayedCall(played.value, () => {
          this.frozen = false;
          this.tickTimer.paused = false;
          freezeText.destroy();
        });
        break;
      }
      case 'leverage_2x':
        this.tradingSystem.setLeverage(played.value);
        break;
      case 'short_sell':
        this.shortEnabled = true;
        break;
      case 'half_position':
        this.tradingSystem.setPositionRatio(played.value);
        break;
    }

    // Flash effect text
    this.showCardPlayEffect(played);
    this.renderHand();
    this.updateHUD();
  }

  private showCardPlayEffect(card: CardDef): void {
    const flash = this.add.text(400, 200, `${card.nameCn}！`, {
      fontSize: '24px',
      color: `#${rarityColor(card.rarity).toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(1);

    this.tweens.add({
      targets: flash,
      y: 160,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  // ── Game Loop ────────────────────────────────────────────────

  private onTick(): void {
    if (this.gameOver || this.levelCleared) return;

    // Generate candle with active card effects
    const effects = this.cardSystem.getActiveEffects();
    const candle = this.priceGenerator.nextCandle(effects);
    this.chart.addCandle(candle);
    this.candleCount++;
    this.tickElapsed = 0;

    // Tick effects (decrease remaining candles)
    this.cardSystem.tickEffects();

    // Check stop loss
    const stopLoss = this.cardSystem.hasActiveEffect('stop_loss');
    if (stopLoss) {
      const price = this.priceGenerator.getCurrentPrice();
      if (this.tradingSystem.checkStopLoss(price, stopLoss.value)) {
        if (this.tradingSystem.isHolding()) {
          this.tradingSystem.sell(price);
        } else if (this.tradingSystem.isShort()) {
          this.tradingSystem.coverShort(price);
        }
      }
    }

    // Reset per-turn modifiers
    this.shortEnabled = false;
    this.tradingSystem.resetModifiers();

    // Check game over
    const currentPrice = this.priceGenerator.getCurrentPrice();
    if (this.tradingSystem.isGameOver(currentPrice)) {
      this.triggerGameOver();
      return;
    }

    // Check level cleared
    const totalValue = this.tradingSystem.getTotalValue(currentPrice);
    if (totalValue >= this.levelDef.targetValue) {
      this.triggerLevelCleared();
      return;
    }

    // Check candle limit
    if (this.levelDef.maxCandles > 0 && this.candleCount >= this.levelDef.maxCandles) {
      if (totalValue >= this.levelDef.targetValue) {
        this.triggerLevelCleared();
      } else {
        this.triggerGameOver();
      }
      return;
    }

    // Draw new hand
    this.cardSystem.discardHand();
    this.cardSystem.drawHand();

    this.renderHand();
    this.updateHUD();
  }

  // ── Trading ──────────────────────────────────────────────────

  private onBuy(): void {
    if (this.gameOver || this.levelCleared) return;
    const price = this.priceGenerator.getCurrentPrice();
    if (this.tradingSystem.buy(price)) {
      this.updateHUD();
    }
  }

  private onSell(): void {
    if (this.gameOver || this.levelCleared) return;
    const price = this.priceGenerator.getCurrentPrice();
    if (this.tradingSystem.sell(price)) {
      this.updateHUD();
    }
  }

  private onShort(): void {
    if (this.gameOver || this.levelCleared || !this.shortEnabled) return;
    const price = this.priceGenerator.getCurrentPrice();
    if (this.tradingSystem.short(price)) {
      this.updateHUD();
    }
  }

  private onCover(): void {
    if (this.gameOver || this.levelCleared) return;
    const price = this.priceGenerator.getCurrentPrice();
    if (this.tradingSystem.coverShort(price)) {
      this.updateHUD();
    }
  }

  // ── HUD Update ───────────────────────────────────────────────

  private updateHUD(): void {
    const price = this.priceGenerator.getCurrentPrice();
    const isHolding = this.tradingSystem.isHolding();
    const isShort = this.tradingSystem.isShort();
    const pl = this.tradingSystem.getProfitLoss(price);
    const totalValue = this.tradingSystem.getTotalValue(price);
    const remaining = this.levelDef.maxCandles - this.candleCount;

    this.levelText.setText(`關卡 ${this.currentLevel}`);
    this.targetText.setText(`目標: $${this.levelDef.targetValue.toLocaleString()}`);
    this.candleCountText.setText(`K棒: ${this.candleCount}/${this.levelDef.maxCandles} (剩餘 ${remaining})`);

    this.cashText.setText(`資金: $${this.tradingSystem.getCash().toLocaleString()}`);

    if (isHolding) {
      const shares = this.tradingSystem.getShares();
      const buyPrice = this.tradingSystem.getBuyPrice();
      this.sharesText.setText(`持股: ${shares}股 @$${buyPrice.toFixed(2)}`);
    } else if (isShort) {
      const shares = this.tradingSystem.getShortShares();
      const shortPrice = this.tradingSystem.getShortPrice();
      this.sharesText.setText(`做空: ${shares}股 @$${shortPrice.toFixed(2)}`);
    } else {
      this.sharesText.setText('持倉: 無');
    }

    const plColor = pl >= 0 ? '#00ff88' : '#ff4444';
    const plSign = pl >= 0 ? '+' : '';
    this.plText.setText(`損益: ${plSign}$${pl.toLocaleString()}`).setColor(plColor);

    this.priceText.setText(`$${price.toFixed(2)}`);

    // Progress toward target
    const progressPct = Math.min(100, Math.round((totalValue / this.levelDef.targetValue) * 100));
    const progressColor = progressPct >= 100 ? '#00ff88' : '#ffcc00';
    this.targetText.setText(
      `目標: $${this.levelDef.targetValue.toLocaleString()} (${progressPct}%)`
    ).setColor(progressColor);

    // Active effects
    const effects = this.cardSystem.getActiveEffects();
    if (effects.length > 0) {
      const effectNames = effects.map((e) => {
        const def = getCardDef(e.cardId);
        return def ? `${def.nameCn}(${e.remainingCandles})` : '';
      }).filter(Boolean);
      this.effectsText.setText(effectNames.join(' '));
    } else {
      this.effectsText.setText('');
    }

    // Button states
    const canBuy = !isHolding && !isShort;
    const canSell = isHolding;
    const canShort = this.shortEnabled && !isHolding && !isShort;
    const canCover = isShort;

    this.buyBtn.setAlpha(canBuy ? 1 : 0.2);
    this.sellBtn.setAlpha(canSell ? 1 : 0.2);
    this.shortBtn.setAlpha(canShort ? 1 : 0.2);
    this.coverBtn.setAlpha(canCover ? 1 : 0.2);
  }

  update(_time: number, delta: number): void {
    if (this.gameOver || this.levelCleared) return;

    // Update timer bar
    if (!this.frozen) {
      this.tickElapsed += delta;
    }
    const progress = Math.min(this.tickElapsed / TICK_INTERVAL, 1);

    this.timerBar.clear();
    this.timerBar.fillStyle(0x335577, 0.5);
    this.timerBar.fillRect(20, 390, 500, 4);
    this.timerBar.fillStyle(this.frozen ? 0x88ccff : 0x00aaff, 0.8);
    this.timerBar.fillRect(20, 390, 500 * progress, 4);

    // Real-time P&L
    if (this.tradingSystem.isInPosition()) {
      const price = this.priceGenerator.getCurrentPrice();
      const pl = this.tradingSystem.getProfitLoss(price);
      const plColor = pl >= 0 ? '#00ff88' : '#ff4444';
      const plSign = pl >= 0 ? '+' : '';
      this.plText.setText(`損益: ${plSign}$${pl.toLocaleString()}`).setColor(plColor);
    }
  }

  // ── End States ───────────────────────────────────────────────

  private triggerLevelCleared(): void {
    this.levelCleared = true;
    this.tickTimer.remove();

    const price = this.priceGenerator.getCurrentPrice();
    const totalValue = this.tradingSystem.getTotalValue(price);

    this.overlay = this.add.container(400, 300);

    const dimBg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
    this.overlay.add(dimBg);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a2a1a, 1);
    panel.fillRoundedRect(-200, -120, 400, 240, 16);
    panel.lineStyle(2, 0x00ff88);
    panel.strokeRoundedRect(-200, -120, 400, 240, 16);
    this.overlay.add(panel);

    this.overlay.add(
      this.add.text(0, -80, '關卡通過！', {
        fontSize: '36px',
        color: '#00ff88',
        fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    this.overlay.add(
      this.add.text(0, -30, `最終資產: $${totalValue.toLocaleString()}`, {
        fontSize: '18px',
        color: '#ffcc00',
      }).setOrigin(0.5)
    );

    this.overlay.add(
      this.add.text(0, 0, `使用 ${this.candleCount}/${this.levelDef.maxCandles} 根K棒`, {
        fontSize: '16px',
        color: '#aaaacc',
      }).setOrigin(0.5)
    );

    // Continue button → go to reward
    const contBg = this.add.graphics();
    contBg.fillStyle(0x008844, 1);
    contBg.fillRoundedRect(-80, 40, 160, 50, 8);
    this.overlay.add(contBg);

    const contText = this.add.text(0, 65, '領取獎勵', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.overlay.add(contText);

    const contHit = this.add.rectangle(0, 65, 160, 50, 0x000000, 0);
    contHit.setInteractive({ useHandCursor: true });
    contHit.on('pointerdown', () => {
      this.scene.start('RewardScene', {
        level: this.currentLevel,
        totalValue,
        candleCount: this.candleCount,
      });
    });
    this.overlay.add(contHit);
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.tickTimer.remove();

    const price = this.priceGenerator.getCurrentPrice();
    const totalValue = this.tradingSystem.getTotalValue(price);

    this.overlay = this.add.container(400, 300);

    const dimBg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
    this.overlay.add(dimBg);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 1);
    panel.fillRoundedRect(-200, -140, 400, 280, 16);
    panel.lineStyle(2, 0xff4444);
    panel.strokeRoundedRect(-200, -140, 400, 280, 16);
    this.overlay.add(panel);

    this.overlay.add(
      this.add.text(0, -100, '挑戰失敗', {
        fontSize: '36px',
        color: '#ff4444',
        fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    this.overlay.add(
      this.add.text(0, -50, `關卡 ${this.currentLevel} | 目標: $${this.levelDef.targetValue.toLocaleString()}`, {
        fontSize: '16px',
        color: '#aaaacc',
      }).setOrigin(0.5)
    );

    this.overlay.add(
      this.add.text(0, -20, `最終資產: $${totalValue.toLocaleString()}`, {
        fontSize: '18px',
        color: '#ffcc00',
      }).setOrigin(0.5)
    );

    this.overlay.add(
      this.add.text(0, 10, `使用 ${this.candleCount}/${this.levelDef.maxCandles} 根K棒`, {
        fontSize: '14px',
        color: '#888899',
      }).setOrigin(0.5)
    );

    // Retry button
    const retryBg = this.add.graphics();
    retryBg.fillStyle(0x884400, 1);
    retryBg.fillRoundedRect(-80, 45, 160, 45, 8);
    this.overlay.add(retryBg);

    const retryText = this.add.text(0, 67, '重新挑戰', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.overlay.add(retryText);

    const retryHit = this.add.rectangle(0, 67, 160, 45, 0x000000, 0);
    retryHit.setInteractive({ useHandCursor: true });
    retryHit.on('pointerdown', () => {
      this.scene.restart({ level: this.currentLevel });
    });
    this.overlay.add(retryHit);

    // Back to menu
    const backText = this.add.text(0, 115, '回到選單', {
      fontSize: '14px',
      color: '#6688aa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });
    backText.on('pointerover', () => backText.setColor('#ffffff'));
    backText.on('pointerout', () => backText.setColor('#6688aa'));
    this.overlay.add(backText);
  }
}
