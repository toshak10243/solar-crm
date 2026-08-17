import React, { useState, useEffect, useMemo } from "react";
import { getUsers } from "../../services/userServices";
import { getLeads } from "../../services/leadService";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Card,
  CardContent,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  Stack,
  TablePagination,
  Divider,
} from "@mui/material";

import AssessmentIcon from "@mui/icons-material/Assessment";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

import logo from "../../assets/images/logo.png";

// ═══════════════════════════════════════════════════════════
// API BASE — Profile page jaisi hi URL resolution ke liye
// ═══════════════════════════════════════════════════════════
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

const C = {
  primary: "#00B5EF",
  primaryDark: "#292075",
  primarySoft: "#E0F7FF",
  bg: "#F4F6FA",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
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

const PERIOD_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
];

const getPeriodRange = (p) => {
  const n = new Date();
  if (p === "this_month") return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: n };
  if (p === "last_month") return { start: new Date(n.getFullYear(), n.getMonth() - 1, 1), end: new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59) };
  if (p === "this_quarter") { const q = Math.floor(n.getMonth() / 3); return { start: new Date(n.getFullYear(), q * 3, 1), end: n }; }
  if (p === "this_year") return { start: new Date(n.getFullYear(), 0, 1), end: n };
  return null;
};

const formatINR = (v) => {
  const n = Number(v) || 0;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const hashHue = (s = "") => { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return Math.abs(h) % 360; };

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0].charAt(0).toUpperCase() : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
};

// ═══════════════════════════════════════════════════════════
// PROFILE PHOTO — Profile.jsx wali same URL resolution logic
// ═══════════════════════════════════════════════════════════
const getProfileUrl = (user) => {
  if (!user) return null;

  // Sab possible field names check karo
  const candidates = [
    user.profile_image,
    user.profile_photo,
    user.profile_pic,
    user.avatar,
    user.photo,
    user.image,
    user.picture,
    user.profileImage,
    user.profilePhoto,
  ];

  let imgPath = null;
  for (const url of candidates) {
    if (typeof url === "string" && url.trim().length > 0 && url !== "null" && url !== "undefined") {
      imgPath = url.trim();
      break;
    }
  }

  if (!imgPath) return null;

  // Full URL hai to seedha return (cache buster laga ke)
  if (imgPath.startsWith("http")) {
    return `${imgPath}?v=${Date.now()}`;
  }

  // Relative path — API_BASE_URL prepend karo (Profile.jsx jaisa)
  let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;

  if (!cleanPath.startsWith("uploads/profiles/")) {
    if (cleanPath.startsWith("uploads/")) {
      cleanPath = cleanPath.replace("uploads/", "uploads/profiles/");
    } else {
      cleanPath = `uploads/profiles/${cleanPath}`;
    }
  }

  return `${API_BASE_URL}/${cleanPath}?v=${Date.now()}`;
};

