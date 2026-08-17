import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class AdminDashboardService {
  final ApiClient _apiClient = ApiClient();

  // Fetch Admin Dashboard Stats (/dashboard/admin)
  Future<Map<String, dynamic>> getAdminDashboardStats() async {
    try {
      final response =
          await _apiClient.dio.get('${ApiEndpoints.baseUrl}/dashboard/admin');
      final data = response.data;

      if (data != null &&
          (data['success'] == true ||
              data['status'] == 'success' ||
              data['data'] != null)) {
        return {
          'success': true,
          'data': data['data'] ?? data,
        };
      }

      return {
        'success': false,
        'message': 'Failed to load admin dashboard stats.',
        'data': null,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message':
            e.response?.data?['message'] ?? 'Failed to load admin dashboard.',
        'data': null,
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'data': null,
      };
    }
  }
}
