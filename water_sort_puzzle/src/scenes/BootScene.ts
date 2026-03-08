import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Audio assets will be loaded here later
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
