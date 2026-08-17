import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../data/sales_dashboard_service.dart';
import '../../data/sales_lead_service.dart';
import '../../data/models/lead_model.dart';

// Small additions not present in AppColors (mirrors the web COLORS.purple*)
class _Extra {
  static const purple = Color(0xFF9333EA);
  static const purpleSoft = Color(0xFFF3E8FF);
}

const Map<String, Color> kStatusColorMap = {
  'New Lead': AppColors.info,
  'Contacted': Color(0xFF0EA5E9),
  'Follow-up Pending': AppColors.warning,
  'Site Visit Scheduled': _Extra.purple,
  'Quotation Sent': Color(0xFF7C3AED),
  'Negotiation': Color(0xFFC026D3),
  'Won': AppColors.success,
  'Lost': AppColors.danger,
  'Not Interested': AppColors.textMuted,
};

class SalesDashboardScreen extends ConsumerStatefulWidget {
  const SalesDashboardScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<SalesDashboardScreen> createState() =>
      _SalesDashboardScreenState();
}

class _SalesDashboardScreenState extends ConsumerState<SalesDashboardScreen> {
  final SalesDashboardService _dashboardService = SalesDashboardService();
  final SalesLeadService _leadService = SalesLeadService();

  bool _loading = true;
  bool _refreshing = false;
  String? _error;
  Map<String, dynamic>? _stats;

  // ---------- Tappable card -> inline details state ----------
  String? _activeCardKey; // uniquely identifies which card/row is open
  String _activeCardTitle = '';
  bool _cardLoading = false;
  bool _cardIsFollowupMode = false;
  List<LeadModel> _cardLeads = [];
  List _cardFollowupItems = [];

