import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';
import '../config/app_config.dart';
import '../logging/app_logger.dart';
import '../../shared/models/transcription_item.dart';
import '../../shared/models/call_model.dart';

enum ConnectionStatus { connected, disconnected, connecting, error }

class ApiClient {
  static const String tag = 'ApiClient';

  static http.Client _createClient() {
    final ioClient = HttpClient()
      ..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
    return IOClient(ioClient);
  }

  /// Builds a full URI ensuring no duplicate `/api/v1` or `/api/V1` prefixes.
  static Uri buildUri(String endpoint) {
    var base = AppConfig.normalizeUrl(AppConfig.apiUrl);
    while (base.endsWith('/')) {
      base = base.substring(0, base.length - 1);
    }

    var cleanEndpoint = endpoint.trim();
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = '/$cleanEndpoint';
    }

    // Check if cleanEndpoint starts with /api/v1 or /v1 to avoid duplicate prefix
    final lowerEndpoint = cleanEndpoint.toLowerCase();
    if (lowerEndpoint.startsWith('/api/v1')) {
      cleanEndpoint = cleanEndpoint.substring(7);
    } else if (lowerEndpoint.startsWith('/v1')) {
      cleanEndpoint = cleanEndpoint.substring(3);
    }

    return Uri.parse('$base$cleanEndpoint');
  }

  static Future<Map<String, String>> _getHeaders({bool isJson = true}) async {
    final headers = <String, String>{};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    final token = await AppConfig.getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Tests connection to the backend and checks health.
  static Future<Map<String, dynamic>> testConnection() async {
    final client = _createClient();
    try {
      final uri = buildUri('/health');
      AppLogger.info(tag, 'Testing connection to $uri');

      final response = await client
          .get(uri, headers: {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final body = jsonDecode(utf8.decode(response.bodyBytes));
        AppLogger.info(tag, 'Connection test successful', 'status: 200');
        return {
          'status': ConnectionStatus.connected,
          'message': 'Connected to backend successfully',
          'data': body,
        };
      } else {
        AppLogger.warning(tag, 'Health check returned non-200', 'code: ${response.statusCode}');
        return {
          'status': ConnectionStatus.error,
          'message': 'Server responded with status ${response.statusCode}',
        };
      }
    } catch (e) {
      AppLogger.error(tag, 'Connection test failed', e);
      return {
        'status': ConnectionStatus.disconnected,
        'message': e.toString().replaceAll('Exception: ', ''),
      };
    } finally {
      client.close();
    }
  }

  /// Fetches active model statuses configured in the backend.
  static Future<Map<String, dynamic>> getModelsStatus() async {
    final client = _createClient();
    try {
      final uri = buildUri('/transcriptions/models/status');
      AppLogger.info(tag, 'Fetching models status from $uri');

      final response = await client
          .get(uri, headers: await _getHeaders())
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes));
      }
      return {
        'backend_status': 'connected',
        'whisper': {'model': 'Backend Configured STT', 'status': 'ready'},
        'llm': {'model': 'Backend Configured LLM', 'status': 'ready'},
      };
    } catch (e) {
      AppLogger.warning(tag, 'Failed to fetch models status: $e');
      return {
        'backend_status': 'disconnected',
        'whisper': {'model': 'STT Service', 'status': 'offline'},
        'llm': {'model': 'LLM Service', 'status': 'offline'},
      };
    } finally {
      client.close();
    }
  }

  /// Fetches dynamic Agent & AI settings from the backend Settings table
  static Future<Map<String, dynamic>?> getAgentSettings() async {
    final client = _createClient();
    try {
      final uri = buildUri('/settings/agent');
      final response = await client
          .get(uri, headers: await _getHeaders())
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      AppLogger.warning(tag, 'Failed to fetch agent settings: $e');
      return null;
    } finally {
      client.close();
    }
  }

  /// Login with email and password.
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final client = _createClient();
    try {
      final uri = buildUri('/auth/login');
      AppLogger.info(tag, 'Attempting login for user: $email');

      final response = await client.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 15));

      final body = jsonDecode(utf8.decode(response.bodyBytes));
      if (response.statusCode == 200) {
        final token = body['access_token'];
        if (token != null) {
          await AppConfig.saveToken(token);
          await AppConfig.saveUserEmail(email);
        }
        AppLogger.info(tag, 'Login successful for user: $email');
        return body;
      } else {
        final err = body['detail'] ?? 'Login failed';
        AppLogger.warning(tag, 'Login failed', err.toString());
        throw Exception(err.toString());
      }
    } catch (e) {
      AppLogger.error(tag, 'Login exception', e);
      rethrow;
    } finally {
      client.close();
    }
  }

  /// Uploads audio file for Whisper transcription and optional Qwen dialect correction.
  static Future<TranscriptionItem> uploadAndTranscribeAudio({
    required File audioFile,
    bool applyQwenCorrection = true,
    String language = 'ar',
    void Function(double progress)? onProgress,
  }) async {
    final uri = buildUri('/transcriptions/upload');
    AppLogger.info(tag, 'Uploading audio file for transcription: ${audioFile.path} (applyQwen: $applyQwenCorrection, lang: $language)');

    final request = http.MultipartRequest('POST', uri);

    final token = await AppConfig.getToken();
    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    request.fields['apply_qwen_correction'] = applyQwenCorrection ? 'true' : 'false';
    request.fields['language'] = language;

    final stream = http.ByteStream(audioFile.openRead());
    final length = await audioFile.length();
    final filename = audioFile.path.split(Platform.pathSeparator).last;

    final multipartFile = http.MultipartFile(
      'file',
      stream,
      length,
      filename: filename,
    );
    request.files.add(multipartFile);

    AppLogger.info(tag, 'Sending multipart request ($length bytes)');
    final streamedResponse = await request.send().timeout(const Duration(seconds: 90));
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      AppLogger.info(tag, 'Transcription completed successfully', 'call_id: ${data['call_id']}');
      return TranscriptionItem.fromJson(data, localAudioPath: audioFile.path);
    } else {
      AppLogger.error(tag, 'Transcription failed with status ${response.statusCode}', response.body);
      throw Exception('Transcription failed (${response.statusCode}): ${utf8.decode(response.bodyBytes)}');
    }
  }

  /// Lists past transcriptions.
  static Future<List<TranscriptionItem>> getTranscriptions({int page = 1, String? search}) async {
    final client = _createClient();
    try {
      var query = 'page=$page&page_size=30';
      if (search != null && search.trim().isNotEmpty) {
        query += '&search=${Uri.encodeComponent(search.trim())}';
      }
      final uri = buildUri('/transcriptions?$query');
      AppLogger.info(tag, 'Fetching transcriptions from $uri');

      final response = await client
          .get(uri, headers: await _getHeaders())
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        final items = data['items'] as List? ?? [];
        return items.map((e) => TranscriptionItem.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      AppLogger.error(tag, 'Failed to fetch transcriptions', e);
      return [];
    } finally {
      client.close();
    }
  }

  /// Updates a transcription's text.
  static Future<bool> updateTranscription(String id, String updatedText) async {
    final client = _createClient();
    try {
      final uri = buildUri('/transcriptions/$id');
      AppLogger.info(tag, 'Updating transcription $id');

      final response = await client.patch(
        uri,
        headers: await _getHeaders(),
        body: jsonEncode({'corrected_transcript': updatedText}),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      AppLogger.error(tag, 'Failed to update transcription', e);
      return false;
    } finally {
      client.close();
    }
  }

  /// Get list of calls from /calls
  static Future<List<CallModel>> getCalls({int page = 1, int pageSize = 50}) async {
    final client = _createClient();
    try {
      final uri = buildUri('/calls?page=$page&page_size=$pageSize');
      final res = await client.get(uri, headers: await _getHeaders()).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final body = jsonDecode(utf8.decode(res.bodyBytes));
        final items = (body['items'] as List<dynamic>?) ?? [];
        return items.map((i) => CallModel.fromJson(i as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      AppLogger.error(tag, 'Failed to fetch calls', e);
      return [];
    } finally {
      client.close();
    }
  }

  /// Start a simulated call to 122
  static Future<CallModel> createSimulatedCall({
    String customerName = "مواطن (ببلاغ طارئ)",
    String phoneNumber = "+201234567890",
    String language = "ar-EG",
  }) async {
    final client = _createClient();
    try {
      final uri = buildUri('/calls/mobile/simulate-incoming');
      final res = await client.post(
        uri,
        headers: await _getHeaders(isJson: true),
        body: jsonEncode({
          'customer_name': customerName,
          'phone_number': phoneNumber,
          'language': language,
          'notes': 'مواطن يتصل للإبلاغ عن حالة طارئة لشرطة النجدة 122',
        }),
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 201 || res.statusCode == 200) {
        final body = jsonDecode(utf8.decode(res.bodyBytes));
        return CallModel.fromJson(body);
      } else {
        throw Exception('فشل بدء مكالمة المحاكاة: ${res.statusCode}');
      }
    } finally {
      client.close();
    }
  }

  /// Get transcript for a call
  static Future<CallTranscriptModel?> getCallTranscript(String callId) async {
    final client = _createClient();
    try {
      final uri = buildUri('/calls/$callId/transcript');
      final res = await client.get(uri, headers: await _getHeaders()).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final body = jsonDecode(utf8.decode(res.bodyBytes));
        return CallTranscriptModel.fromJson(body);
      }
      return null;
    } catch (e) {
      AppLogger.warning(tag, 'Failed to get call transcript for $callId: $e');
      return null;
    } finally {
      client.close();
    }
  }

  /// Get extraction details for a call
  static Future<CallExtractionModel?> getCallExtraction(String callId) async {
    final client = _createClient();
    try {
      final uri = buildUri('/calls/$callId/extraction');
      final res = await client.get(uri, headers: await _getHeaders()).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final body = jsonDecode(utf8.decode(res.bodyBytes));
        return CallExtractionModel.fromJson(body);
      }
      return null;
    } catch (e) {
      AppLogger.warning(tag, 'Failed to get call extraction for $callId: $e');
      return null;
    } finally {
      client.close();
    }
  }

  /// End call
  static Future<void> endCall(String callId) async {
    final client = _createClient();
    try {
      final uri = buildUri('/calls/$callId/end');
      await client.post(uri, headers: await _getHeaders()).timeout(const Duration(seconds: 8));
    } catch (_) {
      // ignore
    } finally {
      client.close();
    }
  }
}
