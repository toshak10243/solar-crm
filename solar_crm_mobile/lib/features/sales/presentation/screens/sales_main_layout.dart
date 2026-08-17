import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import 'sales_dashboard_screen.dart';
import 'sales_leads_screen.dart';
import 'sales_profile_screen.dart';

class SalesMainLayout extends StatefulWidget {
  const SalesMainLayout({Key? key}) : super(key: key);

  @override
  State<SalesMainLayout> createState() => _SalesMainLayoutState();
}

class _SalesMainLayoutState extends State<SalesMainLayout> {
  int _currentIndex = 0;

  // 🟢 3 Main Screens for Sales Portal
  final List<Widget> _screens = const [
    SalesDashboardScreen(),
    SalesLeadsScreen(),
    SalesProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),

      // 🟢 PREMIUM FOOTER / BOTTOM NAVIGATION BAR
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
              selectedItemColor: AppColors.primary,
              unselectedItemColor: AppColors.textMuted,
              selectedLabelStyle: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                height: 1.5,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                height: 1.5,
              ),
              items: const [
                // Tab 1: Dashboard
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined, size: 22),
                  activeIcon: Icon(Icons.dashboard_rounded, size: 22),
                  label: 'Dashboard',
                ),
                // Tab 2: Leads
                BottomNavigationBarItem(
                  icon: Icon(Icons.assignment_outlined, size: 22),
                  activeIcon: Icon(Icons.assignment_rounded, size: 22),
                  label: 'My Leads',
                ),
                // Tab 3: Profile
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline_rounded, size: 22),
                  activeIcon: Icon(Icons.person_rounded, size: 22),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
