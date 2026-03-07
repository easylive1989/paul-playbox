// Game constants
export const TILE_SIZE = 64;
export const GRID_COLS = 40;
export const GRID_ROWS = 24;
export const GAME_WIDTH = TILE_SIZE * GRID_COLS;   // 2560
export const GAME_HEIGHT = TILE_SIZE * GRID_ROWS;  // 1536
export const VIEWPORT_WIDTH = 1280;
export const VIEWPORT_HEIGHT = 768;

// Castle starting position (center of map)
export const CASTLE_GX = 17;
export const CASTLE_GY = 10;

// Starting resources
export const STARTING_GOLD = 100;

// Population
export const STARTING_POP_CAP = 10;

// Unit costs
export const WARRIOR_COST = 75;
export const BARRACKS_COST = 150;
export const GOLDMINE_COST = 100;

// Unit stats
export const WARRIOR_HP = 100;
export const WARRIOR_SPEED = 80;
export const WARRIOR_DAMAGE = 15;
export const WARRIOR_ATTACK_RANGE = 1.2; // in tiles
export const WARRIOR_COOLDOWN = 1000;    // ms
export const WARRIOR_PRODUCE_TIME = 10000; // ms

// Archer
export const ARCHER_COST = 60;
export const ARCHER_HP = 60;
export const ARCHER_SPEED = 70;
export const ARCHER_DAMAGE = 10;
export const ARCHER_ATTACK_RANGE = 4;      // tiles (遠程)
export const ARCHER_COOLDOWN = 1200;       // ms
export const ARCHER_PRODUCE_TIME = 12000;  // ms

// Monk
export const MONK_COST = 80;
export const MONK_HP = 50;
export const MONK_SPEED = 75;
export const MONK_HEAL_AMOUNT = 15;
export const MONK_HEAL_RANGE = 3;          // tiles
export const MONK_HEAL_COOLDOWN = 2000;    // ms
export const MONK_PRODUCE_TIME = 15000;    // ms

// Building stats
export const CASTLE_HP = 1000;
export const BARRACKS_HP = 500;
export const GOLDMINE_HP = 300;
export const GOLDMINE_INCOME = 25;          // gold per tick
export const GOLDMINE_INCOME_INTERVAL = 5000; // ms

// Tower
export const TOWER_COST = 125;
export const TOWER_HP = 400;
export const TOWER_ATTACK_RANGE = 5;      // tiles
export const TOWER_DAMAGE = 12;
export const TOWER_COOLDOWN = 1500;        // ms

// Archery
export const ARCHERY_COST = 175;
export const ARCHERY_HP = 500;

// House
export const HOUSE_COST = 75;
export const HOUSE_HP = 200;
export const HOUSE_POP_BONUS = 5;

// Monastery
export const MONASTERY_COST = 200;
export const MONASTERY_HP = 500;

// Wave settings
export const WAVE_INTERVAL = 60000;  // ms
export const MAX_WAVES = 10;
