class CallModel {
  final String id;
  final String? customerId;
  final String? customerName;
  final String direction; // inbound, outbound
  final String callMode; // simulated, mobile, real
  final String status; // completed, in_progress, ringing, failed
  final String fromNumber;
  final String toNumber;
  final DateTime? startedAt;
  final DateTime? answeredAt;
  final DateTime? endedAt;
  final int durationSeconds;
  final String language;
  final String? aiSummary;
  final String processingStatus;
  final DateTime createdAt;

  CallModel({
    required this.id,
    this.customerId,
    this.customerName,
    this.direction = 'inbound',
    this.callMode = 'simulated',
    this.status = 'completed',
    this.fromNumber = '',
    this.toNumber = '',
    this.startedAt,
    this.answeredAt,
    this.endedAt,
    this.durationSeconds = 0,
    this.language = 'ar-EG',
    this.aiSummary,
    this.processingStatus = 'completed',
    required this.createdAt,
  });

  factory CallModel.fromJson(Map<String, dynamic> json) {
    return CallModel(
      id: json['id'] ?? '',
      customerId: json['customer_id'],
      customerName: json['customer_name'],
      direction: json['direction'] ?? 'inbound',
      callMode: json['call_mode'] ?? 'simulated',
      status: json['status'] ?? 'completed',
      fromNumber: json['from_number'] ?? '',
      toNumber: json['to_number'] ?? '',
      startedAt: json['started_at'] != null ? DateTime.tryParse(json['started_at']) : null,
      answeredAt: json['answered_at'] != null ? DateTime.tryParse(json['answered_at']) : null,
      endedAt: json['ended_at'] != null ? DateTime.tryParse(json['ended_at']) : null,
      durationSeconds: (json['duration_seconds'] as num?)?.toInt() ?? 0,
      language: json['language'] ?? 'ar-EG',
      aiSummary: json['ai_summary'],
      processingStatus: json['processing_status'] ?? 'completed',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) ?? DateTime.now() : DateTime.now(),
    );
  }
}

class CallTranscriptModel {
  final String id;
  final String callId;
  final String transcriptText;
  final String language;
  final DateTime createdAt;

  CallTranscriptModel({
    required this.id,
    required this.callId,
    required this.transcriptText,
    this.language = 'ar-EG',
    required this.createdAt,
  });

  factory CallTranscriptModel.fromJson(Map<String, dynamic> json) {
    return CallTranscriptModel(
      id: json['id'] ?? '',
      callId: json['call_id'] ?? '',
      transcriptText: json['transcript_text'] ?? '',
      language: json['language'] ?? 'ar-EG',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) ?? DateTime.now() : DateTime.now(),
    );
  }
}

class CallExtractionModel {
  final String id;
  final String callId;
  final String? customerName;
  final String? callbackNumber;
  final String? intent;
  final String? summary;
  final String priority;
  final String? assignedDepartment;
  final Map<String, dynamic>? extractedJson;

  CallExtractionModel({
    required this.id,
    required this.callId,
    this.customerName,
    this.callbackNumber,
    this.intent,
    this.summary,
    this.priority = 'normal',
    this.assignedDepartment,
    this.extractedJson,
  });

  factory CallExtractionModel.fromJson(Map<String, dynamic> json) {
    return CallExtractionModel(
      id: json['id'] ?? '',
      callId: json['call_id'] ?? '',
      customerName: json['customer_name'],
      callbackNumber: json['callback_number'],
      intent: json['intent'],
      summary: json['summary'],
      priority: json['priority'] ?? 'normal',
      assignedDepartment: json['assigned_department'],
      extractedJson: json['extracted_json'] is Map<String, dynamic> ? json['extracted_json'] : null,
    );
  }
}
