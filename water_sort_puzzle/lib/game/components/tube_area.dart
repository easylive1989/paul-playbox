import 'package:flame/components.dart';
import 'package:water_sort_puzzle/game/components/tube_component.dart';
import 'package:water_sort_puzzle/game/level_data.dart';
import 'package:water_sort_puzzle/game/water_sort_game.dart';

class TubeArea extends PositionComponent
    with HasGameReference<WaterSortGame> {
  static const int maxPerRow = 5;
  static const double horizontalGap = 16;
  static const double verticalGap = 24;

  final List<TubeComponent> tubes = [];

  TubeArea();

  void buildFromLevel(LevelData level, Vector2 gameSize) {
    tubes.clear();
    removeAll(children);

    final tubeCount = level.tubeCount;
    final rows = (tubeCount / maxPerRow).ceil();
    final tubeW = TubeComponent.tubeWidth;
    final tubeH = TubeComponent.tubeHeight;
    final totalHeight = rows * tubeH + (rows - 1) * verticalGap;

    for (int i = 0; i < tubeCount; i++) {
      final row = i ~/ maxPerRow;
      final col = i % maxPerRow;
      final countInRow = (row < rows - 1)
          ? maxPerRow
          : tubeCount - (rows - 1) * maxPerRow;

      final rowWidth = countInRow * tubeW + (countInRow - 1) * horizontalGap;

      // 以 (0,0) 為中心排版
      final offsetX = -rowWidth / 2 + col * (tubeW + horizontalGap);
      final offsetY = -totalHeight / 2 + row * (tubeH + verticalGap);

      final tube = TubeComponent(
        tubeIndex: i,
        capacity: level.tubeCapacity,
        initialLayers: level.tubes[i],
        position: Vector2(offsetX, offsetY),
      );
      tubes.add(tube);
      add(tube);
    }
  }

  void reset(LevelData level, Vector2 gameSize) {
    buildFromLevel(level, gameSize);
  }
}
