export default class CommandSystem {
    constructor(scene) {
        this.scene = scene;
    }

    issueMove(units, px, py) {
        for (const unit of units) {
            if (!unit.alive) continue;
            unit.moveToWithPathfinding(px, py);
        }
        this.showMoveMarker(px, py);
    }

    showMoveMarker(px, py) {
        const marker = this.scene.add.circle(px, py, 14, 0x00ff00, 0.5);
        marker.setDepth(9999);
        this.scene.tweens.add({
            targets: marker,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => marker.destroy()
        });
    }

    issueAttack(units, target) {
        for (const unit of units) {
            if (!unit.alive) continue;
            unit.attackTarget = target;
            // Move toward target — combat system will handle attack when in range
            const tx = target.sprite.x;
            const ty = target.sprite.y;
            unit.moveToWithPathfinding(tx, ty);
        }
    }
}
