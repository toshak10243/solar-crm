import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/models/lead_model.dart';
import '../../data/sales_lead_service.dart';

// Small additions not present in AppColors (used only for the
// "Change Status" accent + pipeline "Site Visit / Quotation" tint).
// AppColors itself is NOT modified.
class _Extra {
  static const purple = Color(0xFF9333EA);
  static const purpleSoft = Color(0xFFF3E8FF);
}

const List<String> kStatusOptions = [
  'New Lead',
  'Contacted',
  'Follow-up Pending',
  'Site Visit Scheduled',
  'Quotation Sent',
  'Negotiation',
  'Won',
  'Lost',
  'Not Interested',
];

const List<String> kPipelineSteps = [
  'New Lead',
  'Contacted',
  'Follow-up Pending',
  'Site Visit Scheduled',
  'Quotation Sent',
  'Negotiation',
  'Won',
];

const List<String> kStatusNeedsExtra = [
  'Quotation Sent',
  'Site Visit Scheduled'
];
const List<String> kClosedStatuses = ['Won', 'Lost', 'Not Interested'];
const List<String> kNegativeClosedStatuses = ['Lost', 'Not Interested'];

const List<String> kPriorityOptions = ['Low', 'Medium', 'High'];
const List<String> kInterestOptions = [
  'Pending',
  'Interested',
  'Not Interested'
];
const List<String> kFollowupTypeOptions = [
  'Call',
  'WhatsApp',
  'SMS',
  'Meeting',
  'Site Visit',
  'Other'
];

// NEW — used by the Add Lead form.
const List<String> kSolarRequirementOptions = ['Residential', 'Commercial'];
const List<String> kLeadSourceOptions = [
  'Website',
  'Call',
  'Reference',
  'Facebook',
  'Google',
  'Other'
];

Color _statusBg(String status) {
  switch (status) {
    case 'New Lead':
      return AppColors.infoSoft;
    case 'Contacted':
      return AppColors.primarySoft;
    case 'Follow-up Pending':
      return AppColors.warningSoft;
    case 'Site Visit Scheduled':
      return _Extra.purpleSoft;
    case 'Quotation Sent':
      return const Color(0xFFEDE9FE);
    case 'Negotiation':
      return const Color(0xFFFCE7F3);
    case 'Won':
      return AppColors.successSoft;
    case 'Lost':
      return AppColors.dangerSoft;
    case 'Not Interested':
      return const Color(0xFFF1F5F9);
    default:
      return const Color(0xFFF1F5F9);
  }
}

Color _statusColor(String status) {
  switch (status) {
    case 'New Lead':
      return AppColors.info;
    case 'Contacted':
      return AppColors.primary;
    case 'Follow-up Pending':
      return AppColors.warning;
    case 'Site Visit Scheduled':
      return _Extra.purple;
    case 'Quotation Sent':
      return const Color(0xFF7C3AED);
    case 'Negotiation':
      return const Color(0xFFC026D3);
    case 'Won':
      return AppColors.success;
    case 'Lost':
      return AppColors.danger;
    case 'Not Interested':
      return AppColors.textSecondary;
    default:
      return AppColors.textSecondary;
  }
}

Color _priorityBg(String p) {
  switch (p) {
    case 'Low':
      return const Color(0xFFF1F5F9);
    case 'Medium':
      return AppColors.warningSoft;
    case 'High':
      return AppColors.dangerSoft;
    default:
      return const Color(0xFFF1F5F9);
  }
}

Color _priorityColor(String p) {
  switch (p) {
    case 'Low':
      return AppColors.textSecondary;
    case 'Medium':
      return AppColors.warning;
    case 'High':
      return AppColors.danger;
    default:
      return AppColors.textSecondary;
  }
}

IconData _actionIcon(String actionType) {
  switch (actionType) {
    case 'Lead Created':
      return Icons.add_circle_outline_rounded;
    case 'Lead Assigned':
      return Icons.person_add_alt_outlined;
    case 'Lead Reassigned':
      return Icons.swap_horiz_outlined;
    case 'Lead Updated':
      return Icons.sync_alt_outlined;
    case 'Status Changed':
      return Icons.sync_alt_outlined;
    case 'Follow-up Added':
      return Icons.event_available_outlined;
    case 'Quotation Sent':
      return Icons.receipt_long_outlined;
    case 'Site Visit Scheduled':
      return Icons.place_outlined;
    case 'Lead Closed':
      return Icons.flag_outlined;
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

String _fmtDate(String? v) {
  if (v == null || v.isEmpty) return '—';
  try {
    final d = DateTime.parse(v);
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
    return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}';
  } catch (_) {
    return v;
  }
}

String _fmtDateTime(String? v) {
  if (v == null || v.isEmpty) return '—';
  try {
    final d = DateTime.parse(v).toLocal();
    final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final ampm = d.hour >= 12 ? 'PM' : 'AM';
    return '${_fmtDate(v)}, ${h.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')} $ampm';
  } catch (_) {
    return v;
  }
}

bool _isOverdue(String? dateStr, String status) {
  if (dateStr == null || dateStr.isEmpty || kClosedStatuses.contains(status))
    return false;
  try {
    final due = DateTime.parse(dateStr);
    final today = DateTime.now();
    final dueOnly = DateTime(due.year, due.month, due.day);
    final todayOnly = DateTime(today.year, today.month, today.day);
    return dueOnly.isBefore(todayOnly);
  } catch (_) {
    return false;
  }
}

// ---------- Follow-up summary strip helpers ----------
// Mirrors the web (JSX) implementation's getToday()/getFollowupStatus():
// returns 'overdue' | 'today' | 'upcoming' (within next 7 days) | null.
DateTime _todayDateOnly() {
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day);
}

String? _followupStatus(String? dateStr, String status) {
  if (dateStr == null || dateStr.isEmpty || kClosedStatuses.contains(status)) {
    return null;
  }
  try {
    final due = DateTime.parse(dateStr);
    final dueOnly = DateTime(due.year, due.month, due.day);
    final today = _todayDateOnly();
    final diffDays = dueOnly.difference(today).inDays;
    if (diffDays < 0) return 'overdue';
    if (diffDays == 0) return 'today';
    if (diffDays <= 7) return 'upcoming';
    return null;
  } catch (_) {
    return null;
  }
}

String _initials(String name) {
  if (name.trim().isEmpty) return '?';
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
  return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
      .toUpperCase();
}

int _hashHue(String s) {
  int hash = 0;
  for (final c in s.codeUnits) {
    hash = c + ((hash << 5) - hash);
  }
  return hash.abs() % 360;
}

Color _hslColor(double h, double s, double l) =>
    HSLColor.fromAHSL(1, h, s, l).toColor();

class _GradientAvatar extends StatelessWidget {
  final String name;
  final double size;
  const _GradientAvatar({required this.name, this.size = 36});

  @override
  Widget build(BuildContext context) {
    final hue = _hashHue(name.isEmpty ? '?' : name).toDouble();
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_hslColor(hue, 0.58, 0.50), _hslColor(hue + 30, 0.60, 0.42)],
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        _initials(name),
        style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: size * 0.38),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color bg;
  final Color color;
  const _Badge({required this.label, required this.bg, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 10.5, fontWeight: FontWeight.w800, color: color),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
            color: AppColors.textSecondary,
            letterSpacing: 0.4),
      ),
    );
  }
}

InputDecoration _fieldDecoration({String? hint, String? error}) {
  return InputDecoration(
    hintText: hint,
    errorText: error,
    isDense: true,
    filled: true,
    fillColor: AppColors.card,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border)),
    enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border)),
    focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
    errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.danger)),
  );
}

ButtonStyle _primaryBtnStyle({Color? bg}) => ElevatedButton.styleFrom(
      backgroundColor: bg ?? AppColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
      minimumSize: const Size.fromHeight(42),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
    );

ButtonStyle _outlinedBtnStyle({Color? color, Color? border}) =>
    OutlinedButton.styleFrom(
      foregroundColor: color ?? AppColors.textPrimary,
      side: BorderSide(color: border ?? AppColors.border),
      minimumSize: const Size.fromHeight(40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5),
    );

