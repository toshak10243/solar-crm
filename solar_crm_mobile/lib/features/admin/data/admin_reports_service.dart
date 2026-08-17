import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class AdminReportsService {
  final ApiClient _apiClient = ApiClient();

  // Fetch parallel Org-wide Leads & Users data for Reports
  Future<Map<String, dynamic>> getReportData() async {
    try {
      final responses = await Future.wait([
        _apiClient.dio.get(
          ApiEndpoints.leads,
          queryParameters: {'page': 1, 'limit': 5000},
        ),
        _apiClient.dio.get(
          ApiEndpoints.users,
          queryParameters: {'limit': 500},
        ),
      ]);

      final leadsRes = responses[0].data;
      final usersRes = responses[1].data;

      final leadsData = leadsRes != null ? (leadsRes['data'] ?? leadsRes) : [];
      final usersData = usersRes != null ? (usersRes['data'] ?? usersRes) : [];

      final List leads = leadsData is Map && leadsData['data'] != null
          ? (leadsData['data'] as List)
          : (leadsData is List ? leadsData : []);

      final List users = usersData is Map && usersData['data'] != null
          ? (usersData['data'] as List)
          : (usersData is List ? usersData : []);

      return {
        'success': true,
        'leads': leads,
        'users': users,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message':
            e.response?.data?['message'] ?? 'Failed to load report analytics.',
        'leads': [],
        'users': [],
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'leads': [],
        'users': [],
      };
    }
  }
}
