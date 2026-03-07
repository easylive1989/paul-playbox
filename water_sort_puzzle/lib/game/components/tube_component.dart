import 'dart:ui';

import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:water_sort_puzzle/game/level_data.dart';
import 'package:water_sort_puzzle/game/water_sort_game.dart';

class TubeComponent extends PositionComponent
    with HasGameReference<WaterSortGame>, TapCallbacks {
  static const double tubeWidth = 60;
  static const double tubeHeight = 160;
  static const double wallThickness = 3;
  static const double bottomRadius = 12;
  static const double layerGap = 2;

  final int tubeIndex;
  final int capacity;
  final List<int> layers;

  bool isSelected = false;

  TubeComponent({
    required this.tubeIndex,
    required this.capacity,
    required List<int> initialLayers,
    super.position,
  })  : layers = List<int>.from(initialLayers),
        super(size: Vector2(tubeWidth, tubeHeight));

  Color? get topColor => layers.isEmpty ? null : kWaterColors[layers.last];

  bool get isEmpty => layers.isEmpty;

  bool get isFull => layers.length >= capacity;

  bool get isComplete =>
      layers.length == capacity &&
      layers.every((c) => c == layers.first);

  int get topCount {
    if (layers.isEmpty) return 0;
    final topColorIndex = layers.last;
    int count = 0;
    for (int i = layers.length - 1; i >= 0; i--) {
      if (layers[i] == topColorIndex) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  bool canReceiveFrom(TubeComponent source) {
    if (source.isEmpty) return false;
    if (isFull) return false;
    if (isEmpty) return true;
    return topColor == source.topColor;
  }

  @override
  void render(Canvas canvas) {
    final paint = Paint()..style = PaintingStyle.stroke;

    // 外框
    paint.color = isSelected
        ? const Color(0xFFFFFF00)
        : const Color(0xFFCCCCCC);
    paint.strokeWidth = isSelected ? 3.0 : 2.0;

    final outerRect = RRect.fromRectAndCorners(
      Rect.fromLTWH(0, 0, tubeWidth, tubeHeight),
      bottomLeft: const Radius.circular(bottomRadius),
      bottomRight: const Radius.circular(bottomRadius),
    );
    canvas.drawRRect(outerRect, paint);

    // 水層（由底向上）
    final innerWidth = tubeWidth - wallThickness * 2;
    final innerHeight = tubeHeight - wallThickness - bottomRadius;
    final layerHeight = innerHeight / capacity;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    for (int i = 0; i < layers.length; i++) {
      fillPaint.color = kWaterColors[layers[i]];
      final y = tubeHeight - wallThickness - bottomRadius - (i + 1) * layerHeight;
      final rect = Rect.fromLTWH(
        wallThickness + layerGap,
        y,
        innerWidth - layerGap * 2,
        layerHeight - layerGap,
      );

      if (i == 0) {
        // 最底層用圓角底部
        final rrect = RRect.fromRectAndCorners(
          rect,
          bottomLeft: Radius.circular(bottomRadius - wallThickness),
          bottomRight: Radius.circular(bottomRadius - wallThickness),
        );
        canvas.drawRRect(rrect, fillPaint);
      } else {
        canvas.drawRect(rect, fillPaint);
      }
    }
  }

  @override
  void onTapUp(TapUpEvent event) {
    game.onTubeTapped(tubeIndex);
  }
}
