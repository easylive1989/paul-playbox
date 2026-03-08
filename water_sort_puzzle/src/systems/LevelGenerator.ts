import { BOTTLE } from '../config/gameConfig';
import { WATER_COLORS } from '../utils/colors';
import { MANUAL_LEVELS } from '../config/levels';

interface LevelConfig {
  numColors: number;
  numEmpty: number;
}

function getLevelConfig(level: number): LevelConfig {
  if (level <= 3) return { numColors: level + 1, numEmpty: 2 };
  if (level <= 7) return { numColors: Math.min(4 + Math.floor((level - 4) / 2), 5), numEmpty: 2 };
  if (level <= 12) return { numColors: Math.min(5 + Math.floor((level - 8) / 2), 6), numEmpty: 2 };
  return { numColors: Math.min(6 + Math.floor((level - 13) / 3), 8), numEmpty: 2 };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRandomLevel(config: LevelConfig): (number | null)[][] {
  const { numColors, numEmpty } = config;
  const layers = BOTTLE.MAX_LAYERS;

  // Create all color units
  const colors = WATER_COLORS.slice(0, numColors);
  const allUnits: number[] = [];
  for (const c of colors) {
    for (let i = 0; i < layers; i++) {
      allUnits.push(c);
    }
  }

  const shuffled = shuffle(allUnits);

  // Distribute into bottles
  const bottles: (number | null)[][] = [];
  for (let i = 0; i < numColors; i++) {
    bottles.push(shuffled.slice(i * layers, (i + 1) * layers));
  }

  // Add empty bottles
  for (let i = 0; i < numEmpty; i++) {
    bottles.push(Array(layers).fill(null));
  }

  return bottles;
}

// Simple BFS solvability check
function isSolvable(bottles: (number | null)[][]): boolean {
  const maxStates = 1000;
  const visited = new Set<string>();

  function stateKey(b: (number | null)[][]): string {
    return b.map(bottle => bottle.map(l => l === null ? '_' : l.toString(16)).join(',')).join('|');
  }

  function topColor(b: (number | null)[]): number | null {
    for (let i = b.length - 1; i >= 0; i--) {
      if (b[i] !== null) return b[i];
    }
    return null;
  }

  function topColorCount(b: (number | null)[]): number {
    const c = topColor(b);
    if (c === null) return 0;
    let count = 0;
    for (let i = b.length - 1; i >= 0; i--) {
      if (b[i] === c) count++;
      else if (b[i] !== null) break;
    }
    return count;
  }

  function filledCount(b: (number | null)[]): number {
    return b.filter(l => l !== null).length;
  }

  function emptySlots(b: (number | null)[]): number {
    return BOTTLE.MAX_LAYERS - filledCount(b);
  }

  function isWin(state: (number | null)[][]): boolean {
    return state.every(b => {
      const f = filledCount(b);
      if (f === 0) return true;
      if (f !== BOTTLE.MAX_LAYERS) return false;
      return b.every(l => l === b[0]);
    });
  }

  function getNextStates(state: (number | null)[][]): (number | null)[][][] {
    const results: (number | null)[][][] = [];
    for (let from = 0; from < state.length; from++) {
      if (filledCount(state[from]) === 0) continue;
      for (let to = 0; to < state.length; to++) {
        if (from === to) continue;
        if (filledCount(state[to]) === BOTTLE.MAX_LAYERS) continue;

        const fromColor = topColor(state[from]);
        const toColor = topColor(state[to]);

        if (toColor !== null && fromColor !== toColor) continue;

        const pourAmt = Math.min(topColorCount(state[from]), emptySlots(state[to]));
        if (pourAmt === 0) continue;

        // Skip pouring into empty bottle if source has only one color (pointless)
        if (toColor === null && filledCount(state[from]) === topColorCount(state[from])) continue;

        // Execute pour
        const newState = state.map(b => [...b]);
        let removed = 0;
        for (let i = newState[from].length - 1; i >= 0 && removed < pourAmt; i--) {
          if (newState[from][i] !== null) {
            newState[from][i] = null;
            removed++;
          }
        }
        let added = 0;
        for (let i = 0; i < newState[to].length && added < pourAmt; i++) {
          if (newState[to][i] === null) {
            newState[to][i] = fromColor!;
            added++;
          }
        }

        results.push(newState);
      }
    }
    return results;
  }

  // BFS
  const queue: (number | null)[][][] = [bottles];
  visited.add(stateKey(bottles));

  while (queue.length > 0 && visited.size < maxStates) {
    const current = queue.shift()!;
    if (isWin(current)) return true;

    for (const next of getNextStates(current)) {
      const key = stateKey(next);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  return false;
}

export function generateLevel(level: number): (number | null)[][] {
  // Use manual levels for first 3
  if (level <= MANUAL_LEVELS.length) {
    return MANUAL_LEVELS[level - 1].map(b => [...b]);
  }

  const config = getLevelConfig(level);
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const bottles = generateRandomLevel(config);

    // Check that it's not already solved
    const allSameColor = bottles.every(b => {
      const filled = b.filter(l => l !== null);
      if (filled.length === 0) return true;
      return filled.every(l => l === filled[0]);
    });
    if (allSameColor) continue;

    if (isSolvable(bottles)) {
      return bottles;
    }
  }

  // Fallback: return a simple level
  return generateRandomLevel({ numColors: 3, numEmpty: 2 });
}

export function loadProgress(): number {
  const saved = localStorage.getItem('waterSortLevel');
  return saved ? parseInt(saved, 10) : 1;
}

export function saveProgress(level: number): void {
  localStorage.setItem('waterSortLevel', level.toString());
}
