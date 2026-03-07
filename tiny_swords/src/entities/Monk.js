import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import {
    MONK_HP, MONK_SPEED, MONK_HEAL_AMOUNT,
    MONK_HEAL_RANGE, MONK_HEAL_COOLDOWN, TILE_SIZE
} from '../config/gameConfig.js';
import { t } from '../i18n/i18n.js';

export default class Monk extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'monk_idle', {
            hp: MONK_HP,
            speed: MONK_SPEED,
            attackDamage: 0,       // no attack
            attackRange: MONK_HEAL_RANGE,
            attackCooldown: MONK_HEAL_COOLDOWN,
            faction: 'player',
            type: 'monk',
            frameSize: 192
        });

        this.healTarget = null;
        this.initAnims();
        this.playAnim('idle');
    }

    initAnims() {
        // Idle: 1152px / 192px = 6 frames (0-5)
        createAnim(this.scene, 'monk_idle_anim', 'monk_idle', 0, 5, 8);
        // Run: 768px / 192px = 4 frames (0-3)
        createAnim(this.scene, 'monk_run_anim', 'monk_run', 0, 3, 10);
        // Heal: 2112px / 192px = 11 frames (0-10), no repeat
        createAnim(this.scene, 'monk_heal_anim', 'monk_heal', 0, 10, 10, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'monk_idle_anim',
            run: 'monk_run_anim',
            heal: 'monk_heal_anim'
        };
        const animKey = map[name];
        if (animKey && this.sprite.anims) {
            this.sprite.play(animKey, true);
        }
    }

    update(time, delta) {
        if (!this.alive) return;

        if (this.healTarget) {
            // Clear target if dead or fully healed
            if (!this.healTarget.alive || !this.healTarget.sprite || this.healTarget.hp >= this.healTarget.maxHp) {
                this.healTarget = null;
                this.stopMoving();
            } else {
                const result = this.chaseTarget(time, this.healTarget);
                if (result === 'attacking') {
                    this.playAnim('heal');
                    this.performHeal(time);
                }
            }
        } else if (this.state === UnitState.ATTACKING) {
            // Was healing but target cleared
            this.stopMoving();
        }

        // Auto-scan: if idle and no heal target, look for injured friendlies
        if (this.state === UnitState.IDLE && !this.healTarget) {
            this.scanForInjured();
        }

        super.update(time, delta);
    }

    performHeal(time) {
        if (time - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = time;
        this.playAnim('heal');

        if (this.healTarget && this.healTarget.alive) {
            this.healTarget.hp = Math.min(this.healTarget.maxHp, this.healTarget.hp + MONK_HEAL_AMOUNT);

            // Spawn heal visual effect
            this.spawnHealEffect(this.healTarget);

            // If fully healed, clear target
            if (this.healTarget.hp >= this.healTarget.maxHp) {
                this.healTarget = null;
                this.stopMoving();
            }
        }
    }

    spawnHealEffect(target) {
        if (!target.sprite || !this.scene) return;
        const x = target.sprite.x;
        const y = target.sprite.y - 20;

        // Green plus sign particle
        const healText = this.scene.add.text(x, y, t('healAmount', { amount: MONK_HEAL_AMOUNT }), {
            fontSize: '14px',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(target.sprite.y + 5000);

        this.scene.tweens.add({
            targets: healText,
            y: y - 24,
            alpha: 0,
            duration: 800,
            onComplete: () => healText.destroy()
        });
    }

    scanForInjured() {
        const detectRange = 6 * TILE_SIZE;
        let mostInjured = null;
        let lowestRatio = 1;

        for (const unit of this.scene.playerUnits) {
            if (unit === this) continue;
            if (!unit.alive) continue;
            if (unit.hp >= unit.maxHp) continue;

            const dist = this.distanceTo(unit);
            if (dist > detectRange) continue;

            const ratio = unit.hp / unit.maxHp;
            if (ratio < lowestRatio) {
                lowestRatio = ratio;
                mostInjured = unit;
            }
        }

        if (mostInjured) {
            this.healTarget = mostInjured;
        }
    }
}
