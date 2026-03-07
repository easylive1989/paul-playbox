import 'package:flame/collisions.dart';
import 'package:flame/components.dart';

class Terrace extends RectangleComponent {
  Terrace({required super.position})
      : super(
          size: Vector2(50, 10),
          anchor: Anchor.center,
        ) {
    add(RectangleHitbox());
  }
}
