import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/manager_followup_service.dart';
import '../../data/team_followup_model.dart';

class TeamFollowupsScreen extends StatefulWidget {
  const TeamFollowupsScreen({Key? key}) : super(key: key);

  @override
  State<TeamFollowupsScreen> createState() => _TeamFollowupsScreenState();
}

class _TeamFollowupsScreenState extends State<TeamFollowupsScreen> {
  final ManagerFollowupService _service = ManagerFollowupService();
  final TextEditingController _searchController = TextEditingController();

  List<dynamic> _teamMembers = [];
  List<TeamFollowupModel> _followups = [];
  bool _isLoading = true;
  String? _errorMessage;

  String _viewMode = 'card'; // 'card' or 'list'
  String _repFilter = 'ALL';
  String _statusFilter = 'ALL'; // ALL, OVERDUE, PENDING, COMPLETED

  // Add-remark dialog state
  final _remarkController = TextEditingController();
  DateTime? _selectedNextDate;
  bool _isSavingNote = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _remarkController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await _service.fetchInitialData();
    if (!mounted) return;

    if (res['success'] == true) {
      final rawFollowups = (res['teamFollowups'] as List?) ?? [];
      setState(() {
        _teamMembers = (res['teamMembers'] as List?) ?? [];
        _followups = rawFollowups
            .whereType<Map>()
            .map(
                (e) => TeamFollowupModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        _isLoading = false;
      });
    } else {
      setState(() {
        _errorMessage =
            res['message']?.toString() ?? 'Failed to sync team follow-ups.';
        _isLoading = false;
      });
    }
  }

  // Safe, de-duplicated rep filter options — prevents Flutter's
  // "duplicate dropdown value" crash if two members share/miss an id.
  List<DropdownMenuItem<String>> get _repFilterItems {
    final seen = <String>{'ALL'};
    final items = <DropdownMenuItem<String>>[
      const DropdownMenuItem(value: 'ALL', child: Text('All Members')),
    ];
    for (final m in _teamMembers) {
      final id = m is Map ? m['id']?.toString() : null;
      final name = m is Map ? (m['full_name']?.toString() ?? 'Rep') : 'Rep';
      if (id == null || id.isEmpty || seen.contains(id)) continue;
      seen.add(id);
      items.add(DropdownMenuItem(
          value: id,
          child: Text(name, overflow: TextOverflow.ellipsis, maxLines: 1)));
    }
    return items;
  }

  List<TeamFollowupModel> get _processedFollowups {
    final search = _searchController.text.trim().toLowerCase();

    return _followups.where((item) {
      final matchesRep =
          _repFilter == 'ALL' || item.assignedTo?.toString() == _repFilter;
      final matchesStatus =
          _statusFilter == 'ALL' || item.status == _statusFilter;
      final matchesSearch = search.isEmpty ||
          item.customerName.toLowerCase().contains(search) ||
          item.leadCode.toLowerCase().contains(search) ||
          item.phone.toLowerCase().contains(search);

      return matchesRep && matchesStatus && matchesSearch;
    }).toList();
  }

