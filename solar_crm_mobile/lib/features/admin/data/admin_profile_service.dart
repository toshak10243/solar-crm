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
        } else {
          // Important: if server says no image, clear any stale cached
          // image path so the UI doesn't keep showing an old photo.
          await StorageService.saveProfileImage('');
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

  // 2. Update Profile Details (Basic Info) — also used for photo removal
  // by sending 'profile_image': null in the body.
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> body) async {
    try {
      final response = await _apiClient.dio.put(
        ApiEndpoints.updateProfile,
        data: body,
      );
      final data = response.data['data'] ?? response.data;

      if (data != null && data is Map<String, dynamic>) {
        await StorageService.saveUser(data);

        // If this update explicitly removed the photo, make sure the
        // locally cached image path is cleared too — otherwise the app
        // keeps rendering the old photo from StorageService even though
        // the server side removal succeeded.
        if (body.containsKey('profile_image') &&
            body['profile_image'] == null) {
          await StorageService.saveProfileImage('');
        } else {
          final img = data['profile_image'] ?? data['photo'];
          if (img != null &&
              img.toString().isNotEmpty &&
              img.toString() != 'null') {
            await StorageService.saveProfileImage(img.toString());
          }
        }
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

  // 4. Change Password
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
