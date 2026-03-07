import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:flutter/services.dart';
import 'package:player_ns_shaft/game/entities/terrace.dart';
import 'package:player_ns_shaft/game/player_ns_shaft.dart';
import 'package:player_ns_shaft/gen/assets.gen.dart';

enum WarriorBehavior {
  idleLeft,
  goLeft,
  idleRight,
  goRight,
}

class Player extends PositionComponent
    with HasGameRef<VeryGoodFlameGame>, CollisionCallbacks, KeyboardHandler {
  Player({
    required super.position,
    required this.joystick,
  }) : super(size: Vector2(120, 80), anchor: Anchor.center) {
    add(
      RectangleHitbox(
        anchor: Anchor.center,
        size: Vector2(22, 40),
        position: Vector2(55, 60),
      ),
    );
  }

  final JoystickComponent joystick;
  final double velocity = 100;
  final double fallingVelocity = 100;
  final _playerAnimationData = SpriteAnimationData.sequenced(
    amount: 10,
    stepTime: 0.1,
    textureSize: Vector2(120, 80),
  );
  late SpriteAnimationGroupComponent<WarriorBehavior> _animationGroupComponent;
  bool isFalling = true;
  bool isMovingRight = false;
  bool isMovingLeft = false;

  @override
  void onCollisionStart(
    Set<Vector2> intersectionPoints,
    PositionComponent other,
  ) {
    super.onCollisionStart(intersectionPoints, other);
    if (other is! Terrace) {
      return;
    }

    final isCollidingVertically =
        (intersectionPoints.first.y - intersectionPoints.last.y).abs() < 5;

    if (isCollidingVertically) {
      isFalling = false;
    }
  }

  @override
  void onCollisionEnd(PositionComponent other) {
    super.onCollisionEnd(other);
    isFalling = true;
  }

  @override
  bool onKeyEvent(RawKeyEvent event, Set<LogicalKeyboardKey> keysPressed) {
    if (keysPressed.contains(LogicalKeyboardKey.arrowLeft)) {
      isMovingLeft = true;
      isMovingRight = false;
    } else if (keysPressed.contains(LogicalKeyboardKey.arrowRight)) {
      isMovingLeft = false;
      isMovingRight = true;
    } else {
      isMovingLeft = false;
      isMovingRight = false;
    }

    return true;
  }

  @override
  Future<void> onLoad() async {
    _animationGroupComponent = SpriteAnimationGroupComponent<WarriorBehavior>(
      animations: {
        WarriorBehavior.idleLeft: await gameRef.loadSpriteAnimation(
          Assets.images.knightLeftIdle.path,
          _playerAnimationData,
        ),
        WarriorBehavior.goLeft: await gameRef.loadSpriteAnimation(
          Assets.images.knightLeftRun.path,
          _playerAnimationData,
        ),
        WarriorBehavior.idleRight: await gameRef.loadSpriteAnimation(
          Assets.images.knightRightIdle.path,
          _playerAnimationData,
        ),
        WarriorBehavior.goRight: await gameRef.loadSpriteAnimation(
          Assets.images.knightRightRun.path,
          _playerAnimationData,
        ),
      },
      current: WarriorBehavior.idleRight,
      size: size,
    );
    await add(_animationGroupComponent);
  }

  @override
  void update(double dt) {
    if (joystick.isDragged) {
      if (joystick.direction == JoystickDirection.right) {
        isMovingLeft = false;
        isMovingRight = true;
      } else if (joystick.direction == JoystickDirection.left) {
        isMovingLeft = true;
        isMovingRight = false;
      } else {
        isMovingLeft = false;
        isMovingRight = false;
      }
    }

    if (isFalling) {
      position.y += fallingVelocity * dt;
    }

    if (isMovingLeft) {
      _moveLeft(dt);
    } else if (isMovingRight) {
      _moveRight(dt);
    } else {
      _idle();
    }
  }

  void _moveLeft(double delta) {
    position.x -= velocity * delta;
    _animationGroupComponent.current = WarriorBehavior.goLeft;
  }

  void _moveRight(double delta) {
    position.x += velocity * delta;
    _animationGroupComponent.current = WarriorBehavior.goRight;
  }

  void _idle() {
    if (_animationGroupComponent.current == WarriorBehavior.goLeft) {
      _animationGroupComponent.current = WarriorBehavior.idleLeft;
    } else if (_animationGroupComponent.current == WarriorBehavior.goRight) {
      _animationGroupComponent.current = WarriorBehavior.idleRight;
    }
  }
}
