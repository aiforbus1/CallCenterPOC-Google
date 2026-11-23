import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import '../../core/audio/audio_recorder_service.dart';
import '../../core/audio/audio_player_service.dart';
import '../../core/logging/app_logger.dart';
import '../../shared/widgets/audio_visualizer_widget.dart';
import '../../shared/models/transcription_item.dart';
import '../transcription/transcription_workflow_screen.dart';

class RecordingScreen extends StatefulWidget {
  const RecordingScreen({Key? key}) : super(key: key);

  @override
  State<RecordingScreen> createState() => _RecordingScreenState();
}

class _RecordingScreenState extends State<RecordingScreen> {
  static const String tag = 'RecordingScreen';

  final AudioRecorderService _recorderService = AudioRecorderService();
  final AudioPlayerService _playerService = AudioPlayerService();

  RecordingState _recordingState = RecordingState.stopped;
  Duration _duration = Duration.zero;
  double _amplitude = 0.0;
  String? _recordedFilePath;
  bool _isPlayingPreview = false;
  String? _errorMessage;

  StreamSubscription? _stateSub;
  StreamSubscription? _durationSub;
  StreamSubscription? _ampSub;
  StreamSubscription? _playerStateSub;

  @override
  void initState() {
    super.initState();

    _stateSub = _recorderService.stateStream.listen((state) {
      if (mounted) setState(() => _recordingState = state);
    });

    _durationSub = _recorderService.durationStream.listen((dur) {
      if (mounted) setState(() => _duration = dur);
    });

    _ampSub = _recorderService.amplitudeStream.listen((amp) {
      if (mounted) setState(() => _amplitude = amp);
    });

    _playerStateSub = _playerService.stateStream.listen((state) {
      if (mounted) {
        setState(() => _isPlayingPreview = state == PlayerState.playing);
      }
    });

    // Auto-start recording immediately when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startRecording();
    });
  }

  @override
  void dispose() {
    _stateSub?.cancel();
    _durationSub?.cancel();
    _ampSub?.cancel();
    _playerStateSub?.cancel();
    _recorderService.dispose();
    _playerService.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    setState(() => _errorMessage = null);
    try {
      final path = await _recorderService.startRecording();
      AppLogger.info(tag, 'Recording started: $path');
    } catch (e) {
      AppLogger.error(tag, 'Failed to start recording', e);
      if (mounted) {
        setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  Future<void> _pauseRecording() async {
    await _recorderService.pauseRecording();
  }

  Future<void> _resumeRecording() async {
    await _recorderService.resumeRecording();
  }

  Future<void> _stopRecording() async {
    try {
      final path = await _recorderService.stopRecording();
      if (mounted) {
        setState(() {
          _recordedFilePath = path;
        });
      }
    } catch (e) {
      AppLogger.error(tag, 'Error stopping recording', e);
    }
  }

  Future<void> _discardRecording() async {
    await _playerService.stop();
    await _recorderService.cancelRecording();
    if (mounted) {
      setState(() {
        _recordedFilePath = null;
        _duration = Duration.zero;
        _amplitude = 0.0;
      });
    }
  }

  Future<void> _togglePreviewPlayback() async {
    if (_recordedFilePath == null) return;
    if (_isPlayingPreview) {
      await _playerService.pause();
    } else {
      await _playerService.playFile(_recordedFilePath!);
    }
  }

  void _proceedToTranscription() async {
    if (_recordedFilePath == null) return;
    await _playerService.stop();

    final file = File(_recordedFilePath!);
    if (!await file.exists()) {
      setState(() => _errorMessage = 'Audio file does not exist');
      return;
    }

    if (!mounted) return;
    final result = await Navigator.push<TranscriptionItem>(
      context,
      MaterialPageRoute(
        builder: (_) => TranscriptionWorkflowScreen(audioFile: file),
      ),
    );

    if (result != null && mounted) {
      Navigator.pop(context, result);
    }
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isRecording = _recordingState == RecordingState.recording;
    final isPaused = _recordingState == RecordingState.paused;
    final hasRecordedFile = _recordedFilePath != null && _recordingState == RecordingState.stopped;

    return Scaffold(
      appBar: AppBar(
        title: const Text('تسجيل صوتي / Record Audio'),
        actions: [
          if (hasRecordedFile)
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
              tooltip: 'Discard',
              onPressed: _discardRecording,
            ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),

              // Timer Display
              Text(
                _formatDuration(_duration),
                style: const TextStyle(
                  fontSize: 54,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 8),

              // Status text
              Text(
                isRecording
                    ? 'جارٍ التسجيل من الميكروفون... / Recording'
                    : isPaused
                        ? 'متوقف مؤقتاً / Paused'
                        : hasRecordedFile
                            ? 'تم إنهاء التسجيل، اضغط لمعاينة الصوت أو التفريغ'
                            : 'جاهز لبدء التسجيل',
                style: TextStyle(
                  fontSize: 14,
                  color: isRecording
                      ? Colors.redAccent
                      : isPaused
                          ? Colors.amber
                          : Colors.grey,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 32),

              // Audio Waveform / Level Meter Visualizer
              AudioVisualizerWidget(
                amplitude: _amplitude,
                isRecording: isRecording,
              ),
              const SizedBox(height: 32),

              // Error banner if any
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade900.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade300.withOpacity(0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 13))),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Post-recording audio preview player card
              if (hasRecordedFile) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      IconButton.filled(
                        icon: Icon(_isPlayingPreview ? Icons.pause : Icons.play_arrow),
                        onPressed: _togglePreviewPlayback,
                        style: IconButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('معاينة التسجيل الصوتي', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            Text('المدة: ${_formatDuration(_duration)}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.refresh, size: 18),
                        label: const Text('إعادة التسجيل'),
                        onPressed: () {
                          _discardRecording();
                          _startRecording();
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              const Spacer(),

              // Primary Action Controls
              if (hasRecordedFile) ...[
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: _proceedToTranscription,
                    icon: const Icon(Icons.auto_awesome),
                    label: const Text('تفريغ الصوت الآن (Whisper + Qwen)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 3,
                    ),
                  ),
                ),
              ] else ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Pause / Resume button
                    if (isRecording || isPaused) ...[
                      IconButton(
                        iconSize: 48,
                        icon: Icon(isPaused ? Icons.play_circle_fill : Icons.pause_circle_filled),
                        color: Colors.amber,
                        onPressed: isPaused ? _resumeRecording : _pauseRecording,
                      ),
                      const SizedBox(width: 24),
                    ],

                    // Stop / Record Main Button
                    GestureDetector(
                      onTap: () {
                        if (isRecording || isPaused) {
                          _stopRecording();
                        } else {
                          _startRecording();
                        }
                      },
                      child: Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isRecording ? Colors.red : const Color(0xFF2563EB),
                          boxShadow: [
                            BoxShadow(
                              color: (isRecording ? Colors.red : const Color(0xFF2563EB)).withOpacity(0.4),
                              blurRadius: 18,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Icon(
                          isRecording ? Icons.stop_rounded : Icons.mic_rounded,
                          color: Colors.white,
                          size: 38,
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
