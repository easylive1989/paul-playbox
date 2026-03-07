import 'package:flutter/material.dart';
import 'package:player_ns_shaft/game/player_ns_shaft.dart';

// Overlay that pops up when the game ends
class GameOverOverlay extends StatelessWidget {
  const GameOverOverlay(this.game, {super.key});

  final VeryGoodFlameGame game;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.background,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(48),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Game Over',
                style: Theme.of(context).textTheme.displayMedium!.copyWith(),
              ),
              const SizedBox(height: 50),
              Text(
                'Score: ${game.score}',
              ),
              const SizedBox(
                height: 50,
              ),
              ElevatedButton(
                onPressed: game.startGame,
                style: ButtonStyle(
                  minimumSize: MaterialStateProperty.all(
                    const Size(200, 75),
                  ),
                  textStyle: MaterialStateProperty.all(
                    Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                child: const Text('Play Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