  final GlobalKey _detailsPanelKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _fetchDashboard();
  }

  Future<void> _fetchDashboard({bool isManualRefresh = false}) async {
    setState(() {
      if (isManualRefresh) {
        _refreshing = true;
      } else {
        _loading = true;
      }
      _error = null;
    });

    final result = await _dashboardService.getSalesDashboardStats();
    if (!mounted) return;

    if (result['success'] == true) {
      setState(() => _stats = result['data'] as Map<String, dynamic>);
    } else {
      setState(() => _error =
          result['message']?.toString() ?? 'Failed to load dashboard.');
    }
    setState(() {
      _loading = false;
      _refreshing = false;
    });
  }

  // ---------- Card tap handling ----------

  /// Toggle a stat card / pipeline row open. Tapping the same card again
  /// collapses it. If [status] is provided (non-null), leads are fetched
  /// live from the leads API filtered by that status ('' = no filter, i.e.
  /// all assigned leads). If [followupItems] is provided instead, the panel
  /// renders directly from the already-fetched dashboard follow-up list
  /// (no extra API call needed).
  Future<void> _toggleCard(
    String key,
    String title, {
    String? status,
    List? followupItems,
  }) async {
    if (_activeCardKey == key) {
      setState(() {
        _activeCardKey = null;
        _cardLeads = [];
        _cardFollowupItems = [];
      });
      return;
    }

    setState(() {
      _activeCardKey = key;
      _activeCardTitle = title;
      _cardIsFollowupMode = followupItems != null;
      _cardFollowupItems = followupItems ?? [];
      _cardLeads = [];
      _cardLoading = followupItems == null;
    });

    // Scroll the panel into view shortly after it renders.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = _detailsPanelKey.currentContext;
      if (ctx != null) {
        Scrollable.ensureVisible(ctx,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });

    if (followupItems != null) return;

    final result = await _leadService.getLeads(limit: 50, status: status ?? '');
    if (!mounted || _activeCardKey != key) return;

    if (result['success'] == true) {
      setState(() => _cardLeads = (result['leads'] as List<LeadModel>? ?? []));
    } else {
      setState(() => _cardLeads = []);
    }
    setState(() => _cardLoading = false);
  }

  void _closeCard() {
    setState(() {
      _activeCardKey = null;
      _cardLeads = [];
      _cardFollowupItems = [];
    });
  }

  void _makePhoneCall(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty) return;
    final Uri url = Uri.parse('tel:${phoneNumber.trim()}');
    try {
      await launchUrl(url);
    } catch (_) {}
  }

  void _openWhatsApp(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty) return;
    final clean = phoneNumber.replaceAll(RegExp(r'\D'), '');
    final formatted = clean.length == 10 ? '91$clean' : clean;
    final appUri = Uri.parse('whatsapp://send?phone=$formatted');
    final webUri = Uri.parse('https://wa.me/$formatted');
    try {
      if (await canLaunchUrl(appUri)) {
        await launchUrl(appUri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  IconData _actionIcon(String actionType) {
    switch (actionType) {
      case 'Lead Created':
        return Icons.add_circle_outline_rounded;
      case 'Lead Assigned':
      case 'Lead Reassigned':
        return Icons.person_add_alt_rounded;
      case 'Status Changed':
        return Icons.sync_alt_rounded;
      case 'Follow-up Added':
        return Icons.event_available_rounded;
      case 'Quotation Sent':
        return Icons.receipt_long_rounded;
      case 'Site Visit Scheduled':
        return Icons.place_rounded;
      case 'Lead Closed':
        return Icons.flag_rounded;
      case 'Lead Updated':
        return Icons.sync_alt_rounded;
      default:
        return Icons.history_rounded;
    }
  }

  Color _actionColor(String actionType) {
    switch (actionType) {
      case 'Lead Created':
        return AppColors.info;
      case 'Lead Assigned':
      case 'Lead Reassigned':
        return AppColors.primary;
      case 'Status Changed':
        return _Extra.purple;
      case 'Follow-up Added':
        return AppColors.info;
      case 'Quotation Sent':
      case 'Lead Closed':
        return AppColors.success;
      case 'Site Visit Scheduled':
        return AppColors.warning;
      default:
        return AppColors.textSecondary;
    }
  }

  String _relativeTime(String? value) {
    if (value == null || value.isEmpty) return '';
    try {
      final date = DateTime.parse(value);
      final diffMins = DateTime.now().difference(date).inMinutes;
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return '$diffMins min ago';
      final diffHours = diffMins ~/ 60;
      if (diffHours < 24) return '$diffHours hr ago';
      final diffDays = diffHours ~/ 24;
      if (diffDays < 7) return '$diffDays day${diffDays > 1 ? "s" : ""} ago';
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
      return '';
    }
  }

  String _followupDate(String? value) {
    if (value == null || value.isEmpty) return '';
    try {
      final d = DateTime.parse(value);
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
      return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final fullName = user?['full_name'] ?? user?['name'] ?? 'Sales Executive';

    final totalAssigned = (_stats?['total_assigned'] ?? 0) as num;
    final newLeads = (_stats?['new_leads'] ?? 0) as num;
    final todayFollowups = (_stats?['today_followups'] ?? 0) as num;
    final pendingFollowups = (_stats?['pending_followups'] ?? 0) as num;
    final converted = (_stats?['converted'] ?? 0) as num;
    final lost = (_stats?['lost'] ?? 0) as num;
    final upcomingSiteVisits = (_stats?['upcoming_site_visits'] ?? 0) as num;

    final double conversionRate =
        totalAssigned > 0 ? ((converted / totalAssigned) * 100) : 0.0;

    final List followupsList = (_stats?['followupsList'] ?? []) as List;
    final List activityTimeline = (_stats?['activityTimeline'] ?? []) as List;
    final List statusBreakdown = (_stats?['statusBreakdown'] ?? []) as List;

    final List todaysFollowupItems =
        followupsList.where((f) => f['is_overdue'] != true).toList();
    final List pendingFollowupItems =
        followupsList.where((f) => f['is_overdue'] == true).toList();

    final openCount = statusBreakdown
        .where((s) => !['Won', 'Lost', 'Not Interested', 'New Lead']
            .contains(s['status']))
        .fold<num>(0, (acc, s) => acc + ((s['count'] ?? 0) as num));

    final donutData = [
      {'name': 'New', 'value': newLeads, 'color': AppColors.info},
      {'name': 'In Progress', 'value': openCount, 'color': AppColors.warning},
      {'name': 'Won', 'value': converted, 'color': AppColors.success},
      {'name': 'Lost', 'value': lost, 'color': AppColors.danger},
    ].where((d) => (d['value'] as num) > 0).toList();

    final int maxCount = statusBreakdown.fold<int>(0, (max, s) {
      final c = (s['count'] ?? 0) as int;
      return c > max ? c : max;
    });

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5))
            : RefreshIndicator(
                onRefresh: () => _fetchDashboard(isManualRefresh: true),
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ============ HEADER ============
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [AppColors.primaryDark, AppColors.primary],
                          ),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12)),
                              alignment: Alignment.center,
                              child: const Icon(Icons.wb_sunny_outlined,
                                  color: Colors.white, size: 24),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Sales Executive Portal',
                                      style: TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                          color: Colors.white)),
                                  const SizedBox(height: 3),
                                  Text('Welcome back, $fullName',
                                      style: const TextStyle(
                                          fontSize: 11.5,
                                          color: Colors.white70,
                                          fontWeight: FontWeight.w600),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis),
                                ],
                              ),
                            ),
                            Material(
                              color: Colors.white.withOpacity(0.14),
                              borderRadius: BorderRadius.circular(10),
                              child: InkWell(
                                onTap: (_refreshing || _loading)
                                    ? null
                                    : () =>
                                        _fetchDashboard(isManualRefresh: true),
                                borderRadius: BorderRadius.circular(10),
                                child: Padding(
                                  padding: const EdgeInsets.all(9),
                                  child: _refreshing
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2))
                                      : const Icon(Icons.refresh_rounded,
                                          color: Colors.white, size: 20),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      if (_error != null)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: AppColors.dangerSoft,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: AppColors.danger.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded,
                                  color: AppColors.danger, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                  child: Text(_error!,
                                      style: const TextStyle(
                                          color: AppColors.danger,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12.5))),
                              TextButton(
                                onPressed: () =>
                                    _fetchDashboard(isManualRefresh: true),
                                child: const Text('Retry',
                                    style: TextStyle(
                                        color: AppColors.danger,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 12.5)),
                              ),
                            ],
                          ),
                        ),

                      // ============ STAT CARDS (Wrap = never overflows) ============
                      LayoutBuilder(builder: (context, constraints) {
                        final cardWidth = (constraints.maxWidth - 12) / 2;
                        final cards = <Widget>[
                          _statCard(
                              'MY LEADS',
                              '$totalAssigned',
                              'Active solar inquiries',
                              Icons.phone_in_talk_rounded,
                              AppColors.info,
                              AppColors.infoSoft,
                              cardKey: 'total',
                              onTap: () =>
                                  _toggleCard('total', 'My Leads', status: '')),
                          _statCard(
                              'NEW LEADS',
                              '$newLeads',
                              'Not yet contacted',
                              Icons.fiber_new_rounded,
                              AppColors.primary,
                              AppColors.primarySoft,
                              cardKey: 'new',
                              onTap: () => _toggleCard('new', 'New Leads',
                                  status: 'New Lead')),
                          _statCard(
                              "TODAY'S FOLLOW-UPS",
                              '$todayFollowups',
                              'Due today',
                              Icons.pending_actions_rounded,
                              AppColors.warning,
                              AppColors.warningSoft,
                              cardKey: 'today',
                              onTap: () => _toggleCard(
                                  'today', "Today's Follow-ups",
                                  followupItems: todaysFollowupItems)),
                          _statCard(
                              'PENDING FOLLOW-UPS',
                              '$pendingFollowups',
                              'Overdue — date passed',
                              Icons.warning_amber_rounded,
                              AppColors.danger,
                              AppColors.dangerSoft,
                              cardKey: 'pending',
                              badge:
                                  pendingFollowups > 0 ? 'Action needed' : null,
                              onTap: () => _toggleCard(
                                  'pending', 'Pending Follow-ups',
                                  followupItems: pendingFollowupItems)),
                          _statCard(
                              'CONVERTED (WON)',
                              '$converted',
                              'Deals closed successfully',
                              Icons.check_circle_outline_rounded,
                              AppColors.success,
                              AppColors.successSoft,
                              cardKey: 'won',
                              onTap: () => _toggleCard('won', 'Converted (Won)',
                                  status: 'Won')),
                          _statCard(
                              'LOST',
                              '$lost',
                              'Deals not converted',
                              Icons.highlight_off_rounded,
                              AppColors.textSecondary,
                              AppColors.hover,
                              cardKey: 'lost',
                              onTap: () =>
                                  _toggleCard('lost', 'Lost', status: 'Lost')),
                          _statCard(
                              'SITE VISITS',
                              '$upcomingSiteVisits',
                              'Scheduled from today',
                              Icons.location_on_outlined,
                              _Extra.purple,
                              _Extra.purpleSoft,
                              cardKey: 'sitevisit',
                              onTap: () => _toggleCard(
                                  'sitevisit', 'Site Visits',
                                  status: 'Site Visit Scheduled')),
                          _statCard(
                              'CONVERSION RATE',
                              '${conversionRate.toStringAsFixed(1)}%',
                              '$converted won of $totalAssigned',
                              Icons.trending_up_rounded,
                              _Extra.purple,
                              _Extra.purpleSoft,
                              cardKey: 'conversion',
                              onTap: () => _toggleCard(
                                  'conversion', 'Converted (Won)',
                                  status: 'Won')),
                        ];
                        return Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: cards
                              .map((c) => SizedBox(width: cardWidth, child: c))
                              .toList(),
                        );
                      }),

                      // ============ INLINE CARD DETAILS PANEL ============
                      if (_activeCardKey != null) ...[
                        const SizedBox(height: 14),
                        KeyedSubtree(
                            key: _detailsPanelKey,
                            child: _buildCardDetailsPanel()),
                      ],

                      const SizedBox(height: 22),

                      // ============ PIPELINE (horizontal bars) ============
                      _sectionHeader(
                          'My Pipeline by Stage', Icons.bar_chart_rounded,
                          chip: '$totalAssigned leads'),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: statusBreakdown.isEmpty
                            ? const Padding(
                                padding: EdgeInsets.symmetric(vertical: 20),
                                child: Center(
                                    child: Text('No leads assigned yet',
                                        style: TextStyle(
                                            color: AppColors.textSecondary,
                                            fontSize: 12.5))),
                              )
                            : Column(
                                children:
                                    List.generate(statusBreakdown.length, (i) {
                                  final s = statusBreakdown[i];
                                  final status = s['status']?.toString() ?? '';
                                  final count = (s['count'] ?? 0) as int;
                                  final color = kStatusColorMap[status] ??
                                      AppColors.primary;
                                  final ratio =
                                      maxCount > 0 ? count / maxCount : 0.0;
                                  final rowKey = 'stage_$status';
                                  final isActive = _activeCardKey == rowKey;
                                  return Padding(
                                    padding: EdgeInsets.only(
                                        bottom: i == statusBreakdown.length - 1
                                            ? 0
                                            : 12),
                                    child: Material(
                                      color: isActive
                                          ? color.withOpacity(0.06)
                                          : Colors.transparent,
                                      borderRadius: BorderRadius.circular(8),
                                      child: InkWell(
                                        borderRadius: BorderRadius.circular(8),
                                        onTap: () => _toggleCard(rowKey, status,
                                            status: status),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 4, horizontal: 4),
                                          child: Row(
                                            children: [
                                              SizedBox(
                                                width: 108,
                                                child: Text(status,
                                                    style: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w700,
                                                        color: AppColors
                                                            .textSecondary),
                                                    maxLines: 1,
                                                    overflow:
                                                        TextOverflow.ellipsis),
                                              ),
                                              Expanded(
                                                child: ClipRRect(
                                                  borderRadius:
                                                      BorderRadius.circular(6),
                                                  child:
                                                      LinearProgressIndicator(
                                                    value: ratio,
                                                    minHeight: 14,
                                                    backgroundColor:
                                                        AppColors.hover,
                                                    valueColor:
                                                        AlwaysStoppedAnimation(
                                                            color),
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              SizedBox(
                                                width: 22,
                                                child: Text('$count',
                                                    textAlign: TextAlign.right,
                                                    style: const TextStyle(
                                                        fontSize: 11.5,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color: AppColors
                                                            .textPrimary)),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                }),
                              ),
                      ),

                      const SizedBox(height: 22),

                      // ============ QUICK OVERVIEW DONUT ============
                      _sectionHeader(
                          'Quick Overview', Icons.pie_chart_outline_rounded),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: donutData.isEmpty
                            ? const Padding(
                                padding: EdgeInsets.symmetric(vertical: 20),
                                child: Center(
                                    child: Text('No data yet',
                                        style: TextStyle(
                                            color: AppColors.textSecondary,
                                            fontSize: 12.5))),
                              )
                            : Column(
                                children: [
                                  SizedBox(
                                    height: 160,
                                    child: PieChart(
                                      PieChartData(
                                        sectionsSpace: 3,
                                        centerSpaceRadius: 42,
                                        sections: donutData.map((d) {
                                          return PieChartSectionData(
                                            value:
                                                (d['value'] as num).toDouble(),
                                            color: d['color'] as Color,
                                            radius: 30,
                                            showTitle: false,
                                          );
                                        }).toList(),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  Wrap(
                                    spacing: 14,
                                    runSpacing: 8,
                                    alignment: WrapAlignment.center,
                                    children: donutData.map((d) {
                                      return Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                              width: 9,
                                              height: 9,
                                              decoration: BoxDecoration(
                                                  color: d['color'] as Color,
                                                  shape: BoxShape.circle)),
                                          const SizedBox(width: 5),
                                          Text('${d['name']} (${d['value']})',
                                              style: const TextStyle(
                                                  fontSize: 11.5,
                                                  fontWeight: FontWeight.w700,
                                                  color:
                                                      AppColors.textPrimary)),
                                        ],
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ),
                      ),

                      const SizedBox(height: 22),

                      // ============ DUE FOLLOW-UPS ============
                      _sectionHeader('Follow-ups Due Today & Overdue',
                          Icons.event_busy_rounded,
                          chip: '${followupsList.length} to act on'),
                      const SizedBox(height: 12),
                      if (followupsList.isEmpty)
                        _emptyCard(
                            Icons.check_circle_outline_rounded,
                            AppColors.success,
                            "You're all caught up!",
                            'No due follow-ups right now.')
                      else
                        Column(
                          children: List.generate(followupsList.length, (i) {
                            final item = followupsList[i];
                            final isOverdue = item['is_overdue'] == true;
                            final customerName =
                                item['customer_name'] ?? 'Customer';
                            final leadCode = item['lead_code'] ?? '—';
                            final phone =
                                item['phone'] ?? item['mobile_number'] ?? '';
                            final nextDate =
                                item['next_follow_up_date']?.toString();

                            return Container(
                              margin: EdgeInsets.only(
                                  bottom:
                                      i == followupsList.length - 1 ? 0 : 10),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                  color: AppColors.surfaceMuted,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border)),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Wrap(
                                          crossAxisAlignment:
                                              WrapCrossAlignment.center,
                                          spacing: 8,
                                          runSpacing: 4,
                                          children: [
                                            Text(leadCode.toString(),
                                                style: const TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 11.5,
                                                    color: AppColors.primary)),
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 3),
                                              decoration: BoxDecoration(
                                                color: isOverdue
                                                    ? AppColors.dangerSoft
                                                    : AppColors.warningSoft,
                                                borderRadius:
                                                    BorderRadius.circular(20),
                                              ),
                                              child: Text(
                                                isOverdue
                                                    ? 'Overdue · ${_followupDate(nextDate)}'
                                                    : 'Due today',
                                                style: TextStyle(
                                                    fontSize: 9.5,
                                                    fontWeight: FontWeight.w800,
                                                    color: isOverdue
                                                        ? AppColors.danger
                                                        : AppColors.warning),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 5),
                                        Text(customerName.toString(),
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                                fontSize: 13.5,
                                                color: AppColors.textPrimary)),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  _roundIconBtn(
                                      Icons.phone_in_talk_rounded,
                                      AppColors.info,
                                      AppColors.infoSoft,
                                      () => _makePhoneCall(phone.toString())),
                                  const SizedBox(width: 8),
                                  _roundIconBtn(
                                      Icons.chat_rounded,
                                      AppColors.success,
                                      AppColors.successSoft,
                                      () => _openWhatsApp(phone.toString())),
                                ],
                              ),
                            );
                          }),
                        ),

                      const SizedBox(height: 22),

                      // ============ RECENT ACTIVITY ============
                      _sectionHeader(
                          'My Recent Activity', Icons.history_rounded,
                          chip: 'Last ${activityTimeline.length} actions'),
                      const SizedBox(height: 12),
                      if (activityTimeline.isEmpty)
                        _emptyCard(
                            Icons.inbox_outlined,
                            AppColors.textMuted,
                            'No activity yet',
                            "Once you update a lead, it'll show up here.")
                      else
                        Column(
                          children: List.generate(activityTimeline.length, (i) {
                            final log = activityTimeline[i];
                            final actionType =
                                (log['action_type'] ?? 'Activity').toString();
                            final customerName = log['customer_name'] ?? 'Lead';
                            final leadCode = log['lead_code'] ?? '';
                            final remark = log['remark'];
                            final oldVal = log['old_value'];
                            final newVal = log['new_value'];
                            final color = _actionColor(actionType);

                            return Container(
                              margin: EdgeInsets.only(
                                  bottom: i == activityTimeline.length - 1
                                      ? 0
                                      : 10),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                  color: AppColors.surfaceMuted,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border)),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 34,
                                    height: 34,
                                    decoration: BoxDecoration(
                                        color: color.withOpacity(0.12),
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                    alignment: Alignment.center,
                                    child: Icon(_actionIcon(actionType),
                                        size: 17, color: color),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                                child: Text(actionType,
                                                    style: TextStyle(
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        fontSize: 12.5,
                                                        color: color))),
                                            Text(
                                                _relativeTime(log['created_at']
                                                    ?.toString()),
                                                style: const TextStyle(
                                                    fontSize: 10,
                                                    color: AppColors.textMuted,
                                                    fontWeight:
                                                        FontWeight.w600)),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                            '$customerName ${leadCode.toString().isNotEmpty ? "($leadCode)" : ""}',
                                            style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.textPrimary)),
                                        if (remark != null &&
                                            remark.toString().isNotEmpty) ...[
                                          const SizedBox(height: 3),
                                          Text('"$remark"',
                                              style: const TextStyle(
                                                  fontSize: 11.5,
                                                  fontStyle: FontStyle.italic,
                                                  color:
                                                      AppColors.textSecondary)),
                                        ] else if (oldVal != null &&
                                            newVal != null) ...[
                                          const SizedBox(height: 3),
                                          Text('$oldVal → $newVal',
                                              style: const TextStyle(
                                                  fontSize: 11.5,
                                                  color:
                                                      AppColors.textSecondary)),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ),

                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  // ============ INLINE CARD DETAILS PANEL WIDGET ============
  Widget _buildCardDetailsPanel() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 10, 14),
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              border: const Border(
                  bottom: BorderSide(color: AppColors.border, width: 1)),
            ),
            child: Row(
              children: [
                const Icon(Icons.list_alt_rounded,
                    size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_activeCardTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: AppColors.textPrimary)),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20)),
                  child: Text(
                    '${_cardIsFollowupMode ? _cardFollowupItems.length : _cardLeads.length}',
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary),
                  ),
                ),
                IconButton(
                  onPressed: _closeCard,
                  icon: const Icon(Icons.close_rounded, size: 18),
                  color: AppColors.textSecondary,
                  splashRadius: 18,
                ),
              ],
            ),
          ),

          // Body
          Padding(
            padding: const EdgeInsets.all(12),
            child: _cardLoading
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary, strokeWidth: 2.5)),
                  )
                : _cardIsFollowupMode
                    ? _buildFollowupItemsList()
                    : _buildLeadsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildFollowupItemsList() {
    if (_cardFollowupItems.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(
            child: Text('Nothing here right now',
                style:
                    TextStyle(color: AppColors.textSecondary, fontSize: 12.5))),
      );
    }
    return Column(
      children: List.generate(_cardFollowupItems.length, (i) {
        final item = _cardFollowupItems[i];
        final isOverdue = item['is_overdue'] == true;
        final customerName = item['customer_name'] ?? 'Customer';
        final leadCode = item['lead_code'] ?? '—';
        final phone = item['phone'] ?? item['mobile_number'] ?? '';
        final nextDate = item['next_follow_up_date']?.toString();
        final status = item['status']?.toString();

        return Container(
          margin: EdgeInsets.only(
              bottom: i == _cardFollowupItems.length - 1 ? 0 : 8),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border)),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Text(leadCode.toString(),
                            style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                                color: AppColors.primary)),
                        if (status != null && status.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                                color: (kStatusColorMap[status] ??
                                        AppColors.primary)
                                    .withOpacity(0.12),
                                borderRadius: BorderRadius.circular(20)),
                            child: Text(status,
                                style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: kStatusColorMap[status] ??
                                        AppColors.primary)),
                          ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: isOverdue
                                ? AppColors.dangerSoft
                                : AppColors.warningSoft,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            isOverdue
                                ? 'Overdue · ${_followupDate(nextDate)}'
                                : 'Due today',
                            style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: isOverdue
                                    ? AppColors.danger
                                    : AppColors.warning),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(customerName.toString(),
                        style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: AppColors.textPrimary)),
                    if (phone.toString().isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(phone.toString(),
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _roundIconBtn(Icons.phone_in_talk_rounded, AppColors.info,
                  AppColors.infoSoft, () => _makePhoneCall(phone.toString())),
              const SizedBox(width: 6),
              _roundIconBtn(Icons.chat_rounded, AppColors.success,
                  AppColors.successSoft, () => _openWhatsApp(phone.toString())),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildLeadsList() {
    if (_cardLeads.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(
            child: Text('No leads found for this category',
                style:
                    TextStyle(color: AppColors.textSecondary, fontSize: 12.5))),
      );
    }
    return Column(
      children: List.generate(_cardLeads.length, (i) {
        final lead = _cardLeads[i];
        final color = kStatusColorMap[lead.status] ?? AppColors.primary;
        return Container(
          margin: EdgeInsets.only(bottom: i == _cardLeads.length - 1 ? 0 : 8),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border)),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Text(lead.leadCode,
                            style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                                color: AppColors.primary)),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                              color: color.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(20)),
                          child: Text(lead.status,
                              style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: color)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(lead.customerName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    Text(lead.mobileNumber,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.textSecondary)),
                    if (lead.nextFollowUpDate != null &&
                        lead.nextFollowUpDate!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                          'Next follow-up: ${_followupDate(lead.nextFollowUpDate)}',
                          style: const TextStyle(
                              fontSize: 10.5, color: AppColors.textMuted)),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _roundIconBtn(Icons.phone_in_talk_rounded, AppColors.info,
                  AppColors.infoSoft, () => _makePhoneCall(lead.mobileNumber)),
              const SizedBox(width: 6),
              _roundIconBtn(
                  Icons.chat_rounded,
                  AppColors.success,
                  AppColors.successSoft,
                  () => _openWhatsApp(lead.mobileNumber)),
            ],
          ),
        );
      }),
    );
  }

  Widget _roundIconBtn(
      IconData icon, Color color, Color bg, VoidCallback onTap) {
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(9),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(9),
        child: Padding(
            padding: const EdgeInsets.all(8),
            child: Icon(icon, size: 17, color: color)),
      ),
    );
  }

  Widget _emptyCard(IconData icon, Color color, String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border)),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14)),
            alignment: Alignment.center,
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 10),
          Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 13.5,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, IconData icon, {String? chip}) {
    return Row(
      children: [
        Container(
            width: 4,
            height: 18,
            decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(4))),
        const SizedBox(width: 8),
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 6),
        Expanded(
            child: Text(title,
                style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary))),
        if (chip != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border)),
            child: Text(chip,
                style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary)),
          ),
      ],
    );
  }

  // mainAxisSize.min Column inside a Wrap-sized box — content defines the
  // height, so this can NEVER overflow regardless of text length/locale.
  // Now wrapped in Material+InkWell so every stat card is tappable and
  // opens the inline details panel above the pipeline section.
  Widget _statCard(String label, String value, String caption, IconData icon,
      Color color, Color softBg,
      {String? badge, String? cardKey, VoidCallback? onTap}) {
    final bool isActive = cardKey != null && _activeCardKey == cardKey;
    return Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: isActive ? color : AppColors.border,
                width: isActive ? 1.4 : 1),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2))
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(label,
                        style: const TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textSecondary,
                            letterSpacing: 0.3),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                        color: softBg, borderRadius: BorderRadius.circular(9)),
                    alignment: Alignment.center,
                    child: Icon(icon, size: 15, color: color),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(value,
                      style: const TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary)),
                  if (badge != null) ...[
                    const SizedBox(width: 6),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 3),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                            color: AppColors.dangerSoft,
                            borderRadius: BorderRadius.circular(6)),
                        child: Text(badge,
                            style: const TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.danger)),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 3),
              Text(caption,
                  style: const TextStyle(
                      fontSize: 9.5,
                      color: AppColors.textMuted,
                      fontWeight: FontWeight.w500),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}
