import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Autocomplete,
  Alert as MuiAlert,
  Breadcrumbs,
  Slide,
  Grow,
  Fade,
} from "@mui/material";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentInd as AssignIcon,
  Event as FollowupIcon,
  Visibility as ViewIcon,
  Call as CallIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  FiberNew as FiberNewIcon,
  EmojiEvents as WonIcon,
  HighlightOff as LostIcon,
  History as HistoryIcon,
  Inbox as InboxIcon,
  HomeWork as SiteVisitIcon,
  MoreVert as MoreVertIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  FilterListOff as FilterListOffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  SolarPower as SolarIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

import { State, City } from "country-state-city";

import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  assignLead,
  addFollowup,
  getFollowups,
  getActivityLogs,
  deleteLead,
} from "../../services/leadService";

import { getUsers } from "../../services/userServices";
import ImportLeadsDialog from "../../components/ImportLeadsDialog";
import UploadFileIcon from "@mui/icons-material/UploadFile";

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
  primarySoft: "#E0F7FF",
  bg: "#F4F6FA",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
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

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const LEAD_SOURCE_OPTIONS = ["Website", "Call", "Reference", "Facebook", "Google", "Other"];
const SOLAR_REQUIREMENT_OPTIONS = ["Residential", "Commercial"];
const FOLLOWUP_TYPE_OPTIONS = ["Call", "WhatsApp", "SMS", "Meeting", "Site Visit", "Other"];
const INTEREST_OPTIONS = ["Pending", "Interested", "Not Interested"];

const INITIAL_FORM_STATE = {
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
  status: "New Lead",
  assigned_to: "",
  next_follow_up_date: "",
  site_visit_date: "",
  quotation_amount: "",
};

const INITIAL_FILTERS = {
  search: "",
  status: "",
  priority: "",
  lead_source: "",
  assigned_to: "",
  date_from: "",
  date_to: "",
};

const SlideTransition = React.forwardRef((props, ref) => (
  <Slide ref={ref} {...props} direction="left" />
));

/* ============================================================
   SHARED STYLES
   ============================================================ */
const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
};

const primaryButtonSx = {
  height: 38,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.8125rem",
  px: 2,
  backgroundColor: COLORS.primary,
  boxShadow: "none",
  whiteSpace: "nowrap",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "&:hover": {
    backgroundColor: COLORS.primaryDark,
    boxShadow: "none",
  },
};

const outlinedButtonSx = {
  height: 38,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.8125rem",
  px: 1.8,
  borderColor: COLORS.border,
  backgroundColor: COLORS.card,
  color: COLORS.textPrimary,
  whiteSpace: "nowrap",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F8FAFC" },
};

const iconSquareBtnSx = {
  width: 36,
  height: 36,
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.primary,
  backgroundColor: COLORS.card,
  "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
};

const controlSx = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FAFBFC",
    fontSize: "0.8125rem",
    color: COLORS.textPrimary,
    minHeight: 40,
    "& fieldset": { borderColor: COLORS.border, borderWidth: "1px" },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "0.8125rem",
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    fontSize: "0.8125rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  "& .MuiInputLabel-root": {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "0.8125rem",
    color: COLORS.textSecondary,
    "&.Mui-focused": { color: COLORS.primary },
  },
  "& .MuiFormHelperText-root": {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "0.7rem",
    marginLeft: "14px",
  },
};

const dateControlSx = {
  ...controlSx,
  "& .MuiOutlinedInput-root": {
    ...controlSx["& .MuiOutlinedInput-root"],
    "& input[type='date']": {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: "0.8125rem",
      colorScheme: "light",
    },
  },
};

const FieldLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: COLORS.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      mb: 0.5,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}
  >
    {children}
  </Typography>
);

/* ============================================================
   VIEW DRAWER - INFO ROW COMPONENT
   ============================================================ */
const InfoRow = ({ icon, label, value, valueColor }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1.5,
      py: 1.2,
      px: 1,
      borderRadius: "8px",
      transition: "background-color 0.15s ease",
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
          color: valueColor || COLORS.textPrimary,
          fontFamily: "'Inter', sans-serif",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

/* ============================================================
   VIEW DRAWER - ACTIVITY LOG ITEM
   ============================================================ */
const ActivityLogItem = ({ log, index }) => (
  <Box
    sx={{
      display: "flex",
      gap: 1.5,
      position: "relative",
      pb: 2.5,
    }}
  >
    {index < 9 && (
      <Box
        sx={{
          position: "absolute",
          left: 15,
          top: 36,
          bottom: 0,
          width: 2,
          backgroundColor: COLORS.border,
        }}
      />
    )}
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        backgroundColor: COLORS.primarySoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        zIndex: 1,
        border: `2px solid ${COLORS.card}`,
      }}
    >
      <TimelineIcon sx={{ fontSize: 14, color: COLORS.primary }} />
    </Box>
    <Box
      sx={{
        flex: 1,
        backgroundColor: "#F8FAFC",
        borderRadius: "10px",
        p: 1.5,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: COLORS.textPrimary,
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.5,
        }}
      >
        {log.remark || `${log.action_type}${log.old_value ? ` — ${log.old_value} → ${log.new_value}` : ""}`}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.6875rem",
          color: COLORS.textMuted,
          mt: 0.5,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {log.performed_by_name && `${log.performed_by_name} · `}
        {formatDate(log.created_at || log.updated_at)}
      </Typography>
    </Box>
  </Box>
);

/* ============================================================
   VIEW DRAWER - SECTION CARD
   ============================================================ */
const DetailSectionCard = ({ title, children, icon }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: "12px",
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      overflow: "hidden",
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
      {icon && (
        <Box
          sx={{
            width: 3,
            height: 16,
            borderRadius: "2px",
            backgroundColor: COLORS.primary,
          }}
        />
      )}
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
  </Card>
);

