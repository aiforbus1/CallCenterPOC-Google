import 'dart:async';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import '../logging/app_logger.dart';

enum RecordingState { stopped, recording, paused }

class AudioRecorderService {
  static const String tag = 'AudioRecorderService';

  final AudioRecorder _recorder = AudioRecorder();
  RecordingState _state = RecordingState.stopped;

  String? _currentFilePath;
  Timer? _durationTimer;
  Timer? _amplitudeTimer;
  int _secondsElapsed = 0;

  final StreamController<RecordingState> _stateController = StreamController<RecordingState>.broadcast();
  final StreamController<Duration> _durationController = StreamController<Duration>.broadcast();
  final StreamController<double> _amplitudeController = StreamController<double>.broadcast();

  Stream<RecordingState> get stateStream => _stateController.stream;
  Stream<Duration> get durationStream => _durationController.stream;
  Stream<double> get amplitudeStream => _amplitudeController.stream;

  RecordingState get state => _state;
  int get secondsElapsed => _secondsElapsed;
  String? get currentFilePath => _currentFilePath;

  Future<bool> hasPermission() async {
    try {
      final permitted = await _recorder.hasPermission();
      AppLogger.info(tag, 'Microphone permission status: $permitted');
      return permitted;
    } catch (e) {
      AppLogger.error(tag, 'Error checking microphone permission', e);
      return false;
    }
  }

  Future<String> startRecording() async {
    final permitted = await hasPermission();
    if (!permitted) {
      AppLogger.error(tag, 'Microphone permission denied by user');
      throw Exception('Microphone permission is required to record audio');
    }

    final dir = await getApplicationDocumentsDirectory();
    final recordingsDir = Directory('${dir.path}/recordings');
    if (!await recordingsDir.exists()) {
      await recordingsDir.create(recursive: true);
    }

    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final filePath = '${recordingsDir.path}/rec_$timestamp.wav';
    _currentFilePath = filePath;
    _secondsElapsed = 0;

    AppLogger.info(tag, 'Starting native recording to: $filePath');

    const config = RecordConfig(
      encoder: AudioEncoder.wav,
      sampleRate: 16000,
      numChannels: 1,
    );

    await _recorder.start(config, path: filePath);
    _state = RecordingState.recording;
    _stateController.add(_state);

    _startTimers();
    return filePath;
  }

  void _startTimers() {
    _durationTimer?.cancel();
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_state == RecordingState.recording) {
        _secondsElapsed++;
        _durationController.add(Duration(seconds: _secondsElapsed));
      }
    });

    _amplitudeTimer?.cancel();
    _amplitudeTimer = Timer.periodic(const Duration(milliseconds: 80), (timer) async {
      if (_state == RecordingState.recording) {
        try {
          final amp = await _recorder.getAmplitude();
          // Convert dB (-160 to 0) into 0.0 .. 1.0 normalized level
          final currentDb = amp.current;
          double normalized = 0.0;
          if (currentDb > -60) {
            normalized = ((currentDb + 60) / 60).clamp(0.0, 1.0);
          }
          _amplitudeController.add(normalized);
        } catch (_) {}
      }
    });
  }

  Future<void> pauseRecording() async {
    if (_state != RecordingState.recording) return;
    AppLogger.info(tag, 'Pausing recording');
    await _recorder.pause();
    _state = RecordingState.paused;
    _stateController.add(_state);
  }

  Future<void> resumeRecording() async {
    if (_state != RecordingState.paused) return;
    AppLogger.info(tag, 'Resuming recording');
    await _recorder.resume();
    _state = RecordingState.recording;
    _stateController.add(_state);
  }

  Future<String?> stopRecording() async {
    if (_state == RecordingState.stopped) return _currentFilePath;
    AppLogger.info(tag, 'Stopping recording, duration: ${_secondsElapsed}s');

    _durationTimer?.cancel();
    _amplitudeTimer?.cancel();

    final path = await _recorder.stop();
    _state = RecordingState.stopped;
    _stateController.add(_state);

    final finalPath = path ?? _currentFilePath;
    if (finalPath != null) {
      final file = File(finalPath);
      final exists = await file.exists();
      final size = exists ? await file.length() : 0;
      AppLogger.info(tag, 'Recording stopped', 'file: $finalPath, size: $size bytes');
      if (size < 1000) {
        AppLogger.warning(tag, 'Recorded audio file is very small or empty');
      }
    }

    return finalPath;
  }

  Future<void> cancelRecording() async {
    await stopRecording();
    if (_currentFilePath != null) {
      final file = File(_currentFilePath!);
      if (await file.exists()) {
        await file.delete();
        AppLogger.info(tag, 'Discarded recorded file: $_currentFilePath');
      }
      _currentFilePath = null;
    }
  }

  void dispose() {
    _durationTimer?.cancel();
    _amplitudeTimer?.cancel();
    _recorder.dispose();
    _stateController.close();
    _durationController.close();
    _amplitudeController.close();
  }
}
