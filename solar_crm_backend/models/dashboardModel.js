const { db } = require("../config/db");

// 1. Status-wise breakdown (team-wide + manager leads)
const getStatusBreakdown = async (managerId) => {
  const query = `
    SELECT l.status, COUNT(*) AS count
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE (u.manager_id = ? OR l.assigned_to = ? OR l.created_by = ?)
      AND l.is_deleted = 0
    GROUP BY l.status
  `;
  const [rows] = await db.query(query, [managerId, managerId, managerId]);
  return rows;
};

// 2. Per-salesperson performance count (+ Revenue calculation)
const getTeamPerformance = async (managerId) => {
  const query = `
    SELECT 
      u.id, u.full_name, u.email, u.phone, u.status, u.profile_image,
      COUNT(l.id) AS total_assigned,
      SUM(CASE WHEN l.status = 'Won' THEN 1 ELSE 0 END) AS converted,
      SUM(CASE WHEN l.status = 'Lost' THEN 1 ELSE 0 END) AS lost,
      SUM(CASE WHEN l.status NOT IN ('Won','Lost','Not Interested') THEN 1 ELSE 0 END) AS in_progress,
      COALESCE(SUM(CASE WHEN l.status = 'Won' THEN (COALESCE(l.required_kw, 0) * 50000) ELSE 0 END), 0) AS revenue
    FROM users u
    LEFT JOIN leads l ON l.assigned_to = u.id AND l.is_deleted = 0
    WHERE (u.manager_id = ? OR u.id = ?) AND u.is_deleted = 0
    GROUP BY u.id
  `;
  const [rows] = await db.query(query, [managerId, managerId]);
  return rows;
};

// 3. Today's pending follow-ups count
const getPendingToday = async (managerId) => {
  const query = `
    SELECT COUNT(*) AS pending_today
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE (u.manager_id = ? OR l.assigned_to = ? OR l.created_by = ?)
      AND l.next_follow_up_date = CURDATE() 
      AND l.is_deleted = 0
  `;
  const [rows] = await db.query(query, [managerId, managerId, managerId]);
  return rows[0]?.pending_today || 0;
};

// 4. Today's conversions
const getConvertedToday = async (managerId) => {
  const query = `
    SELECT COUNT(*) AS converted_today
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE (u.manager_id = ? OR l.assigned_to = ? OR l.created_by = ?)
      AND l.status = 'Won' 
      AND DATE(l.updated_at) = CURDATE() 
      AND l.is_deleted = 0
  `;
  const [rows] = await db.query(query, [managerId, managerId, managerId]);
  return rows[0]?.converted_today || 0;
};

// 5. Recent team activity feed
const getRecentActivity = async (managerId) => {
  const query = `
    SELECT al.*, l.lead_code, l.customer_name, per.full_name AS performed_by_name
    FROM lead_activity_logs al
    JOIN leads l ON al.lead_id = l.id
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN users per ON al.performed_by = per.id
    WHERE (u.manager_id = ? OR l.assigned_to = ? OR l.created_by = ?)
    ORDER BY al.created_at DESC
    LIMIT 20
  `;
  const [rows] = await db.query(query, [managerId, managerId, managerId]);
  return rows;
};

// 🟢 6. Today's Actionable Follow-ups Detailed List
const getTodaysFollowupsList = async (managerId) => {
  const query = `
    SELECT 
      l.id, 
      l.lead_code, 
      l.customer_name, 
      l.mobile_number AS phone,
      l.next_follow_up_date AS time,
      (l.next_follow_up_date < CURDATE()) AS is_overdue,
      u.full_name AS rep_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE l.next_follow_up_date <= CURDATE()
      AND l.status NOT IN ('Won','Lost','Not Interested')
      AND l.is_deleted = 0
      AND (u.manager_id = ? OR l.assigned_to = ? OR l.created_by = ?)
    ORDER BY l.next_follow_up_date ASC
  `;
  const [rows] = await db.query(query, [managerId, managerId, managerId]);
  return rows.map((r) => ({ ...r, is_overdue: Boolean(r.is_overdue) }));
};

// 🟢 7. Overdue Follow-ups Count
const getOverdueFollowupsCount = async (managerId) => {
  const query = `
    SELECT COUNT(*) AS overdue
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE l.next_follow_up_date < CURDATE()
      AND l.status NOT IN ('Won','Lost','Not Interested')
      AND l.is_deleted = 0
      AND (u.manager_id = ? OR l.assigned_to = ? OR l.created_by = ?)
  `;
  const [rows] = await db.query(query, [managerId, managerId, managerId]);
  return Number(rows[0]?.overdue || 0);
};

// 🟢 8. Sales Rep — Own Summary Cards
const getSalesSummary = async (userId) => {
  const query = `
    SELECT
      COUNT(*) AS total_assigned,
      SUM(CASE WHEN status = 'New Lead' THEN 1 ELSE 0 END) AS new_leads,
      SUM(CASE WHEN next_follow_up_date = CURDATE()
            AND status NOT IN ('Won','Lost','Not Interested') THEN 1 ELSE 0 END) AS today_followups,
      SUM(CASE WHEN next_follow_up_date < CURDATE()
            AND status NOT IN ('Won','Lost','Not Interested') THEN 1 ELSE 0 END) AS pending_followups,
      SUM(CASE WHEN status = 'Won' THEN 1 ELSE 0 END) AS converted,
      SUM(CASE WHEN status = 'Lost' THEN 1 ELSE 0 END) AS lost,
      SUM(CASE WHEN site_visit_date >= CURDATE()
            AND status NOT IN ('Won','Lost','Not Interested') THEN 1 ELSE 0 END) AS upcoming_site_visits
    FROM leads
    WHERE assigned_to = ? AND is_deleted = 0
  `;
  const [rows] = await db.query(query, [userId]);
  const r = rows[0] || {};
  return {
    total_assigned: Number(r.total_assigned) || 0,
    new_leads: Number(r.new_leads) || 0,
    today_followups: Number(r.today_followups) || 0,
    pending_followups: Number(r.pending_followups) || 0,
    converted: Number(r.converted) || 0,
    lost: Number(r.lost) || 0,
    upcoming_site_visits: Number(r.upcoming_site_visits) || 0,
  };
};

// 🟢 9. Sales Rep — Own Activity Timeline
const getSalesActivityTimeline = async (userId, limit = 20) => {
  const query = `
    SELECT al.*, l.lead_code, l.customer_name
    FROM lead_activity_logs al
    JOIN leads l ON al.lead_id = l.id
    WHERE al.performed_by = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `;
  const [rows] = await db.query(query, [userId, Number(limit)]);
  return rows;
};

// 🟢 10. Sales Rep — Own Status Breakdown (not team-wide)
const getSalesStatusBreakdown = async (userId) => {
  const query = `
    SELECT status, COUNT(*) AS count
    FROM leads
    WHERE assigned_to = ? AND is_deleted = 0
    GROUP BY status
  `;
  const [rows] = await db.query(query, [userId]);
  return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
};

// 🟢 11. Sales Rep — Own Today's + Overdue Follow-ups List
const getSalesFollowupsList = async (userId) => {
  const query = `
    SELECT id, lead_code, customer_name, mobile_number AS phone,
      next_follow_up_date,
      (next_follow_up_date < CURDATE()) AS is_overdue
    FROM leads
    WHERE assigned_to = ?
      AND next_follow_up_date <= CURDATE()
      AND status NOT IN ('Won','Lost','Not Interested')
      AND is_deleted = 0
    ORDER BY next_follow_up_date ASC
    LIMIT 10
  `;
  const [rows] = await db.query(query, [userId]);
  return rows.map((r) => ({ ...r, is_overdue: Boolean(r.is_overdue) }));
};

// ============ ADMIN DASHBOARD QUERIES ============

// 🟣 12. Admin — Org-wide Overview Cards
const getAdminOverview = async () => {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM leads WHERE is_deleted = 0) AS total_leads,
      (SELECT COUNT(*) FROM leads WHERE is_deleted = 0 AND status = 'Won') AS won_leads,
      (SELECT COUNT(*) FROM leads WHERE is_deleted = 0 AND status = 'Lost') AS lost_leads,
      (SELECT COUNT(*) FROM leads WHERE is_deleted = 0 AND status NOT IN ('Won','Lost','Not Interested')) AS active_leads,
      (SELECT COUNT(*) FROM users WHERE role_id = 2 AND is_deleted = 0) AS total_managers,
      (SELECT COUNT(*) FROM users WHERE role_id = 3 AND is_deleted = 0) AS total_sales,
      (SELECT COALESCE(SUM(quotation_amount), 0) FROM leads WHERE is_deleted = 0 AND status = 'Won') AS total_revenue,
      (SELECT COALESCE(SUM(required_kw), 0) FROM leads WHERE is_deleted = 0 AND status = 'Won') AS total_installed_kw
  `;
  const [rows] = await db.query(query);
  const r = rows[0] || {};
  return {
    total_leads: Number(r.total_leads) || 0,
    won_leads: Number(r.won_leads) || 0,
    lost_leads: Number(r.lost_leads) || 0,
    active_leads: Number(r.active_leads) || 0,
    total_managers: Number(r.total_managers) || 0,
    total_sales: Number(r.total_sales) || 0,
    total_revenue: Number(r.total_revenue) || 0,
    total_installed_kw: Number(r.total_installed_kw) || 0,
  };
};

// 🟣 13. Admin — Org-wide Status Breakdown
const getAdminStatusBreakdown = async () => {
  const [rows] = await db.query(
    `SELECT status, COUNT(*) AS count FROM leads WHERE is_deleted = 0 GROUP BY status`
  );
  return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
};

// 🟣 14. Admin — Lead Source Performance
const getAdminSourcePerformance = async () => {
  const [rows] = await db.query(`
    SELECT lead_source,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'Won' THEN 1 ELSE 0 END) AS won
    FROM leads
    WHERE is_deleted = 0
    GROUP BY lead_source
    ORDER BY total DESC
  `);
  return rows.map((r) => ({ lead_source: r.lead_source, total: Number(r.total), won: Number(r.won) }));
};

// 🟣 15. Admin — 6-Month Trend (Created vs Won)
const getAdminMonthlyTrend = async () => {
  const [[createdRows], [wonRows]] = await Promise.all([
    db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
      FROM leads
      WHERE is_deleted = 0 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
    `),
    db.query(`
      SELECT DATE_FORMAT(closed_at, '%Y-%m') AS month, COUNT(*) AS count
      FROM leads
      WHERE is_deleted = 0 AND status = 'Won' AND closed_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
    `),
  ]);

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleDateString("en-US", { month: "short" }) });
  }

  const createdMap = Object.fromEntries(createdRows.map((r) => [r.month, Number(r.count)]));
  const wonMap = Object.fromEntries(wonRows.map((r) => [r.month, Number(r.count)]));

  return months.map((m) => ({
    month: m.label,
    leads_created: createdMap[m.key] || 0,
    leads_won: wonMap[m.key] || 0,
  }));
};

// 🟣 16. Admin — Recent Leads (org-wide)
const getAdminRecentLeads = async (limit = 6) => {
  const [rows] = await db.query(
    `
    SELECT l.id, l.lead_code, l.customer_name, l.lead_source, l.status,
      l.quotation_amount, l.required_kw, l.created_at,
      u.full_name AS assigned_to_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE l.is_deleted = 0
    ORDER BY l.created_at DESC
    LIMIT ?
    `,
    [Number(limit)]
  );
  return rows;
};

// 🟣 17. Admin — Org-wide Activity Feed
const getAdminActivityFeed = async (limit = 15) => {
  const [rows] = await db.query(
    `
    SELECT al.*, l.lead_code, l.customer_name, u.full_name AS performed_by_name
    FROM lead_activity_logs al
    JOIN leads l ON al.lead_id = l.id
    LEFT JOIN users u ON al.performed_by = u.id
    ORDER BY al.created_at DESC
    LIMIT ?
    `,
    [Number(limit)]
  );
  return rows;
};

module.exports = {
  getStatusBreakdown,
  getTeamPerformance,
  getPendingToday,
  getConvertedToday,
  getRecentActivity,
  getTodaysFollowupsList,
  getOverdueFollowupsCount,
  getSalesSummary,
  getSalesActivityTimeline,
  getSalesStatusBreakdown,
  getSalesFollowupsList,
  getAdminOverview,           // 👈 new
  getAdminStatusBreakdown,    // 👈 new
  getAdminSourcePerformance,  // 👈 new
  getAdminMonthlyTrend,       // 👈 new
  getAdminRecentLeads,        // 👈 new
  getAdminActivityFeed,       // 👈 new
};