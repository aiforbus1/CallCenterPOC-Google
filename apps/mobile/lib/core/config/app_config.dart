import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  static const String defaultApiUrl = 'http://34.41.238.202/api/v1';
  static const String defaultUsername = 'admin@callcenter.poc';
  static const String defaultPassword = 'Admin123!';

  static String _apiUrl = defaultApiUrl;

  static String get apiUrl => _apiUrl;

  /// Normalizes base URL so that trailing slashes are removed and ensures '/api/v1'
  /// is always included even if the user typed http://host or http://host/api.
  static String normalizeUrl(String url) {
    var clean = url.trim();
    while (clean.endsWith('/')) {
      clean = clean.substring(0, clean.length - 1);
    }
    if (clean.isEmpty) return defaultApiUrl;
    final lower = clean.toLowerCase();
    if (lower.endsWith('/api/v1') || lower.endsWith('/v1')) {
      final idx = lower.lastIndexOf('/v1');
      return clean.substring(0, idx) + '/v1';
    }
    if (lower.endsWith('/api')) {
      return '$clean/v1';
    }
    return '$clean/api/v1';
  }

  static String getWebSocketUrl(String callId) {
    var base = normalizeUrl(_apiUrl);
    if (base.startsWith('https://')) {
      base = base.replaceFirst('https://', 'wss://');
    } else if (base.startsWith('http://')) {
      base = base.replaceFirst('http://', 'ws://');
    }
    while (base.endsWith('/')) {
      base = base.substring(0, base.length - 1);
    }
    return '$base/calls/stream/$callId';
  }

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('api_base_url');
    if (saved != null && saved.trim().isNotEmpty) {
      _apiUrl = normalizeUrl(saved);
    } else {
      _apiUrl = defaultApiUrl;
    }
  }

  static Future<void> setApiUrl(String url) async {
    _apiUrl = normalizeUrl(url);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', _apiUrl);
  }

  static Future<void> resetToDefault() async {
    await setApiUrl(defaultApiUrl);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  static Future<String?> getUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_email');
  }

  static Future<void> saveUserEmail(String email) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_email', email);
  }

  static Future<bool> isDarkMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('dark_mode') ?? false;
  }

  static Future<void> setDarkMode(bool dark) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('dark_mode', dark);
  }

  static Future<String> getLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('app_lang') ?? 'ar';
  }

  static Future<void> setLanguage(String lang) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_lang', lang);
  }
}
