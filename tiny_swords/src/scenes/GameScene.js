import { GRID_COLS, GRID_ROWS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import GridSystem from '../systems/GridSystem.js';
import Castle from '../entities/Castle.js';
import SelectionSystem from '../systems/SelectionSystem.js';
import CommandSystem from '../systems/CommandSystem.js';
import ResourceSystem from '../systems/ResourceSystem.js';
import EventBus from '../utils/EventBus.js';
import HUD from '../ui/HUD.js';
import BuildSystem from '../systems/BuildSystem.js';
import BuildMenu from '../ui/BuildMenu.js';
import CombatSystem from '../systems/CombatSystem.js';
import WaveSystem from '../systems/WaveSystem.js';
import CameraSystem from '../systems/CameraSystem.js';
import GameAPI from '../api/GameAPI.js';
import { t } from '../i18n/i18n.js';
import { getRandomMap } from '../config/mapDefinitions.js';
import { renderMap } from '../systems/MapRenderer.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.gridSystem = new GridSystem();
        this.buildings = [];
        this.playerUnits = [];
        this.enemyUnits = [];

        // Camera setup
        this.cameras.main.setBackgroundColor('#525B66');
        this.cameras.main.setViewport(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Random map selection
        this.currentMap = getRandomMap();
        console.log('Map:', this.currentMap.name);

        renderMap(this, this.currentMap, this.gridSystem);

        this.placeStartingBuildings();

        // Center camera on castle
        const castleCenter = this.castle.getCenter();
        this.cameras.main.centerOn(castleCenter.x, castleCenter.y);

        // Systems
        this.eventBus = new EventBus();
        this.resourceSystem = new ResourceSystem(this.eventBus);
        this.commandSystem = new CommandSystem(this);
        this.selectionSystem = new SelectionSystem(this);
        this.hud = new HUD(this, this.eventBus);
        this.buildSystem = new BuildSystem(this);
        this.buildMenu = new BuildMenu(this);
        this.combatSystem = new CombatSystem(this);
        this.waveSystem = new WaveSystem(this);
        this.cameraSystem = new CameraSystem(this);

        this.gameOver = false;
        this.gameResult = null; // 'victory' or 'defeat'

        // Expose GameAPI for Playwright testing
        window.gameAPI = new GameAPI(this);

        console.log('GameScene started');
    }

    placeStartingBuildings() {
        // Castle position from map data
        const gx = this.currentMap.castleGX;
        const gy = this.currentMap.castleGY;
        this.castle = new Castle(this, this.gridSystem, gx, gy);
        this.buildings.push(this.castle);
    }

    update(time, delta) {
        // Update camera scrolling (works even when game is over)
        this.cameraSystem.update(time, delta);

        if (this.gameOver) return;

        // Update all player units
        for (const unit of this.playerUnits) {
            unit.update(time, delta);
        }
        // Update all enemy units
        for (const unit of this.enemyUnits) {
            unit.update(time, delta);
        }

        // Update combat system
        this.combatSystem.update(time, delta);

        // Update buildings (production timers)
        for (const building of this.buildings) {
            if (building.update) building.update(time, delta);
        }

        // Update wave system
        this.waveSystem.update(time, delta);

        // Clean up dead units (free population for dead player units)
        const beforeCount = this.playerUnits.length;
        this.playerUnits = this.playerUnits.filter(u => u.alive);
        const deadCount = beforeCount - this.playerUnits.length;
        if (deadCount > 0) {
            this.resourceSystem.freePopulation(deadCount);
        }
        this.enemyUnits = this.enemyUnits.filter(u => u.alive);

        // Check win/lose conditions
        this.checkGameOver();
    }

    checkGameOver() {
        // Defeat: castle destroyed
        if (!this.castle.alive) {
            this.endGame('defeat');
            return;
        }

        // Victory: all waves spawned and all enemies dead
        if (this.waveSystem.isVictory()) {
            this.endGame('victory');
        }
    }

    endGame(result) {
        this.gameOver = true;
        this.gameResult = result;
        this.waveSystem.gameOver = true;

        const cx = VIEWPORT_WIDTH / 2;
        const cy = VIEWPORT_HEIGHT / 2;

        // Darken overlay
        const overlay = this.add.rectangle(cx, cy, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 0x000000, 0.6);
        overlay.setScrollFactor(0).setDepth(5000);

        // 9-slice RegularPaper panel
        this._createRegularPaperPanel(cx, cy, 400, 310);

        // Result text
        const titleStyle = { fontSize: '52px', color: result === 'victory' ? '#ffdd44' : '#ff4444',
                             fontFamily: 'Arial', stroke: '#000000', strokeThickness: 6 };
        const title = result === 'victory' ? t('victory') : t('defeat');
        this.add.text(cx, cy - 50, title, titleStyle)
            .setOrigin(0.5).setScrollFactor(0).setDepth(5002);

        // Play Again button using game UI assets
        const btnImg = this.add.image(cx, cy + 20, 'ui_btn_blue')
            .setScale(1.2, 0.9).setScrollFactor(0).setDepth(5002).setInteractive();
        this.add.text(cx, cy + 18, t('playAgain'), {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5003);

        btnImg.on('pointerover', () => btnImg.setTexture('ui_btn_hover'));
        btnImg.on('pointerout', () => btnImg.setTexture('ui_btn_blue'));
        btnImg.on('pointerdown', () => {
            btnImg.setTexture('ui_btn_blue_pressed');
            this.scene.restart();
        });

        // Main Menu button
        const menuBtnY = cy + 80;
        const menuBtnImg = this.add.image(cx, menuBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setScrollFactor(0).setDepth(5002).setInteractive();
        this.add.text(cx, menuBtnY - 2, t('mainMenu'), {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5003);

        menuBtnImg.on('pointerover', () => menuBtnImg.setTexture('ui_btn_hover'));
        menuBtnImg.on('pointerout', () => menuBtnImg.setTexture('ui_btn_blue'));
        menuBtnImg.on('pointerdown', () => {
            menuBtnImg.setTexture('ui_btn_blue_pressed');
            this.scene.start('LandingScene');
            this.scene.stop();
        });
    }

    _createRegularPaperPanel(cx, cy, w, h) {
        // Define custom frames (exact pixel positions from RegularPaper.png)
        const tex = this.textures.get('ui_regular_paper');
        if (!tex.has('rp_tl')) {
            tex.add('rp_tl', 0, 12, 20, 52, 44);
            tex.add('rp_t',  0, 128, 20, 64, 44);
            tex.add('rp_tr', 0, 256, 20, 52, 44);
            tex.add('rp_l',  0, 12, 128, 52, 64);
            tex.add('rp_c',  0, 128, 128, 64, 64);
            tex.add('rp_r',  0, 256, 128, 52, 64);
            tex.add('rp_bl', 0, 12, 256, 52, 45);
            tex.add('rp_b',  0, 128, 256, 64, 43);
            tex.add('rp_br', 0, 256, 256, 52, 45);
        }

        const cs = 52;
        const dep = 5001;
        const x1 = cx - w / 2, x2 = cx + w / 2;
        const y1 = cy - h / 2, y2 = cy + h / 2;

        // Solid fill behind 9-slice to prevent dark overlay bleeding through
        this.add.rectangle(cx, cy, w - 20, h - 20, 0xeee1c6)
            .setScrollFactor(0).setDepth(dep);

        const add9 = (x, y, frame, dw, dh) => {
            return this.add.image(x, y, 'ui_regular_paper', frame)
                .setDisplaySize(dw, dh).setScrollFactor(0).setDepth(dep + 0.1);
        };

        add9(cx, cy, 'rp_c', w - 2 * cs, h - 2 * cs);
        add9(cx, y1 + cs / 2, 'rp_t', w - 2 * cs, cs);
        add9(cx, y2 - cs / 2, 'rp_b', w - 2 * cs, cs);
        add9(x1 + cs / 2, cy, 'rp_l', cs, h - 2 * cs);
        add9(x2 - cs / 2, cy, 'rp_r', cs, h - 2 * cs);
        add9(x1 + cs / 2, y1 + cs / 2, 'rp_tl', cs, cs);
        add9(x2 - cs / 2, y1 + cs / 2, 'rp_tr', cs, cs);
        add9(x1 + cs / 2, y2 - cs / 2, 'rp_bl', cs, cs);
        add9(x2 - cs / 2, y2 - cs / 2, 'rp_br', cs, cs);
    }

}
