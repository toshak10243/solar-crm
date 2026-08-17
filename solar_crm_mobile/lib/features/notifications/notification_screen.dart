import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/network/api_client.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({Key? key}) : super(key: key);

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    try {
      final res = await _apiClient.dio.get('/notifications');
      if (mounted) {
        setState(() {
          _notifications = res.data['data'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAllRead() async {
    try {
      await _apiClient.dio.patch('/notifications/mark-all-read');
      if (mounted) {
        setState(() {
          for (var n in _notifications) {
            n['is_read'] = 1;
          }
        });
      }
    } catch (e) {
      print('Mark all read failed: $e');
    }
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    final date = DateTime.tryParse(dateStr);
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Abhi';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m pehle';
    if (diff.inHours < 24) return '${diff.inHours}h pehle';
    if (diff.inDays < 7) return '${diff.inDays}d pehle';
    return '${date.day}/${date.month}/${date.year}';
  }

  IconData _getIcon(String? type) {
    switch (type) {
      case 'lead_assigned':
        return Icons.assignment_ind_rounded;
      case 'lead_created':
        return Icons.add_circle_outline_rounded;
      case 'lead_won':
        return Icons.emoji_events_rounded;
      case 'lead_lost':
        return Icons.cancel_rounded;
      case 'followup_today':
        return Icons.event_available_rounded;
      case 'followup_added':
        return Icons.note_add_rounded;
      case 'status_changed':
        return Icons.sync_alt_rounded;
      case 'site_visit_reminder':
        return Icons.location_on_rounded;
      case 'overdue_summary':
        return Icons.warning_amber_rounded;
      case 'bulk_import':
        return Icons.upload_file_rounded;
      case 'weekly_summary':
        return Icons.bar_chart_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getColor(String? type) {
    switch (type) {
      case 'lead_won':
        return AppColors.success;
      case 'lead_lost':
        return AppColors.danger;
      case 'overdue_summary':
        return AppColors.danger;
      case 'lead_assigned':
      case 'lead_created':
        return AppColors.primary;
      case 'followup_today':
      case 'site_visit_reminder':
        return const Color(0xFFD97706);
      case 'weekly_summary':
        return const Color(0xFF7C3AED);
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => n['is_read'] == 0).length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Notifications',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
            if (unreadCount > 0)
              Text('$unreadCount unread',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary)),
          ],
        ),
        backgroundColor: AppColors.card,
        elevation: 0,
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary)),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _notifications.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none_rounded,
                          size: 56, color: AppColors.textMuted),
                      SizedBox(height: 14),
                      Text('No notifications yet',
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              color: AppColors.textPrimary)),
                      SizedBox(height: 4),
                      Text("You're all caught up!",
                          style: TextStyle(
                              fontSize: 12.5, color: AppColors.textSecondary)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchNotifications,
                  color: AppColors.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final n = _notifications[index];
                      final isUnread = n['is_read'] == 0;
                      final color = _getColor(n['type']?.toString());

                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        decoration: BoxDecoration(
                          color:
                              isUnread ? AppColors.primarySoft : AppColors.card,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isUnread
                                ? AppColors.primary.withOpacity(0.3)
                                : AppColors.border,
                          ),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                          leading: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(_getIcon(n['type']?.toString()),
                                color: color, size: 22),
                          ),
                          title: Text(
                            n['title']?.toString() ?? '',
                            style: TextStyle(
                              fontWeight:
                                  isUnread ? FontWeight.w800 : FontWeight.w600,
                              fontSize: 13.5,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 3),
                              Text(
                                n['body']?.toString() ?? '',
                                style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 5),
                              Text(
                                _timeAgo(n['created_at']?.toString()),
                                style: const TextStyle(
                                    fontSize: 11, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                          trailing: isUnread
                              ? Container(
                                  width: 9,
                                  height: 9,
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                )
                              : null,
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
