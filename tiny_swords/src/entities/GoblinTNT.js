import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import { TILE_SIZE } from '../config/gameConfig.js';

export default class GoblinTNT extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'goblin_tnt', {
            hp: 30,
            speed: 50,
            attackDamage: 80,
            attackRange: 1.5,
            attackCooldown: 0, // one-time explosion
            faction: 'enemy',
            type: 'goblin_tnt',
            frameSize: 192
        });

        this.hasExploded = false;
        this.initAnims();
        this.playAnim('idle');
    }

    // TNT_Red.png: 7 cols × 3 rows (192×192 frames), col 6 is empty in rows 0-1
    // Row 0: idle (0-5), Row 1: run (7-12), Row 2: explode (14-20)
    initAnims() {
        createAnim(this.scene, 'goblin_tnt_idle', 'goblin_tnt', 0, 5, 8);
        createAnim(this.scene, 'goblin_tnt_run', 'goblin_tnt', 7, 12, 10);
        createAnim(this.scene, 'goblin_tnt_explode', 'goblin_tnt', 14, 20, 10, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'goblin_tnt_idle',
            run: 'goblin_tnt_run',
            explode: 'goblin_tnt_explode'
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
        if (this.hasExploded) return;

        if (this.attackTarget && this.attackTarget.alive) {
            const result = this.chaseTarget(time, this.attackTarget);
            if (result === 'attacking') {
                this.explode();
            }
            return;
        }

        this.attackTarget = null;

        // Find closest building to rush
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

    explode() {
        if (this.hasExploded) return;
        this.hasExploded = true;
        this.state = UnitState.ATTACKING;
        this.playAnim('explode');

        // Deal damage to target
        if (this.attackTarget && this.attackTarget.alive) {
            this.attackTarget.takeDamage(this.attackDamage);
        }

        // Self-destruct after animation
        if (this.sprite) {
            this.sprite.once('animationcomplete', () => {
                this.die();
            });
        }
    }
}
