import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:knight_counter_demo/my_game.dart';

main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final flameTester = FlameTester(() => MyGame());

  flameTester.testGameWidget(
    "count should be 1 when tapped",
    setUp: (game, tester) async {
      await _initGame(game);
    },
    verify: (game, tester) async {
      await whenTap(tester, game, Offset((game.size / 2).x, (game.size / 2).y));

      expect(game.count, 1);
    },
  );
}

Future<void> _initGame(MyGame game) async {
  await game.onLoad();
  // ignore: invalid_use_of_internal_member
  game.mount();
  game.update(0);
  await game.ready();
}

Future<void> whenTap(WidgetTester tester, MyGame game, Offset offset) async {
  await tester.tapAt(offset);

  game.pauseEngine();
  await tester.pumpAndSettle();
  game.resumeEngine();
}