// ======================================================
// MAIN LIST SCREEN
// ======================================================
class SalesLeadsScreen extends StatefulWidget {
  const SalesLeadsScreen({Key? key}) : super(key: key);

  @override
  State<SalesLeadsScreen> createState() => _SalesLeadsScreenState();
}

class _SalesLeadsScreenState extends State<SalesLeadsScreen> {
  final SalesLeadService _leadService = SalesLeadService();
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  List<LeadModel> _leads = [];
  int _total = 0;
  bool _isLoading = true;

  int _page = 1;
  final int _limit = 10;

  String _selectedStatus = '';
  String _selectedPriority = '';

  // Set right after a successful create so the matching card can be
  // briefly highlighted once the refreshed list renders — avoids the
  // rep having to hunt for the lead they just added.
  int? _justCreatedLeadId;

  @override
  void initState() {
    super.initState();
    _fetchLeads();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _page = 1;
      _fetchLeads();
    });
  }

  Future<void> _fetchLeads() async {
    setState(() => _isLoading = true);
    final result = await _leadService.getLeads(
      page: _page,
      limit: _limit,
      search: _searchController.text.trim(),
      status: _selectedStatus,
      priority: _selectedPriority,
    );

    if (!mounted) return;
    if (result['success'] == true) {
      setState(() {
        _leads = result['leads'] as List<LeadModel>;
        _total = result['total'] is int
            ? result['total'] as int
            : int.tryParse('${result['total']}') ?? _leads.length;
      });
    } else {
      _showNotification(result['message'] ?? 'Failed to load leads',
          isError: true);
    }
    setState(() => _isLoading = false);
  }

  void _resetFilters() {
    _searchController.clear();
    setState(() {
      _selectedStatus = '';
      _selectedPriority = '';
      _page = 1;
    });
    _fetchLeads();
  }

  bool get _hasActiveFilters =>
      _searchController.text.isNotEmpty ||
      _selectedStatus.isNotEmpty ||
      _selectedPriority.isNotEmpty;

  int get _totalPages => (_total / _limit).ceil().clamp(1, 999999);

  // ---------- Follow-up summary strip (client-side, from already-fetched _leads) ----------
  List<LeadModel> get _overdueFollowups => _leads
      .where((l) => _followupStatus(l.nextFollowUpDate, l.status) == 'overdue')
      .toList();

  List<LeadModel> get _todayFollowups => _leads
      .where((l) => _followupStatus(l.nextFollowUpDate, l.status) == 'today')
      .toList();

  List<LeadModel> get _upcomingFollowups => _leads
      .where((l) => _followupStatus(l.nextFollowUpDate, l.status) == 'upcoming')
      .toList();

  void _makePhoneCall(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty) {
      _showNotification('Phone number not available', isError: true);
      return;
    }
    final uri = Uri.parse('tel:${phoneNumber.trim()}');
    try {
      await launchUrl(uri);
    } catch (_) {
      _showNotification('Could not open phone dialer', isError: true);
    }
  }

  void _sendSms(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty) {
      _showNotification('Phone number not available', isError: true);
      return;
    }
    final uri = Uri.parse('sms:${phoneNumber.trim()}');
    try {
      await launchUrl(uri);
    } catch (_) {
      _showNotification('Could not open messages app', isError: true);
    }
  }

  void _openWhatsApp(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty) {
      _showNotification('Mobile number not available', isError: true);
      return;
    }
    final digitsOnly = phoneNumber.replaceAll(RegExp(r'\D'), '');
    final formattedNumber =
        digitsOnly.length == 10 ? '91$digitsOnly' : digitsOnly;
    final appUri = Uri.parse('whatsapp://send?phone=$formattedNumber');
    final webUri = Uri.parse('https://wa.me/$formattedNumber');
    try {
      if (await canLaunchUrl(appUri)) {
        await launchUrl(appUri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      _showNotification(
          'Could not open WhatsApp. Please check if app is installed.',
          isError: true);
    }
  }

  void _showNotification(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
                isError
                    ? Icons.error_outline_rounded
                    : Icons.check_circle_outline_rounded,
                color: Colors.white,
                size: 20),
            const SizedBox(width: 10),
            Expanded(
                child: Text(message,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13))),
          ],
        ),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _openLeadDetailsSheet(LeadModel lead) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FractionallySizedBox(
        heightFactor: 0.94,
        child: _LeadDetailSheet(
          leadId: lead.id,
          onLeadChanged: _fetchLeads,
        ),
      ),
    );
  }

  // ---------- Add Lead ----------
  Future<void> _openAddLeadSheet() async {
    final createdLead = await showModalBottomSheet<LeadModel>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FractionallySizedBox(
        heightFactor: 0.92,
        child: _AddLeadSheet(leadService: _leadService),
      ),
    );

    if (createdLead == null || !mounted) return;

    // New leads always land on page 1 with status "New Lead" — jump
    // back there and clear any status filter that would hide it, so
    // the rep doesn't have to hit refresh or hunt for it manually.
    setState(() {
      _page = 1;
      if (_selectedStatus.isNotEmpty && _selectedStatus != 'New Lead') {
        _selectedStatus = '';
      }
      _justCreatedLeadId = createdLead.id;
    });

    await _fetchLeads();
    _showNotification('Lead created and assigned to you.');

    // Clear the highlight after a few seconds.
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _justCreatedLeadId = null);
    });
  }

  // ---------- Follow-up summary strip UI ----------
  // NOTE: Deliberately using Wrap (not Row + horizontal ScrollView).
  // With a fixed-width child inside Row/SingleChildScrollView, an
  // unbounded-width parent (double.infinity Container) can collapse the
  // inner Column's layout pass and the card renders as a flat colour
  // block with no visible text. Wrap avoids that failure mode entirely
  // and also matches the web version's `flexWrap: "wrap"` behaviour.
  Widget _buildFollowupSummaryStrip() {
    final overdue = _overdueFollowups;
    final today = _todayFollowups;
    final upcoming = _upcomingFollowups;

    if (overdue.isEmpty && today.isEmpty && upcoming.isEmpty) {
      return const SizedBox.shrink();
    }

    final cards = <Widget>[
      if (overdue.isNotEmpty)
        _followupSummaryCard(
          emoji: '🔴',
          label: 'Overdue',
          count: overdue.length,
          bg: AppColors.dangerSoft,
          accent: AppColors.danger,
          leads: overdue,
          showDate: true,
        ),
      if (today.isNotEmpty)
        _followupSummaryCard(
          emoji: '🟡',
          label: 'Today',
          count: today.length,
          bg: AppColors.warningSoft,
          accent: AppColors.warning,
          leads: today,
          showDate: false,
        ),
      if (upcoming.isNotEmpty)
        _followupSummaryCard(
          emoji: '🔵',
          label: 'Next 7 Days',
          count: upcoming.length,
          bg: AppColors.infoSoft,
          accent: AppColors.info,
          leads: upcoming,
          showDate: true,
        ),
    ];

    return Container(
      width: double.infinity,
      color: AppColors.card,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: SizedBox(
        height: 100,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: cards.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (context, i) => cards[i],
        ),
      ),
    );
  }

  // Opens a bottom sheet showing the FULL list for a follow-up category
  // (Overdue / Today / Next 7 Days) — used when the summary card is tapped.
  void _openFollowupListSheet({
    required String emoji,
    required String label,
    required List<LeadModel> leads,
    required Color accent,
    required bool showDate,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FractionallySizedBox(
        heightFactor: 0.75,
        child: Container(
          decoration: const BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            top: false,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 10, bottom: 4),
                  child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(4))),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 12, 8),
                  child: Row(
                    children: [
                      Text(emoji, style: const TextStyle(fontSize: 18)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '$label (${leads.length})',
                          style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                              color: AppColors.textPrimary),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: AppColors.border),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: leads.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final l = leads[i];
                      return InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () {
                          Navigator.pop(ctx);
                          _openLeadDetailsSheet(l);
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceMuted,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              _GradientAvatar(name: l.customerName, size: 34),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(l.customerName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 13.5,
                                            color: AppColors.textPrimary)),
                                    if (showDate)
                                      Text(
                                        'Follow-up: ${_fmtDate(l.nextFollowUpDate)}',
                                        style: TextStyle(
                                            fontSize: 11.5,
                                            color: accent,
                                            fontWeight: FontWeight.w600),
                                      ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right_rounded,
                                  color: AppColors.textMuted, size: 20),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _followupSummaryCard({
    required String emoji,
    required String label,
    required int count,
    required Color bg,
    required Color accent,
    required List<LeadModel> leads,
    required bool showDate,
  }) {
    final shown = leads.take(2).toList();
    final remaining = leads.length - shown.length;

    return SizedBox(
      width: 178,
      height: 100,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Material(
          color: bg,
          child: InkWell(
            onTap: () => _openFollowupListSheet(
              emoji: emoji,
              label: label,
              leads: leads,
              accent: accent,
              showDate: showDate,
            ),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 3, color: accent),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: accent.withOpacity(0.16)),
                      ),
                      padding: const EdgeInsets.fromLTRB(9, 6, 9, 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(emoji, style: const TextStyle(fontSize: 10)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: accent),
                                ),
                              ),
                              Text(
                                '$count',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: accent,
                                    height: 1),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          for (final l in shown)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 1),
                              child: Text(
                                '• ${l.customerName}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  color: accent,
                                ),
                              ),
                            ),
                          if (remaining > 0)
                            Text(
                              '+$remaining more',
                              style: TextStyle(
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.w700,
                                  color: accent.withOpacity(0.75)),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(
        textTheme: Theme.of(context).textTheme.apply(
              bodyColor: AppColors.textPrimary,
              displayColor: AppColors.textPrimary,
            ),
        inputDecorationTheme: const InputDecorationTheme(
          labelStyle: TextStyle(color: AppColors.textSecondary),
          hintStyle: TextStyle(color: AppColors.textMuted),
        ),
      ),
      child: Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          title: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('My Assigned Leads',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                      color: AppColors.textPrimary)),
              Text('Sales Executive Portal',
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
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primary))
                  : const Icon(Icons.refresh_rounded, color: AppColors.primary),
              onPressed: _isLoading ? null : _fetchLeads,
            ),
            const SizedBox(width: 4),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: _openAddLeadSheet,
          backgroundColor: AppColors.primary,
          icon: const Icon(Icons.add_rounded, color: Colors.white),
          label: const Text('Add Lead',
              style:
                  TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
        ),
        body: SafeArea(
          child: Column(
            children: [
              // FOLLOW-UP SUMMARY STRIP — client-side only, derived from
              // leads already fetched in _leads. Hidden entirely when
              // there's no overdue / today / upcoming(7d) follow-up.
              _buildFollowupSummaryStrip(),

              // SEARCH & FILTER BAR
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: AppColors.card,
                  border: Border(
                      bottom: BorderSide(color: AppColors.border, width: 1)),
                ),
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      style: const TextStyle(
                          fontSize: 13.5, fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        hintText: 'Lead code, name, or phone...',
                        hintStyle: const TextStyle(
                            fontSize: 13, color: AppColors.textMuted),
                        prefixIcon: const Icon(Icons.search_rounded,
                            size: 20, color: AppColors.textSecondary),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  _page = 1;
                                  _fetchLeads();
                                  setState(() {});
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: AppColors.bg,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: AppColors.border)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: AppColors.border)),
                        focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: AppColors.primary)),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedStatus.isEmpty
                                ? null
                                : _selectedStatus,
                            isExpanded: true,
                            decoration: _fieldDecoration(hint: 'All Statuses')
                                .copyWith(fillColor: AppColors.bg),
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w700),
                            items: kStatusOptions
                                .map((s) => DropdownMenuItem(
                                    value: s,
                                    child: Text(s,
                                        overflow: TextOverflow.ellipsis)))
                                .toList(),
                            onChanged: (val) {
                              setState(() {
                                _selectedStatus = val ?? '';
                                _page = 1;
                              });
                              _fetchLeads();
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedPriority.isEmpty
                                ? null
                                : _selectedPriority,
                            isExpanded: true,
                            decoration: _fieldDecoration(hint: 'All Priorities')
                                .copyWith(fillColor: AppColors.bg),
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w700),
                            items: kPriorityOptions
                                .map((p) =>
                                    DropdownMenuItem(value: p, child: Text(p)))
                                .toList(),
                            onChanged: (val) {
                              setState(() {
                                _selectedPriority = val ?? '';
                                _page = 1;
                              });
                              _fetchLeads();
                            },
                          ),
                        ),
                        if (_hasActiveFilters) ...[
                          const SizedBox(width: 8),
                          IconButton(
                            tooltip: 'Reset Filters',
                            onPressed: _resetFilters,
                            icon: const Icon(Icons.filter_alt_off_outlined,
                                size: 20),
                            style: IconButton.styleFrom(
                              backgroundColor: AppColors.primarySoft,
                              foregroundColor: AppColors.primary,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              // LEADS LIST
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary, strokeWidth: 2.5))
                    : _leads.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 68,
                                    height: 68,
                                    decoration: BoxDecoration(
                                        color: AppColors.primarySoft,
                                        borderRadius:
                                            BorderRadius.circular(18)),
                                    child: const Icon(
                                        Icons.inventory_2_outlined,
                                        size: 34,
                                        color: AppColors.primary),
                                  ),
                                  const SizedBox(height: 16),
                                  const Text('No Leads Assigned Yet',
                                      style: TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                          color: AppColors.textPrimary)),
                                  const SizedBox(height: 6),
                                  const Text(
                                    "Add a new enquiry yourself, or wait for your manager to assign one.",
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                        fontSize: 12.5,
                                        color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 18),
                                  ElevatedButton.icon(
                                    onPressed: _openAddLeadSheet,
                                    icon:
                                        const Icon(Icons.add_rounded, size: 18),
                                    label: const Text('Add Lead'),
                                    style: _primaryBtnStyle().copyWith(
                                      minimumSize:
                                          const MaterialStatePropertyAll(
                                              Size(160, 42)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _fetchLeads,
                            color: AppColors.primary,
                            child: ListView.builder(
                              padding:
                                  const EdgeInsets.fromLTRB(16, 14, 16, 84),
                              itemCount: _leads.length,
                              itemBuilder: (context, index) {
                                final lead = _leads[index];
                                return _LeadCard(
                                  lead: lead,
                                  highlighted: lead.id == _justCreatedLeadId,
                                  onTap: () => _openLeadDetailsSheet(lead),
                                  onCall: () =>
                                      _makePhoneCall(lead.mobileNumber),
                                  onWhatsApp: () =>
                                      _openWhatsApp(lead.mobileNumber),
                                  onSms: () => _sendSms(lead.mobileNumber),
                                );
                              },
                            ),
                          ),
              ),

              // PAGINATION BAR
              if (!_isLoading && _leads.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: const BoxDecoration(
                    color: AppColors.card,
                    border: Border(top: BorderSide(color: AppColors.border)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Page $_page of $_totalPages  •  $_total total',
                          style: const TextStyle(
                              fontSize: 11.5,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w600)),
                      Row(
                        children: [
                          IconButton(
                            onPressed: _page > 1
                                ? () {
                                    setState(() => _page -= 1);
                                    _fetchLeads();
                                  }
                                : null,
                            icon: const Icon(Icons.chevron_left_rounded),
                            style: IconButton.styleFrom(
                                backgroundColor: AppColors.bg,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8))),
                          ),
                          const SizedBox(width: 6),
                          IconButton(
                            onPressed: _page < _totalPages
                                ? () {
                                    setState(() => _page += 1);
                                    _fetchLeads();
                                  }
                                : null,
                            icon: const Icon(Icons.chevron_right_rounded),
                            style: IconButton.styleFrom(
                                backgroundColor: AppColors.bg,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8))),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ======================================================
// LEAD CARD (list item)
// ======================================================
class _LeadCard extends StatelessWidget {
  final LeadModel lead;
  final VoidCallback onTap;
  final VoidCallback onCall;
  final VoidCallback onWhatsApp;
  final VoidCallback onSms;
  final bool highlighted;

  const _LeadCard({
    required this.lead,
    required this.onTap,
    required this.onCall,
    required this.onWhatsApp,
    required this.onSms,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    final overdue = _isOverdue(lead.nextFollowUpDate, lead.status);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: highlighted ? AppColors.primarySoft : AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: highlighted ? AppColors.primary : AppColors.border,
            width: highlighted ? 1.4 : 1),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 3))
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _GradientAvatar(name: lead.customerName, size: 38),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(lead.leadCode,
                            style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                                color: AppColors.primary)),
                        Text(lead.customerName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15.5,
                                color: AppColors.textPrimary)),
                      ],
                    ),
                  ),
                  _Badge(
                      label: lead.status,
                      bg: _statusBg(lead.status),
                      color: _statusColor(lead.status)),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 15, color: AppColors.textMuted),
                  const SizedBox(width: 4),
                  Text(lead.city ?? 'Location N/A',
                      style: const TextStyle(
                          fontSize: 12.5,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500)),
                  if (lead.requiredKw != null) ...[
                    const SizedBox(width: 12),
                    const Icon(Icons.solar_power_outlined,
                        size: 15, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text('${lead.requiredKw} kW',
                        style: const TextStyle(
                            fontSize: 12.5,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700)),
                  ],
                ],
              ),
              if (lead.nextFollowUpDate != null) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                        overdue
                            ? Icons.warning_amber_rounded
                            : Icons.event_outlined,
                        size: 14,
                        color:
                            overdue ? AppColors.danger : AppColors.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      'Next follow-up: ${_fmtDate(lead.nextFollowUpDate)}',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: overdue ? FontWeight.w800 : FontWeight.w500,
                        color: overdue
                            ? AppColors.danger
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              const Divider(height: 1, color: AppColors.border),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                        color: _priorityBg(lead.priority),
                        borderRadius: BorderRadius.circular(6)),
                    child: Text('${lead.priority} Priority',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: _priorityColor(lead.priority))),
                  ),
                  Row(
                    children: [
                      _iconAction(
                          icon: Icons.phone_in_talk_rounded,
                          color: AppColors.info,
                          bg: AppColors.infoSoft,
                          onTap: onCall),
                      const SizedBox(width: 6),
                      _iconAction(
                          icon: Icons.sms_outlined,
                          color: AppColors.textSecondary,
                          bg: const Color(0xFFF1F5F9),
                          onTap: onSms),
                      const SizedBox(width: 6),
                      _iconAction(
                          icon: Icons.chat_rounded,
                          color: const Color(0xFF128C7E),
                          bg: const Color(0x1F25D366),
                          onTap: onWhatsApp),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _iconAction(
      {required IconData icon,
      required Color color,
      required Color bg,
      required VoidCallback onTap}) {
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(7),
          child: Icon(icon, size: 16, color: color),
        ),
      ),
    );
  }
}

