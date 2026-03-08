import { BOTTLE } from '../config/gameConfig';

export interface PourResult {
  fromIdx: number;
  toIdx: number;
  color: number;
  count: number;
}

export class GameState {
  bottles: (number | null)[][];

  constructor(bottles: (number | null)[][]) {
    this.bottles = bottles.map(b => [...b]);
  }

  clone(): GameState {
    return new GameState(this.bottles);
  }

  topColor(idx: number): number | null {
    const b = this.bottles[idx];
    for (let i = b.length - 1; i >= 0; i--) {
      if (b[i] !== null) return b[i];
    }
    return null;
  }

  topColorCount(idx: number): number {
    const color = this.topColor(idx);
    if (color === null) return 0;
    const b = this.bottles[idx];
    let count = 0;
    for (let i = b.length - 1; i >= 0; i--) {
      if (b[i] === color) count++;
      else if (b[i] !== null) break;
    }
    return count;
  }

  filledCount(idx: number): number {
    return this.bottles[idx].filter(l => l !== null).length;
  }

  emptySlots(idx: number): number {
    return BOTTLE.MAX_LAYERS - this.filledCount(idx);
  }

  isEmpty(idx: number): boolean {
    return this.filledCount(idx) === 0;
  }

  isFull(idx: number): boolean {
    return this.filledCount(idx) === BOTTLE.MAX_LAYERS;
  }

  isComplete(idx: number): boolean {
    const b = this.bottles[idx];
    if (!this.isFull(idx)) return false;
    return b.every(l => l === b[0]);
  }

  canPour(fromIdx: number, toIdx: number): boolean {
    if (fromIdx === toIdx) return false;
    if (this.isEmpty(fromIdx)) return false;
    if (this.isFull(toIdx)) return false;

    const fromColor = this.topColor(fromIdx)!;

    if (this.isEmpty(toIdx)) return true;

    const toColor = this.topColor(toIdx);
    if (fromColor !== toColor) return false;

    const pourCount = Math.min(this.topColorCount(fromIdx), this.emptySlots(toIdx));
    return pourCount > 0;
  }

  executePour(fromIdx: number, toIdx: number): PourResult | null {
    if (!this.canPour(fromIdx, toIdx)) return null;

    const color = this.topColor(fromIdx)!;
    const pourCount = Math.min(this.topColorCount(fromIdx), this.emptySlots(toIdx));

    const from = this.bottles[fromIdx];
    const to = this.bottles[toIdx];

    // Remove from source (top down)
    let removed = 0;
    for (let i = from.length - 1; i >= 0 && removed < pourCount; i--) {
      if (from[i] !== null) {
        from[i] = null;
        removed++;
      }
    }

    // Add to target (fill from bottom up)
    let added = 0;
    for (let i = 0; i < to.length && added < pourCount; i++) {
      if (to[i] === null) {
        to[i] = color;
        added++;
      }
    }

    return { fromIdx, toIdx, color, count: pourCount };
  }

  checkWin(): boolean {
    return this.bottles.every(b => {
      const filled = b.filter(l => l !== null);
      if (filled.length === 0) return true;
      if (filled.length !== BOTTLE.MAX_LAYERS) return false;
      return filled.every(l => l === filled[0]);
    });
  }
}
