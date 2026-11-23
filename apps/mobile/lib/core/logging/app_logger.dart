import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';

enum LogLevel { info, warning, error, debug }

class LogEntry {
  final DateTime timestamp;
  final LogLevel level;
  final String tag;
  final String message;
  final String? details;

  LogEntry({
    required this.timestamp,
    required this.level,
    required this.tag,
    required this.message,
    this.details,
  });

  String get formattedTime => DateFormat('HH:mm:ss.SSS').format(timestamp);

  String get levelLabel {
    switch (level) {
      case LogLevel.info:
        return 'INFO';
      case LogLevel.warning:
        return 'WARN';
      case LogLevel.error:
        return 'ERROR';
      case LogLevel.debug:
        return 'DEBUG';
    }
  }

  @override
  String toString() {
    final buffer = StringBuffer('[$formattedTime] [$levelLabel] [$tag] $message');
    if (details != null && details!.isNotEmpty) {
      buffer.write(' - $details');
    }
    return buffer.toString();
  }
}

class AppLogger {
  static final List<LogEntry> _logs = [];
  static const int maxLogs = 500;
  static final ValueNotifier<int> logNotifier = ValueNotifier<int>(0);

  static List<LogEntry> get logs => List.unmodifiable(_logs);

  static void info(String tag, String message, [String? details]) {
    _add(LogLevel.info, tag, message, details);
  }

  static void warning(String tag, String message, [String? details]) {
    _add(LogLevel.warning, tag, message, details);
  }

  static void error(String tag, String message, [dynamic error, StackTrace? stackTrace]) {
    final details = error != null ? '$error' : null;
    _add(LogLevel.error, tag, message, details);
  }

  static void debug(String tag, String message, [String? details]) {
    _add(LogLevel.debug, tag, message, details);
  }

  static void _add(LogLevel level, String tag, String message, String? details) {
    // Sanitize any sensitive patterns if inadvertently present
    final cleanMsg = _sanitize(message);
    final cleanDetails = details != null ? _sanitize(details) : null;

    final entry = LogEntry(
      timestamp: DateTime.now(),
      level: level,
      tag: tag,
      message: cleanMsg,
      details: cleanDetails,
    );

    _logs.add(entry);
    if (_logs.length > maxLogs) {
      _logs.removeAt(0);
    }
    logNotifier.value = _logs.length;

    debugPrint(entry.toString());
  }

  static String _sanitize(String text) {
    return text
        .replaceAll(RegExp(r'(Bearer\s+)[A-Za-z0-9\-_.]+'), r'$1[REDACTED_TOKEN]')
        .replaceAll(RegExp(r'("password"\s*:\s*")[^"]+(")'), r'$1[REDACTED]$2')
        .replaceAll(RegExp(r'(password=)[^&]+'), r'$1[REDACTED]');
  }

  static void clear() {
    _logs.clear();
    logNotifier.value = 0;
  }

  static String exportAsText() {
    return _logs.map((e) => e.toString()).join('\n');
  }
}
