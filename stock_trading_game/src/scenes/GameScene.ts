import Phaser from 'phaser';
import { PriceGenerator } from '../systems/PriceGenerator';
import { TradingSystem } from '../systems/TradingSystem';
import { CandlestickChart } from '../objects/CandlestickChart';

const TICK_INTERVAL = 5000; // 5 seconds per candle

export class GameScene extends Phaser.Scene {
  private priceGenerator!: PriceGenerator;
  private tradingSystem!: TradingSystem;
  private chart!: CandlestickChart;
  private tickTimer!: Phaser.Time.TimerEvent;
  private candleCount: number = 0;
  private gameOver: boolean = false;

  // HUD texts
  private cashText!: Phaser.GameObjects.Text;
  private sharesText!: Phaser.GameObjects.Text;
  private plText!: Phaser.GameObjects.Text;
  private priceText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private tickElapsed: number = 0;

  // Buttons
  private buyBtn!: Phaser.GameObjects.Container;
  private sellBtn!: Phaser.GameObjects.Container;

  // Game Over overlay
  private overlay!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameOver = false;
    this.candleCount = 0;
    this.tickElapsed = 0;

    this.priceGenerator = new PriceGenerator(100);
    this.tradingSystem = new TradingSystem(10000);

    // Chart area
    this.chart = new CandlestickChart(this, 20, 80, 760, 400);

    // HUD
    this.createHUD();

    // Buttons
    this.createButtons();

    // Timer bar
    this.timerBar = this.add.graphics();

    // Start ticking
    this.tickTimer = this.time.addEvent({
      delay: TICK_INTERVAL,
      callback: this.onTick,
      callbackScope: this,
      loop: true,
    });

    // Generate first candle immediately
    this.onTick();

    this.updateHUD();
  }

  private createHUD(): void {
    const hudStyle = { fontSize: '16px', color: '#ffffff' };

    this.add.text(20, 15, 'STOCK TRADING GAME', {
      fontSize: '20px',
      color: '#00ff88',
      fontStyle: 'bold',
    });

    this.cashText = this.add.text(20, 50, '', hudStyle);
    this.sharesText = this.add.text(250, 50, '', hudStyle);
    this.plText = this.add.text(480, 50, '', hudStyle);
    this.priceText = this.add.text(650, 15, '', {
      fontSize: '18px',
      color: '#ffcc00',
      fontStyle: 'bold',
    });
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-80, -25, 160, 50, 8);
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(text);

    // Make interactive
    const hitArea = this.add.rectangle(0, 0, 160, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerdown', onClick);
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 0.7);
      bg.fillRoundedRect(-80, -25, 160, 50, 8);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-80, -25, 160, 50, 8);
    });

    return container;
  }

  private createButtons(): void {
    this.buyBtn = this.createButton(300, 540, '買入 BUY', 0x008844, () => this.onBuy());
    this.sellBtn = this.createButton(500, 540, '賣出 SELL', 0xcc3333, () => this.onSell());
  }

  private onTick(): void {
    if (this.gameOver) return;

    const candle = this.priceGenerator.nextCandle();
    this.chart.addCandle(candle);
    this.candleCount++;
    this.tickElapsed = 0;

    // Check game over
    const currentPrice = this.priceGenerator.getCurrentPrice();
    if (this.tradingSystem.isGameOver(currentPrice)) {
      this.triggerGameOver();
      return;
    }

    this.updateHUD();
  }

  private onBuy(): void {
    if (this.gameOver) return;
    const price = this.priceGenerator.getCurrentPrice();
    if (this.tradingSystem.buy(price)) {
      this.updateHUD();
    }
  }

  private onSell(): void {
    if (this.gameOver) return;
    const price = this.priceGenerator.getCurrentPrice();
    if (this.tradingSystem.sell(price)) {
      this.updateHUD();
    }
  }

  private updateHUD(): void {
    const price = this.priceGenerator.getCurrentPrice();
    const isHolding = this.tradingSystem.isHolding();
    const pl = this.tradingSystem.getProfitLoss(price);

    this.cashText.setText(`資金: $${this.tradingSystem.getCash().toLocaleString()}`);

    if (isHolding) {
      const shares = this.tradingSystem.getShares();
      const buyPrice = this.tradingSystem.getBuyPrice();
      this.sharesText.setText(`持股: ${shares}股 (成本 $${buyPrice.toFixed(2)})`);
    } else {
      this.sharesText.setText('持股: 無');
    }

    const plColor = pl >= 0 ? '#00ff88' : '#ff4444';
    const plSign = pl >= 0 ? '+' : '';
    this.plText.setText(`損益: ${plSign}$${pl.toLocaleString()}`).setColor(plColor);

    this.priceText.setText(`股價: $${price.toFixed(2)}`);

    // Update button visibility
    this.buyBtn.setAlpha(isHolding ? 0.3 : 1);
    this.sellBtn.setAlpha(isHolding ? 1 : 0.3);
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    // Update timer bar
    this.tickElapsed += delta;
    const progress = Math.min(this.tickElapsed / TICK_INTERVAL, 1);

    this.timerBar.clear();
    this.timerBar.fillStyle(0x335577, 0.5);
    this.timerBar.fillRect(20, 490, 760, 6);
    this.timerBar.fillStyle(0x00aaff, 0.8);
    this.timerBar.fillRect(20, 490, 760 * progress, 6);

    // Update P&L in real time if holding
    if (this.tradingSystem.isHolding()) {
      const price = this.priceGenerator.getCurrentPrice();
      const pl = this.tradingSystem.getProfitLoss(price);
      const plColor = pl >= 0 ? '#00ff88' : '#ff4444';
      const plSign = pl >= 0 ? '+' : '';
      this.plText.setText(`損益: ${plSign}$${pl.toLocaleString()}`).setColor(plColor);
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.tickTimer.remove();

    const price = this.priceGenerator.getCurrentPrice();
    const totalValue = this.tradingSystem.getTotalValue(price);

    this.overlay = this.add.container(400, 300);

    // Dim background
    const dimBg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
    this.overlay.add(dimBg);

    // Game Over panel
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 1);
    panel.fillRoundedRect(-200, -120, 400, 240, 16);
    panel.lineStyle(2, 0xff4444);
    panel.strokeRoundedRect(-200, -120, 400, 240, 16);
    this.overlay.add(panel);

    this.overlay.add(
      this.add.text(0, -80, 'GAME OVER', {
        fontSize: '36px',
        color: '#ff4444',
        fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    this.overlay.add(
      this.add.text(0, -30, `存活: ${this.candleCount} 根K棒`, {
        fontSize: '18px',
        color: '#ffffff',
      }).setOrigin(0.5)
    );

    this.overlay.add(
      this.add.text(0, 0, `最終資產: $${totalValue.toFixed(2)}`, {
        fontSize: '18px',
        color: '#ffcc00',
      }).setOrigin(0.5)
    );

    // Restart button
    const restartBg = this.add.graphics();
    restartBg.fillStyle(0x008844, 1);
    restartBg.fillRoundedRect(-80, 40, 160, 50, 8);
    this.overlay.add(restartBg);

    const restartText = this.add.text(0, 65, '再玩一次', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.overlay.add(restartText);

    const restartHit = this.add.rectangle(0, 65, 160, 50, 0x000000, 0);
    restartHit.setInteractive({ useHandCursor: true });
    restartHit.on('pointerdown', () => {
      this.scene.restart();
    });
    this.overlay.add(restartHit);
  }
}
