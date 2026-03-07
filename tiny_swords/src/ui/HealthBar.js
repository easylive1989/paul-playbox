export default class HealthBar {
    constructor(scene, owner, offsetY = -30, barWidth = 40) {
        this.scene = scene;
        this.owner = owner;
        this.offsetY = offsetY;
        this.barWidth = barWidth;
        this.barHeight = 5;

        this.bg = scene.add.rectangle(0, 0, barWidth, this.barHeight, 0x333333);
        this.bg.setOrigin(0.5, 0.5);
        this.bg.setDepth(3000);
        this.bg.setVisible(false);

        this.fill = scene.add.rectangle(0, 0, barWidth, this.barHeight, 0x44cc44);
        this.fill.setOrigin(0.5, 0.5);
        this.fill.setDepth(3001);
        this.fill.setVisible(false);
    }

    update() {
        if (!this.owner.alive) {
            this.destroy();
            return;
        }

        const ratio = this.owner.hp / this.owner.maxHp;

        // Only show when damaged
        if (ratio >= 1) {
            this.bg.setVisible(false);
            this.fill.setVisible(false);
            return;
        }

        this.bg.setVisible(true);
        this.fill.setVisible(true);

        // Position above the owner
        let x, y;
        if (this.owner.sprite) {
            x = this.owner.sprite.x;
            y = this.owner.sprite.y + this.offsetY;
        } else if (this.owner.getCenter) {
            const center = this.owner.getCenter();
            x = center.x;
            y = center.y + this.offsetY;
        } else {
            return;
        }

        this.bg.setPosition(x, y);
        this.bg.setDepth(y + 3000);

        // Fill width based on hp ratio
        const fillW = this.barWidth * ratio;
        this.fill.setSize(fillW, this.barHeight);
        this.fill.setPosition(x - (this.barWidth - fillW) / 2, y);
        this.fill.setDepth(y + 3001);

        // Color: green → yellow → red
        let color;
        if (ratio > 0.6) {
            color = 0x44cc44; // green
        } else if (ratio > 0.3) {
            color = 0xcccc44; // yellow
        } else {
            color = 0xcc4444; // red
        }
        this.fill.setFillStyle(color);
    }

    destroy() {
        if (this.bg) { this.bg.destroy(); this.bg = null; }
        if (this.fill) { this.fill.destroy(); this.fill = null; }
    }
}
