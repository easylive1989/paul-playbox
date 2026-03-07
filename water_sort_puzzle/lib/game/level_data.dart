import 'dart:ui';

const List<Color> kWaterColors = [
  Color(0xFFE53935), // 紅
  Color(0xFF1E88E5), // 藍
  Color(0xFF43A047), // 綠
  Color(0xFFFFB300), // 黃
  Color(0xFF8E24AA), // 紫
  Color(0xFFFF6D00), // 橙
  Color(0xFF00ACC1), // 青
  Color(0xFFD81B60), // 粉紅
];

class LevelData {
  final int tubeCapacity;
  final List<List<int>> tubes;

  const LevelData({
    this.tubeCapacity = 4,
    required this.tubes,
  });

  int get tubeCount => tubes.length;
}

const List<LevelData> defaultLevels = [
  // Level 1: 3 色 5 管
  LevelData(tubes: [
    [0, 1, 0, 2],
    [1, 2, 1, 0],
    [2, 0, 2, 1],
    [],
    [],
  ]),
  // Level 2: 4 色 6 管
  LevelData(tubes: [
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [1, 3, 0, 2],
    [2, 1, 3, 0],
    [],
    [],
  ]),
  // Level 3: 5 色 7 管
  LevelData(tubes: [
    [0, 1, 2, 3],
    [4, 0, 1, 2],
    [3, 4, 0, 1],
    [2, 3, 4, 0],
    [1, 2, 3, 4],
    [],
    [],
  ]),
];
