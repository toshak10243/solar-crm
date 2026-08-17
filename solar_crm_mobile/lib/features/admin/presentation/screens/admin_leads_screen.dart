import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/indian_states_cities.dart';
import '../../data/admin_leads_service.dart';

class AdminLeadsScreen extends ConsumerStatefulWidget {
  const AdminLeadsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<AdminLeadsScreen> createState() => _AdminLeadsScreenState();
}

class _AdminLeadsScreenState extends ConsumerState<AdminLeadsScreen> {
  final AdminLeadsService _service = AdminLeadsService();

  List<dynamic> _leads = [];
  List<dynamic> _kpiSnapshot = [];
  List<dynamic> _usersList = [];

  bool _isLoading = true; // full-screen spinner — first load only
  bool _isRefreshing = false; // slim inline indicator for later fetches
  bool _hasLoadedOnce = false;
  bool _isKpiLoading = false;
  String? _errorMessage;

  // Filters & Search
  final TextEditingController _searchCtrl = TextEditingController();
  Timer? _searchDebounce;
  String _statusFilter = '';
  String _priorityFilter = '';
  String _sourceFilter = '';
  String _assignedFilter = '';

  // Options
  final List<String> _statusOptions = const [
    'New Lead',
    'Contacted',
    'Follow-up Pending',
    'Site Visit Scheduled',
    'Quotation Sent',
    'Negotiation',
    'Won',
    'Lost',
    'Not Interested'
  ];
  final List<String> _priorityOptions = const ['Low', 'Medium', 'High'];
  final List<String> _sourceOptions = const [
    'Website',
    'Call',
    'Reference',
    'Facebook',
    'Google',
    'Other'
  ];
  final List<String> _solarRequirementOptions = const [
    'Residential',
    'Commercial'
  ];
  final List<String> _interestOptions = const [
    'Pending',
    'Interested',
    'Not Interested'
  ];

  // Form Modal Controllers
  dynamic _editingLeadId;
  final _customerNameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _altMobileCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();
  final _requiredKwCtrl = TextEditingController();
  final _quotationAmtCtrl = TextEditingController();
  final _remarkCtrl = TextEditingController();

  String _solarReq = 'Residential';
  String _interestStatus = 'Pending';
  String _leadSource = 'Website';
  String _priority = 'Medium';
  String _status = 'New Lead';
  String? _selectedState;
  String? _selectedCity;
  dynamic _selectedAssignedUser;
  DateTime? _selectedNextFollowup;
  DateTime? _selectedSiteVisit;

  List<String> _availableCities = [];
  bool _isSavingLead = false;

  // Follow-up Drawer State
  dynamic _activeFollowupLead;
  final _followupNoteCtrl = TextEditingController();
  String _followupType = 'Call';
  String _statusAfterFollowup = '';
  DateTime? _nextFollowupDate;
  bool _isSavingFollowup = false;

  // Assign Drawer State
  dynamic _activeAssignLead;
  dynamic _newAssigneeId;
  bool _isAssigning = false;

  // Screen-local accent colours (kept off pure/bright yellow everywhere)
  static const Color _accentAmber = Color(0xFFB45309); // deep amber/brown
  static const Color _accentAmberSoft = Color(0xFFFDF1DF);
  static const Color _accentTeal = Color(0xFF0E7490); // for WhatsApp/info-ish
  static const Color _accentTealSoft = Color(0xFFE0F2F4);

  @override
  void initState() {
    super.initState();
    _fetchLeads();
    _fetchUsers();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchCtrl.dispose();
    _customerNameCtrl.dispose();
    _mobileCtrl.dispose();
    _altMobileCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _pincodeCtrl.dispose();
    _requiredKwCtrl.dispose();
    _quotationAmtCtrl.dispose();
    _remarkCtrl.dispose();
    _followupNoteCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchLeads() async {
    setState(() {
      // Only the very first load shows the big full-screen spinner. Every
      // later call (typing in search, changing a filter) keeps the KPI
      // cards / filter bar / existing list mounted and just shows a thin
      // progress bar — this is what stops the whole screen from
      // flashing/reloading on every keystroke.
      if (!_hasLoadedOnce) {
        _isLoading = true;
      } else {
        _isRefreshing = true;
      }
      _errorMessage = null;
    });

    final params = <String, dynamic>{
      'limit': 5000,
      if (_searchCtrl.text.trim().isNotEmpty) 'search': _searchCtrl.text.trim(),
      if (_statusFilter.isNotEmpty) 'status': _statusFilter,
      if (_priorityFilter.isNotEmpty) 'priority': _priorityFilter,
      if (_sourceFilter.isNotEmpty) 'lead_source': _sourceFilter,
      if (_assignedFilter.isNotEmpty) 'assigned_to': _assignedFilter,
    };

    final res = await _service.getLeads(params);

    if (mounted) {
      if (res['success'] == true) {
        final list = res['data'] as List;
        setState(() {
          _leads = list;
          _kpiSnapshot = list;
          _isLoading = false;
          _isRefreshing = false;
          _hasLoadedOnce = true;
        });
      } else {
        setState(() {
          _errorMessage =
              res['message']?.toString() ?? 'Failed to fetch leads.';
          _isLoading = false;
          _isRefreshing = false;
          _hasLoadedOnce = true;
        });
      }
    }
  }

  // Debounced search — waits for the user to pause typing before hitting
  // the API instead of firing a request (and a full rebuild) on every
  // single keystroke, which is what was causing the whole screen to
  // reload while typing.
  void _onSearchChanged(String _) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      if (mounted) _fetchLeads();
    });
    setState(() {}); // just to refresh the clear (x) icon immediately
  }

  Future<void> _fetchUsers() async {
    final users = await _service.getUsers();
    if (mounted) setState(() => _usersList = users);
  }

  void _makeCall(String? mobile) async {
    if (mobile == null || mobile.trim().isEmpty) {
      _showNotification('No mobile number available for this lead.',
          isError: true);
      return;
    }
    final Uri url = Uri.parse('tel:${mobile.trim()}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      _showNotification('Could not open the dialer.', isError: true);
    }
  }

  void _openWhatsApp(String? mobile) async {
    if (mobile == null || mobile.trim().isEmpty) {
      _showNotification('No mobile number available for this lead.',
          isError: true);
      return;
    }
    final clean = mobile.replaceAll(RegExp(r'\D'), '');
    final Uri url = Uri.parse('https://wa.me/91$clean');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      _showNotification('Could not open WhatsApp.', isError: true);
    }
  }

  InputDecoration _fieldDecoration(String label, {Widget? suffixIcon}) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: AppColors.bg,
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.6),
      ),
    );
  }

  void _openLeadFormModal({Map<String, dynamic>? lead}) {
    if (lead != null) {
      _editingLeadId = lead['id'];
      _customerNameCtrl.text = lead['customer_name']?.toString() ?? '';
      _mobileCtrl.text = lead['mobile_number']?.toString() ?? '';
      _altMobileCtrl.text = lead['alternate_number']?.toString() ?? '';
      _emailCtrl.text = lead['email']?.toString() ?? '';
      _addressCtrl.text = lead['address']?.toString() ?? '';
      _pincodeCtrl.text = lead['pincode']?.toString() ?? '';
      _requiredKwCtrl.text = lead['required_kw']?.toString() ?? '';
      _quotationAmtCtrl.text = lead['quotation_amount']?.toString() ?? '';
      _remarkCtrl.text = lead['remark']?.toString() ?? '';

      _solarReq = lead['solar_requirement']?.toString() ?? 'Residential';
      _interestStatus = lead['interest_status']?.toString() ?? 'Pending';
      _leadSource = lead['lead_source']?.toString() ?? 'Website';
      _priority = lead['priority']?.toString() ?? 'Medium';
      _status = lead['status']?.toString() ?? 'New Lead';
      _selectedAssignedUser = lead['assigned_to']?.toString();

      _selectedState = lead['state']?.toString();
      if (_selectedState != null &&
          IndianStatesCities.data.containsKey(_selectedState)) {
        _availableCities = IndianStatesCities.data[_selectedState] ?? [];
      } else {
        _availableCities = [];
      }
      _selectedCity = lead['city']?.toString();

      _selectedNextFollowup =
          DateTime.tryParse(lead['next_follow_up_date']?.toString() ?? '');
      _selectedSiteVisit =
          DateTime.tryParse(lead['site_visit_date']?.toString() ?? '');
    } else {
      _editingLeadId = null;
      _customerNameCtrl.clear();
      _mobileCtrl.clear();
      _altMobileCtrl.clear();
      _emailCtrl.clear();
      _addressCtrl.clear();
      _pincodeCtrl.clear();
      _requiredKwCtrl.clear();
      _quotationAmtCtrl.clear();
      _remarkCtrl.clear();

      _solarReq = 'Residential';
      _interestStatus = 'Pending';
      _leadSource = 'Website';
      _priority = 'Medium';
      _status = 'New Lead';
      _selectedState = null;
      _selectedCity = null;
      _availableCities = [];
      _selectedAssignedUser = null;
      _selectedNextFollowup = null;
      _selectedSiteVisit = null;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => Container(
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

                // Header
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primaryDark, AppColors.primary],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                                _editingLeadId == null
                                    ? Icons.add_business_rounded
                                    : Icons.edit_rounded,
                                color: Colors.white,
                                size: 18),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _editingLeadId == null
                                ? 'Create Master Solar Lead'
                                : 'Edit Lead Details',
                            style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                                color: Colors.white),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded,
                            color: Colors.white),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),

                // Body
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('CUSTOMER INFORMATION',
                            style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryDark,
                                letterSpacing: 0.5)),
                        const SizedBox(height: 10),
                        TextField(
                            controller: _customerNameCtrl,
                            decoration: _fieldDecoration('CUSTOMER NAME *')),
                        const SizedBox(height: 12),
                        TextField(
                            controller: _mobileCtrl,
                            keyboardType: TextInputType.phone,
                            decoration: _fieldDecoration('MOBILE NUMBER *')),
                        const SizedBox(height: 12),
                        TextField(
                            controller: _altMobileCtrl,
                            keyboardType: TextInputType.phone,
                            decoration: _fieldDecoration('ALTERNATE NUMBER')),
                        const SizedBox(height: 12),
                        TextField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            decoration: _fieldDecoration('EMAIL ADDRESS')),
                        const SizedBox(height: 12),
                        TextField(
                            controller: _addressCtrl,
                            decoration: _fieldDecoration('FULL ADDRESS')),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _selectedState,
                                isExpanded: true,
                                decoration: _fieldDecoration('STATE'),
                                items: IndianStatesCities.states
                                    .map((s) => DropdownMenuItem(
                                        value: s, child: Text(s)))
                                    .toList(),
                                onChanged: (val) {
                                  setSheetState(() {
                                    _selectedState = val;
                                    _availableCities =
                                        IndianStatesCities.data[val] ?? [];
                                    _selectedCity = null;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _selectedCity,
                                isExpanded: true,
                                decoration: _fieldDecoration('CITY'),
                                items: _availableCities
                                    .map((c) => DropdownMenuItem(
                                        value: c, child: Text(c)))
                                    .toList(),
                                onChanged: (val) =>
                                    setSheetState(() => _selectedCity = val),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                            controller: _pincodeCtrl,
                            keyboardType: TextInputType.number,
                            decoration: _fieldDecoration('PINCODE')),
                        const SizedBox(height: 22),
                        const Text('SOLAR REQUIREMENT DETAILS',
                            style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryDark,
                                letterSpacing: 0.5)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _solarReq,
                                isExpanded: true,
                                decoration: _fieldDecoration('TYPE'),
                                items: _solarRequirementOptions
                                    .map((s) => DropdownMenuItem(
                                        value: s, child: Text(s)))
                                    .toList(),
                                onChanged: (val) =>
                                    setSheetState(() => _solarReq = val!),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _interestStatus,
                                isExpanded: true,
                                decoration: _fieldDecoration('INTEREST STATUS'),
                                items: _interestOptions
                                    .map((s) => DropdownMenuItem(
                                        value: s, child: Text(s)))
                                    .toList(),
                                onChanged: (val) =>
                                    setSheetState(() => _interestStatus = val!),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                  controller: _requiredKwCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: _fieldDecoration('REQUIRED kW')),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                  controller: _quotationAmtCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration:
                                      _fieldDecoration('QUOTATION AMOUNT (₹)')),
                            ),
                          ],
                        ),
                        const SizedBox(height: 22),
                        const Text('PIPELINE & ASSIGNMENT',
                            style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryDark,
                                letterSpacing: 0.5)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _leadSource,
                                isExpanded: true,
                                decoration: _fieldDecoration('LEAD SOURCE'),
                                items: _sourceOptions
                                    .map((s) => DropdownMenuItem(
                                        value: s, child: Text(s)))
                                    .toList(),
                                onChanged: (val) =>
                                    setSheetState(() => _leadSource = val!),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _priority,
                                isExpanded: true,
                                decoration: _fieldDecoration('PRIORITY'),
                                items: _priorityOptions
                                    .map((s) => DropdownMenuItem(
                                        value: s, child: Text(s)))
                                    .toList(),
                                onChanged: (val) =>
                                    setSheetState(() => _priority = val!),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: _status,
                          isExpanded: true,
                          decoration: _fieldDecoration('PIPELINE STATUS'),
                          items: _statusOptions
                              .map((s) =>
                                  DropdownMenuItem(value: s, child: Text(s)))
                              .toList(),
                          onChanged: (val) =>
                              setSheetState(() => _status = val!),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: _selectedAssignedUser,
                          isExpanded: true,
                          decoration: _fieldDecoration('ASSIGN TO SALES REP'),
                          items: [
                            const DropdownMenuItem<String>(
                                value: null, child: Text('Unassigned')),
                            ..._usersList
                                .map<DropdownMenuItem<String>>((u) =>
                                    DropdownMenuItem(
                                        value: u['id']?.toString(),
                                        child: Text(
                                            u['full_name']?.toString() ??
                                                'User')))
                                .toList(),
                          ],
                          onChanged: (val) =>
                              setSheetState(() => _selectedAssignedUser = val),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                            controller: _remarkCtrl,
                            maxLines: 2,
                            decoration: _fieldDecoration('REMARK / NOTES')),
                        const SizedBox(height: 26),
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isSavingLead
                                ? null
                                : () async {
                                    if (_customerNameCtrl.text.trim().isEmpty ||
                                        _mobileCtrl.text.trim().isEmpty) {
                                      _showNotification(
                                          'Customer Name and Mobile Number are required!',
                                          isError: true);
                                      return;
                                    }

                                    setSheetState(() => _isSavingLead = true);

                                    final payload = {
                                      'customer_name':
                                          _customerNameCtrl.text.trim(),
                                      'mobile_number': _mobileCtrl.text.trim(),
                                      'alternate_number':
                                          _altMobileCtrl.text.trim(),
                                      'email': _emailCtrl.text.trim(),
                                      'address': _addressCtrl.text.trim(),
                                      'state': _selectedState,
                                      'city': _selectedCity,
                                      'pincode': _pincodeCtrl.text.trim(),
                                      'solar_requirement': _solarReq,
                                      'interest_status': _interestStatus,
                                      'required_kw':
                                          _requiredKwCtrl.text.trim(),
                                      'quotation_amount':
                                          _quotationAmtCtrl.text.trim(),
                                      'lead_source': _leadSource,
                                      'priority': _priority,
                                      'status': _status,
                                      'assigned_to': _selectedAssignedUser,
                                      'remark': _remarkCtrl.text.trim(),
                                    };

                                    Map<String, dynamic> res;
                                    if (_editingLeadId != null) {
                                      res = await _service.updateLead(
                                          _editingLeadId, payload);
                                    } else {
                                      res = await _service.createLead(payload);
                                    }

                                    setSheetState(() => _isSavingLead = false);

                                    if (mounted) {
                                      if (res['success'] == true) {
                                        Navigator.pop(ctx);
                                        _showNotification(
                                            res['message']?.toString() ??
                                                'Action completed!');
                                        _fetchLeads();
                                      } else {
                                        _showNotification(
                                            res['message']?.toString() ??
                                                'Something went wrong. Please try again.',
                                            isError: true);
                                      }
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12))),
                            child: _isSavingLead
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2))
                                : Text(
                                    _editingLeadId == null
                                        ? 'Create Lead'
                                        : 'Save Changes',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 14.5)),
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
    );
  }

  // Opens the lead detail sheet, which fetches the FULL lead record plus
  // follow-ups and activity logs from the API (mirrors the web
  // `openViewDrawer` behaviour instead of only showing the static row
  // data that was already in the list).
  void _openViewDetailsModal(dynamic lead) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AdminLeadDetailSheet(
        initialLead: lead,
        service: _service,
        getInitials: _getInitials,
        formatCurrency: _formatCurrency,
        formatDate: _formatDate,
        makeCall: _makeCall,
        openWhatsApp: _openWhatsApp,
        onEdit: (freshLead) {
          Navigator.pop(ctx);
          _openLeadFormModal(lead: freshLead);
        },
      ),
    );
  }

  void _showDeleteDialog(dynamic leadId, String customerName) {
    bool isDeleting = false;
    showDialog(
      context: context,
      barrierDismissible: !isDeleting,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
          contentPadding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
          actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.dangerSoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.delete_outline_rounded,
                    color: AppColors.danger, size: 20),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text('Delete Lead Record?',
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: AppColors.primaryDark)),
              ),
            ],
          ),
          content: Text(
              'Are you sure you want to delete lead "$customerName"? This action cannot be undone.',
              style: const TextStyle(
                  fontSize: 12.5, color: AppColors.textSecondary)),
          actions: [
            TextButton(
                onPressed: isDeleting ? null : () => Navigator.pop(ctx),
                child: const Text('Cancel')),
            ElevatedButton(
              onPressed: isDeleting
                  ? null
                  : () async {
                      setDialogState(() => isDeleting = true);
                      final res = await _service.deleteLead(leadId);
                      setDialogState(() => isDeleting = false);
                      if (!mounted) return;
                      Navigator.pop(ctx);
                      if (res['success'] == true) {
                        _showNotification(
                            res['message']?.toString() ?? 'Lead deleted!');
                        _fetchLeads();
                      } else {
                        _showNotification(
                            res['message']?.toString() ??
                                'Failed to delete lead.',
                            isError: true);
                      }
                    },
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.danger,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10))),
              child: isDeleting
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Confirm Delete',
                      style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ],
        ),
      ),
    );
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
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(message,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: Colors.white)),
            ),
          ],
        ),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'L';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  String _formatCurrency(dynamic val) {
    final parsedNum = num.tryParse(val?.toString() ?? '0') ?? 0;
    return '₹${parsedNum.toStringAsFixed(0)}';
  }

  String _formatDate(String? value) {
    if (value == null || value.isEmpty || value == 'null') return 'N/A';
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
      return 'N/A';
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'Won':
        return AppColors.success;
      case 'Lost':
      case 'Not Interested':
        return AppColors.danger;
      case 'Site Visit Scheduled':
      case 'Quotation Sent':
      case 'Negotiation':
        return _accentTeal;
      case 'Follow-up Pending':
        return _accentAmber;
      default:
        return AppColors.primaryDark;
    }
  }

  Color _statusSoftColor(String status) {
    switch (status) {
      case 'Won':
        return AppColors.successSoft;
      case 'Lost':
      case 'Not Interested':
        return AppColors.dangerSoft;
      case 'Site Visit Scheduled':
      case 'Quotation Sent':
      case 'Negotiation':
        return _accentTealSoft;
      case 'Follow-up Pending':
        return _accentAmberSoft;
      default:
        return AppColors.primarySoft;
    }
  }

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'High':
        return AppColors.danger;
      case 'Medium':
        return _accentAmber;
      default:
        return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _leads.length;
    final newLeads = _leads.where((l) => l['status'] == 'New Lead').length;
    final siteVisits =
        _leads.where((l) => l['status'] == 'Site Visit Scheduled').length;
    final wonLeads = _leads.where((l) => l['status'] == 'Won').length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Master Lead Management',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Org-wide lead pipeline control',
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
            onPressed: _fetchLeads,
            tooltip: 'Refresh Master Leads',
          ),
          const SizedBox(width: 4),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openLeadFormModal(),
        backgroundColor: AppColors.primary,
        elevation: 2,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Add Lead',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5))
            : Column(
                children: [
                  // Slim top progress bar while a search/filter refresh is
                  // in flight — the KPI cards, filter bar and existing
                  // list all stay on screen instead of flashing to blank.
                  if (_isRefreshing)
                    const LinearProgressIndicator(
                      minHeight: 2.5,
                      backgroundColor: AppColors.hover,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _fetchLeads,
                      color: AppColors.primary,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics()),
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
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
                                        color:
                                            AppColors.danger.withOpacity(0.3))),
                                child: Row(
                                  children: [
                                    const Icon(Icons.error_outline_rounded,
                                        size: 18, color: AppColors.danger),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(_errorMessage!,
                                          style: const TextStyle(
                                              color: AppColors.danger,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 12.5)),
                                    ),
                                    TextButton(
                                      onPressed: _fetchLeads,
                                      child: const Text('Retry',
                                          style: TextStyle(
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.danger)),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],

                            // 1. KPI CARDS
                            GridView.count(
                              crossAxisCount: 2,
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                              childAspectRatio: 1.8,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              children: [
                                _buildKpiCard(
                                    'TOTAL LEADS',
                                    '$total',
                                    'Master Records',
                                    Icons.dashboard_rounded,
                                    AppColors.primary,
                                    AppColors.primarySoft),
                                _buildKpiCard(
                                    'NEW ENQUIRIES',
                                    '$newLeads',
                                    'Unprocessed',
                                    Icons.fiber_new_rounded,
                                    _accentTeal,
                                    _accentTealSoft),
                                _buildKpiCard(
                                    'SITE VISITS',
                                    '$siteVisits',
                                    'Scheduled',
                                    Icons.event_available_rounded,
                                    _accentAmber,
                                    _accentAmberSoft),
                                _buildKpiCard(
                                    'CLOSED WON',
                                    '$wonLeads',
                                    'Converted Deals',
                                    Icons.emoji_events_rounded,
                                    AppColors.success,
                                    AppColors.successSoft),
                              ],
                            ),

                            const SizedBox(height: 16),

                            // 2. SEARCH & MULTI FILTERS BAR
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.border)),
                              child: Column(
                                children: [
                                  TextField(
                                    controller: _searchCtrl,
                                    onChanged: _onSearchChanged,
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600),
                                    decoration: InputDecoration(
                                      hintText:
                                          'Search lead by customer name, mobile, code, city...',
                                      hintStyle: const TextStyle(
                                          fontSize: 12.5,
                                          color: AppColors.textMuted),
                                      prefixIcon: const Icon(
                                          Icons.search_rounded,
                                          size: 20,
                                          color: AppColors.primary),
                                      suffixIcon: _isRefreshing
                                          ? const Padding(
                                              padding: EdgeInsets.all(12),
                                              child: SizedBox(
                                                width: 16,
                                                height: 16,
                                                child:
                                                    CircularProgressIndicator(
                                                        strokeWidth: 2,
                                                        color:
                                                            AppColors.primary),
                                              ),
                                            )
                                          : (_searchCtrl.text.isNotEmpty
                                              ? IconButton(
                                                  icon: const Icon(
                                                      Icons.clear_rounded,
                                                      size: 18),
                                                  onPressed: () {
                                                    _searchDebounce?.cancel();
                                                    _searchCtrl.clear();
                                                    _fetchLeads();
                                                  })
                                              : null),
                                      filled: true,
                                      fillColor: AppColors.bg,
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              vertical: 10),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: BorderSide.none,
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: const BorderSide(
                                            color: AppColors.border),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: const BorderSide(
                                            color: AppColors.primary,
                                            width: 1.5),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: DropdownButtonFormField<String>(
                                          value: _statusFilter,
                                          isExpanded: true,
                                          decoration: const InputDecoration(
                                              contentPadding:
                                                  EdgeInsets.symmetric(
                                                      horizontal: 10,
                                                      vertical: 8),
                                              filled: true,
                                              fillColor: AppColors.bg),
                                          style: const TextStyle(
                                              fontSize: 11.5,
                                              color: AppColors.textPrimary,
                                              fontWeight: FontWeight.w700),
                                          items: [
                                            const DropdownMenuItem(
                                                value: '',
                                                child: Text('All Statuses')),
                                            ..._statusOptions.map((s) =>
                                                DropdownMenuItem(
                                                    value: s, child: Text(s))),
                                          ],
                                          onChanged: (val) {
                                            setState(
                                                () => _statusFilter = val!);
                                            _fetchLeads();
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: DropdownButtonFormField<String>(
                                          value: _priorityFilter,
                                          isExpanded: true,
                                          decoration: const InputDecoration(
                                              contentPadding:
                                                  EdgeInsets.symmetric(
                                                      horizontal: 10,
                                                      vertical: 8),
                                              filled: true,
                                              fillColor: AppColors.bg),
                                          style: const TextStyle(
                                              fontSize: 11.5,
                                              color: AppColors.textPrimary,
                                              fontWeight: FontWeight.w700),
                                          items: [
                                            const DropdownMenuItem(
                                                value: '',
                                                child: Text('All Priorities')),
                                            ..._priorityOptions.map((p) =>
                                                DropdownMenuItem(
                                                    value: p, child: Text(p))),
                                          ],
                                          onChanged: (val) {
                                            setState(
                                                () => _priorityFilter = val!);
                                            _fetchLeads();
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 16),

                            // 3. LEADS CARDS LIST
                            if (_leads.isEmpty)
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(28),
                                decoration: BoxDecoration(
                                    color: AppColors.card,
                                    borderRadius: BorderRadius.circular(16),
                                    border:
                                        Border.all(color: AppColors.border)),
                                child: const Column(
                                  children: [
                                    Icon(Icons.inventory_2_outlined,
                                        size: 40, color: AppColors.textMuted),
                                    SizedBox(height: 10),
                                    Text('No Master Leads Found',
                                        style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 15,
                                            color: AppColors.textPrimary)),
                                    SizedBox(height: 4),
                                    Text(
                                        'Try resetting search criteria or create a new lead.',
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textSecondary)),
                                  ],
                                ),
                              )
                            else
                              ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _leads.length,
                                itemBuilder: (context, index) {
                                  final lead = _leads[index];
                                  final id = lead['id'];
                                  final code =
                                      lead['lead_code']?.toString() ?? '#LD';
                                  final name =
                                      lead['customer_name']?.toString() ??
                                          'Customer';
                                  final mobile =
                                      lead['mobile_number']?.toString() ?? '';
                                  final city =
                                      lead['city']?.toString() ?? 'City N/A';
                                  final status =
                                      lead['status']?.toString() ?? 'New Lead';
                                  final priority =
                                      lead['priority']?.toString() ?? 'Medium';
                                  final repName =
                                      lead['assigned_to_name']?.toString() ??
                                          'Unassigned';

                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: AppColors.card,
                                      borderRadius: BorderRadius.circular(16),
                                      border:
                                          Border.all(color: AppColors.border),
                                      boxShadow: [
                                        BoxShadow(
                                            color:
                                                Colors.black.withOpacity(0.03),
                                            blurRadius: 10,
                                            offset: const Offset(0, 4))
                                      ],
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Row(
                                                children: [
                                                  CircleAvatar(
                                                    radius: 18,
                                                    backgroundColor:
                                                        AppColors.primaryDark,
                                                    child: Text(
                                                        _getInitials(name),
                                                        style: const TextStyle(
                                                            color: Colors.white,
                                                            fontWeight:
                                                                FontWeight.w800,
                                                            fontSize: 11)),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment:
                                                          CrossAxisAlignment
                                                              .start,
                                                      children: [
                                                        Text(name,
                                                            style: const TextStyle(
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w800,
                                                                fontSize: 14.5,
                                                                color: AppColors
                                                                    .textPrimary),
                                                            overflow:
                                                                TextOverflow
                                                                    .ellipsis),
                                                        Row(
                                                          children: [
                                                            Text('$code',
                                                                style: const TextStyle(
                                                                    fontSize:
                                                                        11,
                                                                    fontWeight:
                                                                        FontWeight
                                                                            .w700,
                                                                    color: AppColors
                                                                        .primary)),
                                                            const Text(' • ',
                                                                style: TextStyle(
                                                                    fontSize:
                                                                        11,
                                                                    color: AppColors
                                                                        .textMuted)),
                                                            Flexible(
                                                              child: Text(city,
                                                                  style: const TextStyle(
                                                                      fontSize:
                                                                          11,
                                                                      fontWeight:
                                                                          FontWeight
                                                                              .w600,
                                                                      color: AppColors
                                                                          .textSecondary),
                                                                  overflow:
                                                                      TextOverflow
                                                                          .ellipsis),
                                                            ),
                                                          ],
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 3),
                                              decoration: BoxDecoration(
                                                  color:
                                                      _statusSoftColor(status),
                                                  borderRadius:
                                                      BorderRadius.circular(6)),
                                              child: Text(status.toUpperCase(),
                                                  style: TextStyle(
                                                      fontSize: 9.5,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: _statusColor(
                                                          status))),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            const Icon(
                                                Icons.support_agent_rounded,
                                                size: 14,
                                                color: AppColors.textSecondary),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                  'Assigned Rep: $repName',
                                                  style: const TextStyle(
                                                      fontSize: 11.5,
                                                      color: AppColors
                                                          .textSecondary,
                                                      fontWeight:
                                                          FontWeight.w600),
                                                  overflow:
                                                      TextOverflow.ellipsis),
                                            ),
                                            const SizedBox(width: 6),
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 7,
                                                      vertical: 2),
                                              decoration: BoxDecoration(
                                                  color:
                                                      _priorityColor(priority)
                                                          .withOpacity(0.12),
                                                  borderRadius:
                                                      BorderRadius.circular(6)),
                                              child: Text(priority,
                                                  style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: _priorityColor(
                                                          priority))),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 10),
                                        const Divider(
                                            height: 1, color: AppColors.border),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                IconButton(
                                                  icon: const Icon(
                                                      Icons.visibility_outlined,
                                                      size: 18,
                                                      color: AppColors.primary),
                                                  onPressed: () =>
                                                      _openViewDetailsModal(
                                                          lead),
                                                  tooltip: 'View Details',
                                                ),
                                                IconButton(
                                                  icon: const Icon(
                                                      Icons
                                                          .phone_in_talk_rounded,
                                                      size: 18,
                                                      color: AppColors.success),
                                                  onPressed: () =>
                                                      _makeCall(mobile),
                                                  tooltip: 'Call Customer',
                                                ),
                                                IconButton(
                                                  icon: const Icon(
                                                      Icons
                                                          .chat_bubble_outline_rounded,
                                                      size: 18,
                                                      color: _accentTeal),
                                                  onPressed: () =>
                                                      _openWhatsApp(mobile),
                                                  tooltip: 'WhatsApp',
                                                ),
                                              ],
                                            ),
                                            Row(
                                              children: [
                                                IconButton(
                                                  icon: const Icon(
                                                      Icons.edit_outlined,
                                                      size: 18,
                                                      color: _accentAmber),
                                                  onPressed: () =>
                                                      _openLeadFormModal(
                                                          lead: lead),
                                                  tooltip: 'Edit Lead',
                                                ),
                                                IconButton(
                                                  icon: const Icon(
                                                      Icons
                                                          .delete_outline_rounded,
                                                      size: 18,
                                                      color: AppColors.danger),
                                                  onPressed: () =>
                                                      _showDeleteDialog(
                                                          id, name),
                                                  tooltip: 'Delete Lead',
                                                ),
                                              ],
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
                    ),
                  ),
                ],
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
              Expanded(
                child: Text(label,
                    style: const TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textSecondary)),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                    color: bg, borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 14, color: color),
              ),
            ],
          ),
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

  Widget _buildDetailRow(IconData icon, String label, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
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
                      color: AppColors.textPrimary),
                  overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }
}

// ======================================================
// ADMIN LEAD DETAIL SHEET
// ======================================================
// Mirrors the web `openViewDrawer` behaviour: fetches the FULL lead
// record + follow-ups + activity logs from the API (instead of just
// showing whatever static fields happened to be in the list row),
// and renders Follow-ups / Activity Log sections that the old modal
// never had.
class _AdminLeadDetailSheet extends StatefulWidget {
  final dynamic initialLead;
  final AdminLeadsService service;
  final String Function(String) getInitials;
  final String Function(dynamic) formatCurrency;
  final String Function(String?) formatDate;
  final void Function(String?) makeCall;
  final void Function(String?) openWhatsApp;
  final void Function(dynamic) onEdit;

  const _AdminLeadDetailSheet({
    required this.initialLead,
    required this.service,
    required this.getInitials,
    required this.formatCurrency,
    required this.formatDate,
    required this.makeCall,
    required this.openWhatsApp,
    required this.onEdit,
  });

  @override
  State<_AdminLeadDetailSheet> createState() => _AdminLeadDetailSheetState();
}

class _AdminLeadDetailSheetState extends State<_AdminLeadDetailSheet> {
  bool _loading = true;
  dynamic _lead;
  List<dynamic> _followups = [];
  List<dynamic> _logs = [];

