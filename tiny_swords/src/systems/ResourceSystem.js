import { STARTING_GOLD, STARTING_POP_CAP } from '../config/gameConfig.js';

export default class ResourceSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.gold = STARTING_GOLD;
        this.popCap = STARTING_POP_CAP;
        this.popUsed = 0;
    }

    addGold(amount) {
        this.gold += amount;
        this.eventBus.emit('goldChanged', this.gold);
    }

    spendGold(amount) {
        if (this.gold < amount) return false;
        this.gold -= amount;
        this.eventBus.emit('goldChanged', this.gold);
        return true;
    }

    getGold() {
        return this.gold;
    }

    setGold(amount) {
        this.gold = amount;
        this.eventBus.emit('goldChanged', this.gold);
    }

    getPopCap() { return this.popCap; }
    getPopUsed() { return this.popUsed; }

    addPopCap(amount) {
        this.popCap += amount;
        this.eventBus.emit('popChanged', this.popUsed, this.popCap);
    }

    removePopCap(amount) {
        this.popCap = Math.max(0, this.popCap - amount);
        this.eventBus.emit('popChanged', this.popUsed, this.popCap);
    }

    usePopulation(amount) {
        if (this.popUsed + amount > this.popCap) return false;
        this.popUsed += amount;
        this.eventBus.emit('popChanged', this.popUsed, this.popCap);
        return true;
    }

    freePopulation(amount) {
        this.popUsed = Math.max(0, this.popUsed - amount);
        this.eventBus.emit('popChanged', this.popUsed, this.popCap);
    }

    canAffordPop(amount) {
        return this.popUsed + amount <= this.popCap;
    }
}
