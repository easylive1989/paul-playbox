import 'package:flame/components.dart';
import 'package:flame/parallax.dart';
import 'package:flutter/material.dart';
import 'package:player_ns_shaft/game/player_ns_shaft.dart';

class World extends ParallaxComponent<VeryGoodFlameGame> {
  @override
  Future<void> onLoad() async {
    parallax = await gameRef.loadParallax(
      [
        ParallaxImageData('assets/images/background/Background_Solid.png'),
        ParallaxImageData('assets/images/background/Background_Small_Stars.png'),
        ParallaxImageData('assets/images/background/Background_Big_Stars.png'),
        ParallaxImageData('assets/images/background/Background_Orbs.png'),
        ParallaxImageData('assets/images/background/Background_Block_Shapes.png'),
        ParallaxImageData('assets/images/background/Background_Squiggles.png'),
      ],
      fill: LayerFill.width,
      repeat: ImageRepeat.repeat,
      baseVelocity: Vector2(0, -5),
      velocityMultiplierDelta: Vector2(0, 1.2),
    );
  }
}
