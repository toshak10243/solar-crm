import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../data/manager_dashboard_service.dart';

class ManagerDashboardScreen extends ConsumerStatefulWidget {
  const ManagerDashboardScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ManagerDashboardScreen> createState() =>
      _ManagerDashboardScreenState();
}

class _ManagerDashboardScreenState
    extends ConsumerState<ManagerDashboardScreen> {
  final ManagerDashboardService _service = ManagerDashboardService();
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _errorMessage;

  String _timeRange = 'this_month';
  Map<String, dynamic>? _dashboardData;

  // Pagination
  static const int _rowsPerPage = 5;
  int _teamPage = 0;
  int _followupPage = 0;

  // Reassign bottom-sheet state
  bool _isReassigning = false;

  final List<Color> _chartColors = const [
    AppColors.primary,
    AppColors.info,
    AppColors.warning,
    AppColors.purple,
    AppColors.success,
    AppColors.danger,
  ];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      // Reset to first page whenever the search term changes.
      if (_teamPage != 0) setState(() => _teamPage = 0);
      setState(() {});
    });
    _fetchDashboardStats();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchDashboardStats({bool isManual = false}) async {
    if (isManual) {
      setState(() => _isRefreshing = true);
    } else {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    final res = await _service.getDashboardStats(timeRange: _timeRange);

    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _dashboardData = res['data'] as Map<String, dynamic>?;
        _isLoading = false;
        _isRefreshing = false;
        _teamPage = 0;
        _followupPage = 0;
      });
      if (isManual) _showNotification('Dashboard metrics refreshed!');
    } else {
      setState(() {
        _errorMessage =
            res['message']?.toString() ?? 'Error loading dashboard.';
        _isLoading = false;
        _isRefreshing = false;
      });
    }
  }

  Future<void> _makePhoneCall(String? mobile) async {
    if (mobile == null || mobile.trim().isEmpty) {
      _showNotification('No phone number available for this lead.',
          isError: true);
      return;
    }
    final Uri url = Uri.parse('tel:${mobile.trim()}');
    try {
      final launched =
          await launchUrl(url, mode: LaunchMode.externalApplication);
      if (!launched) {
        _showNotification('Unable to start a call on this device.',
            isError: true);
      }
    } catch (_) {
      _showNotification('Unable to start a call on this device.',
          isError: true);
    }
  }

  void _showReassignModal(
      dynamic leadId, String customerName, String leadCode) {
    final teamList = (_dashboardData?['teamPerformance'] as List?) ?? [];
    dynamic newAssigneeId;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Reassign Follow-up Lead',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  color: AppColors.primaryDark,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Reassign "$customerName" ($leadCode) to another sales representative in your team.',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: newAssigneeId,
                decoration: InputDecoration(
                  labelText: 'Select Team Executive',
                  filled: true,
                  fillColor: AppColors.bg,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                ),
                items: teamList.map<DropdownMenuItem<String>>((m) {
                  return DropdownMenuItem<String>(
                    value: m['id']?.toString(),
                    child: Text(m['full_name']?.toString() ?? 'Sales Rep'),
                  );
                }).toList(),
                onChanged: (val) => setSheetState(() => newAssigneeId = val),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: (_isReassigning || newAssigneeId == null)
                      ? null
                      : () async {
                          setSheetState(() => _isReassigning = true);
                          final res = await _service.reassignLead(
                              leadId, newAssigneeId);
                          setSheetState(() => _isReassigning = false);

                          if (!mounted) return;
                          Navigator.pop(ctx);

                          if (res['success'] == true) {
                            _showNotification(
                              res['message']?.toString() ??
                                  'Lead reassigned successfully!',
                            );
                            _fetchDashboardStats(isManual: true);
                          } else {
                            _showNotification(
                              res['message']?.toString() ??
                                  'Failed to reassign lead.',
                              isError: true,
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: _isReassigning
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Confirm Reassign',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showNotification(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: Colors.white,
          ),
        ),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _exportTeamPerformanceCsv(List teamPerformance) async {
    if (teamPerformance.isEmpty) {
      _showNotification('No performance data available to export.',
          isError: true);
      return;
    }

    final buffer = StringBuffer();
    buffer.writeln(
      'Sales Rep,Total Assigned,Converted (Won),Lost Deals,In Progress,Conversion Rate %,Revenue (INR)',
    );

    for (final rep in teamPerformance) {
      final assigned =
          int.tryParse(rep['total_assigned']?.toString() ?? '0') ?? 0;
      final converted = int.tryParse(rep['converted']?.toString() ?? '0') ?? 0;
      final lost = int.tryParse(rep['lost']?.toString() ?? '0') ?? 0;
      final inProgress =
          int.tryParse(rep['in_progress']?.toString() ?? '0') ?? 0;
      final rate = assigned > 0
          ? ((converted / assigned) * 100).toStringAsFixed(1)
          : '0.0';
      final revenue = rep['revenue']?.toString() ?? '0';
      final name =
          (rep['full_name']?.toString() ?? 'Sales Rep').replaceAll(',', ' ');

      buffer.writeln(
          '"$name",$assigned,$converted,$lost,$inProgress,$rate%,$revenue');
    }

    final fileName =
        'Team_Performance_Report_${DateTime.now().toIso8601String().split('T').first}.csv';

    await Share.share(buffer.toString(), subject: fileName);
  }

  String _getInitials(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return 'M';
    final parts =
        trimmed.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return 'M';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  String _formatCurrency(dynamic val) {
    final parsedNum = num.tryParse(val?.toString() ?? '0') ?? 0;
    final str = parsedNum.toStringAsFixed(0);
    // Simple Indian-style thousands separators (e.g. 12,34,567)
    final buf = StringBuffer();
    final isNegative = str.startsWith('-');
    final digits = isNegative ? str.substring(1) : str;
    for (int i = 0; i < digits.length; i++) {
      final posFromEnd = digits.length - i;
      buf.write(digits[i]);
      if (posFromEnd > 3 && (posFromEnd - 3) % 2 == 0) {
        buf.write(',');
      }
    }
    return '${isNegative ? '-' : ''}₹${buf.toString()}';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final userName = user?['full_name'] ?? user?['name'] ?? 'Manager';

    final teamPerformance = (_dashboardData?['teamPerformance'] as List?) ?? [];
    final statusBreakdown = (_dashboardData?['statusBreakdown'] as List?) ?? [];
    final todaysFollowupsList =
        (_dashboardData?['todaysFollowupsList'] as List?) ?? [];
    final recentActivity = (_dashboardData?['recentActivity'] as List?) ?? [];

    final int pendingToday =
        int.tryParse(_dashboardData?['pendingToday']?.toString() ?? '0') ?? 0;
    final int convertedToday =
        int.tryParse(_dashboardData?['convertedToday']?.toString() ?? '0') ?? 0;
    final int overdueFollowups =
        int.tryParse(_dashboardData?['overdueFollowups']?.toString() ?? '0') ??
            0;

    final int totalTeamMembers = teamPerformance.length;
    final int totalAssignedLeads = teamPerformance.fold<int>(
      0,
      (sum, item) =>
          sum + (int.tryParse(item['total_assigned']?.toString() ?? '0') ?? 0),
    );
    final int totalConvertedDeals = teamPerformance.fold<int>(
      0,
      (sum, item) =>
          sum + (int.tryParse(item['converted']?.toString() ?? '0') ?? 0),
    );
    final num totalRevenue = teamPerformance.fold<num>(
      0,
      (sum, item) =>
          sum + (num.tryParse(item['revenue']?.toString() ?? '0') ?? 0),
    );

    final double overallWinRate = totalAssignedLeads > 0
        ? ((totalConvertedDeals / totalAssignedLeads) * 100)
        : 0.0;

    final search = _searchController.text.trim().toLowerCase();
    final filteredTeam = search.isEmpty
        ? teamPerformance
        : teamPerformance
            .where((m) => (m['full_name']?.toString().toLowerCase() ?? '')
                .contains(search))
            .toList();

    final teamPageItems = _paginate(filteredTeam, _teamPage, _rowsPerPage);
    final followupPageItems =
        _paginate(todaysFollowupsList, _followupPage, _rowsPerPage);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Manager Control Center',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Welcome, $userName',
                style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500)),
          ],
        ),
        elevation: 0,
        backgroundColor: AppColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.ios_share_rounded,
                color: AppColors.primary, size: 20),
            tooltip: 'Export Team Performance',
            onPressed: () => _exportTeamPerformanceCsv(teamPerformance),
          ),
          IconButton(
            icon: _isRefreshing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.primary))
                : const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: _isRefreshing
                ? null
                : () => _fetchDashboardStats(isManual: true),
            tooltip: 'Refresh Metrics',
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5))
            : RefreshIndicator(
                onRefresh: () => _fetchDashboardStats(isManual: true),
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_errorMessage != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                              color: AppColors.dangerSoft,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: AppColors.danger.withOpacity(0.3))),
                          child: Text(_errorMessage!,
                              style: const TextStyle(
                                  color: AppColors.danger,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12.5)),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Time Range Selector
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('PERFORMANCE OVERVIEW',
                              style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textSecondary,
                                  letterSpacing: 0.5)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.border)),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _timeRange,
                                style: const TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary),
                                items: const [
                                  DropdownMenuItem(
                                      value: 'today', child: Text('Today')),
                                  DropdownMenuItem(
                                      value: 'this_week',
                                      child: Text('This Week')),
                                  DropdownMenuItem(
                                      value: 'this_month',
                                      child: Text('This Month')),
                                  DropdownMenuItem(
                                      value: 'this_year',
                                      child: Text('Year 2026')),
                                ],
                                onChanged: (val) {
                                  if (val != null && val != _timeRange) {
                                    setState(() => _timeRange = val);
                                    _fetchDashboardStats();
                                  }
                                },
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      // 1. KPI SUMMARY CARDS
                      GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.55,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildKpiCard(
                              'TEAM CAPACITY',
                              '$totalTeamMembers Execs',
                              'Active Sales Reps',
                              Icons.groups_rounded,
                              AppColors.info,
                              AppColors.infoSoft),
                          _buildKpiCard(
                              'TODAY FOLLOW-UPS',
                              '$pendingToday',
                              overdueFollowups > 0
                                  ? '$overdueFollowups Overdue!'
                                  : 'Scheduled Today',
                              Icons.pending_actions_rounded,
                              AppColors.warning,
                              AppColors.warningSoft),
                          _buildKpiCard(
                              'WON TODAY',
                              '$convertedToday Deals',
                              'Closed successfully',
                              Icons.check_circle_outline_rounded,
                              AppColors.success,
                              AppColors.successSoft),
                          _buildKpiCard(
                              'TEAM REVENUE',
                              _formatCurrency(totalRevenue),
                              'Win Rate: ${overallWinRate.toStringAsFixed(1)}%',
                              Icons.trending_up_rounded,
                              AppColors.primary,
                              AppColors.primarySoft),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 2. PIPELINE STAGE DISTRIBUTION (Bar Chart)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('PIPELINE STAGE DISTRIBUTION',
                                    style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.textSecondary,
                                        letterSpacing: 0.5)),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                      color: AppColors.primarySoft,
                                      borderRadius: BorderRadius.circular(6)),
                                  child: Text('$totalAssignedLeads Leads',
                                      style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primary)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              height: 150,
                              child: statusBreakdown.isEmpty
                                  ? const Center(
                                      child: Text('No pipeline data',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textMuted)))
                                  : BarChart(
                                      BarChartData(
                                        alignment:
                                            BarChartAlignment.spaceAround,
                                        maxY:
                                            (_maxStatusCount(statusBreakdown) +
                                                    2)
                                                .toDouble(),
                                        barTouchData:
                                            BarTouchData(enabled: false),
                                        titlesData: FlTitlesData(
                                          show: true,
                                          bottomTitles: AxisTitles(
                                            sideTitles: SideTitles(
                                              showTitles: true,
                                              getTitlesWidget: (value, meta) {
                                                final index = value.toInt();
                                                if (index >= 0 &&
                                                    index <
                                                        statusBreakdown
                                                            .length) {
                                                  final status =
                                                      statusBreakdown[index]
                                                                  ['status']
                                                              ?.toString() ??
                                                          '';
                                                  return Padding(
                                                    padding:
                                                        const EdgeInsets.only(
                                                            top: 4),
                                                    child: Text(
                                                      status.length > 6
                                                          ? '${status.substring(0, 5)}..'
                                                          : status,
                                                      style: const TextStyle(
                                                          fontSize: 9,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          color: AppColors
                                                              .textSecondary),
                                                    ),
                                                  );
                                                }
                                                return const SizedBox();
                                              },
                                            ),
                                          ),
                                          leftTitles: const AxisTitles(
                                              sideTitles: SideTitles(
                                                  showTitles: false)),
                                          topTitles: const AxisTitles(
                                              sideTitles: SideTitles(
                                                  showTitles: false)),
                                          rightTitles: const AxisTitles(
                                              sideTitles: SideTitles(
                                                  showTitles: false)),
                                        ),
                                        gridData: const FlGridData(show: false),
                                        borderData: FlBorderData(show: false),
                                        barGroups: statusBreakdown
                                            .asMap()
                                            .entries
                                            .map((entry) {
                                          final idx = entry.key;
                                          final count = int.tryParse(entry
                                                      .value['count']
                                                      ?.toString() ??
                                                  '0') ??
                                              0;
                                          return BarChartGroupData(
                                            x: idx,
                                            barRods: [
                                              BarChartRodData(
                                                toY: count.toDouble(),
                                                color: _chartColors[
                                                    idx % _chartColors.length],
                                                width: 16,
                                                borderRadius:
                                                    const BorderRadius.vertical(
                                                        top:
                                                            Radius.circular(4)),
                                              )
                                            ],
                                          );
                                        }).toList(),
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 3. TEAM DEAL CONVERSIONS (Donut Chart)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('CONVERSION COMPARISON BY SALES REP',
                                style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textSecondary,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 14),
                            SizedBox(
                              height: 150,
                              child: teamPerformance.isEmpty
                                  ? const Center(
                                      child: Text('No rep conversion data',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textMuted)))
                                  : Row(
                                      children: [
                                        Expanded(
                                          child: PieChart(
                                            PieChartData(
                                              sectionsSpace: 2,
                                              centerSpaceRadius: 32,
                                              sections: teamPerformance
                                                  .asMap()
                                                  .entries
                                                  .map((entry) {
                                                final idx = entry.key;
                                                final won = int.tryParse(entry
                                                            .value['converted']
                                                            ?.toString() ??
                                                        '0') ??
                                                    0;
                                                return PieChartSectionData(
                                                  color: _chartColors[idx %
                                                      _chartColors.length],
                                                  value: won > 0
                                                      ? won.toDouble()
                                                      : 0.1,
                                                  title: '$won',
                                                  radius: 28,
                                                  titleStyle: const TextStyle(
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: Colors.white),
                                                );
                                              }).toList(),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: teamPerformance
                                              .asMap()
                                              .entries
                                              .take(4)
                                              .map((entry) {
                                            final idx = entry.key;
                                            final name = entry
                                                    .value['full_name']
                                                    ?.toString() ??
                                                'Rep';
                                            return Padding(
                                              padding: const EdgeInsets.only(
                                                  bottom: 6),
                                              child: Row(
                                                children: [
                                                  Container(
                                                      width: 8,
                                                      height: 8,
                                                      decoration: BoxDecoration(
                                                          color: _chartColors[
                                                              idx %
                                                                  _chartColors
                                                                      .length],
                                                          shape:
                                                              BoxShape.circle)),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                      name.length > 12
                                                          ? '${name.substring(0, 11)}..'
                                                          : name,
                                                      style: const TextStyle(
                                                          fontSize: 11,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          color: AppColors
                                                              .textPrimary)),
                                                ],
                                              ),
                                            );
                                          }).toList(),
                                        ),
                                      ],
                                    ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 4. TEAM PERFORMANCE & CONVERSION TRACKER
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('TEAM PERFORMANCE',
                                    style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.primaryDark,
                                        letterSpacing: 0.5)),
                                SizedBox(
                                  width: 140,
                                  height: 32,
                                  child: TextField(
                                    controller: _searchController,
                                    style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600),
                                    decoration: InputDecoration(
                                      hintText: 'Search rep...',
                                      hintStyle: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textMuted),
                                      prefixIcon: const Icon(
                                          Icons.search_rounded,
                                          size: 16,
                                          color: AppColors.textMuted),
                                      prefixIconConstraints:
                                          const BoxConstraints(
                                              minWidth: 30, minHeight: 30),
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 4, vertical: 4),
                                      filled: true,
                                      fillColor: AppColors.bg,
                                      border: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(6),
                                          borderSide: BorderSide.none),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            if (filteredTeam.isEmpty)
                              const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: Text(
                                          'No sales executive records match.',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textSecondary))))
                            else ...[
                              ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: teamPageItems.length,
                                itemBuilder: (context, index) {
                                  // Wrapped in try/catch so a single malformed
                                  // record from the API can never blank out
                                  // the whole list (Flutter otherwise swaps a
                                  // failing item for an invisible ErrorWidget
                                  // in release builds).
                                  try {
                                    final rawRep = teamPageItems[index];
                                    final Map<String, dynamic> rep =
                                        rawRep is Map
                                            ? Map<String, dynamic>.from(rawRep)
                                            : <String, dynamic>{};

                                    final name = rep['full_name']?.toString() ??
                                        'Sales Rep';
                                    final assigned = int.tryParse(
                                            rep['total_assigned']?.toString() ??
                                                '0') ??
                                        0;
                                    final won = int.tryParse(
                                            rep['converted']?.toString() ??
                                                '0') ??
                                        0;
                                    final inProgress = int.tryParse(
                                            rep['in_progress']?.toString() ??
                                                '0') ??
                                        0;
                                    final revenue = rep['revenue'];
                                    final double winRate = assigned > 0
                                        ? ((won / assigned) * 100)
                                        : 0.0;

                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 10),
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                          color: AppColors.bg,
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          border: Border.all(
                                              color: AppColors.border)),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 18,
                                            backgroundColor:
                                                AppColors.primaryDark,
                                            child: Text(_getInitials(name),
                                                style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 11)),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(name,
                                                    style: const TextStyle(
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        fontSize: 13,
                                                        color: AppColors
                                                            .textPrimary)),
                                                Text(
                                                    'Assigned: $assigned • Active: $inProgress • Won: $won',
                                                    style: const TextStyle(
                                                        fontSize: 11,
                                                        color: AppColors
                                                            .textSecondary)),
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.end,
                                            children: [
                                              Text(_formatCurrency(revenue),
                                                  style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      fontSize: 12,
                                                      color:
                                                          AppColors.primary)),
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 6,
                                                        vertical: 2),
                                                margin: const EdgeInsets.only(
                                                    top: 2),
                                                decoration: BoxDecoration(
                                                    color: winRate >= 25
                                                        ? AppColors.successSoft
                                                        : AppColors.warningSoft,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            4)),
                                                child: Text(
                                                    '${winRate.toStringAsFixed(1)}% Win',
                                                    style: TextStyle(
                                                        fontSize: 9.5,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color: winRate >= 25
                                                            ? AppColors.success
                                                            : AppColors
                                                                .warning)),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    );
                                  } catch (e, st) {
                                    debugPrint(
                                        'Team performance item render error: $e\n$st');
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 10),
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: AppColors.dangerSoft,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                            color: AppColors.danger
                                                .withOpacity(0.3)),
                                      ),
                                      child: const Text(
                                        'Could not load this team member (unexpected data format from server).',
                                        style: TextStyle(
                                            fontSize: 11,
                                            color: AppColors.danger,
                                            fontWeight: FontWeight.w600),
                                      ),
                                    );
                                  }
                                },
                              ),
                              _PaginationBar(
                                currentPage: _teamPage,
                                totalItems: filteredTeam.length,
                                pageSize: _rowsPerPage,
                                onPageChanged: (p) =>
                                    setState(() => _teamPage = p),
                              ),
                            ],
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      const SizedBox(height: 16),

                      // 6. REAL-TIME AUDIT FEED
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('REAL-TIME TEAM AUDIT FEED',
                                    style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.primaryDark,
                                        letterSpacing: 0.5)),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                      color: AppColors.primarySoft,
                                      borderRadius: BorderRadius.circular(6)),
                                  child: const Text('Live',
                                      style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primary)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            if (recentActivity.isEmpty)
                              const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: Text('No audit logs recorded yet.',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textSecondary))))
                            else
                              SizedBox(
                                height: 260,
                                child: ListView.builder(
                                  physics: const BouncingScrollPhysics(),
                                  itemCount: recentActivity.length,
                                  itemBuilder: (context, index) {
                                    try {
                                      final rawLog = recentActivity[index];
                                      final Map<String, dynamic> log = rawLog
                                              is Map
                                          ? Map<String, dynamic>.from(rawLog)
                                          : <String, dynamic>{};

                                      final action =
                                          log['action']?.toString() ??
                                              log['action_type']?.toString() ??
                                              'Activity';
                                      final lead = log['lead']?.toString() ??
                                          log['customer_name']?.toString() ??
                                          'Lead Record';
                                      final by = log['by']?.toString() ??
                                          log['performed_by_name']
                                              ?.toString() ??
                                          log['user_name']?.toString() ??
                                          'Sales Rep';
                                      final rawTime =
                                          log['time'] ?? log['created_at'];
                                      final timeLabel = _formatTime(rawTime);

                                      return Container(
                                        margin:
                                            const EdgeInsets.only(bottom: 8),
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                            color: AppColors.bg,
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            border: Border.all(
                                                color: AppColors.border)),
                                        child: Row(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            CircleAvatar(
                                              radius: 14,
                                              backgroundColor:
                                                  AppColors.primaryDark,
                                              child: Text(_getInitials(by),
                                                  style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      fontSize: 9)),
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .spaceBetween,
                                                    children: [
                                                      Expanded(
                                                        child: Text(action,
                                                            style: const TextStyle(
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w700,
                                                                fontSize: 12,
                                                                color: AppColors
                                                                    .textPrimary)),
                                                      ),
                                                      if (timeLabel.isNotEmpty)
                                                        Text(timeLabel,
                                                            style: const TextStyle(
                                                                fontSize: 9.5,
                                                                color: AppColors
                                                                    .textMuted)),
                                                    ],
                                                  ),
                                                  Text(lead,
                                                      style: const TextStyle(
                                                          fontSize: 11,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                          color: AppColors
                                                              .primary)),
                                                  Text('Logged by $by',
                                                      style: const TextStyle(
                                                          fontSize: 10.5,
                                                          color: AppColors
                                                              .textSecondary)),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    } catch (e, st) {
                                      debugPrint(
                                          'Audit feed item render error: $e\n$st');
                                      return Container(
                                        margin:
                                            const EdgeInsets.only(bottom: 8),
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: AppColors.dangerSoft,
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          border: Border.all(
                                              color: AppColors.danger
                                                  .withOpacity(0.3)),
                                        ),
                                        child: const Text(
                                          'Could not load this activity entry.',
                                          style: TextStyle(
                                              fontSize: 11,
                                              color: AppColors.danger,
                                              fontWeight: FontWeight.w600),
                                        ),
                                      );
                                    }
                                  },
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  List _paginate(List items, int page, int pageSize) {
    if (items.isEmpty) return const [];
    final start = page * pageSize;
    if (start >= items.length) return const [];
    final end = (start + pageSize).clamp(0, items.length);
    return items.sublist(start, end);
  }

  int _maxStatusCount(List statusBreakdown) {
    int max = 0;
    for (final item in statusBreakdown) {
      final count = int.tryParse(item['count']?.toString() ?? '0') ?? 0;
      if (count > max) max = count;
    }
    return max;
  }

  String _formatTime(dynamic rawTime) {
    if (rawTime == null) return '';
    final parsed = DateTime.tryParse(rawTime.toString());
    if (parsed == null) return '';
    final local = parsed.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final period = local.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  Widget _buildKpiCard(String label, String value, String sub, IconData icon,
      Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(label,
                    style: const TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
              ),
              CircleAvatar(
                  radius: 12,
                  backgroundColor: bg,
                  child: Icon(icon, size: 13, color: color)),
            ],
          ),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value,
                maxLines: 1,
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary)),
          ),
          Text(sub,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  fontSize: 9.5, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}

