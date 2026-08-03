import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword, forgotPassword } from "../../services/authService";
import { isLoggedIn } from "../../utils/auth";

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  Alert,
  Fade,
  Link,
  Snackbar,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

import logo from "../../assets/images/logo.png";
import loginBanner from "../../assets/images/login-banner.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Read from location.state OR fallback to sessionStorage
  const loginIdentifier = location.state?.login || sessionStorage.getItem("reset_login") || "";

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/dashboard");
    }
    if (!loginIdentifier) {
      navigate("/forgot-password");
    }
  }, [navigate, loginIdentifier]);

  // Form States
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Resend Timer State (60 Seconds)
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Snackbar Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Live Password Mismatch Check Logic
  const isPasswordMismatch = Boolean(
    confirmPassword && newPassword !== confirmPassword
  );

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // OTP Change Handler (Numbers Only & Max Length 4)
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setOtp(value);
    }
  };

  // Resend OTP Action
  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      setResendLoading(true);
      setError("");

      const res = await forgotPassword({ login: loginIdentifier });

      setToastMsg(res.data.message || "New OTP sent successfully!");
      setToastOpen(true);

      setTimer(60);
      setCanResend(false);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Failed to resend OTP.");
      } else {
        setError("Server not responding.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  // Submit Reset Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim() || !newPassword || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (otp.length !== 4) {
      setError("Please enter a valid 4-digit OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await resetPassword({
        login: loginIdentifier,
        otp: otp.trim(),
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });

      sessionStorage.removeItem("reset_login");
      setSuccess(res.data.message || "Password updated successfully!");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Failed to reset password.");
      } else {
        setError("Server not responding.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        backgroundColor: "#0F172A",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
      }}
    >
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" sx={{ width: "100%", borderRadius: 2 }}>
          {toastMsg}
        </Alert>
      </Snackbar>

      {/* LEFT SECTION */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 4, lg: 6 },
          overflow: "hidden",
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.95) 100%), url(${loginBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, zIndex: 2 }}>
          <Box component="img" src={logo} alt="Enterprise Logo" sx={{ height: { md: 52, lg: 60 }, width: "auto" }} />
        </Box>

        <Box sx={{ maxWidth: 520, zIndex: 2, my: "auto" }}>
          <Typography variant="caption" sx={{ color: "#38BDF8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>
            Finalize Reset
          </Typography>
          <Typography variant="h3" sx={{ color: "#FFFFFF", fontWeight: 700, mt: 1.5, mb: 2, lineHeight: 1.2 }}>
            Set your new strong password.
          </Typography>
          <Typography variant="body1" sx={{ color: "#94A3B8", lineHeight: 1.6, mb: 4 }}>
            Enter the OTP code sent to your account and choose a new secure password.
          </Typography>
        </Box>

        <Box sx={{ zIndex: 2 }}>
          <Typography variant="caption" sx={{ color: "#64748B" }}>
            © {new Date().getFullYear()} Solar CRM Inc. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* RIGHT SECTION */}
      <Box
        sx={{
          width: { xs: "100%", md: "520px", lg: "580px" },
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { xs: 3, sm: 6, md: 6, lg: 8 },
          overflowY: "auto",
        }}
      >
        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", mb: 4 }}>
          <Box component="img" src={logo} alt="Enterprise Logo" sx={{ height: 48, width: "auto" }} />
        </Box>

        <Box sx={{ width: "100%", maxWidth: 400, mx: "auto", my: "auto" }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#0F172A", mb: 1 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Please enter your OTP and choose a new password.
            </Typography>
          </Box>

          {error && (
            <Fade in={Boolean(error)}>
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}

          {success && (
            <Fade in={Boolean(success)}>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {success}
              </Alert>
            </Fade>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* OTP Input */}
            <Box sx={{ mb: 2.5 }}>
              <Typography component="label" sx={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", mb: 1 }}>
                OTP Verification Code
              </Typography>
              <TextField
                id="otp-input"
                fullWidth
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={handleOtpChange}
                disabled={loading}
                variant="outlined"
                slotProps={{
                  htmlInput: {
                    maxLength: 4,
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    "& fieldset": { borderColor: "#E2E8F0" },
                    "&.Mui-focused fieldset": { borderColor: "#2563EB" },
                  },
                }}
              />

              {/* Resend OTP */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.8125rem" }}>
                  Didn't receive OTP?
                </Typography>
                {canResend ? (
                  <Link
                    component="button"
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    underline="hover"
                    sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#2563EB", cursor: "pointer" }}
                  >
                    {resendLoading ? "Sending..." : "Resend OTP"}
                  </Link>
                ) : (
                  <Typography variant="caption" sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#94A3B8" }}>
                    Resend in 00:{timer < 10 ? `0${timer}` : timer}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* New Password */}
            <Box sx={{ mb: 2.5 }}>
              <Typography component="label" sx={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", mb: 1 }}>
                New Password
              </Typography>
              <TextField
                id="new-password-input"
                fullWidth
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small" sx={{ color: "#64748B" }}>
                        {showNewPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    "& fieldset": { borderColor: "#E2E8F0" },
                    "&.Mui-focused fieldset": { borderColor: "#2563EB" },
                  },
                }}
              />
            </Box>

            {/* Confirm New Password (WITH LIVE VALIDATION) */}
            <Box sx={{ mb: 3 }}>
              <Typography component="label" sx={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", mb: 1 }}>
                Confirm New Password
              </Typography>
              <TextField
                id="confirm-password-input"
                fullWidth
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                variant="outlined"
                error={isPasswordMismatch}
                helperText={isPasswordMismatch ? "Passwords do not match" : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: isPasswordMismatch ? "#EF4444" : "#94A3B8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" sx={{ color: "#64748B" }}>
                        {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    "& fieldset": { borderColor: isPasswordMismatch ? "#EF4444" : "#E2E8F0" },
                    "&.Mui-focused fieldset": { borderColor: isPasswordMismatch ? "#EF4444" : "#2563EB" },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#EF4444",
                    fontSize: "0.75rem",
                    mt: 0.5,
                    ml: 0,
                    fontWeight: 500,
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              disabled={loading || isPasswordMismatch}
              variant="contained"
              disableElevation
              sx={{ py: 1.5, backgroundColor: "#2563EB", fontWeight: 600, borderRadius: "8px", textTransform: "none" }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#FFFFFF" }} /> : "Reset Password"}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/")}
              underline="hover"
              sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748B", display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Sign In
            </Link>
          </Box>

          <Divider sx={{ my: 4, borderColor: "#F1F5F9" }} />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: "#64748B" }}>
            <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
              Protected by Enterprise Security Policies
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;