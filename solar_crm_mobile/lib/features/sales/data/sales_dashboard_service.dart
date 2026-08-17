import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class SalesDashboardService {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> getSalesDashboardStats() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.salesDashboard);
      final data = response.data;
      if (data != null &&
          (data['success'] == true || response.statusCode == 200)) {
        return {
          'success': true,
          'data': data['data'] ?? data,
        };
      } else {
        return {
          'success': false,
          'message': data?['message'] ?? 'Failed to load dashboard statistics',
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ??
            'Server error while fetching dashboard',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
      };
    }
  }
}
