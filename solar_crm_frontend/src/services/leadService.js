import api from "../api/axios";

// Get leads with search, pagination & filters
export const getLeads = async (params) => {
  const response = await api.get("/leads", { params });
  return response.data;
};

// Get single lead details
export const getLeadById = async (id) => {
  const response = await api.get(`/leads/${id}`);
  return response.data;
};

// NEW — Team-wide follow-ups list (Manager)
export const getTeamFollowupsList = async () => {
  const response = await api.get("/leads/team/followups");
  return response.data;
};

// Create new lead
export const createLead = async (leadData) => {
  const response = await api.post("/leads", leadData);
  return response.data;
};

// Update lead details
export const updateLead = async (id, leadData) => {
  const response = await api.put(`/leads/${id}`, leadData);
  return response.data;
};

// Update lead pipeline status
export const updateLeadStatus = async (id, statusData) => {
  const response = await api.patch(`/leads/${id}/status`, statusData);
  return response.data;
};

// Assign/Reassign lead to salesperson
export const assignLead = async (id, assignData) => {
  const response = await api.post(`/leads/${id}/assign`, assignData);
  return response.data;
};

// NEW — Bulk reassign all OPEN leads from one user to another (offboarding case)
// payload shape: { from_user_id, to_user_id }
// Won/Lost/Not Interested leads are NOT moved — they stay with original owner
export const bulkReassignLeads = async (payload) => {
  const response = await api.patch("/leads/bulk-reassign", payload);
  return response.data;
};

// NEW — Bulk import leads from CSV/Excel (Admin + Manager)
// payload shape: { leads: [{ customer_name, mobile_number, ... }, ...] }
export const bulkImportLeads = async (rows) => {
  const response = await api.post("/leads/bulk-import", { leads: rows });
  return response.data;
};

// Add follow-up note
export const addFollowup = async (id, followupData) => {
  const response = await api.post(`/leads/${id}/followups`, followupData);
  return response.data;
};

// Fetch follow-up timeline
export const getFollowups = async (id) => {
  const response = await api.get(`/leads/${id}/followups`);
  return response.data;
};

// Fetch activity audit logs
export const getActivityLogs = async (id) => {
  const response = await api.get(`/leads/${id}/logs`);
  return response.data;
};

// Delete lead
export const deleteLead = async (id) => {
  const response = await api.delete(`/leads/${id}`);
  return response.data;
};