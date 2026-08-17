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
  Fade,
  Grow,
} from "@mui/material";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Call as CallIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  FiberNew as FiberNewIcon,
  EmojiEvents as WonIcon,
  HighlightOff as LostIcon,
  Inbox as InboxIcon,
  MoreVert as MoreVertIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  PersonAddOutlined as AssignIcon,
  Event as FollowupIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

import { State, City } from "country-state-city";

import {
  getLeads,
  createLead,
  updateLead,
  assignLead,
} from "../../services/leadService";
import { getTeamMembers } from "../../services/userServices";
import LeadDetailModal from "../../pages/Manager/LeadDetailModal";
import ImportLeadsDialog from "../../components/ImportLeadsDialog";
import UploadFileIcon from "@mui/icons-material/UploadFile";

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
};

const controlSx = {
  fontFamily: "'Inter', sans-serif",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FAFBFC",
    fontSize: "0.8125rem",
    color: COLORS.textPrimary,
    minHeight: 38,
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiSelect-select": {
    fontSize: "0.8125rem",
    fontFamily: "'Inter', sans-serif",
  },
};

const dateControlSx = {
  ...controlSx,
  "& .MuiOutlinedInput-root": {
    ...controlSx["& .MuiOutlinedInput-root"],
    "& input[type='date']": {
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.8125rem",
      colorScheme: "light",
    },
  },
};

const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
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
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {children}
  </Typography>
);

const formatDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d)
    ? "—"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getInitials = (n = "") =>
  n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
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
  const s = STATUS_STYLES[status] || { color: COLORS.textMuted, bg: "#F1F2F4" };
  return (
    <Chip
      label={status || "—"}
      size="small"
      sx={{
        color: s.color,
        backgroundColor: s.bg,
        fontWeight: 600,
        fontSize: "0.6875rem",
        height: 22,
        borderRadius: "6px",
        fontFamily: "'Inter', sans-serif",
      }}
    />
  );
};

const PriorityChip = ({ priority }) => {
  const s = PRIORITY_STYLES[priority] || { color: COLORS.textMuted, bg: "#F1F2F4" };
  return (
    <Chip
      label={priority || "—"}
      size="small"
      variant="outlined"
      sx={{
        color: s.color,
        borderColor: `${s.color}40`,
        backgroundColor: s.bg,
        fontWeight: 600,
        fontSize: "0.6875rem",
        height: 22,
        borderRadius: "6px",
        fontFamily: "'Inter', sans-serif",
      }}
    />
  );
};

