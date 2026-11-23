import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/config/app_config.dart';
import 'core/logging/app_logger.dart';
import 'core/theme/app_theme.dart';
import 'features/login/login_screen.dart';
import 'features/home/home_screen.dart';

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
  }
}

void main() async {
  HttpOverrides.global = MyHttpOverrides();
  WidgetsFlutterBinding.ensureInitialized();

  String initialRoute = '/login';
  try {
    AppLogger.info('AppMain', 'Application initializing...');
    await AppConfig.init();
    AppLogger.info('AppMain', 'API Base URL configured: ${AppConfig.apiUrl}');

    final token = await AppConfig.getToken();
    AppLogger.info('AppMain', 'Startup auth token check: ${token != null ? "Present" : "None"}');
    if (token != null && token.isNotEmpty) {
      initialRoute = '/home';
    }
  } catch (e, stack) {
    debugPrint('Error during app initialization: $e\n$stack');
  }

  runApp(TranscriptionApp(initialRoute: initialRoute));
}

class TranscriptionApp extends StatelessWidget {
  final String initialRoute;

  const TranscriptionApp({Key? key, required this.initialRoute}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '122Nagda',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('ar', 'EG'),
        Locale('en', 'US'),
      ],
      locale: const Locale('ar', 'EG'), // Arabic primary with RTL
      initialRoute: initialRoute,
      routes: {
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
      },
    );
  }
}
