import 'dart:ui';

import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:ray_world_game/direction.dart';
import 'package:ray_world_game/map_loader.dart';
import 'package:ray_world_game/monster_generator.dart';
import 'package:ray_world_game/player.dart';
import 'package:ray_world_game/score.dart';
import 'package:ray_world_game/world.dart';
import 'package:ray_world_game/world_collidable.dart';

class RayWorldGame extends FlameGame with HasCollisionDetection, HasKeyboardHandlerComponents {
  late Player _player;
  late World _world;

  int score = 0;

  Player get player => _player;

  @override
  Future<void> onLoad() async {
    super.onLoad();
    await add(_world = World());
    await add(_player = Player());
    _player.position = _world.size / 2;
    camera.followComponent(
      _player,
      worldBounds: Rect.fromLTRB(0, 0, _world.size.x, _world.size.y),
    );
    addWorldCollision();
    add(MonsterGenerator());
    add(Score());
  }

  void onJoypadDirectionChanged(Direction direction) {
    _player.direction = direction;
  }

  void addWorldCollision() async {
    for (var rect in await MapLoader.readRayWorldCollisionMap()) {
      add(WorldCollidable(position: Vector2(rect.left, rect.top))
        ..width = rect.width
        ..height = rect.height);
    }
  }
}
