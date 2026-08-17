import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class ManagerTeamService {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> getTeamMembers() async {
    try {
      final response = await _apiClient.dio.get('${ApiEndpoints.users}/team');
      final data = response.data;

      if (data != null) {
        final teamList = data['data'] ?? data;
        return {
          'success': true,
          'team': teamList is List ? teamList : [],
        };
      }
      return {
        'success': false,
        'message': 'Failed to fetch team members',
        'team': [],
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to load sales team',
        'team': [],
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'team': [],
      };
    }
  }
}
