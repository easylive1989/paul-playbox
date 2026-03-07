// ignore_for_file: prefer_const_constructors

import 'dart:async';
import 'dart:ui';

import 'package:audioplayers/audioplayers.dart';
import 'package:flame/cache.dart';
import 'package:flutter/widgets.dart' hide Image;
import 'package:flutter_test/flutter_test.dart';
import 'package:mockingjay/mockingjay.dart';
import 'package:player_ns_shaft/gen/assets.gen.dart';
import 'package:player_ns_shaft/loading/cubit/preload/preload_cubit.dart';
import 'package:player_ns_shaft/loading/view/loading_page.dart';
import 'package:player_ns_shaft/loading/widgets/animated_progress_bar.dart';

import '../../helpers/helpers.dart';

class _MockImages extends Mock implements Images {}

class _MockAudioCache extends Mock implements AudioCache {}

void main() {
  group('LoadingPage', () {
    late PreloadCubit preloadCubit;
    late _MockImages images;
    late _MockAudioCache audio;

    setUp(() {
      preloadCubit = PreloadCubit(
        images = _MockImages(),
        audio = _MockAudioCache(),
      );

      when(() => images.loadAll(any())).thenAnswer((_) async => <Image>[]);

      when(() => audio.loadAll([Assets.audio.background, Assets.audio.effect]))
          .thenAnswer(
        (_) async => [
          Uri.parse(Assets.audio.background),
          Uri.parse(Assets.audio.effect)
        ],
      );
    });

    testWidgets('basic layout', (tester) async {
      await tester.pumpApp(
        LoadingPage(),
        preloadCubit: preloadCubit,
      );

      expect(find.byType(AnimatedProgressBar), findsOneWidget);
      expect(find.textContaining('Loading'), findsOneWidget);

      await tester.pumpAndSettle(Duration(seconds: 1));
    });

    testWidgets('loading text', (tester) async {
      final navigator = MockNavigator();
      when(() => navigator.pushReplacementNamed(any())).thenAnswer((_) async {
        return null;
      });

      Text textWidgetFinder() {
        return find.textContaining('Loading').evaluate().first.widget as Text;
      }

      await tester.pumpApp(
        LoadingPage(),
        preloadCubit: preloadCubit,
        navigator: navigator,
      );

      expect(textWidgetFinder().data, 'Loading  ...');

      unawaited(preloadCubit.loadSequentially());

      await tester.pump();

      expect(textWidgetFinder().data, 'Loading Delightful music...');
      await tester.pump(const Duration(milliseconds: 200));

      expect(textWidgetFinder().data, 'Loading Beautiful scenery...');
      await tester.pump(const Duration(milliseconds: 200));

      /// flush animation timers
      await tester.pumpAndSettle();
    });

    testWidgets('redirects after loading', (tester) async {
      final navigator = MockNavigator();
      when(() => navigator.pushReplacementNamed(any())).thenAnswer((_) async {
        return null;
      });

      await tester.pumpApp(
        LoadingPage(),
        preloadCubit: preloadCubit,
        navigator: navigator,
      );

      unawaited(preloadCubit.loadSequentially());

      await tester.pump(const Duration(milliseconds: 800));

      await tester.pumpAndSettle();

      verify(() => navigator.pushReplacementNamed('/title')).called(1);
    });
  });
}
