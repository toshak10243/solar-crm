import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../data/user_management_service.dart';

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<UserManagementScreen> createState() =>
      _UserManagementScreenState();
}

class _UserManagementScreenState extends ConsumerState<UserManagementScreen> {
  final UserManagementService _service = UserManagementService();

  List<dynamic> _usersList = [];
  List<dynamic> _managersList = [];
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _errorMessage;
  bool _hasLoadedOnce = false;

  // Filters & Search
  final TextEditingController _searchController = TextEditingController();
  dynamic _roleFilter = 'ALL';
  String _statusFilter = 'ALL';
  Timer? _searchDebounce;

  // Form State for Add / Edit
  dynamic _editingUserId;
  final _fullNameCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();

  String? _fullNameError;
  String? _usernameError;
  String? _emailError;
  String? _phoneError;
  String? _passwordError;
  String? _confirmPasswordError;
  String? _managerError;

  int _selectedRoleId = 3; // 1 = Super Admin, 2 = Manager, 3 = Sales Rep
  dynamic _selectedManagerId;
  bool _isSavingUser = false;
  bool _showPassword = false;
  bool _formIsDirty = false;

  bool _isLoadingDetails = false;

  dynamic _deletingUserId;
  String? _deletingUserName;
  bool _isDeleting = false;

  final Set<String> _statusUpdatingIds = {};

