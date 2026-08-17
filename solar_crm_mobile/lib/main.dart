import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme/app_theme.dart';
import 'core/services/firebase_messaging_service.dart';
import 'features/splash/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase initialize karo
  await Firebase.initializeApp();

  // FCM initialize karo
  await FirebaseMessagingService.initialize();

  runApp(
    const ProviderScope(
      child: SolarCrmApp(),
    ),
  );
}

class SolarCrmApp extends StatelessWidget {
  const SolarCrmApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Solar CRM',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
