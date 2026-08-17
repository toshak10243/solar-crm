import api from "../api/axios";

// Manager Dashboard — team-wide stats
// Returns: { statusBreakdown, teamPerformance, pendingToday, convertedToday, recentActivity }
export const getManagerDashboardStats = async (params) => {
  const response = await api.get("/dashboard/manager", { params });
  return response.data;
};

// Sales Dashboard — personal stats
// Returns: { total_assigned, new_leads, today_followups, pending_followups,
//            converted, lost, upcoming_site_visits, activityTimeline }
export const getSalesDashboardStats = async (params) => {
  const response = await api.get("/dashboard/sales", { params });
  return response.data;
};

// Admin Dashboard — org-wide stats
// Returns: { total_leads, won_leads, lost_leads, active_leads, total_managers,
//            total_sales, total_revenue, total_installed_kw, statusBreakdown,
//            sourcePerformance, monthlyTrend, recentLeads, activityFeed }
export const getAdminDashboardStats = async () => {
  const response = await api.get("/dashboard/admin");
  return response.data;
};