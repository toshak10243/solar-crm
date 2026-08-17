import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Fade,
  LinearProgress,
} from "@mui/material";

// Material UI Icons
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import UpdateOutlinedIcon from "@mui/icons-material/UpdateOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CloseIcon from "@mui/icons-material/Close";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";

// Import Profile Services safely
import * as profileService from "../../services/profileService";

const { getProfile, updateProfile, changePassword, uploadProfilePhoto } = profileService;

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  hover: "#F1F5F9",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  info: "#0284C7",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const fieldSx = (readOnly) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: readOnly ? "#F8FAFC" : "#FFFFFF",
    height: "38px",
    fontSize: "0.825rem",
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: readOnly ? COLORS.border : "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontSize: "0.78rem", top: "-2px" },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
});

const cardSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "none",
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor: "#CBD5E1",
  },
};

const sectionTitleSx = {
  fontWeight: 800,
  color: COLORS.primaryDark,
  fontSize: "0.95rem",
  letterSpacing: "-0.2px",
};

const primaryButtonSx = {
  height: 34,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.8rem",
  px: 2,
  backgroundColor: COLORS.primary,
  boxShadow: "none",
  whiteSpace: "nowrap",
  transition: "all 0.2s ease",
  "&:hover": { backgroundColor: COLORS.primaryDark },
};

