import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// ======================================================
// Background handler — top-level function hona zaroori hai
// Class ke andar nahi rakh sakte
// ======================================================
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Background mein notification receive hua — yahan koi extra logic nahi chahiye
  // flutter_local_notifications khud handle kar lega
}

class FirebaseMessagingService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  // Notification channel — Android 8+ ke liye zaroori
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'solar_crm_channel', // AndroidManifest mein jo id daali thi
    'Solar CRM Notifications', // Channel ka display name
    description: 'Lead assignments, follow-up reminders, and pipeline updates.',
    importance: Importance.high,
    playSound: true,
  );

  // Jab user notification tap kare — kahan navigate karna hai
  // Main app se set karenge: FirebaseMessagingService.onNotificationTap = (type, id) { ... }
  static Function(String type, String? referenceId)? onNotificationTap;

  // ======================================================
  // INITIALIZE — main.dart se call karenge
  // ======================================================
  static Future<void> initialize() async {
    // 1. User se permission maango
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      print('FCM: Notification permission denied by user.');
      return;
    }

    // 2. Local notifications plugin initialize karo
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse details) {
        // User ne notification tap kiya
        if (details.payload != null && details.payload!.isNotEmpty) {
          try {
            final data = jsonDecode(details.payload!);
            onNotificationTap?.call(
              data['type']?.toString() ?? '',
              data['reference_id']?.toString(),
            );
          } catch (e) {
            print('FCM: Payload parse error: $e');
          }
        }
      },
    );

    // 3. Android notification channel create karo
    final androidPlugin =
        _localNotifications.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_channel);

    // 4. App FOREGROUND mein ho aur notification aaye
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print(
          'FCM: Foreground message received — ${message.notification?.title}');
      _showLocalNotification(message);
    });

    // 5. App BACKGROUND mein tha, user ne notification tap kiya
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('FCM: App opened from background notification');
      _handleNotificationTap(message.data);
    });

    // 6. App CLOSED tha, user ne notification tap karke khola
    final RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      print('FCM: App opened from terminated state notification');
      // Thoda delay do taaki app fully load ho jaye
      await Future.delayed(const Duration(seconds: 1));
      _handleNotificationTap(initialMessage.data);
    }

    // 7. Background handler register karo
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    print('FCM: FirebaseMessagingService initialized successfully.');
  }

  // ======================================================
  // FCM TOKEN — backend pe save karne ke liye
  // ======================================================
  static Future<String?> getToken() async {
    try {
      final token = await _messaging.getToken();
      print('FCM Token: $token');
      return token;
    } catch (e) {
      print('FCM: Token fetch error: $e');
      return null;
    }
  }

  // Token refresh hone pe automatically backend update karo
  static void listenTokenRefresh(Future<void> Function(String) onRefresh) {
    _messaging.onTokenRefresh.listen((newToken) async {
      print('FCM: Token refreshed');
      await onRefresh(newToken);
    });
  }

  // ======================================================
  // LOCAL NOTIFICATION SHOW KARO (Foreground mein)
  // ======================================================
  static void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      // Unique ID — hashCode se, taaki same notification baar baar na aaye
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          playSound: true,
          enableVibration: true,
        ),
      ),
      // Payload mein data bhejo taaki tap pe navigate ho sake
      payload: jsonEncode(message.data),
    );
  }

  // ======================================================
  // NOTIFICATION TAP HANDLE KARO
  // ======================================================
  static void _handleNotificationTap(Map<String, dynamic> data) {
    final type = data['type']?.toString() ?? '';
    final referenceId = data['reference_id']?.toString();
    print('FCM: Notification tapped — type: $type, referenceId: $referenceId');
    onNotificationTap?.call(type, referenceId);
  }
}
