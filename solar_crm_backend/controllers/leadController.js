const { db } = require("../config/db");

const {
  createLead,
  getLeads,
  getLeadById,
  isLeadAccessibleByUser,
  getTeamFollowupsList,
  updateLead,
  updateLeadStatus,
  assignLead,
  addFollowup,
  getFollowups,
  getActivityLogs,
  deleteLead,
  bulkReassignLeads,
  bulkImportLeads,
} = require("../models/leadModel");

const { isUserInManagerTeam } = require("../models/userModel");

const {
  notifyLeadAssigned,
  notifyLeadWon,
  notifyLeadLost,
  notifyStatusChanged,
  notifyBulkImport,
  notifyFollowupAdded,
  notifyLeadCreated,
} = require("../services/notificationService");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

// Sales sirf ye fields touch kar sakta hai apni lead pe — customer ka
// naam/number/email/address wagera nahi (data integrity ke liye Admin/Manager tak limited)
const SALES_EDITABLE_FIELDS = [
  "interest_status",
  "required_kw",
  "remark",
  "priority",
  "next_follow_up_date",
  "site_visit_date",
  "quotation_amount",
];

// ======================================
// Create Lead
// ======================================
const createLeadController = async (req, res) => {
  try {
    const { customer_name, mobile_number, interest_status, required_kw, remark } = req.body;

    if (!customer_name || !mobile_number) {
      return res.status(400).json({ success: false, message: "Customer Name and Mobile Number are required." });
    }
    if (interest_status === "Interested" && (!required_kw || Number(required_kw) <= 0)) {
      return res.status(400).json({ success: false, message: "Required Solar Capacity in kW is mandatory when status is 'Interested'." });
    }
    if (interest_status === "Not Interested" && (!remark || !remark.trim())) {
      return res.status(400).json({ success: false, message: "Remark is mandatory when status is 'Not Interested'." });
    }

    const payload = { ...req.body };
    const roleId = Number(req.user.role_id);

    if (roleId === ROLE_SALES) {
      // Sales apni hi lead bana sakta hai — hamesha khud ko assign hogi,
      // chahe body mein kuch bhi bheja ho. Ye do wajah se zaroori hai:
      // (1) security — Sales kisi aur rep ko assign na kar paye
      // (2) warna lead unassigned reh jayegi aur Sales ke apne scope se
      //     hi gayab ho jayegi (uski query assigned_to = uski id pe chalti hai)
      payload.assigned_to = req.user.id;
      payload.assigned_by = req.user.id;
      payload.status = "New Lead";   // Sales pipeline-status khud set na kare
    } else if (roleId === ROLE_MANAGER && payload.assigned_to) {
      // Manager sirf apni team ko hi assign kar sake (ye check create-time pe
      // pehle missing tha — sirf /assign endpoint aur edit-form pe tha)
      const inTeam = await isUserInManagerTeam(payload.assigned_to, req.user.id);
      if (!inTeam) {
        return res.status(403).json({
          success: false,
          message: "You can only assign leads to your own team members.",
        });
      }
    }

    const newLead = await createLead(payload, req.user.id);

    // Admin ko notify karo
    try {
      const [creatorRows] = await db.query("SELECT full_name FROM users WHERE id = ?", [req.user.id]);
      const creatorName = creatorRows?.[0]?.full_name || "Someone";
      await notifyLeadCreated(newLead.id, newLead.lead_code, payload.customer_name, creatorName);
    } catch (notifErr) {
      console.error("Notification trigger error in createLead:", notifErr.message);
    }

    return res.status(201).json({ success: true, message: "Lead created successfully.", data: newLead });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get All Leads
// ======================================
const getLeadsController = async (req, res) => {
  try {
    const roleId = req.user ? req.user.role_id : null;
    const userId = req.user ? req.user.id : null;
    const result = await getLeads(req.query, roleId, userId);
    return res.status(200).json({ success: true, message: "Leads fetched successfully.", ...result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get Lead By ID
// ======================================
const getLeadByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    const rows = await getLeadById(id);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Lead not found." });

    return res.status(200).json({ success: true, message: "Lead details fetched successfully.", data: rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// NEW — Team-wide Follow-ups List (Manager)
// ======================================
const getTeamFollowupsListController = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getTeamFollowupsList(userId);
    return res.status(200).json({ success: true, message: "Team follow-ups fetched successfully.", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Update Lead (full edit) — Sales role ke liye field-restricted
// ======================================
const updateLeadController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    let payload = req.body;

    if (Number(roleId) === ROLE_SALES) {
      const existingRows = await getLeadById(id);
      if (existingRows.length === 0) return res.status(404).json({ success: false, message: "Lead not found." });

      const existing = existingRows[0];
      payload = { ...existing }; // baseline DB se
      SALES_EDITABLE_FIELDS.forEach((field) => {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
      });
      // customer_name, mobile_number, email, address, city, state, pincode,
      // solar_requirement, lead_source, assigned_to -> ye sab existing DB value se hi jayenge, chahe
      // Sales ne body mein bhej bhi diye hon, silently ignore ho jayenge
    }

    const { interest_status, required_kw, remark } = payload;

    if (interest_status === "Interested" && (!required_kw || Number(required_kw) <= 0)) {
      return res.status(400).json({ success: false, message: "Required Solar Capacity in kW is mandatory when status is 'Interested'." });
    }
    if (interest_status === "Not Interested" && (!remark || !remark.trim())) {
      return res.status(400).json({ success: false, message: "Remark is mandatory when status is 'Not Interested'." });
    }

    // NEW: Manager sirf apni team ko hi assign kar sake, generic edit-form se bhi
    // (dedicated /assign endpoint mein pehle se hi ye check tha, ab yahan bhi zaroori hai
    // kyunki updateLead ab assigned_to ko bhi save karta hai)
    if (Number(roleId) === ROLE_MANAGER && payload.assigned_to) {
      const inTeam = await isUserInManagerTeam(payload.assigned_to, userId);
      if (!inTeam) {
        return res.status(403).json({
          success: false,
          message: "You can only assign leads to your own team members.",
        });
      }
    }

    await updateLead(id, payload, userId);
    return res.status(200).json({ success: true, message: "Lead updated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Update Status — remark/quotation/site-visit validation added
// ======================================
const updateLeadStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark, quotation_amount, site_visit_date } = req.body;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (!status) return res.status(400).json({ success: false, message: "Status is required." });

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    const existingRows = await getLeadById(id);
    if (existingRows.length === 0) return res.status(404).json({ success: false, message: "Lead not found." });
    const existing = existingRows[0];

    if (status === "Not Interested") {
      const effectiveRemark = remark || existing.remark;
      if (!effectiveRemark || !effectiveRemark.trim()) {
        return res.status(400).json({ success: false, message: "Remark is mandatory when marking a lead as 'Not Interested'." });
      }
    }

    if (status === "Quotation Sent") {
      const effectiveAmount = quotation_amount ?? existing.quotation_amount;
      if (!effectiveAmount || Number(effectiveAmount) <= 0) {
        return res.status(400).json({ success: false, message: "Quotation amount is mandatory when status is 'Quotation Sent'." });
      }
    }

    if (status === "Site Visit Scheduled") {
      const effectiveDate = site_visit_date || existing.site_visit_date;
      if (!effectiveDate) {
        return res.status(400).json({ success: false, message: "Site visit date is mandatory when status is 'Site Visit Scheduled'." });
      }
    }

    await updateLeadStatus(id, req.body, userId);

    // Status ke hisaab se notify karo
    try {
      const leadRows = await getLeadById(id);
      const lead = leadRows[0];
      if (lead) {
        if (status === "Won") {
          await notifyLeadWon(id, lead.lead_code, lead.customer_name, lead.manager_id);
        } else if (status === "Lost" || status === "Not Interested") {
          await notifyLeadLost(id, lead.lead_code, lead.customer_name, lead.manager_id);
        } else {
          await notifyStatusChanged(id, lead.lead_code, lead.customer_name, status, lead.manager_id);
        }
      }
    } catch (notifErr) {
      console.error("Notification trigger error in updateLeadStatus:", notifErr.message);
    }

    return res.status(200).json({ success: true, message: "Lead status updated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Assign Lead
// ======================================
const assignLeadController = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (!assigned_to) return res.status(400).json({ success: false, message: "assigned_to user ID is required." });

    if (Number(roleId) === ROLE_MANAGER) {
      const inTeam = await isUserInManagerTeam(assigned_to, userId);
      if (!inTeam) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only assign leads to your own team members." });
      }
    }

    await assignLead(id, assigned_to, userId);

    // Sales ko notify karo
    try {
      const leadRows = await getLeadById(id);
      const lead = leadRows[0];
      if (lead) {
        await notifyLeadAssigned(id, assigned_to, lead.lead_code, lead.customer_name);
      }
    } catch (notifErr) {
      console.error("Notification trigger error in assignLead:", notifErr.message);
    }

    return res.status(200).json({ success: true, message: "Lead assigned successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// NEW — Bulk Reassign (Offboarding)
// ======================================
const bulkReassignController = async (req, res) => {
  try {
    const { from_user_id, to_user_id } = req.body;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (!from_user_id || !to_user_id) {
      return res.status(400).json({ success: false, message: "from_user_id and to_user_id are required." });
    }
    if (String(from_user_id) === String(to_user_id)) {
      return res.status(400).json({ success: false, message: "Source and destination user cannot be the same." });
    }

    if (Number(roleId) === ROLE_MANAGER) {
      const [fromInTeam, toInTeam] = await Promise.all([
        isUserInManagerTeam(from_user_id, userId),
        isUserInManagerTeam(to_user_id, userId),
      ]);
      if (!fromInTeam || !toInTeam) {
        return res.status(403).json({ success: false, message: "Both users must be in your team." });
      }
    }

    const result = await bulkReassignLeads(from_user_id, to_user_id, userId);
    return res.status(200).json({
      success: true,
      message: `${result.reassignedCount} lead(s) reassigned successfully.`,
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// NEW — Bulk Import Leads (CSV/Excel Upload)
// ======================================
const bulkImportLeadsController = async (req, res) => {
  try {
    const { leads: rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No leads provided for import." });
    }

    const result = await bulkImportLeads(rows, req.user.id);

    // Admin ko notify karo
    try {
      await notifyBulkImport(req.user.id, result.imported, result.failed);
    } catch (notifErr) {
      console.error("Notification trigger error in bulkImportLeads:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `${result.imported} lead(s) imported, ${result.failed} failed.`,
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Add Follow-up
// ======================================
const addFollowupController = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (!note || !note.trim()) return res.status(400).json({ success: false, message: "Follow-up note is required." });

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    await addFollowup(id, req.body, userId);

    // Manager ko notify karo
    try {
      const leadRows = await getLeadById(id);
      const lead = leadRows[0];
      if (lead && lead.manager_id) {
        await notifyFollowupAdded(id, lead.lead_code, lead.customer_name, lead.manager_id);
      }
    } catch (notifErr) {
      console.error("Notification trigger error in addFollowup:", notifErr.message);
    }

    return res.status(201).json({ success: true, message: "Follow-up added successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get Follow-ups
// ======================================
const getFollowupsController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    const data = await getFollowups(id);
    return res.status(200).json({ success: true, message: "Follow-ups fetched successfully.", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get Activity Logs
// ======================================
const getActivityLogsController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    const data = await getActivityLogs(id);
    return res.status(200).json({ success: true, message: "Activity logs fetched successfully.", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Delete Lead — Admin-only (route-gated)
// ======================================
const deleteLeadController = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteLead(id, req.user.id);
    return res.status(200).json({ success: true, message: "Lead deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  createLead: createLeadController,
  getLeads: getLeadsController,
  getLeadById: getLeadByIdController,
  getTeamFollowupsList: getTeamFollowupsListController,
  updateLead: updateLeadController,
  updateLeadStatus: updateLeadStatusController,
  assignLead: assignLeadController,
  bulkReassign: bulkReassignController,
  bulkImport: bulkImportLeadsController,
  addFollowup: addFollowupController,
  getFollowups: getFollowupsController,
  getActivityLogs: getActivityLogsController,
  deleteLead: deleteLeadController,
};