const outlinedButtonSx = {
  height: 34,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.8rem",
  px: 2,
  borderColor: COLORS.border,
  color: COLORS.textSecondary,
  whiteSpace: "nowrap",
  transition: "all 0.2s ease",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.hover },
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatEmpId = (id, code) => {
  if (code) return code;
  if (!id) return "EMP00001";
  return `EMP${String(id).padStart(5, "0")}`;
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "SE";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const SalesProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
  });
  const [basicInfoErrors, setBasicInfoErrors] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removingPhoto, setRemovingPhoto] = useState(false);

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

  const updateLocalStorageUser = (updated) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const newUser = {
        ...storedUser,
        full_name: updated.full_name ?? storedUser.full_name,
        username: updated.username ?? storedUser.username,
        email: updated.email ?? storedUser.email,
        phone: updated.phone ?? storedUser.phone,
        profile_image: updated.profile_image !== undefined ? updated.profile_image : null,
      };
      localStorage.setItem("user", JSON.stringify(newUser));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Failed to sync localStorage user object", e);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      const data = res?.data?.data || res?.data || res;
      setProfileData(data);

      setBasicInfoForm({
        full_name: data.full_name || "",
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
      });

      updateLocalStorageUser(data);
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to load profile details.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const isAccountActive = () => {
    if (!profileData) return false;
    const st = profileData.status;
    return st === 1 || st === "1" || st === true || st?.toString().toLowerCase() === "active";
  };

  const getImageUrl = (imgPath) => {
    if (photoPreview) return photoPreview;
    if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") return null;

    if (imgPath.startsWith("http")) {
      const cacheKey = profileData?.updated_at
        ? `?v=${new Date(profileData.updated_at).getTime()}`
        : `?v=${Date.now()}`;
      return `${imgPath}${cacheKey}`;
    }

    let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;

    if (!cleanPath.startsWith("uploads/profiles/")) {
      if (cleanPath.startsWith("uploads/")) {
        cleanPath = cleanPath.replace("uploads/", "uploads/profiles/");
      } else {
        cleanPath = `uploads/profiles/${cleanPath}`;
      }
    }

    const cacheKey = profileData?.updated_at
      ? `?v=${new Date(profileData.updated_at).getTime()}`
      : `?v=${Date.now()}`;

    return `${API_BASE_URL}/${cleanPath}${cacheKey}`;
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/)) {
      showNotification("Please upload a valid image (JPG, JPEG, PNG, WEBP).", "warning");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification("Image size must be under 2MB.", "warning");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    const formData = new FormData();
    formData.append("profile_image", file);

    try {
      setPhotoUploading(true);
      const res = await uploadProfilePhoto(formData);
      const updatedData = res?.data?.data || res?.data || {};

      showNotification("Profile photo updated successfully!", "success");
      setPhotoPreview(null);
      
      if (updatedData.profile_image) {
        updateLocalStorageUser({ profile_image: updatedData.profile_image });
      }
      await fetchProfile();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to upload photo.",
        "error"
      );
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setRemovingPhoto(true);

      if (typeof profileService.removeProfilePhoto === "function") {
        await profileService.removeProfilePhoto();
      } else {
        await updateProfile({
          id: profileData.id,
          full_name: profileData.full_name,
          username: profileData.username,
          email: profileData.email,
          phone: profileData.phone,
          profile_image: null,
        });
      }

      setPhotoPreview(null);
      setProfileData((prev) => ({
        ...prev,
        profile_image: null,
      }));

      updateLocalStorageUser({ profile_image: null });
      showNotification("Profile photo removed successfully!", "success");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to remove photo.",
        "error"
      );
    } finally {
      setRemovingPhoto(false);
    }
  };

  const validateBasicInfo = () => {
    const errors = {};
    if (!basicInfoForm.full_name.trim()) errors.full_name = "Full Name is required";
    if (!basicInfoForm.username.trim()) errors.username = "Username is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicInfoForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(basicInfoForm.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!basicInfoForm.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    setBasicInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBasicInfo = async () => {
    if (!validateBasicInfo()) return;

    try {
      setSavingInfo(true);
      const res = await updateProfile({
        id: profileData.id,
        full_name: basicInfoForm.full_name,
        username: basicInfoForm.username,
        email: basicInfoForm.email,
        phone: basicInfoForm.phone,
      });

      const updated = res?.data?.data || res?.data || basicInfoForm;
      updateLocalStorageUser(updated);

      showNotification("Profile details saved successfully!", "success");
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to update profile.",
        "error"
      );
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setBasicInfoErrors({});
    if (profileData) {
      setBasicInfoForm({
        full_name: profileData.full_name || "",
        username: profileData.username || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
      });
    }
  };

  const validatePassword = () => {
    const errors = {};
    const pass = passwordForm.new_password;

    if (!passwordForm.current_password) {
      errors.current_password = "Current password is required";
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/]).{8,}$/;

    if (!pass) {
      errors.new_password = "New password is required";
    } else if (!strongRegex.test(pass)) {
      errors.new_password = "Must contain 8+ chars, uppercase, lowercase, number & special char";
    }

    if (!passwordForm.confirm_password) {
      errors.confirm_password = "Confirm password is required";
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) return;

    try {
      setUpdatingPassword(true);
      // Backend safe payload - current_password, old_password aur confirm_password sabhi send honge
      await changePassword({
        current_password: passwordForm.current_password,
        old_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });

      showNotification("Password updated successfully!", "success");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordErrors({});
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to update password.",
        "error"
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress sx={{ color: COLORS.primary }} size={38} thickness={4} />
      </Box>
    );
  }

  const currentPhotoUrl = getImageUrl(profileData?.profile_image);
  const hasPhoto = Boolean(currentPhotoUrl);
  const activeStatus = isAccountActive();

  return (
    <Box sx={{ width: "100%", backgroundColor: COLORS.bg, minHeight: "100vh", p: { xs: 2, md: 3 }, boxSizing: "border-box" }}>
      <Box sx={{ width: "100%" }}>
        
        {/* TOP ROW */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5, mb: 2.5 }}>
          
          {/* PROFILE CARD */}
          <Fade in timeout={400}>
            <Paper elevation={0} sx={{ ...cardSx, height: "100%", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box>
                <Box sx={{ position: "relative", display: "inline-block", mb: 1, mt: 0.5 }}>
                  <Avatar
                    key={currentPhotoUrl || "initials"}
                    src={currentPhotoUrl || undefined}
                    sx={{
                      width: 96,
                      height: 96,
                      fontSize: "2.2rem",
                      fontWeight: 800,
                      backgroundColor: COLORS.primaryDark,
                      color: "#FFFFFF",
                      boxShadow: "0 4px 14px rgba(11, 58, 99, 0.15)",
                      border: "3px solid #FFFFFF",
                      outline: `1px solid ${COLORS.border}`,
                      mx: "auto",
                    }}
                  >
                    {getInitials(profileData?.full_name)}
                  </Avatar>

                  <IconButton
                    component="label"
                    disabled={photoUploading}
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      backgroundColor: COLORS.primary,
                      color: "#FFFFFF",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      "&:hover": { backgroundColor: COLORS.primaryDark },
                      width: 30,
                      height: 30,
                    }}
                  >
                    {photoUploading ? (
                      <CircularProgress size={14} sx={{ color: "#FFFFFF" }} />
                    ) : (
                      <PhotoCameraOutlinedIcon sx={{ fontSize: "0.95rem" }} />
                    )}
                    <input type="file" hidden accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handlePhotoChange} />
                  </IconButton>
                </Box>

                {photoUploading && (
                  <LinearProgress
                    sx={{
                      mb: 1,
                      borderRadius: 4,
                      height: 3,
                      backgroundColor: "#E2E8F0",
                      "& .MuiLinearProgress-bar": { backgroundColor: COLORS.primary },
                    }}
                  />
                )}

                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.05rem", lineHeight: 1.2 }}>
                  {profileData?.full_name}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.78rem", mb: 1 }}>
                  @{profileData?.username}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 1.5 }}>
                  <Chip
                    label={profileData?.role_name?.toUpperCase() || "SALES EXECUTIVE"}
                    size="small"
                    sx={{
                      backgroundColor: "#E6F0FA",
                      color: COLORS.primary,
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      borderRadius: "5px",
                      height: 22,
                    }}
                  />
                  <Chip
                    label={activeStatus ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      backgroundColor: activeStatus ? "#DCFCE7" : "#FEE2E2",
                      color: activeStatus ? COLORS.success : COLORS.danger,
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      borderRadius: "5px",
                      height: 22,
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mb: 1.5 }}>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={photoUploading ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <PhotoCameraOutlinedIcon sx={{ fontSize: "0.95rem" }} />}
                    disabled={photoUploading}
                    sx={{ ...primaryButtonSx, minWidth: "120px" }}
                  >
                    Upload Photo
                    <input type="file" hidden accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handlePhotoChange} />
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={removingPhoto ? <CircularProgress size={14} sx={{ color: COLORS.danger }} /> : <DeleteOutlineOutlinedIcon sx={{ fontSize: "0.95rem" }} />}
                    onClick={handleRemovePhoto}
                    disabled={!hasPhoto || removingPhoto || photoUploading}
                    sx={{
                      ...outlinedButtonSx,
                      minWidth: "100px",
                      color: COLORS.danger,
                      borderColor: "#FCA5A5",
                      "&:hover": { borderColor: COLORS.danger, backgroundColor: "#FEF2F2" },
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>

              <Box>
                <Divider sx={{ mb: 1.5, borderColor: "#F1F5F9" }} />

                <Box sx={{ display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: 1, textAlign: "left" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <MailOutlineOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.primary }} />
                    <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: "0.78rem" }}>
                      {profileData?.email || "N/A"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <PhoneOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.primary }} />
                    <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: "0.78rem" }}>
                      {profileData?.phone || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Fade>

          {/* TIMELINE CARD */}
          <Fade in timeout={500}>
            <Paper elevation={0} sx={{ ...cardSx, height: "100%", display: "flex", flexDirection: "column", width: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <HistoryOutlinedIcon sx={{ color: COLORS.primaryDark, fontSize: "1.2rem" }} />
                <Typography sx={sectionTitleSx}>Account Activity Timeline</Typography>
              </Box>

              <Divider sx={{ mb: 1.5, borderColor: "#F1F5F9" }} />

              <Box sx={{ position: "relative", pl: 0.5, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", width: "100%" }}>
                {[
                  {
                    icon: <PersonAddAltOutlinedIcon sx={{ fontSize: "1.05rem" }} />,
                    label: "Account Created",
                    description: "Initial profile registration and role assignment.",
                    date: formatDate(profileData?.created_at),
                    color: COLORS.primary,
                  },
                  {
                    icon: <UpdateOutlinedIcon sx={{ fontSize: "1.05rem" }} />,
                    label: "Last Profile Update",
                    description: "Contact details and avatar information synced.",
                    date: formatDate(profileData?.updated_at),
                    color: "#D97706",
                  },
                  {
                    icon: <LoginOutlinedIcon sx={{ fontSize: "1.05rem" }} />,
                    label: "Last Login Session",
                    description: "Logged in via authenticated Solar CRM portal.",
                    date: formatDate(profileData?.last_login),
                    color: COLORS.success,
                  },
                ].map((item, idx, arr) => (
                  <Box key={item.label} sx={{ display: "flex", gap: 2, position: "relative", my: 0.5, width: "100%" }}>
                    {idx !== arr.length - 1 && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: 17,
                          top: 32,
                          bottom: -20,
                          width: "2px",
                          backgroundColor: "#E2E8F0",
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                        flexShrink: 0,
                        zIndex: 1,
                        border: `1px solid ${item.color}30`,
                      }}
                    >
                      {item.icon}
                    </Box>

                    <Box sx={{ flexGrow: 1, width: "100%" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.825rem" }}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, backgroundColor: "#F1F5F9", px: 1, py: 0.2, borderRadius: "4px", fontSize: "0.72rem" }}>
                          {item.date}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.2, display: "block", fontSize: "0.75rem" }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Fade>
        </Box>

        {/* BOTTOM ROW */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" }, gap: 2.5 }}>
          
          {/* BASIC INFO */}
          <Fade in timeout={400}>
            <Paper elevation={0} sx={cardSx}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <PersonOutlineOutlinedIcon sx={{ color: COLORS.primaryDark, fontSize: "1.1rem" }} />
                  <Typography sx={sectionTitleSx}>Basic Information</Typography>
                </Box>

                {!isEditing ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlinedIcon sx={{ fontSize: "0.9rem" }} />}
                    onClick={() => setIsEditing(true)}
                    sx={{ ...outlinedButtonSx, height: 30, fontSize: "0.75rem", px: 1.5, color: COLORS.primary, borderColor: COLORS.primary, "&:hover": { backgroundColor: "#E6F0FA" } }}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelOutlinedIcon sx={{ fontSize: "0.9rem" }} />}
                      onClick={handleCancelEdit}
                      disabled={savingInfo}
                      sx={{ ...outlinedButtonSx, height: 30, fontSize: "0.75rem", px: 1.2 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={savingInfo ? <CircularProgress size={12} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon sx={{ fontSize: "0.9rem" }} />}
                      onClick={handleSaveBasicInfo}
                      disabled={savingInfo}
                      sx={{ ...primaryButtonSx, height: 30, fontSize: "0.75rem", px: 1.5 }}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 1.5, borderColor: "#F1F5F9" }} />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={formatEmpId(profileData?.id, profileData?.employee_code || profileData?.employee_id)}
                  disabled
                  size="small"
                  sx={fieldSx(true)}
                />

                <TextField
                  fullWidth
                  label="Full Name"
                  value={basicInfoForm.full_name}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, full_name: e.target.value })}
                  disabled={!isEditing}
                  error={Boolean(basicInfoErrors.full_name)}
                  helperText={basicInfoErrors.full_name}
                  size="small"
                  sx={fieldSx(!isEditing)}
                />

                <TextField
                  fullWidth
                  label="Username"
                  value={basicInfoForm.username}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, username: e.target.value })}
                  disabled={!isEditing}
                  error={Boolean(basicInfoErrors.username)}
                  helperText={basicInfoErrors.username}
                  size="small"
                  sx={fieldSx(!isEditing)}
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  value={basicInfoForm.email}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, email: e.target.value })}
                  disabled={!isEditing}
                  error={Boolean(basicInfoErrors.email)}
                  helperText={basicInfoErrors.email}
                  size="small"
                  sx={fieldSx(!isEditing)}
                />

                <TextField
                  fullWidth
                  label="Phone Number"
                  value={basicInfoForm.phone}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, phone: e.target.value })}
                  disabled={!isEditing}
                  error={Boolean(basicInfoErrors.phone)}
                  helperText={basicInfoErrors.phone}
                  size="small"
                  sx={fieldSx(!isEditing)}
                />

                <TextField
                  fullWidth
                  label="Role"
                  value={profileData?.role_name || "Sales Executive"}
                  disabled
                  size="small"
                  sx={fieldSx(true)}
                />

                <TextField
                  fullWidth
                  label="Status"
                  value={activeStatus ? "Active" : "Inactive"}
                  disabled
                  size="small"
                  sx={fieldSx(true)}
                />
              </Box>
            </Paper>
          </Fade>

          {/* SECURITY & PASSWORD */}
          <Fade in timeout={500}>
            <Paper elevation={0} sx={cardSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
                <SecurityOutlinedIcon sx={{ color: COLORS.primaryDark, fontSize: "1.1rem" }} />
                <Typography sx={sectionTitleSx}>Security & Password</Typography>
              </Box>

              <Divider sx={{ mb: 1.5, borderColor: "#F1F5F9" }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  error={Boolean(passwordErrors.current_password)}
                  helperText={passwordErrors.current_password}
                  size="small"
                  sx={fieldSx(false)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton edge="end" onClick={() => setShowCurrentPassword((prev) => !prev)}>
                            {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    error={Boolean(passwordErrors.new_password)}
                    helperText={passwordErrors.new_password}
                    size="small"
                    sx={fieldSx(false)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton edge="end" onClick={() => setShowNewPassword((prev) => !prev)}>
                              {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    error={Boolean(passwordErrors.confirm_password)}
                    helperText={passwordErrors.confirm_password}
                    size="small"
                    sx={fieldSx(false)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton edge="end" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                              {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={updatingPassword ? <CircularProgress size={12} sx={{ color: "#FFF" }} /> : <LockResetOutlinedIcon sx={{ fontSize: "0.9rem" }} />}
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                  sx={{ ...primaryButtonSx, height: 32, fontSize: "0.78rem" }}
                >
                  Update Password
                </Button>
              </Box>
            </Paper>
          </Fade>
        </Box>

        {/* TOAST SYSTEM */}
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
              fontSize: "0.8rem",
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

export default SalesProfile;