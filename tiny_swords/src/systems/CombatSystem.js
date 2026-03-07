export default class CombatSystem {
    constructor(scene) {
        this.scene = scene;
    }

    update(_time, _delta) {
        // Clean up dead references from attack targets
        for (const unit of this.scene.playerUnits) {
            if (unit.attackTarget && !unit.attackTarget.alive) {
                unit.attackTarget = null;
            }
        }
        for (const unit of this.scene.enemyUnits) {
            if (unit.attackTarget && !unit.attackTarget.alive) {
                unit.attackTarget = null;
            }
        }
    }
}
