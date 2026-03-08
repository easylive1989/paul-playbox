export class TradingSystem {
  private cash: number;
  private shares: number = 0;
  private buyPrice: number = 0;
  private initialCash: number;

  constructor(initialCash: number = 10000) {
    this.cash = initialCash;
    this.initialCash = initialCash;
  }

  buy(price: number): boolean {
    if (this.shares > 0 || this.cash <= 0) return false;
    this.shares = Math.floor(this.cash / price);
    this.cash -= this.shares * price;
    this.cash = Math.round(this.cash * 100) / 100;
    this.buyPrice = price;
    return true;
  }

  sell(price: number): boolean {
    if (this.shares <= 0) return false;
    this.cash += this.shares * price;
    this.cash = Math.round(this.cash * 100) / 100;
    this.shares = 0;
    this.buyPrice = 0;
    return true;
  }

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
    return Math.round((this.cash + this.shares * currentPrice) * 100) / 100;
  }

  getProfitLoss(currentPrice: number): number {
    return Math.round((this.getTotalValue(currentPrice) - this.initialCash) * 100) / 100;
  }

  isHolding(): boolean {
    return this.shares > 0;
  }

  isGameOver(currentPrice: number): boolean {
    return this.getTotalValue(currentPrice) < 100;
  }

  reset(): void {
    this.cash = this.initialCash;
    this.shares = 0;
    this.buyPrice = 0;
  }
}