  // ---------- Call & WhatsApp actions ----------
  void _makePhoneCall(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty || phoneNumber == 'N/A') {
      _showNotification('Phone number not available', isError: true);
      return;
    }
    final Uri url = Uri.parse('tel:${phoneNumber.trim()}');
    try {
      await launchUrl(url);
    } catch (_) {
      _showNotification('Could not open phone dialer', isError: true);
    }
  }

  void _openWhatsApp(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty || phoneNumber == 'N/A') {
      _showNotification('Phone number not available', isError: true);
      return;
    }
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
    } catch (_) {
      _showNotification('Could not open WhatsApp', isError: true);
    }
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'U';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  // ---------- Add Manager Remark dialog ----------
  void _showAddRemarkDialog(TeamFollowupModel item) {
    _remarkController.clear();
    _selectedNextDate = null;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Text(
            'Log Manager Remark',
            style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16.5,
                color: AppColors.primaryDark),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Note for ${item.customerName} (${item.leadCode})',
                  style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _remarkController,
                  maxLines: 3,
                  autofocus: true,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                    hintText:
                        'Enter call summary or instructions for representative...',
                    hintStyle: const TextStyle(
                        fontSize: 12, color: AppColors.textMuted),
                    filled: true,
                    fillColor: AppColors.bg,
                    contentPadding: const EdgeInsets.all(12),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.border)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.border)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(
                            color: AppColors.primary, width: 1.5)),
                  ),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 1)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setDialogState(() => _selectedNextDate = picked);
                    }
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 11),
                    decoration: BoxDecoration(
                      color: AppColors.bg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today_rounded,
                            size: 16, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _selectedNextDate == null
                                ? 'Reschedule Next Date (Optional)'
                                : 'Next Date: ${_selectedNextDate!.toString().split(' ')[0]}',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: _selectedNextDate == null
                                  ? AppColors.textMuted
                                  : AppColors.textPrimary,
                            ),
                          ),
                        ),
                        if (_selectedNextDate != null)
                          InkWell(
                            onTap: () =>
                                setDialogState(() => _selectedNextDate = null),
                            child: const Icon(Icons.close_rounded,
                                size: 16, color: AppColors.textMuted),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: _isSavingNote ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel',
                  style: TextStyle(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              onPressed: _isSavingNote
                  ? null
                  : () async {
                      final note = _remarkController.text.trim();
                      if (note.isEmpty) {
                        _showNotification('Please write a quick remark.',
                            isError: true);
                        return;
                      }
                      setDialogState(() => _isSavingNote = true);
                      final res = await _service.addFollowup(
                        leadId: item.id,
                        note: note,
                        followupDate:
                            _selectedNextDate?.toIso8601String().split('T')[0],
                      );
                      setDialogState(() => _isSavingNote = false);
                      if (!mounted) return;
                      Navigator.pop(ctx);
                      _showNotification(
                          res['message']?.toString() ??
                              (res['success'] == true
                                  ? 'Recorded successfully!'
                                  : 'Failed to save follow-up entry.'),
                          isError: res['success'] != true);
                      if (res['success'] == true) _fetchData();
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: _isSavingNote
                  ? const SizedBox(
                      width: 15,
                      height: 15,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Save Log',
                      style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ],
        ),
      ),
    );
  }

  // ---------- Follow-up history bottom sheet ----------
  void _showHistoryBottomSheet(TeamFollowupModel item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          decoration: const BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            top: false,
            child: FutureBuilder<Map<String, dynamic>>(
              future: _service.getFollowupsHistory(item.id),
              builder: (context, snapshot) {
                final loading =
                    snapshot.connectionState == ConnectionState.waiting;
                final history = (snapshot.data?['history'] as List?) ?? [];

                return Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                              color: AppColors.border,
                              borderRadius: BorderRadius.circular(2))),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Follow-up Audit Timeline',
                            style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                                color: AppColors.primaryDark)),
                        IconButton(
                            icon: const Icon(Icons.close_rounded),
                            onPressed: () => Navigator.pop(ctx)),
                      ],
                    ),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                          color: AppColors.bg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border)),
                      child: Text(
                          '${item.customerName} (${item.leadCode}) • Assigned: ${item.assignedToName}',
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary)),
                    ),
                    const SizedBox(height: 16),
                    if (loading)
                      const Center(
                          child: Padding(
                              padding: EdgeInsets.all(20),
                              child: CircularProgressIndicator(
                                  color: AppColors.primary)))
                    else if (history.isEmpty)
                      const Center(
                          child: Padding(
                              padding: EdgeInsets.all(20),
                              child: Text('No history entries logged yet.',
                                  style: TextStyle(
                                      fontSize: 12.5,
                                      color: AppColors.textSecondary))))
                    else
                      Flexible(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxHeight: 340),
                          child: ListView.builder(
                            shrinkWrap: true,
                            itemCount: history.length,
                            itemBuilder: (context, index) {
                              final entry = history[index];
                              final note = entry['note']?.toString() ?? '';
                              final date =
                                  entry['created_at']?.toString() ?? '';
                              final by = entry['created_by_name']?.toString() ??
                                  'System';
                              final statusAfter =
                                  entry['status_after_followup']?.toString();
                              final followupType =
                                  entry['followup_type']?.toString();

                              return Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                    color: AppColors.hover,
                                    borderRadius: BorderRadius.circular(8)),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        followupType != null &&
                                                followupType.isNotEmpty
                                            ? '$date • $followupType'
                                            : date,
                                        style: const TextStyle(
                                            fontSize: 10.5,
                                            color: AppColors.textSecondary,
                                            fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 3),
                                    Text('"$note"',
                                        style: const TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w700,
                                            fontStyle: FontStyle.italic,
                                            color: AppColors.textPrimary)),
                                    const SizedBox(height: 4),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 4,
                                      crossAxisAlignment:
                                          WrapCrossAlignment.center,
                                      children: [
                                        if (statusAfter != null &&
                                            statusAfter.isNotEmpty)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 7, vertical: 2),
                                            decoration: BoxDecoration(
                                                color: AppColors.primarySoft,
                                                borderRadius:
                                                    BorderRadius.circular(6)),
                                            child: Text(
                                                'Status set: $statusAfter',
                                                style: const TextStyle(
                                                    fontSize: 9.5,
                                                    fontWeight: FontWeight.w700,
                                                    color: AppColors.primary)),
                                          ),
                                        Text('By $by',
                                            style: const TextStyle(
                                                fontSize: 10.5,
                                                color:
                                                    AppColors.textSecondary)),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = _processedFollowups;

    final total = _followups.length;
    final overdue = _followups.where((f) => f.status == 'OVERDUE').length;
    final pending = _followups.where((f) => f.status == 'PENDING').length;
    final completed = _followups.where((f) => f.status == 'COMPLETED').length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Team Follow-ups Tracker',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Monitor Rep Activity & Overdues',
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
            onPressed: () => setState(
                () => _viewMode = _viewMode == 'card' ? 'list' : 'card'),
            tooltip: 'Toggle Layout',
          ),
          IconButton(
            icon: _isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.primary))
                : const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: _isLoading ? null : _fetchData,
            tooltip: 'Refresh Timeline',
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5))
            : RefreshIndicator(
                onRefresh: _fetchData,
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
                                color: AppColors.danger.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded,
                                  color: AppColors.danger, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(_errorMessage!,
                                    style: const TextStyle(
                                        color: AppColors.danger,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12.5)),
                              ),
                              TextButton(
                                onPressed: _fetchData,
                                child: const Text('Retry',
                                    style: TextStyle(
                                        color: AppColors.danger,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 12.5)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // 1. STATS KPI BAR
                      GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.8,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildStatTile(
                              'TOTAL FOLLOWUPS',
                              '$total',
                              'All tracked',
                              AppColors.primary,
                              AppColors.primarySoft),
                          _buildStatTile(
                              'OVERDUE / MISSED',
                              '$overdue',
                              'Needs urgent call',
                              AppColors.danger,
                              AppColors.dangerSoft),
                          _buildStatTile(
                              'UPCOMING PENDING',
                              '$pending',
                              'Scheduled soon',
                              AppColors.warning,
                              AppColors.warningSoft),
                          _buildStatTile(
                              'COMPLETED',
                              '$completed',
                              'Closed activities',
                              AppColors.success,
                              AppColors.successSoft),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 2. FILTERS & SEARCH
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          children: [
                            TextField(
                              controller: _searchController,
                              onChanged: (_) => setState(() {}),
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                hintText:
                                    'Search lead code, customer name, phone...',
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
                                isDense: true,
                                border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: BorderSide.none),
                                contentPadding: const EdgeInsets.symmetric(
                                    vertical: 12, horizontal: 10),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _repFilter,
                                    isExpanded: true,
                                    decoration: const InputDecoration(
                                      contentPadding: EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 8),
                                      filled: true,
                                      fillColor: AppColors.bg,
                                      border: OutlineInputBorder(
                                          borderRadius: BorderRadius.all(
                                              Radius.circular(8)),
                                          borderSide: BorderSide.none),
                                    ),
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w700),
                                    items: _repFilterItems,
                                    onChanged: (val) => setState(
                                        () => _repFilter = val ?? 'ALL'),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _statusFilter,
                                    isExpanded: true,
                                    decoration: const InputDecoration(
                                      contentPadding: EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 8),
                                      filled: true,
                                      fillColor: AppColors.bg,
                                      border: OutlineInputBorder(
                                          borderRadius: BorderRadius.all(
                                              Radius.circular(8)),
                                          borderSide: BorderSide.none),
                                    ),
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w700),
                                    items: const [
                                      DropdownMenuItem(
                                          value: 'ALL',
                                          child: Text('All Statuses')),
                                      DropdownMenuItem(
                                          value: 'OVERDUE',
                                          child: Text('Overdue')),
                                      DropdownMenuItem(
                                          value: 'PENDING',
                                          child: Text('Pending')),
                                      DropdownMenuItem(
                                          value: 'COMPLETED',
                                          child: Text('Completed')),
                                    ],
                                    onChanged: (val) => setState(
                                        () => _statusFilter = val ?? 'ALL'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 3. RESULT COUNT + MAIN CONTENT
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text('${list.length} follow-up(s) found',
                            style: const TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textSecondary)),
                      ),

                      if (list.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border)),
                          child: const Column(
                            children: [
                              Icon(Icons.event_note_outlined,
                                  size: 40, color: AppColors.textMuted),
                              SizedBox(height: 10),
                              Text('No Follow-up Records Found',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15,
                                      color: AppColors.textPrimary)),
                              SizedBox(height: 4),
                              Text(
                                  'Try adjusting your search query or filters.',
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
                          itemCount: list.length,
                          itemBuilder: (context, index) {
                            final item = list[index];
                            return _FollowupCard(
                              key: ValueKey(item.id),
                              item: item,
                              onAddNote: () => _showAddRemarkDialog(item),
                              onHistory: () => _showHistoryBottomSheet(item),
                              onCall: () => _makePhoneCall(item.phone),
                              onWhatsApp: () => _openWhatsApp(item.phone),
                              getInitials: _getInitials,
                            );
                          },
                        )
                      else
                        // DENSE LIST VIEW
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: list.length,
                          itemBuilder: (context, index) {
                            final item = list[index];
                            final isOverdue = item.status == 'OVERDUE';
                            final isCompleted = item.status == 'COMPLETED';
                            final statusColor = isOverdue
                                ? AppColors.danger
                                : (isCompleted
                                    ? AppColors.success
                                    : AppColors.warning);

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border)),
                              child: ListTile(
                                onTap: () => _showHistoryBottomSheet(item),
                                leading: CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppColors.primaryDark,
                                  child: Text(_getInitials(item.customerName),
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 11)),
                                ),
                                title: Text(
                                    '${item.customerName} (${item.leadCode})',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13.5)),
                                subtitle: Text(
                                    'Rep: ${item.assignedToName} • ${item.dateFormatted}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary)),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      margin: const EdgeInsets.only(right: 6),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 3),
                                      decoration: BoxDecoration(
                                          color: statusColor.withOpacity(0.12),
                                          borderRadius:
                                              BorderRadius.circular(6)),
                                      child: Text(item.status,
                                          style: TextStyle(
                                              fontSize: 8.5,
                                              fontWeight: FontWeight.w800,
                                              color: statusColor)),
                                    ),
                                    IconButton(
                                      visualDensity: VisualDensity.compact,
                                      icon: const Icon(
                                          Icons.add_comment_outlined,
                                          size: 18,
                                          color: AppColors.primary),
                                      onPressed: () =>
                                          _showAddRemarkDialog(item),
                                    ),
                                    IconButton(
                                      visualDensity: VisualDensity.compact,
                                      icon: const Icon(
                                          Icons.phone_in_talk_rounded,
                                          size: 18,
                                          color: AppColors.primary),
                                      onPressed: () =>
                                          _makePhoneCall(item.phone),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),

                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildStatTile(
      String label, String value, String sub, Color color, Color bg) {
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
          Text(label,
              style: const TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textSecondary)),
          Text(value,
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w900, color: color)),
          Text(sub,
              style: TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}

