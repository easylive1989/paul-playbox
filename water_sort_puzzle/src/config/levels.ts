import { WATER_COLORS } from '../utils/colors';

const [R, B, G, O, P] = WATER_COLORS;

// Hand-crafted tutorial levels (bottom-to-top order per bottle)
export const MANUAL_LEVELS: (number | null)[][][] = [
  // Level 1: 2 colors, 3 bottles (easy intro)
  [
    [R, R, B, B],
    [B, B, R, R],
    [null, null, null, null],
  ],
  // Level 2: 2 colors, 4 bottles
  [
    [R, B, R, B],
    [B, R, B, R],
    [null, null, null, null],
    [null, null, null, null],
  ],
  // Level 3: 3 colors, 5 bottles
  [
    [R, B, G, R],
    [G, R, B, G],
    [B, G, R, B],
    [null, null, null, null],
    [null, null, null, null],
  ],
];
