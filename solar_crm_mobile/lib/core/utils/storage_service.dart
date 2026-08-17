import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static const _storage = FlutterSecureStorage();
  static const String _tokenKey = 'jwt_token';
  static const String _userKey = 'user_data';
  static const String _profileImageKey = 'saved_profile_image';

  // Token Management
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  // User Session Management
  static Future<void> saveUser(Map<String, dynamic> userMap) async {
    await _storage.write(key: _userKey, value: jsonEncode(userMap));
    if (userMap['profile_image'] != null &&
        userMap['profile_image'].toString().isNotEmpty) {
      await saveProfileImage(userMap['profile_image'].toString());
    }
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final rawJson = await _storage.read(key: _userKey);
    if (rawJson == null) return null;
    try {
      return jsonDecode(rawJson) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // 🟢 Profile Photo Local Persistence (Saved across Logouts)
  static Future<void> saveProfileImage(String imagePath) async {
    await _storage.write(key: _profileImageKey, value: imagePath);
  }

  static Future<String?> getProfileImage() async {
    return await _storage.read(key: _profileImageKey);
  }

  // 🟢 CLEAR SESSION ON LOGOUT (Preserves Saved Profile Picture)
  static Future<void> clearSession() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    // Note: _profileImageKey is intentionally preserved so picture remains permanent!
  }
}
