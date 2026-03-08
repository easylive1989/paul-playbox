import { GAME_WIDTH, CEILING_HEIGHT } from '../config/gameConfig.js';

export default class Ceiling {
    constructor(scene) {
        this.scene = scene;

        // Spike visual using graphics
        const gfx = scene.add.graphics();
        gfx.fillStyle(0x333333, 1);
        gfx.fillRect(0, 0, GAME_WIDTH, CEILING_HEIGHT - 10);

        // Draw spikes
        gfx.fillStyle(0x888888, 1);
        const spikeW = 16;
        const spikeH = 12;
        for (let x = 0; x < GAME_WIDTH; x += spikeW) {
            gfx.fillTriangle(
                x, CEILING_HEIGHT - 10,
                x + spikeW / 2, CEILING_HEIGHT,
                x + spikeW, CEILING_HEIGHT - 10
            );
        }

        gfx.setDepth(10);

        // Danger zone (invisible physics body)
        this.zone = scene.add.zone(GAME_WIDTH / 2, CEILING_HEIGHT / 2, GAME_WIDTH, CEILING_HEIGHT);
        scene.physics.add.existing(this.zone, true);
    }

    getZone() {
        return this.zone;
    }
}
