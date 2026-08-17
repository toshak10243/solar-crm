import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class ManagerLeadService {
  final ApiClient _apiClient = ApiClient();

  // 1. Fetch All Leads & Team Members Parallelly
  Future<Map<String, dynamic>> fetchLeadsAndTeam() async {
    try {
      final responses = await Future.wait([
        _apiClient.dio.get(ApiEndpoints.leads,
            queryParameters: {'page': 1, 'limit': 5000}),
        _apiClient.dio.get('${ApiEndpoints.users}/team'),
      ]);

      final leadsRes = responses[0].data;
      final teamRes = responses[1].data;

      final leadsData = leadsRes != null ? (leadsRes['data'] ?? leadsRes) : [];
      final teamData = teamRes != null ? (teamRes['data'] ?? teamRes) : [];

      return {
        'success': true,
        'leads': leadsData is List ? leadsData : [],
        'teamMembers': teamData is List ? teamData : [],
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message':
            e.response?.data?['message'] ?? 'Failed to fetch team leads.',
        'leads': [],
        'teamMembers': [],
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'leads': [],
        'teamMembers': [],
      };
    }
  }

  // 2. Create New Lead
  Future<Map<String, dynamic>> createLead(Map<String, dynamic> data) async {
    try {
      final response =
          await _apiClient.dio.post(ApiEndpoints.leads, data: data);
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

  // 3. Update Lead
  Future<Map<String, dynamic>> updateLead(
      dynamic id, Map<String, dynamic> data) async {
    try {
      final response =
          await _apiClient.dio.put('${ApiEndpoints.leads}/$id', data: data);
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

  // 4. Assign / Reassign Lead
  Future<Map<String, dynamic>> assignLead(
      dynamic leadId, dynamic userId) async {
    try {
      final response = await _apiClient.dio.post(
        '${ApiEndpoints.leads}/$leadId/assign',
        data: {'assigned_to': userId},
      );
      return {
        'success': true,
        'message': response.data?['message'] ?? 'Lead reassigned successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Reassign failed.',
      };
    }
  }

  // 5. Add Follow-up & Quick Status Update
  Future<Map<String, dynamic>> addFollowup(
      dynamic leadId, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio
          .post('${ApiEndpoints.leads}/$leadId/followups', data: data);
      return {
        'success': true,
        'message': response.data?['message'] ?? 'Update recorded successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to add update.',
      };
    }
  }

  // 6. Fetch Logs & History
  Future<List<dynamic>> fetchLeadHistory(dynamic leadId) async {
    try {
      final responses = await Future.wait([
        _apiClient.dio.get('${ApiEndpoints.leads}/$leadId/followups'),
        _apiClient.dio.get('${ApiEndpoints.leads}/$leadId/logs'),
      ]);

      final followupsData =
          responses[0].data?['data'] ?? responses[0].data ?? [];
      final logsData = responses[1].data?['data'] ?? responses[1].data ?? [];

      final List combined = [
        ...(followupsData is List ? followupsData : []),
        ...(logsData is List ? logsData : [])
      ];

      combined.sort((a, b) {
        final dateA = DateTime.tryParse(a['created_at']?.toString() ?? '') ??
            DateTime(1970);
        final dateB = DateTime.tryParse(b['created_at']?.toString() ?? '') ??
            DateTime(1970);
        return dateB.compareTo(dateA);
      });

      return combined;
    } catch (_) {
      return [];
    }
  }
}
