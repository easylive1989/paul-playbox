import 'dart:ui';

import 'package:flame/components.dart';
import 'package:flutter_breakout/break_out_game/breakout_game.dart';
import 'package:flutter_breakout/break_out_game/brick.dart';
import 'package:flutter_breakout/break_out_game/game_state.dart';

class BrickWall extends Component with HasGameRef<BreakoutGame> {
  final Vector2 position;
  final int rows;
  final int columns;

  BrickWall({
    required this.position,
    required this.rows,
    required this.columns,
  });

  double gap = 1;

  @override
  Future<void> onLoad() async => _generateBricks();

  void _generateBricks() {
    final wallSize = Size(gameRef.size.x, gameRef.size.y * 0.25);

    final brickSize = Size(
      ((wallSize.width - gap * 2.0) - (columns - 1) * gap) / columns,
      (wallSize.height - (rows - 1) * gap) / rows,
    );

    var brickPosition = Vector2(
      brickSize.width / 2.0 + gap,
      brickSize.height / 2.0 + position.y,
    );

    List.generate(rows, (yIndex) {
      List.generate(columns, (xIndex) {
        // var paint = Paint()..color = colors[(xIndex + yIndex) % colors.length];
        add(Brick(
          position: brickPosition,
          size: brickSize,
        ));
        brickPosition += Vector2(brickSize.width + gap, 0.0);
      });
      brickPosition += Vector2(
        (brickSize.width / 2.0 + gap) - brickPosition.x,
        brickSize.height + gap,
      );
    });
  }

  @override
  void update(double dt) {
    if (children.isEmpty) {
      gameRef.gameState = GameState.won;
      return;
    }

    for (final child in children) {
      if (child is Brick && child.destroy) {
        for (final fixture in [...child.body.fixtures]) {
          child.body.destroyFixture(fixture);
        }
        gameRef.world.destroyBody(child.body);
        remove(child);
      }
    }

    super.update(dt);
  }

  void reset() async {
    removeAll(children);
    _generateBricks();
  }
}
