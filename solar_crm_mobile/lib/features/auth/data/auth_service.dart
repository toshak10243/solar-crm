import 'package:dio/dio.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/storage_service.dart';

class AuthService {
  final ApiClient _apiClient = ApiClient();

  // 1. LOGIN
  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.login,
        data: {
          'login': username,
          'password': password,
        },
      );

      final data = response.data;
      if (data != null &&
          (data['success'] == true || response.statusCode == 200)) {
        final token = data['token'] ?? data['data']?['token'];
        final user = data['user'] ?? data['data']?['user'];

        if (token != null) {
          await StorageService.saveToken(token.toString());
        }
        if (user != null && user is Map<String, dynamic>) {
          await StorageService.saveUser(user);

          // 🟢 CRITICAL FIX: Profile Image path key-value save
          final img = user['profile_image'] ?? user['photo'] ?? user['avatar'];
          if (img != null &&
              img.toString().isNotEmpty &&
              img.toString() != 'null') {
            await StorageService.saveProfileImage(img.toString());
          }
        }

        return {
          'success': true,
          'message': data['message'] ?? 'Login successful',
          'user': user,
          'token': token,
        };
      } else {
        return {
          'success': false,
          'message': data?['message'] ?? 'Invalid username or password',
        };
      }
    } on DioException catch (e) {
      String errorMessage = 'Invalid username or password';

      if (e.response != null && e.response?.data != null) {
        final resData = e.response?.data;
        if (resData is Map) {
          errorMessage = resData['message'] ??
              resData['error'] ??
              'Server returned status ${e.response?.statusCode}';
        } else if (resData is String && resData.isNotEmpty) {
          errorMessage = resData;
        }
      } else if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Connection timeout. Please check your network.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Unable to connect to server. Check backend status.';
      }

      return {
        'success': false,
        'message': errorMessage,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
      };
    }
  }

  // 2. FORGOT PASSWORD (OTP Request)
  Future<Map<String, dynamic>> forgotPassword({
    required String identifier,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.forgotPassword,
        data: {
          'login': identifier,
        },
      );

      final data = response.data;
      if (data != null &&
          (data['success'] == true || response.statusCode == 200)) {
        return {
          'success': true,
          'message': data['message'] ??
              'OTP sent successfully to registered email/phone.',
        };
      } else {
        return {
          'success': false,
          'message': data?['message'] ?? 'Failed to send reset code.',
        };
      }
    } on DioException catch (e) {
      String errorMessage = 'User/Account not found';

      if (e.response != null && e.response?.data != null) {
        final resData = e.response?.data;
        if (resData is Map) {
          errorMessage = resData['message'] ??
              resData['error'] ??
              'Account not found or invalid identifier.';
        } else if (resData is String && resData.isNotEmpty) {
          errorMessage = resData;
        }
      } else if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Connection timeout. Check network connection.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Unable to connect to server. Check backend status.';
      }

      return {
        'success': false,
        'message': errorMessage,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
      };
    }
  }

  // 3. RESET PASSWORD (OTP Verification & New Password)
  Future<Map<String, dynamic>> resetPassword({
    required String loginIdentifier,
    required String otp,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.resetPassword,
        data: {
          'login': loginIdentifier,
          'otp': otp,
          'password': newPassword,
          'confirm_password': confirmPassword,
        },
      );

      final data = response.data;
      if (data != null &&
          (data['success'] == true || response.statusCode == 200)) {
        return {
          'success': true,
          'message': data['message'] ?? 'Password reset successful!',
        };
      } else {
        return {
          'success': false,
          'message': data?['message'] ?? 'Failed to reset password.',
        };
      }
    } on DioException catch (e) {
      String errorMessage = 'Failed to reset password';

      if (e.response != null && e.response?.data != null) {
        final resData = e.response?.data;
        if (resData is Map) {
          errorMessage = resData['message'] ??
              resData['error'] ??
              'Invalid OTP or request details.';
        } else if (resData is String && resData.isNotEmpty) {
          errorMessage = resData;
        }
      } else if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Connection timeout. Check network connection.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Unable to connect to server. Check backend status.';
      }

      return {
        'success': false,
        'message': errorMessage,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
      };
    }
  }

  // 4. LOGOUT
  Future<void> logout() async {
    try {
      await _apiClient.dio.post(ApiEndpoints.logout);
    } catch (_) {}
    await StorageService.clearSession();
  }
}
