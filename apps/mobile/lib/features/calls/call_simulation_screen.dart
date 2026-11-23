import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/audio/audio_player_service.dart';
import '../../core/audio/audio_recorder_service.dart';
import '../../core/config/app_config.dart';
import '../../core/logging/app_logger.dart';
import '../../core/network/api_client.dart';
import '../../shared/models/call_model.dart';
import 'call_details_screen.dart';

class ChatTurn {
  final bool isAssistant;
  final String text;
  final DateTime timestamp;
  final String? modelInfo;

  ChatTurn({
    required this.isAssistant,
    required this.text,
    required this.timestamp,
    this.modelInfo,
  });
}

class CallSimulationScreen extends StatefulWidget {
  final CallModel call;

  const CallSimulationScreen({Key? key, required this.call}) : super(key: key);

  @override
  State<CallSimulationScreen> createState() => _CallSimulationScreenState();
}

class _CallSimulationScreenState extends State<CallSimulationScreen> with SingleTickerProviderStateMixin {
  static const String tag = 'CallSimulationScreen';

  final AudioPlayerService _playerService = AudioPlayerService();
  final AudioRecorderService _recorderService = AudioRecorderService();
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  WebSocket? _ws;
  StreamSubscription? _wsSubscription;

  bool _isConnected = false;
  bool _isCallEnded = false;
  bool _isRecording = false;
  int _recordingSeconds = 0;
  StreamSubscription<Duration>? _recordDurationSub;
  bool _isAssistantSpeaking = false;

  int _callDurationSeconds = 0;
  Timer? _callTimer;
  final DateTime _callStartTime = DateTime.now();

  // AI & Model dynamic metadata from backend
  String _aiState = 'INITIAL_GREETING';
  String _sttModel = '';
  String _chatModel = '';
  String _ttsVoice = '';
  double _vadTimeout = 1.8;

  // Real-time Intelligence State
  String? _currentIntent;
  String _urgencyLevel = 'normal';
  Map<String, dynamic> _extractedInfo = {};
  List<String> _missingInfo = [];
  String? _callSummary;
  String? _nextAction;

  final List<ChatTurn> _conversation = [];
  late AnimationController _pulseController;

  final List<String> _quickResponses = [
    'اسمي أحمد محمود ورقمي مسجل عندكم',
    'حادث تصادم عربيتين وخناقة في الطريق',
    'العنوان عند مدخل الشروق التاني طريق السويس',
    'في إصابات خفيفة ومحتاجين إسعاف ودورية',
    'الحمد لله مفيش إصابات بس الطريق واقف',
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _initWebSocket();
  }