// ======================================================
// CARD VIEW ITEM — extracted as its own widget for clarity
// and to keep the icon-action row overflow-safe (Wrap
// instead of a rigid Row, since a card can have up to 4
// action icons + the assigned-rep chip on narrow phones).
//
// FIX: previously this used a single Container with a
// BoxDecoration that mixed a non-uniform Border (different
// width on the left side for the status accent) together
// with a borderRadius. Flutter's BoxDecoration only supports
// borderRadius when the border is UNIFORM — combining them
// like that fails during paint and silently renders nothing
// (a blank white box of the correct size), which is exactly
// the "white screen until refresh" symptom. Fixed by using a
// uniform border for the card outline and a separate flat
// Container as the left accent stripe, clipped together with
// ClipRRect so the rounded corners still look right.
// ======================================================
class _FollowupCard extends StatelessWidget {
  final TeamFollowupModel item;
  final VoidCallback onAddNote;
  final VoidCallback onHistory;
  final VoidCallback onCall;
  final VoidCallback onWhatsApp;
  final String Function(String) getInitials;

  const _FollowupCard({
    Key? key,
    required this.item,
    required this.onAddNote,
    required this.onHistory,
    required this.onCall,
    required this.onWhatsApp,
    required this.getInitials,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isOverdue = item.status == 'OVERDUE';
    final isCompleted = item.status == 'COMPLETED';

    final statusBg = isOverdue
        ? AppColors.dangerSoft
        : (isCompleted ? AppColors.successSoft : AppColors.warningSoft);
    final statusColor = isOverdue
        ? AppColors.danger
        : (isCompleted ? AppColors.success : AppColors.warning);
    final statusIcon = isOverdue
        ? Icons.warning_amber_rounded
        : (isCompleted
            ? Icons.check_circle_outline_rounded
            : Icons.access_time_rounded);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 3))
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            border: Border.all(color: AppColors.border), // uniform border
          ),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Left status accent stripe (was previously part of the
                // Border, which broke the borderRadius painting).
                Container(width: 4, color: statusColor),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 18,
                              backgroundColor: AppColors.primaryDark,
                              child: Text(getInitials(item.customerName),
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 11)),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.customerName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14.5,
                                          color: AppColors.textPrimary)),
                                  Text(item.leadCode,
                                      style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primary)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                  color: statusBg,
                                  borderRadius: BorderRadius.circular(6)),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(statusIcon,
                                      size: 12, color: statusColor),
                                  const SizedBox(width: 3),
                                  Text(item.status,
                                      style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w800,
                                          color: statusColor)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                              color: AppColors.bg,
                              borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            children: [
                              const Icon(Icons.event_outlined,
                                  size: 15, color: AppColors.primary),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text('Scheduled: ${item.dateFormatted}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          item.remarks == TeamFollowupModel.defaultRemark
                              ? item.remarks
                              : '"${item.remarks}"',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 12.5,
                              fontStyle: FontStyle.italic,
                              color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 10),
                        const Divider(height: 1, color: AppColors.border),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.person_outline_rounded,
                                size: 15, color: AppColors.primary),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(item.assignedToName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primaryDark)),
                            ),
                            _actionIcon(
                                Icons.add_comment_outlined,
                                AppColors.primary,
                                onAddNote,
                                'Add Manager Note'),
                            _actionIcon(
                                Icons.history_rounded,
                                AppColors.primary,
                                onHistory,
                                'Timeline History'),
                            _actionIcon(Icons.phone_in_talk_rounded,
                                AppColors.primary, onCall, 'Call'),
                            _actionIcon(
                                Icons.chat_rounded,
                                const Color(0xFF128C7E),
                                onWhatsApp,
                                'WhatsApp'),
                          ],
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
    );
  }

  Widget _actionIcon(
      IconData icon, Color color, VoidCallback onTap, String tooltip) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Icon(icon, size: 18, color: color),
        ),
      ),
    );
  }
}
