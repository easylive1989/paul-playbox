import 'package:flame/extensions.dart';
import 'package:flame_forge2d/flame_forge2d.dart';
import 'package:flutter_breakout/break_out_game/ball.dart';
import 'package:flutter_breakout/break_out_game/breakout_game.dart';

class Brick extends BodyComponent<BreakoutGame> with ContactCallbacks {
  Brick({
    required this.size,
    required this.position,
  });

  final Size size;
  final Vector2 position;
  var destroy = false;

  @override
  void beginContact(Object other, Contact contact) {
    if (other is Ball) {
      destroy = true;
    }
  }

  @override
  Body createBody() {
    var bodyDef = BodyDef()
      ..userData = this
      ..type = BodyType.static
      ..position = position;

    var brickBody = world.createBody(bodyDef);

    var shape = PolygonShape()
      ..setAsBox(
        size.width / 2,
        size.height / 2,
        Vector2(0, 0),
        0,
      );

    brickBody.createFixture(
      // TODO
      FixtureDef(shape)
        ..density = 100.0
        ..friction = 0.0
        ..restitution = 0.1,
    );
    return brickBody;
  }
}
