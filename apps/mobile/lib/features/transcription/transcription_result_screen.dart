import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:audioplayers/audioplayers.dart';
import '../../core/audio/audio_player_service.dart';
import '../../core/logging/app_logger.dart';
import '../../core/network/api_client.dart';
import '../../shared/models/transcription_item.dart';
import '../recording/recording_screen.dart';

class TranscriptionResultScreen extends StatefulWidget {
  final TranscriptionItem item;

  const TranscriptionResultScreen({
    Key? key,
    required this.item,
  }) : super(key: key);

  @override
  State<TranscriptionResultScreen> createState() => _TranscriptionResultScreenState();
}

class _TranscriptionResultScreenState extends State<TranscriptionResultScreen> with SingleTickerProviderStateMixin {
  static const String tag = 'TranscriptionResultScreen';

  late TabController _tabController;
  late TextEditingController _textEditingController;
  final AudioPlayerService _playerService = AudioPlayerService();

  late TranscriptionItem _item;
  bool _isEditing = false;
  bool _isSaving = false;
  bool _isPlaying = false;
  Duration _currentPos = Duration.zero;
  Duration _totalDuration = Duration.zero;

  @override
  void initState() {
    super.initState();
    _item = widget.item;
    _tabController = TabController(length: 2, vsync: this);
    _textEditingController = TextEditingController(text: _item.correctedTranscript);

    _playerService.stateStream.listen((state) {
      if (mounted) setState(() => _isPlaying = state == PlayerState.playing);
    });

    _playerService.positionStream.listen((pos) {
      if (mounted) setState(() => _currentPos = pos);
    });

    _playerService.durationStream.listen((dur) {
      if (mounted) setState(() => _totalDuration = dur);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _textEditingController.dispose();
    _playerService.dispose();
    super.dispose();
  }

  Future<void> _toggleAudio() async {
    if (_isPlaying) {
      await _playerService.pause();
    } else {
      if (_item.localAudioPath != null && await File(_item.localAudioPath!).exists()) {
        await _playerService.playFile(_item.localAudioPath!);
      }
    }
  }

  Future<void> _saveEditedText() async {
    final newText = _textEditingController.text.trim();
    if (newText.isEmpty) return;

    setState(() => _isSaving = true);
    try {
      final ok = await ApiClient.updateTranscription(_item.id, newText);
      if (ok) {
        setState(() {
          _item = _item.copyWith(correctedTranscript: newText);
          _isEditing = false;
        });
        AppLogger.info(tag, 'Transcription updated and saved');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('تم حفظ التعديلات بنجاح! / Saved')),
          );
        }
      }
    } catch (e) {
      AppLogger.error(tag, 'Failed to save edited transcript', e);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _copyToClipboard() {
    final text = _tabController.index == 0 ? _item.correctedTranscript : _item.originalTranscript;
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم نسخ النص إلى الحافظة / Copied to clipboard')),
    );
  }

  Future<void> _shareTranscript() async {
    final text = 'التفريغ الصوتي الذكي:\n\n'
        'النص بعد تصحيح Qwen:\n${_item.correctedTranscript}\n\n'
        'تفريغ Whisper الأولي:\n${_item.originalTranscript}';
    await Share.share(text, subject: 'تفريغ صوتي - AI Transcription');
  }

