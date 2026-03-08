import Phaser from 'phaser';
import { BOTTLE } from '../config/gameConfig';
import { BOTTLE_OUTLINE, BOTTLE_OUTLINE_SELECTED } from '../utils/colors';

export class Bottle extends Phaser.GameObjects.Container {
  layers: (number | null)[];  // bottom-to-top, null = empty
  selected = false;
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, layers: (number | null)[]) {
    super(scene, x, y);
    this.layers = [...layers];

    this.gfx = scene.add.graphics();
    this.add(this.gfx);

    this.setSize(BOTTLE.BOTTOM_WIDTH + 10, BOTTLE.HEIGHT + BOTTLE.NECK_HEIGHT + 10);
    this.setInteractive({ useHandCursor: true });

    this.redraw();
    scene.add.existing(this);
  }

  get topColor(): number | null {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      if (this.layers[i] !== null) return this.layers[i];
    }
    return null;
  }

  get topColorCount(): number {
    const color = this.topColor;
    if (color === null) return 0;
    let count = 0;
    for (let i = this.layers.length - 1; i >= 0; i--) {
      if (this.layers[i] === color) count++;
      else if (this.layers[i] !== null) break;
    }
    return count;
  }

  get filledCount(): number {
    return this.layers.filter(l => l !== null).length;
  }

  get emptySlots(): number {
    return BOTTLE.MAX_LAYERS - this.filledCount;
  }

  get isFull(): boolean {
    return this.filledCount === BOTTLE.MAX_LAYERS;
  }

  get isEmpty(): boolean {
    return this.filledCount === 0;
  }

  get isComplete(): boolean {
    if (!this.isFull) return false;
    const c = this.layers[0];
    return this.layers.every(l => l === c);
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.redraw();
  }

  redraw(): void {
    const g = this.gfx;
    g.clear();

    const { TOP_WIDTH, BOTTOM_WIDTH, HEIGHT, NECK_HEIGHT, LAYER_HEIGHT, OUTLINE_WIDTH, MAX_LAYERS } = BOTTLE;
    const halfTop = TOP_WIDTH / 2;
    const halfBottom = BOTTOM_WIDTH / 2;

    // Origin is at bottle mouth center (top center)
    // Neck: straight section from y=0 to y=NECK_HEIGHT
    // Body: trapezoid from y=NECK_HEIGHT to y=NECK_HEIGHT+HEIGHT
    // But we only have 4 layers of water in the body area (below neck)

    const bodyTop = NECK_HEIGHT;
    const bodyBottom = NECK_HEIGHT + HEIGHT;
    const bodyHeight = HEIGHT;

    // Draw water layers (bottom to top, inside the body)
    for (let i = 0; i < MAX_LAYERS; i++) {
      const color = this.layers[i];
      if (color === null) continue;

      const layerBottomY = bodyBottom - i * LAYER_HEIGHT;
      const layerTopY = layerBottomY - LAYER_HEIGHT;

      // Calculate width at each y position (linear interpolation)
      const tBottom = (layerBottomY - bodyTop) / bodyHeight;
      const tTop = (layerTopY - bodyTop) / bodyHeight;
      const halfWidthBottom = halfTop + (halfBottom - halfTop) * tBottom;
      const halfWidthTop = halfTop + (halfBottom - halfTop) * tTop;

      g.fillStyle(color, 1);
      g.beginPath();
      g.moveTo(-halfWidthTop, layerTopY);
      g.lineTo(halfWidthTop, layerTopY);
      g.lineTo(halfWidthBottom, layerBottomY);
      g.lineTo(-halfWidthBottom, layerBottomY);
      g.closePath();
      g.fillPath();
    }

    // Draw bottle outline
    const outlineColor = this.selected ? BOTTLE_OUTLINE_SELECTED : BOTTLE_OUTLINE;
    g.lineStyle(OUTLINE_WIDTH, outlineColor, 1);

    g.beginPath();
    // Left side: mouth -> neck -> body bottom
    g.moveTo(-halfTop, 0);
    g.lineTo(-halfTop, bodyTop);
    g.lineTo(-halfBottom, bodyBottom);
    // Bottom
    g.lineTo(halfBottom, bodyBottom);
    // Right side: body bottom -> neck -> mouth
    g.lineTo(halfTop, bodyTop);
    g.lineTo(halfTop, 0);
    g.strokePath();
  }
}