// ═══════════════════════════════════════════════════════════
// USER AVATAR
// ═══════════════════════════════════════════════════════════
const UserAvatar = ({ user, size = 40 }) => {
  const photoUrl = getProfileUrl(user);
  const hue = hashHue(user?.full_name || "?");

  if (photoUrl) {
    return (
      <Avatar
        src={photoUrl}
        alt={user?.full_name || ""}
        imgProps={{
          onError: (e) => { e.target.style.display = "none"; },
        }}
        sx={{
          width: size, height: size, flexShrink: 0,
          border: `2px solid ${C.border}`,
          "& img": { objectFit: "cover" },
        }}
      >
        {getInitials(user?.full_name)}
      </Avatar>
    );
  }

  return (
    <Avatar
      sx={{
        width: size, height: size, flexShrink: 0,
        fontSize: size * 0.36, fontWeight: 800,
        background: `linear-gradient(135deg, hsl(${hue}, 55%, 52%), hsl(${hue + 35}, 58%, 40%))`,
        border: `2px solid ${C.border}`, color: "#FFF",
      }}
    >
      {getInitials(user?.full_name)}
    </Avatar>
  );
};

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════
const StatCard = ({ label, value, caption, icon, color, softColor, loading }) => (
  <Card
    elevation={0}
    sx={{
      flex: "1 1 190px", minWidth: 190, borderRadius: "16px",
      border: `1px solid ${C.border}`, backgroundColor: C.card,
      transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
      "&:hover": { boxShadow: `0 8px 24px ${color}18`, transform: "translateY(-3px)", borderColor: `${color}40` },
    }}
  >
    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.8 }}>
        <Typography sx={{ color: C.textMuted, fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</Typography>
        <Avatar sx={{ width: 38, height: 38, borderRadius: "11px", bgcolor: softColor, color, boxShadow: `0 2px 8px ${color}20` }}>{icon}</Avatar>
      </Box>
      <Typography sx={{ fontWeight: 900, color: C.textPrimary, fontSize: "1.5rem", lineHeight: 1, letterSpacing: "-0.02em" }}>
        {loading ? "—" : value}
      </Typography>
      <Box sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: C.borderLight, overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: "60%", borderRadius: 2, bgcolor: color, opacity: 0.5 }} />
      </Box>
      <Typography sx={{ color: C.textMuted, mt: 0.8, display: "block", fontWeight: 600, fontSize: "0.68rem" }}>{caption}</Typography>
    </CardContent>
  </Card>
);

// ═══════════════════════════════════════════════════════════
// CONVERSION CELL
// ═══════════════════════════════════════════════════════════
const ConversionCell = ({ rate }) => {
  const n = Number(rate);
  const barColor = n >= 30 ? C.success : n >= 15 ? C.warning : C.danger;
  const chipBg = n >= 30 ? C.successSoft : n >= 15 ? C.warningSoft : C.dangerSoft;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 150 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress variant="determinate" value={Math.min(n, 100)} sx={{ height: 8, borderRadius: 4, backgroundColor: "#F1F5F9", "& .MuiLinearProgress-bar": { backgroundColor: barColor, borderRadius: 4, transition: "width 0.5s ease" } }} />
      </Box>
      <Chip label={`${rate}%`} size="small" sx={{ fontWeight: 800, fontSize: "0.68rem", height: 22, minWidth: 48, backgroundColor: chipBg, color: barColor, border: `1px solid ${barColor}25` }} />
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════
const EmptyState = ({ icon, title, description }) => (
  <Box sx={{ py: 8, textAlign: "center", px: 3 }}>
    <Box sx={{ width: 64, height: 64, borderRadius: "16px", backgroundColor: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, color: C.primary }}>{icon}</Box>
    <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: C.textPrimary, mb: 0.5 }}>{title}</Typography>
    <Typography sx={{ fontSize: "0.82rem", color: C.textMuted, maxWidth: 400, mx: "auto", lineHeight: 1.6 }}>{description}</Typography>
  </Box>
);

// ═══════════════════════════════════════════════════════════
// DONUT CHART
// ═══════════════════════════════════════════════════════════
const DonutChart = ({ segments, size = 160, strokeWidth = 24 }) => {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  let acc = 0;
  return (
    <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          if (seg.value === 0) return null;
          const pct = total > 0 ? seg.value / total : 0;
          const dash = pct * circ;
          const gap = circ - dash;
          const rot = -90 + acc * 360;
          acc += pct;
          return <circle key={i} cx={cx} cy={cx} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeDasharray={`${dash} ${gap}`} transform={`rotate(${rot} ${cx} ${cx})`} strokeLinecap="round" />;
        })}
      </svg>
      <Box sx={{ position: "absolute", textAlign: "center" }}>
        <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", color: C.textPrimary, lineHeight: 1 }}>{total}</Typography>
        <Typography sx={{ fontSize: "0.6rem", color: C.textMuted, fontWeight: 700, letterSpacing: "0.06em", mt: 0.3, textTransform: "uppercase" }}>Leads</Typography>
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════
// SOURCE BAR CHART
// ═══════════════════════════════════════════════════════════
const BAR_COLORS = [C.primary, C.success, C.warning, C.purple, C.danger, C.info, "#EC4899", "#8B5CF6"];

