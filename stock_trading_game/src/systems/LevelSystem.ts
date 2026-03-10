export interface LevelDef {
  level: number;
  /** Target total value to clear the level */
  targetValue: number;
  /** Starting cash */
  startCash: number;
  /** Max candles allowed (0 = unlimited) */
  maxCandles: number;
  /** Starting stock price */
  startPrice: number;
  /** Difficulty hint text */
  hint: string;
}

export const LEVELS: LevelDef[] = [
  {
    level: 1,
    targetValue: 11000,
    startCash: 10000,
    maxCandles: 30,
    startPrice: 100,
    hint: '入門關：溫和趨勢，學會基本操作',
  },
  {
    level: 2,
    targetValue: 13000,
    startCash: 10000,
    maxCandles: 28,
    startPrice: 100,
    hint: '趨勢開始出現反轉',
  },
  {
    level: 3,
    targetValue: 15000,
    startCash: 10000,
    maxCandles: 25,
    startPrice: 100,
    hint: '波動加大，注意風險',
  },
  {
    level: 4,
    targetValue: 18000,
    startCash: 10000,
    maxCandles: 25,
    startPrice: 100,
    hint: '頻繁崩盤，善用卡牌',
  },
  {
    level: 5,
    targetValue: 22000,
    startCash: 10000,
    maxCandles: 22,
    startPrice: 100,
    hint: '極端行情，生存挑戰',
  },
  {
    level: 6,
    targetValue: 28000,
    startCash: 10000,
    maxCandles: 20,
    startPrice: 100,
    hint: '大師級，精準操作',
  },
  {
    level: 7,
    targetValue: 35000,
    startCash: 10000,
    maxCandles: 18,
    startPrice: 100,
    hint: '傳說級，唯有王者',
  },
];

const SAVE_KEY = 'stock_game_progress';

export interface GameProgress {
  /** Highest level cleared */
  clearedLevel: number;
  /** Card IDs the player owns */
  ownedCards: string[];
  /** Current selected deck */
  currentDeck: string[];
}

const DEFAULT_PROGRESS: GameProgress = {
  clearedLevel: 0,
  ownedCards: [],
  currentDeck: [],
};

export class LevelSystem {
  private progress: GameProgress;

  constructor() {
    this.progress = this.load();
  }

  private load(): GameProgress {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        return JSON.parse(raw) as GameProgress;
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_PROGRESS, ownedCards: [], currentDeck: [] };
  }

  save(): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.progress));
  }

  getProgress(): GameProgress {
    return this.progress;
  }

  getClearedLevel(): number {
    return this.progress.clearedLevel;
  }

  getOwnedCards(): string[] {
    return [...this.progress.ownedCards];
  }

  getCurrentDeck(): string[] {
    return [...this.progress.currentDeck];
  }

  setCurrentDeck(deck: string[]): void {
    this.progress.currentDeck = [...deck];
    this.save();
  }

  /** Mark a level as cleared and unlock the next */
  clearLevel(level: number): void {
    if (level > this.progress.clearedLevel) {
      this.progress.clearedLevel = level;
      this.save();
    }
  }

  /** Add a card to owned collection */
  addCard(cardId: string): void {
    this.progress.ownedCards.push(cardId);
    this.save();
  }

  /** Initialize starter cards if first time */
  initStarterCards(starterIds: string[]): void {
    if (this.progress.ownedCards.length === 0) {
      this.progress.ownedCards = [...starterIds];
      this.progress.currentDeck = [...starterIds];
      this.save();
    }
  }

  getLevelDef(level: number): LevelDef | undefined {
    return LEVELS.find((l) => l.level === level);
  }

  getMaxLevel(): number {
    return LEVELS.length;
  }

  /** Reset all progress */
  resetProgress(): void {
    this.progress = { ...DEFAULT_PROGRESS, ownedCards: [], currentDeck: [] };
    localStorage.removeItem(SAVE_KEY);
  }
}
