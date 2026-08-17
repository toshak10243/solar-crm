import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSalesDashboardStats } from "../../services/dashboardService";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
  Button,
  Stack,
} from "@mui/material";

import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import HistoryIcon from "@mui/icons-material/History";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import NewReleasesOutlinedIcon from "@mui/icons-material/NewReleasesOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";

const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
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
  purple: "#9333EA",
  purpleSoft: "#F3E8FF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const STATUS_COLOR_MAP = {
  "New Lead": COLORS.info,
  "Contacted": "#0EA5E9",
  "Follow-up Pending": COLORS.warning,
  "Site Visit Scheduled": COLORS.purple,
  "Quotation Sent": "#7C3AED",
  "Negotiation": "#C026D3",
  "Won": COLORS.success,
  "Lost": COLORS.danger,
  "Not Interested": COLORS.textMuted,
};

// Maps each activity-log action_type to an icon + color for visual scanning
const ACTION_STYLE_MAP = {
  "Lead Created": { icon: AddCircleOutlineOutlinedIcon, color: COLORS.info, soft: COLORS.infoSoft },
  "Lead Assigned": { icon: PersonAddAltOutlinedIcon, color: COLORS.primary, soft: "#E6F0FA" },
  "Lead Reassigned": { icon: SwapHorizOutlinedIcon, color: COLORS.primary, soft: "#E6F0FA" },
  "Status Changed": { icon: SyncAltOutlinedIcon, color: COLORS.purple, soft: COLORS.purpleSoft },
  "Follow-up Added": { icon: EventAvailableOutlinedIcon, color: COLORS.info, soft: COLORS.infoSoft },
  "Quotation Sent": { icon: ReceiptLongOutlinedIcon, color: COLORS.success, soft: COLORS.successSoft },
  "Site Visit Scheduled": { icon: PlaceOutlinedIcon, color: COLORS.warning, soft: COLORS.warningSoft },
  "Lead Closed": { icon: FlagOutlinedIcon, color: COLORS.success, soft: COLORS.successSoft },
  "Lead Updated": { icon: SyncAltOutlinedIcon, color: COLORS.textSecondary, soft: "#F1F5F9" },
};

const getActionStyle = (actionType) =>
  ACTION_STYLE_MAP[actionType] || { icon: HistoryIcon, color: COLORS.textSecondary, soft: "#F1F5F9" };

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

const formatFollowupDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const StatCard = ({ label, value, caption, icon, color, softColor, loading, extraChip }) => (
  <Card
    elevation={0}
    sx={{
      flex: "1 1 200px",
      minWidth: 200,
      borderRadius: "14px",
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      "&:hover": { boxShadow: "0 8px 20px rgba(15,23,42,0.06)", transform: "translateY(-2px)" },
    }}
  >
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.3 }}>
        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.04em" }}>
          {label}
        </Typography>
        <Avatar sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: softColor, color }}>{icon}</Avatar>
      </Box>
      {loading ? (
        <Skeleton width={50} height={32} />
      ) : (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.5rem" }}>
            {value}
          </Typography>
          {extraChip}
        </Box>
      )}
      <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.4, display: "block", fontWeight: 600, fontSize: "0.7rem" }}>
        {loading ? <Skeleton width={90} height={12} /> : caption}
      </Typography>
    </CardContent>
  </Card>
);

const SectionHeader = ({ icon, title, chipLabel, chipColor = "default" }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
    <Stack direction="row" alignItems="center" gap={1.2}>
      <Box sx={{ width: 4, height: 20, borderRadius: "4px", backgroundColor: COLORS.primary }} />
      {icon}
      <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1rem" }}>{title}</Typography>
    </Stack>
    {chipLabel && (
      <Chip label={chipLabel} size="small" color={chipColor} variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }} />
    )}
  </Box>
);

const SalesDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await getSalesDashboardStats();
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
    total_assigned = 0,
    new_leads = 0,
    today_followups = 0,
    pending_followups = 0,
    converted = 0,
    lost = 0,
    upcoming_site_visits = 0,
    activityTimeline = [],
    statusBreakdown = [],
    followupsList = [],
  } = stats || {};

  const conversionRate = total_assigned > 0 ? ((converted / total_assigned) * 100).toFixed(1) : "0.0";

  const openCount = statusBreakdown
    .filter((s) => !["Won", "Lost", "Not Interested", "New Lead"].includes(s.status))
    .reduce((acc, s) => acc + s.count, 0);
  const donutData = [
    { name: "New", value: new_leads, color: COLORS.info },
    { name: "In Progress", value: openCount, color: COLORS.warning },
    { name: "Won", value: converted, color: COLORS.success },
    { name: "Lost", value: lost, color: COLORS.danger },
  ].filter((d) => d.value > 0);

  const fullName = user?.full_name || user?.name || "Sales Executive";

  const buildTelLink = (phone) => `tel:${phone}`;
  const buildWhatsAppLink = (phone) => {
    const digits = (phone || "").replace(/\D/g, "");
    const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${withCountryCode}`;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>
      {/* HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5, mb: 2.5, borderRadius: "16px",
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
          display: "flex", flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
          <Avatar sx={{ width: 46, height: 46, borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>
            <SolarPowerOutlinedIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1.15rem" }}>Sales Executive Portal</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", mt: 0.2 }}>
              Welcome back, <strong style={{ color: "#FFFFFF" }}>{fullName}</strong> — track your leads & daily follow-ups
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Refresh dashboard">
          <span>
            <IconButton
              onClick={() => fetchDashboard(true)}
              disabled={refreshing || loading}
              sx={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "10px", width: 40, height: 40 }}
            >
              <RefreshRoundedIcon
                sx={{
                  fontSize: 20, color: "#FFFFFF",
                  animation: refreshing ? "spin 0.9s linear infinite" : "none",
                  "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                }}
              />
            </IconButton>
          </span>
        </Tooltip>
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
        <StatCard label="MY ASSIGNED LEADS" value={total_assigned} caption="Total active solar inquiries" icon={<PhoneInTalkIcon sx={{ fontSize: 18 }} />} color={COLORS.info} softColor={COLORS.infoSoft} loading={loading} />
        <StatCard label="NEW LEADS" value={new_leads} caption="Not yet contacted" icon={<NewReleasesOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.primary} softColor="#E6F0FA" loading={loading} />
        <StatCard label="TODAY'S FOLLOW-UPS" value={today_followups} caption="Due today" icon={<PendingActionsIcon sx={{ fontSize: 18 }} />} color={COLORS.warning} softColor={COLORS.warningSoft} loading={loading} />
        <StatCard
          label="PENDING FOLLOW-UPS" value={pending_followups} caption="Overdue — date passed"
          icon={<WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.danger} softColor={COLORS.dangerSoft} loading={loading}
          extraChip={pending_followups > 0 && !loading ? <Chip label="Action needed" size="small" sx={{ backgroundColor: COLORS.dangerSoft, color: COLORS.danger, fontWeight: 800, height: 18, fontSize: "0.62rem" }} /> : null}
        />
        <StatCard label="CONVERTED (WON)" value={converted} caption="Deals closed successfully" icon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />} color={COLORS.success} softColor={COLORS.successSoft} loading={loading} />
        <StatCard label="LOST" value={lost} caption="Deals not converted" icon={<HighlightOffOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.textSecondary} softColor="#F1F5F9" loading={loading} />
        <StatCard label="UPCOMING SITE VISITS" value={upcoming_site_visits} caption="Scheduled from today onward" icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.purple} softColor={COLORS.purpleSoft} loading={loading} />
        <StatCard label="MY CONVERSION RATE" value={`${conversionRate}%`} caption={`${converted} won out of ${total_assigned}`} icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} color={COLORS.purple} softColor={COLORS.purpleSoft} loading={loading} />
      </Box>

      {/* CHARTS ROW */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexDirection: { xs: "column", lg: "row" } }}>
        <Paper elevation={0} sx={{ flex: 1.4, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <SectionHeader icon={<BarChartIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="My Pipeline by Stage" chipLabel={`${total_assigned} leads`} chipColor="primary" />
          <Box sx={{ height: 260, width: "100%" }}>
            {loading ? (
              <Skeleton variant="rounded" height="100%" />
            ) : statusBreakdown.length === 0 ? (
              <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No leads assigned yet</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: COLORS.textSecondary }} />
                  <YAxis type="category" dataKey="status" width={130} tick={{ fontSize: 10.5, fill: COLORS.textSecondary, fontWeight: 600 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={STATUS_COLOR_MAP[entry.status] || COLORS.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <SectionHeader icon={<PieChartOutlinedIcon sx={{ color: COLORS.purple, fontSize: 20 }} />} title="Quick Overview" />
          <Box sx={{ height: 220, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loading ? (
              <Skeleton variant="circular" width={150} height={150} />
            ) : donutData.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No data yet</Typography>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={3}>
                    {donutData.map((entry, index) => <Cell key={`pie-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                  <Legend formatter={(value) => <span style={{ fontSize: "11px", fontWeight: 600, color: COLORS.textPrimary }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>
      </Box>

      {/* DUE FOLLOW-UPS */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
        <SectionHeader
          icon={<EventBusyOutlinedIcon sx={{ color: COLORS.warning, fontSize: 20 }} />}
          title="Follow-ups Due Today & Overdue"
          chipLabel={`${followupsList.length} to act on`}
          chipColor="warning"
        />
        {loading ? (
          <Stack gap={1}>{Array.from(new Array(3)).map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: "10px" }} />)}</Stack>
        ) : followupsList.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Avatar sx={{ width: 48, height: 48, borderRadius: "12px", backgroundColor: COLORS.successSoft, color: COLORS.success, mx: "auto", mb: 1.5 }}>
              <CheckCircleOutlineIcon />
            </Avatar>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
              You're all caught up — no due follow-ups right now.
            </Typography>
          </Box>
        ) : (
          <Stack gap={1}>
            {followupsList.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 1.5, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Typography sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.8rem" }}>{item.lead_code}</Typography>
                    <Chip
                      label={item.is_overdue ? `Overdue · ${formatFollowupDate(item.next_follow_up_date)}` : "Due today"}
                      size="small"
                      sx={{ backgroundColor: item.is_overdue ? COLORS.dangerSoft : COLORS.warningSoft, color: item.is_overdue ? COLORS.danger : COLORS.warning, fontWeight: 800, height: 20, fontSize: "0.65rem" }}
                    />
                  </Stack>
                  <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.85rem", mt: 0.3 }}>{item.customer_name}</Typography>
                </Box>
                <Stack direction="row" gap={1}>
                  <Tooltip title="Call now">
                    <IconButton size="small" href={buildTelLink(item.phone)} sx={{ backgroundColor: COLORS.infoSoft, color: COLORS.info, "&:hover": { backgroundColor: COLORS.info, color: "#fff" } }}>
                      <PhoneInTalkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="WhatsApp">
                    <IconButton size="small" href={buildWhatsAppLink(item.phone)} target="_blank" rel="noopener noreferrer" sx={{ backgroundColor: COLORS.successSoft, color: COLORS.success, "&:hover": { backgroundColor: COLORS.success, color: "#fff" } }}>
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* ACTIVITY TIMELINE — now with icon per action-type, limited to last 10 */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
        <SectionHeader icon={<HistoryIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="My Recent Activity" chipLabel="Last 10 actions" chipColor="primary" />
        {loading ? (
          <Stack gap={1.5}>{Array.from(new Array(3)).map((_, i) => <Skeleton key={i} variant="rounded" height={68} sx={{ borderRadius: "12px" }} />)}</Stack>
        ) : activityTimeline.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No activity yet. Once you update a lead, it'll show up here.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
            {activityTimeline.map((log) => {
              const { icon: ActionIcon, color, soft } = getActionStyle(log.action_type);
              return (
                <Box
                  key={log.id}
                  sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, display: "flex", gap: 1.4 }}
                >
                  <Avatar sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: soft, color, flexShrink: 0 }}>
                    <ActionIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.8rem", color }}>{log.action_type}</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap", ml: 1 }}>
                        {formatRelativeTime(log.created_at)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary, mb: 0.2 }}>
                      {log.customer_name} ({log.lead_code})
                    </Typography>
                    {log.remark && <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontStyle: "italic", display: "block" }}>"{log.remark}"</Typography>}
                    {!log.remark && log.old_value && log.new_value && (
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>{log.old_value} → {log.new_value}</Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SalesDashboard;