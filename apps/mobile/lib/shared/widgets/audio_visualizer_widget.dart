import 'dart:math';
import 'package:flutter/material.dart';

class AudioVisualizerWidget extends StatelessWidget {
  final double amplitude; // 0.0 to 1.0
  final bool isRecording;
  final int barCount;

  const AudioVisualizerWidget({
    Key? key,
    required this.amplitude,
    this.isRecording = false,
    this.barCount = 28,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final random = Random(42);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: List.generate(barCount, (index) {
          // Calculate dynamic height based on normalized amplitude and index wave
          final distFromCenter = (index - barCount / 2).abs() / (barCount / 2);
          final waveFactor = (1.0 - distFromCenter * 0.6);
          final jitter = isRecording ? (random.nextDouble() * 0.4 + 0.6) : 0.1;
          final heightPercent = isRecording 
              ? (amplitude * waveFactor * jitter).clamp(0.08, 1.0)
              : 0.08;

          final height = 10.0 + (heightPercent * 50.0);
          final color = isRecording
              ? (index % 2 == 0 ? const Color(0xFF2563EB) : const Color(0xFF8B5CF6))
              : (isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1));

          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 1.5),
              height: height,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          );
        }),
      ),
    );
  }
}
