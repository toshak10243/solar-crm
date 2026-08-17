import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/manager_team_service.dart';
import '../../data/team_member_model.dart';

class TeamMembersScreen extends StatefulWidget {
  const TeamMembersScreen({Key? key}) : super(key: key);

  @override
  State<TeamMembersScreen> createState() => _TeamMembersScreenState();
}

class _TeamMembersScreenState extends State<TeamMembersScreen> {
  final ManagerTeamService _teamService = ManagerTeamService();
  final TextEditingController _searchController = TextEditingController();

  List<TeamMemberModel> _team = [];
  bool _isLoading = true;
  String? _errorMessage;

  String _viewMode = 'card'; // 'card' or 'list'
  String _statusFilter = 'ALL'; // 'ALL', 'ACTIVE', 'INACTIVE'
  String _sortBy =
      'name_asc'; // 'name_asc', 'name_desc', 'leads_desc', 'won_desc'

  @override
  void initState() {
    super.initState();
    _fetchTeamMembers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchTeamMembers() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _teamService.getTeamMembers();

    if (mounted) {
      if (result['success'] == true) {
        final rawList = result['team'] as List;
        setState(() {
          _team = rawList
              .map((e) => TeamMemberModel.fromJson(e as Map<String, dynamic>))
              .toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage =
              result['message']?.toString() ?? 'Failed to load team members';
          _isLoading = false;
        });
      }
    }
  }

  // Action Launchers
  void _makePhoneCall(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty || phoneNumber == 'N/A') return;
    final Uri url = Uri.parse('tel:${phoneNumber.trim()}');
    try {
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      } else {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  void _openWhatsApp(String phoneNumber) async {
    if (phoneNumber.trim().isEmpty || phoneNumber == 'N/A') return;
    final clean = phoneNumber.replaceAll(RegExp(r'\D'), '');
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

  // Computed Filtered List
  List<TeamMemberModel> get _processedTeam {
    final query = _searchController.text.trim().toLowerCase();

    final filtered = _team.where((member) {
      final matchesSearch = member.fullName.toLowerCase().contains(query) ||
          member.email.toLowerCase().contains(query) ||
          member.phone.contains(query);

      final matchesStatus = _statusFilter == 'ALL' ||
          (_statusFilter == 'ACTIVE' && member.isActive) ||
          (_statusFilter == 'INACTIVE' && !member.isActive);

      return matchesSearch && matchesStatus;
    }).toList();

    filtered.sort((a, b) {
      if (_sortBy == 'name_asc') return a.fullName.compareTo(b.fullName);
      if (_sortBy == 'name_desc') return b.fullName.compareTo(a.fullName);
      if (_sortBy == 'leads_desc')
        return b.totalAssigned.compareTo(a.totalAssigned);
      if (_sortBy == 'won_desc') return b.converted.compareTo(a.converted);
      return 0;
    });

    return filtered;
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'SE';
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

  void _showMemberDetailModal(TeamMemberModel member) {
    final avatarUrl = _getFormattedImageUrl(member.profileImage);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
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
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.primaryDark,
                  backgroundImage:
                      avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null
                      ? Text(_getInitials(member.fullName),
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 18))
                      : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        member.fullName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 17,
                            color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ID: EMP${member.id.toString().padLeft(5, '0')} • ${member.isActive ? "Active" : "Inactive"}',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: member.isActive
                                ? AppColors.success
                                : AppColors.danger),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              children: [
                const Icon(Icons.mail_outline_rounded,
                    size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(member.email,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.phone_outlined,
                    size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(member.phone,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
              ],
            ),
            const SizedBox(height: 20),
            const Text(
              'PERFORMANCE BREAKDOWN',
              style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.5),
            ),
            const SizedBox(height: 10),
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 2.2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildModalStatTile('Assigned Leads', '${member.totalAssigned}',
                    AppColors.primary, AppColors.primarySoft),
                _buildModalStatTile('Won Conversions', '${member.converted}',
                    AppColors.success, AppColors.successSoft),
                _buildModalStatTile('Active Pipeline', '${member.inProgress}',
                    AppColors.info, AppColors.infoSoft),
                _buildModalStatTile(
                    'Today Follow-ups',
                    '${member.todayFollowups}',
                    AppColors.warning,
                    AppColors.warningSoft),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _makePhoneCall(member.phone),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.phone_in_talk_rounded, size: 16),
                    label: const Text('Call Rep',
                        style: TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _openWhatsApp(member.phone),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF25D366),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.chat_rounded, size: 16),
                    label: const Text('WhatsApp',
                        style: TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 13)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModalStatTile(
      String label, String value, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w700, color: color)),
          Text(value,
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w900, color: color)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalReps = _team.length;
    final activeReps = _team.where((m) => m.isActive).length;
    final totalLeads = _team.fold(0, (sum, m) => sum + m.totalAssigned);
    final totalWon = _team.fold(0, (sum, m) => sum + m.converted);
    final avgConversion =
        totalLeads > 0 ? ((totalWon / totalLeads) * 100).round() : 0;

