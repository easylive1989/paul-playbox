import Phaser from 'phaser';
import { Bottle } from '../objects/Bottle';
import { ANIM, BOTTLE } from '../config/gameConfig';
import { PourResult } from './GameState';
import { quadraticBezier, Point } from '../utils/math';

function tweenPromise(scene: Phaser.Scene, config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise(resolve => {
    scene.tweens.add({
      ...config,
      onComplete: () => resolve(),
    });
  });
}

export class PourAnimator {
  private scene: Phaser.Scene;
  private streamGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.streamGfx = scene.add.graphics();
    this.streamGfx.setDepth(100);
  }

  async animate(
    fromBottle: Bottle,
    toBottle: Bottle,
    result: PourResult,
    allBottles: Bottle[],
    gameStateBottles: (number | null)[][],
  ): Promise<void> {
    const origX = fromBottle.x;
    const origY = fromBottle.y;

    // Bring source bottle to top
    fromBottle.setDepth(10);

    // Step 1: Lift
    await tweenPromise(this.scene, {
      targets: fromBottle,
      y: origY - ANIM.LIFT_Y,
      duration: ANIM.LIFT_MS,
      ease: 'Quad.easeOut',
    });

    // Step 2: Move to above target bottle
    // isLeft = source is to the left of target → tilt right (positive angle) toward target
    const isLeft = fromBottle.x <= toBottle.x;
    const tiltAngle = isLeft ? ANIM.TILT_ANGLE : -ANIM.TILT_ANGLE;
    const tiltRad = Phaser.Math.DegToRad(tiltAngle);

    // After tilting, the pour lip (edge of mouth on the target side) moves.
    // Lip local position: (halfTop, 0) for right tilt, (-halfTop, 0) for left tilt
    const halfTop = BOTTLE.TOP_WIDTH / 2;
    const lipLocalX = isLeft ? halfTop : -halfTop;
    const cosA = Math.cos(tiltRad);
    const sinA = Math.sin(tiltRad);
    // Lip world offset from container origin after rotation
    const lipOffsetX = lipLocalX * cosA;
    const lipOffsetY = lipLocalX * sinA;

    // Position source so that after tilting, the lip is above the target mouth center
    const targetX = toBottle.x - lipOffsetX;
    const targetY = toBottle.y - lipOffsetY - 15;

    await tweenPromise(this.scene, {
      targets: fromBottle,
      x: targetX,
      y: targetY,
      duration: ANIM.MOVE_MS,
      ease: 'Quad.easeInOut',
    });

    // Pre-pour state: save source layers before pour (GameState already executed)
    // We need to animate the visual change layer by layer
    const pourColor = result.color;
    const pourCount = result.count;

    // Temporarily restore source bottle visuals to pre-pour state
    const prePourFrom = this.reconstructPrePour(gameStateBottles[result.fromIdx], pourColor, pourCount);
    fromBottle.layers = prePourFrom;
    fromBottle.redraw();

    // Tilt animation
    await tweenPromise(this.scene, {
      targets: fromBottle,
      angle: tiltAngle,
      duration: ANIM.TILT_MS,
      ease: 'Quad.easeInOut',
    });

    // Step 4: Pour layers one by one
    for (let i = 0; i < pourCount; i++) {
      // Remove one layer from source visual
      this.removeTopLayer(fromBottle);
      fromBottle.redraw();

      // Animate stream
      await this.animateStream(fromBottle, toBottle, pourColor, tiltRad, isLeft);

      // Add one layer to target visual
      this.addLayer(toBottle, pourColor);
      toBottle.redraw();
    }

    // Step 5: Untilt
    await tweenPromise(this.scene, {
      targets: fromBottle,
      angle: 0,
      duration: ANIM.UNTILT_MS,
      ease: 'Quad.easeInOut',
    });

    // Step 6: Return to original position
    await tweenPromise(this.scene, {
      targets: fromBottle,
      x: origX,
      y: origY,
      duration: ANIM.RETURN_MS,
      ease: 'Quad.easeInOut',
    });

    fromBottle.setDepth(0);
  }

  private async animateStream(
    fromBottle: Bottle,
    toBottle: Bottle,
    color: number,
    _tiltRad: number,
    isLeft: boolean,
  ): Promise<void> {
    // Calculate pour lip position (edge of mouth on the pouring side)
    const halfTop = BOTTLE.TOP_WIDTH / 2;
    const lipLocalX = isLeft ? halfTop : -halfTop;
    const angleRad = Phaser.Math.DegToRad(fromBottle.angle);
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const p0: Point = {
      x: fromBottle.x + lipLocalX * cosA,
      y: fromBottle.y + lipLocalX * sinA,
    };

    // Target: top of target bottle mouth
    const p2: Point = {
      x: toBottle.x,
      y: toBottle.y,
    };

    // Control point: gentle arc (gravity-like parabola)
    const p1: Point = {
      x: p0.x + (p2.x - p0.x) * 0.3,
      y: Math.min(p0.y, p2.y) - 20,
    };

    const duration = ANIM.POUR_LAYER_MS;
    const startTime = this.scene.time.now;

    // Droplet particles
    const droplets: Phaser.GameObjects.Arc[] = [];

    return new Promise(resolve => {
      const update = () => {
        const elapsed = this.scene.time.now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        this.streamGfx.clear();

        const steps = 24;
        const headT = progress;
        const tailT = Math.max(0, progress - 0.5);

        // Build left/right edge points along the curve with varying width
        const leftEdge: Point[] = [];
        const rightEdge: Point[] = [];

        const startWidth = 5;   // width at pour lip
        const endWidth = 2;     // narrow at the tip (gravity stretching)
        const time = this.scene.time.now * 0.008; // for wobble

        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;  // 0..1 along the visible stream
          const t = tailT + (headT - tailT) * frac;
          const pt = quadraticBezier(p0, p1, p2, t);

          // Tangent for normal direction
          const dt = 0.01;
          const ptNext = quadraticBezier(p0, p1, p2, Math.min(t + dt, 1));
          const dx = ptNext.x - pt.x;
          const dy = ptNext.y - pt.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;

          // Width: thick at start, thin at end, with slight wobble
          const widthFrac = 1 - frac;  // 1 at tail (lip), 0 at head (tip)
          const wobble = Math.sin(time + frac * 12) * 0.6;
          const halfW = (endWidth + (startWidth - endWidth) * widthFrac * widthFrac + wobble) * 0.5;

          leftEdge.push({ x: pt.x + nx * halfW, y: pt.y + ny * halfW });
          rightEdge.push({ x: pt.x - nx * halfW, y: pt.y - ny * halfW });
        }

        // Draw filled stream polygon
        this.streamGfx.fillStyle(color, 0.9);
        this.streamGfx.beginPath();
        this.streamGfx.moveTo(leftEdge[0].x, leftEdge[0].y);
        for (let i = 1; i < leftEdge.length; i++) {
          this.streamGfx.lineTo(leftEdge[i].x, leftEdge[i].y);
        }
        for (let i = rightEdge.length - 1; i >= 0; i--) {
          this.streamGfx.lineTo(rightEdge[i].x, rightEdge[i].y);
        }
        this.streamGfx.closePath();
        this.streamGfx.fillPath();

        // Lighter highlight streak along center for glossy look
        this.streamGfx.lineStyle(1.5, 0xffffff, 0.15);
        this.streamGfx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const t = tailT + (headT - tailT) * frac;
          const pt = quadraticBezier(p0, p1, p2, t);
          if (s === 0) this.streamGfx.moveTo(pt.x, pt.y);
          else this.streamGfx.lineTo(pt.x, pt.y);
        }
        this.streamGfx.strokePath();

        // Spawn small droplets near the stream tip
        if (progress > 0.2 && progress < 0.95 && Math.random() < 0.4) {
          const tipT = headT;
          const tip = quadraticBezier(p0, p1, p2, tipT);
          const droplet = this.scene.add.circle(
            tip.x + (Math.random() - 0.5) * 8,
            tip.y + (Math.random() - 0.5) * 4,
            Math.random() * 1.5 + 1,
            color,
            0.7,
          );
          droplet.setDepth(100);
          droplets.push(droplet);

          this.scene.tweens.add({
            targets: droplet,
            y: droplet.y + 15 + Math.random() * 10,
            alpha: 0,
            scale: 0.3,
            duration: 200 + Math.random() * 150,
            onComplete: () => droplet.destroy(),
          });
        }

        if (progress >= 1) {
          this.streamGfx.clear();
          droplets.forEach(d => d.destroy());
          resolve();
        } else {
          this.scene.time.delayedCall(16, update);
        }
      };
      update();
    });
  }

  private reconstructPrePour(currentLayers: (number | null)[], color: number, count: number): (number | null)[] {
    const layers = [...currentLayers];
    // Add back the poured layers on top
    let added = 0;
    for (let i = 0; i < layers.length && added < count; i++) {
      if (layers[i] === null) {
        // Find the first null from the top of filled area
        // We need to add on top of existing
        break;
      }
    }
    // Find top of filled
    let topIdx = -1;
    for (let i = layers.length - 1; i >= 0; i--) {
      if (layers[i] !== null) {
        topIdx = i;
        break;
      }
    }
    // Add count layers above
    for (let i = 0; i < count; i++) {
      const idx = topIdx + 1 + i;
      if (idx < layers.length) {
        layers[idx] = color;
      }
    }
    return layers;
  }

  private removeTopLayer(bottle: Bottle): void {
    for (let i = bottle.layers.length - 1; i >= 0; i--) {
      if (bottle.layers[i] !== null) {
        bottle.layers[i] = null;
        return;
      }
    }
  }

  private addLayer(bottle: Bottle, color: number): void {
    for (let i = 0; i < bottle.layers.length; i++) {
      if (bottle.layers[i] === null) {
        bottle.layers[i] = color;
        return;
      }
    }
  }

  destroy(): void {
    this.streamGfx.destroy();
  }
}
