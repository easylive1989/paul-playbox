import Building from './Building.js';
import { CASTLE_HP } from '../config/gameConfig.js';

export default class Castle extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 5, 3, 'castle_blue', CASTLE_HP, -32);
        this.type = 'castle';
        this.faction = 'player';
    }

    onDestroyed() {
        // Switch to destroyed texture before removing
        this.sprite.setTexture('castle_destroyed');
        this.gridSystem.free(this.gx, this.gy, this.gridW, this.gridH);
        // Don't destroy sprite — leave destroyed graphic on map
    }
}
