import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:audioplayers/audioplayers.dart';
import '../logging/app_logger.dart';

class AudioPlayerService {
  static const String tag = 'AudioPlayerService';

  final AudioPlayer _player = AudioPlayer();
  PlayerState _state = PlayerState.stopped;

  final StreamController<PlayerState> _stateController = StreamController<PlayerState>.broadcast();
  final StreamController<Duration> _positionController = StreamController<Duration>.broadcast();
  final StreamController<Duration> _durationController = StreamController<Duration>.broadcast();

  Stream<PlayerState> get stateStream => _stateController.stream;
  Stream<Duration> get positionStream => _positionController.stream;
  Stream<Duration> get durationStream => _durationController.stream;

  PlayerState get state => _state;

  AudioPlayerService() {
    _player.onPlayerStateChanged.listen((state) {
      _state = state;
      _stateController.add(state);
    });

    _player.onPositionChanged.listen((pos) {
      _positionController.add(pos);
    });

    _player.onDurationChanged.listen((dur) {
      _durationController.add(dur);
    });
  }

  Future<void> playBytes(Uint8List bytes) async {
    try {
      await _player.stop();
      await _player.play(BytesSource(bytes));
    } catch (e) {
      AppLogger.error(tag, 'Error playing audio bytes', e);
    }
  }

  Future<void> playBase64(String base64Audio) async {
    try {
      final clean = base64Audio.replaceAll(RegExp(r'\s+'), '');
      final bytes = base64Decode(clean);
      await playBytes(bytes);
    } catch (e) {
      AppLogger.error(tag, 'Error playing base64 audio', e);
    }
  }

  Future<void> playFile(String filePath) async {
    try {
      AppLogger.info(tag, 'Playing local audio file: $filePath');
      await _player.stop();
      await _player.play(DeviceFileSource(filePath));
    } catch (e) {
      AppLogger.error(tag, 'Error playing audio file', e);
      rethrow;
    }
  }

  Future<void> playUrl(String url) async {
    try {
      AppLogger.info(tag, 'Playing remote audio URL: $url');
      await _player.stop();
      await _player.play(UrlSource(url));
    } catch (e) {
      AppLogger.error(tag, 'Error playing audio URL', e);
      rethrow;
    }
  }

  Future<void> pause() async {
    await _player.pause();
  }

  Future<void> resume() async {
    await _player.resume();
  }

  Future<void> stop() async {
    await _player.stop();
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  void dispose() {
    _player.dispose();
    _stateController.close();
    _positionController.close();
    _durationController.close();
  }
}
