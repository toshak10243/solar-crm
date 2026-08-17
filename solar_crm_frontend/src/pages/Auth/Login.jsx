import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

import {
  Box,
  Typography,
  OutlinedInput,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  Fade,
  Paper,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AndroidIcon from "@mui/icons-material/Android";
import GetAppRoundedIcon from "@mui/icons-material/GetAppRounded";

// Image Imports
import logo from "../../assets/images/logo.png";
import loginBanner from "../../assets/images/login-banner.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { login, user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      const userRole = (user?.role_name || user?.role || "").toLowerCase();

      if (userRole.includes("manager")) {
        navigate("/manager/dashboard", { replace: true });
      } else if (userRole.includes("sales")) {
        navigate("/sales/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [token, user, navigate]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    navigate("/forgot-password");
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

      const userData = response.data.user;
      const authToken = response.data.token;

      login(userData, authToken);
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || "Invalid credentials.");
      } else {
        setError("Server not responding. Please check backend network.");
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
            Sign in to platform
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.82rem", mt: 0.4 }}>
            Enter your credentials to access workspace.
          </Typography>
        </Box>

        {error && (
          <Fade in={Boolean(error)}>
            <Alert severity="error" sx={{ mb: 1.8, py: 0.3, px: 1.2, borderRadius: 1.5, fontSize: "0.8rem" }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* LOGIN FORM */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* USERNAME / EMAIL / PHONE */}
          <Box sx={{ mb: 1.5 }}>
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
            <OutlinedInput
              id="identifier-input"
              fullWidth
              placeholder="name@company.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              startAdornment={
                <InputAdornment position="start">
                  <PersonOutlineOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                </InputAdornment>
              }
              sx={{
                borderRadius: "7px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.88rem",
                height: "42px",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: "#2563EB" },
                },
              }}
            />
          </Box>

          {/* PASSWORD FIELD WITH GUARANTEED EYE ICON */}
          <Box sx={{ mb: 1.2 }}>
            <Typography
              component="label"
              htmlFor="password-input"
              sx={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#334155",
                mb: 0.4,
              }}
            >
              Password
            </Typography>

            <OutlinedInput
              id="password-input"
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              startAdornment={
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    size="small"
                    sx={{ color: "#64748B", mr: 0.2 }}
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: 20, color: "#2563EB" }} />
                    ) : (
                      <Visibility sx={{ fontSize: 20, color: "#94A3B8" }} />
                    )}
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                borderRadius: "7px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.88rem",
                height: "42px",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: "#2563EB" },
                },
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
              <Link
                component="button"
                type="button"
                onClick={handleForgotPasswordClick}
                underline="hover"
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#2563EB",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </Link>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1.8 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  sx={{
                    p: 0.5,
                    color: "#CBD5E1",
                    "&.Mui-checked": { color: "#2563EB" },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: "0.8rem", color: "#475569", fontWeight: 500 }}>
                  Keep me signed in
                </Typography>
              }
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            variant="contained"
            disableElevation
            sx={{
              py: 1.1,
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
            {loading ? <CircularProgress size={20} sx={{ color: "#FFFFFF" }} /> : "Authenticate Account"}
          </Button>
        </Box>

        {/* ANDROID APP DOWNLOAD CARD */}
        <Paper
          elevation={0}
          sx={{
            mt: 1.8,
            p: 1.2,
            borderRadius: "10px",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "7px",
                backgroundColor: "#DCFCE7",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AndroidIcon sx={{ fontSize: 18 }} />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "#0F172A", lineHeight: 1.1 }}>
                Android App
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem", display: "block" }}>
                Get mobile version
              </Typography>
            </Box>
          </Box>

          <Button
            component="a"
            href="/solar_crm.apk"
            download="solar_crm.apk"
            variant="outlined"
            size="small"
            startIcon={<GetAppRoundedIcon sx={{ fontSize: "15px !important" }} />}
            sx={{
              borderRadius: "7px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.725rem",
              borderColor: "#CBD5E1",
              color: "#0F172A",
              backgroundColor: "#FFFFFF",
              px: 1.2,
              py: 0.4,
              minWidth: "auto",
              "&:hover": {
                borderColor: "#16A34A",
                backgroundColor: "#16A34A",
                color: "#FFFFFF",
              },
            }}
          >
            Download
          </Button>
        </Paper>

        <Divider sx={{ my: 1.8, borderColor: "#F1F5F9" }} />

        {/* SECURITY SSO FOOTER */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, color: "#64748B" }}>
          <ShieldOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontSize: "0.725rem", fontWeight: 500 }}>
            Protected by Enterprise SSO Policy
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;