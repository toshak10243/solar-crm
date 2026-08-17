import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/manager_lead_service.dart';

class ManagerLeadDetailModal extends StatefulWidget {
  final Map<String, dynamic> lead;
  final VoidCallback onUpdate;

  const ManagerLeadDetailModal({
    Key? key,
    required this.lead,
    required this.onUpdate,
  }) : super(key: key);

  @override
  State<ManagerLeadDetailModal> createState() => _ManagerLeadDetailModalState();
}

class _ManagerLeadDetailModalState extends State<ManagerLeadDetailModal>
    with SingleTickerProviderStateMixin {
  final ManagerLeadService _service = ManagerLeadService();
  late TabController _tabController;

  String _status = ''; // '' = No Change, matches React select
  final TextEditingController _remarkController = TextEditingController();
  DateTime? _selectedNextDate;
  bool _isSubmitting = false;

  List<dynamic> _historyLogs = [];
  bool _isLoadingLogs = true;

  final List<String> _statusOptions = [
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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    // React starts status as '' (No Change) not the lead's current status.
    _status = '';
    _loadHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _remarkController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoadingLogs = true);
    final logs = await _service.fetchLeadHistory(widget.lead['id']);
    if (mounted) {
      setState(() {
        _historyLogs = logs;
        _isLoadingLogs = false;
      });
    }
  }

  Future<void> _pickNextDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedNextDate ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 3),
    );
    if (picked != null) {
      setState(() => _selectedNextDate = picked);
    }
  }

  Future<void> _handleQuickUpdate() async {
    final note = _remarkController.text.trim();
    if (note.isEmpty && _status.isEmpty) return;

    setState(() => _isSubmitting = true);

    final payload = {
      'note': note.isNotEmpty ? note : 'Status updated to $_status',
      'followup_type': 'Call',
      'status_after_followup': _status.isNotEmpty ? _status : null,
      'follow_up_date': _selectedNextDate?.toIso8601String().split('T')[0],
    };

    final result = await _service.addFollowup(widget.lead['id'], payload);

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (result['success'] == true) {
        _remarkController.clear();
        setState(() {
          _status = '';
          _selectedNextDate = null;
        });
        widget.onUpdate();
        _loadHistory();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Lead updated successfully!'),
              backgroundColor: AppColors.success),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(result['message']?.toString() ?? 'Update failed'),
              backgroundColor: AppColors.danger),
        );
      }
    }
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'L';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  String _formatDate(String? value) {
    if (value == null || value.isEmpty || value == 'null') return '—';
    try {
      final d = DateTime.parse(value).toLocal();
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
      return '—';
    }
  }

  String _formatCurrency(dynamic v) {
    if (v == null || v.toString().isEmpty) return '—';
    final n = num.tryParse(v.toString());
    if (n == null) return '—';
    return '₹${n.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final lead = widget.lead;
    final name = lead['customer_name']?.toString() ?? 'Customer';
    final code = lead['lead_code']?.toString() ?? 'LD000';
    final repName = lead['assigned_to_name']?.toString() ?? 'Unassigned';

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: FractionallySizedBox(
        heightFactor: 0.92,
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),

            // Header Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              decoration: const BoxDecoration(color: AppColors.primaryDark),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: Colors.white,
                    child: Text(_getInitials(name),
                        style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppColors.primaryDark,
                            fontSize: 14)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                                color: Colors.white)),
                        Text('$code • Assigned: $repName',
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 11.5,
                                color: Colors.white70,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    margin: const EdgeInsets.only(right: 4),
                    decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(6)),
                    child: Text(lead['status']?.toString() ?? '—',
                        style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: Colors.white)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Tabs
            TabBar(
              controller: _tabController,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textSecondary,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              tabs: const [
                Tab(text: 'Lead Details'),
                Tab(text: 'Activity Timeline'),
              ],
            ),

            // Tab Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Tab 1: Details
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _buildSectionCard('Contact Information', [
                          _buildInfoRow(Icons.phone_outlined, 'Mobile Number',
                              lead['mobile_number']?.toString() ?? '—'),
                          _buildInfoRow(
                              Icons.phone_paused_outlined,
                              'Alternate Number',
                              lead['alternate_number']?.toString() ?? '—'),
                          _buildInfoRow(Icons.email_outlined, 'Email Address',
                              lead['email']?.toString() ?? '—'),
                          _buildInfoRow(
                              Icons.location_on_outlined,
                              'Full Address',
                              [
                                lead['address'],
                                lead['city'],
                                lead['state'],
                                lead['pincode']
                              ]
                                  .where((e) =>
                                      e != null &&
                                      e.toString().trim().isNotEmpty)
                                  .join(', ')
                                  .let((s) => s.isEmpty ? '—' : s)),
                        ]),
                        const SizedBox(height: 12),
                        _buildSectionCard('Solar Requirement', [
                          _buildInfoRow(
                              Icons.solar_power_outlined,
                              'Type',
                              lead['solar_requirement']?.toString() ??
                                  'Residential'),
                          _buildInfoRow(
                              Icons.flash_on_outlined,
                              'Required kW',
                              lead['required_kw'] != null &&
                                      lead['required_kw'].toString().isNotEmpty
                                  ? '${lead['required_kw']} kW'
                                  : '—'),
                          _buildInfoRow(
                              Icons.monetization_on_outlined,
                              'Quotation Amount',
                              _formatCurrency(lead['quotation_amount'])),
                          _buildInfoRow(
                              Icons.thumb_up_alt_outlined,
                              'Interest Status',
                              lead['interest_status']?.toString() ?? 'Pending'),
                        ]),
                        const SizedBox(height: 12),
                        _buildSectionCard('Important Dates & Remarks', [
                          _buildInfoRow(
                              Icons.event_outlined,
                              'Next Follow-up',
                              _formatDate(
                                  lead['next_follow_up_date']?.toString())),
                          _buildInfoRow(
                              Icons.event_available_outlined,
                              'Site Visit Date',
                              _formatDate(lead['site_visit_date']?.toString())),
                          _buildInfoRow(Icons.notes_rounded, 'Remarks',
                              lead['remark']?.toString() ?? '—'),
                        ]),
                        const SizedBox(height: 16),

                        // Manager Quick Update Box
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.hover,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('MANAGER QUICK UPDATE',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.textSecondary,
                                      letterSpacing: 0.5)),
                              const SizedBox(height: 10),
                              DropdownButtonFormField<String>(
                                value: _status.isEmpty ? '' : _status,
                                isExpanded: true,
                                decoration: const InputDecoration(
                                    labelText: 'Update Status',
                                    filled: true,
                                    fillColor: Colors.white),
                                items: [
                                  const DropdownMenuItem(
                                      value: '', child: Text('No Change')),
                                  ..._statusOptions.map((s) => DropdownMenuItem(
                                      value: s,
                                      child: Text(s,
                                          overflow: TextOverflow.ellipsis))),
                                ],
                                onChanged: (val) =>
                                    setState(() => _status = val ?? ''),
                              ),
                              const SizedBox(height: 10),
                              InkWell(
                                onTap: _pickNextDate,
                                child: InputDecorator(
                                  decoration: const InputDecoration(
                                    labelText: 'Next Follow-up Date',
                                    filled: true,
                                    fillColor: Colors.white,
                                  ),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(_selectedNextDate == null
                                          ? 'Select date'
                                          : _formatDate(_selectedNextDate!
                                              .toIso8601String())),
                                      const Icon(Icons.calendar_today_outlined,
                                          size: 16,
                                          color: AppColors.textSecondary),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              TextField(
                                controller: _remarkController,
                                maxLines: 2,
                                decoration: const InputDecoration(
                                    labelText: 'Activity Note',
                                    hintText:
                                        'Write call details, instructions...',
                                    filled: true,
                                    fillColor: Colors.white),
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                height: 42,
                                child: ElevatedButton.icon(
                                  onPressed: (_isSubmitting ||
                                          (_remarkController.text
                                                  .trim()
                                                  .isEmpty &&
                                              _status.isEmpty))
                                      ? null
                                      : _handleQuickUpdate,
                                  style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      elevation: 0),
                                  icon: _isSubmitting
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2))
                                      : const Icon(Icons.send_rounded,
                                          size: 16),
                                  label: const Text('Save Update',
                                      style: TextStyle(
                                          fontWeight: FontWeight.w800)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Tab 2: Activity Timeline
                  _isLoadingLogs
                      ? const Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary))
                      : _historyLogs.isEmpty
                          ? const Center(
                              child: Text('No activity history recorded yet.',
                                  style: TextStyle(
                                      fontSize: 12.5,
                                      color: AppColors.textSecondary)))
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _historyLogs.length,
                              itemBuilder: (context, index) {
                                final log = _historyLogs[index];
                                final note = log['note']?.toString() ??
                                    log['remark']?.toString() ??
                                    'Activity Logged';
                                final by = log['created_by_name']?.toString() ??
                                    log['performed_by_name']?.toString() ??
                                    'System';
                                final date =
                                    _formatDate(log['created_at']?.toString());

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                      color: AppColors.bg,
                                      borderRadius: BorderRadius.circular(12),
                                      border:
                                          Border.all(color: AppColors.border)),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(note,
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 13,
                                              color: AppColors.textPrimary)),
                                      const SizedBox(height: 4),
                                      Text('Logged by $by • $date',
                                          style: const TextStyle(
                                              fontSize: 10.5,
                                              color: AppColors.textSecondary,
                                              fontWeight: FontWeight.w600)),
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
    );
  }

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
          color: AppColors.bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(),
              style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primaryDark,
                  letterSpacing: 0.5)),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 1),
            child: Icon(icon, size: 16, color: AppColors.primary),
          ),
          const SizedBox(width: 8),
          Text('$label: ',
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary)),
          Expanded(
              child: Text(val,
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary))),
        ],
      ),
    );
  }
}

// Small helper extension so we can chain `.let()` like Kotlin, keeps the
// address-join logic above readable.
extension _Let<T> on T {
  R let<R>(R Function(T) op) => op(this);
}
