import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:ray_world_game/ray_world_game.dart';
import 'package:ray_world_game/weapon.dart';

class Monster extends SpriteAnimationComponent with HasGameRef<RayWorldGame>, CollisionCallbacks {
  Monster() : super(size: Vector2.all(200.0)) {
    add(RectangleHitbox(
      size: Vector2(50, 50),
      position:Vector2(75, 90),
    ));
  }

  final double _speed = 150;

  @override
  void onCollision(Set<Vector2> intersectionPoints, PositionComponent other) {
    super.onCollision(intersectionPoints, other);
    if (other is Weapon) {
      gameRef.remove(this);
      gameRef.score++;
    }
  }

  @override
  Future onLoad() async {
    super.onLoad();
    animation = await gameRef.loadSpriteAnimation(
      'goblin.png',
      SpriteAnimationData.sequenced(
        amount: 4,
        stepTime: 0.2,
        textureSize: Vector2(150, 150),
      ),
    );
  }

  @override
  void update(double dt) {
    super.update(dt);
    var offset = gameRef.player.position - position;
    var movePercentage = dt * _speed / offset.length ;

    position += offset * movePercentage;
  }
}
