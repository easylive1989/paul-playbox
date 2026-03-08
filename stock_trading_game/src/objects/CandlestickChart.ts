import Phaser from 'phaser';
import { Candle } from '../systems/PriceGenerator';

const CANDLE_WIDTH = 12;
const CANDLE_GAP = 4;
const CANDLE_STEP = CANDLE_WIDTH + CANDLE_GAP;
const COLOR_UP = 0x00cc66;
const COLOR_DOWN = 0xee4444;

export class CandlestickChart {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private candles: Candle[] = [];
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.graphics = scene.add.graphics();
  }

  addCandle(candle: Candle): void {
    this.candles.push(candle);
    this.draw();
  }

  private draw(): void {
    this.graphics.clear();

    // Draw background
    this.graphics.fillStyle(0x111122, 1);
    this.graphics.fillRect(this.x, this.y, this.width, this.height);

    // Draw border
    this.graphics.lineStyle(1, 0x333355);
    this.graphics.strokeRect(this.x, this.y, this.width, this.height);

    if (this.candles.length === 0) return;

    // Determine visible candles
    const maxVisible = Math.floor(this.width / CANDLE_STEP);
    const startIndex = Math.max(0, this.candles.length - maxVisible);
    const visibleCandles = this.candles.slice(startIndex);

    // Find price range for visible candles
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of visibleCandles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    // Add padding to price range
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    // Draw grid lines
    this.drawGrid(minPrice, maxPrice);

    // Draw candles
    const chartHeight = this.height - 20; // padding
    const chartTop = this.y + 10;

    for (let i = 0; i < visibleCandles.length; i++) {
      const candle = visibleCandles[i];
      const cx = this.x + 20 + i * CANDLE_STEP + CANDLE_WIDTH / 2;

      const isUp = candle.close >= candle.open;
      const color = isUp ? COLOR_UP : COLOR_DOWN;

      // Map price to Y coordinate (inverted: higher price = lower Y)
      const highY = chartTop + (1 - (candle.high - minPrice) / (maxPrice - minPrice)) * chartHeight;
      const lowY = chartTop + (1 - (candle.low - minPrice) / (maxPrice - minPrice)) * chartHeight;
      const openY = chartTop + (1 - (candle.open - minPrice) / (maxPrice - minPrice)) * chartHeight;
      const closeY = chartTop + (1 - (candle.close - minPrice) / (maxPrice - minPrice)) * chartHeight;

      // Draw wick (shadow line)
      this.graphics.lineStyle(1, color);
      this.graphics.beginPath();
      this.graphics.moveTo(cx, highY);
      this.graphics.lineTo(cx, lowY);
      this.graphics.strokePath();

      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(cx - CANDLE_WIDTH / 2, bodyTop, CANDLE_WIDTH, bodyHeight);
    }

    // Draw current price line
    if (visibleCandles.length > 0) {
      const lastCandle = visibleCandles[visibleCandles.length - 1];
      const priceY = chartTop + (1 - (lastCandle.close - minPrice) / (maxPrice - minPrice)) * chartHeight;
      this.graphics.lineStyle(1, 0xffcc00, 0.5);
      this.graphics.beginPath();
      this.graphics.moveTo(this.x, priceY);
      this.graphics.lineTo(this.x + this.width, priceY);
      this.graphics.strokePath();

      // Price label
      const priceText = `$${lastCandle.close.toFixed(2)}`;
      // Remove old price label if exists
      const existingLabel = this.scene.children.getByName('priceLabel');
      if (existingLabel) existingLabel.destroy();

      this.scene.add.text(this.x + this.width - 10, priceY - 8, priceText, {
        fontSize: '11px',
        color: '#ffcc00',
      }).setOrigin(1, 0.5).setName('priceLabel');
    }
  }

  private drawGrid(minPrice: number, maxPrice: number): void {
    const chartHeight = this.height - 20;
    const chartTop = this.y + 10;
    const gridLines = 4;

    this.graphics.lineStyle(1, 0x222244, 0.3);

    for (let i = 0; i <= gridLines; i++) {
      const y = chartTop + (i / gridLines) * chartHeight;
      this.graphics.beginPath();
      this.graphics.moveTo(this.x, y);
      this.graphics.lineTo(this.x + this.width, y);
      this.graphics.strokePath();

      const price = maxPrice - (i / gridLines) * (maxPrice - minPrice);
      // Remove old grid labels
      const labelName = `gridLabel_${i}`;
      const existing = this.scene.children.getByName(labelName);
      if (existing) existing.destroy();

      this.scene.add.text(this.x + 2, y - 6, `$${price.toFixed(1)}`, {
        fontSize: '9px',
        color: '#555577',
      }).setName(labelName);
    }
  }

  reset(): void {
    this.candles = [];
    this.graphics.clear();
    // Clean up text labels
    for (let i = 0; i <= 4; i++) {
      const existing = this.scene.children.getByName(`gridLabel_${i}`);
      if (existing) existing.destroy();
    }
    const priceLabel = this.scene.children.getByName('priceLabel');
    if (priceLabel) priceLabel.destroy();
  }
}
