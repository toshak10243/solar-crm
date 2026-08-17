import React, { useState, useEffect, useMemo } from "react";
import { getTeamMembers } from "../../services/userServices";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

// Icons
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import CloseIcon from "@mui/icons-material/Close";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

// SBI Theme — cyan (primary) + indigo (primaryDark), matches Admin Leads / Admin Dashboard / Manager Leads
const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
  primaryTint: "rgba(0, 181, 239, 0.12)",
  primaryShadow: "rgba(41, 32, 117, 0.18)",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  border: "#E5E7EB",
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

const getImageUrl = (imgPath) => {
  if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") return null;
  if (imgPath.startsWith("http")) return imgPath;

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

const TeamMembers = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'table' (default) or 'grid'
  const [viewMode, setViewMode] = useState("table");

  // Filtering & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name_asc");

  // Table Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const fetchTeamMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTeamMembers();
      const data = res?.data || res || [];
      setTeam(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching team members:", err);
      setError(err.response?.data?.message || "Failed to load sales team details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Handler for View Switch
  const handleViewChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setPage(0);
    }
  };

  // Filter and Sort Logic
  const processedTeam = useMemo(() => {
    return team
      .filter((member) => {
        const matchesSearch =
          member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone?.includes(searchTerm);

        const isActive =
          member.status === 1 ||
          member.status === "1" ||
          member.status === true ||
          member.status?.toString().toLowerCase() === "active";

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && isActive) ||
          (statusFilter === "INACTIVE" && !isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name_asc") return a.full_name?.localeCompare(b.full_name);
        if (sortBy === "name_desc") return b.full_name?.localeCompare(a.full_name);
        if (sortBy === "leads_desc") return (b.total_assigned || 0) - (a.total_assigned || 0);
        if (sortBy === "won_desc") return (b.converted || 0) - (a.converted || 0);
        return 0;
      });
  }, [team, searchTerm, statusFilter, sortBy]);

  // Global KPIs Calculation
  const globalStats = useMemo(() => {
    const totalReps = team.length;
    const activeReps = team.filter(
      (m) =>
        m.status === 1 ||
        m.status === "1" ||
        m.status === true ||
        m.status?.toString().toLowerCase() === "active"
    ).length;
    const totalLeads = team.reduce((acc, curr) => acc + (Number(curr.total_assigned) || 0), 0);
    const totalWon = team.reduce((acc, curr) => acc + (Number(curr.converted) || 0), 0);
    const avgConversion = totalLeads > 0 ? Math.round((totalWon / totalLeads) * 100) : 0;

    return { totalReps, activeReps, totalLeads, totalWon, avgConversion };
  }, [team]);

  const handleOpenDetail = (member) => {
    setSelectedMember(member);
    setOpenModal(true);
  };

  const handleCloseDetail = () => {
    setOpenModal(false);
    setSelectedMember(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh" }}>
      {/* 1. HEADER BANNER & ACTION CONTROLS */}
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
              backgroundColor: COLORS.primaryTint,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GroupsOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.15rem", lineHeight: 1.2 }}>
              Sales Team Directory & Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.825rem", mt: 0.3 }}>
              Track sales representatives, conversion metrics, and workload distribution.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", width: { xs: "100%", md: "auto" }, justifyContent: "flex-end" }}>
          {/* View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
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
                textTransform: "none",
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

          <Tooltip title="Refresh Team Data">
            <IconButton onClick={fetchTeamMembers} sx={{ backgroundColor: "#F1F5F9", border: `1px solid ${COLORS.border}`, color: COLORS.primary }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* 2. KPI ANALYTICS STRIP */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: "0.03em" }}>
            TOTAL SALES REPS
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mt: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
              {globalStats.totalReps}
            </Typography>
            <Chip label={`${globalStats.activeReps} Active`} size="small" sx={{ bgcolor: "#DCFCE7", color: COLORS.success, fontWeight: 700, height: 20, fontSize: "0.68rem" }} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: "0.03em" }}>
            TOTAL MANAGED LEADS
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primaryDark, mt: 0.5 }}>
            {globalStats.totalLeads}
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: "0.03em" }}>
            TOTAL CONVERTED (WON)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.success, mt: 0.5 }}>
            {globalStats.totalWon}
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: "0.03em" }}>
            TEAM CONVERSION RATE
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.info }}>
              {globalStats.avgConversion}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={globalStats.avgConversion}
              sx={{ flexGrow: 1, height: 6, borderRadius: 3, backgroundColor: "#E0F2FE", "& .MuiLinearProgress-bar": { backgroundColor: COLORS.info } }}
            />
          </Box>
        </Paper>
      </Box>

      {/* 3. FILTER & SEARCH CONTROL BAR */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
            gap: 2,
            alignItems: "center",
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Sales Rep name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: COLORS.textSecondary, fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.875rem",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: COLORS.primary,
                },
              },
            }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: "0.85rem" }}>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                borderRadius: "8px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.875rem",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.primary },
              }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active Reps Only</MenuItem>
              <MenuItem value="INACTIVE">Inactive Reps Only</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: "0.85rem" }}>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
              sx={{
                borderRadius: "8px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.875rem",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.primary },
              }}
            >
              <MenuItem value="name_asc">Name (A - Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z - A)</MenuItem>
              <MenuItem value="leads_desc">Highest Assigned Leads</MenuItem>
              <MenuItem value="won_desc">Highest Won Conversions</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 4. MAIN CONTENT AREA (TABLE VS GRID VIEW) */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: COLORS.primary }} size={38} thickness={4} />
        </Box>
      ) : error ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: "center", border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", color: COLORS.danger, borderRadius: "10px" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{error}</Typography>
        </Paper>
      ) : processedTeam.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: `1px solid ${COLORS.border}`, borderRadius: "12px", backgroundColor: COLORS.card }}>
          <GroupsOutlinedIcon sx={{ fontSize: 48, color: "#94A3B8", mb: 1 }} />
          <Typography variant="h6" sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>
            No Sales Team Members Found
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.5 }}>
            Try adjusting your search query or status filter parameters.
          </Typography>
        </Paper>
      ) : viewMode === "table" ? (
        /* TABLE VIEW LAYOUT (default) */
        <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${COLORS.border}`, overflow: "hidden", backgroundColor: COLORS.card }}>
          <TableContainer sx={{ maxHeight: 560 }}>
            <Table stickyHeader sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Sales Representative
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Contact Info
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Assigned
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Won
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Active Pipeline
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Today
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Efficiency
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: COLORS.primaryDark, backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.border}` }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedTeam
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((member, idx) => {
                    const avatarUrl = getImageUrl(member.profile_image);
                    const isActive =
                      member.status === 1 ||
                      member.status === "1" ||
                      member.status === true ||
                      member.status?.toString().toLowerCase() === "active";

                    const total = Number(member.total_assigned) || 0;
                    const won = Number(member.converted) || 0;
                    const convRate = total > 0 ? Math.round((won / total) * 100) : 0;

                    return (
                      <TableRow
                        key={member.id}
                        hover
                        sx={{
                          backgroundColor: idx % 2 === 1 ? "#FBFCFE" : COLORS.card,
                          "&:last-child td, &:last-child th": { border: 0 },
                          "&:hover": { backgroundColor: COLORS.primaryTint },
                          transition: "background-color 0.15s ease-in-out",
                        }}
                      >
                        <TableCell sx={{ py: 1.4 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar src={avatarUrl || undefined} sx={{ width: 38, height: 38, bgcolor: COLORS.primaryDark, fontSize: "0.875rem", fontWeight: 700 }}>
                              {getInitials(member.full_name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {member.full_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.725rem" }}>
                                ID: #{String(member.id).padStart(4, "0")}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: "0.8rem", color: COLORS.textPrimary, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                            {member.email || "N/A"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem" }}>
                            {member.phone || "N/A"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={isActive ? "Active" : "Inactive"}
                            size="small"
                            sx={{
                              backgroundColor: isActive ? "#DCFCE7" : "#FEE2E2",
                              color: isActive ? COLORS.success : COLORS.danger,
                              fontWeight: 700,
                              fontSize: "0.68rem",
                              height: 22,
                              borderRadius: "4px",
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                            {member.total_assigned || 0}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Chip label={member.converted || 0} size="small" sx={{ bgcolor: "#DCFCE7", color: COLORS.success, fontWeight: 800, minWidth: 32 }} />
                        </TableCell>

                        <TableCell align="center">
                          <Chip label={member.in_progress || 0} size="small" sx={{ bgcolor: "#E0F2FE", color: COLORS.info, fontWeight: 800, minWidth: 32 }} />
                        </TableCell>

                        <TableCell align="center">
                          <Chip label={member.today_followups || 0} size="small" sx={{ bgcolor: "#FEF3C7", color: COLORS.warning, fontWeight: 800, minWidth: 32 }} />
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                            {convRate}%
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Tooltip title="View Detailed Performance">
                            <IconButton size="small" onClick={() => handleOpenDetail(member)} sx={{ color: COLORS.primary }}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={processedTeam.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ "& .MuiTablePagination-toolbar": { minHeight: 52 } }}
          />
        </Paper>
      ) : (
        /* GRID VIEW LAYOUT */
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 2.5,
          }}
        >
          {processedTeam.map((member) => {
            const avatarUrl = getImageUrl(member.profile_image);
            const isActive =
              member.status === 1 ||
              member.status === "1" ||
              member.status === true ||
              member.status?.toString().toLowerCase() === "active";

            const total = Number(member.total_assigned) || 0;
            const won = Number(member.converted) || 0;
            const convRate = total > 0 ? Math.round((won / total) * 100) : 0;

            return (
              <Card
                key={member.id}
                elevation={0}
                sx={{
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.08)",
                    borderColor: "#CBD5E1",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.8, mb: 2 }}>
                    <Avatar
                      src={avatarUrl || undefined}
                      sx={{
                        width: 52,
                        height: 52,
                        backgroundColor: COLORS.primaryDark,
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        boxShadow: `0 4px 10px ${COLORS.primaryShadow}`,
                      }}
                    >
                      {getInitials(member.full_name)}
                    </Avatar>

                    <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.975rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {member.full_name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
                        <Chip
                          label={isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            backgroundColor: isActive ? "#DCFCE7" : "#FEE2E2",
                            color: isActive ? COLORS.success : COLORS.danger,
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            height: 20,
                            borderRadius: "4px",
                          }}
                        />
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.725rem" }}>
                          ID: #{String(member.id).padStart(4, "0")}
                        </Typography>
                      </Box>
                    </Box>

                    <Tooltip title="View Detailed Performance">
                      <IconButton size="small" onClick={() => handleOpenDetail(member)} sx={{ color: COLORS.primary }}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ backgroundColor: "#F8FAFC", p: 1.2, borderRadius: "8px", display: "flex", flexDirection: "column", gap: 0.8, mb: 2, border: "1px solid #F1F5F9" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: COLORS.textSecondary }}>
                      <MailOutlineOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.primary }} />
                      <Typography variant="caption" sx={{ fontWeight: 500, fontSize: "0.775rem", color: COLORS.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {member.email || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: COLORS.textSecondary }}>
                      <PhoneOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.primary }} />
                      <Typography variant="caption" sx={{ fontWeight: 500, fontSize: "0.775rem", color: COLORS.textPrimary }}>
                        {member.phone || "N/A"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Individual Progress Bar */}
                  <Box sx={{ mb: 1.8 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textSecondary }}>
                        CONVERSION EFFICIENCY
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 800, color: COLORS.primary }}>
                        {convRate}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={convRate}
                      sx={{ height: 5, borderRadius: 3, backgroundColor: "#E2E8F0", "& .MuiLinearProgress-bar": { backgroundColor: COLORS.primary } }}
                    />
                  </Box>

                  <Divider sx={{ mb: 1.8, borderColor: "#F1F5F9" }} />

                  {/* Stats Grid */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, textAlign: "center" }}>
                    <Paper elevation={0} sx={{ p: 1, bgcolor: "#F1F5F9", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                      <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 16, color: COLORS.textSecondary, mb: 0.2 }} />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", fontSize: "0.65rem", fontWeight: 600 }}>Total</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.875rem" }}>{member.total_assigned || 0}</Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1, bgcolor: "#DCFCE7", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
                      <TrendingUpOutlinedIcon sx={{ fontSize: 16, color: COLORS.success, mb: 0.2 }} />
                      <Typography variant="caption" sx={{ color: "#166534", display: "block", fontSize: "0.65rem", fontWeight: 600 }}>Won</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.success, fontSize: "0.875rem" }}>{member.converted || 0}</Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1, bgcolor: "#E0F2FE", borderRadius: "8px", border: "1px solid #BAE6FD" }}>
                      <GroupsOutlinedIcon sx={{ fontSize: 16, color: COLORS.info, mb: 0.2 }} />
                      <Typography variant="caption" sx={{ color: "#075985", display: "block", fontSize: "0.65rem", fontWeight: 600 }}>Active</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.info, fontSize: "0.875rem" }}>{member.in_progress || 0}</Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1, bgcolor: "#FEF3C7", borderRadius: "8px", border: "1px solid #FDE68A" }}>
                      <EventNoteOutlinedIcon sx={{ fontSize: 16, color: COLORS.warning, mb: 0.2 }} />
                      <Typography variant="caption" sx={{ color: "#92400E", display: "block", fontSize: "0.65rem", fontWeight: 600 }}>Today</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.warning, fontSize: "0.875rem" }}>{member.today_followups || 0}</Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* 5. INTERACTIVE SALES REP PERFORMANCE DIALOG */}
      <Dialog open={openModal} onClose={handleCloseDetail} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LeaderboardOutlinedIcon sx={{ color: COLORS.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "1.05rem" }}>
              Sales Representative Overview
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseDetail}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ py: 2 }}>
          {selectedMember && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Profile Header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, backgroundColor: "#F8FAFC", p: 2, borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <Avatar src={getImageUrl(selectedMember.profile_image) || undefined} sx={{ width: 60, height: 60, bgcolor: COLORS.primaryDark, fontWeight: 700, fontSize: "1.4rem" }}>
                  {getInitials(selectedMember.full_name)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.1rem" }}>
                    {selectedMember.full_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.825rem" }}>
                    {selectedMember.email} • {selectedMember.phone || "No Phone"}
                  </Typography>
                </Box>
              </Box>

              {/* Performance Breakdown Grid */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primaryDark }}>
                Detailed Lead Breakdown
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#F1F5F9", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>TOTAL ASSIGNED LEADS</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{selectedMember.total_assigned || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#DCFCE7", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
                  <Typography variant="caption" sx={{ color: "#166534", fontWeight: 600 }}>CONVERTED / WON</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.success }}>{selectedMember.converted || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#E0F2FE", borderRadius: "8px", border: "1px solid #BAE6FD" }}>
                  <Typography variant="caption" sx={{ color: "#075985", fontWeight: 600 }}>ACTIVE PIPELINE</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.info }}>{selectedMember.in_progress || 0}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#FEF3C7", borderRadius: "8px", border: "1px solid #FDE68A" }}>
                  <Typography variant="caption" sx={{ color: "#92400E", fontWeight: 600 }}>TODAY'S FOLLOW-UPS</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.warning }}>{selectedMember.today_followups || 0}</Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={handleCloseDetail} sx={{ backgroundColor: COLORS.primary, borderRadius: "8px", textTransform: "none", fontWeight: 600, "&:hover": { backgroundColor: COLORS.primaryDark } }}>
            Close Overview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamMembers;