import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/admin_reports_service.dart';

class AdminReportsScreen extends StatefulWidget {
  const AdminReportsScreen({Key? key}) : super(key: key);

  @override
  State<AdminReportsScreen> createState() => _AdminReportsScreenState();
}

class _AdminReportsScreenState extends State<AdminReportsScreen>
    with SingleTickerProviderStateMixin {
  final AdminReportsService _service = AdminReportsService();
  late TabController _tabController;

  bool _isLoading = true;
  bool _isGeneratingPdf = false;
  String? _errorMessage;

  List<dynamic> _allLeads = [];
  List<dynamic> _allUsers = [];
  String _periodFilter = 'all';

  final List<Color> _chartColors = const [
    AppColors.primary,
    AppColors.success,
    AppColors.warning,
    AppColors.purple,
    AppColors.danger,
    AppColors.info,
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchReportData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchReportData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _service.getReportData();

    if (mounted) {
      if (result['success'] == true) {
        setState(() {
          _allLeads = result['leads'] as List;
          _allUsers = result['users'] as List;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message']?.toString() ??
              'Failed to load report analytics.';
          _isLoading = false;
        });
      }
    }
  }

  // Time Period Filter Logic
  List<dynamic> get _filteredLeads {
    if (_periodFilter == 'all') return _allLeads;

    final now = DateTime.now();
    DateTime start;
    DateTime end = now;

    if (_periodFilter == 'this_month') {
      start = DateTime(now.year, now.month, 1);
    } else if (_periodFilter == 'last_month') {
      start = DateTime(now.year, now.month - 1, 1);
      end = DateTime(now.year, now.month, 0, 23, 59, 59);
    } else if (_periodFilter == 'this_quarter') {
      final quarter = (now.month - 1) ~/ 3;
      start = DateTime(now.year, quarter * 3 + 1, 1);
    } else if (_periodFilter == 'this_year') {
      start = DateTime(now.year, 1, 1);
    } else {
      return _allLeads;
    }

    return _allLeads.where((l) {
      final dateStr = l['created_at']?.toString();
      if (dateStr == null) return false;
      final createdAt = DateTime.tryParse(dateStr);
      if (createdAt == null) return false;
      return createdAt.isAfter(start.subtract(const Duration(seconds: 1))) &&
          createdAt.isBefore(end.add(const Duration(seconds: 1)));
    }).toList();
  }

  // Manager Breakdown
  List<Map<String, dynamic>> get _managerReports {
    final managers = _allUsers
        .where((u) =>
            u['role_id']?.toString() == '2' ||
            u['role_name']?.toString().toLowerCase().contains('manager') ==
                true)
        .toList();
    final reps = _allUsers
        .where((u) =>
            u['role_id']?.toString() == '3' ||
            u['role_name']?.toString().toLowerCase().contains('sales') == true)
        .toList();

    return managers.map((mgr) {
      final mgrId = mgr['id'];
      final teamRepIds = reps
          .where((r) => r['manager_id']?.toString() == mgrId?.toString())
          .map((r) => r['id']?.toString())
          .toList();

      final teamLeads = _filteredLeads.where((l) {
        final assignedTo = l['assigned_to']?.toString();
        final createdBy = l['created_by']?.toString();
        return teamRepIds.contains(assignedTo) ||
            assignedTo == mgrId?.toString() ||
            createdBy == mgrId?.toString();
      }).toList();

      final total = teamLeads.length;
      final won = teamLeads
          .where((l) => l['status']?.toString().toLowerCase() == 'won')
          .length;
      final lost = teamLeads
          .where((l) => l['status']?.toString().toLowerCase() == 'lost')
          .length;
      final active = total - (won + lost);
      final double conversion = total > 0 ? ((won / total) * 100) : 0.0;

      final double revenue = teamLeads
          .where((l) => l['status']?.toString().toLowerCase() == 'won')
          .fold(
              0.0,
              (sum, l) =>
                  sum +
                  (double.tryParse(l['quotation_amount']?.toString() ?? '0') ??
                      0.0));

      return {
        'user': mgr,
        'name': mgr['full_name']?.toString() ?? 'Manager',
        'email': mgr['email']?.toString() ?? 'N/A',
        'teamSize': teamRepIds.length,
        'total': total,
        'won': won,
        'lost': lost,
        'active': active,
        'conversion': conversion,
        'revenue': revenue,
      };
    }).toList();
  }

  // Sales Rep Breakdown
  List<Map<String, dynamic>> get _repReports {
    final reps = _allUsers
        .where((u) =>
            u['role_id']?.toString() == '3' ||
            u['role_name']?.toString().toLowerCase().contains('sales') == true)
        .toList();
    final managers = _allUsers
        .where((u) =>
            u['role_id']?.toString() == '2' ||
            u['role_name']?.toString().toLowerCase().contains('manager') ==
                true)
        .toList();

    return reps.map((rep) {
      final repId = rep['id']?.toString();
      final repLeads = _filteredLeads
          .where((l) => l['assigned_to']?.toString() == repId)
          .toList();

      final total = repLeads.length;
      final won = repLeads
          .where((l) => l['status']?.toString().toLowerCase() == 'won')
          .length;
      final lost = repLeads
          .where((l) => l['status']?.toString().toLowerCase() == 'lost')
          .length;
      final active = total - (won + lost);
      final double conversion = total > 0 ? ((won / total) * 100) : 0.0;

      final double revenue = repLeads
          .where((l) => l['status']?.toString().toLowerCase() == 'won')
          .fold(
              0.0,
              (sum, l) =>
                  sum +
                  (double.tryParse(l['quotation_amount']?.toString() ?? '0') ??
                      0.0));

      final mgrObj = managers.firstWhere(
        (m) => m['id']?.toString() == rep['manager_id']?.toString(),
        orElse: () => <String, dynamic>{},
      );
      final managerName = rep['manager_name']?.toString() ??
          mgrObj['full_name']?.toString() ??
          'Unassigned';

      return {
        'user': rep,
        'name': rep['full_name']?.toString() ?? 'Sales Rep',
        'email': rep['email']?.toString() ?? 'N/A',
        'managerName': managerName,
        'total': total,
        'won': won,
        'lost': lost,
        'active': active,
        'conversion': conversion,
        'revenue': revenue,
      };
    }).toList();
  }

  // Lead Source Performance
  List<Map<String, dynamic>> get _sourcePerformance {
    final Map<String, Map<String, int>> map = {};

    for (var l in _filteredLeads) {
      final src = l['lead_source']?.toString() ?? 'Other';
      if (!map.containsKey(src)) map[src] = {'total': 0, 'won': 0};
      map[src]!['total'] = map[src]!['total']! + 1;
      if (l['status']?.toString().toLowerCase() == 'won') {
        map[src]!['won'] = map[src]!['won']! + 1;
      }
    }

    final list = map.entries.map((e) {
      final total = e.value['total']!;
      final won = e.value['won']!;
      final double rate = total > 0 ? ((won / total) * 100) : 0.0;
      return {
        'source': e.key,
        'total': total,
        'won': won,
        'rate': rate,
      };
    }).toList();

    list.sort((a, b) => (b['total'] as int).compareTo(a['total'] as int));
    return list;
  }

  // PDF Export Engine
  Future<void> _exportPdfReport() async {
    if (_isGeneratingPdf) return;
    setState(() => _isGeneratingPdf = true);

    try {
      final pdf = pw.Document();

      final leads = _filteredLeads;
      final total = leads.length;
      final won = leads
          .where((l) => l['status']?.toString().toLowerCase() == 'won')
          .length;
      final lost = leads
          .where((l) => l['status']?.toString().toLowerCase() == 'lost')
          .length;
      final active = total - (won + lost);
      final double convRate = total > 0 ? ((won / total) * 100) : 0.0;

      final mgrReports = _managerReports;
      final repReportsList = _repReports;

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(24),
          build: (pw.Context context) => [
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('SOLAR CRM - ORGANIZATION PERFORMANCE REPORT',
                        style: pw.TextStyle(
                            fontSize: 14,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColors.blue900)),
                    pw.SizedBox(height: 4),
                    pw.Text(
                        'Period Filter: ${_periodFilter.toUpperCase()} | Generated: ${DateTime.now().toString().split(' ')[0]}',
                        style: const pw.TextStyle(
                            fontSize: 9, color: PdfColors.grey700)),
                  ],
                ),
              ],
            ),
            pw.Divider(thickness: 1.5, color: PdfColors.blue800),
            pw.SizedBox(height: 10),
            pw.Text('EXECUTIVE SUMMARY',
                style:
                    pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 6),
            pw.Table.fromTextArray(
              headers: [
                'Total Leads',
                'Active Pipeline',
                'Deals Won',
                'Deals Lost',
                'Win Rate %'
              ],
              data: [
                [
                  '$total',
                  '$active',
                  '$won',
                  '$lost',
                  '${convRate.toStringAsFixed(1)}%'
                ]
              ],
              headerStyle: pw.TextStyle(
                  fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration:
                  const pw.BoxDecoration(color: PdfColors.blue800),
              cellAlignment: pw.Alignment.center,
            ),
            pw.SizedBox(height: 16),
            pw.Text('MANAGER-WISE CONVERSION',
                style:
                    pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 6),
            pw.Table.fromTextArray(
              headers: [
                'Manager',
                'Team Size',
                'Total',
                'Active',
                'Won',
                'Lost',
                'Win Rate'
              ],
              data: mgrReports.map((r) {
                return [
                  r['name'].toString(),
                  '${r['teamSize']}',
                  '${r['total']}',
                  '${r['active']}',
                  '${r['won']}',
                  '${r['lost']}',
                  '${(r['conversion'] as double).toStringAsFixed(1)}%'
                ];
              }).toList(),
              headerStyle: pw.TextStyle(
                  fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration:
                  const pw.BoxDecoration(color: PdfColors.blue700),
              cellAlignment: pw.Alignment.centerLeft,
            ),
            pw.SizedBox(height: 16),
            pw.Text('SALES EXECUTIVE BREAKDOWN',
                style:
                    pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 6),
            pw.Table.fromTextArray(
              headers: [
                'Sales Rep',
                'Manager',
                'Total',
                'Active',
                'Won',
                'Lost',
                'Win Rate'
              ],
              data: repReportsList.map((r) {
                return [
                  r['name'].toString(),
                  r['managerName'].toString(),
                  '${r['total']}',
                  '${r['active']}',
                  '${r['won']}',
                  '${r['lost']}',
                  '${(r['conversion'] as double).toStringAsFixed(1)}%'
                ];
              }).toList(),
              headerStyle: pw.TextStyle(
                  fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration:
                  const pw.BoxDecoration(color: PdfColors.blue600),
              cellAlignment: pw.Alignment.centerLeft,
            ),
          ],
        ),
      );

      final bytes = await pdf.save();

      if (mounted) setState(() => _isGeneratingPdf = false);

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => bytes,
        name:
            'Solar_CRM_Org_Report_${DateTime.now().millisecondsSinceEpoch}.pdf',
      );
    } catch (_) {
      if (mounted) {
        setState(() => _isGeneratingPdf = false);
        _showNotification('Failed to generate PDF Report', isError: true);
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

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'U';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  String _formatCurrency(dynamic val) {
    final parsedNum = num.tryParse(val?.toString() ?? '0') ?? 0;
    if (parsedNum >= 10000000)
      return '₹${(parsedNum / 10000000).toStringAsFixed(2)} Cr';
    if (parsedNum >= 100000)
      return '₹${(parsedNum / 100000).toStringAsFixed(2)} L';
    return '₹${parsedNum.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final leads = _filteredLeads;
    final total = leads.length;
    final won = leads
        .where((l) => l['status']?.toString().toLowerCase() == 'won')
        .length;
    final lost = leads
        .where((l) => l['status']?.toString().toLowerCase() == 'lost')
        .length;
    final active = total - (won + lost);
    final double overallWinRate = total > 0 ? ((won / total) * 100) : 0.0;

    final double totalRevenue = leads
        .where((l) => l['status']?.toString().toLowerCase() == 'won')
        .fold(
            0.0,
            (sum, l) =>
                sum +
                (double.tryParse(l['quotation_amount']?.toString() ?? '0') ??
                    0.0));

    final mgrReports = _managerReports;
    final repReportsList = _repReports;
    final sourcePerf = _sourcePerformance;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Organization Reports',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Org-wide Conversion & Performance Analytics',
                style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500)),
          ],
        ),
        elevation: 0,
        backgroundColor: AppColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: _fetchReportData,
            tooltip: 'Refresh Reports',
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5))
            : RefreshIndicator(
                onRefresh: _fetchReportData,
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

                      // Top Period & PDF Action Bar
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppColors.border)),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _periodFilter,
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary),
                                items: const [
                                  DropdownMenuItem(
                                      value: 'all', child: Text('All Time')),
                                  DropdownMenuItem(
                                      value: 'this_month',
                                      child: Text('This Month')),
                                  DropdownMenuItem(
                                      value: 'last_month',
                                      child: Text('Last Month')),
                                  DropdownMenuItem(
                                      value: 'this_quarter',
                                      child: Text('This Quarter')),
                                  DropdownMenuItem(
                                      value: 'this_year',
                                      child: Text('This Year')),
                                ],
                                onChanged: (val) {
                                  if (val != null)
                                    setState(() => _periodFilter = val);
                                },
                              ),
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed:
                                _isGeneratingPdf ? null : _exportPdfReport,
                            style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryDark,
                                foregroundColor: Colors.white,
                                elevation: 0),
                            icon: _isGeneratingPdf
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2))
                                : const Icon(Icons.picture_as_pdf_rounded,
                                    size: 16),
                            label: const Text('Export / Print PDF',
                                style: TextStyle(
                                    fontWeight: FontWeight.w800, fontSize: 12)),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 1. ORG SUMMARY KPI CARDS
                      GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.75,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildKpiCard(
                              'TOTAL LEADS',
                              '$total',
                              '$active Active Pipeline',
                              Icons.assignment_rounded,
                              AppColors.primary,
                              AppColors.primarySoft),
                          _buildKpiCard(
                              'DEALS WON',
                              '$won',
                              '$lost Deals Lost',
                              Icons.check_circle_outline_rounded,
                              AppColors.success,
                              AppColors.successSoft),
                          _buildKpiCard(
                              'WIN RATE',
                              '${overallWinRate.toStringAsFixed(1)}%',
                              'Org Conversion',
                              Icons.trending_up_rounded,
                              AppColors.info,
                              AppColors.infoSoft),
                          _buildKpiCard(
                              'REVENUE WON',
                              _formatCurrency(totalRevenue),
                              'Closed Revenue',
                              Icons.monetization_on_outlined,
                              AppColors.warning,
                              AppColors.warningSoft),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 2. VISUAL CHARTS
                      // Chart 1: Status Distribution Donut Chart
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('STATUS DISTRIBUTION',
                                style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textSecondary,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 14),
                            SizedBox(
                              height: 150,
                              child: total == 0
                                  ? const Center(
                                      child: Text(
                                          'No leads data for status distribution.',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textMuted)))
                                  : Row(
                                      children: [
                                        Expanded(
                                          child: PieChart(
                                            PieChartData(
                                              sectionsSpace: 2,
                                              centerSpaceRadius: 36,
                                              sections: [
                                                PieChartSectionData(
                                                    color: AppColors.success,
                                                    value: won.toDouble() > 0
                                                        ? won.toDouble()
                                                        : 0.1,
                                                    title: '$won',
                                                    radius: 28,
                                                    titleStyle: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color: Colors.white)),
                                                PieChartSectionData(
                                                    color: AppColors.primary,
                                                    value: active.toDouble() > 0
                                                        ? active.toDouble()
                                                        : 0.1,
                                                    title: '$active',
                                                    radius: 28,
                                                    titleStyle: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color: Colors.white)),
                                                PieChartSectionData(
                                                    color: AppColors.danger,
                                                    value: lost.toDouble() > 0
                                                        ? lost.toDouble()
                                                        : 0.1,
                                                    title: '$lost',
                                                    radius: 28,
                                                    titleStyle: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color: Colors.white)),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            _buildChartLegend(
                                                'Deals Won', AppColors.success),
                                            const SizedBox(height: 6),
                                            _buildChartLegend('Active Pipeline',
                                                AppColors.primary),
                                            const SizedBox(height: 6),
                                            _buildChartLegend(
                                                'Deals Lost', AppColors.danger),
                                          ],
                                        ),
                                      ],
                                    ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Chart 2: Lead Source Performance
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
                                    color: AppColors.textSecondary,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 14),
                            sourcePerf.isEmpty
                                ? const Center(
                                    child: Padding(
                                        padding: EdgeInsets.all(16),
                                        child: Text(
                                            'No source performance data.',
                                            style: TextStyle(
                                                fontSize: 12,
                                                color: AppColors.textMuted))))
                                : ListView.builder(
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    itemCount: sourcePerf.length,
                                    itemBuilder: (context, index) {
                                      final item = sourcePerf[index];
                                      final src = item['source']?.toString() ??
                                          'Source';
                                      final tot = item['total'] as int;
                                      final double rate =
                                          item['rate'] as double;

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
                                                    '$tot Leads (${rate.toStringAsFixed(1)}% Won)',
                                                    style: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color:
                                                            AppColors.primary)),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                              child: LinearProgressIndicator(
                                                value: (rate / 100)
                                                    .clamp(0.0, 1.0),
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

                      // 3. TABBED BREAKDOWN TABLES
                      Container(
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          children: [
                            TabBar(
                              controller: _tabController,
                              labelColor: AppColors.primary,
                              unselectedLabelColor: AppColors.textSecondary,
                              indicatorColor: AppColors.primary,
                              indicatorWeight: 3,
                              tabs: [
                                Tab(text: 'By Manager (${mgrReports.length})'),
                                Tab(
                                    text:
                                        'By Sales Rep (${repReportsList.length})'),
                              ],
                            ),
                            SizedBox(
                              height: 380,
                              child: TabBarView(
                                controller: _tabController,
                                children: [
                                  // Tab 1: By Manager
                                  mgrReports.isEmpty
                                      ? const Center(
                                          child: Text(
                                              'No manager performance data.',
                                              style: TextStyle(
                                                  fontSize: 12,
                                                  color:
                                                      AppColors.textSecondary)))
                                      : ListView.builder(
                                          padding: const EdgeInsets.all(12),
                                          itemCount: mgrReports.length,
                                          itemBuilder: (context, index) {
                                            final r = mgrReports[index];
                                            final double rate =
                                                r['conversion'] as double;

                                            return Container(
                                              margin: const EdgeInsets.only(
                                                  bottom: 10),
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                  color: AppColors.bg,
                                                  borderRadius:
                                                      BorderRadius.circular(12),
                                                  border: Border.all(
                                                      color: AppColors.border)),
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .spaceBetween,
                                                    children: [
                                                      Text(r['name'].toString(),
                                                          style: const TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w800,
                                                              fontSize: 13.5,
                                                              color: AppColors
                                                                  .textPrimary)),
                                                      Container(
                                                        padding:
                                                            const EdgeInsets
                                                                .symmetric(
                                                                horizontal: 6,
                                                                vertical: 2),
                                                        decoration: BoxDecoration(
                                                            color: AppColors
                                                                .successSoft,
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        4)),
                                                        child: Text(
                                                            '${rate.toStringAsFixed(1)}% Win Rate',
                                                            style: const TextStyle(
                                                                fontSize: 9.5,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w800,
                                                                color: AppColors
                                                                    .success)),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 4),
                                                  Text(
                                                      'Team Size: ${r['teamSize']} • Assigned: ${r['total']} • Won: ${r['won']}',
                                                      style: const TextStyle(
                                                          fontSize: 11,
                                                          color: AppColors
                                                              .textSecondary,
                                                          fontWeight:
                                                              FontWeight.w500)),
                                                  const SizedBox(height: 6),
                                                  Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .spaceBetween,
                                                    children: [
                                                      Text(
                                                          'Active: ${r['active']} | Lost: ${r['lost']}',
                                                          style: const TextStyle(
                                                              fontSize: 10.5,
                                                              color: AppColors
                                                                  .textMuted)),
                                                      Text(
                                                          _formatCurrency(
                                                              r['revenue']),
                                                          style: const TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w800,
                                                              fontSize: 12,
                                                              color: AppColors
                                                                  .primary)),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            );
                                          },
                                        ),

                                  // Tab 2: By Sales Rep
                                  repReportsList.isEmpty
                                      ? const Center(
                                          child: Text(
                                              'No sales rep performance data.',
                                              style: TextStyle(
                                                  fontSize: 12,
                                                  color:
                                                      AppColors.textSecondary)))
                                      : ListView.builder(
                                          padding: const EdgeInsets.all(12),
                                          itemCount: repReportsList.length,
                                          itemBuilder: (context, index) {
                                            final r = repReportsList[index];
                                            final double rate =
                                                r['conversion'] as double;

                                            return Container(
                                              margin: const EdgeInsets.only(
                                                  bottom: 10),
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                  color: AppColors.bg,
                                                  borderRadius:
                                                      BorderRadius.circular(12),
                                                  border: Border.all(
                                                      color: AppColors.border)),
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .spaceBetween,
                                                    children: [
                                                      Text(r['name'].toString(),
                                                          style: const TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w800,
                                                              fontSize: 13.5,
                                                              color: AppColors
                                                                  .textPrimary)),
                                                      Container(
                                                        padding:
                                                            const EdgeInsets
                                                                .symmetric(
                                                                horizontal: 6,
                                                                vertical: 2),
                                                        decoration: BoxDecoration(
                                                            color: AppColors
                                                                .purpleSoft,
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        4)),
                                                        child: Text(
                                                            r['managerName']
                                                                .toString(),
                                                            style: const TextStyle(
                                                                fontSize: 9.5,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w800,
                                                                color: AppColors
                                                                    .purple)),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 4),
                                                  Text(
                                                      'Assigned: ${r['total']} • Active: ${r['active']} • Won: ${r['won']} • Lost: ${r['lost']}',
                                                      style: const TextStyle(
                                                          fontSize: 11,
                                                          color: AppColors
                                                              .textSecondary,
                                                          fontWeight:
                                                              FontWeight.w500)),
                                                  const SizedBox(height: 6),
                                                  Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .spaceBetween,
                                                    children: [
                                                      Text(
                                                          'Win Rate: ${rate.toStringAsFixed(1)}%',
                                                          style: const TextStyle(
                                                              fontSize: 11,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w800,
                                                              color: AppColors
                                                                  .success)),
                                                      Text(
                                                          _formatCurrency(
                                                              r['revenue']),
                                                          style: const TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w800,
                                                              fontSize: 12,
                                                              color: AppColors
                                                                  .primary)),
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

  Widget _buildChartLegend(String label, Color color) {
    return Row(
      children: [
        Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label,
            style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary)),
      ],
    );
  }
}
