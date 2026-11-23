class TranscriptionItem {
  final String id;
  final String callId;
  final String originalTranscript;
  final String correctedTranscript;
  final String language;
  final double durationSeconds;
  final String? whisperModel;
  final String? qwenModel;
  final bool qwenApplied;
  final DateTime createdAt;
  final String? localAudioPath;

  TranscriptionItem({
    required this.id,
    required this.callId,
    required this.originalTranscript,
    required this.correctedTranscript,
    this.language = 'ar',
    this.durationSeconds = 0.0,
    this.whisperModel,
    this.qwenModel,
    this.qwenApplied = false,
    required this.createdAt,
    this.localAudioPath,
  });

  factory TranscriptionItem.fromJson(Map<String, dynamic> json, {String? localAudioPath}) {
    return TranscriptionItem(
      id: json['id'] ?? '',
      callId: json['call_id'] ?? '',
      originalTranscript: json['original_transcript'] ?? json['transcript_text'] ?? '',
      correctedTranscript: json['corrected_transcript'] ?? json['original_transcript'] ?? json['transcript_text'] ?? '',
      language: json['language'] ?? 'ar',
      durationSeconds: (json['duration_seconds'] as num?)?.toDouble() ?? 0.0,
      whisperModel: json['whisper_model'],
      qwenModel: json['qwen_model'],
      qwenApplied: json['qwen_applied'] == true,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) ?? DateTime.now() : DateTime.now(),
      localAudioPath: localAudioPath,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'call_id': callId,
      'original_transcript': originalTranscript,
      'corrected_transcript': correctedTranscript,
      'language': language,
      'duration_seconds': durationSeconds,
      'whisper_model': whisperModel,
      'qwen_model': qwenModel,
      'qwen_applied': qwenApplied,
      'created_at': createdAt.toIso8601String(),
      'local_audio_path': localAudioPath,
    };
  }

  TranscriptionItem copyWith({
    String? originalTranscript,
    String? correctedTranscript,
  }) {
    return TranscriptionItem(
      id: id,
      callId: callId,
      originalTranscript: originalTranscript ?? this.originalTranscript,
      correctedTranscript: correctedTranscript ?? this.correctedTranscript,
      language: language,
      durationSeconds: durationSeconds,
      whisperModel: whisperModel,
      qwenModel: qwenModel,
      qwenApplied: qwenApplied,
      createdAt: createdAt,
      localAudioPath: localAudioPath,
    );
  }
}
