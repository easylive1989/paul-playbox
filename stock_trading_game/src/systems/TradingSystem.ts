export class TradingSystem {
  private cash: number;
  private shares: number = 0;
  private buyPrice: number = 0;
  private initialCash: number;

  /** Short selling state */
  private shortShares: number = 0;
  private shortPrice: number = 0;

  /** Leverage multiplier (resets after one trade) */
  private leverageMultiplier: number = 1;

  /** Position size ratio (1 = 100%, 0.5 = 50%) */
  private positionRatio: number = 1;

  constructor(initialCash: number = 10000) {
    this.cash = initialCash;
    this.initialCash = initialCash;
  }

  // ── Modifiers (set by card effects each turn) ──

  setLeverage(mult: number): void {
    this.leverageMultiplier = mult;
  }

  setPositionRatio(ratio: number): void {
    this.positionRatio = ratio;
  }

  resetModifiers(): void {
    this.leverageMultiplier = 1;
    this.positionRatio = 1;
  }

  // ── Long trading ──

  buy(price: number): boolean {
    if (this.shares > 0 || this.shortShares > 0 || this.cash <= 0) return false;
    const availableCash = this.cash * this.positionRatio;
    this.shares = Math.floor(availableCash / price);
    if (this.shares <= 0) return false;
    this.cash -= this.shares * price;
    this.cash = Math.round(this.cash * 100) / 100;
    this.buyPrice = price;
    return true;
  }

  sell(price: number): boolean {
    if (this.shares <= 0) return false;
    const baseValue = this.shares * this.buyPrice;
    const currentValue = this.shares * price;
    const pnl = currentValue - baseValue;
    // Apply leverage to P&L
    const leveragedPnl = pnl * this.leverageMultiplier;
    this.cash += baseValue + leveragedPnl;
    this.cash = Math.round(this.cash * 100) / 100;
    this.shares = 0;
    this.buyPrice = 0;
    return true;
  }

  // ── Short selling ──

  short(price: number): boolean {
    if (this.shares > 0 || this.shortShares > 0 || this.cash <= 0) return false;
    const availableCash = this.cash * this.positionRatio;
    this.shortShares = Math.floor(availableCash / price);
    if (this.shortShares <= 0) return false;
    // Receive cash from short sale
    this.cash += this.shortShares * price;
    this.shortPrice = price;
    return true;
  }

  coverShort(price: number): boolean {
    if (this.shortShares <= 0) return false;
    const baseCost = this.shortShares * this.shortPrice;
    const currentCost = this.shortShares * price;
    const pnl = baseCost - currentCost; // profit if price went down
    const leveragedPnl = pnl * this.leverageMultiplier;
    // Pay back shares at current price, adjusted for leverage
    this.cash -= this.shortShares * this.shortPrice; // return borrowed amount
    this.cash += leveragedPnl; // apply leveraged P&L
    this.cash = Math.round(this.cash * 100) / 100;
    this.shortShares = 0;
    this.shortPrice = 0;
    return true;
  }

  isShort(): boolean {
    return this.shortShares > 0;
  }

  getShortShares(): number {
    return this.shortShares;
  }

  getShortPrice(): number {
    return this.shortPrice;
  }

  // ── Getters ──

  getCash(): number {
    return this.cash;
  }

  getShares(): number {
    return this.shares;
  }

  getBuyPrice(): number {
    return this.buyPrice;
  }

  getTotalValue(currentPrice: number): number {
    let value = this.cash + this.shares * currentPrice;
    // For short positions, account for unrealized P&L
    if (this.shortShares > 0) {
      const shortPnl = this.shortShares * (this.shortPrice - currentPrice);
      value += shortPnl;
    }
    return Math.round(value * 100) / 100;
  }

  getProfitLoss(currentPrice: number): number {
    return Math.round((this.getTotalValue(currentPrice) - this.initialCash) * 100) / 100;
  }

  isHolding(): boolean {
    return this.shares > 0;
  }

  isInPosition(): boolean {
    return this.shares > 0 || this.shortShares > 0;
  }

  isGameOver(currentPrice: number): boolean {
    return this.getTotalValue(currentPrice) < 100;
  }

  /** Check stop loss condition: returns true if should auto-sell */
  checkStopLoss(currentPrice: number, threshold: number): boolean {
    if (this.shares > 0) {
      const pnlPct = (currentPrice - this.buyPrice) / this.buyPrice;
      return pnlPct <= threshold;
    }
    if (this.shortShares > 0) {
      const pnlPct = (this.shortPrice - currentPrice) / this.shortPrice;
      return pnlPct <= threshold;
    }
    return false;
  }

  reset(): void {
    this.cash = this.initialCash;
    this.shares = 0;
    this.buyPrice = 0;
    this.shortShares = 0;
    this.shortPrice = 0;
    this.leverageMultiplier = 1;
    this.positionRatio = 1;
  }
}