/// Compact "X-Y of Z" pagination control used under the team and
/// follow-up lists, mirroring the desktop TablePagination behaviour.
class _PaginationBar extends StatelessWidget {
  final int currentPage; // 0-indexed
  final int totalItems;
  final int pageSize;
  final ValueChanged<int> onPageChanged;

  const _PaginationBar({
    required this.currentPage,
    required this.totalItems,
    required this.pageSize,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (totalItems == 0) return const SizedBox.shrink();
    final totalPages = (totalItems / pageSize).ceil();
    final start = currentPage * pageSize + 1;
    final end = ((currentPage + 1) * pageSize).clamp(0, totalItems);

    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('$start-$end of $totalItems',
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary)),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded, size: 20),
                color:
                    currentPage == 0 ? AppColors.textMuted : AppColors.primary,
                onPressed: currentPage == 0
                    ? null
                    : () => onPageChanged(currentPage - 1),
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(4),
              ),
              Text('${currentPage + 1}/$totalPages',
                  style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
              IconButton(
                icon: const Icon(Icons.chevron_right_rounded, size: 20),
                color: currentPage >= totalPages - 1
                    ? AppColors.textMuted
                    : AppColors.primary,
                onPressed: currentPage >= totalPages - 1
                    ? null
                    : () => onPageChanged(currentPage + 1),
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(4),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
