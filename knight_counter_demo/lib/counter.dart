import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import 'package:knight_counter_demo/my_game.dart';

class Counter extends PositionComponent with HasGameRef<MyGame> {
  Counter({super.position, super.size, super.anchor});

  late TextComponent _text;

  @override
  Future<void> onLoad() async {
    await add(_text = TextComponent(
      anchor: anchor,
      textRenderer: TextPaint(
        style: const TextStyle(color: Colors.white, fontSize: 10),
      ),
    ));
  }

  @override
  void update(double dt) {
    _text.text = "Knight has attacked ${gameRef.count} times";
  }
}
