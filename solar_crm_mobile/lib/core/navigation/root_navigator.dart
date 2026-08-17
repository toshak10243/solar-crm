import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/sales/presentation/screens/sales_main_layout.dart';
// 🟢 IMPORT MANAGER MAIN LAYOUT
import '../../features/manager/presentation/screens/manager_main_layout.dart';
// 🔵 IMPORT ADMIN MAIN LAYOUT
import '../../features/admin/presentation/screens/admin_main_layout.dart';

class RootNavigator extends ConsumerWidget {
  const RootNavigator({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    // 1. Initial Launch Loading Indicator
    if (authState.isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.bg,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              SizedBox(height: 16),
              Text(
                'Connecting to Portal...',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // 2. Not Authenticated -> Show Login Screen
    if (!authState.isAuthenticated || authState.user == null) {
      return const LoginScreen();
    }

    // 3. Authenticated -> Auto Redirect based on User Role
    if (authState.isSales) {
      return const SalesMainLayout();
    }

    final role = authState.userRole.toLowerCase().trim();

    // 🟢 MANAGER ROLE -> SHOW MANAGER MAIN LAYOUT (WITH 6 BOTTOM TABS)
    if (role.contains('manager')) {
      return const ManagerMainLayout();
    }

    // 🔵 ADMIN ROLE -> SHOW ADMIN MAIN LAYOUT
    if (role.contains('admin')) {
      return const AdminMainLayout();
    }

    // Default Fallback Placeholder
    return const PortalPlaceholder(
      portalName: 'Portal',
      roleBadge: 'User',
      accentColor: AppColors.primaryDark,
    );
  }
}

class PortalPlaceholder extends ConsumerWidget {
  final String portalName;
  final String roleBadge;
  final Color accentColor;

  const PortalPlaceholder({
    Key? key,
    required this.portalName,
    required this.roleBadge,
    required this.accentColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final fullName = user?['full_name'] ?? user?['name'] ?? 'User';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(portalName),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.danger),
            tooltip: 'Logout',
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: accentColor.withOpacity(0.15),
                  child: Icon(Icons.person, size: 32, color: accentColor),
                ),
                const SizedBox(height: 16),
                Text(
                  'Welcome, $fullName!',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    roleBadge.toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: accentColor,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Logged in successfully! Token and Session synced with Backend.',
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: () {
                    ref.read(authProvider.notifier).logout();
                  },
                  icon: const Icon(Icons.logout, size: 18),
                  label: const Text('Logout Session'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.danger,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
