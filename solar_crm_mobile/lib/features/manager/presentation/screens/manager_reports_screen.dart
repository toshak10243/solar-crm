import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/manager_report_service.dart';

class ManagerReportsScreen extends StatefulWidget {
  const ManagerReportsScreen({Key? key}) : super(key: key);

  @override
  State<ManagerReportsScreen> createState() => _ManagerReportsScreenState();
}

class _ManagerReportsScreenState extends State<ManagerReportsScreen> {
  final ManagerReportService _reportService = ManagerReportService();

  bool _isLoading = true;
  bool _isGeneratingPdf = false;
  String? _errorMessage;

  List<dynamic> _teamMembers = [];
  List<dynamic> _leads = [];

  String _viewMode = 'card';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchReportAnalytics();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchReportAnalytics() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _reportService.getReportData();

    if (mounted) {
      if (result['success'] == true) {
        setState(() {
          _teamMembers = result['teamMembers'] as List;
          _leads = result['leads'] as List;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message']?.toString() ??
              'Failed to load report analytics';
          _isLoading = false;
        });
      }
    }
  }

  // Calculated Per Sales Rep Reports
  List<Map<String, dynamic>> get _repReports {
    final search = _searchController.text.trim().toLowerCase();

    final List<Map<String, dynamic>> reports = _teamMembers.map((member) {
      final memberId = member['id'];
      final memberName = member['full_name']?.toString() ?? 'Sales Rep';
      final email = member['email']?.toString() ?? 'N/A';
      final profileImage = member['profile_image'] ?? member['photo'];

      final memberLeads = _leads.where((l) {
        final assignedTo = l['assigned_to'];
        final assignedToName = l['assigned_to_name']?.toString();
        return (assignedTo != null &&
                assignedTo.toString() == memberId.toString()) ||
            (assignedToName != null &&
                assignedToName.toLowerCase() == memberName.toLowerCase());
      }).toList();

      final total = memberLeads.length;
      final won = memberLeads
          .where((l) => l['status']?.toString().toLowerCase() == 'won')
          .length;
      final lost = memberLeads
          .where((l) => l['status']?.toString().toLowerCase() == 'lost')
          .length;
      final active = total - (won + lost);
      final double conversionRate = total > 0 ? ((won / total) * 100) : 0.0;

      return {
        'id': memberId,
        'name': memberName,
        'email': email,
        'profileImage': profileImage,
        'total': total,
        'won': won,
        'lost': lost,
        'active': active,
        'conversionRate': conversionRate,
      };
    }).toList();

    if (search.isEmpty) return reports;

    return reports.where((r) {
      return r['name'].toString().toLowerCase().contains(search) ||
          r['email'].toString().toLowerCase().contains(search);
    }).toList();
  }

  // 🟢 FIXED PDF GENERATOR ENGINE
  Future<void> _exportPdfReport() async {
    if (_isGeneratingPdf) return;
    setState(() => _isGeneratingPdf = true);

    try {
      final pdf = pw.Document();

      final totalLeads = _leads.length;
      final wonLeads = _leads
          .where((l) => l['status']?.toString().toLowerCase() == 'won')
          .length;
      final lostLeads = _leads
          .where((l) => l['status']?.toString().toLowerCase() == 'lost')
          .length;
      final activeLeads = totalLeads - (wonLeads + lostLeads);
      final double overallConversion =
          totalLeads > 0 ? ((wonLeads / totalLeads) * 100) : 0.0;

      final repList = _repReports;

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(24),
          build: (pw.Context context) => [
            // Header Title
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment:
                      pw.CrossAxisAlignment.start, // 🟢 FIXED PARM NAME
                  children: [
                    pw.Text(
                      'SOLAR CRM - TEAM PERFORMANCE REPORT',
                      style: pw.TextStyle(
                          fontSize: 15,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.blue800),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'Confidential Manager Portal Summary',
                      style: const pw.TextStyle(
                          fontSize: 10, color: PdfColors.grey700),
                    ),
                  ],
                ),
                pw.Text(
                  DateTime.now().toString().split(' ')[0],
                  style: const pw.TextStyle(
                      fontSize: 10, color: PdfColors.grey700),
                ),
              ],
            ),
            pw.Divider(thickness: 1.5, color: PdfColors.blue800),
            pw.SizedBox(height: 12),

            // Summary Table
            pw.Text('GLOBAL PIPELINE SUMMARY',
                style:
                    pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            pw.Table.fromTextArray(
              headers: [
                'Total Leads',
                'Active Pipeline',
                'Deals Won',
                'Deals Lost',
                'Conversion Rate'
              ],
              data: [
                [
                  '$totalLeads',
                  '$activeLeads',
                  '$wonLeads',
                  '$lostLeads',
                  '${overallConversion.toStringAsFixed(1)}%'
                ]
              ],
              headerStyle: pw.TextStyle(
                  fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration:
                  const pw.BoxDecoration(color: PdfColors.blue800),
              cellAlignment: pw.Alignment.center,
            ),
            pw.SizedBox(height: 20),

            // Sales Rep Table
            pw.Text('SALES REPRESENTATIVE BREAKDOWN',
                style:
                    pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            pw.Table.fromTextArray(
              headers: [
                'Representative',
                'Total',
                'Active',
                'Won',
                'Lost',
                'Win Rate'
              ],
              data: repList.map((r) {
                return [
                  r['name'].toString(),
                  '${r['total']}',
                  '${r['active']}',
                  '${r['won']}',
                  '${r['lost']}',
                  '${(r['conversionRate'] as double).toStringAsFixed(1)}%'
                ];
              }).toList(),
              headerStyle: pw.TextStyle(
                  fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration:
                  const pw.BoxDecoration(color: PdfColors.blue700),
              cellAlignment: pw.Alignment.centerLeft,
            ),
            pw.SizedBox(height: 30),

            // Footer Signature Block
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text('Generated by: Manager Portal App',
                    style: const pw.TextStyle(
                        fontSize: 9, color: PdfColors.grey700)),
                pw.Text('Authorized Signature: __________________',
                    style: const pw.TextStyle(
                        fontSize: 9, color: PdfColors.grey700)),
              ],
            ),
          ],
        ),
      );

      final pdfBytes = await pdf.save();

      if (mounted) {
        setState(() => _isGeneratingPdf = false);
      }

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdfBytes,
        name:
            'Solar_CRM_Team_Report_${DateTime.now().millisecondsSinceEpoch}.pdf',
      );
    } catch (_) {
      if (mounted) {
        setState(() => _isGeneratingPdf = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Failed to generate PDF Report'),
              backgroundColor: AppColors.danger),
        );
      }
    }
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'TM';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  String? _getFormattedImageUrl(String? imagePath) {
    if (imagePath == null ||
        imagePath.isEmpty ||
        imagePath == 'null' ||
        imagePath == 'undefined') {
      return null;
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    final serverHost = ApiEndpoints.baseUrl.replaceAll('/api', '');
    String cleanPath =
        imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    if (!cleanPath.startsWith('uploads/profiles/')) {
      if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replaceFirst('uploads/', 'uploads/profiles/');
      } else {
        cleanPath = 'uploads/profiles/$cleanPath';
      }
    }
    return '$serverHost/$cleanPath';
  }

  @override
  Widget build(BuildContext context) {
    final totalLeads = _leads.length;
    final wonLeads = _leads
        .where((l) => l['status']?.toString().toLowerCase() == 'won')
        .length;
    final lostLeads = _leads
        .where((l) => l['status']?.toString().toLowerCase() == 'lost')
        .length;
    final activeLeads = totalLeads - (wonLeads + lostLeads);
    final double overallConversion =
        totalLeads > 0 ? ((wonLeads / totalLeads) * 100) : 0.0;

    final repList = _repReports;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Team Analytics & Reports',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Conversion, Charts & Exports',
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
            icon: Icon(
                _viewMode == 'card'
                    ? Icons.list_alt_rounded
                    : Icons.grid_view_rounded,
                color: AppColors.primary),
            onPressed: () {
              setState(() {
                _viewMode = _viewMode == 'card' ? 'list' : 'card';
              });
            },
            tooltip: 'Toggle Layout',
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: _fetchReportAnalytics,
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
                onRefresh: _fetchReportAnalytics,
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // PDF EXPORT ACTION BUTTON
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: ElevatedButton.icon(
                          onPressed: _isGeneratingPdf ? null : _exportPdfReport,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: _isGeneratingPdf
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.picture_as_pdf_rounded,
                                  size: 18, color: Colors.white),
                          label: const Text(
                              'Export / Print PDF Performance Report',
                              style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                  color: Colors.white)),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 1. OVERALL KPI SUMMARY CARDS
                      GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.75,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildSummaryCard(
                              'TOTAL LEADS',
                              '$totalLeads',
                              'Managed total',
                              Icons.assignment_rounded,
                              AppColors.info,
                              AppColors.infoSoft),
                          _buildSummaryCard(
                              'DEALS WON',
                              '$wonLeads',
                              'Successfully closed',
                              Icons.check_circle_outline_rounded,
                              AppColors.success,
                              AppColors.successSoft),
                          _buildSummaryCard(
                              'ACTIVE PIPELINE',
                              '$activeLeads',
                              'In progress deals',
                              Icons.pending_actions_rounded,
                              AppColors.warning,
                              AppColors.warningSoft),
                          _buildSummaryCard(
                              'WIN RATE',
                              '${overallConversion.toStringAsFixed(1)}%',
                              'Average team rate',
                              Icons.trending_up_rounded,
                              AppColors.primary,
                              AppColors.primarySoft),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 2. VISUAL PERFORMANCE GRAPH / CHART
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('PIPELINE DISTRIBUTION CHART',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textSecondary,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 14),
                            SizedBox(
                              height: 160,
                              child: totalLeads == 0
                                  ? const Center(
                                      child: Text('No lead data for chart',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textMuted)))
                                  : Row(
                                      children: [
                                        Expanded(
                                          child: PieChart(
                                            PieChartData(
                                              sectionsSpace: 3,
                                              centerSpaceRadius: 36,
                                              sections: [
                                                PieChartSectionData(
                                                  color: AppColors.success,
                                                  value: wonLeads.toDouble(),
                                                  title: '$wonLeads',
                                                  radius: 32,
                                                  titleStyle: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: Colors.white),
                                                ),
                                                PieChartSectionData(
                                                  color: AppColors.warning,
                                                  value: activeLeads.toDouble(),
                                                  title: '$activeLeads',
                                                  radius: 32,
                                                  titleStyle: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: Colors.white),
                                                ),
                                                PieChartSectionData(
                                                  color: AppColors.danger,
                                                  value: lostLeads.toDouble(),
                                                  title: '$lostLeads',
                                                  radius: 32,
                                                  titleStyle: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: Colors.white),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            _buildChartLegend(
                                                'Deals Won', AppColors.success),
                                            const SizedBox(height: 8),
                                            _buildChartLegend('Active Pipeline',
                                                AppColors.warning),
                                            const SizedBox(height: 8),
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

                      // 3. SEARCH BAR
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (_) => setState(() {}),
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                          decoration: InputDecoration(
                            hintText:
                                'Search representative by name or email...',
                            hintStyle: const TextStyle(
                                fontSize: 12.5, color: AppColors.textMuted),
                            prefixIcon: const Icon(Icons.search_rounded,
                                size: 20, color: AppColors.textSecondary),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear_rounded,
                                        size: 18),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {});
                                    },
                                  )
                                : null,
                            filled: true,
                            fillColor: AppColors.bg,
                            contentPadding:
                                const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 4. SALES REP LIST / GRID
                      if (repList.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border)),
                          child: const Column(
                            children: [
                              Icon(Icons.assessment_outlined,
                                  size: 40, color: AppColors.textMuted),
                              SizedBox(height: 10),
                              Text('No Report Data Available',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15,
                                      color: AppColors.textPrimary)),
                              SizedBox(height: 4),
                              Text(
                                  'No sales representatives match your search criteria.',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary)),
                            ],
                          ),
                        )
                      else if (_viewMode == 'card')
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: repList.length,
                          itemBuilder: (context, index) {
                            final rep = repList[index];
                            final avatarUrl = _getFormattedImageUrl(
                                rep['profileImage']?.toString());
                            final double rate = rep['conversionRate'] as double;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                                boxShadow: [
                                  BoxShadow(
                                      color: Colors.black.withOpacity(0.02),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3))
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 20,
                                        backgroundColor: AppColors.primaryDark,
                                        backgroundImage: avatarUrl != null
                                            ? NetworkImage(avatarUrl)
                                            : null,
                                        child: avatarUrl == null
                                            ? Text(
                                                _getInitials(
                                                    rep['name'].toString()),
                                                style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 12))
                                            : null,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(rep['name'].toString(),
                                                style: const TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 14.5,
                                                    color:
                                                        AppColors.textPrimary)),
                                            Text(rep['email'].toString(),
                                                style: const TextStyle(
                                                    fontSize: 11.5,
                                                    color: AppColors
                                                        .textSecondary)),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: AppColors.successSoft,
                                          borderRadius:
                                              BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          '${rate.toStringAsFixed(1)}% WIN',
                                          style: const TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.success),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: LinearProgressIndicator(
                                      value: (rate / 100).clamp(0.0, 1.0),
                                      minHeight: 6,
                                      backgroundColor: AppColors.hover,
                                      color: AppColors.success,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceAround,
                                    children: [
                                      _buildRepStat('Total', '${rep['total']}',
                                          AppColors.textPrimary),
                                      _buildRepStat('Active',
                                          '${rep['active']}', AppColors.info),
                                      _buildRepStat('Won', '${rep['won']}',
                                          AppColors.success),
                                      _buildRepStat('Lost', '${rep['lost']}',
                                          AppColors.danger),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: repList.length,
                          itemBuilder: (context, index) {
                            final rep = repList[index];
                            final avatarUrl = _getFormattedImageUrl(
                                rep['profileImage']?.toString());
                            final double rate = rep['conversionRate'] as double;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border)),
                              child: ListTile(
                                leading: CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppColors.primaryDark,
                                  backgroundImage: avatarUrl != null
                                      ? NetworkImage(avatarUrl)
                                      : null,
                                  child: avatarUrl == null
                                      ? Text(
                                          _getInitials(rep['name'].toString()),
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w800,
                                              fontSize: 11))
                                      : null,
                                ),
                                title: Text(rep['name'].toString(),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13.5)),
                                subtitle: Text(
                                    'Total: ${rep['total']} • Active: ${rep['active']} • Won: ${rep['won']}',
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary)),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                      color: AppColors.successSoft,
                                      borderRadius: BorderRadius.circular(6)),
                                  child: Text('${rate.toStringAsFixed(1)}%',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 11,
                                          color: AppColors.success)),
                                ),
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildChartLegend(String label, Color color) {
    return Row(
      children: [
        Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _buildSummaryCard(String label, String value, String sub,
      IconData icon, Color color, Color bg) {
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
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary)),
          Text(sub,
              style: TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }

  Widget _buildRepStat(String label, String val, Color color) {
    return Column(
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary)),
        const SizedBox(height: 2),
        Text(val,
            style: TextStyle(
                fontSize: 14, fontWeight: FontWeight.w800, color: color)),
      ],
    );
  }
}
