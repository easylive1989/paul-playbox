import 'package:flame/components.dart';
import 'package:flame/input.dart';
import 'package:flutter/material.dart';
import 'package:ray_world_game/ray_world_game.dart';

class Score extends HudMarginComponent<RayWorldGame> {
  Score() : super(margin: const EdgeInsets.only(top: 50, left: 50));

  late TextComponent _text;

  @override
  Future<void> onLoad() async {
    super.onLoad();
    await add(_text = TextComponent(
      anchor: anchor,
      textRenderer: TextPaint(
        style: const TextStyle(
          color: Colors.white,
          fontSize: 30,
          fontWeight: FontWeight.bold,
        ),
      ),
    ));
  }

  @override
  void update(double dt) {
    _text.text = "Kill ${gameRef.score} monsters";
  }
}
