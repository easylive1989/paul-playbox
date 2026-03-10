/** Card effect types */
export type CardEffectType =
  | 'trend_up'       // Boost trend upward
  | 'trend_down'     // Push trend downward
  | 'bull_run'       // Multi-candle uptrend
  | 'bear_run'       // Multi-candle downtrend
  | 'stabilize'      // Reduce volatility
  | 'black_swan'     // Massive single-candle crash
  | 'moon_shot'      // Massive single-candle rally
  | 'insider_info'   // Reveal next N candles direction
  | 'time_freeze'    // Pause candle generation
  | 'leverage_2x'    // Double next trade P&L
  | 'short_sell'     // Allow short selling this round
  | 'half_position'  // Buy only 50%
  | 'stop_loss';     // Auto sell at -5%

export type CardRarity = 'common' | 'rare' | 'epic';

export interface CardDef {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  effectType: CardEffectType;
  /** For trend/volatility cards: modifier value */
  value: number;
  /** How many candles the effect lasts (0 = instant/passive) */
  duration: number;
  rarity: CardRarity;
}

/** Active effect applied to price generation */
export interface ActiveEffect {
  cardId: string;
  effectType: CardEffectType;
  value: number;
  remainingCandles: number;
}

// ─── Card Definitions ───────────────────────────────────────────

export const ALL_CARDS: CardDef[] = [
  // ── Price influence (common) ──
  {
    id: 'good_news',
    name: 'Good News',
    nameCn: '利多消息',
    description: '下1根K棒 trend +5%',
    effectType: 'trend_up',
    value: 0.05,
    duration: 1,
    rarity: 'common',
  },
  {
    id: 'bad_news',
    name: 'Bad News',
    nameCn: '利空消息',
    description: '下1根K棒 trend -5%',
    effectType: 'trend_down',
    value: -0.05,
    duration: 1,
    rarity: 'common',
  },
  {
    id: 'bull_market',
    name: 'Bull Market',
    nameCn: '牛市來了',
    description: '接下來3根K棒 trend +3%',
    effectType: 'bull_run',
    value: 0.03,
    duration: 3,
    rarity: 'rare',
  },
  {
    id: 'bear_market',
    name: 'Bear Market',
    nameCn: '熊市來了',
    description: '接下來3根K棒 trend -3%',
    effectType: 'bear_run',
    value: -0.03,
    duration: 3,
    rarity: 'rare',
  },
  {
    id: 'stabilize',
    name: 'Market Calm',
    nameCn: '市場穩定',
    description: '接下來3根K棒波動率大幅降低',
    effectType: 'stabilize',
    value: 0.003,
    duration: 3,
    rarity: 'common',
  },
  // ── Price influence (epic) ──
  {
    id: 'black_swan',
    name: 'Black Swan',
    nameCn: '黑天鵝',
    description: '下1根K棒暴跌 -15%',
    effectType: 'black_swan',
    value: -0.15,
    duration: 1,
    rarity: 'epic',
  },
  {
    id: 'moon_shot',
    name: 'Moon Shot',
    nameCn: '量化寬鬆',
    description: '下1根K棒暴漲 +12%',
    effectType: 'moon_shot',
    value: 0.12,
    duration: 1,
    rarity: 'epic',
  },
  // ── Trading ability ──
  {
    id: 'short_sell',
    name: 'Short Order',
    nameCn: '做空令',
    description: '本回合可以做空',
    effectType: 'short_sell',
    value: 0,
    duration: 1,
    rarity: 'rare',
  },
  {
    id: 'leverage_2x',
    name: 'Leverage x2',
    nameCn: '槓桿 x2',
    description: '下次交易損益翻倍',
    effectType: 'leverage_2x',
    value: 2,
    duration: 1,
    rarity: 'rare',
  },
  {
    id: 'half_position',
    name: 'Half Position',
    nameCn: '分批買入',
    description: '本回合只買50%倉位',
    effectType: 'half_position',
    value: 0.5,
    duration: 1,
    rarity: 'common',
  },
  {
    id: 'stop_loss',
    name: 'Stop Loss',
    nameCn: '停損設定',
    description: '虧損5%自動賣出',
    effectType: 'stop_loss',
    value: -0.05,
    duration: 5,
    rarity: 'common',
  },
  // ── Intel ──
  {
    id: 'insider_info',
    name: 'Insider Info',
    nameCn: '內線消息',
    description: '揭露下3根K棒的趨勢方向',
    effectType: 'insider_info',
    value: 3,
    duration: 0,
    rarity: 'rare',
  },
  {
    id: 'time_freeze',
    name: 'Time Freeze',
    nameCn: '時間暫停',
    description: '暫停K棒生成10秒',
    effectType: 'time_freeze',
    value: 10000,
    duration: 0,
    rarity: 'common',
  },
];

