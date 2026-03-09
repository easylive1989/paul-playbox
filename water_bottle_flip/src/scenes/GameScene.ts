import Phaser from 'phaser';

const BOTTLE_WIDTH = 40;
const BOTTLE_HEIGHT = 120;
const GROUND_Y = 620;
const BOTTLE_START_Y = GROUND_Y - BOTTLE_HEIGHT / 2;

const WATER_LEVEL = 0.5;
const WATER_COLOR = 0x29b6f6;

export class GameScene extends Phaser.Scene {
  private bottle!: Phaser.GameObjects.Container;
  private bottleBody!: MatterJS.BodyType;
  private ground!: MatterJS.BodyType;

  private comOffsetY = 0;
  private isFlipping = false;
  private hasLanded = false;
  private resultShown = false;
  private landingCheckTimer = 0;

  // Controls
  private angleValue = 45; // degrees from vertical
  private powerValue = 50; // power percentage
  private isDragging = false;

  // UI elements
  private statusText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private dragInfoText!: Phaser.GameObjects.Text;

  // Arrow indicator
  private arrowGraphics!: Phaser.GameObjects.Graphics;

  // Water graphics inside bottle
  private waterGraphics!: Phaser.GameObjects.Graphics;
  private bottleGraphics!: Phaser.GameObjects.Graphics;
  private capGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.createBackground();
    this.createGround();
    this.createBottle();
    this.createUI();
    this.createArrow();
    this.createDragInteraction();

