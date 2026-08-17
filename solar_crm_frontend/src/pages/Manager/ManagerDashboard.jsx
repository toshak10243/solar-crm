import React, { useState, useEffect, useMemo } from "react";
import { getManagerDashboardStats } from "../../services/dashboardService";
import { assignLead } from "../../services/leadService"; // 🟢 Centralized Lead Assign Service
import { useAuth } from "../../context/AuthContext";

// Recharts Visual Graph Components
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
  Legend,
} from "recharts";

// Material UI Core Components
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";

// Material UI Icons
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutlined";
import BarChartIcon from "@mui/icons-material/BarChart";

const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  info: "#0284C7",
  purple: "#9333EA",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const PIE_COLORS = ["#0284C7", "#D97706", "#005BAC", "#9333EA", "#0B3A63", "#16A34A", "#DC2626"];

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "M";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
};

const ManagerDashboard = () => {
  const { user, token } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [timeRange, setTimeRange] = useState("this_month");
  const [searchQuery, setSearchQuery] = useState("");

  const [teamPage, setTeamPage] = useState(0);
  const [teamRowsPerPage, setTeamRowsPerPage] = useState(5);
  const [followupPage, setFollowupPage] = useState(0);
  const [followupRowsPerPage, setFollowupRowsPerPage] = useState(5);

  const [openReassignModal, setOpenReassignModal] = useState(false);
  const [selectedFollowupLead, setSelectedFollowupLead] = useState(null);
  const [reassignToId, setReassignToId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const fetchDashboardStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getManagerDashboardStats({ range: timeRange });
      if (res && res.success) {
        setDashboardData(res.data || res);
        if (isManualRefresh) showToast("Dashboard metrics refreshed!");
      }
    } catch (err) {
      console.error("Error fetching manager dashboard metrics:", err);
      showToast(err.response?.data?.message || "Error loading live dashboard stats.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
    }
  }, [token, timeRange]);

  const {
    teamPerformance = [],
    statusBreakdown = [],
    pendingToday = 0,
    convertedToday = 0,
    overdueFollowups = 0,
    todaysFollowupsList = [],
    recentActivity = [],
  } = dashboardData || {};

  const totalTeamMembers = teamPerformance.length;

  const totalAssignedLeads = useMemo(() => {
    return teamPerformance.reduce((acc, curr) => acc + (Number(curr.total_assigned) || 0), 0);
  }, [teamPerformance]);

  const totalConvertedDeals = useMemo(() => {
    return teamPerformance.reduce((acc, curr) => acc + (Number(curr.converted) || 0), 0);
  }, [teamPerformance]);

  const totalRevenueGenerated = useMemo(() => {
    return teamPerformance.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
  }, [teamPerformance]);

  const overallConversionRate = useMemo(() => {
    if (totalAssignedLeads === 0) return 0;
    return ((totalConvertedDeals / totalAssignedLeads) * 100).toFixed(1);
  }, [totalAssignedLeads, totalConvertedDeals]);

  const filteredTeamList = useMemo(() => {
    return teamPerformance.filter((m) =>
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamPerformance, searchQuery]);

  const handleExportCSV = () => {
    if (teamPerformance.length === 0) {
      showToast("No performance data available to export.", "warning");
      return;
    }

    const headers = ["Sales Rep", "Total Assigned", "Converted (Won)", "Lost Deals", "In Progress", "Conversion Rate %", "Revenue (INR)"];
    const rows = teamPerformance.map((rep) => [
      `"${rep.full_name}"`,
      rep.total_assigned || 0,
      rep.converted || 0,
      rep.lost || 0,
      rep.in_progress || 0,
      `${rep.total_assigned ? ((rep.converted / rep.total_assigned) * 100).toFixed(1) : 0}%`,
      rep.revenue || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Team_Performance_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Team Performance report exported!");
  };

  const handleOpenReassign = (lead) => {
    setSelectedFollowupLead(lead);
    setReassignToId("");
    setOpenReassignModal(true);
  };

  const handleConfirmReassign = async () => {
    if (!reassignToId) {
      showToast("Please select a sales representative.", "warning");
      return;
    }

    setReassigning(true);
    try {
      await assignLead(selectedFollowupLead.id, { assigned_to: Number(reassignToId) });
      showToast("Lead reassigned successfully!");
      setOpenReassignModal(false);
      fetchDashboardStats(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reassign lead.", "error");
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "85vh", gap: 2 }}>
        <CircularProgress size={38} sx={{ color: COLORS.primary }} thickness={4} />
        <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.85rem" }}>
          Connecting to Database & Generating Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>
      
      {/* 1. TOP HEADER BANNER (SLEEK & COMPACT) */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: "#E6F0FA",
              color: COLORS.primary,
              fontWeight: 800,
            }}
          >
            <SolarPowerOutlinedIcon sx={{ fontSize: 22 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.05rem" }}>
              Manager Analytics Control Center
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.1, fontSize: "0.78rem" }}>
              Welcome back, <strong style={{ color: COLORS.primary }}>{user?.full_name || user?.name || "Akash Jha 2"}</strong> • Visual Team Metrics & Performance Pipeline
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "nowrap", width: { xs: "100%", md: "auto" }, height: 36 }}>
          <FormControl size="small" sx={{ minWidth: 130, height: "100%" }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              startAdornment={<CalendarTodayIcon sx={{ fontSize: 14, mr: 1, color: COLORS.textSecondary }} />}
              sx={{ borderRadius: "6px", backgroundColor: "#F8FAFC", fontSize: "0.8rem", fontWeight: 600, height: "100%" }}
            >
              <MenuItem value="today" sx={{ fontSize: "0.8rem" }}>Today's Summary</MenuItem>
              <MenuItem value="this_week" sx={{ fontSize: "0.8rem" }}>This Week</MenuItem>
              <MenuItem value="this_month" sx={{ fontSize: "0.8rem" }}>This Month</MenuItem>
              <MenuItem value="this_year" sx={{ fontSize: "0.8rem" }}>Year 2026</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportCSV}
            sx={{
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              borderRadius: "6px",
              fontWeight: 700,
              textTransform: "none",
              px: 1.8,
              fontSize: "0.8rem",
              height: "100%",
              whiteSpace: "nowrap",
              "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
            }}
          >
            Export Report
          </Button>

          <Tooltip title="Reload Live DB Metrics">
            <IconButton
              onClick={() => fetchDashboardStats(true)}
              disabled={refreshing}
              size="small"
              sx={{ backgroundColor: "#F1F5F9", border: `1px solid ${COLORS.border}`, borderRadius: "6px", width: 36, height: 36, flexShrink: 0 }}
            >
              <RefreshIcon sx={{ fontSize: 18, color: COLORS.primary }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* 2. TOP OVERVIEW METRIC CARDS (COMPACT TYPOGRAPHY & ZERO EXTRA MARGINS) */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexWrap: { xs: "wrap", md: "nowrap" } }}>
        <Card elevation={0} sx={{ flex: 1, minWidth: "200px", borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <CardContent sx={{ p: 1.8, "&:last-child": { pb: 1.8 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.03em" }}>
                MY TEAM CAPACITY
              </Typography>
              <Avatar sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#E0F2FE", color: COLORS.info }}>
                <GroupsIcon sx={{ fontSize: 18 }} />
              </Avatar>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.35rem", lineHeight: 1.2 }}>
              {totalTeamMembers}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.3, display: "block", fontSize: "0.7rem" }}>
              Active Sales Representatives assigned
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ flex: 1, minWidth: "200px", borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <CardContent sx={{ p: 1.8, "&:last-child": { pb: 1.8 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.03em" }}>
                TODAY'S FOLLOW-UPS
              </Typography>
              <Avatar sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#FEF3C7", color: COLORS.warning }}>
                <PendingActionsIcon sx={{ fontSize: 18 }} />
              </Avatar>
            </Box>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.35rem", lineHeight: 1.2 }}>
                {pendingToday}
              </Typography>
              {overdueFollowups > 0 && (
                <Chip
                  label={`${overdueFollowups} Overdue`}
                  size="small"
                  sx={{ backgroundColor: "#FEE2E2", color: COLORS.danger, fontWeight: 800, height: 18, fontSize: "0.65rem" }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.3, display: "block", fontSize: "0.7rem" }}>
              Calls & site visits scheduled for today
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ flex: 1, minWidth: "200px", borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <CardContent sx={{ p: 1.8, "&:last-child": { pb: 1.8 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.03em" }}>
                CLOSED DEALS TODAY
              </Typography>
              <Avatar sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#DCFCE7", color: COLORS.success }}>
                <AssignmentTurnedInIcon sx={{ fontSize: 18 }} />
              </Avatar>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.success, fontSize: "1.35rem", lineHeight: 1.2 }}>
              {convertedToday}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.3, display: "block", fontSize: "0.7rem" }}>
              Solar projects converted to Won status
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ flex: 1, minWidth: "200px", borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <CardContent sx={{ p: 1.8, "&:last-child": { pb: 1.8 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.03em" }}>
                TEAM REVENUE WON
              </Typography>
              <Avatar sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#F3E8FF", color: COLORS.purple }}>
                <TrendingUpIcon sx={{ fontSize: 18 }} />
              </Avatar>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.35rem", lineHeight: 1.2 }}>
              {formatCurrency(totalRevenueGenerated)}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.3, display: "block", fontSize: "0.7rem" }}>
              Avg Conversion: <strong>{overallConversionRate}%</strong>
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 📊 3. VISUAL CHARTS ROW (FULL FLEX - NO RIGHT BLANK GAP) */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexDirection: { xs: "column", lg: "row" } }}>
        {/* Bar Chart */}
        <Paper elevation={0} sx={{ flex: 1.4, p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <BarChartIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.92rem" }}>
                Pipeline Stage Distribution
              </Typography>
            </Box>
            <Chip label={`${totalAssignedLeads} Active Leads`} size="small" sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem", backgroundColor: "#F1F5F9" }} />
          </Box>

          <Box sx={{ height: 240, width: "100%", mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: `1px solid ${COLORS.border}`, fontSize: "0.75rem" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Donut Chart */}
        <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <PieChartOutlineIcon sx={{ color: COLORS.purple, fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.92rem" }}>
                Team Deal Conversions
              </Typography>
            </Box>
            <Chip label="Rep Comparison" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
          </Box>

          <Box sx={{ height: 240, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {teamPerformance.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.8rem" }}>No team data to display</Typography>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={teamPerformance}
                    dataKey="converted"
                    nameKey="full_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {teamPerformance.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: "8px", border: `1px solid ${COLORS.border}`, fontSize: "0.75rem" }} formatter={(val, name, props) => [`${val} Won Deals`, props.payload.full_name]} />
                  <Legend formatter={(value) => <span style={{ fontSize: "11px", fontWeight: 600, color: COLORS.textPrimary }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>
      </Box>

      {/* 4. TEAM PERFORMANCE TABLE & AUDIT FEED (100% BALANCED FLEX CONTAINER) */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexDirection: { xs: "column", lg: "row" } }}>
        {/* Team Table Column */}
        <Paper elevation={0} sx={{ flex: 1.4, p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5, mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Team Performance & Conversion Tracker
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem" }}>
                Monitor sales representative productivity and revenue generation.
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search sales rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: "100%", sm: 180 }, "& .MuiOutlinedInput-root": { borderRadius: "6px", backgroundColor: "#F8FAFC", fontSize: "0.8rem" } }}
            />
          </Box>

          <TableContainer sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                  <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Sales Representative</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Assigned</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>In Progress</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Won</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Conversion</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeamList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: COLORS.textSecondary, fontSize: "0.8rem" }}>
                      No matching sales executive records in DB.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeamList
                    .slice(teamPage * teamRowsPerPage, teamPage * teamRowsPerPage + teamRowsPerPage)
                    .map((rep) => {
                      const convRate = rep.total_assigned ? ((rep.converted / rep.total_assigned) * 100).toFixed(1) : 0;

                      return (
                        <TableRow key={rep.id} hover>
                          <TableCell sx={{ fontSize: "0.78rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: "0.7rem", bgcolor: COLORS.primaryDark, fontWeight: 700 }}>
                                {getInitials(rep.full_name)}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.78rem" }}>
                                {rep.full_name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>{rep.total_assigned || 0}</TableCell>
                          <TableCell sx={{ color: COLORS.info, fontWeight: 600, fontSize: "0.78rem" }}>{rep.in_progress || 0}</TableCell>
                          <TableCell sx={{ color: COLORS.success, fontWeight: 700, fontSize: "0.78rem" }}>{rep.converted || 0}</TableCell>
                          <TableCell sx={{ fontSize: "0.78rem" }}>
                            <Chip
                              label={`${convRate}%`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.68rem",
                                height: 20,
                                backgroundColor: Number(convRate) >= 25 ? "#DCFCE7" : "#FEF3C7",
                                color: Number(convRate) >= 25 ? COLORS.success : COLORS.warning,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.78rem" }}>
                            {formatCurrency(rep.revenue)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10]}
            component="div"
            count={filteredTeamList.length}
            rowsPerPage={teamRowsPerPage}
            page={teamPage}
            onPageChange={(e, newPage) => setTeamPage(newPage)}
            onRowsPerPageChange={(e) => {
              setTeamRowsPerPage(parseInt(e.target.value, 10));
              setTeamPage(0);
            }}
          />
        </Paper>

        {/* Audit Log Feed Column */}
        <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <HistoryIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.92rem" }}>
                Team Audit Feed
              </Typography>
            </Box>
            <Chip label="Real-time" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, height: 18, fontSize: "0.6rem" }} />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, maxHeight: 260, overflowY: "auto", pr: 0.5 }}>
            {recentActivity.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: "center", py: 3, fontSize: "0.8rem" }}>
                No recent audit activity logged.
              </Typography>
            ) : (
              recentActivity.map((log) => {
                const logTime = log.time || log.created_at;

                return (
                  <Box
                    key={log.id}
                    sx={{
                      p: 1.2,
                      borderRadius: "8px",
                      backgroundColor: "#F8FAFC",
                      border: `1px solid ${COLORS.border}`,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                    }}
                  >
                    <Avatar sx={{ width: 26, height: 26, fontSize: "0.68rem", bgcolor: COLORS.primaryDark, fontWeight: 700 }}>
                      {getInitials(log.by || log.performed_by_name || log.user_name)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textPrimary }}>
                          {log.action || log.action_type || "Activity"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.65rem" }}>
                          {logTime ? new Date(logTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 600, fontSize: "0.72rem", mt: 0.1 }}>
                        {log.lead || log.customer_name || "Lead Record"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", fontSize: "0.65rem" }}>
                        Logged by: <strong>{log.by || log.performed_by_name || "Sales Rep"}</strong>
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>
      </Box>

      {/* 5. TODAY'S ACTIONABLE FOLLOW-UPS TABLE (100% CONTAINER SPAN) */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, width: "100%", boxSizing: "border-box" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
              Today's Team Follow-up Action List
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem" }}>
              Monitor calls and site visits scheduled by your sales representatives for today.
            </Typography>
          </Box>
          <Chip
            label={`${todaysFollowupsList.length} Scheduled`}
            color="warning"
            size="small"
            sx={{ fontWeight: 800, borderRadius: "6px" }}
          />
        </Box>

        <TableContainer sx={{ width: "100%" }}>
          <Table sx={{ width: "100%" }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Lead Code</TableCell>
                <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Contact Phone</TableCell>
                <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Assigned Sales Rep</TableCell>
                <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Follow-up Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.78rem" }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todaysFollowupsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: COLORS.textSecondary, fontSize: "0.8rem" }}>
                    No follow-ups scheduled in DB for today.
                  </TableCell>
                </TableRow>
              ) : (
                todaysFollowupsList
                  .slice(followupPage * followupRowsPerPage, followupPage * followupRowsPerPage + followupRowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.78rem" }}>
                        {item.lead_code || `#LD-${item.id}`}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.78rem" }}>
                        {item.customer_name}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                          <PhoneInTalkIcon sx={{ fontSize: 14, color: COLORS.primary }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>
                            {item.phone || item.mobile_number || "N/A"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem" }}>
                        <Chip
                          label={item.rep_name || item.assigned_to_name || "Unassigned"}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: "0.68rem", height: 20 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem" }}>
                        <Chip
                          label={item.is_overdue ? "Overdue" : "Scheduled Today"}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.68rem",
                            height: 20,
                            backgroundColor: item.is_overdue ? "#FEE2E2" : "#FEF3C7",
                            color: item.is_overdue ? COLORS.danger : COLORS.warning,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Quick Reassign to another sales rep">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenReassign(item)}
                            sx={{ color: COLORS.primary, backgroundColor: "#F1F5F9" }}
                          >
                            <PersonAddOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10]}
          component="div"
          count={todaysFollowupsList.length}
          rowsPerPage={followupRowsPerPage}
          page={followupPage}
          onPageChange={(e, newPage) => setFollowupPage(newPage)}
          onRowsPerPageChange={(e) => {
            setFollowupRowsPerPage(parseInt(e.target.value, 10));
            setFollowupPage(0);
          }}
        />
      </Paper>

      {/* 6. QUICK REASSIGN DIALOG MODAL */}
      <Dialog
        open={openReassignModal}
        onClose={() => setOpenReassignModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "12px", p: 0.5 } } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.98rem" }}>
          Reassign Lead
          <IconButton size="small" onClick={() => setOpenReassignModal(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2, fontSize: "0.8rem" }}>
            Reassigning follow-up lead <strong>{selectedFollowupLead?.customer_name} ({selectedFollowupLead?.lead_code || `#LD-${selectedFollowupLead?.id}`})</strong> to another sales executive in your team.
          </Typography>

          <FormControl fullWidth size="small">
            <Select
              value={reassignToId}
              displayEmpty
              onChange={(e) => setReassignToId(e.target.value)}
              sx={{ borderRadius: "6px", fontSize: "0.8rem" }}
            >
              <MenuItem value="" disabled sx={{ fontSize: "0.8rem" }}>Select Team Executive</MenuItem>
              {teamPerformance.map((member) => (
                <MenuItem key={member.id} value={member.id} sx={{ fontSize: "0.8rem" }}>
                  {member.full_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 1.5 }}>
          <Button onClick={() => setOpenReassignModal(false)} sx={{ color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.8rem" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmReassign}
            disabled={reassigning}
            sx={{ backgroundColor: COLORS.primary, fontWeight: 700, borderRadius: "6px", textTransform: "none", fontSize: "0.8rem" }}
          >
            {reassigning ? "Assigning..." : "Confirm Reassign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST SNACKBAR */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ borderRadius: "8px", fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManagerDashboard;