import 'package:flame/game.dart';
import 'package:water_sort_puzzle/game/components/pour_animation.dart';
import 'package:water_sort_puzzle/game/components/tube_area.dart';
import 'package:water_sort_puzzle/game/game_state.dart';
import 'package:water_sort_puzzle/game/level_data.dart';

class WaterSortGame extends FlameGame {
  GameState gameState = GameState.playing;
  int currentLevelIndex = 0;
  late TubeArea tubeArea;
  int? _selectedTubeIndex;

  LevelData get currentLevel => defaultLevels[currentLevelIndex];

  @override
  Future<void> onLoad() async {
    await super.onLoad();
    tubeArea = TubeArea();
    world.add(tubeArea);
    tubeArea.buildFromLevel(currentLevel, size);
  }

  void onTubeTapped(int index) {
    if (gameState != GameState.playing) return;

    final tappedTube = tubeArea.tubes[index];

    if (_selectedTubeIndex == null) {
      if (tappedTube.isEmpty) return;
      _selectTube(index);
    } else if (_selectedTubeIndex == index) {
      _deselectTube();
    } else {
      final sourceIndex = _selectedTubeIndex!;
      _deselectTube();
      _pour(sourceIndex, index);
    }
  }

  void _pour(int sourceIndex, int targetIndex) {
    final source = tubeArea.tubes[sourceIndex];
    final target = tubeArea.tubes[targetIndex];

    if (!target.canReceiveFrom(source)) return;

    final colorToPour = source.layers.last;
    final pourCount = source.topCount;
    final spaceInTarget = target.capacity - target.layers.length;
    final actualPour = pourCount.clamp(0, spaceInTarget);

    // 先從 source 移除（動畫結束後才加入 target）
    for (int i = 0; i < actualPour; i++) {
      source.layers.removeLast();
    }

    gameState = GameState.animating;

    world.add(PourAnimation(
      source: source,
      target: target,
      colorIndex: colorToPour,
      count: actualPour,
    ));
  }

  void checkWin() {
    final won = tubeArea.tubes.every((t) => t.isEmpty || t.isComplete);
    if (won) {
      gameState = GameState.won;
      overlays.add('win');
    }
  }

  void _selectTube(int index) {
    _selectedTubeIndex = index;
    tubeArea.tubes[index].isSelected = true;
    tubeArea.tubes[index].position.y -= 10;
  }

  void _deselectTube() {
    if (_selectedTubeIndex != null) {
      final tube = tubeArea.tubes[_selectedTubeIndex!];
      tube.isSelected = false;
      tube.position.y += 10;
      _selectedTubeIndex = null;
    }
  }

  void restartLevel() {
    overlays.remove('win');
    gameState = GameState.playing;
    _selectedTubeIndex = null;
    tubeArea.reset(currentLevel, size);
  }

  void nextLevel() {
    overlays.remove('win');
    currentLevelIndex = (currentLevelIndex + 1) % defaultLevels.length;
    gameState = GameState.playing;
    _selectedTubeIndex = null;
    tubeArea.reset(currentLevel, size);
  }
}
