// ======================================================
// 1. IMPORTS
// ======================================================
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Switch,
  CircularProgress,
  Snackbar,
  Alert,
  Slide,
  Breadcrumbs,
  Stack,
  Select,
  Card,
  CardContent,
} from "@mui/material";

// Material UI Icons
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import BadgeIcon from "@mui/icons-material/Badge";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

// Services (API Layer)
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "../../services/userServices";

// ======================================================
// 2. CONSTANTS & DESIGN SYSTEM
// ======================================================
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

const STATUS_ACTIVE = "Active";
const STATUS_INACTIVE = "Inactive";

const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  primarySoft: "#E6F0FA",
  bg: "#F8FAFC",
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
  purple: "#9333EA",
  purpleSoft: "#F3E8FF",
};

const SlideTransition = React.forwardRef((props, ref) => (
  <Slide ref={ref} {...props} direction="left" />
));

const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "none",
};

const primaryButtonSx = {
  height: 36,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.78rem",
  px: 2,
  backgroundColor: COLORS.primary,
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: COLORS.primaryDark,
  },
};

const outlinedButtonSx = {
  height: 36,
  borderRadius: "6px",
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
  borderRadius: "6px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.primary,
  backgroundColor: "#F1F5F9",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#E2E8F0" },
};

const controlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: COLORS.card,
    height: "36px",
    fontSize: "0.78rem",
    color: COLORS.textPrimary,
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiSelect-select": { display: "flex", alignItems: "center", fontSize: "0.78rem" },
};

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

const getRoleChipConfig = (roleId, roleName) => {
  const id = Number(roleId);
  if (id === ROLE_SUPER_ADMIN) {
    return { label: roleName || "Super Admin", bg: COLORS.primarySoft, color: COLORS.primaryDark };
  }
  if (id === ROLE_MANAGER) {
    return { label: roleName || "Manager", bg: COLORS.warningSoft, color: COLORS.warning };
  }
  return { label: roleName || "Sales", bg: COLORS.successSoft, color: COLORS.success };
};

const getRoleChipByName = (roleName) => {
  const label = roleName || "Unassigned";
  const nameLower = label.toLowerCase();
  if (nameLower.includes("admin")) return { label, bg: COLORS.primarySoft, color: COLORS.primaryDark };
  if (nameLower.includes("manager")) return { label, bg: COLORS.warningSoft, color: COLORS.warning };
  return { label, bg: COLORS.successSoft, color: COLORS.success };
};

const getRoleLabel = (roleId) => {
  const id = Number(roleId);
  if (id === ROLE_SUPER_ADMIN) return "Super Admin";
  if (id === ROLE_MANAGER) return "Manager";
  return "Sales Representative";
};

const getCurrentUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    const rawUser =
      localStorage.getItem("user") ||
      localStorage.getItem("authUser") ||
      localStorage.getItem("currentUser") ||
      sessionStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const id = parsed?.id ?? parsed?.user_id ?? parsed?.userId ?? null;
      if (id !== null && id !== undefined) return id;
    }
  } catch (e) {}
  return null;
};

const SELF_ACTION_TOOLTIP = "You cannot modify your own account.";

const circleActionSx = (color, soft) => ({
  width: 26,
  height: 26,
  borderRadius: "5px",
  color,
  backgroundColor: soft,
  p: 0.3,
  "&:hover": {
    backgroundColor: color,
    color: "#FFFFFF",
  },
});

const disabledCircleActionSx = {
  width: 26,
  height: 26,
  borderRadius: "5px",
  color: COLORS.textMuted,
  backgroundColor: "#F1F5F9",
  cursor: "not-allowed",
  pointerEvents: "none",
  opacity: 0.6,
  p: 0.3,
};

const SectionTitle = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.72rem",
      fontWeight: 800,
      color: COLORS.primary,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      pb: 0.8,
      mb: 0.2,
      borderBottom: `1px solid ${COLORS.border}`,
    }}
  >
    {children}
  </Typography>
);

