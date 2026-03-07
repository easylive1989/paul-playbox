import 'dart:math';

import 'package:flame/components.dart';
import 'package:ray_world_game/monster.dart';
import 'package:ray_world_game/ray_world_game.dart';

class MonsterGenerator extends Component with HasGameRef<RayWorldGame> {
  @override
  Future onLoad() async {
    super.onLoad();
  }

  @override
  void update(double dt) {
    super.update(dt);

    var random = Random();
    var generateRandom = random.nextInt(100);
    if (generateRandom < 10) {
      var randomX = (random.nextInt(700) + 300) * (random.nextBool() ? 1 : -1);
      var randomY = (random.nextInt(700) + 300) * (random.nextBool() ? 1 : -1);
      gameRef.add(
        Monster()
          ..position = gameRef.player.position +
              Vector2(
                randomX.toDouble(),
                randomY.toDouble(),
              ),
      );
    }
  }
}