    // Collision event
    this.matter.world.on('collisionstart', this.onCollision, this);
  }

  private createBackground(): void {
    // Sky gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F7FA, 0xE0F7FA, 1);
    bg.fillRect(0, 0, 480, 720);

    // Clouds
    this.drawCloud(80, 80, 0.8);
    this.drawCloud(350, 120, 0.6);
    this.drawCloud(200, 50, 1.0);
  }

  private drawCloud(x: number, y: number, scale: number): void {
    const cloud = this.add.graphics();
    cloud.fillStyle(0xffffff, 0.7);
    cloud.fillCircle(x, y, 25 * scale);
    cloud.fillCircle(x + 20 * scale, y - 10 * scale, 20 * scale);
    cloud.fillCircle(x + 40 * scale, y, 25 * scale);
    cloud.fillCircle(x + 20 * scale, y + 5 * scale, 18 * scale);
  }

  private createGround(): void {
    // Visual ground
    const groundGfx = this.add.graphics();
    groundGfx.fillStyle(0x8B7355);
    groundGfx.fillRect(0, GROUND_Y, 480, 100);
    groundGfx.fillStyle(0x7CCD7C);
    groundGfx.fillRect(0, GROUND_Y - 5, 480, 10);

    // Physics ground (wider than canvas to catch bottles thrown off-screen)
    this.ground = this.matter.add.rectangle(240, GROUND_Y + 50, 800, 100, {
      isStatic: true,
      friction: 0.8,
      restitution: 0.1,
      label: 'ground',
    });
  }

  private createBottle(): void {
    const startX = 240;
    const startY = BOTTLE_START_Y;

    // Create bottle graphics
    this.bottleGraphics = this.add.graphics();
    this.waterGraphics = this.add.graphics();
    this.capGraphics = this.add.graphics();

    this.bottle = this.add.container(startX, startY, [
      this.bottleGraphics,
      this.waterGraphics,
      this.capGraphics,
    ]);

    this.drawBottleGraphics();

    // Physics body - a rectangle with custom center of mass based on water level
    const comOffsetY = this.calculateCenterOfMass(WATER_LEVEL);

    this.bottleBody = this.matter.add.rectangle(startX, startY, BOTTLE_WIDTH - 4, BOTTLE_HEIGHT - 4, {
      friction: 0.6,
      restitution: 0.05,
      density: 0.002 + WATER_LEVEL * 0.005,
      frictionAir: 0.01,
      label: 'bottle',
      chamfer: { radius: 4 },
    });

    // Set static AFTER creation so _original mass/inertia values are saved properly.
    // Creating with isStatic:true skips saving _original in Matter.js Body.setStatic,
    // which causes NaN positions when later switching to dynamic.
    this.matter.body.setStatic(this.bottleBody, true);

    // Set center of mass offset (lower = more stable)
    this.comOffsetY = comOffsetY;
    this.matter.body.setCentre(this.bottleBody, { x: 0, y: comOffsetY }, true);
  }

  private calculateCenterOfMass(waterLevel: number): number {
    // Water level 0 (empty) -> center of mass at bottom: offset ~20
    // Water level 1 (full) -> center of mass at middle: offset ~0
    // Low water = heavy bottom = more stable landing but harder flip
    return BOTTLE_HEIGHT * 0.15 * (1 - waterLevel);
  }

  private drawBottleGraphics(): void {
    const w = BOTTLE_WIDTH;
    const h = BOTTLE_HEIGHT;

    // Clear
    this.bottleGraphics.clear();
    this.waterGraphics.clear();
    this.capGraphics.clear();

    // Bottle body (transparent plastic)
    this.bottleGraphics.lineStyle(2, 0x90CAF9);
    this.bottleGraphics.fillStyle(0xBBDEFB, 0.3);

    // Bottle shape - wider at bottom, narrow neck at top
    const neckWidth = w * 0.4;
    const neckHeight = h * 0.2;
    const bodyWidth = w;
    const bodyHeight = h - neckHeight;

    // Body
    this.bottleGraphics.fillRoundedRect(-bodyWidth / 2, -h / 2 + neckHeight, bodyWidth, bodyHeight, 4);
    this.bottleGraphics.strokeRoundedRect(-bodyWidth / 2, -h / 2 + neckHeight, bodyWidth, bodyHeight, 4);

    // Neck
    this.bottleGraphics.fillRect(-neckWidth / 2, -h / 2, neckWidth, neckHeight + 4);
    this.bottleGraphics.strokeRect(-neckWidth / 2, -h / 2, neckWidth, neckHeight + 4);

    // Water inside
    const waterHeight = bodyHeight * WATER_LEVEL * 0.85;
    if (waterHeight > 0) {
      this.waterGraphics.fillStyle(WATER_COLOR, 0.6);
      this.waterGraphics.fillRoundedRect(
        -bodyWidth / 2 + 3,
        -h / 2 + neckHeight + bodyHeight - waterHeight - 2,
        bodyWidth - 6,
        waterHeight,
        { tl: 0, tr: 0, bl: 3, br: 3 }
      );
    }

    // Cap
    this.capGraphics.fillStyle(0xFFFFFF);
    this.capGraphics.fillRoundedRect(-neckWidth / 2 - 1, -h / 2 - 4, neckWidth + 2, 8, 3);
    this.capGraphics.lineStyle(1, 0x90CAF9);
    this.capGraphics.strokeRoundedRect(-neckWidth / 2 - 1, -h / 2 - 4, neckWidth + 2, 8, 3);

    // Label on bottle
    this.bottleGraphics.fillStyle(0x42A5F5, 0.4);
    this.bottleGraphics.fillRoundedRect(-bodyWidth / 2 + 2, -h / 2 + neckHeight + bodyHeight * 0.25, bodyWidth - 4, bodyHeight * 0.25, 2);
  }

  private createUI(): void {
    // Title
    this.add.text(240, 15, '🥤 丟水瓶挑戰', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#1565C0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Status text
    this.statusText = this.add.text(240, 300, '', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    // Drag info (angle & power shown during drag)
    this.dragInfoText = this.add.text(240, 650, '', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#37474F',
    }).setOrigin(0.5);

    // Instruction
    this.instructionText = this.add.text(240, 700, '按住瓶子拖曳設定方向與力道，放開丟出！', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#546E7A',
    }).setOrigin(0.5);

    // Keyboard input
    this.input.keyboard!.on('keydown-R', () => this.resetBottle());
  }

  private createArrow(): void {
    this.arrowGraphics = this.add.graphics();
  }

  private createDragInteraction(): void {
    const MAX_DRAG_DISTANCE = 150;
    const BOTTLE_HIT_RADIUS = 70;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isFlipping) return;

      // Check if pointer is near the bottle
      const dx = pointer.x - this.bottle.x;
      const dy = pointer.y - this.bottle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < BOTTLE_HIT_RADIUS) {
        this.isDragging = true;
        this.arrowGraphics.clear();
        this.dragInfoText.setText('');
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;

      const bottleX = this.bottle.x;
      const bottleY = this.bottle.y;
      const dx = pointer.x - bottleX;
      const dy = pointer.y - bottleY;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG_DISTANCE);

      if (dist < 10) {
        this.arrowGraphics.clear();
        this.dragInfoText.setText('');
        return;
      }

      // Angle from bottle to pointer (constrain to upper half: throw upward)
      let angleRad = Math.atan2(dy, dx);
      // Clamp to upper hemisphere (-170° to -10°)
      angleRad = Phaser.Math.Clamp(angleRad, -Math.PI * 0.94, -Math.PI * 0.06);

      // Convert to game values
      // angleValue: degrees from vertical (10-90)
      const angleDeg = -(Phaser.Math.RadToDeg(angleRad) + 90); // 0=straight up, 90=horizontal
      this.angleValue = Phaser.Math.Clamp(Math.round(angleDeg), 10, 90);
      this.powerValue = Phaser.Math.Clamp(Math.round((dist / MAX_DRAG_DISTANCE) * 100), 0, 100);

      this.drawArrow(bottleX, bottleY, angleRad, dist);
      this.dragInfoText.setText(`角度: ${this.angleValue}°  力道: ${this.powerValue}%`);
    });

    this.input.on('pointerup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.powerValue > 5) {
        this.flipBottle();
      } else {
        this.arrowGraphics.clear();
        this.dragInfoText.setText('');
      }
    });
  }

  private drawArrow(bottleX: number, bottleY: number, angleRad: number, length: number): void {
    this.arrowGraphics.clear();

    const endX = bottleX + Math.cos(angleRad) * length;
    const endY = bottleY + Math.sin(angleRad) * length;

    // Arrow line
    this.arrowGraphics.lineStyle(3, 0xE53935, 0.8);
    this.arrowGraphics.beginPath();
    this.arrowGraphics.moveTo(bottleX, bottleY);
    this.arrowGraphics.lineTo(endX, endY);
    this.arrowGraphics.strokePath();

    // Arrow head
    const headAngle1 = angleRad + Math.PI * 0.8;
    const headAngle2 = angleRad - Math.PI * 0.8;
    const headLen = 10;

    this.arrowGraphics.fillStyle(0xE53935, 0.8);
    this.arrowGraphics.fillTriangle(
      endX, endY,
      endX + Math.cos(headAngle1) * headLen, endY + Math.sin(headAngle1) * headLen,
      endX + Math.cos(headAngle2) * headLen, endY + Math.sin(headAngle2) * headLen,
    );
  }

  private flipBottle(): void {
    if (this.isFlipping) return;

    this.isFlipping = true;
    this.hasLanded = false;
    this.resultShown = false;
    this.landingCheckTimer = 0;
    this.statusText.setText('');
    this.arrowGraphics.clear();
    this.instructionText.setText('按 R 重置');

    // Make bottle dynamic
    this.matter.body.setStatic(this.bottleBody, false);

    // Calculate launch velocity
    const power = this.powerValue / 100;
    const angleRad = Phaser.Math.DegToRad(-this.angleValue - 90);

    const forceMultiplier = 0.08 + power * 0.12;
    const vx = Math.cos(angleRad) * forceMultiplier;
    const vy = Math.sin(angleRad) * forceMultiplier;

    // Apply force to bottle
    this.matter.body.setVelocity(this.bottleBody, { x: vx * 60, y: vy * 60 });

    // Add spin for 360 degree rotation
    // The spin should aim for approximately one full rotation
    const spinDirection = vx > 0 ? 1 : -1;
    const angularVelocity = spinDirection * (0.12 + power * 0.08);
    this.matter.body.setAngularVelocity(this.bottleBody, angularVelocity);
  }

  private onCollision = (_event: Phaser.Physics.Matter.Events.CollisionStartEvent, bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType): void => {
    if (!this.isFlipping || this.hasLanded) return;

    const bottleInvolved = bodyA === this.bottleBody || bodyB === this.bottleBody;
    const surfaceInvolved =
      bodyA.label === 'ground' || bodyB.label === 'ground';

    if (bottleInvolved && surfaceInvolved) {
      this.hasLanded = true;
      this.landingCheckTimer = 0;
    }
  };

  private checkLandingResult(): void {
    // Get the angle of the bottle (in radians)
    const angle = this.bottleBody.angle;

    // Normalize angle to 0-2PI
    let normalizedAngle = angle % (Math.PI * 2);
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

    // Check if bottle is approximately upright
    // Upright = angle near 0 or 2PI (tolerance ~15 degrees)
    const tolerance = Phaser.Math.DegToRad(15);
    const isUpright =
      normalizedAngle < tolerance ||
      normalizedAngle > Math.PI * 2 - tolerance;

    // Check if bottle has minimal velocity (is settled)
    const vel = this.bottleBody.velocity;
    const angVel = this.bottleBody.angularVelocity;
    const isSettled = Math.abs(vel.x) < 0.3 && Math.abs(vel.y) < 0.3 && Math.abs(angVel) < 0.02;

    // Check total rotation (should be at least ~300 degrees for a valid flip)
    const totalRotation = Math.abs(angle);
    const hasFlipped = totalRotation > Phaser.Math.DegToRad(300);

    if (isSettled && !this.resultShown) {
      this.resultShown = true;

      if (isUpright && hasFlipped) {
        this.statusText.setText('🎉 成功！');
        this.statusText.setColor('#4CAF50');
        this.celebrationEffect();
      } else if (!hasFlipped) {
        this.statusText.setText('❌ 翻轉不夠！');
        this.statusText.setColor('#F44336');
      } else {
        this.statusText.setText('💥 倒了！');
        this.statusText.setColor('#F44336');
      }
    }
  }

  private celebrationEffect(): void {
    // Particle-like celebration
    for (let i = 0; i < 20; i++) {
      const x = this.bottle.x + Phaser.Math.Between(-50, 50);
      const y = this.bottle.y + Phaser.Math.Between(-80, -20);
      const colors = [0xFFD700, 0xFF6B6B, 0x4CAF50, 0x42A5F5, 0xFF9800];
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const particle = this.add.circle(x, y, Phaser.Math.Between(3, 6), color);

      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(50, 150),
        x: x + Phaser.Math.Between(-40, 40),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(600, 1200),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private resetBottle(): void {
    const startX = 240;
    const startY = BOTTLE_START_Y;

    // Reset body in place instead of removing/recreating to avoid Matter.js state issues
    this.matter.body.setStatic(this.bottleBody, true);
    this.matter.body.setAngle(this.bottleBody, 0);
    this.matter.body.setVelocity(this.bottleBody, { x: 0, y: 0 });
    this.matter.body.setAngularVelocity(this.bottleBody, 0);

    // Position body so geometric center is at startY
    // body.position is COM, which is comOffsetY below geometric center
    this.matter.body.setPosition(this.bottleBody, { x: startX, y: startY + this.comOffsetY });

    // Reset container to geometric center
    this.bottle.setPosition(startX, startY);
    this.bottle.setRotation(0);

    // Reset state
    this.isFlipping = false;
    this.isDragging = false;
    this.hasLanded = false;
    this.resultShown = false;
    this.statusText.setText('');
    this.dragInfoText.setText('');
    this.arrowGraphics.clear();
    this.instructionText.setText('按住瓶子拖曳設定方向與力道，放開丟出！');
  }

  update(_time: number, delta: number): void {
    if (this.isFlipping) {
      // Sync container with physics body's geometric center (not COM)
      // body.position is COM; geometric center is offset by -comOffsetY in local Y
      const angle = this.bottleBody.angle;
      this.bottle.setPosition(
        this.bottleBody.position.x + this.comOffsetY * Math.sin(angle),
        this.bottleBody.position.y - this.comOffsetY * Math.cos(angle),
      );
      this.bottle.setRotation(angle);

      // Check if bottle is out of bounds
      if (this.bottleBody.position.x < -100 || this.bottleBody.position.x > 580 ||
        this.bottleBody.position.y > 800) {
        if (!this.resultShown) {
          this.resultShown = true;
          this.statusText.setText('💨 飛走了！');
          this.statusText.setColor('#FF9800');
          this.instructionText.setText('按 R 重置');
        }
      }

      // Landing check with delay for settling
      if (this.hasLanded) {
        this.landingCheckTimer += delta;
        if (this.landingCheckTimer > 1000) {
          this.checkLandingResult();
        }
      }
    }
  }
}
