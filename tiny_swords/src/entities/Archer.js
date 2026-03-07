import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import { ARCHER_HP, ARCHER_SPEED, ARCHER_DAMAGE, ARCHER_ATTACK_RANGE, ARCHER_COOLDOWN, TILE_SIZE } from '../config/gameConfig.js';

export default class Archer extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'archer_idle', {
            hp: ARCHER_HP,
            speed: ARCHER_SPEED,
            attackDamage: ARCHER_DAMAGE,
            attackRange: ARCHER_ATTACK_RANGE,
            attackCooldown: ARCHER_COOLDOWN,
            faction: 'player',
            type: 'archer',
            frameSize: 192
        });

        this.initAnims();
        this.playAnim('idle');
    }

    initAnims() {
        // Idle: 1152px / 192px = 6 frames (0-5)
        createAnim(this.scene, 'archer_idle_anim', 'archer_idle', 0, 5, 8);
        // Run: 768px / 192px = 4 frames (0-3)
        createAnim(this.scene, 'archer_run_anim', 'archer_run', 0, 3, 10);
        // Shoot: 1536px / 192px = 8 frames (0-7), no repeat
        createAnim(this.scene, 'archer_shoot_anim', 'archer_shoot', 0, 7, 10, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'archer_idle_anim',
            run: 'archer_run_anim',
            attack: 'archer_shoot_anim'
        };
        const animKey = map[name];
        if (animKey && this.sprite.anims) {
            this.sprite.play(animKey, true);
        }
    }

    update(time, delta) {
        if (!this.alive) return;

        // If attacking a target, pursue it
        if (this.attackTarget && this.attackTarget.alive && this.attackTarget.sprite) {
            const result = this.chaseTarget(time, this.attackTarget);
            if (result === 'attacking') {
                this.playAnim('attack');
                this.performAttack(time);
            }
        } else if (this.attackTarget || this.state === UnitState.ATTACKING) {
            // Target dead or gone
            this.attackTarget = null;
            this.stopMoving();
        }

        // Auto-aggro: if idle, look for nearby enemies
        if (this.state === UnitState.IDLE && !this.attackTarget) {
            this.scanForEnemies();
        }

        super.update(time, delta);
    }

    performAttack(time) {
        if (time - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = time;
        this.playAnim('attack');

        if (this.attackTarget && this.attackTarget.alive) {
            this.fireArrow(this.attackTarget);
        }
    }

    fireArrow(target) {
        const arrow = this.scene.add.image(this.sprite.x, this.sprite.y - 10, 'arrow');
        arrow.setScale(0.3);
        arrow.setDepth(this.sprite.y);

        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            target.sprite.x, target.sprite.y
        );
        arrow.setRotation(angle);

        this.scene.tweens.add({
            targets: arrow,
            x: target.sprite.x,
            y: target.sprite.y,
            duration: 300,
            onComplete: () => {
                arrow.destroy();
                if (target.alive) {
                    target.takeDamage(this.attackDamage);
                    if (!target.alive) {
                        this.attackTarget = null;
                        this.stopMoving();
                    }
                }
            }
        });
    }

    scanForEnemies() {
        const detectRange = 5 * TILE_SIZE;
        let closest = null;
        let closestDist = Infinity;

        for (const enemy of this.scene.enemyUnits) {
            if (!enemy.alive) continue;
            const dist = this.distanceTo(enemy);
            if (dist < detectRange && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }

        if (closest) {
            this.attackTarget = closest;
        }
    }
}
