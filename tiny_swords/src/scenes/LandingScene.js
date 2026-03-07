import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';
import { t, getLocale, setLocale } from '../i18n/i18n.js';

export default class LandingScene extends Phaser.Scene {
    constructor() {
        super('LandingScene');
    }

    create() {
        const cx = VIEWPORT_WIDTH / 2;
        const cy = VIEWPORT_HEIGHT / 2;

        // Animated video background (DOM element behind transparent canvas)
        this._createVideoBg();

        // Ensure video is removed when scene stops
        this.events.once('shutdown', this._removeVideoBg, this);

        // --- Language toggle button (top-left) ---
        const langBtn = this.add.image(40, 40, 'ui_btn_sq_blue')
            .setDisplaySize(50, 50).setInteractive();
        const langLabel = getLocale() === 'en' ? 'EN' : '中';
        this.add.text(40, 40, langLabel, {
            fontSize: '18px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        langBtn.on('pointerover', () => langBtn.setTexture('ui_btn_sq_hover'));
        langBtn.on('pointerout', () => langBtn.setTexture('ui_btn_sq_blue'));
        langBtn.on('pointerdown', () => {
            langBtn.setTexture('ui_btn_sq_pressed');
            const newLocale = getLocale() === 'en' ? 'zh' : 'en';
            setLocale(newLocale);
            this.scene.restart();
        });

        // --- Start Game button ---
        const startBtnY = cy + 120;
        const startBtn = this.add.image(cx, startBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setInteractive();
        this.add.text(cx, startBtnY - 2, t('startGame'), {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => startBtn.setTexture('ui_btn_hover'));
        startBtn.on('pointerout', () => startBtn.setTexture('ui_btn_blue'));
        startBtn.on('pointerdown', () => {
            startBtn.setTexture('ui_btn_blue_pressed');
            this.scene.start('GameScene');
            this.scene.stop();
        });

        // --- Quit button ---
        const quitBtnY = startBtnY + 60;
        const quitBtn = this.add.image(cx, quitBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setInteractive();
        this.add.text(cx, quitBtnY - 2, t('quit'), {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        quitBtn.on('pointerover', () => quitBtn.setTexture('ui_btn_hover'));
        quitBtn.on('pointerout', () => quitBtn.setTexture('ui_btn_blue'));
        quitBtn.on('pointerdown', () => {
            quitBtn.setTexture('ui_btn_blue_pressed');
            window.close();
        });
    }

    _createVideoBg() {
        const canvas = this.game.canvas;
        const parent = canvas.parentElement;

        const video = document.createElement('video');
        video.src = 'assets/landing_background.mp4';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.cssText = `
            position: absolute;
            top: ${canvas.style.marginTop || '0'};
            left: ${canvas.style.marginLeft || '0'};
            width: ${canvas.style.width || canvas.width + 'px'};
            height: ${canvas.style.height || canvas.height + 'px'};
            object-fit: cover;
            object-position: top;
            z-index: 0;
        `;

        // Canvas sits on top of video
        canvas.style.position = 'relative';
        canvas.style.zIndex = '1';

        parent.style.position = 'relative';
        parent.insertBefore(video, canvas);

        this._videoBg = video;
        video.play().catch(() => {}); // ignore autoplay failures in test env
    }

    _removeVideoBg() {
        if (this._videoBg) {
            this._videoBg.pause();
            this._videoBg.remove();
            this._videoBg = null;
        }
    }

    shutdown() {
        this._removeVideoBg();
    }
}
