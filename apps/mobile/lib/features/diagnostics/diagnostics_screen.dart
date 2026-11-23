import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/logging/app_logger.dart';

class DiagnosticsScreen extends StatefulWidget {
  const DiagnosticsScreen({Key? key}) : super(key: key);

  @override
  State<DiagnosticsScreen> createState() => _DiagnosticsScreenState();
}

class _DiagnosticsScreenState extends State<DiagnosticsScreen> {
  LogLevel? _selectedFilter;

  void _copyLogs() {
    final text = AppLogger.exportAsText();
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم نسخ السجلات إلى الحافظة / Logs copied')),
    );
  }

  void _shareLogs() async {
    final text = AppLogger.exportAsText();
    await Share.share(text, subject: 'AI Transcription App Logs');
  }

  void _clearLogs() {
    setState(() {
      AppLogger.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return ValueListenableBuilder<int>(
      valueListenable: AppLogger.logNotifier,
      builder: (context, count, _) {
        final logs = AppLogger.logs.where((l) {
          if (_selectedFilter == null) return true;
          return l.level == _selectedFilter;
        }).toList().reversed.toList();

        return Scaffold(
          appBar: AppBar(
            title: const Text('سجلات التشخيص / Diagnostics'),
            actions: [
              IconButton(
                icon: const Icon(Icons.copy),
                tooltip: 'Copy All',
                onPressed: _copyLogs,
              ),
              IconButton(
                icon: const Icon(Icons.share),
                tooltip: 'Share Logs',
                onPressed: _shareLogs,
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline),
                tooltip: 'Clear',
                onPressed: _clearLogs,
              ),
            ],
          ),
          body: Column(
            children: [
              // Filter Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    FilterChip(
                      label: Text('All (${AppLogger.logs.length})'),
                      selected: _selectedFilter == null,
                      onSelected: (_) => setState(() => _selectedFilter = null),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('Info'),
                      selected: _selectedFilter == LogLevel.info,
                      onSelected: (_) => setState(() => _selectedFilter = LogLevel.info),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('Warning'),
                      selected: _selectedFilter == LogLevel.warning,
                      onSelected: (_) => setState(() => _selectedFilter = LogLevel.warning),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('Error'),
                      selected: _selectedFilter == LogLevel.error,
                      onSelected: (_) => setState(() => _selectedFilter = LogLevel.error),
                    ),
                  ],
                ),
              ),

              // Log Entries List
              Expanded(
                child: logs.isEmpty
                    ? Center(
                        child: Text(
                          'لا توجد سجلات مسجلة حالياً',
                          style: TextStyle(color: Colors.grey.shade400),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: logs.length,
                        itemBuilder: (context, index) {
                          final log = logs[index];
                          Color levelColor;
                          switch (log.level) {
                            case LogLevel.error:
                              levelColor = Colors.redAccent;
                              break;
                            case LogLevel.warning:
                              levelColor = Colors.amber;
                              break;
                            case LogLevel.info:
                            default:
                              levelColor = const Color(0xFF3B82F6);
                              break;
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: levelColor.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        log.levelLabel,
                                        style: TextStyle(
                                          color: levelColor,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      log.tag,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                    const Spacer(),
                                    Text(
                                      log.formattedTime,
                                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                SelectableText(
                                  log.message,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    color: isDark ? Colors.white70 : Colors.black87,
                                  ),
                                ),
                                if (log.details != null) ...[
                                  const SizedBox(height: 4),
                                  SelectableText(
                                    log.details!,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontFamily: 'monospace',
                                      color: levelColor.withOpacity(0.8),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