// ─── Starting Deck ──────────────────────────────────────────────

export const STARTER_DECK_IDS: string[] = [
  'good_news',
  'good_news',
  'bad_news',
  'stabilize',
  'half_position',
  'time_freeze',
  'insider_info',
  'stop_loss',
];

// ─── Card System ────────────────────────────────────────────────

export class CardSystem {
  /** All card IDs in the player's deck for this run */
  private deck: string[] = [];
  /** Draw pile (shuffled, pop from end) */
  private drawPile: string[] = [];
  /** Current hand (up to 3) */
  private hand: string[] = [];
  /** Discard pile */
  private discardPile: string[] = [];
  /** Currently active effects on the market */
  private activeEffects: ActiveEffect[] = [];

  constructor(deckIds: string[]) {
    this.deck = [...deckIds];
    this.initDrawPile();
  }

  private initDrawPile(): void {
    this.drawPile = [...this.deck];
    this.shuffle(this.drawPile);
    this.discardPile = [];
  }

  private shuffle(arr: string[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /** Draw cards to fill hand (up to 3). Reshuffles discard if draw pile empty. */
  drawHand(): void {
    this.hand = [];
    for (let i = 0; i < 3; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.drawPile = [...this.discardPile];
        this.shuffle(this.drawPile);
        this.discardPile = [];
      }
      const cardId = this.drawPile.pop();
      if (cardId) this.hand.push(cardId);
    }
  }

  /** Play a card from hand by index. Returns the card def or null. */
  playCard(handIndex: number): CardDef | null {
    if (handIndex < 0 || handIndex >= this.hand.length) return null;
    const cardId = this.hand.splice(handIndex, 1)[0];
    const def = getCardDef(cardId);
    if (!def) return null;

    // Card is consumed — goes to discard
    this.discardPile.push(cardId);

    // Apply effect
    if (def.duration > 0) {
      this.activeEffects.push({
        cardId: def.id,
        effectType: def.effectType,
        value: def.value,
        remainingCandles: def.duration,
      });
    }

    return def;
  }

  /** Tick down active effects (call after each candle). Returns expired effects. */
  tickEffects(): ActiveEffect[] {
    const expired: ActiveEffect[] = [];
    this.activeEffects = this.activeEffects.filter((e) => {
      e.remainingCandles--;
      if (e.remainingCandles <= 0) {
        expired.push(e);
        return false;
      }
      return true;
    });
    return expired;
  }

  /** Discard remaining hand cards at end of turn */
  discardHand(): void {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }

  getHand(): string[] {
    return [...this.hand];
  }

  getActiveEffects(): ActiveEffect[] {
    return [...this.activeEffects];
  }

  hasActiveEffect(type: CardEffectType): ActiveEffect | undefined {
    return this.activeEffects.find((e) => e.effectType === type);
  }

  getDeckSize(): number {
    return this.deck.length;
  }

  getDrawPileSize(): number {
    return this.drawPile.length;
  }

  getDiscardPileSize(): number {
    return this.discardPile.length;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

export function getCardDef(id: string): CardDef | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

export function getCardsByRarity(rarity: CardRarity): CardDef[] {
  return ALL_CARDS.filter((c) => c.rarity === rarity);
}

export function getRandomRewardCards(count: number, exclude: string[] = []): CardDef[] {
  const pool = ALL_CARDS.filter((c) => !exclude.includes(c.id));
  const result: CardDef[] = [];
  const used = new Set<number>();

  while (result.length < count && used.size < pool.length) {
    // Weighted by rarity
    const weights = pool.map((c) =>
      c.rarity === 'common' ? 3 : c.rarity === 'rare' ? 2 : 1
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      r -= weights[i];
      if (r <= 0) {
        result.push(pool[i]);
        used.add(i);
        break;
      }
    }
  }

  return result;
}

/** Color by rarity */
export function rarityColor(rarity: CardRarity): number {
  switch (rarity) {
    case 'common': return 0x4488aa;
    case 'rare': return 0xcc8800;
    case 'epic': return 0xaa44cc;
  }
}