// ======================================================
// ADD LEAD SHEET
// ======================================================
// Sales self-creates a lead. `assigned_to` / `status` are intentionally
// NOT collected here — the backend forces assigned_to = self and
// status = "New Lead" for the Sales role regardless of what is sent,
// so showing those controls would just be misleading.
class _AddLeadSheet extends StatefulWidget {
  final SalesLeadService leadService;
  const _AddLeadSheet({required this.leadService});

  @override
  State<_AddLeadSheet> createState() => _AddLeadSheetState();
}

class _AddLeadSheetState extends State<_AddLeadSheet> {
  final GlobalKey<ScaffoldMessengerState> _sheetMessengerKey =
      GlobalKey<ScaffoldMessengerState>();

  final _customerNameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _alternateCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();
  final _requiredKwCtrl = TextEditingController();
  final _remarkCtrl = TextEditingController();

  String _solarRequirement = 'Residential';
  String _interestStatus = 'Pending';
  String _leadSource = 'Website';
  String _priority = 'Medium';

  String? _customerNameError;
  String? _mobileError;
  String? _emailError;
  String? _requiredKwError;
  String? _remarkError;

  bool _saving = false;

  @override
  void dispose() {
    _customerNameCtrl.dispose();
    _mobileCtrl.dispose();
    _alternateCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    _requiredKwCtrl.dispose();
    _remarkCtrl.dispose();
    super.dispose();
  }

