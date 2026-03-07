import 'dart:ui';

import 'package:flame/components.dart';
import 'package:flame_forge2d/flame_forge2d.dart';
import 'package:flutter/services.dart';
import 'package:flutter_breakout/break_out_game/breakout_game.dart';

enum PaddleState {
  movingRight,
  movingLeft,
  idle,
}

class Paddle extends BodyComponent<BreakoutGame> with KeyboardHandler {
  Paddle({required this.position, required this.size});

  final Vector2 position;
  final Size size;
  PaddleState _paddleState = PaddleState.idle;

  @override
  bool onKeyEvent(RawKeyEvent event, Set<LogicalKeyboardKey> keysPressed) {
    if (keysPressed.contains(LogicalKeyboardKey.arrowRight)) {
      _paddleState = PaddleState.movingRight;
    } else if (keysPressed.contains(LogicalKeyboardKey.arrowLeft)) {
      _paddleState = PaddleState.movingLeft;
    } else {
      _paddleState = PaddleState.idle;
    }
    return super.onKeyEvent(event, keysPressed);
  }

  @override
  void update(double dt) {
    var movingFactor = {
      PaddleState.movingLeft: -1,
      PaddleState.movingRight: 1,
      PaddleState.idle: 0,
    };

    body.setTransform(
      Vector2.copy(body.transform.p)
        ..add(Vector2(movingFactor[_paddleState]! * 20 * dt, 0)),
      0,
    );
    super.update(dt);
  }

  @override
  Body createBody() {
    var bodyDef = BodyDef()
      ..type = BodyType.static
      ..position = position;

    var paddleBody = world.createBody(bodyDef);

    final shape = PolygonShape()
      ..setAsBox(
        size.width / 2,
        size.height / 2,
        Vector2(0, 0),
        0,
      );

    paddleBody.createFixture(FixtureDef(shape));

    return paddleBody;
  }

  void reset() {
    body.setTransform(position, 0);
  }
}