const exportUsersToCsv = (rows) => {
  if (!rows || !rows.length) return;
  const headers = ["Full Name", "Username", "Email", "Phone", "Role", "Manager", "Status", "Created At"];
  const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  rows.forEach((r) => {
    lines.push(
      [r.full_name, r.username, r.email, r.phone, r.role_name || "", r.manager_name || "", r.status || "", r.created_at ? new Date(r.created_at).toISOString() : ""]
        .map(escape)
        .join(",")
    );
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ======================================================
// MAIN COMPONENT
// ======================================================
const Users = () => {
  const [usersList, setUsersList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeOnPage: 0,
    inactiveOnPage: 0,
    uniqueRoleNames: [],
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [userForm, setUserForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role_id: ROLE_SALES,
    manager_id: "",
    profile_image: null,
  });
  const [formErrors, setFormErrors] = useState({});

  const [viewDetails, setViewDetails] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchManagersDropdown();
  }, []);

  useEffect(() => {
    fetchUsersData();
  }, [page, rowsPerPage, debouncedSearch, roleFilter, statusFilter]);

  const fetchManagersDropdown = async () => {
    try {
      const res = await getUsers({ role: ROLE_MANAGER, limit: 100 });
      const data = res?.data?.data;
      setManagersList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load managers dropdown", e);
    }
  };

  const fetchUsersData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };

      const res = await getUsers(params);
      const payload = res?.data || {};
      const userArray = Array.isArray(payload.data) ? payload.data : [];
      const totalRecords = payload.pagination?.totalRecords ?? userArray.length;

      setUsersList(userArray);
      setTotalCount(totalRecords);

      const uniqueRoleNames = Array.from(
        new Set(userArray.map((u) => u.role_name).filter(Boolean))
      );
      setStats({
        totalUsers: totalRecords,
        activeOnPage: userArray.filter((u) => u.status === STATUS_ACTIVE).length,
        inactiveOnPage: userArray.filter((u) => u.status === STATUS_INACTIVE).length,
        uniqueRoleNames,
      });
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to load users list.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, roleFilter, statusFilter]);

  const handleRefresh = async () => {
    await Promise.all([fetchUsersData(), fetchManagersDropdown()]);
    showNotification("User list refreshed.", "info");
  };

  const buildUserPayload = () => {
    const isSales = Number(userForm.role_id) === ROLE_SALES;
    const payload = {
      role_id: Number(userForm.role_id),
      manager_id: isSales ? userForm.manager_id || null : null,
      full_name: userForm.full_name.trim(),
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      phone: userForm.phone.trim(),
    };
    if (drawerMode === "add") {
      payload.password = userForm.password;
    }
    return payload;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    try {
      setFormSubmitting(true);
      const payload = buildUserPayload();

      if (drawerMode === "add") {
        await createUser(payload);
        showNotification("New team member added successfully!", "success");
      } else {
        await updateUser(selectedUserId, payload);
        showNotification("User details updated successfully!", "success");
      }

      setDrawerMode(null);
      await fetchUsersData();
      await fetchManagersDropdown();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save user details.", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj) => {
    const isActive = userObj.status === STATUS_ACTIVE;
    const newStatus = isActive ? STATUS_INACTIVE : STATUS_ACTIVE;

    try {
      await updateUserStatus(userObj.id, { status: newStatus });
      showNotification(
        `User ${newStatus === STATUS_ACTIVE ? "activated" : "deactivated"} successfully!`,
        "success"
      );
      await fetchUsersData();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update status.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await deleteUser(userToDelete.id);
      showNotification("User account soft-deleted successfully.", "success");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await fetchUsersData();
      await fetchManagersDropdown();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to delete user.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getAvatarUrl = (fileName) => {
    if (!fileName) return "";
    return `${API_BASE_URL}/uploads/profiles/${fileName}`;
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "N/A");

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const handleOpenAddDrawer = () => {
    setUserForm({
      full_name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      role_id: ROLE_SALES,
      manager_id: "",
      profile_image: null,
    });
    setFormErrors({});
    setSelectedUserId(null);
    setDrawerMode("add");
  };

  const handleOpenEditDrawer = async (userObj) => {
    setSelectedUserId(userObj.id);
    setDrawerMode("edit");
    setFormErrors({});
    setDrawerLoading(true);

    try {
      const res = await getUserById(userObj.id);
      const data = res?.data?.data;
      setUserForm({
        full_name: data?.full_name || "",
        username: data?.username || "",
        email: data?.email || "",
        phone: data?.phone || "",
        password: "",
        confirm_password: "",
        role_id: Number(data?.role_id) || ROLE_SALES,
        manager_id: data?.manager_id || "",
        profile_image: data?.profile_image || null,
      });
    } catch (e) {
      showNotification("Failed to load user details.", "error");
      setDrawerMode(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenViewDrawer = async (userObj) => {
    setSelectedUserId(userObj.id);
    setDrawerMode("view");
    setDrawerLoading(true);

    try {
      const res = await getUserById(userObj.id);
      setViewDetails(res?.data?.data || null);
    } catch (e) {
      showNotification("Failed to load user details.", "error");
      setDrawerMode(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!userForm.full_name.trim()) errors.full_name = "Full Name is required";
    if (!userForm.username.trim()) errors.username = "Username is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userForm.email.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(userForm.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!userForm.phone.trim()) errors.phone = "Phone number is required";

    if (drawerMode === "add") {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/]).{8,}$/;
      if (!userForm.password) {
        errors.password = "Password is required";
      } else if (!strongPasswordRegex.test(userForm.password)) {
        errors.password = "8+ chars, upper, lower, number & special character";
      }

      if (userForm.password !== userForm.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    }

    if (Number(userForm.role_id) === ROLE_SALES && !userForm.manager_id) {
      errors.manager_id = "Assigning a Manager is mandatory for Sales Users";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const pageSize = usersList.length;
  const pctOfPage = (n) => (pageSize > 0 ? Math.round((n / pageSize) * 100) : 0);

  const statCards = useMemo(
    () => [
      {
        key: "totalUsers",
        label: "TOTAL USERS",
        value: stats.totalUsers,
        caption: "Across all pages",
        icon: <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.primary,
        soft: COLORS.primarySoft,
      },
      {
        key: "active",
        label: "ACTIVE USERS",
        value: stats.activeOnPage,
        caption: `${pctOfPage(stats.activeOnPage)}% of this page`,
        icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.success,
        soft: COLORS.successSoft,
      },
      {
        key: "inactive",
        label: "INACTIVE USERS",
        value: stats.inactiveOnPage,
        caption: `${pctOfPage(stats.inactiveOnPage)}% of this page`,
        icon: <PersonOffOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.danger,
        soft: COLORS.dangerSoft,
      },
      {
        key: "roles",
        label: "ROLES SHOWN",
        value: stats.uniqueRoleNames.length,
        caption: stats.uniqueRoleNames.length ? stats.uniqueRoleNames.join(" · ") : "No roles on this page",
        icon: <ShieldOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.warning,
        soft: COLORS.warningSoft,
      },
    ],
    [stats, pageSize]
  );

  const hasActiveFilters = Boolean(search || roleFilter || statusFilter);

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
        p: 1.5,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        
        {/* ================= BREADCRUMB ================= */}
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />}
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: COLORS.textMuted }}>
              Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: COLORS.textMuted }}>
            Administration
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.primary }}>
            User Management
          </Typography>
        </Breadcrumbs>

        {/* ================= HERO HEADER ================= */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1rem" }}>
              User Management Directory
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.1 }}>
              Manage managers and sales team members, assign reporting lines, and control account access.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1.2} sx={{ flexShrink: 0 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={loading} size="small" sx={iconSquareBtnSx}>
                <RefreshRoundedIcon
                  sx={{
                    fontSize: 17,
                    animation: loading ? "spin 0.9s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />}
              onClick={() => exportUsersToCsv(usersList)}
              disabled={!usersList.length}
              sx={outlinedButtonSx}
            >
              Export
            </Button>

            <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />} onClick={handleOpenAddDrawer} sx={primaryButtonSx}>
              Add User
            </Button>
          </Stack>
        </Paper>

        {/* ================= STAT CARDS ================= */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, width: "100%", flexWrap: "wrap" }}>
          {statCards.map((s) => (
            <Card key={s.key} elevation={0} sx={{ flex: 1, minWidth: "160px", borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.8 }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.03em" }}>
                    {s.label}
                  </Typography>
                  <Avatar sx={{ width: 28, height: 28, borderRadius: "6px", bgcolor: s.soft, color: s.color }}>
                    {s.icon}
                  </Avatar>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.2rem", lineHeight: 1.2 }}>
                  {loading ? <Skeleton width={40} height={24} /> : s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.2, display: "block", fontWeight: 600, fontSize: "0.68rem" }}>
                  {loading ? <Skeleton width={70} height={12} /> : s.caption}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* ================= FILTER TOOLBAR ================= */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1.5, mb: 2, width: "100%", boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2 }}>
            <Box sx={{ flex: "1 1 220px", minWidth: 180 }}>
              <FieldLabel>Search</FieldLabel>
              <TextField
                fullWidth
                placeholder="Search name, username, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
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
              <FieldLabel>Role</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                renderValue={(val) =>
                  val === "" ? (
                    <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>All Roles</Box>
                  ) : (
                    getRoleLabel(val)
                  )
                }
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Roles</MenuItem>
                <MenuItem value={ROLE_SUPER_ADMIN} sx={{ fontSize: "0.78rem" }}>Super Admin</MenuItem>
                <MenuItem value={ROLE_MANAGER} sx={{ fontSize: "0.78rem" }}>Manager</MenuItem>
                <MenuItem value={ROLE_SALES} sx={{ fontSize: "0.78rem" }}>Sales Representative</MenuItem>
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 140px", minWidth: 110 }}>
              <FieldLabel>Status</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                renderValue={(val) =>
                  val === "" ? <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>All Status</Box> : val
                }
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Status</MenuItem>
                <MenuItem value={STATUS_ACTIVE} sx={{ fontSize: "0.78rem" }}>Active</MenuItem>
                <MenuItem value={STATUS_INACTIVE} sx={{ fontSize: "0.78rem" }}>Inactive</MenuItem>
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
                      "&:hover": hasActiveFilters
                        ? { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary }
                        : {},
                    }}
                  >
                    <FilterListOffIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* ================= MAIN DATA TABLE (COMPACT & ZERO-SCROLL) ================= */}
        <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
          <TableContainer sx={{ maxHeight: 600, width: "100%", overflowX: "auto" }}>
            <Table stickyHeader sx={{ minWidth: 800, width: "100%" }} size="small">
              <TableHead>
                <TableRow>
                  {[
                    { label: "USER", width: "24%" },
                    { label: "ROLE", width: "14%" },
                    { label: "MANAGER", width: "14%" },
                    { label: "CONTACT", width: "22%" },
                    { label: "STATUS", width: "12%" },
                    { label: "CREATED", width: "10%" },
                    { label: "ACTIONS", width: "4%", align: "right" },
                  ].map((h, i) => (
                    <TableCell
                      key={i}
                      align={h.align || "left"}
                      sx={{
                        fontWeight: 800,
                        color: COLORS.primaryDark,
                        fontSize: "0.68rem",
                        letterSpacing: "0.03em",
                        py: 1,
                        px: 1,
                        width: h.width,
                        backgroundColor: "#F8FAFC",
                        borderBottom: `2px solid ${COLORS.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  Array.from(new Array(rowsPerPage > 8 ? 8 : rowsPerPage)).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ py: 0.8, px: 1 }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Skeleton variant="circular" width={26} height={26} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton width="60%" height={12} />
                            <Skeleton width="40%" height={10} />
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton variant="rounded" width={60} height={18} /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton width={80} height={12} /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton width={100} height={12} /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton width={50} height={18} /></TableCell>
                      <TableCell sx={{ py: 0.8, px: 1 }}><Skeleton width={60} height={12} /></TableCell>
                      <TableCell align="right" sx={{ py: 0.8, px: 1 }}><Skeleton width={70} height={24} sx={{ ml: "auto" }} /></TableCell>
                    </TableRow>
                  ))
                ) : usersList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, border: 0 }}>
                      <Box sx={{ textAlign: "center", maxWidth: 320, mx: "auto" }}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: "12px",
                            backgroundColor: COLORS.primarySoft,
                            color: COLORS.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 1.5,
                          }}
                        >
                          <Inventory2OutlinedIcon sx={{ fontSize: "1.6rem" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.9rem" }}>
                          No Users Found
                        </Typography>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.3, mb: 1.5 }}>
                          Try adjusting search queries or filter selections, or create a new user.
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: 14 }} />}
                          onClick={handleOpenAddDrawer}
                          sx={primaryButtonSx}
                        >
                          Create User
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  usersList.map((row) => {
                    const isActive = row.status === STATUS_ACTIVE;
                    const roleChip = getRoleChipByName(row.role_name);
                    const isSelfRow =
                      currentUserId !== null &&
                      currentUserId !== undefined &&
                      String(row.id) === String(currentUserId);

                    return (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{
                          "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 0.8, px: 1 },
                          "&:hover td": { backgroundColor: "#FAFBFD" },
                        }}
                      >
                        {/* User Column */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar
                              src={getAvatarUrl(row.profile_image)}
                              sx={{
                                width: 26,
                                height: 26,
                                backgroundColor: COLORS.primaryDark,
                                color: "#FFFFFF",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                              }}
                            >
                              {getInitials(row.full_name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.75rem", lineHeight: 1.1 }}
                                noWrap
                              >
                                {row.full_name}
                              </Typography>
                              <Typography sx={{ color: COLORS.textMuted, fontSize: "0.68rem" }} noWrap>
                                @{row.username}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Chip
                            label={roleChip.label}
                            size="small"
                            sx={{
                              backgroundColor: roleChip.bg,
                              color: roleChip.color,
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              height: 20,
                              px: 0.3,
                            }}
                          />
                        </TableCell>

                        {/* Manager */}
                        <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textPrimary, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {row.manager_name || "—"}
                        </TableCell>

                        {/* Contact */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" gap={0.4} sx={{ mb: 0.1 }}>
                            <MailOutlineRoundedIcon sx={{ fontSize: "0.68rem", color: COLORS.textMuted }} />
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }} noWrap>
                              {row.email}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" gap={0.4}>
                            <CallOutlinedIcon sx={{ fontSize: "0.68rem", color: COLORS.textMuted }} />
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
                              {row.phone || "N/A"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Status + Switch */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.65rem",
                                height: 18,
                                backgroundColor: isActive ? COLORS.successSoft : COLORS.dangerSoft,
                                color: isActive ? COLORS.success : COLORS.danger,
                              }}
                            />
                            <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : (isActive ? "Deactivate User" : "Activate User")}>
                              <span>
                                <Switch
                                  size="small"
                                  checked={isActive}
                                  disabled={isSelfRow}
                                  onChange={() => handleToggleStatus(row)}
                                  sx={{
                                    transform: "scale(0.85)",
                                    "& .MuiSwitch-switchBase.Mui-checked": { color: COLORS.success },
                                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                      backgroundColor: COLORS.success,
                                    },
                                  }}
                                />
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Created Date */}
                        <TableCell sx={{ fontSize: "0.7rem", color: COLORS.textSecondary, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {formatDate(row.created_at)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={0.3}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenViewDrawer(row)}
                                sx={circleActionSx(COLORS.primary, COLORS.primarySoft)}
                              >
                                <VisibilityOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Edit User"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditDrawer(row)}
                                  disabled={isSelfRow}
                                  sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.warning, COLORS.warningSoft)}
                                >
                                  <EditOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Delete User"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setUserToDelete(row);
                                    setDeleteDialogOpen(true);
                                  }}
                                  disabled={isSelfRow}
                                  sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.danger, COLORS.dangerSoft)}
                                >
                                  <DeleteOutlineOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ================= COMPACT PAGINATION ================= */}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              borderTop: `1px solid ${COLORS.border}`,
              "& .MuiTablePagination-toolbar": {
                minHeight: 34,
                px: 1.5,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: "0.7rem",
                color: COLORS.textSecondary,
              },
              "& .MuiTablePagination-select": {
                fontSize: "0.7rem",
              },
            }}
          />
        </Paper>
      </Box>

      {/* ================= ADD / EDIT DRAWER ================= */}
      <Drawer
        anchor="right"
        open={drawerMode === "add" || drawerMode === "edit"}
        onClose={() => setDrawerMode(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 480 },
            p: 0,
          },
        }}
      >
        <SlideTransition in={drawerMode === "add" || drawerMode === "edit"} mountOnEnter unmountOnExit>
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2.5,
                py: 2,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.textPrimary }}>
                {drawerMode === "add" ? "Add New User" : "Edit User"}
              </Typography>
              <IconButton size="small" onClick={() => setDrawerMode(null)} sx={iconSquareBtnSx}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {drawerLoading ? (
              <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                {Array.from(new Array(6)).map((_, idx) => (
                  <Box key={idx}>
                    <Skeleton width={80} height={12} sx={{ mb: 0.8 }} />
                    <Skeleton variant="rounded" height={38} sx={{ borderRadius: "6px" }} />
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
                <SectionTitle>Basic Information</SectionTitle>
                <Box>
                  <FieldLabel>Full Name</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="John Doe"
                    value={userForm.full_name}
                    onChange={(e) => handleFormChange("full_name", e.target.value)}
                    error={Boolean(formErrors.full_name)}
                    helperText={formErrors.full_name || ""}
                    sx={controlSx}
                  />
                </Box>

                <Box>
                  <FieldLabel>Username</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="johndoe"
                    value={userForm.username}
                    onChange={(e) => handleFormChange("username", e.target.value)}
                    error={Boolean(formErrors.username)}
                    helperText={formErrors.username || ""}
                    sx={controlSx}
                  />
                </Box>

                <Box>
                  <FieldLabel>Email Address</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    placeholder="john@example.com"
                    value={userForm.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    error={Boolean(formErrors.email)}
                    helperText={formErrors.email || ""}
                    sx={controlSx}
                  />
                </Box>

                <Box>
                  <FieldLabel>Phone Number</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="+91 98765 43210"
                    value={userForm.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    error={Boolean(formErrors.phone)}
                    helperText={formErrors.phone || ""}
                    sx={controlSx}
                  />
                </Box>

                <SectionTitle>Role &amp; Reporting</SectionTitle>
                <Box>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={userForm.role_id}
                    onChange={(e) => handleFormChange("role_id", e.target.value)}
                    IconComponent={KeyboardArrowDownRoundedIcon}
                    sx={controlSx}
                  >
                    <MenuItem value={ROLE_SUPER_ADMIN} sx={{ fontSize: "0.8rem" }}>Super Admin</MenuItem>
                    <MenuItem value={ROLE_MANAGER} sx={{ fontSize: "0.8rem" }}>Manager</MenuItem>
                    <MenuItem value={ROLE_SALES} sx={{ fontSize: "0.8rem" }}>Sales Representative</MenuItem>
                  </Select>
                </Box>

                {Number(userForm.role_id) === ROLE_SALES && (
                  <Box>
                    <FieldLabel>Assign Manager *</FieldLabel>
                    <Select
                      fullWidth
                      displayEmpty
                      size="small"
                      value={userForm.manager_id}
                      onChange={(e) => handleFormChange("manager_id", e.target.value)}
                      IconComponent={KeyboardArrowDownRoundedIcon}
                      error={Boolean(formErrors.manager_id)}
                      sx={controlSx}
                      renderValue={(val) =>
                        val === "" ? (
                          <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.8rem" }}>Select a manager...</Box>
                        ) : (
                          managersList.find((m) => String(m.id) === String(val))?.full_name || ""
                        )
                      }
                    >
                      {managersList.map((mgr) => (
                        <MenuItem key={mgr.id} value={mgr.id} sx={{ fontSize: "0.8rem" }}>
                          {mgr.full_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.manager_id && (
                      <Typography sx={{ color: COLORS.danger, fontSize: "0.7rem", mt: 0.5 }}>
                        {formErrors.manager_id}
                      </Typography>
                    )}
                  </Box>
                )}

                {drawerMode === "add" && (
                  <>
                    <SectionTitle>Account Security</SectionTitle>
                    <Box>
                      <FieldLabel>Password</FieldLabel>
                      <TextField
                        fullWidth
                        size="small"
                        type="password"
                        placeholder="Strong password"
                        value={userForm.password}
                        onChange={(e) => handleFormChange("password", e.target.value)}
                        error={Boolean(formErrors.password)}
                        helperText={formErrors.password || ""}
                        sx={controlSx}
                      />
                    </Box>
                    <Box>
                      <FieldLabel>Confirm Password</FieldLabel>
                      <TextField
                        fullWidth
                        size="small"
                        type="password"
                        placeholder="Re-enter password"
                        value={userForm.confirm_password}
                        onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                        error={Boolean(formErrors.confirm_password)}
                        helperText={formErrors.confirm_password || ""}
                        sx={controlSx}
                      />
                    </Box>
                  </>
                )}
              </Box>
            )}

            {!drawerLoading && (
              <Box
                sx={{
                  px: 2.5,
                  py: 2,
                  borderTop: `1px solid ${COLORS.border}`,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1.25,
                  backgroundColor: COLORS.card,
                }}
              >
                <Button variant="outlined" onClick={() => setDrawerMode(null)} sx={outlinedButtonSx}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveUser}
                  disabled={formSubmitting}
                  startIcon={formSubmitting ? <CircularProgress size={14} color="inherit" /> : null}
                  sx={primaryButtonSx}
                >
                  {drawerMode === "add" ? "Create User" : "Save Changes"}
                </Button>
              </Box>
            )}
          </Box>
        </SlideTransition>
      </Drawer>

      {/* ================= VIEW DETAILS DRAWER ================= */}
      <Drawer
        anchor="right"
        open={drawerMode === "view"}
        onClose={() => setDrawerMode(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 480 },
            p: 0,
          },
        }}
      >
        <SlideTransition in={drawerMode === "view"} mountOnEnter unmountOnExit>
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2.5,
                py: 2,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.textPrimary }}>
                User Details
              </Typography>
              <IconButton size="small" onClick={() => setDrawerMode(null)} sx={iconSquareBtnSx}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {drawerLoading ? (
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Skeleton variant="circular" width={64} height={64} sx={{ mx: "auto", mb: 1 }} />
                  <Skeleton width={140} height={20} sx={{ mx: "auto", mb: 0.5 }} />
                  <Skeleton width={90} height={12} sx={{ mx: "auto" }} />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {Array.from(new Array(6)).map((_, idx) => (
                    <Skeleton key={idx} variant="rounded" height={52} sx={{ borderRadius: "8px" }} />
                  ))}
                </Box>
              </Box>
            ) : viewDetails ? (
              <Box sx={{ p: 2.5, flex: 1, overflowY: "auto" }}>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Avatar
                    src={getAvatarUrl(viewDetails.profile_image)}
                    sx={{
                      width: 64,
                      height: 64,
                      mx: "auto",
                      mb: 1,
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      backgroundColor: COLORS.primaryDark,
                      color: "#FFFFFF",
                    }}
                  >
                    {getInitials(viewDetails.full_name)}
                  </Avatar>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary }}>
                    {viewDetails.full_name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>
                    @{viewDetails.username}
                  </Typography>
                  {viewDetails.role_name && (
                    <Chip
                      label={viewDetails.role_name}
                      size="small"
                      sx={{
                        mt: 0.8,
                        backgroundColor: getRoleChipConfig(viewDetails.role_id, viewDetails.role_name).bg,
                        color: getRoleChipConfig(viewDetails.role_id, viewDetails.role_name).color,
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        height: 22,
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                  {[
                    { icon: <MailOutlineRoundedIcon sx={{ fontSize: "0.9rem" }} />, label: "Email", value: viewDetails.email },
                    { icon: <CallOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Phone", value: viewDetails.phone || "N/A" },
                    { icon: <BadgeIcon sx={{ fontSize: "0.9rem" }} />, label: "Username", value: viewDetails.username },
                    { icon: <ShieldOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Role", value: viewDetails.role_name || "N/A" },
                    { icon: <GroupsOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Manager", value: viewDetails.manager_name || "None assigned" },
                    { icon: <EventOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Created", value: formatDateTime(viewDetails.created_at) },
                    { icon: <LoginOutlinedIcon sx={{ fontSize: "0.9rem" }} />, label: "Last Login", value: formatDateTime(viewDetails.last_login) },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        p: 1.2,
                        borderRadius: "8px",
                        backgroundColor: "#F8FAFC",
                        border: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32, borderRadius: "6px", bgcolor: COLORS.primarySoft, color: COLORS.primary }}>
                        {item.icon}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: COLORS.textPrimary, wordBreak: "break-word" }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ mt: 2.5 }}>
                  <Tooltip
                    title={
                      currentUserId !== null &&
                      currentUserId !== undefined &&
                      String(viewDetails.id) === String(currentUserId)
                        ? SELF_ACTION_TOOLTIP
                        : ""
                    }
                  >
                    <span>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                        disabled={
                          currentUserId !== null &&
                          currentUserId !== undefined &&
                          String(viewDetails.id) === String(currentUserId)
                        }
                        onClick={() => {
                          setDrawerMode(null);
                          setTimeout(() => handleOpenEditDrawer(viewDetails), 200);
                        }}
                        sx={primaryButtonSx}
                      >
                        Edit This User
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ) : null}
          </Box>
        </SlideTransition>
      </Drawer>

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            p: 1,
            maxWidth: 380,
            width: "100%",
          },
        }}
      >
        <Box sx={{ p: 1.5, textAlign: "center" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "12px",
              backgroundColor: COLORS.dangerSoft,
              color: COLORS.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1.5,
            }}
          >
            <WarningAmberOutlinedIcon sx={{ fontSize: "1.8rem" }} />
          </Box>
          <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary, p: 0, mb: 0.5 }}>
            Delete User?
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <DialogContentText sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
              Are you sure you want to soft-delete{" "}
              <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                {userToDelete?.full_name}
              </Box>
              ? This user will lose access immediately.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 0, mt: 2, gap: 1, justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={deleting}
              sx={outlinedButtonSx}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{
                ...primaryButtonSx,
                backgroundColor: COLORS.danger,
                "&:hover": {
                  backgroundColor: "#B91C1C",
                },
              }}
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ================= TOAST / SNACKBAR ================= */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            fontWeight: 600,
            fontSize: "0.8rem",
            borderRadius: "8px",
          }}
          iconMapping={{
            success: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            error: <ErrorOutlineOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            warning: <WarningAmberOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            info: <InfoOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;