import React, { useState, useEffect, useRef } from "react";
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
  Paper,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
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
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

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

  // HOTSTAR-STYLE BLOCK OTP HANDLERS
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only numbers allowed

    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1); // Single character
    setOtpValues(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pastedData) return;

    const newOtp = ["", "", "", ""];
    pastedData.split("").forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtpValues(newOtp);

    // Focus last filled box or next empty box
    const nextFocusIndex = Math.min(pastedData.length, 3);
    inputRefs.current[nextFocusIndex]?.focus();
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
      setOtpValues(["", "", "", ""]);
      inputRefs.current[0]?.focus();
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

    const fullOtp = otpValues.join("");

    if (!fullOtp || !newPassword || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (fullOtp.length !== 4) {
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
        otp: fullOtp,
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
        maxHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%), url(${loginBanner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        p: 2,
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

      {/* CENTERED CARD */}
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: "410px",
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          p: { xs: 2.5, sm: 3 },
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* LOGO */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
          <Box
            component="img"
            src={logo}
            alt="Enterprise Logo"
            sx={{
              height: 40,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* HEADER */}
        <Box sx={{ mb: 1.8, textAlign: "center" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.02em",
              fontSize: "1.2rem",
              lineHeight: 1.2,
            }}
          >
            Reset Password
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.8rem", mt: 0.3 }}>
            Enter 4-digit OTP and set a new password.
          </Typography>
        </Box>

        {error && (
          <Fade in={Boolean(error)}>
            <Alert severity="error" sx={{ mb: 1.5, py: 0.2, px: 1, borderRadius: 1.5, fontSize: "0.78rem" }}>
              {error}
            </Alert>
          </Fade>
        )}

        {success && (
          <Fade in={Boolean(success)}>
            <Alert severity="success" sx={{ mb: 1.5, py: 0.2, px: 1, borderRadius: 1.5, fontSize: "0.78rem" }}>
              {success}
            </Alert>
          </Fade>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* HOTSTAR-STYLE OTP BLOCKS */}
          <Box sx={{ mb: 1.5 }}>
            <Typography component="label" sx={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#334155", mb: 0.8, textAlign: "center" }}>
              OTP Verification Code
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1.5,
              }}
              onPaste={handleOtpPaste}
            >
              {otpValues.map((digit, idx) => (
                <TextField
                  key={idx}
                  inputRef={(el) => (inputRefs.current[idx] = el)}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  disabled={loading}
                  variant="outlined"
                  slotProps={{
                    htmlInput: {
                      maxLength: 1,
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      style: {
                        textAlign: "center",
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        color: "#0F172A",
                        padding: "8px 0",
                      },
                    },
                  }}
                  sx={{
                    width: "52px",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      backgroundColor: "#F8FAFC",
                      "& fieldset": { borderColor: digit ? "#2563EB" : "#CBD5E1", borderWidth: digit ? "1.5px" : "1px" },
                      "&:hover fieldset": { borderColor: "#2563EB" },
                      "&.Mui-focused": {
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#2563EB", borderWidth: "2px" },
                        boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)",
                      },
                    },
                  }}
                />
              ))}
            </Box>

            {/* Resend OTP */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.725rem" }}>
                Didn't receive OTP?
              </Typography>
              {canResend ? (
                <Link
                  component="button"
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  underline="hover"
                  sx={{ fontSize: "0.725rem", fontWeight: 600, color: "#2563EB", cursor: "pointer" }}
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </Link>
              ) : (
                <Typography variant="caption" sx={{ fontSize: "0.725rem", fontWeight: 600, color: "#94A3B8" }}>
                  Resend in 00:{timer < 10 ? `0${timer}` : timer}
                </Typography>
              )}
            </Box>
          </Box>

          {/* New Password */}
          <Box sx={{ mb: 1.2 }}>
            <Typography component="label" sx={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#334155", mb: 0.3 }}>
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
                    <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small" sx={{ color: "#64748B", p: 0.5 }}>
                      {showNewPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "7px",
                  backgroundColor: "#F8FAFC",
                  fontSize: "0.85rem",
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&.Mui-focused fieldset": { borderColor: "#2563EB" },
                },
                "& .MuiInputBase-input": { py: 0.8 },
              }}
            />
          </Box>

          {/* Confirm New Password */}
          <Box sx={{ mb: 1.8 }}>
            <Typography component="label" sx={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#334155", mb: 0.3 }}>
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
                    <LockOutlinedIcon sx={{ color: isPasswordMismatch ? "#EF4444" : "#94A3B8", fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" sx={{ color: "#64748B", p: 0.5 }}>
                      {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "7px",
                  backgroundColor: "#F8FAFC",
                  fontSize: "0.85rem",
                  "& fieldset": { borderColor: isPasswordMismatch ? "#EF4444" : "#E2E8F0" },
                  "&.Mui-focused fieldset": { borderColor: isPasswordMismatch ? "#EF4444" : "#2563EB" },
                },
                "& .MuiInputBase-input": { py: 0.8 },
                "& .MuiFormHelperText-root": {
                  color: "#EF4444",
                  fontSize: "0.7rem",
                  mt: 0.3,
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
            sx={{
              py: 0.9,
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "7px",
              "&:hover": {
                backgroundColor: "#1D4ED8",
              },
            }}
          >
            {loading ? <CircularProgress size={18} sx={{ color: "#FFFFFF" }} /> : "Reset Password"}
          </Button>
        </Box>

        <Box sx={{ mt: 1.5, textAlign: "center" }}>
          <Link
            component="button"
            type="button"
            onClick={() => navigate("/")}
            underline="hover"
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#64748B",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              cursor: "pointer",
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 15 }} /> Back to Sign In
          </Link>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: "#F1F5F9" }} />

        {/* SECURITY SSO FOOTER */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, color: "#64748B" }}>
          <ShieldOutlinedIcon sx={{ fontSize: 13, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 500 }}>
            Protected by Enterprise Security Policies
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPassword;