part of 'audio_cubit.dart';

class AudioState extends Equatable {
  const AudioState({this.volume = 0});
  final double volume;

  AudioState copyWith({double? volume}) {
    return AudioState(volume: volume ?? this.volume);
  }

  @override
  List<Object> get props => [volume];
}
