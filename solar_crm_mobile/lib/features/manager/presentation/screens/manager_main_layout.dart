import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

// Manager Screens
import 'manager_dashboard_screen.dart';
import 'manager_leads_screen.dart';
import 'team_followups_screen.dart';
import 'team_members_screen.dart';
import 'manager_reports_screen.dart';
import 'manager_profile_screen.dart';

class ManagerMainLayout extends StatefulWidget {
  const ManagerMainLayout({Key? key}) : super(key: key);

  @override
  State<ManagerMainLayout> createState() => _ManagerMainLayoutState();
}

class _ManagerMainLayoutState extends State<ManagerMainLayout> {
  int _currentIndex = 0;

  // 🟢 6 Main Manager Portal Screens
  final List<Widget> _screens = const [
    ManagerDashboardScreen(),
    ManagerLeadsScreen(),
    TeamFollowupsScreen(),
    TeamMembersScreen(),
    ManagerReportsScreen(),
    ManagerProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),

      // 🟢 MANAGER FOOTER / BOTTOM NAVIGATION BAR (FIXED 6 TABS)
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
              selectedItemColor: AppColors.primary,
              unselectedItemColor: AppColors.textMuted,
              selectedLabelStyle: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                height: 1.3,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                height: 1.3,
              ),
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined, size: 20),
                  activeIcon: Icon(Icons.dashboard_rounded, size: 20),
                  label: 'Dashboard',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.assignment_outlined, size: 20),
                  activeIcon: Icon(Icons.assignment_rounded, size: 20),
                  label: 'Leads',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.event_note_outlined, size: 20),
                  activeIcon: Icon(Icons.event_note_rounded, size: 20),
                  label: 'Followups',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.groups_outlined, size: 20),
                  activeIcon: Icon(Icons.groups_rounded, size: 20),
                  label: 'Team',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.bar_chart_outlined, size: 20),
                  activeIcon: Icon(Icons.bar_chart_rounded, size: 20),
                  label: 'Reports',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline_rounded, size: 20),
                  activeIcon: Icon(Icons.person_rounded, size: 20),
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
