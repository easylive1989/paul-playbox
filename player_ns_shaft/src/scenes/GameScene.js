import {
    GAME_WIDTH, GAME_HEIGHT,
    INITIAL_SCROLL_SPEED, MAX_SCROLL_SPEED, SCROLL_ACCELERATION,
    CEILING_HEIGHT, SPIKE_DAMAGE
} from '../config/gameConfig.js';
import Knight from '../entities/Knight.js';
import PlatformManager from '../entities/PlatformManager.js';
import Ceiling from '../entities/Ceiling.js';
import HUD from '../ui/HUD.js';
import TouchControls from '../ui/TouchControls.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.gameOver = false;
        this.scrollSpeed = INITIAL_SCROLL_SPEED;
        this.score = 0;

        // Background
        const bgSolid = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_solid');
        bgSolid.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        const bgStars = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_stars');
        bgStars.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        bgStars.setAlpha(0.4);

        // Platform group
        this.platformGroup = this.physics.add.staticGroup();
        this.platformManager = new PlatformManager(this);
        this.platformManager.createInitialPlatforms(this.platformGroup);

        // Knight
        this.knight = new Knight(this, GAME_WIDTH / 2, 100);

        // Ceiling
        this.ceiling = new Ceiling(this);

        // HUD
        this.hud = new HUD(this);

        // Touch controls
        this.controls = new TouchControls(this);

        // Collisions
        this.physics.add.collider(this.knight, this.platformGroup, (knight, platform) => {
            this.onLandOnPlatform(knight, platform);
        });

        // Ceiling overlap
        this.physics.add.overlap(this.knight, this.ceiling.getZone(), () => {
            this.onHitCeiling();
        });

        // Knight death event
        this.events.on('knight-died', () => {
            this.endGame();
        });
    }

    onLandOnPlatform(knight, platform) {
        if (platform.platformType === 'spike' && knight.body.touching.down) {
            knight.takeDamage(SPIKE_DAMAGE);
        }
    }

    onHitCeiling() {
        if (this.knight.isDead) return;
        this.knight.takeDamage(SPIKE_DAMAGE);
        // Push knight down
        this.knight.setVelocityY(200);
        this.knight.y = CEILING_HEIGHT + 30;
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Input
        const dir = this.controls.getDirection();
        if (dir === -1) {
            this.knight.moveLeft();
        } else if (dir === 1) {
            this.knight.moveRight();
        } else {
            this.knight.stop();
        }

        // Update knight animation
        this.knight.updateAnimation();

        // Scroll platforms up
        this.scrollSpeed = Math.min(
            MAX_SCROLL_SPEED,
            INITIAL_SCROLL_SPEED + this.score * SCROLL_ACCELERATION
        );

        this.score = this.platformManager.update(delta, this.scrollSpeed);

        // Move knight up with platform scroll (simulates world scrolling)
        const scrollAmount = this.scrollSpeed * (delta / 1000);
        this.knight.y -= scrollAmount;

        // Clamp knight X within screen (left/right walls)
        const halfW = this.knight.body.width / 2;
        if (this.knight.x < halfW) {
            this.knight.x = halfW;
            this.knight.setVelocityX(0);
        } else if (this.knight.x > GAME_WIDTH - halfW) {
            this.knight.x = GAME_WIDTH - halfW;
            this.knight.setVelocityX(0);
        }

        // Update HUD
        this.hud.updateHP(this.knight.hp);
        this.hud.updateScore(this.score);

        // Check fall off bottom
        if (this.knight.y > GAME_HEIGHT + 50) {
            this.endGame();
        }
    }

    endGame() {
        if (this.gameOver) return;
        this.gameOver = true;

        // Save high score
        const highScore = localStorage.getItem('knight_highscore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('knight_highscore', this.score);
        }

        this.time.delayedCall(500, () => {
            this.scene.start('GameOverScene', {
                score: this.score,
                highScore: Math.max(this.score, Number(highScore))
            });
        });
    }
}
