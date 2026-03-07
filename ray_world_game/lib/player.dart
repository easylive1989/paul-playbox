import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:flame/sprite.dart';
import 'package:flutter/services.dart';
import 'package:ray_world_game/weapon.dart';

import 'direction.dart';

class Player extends SpriteAnimationGroupComponent<Direction>
    with HasGameRef, CollisionCallbacks, KeyboardHandler {
  Player() : super(size: Vector2.all(50.0)) {
    add(RectangleHitbox());
  }

  Direction direction = Direction.none;
  Direction _collisionDirection = Direction.none;

  final double _playerSpeed = 300.0;
  late final Weapon _weapon;

  @override
  Future<void> onLoad() async {
    super.onLoad();
    final spriteSheet = SpriteSheet(
      image: await gameRef.images.load('player_spritesheet.png'),
      srcSize: Vector2(29.0, 32.0),
    );
    animations = {
      Direction.left:
          spriteSheet.createAnimation(row: 1, stepTime: 0.15, to: 4),
      Direction.up: spriteSheet.createAnimation(row: 2, stepTime: 0.15, to: 4),
      Direction.down:
          spriteSheet.createAnimation(row: 0, stepTime: 0.15, to: 4),
      Direction.right:
          spriteSheet.createAnimation(row: 3, stepTime: 0.15, to: 4),
      Direction.none: spriteSheet.createAnimation(row: 0, stepTime: 0.15, to: 1)
    };
    current = Direction.none;
    add(_weapon = Weapon(position: size/2));
  }

  @override
  void onCollision(Set<Vector2> intersectionPoints, PositionComponent other) {
    super.onCollision(intersectionPoints, other);
    if (other is Weapon) return;
    _collisionDirection = direction;
  }

  @override
  void onCollisionEnd(PositionComponent other) {
    super.onCollisionEnd(other);
    if (other is Weapon) return;
    _collisionDirection = Direction.none;
  }

  @override
  bool onKeyEvent(RawKeyEvent event, Set<LogicalKeyboardKey> keysPressed) {
    if (keysPressed.contains(LogicalKeyboardKey.arrowUp)) {
      direction = Direction.up;
    } else if (keysPressed.contains(LogicalKeyboardKey.arrowDown)) {
      direction = Direction.down;
    } else if (keysPressed.contains(LogicalKeyboardKey.arrowLeft)) {
      direction = Direction.left;
    } else if (keysPressed.contains(LogicalKeyboardKey.arrowRight)) {
      direction = Direction.right;
    } else {
      direction = Direction.none;
    }
    return super.onKeyEvent(event, keysPressed);
  }

  @override
  void update(double dt) {
    super.update(dt);
    _weapon.angle += dt * 4;
    switch (direction) {
      case Direction.none:
        current = Direction.none;
        break;
      case Direction.right:
        current = Direction.right;
        if (_collisionDirection != Direction.right) {
          moveRight(dt);
        }
        break;
      case Direction.left:
        current = Direction.left;
        if (_collisionDirection != Direction.left) {
          moveLeft(dt);
        }
        break;
      case Direction.up:
        current = Direction.up;
        if (_collisionDirection != Direction.up) {
          moveUp(dt);
        }
        break;
      case Direction.down:
        current = Direction.down;
        if (_collisionDirection != Direction.down) {
          moveDown(dt);
        }
        break;
    }
  }

  void moveDown(double delta) {
    position.add(Vector2(0, delta * _playerSpeed));
  }

  void moveUp(double delta) {
    position.add(Vector2(0, delta * -_playerSpeed));
  }

  void moveLeft(double delta) {
    position.add(Vector2(delta * -_playerSpeed, 0));
  }

  void moveRight(double delta) {
    position.add(Vector2(delta * _playerSpeed, 0));
  }
}
