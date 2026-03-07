import Building from './Building.js';
import { HOUSE_HP, HOUSE_POP_BONUS, HOUSE_COST } from '../config/gameConfig.js';

export default class House extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 2, 2, 'house', HOUSE_HP);
        this.type = 'house';
        this.faction = 'player';

        // 建造時增加人口上限
        if (scene.resourceSystem) {
            scene.resourceSystem.addPopCap(HOUSE_POP_BONUS);
        }
    }

    static get cost() { return HOUSE_COST; }

    onDestroyed() {
        // 被摧毀時減少人口上限
        if (this.scene.resourceSystem) {
            this.scene.resourceSystem.removePopCap(HOUSE_POP_BONUS);
        }
        super.onDestroyed();
    }
}
