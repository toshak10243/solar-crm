import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/indian_states_cities.dart';
import '../../data/manager_lead_service.dart';
import 'manager_lead_detail_modal.dart';

class ManagerLeadsScreen extends StatefulWidget {
  const ManagerLeadsScreen({Key? key}) : super(key: key);

  @override
  State<ManagerLeadsScreen> createState() => _ManagerLeadsScreenState();
}

class _ManagerLeadsScreenState extends State<ManagerLeadsScreen> {
  final ManagerLeadService _service = ManagerLeadService();

  List<dynamic> _leads = [];
  List<dynamic> _teamMembers = [];
  bool _isLoading = true;
  String? _errorMessage;

  // Filters
  final TextEditingController _searchController = TextEditingController();
  String _statusFilter = 'ALL';
  String _priorityFilter = 'ALL';
  String _sourceFilter = 'ALL';
  String _assignedFilter = 'ALL';

  // Form State
  dynamic _editingLeadId;
  final _customerNameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _altMobileCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();
  final _requiredKwCtrl = TextEditingController();
  final _quotationCtrl = TextEditingController();
  final _remarkCtrl = TextEditingController();

  String? _selectedState;
  String? _selectedCity;
  String _selectedSolarReq = 'Residential';
  String _selectedInterest = 'Pending';
  String _selectedSource = 'Website';
  String _selectedPriority = 'Medium';
  String _selectedStatus = 'New Lead';
  dynamic _selectedAssignTo;

  DateTime? _selectedNextFollowupDate;
  DateTime? _selectedSiteVisitDate;

  bool _duplicateWarning = false;
  Map<String, dynamic>? _duplicateLeadData;
  bool _isSavingLead = false;

  // Reassign State
  dynamic _reassignLeadId;
  String? _reassignLeadName;
  dynamic _newAssigneeId;
  bool _isReassigning = false;

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

  final List<String> _interestOptions = [
    'Pending',
    'Interested',
    'Not Interested'
  ];
  final List<String> _solarRequirementOptions = ['Residential', 'Commercial'];
  final List<String> _leadSourceOptions = [
    'Website',
    'Call',
    'Reference',
    'Facebook',
    'Google',
    'Other'
  ];
  final List<String> _priorityOptions = ['Low', 'Medium', 'High'];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _customerNameCtrl.dispose();
    _mobileCtrl.dispose();
    _altMobileCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _pincodeCtrl.dispose();
    _requiredKwCtrl.dispose();
    _quotationCtrl.dispose();
    _remarkCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await _service.fetchLeadsAndTeam();

    if (mounted) {
      if (res['success'] == true) {
        setState(() {
          _leads = res['leads'] as List;
          _teamMembers = res['teamMembers'] as List;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage =
              res['message']?.toString() ?? 'Failed to fetch team leads';
          _isLoading = false;
        });
      }
    }
  }

  List<dynamic> get _processedLeads {
    final query = _searchController.text.trim().toLowerCase();

    return _leads.where((l) {
      final matchesSearch = (l['customer_name']
                  ?.toString()
                  .toLowerCase()
                  .contains(query) ??
              false) ||
          (l['lead_code']?.toString().toLowerCase().contains(query) ?? false) ||
          (l['mobile_number']?.toString().contains(query) ?? false) ||
          (l['city']?.toString().toLowerCase().contains(query) ?? false);

      final matchesStatus =
          _statusFilter == 'ALL' || l['status']?.toString() == _statusFilter;
      final matchesPriority = _priorityFilter == 'ALL' ||
          l['priority']?.toString() == _priorityFilter;
      final matchesSource = _sourceFilter == 'ALL' ||
          l['lead_source']?.toString() == _sourceFilter;
      final matchesAssigned = _assignedFilter == 'ALL' ||
          l['assigned_to']?.toString() == _assignedFilter;

      return matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesSource &&
          matchesAssigned;
    }).toList();
  }

  void _makePhoneCall(String? mobile) async {
    if (mobile == null || mobile.trim().isEmpty) return;
    final Uri url = Uri.parse('tel:${mobile.trim()}');
    try {
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      } else {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  void _openWhatsApp(String? mobile) async {
    if (mobile == null || mobile.trim().isEmpty) return;
    final clean = mobile.replaceAll(RegExp(r'\D'), '');
    final formatted = clean.length == 10 ? '91$clean' : clean;
    final Uri appUri = Uri.parse('whatsapp://send?phone=$formatted');
    final Uri webUri = Uri.parse('https://wa.me/$formatted');

    try {
      if (await canLaunchUrl(appUri)) {
        await launchUrl(appUri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  void _checkDuplicateMobile(String val) {
    if (_editingLeadId != null || val.length < 10) {
      setState(() {
        _duplicateWarning = false;
        _duplicateLeadData = null;
      });
      return;
    }

    final match = _leads.firstWhere(
      (l) => l['mobile_number']?.toString().trim() == val.trim(),
      orElse: () => null,
    );

    if (match != null) {
      setState(() {
        _duplicateWarning = true;
        _duplicateLeadData = match;
      });
    } else {
      setState(() {
        _duplicateWarning = false;
        _duplicateLeadData = null;
      });
    }
  }

  // ---- Validation (mirrors the React web version) ----
  String? _validateBeforeSave() {
    if (_customerNameCtrl.text.trim().isEmpty) {
      return 'Customer Name is required!';
    }
    final mobile = _mobileCtrl.text.trim();
    if (mobile.isEmpty) {
      return 'Mobile Number is required!';
    }
    if (!RegExp(r'^\d{10}$').hasMatch(mobile)) {
      return 'Enter a valid 10-digit mobile number!';
    }
    if (_emailCtrl.text.trim().isNotEmpty &&
        !RegExp(r'^\S+@\S+\.\S+$').hasMatch(_emailCtrl.text.trim())) {
      return 'Enter a valid email address!';
    }
    if (_selectedInterest == 'Interested') {
      final kw = double.tryParse(_requiredKwCtrl.text.trim());
      if (kw == null || kw <= 0) {
        return 'Required kW is mandatory when Interest Status is Interested';
      }
    }
    if (_selectedInterest == 'Not Interested' &&
        _remarkCtrl.text.trim().isEmpty) {
      return 'Remark is mandatory when Interest Status is Not Interested';
    }
    return null;
  }

  void _openFormDialog({Map<String, dynamic>? lead}) {
    if (lead != null) {
      _editingLeadId = lead['id'];
      _customerNameCtrl.text = lead['customer_name']?.toString() ?? '';
      _mobileCtrl.text = lead['mobile_number']?.toString() ?? '';
      _altMobileCtrl.text = lead['alternate_number']?.toString() ?? '';
      _emailCtrl.text = lead['email']?.toString() ?? '';
      _addressCtrl.text = lead['address']?.toString() ?? '';
      _pincodeCtrl.text = lead['pincode']?.toString() ?? '';
      _requiredKwCtrl.text = lead['required_kw']?.toString() ?? '';
      _quotationCtrl.text = lead['quotation_amount']?.toString() ?? '';
      _remarkCtrl.text = lead['remark']?.toString() ?? '';

      final rawState = lead['state']?.toString();
      _selectedState =
          IndianStatesCities.states.contains(rawState) ? rawState : 'Rajasthan';

      final availableCities = IndianStatesCities.getCities(_selectedState);
      final rawCity = lead['city']?.toString();
      _selectedCity = availableCities.contains(rawCity)
          ? rawCity
          : (availableCities.isNotEmpty ? availableCities.first : null);

      _selectedSolarReq =
          lead['solar_requirement']?.toString() ?? 'Residential';
      _selectedInterest = lead['interest_status']?.toString() ?? 'Pending';
      _selectedSource = lead['lead_source']?.toString() ?? 'Website';
      _selectedPriority = lead['priority']?.toString() ?? 'Medium';
      _selectedStatus = lead['status']?.toString() ?? 'New Lead';
      _selectedAssignTo = lead['assigned_to']?.toString();

      _selectedNextFollowupDate =
          DateTime.tryParse(lead['next_follow_up_date']?.toString() ?? '');
      _selectedSiteVisitDate =
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
      _quotationCtrl.clear();
      _remarkCtrl.clear();

      _selectedState = 'Rajasthan';
      final cities = IndianStatesCities.getCities('Rajasthan');
      _selectedCity = cities.isNotEmpty ? cities.first : 'Jaipur';

      _selectedSolarReq = 'Residential';
      _selectedInterest = 'Pending';
      _selectedSource = 'Website';
      _selectedPriority = 'Medium';
      _selectedStatus = 'New Lead';
      _selectedAssignTo = null;
      _selectedNextFollowupDate = null;
      _selectedSiteVisitDate = null;
    }

    _duplicateWarning = false;
    _duplicateLeadData = null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) {
          final citiesList = IndianStatesCities.getCities(_selectedState);

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
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 12),
                    decoration:
                        const BoxDecoration(color: AppColors.primaryDark),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _editingLeadId == null
                              ? 'Add New Lead'
                              : 'Edit Lead Details',
                          style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                              color: Colors.white),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded,
                              color: Colors.white, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_duplicateWarning &&
                              _duplicateLeadData != null) ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                  color: AppColors.warningSoft,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: AppColors.warning)),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.warning_amber_rounded,
                                          size: 16, color: AppColors.warning),
                                      SizedBox(width: 6),
                                      Text('Duplicate Mobile Detected',
                                          style: TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 12,
                                              color: AppColors.warning)),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                      'Linked to ${_duplicateLeadData!['lead_code']} (${_duplicateLeadData!['customer_name']}) • Status: ${_duplicateLeadData!['status']}',
                                      style: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textPrimary)),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'You can still proceed — this could be a genuine case (e.g. husband & wife sharing a number).',
                                    style: TextStyle(
                                        fontSize: 10.5,
                                        fontStyle: FontStyle.italic,
                                        color: Color(0xFFA16207)),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                          ],

                          // 1. CONTACT INFO
                          const Text('1. CONTACT INFORMATION',
                              style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primaryDark,
                                  letterSpacing: 0.5)),
                          const SizedBox(height: 8),
                          _buildCompactTextField(
                              _customerNameCtrl, 'CUSTOMER NAME *'),
                          const SizedBox(height: 8),
                          _buildCompactTextField(
                              _mobileCtrl, '10-DIGIT MOBILE NUMBER *',
                              isPhone: true, onChanged: (val) {
                            _checkDuplicateMobile(val);
                            setSheetState(() {});
                          }),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                  child: _buildCompactTextField(
                                      _altMobileCtrl, 'ALT MOBILE',
                                      isPhone: true)),
                              const SizedBox(width: 8),
                              Expanded(
                                  child: _buildCompactTextField(
                                      _emailCtrl, 'EMAIL ADDRESS')),
                            ],
                          ),

                          const SizedBox(height: 16),

                          // 2. LOCATION & ADDRESS
                          const Text('2. LOCATION & ADDRESS',
                              style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primaryDark,
                                  letterSpacing: 0.5)),
                          const SizedBox(height: 8),
                          _buildCompactTextField(_addressCtrl, 'FULL ADDRESS'),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: _buildDropdownField<String>(
                                  label: 'STATE',
                                  value: _selectedState,
                                  items: IndianStatesCities.states,
                                  onChanged: (val) {
                                    setSheetState(() {
                                      _selectedState = val;
                                      final newCities =
                                          IndianStatesCities.getCities(val);
                                      _selectedCity = newCities.isNotEmpty
                                          ? newCities.first
                                          : null;
                                    });
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildDropdownField<String>(
                                  label: 'CITY',
                                  value: citiesList.contains(_selectedCity)
                                      ? _selectedCity
                                      : (citiesList.isNotEmpty
                                          ? citiesList.first
                                          : null),
                                  items: citiesList,
                                  onChanged: (val) =>
                                      setSheetState(() => _selectedCity = val),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          _buildCompactTextField(_pincodeCtrl, 'PINCODE',
                              isPhone: true),

                          const SizedBox(height: 16),

                          // 3. SOLAR REQUIREMENT
                          const Text('3. SOLAR REQUIREMENT & PIPELINE',
                              style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primaryDark,
                                  letterSpacing: 0.5)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: _buildDropdownField<String>(
                                  label: 'REQUIREMENT',
                                  value: _selectedSolarReq,
                                  items: _solarRequirementOptions,
                                  onChanged: (val) => setSheetState(
                                      () => _selectedSolarReq = val!),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildDropdownField<String>(
                                  label: 'INTEREST STATUS',
                                  value: _selectedInterest,
                                  items: _interestOptions,
                                  onChanged: (val) => setSheetState(
                                      () => _selectedInterest = val!),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: _buildCompactTextField(
                                  _requiredKwCtrl,
                                  _selectedInterest == 'Interested'
                                      ? 'REQUIRED KW *'
                                      : 'REQUIRED KW',
                                  isPhone: true,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                  child: _buildCompactTextField(
                                      _quotationCtrl, 'QUOTATION AMOUNT (₹)',
                                      isPhone: true)),
                            ],
                          ),

                          const SizedBox(height: 16),

                          // 4. SOURCE, STATUS & DATES
                          const Text('4. SOURCE, STATUS & DATES',
                              style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primaryDark,
                                  letterSpacing: 0.5)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: _buildDropdownField<String>(
                                  label: 'LEAD SOURCE',
                                  value: _selectedSource,
                                  items: _leadSourceOptions,
                                  onChanged: (val) => setSheetState(
                                      () => _selectedSource = val!),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildDropdownField<String>(
                                  label: 'PRIORITY',
                                  value: _selectedPriority,
                                  items: _priorityOptions,
                                  onChanged: (val) => setSheetState(
                                      () => _selectedPriority = val!),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: _buildDropdownField<String>(
                                  label: 'STATUS',
                                  value:
                                      _statusOptions.contains(_selectedStatus)
                                          ? _selectedStatus
                                          : _statusOptions[0],
                                  items: _statusOptions,
                                  onChanged: (val) => setSheetState(
                                      () => _selectedStatus = val!),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  value: _selectedAssignTo?.toString(),
                                  isDense: true,
                                  isExpanded: true,
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.w600),
                                  decoration: const InputDecoration(
                                      labelText: 'ASSIGN TO',
                                      contentPadding: EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 8),
                                      filled: true,
                                      fillColor: AppColors.bg),
                                  items: [
                                    const DropdownMenuItem<String>(
                                        value: null,
                                        child: Text('Unassigned',
                                            style: TextStyle(fontSize: 12))),
                                    ..._teamMembers
                                        .map<DropdownMenuItem<String>>((m) {
                                      return DropdownMenuItem<String>(
                                        value: m['id']?.toString(),
                                        child: Text(
                                            m['full_name']?.toString() ?? 'Rep',
                                            style:
                                                const TextStyle(fontSize: 12),
                                            overflow: TextOverflow.ellipsis),
                                      );
                                    }).toList(),
                                  ],
                                  onChanged: (val) => setSheetState(
                                      () => _selectedAssignTo = val),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          Row(
                            children: [
                              Expanded(
                                child: InkWell(
                                  onTap: () async {
                                    final d = await showDatePicker(
                                        context: context,
                                        initialDate:
                                            _selectedNextFollowupDate ??
                                                DateTime.now().add(
                                                    const Duration(days: 1)),
                                        firstDate: DateTime.now().subtract(
                                            const Duration(days: 365)),
                                        lastDate: DateTime.now()
                                            .add(const Duration(days: 365)));
                                    if (d != null)
                                      setSheetState(
                                          () => _selectedNextFollowupDate = d);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 10),
                                    decoration: BoxDecoration(
                                        color: AppColors.bg,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                            color: AppColors.border)),
                                    child: Text(
                                        _selectedNextFollowupDate == null
                                            ? 'Next Followup Date'
                                            : 'Followup: ${_selectedNextFollowupDate.toString().split(' ')[0]}',
                                        style: const TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w600),
                                        overflow: TextOverflow.ellipsis),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: InkWell(
                                  onTap: () async {
                                    final d = await showDatePicker(
                                        context: context,
                                        initialDate: _selectedSiteVisitDate ??
                                            DateTime.now()
                                                .add(const Duration(days: 2)),
                                        firstDate: DateTime.now().subtract(
                                            const Duration(days: 365)),
                                        lastDate: DateTime.now()
                                            .add(const Duration(days: 365)));
                                    if (d != null)
                                      setSheetState(
                                          () => _selectedSiteVisitDate = d);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 10),
                                    decoration: BoxDecoration(
                                        color: AppColors.bg,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                            color: AppColors.border)),
                                    child: Text(
                                        _selectedSiteVisitDate == null
                                            ? 'Site Visit Date'
                                            : 'Visit: ${_selectedSiteVisitDate.toString().split(' ')[0]}',
                                        style: const TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w600),
                                        overflow: TextOverflow.ellipsis),
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 8),
                          _buildCompactTextField(
                            _remarkCtrl,
                            _selectedInterest == 'Not Interested'
                                ? 'INITIAL REMARK / NOTES *'
                                : 'INITIAL REMARK / NOTES',
                            maxLines: 2,
                          ),

                          const SizedBox(height: 20),

                          SizedBox(
                            width: double.infinity,
                            height: 44,
                            child: ElevatedButton(
                              onPressed: _isSavingLead
                                  ? null
                                  : () async {
                                      final validationError =
                                          _validateBeforeSave();
                                      if (validationError != null) {
                                        _showNotification(validationError,
                                            isError: true);
                                        return;
                                      }

                                      setSheetState(() => _isSavingLead = true);

                                      final payload = {
                                        'customer_name':
                                            _customerNameCtrl.text.trim(),
                                        'mobile_number':
                                            _mobileCtrl.text.trim(),
                                        'alternate_number':
                                            _altMobileCtrl.text.trim(),
                                        'email': _emailCtrl.text.trim(),
                                        'address': _addressCtrl.text.trim(),
                                        'city': _selectedCity,
                                        'state': _selectedState,
                                        'pincode': _pincodeCtrl.text.trim(),
                                        'solar_requirement': _selectedSolarReq,
                                        'interest_status': _selectedInterest,
                                        'required_kw':
                                            _requiredKwCtrl.text.trim(),
                                        'remark': _remarkCtrl.text.trim(),
                                        'lead_source': _selectedSource,
                                        'priority': _selectedPriority,
                                        'status': _selectedStatus,
                                        'assigned_to': _selectedAssignTo,
                                        'next_follow_up_date':
                                            _selectedNextFollowupDate
                                                ?.toIso8601String()
                                                .split('T')[0],
                                        'site_visit_date':
                                            _selectedSiteVisitDate
                                                ?.toIso8601String()
                                                .split('T')[0],
                                        'quotation_amount':
                                            _quotationCtrl.text.trim(),
                                      };

                                      Map<String, dynamic> res;
                                      if (_editingLeadId != null) {
                                        res = await _service.updateLead(
                                            _editingLeadId, payload);
                                      } else {
                                        res =
                                            await _service.createLead(payload);
                                      }

                                      setSheetState(
                                          () => _isSavingLead = false);

                                      if (mounted) {
                                        Navigator.pop(ctx);
                                        _showNotification(
                                            res['message']?.toString() ??
                                                'Action completed!',
                                            isError: res['success'] != true);
                                        _fetchData();
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  elevation: 0),
                              child: _isSavingLead
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                          color: Colors.white, strokeWidth: 2))
                                  : Text(
                                      _editingLeadId == null
                                          ? 'Create Lead'
                                          : 'Update Lead',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 13.5)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCompactTextField(TextEditingController ctrl, String label,
      {bool isPhone = false, Function(String)? onChanged, int maxLines = 1}) {
    return TextField(
      controller: ctrl,
      keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
      maxLines: maxLines,
      onChanged: onChanged,
      style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary),
      decoration: InputDecoration(
        labelText: label,
        labelStyle:
            const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        filled: true,
        fillColor: AppColors.bg,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.border)),
      ),
    );
  }

  Widget _buildDropdownField<T>(
      {required String label,
      required T? value,
      required List<T> items,
      required Function(T?) onChanged}) {
    return DropdownButtonFormField<T>(
      value: items.contains(value)
          ? value
          : (items.isNotEmpty ? items.first : null),
      isDense: true,
      isExpanded: true,
      style: const TextStyle(
          fontSize: 12,
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        labelText: label,
        labelStyle:
            const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        filled: true,
        fillColor: AppColors.bg,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.border)),
      ),
      items: items.map<DropdownMenuItem<T>>((item) {
        return DropdownMenuItem<T>(
          value: item,
          child: Text(item.toString(),
              style: const TextStyle(fontSize: 12),
              overflow: TextOverflow.ellipsis),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }

  void _showReassignSheet(
      dynamic leadId, String leadName, dynamic currentAssignee) {
    _reassignLeadId = leadId;
    _reassignLeadName = leadName;
    _newAssigneeId = currentAssignee?.toString();

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => Container(
          padding: const EdgeInsets.all(20),
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
                          borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 16),
              const Text('Reassign Lead',
                  style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                      color: AppColors.primaryDark)),
              const SizedBox(height: 4),
              Text(
                  'Reassigning "$_reassignLeadName" to another sales representative.',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _newAssigneeId?.toString(),
                isExpanded: true,
                decoration: const InputDecoration(
                    labelText: 'Select Sales Representative',
                    filled: true,
                    fillColor: AppColors.bg),
                items: _teamMembers.map<DropdownMenuItem<String>>((m) {
                  return DropdownMenuItem<String>(
                    value: m['id']?.toString(),
                    child: Text(m['full_name']?.toString() ?? 'Rep',
                        overflow: TextOverflow.ellipsis),
                  );
                }).toList(),
                onChanged: (val) => setSheetState(() => _newAssigneeId = val),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: ElevatedButton(
                  onPressed: (_isReassigning || _newAssigneeId == null)
                      ? null
                      : () async {
                          setSheetState(() => _isReassigning = true);
                          final res = await _service.assignLead(
                              _reassignLeadId, _newAssigneeId);
                          setSheetState(() => _isReassigning = false);
                          if (mounted) {
                            Navigator.pop(ctx);
                            _showNotification(
                                res['message']?.toString() ?? 'Reassigned!');
                            _fetchData();
                          }
                        },
                  style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0),
                  child: _isReassigning
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Confirm Reassign',
                          style: TextStyle(fontWeight: FontWeight.w800)),
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
    if (parts.isEmpty || parts[0].isEmpty) return 'L';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final list = _processedLeads;

    final total = _leads.length;
    final newLeads =
        _leads.where((l) => l['status']?.toString() == 'New Lead').length;
    final won = _leads.where((l) => l['status']?.toString() == 'Won').length;
    final followups = _leads
        .where((l) =>
            l['next_follow_up_date'] != null &&
            !['Won', 'Lost', 'Not Interested']
                .contains(l['status']?.toString()))
        .length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Team Lead Management',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Manager Control Center',
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
              onPressed: _fetchData,
              tooltip: 'Refresh'),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openFormDialog(),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Add Lead',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
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
                              'Team pipeline',
                              AppColors.primary,
                              AppColors.primarySoft),
                          _buildKpiCard(
                              'NEW LEADS',
                              '$newLeads',
                              'Fresh entries',
                              AppColors.primaryDark,
                              AppColors.primarySoft),
                          _buildKpiCard(
                              'FOLLOW-UPS',
                              '$followups',
                              'Scheduled calls',
                              AppColors.warning,
                              AppColors.warningSoft),
                          _buildKpiCard(
                              'WON DEALS',
                              '$won',
                              'Successfully closed',
                              AppColors.success,
                              AppColors.successSoft),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 2. FILTERS BAR
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
                                    'Search customer name, code, mobile, city...',
                                hintStyle: const TextStyle(
                                    fontSize: 12.5, color: AppColors.textMuted),
                                prefixIcon: const Icon(Icons.search_rounded,
                                    size: 20, color: AppColors.textSecondary),
                                suffixIcon: _searchController.text.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.clear_rounded,
                                            size: 18),
                                        onPressed: () => setState(
                                            () => _searchController.clear()))
                                    : null,
                                filled: true,
                                fillColor: AppColors.bg,
                                contentPadding:
                                    const EdgeInsets.symmetric(vertical: 10),
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
                                        contentPadding: EdgeInsets.symmetric(
                                            horizontal: 10, vertical: 8),
                                        filled: true,
                                        fillColor: AppColors.bg),
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w700),
                                    items: [
                                      const DropdownMenuItem(
                                          value: 'ALL',
                                          child: Text('All Statuses')),
                                      ..._statusOptions.map((s) =>
                                          DropdownMenuItem(
                                              value: s,
                                              child: Text(
                                                  s,
                                                  overflow:
                                                      TextOverflow.ellipsis))),
                                    ],
                                    onChanged: (val) =>
                                        setState(() => _statusFilter = val!),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _assignedFilter,
                                    isExpanded: true,
                                    decoration: const InputDecoration(
                                        contentPadding: EdgeInsets.symmetric(
                                            horizontal: 10, vertical: 8),
                                        filled: true,
                                        fillColor: AppColors.bg),
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w700),
                                    items: [
                                      const DropdownMenuItem<String>(
                                          value: 'ALL',
                                          child: Text('Everyone')),
                                      ..._teamMembers
                                          .map<DropdownMenuItem<String>>((m) {
                                        return DropdownMenuItem<String>(
                                          value: m['id']?.toString() ?? '',
                                          child: Text(
                                              m['full_name']?.toString() ??
                                                  'Rep',
                                              overflow: TextOverflow.ellipsis),
                                        );
                                      }).toList(),
                                    ],
                                    onChanged: (val) =>
                                        setState(() => _assignedFilter = val!),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 3. LEADS LIST
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
                              Icon(Icons.inbox_outlined,
                                  size: 40, color: AppColors.textMuted),
                              SizedBox(height: 10),
                              Text('No Leads Found',
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
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: list.length,
                          itemBuilder: (context, index) {
                            final lead = list[index];
                            final name =
                                lead['customer_name']?.toString() ?? 'Customer';
                            final code =
                                lead['lead_code']?.toString() ?? 'LD000';
                            final mobile =
                                lead['mobile_number']?.toString() ?? '';
                            final city = lead['city']?.toString() ?? '—';
                            final status =
                                lead['status']?.toString() ?? 'New Lead';
                            final assignedName =
                                lead['assigned_to_name']?.toString() ??
                                    'Unassigned';

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
                                              child: Text(_getInitials(name),
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
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(name,
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      style: const TextStyle(
                                                          fontWeight:
                                                              FontWeight.w800,
                                                          fontSize: 14.5,
                                                          color: AppColors
                                                              .textPrimary)),
                                                  Text('$code • $city',
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      style: const TextStyle(
                                                          fontSize: 11,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          color: AppColors
                                                              .primary)),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                            color: AppColors.primarySoft,
                                            borderRadius:
                                                BorderRadius.circular(6)),
                                        child: Text(status,
                                            style: const TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                color: AppColors.primary)),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      const Icon(Icons.phone_outlined,
                                          size: 14,
                                          color: AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Text(mobile,
                                          style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: AppColors.textPrimary)),
                                      const SizedBox(width: 12),
                                      const Icon(Icons.person_outline_rounded,
                                          size: 14,
                                          color: AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Expanded(
                                          child: Text('Rep: $assignedName',
                                              style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: AppColors.textPrimary),
                                              overflow: TextOverflow.ellipsis)),
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
                                            onPressed: () {
                                              showModalBottomSheet(
                                                context: context,
                                                isScrollControlled: true,
                                                backgroundColor:
                                                    Colors.transparent,
                                                builder: (ctx) =>
                                                    ManagerLeadDetailModal(
                                                        lead: lead,
                                                        onUpdate: _fetchData),
                                              );
                                            },
                                            tooltip: 'View Details',
                                          ),
                                          IconButton(
                                            icon: const Icon(
                                                Icons.edit_outlined,
                                                size: 18,
                                                color: AppColors.primary),
                                            onPressed: () =>
                                                _openFormDialog(lead: lead),
                                            tooltip: 'Edit Lead',
                                          ),
                                          IconButton(
                                            icon: const Icon(
                                                Icons.person_add_alt_1_outlined,
                                                size: 18,
                                                color: AppColors.purple),
                                            onPressed: () => _showReassignSheet(
                                                lead['id'],
                                                name,
                                                lead['assigned_to']),
                                            tooltip: 'Reassign',
                                          ),
                                        ],
                                      ),
                                      Row(
                                        children: [
                                          IconButton(
                                              icon: const Icon(
                                                  Icons.phone_in_talk_rounded,
                                                  size: 18,
                                                  color: AppColors.primary),
                                              onPressed: () =>
                                                  _makePhoneCall(mobile)),
                                          IconButton(
                                              icon: const Icon(
                                                  Icons.chat_rounded,
                                                  size: 18,
                                                  color: Color(0xFF128C7E)),
                                              onPressed: () =>
                                                  _openWhatsApp(mobile)),
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
    );
  }

  Widget _buildKpiCard(
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
