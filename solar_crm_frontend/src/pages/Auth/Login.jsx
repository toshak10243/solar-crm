import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Divider,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  Fade,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

// Image Imports as specified
import logo from "../../assets/images/logo.png";
import loginBanner from "../../assets/images/login-banner.jpg";

const Login = () => {
  const navigate = useNavigate();

  // State Management
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openResetDialog, setOpenResetDialog] = useState(false);

  // Handlers
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleOpenResetDialog = (e) => {
    e.preventDefault();
    setOpenResetDialog(true);
  };

  const handleCloseResetDialog = () => {
    setOpenResetDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        login: identifier,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message);
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
      {/* LEFT SECTION: Enterprise Branding / Hero (Hidden on Mobile) */}
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
        {/* Brand Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, zIndex: 2 }}>
          <Box
            component="img"
            src={logo}
            alt="Enterprise Logo"
            sx={{
              height: { md: 52, lg: 60 },
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Value Proposition Content */}
        <Box sx={{ maxWidth: 520, zIndex: 2, my: "auto" }}>
          <Typography
            variant="caption"
            sx={{
              color: "#38BDF8",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              fontSize: "0.75rem",
            }}
          >
            Next-Gen Operations Platform
          </Typography>

          <Typography
            variant="h3"
            sx={{
              color: "#FFFFFF",
              fontWeight: 700,
              mt: 1.5,
              mb: 2,
              lineHeight: 1.2,
              fontSize: { md: "2rem", lg: "2.5rem" },
            }}
          >
            Empower your sales pipeline with real-time intelligence.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#94A3B8",
              fontSize: "1rem",
              lineHeight: 1.6,
              mb: 4,
            }}
          >
            Manage accounts, track leads, and close deals with enterprise-grade security and automated workflows designed for scale.
          </Typography>

          {/* Key Metrics / Highlights */}
          <Box sx={{ display: "flex", gap: 3, pt: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Box>
              <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                99.99%
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Uptime SLA
              </Typography>
            </Box>

            <Box sx={{ borderLeft: "1px solid rgba(255,255,255,0.1)", pl: 3 }}>
              <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                256-bit
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                AES Encryption
              </Typography>
            </Box>

            <Box sx={{ borderLeft: "1px solid rgba(255,255,255,0.1)", pl: 3 }}>
              <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                SOC2
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Type II Certified
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer / Copyright */}
        <Box sx={{ zIndex: 2 }}>
          <Typography variant="caption" sx={{ color: "#64748B" }}>
            © {new Date().getFullYear()} Solar CRM Inc. All rights reserved. Security & Privacy Policy.
          </Typography>
        </Box>
      </Box>

      {/* RIGHT SECTION: Authenticating Interface */}
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
        {/* Mobile Logo Container */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Enterprise Logo"
            sx={{
              height: 48,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Box>

        <Box sx={{ width: "100%", maxWidth: 400, mx: "auto", my: "auto" }}>
          {/* Header Block */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#0F172A",
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
                letterSpacing: "-0.02em",
                mb: 1,
              }}
            >
              Sign in to platform
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.875rem" }}>
              Please enter your credentials to access your account workspace.
            </Typography>
          </Box>

          {/* Form Alert */}
          {error && (
            <Fade in={Boolean(error)}>
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: "0.85rem" }}>
                {error}
              </Alert>
            </Fade>
          )}

          {/* Credentials Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Username / Email / Mobile Input */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                component="label"
                htmlFor="identifier-input"
                sx={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#334155",
                  mb: 1,
                }}
              >
                Username, Email, or Mobile
              </Typography>
              <TextField
                id="identifier-input"
                fullWidth
                placeholder="name@company.com or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    fontSize: "0.9375rem",
                    transition: "all 0.2s ease",
                    "& fieldset": {
                      borderColor: "#E2E8F0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#CBD5E1",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "#FFFFFF",
                      "& fieldset": {
                        borderColor: "#2563EB",
                        borderWidth: "1px",
                      },
                      boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
                    },
                  },
                  "& .MuiInputBase-input": {
                    py: 1.5,
                  },
                }}
              />
            </Box>

            {/* Password Input */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography
                  component="label"
                  htmlFor="password-input"
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  Password
                </Typography>
                <Link
                  component="button"
                  type="button"
                  onClick={handleOpenResetDialog}
                  underline="hover"
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#2563EB",
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <TextField
                id="password-input"
                fullWidth
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                        size="small"
                        sx={{ color: "#64748B" }}
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 18 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    fontSize: "0.9375rem",
                    transition: "all 0.2s ease",
                    "& fieldset": {
                      borderColor: "#E2E8F0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#CBD5E1",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "#FFFFFF",
                      "& fieldset": {
                        borderColor: "#2563EB",
                        borderWidth: "1px",
                      },
                      boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
                    },
                  },
                  "& .MuiInputBase-input": {
                    py: 1.5,
                  },
                }}
              />
            </Box>

            {/* Remember Me Option */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{
                      color: "#CBD5E1",
                      "&.Mui-checked": {
                        color: "#2563EB",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                    Keep me signed in on this device
                  </Typography>
                }
              />
            </Box>

            {/* Submit Action */}
            <Button
              type="submit"
              fullWidth
              disabled={loading}
              variant="contained"
              disableElevation
              sx={{
                py: 1.5,
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontSize: "0.9375rem",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#1D4ED8",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                },
                "&:active": {
                  backgroundColor: "#1E40AF",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: "#FFFFFF" }} />
              ) : (
                "Authenticate Account"
              )}
            </Button>
          </Box>

          <Divider sx={{ my: 4, borderColor: "#F1F5F9" }} />

          {/* SSO / Enterprise Notice Footer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              color: "#64748B",
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
              Protected by Enterprise Single Sign-On (SSO) Policy
            </Typography>
          </Box>
        </Box>

        {/* Mobile Bottom Footer */}
        <Box sx={{ display: { xs: "block", md: "none" }, pt: 4, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "#94A3B8" }}>
            © {new Date().getFullYear()} Solar CRM Inc.
          </Typography>
        </Box>
      </Box>

      {/* Forgot Password Material-UI Dialog */}
      <Dialog
        open={openResetDialog}
        onClose={handleCloseResetDialog}
        aria-labelledby="password-reset-dialog-title"
        aria-describedby="password-reset-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: "12px",
            p: 1,
            maxWidth: "420px",
            width: "100%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        <DialogTitle id="password-reset-dialog-title" sx={{ pb: 1, pt: 2, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A", fontSize: "1.125rem" }}>
            Password Reset
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <DialogContentText
            id="password-reset-dialog-description"
            sx={{ color: "#475569", fontSize: "0.9375rem", lineHeight: 1.5 }}
          >
            Please contact the Super Administrator to reset your password.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button
            onClick={handleCloseResetDialog}
            variant="contained"
            disableElevation
            autoFocus
            sx={{
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "6px",
              px: 3,
              py: 0.8,
              fontSize: "0.875rem",
              "&:hover": {
                backgroundColor: "#1D4ED8",
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;