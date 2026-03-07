import { TILE_SIZE, GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';

// Frame indices for Tilemap_Flat.png (10 cols × 4 rows, 64×64)
// Left 3 cols = grass, right side starts at col 5 = sand
const GRASS = { TL: 0, T: 1, TR: 2, L: 10, C: 11, R: 12, BL: 20, B: 21, BR: 22 };
const SAND  = { TL: 5, T: 6, TR: 7, L: 15, C: 16, R: 17, BL: 25, B: 26, BR: 27 };

// Frame indices for Tilemap_Elevation.png (4 cols × 8 rows, 64×64)
const ELEV = { TL: 0, T: 1, TR: 2, T2: 3, L: 4, C: 5, R: 6, C2: 7, BL: 8, B: 9, BR: 10 };

/**
 * Pick the correct edge/corner frame for a terrain type at (gx, gy).
 * Checks 4 neighbours; if neighbour is same type → no edge on that side.
 */
function autoTileFrame(terrain, gx, gy, type, frames) {
    const is = (x, y) => {
        if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
        return terrain[y][x] === type;
    };

    const t = gy > 0 && is(gx, gy - 1);
    const b = gy < GRID_ROWS - 1 && is(gx, gy + 1);
    const l = gx > 0 && is(gx - 1, gy);
    const r = gx < GRID_COLS - 1 && is(gx + 1, gy);

    if (!t && !l) return frames.TL;
    if (!t && !r) return frames.TR;
    if (!b && !l) return frames.BL;
    if (!b && !r) return frames.BR;
    if (!t) return frames.T;
    if (!b) return frames.B;
    if (!l) return frames.L;
    if (!r) return frames.R;
    return frames.C;
}

/**
 * Render the full map terrain, decorations, and mark blocked cells.
 */
export function renderMap(scene, mapData, gridSystem) {
    const { terrain, decorations, bridges } = mapData;

    // --- Layer 1: Water base (below everything) ---
    for (let gy = 0; gy < GRID_ROWS; gy++) {
        for (let gx = 0; gx < GRID_COLS; gx++) {
            if (terrain[gy][gx] === 'W') {
                const { x, y } = gridSystem.gridToPixel(gx, gy);
                scene.add.image(x, y, 'water').setDepth(-2);
            }
        }
    }

    // --- Layer 2: Ground tiles (grass / sand) ---
    for (let gy = 0; gy < GRID_ROWS; gy++) {
        for (let gx = 0; gx < GRID_COLS; gx++) {
            const cell = terrain[gy][gx];
            const { x, y } = gridSystem.gridToPixel(gx, gy);

            if (cell === 'G') {
                const frame = autoTileFrame(terrain, gx, gy, 'G', GRASS);
                scene.add.image(x, y, 'tilemap_flat', frame).setDepth(-1);
            } else if (cell === 'S') {
                const frame = autoTileFrame(terrain, gx, gy, 'S', SAND);
                scene.add.image(x, y, 'tilemap_flat', frame).setDepth(-1);
            } else if (cell === 'E') {
                const frame = autoTileFrame(terrain, gx, gy, 'E', ELEV);
                scene.add.image(x, y, 'tilemap_elevation', frame).setDepth(-1);
            }
            // W cells already rendered in layer 1
        }
    }

    // --- Layer 3: Bridges ---
    if (bridges) {
        for (const b of bridges) {
            renderBridge(scene, gridSystem, terrain, b);
        }
    }

    // --- Layer 4: Decorations ---
    if (decorations) {
        for (const d of decorations) {
            renderDecoration(scene, gridSystem, d);
        }
    }

    // --- Mark blocked cells ---
    applyBlockedCells(gridSystem, terrain, bridges);
}

/**
 * Render a bridge (3 tiles wide horizontally across water rows at gx, gy).
 */
function renderBridge(scene, gridSystem, terrain, bridge) {
    const { gx, gy } = bridge;
    // Bridge_All.png: 3 cols × 4 rows
    // Row 0 (frames 0,1,2): horizontal bridge top
    // We render 3 tiles: left-end, middle, right-end
    // For each water row starting at gy, place bridge tiles
    for (let dy = 0; dy < 3; dy++) {
        const row = gy + dy;
        if (row >= GRID_ROWS) break;
        if (terrain[row] && terrain[row][gx] === 'W') {
            const { x, y } = gridSystem.gridToPixel(gx, row);
            // Use frame 3 (vertical bridge piece) for middle rows
            scene.add.image(x, y, 'bridge', dy === 0 ? 0 : dy === 2 ? 6 : 3).setDepth(0);
        }
    }
}

/**
 * Render a single decoration item.
 */
function renderDecoration(scene, gridSystem, deco) {
    const { type, variant, gx, gy } = deco;
    const { x, y } = gridSystem.gridToPixel(gx, gy);
    const depth = gy * TILE_SIZE; // y-sort decorations

    if (type === 'tree') {
        const key = `tree${variant}`;
        // Trees: variant 1-2 are 192×256, variant 3-4 are 192×192
        const yOffset = (variant <= 2) ? -48 : -24;
        const tree = scene.add.sprite(x, y + yOffset, key, 0);
        tree.setScale(0.7);
        tree.setDepth(depth);
        // Create idle sway animation if not already created
        const animKey = `${key}_sway`;
        if (!scene.anims.exists(animKey)) {
            scene.anims.create({
                key: animKey,
                frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
                frameRate: 6,
                repeat: -1,
            });
        }
        tree.play(animKey);
    } else if (type === 'bush') {
        const key = `bush${variant}`;
        // Bushes are animated spritesheets (128×128, 8 frames)
        const bush = scene.add.sprite(x, y, key, 0);
        bush.setScale(0.6);
        bush.setDepth(depth);
        const animKey = `${key}_sway`;
        if (!scene.anims.exists(animKey)) {
            scene.anims.create({
                key: animKey,
                frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
                frameRate: 5,
                repeat: -1,
            });
        }
        bush.play(animKey);
    } else if (type === 'rock') {
        const key = `rock${variant}`;
        scene.add.image(x, y, key).setDepth(depth);
    } else if (type === 'stump') {
        const key = `stump${variant}`;
        scene.add.image(x, y, key).setDepth(depth);
    } else if (type === 'deco') {
        const key = `deco_${String(variant).padStart(2, '0')}`;
        scene.add.image(x, y, key).setDepth(depth);
    }
}

/**
 * Mark water and elevation cells as occupied/blocked in the grid system.
 * Bridge cells override water to be walkable.
 */
function applyBlockedCells(gridSystem, terrain, bridges) {
    // Build a set of bridge cells for quick lookup
    const bridgeCells = new Set();
    if (bridges) {
        for (const b of bridges) {
            for (let dy = 0; dy < 3; dy++) {
                const row = b.gy + dy;
                if (row < GRID_ROWS) {
                    bridgeCells.add(`${b.gx},${row}`);
                }
            }
        }
    }

    for (let gy = 0; gy < GRID_ROWS; gy++) {
        for (let gx = 0; gx < GRID_COLS; gx++) {
            const cell = terrain[gy][gx];
            if (cell === 'W' || cell === 'E') {
                // Skip if it's a bridge cell
                if (bridgeCells.has(`${gx},${gy}`)) continue;
                gridSystem.occupy(gx, gy, 1, 1, 'terrain');
            }
        }
    }
}
