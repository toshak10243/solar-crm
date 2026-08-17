import React, { useState, useEffect, useMemo } from "react";
import { getTeamMembers } from "../../services/userServices";
import { getTeamFollowupsList, addFollowup, getFollowups } from "../../services/leadService";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Avatar,
  Divider,
  InputAdornment,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";

// Icons
import EventNoteIcon from "@mui/icons-material/EventNote";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CloseIcon from "@mui/icons-material/Close";

// SBI theme
const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
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

const DEFAULT_REMARK = "No notes yet";

const TeamFollowups = () => {
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamFollowups, setTeamFollowups] = useState([]);

  // View Mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState("table");

  // Filters
  const [repFilter, setRepFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, OVERDUE, PENDING, COMPLETED
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals State
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newRemark, setNewRemark] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [saving, setSaving] = useState(false);

  // History Modal State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamRes, followupsRes] = await Promise.all([getTeamMembers(), getTeamFollowupsList()]);
      setTeamMembers(teamRes?.data || teamRes || []);
      setTeamFollowups(followupsRes?.data || followupsRes || []);
    } catch (err) {
      console.error("Error fetching follow-ups data:", err);
      showToast("Failed to sync team follow-ups.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  // Map backend shape -> display shape. No client-side extraction —
  // backend already returns phone, latest_remark and computed status.
  const followupsList = useMemo(() => {
    if (!Array.isArray(teamFollowups)) return [];

    return teamFollowups.map((item) => ({
      id: item.id,
      lead_code: item.lead_code,
      customer_name: item.customer_name,
      phone: item.phone || "N/A",
      assigned_to: item.assigned_to,
      assigned_to_name: item.assigned_to_name || "Unassigned",
      date: item.next_follow_up_date ? new Date(item.next_follow_up_date).toLocaleString() : "Not Scheduled",
      remarks: item.latest_remark || DEFAULT_REMARK,
      status: item.status, // OVERDUE / PENDING / COMPLETED — computed by backend
      lead_status: item.lead_status,
    }));
  }, [teamFollowups]);

  // Filtered Followups
  const processedFollowups = useMemo(() => {
    return followupsList.filter((item) => {
      const matchesRep = repFilter === "ALL" || Number(item.assigned_to) === Number(repFilter);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        item.customer_name?.toLowerCase().includes(query) ||
        item.lead_code?.toLowerCase().includes(query) ||
        item.phone?.includes(searchTerm);

      return matchesRep && matchesStatus && matchesSearch;
    });
  }, [followupsList, repFilter, statusFilter, searchTerm]);

  // Stats KPI
  const stats = useMemo(() => {
    const total = followupsList.length;
    const overdue = followupsList.filter((f) => f.status === "OVERDUE").length;
    const pending = followupsList.filter((f) => f.status === "PENDING").length;
    const completed = followupsList.filter((f) => f.status === "COMPLETED").length;
    return { total, overdue, pending, completed };
  }, [followupsList]);

  // Modal Handlers
  const handleOpenAddModal = (item) => {
    setSelectedItem(item);
    setNewRemark("");
    setNextDate("");
    setOpenAddModal(true);
  };

  const handleOpenHistoryModal = async (item) => {
    setSelectedItem(item);
    setOpenHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await getFollowups(item.id);
      setHistoryList(res?.data || res || []);
    } catch (err) {
      console.error("Error fetching follow-up history:", err);
      showToast("Failed to load follow-up history.", "error");
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistoryModal = () => {
    setOpenHistoryModal(false);
    setHistoryList([]);
  };

  const handleSaveFollowup = async () => {
    if (!newRemark.trim()) {
      showToast("Please write a quick remark or call summary.", "warning");
      return;
    }
    if (!selectedItem) return;

    setSaving(true);
    try {
      await addFollowup(selectedItem.id, {
        note: newRemark.trim(),
        followup_type: "Call",
        follow_up_date: nextDate || null,
      });
      showToast("Follow-up remark recorded successfully!");
      setOpenAddModal(false);
      fetchData();
    } catch (err) {
      console.error("Error saving follow-up:", err);
      showToast("Failed to save follow-up entry.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getStatusChipProps = (status) => {
    switch (status) {
      case "OVERDUE":
        return { label: "OVERDUE", icon: <WarningAmberIcon fontSize="small" />, bg: "#FEE2E2", text: COLORS.danger };
      case "COMPLETED":
        return { label: "COMPLETED", icon: <CheckCircleOutlinedIcon fontSize="small" />, bg: "#DCFCE7", text: COLORS.success };
      default:
        return { label: "PENDING", icon: <AccessTimeIcon fontSize="small" />, bg: "#FEF3C7", text: COLORS.warning };
    }
  };

  // Real notes render in quotes; the empty-state default reads as plain text, not a quote.
  const renderRemark = (remarks) => (remarks === DEFAULT_REMARK ? remarks : `"${remarks}"`);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh" }}>
      {/* 1. HEADER BANNER WITH TOGGLE */}
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
            <EventNoteIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.15rem" }}>
              Team Follow-ups Tracker
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.825rem", mt: 0.2 }}>
              Monitor overdue, upcoming, and completed follow-up activities across your team.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", width: { xs: "100%", md: "auto" }, justifyContent: "flex-end" }}>
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

          <Tooltip title="Refresh Timeline">
            <IconButton onClick={fetchData} color="primary" sx={{ backgroundColor: "#F1F5F9", border: `1px solid ${COLORS.border}` }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* 2. STATS KPI CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>
              TOTAL FOLLOW-UPS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
              {stats.total}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <Typography variant="caption" sx={{ color: COLORS.danger, fontWeight: 700 }}>
              OVERDUE / MISSED
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.danger, mt: 0.5 }}>
              {stats.overdue}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <Typography variant="caption" sx={{ color: COLORS.warning, fontWeight: 700 }}>
              UPCOMING / PENDING
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.warning, mt: 0.5 }}>
              {stats.pending}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 700 }}>
              COMPLETED
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.success, mt: 0.5 }}>
              {stats.completed}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 3. FILTERS BAR */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" }, gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search lead code, customer name, phone..."
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
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Sales Representative</InputLabel>
            <Select
              value={repFilter}
              label="Sales Representative"
              onChange={(e) => setRepFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Team Members</MenuItem>
              {teamMembers.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.full_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Follow-up Status</InputLabel>
            <Select
              value={statusFilter}
              label="Follow-up Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="OVERDUE">Overdue / Missed</MenuItem>
              <MenuItem value="PENDING">Pending / Upcoming</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 4. MAIN DATA DISPLAY */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: COLORS.primary }} size={36} />
        </Box>
      ) : processedFollowups.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: "center", border: `1px solid ${COLORS.border}`, borderRadius: "12px", backgroundColor: COLORS.card }}>
          <EventNoteIcon sx={{ fontSize: 44, color: "#94A3B8", mb: 1 }} />
          <Typography variant="h6" sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>
            No Follow-up Records Found
          </Typography>
        </Paper>
      ) : viewMode === "table" ? (
        /* TABLE VIEW LAYOUT */
        <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${COLORS.border}`, overflow: "hidden", backgroundColor: COLORS.card }}>
          <TableContainer>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Lead Info</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Scheduled Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Assigned Representative</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Latest Notes</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: COLORS.primaryDark }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedFollowups
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => {
                    const statusProps = getStatusChipProps(item.status);

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                            {item.customer_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                            {item.lead_code} • {item.phone}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                            📅 {item.date}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            avatar={<Avatar sx={{ width: 22, height: 22, fontSize: "0.65rem", bgcolor: COLORS.primaryDark }}>{getInitials(item.assigned_to_name)}</Avatar>}
                            label={item.assigned_to_name}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: "0.725rem", borderColor: COLORS.border }}
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            icon={statusProps.icon}
                            label={statusProps.label}
                            size="small"
                            sx={{
                              backgroundColor: statusProps.bg,
                              color: statusProps.text,
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              height: 22,
                              borderRadius: "4px",
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" noWrap sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, fontStyle: "italic" }}>
                            {renderRemark(item.remarks)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                            <Tooltip title="Add Manager Note">
                              <IconButton size="small" onClick={() => handleOpenAddModal(item)} sx={{ color: COLORS.primary }}>
                                <AddCommentOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Follow-up Timeline">
                              <IconButton size="small" onClick={() => handleOpenHistoryModal(item)} sx={{ color: COLORS.primary }}>
                                <HistoryOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={processedFollowups.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      ) : (
        /* CARD GRID VIEW LAYOUT */
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {processedFollowups.map((item) => {
            const statusProps = getStatusChipProps(item.status);

            return (
              <Card
                key={item.id}
                elevation={0}
                sx={{
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  borderLeft: `5px solid ${statusProps.text}`,
                  backgroundColor: COLORS.card,
                  transition: "all 0.2s ease",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 16px rgba(15,23,42,0.06)" },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <Avatar sx={{ bgcolor: COLORS.primaryDark, width: 34, height: 34, fontSize: "0.8rem", fontWeight: 700 }}>
                        {getInitials(item.customer_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                          {item.customer_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700 }}>
                          {item.lead_code}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      icon={statusProps.icon}
                      label={statusProps.label}
                      size="small"
                      sx={{
                        backgroundColor: statusProps.bg,
                        color: statusProps.text,
                        fontWeight: 800,
                        fontSize: "0.65rem",
                        height: 22,
                        borderRadius: "4px",
                      }}
                    />
                  </Box>

                  <Box sx={{ backgroundColor: "#F8FAFC", p: 1.2, borderRadius: "8px", mb: 2, border: "1px solid #F1F5F9" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <PhoneInTalkIcon sx={{ fontSize: 14, color: COLORS.primary }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                        {item.phone}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ display: "block", color: COLORS.textSecondary, fontWeight: 500 }}>
                      📅 Scheduled: <strong>{item.date}</strong>
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontStyle: "italic", fontSize: "0.825rem", mb: 2 }}>
                    {renderRemark(item.remarks)}
                  </Typography>

                  <Divider sx={{ mb: 1.5 }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <PersonOutlinedIcon sx={{ fontSize: 16, color: COLORS.primary }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.primaryDark }}>
                        {item.assigned_to_name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleOpenAddModal(item)} sx={{ color: COLORS.primary }}>
                        <AddCommentOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenHistoryModal(item)} sx={{ color: COLORS.primary }}>
                        <HistoryOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* 5. ADD FOLLOW-UP / NOTE MODAL */}
      <Dialog
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "14px", p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "1.05rem" }}>
          Log Manager Follow-up Remark
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: COLORS.textSecondary }}>
            Adding note for <strong>{selectedItem?.customer_name}</strong> ({selectedItem?.lead_code}).
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Manager Remark / Instruction *"
              multiline
              rows={3}
              fullWidth
              size="small"
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              placeholder="Enter call output or instructions for representative..."
            />

<TextField
  label="Reschedule Next Date (Optional)"
  type="date"
  fullWidth
  size="small"
  slotProps={{ inputLabel: { shrink: true } }}
  value={nextDate}
  onChange={(e) => setNextDate(e.target.value)}
/>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddModal(false)} sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveFollowup}
            disabled={saving}
            sx={{ backgroundColor: COLORS.primary, borderRadius: "8px", fontWeight: 700, textTransform: "none" }}
          >
            {saving ? "Saving..." : "Save Log"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. HISTORY TIMELINE MODAL */}
      <Dialog
        open={openHistoryModal}
        onClose={handleCloseHistoryModal}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "14px", p: 1 } } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, color: COLORS.primaryDark }}>
          Follow-up Audit Timeline
          <IconButton size="small" onClick={handleCloseHistoryModal}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2 }}>
          {selectedItem && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ backgroundColor: "#F8FAFC", p: 2, borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                  {selectedItem.customer_name} ({selectedItem.lead_code})
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  Assigned Rep: <strong>{selectedItem.assigned_to_name}</strong> • Phone: {selectedItem.phone}
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.primary }}>
                ACTIVITY LOGS & HISTORY
              </Typography>

              {historyLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={28} sx={{ color: COLORS.primary }} />
                </Box>
              ) : historyList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                    No follow-up entries logged for this lead yet.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    borderLeft: `2px solid ${COLORS.primary}`,
                    pl: 2,
                    ml: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    maxHeight: 340,
                    overflowY: "auto",
                  }}
                >
                  {historyList.map((entry) => (
                    <Box key={entry.id}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                        📅 {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
                        {entry.followup_type ? ` • ${entry.followup_type}` : ""}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary, mt: 0.2 }}>
                        "{entry.note}"
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                        {entry.status_after_followup && (
                          <Chip
                            label={`Status set: ${entry.status_after_followup}`}
                            size="small"
                            sx={{ fontSize: "0.65rem", fontWeight: 700 }}
                          />
                        )}
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                          Logged by {entry.created_by_name || "Unknown"}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={handleCloseHistoryModal} sx={{ backgroundColor: COLORS.primary, textTransform: "none", borderRadius: "8px" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST SNACKBAR */}
      <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
        <Alert severity={toast.severity} sx={{ borderRadius: "8px", fontWeight: 600 }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamFollowups;