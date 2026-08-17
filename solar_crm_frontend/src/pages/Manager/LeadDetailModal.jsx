import React, { useState, useEffect } from "react";
import { getFollowups, getActivityLogs, addFollowup } from "../../services/leadService";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Avatar,
  TextField,
  MenuItem,
  Select,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  SolarPower as SolarIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  Send as SendIcon,
} from "@mui/icons-material";

const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
  primarySoft: "#E0F7FF",
  bg: "#F4F6FA",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  purple: "#7C3AED",
};

const STATUS_OPTIONS = [
  "New Lead",
  "Contacted",
  "Follow-up Pending",
  "Site Visit Scheduled",
  "Quotation Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Not Interested",
];

const STATUS_STYLES = {
  "New Lead": { color: "#0284C7" },
  Contacted: { color: "#00B5EF" },
  "Follow-up Pending": { color: COLORS.warning },
  "Site Visit Scheduled": { color: COLORS.purple },
  "Quotation Sent": { color: "#9333EA" },
  Negotiation: { color: "#C026D3" },
  Won: { color: COLORS.success },
  Lost: { color: COLORS.danger },
  "Not Interested": { color: COLORS.textSecondary },
};

const formatDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (v) => {
  if (!v) return "—";
  const n = Number(v);
  return isNaN(n) ? "—" : `₹${n.toLocaleString("en-IN")}`;
};

const getInitials = (n = "") =>
  n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const InfoRow = ({ icon, label, value }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1.5,
      py: 1,
      px: 1,
      borderRadius: "8px",
      "&:hover": { backgroundColor: "#F8FAFC" },
    }}
  >
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "8px",
        backgroundColor: COLORS.primarySoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        sx={{
          fontSize: "0.6875rem",
          fontWeight: 500,
          color: COLORS.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          mb: 0.15,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: COLORS.textPrimary,
          fontFamily: "'Inter', sans-serif",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

const SectionCard = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "12px",
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      overflow: "hidden",
      height: "100%",
    }}
  >
    <Box
      sx={{
        px: 2,
        py: 1.5,
        backgroundColor: "#F8FAFC",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: 3,
          height: 16,
          borderRadius: "2px",
          backgroundColor: COLORS.primary,
        }}
      />
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: COLORS.primaryDark,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: 1.5 }}>{children}</Box>
  </Paper>
);

