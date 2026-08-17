import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

// Import Admin Placeholder Screens
import 'admin_dashboard_screen.dart';
import 'user_management_screen.dart';
import 'admin_leads_screen.dart';
import 'admin_reports_screen.dart';
import 'admin_profile_screen.dart';

class AdminMainLayout extends StatefulWidget {
  const AdminMainLayout({Key? key}) : super(key: key);

  @override
  State<AdminMainLayout> createState() => _AdminMainLayoutState();
}

class _AdminMainLayoutState extends State<AdminMainLayout> {
  int _currentIndex = 0;

  // 🟢 5 Main Admin Portal Screens
  final List<Widget> _screens = const [
    AdminDashboardScreen(),
    UserManagementScreen(),
    AdminLeadsScreen(),
    AdminReportsScreen(),
    AdminProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),

      // 🟢 ADMIN FOOTER / BOTTOM NAVIGATION BAR
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          border: const Border(
            top: BorderSide(color: AppColors.border, width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              backgroundColor: Colors.transparent,
              elevation: 0,
              type: BottomNavigationBarType.fixed,
              selectedItemColor:
                  AppColors.primaryDark, // Deep Blue for Super Admin
              unselectedItemColor: AppColors.textMuted,
              selectedLabelStyle: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                height: 1.3,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w500,
                height: 1.3,
              ),
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined, size: 21),
                  activeIcon: Icon(Icons.dashboard_rounded, size: 21),
                  label: 'Dashboard',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.manage_accounts_outlined, size: 21),
                  activeIcon: Icon(Icons.manage_accounts_rounded, size: 21),
                  label: 'Users',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.solar_power_outlined, size: 21),
                  activeIcon: Icon(Icons.solar_power_rounded, size: 21),
                  label: 'Leads',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.bar_chart_outlined, size: 21),
                  activeIcon: Icon(Icons.bar_chart_rounded, size: 21),
                  label: 'Reports',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.settings_outlined, size: 21),
                  activeIcon: Icon(Icons.settings_rounded, size: 21),
                  label: 'Settings',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
