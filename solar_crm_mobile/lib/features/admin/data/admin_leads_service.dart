import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class AdminLeadsService {
  final ApiClient _apiClient = ApiClient();

  // 1. Fetch All Leads with Search, Pagination & Filters
  Future<Map<String, dynamic>> getLeads(Map<String, dynamic> params) async {
    try {
      final response = await _apiClient.dio.get(
        ApiEndpoints.leads,
        queryParameters: params,
      );

      final data = response.data;
      final payload = data != null ? (data['data'] ?? data) : [];
      final List leads = payload is List ? payload : (payload['data'] ?? []);
      final int total = data['total'] ?? leads.length;

      return {
        'success': true,
        'data': leads,
        'total': total,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message':
            e.response?.data?['message'] ?? 'Failed to fetch master leads.',
        'data': [],
        'total': 0,
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'data': [],
        'total': 0,
      };
    }
  }

  // 2. Fetch Single Lead Details
  Future<Map<String, dynamic>> getLeadById(dynamic id) async {
    try {
      final response = await _apiClient.dio.get('${ApiEndpoints.leads}/$id');
      final data = response.data;
      return {
        'success': true,
        'data': data != null ? (data['data'] ?? data) : {},
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message':
            e.response?.data?['message'] ?? 'Failed to fetch lead details.',
        'data': <String, dynamic>{},
      };
    }
  }

  // 3. Create Lead
  Future<Map<String, dynamic>> createLead(Map<String, dynamic> leadData) async {
    try {
      final response =
          await _apiClient.dio.post(ApiEndpoints.leads, data: leadData);
      return {
        'success': true,
        'message': response.data?['message'] ?? 'Lead created successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to create lead.',
      };
    }
  }

  // 4. Update Lead
  Future<Map<String, dynamic>> updateLead(
      dynamic id, Map<String, dynamic> leadData) async {
    try {
      final response =
          await _apiClient.dio.put('${ApiEndpoints.leads}/$id', data: leadData);
      return {
        'success': true,
        'message': response.data?['message'] ?? 'Lead updated successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to update lead.',
      };
    }
  }

  // 5. Assign / Reassign Lead
  Future<Map<String, dynamic>> assignLead(dynamic id, dynamic userId) async {
    try {
      final response = await _apiClient.dio.post(
        '${ApiEndpoints.leads}/$id/assign',
        data: {'assigned_to': userId},
      );
      return {
        'success': true,
        'message': response.data?['message'] ?? 'Lead assigned successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to assign lead.',
      };
    }
  }

  // 6. Add Follow-up Note
  Future<Map<String, dynamic>> addFollowup(
      dynamic id, Map<String, dynamic> followupData) async {
    try {
      final response = await _apiClient.dio
          .post('${ApiEndpoints.leads}/$id/followups', data: followupData);
      return {
        'success': true,
        'message':
            response.data?['message'] ?? 'Follow-up logged successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to add follow-up.',
      };
    }
  }

  // 7. Fetch Follow-up Timeline
  Future<List<dynamic>> getFollowups(dynamic id) async {
    try {
      final response =
          await _apiClient.dio.get('${ApiEndpoints.leads}/$id/followups');
      final data = response.data;
      return data != null ? (data['data'] ?? data ?? []) : [];
    } catch (_) {
      return [];
    }
  }

  // 8. Fetch Activity Logs
  Future<List<dynamic>> getActivityLogs(dynamic id) async {
    try {
      final response =
          await _apiClient.dio.get('${ApiEndpoints.leads}/$id/logs');
      final data = response.data;
      return data != null ? (data['data'] ?? data ?? []) : [];
    } catch (_) {
      return [];
    }
  }

  // 9. Delete Lead
  Future<Map<String, dynamic>> deleteLead(dynamic id) async {
    try {
      final response = await _apiClient.dio.delete('${ApiEndpoints.leads}/$id');
      return {
        'success': true,
        'message': response.data?['message'] ?? 'Lead deleted successfully.',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to delete lead.',
      };
    }
  }

  // 10. Fetch Users List for Assignment Dropdown
  Future<List<dynamic>> getUsers() async {
    try {
      final response = await _apiClient.dio.get(
        ApiEndpoints.users,
        queryParameters: {'limit': 100},
      );
      final data = response.data;
      final payload = data != null ? (data['data'] ?? data) : {};
      return payload is Map && payload['data'] != null
          ? (payload['data'] as List)
          : (payload is List ? payload : []);
    } catch (_) {
      return [];
    }
  }
}