export default function LeadDetailModal({ open, onClose, lead, onUpdateLead }) {
  const [tab, setTab] = useState(0);
  const [status, setStatus] = useState("");
  const [remark, setRemark] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (lead && open) {
      setStatus(lead.status || "");
      setRemark("");
      setNextDate("");
      fetchLogs(lead.id);
    }
  }, [lead, open]);

  const fetchLogs = async (id) => {
    setLoadingLogs(true);
    try {
      const [fRes, lRes] = await Promise.all([
        getFollowups(id).catch(() => null),
        getActivityLogs(id).catch(() => null),
      ]);
      setLogs(
        [...(fRes?.data || []), ...(lRes?.data || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSubmit = async () => {
    if (!remark.trim() && !status) return;
    setSubmitting(true);
    try {
      const noteText = remark.trim() || `Status updated to ${status}`;
      await addFollowup(lead.id, {
        note: noteText,
        followup_type: "Call",
        status_after_followup: status || undefined,
        follow_up_date: nextDate || undefined,
      });
      setRemark("");
      setNextDate("");
      fetchLogs(lead.id);
      if (onUpdateLead) onUpdateLead();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return null;
  const style = STATUS_STYLES[lead.status] || { color: COLORS.textMuted };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", overflow: "hidden", maxHeight: "90vh" },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          p: 2.5,
          background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: "#FFF",
              color: COLORS.primaryDark,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {getInitials(lead.customer_name)}
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                color: "#FFF",
                fontSize: "1.1rem",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {lead.customer_name}
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.8rem",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {lead.lead_code} · {lead.assigned_to_name || "Unassigned"}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={lead.status}
            size="small"
            sx={{
              color: "#FFF",
              backgroundColor: `${style.color}90`,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <IconButton onClick={onClose} sx={{ color: "#FFF" }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* TABS */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: COLORS.border,
          bgcolor: COLORS.bg,
          px: 2,
        }}
      >
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab
            label="Details"
            sx={{ textTransform: "none", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
          />
          <Tab
            label="Activity Timeline"
            sx={{ textTransform: "none", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
          />
        </Tabs>
      </Box>

      {/* CONTENT */}
      <DialogContent sx={{ p: 2.5, bgcolor: COLORS.bg }}>
        {tab === 0 ? (
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <SectionCard title="Contact Information">
                <InfoRow
                  icon={<PhoneIcon sx={{ fontSize: 16, color: COLORS.primary }} />}
                  label="Mobile Number"
                  value={lead.mobile_number}
                />
                <InfoRow
                  icon={<PhoneIcon sx={{ fontSize: 16, color: COLORS.primary }} />}
                  label="Alternate Number"
                  value={lead.alternate_number}
                />
                <InfoRow
                  icon={<EmailIcon sx={{ fontSize: 16, color: COLORS.primary }} />}
                  label="Email Address"
                  value={lead.email}
                />
                <InfoRow
                  icon={<LocationIcon sx={{ fontSize: 16, color: COLORS.primary }} />}
                  label="Full Address"
                  value={[lead.address, lead.city, lead.state, lead.pincode]
                    .filter(Boolean)
                    .join(", ")}
                />
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard title="Solar & Pipeline">
                <InfoRow
                  icon={<SolarIcon sx={{ fontSize: 16, color: COLORS.warning }} />}
                  label="Requirement"
                  value={lead.solar_requirement}
                />
                <InfoRow
                  icon={<SolarIcon sx={{ fontSize: 16, color: COLORS.warning }} />}
                  label="Capacity"
                  value={lead.required_kw ? `${lead.required_kw} kW` : null}
                />
                <InfoRow
                  icon={<MoneyIcon sx={{ fontSize: 16, color: COLORS.success }} />}
                  label="Quotation Amount"
                  value={formatCurrency(lead.quotation_amount)}
                />
                <InfoRow
                  icon={<PersonIcon sx={{ fontSize: 16, color: COLORS.purple }} />}
                  label="Interest Status"
                  value={lead.interest_status}
                />
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={lead.remark ? 6 : 12}>
              <SectionCard title="Important Dates">
                <InfoRow
                  icon={<CalendarIcon sx={{ fontSize: 16, color: COLORS.primary }} />}
                  label="Next Follow-up"
                  value={formatDate(lead.next_follow_up_date)}
                />
                <InfoRow
                  icon={<CalendarIcon sx={{ fontSize: 16, color: COLORS.purple }} />}
                  label="Site Visit"
                  value={formatDate(lead.site_visit_date)}
                />
              </SectionCard>
            </Grid>
            {lead.remark && (
              <Grid item xs={12} md={6}>
                <SectionCard title="Remarks">
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "#F8FAFC",
                      borderRadius: "8px",
                      display: "flex",
                      gap: 1,
                      height: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <NotesIcon sx={{ fontSize: 18, color: COLORS.textMuted, mt: 0.2, flexShrink: 0 }} />
                    <Typography
                      sx={{
                        fontSize: "0.875rem",
                        color: COLORS.textPrimary,
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: 1.6,
                      }}
                    >
                      {lead.remark}
                    </Typography>
                  </Box>
                </SectionCard>
              </Grid>
            )}

            <Grid item xs={12}>
              <SectionCard title="Manager Quick Update">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        mb: 0.5,
                        textTransform: "uppercase",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Update Status
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "#FAFBFC",
                          fontSize: "0.8125rem",
                          fontFamily: "'Inter', sans-serif",
                        },
                      }}
                    >
                      <MenuItem value="">No Change</MenuItem>
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem
                          key={s}
                          value={s}
                          sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                        >
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        mb: 0.5,
                        textTransform: "uppercase",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Next Follow-up Date
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "#FAFBFC",
                          fontSize: "0.8125rem",
                          fontFamily: "'Inter', sans-serif",
                          "& input[type='date']": { colorScheme: "light" },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        mb: 0.5,
                        textTransform: "uppercase",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Activity Note
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Write call details, instructions..."
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "#FAFBFC",
                          fontSize: "0.8125rem",
                          fontFamily: "'Inter', sans-serif",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: "right" }}>
                    <Button
                      variant="contained"
                      startIcon={
                        submitting ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <SendIcon />
                        )
                      }
                      onClick={handleSubmit}
                      disabled={submitting || (!remark.trim() && !status)}
                      sx={{
                        height: 40,
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        backgroundColor: COLORS.primary,
                        fontFamily: "'Inter', sans-serif",
                        "&:hover": { backgroundColor: COLORS.primaryDark },
                      }}
                    >
                      Save Update
                    </Button>
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>
          </Grid>
        ) : (
          <Box>
            {loadingLogs ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : logs.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: COLORS.textMuted,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                No activity recorded yet
              </Box>
            ) : (
              <Box sx={{ position: "relative", pl: 4 }}>
                <Box
                  sx={{
                    position: "absolute",
                    left: 15,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    bgcolor: COLORS.border,
                  }}
                />
                {logs.map((l, i) => (
                  <Box key={l.id || i} sx={{ position: "relative", pb: 2.5 }}>
                    <Box
                      sx={{
                        position: "absolute",
                        left: -26,
                        top: 4,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: COLORS.primary,
                        border: "2px solid #FFF",
                        zIndex: 1,
                      }}
                    />
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: "10px",
                        border: `1px solid ${COLORS.border}`,
                        bgcolor: "#F8FAFC",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: COLORS.textPrimary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {l.note || l.remark || "Activity logged"}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.6875rem",
                          color: COLORS.textMuted,
                          mt: 0.5,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {l.created_by_name || l.performed_by_name || "System"} · {formatDate(l.created_at)}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}