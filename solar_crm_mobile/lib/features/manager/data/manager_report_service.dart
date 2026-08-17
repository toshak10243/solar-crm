import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class ManagerReportService {
  final ApiClient _apiClient = ApiClient();

  /// Robustly pulls a List out of a backend response no matter which shape
  /// it comes back in — direct array, {data:[...]}, {data:{data:[...]}}},
  /// {users:[...]}, {team:[...]}, {leads:[...]}, {items:[...]} etc.
  /// This mirrors what the web side effectively relies on
  /// (`response.data` being usable directly or via `.data`).
  List<dynamic> _extractList(dynamic raw) {
    if (raw == null) return [];
    if (raw is List) return raw;

    if (raw is Map) {
      // Common wrapper keys, in priority order.
      const keys = [
        'data',
        'leads',
        'users',
        'team',
        'members',
        'items',
        'results'
      ];
      for (final key in keys) {
        if (raw.containsKey(key)) {
          final nested = raw[key];
          if (nested is List) return nested;
          if (nested is Map) {
            // one level deeper e.g. { data: { data: [...] } }
            final deeper = _extractList(nested);
            if (deeper.isNotEmpty) return deeper;
          }
        }
      }
    }
    return [];
  }

  /// Fetch Team Members & All Leads simultaneously (same as the React
  /// `Promise.all([getTeamMembers(), getLeads({page:1, limit:5000})])`).
  Future<Map<String, dynamic>> getReportData() async {
    try {
      final responses = await Future.wait([
        _apiClient.dio.get('${ApiEndpoints.users}/team'),
        _apiClient.dio.get(
          ApiEndpoints.leads,
          queryParameters: {'page': 1, 'limit': 5000},
        ),
      ]);

      final teamMembers = _extractList(responses[0].data);
      final leads = _extractList(responses[1].data);

      return {
        'success': true,
        'teamMembers': teamMembers,
        'leads': leads,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message']?.toString() ??
            'Failed to load report analytics',
        'teamMembers': const [],
        'leads': const [],
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'teamMembers': const [],
        'leads': const [],
      };
    }
  }
}
