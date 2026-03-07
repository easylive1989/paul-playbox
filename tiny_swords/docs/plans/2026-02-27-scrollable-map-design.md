# Scrollable Map Design

## Summary

Expand the game map to 4x area (40x24 grid, 2560x1536 px) while keeping the viewport at 1280x768. Add arrow buttons and keyboard arrow keys for camera scrolling.

## Section 1: World & Camera

**Map config changes:**
- `GRID_COLS`: 20 -> 40
- `GRID_ROWS`: 12 -> 24
- `WORLD_WIDTH`: 1280 -> 2560
- `WORLD_HEIGHT`: 768 -> 1536
- New constants: `VIEWPORT_WIDTH = 1280`, `VIEWPORT_HEIGHT = 768`

**Camera setup:**
- `camera.setBounds(0, 0, 2560, 1536)`
- Viewport stays 1280x768
- Initial position: top-left (0, 0)

**Terrain:**
- Grass area: col 1-38, row 1-22 (1-tile border of paper/water)
- `SpecialPaper` background expands to 2560x1536

**Game zones:**
- Player zone stays at left ~14 columns
- Enemy spawn moves to rightmost 2 columns (col 38-39)
- Large buildable space in the middle

## Section 2: Scroll Controls

**Arrow buttons:**
- Four directional buttons fixed at top/bottom/left/right edges of viewport (centered)
- `setScrollFactor(0)` to stay fixed on screen
- Semi-transparent style
- Hold (pointerdown) to scroll continuously; release (pointerup/pointerout) to stop
- Hide button when camera reaches that direction's boundary

**Keyboard arrow keys:**
- Arrow keys trigger identical scrolling behavior
- Hold to scroll, release to stop

**Scroll parameters:**
- Speed: ~300 px/s (~5 tiles/s), tunable
- Calculated in `update()`: `camera.scrollX += speed * delta`
- Camera bounds automatically prevent overscroll

## Section 3: UI & System Adjustments

**Fixed UI elements (setScrollFactor(0)):**
- Gold display (icon + text)
- Build buttons (Barracks, GoldMine)
- Game over overlay
- Arrow buttons themselves

**GridSystem:**
- Occupancy grid expands from 12x20 to 24x40
- `pixelToGrid()` / `gridToPixel()` unchanged (pure math)
- A* pathfinding range follows new grid size

**Input system:**
- `pointer.worldX / worldY` auto-corrects with camera scroll; no manual fix needed
- Building placement and unit selection click logic unchanged

**Enemy spawn:**
- `ENEMY_SPAWN_MIN_X`: 18 -> 38

**Depth sorting:**
- Y-sort (`sprite.setDepth(pos.y)`) works unchanged with larger value range