  @override
  void dispose() {
    _recordDurationSub?.cancel();
    _callTimer?.cancel();
    _wsSubscription?.cancel();
    _ws?.close();
    _playerService.stop();
    _pulseController.dispose();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _callTimer?.cancel();
    _callDurationSeconds = 0;
    _callTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (mounted) {
        setState(() => _callDurationSeconds++);
      }
    });
  }

  String _formatDuration(int totalSeconds) {
    final m = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _initWebSocket() async {
    final wsUrl = AppConfig.getWebSocketUrl(widget.call.id);
    AppLogger.info(tag, 'Connecting to call stream: $wsUrl');

    try {
      _ws = await WebSocket.connect(wsUrl).timeout(const Duration(seconds: 10));
      if (!mounted) return;

      setState(() => _isConnected = true);
      _startTimer();

      _wsSubscription = _ws!.listen(
        _onWebSocketMessage,
        onError: (err) {
          AppLogger.error(tag, 'WebSocket error', err);
          if (mounted) setState(() => _isConnected = false);
        },
        onDone: () {
          AppLogger.info(tag, 'WebSocket connection closed');
          if (mounted) {
            setState(() {
              _isConnected = false;
              _isCallEnded = true;
              _aiState = 'COMPLETED';
            });
            _callTimer?.cancel();
          }
        },
      );
    } catch (e) {
      AppLogger.error(tag, 'Failed to connect WebSocket', e);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل الاتصال بغرفة العمليات: $e')),
        );
      }
    }
  }

  void _onWebSocketMessage(dynamic message) async {
    try {
      final data = jsonDecode(message.toString()) as Map<String, dynamic>;
      final event = data['event'] as String? ?? '';

      if (event == 'connected') {
        AppLogger.info(tag, 'Server confirmed call connected with dynamic models');
        if (mounted) {
          setState(() {
            _sttModel = data['stt_model'] as String? ?? _sttModel;
            _chatModel = data['chat_model'] as String? ?? _chatModel;
            _ttsVoice = data['tts_voice'] as String? ?? _ttsVoice;
            if (data['vad_timeout'] != null) {
              _vadTimeout = (data['vad_timeout'] as num).toDouble();
            }
            _aiState = data['conversation_state'] as String? ?? 'INITIAL_GREETING';
          });
        }
      } else if (event == 'ai_state') {
        final state = data['state'] as String? ?? '';
        if (mounted && state.isNotEmpty) {
          setState(() => _aiState = state);
        }
      } else if (event == 'conversation_context_update') {
        if (mounted) {
          setState(() {
            if (data['intent'] != null) _currentIntent = data['intent'] as String;
            if (data['urgency_level'] != null) _urgencyLevel = data['urgency_level'] as String;
            if (data['conversation_state'] != null) _aiState = data['conversation_state'] as String;
            if (data['extracted_info'] != null) {
              _extractedInfo = Map<String, dynamic>.from(data['extracted_info'] as Map);
            }
            if (data['missing_info'] != null) {
              _missingInfo = List<String>.from(data['missing_info'] as List);
            }
            if (data['call_summary'] != null) _callSummary = data['call_summary'] as String;
            if (data['next_action'] != null) _nextAction = data['next_action'] as String;
          });
        }
      } else if (event == 'assistant_message') {
        final text = (data['text'] as String?)?.trim() ?? '';
        final audioB64 = data['audio_base64'] as String?;
        final state = data['conversation_state'] as String? ?? 'AI_SPEAKING';
        final model = data['chat_model'] as String? ?? _chatModel;

        if (text.isNotEmpty) {
          setState(() {
            _conversation.add(ChatTurn(
              isAssistant: true,
              text: text,
              timestamp: DateTime.now(),
              modelInfo: model,
            ));
            _isAssistantSpeaking = true;
            _aiState = state;
          });
          _scrollToBottom();
        }

        if (audioB64 != null && audioB64.isNotEmpty) {
          await _playerService.playBase64(audioB64);
        }

        if (mounted) {
          setState(() {
            _isAssistantSpeaking = false;
            if (!_isCallEnded) {
              _aiState = 'WAITING_FOR_CUSTOMER';
            }
          });
        }
      } else if (event == 'user_transcription') {
        final text = (data['text'] as String?)?.trim() ?? '';
        final model = data['stt_model'] as String? ?? _sttModel;
        if (text.isNotEmpty) {
          setState(() {
            _conversation.add(ChatTurn(
              isAssistant: false,
              text: text,
              timestamp: DateTime.now(),
              modelInfo: model,
            ));
            _aiState = 'PROCESSING';
          });
          _scrollToBottom();
        }
      } else if (event == 'call_ended') {
        _callTimer?.cancel();
        if (mounted) {
          setState(() {
            _isCallEnded = true;
            _isConnected = false;
            _aiState = 'COMPLETED';
          });
        }
      }
    } catch (e) {
      AppLogger.error(tag, 'Error parsing WS event', e);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage([String? textToSend]) {
    final text = (textToSend ?? _textController.text).trim();
    if (text.isEmpty || _ws == null) return;

    _textController.clear();
    setState(() {
      _conversation.add(ChatTurn(
        isAssistant: false,
        text: text,
        timestamp: DateTime.now(),
      ));
      _aiState = 'PROCESSING';
    });
    _scrollToBottom();

    final payload = jsonEncode({
      'event': 'user_message',
      'text': text,
    });
    _ws!.add(payload);
  }

  Future<void> _toggleAudioRecording() async {
    if (_isRecording) {
      // Stop recording and send audio
      _recordDurationSub?.cancel();
      setState(() {
        _isRecording = false;
        _aiState = 'PROCESSING';
      });
      try {
        final path = await _recorderService.stopRecording();
        if (path != null && File(path).existsSync()) {
          final bytes = await File(path).readAsBytes();
          AppLogger.info(tag, 'Recorded audio size: ${bytes.length} bytes at $path');
          if (bytes.isNotEmpty) {
            final b64 = base64Encode(bytes);
            final payload = jsonEncode({
              'event': 'user_audio',
              'audio_base64': b64,
              'format': 'wav',
            });
            _ws?.add(payload);
          }
        }
      } catch (e) {
        AppLogger.error(tag, 'Failed to stop and send recording', e);
      }
    } else {
      // Start recording
      try {
        await _recorderService.startRecording();
        _recordingSeconds = 0;
        _recordDurationSub?.cancel();
        _recordDurationSub = _recorderService.durationStream.listen((dur) {
          if (mounted) {
            setState(() => _recordingSeconds = dur.inSeconds);
            // Allow recording up to 60s
            if (dur.inSeconds >= 60 && _isRecording) {
              _toggleAudioRecording();
            }
          }
        });
        setState(() {
          _isRecording = true;
          _aiState = 'LISTENING';
        });
      } catch (e) {
        AppLogger.error(tag, 'Failed to start recording', e);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('خطأ في تشغيل الميكروفون: $e')),
          );
        }
      }
    }
  }

  Future<void> _endCall() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إنهاء المكالمة'),
        content: const Text('هل ترغب في إنهاء المكالمة وتسجيل البلاغ الحالي؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('استمرار')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('إنهاء المكالمة'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        if (_ws != null) {
          _ws!.add(jsonEncode({'event': 'end_call'}));
        }
        await ApiClient.endCall(widget.call.id);
      } catch (_) {}

      _callTimer?.cancel();
      if (mounted) {
        setState(() {
          _isCallEnded = true;
          _isConnected = false;
          _aiState = 'COMPLETED';
        });
      }
    }
  }

  /// AI Status Indicator according to Specification Table
  Widget _buildAIStatusIndicator(bool isDark) {
    IconData icon;
    Color color;
    String label;
    bool isAnimated = false;

    if (_isAssistantSpeaking || _aiState == 'AI_SPEAKING' || _aiState == 'RESPONDING') {
      icon = Icons.volume_up_rounded;
      color = const Color(0xFF10B981); // Green speaker
      label = 'المأمور يتحدث الآن (AI Speaking)...';
      isAnimated = true;
    } else if (_isRecording || _aiState == 'LISTENING') {
      icon = Icons.mic_rounded;
      color = Colors.redAccent; // Red microphone
      label = 'الميكروفون يستمع للمتصل (Listening)...';
      isAnimated = true;
    } else if (_aiState == 'UNDERSTANDING_INTENT') {
      icon = Icons.psychology_rounded;
      color = const Color(0xFF8B5CF6);
      label = 'فهم وتحديد نية البلاغ (Understanding Intent)...';
      isAnimated = true;
    } else if (_aiState == 'COLLECTING_INFORMATION') {
      icon = Icons.assignment_rounded;
      color = const Color(0xFF3B82F6);
      label = 'استخلاص تفاصيل البلاغ (Collecting Info)...';
      isAnimated = false;
    } else if (_aiState == 'PROCESSING') {
      icon = Icons.sync_rounded;
      color = const Color(0xFF0284C7);
      label = 'تحليل وتفكير الذكاء الاصطناعي (AI Thinking)...';
      isAnimated = true;
    } else if (_aiState == 'ESCALATION_REQUIRED') {
      icon = Icons.warning_amber_rounded;
      color = Colors.red;
      label = 'تصعيد طارئ لغرفة العمليات (Escalation Required)';
      isAnimated = false;
    } else if (_isCallEnded || _aiState == 'COMPLETED') {
      icon = Icons.check_circle_outline_rounded;
      color = Colors.grey;
      label = 'اكتملت المكالمة وتم تسجيل البلاغ (Completed)';
      isAnimated = false;
    } else {
      // WAITING_FOR_CUSTOMER / INITIAL_GREETING
      icon = Icons.hearing_rounded;
      color = const Color(0xFFEAB308);
      label = 'جاهز وفي انتظار رد المتصل (Waiting for Caller)';
      isAnimated = false;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.15 : 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isAnimated)
            AnimatedBuilder(
              animation: _pulseController,
              builder: (ctx, child) {
                final scale = 1.0 + (_pulseController.value * 0.22);
                return Transform.scale(
                  scale: scale,
                  child: Icon(icon, color: color, size: 18),
                );
              },
            )
          else
            Icon(icon, color: color, size: 18),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  /// Real-time Context & Intelligence Bar
  Widget _buildIntelligenceContextBar(bool isDark) {
    Color urgencyColor;
    String urgencyLabel;

    switch (_urgencyLevel.toLowerCase()) {
      case 'critical':
        urgencyColor = Colors.red;
        urgencyLabel = 'طوارئ قصوى (Critical)';
        break;
      case 'high':
        urgencyColor = Colors.orange;
        urgencyLabel = 'عاجل (High)';
        break;
      default:
        urgencyColor = Colors.teal;
        urgencyLabel = 'عادي (Normal)';
    }

    final hasEntities = _extractedInfo.isNotEmpty;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        border: Border(bottom: BorderSide(color: Colors.grey.withOpacity(0.18))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Intent & Urgency Badges
          Row(
            children: [
              // Intent Chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.emergency_outlined, size: 13, color: Color(0xFF2563EB)),
                    const SizedBox(width: 4),
                    Text(
                      _currentIntent != null ? 'البلاغ: $_currentIntent' : 'جارٍ تحديد نوع البلاغ...',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // Urgency Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: urgencyColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: urgencyColor.withOpacity(0.4)),
                ),
                child: Text(
                  urgencyLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: urgencyColor,
                  ),
                ),
              ),
              const Spacer(),

              // Active Backend Models Pill
              if (_chatModel.isNotEmpty || _sttModel.isNotEmpty)
                Tooltip(
                  message: 'STT: ${_sttModel.split("/").last}\nLLM: ${_chatModel.split("/").last}\nVAD: ${_vadTimeout}s\nVoice: $_ttsVoice\nNext Action: ${_nextAction ?? "continue"}',
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.purple.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.purple.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.settings_suggest, size: 12, color: Colors.purple),
                        const SizedBox(width: 4),
                        Text(
                          _chatModel.isNotEmpty ? _chatModel.split("/").last : 'AI Settings',
                          style: const TextStyle(fontSize: 10, color: Colors.purple, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),

          // Row 2: Extracted Facts & Missing Info Chips (Horizontally Scrollable)
          if (hasEntities || _missingInfo.isNotEmpty) ...[
            const SizedBox(height: 6),
            SizedBox(
              height: 26,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  ..._extractedInfo.entries.map((entry) {
                    final k = entry.key;
                    final v = entry.value?.toString() ?? '';
                    if (v.isEmpty || v.toLowerCase() == 'null') return const SizedBox.shrink();

                    String label = k;
                    if (k == 'caller_name') label = 'المتصل';
                    else if (k == 'caller_phone') label = 'الهاتف';
                    else if (k == 'incident_location') label = 'الموقع';
                    else if (k == 'incident_type') label = 'الحادث';
                    else if (k == 'injuries') label = 'إصابات';

                    return Container(
                      margin: const EdgeInsets.only(left: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.grey.withOpacity(0.25)),
                      ),
                      child: Text(
                        '$label: $v',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : Colors.black87,
                        ),
                      ),
                    );
                  }).toList(),
                  if (_missingInfo.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(left: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(isDark ? 0.2 : 0.1),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.amber.withOpacity(0.4)),
                      ),
                      child: Text(
                        'مطلوب استيفاء: ${_missingInfo.length}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: Colors.amber,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final timeFormat = DateFormat('HH:mm:ss');
    final startDateFormat = DateFormat('yyyy/MM/dd – HH:mm');

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            const Text(
              'طوارئ شرطة النجدة 122',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              _isCallEnded
                  ? 'المكالمة منتهية (${_formatDuration(_callDurationSeconds)})'
                  : (_isConnected ? 'متصل: ${_formatDuration(_callDurationSeconds)}' : 'جارٍ الاتصال...'),
              style: TextStyle(
                fontSize: 12,
                color: _isCallEnded
                    ? Colors.redAccent
                    : (_isConnected ? Colors.greenAccent : Colors.amberAccent),
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          if (!_isCallEnded)
            IconButton(
              icon: const Icon(Icons.call_end, color: Colors.red),
              tooltip: 'إنهاء المكالمة',
              onPressed: _endCall,
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Police Header & Caller Details Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                border: Border(bottom: BorderSide(color: Colors.grey.withOpacity(0.2))),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Badge Avatar with Speaking Animation
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (ctx, child) {
                          final scale = _isAssistantSpeaking ? 1.0 + (_pulseController.value * 0.15) : 1.0;
                          return Transform.scale(
                            scale: scale,
                            child: Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: _isAssistantSpeaking ? const Color(0xFFEAB308) : const Color(0xFF2563EB),
                                  width: 2.2,
                                ),
                              ),
                              child: ClipOval(
                                child: Image.asset('assets/images/logo.png', fit: BoxFit.cover),
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 12),

                      // Caller Info & Start Time
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (widget.call.customerName != null && widget.call.customerName!.isNotEmpty)
                                  ? widget.call.customerName!
                                  : 'المواطن المستغيث',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Text(
                              '${widget.call.fromNumber.isNotEmpty ? widget.call.fromNumber : "010XXXXXXXX"} • بدأ: ${startDateFormat.format(_callStartTime)}',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),

                      // Live / Offline Tag
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _isConnected ? Colors.green.withOpacity(0.15) : Colors.red.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _isConnected ? 'LIVE لايف' : 'منفصل',
                          style: TextStyle(
                            color: _isConnected ? Colors.green : Colors.red,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Prominent AI Status Indicator Bar
                  SizedBox(
                    width: double.infinity,
                    child: _buildAIStatusIndicator(isDark),
                  ),
                ],
              ),
            ),

            // Intelligence Context Bar (Intent, Urgency, Extracted Facts)
            _buildIntelligenceContextBar(isDark),

            // Live Conversation Turns
            Expanded(
              child: _conversation.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const CircularProgressIndicator(color: Color(0xFF2563EB)),
                          const SizedBox(height: 16),
                          const Text('جارٍ الربط مع مأمور عمليات النجدة 122...'),
                          const SizedBox(height: 8),
                          Text(
                            _chatModel.isNotEmpty ? 'إدارة المحادثة عبر: ${_chatModel.split("/").last}' : '',
                            style: const TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _conversation.length,
                      itemBuilder: (ctx, idx) {
                        final turn = _conversation[idx];
                        final isOfficer = turn.isAssistant;
                        return Align(
                          alignment: isOfficer ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.of(context).size.width * 0.84,
                            ),
                            decoration: BoxDecoration(
                              color: isOfficer
                                  ? (isDark ? const Color(0xFF1E3A8A) : const Color(0xFFDBEAFE))
                                  : (isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
                              borderRadius: BorderRadius.circular(16).copyWith(
                                bottomRight: isOfficer ? const Radius.circular(0) : null,
                                bottomLeft: !isOfficer ? const Radius.circular(0) : null,
                              ),
                              border: Border.all(
                                color: isOfficer
                                    ? const Color(0xFF2563EB).withOpacity(0.3)
                                    : Colors.grey.withOpacity(0.2),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      isOfficer ? Icons.local_police_rounded : Icons.person_rounded,
                                      size: 14,
                                      color: isOfficer ? const Color(0xFF2563EB) : Colors.grey,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      isOfficer ? 'مأمور النجدة 122' : 'المتصل (أنت)',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: isOfficer ? const Color(0xFF2563EB) : Colors.grey,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      timeFormat.format(turn.timestamp),
                                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 5),
                                Text(
                                  turn.text,
                                  style: const TextStyle(fontSize: 14, height: 1.45),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),

            // Call Ended Summary Banner
            if (_isCallEnded)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F172A) : Colors.white,
                  border: Border(top: BorderSide(color: Colors.grey.withOpacity(0.2))),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, -4)),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          _callSummary != null && _callSummary!.isNotEmpty
                              ? 'ملخص البلاغ: $_callSummary'
                              : 'تم إنهاء المكالمة وتسجيل البلاغ بالكامل',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) => CallDetailsScreen(callId: widget.call.id),
                          ),
                        );
                      },
                      icon: const Icon(Icons.description_outlined),
                      label: const Text('عرض التفريغ والتقرير الكامل للبلاغ'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              )
            else
              // Input Controls
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  border: Border(top: BorderSide(color: Colors.grey.withOpacity(0.2))),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Quick Responses Bar
                    SizedBox(
                      height: 34,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _quickResponses.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (ctx, i) {
                          final q = _quickResponses[i];
                          return ActionChip(
                            label: Text(q, style: const TextStyle(fontSize: 11)),
                            onPressed: () => _sendMessage(q),
                            backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Active Voice Recording Indicator Banner
                    if (_isRecording)
                      Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red.withOpacity(0.4)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.fiber_manual_record, color: Colors.red, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'جارٍ تسجيل صوتك (${_recordingSeconds} / 60 ث)... تحدث بوضوح',
                                style: const TextStyle(
                                  color: Colors.red,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: _toggleAudioRecording,
                              icon: const Icon(Icons.stop, size: 16),
                              label: const Text('إرسال الصوت'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Text Input + Mic + Send Button
                    Row(
                      children: [
                        // Audio Recording Button
                        IconButton(
                          icon: Icon(
                            _isRecording ? Icons.stop_circle : Icons.mic,
                            color: _isRecording ? Colors.red : const Color(0xFF2563EB),
                            size: 28,
                          ),
                          tooltip: _isRecording ? 'إيقاف وإرسال التسجيل' : 'تحدث صوتياً',
                          onPressed: _toggleAudioRecording,
                        ),

                        // Text Field
                        Expanded(
                          child: TextField(
                            controller: _textController,
                            decoration: InputDecoration(
                              hintText: _isRecording ? 'جارٍ تسجيل صوتك...' : 'تحدث أو اكتب ردك هنا...',
                              hintStyle: const TextStyle(fontSize: 13),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: BorderSide(color: Colors.grey.withOpacity(0.3)),
                              ),
                              filled: true,
                              fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                            ),
                            onSubmitted: (_) => _sendMessage(),
                          ),
                        ),
                        const SizedBox(width: 6),

                        // Send Button
                        IconButton(
                          icon: const Icon(Icons.send_rounded, color: Color(0xFF2563EB)),
                          tooltip: 'إرسال',
                          onPressed: () => _sendMessage(),
                        ),
                      ],
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