/* ============================================================
   HELPERS
   ============================================================ */
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (value) => {
  if (!value) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const STATUS_STYLES = {
  "New Lead": { color: "#0284C7", bg: "#E0F2FE" },
  Contacted: { color: "#00B5EF", bg: "#E0F7FF" },
  "Follow-up Pending": { color: COLORS.warning, bg: COLORS.warningSoft },
  "Site Visit Scheduled": { color: COLORS.purple, bg: COLORS.purpleSoft },
  "Quotation Sent": { color: "#9333EA", bg: "#F3E8FF" },
  Negotiation: { color: "#C026D3", bg: "#FCE7F3" },
  Won: { color: COLORS.success, bg: COLORS.successSoft },
  Lost: { color: COLORS.danger, bg: COLORS.dangerSoft },
  "Not Interested": { color: COLORS.textSecondary, bg: "#F1F5F9" },
};

const PRIORITY_STYLES = {
  High: { color: COLORS.danger, bg: COLORS.dangerSoft },
  Medium: { color: COLORS.warning, bg: COLORS.warningSoft },
  Low: { color: COLORS.success, bg: COLORS.successSoft },
};

const StatusChip = ({ status }) => {
  const style = STATUS_STYLES[status] || { color: COLORS.textMuted, bg: "#F1F2F4" };
  return (
    <Chip
      label={status || "—"}
      size="small"
      sx={{
        color: style.color,
        backgroundColor: style.bg,
        fontWeight: 600,
        fontSize: "0.6875rem",
        height: 22,
        borderRadius: "6px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    />
  );
};

const PriorityChip = ({ priority }) => {
  const style = PRIORITY_STYLES[priority] || { color: COLORS.textMuted, bg: "#F1F2F4" };
  return (
    <Chip
      label={priority || "—"}
      size="small"
      variant="outlined"
      sx={{
        color: style.color,
        borderColor: `${style.color}40`,
        backgroundColor: style.bg,
        fontWeight: 600,
        fontSize: "0.6875rem",
        height: 22,
        borderRadius: "6px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    />
  );
};

/* ============================================================
   KPI CARD
   ============================================================ */
const KpiCard = ({ icon, label, value, accent, loading, index = 0 }) => (
  <Grow in timeout={280 + index * 100}>
    <Card
      elevation={0}
      sx={{
        flex: 1,
        minWidth: "150px",
        borderRadius: "12px",
        border: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.card,
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": { boxShadow: "0 4px 12px rgba(15,23,42,0.06)", transform: "translateY(-1px)" },
      }}
    >
      <CardContent sx={{ p: 1.6, "&:last-child": { pb: 1.6 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.8 }}>
          <Typography
            variant="caption"
            sx={{
              color: COLORS.textSecondary,
              fontWeight: 600,
              fontSize: "0.6875rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {label}
          </Typography>
          <Avatar sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: `${accent}14`, color: accent }}>{icon}</Avatar>
        </Box>
        {loading ? (
          <Skeleton width={48} height={26} />
        ) : (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: COLORS.textPrimary,
              fontSize: "1.25rem",
              lineHeight: 1.2,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grow>
);

/* ============================================================
   EMPTY STATE
   ============================================================ */
const EmptyState = ({ onAdd }) => (
  <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.2 }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: "14px",
        backgroundColor: COLORS.primarySoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.primary,
      }}
    >
      <InboxIcon sx={{ fontSize: 28 }} />
    </Box>
    <Typography
      variant="subtitle1"
      fontWeight={600}
      color={COLORS.textPrimary}
      sx={{ fontSize: "0.9375rem", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      No Leads Found
    </Typography>
    <Typography
      variant="body2"
      color={COLORS.textSecondary}
      sx={{ maxWidth: 300, textAlign: "center", fontSize: "0.8125rem", lineHeight: 1.5, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      Try adjusting your search or filters, or create a new solar enquiry.
    </Typography>
    <Button
      variant="contained"
      size="small"
      startIcon={<AddIcon sx={{ fontSize: 15 }} />}
      onClick={onAdd}
      sx={{ ...primaryButtonSx, mt: 0.5 }}
    >
      Add Lead
    </Button>
  </Box>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);

  const [kpiLeads, setKpiLeads] = useState([]);
  const [kpiLoading, setKpiLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeLead, setActiveLead] = useState(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewLead, setViewLead] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewFollowups, setViewFollowups] = useState([]);
  const [viewLogs, setViewLogs] = useState([]);

  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [assignedToUser, setAssignedToUser] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const [followupDrawerOpen, setFollowupDrawerOpen] = useState(false);
  const [followupData, setFollowupData] = useState({
    note: "",
    followup_type: "Call",
    next_follow_up_date: "",
    status_after_followup: "",
  });
  const [followupSaving, setFollowupSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // State & City Data
  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);
  const [cityOptions, setCityOptions] = useState([]);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers({ limit: 100 });
      const responseData = res?.data;
      if (responseData?.success) {
        setUsersList(responseData.data || []);
      }
    } catch (err) {
      console.error("Error fetching users for dropdown:", err);
    }
  }, []);

  const buildQueryParams = useCallback(
    (overrides = {}) => ({
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
      lead_source: filters.lead_source,
      assigned_to: filters.assigned_to,
      date_from: filters.date_from,
      date_to: filters.date_to,
      ...overrides,
    }),
    [filters]
  );

  const fetchLeadsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeads(buildQueryParams({ page: page + 1, limit: rowsPerPage }));
      if (res?.success) {
        setLeads(res.data || []);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Unable to load leads. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, page, rowsPerPage, showSnackbar]);

  const fetchKpiSnapshot = useCallback(async () => {
    setKpiLoading(true);
    try {
      const res = await getLeads(buildQueryParams({ page: 1, limit: 5000 }));
      if (res?.success) setKpiLeads(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setKpiLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchLeadsList();
  }, [fetchLeadsList]);

  useEffect(() => {
    fetchKpiSnapshot();
  }, [filters]);

  const kpis = useMemo(() => {
    const total = totalCount || kpiLeads.length;
    const newLeads = kpiLeads.filter((l) => l.status === "New Lead").length;
    const followups = kpiLeads.filter((l) => l.next_follow_up_date && !["Won", "Lost", "Not Interested"].includes(l.status)).length;
    const siteVisits = kpiLeads.filter((l) => l.status === "Site Visit Scheduled").length;
    const won = kpiLeads.filter((l) => l.status === "Won").length;
    const lost = kpiLeads.filter((l) => l.status === "Lost").length;
    return { total, newLeads, followups, siteVisits, won, lost };
  }, [kpiLeads, totalCount]);

  const resetForm = useCallback(() => {
    setSelectedLead(null);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    const rajState = indianStates.find((s) => s.name === "Rajasthan");
    setCityOptions(rajState ? City.getCitiesOfState("IN", rajState.isoCode) : []);
    setDuplicateWarning(null);
    setDuplicateChecking(false);
  }, [indianStates]);

  const openCreateDialog = useCallback(() => {
    resetForm();
    setFormDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((lead) => {
    setSelectedLead(lead);
    if (lead.state) {
      const stateObj = indianStates.find((s) => s.name === lead.state);
      setCityOptions(stateObj ? City.getCitiesOfState("IN", stateObj.isoCode) : []);
    } else {
      setCityOptions([]);
    }

    setFormData({
      customer_name: lead.customer_name || "",
      mobile_number: lead.mobile_number || "",
      alternate_number: lead.alternate_number || "",
      email: lead.email || "",
      address: lead.address || "",
      city: lead.city || "",
      state: lead.state || "",
      pincode: lead.pincode || "",
      solar_requirement: lead.solar_requirement || "Residential",
      interest_status: lead.interest_status || "Pending",
      required_kw: lead.required_kw || "",
      remark: lead.remark || "",
      lead_source: lead.lead_source || "Website",
      priority: lead.priority || "Medium",
      status: lead.status || "New Lead",
      assigned_to: lead.assigned_to || "",
      next_follow_up_date: lead.next_follow_up_date ? lead.next_follow_up_date.slice(0, 10) : "",
      site_visit_date: lead.site_visit_date ? lead.site_visit_date.slice(0, 10) : "",
      quotation_amount: lead.quotation_amount || "",
    });
    setFormErrors({});
    setDuplicateWarning(null);
    setDuplicateChecking(false);
    setFormDialogOpen(true);
    setAnchorEl(null);
  }, [indianStates]);

  const handleMobileBlur = useCallback(async () => {
    const mobile = formData.mobile_number.trim();
    if (!mobile || !/^\d{10}$/.test(mobile) || selectedLead) {
      setDuplicateWarning(null);
      return;
    }
    setDuplicateChecking(true);
    try {
      const res = await getLeads({ search: mobile, limit: 5 });
      const matched = (res?.data || []).find((l) => l.mobile_number === mobile);
      setDuplicateWarning(matched || null);
    } catch (err) {
      console.error(err);
      setDuplicateWarning(null);
    } finally {
      setDuplicateChecking(false);
    }
  }, [formData.mobile_number, selectedLead]);

  const validateForm = useCallback((data) => {
    const errors = {};
    if (!data.customer_name.trim()) errors.customer_name = "Customer name is required";
    if (!data.mobile_number.trim()) {
      errors.mobile_number = "Mobile number is required";
    } else if (!/^\d{10}$/.test(data.mobile_number.trim())) {
      errors.mobile_number = "Enter a valid 10-digit mobile number";
    }
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = "Enter a valid email address";
    }
    if (data.required_kw && Number(data.required_kw) < 0) {
      errors.required_kw = "kW cannot be negative";
    }
    if (data.interest_status === "Interested" && (!data.required_kw || Number(data.required_kw) <= 0)) {
      errors.required_kw = "Required kW is mandatory when Interest Status is Interested";
    }
    if (data.interest_status === "Not Interested" && !data.remark.trim()) {
      errors.remark = "Remark is mandatory when Interest Status is Not Interested";
    }
    return errors;
  }, []);

  const handleFormFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === "mobile_number") {
      setDuplicateWarning(null);
    }
  }, []);

  const handleStateChange = useCallback((e) => {
    const stateName = e.target.value;
    handleFormFieldChange("state", stateName);
    handleFormFieldChange("city", "");
    const stateObj = indianStates.find((s) => s.name === stateName);
    setCityOptions(stateObj ? City.getCitiesOfState("IN", stateObj.isoCode) : []);
  }, [handleFormFieldChange, indianStates]);

  const handleCityChange = useCallback((e) => {
    handleFormFieldChange("city", e.target.value);
  }, [handleFormFieldChange]);

  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errors = validateForm(formData);
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) return;

      setSaving(true);
      try {
        if (selectedLead) {
          await updateLead(selectedLead.id, formData);
          showSnackbar("Lead updated successfully.");
        } else {
          await createLead(formData);
          showSnackbar("Lead created successfully.");
        }
        setFormDialogOpen(false);
        resetForm();
        fetchLeadsList();
        fetchKpiSnapshot();
      } catch (err) {
        console.error(err);
        showSnackbar(err.response?.data?.message || "Something went wrong while saving the lead.", "error");
      } finally {
        setSaving(false);
      }
    },
    [formData, selectedLead, validateForm, resetForm, fetchLeadsList, fetchKpiSnapshot, showSnackbar]
  );

  const openViewDrawer = useCallback(async (lead) => {
    setAnchorEl(null);
    setViewDrawerOpen(true);
    setViewLoading(true);
    setViewLead(lead);
    setViewFollowups([]);
    setViewLogs([]);
    try {
      const [leadRes, followupRes, logsRes] = await Promise.all([
        getLeadById(lead.id).catch(() => null),
        getFollowups(lead.id).catch(() => null),
        getActivityLogs(lead.id).catch(() => null),
      ]);
      if (leadRes?.success && leadRes.data) setViewLead(leadRes.data);
      if (followupRes?.success) setViewFollowups(followupRes.data || []);
      if (logsRes?.success) setViewLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const openAssignDrawer = useCallback(
    (lead) => {
      setActiveLead(lead);
      const currentUser = usersList.find((u) => u.id === lead.assigned_to) || null;
      setAssignedToUser(currentUser);
      setAssignDrawerOpen(true);
      setAnchorEl(null);
    },
    [usersList]
  );

  const handleAssignSubmit = useCallback(async () => {
    if (!assignedToUser || !activeLead) return;
    setAssigning(true);
    try {
      await assignLead(activeLead.id, { assigned_to: assignedToUser.id });
      showSnackbar(`Lead assigned to ${assignedToUser.full_name}.`);
      setAssignDrawerOpen(false);
      fetchLeadsList();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to assign lead.", "error");
    } finally {
      setAssigning(false);
    }
  }, [assignedToUser, activeLead, fetchLeadsList, showSnackbar]);

  const openFollowupDrawer = useCallback((lead) => {
    setActiveLead(lead);
    setFollowupData({ note: "", followup_type: "Call", next_follow_up_date: "", status_after_followup: "" });
    setFollowupDrawerOpen(true);
    setAnchorEl(null);
  }, []);

  const handleFollowupSubmit = useCallback(async () => {
    if (!followupData.note.trim() || !activeLead) return;
    setFollowupSaving(true);
    try {
      await addFollowup(activeLead.id, {
        note: followupData.note,
        followup_type: followupData.followup_type,
        follow_up_date: followupData.next_follow_up_date || undefined,
        status_after_followup: followupData.status_after_followup || undefined,
      });
      showSnackbar("Follow-up logged successfully.");
      setFollowupDrawerOpen(false);
      fetchLeadsList();
      fetchKpiSnapshot();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to save follow-up.", "error");
    } finally {
      setFollowupSaving(false);
    }
  }, [followupData, activeLead, fetchLeadsList, fetchKpiSnapshot, showSnackbar]);

  const openDeleteDialog = useCallback((lead) => {
    setActiveLead(lead);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeLead) return;
    setDeleting(true);
    try {
      await deleteLead(activeLead.id);
      showSnackbar("Lead deleted.");
      setDeleteDialogOpen(false);
      fetchLeadsList();
      fetchKpiSnapshot();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to delete lead.", "error");
    } finally {
      setDeleting(false);
    }
  }, [activeLead, fetchLeadsList, fetchKpiSnapshot, showSnackbar]);

  const handleMenuOpen = useCallback((event, lead) => {
    setAnchorEl(event.currentTarget);
    setActiveLead(lead);
  }, []);

  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setPage(0);
        setFilters((prev) => ({ ...prev, search: searchInput }));
      }
    },
    [searchInput]
  );

  const handleSearchBlur = useCallback(() => {
    setPage(0);
    setFilters((prev) => ({ ...prev, search: searchInput }));
  }, [searchInput]);

  const handleFilterChange = useCallback((field, value) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSearchInput("");
    setPage(0);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLeadsList();
    fetchKpiSnapshot();
  }, [fetchLeadsList, fetchKpiSnapshot]);

  const handleCall = useCallback((mobile) => {
    if (!mobile) return;
    window.location.href = `tel:${mobile}`;
  }, []);

  const handleWhatsApp = useCallback((mobile) => {
    if (!mobile) return;
    const cleaned = mobile.replace(/\D/g, "");
    window.open(`https://wa.me/91${cleaned}`, "_blank", "noopener,noreferrer");
  }, []);

  const handleExportCSV = useCallback(() => {
    if (kpiLeads.length === 0) {
      showSnackbar("No data available to export.", "warning");
      return;
    }

    const headers = [
      "Lead Code",
      "Customer Name",
      "Mobile Number",
      "Alternate Number",
      "Email",
      "Address",
      "City",
      "State",
      "Pincode",
      "Solar Requirement",
      "Required kW",
      "Interest Status",
      "Lead Source",
      "Priority",
      "Status",
      "Assigned To",
      "Next Follow-up Date",
      "Site Visit Date",
      "Quotation Amount",
      "Remark",
    ];

    const escapeCsv = (val) => {
      if (!val) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = kpiLeads.map((lead) => {
      return [
        escapeCsv(lead.lead_code),
        escapeCsv(lead.customer_name),
        escapeCsv(lead.mobile_number),
        escapeCsv(lead.alternate_number),
        escapeCsv(lead.email),
        escapeCsv(lead.address),
        escapeCsv(lead.city),
        escapeCsv(lead.state),
        escapeCsv(lead.pincode),
        escapeCsv(lead.solar_requirement),
        escapeCsv(lead.required_kw),
        escapeCsv(lead.interest_status),
        escapeCsv(lead.lead_source),
        escapeCsv(lead.priority),
        escapeCsv(lead.status),
        escapeCsv(lead.assigned_to_name),
        escapeCsv(formatDate(lead.next_follow_up_date)),
        escapeCsv(formatDate(lead.site_visit_date)),
        escapeCsv(lead.quotation_amount),
        escapeCsv(lead.remark),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSnackbar(`Exported ${kpiLeads.length} leads successfully.`);
  }, [kpiLeads, showSnackbar]);

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.lead_source || filters.assigned_to || filters.date_from || filters.date_to
  );

  return (
    <Box sx={{ backgroundColor: COLORS.bg, minHeight: "100vh", p: 1.5, boxSizing: "border-box", width: "100%" }}>
  <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        {/* BREADCRUMBS */}
        <Breadcrumbs separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}>
              Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.primaryDark, fontFamily: "'Inter', sans-serif" }}>
            Lead Management
          </Typography>
        </Breadcrumbs>

        {/* HEADER BANNER */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2.5,
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, #3D2B9A 50%, ${COLORS.primary} 100%)`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            width: "100%",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: "#FFFFFF", fontSize: "1.25rem", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}>
              Lead Management
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem", mt: 0.4, fontFamily: "'Inter', sans-serif" }}>
              Manage enquiries, assignments, quotations & follow-ups
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1.2} sx={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon sx={{ fontSize: 16 }} />}
              onClick={() => setImportDialogOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                px: 2,
                py: 0.8,
                fontSize: "0.8125rem",
                borderColor: "rgba(255,255,255,0.3)",
                color: "#FFFFFF",
                fontFamily: "'Inter', sans-serif",
                "&:hover": { borderColor: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              Import
            </Button>

            <Tooltip title="Export to CSV">
              <span>
                <IconButton
                  onClick={handleExportCSV}
                  disabled={kpiLoading || kpiLeads.length === 0}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    width: 36,
                    height: 36,
                    color: "#FFFFFF",
                    backdropFilter: "blur(4px)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <DownloadIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Refresh">
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    width: 36,
                    height: 36,
                    color: "#FFFFFF",
                    backdropFilter: "blur(4px)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <RefreshIcon
                    sx={{
                      fontSize: 17,
                      animation: loading ? "spin 0.8s linear infinite" : "none",
                      "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={openCreateDialog}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                px: 2.2,
                py: 0.8,
                fontSize: "0.8125rem",
                backgroundColor: "#FFFFFF",
                color: COLORS.primaryDark,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                fontFamily: "'Inter', sans-serif",
                "&:hover": { backgroundColor: "#F1F5F9", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
              }}
            >
              Add Lead
            </Button>
          </Stack>
        </Paper>

        {/* KPI CARDS */}
        <Box sx={{ display: "flex", gap: 1.2, mb: 2.5, width: "100%", flexWrap: "wrap" }}>
          <KpiCard index={0} icon={<InboxIcon sx={{ fontSize: 15 }} />} label="Total Leads" value={kpis.total} accent={COLORS.primary} loading={kpiLoading} />
          <KpiCard index={1} icon={<FiberNewIcon sx={{ fontSize: 15 }} />} label="New Leads" value={kpis.newLeads} accent={COLORS.primaryDark} loading={kpiLoading} />
          <KpiCard index={2} icon={<FollowupIcon sx={{ fontSize: 15 }} />} label="Follow-ups" value={kpis.followups} accent="#0891B2" loading={kpiLoading} />
          <KpiCard index={3} icon={<SiteVisitIcon sx={{ fontSize: 15 }} />} label="Site Visits" value={kpis.siteVisits} accent={COLORS.warning} loading={kpiLoading} />
          <KpiCard index={4} icon={<WonIcon sx={{ fontSize: 15 }} />} label="Won" value={kpis.won} accent={COLORS.success} loading={kpiLoading} />
          <KpiCard index={5} icon={<LostIcon sx={{ fontSize: 15 }} />} label="Lost" value={kpis.lost} accent={COLORS.danger} loading={kpiLoading} />
        </Box>

        {/* FILTERS */}
        <Paper elevation={0} sx={{ ...cardSx, p: 2, mb: 2.5, width: "100%", boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2, width: "100%" }}>
            <Box sx={{ flex: "1 1 200px", minWidth: 160 }}>
              <FieldLabel>Search</FieldLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Name, phone, city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onBlur={handleSearchBlur}
                sx={controlSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: COLORS.textMuted }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ flex: "0 1 140px", minWidth: 120 }}>
              <FieldLabel>Status</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{s}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 120px", minWidth: 100 }}>
              <FieldLabel>Priority</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{p}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 120px", minWidth: 100 }}>
              <FieldLabel>Source</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.lead_source}
                onChange={(e) => handleFilterChange("lead_source", e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
                {LEAD_SOURCE_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{s}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 140px", minWidth: 120 }}>
              <FieldLabel>Assigned To</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.assigned_to}
                onChange={(e) => handleFilterChange("assigned_to", e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>Everyone</MenuItem>
                {usersList.map((u) => (
                  <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{u.full_name}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 130px", minWidth: 110 }}>
              <FieldLabel>From</FieldLabel>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
                sx={dateControlSx}
              />
            </Box>

            <Box sx={{ flex: "0 1 130px", minWidth: 110 }}>
              <FieldLabel>To</FieldLabel>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                sx={dateControlSx}
              />
            </Box>

            <Box sx={{ flex: "0 0 auto" }}>
              <Tooltip title="Reset Filters">
                <span>
                  <IconButton onClick={handleResetFilters} disabled={!hasActiveFilters} size="small" sx={iconSquareBtnSx}>
                    <FilterListOffIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

       {/* COMPACT & ZERO-SCROLL TABLE */}
<Fade in timeout={350}>
  <Paper elevation={0} sx={{ ...cardSx, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
    <TableContainer sx={{ maxHeight: 600, width: "100%", overflowX: "auto" }}>
      <Table stickyHeader size="small" sx={{ width: "100%", minWidth: 900 }}>
        <TableHead>
          <TableRow>
            {[
              { label: "Code", width: "70px" },
              { label: "Customer & Contact", minWidth: "150px" },
              { label: "Location", width: "80px" },
              { label: "Requirement", width: "120px" },
              { label: "Priority", width: "70px" },
              { label: "Status", width: "110px" },
              { label: "Assigned To", width: "100px" },
              { label: "Follow-up", width: "85px" },
              { label: "Actions", width: "110px", align: "right" },
            ].map((head) => (
              <TableCell
                key={head.label}
                align={head.align || "left"}
                sx={{
                  backgroundColor: "#F8FAFC",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  fontSize: "0.65rem",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  py: 1,
                  px: 0.8,
                  width: head.width,
                  minWidth: head.minWidth,
                  borderBottom: `2px solid ${COLORS.border}`,
                  whiteSpace: "nowrap",
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                {head.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 9 }).map((__, ci) => (
                  <TableCell key={ci} sx={{ py: 1, px: 0.8 }}>
                    <Skeleton variant="text" height={18} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} sx={{ p: 0, border: "none" }}>
                <EmptyState onAdd={openCreateDialog} />
              </TableCell>
            </TableRow>
          ) : (
            leads.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{
                  "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 0.8, px: 0.8 },
                  "&:hover td": { backgroundColor: "#FAFBFD" },
                }}
              >
                {/* Code */}
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: COLORS.primary, fontSize: "0.75rem", fontFamily: "'Inter', sans-serif" }}>
                    {row.lead_code}
                  </Typography>
                </TableCell>

                {/* Customer & Phone */}
                <TableCell>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.6rem", bgcolor: COLORS.primaryDark, fontWeight: 600 }}>
                      {getInitials(row.customer_name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.75rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.1 }}>
                        {row.customer_name}
                      </Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif" }}>
                        {row.mobile_number}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                {/* Location */}
                <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, whiteSpace: "nowrap" }}>
                  {row.city || row.state || "—"}
                </TableCell>

                {/* Requirement */}
                <TableCell sx={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                  {row.solar_requirement || "Residential"}
                  {row.required_kw ? ` · ${row.required_kw}kW` : ""}
                </TableCell>

                {/* Priority */}
                <TableCell sx={{ py: 0.5 }}>
                  <PriorityChip priority={row.priority} />
                </TableCell>

                {/* Status */}
                <TableCell sx={{ py: 0.5 }}>
                  <StatusChip status={row.status} />
                </TableCell>

                {/* Assigned To */}
                <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500, whiteSpace: "nowrap" }}>
                  {row.assigned_to_name || "Unassigned"}
                </TableCell>

                {/* Next Follow-up */}
                <TableCell sx={{ fontSize: "0.7rem", color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                  {formatDate(row.next_follow_up_date)}
                </TableCell>

                {/* Actions */}
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Stack direction="row" spacing={0.2} justifyContent="flex-end" alignItems="center">
                    <Tooltip title="View" arrow>
                      <IconButton
                        size="small"
                        onClick={() => openViewDrawer(row)}
                        sx={{ width: 24, height: 24, borderRadius: "5px", color: COLORS.primary, p: 0.2 }}
                      >
                        <ViewIcon sx={{ fontSize: "0.85rem" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Call" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleCall(row.mobile_number)}
                        sx={{ width: 24, height: 24, borderRadius: "5px", color: COLORS.success, p: 0.2 }}
                      >
                        <CallIcon sx={{ fontSize: "0.85rem" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="WhatsApp" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleWhatsApp(row.mobile_number)}
                        sx={{ width: 24, height: 24, borderRadius: "5px", color: "#25D366", p: 0.2 }}
                      >
                        <WhatsAppIcon sx={{ fontSize: "0.85rem" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, row)}
                        sx={{ width: 24, height: 24, borderRadius: "5px", color: COLORS.textMuted, p: 0.2 }}
                      >
                        <MoreVertIcon sx={{ fontSize: "0.85rem" }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      rowsPerPageOptions={[10, 25, 50]}
      component="div"
      count={totalCount}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={(e, p) => setPage(p)}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
      sx={{
        borderTop: `1px solid ${COLORS.border}`,
        backgroundColor: "#FAFBFC",
        "& .MuiTablePagination-toolbar": { minHeight: 38, px: 1.5 },
        "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel": {
          fontSize: "0.75rem",
          color: COLORS.textSecondary,
        },
      }}
    />
  </Paper>
</Fade>

        {/* ACTION MENU */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
              minWidth: 180,
              p: 0.5,
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={() => { if (activeLead) openEditDialog(activeLead); }}
            sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, "&:hover": { backgroundColor: COLORS.primarySoft } }}
          >
            <EditIcon sx={{ fontSize: 18, color: COLORS.primary }} /> Edit Lead
          </MenuItem>
          <MenuItem
            onClick={() => { if (activeLead) openAssignDrawer(activeLead); }}
            sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, "&:hover": { backgroundColor: COLORS.purpleSoft } }}
          >
            <AssignIcon sx={{ fontSize: 18, color: COLORS.purple }} /> Assign
          </MenuItem>
          <MenuItem
            onClick={() => { if (activeLead) openFollowupDrawer(activeLead); }}
            sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, "&:hover": { backgroundColor: "#E0F2FE" } }}
          >
            <FollowupIcon sx={{ fontSize: 18, color: "#0284C7" }} /> Add Follow-up
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => { if (activeLead) openDeleteDialog(activeLead); }}
            sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: COLORS.danger, "&:hover": { backgroundColor: COLORS.dangerSoft } }}
          >
            <DeleteIcon sx={{ fontSize: 18, color: COLORS.danger }} /> Delete Lead
          </MenuItem>
        </Menu>

        {/* CREATE/EDIT DIALOG */}
        <Dialog
          open={formDialogOpen}
          onClose={() => { setFormDialogOpen(false); resetForm(); }}
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
              fontSize: "1.0625rem",
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              pb: 1.5,
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {selectedLead ? "Edit Lead" : "Add New Lead"}
            <IconButton
              onClick={() => { setFormDialogOpen(false); resetForm(); }}
              size="small"
              sx={{ width: 30, height: 30, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0, flex: 1, overflowY: "auto" }}>
            <Box sx={{ p: 3 }}>
              {/* Duplicate Lead Warning Banner */}
              {duplicateWarning && (
                <Box
                  sx={{
                    p: 2,
                    mb: 2.5,
                    borderRadius: "10px",
                    backgroundColor: COLORS.warningSoft,
                    border: `1px solid ${COLORS.warning}40`,
                    borderLeft: `4px solid ${COLORS.warning}`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.8 }}>
                    <WarningIcon sx={{ fontSize: 20, color: COLORS.warning, flexShrink: 0 }} />
                    <Typography
                      sx={{
                        fontSize: "0.8125rem",
                        color: COLORS.warning,
                        fontWeight: 700,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Duplicate Lead Detected
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: "#92400E",
                      fontWeight: 500,
                      lineHeight: 1.6,
                      fontFamily: "'Inter', sans-serif",
                      mb: 1,
                    }}
                  >
                    This number is already linked to{" "}
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {duplicateWarning.lead_code}
                    </Box>{" "}
                    ({duplicateWarning.customer_name}) · Status:{" "}
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {duplicateWarning.status}
                    </Box>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: "#A16207",
                      fontWeight: 500,
                      lineHeight: 1.5,
                      fontFamily: "'Inter', sans-serif",
                      fontStyle: "italic",
                    }}
                  >
                    You can still proceed — this could be a genuine case like a family member
                    or another person using the same number (e.g., husband & wife, father & son
                    sharing a contact number).
                  </Typography>
                </Box>
              )}

              {/* Duplicate Checking Spinner */}
              {duplicateChecking && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    mb: 2.5,
                    borderRadius: "10px",
                    backgroundColor: COLORS.primarySoft,
                    border: `1px solid ${COLORS.primary}30`,
                  }}
                >
                  <CircularProgress size={16} sx={{ color: COLORS.primary }} />
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: COLORS.primary,
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Checking for duplicate lead...
                  </Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                {/* --- 1. Customer Name * --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Customer Name *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Full name"
                    value={formData.customer_name}
                    onChange={(e) => handleFormFieldChange("customer_name", e.target.value)}
                    error={Boolean(formErrors.customer_name)}
                    helperText={formErrors.customer_name}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 2. Mobile Number * --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Mobile Number *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="10-digit number"
                    value={formData.mobile_number}
                    onChange={(e) => handleFormFieldChange("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onBlur={handleMobileBlur}
                    error={Boolean(formErrors.mobile_number)}
                    helperText={formErrors.mobile_number}
                    sx={controlSx}
                    InputProps={{
                      endAdornment: duplicateChecking ? (
                        <InputAdornment position="end">
                          <CircularProgress size={16} />
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                </Grid>

                {/* --- 3. Required kW --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Required kW</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 5"
                    type="number"
                    value={formData.required_kw}
                    onChange={(e) => handleFormFieldChange("required_kw", e.target.value)}
                    error={Boolean(formErrors.required_kw)}
                    helperText={formErrors.required_kw}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 4. Assign To --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Assign To</FieldLabel>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.assigned_to || ""}
                    onChange={(e) => handleFormFieldChange("assigned_to", e.target.value)}
                    sx={controlSx}
                  >
                    <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>
                      <em>Unassigned</em>
                    </MenuItem>
                    {usersList.map((user) => (
                      <MenuItem 
                        key={user.id} 
                        value={user.id} 
                        sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                      >
                        {user.full_name} ({user.role_name || (user.role_id === 2 ? "Manager" : "Sales")})
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* --- 5. State (Default: Rajasthan) --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>State</FieldLabel>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.state}
                    onChange={handleStateChange}
                    sx={controlSx}
                  >
                    <MenuItem value="" sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem" }}>Select State</MenuItem>
                    {indianStates.map((s) => (
                      <MenuItem key={s.isoCode} value={s.name} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* --- 6. City (Default: Jaipur) --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>City</FieldLabel>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.city}
                    onChange={handleCityChange}
                    disabled={!formData.state}
                    sx={controlSx}
                  >
                    <MenuItem value="" sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem" }}>
                      {formData.state ? "Select City" : "Select state first"}
                    </MenuItem>
                    {cityOptions.map((c) => (
                      <MenuItem key={c.name} value={c.name} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* --- 7. Alternate Number & Email --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Alternate Number</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Optional"
                    value={formData.alternate_number}
                    onChange={(e) => handleFormFieldChange("alternate_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Email</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Optional"
                    value={formData.email}
                    onChange={(e) => handleFormFieldChange("email", e.target.value)}
                    error={Boolean(formErrors.email)}
                    helperText={formErrors.email}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 8. Address & Pincode --- */}
                <Grid item xs={12} sm={8}>
                  <FieldLabel>Address</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Full address"
                    value={formData.address}
                    onChange={(e) => handleFormFieldChange("address", e.target.value)}
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Pincode</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={(e) => handleFormFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 9. Solar Specs & Source --- */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Solar Requirement</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.solar_requirement}
                    onChange={(e) => handleFormFieldChange("solar_requirement", e.target.value)}
                    sx={controlSx}
                  >
                    {SOLAR_REQUIREMENT_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Interest Status</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.interest_status}
                    onChange={(e) => handleFormFieldChange("interest_status", e.target.value)}
                    sx={controlSx}
                  >
                    {INTEREST_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Lead Source</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.lead_source}
                    onChange={(e) => handleFormFieldChange("lead_source", e.target.value)}
                    sx={controlSx}
                  >
                    {LEAD_SOURCE_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* --- 10. Priority & Pipeline Status / Quotation --- */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Priority</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.priority}
                    onChange={(e) => handleFormFieldChange("priority", e.target.value)}
                    sx={controlSx}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p} sx={{ fontSize: "0.8125rem" }}>{p}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {!selectedLead ? (
                  <Grid item xs={12} sm={4}>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      fullWidth
                      size="small"
                      value={formData.status}
                      onChange={(e) => handleFormFieldChange("status", e.target.value)}
                      sx={controlSx}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                      ))}
                    </Select>
                  </Grid>
                ) : (
                  <Grid item xs={12} sm={4} />
                )}

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Quotation Amount (₹)</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 250000"
                    type="number"
                    value={formData.quotation_amount}
                    onChange={(e) => handleFormFieldChange("quotation_amount", e.target.value)}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 11. Dates --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Next Follow-up Date</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formData.next_follow_up_date}
                    onChange={(e) => handleFormFieldChange("next_follow_up_date", e.target.value)}
                    sx={dateControlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Site Visit Date</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formData.site_visit_date}
                    onChange={(e) => handleFormFieldChange("site_visit_date", e.target.value)}
                    sx={dateControlSx}
                  />
                </Grid>

                {/* --- 12. Remark --- */}
                <Grid item xs={12}>
                  <FieldLabel>Remark</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Any notes..."
                    multiline
                    minRows={2}
                    maxRows={4}
                    value={formData.remark}
                    onChange={(e) => handleFormFieldChange("remark", e.target.value)}
                    error={Boolean(formErrors.remark)}
                    helperText={formErrors.remark}
                    sx={controlSx}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: `1px solid ${COLORS.border}`,
              backgroundColor: "#FAFBFC",
              gap: 1,
            }}
          >
            <Button
              onClick={() => { setFormDialogOpen(false); resetForm(); }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                px: 3,
                fontSize: "0.875rem",
                color: COLORS.textSecondary,
                "&:hover": { backgroundColor: "#F1F5F9" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleFormSubmit}
              disabled={saving || duplicateChecking}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                px: 3,
                fontSize: "0.875rem",
                backgroundColor: COLORS.primary,
                "&:hover": { backgroundColor: COLORS.primaryDark },
                "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted },
              }}
            >
              {saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : selectedLead ? (
                "Update Lead"
              ) : (
                "Create Lead"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* VIEW DRAWER */}
        <Drawer
          anchor="right"
          open={viewDrawerOpen}
          onClose={() => setViewDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 480,
              maxWidth: "100vw",
              backgroundColor: COLORS.card,
              borderLeft: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <SlideTransition in={viewDrawerOpen}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: COLORS.textPrimary, fontFamily: "'Inter', sans-serif" }}>
                  Lead Details
                </Typography>
                <IconButton
                  onClick={() => setViewDrawerOpen(false)}
                  sx={{ width: 32, height: 32, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
                {viewLoading ? (
                  <Stack spacing={2}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: "8px" }} />
                    ))}
                  </Stack>
                ) : viewLead ? (
                  <Stack spacing={2.5}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                      <Avatar sx={{ width: 48, height: 48, fontSize: "1rem", bgcolor: COLORS.primaryDark, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                        {getInitials(viewLead.customer_name)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", fontFamily: "'Inter', sans-serif", color: COLORS.textPrimary }}>
                          {viewLead.customer_name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.8125rem", color: COLORS.primary, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                          {viewLead.lead_code}
                        </Typography>
                      </Box>
                      <StatusChip status={viewLead.status} />
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Button size="small" startIcon={<CallIcon sx={{ fontSize: 14 }} />} onClick={() => handleCall(viewLead.mobile_number)} sx={outlinedButtonSx}>
                        Call
                      </Button>
                      <Button size="small" startIcon={<WhatsAppIcon sx={{ fontSize: 14 }} />} onClick={() => handleWhatsApp(viewLead.mobile_number)} sx={{ ...outlinedButtonSx, color: "#25D366", borderColor: "#25D36640" }}>
                        WhatsApp
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                        onClick={() => { setViewDrawerOpen(false); openEditDialog(viewLead); }}
                        sx={outlinedButtonSx}
                      >
                        Edit
                      </Button>
                    </Stack>

                    <DetailSectionCard title="Customer Information" icon>
                      <InfoRow icon={<PersonIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Name" value={viewLead.customer_name} />
                      <InfoRow icon={<PhoneIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Mobile" value={viewLead.mobile_number} valueColor={COLORS.success} />
                      <InfoRow icon={<PhoneIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Alternate" value={viewLead.alternate_number} />
                      <InfoRow icon={<EmailIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Email" value={viewLead.email} />
                      <InfoRow icon={<LocationIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Address" value={`${viewLead.address || ""}${viewLead.city ? `, ${viewLead.city}` : ""}${viewLead.state ? `, ${viewLead.state}` : ""}${viewLead.pincode ? ` - ${viewLead.pincode}` : ""}`} />
                    </DetailSectionCard>

                    <DetailSectionCard title="Solar Requirement" icon>
                      <InfoRow icon={<SolarIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Type" value={viewLead.solar_requirement} />
                      <InfoRow icon={<SolarIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Required kW" value={viewLead.required_kw ? `${viewLead.required_kw} kW` : "—"} />
                      <InfoRow icon={<MoneyIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Quotation" value={formatCurrency(viewLead.quotation_amount)} valueColor={COLORS.success} />
                    </DetailSectionCard>

                    <DetailSectionCard title="Lead Details" icon>
                      <InfoRow icon={<HistoryIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Source" value={viewLead.lead_source} />
                      <InfoRow icon={<CalendarIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Follow-up" value={formatDate(viewLead.next_follow_up_date)} valueColor={COLORS.warning} />
                      <InfoRow icon={<SiteVisitIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Site Visit" value={formatDate(viewLead.site_visit_date)} />
                      <InfoRow icon={<NotesIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Remark" value={viewLead.remark} />
                    </DetailSectionCard>

                    {viewFollowups.length > 0 && (
                      <DetailSectionCard title={`Follow-ups (${viewFollowups.length})`} icon>
                        <List disablePadding>
                          {viewFollowups.map((fp, idx) => (
                            <ListItem key={fp.id || idx} sx={{ px: 0, py: 0.8, borderBottom: idx < viewFollowups.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                              <ListItemAvatar sx={{ minWidth: 36 }}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: "0.65rem", bgcolor: COLORS.primarySoft, color: COLORS.primary }}>
                                  {fp.followup_type?.[0] || "F"}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={fp.note}
                                secondary={`${fp.followup_type || "Note"} · ${formatDate(fp.follow_up_date || fp.created_at)}`}
                                primaryTypographyProps={{ fontSize: "0.8125rem", fontWeight: 500, fontFamily: "'Inter', sans-serif", color: COLORS.textPrimary }}
                                secondaryTypographyProps={{ fontSize: "0.6875rem", fontFamily: "'Inter', sans-serif", color: COLORS.textMuted, mt: 0.3 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </DetailSectionCard>
                    )}

                    {viewLogs.length > 0 && (
                      <DetailSectionCard title={`Activity Log (${viewLogs.length})`} icon>
                        {viewLogs.slice(0, 10).map((log, idx) => (
                          <ActivityLogItem key={log.id || idx} log={log} index={idx} />
                        ))}
                      </DetailSectionCard>
                    )}
                  </Stack>
                ) : (
                  <Typography sx={{ textAlign: "center", color: COLORS.textMuted, py: 4, fontFamily: "'Inter', sans-serif" }}>
                    Unable to load lead details.
                  </Typography>
                )}
              </Box>
            </Box>
          </SlideTransition>
        </Drawer>

        {/* ASSIGN DRAWER */}
        <Drawer
          anchor="right"
          open={assignDrawerOpen}
          onClose={() => setAssignDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 380,
              maxWidth: "100vw",
              backgroundColor: COLORS.card,
              borderLeft: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: COLORS.textPrimary, fontFamily: "'Inter', sans-serif" }}>
                Assign Lead
              </Typography>
              <IconButton
                onClick={() => setAssignDrawerOpen(false)}
                sx={{ width: 32, height: 32, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            {activeLead && (
              <Box sx={{ p: 2, backgroundColor: COLORS.bg, borderRadius: "10px", mb: 3, border: `1px solid ${COLORS.border}` }}>
                <Typography sx={{ fontSize: "0.6875rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", mb: 0.5, fontFamily: "'Inter', sans-serif" }}>Lead</Typography>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                  {activeLead.customer_name} ({activeLead.lead_code})
                </Typography>
              </Box>
            )}
            <Autocomplete
              options={usersList}
              getOptionLabel={(o) => o.full_name || ""}
              value={assignedToUser}
              onChange={(e, v) => setAssignedToUser(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(p) => (
                <TextField {...p} label="Select User" size="small" sx={controlSx} />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5, px: 0.5 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: "0.7rem", bgcolor: COLORS.primaryDark, fontFamily: "'Inter', sans-serif" }}>
                        {getInitials(option.full_name)}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500, fontSize: "0.875rem", fontFamily: "'Inter', sans-serif" }}>{option.full_name}</Typography>
                    </Stack>
                  </li>
                );
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleAssignSubmit}
              disabled={assigning || !assignedToUser}
              sx={{
                mt: 3,
                height: 42,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                backgroundColor: COLORS.primary,
                fontFamily: "'Inter', sans-serif",
                "&:hover": { backgroundColor: COLORS.primaryDark },
                "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted },
              }}
            >
              {assigning ? <CircularProgress size={20} color="inherit" /> : "Confirm Assign"}
            </Button>
          </Box>
        </Drawer>

        {/* FOLLOW-UP DRAWER */}
        <Drawer
          anchor="right"
          open={followupDrawerOpen}
          onClose={() => setFollowupDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 420,
              maxWidth: "100vw",
              backgroundColor: COLORS.card,
              borderLeft: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: COLORS.textPrimary, fontFamily: "'Inter', sans-serif" }}>
                Add Follow-up
              </Typography>
              <IconButton
                onClick={() => setFollowupDrawerOpen(false)}
                sx={{ width: 32, height: 32, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            {activeLead && (
              <Box sx={{ p: 2, backgroundColor: COLORS.bg, borderRadius: "10px", mb: 3, border: `1px solid ${COLORS.border}` }}>
                <Typography sx={{ fontSize: "0.6875rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", mb: 0.5, fontFamily: "'Inter', sans-serif" }}>Lead</Typography>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                  {activeLead.customer_name} ({activeLead.lead_code})
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <FieldLabel>Type</FieldLabel>
                <Select
                  fullWidth
                  size="small"
                  value={followupData.followup_type}
                  onChange={(e) => setFollowupData((p) => ({ ...p, followup_type: e.target.value }))}
                  sx={controlSx}
                >
                  {FOLLOWUP_TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{t}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                <FieldLabel>Note *</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="What was discussed?"
                  multiline
                  minRows={3}
                  maxRows={6}
                  value={followupData.note}
                  onChange={(e) => setFollowupData((p) => ({ ...p, note: e.target.value }))}
                  sx={controlSx}
                />
              </Box>
              <Box>
                <FieldLabel>Next Follow-up Date</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={followupData.next_follow_up_date}
                  onChange={(e) => setFollowupData((p) => ({ ...p, next_follow_up_date: e.target.value }))}
                  sx={dateControlSx}
                />
              </Box>
              <Box>
                <FieldLabel>Status After Follow-up</FieldLabel>
                <Select
                  fullWidth
                  displayEmpty
                  size="small"
                  value={followupData.status_after_followup}
                  onChange={(e) => setFollowupData((p) => ({ ...p, status_after_followup: e.target.value }))}
                  sx={controlSx}
                >
                  <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>No change</MenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{s}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFollowupSubmit}
                disabled={followupSaving || !followupData.note.trim()}
                sx={{
                  mt: 1,
                  height: 42,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  backgroundColor: COLORS.primary,
                  fontFamily: "'Inter', sans-serif",
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                  "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted },
                }}
              >
                {followupSaving ? <CircularProgress size={20} color="inherit" /> : "Save Follow-up"}
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* DELETE CONFIRM DIALOG */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              border: `1px solid ${COLORS.border}`,
              p: 1,
            },
          }}
        >
          <Box sx={{ p: 2.5, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "14px",
                backgroundColor: COLORS.dangerSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.danger,
                mx: "auto",
                mb: 2,
              }}
            >
              <DeleteIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", mb: 0.8, fontFamily: "'Inter', sans-serif", color: COLORS.textPrimary }}>
              Delete Lead?
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: COLORS.textSecondary, mb: 3, fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
              {activeLead
                ? `This will permanently delete "${activeLead.customer_name}" (${activeLead.lead_code}). This action cannot be undone.`
                : "This action cannot be undone."}
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  px: 3,
                  fontSize: "0.875rem",
                  color: COLORS.textSecondary,
                  fontFamily: "'Inter', sans-serif",
                  "&:hover": { backgroundColor: "#F1F5F9" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  px: 3,
                  fontSize: "0.875rem",
                  backgroundColor: COLORS.danger,
                  fontFamily: "'Inter', sans-serif",
                  "&:hover": { backgroundColor: "#B91C1C" },
                  "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted },
                }}
              >
                {deleting ? <CircularProgress size={20} color="inherit" /> : "Yes, Delete"}
              </Button>
            </Stack>
          </Box>
        </Dialog>

        {/* IMPORT LEADS DIALOG */}
        <ImportLeadsDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImportComplete={() => {
            fetchLeadsList();
            fetchKpiSnapshot();
          }}
          showSnackbar={showSnackbar}
        />

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <MuiAlert
            onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.875rem",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Box>
  );
}