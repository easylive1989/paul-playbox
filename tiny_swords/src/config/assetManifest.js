// Centralized asset manifest — all keys, paths, and frame configs

const UNITS_BLUE = 'assets/Units/Blue Units';
const GOBLINS = 'assets/Factions/Goblins/Troops';
const KNIGHTS_BUILDINGS = 'assets/Factions/Knights/Buildings';
const BLUE_BUILDINGS = 'assets/Buildings/Blue Buildings';
const RESOURCES = 'assets/Resources';
const TERRAIN = 'assets/Terrain';
const EFFECTS = 'assets/Effects';
const UI = 'assets/UI Elements';
const DECO = 'assets/Decorations';

// Spritesheet definitions: { key, path, frameWidth, frameHeight }
export const spritesheets = [
    // --- Player units (single-row strips, 192×192 frames) ---
    { key: 'warrior_idle',     path: `${UNITS_BLUE}/Warrior/Warrior_Idle.png`,        frameWidth: 192, frameHeight: 192 },
    { key: 'warrior_run',      path: `${UNITS_BLUE}/Warrior/Warrior_Run.png`,         frameWidth: 192, frameHeight: 192 },
    { key: 'warrior_attack',   path: `${UNITS_BLUE}/Warrior/Warrior_Attack1.png`,     frameWidth: 192, frameHeight: 192 },

    // --- Archer ---
    { key: 'archer_idle',      path: `${UNITS_BLUE}/Archer/Archer_Idle.png`,         frameWidth: 192, frameHeight: 192 },
    { key: 'archer_run',       path: `${UNITS_BLUE}/Archer/Archer_Run.png`,          frameWidth: 192, frameHeight: 192 },
    { key: 'archer_shoot',     path: `${UNITS_BLUE}/Archer/Archer_Shoot.png`,        frameWidth: 192, frameHeight: 192 },

    // --- Monk ---
    { key: 'monk_idle',        path: `${UNITS_BLUE}/Monk/Idle.png`,                  frameWidth: 192, frameHeight: 192 },
    { key: 'monk_run',         path: `${UNITS_BLUE}/Monk/Run.png`,                   frameWidth: 192, frameHeight: 192 },
    { key: 'monk_heal',        path: `${UNITS_BLUE}/Monk/Heal.png`,                  frameWidth: 192, frameHeight: 192 },

    // --- Enemy units (multi-row sheets) ---
    { key: 'goblin_torch',     path: `${GOBLINS}/Torch/Red/Torch_Red.png`,   frameWidth: 192, frameHeight: 192 },
    { key: 'goblin_barrel',    path: `${GOBLINS}/Barrel/Red/Barrel_Red.png`,  frameWidth: 128, frameHeight: 128 },
    { key: 'goblin_tnt',       path: `${GOBLINS}/TNT/Red/TNT_Red.png`,       frameWidth: 192, frameHeight: 192 },

    // --- Effects ---
    { key: 'explosions',       path: `${EFFECTS}/Explosion/Explosions.png`,   frameWidth: 192, frameHeight: 192 },
    { key: 'fire',             path: `${EFFECTS}/Fire/Fire.png`,              frameWidth: 128, frameHeight: 128 },

    // --- Resources ---
    { key: 'gold_spawn',       path: `${RESOURCES}/Resources/G_Spawn.png`,    frameWidth: 128, frameHeight: 128 },

    // --- Terrain ---
    { key: 'tilemap_flat',       path: `${TERRAIN}/Ground/Tilemap_Flat.png`,          frameWidth: 64, frameHeight: 64 },
    { key: 'tilemap_elevation',  path: `${TERRAIN}/Ground/Tilemap_Elevation.png`,     frameWidth: 64, frameHeight: 64 },
    { key: 'bridge',             path: `${TERRAIN}/Bridge/Bridge_All.png`,            frameWidth: 64, frameHeight: 64 },

    // --- Trees (animated, 192×256, 8 frames) ---
    { key: 'tree1', path: `${DECO}/Trees/Tree1.png`, frameWidth: 192, frameHeight: 256 },
    { key: 'tree2', path: `${DECO}/Trees/Tree2.png`, frameWidth: 192, frameHeight: 256 },
    { key: 'tree3', path: `${DECO}/Trees/Tree3.png`, frameWidth: 192, frameHeight: 192 },
    { key: 'tree4', path: `${DECO}/Trees/Tree4.png`, frameWidth: 192, frameHeight: 192 },

    // --- Bushes (animated, 128×128, 8 frames) ---
    { key: 'bush1', path: `${DECO}/Bushes/Bushe1.png`, frameWidth: 128, frameHeight: 128 },
    { key: 'bush2', path: `${DECO}/Bushes/Bushe2.png`, frameWidth: 128, frameHeight: 128 },
    { key: 'bush3', path: `${DECO}/Bushes/Bushe3.png`, frameWidth: 128, frameHeight: 128 },
    { key: 'bush4', path: `${DECO}/Bushes/Bushe4.png`, frameWidth: 128, frameHeight: 128 },

    // --- UI Bars (spritesheet for 3-slice) ---
    { key: 'ui_bigbar_base',   path: `${UI}/UI Elements/Bars/BigBar_Base.png`, frameWidth: 64, frameHeight: 64 },

];

