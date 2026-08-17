import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAdminDashboardStats } from "../../services/dashboardService";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  IconButton,
  Tooltip,
  Stack,
  Grow,
  Fade,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import HistoryIcon from "@mui/icons-material/History";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";

// ======================================================
// SBI BRAND THEME
// ======================================================
const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
  primarySoft: "#E0F7FF",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const STATUS_STYLES = {
  "New Lead": { bg: "#E0F2FE", color: "#0284C7" },
  Contacted: { bg: "#E0F7FF", color: "#00B5EF" },
  "Follow-up Pending": { bg: "#FEF3C7", color: "#D97706" },
  "Site Visit Scheduled": { bg: "#EDE9FE", color: "#7C3AED" },
  "Quotation Sent": { bg: "#F3E8FF", color: "#9333EA" },
  Negotiation: { bg: "#FCE7F3", color: "#C026D3" },
  Won: { bg: "#DCFCE7", color: "#16A34A" },
  Lost: { bg: "#FEE2E2", color: "#DC2626" },
  "Not Interested": { bg: "#F1F5F9", color: "#64748B" },
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

// ======================================================
// HELPERS
// ======================================================
const formatCompactINR = (value) => {
  const n = Number(value) || 0;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const formatCapacity = (kw) => {
  const n = Number(kw) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} MW`;
  return `${n.toFixed(1)} kW`;
};

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
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

const GradientAvatar = ({ name, size = 30 }) => {
  const hue = hashHue(name || "?");
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 700,
        background: `linear-gradient(135deg, hsl(${hue},58%,50%), hsl(${hue + 30},60%,42%))`,
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
};

// ======================================================
// SMALL REUSABLE PIECES
// ======================================================
const StatCard = ({ label, value, caption, icon, color, softColor, loading, index = 0 }) => (
  <Grow in timeout={300 + index * 120}>
    <Card
      elevation={0}
      sx={{
        flex: "1 1 200px",
        minWidth: 200,
        borderRadius: "14px",
        border: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.card,
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": { boxShadow: "0 10px 24px rgba(15,23,42,0.07)", transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.3 }}>
          <Typography sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.04em" }}>
            {label}
          </Typography>
          <Avatar sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: softColor, color }}>{icon}</Avatar>
        </Box>
        {loading ? (
          <Skeleton width={70} height={32} />
        ) : (
          <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.4rem" }}>{value}</Typography>
        )}
        <Typography sx={{ color: COLORS.textSecondary, mt: 0.4, display: "block", fontWeight: 600, fontSize: "0.7rem" }}>
          {loading ? <Skeleton width={100} height={12} /> : caption}
        </Typography>
      </CardContent>
    </Card>
  </Grow>
);

const SectionHeader = ({ icon, title, chipLabel, chipColor = "default" }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
    <Stack direction="row" alignItems="center" gap={1.2}>
      <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.primary }} />
      {icon}
      <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>{title}</Typography>
    </Stack>
    {chipLabel && (
      <Chip label={chipLabel} size="small" color={chipColor} variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }} />
    )}
  </Box>
);

// ======================================================
// MAIN COMPONENT
// ======================================================
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await getAdminDashboardStats();
      if (res?.success) setStats(res.data);
      else setError(res?.message || "Failed to load dashboard.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const {
    total_leads = 0,
    won_leads = 0,
    lost_leads = 0,
    active_leads = 0,
    total_managers = 0,
    total_sales = 0,
    total_revenue = 0,
    total_installed_kw = 0,
    statusBreakdown = [],
    sourcePerformance = [],
    monthlyTrend = [],
    recentLeads = [],
    activityFeed = [],
  } = stats || {};

  const conversionRate = total_leads > 0 ? ((won_leads / total_leads) * 100).toFixed(1) : "0.0";
  const totalMembers = total_managers + total_sales;
  const maxSourceTotal = Math.max(1, ...sourcePerformance.map((s) => s.total));

  const statCards = [
    {
      label: "TOTAL SOLAR CAPACITY WON",
      value: formatCapacity(total_installed_kw),
      caption: `Across ${won_leads} closed deal${won_leads === 1 ? "" : "s"}`,
      icon: <WbSunnyIcon sx={{ fontSize: 18 }} />,
      color: COLORS.info,
      softColor: COLORS.infoSoft,
    },
    {
      label: "TOTAL LEADS",
      value: total_leads,
      caption: `${active_leads} active in pipeline`,
      icon: <TrendingUpOutlinedIcon sx={{ fontSize: 18 }} />,
      color: COLORS.success,
      softColor: COLORS.successSoft,
    },
    {
      label: "TOTAL REVENUE WON",
      value: formatCompactINR(total_revenue),
      caption: `${conversionRate}% conversion rate`,
      icon: <AttachMoneyIcon sx={{ fontSize: 18 }} />,
      color: COLORS.warning,
      softColor: COLORS.warningSoft,
    },
    {
      label: "TOTAL ACTIVE USERS",
      value: `${totalMembers} Members`,
      caption: `${total_managers} Managers • ${total_sales} Reps`,
      icon: <PeopleAltIcon sx={{ fontSize: 18 }} />,
      color: COLORS.purple,
      softColor: COLORS.purpleSoft,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>
      {/* HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
          <Avatar sx={{ width: 46, height: 46, borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>
            <ShieldOutlinedIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1.15rem" }}>Admin Control Center</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", mt: 0.2 }}>
              Welcome back, <strong style={{ color: "#FFFFFF" }}>{user?.full_name || user?.name || "Admin"}</strong> — Master CRM Analytics & Operations
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" alignItems="center" gap={1}>
          <Tooltip title="Refresh dashboard">
            <span>
              <IconButton
                onClick={() => fetchDashboard(true)}
                disabled={refreshing || loading}
                sx={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "10px", width: 40, height: 40 }}
              >
                <RefreshRoundedIcon
                  sx={{
                    fontSize: 20,
                    color: "#FFFFFF",
                    animation: refreshing ? "spin 0.9s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              px: 2,
              fontSize: "0.8rem",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              boxShadow: "none",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.25)", boxShadow: "none" },
            }}
          >
            Logout
          </Button>
        </Stack>
      </Paper>

      {error && !loading && (
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.dangerSoft}`, backgroundColor: COLORS.dangerSoft, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <ErrorOutlineOutlinedIcon sx={{ color: COLORS.danger, fontSize: 20 }} />
            <Typography sx={{ color: COLORS.danger, fontWeight: 600, fontSize: "0.8rem" }}>{error}</Typography>
          </Stack>
          <Button variant="contained" size="small" onClick={() => fetchDashboard(true)} sx={{ backgroundColor: COLORS.danger, "&:hover": { backgroundColor: "#B91C1C" }, textTransform: "none", fontWeight: 700 }}>
            Retry
          </Button>
        </Paper>
      )}

      {/* STAT CARDS */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2.5, width: "100%" }}>
        {statCards.map((s, idx) => (
          <StatCard key={s.label} {...s} loading={loading} index={idx} />
        ))}
      </Box>

      <Fade in={!loading} timeout={500}>
        <Box>
          {/* CHARTS ROW */}
          <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexDirection: { xs: "column", lg: "row" } }}>
            <Paper elevation={0} sx={{ flex: 1.4, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<ShowChartIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Leads Created vs. Won — Last 6 Months" />
              <Box sx={{ height: 250, width: "100%" }}>
                {loading ? (
                  <Skeleton variant="rounded" height="100%" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                      <Area type="monotone" dataKey="leads_created" stroke={COLORS.primary} fill={COLORS.primarySoft} name="Leads Created" />
                      <Area type="monotone" dataKey="leads_won" stroke={COLORS.success} fill={COLORS.successSoft} name="Leads Won" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader
                icon={<PieChartOutlinedIcon sx={{ color: COLORS.purple, fontSize: 20 }} />}
                title="Pipeline Stages"
                chipLabel={loading ? "" : `${conversionRate}% Conversion`}
                chipColor="success"
              />
              <Box sx={{ height: 220, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {loading ? (
                  <Skeleton variant="circular" width={160} height={160} />
                ) : statusBreakdown.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No leads yet</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(STATUS_STYLES[entry.status] || {}).color || COLORS.primary} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                      <Legend formatter={(value) => <span style={{ fontSize: "10.5px", fontWeight: 600, color: COLORS.textPrimary }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Box>

          {/* TABLE + SOURCE PERFORMANCE ROW */}
          <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexDirection: { xs: "column", lg: "row" } }}>
            <Paper elevation={0} sx={{ flex: 1.4, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<TrendingUpOutlinedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Recent Leads Across the Organization" />

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                      <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Lead</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Rep</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from(new Array(5)).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton width="80%" /></TableCell>
                          <TableCell><Skeleton width={60} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton variant="rounded" width={90} height={20} /></TableCell>
                          <TableCell align="right"><Skeleton width={60} sx={{ ml: "auto" }} /></TableCell>
                        </TableRow>
                      ))
                    ) : recentLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: COLORS.textSecondary, border: 0 }}>
                          No leads created yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentLeads
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((lead) => {
                          const statusStyle = STATUS_STYLES[lead.status] || { bg: "#F1F5F9", color: COLORS.textSecondary };
                          return (
                            <TableRow key={lead.id} hover>
                              <TableCell>
                                <Typography sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.78rem" }}>{lead.lead_code}</Typography>
                                <Typography sx={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: "0.78rem" }}>{lead.customer_name || "—"}</Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.76rem", color: COLORS.textSecondary }}>{lead.lead_source}</TableCell>
                              <TableCell>
                                {lead.assigned_to_name ? (
                                  <Stack direction="row" alignItems="center" gap={0.8}>
                                    <GradientAvatar name={lead.assigned_to_name} size={26} />
                                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 600, color: COLORS.textPrimary }}>{lead.assigned_to_name}</Typography>
                                  </Stack>
                                ) : (
                                  <Typography sx={{ fontSize: "0.76rem", color: COLORS.textMuted }}>Unassigned</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip label={lead.status} size="small" sx={{ backgroundColor: statusStyle.bg, color: statusStyle.color, fontWeight: 700, fontSize: "0.65rem" }} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.78rem" }}>
                                {lead.quotation_amount ? formatCompactINR(lead.quotation_amount) : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {!loading && recentLeads.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10]}
                  component="div"
                  count={recentLeads.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
              )}
            </Paper>

            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<SourceOutlinedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Lead Source Performance" />

              {loading ? (
                <Stack gap={1.5}>{Array.from(new Array(4)).map((_, i) => <Skeleton key={i} variant="rounded" height={44} sx={{ borderRadius: "8px" }} />)}</Stack>
              ) : sourcePerformance.length === 0 ? (
                <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", textAlign: "center", py: 3 }}>No source data yet.</Typography>
              ) : (
                <Stack gap={1.6}>
                  {sourcePerformance.map((src) => {
                    const rate = src.total > 0 ? ((src.won / src.total) * 100).toFixed(0) : 0;
                    return (
                      <Box key={src.lead_source}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.textPrimary }}>{src.lead_source}</Typography>
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary }}>
                            {src.total} leads · <span style={{ color: COLORS.success }}>{rate}% won</span>
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(src.total / maxSourceTotal) * 100}
                          sx={{ height: 7, borderRadius: 4, backgroundColor: "#E2E8F0", "& .MuiLinearProgress-bar": { borderRadius: 4, backgroundColor: COLORS.primary } }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Box>

          {/* ACTIVITY FEED */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <SectionHeader icon={<HistoryIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Organization-wide Activity" chipLabel="Last 15 actions" chipColor="primary" />

            {loading ? (
              <Stack gap={1.2}>{Array.from(new Array(4)).map((_, i) => <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: "10px" }} />)}</Stack>
            ) : activityFeed.length === 0 ? (
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", textAlign: "center", py: 4 }}>No activity recorded yet.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, maxHeight: 400, overflowY: "auto", pr: 0.5 }}>
                {activityFeed.map((log) => {
                  const { icon: ActionIcon, color, soft } = getActionStyle(log.action_type);
                  return (
                    <Box key={log.id} sx={{ p: 1.4, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, display: "flex", gap: 1.2 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "9px", backgroundColor: soft, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ActionIcon sx={{ fontSize: "1rem" }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color }}>{log.action_type}</Typography>
                          <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>{formatRelativeTime(log.created_at)}</Typography>
                        </Stack>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }}>
                          {log.customer_name} ({log.lead_code})
                        </Typography>
                        {log.remark && <Typography sx={{ fontSize: "0.76rem", color: COLORS.textSecondary, fontStyle: "italic" }}>"{log.remark}"</Typography>}
                        <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, mt: 0.2 }}>By {log.performed_by_name || "System"}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};

export default Dashboard;