const KpiCard = ({ icon, label, value, accent, loading, index = 0 }) => (
  <Grow in timeout={280 + index * 100}>
    <Card
      elevation={0}
      sx={{
        flex: 1,
        minWidth: "150px",
        ...cardSx,
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardContent sx={{ p: 1.6, "&:last-child": { pb: 1.6 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 0.8,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: COLORS.textSecondary,
              fontWeight: 600,
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {label}
          </Typography>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              borderRadius: "8px",
              bgcolor: `${accent}14`,
              color: accent,
            }}
          >
            {icon}
          </Avatar>
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
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grow>
);

export default function ManagerLeads() {
  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeLead, setActiveLead] = useState(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);

  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [assignedToUser, setAssignedToUser] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [leadDetail, setLeadDetail] = useState(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);
  const [cityOptions, setCityOptions] = useState([]);

  const showSnackbar = useCallback(
    (message, severity = "success") => setSnackbar({ open: true, message, severity }),
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, teamRes] = await Promise.all([
        getLeads({ page: 1, limit: 5000 }),
        getTeamMembers(),
      ]);
      setLeads(leadsRes?.data || []);
      setTeamMembers(teamRes?.data || teamRes || []);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to fetch data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === "New Lead").length;
    const followups = leads.filter(
      (l) =>
        l.next_follow_up_date &&
        !["Won", "Lost", "Not Interested"].includes(l.status)
    ).length;
    const won = leads.filter((l) => l.status === "Won").length;
    const lost = leads.filter((l) => l.status === "Lost").length;
    return { total, newLeads, followups, won, lost };
  }, [leads]);

  const processedLeads = useMemo(() => {
    let result = [...leads];
    if (filters.status) result = result.filter((l) => l.status === filters.status);
    if (filters.priority)
      result = result.filter((l) => l.priority === filters.priority);
    if (filters.lead_source)
      result = result.filter((l) => l.lead_source === filters.lead_source);
    if (filters.assigned_to)
      result = result.filter(
        (l) => String(l.assigned_to) === String(filters.assigned_to)
      );
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.customer_name?.toLowerCase().includes(q) ||
          l.lead_code?.toLowerCase().includes(q) ||
          l.mobile_number?.includes(q) ||
          l.city?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, filters]);

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

  const openEditDialog = useCallback(
    (lead) => {
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
        next_follow_up_date: lead.next_follow_up_date
          ? lead.next_follow_up_date.slice(0, 10)
          : "",
        site_visit_date: lead.site_visit_date
          ? lead.site_visit_date.slice(0, 10)
          : "",
        quotation_amount: lead.quotation_amount || "",
      });
      setFormErrors({});
      setDuplicateWarning(null);
      setDuplicateChecking(false);
      setFormDialogOpen(true);
      setAnchorEl(null);
    },
    [indianStates]
  );

  const handleMobileBlur = useCallback(async () => {
    const mobile = formData.mobile_number.trim();
    if (!mobile || !/^\d{10}$/.test(mobile) || selectedLead) {
      setDuplicateWarning(null);
      return;
    }
    setDuplicateChecking(true);
    try {
      const res = await getLeads({ search: mobile, limit: 5 });
      const matched = (res?.data || []).find(
        (l) => l.mobile_number === mobile
      );
      if (matched) {
        setDuplicateWarning(matched);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error(err);
      setDuplicateWarning(null);
    } finally {
      setDuplicateChecking(false);
    }
  }, [formData.mobile_number, selectedLead]);

  const validateForm = (data) => {
    const errors = {};
    if (!data.customer_name.trim()) errors.customer_name = "Customer name is required";
    if (!data.mobile_number.trim())
      errors.mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(data.mobile_number.trim()))
      errors.mobile_number = "Enter a valid 10-digit mobile number";
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email))
      errors.email = "Enter a valid email address";
    if (
      data.interest_status === "Interested" &&
      (!data.required_kw || Number(data.required_kw) <= 0)
    ) {
      errors.required_kw =
        "Required kW is mandatory when Interest Status is Interested";
    }
    if (data.interest_status === "Not Interested" && !data.remark.trim()) {
      errors.remark = "Remark is mandatory when Interest Status is Not Interested";
    }
    return errors;
  };

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const n = { ...prev };
      delete n[field];
      return n;
    });
    if (field === "mobile_number") {
      setDuplicateWarning(null);
    }
  }, []);

  const handleStateChange = useCallback(
    (e) => {
      const stateName = e.target.value;
      handleFieldChange("state", stateName);
      handleFieldChange("city", "");
      const stateObj = indianStates.find((s) => s.name === stateName);
      setCityOptions(stateObj ? City.getCitiesOfState("IN", stateObj.isoCode) : []);
    },
    [handleFieldChange, indianStates]
  );

  const handleCityChange = useCallback(
    (e) => handleFieldChange("city", e.target.value),
    [handleFieldChange]
  );

  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errors = validateForm(formData);
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) return;

      setSaving(true);
      try {
        if (selectedLead) await updateLead(selectedLead.id, formData);
        else await createLead(formData);
        showSnackbar(selectedLead ? "Lead updated successfully." : "Lead created successfully.");
        setFormDialogOpen(false);
        resetForm();
        fetchData();
      } catch (err) {
        showSnackbar(
          err.response?.data?.message || "Error saving lead.",
          "error"
        );
      } finally {
        setSaving(false);
      }
    },
    [formData, selectedLead, resetForm, fetchData, showSnackbar]
  );

  const handleUpdateFromModal = useCallback(async () => {
    showSnackbar("Lead updated successfully.");
    await fetchData();
  }, [fetchData, showSnackbar]);

  const handleAssignSubmit = useCallback(async () => {
    if (!assignedToUser || !activeLead) return;
    setAssigning(true);
    try {
      await assignLead(activeLead.id, { assigned_to: assignedToUser.id });
      showSnackbar(`Lead assigned to ${assignedToUser.full_name}.`);
      setAssignDrawerOpen(false);
      fetchData();
    } catch (err) {
      showSnackbar("Assign failed.", "error");
    } finally {
      setAssigning(false);
    }
  }, [assignedToUser, activeLead, fetchData, showSnackbar]);

  const handleCall = (m) => {
    if (m) window.location.href = `tel:${m}`;
  };
  const handleWhatsApp = (m) => {
    if (m) window.open(`https://wa.me/91${m.replace(/\D/g, "")}`, "_blank");
  };

  return (
    <Box
      sx={{
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
        p: 1.5,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        {/* BREADCRUMBS */}
        <Breadcrumbs
          separator={
            <NavigateNextRoundedIcon
              sx={{ fontSize: "0.8rem", color: COLORS.textMuted }}
            />
          }
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon
              sx={{ fontSize: "0.8rem", color: COLORS.textMuted }}
            />
            <Typography
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: COLORS.textMuted,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Dashboard
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: COLORS.primaryDark,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Manager Leads
          </Typography>
        </Breadcrumbs>

        {/* HERO HEADER */}
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
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: "#FFF",
                fontSize: "1.25rem",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              Team Lead Management
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.8125rem",
                mt: 0.4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Track, create & reassign solar leads across your sales team
            </Typography>
          </Box>
          <Stack
            direction="row"
            alignItems="center"
            gap={1.2}
            sx={{ flexShrink: 0, position: "relative", zIndex: 1 }}
          >
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
                color: "#FFF",
                fontFamily: "'Inter', sans-serif",
                "&:hover": { borderColor: "#FFF", backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              Import
            </Button>

            <Tooltip title="Refresh">
              <span>
                <IconButton
                  onClick={fetchData}
                  disabled={loading}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    width: 36,
                    height: 36,
                    color: "#FFF",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <RefreshIcon
                    sx={{
                      fontSize: 17,
                      animation: loading ? "spin 0.8s linear infinite" : "none",
                      "@keyframes spin": {
                        from: { transform: "rotate(0deg)" },
                        to: { transform: "rotate(360deg)" },
                      },
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
                backgroundColor: "#FFF",
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
        <Box
          sx={{ display: "flex", gap: 1.2, mb: 2.5, flexWrap: "wrap", width: "100%" }}
        >
          <KpiCard
            index={0}
            icon={<InboxIcon sx={{ fontSize: 15 }} />}
            label="Total Leads"
            value={kpis.total}
            accent={COLORS.primary}
            loading={loading}
          />
          <KpiCard
            index={1}
            icon={<FiberNewIcon sx={{ fontSize: 15 }} />}
            label="New Leads"
            value={kpis.newLeads}
            accent={COLORS.primaryDark}
            loading={loading}
          />
          <KpiCard
            index={2}
            icon={<FollowupIcon sx={{ fontSize: 15 }} />}
            label="Follow-ups"
            value={kpis.followups}
            accent="#0891B2"
            loading={loading}
          />
          <KpiCard
            index={3}
            icon={<WonIcon sx={{ fontSize: 15 }} />}
            label="Won"
            value={kpis.won}
            accent={COLORS.success}
            loading={loading}
          />
          <KpiCard
            index={4}
            icon={<LostIcon sx={{ fontSize: 15 }} />}
            label="Lost"
            value={kpis.lost}
            accent={COLORS.danger}
            loading={loading}
          />
        </Box>

        {/* FILTER TOOLBAR */}
        <Paper elevation={0} sx={{ ...cardSx, p: 2, mb: 2.5, width: "100%", boxSizing: "border-box" }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: 1.2,
              width: "100%",
            }}
          >
            <Box sx={{ flex: "1 1 200px", minWidth: 160 }}>
              <FieldLabel>Search</FieldLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Name, phone, city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  setFilters((p) => ({ ...p, search: searchInput }))
                }
                onBlur={() =>
                  setFilters((p) => ({ ...p, search: searchInput }))
                }
                sx={controlSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: COLORS.textMuted }}
                      />
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
                onChange={(e) =>
                  setFilters((p) => ({ ...p, status: e.target.value }))
                }
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
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
            </Box>

            <Box sx={{ flex: "0 1 120px", minWidth: 100 }}>
              <FieldLabel>Priority</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.priority}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, priority: e.target.value }))
                }
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem
                    key={p}
                    value={p}
                    sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                  >
                    {p}
                  </MenuItem>
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
                onChange={(e) =>
                  setFilters((p) => ({ ...p, lead_source: e.target.value }))
                }
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
                {LEAD_SOURCE_OPTIONS.map((s) => (
                  <MenuItem
                    key={s}
                    value={s}
                    sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                  >
                    {s}
                  </MenuItem>
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
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    assigned_to: e.target.value,
                  }))
                }
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>Everyone</MenuItem>
                {teamMembers.map((u) => (
                  <MenuItem
                    key={u.id}
                    value={u.id}
                    sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                  >
                    {u.full_name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </Paper>

        {/* ZERO-SCROLL COMPACT TABLE */}
        <Fade in timeout={350}>
          <Paper elevation={0} sx={{ ...cardSx, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
            <TableContainer sx={{ maxHeight: 600, width: "100%", overflowX: "auto" }}>
              <Table stickyHeader size="small" sx={{ width: "100%", minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    {[
                      { label: "Code", width: "8%" },
                      { label: "Customer & Contact", width: "20%" },
                      { label: "Location", width: "9%" },
                      { label: "Requirement", width: "14%" },
                      { label: "Priority", width: "8%" },
                      { label: "Status", width: "11%" },
                      { label: "Assigned To", width: "12%" },
                      { label: "Follow-up", width: "9%" },
                      { label: "Actions", width: "9%", align: "right" },
                    ].map((head) => (
                      <TableCell
                        key={head.label}
                        align={head.align || "left"}
                        sx={{
                          backgroundColor: "#F8FAFC",
                          fontWeight: 700,
                          color: COLORS.textSecondary,
                          fontSize: "0.6875rem",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          py: 1.2,
                          px: 1.2,
                          width: head.width,
                          borderBottom: `2px solid ${COLORS.border}`,
                          whiteSpace: "nowrap",
                          fontFamily: "'Inter', sans-serif",
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
                          <TableCell key={ci} sx={{ py: 1.2, px: 1.2 }}>
                            <Skeleton variant="text" height={20} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : processedLeads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        sx={{
                          textAlign: "center",
                          py: 8,
                          color: COLORS.textMuted,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        No Leads Found
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedLeads
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            "& td": {
                              borderBottom: `1px solid ${COLORS.border}`,
                              py: 1,
                              px: 1.2,
                            },
                            "&:hover td": { backgroundColor: "#FAFBFD" },
                          }}
                        >
                          {/* Code */}
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color: COLORS.primary,
                                fontSize: "0.78rem",
                                fontFamily: "'Inter', sans-serif",
                              }}
                            >
                              {row.lead_code}
                            </Typography>
                          </TableCell>

                          {/* Customer & Phone (Merged) */}
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Avatar
                                sx={{
                                  width: 26,
                                  height: 26,
                                  fontSize: "0.65rem",
                                  bgcolor: COLORS.primaryDark,
                                  fontWeight: 600,
                                  fontFamily: "'Inter', sans-serif",
                                }}
                              >
                                {getInitials(row.customer_name)}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  noWrap
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: "0.8rem",
                                    fontFamily: "'Inter', sans-serif",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {row.customer_name}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "0.7rem",
                                    color: COLORS.textSecondary,
                                    fontFamily: "'Inter', sans-serif",
                                  }}
                                >
                                  {row.mobile_number}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>

                          {/* Location */}
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              whiteSpace: "nowrap",
                              color: COLORS.textSecondary,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {row.city || row.state || "—"}
                          </TableCell>

                          {/* Requirement & kW (Merged) */}
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontFamily: "'Inter', sans-serif",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: COLORS.textPrimary }}>
                              {row.solar_requirement || "Residential"}
                              {row.required_kw ? ` · ${row.required_kw} kW` : ""}
                            </Typography>
                          </TableCell>

                          {/* Priority */}
                          <TableCell>
                            <PriorityChip priority={row.priority} />
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <StatusChip status={row.status} />
                          </TableCell>

                          {/* Assigned To */}
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              whiteSpace: "nowrap",
                              color: COLORS.textSecondary,
                              fontWeight: 500,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {row.assigned_to_name || "Unassigned"}
                          </TableCell>

                          {/* Next Follow-up */}
                          <TableCell
                            sx={{
                              fontSize: "0.72rem",
                              whiteSpace: "nowrap",
                              color: COLORS.textMuted,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {formatDate(row.next_follow_up_date)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell
                            align="right"
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.2}
                              justifyContent="flex-end"
                              alignItems="center"
                            >
                              <Tooltip title="View Details" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setLeadDetail(row);
                                    setDetailModalOpen(true);
                                  }}
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "6px",
                                    color: COLORS.primary,
                                    "&:hover": {
                                      backgroundColor: COLORS.primarySoft,
                                    },
                                  }}
                                >
                                  <ViewIcon sx={{ fontSize: "0.9rem" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Call" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCall(row.mobile_number)}
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "6px",
                                    color: COLORS.success,
                                    "&:hover": {
                                      backgroundColor: COLORS.successSoft,
                                    },
                                  }}
                                >
                                  <CallIcon sx={{ fontSize: "0.9rem" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="WhatsApp" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleWhatsApp(row.mobile_number)
                                  }
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "6px",
                                    color: "#25D366",
                                    "&:hover": {
                                      backgroundColor: "#E8F8EF",
                                    },
                                  }}
                                >
                                  <WhatsAppIcon
                                    sx={{ fontSize: "0.9rem" }}
                                  />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="More Actions" arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    setAnchorEl(e.currentTarget);
                                    setActiveLead(row);
                                  }}
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "6px",
                                    color: COLORS.textMuted,
                                    "&:hover": {
                                      backgroundColor: "#F1F5F9",
                                    },
                                  }}
                                >
                                  <MoreVertIcon
                                    sx={{ fontSize: "0.9rem" }}
                                  />
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
              count={processedLeads.length}
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
                "& .MuiTablePagination-toolbar": {
                  minHeight: 42,
                  px: 2,
                },
                "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel": {
                  fontSize: "0.78rem",
                  color: COLORS.textSecondary,
                  fontFamily: "'Inter', sans-serif",
                },
              }}
            />
          </Paper>
        </Fade>

        {/* ACTION MENU */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
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
            onClick={() => {
              if (activeLead) openEditDialog(activeLead);
            }}
            sx={{
              borderRadius: "8px",
              py: 1.2,
              px: 1.5,
              fontSize: "0.8125rem",
              fontFamily: "'Inter', sans-serif",
              gap: 1.5,
              "&:hover": { backgroundColor: COLORS.primarySoft },
            }}
          >
            <EditIcon sx={{ fontSize: 18, color: COLORS.primary }} /> Edit
            Lead
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (activeLead) {
                setAssignedToUser(
                  teamMembers.find((u) => u.id === activeLead.assigned_to) ||
                    null
                );
                setAssignDrawerOpen(true);
              }
              setAnchorEl(null);
            }}
            sx={{
              borderRadius: "8px",
              py: 1.2,
              px: 1.5,
              fontSize: "0.8125rem",
              fontFamily: "'Inter', sans-serif",
              gap: 1.5,
              "&:hover": { backgroundColor: COLORS.purpleSoft },
            }}
          >
            <AssignIcon sx={{ fontSize: 18, color: COLORS.purple }} />{" "}
            Reassign
          </MenuItem>
        </Menu>

        {/* REASSIGN DRAWER */}
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: COLORS.textPrimary,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Reassign Lead
              </Typography>
              <IconButton
                onClick={() => setAssignDrawerOpen(false)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  color: COLORS.textSecondary,
                  backgroundColor: "#F1F5F9",
                  "&:hover": { backgroundColor: "#E2E8F0" },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            {activeLead && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: COLORS.bg,
                  borderRadius: "10px",
                  mb: 3,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.6875rem",
                    color: COLORS.textMuted,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    mb: 0.5,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Lead
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {activeLead.customer_name} ({activeLead.lead_code})
                </Typography>
              </Box>
            )}
            <Autocomplete
              options={teamMembers}
              getOptionLabel={(o) => o.full_name || ""}
              value={assignedToUser}
              onChange={(e, v) => setAssignedToUser(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(p) => (
                <TextField
                  {...p}
                  label="Select Team Member"
                  size="small"
                  sx={controlSx}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ py: 0.5, px: 0.5 }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: "0.7rem",
                          bgcolor: COLORS.primaryDark,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {getInitials(option.full_name)}
                      </Avatar>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.875rem",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {option.full_name}
                      </Typography>
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
                "&.Mui-disabled": {
                  backgroundColor: COLORS.border,
                  color: COLORS.textMuted,
                },
              }}
            >
              {assigning ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Confirm Reassign"
              )}
            </Button>
          </Box>
        </Drawer>

        {/* CREATE/EDIT DIALOG (SEQUENCE & DEFAULT MATCHED WITH ADMIN) */}
        <Dialog
          open={formDialogOpen}
          onClose={() => {
            setFormDialogOpen(false);
            resetForm();
          }}
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
              onClick={() => {
                setFormDialogOpen(false);
                resetForm();
              }}
              size="small"
              sx={{
                width: 30,
                height: 30,
                borderRadius: "8px",
                color: COLORS.textSecondary,
                backgroundColor: "#F1F5F9",
                "&:hover": { backgroundColor: "#E2E8F0" },
              }}
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
                    <WarningIcon
                      sx={{ fontSize: 20, color: COLORS.warning, flexShrink: 0 }}
                    />
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
                {/* 1. Customer Name * */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Customer Name *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Full name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      handleFieldChange("customer_name", e.target.value)
                    }
                    error={Boolean(formErrors.customer_name)}
                    helperText={formErrors.customer_name}
                    sx={controlSx}
                  />
                </Grid>

                {/* 2. Mobile Number * */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Mobile Number *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="10-digit number"
                    value={formData.mobile_number}
                    onChange={(e) =>
                      handleFieldChange("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
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

                {/* 3. Required kW */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Required kW</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 5"
                    type="number"
                    value={formData.required_kw}
                    onChange={(e) =>
                      handleFieldChange("required_kw", e.target.value)
                    }
                    error={Boolean(formErrors.required_kw)}
                    helperText={formErrors.required_kw}
                    sx={controlSx}
                  />
                </Grid>

                {/* 4. Assign To */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Assign To</FieldLabel>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.assigned_to || ""}
                    onChange={(e) =>
                      handleFieldChange("assigned_to", e.target.value)
                    }
                    sx={controlSx}
                  >
                    <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>
                      <em>Unassigned</em>
                    </MenuItem>
                    {teamMembers.map((u) => (
                      <MenuItem
                        key={u.id}
                        value={u.id}
                        sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                      >
                        {u.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 5. State (Default: Rajasthan) */}
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
                    <MenuItem value="" sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem" }}>
                      Select State
                    </MenuItem>
                    {indianStates.map((s) => (
                      <MenuItem
                        key={s.isoCode}
                        value={s.name}
                        sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                      >
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 6. City (Default: Jaipur) */}
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
                      <MenuItem
                        key={c.name}
                        value={c.name}
                        sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                      >
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 7. Alternate Number */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Alternate Number</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Optional"
                    value={formData.alternate_number}
                    onChange={(e) =>
                      handleFieldChange(
                        "alternate_number",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    sx={controlSx}
                  />
                </Grid>

                {/* 8. Email */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Email</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Optional"
                    value={formData.email}
                    onChange={(e) =>
                      handleFieldChange("email", e.target.value)
                    }
                    error={Boolean(formErrors.email)}
                    helperText={formErrors.email}
                    sx={controlSx}
                  />
                </Grid>

                {/* 9. Address & Pincode */}
                <Grid item xs={12} sm={8}>
                  <FieldLabel>Address</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Full address"
                    value={formData.address}
                    onChange={(e) =>
                      handleFieldChange("address", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleFieldChange(
                        "pincode",
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    sx={controlSx}
                  />
                </Grid>

                {/* 10. Solar Requirement */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Solar Requirement</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.solar_requirement}
                    onChange={(e) =>
                      handleFieldChange("solar_requirement", e.target.value)
                    }
                    sx={controlSx}
                  >
                    {SOLAR_REQUIREMENT_OPTIONS.map((s) => (
                      <MenuItem
                        key={s}
                        value={s}
                        sx={{ fontSize: "0.8125rem" }}
                      >
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 11. Interest Status */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Interest Status</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.interest_status}
                    onChange={(e) =>
                      handleFieldChange("interest_status", e.target.value)
                    }
                    sx={controlSx}
                  >
                    {INTEREST_OPTIONS.map((s) => (
                      <MenuItem
                        key={s}
                        value={s}
                        sx={{ fontSize: "0.8125rem" }}
                      >
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 12. Lead Source */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Lead Source</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.lead_source}
                    onChange={(e) =>
                      handleFieldChange("lead_source", e.target.value)
                    }
                    sx={controlSx}
                  >
                    {LEAD_SOURCE_OPTIONS.map((s) => (
                      <MenuItem
                        key={s}
                        value={s}
                        sx={{ fontSize: "0.8125rem" }}
                      >
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 13. Priority */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Priority</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.priority}
                    onChange={(e) =>
                      handleFieldChange("priority", e.target.value)
                    }
                    sx={controlSx}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <MenuItem
                        key={p}
                        value={p}
                        sx={{ fontSize: "0.8125rem" }}
                      >
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* 14. Status (Create time only) */}
                {!selectedLead ? (
                  <Grid item xs={12} sm={4}>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      fullWidth
                      size="small"
                      value={formData.status}
                      onChange={(e) =>
                        handleFieldChange("status", e.target.value)
                      }
                      sx={controlSx}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem
                          key={s}
                          value={s}
                          sx={{ fontSize: "0.8125rem" }}
                        >
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                ) : (
                  <Grid item xs={12} sm={4} />
                )}

                {/* 15. Quotation Amount */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Quotation Amount (₹)</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 250000"
                    type="number"
                    value={formData.quotation_amount}
                    onChange={(e) =>
                      handleFieldChange("quotation_amount", e.target.value)
                    }
                    sx={controlSx}
                  />
                </Grid>

                {/* 16. Dates */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Next Follow-up Date</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formData.next_follow_up_date}
                    onChange={(e) =>
                      handleFieldChange("next_follow_up_date", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleFieldChange("site_visit_date", e.target.value)
                    }
                    sx={dateControlSx}
                  />
                </Grid>

                {/* 17. Remark */}
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
                    onChange={(e) =>
                      handleFieldChange("remark", e.target.value)
                    }
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
              onClick={() => {
                setFormDialogOpen(false);
                resetForm();
              }}
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
                fontFamily: "'Inter', sans-serif",
                "&:hover": { backgroundColor: COLORS.primaryDark },
                "&.Mui-disabled": {
                  backgroundColor: COLORS.border,
                  color: COLORS.textMuted,
                },
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

        {/* LEAD DETAIL MODAL */}
        <LeadDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          lead={leadDetail}
          onUpdate={handleUpdateFromModal}
        />

        {/* IMPORT LEADS DIALOG */}
        <ImportLeadsDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImportComplete={() => fetchData()}
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