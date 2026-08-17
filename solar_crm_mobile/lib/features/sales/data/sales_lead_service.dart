import 'package:dio/dio.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/network/api_client.dart';
import 'models/lead_model.dart';

class SalesLeadService {
  final ApiClient _apiClient = ApiClient();

  /// Fetch Assigned Leads list with Filters & Pagination
  Future<Map<String, dynamic>> getLeads({
    int page = 1,
    int limit = 10,
    String? search,
    String? status,
    String? priority,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'limit': limit,
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null && status.isNotEmpty) 'status': status,
        if (priority != null && priority.isNotEmpty) 'priority': priority,
      };

      final response = await _apiClient.dio.get(
        ApiEndpoints.leads,
        queryParameters: queryParams,
      );

      final data = response.data;
      final List rawList = data['data'] ?? data['leads'] ?? [];
      final leads = rawList
          .map((e) => LeadModel.fromJson(e as Map<String, dynamic>))
          .toList();

      return {
        'success': true,
        'leads': leads,
        'total': data['total'] ?? leads.length,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to load leads list',
      };
    } catch (e) {
      return {'success': false, 'message': 'Something went wrong'};
    }
  }

  /// Fetch Lead Details by ID
  Future<Map<String, dynamic>> getLeadById(int id) async {
    try {
      final response = await _apiClient.dio.get('${ApiEndpoints.leads}/$id');
      final data = response.data['data'] ?? response.data;
      return {
        'success': true,
        'lead': LeadModel.fromJson(data as Map<String, dynamic>),
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message':
            e.response?.data?['message'] ?? 'Failed to load lead details',
      };
    }
  }

  /// Create a New Lead (Sales self-service)
  ///
  /// NOTE: `assigned_to`, `assigned_by` and `status` are intentionally
  /// NOT part of this request body. The backend's createLeadController
  /// forces those automatically for the Sales role:
  ///   payload.assigned_to = req.user.id;
  ///   payload.assigned_by = req.user.id;
  ///   payload.status = "New Lead";
  /// regardless of what is sent — so there's no point sending them, and
  /// sending them could wrongly imply to a future reader that they take
  /// effect here.
  ///
  /// Expected body keys (all optional except customer_name & mobile_number):
  /// customer_name, mobile_number, alternate_number, email, address,
  /// city, state, pincode, solar_requirement, interest_status,
  /// required_kw, lead_source, priority, remark
  Future<Map<String, dynamic>> createLead(Map<String, dynamic> body) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.leads,
        data: body,
      );

      final data = response.data;
      final leadJson = data is Map<String, dynamic> ? data['data'] : null;

      return {
        'success': true,
        'message': data is Map<String, dynamic>
            ? (data['message'] ?? 'Lead created successfully')
            : 'Lead created successfully',
        // May be null if the backend response shape ever changes —
        // callers must null-check before using it (e.g. for a
        // "scroll to / highlight new row" UX).
        'lead': leadJson != null
            ? LeadModel.fromJson(leadJson as Map<String, dynamic>)
            : null,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to create lead',
      };
    } catch (e) {
      return {'success': false, 'message': 'Something went wrong'};
    }
  }

  /// Update Lead Info (interest_status, required_kw, remark, priority)
  Future<Map<String, dynamic>> updateLead(
      int id, Map<String, dynamic> body) async {
    try {
      final response =
          await _apiClient.dio.put('${ApiEndpoints.leads}/$id', data: body);
      return {
        'success': true,
        'message': response.data['message'] ?? 'Lead updated successfully',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to update lead',
      };
    }
  }

  /// Update Lead Status (status, remark, quotation_amount, site_visit_date)
  Future<Map<String, dynamic>> updateLeadStatus(
      int id, Map<String, dynamic> statusData) async {
    try {
      final response = await _apiClient.dio
          .patch('${ApiEndpoints.leads}/$id/status', data: statusData);
      return {
        'success': true,
        'message': response.data['message'] ?? 'Status updated successfully',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to update status',
      };
    }
  }

  /// Add Follow-up Note (note, followup_type, status_after_followup, follow_up_date)
  Future<Map<String, dynamic>> addFollowup(
      int id, Map<String, dynamic> followupData) async {
    try {
      final response = await _apiClient.dio
          .post('${ApiEndpoints.leads}/$id/followups', data: followupData);
      return {
        'success': true,
        'message': response.data['message'] ?? 'Follow-up added successfully',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to add follow-up',
      };
    }
  }

  /// Get Follow-up History
  Future<Map<String, dynamic>> getFollowups(int id) async {
    try {
      final response =
          await _apiClient.dio.get('${ApiEndpoints.leads}/$id/followups');
      final List raw = response.data['data'] ?? [];
      return {
        'success': true,
        'followups': raw
            .map((e) => FollowupModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      };
    } catch (_) {
      return {'success': false, 'followups': <FollowupModel>[]};
    }
  }

  /// Get Activity Audit Logs
  Future<Map<String, dynamic>> getActivityLogs(int id) async {
    try {
      final response =
          await _apiClient.dio.get('${ApiEndpoints.leads}/$id/logs');
      final List raw = response.data['data'] ?? [];
      return {
        'success': true,
        'logs': raw
            .map((e) => ActivityLogModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      };
    } catch (_) {
      return {'success': false, 'logs': <ActivityLogModel>[]};
    }
  }
}