  static final RegExp _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
  static final RegExp _phoneRegex = RegExp(r'^[0-9]{10}$');
  static final RegExp _strongPasswordRegex = RegExp(
      r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:",.<>\/]).{8,}$');

  // ----- Theme accents used ONLY inside this screen (no bright yellow) -----
  static const Color _accentAmber = Color(0xFFB45309); // deep amber/brown
  static const Color _accentAmberSoft = Color(0xFFFDF1DF);

  @override
  void initState() {
    super.initState();
    _fetchUsers();
    _fetchManagers();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _fullNameCtrl.dispose();
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchUsers() async {
    setState(() {
      if (!_hasLoadedOnce) {
        _isLoading = true;
      } else {
        _isRefreshing = true;
      }
      _errorMessage = null;
    });

    final res = await _service.getUsers(
      search: _searchController.text.trim(),
      role: _roleFilter == 'ALL' ? null : _roleFilter,
      status: _statusFilter == 'ALL' ? null : _statusFilter,
      limit: 100,
    );

    if (mounted) {
      if (res['success'] == true) {
        setState(() {
          _usersList = res['users'] as List;
          _isLoading = false;
          _isRefreshing = false;
          _hasLoadedOnce = true;
        });
      } else {
        setState(() {
          _errorMessage =
              res['message']?.toString() ?? 'Failed to load users list';
          _isLoading = false;
          _isRefreshing = false;
          _hasLoadedOnce = true;
        });
      }
    }
  }

  void _onSearchChanged(String _) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      if (mounted) _fetchUsers();
    });
    setState(() {});
  }

  Future<void> _fetchManagers() async {
    final list = await _service.getManagers();
    if (mounted) {
      setState(() => _managersList = list);
    }
  }

  void _clearFormErrors() {
    _fullNameError = null;
    _usernameError = null;
    _emailError = null;
    _phoneError = null;
    _passwordError = null;
    _confirmPasswordError = null;
    _managerError = null;
  }

  bool _validateForm() {
    bool isValid = true;
    _clearFormErrors();

    if (_fullNameCtrl.text.trim().isEmpty) {
      _fullNameError = 'Full name is required';
      isValid = false;
    } else if (_fullNameCtrl.text.trim().length < 3) {
      _fullNameError = 'Enter at least 3 characters';
      isValid = false;
    }

    if (_usernameCtrl.text.trim().isEmpty) {
      _usernameError = 'Username is required';
      isValid = false;
    } else if (_usernameCtrl.text.trim().length < 4) {
      _usernameError = 'Username must be at least 4 characters';
      isValid = false;
    }

    if (_emailCtrl.text.trim().isEmpty) {
      _emailError = 'Email is required';
      isValid = false;
    } else if (!_emailRegex.hasMatch(_emailCtrl.text.trim())) {
      _emailError = 'Enter a valid email address';
      isValid = false;
    }

    if (_phoneCtrl.text.trim().isEmpty) {
      _phoneError = 'Phone number is required';
      isValid = false;
    } else if (!_phoneRegex.hasMatch(_phoneCtrl.text.trim())) {
      _phoneError = 'Enter a valid 10-digit phone number';
      isValid = false;
    }

    if (_selectedRoleId == 3 && _selectedManagerId == null) {
      _managerError = 'Assigning a manager is mandatory for Sales Users';
      isValid = false;
    }

    if (_editingUserId == null) {
      if (_passwordCtrl.text.isEmpty) {
        _passwordError = 'Password is required';
        isValid = false;
      } else if (!_strongPasswordRegex.hasMatch(_passwordCtrl.text)) {
        _passwordError = 'Min 8 chars incl. upper, lower, number & symbol';
        isValid = false;
      }

      if (_confirmPasswordCtrl.text.isEmpty) {
        _confirmPasswordError = 'Please confirm the password';
        isValid = false;
      } else if (_passwordCtrl.text != _confirmPasswordCtrl.text) {
        _confirmPasswordError = 'Passwords do not match';
        isValid = false;
      }
    }

    return isValid;
  }

  Future<bool> _confirmDiscardIfDirty(BuildContext ctx) async {
    if (!_formIsDirty) return true;
    final confirmed = await showDialog<bool>(
      context: ctx,
      builder: (dCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
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
              child: const Icon(Icons.info_outline_rounded,
                  color: AppColors.danger, size: 20),
            ),
            const SizedBox(width: 10),
            const Text('Discard changes?',
                style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: AppColors.primaryDark)),
          ],
        ),
        content: const Text(
          'You have unsaved changes. Are you sure you want to close this form without saving?',
          style: TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dCtx, false),
              child: const Text('Keep Editing')),
          ElevatedButton(
            onPressed: () => Navigator.pop(dCtx, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10))),
            child: const Text('Discard',
                style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
    return confirmed ?? false;
  }

  void _openUserFormModal({Map<String, dynamic>? user}) {
    _formIsDirty = false;
    _clearFormErrors();

    if (user != null) {
      _editingUserId = user['id'];
      _fullNameCtrl.text = user['full_name']?.toString() ?? '';
      _usernameCtrl.text = user['username']?.toString() ?? '';
      _emailCtrl.text = user['email']?.toString() ?? '';
      _phoneCtrl.text = user['phone']?.toString() ?? '';
      _passwordCtrl.clear();
      _confirmPasswordCtrl.clear();

      _selectedRoleId = int.tryParse(user['role_id']?.toString() ?? '3') ?? 3;
      _selectedManagerId = user['manager_id']?.toString();
    } else {
      _editingUserId = null;
      _fullNameCtrl.clear();
      _usernameCtrl.clear();
      _emailCtrl.clear();
      _phoneCtrl.clear();
      _passwordCtrl.clear();
      _confirmPasswordCtrl.clear();

      _selectedRoleId = 3;
      _selectedManagerId = null;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: false,
      builder: (ctx) => PopScope(
        canPop: false,
        onPopInvoked: (didPop) async {
          if (didPop) return;
          final canClose = await _confirmDiscardIfDirty(ctx);
          if (canClose && ctx.mounted) Navigator.pop(ctx);
        },
        child: StatefulBuilder(
          builder: (context, setSheetState) {
            void markDirty() {
              if (!_formIsDirty) setSheetState(() => _formIsDirty = true);
            }

            InputDecoration _fieldDecoration(String label, String? error) {
              return InputDecoration(
                labelText: label,
                filled: true,
                fillColor: AppColors.bg,
                errorText: error,
                errorMaxLines: 2,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
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
                  borderSide:
                      const BorderSide(color: AppColors.primary, width: 1.6),
                ),
                errorBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.danger),
                ),
              );
            }

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

                    // Form Header
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 16),
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
                                    _editingUserId == null
                                        ? Icons.person_add_alt_1_rounded
                                        : Icons.edit_rounded,
                                    color: Colors.white,
                                    size: 18),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                _editingUserId == null
                                    ? 'Add New Team Member'
                                    : 'Edit User Details',
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
                            onPressed: () async {
                              final canClose =
                                  await _confirmDiscardIfDirty(ctx);
                              if (canClose && ctx.mounted) Navigator.pop(ctx);
                            },
                          ),
                        ],
                      ),
                    ),

                    // Form Content
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('BASIC INFORMATION',
                                style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryDark,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 10),
                            TextField(
                              controller: _fullNameCtrl,
                              onChanged: (_) => markDirty(),
                              decoration: _fieldDecoration(
                                  'FULL NAME *', _fullNameError),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _usernameCtrl,
                              onChanged: (_) => markDirty(),
                              decoration: _fieldDecoration(
                                  'USERNAME *', _usernameError),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              onChanged: (_) => markDirty(),
                              decoration: _fieldDecoration(
                                  'EMAIL ADDRESS *', _emailError),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _phoneCtrl,
                              keyboardType: TextInputType.phone,
                              onChanged: (_) => markDirty(),
                              decoration: _fieldDecoration(
                                  'PHONE NUMBER *', _phoneError),
                            ),
                            const SizedBox(height: 22),
                            const Text('ROLE & REPORTING',
                                style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryDark,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 10),
                            DropdownButtonFormField<int>(
                              value: _selectedRoleId,
                              decoration: _fieldDecoration('USER ROLE *', null),
                              items: const [
                                DropdownMenuItem(
                                    value: 1, child: Text('Super Admin')),
                                DropdownMenuItem(
                                    value: 2, child: Text('Manager')),
                                DropdownMenuItem(
                                    value: 3,
                                    child: Text('Sales Representative')),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setSheetState(() {
                                    _selectedRoleId = val;
                                    if (_selectedRoleId != 3) {
                                      _selectedManagerId = null;
                                      _managerError = null;
                                    }
                                    _formIsDirty = true;
                                  });
                                }
                              },
                            ),
                            if (_selectedRoleId == 3) ...[
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                value: _selectedManagerId,
                                decoration: _fieldDecoration(
                                    'ASSIGN REPORTING MANAGER *',
                                    _managerError),
                                items: [
                                  const DropdownMenuItem<String>(
                                      value: null,
                                      child: Text('Select a manager...')),
                                  ..._managersList
                                      .map<DropdownMenuItem<String>>((m) {
                                    return DropdownMenuItem<String>(
                                      value: m['id']?.toString(),
                                      child: Text(m['full_name']?.toString() ??
                                          'Manager'),
                                    );
                                  }).toList(),
                                ],
                                onChanged: (val) => setSheetState(() {
                                  _selectedManagerId = val;
                                  _managerError = null;
                                  _formIsDirty = true;
                                }),
                              ),
                            ],
                            if (_editingUserId == null) ...[
                              const SizedBox(height: 22),
                              const Text('ACCOUNT SECURITY',
                                  style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primaryDark,
                                      letterSpacing: 0.5)),
                              const SizedBox(height: 10),
                              TextField(
                                controller: _passwordCtrl,
                                obscureText: !_showPassword,
                                onChanged: (_) => markDirty(),
                                decoration: _fieldDecoration(
                                        'PASSWORD *', _passwordError)
                                    .copyWith(
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                        _showPassword
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        size: 18),
                                    onPressed: () => setSheetState(
                                        () => _showPassword = !_showPassword),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _confirmPasswordCtrl,
                                obscureText: !_showPassword,
                                onChanged: (_) => markDirty(),
                                decoration: _fieldDecoration(
                                    'CONFIRM PASSWORD *',
                                    _confirmPasswordError),
                              ),
                            ],
                            const SizedBox(height: 26),
                            SizedBox(
                              width: double.infinity,
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _isSavingUser
                                    ? null
                                    : () async {
                                        if (!_validateForm()) {
                                          setSheetState(() {});
                                          _showNotification(
                                              'Please fix the highlighted fields before continuing.',
                                              isError: true);
                                          return;
                                        }

                                        setSheetState(
                                            () => _isSavingUser = true);

                                        final payload = {
                                          'role_id': _selectedRoleId,
                                          'manager_id': _selectedRoleId == 3
                                              ? _selectedManagerId
                                              : null,
                                          'full_name':
                                              _fullNameCtrl.text.trim(),
                                          'username': _usernameCtrl.text.trim(),
                                          'email': _emailCtrl.text.trim(),
                                          'phone': _phoneCtrl.text.trim(),
                                        };

                                        if (_editingUserId == null) {
                                          payload['password'] =
                                              _passwordCtrl.text;
                                        }

                                        Map<String, dynamic> res;
                                        if (_editingUserId != null) {
                                          res = await _service.updateUser(
                                              _editingUserId, payload);
                                        } else {
                                          res = await _service
                                              .createUser(payload);
                                        }

                                        setSheetState(
                                            () => _isSavingUser = false);

                                        if (!mounted) return;

                                        if (res['success'] == true) {
                                          _formIsDirty = false;
                                          Navigator.pop(ctx);
                                          _showNotification(res['message']
                                                  ?.toString() ??
                                              'Action completed successfully!');
                                          _fetchUsers();
                                          _fetchManagers();
                                        } else {
                                          _showNotification(
                                              res['message']?.toString() ??
                                                  'Something went wrong. Please try again.',
                                              isError: true);
                                        }
                                      },
                                style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12))),
                                child: _isSavingUser
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2))
                                    : Text(
                                        _editingUserId == null
                                            ? 'Create User'
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
            );
          },
        ),
      ),
    );
  }

  void _showViewDetailsModal(dynamic userId) async {
    setState(() => _isLoadingDetails = true);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDetailsState) => Container(
          decoration: const BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          child: FractionallySizedBox(
            heightFactor: 0.75,
            child: FutureBuilder<Map<String, dynamic>>(
              future: _service.getUserById(userId),
              builder: (context, snapshot) {
                final loading =
                    snapshot.connectionState == ConnectionState.waiting;
                final result = snapshot.data;
                final hasError = result != null && result['success'] == false;
                final user = result?['user'] as Map<String, dynamic>? ?? {};

                final name = user['full_name']?.toString() ?? 'User Details';
                final username = user['username']?.toString() ?? 'username';
                final roleName =
                    user['role_name']?.toString() ?? 'Sales Executive';
                final managerName =
                    user['manager_name']?.toString() ?? 'None Assigned';

                return Column(
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
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primaryDark, AppColors.primary],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: Colors.white,
                            child: Text(_getInitials(name),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryDark,
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
                                Text('@$username • $roleName',
                                    style: const TextStyle(
                                        fontSize: 11, color: Colors.white70),
                                    overflow: TextOverflow.ellipsis),
                              ],
                            ),
                          ),
                          IconButton(
                              icon: const Icon(Icons.close_rounded,
                                  color: Colors.white),
                              onPressed: () => Navigator.pop(ctx)),
                        ],
                      ),
                    ),
                    Expanded(
                      child: loading
                          ? const Center(
                              child: CircularProgressIndicator(
                                  color: AppColors.primary))
                          : hasError
                              ? Center(
                                  child: Padding(
                                    padding: const EdgeInsets.all(24),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.error_outline_rounded,
                                            size: 36, color: AppColors.danger),
                                        const SizedBox(height: 8),
                                        Text(
                                          result?['message']?.toString() ??
                                              'Failed to load user details.',
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                              fontSize: 12.5,
                                              color: AppColors.textSecondary),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                              : SingleChildScrollView(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    children: [
                                      _buildDetailRow(
                                          Icons.email_outlined,
                                          'Email',
                                          user['email']?.toString() ?? 'N/A'),
                                      _buildDetailRow(
                                          Icons.phone_outlined,
                                          'Phone',
                                          user['phone']?.toString() ?? 'N/A'),
                                      _buildDetailRow(Icons.badge_outlined,
                                          'Role Name', roleName),
                                      _buildDetailRow(Icons.groups_outlined,
                                          'Reporting Manager', managerName),
                                      _buildDetailRow(
                                          Icons.event_outlined,
                                          'Created Date',
                                          _formatDate(
                                              user['created_at']?.toString())),
                                      _buildDetailRow(
                                          Icons.login_outlined,
                                          'Last Login',
                                          _formatDate(
                                              user['last_login']?.toString())),
                                    ],
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
    ).whenComplete(() {
      if (mounted) setState(() => _isLoadingDetails = false);
    });
  }

  void _showDeleteDialog(dynamic userId, String userName) {
    _deletingUserId = userId;
    _deletingUserName = userName;

    showDialog(
      context: context,
      barrierDismissible: !_isDeleting,
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
                child: Text('Delete User Account?',
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: AppColors.primaryDark)),
              ),
            ],
          ),
          content: Text(
            'Are you sure you want to delete "$_deletingUserName"? This will immediately revoke their portal access. This action cannot be undone.',
            style:
                const TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
          ),
          actions: [
            TextButton(
              onPressed: _isDeleting ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: _isDeleting
                  ? null
                  : () async {
                      setDialogState(() => _isDeleting = true);
                      final res = await _service.deleteUser(_deletingUserId);
                      setDialogState(() => _isDeleting = false);
                      if (!mounted) return;
                      Navigator.pop(ctx);
                      if (res['success'] == true) {
                        _showNotification(res['message']?.toString() ??
                            'User deleted successfully.');
                        _fetchUsers();
                        _fetchManagers();
                      } else {
                        _showNotification(
                            res['message']?.toString() ??
                                'Failed to delete user.',
                            isError: true);
                      }
                    },
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.danger,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10))),
              child: _isDeleting
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

  /// Called whenever the user taps Edit / Delete / the status Switch on
  /// their OWN row. Shows a clear message instead of silently doing
  /// nothing — this is what was missing before.
  void _blockSelfAction(String action) {
    _showNotification(
      'You cannot $action your own account.',
      isError: true,
    );
  }

  void _confirmToggleStatus(
      dynamic userId, String userName, String currentStatus) {
    final newStatus = currentStatus == 'Active' ? 'Inactive' : 'Active';
    final activating = newStatus == 'Active';
    final idStr = userId.toString();

    // Deep, muted amber for "deactivate" — NOT bright yellow — and a calm
    // green for "activate", both with good contrast against white text.
    final Color accent = activating ? AppColors.success : _accentAmber;
    final Color accentSoft =
        activating ? AppColors.successSoft : _accentAmberSoft;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
        contentPadding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
        actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: accentSoft,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                activating
                    ? Icons.check_circle_outline_rounded
                    : Icons.pause_circle_outline_rounded,
                color: accent,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                activating ? 'Activate this user?' : 'Deactivate this user?',
                style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: AppColors.primaryDark),
              ),
            ),
          ],
        ),
        content: Text(
          activating
              ? 'Are you sure you want to activate "$userName"? They will regain portal access immediately.'
              : 'Are you sure you want to deactivate "$userName"? They will lose portal access immediately.',
          style:
              const TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await _toggleUserStatus(idStr, currentStatus);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: accent,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(activating ? 'Yes, Activate' : 'Yes, Deactivate',
                style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleUserStatus(String userId, String currentStatus) async {
    final newStatus = currentStatus == 'Active' ? 'Inactive' : 'Active';

    setState(() => _statusUpdatingIds.add(userId));
    final res = await _service.updateUserStatus(userId, newStatus);
    if (mounted) setState(() => _statusUpdatingIds.remove(userId));

    if (!mounted) return;

    if (res['success'] == true) {
      _showNotification(
          res['message']?.toString() ?? 'Status updated successfully!');
      _fetchUsers();
    } else {
      _showNotification(
          res['message']?.toString() ?? 'Failed to update status.',
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
    if (parts.isEmpty || parts[0].isEmpty) return 'U';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
    final currentUser = ref.watch(authProvider).user;
    final currentUserId = currentUser?['id']?.toString();

    final total = _usersList.length;
    final activeUsers = _usersList.where((u) => u['status'] == 'Active').length;
    final inactiveUsers =
        _usersList.where((u) => u['status'] == 'Inactive').length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('User Management Directory',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Control Managers & Sales Representatives',
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
            onPressed: () {
              _fetchUsers();
              _fetchManagers();
            },
            tooltip: 'Refresh Users',
          ),
          const SizedBox(width: 4),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openUserFormModal(),
        backgroundColor: AppColors.primary,
        elevation: 2,
        icon: const Icon(Icons.person_add_alt_1_rounded, color: Colors.white),
        label: const Text('Add User',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5))
            : Column(
                children: [
                  if (_isRefreshing)
                    const LinearProgressIndicator(
                      minHeight: 2.5,
                      backgroundColor: AppColors.hover,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: () async {
                        await _fetchUsers();
                        await _fetchManagers();
                      },
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
                                      onPressed: _fetchUsers,
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

                            // 1. STATS KPI CARDS
                            GridView.count(
                              crossAxisCount: 2,
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                              childAspectRatio: 1.8,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              children: [
                                _buildKpiCard(
                                    'TOTAL USERS',
                                    '$total',
                                    'Across org',
                                    Icons.groups_2_rounded,
                                    AppColors.primary,
                                    AppColors.primarySoft),
                                _buildKpiCard(
                                    'ACTIVE USERS',
                                    '$activeUsers',
                                    'Working accounts',
                                    Icons.check_circle_rounded,
                                    AppColors.success,
                                    AppColors.successSoft),
                                _buildKpiCard(
                                    'INACTIVE USERS',
                                    '$inactiveUsers',
                                    'Disabled accounts',
                                    Icons.block_rounded,
                                    AppColors.danger,
                                    AppColors.dangerSoft),
                                _buildKpiCard(
                                    'MANAGERS',
                                    '${_managersList.length}',
                                    'Active team leads',
                                    Icons.supervisor_account_rounded,
                                    _accentAmber,
                                    _accentAmberSoft),
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
                                    onChanged: _onSearchChanged,
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600),
                                    decoration: InputDecoration(
                                      hintText:
                                          'Search user by name, username, email...',
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
                                          : (_searchController.text.isNotEmpty
                                              ? IconButton(
                                                  icon: const Icon(
                                                      Icons.clear_rounded,
                                                      size: 18),
                                                  onPressed: () {
                                                    _searchDebounce?.cancel();
                                                    _searchController.clear();
                                                    _fetchUsers();
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
                                        child: DropdownButtonFormField<dynamic>(
                                          value: _roleFilter,
                                          decoration: const InputDecoration(
                                              contentPadding:
                                                  EdgeInsets.symmetric(
                                                      horizontal: 10,
                                                      vertical: 8),
                                              filled: true,
                                              fillColor: AppColors.bg),
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textPrimary,
                                              fontWeight: FontWeight.w700),
                                          items: const [
                                            DropdownMenuItem(
                                                value: 'ALL',
                                                child: Text('All Roles')),
                                            DropdownMenuItem(
                                                value: 1,
                                                child: Text('Super Admin')),
                                            DropdownMenuItem(
                                                value: 2,
                                                child: Text('Manager')),
                                            DropdownMenuItem(
                                                value: 3,
                                                child: Text('Sales Rep')),
                                          ],
                                          onChanged: (val) {
                                            setState(() => _roleFilter = val);
                                            _fetchUsers();
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: DropdownButtonFormField<String>(
                                          value: _statusFilter,
                                          decoration: const InputDecoration(
                                              contentPadding:
                                                  EdgeInsets.symmetric(
                                                      horizontal: 10,
                                                      vertical: 8),
                                              filled: true,
                                              fillColor: AppColors.bg),
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textPrimary,
                                              fontWeight: FontWeight.w700),
                                          items: const [
                                            DropdownMenuItem(
                                                value: 'ALL',
                                                child: Text('All Statuses')),
                                            DropdownMenuItem(
                                                value: 'Active',
                                                child: Text('Active')),
                                            DropdownMenuItem(
                                                value: 'Inactive',
                                                child: Text('Inactive')),
                                          ],
                                          onChanged: (val) {
                                            setState(
                                                () => _statusFilter = val!);
                                            _fetchUsers();
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 16),

                            // 3. USERS LIST
                            if (_usersList.isEmpty)
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
                                    Icon(Icons.people_outline_rounded,
                                        size: 40, color: AppColors.textMuted),
                                    SizedBox(height: 10),
                                    Text('No Users Found',
                                        style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 15,
                                            color: AppColors.textPrimary)),
                                    SizedBox(height: 4),
                                    Text(
                                        'Try adjusting your search or filters.',
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
                                itemCount: _usersList.length,
                                itemBuilder: (context, index) {
                                  final user = _usersList[index];
                                  final id = user['id']?.toString();
                                  final name =
                                      user['full_name']?.toString() ?? 'User';
                                  final username =
                                      user['username']?.toString() ??
                                          'username';
                                  final email =
                                      user['email']?.toString() ?? 'N/A';
                                  final phone =
                                      user['phone']?.toString() ?? 'N/A';
                                  final roleName =
                                      user['role_name']?.toString() ??
                                          'Sales Rep';
                                  final status =
                                      user['status']?.toString() ?? 'Active';
                                  final isActive = status == 'Active';
                                  final isSelf = currentUserId != null &&
                                      currentUserId == id;
                                  final isStatusUpdating = id != null &&
                                      _statusUpdatingIds.contains(id);
                                  final avatarUrl = _getFormattedImageUrl(
                                      user['profile_image']?.toString());

                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: AppColors.card,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                          color: isSelf
                                              ? AppColors.primary
                                                  .withOpacity(0.35)
                                              : AppColors.border),
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
                                                    backgroundImage:
                                                        avatarUrl != null
                                                            ? NetworkImage(
                                                                avatarUrl)
                                                            : null,
                                                    child: avatarUrl == null
                                                        ? Text(
                                                            _getInitials(name),
                                                            style: const TextStyle(
                                                                color: Colors
                                                                    .white,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w800,
                                                                fontSize: 11))
                                                        : null,
                                                  ),
                                                  const SizedBox(width: 10),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment:
                                                          CrossAxisAlignment
                                                              .start,
                                                      children: [
                                                        Row(
                                                          children: [
                                                            Flexible(
                                                              child: Text(name,
                                                                  style: const TextStyle(
                                                                      fontWeight:
                                                                          FontWeight
                                                                              .w800,
                                                                      fontSize:
                                                                          14.5,
                                                                      color: AppColors
                                                                          .textPrimary),
                                                                  overflow:
                                                                      TextOverflow
                                                                          .ellipsis),
                                                            ),
                                                            if (isSelf) ...[
                                                              const SizedBox(
                                                                  width: 6),
                                                              Container(
                                                                padding: const EdgeInsets
                                                                    .symmetric(
                                                                    horizontal:
                                                                        6,
                                                                    vertical:
                                                                        2),
                                                                decoration: BoxDecoration(
                                                                    color: AppColors
                                                                        .primarySoft,
                                                                    borderRadius:
                                                                        BorderRadius.circular(
                                                                            6)),
                                                                child: const Text(
                                                                    'YOU',
                                                                    style: TextStyle(
                                                                        fontSize:
                                                                            9,
                                                                        fontWeight:
                                                                            FontWeight
                                                                                .w900,
                                                                        color: AppColors
                                                                            .primaryDark)),
                                                              ),
                                                            ],
                                                          ],
                                                        ),
                                                        Text('@$username',
                                                            style: const TextStyle(
                                                                fontSize: 11,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w700,
                                                                color: AppColors
                                                                    .primary),
                                                            overflow:
                                                                TextOverflow
                                                                    .ellipsis),
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
                                                  color: AppColors.primarySoft,
                                                  borderRadius:
                                                      BorderRadius.circular(6)),
                                              child: Text(
                                                  roleName.toUpperCase(),
                                                  style: const TextStyle(
                                                      fontSize: 10,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: AppColors
                                                          .primaryDark)),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            const Icon(Icons.email_outlined,
                                                size: 14,
                                                color: AppColors.textSecondary),
                                            const SizedBox(width: 4),
                                            Expanded(
                                                child: Text(email,
                                                    style: const TextStyle(
                                                        fontSize: 11.5,
                                                        color: AppColors
                                                            .textSecondary),
                                                    overflow:
                                                        TextOverflow.ellipsis)),
                                            const SizedBox(width: 8),
                                            const Icon(Icons.phone_outlined,
                                                size: 14,
                                                color: AppColors.textSecondary),
                                            const SizedBox(width: 4),
                                            Text(phone,
                                                style: const TextStyle(
                                                    fontSize: 11.5,
                                                    color: AppColors
                                                        .textSecondary)),
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
                                                      _showViewDetailsModal(id),
                                                  tooltip: 'View Details',
                                                ),
                                                // Edit — on self, tapping
                                                // still fires and shows a
                                                // clear "cannot edit
                                                // yourself" message instead
                                                // of doing nothing.
                                                IconButton(
                                                  icon: Icon(
                                                      Icons.edit_outlined,
                                                      size: 18,
                                                      color: isSelf
                                                          ? AppColors.textMuted
                                                          : _accentAmber),
                                                  onPressed: () => isSelf
                                                      ? _blockSelfAction('edit')
                                                      : _openUserFormModal(
                                                          user: user),
                                                  tooltip: isSelf
                                                      ? 'Cannot edit own account'
                                                      : 'Edit User',
                                                ),
                                                // Delete — same pattern.
                                                IconButton(
                                                  icon: Icon(
                                                      Icons
                                                          .delete_outline_rounded,
                                                      size: 18,
                                                      color: isSelf
                                                          ? AppColors.textMuted
                                                          : AppColors.danger),
                                                  onPressed: () => isSelf
                                                      ? _blockSelfAction(
                                                          'delete')
                                                      : _showDeleteDialog(
                                                          id, name),
                                                  tooltip: isSelf
                                                      ? 'Cannot delete own account'
                                                      : 'Delete User',
                                                ),
                                              ],
                                            ),
                                            Row(
                                              children: [
                                                Text(
                                                    isActive
                                                        ? 'Active'
                                                        : 'Inactive',
                                                    style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color: isActive
                                                            ? AppColors.success
                                                            : AppColors
                                                                .danger)),
                                                const SizedBox(width: 4),
                                                isStatusUpdating
                                                    ? const SizedBox(
                                                        width: 36,
                                                        height: 20,
                                                        child: Center(
                                                          child: SizedBox(
                                                              width: 16,
                                                              height: 16,
                                                              child: CircularProgressIndicator(
                                                                  strokeWidth:
                                                                      2,
                                                                  color: AppColors
                                                                      .primary)),
                                                        ),
                                                      )
                                                    // Switch — self case is
                                                    // wrapped so a tap on the
                                                    // disabled switch area
                                                    // still surfaces the
                                                    // "cannot disable
                                                    // yourself" message.
                                                    : GestureDetector(
                                                        onTap: isSelf
                                                            ? () => _blockSelfAction(
                                                                isActive
                                                                    ? 'deactivate'
                                                                    : 'activate')
                                                            : null,
                                                        child: Switch(
                                                          value: isActive,
                                                          onChanged: (isSelf ||
                                                                  id == null)
                                                              ? null
                                                              : (_) =>
                                                                  _confirmToggleStatus(
                                                                      id,
                                                                      name,
                                                                      status),
                                                          activeColor:
                                                              AppColors.success,
                                                        ),
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
