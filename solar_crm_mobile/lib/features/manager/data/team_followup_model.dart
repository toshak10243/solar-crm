class TeamFollowupModel {
  final dynamic id;
  final String leadCode;
  final String customerName;
  final String phone;
  final dynamic assignedTo;
  final String assignedToName;
  final String? nextFollowUpDateRaw;
  final String dateFormatted;
  final String remarks;
  final String status; // OVERDUE / PENDING / COMPLETED (computed by backend)
  final String? leadStatus;

  static const String defaultRemark = 'No notes yet';

  TeamFollowupModel({
    required this.id,
    required this.leadCode,
    required this.customerName,
    required this.phone,
    required this.assignedTo,
    required this.assignedToName,
    required this.dateFormatted,
    required this.remarks,
    required this.status,
    this.nextFollowUpDateRaw,
    this.leadStatus,
  });

  factory TeamFollowupModel.fromJson(Map<String, dynamic> json) {
    String formattedDate = 'Not Scheduled';
    final rawDate = json['next_follow_up_date']?.toString();
    if (rawDate != null && rawDate.isNotEmpty && rawDate != 'null') {
      try {
        final d = DateTime.parse(rawDate).toLocal();
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
        formattedDate =
            '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}, ${h.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')} $ampm';
      } catch (_) {
        formattedDate = rawDate;
      }
    }

    final rawRemark = json['latest_remark']?.toString();
    final remarks = (rawRemark != null &&
            rawRemark.trim().isNotEmpty &&
            rawRemark != 'null')
        ? rawRemark
        : defaultRemark;

    return TeamFollowupModel(
      id: json['id'] ?? 0,
      leadCode: json['lead_code']?.toString() ?? 'LD000',
      customerName: json['customer_name']?.toString() ?? 'Customer',
      phone: json['phone']?.toString().trim().isNotEmpty == true
          ? json['phone'].toString()
          : 'N/A',
      assignedTo: json['assigned_to'],
      assignedToName: json['assigned_to_name']?.toString() ?? 'Unassigned',
      nextFollowUpDateRaw: rawDate,
      dateFormatted: formattedDate,
      remarks: remarks,
      status: (json['status']?.toString().trim().isNotEmpty == true
              ? json['status'].toString()
              : 'PENDING')
          .toUpperCase(),
      leadStatus: json['lead_status']?.toString(),
    );
  }
}
