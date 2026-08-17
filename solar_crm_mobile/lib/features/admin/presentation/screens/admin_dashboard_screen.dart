import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../data/admin_dashboard_service.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  final AdminDashboardService _service = AdminDashboardService();

  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _errorMessage;
  Map<String, dynamic>? _statsData;

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
    _fetchDashboardStats();
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

    final res = await _service.getAdminDashboardStats();

    if (mounted) {
      if (res['success'] == true) {
        setState(() {
          _statsData = res['data'] as Map<String, dynamic>?;
          _isLoading = false;
          _isRefreshing = false;
        });
        if (isManual) _showNotification('Dashboard stats refreshed!');
      } else {
        setState(() {
          _errorMessage =
              res['message']?.toString() ?? 'Failed to load dashboard.';
          _isLoading = false;
          _isRefreshing = false;
        });
      }
    }
  }

  void _showNotification(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message,
            style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: Colors.white)),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  String _formatCapacity(dynamic kw) {
    final parsedKw = num.tryParse(kw?.toString() ?? '0') ?? 0;
    if (parsedKw >= 1000) {
      return '${(parsedKw / 1000).toStringAsFixed(2)} MW';
    }
    return '${parsedKw.toStringAsFixed(1)} kW';
  }

  String _formatCurrency(dynamic val) {
    final parsedNum = num.tryParse(val?.toString() ?? '0') ?? 0;
    if (parsedNum >= 10000000)
      return '₹${(parsedNum / 10000000).toStringAsFixed(2)} Cr';
    if (parsedNum >= 100000)
      return '₹${(parsedNum / 100000).toStringAsFixed(2)} L';
    return '₹${parsedNum.toStringAsFixed(0)}';
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'A';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  String _formatRelativeTime(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Just now';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final diffMins = DateTime.now().difference(date).inMinutes;
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return '$diffMins min ago';
      final diffHours = (diffMins / 60).floor();
      if (diffHours < 24) return '$diffHours hr ago';
      final diffDays = (diffHours / 24).floor();
      if (diffDays < 7) return '$diffDays day${diffDays > 1 ? 's' : ''} ago';
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
      return '${date.day.toString().padLeft(2, '0')} ${months[date.month - 1]}';
    } catch (_) {
      return 'Recently';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final userName = user?['full_name'] ?? user?['name'] ?? 'Super Admin';

    final int totalLeads =
        int.tryParse(_statsData?['total_leads']?.toString() ?? '0') ?? 0;
    final int wonLeads =
        int.tryParse(_statsData?['won_leads']?.toString() ?? '0') ?? 0;
    final int activeLeads =
        int.tryParse(_statsData?['active_leads']?.toString() ?? '0') ?? 0;
    final int totalManagers =
        int.tryParse(_statsData?['total_managers']?.toString() ?? '0') ?? 0;
    final int totalSales =
        int.tryParse(_statsData?['total_sales']?.toString() ?? '0') ?? 0;
    final dynamic totalRevenue = _statsData?['total_revenue'];
    final dynamic installedKw = _statsData?['total_installed_kw'];

    final double winRate =
        totalLeads > 0 ? ((wonLeads / totalLeads) * 100) : 0.0;
    final int totalMembers = totalManagers + totalSales;

    final statusBreakdown = (_statsData?['statusBreakdown'] as List?) ?? [];
    final sourcePerformance = (_statsData?['sourcePerformance'] as List?) ?? [];
    final monthlyTrend = (_statsData?['monthlyTrend'] as List?) ?? [];
    final recentLeads = (_statsData?['recentLeads'] as List?) ?? [];
    final activityFeed = (_statsData?['activityFeed'] as List?) ?? [];

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Admin Control Center',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Welcome back, $userName',
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
            icon: _isRefreshing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.primary))
                : const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () => _fetchDashboardStats(isManual: true),
            tooltip: 'Refresh Dashboard',
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.danger),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
            tooltip: 'Logout',
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

                      // 1. STAT CARDS
                      GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.7,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildKpiCard(
                              'SOLAR CAPACITY WON',
                              _formatCapacity(installedKw),
                              'Across $wonLeads closed deals',
                              Icons.wb_sunny_outlined,
                              AppColors.info,
                              AppColors.infoSoft),
                          _buildKpiCard(
                              'TOTAL LEADS',
                              '$totalLeads',
                              '$activeLeads Active Pipeline',
                              Icons.trending_up_rounded,
                              AppColors.primary,
                              AppColors.primarySoft),
                          _buildKpiCard(
                              'REVENUE WON',
                              _formatCurrency(totalRevenue),
                              '${winRate.toStringAsFixed(1)}% Conversion',
                              Icons.monetization_on_outlined,
                              AppColors.warning,
                              AppColors.warningSoft),
                          _buildKpiCard(
                              'ACTIVE USERS',
                              '$totalMembers Members',
                              '$totalManagers Mgrs • $totalSales Reps',
                              Icons.groups_rounded,
                              AppColors.purple,
                              AppColors.purpleSoft),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 2. VISUAL CHARTS
                      // Chart 1: Monthly Lead Trends
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('MONTHLY LEADS TREND (CREATED VS WON)',
                                style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryDark,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 16),
                            SizedBox(
                              height: 160,
                              child: monthlyTrend.isEmpty
                                  ? const Center(
                                      child: Text('No monthly trend data.',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textMuted)))
                                  : LineChart(
                                      LineChartData(
                                        gridData: const FlGridData(show: false),
                                        borderData: FlBorderData(show: false),
                                        titlesData: FlTitlesData(
                                          show: true,
                                          bottomTitles: AxisTitles(
                                            sideTitles: SideTitles(
                                              showTitles: true,
                                              getTitlesWidget: (val, meta) {
                                                final idx = val.toInt();
                                                if (idx >= 0 &&
                                                    idx < monthlyTrend.length) {
                                                  final month =
                                                      monthlyTrend[idx]['month']
                                                              ?.toString() ??
                                                          '';
                                                  return Padding(
                                                    padding:
                                                        const EdgeInsets.only(
                                                            top: 4),
                                                    child: Text(month,
                                                        style: const TextStyle(
                                                            fontSize: 9,
                                                            fontWeight:
                                                                FontWeight.w700,
                                                            color: AppColors
                                                                .textSecondary)),
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
                                        lineBarsData: [
                                          // Created Line
                                          LineChartBarData(
                                            spots: monthlyTrend
                                                .asMap()
                                                .entries
                                                .map((e) {
                                              final created = double.tryParse(
                                                      e.value['leads_created']
                                                              ?.toString() ??
                                                          '0') ??
                                                  0.0;
                                              return FlSpot(
                                                  e.key.toDouble(), created);
                                            }).toList(),
                                            isCurved: true,
                                            color: AppColors.primary,
                                            barWidth: 3,
                                            isStrokeCapRound: true,
                                            dotData:
                                                const FlDotData(show: true),
                                            belowBarData: BarAreaData(
                                                show: true,
                                                color: AppColors.primary
                                                    .withOpacity(0.15)),
                                          ),
                                          // Won Line
                                          LineChartBarData(
                                            spots: monthlyTrend
                                                .asMap()
                                                .entries
                                                .map((e) {
                                              final won = double.tryParse(e
                                                          .value['leads_won']
                                                          ?.toString() ??
                                                      '0') ??
                                                  0.0;
                                              return FlSpot(
                                                  e.key.toDouble(), won);
                                            }).toList(),
                                            isCurved: true,
                                            color: AppColors.success,
                                            barWidth: 3,
                                            isStrokeCapRound: true,
                                            dotData:
                                                const FlDotData(show: true),
                                            belowBarData: BarAreaData(
                                                show: true,
                                                color: AppColors.success
                                                    .withOpacity(0.15)),
                                          ),
                                        ],
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Chart 2: Pipeline Stages Donut Chart
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
                                const Text('PIPELINE STAGES',
                                    style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.primaryDark,
                                        letterSpacing: 0.5)),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                      color: AppColors.successSoft,
                                      borderRadius: BorderRadius.circular(6)),
                                  child: Text(
                                      '${winRate.toStringAsFixed(1)}% Won',
                                      style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.success)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            SizedBox(
                              height: 150,
                              child: statusBreakdown.isEmpty
                                  ? const Center(
                                      child: Text('No pipeline stages data.',
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
                                              sections: statusBreakdown
                                                  .asMap()
                                                  .entries
                                                  .map((entry) {
                                                final idx = entry.key;
                                                final count = int.tryParse(entry
                                                            .value['count']
                                                            ?.toString() ??
                                                        '0') ??
                                                    0;
                                                return PieChartSectionData(
                                                  color: _chartColors[idx %
                                                      _chartColors.length],
                                                  value: count > 0
                                                      ? count.toDouble()
                                                      : 0.1,
                                                  title: '$count',
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
                                          children:
                                              statusBreakdown.take(4).map((sb) {
                                            final st =
                                                sb['status']?.toString() ??
                                                    'Stage';
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
                                                              statusBreakdown
                                                                      .indexOf(
                                                                          sb) %
                                                                  _chartColors
                                                                      .length],
                                                          shape:
                                                              BoxShape.circle)),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                      st.length > 12
                                                          ? '${st.substring(0, 11)}..'
                                                          : st,
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

                      // 3. RECENT LEADS LIST
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('RECENT LEADS ACROSS ORGANIZATION',
                                style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryDark,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 12),
                            recentLeads.isEmpty
                                ? const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Center(
                                        child: Text('No recent leads created.',
                                            style: TextStyle(
                                                fontSize: 12,
                                                color:
                                                    AppColors.textSecondary))))
                                : ListView.builder(
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    itemCount: recentLeads.take(5).length,
                                    itemBuilder: (context, index) {
                                      final lead = recentLeads[index];
                                      final code =
                                          lead['lead_code']?.toString() ??
                                              '#LD';
                                      final name =
                                          lead['customer_name']?.toString() ??
                                              'Customer';
                                      final rep = lead['assigned_to_name']
                                              ?.toString() ??
                                          'Unassigned';
                                      final status =
                                          lead['status']?.toString() ??
                                              'New Lead';
                                      final amt = lead['quotation_amount'];

                                      return Container(
                                        margin:
                                            const EdgeInsets.only(bottom: 8),
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                            color: AppColors.bg,
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            border: Border.all(
                                                color: AppColors.border)),
                                        child: Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 16,
                                              backgroundColor:
                                                  AppColors.primaryDark,
                                              child: Text(_getInitials(name),
                                                  style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      fontSize: 10)),
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text('$name ($code)',
                                                      style: const TextStyle(
                                                          fontWeight:
                                                              FontWeight.w800,
                                                          fontSize: 12.5,
                                                          color: AppColors
                                                              .textPrimary)),
                                                  Text('Assigned: $rep',
                                                      style: const TextStyle(
                                                          fontSize: 10.5,
                                                          color: AppColors
                                                              .textSecondary,
                                                          fontWeight:
                                                              FontWeight.w500)),
                                                ],
                                              ),
                                            ),
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.end,
                                              children: [
                                                Text(_formatCurrency(amt),
                                                    style: const TextStyle(
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        fontSize: 11.5,
                                                        color:
                                                            AppColors.primary)),
                                                Container(
                                                  padding: const EdgeInsets
                                                      .symmetric(
                                                      horizontal: 6,
                                                      vertical: 2),
                                                  margin: const EdgeInsets.only(
                                                      top: 2),
                                                  decoration: BoxDecoration(
                                                      color:
                                                          AppColors.primarySoft,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              4)),
                                                  child: Text(
                                                      status.toUpperCase(),
                                                      style: const TextStyle(
                                                          fontSize: 9,
                                                          fontWeight:
                                                              FontWeight.w800,
                                                          color: AppColors
                                                              .primaryDark)),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 4. LEAD SOURCE PERFORMANCE
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('LEAD SOURCE PERFORMANCE',
                                style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryDark,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 12),
                            sourcePerformance.isEmpty
                                ? const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Center(
                                        child: Text(
                                            'No source performance data.',
                                            style: TextStyle(
                                                fontSize: 12,
                                                color:
                                                    AppColors.textSecondary))))
                                : ListView.builder(
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    itemCount: sourcePerformance.length,
                                    itemBuilder: (context, index) {
                                      final item = sourcePerformance[index];
                                      final src =
                                          item['lead_source']?.toString() ??
                                              'Source';
                                      final tot = int.tryParse(
                                              item['total']?.toString() ??
                                                  '0') ??
                                          0;
                                      final won = int.tryParse(
                                              item['won']?.toString() ?? '0') ??
                                          0;
                                      final double rate =
                                          tot > 0 ? ((won / tot) * 100) : 0.0;

                                      return Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 10),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Text(src,
                                                    style: const TextStyle(
                                                        fontSize: 12,
                                                        fontWeight:
                                                            FontWeight.w700,
                                                        color: AppColors
                                                            .textPrimary)),
                                                Text(
                                                    '$tot leads · ${rate.toStringAsFixed(0)}% won',
                                                    style: const TextStyle(
                                                        fontSize: 10.5,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color:
                                                            AppColors.success)),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                              child: LinearProgressIndicator(
                                                value: tot > 0
                                                    ? (tot /
                                                            (totalLeads > 0
                                                                ? totalLeads
                                                                : 1))
                                                        .clamp(0.0, 1.0)
                                                    : 0.0,
                                                minHeight: 6,
                                                backgroundColor:
                                                    AppColors.hover,
                                                color: _chartColors[index %
                                                    _chartColors.length],
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 5. ORG-WIDE REAL-TIME ACTIVITY FEED
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('ORGANIZATION-WIDE RECENT ACTIVITY',
                                style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryDark,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 12),
                            activityFeed.isEmpty
                                ? const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Center(
                                        child: Text(
                                            'No recent activity recorded.',
                                            style: TextStyle(
                                                fontSize: 12,
                                                color:
                                                    AppColors.textSecondary))))
                                : ListView.builder(
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    itemCount: activityFeed.take(6).length,
                                    itemBuilder: (context, index) {
                                      final log = activityFeed[index];
                                      final action =
                                          log['action_type']?.toString() ??
                                              'Action';
                                      final customer =
                                          log['customer_name']?.toString() ??
                                              'Customer';
                                      final code =
                                          log['lead_code']?.toString() ?? '#LD';
                                      final by = log['performed_by_name']
                                              ?.toString() ??
                                          'System';
                                      final time = _formatRelativeTime(
                                          log['created_at']?.toString());

                                      return Container(
                                        margin:
                                            const EdgeInsets.only(bottom: 8),
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                            color: AppColors.bg,
                                            borderRadius:
                                                BorderRadius.circular(8)),
                                        child: Row(
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
                                                  Text(
                                                      '$action — $customer ($code)',
                                                      style: const TextStyle(
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          fontSize: 12,
                                                          color: AppColors
                                                              .textPrimary)),
                                                  Text('By $by • $time',
                                                      style: const TextStyle(
                                                          fontSize: 10,
                                                          color: AppColors
                                                              .textSecondary)),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
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
              Text(label,
                  style: const TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textSecondary)),
              CircleAvatar(
                  radius: 12,
                  backgroundColor: bg,
                  child: Icon(icon, size: 13, color: color)),
            ],
          ),
          Text(value,
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary)),
          Text(sub,
              style: TextStyle(
                  fontSize: 9.5, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}
