import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import { isLoggedIn } from "../../utils/auth";

import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Divider,
  Alert,
  Fade,
  Link,
  Snackbar,
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

import logo from "../../assets/images/logo.png";
import loginBanner from "../../assets/images/login-banner.jpg";

const ForgotPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Snackbar States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your Username, Email, or Mobile Number.");
      return;
    }

    try {
      setLoading(true);

      const res = await forgotPassword({
        login: identifier,
      });

      // Save in sessionStorage to prevent loss on page refresh
      sessionStorage.setItem("reset_login", identifier);

      // Toast Success
      setToastMsg(res.data.message || "OTP sent successfully to your registered email.");
      setToastOpen(true);

      // 1 Second Delay before redirect
      setTimeout(() => {
        navigate("/reset-password", {
          state: { login: identifier },
        });
      }, 1000);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Failed to send reset code.");
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
      {/* Toast Notification */}
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

      {/* LEFT Enterprise Section */}
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
            Account Recovery
          </Typography>
          <Typography variant="h3" sx={{ color: "#FFFFFF", fontWeight: 700, mt: 1.5, mb: 2, lineHeight: 1.2 }}>
            Secure, fast, and automated password recovery.
          </Typography>
          <Typography variant="body1" sx={{ color: "#94A3B8", lineHeight: 1.6, mb: 4 }}>
            Enter your registered account identifier to receive an OTP verification code.
          </Typography>
        </Box>

        <Box sx={{ zIndex: 2 }}>
          <Typography variant="caption" sx={{ color: "#64748B" }}>
            © {new Date().getFullYear()} Solar CRM Inc. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* RIGHT Form Section */}
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
              Forgot Password?
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Enter your Username, Email, or Mobile number below to receive an OTP.
            </Typography>
          </Box>

          {error && (
            <Fade in={Boolean(error)}>
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box sx={{ mb: 3 }}>
              <Typography component="label" sx={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", mb: 1 }}>
                Username, Email, or Mobile
              </Typography>
              <TextField
                id="identifier-input"
                fullWidth
                placeholder="Enter your account identifier"
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
                    "& fieldset": { borderColor: "#E2E8F0" },
                    "&.Mui-focused fieldset": { borderColor: "#2563EB" },
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              variant="contained"
              disableElevation
              sx={{ py: 1.5, backgroundColor: "#2563EB", fontWeight: 600, borderRadius: "8px", textTransform: "none" }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#FFFFFF" }} /> : "Send OTP"}
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

export default ForgotPassword;