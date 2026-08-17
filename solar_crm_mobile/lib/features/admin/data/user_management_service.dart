import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class UserManagementService {
  final ApiClient _apiClient = ApiClient();

  // 1. Get Users List with Pagination & Filters
  Future<Map<String, dynamic>> getUsers({
    int page = 1,
    int limit = 10,
    String? search,
    dynamic role,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }
      if (role != null && role.toString().isNotEmpty) {
        queryParams['role'] = role;
      }
      if (status != null && status.trim().isNotEmpty) {
        queryParams['status'] = status.trim();
      }

      final response = await _apiClient.dio.get(
        ApiEndpoints.users,
        queryParameters: queryParams,
      );

      final data = response.data;
      final payload = data != null ? (data['data'] ?? data) : {};
      final List users = payload is Map && payload['data'] != null
          ? (payload['data'] as List)
          : (payload is List ? payload : []);

      final int totalRecords = payload is Map && payload['pagination'] != null
          ? (payload['pagination']['totalRecords'] ?? users.length)
          : users.length;

      return {
        'success': true,
        'users': users,
        'totalRecords': totalRecords,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to load users list.',
        'users': [],
        'totalRecords': 0,
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected error occurred.',
        'users': [],
        'totalRecords': 0,
      };
    }
  }

  // 2. Get Managers List for Sales Exec Assignment
  Future<List<dynamic>> getManagers() async {
    try {
      final response = await _apiClient.dio.get(
        ApiEndpoints.users,
        queryParameters: {'role': 2, 'limit': 100},
      );
      final data = response.data;
      final payload = data != null ? (data['data'] ?? data) : {};
      final List managers = payload is Map && payload['data'] != null
          ? (payload['data'] as List)
          : (payload is List ? payload : []);
      return managers;
    } catch (_) {
      return [];
    }
  }

  // 3. Get Single User Details By ID
  Future<Map<String, dynamic>> getUserById(dynamic id) async {
    try {
      final response = await _apiClient.dio.get('${ApiEndpoints.users}/$id');
      final data = response.data;
      final userObj = data != null ? (data['data'] ?? data) : {};
      return {
        'success': true,
        'user': userObj is Map<String, dynamic> ? userObj : {},
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message':
            e.response?.data?['message'] ?? 'Failed to load user details.',
        'user': <String, dynamic>{},
      };
    }
  }

  // 4. Create User
  Future<Map<String, dynamic>> createUser(Map<String, dynamic> userData) async {
    try {
      final response =
          await _apiClient.dio.post(ApiEndpoints.users, data: userData);
      return {
        'success': true,
        'message': response.data?['message'] ?? 'User created successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to create user.',
      };
    }
  }

  // 5. Update User Details
  Future<Map<String, dynamic>> updateUser(
      dynamic id, Map<String, dynamic> userData) async {
    try {
      final response =
          await _apiClient.dio.put('${ApiEndpoints.users}/$id', data: userData);
      return {
        'success': true,
        'message':
            response.data?['message'] ?? 'User details updated successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to update user.',
      };
    }
  }

  // 6. Toggle User Status (Active / Inactive)
  Future<Map<String, dynamic>> updateUserStatus(
      dynamic id, String status) async {
    try {
      final response = await _apiClient.dio.patch(
        '${ApiEndpoints.users}/status/$id',
        data: {'status': status},
      );
      return {
        'success': true,
        'message':
            response.data?['message'] ?? 'User status updated successfully!',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to update status.',
      };
    }
  }

  // 7. Soft Delete User
  Future<Map<String, dynamic>> deleteUser(dynamic id) async {
    try {
      final response = await _apiClient.dio.delete('${ApiEndpoints.users}/$id');
      return {
        'success': true,
        'message':
            response.data?['message'] ?? 'User account deleted successfully.',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to delete user.',
      };
    }
  }

  // 8. Team Members (used by Manager screens; kept here since the JS
  // service file groups it alongside the other /users endpoints)
  Future<List<dynamic>> getTeamMembers() async {
    try {
      final response = await _apiClient.dio.get('${ApiEndpoints.users}/team');
      final data = response.data;
      final payload = data != null ? (data['data'] ?? data) : {};
      final List members = payload is Map && payload['data'] != null
          ? (payload['data'] as List)
          : (payload is List ? payload : []);
      return members;
    } catch (_) {
      return [];
    }
  }
}
