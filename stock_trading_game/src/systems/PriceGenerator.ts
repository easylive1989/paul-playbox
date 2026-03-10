import { ActiveEffect } from './CardSystem';

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Scenario {
  name: string;
  trend: number;       // positive = up, negative = down
  volatility: number;  // how much random variation
  duration: number;    // how many candles this scenario lasts
}

const SCENARIOS: Scenario[] = [
  { name: 'rally', trend: 0.03, volatility: 0.015, duration: 15 },
  { name: 'crash', trend: -0.04, volatility: 0.02, duration: 12 },
  { name: 'sideways', trend: 0.0, volatility: 0.01, duration: 18 },
  { name: 'v-reversal', trend: -0.03, volatility: 0.02, duration: 10 },
  { name: 'inv-v-reversal', trend: 0.03, volatility: 0.02, duration: 10 },
  { name: 'slow-climb', trend: 0.015, volatility: 0.008, duration: 20 },
  { name: 'slow-decline', trend: -0.015, volatility: 0.008, duration: 20 },
];

export class PriceGenerator {
  private currentPrice: number;
  private scenario: Scenario;
  private candlesInScenario: number = 0;

  constructor(startPrice: number = 100) {
    this.currentPrice = startPrice;
    this.scenario = this.pickScenario();
  }

  private pickScenario(): Scenario {
    const index = Math.floor(Math.random() * SCENARIOS.length);
    this.candlesInScenario = 0;
    return { ...SCENARIOS[index] };
  }

  /**
   * Generate next candle, optionally influenced by active card effects.
   */
  nextCandle(activeEffects: ActiveEffect[] = []): Candle {
    this.candlesInScenario++;

    // Check if we need to switch scenarios
    if (this.candlesInScenario > this.scenario.duration) {
      this.scenario = this.pickScenario();
    }

    // For V-reversal and inv-V-reversal, flip trend halfway
    const progress = this.candlesInScenario / this.scenario.duration;
    let trend = this.scenario.trend;
    if (this.scenario.name === 'v-reversal' && progress > 0.5) {
      trend = Math.abs(trend) * 1.2;
    } else if (this.scenario.name === 'inv-v-reversal' && progress > 0.5) {
      trend = -Math.abs(trend) * 1.2;
    }

    let volatility = this.scenario.volatility;

    // ── Apply card effects ──
    for (const effect of activeEffects) {
      switch (effect.effectType) {
        case 'trend_up':
        case 'bull_run':
          trend += effect.value;
          break;
        case 'trend_down':
        case 'bear_run':
          trend += effect.value; // value is negative
          break;
        case 'stabilize':
          volatility = effect.value; // override to low volatility
          break;
        case 'black_swan':
          trend = effect.value; // force -15%
          volatility = 0.01;
          break;
        case 'moon_shot':
          trend = effect.value; // force +12%
          volatility = 0.01;
          break;
      }
    }

    const open = this.currentPrice;
    const change = trend + (Math.random() - 0.5) * 2 * volatility;
    const close = open * (1 + change);

    // Generate high and low with random wicks
    const wickUp = Math.random() * volatility * open;
    const wickDown = Math.random() * volatility * open;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    // Prevent price from going below 1
    const safeClose = Math.max(close, 1);

    this.currentPrice = safeClose;

    return {
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(Math.max(low, 0.5) * 100) / 100,
      close: Math.round(safeClose * 100) / 100,
    };
  }

  getCurrentPrice(): number {
    return Math.round(this.currentPrice * 100) / 100;
  }

  /** Get current scenario info (for insider_info card) */
  getScenarioHint(): { name: string; remainingCandles: number; trendDirection: string } {
    const remaining = this.scenario.duration - this.candlesInScenario;
    let dir = 'sideways';
    if (this.scenario.trend > 0.005) dir = 'up';
    else if (this.scenario.trend < -0.005) dir = 'down';
    return {
      name: this.scenario.name,
      remainingCandles: Math.max(0, remaining),
      trendDirection: dir,
    };
  }
}
