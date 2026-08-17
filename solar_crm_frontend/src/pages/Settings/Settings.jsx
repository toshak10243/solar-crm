import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  MenuItem,
  Divider,
  Snackbar,
  Alert,
  Slide,
  CircularProgress,
  IconButton,
  Avatar,
  Badge,
} from "@mui/material";

// Icons
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CloseIcon from "@mui/icons-material/Close";

// Import Settings Service APIs
import {
  getSettings,
  updateSettings,
  uploadCompanyLogo,
} from "../../services/settingsService";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  info: "#0284C7",
};

const SlideTransition = (props) => <Slide {...props} direction="left" />;

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    height: "38px",
    fontSize: "0.85rem",
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: "#94A3B8" },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontSize: "0.8rem", top: "-2px" },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
};

const cardSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: "14px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
};

const sectionTitleSx = {
  fontWeight: 700,
  color: COLORS.primaryDark,
  fontSize: "1rem",
  letterSpacing: "-0.2px",
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Settings State Schema
  const [settings, setSettings] = useState({
    company_name: "",
    company_logo: "",
    company_email: "",
    company_phone: "",
    website: "",

    gst_number: "",
    pan_number: "",

    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",

    currency: "INR",
    timezone: "Asia/Kolkata",
    date_format: "DD/MM/YYYY",

    smtp_host: "",
    smtp_port: "",
    smtp_username: "",
    smtp_password: "",
    smtp_encryption: "TLS",

    session_timeout: 30,
    password_expiry_days: 90,
    otp_length: 4,

    enable_2fa: false,
    strong_password: true,

    email_notifications: true,
    lead_notifications: true,
    weekly_reports: false,
    system_notifications: true,

    backup_frequency: "Daily",
    backup_retention_days: 30,
  });

  // Toast System
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 1️⃣ Fetch Settings from Backend API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      const data = res?.data?.data || res?.data || {};

      setSettings((prev) => ({
        ...prev,
        ...data,
        enable_2fa: Boolean(data.enable_2fa),
        strong_password: Boolean(data.strong_password),
        email_notifications: Boolean(data.email_notifications),
        lead_notifications: Boolean(data.lead_notifications),
        weekly_reports: Boolean(data.weekly_reports),
        system_notifications: Boolean(data.system_notifications),
      }));
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to load system settings.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Universal Field Change Handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 2️⃣ Save Settings API Handler
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(settings);
      showNotification("Settings updated successfully.", "success");
      await fetchSettings();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to update settings.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // 3️⃣ Company Logo Upload Handler
  const handleLogoUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/)) {
        showNotification("Allowed logo formats: JPG, JPEG, PNG, WEBP", "warning");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showNotification("Logo file size must be under 2MB", "warning");
        return;
      }

      const formData = new FormData();
      formData.append("company_logo", file);

      setUploadingLogo(true);
      await uploadCompanyLogo(formData);
      showNotification("Company logo uploaded successfully!", "success");
      await fetchSettings();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to upload company logo.",
        "error"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  // Dynamic Company Logo URL Resolver
  const logoUrl = settings.company_logo
    ? settings.company_logo.startsWith("http")
      ? settings.company_logo
      : `${API_BASE_URL}/uploads/company/${settings.company_logo}?v=${Date.now()}`
    : null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress sx={{ color: COLORS.primary }} size={38} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", backgroundColor: COLORS.bg, minHeight: "100vh", p: { xs: 2, md: 2.5 } }}>
      <Box sx={{ width: "100%", mx: "auto" }}>
        
        {/* HEADER & TABS BAR */}
        <Paper elevation={0} sx={{ ...cardSx, mb: 2.5, p: 0, overflow: "hidden" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1, backgroundColor: "#FFFFFF" }}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  minHeight: 48,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": { color: COLORS.primary },
                },
                "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, height: 3 },
              }}
            >
              <Tab icon={<BusinessOutlinedIcon sx={{ fontSize: "1.1rem" }} />} iconPosition="start" label="General & Company" />
              <Tab icon={<EmailOutlinedIcon sx={{ fontSize: "1.1rem" }} />} iconPosition="start" label="SMTP & Email" />
              <Tab icon={<SecurityOutlinedIcon sx={{ fontSize: "1.1rem" }} />} iconPosition="start" label="Security & Auth" />
              <Tab icon={<NotificationsNoneOutlinedIcon sx={{ fontSize: "1.1rem" }} />} iconPosition="start" label="Notifications" />
              <Tab icon={<StorageOutlinedIcon sx={{ fontSize: "1.1rem" }} />} iconPosition="start" label="Backup & Storage" />
            </Tabs>
          </Box>
        </Paper>

        {/* TAB 0: GENERAL & COMPANY SETTINGS */}
        {activeTab === 0 && (
          <Paper elevation={0} sx={cardSx}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography sx={sectionTitleSx}>Company Details & Branding</Typography>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  height: 36,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.825rem",
                  px: 2.5,
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                Save Settings
              </Button>
            </Box>
            <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

            {/* Company Logo Upload Box */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3, p: 2, backgroundColor: "#F8FAFC", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                badgeContent={
                  <IconButton
                    component="label"
                    disabled={uploadingLogo}
                    sx={{
                      backgroundColor: COLORS.primary,
                      color: "#FFFFFF",
                      width: 28,
                      height: 28,
                      "&:hover": { backgroundColor: COLORS.primaryDark },
                    }}
                  >
                    {uploadingLogo ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <PhotoCameraOutlinedIcon sx={{ fontSize: "0.9rem" }} />}
                    <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                  </IconButton>
                }
              >
                <Avatar
                  src={logoUrl || undefined}
                  variant="rounded"
                  sx={{ width: 64, height: 64, backgroundColor: COLORS.primaryDark, fontWeight: 700, borderRadius: "10px" }}
                >
                  {settings.company_name ? settings.company_name.substring(0, 2).toUpperCase() : "CRM"}
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                  Company Logo
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  Upload JPEG, PNG, or WEBP logo (Max 2MB). Used across invoices & portal header.
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="company_name"
                  value={settings.company_name}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Email"
                  name="company_email"
                  value={settings.company_email}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Phone"
                  name="company_phone"
                  value={settings.company_phone}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Website URL"
                  name="website"
                  value={settings.website}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GST Number"
                  name="gst_number"
                  value={settings.gst_number}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="PAN Number"
                  name="pan_number"
                  value={settings.pan_number}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="address"
                  value={settings.address}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={settings.city}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={settings.state}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={settings.country}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Pincode"
                  name="pincode"
                  value={settings.pincode}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  name="currency"
                  value={settings.currency || "INR"}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                >
                  <MenuItem value="INR">INR (₹)</MenuItem>
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Timezone"
                  name="timezone"
                  value={settings.timezone || "Asia/Kolkata"}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                >
                  <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Date Format"
                  name="date_format"
                  value={settings.date_format || "DD/MM/YYYY"}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                >
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 1: SMTP & EMAIL CONFIGURATION */}
        {activeTab === 1 && (
          <Paper elevation={0} sx={cardSx}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography sx={sectionTitleSx}>SMTP Email Gateway Setup</Typography>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  height: 36,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.825rem",
                  px: 2.5,
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                Save Settings
              </Button>
            </Box>
            <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  name="smtp_host"
                  value={settings.smtp_host}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                  placeholder="smtp.gmail.com"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="SMTP Port"
                  name="smtp_port"
                  value={settings.smtp_port}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                  placeholder="587 / 465"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SMTP Username"
                  name="smtp_username"
                  value={settings.smtp_username}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SMTP Password / App Password"
                  type="password"
                  name="smtp_password"
                  value={settings.smtp_password}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Encryption Type"
                  name="smtp_encryption"
                  value={settings.smtp_encryption || "TLS"}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                >
                  <MenuItem value="TLS">TLS</MenuItem>
                  <MenuItem value="SSL">SSL</MenuItem>
                  <MenuItem value="NONE">NONE</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 2: SECURITY & AUTHENTICATION */}
        {activeTab === 2 && (
          <Paper elevation={0} sx={cardSx}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography sx={sectionTitleSx}>Security & Authentication Rules</Typography>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  height: 36,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.825rem",
                  px: 2.5,
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                Save Settings
              </Button>
            </Box>
            <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Session Timeout (Minutes)"
                  type="number"
                  name="session_timeout"
                  value={settings.session_timeout}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Password Expiry Days"
                  type="number"
                  name="password_expiry_days"
                  value={settings.password_expiry_days}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="OTP Length"
                  type="number"
                  name="otp_length"
                  value={settings.otp_length}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="enable_2fa"
                      checked={Boolean(settings.enable_2fa)}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>Enforce Two-Factor Authentication (2FA)</Typography>}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="strong_password"
                      checked={Boolean(settings.strong_password)}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>Enforce Strong Password Policy</Typography>}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === 3 && (
          <Paper elevation={0} sx={cardSx}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography sx={sectionTitleSx}>Notification Preferences</Typography>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  height: 36,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.825rem",
                  px: 2.5,
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                Save Settings
              </Button>
            </Box>
            <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="email_notifications"
                      checked={Boolean(settings.email_notifications)}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>Email Notifications</Typography>}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="lead_notifications"
                      checked={Boolean(settings.lead_notifications)}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>Lead Assignment Alerts</Typography>}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="weekly_reports"
                      checked={Boolean(settings.weekly_reports)}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>Weekly Digest Reports</Typography>}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="system_notifications"
                      checked={Boolean(settings.system_notifications)}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>System Alert Toast Messages</Typography>}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 4: BACKUP & STORAGE */}
        {activeTab === 4 && (
          <Paper elevation={0} sx={cardSx}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography sx={sectionTitleSx}>Automated Database Backup Rules</Typography>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  height: 36,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.825rem",
                  px: 2.5,
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                Save Settings
              </Button>
            </Box>
            <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Automated Backup Frequency"
                  name="backup_frequency"
                  value={settings.backup_frequency || "Daily"}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                >
                  <MenuItem value="Daily">Daily Backup</MenuItem>
                  <MenuItem value="Weekly">Weekly Backup</MenuItem>
                  <MenuItem value="Monthly">Monthly Backup</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Backup Retention Days"
                  type="number"
                  name="backup_retention_days"
                  value={settings.backup_retention_days}
                  onChange={handleChange}
                  size="small"
                  sx={fieldSx}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TOAST SYSTEM */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          TransitionComponent={SlideTransition}
          sx={{ mt: 2 }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            variant="filled"
            iconMapping={{
              success: <CheckCircleOutlineOutlinedIcon fontSize="inherit" />,
              error: <ErrorOutlineOutlinedIcon fontSize="inherit" />,
              warning: <WarningAmberOutlinedIcon fontSize="inherit" />,
              info: <InfoOutlinedIcon fontSize="inherit" />,
            }}
            action={
              <IconButton size="small" onClick={handleSnackbarClose} sx={{ color: "#FFFFFF" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{
              minWidth: 280,
              borderRadius: "8px",
              fontWeight: 600,
              alignItems: "center",
              boxShadow: "0 6px 20px rgba(15, 23, 42, 0.15)",
              backgroundColor:
                snackbar.severity === "success"
                  ? COLORS.success
                  : snackbar.severity === "error"
                  ? COLORS.danger
                  : snackbar.severity === "warning"
                  ? COLORS.warning
                  : COLORS.info,
              color: "#FFFFFF",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </Box>
  );
};

export default Settings;