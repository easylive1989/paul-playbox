import { GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';

// 8-directional Theta* pathfinding (any-angle A* variant)
const DIRS = [
    { dx: 0, dy: -1, cost: 1 },    // N
    { dx: 1, dy: -1, cost: 1.41 },  // NE
    { dx: 1, dy: 0, cost: 1 },      // E
    { dx: 1, dy: 1, cost: 1.41 },   // SE
    { dx: 0, dy: 1, cost: 1 },      // S
    { dx: -1, dy: 1, cost: 1.41 },  // SW
    { dx: -1, dy: 0, cost: 1 },     // W
    { dx: -1, dy: -1, cost: 1.41 }, // NW
];

function heuristic(ax, ay, bx, by) {
    // Euclidean distance (better for Theta* any-angle paths)
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

function euclideanDist(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

class MinHeap {
    constructor() {
        this.data = [];
    }

    push(item) {
        this.data.push(item);
        this._bubbleUp(this.data.length - 1);
    }

    pop() {
        const top = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = last;
            this._sinkDown(0);
        }
        return top;
    }

    get size() {
        return this.data.length;
    }

    _bubbleUp(i) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.data[i].f < this.data[parent].f) {
                [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
                i = parent;
            } else break;
        }
    }

    _sinkDown(i) {
        const n = this.data.length;
        while (true) {
            let smallest = i;
            const l = 2 * i + 1;
            const r = 2 * i + 2;
            if (l < n && this.data[l].f < this.data[smallest].f) smallest = l;
            if (r < n && this.data[r].f < this.data[smallest].f) smallest = r;
            if (smallest !== i) {
                [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
                i = smallest;
            } else break;
        }
    }
}

/**
 * Find a path from (sx,sy) to (ex,ey) on the grid.
 * @param {GridSystem} gridSystem
 * @param {number} sx - start grid x
 * @param {number} sy - start grid y
 * @param {number} ex - end grid x
 * @param {number} ey - end grid y
 * @returns {Array<{gx,gy}>|null} path array or null if no path
 */
export function findPath(gridSystem, sx, sy, ex, ey) {
    // Clamp to bounds
    sx = Math.max(0, Math.min(GRID_COLS - 1, sx));
    sy = Math.max(0, Math.min(GRID_ROWS - 1, sy));
    ex = Math.max(0, Math.min(GRID_COLS - 1, ex));
    ey = Math.max(0, Math.min(GRID_ROWS - 1, ey));

    // If target is not walkable, find nearest walkable cell
    if (!gridSystem.isWalkable(ex, ey)) {
        const nearest = findNearestWalkable(gridSystem, ex, ey);
        if (!nearest) return null;
        ex = nearest.gx;
        ey = nearest.gy;
    }

    if (sx === ex && sy === ey) return [];

    const key = (x, y) => y * GRID_COLS + x;
    const open = new MinHeap();
    const gScore = new Map();
    const cameFrom = new Map();   // key -> parent key
    const parentPos = new Map();  // key -> {x, y} for Theta* parent lookups
    const closed = new Set();

    const startKey = key(sx, sy);
    gScore.set(startKey, 0);
    parentPos.set(startKey, { x: sx, y: sy });
    open.push({ x: sx, y: sy, f: heuristic(sx, sy, ex, ey) });

    while (open.size > 0) {
        const current = open.pop();
        const ck = key(current.x, current.y);

        if (current.x === ex && current.y === ey) {
            return reconstructPath(cameFrom, current.x, current.y, sx, sy);
        }

        if (closed.has(ck)) continue;
        closed.add(ck);

        const currentG = gScore.get(ck);

        // Get parent of current for Theta* line-of-sight check
        const parentKey = cameFrom.get(ck);
        const parent = parentKey !== undefined ? parentPos.get(parentKey) : null;

        for (const dir of DIRS) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;

            if (!gridSystem.inBounds(nx, ny)) continue;
            if (!gridSystem.isWalkable(nx, ny)) continue;

            const nk = key(nx, ny);
            if (closed.has(nk)) continue;

            // For diagonal movement, check that both adjacent cells are walkable
            if (dir.dx !== 0 && dir.dy !== 0) {
                if (!gridSystem.isWalkable(current.x + dir.dx, current.y) ||
                    !gridSystem.isWalkable(current.x, current.y + dir.dy)) {
                    continue;
                }
            }

            let tentativeG, fromKey;

            // Theta*: try path through parent if line-of-sight exists
            if (parent && gridSystem.hasLineOfSight(parent.x, parent.y, nx, ny)) {
                const parentG = gScore.get(parentKey);
                tentativeG = parentG + euclideanDist(parent.x, parent.y, nx, ny);
                fromKey = parentKey;
            } else {
                // Standard A*: path through current
                tentativeG = currentG + dir.cost;
                fromKey = ck;
            }

            const prevG = gScore.get(nk);

            if (prevG === undefined || tentativeG < prevG) {
                gScore.set(nk, tentativeG);
                cameFrom.set(nk, fromKey);
                parentPos.set(nk, { x: nx, y: ny });
                open.push({ x: nx, y: ny, f: tentativeG + heuristic(nx, ny, ex, ey) });
            }
        }
    }

    return null; // no path found
}

function reconstructPath(cameFrom, ex, ey, sx, sy) {
    const path = [];
    let ck = ey * GRID_COLS + ex;
    const startKey = sy * GRID_COLS + sx;

    while (ck !== startKey) {
        const gy = Math.floor(ck / GRID_COLS);
        const gx = ck % GRID_COLS;
        path.unshift({ gx, gy });
        ck = cameFrom.get(ck);
        if (ck === undefined) break;
    }

    return path;
}

/**
 * Smooth a path by removing unnecessary intermediate waypoints using line-of-sight checks.
 * @param {GridSystem} gridSystem
 * @param {Array<{gx,gy}>} path
 * @returns {Array<{gx,gy}>} smoothed path
 */
export function smoothPath(gridSystem, path) {
    if (!path || path.length <= 2) return path;

    const result = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
        // Find the farthest visible point from current
        let farthest = current + 1;
        for (let i = path.length - 1; i > current + 1; i--) {
            if (gridSystem.hasLineOfSight(path[current].gx, path[current].gy, path[i].gx, path[i].gy)) {
                farthest = i;
                break;
            }
        }
        result.push(path[farthest]);
        current = farthest;
    }

    return result;
}

function findNearestWalkable(gridSystem, gx, gy) {
    // BFS outward to find nearest walkable cell
    for (let r = 1; r < Math.max(GRID_COLS, GRID_ROWS); r++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // only perimeter
                const nx = gx + dx;
                const ny = gy + dy;
                if (gridSystem.isWalkable(nx, ny)) {
                    return { gx: nx, gy: ny };
                }
            }
        }
    }
    return null;
}
