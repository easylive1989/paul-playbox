import 'package:flame_forge2d/flame_forge2d.dart';
import 'package:flutter_breakout/break_out_game/breakout_game.dart';

class Arena extends BodyComponent<BreakoutGame> {
  @override
  Body createBody() {
    final arenaSize = gameRef.size;
    final bodyDef = BodyDef()
      ..position = Vector2(0, 0)
      ..type = BodyType.static;

    final arenaBody = world.createBody(bodyDef);

    final vertices = <Vector2>[
      arenaSize,
      Vector2(0, arenaSize.y),
      Vector2(0, 0),
      Vector2(arenaSize.x, 0),
    ];

    final chain = ChainShape()..createLoop(vertices);

    for (var index = 0; index < chain.childCount; index++) {
      arenaBody.createFixture(
        FixtureDef(chain.childEdge(index))
          ..density = 2000.0
          ..friction = 0.0
          ..restitution = 0.4,
      );
    }

    return arenaBody;
  }
}
