// Helper to create animations from spritesheet keys
export function createAnim(scene, key, spriteKey, startFrame, endFrame, frameRate = 8, repeat = -1) {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(spriteKey, { start: startFrame, end: endFrame }),
        frameRate,
        repeat
    });
}
