import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

/// Handles all network calls for the Manager Dashboard screen.
///
/// Every method returns a normalized `Map<String, dynamic>` shaped like:
///   { 'success': bool, 'data': dynamic, 'message': String? }
/// so the UI layer never has to deal with DioException directly.
class ManagerDashboardService {
  final ApiClient _apiClient = ApiClient();

  /// Fetches all manager dashboard metrics in a single call:
  /// teamPerformance, statusBreakdown, pendingToday, convertedToday,
  /// overdueFollowups, todaysFollowupsList, recentActivity.
  Future<Map<String, dynamic>> getDashboardStats({
    String timeRange = 'this_month',
  }) async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiEndpoints.baseUrl}/dashboard/manager',
        queryParameters: {'range': timeRange},
      );

      final data = response.data;
      if (data == null) {
        return _failure('Empty response received from the server.');
      }

      final bool isSuccess = data['success'] == true ||
          data['status'] == 'success' ||
          data['data'] != null;

      if (!isSuccess) {
        return _failure(
          data['message']?.toString() ?? 'Failed to fetch dashboard metrics.',
        );
      }

      final payload = (data['data'] ?? data);
      return {
        'success': true,
        'data': payload is Map<String, dynamic>
            ? payload
            : Map<String, dynamic>.from(payload as Map),
      };
    } on DioException catch (e) {
      return _failure(_extractErrorMessage(e));
    } catch (_) {
      return _failure('Something went wrong while loading the dashboard.');
    }
  }

  /// Reassigns a follow-up lead to another sales representative on the team.
  Future<Map<String, dynamic>> reassignLead(
    dynamic leadId,
    dynamic assignedToId,
  ) async {
    try {
      final response = await _apiClient.dio.post(
        '${ApiEndpoints.baseUrl}/leads/$leadId/assign',
        data: {'assigned_to': assignedToId},
      );
      return {
        'success': true,
        'message': response.data?['message']?.toString() ??
            'Lead reassigned successfully!',
      };
    } on DioException catch (e) {
      return {'success': false, 'message': _extractErrorMessage(e)};
    } catch (_) {
      return {
        'success': false,
        'message': 'Failed to reassign lead. Please try again.',
      };
    }
  }

  /// Standalone team follow-ups fetch — useful if the dashboard payload
  /// ever needs to be refreshed independently of the rest of the metrics
  /// (e.g. a lightweight polling refresh for just the follow-up list).
  Future<Map<String, dynamic>> getTeamFollowups() async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiEndpoints.baseUrl}/leads/team/followups',
      );
      final data = response.data;
      return {
        'success': true,
        'data': data is Map ? (data['data'] ?? data) : data,
      };
    } on DioException catch (e) {
      return {'success': false, 'message': _extractErrorMessage(e)};
    } catch (_) {
      return {'success': false, 'message': 'Failed to load follow-ups.'};
    }
  }

  String _extractErrorMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return 'Request timed out. Please check your connection.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Unable to reach the server. Please check your connection.';
    }
    return e.message ?? 'An unexpected network error occurred.';
  }

  Map<String, dynamic> _failure(String message) {
    return {'success': false, 'message': message, 'data': null};
  }
}
