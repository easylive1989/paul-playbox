import { TILE_SIZE, GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';

export default class GridSystem {
    constructor() {
        // Occupancy grid: 0 = free, otherwise building/unit id
        this.grid = Array.from({ length: GRID_ROWS }, () =>
            new Array(GRID_COLS).fill(0)
        );
    }

    // Convert grid coords to pixel center
    gridToPixel(gx, gy) {
        return {
            x: gx * TILE_SIZE + TILE_SIZE / 2,
            y: gy * TILE_SIZE + TILE_SIZE / 2
        };
    }

    // Convert pixel to grid coords
    pixelToGrid(px, py) {
        return {
            gx: Math.floor(px / TILE_SIZE),
            gy: Math.floor(py / TILE_SIZE)
        };
    }

    // Mark a rectangular area as occupied
    occupy(gx, gy, width, height, id) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const cx = gx + dx;
                const cy = gy + dy;
                if (this.inBounds(cx, cy)) {
                    this.grid[cy][cx] = id;
                }
            }
        }
    }

    // Free a rectangular area
    free(gx, gy, width, height) {
        this.occupy(gx, gy, width, height, 0);
    }

    // Check if a rectangular area is free
    isFree(gx, gy, width, height) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const cx = gx + dx;
                const cy = gy + dy;
                if (!this.inBounds(cx, cy) || this.grid[cy][cx] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if a single cell is walkable (free)
    isWalkable(gx, gy) {
        return this.inBounds(gx, gy) && this.grid[gy][gx] === 0;
    }

    // Check if a straight line between two grid cells crosses only walkable cells
    hasLineOfSight(gx1, gy1, gx2, gy2) {
        const dx = Math.abs(gx2 - gx1);
        const dy = Math.abs(gy2 - gy1);
        const sx = gx1 < gx2 ? 1 : -1;
        const sy = gy1 < gy2 ? 1 : -1;
        let err = dx - dy;
        let x = gx1, y = gy1;

        while (x !== gx2 || y !== gy2) {
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
            if ((x !== gx2 || y !== gy2) && !this.isWalkable(x, y)) return false;
        }
        return true;
    }

    inBounds(gx, gy) {
        return gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS;
    }

    // Find the nearest free cell adjacent to a building, preferring the bottom-center (doorway)
    findAdjacentFreeCell(gx, gy, width, height) {
        // Try bottom-center first (doorway)
        const midX = gx + Math.floor(width / 2);
        const bottomY = gy + height;
        if (this.isWalkable(midX, bottomY)) {
            return { gx: midX, gy: bottomY };
        }

        // Fallback: scan all adjacent cells, bottom row first
        const candidates = [];
        for (let dy = height; dy >= -1; dy--) {
            for (let dx = -1; dx <= width; dx++) {
                if (dy >= 0 && dy < height && dx >= 0 && dx < width) continue;
                const cx = gx + dx;
                const cy = gy + dy;
                if (this.isWalkable(cx, cy)) {
                    candidates.push({ gx: cx, gy: cy });
                }
            }
        }
        return candidates.length > 0 ? candidates[0] : null;
    }
}