  void _toast(String message, {bool isError = false}) {
    final messenger = _sheetMessengerKey.currentState;
    if (messenger == null) return;
    messenger.clearSnackBars();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  bool _validate() {
    setState(() {
      _customerNameError = null;
      _mobileError = null;
      _emailError = null;
      _requiredKwError = null;
      _remarkError = null;
    });

    bool valid = true;

    if (_customerNameCtrl.text.trim().isEmpty) {
      setState(() => _customerNameError = 'Customer name is required.');
      valid = false;
    }

    final mobile = _mobileCtrl.text.trim();
    if (mobile.isEmpty) {
      setState(() => _mobileError = 'Mobile number is required.');
      valid = false;
    } else if (!RegExp(r'^\d{10}$').hasMatch(mobile)) {
      setState(() => _mobileError = 'Enter a valid 10-digit mobile number.');
      valid = false;
    }

    final email = _emailCtrl.text.trim();
    if (email.isNotEmpty && !RegExp(r'^\S+@\S+\.\S+$').hasMatch(email)) {
      setState(() => _emailError = 'Enter a valid email address.');
      valid = false;
    }

    if (_interestStatus == 'Interested') {
      final kw = num.tryParse(_requiredKwCtrl.text.trim());
      if (kw == null || kw <= 0) {
        setState(() =>
            _requiredKwError = 'Required kW is mandatory when Interested.');
        valid = false;
      }
    }

    if (_interestStatus == 'Not Interested' &&
        _remarkCtrl.text.trim().isEmpty) {
      setState(() => _remarkError = 'Remark is mandatory when Not Interested.');
      valid = false;
    }

    return valid;
  }

  Future<void> _submit() async {
    if (!_validate()) return;

    setState(() => _saving = true);

    final body = <String, dynamic>{
      'customer_name': _customerNameCtrl.text.trim(),
      'mobile_number': _mobileCtrl.text.trim(),
      if (_alternateCtrl.text.trim().isNotEmpty)
        'alternate_number': _alternateCtrl.text.trim(),
      if (_emailCtrl.text.trim().isNotEmpty) 'email': _emailCtrl.text.trim(),
      if (_addressCtrl.text.trim().isNotEmpty)
        'address': _addressCtrl.text.trim(),
      if (_cityCtrl.text.trim().isNotEmpty) 'city': _cityCtrl.text.trim(),
      if (_stateCtrl.text.trim().isNotEmpty) 'state': _stateCtrl.text.trim(),
      if (_pincodeCtrl.text.trim().isNotEmpty)
        'pincode': _pincodeCtrl.text.trim(),
      'solar_requirement': _solarRequirement,
      'interest_status': _interestStatus,
      if (_requiredKwCtrl.text.trim().isNotEmpty)
        'required_kw': num.tryParse(_requiredKwCtrl.text.trim()),
      'lead_source': _leadSource,
      'priority': _priority,
      if (_remarkCtrl.text.trim().isNotEmpty) 'remark': _remarkCtrl.text.trim(),
      // NOTE: no assigned_to / status here — backend forces both for
      // the Sales role. See SalesLeadService.createLead() doc comment.
    };

    final res = await widget.leadService.createLead(body);

    if (!mounted) return;
    setState(() => _saving = false);

    if (res['success'] == true) {
      Navigator.pop(context, res['lead'] as LeadModel?);
    } else {
      _toast(res['message'] ?? 'Failed to create lead.', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ScaffoldMessenger(
      key: _sheetMessengerKey,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Theme(
          data: Theme.of(context).copyWith(
            textTheme: Theme.of(context).textTheme.apply(
                  bodyColor: AppColors.textPrimary,
                  displayColor: AppColors.textPrimary,
                ),
            inputDecorationTheme: const InputDecorationTheme(
              labelStyle: TextStyle(color: AppColors.textSecondary),
              hintStyle: TextStyle(color: AppColors.textMuted),
            ),
          ),
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                children: [
                  // Drag handle
                  Padding(
                    padding: const EdgeInsets.only(top: 10, bottom: 4),
                    child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                            color: AppColors.border,
                            borderRadius: BorderRadius.circular(4))),
                  ),
                  // Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 12, 8),
                    child: Row(
                      children: [
                        const Expanded(
                          child: Text('Add New Lead',
                              style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 17,
                                  color: AppColors.textPrimary)),
                        ),
                        IconButton(
                          onPressed:
                              _saving ? null : () => Navigator.pop(context),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                  ),

                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Info banner
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.infoSoft,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                  color: AppColors.info.withOpacity(0.25)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.person_outline_rounded,
                                    size: 18, color: AppColors.info),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'This lead will be created with status "New Lead" and assigned to you automatically.',
                                    style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.info),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          const _FieldLabel('Customer Name *'),
                          TextField(
                            controller: _customerNameCtrl,
                            decoration: _fieldDecoration(
                                hint: 'Full name', error: _customerNameError),
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Mobile Number *'),
                          TextField(
                            controller: _mobileCtrl,
                            keyboardType: TextInputType.phone,
                            maxLength: 10,
                            buildCounter: (context,
                                    {required currentLength,
                                    required isFocused,
                                    maxLength}) =>
                                null,
                            decoration: _fieldDecoration(
                                hint: '10-digit number', error: _mobileError),
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Alternate Number'),
                          TextField(
                            controller: _alternateCtrl,
                            keyboardType: TextInputType.phone,
                            maxLength: 10,
                            buildCounter: (context,
                                    {required currentLength,
                                    required isFocused,
                                    maxLength}) =>
                                null,
                            decoration: _fieldDecoration(hint: 'Optional'),
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Email'),
                          TextField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            decoration: _fieldDecoration(
                                hint: 'Optional', error: _emailError),
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Address'),
                          TextField(
                            controller: _addressCtrl,
                            decoration: _fieldDecoration(hint: 'Full address'),
                          ),
                          const SizedBox(height: 12),

                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const _FieldLabel('State'),
                                    TextField(
                                      controller: _stateCtrl,
                                      decoration:
                                          _fieldDecoration(hint: 'State'),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const _FieldLabel('City'),
                                    TextField(
                                      controller: _cityCtrl,
                                      decoration:
                                          _fieldDecoration(hint: 'City'),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Pincode'),
                          TextField(
                            controller: _pincodeCtrl,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            buildCounter: (context,
                                    {required currentLength,
                                    required isFocused,
                                    maxLength}) =>
                                null,
                            decoration: _fieldDecoration(hint: 'Pincode'),
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Solar Requirement'),
                          DropdownButtonFormField<String>(
                            value: _solarRequirement,
                            isExpanded: true,
                            decoration: _fieldDecoration(),
                            items: kSolarRequirementOptions
                                .map((o) =>
                                    DropdownMenuItem(value: o, child: Text(o)))
                                .toList(),
                            onChanged: (v) => setState(
                                () => _solarRequirement = v ?? 'Residential'),
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Interest Status'),
                          DropdownButtonFormField<String>(
                            value: _interestStatus,
                            isExpanded: true,
                            decoration: _fieldDecoration(),
                            items: kInterestOptions
                                .map((o) =>
                                    DropdownMenuItem(value: o, child: Text(o)))
                                .toList(),
                            onChanged: (v) => setState(
                                () => _interestStatus = v ?? 'Pending'),
                          ),
                          const SizedBox(height: 12),

                          _FieldLabel(_interestStatus == 'Interested'
                              ? 'Required kW *'
                              : 'Required kW'),
                          TextField(
                            controller: _requiredKwCtrl,
                            keyboardType: TextInputType.number,
                            decoration: _fieldDecoration(
                                hint: 'e.g. 5', error: _requiredKwError),
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Lead Source'),
                          DropdownButtonFormField<String>(
                            value: _leadSource,
                            isExpanded: true,
                            decoration: _fieldDecoration(),
                            items: kLeadSourceOptions
                                .map((o) =>
                                    DropdownMenuItem(value: o, child: Text(o)))
                                .toList(),
                            onChanged: (v) =>
                                setState(() => _leadSource = v ?? 'Website'),
                          ),
                          const SizedBox(height: 12),

                          const _FieldLabel('Priority'),
                          DropdownButtonFormField<String>(
                            value: _priority,
                            isExpanded: true,
                            decoration: _fieldDecoration(),
                            items: kPriorityOptions
                                .map((o) =>
                                    DropdownMenuItem(value: o, child: Text(o)))
                                .toList(),
                            onChanged: (v) =>
                                setState(() => _priority = v ?? 'Medium'),
                          ),
                          const SizedBox(height: 12),

                          _FieldLabel(_interestStatus == 'Not Interested'
                              ? 'Remark *'
                              : 'Remark'),
                          TextField(
                            controller: _remarkCtrl,
                            maxLines: 3,
                            decoration: _fieldDecoration(
                                hint: 'Any notes...', error: _remarkError),
                          ),
                          const SizedBox(height: 20),

                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _saving ? null : _submit,
                              style: _primaryBtnStyle(),
                              child: _saving
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2, color: Colors.white))
                                  : const Text('Create Lead'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ======================================================
// LEAD DETAIL SHEET (Overview / Follow-ups / Activity Log)
// ======================================================
class _LeadDetailSheet extends StatefulWidget {
  final int leadId;
  final VoidCallback onLeadChanged;
  const _LeadDetailSheet({required this.leadId, required this.onLeadChanged});

  @override
  State<_LeadDetailSheet> createState() => _LeadDetailSheetState();
}

class _LeadDetailSheetState extends State<_LeadDetailSheet>
    with SingleTickerProviderStateMixin {
  final SalesLeadService _service = SalesLeadService();
  late TabController _tabController;

  // Dedicated messenger key for THIS sheet so that validation errors /
  // toasts show up inside the bottom sheet itself instead of being
  // rendered behind it on the parent page's Scaffold.
  final GlobalKey<ScaffoldMessengerState> _sheetMessengerKey =
      GlobalKey<ScaffoldMessengerState>();

  bool _loading = true;
  LeadModel? _lead;
  List<FollowupModel> _followups = [];
  bool _followupsLoading = false;
  List<ActivityLogModel> _logs = [];
  bool _logsLoading = false;

  // Form A - Update Lead Info
  String _interestStatus = 'Pending';
  final TextEditingController _requiredKwCtrl = TextEditingController();
  final TextEditingController _infoRemarkCtrl = TextEditingController();
  String _priority = 'Medium';
  String? _infoKwError;
  String? _infoRemarkError;
  bool _infoSaving = false;

  // Form B - Change Status
  String _status = 'New Lead';
  final TextEditingController _statusRemarkCtrl = TextEditingController();
  final TextEditingController _quotationCtrl = TextEditingController();
  final TextEditingController _siteVisitDateCtrl = TextEditingController();
  String? _statusRemarkError;
  String? _quotationError;
  String? _siteVisitError;
  bool _statusSaving = false;

  // Form C - Add Follow-up
  final TextEditingController _followupNoteCtrl = TextEditingController();
  String _followupType = 'Call';
  String _statusAfterFollowup = '';
  final TextEditingController _followupDateCtrl = TextEditingController();
  String? _followupNoteError;
  bool _followupSaving = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadLead();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _requiredKwCtrl.dispose();
    _infoRemarkCtrl.dispose();
    _statusRemarkCtrl.dispose();
    _quotationCtrl.dispose();
    _siteVisitDateCtrl.dispose();
    _followupNoteCtrl.dispose();
    _followupDateCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadLead() async {
    setState(() => _loading = true);
    final res = await _service.getLeadById(widget.leadId);
    if (!mounted) return;
    if (res['success'] == true) {
      final lead = res['lead'] as LeadModel;
      setState(() {
        _lead = lead;
        _interestStatus = kInterestOptions.contains(lead.interestStatus)
            ? lead.interestStatus
            : 'Pending';
        _requiredKwCtrl.text = lead.requiredKw?.toString() ?? '';
        _infoRemarkCtrl.text = lead.remark ?? '';
        _priority =
            kPriorityOptions.contains(lead.priority) ? lead.priority : 'Medium';
        _status =
            kStatusOptions.contains(lead.status) ? lead.status : 'New Lead';
        _quotationCtrl.text = lead.quotationAmount?.toString() ?? '';
        _siteVisitDateCtrl.text = lead.siteVisitDate ?? '';
      });
      _loadFollowups();
      _loadLogs();
    } else {
      _toast(res['message'] ?? 'Failed to load lead details', isError: true);
      if (mounted) Navigator.pop(context);
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadFollowups() async {
    setState(() => _followupsLoading = true);
    final res = await _service.getFollowups(widget.leadId);
    if (!mounted) return;
    setState(() {
      _followups = (res['followups'] as List<FollowupModel>?) ?? [];
      _followupsLoading = false;
    });
  }

  Future<void> _loadLogs() async {
    setState(() => _logsLoading = true);
    final res = await _service.getActivityLogs(widget.leadId);
    if (!mounted) return;
    setState(() {
      _logs = (res['logs'] as List<ActivityLogModel>?) ?? [];
      _logsLoading = false;
    });
  }

  Future<void> _refreshAfterChange() async {
    final res = await _service.getLeadById(widget.leadId);
    if (mounted && res['success'] == true) {
      setState(() => _lead = res['lead'] as LeadModel);
    }
    _loadLogs();
    widget.onLeadChanged();
  }

  // Uses the sheet's own ScaffoldMessenger key so the SnackBar (including
  // validation errors) always shows on top of the sheet, not behind it.
  void _toast(String message, {bool isError = false}) {
    if (!mounted) return;
    final messenger = _sheetMessengerKey.currentState;
    if (messenger == null) return;
    messenger.clearSnackBars();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  // ---------- Form A ----------
  bool _validateInfoForm() {
    setState(() {
      _infoKwError = null;
      _infoRemarkError = null;
    });
    bool valid = true;
    if (_interestStatus == 'Interested') {
      final kw = num.tryParse(_requiredKwCtrl.text.trim());
      if (kw == null || kw <= 0) {
        setState(() => _infoKwError =
            'Required kW must be greater than 0 when Interested.');
        valid = false;
      }
    }
    if (_interestStatus == 'Not Interested' &&
        _infoRemarkCtrl.text.trim().isEmpty) {
      setState(() => _infoRemarkError =
          'Remark is required when marking as Not Interested.');
      valid = false;
    }
    return valid;
  }

  Future<void> _saveInfo() async {
    if (!_validateInfoForm()) return;
    setState(() => _infoSaving = true);
    final res = await _service.updateLead(widget.leadId, {
      'interest_status': _interestStatus,
      'required_kw': _interestStatus == 'Interested'
          ? num.tryParse(_requiredKwCtrl.text.trim())
          : null,
      'remark': _infoRemarkCtrl.text.trim().isEmpty
          ? null
          : _infoRemarkCtrl.text.trim(),
      'priority': _priority,
    });
    if (!mounted) return;
    setState(() => _infoSaving = false);
    if (res['success'] == true) {
      _toast('Lead info updated successfully.');
      _refreshAfterChange();
    } else {
      _toast(res['message'] ?? 'Failed to update lead info.', isError: true);
    }
  }

  // ---------- Form B ----------
  bool _validateStatusForm() {
    setState(() {
      _statusRemarkError = null;
      _quotationError = null;
      _siteVisitError = null;
    });
    bool valid = true;
    if (_status == 'Not Interested' && _statusRemarkCtrl.text.trim().isEmpty) {
      setState(() => _statusRemarkError =
          'Remark is mandatory when marking as Not Interested.');
      valid = false;
    }
    if (_status == 'Quotation Sent') {
      final amt = num.tryParse(_quotationCtrl.text.trim());
      if (amt == null || amt <= 0) {
        setState(() => _quotationError =
            'Quotation amount is mandatory when status is Quotation Sent.');
        valid = false;
      }
    }
    if (_status == 'Site Visit Scheduled' &&
        _siteVisitDateCtrl.text.trim().isEmpty) {
      setState(() => _siteVisitError =
          'Site visit date is mandatory when status is Site Visit Scheduled.');
      valid = false;
    }
    return valid;
  }

  Future<void> _saveStatus() async {
    if (!_validateStatusForm()) return;
    setState(() => _statusSaving = true);
    final res = await _service.updateLeadStatus(widget.leadId, {
      'status': _status,
      if (_statusRemarkCtrl.text.trim().isNotEmpty)
        'remark': _statusRemarkCtrl.text.trim(),
      if (_quotationCtrl.text.trim().isNotEmpty)
        'quotation_amount': num.tryParse(_quotationCtrl.text.trim()),
      if (_siteVisitDateCtrl.text.trim().isNotEmpty)
        'site_visit_date': _siteVisitDateCtrl.text.trim(),
    });
    if (!mounted) return;
    setState(() => _statusSaving = false);
    if (res['success'] == true) {
      _toast('Lead status updated successfully.');
      _statusRemarkCtrl.clear();
      _refreshAfterChange();
    } else {
      _toast(res['message'] ?? 'Failed to update status.', isError: true);
    }
  }

  // ---------- Quick status (Won / Lost / stepper) ----------
  Future<void> _quickStatus(String newStatus) async {
    setState(() => _statusSaving = true);
    final res =
        await _service.updateLeadStatus(widget.leadId, {'status': newStatus});
    if (!mounted) return;
    setState(() => _statusSaving = false);
    if (res['success'] == true) {
      _toast('Lead marked as "$newStatus".');
      setState(() => _status = newStatus);
      _refreshAfterChange();
    } else {
      _toast(res['message'] ?? 'Failed to update status.', isError: true);
    }
  }

  void _onStepTap(String step) {
    if (_statusSaving) return;
    if (kStatusNeedsExtra.contains(step)) {
      setState(() => _status = step);
      _toast('Fill in the required details below to move to "$step".');
      _tabController.index = 0;
    } else {
      _quickStatus(step);
    }
  }

  // ---------- Form C ----------
  bool _validateFollowupForm() {
    setState(() => _followupNoteError = null);
    if (_followupNoteCtrl.text.trim().isEmpty) {
      setState(() => _followupNoteError = 'Follow-up note is required.');
      return false;
    }
    return true;
  }

  Future<void> _addFollowup() async {
    if (!_validateFollowupForm()) return;
    setState(() => _followupSaving = true);
    final res = await _service.addFollowup(widget.leadId, {
      'note': _followupNoteCtrl.text.trim(),
      'followup_type': _followupType,
      if (_statusAfterFollowup.isNotEmpty)
        'status_after_followup': _statusAfterFollowup,
      if (_followupDateCtrl.text.trim().isNotEmpty)
        'follow_up_date': _followupDateCtrl.text.trim(),
    });
    if (!mounted) return;
    setState(() => _followupSaving = false);
    if (res['success'] == true) {
      _toast('Follow-up added successfully.');
      if (_statusAfterFollowup.isNotEmpty) {
        setState(() => _status = _statusAfterFollowup);
      }
      setState(() {
        _followupNoteCtrl.clear();
        _followupType = 'Call';
        _statusAfterFollowup = '';
        _followupDateCtrl.clear();
      });
      _loadFollowups();
      _refreshAfterChange();
    } else {
      _toast(res['message'] ?? 'Failed to add follow-up.', isError: true);
    }
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      ctrl.text =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final lead = _lead;
    final activeStepIndex =
        lead != null ? kPipelineSteps.indexOf(lead.status) : -1;
    final isTerminalNegative =
        lead != null && kNegativeClosedStatuses.contains(lead.status);
    final isWon = lead != null && lead.status == 'Won';

    // Own ScaffoldMessenger + transparent Scaffold wrapping the sheet so
    // every SnackBar / validation toast triggered from inside the sheet
    // renders on top of the sheet instead of leaking behind it onto the
    // list screen.
    return ScaffoldMessenger(
      key: _sheetMessengerKey,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Theme(
          data: Theme.of(context).copyWith(
            textTheme: Theme.of(context).textTheme.apply(
                  bodyColor: AppColors.textPrimary,
                  displayColor: AppColors.textPrimary,
                ),
            inputDecorationTheme: const InputDecorationTheme(
              labelStyle: TextStyle(color: AppColors.textSecondary),
              hintStyle: TextStyle(color: AppColors.textMuted),
            ),
          ),
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              top: false,
              child: _loading
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: AppColors.primary))
                  : Column(
                      children: [
                        // Drag handle
                        Padding(
                          padding: const EdgeInsets.only(top: 10, bottom: 4),
                          child: Container(
                              width: 40,
                              height: 4,
                              decoration: BoxDecoration(
                                  color: AppColors.border,
                                  borderRadius: BorderRadius.circular(4))),
                        ),
                        // Header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 8, 12, 8),
                          child: Row(
                            children: [
                              _GradientAvatar(
                                  name: lead?.customerName ?? '?', size: 42),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(lead?.customerName ?? 'Lead Details',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w900,
                                            fontSize: 17,
                                            color: AppColors.textPrimary)),
                                    Text(lead?.leadCode ?? '',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textMuted,
                                            fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                              IconButton(
                                  onPressed: () => Navigator.pop(context),
                                  icon: const Icon(Icons.close_rounded)),
                            ],
                          ),
                        ),

                        // Pipeline stepper / terminal banner
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          color: const Color(0xFFFAFBFC),
                          child: isTerminalNegative
                              ? Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.dangerSoft,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                        color:
                                            AppColors.danger.withOpacity(0.2)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.cancel_outlined,
                                          color: AppColors.danger, size: 20),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text('Marked as ${lead!.status}',
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w800,
                                                color: AppColors.danger,
                                                fontSize: 13)),
                                      ),
                                      OutlinedButton.icon(
                                        onPressed: _statusSaving
                                            ? null
                                            : () => _quickStatus('Contacted'),
                                        icon: const Icon(Icons.replay_outlined,
                                            size: 15),
                                        label: const Text('Reopen'),
                                        style: _outlinedBtnStyle(
                                                color: AppColors.danger,
                                                border: AppColors.danger)
                                            .copyWith(
                                          minimumSize:
                                              const MaterialStatePropertyAll(
                                                  Size(0, 34)),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  child: Row(
                                    children: List.generate(
                                        kPipelineSteps.length, (i) {
                                      final step = kPipelineSteps[i];
                                      final completed = activeStepIndex > i;
                                      final active = activeStepIndex == i;
                                      final color = completed
                                          ? AppColors.success
                                          : (active
                                              ? AppColors.primary
                                              : AppColors.borderStrong);
                                      return GestureDetector(
                                        onTap: () => _onStepTap(step),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6),
                                          child: Column(
                                            children: [
                                              Container(
                                                width: 26,
                                                height: 26,
                                                decoration: BoxDecoration(
                                                    shape: BoxShape.circle,
                                                    color: color),
                                                alignment: Alignment.center,
                                                child: completed
                                                    ? const Icon(
                                                        Icons.check_rounded,
                                                        size: 15,
                                                        color: Colors.white)
                                                    : Text('${i + 1}',
                                                        style: const TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 11,
                                                            fontWeight:
                                                                FontWeight
                                                                    .w800)),
                                              ),
                                              const SizedBox(height: 4),
                                              SizedBox(
                                                width: 74,
                                                child: Text(
                                                  step,
                                                  textAlign: TextAlign.center,
                                                  style: TextStyle(
                                                    fontSize: 9.5,
                                                    fontWeight: active
                                                        ? FontWeight.w800
                                                        : FontWeight.w600,
                                                    color: active
                                                        ? AppColors.primary
                                                        : AppColors
                                                            .textSecondary,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                ),
                        ),

                        // Tabs
                        TabBar(
                          controller: _tabController,
                          labelColor: AppColors.primary,
                          unselectedLabelColor: AppColors.textSecondary,
                          indicatorColor: AppColors.primary,
                          labelStyle: const TextStyle(
                              fontSize: 12.5, fontWeight: FontWeight.w800),
                          unselectedLabelStyle: const TextStyle(
                              fontSize: 12.5, fontWeight: FontWeight.w700),
                          tabs: const [
                            Tab(text: 'Overview'),
                            Tab(text: 'Follow-ups'),
                            Tab(text: 'Activity Log'),
                          ],
                        ),

                        Expanded(
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _buildOverviewTab(
                                  lead, isWon, isTerminalNegative),
                              _buildFollowupsTab(),
                              _buildActivityTab(),
                            ],
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  // ---------------- OVERVIEW TAB ----------------
  Widget _buildOverviewTab(
      LeadModel? lead, bool isWon, bool isTerminalNegative) {
    if (lead == null) return const SizedBox.shrink();
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick contact actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () =>
                      launchUrl(Uri.parse('tel:${lead.mobileNumber}')),
                  icon: const Icon(Icons.phone_in_talk_rounded, size: 16),
                  label: const Text('Call',
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  style: _outlinedBtnStyle().copyWith(
                    padding: const MaterialStatePropertyAll(
                        EdgeInsets.symmetric(horizontal: 4)),
                    textStyle: const MaterialStatePropertyAll(
                        TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final digits =
                        lead.mobileNumber.replaceAll(RegExp(r'\D'), '');
                    final formatted =
                        digits.length == 10 ? '91$digits' : digits;
                    await launchUrl(Uri.parse('https://wa.me/$formatted'),
                        mode: LaunchMode.externalApplication);
                  },
                  icon: const Icon(Icons.chat_rounded,
                      size: 16, color: Color(0xFF25D366)),
                  label: const Text('WhatsApp',
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  style: _outlinedBtnStyle(
                          color: AppColors.success,
                          border: AppColors.successSoft)
                      .copyWith(
                    padding: const MaterialStatePropertyAll(
                        EdgeInsets.symmetric(horizontal: 4)),
                    textStyle: const MaterialStatePropertyAll(
                        TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () =>
                      launchUrl(Uri.parse('sms:${lead.mobileNumber}')),
                  icon: const Icon(Icons.sms_outlined, size: 16),
                  label: const Text('SMS',
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  style: _outlinedBtnStyle().copyWith(
                    padding: const MaterialStatePropertyAll(
                        EdgeInsets.symmetric(horizontal: 4)),
                    textStyle: const MaterialStatePropertyAll(
                        TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Won / Lost quick actions
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: (isWon || _statusSaving)
                      ? null
                      : () => _quickStatus('Won'),
                  icon:
                      const Icon(Icons.check_circle_outline_rounded, size: 17),
                  label: Text(isWon ? 'Already Won' : 'Mark Won'),
                  style: _primaryBtnStyle(bg: AppColors.success),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: (isTerminalNegative || _statusSaving)
                      ? null
                      : () => _quickStatus('Lost'),
                  icon: const Icon(Icons.cancel_outlined, size: 17),
                  label: const Text('Mark Lost'),
                  style: _outlinedBtnStyle(
                      color: AppColors.danger, border: AppColors.dangerSoft),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          const Divider(color: AppColors.border),
          const SizedBox(height: 12),

          // Address block
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border)),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined,
                    size: 16, color: AppColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ADDRESS',
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textMuted)),
                      Text(
                        [lead.address, lead.city, lead.state, lead.pincode]
                                .where((e) => e != null && e.isNotEmpty)
                                .join(', ')
                                .isEmpty
                            ? 'N/A'
                            : [
                                lead.address,
                                lead.city,
                                lead.state,
                                lead.pincode
                              ]
                                .where((e) => e != null && e.isNotEmpty)
                                .join(', '),
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Info grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 2.6,
            children: [
              _infoTile(
                  Icons.person_outline_rounded, 'Mobile', lead.mobileNumber),
              _infoTile(Icons.email_outlined, 'Email', lead.email ?? 'N/A'),
              _infoTile(Icons.solar_power_outlined, 'Requirement',
                  lead.solarRequirement ?? 'N/A'),
              _infoTile(
                  Icons.source_outlined, 'Source', lead.leadSource ?? 'N/A'),
              _infoTile(Icons.badge_outlined, 'Assigned By',
                  lead.assignedByName ?? 'N/A'),
              _infoTile(
                  Icons.event_outlined, 'Created On', _fmtDate(lead.createdAt)),
            ],
          ),

          const SizedBox(height: 16),

          // Form A - Update Lead Info
          _accentSection(
            accent: AppColors.info,
            title: 'Update Lead Info',
            children: [
              const _FieldLabel('Interest Status'),
              DropdownButtonFormField<String>(
                value: _interestStatus,
                isExpanded: true,
                decoration: _fieldDecoration(),
                items: kInterestOptions
                    .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                    .toList(),
                onChanged: (v) =>
                    setState(() => _interestStatus = v ?? 'Pending'),
              ),
              if (_interestStatus == 'Interested') ...[
                const SizedBox(height: 12),
                const _FieldLabel('Required Capacity (kW) *'),
                TextField(
                  controller: _requiredKwCtrl,
                  keyboardType: TextInputType.number,
                  decoration: _fieldDecoration(error: _infoKwError),
                ),
              ],
              const SizedBox(height: 12),
              _FieldLabel(
                  _interestStatus == 'Not Interested' ? 'Remark *' : 'Remark'),
              TextField(
                controller: _infoRemarkCtrl,
                maxLines: 2,
                decoration: _fieldDecoration(error: _infoRemarkError),
              ),
              const SizedBox(height: 12),
              const _FieldLabel('Priority'),
              DropdownButtonFormField<String>(
                value: _priority,
                isExpanded: true,
                decoration: _fieldDecoration(),
                items: kPriorityOptions
                    .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                    .toList(),
                onChanged: (v) => setState(() => _priority = v ?? 'Medium'),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _infoSaving ? null : _saveInfo,
                  style: _primaryBtnStyle(),
                  child: _infoSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Save Lead Info'),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Form B - Change Status
          _accentSection(
            accent: _Extra.purple,
            title: 'Change Status',
            children: [
              const _FieldLabel('Status'),
              DropdownButtonFormField<String>(
                value: _status,
                isExpanded: true,
                decoration: _fieldDecoration(),
                items: kStatusOptions
                    .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                    .toList(),
                onChanged: (v) => setState(() => _status = v ?? 'New Lead'),
              ),
              if (_status == 'Quotation Sent') ...[
                const SizedBox(height: 12),
                const _FieldLabel('Quotation Amount (₹) *'),
                TextField(
                  controller: _quotationCtrl,
                  keyboardType: TextInputType.number,
                  decoration: _fieldDecoration(error: _quotationError),
                ),
              ],
              if (_status == 'Site Visit Scheduled') ...[
                const SizedBox(height: 12),
                const _FieldLabel('Site Visit Date *'),
                TextField(
                  controller: _siteVisitDateCtrl,
                  readOnly: true,
                  onTap: () => _pickDate(_siteVisitDateCtrl),
                  decoration: _fieldDecoration(
                          hint: 'YYYY-MM-DD', error: _siteVisitError)
                      .copyWith(
                    suffixIcon:
                        const Icon(Icons.calendar_today_outlined, size: 16),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              _FieldLabel(_status == 'Not Interested'
                  ? 'Remark *'
                  : 'Remark (optional)'),
              TextField(
                controller: _statusRemarkCtrl,
                maxLines: 2,
                decoration: _fieldDecoration(error: _statusRemarkError),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _statusSaving ? null : _saveStatus,
                  style: _primaryBtnStyle(bg: _Extra.purple),
                  child: _statusSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Save Status'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoTile(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
          color: AppColors.surfaceMuted,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 15, color: AppColors.primary),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label.toUpperCase(),
                    style: const TextStyle(
                        fontSize: 8.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMuted)),
                Text(value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _accentSection(
      {required Color accent,
      required String title,
      required List<Widget> children}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFFBFCFE),
          border: Border.all(color: AppColors.border, width: 1),
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: accent),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14.5,
                              color: AppColors.textPrimary)),
                      const SizedBox(height: 12),
                      ...children,
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------- FOLLOW-UPS TAB ----------------
  Widget _buildFollowupsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _accentSection(
            accent: AppColors.info,
            title: 'Add Follow-up',
            children: [
              const _FieldLabel('Note *'),
              TextField(
                controller: _followupNoteCtrl,
                maxLines: 2,
                decoration: _fieldDecoration(error: _followupNoteError),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _FieldLabel('Follow-up Type'),
                        DropdownButtonFormField<String>(
                          value: _followupType,
                          isExpanded: true,
                          decoration: _fieldDecoration(),
                          items: kFollowupTypeOptions
                              .map((o) =>
                                  DropdownMenuItem(value: o, child: Text(o)))
                              .toList(),
                          onChanged: (v) =>
                              setState(() => _followupType = v ?? 'Call'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _FieldLabel('Next Follow-up'),
                        TextField(
                          controller: _followupDateCtrl,
                          readOnly: true,
                          onTap: () => _pickDate(_followupDateCtrl),
                          decoration: _fieldDecoration(hint: 'YYYY-MM-DD'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const _FieldLabel('Update Status To (optional)'),
              DropdownButtonFormField<String>(
                value:
                    _statusAfterFollowup.isEmpty ? null : _statusAfterFollowup,
                isExpanded: true,
                decoration: _fieldDecoration(hint: 'No change'),
                items: kStatusOptions
                    .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                    .toList(),
                onChanged: (v) =>
                    setState(() => _statusAfterFollowup = v ?? ''),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _followupSaving ? null : _addFollowup,
                  style: _primaryBtnStyle(),
                  child: _followupSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Add Follow-up'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Text('Follow-up Timeline',
              style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14.5,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 10),
          if (_followupsLoading)
            const Center(
                child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(color: AppColors.primary)))
          else if (_followups.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(
                  child: Text('No follow-ups added yet.',
                      style: TextStyle(
                          color: AppColors.textSecondary, fontSize: 13))),
            )
          else
            Column(
              children: List.generate(_followups.length, (i) {
                final f = _followups[i];
                return _timelineEntry(
                  dotColor: AppColors.info,
                  isLast: i == _followups.length - 1,
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                        color: AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _Badge(
                                label: f.followupType,
                                bg: AppColors.infoSoft,
                                color: AppColors.info),
                            Text(_fmtDateTime(f.createdAt),
                                style: const TextStyle(
                                    fontSize: 10.5,
                                    color: AppColors.textMuted)),
                          ],
                        ),
                        const SizedBox(height: 5),
                        Text(f.note,
                            style: const TextStyle(
                                fontSize: 13, color: AppColors.textPrimary)),
                        if (f.followUpDate != null) ...[
                          const SizedBox(height: 4),
                          Text('Next follow-up: ${_fmtDate(f.followUpDate)}',
                              style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary)),
                        ],
                      ],
                    ),
                  ),
                );
              }),
            ),
        ],
      ),
    );
  }

  // ---------------- ACTIVITY LOG TAB ----------------
  Widget _buildActivityTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: _logsLoading
          ? const Center(
              child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(color: AppColors.primary)))
          : _logs.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(
                      child: Text('No activity recorded yet.',
                          style: TextStyle(
                              color: AppColors.textSecondary, fontSize: 13))),
                )
              : Column(
                  children: List.generate(_logs.length, (i) {
                    final log = _logs[i];
                    final color = _actionColor(log.actionType);
                    return _timelineEntry(
                      dotColor: color,
                      isLast: i == _logs.length - 1,
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                            color: AppColors.surfaceMuted,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.border)),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                  color: color.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(8)),
                              alignment: Alignment.center,
                              child: Icon(_actionIcon(log.actionType),
                                  size: 15, color: color),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                          child: Text(log.actionType,
                                              style: TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 12.5,
                                                  color: color))),
                                      Text(_fmtDateTime(log.createdAt),
                                          style: const TextStyle(
                                              fontSize: 10,
                                              color: AppColors.textMuted)),
                                    ],
                                  ),
                                  if (log.remark != null &&
                                      log.remark!.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text('"${log.remark}"',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textSecondary,
                                              fontStyle: FontStyle.italic)),
                                    )
                                  else if (log.oldValue != null &&
                                      log.newValue != null)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                          '${log.oldValue} → ${log.newValue}',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textSecondary)),
                                    ),
                                  const SizedBox(height: 2),
                                  Text('By ${log.performedByName ?? "System"}',
                                      style: const TextStyle(
                                          fontSize: 10.5,
                                          color: AppColors.textMuted)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ),
    );
  }

  Widget _timelineEntry(
      {required Color dotColor, required bool isLast, required Widget child}) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 20,
              child: Column(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    margin: const EdgeInsets.only(top: 4),
                    decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: dotColor,
                        border: Border.all(color: Colors.white, width: 2)),
                  ),
                  if (!isLast)
                    Expanded(
                        child: Container(width: 2, color: AppColors.border)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Expanded(child: child),
          ],
        ),
      ),
    );
  }
}
