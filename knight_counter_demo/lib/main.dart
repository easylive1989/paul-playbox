import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:knight_counter_demo/my_game.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: GameWidget(
        game: MyGame(),
      ),
    );
  }
}



