import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_service.dart';
import '../../../core/utils/storage_service.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final Map<String, dynamic>? user;
  final String? errorMessage;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    Map<String, dynamic>? user,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  String get userRole {
    if (user == null) return '';
    final role = user!['role_name'] ?? user!['role'] ?? user!['role_id'] ?? '';
    return role.toString().toLowerCase();
  }

  bool get isSales => userRole.contains('sales');
  bool get isManager => userRole.contains('manager');
  bool get isAdmin => userRole.contains('admin') || userRole.contains('super');
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService = AuthService();

  AuthNotifier() : super(AuthState()) {
    checkAuthStatus();
  }
  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

    try {
      // 5 second timeout — agar storage hang ho jaye to bhi app stuck nahi rahega
      final results = await Future.wait([
        StorageService.getToken(),
        StorageService.getUser(),
      ]).timeout(
        const Duration(seconds: 5),
        onTimeout: () => [null, null],
      );

      final token = results[0] as String?;
      final user = results[1] as Map<String, dynamic>?;

      if (token != null && token.isNotEmpty && user != null) {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: user,
          clearError: true,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          user: null,
        );
      }
    } catch (e) {
      // Koi bhi error aaye — loading band karo, login screen dikhao
      print('checkAuthStatus error: $e');
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        user: null,
      );
    }
  }

  Future<bool> login(
      {required String username, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _authService.login(
      username: username,
      password: password,
    );

    if (result['success'] == true) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: result['user'] as Map<String, dynamic>?,
        clearError: true,
      );
      return true;
    } else {
      final msg = result['message']?.toString() ?? 'Invalid credentials';
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        errorMessage: msg,
      );
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    await _authService.logout();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