// Static image definitions: { key, path }
export const images = [
    // --- Buildings ---
    { key: 'castle_blue',          path: `${KNIGHTS_BUILDINGS}/Castle/Castle_Blue.png` },
    { key: 'castle_construction',  path: `${KNIGHTS_BUILDINGS}/Castle/Castle_Construction.png` },
    { key: 'castle_destroyed',     path: `${KNIGHTS_BUILDINGS}/Castle/Castle_Destroyed.png` },
    { key: 'barracks',             path: `${BLUE_BUILDINGS}/Barracks.png` },
    { key: 'tower',                path: `${BLUE_BUILDINGS}/Tower.png` },
    { key: 'archery',              path: `${BLUE_BUILDINGS}/Archery.png` },
    { key: 'house',                path: `${BLUE_BUILDINGS}/House1.png` },
    { key: 'monastery',            path: `${BLUE_BUILDINGS}/Monastery.png` },

    // --- Arrow projectile ---
    { key: 'arrow',                path: `${UNITS_BLUE}/Archer/Arrow.png` },

    // --- Gold Mine ---
    { key: 'goldmine_active',      path: `${RESOURCES}/Gold Mine/GoldMine_Active.png` },
    { key: 'goldmine_inactive',    path: `${RESOURCES}/Gold Mine/GoldMine_Inactive.png` },

    // --- Resources UI ---
    { key: 'gold_icon',            path: `${RESOURCES}/Resources/G_Idle.png` },

    // --- Terrain ---
    { key: 'water',                path: `${TERRAIN}/Water/Water.png` },

    // --- Decorations (static) ---
    { key: 'rock1',    path: `${DECO}/Rocks/Rock1.png` },
    { key: 'rock2',    path: `${DECO}/Rocks/Rock2.png` },
    { key: 'rock3',    path: `${DECO}/Rocks/Rock3.png` },
    { key: 'rock4',    path: `${DECO}/Rocks/Rock4.png` },
    { key: 'stump1',   path: `${DECO}/Trees/Stump1.png` },
    { key: 'stump2',   path: `${DECO}/Trees/Stump2.png` },
    { key: 'stump3',   path: `${DECO}/Trees/Stump3.png` },
    { key: 'stump4',   path: `${DECO}/Trees/Stump4.png` },
    { key: 'deco_01',  path: `${DECO}/Deco/01.png` },
    { key: 'deco_02',  path: `${DECO}/Deco/02.png` },
    { key: 'deco_03',  path: `${DECO}/Deco/03.png` },
    { key: 'deco_04',  path: `${DECO}/Deco/04.png` },
    { key: 'deco_05',  path: `${DECO}/Deco/05.png` },
    { key: 'deco_06',  path: `${DECO}/Deco/06.png` },
    { key: 'deco_07',  path: `${DECO}/Deco/07.png` },
    { key: 'deco_08',  path: `${DECO}/Deco/08.png` },
    { key: 'deco_09',  path: `${DECO}/Deco/09.png` },
    { key: 'deco_10',  path: `${DECO}/Deco/10.png` },
    { key: 'deco_11',  path: `${DECO}/Deco/11.png` },
    { key: 'deco_12',  path: `${DECO}/Deco/12.png` },
    { key: 'deco_13',  path: `${DECO}/Deco/13.png` },
    { key: 'deco_14',  path: `${DECO}/Deco/14.png` },
    { key: 'deco_15',  path: `${DECO}/Deco/15.png` },
    { key: 'deco_16',  path: `${DECO}/Deco/16.png` },
    { key: 'deco_17',  path: `${DECO}/Deco/17.png` },
    { key: 'deco_18',  path: `${DECO}/Deco/18.png` },

    // --- UI Elements ---
    { key: 'ui_carved',           path: `${UI}/Banners/Carved_3Slides.png` },
    { key: 'ui_ribbon_yellow',    path: `${UI}/Ribbons/Ribbon_Yellow_3Slides.png` },
    { key: 'ui_banner_h',         path: `${UI}/Banners/Banner_Horizontal.png` },
    { key: 'ui_btn_blue',         path: `${UI}/Buttons/Button_Blue_3Slides.png` },
    { key: 'ui_btn_blue_pressed', path: `${UI}/Buttons/Button_Blue_3Slides_Pressed.png` },
    { key: 'ui_btn_disable',      path: `${UI}/Buttons/Button_Disable_3Slides.png` },
    { key: 'ui_btn_hover',        path: `${UI}/Buttons/Button_Hover_3Slides.png` },
    { key: 'ui_btn_sq_blue',      path: `${UI}/Buttons/Button_Blue.png` },
    { key: 'ui_btn_sq_pressed',   path: `${UI}/Buttons/Button_Blue_Pressed.png` },
    { key: 'ui_btn_sq_hover',     path: `${UI}/Buttons/Button_Hover.png` },
    { key: 'ui_btn_sq_disable',   path: `${UI}/Buttons/Button_Disable.png` },
    { key: 'ui_bar_base',         path: `${UI}/UI Elements/Bars/SmallBar_Base.png` },
    { key: 'ui_bar_fill',         path: `${UI}/UI Elements/Bars/SmallBar_Fill.png` },
    { key: 'ui_bigbar_fill',     path: `${UI}/UI Elements/Bars/BigBar_Fill.png` },
    { key: 'ui_icon_coin',        path: `${UI}/UI Elements/Icons/Icon_03.png` },
    { key: 'ui_icon_sword',       path: `${UI}/UI Elements/Icons/Icon_05.png` },
    { key: 'ui_icon_hammer',      path: `${UI}/UI Elements/Icons/Icon_01.png` },
    { key: 'ui_avatar_knight',    path: `${UI}/UI Elements/Human Avatars/Avatars_01.png` },
    { key: 'ui_avatar_archer',    path: `${UI}/UI Elements/Human Avatars/Avatars_02.png` },
    { key: 'ui_avatar_monk',      path: `${UI}/UI Elements/Human Avatars/Avatars_03.png` },
    { key: 'ui_cursor_select',    path: `${UI}/UI Elements/Cursors/Cursor_04.png` },
    { key: 'ui_special_paper',  path: `${UI}/UI Elements/Papers/SpecialPaper.png` },
    { key: 'ui_regular_paper', path: `${UI}/UI Elements/Papers/RegularPaper.png` },

];
