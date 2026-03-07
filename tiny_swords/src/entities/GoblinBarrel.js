import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import { TILE_SIZE } from '../config/gameConfig.js';

export default class GoblinBarrel extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'goblin_barrel', {
            hp: 150,
            speed: 40,
            attackDamage: 20,
            attackRange: 1.2,
            attackCooldown: 1500,
            faction: 'enemy',
            type: 'goblin_barrel',
            frameSize: 128
        });

        this.hasDeathAnim = true;
        this.initAnims();
        this.playAnim('idle');
    }

    // Barrel_Red.png: 6 cols × 6 rows (128×128 frames)
    // Row 0: idle (0), Row 1: run (6-11), Row 2: attack (12-17), Row 5: death (30-35)
    initAnims() {
        createAnim(this.scene, 'goblin_barrel_idle', 'goblin_barrel', 0, 0, 8);
        createAnim(this.scene, 'goblin_barrel_run', 'goblin_barrel', 6, 11, 10);
        createAnim(this.scene, 'goblin_barrel_attack', 'goblin_barrel', 12, 17, 10, 0);
        createAnim(this.scene, 'goblin_barrel_death', 'goblin_barrel', 30, 35, 8, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'goblin_barrel_idle',
            run: 'goblin_barrel_run',
            attack: 'goblin_barrel_attack',
            death: 'goblin_barrel_death'
        };
        const animKey = map[name];
        if (animKey && this.sprite && this.sprite.anims) {
            this.sprite.play(animKey, true);
        }
    }

    update(time, delta) {
        if (!this.alive) return;
        this.updateAI(time, delta);
        super.update(time, delta);
    }

    updateAI(time, _delta) {
        // Always scan for nearby player units (priority target)
        let closestUnit = null;
        let closestUnitDist = 3 * TILE_SIZE;
        for (const unit of this.scene.playerUnits) {
            if (!unit.alive || !unit.sprite) continue;
            const d = this.distanceTo(unit);
            if (d < closestUnitDist) { closestUnit = unit; closestUnitDist = d; }
        }

        // Switch to nearby player unit if current target is a building
        if (closestUnit && (!this.attackTarget || this.attackTarget.type !== 'warrior')) {
            this.attackTarget = closestUnit;
        }

        // Pursue current target
        if (this.attackTarget && this.attackTarget.alive) {
            const result = this.chaseTarget(time, this.attackTarget);
            if (result === 'attacking') {
                this.playAnim('attack');
                this.performAttack(time);
            }
            return;
        }

        // No target — find a building
        this.attackTarget = null;
        let targetBuilding = null;
        let bestDist = Infinity;
        for (const b of this.scene.buildings) {
            if (!b.alive || b.faction === 'neutral') continue;
            const center = b.getCenter();
            const d = this.distanceToPoint(center.x, center.y);
            if (d < bestDist) { bestDist = d; targetBuilding = b; }
        }
        if (targetBuilding) {
            this.attackTarget = targetBuilding;
            this.chaseTarget(time, targetBuilding);
        }
    }

    performAttack(time) {
        if (time - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = time;
        if (this.attackTarget && this.attackTarget.alive) {
            this.attackTarget.takeDamage(this.attackDamage);
            if (!this.attackTarget.alive) { this.attackTarget = null; this.stopMoving(); }
        }
    }
}
