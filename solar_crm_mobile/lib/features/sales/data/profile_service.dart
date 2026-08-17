import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/utils/storage_service.dart';

class ProfileService {
  final ApiClient _apiClient = ApiClient();

  // 1. Fetch Profile Details
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.profile);
      final data = response.data['data'] ?? response.data;

      if (data != null && data is Map<String, dynamic>) {
        await StorageService.saveUser(data);
        final img = data['profile_image'] ?? data['photo'];
        if (img != null &&
            img.toString().isNotEmpty &&
            img.toString() != 'null') {
          await StorageService.saveProfileImage(img.toString());
        }
      }

      return {
        'success': true,
        'profile': data,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message':
            e.response?.data?['message'] ?? 'Failed to load profile details',
      };
    }
  }

  // 2. Update Profile Details (Basic Info)
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> body) async {
    try {
      final response = await _apiClient.dio.put(
        ApiEndpoints.updateProfile,
        data: body,
      );
      final data = response.data['data'] ?? response.data;

      if (data != null && data is Map<String, dynamic>) {
        await StorageService.saveUser(data);
      }

      return {
        'success': true,
        'message': response.data['message'] ?? 'Profile updated successfully!',
        'profile': data,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to update profile',
      };
    }
  }

  // 3. Upload Profile Image File
  Future<Map<String, dynamic>> uploadProfilePhoto(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'profile_image': await MultipartFile.fromFile(
          filePath,
          filename: filePath.split('/').last,
        ),
      });

      final response = await _apiClient.dio.put(
        '${ApiEndpoints.profile}/photo',
        data: formData,
      );

      final data = response.data['data'] ?? response.data;

      if (data != null && data is Map<String, dynamic>) {
        await StorageService.saveUser(data);
        final img = data['profile_image'] ?? data['photo'];
        if (img != null &&
            img.toString().isNotEmpty &&
            img.toString() != 'null') {
          await StorageService.saveProfileImage(img.toString());
        }
      }

      return {
        'success': true,
        'message':
            response.data['message'] ?? 'Profile photo updated successfully!',
        'profile': data,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to upload photo',
      };
    }
  }

  // 4. Change Password (Updated with fallbacks)
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
    String? confirmPassword,
  }) async {
    try {
      final response = await _apiClient.dio.put(
        ApiEndpoints.changePassword,
        data: {
          'current_password': currentPassword,
          'old_password': currentPassword, // 👈 Added fallback
          'new_password': newPassword,
          'confirm_password':
              confirmPassword ?? newPassword, // 👈 Added fallback
        },
      );
      return {
        'success': true,
        'message': response.data['message'] ?? 'Password changed successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to change password',
      };
    }
  }
}
