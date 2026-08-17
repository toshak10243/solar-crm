class LeadModel {
  final int id;
  final String leadCode;
  final String customerName;
  final String mobileNumber;
  final String? email;
  final String? city;
  final String? state;
  final String? pincode;
  final String? address;
  final String? solarRequirement;
  final String? leadSource;
  final String? assignedByName;
  final String? createdAt;

  final String status; // pipeline status
  final String priority; // Low / Medium / High
  final String? nextFollowUpDate;

  final String interestStatus; // Pending / Interested / Not Interested
  final num? requiredKw;
  final String? remark;

  final num? quotationAmount;
  final String? siteVisitDate;

  LeadModel({
    required this.id,
    required this.leadCode,
    required this.customerName,
    required this.mobileNumber,
    this.email,
    this.city,
    this.state,
    this.pincode,
    this.address,
    this.solarRequirement,
    this.leadSource,
    this.assignedByName,
    this.createdAt,
    this.status = 'New Lead',
    this.priority = 'Medium',
    this.nextFollowUpDate,
    this.interestStatus = 'Pending',
    this.requiredKw,
    this.remark,
    this.quotationAmount,
    this.siteVisitDate,
  });

  factory LeadModel.fromJson(Map<String, dynamic> json) {
    return LeadModel(
      id: json['id'] is int ? json['id'] : int.tryParse('${json['id']}') ?? 0,
      leadCode: json['lead_code']?.toString() ?? '',
      customerName: json['customer_name']?.toString() ?? '',
      mobileNumber: json['mobile_number']?.toString() ?? '',
      email: json['email']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      pincode: json['pincode']?.toString(),
      address: json['address']?.toString(),
      solarRequirement: json['solar_requirement']?.toString(),
      leadSource: json['lead_source']?.toString(),
      assignedByName: json['assigned_by_name']?.toString(),
      createdAt: json['created_at']?.toString(),
      status: json['status']?.toString() ?? 'New Lead',
      priority: json['priority']?.toString() ?? 'Medium',
      nextFollowUpDate: json['next_follow_up_date']?.toString(),
      interestStatus: json['interest_status']?.toString() ?? 'Pending',
      requiredKw: json['required_kw'] is num
          ? json['required_kw']
          : num.tryParse('${json['required_kw']}'),
      remark: json['remark']?.toString(),
      quotationAmount: json['quotation_amount'] is num
          ? json['quotation_amount']
          : num.tryParse('${json['quotation_amount']}'),
      siteVisitDate: json['site_visit_date']?.toString(),
    );
  }
}

class FollowupModel {
  final int id;
  final String note;
  final String followupType;
  final String? followUpDate;
  final String? createdAt;

  FollowupModel({
    required this.id,
    required this.note,
    required this.followupType,
    this.followUpDate,
    this.createdAt,
  });

  factory FollowupModel.fromJson(Map<String, dynamic> json) {
    return FollowupModel(
      id: json['id'] is int ? json['id'] : int.tryParse('${json['id']}') ?? 0,
      note: json['note']?.toString() ?? '',
      followupType: json['followup_type']?.toString() ?? 'Call',
      followUpDate: json['follow_up_date']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }
}

class ActivityLogModel {
  final int id;
  final String actionType;
  final String? remark;
  final String? oldValue;
  final String? newValue;
  final String? performedByName;
  final String? createdAt;

  ActivityLogModel({
    required this.id,
    required this.actionType,
    this.remark,
    this.oldValue,
    this.newValue,
    this.performedByName,
    this.createdAt,
  });

  factory ActivityLogModel.fromJson(Map<String, dynamic> json) {
    return ActivityLogModel(
      id: json['id'] is int ? json['id'] : int.tryParse('${json['id']}') ?? 0,
      actionType: json['action_type']?.toString() ?? 'Activity',
      remark: json['remark']?.toString(),
      oldValue: json['old_value']?.toString(),
      newValue: json['new_value']?.toString(),
      performedByName: json['performed_by_name']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }
}