const SourceBarChart = ({ data, maxVal }) => (
  <Stack gap={2}>
    {data.map((item, i) => (
      <Box key={item.source} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.textPrimary, width: 90, flexShrink: 0, textAlign: "right" }}>{item.source}</Typography>
        <Box sx={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: "#F1F5F9", overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${maxVal > 0 ? (item.total / maxVal) * 100 : 0}%`, borderRadius: 5, backgroundColor: BAR_COLORS[i % BAR_COLORS.length], minWidth: item.total > 0 ? 10 : 0, transition: "width 0.6s ease" }} />
        </Box>
        <Stack direction="row" spacing={1.2} sx={{ flexShrink: 0, width: 120 }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.textPrimary }}>{item.total}</Typography>
          <Chip label={`${item.rate}%`} size="small" sx={{ fontWeight: 800, fontSize: "0.6rem", height: 18, backgroundColor: C.successSoft, color: C.success, minWidth: 38 }} />
        </Stack>
      </Box>
    ))}
  </Stack>
);

// ═══════════════════════════════════════════════════════════
// TABLE HEAD
// ═══════════════════════════════════════════════════════════
const TH = ({ children, align = "left" }) => (
  <TableCell align={align} sx={{ fontWeight: 800, color: C.primaryDark, fontSize: "0.68rem", letterSpacing: "0.05em", textTransform: "uppercase", py: 1.5, px: 2.5, whiteSpace: "nowrap", borderBottom: `2px solid ${C.border}` }}>{children}</TableCell>
);

// ═══════════════════════════════════════════════════════════
// ROLE HELPERS
// ═══════════════════════════════════════════════════════════
const getRoleName = (u) => {
  if (typeof u.role === "string") return u.role;
  if (u.role?.name) return u.role.name;
  if (u.role_name) return u.role_name;
  return "";
};
const isManager = (u) => Number(u.role_id) === 2 || getRoleName(u) === "Manager";
const isSalesRep = (u) => Number(u.role_id) === 3 || getRoleName(u) === "Sales";

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [period, setPeriod] = useState("all");
  const [activeView, setActiveView] = useState(0);
  const [repPage, setRepPage] = useState(0);
  const [repRowsPerPage, setRepRowsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.all([
        getLeads({ page: 1, limit: 5000 }),
        getUsers({ limit: 200 }),
      ]);
      const lRaw = leadsRes?.data;
      setLeads(Array.isArray(lRaw) ? lRaw : lRaw?.data || []);
      const uRaw = usersRes?.data;
      setUsers(Array.isArray(uRaw) ? uRaw : uRaw?.data || []);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredLeads = useMemo(() => {
    const range = getPeriodRange(period);
    if (!range) return leads;
    return leads.filter((l) => { const d = new Date(l.created_at); return d >= range.start && d <= range.end; });
  }, [leads, period]);

  const orgSummary = useMemo(() => {
    const total = filteredLeads.length;
    const won = filteredLeads.filter((l) => l.status === "Won").length;
    const lost = filteredLeads.filter((l) => l.status === "Lost").length;
    const active = total - won - lost;
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
    const revenue = filteredLeads.filter((l) => l.status === "Won").reduce((s, l) => s + (Number(l.quotation_amount) || 0), 0);
    return { total, won, lost, active, conversionRate, revenue };
  }, [filteredLeads]);

  const managers = useMemo(() => users.filter(isManager), [users]);
  const reps = useMemo(() => users.filter(isSalesRep), [users]);

  const managerReports = useMemo(() => {
    return managers.map((mgr) => {
      const teamRepIds = reps.filter((r) => Number(r.manager_id) === Number(mgr.id)).map((r) => r.id);
      const teamLeads = filteredLeads.filter((l) => teamRepIds.includes(l.assigned_to) || Number(l.assigned_to) === Number(mgr.id) || Number(l.created_by) === Number(mgr.id));
      const total = teamLeads.length;
      const won = teamLeads.filter((l) => l.status === "Won").length;
      const lost = teamLeads.filter((l) => l.status === "Lost").length;
      const active = total - won - lost;
      const rate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
      const revenue = teamLeads.filter((l) => l.status === "Won").reduce((s, l) => s + (Number(l.quotation_amount) || 0), 0);
      return { user: mgr, id: mgr.id, name: mgr.full_name, email: mgr.email, teamSize: teamRepIds.length, total, won, lost, active, rate, revenue };
    });
  }, [managers, reps, filteredLeads]);

  const repReports = useMemo(() => {
    return reps.map((rep) => {
      const repLeads = filteredLeads.filter((l) => Number(l.assigned_to) === Number(rep.id));
      const total = repLeads.length;
      const won = repLeads.filter((l) => l.status === "Won").length;
      const lost = repLeads.filter((l) => l.status === "Lost").length;
      const active = total - won - lost;
      const rate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
      const revenue = repLeads.filter((l) => l.status === "Won").reduce((s, l) => s + (Number(l.quotation_amount) || 0), 0);
      const managerName = rep.manager_name || managers.find((m) => Number(m.id) === Number(rep.manager_id))?.full_name || "Unassigned";
      return { user: rep, id: rep.id, name: rep.full_name, email: rep.email, managerName, total, won, lost, active, rate, revenue };
    });
  }, [reps, filteredLeads, managers]);

  const sourcePerformance = useMemo(() => {
    const map = {};
    filteredLeads.forEach((l) => {
      const src = l.lead_source || "Other";
      if (!map[src]) map[src] = { total: 0, won: 0 };
      map[src].total += 1;
      if (l.status === "Won") map[src].won += 1;
    });
    return Object.entries(map).map(([source, v]) => ({ source, ...v, rate: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0 })).sort((a, b) => b.total - a.total);
  }, [filteredLeads]);

  const maxSourceTotal = Math.max(1, ...sourcePerformance.map((s) => s.total));

  const donutSegments = useMemo(() => [
    { label: "Won", value: orgSummary.won, color: C.success },
    { label: "Lost", value: orgSummary.lost, color: C.danger },
    { label: "Active", value: orgSummary.active, color: C.primary },
  ], [orgSummary]);

  const handleExportCSV = () => {
    const isM = activeView === 0;
    const rows = isM ? managerReports : repReports;
    if (!rows?.length) return;
    const h = isM
      ? ["Manager Name", "Email", "Team Size", "Total Leads", "Active", "Won", "Lost", "Conversion Rate (%)", "Revenue Won"]
      : ["Rep Name", "Email", "Reporting Manager", "Total Leads", "Active", "Won", "Lost", "Conversion Rate (%)", "Revenue Won"];
    const d = rows.map((r) =>
      isM
        ? [`"${r.name}"`, `"${r.email}"`, r.teamSize, r.total, r.active, r.won, r.lost, `"${r.rate}%"`, r.revenue]
        : [`"${r.name}"`, `"${r.email}"`, `"${r.managerName}"`, r.total, r.active, r.won, r.lost, `"${r.rate}%"`, r.revenue]
    );
    const csv = "\uFEFF" + [h.join(","), ...d.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.setAttribute("href", URL.createObjectURL(blob));
    a.setAttribute("download", `Solar_CRM_${isM ? "Manager" : "Rep"}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleExportPDF = () => {
    const w = window.open("", "_blank");
    const dt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const pl = PERIOD_OPTIONS.find((p) => p.value === period)?.label || "All Time";
    w.document.write(`<!DOCTYPE html><html><head><title>Report</title><style>
      body{font-family:'Segoe UI',sans-serif;margin:30px;color:#0F172A}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #00B5EF;padding-bottom:15px;margin-bottom:20px}
      .logo{height:45px}.title{font-size:20px;font-weight:bold;color:#292075;margin:0}
      .subtitle{font-size:12px;color:#64748B;margin-top:4px}
      .kpi-container{display:flex;gap:15px;margin-bottom:25px}
      .kpi-card{flex:1;border:1px solid #E2E8F0;border-radius:8px;padding:12px;background:#F8FAFC;text-align:center}
      .kpi-title{font-size:10px;font-weight:bold;color:#64748B;text-transform:uppercase}
      .kpi-value{font-size:18px;font-weight:800;color:#00B5EF;margin-top:5px}
      table{width:100%;border-collapse:collapse;margin-top:10px;margin-bottom:25px;font-size:12px}
      th{background-color:#292075;color:#FFF;text-align:left;padding:10px;font-weight:600}
      td{padding:10px;border-bottom:1px solid #E2E8F0}tr:nth-child(even){background-color:#F8FAFC}
      h3{color:#292075}.footer{margin-top:40px;font-size:10px;color:#94A3B8;text-align:center;border-top:1px solid #E2E8F0;padding-top:10px}
    </style></head><body>
      <div class="header"><div><h1 class="title">SOLAR CRM - ORGANIZATION PERFORMANCE REPORT</h1><p class="subtitle">Period: ${pl} | Generated on: ${dt}</p></div><img src="${window.location.origin}${logo}" class="logo" alt="Logo" onerror="this.style.display='none'"/></div>
      <div class="kpi-container">
        <div class="kpi-card"><div class="kpi-title">Total Leads</div><div class="kpi-value">${orgSummary.total}</div></div>
        <div class="kpi-card"><div class="kpi-title">Deals Won</div><div class="kpi-value" style="color:#16A34A">${orgSummary.won}</div></div>
        <div class="kpi-card"><div class="kpi-title">Conversion Rate</div><div class="kpi-value">${orgSummary.conversionRate}%</div></div>
        <div class="kpi-card"><div class="kpi-title">Revenue Won</div><div class="kpi-value" style="color:#D97706">${formatINR(orgSummary.revenue)}</div></div>
      </div>
      <h3>Manager-wise Breakdown</h3><table><thead><tr><th>Manager</th><th>Team Size</th><th>Total</th><th>Active</th><th>Won</th><th>Lost</th><th>Conversion</th><th>Revenue</th></tr></thead><tbody>
        ${managerReports.map((r) => `<tr><td><strong>${r.name}</strong><br/><span style="color:#64748B;font-size:10px">${r.email}</span></td><td>${r.teamSize}</td><td>${r.total}</td><td>${r.active}</td><td style="color:#16A34A;font-weight:bold">${r.won}</td><td style="color:#DC2626">${r.lost}</td><td>${r.rate}%</td><td>${formatINR(r.revenue)}</td></tr>`).join("")}
      </tbody></table>
      <h3>Sales Rep-wise Breakdown</h3><table><thead><tr><th>Rep</th><th>Manager</th><th>Total</th><th>Active</th><th>Won</th><th>Lost</th><th>Conversion</th><th>Revenue</th></tr></thead><tbody>
        ${repReports.map((r) => `<tr><td><strong>${r.name}</strong><br/><span style="color:#64748B;font-size:10px">${r.email}</span></td><td>${r.managerName}</td><td>${r.total}</td><td>${r.active}</td><td style="color:#16A34A;font-weight:bold">${r.won}</td><td style="color:#DC2626">${r.lost}</td><td>${r.rate}%</td><td>${formatINR(r.revenue)}</td></tr>`).join("")}
      </tbody></table>
      <div class="footer">This document is computer-generated and contains private analytics for Solar CRM performance assessment.</div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`);
    w.document.close();
  };

  const pagedRepRows = repReports.slice(repPage * repRowsPerPage, repPage * repRowsPerPage + repRowsPerPage);
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || "All Time";

  const rowSx = {
    "& td": { borderBottom: `1px solid ${C.borderLight}`, py: 2, px: 2.5 },
    "&:hover td": { backgroundColor: `${C.primarySoft}40` },
    transition: "background-color 0.15s ease",
  };

  const NameCell = ({ user, name, email }) => (
    <Stack direction="row" alignItems="center" spacing={1.8}>
      <UserAvatar user={user} size={42} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: C.textPrimary, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</Typography>
        <Typography sx={{ fontSize: "0.7rem", color: C.textMuted, mt: 0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</Typography>
      </Box>
    </Stack>
  );

  const NumCell = ({ value, color, align = "center" }) => (
    <TableCell align={align} sx={{ fontSize: "0.85rem", fontWeight: 800, color: color || C.textPrimary }}>{value}</TableCell>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, backgroundColor: C.bg, minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>

      {/* HEADER BANNER */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 }, mb: 3, borderRadius: "20px",
          background: `linear-gradient(135deg, ${C.primaryDark} 0%, #3D2B9A 45%, ${C.primary} 100%)`,
          position: "relative", overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: "-60px", right: "-30px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ position: "absolute", bottom: "-80px", left: "25%", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        <Box sx={{ position: "absolute", top: "40%", right: "15%", width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
          <Avatar sx={{ width: 54, height: 54, borderRadius: "15px", backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <AssessmentIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "1.1rem", md: "1.3rem" }, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Organization Performance Reports</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", mt: 0.4, fontWeight: 500 }}>Manager & sales rep conversion analytics with exportable reports.</Typography>
          </Box>
        </Box>
      </Paper>

      {/* TOOLBAR */}
      <Paper elevation={0} sx={{ p: 1.8, mb: 3, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, py: 0.5, borderRadius: "10px", bgcolor: C.bg }}>
          <CalendarTodayIcon sx={{ fontSize: 16, color: C.textMuted }} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: C.card, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }, "& .MuiSelect-select": { py: 0.8 } }}>
              {PERIOD_OPTIONS.map((p) => (<MenuItem key={p.value} value={p.value} sx={{ fontSize: "0.8rem" }}>{p.label}</MenuItem>))}
            </Select>
          </FormControl>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Chip label={periodLabel} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", height: 28, borderRadius: "8px", bgcolor: C.primarySoft, color: C.primaryDark, border: `1px solid ${C.primary}30` }} />
        <Tooltip title="Refresh Data"><span>
          <IconButton onClick={fetchData} disabled={loading} sx={{ borderRadius: "10px", width: 38, height: 38, border: `1px solid ${C.border}`, color: C.textSecondary, "&:hover": { bgcolor: C.primarySoft, color: C.primary, borderColor: `${C.primary}50` } }}>
            <RefreshIcon sx={{ fontSize: 18, animation: loading ? "spin 0.9s linear infinite" : "none", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} />
          </IconButton>
        </span></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 28, alignSelf: "center" }} />
        <Button variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 16 }} />} onClick={handleExportCSV} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 2.2, py: 1, fontSize: "0.78rem", borderColor: C.border, color: C.textSecondary, "&:hover": { borderColor: C.primary, color: C.primary, bgcolor: C.primarySoft, boxShadow: `0 2px 8px ${C.primary}20` } }}>Export CSV</Button>
        <Button variant="contained" startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />} onClick={handleExportPDF} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 2.2, py: 1, fontSize: "0.78rem", bgcolor: C.primaryDark, boxShadow: `0 2px 8px ${C.primaryDark}30`, "&:hover": { bgcolor: "#1E1758", boxShadow: `0 4px 14px ${C.primaryDark}40` } }}>Print / PDF</Button>
      </Paper>

      {/* KPI CARDS */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, width: "100%" }}>
        <StatCard label="Total Leads" value={orgSummary.total} caption={`${orgSummary.active} currently active`} icon={<TrendingUpIcon sx={{ fontSize: 19 }} />} color={C.primary} softColor={C.primarySoft} loading={loading} />
        <StatCard label="Deals Won" value={orgSummary.won} caption={`${orgSummary.lost} lost in period`} icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 19 }} />} color={C.success} softColor={C.successSoft} loading={loading} />
        <StatCard label="Conversion Rate" value={`${orgSummary.conversionRate}%`} caption="Org-wide, selected period" icon={<AssessmentIcon sx={{ fontSize: 19 }} />} color={C.info} softColor={C.infoSoft} loading={loading} />
        <StatCard label="Revenue Won" value={formatINR(orgSummary.revenue)} caption="From closed-won deals" icon={<AttachMoneyIcon sx={{ fontSize: 19 }} />} color={C.warning} softColor={C.warningSoft} loading={loading} />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
          <CircularProgress sx={{ color: C.primary }} size={40} thickness={4} />
          <Typography sx={{ color: C.textMuted, fontWeight: 600, fontSize: "0.85rem" }}>Loading report data…</Typography>
        </Box>
      ) : filteredLeads.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: "18px", border: `1px solid ${C.border}`, backgroundColor: C.card, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <EmptyState icon={<InboxOutlinedIcon sx={{ fontSize: 30 }} />} title="No Leads Data Found" description="There are no leads in the selected period. Try changing the time range or add leads to see performance reports." />
        </Paper>
      ) : (
        <>
          {/* CHARTS ROW */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "380px 1fr" }, gap: 2.5, mb: 3 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: "18px", border: `1px solid ${C.border}`, backgroundColor: C.card, boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3, alignSelf: "flex-start" }}>
                <Box sx={{ width: 4, height: 18, borderRadius: "4px", bgcolor: C.primary }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary }}>Status Distribution</Typography>
              </Stack>
              <DonutChart segments={donutSegments} />
              <Stack direction="row" spacing={3} sx={{ mt: 3, width: "100%", justifyContent: "center", "& > *": { flex: 1 } }}>
                {donutSegments.map((seg) => (
                  <Stack key={seg.label} alignItems="center" spacing={0.6} sx={{ px: 1.5, py: 1.2, borderRadius: "10px", bgcolor: `${seg.color}08`, border: `1px solid ${seg.color}15` }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: "4px", bgcolor: seg.color }} />
                    <Typography sx={{ fontSize: "1rem", fontWeight: 900, color: C.textPrimary, lineHeight: 1 }}>{seg.value}</Typography>
                    <Typography sx={{ fontSize: "0.6rem", color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{seg.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, borderRadius: "18px", border: `1px solid ${C.border}`, backgroundColor: C.card, boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                <Box sx={{ width: 4, height: 18, borderRadius: "4px", bgcolor: C.warning }} />
                <SourceOutlinedIcon sx={{ fontSize: 20, color: C.warning }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary }}>Lead Source Performance</Typography>
              </Stack>
              {sourcePerformance.length === 0 ? (
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ color: C.textMuted, fontSize: "0.85rem" }}>No source data for this period.</Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1, overflow: "auto", pr: 1 }}>
                  <SourceBarChart data={sourcePerformance} maxVal={maxSourceTotal} />
                </Box>
              )}
            </Paper>
          </Box>

          {/* TABLE SECTION */}
          <Paper elevation={0} sx={{ borderRadius: "18px", border: `1px solid ${C.border}`, overflow: "hidden", backgroundColor: C.card, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <Tabs
              value={activeView} onChange={(e, val) => setActiveView(val)}
              sx={{
                borderBottom: `2px solid ${C.borderLight}`, bgcolor: "#FAFBFC", px: 2, pt: 0.5,
                "& .MuiTab-root": { fontSize: "0.82rem", fontWeight: 700, textTransform: "none", minHeight: 50, px: 2.5, gap: 1 },
                "& .Mui-selected": { color: C.primaryDark, bgcolor: `${C.primarySoft}50` },
                "& .MuiTabs-indicator": { bgcolor: C.primaryDark, height: 3, borderRadius: "3px 3px 0 0" },
              }}
            >
              <Tab icon={<SupervisorAccountOutlinedIcon sx={{ fontSize: 19 }} />} iconPosition="start" label={`By Manager (${managerReports.length})`} />
              <Tab icon={<PersonOutlinedIcon sx={{ fontSize: 19 }} />} iconPosition="start" label={`By Sales Rep (${repReports.length})`} />
            </Tabs>

            {activeView === 0 ? (
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                      <TH>Manager</TH>
                      <TH align="center">Team</TH>
                      <TH align="center">Total</TH>
                      <TH align="center">Active</TH>
                      <TH align="center">Won</TH>
                      <TH align="center">Lost</TH>
                      <TH>Conversion</TH>
                      <TH align="right">Revenue</TH>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {managerReports.length === 0 ? (
                      <TableRow><TableCell colSpan={8} sx={{ border: 0 }}><EmptyState icon={<SupervisorAccountOutlinedIcon sx={{ fontSize: 28 }} />} title="No Managers Found" description="No users with Manager role exist in the system. Managers will appear here once they are added via User Management." /></TableCell></TableRow>
                    ) : managerReports.map((r) => (
                      <TableRow key={r.id} hover sx={rowSx}>
                        <TableCell><NameCell user={r.user} name={r.name} email={r.email} /></TableCell>
                        <NumCell value={r.teamSize} />
                        <NumCell value={r.total} />
                        <NumCell value={r.active} color={C.info} />
                        <NumCell value={r.won} color={C.success} />
                        <NumCell value={r.lost} color={C.danger} />
                        <TableCell><ConversionCell rate={r.rate} /></TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.85rem", fontWeight: 900, color: C.primaryDark, letterSpacing: "-0.01em" }}>{formatINR(r.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 520 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                        <TH>Sales Rep</TH>
                        <TH>Manager</TH>
                        <TH align="center">Total</TH>
                        <TH align="center">Active</TH>
                        <TH align="center">Won</TH>
                        <TH align="center">Lost</TH>
                        <TH>Conversion</TH>
                        <TH align="right">Revenue</TH>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedRepRows.length === 0 ? (
                        <TableRow><TableCell colSpan={8} sx={{ border: 0 }}><EmptyState icon={<PersonOutlinedIcon sx={{ fontSize: 28 }} />} title="No Sales Reps Found" description="No users with Sales Rep role exist in the system. Reps will appear here once they are added and assigned to managers." /></TableCell></TableRow>
                      ) : pagedRepRows.map((r) => (
                        <TableRow key={r.id} hover sx={rowSx}>
                          <TableCell><NameCell user={r.user} name={r.name} email={r.email} /></TableCell>
                          <TableCell>
                            <Chip label={r.managerName} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem", height: 26, borderRadius: "8px", bgcolor: C.purpleSoft, color: C.purple, maxWidth: 140, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} />
                          </TableCell>
                          <NumCell value={r.total} />
                          <NumCell value={r.active} color={C.info} />
                          <NumCell value={r.won} color={C.success} />
                          <NumCell value={r.lost} color={C.danger} />
                          <TableCell><ConversionCell rate={r.rate} /></TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.85rem", fontWeight: 900, color: C.primaryDark, letterSpacing: "-0.01em" }}>{formatINR(r.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {repReports.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]} component="div" count={repReports.length} rowsPerPage={repRowsPerPage} page={repPage}
                    onPageChange={(e, p) => setRepPage(p)}
                    onRowsPerPageChange={(e) => { setRepRowsPerPage(parseInt(e.target.value, 10)); setRepPage(0); }}
                    sx={{ borderTop: `2px solid ${C.borderLight}`, "& .MuiTablePagination-toolbar": { minHeight: 48, px: 2.5 }, "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel": { fontSize: "0.8rem", color: C.textSecondary, fontWeight: 600 } }}
                  />
                )}
              </>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Reports;