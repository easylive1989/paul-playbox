import 'dart:ui';

import 'package:flame/components.dart';
import 'package:water_sort_puzzle/game/components/tube_component.dart';
import 'package:water_sort_puzzle/game/game_state.dart';
import 'package:water_sort_puzzle/game/level_data.dart';
import 'package:water_sort_puzzle/game/water_sort_game.dart';

class PourAnimation extends PositionComponent
    with HasGameReference<WaterSortGame> {
  static const double speed = 400; // pixels per second

  final TubeComponent source;
  final TubeComponent target;
  final int colorIndex;
  final int count;

  late Vector2 _start;
  late Vector2 _mid; // 上升到管口上方
  late Vector2 _end;

  int _phase = 0; // 0 = rise, 1 = move to target
  double _progress = 0;

  PourAnimation({
    required this.source,
    required this.target,
    required this.colorIndex,
    required this.count,
  }) : super(size: Vector2(TubeComponent.tubeWidth - 10, 0));

  @override
  Future<void> onLoad() async {
    await super.onLoad();

    final layerHeight =
        (TubeComponent.tubeHeight - TubeComponent.wallThickness - TubeComponent.bottomRadius) /
            source.capacity;
    final blobHeight = layerHeight * count;
    size = Vector2(TubeComponent.tubeWidth - 10, blobHeight);

    // 起點：source 管內頂部水層位置
    final sourceTopY = source.position.y +
        TubeComponent.tubeHeight -
        TubeComponent.wallThickness -
        TubeComponent.bottomRadius -
        (source.layers.length + count) * layerHeight;
    _start = Vector2(source.position.x + 5, sourceTopY);

    // 中間點：source 管口上方
    _mid = Vector2(source.position.x + 5, source.position.y - blobHeight - 10);

    // 終點：target 管口上方，然後下降到目標位置
    final targetCurrentLayers = target.layers.length;
    final targetTopY = target.position.y +
        TubeComponent.tubeHeight -
        TubeComponent.wallThickness -
        TubeComponent.bottomRadius -
        (targetCurrentLayers + count) * layerHeight;
    _end = Vector2(target.position.x + 5, targetTopY);

    position = _start.clone();
  }

  @override
  void update(double dt) {
    super.update(dt);

    final Vector2 from;
    final Vector2 to;

    if (_phase == 0) {
      from = _start;
      to = _mid;
    } else {
      from = _mid;
      to = _end;
    }

    final distance = from.distanceTo(to);
    if (distance == 0) {
      _advancePhase();
      return;
    }

    _progress += (speed * dt) / distance;

    if (_progress >= 1.0) {
      position.setFrom(to);
      _advancePhase();
    } else {
      position
        ..setFrom(from)
        ..lerp(to, _progress);
    }
  }

  void _advancePhase() {
    if (_phase == 0) {
      _phase = 1;
      _progress = 0;
    } else {
      // 動畫結束：將水加入 target
      for (int i = 0; i < count; i++) {
        target.layers.add(colorIndex);
      }
      game.gameState = GameState.playing;
      game.checkWin();
      removeFromParent();
    }
  }

  @override
  void render(Canvas canvas) {
    final paint = Paint()
      ..color = kWaterColors[colorIndex]
      ..style = PaintingStyle.fill;

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.x, size.y),
        const Radius.circular(4),
      ),
      paint,
    );
  }
}
