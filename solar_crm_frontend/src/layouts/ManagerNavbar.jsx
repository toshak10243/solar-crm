import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Centralized Auth Hook

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Divider,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

// Material UI Icons
import MenuIcon from "@mui/icons-material/Menu";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

// Manager Dynamic Breadcrumbs and Page Title Mapping
const getManagerPageMetadata = (pathname) => {
  if (pathname.includes("/manager/team") || pathname.includes("/manager/sales-team"))
    return { title: "Sales Team Overview", breadcrumb: "Sales Team" };
  if (pathname.includes("/manager/leads"))
    return { title: "Team Leads Management", breadcrumb: "Team Leads" };
  if (pathname.includes("/manager/followups"))
    return { title: "Team Follow-ups", breadcrumb: "Follow-ups" };
  if (pathname.includes("/manager/site-visits"))
    return { title: "Site Visits Management", breadcrumb: "Site Visits" };
  if (pathname.includes("/manager/reports"))
    return { title: "Performance Reports", breadcrumb: "Reports" };
  if (pathname.includes("/manager/profile"))
    return { title: "Manager Profile", breadcrumb: "Profile" };
  return { title: "Manager Dashboard", breadcrumb: "Dashboard" };
};

const ManagerNavbar = ({ handleDrawerToggle, sidebarWidth = 240, navbarHeight = 64 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Single Source of Truth

  // Component States
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fullName = user?.full_name || user?.name || "Manager";
  const roleName = user?.role_name || user?.role || "Team Manager";

  const getAvatarUrl = (imgPath) => {
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

  const initials = fullName
    ? fullName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "M";

  const pageMeta = getManagerPageMetadata(location.pathname);

  // Date Formatting
  const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = currentTime.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Handle Profile Redirect
  const handleOpenProfileConfirm = () => {
    setProfileDialogOpen(false);
    navigate("/manager/profile");
  };

  const avatarSrc = getAvatarUrl(user?.profile_image);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          color: "#1E293B",
          height: `${navbarHeight}px`,
          justifyContent: "center",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.03)",
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
          {/* LEFT SECTION: Mobile Hamburger, Breadcrumbs & Dynamic Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: "none" }, color: "#0B3A63" }}
            >
              <MenuIcon />
            </IconButton>

            <Box>
              <Breadcrumbs
                separator="›"
                sx={{
                  fontSize: "0.72rem",
                  color: "#64748B",
                  mb: 0.1,
                  "& .MuiBreadcrumbs-separator": { color: "#94A3B8" },
                }}
              >
                <Link
                  underline="hover"
                  color="inherit"
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate("/manager/dashboard")}
                >
                  Manager
                </Link>
                <Typography sx={{ fontSize: "0.72rem", color: "#0284C7", fontWeight: 600 }}>
                  {pageMeta.breadcrumb}
                </Typography>
              </Breadcrumbs>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  color: "#0B3A63",
                  lineHeight: 1.1,
                }}
              >
                {pageMeta.title}
              </Typography>
            </Box>
          </Box>

          {/* CENTER SECTION: Date & Time Widget */}
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "center",
              gap: 1.2,
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              px: 2,
              height: "46px",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)",
            }}
          >
            <AccessTimeOutlinedIcon sx={{ color: "#005BAC", fontSize: "1.25rem", flexShrink: 0 }} />

            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  color: "#64748B",
                  lineHeight: 1.1,
                }}
              >
                <Box component="span" sx={{ color: "#1E293B", fontWeight: 700 }}>
                  {dayName}
                </Box>
                {" • "}
                {formattedDate}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#005BAC",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                  mt: 0.1,
                }}
              >
                {formattedTime}
              </Typography>
            </Box>
          </Box>

          {/* RIGHT SECTION: Profile Area */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
            {/* Profile Trigger Area */}
            <Box
              onClick={() => setProfileDialogOpen(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                p: 0.6,
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Avatar
                key={user?.id || initials}
                src={avatarSrc || undefined}
                imgProps={{
                  onError: (e) => {
                    e.target.style.display = "none";
                  },
                }}
                sx={{
                  width: 34,
                  height: 34,
                  backgroundColor: "#005BAC",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {initials}
              </Avatar>

              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, fontSize: "0.82rem", lineHeight: 1.1, color: "#0F172A" }}
                >
                  {fullName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#0284C7", fontSize: "0.68rem", fontWeight: 600, display: "block" }}
                >
                  {roleName}
                </Typography>
              </Box>

              <KeyboardArrowRightIcon sx={{ color: "#64748B", fontSize: 18 }} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "12px", p: 0.5, minWidth: 320 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "#0B3A63",
            pb: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: "1rem",
          }}
        >
          <AccountCircleOutlinedIcon sx={{ color: "#005BAC", fontSize: "1.3rem" }} />
          Open Manager Profile
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.85rem", color: "#64748B" }}>
            Do you want to view and manage your Manager profile?
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 1.5, gap: 1 }}>
          <Button
            onClick={() => setProfileDialogOpen(false)}
            sx={{ color: "#64748B", fontWeight: 600, textTransform: "none", fontSize: "0.8rem" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleOpenProfileConfirm}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#005BAC",
              "&:hover": { backgroundColor: "#0A6FD8" },
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "6px",
              px: 2,
              fontSize: "0.8rem",
            }}
          >
            Open Profile
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManagerNavbar;