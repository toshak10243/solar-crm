const { db } = require("../config/db");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

// ======================================
// 1. Create Lead
// ======================================
const createLead = async (data, createdBy) => {
  const {
    customer_name,
    mobile_number,
    alternate_number,
    email,
    address,
    city,
    state,
    pincode,
    solar_requirement,
    interest_status,
    required_kw,
    remark,
    lead_source,
    priority,
    status,
    assigned_to,
    assigned_by,
    next_follow_up_date,
    site_visit_date,
    quotation_amount,
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO leads (
      lead_code, customer_name, mobile_number, alternate_number, email,
      address, city, state, pincode, solar_requirement, interest_status,
      required_kw, remark, lead_source, priority, status, assigned_to,
      assigned_by, created_by, next_follow_up_date, site_visit_date, quotation_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "",
      customer_name,
      mobile_number,
      alternate_number || null,
      email || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      solar_requirement || "Residential",
      interest_status || "Pending",
      required_kw || null,
      remark || null,
      lead_source || "Other",
      priority || "Medium",
      status || "New Lead",
      assigned_to || null,
      assigned_by || (assigned_to ? createdBy : null),
      createdBy,
      next_follow_up_date || null,
      site_visit_date || null,
      quotation_amount || null,
    ]
  );

  const leadId = result.insertId;
  const leadCode = `LD${String(leadId).padStart(6, "0")}`;

  await db.query(`UPDATE leads SET lead_code=? WHERE id=?`, [leadCode, leadId]);

  if (assigned_to) {
    await db.query(
      `INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by) VALUES (?, ?, ?)`,
      [leadId, assigned_to, assigned_by || createdBy]
    );
  }

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark, performed_by)
     VALUES (?, 'Lead Created', ?, 'New lead registered', ?)`,
    [leadId, leadCode, createdBy]
  );

  return { id: leadId, lead_code: leadCode };
};

// ======================================
// 2. Get All Leads (Paginated + Filtered) — FIXED: role_id based, fail-closed
// ======================================
const getLeads = async (params, roleId, userId) => {
  const {
    page = 1, limit = 10, search = "", status = "", priority = "",
    lead_source = "", assigned_to = "", manager_id = "",
  } = params;

  const offset = (Number(page) - 1) * Number(limit);
  const role = Number(roleId);
  let whereConditions = ["l.is_deleted = 0"];
  let queryParams = [];

  // Role-based Scoping — role_id based now, not role_name string
  if (role === ROLE_SALES) {
    whereConditions.push("l.assigned_to = ?");
    queryParams.push(userId);
  } else if (role === ROLE_MANAGER) {
    whereConditions.push(
      `(l.assigned_to IN (SELECT id FROM users WHERE manager_id = ?) OR l.assigned_to = ? OR l.created_by = ?)`
    );
    queryParams.push(userId, userId, userId);
  } else if (role !== ROLE_SUPER_ADMIN) {
    // Unrecognized role -> show NOTHING (fail-closed, not fail-open)
    whereConditions.push("1 = 0");
  }

  if (search) {
    whereConditions.push(`(l.lead_code LIKE ? OR l.customer_name LIKE ? OR l.mobile_number LIKE ? OR l.city LIKE ?)`);
    const term = `%${search}%`;
    queryParams.push(term, term, term, term);
  }
  if (status) { whereConditions.push("l.status = ?"); queryParams.push(status); }
  if (priority) { whereConditions.push("l.priority = ?"); queryParams.push(priority); }
  if (lead_source) { whereConditions.push("l.lead_source = ?"); queryParams.push(lead_source); }
  if (assigned_to) { whereConditions.push("l.assigned_to = ?"); queryParams.push(assigned_to); }
  if (manager_id) { whereConditions.push("u_assignee.manager_id = ?"); queryParams.push(manager_id); }

  const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM leads l
     LEFT JOIN users u_assignee ON l.assigned_to = u_assignee.id
     ${whereClause}`,
    queryParams
  );
  const total = countRows[0].total;

  const [rows] = await db.query(
    `
    SELECT l.*, u_assignee.full_name AS assigned_to_name,
      u_assigner.full_name AS assigned_by_name, u_creator.full_name AS created_by_name
    FROM leads l
    LEFT JOIN users u_assignee ON l.assigned_to = u_assignee.id
    LEFT JOIN users u_assigner ON l.assigned_by = u_assigner.id
    LEFT JOIN users u_creator ON l.created_by = u_creator.id
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [...queryParams, Number(limit), Number(offset)]
  );

  return { total, page: Number(page), limit: Number(limit), data: rows };
};

// ======================================
// 3. Get Lead By ID
// ======================================
const getLeadById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT l.*, u_assignee.full_name AS assigned_to_name,
      u_assigner.full_name AS assigned_by_name, u_creator.full_name AS created_by_name
    FROM leads l
    LEFT JOIN users u_assignee ON l.assigned_to = u_assignee.id
    LEFT JOIN users u_assigner ON l.assigned_by = u_assigner.id
    LEFT JOIN users u_creator ON l.created_by = u_creator.id
    WHERE l.id = ? AND l.is_deleted = 0
    `,
    [id]
  );
  return rows;
};

// ======================================
// 3b. Ownership Guard (Sales/Manager access check for a single lead)
// ======================================
const isLeadAccessibleByUser = async (leadId, roleId, userId) => {
  const role = Number(roleId);
  if (role === ROLE_SUPER_ADMIN) return true;

  if (role === ROLE_SALES) {
    const [rows] = await db.query(
      `SELECT id FROM leads WHERE id = ? AND assigned_to = ? AND is_deleted = 0`,
      [leadId, userId]
    );
    return rows.length > 0;
  }

  if (role === ROLE_MANAGER) {
    const [rows] = await db.query(
      `
      SELECT l.id FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = ? AND l.is_deleted = 0
        AND (u.manager_id = ? OR l.assigned_to = ? OR l.created_by = ?)
      `,
      [leadId, userId, userId, userId]
    );
    return rows.length > 0;
  }

  return false;
};

// ======================================
// 3c. Get Team-wide Follow-ups List (Manager)
// Returns every lead (assigned to their team, to themself, or created by them)
// that has a next_follow_up_date set, along with the latest follow-up note.
// ======================================
const getTeamFollowupsList = async (managerId) => {
  const [rows] = await db.query(
    `
    SELECT
      l.id, l.lead_code, l.customer_name, l.mobile_number AS phone,
      l.next_follow_up_date, l.status AS lead_status,
      u.id AS assigned_to, u.full_name AS assigned_to_name,
      lf.note AS latest_remark, lf.followup_type AS latest_type, lf.created_at AS latest_followup_at
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN (
      SELECT f1.lead_id, f1.note, f1.followup_type, f1.created_at
      FROM lead_followups f1
      INNER JOIN (
        SELECT lead_id, MAX(created_at) AS max_created
        FROM lead_followups
        GROUP BY lead_id
      ) f2 ON f1.lead_id = f2.lead_id AND f1.created_at = f2.max_created
    ) lf ON lf.lead_id = l.id
    WHERE l.next_follow_up_date IS NOT NULL
      AND l.is_deleted = 0
      AND (u.manager_id = ? OR l.assigned_to = ? OR l.created_by = ?)
    ORDER BY l.next_follow_up_date ASC
    `,
    [managerId, managerId, managerId]
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rows.map((r) => {
    const closed = ["Won", "Lost", "Not Interested"].includes(r.lead_status);
    const dueDate = new Date(r.next_follow_up_date);
    dueDate.setHours(0, 0, 0, 0);

    let status;
    if (closed) status = "COMPLETED";
    else if (dueDate < today) status = "OVERDUE";
    else status = "PENDING";

    return {
      id: r.id,
      lead_code: r.lead_code,
      customer_name: r.customer_name,
      phone: r.phone,
      next_follow_up_date: r.next_follow_up_date,
      lead_status: r.lead_status,
      assigned_to: r.assigned_to,
      assigned_to_name: r.assigned_to_name || "Unassigned",
      latest_remark: r.latest_remark || null,
      latest_type: r.latest_type || null,
      latest_followup_at: r.latest_followup_at || null,
      status,
    };
  });
};

// ======================================
// 4. Update Lead (full edit)
// NOTE: needs the FULL lead object in body every time — customer_name,
// mobile_number etc. are NOT NULL columns and mysql2 throws if a bind
// param is undefined. Frontend flow should be: GET lead -> prefill edit
// form -> submit ALL fields back, even unchanged ones.
// ======================================
const updateLead = async (id, data, updatedBy) => {
  const {
    customer_name, mobile_number, alternate_number, email, address, city,
    state, pincode, solar_requirement, interest_status, required_kw,
    remark, lead_source, priority, next_follow_up_date, site_visit_date,
    quotation_amount, assigned_to,
  } = data;

  // Current assignment nikal lo, taaki pata chale actually badla ya nahi
  const [currentRows] = await db.query(
    `SELECT assigned_to, assigned_by FROM leads WHERE id=? AND is_deleted=0`,
    [id]
  );
  const previousAssignedTo = currentRows[0]?.assigned_to ?? null;
  const previousAssignedBy = currentRows[0]?.assigned_by ?? null;
  const newAssignedTo = assigned_to || null;
  const assignmentChanged = String(previousAssignedTo || "") !== String(newAssignedTo || "");
  const newAssignedBy = assignmentChanged && newAssignedTo ? updatedBy : previousAssignedBy;

  const [result] = await db.query(
    `
    UPDATE leads SET
      customer_name=?, mobile_number=?, alternate_number=?, email=?, address=?,
      city=?, state=?, pincode=?, solar_requirement=?, interest_status=?,
      required_kw=?, remark=?, lead_source=?, priority=?, next_follow_up_date=?,
      site_visit_date=?, quotation_amount=?, assigned_to=?, assigned_by=?
    WHERE id=? AND is_deleted=0
    `,
    [
      customer_name, mobile_number, alternate_number || null, email || null,
      address || null, city || null, state || null, pincode || null,
      solar_requirement, interest_status, required_kw || null, remark || null,
      lead_source, priority, next_follow_up_date || null, site_visit_date || null,
      quotation_amount || null, newAssignedTo, newAssignedBy, id,
    ]
  );

  // Assignment genuinely badla ho to history + proper activity-log entry banao
  if (assignmentChanged && newAssignedTo) {
    await db.query(
      `INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by) VALUES (?, ?, ?)`,
      [id, newAssignedTo, updatedBy]
    );

    await db.query(
      `INSERT INTO lead_activity_logs (lead_id, action_type, old_value, new_value, performed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        previousAssignedTo ? "Lead Reassigned" : "Lead Assigned",
        previousAssignedTo ? String(previousAssignedTo) : null,
        String(newAssignedTo),
        updatedBy,
      ]
    );
  }

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, remark, performed_by)
     VALUES (?, 'Lead Updated', 'Lead information updated', ?)`,
    [id, updatedBy]
  );

  return result;
};

// ======================================
// 5. Update Status (Pipeline Step)
// ======================================
const updateLeadStatus = async (id, payload, performedBy) => {
  const { status: newStatus, remark, quotation_amount, site_visit_date } = payload;

  const [leadRows] = await db.query(
    `SELECT status FROM leads WHERE id=? AND is_deleted=0`,
    [id]
  );
  const oldStatus = leadRows[0]?.status || "Unknown";

  let closedAt = null;
  if (["Won", "Lost", "Not Interested"].includes(newStatus)) {
    closedAt = new Date();
  }

  const [result] = await db.query(
    `
    UPDATE leads
    SET status=?,
        closed_at = COALESCE(?, closed_at),
        quotation_amount = COALESCE(?, quotation_amount),
        site_visit_date = COALESCE(?, site_visit_date)
    WHERE id=? AND is_deleted=0
    `,
    [newStatus, closedAt, quotation_amount ?? null, site_visit_date ?? null, id]
  );

  let actionType = "Status Changed";
  if (newStatus === "Won" || newStatus === "Lost") actionType = "Lead Closed";
  else if (newStatus === "Quotation Sent" && quotation_amount) actionType = "Quotation Sent";
  else if (newStatus === "Site Visit Scheduled" && site_visit_date) actionType = "Site Visit Scheduled";

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, old_value, new_value, remark, performed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, actionType, oldStatus, newStatus, remark || `Status changed from ${oldStatus} to ${newStatus}`, performedBy]
  );

  return result;
};

// ======================================
// 6. Assign / Reassign Lead
// ======================================
const assignLead = async (id, assignedTo, assignedBy) => {
  const [currentRows] = await db.query(
    `SELECT assigned_to FROM leads WHERE id=? AND is_deleted=0`,
    [id]
  );
  const previousAssignedTo = currentRows[0]?.assigned_to;
  const isReassignment = Boolean(previousAssignedTo);

  const [result] = await db.query(
    `UPDATE leads SET assigned_to=?, assigned_by=? WHERE id=? AND is_deleted=0`,
    [assignedTo, assignedBy, id]
  );

  await db.query(
    `INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by) VALUES (?, ?, ?)`,
    [id, assignedTo, assignedBy]
  );

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, old_value, new_value, performed_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id, isReassignment ? "Lead Reassigned" : "Lead Assigned",
      previousAssignedTo ? String(previousAssignedTo) : null, String(assignedTo), assignedBy,
    ]
  );

  return result;
};

// ======================================
// 7. Add Follow-up Note
// ======================================
const addFollowup = async (leadId, data, createdBy) => {
  const { note, followup_type, status_after_followup, follow_up_date } = data;

  const [result] = await db.query(
    `INSERT INTO lead_followups (lead_id, note, followup_type, status_after_followup, follow_up_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [leadId, note, followup_type || "Call", status_after_followup || null, follow_up_date || null, createdBy]
  );

  if (status_after_followup || follow_up_date) {
    let updates = [];
    let queryParams = [];
    if (status_after_followup) { updates.push("status=?"); queryParams.push(status_after_followup); }
    if (follow_up_date) { updates.push("next_follow_up_date=?"); queryParams.push(follow_up_date); }
    queryParams.push(leadId);
    await db.query(`UPDATE leads SET ${updates.join(", ")} WHERE id=?`, queryParams);
  }

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, remark, performed_by)
     VALUES (?, 'Follow-up Added', ?, ?)`,
    [leadId, note.substring(0, 200), createdBy]
  );

  return result;
};

// ======================================
// 8. Get Follow-ups Timeline
// ======================================
const getFollowups = async (leadId) => {
  const [rows] = await db.query(
    `SELECT f.*, u.full_name AS created_by_name
     FROM lead_followups f LEFT JOIN users u ON f.created_by = u.id
     WHERE f.lead_id = ? ORDER BY f.created_at DESC`,
    [leadId]
  );
  return rows;
};

// ======================================
// 9. Get Activity Logs
// ======================================
const getActivityLogs = async (leadId) => {
  const [rows] = await db.query(
    `SELECT l.*, u.full_name AS performed_by_name
     FROM lead_activity_logs l LEFT JOIN users u ON l.performed_by = u.id
     WHERE l.lead_id = ? ORDER BY l.created_at DESC`,
    [leadId]
  );
  return rows;
};

// ======================================
// 10. Soft Delete Lead
// ======================================
const deleteLead = async (id, deletedBy) => {
  const [result] = await db.query(`UPDATE leads SET is_deleted=1 WHERE id=?`, [id]);
  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, remark, performed_by)
     VALUES (?, 'Lead Closed', 'Lead soft deleted', ?)`,
    [id, deletedBy]
  );
  return result;
};

// ======================================
// 11. Bulk Reassign (Offboarding case)
// Transaction-safe: sab ya kuch nahi, half-reassigned state kabhi nahi banega
// ======================================
const bulkReassignLeads = async (fromUserId, toUserId, performedBy) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Sirf OPEN leads move hongi — Won/Lost/Not Interested waisi hi rahengi
    const [openLeads] = await connection.query(
      `SELECT id FROM leads
       WHERE assigned_to = ? AND is_deleted = 0
         AND status NOT IN ('Won','Lost','Not Interested')`,
      [fromUserId]
    );

    for (const lead of openLeads) {
      await connection.query(
        `UPDATE leads SET assigned_to=?, assigned_by=? WHERE id=?`,
        [toUserId, performedBy, lead.id]
      );
      await connection.query(
        `INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by) VALUES (?, ?, ?)`,
        [lead.id, toUserId, performedBy]
      );
      await connection.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, old_value, new_value, remark, performed_by)
         VALUES (?, 'Lead Reassigned', ?, ?, 'Bulk reassignment (offboarding)', ?)`,
        [lead.id, String(fromUserId), String(toUserId), performedBy]
      );
    }

    await connection.commit();
    return { reassignedCount: openLeads.length };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ======================================
// 12. Bulk Import Leads (CSV/Excel Upload)
// Best-effort insert — jo row valid hai save ho jayegi,
// jo fail ho uska reason wapas aayega, sab-ya-kuch-nahi nahi hai
// ======================================
const bulkImportLeads = async (rows, createdBy) => {
  const results = { imported: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const {
        customer_name, mobile_number, alternate_number, email, address,
        city, state, pincode, solar_requirement, interest_status,
        required_kw, lead_source, priority, remark,
      } = row;

      // Basic validation (defense-in-depth, frontend bhi check karega)
      if (!customer_name || !String(customer_name).trim()) {
        throw new Error("Customer name is required");
      }
      if (!mobile_number || !/^\d{10}$/.test(String(mobile_number).trim())) {
        throw new Error("Invalid or missing 10-digit mobile number");
      }

      const [result] = await db.query(
        `
        INSERT INTO leads (
          lead_code, customer_name, mobile_number, alternate_number, email,
          address, city, state, pincode, solar_requirement, interest_status,
          required_kw, remark, lead_source, priority, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Lead', ?)
        `,
        [
          "",
          String(customer_name).trim(),
          String(mobile_number).trim(),
          alternate_number || null,
          email || null,
          address || null,
          city || null,
          state || null,
          pincode || null,
          solar_requirement || "Residential",
          interest_status || "Pending",
          required_kw || null,
          remark || null,
          lead_source || "Other",
          priority || "Medium",
          createdBy,
        ]
      );

      const leadId = result.insertId;
      const leadCode = `LD${String(leadId).padStart(6, "0")}`;
      await db.query(`UPDATE leads SET lead_code=? WHERE id=?`, [leadCode, leadId]);

      await db.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark, performed_by)
         VALUES (?, 'Lead Created', ?, 'Imported via bulk upload', ?)`,
        [leadId, leadCode, createdBy]
      );

      results.imported += 1;
    } catch (err) {
      results.failed += 1;
      results.errors.push({ row: i + 1, reason: err.message || "Unknown error" });
    }
  }

  return results;
};

module.exports = {
  createLead, getLeads, getLeadById, isLeadAccessibleByUser, getTeamFollowupsList,
  updateLead, updateLeadStatus, assignLead, addFollowup, getFollowups, getActivityLogs,
  deleteLead, bulkReassignLeads, bulkImportLeads,
};