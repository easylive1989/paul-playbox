const SCROLL_SPEED = 300; // pixels per second

export default class CameraSystem {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;

        this._setupKeyboard();
    }

    _setupKeyboard() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D'
        });
    }

    update(_time, delta) {
        const dt = delta / 1000;
        let dx = 0;
        let dy = 0;

        // Arrow keys
        if (this.cursors.left.isDown)  dx = -1;
        if (this.cursors.right.isDown) dx = 1;
        if (this.cursors.up.isDown)    dy = -1;
        if (this.cursors.down.isDown)  dy = 1;

        // WASD
        if (this.wasd.left.isDown)  dx = -1;
        if (this.wasd.right.isDown) dx = 1;
        if (this.wasd.up.isDown)    dy = -1;
        if (this.wasd.down.isDown)  dy = 1;

        // Apply scroll
        if (dx !== 0 || dy !== 0) {
            this.camera.scrollX += dx * SCROLL_SPEED * dt;
            this.camera.scrollY += dy * SCROLL_SPEED * dt;
        }
    }
}
