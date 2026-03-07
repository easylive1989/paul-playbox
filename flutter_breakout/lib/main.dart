import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter_breakout/break_out_game/breakout_game.dart';
import 'package:flutter_breakout/game_over_screen.dart';
import 'package:flutter_breakout/pre_game_overlay.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: Scaffold(
        body: GameWidget<BreakoutGame>(
          game: BreakoutGame(),
          overlayBuilderMap: {
            "preGame": (context, game) => const PreGameOverlay(),
            "gameOver": (context, game) => GameOverScreen(game: game)
          },
        ),
      ),
    );
  }
}
