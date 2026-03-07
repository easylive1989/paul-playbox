import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:water_sort_puzzle/game/water_sort_game.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: GameWidget(
          game: WaterSortGame(),
          initialActiveOverlays: const ['hud'],
          overlayBuilderMap: {
            'hud': (BuildContext context, WaterSortGame game) {
              return SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Level ${game.currentLevelIndex + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        onPressed: game.restartLevel,
                        icon: const Icon(Icons.refresh, color: Colors.white),
                        tooltip: 'Restart',
                      ),
                    ],
                  ),
                ),
              );
            },
            'win': (BuildContext context, WaterSortGame game) {
              return Center(
                child: Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'You Win!',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: game.restartLevel,
                        child: const Text('Restart'),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: game.nextLevel,
                        child: const Text('Next Level'),
                      ),
                    ],
                  ),
                ),
              );
            },
          },
        ),
      ),
    );
  }
}