  static const Color _primary = Color(0xFF00B5EF);
  static const Color _primaryDark = Color(0xFF292075);
  static const Color _primarySoft = Color(0xFFE0F7FF);
  static const Color _bg = Color(0xFFF4F6FA);
  static const Color _card = Color(0xFFFFFFFF);
  static const Color _border = Color(0xFFE2E8F0);
  static const Color _textPrimary = Color(0xFF0F172A);
  static const Color _textSecondary = Color(0xFF64748B);
  static const Color _textMuted = Color(0xFF94A3B8);
  static const Color _success = Color(0xFF16A34A);
  static const Color _successSoft = Color(0xFFDCFCE7);

  @override
  void initState() {
    super.initState();
    _lead = widget.initialLead;
    _loadAll();
  }

  Future<void> _loadAll() async {
    final id = widget.initialLead['id'];
    final results = await Future.wait([
      widget.service.getLeadById(id),
      widget.service.getFollowups(id),
      widget.service.getActivityLogs(id),
    ]);

    if (!mounted) return;

    final leadRes = results[0] as Map<String, dynamic>;
    final followupsRes = results[1] as List<dynamic>;
    final logsRes = results[2] as List<dynamic>;

    setState(() {
      if (leadRes['success'] == true && leadRes['data'] != null) {
        _lead = leadRes['data'];
      }
      _followups = followupsRes;
      _logs = logsRes;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final name = _lead['customer_name']?.toString() ?? 'Customer';
    final code = _lead['lead_code']?.toString() ?? '#LD';
    final assignedTo = _lead['assigned_to_name']?.toString() ?? 'Unassigned';
    final mobile = _lead['mobile_number']?.toString();

    return Container(
      decoration: const BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: FractionallySizedBox(
        heightFactor: 0.9,
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                    color: _border, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),

            // Header
            Container(
              padding: const EdgeInsets.all(18),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [_primaryDark, _primary],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: Colors.white,
                    child: Text(widget.getInitials(name),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: _primaryDark,
                            fontSize: 13)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name,
                            style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 15,
                                color: Colors.white),
                            overflow: TextOverflow.ellipsis),
                        Text('$code • Assigned: $assignedTo',
                            style: const TextStyle(
                                fontSize: 11, color: Colors.white70),
                            overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  IconButton(
                      icon:
                          const Icon(Icons.close_rounded, color: Colors.white),
                      onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),

            // Quick actions
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
              decoration: const BoxDecoration(
                color: _bg,
                border: Border(bottom: BorderSide(color: _border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => widget.makeCall(mobile),
                      icon: const Icon(Icons.call_rounded, size: 15),
                      label: const Text('Call'),
                      style: OutlinedButton.styleFrom(
                          foregroundColor: _textPrimary,
                          side: const BorderSide(color: _border),
                          textStyle: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 12)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => widget.openWhatsApp(mobile),
                      icon: const Icon(Icons.chat_rounded,
                          size: 15, color: Color(0xFF25D366)),
                      label: const Text('WhatsApp'),
                      style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF25D366),
                          side: const BorderSide(color: Color(0x4025D366)),
                          textStyle: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 12)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => widget.onEdit(_lead),
                      icon: const Icon(Icons.edit_outlined, size: 15),
                      label: const Text('Edit'),
                      style: OutlinedButton.styleFrom(
                          foregroundColor: _textPrimary,
                          side: const BorderSide(color: _border),
                          textStyle: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 12)),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(color: _primary))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _sectionCard('CUSTOMER INFORMATION', [
                            _infoRow(
                                Icons.person_outline_rounded, 'Name', name),
                            _infoRow(Icons.phone_outlined, 'Mobile',
                                _lead['mobile_number']?.toString() ?? 'N/A',
                                valueColor: _success),
                            _infoRow(Icons.phone_outlined, 'Alternate',
                                _lead['alternate_number']?.toString() ?? 'N/A'),
                            _infoRow(Icons.email_outlined, 'Email',
                                _lead['email']?.toString() ?? 'N/A'),
                            _infoRow(
                                Icons.location_on_outlined,
                                'Address',
                                [
                                  _lead['address'],
                                  _lead['city'],
                                  _lead['state'],
                                  _lead['pincode']
                                ]
                                    .where((e) =>
                                        e != null && e.toString().isNotEmpty)
                                    .join(', ')),
                          ]),
                          const SizedBox(height: 14),
                          _sectionCard('SOLAR REQUIREMENT', [
                            _infoRow(
                                Icons.solar_power_outlined,
                                'Type',
                                _lead['solar_requirement']?.toString() ??
                                    'N/A'),
                            _infoRow(
                                Icons.bolt_outlined,
                                'Required kW',
                                _lead['required_kw'] != null
                                    ? '${_lead['required_kw']} kW'
                                    : 'N/A'),
                            _infoRow(
                                Icons.monetization_on_outlined,
                                'Quotation',
                                widget
                                    .formatCurrency(_lead['quotation_amount']),
                                valueColor: _success),
                          ]),
                          const SizedBox(height: 14),
                          _sectionCard('LEAD DETAILS', [
                            _infoRow(Icons.source_outlined, 'Source',
                                _lead['lead_source']?.toString() ?? 'N/A'),
                            _infoRow(
                                Icons.event_outlined,
                                'Follow-up',
                                widget.formatDate(
                                    _lead['next_follow_up_date']?.toString())),
                            _infoRow(
                                Icons.place_outlined,
                                'Site Visit',
                                widget.formatDate(
                                    _lead['site_visit_date']?.toString())),
                            _infoRow(Icons.notes_rounded, 'Remark',
                                _lead['remark']?.toString() ?? '—'),
                          ]),
                          const SizedBox(height: 14),
                          _sectionCard(
                              'FOLLOW-UPS (${_followups.length})',
                              _followups.isEmpty
                                  ? [
                                      const Padding(
                                        padding:
                                            EdgeInsets.symmetric(vertical: 12),
                                        child: Text('No follow-ups yet.',
                                            style: TextStyle(
                                                fontSize: 12.5,
                                                color: _textMuted)),
                                      )
                                    ]
                                  : _followups
                                      .map((f) => _followupItem(f))
                                      .toList()),
                          const SizedBox(height: 14),
                          _sectionCard(
                              'ACTIVITY LOG (${_logs.length})',
                              _logs.isEmpty
                                  ? [
                                      const Padding(
                                        padding:
                                            EdgeInsets.symmetric(vertical: 12),
                                        child: Text('No activity recorded yet.',
                                            style: TextStyle(
                                                fontSize: 12.5,
                                                color: _textMuted)),
                                      )
                                    ]
                                  : _logs
                                      .take(10)
                                      .map((l) => _logItem(l))
                                      .toList()),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionCard(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
          color: _card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: const BoxDecoration(
              color: _bg,
              border: Border(bottom: BorderSide(color: _border)),
            ),
            child: Row(
              children: [
                Container(
                    width: 3,
                    height: 14,
                    decoration: BoxDecoration(
                        color: _primary,
                        borderRadius: BorderRadius.circular(2))),
                const SizedBox(width: 8),
                Text(title,
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: _primaryDark,
                        letterSpacing: 0.4)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: children),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value,
      {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
                color: _primarySoft, borderRadius: BorderRadius.circular(8)),
            alignment: Alignment.center,
            child: Icon(icon, size: 15, color: _primary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label.toUpperCase(),
                    style: const TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w600,
                        color: _textMuted)),
                Text(value.isEmpty ? '—' : value,
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: valueColor ?? _textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _followupItem(dynamic f) {
    final note = f['note']?.toString() ?? '';
    final type = f['followup_type']?.toString() ?? 'Note';
    final date =
        widget.formatDate((f['follow_up_date'] ?? f['created_at'])?.toString());
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 26,
            height: 26,
            decoration:
                BoxDecoration(color: _primarySoft, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(type.isNotEmpty ? type[0] : 'F',
                style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: _primary)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(note,
                    style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: _textPrimary)),
                Text('$type · $date',
                    style: const TextStyle(fontSize: 10.5, color: _textMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _logItem(dynamic log) {
    final actionType = log['action_type']?.toString() ?? 'Update';
    final remark = log['remark']?.toString();
    final oldVal = log['old_value']?.toString();
    final newVal = log['new_value']?.toString();
    final date =
        widget.formatDate((log['created_at'] ?? log['updated_at'])?.toString());
    final by = log['performed_by_name']?.toString();

    final text = (remark != null && remark.isNotEmpty)
        ? remark
        : (oldVal != null && newVal != null
            ? '$actionType — $oldVal → $newVal'
            : actionType);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
            color: _bg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: _border)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(text,
                style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: _textPrimary)),
            const SizedBox(height: 3),
            Text([if (by != null) by, date].join(' · '),
                style: const TextStyle(fontSize: 10.5, color: _textMuted)),
          ],
        ),
      ),
    );
  }
}
