import 'package:flame/collisions.dart';
import 'package:flame/components.dart';

class WorldCollidable extends PositionComponent with CollisionCallbacks {
  WorldCollidable({super.position}) {
    add(RectangleHitbox());
  }
}
