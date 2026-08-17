import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/storage_service.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../sales/data/profile_service.dart';

class ManagerProfileScreen extends ConsumerStatefulWidget {
  const ManagerProfileScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ManagerProfileScreen> createState() =>
      _ManagerProfileScreenState();
}

class _ManagerProfileScreenState extends ConsumerState<ManagerProfileScreen> {
  final ProfileService _profileService = ProfileService();
  final ImagePicker _picker = ImagePicker();

  Map<String, dynamic>? _profileData;
  bool _isLoading = true;
  File? _selectedLocalImage;
  bool _isUploadingPhoto = false;
  bool _isRemovingPhoto = false;

  // Basic Info States
  bool _isEditing = false;
  bool _savingInfo = false;
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  String? _fullNameError;
  String? _usernameError;
  String? _emailError;
  String? _phoneError;

  // Password States
  bool _updatingPassword = false;
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;

  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String? _currentPasswordError;
  String? _newPasswordError;
  String? _confirmPasswordError;

  @override
  void initState() {
    super.initState();
    _loadCachedProfile();
    _fetchProfile();
  }

  Future<void> _loadCachedProfile() async {
    final cachedUser = await StorageService.getUser();
    if (mounted && cachedUser != null) {
      setState(() {
        _profileData = cachedUser;
        _fullNameController.text = cachedUser['full_name']?.toString() ?? '';
        _usernameController.text = cachedUser['username']?.toString() ?? '';
        _emailController.text = cachedUser['email']?.toString() ?? '';
        _phoneController.text = cachedUser['phone']?.toString() ?? '';
      });
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    final result = await _profileService.getProfile();
    if (!mounted) return;

    if (result['success'] == true) {
      final data = result['profile'] as Map<String, dynamic>;
      setState(() {
        _profileData = data;
        _fullNameController.text = data['full_name']?.toString() ?? '';
        _usernameController.text = data['username']?.toString() ?? '';
        _emailController.text = data['email']?.toString() ?? '';
        _phoneController.text = data['phone']?.toString() ?? '';
        _selectedLocalImage = null;
      });
    } else {
      _showNotification(result['message'] ?? 'Failed to load profile details.',
          isError: true);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  // 🟢 Formatted Image URL Generator (Exact match with React getImageUrl)
  String? _getFormattedImageUrl() {
    final imagePath = _profileData?['profile_image']?.toString() ??
        _profileData?['photo']?.toString();
    if (imagePath == null ||
        imagePath.isEmpty ||
        imagePath == 'null' ||
        imagePath == 'undefined') {
      return null;
    }

    String url;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      url = imagePath;
    } else {
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
      url = '$serverHost/$cleanPath';
    }

    final updatedAt = _profileData?['updated_at']?.toString();
    int cacheKey;
    if (updatedAt != null) {
      cacheKey = DateTime.tryParse(updatedAt)?.millisecondsSinceEpoch ??
          DateTime.now().millisecondsSinceEpoch;
    } else {
      cacheKey = DateTime.now().millisecondsSinceEpoch;
    }
    return '$url?v=$cacheKey';
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Update Profile Photo',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 17,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildPickerOption(
                    icon: Icons.camera_alt_rounded,
                    label: 'Take Photo',
                    color: AppColors.primary,
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickImage(ImageSource.camera);
                    },
                  ),
                  _buildPickerOption(
                    icon: Icons.photo_library_rounded,
                    label: 'Choose Gallery',
                    color: AppColors.info,
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickImage(ImageSource.gallery);
                    },
                  ),
                  if (_getFormattedImageUrl() != null ||
                      _selectedLocalImage != null)
                    _buildPickerOption(
                      icon: Icons.delete_outline_rounded,
                      label: 'Remove',
                      color: AppColors.danger,
                      onTap: () {
                        Navigator.pop(ctx);
                        _removePhoto();
                      },
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPickerOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: color.withOpacity(0.12),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(height: 8),
            Text(label,
                style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    color: AppColors.textPrimary)),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
          source: source, maxWidth: 1024, maxHeight: 1024, imageQuality: 85);
      if (pickedFile == null) return;

      final file = File(pickedFile.path);
      final fileSize = await file.length();
      if (fileSize > 2 * 1024 * 1024) {
        _showNotification('Image size must be under 2MB.', isError: true);
        return;
      }

      setState(() {
        _selectedLocalImage = file;
        _isUploadingPhoto = true;
      });

      final result = await _profileService.uploadProfilePhoto(file.path);
      if (!mounted) return;

      setState(() => _isUploadingPhoto = false);
      if (result['success'] == true) {
        _showNotification('Profile photo updated successfully!');
        await _fetchProfile();
      } else {
        setState(() => _selectedLocalImage = null);
        _showNotification(result['message'] ?? 'Upload failed', isError: true);
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isUploadingPhoto = false;
          _selectedLocalImage = null;
        });
      }
      _showNotification('Could not access selected image', isError: true);
    }
  }

  Future<void> _removePhoto() async {
    if (_profileData == null) return;
    setState(() => _isRemovingPhoto = true);

    final result = await _profileService.updateProfile({
      'id': _profileData!['id'],
      'full_name': _profileData!['full_name'],
      'username': _profileData!['username'],
      'email': _profileData!['email'],
      'phone': _profileData!['phone'],
      'profile_image': null,
    });

    if (!mounted) return;
    setState(() => _isRemovingPhoto = false);

    if (result['success'] == true) {
      setState(() {
        _selectedLocalImage = null;
        _profileData = {...?_profileData, 'profile_image': null};
      });
      await StorageService.saveProfileImage('');
      _showNotification('Profile photo removed successfully!');
      _fetchProfile();
    } else {
      _showNotification(result['message'] ?? 'Failed to remove photo.',
          isError: true);
    }
  }

  bool _validateBasicInfo() {
    bool isValid = true;
    setState(() {
      _fullNameError = null;
      _usernameError = null;
      _emailError = null;
      _phoneError = null;
    });

    if (_fullNameController.text.trim().isEmpty) {
      _fullNameError = 'Full Name is required';
      isValid = false;
    }
    if (_usernameController.text.trim().isEmpty) {
      _usernameError = 'Username is required';
      isValid = false;
    }

    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (_emailController.text.trim().isEmpty) {
      _emailError = 'Email is required';
      isValid = false;
    } else if (!emailRegex.hasMatch(_emailController.text.trim())) {
      _emailError = 'Enter a valid email address';
      isValid = false;
    }

    if (_phoneController.text.trim().isEmpty) {
      _phoneError = 'Phone number is required';
      isValid = false;
    }

    setState(() {});
    return isValid;
  }

  Future<void> _handleSaveBasicInfo() async {
    if (!_validateBasicInfo() || _profileData == null) return;
    setState(() => _savingInfo = true);

    final result = await _profileService.updateProfile({
      'id': _profileData!['id'],
      'full_name': _fullNameController.text.trim(),
      'username': _usernameController.text.trim(),
      'email': _emailController.text.trim(),
      'phone': _phoneController.text.trim(),
    });

    if (!mounted) return;
    setState(() => _savingInfo = false);
    if (result['success'] == true) {
      _showNotification('Profile details saved successfully!');
      setState(() => _isEditing = false);
      _fetchProfile();
    } else {
      _showNotification(result['message'] ?? 'Failed to update profile',
          isError: true);
    }
  }

  void _handleCancelEdit() {
    setState(() {
      _isEditing = false;
      _fullNameError = null;
      _usernameError = null;
      _emailError = null;
      _phoneError = null;
      if (_profileData != null) {
        _fullNameController.text = _profileData!['full_name']?.toString() ?? '';
        _usernameController.text = _profileData!['username']?.toString() ?? '';
        _emailController.text = _profileData!['email']?.toString() ?? '';
        _phoneController.text = _profileData!['phone']?.toString() ?? '';
      }
    });
  }

  bool _validatePassword() {
    bool isValid = true;
    setState(() {
      _currentPasswordError = null;
      _newPasswordError = null;
      _confirmPasswordError = null;
    });

    if (_currentPasswordController.text.isEmpty) {
      _currentPasswordError = 'Current password is required';
      isValid = false;
    }

    final strongRegex = RegExp(
        r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:",.<>\/]).{8,}$');
    final pass = _newPasswordController.text;

    if (pass.isEmpty) {
      _newPasswordError = 'New password is required';
      isValid = false;
    } else if (!strongRegex.hasMatch(pass)) {
      _newPasswordError =
          'Must contain 8+ chars, upper, lower, number & special char';
      isValid = false;
    }

    if (_confirmPasswordController.text.isEmpty) {
      _confirmPasswordError = 'Confirm password is required';
      isValid = false;
    } else if (pass != _confirmPasswordController.text) {
      _confirmPasswordError = 'Passwords do not match';
      isValid = false;
    }

    setState(() {});
    return isValid;
  }

  Future<void> _handleUpdatePassword() async {
    if (!_validatePassword()) return;
    setState(() => _updatingPassword = true);

    final result = await _profileService.changePassword(
      currentPassword: _currentPasswordController.text,
      newPassword: _newPasswordController.text,
    );

    if (!mounted) return;
    setState(() => _updatingPassword = false);
    if (result['success'] == true) {
      _showNotification('Password updated successfully!');
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
    } else {
      _showNotification(result['message'] ?? 'Failed to update password',
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
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: Colors.white)),
            ),
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

  String _getInitials(String? name) {
    if (name == null || name.trim().isEmpty) return 'TM';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  String _formatEmpId(dynamic id, dynamic code) {
    if (code != null && code.toString().isNotEmpty) return code.toString();
    if (id == null) return 'EMP00001';
    return 'EMP${id.toString().padLeft(5, '0')}';
  }

  String _formatDate(String? value) {
    if (value == null || value.isEmpty) return 'N/A';
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
      final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
      final ampm = d.hour >= 12 ? 'PM' : 'AM';
      return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}, ${h.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')} $ampm';
    } catch (_) {
      return 'N/A';
    }
  }

  bool _isAccountActive() {
    final st = _profileData?['status'];
    if (st == null) return false;
    return st == 1 ||
        st == '1' ||
        st == true ||
        st.toString().toLowerCase() == 'active';
  }

  @override
  Widget build(BuildContext context) {
    final networkImageUrl = _getFormattedImageUrl();
    final activeStatus = _isAccountActive();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Manager Profile',
            style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                color: AppColors.textPrimary)),
        elevation: 0,
        backgroundColor: AppColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.danger),
            onPressed: () => ref.read(authProvider.notifier).logout(),
            tooltip: 'Sign Out',
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading && _profileData == null
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5))
            : RefreshIndicator(
                onRefresh: _fetchProfile,
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // ============ PROFILE HEADER CARD ============
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            vertical: 24, horizontal: 20),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.border),
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withOpacity(0.03),
                                blurRadius: 10,
                                offset: const Offset(0, 4))
                          ],
                        ),
                        child: Column(
                          children: [
                            Stack(
                              alignment: Alignment.bottomRight,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(48),
                                  child: Container(
                                    width: 96,
                                    height: 96,
                                    color: AppColors.primaryDark,
                                    child: _selectedLocalImage != null
                                        ? Image.file(_selectedLocalImage!,
                                            fit: BoxFit.cover)
                                        : (networkImageUrl != null
                                            ? Image.network(
                                                networkImageUrl,
                                                fit: BoxFit.cover,
                                                loadingBuilder:
                                                    (context, child, progress) {
                                                  if (progress == null)
                                                    return child;
                                                  return const Center(
                                                    child: SizedBox(
                                                      width: 22,
                                                      height: 22,
                                                      child:
                                                          CircularProgressIndicator(
                                                              color:
                                                                  Colors.white,
                                                              strokeWidth: 2),
                                                    ),
                                                  );
                                                },
                                                errorBuilder: (context, error,
                                                    stackTrace) {
                                                  return Center(
                                                    child: Text(
                                                      _getInitials(
                                                          _profileData?[
                                                                  'full_name']
                                                              ?.toString()),
                                                      style: const TextStyle(
                                                          fontSize: 32,
                                                          fontWeight:
                                                              FontWeight.w800,
                                                          color: Colors.white),
                                                    ),
                                                  );
                                                },
                                              )
                                            : Center(
                                                child: Text(
                                                  _getInitials(
                                                      _profileData?['full_name']
                                                          ?.toString()),
                                                  style: const TextStyle(
                                                      fontSize: 32,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: Colors.white),
                                                ),
                                              )),
                                  ),
                                ),
                                Positioned(
                                  right: 0,
                                  bottom: 0,
                                  child: Material(
                                    color: AppColors.primary,
                                    shape: const CircleBorder(),
                                    elevation: 3,
                                    child: InkWell(
                                      onTap: (_isUploadingPhoto ||
                                              _isRemovingPhoto)
                                          ? null
                                          : _showImageSourceSheet,
                                      customBorder: const CircleBorder(),
                                      child: Padding(
                                        padding: const EdgeInsets.all(8),
                                        child: (_isUploadingPhoto ||
                                                _isRemovingPhoto)
                                            ? const SizedBox(
                                                width: 16,
                                                height: 16,
                                                child:
                                                    CircularProgressIndicator(
                                                        color: Colors.white,
                                                        strokeWidth: 2))
                                            : const Icon(
                                                Icons.camera_alt_rounded,
                                                color: Colors.white,
                                                size: 16),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Text(
                              _profileData?['full_name']?.toString() ??
                                  'Sales Manager',
                              style: const TextStyle(
                                  fontSize: 19,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.textPrimary,
                                  letterSpacing: -0.3),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '@${_profileData?['username']?.toString() ?? 'username'}',
                              style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                      color: AppColors.primarySoft,
                                      borderRadius: BorderRadius.circular(20)),
                                  child: Text(
                                    (_profileData?['role_name']?.toString() ??
                                            'TEAM MANAGER')
                                        .toUpperCase(),
                                    style: const TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.primary),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: activeStatus
                                        ? AppColors.successSoft
                                        : AppColors.dangerSoft,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    activeStatus ? 'ACTIVE STATUS' : 'INACTIVE',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                      color: activeStatus
                                          ? AppColors.success
                                          : AppColors.danger,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Divider(height: 1, color: AppColors.hover),
                            const SizedBox(height: 14),
                            Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 18,
                              runSpacing: 8,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.mail_outline_rounded,
                                        size: 15, color: AppColors.primary),
                                    const SizedBox(width: 6),
                                    Text(
                                      _profileData?['email']?.toString() ??
                                          'N/A',
                                      style: const TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary),
                                    ),
                                  ],
                                ),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.phone_outlined,
                                        size: 15, color: AppColors.primary),
                                    const SizedBox(width: 6),
                                    Text(
                                      _profileData?['phone']?.toString() ??
                                          'N/A',
                                      style: const TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ============ ACCOUNT ACTIVITY TIMELINE ============
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.history_rounded,
                                    size: 19, color: AppColors.primaryDark),
                                SizedBox(width: 8),
                                Text('Account Activity',
                                    style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.textPrimary)),
                              ],
                            ),
                            const Divider(height: 24),
                            _timelineItem(
                              icon: Icons.person_add_alt_rounded,
                              color: AppColors.primary,
                              label: 'Account Created',
                              description:
                                  'Initial profile registration and manager role assignment.',
                              date: _formatDate(
                                  _profileData?['created_at']?.toString()),
                              isLast: false,
                            ),
                            _timelineItem(
                              icon: Icons.update_rounded,
                              color: AppColors.warning,
                              label: 'Last Profile Update',
                              description:
                                  'Contact details and avatar information synced.',
                              date: _formatDate(
                                  _profileData?['updated_at']?.toString()),
                              isLast: false,
                            ),
                            _timelineItem(
                              icon: Icons.login_rounded,
                              color: AppColors.success,
                              label: 'Last Login Session',
                              description:
                                  'Logged in via authenticated Solar CRM Manager portal.',
                              date: _formatDate(
                                  _profileData?['last_login']?.toString()),
                              isLast: true,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ============ PERSONAL DETAILS CARD ============
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.person_outline_rounded,
                                        size: 20, color: AppColors.primary),
                                    SizedBox(width: 8),
                                    Text('Personal Details',
                                        style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.textPrimary)),
                                  ],
                                ),
                                !_isEditing
                                    ? OutlinedButton.icon(
                                        onPressed: () =>
                                            setState(() => _isEditing = true),
                                        icon: const Icon(Icons.edit_outlined,
                                            size: 14),
                                        label: const Text('Edit',
                                            style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700)),
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: AppColors.primary,
                                          side: const BorderSide(
                                              color: AppColors.border),
                                          shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8)),
                                        ),
                                      )
                                    : Row(
                                        children: [
                                          TextButton(
                                            onPressed: _savingInfo
                                                ? null
                                                : _handleCancelEdit,
                                            child: const Text('Cancel',
                                                style: TextStyle(
                                                    fontSize: 12,
                                                    color:
                                                        AppColors.textSecondary,
                                                    fontWeight:
                                                        FontWeight.w700)),
                                          ),
                                          const SizedBox(width: 4),
                                          ElevatedButton(
                                            onPressed: _savingInfo
                                                ? null
                                                : _handleSaveBasicInfo,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor:
                                                  AppColors.primary,
                                              foregroundColor: Colors.white,
                                              elevation: 0,
                                              shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(8)),
                                            ),
                                            child: _savingInfo
                                                ? const SizedBox(
                                                    width: 14,
                                                    height: 14,
                                                    child:
                                                        CircularProgressIndicator(
                                                            color: Colors.white,
                                                            strokeWidth: 2),
                                                  )
                                                : const Text('Save',
                                                    style: TextStyle(
                                                        fontSize: 12,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color: Colors.white)),
                                          ),
                                        ],
                                      ),
                              ],
                            ),
                            const Divider(height: 24),
                            _buildTextField(
                              'Employee ID',
                              TextEditingController(
                                  text: _formatEmpId(
                                      _profileData?['id'],
                                      _profileData?['employee_code'] ??
                                          _profileData?['employee_id'])),
                              enabled: false,
                            ),
                            const SizedBox(height: 12),
                            _buildTextField('Full Name', _fullNameController,
                                enabled: _isEditing, errorText: _fullNameError),
                            const SizedBox(height: 12),
                            _buildTextField('Username', _usernameController,
                                enabled: _isEditing, errorText: _usernameError),
                            const SizedBox(height: 12),
                            _buildTextField('Email Address', _emailController,
                                enabled: _isEditing,
                                errorText: _emailError,
                                keyboardType: TextInputType.emailAddress),
                            const SizedBox(height: 12),
                            _buildTextField('Phone Number', _phoneController,
                                enabled: _isEditing,
                                errorText: _phoneError,
                                keyboardType: TextInputType.phone),
                            const SizedBox(height: 12),
                            _buildTextField(
                              'Role',
                              TextEditingController(
                                  text:
                                      _profileData?['role_name']?.toString() ??
                                          'Team Manager'),
                              enabled: false,
                            ),
                            const SizedBox(height: 12),
                            _buildTextField(
                              'Status',
                              TextEditingController(
                                  text: activeStatus ? 'Active' : 'Inactive'),
                              enabled: false,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ============ SECURITY & PASSWORD CARD ============
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.lock_outline_rounded,
                                    size: 20, color: AppColors.primary),
                                SizedBox(width: 8),
                                Text('Security & Password',
                                    style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.textPrimary)),
                              ],
                            ),
                            const Divider(height: 24),
                            _buildPasswordField(
                              label: 'Current Password',
                              controller: _currentPasswordController,
                              obscure: !_showCurrentPassword,
                              errorText: _currentPasswordError,
                              onToggle: () => setState(() =>
                                  _showCurrentPassword = !_showCurrentPassword),
                            ),
                            const SizedBox(height: 12),
                            _buildPasswordField(
                              label: 'New Password',
                              controller: _newPasswordController,
                              obscure: !_showNewPassword,
                              errorText: _newPasswordError,
                              onToggle: () => setState(
                                  () => _showNewPassword = !_showNewPassword),
                            ),
                            const SizedBox(height: 12),
                            _buildPasswordField(
                              label: 'Confirm New Password',
                              controller: _confirmPasswordController,
                              obscure: !_showConfirmPassword,
                              errorText: _confirmPasswordError,
                              onToggle: () => setState(() =>
                                  _showConfirmPassword = !_showConfirmPassword),
                            ),
                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              height: 46,
                              child: ElevatedButton.icon(
                                onPressed: _updatingPassword
                                    ? null
                                    : _handleUpdatePassword,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10)),
                                ),
                                icon: _updatingPassword
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2))
                                    : const Icon(Icons.lock_reset_rounded,
                                        size: 18, color: Colors.white),
                                label: const Text('Update Password',
                                    style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13.5,
                                        color: Colors.white)),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _timelineItem({
    required IconData icon,
    required Color color,
    required String label,
    required String description,
    required String date,
    required bool isLast,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 34,
              child: Column(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: color.withOpacity(0.25)),
                    ),
                    alignment: Alignment.center,
                    child: Icon(icon, size: 17, color: color),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        width: 2,
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        color: AppColors.border,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    Text(description,
                        style: const TextStyle(
                            fontSize: 11.5, color: AppColors.textSecondary)),
                    const SizedBox(height: 5),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                          color: AppColors.hover,
                          borderRadius: BorderRadius.circular(5)),
                      child: Text(date,
                          style: const TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textSecondary)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    bool enabled = true,
    String? errorText,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
            style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                color: AppColors.textSecondary,
                letterSpacing: 0.5)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          enabled: enabled,
          keyboardType: keyboardType,
          style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: enabled ? AppColors.textPrimary : AppColors.textMuted),
          decoration: InputDecoration(
            filled: true,
            fillColor: enabled ? AppColors.bg : AppColors.hover,
            errorText: errorText,
            errorStyle: const TextStyle(color: AppColors.danger, fontSize: 11),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border)),
            disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5)),
            errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.danger)),
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordField({
    required String label,
    required TextEditingController controller,
    required bool obscure,
    required VoidCallback onToggle,
    String? errorText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
            style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                color: AppColors.textSecondary,
                letterSpacing: 0.5)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscure,
          style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.bg,
            errorText: errorText,
            errorStyle: const TextStyle(color: AppColors.danger, fontSize: 11),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5)),
            errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.danger)),
            suffixIcon: IconButton(
              icon: Icon(
                  obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 18,
                  color: AppColors.textMuted),
              onPressed: onToggle,
            ),
          ),
        ),
      ],
    );
  }
}
