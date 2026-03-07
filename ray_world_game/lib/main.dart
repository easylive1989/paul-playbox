import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:ray_world_game/direction.dart';
import 'package:ray_world_game/joypad.dart';
import 'package:ray_world_game/ray_world_game.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    var game = RayWorldGame();
    return MaterialApp(
      home: Stack(
        children: [
          GameWidget(
            game: game,
          ),
          Positioned(
            right: 10,
            bottom: 10,
            child: Joypad(
              onJoypadDirectionChanged: (Direction direction) {
                game.onJoypadDirectionChanged(direction);
              },
            ),
          ),
        ],
      ),
    );
  }
}
