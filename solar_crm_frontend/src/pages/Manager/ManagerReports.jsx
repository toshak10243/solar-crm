import React, { useState, useEffect, useMemo } from "react";
import { getTeamMembers } from "../../services/userServices";
import { getLeads } from "../../services/leadService";
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

// Icons
import AssessmentIcon from "@mui/icons-material/Assessment";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

// Logo for PDF Report Header
import logo from "../../assets/images/logo.png";

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
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const ManagerReports = () => {
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [leads, setLeads] = useState([]);

  // View Mode ('table' or 'grid')
  const [viewMode, setViewMode] = useState("table");

const fetchData = async () => {
  setLoading(true);
  try {
    const [teamRes, leadsRes] = await Promise.all([
      getTeamMembers(),
      getLeads({ page: 1, limit: 5000 }),   // 👈 fix
    ]);
    setTeamMembers(teamRes?.data || teamRes || []);
    setLeads(leadsRes?.data || leadsRes || []);
  } catch (err) {
    console.error("Error fetching report data:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // Overall Performance Summary
  const summary = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter((l) => l.status === "Won").length;
    const lostLeads = leads.filter((l) => l.status === "Lost").length;
    const activeLeads = totalLeads - (wonLeads + lostLeads);
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

    return { totalLeads, wonLeads, lostLeads, activeLeads, conversionRate };
  }, [leads]);

  // Per Sales Rep Report
  const repReports = useMemo(() => {
    if (!Array.isArray(teamMembers)) return [];

    return teamMembers.map((member) => {
      const memberLeads = leads.filter(
        (l) => Number(l.assigned_to) === Number(member.id) || l.assigned_to_name === member.full_name
      );
      const total = memberLeads.length;
      const won = memberLeads.filter((l) => l.status === "Won").length;
      const lost = memberLeads.filter((l) => l.status === "Lost").length;
      const active = total - (won + lost);
      const rate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;

      return {
        id: member.id,
        name: member.full_name,
        email: member.email,
        total,
        won,
        lost,
        active,
        conversionRate: rate,
      };
    });
  }, [teamMembers, leads]);

  // 🟢 ENHANCED EXCEL / CSV EXPORT WITH SPACED COLUMNS
  const handleExportCSV = () => {
    if (!repReports || repReports.length === 0) return;

    // Properly escaped and formatted CSV header & rows
    const headers = ["Representative Name", "Email Address", "Total Leads Handled", "Active Pipeline Leads", "Deals Won", "Deals Lost", "Conversion Rate (%)"];
    
    const rows = repReports.map((r) => [
      `"${r.name}"`,
      `"${r.email}"`,
      r.total,
      r.active,
      r.won,
      r.lost,
      `"${r.conversionRate}%"`,
    ]);

    // Added BOM (\uFEFF) for proper Excel UTF-8 spacing & character encoding
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Solar_CRM_Team_Performance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🟢 FIXED PDF PRINT ENGINE
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Team Performance Report - Solar CRM</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #0F172A; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #005BAC; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { height: 45px; }
          .title { font-size: 20px; font-weight: bold; color: #0B3A63; margin: 0; }
          .subtitle { font-size: 12px; color: #64748B; margin-top: 4px; }
          .kpi-container { display: flex; gap: 15px; margin-bottom: 25px; }
          .kpi-card { flex: 1; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; background: #F8FAFC; text-align: center; }
          .kpi-title { font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; }
          .kpi-value { font-size: 18px; font-weight: 800; color: #005BAC; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background-color: #0B3A63; color: #FFFFFF; text-align: left; padding: 10px; font-weight: 600; }
          td { padding: 10px; border-bottom: 1px solid #E2E8F0; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .badge { font-weight: bold; color: #16A34A; background: #DCFCE7; padding: 4px 8px; border-radius: 4px; display: inline-block; }
          .footer { margin-top: 40px; font-size: 10px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 10px; }
          .signature-box { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">SOLAR CRM - TEAM PERFORMANCE REPORT</h1>
            <p class="subtitle">Generated on: ${currentDate} | Confidential Manager Portal</p>
          </div>
          <img src="${window.location.origin}${logo}" class="logo" alt="Solar CRM" onerror="this.style.display='none'" />
        </div>

        <div class="kpi-container">
          <div class="kpi-card">
            <div class="kpi-title">Total Managed Leads</div>
            <div class="kpi-value">${summary.totalLeads}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Deals Won</div>
            <div class="kpi-value" style="color:#16A34A">${summary.wonLeads}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Active Pipeline</div>
            <div class="kpi-value" style="color:#0284C7">${summary.activeLeads}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Conversion Rate</div>
            <div class="kpi-value">${summary.conversionRate}%</div>
          </div>
        </div>

        <h3>Sales Representative Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Representative</th>
              <th>Total Leads</th>
              <th>Active</th>
              <th>Deals Won</th>
              <th>Deals Lost</th>
              <th>Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            ${repReports
              .map(
                (r) => `
              <tr>
                <td><strong>${r.name}</strong><br/><span style="color:#64748B; font-size:10px;">${r.email}</span></td>
                <td>${r.total}</td>
                <td>${r.active}</td>
                <td style="color:#16A34A; font-weight:bold;">${r.won}</td>
                <td style="color:#DC2626;">${r.lost}</td>
                <td><span class="badge">${r.conversionRate}%</span></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="signature-box">
          <div><strong>Prepared By:</strong> Manager Portal System</div>
          <div><strong>Authorized Signature:</strong> ______________________</div>
        </div>

        <div class="footer">
          This document is computer-generated and contains private analytics for Solar CRM performance assessment.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh" }}>
      {/* 1. HEADER BANNER WITH TOGGLE & EXPORTS */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: "#E6F0FA",
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AssessmentIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.15rem" }}>
              Team Performance & Conversion Reports
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.825rem", mt: 0.2 }}>
              Detailed analytics on team deal conversion, pipeline activity, and member efficiency.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", width: { xs: "100%", md: "auto" }, justifyContent: "flex-end" }}>
          {/* VIEW MODE TOGGLE */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, mode) => mode && setViewMode(mode)}
            size="small"
            sx={{
              backgroundColor: "#F1F5F9",
              p: 0.3,
              borderRadius: "8px",
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: "6px",
                px: 1.5,
                py: 0.5,
                color: COLORS.textSecondary,
                "&.Mui-selected": {
                  backgroundColor: COLORS.card,
                  color: COLORS.primary,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontWeight: 700,
                },
              },
            }}
          >
            <ToggleButton value="table">
              <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
              Table
            </ToggleButton>
            <ToggleButton value="grid">
              <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} />
              Grid
            </ToggleButton>
          </ToggleButtonGroup>

          {/* EXCEL BUTTON */}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              "&:hover": { backgroundColor: "#F1F5F9" },
            }}
          >
            Export Excel
          </Button>

          {/* PDF BUTTON */}
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPDF}
            sx={{
              backgroundColor: COLORS.primary,
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              px: 2,
              "&:hover": { backgroundColor: COLORS.primaryDark },
            }}
          >
            Print / PDF Report
          </Button>

          <Tooltip title="Refresh Analytics">
            <IconButton onClick={fetchData} color="primary" sx={{ backgroundColor: "#F1F5F9", border: `1px solid ${COLORS.border}` }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* 2. KPI METRICS CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>
              TOTAL MANAGED LEADS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
              {summary.totalLeads}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 700 }}>
              DEALS WON
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.success, mt: 0.5 }}>
              {summary.wonLeads}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <Typography variant="caption" sx={{ color: COLORS.info, fontWeight: 700 }}>
              ACTIVE IN PIPELINE
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.info, mt: 0.5 }}>
              {summary.activeLeads}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700 }}>
              CONVERSION RATE
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
              {summary.conversionRate}% <TrendingUpIcon fontSize="small" />
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 3. PERFORMANCE BREAKDOWN (DUAL VIEW) */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: COLORS.primary }} size={36} />
        </Box>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${COLORS.border}`, overflow: "hidden", backgroundColor: COLORS.card }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primaryDark }}>
              Sales Representative Performance Breakdown
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Rep Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Total Leads</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Active</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Won</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Lost</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Conversion Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repReports.map((rep) => (
                  <TableRow key={rep.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                        {rep.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                        {rep.email}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>{rep.total}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.info }}>{rep.active}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.success }}>{rep.won}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.danger }}>{rep.lost}</TableCell>

                    <TableCell sx={{ minWidth: 180 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: "100%" }}>
                          <LinearProgress
                            variant="determinate"
                            value={Number(rep.conversionRate)}
                            sx={{ height: 8, borderRadius: 4, backgroundColor: "#E2E8F0", "& .MuiLinearProgress-bar": { backgroundColor: COLORS.success } }}
                          />
                        </Box>
                        <Chip
                          label={`${rep.conversionRate}%`}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: "0.7rem", height: 22, backgroundColor: "#DCFCE7", color: COLORS.success }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        /* GRID CARDS VIEW */
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {repReports.map((rep) => (
            <Card
              key={rep.id}
              elevation={0}
              sx={{
                borderRadius: "14px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
                transition: "all 0.2s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 16px rgba(15,23,42,0.06)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: COLORS.primaryDark, width: 40, height: 40, fontWeight: 700 }}>
                    {getInitials(rep.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1.2 }}>
                      {rep.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                      {rep.email}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ backgroundColor: "#F8FAFC", p: 1.5, borderRadius: "10px", mb: 2, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, textAlign: "center" }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, fontSize: "0.65rem" }}>TOTAL</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{rep.total}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.info, fontWeight: 700, fontSize: "0.65rem" }}>ACTIVE</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.info }}>{rep.active}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 700, fontSize: "0.65rem" }}>WON</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.success }}>{rep.won}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>Conversion Efficiency</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.success }}>{rep.conversionRate}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Number(rep.conversionRate)}
                    sx={{ height: 8, borderRadius: 4, backgroundColor: "#E2E8F0", "& .MuiLinearProgress-bar": { backgroundColor: COLORS.success } }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ManagerReports;