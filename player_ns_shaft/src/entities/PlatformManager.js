import Platform from './Platform.js';
import {
    GAME_WIDTH, GAME_HEIGHT,
    PLATFORM_COUNT, PLATFORM_SPACING, PLATFORM_WIDTH,
    NORMAL_RATIO, SPIKE_RATIO
} from '../config/gameConfig.js';

export default class PlatformManager {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.score = 0;
        this.lastSpawnX = GAME_WIDTH / 2;
    }

    createInitialPlatforms(group) {
        this.group = group;

        for (let i = 0; i < PLATFORM_COUNT; i++) {
            const x = this.getReachableX();
            const y = 200 + i * PLATFORM_SPACING;
            // First 2 platforms are always normal
            const type = i < 2 ? 'normal' : this.getRandomType();
            const platform = new Platform(this.scene, x, y, type);
            this.platforms.push(platform);
            group.add(platform);
        }
    }

    getRandomType() {
        const r = Math.random();
        if (r < NORMAL_RATIO) return 'normal';
        if (r < NORMAL_RATIO + SPIKE_RATIO) return 'spike';
        return 'moving';
    }

    getReachableX() {
        // Ensure new platform is reachable from last one
        const maxOffset = 150;
        const minX = PLATFORM_WIDTH / 2 + 10;
        const maxX = GAME_WIDTH - PLATFORM_WIDTH / 2 - 10;

        let newX = this.lastSpawnX + (Math.random() * maxOffset * 2 - maxOffset);
        newX = Phaser.Math.Clamp(newX, minX, maxX);
        this.lastSpawnX = newX;
        return newX;
    }

    update(delta, scrollSpeed) {
        const scrollAmount = scrollSpeed * (delta / 1000);

        for (const platform of this.platforms) {
            platform.scrollUp(scrollAmount);
            platform.updateMoving(delta);

            // Recycle platforms that go above screen
            if (platform.y < -20) {
                this.score++;
                const newX = this.getReachableX();
                const newY = this.getBottomY();
                const newType = this.getRandomType();
                platform.reposition(newX, newY, newType);
            }
        }

        return this.score;
    }

    getBottomY() {
        // Find the lowest platform and place new one below it
        let maxY = 0;
        for (const p of this.platforms) {
            if (p.y > maxY) maxY = p.y;
        }
        return maxY + PLATFORM_SPACING;
    }
}
