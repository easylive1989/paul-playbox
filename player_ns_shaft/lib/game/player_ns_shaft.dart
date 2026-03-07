import 'package:audioplayers/audioplayers.dart';
import 'package:flame/components.dart';
import 'package:flame/game.dart';
import 'package:flame/input.dart';
import 'package:flame/palette.dart';
import 'package:flutter/material.dart';
import 'package:player_ns_shaft/game/entities/hunter.dart';
import 'package:player_ns_shaft/game/entities/player/player.dart';
import 'package:player_ns_shaft/game/entities/terrace_generator.dart';
import 'package:player_ns_shaft/game/entities/world.dart';
import 'package:player_ns_shaft/l10n/l10n.dart';

class VeryGoodFlameGame extends FlameGame
    with HasTappables, HasCollisionDetection, HasDraggables, HasKeyboardHandlerComponents {
  VeryGoodFlameGame({
    required this.l10n,
    required this.effectPlayer,
  }) {
    images.prefix = '';
  }

  final AppLocalizations l10n;

  final AudioPlayer effectPlayer;

  Player? player;
  Hunter? hunter;
  TerraceGenerator? terraceGenerator;
  late JoystickComponent joystick;

  int get score {
    return player!.position.y.toInt();
  }

  @override
  Future<void> onLoad() async {
    camera.zoom = 3;
    await add(World());
    await _addJoyStick();
    await startGame();
  }

  Future<void> _addJoyStick() async {
    final knobPaint = BasicPalette.black.withAlpha(200).paint();
    final backgroundPaint = BasicPalette.lightBlue.withAlpha(100).paint();
    joystick = JoystickComponent(
      knob: CircleComponent(radius: 10, paint: knobPaint),
      background: CircleComponent(radius: 50, paint: backgroundPaint),
      margin: const EdgeInsets.only(left: 30, bottom: 40),
      priority: 10,
    );
    await add(joystick);
  }

  Future<void> startGame() async {
    overlays.remove('gameOverOverlay');
    player = Player(position: Vector2(size.x / 2, 15), joystick: joystick);
    hunter = Hunter(
      cameraHeight: camera.gameSize.y,
      position: Vector2(0, camera.gameSize.y / 2),
    );
    await add(hunter!);
    camera.followComponent(
      hunter!,
      worldBounds: Rect.fromLTWH(0, 0, size.x, double.infinity),
    );

    await add(player!);
    terraceGenerator = TerraceGenerator();
    await add(terraceGenerator!);
  }

  void gameOver() {
    overlays.add('gameOverOverlay');
    remove(player!);
    remove(hunter!);
    remove(terraceGenerator!);
  }
}
