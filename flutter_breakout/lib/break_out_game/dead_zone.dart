import 'package:flame_forge2d/flame_forge2d.dart';
import 'package:flutter_breakout/break_out_game/ball.dart';
import 'package:flutter_breakout/break_out_game/breakout_game.dart';
import 'package:flutter_breakout/break_out_game/game_state.dart';

class DeadZone extends BodyComponent<BreakoutGame> with ContactCallbacks {
  DeadZone({
    required this.position,
    required this.size,
  });

  final Vector2 position;
  final Vector2 size;

  @override
  bool get renderBody => false;

  @override
  void beginContact(Object other, Contact contact) {
    super.beginContact(other, contact);
    if (other is Ball) {
      gameRef.gameState = GameState.lost;
    }
  }

  @override
  Body createBody() {
    var bodyDef = BodyDef()
      ..userData = this
      ..position = position;

    var zoneBody = world.createBody(bodyDef);

    var shape = PolygonShape()
      ..setAsBox(
        size.x,
        size.y,
        Vector2(0, 0),
        0,
      );

    zoneBody.createFixture(FixtureDef(shape));
    return zoneBody;
  }
}
