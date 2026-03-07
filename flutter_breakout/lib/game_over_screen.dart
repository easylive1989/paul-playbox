import 'package:flutter/material.dart';
import 'package:flutter_breakout/break_out_game/breakout_game.dart';

class GameOverScreen extends StatelessWidget {
  const GameOverScreen({
    Key? key,
    required this.game,
  }) : super(key: key);

  final BreakoutGame game;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "Game Over",
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              style: ButtonStyle(
                backgroundColor: MaterialStateProperty.all(Colors.grey),
              ),
              onPressed: game.resetGame,
              child: const Text("Reset"),
            ),
          ],
        ),
      ),
    );
  }
}
