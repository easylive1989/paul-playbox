import Building from './Building.js';
import {
    TOWER_HP, TOWER_COST, TOWER_ATTACK_RANGE,
    TOWER_DAMAGE, TOWER_COOLDOWN, TILE_SIZE
} from '../config/gameConfig.js';

export default class Tower extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 2, 3, 'tower', TOWER_HP);
        this.type = 'tower';
        this.faction = 'player';
        this.lastAttackTime = 0;
        this.attackTarget = null;
    }

    static get cost() { return TOWER_COST; }

    update(time, _delta) {
        if (!this.alive) return;

        // Find or validate target
        if (!this.attackTarget || !this.attackTarget.alive) {
            this.attackTarget = null;
            this.scanForEnemies();
        }

        // Check range
        if (this.attackTarget && this.attackTarget.alive) {
            const dist = this.distanceToUnit(this.attackTarget);
            if (dist > TOWER_ATTACK_RANGE * TILE_SIZE) {
                this.attackTarget = null;
            }
        }

        // Attack
        if (this.attackTarget && this.attackTarget.alive) {
            if (time - this.lastAttackTime >= TOWER_COOLDOWN) {
                this.lastAttackTime = time;
                this.fireArrow(this.attackTarget);
            }
        }
    }

    scanForEnemies() {
        const range = TOWER_ATTACK_RANGE * TILE_SIZE;
        let closest = null;
        let closestDist = Infinity;
        const center = this.getCenter();

        for (const enemy of this.scene.enemyUnits) {
            if (!enemy.alive || !enemy.sprite) continue;
            const dx = enemy.sprite.x - center.x;
            const dy = enemy.sprite.y - center.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < range && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }

        this.attackTarget = closest;
    }

    distanceToUnit(unit) {
        const center = this.getCenter();
        const dx = unit.sprite.x - center.x;
        const dy = unit.sprite.y - center.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    fireArrow(target) {
        const center = this.getCenter();
        const arrow = this.scene.add.image(center.x, center.y - 20, 'arrow');
        arrow.setScale(0.3);
        arrow.setDepth(center.y);

        const angle = Phaser.Math.Angle.Between(
            center.x, center.y,
            target.sprite.x, target.sprite.y
        );
        arrow.setRotation(angle);

        this.scene.tweens.add({
            targets: arrow,
            x: target.sprite.x,
            y: target.sprite.y,
            duration: 400,
            onComplete: () => {
                arrow.destroy();
                if (target.alive) {
                    target.takeDamage(TOWER_DAMAGE);
                }
            }
        });
    }
}
