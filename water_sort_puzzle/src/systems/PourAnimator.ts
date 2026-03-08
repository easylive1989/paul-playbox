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
    const isLeft = fromBottle.x < toBottle.x;
    const targetX = toBottle.x + (isLeft ? -BOTTLE.TOP_WIDTH : BOTTLE.TOP_WIDTH);
    const targetY = toBottle.y - ANIM.LIFT_Y - 20;

    await tweenPromise(this.scene, {
      targets: fromBottle,
      x: targetX,
      y: targetY,
      duration: ANIM.MOVE_MS,
      ease: 'Quad.easeInOut',
    });

    // Step 3: Tilt + pour
    const tiltAngle = isLeft ? -ANIM.TILT_ANGLE : ANIM.TILT_ANGLE;
    const tiltRad = Phaser.Math.DegToRad(tiltAngle);

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
    // Calculate pour origin (bottle mouth in world coords)
    const mouthLocalX = 0;
    const mouthLocalY = 0;
    const angleRad = Phaser.Math.DegToRad(fromBottle.angle);
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const p0: Point = {
      x: fromBottle.x + mouthLocalX * cosA - mouthLocalY * sinA,
      y: fromBottle.y + mouthLocalX * sinA + mouthLocalY * cosA,
    };

    // Target: top of target bottle mouth
    const p2: Point = {
      x: toBottle.x,
      y: toBottle.y,
    };

    // Control point: arch above midpoint
    const p1: Point = {
      x: (p0.x + p2.x) / 2 + (isLeft ? 10 : -10),
      y: Math.min(p0.y, p2.y) - 40,
    };

    const duration = ANIM.POUR_LAYER_MS;
    const startTime = this.scene.time.now;

    return new Promise(resolve => {
      const update = () => {
        const elapsed = this.scene.time.now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        this.streamGfx.clear();
        this.streamGfx.lineStyle(ANIM.STREAM_WIDTH, color, 1);
        this.streamGfx.beginPath();

        const steps = 20;
        // Draw stream from start to current progress
        const headT = progress;
        const tailT = Math.max(0, progress - 0.4);

        for (let s = 0; s <= steps; s++) {
          const t = tailT + (headT - tailT) * (s / steps);
          const pt = quadraticBezier(p0, p1, p2, t);
          if (s === 0) {
            this.streamGfx.moveTo(pt.x, pt.y);
          } else {
            this.streamGfx.lineTo(pt.x, pt.y);
          }
        }
        this.streamGfx.strokePath();

        if (progress >= 1) {
          this.streamGfx.clear();
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
