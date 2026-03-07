import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:ray_world_game/ray_world_game.dart';

class Weapon extends SpriteComponent with HasGameRef<RayWorldGame> {
  Weapon({
    Vector2? position,
  }) : super(
          size: Vector2(100, 30),
          position: position,
          angle: 90,
        ) {
    add(RectangleHitbox());
  }

  @override
  Future onLoad() async {
    super.onLoad();
    sprite = await game.loadSprite('weapon.png');
  }
}