  Future<void> _exportAsTxt() async {
    try {
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/transcript_${_item.id.substring(0, 8)}.txt');
      await file.writeAsString(
        'AI Transcription SaaS Report\n'
        'ID: ${_item.id}\n'
        'Duration: ${_item.durationSeconds}s\n'
        'Whisper Model: ${_item.whisperModel}\n'
        'Qwen Model: ${_item.qwenModel}\n\n'
        '--- Corrected Transcript (Qwen 2.5) ---\n'
        '${_item.correctedTranscript}\n\n'
        '--- Original Whisper Transcript ---\n'
        '${_item.originalTranscript}\n'
      );

      await Share.shareXFiles([XFile(file.path)], text: 'Exported Transcript TXT');
    } catch (e) {
      AppLogger.error(tag, 'Export TXT error', e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('نتيجة التفريغ الصوتي / Transcript'),
        actions: [
          IconButton(
            icon: Icon(_isEditing ? Icons.check : Icons.edit_outlined),
            tooltip: _isEditing ? 'حفظ / Save' : 'تعديل / Edit',
            onPressed: () {
              if (_isEditing) {
                _saveEditedText();
              } else {
                setState(() => _isEditing = true);
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.copy_outlined),
            tooltip: 'Copy',
            onPressed: _copyToClipboard,
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Share',
            onPressed: _shareTranscript,
          ),
          IconButton(
            icon: const Icon(Icons.file_download_outlined),
            tooltip: 'Export TXT',
            onPressed: _exportAsTxt,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Model Info & Meta Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('Whisper: ${_item.whisperModel ?? "Large V3"}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                  ),
                  const SizedBox(width: 8),
                  if (_item.qwenApplied) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.purple.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('Qwen: 2.5 72B ✓', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.purple)),
                    ),
                    const SizedBox(width: 8),
                  ],
                  const Spacer(),
                  Text('${_item.durationSeconds.toStringAsFixed(1)}s', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),

            // Audio Player Bar if local audio is available
            if (_item.localAudioPath != null && File(_item.localAudioPath!).existsSync()) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F172A) : Colors.white,
                  border: Border(bottom: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
                ),
                child: Row(
                  children: [
                    IconButton.filled(
                      icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
                      onPressed: _toggleAudio,
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                              trackHeight: 3,
                            ),
                            child: Slider(
                              value: _currentPos.inMilliseconds.toDouble().clamp(
                                  0.0,
                                  _totalDuration.inMilliseconds > 0
                                      ? _totalDuration.inMilliseconds.toDouble()
                                      : 1.0),
                              max: _totalDuration.inMilliseconds > 0 ? _totalDuration.inMilliseconds.toDouble() : 1.0,
                              onChanged: (val) {
                                _playerService.seek(Duration(milliseconds: val.toInt()));
                              },
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('${_currentPos.inMinutes}:${(_currentPos.inSeconds % 60).toString().padLeft(2, '0')}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                Text('${_totalDuration.inMinutes}:${(_totalDuration.inSeconds % 60).toString().padLeft(2, '0')}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Tabs for Qwen Corrected vs Original Whisper
            TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF2563EB),
              unselectedLabelColor: Colors.grey,
              indicatorColor: const Color(0xFF2563EB),
              tabs: const [
                Tab(text: 'المصحح بواسطة Qwen 2.5 ✨'),
                Tab(text: 'تفريغ Whisper الأصلي 🎙️'),
              ],
            ),

            // Tab Views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Tab 1: Corrected
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: _isEditing
                        ? TextField(
                            controller: _textEditingController,
                            maxLines: null,
                            expands: true,
                            textAlignVertical: TextAlignVertical.top,
                            style: const TextStyle(fontSize: 16, height: 1.7),
                            decoration: const InputDecoration(
                              hintText: 'اكتب أو عدل النص هنا...',
                              border: OutlineInputBorder(),
                            ),
                          )
                        : SingleChildScrollView(
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
                              ),
                              child: SelectableText(
                                _item.correctedTranscript.isNotEmpty ? _item.correctedTranscript : _item.originalTranscript,
                                style: const TextStyle(fontSize: 16, height: 1.7, fontWeight: FontWeight.w500),
                              ),
                            ),
                          ),
                  ),

                  // Tab 2: Raw Whisper
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: SingleChildScrollView(
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                        ),
                        child: SelectableText(
                          _item.originalTranscript.isNotEmpty ? _item.originalTranscript : 'لا يوجد نص أولي متاح',
                          style: const TextStyle(fontSize: 15, height: 1.7, fontFamily: 'monospace'),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Bottom action: New Transcription
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_isEditing)
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isSaving ? null : _saveEditedText,
                        icon: const Icon(Icons.check),
                        label: _isSaving ? const CircularProgressIndicator(color: Colors.white) : const Text('حفظ التعديلات / Save'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(builder: (_) => const RecordingScreen()),
                          );
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('تسجيل جديد / New Recording'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
