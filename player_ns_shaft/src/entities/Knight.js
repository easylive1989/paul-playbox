import { KNIGHT_MOVE_SPEED, KNIGHT_MAX_HP, INVINCIBLE_DURATION, SPIKE_DAMAGE } from '../config/gameConfig.js';

export default class Knight extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'knight_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1.2);
        this.body.setSize(30, 50);
        this.body.setOffset(45, 25);
        // Don't use world bounds - we manually clamp X and check Y for game over
        this.setCollideWorldBounds(false);

        this.hp = KNIGHT_MAX_HP;
        this.maxHp = KNIGHT_MAX_HP;
        this.isInvincible = false;
        this.isDead = false;
        this.facing = 1; // 1 = right, -1 = left

        this.createAnimations();
    }

    createAnimations() {
        const anims = this.scene.anims;

        if (!anims.exists('knight_idle')) {
            anims.create({
                key: 'knight_idle',
                frames: anims.generateFrameNumbers('knight_idle', { start: 0, end: 9 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!anims.exists('knight_run')) {
            anims.create({
                key: 'knight_run',
                frames: anims.generateFrameNumbers('knight_run', { start: 0, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
        }

        if (!anims.exists('knight_fall')) {
            anims.create({
                key: 'knight_fall',
                frames: anims.generateFrameNumbers('knight_fall', { start: 0, end: 2 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!anims.exists('knight_jump')) {
            anims.create({
                key: 'knight_jump',
                frames: anims.generateFrameNumbers('knight_jump', { start: 0, end: 2 }),
                frameRate: 8,
                repeat: 0
            });
        }

        if (!anims.exists('knight_hit')) {
            anims.create({
                key: 'knight_hit',
                frames: anims.generateFrameNumbers('knight_hit', { start: 0, end: 0 }),
                frameRate: 8,
                repeat: 0
            });
        }

        if (!anims.exists('knight_death')) {
            anims.create({
                key: 'knight_death',
                frames: anims.generateFrameNumbers('knight_death', { start: 0, end: 9 }),
                frameRate: 8,
                repeat: 0
            });
        }
    }

    moveLeft() {
        if (this.isDead) return;
        this.setVelocityX(-KNIGHT_MOVE_SPEED);
        this.facing = -1;
        this.setFlipX(true);
    }

    moveRight() {
        if (this.isDead) return;
        this.setVelocityX(KNIGHT_MOVE_SPEED);
        this.facing = 1;
        this.setFlipX(false);
    }

    stop() {
        if (this.isDead) return;
        this.setVelocityX(0);
    }

    takeDamage(amount = SPIKE_DAMAGE) {
        if (this.isInvincible || this.isDead) return;

        this.hp -= amount;
        this.isInvincible = true;

        // Flash effect
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                this.alpha = 1;
            }
        });

        this.scene.time.delayedCall(INVINCIBLE_DURATION, () => {
            this.isInvincible = false;
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.setVelocityX(0);
        this.play('knight_death');
        this.once('animationcomplete-knight_death', () => {
            this.scene.events.emit('knight-died');
        });
    }

    updateAnimation() {
        if (this.isDead) return;

        const vy = this.body.velocity.y;
        const vx = Math.abs(this.body.velocity.x);
        const onFloor = this.body.blocked.down;

        if (vy > 50 && !onFloor) {
            this.play('knight_fall', true);
        } else if (vy < -50) {
            this.play('knight_jump', true);
        } else if (onFloor && vx > 10) {
            this.play('knight_run', true);
        } else if (onFloor) {
            this.play('knight_idle', true);
        }
    }
}
