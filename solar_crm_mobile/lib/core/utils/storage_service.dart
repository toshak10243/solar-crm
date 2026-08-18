import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      resetOnError: true,
    ),
  );

  static const String _tokenKey = 'jwt_token';
  static const String _userKey = 'user_data';
  static const String _profileImageKey = 'saved_profile_image';

  // Token Management
  static Future<void> saveToken(String token) async {
    try {
      await _storage.write(key: _tokenKey, value: token);
    } catch (e) {
      await _storage.deleteAll();
      await _storage.write(key: _tokenKey, value: token);
    }
  }

  static Future<String?> getToken() async {
    try {
      return await _storage.read(key: _tokenKey);
    } catch (e) {
      await _storage.deleteAll();
      return null;
    }
  }

  static Future<void> deleteToken() async {
    try {
      await _storage.delete(key: _tokenKey);
    } catch (e) {
      await _storage.deleteAll();
    }
  }

  // User Session Management
  static Future<void> saveUser(Map<String, dynamic> userMap) async {
    try {
      await _storage.write(key: _userKey, value: jsonEncode(userMap));
      if (userMap['profile_image'] != null &&
          userMap['profile_image'].toString().isNotEmpty) {
        await saveProfileImage(userMap['profile_image'].toString());
      }
    } catch (e) {
      await _storage.deleteAll();
      await _storage.write(key: _userKey, value: jsonEncode(userMap));
    }
  }

  static Future<Map<String, dynamic>?> getUser() async {
    try {
      final rawJson = await _storage.read(key: _userKey);
      if (rawJson == null) return null;
      return jsonDecode(rawJson) as Map<String, dynamic>;
    } catch (e) {
      await _storage.deleteAll();
      return null;
    }
  }

  // Profile Photo
  static Future<void> saveProfileImage(String imagePath) async {
    try {
      await _storage.write(key: _profileImageKey, value: imagePath);
    } catch (e) {
      // Silent — profile image non-critical
    }
  }

  static Future<String?> getProfileImage() async {
    try {
      return await _storage.read(key: _profileImageKey);
    } catch (e) {
      return null;
    }
  }

  // Clear Session on Logout
  // Note: _profileImageKey intentionally preserved
  static Future<void> clearSession() async {
    try {
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _userKey);
    } catch (e) {
      await _storage.deleteAll();
    }
  }
}
