import 'package:audioplayers/audioplayers.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:player_ns_shaft/loading/cubit/preload/preload_cubit.dart';

class MockPreloadCubit extends MockCubit<PreloadState> implements PreloadCubit {
}

class MockAudioCache extends Mock implements AudioCache {}
