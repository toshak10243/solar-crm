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
  Paper,
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
        overflow: "hidden", // Completely disables scrolling
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

      {/* OPTIMIZED CENTERED FORGOT PASSWORD CARD */}
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
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.8 }}>
          <Box
            component="img"
            src={logo}
            alt="Enterprise Logo"
            sx={{
              height: 42,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* HEADER */}
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.02em",
              fontSize: "1.25rem",
              lineHeight: 1.2,
            }}
          >
            Forgot Password?
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.82rem", mt: 0.4 }}>
            Enter your details below to receive an OTP.
          </Typography>
        </Box>

        {error && (
          <Fade in={Boolean(error)}>
            <Alert severity="error" sx={{ mb: 1.8, py: 0.3, px: 1.2, borderRadius: 1.5, fontSize: "0.8rem" }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* FORGOT PASSWORD FORM */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ mb: 1.8 }}>
            <Typography
              component="label"
              htmlFor="identifier-input"
              sx={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#334155",
                mb: 0.4,
              }}
            >
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
                    <PersonOutlineOutlinedIcon sx={{ color: "#94A3B8", fontSize: 19 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "7px",
                  backgroundColor: "#F8FAFC",
                  fontSize: "0.88rem",
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused": {
                    backgroundColor: "#FFFFFF",
                    "& fieldset": { borderColor: "#2563EB" },
                  },
                },
                "& .MuiInputBase-input": { py: 1 },
              }}
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            variant="contained"
            disableElevation
            sx={{
              py: 1,
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontSize: "0.88rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "7px",
              "&:hover": {
                backgroundColor: "#1D4ED8",
              },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "#FFFFFF" }} /> : "Send OTP"}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link
            component="button"
            type="button"
            onClick={() => navigate("/")}
            underline="hover"
            sx={{
              fontSize: "0.8rem",
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

        <Divider sx={{ my: 1.8, borderColor: "#F1F5F9" }} />

        {/* SECURITY SSO FOOTER */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, color: "#64748B" }}>
          <ShieldOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontSize: "0.725rem", fontWeight: 500 }}>
            Protected by Enterprise Security Policies
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;