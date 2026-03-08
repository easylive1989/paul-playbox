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
  private scenarioPhase: number = 0;

  constructor(startPrice: number = 100) {
    this.currentPrice = startPrice;
    this.scenario = this.pickScenario();
  }

  private pickScenario(): Scenario {
    const index = Math.floor(Math.random() * SCENARIOS.length);
    this.candlesInScenario = 0;
    this.scenarioPhase = 0;
    return { ...SCENARIOS[index] };
  }

  nextCandle(): Candle {
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

    const open = this.currentPrice;
    const change = trend + (Math.random() - 0.5) * 2 * this.scenario.volatility;
    const close = open * (1 + change);

    // Generate high and low with random wicks
    const wickUp = Math.random() * this.scenario.volatility * open;
    const wickDown = Math.random() * this.scenario.volatility * open;
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
}
