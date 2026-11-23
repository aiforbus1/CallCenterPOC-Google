import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/network/api_client.dart';
import '../../shared/models/call_model.dart';

class CallDetailsScreen extends StatefulWidget {
  final String callId;

  const CallDetailsScreen({Key? key, required this.callId}) : super(key: key);

  @override
  State<CallDetailsScreen> createState() => _CallDetailsScreenState();
}

class _CallDetailsScreenState extends State<CallDetailsScreen> {
  bool _loading = true;
  CallModel? _call;
  CallTranscriptModel? _transcript;
  CallExtractionModel? _extraction;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCallData();
  }

  Future<void> _loadCallData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final calls = await ApiClient.getCalls(page: 1, pageSize: 100);
      _call = calls.firstWhere((c) => c.id == widget.callId, orElse: () => calls.first);
      _transcript = await ApiClient.getCallTranscript(widget.callId);
      _extraction = await ApiClient.getCallExtraction(widget.callId);

      if (mounted) {
        setState(() => _loading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  String _formatDuration(int sec) {
    final m = sec ~/ 60;
    final s = sec % 60;
    if (m > 0) {
      return '$m دقيقة و $s ثانية';
    }
    return '$s ثانية';
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.year}/${dt.month.toString().padLeft(2, '0')}/${dt.day.toString().padLeft(2, '0')} - ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  List<Map<String, String>> _parseTranscriptLines(String raw) {
    if (raw.trim().isEmpty) return [];
    final lines = raw.split('\n');
    final result = <Map<String, String>>[];

    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) continue;

      if (trimmed.startsWith('AI Assistant:') || trimmed.startsWith('Assistant:') || trimmed.startsWith('المأمور:') || trimmed.startsWith('شرطة النجدة:')) {
        final content = trimmed.replaceFirst(RegExp(r'^(AI Assistant|Assistant|المأمور|شرطة النجدة):\s*'), '');
        result.add({'speaker': 'مأمور النجدة 122', 'text': content, 'is_officer': 'true'});
      } else if (trimmed.startsWith('Caller:') || trimmed.startsWith('User:') || trimmed.startsWith('المتصل:')) {
        final content = trimmed.replaceFirst(RegExp(r'^(Caller|User|المتصل):\s*'), '');
        result.add({'speaker': 'المتصل', 'text': content, 'is_officer': 'false'});
      } else {
        result.add({'speaker': 'سجل', 'text': trimmed, 'is_officer': 'true'});
      }
    }

    return result;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل البلاغ والتفريغ الكامل', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          if (_transcript != null && _transcript!.transcriptText.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.copy_rounded),
              tooltip: 'نسخ التفريغ',
              onPressed: () {
                Clipboard.setData(ClipboardData(text: _transcript!.transcriptText));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('تم نسخ التفريغ النصي بنجاح')),
                );
              },
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('خطأ: $_error', style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _loadCallData, child: const Text('إعادة المحاولة')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadCallData,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Call Header Info Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: isDark
                                  ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                                  : [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.3)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF2563EB),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.phone_in_talk, color: Colors.white, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _call?.fromNumber.isNotEmpty == true ? _call!.fromNumber : '+201234567890',
                                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                        ),
                                        Text(
                                          _call != null ? _formatDateTime(_call!.createdAt) : '',
                                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.green.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _call?.status == 'completed' ? 'تم الانتهاء' : 'جارٍ',
                                      style: const TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 24),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  _infoColumn('مدة المكالمة', _formatDuration(_call?.durationSeconds ?? 0)),
                                  _infoColumn('نوع المكالمة', _call?.direction == 'inbound' ? 'وارد (طوارئ 122)' : 'صادر'),
                                  _infoColumn('النمط', 'محاكاة ذكية'),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),

                        // AI Summary Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.auto_awesome, color: Color(0xFF10B981), size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'ملخص البلاغ والواقعة بالذكاء الاصطناعي',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _call?.aiSummary?.isNotEmpty == true
                                    ? _call!.aiSummary!
                                    : (_extraction?.summary?.isNotEmpty == true
                                        ? _extraction!.summary!
                                        : 'تم استلام المكالمة وتسجيل البلاغ. جارٍ استخراج تفاصيل الواقعة.'),
                                style: const TextStyle(fontSize: 13, height: 1.5),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Extracted Incident Details
                        if (_extraction != null)
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.assignment_turned_in_outlined, color: Color(0xFF8B5CF6), size: 20),
                                    SizedBox(width: 8),
                                    Text(
                                      'البيانات القانونية والميدانية المستخرجة',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                _detailRow('اسم المبلغ', _extraction?.customerName ?? 'مواطن'),
                                _detailRow('رقم التواصل', _extraction?.callbackNumber ?? _call?.fromNumber ?? '-'),
                                _detailRow('طبيعة البلاغ', _extraction?.intent ?? 'استغاثة طارئة'),
                                _detailRow('مستوى الأولوية', _extraction?.priority == 'urgent' ? 'عاجل جداً' : 'عادي', isHighlighted: _extraction?.priority == 'urgent'),
                                if (_extraction?.assignedDepartment != null)
                                  _detailRow('الجهة المختصة', _extraction!.assignedDepartment!),
                              ],
                            ),
                          ),
                        const SizedBox(height: 18),

                        // Full Transcript Section
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.withOpacity(0.2)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.record_voice_over, color: Color(0xFF2563EB), size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'التفريغ الصوتي والنصي للمحادثة بالكامل',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              if (_transcript == null || _transcript!.transcriptText.trim().isEmpty)
                                const Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Text('لا يوجد تفريغ محفوظ لهذه المكالمة'),
                                  ),
                                )
                              else
                                ..._parseTranscriptLines(_transcript!.transcriptText).map((item) {
                                  final isOfficer = item['is_officer'] == 'true';
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 10),
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: isOfficer
                                          ? (isDark ? const Color(0xFF1E3A8A).withOpacity(0.6) : const Color(0xFFEFF6FF))
                                          : (isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isOfficer ? const Color(0xFF2563EB).withOpacity(0.3) : Colors.grey.withOpacity(0.2),
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item['speaker']!,
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: isOfficer ? const Color(0xFF2563EB) : Colors.grey,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          item['text']!,
                                          style: const TextStyle(fontSize: 13, height: 1.4),
                                        ),
                                      ],
                                    ),
                                  );
                                }),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _infoColumn(String title, String value) {
    return Column(
      children: [
        Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _detailRow(String label, String value, {bool isHighlighted = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isHighlighted ? Colors.redAccent : null,
            ),
          ),
        ],
      ),
    );
  }
}
