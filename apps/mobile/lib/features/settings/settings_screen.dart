import 'package:flutter/material.dart';
import '../../core/config/app_config.dart';
import '../../core/logging/app_logger.dart';
import '../../core/network/api_client.dart';
import '../../shared/widgets/status_chip.dart';
import '../login/login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  static const String tag = 'SettingsScreen';

  late final TextEditingController _urlController;
  ConnectionStatus _connectionStatus = ConnectionStatus.disconnected;
  bool _isTesting = false;
  String? _testMessage;
  Map<String, dynamic>? _agentSettings;
  bool _isLoadingSettings = false;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: AppConfig.apiUrl);
    _testConnection();
    _loadAgentSettings();
  }

  Future<void> _loadAgentSettings() async {
    setState(() => _isLoadingSettings = true);
    final settings = await ApiClient.getAgentSettings();
    if (mounted) {
      setState(() {
        _agentSettings = settings;
        _isLoadingSettings = false;
      });
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTesting = true;
      _connectionStatus = ConnectionStatus.connecting;
      _testMessage = null;
    });

    try {
      final inputUrl = _urlController.text.trim();
      if (inputUrl.isNotEmpty) {
        await AppConfig.setApiUrl(inputUrl);
      }

      final res = await ApiClient.testConnection();
      if (mounted) {
        setState(() {
          _connectionStatus = res['status'] as ConnectionStatus;
          _testMessage = res['message'] as String?;
          _isTesting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _connectionStatus = ConnectionStatus.error;
          _testMessage = e.toString();
          _isTesting = false;
        });
      }
    }
  }

  Future<void> _saveUrl() async {
    final inputUrl = _urlController.text.trim();
    if (inputUrl.isEmpty) return;

    await AppConfig.setApiUrl(inputUrl);
    AppLogger.info(tag, 'Updated API Base URL to: ${AppConfig.apiUrl}');
    await _testConnection();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حفظ رابط السيرفر بنجاح! / Saved')),
      );
    }
  }

  Future<void> _resetDefaultUrl() async {
    await AppConfig.resetToDefault();
    _urlController.text = AppConfig.defaultApiUrl;
    await _testConnection();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تمت استعادة الرابط الافتراضي: http://34.41.238.202/api/V1')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('الإعدادات / Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Backend Server Configuration Card
            const Text(
              'إعدادات خادم الواجهة البرمجية / Backend Server',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('حالة الاتصال / Status:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      StatusChip(status: _connectionStatus, onTap: _testConnection),
                    ],
                  ),
                  if (_testMessage != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _testMessage!,
                      style: TextStyle(
                        fontSize: 12,
                        color: _connectionStatus == ConnectionStatus.connected ? Colors.green : Colors.redAccent,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  TextField(
                    controller: _urlController,
                    style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
                    decoration: const InputDecoration(
                      labelText: 'API Base URL',
                      hintText: 'http://34.41.238.202/api/V1',
                      prefixIcon: Icon(Icons.link),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _isTesting ? null : _saveUrl,
                          icon: const Icon(Icons.save_outlined),
                          label: const Text('حفظ الرابط'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton.icon(
                        onPressed: _isTesting ? null : _testConnection,
                        icon: _isTesting
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.wifi_tethering),
                        label: const Text('فحص الاتصال'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.teal,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: _resetDefaultUrl,
                    icon: const Icon(Icons.restore, size: 18),
                    label: const Text('استعادة الرابط الافتراضي (Default)'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // AI Models & Capabilities Info (Dynamically fetched from Backend Settings)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'إعدادات الذكاء الاصطناعي (من الخادم)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                IconButton(
                  icon: const Icon(Icons.refresh, size: 20),
                  tooltip: 'تحديث من الخادم',
                  onPressed: _loadAgentSettings,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.withOpacity(0.2)),
              ),
              child: _isLoadingSettings
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  : Column(
                      children: [
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.mic, color: Color(0xFF10B981)),
                          title: const Text('نموذج تحويل الصوت لنص (STT / Whisper)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          subtitle: Text(
                            'الموديل: ${_agentSettings?['stt_model'] ?? 'تلقائي من الخادم'}\nالمزود: backend database settings',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                        const Divider(),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.psychology, color: Color(0xFF8B5CF6)),
                          title: const Text('نموذج المحادثة الذكي (LLM Orchestrator)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          subtitle: Text(
                            'الموديل: ${_agentSettings?['chat_model'] ?? 'تلقائي من الخادم'}\nإدارة السياق واستخراج البيانات ديناميكياً',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                        const Divider(),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.record_voice_over, color: Color(0xFFF59E0B)),
                          title: const Text('التوليد الصوتي (TTS Voice)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          subtitle: Text(
                            'الصوت النشط: ${_agentSettings?['tts_voice'] ?? 'Aoede'}\nمهلة كشف الصمت (VAD): ${_agentSettings?['vad_silence_timeout_seconds'] ?? 1.8} ثانية',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
            ),
            const SizedBox(height: 32),

            // Logout Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await AppConfig.clearToken();
                  if (mounted) {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  }
                },
                icon: const Icon(Icons.logout, color: Colors.redAccent),
                label: const Text('تسجيل الخروج / Logout', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.redAccent),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
