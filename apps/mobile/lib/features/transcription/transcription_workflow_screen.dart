import 'dart:io';
import 'package:flutter/material.dart';
import '../../core/logging/app_logger.dart';
import '../../core/network/api_client.dart';

class TranscriptionWorkflowScreen extends StatefulWidget {
  final File audioFile;

  const TranscriptionWorkflowScreen({
    Key? key,
    required this.audioFile,
  }) : super(key: key);

  @override
  State<TranscriptionWorkflowScreen> createState() => _TranscriptionWorkflowScreenState();
}

class _TranscriptionWorkflowScreenState extends State<TranscriptionWorkflowScreen> {
  static const String tag = 'TranscriptionWorkflow';

  bool _applyQwenCorrection = true;
  String _selectedLanguage = 'ar'; // Egyptian / Arabic default
  bool _isProcessing = false;
  String _currentStage = '';
  String? _errorMessage;

  final List<Map<String, String>> _languages = [
    {'code': 'ar', 'label': 'اللهجة المصرية (Egyptian Arabic)'},
    {'code': 'ar_upper', 'label': 'اللهجة الصعيدية (Upper Egyptian)'},
    {'code': 'ar_msa', 'label': 'العربية الفصحى (Modern Standard Arabic)'},
    {'code': 'en', 'label': 'English (الإنجليزية)'},
    {'code': 'auto', 'label': 'عربي / إنجليزي مختلط (Mixed Code-Switching)'},
  ];

  @override
  void initState() {
    super.initState();
    // Auto start transcription
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startTranscription();
    });
  }

  Future<void> _startTranscription() async {
    setState(() {
      _isProcessing = true;
      _currentStage = '1. جارٍ رفع ملف الصوت إلى السيرفر... / Uploading';
      _errorMessage = null;
    });

    try {
      AppLogger.info(tag, 'Starting transcription workflow for ${widget.audioFile.path}');

      // Stage 1 -> 2
      Future.delayed(const Duration(milliseconds: 1200), () {
        if (mounted && _isProcessing) {
          setState(() {
            _currentStage = '2. تشغيل نموذج Whisper Large V3 لاستخراج النص الأولي...';
          });
        }
      });

      // Stage 2 -> 3
      if (_applyQwenCorrection) {
        Future.delayed(const Duration(seconds: 4), () {
          if (mounted && _isProcessing) {
            setState(() {
              _currentStage = '3. تطبيق نموذج Qwen 2.5 للتدقيق اللغوي وتصحيح اللهجة المصرية...';
            });
          }
        });
      }

      final langParam = _selectedLanguage.startsWith('ar') ? 'ar' : _selectedLanguage;

      final result = await ApiClient.uploadAndTranscribeAudio(
        audioFile: widget.audioFile,
        applyQwenCorrection: _applyQwenCorrection,
        language: langParam,
      );

      AppLogger.info(tag, 'Workflow finished successfully', 'id: ${result.id}');
      if (mounted) {
        Navigator.pop(context, result);
      }
    } catch (e) {
      AppLogger.error(tag, 'Transcription workflow failed', e);
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('معالجة وتفريغ الصوت'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),

              // Processing card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    if (_isProcessing) ...[
                      const SizedBox(
                        width: 56,
                        height: 56,
                        child: CircularProgressIndicator(
                          strokeWidth: 3.5,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        _currentStage,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'يتم تشغيل نماذج Whisper Turbo و Qwen على خادم الاستضافة السحابي',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ] else if (_errorMessage != null) ...[
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 52),
                      const SizedBox(height: 16),
                      const Text(
                        'تعذر استكمال التفريغ الصوتي',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.redAccent),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 13, color: Colors.grey),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _startTranscription,
                        icon: const Icon(Icons.refresh),
                        label: const Text('إعادة المحاولة / Retry'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Configuration options
              const Text(
                'خيارات التفريغ / Configuration',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              const SizedBox(height: 12),

              // Language selector
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedLanguage,
                    isExpanded: true,
                    items: _languages.map((l) {
                      return DropdownMenuItem<String>(
                        value: l['code'],
                        child: Text(l['label']!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      );
                    }).toList(),
                    onChanged: _isProcessing ? null : (val) {
                      if (val != null) setState(() => _selectedLanguage = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Qwen correction toggle
              SwitchListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                title: const Text('تفعيل تصحيح Qwen 2.5 للهجة المصرية', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                subtitle: const Text('تصحيح الأخطاء الصوتية وتنظيم علامات الترقيم', style: TextStyle(fontSize: 12, color: Colors.grey)),
                value: _applyQwenCorrection,
                onChanged: _isProcessing ? null : (val) => setState(() => _applyQwenCorrection = val),
              ),

              const Spacer(),

              // Cancel button
              OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('إلغاء / Cancel'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
