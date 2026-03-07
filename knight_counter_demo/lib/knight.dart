import 'package:flame/experimental.dart';
import 'package:flame/components.dart';
import 'package:knight_counter_demo/my_game.dart';

class Knight extends PositionComponent with TapCallbacks, HasGameRef<MyGame> {
  Knight({super.position, super.size, super.anchor});

  late SpriteAnimationGroupComponent<KnightBehavior> _animations;

  @override
  Future<void> onLoad() async {
    var idleAnimation = await SpriteAnimation.load(
      "knight_idle.png",
      SpriteAnimationData.sequenced(
        amount: 10,
        stepTime: 0.1,
        textureSize: Vector2(120, 80),
      ),
    );

    var attackAnimation = await SpriteAnimation.load(
      "knight_attacking.png",
      SpriteAnimationData.sequenced(
        amount: 10,
        stepTime: 0.1,
        textureSize: Vector2(120, 80),
        loop: false,
      ),
    )
      ..onComplete = _onAttackAnimationComplete;

    await add(_animations = SpriteAnimationGroupComponent<KnightBehavior>(
      current: KnightBehavior.idle,
      size: size,
      animations: {
        KnightBehavior.idle: idleAnimation,
        KnightBehavior.attack: attackAnimation
      },
    ));
  }

  @override
  bool containsLocalPoint(Vector2 point) => true;

  @override
  void onTapUp(TapUpEvent event) {
    if (_animations.current == KnightBehavior.idle) {
      _animations.current = KnightBehavior.attack;
      gameRef.count++;
    }
  }

  void _onAttackAnimationComplete() {
    _animations.animation?.reset();
    _animations.current = KnightBehavior.idle;
  }
}

enum KnightBehavior {
  idle,
  attack,
}