    final processedList = _processedTeam;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Sales Team Directory',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Manager Operations Center',
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
            tooltip: 'Toggle View Layout',
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: _fetchTeamMembers,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5))
            : RefreshIndicator(
                onRefresh: _fetchTeamMembers,
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
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // 1. KPI STRIP
                      GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.8,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildKpiCard(
                              'TOTAL SALES REPS',
                              '$totalReps',
                              '$activeReps Active',
                              Icons.groups_rounded,
                              AppColors.primary,
                              AppColors.primarySoft),
                          _buildKpiCard(
                              'MANAGED LEADS',
                              '$totalLeads',
                              'Assigned total',
                              Icons.assignment_turned_in_rounded,
                              AppColors.info,
                              AppColors.infoSoft),
                          _buildKpiCard(
                              'TOTAL WON',
                              '$totalWon',
                              'Closed successfully',
                              Icons.trending_up_rounded,
                              AppColors.success,
                              AppColors.successSoft),
                          _buildKpiCard(
                              'AVG EFFICIENCY',
                              '$avgConversion%',
                              'Team win rate',
                              Icons.pie_chart_rounded,
                              AppColors.warning,
                              AppColors.warningSoft),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 2. SEARCH & FILTERS
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            TextField(
                              controller: _searchController,
                              onChanged: (_) => setState(() {}),
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                hintText:
                                    'Search sales rep name, email, phone...',
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
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _statusFilter,
                                    decoration: const InputDecoration(
                                        contentPadding: EdgeInsets.symmetric(
                                            horizontal: 10, vertical: 8),
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
                                          value: 'ACTIVE',
                                          child: Text('Active Only')),
                                      DropdownMenuItem(
                                          value: 'INACTIVE',
                                          child: Text('Inactive Only')),
                                    ],
                                    onChanged: (val) =>
                                        setState(() => _statusFilter = val!),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _sortBy,
                                    decoration: const InputDecoration(
                                        contentPadding: EdgeInsets.symmetric(
                                            horizontal: 10, vertical: 8),
                                        filled: true,
                                        fillColor: AppColors.bg),
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w700),
                                    items: const [
                                      DropdownMenuItem(
                                          value: 'name_asc',
                                          child: Text('Name (A - Z)')),
                                      DropdownMenuItem(
                                          value: 'name_desc',
                                          child: Text('Name (Z - A)')),
                                      DropdownMenuItem(
                                          value: 'leads_desc',
                                          child: Text('Most Leads')),
                                      DropdownMenuItem(
                                          value: 'won_desc',
                                          child: Text('Highest Won')),
                                    ],
                                    onChanged: (val) =>
                                        setState(() => _sortBy = val!),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 3. TEAM MEMBERS DIRECTORY
                      if (processedList.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border)),
                          child: const Column(
                            children: [
                              Icon(Icons.groups_outlined,
                                  size: 40, color: AppColors.textMuted),
                              SizedBox(height: 10),
                              Text('No Sales Reps Found',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15,
                                      color: AppColors.textPrimary)),
                              SizedBox(height: 4),
                              Text(
                                  'Try adjusting your search query or status filter.',
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
                          itemCount: processedList.length,
                          itemBuilder: (context, index) {
                            final member = processedList[index];
                            final avatarUrl =
                                _getFormattedImageUrl(member.profileImage);

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
                                        radius: 22,
                                        backgroundColor: AppColors.primaryDark,
                                        backgroundImage: avatarUrl != null
                                            ? NetworkImage(avatarUrl)
                                            : null,
                                        child: avatarUrl == null
                                            ? Text(
                                                _getInitials(member.fullName),
                                                style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 13))
                                            : null,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(member.fullName,
                                                style: const TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 15,
                                                    color:
                                                        AppColors.textPrimary)),
                                            Text(member.email,
                                                style: const TextStyle(
                                                    fontSize: 12,
                                                    color: AppColors
                                                        .textSecondary)),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: member.isActive
                                              ? AppColors.successSoft
                                              : AppColors.dangerSoft,
                                          borderRadius:
                                              BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          member.isActive
                                              ? 'ACTIVE'
                                              : 'INACTIVE',
                                          style: TextStyle(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w800,
                                              color: member.isActive
                                                  ? AppColors.success
                                                  : AppColors.danger),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  // Conversion Efficiency Progress Bar
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('CONVERSION EFFICIENCY',
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.textSecondary)),
                                      Text('${member.conversionRate}%',
                                          style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.primary)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: LinearProgressIndicator(
                                      value: member.conversionRate / 100,
                                      minHeight: 6,
                                      backgroundColor: AppColors.hover,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceAround,
                                    children: [
                                      _buildMiniStat(
                                          'Assigned',
                                          '${member.totalAssigned}',
                                          AppColors.textPrimary),
                                      _buildMiniStat(
                                          'Won',
                                          '${member.converted}',
                                          AppColors.success),
                                      _buildMiniStat(
                                          'In Progress',
                                          '${member.inProgress}',
                                          AppColors.info),
                                      _buildMiniStat(
                                          'Today Due',
                                          '${member.todayFollowups}',
                                          AppColors.warning),
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
                                      TextButton.icon(
                                        onPressed: () =>
                                            _showMemberDetailModal(member),
                                        icon: const Icon(
                                            Icons.visibility_outlined,
                                            size: 16),
                                        label: const Text('Full Performance',
                                            style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700)),
                                      ),
                                      Row(
                                        children: [
                                          IconButton(
                                            icon: const Icon(
                                                Icons.phone_in_talk_rounded,
                                                size: 18,
                                                color: AppColors.primary),
                                            onPressed: () =>
                                                _makePhoneCall(member.phone),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.chat_rounded,
                                                size: 18,
                                                color: Color(0xFF128C7E)),
                                            onPressed: () =>
                                                _openWhatsApp(member.phone),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                        )
                      else
                        // LIST DENSE VIEW
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: processedList.length,
                          itemBuilder: (context, index) {
                            final member = processedList[index];
                            final avatarUrl =
                                _getFormattedImageUrl(member.profileImage);

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border)),
                              child: ListTile(
                                onTap: () => _showMemberDetailModal(member),
                                leading: CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppColors.primaryDark,
                                  backgroundImage: avatarUrl != null
                                      ? NetworkImage(avatarUrl)
                                      : null,
                                  child: avatarUrl == null
                                      ? Text(_getInitials(member.fullName),
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w800,
                                              fontSize: 11))
                                      : null,
                                ),
                                title: Text(member.fullName,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13.5)),
                                subtitle: Text(
                                    '${member.totalAssigned} Leads • ${member.converted} Won (${member.conversionRate}%)',
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary)),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(
                                          Icons.phone_in_talk_rounded,
                                          size: 18,
                                          color: AppColors.primary),
                                      onPressed: () =>
                                          _makePhoneCall(member.phone),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.chat_rounded,
                                          size: 18, color: Color(0xFF128C7E)),
                                      onPressed: () =>
                                          _openWhatsApp(member.phone),
                                    ),
                                  ],
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

  Widget _buildMiniStat(String label, String val, Color color) {
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
