class TeamMemberModel {
  final dynamic id;
  final String fullName;
  final String email;
  final String phone;
  final String? profileImage;
  final dynamic status;
  final int totalAssigned;
  final int converted;
  final int inProgress;
  final int todayFollowups;

  TeamMemberModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    this.profileImage,
    required this.status,
    required this.totalAssigned,
    required this.converted,
    required this.inProgress,
    required this.todayFollowups,
  });

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) {
    return TeamMemberModel(
      id: json['id'] ?? 0,
      fullName: json['full_name']?.toString() ?? 'Sales Rep',
      email: json['email']?.toString() ?? 'N/A',
      phone: json['phone']?.toString() ?? 'N/A',
      profileImage:
          json['profile_image']?.toString() ?? json['photo']?.toString(),
      status: json['status'],
      totalAssigned:
          int.tryParse(json['total_assigned']?.toString() ?? '0') ?? 0,
      converted: int.tryParse(json['converted']?.toString() ?? '0') ?? 0,
      inProgress: int.tryParse(json['in_progress']?.toString() ?? '0') ?? 0,
      todayFollowups:
          int.tryParse(json['today_followups']?.toString() ?? '0') ?? 0,
    );
  }

  bool get isActive {
    if (status == null) return false;
    return status == 1 ||
        status == '1' ||
        status == true ||
        status.toString().toLowerCase() == 'active';
  }

  int get conversionRate {
    if (totalAssigned == 0) return 0;
    return ((converted / totalAssigned) * 100).round();
  }
}
