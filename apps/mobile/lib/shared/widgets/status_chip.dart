import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';

class StatusChip extends StatelessWidget {
  final ConnectionStatus status;
  final String? customLabel;
  final VoidCallback? onTap;

  const StatusChip({
    Key? key,
    required this.status,
    this.customLabel,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Color dot;
    String text;

    switch (status) {
      case ConnectionStatus.connected:
        bg = const Color(0xFFECFDF5);
        fg = const Color(0xFF065F46);
        dot = const Color(0xFF10B981);
        text = customLabel ?? 'Connected';
        break;
      case ConnectionStatus.connecting:
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF1E40AF);
        dot = const Color(0xFF3B82F6);
        text = customLabel ?? 'Connecting...';
        break;
      case ConnectionStatus.error:
        bg = const Color(0xFFFEF2F2);
        fg = const Color(0xFF991B1B);
        dot = const Color(0xFFEF4444);
        text = customLabel ?? 'Server Error';
        break;
      case ConnectionStatus.disconnected:
        bg = const Color(0xFFF1F5F9);
        fg = const Color(0xFF475569);
        dot = const Color(0xFF94A3B8);
        text = customLabel ?? 'Disconnected';
        break;
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (isDark) {
      bg = dot.withOpacity(0.18);
      fg = dot;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: dot.withOpacity(0.4)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: dot,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              text,
              style: TextStyle(
                color: fg,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
