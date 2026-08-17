import React, { useState, useEffect, useCallback, useMemo } from "react";

import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Drawer,
  InputAdornment,
  Stack,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Breadcrumbs,
  Avatar,
  Slide,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";

// Icons
import SearchIcon from "@mui/icons-material/Search";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import HistoryIcon from "@mui/icons-material/History";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import AddIcon from "@mui/icons-material/Add";
import WarningIcon from "@mui/icons-material/Warning";

import { State, City } from "country-state-city";

import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStatus,
  addFollowup,
  getFollowups,
  getActivityLogs,
} from "../../services/leadService";

// ======================================================
// CONSTANTS & DESIGN SYSTEM
// ======================================================
const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
  primarySoft: "#E0F7FF",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
  purple: "#9333EA",
  purpleSoft: "#F3E8FF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
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

const PIPELINE_STEPS = [
  "New Lead",
  "Contacted",
  "Follow-up Pending",
  "Site Visit Scheduled",
  "Quotation Sent",
  "Negotiation",
  "Won",
];

const STATUS_NEEDS_EXTRA = ["Quotation Sent", "Site Visit Scheduled"];
const CLOSED_STATUSES = ["Won", "Lost", "Not Interested"];
const NEGATIVE_CLOSED_STATUSES = ["Lost", "Not Interested"];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const INTEREST_OPTIONS = ["Pending", "Interested", "Not Interested"];
const FOLLOWUP_TYPE_OPTIONS = ["Call", "WhatsApp", "SMS", "Meeting", "Site Visit", "Other"];
const LEAD_SOURCE_OPTIONS = ["Website", "Call", "Reference", "Facebook", "Google", "Other"];
const SOLAR_REQUIREMENT_OPTIONS = ["Residential", "Commercial"];

const SALES_CREATE_INITIAL_FORM = {
  customer_name: "",
  mobile_number: "",
  alternate_number: "",
  email: "",
  address: "",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "",
  solar_requirement: "Residential",
  interest_status: "Pending",
  required_kw: "",
  remark: "",
  lead_source: "Website",
  priority: "Medium",
};

const STATUS_STYLES = {
  "New Lead": { bg: "#E0F2FE", color: "#0284C7" },
  Contacted: { bg: "#E0F7FF", color: "#00B5EF" },
  "Follow-up Pending": { bg: "#FEF3C7", color: "#D97706" },
  "Site Visit Scheduled": { bg: "#F3E8FF", color: "#9333EA" },
  "Quotation Sent": { bg: "#EDE9FE", color: "#7C3AED" },
  Negotiation: { bg: "#FCE7F3", color: "#C026D3" },
  Won: { bg: "#DCFCE7", color: "#16A34A" },
  Lost: { bg: "#FEE2E2", color: "#DC2626" },
  "Not Interested": { bg: "#F1F5F9", color: "#64748B" },
};

const PRIORITY_STYLES = {
  Low: { bg: "#F1F5F9", color: "#64748B" },
  Medium: { bg: "#FEF3C7", color: "#D97706" },
  High: { bg: "#FEE2E2", color: "#DC2626" },
};

const ACTION_STYLE_MAP = {
  "Lead Created": { icon: AddCircleOutlineOutlinedIcon, color: COLORS.info, soft: COLORS.infoSoft },
  "Lead Assigned": { icon: PersonAddAltOutlinedIcon, color: COLORS.primary, soft: COLORS.primarySoft },
  "Lead Reassigned": { icon: SwapHorizOutlinedIcon, color: COLORS.primary, soft: COLORS.primarySoft },
  "Lead Updated": { icon: SyncAltOutlinedIcon, color: COLORS.textSecondary, soft: "#F1F5F9" },
  "Status Changed": { icon: SyncAltOutlinedIcon, color: COLORS.purple, soft: COLORS.purpleSoft },
  "Follow-up Added": { icon: EventAvailableOutlinedIcon, color: COLORS.info, soft: COLORS.infoSoft },
  "Quotation Sent": { icon: ReceiptLongOutlinedIcon, color: COLORS.success, soft: COLORS.successSoft },
  "Site Visit Scheduled": { icon: PlaceOutlinedIcon, color: COLORS.warning, soft: COLORS.warningSoft },
  "Lead Closed": { icon: FlagOutlinedIcon, color: COLORS.success, soft: COLORS.successSoft },
};

const getActionStyle = (actionType) =>
  ACTION_STYLE_MAP[actionType] || { icon: HistoryIcon, color: COLORS.textSecondary, soft: "#F1F5F9" };

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "—");

const isOverdue = (dateStr, status) => {
  if (!dateStr || CLOSED_STATUSES.includes(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getFollowupStatus = (dateStr, status) => {
  if (!dateStr || CLOSED_STATUSES.includes(status)) return null;
  const today = getToday();
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "upcoming";
  return null;
};

const buildTelLink = (phone) => `tel:${phone}`;
const buildSmsLink = (phone) => `sms:${phone}`;
const buildWhatsAppLink = (phone) => {
  const digits = (phone || "").replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
};

const hashHue = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const GradientAvatar = ({ name, size = 32 }) => {
  const hue = hashHue(name || "?");
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 700,
        flexShrink: 0,
        background: `linear-gradient(135deg, hsl(${hue},58%,50%), hsl(${hue + 30},60%,42%))`,
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
};

const SlideTransition = React.forwardRef((props, ref) => (
  <Slide ref={ref} {...props} direction="left" />
));

const FieldLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.68rem",
      fontWeight: 800,
      color: COLORS.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      mb: 0.5,
    }}
  >
    {children}
  </Typography>
);

const controlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: COLORS.card,
    fontSize: "0.78rem",
    color: COLORS.textPrimary,
    minHeight: "36px",
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiSelect-select": { display: "flex", alignItems: "center", fontSize: "0.78rem" },
};

const primaryButtonSx = {
  height: 36,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.8rem",
  px: 2,
  backgroundColor: COLORS.primary,
  boxShadow: "none",
  whiteSpace: "nowrap",
  "&:hover": { backgroundColor: COLORS.primaryDark },
};

const outlinedButtonSx = {
  height: 36,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.78rem",
  px: 1.8,
  borderColor: COLORS.border,
  backgroundColor: COLORS.card,
  color: COLORS.textPrimary,
  whiteSpace: "nowrap",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
};

const iconSquareBtnSx = {
  width: 36,
  height: 36,
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.primary,
  backgroundColor: COLORS.primarySoft,
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#CDEFFB" },
};

const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "none",
};

const AccentSection = ({ accentColor, children }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: "12px",
      border: `1px solid ${COLORS.border}`,
      borderLeft: `4px solid ${accentColor}`,
      backgroundColor: "#FBFCFE",
      display: "flex",
      flexDirection: "column",
      gap: 1.6,
    }}
  >
    {children}
  </Box>
);

const TimelineEntry = ({ dotColor, isLast, children }) => (
  <Box sx={{ position: "relative", pl: 2.8, pb: isLast ? 0 : 2 }}>
    {!isLast && (
      <Box
        sx={{
          position: "absolute",
          left: 5,
          top: 14,
          bottom: 0,
          width: "2px",
          backgroundColor: COLORS.border,
        }}
      />
    )}
    <Box
      sx={{
        position: "absolute",
        left: 0,
        top: 4,
        width: 11,
        height: 11,
        borderRadius: "50%",
        backgroundColor: dotColor,
        border: "2px solid #FFFFFF",
        boxShadow: `0 0 0 1px ${COLORS.border}`,
      }}
    />
    {children}
  </Box>
);

// ======================================================
// MAIN COMPONENT
// ======================================================
const SalesLeads = () => {
  const [leadsList, setLeadsList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [leadDetail, setLeadDetail] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [followups, setFollowups] = useState([]);
  const [followupsLoading, setFollowupsLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [infoForm, setInfoForm] = useState({
    interest_status: "Pending",
    required_kw: "",
    remark: "",
    priority: "Medium",
  });
  const [infoErrors, setInfoErrors] = useState({});
  const [infoSaving, setInfoSaving] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: "New Lead",
    remark: "",
    quotation_amount: "",
    site_visit_date: "",
  });
  const [statusErrors, setStatusErrors] = useState({});
  const [statusSaving, setStatusSaving] = useState(false);

  const [followupForm, setFollowupForm] = useState({
    note: "",
    followup_type: "Call",
    status_after_followup: "",
    follow_up_date: "",
  });
  const [followupErrors, setFollowupErrors] = useState({});
  const [followupSaving, setFollowupSaving] = useState(false);

  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);
  const [cityOptions, setCityOptions] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState(SALES_CREATE_INITIAL_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [createSaving, setCreateSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const followupSummary = useMemo(() => {
    const overdue = leadsList.filter((l) => getFollowupStatus(l.next_follow_up_date, l.status) === "overdue");
    const today = leadsList.filter((l) => getFollowupStatus(l.next_follow_up_date, l.status) === "today");
    const upcoming = leadsList.filter((l) => getFollowupStatus(l.next_follow_up_date, l.status) === "upcoming");
    return { overdue, today, upcoming };
  }, [leadsList]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      };
      const res = await getLeads(params);
      setLeadsList(res?.data || []);
      setTotalCount(res?.total || 0);
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to load leads.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setPage(0);
  };

  const resetCreateForm = useCallback(() => {
    setCreateForm(SALES_CREATE_INITIAL_FORM);
    setCreateErrors({});
    const rajState = indianStates.find((s) => s.name === "Rajasthan");
    setCityOptions(rajState ? City.getCitiesOfState("IN", rajState.isoCode) : []);
    setDuplicateWarning(null);
    setDuplicateChecking(false);
  }, [indianStates]);

  const handleOpenCreateDialog = () => {
    resetCreateForm();
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    resetCreateForm();
  };

  const handleCreateFieldChange = useCallback((field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === "mobile_number") setDuplicateWarning(null);
  }, []);

  const handleCreateStateChange = useCallback((e) => {
    const stateName = e.target.value;
    handleCreateFieldChange("state", stateName);
    handleCreateFieldChange("city", "");
    const stateObj = indianStates.find((s) => s.name === stateName);
    setCityOptions(stateObj ? City.getCitiesOfState("IN", stateObj.isoCode) : []);
  }, [handleCreateFieldChange, indianStates]);

  const handleCreateMobileBlur = useCallback(async () => {
    const mobile = createForm.mobile_number.trim();
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      setDuplicateWarning(null);
      return;
    }
    setDuplicateChecking(true);
    try {
      const res = await getLeads({ search: mobile, limit: 5 });
      const matched = (res?.data || []).find((l) => l.mobile_number === mobile);
      setDuplicateWarning(matched || null);
    } catch (err) {
      setDuplicateWarning(null);
    } finally {
      setDuplicateChecking(false);
    }
  }, [createForm.mobile_number]);

  const validateCreateForm = (data) => {
    const errors = {};
    if (!data.customer_name.trim()) errors.customer_name = "Customer name is required.";
    if (!data.mobile_number.trim()) {
      errors.mobile_number = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(data.mobile_number.trim())) {
      errors.mobile_number = "Enter a valid 10-digit mobile number.";
    }
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (data.interest_status === "Interested" && (!data.required_kw || Number(data.required_kw) <= 0)) {
      errors.required_kw = "Required kW is mandatory when Interested.";
    }
    if (data.interest_status === "Not Interested" && !data.remark.trim()) {
      errors.remark = "Remark is mandatory when Not Interested.";
    }
    return errors;
  };

  const handleCreateSubmit = async () => {
    const errors = validateCreateForm(createForm);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setCreateSaving(true);
      await createLead(createForm);
      showNotification("Lead created and assigned to you.");
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchLeads();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to create lead.", "error");
    } finally {
      setCreateSaving(false);
    }
  };

  const fetchFollowupsData = async (leadId) => {
    setFollowupsLoading(true);
    try {
      const res = await getFollowups(leadId);
      setFollowups(res?.data || []);
    } catch (err) {
      // silent
    } finally {
      setFollowupsLoading(false);
    }
  };

  const fetchActivityLogsData = async (leadId) => {
    setLogsLoading(true);
    try {
      const res = await getActivityLogs(leadId);
      setActivityLogs(res?.data || []);
    } catch (err) {
      // silent
    } finally {
      setLogsLoading(false);
    }
  };

  const handleOpenDrawer = async (leadId) => {
    setSelectedLeadId(leadId);
    setDrawerOpen(true);
    setActiveTab(0);
    setDrawerLoading(true);
    setInfoErrors({});
    setStatusErrors({});
    setFollowupErrors({});
    setFollowupForm({ note: "", followup_type: "Call", status_after_followup: "", follow_up_date: "" });

    try {
      const res = await getLeadById(leadId);
      const lead = res?.data;
      if (!lead) throw new Error("Lead not found");

      setLeadDetail(lead);
      setInfoForm({
        interest_status: lead.interest_status || "Pending",
        required_kw: lead.required_kw ?? "",
        remark: lead.remark || "",
        priority: lead.priority || "Medium",
      });
      setStatusForm({
        status: lead.status || "New Lead",
        remark: "",
        quotation_amount: lead.quotation_amount ?? "",
        site_visit_date: lead.site_visit_date ? String(lead.site_visit_date).slice(0, 10) : "",
      });

      fetchFollowupsData(leadId);
      fetchActivityLogsData(leadId);
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to load lead details.", "error");
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedLeadId(null);
    setLeadDetail(null);
    setFollowups([]);
    setActivityLogs([]);
  };

  const refreshAfterChange = async () => {
    if (!selectedLeadId) return;
    try {
      const res = await getLeadById(selectedLeadId);
      setLeadDetail(res?.data || null);
    } catch (err) {
      // ignore
    }
    fetchActivityLogsData(selectedLeadId);
    fetchLeads();
  };

  const validateInfoForm = () => {
    const errors = {};
    if (infoForm.interest_status === "Interested" && (!infoForm.required_kw || Number(infoForm.required_kw) <= 0)) {
      errors.required_kw = "Required kW must be greater than 0 when Interested.";
    }
    if (infoForm.interest_status === "Not Interested" && !infoForm.remark.trim()) {
      errors.remark = "Remark is required when marking as Not Interested.";
    }
    setInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveInfo = async () => {
    if (!validateInfoForm()) return;
    try {
      setInfoSaving(true);
      await updateLead(selectedLeadId, {
        interest_status: infoForm.interest_status,
        required_kw: infoForm.interest_status === "Interested" ? Number(infoForm.required_kw) : null,
        remark: infoForm.remark || null,
        priority: infoForm.priority,
      });
      showNotification("Lead info updated successfully.");
      await refreshAfterChange();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update lead info.", "error");
    } finally {
      setInfoSaving(false);
    }
  };

  const validateStatusForm = () => {
    const errors = {};
    if (statusForm.status === "Not Interested" && !statusForm.remark.trim()) {
      errors.remark = "Remark is mandatory when marking as Not Interested.";
    }
    if (statusForm.status === "Quotation Sent" && (!statusForm.quotation_amount || Number(statusForm.quotation_amount) <= 0)) {
      errors.quotation_amount = "Quotation amount is mandatory when status is Quotation Sent.";
    }
    if (statusForm.status === "Site Visit Scheduled" && !statusForm.site_visit_date) {
      errors.site_visit_date = "Site visit date is mandatory when status is Site Visit Scheduled.";
    }
    setStatusErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveStatus = async () => {
    if (!validateStatusForm()) return;
    try {
      setStatusSaving(true);
      await updateLeadStatus(selectedLeadId, {
        status: statusForm.status,
        remark: statusForm.remark || undefined,
        quotation_amount: statusForm.quotation_amount ? Number(statusForm.quotation_amount) : undefined,
        site_visit_date: statusForm.site_visit_date || undefined,
      });
      showNotification("Lead status updated successfully.");
      setStatusForm((prev) => ({ ...prev, remark: "" }));
      await refreshAfterChange();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update status.", "error");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleQuickStatus = async (newStatus) => {
    try {
      setStatusSaving(true);
      await updateLeadStatus(selectedLeadId, { status: newStatus });
      showNotification(`Lead marked as "${newStatus}".`);
      setStatusForm((prev) => ({ ...prev, status: newStatus }));
      await refreshAfterChange();
    } catch (err) {
      showNotification(err.response?.data?.message || `Failed to update status.`, "error");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleStepClick = (step) => {
    if (STATUS_NEEDS_EXTRA.includes(step)) {
      setStatusForm((prev) => ({ ...prev, status: step }));
      showNotification(`Fill in the required details below to move to "${step}".`, "info");
    } else {
      handleQuickStatus(step);
    }
  };

  const validateFollowupForm = () => {
    const errors = {};
    if (!followupForm.note.trim()) errors.note = "Follow-up note is required.";
    setFollowupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddFollowup = async () => {
    if (!validateFollowupForm()) return;
    try {
      setFollowupSaving(true);
      await addFollowup(selectedLeadId, {
        note: followupForm.note.trim(),
        followup_type: followupForm.followup_type,
        status_after_followup: followupForm.status_after_followup || undefined,
        follow_up_date: followupForm.follow_up_date || undefined,
      });
      showNotification("Follow-up added successfully.");
      setFollowupForm({ note: "", followup_type: "Call", status_after_followup: "", follow_up_date: "" });
      fetchFollowupsData(selectedLeadId);
      if (followupForm.status_after_followup) {
        setStatusForm((prev) => ({ ...prev, status: followupForm.status_after_followup }));
      }
      await refreshAfterChange();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to add follow-up.", "error");
    } finally {
      setFollowupSaving(false);
    }
  };

  const hasActiveFilters = Boolean(search || statusFilter || priorityFilter);

  const activeStepIndex = leadDetail ? PIPELINE_STEPS.indexOf(leadDetail.status) : -1;
  const isTerminalNegative = leadDetail ? NEGATIVE_CLOSED_STATUSES.includes(leadDetail.status) : false;
  const isWon = leadDetail ? leadDetail.status === "Won" : false;

  return (
    <Box sx={{ backgroundColor: COLORS.bg, minHeight: "100vh", p: 1.5, boxSizing: "border-box", width: "100%" }}>
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        
        {/* BREADCRUMBS */}
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />}
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: COLORS.textMuted }}>Sales Portal</Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.primary }}>My Leads</Typography>
        </Breadcrumbs>

        {/* HERO HEADER */}
        <Paper
          elevation={0}
          sx={{
            p: 2, mb: 2, borderRadius: "12px",
            background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
            display: "flex", flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5,
            width: "100%", boxSizing: "border-box",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1rem" }}>
              My Assigned Solar Inquiries
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.75rem", mt: 0.1 }}>
              Leads assigned to you — update status, log follow-ups, and close deals.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1.2}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={fetchLeads}
                disabled={loading}
                size="small"
                sx={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "8px", width: 36, height: 36, color: "#FFFFFF" }}
              >
                <RefreshRoundedIcon
                  sx={{
                    fontSize: 18,
                    animation: loading ? "spin 0.9s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenCreateDialog}
              sx={{
                height: 36,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 2,
                backgroundColor: "#FFFFFF",
                color: COLORS.primaryDark,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                "&:hover": { backgroundColor: "#F1F5F9" },
              }}
            >
              Add Lead
            </Button>
          </Stack>
        </Paper>

        {/* FOLLOW-UP SUMMARY STRIP */}
        {(followupSummary.overdue.length > 0 || followupSummary.today.length > 0 || followupSummary.upcoming.length > 0) && (
          <Box sx={{ display: "flex", gap: 1.2, mb: 2, flexWrap: "wrap" }}>
            {followupSummary.overdue.length > 0 && (
              <Box
                sx={{
                  flex: "1 1 160px", p: 1.2, borderRadius: "10px",
                  backgroundColor: COLORS.dangerSoft,
                  border: `1px solid ${COLORS.danger}30`,
                  borderLeft: `4px solid ${COLORS.danger}`,
                  cursor: "pointer",
                }}
                onClick={() => { setStatusFilter(""); setPriorityFilter(""); setSearch(""); }}
              >
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: COLORS.danger, textTransform: "uppercase" }}>
                  🔴 Overdue
                </Typography>
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.danger, lineHeight: 1.1 }}>
                  {followupSummary.overdue.length}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: COLORS.danger, fontWeight: 600 }}>
                  Follow-up overdue
                </Typography>
              </Box>
            )}

            {followupSummary.today.length > 0 && (
              <Box
                sx={{
                  flex: "1 1 160px", p: 1.2, borderRadius: "10px",
                  backgroundColor: COLORS.warningSoft,
                  border: `1px solid ${COLORS.warning}30`,
                  borderLeft: `4px solid ${COLORS.warning}`,
                }}
              >
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: COLORS.warning, textTransform: "uppercase" }}>
                  🟡 Today
                </Typography>
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.warning, lineHeight: 1.1 }}>
                  {followupSummary.today.length}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: COLORS.warning, fontWeight: 600 }}>
                  Follow-up scheduled today
                </Typography>
              </Box>
            )}

            {followupSummary.upcoming.length > 0 && (
              <Box
                sx={{
                  flex: "1 1 160px", p: 1.2, borderRadius: "10px",
                  backgroundColor: COLORS.infoSoft,
                  border: `1px solid ${COLORS.info}30`,
                  borderLeft: `4px solid ${COLORS.info}`,
                }}
              >
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: COLORS.info, textTransform: "uppercase" }}>
                  🔵 Next 7 Days
                </Typography>
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.info, lineHeight: 1.1 }}>
                  {followupSummary.upcoming.length}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: COLORS.info, fontWeight: 600 }}>
                  Upcoming follow-ups
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* FILTER TOOLBAR */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1.5, mb: 2, width: "100%", boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2, width: "100%" }}>
            <Box sx={{ flex: "1 1 240px", minWidth: 200 }}>
              <FieldLabel>Search</FieldLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Lead code, name, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={controlSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: COLORS.textMuted, fontSize: "0.95rem" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ flex: "0 1 160px", minWidth: 130 }}>
              <FieldLabel>Status</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                renderValue={(val) => (val === "" ? <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>All Statuses</Box> : val)}
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Statuses</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontSize: "0.78rem" }}>{s}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 140px", minWidth: 110 }}>
              <FieldLabel>Priority</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                renderValue={(val) => (val === "" ? <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>All Priorities</Box> : val)}
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Priorities</MenuItem>
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p} sx={{ fontSize: "0.78rem" }}>{p}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 0 auto" }}>
              <Tooltip title="Reset Filters">
                <span>
                  <IconButton
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters}
                    size="small"
                    sx={{
                      ...iconSquareBtnSx,
                      color: hasActiveFilters ? COLORS.primary : COLORS.textMuted,
                    }}
                  >
                    <FilterListOffIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* TABLE (COMPACT & ZERO-SCROLL) */}
        <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
          <TableContainer sx={{ maxHeight: 600, width: "100%", overflowX: "auto" }}>
            <Table stickyHeader size="small" sx={{ width: "100%", minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {[
                    { label: "LEAD & CODE", width: "24%" },
                    { label: "CONTACT", width: "22%" },
                    { label: "LOCATION", width: "14%" },
                    { label: "PRIORITY", width: "10%" },
                    { label: "STATUS", width: "12%" },
                    { label: "NEXT FOLLOW-UP", width: "12%" },
                    { label: "ACTIONS", width: "6%", align: "right" },
                  ].map((head) => (
                    <TableCell
                      key={head.label}
                      align={head.align || "left"}
                      sx={{
                        backgroundColor: "#F8FAFC",
                        fontWeight: 800,
                        color: COLORS.primaryDark,
                        fontSize: "0.68rem",
                        letterSpacing: "0.03em",
                        py: 1,
                        px: 1,
                        width: head.width,
                        borderBottom: `2px solid ${COLORS.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {head.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from(new Array(rowsPerPage > 6 ? 6 : rowsPerPage)).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton width="70%" /><Skeleton width="40%" /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton width={110} /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton width={80} /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton variant="rounded" width={50} height={18} /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton variant="rounded" width={80} height={18} /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton width={70} /></TableCell>
                      <TableCell align="right" sx={{ py: 0.8, px: 1 }}><Skeleton width={40} sx={{ ml: "auto" }} /></TableCell>
                    </TableRow>
                  ))
                ) : leadsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, border: 0 }}>
                      <Box sx={{ textAlign: "center", maxWidth: 320, mx: "auto" }}>
                        <Box
                          sx={{
                            width: 52, height: 52, borderRadius: "12px", backgroundColor: COLORS.primarySoft, color: COLORS.primary,
                            display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5,
                          }}
                        >
                          <Inventory2OutlinedIcon sx={{ fontSize: "1.6rem" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.9rem" }}>
                          No Leads Assigned Yet
                        </Typography>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.3, mb: 1.5 }}>
                          Add a new enquiry yourself, or wait for your manager to assign one.
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                          onClick={handleOpenCreateDialog}
                          sx={primaryButtonSx}
                        >
                          Add Lead
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  leadsList.map((row) => {
                    const overdue = isOverdue(row.next_follow_up_date, row.status);
                    const statusStyle = STATUS_STYLES[row.status] || { bg: "#F1F5F9", color: COLORS.textSecondary };
                    const priorityStyle = PRIORITY_STYLES[row.priority] || { bg: "#F1F5F9", color: COLORS.textSecondary };

                    return (
                      <TableRow key={row.id} hover sx={{ "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 0.8, px: 1 } }}>
                        {/* Lead & Code */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <GradientAvatar name={row.customer_name} size={28} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.primary, lineHeight: 1.1 }}>{row.lead_code}</Typography>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textPrimary, lineHeight: 1.1 }} noWrap>{row.customer_name || "—"}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Contact */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" gap={0.5}>
                            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{row.mobile_number || "N/A"}</Typography>
                            {row.mobile_number && (
                              <>
                                <Tooltip title="Call">
                                  <IconButton size="small" href={buildTelLink(row.mobile_number)} sx={{ width: 22, height: 22, borderRadius: "5px", backgroundColor: COLORS.infoSoft, color: COLORS.info, p: 0.2 }}>
                                    <PhoneInTalkIcon sx={{ fontSize: "0.75rem" }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="WhatsApp">
                                  <IconButton size="small" href={buildWhatsAppLink(row.mobile_number)} target="_blank" rel="noopener noreferrer" sx={{ width: 22, height: 22, borderRadius: "5px", backgroundColor: COLORS.successSoft, color: COLORS.success, p: 0.2 }}>
                                    <WhatsAppIcon sx={{ fontSize: "0.75rem" }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>

                        {/* Location */}
                        <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, whiteSpace: "nowrap" }}>
                          {row.city || row.state || "—"}
                        </TableCell>

                        {/* Priority */}
                        <TableCell>
                          <Chip label={row.priority || "Medium"} size="small" sx={{ backgroundColor: priorityStyle.bg, color: priorityStyle.color, fontWeight: 700, fontSize: "0.65rem", height: 18 }} />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip label={row.status} size="small" sx={{ backgroundColor: statusStyle.bg, color: statusStyle.color, fontWeight: 700, fontSize: "0.65rem", height: 18 }} />
                        </TableCell>

                        {/* Next Follow-up */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {row.next_follow_up_date ? (
                            <Stack direction="row" alignItems="center" gap={0.4}>
                              {overdue && <WarningAmberOutlinedIcon sx={{ fontSize: "0.75rem", color: COLORS.danger }} />}
                              <Typography sx={{ fontSize: "0.7rem", fontWeight: overdue ? 800 : 500, color: overdue ? COLORS.danger : COLORS.textSecondary }}>
                                {formatDate(row.next_follow_up_date)}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="View & Update">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDrawer(row.id)}
                              sx={{ width: 24, height: 24, borderRadius: "6px", backgroundColor: COLORS.infoSoft, color: COLORS.info, p: 0.2, "&:hover": { backgroundColor: COLORS.primary, color: "#fff" } }}
                            >
                              <VisibilityOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              borderTop: `1px solid ${COLORS.border}`,
              "& .MuiTablePagination-toolbar": { minHeight: 34, px: 1.5 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.7rem", color: COLORS.textSecondary },
              "& .MuiTablePagination-select": { fontSize: "0.7rem" },
            }}
          />
        </Paper>

        {/* ================= ADD LEAD DIALOG ================= */}
        <Dialog
          open={createDialogOpen}
          onClose={handleCloseCreateDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontSize: "1.05rem",
              fontWeight: 800,
              pb: 1.5,
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Add New Lead
            <IconButton
              onClick={handleCloseCreateDialog}
              size="small"
              sx={{ width: 30, height: 30, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0, flex: 1, overflowY: "auto" }}>
            <Box sx={{ p: 3 }}>
              {/* Info banner */}
              <Box
                sx={{
                  p: 1.5, mb: 2.5, borderRadius: "10px", backgroundColor: COLORS.infoSoft,
                  border: `1px solid ${COLORS.info}30`, display: "flex", alignItems: "center", gap: 1,
                }}
              >
                <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: COLORS.info, flexShrink: 0 }} />
                <Typography sx={{ fontSize: "0.78rem", color: COLORS.info, fontWeight: 600 }}>
                  This lead will be created with status "New Lead" and assigned to you automatically.
                </Typography>
              </Box>

              {/* Duplicate warning */}
              {duplicateWarning && (
                <Box
                  sx={{
                    p: 2, mb: 2.5, borderRadius: "10px", backgroundColor: COLORS.warningSoft,
                    border: `1px solid ${COLORS.warning}40`, borderLeft: `4px solid ${COLORS.warning}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={0.8} sx={{ mb: 0.8 }}>
                    <WarningIcon sx={{ fontSize: 20, color: COLORS.warning }} />
                    <Typography sx={{ fontSize: "0.8rem", color: COLORS.warning, fontWeight: 700 }}>
                      Duplicate Lead Detected
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: "0.8rem", color: "#92400E", fontWeight: 500, lineHeight: 1.6 }}>
                    This number is already linked to <b>{duplicateWarning.lead_code}</b> ({duplicateWarning.customer_name}) · Status: <b>{duplicateWarning.status}</b>
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "#A16207", fontStyle: "italic", mt: 0.6 }}>
                    You can still proceed if this is a genuinely different enquiry.
                  </Typography>
                </Box>
              )}

              {duplicateChecking && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, mb: 2.5, borderRadius: "10px", backgroundColor: COLORS.primarySoft }}>
                  <CircularProgress size={16} sx={{ color: COLORS.primary }} />
                  <Typography sx={{ fontSize: "0.8rem", color: COLORS.primary, fontWeight: 500 }}>
                    Checking for duplicate lead...
                  </Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                {/* 1. Customer Name * */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Customer Name *</FieldLabel>
                  <TextField
                    fullWidth size="small" placeholder="Full name"
                    value={createForm.customer_name}
                    onChange={(e) => handleCreateFieldChange("customer_name", e.target.value)}
                    error={Boolean(createErrors.customer_name)} helperText={createErrors.customer_name}
                    sx={controlSx}
                  />
                </Grid>

                {/* 2. Mobile Number * */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Mobile Number *</FieldLabel>
                  <TextField
                    fullWidth size="small" placeholder="10-digit number"
                    value={createForm.mobile_number}
                    onChange={(e) => handleCreateFieldChange("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onBlur={handleCreateMobileBlur}
                    error={Boolean(createErrors.mobile_number)} helperText={createErrors.mobile_number}
                    sx={controlSx}
                    InputProps={{
                      endAdornment: duplicateChecking ? (
                        <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
                      ) : null,
                    }}
                  />
                </Grid>

                {/* 3. Required kW */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Required kW {createForm.interest_status === "Interested" ? "*" : ""}</FieldLabel>
                  <TextField
                    fullWidth size="small" placeholder="e.g. 5" type="number"
                    value={createForm.required_kw}
                    onChange={(e) => handleCreateFieldChange("required_kw", e.target.value)}
                    error={Boolean(createErrors.required_kw)} helperText={createErrors.required_kw}
                    sx={controlSx}
                  />
                </Grid>

                {/* 4. State (Default: Rajasthan) */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>State</FieldLabel>
                  <Select fullWidth displayEmpty size="small" value={createForm.state} onChange={handleCreateStateChange} sx={controlSx}>
                    <MenuItem value="" sx={{ fontSize: "0.8rem" }}>Select State</MenuItem>
                    {indianStates.map((s) => (
                      <MenuItem key={s.isoCode} value={s.name} sx={{ fontSize: "0.8rem" }}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 5. City (Default: Jaipur) */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>City</FieldLabel>
                  <Select
                    fullWidth displayEmpty size="small" value={createForm.city}
                    onChange={(e) => handleCreateFieldChange("city", e.target.value)}
                    disabled={!createForm.state}
                    sx={controlSx}
                  >
                    <MenuItem value="" sx={{ fontSize: "0.8rem" }}>{createForm.state ? "Select City" : "Select state first"}</MenuItem>
                    {cityOptions.map((c) => (
                      <MenuItem key={c.name} value={c.name} sx={{ fontSize: "0.8rem" }}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 6. Alternate Number */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Alternate Number</FieldLabel>
                  <TextField
                    fullWidth size="small" placeholder="Optional"
                    value={createForm.alternate_number}
                    onChange={(e) => handleCreateFieldChange("alternate_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    sx={controlSx}
                  />
                </Grid>

                {/* 7. Email */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Email</FieldLabel>
                  <TextField
                    fullWidth size="small" placeholder="Optional"
                    value={createForm.email}
                    onChange={(e) => handleCreateFieldChange("email", e.target.value)}
                    error={Boolean(createErrors.email)} helperText={createErrors.email}
                    sx={controlSx}
                  />
                </Grid>

                {/* 8. Address & Pincode */}
                <Grid item xs={12} sm={8}>
                  <FieldLabel>Address</FieldLabel>
                  <TextField
                    fullWidth size="small" placeholder="Full address"
                    value={createForm.address}
                    onChange={(e) => handleCreateFieldChange("address", e.target.value)}
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Pincode</FieldLabel>
                  <TextField
                    fullWidth size="small" placeholder="Pincode"
                    value={createForm.pincode}
                    onChange={(e) => handleCreateFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    sx={controlSx}
                  />
                </Grid>

                {/* 9. Solar Specs & Source */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Solar Requirement</FieldLabel>
                  <Select fullWidth size="small" value={createForm.solar_requirement} onChange={(e) => handleCreateFieldChange("solar_requirement", e.target.value)} sx={controlSx}>
                    {SOLAR_REQUIREMENT_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Interest Status</FieldLabel>
                  <Select fullWidth size="small" value={createForm.interest_status} onChange={(e) => handleCreateFieldChange("interest_status", e.target.value)} sx={controlSx}>
                    {INTEREST_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Lead Source</FieldLabel>
                  <Select fullWidth size="small" value={createForm.lead_source} onChange={(e) => handleCreateFieldChange("lead_source", e.target.value)} sx={controlSx}>
                    {LEAD_SOURCE_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 10. Priority */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Priority</FieldLabel>
                  <Select fullWidth size="small" value={createForm.priority} onChange={(e) => handleCreateFieldChange("priority", e.target.value)} sx={controlSx}>
                    {PRIORITY_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p} sx={{ fontSize: "0.8rem" }}>{p}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 11. Remark */}
                <Grid item xs={12}>
                  <FieldLabel>Remark {createForm.interest_status === "Not Interested" ? "*" : ""}</FieldLabel>
                  <TextField
                    fullWidth size="small" placeholder="Any notes..." multiline minRows={2} maxRows={4}
                    value={createForm.remark}
                    onChange={(e) => handleCreateFieldChange("remark", e.target.value)}
                    error={Boolean(createErrors.remark)} helperText={createErrors.remark}
                    sx={controlSx}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}`, backgroundColor: "#FAFBFC", gap: 1 }}>
            <Button
              onClick={handleCloseCreateDialog}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 3, fontSize: "0.85rem", color: COLORS.textSecondary, "&:hover": { backgroundColor: "#F1F5F9" } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateSubmit}
              disabled={createSaving || duplicateChecking}
              sx={{ ...primaryButtonSx, px: 3, "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted } }}
            >
              {createSaving ? <CircularProgress size={20} color="inherit" /> : "Create Lead"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= DETAIL DRAWER ================= */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleCloseDrawer}
          PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}
        >
          <SlideTransition in={drawerOpen} mountOnEnter unmountOnExit>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Drawer header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 2, borderBottom: `1px solid ${COLORS.border}` }}>
                {!drawerLoading && leadDetail && <GradientAvatar name={leadDetail.customer_name} size={42} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.textPrimary }}>
                    {drawerLoading ? <Skeleton width={140} /> : (leadDetail?.customer_name || "Lead Details")}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>
                    {drawerLoading ? <Skeleton width={80} /> : leadDetail?.lead_code}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={handleCloseDrawer} sx={iconSquareBtnSx}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {drawerLoading ? (
                <Box sx={{ p: 2.5, display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress size={30} sx={{ color: COLORS.primary }} />
                </Box>
              ) : (
                <>
                  {/* Pipeline stepper / terminal banner */}
                  <Box sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${COLORS.border}`, backgroundColor: "#FAFBFC" }}>
                    {isTerminalNegative ? (
                      <Box
                        sx={{
                          p: 1.5, borderRadius: "10px", backgroundColor: COLORS.dangerSoft,
                          border: `1px solid ${COLORS.danger}33`, display: "flex", alignItems: "center",
                          justifyContent: "space-between", gap: 1.5, flexWrap: "wrap",
                        }}
                      >
                        <Stack direction="row" alignItems="center" gap={1}>
                          <CancelOutlinedIcon sx={{ color: COLORS.danger, fontSize: 20 }} />
                          <Typography sx={{ fontWeight: 800, color: COLORS.danger, fontSize: "0.82rem" }}>
                            Marked as {leadDetail.status}
                          </Typography>
                        </Stack>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ReplayOutlinedIcon sx={{ fontSize: 15 }} />}
                          onClick={() => handleQuickStatus("Contacted")}
                          disabled={statusSaving}
                          sx={{ ...outlinedButtonSx, height: 32, borderColor: COLORS.danger, color: COLORS.danger, "&:hover": { backgroundColor: COLORS.dangerSoft, borderColor: COLORS.danger } }}
                        >
                          Reopen Lead
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ overflowX: "auto", pb: 0.5 }}>
                        <Stepper
                          activeStep={activeStepIndex}
                          alternativeLabel
                          sx={{
                            minWidth: 540,
                            "& .MuiStepIcon-root": { cursor: "pointer" },
                            "& .MuiStepIcon-root.Mui-active": { color: COLORS.primary },
                            "& .MuiStepIcon-root.Mui-completed": { color: COLORS.success },
                            "& .MuiStepLabel-label": { fontSize: "0.62rem", fontWeight: 700, mt: 0.5 },
                            "& .MuiStepLabel-label.Mui-active": { color: COLORS.primary, fontWeight: 800 },
                          }}
                        >
                          {PIPELINE_STEPS.map((step) => (
                            <Step key={step} completed={activeStepIndex > PIPELINE_STEPS.indexOf(step)}>
                              <StepLabel onClick={() => !statusSaving && handleStepClick(step)} sx={{ cursor: statusSaving ? "default" : "pointer" }}>
                                {step}
                              </StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>
                    )}
                  </Box>

                  {/* Tabs */}
                  <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    variant="fullWidth"
                    sx={{
                      borderBottom: `1px solid ${COLORS.border}`, minHeight: 40,
                      "& .MuiTab-root": { fontSize: "0.78rem", fontWeight: 700, textTransform: "none", minHeight: 40 },
                      "& .Mui-selected": { color: COLORS.primary },
                      "& .MuiTabs-indicator": { backgroundColor: COLORS.primary },
                    }}
                  >
                    <Tab label="Overview" />
                    <Tab label="Follow-ups" />
                    <Tab label="Activity Log" />
                  </Tabs>

                  <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2.2 }}>
                    {/* ============ TAB 0: OVERVIEW ============ */}
                    {activeTab === 0 && leadDetail && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* Quick contact actions */}
                        <Stack direction="row" gap={1}>
                          <Button fullWidth variant="outlined" startIcon={<PhoneInTalkIcon sx={{ fontSize: 16 }} />} href={buildTelLink(leadDetail.mobile_number)} sx={outlinedButtonSx}>
                            Call
                          </Button>
                          <Button fullWidth variant="outlined" startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />} href={buildWhatsAppLink(leadDetail.mobile_number)} target="_blank" rel="noopener noreferrer" sx={{ ...outlinedButtonSx, color: COLORS.success, borderColor: COLORS.successSoft }}>
                            WhatsApp
                          </Button>
                          <Button fullWidth variant="outlined" startIcon={<SmsOutlinedIcon sx={{ fontSize: 16 }} />} href={buildSmsLink(leadDetail.mobile_number)} sx={outlinedButtonSx}>
                            SMS
                          </Button>
                        </Stack>

                        {/* Quick Won / Lost actions */}
                        <Stack direction="row" gap={1}>
                          <Button
                            fullWidth variant="contained"
                            startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 17 }} />}
                            onClick={() => handleQuickStatus("Won")}
                            disabled={isWon || statusSaving}
                            sx={{ ...primaryButtonSx, backgroundColor: COLORS.success, "&:hover": { backgroundColor: "#15803D" }, "&.Mui-disabled": { backgroundColor: COLORS.successSoft, color: COLORS.success } }}
                          >
                            {isWon ? "Already Won" : "Mark Won"}
                          </Button>
                          <Button
                            fullWidth variant="outlined"
                            startIcon={<CancelOutlinedIcon sx={{ fontSize: 17 }} />}
                            onClick={() => handleQuickStatus("Lost")}
                            disabled={isTerminalNegative || statusSaving}
                            sx={{ ...outlinedButtonSx, color: COLORS.danger, borderColor: COLORS.dangerSoft, "&:hover": { backgroundColor: COLORS.dangerSoft, borderColor: COLORS.danger } }}
                          >
                            Mark Lost
                          </Button>
                        </Stack>

                        <Divider />

                        {/* Read-only customer info */}
                        <Box>
                          <Box
                            sx={{
                              p: 1.5, borderRadius: "10px", backgroundColor: COLORS.surfaceMuted, border: `1px solid ${COLORS.border}`,
                              display: "flex", alignItems: "flex-start", gap: 1.2, mb: 1,
                            }}
                          >
                            <LocationOnOutlinedIcon sx={{ fontSize: "1rem", color: COLORS.primary, mt: 0.2 }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Address</Typography>
                              <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: COLORS.textPrimary, wordBreak: "break-word" }}>
                                {[leadDetail.address, leadDetail.city, leadDetail.state, leadDetail.pincode].filter(Boolean).join(", ") || "N/A"}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                            {[
                              { icon: <PersonOutlineOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Mobile", value: leadDetail.mobile_number },
                              { icon: <EmailOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Email", value: leadDetail.email || "N/A" },
                              { icon: <SolarPowerOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Requirement", value: leadDetail.solar_requirement },
                              { icon: <SourceOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Source", value: leadDetail.lead_source },
                              { icon: <BadgeOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Assigned By", value: leadDetail.assigned_by_name || "N/A" },
                              { icon: <EventOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Created On", value: formatDate(leadDetail.created_at) },
                            ].map((item) => (
                              <Box key={item.label} sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 1.2, borderRadius: "8px", backgroundColor: COLORS.surfaceMuted, border: `1px solid ${COLORS.border}` }}>
                                <Box sx={{ color: COLORS.primary, mt: 0.2 }}>{item.icon}</Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: "0.63rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>{item.label}</Typography>
                                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textPrimary, wordBreak: "break-word" }}>{item.value}</Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>

                        {/* Form A: Update Lead Info */}
                        <AccentSection accentColor={COLORS.info}>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: COLORS.textPrimary }}>Update Lead Info</Typography>

                          <Box>
                            <FieldLabel>Interest Status</FieldLabel>
                            <Select
                              fullWidth size="small" value={infoForm.interest_status}
                              onChange={(e) => setInfoForm((prev) => ({ ...prev, interest_status: e.target.value }))}
                              sx={controlSx}
                            >
                              {INTEREST_OPTIONS.map((opt) => <MenuItem key={opt} value={opt} sx={{ fontSize: "0.8rem" }}>{opt}</MenuItem>)}
                            </Select>
                          </Box>

                          {infoForm.interest_status === "Interested" && (
                            <Box>
                              <FieldLabel>Required Capacity (kW) *</FieldLabel>
                              <TextField
                                fullWidth size="small" type="number" value={infoForm.required_kw}
                                onChange={(e) => setInfoForm((prev) => ({ ...prev, required_kw: e.target.value }))}
                                error={Boolean(infoErrors.required_kw)} helperText={infoErrors.required_kw || ""}
                                sx={controlSx}
                              />
                            </Box>
                          )}

                          <Box>
                            <FieldLabel>Remark {infoForm.interest_status === "Not Interested" ? "*" : ""}</FieldLabel>
                            <TextField
                              fullWidth size="small" multiline minRows={2} value={infoForm.remark}
                              onChange={(e) => setInfoForm((prev) => ({ ...prev, remark: e.target.value }))}
                              error={Boolean(infoErrors.remark)} helperText={infoErrors.remark || ""}
                              sx={controlSx}
                            />
                          </Box>

                          <Box>
                            <FieldLabel>Priority</FieldLabel>
                            <Select
                              fullWidth size="small" value={infoForm.priority}
                              onChange={(e) => setInfoForm((prev) => ({ ...prev, priority: e.target.value }))}
                              sx={controlSx}
                            >
                              {PRIORITY_OPTIONS.map((opt) => <MenuItem key={opt} value={opt} sx={{ fontSize: "0.8rem" }}>{opt}</MenuItem>)}
                            </Select>
                          </Box>

                          <Button
                            variant="contained" onClick={handleSaveInfo} disabled={infoSaving}
                            startIcon={infoSaving ? <CircularProgress size={14} color="inherit" /> : null}
                            sx={primaryButtonSx}
                          >
                            {infoSaving ? "Saving..." : "Save Lead Info"}
                          </Button>
                        </AccentSection>

                        {/* Form B: Change Status */}
                        <AccentSection accentColor={COLORS.purple}>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: COLORS.textPrimary }}>Change Status</Typography>

                          <Box>
                            <FieldLabel>Status</FieldLabel>
                            <Select
                              fullWidth size="small" value={statusForm.status}
                              onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                              sx={controlSx}
                            >
                              {STATUS_OPTIONS.map((opt) => <MenuItem key={opt} value={opt} sx={{ fontSize: "0.8rem" }}>{opt}</MenuItem>)}
                            </Select>
                          </Box>

                          {statusForm.status === "Quotation Sent" && (
                            <Box>
                              <FieldLabel>Quotation Amount (₹) *</FieldLabel>
                              <TextField
                                fullWidth size="small" type="number" value={statusForm.quotation_amount}
                                onChange={(e) => setStatusForm((prev) => ({ ...prev, quotation_amount: e.target.value }))}
                                error={Boolean(statusErrors.quotation_amount)} helperText={statusErrors.quotation_amount || ""}
                                sx={controlSx}
                              />
                            </Box>
                          )}

                          {statusForm.status === "Site Visit Scheduled" && (
                            <Box>
                              <FieldLabel>Site Visit Date *</FieldLabel>
                              <TextField
                                fullWidth size="small" type="date" value={statusForm.site_visit_date}
                                onChange={(e) => setStatusForm((prev) => ({ ...prev, site_visit_date: e.target.value }))}
                                error={Boolean(statusErrors.site_visit_date)} helperText={statusErrors.site_visit_date || ""}
                                InputLabelProps={{ shrink: true }}
                                sx={controlSx}
                              />
                            </Box>
                          )}

                          <Box>
                            <FieldLabel>Remark {statusForm.status === "Not Interested" ? "*" : "(optional)"}</FieldLabel>
                            <TextField
                              fullWidth size="small" multiline minRows={2} value={statusForm.remark}
                              onChange={(e) => setStatusForm((prev) => ({ ...prev, remark: e.target.value }))}
                              error={Boolean(statusErrors.remark)} helperText={statusErrors.remark || ""}
                              sx={controlSx}
                            />
                          </Box>

                          <Button
                            variant="contained" onClick={handleSaveStatus} disabled={statusSaving}
                            startIcon={statusSaving ? <CircularProgress size={14} color="inherit" /> : null}
                            sx={{ ...primaryButtonSx, backgroundColor: COLORS.purple, "&:hover": { backgroundColor: "#7E22CE" } }}
                          >
                            {statusSaving ? "Saving..." : "Save Status"}
                          </Button>
                        </AccentSection>
                      </Box>
                    )}

                    {/* ============ TAB 1: FOLLOW-UPS ============ */}
                    {activeTab === 1 && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <AccentSection accentColor={COLORS.info}>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: COLORS.textPrimary }}>Add Follow-up</Typography>

                          <Box>
                            <FieldLabel>Note *</FieldLabel>
                            <TextField
                              fullWidth size="small" multiline minRows={2} value={followupForm.note}
                              onChange={(e) => setFollowupForm((prev) => ({ ...prev, note: e.target.value }))}
                              error={Boolean(followupErrors.note)} helperText={followupErrors.note || ""}
                              sx={controlSx}
                            />
                          </Box>

                          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
                            <Box>
                              <FieldLabel>Follow-up Type</FieldLabel>
                              <Select
                                fullWidth size="small" value={followupForm.followup_type}
                                onChange={(e) => setFollowupForm((prev) => ({ ...prev, followup_type: e.target.value }))}
                                sx={controlSx}
                              >
                                {FOLLOWUP_TYPE_OPTIONS.map((opt) => <MenuItem key={opt} value={opt} sx={{ fontSize: "0.8rem" }}>{opt}</MenuItem>)}
                              </Select>
                            </Box>
                            <Box>
                              <FieldLabel>Next Follow-up</FieldLabel>
                              <TextField
                                fullWidth size="small" type="date" value={followupForm.follow_up_date}
                                onChange={(e) => setFollowupForm((prev) => ({ ...prev, follow_up_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                sx={controlSx}
                              />
                            </Box>
                          </Box>

                          <Box>
                            <FieldLabel>Update Status To (optional)</FieldLabel>
                            <Select
                              fullWidth displayEmpty size="small" value={followupForm.status_after_followup}
                              onChange={(e) => setFollowupForm((prev) => ({ ...prev, status_after_followup: e.target.value }))}
                              sx={controlSx}
                              renderValue={(val) => (val === "" ? <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.8rem" }}>No change</Box> : val)}
                            >
                              <MenuItem value="" sx={{ fontSize: "0.8rem" }}>No change</MenuItem>
                              {STATUS_OPTIONS.map((opt) => <MenuItem key={opt} value={opt} sx={{ fontSize: "0.8rem" }}>{opt}</MenuItem>)}
                            </Select>
                          </Box>

                          <Button
                            variant="contained" onClick={handleAddFollowup} disabled={followupSaving}
                            startIcon={followupSaving ? <CircularProgress size={14} color="inherit" /> : null}
                            sx={primaryButtonSx}
                          >
                            {followupSaving ? "Adding..." : "Add Follow-up"}
                          </Button>
                        </AccentSection>

                        <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: COLORS.textPrimary }}>Follow-up Timeline</Typography>

                        {followupsLoading ? (
                          <Stack gap={1}>{Array.from(new Array(3)).map((_, i) => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: "8px" }} />)}</Stack>
                        ) : followups.length === 0 ? (
                          <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.8rem", textAlign: "center", py: 3 }}>
                            No follow-ups added yet.
                          </Typography>
                        ) : (
                          <Box>
                            {followups.map((f, idx) => (
                              <TimelineEntry key={f.id} dotColor={COLORS.info} isLast={idx === followups.length - 1}>
                                <Box sx={{ p: 1.2, borderRadius: "8px", backgroundColor: COLORS.surfaceMuted, border: `1px solid ${COLORS.border}` }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
                                    <Chip label={f.followup_type} size="small" sx={{ backgroundColor: COLORS.infoSoft, color: COLORS.info, fontWeight: 700, fontSize: "0.65rem", height: 20 }} />
                                    <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>{formatDateTime(f.created_at)}</Typography>
                                  </Stack>
                                  <Typography sx={{ fontSize: "0.8rem", color: COLORS.textPrimary }}>{f.note}</Typography>
                                  {f.follow_up_date && (
                                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary, mt: 0.3 }}>
                                      Next follow-up: {formatDate(f.follow_up_date)}
                                    </Typography>
                                  )}
                                </Box>
                              </TimelineEntry>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* ============ TAB 2: ACTIVITY LOG ============ */}
                    {activeTab === 2 && (
                      <Box>
                        {logsLoading ? (
                          <Stack gap={1}>{Array.from(new Array(4)).map((_, i) => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: "8px" }} />)}</Stack>
                        ) : activityLogs.length === 0 ? (
                          <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.8rem", textAlign: "center", py: 3 }}>
                            No activity recorded yet.
                          </Typography>
                        ) : (
                          <Box>
                            {activityLogs.map((log, idx) => {
                              const { icon: ActionIcon, color, soft } = getActionStyle(log.action_type);
                              return (
                                <TimelineEntry key={log.id} dotColor={color} isLast={idx === activityLogs.length - 1}>
                                  <Box sx={{ p: 1.2, borderRadius: "8px", backgroundColor: COLORS.surfaceMuted, border: `1px solid ${COLORS.border}`, display: "flex", gap: 1 }}>
                                    <Avatar sx={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: soft, color, flexShrink: 0 }}>
                                      <ActionIcon sx={{ fontSize: "0.9rem" }} />
                                    </Avatar>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color }}>{log.action_type}</Typography>
                                        <Typography sx={{ fontSize: "0.65rem", color: COLORS.textMuted }}>{formatDateTime(log.created_at)}</Typography>
                                      </Stack>
                                      {log.remark && <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, fontStyle: "italic" }}>"{log.remark}"</Typography>}
                                      {!log.remark && log.old_value && log.new_value && (
                                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{log.old_value} → {log.new_value}</Typography>
                                      )}
                                      <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, mt: 0.2 }}>By {log.performed_by_name || "System"}</Typography>
                                    </Box>
                                  </Box>
                                </TimelineEntry>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </SlideTransition>
        </Drawer>

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ borderRadius: "10px", fontSize: "0.8rem", fontWeight: 600 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default SalesLeads;