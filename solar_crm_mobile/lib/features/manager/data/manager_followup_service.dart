import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class ManagerFollowupService {
  final ApiClient _apiClient = ApiClient();

  /// Robustly pulls a List out of a backend response no matter which shape
  /// it comes back in — direct array, {data:[...]}, {data:{data:[...]}}},
  /// {followups:[...]}, {users:[...]}, {team:[...]}, {history:[...]} etc.
  List<dynamic> _extractList(dynamic raw) {
    if (raw == null) return [];
    if (raw is List) return raw;

    if (raw is Map) {
      const keys = [
        'data',
        'followups',
        'users',
        'team',
        'members',
        'history',
        'items',
        'results',
      ];
      for (final key in keys) {
        if (raw.containsKey(key)) {
          final nested = raw[key];
          if (nested is List) return nested;
          if (nested is Map) {
            final deeper = _extractList(nested);
            if (deeper.isNotEmpty) return deeper;
          }
        }
      }
    }
    return [];
  }

  // 1. Get Team Members & Team Followups in parallel
  // (mirrors React Promise.all([getTeamMembers(), getTeamFollowupsList()]))
  Future<Map<String, dynamic>> fetchInitialData() async {
    try {
      final responses = await Future.wait([
        _apiClient.dio.get('${ApiEndpoints.users}/team'),
        _apiClient.dio.get('${ApiEndpoints.leads}/team/followups'),
      ]);

      final teamMembers = _extractList(responses[0].data);
      final teamFollowups = _extractList(responses[1].data);

      return {
        'success': true,
        'teamMembers': teamMembers,
        'teamFollowups': teamFollowups,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message']?.toString() ??
            'Failed to sync team follow-ups.',
        'teamMembers': const [],
        'teamFollowups': const [],
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'teamMembers': const [],
        'teamFollowups': const [],
      };
    }
  }

  // 2. Add Follow-up Remark/Note (manager logging a note against a lead)
  Future<Map<String, dynamic>> addFollowup({
    required dynamic leadId,
    required String note,
    String? followupDate,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '${ApiEndpoints.leads}/$leadId/followups',
        data: {
          'note': note,
          'followup_type': 'Call',
          if (followupDate != null && followupDate.isNotEmpty)
            'follow_up_date': followupDate,
        },
      );
      return {
        'success': true,
        'message': response.data?['message']?.toString() ??
            'Follow-up remark recorded successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message']?.toString() ??
            'Failed to save follow-up entry.',
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected error occurred while saving.',
      };
    }
  }

  // 3. Get Follow-up Audit History Timeline for a single lead
  Future<Map<String, dynamic>> getFollowupsHistory(dynamic leadId) async {
    try {
      final response =
          await _apiClient.dio.get('${ApiEndpoints.leads}/$leadId/followups');
      final history = _extractList(response.data);
      return {
        'success': true,
        'history': history,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message']?.toString() ??
            'Failed to load follow-up history.',
        'history': const [],
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'history': const [],
      };
    }
  }
}
