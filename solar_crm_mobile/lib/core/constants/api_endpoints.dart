class ApiEndpoints {
  // Direct Local Backend Network
  static const String baseUrl = "https://smartsunpower.tech/api";

  // Auth Endpoints
  static const String login = "/auth/login";
  static const String logout = "/auth/logout";
  static const String forgotPassword = "/auth/forgot-password";
  static const String resetPassword = "/auth/reset-password";

  // 🟢 PROFILE ENDPOINTS
  static const String profile = "/profile";
  static const String updateProfile = "/profile";
  static const String changePassword = "/profile/change-password";

  // 🟢 DASHBOARD ENDPOINTS (ADDED THESE MISSING CONSTANTS)
  static const String salesDashboard = "/dashboard/sales";
  static const String managerDashboard = "/dashboard/manager";
  static const String adminDashboard = "/dashboard/admin";

  // Operations
  static const String leads = "/leads";
  static const String assignLead = "/leads/assign";
  static const String followups = "/leads/followups";
  static const String users = "/users";
}
